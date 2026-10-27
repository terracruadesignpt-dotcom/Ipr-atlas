<?php
// Módulo 90248: IPR Atlas, camadas de Espanha (21/10/2026). Carrega assets/atlas/es-camadas.js na página do Atlas: um grupo
// «Espanha» na barra de camadas, que só aparece quando o mapa está em Espanha (ortofoto PNOA, IGN Base, Catastro, SIGPAC,
// limites, Rede Natura 2000, zonas inundáveis, pontos de água IGME, curvas IGN). Fontes verificadas a 21/10 (200 e CORS).
// Enquanto Espanha estiver fechada (tcd_esp_aberto, m90240), só os administradores vêem o grupo.
// Interruptor: opção tcd_es_camadas_off = '1' desliga. Prefixo tcd_escam_.
if ( ! defined( 'ABSPATH' ) ) { exit; }

add_action( 'wp_enqueue_scripts', function () {
	if ( '1' === (string) get_option( 'tcd_es_camadas_off', '0' ) || ! is_page( array( 14581, 'atlas' ) ) ) { return; }
	if ( ! function_exists( 'tcd_esp_visivel' ) || ! tcd_esp_visivel() ) { return; }
	$f = dirname( __DIR__ ) . '/assets/atlas/es-camadas.js';
	if ( ! is_readable( $f ) ) { return; }
	$v = substr( (string) md5_file( $f ), 0, 10 );
	wp_enqueue_script( 'tcd-escam-atlas', content_url( 'plugins/terracrua-nucleo/assets/atlas/es-camadas.js' ), array(), $v, true );
}, 32 );
