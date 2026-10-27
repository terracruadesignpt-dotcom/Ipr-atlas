<?php
// Módulo 90320: IPR Atlas, camadas oficiais de outros países europeus (21/10/2026; pedido do Nuno, 19h03: «a Europa toda»).
// Carrega assets/atlas/eu-camadas.js na página do Atlas: um grupo na barra de camadas que só aparece quando o mapa está num
// dos 17 países do catálogo (Áustria, Suíça e Liechtenstein, Países Baixos, Bélgica, Luxemburgo, Alemanha, Reino Unido,
// Irlanda, Itália, Polónia, Chéquia, Dinamarca, Suécia, Noruega, Finlândia, Grécia, Croácia), com ortofoto, cadastro,
// limites, zonas inundáveis e relevo onde há serviço aberto, mais Rede Natura 2000 e CORINE. Fontes testadas a 21/10.
// Enquanto os países estiverem fechados, só os administradores vêem o grupo; o filtro tcd_eu_camadas_visivel (do registo
// europeu) ou a opção tcd_eu_camadas_publico = '1' abrem-no a todos. Interruptor: tcd_eu_camadas_off = '1'. Prefixo tcd_eucam_.
if ( ! defined( 'ABSPATH' ) ) { exit; }

function tcd_eucam_visivel() {
	$v = current_user_can( 'manage_options' ) || '1' === (string) get_option( 'tcd_eu_camadas_publico', '0' );
	return (bool) apply_filters( 'tcd_eu_camadas_visivel', $v );
}

add_action( 'wp_enqueue_scripts', function () {
	if ( '1' === (string) get_option( 'tcd_eu_camadas_off', '0' ) || ! is_page( array( 14581, 'atlas' ) ) ) { return; }
	if ( ! tcd_eucam_visivel() ) { return; }
	$f = dirname( __DIR__ ) . '/assets/atlas/eu-camadas.js';
	if ( ! is_readable( $f ) ) { return; }
	$v = substr( (string) md5_file( $f ), 0, 10 );
	wp_enqueue_script( 'tcd-eucam-atlas', content_url( 'plugins/terracrua-nucleo/assets/atlas/eu-camadas.js' ), array(), $v, true );
}, 33 );
