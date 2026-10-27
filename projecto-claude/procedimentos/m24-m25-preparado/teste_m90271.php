<?php
// Teste local do m90271, m90272 e m90273 (Azenhas e Castelos, fase 1). Correr: php teste_m90271.php (módulos na mesma pasta).
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
function wp_json_encode( $v, $f = 0 ) { return json_encode( $v, $f ); }
function sanitize_textarea_field( $s ) { return trim( strip_tags( (string) $s ) ); }
function current_time( $f ) { return 'mysql' === $f ? '2026-10-21 22:00:00' : gmdate( $f, strtotime( '2026-10-21' ) ); }
class U { public $ID; public $user_email; public $display_name; public $caps; function __construct( $i, $e, $n, $c = array() ) { $this->ID = $i; $this->user_email = $e; $this->display_name = $n; $this->caps = $c; } }
$GLOBALS['USERS'] = array(
	1 => new U( 1, 'nuno@terracruadesign.pt', 'Nuno', array( 'manage_options' => true ) ),
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
function update_user_meta( $id, $k, $v ) { $GLOBALS['UM'][ $id ][ $k ] = $v; }
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
// ---------- stubs de posts, REST e shortcodes ----------
class WP_Error { public $code; public $msg; public $data; function __construct( $c, $m, $d = array() ) { $this->code = $c; $this->msg = $m; $this->data = $d; } }
function is_wp_error( $x ) { return $x instanceof WP_Error; }
class WP_REST_Request implements ArrayAccess {
	public $p = array(); public $route; public $json = null;
	function __construct( $m = 'GET', $r = '' ) { $this->route = $r; }
	function get_param( $k ) { return $this->p[ $k ] ?? ( is_array( $this->json ) ? ( $this->json[ $k ] ?? null ) : null ); } // como no WordPress: corpo JSON incluído
	function set_body_params( $a ) { $this->p = array_merge( $this->p, $a ); }
	function get_json_params() { return $this->json; }
	function offsetExists( $o ): bool { return isset( $this->p[ $o ] ); }
	#[\ReturnTypeWillChange] function offsetGet( $o ) { return $this->p[ $o ] ?? null; }
	function offsetSet( $o, $v ): void { $this->p[ $o ] = $v; }
	function offsetUnset( $o ): void { unset( $this->p[ $o ] ); }
}
class Res { public $d; function __construct( $d ) { $this->d = $d; } function is_error() { return is_wp_error( $this->d ); } function as_error() { return $this->d; } function get_data() { return $this->d; } }
function rest_ensure_response( $d ) { return $d; }
function register_rest_route( $ns, $r, $a ) { $GLOBALS['ROUTES'][ $r ] = $a; }
function register_post_type() {}
function rest_do_request( $q ) { $GLOBALS['PARTILHAS'][] = $q->p; return new Res( array( 'ok' => true, 'url' => 'https://x/ver/?t=abc', 'enviado' => false, 'partilha' => array( 'id' => 999 ) ) ); }
function get_post( $id ) { return $GLOBALS['POSTS'][ (int) $id ] ?? null; }
function get_post_type( $id ) { $p = get_post( $id ); return $p ? $p->post_type : false; }
function get_the_title( $id ) { $p = get_post( is_object( $id ) ? $id->ID : $id ); return $p ? $p->post_title : ''; }
function get_post_meta( $id, $k, $s = false ) { return $GLOBALS['PM'][ (int) $id ][ $k ] ?? ''; }
function update_post_meta( $id, $k, $v ) { $GLOBALS['PM'][ (int) $id ][ $k ] = $v; }
function wp_insert_post( $a ) { $id = 1000 + count( $GLOBALS['POSTS'] ); $GLOBALS['POSTS'][ $id ] = (object) array( 'ID' => $id, 'post_type' => $a['post_type'], 'post_title' => $a['post_title'] ); return $id; }
function wp_update_post( $a ) { if ( isset( $a['post_title'] ) ) { $GLOBALS['POSTS'][ $a['ID'] ]->post_title = $a['post_title']; } }
function get_posts( $q ) {
	$t = (array) $q['post_type']; $o = array();
	foreach ( $GLOBALS['POSTS'] as $p ) {
		if ( ! in_array( $p->post_type, $t, true ) ) { continue; }
		if ( isset( $q['meta_key'] ) ) { $v = get_post_meta( $p->ID, $q['meta_key'] ); if ( ( $q['meta_compare'] ?? '=' ) === '>' ? ! ( (int) $v > (int) $q['meta_value'] ) : (string) $v !== (string) $q['meta_value'] ) { continue; } }
		$o[] = $p;
	}
	return $o;
}
function shortcode_exists( $t ) { return isset( $GLOBALS['shortcode_tags'][ $t ] ); }
function add_shortcode( $t, $cb ) { $GLOBALS['shortcode_tags'][ $t ] = $cb; }
$GLOBALS['shortcode_tags'] = array( 'tcd_equipa' => function () { return 'ORIGINAL'; } );
function tcd_pg_pessoas() { return array_values( array_filter( $GLOBALS['USERS'], 'tcd_eq_e_equipa' ) ); }
function rota( $r, $metodo, $params = array(), $json = null ) {
	$a = $GLOBALS['ROUTES'][ $r ]; $q = new WP_REST_Request(); $q->p = $params; $q->json = $json;
	if ( ! call_user_func( $a['permission_callback'] ) ) { return 'recusado'; }
	return call_user_func( $a['callback'], $q );
}
// ---------- fim ----------
include __DIR__ . '/m90270.php'; // a Susana passa pelo «vê tudo» e pelo papel socio
if ( getenv( 'TCD_SEM_M90271' ) ) { // m90272 e m90273 sem o m90271 (desligado no Núcleo): nada pode dar erro fatal
	include __DIR__ . '/m90272.php'; include __DIR__ . '/m90273.php'; do_action( 'init' ); do_action( 'rest_api_init' );
	como( 188 ); $_GET = array( 'v' => 'azenhas' ); $o = $GLOBALS['shortcode_tags']['tcd_equipa']();
	$x = apply_filters( 'tcd_at_itens', array(), get_userdata( 188 ) ); $y = apply_filters( 'tcd_mesa_atalhos', array() ); $z = apply_filters( 'tcd_estudio_mensagens', '' );
	exit( 'ORIGINAL' === $o && array() === $x && array() === $y && empty( $GLOBALS['ROUTES'] ) && 0 === $GLOBALS['KO'] ? 0 : 1 );
}
include __DIR__ . '/m90271.php';
include __DIR__ . '/m90272.php';
include __DIR__ . '/m90273.php';
do_action( 'init' ); do_action( 'rest_api_init' );
$GLOBALS['POSTS'][10] = (object) array( 'ID' => 10, 'post_type' => 'tcd_imovel', 'post_title' => 'Monte do Castelo' );

echo "Quem abre Azenhas e Castelos\n";
foreach ( array( 1 => 'Nuno', 4 => 'Susana', 188 => 'Lotte' ) as $i => $n ) { ver( "$n sim", tcd_acn_pode( get_userdata( $i ) ) ); }
foreach ( array( 191 => 'Web', 200 => 'Aprendiz', 201 => 'Desenho (Ana)', 300 => 'Cliente' ) as $i => $n ) { ver( "$n não", ! tcd_acn_pode( get_userdata( $i ) ) ); }
como( 0 ); ver( 'sem sessão não', ! tcd_acn_pode() );
foreach ( array( '/azenhas' , '/azenhas/negocio', '/azenhas/imovel', '/azenhas/aviso', '/azenhas/partilha', '/azenhas/negocio/(?P<id>\d+)' ) as $r ) {
	foreach ( array( 191, 200, 300 ) as $i ) { como( $i ); ver( "REST $r recusa #$i", 'recusado' === rota( $r, 'GET', array( 'id' => 1 ) ) ); }
}

echo "Negócios, documentos e lista da escritura\n";
como( 188 );
$a = rota( '/azenhas/negocio', 'POST', array(), array( 'imovel' => 10, 'comprador' => 'Comprador A <b>', 'fase' => 'cpcv', 'valor' => '250000', 'escritura' => '2026-12-01',
	'pessoas' => array( array( 'papel' => 'comprador', 'nome' => 'Ana Compradora', 'contacto' => '912 000 000' ), array( 'papel' => 'hacker', 'nome' => 'X' ) ),
	'docs' => array( array( 'tipo' => 'certidao', 'emitido' => '2026-05-01' ) ) ) );
if ( is_wp_error( $a ) ) { var_dump( $a ); } ver( "criado pela Lotte", ! empty( $a["ok"] ) );
$na = $a['negocio'];
ver( 'texto limpo (sem HTML)', 'Comprador A' === $na['comprador'] );
ver( 'papel desconhecido vira colaborador', 'colaborador' === $na['pessoas'][1]['papel'] );
ver( 'certidão permanente vale 6 meses', '2026-11-01' === $na['docs'][0]['validade'] );
ver( 'lista da escritura gerada com a data', 14 === count( (array) $na['lista'] ) );
$b = rota( '/azenhas/negocio', 'POST', array(), array( 'imovel' => 10, 'comprador' => 'Comprador B', 'pessoas' => array( array( 'papel' => 'comprador', 'nome' => 'Bruno Interessado' ) ) ) );
$nb = $b['negocio'];
ver( 'sem data de escritura não há lista', 0 === count( (array) $nb['lista'] ) );
ver( 'fase inválida fica contacto', 'contacto' === $nb['fase'] );
$ga = rota( '/azenhas/negocio/(?P<id>\d+)', 'GET', array( 'id' => $na['id'] ) );
ver( 'interessados não se vêem: negócio A não tem pessoas do B', false === strpos( json_encode( $ga ), 'Bruno' ) );
ver( 'imóvel inexistente recusado', is_wp_error( rota( '/azenhas/negocio', 'POST', array(), array( 'imovel' => 999 ) ) ) );
ver( 'id de outro tipo recusado', is_wp_error( rota( '/azenhas/negocio', 'POST', array(), array( 'id' => 10 ) ) ) );

$h = rota( '/azenhas/negocio', 'POST', array(), array( 'id' => $na['id'], 'comprador' => array( 'x' ), 'valor' => array( 1 ), 'cpcv' => array(), 'pessoas' => array( array( 'nome' => array( 'y' ) ), 'lixo' ) ) );
ver( 'entradas hostis (listas no lugar de texto) não partem nada', ! empty( $h['ok'] ) && array() === $h['negocio']['pessoas'] && '' === $h['negocio']['comprador'] );
rota( '/azenhas/negocio', 'POST', array(), array( 'id' => $na['id'], 'comprador' => 'Comprador A', 'pessoas' => $na['pessoas'] ) );
echo "Artigos matriciais\n";
$r = rota( '/azenhas/imovel', 'POST', array( 'id' => 10, 'artigos' => array( array( 'tipo' => 'rustico', 'artigo' => '123', 'seccao' => 'B', 'freguesia' => 'Santa Clara-a-Nova', 'a_cad' => '12,5 ha', 'data' => '2026-10-01' ), array( 'tipo' => 'urbano', 'artigo' => '45' ), array( 'artigo' => '' ) ) ) );
ver( 'dois artigos (o vazio cai)', 2 === count( $r['imovel']['artigos'] ) );
ver( 'lista mostra 2 negócios no imóvel', 2 === count( rota( '/azenhas', 'GET' )['imoveis'][0]['negocios'] ) );

echo "Avisos e «Precisa de atenção»\n";
rota( '/azenhas/aviso', 'POST', array( 'alvo' => 'ng:' . $na['id'], 'texto' => 'Pedir distrate ao banco', 'para' => 0, 'ate' => '2026-10-20' ) );
rota( '/azenhas/aviso', 'POST', array( 'alvo' => 'im:10', 'texto' => 'Só para a Susana', 'para' => 4 ) );
ver( 'alvo inválido recusado', is_wp_error( rota( '/azenhas/aviso', 'POST', array( 'alvo' => 'im:' . $na['id'], 'texto' => 'x' ) ) ) );
$lot = apply_filters( 'tcd_at_itens', array(), get_userdata( 188 ) );
ver( 'Lotte vê 1 aviso (o geral), em inglês, prioridade alta (prazo passado)', 1 === $lot[0]['n'] && 'alta' === $lot[0]['prio'] && false !== strpos( $lot[0]['tit'], 'notes' ) );
$sus = apply_filters( 'tcd_at_itens', array(), get_userdata( 4 ) );
ver( 'Susana vê 2 avisos', 2 === $sus[0]['n'] );
ver( 'Web não vê nada', array() === apply_filters( 'tcd_at_itens', array(), get_userdata( 191 ) ) );
ver( 'Aprendiz não vê nada', array() === apply_filters( 'tcd_at_itens', array(), get_userdata( 200 ) ) );
$f = rota( '/azenhas/aviso', 'POST', array( 'alvo' => 'ng:' . $na['id'], 'fechar' => 0 ) );
ver( 'fechado por quem', 188 === $f['avisos'][0]['fechado'] );
$lot = apply_filters( 'tcd_at_itens', array(), get_userdata( 188 ) );
ver( 'depois de fechado a Lotte só tem a certidão a caducar', 1 === count( $lot ) && false !== strpos( $lot[0]['tit'], 'certificates' ) );

echo "Partilha\n";
como( 4 );
$p = rota( '/azenhas/partilha', 'POST', array( 'negocio' => $na['id'], 'email' => 'a@exemplo.pt', 'dias' => 500 ) );
ver( 'partilha feita', ! empty( $p['ok'] ) );
$env = end( $GLOBALS['PARTILHAS'] );
ver( 'só leva o imóvel e o próprio comprador', 'im:10' === $env['origem'] && 'Comprador A' === $env['para'] && false === strpos( json_encode( $env ), 'Bruno' ) );
ver( 'prazo limitado a 90 dias', 90 === $env['dias'] );
$ga = rota( '/azenhas/negocio/(?P<id>\d+)', 'GET', array( 'id' => $na['id'] ) );
ver( 'registado quem partilhou', 'Susana' === $ga['negocio']['partilhas'][0]['quem'] );

echo "Vista\n";
$_GET = array( 'v' => 'azenhas' ); $sc = $GLOBALS['shortcode_tags']['tcd_equipa'];
como( 188 ); $h = $sc(); ver( 'Lotte abre a vista em inglês', false !== strpos( $h, 'id="tcac"' ) && false !== strpos( $h, '"en":true' ) );
como( 4 ); $h = $sc(); ver( 'Susana abre a vista em português', false !== strpos( $h, '"en":false' ) );
como( 201 ); ver( 'Ana: sem acesso', false !== strpos( $sc(), 'Sem acesso' ) );
$_GET = array( 'v' => 'pedidos' ); ver( 'outras vistas passam ao original', 'ORIGINAL' === $sc() );
$GLOBALS['OPT']['tcd_ac_off'] = '1'; $_GET = array( 'v' => 'azenhas' ); como( 188 ); ver( 'interruptor tcd_ac_off: volta ao original', 'ORIGINAL' === $sc() && ! tcd_acn_pode() ); unset( $GLOBALS['OPT']['tcd_ac_off'] );
como( 188 ); $at = apply_filters( 'tcd_mesa_atalhos', array() ); ver( 'caixa no catálogo do Estúdio', isset( $at['azenhas-e-castelos'] ) );
como( 191 ); ver( 'sem caixa para o Web', array() === apply_filters( 'tcd_mesa_atalhos', array() ) );

echo "Revisão independente\n";
como( 188 );
$x = rota( '/azenhas/negocio', 'POST', array(), array( 'id' => $na['id'], 'cpcv' => '2026-02-30', 'valor' => '1e999' ) );
ver( 'data impossível (30 de Fevereiro) recusada', '' === $x['negocio']['cpcv'] );
ver( 'valor absurdo (1e999) recusado', '' === $x['negocio']['valor'] && false !== json_encode( $x ) );
$x = rota( '/azenhas/negocio', 'POST', array(), array( 'id' => $na['id'], 'docs' => array( array( 'tipo' => 'certidao', 'emitido' => '2026-13-45' ) ) ) );
ver( 'certidão com emissão impossível não vira 1970', '' === $x['negocio']['docs'][0]['validade'] );
ver( 'alvo do aviso como lista: recusado sem aviso do PHP', is_wp_error( rota( '/azenhas/aviso', 'POST', array( 'alvo' => array( 'im:10' ), 'texto' => 'x' ) ) ) );
$antes = count( tcd_acn_m( 10 )['artigos'] );
ver( 'guardar imóvel sem «artigos» não apaga os artigos', is_wp_error( rota( '/azenhas/imovel', 'POST', array( 'id' => 10 ) ) ) && $antes === count( tcd_acn_m( 10 )['artigos'] ) && $antes > 0 );
como( 4 ); $p = rota( '/azenhas/partilha', 'POST', array( 'negocio' => $na['id'], 'email' => array( 'a' ), 'mensagem' => array( 'b' ) ) ); $env = end( $GLOBALS['PARTILHAS'] );
ver( 'partilha com e-mail e mensagem em lista: sem aviso do PHP', ! empty( $p['ok'] ) && '' === $env['email'] && '' === $env['mensagem'] );
$p = rota( '/azenhas/partilha', 'POST', array( 'negocio' => $na['id'], 'mensagem' => '<script>x</script>Olá' ) ); $env = end( $GLOBALS['PARTILHAS'] );
ver( 'mensagem da partilha limpa antes de passar ao m90018', false === strpos( $env['mensagem'], '<' ) );
$GLOBALS['USERS'][188]->display_name = 'Lotte</script><script>alert(1)</script>';
como( 188 ); $_GET = array( 'v' => 'azenhas' ); $h = $GLOBALS['shortcode_tags']['tcd_equipa']();
ver( 'nome com </script> não fecha o script da configuração', false === strpos( $h, '</script><script>alert' ) && false !== strpos( $h, '\\u003C\\/script\\u003E' ) );
$GLOBALS['USERS'][188]->display_name = 'Lotte';
$_GET = array( 'v' => array( 'azenhas' ) ); ver( 'v em lista: passa ao original sem aviso', 'ORIGINAL' === $GLOBALS['shortcode_tags']['tcd_equipa']() );
como( 0 ); $_GET = array( 'v' => 'azenhas' ); ver( 'visitante sem sessão: sem acesso', false !== strpos( $GLOBALS['shortcode_tags']['tcd_equipa'](), 'Sem acesso' ) );
$rc = 1; $out = array(); exec( 'TCD_SEM_M90271=1 ' . escapeshellarg( PHP_BINARY ) . ' ' . escapeshellarg( __FILE__ ) . ' 2>&1', $out, $rc );
ver( 'm90272 e m90273 sem o m90271: sem erro fatal, sem rotas, vista volta ao original', 0 === $rc );
$GLOBALS['OPT']['tcd_ac_off'] = '1'; como( 188 ); ver( 'interruptor tcd_ac_off: rotas recusam', 'recusado' === rota( '/azenhas', 'GET' ) && array() === apply_filters( 'tcd_at_itens', array(), get_userdata( 188 ) ) ); unset( $GLOBALS['OPT']['tcd_ac_off'] );

echo "\n" . $GLOBALS['OK'] . ' certos, ' . $GLOBALS['KO'] . " falhas\n"; exit( $GLOBALS['KO'] ? 1 : 0 );
