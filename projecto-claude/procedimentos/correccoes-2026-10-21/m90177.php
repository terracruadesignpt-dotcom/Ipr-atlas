<?php
// Módulo 90177: acertos de texto, SEO e apresentação da auditoria completa de 20/10/2026 (COM-02, COM-05, COM-06, COM-12,
// SEO-02, SEO-03, COM-11, VIS-01, VIS-03, VIS-08, VIS-12). Pedido do Nuno: «corrige tudo».
// Os textos das páginas [tcd_pg] e [tcd_inicio] vivem no código (m90012, m14620) e na cache do m90013: este módulo não os
// edita; corrige a saída do shortcode (do_shortcode_tag) e, desde a v2, também a que vem da cache (pre_do_shortcode_tag).
// 1. Frases trocadas (lista $tcd_aud_trocas): escala de experiência na Equipa, frases de efeito, «+ transportes».
// 2. «infraestrutura» passa a «infra-estrutura» só no texto visível (nunca em endereços, nomes de ficheiro ou atributos).
// 3. Páginas em inglês com lang="en"; /loja/ fora do mapa do site; descrição da página Apoio a associações.
// 4. Loja: «O preço actual» (pré-AO) e «+ IVA» junto do preço na página do produto; sem a linha «Categoria».
// 5. Uma camada de cada vez no fundo do ecrã: a janela da newsletter (#tcd-nl) espera que o aviso de cookies (#tcdck) feche;
//    o botão redondo (.tcdsp-b) sobe acima do aviso; área de toque de 44 px no ícone de pesquisa; theme-color.
// Interruptor geral: opção tcd_aud_off = 1. Só a parte 5: tcd_aud_vis_off = 1. Prefixo tcd_aud_.
if ( ! defined( 'ABSPATH' ) ) { exit; }

function tcd_aud_on() { return '1' !== (string) get_option( 'tcd_aud_off' ); }

function tcd_aud_trocas() {
	return array(
		'Uma equipa que desenhou e implementou centenas de milhares de hectares em Angola, Portugal e Estados Unidos.'
			=> 'Uma equipa que desenhou e/ou implementou perto de meio milhão de hectares em Angola, Portugal e Estados Unidos.',
		'criador e guardião do Sistema Terracrua Design' => 'criador do Sistema Terracrua Design',
		'Tem particular foco na leitura da água na paisagem: para ele, cada linha de nível é uma frase escrita no território.'
			=> 'Tem particular foco na leitura da água na paisagem.',
		' Onde muitos vêem burocracia, Lotte vê estrutura.' => '',
		'Visão estratégica, experiência real, sensibilidade ecológica e capacidade de concretização, ao serviço de territórios que pedem mais do que soluções.'
			=> 'Visão estratégica, experiência de terreno e capacidade de concretização, do primeiro mapa à obra.',
		'<h2 class="tci-h2">Cada território é único</h2><p>E merece um plano à sua medida. Fale connosco para uma primeira conversa.</p>'
			=> '<h2 class="tci-h2">Cada plano parte do terreno</h2><p>Começamos pelo levantamento e pela leitura do lugar. Fale connosco para uma primeira conversa.</p>',
		'350 € + IVA + transportes' => '350 € + IVA + deslocação',
	);
}

// Só no texto entre etiquetas, fora de <style> e <script>.
function tcd_aud_ortografia( $html ) {
	if ( false === stripos( $html, 'nfraestrutura' ) ) { return $html; }
	$partes = preg_split( '#(<(?:style|script)\b.*?</(?:style|script)>)#is', $html, -1, PREG_SPLIT_DELIM_CAPTURE );
	if ( ! is_array( $partes ) ) { return $html; } // v2: preg_split falhado não pode dar erro fatal
	foreach ( $partes as $i => $p ) {
		if ( 1 === $i % 2 ) { continue; }
		$q = preg_replace_callback( '/>([^<]+)</', function ( $m ) {
			$s = preg_replace( '/([Ii])nfraestrutura/', '$1nfra-estrutura', $m[1] ); // v2: sem /u (padrão só ASCII); UTF-8 inválido fica intacto
			return '>' . ( null === $s ? $m[1] : $s ) . '<';
		}, $p );
		$partes[ $i ] = null === $q ? $p : $q;
	}
	return implode( '', $partes );
}

function tcd_aud_corrigir( $out ) {
	$t = tcd_aud_trocas();
	$out = str_replace( array_keys( $t ), array_values( $t ), $out );
	return tcd_aud_ortografia( $out );
}
add_filter( 'do_shortcode_tag', function ( $out, $tag ) {
	if ( ! tcd_aud_on() || ! in_array( $tag, array( 'tcd_pg', 'tcd_inicio' ), true ) || ! is_string( $out ) ) { return $out; }
	return tcd_aud_corrigir( $out );
}, 20, 2 );
// v2 (21/10/2026): o m90013 serve [tcd_pg] a visitantes sem sessão a partir da cache, em pre_do_shortcode_tag (10). Quando
// esse filtro devolve texto, o WordPress salta o do_shortcode_tag e as trocas acima não chegavam aos visitantes (a cache
// é gravada na prioridade 10, antes delas). Aqui corrige-se o texto vindo da cache. As trocas são idempotentes.
add_filter( 'pre_do_shortcode_tag', function ( $r, $tag ) {
	if ( ! tcd_aud_on() || ! is_string( $r ) || '' === $r || ! in_array( $tag, array( 'tcd_pg', 'tcd_inicio' ), true ) ) { return $r; }
	return tcd_aud_corrigir( $r );
}, 99, 2 );

add_filter( 'the_content', function ( $c ) {
	if ( ! tcd_aud_on() || is_admin() || ! is_string( $c ) ) { return $c; }
	return tcd_aud_ortografia( $c );
}, 99 );

// 3. Língua das páginas em inglês, mapa do site e descrição em falta.
function tcd_aud_ingles() { return is_page( array( 14210, 14477 ) ); }
add_filter( 'language_attributes', function ( $a ) {
	return tcd_aud_on() && ! is_admin() && tcd_aud_ingles() ? preg_replace( '/lang="[^"]*"/', 'lang="en"', $a ) : $a;
}, 20 );
add_filter( 'wpseo_locale', function ( $l ) { return tcd_aud_on() && tcd_aud_ingles() ? 'en_GB' : $l; } );
add_filter( 'wpseo_exclude_from_sitemap_by_post_ids', function ( $ids ) {
	if ( ! tcd_aud_on() ) { return $ids; }
	$ids = is_array( $ids ) ? $ids : array();
	$ids[] = (int) get_option( 'woocommerce_shop_page_id', 14322 );
	return $ids;
} );
add_filter( 'wpseo_metadesc', function ( $d ) {
	if ( tcd_aud_on() && is_page( 15475 ) && '' === trim( (string) get_post_meta( 15475, '_yoast_wpseo_metadesc', true ) ) ) {
		return 'O IPR, entidade responsável pela Terracrua Design, cede caso a caso ferramentas a associações, cooperativas, IPSS e entidades públicas.';
	}
	return $d;
} );

// 4. Loja.
add_filter( 'gettext', function ( $t, $orig, $dom ) {
	if ( 'woocommerce' === $dom && tcd_aud_on() && false !== strpos( $t, 'preço atual' ) ) { return str_replace( 'preço atual', 'preço actual', $t ); }
	return $t;
}, 20, 3 );
add_filter( 'woocommerce_get_price_html', function ( $h, $p ) {
	if ( ! tcd_aud_on() || is_admin() || ! function_exists( 'is_product' ) || ! is_product() || '' === (string) $h || false !== stripos( $h, 'IVA' ) ) { return $h; }
	if ( 'excl' !== get_option( 'woocommerce_tax_display_shop' ) || ! wc_tax_enabled() ) { return $h; }
	return $h . ' <small class="tcd-aud-iva">+ IVA</small>';
}, 20, 2 );
add_action( 'wp', function () {
	if ( tcd_aud_on() && function_exists( 'is_product' ) && is_product() ) { remove_action( 'woocommerce_single_product_summary', 'woocommerce_template_single_meta', 40 ); }
} );

// 5. Apresentação.
add_action( 'wp_head', function () {
	if ( ! tcd_aud_on() || is_admin() ) { return; }
	echo '<meta name="theme-color" content="#faf8f1">' . "\n";
	if ( '1' === (string) get_option( 'tcd_aud_vis_off' ) ) { return; }
	echo '<style id="tcd-aud-css">html.tcd-ck-aberto #tcd-nl{display:none!important}'
		. 'html.tcd-ck-aberto .tcdsp-b{bottom:calc(var(--tcd-ck-h,0px) + 14px)!important}'
		. '@media (max-width:1024px){a.dropdown-toggle[aria-label="Abrir a pesquisa"]{display:inline-flex!important;align-items:center;justify-content:center;min-width:44px;min-height:44px}}'
		. '</style>' . "\n";
}, 3 );
add_action( 'wp_footer', function () {
	if ( ! tcd_aud_on() || is_admin() || '1' === (string) get_option( 'tcd_aud_vis_off' ) ) { return; }
	?>
<script id="tcd-aud-js">
(function(){
 var H=document.documentElement;
 function ck(){return document.getElementById('tcdck');}
 function aberto(e){if(!e||!e.isConnected||e.hidden)return false;var s=getComputedStyle(e);return s.display!=='none'&&s.visibility!=='hidden'&&e.offsetHeight>0;}
 function ver(){var e=ck();if(aberto(e)){H.classList.add('tcd-ck-aberto');H.style.setProperty('--tcd-ck-h',e.offsetHeight+'px');}else{H.classList.remove('tcd-ck-aberto');}}
 ver();
 var mo=new MutationObserver(ver);
 function ligar(){var e=ck();if(e){mo.observe(e,{attributes:true,attributeFilter:['style','class','hidden']});if(e.parentNode)mo.observe(e.parentNode,{childList:true});}}
 ligar();
 window.addEventListener('resize',ver);
 document.addEventListener('click',function(){setTimeout(ver,60);},true);
 setTimeout(ver,1500);setTimeout(ver,4000);
})();
</script>
	<?php
}, 99 );
