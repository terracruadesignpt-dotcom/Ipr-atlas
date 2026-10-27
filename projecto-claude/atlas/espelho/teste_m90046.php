<?php
// Testes do m90046 com um WordPress falso em memória. php teste_m90046.php
define( 'ABSPATH', '/' ); define( 'DAY_IN_SECONDS', 86400 ); define( 'MINUTE_IN_SECONDS', 60 );
class WP_Error { public $m; function __construct( $c, $m ) { $this->m = $m; } function get_error_message() { return $this->m; } }
class Saida extends Exception { public $ok; public $data; function __construct( $ok, $d ) { $this->ok = $ok; $this->data = $d; } }
$P = array(); $M = array(); $O = array(); $T = array(); $H = array(); $MAIL_OK = false; $MAILS = array(); $TG = array();
function is_wp_error( $x ) { return $x instanceof WP_Error; }
function add_action( $h, $f, $p = 10, $n = 1 ) { global $H; $H[ $h ][ $p ][] = $f; }
function add_filter( $h, $f, $p = 10, $n = 1 ) { add_action( $h, $f, $p, $n ); }
function remove_action( $h, $f, $p = 10 ) { global $H; foreach ( $H[ $h ][ $p ] ?? array() as $i => $g ) { if ( $g === $f ) { unset( $H[ $h ][ $p ][ $i ] ); } } }
function do_action( $h, ...$a ) { global $H; $l = $H[ $h ] ?? array(); ksort( $l ); foreach ( $l as $fs ) { foreach ( $fs as $f ) { $f( ...$a ); } } }
function get_option( $k, $d = false ) { global $O; return array_key_exists( $k, $O ) ? $O[ $k ] : $d; }
function update_option( $k, $v, $a = null ) { global $O; $O[ $k ] = $v; return true; }
function add_option( $k, $v, $x = '', $a = null ) { global $O; if ( array_key_exists( $k, $O ) ) { return false; } $O[ $k ] = $v; return true; }
function delete_option( $k ) { global $O; unset( $O[ $k ] ); }
function get_transient( $k ) { global $T; return $T[ $k ] ?? false; } function set_transient( $k, $v, $t ) { global $T; $T[ $k ] = $v; } function delete_transient( $k ) { global $T; unset( $T[ $k ] ); }
function get_post( $id ) { global $P; return isset( $P[ $id ] ) ? (object) $P[ $id ] : null; }
function get_post_type( $id ) { global $P; return $P[ $id ]['post_type'] ?? false; }
function get_posts( $a ) { global $P, $M; $r = array(); foreach ( $P as $id => $p ) { if ( $p['post_type'] !== $a['post_type'] ) { continue; } if ( isset( $a['meta_key'] ) && ( $M[ $id ][ $a['meta_key'] ][0] ?? null ) !== $a['meta_value'] ) { continue; } $r[] = $id; } sort( $r ); return $r; }
function get_post_meta( $id, $k, $s = false ) { global $M; return $M[ $id ][ $k ][0] ?? ''; }
function update_post_meta( $id, $k, $v ) { global $M; $M[ $id ][ $k ] = array( $v ); }
function add_post_meta( $id, $k, $v ) { global $M; $M[ $id ][ $k ][] = $v; }
function delete_post_meta( $id, $k ) { global $M; unset( $M[ $id ][ $k ] ); }
function delete_post_meta_by_key( $k ) { global $M; foreach ( $M as $id => $x ) { unset( $M[ $id ][ $k ] ); } }
function is_email( $e ) { return (bool) filter_var( $e, FILTER_VALIDATE_EMAIL ) ? $e : false; }
function wp_parse_url( $u, $c = -1 ) { return parse_url( $u, $c ); }
function remove_accents( $s ) { return strtr( $s, array( 'ç' => 'c', 'ã' => 'a', 'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'õ' => 'o', 'ú' => 'u', 'ê' => 'e', 'â' => 'a', 'Ç' => 'C', 'Ã' => 'A' ) ); }
function wp_date( $f, $t = null ) { return date( $f, $t ?? time() ); }
function current_time( $x ) { return date( 'Y-m-d H:i:s' ); }
function wp_get_current_user() { return (object) array( 'display_name' => 'Nuno' ); }
$ADMIN = true; function is_user_logged_in() { global $ADMIN; return $ADMIN; } function current_user_can( $c ) { global $ADMIN; return $ADMIN; }
function update_meta_cache( $t, $i ) {} function wp_doing_cron() { return false; } function esc_html( $s ) { return $s; }
function check_ajax_referer( $a, $k ) { return true; }
function sanitize_key( $s ) { return preg_replace( '/[^a-z0-9_\-]/', '', strtolower( $s ) ); }
function absint( $x ) { return abs( (int) $x ); }
function admin_url( $p = '' ) { return 'https://x/wp-admin/' . $p; } function home_url( $p = '' ) { return 'https://x' . $p; }
function wp_create_nonce( $x ) { return 'n'; } function wp_json_encode( $x, $f = 0 ) { return json_encode( $x, $f ); }
function wp_send_json_success( $d = null ) { throw new Saida( true, $d ); } function wp_send_json_error( $d = null, $c = 0 ) { throw new Saida( false, $d ); }
function gmdate_( $f ) { return gmdate( $f ); }
function wp_mail( $to, $s, $m, $h = array() ) { global $MAIL_OK, $MAILS; if ( $MAIL_OK ) { $MAILS[] = $to; return true; } do_action( 'wp_mail_failed', new WP_Error( 'wp_mail_failed', 'Could not instantiate mail function.' ) ); return false; }
function tcd_tg_enviar( $m ) { global $TG; $TG[] = $m; }
class FakeDB { public $postmeta = 'pm';
	function prepare( $q, ...$a ) { return array( $q, $a ); }
	function esc_like( $s ) { return $s; }
	function get_col( $q ) { global $M; list( $sql, $a ) = $q; $r = array();
		foreach ( $M as $id => $mm ) {
			if ( strpos( $sql, "meta_key = '_cv_email'" ) !== false ) { if ( $id != $a[1] && strtolower( trim( $mm['_cv_email'][0] ?? '' ) ) === $a[0] ) { $r[] = $id; } }
			elseif ( strpos( $sql, "meta_key = '_cv_telefone'" ) !== false ) { $n = trim( $a[0], '%' ); if ( $id != $a[1] && $n && strpos( strpos( $sql, 'REPLACE(' ) !== false ? preg_replace( '/[\s\-.+()]/', '', $mm['_cv_telefone'][0] ?? '' ) : ( $mm['_cv_telefone'][0] ?? '' ), $n ) !== false ) { $r[] = $id; } }
			elseif ( isset( $mm[ $a[0] ] ) ) { $r[] = $id; }
		} return $r; }
	function get_results( $q ) { global $M; list( $sql, $a ) = $q; $r = array(); foreach ( $M as $id => $mm ) { foreach ( $mm[ $a[0] ] ?? array() as $v ) { $r[] = (object) array( 'post_id' => $id, 'meta_value' => $v ); } } return $r; }
}
$wpdb = new FakeDB();
// --- do m90135 (cópia fiel das funções usadas) ---
function tcd_cv_meta_campos() { return array( 'ref', 'organizacao', 'tipo', 'profissoes', 'pais', 'regiao', 'site', 'email', 'email_fonte', 'telefone', 'linguas', 'notas', 'confianca', 'prioridade', 'estado', 'ultimo', 'proximo', 'codigo', 'nota_nuno' ); }
function tcd_cv_ler( $id ) { $p = get_post( $id ); if ( ! $p || 'tcd_conv' !== $p->post_type ) { return null; } $d = array( 'id' => (int) $id, 'nome' => $p->post_title ); foreach ( tcd_cv_meta_campos() as $k ) { $d[ $k ] = (string) get_post_meta( $id, '_cv_' . $k, true ); } $h = get_post_meta( $id, '_cv_hist', true ); $d['hist'] = is_array( $h ) ? $h : array(); return $d; }
function tcd_cv_codigo() { static $n = 0; return 'PRO-T' . ( ++$n ); }
function tcd_cv_es( $p ) { return 0 === stripos( (string) $p, 'es' ); }
function tcd_cv_mensagem( $d, $o, $c, $s ) { return 'Olá ' . $d['nome'] . ' ' . $c; }
// --- do m90163 (cópia fiel de tcd_sg_convidar e afins) ---
function tcd_sg_on() { return true; }
function tcd_sg_ofertas() { return array( 'base100', 'designer3', 'oficina' ); }
function tcd_sg_dados() { return array( 'total' => 0 ); }
function tcd_sg_convidar( $id, $canal ) {
	$d = tcd_cv_ler( $id ); if ( ! $d ) { return new WP_Error( 'tcd_sg', 'Não encontrado.' ); }
	$of = tcd_sg_ofertas(); $reg = get_option( 'tcd_convites', array() ); if ( ! is_array( $reg ) ) { $reg = array(); }
	$cod = $d['codigo'] && isset( $reg[ $d['codigo'] ] ) && empty( $reg[ $d['codigo'] ]['usado'] ) ? $d['codigo'] : tcd_cv_codigo();
	$reg[ $cod ] = array( 'email' => strtolower( $d['email'] ), 'conv' => (int) $id, 'usado' => 0 );
	$msg = tcd_cv_mensagem( $d, $of, $cod, false );
	if ( 'email' === $canal ) { if ( ! is_email( $d['email'] ) ) { return new WP_Error( 'tcd_sg', 'Sem e-mail.' ); } $ok = wp_mail( $d['email'], 's', $msg ); if ( ! $ok ) { return new WP_Error( 'tcd_sg', 'O envio do e-mail falhou.' ); } $cr = 'site'; } else { $cr = 'whatsapp'; }
	update_option( 'tcd_convites', $reg, false ); update_post_meta( $id, '_cv_codigo', $cod ); update_post_meta( $id, '_cv_estado', 'convidado' );
	return array( 'canal' => $cr, 'codigo' => $cod, 'mensagem' => '' );
}
function linha( $id, $nome, $f ) { global $P, $M; $P[ $id ] = array( 'post_type' => 'tcd_conv', 'post_title' => $nome ); foreach ( $f + array( 'estado' => 'por_convidar', 'prioridade' => 'C' ) as $k => $v ) { $M[ $id ][ '_cv_' . $k ] = array( $v ); } }
// Dados: casos reais da base de dados (20/10)
linha( 15245, 'ADPM - REA Alentejo', array( 'email' => 'sustentavel@adpm.pt', 'site' => 'https://rea-alentejo.adpm.pt/', 'prioridade' => 'A', 'profissoes' => 'Agrofloresta e regenerativa, restauro, agrofloresta, pastagens, solo' ) );
linha( 15276, 'ADPM', array( 'email' => 'Sustentavel@adpm.pt', 'site' => 'https://rea-alentejo.adpm.pt', 'telefone' => '+351 286 610 090', 'prioridade' => 'B' ) );
linha( 15223, 'Aldeia do Vale 1', array( 'email' => 'ecoaldeiadovale@gmail.com', 'site' => 'https://aldeiadovale.com' ) );
linha( 15224, 'Aldeia do Vale 2', array( 'email' => 'ecoaldeiadovale@gmail.com', 'site' => 'https://www.aldeiadovale.com/', 'prioridade' => 'A' ) );
linha( 15225, 'Aldeia do Vale 3', array( 'email' => 'ecoaldeiadovale@gmail.com' ) );
linha( 15255, 'APROplan', array( 'email' => 'geral@aproplan.pt', 'site' => 'https://aproplan.pt', 'prioridade' => 'A', 'profissoes' => 'Paisagismo e restauro, paisagismo, estudos ambientais, turismo rural' ) );
linha( 15501, 'APROplan Arquitectura Paisagista', array( 'site' => 'http://www.aproplan.pt/', 'telefone' => '223 456 789' ) );
linha( 15298, 'Resilience Earth', array( 'email' => 'info@resilience.earth', 'site' => 'https://resilience.earth' ) );
linha( 15452, 'Oscar (Resilience)', array( 'email' => 'oscar@resilience.earth', 'site' => 'https://resilience.earth' ) );
linha( 15558, 'APAP pessoa 1', array( 'site' => 'https://apap.pt/equipa' ) );
linha( 15559, 'APAP pessoa 2', array( 'site' => 'https://apap.pt/equipa' ) );
linha( 15228, 'New School FB', array( 'site' => 'https://facebook.com/newschoolpermaculture' ) );
linha( 15230, 'New School FB 2', array( 'site' => 'https://facebook.com/newschoolpermaculture' ) );
linha( 15329, 'Rioja Sintrópica', array( 'site' => 'https://riojasintropica.es' ) );
linha( 15450, 'Rioja Sintrópica 2', array( 'site' => 'https://riojasintropica.es/contacto' ) );
linha( 15400, 'Já convidada', array( 'email' => 'x@duplo.pt', 'estado' => 'convidado' ) );
linha( 15401, 'Repetida da convidada', array( 'email' => 'X@duplo.pt', 'prioridade' => 'A' ) );
linha( 15402, 'Posta fora pelo Nuno', array( 'email' => 'fora@a.pt', 'estado' => 'fora' ) );
linha( 15403, 'Dup da posta fora', array( 'email' => 'fora@a.pt' ) );
linha( 15404, 'Acivro', array( 'email' => 'info@acivro.es', 'pais' => 'ES', 'profissoes' => 'Paisagismo e restauro, gestao florestal, restauro, rios, SIG, Formacao' ) );
linha( 15405, 'Telefone igual', array( 'telefone' => '00351 912 345 678', 'estado' => 'convidado' ) );
linha( 15406, 'Telefone igual 2', array( 'telefone' => '912345678' ) );

linha( 16100, 'Universidade (geral)', array( 'site' => 'https://uni.pt/a', 'telefone' => '210000000' ) );
linha( 16101, 'Prof. A', array( 'site' => 'https://uni.pt/b', 'telefone' => '911111111' ) );
linha( 16102, 'Prof. B', array( 'site' => 'https://uni.pt/c', 'telefone' => '922222222' ) );
linha( 16200, 'Lote falhado', array( 'email' => 'falhou@a.pt', 'estado' => 'convidado', 'hist' => array( array( 'canal' => 'falhou' ) ) ) );
linha( 16201, 'Mesmo e-mail do falhado', array( 'email' => 'falhou@a.pt', 'prioridade' => 'A' ) );
linha( 16300, 'Fora à mão', array( 'email' => 'f2@a.pt', 'estado' => 'fora', 'prioridade' => 'A' ) );
linha( 16301, 'Boa duplicada de fora', array( 'email' => 'f2@a.pt' ) );
require __DIR__ . '/m90046.php';
$ADMIN = false; do_action( 'init' ); t( ! get_option( 'tcd_sg46_dedup_sim' ), 'pedido de visitante não corre a passagem' ); $ADMIN = true;
$ok = 0; $falha = 0;
function t( $c, $n ) { global $ok, $falha; if ( $c ) { $ok++; echo "  ok   $n\n"; } else { $falha++; echo "  FALHA $n\n"; } }
function est( $id ) { return get_post_meta( $id, '_cv_estado' ); }
function ajax( $h, $post ) { $_POST = $post; try { do_action( $h ); return array( 'nada', null ); } catch ( Saida $s ) { return array( $s->ok ? 'ok' : 'erro', $s->data ); } }

echo "Profissões\n";
t( tcd_sg46_profissoes( 'Agrofloresta e regenerativa, restauro, agrofloresta, pastagens, solo' ) === 'Agrofloresta e regenerativa, restauro, agrofloresta, pastagens, solo', 'categoria e etiqueta diferentes ficam' );
t( tcd_sg46_profissoes( 'Paisagismo e restauro, paisagismo, estudos ambientais, Paisagismo' ) === 'Paisagismo e restauro, paisagismo, estudos ambientais', 'repetida (maiúsculas) sai' );
t( tcd_sg46_profissoes( 'gestao florestal, Formacao, formação' ) === 'gestão florestal, Formação', 'acentos e repetida com acento' );

echo "Simulação (sem tcd_sg46_aplicar)\n";
do_action( 'init' );
$sim = get_option( 'tcd_sg46_dedup_sim' );
t( is_array( $sim ) && count( $sim['duplicados'] ) > 0, 'relatório de simulação gravado (' . count( $sim['duplicados'] ) . ' duplicados)' );
t( est( 15276 ) === 'por_convidar' && est( 15225 ) === 'por_convidar', 'simulação não mexe em estados' );
t( get_post_meta( 15404, '_cv_profissoes' ) === 'Paisagismo e restauro, gestao florestal, restauro, rios, SIG, Formacao', 'simulação não mexe em profissões' );
$ids = array_column( $sim['duplicados'], 'id' ); sort( $ids );
echo '       duplicados simulados: ' . implode( ',', $ids ) . "\n";

echo "Aplicar\n";
update_option( 'tcd_sg46_aplicar', '1' ); do_action( 'init' );
t( get_option( 'tcd_sg46_dedup' ) === 'v1', 'aplicado uma vez' );
t( est( 15245 ) === 'por_convidar' && est( 15276 ) === 'fora' && (int) get_post_meta( 15276, '_cv_duplicado_de' ) === 15245, 'ADPM: fica a A (15245), sai a B' );
t( get_post_meta( 15245, '_cv_telefone' ) === '+351 286 610 090', 'ADPM: telefone da duplicada passa para a que fica' );
t( est( 15224 ) === 'por_convidar' && est( 15223 ) === 'fora' && est( 15225 ) === 'fora', 'Aldeia do Vale: 3 linhas, fica 1 (a A)' );
t( est( 15255 ) === 'por_convidar' && est( 15501 ) === 'fora', 'APROplan: sem e-mail no mesmo site sai' );
t( est( 15298 ) === 'por_convidar' && est( 15452 ) === 'por_convidar', 'Resilience: dois e-mails diferentes, ficam os dois' );
t( est( 15558 ) === 'por_convidar' && est( 15559 ) === 'por_convidar', 'APAP (página de equipa): ficam as duas pessoas' );
t( est( 15228 ) === 'por_convidar' && est( 15230 ) === 'por_convidar', 'Facebook: não junta pelo anfitrião' );
t( est( 15450 ) === 'fora', 'Rioja: mesmo site sem e-mail, fica uma' );
t( est( 15400 ) === 'convidado' && est( 15401 ) === 'fora', 'repetida de quem já foi convidado sai; convidada intacta' );
t( est( 15402 ) === 'fora' && ! get_post_meta( 15402, '_cv_duplicado_de' ), 'linha posta fora pelo Nuno não é tocada' );
t( est( 16100 ) === 'por_convidar' && est( 16101 ) === 'por_convidar' && est( 16102 ) === 'por_convidar', 'mesmo site, telefones diferentes: ficam todos' );
t( est( 16201 ) === 'por_convidar' && est( 16200 ) === 'fora' && (int) get_post_meta( 16200, '_cv_duplicado_de' ) === 16201 || est( 16200 ) === 'convidado', 'convite falhado não ganha à linha boa' );
t( est( 16301 ) === 'por_convidar', 'linha posta fora à mão não arrasta a duplicada boa' );
t( strpos( get_post_meta( 15276, '_cv_nota_nuno' ), 'Duplicado de «ADPM - REA Alentejo» (#15245)' ) === 0, 'nota explica o duplicado' );
t( get_post_meta( 15404, '_cv_profissoes' ) === 'Paisagismo e restauro, gestão florestal, restauro, rios, SIG, Formação', 'profissões limpas' );
t( count( $TG ) === 1, 'um aviso no Telegram' );
do_action( 'init' ); t( count( $TG ) === 1, 'segunda vez não repete' );

echo "Envio pelo painel (mail() a falhar)\n";
list( $r, $d ) = ajax( 'wp_ajax_tcd_sg46', array( 'acc' => 'email', 'id' => 15245, 'n' => 'n' ) );
t( 'erro' === $r && strpos( $d['m'], 'Could not instantiate mail function' ) !== false, 'motivo real da falha: ' . ( $d['m'] ?? '' ) );
t( 0 === strpos( $d['mailto'], 'mailto:sustentavel%40adpm.pt?subject=' ) && $d['codigo'], 'alternativa: mailto com código ' . $d['codigo'] );
t( est( 15245 ) === 'por_convidar', 'falha não marca como convidado' );
$cod1 = $d['codigo']; t( isset( get_option( 'tcd_convites' )[ $cod1 ] ), 'código registado (vale se o Nuno enviar à mão)' );
t( count( get_option( 'tcd_sg46_falhas' ) ) === 1, 'falha registada' );
list( $r, $d ) = ajax( 'wp_ajax_tcd_sg46', array( 'acc' => 'email', 'id' => 15245 ) );
t( $d['codigo'] === $cod1, 'nova tentativa usa o mesmo código' );
list( $r, $d ) = ajax( 'wp_ajax_tcd_sg46', array( 'acc' => 'marcar', 'id' => 15245 ) );
t( 'ok' === $r && $d['codigo'] === $cod1 && est( 15245 ) === 'convidado', '«Já enviei» regista com o mesmo código' );
t( end( tcd_cv_ler( 15245 )['hist'] )['canal'] === 'mao', 'histórico: canal à mão' );

echo "Envio pelo painel (correio a funcionar)\n";
$MAIL_OK = true;
list( $r, $d ) = ajax( 'wp_ajax_tcd_sg46', array( 'acc' => 'email', 'id' => 15224 ) );
t( 'ok' === $r && est( 15224 ) === 'convidado' && $MAILS === array( 'ecoaldeiadovale@gmail.com' ), 'envia e marca' );
list( $r, $d ) = ajax( 'wp_ajax_tcd_sg46', array( 'acc' => 'email', 'id' => 15223 ) );
t( 'erro' === $r && strpos( $d['m'], 'linha duplicada' ) !== false && count( $MAILS ) === 1, 'duplicada não recebe' );
list( $r, $d ) = ajax( 'wp_ajax_tcd_sg46', array( 'acc' => 'email', 'id' => 15224 ) );
t( 'erro' === $r && strpos( $d['m'], 'Já convidado' ) === 0 && count( $MAILS ) === 1, 'a mesma linha não recebe duas vezes (separadores, painel antigo)' );
list( $r, $d ) = ajax( 'wp_ajax_tcd_sg', array( 'acc' => 'email', 'id' => 15224 ) );
t( 'erro' === $r && count( $MAILS ) === 1, 'idem pelo painel antigo' );
list( $r, $d ) = ajax( 'wp_ajax_tcd_sg46', array( 'acc' => 'marcar', 'id' => 15224 ) );
t( 'erro' === $r && count( tcd_cv_ler( 15224 )['hist'] ) === 0, '«Já enviei» não regista duas vezes' );
list( $r, $d ) = ajax( 'wp_ajax_tcd_sg', array( 'acc' => 'email', 'id' => 16201 ) );
t( 'nada' === $r, 'linha com envio falhado do lote não bloqueia a outra' );
$ADMIN = false; list( $r, $d ) = ajax( 'wp_ajax_tcd_sg', array( 'acc' => 'email', 'id' => 15223 ) ); $ADMIN = true;
t( 'nada' === $r, 'não-administrador: a guarda nem corre' );

echo "Guarda no painel antigo (m90163) e no lote (m90135)\n";
linha( 15500, 'Nova importação repetida', array( 'email' => 'ECOALDEIADOVALE@gmail.com' ) );
list( $r, $d ) = ajax( 'wp_ajax_tcd_sg', array( 'acc' => 'email', 'id' => 15500 ) );
t( 'erro' === $r && strpos( $d, 'já foi convidado por Aldeia do Vale 2' ) !== false, 'm90163: bloqueia e-mail já convidado' );
list( $r, $d ) = ajax( 'wp_ajax_tcd_sg', array( 'acc' => 'whatsapp', 'id' => 15406 ) );
t( 'erro' === $r && strpos( $d, 'Telefone igual' ) !== false, 'm90163: bloqueia WhatsApp para telefone já convidado' );
list( $r, $d ) = ajax( 'wp_ajax_tcd_sg', array( 'acc' => 'adiar', 'id' => 15500 ) );
t( 'nada' === $r, 'm90163: «Depois» passa sem interferência' );
list( $r, $d ) = ajax( 'wp_ajax_tcd_sg', array( 'acc' => 'email', 'id' => 15298 ) );
t( 'nada' === $r, 'm90163: quem não tem repetido passa' );
linha( 15600, 'Lote A', array( 'email' => 'lote@a.pt' ) ); linha( 15601, 'Lote A bis', array( 'email' => 'Lote@a.pt' ) );
$_POST = array( 'ids' => array( '15600', '15601', '15500', '15298' ) ); do_action( 'wp_ajax_tcd_cv_enviar' );
t( $_POST['ids'] === array( '15600', '15298' ), 'lote: tira repetidos e já convidados (' . implode( ',', $_POST['ids'] ) . ')' );
t( count( get_option( 'tcd_sg46_lote_saltados' )['l'] ) === 2 && strpos( end( $TG ), '2 fora deste envio' ) !== false, 'lote: os que ficaram de fora são avisados' );
linha( 15700, 'Tel lote 1', array( 'telefone' => '933 000 111' ) ); linha( 15701, 'Tel lote 2', array( 'telefone' => '+351933000111' ) );
$_POST = array( 'ids' => array( '15700', '15701' ) ); do_action( 'wp_ajax_tcd_cv_enviar' );
t( $_POST['ids'] === array( '15700' ), 'lote: mesmo telefone só uma vez' );
update_post_meta( 15245, '_cv_telefone', '933333333' );

echo "Desfazer\n";
update_option( 'tcd_sg46_repor', '1' ); do_action( 'init' );
t( est( 15276 ) === 'por_convidar' && est( 15223 ) === 'por_convidar' && est( 15501 ) === 'por_convidar', 'estados repostos' );
t( est( 15402 ) === 'fora', 'a posta fora pelo Nuno continua fora' );
t( get_post_meta( 15276, '_cv_nota_nuno' ) === '' && ! get_post_meta( 15276, '_cv_duplicado_de' ), 'notas e marcas retiradas' );
t( get_post_meta( 15245, '_cv_telefone' ) === '933333333', 'telefone corrigido à mão depois não é apagado' );
t( get_post_meta( 15255, '_cv_telefone' ) === '', 'telefone copiado e não mexido é retirado' );
t( get_post_meta( 15404, '_cv_profissoes' ) === 'Paisagismo e restauro, gestao florestal, restauro, rios, SIG, Formacao', 'profissões originais repostas' );
echo "$ok ok, $falha falhas\n";
exit( $falha ? 1 : 0 );
