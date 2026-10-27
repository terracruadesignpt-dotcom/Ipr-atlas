<?php
// Módulo 90301: Europa, motor comum (pedido do Nuno, 21/10/2026, 19h03: «prepara a Europa toda… vai avançando tudo»).
// 1. tcd_eu_pais( lng, lat ): código ISO do país europeu de um ponto (contornos do m90300), ou '' fora da Europa.
// 2. Registo de países: língua, estado (fechado, interesse, a_pedido, aberto) e situação do LiDAR aberto
//    (pronto, trabalho, manual, sem; estudo estudos/lidar-aberto-europa-2026-10-17.md). A opção tcd_eu_paises (JSON)
//    sobrepõe-se ao registo de base, país a país, sem mexer no código: {"AT":{"estado":"aberto"}}.
// 3. Pedido de Base com o terreno num país europeu que não Portugal nem Espanha (que têm módulos próprios):
//    país aberto → segue para a encomenda normal (e a guarda do m90024 aceita o ponto);
//    país fechado → guarda o interesse na lista do m90071 (tcd_intl_interesse, com país, língua e nota) e responde na
//    língua do pedido ou do país, a dizer se o LiDAR aberto existe (Base em preparação) ou ainda não (avisamos se mudar).
// Corre antes do m90249 (4) e do m90071 (5), na prioridade 3. Interruptor: tcd_eu_off = '1'. Prefixo tcd_eu_.
if ( ! defined( 'ABSPATH' ) ) { exit; }

function tcd_eu_ligado() { return '1' !== (string) get_option( 'tcd_eu_off', '0' ); }

// ---------- registo de países ----------
// l = língua principal; lidar = situação do MDT LiDAR aberto ≥ 2 m (estudo de 17/10, a rever pelo estudo de lacunas).
function tcd_eu_registo_base() {
	$r = array(
		'PT' => array( 'pt', 'pronto' ), 'ES' => array( 'es', 'pronto' ), 'FR' => array( 'fr', 'pronto' ), 'AD' => array( 'es', 'sem' ),
		'IT' => array( 'it', 'trabalho' ), 'MT' => array( 'en', 'trabalho' ), 'SM' => array( 'it', 'trabalho' ), 'VA' => array( 'it', 'sem' ), 'MC' => array( 'fr', 'pronto' ),
		'DE' => array( 'de', 'trabalho' ), 'AT' => array( 'de', 'pronto' ), 'CH' => array( 'de', 'pronto' ), 'LI' => array( 'de', 'pronto' ),
		'NL' => array( 'nl', 'pronto' ), 'BE' => array( 'nl', 'trabalho' ), 'LU' => array( 'fr', 'pronto' ),
		'GB' => array( 'en', 'pronto' ), 'IE' => array( 'en', 'trabalho' ), 'IM' => array( 'en', 'sem' ), 'JE' => array( 'en', 'sem' ), 'GG' => array( 'en', 'sem' ),
		'NO' => array( 'en', 'pronto' ), 'SE' => array( 'en', 'trabalho' ), 'FI' => array( 'en', 'pronto' ), 'AX' => array( 'en', 'pronto' ), 'DK' => array( 'en', 'trabalho' ),
		'IS' => array( 'en', 'sem' ), 'FO' => array( 'en', 'sem' ), 'EE' => array( 'en', 'pronto' ), 'LV' => array( 'en', 'trabalho' ), 'LT' => array( 'en', 'manual' ),
		'PL' => array( 'pl', 'pronto' ), 'CZ' => array( 'en', 'trabalho' ), 'SK' => array( 'en', 'trabalho' ), 'SI' => array( 'en', 'trabalho' ), 'HU' => array( 'en', 'sem' ),
		'HR' => array( 'en', 'trabalho' ), 'RO' => array( 'en', 'manual' ), 'BG' => array( 'en', 'sem' ), 'GR' => array( 'en', 'manual' ), 'CY' => array( 'en', 'sem' ),
		'RS' => array( 'en', 'manual' ), 'BA' => array( 'en', 'sem' ), 'ME' => array( 'en', 'sem' ), 'MK' => array( 'en', 'sem' ), 'AL' => array( 'en', 'sem' ), 'XK' => array( 'en', 'sem' ),
		'MD' => array( 'en', 'sem' ), 'UA' => array( 'en', 'sem' ),
	);
	$o = array();
	foreach ( $r as $k => $v ) { $o[ $k ] = array( 'lingua' => $v[0], 'lidar' => $v[1], 'estado' => 'interesse' ); }
	$o['PT']['estado'] = 'aberto';
	return $o;
}
function tcd_eu_registo( $limpar = false ) {
	static $r = null; if ( $limpar ) { $r = null; } if ( null !== $r ) { return $r; }
	$r = tcd_eu_registo_base();
	$x = json_decode( (string) get_option( 'tcd_eu_paises', '' ), true );
	if ( is_array( $x ) ) {
		foreach ( $x as $k => $v ) {
			$k = strtoupper( substr( preg_replace( '/[^A-Za-z]/', '', (string) $k ), 0, 2 ) );
			if ( ! isset( $r[ $k ] ) || ! is_array( $v ) ) { continue; }
			foreach ( array( 'estado' => array( 'fechado', 'interesse', 'a_pedido', 'aberto' ), 'lidar' => array( 'pronto', 'trabalho', 'manual', 'sem' ) ) as $c => $ok ) {
				if ( isset( $v[ $c ] ) && in_array( $v[ $c ], $ok, true ) ) { $r[ $k ][ $c ] = $v[ $c ]; }
			}
		}
	}
	return $r = apply_filters( 'tcd_eu_registo', $r );
}
function tcd_eu_info( $iso ) { $r = tcd_eu_registo(); return $r[ $iso ] ?? null; }
function tcd_eu_aberto( $iso ) { $i = tcd_eu_info( $iso ); return $i && in_array( $i['estado'], array( 'aberto', 'a_pedido' ), true ); }

// ---------- país de um ponto ----------
function tcd_eu_dentro( $x, $y, $v ) {
	$in = false; $n = count( $v );
	for ( $i = 0, $j = $n - 2; $i < $n; $j = $i, $i += 2 ) {
		$xi = $v[ $i ]; $yi = $v[ $i + 1 ]; $xj = $v[ $j ]; $yj = $v[ $j + 1 ];
		if ( ( $yi > $y ) !== ( $yj > $y ) && $x < ( $xj - $xi ) * ( $y - $yi ) / ( ( $yj - $yi ) ?: 1e-12 ) + $xi ) { $in = ! $in; }
	}
	return $in;
}
function tcd_eu_pais( $lng, $lat ) {
	$lng = (float) $lng; $lat = (float) $lat;
	if ( ! function_exists( 'tcd_eu_contornos' ) ) { return ''; }
	$melhor = ''; $dist = 99;
	foreach ( tcd_eu_contornos() as $iso => $p ) {
		$b = $p['b'];
		if ( $lng < $b[0] - 0.05 || $lng > $b[2] + 0.05 || $lat < $b[1] - 0.05 || $lat > $b[3] + 0.05 ) { continue; }
		foreach ( $p['r'] as $anel ) { if ( tcd_eu_dentro( $lng, $lat, $anel ) ) { return $iso; } }
		// Fora de todos os anéis mas na caixa: guarda o mais próximo (costa, ilhéus simplificados), até ~5 km.
		foreach ( $p['r'] as $anel ) {
			for ( $i = 0, $n = count( $anel ); $i + 1 < $n; $i += 2 ) {
				$d = abs( $anel[ $i ] - $lng ) * cos( deg2rad( $lat ) ) + abs( $anel[ $i + 1 ] - $lat );
				if ( $d < $dist ) { $dist = $d; $melhor = $iso; }
			}
		}
	}
	return $dist < 0.08 ? $melhor : '';
}

// ---------- textos ----------
function tcd_eu_linguas_msg() { return array( 'pt', 'es', 'fr', 'en', 'de', 'it', 'nl', 'pl' ); }
function tcd_eu_lingua( $iso ) {
	$ck = isset( $_COOKIE['tcd_lingua'] ) ? sanitize_key( $_COOKIE['tcd_lingua'] ) : ''; // phpcs:ignore
	if ( in_array( $ck, tcd_eu_linguas_msg(), true ) ) { return $ck; }
	$l = function_exists( 'tcd_i18n_lingua' ) ? tcd_i18n_lingua() : 'pt';
	// Pedido explicitamente noutra língua que não o português por omissão: respeitar.
	$expl = defined( 'TCD_LINGUA_URL' ) || isset( $_SERVER['HTTP_X_TCD_LINGUA'] ) || isset( $_COOKIE['tcd_lingua'] ) || isset( $_GET['lang'] ); // phpcs:ignore
	if ( 'pt' !== $l || $expl ) { return $l; }
	$i = tcd_eu_info( $iso ); $lp = $i ? $i['lingua'] : 'en';
	return in_array( $lp, tcd_eu_linguas_msg(), true ) ? $lp : 'en';
}
function tcd_eu_msg( $k, $l ) {
	$t = array(
		'titulo' => array(
			'pt' => 'Base Cartográfica no seu país', 'es' => 'Base Cartográfica en su país', 'fr' => 'Base Cartographique dans votre pays', 'en' => 'Cartographic Base in your country',
			'de' => 'Kartografische Basis in Ihrem Land', 'it' => 'Base Cartografica nel suo Paese', 'nl' => 'Cartografische Basis in uw land', 'pl' => 'Baza kartograficzna w Pana/Pani kraju' ),
		'prep' => array(
			'pt' => 'O seu país publica dados LiDAR abertos com a resolução de que precisamos, e a Base Cartográfica para aí está em preparação. Guardámos o limite que desenhou e escrevemos uma única vez, para %s, quando estiver disponível.',
			'es' => 'Su país publica datos LiDAR abiertos con la resolución que necesitamos, y la Base Cartográfica para su zona está en preparación. Hemos guardado el límite que dibujó y le escribiremos una sola vez, a %s, cuando esté disponible.',
			'fr' => 'Votre pays publie des données LiDAR ouvertes à la résolution dont nous avons besoin, et la Base Cartographique y est en préparation. Nous avons enregistré la limite dessinée et vous écrirons une seule fois, à %s, dès qu’elle sera disponible.',
			'en' => 'Your country publishes open LiDAR data at the resolution we need, and the Cartographic Base for it is being prepared. We saved the boundary you drew and will write once, to %s, when it is available.',
			'de' => 'Ihr Land veröffentlicht offene LiDAR-Daten in der Auflösung, die wir benötigen, und die Kartografische Basis dafür ist in Vorbereitung. Wir haben die gezeichnete Grenze gespeichert und schreiben Ihnen einmalig an %s, sobald sie verfügbar ist.',
			'it' => 'Il suo Paese pubblica dati LiDAR aperti con la risoluzione di cui abbiamo bisogno e la Base Cartografica è in preparazione. Abbiamo salvato il confine disegnato e le scriveremo una sola volta, a %s, quando sarà disponibile.',
			'nl' => 'Uw land publiceert open LiDAR-gegevens met de resolutie die wij nodig hebben, en de Cartografische Basis daarvoor is in voorbereiding. We hebben de getekende grens bewaard en schrijven u één keer, op %s, zodra die beschikbaar is.',
			'pl' => 'Pana/Pani kraj publikuje otwarte dane LiDAR o potrzebnej nam rozdzielczości, a Baza kartograficzna jest w przygotowaniu. Zapisaliśmy narysowaną granicę i napiszemy jeden raz, na adres %s, gdy będzie dostępna.' ),
		'sem' => array(
			'pt' => 'No seu país ainda não encontrámos dados LiDAR abertos com a resolução que exigimos para a Base Cartográfica, e não a fazemos com dados de satélite. Guardámos o limite que desenhou e escrevemos para %s se isso mudar.',
			'es' => 'En su país todavía no hemos encontrado datos LiDAR abiertos con la resolución que exigimos para la Base Cartográfica, y no la hacemos con datos de satélite. Hemos guardado el límite que dibujó y le escribiremos a %s si eso cambia.',
			'fr' => 'Dans votre pays, nous n’avons pas encore trouvé de données LiDAR ouvertes à la résolution que nous exigeons pour la Base Cartographique, et nous ne la faisons pas avec des données satellite. Nous avons enregistré la limite dessinée et vous écrirons à %s si cela change.',
			'en' => 'In your country we have not yet found open LiDAR data at the resolution we require for the Cartographic Base, and we do not make it from satellite data. We saved the boundary you drew and will write to %s if that changes.',
			'de' => 'In Ihrem Land haben wir noch keine offenen LiDAR-Daten in der Auflösung gefunden, die wir für die Kartografische Basis verlangen, und wir erstellen sie nicht aus Satellitendaten. Wir haben die gezeichnete Grenze gespeichert und schreiben an %s, falls sich das ändert.',
			'it' => 'Nel suo Paese non abbiamo ancora trovato dati LiDAR aperti con la risoluzione che richiediamo per la Base Cartografica, e non la realizziamo con dati satellitari. Abbiamo salvato il confine disegnato e scriveremo a %s se la situazione cambia.',
			'nl' => 'In uw land hebben we nog geen open LiDAR-gegevens gevonden met de resolutie die we voor de Cartografische Basis eisen, en we maken die niet met satellietgegevens. We hebben de getekende grens bewaard en schrijven naar %s als dat verandert.',
			'pl' => 'W Pana/Pani kraju nie znaleźliśmy jeszcze otwartych danych LiDAR o rozdzielczości wymaganej dla Bazy kartograficznej, a nie tworzymy jej z danych satelitarnych. Zapisaliśmy narysowaną granicę i napiszemy na adres %s, jeśli to się zmieni.' ),
		'email' => array(
			'pt' => 'Indique o seu e-mail para o podermos avisar. Só o usamos para este aviso.', 'es' => 'Indique su correo electrónico para que podamos avisarle. Solo lo usaremos para este aviso.',
			'fr' => 'Indiquez votre e-mail pour que nous puissions vous prévenir. Nous ne l’utiliserons que pour cet avis.', 'en' => 'Enter your email so we can let you know. We will only use it for this notice.',
			'de' => 'Geben Sie Ihre E-Mail-Adresse an, damit wir Sie benachrichtigen können. Wir verwenden sie nur dafür.', 'it' => 'Indichi la sua e-mail per poterla avvisare. La useremo solo per questo avviso.',
			'nl' => 'Vul uw e-mailadres in zodat we u kunnen laten weten. We gebruiken het alleen hiervoor.', 'pl' => 'Prosimy podać adres e-mail, abyśmy mogli powiadomić. Użyjemy go tylko w tym celu.' ),
	);
	return $t[ $k ][ $l ] ?? $t[ $k ]['en'];
}

// ---------- pedido de Base ----------
add_filter( 'rest_pre_dispatch', function ( $res, $srv, $r ) {
	if ( null !== $res || ! tcd_eu_ligado() || ! ( $r instanceof WP_REST_Request ) || 'POST' !== strtoupper( $r->get_method() ) || '/tcd/v1/pedido-base' !== strtolower( untrailingslashit( $r->get_route() ) ) ) { return $res; }
	if ( ! function_exists( 'tcd_intl_centro' ) ) { return $res; }
	$p = $r->get_body_params();
	if ( ! empty( $p['website'] ) ) { return $res; }
	$txt = (string) ( $p['geojson'] ?? '' ); if ( '' === trim( $txt ) || strlen( $txt ) > 200000 ) { return $res; }
	$g = json_decode( $txt, true ); if ( ! is_array( $g ) ) { return $res; }
	$c = tcd_intl_centro( $g ); if ( ! $c || $c[2] < 4 ) { return $res; }
	// Portugal e Espanha têm módulos próprios (m90241, m90249, m90071): não tocar.
	if ( function_exists( 'tcd_esp_pais' ) ) { $pe = tcd_esp_pais( $c[0], $c[1] ); if ( in_array( $pe, array( 'PT', 'PT_FRONTEIRA', 'ES', 'ES_ILHAS' ), true ) ) { return $res; } }
	$iso = tcd_eu_pais( $c[0], $c[1] );
	if ( '' === $iso || 'PT' === $iso || 'ES' === $iso ) { return $res; }
	if ( tcd_eu_aberto( $iso ) ) { return $res; } // país aberto: encomenda normal
	$ip = md5( function_exists( 'tcd_sn_ip' ) ? (string) tcd_sn_ip() : (string) ( $_SERVER['REMOTE_ADDR'] ?? '0' ) ); // phpcs:ignore
	$n = (int) get_transient( 'tcd_eu_' . $ip ); if ( $n >= 10 ) { return new WP_Error( 'tcd_eu_limite', 'Too many requests. Please try later.', array( 'status' => 429 ) ); } set_transient( 'tcd_eu_' . $ip, $n + 1, HOUR_IN_SECONDS );
	if ( strlen( $txt ) > 8000 ) { return new WP_Error( 'tcd_eu_grande', 'Drawing too detailed. Please simplify the polygon.', array( 'status' => 413 ) ); }
	$l  = tcd_eu_lingua( $iso );
	$em = strtolower( trim( (string) ( $p['email'] ?? '' ) ) );
	if ( ! is_email( $em ) ) { return new WP_Error( 'tcd_eu_email', tcd_eu_msg( 'email', $l ), array( 'status' => 400 ) ); }
	$info = tcd_eu_info( $iso ); $tipo = in_array( $info['lidar'] ?? 'sem', array( 'pronto', 'trabalho' ), true ) ? 'prep' : 'sem';
	$msg = sprintf( tcd_eu_msg( $tipo, $l ), $em );
	$resp = rest_ensure_response( array( 'ok' => true, 'interesse' => true, 'pais' => $iso, 'titulo' => tcd_eu_msg( 'titulo', $l ), 'mensagem' => $msg, 'message' => $msg ) );
	$lista = get_option( 'tcd_intl_interesse', array() ); $lista = is_array( $lista ) ? $lista : array();
	$lng = round( $c[0], 4 ); $lat = round( $c[1], 4 );
	foreach ( $lista as $x ) { if ( ( $x['email'] ?? '' ) === $em && (float) ( $x['lng'] ?? 0 ) === (float) $lng && (float) ( $x['lat'] ?? 0 ) === (float) $lat && time() - (int) ( $x['t'] ?? 0 ) < DAY_IN_SECONDS ) { return $resp; } }
	$ha = function_exists( 'tcd_area_geometria' ) ? round( tcd_area_geometria( $g ) / 10000, 1 ) : 0;
	$lista[] = array( 't' => time(), 'email' => $em, 'nome' => sanitize_text_field( (string) ( $p['nome'] ?? '' ) ), 'pais' => $iso, 'nota' => 'eu_' . ( $info['lidar'] ?? 'sem' ), 'lng' => $lng, 'lat' => $lat, 'ha' => $ha, 'lingua' => $l, 'geojson' => $txt );
	if ( count( $lista ) > 500 ) { $lista = array_slice( $lista, -500 ); }
	update_option( 'tcd_intl_interesse', $lista, false );
	if ( function_exists( 'tcd_tg_enviar' ) ) {
		$kd = 'tcd_eu_tg_' . gmdate( 'Ymd' ); $nd = (int) get_transient( $kd ); set_transient( $kd, $nd + 1, DAY_IN_SECONDS );
		if ( $nd < 20 ) { tcd_tg_enviar( 'Interesse na Europa: ' . esc_html( $iso ) . ' (LiDAR ' . esc_html( $info['lidar'] ?? '?' ) . '), ' . ( $ha ?: '?' ) . ' ha, ' . esc_html( $em ) . '. Lista: ' . home_url( '/area-equipa/?v=interesse' ) ); }
	}
	return $resp;
}, 3, 3 );

// Guarda do m90024: aceitar pontos em países europeus abertos.
add_filter( 'tcd_gd_ponto_ok', function ( $ok, $p ) {
	if ( $ok || ! tcd_eu_ligado() || ! is_array( $p ) || count( $p ) < 2 ) { return $ok; }
	$iso = tcd_eu_pais( $p[0], $p[1] );
	return '' !== $iso && 'PT' !== $iso && 'ES' !== $iso && tcd_eu_aberto( $iso );
}, 12, 2 );

// Resumo para a equipa e para o Atlas: GET /tcd/v1/eu/paises (estado e LiDAR por país; sem dados pessoais).
add_action( 'rest_api_init', function () {
	register_rest_route( 'tcd/v1', '/eu/paises', array( 'methods' => 'GET', 'permission_callback' => '__return_true', 'callback' => function () {
		$o = array(); foreach ( tcd_eu_registo() as $k => $v ) { $o[ $k ] = array( 'estado' => $v['estado'], 'lidar' => $v['lidar'], 'lingua' => $v['lingua'] ); }
		return rest_ensure_response( $o );
	} ) );
} );
