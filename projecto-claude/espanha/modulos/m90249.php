<?php
// Módulo 90249: Espanha, regiões abertas à Base Cartográfica (decisão do Nuno, 21/10/2026: «só onde há MDT de 50 cm»).
// Com tcd_esp_aberto ligado (m90240), um pedido de Base num terreno em Espanha só segue para encomenda se a comunidade
// autónoma estiver na lista (opção tcd_esp_regioes, códigos INE separados por vírgulas; por omissão as onze com MDT50cm
// da 3.ª cobertura publicado em Setembro de 2026). Fora da lista, o pedido fica registado como interesse (lista
// tcd_intl_interesse do m90071, com regiao e nota) e a pessoa recebe a mensagem de lista de espera.
// A comunidade obtém-se no centro do terreno pelo WMS de unidades administrativas do IGN (e, em recurso, pelo
// CartoCiudad), com cache de 30 dias por ponto. Se nenhum responder, o pedido fica em espera (não se vende sem saber a região).
// Respostas separadas para região em espera e região desconhecida (21/10, tarde).
// Corre antes do m90071 (prioridade 4). Interruptor: tcd_esp_regioes_off = '1' (deixa passar tudo). Prefixo tcd_esreg_.
if ( ! defined( 'ABSPATH' ) ) { exit; }

function tcd_esreg_lista() {
	$v = trim( (string) get_option( 'tcd_esp_regioes', '01,04,06,09,10,11,13,14,15,16,17' ) );
	return array_values( array_filter( array_map( function ( $c ) { return str_pad( preg_replace( '/\D/', '', $c ), 2, '0', STR_PAD_LEFT ); }, explode( ',', $v ) ), function ( $c ) { return '00' !== $c; } ) );
}
function tcd_esreg_nomes() {
	return array( '01' => 'Andalucía', '02' => 'Aragón', '03' => 'Asturias', '04' => 'Illes Balears', '05' => 'Canarias', '06' => 'Cantabria',
		'07' => 'Castilla y León', '08' => 'Castilla-La Mancha', '09' => 'Catalunya', '10' => 'Comunitat Valenciana', '11' => 'Extremadura',
		'12' => 'Galicia', '13' => 'Comunidad de Madrid', '14' => 'Región de Murcia', '15' => 'Navarra', '16' => 'País Vasco', '17' => 'La Rioja',
		'18' => 'Ceuta', '19' => 'Melilla' );
}
// Código INE da comunidade autónoma do ponto, '' se não se souber. Primeiro o WMS de unidades administrativas do IGN
// (GetFeatureInfo: responde também em pleno campo, em Navarra e no País Basco; nationalcode 34CC0000000 no nível 2ndOrder);
// se falhar, o CartoCiudad (só responde perto de moradas). Verificado a 21/10/2026.
function tcd_esreg_ccaa( $lng, $lat ) {
	$lng = (float) $lng; $lat = (float) $lat;
	$k = 'tcd_esreg_' . md5( round( $lng, 3 ) . ',' . round( $lat, 3 ) );
	$c = get_transient( $k );
	if ( false !== $c ) { return (string) $c; }
	$cod = '';
	$d = 0.0005;
	$u = 'https://www.ign.es/wms-inspire/unidades-administrativas?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetFeatureInfo&LAYERS=AU.AdministrativeUnit&QUERY_LAYERS=AU.AdministrativeUnit&STYLES=&CRS=EPSG:4326'
		. '&BBOX=' . rawurlencode( sprintf( '%.6F,%.6F,%.6F,%.6F', $lat - $d, $lng - $d, $lat + $d, $lng + $d ) ) . '&WIDTH=101&HEIGHT=101&I=50&J=50&INFO_FORMAT=application/json&FEATURE_COUNT=10';
	$r = wp_remote_get( $u, array( 'timeout' => 8, 'redirection' => 0, 'user-agent' => 'IPR-Atlas/1.0 (+https://terracruadesign.pt)' ) );
	if ( ! is_wp_error( $r ) && 200 === (int) wp_remote_retrieve_response_code( $r ) ) {
		$j = json_decode( (string) wp_remote_retrieve_body( $r ), true );
		foreach ( (array) ( $j['features'] ?? array() ) as $f ) {
			$pr = (array) ( $f['properties'] ?? array() );
			if ( '2ndOrder' === substr( (string) ( $pr['nationallevel'] ?? '' ), -8 ) && preg_match( '/^34(\d{2})/', (string) ( $pr['nationalcode'] ?? '' ), $m ) ) { $cod = $m[1]; break; }
		}
	}
	if ( '' === $cod ) {
		$u = add_query_arg( array( 'lon' => round( $lng, 6 ), 'lat' => round( $lat, 6 ) ), 'https://www.cartociudad.es/geocoder/api/geocoder/reverseGeocode' );
		$r = wp_remote_get( $u, array( 'timeout' => 8, 'redirection' => 0, 'user-agent' => 'IPR-Atlas/1.0 (+https://terracruadesign.pt)' ) );
		if ( ! is_wp_error( $r ) && 200 === (int) wp_remote_retrieve_response_code( $r ) ) {
			$j = json_decode( (string) wp_remote_retrieve_body( $r ), true );
			if ( is_array( $j ) && isset( $j['comunidadAutonomaCode'] ) ) { $cod = str_pad( preg_replace( '/\D/', '', (string) $j['comunidadAutonomaCode'] ), 2, '0', STR_PAD_LEFT ); }
		}
	}
	if ( '' !== $cod && '00' !== $cod ) { set_transient( $k, $cod, 30 * DAY_IN_SECONDS ); return $cod; }
	return '';
}
// Textos de espanha/lanzamiento/respuestas-region.md (21/10): região identificada sem MDT de 50 cm, ou região desconhecida.
function tcd_esreg_msg( $l, $cod = 'x', $reg = '', $em = '' ) {
	$es = 'es' === $l;
	if ( '' === $cod ) {
		return $es
			? sprintf( 'No hemos podido identificar de forma automática la comunidad autónoma de su terreno. Hemos guardado el límite que dibujó y lo revisaremos nosotros. Le escribiremos a %s para confirmarle si la Base está disponible.', $em )
			: sprintf( 'Não conseguimos identificar automaticamente a comunidade autónoma do seu terreno. Guardámos o limite que desenhou e vamos revê-lo nós. Escrevemos para %s a confirmar se a Base está disponível.', $em );
	}
	return $es
		? sprintf( 'Su terreno está en %s. Allí la Base Cartográfica estará disponible cuando el Instituto Geográfico Nacional publique el MDT de 50 cm de la 3.ª cobertura LiDAR. En España solo la ofrecemos con ese modelo del terreno. Hemos guardado el límite que dibujó. Le escribiremos una sola vez, a %s, cuando esté disponible. Mientras tanto puede seguir explorando el terreno en el IPR Atlas.', $reg, $em )
		: sprintf( 'O seu terreno fica em %s. Aí a Base Cartográfica fica disponível quando o Instituto Geográfico Nacional publicar o MDT de 50 cm da 3.ª cobertura LiDAR. Em Espanha só a fazemos com esse modelo do terreno. Guardámos o limite que desenhou. Escrevemos uma única vez, para %s, quando estiver disponível. Entretanto pode continuar a explorar o terreno no IPR Atlas.', $reg, $em );
}
function tcd_esreg_titulo( $l, $cod ) {
	if ( '' === $cod ) { return 'es' === $l ? 'Vamos a revisar su terreno' : 'Vamos rever o seu terreno'; }
	return 'es' === $l ? 'Base Cartográfica en lista de espera' : 'Base Cartográfica em lista de espera';
}

add_filter( 'rest_pre_dispatch', function ( $res, $srv, $r ) {
	if ( null !== $res || ! ( $r instanceof WP_REST_Request ) || 'POST' !== strtoupper( $r->get_method() ) || '/tcd/v1/pedido-base' !== strtolower( untrailingslashit( $r->get_route() ) ) ) { return $res; }
	if ( '1' === (string) get_option( 'tcd_esp_regioes_off', '0' ) || ! function_exists( 'tcd_esp_aberto' ) || ! tcd_esp_aberto() ) { return $res; }
	if ( ! function_exists( 'tcd_esp_pais' ) || ! function_exists( 'tcd_intl_centro' ) ) { return $res; }
	$p = $r->get_body_params();
	if ( ! empty( $p['website'] ) ) { return $res; }
	$txt = (string) ( $p['geojson'] ?? '' ); if ( '' === trim( $txt ) || strlen( $txt ) > 200000 ) { return $res; }
	$g = json_decode( $txt, true ); if ( ! is_array( $g ) ) { return $res; }
	$c = tcd_intl_centro( $g ); if ( ! $c || $c[2] < 4 ) { return $res; }
	if ( 'ES' !== tcd_esp_pais( $c[0], $c[1] ) ) { return $res; }
	$cod = tcd_esreg_ccaa( $c[0], $c[1] );
	if ( '' !== $cod && in_array( $cod, tcd_esreg_lista(), true ) ) { return $res; } // região aberta: segue para a encomenda
	// Fora da lista (ou região desconhecida): fica em espera.
	if ( function_exists( 'tcd_esp_limite' ) && ! tcd_esp_limite( 'reg', 10 ) ) { return new WP_Error( 'tcd_esreg_limite', 'Demasiados pedidos. Tente mais tarde.', array( 'status' => 429 ) ); }
	if ( strlen( $txt ) > 8000 ) { return new WP_Error( 'tcd_esreg_grande', 'Desenho demasiado detalhado. Simplifique o polígono.', array( 'status' => 413 ) ); }
	$l  = function_exists( 'tcd_i18n_lingua' ) ? tcd_i18n_lingua() : 'pt';
	$em = strtolower( trim( (string) ( $p['email'] ?? '' ) ) );
	if ( ! is_email( $em ) ) {
		$m = 'es' === $l ? 'Indique su correo electrónico para que podamos avisarle. Solo lo usaremos para este aviso.' : 'Indique o seu e-mail para o podermos avisar. Só o usamos para este aviso.';
		return new WP_Error( 'tcd_esreg_email', $m, array( 'status' => 400 ) );
	}
	$nomes = tcd_esreg_nomes(); $reg = '' !== $cod ? ( $nomes[ $cod ] ?? $cod ) : '?';
	$lista = get_option( 'tcd_intl_interesse', array() ); $lista = is_array( $lista ) ? $lista : array();
	$lng = round( $c[0], 4 ); $lat = round( $c[1], 4 );
	$dup = false;
	foreach ( $lista as $x ) { if ( ( $x['email'] ?? '' ) === $em && (float) ( $x['lng'] ?? 0 ) === (float) $lng && (float) ( $x['lat'] ?? 0 ) === (float) $lat && time() - (int) ( $x['t'] ?? 0 ) < DAY_IN_SECONDS ) { $dup = true; break; } }
	if ( ! $dup ) {
		$ha = function_exists( 'tcd_area_geometria' ) ? round( tcd_area_geometria( $g ) / 10000, 1 ) : 0;
		$lista[] = array( 't' => time(), 'email' => $em, 'nome' => sanitize_text_field( (string) ( $p['nome'] ?? '' ) ), 'pais' => 'ES', 'regiao' => $reg,
			'nota' => '' === $cod ? 'regiao_desconhecida' : 'regiao_em_espera', 'lng' => $lng, 'lat' => $lat, 'ha' => $ha, 'lingua' => $l, 'geojson' => $txt );
		if ( count( $lista ) > 500 ) { $lista = array_slice( $lista, -500 ); }
		update_option( 'tcd_intl_interesse', $lista, false );
		if ( function_exists( 'tcd_tg_enviar' ) ) {
			$kd = 'tcd_esreg_tg_' . gmdate( 'Ymd' ); $nd = (int) get_transient( $kd ); set_transient( $kd, $nd + 1, DAY_IN_SECONDS );
			if ( $nd < 20 ) { tcd_tg_enviar( 'Espanha, região em espera: ' . esc_html( $reg ) . ', ' . ( $ha ?: '?' ) . ' ha, ' . esc_html( $em ) . '. Lista: ' . home_url( '/area-equipa/?v=interesse' ) ); }
		}
	}
	$tit = tcd_esreg_titulo( $l, $cod ); $msg = tcd_esreg_msg( $l, $cod, $reg, $em );
	return rest_ensure_response( array( 'ok' => true, 'interesse' => true, 'pais' => 'ES', 'regiao' => $reg, 'titulo' => $tit, 'mensagem' => $msg, 'message' => $msg ) );
}, 4, 3 );
