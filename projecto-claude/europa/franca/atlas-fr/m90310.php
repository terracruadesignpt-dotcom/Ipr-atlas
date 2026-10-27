<?php
// Módulo 90310: IPR Atlas, camadas de França (21/10/2026). Carrega assets/atlas/fr-camadas.js na página do Atlas: um grupo
// «França» na barra de camadas, que só aparece quando o mapa está em França (ortofoto, Plan IGN, relevo LiDAR HD, cadastro,
// RPG, Natura 2000, ZNIEFF, PNR, curvas). Fontes da Géoplateforme do IGN verificadas a 21/10 (200 e CORS aberto).
// Enquanto França estiver fechada (opção tcd_fra_aberto, ou tcd_eu_visivel('FR') do registo europeu quando existir), só os
// administradores vêem o grupo. Interruptor: opção tcd_fr_camadas_off = '1'. Prefixo tcd_frcam_.
if ( ! defined( 'ABSPATH' ) ) { exit; }

function tcd_frcam_visivel() {
	if ( function_exists( 'tcd_eu_visivel' ) ) { return (bool) tcd_eu_visivel( 'FR' ); }
	return '1' === (string) get_option( 'tcd_fra_aberto', '0' ) || current_user_can( 'manage_options' );
}

add_action( 'wp_enqueue_scripts', function () {
	if ( '1' === (string) get_option( 'tcd_fr_camadas_off', '0' ) || ! is_page( array( 14581, 'atlas' ) ) ) { return; }
	if ( ! tcd_frcam_visivel() ) { return; }
	$f = dirname( __DIR__ ) . '/assets/atlas/fr-camadas.js';
	if ( ! is_readable( $f ) ) { return; }
	$v = substr( (string) md5_file( $f ), 0, 10 );
	wp_enqueue_script( 'tcd-frcam-atlas', content_url( 'plugins/terracrua-nucleo/assets/atlas/fr-camadas.js' ), array(), $v, true );
}, 33 );
