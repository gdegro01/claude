<?php
/**
 * Alle verzoeken van scherm, telefoons en regie. GET leest, POST schrijft.
 *
 *   ?a=scherm    de huidige slide, live gevuld
 *   ?a=stand     welk deel openstaat (de telefoons pollen dit)
 *   ?a=deel      het open deel voor één deelnemer, met de eigen antwoorden
 *   ?a=antwoord  POST: een antwoord op een deel
 *   ?a=regie     GET: alles voor de regie; POST: een actie uit de regie
 *
 * Het scherm krijgt nooit namen bij antwoorden, en uitkomsten pas na vrijgave.
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
require_once __DIR__ . '/analyse.php';

function klaar_met($d, int $code = 200): void {
    http_response_code($code);
    echo json_encode($d, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function invoer(): array {
    $d = json_decode((string)file_get_contents('php://input'), true);
    return is_array($d) ? $d : $_POST;
}
function taal_uit($x): string { return $x === 'en' ? 'en' : 'nl'; }
/** Een korte tekst van een deelnemer: getrimd, zonder regeleinden, ingekort. */
function regel($x, int $max): string {
    $s = trim(preg_replace('/\s+/u', ' ', (string)$x));
    return mb_substr($s, 0, $max);
}

$a = $_GET['a'] ?? '';
$post = $_SERVER['REQUEST_METHOD'] === 'POST';

/* ── Teksten op het scherm ────────────────────────────────────────── */

/** De teksten op het scherm, per taal. */
function scherm_l(): array {
    static $l = null;
    return $l ??= [
    'nl' => [
        'titel' => ['Werkplezier', 'en welzijn'],
        'sub' => 'Wat doen we als organisatie om je fit, tevreden, blij en energiek te houden?',
        'intro' => 'Stel: je krijgt {bedrag} van Making Waves. Je mag het uitgeven aan alles wat bijdraagt aan je werk, je functie of het werk dat je doet. Dit is een denkoefening, geen toezegging.',
        'sec' => ['d1' => 'Deel 1 · eigen idee', 'd2' => 'Deel 2 · verdelen', 'd3' => 'Deel 3 · wat anderen doen', 'd4' => 'Deel 4 · hoeken'],
        'd1_t' => 'Waar geef je die {bedrag} aan uit?', 'd1_l' => 'Geef maximaal drie korte ideeën.',
        'd1_uit' => 'Waar jullie het aan uitgeven',
        'd2_t' => 'Verdeel {bedrag}', 'd2_l' => 'Verdeel het bedrag over de categorieën, in stappen van {stap}. Het hele bedrag op één categorie mag ook.',
        'd2_uit' => 'Hoe jullie {bedrag} verdeelden',
        'd3_t' => 'Wat anderen doen', 'd3_l' => 'Kies op je telefoon maximaal drie aanpakken die je hier zou willen proberen.',
        'd4_t' => 'Welke kant kies jij?', 'd4_l' => 'Kies een kant, en laat zien hoe sterk.',
        'd4_alle' => 'De hoeken tot nu toe',
        'telefoon' => 'Op je telefoon', 'wacht' => 'Verschijnt als het deel is vrijgegeven',
        'mensen' => fn($n) => $n === 1 ? '1 persoon' : "$n mensen",
        'keuzes' => fn($n) => $n === 1 ? '1 keuze' : "$n keuzes",
        'links' => 'links', 'rechts' => 'rechts', 'stip' => 'Eén stip per persoon',
        'wie' => 'Wie het deed', 'opbrengst' => 'Wat het opleverde', 'bewijs' => 'Bewijs',
        'bewijzen' => ['onderzoek' => 'onderzoek', 'praktijk' => 'praktijkvoorbeeld', 'aanbieder' => 'claim van een aanbieder'],
        'richting' => ['erbij' => 'iets erbij', 'eraf' => 'iets eraf'],
        'geen_hoek' => 'Nog geen hoek gekozen', 'geen' => 'Nog niets binnen',
    ],
    'en' => [
        'titel' => ['Enjoyment', 'and wellbeing'],
        'sub' => 'What do we do as a company to keep you fit, satisfied, happy and energised?',
        'intro' => 'Imagine Making Waves gives you {bedrag}. You can spend it on anything that adds to your work, your role or the work you do. This is a thought exercise, not a promise.',
        'sec' => ['d1' => 'Part 1 · your own idea', 'd2' => 'Part 2 · dividing', 'd3' => 'Part 3 · what others do', 'd4' => 'Part 4 · two sides'],
        'd1_t' => 'What would you spend that {bedrag} on?', 'd1_l' => 'Give up to three short ideas.',
        'd1_uit' => 'What you would spend it on',
        'd2_t' => 'Divide {bedrag}', 'd2_l' => 'Divide the amount over the categories, in steps of {stap}. Putting the whole amount on one category is fine too.',
        'd2_uit' => 'How you divided {bedrag}',
        'd3_t' => 'What others do', 'd3_l' => 'On your phone, pick up to three approaches you would like to try here.',
        'd4_t' => 'Which side do you pick?', 'd4_l' => 'Pick a side, and show how strongly.',
        'd4_alle' => 'The sides so far',
        'telefoon' => 'On your phone', 'wacht' => 'Appears once this part is released',
        'mensen' => fn($n) => $n === 1 ? '1 person' : "$n people",
        'keuzes' => fn($n) => $n === 1 ? '1 pick' : "$n picks",
        'links' => 'left', 'rechts' => 'right', 'stip' => 'One dot per person',
        'wie' => 'Who did it', 'opbrengst' => 'What it brought', 'bewijs' => 'Evidence',
        'bewijzen' => ['onderzoek' => 'research', 'praktijk' => 'practice example', 'aanbieder' => 'provider claim'],
        'richting' => ['erbij' => 'something added', 'eraf' => 'something taken off'],
        'geen_hoek' => 'No question picked yet', 'geen' => 'Nothing in yet',
    ],
    ];
}

/** De hoek die het scherm toont: de gekozen, anders de open, anders de eerste. */
function hoek_op_scherm(array $st, array $c): ?array {
    $hv = per_id($c['hoeken']);
    foreach ([$st['hoek_scherm'], $st['hoek']] as $h) if ($h && isset($hv[$h])) return $hv[$h];
    return null;
}

/** Eén slide met alles wat het scherm nodig heeft, in de taal van het scherm. */
function slide_live(array $s, array $st, array $c, array $ant, ?string $taal = null): array {
    $ins = instellingen($c);
    $taal = $taal ?? taal_uit($ins['schermtaal']);
    $L = scherm_l()[$taal];
    $v = fn(string $x) => vul($x, $taal, $ins);
    $uit = ['id' => $s['id'], 'type' => $s['type'], 'section' => $s['deel'] ? $L['sec'][$s['deel']] : 'Making Waves',
            'taal' => $taal, 'url' => DEELNEMER_URL, 'telefoon' => $L['telefoon'], 'wacht' => $L['wacht']];
    $open = $s['deel'] && $st['open'] === $s['deel'];
    switch ($s['type']) {
        case 'titel':
            $uit += ['lines' => $L['titel'], 'sub' => $L['sub']];
            break;
        case 'intro':
            $uit += ['tekst' => $v($L['intro']), 'regel' => tt($ins['introregel'], $taal, $ins)];
            break;
        case 'open':
            $d = $s['deel'];
            $uit += ['title' => $v($L[$d . '_t']), 'lead' => $v($L[$d . '_l']), 'open' => $open];
            break;
        case 'ideeen':
            $uit += ['title' => $v($L['d1_uit']), 'vrij' => !empty($st['vrij']['d1'])];
            if ($uit['vrij']) $uit['items'] = ideeen_scherm($ant);
            $uit['geen'] = $L['geen'];
            break;
        case 'verdeling':
            $uit += ['title' => $v($L['d2_uit']), 'vrij' => !empty($st['vrij']['d2'])];
            if ($uit['vrij']) {
                $an = verdeling_analyse($c, $ant);
                $max = max(1, ...array_column($an['categorieen'], 'totaal'));
                $uit['rijen'] = array_map(fn($r) => ['t' => $r[$taal], 'totaal' => euro($r['totaal'], $taal),
                    'frac' => $r['totaal'] / $max, 'n' => $L['mensen']($r['n']), 'nul' => $r['totaal'] === 0], $an['categorieen']);
                $uit['geen'] = $an['verstuurd'] ? '' : $L['geen'];
            }
            break;
        case 'tegels':
            $vrij = !empty($st['vrij']['d3']);
            $an = $vrij ? per_id(aanpakken_analyse($c, $ant)['aanpakken']) : [];
            $tegels = array_map(fn($x) => ['id' => $x['id'], 'naam' => tt($x['naam'], $taal), 'uitleg' => tt($x['uitleg'], $taal),
                'n' => $vrij ? $an[$x['id']]['n'] : null, 'nt' => $vrij ? $L['keuzes']($an[$x['id']]['n']) : ''], $c['aanpakken']);
            if ($vrij) usort($tegels, fn($a, $b) => $b['n'] <=> $a['n']);
            $uit += ['title' => $L['d3_t'], 'lead' => $L['d3_l'], 'open' => $open, 'vrij' => $vrij, 'tegels' => $tegels];
            $det = $st['detail'] ? (per_id($c['aanpakken'])[$st['detail']] ?? null) : null;
            if ($det) $uit['detail'] = ['id' => $det['id'], 'naam' => tt($det['naam'], $taal), 'uitleg' => tt($det['uitleg'], $taal),
                'wie' => tt($det['wie'], $taal), 'opbrengst' => tt($det['opbrengst'], $taal),
                'bewijs' => $L['bewijzen'][$det['bewijs']] ?? $det['bewijs'], 'richting' => $L['richting'][$det['richting']] ?? '',
                'l_wie' => $L['wie'], 'l_opbrengst' => $L['opbrengst'], 'l_bewijs' => $L['bewijs']];
            break;
        case 'hoek':
            $h = hoek_op_scherm($st, $c);
            $uit += ['title' => $L['d4_t'], 'lead' => $L['d4_l'], 'stip' => $L['stip'], 'geen_hoek' => $L['geen_hoek']];
            if ($h) {
                $vrij = !empty($st['vrij'][$h['id']]);
                $uit += ['hoek' => ['id' => $h['id'], 'links' => tt($h['links'], $taal, $ins), 'rechts' => tt($h['rechts'], $taal, $ins)],
                         'open' => $open && $st['hoek'] === $h['id'], 'vrij' => $vrij];
                if ($vrij) {
                    $r = hoek_analyse($h['id'], $ant, false);
                    $uit += ['d' => $r['d'], 'nl' => $r['links'] . ' ' . $L['links'], 'nr' => $r['rechts'] . ' ' . $L['rechts']];
                }
            }
            break;
        case 'hoeken':
            $uit += ['title' => $L['d4_alle'], 'stip' => $L['stip'], 'geen' => $L['geen'], 'rijen' => []];
            foreach ($c['hoeken'] as $h) {
                if (empty($st['vrij'][$h['id']])) continue;
                $r = hoek_analyse($h['id'], $ant, false);
                $uit['rijen'][] = ['links' => tt($h['links'], $taal, $ins), 'rechts' => tt($h['rechts'], $taal, $ins),
                    'd' => $r['d'], 'nl' => $r['links'], 'nr' => $r['rechts']];
            }
            break;
    }
    return $uit;
}

function scherm_data(?array $st = null): array {
    $st = $st ?? stand();
    $sl = slides();
    $i = array_search($st['slide'], array_column($sl, 'id'), true) ?: 0;
    return ['slide' => slide_live($sl[$i], $st, inhoud(), antwoorden()), 'pos' => $i + 1, 'total' => count($sl)];
}

if ($a === 'scherm') klaar_met(scherm_data());

/* ── Telefoons ─────────────────────────────────────────────────────── */

if ($a === 'stand') {
    /* De telefoon meldt zich, zodat de regie ziet wie er meedoet. */
    $naam = (string)($_GET['naam'] ?? '');
    $taal = taal_uit($_GET['taal'] ?? '');
    if (mag_meedoen($naam)) {
        data_wijzig('aanwezig', function ($d) use ($naam, $taal) { $d[$naam] = ['t' => time(), 'taal' => $taal]; return $d; });
    }
    $st = stand();
    klaar_met(['open' => $st['open'], 'hoek' => $st['open'] === 'd4' ? $st['hoek'] : null,
               'cv' => data_tijd('content'), 'poll' => POLL_MS]);
}

/** Het deel zoals een deelnemer het ziet, in de eigen taal, met de eigen antwoorden. */
function deel_voor(string $deel, ?string $hoek, string $taal, string $naam): array {
    $c = inhoud(); $ins = instellingen($c);
    $mijn = antwoorden()[$naam] ?? [];
    $uit = ['deel' => $deel, 'bedrag' => (int)$ins['bedrag'], 'stap' => (int)$ins['stap'],
            'intro' => vul(scherm_l()[$taal]['intro'], $taal, $ins), 'introregel' => tt($ins['introregel'], $taal, $ins)];
    switch ($deel) {
        case 'd1':
            $uit['ideeen'] = array_pad(array_slice($mijn['d1']['ideeen'] ?? [], 0, MAX_IDEEEN), MAX_IDEEEN, '');
            $uit['verstuurd'] = isset($mijn['d1']);
            break;
        case 'd2':
            $uit['categorieen'] = array_map(fn($x) => ['id' => $x['id'], 't' => tt($x, $taal)], $c['categorieen']);
            $uit['verdeling'] = (object)(verdeling_van($mijn) ?? []);
            $uit['verstuurd'] = verdeling_van($mijn) !== null && (int)($mijn['d2']['bedrag'] ?? 0) === (int)$ins['bedrag'];
            $uit['verander'] = $mijn['d2']['verander'] ?? null;
            break;
        case 'd3':
            $uit['aanpakken'] = array_map(fn($x) => ['id' => $x['id'], 'naam' => tt($x['naam'], $taal), 'uitleg' => tt($x['uitleg'], $taal)], $c['aanpakken']);
            $uit['keuzes'] = (object)($mijn['d3']['keuzes'] ?? []);
            $uit['verstuurd'] = isset($mijn['d3']);
            break;
        case 'd4':
            $h = per_id($c['hoeken'])[$hoek] ?? null;
            if ($h) $uit['hoek'] = ['id' => $h['id'], 'links' => tt($h['links'], $taal, $ins), 'rechts' => tt($h['rechts'], $taal, $ins),
                                    'w' => $mijn['d4'][$h['id']] ?? null];
            break;
    }
    return $uit;
}

/** Welk deel (en welke hoek) iemand nu mag invullen. Een tester mag alles bekijken. */
function wat_open(string $naam, array $st): array {
    if (is_tester($naam) && in_array($_GET['deel'] ?? '', DELEN, true)) {
        $hoek = $_GET['hoek'] ?? ($st['hoek'] ?: 'h1');
        return [$_GET['deel'], $hoek];
    }
    return [$st['open'], $st['open'] === 'd4' ? $st['hoek'] : null];
}

if ($a === 'deel') {
    $naam = (string)($_GET['naam'] ?? '');
    $taal = taal_uit($_GET['taal'] ?? '');
    if (!mag_meedoen($naam)) klaar_met(['ok' => false, 'fout' => 'onbekende naam'], 400);
    [$deel, $hoek] = wat_open($naam, stand());
    if (!$deel) klaar_met(['ok' => true, 'open' => null, 'intro' => deel_voor('', null, $taal, $naam)]);
    klaar_met(['ok' => true, 'open' => $deel, 'hoek' => $hoek, 'cv' => data_tijd('content'), 'deel' => deel_voor($deel, $hoek, $taal, $naam)]);
}

if ($a === 'antwoord' && $post) {
    $in = invoer();
    $naam = (string)($in['naam'] ?? ''); $deel = (string)($in['deel'] ?? '');
    if (!mag_meedoen($naam)) klaar_met(['ok' => false, 'fout' => 'onbekende naam'], 400);
    $st = stand();
    $deelVan = $deel === 'd2v' ? 'd2' : $deel;
    if (!is_tester($naam) && $st['open'] !== $deelVan) klaar_met(['ok' => false, 'fout' => 'gesloten'], 409);
    $c = inhoud(); $ins = instellingen($c);
    switch ($deel) {
        case 'd1':
            $l = is_array($in['ideeen'] ?? null) ? $in['ideeen'] : [];
            $l = array_pad(array_map(fn($x) => regel($x, 100), array_slice(array_values($l), 0, MAX_IDEEEN)), MAX_IDEEEN, '');
            if (!array_filter($l, fn($x) => $x !== '')) klaar_met(['ok' => false, 'fout' => 'leeg'], 400);
            data_wijzig('answers', function ($d) use ($naam, $l) { $d[$naam]['d1'] = ['ideeen' => $l, 't' => date('c')]; return $d; });
            break;
        case 'd2':
            $v = is_array($in['verdeling'] ?? null) ? $in['verdeling'] : [];
            $ids = array_column($c['categorieen'], 'id');
            $schoon = [];
            foreach ($v as $cid => $x) {
                if (!in_array($cid, $ids, true) || !is_numeric($x)) klaar_met(['ok' => false, 'fout' => 'ongeldig'], 400);
                $x = (int)$x;
                if ($x < 0 || $x % (int)$ins['stap'] !== 0) klaar_met(['ok' => false, 'fout' => 'ongeldig'], 400);
                if ($x > 0) $schoon[$cid] = $x;
            }
            if (array_sum($schoon) !== (int)$ins['bedrag']) klaar_met(['ok' => false, 'fout' => 'niet alles verdeeld'], 400);
            data_wijzig('answers', function ($d) use ($naam, $schoon, $ins) {
                $oud = $d[$naam]['d2']['verander'] ?? null;
                $d[$naam]['d2'] = ['verdeling' => $schoon, 'bedrag' => (int)$ins['bedrag'], 't' => date('c')];
                /* De waaromvraag blijft staan zolang die categorie nog bij de grootste hoort. */
                if ($oud && in_array($oud['cat'] ?? '', grootste($schoon), true)) $d[$naam]['d2']['verander'] = $oud;
                return $d;
            });
            break;
        case 'd2v':
            $cat = (string)($in['cat'] ?? ''); $tekst = regel($in['tekst'] ?? '', 500);
            $mijn = antwoorden()[$naam] ?? [];
            $v = verdeling_van($mijn);
            if ($v === null || !in_array($cat, grootste($v), true)) klaar_met(['ok' => false, 'fout' => 'ongeldig'], 400);
            data_wijzig('answers', function ($d) use ($naam, $cat, $tekst) {
                if ($tekst === '') unset($d[$naam]['d2']['verander']);
                else $d[$naam]['d2']['verander'] = ['cat' => $cat, 'tekst' => $tekst];
                return $d;
            });
            break;
        case 'd3':
            $k = is_array($in['keuzes'] ?? null) ? $in['keuzes'] : [];
            $ids = array_column($c['aanpakken'], 'id');
            if (count($k) > MAX_AANPAKKEN) klaar_met(['ok' => false, 'fout' => 'te veel'], 400);
            $schoon = [];
            foreach ($k as $aid => $w) {
                if (!in_array($aid, $ids, true)) klaar_met(['ok' => false, 'fout' => 'ongeldig'], 400);
                $schoon[$aid] = regel($w, 140);
            }
            data_wijzig('answers', function ($d) use ($naam, $schoon) { $d[$naam]['d3'] = ['keuzes' => (object)$schoon, 't' => date('c')]; return $d; });
            break;
        case 'd4':
            $hid = (string)($in['hoek'] ?? ''); $w = $in['waarde'] ?? null;
            if (!in_array($hid, array_column($c['hoeken'], 'id'), true)) klaar_met(['ok' => false, 'fout' => 'ongeldig'], 400);
            if (!is_tester($naam) && $st['hoek'] !== $hid) klaar_met(['ok' => false, 'fout' => 'gesloten'], 409);
            if ($w !== null && (!is_numeric($w) || (int)$w < 0 || (int)$w >= HOEK_STAPPEN)) klaar_met(['ok' => false, 'fout' => 'ongeldig'], 400);
            data_wijzig('answers', function ($d) use ($naam, $hid, $w) {
                if ($w === null) unset($d[$naam]['d4'][$hid]); else $d[$naam]['d4'][$hid] = (int)$w;
                return $d;
            });
            break;
        default:
            klaar_met(['ok' => false, 'fout' => 'onbekend deel'], 400);
    }
    klaar_met(['ok' => true]);
}

/* ── Regie ─────────────────────────────────────────────────────────── */

/** Heeft een echte deelnemer al iets ingevuld dat van deze instelling afhangt? */
function heeft_d2(array $ant): bool { foreach (echte_antwoorden($ant) as $x) if (isset($x['d2'])) return true; return false; }
function heeft_hoek(array $ant, string $h): bool { foreach (echte_antwoorden($ant) as $x) if (isset($x['d4'][$h])) return true; return false; }

if ($a === 'regie' && !$post) {
    $st = stand(); $c = inhoud(); $ant = antwoorden();
    $sl = slides();
    $i = array_search($st['slide'], array_column($sl, 'id'), true) ?: 0;
    $aanw = data_lees('aanwezig', []);
    $ins = instellingen($c);
    $hoeken = array_map(fn($h) => ['id' => $h['id'], 'ronde' => $h['ronde'] ?? 2, 'eigen' => !empty($h['eigen']),
        'links' => tt($h['links'], 'nl', $ins), 'rechts' => tt($h['rechts'], 'nl', $ins),
        'geopend' => !empty($st['geopend']['h:' . $h['id']])] + (function ($r) { return ['d' => $r['d'], 'nl' => $r['links'], 'nr' => $r['rechts']]; })(hoek_analyse($h['id'], $ant, true)), $c['hoeken']);
    klaar_met([
        'stand' => $st,
        'slides' => array_map(fn($s) => $s + ['notitie' => NOTITIES[$s['id']] ?? ''], $sl),
        'pos' => $i + 1,
        'live' => slide_live($sl[$i], $st, $c, $ant),
        'volgend' => isset($sl[$i + 1]) ? slide_live($sl[$i + 1], $st, $c, $ant) : null,
        'deelnemers' => DEELNEMERS,
        'testers' => TEST_DEELNEMERS,
        'aanwezig' => array_combine(array_merge(DEELNEMERS, TEST_DEELNEMERS), array_map(function ($n) use ($aanw) {
            $x = $aanw[$n] ?? null;
            return $x ? ['sec' => time() - (int)$x['t'], 'taal' => $x['taal'] ?? ''] : null;
        }, array_merge(DEELNEMERS, TEST_DEELNEMERS))),
        'voortgang' => voortgang($c, $ant, $st),
        'instellingen' => $ins,
        'slot' => ['bedrag' => heeft_d2($ant) || heeft_hoek($ant, 'h3'), 'dagen' => heeft_hoek($ant, 'h3'),
                   'koppelen' => !empty($st['geopend']['d2'])],
        'categorieen' => $c['categorieen'],
        'aanpakken' => array_map(fn($x) => ['id' => $x['id'], 'naam' => $x['naam']['nl'], 'uitleg' => $x['uitleg']['nl'],
            'wie' => $x['wie']['nl'], 'opbrengst' => $x['opbrengst']['nl'], 'bewijs' => $x['bewijs'], 'richting' => $x['richting']], $c['aanpakken']),
        'd1' => ideeen_lijst($ant, $st),
        'd2' => verdeling_analyse($c, $ant),
        'd3' => aanpakken_analyse($c, $ant),
        'd4' => $hoeken,
        'zeideed' => zei_deed($c, $ant),
        'cv' => data_tijd('content'),
        'url' => DEELNEMER_URL,
    ]);
}

if ($a === 'regie' && $post) {
    $in = invoer();
    $actie = (string)($in['actie'] ?? '');
    $ids = array_column(slides(), 'id');
    switch ($actie) {
        case 'ga':
        case 'stap':
            stand_wijzig(function ($s) use ($in, $actie, $ids) {
                $nu = array_search($s['slide'] ?? '', $ids, true) ?: 0;
                $doel = $actie === 'ga' ? array_search((string)($in['slide'] ?? ''), $ids, true)
                                        : max(0, min(count($ids) - 1, $nu + (int)($in['richting'] ?? 1)));
                if ($doel !== false) { $s['slide'] = $ids[$doel]; $s['detail'] = null; }
                return $s;
            });
            break;
        case 'open':
            /* Een deel openzetten of alles dicht. Deel 4 gaat open met een hoek (actie hoek). */
            $deel = $in['deel'] ?? null;
            if ($deel !== null && !in_array($deel, ['d1', 'd2', 'd3'], true)) klaar_met(['ok' => false], 400);
            stand_wijzig(function ($s) use ($deel) {
                $s['open'] = $deel;
                if ($deel) $s['geopend'][$deel] = true;
                if ($deel !== 'd4') $s['hoek'] = null;
                return $s;
            });
            break;
        case 'hoek':
            $hid = (string)($in['hoek'] ?? '');
            if (!in_array($hid, array_column(inhoud()['hoeken'], 'id'), true)) klaar_met(['ok' => false], 400);
            stand_wijzig(function ($s) use ($hid) {
                $s['open'] = 'd4'; $s['hoek'] = $hid; $s['hoek_scherm'] = $hid;
                $s['geopend']['d4'] = true; $s['geopend']['h:' . $hid] = true;
                $s['slide'] = 'd4';
                return $s;
            });
            break;
        case 'hoek_scherm':
            $hid = (string)($in['hoek'] ?? '');
            stand_wijzig(function ($s) use ($hid) { $s['hoek_scherm'] = $hid ?: null; $s['slide'] = 'd4'; return $s; });
            break;
        case 'vrij':
            $k = (string)($in['wat'] ?? '');
            $ok = in_array($k, ['d1', 'd2', 'd3'], true) || in_array($k, array_column(inhoud()['hoeken'], 'id'), true);
            if (!$ok) klaar_met(['ok' => false], 400);
            stand_wijzig(function ($s) use ($k, $in) { if (!empty($in['aan'])) $s['vrij'][$k] = true; else unset($s['vrij'][$k]); return $s; });
            break;
        case 'detail':
            $id = $in['id'] ?? null;
            if ($id !== null && !in_array($id, array_column(inhoud()['aanpakken'], 'id'), true)) klaar_met(['ok' => false], 400);
            stand_wijzig(function ($s) use ($id) { $s['detail'] = $id; if ($id) $s['slide'] = 'd3'; return $s; });
            break;
        case 'koppel':
            $idee = (string)($in['idee'] ?? ''); $cid = $in['cat'] ?? null;
            if (!empty(stand()['geopend']['d2'])) klaar_met(['ok' => false, 'fout' => 'Deel 2 is al open geweest: koppelen kan niet meer.'], 409);
            if ($cid !== null && !in_array($cid, array_column(inhoud()['categorieen'], 'id'), true)) klaar_met(['ok' => false], 400);
            stand_wijzig(function ($s) use ($idee, $cid) { if ($cid === null) unset($s['koppel'][$idee]); else $s['koppel'][$idee] = $cid; return $s; });
            break;
        case 'categorie':
            /* Een nieuwe categorie uit een idee. Doet mee in deel 2, zolang dat nog niet open is geweest. */
            if (!empty(stand()['geopend']['d2'])) klaar_met(['ok' => false, 'fout' => 'Deel 2 is al open geweest: een nieuwe categorie kan niet meer.'], 409);
            $nl = regel($in['nl'] ?? '', 120); $en = regel($in['en'] ?? '', 120);
            $voor = $in['voor'] ?? ''; $vorm = $in['vorm'] ?? '';
            if ($nl === '' || !in_array($voor, ['mezelf', 'samen'], true) || !in_array($vorm, ['eenmalig', 'blijvend', 'doorlopend'], true))
                klaar_met(['ok' => false, 'fout' => 'Vul de tekst, voor wie en de vorm in.'], 400);
            bewaar_versie('content');
            $nieuw = null;
            data_wijzig('content', function ($c) use ($nl, $en, $voor, $vorm, $in, &$nieuw) {
                $max = 0;
                foreach ($c['categorieen'] ?? [] as $x) $max = max($max, (int)substr($x['id'], 1));
                $nieuw = 'c' . ($max + 1);
                $c['categorieen'][] = ['id' => $nieuw, 'voor' => $voor, 'vorm' => $vorm, 'nl' => $nl, 'en' => $en !== '' ? $en : $nl,
                                       'eigen' => true, 'uit_idee' => (string)($in['idee'] ?? '')];
                return $c;
            });
            if (!empty($in['idee'])) stand_wijzig(function ($s) use ($in, $nieuw) { $s['koppel'][(string)$in['idee']] = $nieuw; return $s; });
            klaar_met(['ok' => true, 'id' => $nieuw]);
        case 'categorie_weg':
            /* Alleen een eigen categorie, en alleen zolang deel 2 nog niet open is geweest. */
            $cid = (string)($in['id'] ?? '');
            if (!empty(stand()['geopend']['d2'])) klaar_met(['ok' => false, 'fout' => 'Deel 2 is al open geweest.'], 409);
            bewaar_versie('content');
            data_wijzig('content', function ($c) use ($cid) {
                $c['categorieen'] = array_values(array_filter($c['categorieen'], fn($x) => !($x['id'] === $cid && !empty($x['eigen']))));
                return $c;
            });
            stand_wijzig(function ($s) use ($cid) { $s['koppel'] = array_filter($s['koppel'], fn($x) => $x !== $cid); return $s; });
            break;
        case 'instellingen':
            $ant = antwoorden(); $oud = instellingen();
            $n = $in['instellingen'] ?? [];
            $bedrag = (int)($n['bedrag'] ?? $oud['bedrag']); $stap = (int)($n['stap'] ?? $oud['stap']); $dagen = (int)($n['dagen'] ?? $oud['dagen']);
            if ($bedrag <= 0 || $stap <= 0 || $bedrag % $stap !== 0) klaar_met(['ok' => false, 'fout' => 'Het bedrag moet een veelvoud van de stap zijn.'], 400);
            if ($dagen <= 0 || $dagen > 60) klaar_met(['ok' => false, 'fout' => 'Kies een aantal dagen tussen 1 en 60.'], 400);
            $wijzigtGeld = $bedrag !== (int)$oud['bedrag'] || $stap !== (int)$oud['stap'];
            if ($wijzigtGeld && (heeft_d2($ant) || heeft_hoek($ant, 'h3')))
                klaar_met(['ok' => false, 'fout' => 'Er zijn al antwoorden op deel 2 of hoek 3: het bedrag ligt vast.'], 409);
            if ($dagen !== (int)$oud['dagen'] && heeft_hoek($ant, 'h3'))
                klaar_met(['ok' => false, 'fout' => 'Er zijn al antwoorden op hoek 3: het aantal dagen ligt vast.'], 409);
            bewaar_versie('content');
            data_wijzig('content', function ($c) use ($bedrag, $stap, $dagen, $n) {
                $c['instellingen']['bedrag'] = $bedrag; $c['instellingen']['stap'] = $stap; $c['instellingen']['dagen'] = $dagen;
                $c['instellingen']['introregel'] = ['nl' => regel($n['introregel']['nl'] ?? '', 300), 'en' => regel($n['introregel']['en'] ?? '', 300)];
                $c['instellingen']['schermtaal'] = taal_uit($n['schermtaal'] ?? 'nl');
                return $c;
            });
            break;
        case 'nieuwe_hoek':
            $l = ['nl' => regel($in['links']['nl'] ?? '', 160), 'en' => regel($in['links']['en'] ?? '', 160)];
            $r = ['nl' => regel($in['rechts']['nl'] ?? '', 160), 'en' => regel($in['rechts']['en'] ?? '', 160)];
            if ($l['nl'] === '' || $r['nl'] === '') klaar_met(['ok' => false, 'fout' => 'Vul links en rechts in, minstens in het Nederlands.'], 400);
            if ($l['en'] === '') $l['en'] = $l['nl'];
            if ($r['en'] === '') $r['en'] = $r['nl'];
            bewaar_versie('content');
            $nieuw = null;
            data_wijzig('content', function ($c) use ($l, $r, &$nieuw) {
                $max = 0;
                foreach ($c['hoeken'] ?? [] as $x) $max = max($max, (int)substr($x['id'], 1));
                $nieuw = 'h' . ($max + 1);
                $c['hoeken'][] = ['id' => $nieuw, 'ronde' => 2, 'eigen' => true, 'links' => $l, 'rechts' => $r];
                return $c;
            });
            klaar_met(['ok' => true, 'id' => $nieuw]);
        default:
            klaar_met(['ok' => false, 'fout' => 'onbekende actie'], 400);
    }
    klaar_met(['ok' => true]);
}

klaar_met(['ok' => false, 'fout' => 'onbekend verzoek'], 404);
