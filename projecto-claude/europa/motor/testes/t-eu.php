<?php
// Testes do m90300 e m90301 (motor europeu) com os módulos de Espanha. php t-eu.php
require '/home/claude/espanha/modulos/testes/wp-stub.php';
function wp_parse_url( $u, $c = -1 ) { return parse_url( $u, $c ); }
function wp_doing_ajax() { return false; }
function is_404() { return false; }
function shortcode_exists( $s ) { return false; }
function tcd_area_geometria( $g ) { return 50000.0; }
if ( ! function_exists( 'add_query_arg' ) ) { function add_query_arg( $a, $u ) { return $u; } }
$M = '/home/claude/espanha/modulos';
foreach ( array( 'm90024', 'm90071', 'm90240', 'm90241', 'm90242', 'm90243', 'm90244', 'm90245', 'm90249' ) as $m ) { if ( 'm90071' === $m ) { require __DIR__ . '/../m90071.php'; continue; } require "$M/$m.php"; }
require __DIR__ . '/../m90300.php'; require __DIR__ . '/../m90301.php';
$t0 = microtime( true );
$casos = array( array( 2.35, 48.85, 'FR' ), array( 16.37, 48.21, 'AT' ), array( 12.49, 41.89, 'IT' ), array( -21.9, 64.13, 'IS' ), array( 13.4, 52.52, 'DE' ), array( 21.01, 52.23, 'PL' ),
	array( 23.73, 37.98, 'GR' ), array( 4.9, 52.37, 'NL' ), array( 7.44, 46.95, 'CH' ), array( 6.13, 49.61, 'LU' ), array( -1.5, 52.5, 'GB' ), array( -8.5, 53.0, 'IE' ), array( 14.51, 46.05, 'SI' ),
	array( 24.94, 60.17, 'FI' ), array( 10.75, 59.91, 'NO' ), array( 18.07, 59.33, 'SE' ), array( 12.57, 55.68, 'DK' ), array( 33.36, 35.17, 'CY' ), array( 14.51, 35.9, 'MT' ), array( 30.52, 50.45, 'UA' ),
	array( -74.0, 40.7, '' ), array( 37.6, 55.75, '' ), array( -9.14, 38.72, 'PT' ), array( -3.7, 40.42, 'ES' ), array( 1.52, 42.51, 'AD' ), array( 9.19, 45.46, 'IT' ), array( 11.25, 43.77, 'IT' ) );
foreach ( $casos as $c ) { $p = tcd_eu_pais( $c[0], $c[1] ); ok( $c[2] === $p, "ponto {$c[0]},{$c[1]} → " . ( $c[2] ?: 'fora' ) . " (deu " . ( $p ?: 'fora' ) . ')' ); }
ok( microtime( true ) - $t0 < 2, 'detecção rápida (27 pontos em menos de 2 s, com descompressão)' );
function pedido( $lng, $lat, $email = 'a@b.eu' ) {
	$d = 0.002; $g = array( 'type' => 'Polygon', 'coordinates' => array( array( array( $lng, $lat ), array( $lng + $d, $lat ), array( $lng + $d, $lat + $d ), array( $lng, $lat + $d ), array( $lng, $lat ) ) ) );
	$GLOBALS['__tr'] = array();
	return apply_filters( 'rest_pre_dispatch', null, null, new WP_REST_Request( 'POST', '/tcd/v1/pedido-base', array( 'geojson' => json_encode( $g ), 'email' => $email, 'nome' => 'X' ) ) );
}
$r = pedido( 16.37, 48.21 ); ok( $r instanceof WP_REST_Response && 'AT' === $r->data['pais'] && false !== strpos( $r->data['mensagem'], 'LiDAR' ) && false !== strpos( $r->data['mensagem'], 'Ihr Land' ), 'Viena: interesse, resposta em alemão, LiDAR pronto' );
$l = get_option( 'tcd_intl_interesse' ); $u = end( $l ); ok( 'AT' === $u['pais'] && 'eu_pronto' === $u['nota'] && 'de' === $u['lingua'], 'interesse guardado com país, nota e língua' );
$r = pedido( -21.9, 64.13 ); ok( 'IS' === $r->data['pais'] && false !== strpos( $r->data['mensagem'], 'not yet found' ), 'Islândia: sem LiDAR, resposta em inglês' );
$r = pedido( 2.35, 48.85 ); ok( 'FR' === $r->data['pais'] && false !== strpos( $r->data['mensagem'], 'Votre pays' ), 'Paris: em francês' );
$_COOKIE['tcd_lingua'] = 'es'; $r = pedido( 12.49, 41.89 ); ok( false !== strpos( $r->data['mensagem'], 'Su país' ), 'quem navega em castelhano recebe castelhano mesmo em Itália' ); unset( $_COOKIE['tcd_lingua'] );
$r = pedido( 12.49, 41.89, 'mau' ); ok( $r instanceof WP_Error && false !== strpos( $r->get_error_message(), 'e-mail' ), 'sem e-mail válido: pede e-mail na língua do país (italiano)' );
$n = count( get_option( 'tcd_intl_interesse' ) ); pedido( 16.37, 48.21 ); ok( $n === count( get_option( 'tcd_intl_interesse' ) ), 'mesmo pedido no mesmo dia não duplica' );
$r = pedido( -8.06, 37.51 ); ok( null === $r, 'Almodôvar: segue o caminho português' );
$GLOBALS['__opt']['tcd_esp_aberto'] = '0'; $r = pedido( -3.7, 40.42 ); ok( $r instanceof WP_REST_Response && 'ES' === $r->data['pais'] && empty( $r->data['nota'] ), 'Madrid: o m90301 não toca (fica com o m90071)' );
$GLOBALS['__opt']['tcd_eu_paises'] = '{"AT":{"estado":"aberto"},"XX":{"estado":"aberto"},"IT":{"estado":"mau"}}'; tcd_eu_registo( true );
$r = pedido( 16.37, 48.21 ); ok( null === $r && true === apply_filters( 'tcd_gd_ponto_ok', false, array( 16.37, 48.21 ) ), 'Áustria aberta pela opção: segue para encomenda e a guarda aceita o ponto' );
$info = tcd_eu_info( 'IT' ); ok( 'interesse' === $info['estado'], 'valor inválido na opção é ignorado' );
ok( false === apply_filters( 'tcd_gd_ponto_ok', false, array( 12.49, 41.89 ) ), 'Itália fechada: a guarda continua a recusar' );
$rot = $GLOBALS['__rotas']['/tcd/v1/eu/paises'] ?? null; do_action( 'rest_api_init' ); $rot = $GLOBALS['__rotas']['/tcd/v1/eu/paises'];
$o = call_user_func( $rot['callback'] )->data; ok( 49 <= count( $o ) && 'aberto' === $o['AT']['estado'] && ! isset( $o['RU'] ), 'GET /eu/paises: registo sem a Rússia' );
$GLOBALS['__opt']['tcd_eu_off'] = '1'; $r = pedido( 12.49, 41.89 ); ok( ! ( $r instanceof WP_REST_Response && isset( $r->data['nota'] ) ), 'interruptor desliga o motor' );
fim();
