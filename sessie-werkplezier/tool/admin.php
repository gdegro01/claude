<?php
/**
 * De regie. Wat Gerke tijdens de sessie gebruikt: het scherm bedienen, de
 * delen openen en vrijgeven, en per deel live zien wie wat antwoordde. Niets
 * gaat vanzelf: een deel gaat alleen open met een klik, zoals in sessie 3 en 4.
 */
require_once __DIR__ . '/kern.php';
header('Cache-Control: no-store, must-revalidate');
?>
<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Regie · werkplezier</title>
<meta name="description" content="Regie van de sessie over werkplezier en welzijn bij Making Waves.">
<meta name="robots" content="noindex">
<link rel="icon" href="ds/mw-mark.svg">
<link rel="stylesheet" href="<?= ver('ds/mw.css') ?>">
<link rel="stylesheet" href="<?= ver('deck.css') ?>">
<link rel="stylesheet" href="<?= ver('admin.css') ?>">
</head>
<body class="admin">

<header class="balk">
  <div class="balk-l">
    <p class="over">Regie · werkplezier en welzijn</p>
    <p class="nu" id="balk-nu">…</p>
  </div>
  <div class="balk-r">
    <div class="vl-status" id="vl-status"></div>
    <a class="uit" href="scherm.php" target="_blank" rel="noopener">Scherm ↗</a>
    <a class="uit" href="./" target="_blank" rel="noopener">Deelnemers ↗</a>
  </div>
</header>

<nav class="tabs" role="tablist">
  <button type="button" role="tab" data-tab="sessie" aria-selected="true">Sessie</button>
  <button type="button" role="tab" data-tab="d1" aria-selected="false">Deel 1 · ideeën</button>
  <button type="button" role="tab" data-tab="d2" aria-selected="false">Deel 2 · verdeling</button>
  <button type="button" role="tab" data-tab="d3" aria-selected="false">Deel 3 · aanpakken</button>
  <button type="button" role="tab" data-tab="d4" aria-selected="false">Deel 4 · hoeken</button>
  <button type="button" role="tab" data-tab="zd" aria-selected="false">Zei tegenover deed</button>
  <button type="button" role="tab" data-tab="ins" aria-selected="false">Instellingen</button>
  <button type="button" role="tab" data-tab="data" aria-selected="false">Data</button>
</nav>

<!-- ── Sessie ── -->
<section class="tab" id="tab-sessie">
  <div class="sessie">
    <div class="links">
      <div class="pv" id="pv-nu"><div class="mini"></div></div>
      <div class="navrij">
        <button type="button" class="knop" id="vorige">← Vorige</button>
        <button type="button" class="knop prim" id="volgende">Volgende →</button>
        <select id="spring" aria-label="Spring naar slide"></select>
      </div>
      <div class="notitie" id="notitie"></div>
      <div id="paneel"></div>
    </div>
    <aside class="rechts">
      <div class="kaart">
        <p class="over">Volgende slide</p>
        <div class="pv klein" id="pv-volgend"><div class="mini"></div></div>
      </div>
      <div class="kaart">
        <p class="over">Delen · openen en vrijgeven</p>
        <div id="delen"></div>
      </div>
      <div class="kaart">
        <p class="over">Wie doet mee en hoe ver</p>
        <div id="mensen"></div>
      </div>
    </aside>
  </div>
</section>

<section class="tab" id="tab-d1" hidden><div id="v-d1"></div></section>
<section class="tab" id="tab-d2" hidden><div id="v-d2"></div></section>
<section class="tab" id="tab-d3" hidden><div id="v-d3"></div></section>
<section class="tab" id="tab-d4" hidden><div id="v-d4"></div></section>
<section class="tab" id="tab-zd" hidden><div id="v-zd"></div></section>

<!-- ── Instellingen ── -->
<section class="tab" id="tab-ins" hidden>
  <div class="kaart breed">
    <p class="over">Instellingen · gelden direct op telefoons en scherm</p>
    <div class="velden">
      <div class="veld"><label for="i-bedrag">Bedrag in euro</label><input type="number" id="i-bedrag" min="50" step="50"></div>
      <div class="veld"><label for="i-stap">Stap bij verdelen</label><input type="number" id="i-stap" min="5" step="5"></div>
      <div class="veld"><label for="i-dagen">Dagen bij hoek 3</label><input type="number" id="i-dagen" min="1" max="60"></div>
      <div class="veld"><label for="i-taal">Taal van het scherm</label><select id="i-taal"><option value="nl">Nederlands</option><option value="en">Engels</option></select></div>
      <div class="veld breed"><label for="i-regel-nl">Regel onder de intro: wat er met de uitkomst gebeurt (NL)</label><input type="text" id="i-regel-nl" maxlength="300"></div>
      <div class="veld breed"><label for="i-regel-en">Dezelfde regel (EN)</label><input type="text" id="i-regel-en" maxlength="300"></div>
    </div>
    <p class="klein" id="i-slot"></p>
    <div class="rij"><button type="button" class="knop prim" id="i-opslaan">Instellingen opslaan</button><span class="klein" id="i-status"></span></div>
  </div>
  <div class="kaart breed">
    <p class="over">Categorieën in deel 2 · voor wie en vorm ziet alleen de regie</p>
    <div id="v-cats"></div>
  </div>
</section>

<!-- ── Data ── -->
<section class="tab" id="tab-data" hidden>
  <div class="kaart breed">
    <p class="over">Export · ruwe antwoorden met namen, alleen voor jou</p>
    <div class="rij">
      <a class="knop" href="export.php?f=csv&amp;wat=ideeen">Deel 1 · ideeën (CSV)</a>
      <a class="knop" href="export.php?f=csv&amp;wat=verdeling">Deel 2 · verdeling (CSV)</a>
      <a class="knop" href="export.php?f=csv&amp;wat=verander">Deel 2 · wat het verandert (CSV)</a>
      <a class="knop" href="export.php?f=csv&amp;wat=aanpakken">Deel 3 · aanpakken (CSV)</a>
      <a class="knop" href="export.php?f=csv&amp;wat=hoeken">Deel 4 · hoeken (CSV)</a>
      <a class="knop prim" href="export.php?f=json">Alles (JSON)</a>
    </div>
    <p class="klein">Testgebruikers staan niet in de export.</p>
  </div>
</section>

<div class="melding" id="melding" role="status" aria-live="polite"></div>

<script>window.POLL_MS = <?= (int)POLL_MS ?>;</script>
<script src="<?= ver('deck.js') ?>"></script>
<script src="<?= ver('admin.js') ?>"></script>
</body>
</html>
