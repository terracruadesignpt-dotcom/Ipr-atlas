<?php
error_reporting( E_ALL ); set_error_handler( function ( $n, $s, $f, $l ) { echo "  AVISO PHP: $s ($l)\n"; $GLOBALS["KO"]++; return true; } );
// ---------- stubs mínimos do WordPress (só para este teste local; nada toca no site) ----------
define( 'ABSPATH', __DIR__ . '/' );
define( 'DAY_IN_SECONDS', 86400 );
$GLOBALS['F'] = array(); $GLOBALS['OPT'] = array(); $GLOBALS['UM'] = array(); $GLOBALS['PM'] = array(); $GLOBALS['POSTS'] = array(); $GLOBALS['ROUTES'] = array();
$GLOBALS['CUR'] = 0; $GLOBALS['DOING'] = array(); $GLOBALS['pagenow'] = 'index.php'; $GLOBALS['IS_ADMIN'] = false; $GLOBALS['SC'] = array();
function add_filter( $h, $cb, $p = 10, $n = 1 ) { $GLOBALS['F'][ $h ][ $p ][] = array( $cb, $n ); return true; }
function add_action( $h, $cb, $p = 10, $n = 1 ) { return add_filter( $h, $cb, $p, $n ); }
function apply_filters( $h, $v, ...$a ) { if ( empty( $GLOBALS['F'][ $h ] ) ) { return $v; } ksort( $GLOBALS['F'][ $h ] ); $GLOBALS['DOING'][] = $h; foreach ( $GLOBALS['F'][ $h ] as $l ) { foreach ( $l as $x ) { $v = call_user_func_array( $x[0], array_slice( array_merge( array( $v ), $a ), 0, $x[1] ) ); } } array_pop( $GLOBALS['DOING'] ); return $v; }
function do_action( $h, ...$a ) { if ( empty( $GLOBALS['F'][ $h ] ) ) { return; } ksort( $GLOBALS['F'][ $h ] ); $GLOBALS['DOING'][] = $h; foreach ( $GLOBALS['F'][ $h ] as $l ) { foreach ( $l as $x ) { call_user_func_array( $x[0], array_slice( $a, 0, $x[1] ) ); } } array_pop( $GLOBALS['DOING'] ); }
function doing_action( $h ) { return in_array( $h, $GLOBALS['DOING'], true ); }
function get_option( $k, $d = false ) { return array_key_exists( $k, $GLOBALS['OPT'] ) ? $GLOBALS['OPT'][ $k ] : $d; }
function is_admin() { return $GLOBALS['IS_ADMIN']; }
function wp_doing_ajax() { return 'admin-ajax.php' === $GLOBALS['pagenow']; }
function sanitize_key( $k ) { return preg_replace( '/[^a-z0-9_\-]/', '', strtolower( (string) $k ) ); }
function wp_unslash( $v ) { return $v; }
function sanitize_text_field( $s ) { return trim( preg_replace( '/[\r\n\t ]+/', ' ', strip_tags( (string) $s ) ) ); }
function sanitize_email( $s ) { return filter_var( $s, FILTER_VALIDATE_EMAIL ) ? $s : ''; }
function absint( $v ) { return abs( (int) $v ); }
function esc_html( $s ) { return htmlspecialchars( (string) $s, ENT_QUOTES ); }
function esc_attr( $s ) { return esc_html( $s ); }
function esc_url( $s ) { return (string) $s; }
function esc_url_raw( $s ) { return (string) $s; }
function admin_url( $p = '' ) { return 'https://x/wp-admin/' . $p; }
function home_url( $p = '' ) { return 'https://x' . $p; }
function rest_url( $p = '' ) { return 'https://x/wp-json/' . $p; }
function wp_create_nonce() { return 'n'; }
function wp_json_encode( $v ) { return json_encode( $v ); }
function current_time( $f ) { return 'mysql' === $f ? '2026-10-21 22:00:00' : gmdate( $f, strtotime( '2026-10-21' ) ); }
class U { public $ID; public $user_email; public $display_name; public $caps; public $roles = array(); function __construct( $i, $e, $n, $c = array(), $r = array() ) { $this->ID = $i; $this->user_email = $e; $this->display_name = $n; $this->caps = $c; $this->roles = $r; } }
$GLOBALS['USERS'] = array(
	1 => new U( 1, 'nuno@terracruadesign.pt', 'Nuno', array( 'manage_options' => true ), array( 'administrator' ) ),
	5 => new U( 5, 'outro.admin@terracruadesign.pt', 'Outro admin', array( 'manage_options' => true ), array( 'administrator' ) ),
	4 => new U( 4, 'susana@terracruadesign.pt', 'Susana' ),
	188 => new U( 188, 'lotte@terracruadesign.pt', 'Lotte' ),
	191 => new U( 191, 'bolito@terracruadesign.pt', 'Pedro Bolito' ),
	200 => new U( 200, 'neo@terracruadesign.pt', 'Neo' ),
	201 => new U( 201, 'ana@terracruadesign.pt', 'Ana' ),
	300 => new U( 300, 'cliente@gmail.com', 'Cliente' ),
);
function get_userdata( $id ) { return $GLOBALS['USERS'][ (int) $id ] ?? false; }
function wp_get_current_user() { return get_userdata( $GLOBALS['CUR'] ) ?: new U( 0, '', '' ); }
function get_current_user_id() { return (int) $GLOBALS['CUR']; }
function is_user_logged_in() { return $GLOBALS['CUR'] > 0; }
function user_can( $u, $cap ) { $u = is_object( $u ) ? $u : get_userdata( $u ); if ( ! $u ) { return false; } $t = apply_filters( 'user_has_cap', $u->caps, array( $cap ), array( $cap, $u->ID ), $u ); return ! empty( $t[ $cap ] ); }
function current_user_can( $cap ) { return user_can( wp_get_current_user(), $cap ); }
function get_user_meta( $id, $k, $single = false ) {
	$c = apply_filters( 'get_user_metadata', null, $id, $k, $single, 'user' );
	if ( null !== $c ) { return $single && is_array( $c ) ? $c[0] : $c; }
	return $GLOBALS['UM'][ $id ][ $k ] ?? ( $single ? '' : array() );
}
function update_user_meta( $id, $k, $v ) { $c = apply_filters( 'update_user_metadata', null, $id, $k, $v, '' ); if ( null !== $c ) { return (bool) $c; } $GLOBALS['UM'][ $id ][ $k ] = $v; return true; }
function delete_user_meta( $id, $k, $v = '' ) { $c = apply_filters( 'delete_user_metadata', null, $id, $k, $v, false ); if ( null !== $c ) { return (bool) $c; } unset( $GLOBALS['UM'][ $id ][ $k ] ); return true; }
function update_option( $k, $v ) { $v = apply_filters( 'pre_update_option_' . $k, $v, get_option( $k ), $k ); $GLOBALS['OPT'][ $k ] = $v; return true; }
class Morreu extends Exception {}
function wp_die( $m = '' ) { throw new Morreu( (string) $m ); }
// O essencial do m90016 e do m90055 (cópia da lógica de produção).
function tcd_eq_e_equipa( $u = null ) { $u = $u ? $u : wp_get_current_user(); if ( ! $u || ! $u->ID ) { return false; } return '@terracruadesign.pt' === strtolower( substr( (string) $u->user_email, -19 ) ) || user_can( $u, 'manage_options' ); }
function tcd_eq_todas( $u ) { return user_can( $u, 'manage_options' ) || 0 === strpos( strtolower( (string) $u->user_email ), 'nuno@' ); }
function tcd_eq_prefs( $u ) {
	if ( tcd_eq_todas( $u ) ) { return array( 'areas' => array( 'pedidos', 'imoveis', 'clientes' ), 'aprovada' => true ); }
	$p = get_user_meta( $u->ID, 'tcd_eq_prefs', true ); $p = is_array( $p ) ? $p : array();
	$p['aprovada'] = true; if ( ! isset( $p['areas'] ) ) { $p['areas'] = array( 'pedidos', 'imoveis', 'clientes' ); }
	return $p;
}
function tcd_eq_pode( $area, $u = null ) { $u = $u ? $u : wp_get_current_user(); if ( ! tcd_eq_e_equipa( $u ) ) { return false; } if ( tcd_eq_todas( $u ) ) { return true; } $p = tcd_eq_prefs( $u ); return ! empty( $p['aprovada'] ) && in_array( $area, (array) $p['areas'], true ); }
function tcd_pg_papel( $u = null ) { $u = $u ? $u : wp_get_current_user(); if ( ! $u || ! $u->ID || ! tcd_eq_e_equipa( $u ) ) { return ''; } if ( user_can( $u, 'manage_options' ) ) { return 'direccao'; } return (string) ( $GLOBALS['UM'][ $u->ID ]['tcd_papel'] ?? 'equipa' ); }
$GLOBALS['UM'][4]['tcd_papel'] = 'socio'; $GLOBALS['UM'][188]['tcd_papel'] = 'imobiliario'; $GLOBALS['UM'][191]['tcd_papel'] = 'web'; $GLOBALS['UM'][200]['tcd_papel'] = 'aprendiz'; $GLOBALS['UM'][201]['tcd_papel'] = 'desenho';
$GLOBALS['UM'][4]['tcd_eq_prefs'] = array( 'areas' => array( 'pedidos' ), 'funcao' => 'Gestão' ); // a Susana sem «imoveis» guardado
$GLOBALS['OK'] = 0; $GLOBALS['KO'] = 0;
function ver( $nome, $cond ) { if ( $cond ) { $GLOBALS['OK']++; echo "  ok  $nome\n"; } else { $GLOBALS['KO']++; echo "  FALHA  $nome\n"; } }
function como( $id ) { $GLOBALS['CUR'] = $id; }
function contexto( $pagenow, $admin, $metodo = 'GET', $get = array(), $req = array() ) { $GLOBALS['pagenow'] = $pagenow; $GLOBALS['IS_ADMIN'] = $admin; $_SERVER['REQUEST_METHOD'] = $metodo; $_GET = $get; $_REQUEST = $req; }
// ---------- fim dos stubs ----------
// Teste local do m90270 («Susana vê tudo»). Correr: php teste_m90270.php (com o m90270.php na mesma pasta).
include __DIR__ . '/m90270.php';

echo "Quem tem «vê tudo»\n";
ver( 'Susana (#4) sim', tcd_vtudo_e( get_userdata( 4 ) ) );
foreach ( array( 1 => 'Nuno (já é administrador)', 5 => 'outro administrador', 188 => 'Lotte', 191 => 'Web (Bolito)', 200 => 'Aprendiz (Neo)', 300 => 'Cliente' ) as $i => $n ) { ver( "$n não", ! tcd_vtudo_e( get_userdata( $i ) ) ); }

echo "Áreas do m90016 (sem mexer na meta guardada)\n";
como( 4 ); contexto( 'index.php', false );
ver( 'Susana abre imóveis', tcd_eq_pode( 'imoveis' ) );
ver( 'Susana abre clientes', tcd_eq_pode( 'clientes' ) );
ver( 'meta guardada continua só com pedidos', array( 'pedidos' ) === $GLOBALS['UM'][4]['tcd_eq_prefs']['areas'] );
ver( 'papel continua socio (caixas do Estúdio iguais)', 'socio' === tcd_pg_papel( get_userdata( 4 ) ) );

echo "wp-admin: ler e aprovar\n";
contexto( 'tools.php', true, 'GET', array( 'page' => 'tcd-incidencias' ) ); ver( 'Incidências (GET) sim', current_user_can( 'manage_options' ) );
contexto( 'tools.php', true, 'GET', array( 'page' => 'terracrua-nucleo' ) ); ver( 'Núcleo para ler (GET) sim', current_user_can( 'manage_options' ) );
contexto( 'tools.php', true, 'POST', array( 'page' => 'terracrua-nucleo' ) ); ver( 'Núcleo por POST não', ! current_user_can( 'manage_options' ) );
contexto( 'tools.php', true, 'GET', array( 'page' => 'tcd-papeis' ) ); ver( 'Papéis e grupos sim', current_user_can( 'manage_options' ) );
contexto( 'admin-post.php', true, 'POST', array(), array( 'action' => 'tcd_pg_guardar' ) ); ver( 'guardar papéis e acessos sim', current_user_can( 'manage_options' ) );
contexto( 'admin-post.php', true, 'POST', array(), array( 'action' => 'tcd_eq_carta' ) ); ver( 'aprovar conta nova (carta) sim', current_user_can( 'manage_options' ) );
contexto( 'admin-post.php', true, 'POST', array(), array( 'action' => 'tcn_acao' ) ); ver( 'ligar/desligar módulos não', ! current_user_can( 'manage_options' ) );
contexto( 'admin-post.php', true, 'POST', array(), array( 'action' => 'tcd_tg' ) ); ver( 'Telegram (token) não', ! current_user_can( 'manage_options' ) );
contexto( 'tools.php', true, 'GET', array( 'page' => 'tcd-telegram' ) ); ver( 'ecrã Telegram não', ! current_user_can( 'manage_options' ) );
contexto( 'tools.php', true, 'GET', array( 'page' => 'tcd-copias' ) ); ver( 'Cópias do código não', ! current_user_can( 'manage_options' ) );
contexto( 'options-general.php', true ); ver( 'Definições gerais não', ! current_user_can( 'manage_options' ) );
contexto( 'admin-ajax.php', true, 'POST', array( 'page' => 'tcd-papeis' ) ); ver( 'admin-ajax não', ! current_user_can( 'manage_options' ) );
contexto( 'tools.php', true, 'GET', array( 'page' => 'tcd-papeis' ) ); $r = null;
add_action( 'admin_init', function () use ( &$r ) { $r = current_user_can( 'manage_options' ); } ); do_action( 'admin_init' ); ver( 'durante o admin_init não', false === $r );

echo "Guardas novas (revisão independente): conta do Nuno, «direccao» e administrador\n";
como( 4 ); contexto( 'admin-post.php', true, 'POST', array(), array( 'action' => 'tcd_pg_guardar' ) );
$GLOBALS['UM'][1]['tcd_papel'] = 'direccao'; $GLOBALS['UM'][188]['tcd_papel'] = 'imobiliario';
ver( 'não muda o papel do Nuno (#1)', false === update_user_meta( 1, 'tcd_papel', 'aprendiz' ) && 'direccao' === $GLOBALS['UM'][1]['tcd_papel'] );
ver( 'não apaga o papel do Nuno', false === delete_user_meta( 1, 'tcd_papel' ) && isset( $GLOBALS['UM'][1]['tcd_papel'] ) );
ver( 'não muda as áreas nem a carta do Nuno', false === update_user_meta( 1, 'tcd_eq_prefs', array( 'perfil' => 'aprendiz' ) ) && false === update_user_meta( 1, 'tcd_eq_carta', array() ) );
ver( 'não muda o papel WordPress do Nuno', false === update_user_meta( 1, 'wp_capabilities', array( 'subscriber' => true ) ) );
ver( 'não mexe noutro administrador (#5)', false === update_user_meta( 5, 'tcd_papel', 'web' ) );
ver( 'não dá «direccao» à Lotte', false === update_user_meta( 188, 'tcd_papel', 'direccao' ) && 'imobiliario' === $GLOBALS['UM'][188]['tcd_papel'] );
ver( 'não se dá «direccao» a si própria', false === update_user_meta( 4, 'tcd_papel', 'direccao' ) && 'socio' === $GLOBALS['UM'][4]['tcd_papel'] );
ver( 'nos ecrãs emprestados não muda o próprio papel', false === update_user_meta( 4, 'tcd_papel', 'coordenacao' ) && 'socio' === $GLOBALS['UM'][4]['tcd_papel'] );
ver( 'não dá «administrator» (meta de papéis WordPress)', false === update_user_meta( 188, 'wp_capabilities', array( 'administrator' => true ) ) );
ver( 'muda o papel de outra pessoa (aprova acessos)', true === update_user_meta( 188, 'tcd_papel', 'coordenacao' ) && 'coordenacao' === $GLOBALS['UM'][188]['tcd_papel'] );
ver( 'aprova a carta de outra pessoa', true === update_user_meta( 201, 'tcd_eq_carta', array( 'aprovada' => true ) ) );
$GLOBALS['OPT']['tcd_grupos'] = array( 'obra' => array( 'nome' => 'Obra', 'membros' => array( 1, 201 ) ), 'loja' => array( 'nome' => 'Loja', 'membros' => array() ) );
update_option( 'tcd_grupos', array( 'obra' => array( 'nome' => 'Obra', 'membros' => array( 201, 188 ) ), 'loja' => array( 'nome' => 'Loja', 'membros' => array( 1, 4 ) ) ) );
ver( 'grupos: o Nuno fica onde estava', in_array( 1, $GLOBALS['OPT']['tcd_grupos']['obra']['membros'], true ) && ! in_array( 1, $GLOBALS['OPT']['tcd_grupos']['loja']['membros'], true ) );
ver( 'grupos: ela não se junta a si própria', ! in_array( 4, $GLOBALS['OPT']['tcd_grupos']['loja']['membros'], true ) );
ver( 'grupos: as outras mudanças ficam', in_array( 188, $GLOBALS['OPT']['tcd_grupos']['obra']['membros'], true ) );
$GLOBALS['OPT']['tcd_parceiros'] = array(); update_option( 'tcd_parceiros', array( 1 => array( 'aprovado' => true ), 300 => array( 'aprovado' => true ) ) );
ver( 'parceiros: não põe o Nuno como parceiro', ! isset( $GLOBALS['OPT']['tcd_parceiros'][1] ) && isset( $GLOBALS['OPT']['tcd_parceiros'][300] ) );
$ed = apply_filters( 'editable_roles', array( 'administrator' => 1, 'editor' => 1, 'subscriber' => 1 ) ); ver( 'lista de papéis WordPress sem administrador', ! isset( $ed['administrator'] ) && isset( $ed['subscriber'] ) );
ver( 'nunca promote_users nem edit_users', ! current_user_can( 'promote_users' ) && ! current_user_can( 'edit_users' ) && ! current_user_can( 'create_users' ) );
foreach ( array( 'tcd_eq_carta' => 1, 'tcd_est_renovar' => 5, 'tcd_est_suspender' => 4 ) as $ac => $alvo ) {
	contexto( 'admin-post.php', true, 'POST', array(), array( 'action' => $ac ) ); $_POST = array( 'u' => $alvo ); $m = '';
	try { do_action( 'admin_post_' . $ac ); } catch ( Morreu $x ) { $m = $x->getMessage(); }
	ver( "$ac com conta #$alvo: pára antes de escrever", '' !== $m );
}
contexto( 'admin-post.php', true, 'POST', array(), array( 'action' => 'tcd_eq_carta' ) ); $_POST = array( 'u' => 201 ); $m = '';
try { do_action( 'admin_post_tcd_eq_carta' ); } catch ( Morreu $x ) { $m = $x->getMessage(); } ver( 'tcd_eq_carta com outra conta: segue', '' === $m );
$_POST = array();
como( 1 ); ver( 'o Nuno continua a mudar tudo', true === update_user_meta( 188, 'tcd_papel', 'direccao' ) && true === update_user_meta( 1, 'tcd_papel', 'direccao' ) );
$GLOBALS['UM'][188]['tcd_papel'] = 'imobiliario';
como( 4 ); contexto( 'index.php', false, 'POST' );
ver( 'fora dos ecrãs emprestados, as escritas dela própria seguem (assistente)', true === update_user_meta( 4, 'tcd_eq_prefs', array( 'areas' => array( 'pedidos' ), 'funcao' => 'Gestão' ) ) );
ver( 'fora dos ecrãs emprestados, continua a não poder dar «direccao»', false === update_user_meta( 188, 'tcd_papel', 'direccao' ) );
$GLOBALS['OPT']['tcd_vt_off'] = '1'; ver( 'com tcd_vt_off as guardas também saem (ela deixa de ter acessos)', true === update_user_meta( 191, 'tcd_papel', 'web' ) ); unset( $GLOBALS['OPT']['tcd_vt_off'] );

echo "Publicar código continua só com o Nuno\n";
// Permissão das rotas /tcd/v1/nucleo/ficheiro e /nucleo/repor (m90005): current_user_can( 'manage_options' ) na REST.
contexto( 'index.php', false, 'POST' ); define( 'REST_REQUEST', true );
como( 4 ); ver( 'Susana não publica (REST)', ! current_user_can( 'manage_options' ) );
como( 1 ); ver( 'Nuno publica (REST)', current_user_can( 'manage_options' ) );
como( 191 ); ver( 'Web não publica', ! current_user_can( 'manage_options' ) );
como( 188 ); ver( 'Lotte não publica', ! current_user_can( 'manage_options' ) );

echo "Guardas\n";
$GLOBALS['USERS'][4]->user_email = 'outra@terracruadesign.pt'; ver( 'e-mail mudado: deixa de valer', ! tcd_vtudo_e( get_userdata( 4 ) ) ); $GLOBALS['USERS'][4]->user_email = 'susana@terracruadesign.pt';
$GLOBALS['OPT']['tcd_vt_contas'] = array( 300 => 'cliente@gmail.com' ); ver( 'conta de fora da equipa nunca', ! tcd_vtudo_e( get_userdata( 300 ) ) ); unset( $GLOBALS['OPT']['tcd_vt_contas'] );
$GLOBALS['OPT']['tcd_vt_off'] = '1'; ver( 'interruptor tcd_vt_off desliga', ! tcd_vtudo_e( get_userdata( 4 ) ) ); como( 4 ); ver( 'desligado: imóveis voltam ao que estava guardado', ! tcd_eq_pode( 'imoveis' ) ); unset( $GLOBALS['OPT']['tcd_vt_off'] );

echo "Estúdio\n";
como( 4 ); ver( 'linha «Vês tudo o que o Nuno vê» no Estúdio da Susana', false !== strpos( apply_filters( 'tcd_estudio_mensagens', '' ), 'Vês tudo o que o Nuno vê' ) );
como( 188 ); ver( 'sem linha para a Lotte', '' === apply_filters( 'tcd_estudio_mensagens', '' ) );
ver( 'filtro tcd_acn_pode: Susana sim', apply_filters( 'tcd_acn_pode', false, get_userdata( 4 ) ) );
ver( 'filtro tcd_acn_pode: Web não', ! apply_filters( 'tcd_acn_pode', false, get_userdata( 191 ) ) );

echo "\n" . $GLOBALS['OK'] . ' certos, ' . $GLOBALS['KO'] . " falhas\n"; exit( $GLOBALS['KO'] ? 1 : 0 );
