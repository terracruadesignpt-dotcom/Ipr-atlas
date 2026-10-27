<?php
// Teste local do m90049 (pedido 52) com WordPress e WooCommerce simulados.
// Carrega as cópias de produção do m90135 e do m90136 (espelho/, sha256 iguais aos de produção) e o m90049.
// Correr: php teste.php
error_reporting( E_ALL );
define( 'ABSPATH', '/' );
define( 'MINUTE_IN_SECONDS', 60 ); define( 'HOUR_IN_SECONDS', 3600 ); define( 'DAY_IN_SECONDS', 86400 ); define( 'MONTH_IN_SECONDS', 2592000 );

// ---------- ganchos ----------
$H = array(); $SEQ = 0;
function add_filter( $h, $cb, $p = 10, $n = 1 ) { global $H, $SEQ; $H[ $h ][] = array( $p, ++$SEQ, $cb, $n ); return true; }
function add_action( $h, $cb, $p = 10, $n = 1 ) { return add_filter( $h, $cb, $p, $n ); }
function remove_action( $h, $cb, $p = 10 ) { global $H; foreach ( (array) ( $H[ $h ] ?? array() ) as $i => $x ) { if ( $x[2] === $cb && $x[0] === $p ) { unset( $H[ $h ][ $i ] ); } } }
function tst_lista( $h ) { global $H; $l = $H[ $h ] ?? array(); usort( $l, function ( $a, $b ) { return $a[0] <=> $b[0] ?: $a[1] <=> $b[1]; } ); return $l; }
function apply_filters( $h, $v, ...$a ) { foreach ( tst_lista( $h ) as $x ) { $v = call_user_func_array( $x[2], array_slice( array_merge( array( $v ), $a ), 0, $x[3] ) ); } return $v; }
function do_action( $h, ...$a ) { if ( ! $a ) { $a = array( '' ); } foreach ( tst_lista( $h ) as $x ) { call_user_func_array( $x[2], array_slice( $a, 0, $x[3] ) ); } }

// ---------- opções e transients ----------
$O = array(); $T = array();
function get_option( $k, $d = false ) { global $O; return array_key_exists( $k, $O ) ? $O[ $k ] : $d; }
function update_option( $k, $v, $a = null ) {
	global $O; $velho = array_key_exists( $k, $O ) ? $O[ $k ] : false;
	$v = apply_filters( 'pre_update_option_' . $k, $v, $velho, $k );
	if ( $v === $velho ) { return false; }
	if ( false === $velho ) { $O[ $k ] = $v; return true; }
	$O[ $k ] = $v; do_action( 'update_option_' . $k, $velho, $v, $k ); return true;
}
function add_option( $k, $v = '', $x = '', $a = 'yes' ) { global $O; if ( array_key_exists( $k, $O ) ) { return false; } $O[ $k ] = $v; return true; }
function delete_option( $k ) { global $O; unset( $O[ $k ] ); return true; }
function get_transient( $k ) { global $T; return $T[ $k ] ?? false; }
function set_transient( $k, $v, $e = 0 ) { global $T; $T[ $k ] = $v; return true; }
function delete_transient( $k ) { global $T; unset( $T[ $k ] ); }

// ---------- utilizadores ----------
class WP_User { public $ID = 0, $user_email = '', $display_name = '', $caps = array(), $first_name = '', $last_name = ''; }
$U = array(); $UM = array(); $EU = 0; $NUID = 100;
function tst_user( $id, $email, $nome, $caps = array() ) { global $U; $u = new WP_User(); $u->ID = $id; $u->user_email = $email; $u->display_name = $nome; $u->caps = $caps; $U[ $id ] = $u; return $u; }
function get_userdata( $id ) { global $U; return $U[ (int) $id ] ?? false; }
function get_user_by( $f, $v ) { global $U; foreach ( $U as $u ) { if ( 'email' === $f && strtolower( $u->user_email ) === strtolower( $v ) ) { return $u; } } return false; }
function wp_get_current_user() { global $EU; return get_userdata( $EU ) ?: new WP_User(); }
function get_current_user_id() { global $EU; return (int) $EU; }
function is_user_logged_in() { global $EU; return $EU > 0; }
function user_can( $u, $c ) { return $u && ! empty( $u->caps[ $c ] ); }
function current_user_can( $c ) { return user_can( wp_get_current_user(), $c ); }
function get_user_meta( $id, $k, $s = false ) { global $UM; return $UM[ $id ][ $k ] ?? ''; }
function update_user_meta( $id, $k, $v ) { global $UM; $UM[ $id ][ $k ] = $v; return true; }
function delete_user_meta( $id, $k ) { global $UM; unset( $UM[ $id ][ $k ] ); return true; }
function wc_create_new_customer( $em, $l = '', $p = '', $a = array() ) { global $NUID; $id = ++$NUID; $u = tst_user( $id, $em, trim( ( $a['first_name'] ?? '' ) . ' ' . ( $a['last_name'] ?? '' ) ) ); return $id; }
// m90016 e m90055 simulados
function tcd_eq_e_equipa( $u ) { return $u && '@terracruadesign.pt' === substr( strtolower( $u->user_email ), -19 ); }
function tcd_pg_ve_clientes( $u = null ) { $u = $u ?: wp_get_current_user(); return $u && ! empty( $u->caps['ve_clientes'] ); }

// ---------- utilitários WP ----------
function is_email( $s ) { return (bool) filter_var( (string) $s, FILTER_VALIDATE_EMAIL ); }
function sanitize_email( $s ) { return preg_replace( '/[^a-zA-Z0-9!#$%&\'*+\/=?^_`{|}~.@-]/', '', (string) $s ); }
function sanitize_text_field( $s ) { return trim( strip_tags( (string) $s ) ); }
function sanitize_key( $s ) { return preg_replace( '/[^a-z0-9_\-]/', '', strtolower( (string) $s ) ); }
function absint( $n ) { return abs( (int) $n ); }
function wp_unslash( $s ) { return is_string( $s ) ? stripslashes( $s ) : $s; }
function esc_html( $s ) { return htmlspecialchars( (string) $s, ENT_QUOTES, 'UTF-8' ); }
function esc_attr( $s ) { return esc_html( $s ); }
function esc_url( $s ) { return esc_html( $s ); }
function esc_url_raw( $s ) { return (string) $s; }
function wp_json_encode( $d, $f = 0 ) { return json_encode( $d, $f ); }
function home_url( $p = '' ) { return 'https://terracruadesign.pt' . $p; }
function admin_url( $p = '' ) { return 'https://terracruadesign.pt/wp-admin/' . $p; }
function rest_url( $p = '' ) { return 'https://terracruadesign.pt/wp-json/' . $p; }
function content_url( $p = '' ) { return 'https://terracruadesign.pt/wp-content/' . $p; }
function untrailingslashit( $s ) { return rtrim( (string) $s, '/' ); }
function wp_strip_all_tags( $s ) { return strip_tags( (string) $s ); }
function wc_price( $n ) { return number_format( (float) $n, 2, ',', ' ' ) . ' €'; }
function date_i18n( $f, $t ) { return gmdate( $f, $t ); }
function wp_date( $f, $t ) { return gmdate( $f, $t ); }
function current_time( $t ) { return gmdate( 'Y-m-d H:i:s' ); }
function wp_generate_password( $n = 12, $s = true, $x = false ) { $c = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'; $o = ''; for ( $i = 0; $i < $n; $i++ ) { $o .= $c[ random_int( 0, strlen( $c ) - 1 ) ]; } return $o; }
function wp_create_nonce( $a ) { return 'n-' . $a; }
$NONCE_OK = true;
class Morre extends Exception {}
class RespostaJson extends Exception { public $ok, $dados, $estado; function __construct( $ok, $d, $e ) { $this->ok = $ok; $this->dados = $d; $this->estado = $e; parent::__construct( 'json' ); } }
function check_ajax_referer( $a, $c ) { global $NONCE_OK; if ( ! $NONCE_OK || ( $_POST[ $c ] ?? '' ) !== 'n-' . $a ) { throw new Morre( '-1' ); } return 1; }
function wp_send_json_error( $d = null, $e = null ) { throw new RespostaJson( false, $d, $e ); }
function wp_send_json_success( $d = null, $e = null ) { throw new RespostaJson( true, $d, $e ); }
function tcd_tg_enviar( $m ) { global $TG; $TG[] = $m; }
$TG = array();
class WP_Error { public $c, $m, $d; function __construct( $c = '', $m = '', $d = array() ) { $this->c = $c; $this->m = $m; $this->d = $d; } function get_error_message() { return $this->m; } }
function is_wp_error( $x ) { return $x instanceof WP_Error; }
class WP_REST_Response { public $d; function __construct( $d = null ) { $this->d = $d; } function get_data() { return $this->d; } function set_data( $d ) { $this->d = $d; } }
class WP_REST_Request { public $p, $r, $m; function __construct( $m, $r, $p = array() ) { $this->m = $m; $this->r = $r; $this->p = $p; } function get_method() { return $this->m; } function get_route() { return $this->r; } function get_param( $k ) { return $this->p[ $k ] ?? null; } }
function rest_ensure_response( $d ) { return new WP_REST_Response( $d ); }
$ROTAS = array();
function register_rest_route( $ns, $r, $a ) { global $ROTAS; $ROTAS[ $r ] = $a; }
// posts (linhas do CRM do m90135)
$P = array(); $PM = array();
function get_post( $id ) { global $P; return $P[ (int) $id ] ?? null; }
function get_post_meta( $id, $k, $s = false ) { global $PM; return $PM[ (int) $id ][ $k ] ?? ''; }
function update_post_meta( $id, $k, $v ) { global $PM; $PM[ (int) $id ][ $k ] = $v; return true; }
function get_post_status( $id ) { global $CP; foreach ( $CP as $c ) { if ( $c->id === (int) $id ) { return $c->status; } } return false; }
function tst_linha( $id, $nome, $email, $tipo = 'empresa' ) { global $P; $P[ $id ] = (object) array( 'ID' => $id, 'post_type' => 'tcd_conv', 'post_title' => $nome ); update_post_meta( $id, '_cv_email', $email ); update_post_meta( $id, '_cv_tipo', $tipo ); update_post_meta( $id, '_cv_pais', 'PT' ); }
function wp_mail( $to, $s, $m, $h = array() ) { global $MAIL; $MAIL[] = $to; return true; }
$MAIL = array();

// ---------- WooCommerce simulado ----------
$CP = array(); $NCID = 5000;
class WC_Coupon {
	public $id = 0, $p = array(), $meta = array(), $status = 'publish';
	function __construct( $id = 0 ) { global $CP; if ( $id ) { foreach ( $CP as $c ) { if ( $c->id === (int) $id ) { $this->id = $c->id; $this->p = &$c->p; $this->meta = &$c->meta; } } } }
	function __call( $n, $a ) { if ( 0 === strpos( $n, 'set_' ) ) { $this->p[ substr( $n, 4 ) ] = $a[0]; return; } if ( 0 === strpos( $n, 'get_' ) ) { return $this->p[ substr( $n, 4 ) ] ?? null; } }
	function update_meta_data( $k, $v ) { $this->meta[ $k ] = $v; }
	function get_meta( $k ) { return $this->meta[ $k ] ?? ''; }
	function get_usage_count() { return (int) ( $this->p['usage_count'] ?? 0 ); }
	function save() { global $CP, $NCID; if ( ! $this->id ) { $this->id = ++$NCID; $CP[ strtolower( $this->p['code'] ) ] = $this; } return $this->id; }
}
function wc_get_coupon_id_by_code( $c ) { global $CP; return isset( $CP[ strtolower( $c ) ] ) ? $CP[ strtolower( $c ) ]->id : 0; }
class WC_Discounts { public $o; function __construct( $o = null ) { $this->o = $o; } function get_object() { return $this->o; } }
$ORD = array(); $NOID = 7000;
class WC_Order {
	public $id = 0, $cid = 0, $em = '', $tel = '', $fn = '', $ln = '', $cupoes = array(), $status = 'pending', $total = 100.0, $meta = array(), $notas = array();
	function get_id() { return $this->id; } function get_customer_id() { return $this->cid; } function set_customer_id( $i ) { $this->cid = (int) $i; }
	function get_billing_email() { return $this->em; } function get_billing_phone() { return $this->tel; } function get_billing_first_name() { return $this->fn; } function get_billing_last_name() { return $this->ln; }
	function get_coupon_codes() { return $this->cupoes; } function get_status() { return $this->status; } function needs_payment() { return 'pending' === $this->status && $this->total > 0; }
	function get_total() { return $this->total; } function get_order_number() { return (string) $this->id; } function get_checkout_payment_url() { return 'https://terracruadesign.pt/pagar/' . $this->id; }
	function update_meta_data( $k, $v ) { $this->meta[ $k ] = $v; } function get_meta( $k ) { return $this->meta[ $k ] ?? ''; }
	function add_order_note( $n ) { $this->notas[] = $n; } function calculate_totals( $x = true ) {}
	function save() { global $ORD, $NOID; if ( ! $this->id ) { $this->id = ++$NOID; } $ORD[ $this->id ] = $this; return $this->id; }
	function apply_coupon( $code ) {
		$id = wc_get_coupon_id_by_code( $code ); if ( ! $id ) { return new WP_Error( 'x', 'Cupão inexistente.' ); }
		$cp = new WC_Coupon( $id );
		if ( $cp->get_usage_limit() && $cp->get_usage_count() >= $cp->get_usage_limit() ) { return new WP_Error( 'x', 'Limite de utilizações.' ); }
		try { if ( ! apply_filters( 'woocommerce_coupon_is_valid', true, $cp, new WC_Discounts( $this ) ) ) { throw new Exception( 'Cupão inválido.' ); } }
		catch ( Exception $e ) { return new WP_Error( 'x', $e->getMessage() ); }
		$this->cupoes[] = strtolower( $code ); if ( 'percent' === $cp->get_discount_type() ) { $this->total = round( $this->total * ( 1 - $cp->get_amount() / 100 ), 2 ); }
		return true;
	}
}
function wc_get_order( $id ) { global $ORD; return $ORD[ (int) $id ] ?? false; }
function wc_get_orders( $a ) { global $ORD; $v = $a['meta_query'][0]['value']; foreach ( array_reverse( $ORD, true ) as $o ) { if ( ( $o->meta['_tcd_pedido'] ?? '' ) === $v ) { return array( $o->id ); } } return array(); }
function wc_get_order_status_name( $s ) { return array( 'pending' => 'Pendente', 'processing' => 'Em processamento', 'cancelled' => 'Cancelada' )[ $s ] ?? $s; }
// validação como no carrinho (WC_Discounts sem encomenda)
function tst_valida_carrinho( $code ) {
	$id = wc_get_coupon_id_by_code( $code ); if ( ! $id ) { return 'inexistente'; }
	$cp = new WC_Coupon( $id );
	if ( $cp->get_usage_limit() && $cp->get_usage_count() >= $cp->get_usage_limit() ) { return 'limite'; }
	try { return apply_filters( 'woocommerce_coupon_is_valid', true, $cp, new WC_Discounts( null ) ) ? 'ok' : 'invalido'; } catch ( Exception $e ) { return 'recusado: ' . $e->getMessage(); }
}

class TstSess { public $d = array(); function get( $k ) { return $this->d[ $k ] ?? null; } function set( $k, $v ) { $this->d[ $k ] = $v; } }
class TstWC { public $session; public $cart = null; }
$WCI = new TstWC(); $WCI->session = new TstSess();
function WC() { global $WCI; return $WCI; }
// ---------- módulos ----------
require __DIR__ . '/espelho/m90135.php';
require __DIR__ . '/espelho/m90136.php';
require __DIR__ . '/m90049.php';
do_action( 'rest_api_init' );

// ---------- ajudantes ----------
$ok = 0; $falhas = 0;
function verifica( $cond, $txt ) { global $ok, $falhas; if ( $cond ) { $ok++; echo "ok    $txt\n"; } else { $falhas++; echo "FALHA $txt\n"; } }
function ajax( $acao, $post, $uid = 0 ) {
	global $EU; $EU = $uid; $_POST = $post;
	try { do_action( ( $uid ? 'wp_ajax_' : 'wp_ajax_nopriv_' ) . $acao ); } catch ( RespostaJson $r ) { return $r; } catch ( Morre $m ) { return 'morre'; }
	return null;
}
function rota( $r, $metodo, $p, $uid ) {
	global $ROTAS, $EU; $EU = $uid; $a = $ROTAS[ $r ];
	if ( ! call_user_func( $a['permission_callback'] ) ) { return 'sem_permissao'; }
	return call_user_func( $a['callback'], new WP_REST_Request( $metodo, '/tcd/v1' . $r, $p ) );
}
function pedido_base( $uid, $email, $tel = '912345678' ) {
	global $EU; $EU = $uid;
	$o = new WC_Order(); $o->em = $email; $o->tel = $tel; $o->fn = 'Teste'; $o->total = 500.0; $o->meta['_tcd_pedido'] = 'TCD-' . random_int( 1000, 9999 ); if ( ! empty( $GLOBALS['tst_vale_meta'] ) ) { $o->meta['_tcd_vale_por_confirmar'] = array( 'escrito' => 'x' ); } $o->save(); // o m14473 cria a encomenda
	$res = new WP_REST_Response( array( 'ok' => true, 'pedido' => $o->meta['_tcd_pedido'], 'pagar' => $o->get_checkout_payment_url() ) + ( ! empty( $GLOBALS['tst_vale_resp'] ) ? array( 'vale' => array( 'ok' => true ) ) : array() ) );
	$res = apply_filters( 'rest_post_dispatch', $res, null, new WP_REST_Request( 'POST', '/tcd/v1/pedido-base' ) );
	return array( $o, $res->get_data() );
}

// ---------- contas ----------
tst_user( 1, 'nuno@terracruadesign.pt', 'Nuno', array( 'manage_options' => 1 ) );
tst_user( 187, 'ana@terracruadesign.pt', 'Ana' );
tst_user( 186, 'miguel@terracruadesign.pt', 'Miguel' );
tst_user( 4, 'susana@terracruadesign.pt', 'Susana', array( 've_clientes' => 1 ) );
tst_user( 50, 'cliente@exemplo.pt', 'Cliente qualquer' );
$A = 'pessoa.a@exemplo.pt'; $B = 'pessoa.b@exemplo.pt';

echo "== 1. criar convite exige e-mail ==\n";
verifica( 'sem_permissao' === rota( '/c52/convite', 'POST', array( 'email' => $A ), 0 ), 'anónimo não cria convites' );
verifica( 'sem_permissao' === rota( '/c52/convite', 'POST', array( 'email' => $A ), 50 ), 'cliente fora da equipa não cria convites' );
$r = rota( '/c52/convite', 'POST', array( 'email' => '', 'nome' => 'Sem e-mail' ), 187 );
verifica( is_wp_error( $r ) && 400 === $r->d['status'], 'convite sem e-mail recusado (400)' );
$r = rota( '/c52/convite', 'POST', array( 'email' => 'isto-nao-e-email' ), 187 );
verifica( is_wp_error( $r ), 'convite com e-mail inválido recusado' );
verifica( ! get_option( 'tcd_convites' ), 'nada gravado em tcd_convites' );
$r = rota( '/c52/convite', 'POST', array( 'email' => 'miguel@terracruadesign.pt' ), 187 );
verifica( is_wp_error( $r ), 'convite para conta da equipa recusado' );
$r = rota( '/c52/convite', 'POST', array( 'email' => 'ana@terracruadesign.pt' ), 187 );
verifica( is_wp_error( $r ), 'convite para o próprio e-mail recusado' );
$r = rota( '/c52/convite', 'POST', array( 'email' => ' Pessoa.A@Exemplo.PT ', 'nome' => 'Pessoa A <b>', 'telefone' => '+351 912 000 111' ), 187 );
$r = $r instanceof WP_REST_Response ? $r->get_data() : $r;
verifica( is_array( $r ) && preg_match( '/^PRO-[A-Z0-9]{6}$/', $r['codigo'] ), 'qualquer pessoa da equipa (Ana) cria convite com e-mail: ' . ( $r['codigo'] ?? '?' ) );
$CODA = $r['codigo'];
$cv = get_option( 'tcd_convites' );
verifica( $A === $cv[ $CODA ]['email'] && array() === $cv[ $CODA ]['ofertas'], 'código gravado com o e-mail normalizado e sem outras ofertas' );
verifica( 187 === tcd_c52_reg()[ $CODA ]['por'], 'registo guarda quem convidou (Ana)' );
verifica( false === strpos( $r['mensagem'], '<b>' ) && false !== strpos( $r['mailto'], 'mailto:pessoa.a%40exemplo.pt' ), 'nome limpo e mailto pronto' );
$r2 = rota( '/c52/convite', 'POST', array( 'email' => $A ), 187 )->get_data();
verifica( $r2['codigo'] === $CODA && ! $r2['novo'], 'segundo convite ao mesmo e-mail devolve o código por usar (sem duplicar)' );
verifica( 0 === count( $MAIL ) && 0 === count( $TG ), 'nenhum e-mail nem Telegram enviado ao criar' );

// rede de segurança: código novo sem e-mail gravado por outro caminho
$EU = 1; $cv = get_option( 'tcd_convites' );
$cv['PRO-ZZZZZZ'] = array( 'email' => '', 'nome' => 'Sem e-mail', 'criado' => time(), 'validade' => time() + 999, 'usado' => 0, 'ofertas' => array() );
update_option( 'tcd_convites', $cv, false );
verifica( ! isset( get_option( 'tcd_convites' )['PRO-ZZZZZZ'] ), 'rede de segurança: código sem e-mail não chega a ser gravado' );

// envio em lote do m90135 com uma linha sem e-mail
tst_linha( 901, 'Empresa Com E-mail', 'geral@empresa-x.pt' ); tst_linha( 902, 'Pessoa Sem E-mail', '', 'pessoa' );
$r = ajax( 'tcd_cv_enviar', array( 'n' => 'n-tcd_cv', 'ids' => array( 901, 902 ), 'ofertas' => array( 'designer3' ) ), 1 );
verifica( $r instanceof RespostaJson && ! $r->ok && 400 === $r->estado && false !== strpos( $r->dados, 'Pessoa Sem E-mail' ), 'lote do m90135 com linha sem e-mail recusado, com o nome da linha' );
verifica( 0 === count( $MAIL ), 'nenhum e-mail saiu nesse lote' );
$r = ajax( 'tcd_cv_enviar', array( 'n' => 'errado', 'ids' => array( 902 ), 'ofertas' => array( 'designer3' ) ), 1 );
verifica( 'morre' === $r, 'lote sem nonce válido morre antes de responder' );
$r = ajax( 'tcd_cv_enviar', array( 'n' => 'n-tcd_cv', 'ids' => array( 901 ), 'ofertas' => array( 'designer3', 'base100' ) ), 1 );
verifica( $r instanceof RespostaJson && $r->ok && 1 === $r->dados['enviados'], 'lote só com e-mail segue para o m90135 (1 enviado)' );
$CODE = $r->dados['itens'][0]['codigo'];
verifica( 1 === tcd_c52_reg()[ $CODE ]['por'], 'convite do painel do Nuno fica com «quem convidou»' );
$r = ajax( 'tcd_sg46', array( 'n' => 'n-tcd_sg46', 'acc' => 'marcar', 'id' => 902 ), 1 );
verifica( $r instanceof RespostaJson && ! $r->ok && 400 === $r->estado, '«Já enviei» (m90046) recusado para linha sem e-mail' );
$r = ajax( 'tcd_sg', array( 'n' => 'n-tcd_sg', 'acc' => 'whatsapp', 'id' => 902 ), 1 );
verifica( $r instanceof RespostaJson && ! $r->ok, 'WhatsApp do painel de sugestões recusado para linha sem e-mail' );

echo "== 2. activação só com o e-mail do convite ==\n";
$r = ajax( 'tcd_cvr_activar', array( 'codigo' => $CODA, 'email' => $B ) );
verifica( $r instanceof RespostaJson && ! $r->ok && false !== strpos( $r->dados, 'outro e-mail' ), 'registo com outro e-mail recusado com mensagem clara' );
verifica( ! get_user_by( 'email', $B ) && empty( get_option( 'tcd_convites' )[ $CODA ]['usado'] ), 'nenhuma conta criada e o convite continua por usar' );
$r = ajax( 'tcd_cvr_activar', array( 'codigo' => $CODA, 'email' => $A ), 50 );
verifica( $r instanceof RespostaJson && ! $r->ok && false !== strpos( $r->dados, 'noutra conta' ), 'com sessão noutra conta: recusado' );
// convite antigo sem e-mail (gravado antes do módulo)
$O['tcd_convites']['PRO-VELHO1'] = array( 'email' => '', 'nome' => 'Antigo', 'criado' => time() - 99, 'validade' => time() + 999, 'usado' => 0, 'ofertas' => array( 'designer3' ) );
$r = ajax( 'tcd_cvr_activar', array( 'codigo' => 'PRO-VELHO1', 'email' => 'qualquer@exemplo.pt' ) );
verifica( $r instanceof RespostaJson && ! $r->ok && false !== strpos( $r->dados, 'não tem e-mail' ), 'convite antigo sem e-mail: recusado (antes o m90136 aceitava qualquer e-mail)' );
verifica( ! get_user_by( 'email', 'qualquer@exemplo.pt' ), 'e não deu conta nem acesso' );
// caixa do Atlas
$_GET['convite'] = $CODA; $caixa = apply_filters( 'do_shortcode_tag', '[atlas]', 'ipr_atlas' ); unset( $_GET['convite'] );
verifica( false !== strpos( $caixa, '<li>10 % de desconto em toda a loja' ), 'a caixa do convite no Atlas mostra os 10 %' );
$T = array();
$r = ajax( 'tcd_cvr_activar', array( 'codigo' => $CODA, 'email' => '  PESSOA.A@exemplo.pt' ) );
verifica( $r instanceof RespostaJson && $r->ok, 'registo com o e-mail certo (maiúsculas e espaços) aceite pelo m90136' );
$ua = get_user_by( 'email', $A );
verifica( $ua && $ua->ID > 100, 'conta criada para ' . $A );
verifica( (int) get_option( 'tcd_convites' )[ $CODA ]['user'] === $ua->ID, 'convite marcado como usado por essa conta' );
$cupao = get_user_meta( $ua->ID, 'tcd_c52_cupao' );
$cp = $cupao ? new WC_Coupon( wc_get_coupon_id_by_code( $cupao ) ) : null;
verifica( $cp && 'percent' === $cp->get_discount_type() && 10 == $cp->get_amount(), 'cupão pessoal de 10 % criado na activação: ' . $cupao );
verifica( $cp && 1 === $cp->get_usage_limit() && 1 === $cp->get_usage_limit_per_user() && true === $cp->get_individual_use() && array( $A ) === $cp->get_email_restrictions() && null === $cp->get_product_ids(), 'uso único, individual, e-mail restrito, sem restrição de produtos (toda a loja)' );
$r = ajax( 'tcd_cvr_activar', array( 'codigo' => $CODA, 'email' => $A ) );
verifica( $r instanceof RespostaJson && ! $r->ok, 'segunda activação do mesmo código recusada (m90136)' );
// limite de tentativas
$T = array(); $n429 = 0;
for ( $i = 0; $i < 12; $i++ ) { $r = ajax( 'tcd_cvr_activar', array( 'codigo' => $CODE, 'email' => 'tentativa' . $i . '@exemplo.pt' ) ); if ( $r instanceof RespostaJson && 429 === $r->estado ) { $n429++; } }
verifica( 2 === $n429, 'limite de 10 tentativas por hora e por IP (2 de 12 com 429)' );
$T = array();

echo "== 3. desconto só para essa conta e uma só vez ==\n";
$EU = 0; verifica( 0 === strpos( tst_valida_carrinho( $cupao ), 'recusado' ), 'sem sessão (mesmo escrevendo o código e o e-mail no formulário): recusado' );
$ub = tst_user( 60, $B, 'Pessoa B' );
$EU = 60; verifica( 0 === strpos( tst_valida_carrinho( $cupao ), 'recusado' ), 'sessão de outra conta: recusado' );
$EU = 1; verifica( 0 === strpos( tst_valida_carrinho( $cupao ), 'recusado' ), 'administrador também não o aplica por ela' );
$EU = $ua->ID; verifica( 'ok' === tst_valida_carrinho( $cupao ), 'sessão da conta do convite: válido' );
// conta que mudou de e-mail depois de activar
$ua->user_email = 'outro@exemplo.pt'; verifica( 0 === strpos( tst_valida_carrinho( $cupao ), 'recusado' ), 'se a conta mudar de e-mail, o cupão deixa de valer' ); $ua->user_email = $A;

echo "== 4. o pedido leva o e-mail, os contactos e o código ==\n";
list( $o1, $d1 ) = pedido_base( $ua->ID, 'escrito-no-form@exemplo.pt', '966000111' );
verifica( $CODA === $o1->get_meta( '_tcd_c52_convite' ), 'pedido da Base pelo Atlas com sessão leva o código do convite' );
$conta = $o1->get_meta( '_tcd_c52_conta' );
verifica( $A === $conta['email'] && 'sessao' === $conta['via'] && '966000111' === $conta['telefone_encomenda'], 'leva o e-mail da conta (não o do formulário) e o telefone' );
verifica( ! $o1->get_coupon_codes() && 500.0 === $o1->get_total() && empty( $d1['convite'] ) && '' === get_user_meta( $ua->ID, 'tcd_c52_usado_em' ), '4b: no pedido da Base os 10 % não se aplicam sozinhos (nada fica preso num pendente)' );
$EU = $ua->ID; verifica( 'ok' === tst_valida_carrinho( $cupao ), 'depois do pedido da Base, o desconto continua livre para o carrinho' );
// 4a: com a aplicação no Atlas ligada à mão, não se aplica se houver vale aplicado ou por confirmar
$O['tcd_c52_atlas_auto'] = '1';
$GLOBALS['tst_vale_meta'] = true; list( $o2, $d2 ) = pedido_base( $ua->ID, $A ); unset( $GLOBALS['tst_vale_meta'] );
verifica( ! $o2->get_coupon_codes() && 500.0 === $o2->get_total(), '4a: com _tcd_vale_por_confirmar na encomenda, os 10 % não se aplicam' );
$GLOBALS['tst_vale_resp'] = true; list( $o2b, $d2b ) = pedido_base( $ua->ID, $A ); unset( $GLOBALS['tst_vale_resp'] );
verifica( ! $o2b->get_coupon_codes(), '4a: com «vale» na resposta, os 10 % não se aplicam' );
list( $o2c, $d2c ) = pedido_base( $ua->ID, $A );
verifica( 450.0 === $o2c->get_total() && ! empty( $d2c['convite']['ok'] ), 'com tcd_c52_atlas_auto = 1 e sem vale, aplica-se no pedido da Base (500 → 450)' );
$o2c->status = 'cancelled'; do_action( 'woocommerce_order_status_cancelled', $o2c->id );
unset( $O['tcd_c52_atlas_auto'] );
// pedido anónimo com o e-mail do convite: regista, não desconta
list( $o3, $d3 ) = pedido_base( 0, $A );
verifica( $CODA === $o3->get_meta( '_tcd_c52_convite' ) && 'email_da_encomenda' === $o3->get_meta( '_tcd_c52_conta' )['via'] && ! $o3->get_coupon_codes(), 'pedido sem sessão com o e-mail do convite: leva o código, sem desconto' );
// outra pessoa com sessão escreve o e-mail do convite no formulário
list( $o4, $d4 ) = pedido_base( 60, $A );
verifica( ! $o4->get_coupon_codes() && 500.0 === $o4->get_total(), 'conta B com o e-mail de A no formulário: sem desconto' );
verifica( '' === $o4->get_meta( '_tcd_c52_convite' ), 'e a encomenda de B não fica atribuída ao convite de A' );
// checkout clássico com sessão: o desconto aplica-se aqui
$EU = $ua->ID; $oc = new WC_Order(); $oc->em = $A; $oc->cid = $ua->ID; $oc->total = 200.0; $rc = $oc->apply_coupon( $cupao );
do_action( 'woocommerce_checkout_create_order', $oc, array() ); $oc->save(); do_action( 'woocommerce_checkout_order_created', $oc );
verifica( true === $rc && 180.0 === $oc->get_total(), 'checkout com sessão: 10 % aplicados no servidor (200 → 180)' );
verifica( $CODA === $oc->get_meta( '_tcd_c52_convite' ) && (int) get_user_meta( $ua->ID, 'tcd_c52_usado_em' ) === $oc->id, 'checkout: encomenda leva o código e o uso fica registado' );
$EU = $ua->ID; verifica( 0 === strpos( tst_valida_carrinho( $cupao ), 'recusado' ), 'uma só vez: no carrinho seguinte já não vale' );
$od = new WC_Order(); $od->em = $A; $od->cid = $ua->ID; $od->cupoes = array( strtolower( $cupao ) ); $erro = '';
try { do_action( 'woocommerce_checkout_create_order', $od, array() ); } catch ( Exception $e ) { $erro = $e->getMessage(); }
verifica( false !== strpos( $erro, 'já foram usados' ), 'checkout em corrida com o mesmo cupão: recusado antes de gravar' );
// pagamento falhado: continua a contar; a nova tentativa da mesma encomenda passa
$oc->status = 'failed'; do_action( 'woocommerce_order_status_failed', $oc->id );
$EU = $ua->ID; verifica( 0 === strpos( tst_valida_carrinho( $cupao ), 'recusado' ), '«failed» continua a contar como usado (já não liberta)' );
$WCI->session->set( 'order_awaiting_payment', $oc->id ); $v = tst_valida_carrinho( $cupao ); $WCI->session->set( 'order_awaiting_payment', 0 );
verifica( 'ok' === $v, 'nova tentativa de pagamento da mesma encomenda: aceite' );
$oc->status = 'pending';
// cupão retirado: só conta «tirou» quando é a pessoa
do_action( 'woocommerce_removed_coupon', $cupao );
verifica( null === $WCI->session->get( 'tcd_c52_tirou' ), 'retirado pelo WooCommerce: volta a aplicar-se' );
$_GET['wc-ajax'] = 'remove_coupon'; do_action( 'woocommerce_removed_coupon', $cupao ); unset( $_GET['wc-ajax'] );
verifica( 1 === $WCI->session->get( 'tcd_c52_tirou' ), 'retirado pela pessoa (wc-ajax=remove_coupon): não volta' );
$WCI->session->set( 'tcd_c52_tirou', null );
// convite da equipa não reutiliza um convite do painel (Oferta Profissional) para o mesmo e-mail
$rr = rota( '/c52/convite', 'POST', array( 'email' => 'geral@empresa-x.pt' ), 187 )->get_data();
verifica( $rr['novo'] && $rr['codigo'] !== $CODE, 'convite da equipa não reutiliza o código da Oferta Profissional (só convites c52)' );
// recusas da activação ficam no registo
$lg = implode( ' | ', array_map( function ( $x ) { return $x['o']; }, (array) get_option( 'tcd_c52_log' ) ) );
verifica( false !== strpos( $lg, 'outro e-mail' ) && false !== strpos( $lg, 'sessão noutra conta' ) && false !== strpos( $lg, 'convite sem e-mail' ), 'recusas da activação registadas em tcd_c52_log' );

echo "== 5. lista da equipa ==\n";
$EU = 187; $l = array_values( array_filter( tcd_c52_lista( wp_get_current_user() ), function ( $x ) use ( $CODA ) { return $x['codigo'] === $CODA; } ) );
verifica( 2 === count( tcd_c52_lista( wp_get_current_user() ) ) && 1 === count( $l ) && $CODA === $l[0]['codigo'] && 'Ana' === $l[0]['por'] && 'encomendou' === $l[0]['estado'], 'Ana vê o seu convite: quem convidou, estado «encomendou»' );
$nums = array_map( function ( $e ) { return $e['numero']; }, $l[0]['encomendas'] );
verifica( '' !== $l[0]['criado'] && '' !== $l[0]['registado'] && in_array( (string) $o1->id, $nums, true ) && in_array( (string) $oc->id, $nums, true ), 'com data do convite, data do registo e as encomendas da conta' );
verifica( ! in_array( (string) $o3->id, $nums, true ), '7: pedido sem sessão só com o e-mail do formulário não conta como «encomendou»' );
$EU = 186; verifica( 0 === count( tcd_c52_lista( wp_get_current_user() ) ), 'Miguel não vê os convites da Ana' );
$EU = 4; verifica( count( tcd_c52_lista( wp_get_current_user() ) ) >= 2, 'Susana (vê clientes) vê todos' );
$EU = 1; $todos = array(); foreach ( tcd_c52_lista( wp_get_current_user() ) as $x ) { $todos[ $x['codigo'] ] = $x; }
verifica( isset( $todos[ $CODE ] ) && 'convidado' === $todos[ $CODE ]['estado'] && 'Nuno' === $todos[ $CODE ]['por'], 'Nuno vê todos; convite por activar fica «convidado»' );
$r = rota( '/c52/convites', 'GET', array(), 187 )->get_data();
verifica( 2 === count( $r['itens'] ) && ! in_array( $CODE, array_column( $r['itens'], 'codigo' ), true ), 'GET /tcd/v1/c52/convites devolve só os da própria pessoa (2 da Ana, sem os do Nuno)' );
verifica( 'sem_permissao' === rota( '/c52/convites', 'GET', array(), 50 ), 'cliente não lê a lista' );
// estado «registado»: novo convite activado sem encomenda
$EU = 187; $c2 = rota( '/c52/convite', 'POST', array( 'email' => 'pessoa.c@exemplo.pt', 'nome' => 'C' ), 187 )->get_data()['codigo'];
$T = array(); ajax( 'tcd_cvr_activar', array( 'codigo' => $c2, 'email' => 'pessoa.c@exemplo.pt' ) );
$EU = 187; $e = array(); foreach ( tcd_c52_lista( wp_get_current_user() ) as $x ) { $e[ $x['codigo'] ] = $x['estado']; }
verifica( 'registado' === ( $e[ $c2 ] ?? '' ), 'convite activado sem encomenda fica «registado»' );
// vista escapa o que vem da pessoa
$O['tcd_convites'][ $c2 ]['nome'] = '<script>x</script>';
$EU = 187; $v = tcd_c52_vista();
verifica( false === strpos( $v, '<script>x</script>' ) && false !== strpos( $v, '&lt;script&gt;x&lt;/script&gt;' ), 'vista escapa o nome' );

echo "== 6. interruptor ==\n";
$O['tcd_c52_off'] = '1';
$r = rota( '/c52/convite', 'POST', array( 'email' => 'd@exemplo.pt' ), 187 );
verifica( 'sem_permissao' === $r, 'com tcd_c52_off = 1 a rota fecha' );
$EU = 60; verifica( 0 === strpos( tst_valida_carrinho( $cupao ), 'recusado' ), 'com tcd_c52_off = 1 o cupão continua preso à sessão da conta' );
unset( $O['tcd_c52_off'] );

echo "\n$ok ok, $falhas falhas\n";
exit( $falhas ? 1 : 0 );
