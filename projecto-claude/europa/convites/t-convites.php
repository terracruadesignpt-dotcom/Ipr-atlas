<?php
// Testes do m90302 (regras de envio dos convites por país). php t-convites.php
require '/home/claude/espanha/modulos/testes/wp-stub.php';
function wp_parse_url( $u, $c = -1 ) { return parse_url( $u, $c ); }
function absint( $v ) { return abs( (int) $v ); }
function wp_unslash( $v ) { return $v; }
function current_time( $t ) { return '2026-10-21 20:00:00'; }
function admin_url( $p ) { return '/wp-admin/' . $p; }
function wp_create_nonce( $a ) { return 'N'; }
$GLOBALS['__nonce_ok'] = true; function check_ajax_referer( $a, $b, $die = true ) { return $GLOBALS['__nonce_ok']; }
function sanitize_textarea_field( $s ) { return trim( (string) $s ); }
function shortcode_exists( $s ) { return isset( $GLOBALS['shortcode_tags'][ $s ] ); }
function add_shortcode( $t, $cb ) { $GLOBALS['shortcode_tags'][ $t ] = $cb; }
$GLOBALS['__meta'] = array();
function get_post_meta( $id, $k, $s = true ) { return $GLOBALS['__meta'][ $id ][ $k ] ?? ''; }
function update_post_meta( $id, $k, $v ) { $GLOBALS['__meta'][ $id ][ $k ] = $v; }
function delete_post_meta( $id, $k ) { unset( $GLOBALS['__meta'][ $id ][ $k ] ); }
class JsonFim extends Exception { public $d; function __construct( $d ) { $this->d = $d; } }
function wp_send_json_success( $d ) { throw new JsonFim( array( 'success' => true, 'data' => $d ) ); }
function wp_send_json_error( $d, $c = 400 ) { throw new JsonFim( array( 'success' => false, 'data' => $d ) ); }
// m90135 mínimo
$GLOBALS['__caps'] = array( 'manage_options' ); $GLOBALS['__user'] = 1;
function tcd_cv_pode() { return true; }
$GLOBALS['__conv'] = array(
	1 => array( 'nome' => 'Quinta PT', 'pais' => 'Portugal', 'email' => 'a@quinta.pt', 'site' => '' ),
	2 => array( 'nome' => 'Finca ES', 'pais' => 'Espanha', 'email' => 'b@finca.es', 'site' => '' ),
	3 => array( 'nome' => 'Hof DE', 'pais' => '', 'email' => 'c@hof.de', 'site' => '' ),
	4 => array( 'nome' => 'Ferme FR', 'pais' => 'France', 'email' => 'd@ferme.com', 'site' => '' ),
	5 => array( 'nome' => 'Sem país', 'pais' => '', 'email' => 'e@gmail.com', 'site' => 'https://example.com' ),
	6 => array( 'nome' => 'Farm UK', 'pais' => '', 'email' => 'f@farm.co.uk', 'site' => '' ),
	7 => array( 'nome' => 'Boerderij', 'pais' => '', 'email' => 'g@x.com', 'site' => 'https://boer.nl/' ),
);
function tcd_cv_ler( $id ) { if ( ! isset( $GLOBALS['__conv'][ $id ] ) ) { return null; } return array_merge( array( 'id' => $id, 'hist' => $GLOBALS['__meta'][ $id ]['_cv_hist'] ?? array() ), $GLOBALS['__conv'][ $id ] ); }
function tcd_cv_todos() { $o = array(); foreach ( array_keys( $GLOBALS['__conv'] ) as $i ) { $o[] = tcd_cv_ler( $i ); } return $o; }
$GLOBALS['__enviados'] = null;
add_action( 'wp_ajax_tcd_cv_enviar', function () { $GLOBALS['__enviados'] = $_POST['ids']; echo json_encode( array( 'success' => true, 'data' => array( 'enviados' => count( $_POST['ids'] ), 'amao' => 0, 'itens' => array_map( function ( $i ) { return array( 'id' => $i, 'canal' => 'site' ); }, $_POST['ids'] ) ) ) ); } ); // m90135 (prioridade 10)
add_shortcode( 'tcd_equipa', function () { return '<div>CRM</div>'; } );
require __DIR__ . '/m90302.php';

$isos = array(); foreach ( tcd_cv_todos() as $d ) { $isos[ $d['id'] ] = tcd_cvp_iso( $d ); }
ok( array( 1 => 'PT', 2 => 'ES', 3 => 'DE', 4 => 'FR', 5 => '?', 6 => 'GB', 7 => 'NL' ) === $isos, 'país pelo campo, pelo e-mail e pelo site (.co.uk = GB; gmail/.com = desconhecido)' );
ok( '' === tcd_cvp_motivo( tcd_cv_ler( 1 ) ) && '' === tcd_cvp_motivo( tcd_cv_ler( 6 ) ) && '' === tcd_cvp_motivo( tcd_cv_ler( 7 ) ), 'Portugal, Reino Unido e Países Baixos: pode convidar' );
ok( false !== strpos( tcd_cvp_motivo( tcd_cv_ler( 2 ) ), 'consentimento prévio' ) && false !== strpos( tcd_cvp_motivo( tcd_cv_ler( 3 ) ), 'DE:' ), 'Espanha e Alemanha: consentimento' );
ok( false !== strpos( tcd_cvp_motivo( tcd_cv_ler( 4 ) ), 'jurista' ) && false !== strpos( tcd_cvp_motivo( tcd_cv_ler( 5 ) ), 'País desconhecido' ), 'França e desconhecido: bloqueados' );

function enviar( $ids ) {
	$_POST = array( 'ids' => $ids, 'ofertas' => array( 'designer3' ), 'n' => 'N' ); $GLOBALS['__enviados'] = null;
	$lvl = ob_get_level(); ob_start();
	try { do_action( 'wp_ajax_tcd_cv_enviar' ); } catch ( JsonFim $e ) { while ( ob_get_level() > $lvl ) { ob_end_clean(); } return $e->d; }
	while ( ob_get_level() > $lvl + 1 ) { ob_end_flush(); } // como no fim do pedido: os buffers passam pela função
	return json_decode( ob_get_clean(), true );
}
$r = enviar( array( 1, 2, 3, 6 ) );
ok( array( 1, 6 ) === array_values( $GLOBALS['__enviados'] ), 'o m90135 só recebe as entradas de PT e GB' );
ok( 2 === $r['data']['bloqueados'] && 4 === count( $r['data']['itens'] ) && 'bloqueado' === $r['data']['itens'][2]['canal'] && '' === $r['data']['itens'][2]['mailto'], 'resposta junta os bloqueados, sem mailto' );
ok( false !== strpos( $GLOBALS['__meta'][2]['_cv_bloqueio']['motivo'], 'ES' ) && 'bloqueado' === end( $GLOBALS['__meta'][2]['_cv_hist'] )['canal'], 'motivo e histórico gravados na entrada' );
$r = enviar( array( 2, 4 ) );
ok( null === $GLOBALS['__enviados'] && 0 === $r['data']['enviados'] && 2 === $r['data']['bloqueados'], 'só bloqueados: o m90135 nem corre' );
$r = enviar( array( 1 ) ); ok( array( 1 ) === array_values( $GLOBALS['__enviados'] ) && ! isset( $r['data']['bloqueados'] ), 'só permitidos: nada muda' );

$_POST = array( 'id' => 2, 'consentimento' => 'pediu informação por e-mail a 21/10', 'n' => 'N' );
try { do_action( 'wp_ajax_tcd_cv_pais' ); } catch ( JsonFim $e ) { $j = $e->d; }
ok( $j['success'] && '' === $j['data']['motivo'], 'consentimento registado: Espanha passa a poder' );
$r = enviar( array( 2 ) ); ok( array( 2 ) === array_values( $GLOBALS['__enviados'] ), 'e o envio segue' );
$_POST = array( 'id' => 5, 'pais' => 'pt', 'n' => 'N' ); try { do_action( 'wp_ajax_tcd_cv_pais' ); } catch ( JsonFim $e ) { $j = $e->d; }
ok( 'PT' === $j['data']['pais'] && '' === $j['data']['motivo'], 'equipa fixa o país de uma entrada sem país' );
$_POST = array( 'id' => 4, 'consentimento' => 'x', 'n' => 'N' ); try { do_action( 'wp_ajax_tcd_cv_pais' ); } catch ( JsonFim $e ) { $j = $e->d; }
ok( false !== strpos( $j['data']['motivo'], 'jurista' ), 'França continua bloqueada mesmo com consentimento (até parecer)' );
$GLOBALS['__opt']['tcd_cv_regras_pais'] = '{"FR":"optout","DE":"mau"}'; ok( 'optout' === tcd_cvp_regra( 'FR' ) && 'consentimento' === tcd_cvp_regra( 'DE' ) && 'consentimento' === tcd_cvp_regra( 'CZ' ), 'opção muda a regra; valor inválido ignorado; não estudado = consentimento' );
$GLOBALS['__nonce_ok'] = false; $r = enviar( array( 3 ) ); ok( array( 3 ) === array_values( $GLOBALS['__enviados'] ), 'sem nonce o m90302 não decide (o m90135 recusa a seguir)' ); $GLOBALS['__nonce_ok'] = true;

do_action( 'init' ); $_GET = array( 'v' => 'convites' ); $h = call_user_func( $GLOBALS['shortcode_tags']['tcd_equipa'] );
ok( false !== strpos( $h, '<div>CRM</div>' ) && false !== strpos( $h, 'Regras de envio por país' ) && false !== strpos( $h, 'Hof DE' ), 'vista: quadro por país e lista de bloqueados depois do CRM' );
$_GET = array( 'v' => 'outro' ); ok( '<div>CRM</div>' === call_user_func( $GLOBALS['shortcode_tags']['tcd_equipa'] ), 'outras vistas não mudam' );
$GLOBALS['__opt']['tcd_cv_regras_off'] = '1'; $r = enviar( array( 3 ) ); ok( array( 3 ) === array_values( $GLOBALS['__enviados'] ), 'interruptor desliga o bloqueio' );
fim();
