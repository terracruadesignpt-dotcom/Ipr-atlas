<?php
// Módulo 90254 · Camadas da organização: carregamento de ficheiros, grupos, dados sensíveis, quotas e exportação
// (pedido do Nuno, 21/10/2026, 14h44: «vão poder carregar para os projectos tudo o que eles têm. Não vale a pena carregar
// topografia, que nós temos a melhor. Não vamos deixar carregar rasters, só shapefiles e KML»; caixa das 15h31: também GPX
// e CSV com coordenadas, convertidos; caixa das 15h30: camadas sensíveis só a quem o dono marcar).
//  - Formatos: shapefile (zip com .shp .shx .dbf .prj), KML, KMZ, GeoJSON, GPX, CSV com lat/lon. A conversão para GeoJSON
//    faz-se no navegador (shpjs, toGeoJSON e JSZip, os mesmos do Atlas), com reprojecção pelo .prj; o servidor só recebe
//    GeoJSON em WGS84 e valida. Nada de rasters, GeoTIFF, nuvens de pontos nem imagens.
//  - Cada camada é um post tcd_camada (meta _tcd_cam: organização, grupo, sensível, quem vê, geometria, n, ha, bytes, origem)
//    e um ficheiro .geojson em uploads/tcd-crm/org/<org>/ (pasta fechada por .htaccess; lê-se só por REST com sessão).
//  - Grupos por organização (meta grupos da organização, m90253): nome, cor, sensível, conta ha. Grupos de origem pelo
//    modelo (filtro tcd_org_grupos_modelo); o gestor cria, renomeia e apaga grupos vazios.
//  - Quotas (m90253): GB e ha; só as camadas de grupos que «contam ha» somam. Ficheiro até 25 MB; até 200 000 elementos.
//  - Sensível: a camada só aparece a quem gere e às pessoas marcadas. Lixo: a camada fica escondida 30 dias e depois é
//    apagada pelo cron diário (os ficheiros ficam na pasta _lixo até lá). Em só leitura, tudo se vê e exporta, nada muda.
//  - Rotas de dados: GET /tcd/v1/org/camadas (lista do que a pessoa pode ver), GET /tcd/v1/org/camada/<id> (GeoJSON),
//    GET /tcd/v1/org/exportar (ZIP com GeoJSON e KML). Carregar e gerir por admin-ajax com nonce. Prefixo tcd_cam_.
//  - v2 (21/10, 16h30): ganchos para os módulos seguintes. Filtro tcd_cam_geojson($gj, $camada, $uid, $contexto) aplicado em
//    toda a saída (rest, exportar, publico): o m90256 generaliza coordenadas sensíveis. Ajudantes tcd_cam_guardar() e
//    tcd_cam_grupo_criar() para importadores (m90258). Acção tcd_cam_grupo_novo para a biblioteca central (m90255).
//    Separador «Organização» no Atlas (assets/atlas/org.js) para membros: camadas no mapa, ?org_camada= e ?org_aviso=.
//  - Revisão de segurança (21/10, 17h): 10 MB e 50 000 elementos; json_decode com profundidade 32; leituras 120/h; ficheiro servido
//    sem descodificar quando não há filtros; ZIP até 300 MB; nome de ficheiro com sufixo aleatório; .htaccess verificado em cada
//    gravação; elementos inválidos não se gravam; quota de ha também ao repor e ao mudar de grupo; nonce nas ligações REST.
// Interruptor: tcd_cam_off = 1. Depende do m90253 e do m90250.
if ( ! defined( 'ABSPATH' ) ) { exit; }

function tcd_cam_on() { return '1' !== (string) get_option( 'tcd_cam_off', '' ) && function_exists( 'tcd_org_de' ); }
define( 'TCD_CAM_MB', 10 ); define( 'TCD_CAM_MAX_N', 50000 ); define( 'TCD_CAM_ZIP_MB', 300 ); // 10 MB de GeoJSON descodificado chega a 200 MB de memória em PHP; mais do que isto derruba o alojamento partilhado
add_action( 'init', function () { register_post_type( 'tcd_camada', array( 'public' => false, 'show_ui' => false, 'supports' => array( 'title' ), 'label' => 'Camadas de organizações' ) ); }, 5 );

function tcd_cam_pasta( $org, $lixo = false ) {
	$up = wp_upload_dir(); $d = trailingslashit( $up['basedir'] ) . 'tcd-crm';
	if ( ! is_dir( $d ) ) { wp_mkdir_p( $d ); }
	$ht = "# Núcleo Terracrua: pasta fechada\n<IfModule mod_authz_core.c>\nRequire all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\nDeny from all\n</IfModule>\n";
	if ( ! file_exists( $d . '/.htaccess' ) || strpos( (string) @file_get_contents( $d . '/.htaccess' ), 'Require all denied' ) === false ) { if ( false === @file_put_contents( $d . '/.htaccess', $ht ) && function_exists( 'tcd_tg_enviar' ) ) { tcd_tg_enviar( 'Camadas: não consegui escrever o .htaccess da pasta tcd-crm. Verificar permissões.' ); } }
	if ( ! file_exists( $d . '/index.php' ) ) { @file_put_contents( $d . '/index.php', "<?php\n" ); }
	$d .= '/org/' . (int) $org . ( $lixo ? '/_lixo' : '' ); wp_mkdir_p( $d ); return $d;
}
// Grupos de origem por modelo de organização; outros módulos acrescentam pelo filtro.
function tcd_cam_grupos_modelo( $modelo ) {
	$base = array(
		array( 'id' => 'areas', 'nome' => 'Áreas e acordos', 'cor' => '#b8652f', 'sensivel' => 0, 'ha' => 1 ),
		array( 'id' => 'infra', 'nome' => 'Infra-estruturas', 'cor' => '#6b6f5c', 'sensivel' => 0, 'ha' => 0 ),
		array( 'id' => 'obs', 'nome' => 'Observações', 'cor' => '#75834a', 'sensivel' => 0, 'ha' => 0 ),
	);
	$por = array(
		'rewilding' => array(
			array( 'id' => 'areas', 'nome' => 'Áreas e acordos', 'cor' => '#b8652f', 'sensivel' => 0, 'ha' => 1 ),
			array( 'id' => 'fauna', 'nome' => 'Fauna', 'cor' => '#4f6b3a', 'sensivel' => 0, 'ha' => 0 ),
			array( 'id' => 'necrofagos', 'nome' => 'Necrófagos e ninhos', 'cor' => '#7d1f1f', 'sensivel' => 1, 'ha' => 0 ),
			array( 'id' => 'herbivoros', 'nome' => 'Herbívoros e pastoreio', 'cor' => '#c9b52f', 'sensivel' => 0, 'ha' => 0 ),
			array( 'id' => 'coexistencia', 'nome' => 'Coexistência e ameaças', 'cor' => '#d0482c', 'sensivel' => 1, 'ha' => 0 ),
			array( 'id' => 'fogo', 'nome' => 'Incêndios', 'cor' => '#e08a2c', 'sensivel' => 0, 'ha' => 0 ),
			array( 'id' => 'vegetacao', 'nome' => 'Vegetação e água', 'cor' => '#5b8db8', 'sensivel' => 0, 'ha' => 0 ),
			array( 'id' => 'infra', 'nome' => 'Infra-estruturas e trilhos', 'cor' => '#6b6f5c', 'sensivel' => 0, 'ha' => 0 ),
		),
	);
	return (array) apply_filters( 'tcd_org_grupos_modelo', $por[ $modelo ] ?? $base, $modelo );
}
function tcd_cam_grupos( $org ) {
	$d = tcd_org_dados( $org ); if ( ! $d ) { return array(); }
	$g = isset( $d['grupos'] ) && is_array( $d['grupos'] ) && $d['grupos'] ? $d['grupos'] : tcd_cam_grupos_modelo( $d['modelo'] );
	$out = array(); foreach ( $g as $x ) { if ( ! empty( $x['id'] ) ) { $out[ $x['id'] ] = $x; } } return $out;
}
function tcd_cam_dados( $id ) { $id = (int) $id; if ( ! $id || 'tcd_camada' !== get_post_type( $id ) ) { return null; } $c = get_post_meta( $id, '_tcd_cam', true ); if ( ! is_array( $c ) ) { return null; } $c['id'] = $id; $c['nome'] = get_the_title( $id ); return $c; }
function tcd_cam_ficheiro( $c ) { return tcd_cam_pasta( $c['org'], ! empty( $c['lixo'] ) ) . '/' . ( ! empty( $c['fich'] ) ? sanitize_file_name( $c['fich'] ) : (int) $c['id'] . '.geojson' ); } // nome com sufixo aleatório: não se adivinha o URL
// Quem pode ver uma camada: gestores sempre; sensível só a quem está na lista; o resto, todos os membros.
function tcd_cam_ve( $u, $c ) {
	$org = (int) $c['org']; if ( tcd_org_de( $u ) !== $org ) { return false; }
	if ( ! empty( $c['lixo'] ) ) { return in_array( tcd_org_papel( $u, $org ), array( 'dono', 'gestor' ), true ); }
	if ( empty( $c['sensivel'] ) || in_array( tcd_org_papel( $u, $org ), array( 'dono', 'gestor' ), true ) ) { return true; }
	return in_array( (int) $u->ID, array_map( 'intval', (array) ( $c['quem'] ?? array() ) ), true );
}
function tcd_cam_lista( $org, $u = null, $com_lixo = false ) {
	$out = array();
	foreach ( get_posts( array( 'post_type' => 'tcd_camada', 'post_status' => 'any', 'numberposts' => 500, 'fields' => 'ids', 'meta_key' => '_tcd_cam_org', 'meta_value' => (int) $org, 'orderby' => 'title', 'order' => 'ASC' ) ) as $id ) {
		$c = tcd_cam_dados( $id ); if ( ! $c ) { continue; }
		if ( ! empty( $c['lixo'] ) && ! $com_lixo ) { continue; }
		if ( $u && ! tcd_cam_ve( $u, $c ) ) { continue; }
		$out[] = $c;
	}
	return $out;
}
// Uso (GB e ha) para o bloco e as quotas do m90253.
add_filter( 'tcd_org_uso', function ( $uso, $org ) {
	if ( ! tcd_cam_on() ) { return $uso; }
	$g = tcd_cam_grupos( $org ); $b = 0; $ha = 0.0; $n = 0;
	foreach ( tcd_cam_lista( $org, null, true ) as $c ) { $b += (int) $c['bytes']; $n++; if ( empty( $c['lixo'] ) && ! empty( $g[ $c['grupo'] ]['ha'] ) ) { $ha += (float) $c['ha']; } }
	$uso['gb'] = round( $b / 1e9, 4 ); $uso['bytes'] = $b; $uso['ha'] = round( $ha, 1 ); $uso['camadas'] = $n; return $uso;
}, 10, 2 );

// ---------- geometria: validar, contar, área ----------
function tcd_cam_area_ha( $anel ) { // Shoelace sobre coordenadas projectadas localmente (equirectangular), chega para quotas
	$n = count( $anel ); if ( $n < 4 ) { return 0.0; }
	$lat0 = 0; foreach ( $anel as $p ) { $lat0 += (float) $p[1]; } $lat0 /= $n; $k = cos( deg2rad( $lat0 ) ) * 111320.0; $ky = 110540.0; $s = 0.0;
	for ( $i = 0; $i < $n - 1; $i++ ) { $x1 = (float) $anel[ $i ][0] * $k; $y1 = (float) $anel[ $i ][1] * $ky; $x2 = (float) $anel[ $i + 1 ][0] * $k; $y2 = (float) $anel[ $i + 1 ][1] * $ky; $s += $x1 * $y2 - $x2 * $y1; }
	return abs( $s ) / 2 / 10000.0;
}
function tcd_cam_analisar( $gj ) { // devolve n, tipos, ha, bbox ou WP_Error
	if ( ! is_array( $gj ) || 'FeatureCollection' !== ( $gj['type'] ?? '' ) || ! isset( $gj['features'] ) || ! is_array( $gj['features'] ) ) { return new WP_Error( 'gj', 'O ficheiro não tem elementos geográficos legíveis.' ); }
	$n = 0; $tipos = array(); $ha = 0.0; $b = array( 180, 90, -180, -90 ); $validos = array();
	$ponto = function ( $p ) use ( &$b ) { if ( ! is_array( $p ) || count( $p ) < 2 || ! is_numeric( $p[0] ) || ! is_numeric( $p[1] ) || abs( $p[0] ) > 180 || abs( $p[1] ) > 90 ) { return false; } $b = array( min( $b[0], $p[0] ), min( $b[1], $p[1] ), max( $b[2], $p[0] ), max( $b[3], $p[1] ) ); return true; };
	foreach ( $gj['features'] as $ix => $f ) {
		$g = $f['geometry'] ?? null; if ( ! is_array( $g ) || empty( $g['type'] ) ) { continue; }
		$t = $g['type']; $cs = $g['coordinates'] ?? null; if ( ! is_array( $cs ) ) { continue; }
		if ( 'Point' === $t ) { if ( ! $ponto( $cs ) ) { continue; } }
		elseif ( in_array( $t, array( 'MultiPoint', 'LineString' ), true ) ) { foreach ( $cs as $p ) { if ( ! $ponto( $p ) ) { continue 2; } } }
		elseif ( in_array( $t, array( 'MultiLineString', 'Polygon' ), true ) ) { foreach ( $cs as $l ) { foreach ( (array) $l as $p ) { if ( ! $ponto( $p ) ) { continue 3; } } } if ( 'Polygon' === $t ) { $ha += tcd_cam_area_ha( $cs[0] ); for ( $i = 1; $i < count( $cs ); $i++ ) { $ha -= tcd_cam_area_ha( $cs[ $i ] ); } } }
		elseif ( 'MultiPolygon' === $t ) { foreach ( $cs as $pg ) { foreach ( (array) $pg as $l ) { foreach ( (array) $l as $p ) { if ( ! $ponto( $p ) ) { continue 4; } } } $ha += tcd_cam_area_ha( $pg[0] ); for ( $i = 1; $i < count( $pg ); $i++ ) { $ha -= tcd_cam_area_ha( $pg[ $i ] ); } } }
		else { continue; }
		$n++; $tipos[ preg_replace( '/^Multi/', '', $t ) ] = 1; $validos[ $ix ] = 1;
		if ( $n > TCD_CAM_MAX_N ) { return new WP_Error( 'n', 'Mais de ' . number_format( TCD_CAM_MAX_N, 0, ',', ' ' ) . ' elementos. Divida o ficheiro.' ); }
	}
	if ( ! $n ) { return new WP_Error( 'vazio', 'Nenhum elemento com coordenadas válidas (longitude e latitude em graus). Se o ficheiro está noutro sistema de coordenadas, falta o .prj.' ); }
	$geom = 1 === count( $tipos ) ? strtolower( array_key_first( $tipos ) ) : 'misto'; $geom = str_replace( array( 'point', 'linestring', 'polygon' ), array( 'ponto', 'linha', 'poligono' ), $geom );
	return array( 'n' => $n, 'geom' => $geom, 'ha' => round( max( 0.0, $ha ), 2 ), 'bbox' => array_map( function ( $x ) { return round( $x, 6 ); }, $b ), 'validos' => $validos );
}

// ---------- carregar (admin-ajax, só editores) ----------
add_action( 'wp_ajax_tcd_cam_carregar', function () {
	check_ajax_referer( 'tcd_cam', 'n' );
	$u = wp_get_current_user(); $org = tcd_org_de( $u );
	if ( ! tcd_cam_on() || ! $org || ! tcd_org_pode( $u, 'editar', $org ) ) { wp_send_json_error( array( 'm' => 'Sem acesso para carregar. Peça a quem gere a organização.' ), 403 ); }
	$k = 'tcd_cam_c_' . $u->ID; $n = (int) get_transient( $k ); if ( $n >= 40 ) { wp_send_json_error( array( 'm' => 'Muitos carregamentos numa hora. Tente mais tarde.' ), 429 ); } set_transient( $k, $n + 1, HOUR_IN_SECONDS );
	$raw = (string) ( $_POST['geojson'] ?? '' ); $bytes = strlen( $raw ); // phpcs:ignore
	if ( $bytes > TCD_CAM_MB * 1048576 ) { wp_send_json_error( array( 'm' => 'Ficheiro acima de ' . TCD_CAM_MB . ' MB. Divida-o ou simplifique a geometria.' ), 400 ); }
	$gj = json_decode( wp_unslash( $raw ), true, 32 ); $a = tcd_cam_analisar( $gj );
	if ( is_wp_error( $a ) ) { wp_send_json_error( array( 'm' => $a->get_error_message() ), 400 ); }
	$g = tcd_cam_grupos( $org ); $grupo = sanitize_key( $_POST['grupo'] ?? '' ); if ( ! isset( $g[ $grupo ] ) ) { $grupo = array_key_first( $g ); } // phpcs:ignore
	$nome = mb_substr( sanitize_text_field( wp_unslash( $_POST['nome'] ?? '' ) ), 0, 90 ); $orig = mb_substr( sanitize_file_name( wp_unslash( $_POST['ficheiro'] ?? '' ) ), 0, 120 ); // phpcs:ignore
	if ( '' === $nome ) { $nome = $orig ? preg_replace( '/\.[a-z0-9]+$/i', '', $orig ) : 'Camada'; }
	$r = tcd_cam_guardar( $org, $u, $gj, $nome, $grupo, array( 'origem' => $orig, 'formato' => sanitize_key( $_POST['formato'] ?? '' ), 'analise' => $a, 'bytes' => $bytes ) ); // phpcs:ignore
	if ( is_wp_error( $r ) ) { wp_send_json_error( array( 'm' => $r->get_error_message() ), (int) ( $r->get_error_data() ?: 400 ) ); }
	wp_send_json_success( array( 'id' => (int) $r, 'n' => $a['n'], 'ha' => $a['ha'], 'geom' => $a['geom'], 'm' => 'Camada «' . $nome . '» guardada: ' . number_format( $a['n'], 0, ',', ' ' ) . ' elemento' . ( 1 === $a['n'] ? '' : 's' ) . ( $a['ha'] > 0 ? ', ' . number_format( $a['ha'], 1, ',', ' ' ) . ' ha' : '' ) . '.' ) );
} );
// Guardar uma camada (também usado por importadores): valida, aplica quotas, limpa propriedades, escreve o ficheiro.
// $extra: origem, formato, analise (de tcd_cam_analisar), bytes, sensivel (força), quem. Devolve o id ou WP_Error (data = código HTTP).
function tcd_cam_guardar( $org, $u, $gj, $nome, $grupo, $extra = array() ) {
	$org = (int) $org; $d = tcd_org_dados( $org ); if ( ! $d ) { return new WP_Error( 'org', 'Organização não encontrada.', 404 ); }
	if ( 'activa' !== $d['estado'] ) { return new WP_Error( 'org', 'A organização está em só leitura.', 403 ); }
	$a = $extra['analise'] ?? tcd_cam_analisar( $gj ); if ( is_wp_error( $a ) ) { $a->add_data( 400 ); return $a; }
	$g = tcd_cam_grupos( $org ); $grupo = sanitize_key( $grupo ); if ( ! isset( $g[ $grupo ] ) ) { $grupo = array_key_first( $g ); }
	$nome = mb_substr( sanitize_text_field( (string) $nome ), 0, 90 ); if ( '' === $nome ) { $nome = 'Camada'; }
	$bytes = (int) ( $extra['bytes'] ?? strlen( wp_json_encode( $gj ) ) ); $uso = tcd_org_uso( $org );
	if ( $uso['gb'] * 1e9 + $bytes > (float) $d['limites']['gb'] * 1e9 ) { return new WP_Error( 'gb', 'Não há espaço: ' . number_format( $uso['gb'], 2, ',', ' ' ) . ' de ' . (int) $d['limites']['gb'] . ' GB usados. Apague camadas ou fale connosco.', 400 ); }
	if ( ! empty( $g[ $grupo ]['ha'] ) && $uso['ha'] + $a['ha'] > (float) $d['limites']['ha'] ) { return new WP_Error( 'ha', 'Esta camada soma ' . number_format( $a['ha'], 0, ',', ' ' ) . ' ha ao grupo «' . $g[ $grupo ]['nome'] . '» e ultrapassa o limite de ' . number_format( (int) $d['limites']['ha'], 0, ',', ' ' ) . ' ha. Se são as mesmas áreas de outra camada, ponha-a num grupo que não conta área, ou fale connosco.', 400 ); }
	$limpo = array( 'type' => 'FeatureCollection', 'features' => array() ); $np = 0;
	foreach ( $gj['features'] as $i => $f ) { if ( empty( $f['geometry'] ) || ( isset( $a['validos'] ) && empty( $a['validos'][ $i ] ) ) ) { continue; } $pr = array(); foreach ( (array) ( $f['properties'] ?? array() ) as $pk => $pv ) { if ( $np++ > 2000000 ) { break; } $pk = mb_substr( sanitize_text_field( (string) $pk ), 0, 60 ); if ( '' === $pk ) { continue; } $pr[ $pk ] = is_scalar( $pv ) ? ( is_string( $pv ) ? mb_substr( wp_strip_all_tags( $pv ), 0, 500 ) : $pv ) : null; } $limpo['features'][] = array( 'type' => 'Feature', 'geometry' => $f['geometry'], 'properties' => $pr ); }
	$id = wp_insert_post( array( 'post_type' => 'tcd_camada', 'post_status' => 'private', 'post_title' => $nome, 'post_author' => (int) $u->ID ) );
	if ( ! $id || is_wp_error( $id ) ) { return new WP_Error( 'post', 'Não foi possível guardar.', 500 ); }
	$json = wp_json_encode( $limpo ); $fich = (int) $id . '-' . strtolower( wp_generate_password( 16, false, false ) ) . '.geojson'; $f = tcd_cam_pasta( $org ) . '/' . $fich;
	if ( false === @file_put_contents( $f, $json ) ) { wp_delete_post( $id, true ); return new WP_Error( 'fich', 'Não foi possível escrever o ficheiro.', 500 ); }
	$sens = isset( $extra['sensivel'] ) ? (int) ! empty( $extra['sensivel'] ) : (int) ! empty( $g[ $grupo ]['sensivel'] );
	$c = array( 'org' => $org, 'grupo' => $grupo, 'sensivel' => $sens, 'quem' => array_map( 'intval', (array) ( $extra['quem'] ?? array() ) ), 'geom' => $a['geom'], 'n' => $a['n'], 'ha' => $a['ha'], 'bbox' => $a['bbox'], 'bytes' => strlen( $json ), 'fich' => $fich, 'origem' => mb_substr( sanitize_file_name( (string) ( $extra['origem'] ?? '' ) ), 0, 120 ), 'formato' => sanitize_key( $extra['formato'] ?? '' ), 'por' => (int) $u->ID, 'quando' => current_time( 'mysql' ), 'lixo' => 0 );
	update_post_meta( $id, '_tcd_cam', $c ); update_post_meta( $id, '_tcd_cam_org', $org );
	do_action( 'tcd_cam_carregada', $id, $c, $u, $limpo ); // o 4.º argumento evita que outros módulos voltem a abrir o ficheiro
	return (int) $id;
}
// Criar um grupo por código (importadores, modelos). Devolve o id do grupo ou false se já existe.
function tcd_cam_grupo_criar( $org, $nome, $args = array(), $u = null ) {
	$org = (int) $org; $d = tcd_org_dados( $org ); if ( ! $d ) { return false; } $g = tcd_cam_grupos( $org );
	$k = sanitize_key( $args['id'] ?? substr( sanitize_title( $nome ), 0, 20 ) ); $nome = mb_substr( sanitize_text_field( (string) $nome ), 0, 40 );
	if ( ! $k || ! $nome || isset( $g[ $k ] ) || count( $g ) >= 30 ) { return isset( $g[ $k ] ) ? $k : false; }
	$g[ $k ] = array( 'id' => $k, 'nome' => $nome, 'cor' => tcd_cam_cor( $args['cor'] ?? '' ), 'sensivel' => (int) ! empty( $args['sensivel'] ), 'ha' => (int) ! empty( $args['ha'] ) ) + array_intersect_key( (array) $args, array( 'cat' => 1, 'modelo' => 1, 'descr' => 1 ) );
	$d['grupos'] = array_values( $g ); tcd_org_guardar( $org, $d );
	do_action( 'tcd_cam_grupo_novo', $org, $g[ $k ], $u, ! empty( $args['automatico'] ) );
	return $k;
}
// Ler o GeoJSON de uma camada já filtrado para quem o vai ver ($contexto: rest, exportar, publico, relatorio).
function tcd_cam_geojson( $c, $uid, $contexto = 'rest' ) {
	$f = tcd_cam_ficheiro( $c ); if ( ! is_readable( $f ) ) { return null; }
	$gj = json_decode( file_get_contents( $f ), true ); if ( ! is_array( $gj ) ) { return null; }
	return apply_filters( 'tcd_cam_geojson', $gj, $c, (int) $uid, $contexto );
}

// ---------- gerir camadas e grupos (admin-post, nonce) ----------
function tcd_cam_form( $op, $campos, $botao, $cls = '' ) { return '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" class="' . esc_attr( 'tcam-f ' . $cls ) . '"><input type="hidden" name="action" value="tcd_cam_acao"><input type="hidden" name="op" value="' . esc_attr( $op ) . '">' . wp_nonce_field( 'tcd_cam', '_wpnonce', true, false ) . $campos . '<button type="submit">' . esc_html( $botao ) . '</button></form>'; }
add_action( 'admin_post_tcd_cam_acao', function () {
	check_admin_referer( 'tcd_cam' );
	$u = wp_get_current_user(); $org = tcd_org_de( $u ); $op = sanitize_key( $_POST['op'] ?? '' ); $msg = ''; // phpcs:ignore
	if ( ! tcd_cam_on() || ! $org ) { wp_die( 'Sem acesso.' ); }
	$gere = tcd_org_pode( $u, 'gerir', $org ); $edita = tcd_org_pode( $u, 'editar', $org );
	$cid = (int) ( $_POST['cid'] ?? 0 ); $c = $cid ? tcd_cam_dados( $cid ) : null; if ( $c && (int) $c['org'] !== $org ) { $c = null; } $d = tcd_org_dados( $org ); $g = tcd_cam_grupos( $org ); // phpcs:ignore
	$quota = function ( $grupo_alvo ) use ( &$c, $g, $org, $d ) { if ( empty( $g[ $grupo_alvo ]['ha'] ) ) { return true; } $uso = tcd_org_uso( $org ); $ja = ( empty( $c['lixo'] ) && ! empty( $g[ $c['grupo'] ]['ha'] ) ) ? (float) $c['ha'] : 0.0; return $uso['ha'] - $ja + (float) $c['ha'] <= (float) $d['limites']['ha'] + 0.01; }; // a quota de ha vale também ao repor e ao mudar de grupo
	if ( $c && in_array( $op, array( 'lixo', 'repor', 'grupo', 'sensivel', 'quem', 'nome' ), true ) ) {
		$propria = (int) $c['por'] === (int) $u->ID;
		if ( ! ( $gere || ( $edita && $propria && in_array( $op, array( 'lixo', 'grupo', 'nome' ), true ) ) ) ) { wp_die( 'Sem acesso.' ); }
		if ( 'repor' === $op && ! $quota( $c['grupo'] ) ) { $msg = 'Repor esta camada ultrapassa o limite de hectares.'; }
		elseif ( 'lixo' === $op || 'repor' === $op ) { $de = tcd_cam_ficheiro( $c ); $c['lixo'] = 'lixo' === $op ? time() : 0; $para = tcd_cam_ficheiro( $c ); if ( file_exists( $de ) ) { @rename( $de, $para ); } $msg = 'lixo' === $op ? 'Camada no lixo (30 dias para repor).' : 'Camada reposta.'; }
		elseif ( 'grupo' === $op ) { $k = sanitize_key( $_POST['grupo'] ?? '' ); if ( isset( $g[ $k ] ) ) { if ( $quota( $k ) ) { $c['grupo'] = $k; $msg = 'Grupo alterado.'; } else { $msg = 'Mudar para esse grupo ultrapassa o limite de hectares.'; } } } // phpcs:ignore
		elseif ( 'sensivel' === $op ) { $c['sensivel'] = (int) ! empty( $_POST['v'] ); $msg = $c['sensivel'] ? 'Camada marcada como sensível.' : 'Camada visível a toda a organização.'; } // phpcs:ignore
		elseif ( 'quem' === $op ) { $m = tcd_org_membros( $org ); $q = array(); foreach ( array_map( 'intval', (array) ( $_POST['quem'] ?? array() ) ) as $x ) { if ( isset( $m[ $x ] ) ) { $q[] = $x; } } $c['quem'] = $q; $msg = 'Acesso à camada actualizado.'; } // phpcs:ignore
		elseif ( 'nome' === $op ) { $nm = mb_substr( sanitize_text_field( wp_unslash( $_POST['nome'] ?? '' ) ), 0, 90 ); if ( $nm ) { wp_update_post( array( 'ID' => $cid, 'post_title' => $nm ) ); $msg = 'Nome alterado.'; } } // phpcs:ignore
		unset( $c['id'], $c['nome'] ); update_post_meta( $cid, '_tcd_cam', $c );
		do_action( 'tcd_cam_alterada', $cid, $c, $op ); // caches públicas e agregados (m90261, m90259)
	} elseif ( in_array( $op, array( 'grupo_novo', 'grupo_editar', 'grupo_apagar' ), true ) ) {
		if ( ! $gere ) { wp_die( 'Sem acesso.' ); }
		$kr = 'tcd_cam_g_' . $u->ID; $nr = (int) get_transient( $kr ); if ( $nr >= 30 ) { wp_die( 'Muitas alterações de grupos numa hora.' ); } set_transient( $kr, $nr + 1, HOUR_IN_SECONDS );
		if ( 'grupo_novo' === $op ) { $nm = mb_substr( sanitize_text_field( wp_unslash( $_POST['nome'] ?? '' ) ), 0, 40 ); $k = sanitize_key( substr( sanitize_title( $nm ), 0, 20 ) ); if ( $nm && $k && ! isset( $g[ $k ] ) && count( $g ) < 30 ) { $g[ $k ] = array( 'id' => $k, 'nome' => $nm, 'cor' => tcd_cam_cor( $_POST['cor'] ?? '' ), 'sensivel' => (int) ! empty( $_POST['sensivel'] ), 'ha' => (int) ! empty( $_POST['ha'] ) ); $msg = 'Grupo criado.'; $d['grupos'] = array_values( $g ); tcd_org_guardar( $org, $d ); do_action( 'tcd_cam_grupo_novo', $org, $g[ $k ], $u, false ); $d = tcd_org_dados( $org ); $g = tcd_cam_grupos( $org ); } } // phpcs:ignore
		elseif ( 'grupo_editar' === $op ) { $k = sanitize_key( $_POST['gid'] ?? '' ); if ( isset( $g[ $k ] ) ) { $nm = mb_substr( sanitize_text_field( wp_unslash( $_POST['nome'] ?? '' ) ), 0, 40 ); if ( $nm ) { $g[ $k ]['nome'] = $nm; } $g[ $k ]['cor'] = tcd_cam_cor( $_POST['cor'] ?? $g[ $k ]['cor'] ); $g[ $k ]['sensivel'] = (int) ! empty( $_POST['sensivel'] ); $g[ $k ]['ha'] = (int) ! empty( $_POST['ha'] ); $msg = 'Grupo alterado.'; } } // phpcs:ignore
		elseif ( 'grupo_apagar' === $op ) { $k = sanitize_key( $_POST['gid'] ?? '' ); $tem = false; foreach ( tcd_cam_lista( $org, null, true ) as $x ) { if ( $x['grupo'] === $k ) { $tem = true; break; } } if ( isset( $g[ $k ] ) && ! $tem && count( $g ) > 1 ) { unset( $g[ $k ] ); $msg = 'Grupo apagado.'; } else { $msg = 'O grupo tem camadas; mude-as primeiro.'; } } // phpcs:ignore
		$d['grupos'] = array_values( $g ); tcd_org_guardar( $org, $d );
	}
	wp_safe_redirect( add_query_arg( 'cam_msg', rawurlencode( $msg ), home_url( '/oficina/' ) ) . '#camadas' ); if ( ! defined( 'TCD_TESTE' ) ) { exit; }
} );
function tcd_cam_cor( $c ) { $c = (string) $c; return preg_match( '/^#[0-9a-fA-F]{6}$/', $c ) ? strtolower( $c ) : '#75834a'; }
// Lixo: apagar de vez ao fim de 30 dias (cron diário do m90253).
add_action( 'tcd_org_diario', function () {
	foreach ( get_posts( array( 'post_type' => 'tcd_camada', 'post_status' => 'any', 'numberposts' => 500, 'fields' => 'ids' ) ) as $id ) {
		$c = tcd_cam_dados( $id ); if ( ! $c || empty( $c['lixo'] ) || (int) $c['lixo'] > time() - 30 * DAY_IN_SECONDS ) { continue; }
		$f = tcd_cam_ficheiro( $c ); if ( file_exists( $f ) ) { @unlink( $f ); } wp_delete_post( $id, true );
	}
}, 20 );

// ---------- rotas de dados (sessão) ----------
add_action( 'rest_api_init', function () {
	$sess = function () { return tcd_cam_on() && is_user_logged_in() && tcd_org_de( wp_get_current_user() ) > 0; };
	register_rest_route( 'tcd/v1', '/org/camadas', array( 'methods' => 'GET', 'permission_callback' => $sess, 'callback' => function () {
		$u = wp_get_current_user(); $org = tcd_org_de( $u ); $g = tcd_cam_grupos( $org ); $d = tcd_org_dados( $org ); $out = array();
		foreach ( tcd_cam_lista( $org, $u ) as $c ) { $out[] = array( 'id' => $c['id'], 'nome' => $c['nome'], 'grupo' => $c['grupo'], 'cor' => $g[ $c['grupo'] ]['cor'] ?? '#75834a', 'geom' => $c['geom'], 'n' => $c['n'], 'ha' => $c['ha'], 'bbox' => apply_filters( 'tcd_cam_bbox', $c['bbox'], $c, (int) $u->ID, 'rest' ), 'sensivel' => (int) $c['sensivel'], 'url' => rest_url( 'tcd/v1/org/camada/' . $c['id'] ) ); }
		$r = rest_ensure_response( array( 'org' => array( 'id' => $org, 'nome' => $d['nome'], 'estado' => $d['estado'], 'papel' => tcd_org_papel( $u, $org ) ), 'grupos' => array_values( $g ), 'camadas' => $out ) ); $r->header( 'Cache-Control', 'private, no-store' ); return $r;
	} ) );
	register_rest_route( 'tcd/v1', '/org/camada/(?P<id>\d+)', array( 'methods' => 'GET', 'permission_callback' => $sess, 'callback' => function ( WP_REST_Request $q ) {
		$u = wp_get_current_user(); $c = tcd_cam_dados( (int) $q['id'] );
		if ( ! $c || ! tcd_cam_ve( $u, $c ) ) { return new WP_Error( 'cam', 'Camada não encontrada.', array( 'status' => 404 ) ); }
		$k = 'tcd_cam_l_' . $u->ID; $n = (int) get_transient( $k ); if ( $n >= 120 ) { return new WP_Error( 'cam', 'Muitas leituras numa hora.', array( 'status' => 429 ) ); } set_transient( $k, $n + 1, HOUR_IN_SECONDS );
		$f = tcd_cam_ficheiro( $c ); if ( ! is_readable( $f ) ) { return new WP_Error( 'cam', 'Ficheiro em falta.', array( 'status' => 404 ) ); }
		if ( ! apply_filters( 'tcd_cam_precisa_filtro', has_filter( 'tcd_cam_geojson' ), $c, (int) $u->ID, 'rest' ) && ! defined( 'TCD_TESTE' ) ) { header( 'Content-Type: application/geo+json; charset=utf-8' ); header( 'Cache-Control: private, no-store' ); header( 'Content-Length: ' . filesize( $f ) ); readfile( $f ); exit; } // sem filtros: envia o ficheiro sem o descodificar
		$gj = tcd_cam_geojson( $c, $u->ID, 'rest' ); if ( null === $gj ) { return new WP_Error( 'cam', 'Ficheiro em falta.', array( 'status' => 404 ) ); }
		$r = new WP_REST_Response( $gj ); $r->header( 'Cache-Control', 'private, no-store' ); return $r;
	} ) );
	register_rest_route( 'tcd/v1', '/org/exportar', array( 'methods' => 'GET', 'permission_callback' => $sess, 'callback' => function () {
		$u = wp_get_current_user(); $org = tcd_org_de( $u ); if ( ! class_exists( 'ZipArchive' ) ) { return new WP_Error( 'zip', 'Exportação indisponível.', array( 'status' => 503 ) ); }
		$k = 'tcd_cam_x_' . $u->ID; if ( get_transient( $k ) ) { return new WP_Error( 'zip', 'Já exportou há pouco. Espere um minuto.', array( 'status' => 429 ) ); } set_transient( $k, 1, MINUTE_IN_SECONDS );
		$tmp = wp_tempnam( 'org' ); $z = new ZipArchive(); $z->open( $tmp, ZipArchive::OVERWRITE ); $g = tcd_cam_grupos( $org );
		$tot = 0; foreach ( tcd_cam_lista( $org, $u ) as $c ) { $tot += (int) $c['bytes']; if ( $tot > TCD_CAM_ZIP_MB * 1048576 ) { break; } $gj = tcd_cam_geojson( $c, $u->ID, 'exportar' ); if ( null === $gj ) { continue; } $base = sanitize_file_name( $g[ $c['grupo'] ]['nome'] ?? 'camadas' ) . '/' . sanitize_file_name( $c['nome'] ); $z->addFromString( $base . '.geojson', wp_json_encode( $gj ) ); $z->addFromString( $base . '.kml', tcd_cam_kml( $gj, $c['nome'] ) ); }
		$z->addFromString( 'LEIA-ME.txt', "Exportação da organização, IPR Atlas, " . wp_date( 'j/n/Y H:i' ) . ".\nCada camada em GeoJSON (WGS84) e KML. Abre no QGIS, Google Earth e ArcGIS.\n" ); $z->close();
		header( 'Content-Type: application/zip' ); header( 'Content-Disposition: attachment; filename="ipr-atlas-organizacao-' . (int) $org . '-' . wp_date( 'Y-m-d' ) . '.zip"' ); header( 'Content-Length: ' . filesize( $tmp ) ); readfile( $tmp ); @unlink( $tmp ); exit;
	} ) );
} );
function tcd_cam_kml( $gj, $nome ) {
	$x = function ( $s ) { return htmlspecialchars( (string) $s, ENT_XML1 | ENT_QUOTES, 'UTF-8' ); }; $cs = function ( $l ) { return implode( ' ', array_map( function ( $p ) { return (float) $p[0] . ',' . (float) $p[1] . ',0'; }, (array) $l ) ); };
	$geo = function ( $g ) use ( &$geo, $cs ) {
		$t = $g['type'] ?? ''; $c = $g['coordinates'] ?? array();
		if ( 'Point' === $t ) { return '<Point><coordinates>' . $cs( array( $c ) ) . '</coordinates></Point>'; }
		if ( 'LineString' === $t ) { return '<LineString><coordinates>' . $cs( $c ) . '</coordinates></LineString>'; }
		if ( 'Polygon' === $t ) { $s = '<Polygon><outerBoundaryIs><LinearRing><coordinates>' . $cs( $c[0] ?? array() ) . '</coordinates></LinearRing></outerBoundaryIs>'; for ( $i = 1; $i < count( $c ); $i++ ) { $s .= '<innerBoundaryIs><LinearRing><coordinates>' . $cs( $c[ $i ] ) . '</coordinates></LinearRing></innerBoundaryIs>'; } return $s . '</Polygon>'; }
		if ( in_array( $t, array( 'MultiPoint', 'MultiLineString', 'MultiPolygon' ), true ) ) { $s = '<MultiGeometry>'; foreach ( $c as $p ) { $s .= $geo( array( 'type' => substr( $t, 5 ), 'coordinates' => $p ) ); } return $s . '</MultiGeometry>'; }
		return '';
	};
	$k = '<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>' . $x( $nome ) . '</name>';
	foreach ( (array) ( $gj['features'] ?? array() ) as $f ) { $pr = (array) ( $f['properties'] ?? array() ); $nm = (string) ( $pr['name'] ?? $pr['nome'] ?? $pr['Name'] ?? '' ); $ed = ''; foreach ( $pr as $pk => $pv ) { if ( is_scalar( $pv ) ) { $ed .= '<Data name="' . $x( $pk ) . '"><value>' . $x( $pv ) . '</value></Data>'; } } $k .= '<Placemark>' . ( $nm ? '<name>' . $x( $nm ) . '</name>' : '' ) . ( $ed ? '<ExtendedData>' . $ed . '</ExtendedData>' : '' ) . $geo( (array) ( $f['geometry'] ?? array() ) ) . '</Placemark>'; }
	return $k . '</Document></kml>';
}

// ---------- bloco «Camadas» na Oficina ----------
add_filter( 'tcd_of_blocos', function ( $b ) {
	$u = wp_get_current_user(); if ( ! tcd_cam_on() || ! tcd_org_de( $u ) ) { return $b; }
	$novo = array(); foreach ( $b as $k => $v ) { $novo[ $k ] = $v; if ( 'org' === $k ) { $novo['camadas'] = array( 't' => 'Camadas da organização', 'k' => 'Dados', 'f' => 'tcd_cam_bloco', 'w' => 2, 'cache' => 0 ); } }
	if ( ! isset( $novo['camadas'] ) ) { $novo = array( 'camadas' => array( 't' => 'Camadas da organização', 'k' => 'Dados', 'f' => 'tcd_cam_bloco', 'w' => 2, 'cache' => 0 ) ) + $novo; }
	return $novo;
}, 6 );
function tcd_cam_bloco( $u ) {
	$org = tcd_org_de( $u ); if ( ! $org ) { return ''; }
	$d = tcd_org_dados( $org ); $g = tcd_cam_grupos( $org ); $gere = tcd_org_pode( $u, 'gerir', $org ); $edita = tcd_org_pode( $u, 'editar', $org ); $m = tcd_org_membros( $org ); $lista = tcd_cam_lista( $org, $u, $gere );
	$h = '<div id="camadas">';
	if ( isset( $_GET['cam_msg'] ) ) { $h .= '<p class="tof-vz" role="status">' . esc_html( sanitize_text_field( wp_unslash( $_GET['cam_msg'] ) ) ) . '</p>'; } // phpcs:ignore
	if ( $edita ) {
		$sel = ''; foreach ( $g as $k => $x ) { $sel .= '<option value="' . esc_attr( $k ) . '">' . esc_html( $x['nome'] ) . ( ! empty( $x['sensivel'] ) ? ' (sensível)' : '' ) . '</option>'; }
		$h .= '<div class="tcam-up"><p class="tof-k">Carregar</p><p class="tof-vz">Shapefile (zip com .shp, .shx, .dbf e .prj), KML, KMZ, GeoJSON, GPX ou CSV com colunas de latitude e longitude. Até ' . TCD_CAM_MB . ' MB por ficheiro. Sem rasters: a topografia já está no Atlas.</p>'
			. '<label>Ficheiro<input type="file" id="tcam-f" accept=".zip,.shp,.kml,.kmz,.geojson,.json,.gpx,.csv"></label><label>Nome<input type="text" id="tcam-n" maxlength="90" placeholder="Ex.: Limites das áreas núcleo 2025"></label><label>Grupo<select id="tcam-g">' . $sel . '</select></label><button type="button" class="tof-btn" id="tcam-b">Carregar</button><div class="tof-vz" id="tcam-r" role="status"></div></div>';
	}
	if ( ! $lista ) { $h .= tcd_of_vazio( $edita ? 'Ainda não há camadas. Carregue a primeira.' : 'Ainda não há camadas na organização.' ); }
	else {
		foreach ( $g as $gk => $gx ) {
			$do = array_filter( $lista, function ( $c ) use ( $gk ) { return $c['grupo'] === $gk; } ); if ( ! $do ) { continue; }
			$h .= '<p class="tof-k" style="margin-top:10px"><i style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' . esc_attr( $gx['cor'] ) . ';margin-right:6px"></i>' . esc_html( $gx['nome'] ) . ( ! empty( $gx['sensivel'] ) ? ' · sensível' : '' ) . ( ! empty( $gx['ha'] ) ? ' · conta área' : '' ) . '</p><ul class="tof-l">';
			foreach ( $do as $c ) {
				$h .= '<li' . ( ! empty( $c['lixo'] ) ? ' style="opacity:.55"' : '' ) . '><div><b>' . esc_html( $c['nome'] ) . '</b>' . ( ! empty( $c['sensivel'] ) ? ' <span class="tof-pill" title="Só quem gere e quem foi marcado vê esta camada">sensível</span>' : '' ) . ( ! empty( $c['lixo'] ) ? ' <span class="tof-pill">no lixo</span>' : '' ) . '<br><small>' . esc_html( number_format( (int) $c['n'], 0, ',', ' ' ) . ' ' . ( 'ponto' === $c['geom'] ? 'pontos' : ( 'linha' === $c['geom'] ? 'linhas' : ( 'poligono' === $c['geom'] ? 'polígonos' : 'elementos' ) ) ) . ( $c['ha'] > 0 ? ' · ' . number_format( (float) $c['ha'], 1, ',', ' ' ) . ' ha' : '' ) . ' · ' . size_format( (int) $c['bytes'] ) . ' · ' . ( $m[ $c['por'] ]['nome'] ?? '' ) . ', ' . wp_date( 'j/n/Y', strtotime( $c['quando'] ) ) ) . '</small></div><div class="tcam-acc">'
					. '<a class="tof-btn s" href="' . esc_url( add_query_arg( '_wpnonce', wp_create_nonce( 'wp_rest' ), rest_url( 'tcd/v1/org/camada/' . $c['id'] ) ) ) . '" download="' . esc_attr( sanitize_file_name( $c['nome'] ) . '.geojson' ) . '">GeoJSON</a><a class="tof-btn s" href="' . esc_url( home_url( '/atlas/?org_camada=' . $c['id'] ) ) . '">Ver no Atlas</a>';
				$dono_da = (int) $c['por'] === (int) $u->ID;
				if ( ( $gere || ( $edita && $dono_da ) ) && 'activa' === $d['estado'] ) {
					if ( ! empty( $c['lixo'] ) ) { if ( $gere ) { $h .= tcd_cam_form( 'repor', '<input type="hidden" name="cid" value="' . (int) $c['id'] . '">', 'Repor' ); } }
					else {
						$so = '<select name="grupo">'; foreach ( $g as $k2 => $x2 ) { $so .= '<option value="' . esc_attr( $k2 ) . '"' . selected( $k2, $c['grupo'], false ) . '>' . esc_html( $x2['nome'] ) . '</option>'; } $so .= '</select>';
						$h .= tcd_cam_form( 'grupo', '<input type="hidden" name="cid" value="' . (int) $c['id'] . '">' . $so, 'Mudar' );
						if ( $gere ) { $h .= tcd_cam_form( 'sensivel', '<input type="hidden" name="cid" value="' . (int) $c['id'] . '"><input type="hidden" name="v" value="' . ( empty( $c['sensivel'] ) ? '1' : '0' ) . '">', empty( $c['sensivel'] ) ? 'Tornar sensível' : 'Abrir a todos' );
							if ( ! empty( $c['sensivel'] ) ) { $ck = ''; foreach ( $m as $uid => $mx ) { if ( 'activo' !== $mx['estado'] || in_array( $mx['papel'], array( 'dono', 'gestor' ), true ) ) { continue; } $ck .= '<label><input type="checkbox" name="quem[]" value="' . (int) $uid . '"' . checked( in_array( (int) $uid, array_map( 'intval', (array) $c['quem'] ), true ), true, false ) . '> ' . esc_html( $mx['nome'] ) . '</label>'; } if ( $ck ) { $h .= '<details class="tcam-q"><summary>Quem vê</summary>' . tcd_cam_form( 'quem', '<input type="hidden" name="cid" value="' . (int) $c['id'] . '">' . $ck, 'Guardar' ) . '</details>'; } } }
						$h .= tcd_cam_form( 'lixo', '<input type="hidden" name="cid" value="' . (int) $c['id'] . '">', 'Lixo', 's' );
					}
				}
				$h .= '</div></li>';
			}
			$h .= '</ul>';
		}
		$h .= '<p>' . tcd_of_btn( 'Exportar tudo (ZIP com GeoJSON e KML)', add_query_arg( '_wpnonce', wp_create_nonce( 'wp_rest' ), rest_url( 'tcd/v1/org/exportar' ) ), true ) . '</p>';
	}
	if ( $gere && 'activa' === $d['estado'] ) {
		$h .= '<details class="tcam-q"><summary>Grupos de camadas</summary>';
		foreach ( $g as $k => $x ) { $h .= tcd_cam_form( 'grupo_editar', '<input type="hidden" name="gid" value="' . esc_attr( $k ) . '"><input type="text" name="nome" value="' . esc_attr( $x['nome'] ) . '" maxlength="40"><input type="color" name="cor" value="' . esc_attr( $x['cor'] ) . '"><label><input type="checkbox" name="sensivel" value="1"' . checked( ! empty( $x['sensivel'] ), true, false ) . '> sensível</label><label><input type="checkbox" name="ha" value="1"' . checked( ! empty( $x['ha'] ), true, false ) . '> conta área</label>', 'Guardar' ) . tcd_cam_form( 'grupo_apagar', '<input type="hidden" name="gid" value="' . esc_attr( $k ) . '">', 'Apagar', 's' ) . '<br>'; }
		$h .= tcd_cam_form( 'grupo_novo', '<input type="text" name="nome" placeholder="Novo grupo" maxlength="40" required><input type="color" name="cor" value="#75834a"><label><input type="checkbox" name="sensivel" value="1"> sensível</label><label><input type="checkbox" name="ha" value="1"> conta área</label>', 'Criar' ) . '</details>';
	}
	$h .= '<style>.tcam-up{border:1px dashed var(--ln);border-radius:10px;padding:12px;margin-bottom:12px;display:grid;gap:8px}.tcam-up label{display:flex;flex-direction:column;gap:3px;font-size:13px;color:var(--mu)}.tcam-up input,.tcam-up select{font:14px Inter,sans-serif;border:1px solid var(--ln);border-radius:8px;padding:7px 9px;background:var(--p);color:var(--tx)}.tcam-up .tof-btn{justify-self:start}.tcam-acc{display:flex;gap:4px;flex-wrap:wrap;align-items:center}.tcam-acc .tof-btn{margin:0;padding:4px 9px;font-size:12px}.tcam-f{margin:0;display:inline-flex;gap:4px;align-items:center;flex-wrap:wrap}.tcam-f button{font:600 12px Inter,sans-serif;border:1px solid var(--ln);border-radius:8px;padding:4px 9px;background:var(--p);color:var(--ac2);cursor:pointer}.tcam-f.s button{color:var(--te)}.tcam-f select,.tcam-f input[type=text]{font:12px Inter,sans-serif;border:1px solid var(--ln);border-radius:8px;padding:3px 6px;background:var(--p);color:var(--tx)}.tcam-f label{font-size:12px;color:var(--mu)}.tcam-q{margin-top:10px;font-size:13px}.tcam-q summary{cursor:pointer;color:var(--ac2);font-weight:600}</style>';
	if ( $edita ) { $h .= tcd_cam_js(); }
	return $h . '</div>';
}
// Conversão no navegador: shapefile (shpjs reprojecta pelo .prj), KML e GPX (toGeoJSON), KMZ (JSZip), CSV (lat/lon).
function tcd_cam_js() {
	$cfg = array( 'aj' => admin_url( 'admin-ajax.php' ), 'n' => wp_create_nonce( 'tcd_cam' ), 'mb' => TCD_CAM_MB, 'libs' => array( 'shp' => 'https://cdn.jsdelivr.net/npm/shpjs@6.2.0/dist/shp.min.js', 'tg' => 'https://cdn.jsdelivr.net/npm/@tmcw/togeojson@7.1.3/dist/togeojson.umd.js', 'zip' => 'https://cdn.jsdelivr.net/npm/jszip@3.10.2/dist/jszip.min.js' ) );
	return '<script>(function(c){var F=document.getElementById("tcam-f"),B=document.getElementById("tcam-b"),R=document.getElementById("tcam-r"),N=document.getElementById("tcam-n"),G=document.getElementById("tcam-g");if(!F||!B)return;'
		. 'function lib(k,chk){return chk()?Promise.resolve():new Promise(function(ok,ko){var s=document.createElement("script");s.src=c.libs[k];s.onload=ok;s.onerror=function(){ko(new Error("Não foi possível carregar o conversor."));};document.head.appendChild(s);});}'
		. 'function csv(t){var ls=t.split(/\r?\n/).filter(function(l){return l.trim();});if(ls.length<2)throw new Error("CSV vazio.");var sep=(ls[0].match(/;/g)||[]).length>(ls[0].match(/,/g)||[]).length?";":",";var h=ls[0].split(sep).map(function(x){return x.replace(/^"|"$/g,"").trim();});var hl=h.map(function(x){return x.toLowerCase();});'
		. 'function col(rx){for(var i=0;i<hl.length;i++)if(rx.test(hl[i]))return i;return -1;}var ila=col(/^(lat|latitude|y|lat_wgs84|location_lat)$/),ilo=col(/^(lon|lng|long|longitude|x|lon_wgs84|location_long)$/);if(ila<0||ilo<0)throw new Error("O CSV precisa de colunas lat e lon (ou latitude e longitude).");'
		. 'var fs=[];for(var i=1;i<ls.length;i++){var v=ls[i].split(sep).map(function(x){return x.replace(/^"|"$/g,"").trim();});var la=parseFloat(v[ila].replace(",",".")),lo=parseFloat(v[ilo].replace(",","."));if(isNaN(la)||isNaN(lo))continue;var p={};for(var j=0;j<h.length;j++)if(j!==ila&&j!==ilo)p[h[j]]=v[j];fs.push({type:"Feature",geometry:{type:"Point",coordinates:[lo,la]},properties:p});}return {type:"FeatureCollection",features:fs};}'
		. 'function flat(g){if(Array.isArray(g))return {type:"FeatureCollection",features:[].concat.apply([],g.map(function(x){return x.features||[];}))};return g;}'
		. 'function converter(f){var n=f.name.toLowerCase(),fmt="";if(/\.(geojson|json)$/.test(n)){fmt="geojson";return f.text().then(function(t){return [JSON.parse(t),fmt];});}'
		. 'if(/\.csv$/.test(n)){fmt="csv";return f.text().then(function(t){return [csv(t),fmt];});}'
		. 'if(/\.kml$/.test(n)){fmt="kml";return lib("tg",function(){return !!window.toGeoJSON;}).then(function(){return f.text();}).then(function(t){return [toGeoJSON.kml(new DOMParser().parseFromString(t,"text/xml")),fmt];});}'
		. 'if(/\.gpx$/.test(n)){fmt="gpx";return lib("tg",function(){return !!window.toGeoJSON;}).then(function(){return f.text();}).then(function(t){return [toGeoJSON.gpx(new DOMParser().parseFromString(t,"text/xml")),fmt];});}'
		. 'if(/\.kmz$/.test(n)){fmt="kmz";return Promise.all([lib("tg",function(){return !!window.toGeoJSON;}),lib("zip",function(){return !!window.JSZip;})]).then(function(){return JSZip.loadAsync(f);}).then(function(z){var k=Object.keys(z.files).filter(function(x){return /\.kml$/i.test(x);})[0];if(!k)throw new Error("O KMZ não tem KML.");return z.files[k].async("string");}).then(function(t){return [toGeoJSON.kml(new DOMParser().parseFromString(t,"text/xml")),fmt];});}'
		. 'if(/\.(zip|shp)$/.test(n)){fmt="shapefile";return lib("shp",function(){return !!window.shp;}).then(function(){return f.arrayBuffer();}).then(function(b){return shp(b);}).then(function(g){return [flat(g),fmt];});}'
		. 'return Promise.reject(new Error("Formato não aceite. Use shapefile (zip), KML, KMZ, GeoJSON, GPX ou CSV."));}'
		. 'B.addEventListener("click",function(){var f=F.files&&F.files[0];if(!f){R.textContent="Escolha um ficheiro.";return;}if(f.size>c.mb*1048576){R.textContent="Ficheiro acima de "+c.mb+" MB.";return;}B.disabled=true;R.textContent="A ler o ficheiro…";'
		. 'converter(f).then(function(x){var gj=x[0];if(!gj||!gj.features)throw new Error("Não foi possível ler elementos geográficos.");R.textContent="A enviar "+gj.features.length+" elementos…";var fd=new FormData();fd.append("action","tcd_cam_carregar");fd.append("n",c.n);fd.append("nome",N.value);fd.append("grupo",G.value);fd.append("ficheiro",f.name);fd.append("formato",x[1]);fd.append("geojson",JSON.stringify(gj));return fetch(c.aj,{method:"POST",body:fd,credentials:"same-origin"}).then(function(r){return r.json();});})'
		. '.then(function(j){if(j&&j.success){R.textContent=j.data.m+" A página vai actualizar.";setTimeout(function(){location.href=location.pathname+"#camadas";location.reload();},1200);}else{R.textContent=(j&&j.data&&j.data.m)||"Não foi possível carregar.";B.disabled=false;}})'
		. '.catch(function(e){R.textContent=e&&e.message?e.message:"Não foi possível ler o ficheiro.";B.disabled=false;});});})(' . wp_json_encode( $cfg, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT ) . ');</script>';
}

// ---------- separador «Organização» no Atlas (assets/atlas/org.js), só para membros com sessão ----------
add_action( 'wp_enqueue_scripts', function () {
	if ( ! tcd_cam_on() || ! is_user_logged_in() || ! is_page( array( 14581, 'atlas' ) ) || ! tcd_org_de( wp_get_current_user() ) ) { return; }
	$f = WP_PLUGIN_DIR . '/terracrua-nucleo/assets/atlas/org.js'; if ( ! file_exists( $f ) ) { return; }
	wp_enqueue_script( 'tcd-cam-atlas-org', content_url( 'plugins/terracrua-nucleo/assets/atlas/org.js' ), array(), substr( md5_file( $f ), 0, 10 ), true );
}, 31 );
