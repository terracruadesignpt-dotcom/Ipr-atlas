<?php
// Testes dos módulos de Espanha com o m90071 e o m90024 alterados. Corre-se: php t-espanha.php
require __DIR__ . '/wp-stub.php';
function wp_parse_url( $u, $c = -1 ) { return parse_url( $u, $c ); }
function wp_doing_ajax() { return false; }
function is_404() { return false; }
function shortcode_exists( $s ) { return false; }
function tcd_area_geometria( $g ) { return 50000.0; }
$M = __DIR__ . '/..';
foreach ( array( 'm90024', 'm90071', 'm90240', 'm90241', 'm90242', 'm90243', 'm90244', 'm90245' ) as $m ) { require "$M/$m.php"; }

// --- identificadores
ok( tcd_esp_nif( '12345678Z' )['ok'], 'DNI válido' );
ok( ! tcd_esp_nif( '12345678A' )['ok'], 'DNI com letra errada' );
ok( tcd_esp_nif( 'X1234567L' )['ok'] && 'nie' === tcd_esp_nif( 'X1234567L' )['tipo'], 'NIE válido' );
ok( tcd_esp_nif( 'ES A28015865' )['ok'], 'CIF Telefónica com prefixo ES e espaço' );
ok( tcd_esp_nif( 'Q2826000H' )['ok'] && ! tcd_esp_nif( 'Q2826000A' )['ok'], 'CIF AEAT (letra obrigatória)' );
$r = tcd_esp_ref_catastral( '9872023VH5797S0001WX' ); ok( $r['ok'] && $r['dc_ok'], 'referencia catastral de 20 com controlo' );
$r = tcd_esp_ref_catastral( '06015A01200345' ); ok( $r['ok'] && 12 === $r['rustica']['poligono'] && 345 === $r['rustica']['parcela'], 'rústica de 14: polígono e parcela' );

// --- interruptor e guarda do m90024
$GLOBALS['__opt']['tcd_esp_aberto'] = '0';
ok( ! tcd_gd_ponto_ok( array( -3.70, 40.42 ) ), 'Madrid recusado com Espanha fechada (Badajoz cabe na caixa antiga e é apanhado antes pelo m90071)' );
ok( tcd_gd_ponto_ok( array( -8.06, 37.51 ) ), 'Almodôvar aceite' );
$GLOBALS['__opt']['tcd_esp_aberto'] = '1';
ok( tcd_gd_ponto_ok( array( -6.97, 38.78 ) ), 'Badajoz aceite com Espanha aberta' );
ok( ! tcd_gd_ponto_ok( array( -16.5, 28.35 ) ), 'Tenerife recusado (fase 2)' );
ok( ! tcd_gd_ponto_ok( array( 2.89, 42.70 ) ), 'Perpignan recusado' );

// --- m90071: interesse vs encomenda
function pedido( $lng, $lat ) {
	$d = 0.002; $g = array( 'type' => 'Polygon', 'coordinates' => array( array( array( $lng, $lat ), array( $lng + $d, $lat ), array( $lng + $d, $lat + $d ), array( $lng, $lat + $d ), array( $lng, $lat ) ) ) );
	$GLOBALS['__tr'] = array();
	return apply_filters( 'rest_pre_dispatch', null, null, new WP_REST_Request( 'POST', '/tcd/v1/pedido-base', array( 'geojson' => json_encode( $g ), 'email' => 'a@b.es', 'nome' => 'X' ) ) );
}
$GLOBALS['__opt']['tcd_esp_aberto'] = '0';
$r = pedido( -6.97, 38.78 ); ok( $r instanceof WP_REST_Response && ! empty( $r->data['interesse'] ) && 'ES' === $r->data['pais'], 'Badajoz fechado → interesse ES' );
$r = pedido( -8.72, 42.24 ); ok( $r instanceof WP_REST_Response && 'ES' === $r->data['pais'], 'Vigo (antes tratado como Portugal) → interesse ES' );
$r = pedido( -7.035, 38.88 ); ok( null === $r, 'Caia (fronteira) → caminho português' );
$r = pedido( -8.06, 37.51 ); ok( null === $r, 'Almodôvar → caminho português' );
$GLOBALS['__opt']['tcd_esp_aberto'] = '1';
$r = pedido( -6.97, 38.78 ); ok( null === $r, 'Badajoz aberto → encomenda normal' );
$r = pedido( -16.5, 28.35 ); ok( $r instanceof WP_REST_Response && 'ES' === $r->data['pais'], 'Tenerife aberto → continua interesse' );
$r = pedido( 2.89, 42.70 ); ok( $r instanceof WP_REST_Response && 'FR' === $r->data['pais'], 'Perpignan → interesse FR' );

// --- /es
ok( tcd_esp_caminho_es( '/es/cartografia/?x=1' ) && tcd_esp_caminho_es( '/es' ) && ! tcd_esp_caminho_es( '/estudos/' ), 'reconhece /es e não /estudos' );
ok( '/cartografia/?x=1' === tcd_esp_sem_prefixo( '/es/cartografia/?x=1' ) && '/' === tcd_esp_sem_prefixo( '/es' ), 'tira o prefixo' );
fim();
