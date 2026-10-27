<?php
// Testes do m90249 (regiões abertas em Espanha) com os módulos de Espanha. Corre-se: php t-regioes.php
require __DIR__ . '/wp-stub.php';
function wp_parse_url( $u, $c = -1 ) { return parse_url( $u, $c ); }
function wp_doing_ajax() { return false; }
function is_404() { return false; }
function shortcode_exists( $s ) { return false; }
function tcd_area_geometria( $g ) { return 50000.0; }
if ( ! function_exists( 'add_query_arg' ) ) { function add_query_arg( $a, $u ) { return $u . '?' . http_build_query( $a ); } }
$M = __DIR__ . '/..';
foreach ( array( 'm90024', 'm90071', 'm90240', 'm90241', 'm90242', 'm90243', 'm90244', 'm90245', 'm90249' ) as $m ) { require "$M/$m.php"; }
$GLOBALS['__ccaa'] = array();
$GLOBALS['__http'] = function ( $u, $a ) {
	if ( false !== strpos( $u, 'unidades-administrativas' ) ) {
		parse_str( parse_url( $u, PHP_URL_QUERY ), $q ); $b = explode( ',', $q['BBOX'] ); $lng = ( (float) $b[1] + (float) $b[3] ) / 2;
		foreach ( $GLOBALS['__ign'] as $c ) { if ( abs( $lng - $c[0] ) < 0.01 ) { return array( 'code' => 200, 'body' => json_encode( array( 'features' => array(
			array( 'properties' => array( 'nationallevel' => 'https://inspire.ec.europa.eu/codelist/AdministrativeHierarchyLevel/4thOrder', 'nationalcode' => '34' . $c[1] . '0606083' ) ),
			array( 'properties' => array( 'nationallevel' => 'https://inspire.ec.europa.eu/codelist/AdministrativeHierarchyLevel/2ndOrder', 'nationalcode' => '34' . $c[1] . '0000000' ) ) ) ) ) ); } }
		return array( 'code' => 200, 'body' => '{"type":"FeatureCollection","features":[]}' );
	}
	if ( false === strpos( $u, 'cartociudad.es' ) ) { return new WP_Error( 'x', 'x' ); }
	parse_str( parse_url( $u, PHP_URL_QUERY ), $q ); $lng = (float) $q['lon'];
	foreach ( $GLOBALS['__ccaa'] as $c ) { if ( abs( $lng - $c[0] ) < 0.01 ) { return array( 'code' => 200, 'body' => json_encode( array( 'comunidadAutonomaCode' => $c[1] ) ) ); } }
	return new WP_Error( 'sem', 'sem resposta' );
};
$GLOBALS['__ign'] = array();
function pedido( $lng, $lat, $email = 'a@b.es' ) {
	$d = 0.002; $g = array( 'type' => 'Polygon', 'coordinates' => array( array( array( $lng, $lat ), array( $lng + $d, $lat ), array( $lng + $d, $lat + $d ), array( $lng, $lat + $d ), array( $lng, $lat ) ) ) );
	foreach ( array_keys( $GLOBALS['__tr'] ?? array() ) as $k ) { if ( 0 !== strpos( $k, 'tcd_esreg_' ) || 0 === strpos( $k, 'tcd_esreg_tg' ) ) { unset( $GLOBALS['__tr'][ $k ] ); } }
	return apply_filters( 'rest_pre_dispatch', null, null, new WP_REST_Request( 'POST', '/tcd/v1/pedido-base', array( 'geojson' => json_encode( $g ), 'email' => $email, 'nome' => 'X' ) ) );
}
$GLOBALS['__ign'] = array( array( -6.97, '11' ), array( -4.73, '07' ), array( -0.88, '02' ) ); // IGN (campo)
$GLOBALS['__ccaa'] = array( array( -3.70, '13' ) ); // só o CartoCiudad sabe (recurso)
$GLOBALS['__opt']['tcd_esp_aberto'] = '0';
$r = pedido( -6.97, 38.78 ); ok( $r instanceof WP_REST_Response && ! empty( $r->data['interesse'] ) && empty( $r->data['regiao'] ), 'Espanha fechada: o m90249 não intervém e o m90071 regista interesse' );
$GLOBALS['__opt']['tcd_esp_aberto'] = '1';
$r = pedido( -6.97, 38.78 ); ok( null === $r, 'Badajoz (Extremadura, 11) aberto → encomenda normal' );
$r = pedido( -3.70, 40.42 ); ok( null === $r, 'Madrid (13) pelo CartoCiudad quando o IGN não responde → encomenda normal' );
$n0 = count( (array) get_option( 'tcd_intl_interesse', array() ) );
$r = pedido( -4.73, 41.65 ); ok( $r instanceof WP_REST_Response && 'Castilla y León' === $r->data['regiao'] && ! empty( $r->data['interesse'] ), 'Valladolid (Castilla y León) → lista de espera' );
$l = (array) get_option( 'tcd_intl_interesse', array() ); $u = end( $l );
ok( count( $l ) === $n0 + 1 && 'regiao_em_espera' === $u['nota'] && 'ES' === $u['pais'], 'interesse guardado com a região e a nota' );
$r = pedido( -4.73, 41.65 ); ok( count( (array) get_option( 'tcd_intl_interesse', array() ) ) === $n0 + 1, 'mesmo pedido no mesmo dia não duplica' );
$r = pedido( -0.88, 41.65 ); ok( $r instanceof WP_REST_Response && 'Aragón' === $r->data['regiao'], 'Zaragoza (Aragón) → lista de espera' );
$r = pedido( -2.00, 39.00 ); ok( $r instanceof WP_REST_Response && '?' === $r->data['regiao'], 'IGN e CartoCiudad sem resposta → lista de espera (não vende sem saber a região)' );
$r = pedido( -4.73, 41.65, 'nada' ); ok( $r instanceof WP_Error && 400 === $r->get_error_data()['status'], 'sem e-mail válido → erro a pedir e-mail' );
$r = pedido( -8.06, 37.51 ); ok( null === $r, 'Almodôvar → caminho português, sem consultar CartoCiudad' );
$GLOBALS['__opt']['tcd_esp_regioes'] = '11,07';
$r = pedido( -4.73, 41.66 ); ok( null === $r, 'com 07 na opção, Castilla y León passa a encomenda' );
$r = pedido( -3.70, 40.42 ); ok( $r instanceof WP_REST_Response, 'e Madrid, fora da opção, fica em espera' );
$GLOBALS['__opt']['tcd_esp_regioes_off'] = '1';
$r = pedido( -3.70, 40.42 ); ok( null === $r, 'interruptor desliga a restrição' );
$GLOBALS['__opt']['tcd_esp_regioes_off'] = '0'; $GLOBALS['__opt']['tcd_esp_regioes'] = '11';
$r = pedido( -0.88, 41.67, 'x@y.es' ); ok( false !== strpos( $r->data['mensagem'], 'Aragón' ) && false !== strpos( $r->data['mensagem'], 'x@y.es' ) && 'Base Cartográfica em lista de espera' === $r->data['titulo'], 'em espera: diz a comunidade e o e-mail' );
$r = pedido( -2.00, 39.01, 'x@y.es' ); ok( false === strpos( $r->data['mensagem'], 'MDT' ) && 'Vamos rever o seu terreno' === $r->data['titulo'], 'desconhecida: não afirma que falta o MDT' );
ok( false !== strpos( tcd_esreg_msg( 'es', '', '?', 'a@b.es' ), 'No hemos podido identificar' ) && false !== strpos( tcd_esreg_msg( 'es', '07', 'Castilla y León', 'a@b.es' ), 'Su terreno está en Castilla y León' ), 'textos em castelhano' );
fim();
