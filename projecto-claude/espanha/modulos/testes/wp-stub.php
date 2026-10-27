<?php
// Stubs mínimos do WordPress para testar os módulos de Espanha em linha de comandos.
define( 'ABSPATH', __DIR__ . '/' );
define( 'HOUR_IN_SECONDS', 3600 ); define( 'DAY_IN_SECONDS', 86400 ); define( 'MINUTE_IN_SECONDS', 60 );
$GLOBALS['__f'] = array(); $GLOBALS['__opt'] = array(); $GLOBALS['__tr'] = array(); $GLOBALS['__rotas'] = array();
$GLOBALS['__user'] = 0; $GLOBALS['__caps'] = array(); $GLOBALS['__mail'] = array(); $GLOBALS['__http'] = null;
function add_filter( $h, $cb, $p = 10, $n = 1 ) { $GLOBALS['__f'][ $h ][ $p ][] = array( $cb, $n ); return true; }
function add_action( $h, $cb, $p = 10, $n = 1 ) { return add_filter( $h, $cb, $p, $n ); }
function apply_filters( $h, $v, ...$a ) {
	if ( empty( $GLOBALS['__f'][ $h ] ) ) { return $v; }
	ksort( $GLOBALS['__f'][ $h ] );
	foreach ( $GLOBALS['__f'][ $h ] as $lista ) { foreach ( $lista as $x ) { $v = call_user_func_array( $x[0], array_slice( array_merge( array( $v ), $a ), 0, $x[1] ) ); } }
	return $v;
}
function do_action( $h, ...$a ) { if ( empty( $GLOBALS['__f'][ $h ] ) ) { return; } ksort( $GLOBALS['__f'][ $h ] ); foreach ( $GLOBALS['__f'][ $h ] as $l ) { foreach ( $l as $x ) { call_user_func_array( $x[0], array_slice( $a, 0, $x[1] ) ); } } }
function get_option( $k, $d = false ) { return array_key_exists( $k, $GLOBALS['__opt'] ) ? $GLOBALS['__opt'][ $k ] : $d; }
function update_option( $k, $v, $a = null ) { $GLOBALS['__opt'][ $k ] = $v; return true; }
function get_transient( $k ) { return $GLOBALS['__tr'][ $k ] ?? false; }
function set_transient( $k, $v, $t = 0 ) { $GLOBALS['__tr'][ $k ] = $v; return true; }
function sanitize_key( $s ) { return preg_replace( '/[^a-z0-9_\-]/', '', strtolower( (string) $s ) ); }
function sanitize_text_field( $s ) { return trim( strip_tags( (string) $s ) ); }
function esc_html( $s ) { return htmlspecialchars( (string) $s, ENT_QUOTES ); }
function esc_attr( $s ) { return htmlspecialchars( (string) $s, ENT_QUOTES ); }
function esc_url( $s ) { return (string) $s; }
function home_url( $p = '' ) { return 'https://terracruadesign.pt' . $p; }
function untrailingslashit( $s ) { return rtrim( (string) $s, '/' ); }
function trailingslashit( $s ) { return rtrim( (string) $s, '/' ) . '/'; }
function is_email( $e ) { return (bool) filter_var( $e, FILTER_VALIDATE_EMAIL ); }
function current_user_can( $c ) { return in_array( $c, $GLOBALS['__caps'], true ); }
function is_user_logged_in() { return $GLOBALS['__user'] > 0; }
function get_current_user_id() { return $GLOBALS['__user']; }
function wp_get_current_user() { return (object) array( 'ID' => $GLOBALS['__user'], 'user_email' => '' ); }
function is_admin() { return false; }
function wp_json_encode( $v, $f = 0 ) { return json_encode( $v, $f ); }
function rest_ensure_response( $v ) { return $v instanceof WP_REST_Response ? $v : new WP_REST_Response( $v ); }
function register_rest_route( $ns, $r, $a ) { $GLOBALS['__rotas'][ "/$ns$r" ] = $a; return true; }
function wp_remote_get( $u, $a = array() ) { $GLOBALS['__pedidos'][] = $u; $h = $GLOBALS['__http']; return $h ? $h( $u, $a ) : new WP_Error( 'sem_rede', 'sem rede nos testes' ); }
function wp_remote_retrieve_response_code( $r ) { return is_array( $r ) ? $r['code'] : 0; }
function wp_remote_retrieve_body( $r ) { return is_array( $r ) ? $r['body'] : ''; }
function is_wp_error( $x ) { return $x instanceof WP_Error; }
function is_ssl() { return true; }
class WP_Error { public $c; public $m; public $d; function __construct( $c = '', $m = '', $d = array() ) { $this->c = $c; $this->m = $m; $this->d = $d; } function get_error_message() { return $this->m; } function get_error_code() { return $this->c; } function get_error_data() { return $this->d; } }
class WP_REST_Response { public $data; public $status = 200; public $headers = array(); function __construct( $d = null, $s = 200 ) { $this->data = $d; $this->status = $s; } function get_data() { return $this->data; } function set_data( $d ) { $this->data = $d; } function get_status() { return $this->status; } function header( $k, $v ) { $this->headers[ $k ] = $v; } }
class WP_REST_Request {
	public $m; public $r; public $p; public $h = array();
	function __construct( $m = 'GET', $r = '', $p = array() ) { $this->m = $m; $this->r = $r; $this->p = $p; }
	function get_method() { return $this->m; } function get_route() { return $this->r; }
	function get_param( $k ) { return $this->p[ $k ] ?? null; } function get_params() { return $this->p; } function get_body_params() { return $this->p; }
	function get_header( $k ) { return $this->h[ strtolower( $k ) ] ?? null; }
}

$GLOBALS['__falhas'] = 0; $GLOBALS['__n'] = 0;
function ok( $cond, $nome ) { $GLOBALS['__n']++; if ( $cond ) { echo "ok    $nome\n"; } else { $GLOBALS['__falhas']++; echo "FALHA $nome\n"; } }
function fim() { echo "\n{$GLOBALS['__n']} testes, {$GLOBALS['__falhas']} falhas\n"; exit( $GLOBALS['__falhas'] ? 1 : 0 ); }
