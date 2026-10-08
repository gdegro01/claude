/* ── De renderer van het scherm ───────────────────────────────────────
   Opbouw en passend maken uit sessie 4 (deck.js). Het scherm en de regie
   gebruiken allebei deze code, zodat het voorbeeld in de regie precies is wat
   de beamer toont.

   MWDeck.html(slide, positie, totaal) geeft de HTML van één slide.
   MWDeck.fit(sectie) maakt de tekst kleiner tot alles past, tot een ondergrens.

   Op het scherm staan nooit namen, gemiddelden of medianen: alleen losse
   stippen, aantallen en totalen, en die pas na vrijgave. */
(function(){
'use strict';
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ARC = 'M182.73 50.957 L0 50.957 C0 50.957 35.877 0 93.276 0 C150.675 0 182.726 50.957 182.726 50.957 Z';
const MARK = `<svg class="mark" viewBox="0 0 182.73 152.5" aria-hidden="true">${[0,50.957,101.543].map(y=>`<path fill="currentColor" transform="translate(0 ${y})" d="${ARC}"/>`).join('')}</svg>`;
const pad = n => String(n).padStart(2,'0');
const arr = x => Array.isArray(x) ? x : [];
const STAPPEN = 6;

/* Zes vakjes zonder midden, met een stip per antwoord. Links teal, rechts oranje. */
function hoekbaan(d){
  const cel = Array.from({length:STAPPEN}, () => 0);
  arr(d).forEach(v => { if (v >= 0 && v < STAPPEN) cel[v]++; });
  return `<span class="hbaan">${cel.map((n,i) => `<span class="${i < STAPPEN/2 ? 'l' : 'r'}${i === STAPPEN/2 - 1 ? ' mid' : ''}">${'<i></i>'.repeat(n)}</span>`).join('')}</span>`;
}
const telefoon = s => `<div class="openrow"><div class="lap"><i>${esc(s.telefoon)}</i><span class="url">${esc(s.url||'')}</span></div></div>`;
const wacht = s => `<p class="wacht">${esc(s.wacht)}</p>`;

const R = {
  titel: s => `<div class="big">${arr(s.lines).map(l=>`<span>${esc(l)}</span>`).join('')}</div><p class="sub">${esc(s.sub)}</p>`,
  intro: s => `<p class="introtekst">${esc(s.tekst)}</p>${s.regel ? `<p class="introregel">${esc(s.regel)}</p>` : ''}`,
  open: s => `<h1>${esc(s.title)}</h1><p class="lead">${esc(s.lead)}</p>${s.open ? telefoon(s) : ''}`,
  ideeen: s => `<h1>${esc(s.title)}</h1>${!s.vrij ? wacht(s) : !arr(s.items).length ? `<p class="wacht">${esc(s.geen)}</p>` :
    `<ul class="ideeen">${arr(s.items).map(it => `<li>${esc(it.t)}${it.n > 1 ? ` <b>×${it.n}</b>` : ''}</li>`).join('')}</ul>`}`,
  verdeling: s => `<h1>${esc(s.title)}</h1>${!s.vrij ? wacht(s) : s.geen ? `<p class="wacht">${esc(s.geen)}</p>` :
    `<div class="verd">${arr(s.rijen).map(r => `<div class="vr${r.nul ? ' nul' : ''}"><span class="t">${esc(r.t)}</span>
      <span class="vbalk"><i style="width:${(r.frac*100).toFixed(1)}%"></i></span><b>${esc(r.totaal)}</b><span class="n">${esc(r.n)}</span></div>`).join('')}</div>`}`,
  tegels: s => `<div class="ihead"><h1>${esc(s.title)}</h1>${s.open ? `<span class="url klein">${esc(s.url)}</span>` : ''}</div>
    ${s.vrij ? '' : `<p class="lead">${esc(s.lead)}</p>`}
    <div class="tegels">${arr(s.tegels).map(t => `<button type="button" class="tegel" data-aanpak="${esc(t.id)}">
      <b>${esc(t.naam)}</b><span>${esc(t.uitleg)}</span>${s.vrij ? `<em>${esc(t.nt)}</em>` : ''}</button>`).join('')}</div>
    ${s.detail ? `<div class="detail" data-dicht="1"><div class="dkaart">
      <p class="over">${esc(s.detail.richting)} · ${esc(s.detail.l_bewijs)}: ${esc(s.detail.bewijs)}</p>
      <h2>${esc(s.detail.naam)}</h2><p class="duitleg">${esc(s.detail.uitleg)}</p>
      <div class="dgrid"><div><i>${esc(s.detail.l_wie)}</i><p>${esc(s.detail.wie)}</p></div>
      <div><i>${esc(s.detail.l_opbrengst)}</i><p>${esc(s.detail.opbrengst)}</p></div></div></div></div>` : ''}`,
  hoek: s => !s.hoek ? `<h1>${esc(s.title)}</h1><p class="wacht">${esc(s.geen_hoek)}</p>` :
    `<div class="ihead"><h1>${esc(s.title)}</h1>${s.open ? `<span class="url klein">${esc(s.url)}</span>` : ''}</div>
    <div class="hoek"><div class="kant l"><b>${esc(s.hoek.links)}</b></div><div class="kant r"><b>${esc(s.hoek.rechts)}</b></div></div>
    ${s.vrij ? `<div class="huit">${hoekbaan(s.d)}<div class="htel"><span class="l">${esc(s.nl)}</span><i>${esc(s.stip)}</i><span class="r">${esc(s.nr)}</span></div></div>`
             : `<p class="lead">${esc(s.lead)}</p>`}`,
  hoeken: s => `<h1>${esc(s.title)}</h1>${!arr(s.rijen).length ? `<p class="wacht">${esc(s.wacht)}</p>` :
    `<div class="hrijen">${arr(s.rijen).map(r => `<div class="hrij"><span class="t l">${esc(r.links)}</span><span class="c">${hoekbaan(r.d)}<em><b class="l">${r.nl}</b><b class="r">${r.nr}</b></em></span><span class="t r">${esc(r.rechts)}</span></div>`).join('')}</div>
    <p class="voet">${esc(s.stip)}</p>`}`,
};

function html(s, pos, total){
  let body;
  try { body = (R[s.type] || R.open)(s); }
  catch(e){ body = `<h1>${esc(s.title||'')}</h1><p class="small">Deze slide kan niet getoond worden: ${esc(e.message)}</p>`; }
  return `<section class="slide on t-${esc(s.type)}" aria-roledescription="slide" aria-label="${pos} / ${total}">
    <div class="s-top"><span class="over">${esc(s.section||'')}</span><span class="rt">${MARK}</span></div>
    <div class="s-body">${body}</div>
    <div class="s-foot"><span>Making Waves</span><span class="n">${pad(pos)} / ${pad(total)}</span></div>
  </section>`;
}

/* ── Passend maken ─────────────────────────────────────────────────────
   Werkt in canvaspixels (1920 × 1080), los van hoe groot het venster is. */
const KMIN = 0.55, STAP = 0.03;
function overloop(sec){
  const body = sec.querySelector('.s-body');
  return !!body && body.scrollHeight > body.clientHeight + 1;
}
function fit(sec){
  if (!sec) return;
  let k = 1; sec.style.setProperty('--k', k);
  while (overloop(sec) && k - STAP >= KMIN - 1e-9){ k -= STAP; sec.style.setProperty('--k', k.toFixed(2)); }
}

window.MWDeck = { html, fit, esc, pad, hoekbaan };
})();
