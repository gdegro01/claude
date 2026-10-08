<?php
/**
 * Export in CSV en JSON, met ruwe waarden en namen, zoals in sessie 4.
 * Testgebruikers staan er niet in.
 *
 *   export.php?f=json                 alles in één bestand
 *   export.php?f=csv&wat=ideeen       (of verdeling, verander, aanpakken, hoeken)
 */
require_once __DIR__ . '/analyse.php';

$c = inhoud(); $st = stand(); $ant = echte_antwoorden();
$ins = instellingen($c);
$cats = per_id($c['categorieen']); $aps = per_id($c['aanpakken']); $hks = per_id($c['hoeken']);

$ideeen = [];
foreach (ideeen_lijst($ant, $st) as $x) {
    $ideeen[] = ['naam' => $x['naam'], 'plek' => $x['plek'] + 1, 'idee' => $x['tekst'],
                 'categorie_id' => $x['cat'] ?? '', 'categorie' => $x['cat'] ? ($cats[$x['cat']]['nl'] ?? '') : ''];
}
$verdeling = []; $verander = [];
foreach ($ant as $naam => $a) {
    $v = verdeling_van($a);
    if ($v === null) continue;
    foreach ($v as $cid => $b) {
        $verdeling[] = ['naam' => $naam, 'categorie_id' => $cid, 'categorie' => $cats[$cid]['nl'] ?? '',
            'voor_wie' => $cats[$cid]['voor'] ?? '', 'vorm' => $cats[$cid]['vorm'] ?? '', 'bedrag' => $b,
            'totaal_bij_versturen' => (int)($a['d2']['bedrag'] ?? 0)];
    }
    if (!empty($a['d2']['verander'])) {
        $cid = $a['d2']['verander']['cat'];
        $verander[] = ['naam' => $naam, 'categorie_id' => $cid, 'categorie' => $cats[$cid]['nl'] ?? '', 'antwoord' => $a['d2']['verander']['tekst']];
    }
}
$aanpakken = [];
foreach ($ant as $naam => $a) {
    foreach (($a['d3']['keuzes'] ?? []) as $aid => $w) {
        $aanpakken[] = ['naam' => $naam, 'aanpak_id' => $aid, 'aanpak' => $aps[$aid]['naam']['nl'] ?? '', 'waarom' => (string)$w];
    }
}
$hoeken = [];
foreach ($ant as $naam => $a) {
    foreach (($a['d4'] ?? []) as $hid => $w) {
        $hoeken[] = ['naam' => $naam, 'hoek_id' => $hid, 'links' => tt($hks[$hid]['links'] ?? '', 'nl', $ins),
            'rechts' => tt($hks[$hid]['rechts'] ?? '', 'nl', $ins), 'waarde' => (int)$w + 1, 'van' => HOEK_STAPPEN,
            'kant' => (int)$w < HOEK_STAPPEN / 2 ? 'links' : 'rechts'];
    }
}

$f = $_GET['f'] ?? 'json';
$datum = date('Y-m-d');

if ($f === 'csv') {
    $sets = ['ideeen' => $ideeen, 'verdeling' => $verdeling, 'verander' => $verander, 'aanpakken' => $aanpakken, 'hoeken' => $hoeken];
    $koppen = ['ideeen' => ['naam', 'plek', 'idee', 'categorie_id', 'categorie'],
        'verdeling' => ['naam', 'categorie_id', 'categorie', 'voor_wie', 'vorm', 'bedrag', 'totaal_bij_versturen'],
        'verander' => ['naam', 'categorie_id', 'categorie', 'antwoord'],
        'aanpakken' => ['naam', 'aanpak_id', 'aanpak', 'waarom'],
        'hoeken' => ['naam', 'hoek_id', 'links', 'rechts', 'waarde', 'van', 'kant']];
    $wat = isset($sets[$_GET['wat'] ?? '']) ? $_GET['wat'] : 'verdeling';
    header('Content-Type: text/csv; charset=utf-8');
    header("Content-Disposition: attachment; filename=\"werkplezier-$wat-$datum.csv\"");
    $out = fopen('php://output', 'w');
    fwrite($out, "\xEF\xBB\xBF");   /* zodat Excel de accenten goed leest */
    fputcsv($out, $koppen[$wat], ',', '"', '');
    foreach ($sets[$wat] as $r) fputcsv($out, array_values($r), ',', '"', '');
    exit;
}

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
if (empty($_GET['inline'])) header("Content-Disposition: attachment; filename=\"werkplezier-$datum.json\"");
echo json_encode([
    'datum' => $datum,
    'deelnemers' => DEELNEMERS,
    'instellingen' => $ins,
    'categorieen' => $c['categorieen'],
    'aanpakken' => $c['aanpakken'],
    'hoeken' => $c['hoeken'],
    'koppelingen' => $st['koppel'],
    'vrijgegeven' => array_keys($st['vrij']),
    'antwoorden' => $ant,
    'ideeen' => $ideeen, 'verdeling' => $verdeling, 'verander' => $verander, 'keuzes_aanpakken' => $aanpakken, 'hoeken_antwoorden' => $hoeken,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
