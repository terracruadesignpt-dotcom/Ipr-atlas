<?php
// Módulo 90253 · Organizações no IPR Atlas: código de convite ORG, membros com papéis e espaço de trabalho partilhado
// (pedido do Nuno, 21/10/2026, 14h43: «oferecer à Rewilding Portugal 3 meses de um plano feito à medida [...] ambiente de
// trabalho com 5 técnicos [...] até 10 mil hectares [...] o ambiente de trabalho deles, primeiro de tudo, vai ser um utilizador;
// eles vão-se juntar e configurar a área de trabalho com as ferramentas que podem ver»). Decisões por caixas (15h30):
// código de convite «organização»; o dono arruma blocos, camadas e papéis; no fim dos 3 meses passa a só leitura com proposta.
// Serve qualquer organização (rewilding, área protegida, município, cooperativa), não só uma.
//  - CPT tcd_org (sem interface própria). Meta _tcd_org: nome, slug, modelo, limites (pessoas, gb, ha, dias), início, fim,
//    estado (activa, leitura, arquivada), código, país, língua, avisos. Meta _tcd_org_membros: uid => papel e estado.
//    Usermeta tcd_org: organização da pessoa.
//  - Código ORG-XXXXXX (opção tcd_org_convites, validade 60 dias): /oficina/?org=ORG-XXXXXX. O primeiro a activar fica dono;
//    os seguintes ficam pendentes até o dono (ou um gestor) os aprovar, dentro do número de lugares. Quem entra fica Rede IPR
//    (meta tcd_rede) e tem a Oficina, a Formiga e o botão com o nome (m90175).
//  - Papéis: dono, gestor (gere pessoas e camadas), editor (carrega e desenha), leitor (só vê). Só o administrador do site
//    cria organizações e códigos (Ferramentas › Organizações).
//  - Bloco «A organização» na Oficina (filtro tcd_of_blocos do m90250): dias que faltam, pessoas, pedidos pendentes, código.
//  - Cron diário tcd_org_diario: aviso ao Nuno aos 60 e aos 80 dias; no fim, estado «leitura» (os outros módulos lêem
//    tcd_org_so_leitura) e aviso no Telegram. Nada é apagado.
//  - Filtro tcd_org_uso (gb, ha) preenchido pelo m90254 (camadas). Filtro tcd_org_modelos para mais modelos.
// Sem rotas REST novas (admin-ajax e admin-post com nonce). Interruptor: tcd_org_off = 1. Prefixo tcd_org_.
if ( ! defined( 'ABSPATH' ) ) { exit; }

function tcd_org_on() { return '1' !== (string) get_option( 'tcd_org_off', '' ); }
function tcd_org_papeis() { return array( 'dono' => 'Dono', 'gestor' => 'Gestor', 'editor' => 'Editor', 'leitor' => 'Leitor' ); }
function tcd_org_modelos() {
	return (array) apply_filters( 'tcd_org_modelos', array(
		'rewilding'  => 'Paisagem de rewilding',
		'protegida'  => 'Área protegida ou reserva',
		'municipio'  => 'Município ou freguesia',
		'cooperativa' => 'Cooperativa ou associação de produtores',
		'ong'        => 'Associação ambiental',
		'outra'      => 'Outra',
	) );
}
add_action( 'init', function () {
	register_post_type( 'tcd_org', array( 'public' => false, 'show_ui' => false, 'supports' => array( 'title' ), 'label' => 'Organizações IPR' ) );
}, 5 );

// ---------- dados ----------
function tcd_org_dados( $id ) {
	$id = (int) $id; if ( ! $id || 'tcd_org' !== get_post_type( $id ) ) { return null; }
	$d = get_post_meta( $id, '_tcd_org', true ); $d = is_array( $d ) ? $d : array();
	$d['id'] = $id; $d['nome'] = get_the_title( $id );
	$d['limites'] = array_merge( array( 'pessoas' => 5, 'gb' => 10, 'ha' => 10000, 'dias' => 90 ), (array) ( $d['limites'] ?? array() ) );
	$d['estado'] = in_array( $d['estado'] ?? '', array( 'activa', 'leitura', 'arquivada' ), true ) ? $d['estado'] : 'activa';
	if ( 'activa' === $d['estado'] && ! empty( $d['fim'] ) && (int) $d['fim'] < time() ) { $d['estado'] = 'leitura'; }
	return $d;
}
function tcd_org_guardar( $id, $d ) { unset( $d['id'], $d['nome'] ); update_post_meta( (int) $id, '_tcd_org', $d ); }
function tcd_org_membros( $id ) { $m = get_post_meta( (int) $id, '_tcd_org_membros', true ); return is_array( $m ) ? $m : array(); }
function tcd_org_de( $u = null ) {
	$u = $u ? $u : wp_get_current_user(); if ( ! $u || empty( $u->ID ) || ! tcd_org_on() ) { return 0; }
	$id = (int) get_user_meta( $u->ID, 'tcd_org', true ); if ( ! $id ) { return 0; }
	$m = tcd_org_membros( $id );
	$d = tcd_org_dados( $id ); if ( ! $d || 'arquivada' === $d['estado'] ) { return 0; } // arquivada: ninguém entra
	return isset( $m[ $u->ID ] ) && 'activo' === ( $m[ $u->ID ]['estado'] ?? '' ) ? $id : 0;
}
function tcd_org_tem_dono( $id ) { foreach ( tcd_org_membros( $id ) as $x ) { if ( 'dono' === ( $x['papel'] ?? '' ) ) { return true; } } return false; }
function tcd_org_ip_chave( $ip ) { $ip = (string) $ip; if ( strpos( $ip, ':' ) !== false ) { $ip = implode( ':', array_slice( explode( ':', $ip ), 0, 4 ) ); } return md5( $ip ); } // IPv6: /64
function tcd_org_papel( $u, $id = 0 ) { $id = $id ?: tcd_org_de( $u ); if ( ! $id ) { return ''; } $m = tcd_org_membros( $id ); return (string) ( $m[ $u->ID ]['papel'] ?? '' ); }
// o que pode: gerir (pessoas, arranjo, grupos), editar (camadas), ver.
function tcd_org_pode( $u, $o_que, $id = 0 ) {
	$p = tcd_org_papel( $u, $id ); if ( '' === $p ) { return false; }
	if ( 'ver' === $o_que ) { return true; }
	$d = tcd_org_dados( $id ?: tcd_org_de( $u ) ); if ( ! $d || 'activa' !== $d['estado'] ) { return false; } // só leitura: ninguém edita
	if ( 'gerir' === $o_que ) { return in_array( $p, array( 'dono', 'gestor' ), true ); }
	return in_array( $p, array( 'dono', 'gestor', 'editor' ), true );
}
function tcd_org_so_leitura( $id ) { $d = tcd_org_dados( $id ); return ! $d || 'activa' !== $d['estado']; }
function tcd_org_lugares( $id ) { $n = 0; foreach ( tcd_org_membros( $id ) as $m ) { if ( 'activo' === ( $m['estado'] ?? '' ) ) { $n++; } } return $n; }
function tcd_org_cod( $s ) { $c = strtoupper( preg_replace( '/[^A-Za-z0-9-]/', '', (string) $s ) ); return preg_match( '/^ORG-[A-Z0-9]{6}$/', $c ) ? $c : ''; }
function tcd_org_convite( $cod ) { $r = get_option( 'tcd_org_convites', array() ); return is_array( $r ) && isset( $r[ $cod ] ) && is_array( $r[ $cod ] ) ? $r[ $cod ] : null; }
function tcd_org_novo_codigo( $id ) {
	$r = get_option( 'tcd_org_convites', array() ); $r = is_array( $r ) ? $r : array();
	foreach ( $r as $k => $c ) { if ( (int) ( $c['org'] ?? 0 ) === (int) $id ) { unset( $r[ $k ] ); } } // um código por organização
	do { $cod = 'ORG-' . strtoupper( substr( str_replace( array( '0', 'O', 'I', '1' ), array( '2', 'A', 'J', '7' ), wp_generate_password( 8, false, false ) ), 0, 6 ) ); } while ( isset( $r[ $cod ] ) );
	$r[ $cod ] = array( 'org' => (int) $id, 'validade' => time() + 60 * DAY_IN_SECONDS, 'usos' => 0 );
	update_option( 'tcd_org_convites', $r, false );
	$d = tcd_org_dados( $id ); $d['codigo'] = $cod; tcd_org_guardar( $id, $d );
	return $cod;
}
function tcd_org_juntar( $id, $u, $papel, $estado ) {
	$m = tcd_org_membros( $id );
	$m[ $u->ID ] = array( 'papel' => $papel, 'estado' => $estado, 'desde' => current_time( 'mysql' ), 'nome' => $u->display_name );
	update_post_meta( $id, '_tcd_org_membros', $m );
	update_user_meta( $u->ID, 'tcd_org', (int) $id );
	if ( 'activo' === $estado && ! get_user_meta( $u->ID, 'tcd_rede', true ) ) { update_user_meta( $u->ID, 'tcd_rede', time() ); update_user_meta( $u->ID, 'tcd_org_rede', 1 ); } // a Rede veio pela organização: sai com ela
	do_action( 'tcd_org_juntou', $id, $u, $papel, $estado );
}
function tcd_org_dias( $d ) { return empty( $d['fim'] ) ? 0 : max( 0, (int) ceil( ( (int) $d['fim'] - time() ) / DAY_IN_SECONDS ) ); }
function tcd_org_uso( $id ) { return (array) apply_filters( 'tcd_org_uso', array( 'gb' => 0.0, 'ha' => 0.0, 'camadas' => 0 ), (int) $id ); }
function tcd_org_criar( $nome, $modelo, $lim, $pais = 'PT', $lingua = 'pt', $dono_email = '' ) {
	$id = wp_insert_post( array( 'post_type' => 'tcd_org', 'post_status' => 'private', 'post_title' => sanitize_text_field( $nome ) ) );
	if ( ! $id || is_wp_error( $id ) ) { return 0; }
	tcd_org_guardar( $id, array( 'slug' => sanitize_title( $nome ), 'modelo' => isset( tcd_org_modelos()[ $modelo ] ) ? $modelo : 'outra', 'limites' => $lim, 'inicio' => 0, 'fim' => 0, 'estado' => 'activa', 'pais' => $pais, 'lingua' => $lingua, 'avisos' => array(), 'criada' => current_time( 'mysql' ), 'dono_email' => is_email( $dono_email ) ? strtolower( $dono_email ) : '' ) );
	tcd_org_novo_codigo( $id );
	return (int) $id;
}

// ---------- activação por código: /oficina/?org=ORG-XXXXXX ----------
add_filter( 'do_shortcode_tag', function ( $out, $tag ) {
	if ( 'tcd_oficina' !== $tag || ! tcd_org_on() || empty( $_GET['org'] ) ) { return $out; } // phpcs:ignore
	$cod = tcd_org_cod( wp_unslash( $_GET['org'] ) ); $c = $cod ? tcd_org_convite( $cod ) : null; $d = $c ? tcd_org_dados( (int) $c['org'] ) : null; // phpcs:ignore
	$css = '<style>.torg{max-width:720px;margin:18px auto 10px;padding:18px 20px;border:1px solid #75834a;border-radius:10px;background:#faf8f1;font:15px/1.5 Inter,Helvetica,Arial,sans-serif;color:#2f2f2a}.torg h2{font:400 22px/1.25 Raleway,Inter,sans-serif;margin:0 0 8px}.torg ul{margin:8px 0 12px 18px;padding:0}.torg .k{font:500 11px/1 "IBM Plex Mono",monospace;letter-spacing:.12em;text-transform:uppercase;color:#b8652f}.torg input{font:inherit;padding:9px 11px;border:1px solid #cfc9b4;border-radius:6px;width:min(100%,320px)}.torg button{font:600 14px Raleway,Inter,sans-serif;background:#75834a;color:#fff;border:0;border-radius:6px;padding:10px 16px;cursor:pointer}.torg .r{margin-top:10px;font-size:14px}.torg .r.ok{color:#3f4630}.torg .r.mau{color:#9a2f1f}.torg .a{display:inline-block;margin-top:8px;background:#75834a;color:#fff;padding:9px 14px;border-radius:6px;text-decoration:none}</style>';
	$caixa = function ( $t, $p ) use ( $css ) { return $css . '<div class="torg"><p class="k">IPR Atlas</p><h2>' . esc_html( $t ) . '</h2><p>' . esc_html( $p ) . '</p></div>'; };
	if ( ! $c || ! $d ) { return $caixa( 'Convite não encontrado', 'O código da ligação não existe. Escreva-nos para info@terracruadesign.pt.' ) . $out; }
	if ( (int) $c['validade'] < time() ) { return $caixa( 'Convite caducado', 'Passaram os 60 dias. Escreva-nos para info@terracruadesign.pt e renovamos.' ) . $out; }
	if ( 'activa' !== $d['estado'] ) { return $caixa( 'Esta organização já não aceita entradas', 'O período de trabalho terminou. Escreva-nos para info@terracruadesign.pt.' ) . $out; }
	$u = wp_get_current_user(); $lug = tcd_org_lugares( $d['id'] ); $primeiro = ! tcd_org_tem_dono( $d['id'] );
	if ( $u && $u->ID && (int) get_user_meta( $u->ID, 'tcd_org', true ) === (int) $d['id'] ) { $m = tcd_org_membros( $d['id'] ); return $caixa( 'Já faz parte de ' . $d['nome'], 'activo' === ( $m[ $u->ID ]['estado'] ?? '' ) ? 'A sua Oficina está em baixo.' : 'A sua entrada está à espera de aprovação por quem gere a organização.' ) . $out; }
	$lim = $d['limites'];
	$h = $css . '<div class="torg" id="torg"><p class="k">IPR Atlas · convite de organização</p><h2>' . esc_html( $d['nome'] ) . '</h2>'
		. '<p>' . ( $primeiro ? 'Ainda não há responsável nesta organização. Se é a pessoa indicada à Terracrua Design, fica responsável pelo espaço de trabalho e aprova quem entra a seguir; caso contrário a Terracrua Design confirma primeiro.' : 'Há ' . (int) $lug . ' pessoa' . ( 1 === $lug ? '' : 's' ) . ' nesta organização. A sua entrada fica à espera de aprovação por quem a gere.' ) . '</p>'
		. '<ul><li>' . (int) $lim['pessoas'] . ' pessoas, ' . (int) $lim['gb'] . ' GB de espaço, até ' . number_format( (int) $lim['ha'], 0, ',', ' ' ) . ' ha</li><li>' . (int) $lim['dias'] . ' dias de trabalho; no fim, o espaço fica em leitura e tudo pode ser exportado</li><li>Oficina, IPR Atlas, Caderno de terreno, Formiga e carregamento de ficheiros (shapefile, KML, GPX, CSV)</li></ul>'
		. '<p>' . ( $u && $u->ID ? 'Entra com a conta com que tem sessão iniciada.' : 'Se já tem conta no IPR Atlas, <a href="' . esc_url( wp_login_url( home_url( '/oficina/?org=' . $cod ) ) ) . '">inicie sessão</a> primeiro. Se não tem, escreva o seu e-mail: criamos a conta agora e recebe um e-mail para definir a palavra-passe.' ) . '</p>'
		. '<p><input type="email" id="torg-em" placeholder="o seu e-mail" value="' . esc_attr( $u && $u->ID ? $u->user_email : '' ) . '" autocomplete="email"> <input type="text" id="torg-nm" placeholder="o seu nome" value="' . esc_attr( $u && $u->ID ? $u->display_name : '' ) . '" style="width:min(100%,220px)"> <button type="button" id="torg-b">Entrar na organização</button></p><div class="r" id="torg-r"></div></div>'
		. '<script>(function(){var b=document.getElementById("torg-b"),r=document.getElementById("torg-r");b.addEventListener("click",function(){b.disabled=true;r.className="r";r.textContent="…";var f=new FormData();f.append("action","tcd_org_activar");f.append("codigo",' . wp_json_encode( $cod ) . ');f.append("email",document.getElementById("torg-em").value);f.append("nome",document.getElementById("torg-nm").value);fetch(' . wp_json_encode( admin_url( 'admin-ajax.php' ) ) . ',{method:"POST",body:f,credentials:"same-origin"}).then(function(x){return x.json();}).then(function(j){if(j&&j.success){r.className="r ok";r.innerHTML=j.data.html;}else{r.className="r mau";r.textContent=(j&&j.data)||"Não foi possível entrar.";b.disabled=false;}}).catch(function(){r.className="r mau";r.textContent="Sem ligação. Tente de novo.";b.disabled=false;});});})();</script>';
	return $h . $out;
}, 24, 2 );

add_action( 'wp_ajax_nopriv_tcd_org_activar', 'tcd_org_activar' );
add_action( 'wp_ajax_tcd_org_activar', 'tcd_org_activar' );
function tcd_org_activar() {
	if ( ! tcd_org_on() ) { wp_send_json_error( 'Desligado.', 403 ); }
	$ip = function_exists( 'tcd_sn_ip' ) ? (string) tcd_sn_ip() : (string) ( $_SERVER['REMOTE_ADDR'] ?? '0' ); // phpcs:ignore
	$k = 'tcd_org_' . tcd_org_ip_chave( $ip ); $n = (int) get_transient( $k ); if ( $n >= 10 ) { wp_send_json_error( 'Demasiadas tentativas. Tente daqui a uma hora.', 429 ); } set_transient( $k, $n + 1, HOUR_IN_SECONDS );
	$cod = tcd_org_cod( wp_unslash( $_POST['codigo'] ?? '' ) ); $c = $cod ? tcd_org_convite( $cod ) : null; $d = $c ? tcd_org_dados( (int) $c['org'] ) : null; // phpcs:ignore
	if ( ! $c || ! $d || (int) $c['validade'] < time() || 'activa' !== $d['estado'] ) { wp_send_json_error( 'Convite inválido, caducado ou organização fechada.', 400 ); }
	$nome = sanitize_text_field( wp_unslash( $_POST['nome'] ?? '' ) ); $nova = false; // phpcs:ignore
	if ( is_user_logged_in() ) { $u = wp_get_current_user(); $em = strtolower( $u->user_email ); } // com sessão, a conta é a da sessão: o e-mail do formulário não conta
	else {
		$em = strtolower( sanitize_email( wp_unslash( $_POST['email'] ?? '' ) ) ); // phpcs:ignore
		if ( ! is_email( $em ) ) { wp_send_json_error( 'Escreva um e-mail válido.', 400 ); }
		if ( '@terracruadesign.pt' === strtolower( substr( $em, -19 ) ) ) { wp_send_json_error( 'As contas da Terracrua Design não entram em organizações de clientes.', 400 ); }
		if ( get_user_by( 'email', $em ) ) { wp_send_json_error( 'Esse e-mail já tem conta no IPR Atlas. Inicie sessão e volte a abrir esta ligação: ' . wp_login_url( home_url( '/oficina/?org=' . $cod ) ), 400 ); } // ninguém inscreve contas alheias sem sessão
		if ( ! function_exists( 'wc_create_new_customer' ) ) { wp_send_json_error( 'Não foi possível criar a conta.', 400 ); }
		$p = preg_split( '/\s+/', trim( $nome ), 2 );
		$uid = wc_create_new_customer( $em, '', '', array( 'first_name' => $p[0] ?? '', 'last_name' => $p[1] ?? '' ) );
		if ( is_wp_error( $uid ) ) { wp_send_json_error( 'Não foi possível criar a conta: ' . $uid->get_error_message(), 400 ); }
		$u = get_userdata( (int) $uid ); $nova = true;
	}
	if ( ! $u || empty( $u->ID ) ) { wp_send_json_error( 'Não foi possível criar a conta.', 400 ); }
	if ( user_can( $u, 'manage_options' ) || '@terracruadesign.pt' === strtolower( substr( $em, -19 ) ) ) { wp_send_json_error( 'As contas da Terracrua Design não entram em organizações de clientes.', 400 ); }
	$outra = (int) get_user_meta( $u->ID, 'tcd_org', true );
	if ( $outra && $outra !== (int) $d['id'] ) { wp_send_json_error( 'Esta conta já pertence a outra organização. Escreva para info@terracruadesign.pt.', 400 ); }
	$m = tcd_org_membros( $d['id'] );
	if ( isset( $m[ $u->ID ] ) ) { wp_send_json_success( array( 'html' => '<p><b>Já faz parte desta organização.</b> ' . ( 'activo' === $m[ $u->ID ]['estado'] ? 'Abra a sua Oficina.' : 'A entrada está à espera de aprovação.' ) . '</p>' ) ); }
	// Quem é o dono: o e-mail que o Nuno indicou ao criar; sem e-mail indicado, o primeiro fica «dono pendente» até o Nuno confirmar em wp-admin.
	$sem_dono = ! tcd_org_tem_dono( $d['id'] ); $de = (string) ( $d['dono_email'] ?? '' ); $papel = 'editor'; $estado = 'pendente'; $primeiro = false;
	if ( $sem_dono && '' !== $de && $em === $de ) { $papel = 'dono'; $estado = 'activo'; $primeiro = true; }
	elseif ( $sem_dono && '' === $de ) { $papel = 'dono'; $estado = 'pendente'; }
	tcd_org_juntar( $d['id'], $u, $papel, $estado );
	if ( $primeiro ) {
		$d['dono'] = (int) $u->ID; $d['inicio'] = time(); $d['fim'] = time() + (int) $d['limites']['dias'] * DAY_IN_SECONDS; tcd_org_guardar( $d['id'], $d );
		$txt = '<p><b>Entrou como responsável de ' . esc_html( $d['nome'] ) . '.</b> O período de ' . (int) $d['limites']['dias'] . ' dias começa hoje e termina a ' . esc_html( wp_date( 'j/n/Y', $d['fim'] ) ) . '.</p>';
	} elseif ( 'dono' === $papel ) { $txt = '<p><b>Pedido registado.</b> A Terracrua Design confirma-o como responsável de ' . esc_html( $d['nome'] ) . ' e avisa-o por e-mail; a partir daí o período de trabalho começa.</p>'; }
	else { $txt = '<p><b>Pedido registado.</b> Quem gere ' . esc_html( $d['nome'] ) . ' aprova a sua entrada na Oficina; depois disso vê tudo aqui.</p>'; }
	$r = get_option( 'tcd_org_convites', array() ); $r[ $cod ]['usos'] = (int) ( $r[ $cod ]['usos'] ?? 0 ) + 1; update_option( 'tcd_org_convites', $r, false );
	if ( function_exists( 'tcd_tg_enviar' ) ) { tcd_tg_enviar( 'Organização ' . esc_html( $d['nome'] ) . ': ' . esc_html( $u->display_name ) . ' (' . esc_html( $em ) . ') ' . ( $primeiro ? 'activou o código e é o dono.' : ( 'dono' === $papel ? 'pede ser o dono: confirmar em Ferramentas › Organizações IPR.' : 'pediu entrada; fica pendente.' ) ) . ( $nova ? ' Conta nova.' : '' ) ); }
	$txt .= $nova ? '<p>Criámos a sua conta: veja o e-mail para definir a palavra-passe e depois entre.</p>' : ( $primeiro ? '<p><a class="a" href="' . esc_url( home_url( '/oficina/' ) ) . '">Abrir a Oficina</a></p>' : '' );
	wp_send_json_success( array( 'html' => $txt ) );
}

// ---------- gestão pelo dono ou gestor (admin-post) ----------
function tcd_org_form( $op, $campos, $botao, $cls = '' ) {
	return '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" class="' . esc_attr( 'torg-f ' . $cls ) . '"><input type="hidden" name="action" value="tcd_org_acao"><input type="hidden" name="op" value="' . esc_attr( $op ) . '">' . wp_nonce_field( 'tcd_org', '_wpnonce', true, false ) . $campos . '<button type="submit">' . esc_html( $botao ) . '</button></form>';
}
add_action( 'admin_post_tcd_org_acao', function () {
	check_admin_referer( 'tcd_org' );
	$u = wp_get_current_user(); $id = tcd_org_de( $u );
	if ( ! $id || ! tcd_org_pode( $u, 'gerir', $id ) ) { wp_die( 'Sem acesso.' ); }
	$op = sanitize_key( $_POST['op'] ?? '' ); $alvo = (int) ( $_POST['uid'] ?? 0 ); $m = tcd_org_membros( $id ); $d = tcd_org_dados( $id ); $msg = ''; // phpcs:ignore
	if ( $alvo && isset( $m[ $alvo ] ) && $alvo !== (int) $d['dono'] ) {
		if ( 'aprovar' === $op ) {
			if ( tcd_org_lugares( $id ) >= (int) $d['limites']['pessoas'] ) { $msg = 'lugares'; }
			else { $a = get_userdata( $alvo ); if ( $a ) { tcd_org_juntar( $id, $a, $m[ $alvo ]['papel'] ?: 'editor', 'activo' ); $msg = 'aprovado'; } }
		} elseif ( 'papel' === $op ) {
			$p = sanitize_key( $_POST['papel'] ?? '' ); if ( in_array( $p, array( 'gestor', 'editor', 'leitor' ), true ) ) { $m[ $alvo ]['papel'] = $p; update_post_meta( $id, '_tcd_org_membros', $m ); $msg = 'papel'; } // phpcs:ignore
		} elseif ( 'tirar' === $op ) {
			unset( $m[ $alvo ] ); update_post_meta( $id, '_tcd_org_membros', $m ); delete_user_meta( $alvo, 'tcd_org' ); if ( get_user_meta( $alvo, 'tcd_org_rede', true ) ) { delete_user_meta( $alvo, 'tcd_rede' ); delete_user_meta( $alvo, 'tcd_org_rede' ); } $msg = 'tirado'; // a conta fica; só sai da organização (e da Rede, se entrou por ela)
		}
	}
	wp_safe_redirect( add_query_arg( 'org_msg', $msg, home_url( '/oficina/' ) ) . '#org' ); if ( ! defined( 'TCD_TESTE' ) ) { exit; }
} );

// ---------- bloco na Oficina ----------
add_filter( 'tcd_of_blocos', function ( $b ) {
	$u = wp_get_current_user(); if ( ! tcd_org_de( $u ) ) { return $b; }
	$org = tcd_org_dados( tcd_org_de( $u ) );
	$b = array( 'org' => array( 't' => $org['nome'], 'k' => 'A organização', 'f' => 'tcd_org_bloco', 'w' => 1, 'cache' => 0 ) ) + $b;
	unset( $b['clientes'], $b['montra'] ); // blocos de profissional a solo não fazem sentido numa organização
	return $b;
}, 5 );
function tcd_org_bloco( $u ) {
	$id = tcd_org_de( $u ); $d = tcd_org_dados( $id ); if ( ! $d ) { return ''; }
	$gere = tcd_org_pode( $u, 'gerir', $id ); $m = tcd_org_membros( $id ); $uso = tcd_org_uso( $id ); $lim = $d['limites']; $dias = tcd_org_dias( $d );
	$h = '<div id="org">';
	if ( 'activa' !== $d['estado'] ) { $h .= '<p class="al">O período de trabalho terminou a ' . esc_html( wp_date( 'j/n/Y', (int) $d['fim'] ) ) . '. O espaço está em leitura: pode ver e exportar tudo, mas não carregar nem alterar. Para continuar, fale connosco: info@terracruadesign.pt.</p>'; }
	else { $h .= '<p class="tof-num">' . (int) $dias . ' dia' . ( 1 === $dias ? '' : 's' ) . '</p><p class="tof-vz">até ' . esc_html( wp_date( 'j/n/Y', (int) $d['fim'] ) ) . ' · ' . esc_html( tcd_org_modelos()[ $d['modelo'] ] ?? '' ) . '</p>'; }
	$h .= '<div class="tof-med"><span>Pessoas</span><b>' . tcd_org_lugares( $id ) . ' de ' . (int) $lim['pessoas'] . '</b><div class="tof-bar"><i style="width:' . (int) min( 100, 100 * tcd_org_lugares( $id ) / max( 1, $lim['pessoas'] ) ) . '%"></i></div>'
		. '<span>Espaço</span><b>' . esc_html( number_format( (float) $uso['gb'], 2, ',', ' ' ) ) . ' de ' . (int) $lim['gb'] . ' GB</b><div class="tof-bar"><i style="width:' . (int) min( 100, 100 * (float) $uso['gb'] / max( 1, $lim['gb'] ) ) . '%"></i></div>'
		. '<span>Área</span><b>' . esc_html( number_format( (float) $uso['ha'], 0, ',', ' ' ) ) . ' de ' . esc_html( number_format( (int) $lim['ha'], 0, ',', ' ' ) ) . ' ha</b><div class="tof-bar"><i style="width:' . (int) min( 100, 100 * (float) $uso['ha'] / max( 1, $lim['ha'] ) ) . '%"></i></div></div>';
	$pap = tcd_org_papeis(); $h .= '<ul class="tof-l">';
	foreach ( $m as $uid => $x ) {
		$h .= '<li><div><b>' . esc_html( $x['nome'] ?? '' ) . '</b><br><small>' . esc_html( $pap[ $x['papel'] ] ?? $x['papel'] ) . ( 'pendente' === $x['estado'] ? ' · à espera de aprovação' : '' ) . '</small></div>';
		if ( $gere && (int) $uid !== (int) $d['dono'] && 'activa' === $d['estado'] ) {
			$h .= '<div class="torg-acc">';
			if ( 'pendente' === $x['estado'] ) { $h .= tcd_org_form( 'aprovar', '<input type="hidden" name="uid" value="' . (int) $uid . '">', 'Aprovar' ); }
			else { $sel = '<select name="papel">'; foreach ( array( 'gestor', 'editor', 'leitor' ) as $p ) { $sel .= '<option value="' . $p . '"' . selected( $p, $x['papel'], false ) . '>' . esc_html( $pap[ $p ] ) . '</option>'; } $sel .= '</select>'; $h .= tcd_org_form( 'papel', '<input type="hidden" name="uid" value="' . (int) $uid . '">' . $sel, 'Mudar' ); }
			$h .= tcd_org_form( 'tirar', '<input type="hidden" name="uid" value="' . (int) $uid . '">', 'Tirar', 's' ) . '</div>';
		}
		$h .= '</li>';
	}
	$h .= '</ul>';
	if ( $gere && 'activa' === $d['estado'] && ! empty( $d['codigo'] ) ) { $h .= '<p class="tof-vz">Para convidar alguém, envie-lhe esta ligação (fica pendente até aprovar):</p><input class="tof-url" readonly value="' . esc_attr( home_url( '/oficina/?org=' . $d['codigo'] ) ) . '" onclick="this.select()">'; }
	if ( isset( $_GET['org_msg'] ) ) { $t = array( 'aprovado' => 'Pessoa aprovada.', 'lugares' => 'Não há mais lugares. Tire alguém ou fale connosco.', 'papel' => 'Papel alterado.', 'tirado' => 'Pessoa retirada da organização.' ); $h .= '<p class="tof-vz" role="status">' . esc_html( $t[ sanitize_key( $_GET['org_msg'] ) ] ?? '' ) . '</p>'; } // phpcs:ignore
	$h .= '<style>.torg-acc{display:flex;gap:4px;flex-wrap:wrap}.torg-f{margin:0;display:inline-flex;gap:4px}.torg-f button{font:600 12px Inter,sans-serif;border:1px solid var(--ln);border-radius:8px;padding:4px 9px;background:var(--p);color:var(--ac2);cursor:pointer}.torg-f.s button{color:var(--te)}.torg-f select{font:12px Inter,sans-serif;border:1px solid var(--ln);border-radius:8px;padding:3px 6px;background:var(--p);color:var(--tx)}</style>';
	return $h . '</div>';
}
// Quem está pendente não vê a Oficina da Rede (não é Rede ainda): a página de entrada diz-lhe isso.
add_filter( 'do_shortcode_tag', function ( $out, $tag ) {
	if ( 'tcd_oficina' !== $tag || ! tcd_org_on() || ! is_user_logged_in() || ! empty( $_GET['org'] ) ) { return $out; } // phpcs:ignore
	$u = wp_get_current_user(); $id = (int) get_user_meta( $u->ID, 'tcd_org', true ); if ( ! $id || tcd_org_de( $u ) ) { return $out; }
	$m = tcd_org_membros( $id ); $d = tcd_org_dados( $id );
	if ( $d && isset( $m[ $u->ID ] ) && 'pendente' === $m[ $u->ID ]['estado'] ) { return '<div class="torg" style="max-width:720px;margin:18px auto;padding:18px 20px;border:1px solid #75834a;border-radius:10px;background:#faf8f1;font:15px/1.5 Inter,sans-serif"><p style="font:500 11px/1 \'IBM Plex Mono\',monospace;letter-spacing:.12em;text-transform:uppercase;color:#b8652f;margin:0 0 6px">IPR Atlas</p><b>' . esc_html( $d['nome'] ) . '</b>: a sua entrada está à espera de aprovação por quem gere a organização.</div>' . $out; }
	return $out;
}, 23, 2 );

// ---------- cron diário: avisos e fim do período ----------
add_action( 'init', function () { if ( tcd_org_on() && ! wp_next_scheduled( 'tcd_org_diario' ) ) { wp_schedule_event( time() + 600, 'daily', 'tcd_org_diario' ); } } );
add_action( 'tcd_org_diario', function () {
	foreach ( get_posts( array( 'post_type' => 'tcd_org', 'post_status' => 'any', 'numberposts' => 100, 'fields' => 'ids' ) ) as $id ) {
		$d = tcd_org_dados( $id ); if ( ! $d || empty( $d['fim'] ) ) { continue; }
		$meta = get_post_meta( $id, '_tcd_org', true ); $av = (array) ( $meta['avisos'] ?? array() ); $dias = tcd_org_dias( $d ); $msg = '';
		$pass = (int) floor( ( time() - (int) $d['inicio'] ) / DAY_IN_SECONDS ); $tot = (int) $d['limites']['dias'];
		foreach ( array( 60, 80 ) as $m ) { if ( $tot >= 90 && $pass >= $m && empty( $av[ $m ] ) ) { $av[ $m ] = time(); $msg = 'Organização ' . $d['nome'] . ': passaram ' . $m . ' dias; faltam ' . $dias . '. Uso: ' . number_format( tcd_org_uso( $id )['gb'], 2, ',', ' ' ) . ' GB, ' . number_format( tcd_org_uso( $id )['ha'], 0, ',', ' ' ) . ' ha, ' . tcd_org_lugares( $id ) . ' pessoas. Altura de preparar a proposta.'; } }
		if ( 'leitura' === $d['estado'] && 'activa' === ( $meta['estado'] ?? 'activa' ) ) { $meta['estado'] = 'leitura'; $msg = 'Organização ' . $d['nome'] . ': o período terminou. O espaço passou a só leitura; nada foi apagado. Enviar a proposta do plano Organização.'; }
		$meta['avisos'] = $av; update_post_meta( $id, '_tcd_org', $meta );
		if ( $msg && function_exists( 'tcd_tg_enviar' ) ) { tcd_tg_enviar( esc_html( $msg ) ); }
	}
} );

// ---------- administração (só o Nuno) ----------
add_action( 'admin_menu', function () { if ( current_user_can( 'manage_options' ) && ! get_user_meta( get_current_user_id(), 'tcd_webmaster', true ) ) { add_management_page( 'Organizações IPR', 'Organizações IPR', 'manage_options', 'tcd-org', 'tcd_org_pagina' ); } } );
function tcd_org_pagina() {
	if ( ! current_user_can( 'manage_options' ) ) { return; }
	echo '<div class="wrap"><h1>Organizações IPR</h1><p>Espaços de trabalho partilhados (Rewilding Portugal e outras). O código entra em <code>/oficina/?org=ORG-XXXXXX</code>; o dono é o e-mail indicado ao criar; sem e-mail indicado, o primeiro a activar fica pendente até ser confirmado aqui.</p>';
	if ( isset( $_GET['ok'] ) ) { echo '<div class="notice notice-success"><p>' . esc_html( sanitize_text_field( wp_unslash( $_GET['ok'] ) ) ) . '</p></div>'; } // phpcs:ignore
	echo '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '"><input type="hidden" name="action" value="tcd_org_admin"><input type="hidden" name="op" value="criar">' . wp_nonce_field( 'tcd_org_admin', '_wpnonce', true, false ) . '<table class="form-table"><tr><th>Nome</th><td><input name="nome" class="regular-text" required></td></tr><tr><th>Modelo</th><td><select name="modelo">';
	foreach ( tcd_org_modelos() as $k => $v ) { echo '<option value="' . esc_attr( $k ) . '">' . esc_html( $v ) . '</option>'; }
	echo '</select></td></tr><tr><th>Limites</th><td><input type="number" name="pessoas" value="5" min="1" max="100" style="width:70px"> pessoas · <input type="number" name="gb" value="10" min="1" max="1000" style="width:70px"> GB · <input type="number" name="ha" value="10000" min="1" max="10000000" style="width:100px"> ha · <input type="number" name="dias" value="90" min="7" max="3650" style="width:70px"> dias</td></tr><tr><th>País e língua</th><td><input name="pais" value="PT" style="width:60px"> <input name="lingua" value="pt" style="width:60px"></td></tr><tr><th>E-mail do dono</th><td><input type="email" name="dono_email" class="regular-text" placeholder="opcional: quem activa com este e-mail fica dono de imediato"></td></tr></table><p><button class="button button-primary">Criar e gerar código</button></p></form>';
	echo '<h2>Existentes</h2><table class="widefat striped"><thead><tr><th>Organização</th><th>Modelo</th><th>Estado</th><th>Período</th><th>Pessoas</th><th>Uso</th><th>Código</th><th></th></tr></thead><tbody>';
	foreach ( get_posts( array( 'post_type' => 'tcd_org', 'post_status' => 'any', 'numberposts' => 200, 'fields' => 'ids', 'orderby' => 'date', 'order' => 'DESC' ) ) as $id ) {
		$d = tcd_org_dados( $id ); if ( ! $d ) { continue; } $uso = tcd_org_uso( $id ); $c = ! empty( $d['codigo'] ) ? tcd_org_convite( $d['codigo'] ) : null; $pend_dono = null; foreach ( tcd_org_membros( $id ) as $uid => $x ) { if ( 'dono' === ( $x['papel'] ?? '' ) && 'pendente' === ( $x['estado'] ?? '' ) ) { $pend_dono = array( 'uid' => $uid, 'nome' => $x['nome'] ?? '' ); } }
		$f = function ( $op, $txt, $extra = '' ) use ( $id ) { return '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" style="display:inline"><input type="hidden" name="action" value="tcd_org_admin"><input type="hidden" name="op" value="' . esc_attr( $op ) . '"><input type="hidden" name="id" value="' . (int) $id . '">' . wp_nonce_field( 'tcd_org_admin', '_wpnonce', true, false ) . $extra . '<button class="button button-small">' . esc_html( $txt ) . '</button></form> '; };
		echo '<tr><td><b>' . esc_html( $d['nome'] ) . '</b></td><td>' . esc_html( tcd_org_modelos()[ $d['modelo'] ] ?? $d['modelo'] ) . '</td><td>' . esc_html( $d['estado'] ) . '</td><td>' . ( $d['inicio'] ? esc_html( wp_date( 'j/n/Y', (int) $d['inicio'] ) . ' a ' . wp_date( 'j/n/Y', (int) $d['fim'] ) ) : 'por activar' ) . '</td><td>' . tcd_org_lugares( $id ) . ' / ' . (int) $d['limites']['pessoas'] . '</td><td>' . esc_html( number_format( (float) $uso['gb'], 2, ',', ' ' ) ) . ' GB · ' . esc_html( number_format( (float) $uso['ha'], 0, ',', ' ' ) ) . ' ha</td><td><code>' . esc_html( $d['codigo'] ?? '' ) . '</code>' . ( $c ? '<br><small>até ' . esc_html( wp_date( 'j/n/Y', (int) $c['validade'] ) ) . ', ' . (int) $c['usos'] . ' usos</small>' : '' ) . '</td>'
			. '<td>' . ( $pend_dono ? $f( 'dono', 'Confirmar ' . $pend_dono['nome'] . ' como dono', '<input type="hidden" name="uid" value="' . (int) $pend_dono['uid'] . '">' ) : '' ) . $f( 'codigo', 'Novo código' ) . $f( 'prolongar', '+30 dias' ) . ( 'arquivada' !== $d['estado'] ? $f( 'estado', 'activa' === $d['estado'] ? 'Pôr em leitura' : 'Reactivar', '<input type="hidden" name="estado" value="' . ( 'activa' === $d['estado'] ? 'leitura' : 'activa' ) . '">' ) : '' ) . $f( 'estado', 'Arquivar', '<input type="hidden" name="estado" value="arquivada">' ) . '</td></tr>';
	}
	echo '</tbody></table><p class="description">Arquivar não apaga nada: tira a organização da Oficina dos membros. Apagar de vez é só pelo Nuno, à mão.</p></div>';
}
add_action( 'admin_post_tcd_org_admin', function () {
	check_admin_referer( 'tcd_org_admin' );
	if ( ! current_user_can( 'manage_options' ) || get_user_meta( get_current_user_id(), 'tcd_webmaster', true ) ) { wp_die( 'Sem acesso.' ); }
	$op = sanitize_key( $_POST['op'] ?? '' ); $ok = ''; // phpcs:ignore
	if ( 'criar' === $op ) {
		$lim = array( 'pessoas' => max( 1, (int) ( $_POST['pessoas'] ?? 5 ) ), 'gb' => max( 1, (int) ( $_POST['gb'] ?? 10 ) ), 'ha' => max( 1, (int) ( $_POST['ha'] ?? 10000 ) ), 'dias' => max( 7, (int) ( $_POST['dias'] ?? 90 ) ) ); // phpcs:ignore
		$id = tcd_org_criar( sanitize_text_field( wp_unslash( $_POST['nome'] ?? '' ) ), sanitize_key( $_POST['modelo'] ?? 'outra' ), $lim, strtoupper( substr( sanitize_text_field( wp_unslash( $_POST['pais'] ?? 'PT' ) ), 0, 2 ) ), strtolower( substr( sanitize_key( $_POST['lingua'] ?? 'pt' ), 0, 2 ) ), sanitize_email( wp_unslash( $_POST['dono_email'] ?? '' ) ) ); // phpcs:ignore
		$ok = $id ? 'Organização criada. Código: ' . tcd_org_dados( $id )['codigo'] : 'Não foi possível criar.';
	} else {
		$id = (int) ( $_POST['id'] ?? 0 ); $d = tcd_org_dados( $id ); // phpcs:ignore
		if ( $d ) {
			if ( 'codigo' === $op ) { $ok = 'Novo código: ' . tcd_org_novo_codigo( $id ); }
			elseif ( 'dono' === $op ) { $uid = (int) ( $_POST['uid'] ?? 0 ); $m = tcd_org_membros( $id ); $a = $uid ? get_userdata( $uid ) : null; if ( $a && isset( $m[ $uid ] ) && 'dono' === $m[ $uid ]['papel'] && ! $d['inicio'] ) { tcd_org_juntar( $id, $a, 'dono', 'activo' ); $d['dono'] = $uid; $d['inicio'] = time(); $d['fim'] = time() + (int) $d['limites']['dias'] * DAY_IN_SECONDS; tcd_org_guardar( $id, $d ); wp_mail( $a->user_email, 'IPR Atlas: é o responsável de ' . $d['nome'], "Olá,\n\nConfirmámos a sua conta como responsável do espaço de trabalho de " . $d['nome'] . " no IPR Atlas. O período de " . (int) $d['limites']['dias'] . " dias começa hoje.\n\nAbra a Oficina: " . home_url( '/oficina/' ) . "\n\nTerracrua Design" ); $ok = 'Dono confirmado: ' . $a->display_name . '. Período iniciado.'; } else { $ok = 'Não foi possível confirmar o dono.'; } } // phpcs:ignore
			elseif ( 'prolongar' === $op ) { $m = get_post_meta( $id, '_tcd_org', true ); $m['fim'] = max( (int) ( $m['fim'] ?? 0 ), time() ) + 30 * DAY_IN_SECONDS; if ( 'leitura' === ( $m['estado'] ?? '' ) ) { $m['estado'] = 'activa'; } update_post_meta( $id, '_tcd_org', $m ); $ok = 'Prolongada até ' . wp_date( 'j/n/Y', (int) $m['fim'] ) . '.'; }
			elseif ( 'estado' === $op ) { $e = sanitize_key( $_POST['estado'] ?? '' ); if ( in_array( $e, array( 'activa', 'leitura', 'arquivada' ), true ) ) { $m = get_post_meta( $id, '_tcd_org', true ); $m['estado'] = $e; if ( 'activa' === $e && (int) ( $m['fim'] ?? 0 ) < time() ) { $m['fim'] = time() + 30 * DAY_IN_SECONDS; } update_post_meta( $id, '_tcd_org', $m ); $ok = 'Estado: ' . $e . '.'; } } // phpcs:ignore
		}
	}
	wp_safe_redirect( add_query_arg( 'ok', rawurlencode( $ok ), admin_url( 'tools.php?page=tcd-org' ) ) ); if ( ! defined( 'TCD_TESTE' ) ) { exit; }
} );
