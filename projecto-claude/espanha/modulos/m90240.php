<?php
// Módulo 90240: Espanha, base (pedido do Nuno, 20/10/2026: «Espanha a todos os níveis»; decisões em espanha/estado.md).
// 1. Interruptor geral tcd_esp_aberto ('1' = aberto). Desligado: só administradores vêem /es e as rotas ES; os terrenos em
//    Espanha continuam a ser registados como interesse (m90071). Ligado: Península e Baleares passam a encomenda normal,
//    em modo «a pedido» (a equipa confirma a cobertura PNOA-LiDAR antes do pagamento). Canárias, Ceuta e Melilla: fase 2.
// 2. Validação de NIF/NIE/CIF e da referencia catastral (mesma lógica de espanha/site/es-identificadores.js).
// 3. Rota GET /tcd/v1/es/nif/<valor>: formato + VIES para NIF-IVA; 30 consultas por hora e por IP; cache de 7 dias.
// 4. Filtro tcd_gd_ponto_ok (m90024): com o interruptor ligado, aceita pontos em Espanha peninsular e nas Baleares.
// Prefixo tcd_esp_. Depende do m90241 (tcd_esp_pais) e do m90242 (contorno de Espanha).
if ( ! defined( 'ABSPATH' ) ) { exit; }

function tcd_esp_aberto() { return '1' === (string) get_option( 'tcd_esp_aberto', '0' ); }
function tcd_esp_visivel() { return tcd_esp_aberto() || current_user_can( 'manage_options' ); }

function tcd_esp_nif( $valor ) {
	$L = 'TRWAGMYFPDXBNJZSQVHLCKE';
	$v = preg_replace( '/^ES/', '', strtoupper( preg_replace( '/[\s.\-]/', '', (string) $valor ) ) );
	if ( preg_match( '/^(\d{8})([A-Z])$/', $v, $m ) ) { return array( 'ok' => $L[ intval( $m[1] ) % 23 ] === $m[2], 'tipo' => 'dni', 'valor' => $v ); }
	if ( preg_match( '/^([XYZ])(\d{7})([A-Z])$/', $v, $m ) ) { return array( 'ok' => $L[ intval( strpos( 'XYZ', $m[1] ) . $m[2] ) % 23 ] === $m[3], 'tipo' => 'nie', 'valor' => $v ); }
	if ( preg_match( '/^([KLM])(\d{7})([A-Z])$/', $v, $m ) ) { return array( 'ok' => $L[ intval( $m[2] ) % 23 ] === $m[3], 'tipo' => 'nif-especial', 'valor' => $v ); }
	if ( preg_match( '/^([ABCDEFGHJNPQRSUVW])(\d{7})([0-9A-J])$/', $v, $m ) ) {
		$par = 0; $impar = 0;
		for ( $i = 0; $i < 7; $i++ ) { $x = intval( $m[2][ $i ] ); if ( 0 === $i % 2 ) { $y = $x * 2; $impar += intdiv( $y, 10 ) + ( $y % 10 ); } else { $par += $x; } }
		$c = ( 10 - ( ( $par + $impar ) % 10 ) ) % 10; $letra = 'JABCDEFGHI'[ $c ];
		if ( false !== strpos( 'NPQRSW', $m[1] ) ) { $ok = $m[3] === $letra; } elseif ( false !== strpos( 'ABEH', $m[1] ) ) { $ok = $m[3] === (string) $c; } else { $ok = $m[3] === (string) $c || $m[3] === $letra; }
		return array( 'ok' => $ok, 'tipo' => 'cif', 'valor' => $v );
	}
	return array( 'ok' => false, 'tipo' => null, 'valor' => $v );
}

// Dígitos de controlo da referencia de 20: só aviso (algoritmo confirmado num único exemplo público).
function tcd_esp_dc_catastral( $rc ) {
	$P = array( 13, 15, 12, 5, 4, 17, 9, 21, 3, 7, 1 ); $T = 'MQWERTYUIOPASDFGHJKLBZX';
	$A = array_merge( range( 'A', 'N' ), array( 'Ñ' ), range( 'O', 'Z' ) ); $out = '';
	foreach ( array( substr( $rc, 0, 7 ) . substr( $rc, 14, 4 ), substr( $rc, 7, 7 ) . substr( $rc, 14, 4 ) ) as $p ) {
		$s = 0; for ( $i = 0; $i < 11; $i++ ) { $c = $p[ $i ]; $s += $P[ $i ] * ( ctype_digit( $c ) ? intval( $c ) : ( array_search( $c, $A, true ) + 1 ) ); }
		$out .= $T[ $s % 23 ];
	}
	return $out;
}
function tcd_esp_ref_catastral( $valor ) {
	$v = strtoupper( preg_replace( '/[\s.\-]/', '', (string) $valor ) );
	if ( ! preg_match( '/^[0-9A-Z]{14}([0-9]{4}[A-Z]{2})?$/', $v ) ) { return array( 'ok' => false, 'valor' => $v ); }
	$r = array( 'ok' => true, 'valor' => $v, 'parcela14' => substr( $v, 0, 14 ), 'completa' => 20 === strlen( $v ) );
	if ( $r['completa'] ) { $r['dc_ok'] = tcd_esp_dc_catastral( $v ) === substr( $v, 18, 2 ); }
	if ( preg_match( '/^(\d{2})(\d{3})([A-Z])(\d{3})(\d{5})$/', $r['parcela14'], $m ) ) {
		$r['rustica'] = array( 'provincia' => $m[1], 'municipio' => $m[2], 'sector' => $m[3], 'poligono' => intval( $m[4] ), 'parcela' => intval( $m[5] ) );
	}
	return $r;
}

function tcd_esp_ip() { return md5( function_exists( 'tcd_sn_ip' ) ? (string) tcd_sn_ip() : (string) ( $_SERVER['REMOTE_ADDR'] ?? '0' ) ); } // phpcs:ignore
function tcd_esp_limite( $nome, $max ) {
	$k = 'tcd_esp_l_' . $nome . '_' . tcd_esp_ip(); $n = (int) get_transient( $k );
	if ( $n >= $max ) { return false; }
	set_transient( $k, $n + 1, HOUR_IN_SECONDS ); return true;
}

add_action( 'rest_api_init', function () {
	register_rest_route( 'tcd/v1', '/es/nif/(?P<nif>[A-Za-z0-9]{8,11})', array(
		'methods' => 'GET', 'permission_callback' => '__return_true',
		'callback' => function ( $req ) {
			if ( ! tcd_esp_visivel() ) { return new WP_Error( 'rest_no_route', 'No route was found matching the URL and request method.', array( 'status' => 404 ) ); }
			if ( ! tcd_esp_limite( 'nif', 30 ) ) { return new WP_Error( 'tcd_esp_limite', 'Demasiadas consultas. Inténtelo más tarde.', array( 'status' => 429 ) ); }
			$r = tcd_esp_nif( $req->get_param( 'nif' ) );
			if ( ! $r['ok'] ) { return rest_ensure_response( array( 'ok' => false, 'tipo' => $r['tipo'] ) ); }
			$out = array( 'ok' => true, 'tipo' => $r['tipo'], 'valor' => $r['valor'], 'vies' => null );
			if ( 'cif' === $r['tipo'] ) { // só empresas têm NIF-IVA no VIES
				$ck = 'tcd_esp_vies_' . $r['valor']; $c = get_transient( $ck );
				if ( false === $c ) {
					$h = wp_remote_get( 'https://ec.europa.eu/taxation_customs/vies/rest-api/ms/ES/vat/' . rawurlencode( $r['valor'] ), array( 'timeout' => 8 ) );
					$j = is_wp_error( $h ) ? null : json_decode( wp_remote_retrieve_body( $h ), true );
					$c = is_array( $j ) && isset( $j['isValid'] ) ? array( 'valido' => (bool) $j['isValid'], 'nome' => sanitize_text_field( (string) ( $j['name'] ?? '' ) ) ) : array( 'valido' => null, 'nome' => '' );
					if ( null !== $c['valido'] ) { set_transient( $ck, $c, 7 * DAY_IN_SECONDS ); }
				}
				$out['vies'] = $c['valido']; if ( $c['nome'] && '---' !== $c['nome'] ) { $out['nome'] = $c['nome']; }
			}
			return rest_ensure_response( $out );
		},
	) );
} );

// m90024: aceitar pontos em Espanha peninsular e Baleares quando aberto (Canárias, Ceuta, Melilla: fase 2).
add_filter( 'tcd_gd_ponto_ok', function ( $ok, $p ) {
	if ( $ok || ! tcd_esp_aberto() || ! function_exists( 'tcd_esp_pais' ) || ! is_array( $p ) || count( $p ) < 2 ) { return $ok; }
	return 'ES' === tcd_esp_pais( $p[0], $p[1] );
}, 10, 2 );

// Encomendas criadas a partir de /es guardam a língua, para os e-mails seguintes (m90244).
add_action( 'woocommerce_new_order', function ( $id ) {
	if ( function_exists( 'tcd_i18n_lingua' ) && 'es' === tcd_i18n_lingua() && function_exists( 'wc_get_order' ) ) {
		$o = wc_get_order( $id ); if ( $o ) { $o->update_meta_data( '_tcd_lingua', 'es' ); $o->save_meta_data(); }
	}
}, 20 );
