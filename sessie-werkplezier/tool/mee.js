/* De pagina van de deelnemer, op de telefoon. Alleen het deel dat de regie
   openzet is te zien. Deel 1 tot 3 verstuur je met een knop; in deel 4 slaat
   een tik direct op, zoals de stellingen in sessie 4. */
(function(){
'use strict';

const UI = {
  nl: {
    wissel: 'Niet jij?',
    wacht: 'Kijk naar het scherm. Hier verschijnt straks de volgende vraag.',
    versturen: 'Versturen', opnieuw: 'Wijziging versturen',
    verstuurd: 'Verstuurd. Aanpassen kan zolang dit deel openstaat.',
    opgeslagen: 'Opgeslagen', fout: 'Niet opgeslagen. Probeer het nog eens.', gesloten: 'Dit deel is net gesloten.',
    d1_t: 'Waar geef je die {bedrag} aan uit?', d1_l: 'Geef maximaal drie korte ideeën. Eén of twee mag ook.',
    idee: n => 'Idee ' + n, d1_leeg: 'Vul minstens één idee in.',
    d2_t: 'Verdeel {bedrag}', d2_l: 'Verdeel het bedrag over de categorieën, in stappen van {stap}. Je mag het hele bedrag ook op één categorie zetten.',
    rest: x => 'Nog te verdelen: ' + x, rond: 'Het hele bedrag is verdeeld', wis: 'Opnieuw beginnen',
    min: 'minder', plus: 'meer',
    verander_t: 'Wat zou dit voor jou veranderen?',
    verander_l: x => 'Je zette het meeste op: ' + x + '. Deze vraag mag je overslaan.',
    verander_kies: 'Je zette op meer categorieën hetzelfde bedrag. Kies er één:',
    opslaan: 'Opslaan', overslaan: 'Deze vraag mag je overslaan.',
    d3_t: 'Wat zou je hier willen proberen?', d3_l: 'Kies maximaal drie aanpakken. Zeg per keuze in één regel waarom, als je wilt.',
    waarom: 'Waarom? Eén regel, mag leeg blijven', gekozen: n => n + ' van 3 gekozen', max: 'Je hebt er al drie. Haal er eerst een weg.',
    d4_t: 'Welke kant kies jij?', d4_l: 'Kies een kant, en laat zien hoe sterk.', sterk: 'sterk', licht: 'licht',
    stap: (i, k) => (i < 3 ? 'links' : 'rechts') + ', ' + ['sterk','middel','licht','licht','middel','sterk'][i],
  },
  en: {
    wissel: 'Not you?',
    wacht: 'Keep an eye on the screen. The next question will appear here.',
    versturen: 'Send', opnieuw: 'Send changes',
    verstuurd: 'Sent. You can still change it while this part is open.',
    opgeslagen: 'Saved', fout: 'Not saved. Please try again.', gesloten: 'This part has just closed.',
    d1_t: 'What would you spend that {bedrag} on?', d1_l: 'Give up to three short ideas. One or two is fine too.',
    idee: n => 'Idea ' + n, d1_leeg: 'Fill in at least one idea.',
    d2_t: 'Divide {bedrag}', d2_l: 'Divide the amount over the categories, in steps of {stap}. You can also put the whole amount on one category.',
    rest: x => 'Left to divide: ' + x, rond: 'The whole amount is divided', wis: 'Start over',
    min: 'less', plus: 'more',
    verander_t: 'What would this change for you?',
    verander_l: x => 'You put the most on: ' + x + '. You can skip this question.',
    verander_kies: 'You put the same amount on more than one category. Pick one:',
    opslaan: 'Save', overslaan: 'You can skip this question.',
    d3_t: 'What would you like to try here?', d3_l: 'Pick up to three approaches. Say in one line per pick why, if you like.',
    waarom: 'Why? One line, can stay empty', gekozen: n => n + ' of 3 picked', max: 'You already have three. Remove one first.',
    d4_t: 'Which side do you pick?', d4_l: 'Pick a side, and show how strongly.', sterk: 'strong', licht: 'slight',
    stap: (i, k) => (i < 3 ? 'left' : 'right') + ', ' + ['strong','medium','slight','slight','medium','strong'][i],
  },
};

const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const lees = k => { try { return localStorage.getItem(k); } catch(e){ return null; } };
const zet = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch(e){} };
const P = 'mw-wp-';

/* Binnenkomen met ?naam=... (voor wie test en niet op het naamscherm staat). */
try {
  const q = new URLSearchParams(location.search).get('naam');
  if (q) { zet(P + 'naam', q); zet(P + 'taal-zelf', null); history.replaceState(null, '', location.pathname); }
} catch(e){}
let naam = lees(P + 'naam');
const isTester = () => (window.TESTERS || []).includes(naam);
const taalVanNaam = n => (window.TAAL || {})[n] || 'nl';
let taal = lees(P + 'taal-zelf') === '1' && ['nl','en'].includes(lees(P + 'taal')) ? lees(P + 'taal') : (naam ? taalVanNaam(naam) : 'nl');
let bekijk = null;   /* tester: welk deel bekijken, los van de regie */
try { bekijk = sessionStorage.getItem(P + 'bekijk'); } catch(e){}

let open = undefined, hoek = null, cv = null;
let D = null;        /* het open deel zoals de server het gaf */
let L = {};          /* wat de deelnemer nog niet verstuurde */

function t(){ return UI[taal]; }
function euro(n){ return '€' + Number(n).toLocaleString(taal === 'en' ? 'en-GB' : 'nl-NL'); }
function vul(s){ return D ? s.replace('{bedrag}', euro(D.bedrag)).replace('{stap}', euro(D.stap)) : s; }

/* ── Taal en naam ── */
function teksten(){
  document.documentElement.lang = taal;
  $('wissel').textContent = t().wissel;
  $('t-wacht').textContent = t().wacht;
  document.querySelectorAll('[data-taal]').forEach(b => b.setAttribute('aria-pressed', b.dataset.taal === taal ? 'true' : 'false'));
}
document.querySelectorAll('[data-taal]').forEach(b => b.addEventListener('click', () => {
  taal = b.dataset.taal; zet(P + 'taal', taal); zet(P + 'taal-zelf', '1'); teksten();
  haalDeel(true);
}));
document.querySelectorAll('.naam[data-naam]').forEach(b => b.addEventListener('click', () => {
  naam = b.dataset.naam; zet(P + 'naam', naam);
  taal = taalVanNaam(naam); zet(P + 'taal', taal); zet(P + 'taal-zelf', null); teksten();
  open = undefined; D = null; L = {}; toon(); stand();
}));
$('wissel').addEventListener('click', () => { naam = null; zet(P + 'naam', null); D = null; L = {}; toon(); });

function toon(){
  const heeftNaam = !!naam;
  $('wie').hidden = !heeftNaam;
  $('wie-naam').textContent = naam || '';
  $('s-naam').hidden = heeftNaam;
  $('s-wacht').hidden = !heeftNaam || !!(D && D.deel);
  $('s-deel').hidden = !heeftNaam || !(D && D.deel);
  tekenTestkies();
}

/* ── Kiezen wat een tester bekijkt ── */
function tekenTestkies(){
  const k = $('testkies');
  if (!naam || !isTester()){ k.hidden = true; return; }
  k.hidden = false;
  const html = `<span>Test:</span>${['d1','d2','d3','d4'].map(v => `<button type="button" data-bekijk="${v}" aria-pressed="${bekijk === v}">${v}</button>`).join('')}<button type="button" data-bekijk="" aria-pressed="${!bekijk}">volg regie</button>`;
  if (k.dataset.k !== html){ k.innerHTML = html; k.dataset.k = html; }
}
$('testkies').addEventListener('click', e => {
  const b = e.target.closest('[data-bekijk]'); if (!b) return;
  bekijk = b.dataset.bekijk || null;
  try { bekijk ? sessionStorage.setItem(P + 'bekijk', bekijk) : sessionStorage.removeItem(P + 'bekijk'); } catch(e){}
  open = undefined; L = {}; stand();
});

/* ── Melding onderaan ── */
let mT;
function meld(tekst, fout){
  const m = $('melding'); m.textContent = tekst; m.className = 'melding aan' + (fout ? ' fout' : '');
  clearTimeout(mT); mT = setTimeout(() => m.className = 'melding', 2600);
}

/* ── Server ── */
async function stand(){
  if (!naam) return;
  try{
    const d = await (await fetch(`api.php?a=stand&naam=${encodeURIComponent(naam)}&taal=${taal}`, {cache:'no-store'})).json();
    let o = d.open, h = d.hoek;
    if (isTester() && bekijk){ o = bekijk; h = bekijk === 'd4' ? (d.hoek || 'h1') : null; }
    if (o !== open || h !== hoek){
      const was = open;
      open = o; hoek = h; L = {};
      if (!o && was && D && D.deel) meld(t().gesloten);
      await haalDeel(true);
    } else if (d.cv !== cv){
      /* De inhoud veranderde (een categorie erbij, een ander bedrag). Niet midden in het typen
         opnieuw tekenen; de volgende ronde probeert het weer. Deel 1 hangt er niet van af. */
      const a = document.activeElement;
      if (a && $('s-deel').contains(a) && a.matches('input,textarea')) return;
      if (D && D.deel === 'd1'){ cv = d.cv; return; }
      await haalDeel(false);
    }
  }catch(e){}
}

/* Haalt het deel op. nieuw: alles opnieuw; anders blijft wat de deelnemer nog niet verstuurde staan. */
async function haalDeel(nieuw){
  if (!naam) return;
  try{
    const q = isTester() && bekijk ? `&deel=${bekijk}${hoek ? '&hoek=' + hoek : ''}` : '';
    const d = await (await fetch(`api.php?a=deel&naam=${encodeURIComponent(naam)}&taal=${taal}${q}`, {cache:'no-store'})).json();
    if (!d.ok){ if (d.fout === 'onbekende naam'){ naam = null; zet(P + 'naam', null); toon(); } return; }
    cv = d.cv || null;
    const oudBedrag = D && D.bedrag;
    D = d.open ? d.deel : Object.assign({deel: null}, d.intro);
    if (!d.open){ tekenWacht(); toon(); return; }
    if (D.deel === 'd2' && oudBedrag && oudBedrag !== D.bedrag) L = {};
    const y = window.scrollY;
    teken(nieuw);
    toon();
    window.scrollTo(0, nieuw ? 0 : y);
  }catch(e){}
}
async function post(body){
  const r = await fetch('api.php?a=antwoord', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(Object.assign({naam}, body))});
  const res = await r.json().catch(() => ({}));
  if (!r.ok || !res.ok) throw new Error(res.fout || 'fout');
  return res;
}
function fout(err){
  meld(err.message === 'gesloten' ? t().gesloten : t().fout, true);
  if (err.message === 'gesloten') stand();
}

function tekenWacht(){
  $('t-intro').textContent = D.intro || '';
  $('t-introregel').textContent = D.introregel || '';
  $('t-introregel').hidden = !D.introregel;
}

/* ── De delen tekenen ── */
function teken(){
  const s = $('s-deel');
  if (D.deel === 'd1') s.innerHTML = deel1();
  else if (D.deel === 'd2') s.innerHTML = deel2();
  else if (D.deel === 'd3') s.innerHTML = deel3();
  else if (D.deel === 'd4') s.innerHTML = deel4();
  na();
}
const kop = (titel, lead) => `<div class="dkop"><h1>${esc(vul(titel))}</h1><p class="lead">${esc(vul(lead))}</p></div>`;
const slot = (knop, status, extra) => `<div class="slot"><div class="slot-in">${extra || ''}<button type="button" class="verstuur" id="verstuur">${esc(knop)}</button></div><p class="status" id="status">${esc(status || '')}</p></div>`;

/* Deel 1: maximaal drie korte ideeën */
function deel1(){
  if (!L.ideeen) L.ideeen = D.ideeen.slice();
  return kop(t().d1_t, t().d1_l) + `<div class="ideeen">${L.ideeen.map((x, i) =>
    `<label class="veld"><span>${esc(t().idee(i + 1))}</span><input type="text" maxlength="100" data-idee="${i}" value="${esc(x)}" autocomplete="off" enterkeyhint="next"></label>`).join('')}</div>`
    + slot(D.verstuurd ? t().opnieuw : t().versturen, D.verstuurd ? t().verstuurd : '');
}

/* Deel 2: het bedrag verdelen, met een teller, en daarna de optionele vraag */
function deel2(){
  if (!L.v) L.v = Object.assign({}, D.verdeling);
  const som = Object.values(L.v).reduce((a, b) => a + b, 0), rest = D.bedrag - som;
  let html = kop(t().d2_t, t().d2_l) + `<div class="cats">${D.categorieen.map(c => { const x = L.v[c.id] || 0;
    return `<div class="cat${x ? ' aan' : ''}" data-cat="${c.id}"><span class="ct">${esc(c.t)}</span>
      <span class="stepper"><button type="button" class="st" data-d="-1" aria-label="${esc(t().min)}" ${x ? '' : 'disabled'}>−</button>
      <b>${euro(x)}</b><button type="button" class="st" data-d="1" aria-label="${esc(t().plus)}" ${rest > 0 ? '' : 'disabled'}>+</button></span></div>`; }).join('')}</div>`;
  const teller = `<span class="teller${rest ? '' : ' rond'}">${esc(rest ? t().rest(euro(rest)) : t().rond)}</span>`;
  html += slot(D.verstuurd && !L.vuil ? t().opnieuw : t().versturen, D.verstuurd && !L.vuil ? t().verstuurd : '', teller)
       + `<p class="wis"><button type="button" class="link" id="wis">${esc(t().wis)}</button></p>`;
  if (D.verstuurd && !L.vuil) html += verander();
  return html;
}
function grootste(v){
  const max = Math.max(0, ...Object.values(v));
  return max ? Object.keys(v).filter(k => v[k] === max) : [];
}
function verander(){
  const top = grootste(D.verdeling);
  if (!top.length) return '';
  const tekstVan = id => (D.categorieen.find(c => c.id === id) || {}).t || '';
  const v = D.verander || {};
  if (!L.vcat) L.vcat = top.includes(v.cat) ? v.cat : (top.length === 1 ? top[0] : null);
  if (L.vtekst === undefined) L.vtekst = top.includes(v.cat) ? v.tekst : '';
  const kies = top.length > 1 ? `<p class="lead">${esc(t().verander_kies)}</p><div class="kieslijst">${top.map(id =>
    `<button type="button" class="kies" data-vcat="${id}" aria-pressed="${L.vcat === id}">${esc(tekstVan(id))}</button>`).join('')}</div>`
    : `<p class="lead">${esc(t().verander_l(tekstVan(top[0])))}</p>`;
  return `<div class="verander"><h2>${esc(t().verander_t)}</h2>${kies}
    ${top.length > 1 ? `<p class="lead klein">${esc(t().overslaan)}</p>` : ''}
    <textarea id="vtekst" rows="3" maxlength="500" ${L.vcat ? '' : 'disabled'}>${esc(L.vtekst || '')}</textarea>
    <div class="rij"><button type="button" class="verstuur klein" id="vopslaan" ${L.vcat ? '' : 'disabled'}>${esc(t().opslaan)}</button><span class="status" id="vstatus"></span></div></div>`;
}

/* Deel 3: maximaal drie aanpakken, met een regel waarom */
function deel3(){
  if (!L.k) L.k = Object.assign({}, D.keuzes);
  const n = Object.keys(L.k).length;
  return kop(t().d3_t, t().d3_l) + `<div class="aanpakken">${D.aanpakken.map(a => { const aan = a.id in L.k;
    return `<div class="ap${aan ? ' aan' : ''}"><button type="button" class="ap-k" data-ap="${a.id}" aria-pressed="${aan}"><i aria-hidden="true"></i>
      <span><b>${esc(a.naam)}</b><span>${esc(a.uitleg)}</span></span></button>
      ${aan ? `<input type="text" class="waarom" data-waarom="${a.id}" maxlength="140" placeholder="${esc(t().waarom)}" value="${esc(L.k[a.id] || '')}" autocomplete="off">` : ''}</div>`; }).join('')}</div>`
    + slot(D.verstuurd ? t().opnieuw : t().versturen, D.verstuurd ? t().verstuurd : '', `<span class="teller${n ? ' rond' : ''}">${esc(t().gekozen(n))}</span>`);
}

/* Deel 4: twee hoeken, zes knoppen zonder midden. Een tik slaat op. */
function deel4(){
  const h = D.hoek;
  if (!h) return kop(t().d4_t, t().d4_l);
  return kop(t().d4_t, t().d4_l) + `<div class="hoek"><div class="kant l">${esc(h.links)}</div><div class="kant r">${esc(h.rechts)}</div></div>
    <div class="zes">${Array.from({length:6}, (_, i) => `<button type="button" class="hk ${i < 3 ? 'l' : 'r'} s${i < 3 ? 3 - i : i - 2}" data-w="${i}" aria-pressed="${h.w === i}" aria-label="${esc(t().stap(i))}"><i></i></button>`).join('')}</div>
    <div class="zes-l"><span>← ${esc(t().sterk)}</span><span>${esc(t().licht)}</span><span>${esc(t().licht)}</span><span>${esc(t().sterk)} →</span></div>
    <p class="status midden" id="status"></p>`;
}

/* Na het tekenen: knoppen aan de praat */
function na(){
  const v = $('verstuur');
  if (D.deel === 'd1'){
    document.querySelectorAll('[data-idee]').forEach(inp => inp.addEventListener('input', () => { L.ideeen[Number(inp.dataset.idee)] = inp.value; }));
    v.addEventListener('click', async () => {
      if (!L.ideeen.some(x => x.trim())) { meld(t().d1_leeg, true); return; }
      try { await post({deel:'d1', ideeen:L.ideeen}); D.verstuurd = true; D.ideeen = L.ideeen.slice(); v.textContent = t().opnieuw; $('status').textContent = t().verstuurd; meld(t().opgeslagen); }
      catch(e){ fout(e); }
    });
  }
  if (D.deel === 'd2'){
    const som = Object.values(L.v).reduce((a, b) => a + b, 0);
    v.disabled = som !== D.bedrag;
    v.addEventListener('click', async () => {
      try { await post({deel:'d2', verdeling:L.v}); D.verdeling = Object.assign({}, L.v); D.verstuurd = true; L.vuil = false;
            if (!grootste(D.verdeling).includes((D.verander || {}).cat)) D.verander = null;
            L.vcat = undefined; L.vtekst = undefined; meld(t().opgeslagen); herteken(); }
      catch(e){ fout(e); }
    });
    $('wis').addEventListener('click', () => { L.v = {}; L.vuil = true; herteken(); });
    const vt = $('vtekst');
    if (vt){
      vt.addEventListener('input', () => { L.vtekst = vt.value; $('vstatus').textContent = ''; });
      $('vopslaan').addEventListener('click', async () => {
        try { await post({deel:'d2v', cat:L.vcat, tekst:vt.value}); D.verander = {cat:L.vcat, tekst:vt.value}; $('vstatus').textContent = '✓ ' + t().opgeslagen; }
        catch(e){ fout(e); }
      });
    }
  }
  if (D.deel === 'd3'){
    document.querySelectorAll('[data-waarom]').forEach(inp => inp.addEventListener('input', () => { L.k[inp.dataset.waarom] = inp.value; }));
    v.addEventListener('click', async () => {
      try { await post({deel:'d3', keuzes:L.k}); D.verstuurd = true; D.keuzes = Object.assign({}, L.k); v.textContent = t().opnieuw; $('status').textContent = t().verstuurd; meld(t().opgeslagen); }
      catch(e){ fout(e); }
    });
  }
}
function herteken(){ const y = window.scrollY; teken(); window.scrollTo(0, y); }

$('s-deel').addEventListener('click', async e => {
  if (!D) return;
  /* deel 2: plus en min */
  const st = e.target.closest('.st');
  if (st && D.deel === 'd2'){
    const cid = st.closest('[data-cat]').dataset.cat, d = Number(st.dataset.d);
    const som = Object.values(L.v).reduce((a, b) => a + b, 0);
    const nu = L.v[cid] || 0, nieuw = nu + d * D.stap;
    if (nieuw < 0 || som + d * D.stap > D.bedrag) return;
    if (nieuw) L.v[cid] = nieuw; else delete L.v[cid];
    L.vuil = true; herteken(); return;
  }
  const kies = e.target.closest('[data-vcat]');
  if (kies){ L.vcat = kies.dataset.vcat; herteken(); return; }
  /* deel 3: een aanpak aan of uit */
  const ap = e.target.closest('[data-ap]');
  if (ap && D.deel === 'd3'){
    const id = ap.dataset.ap;
    if (id in L.k) delete L.k[id];
    else if (Object.keys(L.k).length >= 3){ meld(t().max, true); return; }
    else L.k[id] = '';
    herteken();
    const inp = document.querySelector(`[data-waarom="${id}"]`); if (inp) inp.focus({preventScroll:true});
    return;
  }
  /* deel 4: een tik slaat direct op; nog eens op dezelfde knop haalt het weg */
  const hk = e.target.closest('.hk');
  if (hk && D.deel === 'd4'){
    const oud = D.hoek.w, w = Number(hk.dataset.w) === oud ? null : Number(hk.dataset.w);
    D.hoek.w = w;
    document.querySelectorAll('.hk').forEach(b => b.setAttribute('aria-pressed', Number(b.dataset.w) === w ? 'true' : 'false'));
    try { await post({deel:'d4', hoek:D.hoek.id, waarde:w}); $('status').textContent = w === null ? '' : '✓ ' + t().opgeslagen; }
    catch(err){ D.hoek.w = oud; document.querySelectorAll('.hk').forEach(b => b.setAttribute('aria-pressed', Number(b.dataset.w) === oud ? 'true' : 'false')); fout(err); }
  }
});

teksten(); toon();
stand();
setInterval(stand, Math.max(1000, window.POLL_MS || 1000));
})();
