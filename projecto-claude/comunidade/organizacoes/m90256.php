<?php
// Módulo 90256 · Dados sensíveis no IPR Atlas: generalização automática de coordenadas por grupo e por espécie
// (decisão do Nuno, 21/10/2026, 16h08: ninhos de abutre, tocas de lince, manadas e acordos com proprietários nunca saem
// com coordenadas exactas para quem não deve). Segue o guia GBIF de Arthur Chapman (2020), «Current best practices for
// generalizing sensitive species occurrence data»:
//  - Categorias: 0 sem restrição; 1 extrema (geometria retida, só a região: célula de 1 grau); 2 alta (0,1°, c. 10 km);
//    3 média (0,01°, c. 1 km); 4 baixa (0,001°, c. 100 m). Nunca se aleatoriza: pontos vão para o centro da célula da
//    grelha; linhas e polígonos são substituídos pela célula que contém o centróide. Campos retirados são trocados por
//    texto explicativo, nunca vazios. Em 1 a 3 retira-se também o texto de localidade (lugar, herdade, descrição, foto…)
//    e qualquer valor que pareça coordenada; em 1 ficam só espécie, datas, contagens e a região. Ao público (contexto
//    publico), qualquer registo com categoria > 0 sai só com espécie, datas, contagens, nome, regiao e campos Darwin Core.
//  - A categoria de cada registo é a mais restritiva entre a do grupo (meta sensiveis.grupos, ou cat do grupo, ou 3 se
//    sensível), a da camada (meta _tcd_cam cat, ou 3 se sensível) e a da espécie encontrada nas propriedades (chaves que
//    começam por sp, sci, scientific, especie, species, taxon, nomecient, nomecomum, comum, common, vernacular, incluindo
//    nomes DBF truncados; comparação sem acentos nem maiúsculas, por género e espécie, por abreviatura «L. pardinus» e
//    por nome comum).
//  - Lista de espécies gatilho: base ibérica (abaixo) mais alterações da organização (meta sensiveis da organização, m90253:
//    especies, grupos, revisao, por). Rever anualmente; o bloco avisa quando a revisão tem mais de 12 meses.
//  - Quem vê exacto: dono, gestor e quem está em «quem» da camada; os outros membros vêem generalizado. Contexto publico:
//    sempre generalizado e categoria no máximo 3 para tudo o que seja sensível. Contexto relatorio: exacto só para gestores.
//  - Aplica-se pelo filtro tcd_cam_geojson do m90254 (rest, exportar, publico, relatorio). O m90254 continua a esconder as
//    camadas sensíveis da lista a quem não está em «quem»; este módulo garante que o que sai do ficheiro vai generalizado.
//    A categoria mais restritiva de cada camada fica no meta (cat_max, calculada ao carregar e refeita quando a lista muda)
//    e serve para generalizar o bbox da lista (filtro tcd_cam_bbox) e para dispensar o filtro quando não é preciso
//    (filtro tcd_cam_precisa_filtro). Desligado (tcd_sen_off = 1) falha fechado: camadas sensíveis saem vazias a quem não
//    vê exacto, e a cache pública (m90261) é limpa quando a opção muda.
//  - Propriedades Darwin Core escritas nos registos generalizados: informationWithheld, dataGeneralizations,
//    coordinatePrecision (o m90258 lê-as ao exportar Darwin Core).
//  - Bloco «Dados sensíveis» na Oficina (só gestores): categoria por espécie e por grupo, data de revisão, teste por camada.
// Interruptor: tcd_sen_off = 1. Prefixo tcd_sen_. Depende do m90253 e do m90254. Nenhuma rota REST nova.
if ( ! defined( 'ABSPATH' ) ) { exit; }

function tcd_sen_on() { return '1' !== (string) get_option( 'tcd_sen_off', '' ) && function_exists( 'tcd_org_de' ) && function_exists( 'tcd_cam_dados' ); }
function tcd_sen_cats() { return array( 0 => 'Sem restrição', 1 => 'Extrema', 2 => 'Alta', 3 => 'Média', 4 => 'Baixa' ); }
function tcd_sen_passo( $cat ) { return array( 2 => 0.1, 3 => 0.01, 4 => 0.001 )[ (int) $cat ] ?? 0; }
function tcd_sen_texto_cat( $cat ) {
	$t = array( 0 => 'Sem restrição: coordenadas originais.', 1 => 'Extrema: localização retida, só se diz a região (célula de 1 grau, c. 100 km).', 2 => 'Alta: coordenadas arredondadas a 0,1 graus (c. 10 km).', 3 => 'Média: coordenadas arredondadas a 0,01 graus (c. 1 km).', 4 => 'Baixa: coordenadas arredondadas a 0,001 graus (c. 100 m).' );
	return $t[ max( 0, min( 4, (int) $cat ) ) ];
}
function tcd_sen_cat_ok( $v, $def = 0 ) { if ( null === $v || '' === $v || ! is_numeric( $v ) ) { return $def; } $v = (int) $v; return $v >= 0 && $v <= 4 ? $v : $def; }
// A mais restritiva entre várias categorias: a mais baixa diferente de zero (1 é extrema, 4 é baixa).
function tcd_sen_mais_restritiva( ...$cats ) { $r = 0; foreach ( $cats as $c ) { $c = (int) $c; if ( $c > 0 && ( 0 === $r || $c < $r ) ) { $r = $c; } } return $r; }
// Sem acentos nem maiúsculas, hífens e pontuação viram espaço; só letras, números, espaços e parênteses.
function tcd_sen_norm( $s ) {
	$s = mb_strtolower( trim( (string) $s ) );
	$s = strtr( $s, array( 'á' => 'a', 'à' => 'a', 'â' => 'a', 'ã' => 'a', 'ä' => 'a', 'é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e', 'í' => 'i', 'ì' => 'i', 'î' => 'i', 'ï' => 'i', 'ó' => 'o', 'ò' => 'o', 'ô' => 'o', 'õ' => 'o', 'ö' => 'o', 'ú' => 'u', 'ù' => 'u', 'û' => 'u', 'ü' => 'u', 'ç' => 'c', 'ñ' => 'n', 'ý' => 'y' ) );
	return trim( preg_replace( '/\s+/', ' ', preg_replace( '/[^a-z0-9 ()]/', ' ', $s ) ) );
}
function tcd_sen_chave( $k ) { return preg_replace( '/[^a-z0-9]/', '', tcd_sen_norm( $k ) ); } // chave de propriedade compactada

// ---------- lista base ibérica (rever anualmente) ----------
// nome científico => [nome comum PT, categoria, nota]. Não se acrescenta sem fonte; a organização ajusta no bloco.
function tcd_sen_base() {
	return array(
		'Lynx pardinus' => array( 'Lince-ibérico', 2, 'Tocas e territórios de reprodução.' ),
		'Canis lupus signatus' => array( 'Lobo-ibérico', 3, 'Alcateias e locais de reprodução.' ),
		'Ursus arctos' => array( 'Urso-pardo', 2, 'Tocas de hibernação e fêmeas com crias.' ),
		'Aegypius monachus' => array( 'Abutre-preto', 2, 'Ninhos.' ),
		'Gypaetus barbatus' => array( 'Quebra-ossos', 2, 'Ninhos.' ),
		'Neophron percnopterus' => array( 'Abutre-do-egipto', 3, 'Ninhos.' ),
		'Gyps fulvus' => array( 'Grifo', 4, 'Colónias.' ),
		'Aquila chrysaetos' => array( 'Águia-real', 3, 'Ninhos.' ),
		'Aquila adalberti' => array( 'Águia-imperial-ibérica', 2, 'Ninhos.' ),
		'Aquila fasciata' => array( 'Águia-de-bonelli', 3, 'Ninhos.' ),
		'Ciconia nigra' => array( 'Cegonha-preta', 3, 'Ninhos.' ),
		'Bison bonasus' => array( 'Bisonte-europeu', 4, 'Manadas.' ),
		'Milvus milvus' => array( 'Milhafre-real', 4, 'Ninhos e dormitórios.' ),
		'Falco naumanni' => array( 'Peneireiro-das-torres', 4, 'Colónias.' ),
		'Tetrax tetrax' => array( 'Sisão', 4, 'Arenas de exibição.' ),
		'Otis tarda' => array( 'Abetarda', 3, 'Arenas e ninhos.' ),
		'Emys orbicularis' => array( 'Cágado-de-carapaça-estriada', 4, 'Charcos de reprodução.' ),
		'Mauremys leprosa' => array( 'Cágado-mediterrânico', 0, 'Sem restrição por omissão (exemplo de espécie comum).' ),
		'Chioglossa lusitanica' => array( 'Salamandra-lusitânica', 3, 'Linhas de água de reprodução.' ),
		'Margaritifera margaritifera' => array( 'Mexilhão-de-rio', 2, 'Bancos de mexilhão.' ),
		'Galemys pyrenaicus' => array( 'Toupeira-de-água', 3, 'Troços de rio.' ),
		'Microtus cabrerae' => array( 'Rato-de-cabrera', 4, 'Colónias.' ),
		'Rhinolophus' => array( 'Morcegos-de-ferradura (todos)', 3, 'Abrigos; o género inteiro.' ),
		'Equus ferus przewalskii' => array( 'Cavalo-de-przewalski', 4, 'Manadas.' ),
		'Tauros' => array( 'Tauros (bovino de rewilding)', 4, 'Manadas: valor comercial e risco de roubo.' ),
		'Sorraia' => array( 'Cavalo Sorraia', 4, 'Manadas: valor comercial e risco de roubo.' ),
	);
}
// Meta sensiveis da organização: especies (nome => cat), grupos (id => cat), revisao (Y-m-d), por (uid).
function tcd_sen_meta( $org ) { $d = tcd_org_dados( $org ); $s = $d && isset( $d['sensiveis'] ) && is_array( $d['sensiveis'] ) ? $d['sensiveis'] : array(); return array_merge( array( 'especies' => array(), 'grupos' => array(), 'revisao' => '', 'por' => 0 ), $s ); }
// Lista de espécies gatilho da organização: base mais alterações. Chave = nome científico normalizado; cada entrada:
// nome, comum, cat, nota, origem (base|org), base (cat de origem ou null), tok (palavras do nome), alias (nome comum normalizado, sem parênteses).
function tcd_sen_entrada( $nome, $comum, $cat, $nota, $origem, $base ) {
	$k = tcd_sen_norm( $nome ); $al = tcd_sen_norm( preg_replace( '/\(.*?\)/', ' ', (string) $comum ) );
	return array( 'nome' => $nome, 'comum' => $comum, 'cat' => (int) $cat, 'nota' => $nota, 'origem' => $origem, 'base' => $base, 'tok' => explode( ' ', $k ), 'alias' => '' !== $al && $al !== $k ? $al : '' );
}
function tcd_sen_especies( $org ) {
	$out = array();
	foreach ( tcd_sen_base() as $nome => $x ) { $out[ tcd_sen_norm( $nome ) ] = tcd_sen_entrada( $nome, $x[0], $x[1], $x[2] . ' Rever anualmente.', 'base', (int) $x[1] ); }
	if ( ! $org ) { return $out; }
	foreach ( (array) tcd_sen_meta( $org )['especies'] as $nome => $cat ) {
		$k = tcd_sen_norm( $nome ); if ( '' === $k ) { continue; }
		if ( isset( $out[ $k ] ) ) { $out[ $k ]['cat'] = tcd_sen_cat_ok( $cat, $out[ $k ]['cat'] ); $out[ $k ]['origem'] = 'org'; }
		else { $out[ $k ] = tcd_sen_entrada( mb_substr( sanitize_text_field( (string) $nome ), 0, 60 ), '', tcd_sen_cat_ok( $cat ), 'Acrescentada pela organização. Rever anualmente.', 'org', null ); }
	}
	return $out;
}
// Categoria de um valor de propriedade contra a lista. Chave de uma palavra (género): casa com qualquer palavra do valor.
// Duas ou três palavras: casam no início do valor (tantas quantas a chave tem), ou com o género abreviado («L. pardinus»),
// ou como frase dentro do valor; o nome comum casa como frase.
function tcd_sen_cat_especie( $valor, $lista ) {
	$v = tcd_sen_norm( $valor ); if ( '' === $v ) { return 0; } $tok = explode( ' ', $v ); $vf = ' ' . $v . ' '; $cat = 0;
	foreach ( $lista as $k => $x ) {
		if ( empty( $x['cat'] ) ) { continue; } $kt = $x['tok'] ?? explode( ' ', $k ); $n = count( $kt ); $bate = false;
		if ( 1 === $n ) { $bate = in_array( $kt[0], $tok, true ); }
		else {
			if ( count( $tok ) >= $n ) { $bate = true; for ( $i = 0; $i < $n; $i++ ) { if ( $tok[ $i ] !== $kt[ $i ] ) { $bate = false; break; } } if ( ! $bate && 1 === strlen( $tok[0] ) && $tok[0] === $kt[0][0] ) { $bate = true; for ( $i = 1; $i < $n; $i++ ) { if ( $tok[ $i ] !== $kt[ $i ] ) { $bate = false; break; } } } }
			if ( ! $bate ) { $bate = false !== strpos( $vf, ' ' . $k . ' ' ); }
		}
		if ( ! $bate && ! empty( $x['alias'] ) ) { $bate = false !== strpos( $vf, ' ' . $x['alias'] . ' ' ); }
		if ( $bate ) { $cat = tcd_sen_mais_restritiva( $cat, $x['cat'] ); if ( 1 === $cat ) { break; } }
	}
	return $cat;
}
function tcd_sen_chave_especie( $k ) { return (bool) preg_match( '/^(sp|spp|sci|scientific|especie|species|taxon|nomecient|nomecomum|comum|common|vernacular)/', tcd_sen_chave( $k ) ); }
function tcd_sen_chaves_especie() { return array( 'scientificname', 'especie', 'species', 'taxon', 'nomecientifico', 'sp' ); } // compatibilidade; a procura é por prefixo (tcd_sen_chave_especie)
function tcd_sen_cat_grupo( $org, $grupo ) {
	if ( is_string( $grupo ) ) { $g = tcd_cam_grupos( $org ); $grupo = $g[ $grupo ] ?? array(); }
	$grupo = (array) $grupo; $m = tcd_sen_meta( $org );
	if ( ! empty( $grupo['id'] ) && isset( $m['grupos'][ $grupo['id'] ] ) && '' !== (string) $m['grupos'][ $grupo['id'] ] ) { return tcd_sen_cat_ok( $m['grupos'][ $grupo['id'] ] ); }
	if ( isset( $grupo['cat'] ) && '' !== (string) $grupo['cat'] ) { return tcd_sen_cat_ok( $grupo['cat'] ); }
	return empty( $grupo['sensivel'] ) ? 0 : 3;
}
function tcd_sen_cat_camada( $c ) { $c = (array) $c; if ( isset( $c['cat'] ) && '' !== (string) $c['cat'] ) { return tcd_sen_cat_ok( $c['cat'] ); } return empty( $c['sensivel'] ) ? 0 : 3; }
// Categoria base de uma camada (grupo e camada, sem olhar aos registos). $grupo: id ou array; $c: meta da camada.
function tcd_sen_cat_base( $org, $grupo = null, $c = null ) { return tcd_sen_mais_restritiva( null === $grupo ? 0 : tcd_sen_cat_grupo( $org, $grupo ), null === $c ? 0 : tcd_sen_cat_camada( $c ) ); }
// Categoria das propriedades de um registo a partir de uma categoria base já calculada (ciclos: evita refazer grupo e meta).
function tcd_sen_cat_props( $props, $lista, $cat_base = 0 ) {
	$cat = (int) $cat_base; if ( 1 === $cat ) { return 1; }
	foreach ( (array) $props as $k => $v ) {
		if ( ! is_scalar( $v ) || ! tcd_sen_chave_especie( $k ) ) { continue; }
		$cat = tcd_sen_mais_restritiva( $cat, tcd_sen_cat_especie( $v, $lista ) ); if ( 1 === $cat ) { return 1; }
	}
	return $cat;
}
// Categoria de um registo: a mais restritiva entre grupo, camada e espécie nas propriedades. $lista evita recalcular a lista em ciclos.
function tcd_sen_cat_registo( $props, $org, $grupo = null, $camada = null, $lista = null ) { return tcd_sen_cat_props( $props, null === $lista ? tcd_sen_especies( $org ) : $lista, tcd_sen_cat_base( $org, $grupo, $camada ) ); }

// ---------- generalização (GBIF, Chapman 2020) ----------
function tcd_sen_centro( $x, $s ) { $dec = (int) round( -log10( $s ) ) + 1; return round( floor( ( (float) $x + 1e-9 ) / $s ) * $s + $s / 2, $dec ); }
function tcd_sen_celula_de( $x, $y, $s ) { $dec = (int) round( -log10( $s ) ); $x0 = round( floor( ( (float) $x + 1e-9 ) / $s ) * $s, $dec ); $y0 = round( floor( ( (float) $y + 1e-9 ) / $s ) * $s, $dec ); $x1 = round( $x0 + $s, $dec ); $y1 = round( $y0 + $s, $dec ); return array( 'type' => 'Polygon', 'coordinates' => array( array( array( $x0, $y0 ), array( $x1, $y0 ), array( $x1, $y1 ), array( $x0, $y1 ), array( $x0, $y0 ) ) ) ); }
function tcd_sen_vertices( $g, &$v ) { // todos os vértices de uma geometria (anéis sem o vértice de fecho)
	$t = $g['type'] ?? ''; $c = $g['coordinates'] ?? array();
	if ( 'Point' === $t ) { $v[] = $c; }
	elseif ( in_array( $t, array( 'MultiPoint', 'LineString' ), true ) ) { foreach ( (array) $c as $p ) { $v[] = $p; } }
	elseif ( in_array( $t, array( 'MultiLineString', 'Polygon' ), true ) ) { foreach ( (array) $c as $l ) { $l = (array) $l; $n = count( $l ); if ( 'Polygon' === $t && $n > 1 && $l[0] == $l[ $n - 1 ] ) { array_pop( $l ); } foreach ( $l as $p ) { $v[] = $p; } } }
	elseif ( 'MultiPolygon' === $t ) { foreach ( (array) $c as $pg ) { tcd_sen_vertices( array( 'type' => 'Polygon', 'coordinates' => $pg ), $v ); } }
	elseif ( 'GeometryCollection' === $t ) { foreach ( (array) ( $g['geometries'] ?? array() ) as $gg ) { tcd_sen_vertices( (array) $gg, $v ); } }
}
function tcd_sen_geometria( $g, $cat ) {
	$s = tcd_sen_passo( $cat ); if ( ! is_array( $g ) || empty( $g['type'] ) ) { return null; } if ( ! $s ) { return $g; } $t = $g['type'];
	if ( 'Point' === $t ) { $c = $g['coordinates'] ?? array(); if ( count( $c ) < 2 ) { return null; } return array( 'type' => 'Point', 'coordinates' => array( tcd_sen_centro( $c[0], $s ), tcd_sen_centro( $c[1], $s ) ) ); }
	if ( 'MultiPoint' === $t ) { $out = array(); $visto = array(); foreach ( (array) ( $g['coordinates'] ?? array() ) as $p ) { if ( count( (array) $p ) < 2 ) { continue; } $q = array( tcd_sen_centro( $p[0], $s ), tcd_sen_centro( $p[1], $s ) ); $k = $q[0] . ',' . $q[1]; if ( isset( $visto[ $k ] ) ) { continue; } $visto[ $k ] = 1; $out[] = $q; } if ( ! $out ) { return null; } return 1 === count( $out ) ? array( 'type' => 'Point', 'coordinates' => $out[0] ) : array( 'type' => 'MultiPoint', 'coordinates' => $out ); }
	$v = array(); tcd_sen_vertices( $g, $v ); $v = array_values( array_filter( $v, function ( $p ) { return is_array( $p ) && count( $p ) >= 2 && is_numeric( $p[0] ) && is_numeric( $p[1] ); } ) ); if ( ! $v ) { return null; }
	$cx = 0.0; $cy = 0.0; foreach ( $v as $p ) { $cx += (float) $p[0]; $cy += (float) $p[1]; } $n = count( $v );
	return tcd_sen_celula_de( $cx / $n, $cy / $n, $s );
}
// Chaves que parecem coordenadas, chaves de localidade (texto que situa o registo) e valores que parecem coordenadas.
function tcd_sen_chave_coordenada( $k ) { $k = preg_replace( '/[^a-z0-9_]/', '', str_replace( ' ', '_', tcd_sen_norm( $k ) ) ); return (bool) preg_match( '/^(lat|lon|lng|long|latitude|longitude|[xy]\d*|easting|northing|norte|este|utm.*|coord.*|gps.*|geom.*|the_geom|shape|posic.*|position|location|localizacao|ponto|point|mgrs|plus_?code|w3w|dms|.*_(lat|lon|lng|long|latitude|longitude|x|y|utm|gps)|(lat|lon|lng|long|latitude|longitude|utm|gps)_?.*|decimallatitude|decimallongitude|geometria|geometry|wkt)$/', $k ); }
function tcd_sen_chave_local( $k ) { return (bool) preg_match( '/^(local|lugar|sitio|site|place|herdade|quinta|monte|propried|propriet|freguesia|concelho|morada|address|toponim|descr|obs|nota|coment|remark|foto|photo|imagem|url|verbatim|habitat)/', tcd_sen_chave( $k ) ); }
function tcd_sen_valor_coordenada( $v ) {
	if ( ! is_string( $v ) || strlen( $v ) < 7 ) { return false; }
	return (bool) preg_match( '/(-?\d{1,3}[.,]\d{3,}\s*[,;\/ ]\s*-?\d{1,3}[.,]\d{3,})|\b(point|polygon|linestring|multipoint)\s*\(|\b\d{6,7}([.,]\d+)?\s*[,; ]\s*\d{6,7}([.,]\d+)?\b|\d{1,3}\s*°\s*\d|\b29\s*[ST]\s*\d{5,7}\b|\b[a-z]{3}\.[a-z]{3}\.[a-z]{3}\b/iu', $v );
}
// Chaves que ficam em categoria 1 e ao público: espécie, datas e contagens (mais nome, só ao público).
function tcd_sen_chave_fica( $k ) { $kn = tcd_sen_chave( $k ); return tcd_sen_chave_especie( $kn ) || (bool) preg_match( '/^(data|date|ano|year|eventdate|n|numero|count|individuos|adultos|juvenis|crias)$/', $kn ); }
// Lista branca ao público (decisão do Nuno, 21/10): num registo com categoria > 0 ficam só espécie, datas, contagens, nome,
// regiao e os campos Darwin Core; proprietários, contactos e texto livre nunca saem. Um único informationWithheld resume.
function tcd_sen_publico( $f ) {
	$fica = array(); $fora = array(); $iw = (string) ( $f['properties']['informationWithheld'] ?? '' );
	foreach ( (array) ( $f['properties'] ?? array() ) as $k => $v ) { if ( in_array( $k, array( 'nome', 'regiao', 'dataGeneralizations', 'coordinatePrecision' ), true ) || tcd_sen_chave_fica( $k ) ) { $fica[ $k ] = $v; } elseif ( 'informationWithheld' !== $k ) { $fora[] = (string) $k; } }
	if ( $fora || $iw ) { $fica['informationWithheld'] = 'Saída pública: ficam só espécie, datas, contagens e nome' . ( $fora ? '; ' . count( $fora ) . ' campo' . ( 1 === count( $fora ) ? '' : 's' ) . ' retirado' . ( 1 === count( $fora ) ? '' : 's' ) . ' (' . implode( ', ', array_slice( $fora, 0, 30 ) ) . ')' : '' ) . ( $iw ? '. ' . $iw : '' ); }
	$f['properties'] = $fica; return $f;
}
// Um registo (Feature) generalizado para a categoria. Cat 0 devolve o registo tal como está; $publico aplica a lista branca.
function tcd_sen_registo( $f, $cat, $publico = false ) {
	$cat = max( 0, min( 4, (int) $cat ) ); if ( 0 === $cat ) { return $f; } if ( $publico ) { return tcd_sen_publico( tcd_sen_registo( $f, $cat, false ) ); }
	$props = array(); $retirados = array();
	foreach ( (array) ( $f['properties'] ?? array() ) as $k => $v ) {
		if ( in_array( $k, array( 'informationWithheld', 'dataGeneralizations', 'coordinatePrecision', 'regiao' ), true ) ) { continue; }
		if ( tcd_sen_chave_coordenada( $k ) || tcd_sen_valor_coordenada( $v ) ) { $retirados[] = (string) $k; $props[ $k ] = 'retirado: coordenada exacta (dados sensíveis, categoria ' . $cat . ')'; continue; }
		if ( $cat <= 3 && tcd_sen_chave_local( $k ) ) { $retirados[] = (string) $k; $props[ $k ] = 'retirado: texto de localidade (dados sensíveis, categoria ' . $cat . ')'; continue; }
		$props[ $k ] = $v;
	}
	if ( 1 === $cat ) { // lista fechada: só espécie, datas e contagens; região = célula de 1 grau (c. 100 km)
		$fica = array(); foreach ( $props as $k => $v ) { if ( tcd_sen_chave_fica( $k ) ) { $fica[ $k ] = $v; } else { $retirados[] = (string) $k; } }
		$v = array(); tcd_sen_vertices( (array) ( $f['geometry'] ?? array() ), $v ); $p = $v[0] ?? null;
		if ( is_array( $p ) && isset( $p[0], $p[1] ) && is_numeric( $p[0] ) && is_numeric( $p[1] ) ) { $fica['regiao'] = 'célula de 1 grau: ' . floor( (float) $p[0] ) . ' a ' . ( floor( (float) $p[0] ) + 1 ) . ' E, ' . floor( (float) $p[1] ) . ' a ' . ( floor( (float) $p[1] ) + 1 ) . ' N'; }
		$retirados = array_values( array_unique( $retirados ) );
		$fica['informationWithheld'] = 'Localização retida: espécie de categoria 1' . ( $retirados ? '; campos retirados: ' . implode( ', ', array_slice( $retirados, 0, 30 ) ) : '' );
		$fica['dataGeneralizations'] = 'Geometria retirada; presença só ao nível da região (célula de 1 grau), segundo as recomendações do GBIF (Chapman 2020)';
		return array( 'type' => 'Feature', 'geometry' => null, 'properties' => $fica );
	}
	$s = tcd_sen_passo( $cat ); $km = array( 2 => 'c. 10 km', 3 => 'c. 1 km', 4 => 'c. 100 m' )[ $cat ];
	$props['dataGeneralizations'] = 'Coordenadas generalizadas a ' . str_replace( '.', ',', (string) $s ) . ' graus (' . $km . ') segundo as recomendações do GBIF (Chapman 2020)';
	$props['coordinatePrecision'] = $s;
	if ( $retirados ) { $props['informationWithheld'] = 'Campos de coordenadas exactas ou de localidade retirados: ' . implode( ', ', array_slice( $retirados, 0, 30 ) ); }
	return array( 'type' => 'Feature', 'geometry' => tcd_sen_geometria( $f['geometry'] ?? null, $cat ), 'properties' => $props );
}
// Generalizar um GeoJSON inteiro (FeatureCollection ou Feature) para uma categoria.
function tcd_sen_generalizar( $gj, $cat, $publico = false ) {
	if ( ! is_array( $gj ) ) { return $gj; }
	if ( 'Feature' === ( $gj['type'] ?? '' ) ) { return tcd_sen_registo( $gj, $cat, $publico ); }
	if ( 'FeatureCollection' === ( $gj['type'] ?? '' ) && isset( $gj['features'] ) && is_array( $gj['features'] ) ) { foreach ( $gj['features'] as $i => $f ) { $gj['features'][ $i ] = tcd_sen_registo( (array) $f, $cat, $publico ); } }
	return $gj;
}
// Quem vê exacto: dono, gestor e quem está em «quem» (relatorio: só dono e gestor). Publico: nunca.
function tcd_sen_exacto( $c, $uid, $contexto ) {
	if ( 'publico' === $contexto || ! $uid ) { return false; }
	$u = get_userdata( (int) $uid ); if ( ! $u ) { return false; } $org = (int) $c['org']; if ( tcd_org_de( $u ) !== $org ) { return false; }
	if ( in_array( tcd_org_papel( $u, $org ), array( 'dono', 'gestor' ), true ) ) { return true; }
	return 'relatorio' !== $contexto && in_array( (int) $uid, array_map( 'intval', (array) ( $c['quem'] ?? array() ) ), true );
}
// Categoria mais restritiva possível de uma camada sem abrir o ficheiro: cat_max guardado (3 se não existe) com grupo e camada actuais.
function tcd_sen_cat_max( $c ) { $org = (int) ( $c['org'] ?? 0 ); $g = $org ? tcd_cam_grupos( $org ) : array(); return tcd_sen_mais_restritiva( isset( $c['cat_max'] ) && is_numeric( $c['cat_max'] ) ? (int) $c['cat_max'] : 3, tcd_sen_cat_base( $org, $g[ $c['grupo'] ?? '' ] ?? array(), $c ) ); }
// O GeoJSON de uma camada preparado para quem o vai ver: exacto ou generalizado registo a registo (no lugar, sem segunda lista).
function tcd_sen_para( $gj, $c, $uid, $contexto = 'rest' ) {
	if ( ! is_array( $gj ) || ! is_array( $c ) || empty( $c['org'] ) || ! isset( $gj['features'] ) || ! is_array( $gj['features'] ) || tcd_sen_exacto( $c, $uid, $contexto ) ) { return $gj; }
	$org = (int) $c['org']; $g = tcd_cam_grupos( $org ); $base = tcd_sen_cat_base( $org, $g[ $c['grupo'] ?? '' ] ?? array(), $c ); $lista = tcd_sen_especies( $org ); $pub = 'publico' === $contexto; $sens = ! empty( $c['sensivel'] );
	foreach ( $gj['features'] as $i => $f ) {
		$cat = tcd_sen_cat_props( (array) ( $f['properties'] ?? array() ), $lista, $base );
		if ( $pub && ( $cat > 3 || ( 0 === $cat && $sens ) ) ) { $cat = 3; }
		$gj['features'][ $i ] = tcd_sen_registo( (array) $f, $cat, $pub );
	}
	return $gj;
}
function tcd_sen_camada_sensivel( $c ) { $g = function_exists( 'tcd_cam_grupos' ) ? tcd_cam_grupos( (int) ( $c['org'] ?? 0 ) ) : array(); $gx = $g[ $c['grupo'] ?? '' ] ?? array(); return ! empty( $c['sensivel'] ) || ! empty( $gx['sensivel'] ) || ! empty( $gx['cat'] ) || ( isset( $c['cat_max'] ) && (int) $c['cat_max'] > 0 ); }
// Filtro do m90254. Desligado, falha fechado: camadas sensíveis saem vazias a quem não vê exacto.
add_filter( 'tcd_cam_geojson', function ( $gj, $c, $uid, $contexto ) {
	if ( tcd_sen_on() ) { return tcd_sen_para( $gj, $c, (int) $uid, (string) $contexto ); }
	if ( is_array( $c ) && tcd_sen_camada_sensivel( $c ) && ( 'publico' === $contexto || ! $uid || ! function_exists( 'tcd_org_de' ) || ! tcd_sen_exacto( $c, (int) $uid, (string) $contexto ) ) ) { return array( 'type' => 'FeatureCollection', 'features' => array(), 'aviso' => 'Dados sensíveis retidos: módulo de generalização desligado.' ); }
	return $gj;
}, 10, 4 );
// O m90254 pergunta se este leitor precisa do filtro antes de descodificar o ficheiro: não, se vê exacto ou se a camada não tem nada sensível (cat_max guardado).
add_filter( 'tcd_cam_precisa_filtro', function ( $p, $c, $uid, $ctx ) { if ( $p || ! is_array( $c ) ) { return $p; } if ( ! tcd_sen_on() ) { return tcd_sen_camada_sensivel( $c ); } return ! tcd_sen_exacto( $c, (int) $uid, (string) $ctx ) && 0 !== tcd_sen_cat_max( $c ); }, 10, 4 );
// bbox da lista para quem não vê exacto: alargado à grelha da categoria mais restritiva da camada; categoria 1 sem bbox.
function tcd_sen_bbox( $bb, $c, $uid, $ctx = 'rest' ) {
	if ( ! is_array( $bb ) || count( $bb ) < 4 || ! is_array( $c ) ) { return $bb; }
	if ( ! tcd_sen_on() ) { return tcd_sen_camada_sensivel( $c ) && ! tcd_sen_exacto( $c, (int) $uid, (string) $ctx ) ? null : $bb; }
	if ( tcd_sen_exacto( $c, (int) $uid, (string) $ctx ) ) { return $bb; }
	$cat = tcd_sen_cat_max( $c ); if ( 'publico' === $ctx && $cat > 3 ) { $cat = 3; } if ( 1 === $cat ) { return null; } $s = tcd_sen_passo( $cat ); if ( ! $s ) { return $bb; }
	$dec = (int) round( -log10( $s ) ); return array( round( floor( (float) $bb[0] / $s ) * $s, $dec ), round( floor( (float) $bb[1] / $s ) * $s, $dec ), round( ceil( (float) $bb[2] / $s ) * $s, $dec ), round( ceil( (float) $bb[3] / $s ) * $s, $dec ) );
}
add_filter( 'tcd_cam_bbox', 'tcd_sen_bbox', 10, 4 );
// Contagem por categoria de um GeoJSON já descodificado; e de uma camada pelo ficheiro (teste no bloco e cat_max; só gestores chamam).
function tcd_sen_contar_gj( $gj, $c ) {
	$n = array( 0 => 0, 1 => 0, 2 => 0, 3 => 0, 4 => 0 ); if ( ! is_array( $gj ) || ! is_array( $c ) || empty( $c['org'] ) ) { return $n; }
	$org = (int) $c['org']; $g = tcd_cam_grupos( $org ); $base = tcd_sen_cat_base( $org, $g[ $c['grupo'] ?? '' ] ?? array(), $c ); $lista = tcd_sen_especies( $org );
	foreach ( (array) ( $gj['features'] ?? array() ) as $x ) { $n[ tcd_sen_cat_props( (array) ( $x['properties'] ?? array() ), $lista, $base ) ]++; }
	return $n;
}
function tcd_sen_contar( $c ) { $f = tcd_cam_ficheiro( $c ); if ( ! is_readable( $f ) ) { return array( 0 => 0, 1 => 0, 2 => 0, 3 => 0, 4 => 0 ); } return tcd_sen_contar_gj( json_decode( file_get_contents( $f ), true ), $c ); }
function tcd_sen_cat_max_de( $n ) { $r = 0; foreach ( (array) $n as $k => $q ) { if ( $q && $k > 0 ) { $r = tcd_sen_mais_restritiva( $r, $k ); } } return $r; }
// cat_max no meta da camada: ao carregar (a partir do GeoJSON já em memória, 4.º argumento do m90254) e ao rever a lista.
add_action( 'tcd_cam_carregada', function ( $id, $c, $u = null, $gj = null ) {
	if ( ! tcd_sen_on() || ! is_array( $c ) ) { return; } $c = tcd_cam_dados( $id ) ?: $c;
	$c['cat_max'] = tcd_sen_cat_max_de( is_array( $gj ) ? tcd_sen_contar_gj( $gj, $c ) : tcd_sen_contar( $c ) ); unset( $c['id'], $c['nome'] ); update_post_meta( (int) $id, '_tcd_cam', $c );
}, 20, 4 );
function tcd_sen_refazer_cat_max( $org ) { $n = 0; foreach ( tcd_cam_lista( $org, null, true ) as $c ) { $c['cat_max'] = tcd_sen_cat_max_de( tcd_sen_contar( $c ) ); $id = (int) $c['id']; unset( $c['id'], $c['nome'] ); update_post_meta( $id, '_tcd_cam', $c ); $n++; } return $n; }
// Interruptor mudou: limpar a cache pública (m90261) de todas as organizações.
function tcd_sen_limpar_publico() { if ( function_exists( 'tcd_pub_limpar_tudo' ) ) { tcd_pub_limpar_tudo(); return; } if ( ! function_exists( 'tcd_pub_limpar_cache' ) ) { return; } $s = array(); if ( function_exists( 'tcd_pub_cfg' ) ) { foreach ( get_posts( array( 'post_type' => 'tcd_org', 'post_status' => 'any', 'numberposts' => 500, 'fields' => 'ids' ) ) as $id ) { $d = tcd_org_dados( $id ); if ( $d ) { $s[] = (string) ( tcd_pub_cfg( $d )['slug'] ?? '' ); } } } tcd_pub_limpar_cache( array_values( array_filter( array_unique( $s ) ) ) ); }
add_action( 'update_option_tcd_sen_off', 'tcd_sen_limpar_publico' ); add_action( 'add_option_tcd_sen_off', 'tcd_sen_limpar_publico' );
// Aviso de revisão: vazio se a lista foi revista há menos de 12 meses.
function tcd_sen_aviso_revisao( $org ) {
	$r = (string) tcd_sen_meta( $org )['revisao']; $t = $r ? strtotime( $r ) : 0;
	if ( ! $t ) { return 'A lista de espécies sensíveis ainda não foi revista por esta organização. Confirme as categorias e guarde: fica registada a data de revisão.'; }
	return $t < time() - 365 * DAY_IN_SECONDS ? 'A lista de espécies sensíveis foi revista a ' . wp_date( 'j/n/Y', $t ) . ', há mais de 12 meses. O GBIF recomenda rever as categorias todos os anos.' : '';
}

// ---------- guardar (admin-post, só gestores, organização activa) ----------
add_action( 'admin_post_tcd_sen_acao', function () {
	check_admin_referer( 'tcd_sen' );
	$u = wp_get_current_user(); $org = tcd_org_de( $u );
	if ( ! tcd_sen_on() || ! $org || ! tcd_org_pode( $u, 'gerir', $org ) ) { wp_die( 'Sem acesso.' ); }
	$k = 'tcd_sen_g_' . $u->ID; $n = (int) get_transient( $k ); if ( $n >= 30 ) { wp_die( 'Muitas alterações numa hora. Tente mais tarde.' ); } set_transient( $k, $n + 1, HOUR_IN_SECONDS );
	$op = sanitize_key( $_POST['op'] ?? '' ); $msg = ''; // phpcs:ignore
	if ( 'guardar' === $op ) {
		$d = tcd_org_dados( $org ); $basen = array(); foreach ( tcd_sen_base() as $nome => $x ) { $basen[ tcd_sen_norm( $nome ) ] = array( $nome, (int) $x[1] ); }
		$esp = array(); $pares = array(); $i = 0;
		foreach ( (array) ( $_POST['esp'] ?? array() ) as $nome => $cat ) { if ( $i++ < 300 ) { $pares[] = array( $nome, $cat ); } } // phpcs:ignore
		$pares[] = array( wp_unslash( $_POST['nova_nome'] ?? '' ), $_POST['nova_cat'] ?? '' ); // phpcs:ignore
		foreach ( $pares as $p ) { // só se guarda o que difere da base; o que a base não tem entra como da organização; valores não numéricos são ignorados
			$nome = mb_substr( sanitize_text_field( (string) $p[0] ), 0, 60 ); $kn = tcd_sen_norm( $nome ); if ( '' === $kn || ! preg_match( '/^[a-z][a-z ()]*$/', $kn ) ) { continue; }
			$cat = tcd_sen_cat_ok( $p[1], -1 ); if ( $cat < 0 ) { continue; }
			if ( isset( $basen[ $kn ] ) ) { if ( $cat !== $basen[ $kn ][1] ) { $esp[ $basen[ $kn ][0] ] = $cat; } } else { $esp[ $nome ] = $cat; }
		}
		$grp = array(); $g = tcd_cam_grupos( $org );
		foreach ( (array) ( $_POST['grp'] ?? array() ) as $gid => $cat ) { $gid = sanitize_key( $gid ); if ( ! isset( $g[ $gid ] ) || ! is_numeric( $cat ) ) { continue; } $grp[ $gid ] = tcd_sen_cat_ok( $cat ); } // phpcs:ignore
		$d['sensiveis'] = array( 'especies' => $esp, 'grupos' => $grp, 'revisao' => wp_date( 'Y-m-d' ), 'por' => (int) $u->ID ); tcd_org_guardar( $org, $d );
		$nc = tcd_sen_refazer_cat_max( $org ); tcd_sen_limpar_publico();
		$msg = 'Categorias guardadas. Data de revisão: ' . wp_date( 'j/n/Y' ) . '. ' . $nc . ' camada' . ( 1 === $nc ? '' : 's' ) . ' reclassificada' . ( 1 === $nc ? '' : 's' ) . '.';
		if ( function_exists( 'tcd_tg_enviar' ) ) { tcd_tg_enviar( 'Organização ' . esc_html( $d['nome'] ) . ': ' . esc_html( $u->display_name ) . ' reviu a lista de espécies sensíveis (' . count( $esp ) . ' alterações, ' . count( $grp ) . ' grupos).' ); }
	}
	wp_safe_redirect( add_query_arg( 'sen_msg', rawurlencode( $msg ), home_url( '/oficina/' ) ) . '#sensiveis' ); if ( ! defined( 'TCD_TESTE' ) ) { exit; }
} );

// ---------- bloco «Dados sensíveis» na Oficina (só gestores, a seguir a «camadas») ----------
add_filter( 'tcd_of_blocos', function ( $b ) {
	$u = wp_get_current_user(); $org = tcd_sen_on() ? tcd_org_de( $u ) : 0; if ( ! $org || ! in_array( tcd_org_papel( $u, $org ), array( 'dono', 'gestor' ), true ) ) { return $b; }
	$bl = array( 't' => 'Dados sensíveis', 'k' => 'Dados', 'f' => 'tcd_sen_bloco', 'w' => 1, 'cache' => 0 ); $novo = array();
	foreach ( $b as $k => $v ) { $novo[ $k ] = $v; if ( 'camadas' === $k ) { $novo['sensiveis'] = $bl; } }
	if ( ! isset( $novo['sensiveis'] ) ) { $novo['sensiveis'] = $bl; }
	return $novo;
}, 7 );
function tcd_sen_bloco( $u ) {
	$org = tcd_org_de( $u ); if ( ! $org || ! in_array( tcd_org_papel( $u, $org ), array( 'dono', 'gestor' ), true ) ) { return ''; }
	$d = tcd_org_dados( $org ); $activa = 'activa' === $d['estado']; $m = tcd_sen_meta( $org ); $esp = tcd_sen_especies( $org ); $g = tcd_cam_grupos( $org ); $cats = tcd_sen_cats();
	$sel = function ( $nome, $v, $herdar = null ) use ( $cats ) { $s = '<select name="' . esc_attr( $nome ) . '">'; if ( null !== $herdar ) { $s .= '<option value=""' . ( '' === (string) $v ? ' selected' : '' ) . '>' . esc_html( $herdar ) . '</option>'; } foreach ( $cats as $k => $t ) { $s .= '<option value="' . (int) $k . '"' . ( '' !== (string) $v && (int) $v === $k ? ' selected' : '' ) . '>' . (int) $k . ' · ' . esc_html( $t ) . '</option>'; } return $s . '</select>'; };
	$h = '<div id="sensiveis"><p class="tof-vz">Quem gere a organização e quem for marcado na camada vê as coordenadas exactas. Todos os outros, e qualquer saída pública, recebem posições generalizadas segundo o guia do GBIF (Chapman 2020). Nada é aleatorizado; os campos retirados ficam explicados no registo.</p>';
	if ( isset( $_GET['sen_msg'] ) ) { $h .= '<p class="tof-vz" role="status">' . esc_html( sanitize_text_field( wp_unslash( $_GET['sen_msg'] ) ) ) . '</p>'; } // phpcs:ignore
	$av = tcd_sen_aviso_revisao( $org ); if ( $av ) { $h .= '<p class="tsen-av">' . esc_html( $av ) . '</p>'; }
	elseif ( $m['revisao'] ) { $h .= '<p class="tof-vz">Lista revista a ' . esc_html( wp_date( 'j/n/Y', strtotime( $m['revisao'] ) ) ) . '.</p>'; }
	$h .= '<ul class="tsen-cats">'; foreach ( $cats as $k => $t ) { $h .= '<li><b>' . (int) $k . '</b> ' . esc_html( tcd_sen_texto_cat( $k ) ) . '</li>'; } $h .= '</ul>';
	$campos = '<p class="tof-k">Espécies gatilho</p><table class="tsen-t"><thead><tr><th>Espécie</th><th>Categoria</th><th>Nota</th></tr></thead><tbody>';
	foreach ( $esp as $k => $x ) { $campos .= '<tr><td><i>' . esc_html( $x['nome'] ) . '</i>' . ( $x['comum'] ? '<br><small>' . esc_html( $x['comum'] ) . '</small>' : '' ) . '</td><td>' . $sel( 'esp[' . $x['nome'] . ']', $x['cat'] ) . ( 'org' === $x['origem'] ? ' <span class="tof-pill">alterada</span>' : '' ) . '</td><td><small>' . esc_html( $x['nota'] ) . '</small></td></tr>'; }
	$campos .= '<tr><td><input type="text" name="nova_nome" placeholder="Nome científico a acrescentar" maxlength="60"></td><td>' . $sel( 'nova_cat', 3 ) . '</td><td><small>Só o nome científico (género e espécie; o género só, para o grupo inteiro).</small></td></tr></tbody></table>';
	$campos .= '<p class="tof-k">Categoria por grupo</p><table class="tsen-t"><tbody>';
	foreach ( $g as $gid => $gx ) { $v = isset( $m['grupos'][ $gid ] ) ? (string) $m['grupos'][ $gid ] : ''; $her = isset( $gx['cat'] ) && '' !== (string) $gx['cat'] ? 'Herdar: ' . (int) $gx['cat'] : ( empty( $gx['sensivel'] ) ? 'Herdar: 0 (grupo aberto)' : 'Herdar: 3 (grupo sensível)' ); $campos .= '<tr><td><i style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' . esc_attr( $gx['cor'] ) . ';margin-right:6px"></i>' . esc_html( $gx['nome'] ) . '</td><td>' . $sel( 'grp[' . $gid . ']', $v, $her ) . '</td></tr>'; }
	$campos .= '</tbody></table><p class="tof-vz">Cada registo sai com a categoria mais restritiva entre o grupo, a camada e a espécie encontrada nas propriedades (scientificName, especie, species, taxon, nome_cientifico, sp, nome comum e nomes DBF truncados).</p>';
	if ( $activa ) { $h .= '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" class="tsen-f"><input type="hidden" name="action" value="tcd_sen_acao"><input type="hidden" name="op" value="guardar">' . wp_nonce_field( 'tcd_sen', '_wpnonce', true, false ) . $campos . '<button type="submit" class="tof-btn">Guardar e marcar como revista</button></form>'; }
	else { $h .= '<div class="tsen-f tsen-ro">' . $campos . '<p class="tof-vz">A organização está em só leitura: as categorias continuam a aplicar-se, mas não se alteram.</p></div>'; }
	// teste por camada (GET, nada muda)
	$lista = tcd_cam_lista( $org, $u ); if ( $lista ) {
		$cid = (int) ( $_GET['sen_teste'] ?? 0 ); $h .= '<details class="tsen-q"' . ( $cid ? ' open' : '' ) . '><summary>Testar numa camada</summary><form method="get" action="' . esc_url( home_url( '/oficina/' ) ) . '" class="tsen-g"><select name="sen_teste">'; // phpcs:ignore
		foreach ( $lista as $c ) { $h .= '<option value="' . (int) $c['id'] . '"' . ( $cid === (int) $c['id'] ? ' selected' : '' ) . '>' . esc_html( $c['nome'] ) . '</option>'; }
		$h .= '</select><button type="submit" class="tof-btn s">Ver o que sairia</button></form>';
		if ( $cid ) { $c = tcd_cam_dados( $cid ); if ( $c && (int) $c['org'] === $org && tcd_cam_ve( $u, $c ) ) { $n = tcd_sen_contar( $c ); $h .= '<p class="tof-vz">Camada «' . esc_html( $c['nome'] ) . '»: '; $p = array(); foreach ( $n as $k => $q ) { if ( $q ) { $p[] = number_format( $q, 0, ',', ' ' ) . ' na categoria ' . (int) $k . ' (' . esc_html( strtolower( $cats[ $k ] ) ) . ')'; } } $h .= esc_html( implode( '; ', $p ) ) . '. Nada foi alterado.</p>'; } }
		$h .= '</details>';
	}
	$h .= '<style>.tsen-av{border-left:3px solid var(--te);padding:6px 10px;margin:8px 0;font-size:13px;color:var(--tx)}.tsen-cats{margin:6px 0 12px 0;padding:0;list-style:none;font-size:12px;color:var(--mu)}.tsen-cats b{display:inline-block;width:16px;color:var(--ac2)}.tsen-t{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:10px}.tsen-t th{text-align:left;font-weight:600;color:var(--mu);font-size:11px;letter-spacing:.06em;text-transform:uppercase;padding:4px 6px 4px 0}.tsen-t td{padding:5px 6px 5px 0;border-top:1px solid var(--ln);vertical-align:top}.tsen-t select,.tsen-t input[type=text]{font:12px Inter,sans-serif;border:1px solid var(--ln);border-radius:8px;padding:3px 6px;background:var(--p);color:var(--tx);max-width:100%}.tsen-ro select,.tsen-ro input{pointer-events:none;opacity:.7}.tsen-q{margin-top:10px;font-size:13px}.tsen-q summary{cursor:pointer;color:var(--ac2);font-weight:600}.tsen-g{display:inline-flex;gap:6px;align-items:center;margin:6px 0}.tsen-g select{font:12px Inter,sans-serif;border:1px solid var(--ln);border-radius:8px;padding:3px 6px;background:var(--p);color:var(--tx)}</style>';
	return $h . '</div>';
}
