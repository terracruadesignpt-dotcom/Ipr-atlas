<?php
// Módulo 90260: Espanha, ES-11 (textos de espanha/legal-es/formulario-desistimiento.md, secções C a F; decisão 15 do
// espanha/estado.md). Só actua em encomendas espanholas (meta _tcd_lingua = es, do m90240, ou país de facturação ES).
// 1. Página de pagamento (order-pay, onde se paga a Base e a Leitura Territorial): «Contrata como» particular/empresa,
//    caixas C.1/C.2/C.3 conforme os artigos (não marcadas), caixa obrigatória dos Términos, botão «Pedido con obligación
//    de pago» e linha com o total. O texto exacto, marcado ou não, fica na encomenda com data e hora (_tcd_es11).
// 2. Pagamento normal (bloco de checkout, IPR Cloud e Intelligence): os mesmos dados por campos adicionais do WooCommerce.
// 3. Particular sem a caixa C.1 (Base) ou C.2 (Leitura): a encomenda não entra na fila do worker; fica «diferido» e entra
//    sozinha quando terminam os 14 dias (cron horário). Desistência antes disso: «desistido», nunca entra.
// 4. Função de desistência (Directiva (UE) 2023/2673): botão «Desistir del contrato aquí» na lista de encomendas e no
//    e-mail; ecrã em [tcd_desistir] (página /es/desistimiento/); confirmação de recepção por e-mail com data e hora;
//    aviso à equipa. O reembolso continua a ser feito pela equipa.
// 5. Parágrafos F.1 a F.5 no e-mail de confirmação da encomenda.
// Interruptor: tcd_es11_off = '1'. Prefixo tcd_es11_. Depende do m90240 (tcd_esp_*) e do m14618 (tcd_wk_por_na_fila).
if ( ! defined( 'ABSPATH' ) ) { exit; }

function tcd_es11_ligado() { return '1' !== (string) get_option( 'tcd_es11_off', '0' ); }
function tcd_es11_t( $k ) {
	static $t = array(
		'tipo'       => 'Contrata como',
		'particular' => 'Particular (consumidor)',
		'empresa'    => 'Empresa o profesional',
		'c1'         => 'Solicito expresamente que Terracrua Design empiece a procesar la Base Cartográfica de inmediato, antes de que termine el plazo de desistimiento de 14 días. Sé que, al empezar el procesamiento, pierdo mi derecho de desistimiento.',
		'c1_ayuda'   => 'Si no marca esta casilla, puede continuar el pedido y el procesamiento empezará cuando terminen los 14 días del plazo de desistimiento.',
		'c2'         => 'Solicito expresamente que la prestación del servicio empiece durante el plazo de desistimiento de 14 días. Sé que, si desisto, deberé pagar la parte proporcional del servicio ya prestado, y que perderé el derecho de desistimiento cuando el servicio se haya prestado por completo.',
		'c3'         => 'Solicito el acceso inmediato. Sé que, si desisto en los 14 días siguientes, se me reembolsará el importe pagado menos la parte proporcional al tiempo transcurrido.',
		'c23_ayuda'  => 'Si no marca la casilla, el servicio empezará cuando terminen los 14 días del plazo de desistimiento.',
		'c23'        => 'Solicito expresamente que el servicio o el acceso empiece de inmediato, durante el plazo de desistimiento de 14 días. Sé que, si desisto, deberé pagar la parte proporcional del servicio prestado o del tiempo transcurrido, y que perderé el derecho de desistimiento cuando el servicio se haya prestado por completo.',
		'c4'         => 'He leído y acepto los %s.',
		'c4_bloque'  => 'He leído y acepto los Términos y condiciones (terracruadesign.pt/es/terminos/).',
		'terminos'   => 'Términos y condiciones',
		'boton'      => 'Pedido con obligación de pago',
		'linea_d'    => 'Al pulsar, su pedido queda confirmado y deberá pagar el importe total indicado: %s (IVA incluido).',
		'err_tipo'   => 'Indique si contrata como particular o como empresa o profesional.',
		'err_c4'     => 'Para continuar, lea y acepte los Términos y condiciones.',
		'desistir'   => 'Desistir del contrato aquí',
	);
	return $t[ $k ] ?? $k;
}

// Que caixa cabe a cada artigo: c1 Base (conteúdo digital), c3 acesso por período (IPR Cloud, Intelligence),
// 'v' vales-oferta (sem caixa: não começam nada, mas têm desistência e F.5), c2 o resto (Leitura, visitas, videochamadas).
function tcd_es11_tipo_item( $pid, $sku ) {
	$pid = (int) $pid; $sku = (string) $sku;
	if ( $pid === (int) apply_filters( 'tcd_es11_produto_base', 14471 ) ) { return 'c1'; }
	if ( preg_match( '/^IPR-(CLOUD|ATLAS)-/i', $sku ) ) { return 'c3'; }
	if ( preg_match( '/^tcd-vale-/i', $sku ) ) { return 'v'; }
	return 'c2';
}
function tcd_es11_caixas_itens( $itens ) {
	$c = array();
	foreach ( $itens as $it ) {
		$k = tcd_es11_tipo_item( $it['pid'], $it['sku'] );
		if ( $k ) { $c[ $k ] = true; }
	}
	return array_values( array_intersect( array( 'c1', 'c2', 'c3' ), array_keys( $c ) ) );
}
function tcd_es11_tem_itens( $o ) { return array() !== tcd_es11_itens( $o ); }
function tcd_es11_itens( $o ) {
	$r = array();
	foreach ( $o->get_items() as $it ) {
		$p = method_exists( $it, 'get_product' ) ? $it->get_product() : null;
		$r[] = array( 'pid' => (int) $it->get_product_id(), 'sku' => $p ? (string) $p->get_sku() : '' );
	}
	return $r;
}
function tcd_es11_es( $o ) {
	if ( ! $o || ! tcd_es11_ligado() ) { return false; }
	return 'es' === (string) $o->get_meta( '_tcd_lingua' ) || 'ES' === strtoupper( (string) $o->get_billing_country() );
}
function tcd_es11_registo( $o ) { $r = $o->get_meta( '_tcd_es11' ); return is_array( $r ) ? $r : array(); }
// Particular? Com registo, o que a pessoa escolheu; sem registo (vale que cobre tudo, encomenda antiga), particular
// quando não há empresa na facturação: na dúvida aplica-se a protecção do consumidor.
function tcd_es11_particular( $o ) {
	$r = tcd_es11_registo( $o );
	if ( ! empty( $r['tipo'] ) ) { return 'particular' === $r['tipo']; }
	return '' === trim( (string) $o->get_billing_company() );
}
function tcd_es11_marcada( $o, $k ) { $r = tcd_es11_registo( $o ); return ! empty( $r['caixas'][ $k ]['marcada'] ); }
function tcd_es11_quando( $o ) {
	$r = tcd_es11_registo( $o );
	return ! empty( $r['t'] ) ? (int) $r['t'] : 0;
}
// Data do contrato (pagamento confirmado) e fim do prazo de 14 dias.
function tcd_es11_contrato( $o ) {
	$d = $o->get_date_paid(); if ( ! $d ) { $d = $o->get_date_created(); }
	return $d ? (int) $d->getTimestamp() : time();
}
// O dia do contrato não conta (Regulamento 1182/71); o prazo acaba às 23:59:59 do 14.º dia natural seguinte, hora de Lisboa.
function tcd_es11_fim_prazo( $o ) {
	$tz = new DateTimeZone( 'Europe/Lisbon' );
	$d = ( new DateTimeImmutable( '@' . tcd_es11_contrato( $o ) ) )->setTimezone( $tz )->setTime( 23, 59, 59 )->modify( '+14 days' );
	return (int) $d->getTimestamp();
}
function tcd_es11_inicio_diferido( $o ) { return tcd_es11_fim_prazo( $o ) + 1; }
function tcd_es11_data( $ts ) { return function_exists( 'wp_date' ) ? wp_date( 'd/m/Y', $ts ) : gmdate( 'd/m/Y', $ts ); }
function tcd_es11_hora( $ts ) { return function_exists( 'wp_date' ) ? wp_date( 'H:i', $ts ) : gmdate( 'H:i', $ts ); }

function tcd_es11_gravar( $o, $tipo, $marcadas, $via, $c4 = true ) {
	$caixas = array();
	foreach ( tcd_es11_caixas_itens( tcd_es11_itens( $o ) ) as $k ) {
		$caixas[ $k ] = array( 'marcada' => in_array( $k, $marcadas, true ), 'texto' => tcd_es11_t( 'block' === $via && 'c1' !== $k ? 'c23' : $k ) );
	}
	$caixas['c4'] = array( 'marcada' => (bool) $c4, 'texto' => 'block' === $via ? tcd_es11_t( 'c4_bloque' ) : sprintf( tcd_es11_t( 'c4' ), tcd_es11_t( 'terminos' ) ) );
	$o->update_meta_data( '_tcd_es11', array( 'tipo' => $tipo, 'caixas' => 'empresa' === $tipo ? array( 'c4' => $caixas['c4'] ) : $caixas, 't' => time(), 'via' => $via ) );
	$o->save();
}

// 1. Página de pagamento (order-pay).
function tcd_es11_pedido_pagina() {
	global $wp;
	$id = isset( $wp->query_vars['order-pay'] ) ? absint( $wp->query_vars['order-pay'] ) : 0;
	return $id && function_exists( 'wc_get_order' ) ? wc_get_order( $id ) : null;
}
add_action( 'woocommerce_pay_order_before_submit', function () {
	$o = tcd_es11_pedido_pagina();
	if ( ! tcd_es11_es( $o ) ) { return; }
	echo tcd_es11_html_pagamento( $o ); // phpcs:ignore WordPress.Security.EscapeOutput -- montado com esc_*.
} );
function tcd_es11_html_pagamento( $o ) {
	$emp = '' !== trim( (string) $o->get_billing_company() );
	$h  = '<fieldset class="tcd-es11" style="border:0;padding:0;margin:1em 0">';
	$h .= '<p><strong>' . esc_html( tcd_es11_t( 'tipo' ) ) . '</strong><br>';
	$h .= '<label><input type="radio" name="tcd_es_tipo" value="particular"' . ( $emp ? '' : ' checked' ) . '> ' . esc_html( tcd_es11_t( 'particular' ) ) . '</label> &nbsp; ';
	$h .= '<label><input type="radio" name="tcd_es_tipo" value="empresa"' . ( $emp ? ' checked' : '' ) . '> ' . esc_html( tcd_es11_t( 'empresa' ) ) . '</label></p>';
	$h .= '<div data-tcd-es11-cons' . ( $emp ? ' hidden' : '' ) . '>';
	$cx = tcd_es11_caixas_itens( tcd_es11_itens( $o ) );
	foreach ( $cx as $k ) {
		$h .= '<p><label><input type="checkbox" name="tcd_es_' . $k . '" value="1"> ' . esc_html( tcd_es11_t( $k ) ) . '</label>';
		if ( 'c1' === $k ) { $h .= '<br><small>' . esc_html( tcd_es11_t( 'c1_ayuda' ) ) . '</small>'; }
		$h .= '</p>';
	}
	if ( array_intersect( array( 'c2', 'c3' ), $cx ) ) { $h .= '<p><small>' . esc_html( tcd_es11_t( 'c23_ayuda' ) ) . '</small></p>'; }
	$h .= '</div>';
	$lt = '<a href="' . esc_url( home_url( '/es/terminos/' ) ) . '" target="_blank" rel="noopener">' . esc_html( tcd_es11_t( 'terminos' ) ) . '</a>';
	$h .= '<p><label><input type="checkbox" name="tcd_es_c4" value="1" required> ' . sprintf( esc_html( tcd_es11_t( 'c4' ) ), $lt ) . ' *</label></p>';
	$tot = function_exists( 'wc_price' ) ? wp_strip_all_tags( wc_price( $o->get_total(), array( 'currency' => $o->get_currency() ) ) ) : (string) $o->get_total();
	$h .= '<p><small>' . esc_html( sprintf( tcd_es11_t( 'linea_d' ), $tot ) ) . '</small></p>';
	$h .= '</fieldset><script>(function(){var f=document.querySelector(".tcd-es11");if(!f)return;var d=f.querySelector("[data-tcd-es11-cons]");'
		. 'f.addEventListener("change",function(e){if(e.target.name==="tcd_es_tipo"){d.hidden=e.target.value!=="particular";}});})();</script>';
	return $h;
}
// O WooCommerce mostra a sua caixa de termos (página portuguesa); nas encomendas espanholas fica só a nossa.
add_filter( 'woocommerce_checkout_show_terms', function ( $v ) {
	$o = function_exists( 'is_checkout_pay_page' ) && is_checkout_pay_page() ? tcd_es11_pedido_pagina() : null;
	return tcd_es11_es( $o ) ? false : $v;
} );
add_filter( 'woocommerce_pay_order_button_text', function ( $t ) {
	return tcd_es11_es( tcd_es11_pedido_pagina() ) ? tcd_es11_t( 'boton' ) : $t;
} );
// Validação no servidor: com erro, o WooCommerce não chega a cobrar (wc_notice_count('error') em pay_action).
add_action( 'woocommerce_before_pay_action', function ( $o ) {
	if ( ! tcd_es11_es( $o ) ) { return; }
	$tipo = isset( $_POST['tcd_es_tipo'] ) ? sanitize_key( wp_unslash( $_POST['tcd_es_tipo'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification -- nonce do WooCommerce já verificado.
	$ok = true;
	if ( ! in_array( $tipo, array( 'particular', 'empresa' ), true ) ) { wc_add_notice( tcd_es11_t( 'err_tipo' ), 'error' ); $ok = false; }
	if ( empty( $_POST['tcd_es_c4'] ) ) { wc_add_notice( tcd_es11_t( 'err_c4' ), 'error' ); $ok = false; } // phpcs:ignore WordPress.Security.NonceVerification
	if ( ! $ok ) { return; }
	$m = array();
	foreach ( array( 'c1', 'c2', 'c3' ) as $k ) { if ( ! empty( $_POST[ 'tcd_es_' . $k ] ) ) { $m[] = $k; } } // phpcs:ignore WordPress.Security.NonceVerification
	tcd_es11_gravar( $o, $tipo, $m, 'order-pay' );
}, 5 );

// 2. Bloco de checkout (IPR Cloud, Intelligence, videochamadas). Os campos só existem nos pedidos em castelhano.
add_action( 'woocommerce_init', function () {
	if ( ! tcd_es11_ligado() || ! function_exists( 'woocommerce_register_additional_checkout_field' ) ) { return; }
	if ( ! function_exists( 'tcd_esp_lingua_es' ) || ! tcd_esp_lingua_es() ) { return; }
	woocommerce_register_additional_checkout_field( array( 'id' => 'tcd/es-tipo', 'label' => tcd_es11_t( 'tipo' ), 'location' => 'order', 'type' => 'select', 'required' => true,
		'options' => array( array( 'value' => 'particular', 'label' => tcd_es11_t( 'particular' ) ), array( 'value' => 'empresa', 'label' => tcd_es11_t( 'empresa' ) ) ) ) );
	woocommerce_register_additional_checkout_field( array( 'id' => 'tcd/es-inicio', 'label' => tcd_es11_t( 'c23' ), 'location' => 'order', 'type' => 'checkbox' ) );
	woocommerce_register_additional_checkout_field( array( 'id' => 'tcd/es-terminos', 'label' => tcd_es11_t( 'c4_bloque' ), 'location' => 'order', 'type' => 'checkbox', 'required' => true ) );
} );
add_action( 'woocommerce_store_api_checkout_order_processed', function ( $o ) {
	if ( ! tcd_es11_es( $o ) ) { return; }
	$tipo = (string) $o->get_meta( '_wc_other/tcd/es-tipo' );
	if ( ! in_array( $tipo, array( 'particular', 'empresa' ), true ) ) { return; }
	if ( ! $o->get_meta( '_wc_other/tcd/es-terminos' ) ) { return; } // sem registo, o guarda abaixo recusa o pagamento
	$ini = (bool) $o->get_meta( '_wc_other/tcd/es-inicio' );
	tcd_es11_gravar( $o, $tipo, $ini ? array( 'c2', 'c3' ) : array(), 'block' ); // a Base nunca se autoriza por esta caixa
} );
// Guarda de todos os pagamentos pela Store API (bloco de checkout, checkout/{id}, botões expressos da página de pagamento):
// encomenda espanhola sem consentimento gravado não é cobrada.
add_action( 'woocommerce_rest_checkout_process_payment_with_context', function ( $ctx, $res ) {
	$o = is_object( $ctx ) && isset( $ctx->order ) ? $ctx->order : null;
	if ( ! tcd_es11_es( $o ) || ! empty( tcd_es11_registo( $o )['caixas']['c4']['marcada'] ) ) { return; }
	$m = 'Para pagar este pedido, abra el enlace de pago y marque las casillas del pedido. Si el problema continúa, escríbanos a info@terracruadesign.pt.';
	if ( class_exists( 'Automattic\\WooCommerce\\StoreApi\\Exceptions\\RouteException' ) ) { throw new \Automattic\WooCommerce\StoreApi\Exceptions\RouteException( 'tcd_es11_consentimento', $m, 400 ); }
	throw new Exception( $m );
}, 1, 2 );
add_action( 'wp_enqueue_scripts', function () {
	if ( ! tcd_es11_ligado() || ! function_exists( 'tcd_esp_lingua_es' ) || ! tcd_esp_lingua_es() || ! function_exists( 'is_checkout' ) || ! is_checkout() ) { return; }
	$js = '(function(){var r=window.wc&&wc.blocksCheckout&&wc.blocksCheckout.registerCheckoutFilters;if(r){r("tcd-es11",{placeOrderButtonLabel:function(){return ' . wp_json_encode( tcd_es11_t( 'boton' ) ) . ';}});}})();';
	wp_add_inline_script( 'wc-blocks-checkout', $js, 'after' );
}, 30 );

// 3. Início diferido: Base (c1) e Leitura (c2) de particulares sem a caixa marcada não entram na fila do worker.
function tcd_es11_diferir( $o ) {
	if ( ! tcd_es11_es( $o ) || ! tcd_es11_particular( $o ) ) { return false; }
	$cx = tcd_es11_caixas_itens( tcd_es11_itens( $o ) );
	foreach ( array( 'c1', 'c2' ) as $k ) { if ( in_array( $k, $cx, true ) && ! tcd_es11_marcada( $o, $k ) ) { return true; } }
	return false;
}
add_action( 'woocommerce_order_status_processing', 'tcd_es11_ao_pagar', 20, 2 ); // antes do m14618 (30), que relê a encomenda
add_action( 'woocommerce_order_status_completed', 'tcd_es11_ao_pagar', 20, 2 );
function tcd_es11_ao_pagar( $id, $o = null ) {
	if ( ! is_object( $o ) ) { $o = function_exists( 'wc_get_order' ) ? wc_get_order( $id ) : null; }
	if ( ! $o || $o->get_meta( '_tcd_job_estado' ) ) { return; }
	$ini = tcd_es11_inicio_diferido( $o );
	// Sem terreno (IPR Cloud, Intelligence, visitas, videochamadas): o acesso não passa pelo worker; fica a nota à equipa.
	if ( ! $o->get_meta( '_tcd_geojson' ) ) {
		if ( ! tcd_es11_es( $o ) || ! tcd_es11_particular( $o ) || $o->get_meta( '_tcd_es11_nota' ) ) { return; }
		$falta = array_filter( array_intersect( array( 'c2', 'c3' ), tcd_es11_caixas_itens( tcd_es11_itens( $o ) ) ), function ( $k ) use ( $o ) { return ! tcd_es11_marcada( $o, $k ); } );
		if ( ! $falta ) { return; }
		$o->update_meta_data( '_tcd_es11_nota', time() );
		$o->add_order_note( 'ES-11: particular sem pedido de início imediato. O serviço ou o acesso só deve começar a ' . tcd_es11_data( $ini ) . '. Este módulo não adia o acesso da IPR Cloud nem do Intelligence: confirmar à mão.' );
		if ( function_exists( 'tcd_tg_enviar' ) ) { tcd_tg_enviar( 'Espanha: encomenda ' . $o->get_order_number() . ' sem início imediato; começar a ' . tcd_es11_data( $ini ) . '.' ); }
		$o->save();
		return;
	}
	if ( ! tcd_es11_diferir( $o ) ) { return; }
	$o->update_meta_data( '_tcd_job_estado', 'diferido' );
	$o->update_meta_data( '_tcd_es11_inicio', $ini );
	$o->add_order_note( 'ES-11: particular sem pedido de início imediato. Entra na fila sozinha a ' . tcd_es11_data( $ini ) . ' às ' . tcd_es11_hora( $ini ) . ', se não desistir antes.' );
	$o->save();
}
add_action( 'init', function () {
	if ( function_exists( 'wp_next_scheduled' ) && ! wp_next_scheduled( 'tcd_es11_cron' ) ) { wp_schedule_event( time() + 300, 'hourly', 'tcd_es11_cron' ); }
} );
add_action( 'tcd_es11_cron', 'tcd_es11_soltar' );
function tcd_es11_soltar() {
	if ( ! function_exists( 'wc_get_orders' ) || ! tcd_es11_ligado() ) { return 0; }
	$ids = wc_get_orders( array( 'limit' => 200, 'orderby' => 'date', 'order' => 'ASC', 'status' => array( 'processing', 'completed' ), 'return' => 'ids',
		'meta_query' => array( array( 'key' => '_tcd_job_estado', 'value' => 'diferido' ), array( 'key' => '_tcd_es11_inicio', 'value' => time(), 'compare' => '<=', 'type' => 'NUMERIC' ) ) ) );
	$n = 0;
	foreach ( $ids as $id ) {
		$o = wc_get_order( $id );
		if ( ! $o || 'diferido' !== $o->get_meta( '_tcd_job_estado' ) || (int) $o->get_meta( '_tcd_es11_inicio' ) > time() || $o->get_meta( '_tcd_es11_desist' ) ) { continue; }
		$o->delete_meta_data( '_tcd_job_estado' ); $o->save();
		if ( function_exists( 'tcd_wk_por_na_fila' ) ) { tcd_wk_por_na_fila( $o, 'Fila: terminou o prazo de desistência (ES-11); a encomenda entrou na fila.' ); $n++; }
	}
	return $n;
}

// 4. Desistência.
function tcd_es11_url_desistir( $o ) { return home_url( '/es/desistimiento/' ) . '?pedido=' . (int) $o->get_id() . '&k=' . rawurlencode( (string) $o->get_order_key() ); }
function tcd_es11_pode_desistir( $o ) {
	if ( ! tcd_es11_es( $o ) || ! tcd_es11_particular( $o ) || $o->get_meta( '_tcd_es11_desist' ) ) { return false; }
	if ( ! in_array( $o->get_status(), array( 'processing', 'completed', 'on-hold' ), true ) ) { return false; }
	if ( time() > tcd_es11_fim_prazo( $o ) ) { return false; }
	$cx = tcd_es11_caixas_itens( tcd_es11_itens( $o ) );
	$job = (string) $o->get_meta( '_tcd_job_estado' );
	// Só Base, com a caixa C.1 marcada e o processamento já começado: o direito perdeu-se (art. 103.m TRLGDCU).
	if ( array( 'c1' ) === $cx && tcd_es11_marcada( $o, 'c1' ) && '' !== $job && 'diferido' !== $job ) { return false; }
	return tcd_es11_tem_itens( $o );
}
add_filter( 'woocommerce_my_account_my_orders_actions', function ( $a, $o ) {
	if ( tcd_es11_pode_desistir( $o ) ) { $a['tcd_desistir'] = array( 'url' => tcd_es11_url_desistir( $o ), 'name' => tcd_es11_t( 'desistir' ) ); }
	return $a;
}, 10, 2 );

function tcd_es11_ip_ok() {
	$ip = function_exists( 'tcd_esp_ip' ) ? tcd_esp_ip() : ( $_SERVER['REMOTE_ADDR'] ?? '' ); // phpcs:ignore
	$k = 'tcd_es11_lim_' . md5( (string) $ip ); $n = (int) get_transient( $k );
	if ( $n >= 8 ) { return false; }
	set_transient( $k, $n + 1, HOUR_IN_SECONDS ); return true;
}
function tcd_es11_registar_desistencia( $o, $nome, $email, $motivo, $via ) {
	$t = time();
	$item = array(); foreach ( $o->get_items() as $it ) { $item[] = $it->get_name(); }
	$servico = implode( ', ', $item );
	$texto = 'Desisto del contrato del pedido n.º ' . $o->get_order_number() . ' (' . $servico . ').' . ( '' !== $motivo ? ' Motivo: ' . $motivo : '' );
	$o->update_meta_data( '_tcd_es11_desist', array( 't' => $t, 'nome' => $nome, 'email' => $email, 'texto' => $texto, 'via' => $via ) );
	if ( 'diferido' === $o->get_meta( '_tcd_job_estado' ) ) { $o->update_meta_data( '_tcd_job_estado', 'desistido' ); }
	$o->add_order_note( 'ES-11: o cliente desistiu do contrato a ' . tcd_es11_data( $t ) . ' às ' . tcd_es11_hora( $t ) . ' (' . $via . '). Texto: «' . $texto . '». Fazer o reembolso em 14 dias (descontar a parte prestada, se houve início pedido).' );
	$o->save();
	$assunto = sprintf( 'Hemos recibido su desistimiento · Pedido n.º %s', $o->get_order_number() );
	$corpo = sprintf( "Hola, %s:\n\nHemos recibido el %s, a las %s (hora de Lisboa), su decisión de desistir del contrato siguiente:\n\nPedido n.º %s · %s\n\nTexto de su comunicación: «%s»\n\nLe devolveremos los pagos que correspondan en un plazo máximo de 14 días naturales desde hoy, por el mismo medio de pago que usó. Si el servicio ya había empezado a petición suya, descontaremos la parte proporcional ya prestada y le indicaremos el cálculo.\n\nSi no ha sido usted quien ha enviado esta comunicación, escríbanos a info@terracruadesign.pt.\n\nTerracrua Design",
		$nome, tcd_es11_data( $t ), tcd_es11_hora( $t ), $o->get_order_number(), $servico, $texto );
	// Só para o e-mail da encomenda: o formulário não serve para mandar e-mails a terceiros.
	if ( is_email( (string) $o->get_billing_email() ) ) { wp_mail( (string) $o->get_billing_email(), $assunto, $corpo, array( 'Reply-To: Terracrua Design <info@terracruadesign.pt>' ) ); }
	wp_mail( 'info@terracruadesign.pt', 'Desistência (Espanha) · encomenda ' . $o->get_order_number(), "Desistência recebida.\n\n" . $texto . "\n\nTratar o reembolso em 14 dias: " . admin_url( 'post.php?post=' . $o->get_id() . '&action=edit' ) );
	if ( function_exists( 'tcd_tg_enviar' ) ) { tcd_tg_enviar( 'Desistência (Espanha) na encomenda ' . $o->get_order_number() . '. Reembolso em 14 dias.' ); }
	return $t;
}
// O envio trata-se antes da página (template_redirect) e redirecciona com o resultado: recarregar não repete nada.
function tcd_es11_dono( $pid, $k ) {
	$o = $pid && function_exists( 'wc_get_order' ) ? wc_get_order( $pid ) : null;
	$ok = $o && ( ( '' !== $k && hash_equals( (string) $o->get_order_key(), $k ) ) || ( is_user_logged_in() && (int) $o->get_customer_id() === get_current_user_id() ) );
	return $ok ? $o : null;
}
function tcd_es11_processar() {
	$pid = isset( $_POST['pedido'] ) ? absint( $_POST['pedido'] ) : 0; // phpcs:ignore WordPress.Security.NonceVerification
	$k   = isset( $_POST['k'] ) ? sanitize_text_field( wp_unslash( $_POST['k'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification
	$o = tcd_es11_dono( $pid, $k ); $dono = (bool) $o;
	if ( ! tcd_es11_ip_ok() ) { return array( 'r' => 'limite' ); }
	$nonce_ok = wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['tcd_es11_n'] ?? '' ) ), 'tcd_es11_desist' ); // phpcs:ignore
	$nome   = sanitize_text_field( wp_unslash( $_POST['nombre'] ?? '' ) ); // phpcs:ignore
	$email  = sanitize_email( wp_unslash( $_POST['email'] ?? '' ) ); // phpcs:ignore
	$motivo = mb_substr( sanitize_textarea_field( wp_unslash( $_POST['motivo'] ?? '' ) ), 0, 1000 ); // phpcs:ignore
	$num    = sanitize_text_field( wp_unslash( $_POST['numero'] ?? '' ) ); // phpcs:ignore
	if ( $nonce_ok && ! $o && '' !== $num && function_exists( 'wc_get_order' ) ) {
		$c = wc_get_order( absint( preg_replace( '/\D/', '', $num ) ) );
		if ( $c && is_email( $email ) && 0 === strcasecmp( (string) $c->get_billing_email(), $email ) ) { $o = $c; }
	}
	if ( $nonce_ok && $o && tcd_es11_pode_desistir( $o ) ) {
		$t = tcd_es11_registar_desistencia( $o, $nome, $email, $motivo, $dono ? 'botão' : 'formulário' );
		return array( 'r' => 'ok', 'n' => $o->get_order_number(), 't' => $t );
	}
	// Sem encomenda identificada, fora do prazo ou com a página antiga em cache (nonce caducado): nada se perde;
	// fica registado com data e hora e a equipa verifica e responde.
	$l = get_option( 'tcd_es11_livres', array() ); $l = is_array( $l ) ? array_slice( $l, -199 ) : array();
	$l[] = array( 't' => time(), 'nome' => $nome, 'email' => $email, 'numero' => $num, 'motivo' => $motivo, 'pedido' => $o ? $o->get_id() : 0, 'nonce' => $nonce_ok ? 1 : 0 );
	update_option( 'tcd_es11_livres', $l, false );
	wp_mail( 'info@terracruadesign.pt', 'Desistência (Espanha) por verificar', "Nome: $nome\nE-mail: $email\nPedido indicado: $num\nMotivo: $motivo\n\nNão foi possível registar automaticamente (encomenda não identificada, fora do prazo ou página antiga). Verificar e responder à pessoa." );
	if ( function_exists( 'tcd_tg_enviar' ) ) { tcd_tg_enviar( 'Desistência (Espanha) por verificar: ' . esc_html( $email ) . ', pedido ' . esc_html( $num ) . '.' ); }
	return array( 'r' => 'verificar' );
}
add_action( 'template_redirect', function () {
	if ( ! tcd_es11_ligado() || 'POST' !== ( $_SERVER['REQUEST_METHOD'] ?? '' ) || ! isset( $_POST['tcd_es11_n'] ) ) { return; } // phpcs:ignore
	$res = tcd_es11_processar();
	$c = wp_generate_password( 16, false, false ); set_transient( 'tcd_es11_res_' . $c, $res, HOUR_IN_SECONDS );
	wp_safe_redirect( add_query_arg( 'tcd_es11_r', $c, home_url( '/es/desistimiento/' ) ) ); exit;
} );
add_shortcode( 'tcd_desistir', 'tcd_es11_ecra' );
function tcd_es11_ecra() {
	if ( ! defined( 'DONOTCACHEPAGE' ) ) { define( 'DONOTCACHEPAGE', true ); }
	$h = '<div class="tcd-desistir"><h2>Desistir del contrato</h2>';
	$rc = isset( $_GET['tcd_es11_r'] ) ? preg_replace( '/[^A-Za-z0-9]/', '', (string) $_GET['tcd_es11_r'] ) : ''; // phpcs:ignore
	$res = '' !== $rc ? get_transient( 'tcd_es11_res_' . $rc ) : false;
	if ( is_array( $res ) ) {
		if ( 'ok' === $res['r'] ) { return $h . '<p>Hemos recibido su decisión de desistir del pedido n.º ' . esc_html( $res['n'] ) . ' el ' . esc_html( tcd_es11_data( $res['t'] ) ) . ' a las ' . esc_html( tcd_es11_hora( $res['t'] ) ) . ' (hora de Lisboa). Le hemos enviado la confirmación de recepción por correo electrónico.</p></div>'; }
		if ( 'verificar' === $res['r'] ) { return $h . '<p>Hemos recibido su comunicación. No hemos podido asociarla automáticamente a un pedido dentro del plazo; la revisaremos y le responderemos por correo electrónico.</p></div>'; }
		return $h . '<p>No hemos podido registrar la comunicación. Escríbanos a <a href="mailto:info@terracruadesign.pt">info@terracruadesign.pt</a>.</p></div>';
	}
	$pid = isset( $_GET['pedido'] ) ? absint( $_GET['pedido'] ) : 0; // phpcs:ignore WordPress.Security.NonceVerification
	$k   = isset( $_GET['k'] ) ? sanitize_text_field( wp_unslash( $_GET['k'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification
	$o   = tcd_es11_dono( $pid, $k );
	if ( $o && ! tcd_es11_pode_desistir( $o ) ) {
		$h .= '<p>Este pedido ya no admite el desistimiento en línea (plazo terminado, desistimiento ya comunicado o derecho perdido). Si tiene dudas, escríbanos a <a href="mailto:info@terracruadesign.pt">info@terracruadesign.pt</a>.</p>';
	}
	$v = function ( $s ) { return esc_attr( (string) $s ); };
	$nome = $o ? trim( $o->get_billing_first_name() . ' ' . $o->get_billing_last_name() ) : '';
	$h .= '<form method="post">';
	$h .= '<p><label>Nombre<br><input type="text" name="nombre" required value="' . $v( $nome ) . '"></label></p>';
	$h .= '<p><label>Pedido<br><input type="text" name="numero" required value="' . $v( $o ? $o->get_order_number() : '' ) . '"' . ( $o ? ' readonly' : '' ) . '></label>';
	if ( $o ) { $it = array(); foreach ( $o->get_items() as $i ) { $it[] = $i->get_name(); } $h .= '<br><small>' . esc_html( implode( ', ', $it ) ) . '</small>'; }
	$h .= '</p><p><label>Correo electrónico para la confirmación<br><input type="email" name="email" required value="' . $v( $o ? $o->get_billing_email() : '' ) . '"></label></p>';
	$h .= '<p><label>Motivo (opcional)<br><textarea name="motivo" rows="3" maxlength="1000"></textarea></label></p>';
	$h .= '<p>Al confirmar, nos comunica su decisión de desistir de este contrato. Le enviaremos de inmediato una confirmación de recepción por correo electrónico con la fecha y la hora.</p>';
	$h .= '<input type="hidden" name="tcd_es11_n" value="' . $v( wp_create_nonce( 'tcd_es11_desist' ) ) . '">';
	if ( $o ) { $h .= '<input type="hidden" name="pedido" value="' . (int) $o->get_id() . '"><input type="hidden" name="k" value="' . $v( $k ) . '">'; }
	$h .= '<p><button type="submit"><strong>Confirmar desistimiento</strong></button></p></form></div>';
	return $h;
}

// 5. E-mail de confirmação da encomenda (F.1 a F.5), só para particulares.
function tcd_es11_paragrafos( $o ) {
	if ( ! tcd_es11_es( $o ) || ! tcd_es11_particular( $o ) ) { return array(); }
	$cx = tcd_es11_caixas_itens( tcd_es11_itens( $o ) );
	if ( ! tcd_es11_tem_itens( $o ) ) { return array(); }
	$q = tcd_es11_quando( $o ) ?: tcd_es11_contrato( $o ); $fim = tcd_es11_fim_prazo( $o );
	$p = array();
	if ( in_array( 'c1', $cx, true ) ) {
		$p[] = tcd_es11_marcada( $o, 'c1' )
			? sprintf( 'Usted solicitó expresamente, el %s a las %s, que empezáramos a procesar la Base Cartográfica de inmediato, antes de que terminara el plazo de desistimiento, y reconoció que con ello perdía su derecho de desistimiento. Le confirmamos ese consentimiento y ese reconocimiento. Por este motivo, una vez iniciado el procesamiento, no puede desistir de este pedido. Si la Base no se ajusta a lo descrito, conserva sus derechos de conformidad: escríbanos a info@terracruadesign.pt.', tcd_es11_data( $q ), tcd_es11_hora( $q ) )
			: sprintf( 'Usted no ha pedido el inicio inmediato. El procesamiento de la Base Cartográfica empezará el %s, al terminar el plazo de desistimiento de 14 días. Hasta entonces puede desistir del pedido y le devolveremos el importe íntegro.', tcd_es11_data( $fim ) );
	}
	if ( in_array( 'c2', $cx, true ) && tcd_es11_marcada( $o, 'c2' ) ) {
		$p[] = sprintf( 'Usted solicitó expresamente, el %s a las %s, que la prestación empezara durante el plazo de desistimiento, que termina el %s. Si desiste antes de esa fecha, le devolveremos lo pagado menos la parte proporcional del servicio ya prestado. Cuando el servicio esté prestado por completo, ya no podrá desistir.', tcd_es11_data( $q ), tcd_es11_hora( $q ), tcd_es11_data( $fim ) );
	}
	if ( in_array( 'c3', $cx, true ) && tcd_es11_marcada( $o, 'c3' ) ) {
		$p[] = sprintf( 'Usted solicitó el acceso inmediato el %s a las %s. Puede desistir hasta el %s; en ese caso le devolveremos el importe pagado menos la parte proporcional al tiempo transcurrido. Este acceso no se renueva automáticamente.', tcd_es11_data( $q ), tcd_es11_hora( $q ), tcd_es11_data( $fim ) );
	}
	$p[] = tcd_es11_adjuntos()
		? 'Tiene derecho a desistir de este contrato en un plazo de 14 días naturales desde hoy, en las condiciones indicadas arriba y en los Términos y condiciones adjuntos. Para hacerlo, use el botón «Desistir del contrato aquí» (' . tcd_es11_url_desistir( $o ) . '), el formulario adjunto o escríbanos a info@terracruadesign.pt.'
		: 'Tiene derecho a desistir de este contrato en un plazo de 14 días naturales desde hoy, en las condiciones indicadas arriba y en los Términos y condiciones (' . home_url( '/es/terminos/' ) . '). Para hacerlo, use el botón «Desistir del contrato aquí» (' . tcd_es11_url_desistir( $o ) . '), el formulario de desistimiento (' . home_url( '/es/desistimiento/' ) . ') o escríbanos a info@terracruadesign.pt.';
	return $p;
}
add_action( 'woocommerce_email_order_meta', function ( $o, $admin, $plain, $email = null ) {
	if ( $admin || ! $email || ! in_array( $email->id, array( 'customer_processing_order', 'customer_completed_order' ), true ) ) { return; }
	if ( 'customer_completed_order' === $email->id && 'customer_processing_order' === $o->get_meta( '_tcd_es11_f' ) ) { return; }
	$p = tcd_es11_paragrafos( $o );
	if ( ! $p ) { return; }
	if ( $plain ) { echo "\n" . implode( "\n\n", $p ) . "\n"; } // phpcs:ignore WordPress.Security.EscapeOutput
	else { foreach ( $p as $x ) { echo '<p>' . make_clickable( esc_html( $x ) ) . '</p>'; } } // phpcs:ignore WordPress.Security.EscapeOutput
	$o->update_meta_data( '_tcd_es11_f', $email->id ); $o->save_meta_data();
}, 20, 4 );

// Anexos do e-mail de confirmação (secção F): Términos e formulário em PDF. Caminhos absolutos na opção
// tcd_es11_adjuntos (lista). Sem ficheiros, o F.5 leva ligações em vez de «adjuntos».
function tcd_es11_adjuntos() {
	$l = get_option( 'tcd_es11_adjuntos', array() );
	return array_values( array_filter( is_array( $l ) ? $l : array(), function ( $f ) { return is_string( $f ) && '.pdf' === strtolower( substr( $f, -4 ) ) && file_exists( $f ); } ) );
}
add_filter( 'woocommerce_email_attachments', function ( $a, $id, $o = null ) {
	if ( ! in_array( $id, array( 'customer_processing_order', 'customer_completed_order' ), true ) || ! is_object( $o ) || ! method_exists( $o, 'get_meta' ) ) { return $a; }
	if ( 'customer_completed_order' === $id && 'customer_processing_order' === $o->get_meta( '_tcd_es11_f' ) ) { return $a; }
	if ( ! tcd_es11_paragrafos( $o ) ) { return $a; }
	return array_merge( (array) $a, tcd_es11_adjuntos() );
}, 10, 3 );
