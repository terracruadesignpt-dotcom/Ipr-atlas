<?php
// Módulo 90049: pedido 52 da fila de código. Convites com 10 %, presos ao e-mail (decisão do Nuno, 21/10/2026, 09h40 e 09h50).
// Não altera o m90135, o m90136, o m90046 nem o m90045; liga-se a eles por ganchos.
// 1. Criar um convite exige e-mail válido.
//    - Qualquer pessoa da equipa cria convites em /area-equipa/?v=convidar (rota POST /tcd/v1/c52/convite): e-mail
//      obrigatório, nome e telefone opcionais. O código PRO-XXXXXX fica em tcd_convites[codigo]['email'], sem outras ofertas.
//    - Envio em lote do m90135, painel de sugestões (m90163) e «Já enviei» do m90046: recusados para linhas sem e-mail.
//    - Rede de segurança: qualquer código novo gravado em tcd_convites sem e-mail válido é retirado antes de ser gravado.
// 2. Activação (/atlas/?convite=..., admin-ajax tcd_cvr_activar do m90136): corre antes do m90136 e recusa, com mensagem
//    clara, convites sem e-mail, e-mails diferentes do convite (minúsculas, sem espaços) e sessão aberta noutra conta.
//    Nesses casos o m90136 não chega a correr: nem conta, nem acesso, nem desconto. Limite: 10 tentativas por hora e por IP.
// 3. Desconto de 10 % em toda a loja, numa só encomenda: cupão pessoal criado quando o convite é activado
//    (percentagem 10, uso individual, 1 utilização, e-mail restrito ao do convite, válido 90 dias a contar da activação,
//    opção tcd_c52_validade_dias; meta _tcd_c52). Só os convites criados com 10 % (marca c52) dão o cupão: a Oferta
//    Profissional e os convites antigos não (decisão do Nuno, 21/10). No servidor, o cupão só é
//    válido com sessão iniciada na conta desse convite (ID e e-mail da conta; nunca o nome nem o e-mail do formulário) e
//    só numa encomenda (user meta tcd_c52_usado_em; volta a ficar livre só se essa encomenda for cancelada; uma encomenda
//    falhada continua a contar, para a nova tentativa de pagamento a retomar). Aplica-se sozinho no carrinho e no pagamento
//    com sessão, e no pedido da Base pelo Atlas com sessão, salvo se houver vale (desligar: tcd_c52_atlas_auto_off = 1).
//    Preços dos produtos não são tocados.
// 4. Encomenda (checkout e /tcd/v1/pedido-base): metas _tcd_c52_convite (código) e _tcd_c52_conta (e-mail, nome e
//    telefone da conta, telefone da encomenda, via «sessao» ou «email_da_encomenda»).
// 5. Lista da equipa (mesma vista e GET /tcd/v1/c52/convites): quem convidou, data e estado (convidado, registado,
//    encomendou). Cada pessoa vê os seus convites; administradores e quem vê clientes vêem todos.
// Nenhum e-mail nem Telegram sai deste módulo. Registo próprio: opção tcd_c52_reg (autoload no).
// Desligar: opção tcd_c52_off = 1 (a regra «cupão só com a sessão da conta» continua activa nos cupões já criados).
// Retirar os cupões dos convites: opção tcd_c52_repor = 1 (passam a rascunho no pedido seguinte de um administrador).
// Prefixo tcd_c52_.
if ( ! defined( 'ABSPATH' ) ) { exit; }

function tcd_c52_on() { return '1' !== (string) get_option( 'tcd_c52_off', '' ); }

// E-mail normalizado: minúsculas e sem espaços; '' se não for válido.
function tcd_c52_norm( $s ) {
	$s = strtolower( preg_replace( '/\s+/u', '', (string) $s ) );
	return ( '' !== $s && strlen( $s ) <= 190 && is_email( $s ) ) ? $s : '';
}
function tcd_c52_cod( $s ) {
	if ( function_exists( 'tcd_cvr_cod' ) ) { return tcd_cvr_cod( $s ); }
	$c = strtoupper( preg_replace( '/[^A-Za-z0-9-]/', '', (string) $s ) );
	return preg_match( '/^PRO-[A-Z0-9]{6}$/', $c ) ? $c : '';
}
function tcd_c52_codigo() {
	if ( function_exists( 'tcd_cv_codigo' ) ) { return tcd_cv_codigo(); }
	return 'PRO-' . strtoupper( substr( str_replace( array( '0', 'O', 'I', '1' ), array( '2', 'A', 'J', '7' ), wp_generate_password( 8, false, false ) ), 0, 6 ) );
}
function tcd_c52_ip() { return md5( function_exists( 'tcd_sn_ip' ) ? (string) tcd_sn_ip() : (string) ( $_SERVER['REMOTE_ADDR'] ?? '0' ) ); } // phpcs:ignore
// Contador num transient; devolve o valor antes de somar.
function tcd_c52_conta( $k, $ttl ) { $n = (int) get_transient( $k ); set_transient( $k, $n + 1, $ttl ); return $n; }
// Trinco com hora (um pedido que morreu a meio é retomado ao fim de 30 s).
function tcd_c52_trinco( $k ) {
	if ( add_option( $k, time(), '', 'no' ) ) { return true; }
	$t = (int) get_option( $k ); if ( $t && $t < time() - 30 ) { update_option( $k, time(), false ); return true; }
	return false;
}
function tcd_c52_convites() { $r = get_option( 'tcd_convites', array() ); return is_array( $r ) ? $r : array(); }

// Equipa: administrador, ou conta de equipa pela função do m90016 (sem ela, só administradores).
function tcd_c52_equipa( $u = null ) {
	$u = $u ? $u : wp_get_current_user();
	if ( ! $u || empty( $u->ID ) ) { return false; }
	if ( user_can( $u, 'manage_options' ) ) { return true; }
	if ( ! function_exists( 'tcd_eq_e_equipa' ) ) { return false; }
	try { return (bool) tcd_eq_e_equipa( $u ); } catch ( Throwable $e ) { return false; }
}
// Vê os convites de toda a equipa: administradores, ou equipa com acesso a clientes (m90055).
function tcd_c52_ve_todos( $u = null ) {
	$u = $u ? $u : wp_get_current_user();
	if ( ! $u || empty( $u->ID ) ) { return false; }
	if ( user_can( $u, 'manage_options' ) ) { return true; }
	if ( ! tcd_c52_equipa( $u ) || ! function_exists( 'tcd_pg_ve_clientes' ) ) { return false; }
	try { return (bool) tcd_pg_ve_clientes( $u ); } catch ( Throwable $e ) { return false; }
}

// Registo próprio por código: por, criado, email, nome, telefone, registado, user, cupao, encomendas.
function tcd_c52_reg() { $r = get_option( 'tcd_c52_reg', array() ); return is_array( $r ) ? $r : array(); }
function tcd_c52_reg_gravar( $cod, $campos, $so_vazios = false ) {
	$r = tcd_c52_reg(); $x = isset( $r[ $cod ] ) && is_array( $r[ $cod ] ) ? $r[ $cod ] : array();
	foreach ( $campos as $k => $v ) { if ( ! $so_vazios || empty( $x[ $k ] ) ) { $x[ $k ] = $v; } }
	$r[ $cod ] = $x; update_option( 'tcd_c52_reg', $r, false );
}
function tcd_c52_log( $o, $cod ) {
	$l = get_option( 'tcd_c52_log', array() ); if ( ! is_array( $l ) ) { $l = array(); }
	$l[] = array( 't' => time(), 'o' => $o, 'c' => $cod, 'u' => (int) get_current_user_id() );
	update_option( 'tcd_c52_log', array_slice( $l, -50 ), false );
}

// ---------- 1. criar convite só com e-mail ----------

// Rede de segurança: código novo (ou reemitido) sem e-mail válido não chega a ser gravado.
add_filter( 'pre_update_option_tcd_convites', function ( $novo, $velho ) {
	if ( ! tcd_c52_on() || ! is_array( $novo ) ) { return $novo; }
	$velho = is_array( $velho ) ? $velho : array();
	foreach ( $novo as $k => $c ) {
		if ( ! is_array( $c ) || ! empty( $c['usado'] ) ) { continue; }
		$antes = isset( $velho[ $k ] ) && is_array( $velho[ $k ] ) ? $velho[ $k ] : null;
		if ( $antes && (int) ( $antes['criado'] ?? 0 ) === (int) ( $c['criado'] ?? 0 ) ) { continue; } // não é novo
		$e = tcd_c52_norm( $c['email'] ?? '' );
		if ( '' === $e ) {
			if ( $antes ) { $novo[ $k ] = $antes; } else { unset( $novo[ $k ] ); }
			tcd_c52_log( 'convite sem e-mail recusado', (string) $k );
			continue;
		}
		$novo[ $k ]['email'] = $e;
		tcd_c52_reg_gravar( (string) $k, array( 'por' => (int) get_current_user_id(), 'criado' => (int) ( $c['criado'] ?? time() ), 'email' => $e, 'nome' => (string) ( $c['nome'] ?? '' ) ), true );
	}
	return $novo;
}, 5, 2 );

// Envio em lote do m90135 (depois do m90046, que corre na prioridade 1 e filtra os já convidados).
add_action( 'wp_ajax_tcd_cv_enviar', function () {
	if ( ! tcd_c52_on() || ! function_exists( 'tcd_cv_ler' ) || ! current_user_can( 'manage_options' ) || empty( $_POST['ids'] ) ) { return; } // phpcs:ignore
	check_ajax_referer( 'tcd_cv', 'n' );
	$sem = array();
	foreach ( (array) $_POST['ids'] as $id ) { // phpcs:ignore
		$d = tcd_cv_ler( absint( $id ) );
		if ( $d && '' === tcd_c52_norm( $d['email'] ) ) { $sem[] = $d['nome']; }
	}
	if ( $sem ) {
		wp_send_json_error( 'Sem e-mail não há convite. Sem e-mail válido: ' . implode( '; ', array_slice( $sem, 0, 20 ) ) . ( count( $sem ) > 20 ? '…' : '' ) . '. Acrescente o e-mail ou desmarque estas linhas.', 400 );
	}
}, 2 );

// Painel de sugestões (m90163) e «Já enviei» (m90046): linha sem e-mail não recebe código.
function tcd_c52_linha_sem_email() {
	if ( ! function_exists( 'tcd_cv_ler' ) ) { return false; }
	$d = tcd_cv_ler( absint( $_POST['id'] ?? 0 ) ); // phpcs:ignore
	return $d && '' === tcd_c52_norm( $d['email'] );
}
add_action( 'wp_ajax_tcd_sg', function () {
	if ( ! tcd_c52_on() || ! current_user_can( 'manage_options' ) ) { return; }
	$acc = sanitize_key( $_POST['acc'] ?? '' ); // phpcs:ignore
	if ( ! in_array( $acc, array( 'email', 'whatsapp', 'marcar', 'mao', 'convidar', 'copiar' ), true ) ) { return; }
	if ( ! tcd_c52_linha_sem_email() ) { return; }
	check_ajax_referer( 'tcd_sg', 'n' );
	wp_send_json_error( 'Sem e-mail não há convite: o convite fica preso ao e-mail da pessoa. Acrescente o e-mail primeiro.', 400 );
}, 0 );
add_action( 'wp_ajax_tcd_sg46', function () {
	if ( ! tcd_c52_on() || ! current_user_can( 'manage_options' ) ) { return; }
	$acc = sanitize_key( $_POST['acc'] ?? '' ); // phpcs:ignore
	if ( 'marcar' !== $acc || ! tcd_c52_linha_sem_email() ) { return; }
	check_ajax_referer( 'tcd_sg46', 'n' );
	wp_send_json_error( array( 'm' => 'Sem e-mail não há convite: o convite fica preso ao e-mail da pessoa. Acrescente o e-mail primeiro.' ), 400 );
}, 0 );

// Convite criado por uma pessoa da equipa. Devolve array ou WP_Error.
function tcd_c52_criar( $por, $email, $nome = '', $tel = '' ) {
	$em = tcd_c52_norm( $email );
	if ( '' === $em ) { return new WP_Error( 'tcd_c52', 'Sem e-mail não há convite. Escreva o e-mail da pessoa: só com esse e-mail ela se consegue registar.', array( 'status' => 400 ) ); }
	$quem = get_userdata( (int) $por );
	if ( ! $quem ) { return new WP_Error( 'tcd_c52', 'Sem acesso.', array( 'status' => 403 ) ); }
	if ( tcd_c52_norm( $quem->user_email ) === $em ) { return new WP_Error( 'tcd_c52', 'Não pode convidar o seu próprio e-mail.', array( 'status' => 400 ) ); }
	if ( '@terracruadesign.pt' === substr( $em, -19 ) ) { return new WP_Error( 'tcd_c52', 'Contas da equipa não recebem convites.', array( 'status' => 400 ) ); }
	$ja = get_user_by( 'email', $em );
	if ( $ja && tcd_c52_equipa( $ja ) ) { return new WP_Error( 'tcd_c52', 'Contas da equipa não recebem convites.', array( 'status' => 400 ) ); }
	if ( $ja && get_user_meta( $ja->ID, 'tcd_c52_convite', true ) ) { return new WP_Error( 'tcd_c52', 'Esta pessoa já se registou com um convite.', array( 'status' => 409 ) ); }
	if ( tcd_c52_conta( 'tcd_c52_cr_' . (int) $por, DAY_IN_SECONDS ) >= 30 ) { return new WP_Error( 'tcd_c52', 'Chegou aos 30 convites de hoje. Continue amanhã.', array( 'status' => 429 ) ); }
	$nome = mb_substr( trim( sanitize_text_field( (string) $nome ) ), 0, 80 );
	$tel  = mb_substr( preg_replace( '/[^0-9+ ]/', '', (string) $tel ), 0, 20 );
	if ( ! tcd_c52_trinco( 'tcd_c52_trinco' ) ) { return new WP_Error( 'tcd_c52', 'Está a ser gravado outro convite. Tente de novo dentro de segundos.', array( 'status' => 503 ) ); }
	$reg = tcd_c52_convites(); $cod = ''; $novo = false;
	foreach ( $reg as $k => $c ) {
		if ( is_array( $c ) && ! empty( $c['c52'] ) && empty( $c['usado'] ) && (int) ( $c['validade'] ?? 0 ) >= time() && tcd_c52_norm( $c['email'] ?? '' ) === $em ) { $cod = (string) $k; break; } // só convites desta rota (não a Oferta Profissional)
	}
	if ( '' === $cod ) {
		$n = 0; do { $cod = tcd_c52_codigo(); $n++; } while ( isset( $reg[ $cod ] ) && $n < 20 );
		if ( isset( $reg[ $cod ] ) ) { delete_option( 'tcd_c52_trinco' ); return new WP_Error( 'tcd_c52', 'Não foi possível criar o código. Tente de novo.', array( 'status' => 500 ) ); }
		$agora = time();
		$reg[ $cod ] = array( 'email' => $em, 'nome' => $nome ? $nome : $em, 'pais' => '', 'conv' => 0, 'ofertas' => array(), 'criado' => $agora, 'validade' => $agora + 60 * DAY_IN_SECONDS, 'usado' => 0, 'por' => (int) $por, 'c52' => 1 );
		tcd_c52_reg_gravar( $cod, array( 'por' => (int) $por, 'criado' => $agora, 'email' => $em, 'nome' => $nome, 'telefone' => $tel ) );
		update_option( 'tcd_convites', $reg, false );
		$novo = true;
	}
	delete_option( 'tcd_c52_trinco' );
	$lig = home_url( '/atlas/?convite=' . rawurlencode( $cod ) );
	$assina = trim( (string) $quem->display_name );
	$msg = 'Olá' . ( $nome ? ' ' . $nome : '' ) . ",\n\n" . ( $assina ? $assina : 'A equipa' ) . " da Terracrua Design convidou-o para o IPR Atlas. O convite dá 10 % de desconto em toda a loja, numa encomenda.\n\n"
		. 'Para activar, abra esta ligação e confirme o seu e-mail (' . $em . "). O convite só funciona com este e-mail:\n" . $lig . "\n\n"
		. 'O código é pessoal (' . $cod . ") e caduca em 60 dias. Os 10 % aplicam-se quando encomendar com a sessão iniciada na sua conta.\n\nCumprimentos,\n" . ( $assina ? $assina . "\n" : '' ) . 'Terracrua Design · terracruadesign.pt';
	return array( 'codigo' => $cod, 'novo' => $novo, 'email' => $em, 'ligacao' => $lig, 'mensagem' => $msg,
		'mailto' => 'mailto:' . rawurlencode( $em ) . '?subject=' . rawurlencode( 'Convite da Terracrua Design: 10 % na loja' ) . '&body=' . rawurlencode( $msg ) );
}

// ---------- 2. activação só com o e-mail do convite ----------
function tcd_c52_guarda_activar() {
	if ( ! tcd_c52_on() ) { return; }
	if ( tcd_c52_conta( 'tcd_c52_a_' . tcd_c52_ip(), HOUR_IN_SECONDS ) >= 10 ) { tcd_c52_log( 'activação: limite por IP', '' ); wp_send_json_error( 'Demasiadas tentativas. Tente daqui a uma hora.', 429 ); }
	$cod = tcd_c52_cod( wp_unslash( $_POST['codigo'] ?? '' ) ); // phpcs:ignore
	$reg = tcd_c52_convites(); $c = $cod && isset( $reg[ $cod ] ) && is_array( $reg[ $cod ] ) ? $reg[ $cod ] : null;
	if ( ! $c || ! empty( $c['usado'] ) || (int) ( $c['validade'] ?? 0 ) < time() ) { return; } // o m90136 responde «inválido, usado ou caducado»
	$conv = tcd_c52_norm( $c['email'] ?? '' );
	$em   = tcd_c52_norm( wp_unslash( $_POST['email'] ?? '' ) ); // phpcs:ignore
	if ( '' === $conv ) { tcd_c52_log( 'activação recusada: convite sem e-mail', $cod ); wp_send_json_error( 'Este convite não tem e-mail associado e não pode ser activado. Peça a quem o convidou um convite novo com o seu e-mail, ou escreva para info@terracruadesign.pt.', 400 ); }
	if ( '' === $em ) { tcd_c52_log( 'activação recusada: e-mail vazio ou inválido', $cod ); wp_send_json_error( 'Escreva o e-mail para onde recebeu o convite.', 400 ); }
	if ( $em !== $conv ) { tcd_c52_log( 'activação recusada: outro e-mail', $cod ); wp_send_json_error( 'Este convite foi feito para outro e-mail e só pode ser activado com esse. Com outro e-mail não há acesso nem desconto. Se mudou de e-mail, peça um convite novo a quem o convidou.', 400 ); }
	$u = wp_get_current_user();
	if ( $u && ! empty( $u->ID ) && tcd_c52_norm( $u->user_email ) !== $conv ) { tcd_c52_log( 'activação recusada: sessão noutra conta', $cod ); wp_send_json_error( 'Tem a sessão iniciada noutra conta. Saia dessa conta e abra de novo a ligação do convite.', 400 ); }
	$_POST['email'] = $conv; // o m90136 lê o e-mail já normalizado
}
add_action( 'wp_ajax_nopriv_tcd_cvr_activar', 'tcd_c52_guarda_activar', -100 );
add_action( 'wp_ajax_tcd_cvr_activar', 'tcd_c52_guarda_activar', -100 );

// Caixa do convite no Atlas (m90136, prioridade 25): acrescenta os 10 % à lista da oferta, ou avisa se falta o e-mail.
add_filter( 'do_shortcode_tag', function ( $out, $tag ) {
	if ( 'ipr_atlas' !== $tag || ! tcd_c52_on() || empty( $_GET['convite'] ) || false === strpos( (string) $out, 'id="tcvr"' ) ) { return $out; } // phpcs:ignore
	$cod = tcd_c52_cod( wp_unslash( $_GET['convite'] ) ); // phpcs:ignore
	$reg = tcd_c52_convites(); $c = $cod && isset( $reg[ $cod ] ) && is_array( $reg[ $cod ] ) ? $reg[ $cod ] : null;
	if ( ! $c ) { return $out; }
	$es = function_exists( 'tcd_cv_es' ) && ! empty( $c['pais'] ) && tcd_cv_es( $c['pais'] );
	if ( '' === tcd_c52_norm( $c['email'] ?? '' ) ) {
		$p = '<p class="r mau">' . ( $es ? 'Esta invitación no tiene e-mail y no se puede activar. Pida una nueva a quien le invitó.' : 'Este convite não tem e-mail e não pode ser activado. Peça um novo a quem o convidou.' ) . '</p>';
		return preg_replace_callback( '~(<div class="tcvr" id="tcvr">.*?</h2>)~s', function ( $m ) use ( $p ) { return $m[1] . $p; }, $out, 1 );
	}
	if ( empty( $c['c52'] ) ) { return $out; } // só os convites criados com 10 % (decisão do Nuno, 21/10)
	$li = '<li>' . ( $es ? '10 % de descuento en toda la tienda, en un pedido, con la sesión iniciada en la cuenta de este e-mail, durante ' . (int) tcd_c52_dias() . ' días desde la activación' : '10 % de desconto em toda a loja, numa encomenda, com a sessão iniciada na conta deste e-mail, durante ' . (int) tcd_c52_dias() . ' dias a contar da activação' ) . '</li>';
	return preg_replace_callback( '~(<div class="tcvr" id="tcvr">.*?)</ul>~s', function ( $m ) use ( $li ) { return $m[1] . $li . '</ul>'; }, $out, 1 );
}, 26, 2 );

// ---------- 3. cupão pessoal de 10 % ----------

// Convite activado (o m90136 marca usado, email_usado e user): regista e cria o cupão.
add_action( 'update_option_tcd_convites', function ( $velho, $novo ) {
	if ( ! tcd_c52_on() || ! is_array( $novo ) ) { return; }
	$velho = is_array( $velho ) ? $velho : array();
	foreach ( $novo as $cod => $c ) {
		if ( ! is_array( $c ) || empty( $c['usado'] ) || ! empty( $velho[ $cod ]['usado'] ) ) { continue; }
		tcd_c52_registado( (string) $cod, $c );
	}
}, 10, 2 );
function tcd_c52_registado( $cod, $c ) {
	$uid = (int) ( $c['user'] ?? 0 ); $em = tcd_c52_norm( $c['email'] ?? '' );
	if ( ! $uid || '' === $em || tcd_c52_norm( $c['email_usado'] ?? $em ) !== $em ) { return ''; }
	$u = get_userdata( $uid );
	if ( ! $u || tcd_c52_norm( $u->user_email ) !== $em || tcd_c52_equipa( $u ) ) { return ''; } // a conta tem de ter o e-mail do convite
	tcd_c52_reg_gravar( $cod, array( 'registado' => (int) $c['usado'], 'user' => $uid, 'email' => $em ) );
	tcd_c52_reg_gravar( $cod, array( 'nome' => (string) ( $c['nome'] ?? '' ), 'criado' => (int) ( $c['criado'] ?? 0 ) ), true );
	update_user_meta( $uid, 'tcd_c52_convite', $cod );
	if ( empty( $c['c52'] ) ) { return ''; } // Oferta Profissional e convites antigos: sem os 10 % (decisão do Nuno, 21/10)
	return tcd_c52_cupao( $cod, $uid, $em, (int) $c['usado'] );
}
// Validade do cupão em dias, a contar da activação (decisão do Nuno, 21/10: 90). Opção tcd_c52_validade_dias muda-a; 0 = sem prazo.
function tcd_c52_dias() { $d = get_option( 'tcd_c52_validade_dias', 90 ); return '' === $d || false === $d ? 90 : max( 0, (int) $d ); }
function tcd_c52_cupao( $cod, $uid, $em, $activado = 0 ) {
	if ( ! class_exists( 'WC_Coupon' ) || ! function_exists( 'wc_get_coupon_id_by_code' ) ) { return ''; }
	$ex = (string) get_user_meta( $uid, 'tcd_c52_cupao', true );
	if ( '' !== $ex && wc_get_coupon_id_by_code( $ex ) ) { return $ex; }
	$n = 0;
	do { $code = 'conv10-' . strtolower( wp_generate_password( 10, false, false ) ); $n++; } while ( wc_get_coupon_id_by_code( $code ) && $n < 10 );
	$cp = new WC_Coupon();
	$cp->set_code( $code );
	$cp->set_discount_type( 'percent' );
	$cp->set_amount( 10 );
	$cp->set_individual_use( true );
	$cp->set_usage_limit( 1 );
	$cp->set_usage_limit_per_user( 1 );
	$cp->set_email_restrictions( array( $em ) );
	$dias = tcd_c52_dias(); $ate = 0;
	if ( $dias > 0 ) { $ate = ( $activado ? $activado : time() ) + $dias * DAY_IN_SECONDS; $cp->set_date_expires( $ate ); }
	$cp->set_description( 'Convite ' . $cod . ': 10 % em toda a loja, uma encomenda, só com a sessão da conta #' . (int) $uid . '.' );
	$cp->update_meta_data( '_tcd_c52', array( 'convite' => $cod, 'user' => (int) $uid, 'email' => $em, 'ate' => $ate ) );
	$cp->save();
	update_user_meta( $uid, 'tcd_c52_cupao', $code );
	tcd_c52_reg_gravar( $cod, array( 'cupao' => $code ) );
	return $code;
}

// Convite activado desta conta (ou deste e-mail, sem conta). Devolve o código ou ''.
function tcd_c52_convite_de( $uid, $em, $so_c52 = false ) {
	$achado = ''; $t = 0;
	foreach ( tcd_c52_convites() as $k => $c ) {
		if ( ! is_array( $c ) || empty( $c['usado'] ) || ( $so_c52 && empty( $c['c52'] ) ) ) { continue; }
		$ce = tcd_c52_norm( $c['email'] ?? '' ); if ( '' === $ce ) { continue; }
		$ok = $uid ? ( (int) ( $c['user'] ?? 0 ) === (int) $uid && $ce === $em ) : ( '' !== $em && $ce === $em );
		if ( $ok && (int) $c['usado'] >= $t ) { $achado = (string) $k; $t = (int) $c['usado']; }
	}
	return $achado;
}
function tcd_c52_encomenda_activa( $oid ) {
	$o = $oid && function_exists( 'wc_get_order' ) ? wc_get_order( (int) $oid ) : null;
	return $o && ! in_array( $o->get_status(), array( 'cancelled', 'trash', 'checkout-draft' ), true );
}
// Cupão por usar da conta com sessão (cria-o se o convite foi activado antes deste módulo). '' se não houver.
function tcd_c52_cupao_da_conta( $u ) {
	if ( ! $u || empty( $u->ID ) || ! tcd_c52_on() ) { return ''; }
	$em = tcd_c52_norm( $u->user_email );
	$usado = (int) get_user_meta( $u->ID, 'tcd_c52_usado_em', true );
	if ( $usado && tcd_c52_encomenda_activa( $usado ) ) { return ''; }
	$code = (string) get_user_meta( $u->ID, 'tcd_c52_cupao', true );
	if ( '' === $code ) {
		$cod = tcd_c52_convite_de( $u->ID, $em, true ); if ( '' === $cod ) { return ''; }
		$reg = tcd_c52_convites();
		$code = tcd_c52_registado( $cod, $reg[ $cod ] );
		if ( '' === $code ) { return ''; }
	}
	$id = function_exists( 'wc_get_coupon_id_by_code' ) ? wc_get_coupon_id_by_code( $code ) : 0;
	if ( ! $id ) { return ''; }
	$cp = new WC_Coupon( $id );
	if ( 'publish' !== get_post_status( $id ) || ( $cp->get_usage_limit() && $cp->get_usage_count() >= $cp->get_usage_limit() ) ) { return ''; }
	return $code;
}
function tcd_c52_e_cupao( $code ) {
	$id = function_exists( 'wc_get_coupon_id_by_code' ) ? wc_get_coupon_id_by_code( $code ) : 0;
	if ( ! $id ) { return false; }
	$m = ( new WC_Coupon( $id ) )->get_meta( '_tcd_c52' );
	return is_array( $m ) && ! empty( $m['user'] );
}

// Validação no servidor (carrinho e encomenda). Activa mesmo com tcd_c52_off: o cupão nunca vale sem a sessão certa.
add_filter( 'woocommerce_coupon_is_valid', function ( $valido, $cp, $desc = null ) {
	if ( ! $valido || ! is_object( $cp ) || ! method_exists( $cp, 'get_meta' ) ) { return $valido; }
	$m = $cp->get_meta( '_tcd_c52' );
	if ( ! is_array( $m ) || empty( $m['user'] ) ) { return $valido; }
	$u = wp_get_current_user();
	if ( ! $u || empty( $u->ID ) || (int) $u->ID !== (int) $m['user'] || tcd_c52_norm( $u->user_email ) !== tcd_c52_norm( $m['email'] ?? '' ) ) {
		throw new Exception( 'Este desconto é pessoal: só se aplica com a sessão iniciada na conta do convite.', 100 );
	}
	if ( ! empty( $m['ate'] ) && time() > (int) $m['ate'] ) { throw new Exception( 'O prazo dos 10 % do convite terminou.', 100 ); }
	$obj = $desc && is_object( $desc ) && method_exists( $desc, 'get_object' ) ? $desc->get_object() : null;
	$oid = 0;
	if ( $obj instanceof WC_Order ) {
		if ( (int) $obj->get_customer_id() && (int) $obj->get_customer_id() !== (int) $u->ID ) { throw new Exception( 'Este desconto é pessoal: só se aplica a encomendas da conta do convite.', 100 ); }
		$oid = (int) $obj->get_id();
	} elseif ( function_exists( 'WC' ) && WC()->session ) {
		$oid = (int) WC()->session->get( 'order_awaiting_payment' ); // nova tentativa de pagar a mesma encomenda
	}
	$usado = (int) get_user_meta( $u->ID, 'tcd_c52_usado_em', true );
	if ( $usado && $usado !== $oid && tcd_c52_encomenda_activa( $usado ) ) { throw new Exception( 'Os 10 % do convite já foram usados numa encomenda.', 100 ); }
	return $valido;
}, 20, 3 );

// Carrinho e pagamento: aplica o cupão sozinho à conta com sessão (uma vez; se a pessoa o tirar, não volta).
add_action( 'template_redirect', function () {
	if ( ! tcd_c52_on() || ! is_user_logged_in() || ! function_exists( 'WC' ) || ! WC()->cart || ! WC()->session ) { return; }
	if ( ! ( ( function_exists( 'is_cart' ) && is_cart() ) || ( function_exists( 'is_checkout' ) && is_checkout() ) ) ) { return; }
	if ( function_exists( 'is_wc_endpoint_url' ) && ( is_wc_endpoint_url( 'order-received' ) || is_wc_endpoint_url( 'order-pay' ) ) ) { return; }
	if ( WC()->cart->is_empty() || WC()->cart->get_applied_coupons() || WC()->session->get( 'tcd_c52_tirou' ) ) { return; }
	$code = tcd_c52_cupao_da_conta( wp_get_current_user() );
	if ( '' !== $code ) { WC()->cart->apply_coupon( $code ); }
}, 20 );
// Só quando é a pessoa a retirar o cupão (botão do carrinho por wc-ajax, ou ligação ?remove_coupon=), não quando o WooCommerce o retira sozinho.
function tcd_c52_pessoa_retirou() {
	return ( isset( $_GET['wc-ajax'] ) && 'remove_coupon' === sanitize_key( wp_unslash( $_GET['wc-ajax'] ) ) ) || isset( $_GET['remove_coupon'] ); // phpcs:ignore
}
add_action( 'woocommerce_removed_coupon', function ( $code ) {
	if ( function_exists( 'WC' ) && WC()->session && tcd_c52_pessoa_retirou() && tcd_c52_e_cupao( $code ) ) { WC()->session->set( 'tcd_c52_tirou', 1 ); }
} );

// ---------- 4. a encomenda leva o e-mail, os contactos e o código ----------
function tcd_c52_marcar( $o ) {
	if ( ! tcd_c52_on() || ! is_object( $o ) ) { return ''; }
	$u = wp_get_current_user(); $cod = ''; $via = '';
	if ( $u && ! empty( $u->ID ) ) { $cod = tcd_c52_convite_de( $u->ID, tcd_c52_norm( $u->user_email ) ); $via = 'sessao'; } // com sessão, só conta a conta
	else { $cod = tcd_c52_convite_de( 0, tcd_c52_norm( $o->get_billing_email() ) ); $via = 'email_da_encomenda'; } // sem sessão: só regista, nunca desconta
	if ( '' === $cod ) { return ''; }
	if ( 'sessao' === $via ) {
		$nome = trim( get_user_meta( $u->ID, 'first_name', true ) . ' ' . get_user_meta( $u->ID, 'last_name', true ) );
		$conta = array( 'user' => (int) $u->ID, 'email' => tcd_c52_norm( $u->user_email ), 'nome' => $nome ? $nome : (string) $u->display_name, 'telefone' => (string) get_user_meta( $u->ID, 'billing_phone', true ) );
	} else {
		$conta = array( 'user' => (int) $o->get_customer_id(), 'email' => tcd_c52_norm( $o->get_billing_email() ), 'nome' => trim( $o->get_billing_first_name() . ' ' . $o->get_billing_last_name() ), 'telefone' => '' );
	}
	$conta['telefone_encomenda'] = (string) $o->get_billing_phone();
	$conta['via'] = $via;
	$o->update_meta_data( '_tcd_c52_convite', $cod );
	$o->update_meta_data( '_tcd_c52_conta', $conta );
	$oid = (int) $o->get_id();
	if ( $oid && 'checkout-draft' !== $o->get_status() ) {
		$r = tcd_c52_reg(); $l = isset( $r[ $cod ]['encomendas'] ) && is_array( $r[ $cod ]['encomendas'] ) ? $r[ $cod ]['encomendas'] : array();
		if ( ! in_array( $oid, $l, true ) ) { $l[] = $oid; tcd_c52_reg_gravar( $cod, array( 'encomendas' => array_slice( $l, -20 ) ) ); }
		foreach ( (array) $o->get_coupon_codes() as $code ) {
			if ( 'sessao' === $via && tcd_c52_e_cupao( $code ) ) { update_user_meta( $u->ID, 'tcd_c52_usado_em', $oid ); $o->update_meta_data( '_tcd_c52_desconto', $code ); }
		}
	}
	return $cod;
}
// Checkout clássico: antes de gravar, recusa um segundo uso em corrida; depois de gravar, regista.
add_action( 'woocommerce_checkout_create_order', function ( $o ) {
	if ( ! is_user_logged_in() ) { tcd_c52_marcar( $o ); return; }
	$u = wp_get_current_user();
	foreach ( (array) $o->get_coupon_codes() as $code ) {
		if ( ! tcd_c52_e_cupao( $code ) ) { continue; }
		$usado = (int) get_user_meta( $u->ID, 'tcd_c52_usado_em', true );
		if ( $usado && $usado !== (int) $o->get_id() && tcd_c52_encomenda_activa( $usado ) ) { throw new Exception( 'Os 10 % do convite já foram usados numa encomenda.' ); }
	}
	tcd_c52_marcar( $o );
}, 20 );
add_action( 'woocommerce_checkout_order_created', function ( $o ) { if ( tcd_c52_marcar( $o ) ) { $o->save(); } }, 20 );
// Checkout por blocos (Store API).
add_action( 'woocommerce_store_api_checkout_update_order_meta', function ( $o ) { tcd_c52_marcar( $o ); }, 20 );
add_action( 'woocommerce_store_api_checkout_order_processed', function ( $o ) { if ( tcd_c52_marcar( $o ) ) { $o->save(); } }, 20 );
// Encomenda cancelada: o desconto volta a ficar livre.
foreach ( array( 'woocommerce_order_status_cancelled' ) as $h ) {
	add_action( $h, function ( $oid ) {
		$o = function_exists( 'wc_get_order' ) ? wc_get_order( $oid ) : null; if ( ! $o || ! $o->get_customer_id() ) { return; }
		if ( (int) get_user_meta( $o->get_customer_id(), 'tcd_c52_usado_em', true ) === (int) $oid ) { delete_user_meta( $o->get_customer_id(), 'tcd_c52_usado_em' ); }
	} );
}

// Pedido da Base pelo Atlas (m14473), depois do m90134 (20) e do m90045 (25).
add_filter( 'rest_post_dispatch', function ( $res, $srv, $req ) {
	if ( ! tcd_c52_on() || ! ( $res instanceof WP_REST_Response ) || ! is_object( $req ) || '/tcd/v1/pedido-base' !== untrailingslashit( (string) $req->get_route() ) || 'POST' !== strtoupper( (string) $req->get_method() ) ) { return $res; }
	$d = $res->get_data();
	if ( ! is_array( $d ) || empty( $d['ok'] ) || empty( $d['pedido'] ) || ! function_exists( 'wc_get_orders' ) ) { return $res; }
	$ids = wc_get_orders( array( 'limit' => 1, 'return' => 'ids', 'orderby' => 'date', 'order' => 'DESC', 'meta_query' => array( array( 'key' => '_tcd_pedido', 'value' => (string) $d['pedido'] ) ) ) );
	$o = $ids ? wc_get_order( $ids[0] ) : null;
	if ( ! $o ) { return $res; }
	$cod = tcd_c52_marcar( $o );
	if ( '' !== $cod ) { $o->save(); }
	// Decisão do Nuno (21/10): os 10 % aplicam-se sozinhos no pedido da Base pelo Atlas, com sessão. Desligar: tcd_c52_atlas_auto_off = 1.
	if ( '1' === (string) get_option( 'tcd_c52_atlas_auto_off', '' ) ) { return $res; }
	$u = wp_get_current_user();
	if ( '' === $cod || ! $u || empty( $u->ID ) || ! $o->needs_payment() || $o->get_coupon_codes() ) { return $res; }
	if ( ! empty( $d['vale'] ) || $o->get_meta( '_tcd_vale_por_confirmar' ) ) { return $res; } // há vale aplicado ou por confirmar (4a)
	if ( (int) $o->get_customer_id() && (int) $o->get_customer_id() !== (int) $u->ID ) { return $res; }
	$code = tcd_c52_cupao_da_conta( $u );
	if ( '' === $code || ! tcd_c52_trinco( 'tcd_c52_uso_' . (int) $u->ID ) ) { return $res; }
	if ( ! $o->get_customer_id() ) { $o->set_customer_id( (int) $u->ID ); }
	$r = $o->apply_coupon( $code );
	if ( is_wp_error( $r ) ) {
		$o->add_order_note( 'Desconto do convite ' . $cod . ' não aplicado: ' . $r->get_error_message() );
		$o->save();
	} else {
		$o->calculate_totals( true );
		update_user_meta( $u->ID, 'tcd_c52_usado_em', (int) $o->get_id() );
		$o->update_meta_data( '_tcd_c52_desconto', $code );
		$o->add_order_note( 'Desconto de 10 % do convite ' . $cod . ' aplicado (sessão da conta #' . (int) $u->ID . ').' );
		$o->save();
		$d['convite'] = array( 'ok' => true, 'mensagem' => 'Aplicámos os 10 % do seu convite. Total: ' . wp_strip_all_tags( wc_price( $o->get_total() ) ) . '.' );
		$res->set_data( $d );
	}
	delete_option( 'tcd_c52_uso_' . (int) $u->ID );
	return $res;
}, 30, 3 );

// ---------- 5. lista da equipa ----------
function tcd_c52_lista( $u ) {
	$todos = tcd_c52_ve_todos( $u ); $reg = tcd_c52_reg(); $out = array();
	foreach ( tcd_c52_convites() as $cod => $c ) {
		if ( ! is_array( $c ) ) { continue; }
		$r = isset( $reg[ $cod ] ) && is_array( $reg[ $cod ] ) ? $reg[ $cod ] : array();
		$por = (int) ( $r['por'] ?? ( $c['por'] ?? 0 ) );
		if ( ! $todos && $por !== (int) $u->ID ) { continue; }
		$por_nome = '';
		if ( $por ) { $p = get_userdata( $por ); $por_nome = $p ? (string) $p->display_name : ''; }
		if ( '' === $por_nome && ! empty( $c['conv'] ) ) { // convites do painel do m90135: quem enviou está no histórico da linha
			foreach ( array_reverse( (array) get_post_meta( (int) $c['conv'], '_cv_hist', true ) ) as $h ) { if ( is_array( $h ) && ( $h['codigo'] ?? '' ) === $cod && ! empty( $h['por'] ) ) { $por_nome = (string) $h['por']; break; } }
		}
		$enc = array(); $dono = (int) ( $r['user'] ?? ( $c['user'] ?? 0 ) );
		foreach ( (array) ( $r['encomendas'] ?? array() ) as $oid ) {
			$o = function_exists( 'wc_get_order' ) ? wc_get_order( (int) $oid ) : null;
			if ( ! $o || in_array( $o->get_status(), array( 'cancelled', 'failed', 'trash', 'checkout-draft' ), true ) ) { continue; }
			$ct = $o->get_meta( '_tcd_c52_conta' );
			$da_pessoa = ( is_array( $ct ) && 'sessao' === ( $ct['via'] ?? '' ) ) || ( $dono && (int) $o->get_customer_id() === $dono ); // pelo e-mail do formulário só, não conta
			if ( $da_pessoa ) { $enc[] = array( 'numero' => (string) $o->get_order_number(), 'estado' => function_exists( 'wc_get_order_status_name' ) ? wc_get_order_status_name( $o->get_status() ) : $o->get_status() ); }
		}
		$estado = $enc ? 'encomendou' : ( ! empty( $c['usado'] ) ? 'registado' : ( (int) ( $c['validade'] ?? 0 ) < time() ? 'caducado' : 'convidado' ) );
		$criado = (int) ( $c['criado'] ?? ( $r['criado'] ?? 0 ) );
		$out[] = array(
			'codigo' => (string) $cod, 'nome' => (string) ( $c['nome'] ?? '' ), 'email' => (string) ( $c['email'] ?? '' ),
			'telefone' => (string) ( $r['telefone'] ?? '' ), 'por' => $por_nome, 'criado' => $criado ? wp_date( 'Y-m-d H:i', $criado ) : '',
			'estado' => $estado, 'registado' => ! empty( $c['usado'] ) ? wp_date( 'Y-m-d', (int) $c['usado'] ) : '', 'encomendas' => $enc, '_t' => $criado,
		);
	}
	usort( $out, function ( $a, $b ) { return $b['_t'] - $a['_t']; } );
	return array_map( function ( $x ) { unset( $x['_t'] ); return $x; }, array_slice( $out, 0, 500 ) );
}

add_action( 'rest_api_init', function () {
	$perm = function () { return tcd_c52_on() && tcd_c52_equipa(); };
	register_rest_route( 'tcd/v1', '/c52/convite', array( 'methods' => 'POST', 'permission_callback' => $perm, 'callback' => function ( $req ) {
		$r = tcd_c52_criar( get_current_user_id(), (string) $req->get_param( 'email' ), (string) $req->get_param( 'nome' ), (string) $req->get_param( 'telefone' ) );
		return is_wp_error( $r ) ? $r : rest_ensure_response( $r );
	} ) );
	register_rest_route( 'tcd/v1', '/c52/convites', array( 'methods' => 'GET', 'permission_callback' => $perm, 'callback' => function () {
		return rest_ensure_response( array( 'itens' => tcd_c52_lista( wp_get_current_user() ) ) );
	} ) );
} );

// Vista no Estúdio: /area-equipa/?v=convidar.
add_action( 'init', function () {
	$ant = shortcode_exists( 'tcd_equipa' ) ? $GLOBALS['shortcode_tags']['tcd_equipa'] : null; if ( ! $ant ) { return; }
	add_shortcode( 'tcd_equipa', function ( $atts = array(), $content = '' ) use ( $ant ) {
		$v = isset( $_GET['v'] ) ? sanitize_key( $_GET['v'] ) : ''; // phpcs:ignore
		if ( 'convidar' !== $v || ! tcd_c52_on() ) { return call_user_func( $ant, $atts, $content ); }
		if ( ! tcd_c52_equipa() ) { return '<p>Sem acesso.</p>'; }
		return tcd_c52_vista();
	} );
}, 141 );
add_filter( 'tcd_mesa_atalhos', function ( $a ) {
	if ( tcd_c52_on() && tcd_c52_equipa() ) { $a[] = array( 'Convidar alguém (10 %)', home_url( '/area-equipa/?v=convidar' ), 'Convite preso ao e-mail da pessoa: 10 % em toda a loja, numa encomenda', 'negocio', 'Negócio' ); }
	return $a;
} );
function tcd_c52_vista() {
	$u = wp_get_current_user(); $l = tcd_c52_lista( $u );
	$nomes = array( 'convidado' => 'Convidado', 'registado' => 'Registado', 'encomendou' => 'Encomendou', 'caducado' => 'Convidado (caducou)' );
	$h = '<style>.tc52{max-width:1100px;font:15px/1.5 Inter,Helvetica,Arial,sans-serif;color:#2f2f2a}.tc52 form{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 18px}.tc52 input{font:inherit;padding:8px 10px;border:1px solid #cfc9b4;border-radius:6px}.tc52 button{font:600 14px Raleway,Inter,sans-serif;background:#75834a;color:#fff;border:0;border-radius:6px;padding:9px 14px;cursor:pointer}.tc52 table{width:100%;border-collapse:collapse;font-size:14px}.tc52 th,.tc52 td{text-align:left;padding:6px 8px;border-bottom:1px solid #e5e0d0;vertical-align:top}.tc52 .r{margin:8px 0}.tc52 .mau{color:#9a2f1f}.tc52 textarea{width:100%;font:13px/1.4 Inter,sans-serif}.tc52 .e-registado{color:#3f4630}.tc52 .e-encomendou{color:#3f4630;font-weight:600}.tc52 .e-caducado{color:#8a7f6a}</style>'
		. '<div class="tc52"><p class="k">Negócio</p><h1>Convidar alguém</h1>'
		. '<p>O convite fica preso ao e-mail da pessoa: só com esse e-mail ela se regista e entra no Atlas. Dá 10 % de desconto em toda a loja, numa encomenda, com a sessão iniciada na conta dela.</p>'
		. '<form id="tc52-f"><input type="email" name="email" required placeholder="E-mail da pessoa (obrigatório)" autocomplete="off"><input type="text" name="nome" maxlength="80" placeholder="Nome"><input type="tel" name="telefone" maxlength="20" placeholder="Telefone"><button type="submit">Criar convite</button></form><div id="tc52-r" class="r" aria-live="polite"></div>'
		. '<h2>' . ( tcd_c52_ve_todos( $u ) ? 'Convites de toda a equipa' : 'Os meus convites' ) . '</h2>';
	if ( ! $l ) { $h .= '<p>Ainda não há convites.</p>'; }
	else {
		$h .= '<table><thead><tr><th>Pessoa</th><th>E-mail</th><th>Quem convidou</th><th>Data</th><th>Estado</th><th>Encomendas</th></tr></thead><tbody>';
		foreach ( $l as $x ) {
			$enc = array(); foreach ( $x['encomendas'] as $e ) { $enc[] = '#' . esc_html( $e['numero'] ) . ' (' . esc_html( $e['estado'] ) . ')'; }
			$h .= '<tr><td>' . esc_html( $x['nome'] ) . '<br><small>' . esc_html( $x['codigo'] ) . '</small></td><td>' . esc_html( $x['email'] ) . ( $x['telefone'] ? '<br><small>' . esc_html( $x['telefone'] ) . '</small>' : '' ) . '</td><td>' . esc_html( $x['por'] ? $x['por'] : '—' ) . '</td><td>' . esc_html( $x['criado'] ) . '</td>'
				. '<td class="e-' . esc_attr( $x['estado'] ) . '">' . esc_html( $nomes[ $x['estado'] ] ?? $x['estado'] ) . ( $x['registado'] ? '<br><small>registou-se a ' . esc_html( $x['registado'] ) . '</small>' : '' ) . '</td><td>' . ( $enc ? implode( '<br>', $enc ) : '—' ) . '</td></tr>';
		}
		$h .= '</tbody></table>';
	}
	$cfg = array( 'url' => rest_url( 'tcd/v1/c52/convite' ), 'n' => wp_create_nonce( 'wp_rest' ) );
	$h .= '</div><script>(function(){var K=' . wp_json_encode( $cfg, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT ) . ',f=document.getElementById("tc52-f"),r=document.getElementById("tc52-r");if(!f)return;'
		. 'function e(s){return String(s==null?"":s).replace(/[&<>"\']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","\'":"&#39;"}[c];});}'
		. 'f.addEventListener("submit",function(ev){ev.preventDefault();var b=f.querySelector("button");b.disabled=true;r.className="r";r.textContent="…";'
		. 'fetch(K.url,{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json","X-WP-Nonce":K.n},body:JSON.stringify({email:f.email.value,nome:f.nome.value,telefone:f.telefone.value})}).then(function(x){return x.json().then(function(j){return {ok:x.ok,j:j};});}).then(function(o){b.disabled=false;'
		. 'if(!o.ok){r.className="r mau";r.textContent=(o.j&&o.j.message)||"Não foi possível criar o convite.";return;}'
		. 'var j=o.j;r.innerHTML="<p><b>"+(j.novo?"Convite criado":"Já havia um convite por usar para este e-mail")+": "+e(j.codigo)+"</b>. Envie-o a partir do seu e-mail:</p><p><a href=\""+e(j.mailto)+"\">Abrir no meu e-mail</a> · <a href=\""+e(j.ligacao)+"\" target=\"_blank\" rel=\"noopener\">ligação</a></p><textarea rows=\"9\" readonly>"+e(j.mensagem)+"</textarea>";f.reset();'
		. '}).catch(function(){b.disabled=false;r.className="r mau";r.textContent="Sem ligação. Tente de novo.";});});})();</script>';
	return $h;
}

// Repor: cupões dos convites passam a rascunho (pedido de um administrador, uma vez).
add_action( 'init', function () {
	if ( '1' !== (string) get_option( 'tcd_c52_repor', '' ) || ! current_user_can( 'manage_options' ) ) { return; }
	delete_option( 'tcd_c52_repor' );
	$ids = get_posts( array( 'post_type' => 'shop_coupon', 'post_status' => 'publish', 'numberposts' => 2000, 'fields' => 'ids', 'meta_key' => '_tcd_c52' ) );
	foreach ( $ids as $id ) { wp_update_post( array( 'ID' => (int) $id, 'post_status' => 'draft' ) ); }
	update_option( 'tcd_c52_reposto', array( 't' => time(), 'n' => count( $ids ) ), false );
}, 210 );
