<?php
/** Het grote scherm op de beamer. Volgt de regie zonder verversen. */
require_once __DIR__ . '/kern.php';
header('Cache-Control: no-store, must-revalidate');
?>
<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Werkplezier · Making Waves</title>
<meta name="description" content="Beamerscherm van de sessie over werkplezier en welzijn bij Making Waves.">
<meta name="robots" content="noindex">
<meta name="theme-color" content="#2A2D35">
<link rel="icon" href="ds/mw-mark.svg">
<link rel="stylesheet" href="<?= ver('ds/mw.css') ?>">
<link rel="stylesheet" href="<?= ver('deck.css') ?>">
<style>
  html,body{height:100%}
  body{margin:0;background:#1E2026;overflow:hidden;color-scheme:dark}
  .hint{position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:7;background:rgba(22,24,29,.95);
    border:1px solid var(--mw-ink-4);border-radius:999px;padding:9px 18px;font-family:var(--font-mono);font-size:13px;
    color:var(--mw-on-dark-muted);transition:opacity .4s;white-space:nowrap}
  .hint.weg{opacity:0;pointer-events:none}
  .offline{position:fixed;right:16px;bottom:12px;z-index:7;width:10px;height:10px;border-radius:50%;background:var(--mw-orange);display:none}
  .offline.aan{display:block}
</style>
</head>
<body>
<div class="stage"><div class="canvas" id="canvas"></div></div>
<div class="hint" id="hint">← → bladeren · F volledig scherm · klik op een tegel voor het detail</div>
<div class="offline" id="offline" title="Geen verbinding met de server"></div>
<script>window.POLL_MS = <?= (int)POLL_MS ?>;</script>
<script src="<?= ver('deck.js') ?>"></script>
<script src="<?= ver('scherm.js') ?>"></script>
</body>
</html>
