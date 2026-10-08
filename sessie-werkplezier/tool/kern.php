<?php
/**
 * Het hart van de sessie: inhoud, antwoorden en de gedeelde stand.
 * Alles in JSON-bestanden in data/, geen database. Schrijven gaat onder een
 * lock, zodat twintig telefoons en de regie elkaar niet overschrijven. Zoals
 * in sessie 3 en 4.
 */
require_once __DIR__ . '/paden.php';
require_once __DIR__ . '/config.php';

const DICHT = "# Niets in deze map is van buitenaf te lezen. PHP leest de bestanden op de\n"
            . "# server zelf; alleen verzoeken via de browser worden geweigerd.\n"
            . "<IfModule mod_authz_core.c>\n  Require all denied\n</IfModule>\n"
            . "<IfModule !mod_authz_core.c>\n  Order allow,deny\n  Deny from all\n</IfModule>\n";

/** De vier delen, in volgorde. */
const DELEN = ['d1', 'd2', 'd3', 'd4'];

/** Deel 4: zes knoppen zonder midden. 0 tot 2 is links, 3 tot 5 rechts. */
const HOEK_STAPPEN = 6;

/** Deel 1 en 3: hoeveel ideeën en aanpakken iemand maximaal kiest. */
const MAX_IDEEEN = 3;
const MAX_AANPAKKEN = 3;

/* ── Bestanden ────────────────────────────────────────────────────── */

/** Bij de eerste start: data/ aanmaken, op slot zetten en de inhoud vullen uit start/. */
function data_klaar(): void {
    static $gedaan = false;
    if ($gedaan) return;
    $gedaan = true;
    if (!is_dir(DATA_DIR)) @mkdir(DATA_DIR, 0775, true);
    if (!is_file(DATA_DIR . '/.htaccess')) @file_put_contents(DATA_DIR . '/.htaccess', DICHT);
    if (!is_file(DATA_DIR . '/content.json')) @copy(START_DIR . '/content.json', DATA_DIR . '/content.json');
}

function data_lees(string $naam, $leeg = []) {
    data_klaar();
    $f = DATA_DIR . '/' . $naam . '.json';
    if (!is_file($f)) return $leeg;
    $fp = fopen($f, 'r');
    if (!$fp) return $leeg;
    flock($fp, LOCK_SH);
    $d = json_decode((string)stream_get_contents($fp), true);
    flock($fp, LOCK_UN); fclose($fp);
    return $d === null ? $leeg : $d;
}

/** Leest, laat de callback het aanpassen, schrijft terug. Alles onder één lock. */
function data_wijzig(string $naam, callable $fn) {
    data_klaar();
    $f = DATA_DIR . '/' . $naam . '.json';
    $fp = fopen($f, 'c+');
    if (!$fp) return null;
    flock($fp, LOCK_EX);
    $d = json_decode(stream_get_contents($fp) ?: 'null', true);
    if ($d === null) $d = [];
    $d = $fn($d);
    $json = json_encode($d, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    ftruncate($fp, 0); rewind($fp); fwrite($fp, $json); fflush($fp);
    flock($fp, LOCK_UN); fclose($fp);
    return $d;
}

/** Wanneer een bestand voor het laatst veranderde; de telefoons zien zo dat de inhoud nieuw is. */
function data_tijd(string $naam): int {
    data_klaar();
    clearstatcache(true, DATA_DIR . '/' . $naam . '.json');
    return (int)@filemtime(DATA_DIR . '/' . $naam . '.json');
}

/** Een kopie van een bestand in data/versies, voor elke wijziging van de inhoud. */
function bewaar_versie(string $naam): void {
    $f = DATA_DIR . "/$naam.json";
    if (!is_file($f)) return;
    if (!is_dir(DATA_DIR . '/versies')) @mkdir(DATA_DIR . '/versies', 0775, true);
    @copy($f, DATA_DIR . '/versies/' . $naam . '-' . date('Ymd-His') . '-' . substr(uniqid(), -4) . '.json');
}

/* ── Inhoud en instellingen ───────────────────────────────────────── */

function inhoud(): array {
    $c = data_lees('content', []);
    $c['instellingen'] = ($c['instellingen'] ?? []) + ['bedrag' => 750, 'stap' => 50, 'dagen' => 3,
        'introregel' => ['nl' => '', 'en' => ''], 'schermtaal' => 'nl'];
    foreach (['categorieen', 'aanpakken', 'hoeken'] as $k) $c[$k] = array_values($c[$k] ?? []);
    return $c;
}

function instellingen(?array $c = null): array {
    return ($c ?? inhoud())['instellingen'];
}

/** Een bedrag zoals je het schrijft: €750, €1.000 (nl) of €1,000 (en). */
function euro(int $n, string $taal): string {
    return '€' . number_format($n, 0, ',', $taal === 'en' ? ',' : '.');
}

/** Vult {bedrag}, {stap} en {dagen} in een tekst in. */
function vul(string $tekst, string $taal, ?array $ins = null): string {
    $ins = $ins ?? instellingen();
    return strtr($tekst, [
        '{bedrag}' => euro((int)$ins['bedrag'], $taal),
        '{stap}'   => euro((int)$ins['stap'], $taal),
        '{dagen}'  => (string)(int)$ins['dagen'],
    ]);
}

/** De tekst van een tweetalig veld in één taal, ingevuld. */
function tt($veld, string $taal, ?array $ins = null): string {
    $s = is_array($veld) ? (string)($veld[$taal] ?? $veld['nl'] ?? $veld['en'] ?? '') : (string)$veld;
    return vul($s, $taal, $ins);
}

function per_id(array $lijst): array {
    $uit = [];
    foreach ($lijst as $x) $uit[$x['id']] = $x;
    return $uit;
}

/* ── Deelnemers ───────────────────────────────────────────────────── */

function is_tester(string $naam): bool {
    return in_array($naam, TEST_DEELNEMERS, true);
}

function mag_meedoen(string $naam): bool {
    return in_array($naam, DEELNEMERS, true) || is_tester($naam);
}

/**
 * naam => [
 *   d1 => [ideeen => [tekst, tekst, tekst]],
 *   d2 => [verdeling => [categorie-id => euro], bedrag => totaal bij versturen,
 *          verander => [cat => categorie-id, tekst => ...]],
 *   d3 => [keuzes => [aanpak-id => waarom]],
 *   d4 => [hoek-id => 0 tot 5],
 * ]
 */
function antwoorden(): array {
    return data_lees('answers', []);
}

/** Alleen de echte deelnemers, in de volgorde van de lijst. Testers tellen nergens mee. */
function echte_antwoorden(?array $ant = null): array {
    $ant = $ant ?? antwoorden();
    $uit = [];
    foreach (DEELNEMERS as $n) if (isset($ant[$n])) $uit[$n] = $ant[$n];
    return $uit;
}

/* ── De gedeelde stand ────────────────────────────────────────────── */

function stand(): array {
    $leeg = [
        'slide'      => 'titel',  /* id van de slide op het scherm */
        'open'       => null,     /* welk deel openstaat op de telefoons, of niets */
        'hoek'       => null,     /* deel 4: welke hoek openstaat */
        'hoek_scherm'=> null,     /* deel 4: welke hoek het scherm toont */
        'vrij'       => [],       /* d1, d2, d3 of een hoek-id => vrijgegeven */
        'geopend'    => [],       /* deel => ooit opengezet */
        'koppel'     => [],       /* idee (naam#plek) => categorie-id */
        'detail'     => null,     /* deel 3: de aanpak waarvan het detail op het scherm openstaat */
        'gewijzigd'  => 0,
    ];
    $s = data_lees('state', []) + $leeg;
    foreach (['vrij', 'geopend', 'koppel'] as $k) if (!is_array($s[$k])) $s[$k] = [];
    if (!in_array($s['slide'], array_column(slides(), 'id'), true)) $s['slide'] = 'titel';
    return $s;
}

function stand_wijzig(callable $fn): array {
    return data_wijzig('state', function ($s) use ($fn) {
        $s = $fn($s);
        $s['gewijzigd'] = time();
        return $s;
    });
}

/* ── De slides op het scherm: een vaste volgorde ──────────────────── */

function slides(): array {
    return [
        ['id' => 'titel',   'type' => 'titel',     'deel' => null, 'naam' => 'Titel'],
        ['id' => 'intro',   'type' => 'intro',     'deel' => null, 'naam' => 'Intro: stel, je krijgt een bedrag'],
        ['id' => 'd1',      'type' => 'open',      'deel' => 'd1', 'naam' => 'Deel 1 · eigen idee'],
        ['id' => 'd1-uit',  'type' => 'ideeen',    'deel' => 'd1', 'naam' => 'Deel 1 · de ideeën'],
        ['id' => 'd2',      'type' => 'open',      'deel' => 'd2', 'naam' => 'Deel 2 · verdelen'],
        ['id' => 'd2-uit',  'type' => 'verdeling', 'deel' => 'd2', 'naam' => 'Deel 2 · de verdeling'],
        ['id' => 'd3',      'type' => 'tegels',    'deel' => 'd3', 'naam' => 'Deel 3 · wat anderen doen'],
        ['id' => 'd4',      'type' => 'hoek',      'deel' => 'd4', 'naam' => 'Deel 4 · hoeken, één vraag'],
        ['id' => 'd4-alle', 'type' => 'hoeken',    'deel' => 'd4', 'naam' => 'Deel 4 · alle vrijgegeven hoeken'],
    ];
}

/** Waar de regie op let bij elke slide. Alleen in de regie te zien. */
const NOTITIES = [
    'titel'   => 'Welkom. Het gaat om wat we als organisatie doen om mensen fit, tevreden, blij en energiek te houden.',
    'intro'   => 'Het bedrag is een denkoefening, geen toezegging. De regel eronder vul je in bij Instellingen.',
    'd1'      => 'Eerst eigen ideeën, zodat de categorieën nog niet sturen. Koppel ideeën in de regie aan een categorie, of maak er een nieuwe van. Dat kan tot deel 2 opengaat.',
    'd1-uit'  => 'Verschijnt na vrijgave. Zonder namen.',
    'd2'      => 'Versturen kan pas als alles verdeeld is. Daarna één optionele vraag bij de grootste categorie.',
    'd2-uit'  => 'Verschijnt na vrijgave: categorieën op totaal, met het aantal mensen.',
    'd3'      => 'Klik op een tegel voor wie het deed en wat het opleverde. Na vrijgave staan de tegels op volgorde van keuzes.',
    'd4'      => 'Open een hoek in de regie. Het scherm toont de hoek die je opent; stippen pas na vrijgave.',
    'd4-alle' => 'Alle vrijgegeven hoeken onder elkaar.',
];
