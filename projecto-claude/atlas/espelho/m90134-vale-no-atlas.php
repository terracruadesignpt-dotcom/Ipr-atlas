<?php
// Módulo 90134: vale de oferta aceite logo no pedido da Base, no Atlas; Locais dentro de Camadas; separador Rever (pedidos do Nuno, 20/10/2026).
// v2 (20/10, 14h Lisboa): o código deixa de ser obrigatório. Regra do Nuno: «o vale vale na mesma, desde que seja a pessoa a quem
// foi entregue». Os 56 vales entregues a 18 e 19/10 guardam o nome de quem recebeu (meta _tcd_entregue, m90101), não o e-mail.
// Por isso, num pedido sem código, o nome de quem encomenda é comparado com os nomes dos vales entregues e por usar: se só um
// vale tiver o mesmo primeiro nome (e, havendo mais do que um, o apelido desempatar), o vale é aplicado sozinho, com nota na
// encomenda e aviso no Telegram, para o Nuno poder anular se não for a pessoa. Se houver dúvida, não aplica e avisa.
// O mesmo reconhecimento corre na página de pagamento (quem seguiu a mensagem antiga «escreva o código na página de pagamento»).
// Problema visto a 20/10: o campo «Tem um vale?» (m90069, m90078) só existia na página de pagamento, e quem pede pelo Atlas
// só chega lá se a cobertura LiDAR for total e o pagamento imediato estiver ligado. Aqui: o pedido do Atlas aceita um campo
// `vale`; o servidor valida o código, cria a conta pelo e-mail se não existir (como o m90078; o WooCommerce envia o e-mail
// «A sua conta» com a ligação para definir a palavra-passe), aplica o cupão à encomenda acabada de criar e, se o total ficar
// a 0 €, passa-a a produção sem pagamento (como o m90069). A resposta diz ao Atlas o que aconteceu.
// Nunca inicia sessão numa conta que já exista com outro dono. Interruptor: opção tcd_vale_atlas_off = 1. Prefixo tcd_va2_.
if ( ! defined( 'ABSPATH' ) ) { exit; }

function tcd_va2_codigo( $r ) {
	$c = strtolower( trim( sanitize_text_field( (string) $r->get_param( 'vale' ) ) ) );
	$c = preg_replace( '/\s+/', '', $c );
	if ( preg_match( '/^(ps-)?[a-z0-9]{6}$/', $c ) ) { $c = 'oferta-' . $c; } // aceita o código sem o prefixo OFERTA-
	return preg_match( '/^[a-z0-9-]{4,30}$/', $c ) ? $c : '';
}

// Nome normalizado em palavras: minúsculas, sem acentos, sem partículas (de, da, dos…), só palavras com 2+ letras.
function tcd_va2_palavras( $nome ) {
	$s = strtolower( remove_accents( (string) $nome ) );
	$s = preg_replace( '/[^a-z0-9 ]+/', ' ', $s );
	$fora = array( 'de', 'da', 'do', 'das', 'dos', 'e', 'y', 'van', 'von', 'del', 'la', 'le' );
	$p = array();
	foreach ( preg_split( '/\s+/', trim( $s ) ) as $w ) { if ( strlen( $w ) >= 2 && ! in_array( $w, $fora, true ) ) { $p[] = $w; } }
	return $p;
}

// Vales entregues (meta _tcd_entregue do m90101), publicados, por usar e dentro da validade: código => nome. Cache 10 min.
function tcd_va2_entregues() {
	$c = get_transient( 'tcd_va2_entregues' );
	if ( is_array( $c ) ) { return $c; }
	global $wpdb;
	$rows = $wpdb->get_results( "SELECT p.post_name AS cod, e.meta_value AS e, COALESCE(u.meta_value,'0') AS u, COALESCE(l.meta_value,'0') AS l, COALESCE(x.meta_value,'0') AS x
		FROM {$wpdb->posts} p
		JOIN {$wpdb->postmeta} e ON e.post_id = p.ID AND e.meta_key = '_tcd_entregue'
		LEFT JOIN {$wpdb->postmeta} u ON u.post_id = p.ID AND u.meta_key = 'usage_count'
		LEFT JOIN {$wpdb->postmeta} l ON l.post_id = p.ID AND l.meta_key = 'usage_limit'
		LEFT JOIN {$wpdb->postmeta} x ON x.post_id = p.ID AND x.meta_key = 'date_expires'
		WHERE p.post_type = 'shop_coupon' AND p.post_status = 'publish' AND p.post_name LIKE 'oferta-%'", ARRAY_A ); // phpcs:ignore
	$out = array();
	foreach ( (array) $rows as $r ) {
		if ( (int) $r['l'] > 0 && (int) $r['u'] >= (int) $r['l'] ) { continue; }
		if ( (int) $r['x'] > 0 && (int) $r['x'] < time() ) { continue; }
		$e = maybe_unserialize( $r['e'] );
		if ( ! is_array( $e ) || empty( $e['nome'] ) ) { continue; }
		$out[ strtolower( $r['cod'] ) ] = (string) $e['nome'];
	}
	set_transient( 'tcd_va2_entregues', $out, 10 * MINUTE_IN_SECONDS );
	return $out;
}

// Reconhecer a pessoa pelo nome. Devolve array( 'cod' => string|'' , 'candidatos' => array(cod => nome) ).
// Correspondência forte: o vale foi registado só com uma palavra (p. ex. «Franco») e essa palavra está no nome de quem encomenda;
// ou o primeiro nome é igual e há um apelido em comum (ou quem encomenda só escreveu o primeiro nome).
// Correspondência fraca: só o primeiro nome é igual e os apelidos não batem («Pedro Franco» vs «Pedro Baptista»): não aplica, avisa.
// Só aplica sozinho quando há exactamente uma correspondência forte.
function tcd_va2_reconhecer( $nome ) {
	$o = tcd_va2_palavras( $nome );
	if ( ! $o ) { return array( 'cod' => '', 'candidatos' => array() ); }
	$fortes = array(); $fracos = array();
	foreach ( tcd_va2_entregues() as $cod => $n ) {
		$r = tcd_va2_palavras( $n );
		if ( ! $r ) { continue; }
		if ( 1 === count( $r ) ) {
			if ( in_array( $r[0], $o, true ) ) { $fortes[ $cod ] = $n; }
		} elseif ( $r[0] === $o[0] ) {
			if ( 1 === count( $o ) || count( array_intersect( array_slice( $r, 1 ), array_slice( $o, 1 ) ) ) ) { $fortes[ $cod ] = $n; } else { $fracos[ $cod ] = $n; }
		}
	}
	if ( 1 === count( $fortes ) ) { return array( 'cod' => (string) array_key_first( $fortes ), 'candidatos' => $fortes + $fracos ); }
	return array( 'cod' => '', 'candidatos' => $fortes ? $fortes : $fracos );
}

// Aplicar um vale a uma encomenda à espera de pagamento. $como = 'codigo' | 'nome'. Devolve array( ok, total, mensagem ).
function tcd_va2_aplicar( $o, $cod, $como = 'codigo', $entregue_a = '' ) {
	$cod = strtolower( $cod );
	$u  = null;
	$em = strtolower( trim( (string) $o->get_billing_email() ) );
	$u  = $o->get_customer_id() ? get_userdata( $o->get_customer_id() ) : ( is_email( $em ) ? get_user_by( 'email', $em ) : false );
	if ( ! $u && is_email( $em ) && function_exists( 'wc_create_new_customer' ) ) {
		$uid = wc_create_new_customer( $em, '', '', array( 'first_name' => $o->get_billing_first_name(), 'last_name' => $o->get_billing_last_name() ) );
		if ( ! is_wp_error( $uid ) ) { $o->set_customer_id( (int) $uid ); $o->add_order_note( 'Conta criada ao aplicar o vale ' . strtoupper( $cod ) . '. O WooCommerce enviou o e-mail para definir a palavra-passe.' ); $u = get_userdata( (int) $uid ); }
	} elseif ( $u && ! $o->get_customer_id() ) {
		$o->set_customer_id( (int) $u->ID );
	}
	$r = $o->apply_coupon( $cod );
	if ( is_wp_error( $r ) ) {
		$o->add_order_note( 'Vale ' . strtoupper( $cod ) . ' recusado: ' . $r->get_error_message() );
		$o->save();
		return array( 'ok' => false, 'mensagem' => 'O pedido ficou registado, mas o vale não pôde ser aplicado: ' . $r->get_error_message() . ' Escreva para info@terracruadesign.pt com a referência ' . $o->get_meta( '_tcd_pedido' ) . '.' );
	}
	$o->calculate_totals( true );
	$quem = $o->get_formatted_billing_full_name();
	$o->add_order_note( 'nome' === $como
		? 'Vale ' . strtoupper( $cod ) . ' aplicado automaticamente: o nome de quem encomenda (' . $quem . ') corresponde a quem o recebeu (' . $entregue_a . '). Se não for a mesma pessoa, retire o cupão e cancele.'
		: 'Vale ' . strtoupper( $cod ) . ' aplicado no pedido do Atlas.' );
	if ( function_exists( 'tcd_rede_vale_profissional' ) && tcd_rede_vale_profissional( $cod ) ) { $o->update_meta_data( '_tcd_voucher', 'rede' ); }
	$o->update_meta_data( '_tcd_va2_como', $como );
	$o->save();
	delete_transient( 'tcd_va2_entregues' );
	$local = esc_html( (string) $o->get_meta( '_tcd_local' ) ) . ', ' . esc_html( (string) $o->get_meta( '_tcd_area_ha' ) ) . ' ha';
	$pre   = 'nome' === $como ? 'Vale ' . strtoupper( $cod ) . ' (entregue a ' . esc_html( $entregue_a ) . ') aplicado pelo nome a ' . esc_html( $quem ) : 'Vale ' . strtoupper( $cod ) . ' usado por ' . esc_html( $quem );
	if ( (float) $o->get_total() <= 0 ) {
		$o->update_meta_data( 'tocwoo_enabled', '0' ); $o->save(); // sem factura a 0 € (TOConline)
		$o->set_date_paid( time() );
		$o->update_status( 'processing', 'Total a 0 € com o vale: encomenda passou a produção sem pagamento. Sem factura.' );
		if ( function_exists( 'tcd_tg_enviar' ) ) { tcd_tg_enviar( $pre . ', encomenda #' . $o->get_order_number() . ' (' . $local . '). Foi para produção sem pagamento.' . ( 'nome' === $como ? ' Se não for a mesma pessoa, cancele a encomenda.' : '' ) ); }
		return array( 'ok' => true, 'total' => 0, 'mensagem' => 'Vale aplicado. A sua Base está em produção, sem pagamento. Quando estiver pronta recebe um e-mail' . ( $u ? ' com a ligação para a sua área de cliente' : '' ) . '.' );
	}
	if ( function_exists( 'tcd_tg_enviar' ) ) { tcd_tg_enviar( $pre . ', encomenda #' . $o->get_order_number() . ' (' . $local . '). Falta pagar ' . wp_strip_all_tags( wc_price( $o->get_total() ) ) . '.' ); }
	return array( 'ok' => true, 'total' => (float) $o->get_total(), 'mensagem' => 'Vale aplicado. Falta pagar ' . wp_strip_all_tags( wc_price( $o->get_total() ) ) . ', porque a área passa o que o vale cobre.', 'pagar' => $o->get_checkout_payment_url() );
}

// 1. Antes do pedido: se vier um vale, tem de existir. Recusa cedo, com mensagem clara, em vez de criar uma encomenda sem vale.
add_filter( 'rest_pre_dispatch', function ( $res, $srv, $r ) {
	if ( null !== $res || get_option( 'tcd_vale_atlas_off' ) || ! ( $r instanceof WP_REST_Request ) ) { return $res; }
	if ( 'POST' !== strtoupper( $r->get_method() ) || '/tcd/v1/pedido-base' !== strtolower( untrailingslashit( $r->get_route() ) ) ) { return $res; }
	$GLOBALS['tcd_va2_cod'] = '';
	$GLOBALS['tcd_va2_pb']  = true;
	$bruto = trim( (string) $r->get_param( 'vale' ) );
	if ( '' === $bruto ) { return $res; }
	$cod = tcd_va2_codigo( $r );
	if ( '' === $cod || ! function_exists( 'wc_get_coupon_id_by_code' ) || ! wc_get_coupon_id_by_code( $cod ) ) {
		return new WP_Error( 'tcd_vale', 'Não encontrámos esse vale. Confirme o código tal como o recebeu, ou escreva para info@terracruadesign.pt.', array( 'status' => 400 ) );
	}
	$ip = function_exists( 'tcd_sn_ip' ) ? (string) tcd_sn_ip() : (string) ( $_SERVER['REMOTE_ADDR'] ?? '0' ); // phpcs:ignore
	$k = 'tcd_va2_' . md5( $ip ); $n = (int) get_transient( $k );
	if ( $n >= 10 ) { return new WP_Error( 'tcd_vale_limite', 'Demasiadas tentativas. Tente daqui a uma hora ou escreva para info@terracruadesign.pt.', array( 'status' => 429 ) ); }
	set_transient( $k, $n + 1, HOUR_IN_SECONDS );
	$GLOBALS['tcd_va2_cod'] = $cod;
	return $res;
}, 9, 3 );

// 2. Depois do pedido: a encomenda já existe (meta _tcd_pedido = referência). Aplica o vale (pelo código ou pelo nome) e responde.
add_filter( 'rest_post_dispatch', function ( $res, $srv, $req ) {
	if ( empty( $GLOBALS['tcd_va2_pb'] ) || '/tcd/v1/pedido-base' !== $req->get_route() || ! $res instanceof WP_REST_Response ) { return $res; }
	$cod = (string) ( $GLOBALS['tcd_va2_cod'] ?? '' );
	$d = $res->get_data();
	if ( ! is_array( $d ) || empty( $d['ok'] ) || empty( $d['pedido'] ) || ! function_exists( 'wc_get_orders' ) ) { return $res; }
	$ids = wc_get_orders( array( 'limit' => 1, 'return' => 'ids', 'orderby' => 'date', 'order' => 'DESC',
		'meta_query' => array( array( 'key' => '_tcd_pedido', 'value' => (string) $d['pedido'] ) ) ) );
	$o = $ids ? wc_get_order( $ids[0] ) : null;
	if ( ! $o || ! $o->needs_payment() ) { return $res; }

	if ( '' !== $cod ) {
		$d['vale'] = tcd_va2_aplicar( $o, $cod, 'codigo' );
	} elseif ( ! $o->get_coupon_codes() ) {
		$rec = tcd_va2_reconhecer( $o->get_formatted_billing_full_name() );
		if ( '' !== $rec['cod'] ) {
			$d['vale'] = tcd_va2_aplicar( $o, $rec['cod'], 'nome', $rec['candidatos'][ $rec['cod'] ] );
			if ( ! empty( $d['vale']['ok'] ) ) { $d['vale']['mensagem'] = 'Reconhecemos o seu vale de oferta. ' . $d['vale']['mensagem']; }
		} else {
			if ( $rec['candidatos'] && function_exists( 'tcd_tg_enviar' ) ) {
				$o->add_order_note( 'Pedido sem vale; nome parecido com mais do que um vale entregue: ' . implode( ', ', array_map( function ( $c, $n ) { return strtoupper( $c ) . ' (' . $n . ')'; }, array_keys( $rec['candidatos'] ), $rec['candidatos'] ) ) . '. Aplicar à mão o certo, se for a pessoa.' );
				tcd_tg_enviar( 'Pedido do Atlas sem vale, encomenda #' . $o->get_order_number() . ' de ' . esc_html( $o->get_formatted_billing_full_name() ) . ': pode ser um de ' . count( $rec['candidatos'] ) . ' vales entregues (' . esc_html( implode( ', ', $rec['candidatos'] ) ) . '). Confirmar e aplicar na encomenda.' );
			}
			// Sem vale aplicado: dá ao Atlas a página de pagamento, onde o campo do vale também existe (m90069/m90078).
			$d['vale_url'] = $o->get_checkout_payment_url();
		}
	}
	if ( ! empty( $d['vale']['ok'] ) ) {
		if ( empty( $d['vale']['pagar'] ) ) { unset( $d['pagar'] ); } else { $d['pagar'] = $d['vale']['pagar']; unset( $d['vale']['pagar'] ); }
	}
	$res->set_data( $d );
	return $res;
}, 20, 3 );

// 3. Página de pagamento (quem seguiu a mensagem antiga): sem cupão e com nome reconhecido, aplica o vale antes do formulário.
add_action( 'template_redirect', function () {
	if ( get_option( 'tcd_vale_atlas_off' ) || ! function_exists( 'wc_get_order' ) || ! function_exists( 'is_wc_endpoint_url' ) || ! is_wc_endpoint_url( 'order-pay' ) ) { return; }
	$oid = absint( get_query_var( 'order-pay' ) );
	$o   = $oid ? wc_get_order( $oid ) : null;
	if ( ! $o || ! $o->needs_payment() || $o->get_coupon_codes() || $o->get_meta( '_tcd_va2_tent' ) ) { return; }
	$chave = isset( $_GET['key'] ) ? sanitize_text_field( wp_unslash( $_GET['key'] ) ) : ''; // phpcs:ignore
	if ( ! $chave || $o->get_order_key() !== $chave ) { return; }
	$o->update_meta_data( '_tcd_va2_tent', current_time( 'mysql' ) ); $o->save(); // uma tentativa por encomenda
	$rec = tcd_va2_reconhecer( $o->get_formatted_billing_full_name() );
	if ( '' === $rec['cod'] ) { return; }
	$v = tcd_va2_aplicar( $o, $rec['cod'], 'nome', $rec['candidatos'][ $rec['cod'] ] );
	if ( ! empty( $v['ok'] ) && (float) $o->get_total() <= 0 ) {
		if ( function_exists( 'wc_add_notice' ) ) { wc_add_notice( 'Reconhecemos o seu vale de oferta. ' . $v['mensagem'], 'success' ); }
		wp_safe_redirect( $o->get_checkout_order_received_url() ); exit;
	}
	if ( function_exists( 'wc_add_notice' ) ) { wc_add_notice( ! empty( $v['ok'] ) ? 'Reconhecemos o seu vale de oferta. ' . $v['mensagem'] : $v['mensagem'], ! empty( $v['ok'] ) ? 'success' : 'error' ); }
}, 20 );

// 4. Complementos do Atlas servidos pelo Núcleo: vale.js (campo do vale, com ou sem sessão) e admin.js
// (Locais dentro de Camadas para todos; separador «Rever» com lista de verificação e entrega em lote, só com sessão).
add_action( 'wp_enqueue_scripts', function () {
	if ( get_option( 'tcd_vale_atlas_off' ) || ! is_page( array( 14581, 'atlas' ) ) ) { return; }
	wp_enqueue_script( 'tcd-va2-atlas-admin', content_url( 'plugins/terracrua-nucleo/assets/atlas/admin.js' ), array(), '441cc6b65b', true );
	wp_enqueue_script( 'tcd-va2-atlas-vale', content_url( 'plugins/terracrua-nucleo/assets/atlas/vale.js' ), array(), '3800990f7f', true );
}, 30 );
