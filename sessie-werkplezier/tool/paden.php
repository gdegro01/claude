<?php
/**
 * Waar de data staat, en een versienummer achter css en js zodat browsers
 * tijdens de sessie geen oude versie vasthouden. Zoals in sessie 3.
 */
if (!defined('DATA_DIR')) define('DATA_DIR', __DIR__ . '/data');
if (!defined('START_DIR')) define('START_DIR', __DIR__ . '/start');

function ver(string $bestand): string {
    $t = @filemtime(__DIR__ . '/' . $bestand);
    return htmlspecialchars($bestand . ($t ? '?v=' . $t : ''));
}

function h(?string $s): string {
    return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');
}
