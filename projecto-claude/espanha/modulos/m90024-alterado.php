<?php
// Módulo 90024: guarda dos pedidos de Base Cartográfica (rota tcd/v1/pedido-base do m14473).
// Antes de criar a encomenda: recusa desenhos incompletos (coordenadas vazias, anéis com menos de 4 pontos, pontos fora de
// Portugal) e áreas desenhadas com menos de 0,05 ha; recusa o mesmo pedido enviado de novo nos 10 minutos seguintes
// (o mesmo e-mail com o mesmo terreno). Origem: três encomendas de 0 ha seguidas, com [[null]], a 17/10.
if ( ! defined( 'ABSPATH' ) ) { exit; }

function tcd_gd_ponto_ok( $p ) {
	$ok = is_array( $p ) && count( $p ) >= 2 && is_numeric( $p[0] ) && is_numeric( $p[1] )
		&& $p[0] >= -32.5 && $p[0] <= -6.0 && $p[1] >= 29.5 && $p[1] <= 42.3;
	// 20/10/2026 (Espanha): o m90240 aceita aqui pontos em Espanha quando o interruptor tcd_esp_aberto está ligado.
	return (bool) apply_filters( 'tcd_gd_ponto_ok', $ok, $p );
}
function tcd_gd_anel_ok( $r ) {
	if ( ! is_array( $r ) || count( $r ) < 4 ) { return false; }
	foreach ( $r as $p ) { if ( ! tcd_gd_ponto_ok( $p ) ) { return false; } }
	return true;
}
// Devolve '' se está bem, ou a mensagem para o cliente.
function tcd_gd_validar( $txt, $metodo ) {
	if ( '' === trim( (string) $txt ) ) { return ''; }
	$g = json_decode( (string) $txt, true );
	if ( ! is_array( $g ) ) { return 'Não conseguimos ler o limite do terreno. Desenhe-o de novo no mapa.'; }
	$fs = 'FeatureCollection' === ( $g['type'] ?? '' ) ? (array) ( $g['features'] ?? array() ) : array( $g );
	$n = 0; $m2 = 0.0;
	foreach ( $fs as $f ) {
		$geo = isset( $f['geometry'] ) ? $f['geometry'] : $f;
		$t = $geo['type'] ?? '';
		if ( 'Polygon' !== $t && 'MultiPolygon' !== $t ) { continue; }
		$polys = 'Polygon' === $t ? array( $geo['coordinates'] ?? null ) : (array) ( $geo['coordinates'] ?? array() );
		foreach ( $polys as $poly ) {
			if ( ! is_array( $poly ) || ! $poly ) { return 'O desenho do terreno não ficou completo. Desenhe o limite e feche-o clicando no primeiro ponto.'; }
			foreach ( $poly as $anel ) {
				if ( ! tcd_gd_anel_ok( $anel ) ) { return 'O desenho do terreno não ficou completo ou está fora de Portugal. Desenhe o limite e feche-o clicando no primeiro ponto.'; }
			}
			$n++;
		}
		if ( function_exists( 'tcd_area_geometria' ) ) { $m2 += tcd_area_geometria( $geo ); }
	}
	if ( ! $n && 'desenhar' === $metodo ) { return 'Desenhe o limite do terreno no mapa e feche-o clicando no primeiro ponto.'; }
	if ( $n && $m2 < 500 ) { return 'O terreno desenhado tem menos de 0,05 ha. Confirme o desenho no mapa.'; }
	return '';
}
function tcd_gd_chave( WP_REST_Request $r ) {
	$p = $r->get_body_params();
	return 'tcd_gd_' . md5( strtolower( trim( (string) ( $p['email'] ?? '' ) ) ) . '|' . (string) ( $p['geojson'] ?? '' ) . '|' . (string) ( $p['artigo'] ?? '' ) . '|' . (string) ( $p['local'] ?? '' ) . '|' . (string) ( $p['leitura'] ?? '' ) );
}
function tcd_gd_rota( $r ) { return $r instanceof WP_REST_Request && 'POST' === strtoupper( $r->get_method() ) && '/tcd/v1/pedido-base' === strtolower( untrailingslashit( $r->get_route() ) ); }

add_filter( 'rest_pre_dispatch', function ( $res, $srv, $r ) {
	if ( null !== $res || ! tcd_gd_rota( $r ) ) { return $res; }
	$p = $r->get_body_params();
	if ( ! empty( $p['website'] ) ) { return $res; }
	// Auditoria 17/10/2026 (AUD-COD1-01): o voucher da equipa (Base a 0 €, directa para o worker) só vale para quem
	// tem sessão iniciada com essa mesma conta @terracruadesign.pt. Antes bastava escrever o e-mail no formulário público.
	$em = strtolower( trim( (string) $r->get_param( 'email' ) ) );
	if ( '@terracruadesign.pt' === substr( $em, -19 ) ) {
		$u = wp_get_current_user();
		if ( ! $u || ! $u->ID || strtolower( (string) $u->user_email ) !== $em ) {
			return new WP_Error( 'tcd_equipa_sessao', 'Para pedir com uma conta @terracruadesign.pt, entre primeiro no site com essa conta.', array( 'status' => 403 ) );
		}
	}
	$e = tcd_gd_validar( $p['geojson'] ?? '', (string) ( $p['metodo'] ?? '' ) );
	if ( '' !== $e ) { return new WP_Error( 'tcd_geometria', $e, array( 'status' => 400 ) ); }
	$t = get_transient( tcd_gd_chave( $r ) );
	if ( $t ) {
		return new WP_Error( 'tcd_repetido', 'Este pedido já foi recebido há ' . max( 1, (int) round( ( time() - (int) $t ) / 60 ) ) . ' min. Não é preciso enviar de novo: a confirmação segue por e-mail.', array( 'status' => 409 ) );
	}
	return $res;
}, 10, 3 );
add_filter( 'rest_request_after_callbacks', function ( $resp, $h, $r ) {
	if ( tcd_gd_rota( $r ) && ! is_wp_error( $resp ) ) { set_transient( tcd_gd_chave( $r ), time(), 10 * MINUTE_IN_SECONDS ); }
	return $resp;
}, 10, 3 );
