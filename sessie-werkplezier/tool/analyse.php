<?php
/**
 * Van ruwe antwoorden naar wat de regie en het scherm tonen. Alleen echte
 * deelnemers tellen mee; testers nergens.
 *
 * Het scherm krijgt alleen tellingen, totalen en losse stippen, nooit een
 * naam en nooit een gemiddelde of mediaan. De regie krijgt alles, met namen.
 */
require_once __DIR__ . '/kern.php';

/* ── Deel 1 ───────────────────────────────────────────────────────── */

/** Alle ideeën met naam, plek en gekoppelde categorie. Voor de regie. */
function ideeen_lijst(array $ant, array $st): array {
    $uit = [];
    foreach (echte_antwoorden($ant) as $naam => $a) {
        foreach (($a['d1']['ideeen'] ?? []) as $plek => $tekst) {
            $tekst = trim((string)$tekst);
            if ($tekst === '') continue;
            $sleutel = $naam . '#' . $plek;
            $uit[] = ['naam' => $naam, 'plek' => $plek, 'sleutel' => $sleutel, 'tekst' => $tekst,
                      'cat' => $st['koppel'][$sleutel] ?? null];
        }
    }
    return $uit;
}

/** Voor het scherm: de ideeën zonder namen, op alfabet, gelijke ideeën samengevoegd met een aantal. */
function ideeen_scherm(array $ant): array {
    $per = [];
    foreach (echte_antwoorden($ant) as $a) {
        foreach (($a['d1']['ideeen'] ?? []) as $tekst) {
            $tekst = trim((string)$tekst);
            if ($tekst === '') continue;
            $k = mb_strtolower(preg_replace('/\s+/u', ' ', $tekst));
            if (!isset($per[$k])) $per[$k] = ['t' => $tekst, 'n' => 0];
            $per[$k]['n']++;
        }
    }
    $l = array_values($per);
    usort($l, fn($a, $b) => strcasecmp($a['t'], $b['t']));
    return $l;
}

/* ── Deel 2 ───────────────────────────────────────────────────────── */

/** De verdeling van één persoon, of null als die nog niet verstuurd is. */
function verdeling_van(array $a): ?array {
    $v = $a['d2']['verdeling'] ?? null;
    return is_array($v) ? array_filter(array_map('intval', $v), fn($x) => $x > 0) : null;
}

/** De categorie(ën) waar iemand het meeste in zette. */
function grootste(array $verdeling): array {
    if (!$verdeling) return [];
    $max = max($verdeling);
    return array_keys(array_filter($verdeling, fn($x) => $x === $max));
}

function verdeling_analyse(array $c, array $ant): array {
    $cats = $c['categorieen'];
    $per = [];
    foreach ($cats as $cat) $per[$cat['id']] = ['id' => $cat['id'], 'nl' => $cat['nl'], 'en' => $cat['en'],
        'voor' => $cat['voor'], 'vorm' => $cat['vorm'], 'eigen' => !empty($cat['eigen']),
        'totaal' => 0, 'n' => 0, 'bedragen' => []];
    $voor = ['mezelf' => 0, 'samen' => 0];
    $vorm = ['eenmalig' => 0, 'blijvend' => 0, 'doorlopend' => 0];
    $personen = [];
    $catVan = per_id($cats);
    $oudBedrag = 0;
    $bedrag = (int)instellingen($c)['bedrag'];
    foreach (echte_antwoorden($ant) as $naam => $a) {
        $v = verdeling_van($a);
        if ($v === null) continue;
        if ((int)($a['d2']['bedrag'] ?? $bedrag) !== $bedrag) $oudBedrag++;
        foreach ($v as $cid => $x) {
            if (!isset($per[$cid])) continue;
            $per[$cid]['totaal'] += $x; $per[$cid]['n']++;
            $per[$cid]['bedragen'][] = ['naam' => $naam, 'b' => $x];
            $voor[$catVan[$cid]['voor']] = ($voor[$catVan[$cid]['voor']] ?? 0) + $x;
            $vorm[$catVan[$cid]['vorm']] = ($vorm[$catVan[$cid]['vorm']] ?? 0) + $x;
        }
        $personen[] = ['naam' => $naam, 'verdeling' => $v, 'ncat' => count($v), 'totaal' => array_sum($v),
                       'grootste' => grootste($v), 'verander' => $a['d2']['verander'] ?? null];
    }
    $lijst = array_values($per);
    usort($lijst, fn($a, $b) => [$b['totaal'], $b['n']] <=> [$a['totaal'], $a['n']]);
    return ['categorieen' => $lijst, 'voor' => $voor, 'vorm' => $vorm, 'personen' => $personen,
            'verstuurd' => count($personen), 'oud_bedrag' => $oudBedrag];
}

/* ── Deel 3 ───────────────────────────────────────────────────────── */

function aanpakken_analyse(array $c, array $ant): array {
    $per = [];
    foreach ($c['aanpakken'] as $x) $per[$x['id']] = ['id' => $x['id'], 'naam' => $x['naam']['nl'] ?? '', 'n' => 0, 'namen' => []];
    $waarom = [];
    foreach (echte_antwoorden($ant) as $naam => $a) {
        foreach (($a['d3']['keuzes'] ?? []) as $aid => $w) {
            if (!isset($per[$aid])) continue;
            $per[$aid]['n']++; $per[$aid]['namen'][] = $naam;
            if (trim((string)$w) !== '') $waarom[] = ['naam' => $naam, 'aanpak' => $aid, 'tekst' => trim((string)$w)];
        }
    }
    return ['aanpakken' => array_values($per), 'waarom' => $waarom];
}

/* ── Deel 4 ───────────────────────────────────────────────────────── */

/** Per hoek de losse antwoorden (0 tot 5) en hoeveel links en rechts. */
function hoek_analyse(string $hid, array $ant, bool $metNamen): array {
    $w = [];
    foreach (echte_antwoorden($ant) as $naam => $a) {
        $x = $a['d4'][$hid] ?? null;
        if ($x === null) continue;
        $w[] = $metNamen ? ['naam' => $naam, 'w' => (int)$x] : (int)$x;
    }
    $waarden = $metNamen ? array_column($w, 'w') : $w;
    if (!$metNamen) sort($w);   /* gesorteerd, zodat een stip niet naar een naam te leiden is */
    return ['d' => $w,
            'links' => count(array_filter($waarden, fn($x) => $x < HOEK_STAPPEN / 2)),
            'rechts' => count(array_filter($waarden, fn($x) => $x >= HOEK_STAPPEN / 2))];
}

/* ── Zei tegenover deed (alleen regie) ────────────────────────────── */

function zei_deed(array $c, array $ant): array {
    $catVan = per_id($c['categorieen']);
    $uit = [];
    foreach (DEELNEMERS as $naam) {
        $a = $ant[$naam] ?? [];
        $v = verdeling_van($a);
        $rij = ['naam' => $naam, 'h1' => $a['d4']['h1'] ?? null, 'h2' => $a['d4']['h2'] ?? null,
                'samen' => null, 'mezelf' => null, 'eenmalig' => null, 'blijvend' => null, 'doorlopend' => null, 'totaal' => null];
        if ($v !== null) {
            $rij['totaal'] = array_sum($v);
            foreach (['samen', 'mezelf'] as $k) $rij[$k] = 0;
            foreach (['eenmalig', 'blijvend', 'doorlopend'] as $k) $rij[$k] = 0;
            foreach ($v as $cid => $x) {
                if (!isset($catVan[$cid])) continue;
                $rij[$catVan[$cid]['voor']] += $x;
                $rij[$catVan[$cid]['vorm']] += $x;
            }
        }
        if ($rij['h1'] === null && $rij['h2'] === null && $v === null) continue;
        $uit[] = $rij;
    }
    return $uit;
}

/* ── Voortgang ────────────────────────────────────────────────────── */

function voortgang(array $c, array $ant, array $st): array {
    $hoeken = array_values(array_filter(array_column($c['hoeken'], 'id'), fn($h) => !empty($st['geopend']['h:' . $h])));
    $uit = [];
    foreach (DEELNEMERS as $naam) {
        $a = $ant[$naam] ?? [];
        $uit[$naam] = [
            'd1' => count(array_filter($a['d1']['ideeen'] ?? [], fn($x) => trim((string)$x) !== '')),
            'd2' => verdeling_van($a) !== null,
            'd2v' => trim((string)($a['d2']['verander']['tekst'] ?? '')) !== '',
            'd3' => isset($a['d3']) ? count($a['d3']['keuzes'] ?? []) : null,
            'd4' => count(array_filter($hoeken, fn($h) => isset($a['d4'][$h]))),
            'd4_van' => count($hoeken),
            'hoek' => $st['hoek'] && isset($a['d4'][$st['hoek']]),
        ];
    }
    return $uit;
}
