<?php
// Módulo 90071: língua do cliente e interesse fora de Portugal (pedido do Nuno, 18/10/2026, 22h20: «avança com o site»).
// 1. tcd_i18n_lingua(): pt, es, fr ou en, pela cookie do GTranslate (googtrans), pelo parâmetro ?lang= ou pelo
//    Accept-Language do navegador. tcd_i18n_t('chave') devolve o texto nessa língua (dicionário abaixo, a crescer).
// 2. Pedido de Base com o terreno em Espanha ou França (ou noutro ponto da Europa): em vez de «fora de Portugal», guarda o
//    interesse (opção tcd_intl_interesse: e-mail, país, área, centro, língua, data), avisa o Nuno no Telegram e responde
//    ao cliente na língua dele que a Base nesse país está em preparação e que será avisado. Não cria encomenda.
//    Lista para a equipa: /area-equipa/?v=interesse (só quem abre pedidos). Prefixo tcd_i18n_ e tcd_intl_.
if ( ! defined( 'ABSPATH' ) ) { exit; }

// ---------- língua ----------
function tcd_i18n_linguas() { return array( 'pt', 'es', 'fr', 'en' ); }
function tcd_i18n_lingua() {
	static $l = null; if ( null !== $l ) { return $l; }
	// 20/10/2026 (Espanha): o prefixo /es/ (m90245), o cabeçalho X-TCD-Lingua do Atlas e a cookie tcd_lingua mandam primeiro.
	if ( defined( 'TCD_LINGUA_URL' ) ) { return $l = TCD_LINGUA_URL; }
	$h = isset( $_SERVER['HTTP_X_TCD_LINGUA'] ) ? sanitize_key( $_SERVER['HTTP_X_TCD_LINGUA'] ) : ''; // phpcs:ignore
	if ( in_array( $h, tcd_i18n_linguas(), true ) ) { return $l = $h; }
	$ck = isset( $_COOKIE['tcd_lingua'] ) ? sanitize_key( $_COOKIE['tcd_lingua'] ) : ''; // phpcs:ignore
	if ( in_array( $ck, tcd_i18n_linguas(), true ) ) { return $l = $ck; }
	$cands = array();
	if ( isset( $_GET['lang'] ) ) { $cands[] = sanitize_key( $_GET['lang'] ); } // phpcs:ignore
	if ( isset( $_COOKIE['googtrans'] ) ) { $p = explode( '/', (string) $_COOKIE['googtrans'] ); $cands[] = sanitize_key( end( $p ) ); } // phpcs:ignore
	if ( isset( $_SERVER['HTTP_ACCEPT_LANGUAGE'] ) ) { foreach ( explode( ',', (string) $_SERVER['HTTP_ACCEPT_LANGUAGE'] ) as $x ) { $cands[] = strtolower( substr( trim( $x ), 0, 2 ) ); } } // phpcs:ignore
	foreach ( $cands as $c ) { if ( in_array( $c, tcd_i18n_linguas(), true ) ) { return $l = $c; } }
	return $l = 'pt';
}
function tcd_i18n_dic() {
	static $d = null; if ( null !== $d ) { return $d; }
	return $d = apply_filters( 'tcd_i18n_dic', tcd_i18n_dic_base() ); // 20/10/2026: o m90243/m90244 juntam textos em castelhano
}
function tcd_i18n_dic_base() {
	return array(
		'intl_titulo' => array( 'pt' => 'Base Cartográfica fora de Portugal', 'es' => 'Base Cartográfica fuera de Portugal', 'fr' => 'Base Cartographique hors du Portugal', 'en' => 'Cartographic Base outside Portugal' ),
		'intl_es' => array(
			'pt' => 'O seu terreno está em Espanha. A Base Cartográfica com LiDAR do IGN espanhol está em preparação. Guardámos o limite que desenhou e avisamos por e-mail assim que estiver disponível, sem compromisso.',
			'es' => 'Su finca está en España. La Base Cartográfica con LiDAR del IGN español está en preparación. Hemos guardado el límite que dibujó y le avisaremos por correo electrónico en cuanto esté disponible, sin compromiso.',
			'fr' => 'Votre terrain se trouve en Espagne. La Base Cartographique avec le LiDAR de l’IGN espagnol est en préparation. Nous avons enregistré la limite dessinée et vous préviendrons par e-mail dès qu’elle sera disponible, sans engagement.',
			'en' => 'Your land is in Spain. The Cartographic Base with Spanish IGN LiDAR is being prepared. We saved the boundary you drew and will email you as soon as it is available, with no commitment.' ),
		'intl_fr' => array(
			'pt' => 'O seu terreno está em França. A Base Cartográfica com o LiDAR HD do IGN francês está em preparação. Guardámos o limite que desenhou e avisamos por e-mail assim que estiver disponível, sem compromisso.',
			'es' => 'Su finca está en Francia. La Base Cartográfica con el LiDAR HD del IGN francés está en preparación. Hemos guardado el límite que dibujó y le avisaremos por correo electrónico en cuanto esté disponible, sin compromiso.',
			'fr' => 'Votre terrain se trouve en France. La Base Cartographique avec le LiDAR HD de l’IGN est en préparation. Nous avons enregistré la limite dessinée et vous préviendrons par e-mail dès qu’elle sera disponible, sans engagement.',
			'en' => 'Your land is in France. The Cartographic Base with IGN LiDAR HD is being prepared. We saved the boundary you drew and will email you as soon as it is available, with no commitment.' ),
		'intl_outro' => array(
			'pt' => 'O seu terreno está fora de Portugal. Por agora a Base Cartográfica cobre Portugal; Espanha e França vêm a seguir. Guardámos o limite que desenhou e avisamos por e-mail quando chegarmos ao seu país.',
			'es' => 'Su finca está fuera de Portugal. Por ahora la Base Cartográfica cubre Portugal; España y Francia vienen a continuación. Hemos guardado el límite que dibujó y le avisaremos por correo cuando lleguemos a su país.',
			'fr' => 'Votre terrain se trouve hors du Portugal. Pour l’instant la Base Cartographique couvre le Portugal ; l’Espagne et la France suivent. Nous avons enregistré la limite dessinée et vous préviendrons par e-mail quand nous arriverons dans votre pays.',
			'en' => 'Your land is outside Portugal. For now the Cartographic Base covers Portugal; Spain and France are next. We saved the boundary you drew and will email you when we reach your country.' ),
		'intl_email_falta' => array( 'pt' => 'Indique um e-mail para o avisarmos quando a Base estiver disponível no seu país.', 'es' => 'Indique un correo electrónico para avisarle cuando la Base esté disponible en su país.', 'fr' => 'Indiquez un e-mail pour que nous vous prévenions quand la Base sera disponible dans votre pays.', 'en' => 'Enter an email so we can let you know when the Base is available in your country.' ),
	);
}
function tcd_i18n_t( $k, $l = '' ) {
	$l = $l ?: tcd_i18n_lingua(); $d = tcd_i18n_dic();
	if ( empty( $d[ $k ] ) ) { return $k; }
	return isset( $d[ $k ][ $l ] ) ? $d[ $k ][ $l ] : ( isset( $d[ $k ]['pt'] ) ? $d[ $k ]['pt'] : $k );
}

// ---------- país do terreno (grosseiro, por caixas; chega para guardar o interesse) ----------
function tcd_intl_pais( $lng, $lat ) {
	if ( $lng >= -32.5 && $lng <= -6.0 && $lat >= 29.5 && $lat <= 42.3 ) { return 'PT'; } // caixa do m90024 (inclui Galiza e Extremadura ocidentais; são tratadas como Portugal e a equipa confirma)
	if ( $lng >= -9.5 && $lng <= 4.4 && $lat >= 35.9 && $lat <= 43.9 ) { return 'ES'; }
	if ( $lng >= -18.3 && $lng <= -13.3 && $lat >= 27.5 && $lat <= 29.5 ) { return 'ES'; } // Canárias
	if ( $lng >= -5.3 && $lng <= 9.7 && $lat >= 41.3 && $lat <= 51.2 ) { return 'FR'; }
	if ( $lng >= -25 && $lng <= 45 && $lat >= 34 && $lat <= 72 ) { return 'EU'; }
	return 'XX';
}
function tcd_intl_centro( $g ) {
	$n = 0; $sx = 0; $sy = 0;
	// 20/10: isset em vez de count, para não dar avisos ao percorrer arrays associativos do GeoJSON.
	$walk = function ( $c ) use ( &$walk, &$n, &$sx, &$sy ) {
		if ( ! is_array( $c ) ) { return; }
		if ( isset( $c[0], $c[1] ) && is_numeric( $c[0] ) && is_numeric( $c[1] ) && ! is_array( $c[0] ) ) { $n++; $sx += (float) $c[0]; $sy += (float) $c[1]; return; }
		foreach ( $c as $x ) { $walk( $x ); }
	};
	$walk( $g );
	return $n ? array( $sx / $n, $sy / $n, $n ) : null;
}

// Corre antes da guarda do m90024 (prioridade 10): se o terreno está fora de Portugal, guarda o interesse e responde.
add_filter( 'rest_pre_dispatch', function ( $res, $srv, $r ) {
	if ( null !== $res || ! ( $r instanceof WP_REST_Request ) || 'POST' !== strtoupper( $r->get_method() ) || '/tcd/v1/pedido-base' !== strtolower( untrailingslashit( $r->get_route() ) ) ) { return $res; }
	$p = $r->get_body_params();
	if ( ! empty( $p['website'] ) ) { return $res; }
	$txt = (string) ( $p['geojson'] ?? '' ); if ( '' === trim( $txt ) ) { return $res; }
	$g = json_decode( $txt, true ); if ( ! is_array( $g ) ) { return $res; }
	$c = tcd_intl_centro( $g ); if ( ! $c || $c[2] < 4 ) { return $res; }
	$pais = tcd_intl_pais( $c[0], $c[1] );
	// 20/10/2026 (Espanha): fronteira precisa do m90241 em vez da caixa (a Galiza e a Extremadura ocidentais deixam de
	// passar por Portugal). Com tcd_esp_aberto ligado, Espanha peninsular e Baleares seguem para encomenda normal.
	if ( function_exists( 'tcd_esp_pais' ) ) {
		$pe = tcd_esp_pais( $c[0], $c[1] );
		if ( 'PT' === $pe || 'PT_FRONTEIRA' === $pe ) { return $res; }
		if ( 'ES' === $pe && function_exists( 'tcd_esp_aberto' ) && tcd_esp_aberto() ) { return $res; }
		if ( 'ES' === $pe || 'ES_ILHAS' === $pe ) { $pais = 'ES'; } elseif ( 'ES' === $pais ) { $pais = ( $c[0] >= -5.3 && $c[1] >= 41.3 ) ? 'FR' : 'EU'; }
	}
	if ( 'PT' === $pais || 'XX' === $pais ) { return $res; }
	// 21/10/2026 (Europa, m90301): país europeu aberto no registo segue para a encomenda normal.
	if ( function_exists( 'tcd_eu_pais' ) && function_exists( 'tcd_eu_aberto' ) ) { $iso = tcd_eu_pais( $c[0], $c[1] ); if ( '' !== $iso && 'ES' !== $iso && tcd_eu_aberto( $iso ) ) { return $res; } }
	// SR-03 (19/10): IP real atrás da Cloudflare, como no resto do Núcleo.
	$ip = md5( function_exists( 'tcd_sn_ip' ) ? (string) tcd_sn_ip() : (string) ( $_SERVER['REMOTE_ADDR'] ?? '0' ) ); // phpcs:ignore
	$n = (int) get_transient( 'tcd_intl_' . $ip ); if ( $n >= 10 ) { return new WP_Error( 'tcd_intl_limite', 'Demasiados pedidos. Tente mais tarde.', array( 'status' => 429 ) ); } set_transient( 'tcd_intl_' . $ip, $n + 1, HOUR_IN_SECONDS );
	// SR-04 (19/10): um polígono de interesse não precisa de mais de 8 000 caracteres.
	if ( strlen( $txt ) > 8000 ) { return new WP_Error( 'tcd_intl_grande', 'Desenho demasiado detalhado. Simplifique o polígono.', array( 'status' => 413 ) ); }
	$l = tcd_i18n_lingua();
	$em = strtolower( trim( (string) ( $p['email'] ?? '' ) ) );
	if ( ! is_email( $em ) ) { return new WP_Error( 'tcd_intl_email', tcd_i18n_t( 'intl_email_falta', $l ), array( 'status' => 400 ) ); }
	$ha = function_exists( 'tcd_area_geometria' ) ? round( tcd_area_geometria( $g ) / 10000, 1 ) : 0;
	$lista = get_option( 'tcd_intl_interesse', array() ); $lista = is_array( $lista ) ? $lista : array();
	$k = 'ES' === $pais ? 'intl_es' : ( 'FR' === $pais ? 'intl_fr' : 'intl_outro' );
	$resp = rest_ensure_response( array( 'ok' => true, 'interesse' => true, 'pais' => $pais, 'titulo' => tcd_i18n_t( 'intl_titulo', $l ), 'mensagem' => tcd_i18n_t( $k, $l ), 'message' => tcd_i18n_t( $k, $l ) ) );
	// SR-04: um registo por pessoa e terreno por dia (mesmo e-mail e mesmo centro a 4 casas).
	$lng = round( $c[0], 4 ); $lat = round( $c[1], 4 );
	foreach ( $lista as $x ) { if ( ( $x['email'] ?? '' ) === $em && (float) ( $x['lng'] ?? 0 ) === (float) $lng && (float) ( $x['lat'] ?? 0 ) === (float) $lat && time() - (int) ( $x['t'] ?? 0 ) < DAY_IN_SECONDS ) { return $resp; } }
	$lista[] = array( 't' => time(), 'email' => $em, 'nome' => sanitize_text_field( (string) ( $p['nome'] ?? '' ) ), 'pais' => $pais, 'lng' => $lng, 'lat' => $lat, 'ha' => $ha, 'lingua' => $l, 'geojson' => $txt );
	if ( count( $lista ) > 500 ) { $lista = array_slice( $lista, -500 ); }
	update_option( 'tcd_intl_interesse', $lista, false );
	// SR-04: no máximo 20 avisos Telegram por dia; o resto fica na lista e num único aviso de resumo.
	if ( function_exists( 'tcd_tg_enviar' ) ) {
		$kd = 'tcd_intl_tg_' . gmdate( 'Ymd' ); $nd = (int) get_transient( $kd ); set_transient( $kd, $nd + 1, DAY_IN_SECONDS );
		if ( $nd < 20 ) { tcd_tg_enviar( 'Interesse fora de Portugal: ' . esc_html( $pais ) . ', ' . ( $ha ?: '?' ) . ' ha, ' . esc_html( $em ) . ' (' . esc_html( $l ) . '). Lista: ' . home_url( '/area-equipa/?v=interesse' ) ); }
		elseif ( 20 === $nd ) { tcd_tg_enviar( 'Mais de 20 interesses fora de Portugal hoje; os seguintes ficam só na lista: ' . home_url( '/area-equipa/?v=interesse' ) ); }
	}
	return $resp;
}, 5, 3 );

// ---------- lista para a equipa: /area-equipa/?v=interesse ----------
add_action( 'init', function () {
	$ant = shortcode_exists( 'tcd_equipa' ) ? $GLOBALS['shortcode_tags']['tcd_equipa'] : null; if ( ! $ant ) { return; }
	add_shortcode( 'tcd_equipa', function ( $atts = array(), $content = '' ) use ( $ant ) {
		$v = isset( $_GET['v'] ) ? sanitize_key( $_GET['v'] ) : ''; // phpcs:ignore
		if ( 'interesse' !== $v ) { return call_user_func( $ant, $atts, $content ); }
		if ( ! function_exists( 'tcd_eq_pode' ) || ! tcd_eq_pode( 'pedidos' ) ) { return '<p>Sem acesso.</p>'; }
		$lista = array_reverse( (array) get_option( 'tcd_intl_interesse', array() ) );
		$nomes = array( 'ES' => 'Espanha', 'FR' => 'França', 'EU' => 'Europa (outro)' );
		$h = '<div class="tcdm" style="max-width:1000px;margin:0 auto;padding:24px 16px;font:15px/1.5 Inter,Helvetica,Arial,sans-serif"><p class="tcdm-k">Base Cartográfica</p><h2>Interesse fora de Portugal</h2><p style="color:#6b6f5c;max-width:62ch">Terrenos desenhados no mapa de encomenda fora de Portugal. Não há encomenda nem pagamento: a pessoa recebeu a mensagem de que a Base no país dela está em preparação e que será avisada por e-mail.</p>';
		if ( ! $lista ) { return $h . '<p>Ainda não há registos.</p></div>'; }
		$h .= '<table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #e3dfcc;border-radius:10px"><thead><tr><th style="text-align:left;padding:8px">Quando</th><th style="text-align:left;padding:8px">País</th><th style="text-align:left;padding:8px">Área</th><th style="text-align:left;padding:8px">Contacto</th><th style="text-align:left;padding:8px">Língua</th><th style="text-align:left;padding:8px">Mapa</th></tr></thead><tbody>';
		foreach ( $lista as $i ) { $h .= '<tr><td style="padding:8px;border-top:1px solid #f0ede3">' . esc_html( date_i18n( 'j M H:i', (int) $i['t'] ) ) . '</td><td style="padding:8px;border-top:1px solid #f0ede3">' . esc_html( $nomes[ $i['pais'] ] ?? $i['pais'] ) . '</td><td style="padding:8px;border-top:1px solid #f0ede3">' . esc_html( $i['ha'] ? $i['ha'] . ' ha' : '' ) . '</td><td style="padding:8px;border-top:1px solid #f0ede3">' . esc_html( trim( $i['nome'] . ' ' ) ) . '<a href="mailto:' . esc_attr( $i['email'] ) . '">' . esc_html( $i['email'] ) . '</a></td><td style="padding:8px;border-top:1px solid #f0ede3">' . esc_html( strtoupper( $i['lingua'] ) ) . '</td><td style="padding:8px;border-top:1px solid #f0ede3"><a href="https://www.google.com/maps?q=' . esc_attr( $i['lat'] . ',' . $i['lng'] ) . '" target="_blank" rel="noopener">' . esc_html( $i['lat'] . ', ' . $i['lng'] ) . '</a></td></tr>'; }
		return $h . '</tbody></table></div>';
	} );
}, 130 );
add_filter( 'tcd_mesa_atalhos', function ( $a ) {
	if ( function_exists( 'tcd_eq_pode' ) && tcd_eq_pode( 'pedidos' ) ) { $a[] = array( 'Interesse fora de Portugal', home_url( '/area-equipa/?v=interesse' ), 'Terrenos desenhados em Espanha, França e outros', 'pedidos', 'Clientes e projectos' ); }
	return $a;
} );
