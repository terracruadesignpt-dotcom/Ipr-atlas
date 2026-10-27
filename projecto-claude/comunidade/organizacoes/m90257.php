<?php
// Módulo 90257 · Alertas por polígono para organizações: fogo e vegetação num só motor (decisão do Nuno, 21/10/2026, 16h10:
// «motor único de alertas por polígono, fogo e vegetação desde já»; cf. rewilding/plataformas.md, secção 4 «Alertas» e secção 6, ponto 5).
// Fontes de origem (outras pelo filtro tcd_avi_fontes, ex.: cercas virtuais de colares):
//  - NASA FIRMS, focos activos VIIRS (S-NPP, NOAA-20, NOAA-21) e MODIS. Confirmado em https://firms.modaps.eosdis.nasa.gov/api/area/ :
//    GET /api/area/csv/{MAP_KEY}/{SOURCE}/{west,south,east,north}/{day_range 1..5}[/{YYYY-MM-DD}], SOURCE em VIIRS_SNPP_NRT, VIIRS_NOAA20_NRT,
//    VIIRS_NOAA21_NRT, MODIS_NRT; CSV com cabeçalho (latitude, longitude, bright_ti4 ou brightness, acq_date, acq_time, satellite, confidence,
//    frp, daynight). Limite: 5 000 transacções por 10 minutos por chave.
//  - EFFIS (Copernicus), áreas ardidas. Confirmado em https://forest-fire.emergency.copernicus.eu/applications/data-and-services : WFS
//    https://maps.effis.emergency.copernicus.eu/effis?service=WFS&request=getfeature&typename=ms:modis.ba.poly&version=1.1.0&outputformat=SHAPEZIP
//    (só documenta SHAPEZIP e SPATIALITEZIP). Aqui pede-se outputformat=geojson com bbox em WFS 1.0.0 (ordem lon,lat); o GetCapabilities não
//    respondeu, por isso o tipo fica na opção tcd_avi_effis_tipo e o URL no filtro tcd_avi_effis_url. Resposta que não seja GeoJSON fica no estado.
//  - Global Forest Watch Data API (https://data-api.globalforestwatch.org/openapi.json): POST /dataset/{dataset}/{version}/query/json, corpo
//    {sql, geometry}; cabeçalho x-api-key. Conjunto por defeito umd_glad_dist_alerts (DIST-ALERT da OPERA: global, 30 m, semanal, CC BY 4.0;
//    campos latitude, longitude, umd_glad_dist_alerts__date, __confidence 2 nominal, 3 high, 4 highest; confirmado na revisão de 21/10 em
//    /dataset/umd_glad_dist_alerts/v20261017/fields). Detecta perturbação de vegetação sem distinguir a causa (corte, fogo, seca). O
//    gfw_integrated_alerts (GLAD-L, GLAD-S2, RADD) só cobre 30°N a 30°S e fica como opção em tcd_avi_gfw_conjunto.
//  - Avisos: CPT tcd_aviso (private), meta _tcd_avi {org, fonte, lat, lon, quando, confianca, dados, camada, grupo, dist_m, estado novo|acusado|
//    resolvido, acusado_por, acusado_em, resolvido_por, criado}, _tcd_avi_org e _tcd_avi_hash (sha1 fonte|lat|lon|data). Apagados aos 180 dias.
//  - Área vigiada: polígonos das camadas dos grupos de área (defeito: grupos que contam ha), lidos do ficheiro exacto (o cron corre sem
//    utilizador); ray casting e distância ao contorno em metros, dentro da margem (defeito 2 km, máx 10).
//  - Cron: tcd_avi_hora (hourly) corre o FIRMS para até 25 organizações activas (fila circular tcd_avi_cursor, orçamento 60 s); tcd_org_diario
//    (40) corre EFFIS e GFW (120 s); (45) apaga avisos velhos por data. FIRMS e EFFIS numa só chamada por ronda para a união das bbox (se couber
//    em 6°), descodificada uma vez e cruzada por organização; GFW uma chamada por organização. Hosts fixos, timeout 10 s, sem redireccionamentos,
//    corpo cortado a 8 MB. A chave FIRMS vai no caminho por desenho da API: nunca entra em mensagens nem no estado (tcd_avi_sem_chaves).
//    «Correr agora» agenda tcd_avi_agora (wp_schedule_single_event) em vez de correr no pedido. Estado em tcd_avi_estado.
//  - Avisos novos: uma mensagem agrupada por organização e fonte no Telegram e, se ligado, e-mail aos donos e gestores (1 por hora). Bloco
//    «Alertas» na Oficina com «Acuso recepção» (qualquer membro) e «Resolvido» (gestor). REST com sessão: GET /tcd/v1/org/avisos (?id=).
//  - Chaves em opções autoload=no (tcd_avi_firms_chave, tcd_avi_gfw_chave), coladas em Ferramentas › Alertas IPR; nunca se mostram.
// Interruptor: tcd_avi_off = 1. Prefixo tcd_avi_. Depende do m90253 (organizações), m90254 (camadas) e m90250 (Oficina).
if ( ! defined( 'ABSPATH' ) ) { exit; }

function tcd_avi_on() { return '1' !== (string) get_option( 'tcd_avi_off', '' ) && function_exists( 'tcd_org_de' ) && function_exists( 'tcd_cam_lista' ); }
define( 'TCD_AVI_MAX', 5000 ); define( 'TCD_AVI_DIAS', 180 ); define( 'TCD_AVI_ORGS_HORA', 25 ); define( 'TCD_AVI_LOTE_GRAUS', 6 );
add_action( 'init', function () { register_post_type( 'tcd_aviso', array( 'public' => false, 'show_ui' => false, 'supports' => array( 'title' ), 'label' => 'Avisos de organizações' ) ); }, 5 );
add_action( 'init', function () { if ( tcd_avi_on() && ! wp_next_scheduled( 'tcd_avi_hora' ) ) { wp_schedule_event( time() + 300, 'hourly', 'tcd_avi_hora' ); } } );

// ---------- fontes e configuração ----------
// Cada fonte: nome, cor, ritmo (hora|dia), f($org, $cfg, $area) que devolve array('itens' => [...], 'erro' => '') ou WP_Error, e opcionalmente
// buscar($bbox) com a mesma devolução, para uma só chamada por ronda (união das bbox das organizações).
// Item: lat, lon, quando ('Y-m-d H:i' UTC), confianca, dados (array), e opcionalmente anel (polígono [[lon,lat],...]) para áreas.
function tcd_avi_fontes() {
	return (array) apply_filters( 'tcd_avi_fontes', array(
		'firms' => array( 'nome' => 'NASA FIRMS · focos activos', 'cor' => '#d0482c', 'ritmo' => 'hora', 'f' => 'tcd_avi_firms', 'buscar' => 'tcd_avi_firms_buscar' ),
		'effis' => array( 'nome' => 'EFFIS · áreas ardidas', 'cor' => '#e08a2c', 'ritmo' => 'dia', 'f' => 'tcd_avi_effis', 'buscar' => 'tcd_avi_effis_buscar' ),
		'gfw'   => array( 'nome' => 'Global Forest Watch · DIST-ALERT, perturbação de vegetação', 'cor' => '#4f6b3a', 'ritmo' => 'dia', 'f' => 'tcd_avi_gfw' ),
	) );
}
function tcd_avi_cfg( $org ) {
	$d = tcd_org_dados( $org ); $a = is_array( $d['avisos'] ?? null ) ? $d['avisos'] : array(); // a chave «avisos» é partilhada com as marcas 60/80 dias do m90253
	$todos = tcd_cam_grupos( $org ); $g = array(); $ns = array(); foreach ( $todos as $k => $x ) { if ( empty( $x['sensivel'] ) ) { $ns[] = $k; if ( ! empty( $x['ha'] ) ) { $g[] = $k; } } } // grupos sensíveis nunca definem a área (o aviso diria o nome e a distância)
	$fontes = isset( $a['fontes'] ) && is_array( $a['fontes'] ) ? array_values( array_intersect( $a['fontes'], array_keys( tcd_avi_fontes() ) ) ) : array_keys( tcd_avi_fontes() );
	return array(
		'fontes' => $fontes,
		'margem_km' => min( 10.0, max( 0.0, (float) ( $a['margem_km'] ?? 2 ) ) ),
		'email' => (int) ! empty( $a['email'] ),
		'grupos_area' => ! empty( $a['grupos_area'] ) && is_array( $a['grupos_area'] ) ? array_values( array_intersect( array_map( 'sanitize_key', $a['grupos_area'] ), $ns ) ) : $g,
		'dias_gfw' => min( 30, max( 1, (int) ( $a['dias_gfw'] ?? 14 ) ) ),
	);
}
function tcd_avi_cfg_guardar( $org, $cfg ) {
	$d = tcd_org_dados( $org ); if ( ! $d ) { return; } $a = is_array( $d['avisos'] ?? null ) ? $d['avisos'] : array();
	foreach ( array( 'fontes', 'margem_km', 'email', 'grupos_area', 'dias_gfw' ) as $k ) { if ( isset( $cfg[ $k ] ) ) { $a[ $k ] = $cfg[ $k ]; } }
	$d['avisos'] = $a; tcd_org_guardar( $org, $d );
}
function tcd_avi_orgs() { // organizações activas, por id
	$out = array(); foreach ( get_posts( array( 'post_type' => 'tcd_org', 'post_status' => 'any', 'numberposts' => 500, 'fields' => 'ids' ) ) as $id ) { $d = tcd_org_dados( $id ); if ( $d && 'activa' === $d['estado'] ) { $out[] = (int) $id; } } sort( $out ); return $out;
}

// ---------- área vigiada e geometria ----------
// null sem polígonos; senão array(bbox [w,s,e,n] com margem, margem_m, polis [{camada, nome, grupo, anel, bbox}]).
function tcd_avi_area( $org, $cfg = null ) {
	$cfg = $cfg ?: tcd_avi_cfg( $org ); $polis = array(); $b = array( 180, 90, -180, -90 ); $nv = 0;
	foreach ( tcd_cam_lista( $org, null, false ) as $c ) {
		if ( ! in_array( $c['grupo'], $cfg['grupos_area'], true ) || ! in_array( $c['geom'], array( 'poligono', 'misto' ), true ) ) { continue; }
		$f = tcd_cam_ficheiro( $c ); if ( ! is_readable( $f ) ) { continue; }
		$gj = json_decode( file_get_contents( $f ), true ); if ( ! is_array( $gj ) || empty( $gj['features'] ) ) { continue; }
		foreach ( $gj['features'] as $ft ) {
			$g = $ft['geometry'] ?? null; if ( ! is_array( $g ) ) { continue; }
			$aneis = 'Polygon' === ( $g['type'] ?? '' ) ? array( $g['coordinates'][0] ?? array() ) : ( 'MultiPolygon' === ( $g['type'] ?? '' ) ? array_map( function ( $p ) { return $p[0] ?? array(); }, (array) $g['coordinates'] ) : array() ); // só anéis exteriores
			foreach ( $aneis as $an ) {
				if ( ! is_array( $an ) || count( $an ) < 4 ) { continue; } $ab = tcd_avi_bbox( $an ); if ( ! $ab ) { continue; }
				$polis[] = array( 'camada' => (int) $c['id'], 'nome' => (string) $c['nome'], 'grupo' => (string) $c['grupo'], 'anel' => $an, 'bbox' => $ab );
				$b = array( min( $b[0], $ab[0] ), min( $b[1], $ab[1] ), max( $b[2], $ab[2] ), max( $b[3], $ab[3] ) ); $nv += count( $an );
				if ( $nv > 400000 ) { break 3; } // tecto de vértices por organização
			}
		}
	}
	if ( ! $polis ) { return null; }
	$m = $cfg['margem_km'] * 1000.0; $dlat = $m / 110540.0; $dlon = $m / max( 1.0, cos( deg2rad( ( $b[1] + $b[3] ) / 2 ) ) * 111320.0 );
	return array( 'bbox' => array( round( max( -180, $b[0] - $dlon ), 5 ), round( max( -90, $b[1] - $dlat ), 5 ), round( min( 180, $b[2] + $dlon ), 5 ), round( min( 90, $b[3] + $dlat ), 5 ) ), 'margem_m' => $m, 'polis' => $polis );
}
function tcd_avi_bbox( $anel ) { $b = array( 180, 90, -180, -90 ); foreach ( $anel as $p ) { if ( ! is_array( $p ) || count( $p ) < 2 || ! is_numeric( $p[0] ) || ! is_numeric( $p[1] ) ) { return null; } $b = array( min( $b[0], $p[0] ), min( $b[1], $p[1] ), max( $b[2], $p[0] ), max( $b[3], $p[1] ) ); } return $b; }
function tcd_avi_dentro( $lon, $lat, $anel ) { // ray casting
	$n = count( $anel ); $in = false;
	for ( $i = 0, $j = $n - 1; $i < $n; $j = $i++ ) {
		$xi = (float) $anel[ $i ][0]; $yi = (float) $anel[ $i ][1]; $xj = (float) $anel[ $j ][0]; $yj = (float) $anel[ $j ][1];
		if ( ( $yi > $lat ) !== ( $yj > $lat ) && $lon < ( $xj - $xi ) * ( $lat - $yi ) / ( $yj - $yi + 1e-12 ) + $xi ) { $in = ! $in; }
	}
	return $in;
}
function tcd_avi_dist_m( $lon, $lat, $anel ) { // distância em metros ao contorno (0 se dentro), equirectangular local
	if ( tcd_avi_dentro( $lon, $lat, $anel ) ) { return 0.0; }
	$kx = cos( deg2rad( $lat ) ) * 111320.0; $ky = 110540.0; $px = $lon * $kx; $py = $lat * $ky; $best = INF; $n = count( $anel );
	for ( $i = 0; $i < $n - 1; $i++ ) {
		$ax = (float) $anel[ $i ][0] * $kx; $ay = (float) $anel[ $i ][1] * $ky; $bx = (float) $anel[ $i + 1 ][0] * $kx; $by = (float) $anel[ $i + 1 ][1] * $ky;
		$dx = $bx - $ax; $dy = $by - $ay; $l2 = $dx * $dx + $dy * $dy; $t = $l2 > 0 ? max( 0.0, min( 1.0, ( ( $px - $ax ) * $dx + ( $py - $ay ) * $dy ) / $l2 ) ) : 0.0;
		$d = hypot( $px - ( $ax + $t * $dx ), $py - ( $ay + $t * $dy ) ); if ( $d < $best ) { $best = $d; }
	}
	return $best;
}
// Ponto contra a área: {camada, nome, grupo, dist_m} do polígono mais próximo dentro da margem, ou null.
function tcd_avi_cruzar( $area, $lon, $lat ) {
	if ( ! $area || $lon < $area['bbox'][0] || $lon > $area['bbox'][2] || $lat < $area['bbox'][1] || $lat > $area['bbox'][3] ) { return null; }
	$m = $area['margem_m']; $dlat = $m / 110540.0; $dlon = $m / max( 1.0, cos( deg2rad( $lat ) ) * 111320.0 ); $best = null;
	foreach ( $area['polis'] as $p ) {
		$b = $p['bbox']; if ( $lon < $b[0] - $dlon || $lon > $b[2] + $dlon || $lat < $b[1] - $dlat || $lat > $b[3] + $dlat ) { continue; }
		$d = tcd_avi_dist_m( $lon, $lat, $p['anel'] ); if ( $d <= $m && ( null === $best || $d < $best['dist_m'] ) ) { $best = array( 'camada' => $p['camada'], 'nome' => $p['nome'], 'grupo' => $p['grupo'], 'dist_m' => (int) round( $d ) ); }
		if ( $best && 0 === $best['dist_m'] ) { break; }
	}
	return $best;
}
// Polígono (área ardida) contra a área: bbox a intersectar e centróide ou um vértice dentro da margem.
function tcd_avi_cruzar_poligono( $area, $anel ) {
	$ab = tcd_avi_bbox( $anel ); if ( ! $area || ! $ab || $ab[0] > $area['bbox'][2] || $ab[2] < $area['bbox'][0] || $ab[1] > $area['bbox'][3] || $ab[3] < $area['bbox'][1] ) { return null; }
	$c = tcd_avi_centroide( $anel ); $r = tcd_avi_cruzar( $area, $c[0], $c[1] ); if ( $r ) { return $r; }
	$n = count( $anel ); $passo = max( 1, (int) floor( $n / 400 ) );
	for ( $i = 0; $i < $n; $i += $passo ) { $r = tcd_avi_cruzar( $area, (float) $anel[ $i ][0], (float) $anel[ $i ][1] ); if ( $r ) { return $r; } }
	return null;
}
function tcd_avi_centroide( $anel ) { $x = 0; $y = 0; $n = 0; foreach ( $anel as $p ) { if ( is_array( $p ) && is_numeric( $p[0] ?? null ) && is_numeric( $p[1] ?? null ) ) { $x += (float) $p[0]; $y += (float) $p[1]; $n++; } } return $n ? array( $x / $n, $y / $n ) : array( 0.0, 0.0 ); }

// ---------- avisos ----------
function tcd_avi_dados( $id ) { $id = (int) $id; if ( ! $id || 'tcd_aviso' !== get_post_type( $id ) ) { return null; } $a = get_post_meta( $id, '_tcd_avi', true ); if ( ! is_array( $a ) ) { return null; } $a['id'] = $id; return $a; }
function tcd_avi_hash( $fonte, $lat, $lon, $quando ) { return sha1( $fonte . '|' . number_format( (float) $lat, 4, '.', '' ) . '|' . number_format( (float) $lon, 4, '.', '' ) . '|' . substr( (string) $quando, 0, 10 ) ); }
function tcd_avi_titulo( $fonte, $dados = array() ) {
	$f = tcd_avi_fontes(); $t = $f[ $fonte ]['nome'] ?? $fonte;
	if ( 'firms' === $fonte ) { $t = 'Foco de calor' . ( ! empty( $dados['satelite'] ) ? ' (' . $dados['satelite'] . ')' : '' ); }
	elseif ( 'effis' === $fonte ) { $t = 'Área ardida' . ( isset( $dados['area_ha'] ) ? ' de ' . number_format( (float) $dados['area_ha'], 0, ',', ' ' ) . ' ha' : '' ); }
	elseif ( 'gfw' === $fonte ) { $t = 'Perturbação de vegetação (DIST-ALERT, causa não distinguida)'; }
	return $t;
}
// Cria um aviso (também para outros módulos): id, 0 se já existia, ou WP_Error. $dados pode trazer camada, grupo, dist_m já cruzados.
function tcd_avi_criar( $org, $fonte, $lat, $lon, $quando, $dados = array() ) {
	$org = (int) $org; $fonte = sanitize_key( $fonte ); $lat = (float) $lat; $lon = (float) $lon;
	if ( ! $org || ! tcd_org_dados( $org ) || '' === $fonte || abs( $lat ) > 90 || abs( $lon ) > 180 ) { return new WP_Error( 'avi', 'Aviso inválido.' ); }
	$quando = preg_match( '/^\d{4}-\d{2}-\d{2}( \d{2}:\d{2})?$/', (string) $quando ) ? (string) $quando : gmdate( 'Y-m-d H:i' );
	$h = tcd_avi_hash( $fonte, $lat, $lon, $quando );
	if ( get_posts( array( 'post_type' => 'tcd_aviso', 'post_status' => 'any', 'numberposts' => 1, 'fields' => 'ids', 'meta_key' => '_tcd_avi_hash', 'meta_value' => $h ) ) ) { return 0; }
	$dados = is_array( $dados ) ? $dados : array(); $cruz = null;
	if ( empty( $dados['camada'] ) ) { $cruz = tcd_avi_cruzar( tcd_avi_area( $org ), $lon, $lat ); }
	$conf = mb_substr( sanitize_text_field( (string) ( $dados['confianca'] ?? '' ) ), 0, 20 ); unset( $dados['confianca'] );
	$extra = array(); foreach ( $dados as $k => $v ) { if ( in_array( $k, array( 'camada', 'grupo', 'dist_m', 'nome_camada' ), true ) || ! is_scalar( $v ) ) { continue; } $extra[ mb_substr( sanitize_key( $k ), 0, 30 ) ] = is_string( $v ) ? mb_substr( sanitize_text_field( $v ), 0, 120 ) : $v; if ( count( $extra ) >= 20 ) { break; } }
	$id = wp_insert_post( array( 'post_type' => 'tcd_aviso', 'post_status' => 'private', 'post_title' => tcd_avi_titulo( $fonte, $extra ) . ' · ' . $quando ) );
	if ( ! $id || is_wp_error( $id ) ) { return new WP_Error( 'avi', 'Não foi possível guardar o aviso.' ); }
	$a = array( 'org' => $org, 'fonte' => $fonte, 'lat' => round( $lat, 5 ), 'lon' => round( $lon, 5 ), 'quando' => $quando, 'confianca' => $conf, 'dados' => $extra,
		'camada' => (int) ( $dados['camada'] ?? ( $cruz['camada'] ?? 0 ) ), 'nome_camada' => mb_substr( sanitize_text_field( (string) ( $dados['nome_camada'] ?? ( $cruz['nome'] ?? '' ) ) ), 0, 90 ), 'grupo' => sanitize_key( $dados['grupo'] ?? ( $cruz['grupo'] ?? '' ) ), 'dist_m' => (int) ( $dados['dist_m'] ?? ( $cruz['dist_m'] ?? 0 ) ),
		'estado' => 'novo', 'acusado_por' => 0, 'acusado_em' => '', 'resolvido_por' => 0, 'criado' => time() );
	update_post_meta( $id, '_tcd_avi', $a ); update_post_meta( $id, '_tcd_avi_org', $org ); update_post_meta( $id, '_tcd_avi_hash', $h );
	do_action( 'tcd_avi_criado', $id, $a );
	return (int) $id;
}
function tcd_avi_lista( $org, $n = 30 ) {
	$ids = get_posts( array( 'post_type' => 'tcd_aviso', 'post_status' => 'any', 'numberposts' => (int) $n, 'fields' => 'ids', 'orderby' => 'date', 'order' => 'DESC', 'meta_key' => '_tcd_avi_org', 'meta_value' => (int) $org ) ); rsort( $ids ); $out = array();
	foreach ( $ids as $id ) { $a = tcd_avi_dados( $id ); if ( $a ) { $out[] = $a; } if ( count( $out ) >= $n ) { break; } } return $out;
}
// O aviso como esta pessoa o pode ver: sem nome nem distância de uma camada sensível que ela não vê.
function tcd_avi_para( $a, $u ) { if ( ! empty( $a['camada'] ) ) { $c = tcd_cam_dados( $a['camada'] ); if ( ! $c || ! tcd_cam_ve( $u, $c ) ) { $a['camada'] = 0; $a['nome_camada'] = ''; $a['dist_m'] = 0; } } return $a; }
// Nunca deixar uma chave sair numa mensagem de erro ou no estado.
function tcd_avi_sem_chaves( $s ) { $s = (string) $s; foreach ( array( 'tcd_avi_firms_chave', 'tcd_avi_gfw_chave' ) as $o ) { $k = (string) get_option( $o, '' ); if ( '' !== $k ) { $s = str_replace( array( $k, rawurlencode( $k ) ), '***', $s ); } } return $s; }
function tcd_avi_estado_guardar( $fonte, $n, $orgs, $erro ) { $e = get_option( 'tcd_avi_estado', array() ); $e = is_array( $e ) ? $e : array(); $e[ $fonte ] = array( 'quando' => time(), 'n' => (int) $n, 'orgs' => (int) $orgs, 'erro' => mb_substr( tcd_avi_sem_chaves( $erro ), 0, 300 ) ); update_option( 'tcd_avi_estado', $e, false ); }

// ---------- HTTP com hosts fixos ----------
// Sem redireccionamentos (a chave FIRMS vai no caminho), 10 s, corpo cortado a 8 MB; erros só com código HTTP e 120 caracteres sem chaves.
function tcd_avi_http( $url, $args = array() ) {
	$host = (string) wp_parse_url( $url, PHP_URL_HOST ); $ok = (array) apply_filters( 'tcd_avi_hosts', array( 'firms.modaps.eosdis.nasa.gov', 'maps.effis.emergency.copernicus.eu', 'data-api.globalforestwatch.org' ) );
	if ( ! in_array( $host, $ok, true ) ) { return new WP_Error( 'host', 'Host não permitido.' ); }
	$args = array_merge( array( 'timeout' => 10, 'redirection' => 0, 'limit_response_size' => 8 * 1048576, 'user-agent' => 'IPR Atlas (terracruadesign.pt)' ), $args );
	$r = empty( $args['body'] ) ? wp_remote_get( $url, $args ) : wp_remote_post( $url, $args );
	if ( is_wp_error( $r ) ) { return new WP_Error( 'http', tcd_avi_sem_chaves( mb_substr( $r->get_error_message(), 0, 120 ) ) ); }
	$cod = (int) wp_remote_retrieve_response_code( $r ); $b = (string) wp_remote_retrieve_body( $r );
	if ( $cod < 200 || $cod >= 300 ) { return new WP_Error( 'http', 'HTTP ' . $cod . ( $b ? ': ' . tcd_avi_sem_chaves( mb_substr( wp_strip_all_tags( $b ), 0, 120 ) ) : '' ) ); }
	return $b;
}
function tcd_avi_chave_resumo( $k ) { $k = (string) $k; return '' === $k ? 'não definida' : 'definida (termina em ..' . substr( $k, -2 ) . ')'; }
function tcd_avi_bbox_poligono( $b ) { return array( 'type' => 'Polygon', 'coordinates' => array( array( array( $b[0], $b[1] ), array( $b[2], $b[1] ), array( $b[2], $b[3] ), array( $b[0], $b[3] ), array( $b[0], $b[1] ) ) ) ); }

// ---------- fonte FIRMS ----------
// buscar($bbox) serve a organização e o lote; f() é a forma por organização.
function tcd_avi_firms( $org, $cfg, $area ) { return tcd_avi_firms_buscar( $area['bbox'] ); }
function tcd_avi_firms_buscar( $bbox ) {
	$chave = (string) get_option( 'tcd_avi_firms_chave', '' ); if ( '' === $chave ) { return new WP_Error( 'chave', 'chave não definida' ); }
	$srcs = array_filter( array_map( 'trim', explode( ',', (string) get_option( 'tcd_avi_firms_fontes', 'VIIRS_SNPP_NRT,VIIRS_NOAA20_NRT,VIIRS_NOAA21_NRT' ) ) ) ); $itens = array(); $erros = array();
	foreach ( $srcs as $s ) {
		if ( ! preg_match( '/^[A-Z0-9_]{4,30}$/', $s ) ) { continue; }
		$b = tcd_avi_http( 'https://firms.modaps.eosdis.nasa.gov/api/area/csv/' . rawurlencode( $chave ) . '/' . $s . '/' . implode( ',', $bbox ) . '/1' );
		if ( is_wp_error( $b ) ) { $erros[] = $s . ': ' . tcd_avi_sem_chaves( $b->get_error_message() ); continue; }
		$r = tcd_avi_firms_csv( $b, $s ); if ( is_wp_error( $r ) ) { $erros[] = $s . ': ' . tcd_avi_sem_chaves( $r->get_error_message() ); continue; } $itens = array_merge( $itens, $r );
	}
	return array( 'itens' => $itens, 'erro' => implode( '; ', $erros ) );
}
function tcd_avi_firms_csv( $txt, $src = '' ) {
	$ls = preg_split( '/\r?\n/', trim( (string) $txt ) ); if ( ! $ls || '' === $ls[0] ) { return array(); }
	$h = array_map( function ( $x ) { return strtolower( trim( $x ) ); }, str_getcsv( $ls[0] ) ); $ix = array_flip( $h );
	if ( ! isset( $ix['latitude'], $ix['longitude'] ) ) { return new WP_Error( 'csv', 'resposta sem cabeçalho CSV: ' . mb_substr( $ls[0], 0, 80 ) ); }
	$out = array(); $n = count( $ls );
	for ( $i = 1; $i < $n && $i <= TCD_AVI_MAX; $i++ ) {
		$v = str_getcsv( $ls[ $i ] ); if ( count( $v ) < 2 ) { continue; }
		$lat = (float) ( $v[ $ix['latitude'] ] ?? 0 ); $lon = (float) ( $v[ $ix['longitude'] ] ?? 0 ); if ( ! $lat && ! $lon ) { continue; }
		$g = function ( $k ) use ( $v, $ix ) { return isset( $ix[ $k ] ) ? trim( (string) ( $v[ $ix[ $k ] ] ?? '' ) ) : ''; };
		$hora = str_pad( preg_replace( '/\D/', '', $g( 'acq_time' ) ), 4, '0', STR_PAD_LEFT ); $data = $g( 'acq_date' ); $quando = preg_match( '/^\d{4}-\d{2}-\d{2}$/', $data ) ? $data . ' ' . substr( $hora, 0, 2 ) . ':' . substr( $hora, 2, 2 ) : gmdate( 'Y-m-d H:i' );
		$c = strtolower( $g( 'confidence' ) ); $conf = is_numeric( $c ) ? ( (float) $c >= 80 ? 'alta' : ( (float) $c >= 30 ? 'nominal' : 'baixa' ) ) : ( 'h' === $c || 'high' === $c ? 'alta' : ( 'l' === $c || 'low' === $c ? 'baixa' : 'nominal' ) );
		$out[] = array( 'lat' => $lat, 'lon' => $lon, 'quando' => $quando, 'confianca' => $conf, 'dados' => array_filter( array( 'satelite' => $g( 'satellite' ) ?: $src, 'frp' => $g( 'frp' ), 'brilho' => $g( 'bright_ti4' ) ?: $g( 'brightness' ), 'dia_noite' => $g( 'daynight' ), 'instrumento' => $g( 'instrument' ) ), 'strlen' ) );
	}
	return $out;
}

// ---------- fonte EFFIS ----------
function tcd_avi_effis( $org, $cfg, $area ) { return tcd_avi_effis_buscar( $area['bbox'] ); }
function tcd_avi_effis_buscar( $bbox ) {
	$tipo = (string) get_option( 'tcd_avi_effis_tipo', 'ms:modis.ba.poly' ); if ( ! preg_match( '/^[a-z0-9_.:-]{3,60}$/i', $tipo ) ) { $tipo = 'ms:modis.ba.poly'; }
	$url = (string) apply_filters( 'tcd_avi_effis_url', 'https://maps.effis.emergency.copernicus.eu/effis?service=WFS&version=1.0.0&request=GetFeature&typename=' . rawurlencode( $tipo ) . '&outputformat=geojson&maxfeatures=500&bbox=' . implode( ',', $bbox ), $bbox, $tipo );
	$b = tcd_avi_http( $url ); if ( is_wp_error( $b ) ) { return $b; }
	$gj = json_decode( $b, true, 16 ); unset( $b ); // descodificado uma vez; reutilizado por todas as organizações do lote
	return array( 'itens' => is_array( $gj ) ? tcd_avi_effis_geojson( $gj ) : array(), 'erro' => is_array( $gj ) ? '' : 'resposta não é GeoJSON' );
}
function tcd_avi_effis_geojson( $gj ) {
	if ( is_string( $gj ) ) { $gj = json_decode( $gj, true, 16 ); } $out = array(); if ( ! is_array( $gj ) || empty( $gj['features'] ) || ! is_array( $gj['features'] ) ) { return $out; }
	$n = 0;
	foreach ( $gj['features'] as $f ) {
		if ( ++$n > TCD_AVI_MAX ) { break; } $g = $f['geometry'] ?? null; $pr = array_change_key_case( (array) ( $f['properties'] ?? array() ), CASE_LOWER ); if ( ! is_array( $g ) ) { continue; }
		$aneis = 'Polygon' === ( $g['type'] ?? '' ) ? array( $g['coordinates'][0] ?? array() ) : ( 'MultiPolygon' === ( $g['type'] ?? '' ) ? array_map( function ( $p ) { return $p[0] ?? array(); }, (array) $g['coordinates'] ) : array() );
		$data = (string) ( $pr['firedate'] ?? $pr['fire_date'] ?? $pr['initialdate'] ?? $pr['lastupdate'] ?? '' ); $quando = preg_match( '/^(\d{4}-\d{2}-\d{2})[ T]?(\d{2}:\d{2})?/', $data, $m ) ? $m[1] . ( ! empty( $m[2] ) ? ' ' . $m[2] : '' ) : gmdate( 'Y-m-d' );
		foreach ( $aneis as $an ) {
			if ( ! is_array( $an ) || count( $an ) < 4 || ! tcd_avi_bbox( $an ) ) { continue; } $c = tcd_avi_centroide( $an );
			$out[] = array( 'lat' => $c[1], 'lon' => $c[0], 'quando' => $quando, 'confianca' => 'confirmada', 'anel' => $an, 'dados' => array_filter( array( 'area_ha' => isset( $pr['area_ha'] ) ? (float) $pr['area_ha'] : ( isset( $pr['area'] ) ? (float) $pr['area'] : null ), 'concelho' => (string) ( $pr['commune'] ?? $pr['concelho'] ?? '' ), 'distrito' => (string) ( $pr['province'] ?? '' ), 'pais' => (string) ( $pr['country'] ?? '' ), 'actualizado' => (string) ( $pr['lastupdate'] ?? '' ) ), function ( $x ) { return null !== $x && '' !== $x; } ) );
		}
	}
	return $out;
}

// ---------- fonte Global Forest Watch (DIST-ALERT) ----------
function tcd_avi_gfw_conjunto() { $cj = (string) get_option( 'tcd_avi_gfw_conjunto', 'umd_glad_dist_alerts' ); return preg_match( '/^[a-z0-9_]{3,60}$/', $cj ) ? $cj : 'umd_glad_dist_alerts'; }
function tcd_avi_gfw( $org, $cfg, $area ) {
	$chave = (string) get_option( 'tcd_avi_gfw_chave', '' ); if ( '' === $chave ) { return new WP_Error( 'chave', 'chave não definida' ); }
	$cj = tcd_avi_gfw_conjunto(); $sql = 'SELECT latitude, longitude, ' . $cj . '__date, ' . $cj . '__confidence FROM results WHERE ' . $cj . "__date >= '" . gmdate( 'Y-m-d', time() - $cfg['dias_gfw'] * DAY_IN_SECONDS ) . "'";
	$r = tcd_avi_http( 'https://data-api.globalforestwatch.org/dataset/' . $cj . '/latest/query/json', array( 'headers' => array( 'x-api-key' => $chave, 'Content-Type' => 'application/json' ), 'body' => wp_json_encode( array( 'sql' => $sql, 'geometry' => tcd_avi_bbox_poligono( $area['bbox'] ) ) ) ) );
	if ( is_wp_error( $r ) ) { return $r; }
	$itens = tcd_avi_gfw_json( $r, $cj ); return array( 'itens' => is_wp_error( $itens ) ? array() : $itens, 'erro' => is_wp_error( $itens ) ? $itens->get_error_message() : '' );
}
function tcd_avi_gfw_json( $txt, $cj = 'umd_glad_dist_alerts' ) {
	$j = json_decode( (string) $txt, true, 16 ); if ( ! is_array( $j ) ) { return new WP_Error( 'json', 'resposta não é JSON' ); }
	if ( isset( $j['data'] ) && is_array( $j['data'] ) ) { $j = $j['data']; } elseif ( isset( $j['message'] ) || isset( $j['detail'] ) ) { return new WP_Error( 'api', mb_substr( is_string( $j['message'] ?? $j['detail'] ) ? ( $j['message'] ?? $j['detail'] ) : wp_json_encode( $j['message'] ?? $j['detail'] ), 0, 120 ) ); }
	$out = array(); $n = 0; $mapa = array( 'low' => 'baixa', 'nominal' => 'nominal', 'high' => 'alta', 'highest' => 'máxima', '2' => 'nominal', '3' => 'alta', '4' => 'máxima' );
	foreach ( $j as $r ) {
		if ( ++$n > TCD_AVI_MAX || ! is_array( $r ) ) { continue; } $lat = (float) ( $r['latitude'] ?? $r['lat'] ?? 0 ); $lon = (float) ( $r['longitude'] ?? $r['lon'] ?? 0 ); if ( ! $lat && ! $lon ) { continue; }
		$data = (string) ( $r[ $cj . '__date' ] ?? $r['date'] ?? '' ); $c = strtolower( (string) ( $r[ $cj . '__confidence' ] ?? $r['confidence'] ?? '' ) );
		$out[] = array( 'lat' => $lat, 'lon' => $lon, 'quando' => preg_match( '/^\d{4}-\d{2}-\d{2}/', $data ) ? substr( $data, 0, 10 ) : gmdate( 'Y-m-d' ), 'confianca' => $mapa[ $c ] ?? ( $c ?: 'baixa' ), 'dados' => array( 'conjunto' => $cj ) );
	}
	return $out;
}

// ---------- motor ----------
// Cruza os itens de uma fonte com a área de uma organização, cria os avisos e notifica. Devolve o número de avisos novos.
function tcd_avi_processar( $org, $fk, $itens, $area, $cfg ) {
	$novos = array(); $b = $area['bbox'];
	foreach ( (array) $itens as $it ) {
		if ( empty( $it['anel'] ) && ( $it['lon'] < $b[0] || $it['lon'] > $b[2] || $it['lat'] < $b[1] || $it['lat'] > $b[3] ) ) { continue; }
		$cz = ! empty( $it['anel'] ) ? tcd_avi_cruzar_poligono( $area, $it['anel'] ) : tcd_avi_cruzar( $area, (float) $it['lon'], (float) $it['lat'] ); if ( ! $cz ) { continue; }
		$id = tcd_avi_criar( $org, $fk, $it['lat'], $it['lon'], $it['quando'], array_merge( (array) ( $it['dados'] ?? array() ), array( 'confianca' => $it['confianca'] ?? '', 'camada' => $cz['camada'], 'nome_camada' => $cz['nome'], 'grupo' => $cz['grupo'], 'dist_m' => $cz['dist_m'] ) ) );
		if ( is_int( $id ) && $id > 0 ) { $novos[] = $id; }
	}
	if ( $novos ) { tcd_avi_notificar( $org, $fk, $novos, $cfg ); }
	return count( $novos );
}
// Corre uma fonte para uma organização (uma chamada). Devolve array(n, erro).
function tcd_avi_correr( $org, $fk, $area = null, $cfg = null ) {
	$f = tcd_avi_fontes(); if ( ! isset( $f[ $fk ] ) || ! is_callable( $f[ $fk ]['f'] ) ) { return array( 'n' => 0, 'erro' => 'fonte desconhecida' ); }
	$cfg = $cfg ?: tcd_avi_cfg( $org ); if ( ! in_array( $fk, $cfg['fontes'], true ) ) { return array( 'n' => 0, 'erro' => '' ); }
	$area = $area ?: tcd_avi_area( $org, $cfg ); if ( ! $area ) { return array( 'n' => 0, 'erro' => '' ); }
	$r = call_user_func( $f[ $fk ]['f'], $org, $cfg, $area ); if ( is_wp_error( $r ) ) { return array( 'n' => 0, 'erro' => tcd_avi_sem_chaves( $r->get_error_message() ) ); }
	return array( 'n' => tcd_avi_processar( $org, $fk, (array) ( $r['itens'] ?? array() ), $area, $cfg ), 'erro' => tcd_avi_sem_chaves( (string) ( $r['erro'] ?? '' ) ) );
}
function tcd_avi_notificar( $org, $fk, $ids, $cfg ) {
	$d = tcd_org_dados( $org ); $f = tcd_avi_fontes(); $n = count( $ids ); $cams = array(); foreach ( $ids as $id ) { $a = tcd_avi_dados( $id ); if ( $a && $a['nome_camada'] ) { $cams[ $a['nome_camada'] ] = 1; } }
	$txt = 'Alertas IPR · ' . $d['nome'] . ': ' . $n . ' aviso' . ( 1 === $n ? '' : 's' ) . ' novo' . ( 1 === $n ? '' : 's' ) . ' de ' . ( $f[ $fk ]['nome'] ?? $fk ) . ( $cams ? ' em ' . implode( ', ', array_slice( array_keys( $cams ), 0, 5 ) ) : '' ) . '. Oficina: ' . home_url( '/oficina/#alertas' );
	if ( function_exists( 'tcd_tg_enviar' ) ) { tcd_tg_enviar( esc_html( $txt ) ); }
	if ( empty( $cfg['email'] ) || get_transient( 'tcd_avi_em_' . (int) $org ) ) { return; }
	$para = array(); foreach ( tcd_org_membros( $org ) as $uid => $m ) { if ( 'activo' === ( $m['estado'] ?? '' ) && in_array( $m['papel'] ?? '', array( 'dono', 'gestor' ), true ) ) { $u = get_userdata( (int) $uid ); if ( $u && ! empty( $u->user_email ) ) { $para[] = $u->user_email; } } }
	if ( ! $para ) { return; }
	set_transient( 'tcd_avi_em_' . (int) $org, 1, HOUR_IN_SECONDS );
	$corpo = "Olá,\n\nO IPR Atlas registou " . $n . ' aviso' . ( 1 === $n ? '' : 's' ) . ' novo' . ( 1 === $n ? '' : 's' ) . ' de ' . ( $f[ $fk ]['nome'] ?? $fk ) . ' na área de ' . $d['nome'] . ( $cams ? ' (' . implode( ', ', array_slice( array_keys( $cams ), 0, 5 ) ) . ')' : '' ) . ( 'gfw' === $fk ? '. O DIST-ALERT detecta perturbação de vegetação sem distinguir a causa (corte, fogo, seca)' : '' ) . ".\n\n";
	foreach ( array_slice( $ids, 0, 10 ) as $id ) { $a = tcd_avi_dados( $id ); if ( $a ) { $corpo .= '- ' . tcd_avi_titulo( $a['fonte'], $a['dados'] ) . ', ' . $a['quando'] . ' UTC, confiança ' . ( $a['confianca'] ?: 'n/d' ) . ', ' . number_format( $a['lat'], 4, '.', '' ) . ', ' . number_format( $a['lon'], 4, '.', '' ) . ( $a['dist_m'] > 0 ? ', a ' . $a['dist_m'] . ' m do limite' : ', dentro' ) . "\n  " . home_url( '/atlas/?org_aviso=' . (int) $id ) . "\n"; } }
	$corpo .= "\nVeja e acuse a recepção na Oficina: " . home_url( '/oficina/#alertas' ) . "\n\nTerracrua Design · IPR Atlas (no máximo um e-mail por hora)\n";
	wp_mail( $para, '[IPR Atlas] ' . $n . ' aviso' . ( 1 === $n ? '' : 's' ) . ' em ' . $d['nome'], $corpo );
}
// Ronda de um ritmo: orçamento de tempo; fontes com buscar($bbox) vão em lote (uma chamada para a união das bbox, se couber em
// TCD_AVI_LOTE_GRAUS); as outras, uma chamada por organização. Regista o estado por fonte.
function tcd_avi_ronda( $ritmo, $orgs, $orcamento = 60 ) {
	if ( function_exists( 'set_time_limit' ) ) { @set_time_limit( $orcamento + 30 ); } $t0 = time(); $f = tcd_avi_fontes(); $prep = array();
	foreach ( $orgs as $org ) { $cfg = tcd_avi_cfg( $org ); $area = tcd_avi_area( $org, $cfg ); if ( $area ) { $prep[ $org ] = array( 'cfg' => $cfg, 'area' => $area ); } }
	foreach ( $f as $fk => $fx ) {
		if ( ( $fx['ritmo'] ?? 'dia' ) !== $ritmo ) { continue; } $n = 0; $no = 0; $erros = array(); $pend = array();
		foreach ( $prep as $org => $p ) { if ( in_array( $fk, $p['cfg']['fontes'], true ) ) { $pend[ $org ] = $p; } }
		if ( ! $pend ) { tcd_avi_estado_guardar( $fk, 0, 0, '' ); continue; }
		$u = null; foreach ( $pend as $p ) { $b = $p['area']['bbox']; $u = $u ? array( min( $u[0], $b[0] ), min( $u[1], $b[1] ), max( $u[2], $b[2] ), max( $u[3], $b[3] ) ) : $b; }
		$lote = ! empty( $fx['buscar'] ) && is_callable( $fx['buscar'] ) && ( $u[2] - $u[0] ) <= TCD_AVI_LOTE_GRAUS && ( $u[3] - $u[1] ) <= TCD_AVI_LOTE_GRAUS;
		if ( $lote ) {
			$r = call_user_func( $fx['buscar'], $u );
			if ( is_wp_error( $r ) ) { $erros[] = tcd_avi_sem_chaves( $r->get_error_message() ); } else { if ( ! empty( $r['erro'] ) ) { $erros[] = tcd_avi_sem_chaves( $r['erro'] ); } foreach ( $pend as $org => $p ) { if ( time() - $t0 > $orcamento ) { $erros[] = 'tempo esgotado'; break; } $no++; $n += tcd_avi_processar( $org, $fk, $r['itens'] ?? array(), $p['area'], $p['cfg'] ); } }
		} else {
			foreach ( $pend as $org => $p ) { if ( time() - $t0 > $orcamento ) { $erros[] = 'tempo esgotado'; break; } $no++; $r = tcd_avi_correr( $org, $fk, $p['area'], $p['cfg'] ); $n += $r['n']; if ( $r['erro'] ) { $erros[] = 'org ' . $org . ': ' . $r['erro']; } if ( 'chave não definida' === $r['erro'] ) { break; } }
		}
		tcd_avi_estado_guardar( $fk, $n, $no, implode( '; ', array_slice( array_unique( $erros ), 0, 3 ) ) );
	}
}
add_action( 'tcd_avi_hora', function () {
	if ( ! tcd_avi_on() ) { return; } $todas = tcd_avi_orgs(); if ( ! $todas ) { return; }
	$cur = (int) get_option( 'tcd_avi_cursor', 0 ); $lote = array(); $n = count( $todas );
	for ( $i = 0; $i < min( TCD_AVI_ORGS_HORA, $n ); $i++ ) { $lote[] = $todas[ ( $cur + $i ) % $n ]; }
	update_option( 'tcd_avi_cursor', ( $cur + count( $lote ) ) % max( 1, $n ), false );
	tcd_avi_ronda( 'hora', $lote, 60 );
} );
add_action( 'tcd_org_diario', function () { if ( tcd_avi_on() ) { tcd_avi_ronda( 'dia', array_slice( tcd_avi_orgs(), 0, 100 ), 120 ); } }, 40 );
add_action( 'tcd_avi_agora', function () { if ( tcd_avi_on() ) { $o = tcd_avi_orgs(); tcd_avi_ronda( 'hora', array_slice( $o, 0, TCD_AVI_ORGS_HORA ), 60 ); tcd_avi_ronda( 'dia', array_slice( $o, 0, 100 ), 120 ); } } );
add_action( 'tcd_org_diario', function () { // lixo: avisos com mais de 180 dias, por data (os mais velhos primeiro)
	$lim = time() - TCD_AVI_DIAS * DAY_IN_SECONDS;
	foreach ( get_posts( array( 'post_type' => 'tcd_aviso', 'post_status' => 'any', 'numberposts' => 2000, 'fields' => 'ids', 'orderby' => 'date', 'order' => 'ASC', 'date_query' => array( array( 'before' => gmdate( 'Y-m-d H:i:s', $lim ), 'column' => 'post_date_gmt' ) ) ) ) as $id ) { $a = tcd_avi_dados( $id ); if ( ! $a || (int) $a['criado'] < $lim ) { wp_delete_post( $id, true ); } }
}, 45 );

// ---------- acções dos membros (admin-post, nonce) ----------
function tcd_avi_form( $op, $campos, $botao, $cls = '' ) { return '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" class="' . esc_attr( 'tavi-f ' . $cls ) . '"><input type="hidden" name="action" value="tcd_avi_acao"><input type="hidden" name="op" value="' . esc_attr( $op ) . '">' . wp_nonce_field( 'tcd_avi', '_wpnonce', true, false ) . $campos . '<button type="submit">' . esc_html( $botao ) . '</button></form>'; }
add_action( 'admin_post_tcd_avi_acao', function () {
	check_admin_referer( 'tcd_avi' );
	$u = wp_get_current_user(); $org = tcd_org_de( $u ); $op = sanitize_key( $_POST['op'] ?? '' ); $msg = ''; // phpcs:ignore
	if ( ! tcd_avi_on() || ! $org ) { wp_die( 'Sem acesso.' ); } if ( tcd_org_so_leitura( $org ) ) { wp_die( 'Em leitura.' ); } // regra 4: em leitura nada muda
	$aid = (int) ( $_POST['aid'] ?? 0 ); $a = $aid ? tcd_avi_dados( $aid ) : null; if ( $a && (int) $a['org'] !== $org ) { $a = null; } // phpcs:ignore
	if ( 'acusar' === $op && $a ) {
		if ( 'novo' === $a['estado'] ) { $a['estado'] = 'acusado'; $a['acusado_por'] = (int) $u->ID; $a['acusado_em'] = current_time( 'mysql' ); unset( $a['id'] ); update_post_meta( $aid, '_tcd_avi', $a ); do_action( 'tcd_avi_acusado', $aid, $u ); $msg = 'acusado'; } else { $msg = 'ja'; }
	} elseif ( 'resolver' === $op && $a ) {
		if ( ! tcd_org_pode( $u, 'gerir', $org ) ) { wp_die( 'Sem acesso.' ); }
		if ( 'resolvido' !== $a['estado'] ) { if ( 'novo' === $a['estado'] ) { $a['acusado_por'] = (int) $u->ID; $a['acusado_em'] = current_time( 'mysql' ); } $a['estado'] = 'resolvido'; $a['resolvido_por'] = (int) $u->ID; unset( $a['id'] ); update_post_meta( $aid, '_tcd_avi', $a ); $msg = 'resolvido'; }
	} elseif ( 'cfg' === $op ) {
		if ( ! tcd_org_pode( $u, 'gerir', $org ) ) { wp_die( 'Sem acesso.' ); }
		$g = array_filter( tcd_cam_grupos( $org ), function ( $x ) { return empty( $x['sensivel'] ); } ); $fontes = array_values( array_intersect( array_map( 'sanitize_key', (array) ( $_POST['fontes'] ?? array() ) ), array_keys( tcd_avi_fontes() ) ) ); // phpcs:ignore
		$ga = array_values( array_intersect( array_map( 'sanitize_key', (array) ( $_POST['grupos_area'] ?? array() ) ), array_keys( $g ) ) ); // phpcs:ignore
		tcd_avi_cfg_guardar( $org, array( 'fontes' => $fontes, 'margem_km' => min( 10.0, max( 0.0, (float) str_replace( ',', '.', (string) ( $_POST['margem_km'] ?? 2 ) ) ) ), 'email' => (int) ! empty( $_POST['email'] ), 'grupos_area' => $ga, 'dias_gfw' => min( 30, max( 1, (int) ( $_POST['dias_gfw'] ?? 14 ) ) ) ) ); // phpcs:ignore
		$msg = 'cfg';
	}
	wp_safe_redirect( add_query_arg( 'avi_msg', $msg, home_url( '/oficina/' ) ) . '#alertas' ); if ( ! defined( 'TCD_TESTE' ) ) { exit; }
} );

// ---------- bloco «Alertas» na Oficina ----------
add_filter( 'tcd_of_blocos', function ( $b ) {
	$u = wp_get_current_user(); if ( ! tcd_avi_on() || ! tcd_org_de( $u ) ) { return $b; }
	$bl = array( 't' => 'Alertas de fogo e vegetação', 'k' => 'Vigilância', 'f' => 'tcd_avi_bloco', 'w' => 2, 'cache' => 0 ); $novo = array(); $posto = false;
	foreach ( $b as $k => $v ) { $novo[ $k ] = $v; if ( 'camadas' === $k ) { $novo['alertas'] = $bl; $posto = true; } }
	if ( ! $posto ) { $novo['alertas'] = $bl; } return $novo;
}, 7 );
function tcd_avi_bloco( $u ) {
	$org = tcd_org_de( $u ); if ( ! $org ) { return ''; } $d = tcd_org_dados( $org ); $gere = tcd_org_pode( $u, 'gerir', $org ); $cfg = tcd_avi_cfg( $org ); $f = tcd_avi_fontes(); $g = tcd_cam_grupos( $org ); $m = tcd_org_membros( $org );
	$h = '<div id="alertas">';
	if ( isset( $_GET['avi_msg'] ) ) { $t = array( 'acusado' => 'Recepção registada.', 'ja' => 'Este aviso já tinha sido acusado.', 'resolvido' => 'Aviso resolvido.', 'cfg' => 'Configuração dos alertas guardada.' ); $h .= '<p class="tof-vz" role="status">' . esc_html( $t[ sanitize_key( $_GET['avi_msg'] ) ] ?? '' ) . '</p>'; } // phpcs:ignore
	$area = tcd_avi_area( $org, $cfg ); $lista = tcd_avi_lista( $org, 30 );
	if ( ! $area ) { $h .= tcd_of_vazio( 'Para vigiar fogo e vegetação é preciso pelo menos uma camada de polígonos num grupo de área (' . implode( ', ', array_map( function ( $k ) use ( $g ) { return $g[ $k ]['nome'] ?? $k; }, $cfg['grupos_area'] ) ) . '). Carregue os limites das áreas em «Camadas da organização».' ); }
	else { $h .= '<p class="tof-vz">Área vigiada: ' . count( $area['polis'] ) . ' polígono' . ( 1 === count( $area['polis'] ) ? '' : 's' ) . ', margem de ' . esc_html( number_format( $cfg['margem_km'], 1, ',', ' ' ) ) . ' km. Fontes: ' . esc_html( implode( ', ', array_map( function ( $k ) use ( $f ) { return $f[ $k ]['nome'] ?? $k; }, $cfg['fontes'] ) ) ?: 'nenhuma' ) . '. FIRMS de hora a hora; o resto uma vez por dia. O DIST-ALERT (GFW) detecta perturbação de vegetação sem distinguir a causa: corte, fogo, seca.</p>'; }
	if ( ! $lista ) { if ( $area ) { $h .= tcd_of_vazio( 'Sem avisos até agora. Quando houver, aparecem aqui e no Telegram da equipa.' ); } }
	else {
		$h .= '<ul class="tof-l">';
		foreach ( $lista as $a ) {
			$a = tcd_avi_para( $a, $u ); $est = array( 'novo' => 'novo', 'acusado' => 'recebido', 'resolvido' => 'resolvido' )[ $a['estado'] ] ?? $a['estado'];
			$h .= '<li' . ( 'resolvido' === $a['estado'] ? ' style="opacity:.6"' : '' ) . '><div><i style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' . esc_attr( $f[ $a['fonte'] ]['cor'] ?? '#75834a' ) . ';margin-right:6px"></i><b>' . esc_html( tcd_avi_titulo( $a['fonte'], $a['dados'] ) ) . '</b> <span class="tof-pill">' . esc_html( $est ) . '</span><br><small>' . esc_html( ( $f[ $a['fonte'] ]['nome'] ?? $a['fonte'] ) . ' · ' . $a['quando'] . ' UTC · confiança ' . ( $a['confianca'] ?: 'n/d' ) . ( $a['nome_camada'] ? ' · ' . $a['nome_camada'] : '' ) . ( $a['dist_m'] > 0 ? ' · a ' . number_format( $a['dist_m'], 0, ',', ' ' ) . ' m do limite' : ' · dentro' ) . ( $a['acusado_por'] ? ' · recebido por ' . ( $m[ $a['acusado_por'] ]['nome'] ?? 'membro' ) . ' a ' . wp_date( 'j/n H:i', strtotime( $a['acusado_em'] ) ) : '' ) . ( $a['resolvido_por'] ? ' · resolvido por ' . ( $m[ $a['resolvido_por'] ]['nome'] ?? 'gestor' ) : '' ) ) . '</small></div><div class="tavi-acc">'
				. '<a class="tof-btn s" href="' . esc_url( home_url( '/atlas/?org_aviso=' . (int) $a['id'] ) ) . '">Ver no Atlas</a>';
			if ( 'novo' === $a['estado'] ) { $h .= tcd_avi_form( 'acusar', '<input type="hidden" name="aid" value="' . (int) $a['id'] . '">', 'Acuso recepção' ); }
			if ( $gere && 'resolvido' !== $a['estado'] ) { $h .= tcd_avi_form( 'resolver', '<input type="hidden" name="aid" value="' . (int) $a['id'] . '">', 'Resolvido', 's' ); }
			$h .= '</div></li>';
		}
		$h .= '</ul>';
	}
	if ( $gere && 'activa' === $d['estado'] ) {
		$cf = '<div class="tavi-cfg"><span>Fontes</span><div>'; foreach ( $f as $k => $x ) { $cf .= '<label><input type="checkbox" name="fontes[]" value="' . esc_attr( $k ) . '"' . checked( in_array( $k, $cfg['fontes'], true ), true, false ) . '> ' . esc_html( $x['nome'] ) . '</label>'; }
		$cf .= '</div><span>Grupos de área</span><div>'; foreach ( $g as $k => $x ) { if ( ! empty( $x['sensivel'] ) ) { continue; } $cf .= '<label><input type="checkbox" name="grupos_area[]" value="' . esc_attr( $k ) . '"' . checked( in_array( $k, $cfg['grupos_area'], true ), true, false ) . '> ' . esc_html( $x['nome'] ) . '</label>'; }
		$cf .= '</div><span>Margem</span><div><input type="number" name="margem_km" value="' . esc_attr( $cfg['margem_km'] ) . '" min="0" max="10" step="0.5" style="width:70px"> km à volta dos polígonos</div><span>Vegetação</span><div><input type="number" name="dias_gfw" value="' . (int) $cfg['dias_gfw'] . '" min="1" max="30" style="width:70px"> dias de alertas GFW por consulta</div><span>E-mail</span><div><label><input type="checkbox" name="email" value="1"' . checked( 1, $cfg['email'], false ) . '> avisar donos e gestores por e-mail (no máximo um por hora)</label></div></div>';
		$h .= '<details class="tavi-q"><summary>Configurar os alertas</summary>' . tcd_avi_form( 'cfg', $cf, 'Guardar' ) . '</details>';
	}
	$h .= '<style>.tavi-acc{display:flex;gap:4px;flex-wrap:wrap;align-items:center}.tavi-acc .tof-btn{margin:0;padding:4px 9px;font-size:12px}.tavi-f{margin:0;display:inline-flex;gap:4px;align-items:center;flex-wrap:wrap}.tavi-f button{font:600 12px Inter,sans-serif;border:1px solid var(--ln);border-radius:8px;padding:4px 9px;background:var(--p);color:var(--ac2);cursor:pointer}.tavi-f.s button{color:var(--te)}.tavi-q{margin-top:10px;font-size:13px}.tavi-q summary{cursor:pointer;color:var(--ac2);font-weight:600}.tavi-cfg{display:grid;grid-template-columns:auto 1fr;gap:6px 12px;margin:8px 0;font-size:13px;color:var(--mu)}.tavi-cfg label{display:block;color:var(--tx)}.tavi-cfg input{font:13px Inter,sans-serif;border:1px solid var(--ln);border-radius:8px;padding:3px 6px;background:var(--p)}</style>';
	return $h . '</div>';
}

// ---------- REST com sessão ----------
add_action( 'rest_api_init', function () {
	register_rest_route( 'tcd/v1', '/org/avisos', array( 'methods' => 'GET', 'permission_callback' => function () { return tcd_avi_on() && is_user_logged_in() && tcd_org_de( wp_get_current_user() ) > 0; }, 'callback' => function ( WP_REST_Request $q ) {
		$u = wp_get_current_user(); $org = tcd_org_de( $u ); $f = tcd_avi_fontes(); $um = (int) ( $q['id'] ?? 0 ); $out = array();
		$lista = $um ? array_filter( array( tcd_avi_dados( $um ) ) ) : tcd_avi_lista( $org, 100 );
		foreach ( $lista as $a ) { if ( (int) $a['org'] !== $org ) { continue; } $a = tcd_avi_para( $a, $u ); $out[] = array( 'id' => (int) $a['id'], 'fonte' => $a['fonte'], 'titulo' => tcd_avi_titulo( $a['fonte'], $a['dados'] ), 'lat' => (float) $a['lat'], 'lon' => (float) $a['lon'], 'quando' => $a['quando'] . ' UTC', 'confianca' => $a['confianca'], 'camada' => (int) $a['camada'], 'estado' => $a['estado'], 'cor' => $f[ $a['fonte'] ]['cor'] ?? '#d0482c', 'texto' => ( $f[ $a['fonte'] ]['nome'] ?? $a['fonte'] ) . ' · confiança ' . ( $a['confianca'] ?: 'n/d' ) . ( $a['nome_camada'] ? ' · ' . $a['nome_camada'] : '' ) . ( $a['dist_m'] > 0 ? ' · a ' . $a['dist_m'] . ' m do limite' : '' ) ); }
		$r = rest_ensure_response( array( 'avisos' => $out ) ); $r->header( 'Cache-Control', 'private, no-store' ); return $r;
	} ) );
} );

// ---------- administração (só o Nuno): chaves, correr agora, estado ----------
add_action( 'admin_menu', function () { if ( current_user_can( 'manage_options' ) && ! get_user_meta( get_current_user_id(), 'tcd_webmaster', true ) ) { add_management_page( 'Alertas IPR', 'Alertas IPR', 'manage_options', 'tcd-avi', 'tcd_avi_pagina' ); } } );
function tcd_avi_pagina() {
	if ( ! current_user_can( 'manage_options' ) || get_user_meta( get_current_user_id(), 'tcd_webmaster', true ) ) { return; }
	echo '<div class="wrap"><h1>Alertas IPR</h1><p>Alertas por polígono das organizações: NASA FIRMS, EFFIS e Global Forest Watch (DIST-ALERT, global; o gfw_integrated_alerts só cobre 30°N a 30°S). As chaves nunca se mostram.</p>';
	if ( isset( $_GET['ok'] ) ) { $t = array( 'guardado' => 'Guardado.', 'agendado' => 'Ronda agendada; veja o estado daqui a uns minutos.', 'espera' => 'Já foi pedida uma ronda há menos de 5 minutos.' ); echo '<div class="notice notice-success"><p>' . esc_html( $t[ sanitize_key( $_GET['ok'] ) ] ?? '' ) . '</p></div>'; } // phpcs:ignore
	$fa = function ( $op ) { return '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '"><input type="hidden" name="action" value="tcd_avi_admin"><input type="hidden" name="op" value="' . esc_attr( $op ) . '">' . wp_nonce_field( 'tcd_avi_admin', '_wpnonce', true, false ); };
	echo $fa( 'chaves' ) . '<table class="form-table"><tr><th>Chave FIRMS (MAP_KEY)</th><td><input type="password" name="firms_chave" class="regular-text" autocomplete="new-password" placeholder="colar para substituir"> <span class="description">' . esc_html( tcd_avi_chave_resumo( get_option( 'tcd_avi_firms_chave', '' ) ) ) . '</span></td></tr>'
		. '<tr><th>Chave GFW (x-api-key)</th><td><input type="password" name="gfw_chave" class="regular-text" autocomplete="new-password" placeholder="colar para substituir"> <span class="description">' . esc_html( tcd_avi_chave_resumo( get_option( 'tcd_avi_gfw_chave', '' ) ) ) . '</span></td></tr>'
		. '<tr><th>Tipo WFS do EFFIS</th><td><input name="effis_tipo" class="regular-text" value="' . esc_attr( get_option( 'tcd_avi_effis_tipo', 'ms:modis.ba.poly' ) ) . '"></td></tr>'
		. '</table><p><button class="button button-primary">Guardar</button></p><p class="description">Opções sem interface: tcd_avi_firms_fontes (lista de SOURCE) e tcd_avi_gfw_conjunto.</p></form>';
	echo $fa( 'correr' ) . '<p><button class="button">Correr agora (todas as fontes)</button></p></form>';
	$e = get_option( 'tcd_avi_estado', array() ); $e = is_array( $e ) ? $e : array();
	echo '<h2>Último estado por fonte</h2><table class="widefat striped"><thead><tr><th>Fonte</th><th>Correu</th><th>Organizações</th><th>Avisos novos</th><th>Erro</th></tr></thead><tbody>';
	foreach ( tcd_avi_fontes() as $k => $x ) { $s = $e[ $k ] ?? null; echo '<tr><td>' . esc_html( $x['nome'] ) . '</td><td>' . ( $s ? esc_html( wp_date( 'j/n/Y H:i', (int) $s['quando'] ) ) : 'nunca' ) . '</td><td>' . ( $s ? (int) $s['orgs'] : '' ) . '</td><td>' . ( $s ? (int) $s['n'] : '' ) . '</td><td>' . esc_html( $s['erro'] ?? '' ) . '</td></tr>'; }
	echo '</tbody></table></div>';
}
add_action( 'admin_post_tcd_avi_admin', function () {
	check_admin_referer( 'tcd_avi_admin' );
	if ( ! current_user_can( 'manage_options' ) || get_user_meta( get_current_user_id(), 'tcd_webmaster', true ) ) { wp_die( 'Sem acesso.' ); }
	$op = sanitize_key( $_POST['op'] ?? '' ); $ok = ''; // phpcs:ignore
	if ( 'chaves' === $op ) {
		foreach ( array( 'firms_chave', 'gfw_chave' ) as $k ) { $v = trim( (string) wp_unslash( $_POST[ $k ] ?? '' ) ); if ( '' !== $v && preg_match( '/^[A-Za-z0-9_\-.]{8,128}$/', $v ) ) { update_option( 'tcd_avi_' . $k, $v, false ); } } // phpcs:ignore
		$t = sanitize_text_field( wp_unslash( $_POST['effis_tipo'] ?? '' ) ); update_option( 'tcd_avi_effis_tipo', preg_match( '/^[a-z0-9_.:-]{3,60}$/i', $t ) ? $t : 'ms:modis.ba.poly', false ); // phpcs:ignore
		$ok = 'guardado';
	} elseif ( 'correr' === $op ) {
		if ( get_transient( 'tcd_avi_correr' ) ) { $ok = 'espera'; } else { set_transient( 'tcd_avi_correr', 1, 5 * MINUTE_IN_SECONDS ); wp_schedule_single_event( time(), 'tcd_avi_agora' ); if ( function_exists( 'spawn_cron' ) ) { spawn_cron(); } $ok = 'agendado'; } // agenda, não corre no pedido do administrador
	}
	wp_safe_redirect( add_query_arg( 'ok', $ok, admin_url( 'tools.php?page=tcd-avi' ) ) ); if ( ! defined( 'TCD_TESTE' ) ) { exit; }
} );
