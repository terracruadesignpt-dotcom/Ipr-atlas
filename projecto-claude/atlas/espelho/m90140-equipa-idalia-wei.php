<?php
// Módulo 90140: dois perfis novos na página Equipa, /equipa/ (pedido do Nuno, 21/10/2026, 16h17 e 17h14): Idália Fonseca
// (contabilidade e documentos) e Wei Tavares (informática e serviços). Os textos da página vivem no m90012 e na cache do
// m90013: este módulo não os edita; acrescenta os dois perfis à saída do shortcode [tcd_pg p="equipa"] (do_shortcode_tag,
// prioridade 15) e à que vem da cache (pre_do_shortcode_tag, 50, antes das trocas do m90177 a 99). Idempotente.
// Os dois são assistentes automáticos da casa e a linha de função di-lo. Sem fotografia por agora (figure vazia, fundo creme).
// Desligar: opção tcd_eq2_off = 1. Prefixo tcd_eq2_.
if ( ! defined( 'ABSPATH' ) ) { exit; }

function tcd_eq2_on() { return '1' !== (string) get_option( 'tcd_eq2_off', '' ); }
function tcd_eq2_perfis() {
	$p = array(
		array( 'Idália Fonseca', 'Contabilidade e documentos · Assistente automática da casa', array(
			'Idália fica no fundo da sala e gosta de lá estar. Não aparece nas reuniões nem nos mapas; aparece quando falta um recibo, quando um contrato ficou por assinar ou quando uma factura devia ter saído na semana passada. É a toupeira dos documentos: sabe onde está cada papel, em que pasta, com que data e com que número.',
			'Vigia prazos, facturas por emitir e documentos fora do sítio, e avisa a equipa antes que se tornem urgências. Com os clientes responde a uma pergunta só: «onde está o meu documento». Não dá descontos, não altera valores, não promete prazos; para isso passa a palavra à Susana.',
		) ),
		array( 'Wei Tavares', 'Infra-estrutura, servidores e sistemas geográficos · Assistente automático da casa', array(
			'Cresceu entre Macau e o Alentejo. Curto nas palavras, longo nos registos: é o único que lê os logs inteiros. Toda a estrutura técnica da Terracrua Design passa por ele: o site, o IPR Atlas, a IPR Cloud, o motor de cartografia e o espaço onde as Bases Cartográficas ficam guardadas.',
			'No lado geográfico, mantém a cadeia que transforma um polígono desenhado no Atlas numa Base Cartográfica: a recolha dos dados abertos (LiDAR, ortofotos, cadastro, cartas de risco), o processamento no motor, a publicação das camadas e dos mosaicos, e a ligação ao QGIS e ao QField no terreno. Garante que cada camada tem fonte, data e licença.',
			'No lado dos servidores, trata dos sistemas, das cópias de segurança, dos certificados, da rede de distribuição e das defesas do site. Vigia tudo de hora a hora, sabe que serviço está em baixo e desde quando, e recebe as incidências já com o diagnóstico feito antes de as passar ao webmaster. Não mexe em contas nem em acessos; isso fica com as pessoas.',
		) ),
	);
	$h = '';
	foreach ( $p as $x ) {
		$h .= '<div class="tci-pess"><figure></figure><div><h2>' . esc_html( $x[0] ) . '</h2><p class="pap">' . esc_html( $x[1] ) . '</p><p>' . implode( '</p><p>', array_map( 'esc_html', $x[2] ) ) . '</p></div></div>';
	}
	return $h;
}
function tcd_eq2_inserir( $out ) {
	if ( ! is_string( $out ) || '' === $out || false !== strpos( $out, 'Idália Fonseca' ) ) { return $out; }
	$j = strpos( $out, 'José Godinho' ); if ( false === $j ) { return $out; }
	$f = strpos( $out, '</div></section>', $j ); if ( false === $f ) { return $out; }
	return substr_replace( $out, tcd_eq2_perfis(), $f, 0 );
}
function tcd_eq2_e_equipa( $attr ) { return is_array( $attr ) && isset( $attr['p'] ) && 'equipa' === (string) $attr['p']; }

add_filter( 'do_shortcode_tag', function ( $out, $tag, $attr ) {
	return tcd_eq2_on() && 'tcd_pg' === $tag && tcd_eq2_e_equipa( $attr ) ? tcd_eq2_inserir( $out ) : $out;
}, 15, 3 );
add_filter( 'pre_do_shortcode_tag', function ( $r, $tag, $attr ) {
	return tcd_eq2_on() && 'tcd_pg' === $tag && tcd_eq2_e_equipa( $attr ) ? tcd_eq2_inserir( $r ) : $r;
}, 50, 3 );
