<?php
// Testes do m90320. php teste-m90320.php
define( 'ABSPATH', __DIR__ . '/' );
$GLOBALS['f'] = array(); $GLOBALS['opt'] = array(); $GLOBALS['caps'] = array(); $GLOBALS['pag'] = true; $GLOBALS['enq'] = array();
function add_action( $h, $cb, $p = 10 ) { $GLOBALS['f'][ $h ][] = $cb; }
function add_filter( $h, $cb, $p = 10 ) { $GLOBALS['f'][ $h ][] = $cb; }
function apply_filters( $h, $v ) { foreach ( $GLOBALS['f'][ $h ] ?? array() as $cb ) { $v = $cb( $v ); } return $v; }
function get_option( $k, $d = false ) { return $GLOBALS['opt'][ $k ] ?? $d; }
function current_user_can( $c ) { return in_array( $c, $GLOBALS['caps'], true ); }
function is_page( $p ) { return $GLOBALS['pag']; }
function content_url( $p ) { return 'https://x/wp-content/' . $p; }
function wp_enqueue_script( $h, $u ) { $GLOBALS['enq'][] = $h; }
@mkdir( __DIR__ . '/../assets/atlas', 0777, true ); $falso = ! file_exists( __DIR__ . '/../assets/atlas/eu-camadas.js' );
if ( $falso ) { copy( __DIR__ . '/eu-camadas.js', __DIR__ . '/../assets/atlas/eu-camadas.js' ); }
require __DIR__ . '/m90320.php';
$n = 0; $fl = 0; function ok( $c, $m ) { global $n, $fl; $n++; echo ( $c ? 'ok    ' : 'FALHA ' ) . $m . "\n"; if ( ! $c ) { $fl++; } }
function corre() { $GLOBALS['enq'] = array(); foreach ( $GLOBALS['f']['wp_enqueue_scripts'] as $cb ) { $cb(); } return in_array( 'tcd-eucam-atlas', $GLOBALS['enq'], true ); }
ok( ! corre(), 'visitante sem permissão: não carrega' );
$GLOBALS['caps'] = array( 'manage_options' ); ok( corre(), 'administrador: carrega na página do Atlas' );
$GLOBALS['pag'] = false; ok( ! corre(), 'fora do Atlas: não carrega' ); $GLOBALS['pag'] = true;
$GLOBALS['opt']['tcd_eu_camadas_off'] = '1'; ok( ! corre(), 'interruptor desliga' ); unset( $GLOBALS['opt']['tcd_eu_camadas_off'] );
$GLOBALS['caps'] = array(); add_filter( 'tcd_eu_camadas_visivel', function ( $v ) { return true; } ); ok( corre(), 'registo europeu abre a todos pelo filtro' );
if ( $falso ) { unlink( __DIR__ . '/../assets/atlas/eu-camadas.js' ); @rmdir( __DIR__ . '/../assets/atlas' ); @rmdir( __DIR__ . '/../assets' ); }
echo "\n$n testes, $fl falhas\n";
