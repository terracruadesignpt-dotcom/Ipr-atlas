<?php
// Módulo 90302: Convites a profissionais (m90135), país e regra de envio por país (pedido do Nuno, 21/10/2026, 19h19:
// «avancem tudo»; regras de europa/mercado/canais.md). Complementa o m90135 sem lhe mexer:
// 1. País ISO de cada entrada: o que a equipa fixar (_cv_pais_iso); senão o campo «pais» do CSV (nome ou código);
//    senão o domínio do e-mail e o do site (.de, .es, .co.uk…). Desconhecido = '?'.
// 2. Regra por país (opção tcd_cv_regras_pais, JSON {"FR":"optout"}): optout (envio a empresas com opção de saída, como
//    em Portugal), consentimento (só com consentimento prévio registado) ou jurista (bloqueado até haver parecer).
//    Por omissão: PT, NL, IE, SE, GB optout; DE, ES, IT, BE, PL, AT e todos os não estudados consentimento; FR e país
//    desconhecido jurista.
// 3. Bloqueio no servidor: corre antes do envio do m90135 (wp_ajax_tcd_cv_enviar, prioridade 1). Tira do lote as
//    entradas bloqueadas, regista o motivo na entrada (_cv_bloqueio e histórico) e junta-as à resposta como canal
//    «bloqueado», com o motivo e o canal alternativo. Não gera ligação mailto: o envio «à mão» também seria e-mail frio.
//    Quem pediu informação ou deu consentimento (_cv_consentimento com data e origem) passa.
// 4. Na vista /area-equipa/?v=convites: quadro por país (entradas, regra) e lista das entradas bloqueadas ou sem país,
//    com escolha do país e registo do consentimento (admin-ajax tcd_cv_pais, nonce tcd_cv do m90135).
// Interruptor: tcd_cv_regras_off = '1'. Prefixo tcd_cvp_.
if ( ! defined( 'ABSPATH' ) ) { exit; }

function tcd_cvp_on() { return '1' !== (string) get_option( 'tcd_cv_regras_off', '0' ); }

function tcd_cvp_regras() {
	$r = array( 'PT' => 'optout', 'NL' => 'optout', 'IE' => 'optout', 'SE' => 'optout', 'GB' => 'optout',
		'DE' => 'consentimento', 'ES' => 'consentimento', 'IT' => 'consentimento', 'BE' => 'consentimento', 'PL' => 'consentimento', 'AT' => 'consentimento',
		'FR' => 'jurista', '?' => 'jurista' );
	$x = json_decode( (string) get_option( 'tcd_cv_regras_pais', '' ), true );
	if ( is_array( $x ) ) {
		foreach ( $x as $k => $v ) {
			$k = '?' === $k ? '?' : strtoupper( substr( preg_replace( '/[^A-Za-z]/', '', (string) $k ), 0, 2 ) );
			if ( ( '?' === $k || 2 === strlen( $k ) ) && in_array( $v, array( 'optout', 'consentimento', 'jurista' ), true ) ) { $r[ $k ] = $v; }
		}
	}
	return $r;
}
function tcd_cvp_regra( $iso ) { $r = tcd_cvp_regras(); return $r[ $iso ] ?? 'consentimento'; }

// ---------- país de uma entrada ----------
function tcd_cvp_nomes() {
	return array( 'portugal' => 'PT', 'espanha' => 'ES', 'espana' => 'ES', 'españa' => 'ES', 'spain' => 'ES', 'franca' => 'FR', 'frança' => 'FR', 'france' => 'FR',
		'alemanha' => 'DE', 'deutschland' => 'DE', 'germany' => 'DE', 'italia' => 'IT', 'itália' => 'IT', 'italy' => 'IT', 'belgica' => 'BE', 'bélgica' => 'BE', 'belgium' => 'BE',
		'polonia' => 'PL', 'polónia' => 'PL', 'poland' => 'PL', 'austria' => 'AT', 'áustria' => 'AT', 'osterreich' => 'AT', 'österreich' => 'AT',
		'paises baixos' => 'NL', 'países baixos' => 'NL', 'holanda' => 'NL', 'netherlands' => 'NL', 'irlanda' => 'IE', 'ireland' => 'IE', 'suecia' => 'SE', 'suécia' => 'SE', 'sweden' => 'SE',
		'reino unido' => 'GB', 'united kingdom' => 'GB', 'inglaterra' => 'GB', 'uk' => 'GB', 'suica' => 'CH', 'suíça' => 'CH', 'switzerland' => 'CH', 'luxemburgo' => 'LU', 'luxembourg' => 'LU' );
}
function tcd_cvp_de_texto( $t ) {
	$t = strtolower( trim( (string) $t ) );
	if ( '' === $t ) { return ''; }
	$n = tcd_cvp_nomes(); if ( isset( $n[ $t ] ) ) { return $n[ $t ]; }
	if ( preg_match( '/^[a-z]{2}$/', $t ) ) { return 'uk' === $t ? 'GB' : strtoupper( $t ); }
	foreach ( $n as $k => $v ) { if ( false !== strpos( $t, $k ) ) { return $v; } }
	return '';
}
function tcd_cvp_de_dominio( $h ) {
	$h = strtolower( (string) $h );
	if ( preg_match( '/\.(co\.uk|org\.uk|ac\.uk)$/', $h ) ) { return 'GB'; }
	if ( preg_match( '/\.([a-z]{2})$/', $h, $m ) ) {
		$cc = $m[1];
		if ( in_array( $cc, array( 'eu', 'io', 'co', 'me', 'tv' ), true ) ) { return ''; }
		return 'uk' === $cc ? 'GB' : strtoupper( $cc );
	}
	return ''; // .com, .org, .net: não diz nada
}
function tcd_cvp_iso( $d ) {
	$id = (int) ( $d['id'] ?? 0 );
	$f = $id ? (string) get_post_meta( $id, '_cv_pais_iso', true ) : '';
	if ( preg_match( '/^[A-Z]{2}$/', $f ) ) { return $f; }
	$p = tcd_cvp_de_texto( $d['pais'] ?? '' ); if ( '' !== $p ) { return $p; }
	$em = (string) ( $d['email'] ?? '' ); $dom = false !== strpos( $em, '@' ) ? substr( strrchr( $em, '@' ), 1 ) : '';
	$p = tcd_cvp_de_dominio( $dom ); if ( '' !== $p ) { return $p; }
	$s = (string) wp_parse_url( (string) ( $d['site'] ?? '' ), PHP_URL_HOST );
	$p = tcd_cvp_de_dominio( $s ); if ( '' !== $p ) { return $p; }
	return '?';
}
function tcd_cvp_consentimento( $id ) { $c = get_post_meta( (int) $id, '_cv_consentimento', true ); return is_array( $c ) && ! empty( $c['quando'] ) ? $c : null; }

// Pode enviar-se um convite a esta entrada? Devolve '' ou o motivo.
function tcd_cvp_motivo( $d ) {
	$iso = tcd_cvp_iso( $d ); $r = tcd_cvp_regra( $iso );
	if ( 'optout' === $r ) { return ''; }
	if ( 'consentimento' === $r && tcd_cvp_consentimento( $d['id'] ?? 0 ) ) { return ''; }
	if ( '?' === $iso ) { return 'País desconhecido: indique o país da entrada antes de convidar.'; }
	if ( 'jurista' === $r ) { return sprintf( '%s: regra do e-mail a empresas por confirmar com o jurista; não se envia até haver parecer.', $iso ); }
	return sprintf( '%s: o e-mail comercial a empresas exige consentimento prévio. Convide pela rede, por um formador ou parceiro, ou peça primeiro autorização pelo formulário de contacto do próprio profissional e registe-a aqui.', $iso );
}

// ---------- bloqueio antes do envio do m90135 ----------
add_action( 'wp_ajax_tcd_cv_enviar', function () {
	if ( ! tcd_cvp_on() || ! function_exists( 'tcd_cv_ler' ) || ! function_exists( 'tcd_cv_pode' ) || ! tcd_cv_pode() ) { return; }
	if ( ! check_ajax_referer( 'tcd_cv', 'n', false ) ) { return; } // o m90135 recusa a seguir
	$ids = array_map( 'absint', (array) ( $_POST['ids'] ?? array() ) ); // phpcs:ignore WordPress.Security.NonceVerification
	$livres = array(); $bloq = array();
	$u = wp_get_current_user();
	foreach ( $ids as $id ) {
		$d = tcd_cv_ler( $id ); if ( ! $d ) { continue; }
		$m = tcd_cvp_motivo( $d );
		if ( '' === $m ) { $livres[] = $id; continue; }
		update_post_meta( $id, '_cv_bloqueio', array( 'quando' => current_time( 'mysql' ), 'motivo' => $m, 'pais' => tcd_cvp_iso( $d ) ) );
		$h = $d['hist']; $h[] = array( 'quando' => current_time( 'mysql' ), 'canal' => 'bloqueado', 'motivo' => $m, 'por' => $u->display_name ?? '' );
		update_post_meta( $id, '_cv_hist', $h );
		$bloq[] = array( 'id' => $id, 'nome' => $d['nome'], 'email' => $d['email'], 'canal' => 'bloqueado', 'codigo' => '', 'mensagem' => $m, 'mailto' => '' );
	}
	if ( ! $bloq ) { return; }
	if ( ! $livres ) { wp_send_json_success( array( 'enviados' => 0, 'amao' => 0, 'bloqueados' => count( $bloq ), 'itens' => $bloq ) ); return; }
	$_POST['ids'] = $livres; // o m90135 envia só estes
	// Juntar os bloqueados à resposta JSON do m90135 quando ela sair.
	ob_start( function ( $buf ) use ( $bloq ) {
		$j = json_decode( $buf, true );
		if ( ! is_array( $j ) || empty( $j['success'] ) || ! isset( $j['data']['itens'] ) ) { return $buf; }
		$j['data']['itens'] = array_merge( $j['data']['itens'], $bloq ); $j['data']['bloqueados'] = count( $bloq );
		return wp_json_encode( $j );
	} );
}, 1 );

// ---------- país e consentimento pela equipa ----------
add_action( 'wp_ajax_tcd_cv_pais', function () {
	if ( ! tcd_cvp_on() || ! function_exists( 'tcd_cv_pode' ) || ! tcd_cv_pode() ) { wp_send_json_error( 'Sem acesso.', 403 ); }
	check_ajax_referer( 'tcd_cv', 'n' );
	$id = absint( $_POST['id'] ?? 0 ); if ( ! function_exists( 'tcd_cv_ler' ) || ! tcd_cv_ler( $id ) ) { wp_send_json_error( 'Convidado desconhecido.', 400 ); }
	if ( isset( $_POST['pais'] ) ) {
		$p = strtoupper( sanitize_key( wp_unslash( $_POST['pais'] ) ) );
		update_post_meta( $id, '_cv_pais_iso', preg_match( '/^[A-Z]{2}$/', $p ) ? $p : '' );
	}
	if ( isset( $_POST['consentimento'] ) ) {
		$o = mb_substr( sanitize_text_field( wp_unslash( $_POST['consentimento'] ) ), 0, 200 );
		if ( '' === $o ) { delete_post_meta( $id, '_cv_consentimento' ); }
		else { $u = wp_get_current_user(); update_post_meta( $id, '_cv_consentimento', array( 'quando' => current_time( 'mysql' ), 'origem' => $o, 'por' => $u->display_name ?? '' ) ); }
	}
	$d = tcd_cv_ler( $id );
	wp_send_json_success( array( 'id' => $id, 'pais' => tcd_cvp_iso( $d ), 'regra' => tcd_cvp_regra( tcd_cvp_iso( $d ) ), 'motivo' => tcd_cvp_motivo( $d ) ) );
} );

// ---------- quadro na vista de convites ----------
function tcd_cvp_quadro() {
	if ( ! function_exists( 'tcd_cv_todos' ) ) { return ''; }
	$todos = tcd_cv_todos(); $por = array(); $lista = array();
	foreach ( $todos as $d ) {
		$iso = tcd_cvp_iso( $d ); $por[ $iso ] = ( $por[ $iso ] ?? 0 ) + 1;
		$m = tcd_cvp_motivo( $d ); if ( '' !== $m ) { $lista[] = array( $d, $iso, $m ); }
	}
	ksort( $por );
	$nomes = array( 'optout' => 'pode convidar (opção de saída)', 'consentimento' => 'só com consentimento prévio', 'jurista' => 'bloqueado até parecer do jurista' );
	$h = '<div class="tcd-cvp" style="max-width:1100px;margin:24px auto;padding:0 16px;font:14px/1.5 Inter,Helvetica,Arial,sans-serif"><h3>Regras de envio por país</h3>';
	$h .= '<p style="color:#6b6f5c;max-width:70ch">O e-mail a empresas segue a lei de cada país (europa/mercado/canais.md). Os convites a entradas bloqueadas não saem pelo site nem geram mensagem para enviar à mão.</p>';
	$h .= '<table style="border-collapse:collapse;margin-bottom:16px"><tr><th style="text-align:left;padding:4px 10px">País</th><th style="text-align:left;padding:4px 10px">Entradas</th><th style="text-align:left;padding:4px 10px">Regra</th></tr>';
	foreach ( $por as $iso => $n ) { $h .= '<tr><td style="padding:4px 10px">' . esc_html( $iso ) . '</td><td style="padding:4px 10px">' . (int) $n . '</td><td style="padding:4px 10px">' . esc_html( $nomes[ tcd_cvp_regra( $iso ) ] ) . '</td></tr>'; }
	$h .= '</table>';
	if ( $lista ) {
		$h .= '<h4>Bloqueadas ou sem país (' . count( $lista ) . ')</h4><table style="border-collapse:collapse;width:100%"><tr><th style="text-align:left;padding:4px 8px">Nome</th><th style="text-align:left;padding:4px 8px">País</th><th style="text-align:left;padding:4px 8px">Motivo</th><th style="text-align:left;padding:4px 8px">Consentimento (origem)</th></tr>';
		foreach ( array_slice( $lista, 0, 300 ) as $x ) {
			list( $d, $iso, $m ) = $x;
			$h .= '<tr data-cvp="' . (int) $d['id'] . '"><td style="padding:4px 8px">' . esc_html( $d['nome'] ) . '</td>'
				. '<td style="padding:4px 8px"><input class="cvp-pais" size="3" maxlength="2" value="' . esc_attr( '?' === $iso ? '' : $iso ) . '"></td>'
				. '<td style="padding:4px 8px">' . esc_html( $m ) . '</td>'
				. '<td style="padding:4px 8px"><input class="cvp-cons" placeholder="ex.: pediu informação por e-mail a 21/10" style="width:100%"></td></tr>';
		}
		$h .= '</table>';
	}
	$nonce = wp_create_nonce( 'tcd_cv' ); $ajax = admin_url( 'admin-ajax.php' );
	$h .= '<script>(function(){var q=document.querySelector(".tcd-cvp");if(!q)return;q.addEventListener("change",function(e){var tr=e.target.closest("tr[data-cvp]");if(!tr)return;var f=new FormData();f.append("action","tcd_cv_pais");f.append("n",' . wp_json_encode( $nonce ) . ');f.append("id",tr.getAttribute("data-cvp"));'
		. 'if(e.target.classList.contains("cvp-pais"))f.append("pais",e.target.value);if(e.target.classList.contains("cvp-cons"))f.append("consentimento",e.target.value);'
		. 'fetch(' . wp_json_encode( $ajax ) . ',{method:"POST",body:f,credentials:"same-origin"}).then(function(r){return r.json();}).then(function(j){if(j&&j.success){tr.style.background=j.data.motivo?"#fbebeb":"#e5f4e4";}});});})();</script></div>';
	return $h;
}
add_action( 'init', function () {
	if ( ! tcd_cvp_on() || ! shortcode_exists( 'tcd_equipa' ) ) { return; }
	$ant = $GLOBALS['shortcode_tags']['tcd_equipa'];
	add_shortcode( 'tcd_equipa', function ( $atts = array(), $content = '' ) use ( $ant ) {
		$out = call_user_func( $ant, $atts, $content );
		$v = isset( $_GET['v'] ) ? sanitize_key( $_GET['v'] ) : ''; // phpcs:ignore
		if ( 'convites' !== $v || ! function_exists( 'tcd_cv_pode' ) || ! tcd_cv_pode() ) { return $out; }
		return $out . tcd_cvp_quadro();
	} );
}, 140 ); // depois do m90135 (que embrulha o tcd_equipa no init por omissão) e do m90071 (130)
