<?php
// Módulo 90138 · Autoteste diário do pedido da Base Cartográfica (21/10/2026).
//
// Decisão do Nuno (21/10/2026): o funil de vendas é a prioridade; um teste real por dia.
// Uma vez por dia (05h10 UTC, pelo WP-Cron), faz um pedido interno a POST /tcd/v1/pedido-base pelo mesmo caminho
// de um visitante (rest_pre_dispatch, rota do m14473, rest_post_dispatch), com um terreno de cerca de 1 ha e um
// cliente de teste fixo («Teste Automático IPR», e-mail em example.com). Depois confirma:
//   1. a resposta é ok e traz a referência do pedido (o caso Vila Bita era «ok» sem referência);
//   2. existe uma encomenda com essa referência, em «Pagamento pendente», com total > 0 e a área certa;
//   3. o pedido tentou enviar os dois e-mails (equipa e cliente).
// Sem facturas: a encomenda de teste recebe tocwoo_enabled = 0 logo ao nascer (woocommerce_new_order, prioridade 1)
// e não pode passar a paga enquanto o teste corre. Os e-mails deste pedido (os que vão para o cliente de teste ou
// trazem o nome dele no assunto) são contados e travados em pre_wp_mail; os outros passam.
// Limpeza: se a encomenda ficou em «Pagamento pendente», é marcada (_tcd_autoteste, nota) e vai para o lixo
// (recuperável). Se ficou noutro estado, fica onde está, marcada, e o Nuno é avisado com o número.
// Se falhar: aviso ao Nuno pelo Telegram (tcd_tg_enviar), no máximo 1 por dia.
// Resultado: opção `tcd_autoteste_ultimo` e histórico `tcd_autoteste_hist` (30 últimos), ambas sem autoload.
// Lê-se com: wp option get tcd_autoteste_ultimo --format=json
// Desligar: wp option update tcd_autoteste_off 1
// Nenhuma rota REST nova.

if ( ! defined( 'ABSPATH' ) ) { exit; }

const TCD_AUTOTESTE_EMAIL = 'autoteste.base@example.com';
const TCD_AUTOTESTE_NOME  = 'Teste Automático IPR';

add_action( 'init', 'tcd_autoteste_agendar' );
function tcd_autoteste_agendar() {
	if ( get_option( 'tcd_autoteste_off' ) ) {
		if ( wp_next_scheduled( 'tcd_autoteste_diario' ) ) { wp_clear_scheduled_hook( 'tcd_autoteste_diario' ); }
		return;
	}
	if ( ! wp_next_scheduled( 'tcd_autoteste_diario' ) ) {
		$hoje = strtotime( gmdate( 'Y-m-d' ) . ' 05:10:00 UTC' );
		wp_schedule_event( $hoje > time() ? $hoje : $hoje + DAY_IN_SECONDS, 'daily', 'tcd_autoteste_diario' );
	}
}

// Polígono de cerca de 1 ha (0,001° × 0,001°) no interior do Algarve, com LiDAR da DGT.
function tcd_autoteste_geojson() {
	$x = -7.975; $y = 37.475; $d = 0.001;
	return wp_json_encode( array(
		'type'     => 'FeatureCollection',
		'features' => array( array(
			'type'       => 'Feature',
			'properties' => new stdClass(),
			'geometry'   => array(
				'type'        => 'Polygon',
				'coordinates' => array( array( array( $x, $y ), array( $x + $d, $y ), array( $x + $d, $y + $d ), array( $x, $y + $d ), array( $x, $y ) ) ),
			),
		) ),
	) );
}

// E-mail deste pedido de teste? (para o cliente de teste, ou com o nome dele no assunto, como o da equipa)
function tcd_autoteste_e_meu( $atts ) {
	if ( ! is_array( $atts ) ) { return false; }
	$to = isset( $atts['to'] ) ? ( is_array( $atts['to'] ) ? implode( ',', $atts['to'] ) : (string) $atts['to'] ) : '';
	$su = isset( $atts['subject'] ) ? (string) $atts['subject'] : '';
	return false !== stripos( $to, TCD_AUTOTESTE_EMAIL ) || false !== strpos( $su, TCD_AUTOTESTE_NOME );
}

function tcd_autoteste_mail( $nulo, $atts ) {
	if ( empty( $GLOBALS['tcd_autoteste_activo'] ) || ! tcd_autoteste_e_meu( $atts ) ) { return $nulo; }
	$GLOBALS['tcd_autoteste_mails'][] = mb_substr( (string) ( $atts['subject'] ?? '' ), 0, 80 );
	return true;
}

// Encomenda de teste: sem factura desde o primeiro momento.
function tcd_autoteste_nova( $id, $order = null ) {
	if ( empty( $GLOBALS['tcd_autoteste_activo'] ) ) { return; }
	$o = is_object( $order ) ? $order : wc_get_order( $id );
	if ( ! $o || TCD_AUTOTESTE_EMAIL !== strtolower( (string) $o->get_billing_email() ) ) { return; }
	$o->update_meta_data( 'tocwoo_enabled', '0' );
	$o->update_meta_data( '_tcd_autoteste', gmdate( 'c' ) );
	$o->save_meta_data();
	$GLOBALS['tcd_autoteste_id'] = (int) $o->get_id();
}

// Enquanto o teste corre, a encomenda de teste não passa a paga.
function tcd_autoteste_sem_pago( $estado, $id = 0 ) {
	if ( ! empty( $GLOBALS['tcd_autoteste_activo'] ) && ! empty( $GLOBALS['tcd_autoteste_id'] ) && (int) $id === (int) $GLOBALS['tcd_autoteste_id'] ) { return 'pending'; }
	return $estado;
}

function tcd_autoteste_fim_inesperado() {
	if ( empty( $GLOBALS['tcd_autoteste_activo'] ) ) { return; }
	update_option( 'tcd_autoteste_ultimo', array( 'quando' => gmdate( 'c' ), 'ok' => 0, 'erro' => 'interrompido (wp_die, exit ou erro fatal)', 'encomenda' => (int) ( $GLOBALS['tcd_autoteste_id'] ?? 0 ) ), false );
	delete_option( 'tcd_autoteste_trinco' );
}

add_action( 'tcd_autoteste_diario', 'tcd_autoteste_correr' );
function tcd_autoteste_correr( $forcar = false ) {
	if ( get_option( 'tcd_autoteste_off' ) ) { return null; }
	$ult = get_option( 'tcd_autoteste_ultimo' );
	if ( ! $forcar && is_array( $ult ) && isset( $ult['quando'] ) && 0 === strpos( (string) $ult['quando'], gmdate( 'Y-m-d' ) ) ) { return null; }
	// Trinco atómico (add_option falha se já existir); um trinco com mais de 15 min é considerado abandonado.
	if ( ! add_option( 'tcd_autoteste_trinco', time(), '', false ) ) {
		if ( time() - (int) get_option( 'tcd_autoteste_trinco' ) < 15 * MINUTE_IN_SECONDS ) { return null; }
		update_option( 'tcd_autoteste_trinco', time(), false );
	}

	$t0  = microtime( true );
	$res = array( 'quando' => gmdate( 'c' ), 'ok' => 0, 'passos' => array(), 'encomenda' => 0, 'pedido' => '', 'erro' => '' );
	$GLOBALS['tcd_autoteste_activo'] = true;
	$GLOBALS['tcd_autoteste_mails']  = array();
	$GLOBALS['tcd_autoteste_id']     = 0;
	add_filter( 'pre_wp_mail', 'tcd_autoteste_mail', 1, 2 );
	add_action( 'woocommerce_new_order', 'tcd_autoteste_nova', 1, 2 );
	add_filter( 'woocommerce_payment_complete_order_status', 'tcd_autoteste_sem_pago', 999, 2 );
	register_shutdown_function( 'tcd_autoteste_fim_inesperado' );
	$o = null; $ok2 = false;

	try {
		$req = new WP_REST_Request( 'POST', '/tcd/v1/pedido-base' );
		$req->set_body_params( array(
			'nome'          => TCD_AUTOTESTE_NOME,
			'email'         => TCD_AUTOTESTE_EMAIL,
			'telefone'      => '',
			'pais'          => 'PT',
			'local'         => 'teste automático',
			'notas'         => 'teste automático diário do funil; ignorar',
			'consentimento' => '1',
			'metodo'        => 'desenhar',
			'geojson'       => tcd_autoteste_geojson(),
			'website'       => '',
			't'             => (string) ( ( time() - 60 ) * 1000 ),
		) );
		$srv  = rest_get_server();
		$resp = rest_ensure_response( $srv->dispatch( $req ) );
		$resp = apply_filters( 'rest_post_dispatch', $resp, $srv, $req );
		$d    = $resp instanceof WP_REST_Response ? $resp->get_data() : null;
		$st   = $resp instanceof WP_REST_Response ? (int) $resp->get_status() : 0;

		// 1. Resposta ok com referência.
		$ref = is_array( $d ) && ! empty( $d['pedido'] ) && is_scalar( $d['pedido'] ) ? sanitize_text_field( (string) $d['pedido'] ) : '';
		$ok1 = 200 === $st && is_array( $d ) && ! empty( $d['ok'] ) && '' !== $ref;
		$res['passos']['resposta'] = $ok1 ? 'ok' : 'falhou (HTTP ' . $st . ( is_array( $d ) && isset( $d['message'] ) ? ': ' . mb_substr( wp_strip_all_tags( (string) $d['message'] ), 0, 160 ) : '' ) . ')';
		$res['pedido'] = $ref;

		// 2. Encomenda criada.
		if ( '' !== $ref ) {
			$os = wc_get_orders( array( 'limit' => 1, 'return' => 'objects', 'meta_query' => array( array( 'key' => '_tcd_pedido', 'value' => $ref ) ) ) );
			$o  = $os && is_object( $os[0] ) ? $os[0] : null;
		}
		if ( $o ) {
			$area = (float) $o->get_meta( '_tcd_area_ha' );
			$ok2  = 'pending' === $o->get_status() && (float) $o->get_total() > 0 && $area > 0.5 && $area < 2;
			$res['passos']['encomenda'] = $ok2 ? 'ok' : 'falhou (estado ' . $o->get_status() . ', total ' . $o->get_total() . ', área ' . $area . ' ha)';
		} else {
			$res['passos']['encomenda'] = 'falhou (sem encomenda com a referência)';
		}

		// 3. E-mails tentados (equipa e cliente).
		$n   = count( $GLOBALS['tcd_autoteste_mails'] );
		$ok3 = $n >= 2;
		$res['passos']['emails'] = $ok3 ? 'ok (' . $n . ')' : 'falhou (' . $n . ' tentados)';

		$res['ok'] = ( $ok1 && $ok2 && $ok3 ) ? 1 : 0;
	} catch ( Throwable $t ) {
		$res['erro'] = mb_substr( get_class( $t ) . ': ' . $t->getMessage(), 0, 240 );
	} finally {
		remove_filter( 'pre_wp_mail', 'tcd_autoteste_mail', 1 );
		remove_action( 'woocommerce_new_order', 'tcd_autoteste_nova', 1 );
		remove_filter( 'woocommerce_payment_complete_order_status', 'tcd_autoteste_sem_pago', 999 );
	}

	// Limpeza, mesmo depois de excepção: a encomenda de teste é a que nasceu durante o teste.
	try {
		if ( ! $o && ! empty( $GLOBALS['tcd_autoteste_id'] ) ) { $o = wc_get_order( (int) $GLOBALS['tcd_autoteste_id'] ); }
		if ( $o ) {
			$id = (int) $o->get_id();
			$res['encomenda'] = $id;
			$o->update_meta_data( '_tcd_autoteste', gmdate( 'c' ) );
			$o->update_meta_data( 'tocwoo_enabled', '0' );
			if ( 'pending' === $o->get_status() ) {
				$o->add_order_note( 'Autoteste diário do pedido da Base (m90138): ' . ( $res['ok'] ? 'passou' : 'FALHOU' ) . '. Encomenda de teste, posta no lixo automaticamente.' );
				$o->save();
				$o->delete( false );
				$o2 = wc_get_order( $id );
				$res['passos']['lixo'] = ( $o2 && 'trash' === $o2->get_status() ) ? 'ok' : 'por confirmar';
			} else {
				$o->add_order_note( 'Autoteste diário do pedido da Base (m90138): a encomenda de teste ficou no estado «' . $o->get_status() . '». Não foi posta no lixo. Confirmar no TOConline que não há factura.' );
				$o->save();
				$res['ok'] = 0;
				$res['passos']['lixo'] = 'não (estado ' . $o->get_status() . '): rever à mão';
			}
		}
	} catch ( Throwable $t ) {
		$res['erro'] .= ( '' !== $res['erro'] ? ' | ' : '' ) . 'limpeza: ' . mb_substr( $t->getMessage(), 0, 160 );
		$res['ok'] = 0;
	}

	unset( $GLOBALS['tcd_autoteste_activo'], $GLOBALS['tcd_autoteste_mails'], $GLOBALS['tcd_autoteste_id'] );
	$res['ms'] = (int) round( 1000 * ( microtime( true ) - $t0 ) );

	update_option( 'tcd_autoteste_ultimo', $res, false );
	$h = get_option( 'tcd_autoteste_hist', array() );
	if ( ! is_array( $h ) ) { $h = array(); }
	$h[] = array( 'quando' => $res['quando'], 'ok' => $res['ok'], 'encomenda' => $res['encomenda'] );
	update_option( 'tcd_autoteste_hist', array_slice( $h, -30 ), false );

	if ( ! $res['ok'] && function_exists( 'tcd_tg_enviar' ) && ! get_transient( 'tcd_autoteste_tg' ) ) {
		set_transient( 'tcd_autoteste_tg', 1, 20 * HOUR_IN_SECONDS );
		$txt = 'Autoteste do pedido da Base FALHOU. ';
		foreach ( $res['passos'] as $k => $v ) { $txt .= $k . ': ' . $v . '. '; }
		if ( '' !== $res['erro'] ) { $txt .= 'Erro: ' . $res['erro'] . '. '; }
		if ( $res['encomenda'] ) { $txt .= 'Encomenda #' . (int) $res['encomenda'] . '. '; }
		tcd_tg_enviar( htmlspecialchars( $txt . 'Ver tcd_autoteste_ultimo.', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8', true ) );
	}
	delete_option( 'tcd_autoteste_trinco' );
	return $res;
}
