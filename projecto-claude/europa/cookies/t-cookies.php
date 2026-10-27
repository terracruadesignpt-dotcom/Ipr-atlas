<?php
// Testes do m90123 v3 (painel de cookies em 7 línguas). php t-cookies.php
require '/home/claude/espanha/modulos/testes/wp-stub.php';
function wp_doing_ajax() { return false; }
function get_privacy_policy_url() { return 'https://terracruadesign.pt/politica-de-privacidade/'; }
function add_shortcode( $t, $cb ) { $GLOBALS['__sc'][ $t ] = $cb; }
$GLOBALS['__l'] = 'pt'; function tcd_i18n_lingua() { return $GLOBALS['__l']; }
$GLOBALS['__es'] = false; function tcd_esp_lingua_es() { return $GLOBALS['__es']; }
require __DIR__ . '/m90123.php';
function pagina() { ob_start(); do_action( 'wp_footer' ); return ob_get_clean(); }
$pt = pagina(); ok( false !== strpos( $pt, 'Este site usa cookies' ) && false !== strpos( $pt, '>Recusar<' ) && false !== strpos( $pt, 'politica-de-privacidade' ), 'PT igual à v1' );
$GLOBALS['__es'] = true; $es = pagina(); ok( false !== strpos( $es, '>Rechazar<' ) && false !== strpos( $es, '/es/cookies/' ), 'ES como na v2' ); $GLOBALS['__es'] = false;
foreach ( array( 'en' => 'Reject', 'fr' => 'Refuser', 'de' => 'Ablehnen', 'it' => 'Rifiuta', 'nl' => 'Weigeren' ) as $l => $w ) { $GLOBALS['__l'] = $l; $h = pagina(); ok( false !== strpos( $h, '>' . $w . '<' ) && false === strpos( $h, 'Recusar' ), "$l: «{$w}» e sem português" ); }
$GLOBALS['__l'] = 'pl'; ok( false !== strpos( pagina(), '>Reject<' ), 'língua sem tradução: inglês' );
$GLOBALS['__l'] = 'fr'; $GLOBALS['__opt']['tcd_ck_politicas'] = '{"fr":"/fr/cookies/"}'; ok( false !== strpos( pagina(), '/fr/cookies/' ), 'política francesa pela opção' );
$GLOBALS['__l'] = 'de'; ok( false !== strpos( pagina(), '"Auswahl speichern"' ), 'botão que muda também traduzido' );
fim();
