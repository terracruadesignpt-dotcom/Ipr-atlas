<?php
// Módulo 90271: Azenhas e Castelos, fase 1, dados e REST (M24 I-1, pedido do Nuno, 21/10/2026).
// Avisos, partilhas e «Precisa de atenção» no m90272; vista da equipa no m90273.
// Sem reescrever o m90018: usa tcd_imovel e tcd_eq_pode('imoveis'); guarda o que é novo em meta própria (_tcd_acn).
// Negócio (tipo privado tcd_negocio, ligado a um imóvel por _tcd_acn_im): comprador, fase, valor acordado, datas do CPCV
// e da escritura; pessoas (papel, nome, contacto, sem contas); documentos (tipo, emissão, validade; a certidão permanente
// vale 6 meses); passos (responsável, prazo); lista da escritura, gerada quando há data, «base a confirmar com o solicitador».
// Imóvel: vários artigos matriciais (tipo, artigo, secção, freguesia, áreas da caderneta, do registo e do BUPi, fonte, data).
// Quem: equipa com a área «imoveis» e papel Direcção, Sócio, Coordenação ou Imobiliário (filtro tcd_acn_pode; o m90270
// junta quem «vê tudo»). Web, Aprendiz, Parceiro e clientes não. Interruptor: tcd_ac_off = 1. Prefixo tcd_acn_.
if ( ! defined( 'ABSPATH' ) ) { exit; }

define( 'TCD_ACN_FASES', array( 'contacto', 'visita', 'proposta', 'cpcv', 'escritura', 'fechado', 'desistiu' ) );
define( 'TCD_ACN_PAPEIS', array( 'vendedor', 'comprador', 'procurador', 'solicitador', 'banco', 'colaborador' ) );
define( 'TCD_ACN_DOCS', array( 'certidao', 'caderneta', 'licenca', 'ficha', 'energetico', 'procuracao', 'ident', 'distrate', 'preferencia', 'cpcv', 'imt', 'outro' ) );
define( 'TCD_ACN_LISTA', array( 'ident', 'procuracao', 'caderneta', 'certidao', 'licenca', 'ficha', 'energetico', 'distrate', 'preferencia', 'cpcv', 'imt', 'pagamento', 'branqueamento', 'mediacao' ) );

function tcd_acn_on() { return '1' !== (string) get_option( 'tcd_ac_off', '' ); }

function tcd_acn_pode( $u = null ) {
	$u = $u ? $u : wp_get_current_user();
	if ( ! tcd_acn_on() || ! $u || empty( $u->ID ) || ! function_exists( 'tcd_eq_pode' ) || ! tcd_eq_pode( 'imoveis', $u ) ) { return false; }
	$p = function_exists( 'tcd_pg_papel' ) ? tcd_pg_papel( $u ) : '';
	$ok = ( function_exists( 'tcd_eq_todas' ) && tcd_eq_todas( $u ) ) || in_array( $p, array( 'direccao', 'socio', 'coordenacao', 'imobiliario' ), true );
	return (bool) apply_filters( 'tcd_acn_pode', $ok, $u );
}

add_action( 'init', function () {
	register_post_type( 'tcd_negocio', array( 'label' => 'Negócios', 'public' => false, 'show_ui' => false, 'show_in_rest' => false, 'supports' => array( 'title' ) ) );
} );

function tcd_acn_t( $v, $n = 200 ) { return is_scalar( $v ) ? mb_substr( sanitize_text_field( (string) $v ), 0, $n ) : ''; }
function tcd_acn_d( $v ) { $v = is_scalar( $v ) ? (string) $v : ''; return preg_match( '/^(\d{4})-(\d{2})-(\d{2})$/', $v, $m ) && checkdate( (int) $m[2], (int) $m[3], (int) $m[1] ) ? $v : ''; }
function tcd_acn_m( $id ) { $d = get_post_meta( (int) $id, '_tcd_acn', true ); return is_array( $d ) ? $d : array(); }
function tcd_acn_lista( $v, $max, $f ) { $o = array(); foreach ( array_slice( is_array( $v ) ? $v : array(), 0, $max ) as $x ) { if ( is_array( $x ) && ( $y = $f( $x ) ) ) { $o[] = $y; } } return $o; }

// Avisos abertos contam numa meta à parte, para o «Precisa de atenção» só abrir o que tem avisos.
function tcd_acn_guardar( $id, $d ) {
	update_post_meta( $id, '_tcd_acn', $d );
	$n = 0; foreach ( (array) ( $d['avisos'] ?? array() ) as $a ) { if ( empty( $a['fechado'] ) ) { $n++; } }
	update_post_meta( $id, '_tcd_acn_av', $n );
}

function tcd_acn_negocio( $p, $tudo = false ) {
	$d = tcd_acn_m( $p->ID );
	$o = array( 'id' => $p->ID, 'imovel' => (int) get_post_meta( $p->ID, '_tcd_acn_im', true ), 'comprador' => $d['comprador'] ?? '', 'fase' => $d['fase'] ?? 'contacto',
		'valor' => $d['valor'] ?? '', 'cpcv' => $d['cpcv'] ?? '', 'escritura' => $d['escritura'] ?? '' );
	if ( $tudo ) { foreach ( array( 'pessoas', 'docs', 'passos', 'avisos', 'partilhas' ) as $k ) { $o[ $k ] = array_values( (array) ( $d[ $k ] ?? array() ) ); } $o['lista'] = (object) ( $d['lista'] ?? array() ); }
	return $o;
}

function tcd_acn_imovel( $p ) {
	$d = tcd_acn_m( $p->ID );
	$ng = get_posts( array( 'post_type' => 'tcd_negocio', 'post_status' => 'private', 'numberposts' => 100, 'meta_key' => '_tcd_acn_im', 'meta_value' => $p->ID ) );
	return array( 'id' => $p->ID, 'nome' => $p->post_title, 'estado' => get_post_meta( $p->ID, '_tcd_im_estado', true ) ?: 'prospeccao',
		'artigos' => array_values( (array) ( $d['artigos'] ?? array() ) ), 'avisos' => array_values( (array) ( $d['avisos'] ?? array() ) ),
		'negocios' => array_map( 'tcd_acn_negocio', $ng ) );
}

function tcd_acn_alvo( $s ) {
	if ( ! is_scalar( $s ) || ! preg_match( '/^(im|ng):(\d+)$/', (string) $s, $m ) ) { return 0; }
	return get_post_type( (int) $m[2] ) === ( 'im' === $m[1] ? 'tcd_imovel' : 'tcd_negocio' ) ? (int) $m[2] : 0;
}

add_action( 'rest_api_init', function () {
	$pode = function () { return tcd_acn_pode(); };
	$erro = function ( $m, $s = 400 ) { return new WP_Error( 'tcd_acn', $m, array( 'status' => $s ) ); };
	register_rest_route( 'tcd/v1', '/azenhas', array( 'methods' => 'GET', 'permission_callback' => $pode, 'callback' => function () {
		$ps = get_posts( array( 'post_type' => 'tcd_imovel', 'post_status' => 'private', 'numberposts' => 300, 'orderby' => 'modified', 'order' => 'DESC' ) );
		return rest_ensure_response( array( 'ok' => true, 'imoveis' => array_map( 'tcd_acn_imovel', $ps ) ) );
	} ) );
	register_rest_route( 'tcd/v1', '/azenhas/negocio/(?P<id>\d+)', array( 'methods' => 'GET', 'permission_callback' => $pode, 'callback' => function ( WP_REST_Request $r ) use ( $erro ) {
		$p = get_post( (int) $r['id'] );
		return $p && 'tcd_negocio' === $p->post_type ? rest_ensure_response( array( 'ok' => true, 'negocio' => tcd_acn_negocio( $p, true ) ) ) : $erro( 'Negócio não encontrado.', 404 );
	} ) );
	register_rest_route( 'tcd/v1', '/azenhas/negocio', array( 'methods' => 'POST', 'permission_callback' => $pode, 'callback' => function ( WP_REST_Request $r ) use ( $erro ) {
		$id = absint( $r->get_param( 'id' ) );
		if ( $id && 'tcd_negocio' !== get_post_type( $id ) ) { return $erro( 'Negócio não encontrado.', 404 ); }
		if ( ! $id ) {
			$im = absint( $r->get_param( 'imovel' ) );
			if ( 'tcd_imovel' !== get_post_type( $im ) ) { return $erro( 'Imóvel não encontrado.', 404 ); }
			$id = wp_insert_post( array( 'post_type' => 'tcd_negocio', 'post_status' => 'private', 'post_title' => get_the_title( $im ), 'post_author' => get_current_user_id() ) );
			if ( ! $id || is_wp_error( $id ) ) { return $erro( 'Não foi possível guardar.', 500 ); }
			update_post_meta( $id, '_tcd_acn_im', $im );
		}
		$d = tcd_acn_m( $id ); $q = $r->get_json_params(); $q = is_array( $q ) ? $q : array();
		if ( isset( $q['comprador'] ) ) { $d['comprador'] = tcd_acn_t( $q['comprador'], 160 ); }
		if ( isset( $q['fase'] ) && in_array( $q['fase'], TCD_ACN_FASES, true ) ) { $d['fase'] = $q['fase']; }
		if ( isset( $q['valor'] ) ) { $d['valor'] = is_scalar( $q['valor'] ) && is_numeric( $q['valor'] ) && abs( (float) $q['valor'] ) < 1e12 ? round( (float) $q['valor'], 2 ) : ''; }
		foreach ( array( 'cpcv', 'escritura' ) as $k ) { if ( isset( $q[ $k ] ) ) { $d[ $k ] = tcd_acn_d( $q[ $k ] ); } }
		if ( isset( $q['pessoas'] ) ) { $d['pessoas'] = tcd_acn_lista( $q['pessoas'], 30, function ( $x ) { $n = tcd_acn_t( $x['nome'] ?? '', 120 ); return '' === $n ? null : array( 'papel' => in_array( $x['papel'] ?? '', TCD_ACN_PAPEIS, true ) ? $x['papel'] : 'colaborador', 'nome' => $n, 'contacto' => tcd_acn_t( $x['contacto'] ?? '', 160 ) ); } ); }
		if ( isset( $q['docs'] ) ) { $d['docs'] = tcd_acn_lista( $q['docs'], 60, function ( $x ) {
			$t = in_array( $x['tipo'] ?? '', TCD_ACN_DOCS, true ) ? $x['tipo'] : 'outro'; $em = tcd_acn_d( $x['emitido'] ?? '' ); $va = tcd_acn_d( $x['validade'] ?? '' );
			if ( 'certidao' === $t && $em && ! $va ) { $va = gmdate( 'Y-m-d', strtotime( $em . ' +6 months' ) ); }
			return array( 'tipo' => $t, 'nome' => tcd_acn_t( $x['nome'] ?? '', 160 ), 'emitido' => $em, 'validade' => $va, 'nota' => tcd_acn_t( $x['nota'] ?? '', 300 ) );
		} ); }
		if ( isset( $q['passos'] ) ) { $d['passos'] = tcd_acn_lista( $q['passos'], 60, function ( $x ) { $t = tcd_acn_t( $x['t'] ?? '', 300 ); return '' === $t ? null : array( 't' => $t, 'resp' => tcd_acn_t( $x['resp'] ?? '', 80 ), 'prazo' => tcd_acn_d( $x['prazo'] ?? '' ), 'feito' => ! empty( $x['feito'] ) ); } ); }
		if ( isset( $q['lista'] ) && is_array( $q['lista'] ) ) { foreach ( TCD_ACN_LISTA as $k ) { if ( isset( $q['lista'][ $k ] ) ) { $d['lista'][ $k ] = ! empty( $q['lista'][ $k ] ); } } }
		if ( ! empty( $d['escritura'] ) && empty( $d['lista'] ) ) { $d['lista'] = array_fill_keys( TCD_ACN_LISTA, false ); }
		tcd_acn_guardar( $id, $d );
		wp_update_post( array( 'ID' => $id, 'post_title' => get_the_title( (int) get_post_meta( $id, '_tcd_acn_im', true ) ) . ( empty( $d['comprador'] ) ? '' : ' · ' . $d['comprador'] ) ) );
		return rest_ensure_response( array( 'ok' => true, 'negocio' => tcd_acn_negocio( get_post( $id ), true ) ) );
	} ) );
	register_rest_route( 'tcd/v1', '/azenhas/imovel', array( 'methods' => 'POST', 'permission_callback' => $pode, 'callback' => function ( WP_REST_Request $r ) use ( $erro ) {
		$id = absint( $r->get_param( 'id' ) );
		if ( 'tcd_imovel' !== get_post_type( $id ) ) { return $erro( 'Imóvel não encontrado.', 404 ); }
		$d = tcd_acn_m( $id );
		if ( null === $r->get_param( 'artigos' ) ) { return $erro( 'Sem artigos.' ); }
		$d['artigos'] = tcd_acn_lista( $r->get_param( 'artigos' ), 40, function ( $x ) {
			$o = array( 'tipo' => in_array( $x['tipo'] ?? '', array( 'rustico', 'urbano', 'misto' ), true ) ? $x['tipo'] : 'rustico', 'data' => tcd_acn_d( $x['data'] ?? '' ) );
			foreach ( array( 'artigo', 'seccao', 'freguesia', 'a_cad', 'a_reg', 'a_bupi', 'fonte' ) as $k ) { $o[ $k ] = tcd_acn_t( $x[ $k ] ?? '', 120 ); }
			return '' === $o['artigo'] ? null : $o;
		} );
		tcd_acn_guardar( $id, $d );
		return rest_ensure_response( array( 'ok' => true, 'imovel' => tcd_acn_imovel( get_post( $id ) ) ) );
	} ) );
} );
