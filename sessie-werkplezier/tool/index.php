<?php
/**
 * De pagina van de deelnemer, op de telefoon. Naam en taal kiezen (de
 * telefoon onthoudt allebei), daarna alleen het deel dat de regie openzet.
 */
require_once __DIR__ . '/kern.php';
header('Cache-Control: no-store, must-revalidate');
?>
<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Werkplezier · Making Waves</title>
<meta name="description" content="Vragen voor de sessie over werkplezier en welzijn bij Making Waves.">
<meta name="robots" content="noindex">
<meta name="theme-color" content="#2A2D35">
<link rel="icon" href="ds/mw-mark.svg">
<link rel="stylesheet" href="<?= ver('ds/mw.css') ?>">
<link rel="stylesheet" href="<?= ver('mee.css') ?>">
</head>
<body class="mee">

<header class="kop">
  <div class="kop-l">
    <img class="mark" src="ds/mw-mark.svg" alt="" width="26" height="26">
    <span class="wie" id="wie" hidden><b id="wie-naam"></b><button type="button" class="link" id="wissel"></button></span>
  </div>
  <div class="kop-r">
    <div class="taal" role="group" aria-label="Taal · Language">
      <button type="button" data-taal="nl">NL</button><button type="button" data-taal="en">EN</button>
    </div>
  </div>
</header>
<div class="testkies" id="testkies" hidden></div>

<main id="main">
  <!-- Naam kiezen -->
  <section id="s-naam" hidden>
    <h1>Wie ben je?<span>Who are you?</span></h1>
    <div class="namen">
      <?php foreach (DEELNEMERS as $n): ?>
        <button type="button" class="naam" data-naam="<?= h($n) ?>"><?= h($n) ?></button>
      <?php endforeach; ?>
    </div>
  </section>

  <!-- Wachten: er staat niets open -->
  <section id="s-wacht" hidden>
    <span class="puls" aria-hidden="true"></span>
    <p class="intro" id="t-intro"></p>
    <p class="introregel" id="t-introregel"></p>
    <p class="wachtregel" id="t-wacht"></p>
  </section>

  <!-- Het open deel -->
  <section id="s-deel" hidden></section>
</main>

<div class="melding" id="melding" role="status" aria-live="polite"></div>

<script>window.POLL_MS = <?= (int)POLL_MS ?>; window.TAAL = <?= json_encode(DEELNEMER_TAAL) ?>; window.TESTERS = <?= json_encode(TEST_DEELNEMERS) ?>;</script>
<script src="<?= ver('mee.js') ?>"></script>
</body>
</html>
