<?php
// Módulo 90154: a Sentinela (m14553) deixa de pontuar os avisos legítimos do Telegram (achado T-031; Nuno, 20/10/2026).
// O Telegram chama /wp-json/tcd/v1/telegram sem identificação de navegador e a Sentinela dava 5 pontos a cada pedido:
// com 20 avisos numa hora bloqueava o próprio Telegram. Só para as redes publicadas pelo Telegram e só nesse caminho,
// o pedido passa a identificar-se como «TelegramBot (webhook)». O webhook continua validado pelo secret_token.
// Desligar: wp option update tcd_sntg_off 1
// 21/10/2026: prioridade -100 em vez de 1. A Sentinela também corre em init com prioridade 1 e, por ser registada antes
// (m14553 carrega primeiro), corria antes deste módulo: os pedidos do Telegram continuavam a somar 5 pontos.
if ( ! defined( 'ABSPATH' ) ) { exit; }

add_action( 'init', function () {
	if ( '1' === (string) get_option( 'tcd_sntg_off', '' ) || ! function_exists( 'tcd_sn_ip' ) ) { return; }
	if ( '' !== trim( (string) ( $_SERVER['HTTP_USER_AGENT'] ?? '' ) ) ) { return; }
	$uri = rawurldecode( (string) ( $_SERVER['REQUEST_URI'] ?? '' ) );
	if ( 0 !== strpos( $uri, '/wp-json/tcd/v1/telegram' ) && false === strpos( $uri, 'rest_route=/tcd/v1/telegram' ) ) { return; }
	$ip = tcd_sn_ip();
	if ( ! filter_var( $ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4 ) ) { return; }
	$n = ip2long( $ip );
	foreach ( array( '149.154.160.0/20', '91.108.4.0/22' ) as $r ) {
		list( $sub, $bits ) = explode( '/', $r );
		$mask = -1 << ( 32 - (int) $bits );
		if ( ( $n & $mask ) === ( ip2long( $sub ) & $mask ) ) { $_SERVER['HTTP_USER_AGENT'] = 'TelegramBot (webhook)'; return; }
	}
}, -100 );
