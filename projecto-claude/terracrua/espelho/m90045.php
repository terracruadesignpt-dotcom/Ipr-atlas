<?php
// Módulo 90045: vales de oferta reconhecidos pela pessoa e conta activada por e-mail (20/10/2026, pedido do Nuno).
// Sessão do webmaster (gama 90030-90049). Funciona com ou sem o m90134 (sessão principal) publicado.
// Regras do Nuno:
// 1. Se o código do vale falhar ou faltar, o vale vale na mesma, desde que seja a pessoa a quem foi entregue.
//    - Código escrito com erros de forma (espaços, sem hífen, sem «OFERTA-») é corrigido e aceite.
//    - Código que não existe: o pedido segue na mesma, fica «vale por confirmar» (meta _tcd_vale_por_confirmar),
//      com nota na encomenda e aviso no Telegram; a equipa aplica o vale à mão.
//    - Sem código: se o e-mail ou o telemóvel da encomenda coincidirem com o contacto guardado no vale entregue
//      (meta _tcd_vale_contacto, novo campo na página 14834), o vale é aplicado sozinho. Se só o nome se parecer,
//      vai um aviso ao Telegram com os vales possíveis, sem aplicar nada.
// 2. A encomenda feita no Atlas cria a conta pelo e-mail, se não existir (nunca inicia sessão).
// 3. Conta criada sem palavra-passe escolhida fica «por activar» (user meta tcd_conta_por_activar) e recebe o e-mail
//    «Active a sua conta», com a ligação para definir a palavra-passe; o e-mail de conta nova do WooCommerce não segue
//    para essas contas (seriam dois). Ao definir a palavra-passe a conta fica activa.
// 4. O e-mail da encomenda segue como sempre.
// 20/10, 16h: os códigos PRO-XXXXXX da Oferta Profissional também são reconhecidos pela pessoa (contacto).
// Interruptor: opção tcd_v45_off = 1. Prefixo tcd_v45_.
if ( ! defined( 'ABSPATH' ) ) { exit; }

function tcd_v45_ligado() { return '1' !== (string) get_option( 'tcd_v45_off' ); }

function tcd_v45_norm( $s ) {
	$s = function_exists( 'remove_accents' ) ? remove_accents( (string) $s ) : (string) $s;
	return trim( preg_replace( '/\s+/', ' ', strtolower( $s ) ) );
}

function tcd_v45_tel( $s ) {
	$d = preg_replace( '/\D/', '', (string) $s );
	if ( strlen( $d ) > 9 && 0 === strpos( $d, '00' ) ) { $d = substr( $d, 2 ); }
	return strlen( $d ) >= 9 ? substr( $d, -9 ) : '';
}

// Código escrito pela pessoa -> código do cupão que existe (ou '').
function tcd_v45_resolver( $bruto ) {
	if ( ! function_exists( 'wc_get_coupon_id_by_code' ) ) { return ''; }
	$orig = strtolower( trim( (string) $bruto ) );
	$b    = preg_replace( '/[^a-z0-9]/', '', tcd_v45_norm( $bruto ) );
	if ( '' === $b || strlen( $b ) > 30 ) { return ''; }
	$cands = array( $orig );
	if ( 0 === strpos( $b, 'oferta' ) ) { $b = substr( $b, 6 ); }
	if ( 0 === strpos( $b, 'ps' ) && strlen( $b ) > 6 ) {
		$cands[] = 'oferta-ps-' . substr( $b, 2 );
	}
	$cands[] = 'oferta-' . $b;
	$cands[] = 'oferta-ps-' . $b;
	foreach ( array_unique( $cands ) as $c ) {
		if ( preg_match( '/^[a-z0-9-]{4,40}$/', $c ) && wc_get_coupon_id_by_code( $c ) ) { return $c; }
	}
	return '';
}

// Vales de oferta entregues e ainda com utilizações livres.
function tcd_v45_vales_livres() {
	global $wpdb;
	$rows = $wpdb->get_results( "SELECT p.ID, p.post_title FROM {$wpdb->posts} p JOIN {$wpdb->postmeta} m ON m.post_id = p.ID AND m.meta_key = '_tcd_entregue' WHERE p.post_type = 'shop_coupon' AND p.post_status = 'publish' AND ( p.post_title LIKE 'oferta-%' OR p.post_title LIKE 'pro-%' )" ); // phpcs:ignore
	$out  = array();
	foreach ( (array) $rows as $r ) {
		$c = new WC_Coupon( (int) $r->ID );
		if ( $c->get_usage_limit() && $c->get_usage_count() >= $c->get_usage_limit() ) { continue; }
		$e = get_post_meta( $r->ID, '_tcd_entregue', true );
		$out[ (int) $r->ID ] = array(
			'codigo'   => (string) $r->post_title,
			'nome'     => is_array( $e ) ? (string) ( $e['nome'] ?? '' ) : '',
			'contacto' => (string) get_post_meta( $r->ID, '_tcd_vale_contacto', true ),
		);
	}
	return $out;
}

// Todas as palavras (3+ letras) do nome de quem recebeu o vale aparecem no nome da encomenda.
function tcd_v45_nomes_batem( $entregue, $encomenda ) {
	$ta = array_filter( explode( ' ', tcd_v45_norm( $entregue ) ), function ( $t ) { return strlen( $t ) >= 3; } );
	$tb = explode( ' ', tcd_v45_norm( $encomenda ) );
	if ( ! $ta ) { return false; }
	foreach ( $ta as $t ) { if ( ! in_array( $t, $tb, true ) ) { return false; } }
	return true;
}

// Devolve array( vales com contacto igual, vales com nome parecido ).
function tcd_v45_vale_da_pessoa( $o ) {
	$em    = tcd_v45_norm( $o->get_billing_email() );
	$tel   = tcd_v45_tel( $o->get_billing_phone() );
	$nome  = trim( $o->get_billing_first_name() . ' ' . $o->get_billing_last_name() );
	$certo = array(); $nomes = array();
	foreach ( tcd_v45_vales_livres() as $id => $v ) {
		foreach ( preg_split( '/[\s,;]+/', $v['contacto'] ) as $ct ) {
			if ( '' === $ct ) { continue; }
			if ( ( is_email( $ct ) && $em && tcd_v45_norm( $ct ) === $em ) || ( $tel && tcd_v45_tel( $ct ) === $tel ) ) { $certo[ $id ] = $v['codigo']; }
		}
		if ( $v['nome'] && $nome && tcd_v45_nomes_batem( $v['nome'], $nome ) ) { $nomes[ $id ] = strtoupper( $v['codigo'] ) . ' (' . $v['nome'] . ')'; }
	}
	return array( $certo, $nomes );
}

function tcd_v45_tg( $txt ) { if ( function_exists( 'tcd_tg_enviar' ) ) { tcd_tg_enviar( $txt ); } }

// Conta pelo e-mail da encomenda (como o m90078 e o m90134): liga a conta existente ou cria uma nova.
function tcd_v45_conta( $o ) {
	if ( $o->get_customer_id() ) { return; }
	$em = strtolower( trim( (string) $o->get_billing_email() ) );
	if ( ! is_email( $em ) ) { return; }
	$u = get_user_by( 'email', $em );
	if ( $u ) { $o->set_customer_id( (int) $u->ID ); return; }
	if ( ! function_exists( 'wc_create_new_customer' ) ) { return; }
	$GLOBALS['tcd_v45_criar'] = true;
	$uid = wc_create_new_customer( $em, '', wp_generate_password( 24 ), array( 'first_name' => $o->get_billing_first_name(), 'last_name' => $o->get_billing_last_name() ) );
	unset( $GLOBALS['tcd_v45_criar'] );
	if ( is_wp_error( $uid ) ) {
		$o->add_order_note( 'Não foi possível criar a conta do cliente: ' . $uid->get_error_message() );
		return;
	}
	$o->set_customer_id( (int) $uid );
	$o->add_order_note( 'Conta criada com o e-mail da encomenda; o cliente recebeu o e-mail para activar a conta.' );
}

// Aplica o vale (mesma lógica do m90134). Devolve true ou WP_Error.
function tcd_v45_aplicar( $o, $cod, $via ) {
	$r = $o->apply_coupon( $cod );
	if ( is_wp_error( $r ) ) { return $r; }
	$o->calculate_totals( true );
	$o->add_order_note( 'Vale ' . strtoupper( $cod ) . ' aplicado no pedido do Atlas' . ( 'pessoa' === $via ? ', reconhecido pelo contacto do cliente (sem código).' : '.' ) );
	if ( function_exists( 'tcd_rede_vale_profissional' ) && tcd_rede_vale_profissional( $cod ) ) { $o->update_meta_data( '_tcd_voucher', 'rede' ); }
	$o->save();
	if ( (float) $o->get_total() <= 0 ) {
		$o->update_meta_data( 'tocwoo_enabled', '0' ); // sem factura a 0 € (TOConline)
		$o->save();
		$o->set_date_paid( time() );
		$o->update_status( 'processing', 'Total a 0 € com o vale: encomenda passou a produção sem pagamento. Sem factura.' );
		tcd_v45_tg( 'Vale ' . strtoupper( $cod ) . ( 'pessoa' === $via ? ' (reconhecido pelo contacto, sem código)' : '' ) . ' usado por ' . $o->get_formatted_billing_full_name() . ' no Atlas, encomenda #' . $o->get_order_number() . '. Foi para produção sem pagamento.' );
	}
	return true;
}

// 1. Antes do pedido: corrige a forma do código; se não existir, tira-o do pedido para não ser recusado (fica por confirmar).
add_filter( 'rest_pre_dispatch', function ( $res, $srv, $r ) {
	if ( null !== $res || ! tcd_v45_ligado() || ! ( $r instanceof WP_REST_Request ) ) { return $res; }
	if ( 'POST' !== strtoupper( $r->get_method() ) || '/tcd/v1/pedido-base' !== strtolower( untrailingslashit( $r->get_route() ) ) ) { return $res; }
	$bruto = mb_substr( trim( sanitize_text_field( (string) $r->get_param( 'vale' ) ) ), 0, 40 );
	$cod   = '' === $bruto ? '' : tcd_v45_resolver( $bruto );
	$GLOBALS['tcd_v45'] = array( 'bruto' => $bruto, 'valido' => $cod );
	if ( '' !== $bruto ) { $r->set_param( 'vale', $cod ); }
	return $res;
}, 8, 3 );

// 2. Depois do pedido: conta, vale (pelo código ou pela pessoa) e, se não der, «vale por confirmar».
add_filter( 'rest_post_dispatch', function ( $res, $srv, $req ) {
	if ( ! tcd_v45_ligado() || empty( $GLOBALS['tcd_v45'] ) || '/tcd/v1/pedido-base' !== $req->get_route() || ! $res instanceof WP_REST_Response ) { return $res; }
	$d = $res->get_data();
	if ( ! is_array( $d ) || empty( $d['ok'] ) || empty( $d['pedido'] ) || ! function_exists( 'wc_get_orders' ) ) { return $res; }
	$ids = wc_get_orders( array( 'limit' => 1, 'return' => 'ids', 'orderby' => 'date', 'order' => 'DESC',
		'meta_query' => array( array( 'key' => '_tcd_pedido', 'value' => (string) $d['pedido'] ) ) ) );
	$o = $ids ? wc_get_order( $ids[0] ) : null;
	if ( ! $o ) { return $res; }
	$g   = $GLOBALS['tcd_v45'];
	$ref = (string) $d['pedido'];

	tcd_v45_conta( $o );
	$o->save();
	if ( $o->get_coupon_codes() ) { return $res; } // o m90134 já aplicou o vale

	list( $certo, $nomes ) = tcd_v45_vale_da_pessoa( $o );
	$cod = (string) $g['valido']; $via = 'codigo';
	if ( '' === $cod && 1 === count( $certo ) ) { $cod = (string) reset( $certo ); $via = 'pessoa'; }

	$erro = '';
	if ( '' !== $cod && $o->needs_payment() ) {
		$r = tcd_v45_aplicar( $o, $cod, $via );
		if ( true === $r ) {
			$o = wc_get_order( $o->get_id() );
			$pre = 'pessoa' === $via ? 'Reconhecemos o seu vale pelo seu contacto. ' : '';
			if ( (float) $o->get_total() <= 0 ) {
				$d['vale'] = array( 'ok' => true, 'total' => 0, 'mensagem' => $pre . 'A sua Base está em produção, sem pagamento. Quando estiver pronta recebe um e-mail. Enviámos também um e-mail para activar a sua conta.' );
				unset( $d['pagar'] );
			} else {
				$d['vale']  = array( 'ok' => true, 'total' => (float) $o->get_total(), 'mensagem' => $pre . 'Falta pagar ' . wp_strip_all_tags( wc_price( $o->get_total() ) ) . ', porque a área passa o que o vale cobre.' );
				$d['pagar'] = $o->get_checkout_payment_url();
			}
			$res->set_data( $d );
			return $res;
		}
		$erro = $r->get_error_message();
	}

	// Sem vale aplicado. Se a pessoa escreveu um código, ou se o nome bate com um vale entregue: por confirmar.
	if ( '' !== $g['bruto'] || $certo || $nomes ) {
		$sug = array_values( array_unique( array_merge( array_map( 'strtoupper', array_values( $certo ) ), array_values( $nomes ) ) ) );
		$o->update_meta_data( '_tcd_vale_por_confirmar', array( 'escrito' => $g['bruto'], 'erro' => $erro, 'sugestoes' => $sug, 'quando' => current_time( 'mysql' ) ) );
		$o->add_order_note( 'Vale por confirmar. ' . ( '' !== $g['bruto'] ? 'Código escrito: «' . $g['bruto'] . '». ' : 'Sem código. ' ) . ( $erro ? 'Erro: ' . $erro . ' ' : '' ) . ( $sug ? 'Vales possíveis: ' . implode( ', ', $sug ) . '. ' : '' ) . 'Se for a pessoa, aplicar o vale nesta encomenda.' );
		$o->save();
		tcd_v45_tg( 'Vale por confirmar: encomenda #' . $o->get_order_number() . ' de ' . $o->get_formatted_billing_full_name() . '. ' . ( '' !== $g['bruto'] ? 'Escreveu «' . $g['bruto'] . '». ' : 'Sem código. ' ) . ( $sug ? 'Possíveis: ' . implode( ', ', $sug ) . '. ' : 'Nenhum vale entregue com nome ou contacto igual. ' ) . 'Se for a pessoa, aplique o vale na encomenda.' );
		if ( '' !== $g['bruto'] ) {
			$d['vale'] = array( 'ok' => false, 'pendente' => true, 'mensagem' => 'O pedido ficou registado (' . $ref . '). Não conseguimos aplicar já o código, mas o seu vale não se perde: confirmamos e aplicamos o vale à encomenda, e recebe um e-mail. Não precisa de pagar entretanto.' );
			unset( $d['pagar'] );
			$res->set_data( $d );
		}
	}
	return $res;
}, 25, 3 );

// 3. Conta nova sem palavra-passe escolhida: fica por activar e recebe o e-mail de activação.
add_action( 'woocommerce_created_customer', function ( $uid, $dados = array(), $gerada = false ) {
	if ( ! tcd_v45_ligado() || ( ! $gerada && empty( $GLOBALS['tcd_v45_criar'] ) ) ) { return; }
	$u = get_userdata( (int) $uid );
	if ( ! $u ) { return; }
	update_user_meta( $u->ID, 'tcd_conta_por_activar', time() );
	tcd_v45_email_activar( $u );
}, 5, 3 );

function tcd_v45_email_activar( $u ) {
	if ( ! function_exists( 'WC' ) ) { return false; }
	$chave = get_password_reset_key( $u );
	if ( is_wp_error( $chave ) ) { return false; }
	$url  = add_query_arg( array( 'key' => $chave, 'id' => $u->ID ), wc_get_endpoint_url( 'lost-password', '', wc_get_page_permalink( 'myaccount' ) ) );
	$nome = $u->first_name ? $u->first_name : '';
	$mail = WC()->mailer();
	$corpo = '<p>Olá' . ( $nome ? ' ' . esc_html( $nome ) : '' ) . ',</p>'
		. '<p>Criámos uma conta na Terracrua Design com este e-mail, para acompanhar o seu pedido e descarregar a sua Base Cartográfica quando estiver pronta.</p>'
		. '<p>Para activar a conta, confirme o e-mail e defina a sua palavra-passe:</p>'
		. '<p style="margin:22px 0"><a href="' . esc_url( $url ) . '" style="display:inline-block;background:#2f3424;color:#fff;padding:12px 20px;border-radius:5px;text-decoration:none;font-weight:600">Activar a conta</a></p>'
		. '<p>A ligação é válida durante 24 horas. Depois disso, use «Esqueceu-se da palavra-passe?» na página de entrada, com este e-mail.</p>'
		. '<p>O e-mail da encomenda segue em separado. Se não fez nenhum pedido, ignore esta mensagem.</p>'
		. '<p>Terracrua Design</p>';
	return $mail->send( $u->user_email, 'Active a sua conta na Terracrua Design', $mail->wrap_message( 'Active a sua conta', $corpo ), array( 'Content-Type: text/html; charset=UTF-8' ) );
}

// O e-mail «conta nova» do WooCommerce não segue para as contas por activar (o de activação substitui-o).
add_filter( 'woocommerce_email_enabled_customer_new_account', function ( $ligado, $obj = null ) {
	if ( ! tcd_v45_ligado() ) { return $ligado; }
	if ( ! empty( $GLOBALS['tcd_v45_criar'] ) ) { return false; }
	if ( $obj instanceof WP_User && get_user_meta( $obj->ID, 'tcd_conta_por_activar', true ) ) { return false; }
	return $ligado;
}, 20, 2 );

// Palavra-passe definida pela ligação: conta activa.
function tcd_v45_activada( $u ) {
	if ( $u instanceof WP_User && get_user_meta( $u->ID, 'tcd_conta_por_activar', true ) ) {
		delete_user_meta( $u->ID, 'tcd_conta_por_activar' );
		update_user_meta( $u->ID, 'tcd_conta_activada', current_time( 'mysql' ) );
	}
}
add_action( 'password_reset', function ( $u ) { tcd_v45_activada( $u ); }, 10, 1 );
add_action( 'woocommerce_customer_reset_password', function ( $u ) { tcd_v45_activada( $u ); }, 10, 1 );

// 4. Campo do vale no Atlas mesmo sem o m90134 (mesmo handle: nunca carrega duas vezes).
add_action( 'wp_enqueue_scripts', function () {
	if ( ! tcd_v45_ligado() || function_exists( 'tcd_va2_codigo' ) || ! is_page( array( 14581, 'atlas' ) ) ) { return; }
	wp_enqueue_script( 'tcd-va2-atlas-vale', content_url( 'plugins/terracrua-nucleo/assets/atlas/vale.js' ), array(), '0f84c54307', true );
}, 31 );

// 5. Página 14834: contacto (telemóvel ou e-mail) de quem recebe cada vale, para o reconhecer sem código.
add_action( 'wp_ajax_tcd_v45_contacto', function () {
	if ( ! tcd_v45_ligado() || ! current_user_can( 'edit_pages' ) ) { wp_send_json_error( 'Sem permissão.', 403 ); }
	check_ajax_referer( 'tcd_v45_contacto', 'n' );
	$cod = strtoupper( trim( (string) wp_unslash( $_POST['codigo'] ?? '' ) ) );
	$id  = preg_match( '/^OFERTA-[A-Z0-9-]{4,24}$/', $cod ) && function_exists( 'wc_get_coupon_id_by_code' ) ? (int) wc_get_coupon_id_by_code( $cod ) : 0;
	if ( ! $id ) { wp_send_json_error( 'Código desconhecido.', 400 ); }
	$ct = mb_substr( sanitize_text_field( wp_unslash( $_POST['contacto'] ?? '' ) ), 0, 120 );
	if ( '' === $ct ) { delete_post_meta( $id, '_tcd_vale_contacto' ); } else { update_post_meta( $id, '_tcd_vale_contacto', $ct ); }
	wp_send_json_success( array( 'contacto' => $ct ) );
} );

add_action( 'wp_footer', function () {
	if ( ! tcd_v45_ligado() || ! is_page( 14834 ) || ! current_user_can( 'edit_pages' ) || ! function_exists( 'wc_get_coupon_id_by_code' ) ) { return; }
	$p = get_post( 14834 );
	if ( ! $p || ! preg_match_all( '/OFERTA-[A-Z0-9-]{4,24}/', (string) $p->post_content, $m ) ) { return; }
	$d = array();
	foreach ( array_unique( $m[0] ) as $c ) {
		$id = (int) wc_get_coupon_id_by_code( $c );
		if ( $id ) { $d[ $c ] = (string) get_post_meta( $id, '_tcd_vale_contacto', true ); }
	}
	$cfg = array( 'ajax' => admin_url( 'admin-ajax.php' ), 'nonce' => wp_create_nonce( 'tcd_v45_contacto' ), 'd' => $d );
	?>
<script id="tcd-v45-js">
(function(){
var C=<?php echo wp_json_encode( $cfg, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT ); ?>;
document.querySelectorAll('table tr').forEach(function(tr){
 var tds=tr.querySelectorAll('td');if(tds.length<3)return;
 var cod=(tds[1].textContent||'').trim().toUpperCase();
 if(!(cod in C.d))return;
 var box=tds[2].querySelector('.tcd-ofp')||tds[2];
 var inp=document.createElement('input');inp.type='text';inp.value=C.d[cod]||'';inp.autocomplete='off';
 inp.placeholder='Telemóvel ou e-mail (reconhece a pessoa sem código)';inp.setAttribute('aria-label','Contacto de quem recebe o '+cod);
 inp.style.cssText='width:100%;padding:6px 8px;border:1px solid #c9c4b5;border-radius:6px;font:inherit;font-size:14px;background:#fff;margin-top:4px';
 var st=document.createElement('div');st.className='tcd-ofp-s';st.setAttribute('aria-live','polite');
 inp.addEventListener('keydown',function(ev){if(ev.key==='Enter'){ev.preventDefault();inp.blur();}});
 inp.addEventListener('change',function(){
  var f=new FormData();f.append('action','tcd_v45_contacto');f.append('n',C.nonce);f.append('codigo',cod);f.append('contacto',inp.value.trim());
  fetch(C.ajax,{method:'POST',body:f,credentials:'same-origin'}).then(function(r){return r.json();}).then(function(j){st.textContent=j&&j.success?'Contacto gravado.':'Não ficou gravado. Tente outra vez.';}).catch(function(){st.textContent='Não ficou gravado. Tente outra vez.';});
 });
 var ref=box.querySelector('.tcd-ofp-b');
 if(ref){box.insertBefore(inp,ref);box.insertBefore(st,ref);}else{box.appendChild(inp);box.appendChild(st);}
});
})();
</script>
	<?php
}, 60 );
