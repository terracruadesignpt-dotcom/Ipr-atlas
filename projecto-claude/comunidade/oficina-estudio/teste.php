<?php
// Teste local dos módulos 90250 a 90252 com um WordPress de mentira. Corre: php teste.php
define( 'ABSPATH', __DIR__ );
define( 'DAY_IN_SECONDS', 86400 ); define( 'HOUR_IN_SECONDS', 3600 ); define( 'MINUTE_IN_SECONDS', 60 ); define( 'ARRAY_A', 'A' );
$GLOBALS['F'] = array(); $GLOBALS['M'] = array(); $GLOBALS['T'] = array(); $GLOBALS['shortcode_tags'] = array(); $GLOBALS['R'] = array(); $GLOBALS['NET'] = 0;
function add_filter( $h, $f, $p = 10, $n = 1 ) { $GLOBALS['F'][ $h ][] = $f; }
function add_action( $h, $f, $p = 10, $n = 1 ) { $GLOBALS['F'][ $h ][] = $f; }
function apply_filters( $h, $v ) { foreach ( $GLOBALS['F'][ $h ] ?? array() as $f ) { $v = $f( $v ); } return $v; }
function do_action( $h ) { foreach ( $GLOBALS['F'][ $h ] ?? array() as $f ) { $f(); } }
function add_shortcode( $t, $f ) { $GLOBALS['shortcode_tags'][ $t ] = $f; }
function get_option( $k, $d = false ) { return $d; }
function esc_html( $s ) { return htmlspecialchars( (string) $s, ENT_QUOTES ); } function esc_attr( $s ) { return esc_html( $s ); } function esc_url( $s ) { return esc_html( $s ); } function esc_url_raw( $s ) { return $s; }
function home_url( $p = '' ) { return 'https://x.pt' . $p; } function rest_url( $p ) { return 'https://x.pt/wp-json/' . $p; } function wp_create_nonce() { return 'n'; }
function wp_json_encode( $v, $f = 0 ) { return json_encode( $v, $f ); }
function get_transient( $k ) { return $GLOBALS['T'][ $k ] ?? false; } function set_transient( $k, $v, $t ) { $GLOBALS['T'][ $k ] = $v; }
function get_user_meta( $id, $k, $s = false ) { return $GLOBALS['M'][ $id ][ $k ] ?? ''; } function update_user_meta( $id, $k, $v ) { $GLOBALS['M'][ $id ][ $k ] = $v; } function delete_user_meta( $id, $k ) { unset( $GLOBALS['M'][ $id ][ $k ] ); }
function user_can( $u, $c ) { return false; } function current_user_can( $c ) { return false; } function is_user_logged_in() { return true; }
function sanitize_key( $s ) { return preg_replace( '/[^a-z0-9_\-]/', '', strtolower( (string) $s ) ); }
function date_i18n( $f, $t ) { return date( 'j/n/Y', $t ); } function current_time( $f ) { return date( $f ); } function human_time_diff( $t ) { return '3 dias'; }
function get_posts( $a ) { return array( 11, 12, 13 ); }
function get_user_by( $k, $v ) { return 'ana@c.pt' === $v ? (object) array( 'ID' => 9, 'first_name' => 'Ana', 'last_name' => 'Silva', 'display_name' => 'Ana' ) : false; }
function wc_get_order( $id ) { return null; } function wp_get_attachment_image_url( $id ) { return 'https://x.pt/f' . $id . '.jpg'; }
function wp_remote_get( $u, $a ) { $GLOBALS['NET']++;
	if ( false !== strpos( $u, 'open-meteo' ) ) { return array( 'code' => 200, 'body' => json_encode( array( 'daily' => array( 'time' => array( '2026-10-18', '2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22' ), 'precipitation_sum' => array( 2.5, 0, 0, 7.2, 12 ), 'temperature_2m_min' => array( 8, 7, 6, 0.5, 4 ), 'temperature_2m_max' => array( 20, 19, 21, 18, 17 ) ) ) ) ); }
	return array( 'code' => 200, 'body' => json_encode( array( 'local' => array( '1201' => array( 'data' => array( 'rcm' => 3 ), 'latitude' => 39.29, 'longitude' => -7.43 ), '0802' => array( 'data' => array( 'rcm' => 5 ), 'latitude' => 37.13, 'longitude' => -8.02 ) ) ) ) ); }
function is_wp_error( $x ) { return false; } function wp_remote_retrieve_response_code( $r ) { return $r['code']; } function wp_remote_retrieve_body( $r ) { return $r['body']; }
class WPDB { public $prefix = 'wp_'; function prepare( $q, ...$a ) { return $q; } function get_var( $q ) { return 'wp_tcd_mapa_acessos'; } function get_results( $q, $t ) { return array( array( 'email' => 'ana@c.pt', 'papel' => 'leitor', 'order_id' => 1, 'criado' => '2026-10-10' ), array( 'email' => 'rui@c.pt', 'papel' => 'editor', 'order_id' => 2, 'criado' => '2026-10-11' ) ); } }
$GLOBALS['wpdb'] = new WPDB();
// dependências dos outros módulos
function tcd_rede_e( $u = null ) { return true; }
function tcd_cdt_dados( $id ) {
	$g = array( 11 => array( -7.3264, 39.2686 ), 12 => array( -8.0154, 37.0352 ), 13 => array( -7.3, 39.27 ) );
	$c = $g[ $id ]; $d = 0.002;
	return array( 'nome' => 'Terreno ' . $id, 'local' => 'Local ' . $id, 'area_ha' => 1.07 * $id / 10, 'geo' => json_encode( array( 'type' => 'MultiPolygon', 'coordinates' => array( array( array( array( $c[0] - $d, $c[1] - $d ), array( $c[0] + $d, $c[1] - $d ), array( $c[0] + $d, $c[1] + $d ), array( $c[0] - $d, $c[1] - $d ) ) ) ) ) ), 'centro' => $c );
}
function tcd_cdt_codigo( $id ) { return sprintf( 'TC-%05d', $id ); }
function tcd_cdt_poligonos( $g ) { $g = json_decode( $g, true ); return $g['coordinates']; }
function tcd_cdt_bbox( $pls ) { $b = array( 180, 90, -180, -90 ); foreach ( $pls as $pl ) { foreach ( $pl[0] as $p ) { $b = array( min( $b[0], $p[0] ), min( $b[1], $p[1] ), max( $b[2], $p[0] ), max( $b[3], $p[1] ) ); } } return $b; }
function tcd_rede_bases( $u ) { return array( array( 'num' => 14905, 'local' => 'Souto Verde', 'ha' => 1.07, 'estado' => 'Por confirmar', 'vale' => '', 'data' => '19 Out 2026', 'pagar' => 'https://x.pt/pagar' ), array( 'num' => 14800, 'local' => 'Monte', 'ha' => 30, 'estado' => 'Em produção', 'vale' => 'OFERTA-X', 'data' => '1 Out', 'pagar' => '' ) ); }
function tcd_rede_encomendas_vale( $u ) { return array( 1 ); }
function tcd_rede_perfil_pct( $id ) { return 60; } function tcd_rede_perfil_passos( $id ) { return array( 'a' => array( 'Nome', true ), 'b' => array( 'Foto', false ) ); }
function tcd_rede_equipa() { return array( array( 'nome' => 'Nuno Mamede Santos', 'papel' => 'Direcção', 'url' => '', 'foto' => '' ) ); }
function tcd_rede_membros() { return array( 'lista' => array( array( 'nome' => 'Rui <b>', 'foto' => '', 'url' => '', 'verificado' => 1, 'concelho' => 'Évora' ) ), 'total' => 1 ); }
function tcd_rede_av( $f, $n ) { return '<span class="tcdo-av">' . esc_html( mb_substr( $n, 0, 1 ) ) . '</span>'; }
function tcd_cl_planos() { return array( 'base' => array( 'nome' => 'Base', 'projectos' => 1, 'pessoas' => 3, 'gb' => 2 ), 'designer' => array( 'nome' => 'Designer', 'projectos' => 3, 'pessoas' => 3, 'gb' => 5 ) ); }
function tcd_cl_estado( $e ) { return array( 'plano' => 'designer', 'ate' => time() + 10 * 86400, 'gb' => 5, 'proj_extra' => 0 ); }
function tcd_vgt_dados( $t ) { return 11 === $t ? array( 'serie' => array( '2026-07' => array( 'p' => 0.5 ), '2026-08' => array( 'p' => 0.45 ), '2026-09' => array( 'p' => 0.2 ) ), 'alerta' => array( 'x' => 1 ) ) : array( 'serie' => array(), 'alerta' => null ); }
function tcd_ftp_dados( $t ) { return 11 === $t ? array( 'pontos' => array( 'p1' => array( 'nome' => 'Charca' ) ), 'fotos' => array( array( 'p' => 'p1', 'data' => '2025-10-03', 'att' => 5 ), array( 'p' => 'p1', 'data' => '2026-04-03', 'att' => 6 ) ) ) : array( 'pontos' => array(), 'fotos' => array() ); }
function tcd_pf8_perfil( $id ) { return array( 's1' => 5, 's2' => 5, 's3' => 4, 's4' => 3, 's5' => 4, 's6' => 5, 'temas' => array( 3 ) ); }
function tcd_soc_perfil_row( $id ) { return array( 'alcunha' => 'ze' ); } function tcd_pro_verificado( $id ) { return false; }
add_shortcode( 'tcd_oficina', function () { return 'ANTIGA'; } );
require 'm90250.php'; require 'm90251.php'; require 'm90252.php';
do_action( 'init' );
$u = (object) array( 'ID' => 7, 'user_email' => 'pro@x.pt', 'first_name' => 'Zé', 'display_name' => 'Zé' );
function wp_get_current_user() { return $GLOBALS['U']; } $GLOBALS['U'] = $u;
$a = tcd_of_arranjo( $u ); echo 'Arranjo: ' . implode( ',', $a['ordem'] ) . ' | escondidos: ' . implode( ',', $a['ocultos'] ) . "\n";
$erros = 0;
foreach ( array_keys( tcd_of_blocos() ) as $id ) {
	$h = tcd_of_render( $id, $u );
	$ok = '' !== $h && false === strpos( $h, 'não carregou' );
	if ( ! $ok ) { $erros++; }
	echo str_pad( $id, 10 ) . ( $ok ? ' ok ' : ' FALHA ' ) . strlen( $h ) . " bytes\n";
	if ( false !== strpos( $h, '<b>Rui <b>' ) ) { echo "  ESCAPE FALHOU\n"; $erros++; }
}
tcd_of_render( 'tempo', $u ); echo 'Pedidos à rede depois de repetir (cache): ' . $GLOBALS['NET'] . "\n";
echo 'Fogo: ' . ( false !== strpos( tcd_of_render( 'fogo', $u ), 'Elevado' ) ? 'ok' : 'FALHA' ) . "\n";
echo 'Hoje: ' . substr_count( tcd_of_render( 'hoje', $u ), '<li' ) . " itens\n";
$p = call_user_func( $GLOBALS['shortcode_tags']['tcd_oficina'] );
echo 'Página: ' . ( false !== strpos( $p, 'data-of-grelha' ) ? 'nova' : 'ANTIGA' ) . ', ' . strlen( $p ) . " bytes\n";
preg_match( '#<script>(\(function.*)</script>#s', $p, $m ); file_put_contents( __DIR__ . '/ui.js', $m[1] ?? '' );
file_put_contents( __DIR__ . '/pagina.html', '<!doctype html><meta charset="utf-8"><body>' . $p );
$GLOBALS['T'] = array();
foreach ( array( 'hoje', 'mapa', 'tempo', 'fotos', 'clientes', 'plano' ) as $id ) { file_put_contents( __DIR__ . '/b_' . $id . '.html', tcd_of_render( $id, $u ) ); }
echo $erros ? "ERROS: $erros\n" : "Tudo certo.\n";
