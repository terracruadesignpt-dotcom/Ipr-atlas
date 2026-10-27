<?php
// Testes do m90123 v2 (ES-12). php t-es12.php
require '/home/claude/espanha/modulos/testes/wp-stub.php';
function wp_doing_ajax() { return false; }
function get_privacy_policy_url() { return 'https://terracruadesign.pt/politica-de-privacidade/'; }
function add_shortcode( $t, $cb ) { $GLOBALS['__sc'][ $t ] = $cb; }
$GLOBALS['__es'] = false; function tcd_esp_lingua_es() { return $GLOBALS['__es']; }
require __DIR__ . '/m90123.php';
function pagina() { ob_start(); do_action( 'wp_footer' ); return ob_get_clean(); }
$pt = pagina();
ok( false !== strpos( $pt, 'Este site usa cookies' ) && false !== strpos( $pt, '>Recusar<' ) && false !== strpos( $pt, 'politica-de-privacidade' ) && false !== strpos( $pt, '"Guardar escolha"' ), 'PT: textos e ligação como antes' );
$GLOBALS['__es'] = true; $es = pagina();
ok( false !== strpos( $es, 'Este sitio usa cookies' ) && false !== strpos( $es, '>Rechazar<' ) && false !== strpos( $es, '>Elegir<' ) && false !== strpos( $es, '>Aceptar<' ) && false !== strpos( $es, '"Guardar elecci' ), 'ES: textos em castelhano, incluindo o botão que muda' );
ok( false !== strpos( $es, '/es/cookies/' ) && false === strpos( $es, 'politica-de-privacidade' ), 'ES: ligação à política de cookies espanhola' );
ok( false === strpos( $es, 'Recusar' ) && false === strpos( $es, 'Escolher' ) && false === strpos( $es, 'Necessários' ), 'ES: sem restos em português' );
ok( false !== strpos( call_user_func( $GLOBALS['__sc']['tcd_cookies'] ), 'Preferencias de cookies' ), 'shortcode em castelhano' );
ok( substr_count( $es, "tcd_ck" ) === substr_count( $pt, "tcd_ck" ), 'o mesmo cookie e o mesmo comportamento nas duas línguas' );
fim();
