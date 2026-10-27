<?php
// Módulo 90245: Espanha, endereço /es (decisão do Nuno, 20/10/2026: «terracruadesign.pt/es»).
// 1. Pedidos a /es/... : tira o prefixo antes de o WordPress ler o endereço, marca a língua «es» (TCD_LINGUA_URL, lida pelo
//    m90071), guarda a cookie tcd_lingua=es (para as chamadas REST do Atlas) e põe o locale es_ES. Sem o interruptor
//    tcd_esp_aberto (m90240) só funciona para administradores; os outros recebem a página normal sem prefixo (302).
// 2. Páginas-irmãs: se uma página tiver meta _tcd_esp_de = id da página portuguesa, /es/<slug-pt>/ mostra a irmã.
// 3. hreflang pt-PT, es-ES e x-default (PT) e og:locale; canonical de cada versão para si própria.
// 4. Em /es o GTranslate não traduz (a cookie googtrans é apagada nessa página).
if ( ! defined( 'ABSPATH' ) ) { exit; }

function tcd_esp_caminho_es( $uri ) {
	$p = (string) wp_parse_url( (string) $uri, PHP_URL_PATH );
	return ( '/es' === $p || 0 === strpos( $p, '/es/' ) );
}
function tcd_esp_sem_prefixo( $uri ) {
	$uri = (string) $uri;
	$q = ''; $i = strpos( $uri, '?' ); if ( false !== $i ) { $q = substr( $uri, $i ); $uri = substr( $uri, 0, $i ); }
	$uri = preg_replace( '#^/es(?=/|$)#', '', $uri ); if ( '' === $uri ) { $uri = '/'; }
	return $uri . $q;
}

// Corre o mais cedo possível: o módulo é carregado no plugins_loaded do Núcleo, antes do parse_request.
if ( isset( $_SERVER['REQUEST_URI'] ) && tcd_esp_caminho_es( $_SERVER['REQUEST_URI'] ) ) { // phpcs:ignore
	$GLOBALS['tcd_esp_uri_original'] = (string) $_SERVER['REQUEST_URI']; // phpcs:ignore
	$_SERVER['REQUEST_URI'] = tcd_esp_sem_prefixo( $_SERVER['REQUEST_URI'] ); // phpcs:ignore
	if ( ! defined( 'TCD_LINGUA_URL' ) ) { define( 'TCD_LINGUA_URL', 'es' ); }
	add_action( 'init', function () {
		if ( ! function_exists( 'tcd_esp_visivel' ) || ! tcd_esp_visivel() ) {
			wp_safe_redirect( home_url( $_SERVER['REQUEST_URI'] ), 302 ); exit; // phpcs:ignore
		}
		if ( ! headers_sent() ) {
			setcookie( 'tcd_lingua', 'es', array( 'expires' => time() + 180 * DAY_IN_SECONDS, 'path' => '/', 'secure' => is_ssl(), 'httponly' => false, 'samesite' => 'Lax' ) );
			setcookie( 'googtrans', '', array( 'expires' => time() - 3600, 'path' => '/' ) );
		}
	}, 1 );
	add_filter( 'locale', function () { return 'es_ES'; } );
}

// Ao voltar a uma página sem /es, a língua volta a ser decidida pelo site (a cookie só pesa nas chamadas REST).
add_action( 'init', function () {
	if ( defined( 'TCD_LINGUA_URL' ) || wp_doing_ajax() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) { return; }
	if ( isset( $_COOKIE['tcd_lingua'] ) && ! headers_sent() && ! is_admin() && 'GET' === ( $_SERVER['REQUEST_METHOD'] ?? '' ) ) { // phpcs:ignore
		setcookie( 'tcd_lingua', '', array( 'expires' => time() - 3600, 'path' => '/' ) );
	}
}, 2 );

// Página-irmã em castelhano.
add_filter( 'the_posts', function ( $posts, $q ) {
	if ( ! defined( 'TCD_LINGUA_URL' ) || ! $q->is_main_query() || 1 !== count( (array) $posts ) || 'page' !== $posts[0]->post_type ) { return $posts; }
	$irma = get_posts( array( 'post_type' => 'page', 'post_status' => 'publish', 'numberposts' => 1, 'meta_key' => '_tcd_esp_de', 'meta_value' => (string) $posts[0]->ID, 'fields' => 'all' ) );
	return $irma ? array( $irma[0] ) : $posts;
}, 10, 2 );

function tcd_esp_url_pt() { return home_url( strtok( (string) ( $_SERVER['REQUEST_URI'] ?? '/' ), '?' ) ); } // phpcs:ignore
function tcd_esp_url_es() { return home_url( '/es' . strtok( (string) ( $_SERVER['REQUEST_URI'] ?? '/' ), '?' ) ); } // phpcs:ignore

add_action( 'wp_head', function () {
	if ( is_admin() || is_404() || ! function_exists( 'tcd_esp_aberto' ) || ! tcd_esp_aberto() ) { return; }
	echo '<link rel="alternate" hreflang="pt-PT" href="' . esc_url( tcd_esp_url_pt() ) . "\" />\n";
	echo '<link rel="alternate" hreflang="es-ES" href="' . esc_url( tcd_esp_url_es() ) . "\" />\n";
	echo '<link rel="alternate" hreflang="x-default" href="' . esc_url( tcd_esp_url_pt() ) . "\" />\n";
	if ( defined( 'TCD_LINGUA_URL' ) ) { echo '<meta property="og:locale" content="es_ES" />' . "\n" . '<meta property="og:locale:alternate" content="pt_PT" />' . "\n"; }
}, 2 );

// Canonical de cada versão para si própria (Yoast, Rank Math ou o do WordPress).
$tcd_esp_canon = function ( $c ) { return defined( 'TCD_LINGUA_URL' ) && $c ? tcd_esp_url_es() : $c; };
add_filter( 'wpseo_canonical', $tcd_esp_canon ); add_filter( 'rank_math/frontend/canonical', $tcd_esp_canon );
add_filter( 'get_canonical_url', $tcd_esp_canon );

// O Atlas e os outros scripts do Núcleo sabem a língua da página.
add_action( 'wp_head', function () {
	if ( defined( 'TCD_LINGUA_URL' ) ) { echo "<script>window.IPR_LANG='es';</script>\n"; }
}, 1 );

// Menu: atalho ES/PT para administradores enquanto o interruptor está desligado (para rever), e para todos depois.
add_action( 'wp_footer', function () {
	if ( ! function_exists( 'tcd_esp_visivel' ) || ! tcd_esp_visivel() || is_admin() ) { return; }
	$es = defined( 'TCD_LINGUA_URL' );
	printf( '<a href="%s" style="position:fixed;right:12px;bottom:12px;z-index:9999;background:#2f3a1f;color:#fff;font:600 12px/1 Inter,Arial,sans-serif;padding:8px 10px;border-radius:6px;text-decoration:none" hreflang="%s">%s</a>',
		esc_url( $es ? tcd_esp_url_pt() : tcd_esp_url_es() ), $es ? 'pt-PT' : 'es-ES', $es ? 'PT' : 'ES' );
}, 50 );
