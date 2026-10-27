<?php
// Testes dos módulos de Espanha com o m90071 e o m90024 alterados. Corre-se: php t-espanha.php
require __DIR__ . '/wp-stub.php';
function wp_parse_url( $u, $c = -1 ) { return parse_url( $u, $c ); }
function wp_doing_ajax() { return false; }
function is_404() { return false; }
function shortcode_exists( $s ) { return false; }
function tcd_area_geometria( $g ) { return 50000.0; }
$M = __DIR__ . '/..';
define( 'TCD_LINGUA_URL', 'es' );
foreach ( array( 'm90024', 'm90071', 'm90240', 'm90241', 'm90242', 'm90243', 'm90244', 'm90245' ) as $m ) { require "$M/$m.php"; }

$GLOBALS['__opt']['tcd_esp_aberto'] = '1';
// --- traduções REST e e-mail
ok( 'es' === tcd_i18n_lingua(), 'língua es pelo prefixo' );
$res = new WP_REST_Response( array( 'code' => 'tcd_dados', 'message' => 'Faltam o nome, um e-mail válido ou a aceitação da política de privacidade.', 'data' => array( 'status' => 400 ) ) );
$res = apply_filters( 'rest_post_dispatch', $res, null, new WP_REST_Request( 'POST', '/tcd/v1/pedido-base' ) );
ok( 0 === strpos( $res->data['message'], 'Faltan el nombre' ), 'erro REST traduzido: ' . $res->data['message'] );
$res = new WP_REST_Response( array( 'cobertura' => 'fora', 'nota' => 'Fora do continente: confirmamos à mão.' ) );
$res = apply_filters( 'rest_post_dispatch', $res, null, new WP_REST_Request( 'POST', '/tcd/v1/lidar-cobertura' ) );
ok( false !== strpos( $res->data['nota'], 'PNOA-LiDAR' ), 'nota de cobertura em Espanha' );
$res = new WP_REST_Response( array( 'message' => 'Este pedido já foi recebido há 7 min. Não é preciso enviar de novo: a confirmação segue por e-mail.' ) );
$res = apply_filters( 'rest_post_dispatch', $res, null, new WP_REST_Request( 'POST', '/tcd/v1/pedido-base' ) );
ok( false !== strpos( $res->data['message'], '7' ) && false === strpos( $res->data['message'], 'recebido' ), 'padrão com %s: ' . $res->data['message'] );
$res = new WP_REST_Response( array( 'message' => 'Texto que ninguém traduziu.' ) );
$res = apply_filters( 'rest_post_dispatch', $res, null, new WP_REST_Request( 'GET', '/wp/v2/posts' ) );
ok( 'Texto que ninguém traduziu.' === $res->data['message'], 'rotas fora de tcd/v1 não mexem' );
$m = apply_filters( 'wp_mail', array( 'subject' => 'Recebemos o seu pedido da Base Cartográfica', 'message' => "Olá Ana,\n\nReferência do pedido: 20261020-ABC\n\nTerracrua Design" ) );
ok( 0 === strpos( $m['subject'], 'Hemos recibido' ), 'assunto do e-mail: ' . $m['subject'] );
ok( false !== strpos( $m['message'], 'Hola, Ana:' ) && false !== strpos( $m['message'], 'Referencia del pedido: 20261020-ABC' ), 'corpo do e-mail traduzido' );
$GLOBALS['__opt']['tcd_esp_aberto'] = '0'; $GLOBALS['__caps'] = array();
$m = apply_filters( 'wp_mail', array( 'subject' => 'Recebemos o seu pedido da Base Cartográfica', 'message' => '' ) );
ok( 0 === strpos( $m['subject'], 'Recebemos' ), 'com Espanha fechada e sem ser admin, nada se traduz' );

fim();
