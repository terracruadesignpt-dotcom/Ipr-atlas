<?php
// Módulo 90046: correcções graves do painel «Sugestões para convidar» (m90163) e dos Convites (m90135) (pedido do Nuno,
// 20/10/2026, 18h10). Não altera esses módulos; actua por cima deles.
// 1. Duplicados: 30 e-mails estavam repetidos em 67 linhas (até 3 vezes) e várias organizações tinham uma linha com e-mail
//    e outra sem, no mesmo site. Cada uma ia receber 2 ou 3 convites. Uma vez só: por e-mail igual, ou pelo mesmo site
//    quando não há dois e-mails diferentes, fica a linha mais completa e as outras passam a «fora» com _cv_duplicado_de,
//    _cv_estado_antes e uma linha na nota. Os campos vazios da que fica (e-mail, telefone, site) recebem os da duplicada.
//    Primeiro só simula (tcd_sg46_dedup_sim); aplica com a opção tcd_sg46_aplicar = 1. Relatório: tcd_sg46_dedup_rel. Desfazer: opção tcd_sg46_repor = 1 (repõe estados e profissões no pedido seguinte).
// 2. Guarda no envio (painel, WhatsApp e envio em lote do m90135): ninguém com o mesmo e-mail ou telefone de alguém já
//    convidado recebe outro convite; no lote, o mesmo e-mail só vai uma vez.
// 3. «Enviar por e-mail»: o motivo real da falha passa a aparecer (wp_mail_failed). Enquanto o correio do site não estiver
//    no SMTP (m90206, Ferramentas › Correio do site), o mail() do alojamento recusa («Could not instantiate mail
//    function»). Na falha o painel dá «Abrir no meu e-mail» (mensagem e código prontos) e «Já enviei», que regista o
//    convite. Aviso no topo da janela quando houve falhas nas últimas 24 h. Falhas em tcd_sg46_falhas (últimas 30).
// 4. Profissões sem repetições («agrofloresta» duas vezes) e com acentos (formacao, gestao, conservacao, educacao);
//    original em _cv_profissoes_orig. Prioridade escrita por extenso («Prioridade A»).
// Desligar: opção tcd_sg46_off = 1. Prefixo tcd_sg46_.
if ( ! defined( 'ABSPATH' ) ) { exit; }

function tcd_sg46_on() { return ! get_option( 'tcd_sg46_off' ) && function_exists( 'tcd_cv_ler' ) && ( ! function_exists( 'tcd_cv_on' ) || tcd_cv_on() ); }
function tcd_sg46_pode() { return is_user_logged_in() && current_user_can( 'manage_options' ); }
function tcd_sg46_email( $s ) { $s = strtolower( trim( (string) $s ) ); return is_email( $s ) ? $s : ''; }
function tcd_sg46_tel( $s ) { $t = preg_replace( '/\D+/', '', (string) $s ); return strlen( $t ) >= 9 ? substr( $t, -9 ) : ''; }
function tcd_sg46_host( $url ) {
	$h = strtolower( (string) wp_parse_url( trim( (string) $url ), PHP_URL_HOST ) );
	$h = preg_replace( '/^www\./', '', $h );
	if ( '' === $h ) { return ''; }
	// Plataformas e páginas de terceiros: o mesmo anfitrião não quer dizer a mesma organização.
	$plat = array( 'facebook.com', 'm.facebook.com', 'instagram.com', 'linkedin.com', 'youtube.com', 'twitter.com', 'x.com', 'linktr.ee', 'sites.google.com', 'google.com', 'wordpress.com', 'blogspot.com', 'wixsite.com', 'redpac.es', 'apap.pt', 'baserow.io', 'issuu.com', 'researchgate.net' );
	if ( in_array( $h, $plat, true ) ) { return ''; }
	foreach ( array( 'wixsite.com', 'blogspot.com', 'sites.google.com' ) as $p ) { if ( substr( $h, -strlen( $p ) - 1 ) === '.' . $p ) { return ''; } }
	return $h;
}
function tcd_sg46_fixo( $estado ) { return in_array( $estado, array( 'convidado', 'seguimento', 'respondeu', 'aceitou', 'recusou' ), true ); }
// Convidado de facto: estado de convite e, se «convidado» ou «seguimento», pelo menos um envio que não falhou
// (o lote do m90135 marca «convidado» mesmo quando o e-mail falha).
function tcd_sg46_ja_foi( $d ) {
	if ( ! tcd_sg46_fixo( $d['estado'] ) ) { return false; }
	if ( ! in_array( $d['estado'], array( 'convidado', 'seguimento' ), true ) || ! $d['hist'] ) { return true; }
	foreach ( (array) $d['hist'] as $h ) { if ( is_array( $h ) && 'falhou' !== ( $h['canal'] ?? '' ) ) { return true; } }
	return false;
}
function tcd_sg46_mai( $s ) { return function_exists( 'mb_strtoupper' ) ? mb_strtoupper( $s ) : strtoupper( $s ); }

// ---------- 4. profissões ----------
function tcd_sg46_profissoes( $s ) {
	$mapa = array( 'formacao' => 'formação', 'gestao' => 'gestão', 'conservacao' => 'conservação', 'educacao' => 'educação' );
	$out = array(); $vistos = array();
	foreach ( explode( ',', (string) $s ) as $t ) {
		$t = trim( preg_replace( '/\s+/u', ' ', $t ) ); if ( '' === $t ) { continue; }
		$t = preg_replace_callback( '/\b(' . implode( '|', array_keys( $mapa ) ) . ')\b/iu', function ( $m ) use ( $mapa ) {
			$r = $mapa[ strtolower( $m[1] ) ]; return ctype_upper( $m[1][0] ) ? tcd_sg46_mai( substr( $r, 0, 1 ) ) . substr( $r, 1 ) : $r;
		}, $t );
		$k = strtolower( remove_accents( $t ) );
		if ( isset( $vistos[ $k ] ) ) { continue; }
		$vistos[ $k ] = 1; $out[] = $t;
	}
	return implode( ', ', $out );
}

// ---------- 1. duplicados (uma vez) ----------
function tcd_sg46_linhas() {
	$ids = get_posts( array( 'post_type' => 'tcd_conv', 'post_status' => 'any', 'numberposts' => 5000, 'fields' => 'ids', 'orderby' => 'ID', 'order' => 'ASC' ) );
	if ( $ids && function_exists( 'update_meta_cache' ) ) { update_meta_cache( 'post', $ids ); }
	$l = array(); foreach ( $ids as $id ) { $d = tcd_cv_ler( $id ); if ( $d ) { $l[ (int) $id ] = $d; } } return $l;
}
function tcd_sg46_grupos( $l ) {
	$pai = array(); foreach ( $l as $id => $d ) { $pai[ $id ] = $id; }
	$raiz = function ( $x ) use ( &$pai ) { while ( $pai[ $x ] !== $x ) { $pai[ $x ] = $pai[ $pai[ $x ] ]; $x = $pai[ $x ]; } return $x; };
	$junta = function ( $a, $b ) use ( &$pai, $raiz ) { $ra = $raiz( $a ); $rb = $raiz( $b ); if ( $ra !== $rb ) { $pai[ max( $ra, $rb ) ] = min( $ra, $rb ); } };
	$por = array();
	foreach ( $l as $id => $d ) { $e = tcd_sg46_email( $d['email'] ); if ( $e ) { $por[ $e ][] = $id; } }
	foreach ( $por as $g ) { for ( $i = 1; $i < count( $g ); $i++ ) { $junta( $g[0], $g[ $i ] ); } }
	// Mesmo site: só junta quando no conjunto não há dois e-mails nem dois telefones diferentes (pessoas diferentes da mesma
	// casa ficam).
	$hs = array();
	foreach ( $l as $id => $d ) { $h = tcd_sg46_host( $d['site'] ); if ( $h ) { $hs[ $h ][] = $id; } }
	foreach ( $hs as $g ) {
		if ( count( $g ) < 2 ) { continue; }
		$em = array(); foreach ( $g as $id ) { $e = tcd_sg46_email( $l[ $id ]['email'] ); if ( $e ) { $em[ $e ] = 1; } }
		$tl = array(); foreach ( $g as $id ) { $t = tcd_sg46_tel( $l[ $id ]['telefone'] ); if ( $t ) { $tl[ $t ] = 1; } }
		if ( count( $em ) > 1 || count( $tl ) > 1 ) { continue; }
		for ( $i = 1; $i < count( $g ); $i++ ) { $junta( $g[0], $g[ $i ] ); }
	}
	$gr = array(); foreach ( $l as $id => $d ) { $gr[ $raiz( $id ) ][] = $id; }
	return array_values( array_filter( $gr, function ( $g ) { return count( $g ) > 1; } ) );
}
function tcd_sg46_pontos( $d ) {
	$pr = array( 'A' => 30, 'B' => 20, 'C' => 10 );
	$n = tcd_sg46_ja_foi( $d ) ? 1000 : ( 'fora' === $d['estado'] ? -1000 : 0 );
	$n += $pr[ $d['prioridade'] ] ?? 10;
	$n += tcd_sg46_email( $d['email'] ) ? 5 : 0;
	$n += tcd_sg46_tel( $d['telefone'] ) ? 2 : 0;
	$n += $d['site'] ? 1 : 0;
	$n += $d['nota_nuno'] ? 1 : 0;
	return $n;
}
function tcd_sg46_dedup( $aplicar = true ) {
	$l = tcd_sg46_linhas(); $rel = array(); $prof = 0;
	foreach ( tcd_sg46_grupos( $l ) as $g ) {
		usort( $g, function ( $a, $b ) use ( $l ) { $d = tcd_sg46_pontos( $l[ $b ] ) - tcd_sg46_pontos( $l[ $a ] ); return $d ?: $a - $b; } );
		$fica = array_shift( $g ); $k = $l[ $fica ];
		foreach ( $g as $id ) {
			$d = $l[ $id ];
			if ( tcd_sg46_fixo( $d['estado'] ) || 'fora' === $d['estado'] ) { continue; } // já tratado à mão: não se mexe
			$rel[] = array( 'id' => $id, 'nome' => $d['nome'], 'email' => $d['email'], 'fica' => $fica, 'fica_nome' => $k['nome'] );
			if ( ! $aplicar ) { continue; }
			foreach ( array( 'email', 'telefone', 'site' ) as $c ) {
				if ( '' === trim( (string) $k[ $c ] ) && '' !== trim( (string) $d[ $c ] ) ) { update_post_meta( $fica, '_cv_' . $c, $d[ $c ] ); $k[ $c ] = $d[ $c ]; add_post_meta( $fica, '_cv_dup_copiou', wp_json_encode( array( 'c' => $c, 'v' => $d[ $c ] ) ) ); }
			}
			update_post_meta( $id, '_cv_estado_antes', $d['estado'] );
			update_post_meta( $id, '_cv_duplicado_de', $fica );
			update_post_meta( $id, '_cv_estado', 'fora' );
			$nota = 'Duplicado de «' . $k['nome'] . '» (#' . $fica . '), posto de parte pelo site a ' . wp_date( 'j/m/Y' ) . '.';
			update_post_meta( $id, '_cv_nota_nuno', trim( $nota . ( $d['nota_nuno'] ? ' ' . $d['nota_nuno'] : '' ) ) );
		}
	}
	foreach ( $l as $id => $d ) {
		$n = tcd_sg46_profissoes( $d['profissoes'] );
		if ( $n !== $d['profissoes'] && ! $aplicar ) { $prof++; continue; }
		if ( $n !== $d['profissoes'] ) { if ( ! get_post_meta( $id, '_cv_profissoes_orig', true ) ) { update_post_meta( $id, '_cv_profissoes_orig', $d['profissoes'] ); } update_post_meta( $id, '_cv_profissoes', $n ); $prof++; }
	}
	update_option( $aplicar ? 'tcd_sg46_dedup_rel' : 'tcd_sg46_dedup_sim', array( 'quando' => time(), 'duplicados' => $rel, 'profissoes' => $prof ), false );
	if ( $aplicar ) { delete_transient( 'tcd_sg_alerta' ); }
	return count( $rel );
}
function tcd_sg46_repor() {
	global $wpdb;
	foreach ( (array) $wpdb->get_col( $wpdb->prepare( "SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = %s", '_cv_duplicado_de' ) ) as $id ) {
		if ( 'fora' === get_post_meta( $id, '_cv_estado', true ) ) { update_post_meta( $id, '_cv_estado', get_post_meta( $id, '_cv_estado_antes', true ) ?: 'por_convidar' ); }
		$n = (string) get_post_meta( $id, '_cv_nota_nuno', true );
		update_post_meta( $id, '_cv_nota_nuno', trim( preg_replace( '/^Duplicado de «.*?» \(#\d+\), posto de parte pelo site a [\d\/]+\.\s*/u', '', $n ) ) );
		delete_post_meta( $id, '_cv_duplicado_de' ); delete_post_meta( $id, '_cv_estado_antes' );
	}
	foreach ( (array) $wpdb->get_results( $wpdb->prepare( "SELECT post_id, meta_value FROM {$wpdb->postmeta} WHERE meta_key = %s", '_cv_dup_copiou' ) ) as $r ) {
		$x = json_decode( (string) $r->meta_value, true ); if ( ! is_array( $x ) || empty( $x['c'] ) ) { continue; }
		$c = sanitize_key( $x['c'] ); if ( ! in_array( $c, array( 'email', 'telefone', 'site' ), true ) ) { continue; }
		if ( (string) get_post_meta( (int) $r->post_id, '_cv_' . $c, true ) === (string) $x['v'] ) { delete_post_meta( (int) $r->post_id, '_cv_' . $c ); } // só se ninguém mudou
	}
	delete_post_meta_by_key( '_cv_dup_copiou' );
	foreach ( (array) $wpdb->get_results( $wpdb->prepare( "SELECT post_id, meta_value FROM {$wpdb->postmeta} WHERE meta_key = %s", '_cv_profissoes_orig' ) ) as $r ) {
		if ( (string) get_post_meta( (int) $r->post_id, '_cv_profissoes', true ) === tcd_sg46_profissoes( $r->meta_value ) ) { update_post_meta( (int) $r->post_id, '_cv_profissoes', $r->meta_value ); }
	}
	delete_post_meta_by_key( '_cv_profissoes_orig' );
	delete_transient( 'tcd_sg_alerta' );
}
function tcd_sg46_trinco( $k ) { // trinco com hora; um pedido que morreu a meio é retomado ao fim de 10 min
	if ( add_option( $k, time(), '', 'no' ) ) { return true; }
	$t = (int) get_option( $k ); if ( $t && $t < time() - 600 ) { update_option( $k, time(), false ); return true; }
	return false;
}
add_action( 'init', function () {
	if ( ! tcd_sg46_on() ) { return; }
	if ( ! tcd_sg46_pode() && ! ( function_exists( 'wp_doing_cron' ) && wp_doing_cron() ) ) { return; } // nunca no pedido de um visitante
	if ( '1' === (string) get_option( 'tcd_sg46_repor' ) ) {
		delete_option( 'tcd_sg46_repor' ); tcd_sg46_repor(); update_option( 'tcd_sg46_dedup', 'reposto', false ); return;
	}
	// Primeiro só simula (relatório em tcd_sg46_dedup_sim); aplica quando tcd_sg46_aplicar = 1.
	if ( '1' !== (string) get_option( 'tcd_sg46_aplicar' ) ) {
		if ( ! get_option( 'tcd_sg46_dedup_sim' ) && tcd_sg46_trinco( 'tcd_sg46_sim_trinco' ) ) { tcd_sg46_dedup( false ); delete_option( 'tcd_sg46_sim_trinco' ); }
		return;
	}
	if ( get_option( 'tcd_sg46_dedup' ) ) { return; }
	if ( ! tcd_sg46_trinco( 'tcd_sg46_trinco' ) ) { return; } // só um pedido faz isto
	$n = tcd_sg46_dedup( true );
	update_option( 'tcd_sg46_dedup', 'v1', false ); delete_option( 'tcd_sg46_trinco' );
	if ( $n && function_exists( 'tcd_tg_enviar' ) ) { tcd_tg_enviar( 'Convites a profissionais: ' . $n . ' linhas duplicadas postas de parte (estado «fora», nota na linha). Ninguém recebe o convite duas vezes. Desfazer: opção tcd_sg46_repor = 1.' ); }
}, 200 );

// ---------- 2. guarda no envio ----------
function tcd_sg46_ja_convidado( $d ) {
	global $wpdb;
	$e = tcd_sg46_email( $d['email'] ); $t = tcd_sg46_tel( $d['telefone'] );
	if ( ! $e && ! $t ) { return ''; }
	$ids = $e ? $wpdb->get_col( $wpdb->prepare( "SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = '_cv_email' AND LOWER(TRIM(meta_value)) = %s AND post_id <> %d", $e, (int) $d['id'] ) ) : array();
	if ( $t ) { $ids = array_merge( $ids, $wpdb->get_col( $wpdb->prepare( "SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = '_cv_telefone' AND REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(meta_value,' ',''),'-',''),'.',''),'+',''),'(',''),')','') LIKE %s AND post_id <> %d", '%' . $wpdb->esc_like( substr( $t, -6 ) ) . '%', (int) $d['id'] ) ) ); }
	foreach ( array_unique( array_map( 'intval', $ids ) ) as $id ) {
		$o = tcd_cv_ler( $id ); if ( ! $o || 'tcd_conv' !== get_post_type( $id ) ) { continue; }
		$igual = ( $e && tcd_sg46_email( $o['email'] ) === $e ) || ( $t && tcd_sg46_tel( $o['telefone'] ) === $t );
		if ( ! $igual ) { continue; }
		if ( tcd_sg46_ja_foi( $o ) ) { return $o['nome'] . ' (#' . $id . ', ' . $o['estado'] . ')'; }
	}
	return '';
}
function tcd_sg46_bloqueio( $d ) {
	if ( tcd_sg46_ja_foi( $d ) ) { return 'Já convidado (' . $d['estado'] . ( $d['ultimo'] ? ', ' . substr( $d['ultimo'], 0, 10 ) : '' ) . ').'; }
	if ( get_post_meta( $d['id'], '_cv_duplicado_de', true ) ) { return 'Não enviado: é uma linha duplicada de #' . (int) get_post_meta( $d['id'], '_cv_duplicado_de', true ) . '.'; }
	$j = tcd_sg46_ja_convidado( $d );
	return $j ? 'Não enviado: já foi convidado por ' . $j . '.' : '';
}
add_action( 'wp_ajax_tcd_sg', function () {
	if ( ! tcd_sg46_on() || ! tcd_sg46_pode() ) { return; }
	$acc = sanitize_key( $_POST['acc'] ?? '' ); // phpcs:ignore
	if ( 'email' !== $acc && 'whatsapp' !== $acc ) { return; }
	$d = tcd_cv_ler( absint( $_POST['id'] ?? 0 ) ); if ( ! $d ) { return; } // phpcs:ignore
	$j = tcd_sg46_bloqueio( $d );
	if ( $j ) { check_ajax_referer( 'tcd_sg', 'n' ); wp_send_json_error( $j, 409 ); }
}, 1 );
add_action( 'wp_ajax_tcd_cv_enviar', function () {
	if ( ! tcd_sg46_on() || ! tcd_sg46_pode() || empty( $_POST['ids'] ) ) { return; } // phpcs:ignore
	$ok = array(); $vistos = array(); $fora = array();
	foreach ( (array) $_POST['ids'] as $id ) { // phpcs:ignore
		$d = tcd_cv_ler( absint( $id ) ); if ( ! $d ) { continue; }
		$e = tcd_sg46_email( $d['email'] ); $t = tcd_sg46_tel( $d['telefone'] );
		$j = tcd_sg46_bloqueio( $d );
		if ( ! $j && ( ( $e && isset( $vistos[ 'e' . $e ] ) ) || ( $t && isset( $vistos[ 't' . $t ] ) ) ) ) { $j = 'repetido neste envio'; }
		if ( $j ) { $fora[] = $d['nome'] . ': ' . $j; continue; }
		if ( $e ) { $vistos[ 'e' . $e ] = 1; } if ( $t ) { $vistos[ 't' . $t ] = 1; }
		$ok[] = (string) $d['id'];
	}
	if ( $fora ) {
		update_option( 'tcd_sg46_lote_saltados', array( 't' => time(), 'l' => $fora ), false );
		if ( function_exists( 'tcd_tg_enviar' ) ) { tcd_tg_enviar( 'Convites: ' . count( $fora ) . ' fora deste envio para não repetir: ' . esc_html( implode( '; ', array_slice( $fora, 0, 10 ) ) ) . ( count( $fora ) > 10 ? '…' : '' ) ); }
	}
	$_POST['ids'] = $ok; // o m90135 corre a seguir só com estes
}, 1 );

// ---------- 3. envio por e-mail com motivo da falha e alternativa ----------
function tcd_sg46_falha( $d, $motivo ) {
	$f = get_option( 'tcd_sg46_falhas', array() ); if ( ! is_array( $f ) ) { $f = array(); }
	$f[] = array( 't' => time(), 'id' => (int) $d['id'], 'nome' => $d['nome'], 'm' => mb_substr( (string) $motivo, 0, 200 ) );
	update_option( 'tcd_sg46_falhas', array_slice( $f, -30 ), false );
}
function tcd_sg46_smtp() { return function_exists( 'tcd_sm6_pronto' ) && tcd_sm6_pronto(); }
function tcd_sg46_codigo( $d ) {
	$reg = get_option( 'tcd_convites', array() ); if ( ! is_array( $reg ) ) { $reg = array(); }
	$cod = $d['codigo'] && isset( $reg[ $d['codigo'] ] ) && empty( $reg[ $d['codigo'] ]['usado'] ) ? $d['codigo'] : tcd_cv_codigo();
	$of = function_exists( 'tcd_sg_ofertas' ) ? tcd_sg_ofertas() : array( 'base100', 'designer3', 'oficina' );
	$reg[ $cod ] = array( 'email' => strtolower( $d['email'] ), 'nome' => $d['nome'], 'pais' => $d['pais'], 'conv' => (int) $d['id'], 'ofertas' => $of, 'criado' => time(), 'validade' => time() + 60 * DAY_IN_SECONDS, 'usado' => 0 );
	update_option( 'tcd_convites', $reg, false );
	update_post_meta( $d['id'], '_cv_codigo', $cod );
	return array( $cod, $of );
}
add_action( 'wp_ajax_tcd_sg46', function () {
	if ( ! tcd_sg46_on() || ! tcd_sg46_pode() || ! function_exists( 'tcd_sg_convidar' ) ) { wp_send_json_error( array( 'm' => 'Sem acesso.' ), 403 ); }
	check_ajax_referer( 'tcd_sg46', 'n' );
	$acc = sanitize_key( $_POST['acc'] ?? '' ); $d = tcd_cv_ler( absint( $_POST['id'] ?? 0 ) ); // phpcs:ignore
	if ( ! $d ) { wp_send_json_error( array( 'm' => 'Não encontrado.' ), 400 ); }
	$j = tcd_sg46_bloqueio( $d );
	if ( $j ) { wp_send_json_error( array( 'm' => $j ), 409 ); }
	if ( 'email' === $acc ) {
		if ( ! tcd_sg46_email( $d['email'] ) ) { wp_send_json_error( array( 'm' => 'Esta linha não tem e-mail válido.' ), 400 ); }
		$motivo = '';
		$f = function ( $e ) use ( &$motivo ) { $motivo = is_wp_error( $e ) ? $e->get_error_message() : 'erro desconhecido'; };
		add_action( 'wp_mail_failed', $f, 1 );
		$r = tcd_sg_convidar( $d['id'], 'email' );
		remove_action( 'wp_mail_failed', $f, 1 );
		if ( ! is_wp_error( $r ) ) { delete_transient( 'tcd_sg_alerta' ); wp_send_json_success( array( 'codigo' => $r['codigo'], 'dados' => tcd_sg_dados() ) ); }
		$motivo = $motivo ?: $r->get_error_message();
		tcd_sg46_falha( $d, $motivo );
		list( $cod, $of ) = tcd_sg46_codigo( tcd_cv_ler( $d['id'] ) );
		$es = function_exists( 'tcd_cv_es' ) && tcd_cv_es( $d['pais'] );
		$ass = $es ? 'Invitación de Terracrua Design: IPR Atlas e IPR Cloud' : 'Convite da Terracrua Design: IPR Atlas e IPR Cloud';
		$msg = tcd_cv_mensagem( tcd_cv_ler( $d['id'] ), $of, $cod, false );
		wp_send_json_error( array(
			'm' => 'O site não conseguiu enviar o e-mail (' . $motivo . ').', 'smtp' => tcd_sg46_smtp(), 'codigo' => $cod,
			'mailto' => 'mailto:' . rawurlencode( $d['email'] ) . '?subject=' . rawurlencode( $ass ) . '&body=' . rawurlencode( $msg ),
		), 200 );
	}
	if ( 'marcar' === $acc ) { // enviado à mão pelo Nuno, com o código da tentativa
		$cod = $d['codigo']; $reg = get_option( 'tcd_convites', array() );
		if ( ! $cod || ! is_array( $reg ) || ! isset( $reg[ $cod ] ) ) { list( $cod ) = tcd_sg46_codigo( $d ); }
		$h = $d['hist']; $h[] = array( 'quando' => current_time( 'mysql' ), 'canal' => 'mao', 'ofertas' => function_exists( 'tcd_sg_ofertas' ) ? tcd_sg_ofertas() : array(), 'codigo' => $cod, 'por' => wp_get_current_user()->display_name, 'seguimento' => 0 );
		update_post_meta( $d['id'], '_cv_hist', $h );
		update_post_meta( $d['id'], '_cv_estado', 'convidado' );
		update_post_meta( $d['id'], '_cv_ultimo', current_time( 'mysql' ) );
		update_post_meta( $d['id'], '_cv_proximo', gmdate( 'Y-m-d', time() + 30 * DAY_IN_SECONDS ) );
		delete_transient( 'tcd_sg_alerta' );
		wp_send_json_success( array( 'codigo' => $cod, 'dados' => tcd_sg_dados() ) );
	}
	wp_send_json_error( array( 'm' => 'Acção desconhecida.' ), 400 );
} );

// Na janela: envio por e-mail por esta via, aviso de falhas e «Prioridade A».
add_action( 'wp_footer', function () {
	if ( ! tcd_sg46_on() || ! tcd_sg46_pode() || ! is_page() || ! function_exists( 'tcd_sg_on' ) || ! tcd_sg_on() ) { return; }
	$p = get_queried_object(); if ( ! $p || 'area-equipa' !== $p->post_name ) { return; }
	$f = array_values( array_filter( (array) get_option( 'tcd_sg46_falhas', array() ), function ( $x ) { return is_array( $x ) && $x['t'] > time() - DAY_IN_SECONDS; } ) );
	$cfg = array( 'ajax' => admin_url( 'admin-ajax.php' ), 'n' => wp_create_nonce( 'tcd_sg46' ), 'smtp' => tcd_sg46_smtp(), 'correio' => admin_url( 'tools.php?page=tcd-correio' ), 'falhas' => count( $f ), 'ultima' => $f ? end( $f )['m'] : '' );
	?>
<style>#tcdsg .sg46-al{background:#fdecea;border:1px solid #e3a49b;border-radius:6px;padding:8px 10px;font-size:13px;margin:0 0 10px;color:#5a2a22}#tcdsg .sg46-al a{color:#5a2a22;font-weight:600}#tcdsg .sg46-f{grid-column:1/-1;font-size:12.5px;color:#5a2a22;background:#fdf3f1;border-radius:6px;padding:7px 9px}#tcdsg .sg46-f a,#tcdsg .sg46-f button{font:600 12.5px Inter,Helvetica,Arial,sans-serif;border-radius:5px;padding:4px 9px;margin:6px 6px 0 0;cursor:pointer;text-decoration:none;border:1px solid #3f4630;background:#fff;color:#3f4630;display:inline-block}#tcdsg .sg46-f a{background:#3f4630;color:#fff}</style>
<script>
(function(){
var K=<?php echo wp_json_encode( $cfg, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT ) ?: '{}'; ?>,w=document.getElementById('tcdsg');if(!w)return;
function e(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function post(o){var f=new FormData();f.append('action','tcd_sg46');f.append('n',K.n);for(var k in o){f.append(k,o[k]);}return fetch(K.ajax,{method:'POST',body:f,credentials:'same-origin'}).then(function(r){return r.json();});}
function avisoSmtp(){return K.smtp?'':' O correio do site ainda não está ligado ao SMTP: <a href="'+e(K.correio)+'">Ferramentas › Correio do site</a> (colar a palavra-passe da caixa). Até lá, use «Abrir no meu e-mail».';}
function topo(){var c=w.querySelector('.sg-c'),s=document.getElementById('sg-s');if(!c||!s||c.querySelector('.sg46-al')||!K.falhas)return;s.insertAdjacentHTML('afterend','<div class="sg46-al"><b>'+K.falhas+' envio(s) por e-mail falharam nas últimas 24 h</b> ('+e(K.ultima)+').'+avisoSmtp()+'</div>');}
function prio(){[].forEach.call(w.querySelectorAll('.sg-i'),function(l){var m=l.querySelectorAll('.sg-m');for(var i=0;i<m.length;i++){var t=m[i];if(!t.dataset.sg46&&/^[ABC]( · |$)/.test(t.textContent)){t.dataset.sg46='1';t.textContent='Prioridade '+t.textContent;break;}}});}
function conta(){var b=document.getElementById('tcdsg-bt');if(!b)return;var m=/\((\d+)\)/.exec(b.textContent);if(m){var n=Math.max(0,+m[1]-1);b.textContent='Sugestões ('+n+')';var s=document.getElementById('sg-s');if(s)s.textContent=s.textContent.replace(/^\d+/,n);}}
w.addEventListener('click',function(ev){
 var b=ev.target.closest('[data-a="email"],[data-a46]');if(!b||!w.contains(b))return;
 ev.preventDefault();ev.stopImmediatePropagation();ev.stopPropagation();
 var linha=b.closest('.sg-i'),id=b.dataset.id,acc=b.dataset.a46||'email';
 b.disabled=true;var tx=b.textContent;b.textContent='…';
 post({acc:acc,id:id}).then(function(j){
  var v=linha.querySelector('.sg46-f');if(v)v.remove();
  if(j&&j.success){linha.innerHTML='<div class="sg-ok">'+(acc==='marcar'?'Registado como enviado à mão':'Convite enviado por e-mail')+' ('+e(j.data.codigo)+').</div>';conta();setTimeout(function(){linha.remove();},1600);return;}
  var d=(j&&j.data)||{};b.disabled=false;b.textContent=acc==='email'?'Tentar de novo':tx;
  var h='<div class="sg46-f">'+e(d.m||'Falhou.')+(d.mailto?avisoSmtp()+'<br><a href="'+e(d.mailto)+'">Abrir no meu e-mail</a><button type="button" data-a46="marcar" data-id="'+e(id)+'">Já enviei</button><span> Código '+e(d.codigo)+'.</span>':'')+'</div>';
  linha.insertAdjacentHTML('beforeend',h);
 }).catch(function(){b.disabled=false;b.textContent=tx;linha.insertAdjacentHTML('beforeend','<div class="sg46-f">Sem resposta do site. Tente de novo.</div>');});
},true);
new MutationObserver(function(){prio();topo();}).observe(w,{childList:true,subtree:true});
prio();topo();
})();
</script>
	<?php
}, 41 );
