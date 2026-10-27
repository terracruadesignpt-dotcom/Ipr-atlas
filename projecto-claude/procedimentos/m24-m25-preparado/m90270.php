<?php
// Módulo 90270: «Susana vê tudo» (M25 E-1, decisão do Nuno, 21/10/2026).
// A Susana (conta #4, susana@terracruadesign.pt, papel «socio») vê o que a Direcção vê: pedidos, imóveis e Azenhas e
// Castelos, clientes e valores (áreas do m90016), Núcleo e Incidências só para ler, e aprova contas e acessos (Equipa:
// assistentes, Papéis e grupos, Estagiários). Publicar código, ligar ou desligar módulos e tudo o que tenha chaves
// continua só com o Nuno.
// Sem mexer no papel dela (as caixas do Estúdio ficam como estão) nem no tcd_eq_todas() (m90016).
// Como: lista de contas na opção tcd_vt_contas (id => e-mail; por omissão 4 => susana@terracruadesign.pt). A conta só
// conta se o e-mail ainda for esse e for da equipa. O «manage_options» só é dado em tools.php com uma das páginas da lista
// (pedidos GET) e no admin-post.php com uma das acções de aprovação; nunca na REST, no admin-ajax nem no admin_init.
// Nota: falta impor os dois passos (2FA) a estas contas, como no m90164; fica para o Nuno decidir.
// Guardas: nunca muda a conta do Nuno (#1) nem de administradores, nunca dá «direccao» nem «administrator».
// Interruptor: opção tcd_vt_off = 1. Prefixo tcd_vtudo_.
if ( ! defined( 'ABSPATH' ) ) { exit; }

function tcd_vtudo_on() { return '1' !== (string) get_option( 'tcd_vt_off', '' ); }

// A conta tem «vê tudo»? Id na lista, e-mail igual ao registado e conta da equipa. Nunca administradores (já vêem).
function tcd_vtudo_e( $u = null ) {
	if ( ! tcd_vtudo_on() ) { return false; }
	$u = $u ? $u : ( function_exists( 'wp_get_current_user' ) ? wp_get_current_user() : null );
	if ( is_numeric( $u ) ) { $u = get_userdata( (int) $u ); }
	if ( ! $u || empty( $u->ID ) ) { return false; }
	$l = get_option( 'tcd_vt_contas', array( 4 => 'susana@terracruadesign.pt' ) );
	$l = is_array( $l ) ? $l : array();
	$mail = strtolower( trim( (string) ( $l[ (int) $u->ID ] ?? '' ) ) );
	if ( '' === $mail || strtolower( (string) $u->user_email ) !== $mail ) { return false; }
	return '@terracruadesign.pt' === substr( $mail, -19 );
}

// Ecrãs do wp-admin: só para ler (GET) e para aprovar contas e acessos (GET e as acções da lista).
function tcd_vtudo_ler() { return array( 'terracrua-nucleo', 'tcd-incidencias', 'tcd-pedidos-eq', 'tcd-metricas' ); }
function tcd_vtudo_aprovar() { return array( 'tcd-eq-cartas', 'tcd-papeis', 'tcd-estagiarios' ); }
function tcd_vtudo_acoes() { return array( 'tcd_eq_carta', 'tcd_pg_guardar', 'tcd_est_renovar', 'tcd_est_suspender' ); }

function tcd_vtudo_contexto() {
	global $pagenow;
	if ( ! is_admin() || ( function_exists( 'wp_doing_ajax' ) && wp_doing_ajax() ) || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) { return false; }
	if ( function_exists( 'doing_action' ) && doing_action( 'admin_init' ) ) { return false; } // tarefas únicas de outros módulos
	$met = strtoupper( (string) ( $_SERVER['REQUEST_METHOD'] ?? 'GET' ) );
	if ( 'tools.php' === $pagenow ) {
		$pg = isset( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : ''; // phpcs:ignore
		if ( in_array( $pg, tcd_vtudo_aprovar(), true ) ) { return 'GET' === $met; }
		return 'GET' === $met && in_array( $pg, tcd_vtudo_ler(), true );
	}
	if ( 'admin-post.php' === $pagenow && 'POST' === $met ) {
		$a = sanitize_key( wp_unslash( $_REQUEST['action'] ?? '' ) ); // phpcs:ignore
		return in_array( $a, tcd_vtudo_acoes(), true );
	}
	return false;
}

add_filter( 'user_has_cap', function ( $tem, $pedidas, $args, $user ) {
	if ( ! $user || empty( $user->ID ) || ! empty( $tem['manage_options'] ) || ! tcd_vtudo_e( $user ) ) { return $tem; }
	foreach ( tcd_vtudo_nunca() as $c ) { $tem[ $c ] = false; }
	if ( is_admin() ) { $tem['view_admin_dashboard'] = true; } // o WooCommerce deixa entrar no wp-admin
	if ( in_array( 'manage_options', (array) $pedidas, true ) && tcd_vtudo_contexto() ) { $tem['manage_options'] = true; }
	return $tem;
}, 98, 4 );

// Fechado sempre para estas contas (nunca contas WordPress, papéis WordPress, plugins, temas nem ficheiros).
function tcd_vtudo_nunca() { return array( 'create_users', 'edit_users', 'promote_users', 'delete_users', 'remove_users', 'install_plugins', 'activate_plugins', 'edit_plugins', 'delete_plugins', 'update_plugins', 'install_themes', 'switch_themes', 'edit_themes', 'delete_themes', 'update_themes', 'update_core', 'edit_files', 'unfiltered_upload', 'unfiltered_html', 'export', 'import', 'manage_network' ); }
add_filter( 'editable_roles', function ( $r ) { if ( tcd_vtudo_e() ) { unset( $r['administrator'] ); } return $r; } );

// Guardas (decisão do Nuno, 21/10): a conta do Nuno (#1), as de administradores e, nos ecrãs emprestados, a dela própria
// não mudam por ela; nunca dá o papel «direccao» nem «administrator». Corta na escrita da meta, qualquer que seja o caminho.
function tcd_vtudo_fixo( $uid, $ctx = true ) {
	$uid = (int) $uid; $x = $uid ? get_userdata( $uid ) : null;
	return 1 === $uid || ( $x && in_array( 'administrator', (array) ( $x->roles ?? array() ), true ) ) || ( $ctx && $uid && get_current_user_id() === $uid && tcd_vtudo_contexto() );
}
function tcd_vtudo_meta( $chk, $uid, $k, $v = '' ) {
	if ( null !== $chk || ! tcd_vtudo_e() ) { return $chk; }
	$k = (string) $k; $cap = 'capabilities' === substr( $k, -12 ) || 'user_level' === substr( $k, -10 );
	if ( $cap && ( ( is_array( $v ) && ! empty( $v['administrator'] ) ) || ( is_string( $v ) && false !== strpos( $v, 'administrator' ) ) ) ) { return false; }
	if ( ( $cap || in_array( $k, array( 'tcd_papel', 'tcd_eq_prefs', 'tcd_eq_carta', 'tcd_estagio_ate' ), true ) ) && tcd_vtudo_fixo( $uid ) ) { return false; }
	if ( 'tcd_papel' === $k && 'direccao' === $v && 'direccao' !== (string) get_user_meta( (int) $uid, 'tcd_papel', true ) ) { return false; }
	return $chk;
}
foreach ( array( 'update', 'add', 'delete' ) as $o ) { add_filter( $o . '_user_metadata', 'tcd_vtudo_meta', 1, 4 ); }
// Grupos e parceiros (m90055): a pertença das contas fixas fica como estava.
add_filter( 'pre_update_option_tcd_grupos', function ( $n, $o ) {
	if ( ! tcd_vtudo_e() || ! is_array( $n ) ) { return $n; }
	foreach ( $n as $k => $g ) {
		if ( ! is_array( $g ) || ! isset( $g['membros'] ) ) { continue; }
		$om = array_map( 'intval', (array) ( $o[ $k ]['membros'] ?? array() ) ); $m = array();
		foreach ( array_map( 'intval', (array) $g['membros'] ) as $id ) { if ( ! tcd_vtudo_fixo( $id ) ) { $m[] = $id; } }
		foreach ( $om as $id ) { if ( tcd_vtudo_fixo( $id ) ) { $m[] = $id; } }
		$n[ $k ]['membros'] = array_values( array_unique( $m ) );
	}
	return $n;
}, 1, 2 );
add_filter( 'pre_update_option_tcd_parceiros', function ( $n, $o ) {
	if ( ! tcd_vtudo_e() || ! is_array( $n ) ) { return $n; }
	foreach ( array_keys( $n ) as $id ) { if ( tcd_vtudo_fixo( $id ) && ! isset( ( (array) $o )[ $id ] ) ) { unset( $n[ $id ] ); } }
	return $n;
}, 1, 2 );
// Acções com conta-alvo (carta, estagiários): parar antes de escrever ou de mandar e-mails.
foreach ( tcd_vtudo_acoes() as $a ) {
	add_action( 'admin_post_' . $a, function () {
		if ( tcd_vtudo_e() && tcd_vtudo_fixo( absint( $_POST['u'] ?? 0 ) ) ) { wp_die( 'Esta conta só o Nuno muda.' ); } // phpcs:ignore
	}, 1 );
}

// As áreas do m90016 (pedidos, imóveis, clientes) sem mexer na meta guardada: só na leitura.
add_filter( 'get_user_metadata', function ( $v, $uid, $chave, $unico ) {
	static $dentro = false;
	if ( 'tcd_eq_prefs' !== $chave || $dentro || ! tcd_vtudo_on() ) { return $v; }
	$dentro = true;
	$ok = tcd_vtudo_e( (int) $uid );
	$p = $ok ? get_user_meta( (int) $uid, 'tcd_eq_prefs', true ) : null;
	$dentro = false;
	if ( ! $ok || ! is_array( $p ) ) { return $v; } // sem meta, o m90016 já dá as três áreas
	$p['areas'] = array_values( array_unique( array_merge( (array) ( $p['areas'] ?? array() ), array( 'pedidos', 'imoveis', 'clientes' ) ) ) );
	return array( $p );
}, 10, 4 );

// Fichas de clientes e valores: o m90055 já as dá ao Sócio. Azenhas e Castelos (m90271) pergunta por este filtro.
add_filter( 'tcd_acn_pode', function ( $pode, $u ) { return $pode || tcd_vtudo_e( $u ); }, 10, 2 );

// Uma linha no Estúdio dela, com os atalhos (as caixas não mudam).
add_filter( 'tcd_estudio_mensagens', function ( $h ) {
	if ( ! tcd_vtudo_e() ) { return $h; }
	$l = array( 'Núcleo' => 'terracrua-nucleo', 'Incidências' => 'tcd-incidencias', 'Contas novas' => 'tcd-eq-cartas', 'Papéis e acessos' => 'tcd-papeis', 'Estagiários' => 'tcd-estagiarios' );
	$a = array();
	foreach ( $l as $t => $pg ) { $a[] = '<a href="' . esc_url( admin_url( 'tools.php?page=' . $pg ) ) . '">' . esc_html( $t ) . '</a>'; }
	$a[] = '<a href="' . esc_url( home_url( '/administracao/' ) ) . '">Administração</a>';
	return '<p class="tce-m tcd-vtudo"><b>Vês tudo o que o Nuno vê.</b> Aprovas contas e acessos; as publicações de código ficam com o Nuno.<br>' . implode( ' · ', $a ) . '</p>' . $h;
} );

// Aviso no topo dos ecrãs do wp-admin abertos por ela.
add_action( 'admin_notices', function () {
	if ( ! tcd_vtudo_e() ) { return; }
	$pg = isset( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : ''; // phpcs:ignore
	if ( in_array( $pg, tcd_vtudo_ler(), true ) ) { echo '<div class="notice notice-info"><p>Só para ver. Ligar, desligar e publicar código fica com o Nuno.</p></div>'; }
} );
