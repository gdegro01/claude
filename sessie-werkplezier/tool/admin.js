/* De regie. Scherm bedienen, delen openen en vrijgeven, en per deel live
   zien wie wat antwoordde. De voorbeelden van slides gebruiken dezelfde
   renderer als het scherm (deck.js). Opbouw zoals sessie 4. */
(function(){
'use strict';
const $ = id => document.getElementById(id);
const esc = MWDeck.esc;
const DEELNAAM = {d1:'Deel 1 · eigen idee', d2:'Deel 2 · verdelen', d3:'Deel 3 · aanpakken', d4:'Deel 4 · hoeken'};
const KANT = ['links, sterk','links','links, licht','rechts, licht','rechts','rechts, sterk'];

let R = null;   /* laatste antwoord van api.php?a=regie */

/* ── Hulp ── */
let mT;
function meld(t, fout){ const m = $('melding'); m.textContent = t; m.className = 'melding aan' + (fout ? ' fout' : ''); clearTimeout(mT); mT = setTimeout(() => m.className = 'melding', 2600); }
async function doe(body){
  const r = await fetch('api.php?a=regie', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)});
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.ok){ meld('Niet gelukt: ' + (d.fout || r.status), true); throw new Error(d.fout || 'fout'); }
  return d;
}
const euro = n => '€' + Number(n || 0).toLocaleString('nl-NL');
const pct = (a, b) => b ? Math.round(100 * a / b) + '%' : '·';
const catVan = id => (R.categorieen.find(c => c.id === id) || {});
const apVan = id => (R.aanpakken.find(a => a.id === id) || {});

/* Een vak alleen opnieuw vullen als er iets veranderde, en niet terwijl er getypt wordt. */
function vul(vak, html){
  if (!vak || vak.dataset.k === html) return;
  if (vak.contains(document.activeElement) && document.activeElement.matches('input,textarea,select')) return;
  vak.innerHTML = html; vak.dataset.k = html;
}

/* Een slide als voorbeeld tekenen, geschaald naar de breedte van het vak. */
function voorbeeld(vak, slide, pos, total){
  const mini = vak.querySelector('.mini');
  const sleutel = JSON.stringify([slide, pos, total]);
  if (mini.dataset.k === sleutel){ schaalVak(vak); return; }
  mini.dataset.k = sleutel;
  if (!slide){ mini.innerHTML = ''; return; }
  mini.innerHTML = MWDeck.html(slide, pos, total);
  schaalVak(vak);
  MWDeck.fit(mini.querySelector('.slide'));
}
function schaalVak(vak){ const m = vak.querySelector('.mini'); m.style.transform = `scale(${vak.clientWidth/1920})`; }
const ro = new ResizeObserver(es => es.forEach(e => schaalVak(e.target)));
document.querySelectorAll('.pv').forEach(v => ro.observe(v));

/* ── Tabs ── */
let tab = 'sessie';
try { const t = sessionStorage.getItem('mw-wp-tab'); if (t && $('tab-' + t)) tab = t; } catch(e){}
function toonTab(t){
  tab = t;
  try { sessionStorage.setItem('mw-wp-tab', t); } catch(e){}
  document.querySelectorAll('.tabs [data-tab]').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === t ? 'true' : 'false'));
  document.querySelectorAll('.tab').forEach(s => s.hidden = s.id !== 'tab-' + t);
  if (t === 'ins') vulInstellingen(true);
  if (R) teken();
  document.querySelectorAll('.pv').forEach(schaalVak);
}
document.querySelectorAll('.tabs [data-tab]').forEach(b => b.addEventListener('click', () => toonTab(b.dataset.tab)));

async function poll(){
  try{ R = await (await fetch('api.php?a=regie', {cache:'no-store'})).json(); teken(); }catch(e){}
}

function teken(){
  const st = R.stand;
  const h = R.slides[R.pos - 1] || {};
  $('balk-nu').textContent = `${R.pos} / ${R.slides.length} · ${h.naam || ''}`;
  /* Bovenin, op elk tabblad: wat er openstaat. */
  let vs;
  if (st.open){
    const extra = st.open === 'd4' && st.hoek ? ` · ${hoekKort(st.hoek)}` : '';
    vs = `<span class="vs open"><i></i>${esc(DEELNAAM[st.open])}${esc(extra)} staat open · ${klaarTel(st.open)}</span><button type="button" class="knop gevaar" data-open="">■ Sluiten</button>`;
  } else if (h.deel && h.deel !== 'd4' && h.type !== 'ideeen' && h.type !== 'verdeling'){
    vs = `<span class="vs dicht"><i></i>${esc(DEELNAAM[h.deel])} is dicht</span><button type="button" class="knop prim" data-open="${h.deel}">▶ Open ${h.deel}</button>`;
  } else vs = `<span class="vs">Niets open op de telefoons</span>`;
  vul($('vl-status'), vs);
  document.body.classList.toggle('vl-open', !!st.open);

  if (tab === 'sessie') tekenSessie(h);
  if (tab === 'd1') vul($('v-d1'), viewD1());
  if (tab === 'd2') vul($('v-d2'), viewD2());
  if (tab === 'd3') vul($('v-d3'), viewD3());
  if (tab === 'd4') vul($('v-d4'), viewD4());
  if (tab === 'zd') vul($('v-zd'), viewZD());
  if (tab === 'ins'){ vulInstellingen(false); vul($('v-cats'), viewCats()); }
}

/* Hoeveel echte deelnemers het open deel af hebben. */
function klaarTel(deel){
  const v = Object.values(R.voortgang);
  const n = deel === 'd1' ? v.filter(x => x.d1).length : deel === 'd2' ? v.filter(x => x.d2).length
          : deel === 'd3' ? v.filter(x => x.d3 !== null).length : v.filter(x => x.hoek).length;
  return `${n} van ${R.deelnemers.length} binnen`;
}
const hoekKort = id => { const x = R.d4.find(h => h.id === id); return x ? `${x.links} ↔ ${x.rechts}` : id; };

/* ════════════════════════ Sessie ════════════════════════ */

function tekenSessie(h){
  voorbeeld($('pv-nu'), R.live, R.pos, R.slides.length);
  voorbeeld($('pv-volgend'), R.volgend, R.pos + 1, R.slides.length);
  $('notitie').textContent = h.notitie || '';
  const sp = $('spring');
  const opts = R.slides.map((s, i) => `<option value="${esc(s.id)}">${i + 1} · ${esc(s.naam)}</option>`).join('');
  if (sp.dataset.k !== opts){ sp.innerHTML = opts; sp.dataset.k = opts; }
  if (document.activeElement !== sp) sp.value = h.id;

  /* Het paneel onder de slide: de bediening en de live stand van dit deel. */
  let p = '';
  if (h.deel === 'd1') p = bediening('d1') + viewD1();
  else if (h.deel === 'd2') p = bediening('d2') + viewD2(true);
  else if (h.deel === 'd3') p = bediening('d3') + viewD3(true);
  else if (h.deel === 'd4') p = viewD4(true);
  vul($('paneel'), p);

  vul($('delen'), ['d1','d2','d3'].map(d => `<div class="dl ${R.stand.open === d ? 'open' : ''}"><span class="t">${esc(DEELNAAM[d])}<small>${R.stand.open === d ? 'staat open · ' + klaarTel(d) : (R.stand.geopend[d] ? 'was open' : 'nog niet open')}</small></span>
      ${R.stand.open === d ? `<button type="button" class="knop gevaar" data-open="">■ Sluit</button>` : `<button type="button" class="knop" data-open="${d}">▶ Open</button>`}
      ${vrijKnop(d)}</div>`).join('')
    + `<div class="dl ${R.stand.open === 'd4' ? 'open' : ''}"><span class="t">${esc(DEELNAAM.d4)}<small>${R.stand.open === 'd4' ? 'open: ' + esc(hoekKort(R.stand.hoek)) : 'open een hoek bij deel 4'}</small></span>
      ${R.stand.open === 'd4' ? `<button type="button" class="knop gevaar" data-open="">■ Sluit</button>` : `<button type="button" class="knop" data-ga="d4">Naar hoeken</button>`}</div>`);

  /* Wie doet mee: groen is verbonden, oranje was er maar is weg. Met de voortgang per deel. */
  const v = R.voortgang;
  const regel = n => { const a = R.aanwezig[n], x = v[n];
    const st = !a ? 'nee' : a.sec < 10 ? 'aan' : 'weg';
    if (!x) return `<tr class="${st}"><td><i></i>${esc(n)} <small>test</small></td><td>${a ? (a.taal || '').toUpperCase() : ''}</td><td colspan="4"></td></tr>`;
    return `<tr class="${st}"><td><i></i>${esc(n)}</td><td>${a ? (a.taal || '').toUpperCase() : ''}</td>
      <td class="${x.d1 ? 'k' : ''}">${x.d1 || '·'}</td><td class="${x.d2 ? 'k' : ''}">${x.d2 ? '✓' + (x.d2v ? '+' : '') : '·'}</td>
      <td class="${x.d3 !== null ? 'k' : ''}">${x.d3 !== null ? x.d3 : '·'}</td><td class="${x.d4_van && x.d4 === x.d4_van ? 'k' : ''}">${x.d4_van ? x.d4 + '/' + x.d4_van : '·'}</td></tr>`; };
  const testers = R.testers.filter(n => R.aanwezig[n]);
  vul($('mensen'), `<table class="mt"><thead><tr><th>Naam</th><th></th><th title="aantal ideeën">D1</th><th title="verdeling verstuurd, + = ook de waaromvraag">D2</th><th title="aantal aanpakken">D3</th><th title="beantwoord van de geopende hoeken">D4</th></tr></thead>
    <tbody>${R.deelnemers.concat(testers).map(regel).join('')}</tbody></table>
    <p class="klein">Groen: verbonden. Oranje: was er, nu weg. D1: ideeën. D2: ✓ verdeeld, + ook de waaromvraag. D3: aanpakken gekozen. D4: hoeken beantwoord.</p>`);
}

function vrijKnop(wat){
  const aan = !!R.stand.vrij[wat];
  return `<button type="button" class="knop ${aan ? 'aan' : ''}" data-vrij="${wat}" data-aan="${aan ? '' : '1'}">${aan ? '✓ Vrijgegeven' : 'Vrijgeven'}</button>`;
}
function bediening(d){
  const open = R.stand.open === d;
  const uit = {d1:'d1-uit', d2:'d2-uit', d3:'d3'}[d];
  return `<div class="starthier ${open ? 'loopt' : ''}"><span>${open ? `<i></i><b>${esc(DEELNAAM[d])} staat open.</b> ${klaarTel(d)}.` : `<b>${esc(DEELNAAM[d])} is dicht.</b> De telefoons tonen een wachtscherm.`}</span>
    <span class="rij">${open ? `<button type="button" class="knop gevaar" data-open="">■ Sluit ${d}</button>` : `<button type="button" class="knop prim groot2" data-open="${d}">▶ Open ${d}</button>`}
    ${vrijKnop(d)}${R.slides[R.pos - 1].id !== uit ? `<button type="button" class="knop" data-ga="${uit}">Uitkomst op scherm</button>` : ''}</span></div>`;
}

$('vorige').addEventListener('click', () => doe({actie:'stap', richting:-1}).then(poll));
$('volgende').addEventListener('click', () => doe({actie:'stap', richting:1}).then(poll));
$('spring').addEventListener('change', e => doe({actie:'ga', slide:e.target.value}).then(poll));
document.addEventListener('keydown', e => {
  if (tab !== 'sessie' || e.target.closest('input,textarea,select')) return;
  if (e.key === 'ArrowRight' || e.key === 'PageDown'){ e.preventDefault(); doe({actie:'stap', richting:1}).then(poll); }
  if (e.key === 'ArrowLeft' || e.key === 'PageUp'){ e.preventDefault(); doe({actie:'stap', richting:-1}).then(poll); }
});

/* ════════════════════════ Deel 1 ════════════════════════ */

let nieuwVoor = null;   /* het idee waarvoor het formulier voor een nieuwe categorie openstaat */
function viewD1(){
  const slot = R.slot.koppelen;
  const opties = sel => `<option value="">· geen categorie</option>` + R.categorieen.map(c => `<option value="${c.id}" ${sel === c.id ? 'selected' : ''}>${esc(c.nl)}${c.eigen ? ' (nieuw)' : ''}</option>`).join('');
  const rijen = R.d1.map(it => `<tr><td class="n">${esc(it.naam)}</td><td class="idee">${esc(it.tekst)}</td>
      <td><select data-koppel="${esc(it.sleutel)}" ${slot ? 'disabled' : ''}>${opties(it.cat)}</select></td>
      <td>${slot ? '' : `<button type="button" class="knop" data-nieuwvoor="${esc(it.sleutel)}">+ Nieuwe categorie</button>`}</td></tr>
      ${nieuwVoor === it.sleutel ? `<tr class="nieuwcat"><td></td><td colspan="3">${catForm(it.tekst, it.sleutel)}</td></tr>` : ''}`).join('');
  const n = new Set(R.d1.map(x => x.naam)).size;
  return `<div class="kaart breed"><div class="rij tussen"><p class="over">Deel 1 · ${R.d1.length} ideeën van ${n} mensen</p>
      ${slot ? '<span class="badge grijs">Deel 2 is open geweest: koppelen ligt vast</span>' : '<span class="klein">Koppelen en nieuwe categorieën kan tot deel 2 opengaat.</span>'}</div>
    ${R.d1.length ? `<table class="dt"><thead><tr><th>Naam</th><th>Idee</th><th>Categorie</th><th></th></tr></thead><tbody>${rijen}</tbody></table>` : '<p class="klein">Nog geen ideeën.</p>'}</div>`;
}
function catForm(tekst, sleutel){
  return `<div class="catform" data-form="${esc(sleutel || '')}">
    <div class="velden vier"><div class="veld breed2"><label>Categorie (NL)</label><input type="text" data-f="nl" value="${esc(tekst || '')}" maxlength="120"></div>
    <div class="veld breed2"><label>Categorie (EN)</label><input type="text" data-f="en" maxlength="120" placeholder="Engelse tekst"></div>
    <div class="veld"><label>Voor wie</label><select data-f="voor"><option value="">kies</option><option value="mezelf">mezelf</option><option value="samen">samen</option></select></div>
    <div class="veld"><label>Vorm</label><select data-f="vorm"><option value="">kies</option><option value="eenmalig">eenmalig</option><option value="blijvend">blijvend</option><option value="doorlopend">doorlopend</option></select></div></div>
    <div class="rij"><button type="button" class="knop prim" data-maakcat="${esc(sleutel || '')}">Categorie toevoegen aan deel 2</button><button type="button" class="knop" data-nieuwvoor="">Annuleren</button></div></div>`;
}
document.addEventListener('change', e => {
  const s = e.target.closest('[data-koppel]');
  if (s) doe({actie:'koppel', idee:s.dataset.koppel, cat:s.value || null}).then(() => { meld('Gekoppeld'); poll(); }).catch(poll);
});

/* ════════════════════════ Deel 2 ════════════════════════ */

function stippen(bedragen, stappen, stap){
  const cel = Array.from({length:stappen}, () => []);
  bedragen.forEach(x => { const i = Math.min(stappen, Math.round(x.b / stap)) - 1; if (i >= 0) cel[i].push(x.naam + ' ' + euro(x.b)); });
  return `<span class="stip">${cel.map((n, i) => `<span title="${esc(euro((i + 1) * stap))}${n.length ? ': ' + esc(n.join(', ')) : ''}">${'<i></i>'.repeat(n.length)}</span>`).join('')}</span>`;
}
function viewD2(kort){
  const a = R.d2, ins = R.instellingen;
  const tot = a.voor.mezelf + a.voor.samen;
  const vormTot = a.vorm.eenmalig + a.vorm.blijvend + a.vorm.doorlopend;
  const stappen = Math.round(ins.bedrag / ins.stap);
  let html = `<div class="kaart breed"><div class="rij tussen"><p class="over">Deel 2 · ${a.verstuurd} van ${R.deelnemers.length} verdeeld · ${euro(tot)} in totaal</p>
    ${a.oud_bedrag ? `<span class="badge">${a.oud_bedrag} verdeling(en) met een ander bedrag</span>` : ''}</div>
    <div class="kerncijfers">
      <div><i>Mezelf</i><b>${pct(a.voor.mezelf, tot)}</b><span>${euro(a.voor.mezelf)}</span></div>
      <div><i>Samen</i><b>${pct(a.voor.samen, tot)}</b><span>${euro(a.voor.samen)}</span></div>
      <div class="sep"></div>
      <div><i>Eenmalig</i><b>${pct(a.vorm.eenmalig, vormTot)}</b><span>${euro(a.vorm.eenmalig)}</span></div>
      <div><i>Blijvend</i><b>${pct(a.vorm.blijvend, vormTot)}</b><span>${euro(a.vorm.blijvend)}</span></div>
      <div><i>Doorlopend</i><b>${pct(a.vorm.doorlopend, vormTot)}</b><span>${euro(a.vorm.doorlopend)}</span></div>
    </div>
    <table class="dt"><thead><tr><th>Categorie</th><th>Voor wie</th><th>Vorm</th><th class="r">Totaal</th><th class="r">Mensen</th><th>Bedrag per persoon · ${euro(ins.stap)} tot ${euro(ins.bedrag)}</th></tr></thead><tbody>
    ${a.categorieen.map(c => `<tr class="${c.totaal ? '' : 'leeg'}"><td>${esc(c.nl)}${c.eigen ? ' <span class="badge grijs">uit deel 1</span>' : ''}</td><td>${c.voor}</td><td>${c.vorm}</td>
      <td class="r b">${euro(c.totaal)}</td><td class="r">${c.n}</td><td>${stippen(c.bedragen, stappen, ins.stap)}</td></tr>`).join('')}</tbody></table></div>`;
  html += `<div class="kaart breed"><p class="over">Wat het verandert · ${a.personen.filter(p => p.verander).length} antwoorden</p>
    ${a.personen.filter(p => p.verander).map(p => `<div class="citaat"><b>${esc(p.naam)}</b><span class="klein">${esc(catVan(p.verander.cat).nl || '')}</span><p>${esc(p.verander.tekst)}</p></div>`).join('') || '<p class="klein">Nog geen antwoorden.</p>'}</div>`;
  if (kort) return html;
  html += `<div class="kaart breed"><p class="over">Per persoon · eigen verdeling</p><table class="dt"><thead><tr><th>Naam</th><th class="r">Categorieën</th><th>Verdeling</th></tr></thead><tbody>
    ${a.personen.map(p => `<tr><td class="n">${esc(p.naam)}</td><td class="r b">${p.ncat}</td><td>${Object.entries(p.verdeling).sort((x, y) => y[1] - x[1]).map(([cid, b]) =>
      `<span class="chip ${catVan(cid).voor === 'samen' ? 'samen' : ''}">${esc(catVan(cid).nl || cid)} <b>${euro(b)}</b></span>`).join(' ')}</td></tr>`).join('')}</tbody></table></div>`;
  return html;
}

/* ════════════════════════ Deel 3 ════════════════════════ */

function viewD3(kort){
  const a = R.d3;
  const lijst = a.aanpakken.slice().sort((x, y) => y.n - x.n);
  const det = R.stand.detail;
  let html = `<div class="kaart breed"><div class="rij tussen"><p class="over">Deel 3 · keuzes per aanpak</p>
    ${det ? `<span class="rij"><span class="klein">Op het scherm: detail van ${esc(apVan(det).naam)}</span><button type="button" class="knop" data-detail="">Detail sluiten</button></span>` : ''}</div>
    <table class="dt"><thead><tr><th>Aanpak</th><th class="r">Keuzes</th><th>Wie</th><th></th></tr></thead><tbody>
    ${lijst.map(x => `<tr><td><b>${esc(x.naam)}</b> <span class="badge grijs">${esc(apVan(x.id).richting)}</span></td><td class="r b">${x.n}</td><td class="klein">${esc(x.namen.join(', '))}</td>
      <td><button type="button" class="knop ${det === x.id ? 'aan' : ''}" data-detail="${det === x.id ? '' : x.id}">${det === x.id ? '✓ Detail op scherm' : 'Detail op scherm'}</button></td></tr>`).join('')}</tbody></table></div>
    <div class="kaart breed"><p class="over">Waarom · ${a.waarom.length} regels</p>
    ${a.waarom.length ? `<table class="dt"><tbody>${a.waarom.map(w => `<tr><td class="n">${esc(w.naam)}</td><td class="klein">${esc(apVan(w.aanpak).naam)}</td><td>${esc(w.tekst)}</td></tr>`).join('')}</tbody></table>` : '<p class="klein">Nog geen regels.</p>'}</div>`;
  if (det) html = `<div class="kaart breed detailkaart"><p class="over">Toelichting bij ${esc(apVan(det).naam)} · ${esc(apVan(det).bewijs)}</p><p><b>Wie:</b> ${esc(apVan(det).wie)}</p><p><b>Opbrengst:</b> ${esc(apVan(det).opbrengst)}</p></div>` + html;
  return html;
}

/* ════════════════════════ Deel 4 ════════════════════════ */

function hoekStippen(d){
  const cel = Array.from({length:6}, () => []);
  d.forEach(x => cel[x.w].push(x.naam));
  return `<span class="stip zes">${cel.map((n, i) => `<span class="${i < 3 ? 'l' : 'r'}" title="${esc(KANT[i])}${n.length ? ': ' + esc(n.join(', ')) : ''}">${'<i></i>'.repeat(n.length)}</span>`).join('')}</span>`;
}
function viewD4(kort){
  const st = R.stand;
  const rij = h => { const open = st.open === 'd4' && st.hoek === h.id, scherm = (st.hoek_scherm || st.hoek) === h.id;
    return `<tr class="${open ? 'open' : ''}"><td class="hl">${esc(h.links)}</td><td>${hoekStippen(h.d)}<div class="lr"><span>${h.nl} links</span><span>${h.nr} rechts</span></div></td><td class="hr">${esc(h.rechts)}</td>
      <td class="acties">${open ? `<span class="badge groen">open</span>` : `<button type="button" class="knop prim" data-hoek="${h.id}">▶ Open</button>`}
      <button type="button" class="knop ${scherm && R.slides[R.pos - 1].id === 'd4' ? 'aan' : ''}" data-hoekscherm="${h.id}">Op scherm</button>${vrijKnop(h.id)}</td></tr>`; };
  const r1 = R.d4.filter(h => h.ronde === 1), r2 = R.d4.filter(h => h.ronde !== 1);
  let html = `<div class="kaart breed"><div class="rij tussen"><p class="over">Deel 4 · hoeken, één tegelijk open</p>
    ${st.open === 'd4' ? `<button type="button" class="knop gevaar" data-open="">■ Sluit deel 4</button>` : ''}</div>
    <table class="dt hoeken"><thead><tr><th>Links</th><th>Stippen · ${R.deelnemers.length} mensen</th><th>Rechts</th><th></th></tr></thead>
    <tbody><tr class="kopr"><td colspan="4">Ronde 1</td></tr>${r1.map(rij).join('')}
    <tr class="kopr"><td colspan="4">Ronde 2 · voorraad</td></tr>${r2.map(rij).join('')}</tbody></table></div>`;
  html += `<div class="kaart breed"><p class="over">Nieuw paar hoeken · komt in de voorraad, daarna kun je het openen</p>
    <div class="velden vier" id="nh"><div class="veld breed2"><label>Links (NL)</label><input type="text" data-nh="ln" maxlength="160"></div>
    <div class="veld breed2"><label>Rechts (NL)</label><input type="text" data-nh="rn" maxlength="160"></div>
    <div class="veld breed2"><label>Links (EN)</label><input type="text" data-nh="le" maxlength="160"></div>
    <div class="veld breed2"><label>Rechts (EN)</label><input type="text" data-nh="re" maxlength="160"></div></div>
    <div class="rij"><button type="button" class="knop" id="nh-maak">+ Toevoegen</button><button type="button" class="knop prim" id="nh-open">+ Toevoegen en meteen openen</button>
    <span class="klein">Geen gedachtestreepjes of woorden als nooit, altijd, niemand of iedereen.</span></div></div>`;
  return html;
}

/* ════════════════════════ Zei tegenover deed ════════════════════════ */

function viewZD(){
  const rijen = R.zeideed.map(p => {
    const samen = p.totaal ? p.samen / p.totaal : null;
    const eb = p.eenmalig + p.blijvend;
    const blijf = p.totaal && eb ? p.blijvend / eb : null;
    /* Wijkt de kant af van waar het meeste geld heen ging? Alleen een markering, geen oordeel. */
    const af1 = p.h1 !== null && samen !== null && samen !== .5 && (p.h1 >= 3) !== (samen > .5);
    const af2 = p.h2 !== null && blijf !== null && blijf !== .5 && (p.h2 >= 3) !== (blijf > .5);
    return `<tr><td class="n">${esc(p.naam)}</td>
      <td class="${af1 ? 'af' : ''}">${p.h1 !== null ? esc(KANT[p.h1]) : '·'}</td>
      <td class="${af1 ? 'af' : ''}">${samen !== null ? `${balkje(samen)} ${pct(p.samen, p.totaal)} samen` : '·'}</td>
      <td class="${af2 ? 'af' : ''}">${p.h2 !== null ? esc(KANT[p.h2]) : '·'}</td>
      <td class="${af2 ? 'af' : ''}">${p.totaal ? `${euro(p.eenmalig)} : ${euro(p.blijvend)}${eb ? ' · ' + pct(p.blijvend, eb) + ' blijvend' : ''}` : '·'}</td>
      <td class="klein">${p.totaal ? euro(p.doorlopend) : '·'}</td></tr>`;
  }).join('');
  return `<div class="kaart breed"><p class="over">Zei tegenover deed · alleen in de regie</p>
    <p class="klein">Hoek 1: links mezelf, rechts samen, naast het aandeel samen in de eigen verdeling. Hoek 2: links eenmalig, rechts blijvend, naast eenmalig : blijvend in de eigen verdeling (doorlopend telt daar niet mee). Oranje: de gekozen kant wijkt af van waar het meeste geld heen ging.</p>
    <table class="dt"><thead><tr><th>Naam</th><th>Hoek 1</th><th>Deed: samen</th><th>Hoek 2</th><th>Deed: eenmalig : blijvend</th><th>Doorlopend</th></tr></thead><tbody>${rijen}</tbody></table>
    ${R.zeideed.length ? '' : '<p class="klein">Nog geen antwoorden.</p>'}</div>`;
}
const balkje = f => `<span class="balkje"><i style="width:${Math.round(f * 100)}%"></i></span>`;

/* ════════════════════════ Instellingen ════════════════════════ */

function vulInstellingen(forceer){
  if (!R) return;
  const ins = R.instellingen;
  const velden = {'i-bedrag':ins.bedrag, 'i-stap':ins.stap, 'i-dagen':ins.dagen, 'i-taal':ins.schermtaal, 'i-regel-nl':ins.introregel.nl || '', 'i-regel-en':ins.introregel.en || ''};
  for (const [id, w] of Object.entries(velden)){
    const el = $(id);
    if (forceer || (!el.dataset.vuil && document.activeElement !== el)) el.value = w;
  }
  $('i-bedrag').disabled = $('i-stap').disabled = R.slot.bedrag;
  $('i-dagen').disabled = R.slot.dagen;
  $('i-slot').textContent = R.slot.bedrag ? 'Er zijn al antwoorden op deel 2 of hoek 3: bedrag en stap liggen vast.' + (R.slot.dagen ? ' Het aantal dagen ook.' : '') : '';
}
document.querySelectorAll('#tab-ins input, #tab-ins select').forEach(el => el.addEventListener('input', () => { el.dataset.vuil = '1'; $('i-status').textContent = 'Niet opgeslagen'; }));
$('i-opslaan').addEventListener('click', () => doe({actie:'instellingen', instellingen:{
  bedrag:Number($('i-bedrag').value), stap:Number($('i-stap').value), dagen:Number($('i-dagen').value), schermtaal:$('i-taal').value,
  introregel:{nl:$('i-regel-nl').value, en:$('i-regel-en').value}}})
  .then(async () => { document.querySelectorAll('#tab-ins [data-vuil]').forEach(el => delete el.dataset.vuil); $('i-status').textContent = 'Opgeslagen'; meld('Instellingen opgeslagen'); await poll(); vulInstellingen(true); })
  .catch(() => {}));

function viewCats(){
  const slot = R.slot.koppelen;
  return `<table class="dt"><thead><tr><th>#</th><th>Categorie (NL)</th><th>Categorie (EN)</th><th>Voor wie</th><th>Vorm</th><th></th></tr></thead><tbody>
    ${R.categorieen.map((c, i) => `<tr><td class="klein">${i + 1}</td><td>${esc(c.nl)}${c.eigen ? ' <span class="badge grijs">uit deel 1</span>' : ''}</td><td class="klein">${esc(c.en)}</td><td>${c.voor}</td><td>${c.vorm}</td>
      <td>${c.eigen && !slot ? `<button type="button" class="knop gevaar" data-catweg="${c.id}">Weghalen</button>` : ''}</td></tr>`).join('')}</tbody></table>
    ${slot ? '<p class="klein">Deel 2 is open geweest: de categorieën liggen vast.</p>' : `<p class="klein">Een categorie toevoegen kan ook zonder idee:</p>${catForm('', '')}`}`;
}

/* ════════════════════════ Klikken ════════════════════════ */

document.addEventListener('click', async e => {
  const b = e.target.closest('button');
  if (!b) return;
  try{
    if ('open' in b.dataset){
      const deel = b.dataset.open || null;
      await doe({actie:'open', deel});
      meld(deel ? `${DEELNAAM[deel]} staat open: de deelnemers zien het nu` : 'Gesloten: de telefoons tonen een wachtscherm');
    } else if ('ga' in b.dataset){ await doe({actie:'ga', slide:b.dataset.ga}); }
    else if ('vrij' in b.dataset){ await doe({actie:'vrij', wat:b.dataset.vrij, aan:!!b.dataset.aan}); meld(b.dataset.aan ? 'Vrijgegeven: het scherm toont de uitkomst' : 'Vrijgave ingetrokken'); }
    else if ('detail' in b.dataset){ await doe({actie:'detail', id:b.dataset.detail || null}); }
    else if ('hoek' in b.dataset){ await doe({actie:'hoek', hoek:b.dataset.hoek}); meld('Hoek staat open en op het scherm'); }
    else if ('hoekscherm' in b.dataset){ await doe({actie:'hoek_scherm', hoek:b.dataset.hoekscherm}); }
    else if ('nieuwvoor' in b.dataset){ nieuwVoor = b.dataset.nieuwvoor || null; $('v-d1').dataset.k = ''; $('paneel').dataset.k = ''; teken(); return; }
    else if ('maakcat' in b.dataset){
      const f = b.closest('.catform'); const w = k => f.querySelector(`[data-f="${k}"]`).value;
      await doe({actie:'categorie', idee:b.dataset.maakcat || '', nl:w('nl'), en:w('en'), voor:w('voor'), vorm:w('vorm')});
      nieuwVoor = null; meld('Categorie toegevoegd aan deel 2');
      f.querySelectorAll('input').forEach(i => i.value = ''); f.querySelectorAll('select').forEach(s => s.value = '');
    }
    else if ('catweg' in b.dataset){ if (!confirm('Deze categorie weghalen uit deel 2?')) return; await doe({actie:'categorie_weg', id:b.dataset.catweg}); }
    else if (b.id === 'nh-maak' || b.id === 'nh-open'){
      const w = k => document.querySelector(`[data-nh="${k}"]`).value;
      /* De vaste regel voor teksten van deelnemers: geen gedachtestreepjes en geen absolute woorden. */
      const fout = ['ln','rn','le','re'].map(w).join(' ').match(/[–—]| - |\b(nooit|altijd|niemand|iedereen|alles|alle|elke?|never|always|nobody|everyone|everybody|everything|all|every)\b/i);
      if (fout && !confirm(`In de tekst staat "${fout[0].trim()}". Toch toevoegen?`)) return;
      const d = await doe({actie:'nieuwe_hoek', links:{nl:w('ln'), en:w('le')}, rechts:{nl:w('rn'), en:w('re')}});
      document.querySelectorAll('[data-nh]').forEach(i => i.value = '');
      if (b.id === 'nh-open') await doe({actie:'hoek', hoek:d.id});
      meld(b.id === 'nh-open' ? 'Toegevoegd en geopend' : 'Toegevoegd aan de voorraad');
    }
    else return;
  }catch(err){ /* de melding staat er al */ }
  poll();
});

toonTab(tab);
poll();
setInterval(poll, Math.max(1000, window.POLL_MS || 1000));
})();
