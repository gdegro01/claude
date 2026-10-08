/* Het scherm haalt elke POLL_MS de huidige slide op en tekent hem alleen
   opnieuw als er iets veranderd is. Zo flikkert er niets. Zoals sessie 4,
   plus het detail van een tegel in deel 3. */
(function(){
'use strict';
const canvas = document.getElementById('canvas');
const offline = document.getElementById('offline');
let vorige = '';

function schaal(){
  const s = Math.min(window.innerWidth/1920, window.innerHeight/1080);
  canvas.style.transform = `translate(-50%,-50%) scale(${s})`;
}
window.addEventListener('resize', schaal); schaal();

async function haal(){
  try{
    const r = await fetch('api.php?a=scherm', {cache:'no-store'});
    const d = await r.json();
    offline.classList.remove('aan');
    const sleutel = JSON.stringify(d);
    if (sleutel === vorige) return;
    vorige = sleutel;
    canvas.innerHTML = MWDeck.html(d.slide, d.pos, d.total);
    MWDeck.fit(canvas.querySelector('.slide'));
  }catch(e){ offline.classList.add('aan'); }
}
/* Pas tekenen als de fonts er zijn, anders klopt het passend maken niet. */
(document.fonts ? document.fonts.ready : Promise.resolve()).then(()=>{ haal(); setInterval(haal, window.POLL_MS || 1000); });

async function regie(body){
  try{ await fetch('api.php?a=regie', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)}); }catch(e){}
  haal();
}
/* Bladeren kan ook op de beamerlaptop zelf: de regie loopt mee. */
document.addEventListener('keydown', e=>{
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key==='f' || e.key==='F'){ try{ if(document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); }catch(_){} }
  if (e.key==='Escape' && canvas.querySelector('.detail')) regie({actie:'detail', id:null});
  if (['ArrowRight','ArrowDown','PageDown',' '].includes(e.key)){ e.preventDefault(); regie({actie:'stap', richting:1}); }
  if (['ArrowLeft','ArrowUp','PageUp'].includes(e.key)){ e.preventDefault(); regie({actie:'stap', richting:-1}); }
});
/* Deel 3: een klik op een tegel opent het detail, een klik op het detail sluit het. De regie ziet het ook. */
canvas.addEventListener('click', e=>{
  if (e.target.closest('.detail')) { regie({actie:'detail', id:null}); return; }
  const t = e.target.closest('[data-aanpak]');
  if (t) regie({actie:'detail', id:t.dataset.aanpak});
});
setTimeout(()=>document.getElementById('hint').classList.add('weg'), 4000);
})();
