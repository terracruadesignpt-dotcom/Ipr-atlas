<?php
// Testes do m90260 (ES-11). Corre-se: php t-es11.php
require '/home/claude/espanha/modulos/testes/wp-stub.php';
function absint( $v ) { return abs( (int) $v ); }
function wp_unslash( $v ) { return $v; }
function sanitize_email( $e ) { return trim( (string) $e ); }
function sanitize_textarea_field( $s ) { return trim( strip_tags( (string) $s ) ); }
function wp_strip_all_tags( $s ) { return strip_tags( (string) $s ); }
function wc_price( $v, $a = array() ) { return number_format( (float) $v, 2, ',', '.' ) . ' €'; }
function wp_date( $f, $t ) { return gmdate( $f, $t ); }
function admin_url( $p ) { return 'https://terracruadesign.pt/wp-admin/' . $p; }
function make_clickable( $s ) { return $s; }
function wp_create_nonce( $a ) { return 'N-' . $a; }
function wp_verify_nonce( $n, $a ) { return 'N-' . $a === $n; }
function wp_generate_password( $n ) { return substr( md5( mt_rand() ), 0, $n ); }
function get_userdata( $i ) { return null; }
function add_shortcode( $t, $cb ) { $GLOBALS['__sc'][ $t ] = $cb; }
function wp_mail( $to, $s, $b, $h = array() ) { $GLOBALS['__mail'][] = array( $to, $s, $b ); return true; }
function wc_add_notice( $m, $t ) { $GLOBALS['__notice'][] = array( $m, $t ); }
function tcd_esp_lingua_es() { return true; }
$GLOBALS['__fila'] = array();
function tcd_wk_por_na_fila( $o, $n ) { $o->update_meta_data( '_tcd_job_estado', 'aguarda' ); $GLOBALS['__fila'][] = $o->get_id(); return true; }

class D { public $t; function __construct( $t ) { $this->t = $t; } function getTimestamp() { return $this->t; } }
class P { public $s; function __construct( $s ) { $this->s = $s; } function get_sku() { return $this->s; } }
class It { public $p; public $s; public $n; function __construct( $p, $s, $n ) { $this->p = $p; $this->s = $s; $this->n = $n; } function get_product_id() { return $this->p; } function get_product() { return new P( $this->s ); } function get_name() { return $this->n; } }
class O {
	public $id; public $meta = array(); public $items = array(); public $st = 'pending'; public $pais = 'ES'; public $emp = ''; public $pago = null; public $notas = array(); public $cliente = 0;
	function __construct( $id, $items ) { $this->id = $id; $this->items = $items; $GLOBALS['__ord'][ $id ] = $this; foreach ( $items as $i ) { if ( in_array( $i->p, array( 14471, 14472 ), true ) ) { $this->meta['_tcd_geojson'] = '{}'; } } }
	function get_id() { return $this->id; } function get_order_number() { return (string) $this->id; } function get_order_key() { return 'wc_order_K' . $this->id; }
	function get_meta( $k ) { return $this->meta[ $k ] ?? ''; } function update_meta_data( $k, $v ) { $this->meta[ $k ] = $v; } function delete_meta_data( $k ) { unset( $this->meta[ $k ] ); }
	function save() {} function save_meta_data() {} function add_order_note( $n ) { $this->notas[] = $n; }
	function get_items() { return $this->items; } function get_billing_country() { return $this->pais; } function get_billing_company() { return $this->emp; }
	function get_billing_email() { return 'cliente@ejemplo.es'; } function get_billing_first_name() { return 'Ana'; } function get_billing_last_name() { return 'Ruiz'; }
	function get_status() { return $this->st; } function get_date_paid() { return $this->pago ? new D( $this->pago ) : null; } function get_date_created() { return new D( time() - 3600 ); }
	function get_total() { return 121.0; } function get_currency() { return 'EUR'; } function get_customer_id() { return $this->cliente; }
}
function wc_get_order( $id ) { return $GLOBALS['__ord'][ $id ] ?? false; }
function wc_get_orders( $a ) { $r = array(); foreach ( $GLOBALS['__ord'] as $o ) { if ( in_array( $o->st, $a['status'], true ) && $o->get_meta( '_tcd_job_estado' ) === $a['meta_query'][0]['value'] ) { $r[] = $o->id; } } return $r; }
function is_checkout_pay_page() { return true; }
$wp = (object) array( 'query_vars' => array() );

require __DIR__ . '/m90260.php';
$base = new It( 14471, '', 'Base Cartográfica' ); $leit = new It( 14472, '', 'Leitura Territorial' ); $cloud = new It( 14912, 'IPR-CLOUD-ESTUDIO', 'IPR Cloud Estúdio' ); $vale = new It( 14659, 'tcd-vale-100', 'Vale' );

ok( array( 'c1', 'c2' ) === tcd_es11_caixas_itens( tcd_es11_itens( new O( 1, array( $leit, $base ) ) ) ), 'Base + Leitura → caixas C.1 e C.2 por esta ordem' );
ok( array( 'c3' ) === tcd_es11_caixas_itens( tcd_es11_itens( new O( 2, array( $cloud, $vale ) ) ) ), 'IPR Cloud → C.3; vale-oferta sem caixa' );

// Página de pagamento.
$o = new O( 10, array( $base ) ); $wp->query_vars['order-pay'] = 10;
ob_start(); do_action( 'woocommerce_pay_order_before_submit' ); $h = ob_get_clean();
ok( false !== strpos( $h, 'name="tcd_es_c1"' ) && false === strpos( $h, 'name="tcd_es_c1" value="1" checked' ) && false !== strpos( $h, '121,00 €' ), 'order-pay ES: caixa C.1 desmarcada e total na linha D' );
ok( 'Pedido con obligación de pago' === apply_filters( 'woocommerce_pay_order_button_text', 'Pagar' ), 'botão com a fórmula do art. 98.2' );
ok( false === apply_filters( 'woocommerce_checkout_show_terms', true ), 'caixa de termos portuguesa escondida na encomenda espanhola' );
$pt = new O( 11, array( $base ) ); $pt->pais = 'PT'; $wp->query_vars['order-pay'] = 11;
ob_start(); do_action( 'woocommerce_pay_order_before_submit' ); ok( '' === ob_get_clean() && 'Pagar' === apply_filters( 'woocommerce_pay_order_button_text', 'Pagar' ), 'encomenda portuguesa: nada muda' );

$GLOBALS['__notice'] = array(); $_POST = array( 'tcd_es_tipo' => 'particular' );
do_action( 'woocommerce_before_pay_action', $o );
ok( 1 === count( $GLOBALS['__notice'] ) && 'error' === $GLOBALS['__notice'][0][1] && ! $o->get_meta( '_tcd_es11' ), 'sem a caixa dos Términos: erro e nada gravado (o WooCommerce não cobra)' );
$GLOBALS['__notice'] = array(); $_POST = array( 'tcd_es_tipo' => 'particular', 'tcd_es_c4' => '1' );
do_action( 'woocommerce_before_pay_action', $o );
$r = $o->get_meta( '_tcd_es11' );
ok( ! $GLOBALS['__notice'] && 'particular' === $r['tipo'] && false === $r['caixas']['c1']['marcada'] && false !== strpos( $r['caixas']['c1']['texto'], 'pierdo mi derecho' ) && $r['t'] > 0, 'gravado: tipo, texto exacto da C.1 não marcada, data e hora' );

// Início diferido.
$o->st = 'processing'; $o->pago = time() - 60; do_action( 'woocommerce_order_status_processing', 10 );
ok( 'diferido' === $o->get_meta( '_tcd_job_estado' ) && (int) $o->get_meta( '_tcd_es11_inicio' ) - $o->pago > 14 * 86400 && (int) $o->get_meta( '_tcd_es11_inicio' ) - $o->pago <= 15 * 86400, 'particular sem C.1 → diferido 14 dias (o m14618 não o põe na fila)' );
ok( 0 === tcd_es11_soltar() && 'diferido' === $o->get_meta( '_tcd_job_estado' ), 'antes do fim do prazo o cron não solta' );
$o->meta['_tcd_es11_inicio'] = time() - 1;
ok( 1 === tcd_es11_soltar() && 'aguarda' === $o->get_meta( '_tcd_job_estado' ) && in_array( 10, $GLOBALS['__fila'], true ), 'terminado o prazo, entra na fila' );

$o2 = new O( 12, array( $base ) ); $wp->query_vars['order-pay'] = 12; $_POST = array( 'tcd_es_tipo' => 'particular', 'tcd_es_c4' => '1', 'tcd_es_c1' => '1' );
do_action( 'woocommerce_before_pay_action', $o2 ); $o2->st = 'processing'; $o2->pago = time(); do_action( 'woocommerce_order_status_processing', 12 );
ok( '' === $o2->get_meta( '_tcd_job_estado' ), 'com C.1 marcada segue o caminho normal (fila do m14618)' );
$o3 = new O( 13, array( $base ) ); $_POST = array( 'tcd_es_tipo' => 'empresa', 'tcd_es_c4' => '1' );
do_action( 'woocommerce_before_pay_action', $o3 ); $o3->st = 'processing'; do_action( 'woocommerce_order_status_processing', 13 );
ok( '' === $o3->get_meta( '_tcd_job_estado' ) && ! isset( $o3->get_meta( '_tcd_es11' )['caixas']['c1'] ), 'empresa: sem caixas de consumidor e sem diferimento' );
$o4 = new O( 14, array( $base ) ); $o4->st = 'completed'; do_action( 'woocommerce_order_status_completed', 14 );
ok( 'diferido' === $o4->get_meta( '_tcd_job_estado' ), 'sem registo (vale que cobre tudo) e sem empresa → protecção do consumidor, diferido' );

// Desistência.
$o2->meta['_tcd_job_estado'] = 'a_processar';
ok( ! tcd_es11_pode_desistir( $o2 ), 'Base com C.1 marcada e processamento começado: sem botão' );
$o5 = new O( 15, array( $base ) ); $o5->st = 'processing'; $o5->pago = time(); $o5->meta['_tcd_lingua'] = 'es'; tcd_es11_gravar( $o5, 'particular', array(), 'order-pay' ); tcd_es11_ao_pagar( 15 );
$a = apply_filters( 'woocommerce_my_account_my_orders_actions', array(), $o5 );
ok( isset( $a['tcd_desistir'] ) && false !== strpos( $a['tcd_desistir']['url'], '/es/desistimiento/?pedido=15&k=wc_order_K15' ), 'Base diferida: botão «Desistir del contrato aquí» com a chave' );
$o13 = $o3; ok( ! tcd_es11_pode_desistir( $o13 ), 'empresa: sem botão' );
$o6 = new O( 16, array( $leit ) ); $o6->st = 'completed'; $o6->pago = time() - 15 * 86400; tcd_es11_gravar( $o6, 'particular', array( 'c2' ), 'order-pay' );
ok( ! tcd_es11_pode_desistir( $o6 ), 'passados 14 dias: sem botão' );

$_GET = array( 'pedido' => 15, 'k' => 'wc_order_K15' ); $_SERVER['REQUEST_METHOD'] = 'GET';
$h = tcd_es11_ecra();
ok( false !== strpos( $h, 'value="Ana Ruiz"' ) && false !== strpos( $h, 'Confirmar desistimiento' ) && false !== strpos( $h, 'readonly' ), 'ecrã com os dados preenchidos' );
$_GET = array( 'pedido' => 15, 'k' => 'errada' ); $h = tcd_es11_ecra();
ok( false === strpos( $h, 'Ana Ruiz' ), 'chave errada: não mostra os dados da encomenda' );

$GLOBALS['__mail'] = array();
$_POST = array( 'tcd_es11_n' => 'N-tcd_es11_desist', 'pedido' => 15, 'k' => 'wc_order_K15', 'nombre' => 'Ana Ruiz', 'email' => 'atacante@ejemplo.es', 'motivo' => 'Cambio de planes', 'numero' => '15' );
$res = tcd_es11_processar();
ok( 'ok' === $res['r'] && $o5->get_meta( '_tcd_es11_desist' ) && 'desistido' === $o5->get_meta( '_tcd_job_estado' ), 'desistência registada; a Base diferida nunca entra na fila' );
$m = $GLOBALS['__mail'][0];
ok( 'cliente@ejemplo.es' === $m[0] && 'Hemos recibido su desistimiento · Pedido n.º 15' === $m[1] && false !== strpos( $m[2], 'Cambio de planes' ) && false !== strpos( $m[2], 'hora de Lisboa' ), 'confirmação só para o e-mail da encomenda, com data, hora e texto' );
ok( 2 === count( $GLOBALS['__mail'] ) && 'info@terracruadesign.pt' === $GLOBALS['__mail'][1][0], 'aviso à equipa; nada para o e-mail escrito no formulário' );
$GLOBALS['__tr']['tcd_es11_res_X1'] = $res; $_GET = array( 'tcd_es11_r' => 'X1' );
ok( false !== strpos( tcd_es11_ecra(), 'Hemos recibido su decisión' ), 'depois do redireccionamento a página mostra a confirmação' );
$o5->meta['_tcd_es11_inicio'] = time() - 1; tcd_es11_soltar(); ok( 'desistido' === $o5->get_meta( '_tcd_job_estado' ), 'cron não solta encomenda desistida' );

// Nonce caducado (página em cache): não se perde; fica para a equipa.
$o7 = new O( 17, array( $leit ) ); $o7->st = 'processing'; $o7->pago = time(); tcd_es11_gravar( $o7, 'particular', array( 'c2' ), 'order-pay' );
$GLOBALS['__mail'] = array(); $GLOBALS['__tr'] = array();
$_POST = array( 'tcd_es11_n' => 'caducado', 'pedido' => 17, 'k' => 'wc_order_K17', 'nombre' => 'Ana', 'email' => 'cliente@ejemplo.es', 'numero' => '17' );
$res = tcd_es11_processar();
ok( 'verificar' === $res['r'] && ! $o7->get_meta( '_tcd_es11_desist' ) && 1 === count( get_option( 'tcd_es11_livres' ) ) && 'info@terracruadesign.pt' === $GLOBALS['__mail'][0][0], 'nonce inválido: sem desistência automática, mas registado para a equipa' );
// Formulário sem chave: número + e-mail da encomenda.
$GLOBALS['__mail'] = array();
$_POST = array( 'tcd_es11_n' => 'N-tcd_es11_desist', 'nombre' => 'Ana', 'email' => 'otro@ejemplo.es', 'numero' => '17' );
$res = tcd_es11_processar(); ok( 'verificar' === $res['r'] && ! $o7->get_meta( '_tcd_es11_desist' ) && 1 === count( $GLOBALS['__mail'] ) && 'info@terracruadesign.pt' === $GLOBALS['__mail'][0][0], 'e-mail que não confere: fica para a equipa verificar, sem e-mail a terceiros' );
$_POST['email'] = 'cliente@ejemplo.es'; $res = tcd_es11_processar(); ok( 'ok' === $res['r'] && (bool) $o7->get_meta( '_tcd_es11_desist' ), 'número e e-mail certos: desistência registada' );
for ( $i = 0; $i < 10; $i++ ) { tcd_es11_processar(); }
ok( 'limite' === tcd_es11_processar()['r'], 'limite de 8 por hora e por IP' );

// Vales: sem caixa, mas com desistência.
$o10 = new O( 20, array( $vale ) ); $o10->st = 'processing'; $o10->pago = time(); tcd_es11_gravar( $o10, 'particular', array(), 'order-pay' );
ok( tcd_es11_pode_desistir( $o10 ) && 1 === count( tcd_es11_paragrafos( $o10 ) ), 'vale-oferta: desistência e F.5' );

// Prazo: fim do 14.º dia natural, hora de Lisboa (o dia do contrato não conta).
$o11 = new O( 21, array( $base ) ); $o11->pago = 1793530800; // 2026-11-01 11:00 UTC (= Lisboa, hora de Inverno)
ok( 1794787199 === tcd_es11_fim_prazo( $o11 ), 'contrato a 1/11 às 9h → prazo até 15/11 às 23:59:59' );

// Guarda da Store API.
$o12 = new O( 22, array( $cloud ) ); $erro = '';
try { do_action( 'woocommerce_rest_checkout_process_payment_with_context', (object) array( 'order' => $o12 ), null ); } catch ( Exception $e ) { $erro = $e->getMessage(); }
ok( false !== strpos( $erro, 'marque las casillas' ), 'Store API: encomenda ES sem consentimento não é cobrada' );
tcd_es11_gravar( $o12, 'empresa', array(), 'block' ); $erro = '';
try { do_action( 'woocommerce_rest_checkout_process_payment_with_context', (object) array( 'order' => $o12 ), null ); } catch ( Exception $e ) { $erro = $e->getMessage(); }
ok( '' === $erro, 'com o registo, segue' );
$o13b = new O( 23, array( $cloud ) ); $o13b->pais = 'PT'; $erro = '';
try { do_action( 'woocommerce_rest_checkout_process_payment_with_context', (object) array( 'order' => $o13b ), null ); } catch ( Exception $e ) { $erro = $e->getMessage(); }
ok( '' === $erro, 'encomenda portuguesa: a guarda não intervém' );

// E-mail de confirmação.
$e = (object) array( 'id' => 'customer_processing_order' ); $o8 = new O( 18, array( $base ) ); $o8->pago = time(); tcd_es11_gravar( $o8, 'particular', array(), 'order-pay' );
ob_start(); do_action( 'woocommerce_email_order_meta', $o8, false, true, $e ); $t = ob_get_clean();
ok( false !== strpos( $t, 'no ha pedido el inicio inmediato' ) && false !== strpos( $t, '/es/desistimiento/?pedido=18' ), 'e-mail: F.2 e F.5 com a ligação de desistência' );
ob_start(); do_action( 'woocommerce_email_order_meta', $o8, false, true, (object) array( 'id' => 'customer_completed_order' ) );
ok( '' === ob_get_clean(), 'não repete no e-mail de concluída' );
ob_start(); do_action( 'woocommerce_email_order_meta', $o2, false, true, $e ); $t = ob_get_clean();
ok( false !== strpos( $t, 'perdía su derecho' ), 'F.1 quando a C.1 foi marcada' );
$o9 = new O( 19, array( $cloud ) ); $o9->st = 'processing'; $o9->pago = time(); tcd_es11_gravar( $o9, 'particular', array(), 'block' ); tcd_es11_ao_pagar( 19 );
ok( '' === $o9->get_meta( '_tcd_job_estado' ) && 1 === count( $o9->notas ) && false !== strpos( $o9->notas[0], 'confirmar à mão' ), 'IPR Cloud sem C.3: não mexe na fila, deixa nota à equipa' );
tcd_es11_ao_pagar( 19 ); ok( 1 === count( $o9->notas ), 'a nota não se repete' );
$GLOBALS['__opt']['tcd_es11_off'] = '1'; ok( ! tcd_es11_es( $o5 ), 'interruptor desliga tudo' );
// ---------- v-Europa: Portugal e resto da UE ----------
$GLOBALS['__opt']['tcd_es11_off'] = '0';
$p1 = new O( 30, array( $base ) ); $p1->pais = 'PT'; $p1->st = 'processing'; $p1->pago = time();
ok( ! tcd_es11_es( $p1 ), 'Portugal sem tcd_es11_eu_on: nada muda (caminho português actual)' );
$wp->query_vars['order-pay'] = 30; ob_start(); do_action( 'woocommerce_pay_order_before_submit' ); ok( '' === ob_get_clean(), 'Portugal desligado: página de pagamento igual' );
$GLOBALS['__opt']['tcd_es11_eu_on'] = '1';
ok( tcd_es11_es( $p1 ) && 'pt' === tcd_es11_lg( $p1 ), 'com tcd_es11_eu_on, Portugal abrangido, em português' );
ob_start(); do_action( 'woocommerce_pay_order_before_submit' ); $h = ob_get_clean();
ok( false !== strpos( $h, 'Peço expressamente' ) && false !== strpos( $h, '/terms-conditions/' ) && false !== strpos( $h, 'Compra como' ), 'pagamento em português, com os Termos portugueses' );
ok( 'Encomenda com obrigação de pagar' === apply_filters( 'woocommerce_pay_order_button_text', 'Pagar' ), 'botão em português' );
$GLOBALS['__notice'] = array(); $_POST = array( 'tcd_es_tipo' => 'particular' ); do_action( 'woocommerce_before_pay_action', $p1 );
ok( false !== strpos( $GLOBALS['__notice'][0][0], 'Termos e Condições' ), 'erro em português sem a caixa dos Termos' );
tcd_es11_gravar( $p1, 'particular', array(), 'order-pay' ); $p1->meta['_tcd_job_estado'] = ''; unset( $p1->meta['_tcd_job_estado'] ); tcd_es11_ao_pagar( 30, $p1 );
ok( 'diferido' === $p1->get_meta( '_tcd_job_estado' ), 'Portugal: particular sem C.1 também fica diferido' );
$a = apply_filters( 'woocommerce_my_account_my_orders_actions', array(), $p1 );
ok( 'Resolver o contrato aqui' === $a['tcd_desistir']['name'] && false !== strpos( $a['tcd_desistir']['url'], '/livre-resolucao/?pedido=30' ), 'botão «Resolver o contrato aqui» com a página portuguesa' );
$GLOBALS['__mail'] = array(); $GLOBALS['__tr'] = array();
$_POST = array( 'tcd_es11_n' => 'N-tcd_es11_desist', 'pedido' => 30, 'k' => 'wc_order_K30', 'nombre' => 'Rui', 'email' => 'cliente@ejemplo.es', 'numero' => '30', 'lg' => 'pt' );
$res = tcd_es11_processar();
ok( 'ok' === $res['r'] && 'pt' === $res['lg'] && 'Recebemos a sua resolução do contrato · Encomenda n.º 30' === $GLOBALS['__mail'][0][1] && false !== strpos( $GLOBALS['__mail'][0][2], 'Resolvo o contrato' ), 'resolução registada e e-mail em português' );
ok( false !== strpos( $GLOBALS['__mail'][1][1], '(PT)' ), 'aviso à equipa com o país' );
$p2 = new O( 31, array( $leit ) ); $p2->pais = 'DE'; $p2->pago = time(); $p2->st = 'processing'; tcd_es11_gravar( $p2, 'particular', array( 'c2' ), 'order-pay' );
ob_start(); do_action( 'woocommerce_email_order_meta', $p2, false, true, (object) array( 'id' => 'customer_processing_order' ) ); $txt = ob_get_clean();
ok( 'en' === tcd_es11_lg( $p2 ) && false !== strpos( $txt, 'expressly requested' ) && false !== strpos( $txt, '/withdrawal/?pedido=31' ), 'Alemanha: parágrafos em inglês com a página /withdrawal/' );
$p3 = new O( 32, array( $leit ) ); $p3->pais = 'US'; ok( ! tcd_es11_es( $p3 ), 'fora da UE: não abrangido' );
$GLOBALS['__opt']['tcd_es11_paginas'] = '{"pt":{"desist":"/resolucao/"}}';
ok( false !== strpos( tcd_es11_url_desistir( $p1 ), '/resolucao/' ), 'página portuguesa configurável pela opção' );
$_GET = array(); $h = tcd_es11_ecra( array( 'lg' => 'pt' ) ); ok( false !== strpos( $h, 'Confirmar a resolução' ) && false !== strpos( $h, 'name="lg" value="pt"' ), 'ecrã [tcd_desistir lg="pt"] em português' );
$h = tcd_es11_ecra( array( 'lg' => 'en' ) ); ok( false !== strpos( $h, 'Confirm withdrawal' ), 'ecrã em inglês' );
fim();
