<?php
/**
 * De knoppen die Gerke zelf mag omzetten. Alles hier kan tot vlak voor de
 * sessie veranderen zonder dat er iets herbouwd hoeft te worden.
 *
 * Bedrag, stapgrootte, het aantal dagen bij hoek 3, de introregel en de taal
 * van het scherm staan niet hier maar in de regie, tab Instellingen: die kun
 * je tijdens de sessie nog aanpassen.
 */
require_once __DIR__ . '/paden.php';

/** Het adres dat de deelnemers intypen. Komt vanzelf op de open-slides. */
const DEELNEMER_URL = 'thisismakingwaves.com/session5';

/**
 * De namen in het keuzelijstje. VOORBEELD: vervang door de echte namen.
 * Wie hier niet staat, kan niet meedoen.
 */
const DEELNEMERS = [
    'Persoon 01', 'Persoon 02', 'Persoon 03', 'Persoon 04', 'Persoon 05',
    'Persoon 06', 'Persoon 07', 'Persoon 08', 'Persoon 09', 'Persoon 10',
    'Persoon 11', 'Persoon 12', 'Persoon 13', 'Persoon 14', 'Persoon 15',
    'Persoon 16', 'Persoon 17', 'Persoon 18', 'Persoon 19', 'Persoon 20',
];

/**
 * Wie mag meedoen om de pagina te bekijken, zonder dat het ergens meetelt:
 * niet in de uitkomsten, niet in de tellers, niet in de export. Staat niet op
 * het naamscherm; binnenkomen via /session5/?naam=Gerke.
 */
const TEST_DEELNEMERS = ['Gerke'];

/**
 * De taal waarmee iemand begint. Wie hier niet staat, krijgt Nederlands.
 * Wisselen kan altijd met NL/EN rechtsboven. Voorbeeld: ['Sofia' => 'en'].
 */
const DEELNEMER_TAAL = [];

/** Hoe vaak het scherm en de telefoons bij de server langsgaan, in milliseconden. */
const POLL_MS = 1000;
