<?php
// Módulo 90139: contas VIP da Formiga (pedido do Nuno, 21/10/2026, 15h50: «quero alocar ao Prata 50 chamadas por dia de
// Claude no assistente dele … é muito importante que o feedback dele seja levado muito a sério»).
// Actua por cima do m90173 (Formiga), m90175 (Rede IPR) e m90182 (pedidos de melhoria), sem os alterar. Opção
// tcd_vip_contas: { e-mail => { 'limite' => 50, 'nota' => 'texto para o contexto da Formiga' } }. Para quem lá está:
//  1. a Formiga abre-se (tcd_fm_alvo), nas páginas da Rede e no Atlas, sem depender do tecto diário da Rede (120);
//  2. o limite por pessoa passa a ser o da conta (pre_option_tcd_fm_limite, prioridade 20, depois dos 12 da Rede);
//  3. a Formiga sabe quem é a pessoa e o que está a fazer (tcd_fm_sistema e tcd_fm_contexto com a nota);
//  4. cada reporte ou pedido de melhoria da pessoa fica com a meta _tcd_vip = 1 e o título começa por «Prioridade ·»,
//     para a fila de hora a hora o tratar primeiro. Sem Telegram (decisão do Nuno).
// Desligar: opção tcd_vip_off = 1. Prefixo tcd_vip_.
if ( ! defined( 'ABSPATH' ) ) { exit; }

function tcd_vip_contas() { $c = get_option( 'tcd_vip_contas', array() ); return '1' !== (string) get_option( 'tcd_vip_off', '' ) && is_array( $c ) ? array_change_key_case( $c, CASE_LOWER ) : array(); }
function tcd_vip_de( $u ) {
	$u = $u ? $u : ( is_user_logged_in() ? wp_get_current_user() : null );
	if ( ! $u || empty( $u->ID ) || empty( $u->user_email ) ) { return null; }
	$c = tcd_vip_contas(); $e = strtolower( $u->user_email );
	return isset( $c[ $e ] ) && is_array( $c[ $e ] ) ? $c[ $e ] : null;
}
function tcd_vip_eu() { return is_user_logged_in() && null !== tcd_vip_de( wp_get_current_user() ); }

// 1. Acesso à Formiga (nas páginas da Rede, no Atlas e nos pedidos ajax), por cima do tecto da Rede.
add_filter( 'tcd_fm_alvo', function ( $r, $u ) {
	if ( ! tcd_vip_de( $u ) ) { return $r; }
	if ( wp_doing_ajax() || ! did_action( 'wp' ) ) { return true; }
	if ( is_admin() ) { return $r; }
	return is_page( array( 'oficina', 'atlas', 'caderno', 'os-meus-mapas', 'ipr-cloud', 'cartografia' ) ) ? true : $r;
}, 30, 2 );

// 2. Limite diário da conta.
add_filter( 'pre_option_tcd_fm_limite', function ( $v ) {
	$c = tcd_vip_eu() ? tcd_vip_de( wp_get_current_user() ) : null;
	return $c ? max( 1, min( 500, (int) ( $c['limite'] ?? 50 ) ) ) : $v;
}, 20 );

// 3. A Formiga sabe com quem fala.
add_filter( 'tcd_fm_sistema', function ( $s, $u ) {
	$c = tcd_vip_de( $u ); if ( ! $c ) { return $s; }
	return $s . "\nEsta pessoa tem uma conta de referência: está a configurar a sua organização na IPR Cloud e a experimentar a plataforma a fundo. Ajuda-a passo a passo, com a ligação certa em cada passo, e sempre que ela mostrar dificuldade, encontrar um erro ou sentir falta de alguma coisa, propõe logo registar um pedido de melhoria (ferramenta pedir_melhoria) com as palavras dela: o feedback dela é tratado com prioridade pela equipa.";
}, 20, 2 );
add_filter( 'tcd_fm_contexto', function ( $l, $u, $sec, $pagina ) {
	$c = tcd_vip_de( $u ); if ( ! $c ) { return $l; }
	$l = (array) $l; $n = trim( (string) ( $c['nota'] ?? '' ) );
	if ( '' !== $n ) { $l[] = 'Sobre esta pessoa: ' . mb_substr( $n, 0, 600 ); }
	$l[] = 'Limite desta conta: ' . max( 1, (int) ( $c['limite'] ?? 50 ) ) . ' mensagens por dia.';
	return $l;
}, 20, 4 );

// 4. Reportes e pedidos de melhoria com prioridade (depois do m90182, que põe o rótulo da pessoa).
add_action( 'wp_insert_post', function ( $id, $post, $update ) {
	if ( $update || 'tcd_reporte' !== $post->post_type ) { return; }
	$u = get_userdata( (int) $post->post_author ); if ( ! $u || ! tcd_vip_de( $u ) ) { return; }
	update_post_meta( $id, '_tcd_vip', 1 );
	$p = get_post( $id ); $t = $p ? $p->post_title : $post->post_title;
	if ( 0 !== strpos( $t, 'Prioridade' ) ) { wp_update_post( array( 'ID' => $id, 'post_title' => mb_substr( 'Prioridade · ' . $t, 0, 140 ) ) ); }
}, 12, 3 );
