<?php
// Módulo 90247: IPR Atlas, «O meu terreno» e barra da esquerda simplificada (pedido do Nuno, 20/10/2026, 17h27: «as pessoas
// estão-se a queixar», «botão bem destacado» para o projecto exemplo e para os projectos de cada um; com a Base entregue, ligação
// bem visível para o terreno; sem ela, o limite da Base encomendada no mapa). O ficheiro vive no Núcleo
// (assets/atlas/entrada.js) e carrega-se na página do Atlas para toda a gente. Não mexe no app.js.
// Interruptor: opção tcd_entrada_off = '1' desliga. Prefixo tcd_ent2_.
if ( ! defined( 'ABSPATH' ) ) { exit; }

add_action( 'wp_enqueue_scripts', function () {
	if ( '1' === (string) get_option( 'tcd_entrada_off', '0' ) || ! is_page( array( 14581, 'atlas' ) ) ) { return; }
	$f = dirname( __DIR__ ) . '/assets/atlas/entrada.js';
	$v = is_readable( $f ) ? substr( (string) md5_file( $f ), 0, 10 ) : '1';
	wp_enqueue_script( 'tcd-ent2-atlas', content_url( 'plugins/terracrua-nucleo/assets/atlas/entrada.js' ), array(), $v, true );
	if ( function_exists( 'tcd_i18n_lingua' ) && 'es' === tcd_i18n_lingua() ) {
		wp_add_inline_script( 'tcd-ent2-atlas', 'window.IPR_TXT_ENTRADA=' . wp_json_encode( tcd_ent2_es() ) . ';', 'before' );
	}
}, 31 );

function tcd_ent2_es() {
	return array(
		'comecar' => 'Empiece aquí',
		'comecar_p' => 'Vea un proyecto real de ejemplo o indique su terreno para encargar la Base Cartográfica.',
		'ver_exemplo' => 'Ver el proyecto de ejemplo',
		'encomendar' => 'Encargar la Base de mi terreno',
		'entrar' => '¿Ya es cliente? Entrar',
		'meus' => 'Mis terrenos',
		'sem_terrenos' => 'Todavía no tiene terrenos. Vea el ejemplo o indique su terreno.',
		'partilhado' => 'compartido con usted',
		'base_pronta' => 'Base Cartográfica lista',
		'aberto' => 'Abierto',
		'abrir' => 'Abrir mi terreno',
		'base_encomendada' => 'Base encargada',
		'ver_limite' => 'Ver en el mapa',
		'cloud' => 'En la IPR Cloud',
		'exemplo' => 'Proyecto de ejemplo',
		'todas' => 'Mostrar todas las capas',
		'menos' => 'Mostrar solo las principales',
	);
}
