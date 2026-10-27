<?php
// Módulo 90258 · Pontes de formato para as organizações no IPR Atlas: importar Camtrap DP, exportar Darwin Core Archive e GeoPackage
// (decisão do Nuno, 21/10/2026, 16h12: ligar a plataforma a Agouti, TRAPPER e Wildlife Insights pelo Camtrap DP, ao GBIF pelo
// Darwin Core Archive e ao ICNF, municípios e QGIS pelo GeoPackage. Movebank e EarthRanger ficam para depois: há o filtro
// tcd_pac_importadores para os acrescentar sem mexer aqui).
//  - Importador Camtrap DP (admin-ajax tcd_pac_camtrap, nonce tcd_pac, editores, 10 por hora, ZIP até 25 MB lido com ZipArchive
//    sem extrair para disco, em fluxo, 20 MB por entrada). Lê datapackage.json (profile tem de ser camtrap-dp), deployments.csv e
//    observations.csv (só as colunas úteis, até 50 000 linhas). Exportações: tecto de 300 MB somados e set_time_limit(120). Revisão de
//    segurança de 21/10 (C1, C2, C4, C3, C5-C8) aplicada. Cria ou reutiliza o grupo «camaras» (sensível) e guarda duas camadas: «Implantações <pacote>» (um ponto por
//    deployment, com contagens e as 3 espécies mais frequentes) e «Observações <pacote>» (um ponto por observação de animal com
//    nome científico, na posição do deployment). Resumo em meta _tcd_pac do post da camada.
//  - Exportador Darwin Core Archive: GET /tcd/v1/org/dwca?camadas=1,2,3 (sessão, membro, 1 por minuto). ZIP com occurrence.txt
//    (tabulações), meta.xml e eml.xml mínimo (CC BY 4.0 por defeito). Destino público: lê sempre por tcd_cam_geojson($c, 0, 'publico'),
//    generalizado pelo m90256 para toda a gente; registos sem nome científico ficam fora (cabeçalho X-TCD-Fora quando há).
//  - Exportador GeoPackage: GET /tcd/v1/org/gpkg?camadas=1,2,3[&esquema=inspire_ps][&zip=1][&exacto=1]. Lê com contexto 'exportar' como
//    utilizador 0 (generalizado); ?exacto=1 só para dono ou gestor devolve as coordenadas originais. Uma tabela por camada, geometria em
//    EPSG:4326 escrita à mão (cabeçalho GP + WKB little-endian). Precisa da extensão SQLite3 do PHP; sem ela, 503 com mensagem
//    e o bloco esconde os botões (a exportação GeoJSON/KML do m90254 continua a servir).
//  - Bloco «Importar e exportar» na Oficina (depois de «camadas»), com selecção de camadas por caixas.
// Fontes: Camtrap DP 1.0 (https://camtrap-dp.tdwg.org/, /data/ e /metadata/: profile
// https://raw.githubusercontent.com/tdwg/camtrap-dp/1.0/camtrap-dp-profile.json; deployments: deploymentID, locationID, locationName,
// latitude, longitude, coordinateUncertainty, deploymentStart, deploymentEnd, setupBy, cameraID, cameraModel, cameraHeight...;
// observations: observationID, deploymentID, mediaID, eventID, eventStart, eventEnd, observationLevel (media|event), observationType
// (animal|human|vehicle|blank|unknown|unclassified), scientificName, count, lifeStage (adult|subadult|juvenile), sex (female|male),
// behavior, classificationMethod (human|machine), classifiedBy, classificationTimestamp...). Darwin Core Archive: guia do IPT
// (https://ipt.gbif.org/manual/en/ipt/latest/dwca-guide) e Darwin Core Text Guide (https://dwc.tdwg.org/text/: archive xmlns
// http://rs.tdwg.org/dwc/text/, core rowType http://rs.tdwg.org/dwc/terms/Occurrence, fieldsTerminatedBy, ignoreHeaderLines, id e
// field por índice a partir de 0); eml.xml segundo o perfil de metadados do GBIF (EML 2.1.1). GeoPackage 1.3 (OGC 12-128r19,
// https://www.geopackage.org/spec131/: application_id 0x47504B47, user_version 10300, tabelas gpkg_spatial_ref_sys, gpkg_contents,
// gpkg_geometry_columns; StandardGeoPackageBinary: «GP», versão 0, flags (bit 0 little-endian, bits 1-3 envelope), srs_id, envelope,
// WKB segundo OGC 06-103r4). INSPIRE Protected Sites (tema PS): inspireId, siteName, siteDesignation, legalFoundationDate,
// legalFoundationDocument. Interruptor: tcd_pac_off = 1. Prefixo tcd_pac_. Depende do m90253 e do m90254.
if ( ! defined( 'ABSPATH' ) ) { exit; }

function tcd_pac_on() { return '1' !== (string) get_option( 'tcd_pac_off', '' ) && function_exists( 'tcd_cam_on' ) && tcd_cam_on(); }
function tcd_pac_sqlite() { return (bool) apply_filters( 'tcd_pac_sqlite', class_exists( 'SQLite3' ) ); }
define( 'TCD_PAC_MB', 25 ); define( 'TCD_PAC_LINHAS', 50000 ); define( 'TCD_PAC_ENTRADA_MB', 20 ); define( 'TCD_PAC_SOMA_MB', 300 ); // ZIP até 25 MB; 20 MB por entrada descomprimida; 50 000 linhas; 300 MB somados por exportação
// Importadores disponíveis (slug => nome, descrição, função($org,$u,$caminho,$ficheiro)). Movebank e EarthRanger entram por aqui mais tarde.
function tcd_pac_importadores() {
	return (array) apply_filters( 'tcd_pac_importadores', array( 'camtrapdp' => array( 'nome' => 'Camtrap DP', 'descr' => 'Pacote de câmaras de armadilhagem fotográfica exportado do Agouti, TRAPPER ou Wildlife Insights (ZIP com datapackage.json, deployments.csv e observations.csv).', 'f' => 'tcd_pac_camtrap_importar' ) ) );
}

// ---------- ler CSV e o pacote Camtrap DP ----------
function tcd_pac_csv( $h, $colunas, $max = TCD_PAC_LINHAS ) { // $h: fluxo (getStream); $colunas: lista fechada de cabeçalhos a guardar. Linhas associativas ou WP_Error.
	$cab = null; $out = array(); $ix = array();
	while ( false !== ( $l = fgetcsv( $h, 1048576, ',', '"', '' ) ) ) {
		if ( null === $cab ) { $cab = array_map( function ( $x ) { return trim( ltrim( (string) $x, "\xEF\xBB\xBF" ) ); }, $l ); if ( count( $cab ) > 100 ) { return new WP_Error( 'cols', 'Mais de 100 colunas num CSV.' ); } foreach ( $cab as $i => $k ) { if ( in_array( $k, $colunas, true ) ) { $ix[ $k ] = $i; } } continue; }
		if ( 1 === count( $l ) && null === $l[0] ) { continue; } // linha vazia
		if ( count( $out ) >= $max ) { return new WP_Error( 'linhas', 'Mais de ' . number_format( $max, 0, ',', ' ' ) . ' linhas num CSV. Divida o pacote.' ); }
		$r = array(); foreach ( $ix as $k => $i ) { $r[ $k ] = mb_substr( trim( (string) ( $l[ $i ] ?? '' ) ), 0, 200 ); } $out[] = $r;
	}
	return $out;
}
function tcd_pac_camtrap_colunas( $t ) { return 'deployments' === $t ? array( 'deploymentID', 'locationID', 'locationName', 'latitude', 'longitude', 'coordinateUncertainty', 'deploymentStart', 'deploymentEnd', 'cameraModel', 'cameraHeight' ) : array( 'observationID', 'deploymentID', 'eventStart', 'eventEnd', 'observationLevel', 'observationType', 'scientificName', 'count', 'lifeStage', 'sex', 'behavior', 'classificationMethod', 'classifiedBy' ); }
// Lê um ZIP Camtrap DP sem extrair. Devolve array(pacote, deployments, observations) ou WP_Error.
function tcd_pac_camtrap_ler( $zip_path ) {
	if ( ! class_exists( 'ZipArchive' ) ) { return new WP_Error( 'zip', 'Este servidor não tem a extensão ZIP do PHP; não é possível ler o pacote.' ); }
	if ( ! is_readable( $zip_path ) || filesize( $zip_path ) > TCD_PAC_MB * 1048576 ) { return new WP_Error( 'zip', 'Ficheiro ilegível ou acima de ' . TCD_PAC_MB . ' MB.' ); }
	$z = new ZipArchive(); if ( true !== $z->open( $zip_path ) ) { return new WP_Error( 'zip', 'O ficheiro não é um ZIP válido.' ); }
	if ( $z->numFiles > 200 ) { $z->close(); return new WP_Error( 'zip', 'ZIP com demasiados ficheiros.' ); }
	$base = null; $nomes = array();
	for ( $i = 0; $i < $z->numFiles; $i++ ) { $st = $z->statIndex( $i ); if ( ! $st ) { continue; } $nomes[ $st['name'] ] = (int) $st['size']; if ( null === $base && 'datapackage.json' === basename( $st['name'] ) && false === strpos( $st['name'], '__MACOSX' ) ) { $base = substr( $st['name'], 0, -strlen( 'datapackage.json' ) ); } }
	if ( null === $base ) { $z->close(); return new WP_Error( 'dp', 'O ZIP não tem datapackage.json: não é um pacote Camtrap DP.' ); }
	$tam = function ( $n ) use ( $z, $nomes ) { if ( ! isset( $nomes[ $n ] ) ) { return null; } $st = $z->statName( $n ); if ( ! $st || (int) $st['size'] > TCD_PAC_ENTRADA_MB * 1048576 ) { return new WP_Error( 'tam', 'O ficheiro ' . basename( $n ) . ' descomprimido passa de ' . TCD_PAC_ENTRADA_MB . ' MB. Divida o pacote.' ); } return true; };
	$ok = $tam( $base . 'datapackage.json' ); if ( is_wp_error( $ok ) ) { $z->close(); return $ok; }
	$dp = json_decode( (string) $z->getFromName( $base . 'datapackage.json' ), true ); if ( ! is_array( $dp ) ) { $z->close(); return new WP_Error( 'dp', 'O datapackage.json não é JSON legível.' ); }
	if ( false === stripos( (string) ( $dp['profile'] ?? '' ), 'camtrap-dp' ) ) { $z->close(); return new WP_Error( 'dp', 'O datapackage.json não declara o perfil Camtrap DP (profile).' ); }
	$cam = array(); foreach ( (array) ( $dp['resources'] ?? array() ) as $r ) { if ( ! empty( $r['name'] ) && ! empty( $r['path'] ) && is_string( $r['path'] ) && ! preg_match( '#^https?://#i', $r['path'] ) ) { $cam[ $r['name'] ] = $base . ltrim( str_replace( '\\', '/', $r['path'] ), './' ); } }
	$out = array( 'pacote' => array( 'nome' => mb_substr( sanitize_text_field( (string) ( $dp['title'] ?? $dp['project']['title'] ?? $dp['name'] ?? 'Camtrap DP' ) ), 0, 60 ), 'versao' => sanitize_text_field( (string) ( $dp['version'] ?? '' ) ), 'perfil' => sanitize_text_field( (string) $dp['profile'] ), 'criado' => sanitize_text_field( (string) ( $dp['created'] ?? '' ) ) ) );
	foreach ( array( 'deployments', 'observations' ) as $t ) {
		$n = $cam[ $t ] ?? $base . $t . '.csv'; $ok = $tam( $n ); if ( is_wp_error( $ok ) ) { $z->close(); return $ok; }
		$h = null === $ok ? false : $z->getStream( $n ); if ( ! $h ) { $z->close(); return new WP_Error( 'dp', 'Falta o ficheiro ' . $t . '.csv no pacote.' ); }
		$l = tcd_pac_csv( $h, tcd_pac_camtrap_colunas( $t ) ); fclose( $h ); if ( is_wp_error( $l ) ) { $z->close(); return $l; } $out[ $t ] = $l;
	}
	$z->close(); return $out;
}
// Transforma o pacote em duas camadas e guarda-as. Devolve o resumo (array) ou WP_Error.
function tcd_pac_camtrap_importar( $org, $u, $zip_path, $ficheiro = '' ) {
	$p = tcd_pac_camtrap_ler( $zip_path ); if ( is_wp_error( $p ) ) { return $p; }
	$d = tcd_org_dados( $org ); if ( ! $d ) { return new WP_Error( 'org', 'Organização não encontrada.' ); } if ( 'activa' !== $d['estado'] ) { return new WP_Error( 'org', 'A organização está em só leitura.' ); }
	$grupo = tcd_cam_grupo_criar( $org, 'Câmaras e armadilhagem fotográfica', array( 'id' => 'camaras', 'cor' => '#5a3e2b', 'sensivel' => 1, 'ha' => 0, 'cat' => 3, 'automatico' => 1 ), $u ); if ( ! $grupo ) { $grupo = 'camaras'; }
	$dep = array(); foreach ( $p['deployments'] as $r ) {
		$id = (string) ( $r['deploymentID'] ?? '' ); $lat = $r['latitude'] ?? ''; $lon = $r['longitude'] ?? '';
		if ( '' === $id || ! is_numeric( $lat ) || ! is_numeric( $lon ) || abs( (float) $lat ) > 90 || abs( (float) $lon ) > 180 ) { continue; }
		$ini = strtotime( (string) ( $r['deploymentStart'] ?? '' ) ); $fim = strtotime( (string) ( $r['deploymentEnd'] ?? '' ) );
		$dep[ $id ] = array( 'lat' => (float) $lat, 'lon' => (float) $lon, 'pr' => array( 'deploymentID' => $id, 'locationID' => (string) ( $r['locationID'] ?? '' ), 'locationName' => (string) ( $r['locationName'] ?? '' ), 'inicio' => (string) ( $r['deploymentStart'] ?? '' ), 'fim' => (string) ( $r['deploymentEnd'] ?? '' ), 'dias' => $ini && $fim && $fim > $ini ? round( ( $fim - $ini ) / DAY_IN_SECONDS, 1 ) : null, 'cameraModel' => (string) ( $r['cameraModel'] ?? '' ), 'cameraHeight' => is_numeric( $r['cameraHeight'] ?? '' ) ? (float) $r['cameraHeight'] : null, 'coordinateUncertainty' => is_numeric( $r['coordinateUncertainty'] ?? '' ) ? (float) $r['coordinateUncertainty'] : null, 'n_observacoes' => 0, 'n_especies' => 0, 'especies_top' => '' ), 'esp' => array() );
	}
	if ( ! $dep ) { return new WP_Error( 'dp', 'Nenhuma implantação com latitude e longitude válidas.' ); }
	$obs = array(); $esp_tot = array(); $sem = 0;
	foreach ( $p['observations'] as $r ) {
		$did = (string) ( $r['deploymentID'] ?? '' ); if ( ! isset( $dep[ $did ] ) ) { $sem++; continue; }
		$tipo = (string) ( $r['observationType'] ?? '' ); $sci = mb_substr( trim( preg_replace( '/[^\p{L}\p{N} .\-()×]/u', '', (string) ( $r['scientificName'] ?? '' ) ) ), 0, 120 );
		if ( 'animal' !== $tipo || '' === $sci ) { continue; }
		$n = is_numeric( $r['count'] ?? '' ) ? (int) $r['count'] : 1;
		$dep[ $did ]['pr']['n_observacoes']++; $dep[ $did ]['esp'][ $sci ] = ( $dep[ $did ]['esp'][ $sci ] ?? 0 ) + 1; $esp_tot[ $sci ] = ( $esp_tot[ $sci ] ?? 0 ) + 1;
		$obs[] = array( 'type' => 'Feature', 'geometry' => array( 'type' => 'Point', 'coordinates' => array( $dep[ $did ]['lon'], $dep[ $did ]['lat'] ) ), 'properties' => array( 'observationID' => (string) ( $r['observationID'] ?? '' ), 'scientificName' => $sci, 'eventStart' => (string) ( $r['eventStart'] ?? '' ), 'eventEnd' => (string) ( $r['eventEnd'] ?? '' ), 'count' => $n, 'lifeStage' => (string) ( $r['lifeStage'] ?? '' ), 'sex' => (string) ( $r['sex'] ?? '' ), 'behavior' => (string) ( $r['behavior'] ?? '' ), 'classificationMethod' => (string) ( $r['classificationMethod'] ?? '' ), 'classifiedBy' => (string) ( $r['classifiedBy'] ?? '' ), 'observationType' => $tipo, 'observationLevel' => (string) ( $r['observationLevel'] ?? '' ), 'deploymentID' => $did, 'coordinateUncertainty' => $dep[ $did ]['pr']['coordinateUncertainty'] ) );
	}
	$fd = array(); foreach ( $dep as $x ) { arsort( $x['esp'] ); $top = array(); foreach ( array_slice( $x['esp'], 0, 3, true ) as $k => $v ) { $top[] = $k . ' (' . $v . ')'; } $x['pr']['n_especies'] = count( $x['esp'] ); $x['pr']['especies_top'] = implode('; ', $top ); $fd[] = array( 'type' => 'Feature', 'geometry' => array( 'type' => 'Point', 'coordinates' => array( $x['lon'], $x['lat'] ) ), 'properties' => $x['pr'] ); }
	arsort( $esp_tot ); $nome = $p['pacote']['nome']; $extra = array( 'origem' => $ficheiro ?: basename( $zip_path ), 'formato' => 'camtrapdp', 'sensivel' => 1 );
	// meta _tcd_pac: só contagens (nomes científicos já filtrados a letras, números e pontuação de nomenclatura; os 50 mais frequentes)
	$resumo = array( 'pacote' => $nome, 'versao' => $p['pacote']['versao'], 'criado' => $p['pacote']['criado'], 'n_depl' => count( $fd ), 'n_obs' => count( $obs ), 'n_especies' => count( $esp_tot ), 'especies' => array_slice( $esp_tot, 0, 50, true ), 'sem_implantacao' => $sem, 'quando' => current_time( 'mysql' ) );
	$gj = array( 'type' => 'FeatureCollection', 'features' => $fd ); $extra['bytes'] = strlen( wp_json_encode( $gj ) ); unset( $fd );
	$c1 = tcd_cam_guardar( $org, $u, $gj, 'Implantações ' . $nome, $grupo, $extra ); unset( $gj ); if ( is_wp_error( $c1 ) ) { return $c1; }
	update_post_meta( $c1, '_tcd_pac', $resumo ); $resumo['camadas'] = array( (int) $c1 ); $resumo['aviso'] = '';
	if ( $obs && count( $obs ) <= TCD_CAM_MAX_N ) { $gj = array( 'type' => 'FeatureCollection', 'features' => $obs ); unset( $obs ); $extra['bytes'] = strlen( wp_json_encode( $gj ) ); $c2 = tcd_cam_guardar( $org, $u, $gj, 'Observações ' . $nome, $grupo, $extra ); unset( $gj ); if ( is_wp_error( $c2 ) ) { $resumo['aviso'] = 'Implantações guardadas, mas as observações não: ' . $c2->get_error_message(); } else { update_post_meta( $c2, '_tcd_pac', $resumo ); $resumo['camadas'][] = (int) $c2; } }
	elseif ( ! empty( $obs ) && count( $obs ) > TCD_CAM_MAX_N ) { $resumo['aviso'] = 'Mais de ' . number_format( TCD_CAM_MAX_N, 0, ',', ' ' ) . ' observações: só as implantações foram guardadas.'; }
	$resumo['grupo'] = $grupo; return $resumo;
}
add_action( 'wp_ajax_tcd_pac_camtrap', function () {
	check_ajax_referer( 'tcd_pac', 'n' );
	$u = wp_get_current_user(); $org = tcd_org_de( $u );
	if ( ! tcd_pac_on() || ! $org || ! tcd_org_pode( $u, 'editar', $org ) ) { wp_send_json_error( array( 'm' => 'Sem acesso para importar. Peça a quem gere a organização.' ), 403 ); }
	if ( ! class_exists( 'ZipArchive' ) ) { wp_send_json_error( array( 'm' => 'Este servidor não tem a extensão ZIP do PHP; a importação não está disponível.' ), 503 ); } @set_time_limit( 120 );
	$k = 'tcd_pac_i_' . $u->ID; $n = (int) get_transient( $k ); if ( $n >= 10 ) { wp_send_json_error( array( 'm' => 'Muitas importações numa hora. Tente mais tarde.' ), 429 ); } set_transient( $k, $n + 1, HOUR_IN_SECONDS );
	$f = $_FILES['ficheiro'] ?? null; // phpcs:ignore
	if ( ! $f || ! empty( $f['error'] ) || empty( $f['tmp_name'] ) || ( ! defined( 'TCD_TESTE' ) && ! is_uploaded_file( $f['tmp_name'] ) ) ) { wp_send_json_error( array( 'm' => 'Escolha um ficheiro ZIP.' ), 400 ); }
	if ( (int) $f['size'] > TCD_PAC_MB * 1048576 ) { wp_send_json_error( array( 'm' => 'Ficheiro acima de ' . TCD_PAC_MB . ' MB.' ), 400 ); }
	$imp = tcd_pac_importadores(); $tipo = sanitize_key( $_POST['tipo'] ?? 'camtrapdp' ); if ( ! isset( $imp[ $tipo ] ) || ! is_callable( $imp[ $tipo ]['f'] ) ) { $tipo = 'camtrapdp'; } // phpcs:ignore
	$r = call_user_func( $imp[ $tipo ]['f'], $org, $u, $f['tmp_name'], mb_substr( sanitize_file_name( (string) $f['name'] ), 0, 120 ) );
	if ( is_wp_error( $r ) ) { wp_send_json_error( array( 'm' => $r->get_error_message() ), 400 ); }
	$m = 'Pacote «' . $r['pacote'] . '» importado: ' . number_format( $r['n_depl'], 0, ',', ' ' ) . ' implantaç' . ( 1 === $r['n_depl'] ? 'ão' : 'ões' ) . ', ' . number_format( $r['n_obs'], 0, ',', ' ' ) . ' observaç' . ( 1 === $r['n_obs'] ? 'ão' : 'ões' ) . ' de animais, ' . (int) $r['n_especies'] . ' espécie' . ( 1 === (int) $r['n_especies'] ? '' : 's' ) . ( $r['especies'] ? ' (' . implode( ', ', array_slice( array_keys( $r['especies'] ), 0, 5 ) ) . ( $r['n_especies'] > 5 ? '…' : '' ) . ')' : '' ) . '. As camadas ficaram no grupo «Câmaras», sensível: só quem gere e quem for marcado as vê.' . ( $r['aviso'] ? ' ' . $r['aviso'] : '' ) . ( $r['sem_implantacao'] ? ' ' . (int) $r['sem_implantacao'] . ' observações sem implantação conhecida ficaram de fora.' : '' );
	if ( function_exists( 'tcd_tg_enviar' ) ) { tcd_tg_enviar( 'Organização ' . esc_html( tcd_org_dados( $org )['nome'] ) . ': ' . esc_html( $u->display_name ) . ' importou um Camtrap DP (' . (int) $r['n_depl'] . ' implantações, ' . (int) $r['n_obs'] . ' observações).' ); }
	wp_send_json_success( array( 'm' => $m, 'camadas' => $r['camadas'] ) );
} );

// ---------- geometria: centróide, WKT, WKB, GeoPackageBinary ----------
function tcd_pac_pontos( $g ) { // todos os vértices de uma geometria GeoJSON (sem repetir o fecho dos anéis)
	$t = $g['type'] ?? ''; $c = $g['coordinates'] ?? array(); $o = array();
	if ( 'Point' === $t ) { return array( $c ); } if ( 'MultiPoint' === $t || 'LineString' === $t ) { return $c; }
	if ( 'MultiLineString' === $t || 'Polygon' === $t ) { foreach ( $c as $l ) { $l = (array) $l; if ( 'Polygon' === $t && count( $l ) > 1 ) { array_pop( $l ); } foreach ( $l as $p ) { $o[] = $p; } } return $o; }
	if ( 'MultiPolygon' === $t ) { foreach ( $c as $pg ) { foreach ( tcd_pac_pontos( array( 'type' => 'Polygon', 'coordinates' => $pg ) ) as $p ) { $o[] = $p; } } }
	return $o;
}
function tcd_pac_centro( $g ) { $ps = tcd_pac_pontos( $g ); if ( ! $ps ) { return null; } $x = 0; $y = 0; foreach ( $ps as $p ) { $x += (float) $p[0]; $y += (float) $p[1]; } return array( round( $x / count( $ps ), 6 ), round( $y / count( $ps ), 6 ) ); }
function tcd_pac_bbox( $g ) { $ps = tcd_pac_pontos( $g ); if ( ! $ps ) { return null; } $b = array( 180, 90, -180, -90 ); foreach ( $ps as $p ) { $b = array( min( $b[0], (float) $p[0] ), min( $b[1], (float) $p[1] ), max( $b[2], (float) $p[0] ), max( $b[3], (float) $p[1] ) ); } return $b; }
function tcd_pac_wkt( $g ) {
	$t = $g['type'] ?? ''; $c = $g['coordinates'] ?? array(); $p = function ( $x ) { return (float) $x[0] . ' ' . (float) $x[1]; }; $l = function ( $x ) use ( $p ) { return '(' . implode( ', ', array_map( $p, (array) $x ) ) . ')'; }; $pg = function ( $x ) use ( $l ) { return '(' . implode( ', ', array_map( $l, (array) $x ) ) . ')'; };
	if ( 'Point' === $t ) { return 'POINT (' . $p( $c ) . ')'; } if ( 'LineString' === $t ) { return 'LINESTRING ' . $l( $c ); } if ( 'Polygon' === $t ) { return 'POLYGON ' . $pg( $c ); }
	if ( 'MultiPoint' === $t ) { return 'MULTIPOINT ' . $l( $c ); } if ( 'MultiLineString' === $t ) { return 'MULTILINESTRING ' . $pg( $c ); } if ( 'MultiPolygon' === $t ) { return 'MULTIPOLYGON (' . implode( ', ', array_map( $pg, (array) $c ) ) . ')'; }
	return '';
}
// WKB little-endian (OGC 06-103r4): Point 1, LineString 2, Polygon 3, MultiPoint 4, MultiLineString 5, MultiPolygon 6.
function tcd_pac_wkb( $g ) {
	$t = $g['type'] ?? ''; $c = $g['coordinates'] ?? array(); $tipos = array( 'Point' => 1, 'LineString' => 2, 'Polygon' => 3, 'MultiPoint' => 4, 'MultiLineString' => 5, 'MultiPolygon' => 6 );
	if ( ! isset( $tipos[ $t ] ) ) { return ''; }
	$pt = function ( $p ) { return pack( 'ee', (float) $p[0], (float) $p[1] ); }; $lin = function ( $l ) use ( $pt ) { $l = (array) $l; $s = pack( 'V', count( $l ) ); foreach ( $l as $p ) { $s .= $pt( $p ); } return $s; }; $pol = function ( $r ) use ( $lin ) { $r = (array) $r; $s = pack( 'V', count( $r ) ); foreach ( $r as $l ) { $s .= $lin( $l ); } return $s; };
	$s = "\x01" . pack( 'V', $tipos[ $t ] );
	if ( 'Point' === $t ) { return $s . $pt( $c ); } if ( 'LineString' === $t ) { return $s . $lin( $c ); } if ( 'Polygon' === $t ) { return $s . $pol( $c ); }
	$s .= pack( 'V', count( $c ) ); $sub = substr( $t, 5 ); foreach ( $c as $parte ) { $s .= tcd_pac_wkb( array( 'type' => $sub, 'coordinates' => $parte ) ); } return $s;
}
// StandardGeoPackageBinary: «GP», versão 0, flags 0x03 (little-endian, envelope XY), srs_id 4326, envelope [minx maxx miny maxy], WKB.
function tcd_pac_gpb( $g, $srs = 4326 ) { $w = tcd_pac_wkb( $g ); if ( '' === $w ) { return null; } $b = tcd_pac_bbox( $g ); return 'GP' . "\x00\x03" . pack( 'V', $srs ) . pack( 'eeee', $b[0], $b[2], $b[1], $b[3] ) . $w; }

// ---------- camadas pedidas (?camadas=1,2,3) ----------
function tcd_pac_camadas( $org, $u, $ids ) { // as camadas pedidas que a pessoa vê, ou WP_Error se a soma de bytes passa o tecto
	$ids = array_filter( array_map( 'intval', is_array( $ids ) ? $ids : explode( ',', (string) $ids ) ) ); $out = array(); $tot = 0;
	foreach ( tcd_cam_lista( $org, $u ) as $c ) { if ( ! $ids || in_array( (int) $c['id'], $ids, true ) ) { $out[] = $c; $tot += (int) $c['bytes']; } }
	if ( $tot > TCD_PAC_SOMA_MB * 1048576 ) { return new WP_Error( 'soma', 'As camadas pedidas somam ' . size_format( $tot ) . ', acima de ' . TCD_PAC_SOMA_MB . ' MB por exportação. Escolha menos camadas e exporte em partes.', 413 ); }
	return $out;
}
function tcd_pac_prop( $pr, $chaves ) { foreach ( $chaves as $k ) { foreach ( $pr as $pk => $pv ) { if ( strtolower( (string) $pk ) === $k && is_scalar( $pv ) && '' !== $pv ) { return $pv; } } } return null; }
function tcd_pac_x( $s ) { return htmlspecialchars( (string) $s, ENT_XML1 | ENT_QUOTES, 'UTF-8' ); }

// ---------- Darwin Core Archive ----------
function tcd_pac_dwca_campos() { return array( 'occurrenceID', 'basisOfRecord', 'scientificName', 'eventDate', 'decimalLatitude', 'decimalLongitude', 'geodeticDatum', 'coordinateUncertaintyInMeters', 'footprintWKT', 'individualCount', 'recordedBy', 'informationWithheld', 'dataGeneralizations', 'coordinatePrecision', 'occurrenceRemarks' ); }
// Devolve o caminho de um ZIP temporário (occurrence.txt, meta.xml, eml.xml) ou WP_Error. $fora recebe o número de registos sem nome científico.
function tcd_pac_dwca( $org, $u, $ids, &$fora = 0 ) {
	if ( ! class_exists( 'ZipArchive' ) ) { return new WP_Error( 'zip', 'Exportação indisponível (sem extensão ZIP).', 503 ); }
	$d = tcd_org_dados( $org ); if ( ! $d ) { return new WP_Error( 'org', 'Organização não encontrada.', 404 ); }
	$cs = tcd_pac_camadas( $org, $u, $ids ); if ( is_wp_error( $cs ) ) { return $cs; } @set_time_limit( 120 );
	$campos = tcd_pac_dwca_campos(); $fora = 0; $n_reg = 0; $bb = array( 180, 90, -180, -90 ); $nomes = array();
	$lim = function ( $v ) { $v = preg_replace( '/[\x00-\x1F\x7F]/u', ' ', is_scalar( $v ) ? (string) $v : '' ); return preg_match( '/^[=+\-@]/', $v ) && ! is_numeric( $v ) ? "'" . $v : $v; }; // sem caracteres de controlo nem fórmulas (os números negativos passam)
	$ft = wp_tempnam( 'occ' ); $fh = fopen( $ft, 'w' ); if ( ! $fh ) { return new WP_Error( 'fich', 'Não foi possível escrever o ficheiro.', 500 ); } fwrite( $fh, implode( "\t", $campos ) . "\n" );
	foreach ( $cs as $c ) {
		$gj = tcd_cam_geojson( $c, 0, 'publico' ); if ( ! is_array( $gj ) ) { continue; } $nomes[] = $c['nome']; $i = 0; // destino público (GBIF): sempre generalizado, para toda a gente
		foreach ( (array) ( $gj['features'] ?? array() ) as $f ) {
			$i++; $pr = (array) ( $f['properties'] ?? array() ); $g = (array) ( $f['geometry'] ?? array() );
			$sci = tcd_pac_prop( $pr, array( 'scientificname', 'especie', 'species', 'taxon', 'nome_cientifico' ) ); $ctr = tcd_pac_centro( $g );
			if ( null === $sci || ! $ctr ) { $fora++; continue; }
			$gen = tcd_pac_prop( $pr, array( 'datageneralizations' ) ); $prec = tcd_pac_prop( $pr, array( 'coordinateprecision' ) ); $inc = tcd_pac_prop( $pr, array( 'coordinateuncertainty', 'coordinateuncertaintyinmeters' ) );
			if ( null === $inc && null !== $gen ) { $p = (float) $prec; $inc = $p >= 0.1 ? 5000 : ( $p >= 0.01 ? 500 : ( $p >= 0.001 ? 50 : 5000 ) ); }
			$n = tcd_pac_prop( $pr, array( 'count', 'n', 'individualcount' ) ); $resto = array(); $usadas = array( 'scientificname', 'especie', 'species', 'taxon', 'nome_cientifico', 'eventstart', 'data', 'date', 'quando', 'eventdate', 'count', 'n', 'individualcount', 'coordinateuncertainty', 'coordinateuncertaintyinmeters', 'informationwithheld', 'datageneralizations', 'coordinateprecision' );
			foreach ( $pr as $pk => $pv ) { if ( is_scalar( $pv ) && '' !== (string) $pv && ! in_array( strtolower( (string) $pk ), $usadas, true ) ) { $resto[] = $pk . ': ' . $pv; } }
			$bb = array( min( $bb[0], $ctr[0] ), min( $bb[1], $ctr[1] ), max( $bb[2], $ctr[0] ), max( $bb[3], $ctr[1] ) );
			$n_reg++; $l = array( 'occurrenceID' => (int) $org . '-' . (int) $c['id'] . '-' . $i, 'basisOfRecord' => 'camtrapdp' === ( $c['formato'] ?? '' ) ? 'MachineObservation' : 'HumanObservation', 'scientificName' => $sci, 'eventDate' => tcd_pac_prop( $pr, array( 'eventstart', 'data', 'date', 'quando', 'eventdate' ) ), 'decimalLatitude' => $ctr[1], 'decimalLongitude' => $ctr[0], 'geodeticDatum' => 'WGS84', 'coordinateUncertaintyInMeters' => $inc, 'footprintWKT' => in_array( $g['type'] ?? '', array( 'Polygon', 'MultiPolygon' ), true ) ? tcd_pac_wkt( $g ) : '', 'individualCount' => is_numeric( $n ) ? (int) $n : '', 'recordedBy' => $d['nome'], 'informationWithheld' => tcd_pac_prop( $pr, array( 'informationwithheld' ) ), 'dataGeneralizations' => $gen, 'coordinatePrecision' => $prec, 'occurrenceRemarks' => implode( '; ', $resto ) );
			$r = array(); foreach ( $campos as $k ) { $r[] = $lim( $l[ $k ] ?? '' ); } fwrite( $fh, implode( "\t", $r ) . "\n" ); unset( $l, $r );
		}
		unset( $gj );
	}
	fclose( $fh );
	$meta = '<?xml version="1.0" encoding="UTF-8"?>' . "\n" . '<archive xmlns="http://rs.tdwg.org/dwc/text/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://rs.tdwg.org/dwc/text/ http://rs.tdwg.org/dwc/text/tdwg_dwc_text.xsd" metadata="eml.xml">' . "\n" . '  <core encoding="UTF-8" fieldsTerminatedBy="\t" linesTerminatedBy="\n" fieldsEnclosedBy="" ignoreHeaderLines="1" rowType="http://rs.tdwg.org/dwc/terms/Occurrence">' . "\n" . '    <files><location>occurrence.txt</location></files>' . "\n" . '    <id index="0"/>' . "\n";
	foreach ( $campos as $i => $k ) { $meta .= '    <field index="' . $i . '" term="http://rs.tdwg.org/dwc/terms/' . $k . '"/>' . "\n"; }
	$meta .= "  </core>\n</archive>\n";
	$x = 'tcd_pac_x'; $hoje = wp_date( 'Y-m-d' ); $tit = $d['nome'] . ' · camadas exportadas do IPR Atlas' . ( $nomes ? ' (' . implode( ', ', $nomes ) . ')' : '' );
	$eml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n" . '<eml:eml xmlns:eml="eml://ecoinformatics.org/eml-2.1.1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:dc="http://purl.org/dc/terms/" xsi:schemaLocation="eml://ecoinformatics.org/eml-2.1.1 http://rs.gbif.org/schema/eml-gbif-profile/1.1/eml.xsd" packageId="ipr-atlas-org-' . (int) $org . '-' . $hoje . '" system="http://gbif.org" scope="system" xml:lang="' . $x( $d['lingua'] ?? 'pt' ) . '">' . "\n"
		. '  <dataset><title xml:lang="' . $x( $d['lingua'] ?? 'pt' ) . '">' . $x( $tit ) . '</title>' . "\n" . '    <creator><organizationName>' . $x( $d['nome'] ) . '</organizationName></creator>' . "\n" . '    <metadataProvider><organizationName>' . $x( $d['nome'] ) . '</organizationName></metadataProvider>' . "\n" . '    <pubDate>' . $hoje . '</pubDate>' . "\n" . '    <language>' . $x( strtoupper( substr( (string) ( $d['lingua'] ?? 'pt' ), 0, 2 ) ) ) . '</language>' . "\n"
		. '    <abstract><para>' . $x( 'Ocorrências exportadas do espaço de trabalho de ' . $d['nome'] . ' no IPR Atlas (Terracrua Design) a ' . $hoje . ': ' . $n_reg . ' registos. Exportação preparada para publicação: as coordenadas de registos sensíveis foram generalizadas segundo a categoria de sensibilidade da organização, para todos os utilizadores (ver dataGeneralizations, coordinatePrecision e coordinateUncertaintyInMeters).' ) . '</para></abstract>' . "\n"
		. '    <intellectualRights><para>' . $x( 'Este trabalho está licenciado sob ' ) . '<ulink url="http://creativecommons.org/licenses/by/4.0/legalcode"><citetitle>Creative Commons Attribution (CC-BY) 4.0 License</citetitle></ulink>.</para></intellectualRights>' . "\n"
		. ( $n_reg ? '    <coverage><geographicCoverage><geographicDescription>' . $x( $d['pais'] ?? 'PT' ) . '</geographicDescription><boundingCoordinates><westBoundingCoordinate>' . $bb[0] . '</westBoundingCoordinate><eastBoundingCoordinate>' . $bb[2] . '</eastBoundingCoordinate><northBoundingCoordinate>' . $bb[3] . '</northBoundingCoordinate><southBoundingCoordinate>' . $bb[1] . '</southBoundingCoordinate></boundingCoordinates></geographicCoverage></coverage>' . "\n" : '' )
		. '    <contact><organizationName>' . $x( $d['nome'] ) . '</organizationName></contact>' . "\n" . '  </dataset>' . "\n" . '</eml:eml>' . "\n";
	$tmp = wp_tempnam( 'dwca' ); $z = new ZipArchive(); if ( true !== $z->open( $tmp, ZipArchive::OVERWRITE ) ) { @unlink( $tmp ); @unlink( $ft ); return new WP_Error( 'zip', 'Não foi possível criar o ZIP.', 500 ); }
	$z->addFile( $ft, 'occurrence.txt' ); $z->addFromString( 'meta.xml', $meta ); $z->addFromString( 'eml.xml', $eml ); $z->close(); @unlink( $ft );
	return $tmp;
}

// ---------- GeoPackage ----------
function tcd_pac_tabela( $grupo, $nome, &$usados ) {
	$lp = function ( $x, $n ) { $x = function_exists( 'remove_accents' ) ? remove_accents( $x ) : ( function_exists( 'iconv' ) ? (string) @iconv( 'UTF-8', 'ASCII//TRANSLIT', $x ) : $x ); return substr( trim( preg_replace( '/_+/', '_', preg_replace( '/[^a-z0-9_]+/', '_', strtolower( $x ) ) ), '_' ), 0, $n ); };
	$s = trim( $lp( $grupo, 16 ) . '_' . $lp( $nome, 40 ), '_' ); if ( '' === $s ) { $s = 'camada'; } if ( ! preg_match( '/^[a-z]/', $s ) ) { $s = 'c_' . $s; }
	$b = $s; $i = 2; while ( isset( $usados[ $s ] ) || in_array( $s, array( 'gpkg_contents', 'gpkg_spatial_ref_sys', 'gpkg_geometry_columns', 'sqlite_master' ), true ) ) { $s = $b . '_' . $i++; } $usados[ $s ] = 1; return $s;
}
function tcd_pac_coluna( $k, &$usadas ) { $s = trim( preg_replace( '/[^a-z0-9_]+/', '_', strtolower( function_exists( 'remove_accents' ) ? remove_accents( (string) $k ) : (string) $k ) ), '_' ); $s = substr( $s ?: 'campo', 0, 50 ); if ( ! preg_match( '/^[a-z]/', $s ) ) { $s = 'c_' . $s; } $b = $s; $i = 2; while ( isset( $usadas[ $s ] ) || in_array( $s, array( 'fid', 'geom' ), true ) ) { $s = $b . '_' . $i++; } $usadas[ $s ] = 1; return $s; }
// Devolve o caminho de um ficheiro temporário com o GeoPackage (ou um ZIP com LEIA-ME se $zip), ou WP_Error. $esquema: '' ou 'inspire_ps'.
// $exacto: coordenadas exactas das camadas sensíveis; só vale para dono ou gestor. Sem ele, lê como utilizador 0 (generalizado pelo m90256).
function tcd_pac_gpkg( $org, $u, $ids, $esquema = '', $zip = false, $exacto = false ) {
	if ( ! tcd_pac_sqlite() ) { return new WP_Error( 'gpkg', 'GeoPackage indisponível neste servidor; use a exportação GeoJSON/KML', 503 ); }
	$d = tcd_org_dados( $org ); if ( ! $d ) { return new WP_Error( 'org', 'Organização não encontrada.', 404 ); }
	$cs = tcd_pac_camadas( $org, $u, $ids ); if ( is_wp_error( $cs ) ) { return $cs; } @set_time_limit( 120 );
	$exacto = $exacto && tcd_org_pode( $u, 'gerir', $org ); $uid = $exacto ? (int) $u->ID : 0;
	$tmp = wp_tempnam( 'gpkg' ); // o SQLite abre o ficheiro vazio já criado (sem apagar e recriar)
	try { $db = new SQLite3( $tmp ); } catch ( Exception $e ) { @unlink( $tmp ); return new WP_Error( 'gpkg', 'Não foi possível criar o GeoPackage.', 500 ); }
	$db->exec( 'PRAGMA application_id = 1196444487; PRAGMA user_version = 10300;' ); // 0x47504B47 «GPKG», versão 1.3.0
	$db->exec( 'CREATE TABLE gpkg_spatial_ref_sys (srs_name TEXT NOT NULL, srs_id INTEGER NOT NULL PRIMARY KEY, organization TEXT NOT NULL, organization_coordsys_id INTEGER NOT NULL, definition TEXT NOT NULL, description TEXT);'
		. 'CREATE TABLE gpkg_contents (table_name TEXT NOT NULL PRIMARY KEY, data_type TEXT NOT NULL, identifier TEXT UNIQUE, description TEXT DEFAULT \'\', last_change DATETIME NOT NULL DEFAULT (strftime(\'%Y-%m-%dT%H:%M:%fZ\',\'now\')), min_x DOUBLE, min_y DOUBLE, max_x DOUBLE, max_y DOUBLE, srs_id INTEGER, CONSTRAINT fk_gc_r_srs_id FOREIGN KEY (srs_id) REFERENCES gpkg_spatial_ref_sys(srs_id));'
		. 'CREATE TABLE gpkg_geometry_columns (table_name TEXT NOT NULL, column_name TEXT NOT NULL, geometry_type_name TEXT NOT NULL, srs_id INTEGER NOT NULL, z TINYINT NOT NULL, m TINYINT NOT NULL, CONSTRAINT pk_geom_cols PRIMARY KEY (table_name, column_name), CONSTRAINT fk_gc_tn FOREIGN KEY (table_name) REFERENCES gpkg_contents(table_name), CONSTRAINT fk_gc_srs FOREIGN KEY (srs_id) REFERENCES gpkg_spatial_ref_sys(srs_id));'
		. "INSERT INTO gpkg_spatial_ref_sys VALUES ('Undefined cartesian SRS', -1, 'NONE', -1, 'undefined', 'undefined cartesian coordinate reference system'), ('Undefined geographic SRS', 0, 'NONE', 0, 'undefined', 'undefined geographic coordinate reference system'), ('WGS 84 geodetic', 4326, 'EPSG', 4326, 'GEOGCS[\"WGS 84\",DATUM[\"WGS_1984\",SPHEROID[\"WGS 84\",6378137,298.257223563,AUTHORITY[\"EPSG\",\"7030\"]],AUTHORITY[\"EPSG\",\"6326\"]],PRIMEM[\"Greenwich\",0,AUTHORITY[\"EPSG\",\"8901\"]],UNIT[\"degree\",0.0174532925199433,AUTHORITY[\"EPSG\",\"9122\"]],AUTHORITY[\"EPSG\",\"4326\"]]', 'longitude/latitude coordinates in decimal degrees on the WGS 84 spheroid');" );
	$g = tcd_cam_grupos( $org ); $usados = array(); $ins = 'inspire_ps' === $esquema; $inspire = array( 'inspireId', 'siteName', 'siteDesignation', 'legalFoundationDate', 'legalFoundationDocument' ); $tabelas = array();
	$db->exec( 'BEGIN' );
	foreach ( $cs as $c ) {
		$gj = tcd_cam_geojson( $c, $uid, 'exportar' ); if ( ! is_array( $gj ) ) { continue; } $fs = (array) ( $gj['features'] ?? array() ); unset( $gj );
		$tipos = array(); foreach ( $fs as $f ) { foreach ( (array) ( $f['properties'] ?? array() ) as $k => $v ) { if ( null === $v || '' === $v ) { continue; } $t = is_int( $v ) || ( is_string( $v ) && preg_match( '/^-?\d{1,15}$/', $v ) ) ? 'INTEGER' : ( is_numeric( $v ) ? 'REAL' : 'TEXT' ); $tipos[ $k ] = isset( $tipos[ $k ] ) && $tipos[ $k ] !== $t ? ( 'TEXT' === $t || 'TEXT' === $tipos[ $k ] ? 'TEXT' : 'REAL' ) : $t; } }
		$usadas = array( 'inspireid' => 1, 'sitename' => 1, 'sitedesignation' => 1, 'legalfoundationdate' => 1, 'legalfoundationdocument' => 1 ); $cols = array(); foreach ( $tipos as $k => $t ) { $cols[ $k ] = array( tcd_pac_coluna( $k, $usadas ), $t ); }
		$tab = tcd_pac_tabela( $c['grupo'], $c['nome'], $usados ); $def = 'fid INTEGER PRIMARY KEY AUTOINCREMENT, geom GEOMETRY';
		foreach ( $cols as $x ) { $def .= ', "' . $x[0] . '" ' . $x[1]; } if ( $ins ) { foreach ( $inspire as $k ) { $def .= ', "' . $k . '" TEXT'; } }
		$db->exec( 'CREATE TABLE "' . $tab . '" (' . $def . ')' ); $nomes = array( 'geom' ); foreach ( $cols as $x ) { $nomes[] = $x[0]; } if ( $ins ) { foreach ( $inspire as $k ) { $nomes[] = $k; } }
		$st = $db->prepare( 'INSERT INTO "' . $tab . '" ("' . implode( '", "', $nomes ) . '") VALUES (' . implode( ', ', array_fill( 0, count( $nomes ), '?' ) ) . ')' ); $n = 0; $bb = array( 180, 90, -180, -90 );
		foreach ( $fs as $i => $f ) {
			$gpb = tcd_pac_gpb( (array) ( $f['geometry'] ?? array() ) ); if ( null === $gpb ) { continue; } $b = tcd_pac_bbox( $f['geometry'] ); $bb = array( min( $bb[0], $b[0] ), min( $bb[1], $b[1] ), max( $bb[2], $b[2] ), max( $bb[3], $b[3] ) );
			$pr = (array) ( $f['properties'] ?? array() ); $j = 1; $st->bindValue( $j++, $gpb, SQLITE3_BLOB );
			foreach ( $cols as $k => $x ) { $v = $pr[ $k ] ?? null; if ( null === $v || '' === $v || ! is_scalar( $v ) ) { $st->bindValue( $j++, null, SQLITE3_NULL ); } elseif ( 'INTEGER' === $x[1] ) { $st->bindValue( $j++, (int) $v, SQLITE3_INTEGER ); } elseif ( 'REAL' === $x[1] ) { $st->bindValue( $j++, (float) $v, SQLITE3_FLOAT ); } else { $st->bindValue( $j++, (string) $v, SQLITE3_TEXT ); } }
			if ( $ins ) { $vals = array( 'PT.IPR.' . (int) $org . '.' . (int) $c['id'] . '.' . ( $i + 1 ), tcd_pac_prop( $pr, array( 'sitename', 'nome', 'name' ) ), tcd_pac_prop( $pr, array( 'sitedesignation', 'designacao', 'designation' ) ), tcd_pac_prop( $pr, array( 'legalfoundationdate', 'data', 'date' ) ), tcd_pac_prop( $pr, array( 'legalfoundationdocument', 'documento', 'document', 'diploma' ) ) ); foreach ( $vals as $v ) { if ( null === $v ) { $st->bindValue( $j++, null, SQLITE3_NULL ); } else { $st->bindValue( $j++, (string) $v, SQLITE3_TEXT ); } } }
			$st->execute(); $st->reset(); $n++;
		}
		$st->close(); if ( ! $n ) { $bb = array( null, null, null, null ); }
		$ci = $db->prepare( 'INSERT INTO gpkg_contents (table_name, data_type, identifier, description, min_x, min_y, max_x, max_y, srs_id) VALUES (?, \'features\', ?, ?, ?, ?, ?, ?, 4326)' );
		$ci->bindValue( 1, $tab, SQLITE3_TEXT ); $ci->bindValue( 2, $c['nome'] . ' (' . $tab . ')', SQLITE3_TEXT ); $ci->bindValue( 3, 'IPR Atlas, ' . $d['nome'] . ', grupo ' . ( $g[ $c['grupo'] ]['nome'] ?? $c['grupo'] ) . ( $ins ? ', esquema INSPIRE Protected Sites' : '' ), SQLITE3_TEXT );
		foreach ( array( 4, 5, 6, 7 ) as $q ) { $ci->bindValue( $q, $bb[ $q - 4 ], null === $bb[ $q - 4 ] ? SQLITE3_NULL : SQLITE3_FLOAT ); } $ci->execute(); $ci->close();
		$gc = $db->prepare( 'INSERT INTO gpkg_geometry_columns VALUES (?, \'geom\', \'GEOMETRY\', 4326, 0, 0)' ); $gc->bindValue( 1, $tab, SQLITE3_TEXT ); $gc->execute(); $gc->close(); $tabelas[ $tab ] = $n; unset( $fs );
	}
	$db->exec( 'COMMIT' ); $db->close();
	if ( ! $zip || ! class_exists( 'ZipArchive' ) ) { return $tmp; }
	$zt = wp_tempnam( 'gpkgzip' ); $z = new ZipArchive(); if ( true !== $z->open( $zt, ZipArchive::OVERWRITE ) ) { @unlink( $zt ); return $tmp; }
	$nome = 'ipr-atlas-' . sanitize_title( $d['nome'] ) . ( $ins ? '-inspire-ps' : '' ) . '.gpkg'; $z->addFile( $tmp, $nome );
	$txt = "GeoPackage exportado do IPR Atlas (Terracrua Design) para " . $d['nome'] . ", " . wp_date( 'j/n/Y H:i' ) . ".\nSistema de coordenadas: EPSG:4326 (WGS 84). Uma tabela por camada, com o grupo no prefixo do nome.\nAbre directamente no QGIS, ArcGIS, GDAL/OGR e na maioria dos SIG; cada tabela tem as colunas das propriedades da camada.\n";
	if ( $ins ) { $txt .= "Esquema INSPIRE Protected Sites (tema PS): colunas inspireId, siteName, siteDesignation, legalFoundationDate e legalFoundationDocument, preenchidas a partir das propriedades quando existem (nome ou name, designacao ou designation, data ou date, documento ou diploma). O que falta fica vazio para completar no QGIS antes de entregar ao ICNF ou ao município. Isto não substitui a validação formal INSPIRE (GML pelo esquema ps:ProtectedSite).\n"; }
	$txt .= $exacto ? "Exportação EXACTA pedida por quem gere a organização: as camadas sensíveis saem com as coordenadas originais. Não publique este ficheiro nem o partilhe fora da organização.\n\nTabelas:\n" : "As coordenadas das camadas e registos sensíveis foram generalizadas segundo a categoria de sensibilidade da organização (colunas dataGeneralizations e coordinatePrecision quando existam). Quem gere a organização pode pedir a versão exacta na Oficina.\n\nTabelas:\n"; foreach ( $tabelas as $t => $n ) { $txt .= '  ' . $t . ': ' . $n . " elementos\n"; }
	$z->addFromString( 'LEIA-ME.txt', $txt ); $z->close(); @unlink( $tmp ); return $zt;
}

// ---------- rotas REST (sessão, membro) ----------
function tcd_pac_enviar( $caminho, $nome, $tipo, $cab = array() ) {
	if ( ! headers_sent() ) { header( 'Content-Type: ' . $tipo ); header( 'Content-Disposition: attachment; filename="' . $nome . '"' ); header( 'Content-Length: ' . filesize( $caminho ) ); header( 'Cache-Control: private, no-store' ); foreach ( $cab as $k => $v ) { header( $k . ': ' . $v ); } }
	readfile( $caminho ); @unlink( $caminho ); if ( ! defined( 'TCD_TESTE' ) ) { exit; }
}
add_action( 'rest_api_init', function () {
	$sess = function () { return tcd_pac_on() && is_user_logged_in() && tcd_org_de( wp_get_current_user() ) > 0; };
	$ritmo = function ( $u, $k ) { $k = 'tcd_pac_' . $k . '_' . $u->ID; if ( get_transient( $k ) ) { return false; } set_transient( $k, 1, MINUTE_IN_SECONDS ); return true; };
	register_rest_route( 'tcd/v1', '/org/dwca', array( 'methods' => 'GET', 'permission_callback' => $sess, 'callback' => function ( WP_REST_Request $q ) use ( $ritmo ) {
		$u = wp_get_current_user(); $org = tcd_org_de( $u ); if ( ! $ritmo( $u, 'd' ) ) { return new WP_Error( 'ritmo', 'Já exportou há pouco. Espere um minuto.', array( 'status' => 429 ) ); }
		$fora = 0; $f = tcd_pac_dwca( $org, $u, sanitize_text_field( (string) ( $q['camadas'] ?? '' ) ), $fora ); if ( is_wp_error( $f ) ) { return new WP_Error( 'dwca', $f->get_error_message(), array( 'status' => (int) ( $f->get_error_data() ?: 500 ) ) ); }
		tcd_pac_enviar( $f, 'ipr-atlas-dwca-' . (int) $org . '-' . wp_date( 'Y-m-d' ) . '.zip', 'application/zip', $fora > 0 ? array( 'X-TCD-Fora' => (int) $fora ) : array() );
	} ) );
	register_rest_route( 'tcd/v1', '/org/gpkg', array( 'methods' => 'GET', 'permission_callback' => $sess, 'callback' => function ( WP_REST_Request $q ) use ( $ritmo ) {
		$u = wp_get_current_user(); $org = tcd_org_de( $u );
		if ( ! tcd_pac_sqlite() ) { return new WP_Error( 'gpkg', 'GeoPackage indisponível neste servidor; use a exportação GeoJSON/KML', array( 'status' => 503 ) ); }
		if ( ! $ritmo( $u, 'g' ) ) { return new WP_Error( 'ritmo', 'Já exportou há pouco. Espere um minuto.', array( 'status' => 429 ) ); }
		$esq = 'inspire_ps' === sanitize_key( (string) ( $q['esquema'] ?? '' ) ) ? 'inspire_ps' : ''; $zip = ! empty( $q['zip'] ); $exacto = ! empty( $q['exacto'] ) && tcd_org_pode( $u, 'gerir', $org );
		$f = tcd_pac_gpkg( $org, $u, sanitize_text_field( (string) ( $q['camadas'] ?? '' ) ), $esq, $zip, $exacto ); if ( is_wp_error( $f ) ) { return new WP_Error( 'gpkg', $f->get_error_message(), array( 'status' => (int) ( $f->get_error_data() ?: 500 ) ) ); }
		$e_zip = $zip && class_exists( 'ZipArchive' ); // sem ?zip=1 sai o .gpkg directo; com ?zip=1 sai um ZIP com LEIA-ME
		tcd_pac_enviar( $f, 'ipr-atlas-' . (int) $org . ( $esq ? '-inspire-ps' : '' ) . ( $exacto ? '-exacto' : '' ) . '-' . wp_date( 'Y-m-d' ) . ( $e_zip ? '.zip' : '.gpkg' ), $e_zip ? 'application/zip' : 'application/geopackage+sqlite3' );
	} ) );
} );

// ---------- bloco «Importar e exportar» na Oficina ----------
add_filter( 'tcd_of_blocos', function ( $b ) {
	$u = wp_get_current_user(); if ( ! tcd_pac_on() || ! tcd_org_de( $u ) ) { return $b; }
	$bl = array( 't' => 'Importar e exportar', 'k' => 'Dados', 'f' => 'tcd_pac_bloco', 'w' => 1, 'cache' => 0 ); $novo = array();
	foreach ( $b as $k => $v ) { $novo[ $k ] = $v; if ( 'camadas' === $k ) { $novo['pacotes'] = $bl; } } if ( ! isset( $novo['pacotes'] ) ) { $novo['pacotes'] = $bl; }
	return $novo;
}, 7 );
function tcd_pac_bloco( $u ) {
	$org = tcd_org_de( $u ); if ( ! $org ) { return ''; } $d = tcd_org_dados( $org ); $edita = tcd_org_pode( $u, 'editar', $org ); $gere = tcd_org_pode( $u, 'gerir', $org ); $lista = tcd_cam_lista( $org, $u ); $g = tcd_cam_grupos( $org ); $sql = tcd_pac_sqlite();
	$url = function ( $rota, $args = array() ) { $x = add_query_arg( '_wpnonce', wp_create_nonce( 'wp_rest' ), rest_url( 'tcd/v1/org/' . $rota ) ); foreach ( $args as $k => $v ) { $x = add_query_arg( $k, $v, $x ); } return $x; }; // todas as ligações REST levam _wpnonce (sessão por cookie)
	$h = '<div id="pacotes">';
	if ( $edita && class_exists( 'ZipArchive' ) ) {
		$h .= '<p class="tof-k">Importar</p><div class="tpac-up">'; foreach ( tcd_pac_importadores() as $k => $x ) { $h .= '<p class="tof-vz"><b>' . esc_html( $x['nome'] ) . '</b>: ' . esc_html( $x['descr'] ) . '</p>'; }
		$h .= '<p class="tof-vz">Fica no grupo «Câmaras e armadilhagem fotográfica», sensível. Até ' . TCD_PAC_MB . ' MB.</p><label>Ficheiro ZIP<input type="file" id="tpac-f" accept=".zip"></label><button type="button" class="tof-btn" id="tpac-b">Importar Camtrap DP</button><div class="tof-vz" id="tpac-r" role="status"></div></div>';
	} elseif ( $edita ) { $h .= '<p class="tof-vz">A importação de pacotes não está disponível neste servidor (falta a extensão ZIP).</p>'; }
	$h .= '<p class="tof-k" style="margin-top:10px">Exportar</p>';
	if ( ! $lista ) { $h .= tcd_of_vazio( 'Ainda não há camadas para exportar.' ); }
	else {
		$h .= '<p class="tof-vz">Escolha as camadas (nenhuma escolhida = todas as que vê).</p><div class="tpac-l">';
		foreach ( $lista as $c ) { $h .= '<label><input type="checkbox" class="tpac-c" value="' . (int) $c['id'] . '"> ' . esc_html( $c['nome'] ) . ' <small>' . esc_html( $g[ $c['grupo'] ]['nome'] ?? '' ) . ( ! empty( $c['sensivel'] ) ? ' · sensível' : '' ) . '</small></label>'; }
		$h .= '</div><p class="tof-vz">Darwin Core Archive: ZIP para o GBIF (só registos com nome científico). É uma exportação para publicação: as coordenadas sensíveis saem sempre generalizadas, para toda a gente.</p><p>' . tcd_of_btn( 'Darwin Core Archive (GBIF)', $url( 'dwca' ), true ) . '</p>';
		if ( $sql ) { $h .= '<p class="tof-vz">GeoPackage: um ficheiro .gpkg com as camadas escolhidas, abre directamente no QGIS; o esquema INSPIRE PS acrescenta as colunas de Sítios Protegidos para o ICNF e os municípios. As camadas sensíveis saem generalizadas' . ( $gere ? '; a versão exacta é só para quem gere e não deve sair da organização' : '' ) . '.</p><p>' . tcd_of_btn( 'GeoPackage (QGIS, ICNF)', $url( 'gpkg' ), false ) . ' ' . tcd_of_btn( 'GeoPackage INSPIRE PS', $url( 'gpkg', array( 'esquema' => 'inspire_ps', 'zip' => 1 ) ), false ) . ( $gere ? ' ' . tcd_of_btn( 'GeoPackage exacto (só gestão)', $url( 'gpkg', array( 'exacto' => 1, 'zip' => 1 ) ), false ) : '' ) . '</p>'; }
		else { $h .= '<p class="tof-vz">GeoPackage indisponível neste servidor; use a exportação GeoJSON/KML do bloco «Camadas».</p>'; }
		$h .= '<p class="tof-vz">Camtrap DP (para devolver ao Agouti ou TRAPPER), Movebank e EarthRanger ficam para uma fase seguinte.</p>';
	}
	$h .= '<style>.tpac-up{border:1px dashed var(--ln);border-radius:10px;padding:12px;margin-bottom:12px;display:grid;gap:8px}.tpac-up label{display:flex;flex-direction:column;gap:3px;font-size:13px;color:var(--mu)}.tpac-up input{font:14px Inter,sans-serif;border:1px solid var(--ln);border-radius:8px;padding:7px 9px;background:var(--p);color:var(--tx)}.tpac-up .tof-btn{justify-self:start}.tpac-l{display:grid;gap:4px;margin:6px 0 10px;font-size:13px}.tpac-l label{display:flex;gap:6px;align-items:baseline}.tpac-l small{color:var(--mu)}</style>';
	$h .= tcd_pac_js( $edita ); return $h . '</div>';
}
function tcd_pac_js( $edita ) {
	$cfg = array( 'aj' => admin_url( 'admin-ajax.php' ), 'n' => wp_create_nonce( 'tcd_pac' ), 'mb' => TCD_PAC_MB, 'imp' => (bool) $edita );
	return '<script>(function(c){var P=document.getElementById("pacotes");if(!P)return;'
		. 'P.querySelectorAll("#pacotes .tof-btn[href]").forEach(function(a){a.addEventListener("click",function(e){var ids=[];P.querySelectorAll(".tpac-c:checked").forEach(function(x){ids.push(x.value);});if(ids.length){e.preventDefault();var u=a.getAttribute("href");location.href=u+(u.indexOf("?")>-1?"&":"?")+"camadas="+ids.join(",");}});});'
		. 'var F=document.getElementById("tpac-f"),B=document.getElementById("tpac-b"),R=document.getElementById("tpac-r");if(!c.imp||!F||!B)return;'
		. 'B.addEventListener("click",function(){var f=F.files&&F.files[0];if(!f){R.textContent="Escolha um ficheiro ZIP.";return;}if(f.size>c.mb*1048576){R.textContent="Ficheiro acima de "+c.mb+" MB.";return;}B.disabled=true;R.textContent="A importar…";var fd=new FormData();fd.append("action","tcd_pac_camtrap");fd.append("n",c.n);fd.append("tipo","camtrapdp");fd.append("ficheiro",f);'
		. 'fetch(c.aj,{method:"POST",body:fd,credentials:"same-origin"}).then(function(r){return r.json();}).then(function(j){if(j&&j.success){R.textContent=j.data.m+" A página vai actualizar.";setTimeout(function(){location.href=location.pathname+"#camadas";location.reload();},1800);}else{R.textContent=(j&&j.data&&j.data.m)||"Não foi possível importar.";B.disabled=false;}}).catch(function(){R.textContent="Sem ligação. Tente de novo.";B.disabled=false;});});})(' . wp_json_encode( $cfg, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT ) . ');</script>';
}
