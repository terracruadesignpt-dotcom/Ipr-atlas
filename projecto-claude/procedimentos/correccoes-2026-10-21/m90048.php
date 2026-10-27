<?php
// Módulo 90048 · Pedido da Base pelo Atlas: o campo-isco deixa de dar um «Pedido enviado» falso (21/10/2026).
//
// Problema: o m14473 (rota POST /tcd/v1/pedido-base) devolve {"ok":true} sem criar nada quando o campo escondido
// anti-robô `website` vem preenchido. O Atlas mostra então «Pedido enviado. Referência .» (referência vazia), não sai
// e-mail nenhum e não fica encomenda, conta nem terreno. Foi o que aconteceu ao Pedro Franco (Vila Bita) a 20/10, duas
// vezes: o navegador ou um gestor de palavras-passe preenche o campo, apesar de autocomplete="off".
//
// Correcção, sem tocar no m14473, em rest_pre_dispatch com prioridade -1000: antes das guardas que saltam pedidos com o
// campo-isco (m90071 na 5, m90024 na 10). Um pedido aceite passa por todas as guardas como qualquer outro
// (geometria, conta @terracruadesign.pt só com sessão, repetidos, vales) e pelos limites do m14473.
//  1. Isco preenchido e sinais de pessoa (tempo de preenchimento entre 8 s e 6 h, nome, e-mail válido, consentimento e
//     um limite de terreno real: polígono com área > 0 ou ficheiro carregado), dentro do tecto (2 por IP e por dia,
//     15 por dia no total) → o campo é limpo e o pedido segue; a encomenda leva uma nota para a equipa confirmar.
//  2. Caso contrário → erro honesto (o Atlas mostra a mensagem) e, se houver contacto, aviso no Telegram à equipa
//     (2 por IP e por dia, 10 por dia no total), para não se perder uma pessoa real.
// Antes de tudo, 5 pedidos com isco por hora e por IP (429). Nenhum e-mail sai deste módulo.
// Registo: opção `tcd_pbi_log` (autoload no, últimas 50, 30 dias; nos aceites só o domínio do e-mail).
// Desligar: wp option update tcd_pbi_off 1.

if ( ! defined( 'ABSPATH' ) ) { exit; }

function tcd_pbi_ligado() {
	return ! get_option( 'tcd_pbi_off' );
}

function tcd_pbi_e_pedido( $req ) {
	return ( $req instanceof WP_REST_Request ) && 'POST' === strtoupper( $req->get_method() ) && '/tcd/v1/pedido-base' === strtolower( untrailingslashit( $req->get_route() ) );
}

function tcd_pbi_ip() {
	return md5( function_exists( 'tcd_sn_ip' ) ? (string) tcd_sn_ip() : (string) ( $_SERVER['REMOTE_ADDR'] ?? '' ) ); // phpcs:ignore
}

// Contador num transient; devolve o valor antes de somar.
function tcd_pbi_conta( $k, $ttl ) {
	$n = (int) get_transient( $k );
	set_transient( $k, $n + 1, $ttl );
	return $n;
}

// Texto seguro para o Telegram em HTML (só &lt; &gt; &amp; &quot;; sem reaproveitar entidades) e com tamanho limitado.
function tcd_pbi_h( $s, $n ) {
	return htmlspecialchars( mb_substr( (string) $s, 0, $n ), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8', true );
}

// Há um limite de terreno real? Polígono com área > 0 no GeoJSON, ou ficheiro de limite/caderneta carregado.
function tcd_pbi_tem_terreno( $p, $files ) {
	foreach ( array( 'limite', 'caderneta' ) as $c ) {
		if ( ! empty( $files[ $c ]['name'] ) && empty( $files[ $c ]['error'] ) ) { return true; }
	}
	$txt = isset( $p['geojson'] ) && is_string( $p['geojson'] ) ? $p['geojson'] : '';
	if ( '' === $txt || strlen( $txt ) >= 3000000 ) { return false; }
	$g = json_decode( $txt, true );
	if ( ! is_array( $g ) || empty( $g['features'] ) || ! is_array( $g['features'] ) ) { return false; }
	foreach ( $g['features'] as $f ) {
		$geo = is_array( $f ) && isset( $f['geometry'] ) && is_array( $f['geometry'] ) ? $f['geometry'] : null;
		$t   = $geo['type'] ?? '';
		if ( 'Polygon' !== $t && 'MultiPolygon' !== $t ) { continue; }
		if ( ! function_exists( 'tcd_area_geometria' ) ) { return true; }
		if ( function_exists( 'tcd_lid_aneis' ) && ! tcd_lid_aneis( $geo ) ) { continue; } // anéis mal formados
		if ( tcd_area_geometria( $geo ) > 0 ) { return true; }
	}
	return false;
}

function tcd_pbi_registar( $linha ) {
	$log = get_option( 'tcd_pbi_log', array() );
	if ( ! is_array( $log ) ) { $log = array(); }
	$log[] = $linha;
	$lim   = gmdate( 'c', time() - 30 * DAY_IN_SECONDS );
	$log   = array_values( array_filter( $log, function ( $e ) use ( $lim ) { return is_array( $e ) && (string) ( $e['quando'] ?? '' ) >= $lim; } ) );
	if ( count( $log ) > 50 ) { $log = array_slice( $log, -50 ); }
	update_option( 'tcd_pbi_log', $log, false );
}

function tcd_pbi_avisar( $ip, $texto ) {
	if ( ! function_exists( 'tcd_tg_enviar' ) ) { return; }
	if ( tcd_pbi_conta( 'tcd_pbi_tgip_' . $ip, DAY_IN_SECONDS ) >= 2 ) { return; }
	$n = tcd_pbi_conta( 'tcd_pbi_tg_' . gmdate( 'Ymd' ), DAY_IN_SECONDS );
	if ( $n < 10 ) {
		tcd_tg_enviar( $texto );
	} elseif ( 10 === $n ) {
		tcd_tg_enviar( 'Mais de 10 avisos de pedidos da Base com o campo anti-robô hoje; os seguintes ficam só na opção tcd_pbi_log.' );
	}
}

function tcd_pbi_mensagem() {
	$contacto = defined( 'TCD_EMAIL_EQUIPA' ) ? ' para ' . TCD_EMAIL_EQUIPA : '';
	return 'Não foi possível registar o pedido automaticamente. Confirme que desenhou ou carregou o limite do terreno e tente de novo. Se voltar a acontecer, escreva-nos' . $contacto . ' ou pelo WhatsApp +351 910 748 670.';
}

add_filter( 'rest_pre_dispatch', 'tcd_pbi_antes', -1000, 3 );
function tcd_pbi_antes( $resp, $srv, $req ) {
	if ( null !== $resp || ! tcd_pbi_ligado() || ! tcd_pbi_e_pedido( $req ) ) { return $resp; }
	$p = $req->get_body_params();
	// Mesmo critério do m14473 e do m90024 (empty).
	if ( ! is_array( $p ) || empty( $p['website'] ) ) { return $resp; }

	$ip = tcd_pbi_ip();
	if ( tcd_pbi_conta( 'tcd_pbi_ipr_' . $ip, HOUR_IN_SECONDS ) >= 5 ) {
		return new WP_Error( 'tcd_pedido_verificar', tcd_pbi_mensagem(), array( 'status' => 429 ) );
	}

	$s     = function ( $k ) use ( $p ) { return isset( $p[ $k ] ) && is_scalar( $p[ $k ] ) ? (string) $p[ $k ] : ''; };
	$nome  = sanitize_text_field( $s( 'nome' ) );
	$email = sanitize_email( $s( 'email' ) );
	$tel   = sanitize_text_field( $s( 'telefone' ) );
	$t     = is_numeric( $s( 't' ) ) ? (int) ( (float) $s( 't' ) / 1000 ) : 0; // hora de abertura do formulário, em ms (como no m14473)
	$dt    = $t > 0 ? time() - $t : -1;
	$sinais = array(
		'tempo'         => $dt >= 8 && $dt <= 6 * HOUR_IN_SECONDS,
		'nome'          => '' !== $nome,
		'email'         => (bool) is_email( $email ),
		'consentimento' => ! empty( $p['consentimento'] ),
		'terreno'       => tcd_pbi_tem_terreno( $p, $req->get_file_params() ),
	);
	$pessoa = ! in_array( false, $sinais, true );
	$falta  = implode( ', ', array_keys( array_filter( $sinais, function ( $v ) { return ! $v; } ) ) );

	// Tecto para os aceites: os sinais podem ser forjados por um robô que envie um pedido bem formado.
	if ( $pessoa ) {
		$ki = 'tcd_pbi_ok_' . $ip;
		$kg = 'tcd_pbi_ok_' . gmdate( 'Ymd' );
		if ( (int) get_transient( $ki ) >= 2 || (int) get_transient( $kg ) >= 15 ) {
			$pessoa = false;
			$falta  = 'limite diário';
		} else {
			tcd_pbi_conta( $ki, DAY_IN_SECONDS );
			tcd_pbi_conta( $kg, DAY_IN_SECONDS );
		}
	}

	tcd_pbi_registar( array(
		'quando' => gmdate( 'c' ),
		'aceite' => $pessoa ? 1 : 0,
		'falta'  => $falta,
		'nome'   => $pessoa ? '' : mb_substr( $nome, 0, 80 ),
		'email'  => $pessoa ? (string) strstr( $email, '@' ) : mb_substr( $email, 0, 120 ),
		'isco'   => strlen( $s( 'website' ) ),
	) );

	if ( $pessoa ) {
		$p['website'] = '';
		$req->set_body_params( $p );
		$GLOBALS['tcd_pbi_marca'] = spl_object_id( $req );
		return $resp;
	}

	// Sem sinais de pessoa: erro honesto e aviso à equipa, em vez de um «ok» vazio.
	if ( is_email( $email ) || '' !== $tel ) {
		tcd_pbi_avisar( $ip, 'Pedido da Base pelo Atlas não aceite (campo anti-robô preenchido; falta: ' . tcd_pbi_h( $falta, 80 ) . '). Nome: ' . tcd_pbi_h( $nome ?: '?', 80 ) . '; e-mail: ' . tcd_pbi_h( $email ?: '?', 120 ) . '; tel.: ' . tcd_pbi_h( $tel ?: '?', 30 ) . '. Se for pessoa, contactar.' );
	}
	return new WP_Error( 'tcd_pedido_verificar', tcd_pbi_mensagem(), array( 'status' => 400 ) );
}

// Nota na encomenda criada a partir de um pedido aceite com o campo-isco preenchido. Em rest_post_dispatch (15): depois
// do vale do m90134 (10), para o total a 0 € já contar, e antes da tradução do m90244 (20); corre sempre, por isso a
// marca é limpa mesmo quando uma guarda responde antes do m14473.
add_filter( 'rest_post_dispatch', 'tcd_pbi_depois', 15, 3 );
function tcd_pbi_depois( $resp, $srv, $req ) {
	if ( ! isset( $GLOBALS['tcd_pbi_marca'] ) || ! is_object( $req ) || $GLOBALS['tcd_pbi_marca'] !== spl_object_id( $req ) || ! tcd_pbi_e_pedido( $req ) ) { return $resp; }
	unset( $GLOBALS['tcd_pbi_marca'] );
	$d   = $resp instanceof WP_REST_Response ? $resp->get_data() : ( is_array( $resp ) ? $resp : null );
	$ref = is_array( $d ) && ! empty( $d['pedido'] ) && is_scalar( $d['pedido'] ) ? sanitize_text_field( (string) $d['pedido'] ) : '';
	if ( '' === $ref || ! function_exists( 'wc_get_orders' ) ) { return $resp; }
	$os = wc_get_orders( array( 'limit' => 1, 'return' => 'objects', 'meta_query' => array( array( 'key' => '_tcd_pedido', 'value' => $ref ) ) ) );
	if ( $os && is_object( $os[0] ) ) {
		$o = $os[0];
		$o->add_order_note( 'O campo escondido anti-robô do formulário veio preenchido (provavelmente pelo preenchimento automático do navegador). O pedido foi aceite porque tinha os sinais de uma pessoa (tempo, nome, e-mail, consentimento e terreno). Confirme o contacto antes de enviar a ligação de pagamento.' );
		// Com vale de 100 % ou voucher a encomenda segue logo para produção: avisar já.
		if ( (float) $o->get_total() <= 0 ) {
			tcd_pbi_avisar( tcd_pbi_ip(), 'Pedido da Base ' . tcd_pbi_h( $ref, 40 ) . ' (encomenda #' . (int) $o->get_id() . ') a 0 €, aceite com o campo anti-robô preenchido. Confirmar que é pessoa.' );
		}
	}
	return $resp;
}
