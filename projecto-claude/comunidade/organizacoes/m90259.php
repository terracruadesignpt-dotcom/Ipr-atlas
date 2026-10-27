<?php
// Módulo 90259 · Indicadores, relatórios LIFE/ELSP e rewilding score das organizações no IPR Atlas
// (decisão do Nuno, 21/10/2026, 16h14). Princípio vindo da investigação (plataformas.md, secção 3): o LIFE, o ELSP, o art. 17
// da Directiva Habitats, a Lei do Restauro e o ESRS E4 pedem os mesmos objectos (sítio, medida com data, habitat com condição,
// espécie com estatuto, indicador com linha de base, meta e série, responsável). Cada relatório é uma vista sobre os mesmos dados.
//  - CPT tcd_indicador (private), meta _tcd_ind: org, slug, nome, unidade, dimensão (ecologia, economia, sociedade), essencial,
//    periodicidade, quadros (LIFE, ELSP, art17, restauro, E4, score), origem (manual | grupo_ha:<grupo> | grupo_n:<grupo> |
//    grupo_soma:<grupo>:<propriedade>), método, custo (1 a 3, £ a £££ como a Rewilding Britain), linha de base, meta, série
//    anual, responsável, código de acção LIFE, justificação do desvio. Meta _tcd_ind_org para a pesquisa.
//  - Origem automática: o valor calcula-se a partir dos metas das camadas do m90254 (ha, n, ou «somas» das propriedades
//    numéricas, guardadas uma vez em tcd_cam_carregada; nunca se abre o ficheiro), com cache de 10 minutos; o cron diário
//    guarda o valor do ano na série para haver tendência e repõe «somas» nas camadas antigas (20 por dia).
//  - Revisão de segurança (21/10): nonce no gancho de invalidação, CSV protegido contra fórmulas, score e texto ELSP em metas
//    próprios (_tcd_org_score, _tcd_org_rel), relatório anual só conta camadas visíveis a quem o pede, mensagens por transient.
//  - Indicadores de defeito: do m90255 (tcd_mdl_indicadores) quando existe, senão lista base de 12; botão «Adoptar» (gestor)
//    e acção tcd_mdl_aplicado para os criar quando o m90255 aplica modelos. Nunca duplica (por slug).
//  - Blocos na Oficina: «indicadores» (w=2, a seguir a camadas) e «score» (w=1, a seguir a indicadores).
//  - Relatórios imprimíveis em /oficina/?relatorio=life|elsp|anual|art17|e4 (membros) e CSV em GET /tcd/v1/org/relatorio.
//  - Rewilding score (Torres et al. 2018, Phil. Trans. R. Soc. B): seis componentes 0..5 em dois eixos (forçamento humano a,b;
//    integridade ecológica c..f), parecer pericial guardado como dado, por ano, em $d['score'][ano] da organização.
//  - Nada se apaga: um indicador desactiva-se (activo = 0) e pode voltar. Em só leitura tudo se vê e exporta, nada muda.
// Expõe: tcd_ind_lista, tcd_ind_dados, tcd_ind_criar, tcd_ind_valor, tcd_ind_registar, tcd_ind_desvio, tcd_ind_tendencia,
// tcd_ind_adoptar, tcd_ind_tabela, tcd_ind_score, tcd_ind_score_guardar, tcd_ind_score_eixos; filtro tcd_ind_defeito($lista,$org);
// acção tcd_ind_registado($id,$ano,$valor,$u). Interruptor: tcd_ind_off = 1. Depende do m90253, m90254 e m90250. Prefixo tcd_ind_.
if ( ! defined( 'ABSPATH' ) ) { exit; }

function tcd_ind_on() { return '1' !== (string) get_option( 'tcd_ind_off', '' ) && function_exists( 'tcd_org_de' ) && function_exists( 'tcd_cam_lista' ); }
function tcd_ind_dimensoes() { return array( 'ecologia' => 'Ecologia', 'economia' => 'Economia', 'sociedade' => 'Sociedade' ); }
function tcd_ind_quadros() { return array( 'LIFE' => 'LIFE', 'ELSP' => 'ELSP', 'art17' => 'Art. 17', 'restauro' => 'Lei do Restauro', 'E4' => 'ESRS E4', 'score' => 'Score' ); }
function tcd_ind_areas_life() { return array( 'natureza' => 'Natureza e biodiversidade', 'agua' => 'Água', 'solo' => 'Solo', 'clima' => 'Clima', 'governanca' => 'Governança', 'sensibilizacao' => 'Sensibilização', 'emprego' => 'Emprego', 'economia' => 'Sustentabilidade económica' ); }
function tcd_ind_componentes() { return array( 'a' => 'Entradas materiais da gestão', 'b' => 'Saídas materiais', 'c' => 'Estocasticidade natural', 'd' => 'Regimes de perturbação (fogo, cheia)', 'e' => 'Conectividade da paisagem', 'f' => 'Complexidade trófica' ); }
add_action( 'init', function () { register_post_type( 'tcd_indicador', array( 'public' => false, 'show_ui' => false, 'supports' => array( 'title' ), 'label' => 'Indicadores de organizações' ) ); }, 5 );

// ---------- definição e dados ----------
function tcd_ind_num( $v ) { if ( null === $v || '' === $v ) { return null; } $v = str_replace( array( ' ', ',' ), array( '', '.' ), (string) $v ); return is_numeric( $v ) ? (float) $v : null; }
function tcd_ind_origem_ok( $o ) { $o = sanitize_text_field( (string) $o ); if ( 'manual' === $o || '' === $o ) { return 'manual'; } return preg_match( '/^grupo_(ha|n):[a-z0-9_\-]{1,20}$/', $o ) || preg_match( '/^grupo_soma:[a-z0-9_\-]{1,20}:[^:]{1,60}$/', $o ) ? $o : 'manual'; }
function tcd_ind_limpar_def( $def ) {
	$t = function ( $k, $n = 90 ) use ( $def ) { return mb_substr( sanitize_text_field( (string) ( $def[ $k ] ?? '' ) ), 0, $n ); };
	$q = array(); foreach ( (array) ( $def['quadros'] ?? array() ) as $x ) { if ( ! is_scalar( $x ) ) { continue; } $x = (string) $x; if ( isset( tcd_ind_quadros()[ $x ] ) ) { $q[ $x ] = 1; } }
	$lb = (array) ( $def['linha_base'] ?? array() ); $mt = (array) ( $def['meta'] ?? array() );
	$slug = sanitize_key( $def['slug'] ?? '' ); if ( '' === $slug ) { $slug = substr( sanitize_title( $t( 'nome' ) ), 0, 40 ); }
	return array(
		'slug' => substr( $slug, 0, 40 ), 'nome' => $t( 'nome' ), 'unidade' => $t( 'unidade', 30 ), 'dimensao' => is_string( $def['dimensao'] ?? null ) && isset( tcd_ind_dimensoes()[ $def['dimensao'] ] ) ? $def['dimensao'] : 'ecologia',
		'essencial' => (int) ! empty( $def['essencial'] ), 'periodicidade' => $t( 'periodicidade', 40 ) ?: 'anual', 'quadros' => array_keys( $q ), 'origem' => tcd_ind_origem_ok( $def['origem'] ?? 'manual' ),
		'metodo' => mb_substr( sanitize_textarea_field( (string) ( $def['metodo'] ?? '' ) ), 0, 1000 ), 'custo' => min( 3, max( 1, (int) ( $def['custo'] ?? 1 ) ) ),
		'linha_base' => array( 'valor' => tcd_ind_num( $lb['valor'] ?? null ), 'ano' => (int) ( $lb['ano'] ?? 0 ) ?: null, 'metodo' => mb_substr( sanitize_text_field( (string) ( $lb['metodo'] ?? '' ) ), 0, 200 ) ),
		'meta' => array( 'valor' => tcd_ind_num( $mt['valor'] ?? null ), 'ano' => (int) ( $mt['ano'] ?? 0 ) ?: null ),
		'responsavel' => (int) ( $def['responsavel'] ?? 0 ), 'codigo_accao' => $t( 'codigo_accao', 12 ), 'justificacao' => mb_substr( sanitize_textarea_field( (string) ( $def['justificacao'] ?? '' ) ), 0, 1000 ),
		'area_life' => is_string( $def['area_life'] ?? null ) && isset( tcd_ind_areas_life()[ $def['area_life'] ] ) ? $def['area_life'] : '', 'activo' => isset( $def['activo'] ) ? (int) ! empty( $def['activo'] ) : 1,
	);
}
function tcd_ind_dados( $id ) { $id = (int) $id; if ( ! $id || 'tcd_indicador' !== get_post_type( $id ) ) { return null; } $d = get_post_meta( $id, '_tcd_ind', true ); if ( ! is_array( $d ) ) { return null; } $d['id'] = $id; $d['serie'] = is_array( $d['serie'] ?? null ) ? $d['serie'] : array(); return $d; }
function tcd_ind_guardar( $id, $d ) { unset( $d['id'] ); update_post_meta( (int) $id, '_tcd_ind', $d ); }
function tcd_ind_lista( $org, $com_inactivos = false ) {
	$out = array();
	foreach ( get_posts( array( 'post_type' => 'tcd_indicador', 'post_status' => 'any', 'numberposts' => 300, 'fields' => 'ids', 'meta_key' => '_tcd_ind_org', 'meta_value' => (int) $org, 'orderby' => 'title', 'order' => 'ASC' ) ) as $id ) {
		$d = tcd_ind_dados( $id ); if ( ! $d || ( empty( $d['activo'] ) && ! $com_inactivos ) ) { continue; } $out[] = $d;
	}
	usort( $out, function ( $a, $b ) { return array( $a['dimensao'], -$a['essencial'], $a['nome'] ) <=> array( $b['dimensao'], -$b['essencial'], $b['nome'] ); } );
	return $out;
}
function tcd_ind_por_slug( $org, $slug ) { foreach ( tcd_ind_lista( $org, true ) as $d ) { if ( $d['slug'] === $slug ) { return $d; } } return null; }
// Criar um indicador. Devolve o id ou WP_Error (dup se o slug já existe na organização).
function tcd_ind_criar( $org, $def, $u = null, $existentes = null ) {
	$org = (int) $org; $o = tcd_org_dados( $org ); if ( ! $o ) { return new WP_Error( 'org', 'Organização não encontrada.' ); }
	if ( 'activa' !== $o['estado'] ) { return new WP_Error( 'leitura', 'A organização está em só leitura.' ); }
	$d = tcd_ind_limpar_def( $def ); if ( '' === $d['nome'] || '' === $d['slug'] ) { return new WP_Error( 'nome', 'O indicador precisa de nome.' ); }
	if ( null === $existentes ) { $existentes = array_column( tcd_ind_lista( $org, true ), 'slug' ); } // slugs já existentes (adoptar passa a lista uma vez)
	if ( in_array( $d['slug'], $existentes, true ) ) { return new WP_Error( 'dup', 'Já existe um indicador com esse código.' ); }
	if ( count( $existentes ) >= 200 ) { return new WP_Error( 'lim', 'Limite de 200 indicadores.' ); }
	$id = wp_insert_post( array( 'post_type' => 'tcd_indicador', 'post_status' => 'private', 'post_title' => $d['nome'], 'post_author' => (int) ( $u->ID ?? 0 ) ) );
	if ( ! $id || is_wp_error( $id ) ) { return new WP_Error( 'post', 'Não foi possível guardar.' ); }
	$d['org'] = $org; $d['serie'] = array(); $d['por'] = (int) ( $u->ID ?? 0 ); $d['quando'] = current_time( 'mysql' );
	update_post_meta( $id, '_tcd_ind', $d ); update_post_meta( $id, '_tcd_ind_org', $org );
	return (int) $id;
}

// ---------- valores: automáticos (camadas) e manuais (série) ----------
function tcd_ind_versao( $org ) { return (int) get_option( 'tcd_ind_ver_' . (int) $org, 0 ); }
function tcd_ind_limpar_cache( $org ) { update_option( 'tcd_ind_ver_' . (int) $org, tcd_ind_versao( $org ) + 1, false ); }
// Somas das propriedades numéricas guardadas no meta da camada ao carregar (até 50 propriedades): grupo_soma nunca abre ficheiros.
function tcd_ind_somas( $gj ) { $s = array(); foreach ( (array) ( $gj['features'] ?? array() ) as $f ) { foreach ( (array) ( $f['properties'] ?? array() ) as $k => $v ) { if ( is_numeric( $v ) && ( isset( $s[ $k ] ) || count( $s ) < 50 ) ) { $s[ $k ] = round( ( $s[ $k ] ?? 0.0 ) + (float) $v, 4 ); } } } return $s; }
add_action( 'tcd_cam_carregada', function ( $id, $c, $u = null, $gj = null ) {
	if ( is_array( $gj ) ) { $c['somas'] = tcd_ind_somas( $gj ); unset( $c['id'], $c['nome'] ); update_post_meta( (int) $id, '_tcd_cam', $c ); }
	tcd_ind_limpar_cache( $c['org'] );
}, 10, 4 );
// Camadas antigas sem somas: uma passagem única no cron, no máximo 20 por dia.
add_action( 'tcd_org_diario', function () {
	if ( ! tcd_ind_on() ) { return; } $n = 0; @set_time_limit( 120 );
	foreach ( get_posts( array( 'post_type' => 'tcd_camada', 'post_status' => 'any', 'numberposts' => 2000, 'fields' => 'ids' ) ) as $id ) {
		$c = tcd_cam_dados( $id ); if ( ! $c || isset( $c['somas'] ) ) { continue; } if ( $n++ >= 20 ) { break; }
		$gj = tcd_cam_geojson( $c, 0, 'relatorio' ); $c['somas'] = is_array( $gj ) ? tcd_ind_somas( $gj ) : array(); unset( $c['id'], $c['nome'] ); update_post_meta( $id, '_tcd_cam', $c ); tcd_ind_limpar_cache( $c['org'] );
	}
}, 25 );
// Acções do m90254 (lixo, repor, grupo): a cache cai, mas só com nonce válido e papel que edita camadas (o m90254 responde com exit).
add_action( 'admin_post_tcd_cam_acao', function () {
	if ( empty( $_POST['_wpnonce'] ) || ! wp_verify_nonce( sanitize_key( $_POST['_wpnonce'] ), 'tcd_cam' ) ) { return; } // phpcs:ignore
	$u = wp_get_current_user(); $org = tcd_org_de( $u ); if ( $org && tcd_org_pode( $u, 'editar', $org ) ) { tcd_ind_limpar_cache( $org ); }
}, 1 );
function tcd_ind_calcular( $org, $origem ) {
	$p = explode( ':', (string) $origem, 3 ); if ( count( $p ) < 2 ) { return null; }
	$k = 'tcd_ind_c_' . md5( (int) $org . '|' . $origem . '|' . tcd_ind_versao( $org ) ); $c = get_transient( $k ); if ( false !== $c && is_array( $c ) ) { return $c['v']; }
	$g = tcd_cam_grupos( $org ); if ( ! isset( $g[ $p[1] ] ) ) { set_transient( $k, array( 'v' => null ), 600 ); return null; }
	$v = 0.0; $n = 0;
	foreach ( tcd_cam_lista( $org ) as $cam ) {
		if ( $cam['grupo'] !== $p[1] || ! empty( $cam['lixo'] ) ) { continue; } $n++;
		if ( 'grupo_ha' === $p[0] ) { $v += (float) $cam['ha']; }
		elseif ( 'grupo_n' === $p[0] ) { $v += (int) $cam['n']; }
		elseif ( 'grupo_soma' === $p[0] && isset( $p[2] ) ) { $v += (float) ( $cam['somas'][ $p[2] ] ?? 0 ); } // só do meta, nunca do ficheiro
	}
	$v = $n ? round( $v, 2 ) : null; set_transient( $k, array( 'v' => $v ), 600 ); return $v;
}
function tcd_ind_auto( $ind ) { return 'manual' !== ( $ind['origem'] ?? 'manual' ); }
// Série completa (ano => valor), com o valor ao vivo do ano corrente quando a origem é automática.
function tcd_ind_serie( $ind ) {
	$s = array(); foreach ( $ind['serie'] as $x ) { if ( isset( $x['ano'] ) && null !== ( $x['valor'] ?? null ) ) { $s[ (int) $x['ano'] ] = (float) $x['valor']; } }
	if ( tcd_ind_auto( $ind ) ) { $v = tcd_ind_calcular( $ind['org'], $ind['origem'] ); if ( null !== $v ) { $s[ (int) wp_date( 'Y' ) ] = $v; } }
	ksort( $s ); return $s;
}
// Último valor: {valor, ano, auto, nota} ou null.
function tcd_ind_valor( $ind ) {
	$s = tcd_ind_serie( $ind ); if ( ! $s ) { return null; } $ano = array_key_last( $s ); $nota = '';
	foreach ( $ind['serie'] as $x ) { if ( (int) ( $x['ano'] ?? 0 ) === $ano ) { $nota = (string) ( $x['nota'] ?? '' ); } }
	return array( 'valor' => $s[ $ano ], 'ano' => $ano, 'auto' => (int) tcd_ind_auto( $ind ), 'nota' => $nota );
}
function tcd_ind_tendencia( $ind ) { $s = array_values( tcd_ind_serie( $ind ) ); $n = count( $s ); if ( $n < 2 ) { return ''; } $d = $s[ $n - 1 ] - $s[ $n - 2 ]; return abs( $d ) < 1e-9 ? '→' : ( $d > 0 ? '↑' : '↓' ); }
// Desvio à meta: {actual, meta, abs, pct} ou null se faltar meta ou valor.
function tcd_ind_desvio( $ind ) {
	$v = tcd_ind_valor( $ind ); $m = $ind['meta']['valor'] ?? null; if ( ! $v || null === $m ) { return null; }
	$abs = (float) $v['valor'] - (float) $m; return array( 'actual' => (float) $v['valor'], 'meta' => (float) $m, 'abs' => round( $abs, 2 ), 'pct' => 0.0 != (float) $m ? round( 100 * $abs / abs( (float) $m ), 1 ) : null );
}
// Registar o valor de um ano (editores); substitui o valor do mesmo ano. Devolve true ou WP_Error.
function tcd_ind_registar( $id, $ano, $valor, $nota, $u ) {
	$d = tcd_ind_dados( $id ); if ( ! $d ) { return new WP_Error( 'ind', 'Indicador não encontrado.' ); }
	if ( ! $u || ! tcd_org_pode( $u, 'editar', $d['org'] ) ) { return new WP_Error( 'acesso', 'Sem acesso para registar.' ); }
	$ano = (int) $ano; $v = tcd_ind_num( $valor ); if ( $ano < 1990 || $ano > 2100 || null === $v ) { return new WP_Error( 'valor', 'Ano ou valor inválido.' ); }
	$s = array(); foreach ( $d['serie'] as $x ) { if ( (int) ( $x['ano'] ?? 0 ) !== $ano ) { $s[] = $x; } }
	$s[] = array( 'ano' => $ano, 'valor' => $v, 'nota' => mb_substr( sanitize_textarea_field( (string) $nota ), 0, 1000 ), 'por' => (int) $u->ID, 'quando' => current_time( 'mysql' ) );
	usort( $s, function ( $a, $b ) { return $a['ano'] <=> $b['ano']; } ); $d['serie'] = array_slice( $s, -60 ); tcd_ind_guardar( $id, $d );
	do_action( 'tcd_ind_registado', $id, $ano, $v, $u ); return true;
}
// Cron diário: guarda na série o valor do ano dos indicadores automáticos (para haver tendência nos anos seguintes).
add_action( 'tcd_org_diario', function () {
	if ( ! tcd_ind_on() ) { return; } $ano = (int) wp_date( 'Y' );
	foreach ( get_posts( array( 'post_type' => 'tcd_indicador', 'post_status' => 'any', 'numberposts' => 2000, 'fields' => 'ids' ) ) as $id ) {
		$d = tcd_ind_dados( $id ); if ( ! $d || ! tcd_ind_auto( $d ) || empty( $d['activo'] ) ) { continue; } $v = tcd_ind_calcular( $d['org'], $d['origem'] ); if ( null === $v ) { continue; }
		$s = array(); foreach ( $d['serie'] as $x ) { if ( (int) ( $x['ano'] ?? 0 ) !== $ano ) { $s[] = $x; } } $s[] = array( 'ano' => $ano, 'valor' => $v, 'nota' => 'automático', 'por' => 0, 'quando' => current_time( 'mysql' ) ); $d['serie'] = $s; tcd_ind_guardar( $id, $d );
	}
}, 30 );

// ---------- indicadores de defeito ----------
function tcd_ind_defeito_base() {
	$i = function ( $slug, $nome, $un, $dim, $ess, $q, $orig, $met, $custo = 1, $cod = '', $area = '' ) { return compact( 'slug', 'nome' ) + array( 'unidade' => $un, 'dimensao' => $dim, 'essencial' => $ess, 'periodicidade' => 'anual', 'quadros' => $q, 'origem' => $orig, 'metodo' => $met, 'custo' => $custo, 'codigo_accao' => $cod, 'area_life' => $area ); };
	return array(
		$i( 'ha_gestao', 'Hectares sob gestão', 'ha', 'ecologia', 1, array( 'LIFE', 'ELSP', 'restauro', 'E4', 'score' ), 'grupo_ha:areas', 'Soma das áreas das camadas do grupo «Áreas e acordos».', 1, 'C1', 'natureza' ),
		$i( 'ha_pastoreio', 'Hectares de pastoreio natural', 'ha', 'ecologia', 1, array( 'LIFE', 'ELSP', 'score' ), 'grupo_ha:herbivoros', 'Soma das áreas das camadas do grupo «Herbívoros e pastoreio».', 1, 'C2', 'natureza' ),
		$i( 'efectivo', 'Efectivo de herbívoros por espécie', 'indivíduos', 'ecologia', 1, array( 'LIFE', 'ELSP', 'score' ), 'manual', 'Contagem anual das manadas (nascimentos e mortes registados no caderno de terreno).', 1, 'C2', 'natureza' ),
		$i( 'casais', 'Casais nidificantes de espécies alvo', 'casais', 'ecologia', 1, array( 'LIFE', 'ELSP', 'art17', 'E4' ), 'manual', 'Censo de ninhos ocupados na época de reprodução; método e esforço anotados.', 2, 'D1', 'natureza' ),
		$i( 'crias', 'Crias voadas', 'indivíduos', 'ecologia', 0, array( 'LIFE', 'art17' ), 'manual', 'Observação dos ninhos até ao abandono; uma visita por quinzena.', 2, 'D1', 'natureza' ),
		$i( 'atropelamentos', 'Atropelamentos registados', 'n', 'ecologia', 0, array( 'ELSP', 'score' ), 'grupo_n:coexistencia', 'Número de elementos das camadas do grupo «Coexistência e ameaças».', 1, 'D2', 'natureza' ),
		$i( 'ataques', 'Ataques a gado', 'n', 'sociedade', 1, array( 'LIFE', 'ELSP' ), 'manual', 'Registo de ocorrências confirmadas, com data e exploração.', 1, 'C4', 'sensibilizacao' ),
		$i( 'km_rio', 'Km de rio reconectados', 'km', 'ecologia', 0, array( 'LIFE', 'ELSP', 'restauro', 'E4' ), 'manual', 'Comprimento de troço livre de obstáculos após a remoção, medido no Atlas.', 1, 'C3', 'agua' ),
		$i( 'arvores', 'Árvores plantadas', 'n', 'ecologia', 0, array( 'LIFE', 'ELSP', 'restauro' ), 'manual', 'Contagem na plantação, com taxa de sobrevivência ao fim de um ano em nota.', 1, 'C3', 'natureza' ),
		$i( 'visitantes', 'Visitantes', 'pessoas', 'economia', 1, array( 'LIFE', 'ELSP' ), 'manual', 'Registo de visitas guiadas e dormidas comunicadas pelas empresas da rede.', 1, 'E1', 'economia' ),
		$i( 'voluntarios', 'Voluntários (horas)', 'horas', 'sociedade', 1, array( 'ELSP' ), 'manual', 'Horas de voluntariado somadas por acção; o número de pessoas vai em nota.', 1, 'E2', 'sensibilizacao' ),
		$i( 'equipa', 'Pessoas da equipa', 'pessoas', 'sociedade', 0, array( 'LIFE', 'ELSP' ), 'manual', 'Pessoas com contrato ou bolsa a 31 de Dezembro.', 1, 'F1', 'emprego' ),
	);
}
function tcd_ind_defeitos( $org ) { $l = function_exists( 'tcd_mdl_indicadores' ) ? (array) tcd_mdl_indicadores( $org ) : tcd_ind_defeito_base(); return (array) apply_filters( 'tcd_ind_defeito', $l, (int) $org ); }
// Cria os que faltam (por slug). Devolve o número criado.
function tcd_ind_adoptar( $org, $u = null ) { $n = 0; $ex = array_column( tcd_ind_lista( $org, true ), 'slug' ); foreach ( tcd_ind_defeitos( $org ) as $def ) { if ( ! is_array( $def ) ) { continue; } $r = tcd_ind_criar( $org, $def, $u, $ex ); if ( ! is_wp_error( $r ) ) { $n++; $ex[] = tcd_ind_dados( $r )['slug']; } } return $n; }
add_action( 'tcd_mdl_aplicado', function ( $org, $slugs = array(), $u = null ) { if ( tcd_ind_on() ) { tcd_ind_adoptar( $org, $u ); } }, 10, 3 );

// ---------- rewilding score (Torres et al. 2018) ----------
// Guardado em meta próprio _tcd_org_score (não dentro de _tcd_org, que todos os módulos lêem e regravam).
function tcd_ind_scores( $org ) { $s = get_post_meta( (int) $org, '_tcd_org_score', true ); $s = is_array( $s ) ? $s : array(); ksort( $s ); return $s; }
function tcd_ind_score( $org, $ano ) { $s = tcd_ind_scores( $org )[ (int) $ano ] ?? null; return is_array( $s ) ? $s : null; }
function tcd_ind_texto( $org, $k ) { $r = get_post_meta( (int) $org, '_tcd_org_rel', true ); return (string) ( is_array( $r ) ? ( $r[ $k ] ?? '' ) : '' ); }
// Eixos: forçamento humano = 5 − média(a, b) (quanto mais alto, menos intervenção); integridade ecológica = média(c..f).
function tcd_ind_score_eixos( $s ) {
	$c = (array) ( $s['componentes'] ?? array() ); $v = function ( $k ) use ( $c ) { return min( 5.0, max( 0.0, (float) ( $c[ $k ]['valor'] ?? 0 ) ) ); };
	return array( 'humano' => round( 5 - ( $v( 'a' ) + $v( 'b' ) ) / 2, 2 ), 'integridade' => round( ( $v( 'c' ) + $v( 'd' ) + $v( 'e' ) + $v( 'f' ) ) / 4, 2 ) );
}
function tcd_ind_score_guardar( $org, $ano, $comp, $painel, $u ) {
	$org = (int) $org; $d = tcd_org_dados( $org ); if ( ! $d || ! $u || ! tcd_org_pode( $u, 'gerir', $org ) ) { return new WP_Error( 'acesso', 'Sem acesso.' ); }
	$ano = (int) $ano; if ( $ano < 1990 || $ano > 2100 ) { return new WP_Error( 'ano', 'Ano inválido.' ); }
	$c = array(); $slugs = array_column( tcd_ind_lista( $org ), 'slug' );
	foreach ( array_keys( tcd_ind_componentes() ) as $k ) { $x = (array) ( $comp[ $k ] ?? array() ); $ev = array(); $evs = is_array( $x['evidencia'] ?? null ) ? $x['evidencia'] : explode( ',', (string) ( $x['evidencia'] ?? '' ) ); foreach ( $evs as $e ) { $e = sanitize_key( $e ); if ( in_array( $e, $slugs, true ) ) { $ev[] = $e; } } $c[ $k ] = array( 'valor' => min( 5.0, max( 0.0, round( (float) tcd_ind_num( $x['valor'] ?? 0 ) * 2 ) / 2 ) ), 'parecer' => mb_substr( sanitize_textarea_field( (string) ( $x['parecer'] ?? '' ) ), 0, 1500 ), 'evidencia' => $ev ); }
	$sc = tcd_ind_scores( $org ); if ( count( $sc ) >= 60 && ! isset( $sc[ $ano ] ) ) { return new WP_Error( 'lim', 'Limite de anos.' ); }
	$sc[ $ano ] = array( 'componentes' => $c, 'por' => (int) $u->ID, 'quando' => current_time( 'mysql' ), 'painel' => mb_substr( sanitize_text_field( (string) $painel ), 0, 300 ) ); ksort( $sc ); update_post_meta( $org, '_tcd_org_score', $sc ); return true;
}
function tcd_ind_score_svg( $org ) {
	$sc = tcd_ind_scores( $org ); $w = 260; $h = 260; $m = 34; $px = function ( $v ) use ( $w, $m ) { return $m + ( $w - 2 * $m ) * $v / 5; }; $py = function ( $v ) use ( $h, $m ) { return $h - $m - ( $h - 2 * $m ) * $v / 5; };
	$s = '<svg class="tind-svg" viewBox="0 0 ' . $w . ' ' . $h . '" width="' . $w . '" height="' . $h . '" role="img" aria-label="Rewilding score por ano"><rect x="' . $m . '" y="' . $m . '" width="' . ( $w - 2 * $m ) . '" height="' . ( $h - 2 * $m ) . '" fill="none" stroke="var(--ln,#ccc)"/>';
	for ( $i = 1; $i < 5; $i++ ) { $s .= '<line x1="' . $px( $i ) . '" y1="' . $m . '" x2="' . $px( $i ) . '" y2="' . ( $h - $m ) . '" stroke="var(--ln,#ddd)" stroke-dasharray="2 3"/><line x1="' . $m . '" y1="' . $py( $i ) . '" x2="' . ( $w - $m ) . '" y2="' . $py( $i ) . '" stroke="var(--ln,#ddd)" stroke-dasharray="2 3"/>'; }
	$s .= '<text x="' . ( $w / 2 ) . '" y="' . ( $h - 8 ) . '" text-anchor="middle" font-size="10" fill="var(--mu,#666)">Menos forçamento humano →</text><text x="10" y="' . ( $h / 2 ) . '" text-anchor="middle" font-size="10" fill="var(--mu,#666)" transform="rotate(-90 10 ' . ( $h / 2 ) . ')">Integridade ecológica →</text>';
	$pts = array(); foreach ( $sc as $ano => $x ) { $e = tcd_ind_score_eixos( $x ); $pts[] = array( $px( $e['humano'] ), $py( $e['integridade'] ), (int) $ano ); }
	if ( count( $pts ) > 1 ) { $s .= '<polyline fill="none" stroke="var(--ac2,#75834a)" stroke-width="1.5" points="' . esc_attr( implode( ' ', array_map( function ( $p ) { return round( $p[0], 1 ) . ',' . round( $p[1], 1 ); }, $pts ) ) ) . '"/>'; }
	foreach ( $pts as $i => $p ) { $s .= '<circle cx="' . round( $p[0], 1 ) . '" cy="' . round( $p[1], 1 ) . '" r="' . ( $i === count( $pts ) - 1 ? 5 : 3.5 ) . '" fill="var(--ac2,#75834a)"/><text x="' . round( $p[0] + 7, 1 ) . '" y="' . round( $p[1] - 6, 1 ) . '" font-size="10" fill="var(--tx,#333)">' . (int) $p[2] . '</text>'; }
	return $s . '</svg>';
}

// ---------- tabelas de relatório (a mesma para HTML e CSV) ----------
function tcd_ind_fmt( $v, $dec = 2 ) { return null === $v ? '' : ( abs( $v - round( $v ) ) < 1e-9 ? number_format( $v, 0, ',', ' ' ) : number_format( $v, $dec, ',', ' ' ) ); }
function tcd_ind_quadro( $ind, $q ) { return in_array( $q, (array) ( $ind['quadros'] ?? array() ), true ); }
// Devolve {titulo, cab[], linhas[][], avisos[], grupo (índice da coluna de agrupamento ou -1)}.
function tcd_ind_tabela( $org, $fmt, $u = null ) { // $u: no relatório anual só contam as camadas que a pessoa vê (sensíveis ficam de fora)
	$org = (int) $org; $o = tcd_org_dados( $org ); $lista = tcd_ind_lista( $org ); $m = tcd_org_membros( $org ); $dim = tcd_ind_dimensoes(); $t = array( 'titulo' => '', 'cab' => array(), 'linhas' => array(), 'avisos' => array(), 'grupo' => -1 );
	$resp = function ( $i ) use ( $m ) { return (string) ( $m[ (int) ( $i['responsavel'] ?? 0 ) ]['nome'] ?? '' ); };
	if ( 'life' === $fmt ) {
		$t['titulo'] = 'Indicadores de projecto LIFE (valor inicial, esperado, actual e desvio)'; $t['cab'] = array( 'Área LIFE', 'Código de acção', 'Indicador', 'Unidade', 'Valor inicial', 'Ano', 'Esperado no fim', 'Ano', 'Actual', 'Ano', 'Desvio', 'Desvio %', 'Justificação' ); $t['grupo'] = 0;
		$areas = tcd_ind_areas_life(); $pd = array( 'ecologia' => 'natureza', 'economia' => 'economia', 'sociedade' => 'sensibilizacao' ); $ordem = array_keys( $areas );
		$ls = array_filter( $lista, function ( $i ) { return tcd_ind_quadro( $i, 'LIFE' ); } );
		usort( $ls, function ( $a, $b ) use ( $pd, $ordem ) { return array_search( $a['area_life'] ?: $pd[ $a['dimensao'] ], $ordem, true ) <=> array_search( $b['area_life'] ?: $pd[ $b['dimensao'] ], $ordem, true ); } );
		foreach ( $ls as $i ) { $v = tcd_ind_valor( $i ); $dv = tcd_ind_desvio( $i ); $t['linhas'][] = array( $areas[ $i['area_life'] ?: $pd[ $i['dimensao'] ] ], $i['codigo_accao'], $i['nome'], $i['unidade'], tcd_ind_fmt( $i['linha_base']['valor'] ), $i['linha_base']['ano'] ?: '', tcd_ind_fmt( $i['meta']['valor'] ), $i['meta']['ano'] ?: '', $v ? tcd_ind_fmt( $v['valor'] ) : '', $v ? $v['ano'] : '', $dv ? tcd_ind_fmt( $dv['abs'] ) : '', $dv && null !== $dv['pct'] ? tcd_ind_fmt( $dv['pct'], 1 ) : '', $i['justificacao'] ); }
		if ( ! $t['linhas'] ) { $t['avisos'][] = 'Nenhum indicador marcado no quadro LIFE.'; }
	} elseif ( 'elsp' === $fmt ) {
		$t['titulo'] = 'Ficha de indicadores (ELSP): método, periodicidade, custo, linha de base, série anual e narrativa'; $t['cab'] = array( 'Dimensão', 'Indicador', 'Unidade', 'Método', 'Periodicidade', 'Custo', 'Linha de base', 'Ano', 'Série anual', 'Narrativa (último ano)' ); $t['grupo'] = 0;
		$ls = array_filter( $lista, function ( $i ) { return tcd_ind_quadro( $i, 'ELSP' ); } ); $dims = array();
		foreach ( $ls as $i ) { $v = tcd_ind_valor( $i ); $dims[ $i['dimensao'] ] = 1; $se = array(); foreach ( tcd_ind_serie( $i ) as $a => $x ) { $se[] = $a . ': ' . tcd_ind_fmt( $x ); } $t['linhas'][] = array( $dim[ $i['dimensao'] ], $i['nome'], $i['unidade'], $i['metodo'], $i['periodicidade'], str_repeat( '£', (int) $i['custo'] ), tcd_ind_fmt( $i['linha_base']['valor'] ), $i['linha_base']['ano'] ?: '', implode( '; ', $se ), $v ? $v['nota'] : '' ); }
		if ( count( $t['linhas'] ) < 10 ) { $t['avisos'][] = 'O ELSP pede pelo menos 10 indicadores; há ' . count( $t['linhas'] ) . '.'; }
		if ( count( $dims ) < 3 ) { $t['avisos'][] = 'Faltam indicadores em ' . ( 3 - count( $dims ) ) . ' das 3 dimensões (ecologia, economia, sociedade).'; }
	} elseif ( 'art17' === $fmt || 'e4' === $fmt ) {
		$q = 'e4' === $fmt ? 'E4' : 'art17'; $t['titulo'] = 'e4' === $fmt ? 'Métricas de estado (ESRS E4-5): linha de base, frequência e último valor' : 'Indicadores para o relatório do art. 17 (Directiva Habitats)';
		$t['cab'] = array( 'Indicador', 'Unidade', 'Linha de base', 'Ano', 'Método da linha de base', 'Frequência', 'Último valor', 'Ano', 'Tendência', 'Responsável' );
		foreach ( $lista as $i ) { if ( ! tcd_ind_quadro( $i, $q ) ) { continue; } $v = tcd_ind_valor( $i ); $t['linhas'][] = array( $i['nome'], $i['unidade'], tcd_ind_fmt( $i['linha_base']['valor'] ), $i['linha_base']['ano'] ?: '', $i['linha_base']['metodo'], $i['periodicidade'], $v ? tcd_ind_fmt( $v['valor'] ) : '', $v ? $v['ano'] : '', tcd_ind_tendencia( $i ), $resp( $i ) ); }
		$t['avisos'][] = 'A grelha de 10 km (art. 17) e a condição de ecossistema por sítio (E4) exportam-se pelo GeoPackage (m90258). Este quadro só lista os indicadores marcados.';
		if ( ! $t['linhas'] ) { $t['avisos'][] = 'Nenhum indicador marcado neste quadro.'; }
	} else { // anual (impacto)
		$ano = (int) wp_date( 'Y' ); $t['titulo'] = 'Relatório anual de impacto ' . $ano; $t['cab'] = array( 'Secção', 'Item', 'Valor', 'Unidade' ); $t['grupo'] = 0; $g = tcd_cam_grupos( $org ); $por = array();
		foreach ( tcd_cam_lista( $org, $u ) as $c ) { $k = $c['grupo']; $por[ $k ] = ( $por[ $k ] ?? array( 'ha' => 0.0, 'n' => 0, 'el' => 0 ) ); $por[ $k ]['ha'] += (float) $c['ha']; $por[ $k ]['n']++; $por[ $k ]['el'] += (int) $c['n']; }
		foreach ( $g as $k => $x ) { if ( empty( $por[ $k ] ) ) { continue; } if ( ! empty( $x['ha'] ) ) { $t['linhas'][] = array( 'Hectares', $x['nome'], tcd_ind_fmt( round( $por[ $k ]['ha'], 1 ), 1 ), 'ha' ); } $t['linhas'][] = array( 'Camadas', $x['nome'], tcd_ind_fmt( $por[ $k ]['n'] ) . ' camadas, ' . tcd_ind_fmt( $por[ $k ]['el'] ) . ' elementos', '' ); }
		foreach ( $lista as $i ) { if ( in_array( $i['unidade'], array( 'indivíduos', 'casais' ), true ) ) { $v = tcd_ind_valor( $i ); $t['linhas'][] = array( 'Espécies alvo', $i['nome'], $v ? tcd_ind_fmt( $v['valor'] ) . ' (' . $v['ano'] . ')' : '', $i['unidade'] ); } }
		$t['linhas'][] = array( 'Equipa', 'Membros activos no IPR Atlas', (string) tcd_org_lugares( $org ), 'pessoas' );
		foreach ( $lista as $i ) { if ( ! empty( $i['essencial'] ) ) { $v = tcd_ind_valor( $i ); $t['linhas'][] = array( 'Indicadores essenciais', $i['nome'], $v ? tcd_ind_fmt( $v['valor'] ) . ' (' . $v['ano'] . ')' : '', $i['unidade'] ); } }
		$s = tcd_ind_score( $org, $ano ); if ( ! $s ) { $sc = tcd_ind_scores( $org ); $s = $sc ? end( $sc ) : null; $ano = $sc ? array_key_last( $sc ) : $ano; }
		if ( $s ) { $e = tcd_ind_score_eixos( $s ); $t['linhas'][] = array( 'Rewilding score', 'Menos forçamento humano (' . $ano . ')', tcd_ind_fmt( $e['humano'] ), '0 a 5' ); $t['linhas'][] = array( 'Rewilding score', 'Integridade ecológica (' . $ano . ')', tcd_ind_fmt( $e['integridade'] ), '0 a 5' ); } else { $t['linhas'][] = array( 'Rewilding score', 'Sem avaliação registada', '', '' ); }
	}
	return $t;
}
// Células que começam por = + - @ tab CR levam apóstrofo (injecção de fórmulas no Excel e LibreOffice); os números formatados ficam como estão.
function tcd_ind_csv_celula( $v ) { $v = (string) $v; if ( '' === $v || ! preg_match( '/^[=+\-@\t\r]/', $v ) ) { return $v; } return is_numeric( str_replace( array( ' ', ',' ), array( '', '.' ), $v ) ) ? $v : "'" . $v; }
function tcd_ind_csv( $t ) { $f = fopen( 'php://temp', 'w+' ); fwrite( $f, "\xEF\xBB\xBF" ); fputcsv( $f, array_map( 'tcd_ind_csv_celula', $t['cab'] ), ';', '"', '' ); foreach ( $t['linhas'] as $l ) { fputcsv( $f, array_map( 'tcd_ind_csv_celula', $l ), ';', '"', '' ); } rewind( $f ); $s = stream_get_contents( $f ); fclose( $f ); return $s; }
function tcd_ind_relatorio_html( $org, $fmt, $u ) {
	$o = tcd_org_dados( $org ); $t = tcd_ind_tabela( $org, $fmt, $u ); $nomes = array( 'life' => 'Relatório LIFE', 'elsp' => 'Relatório ELSP', 'anual' => 'Relatório anual', 'art17' => 'Relatório art. 17', 'e4' => 'Relatório ESRS E4' );
	$h = '<style>.tind-rel{max-width:1100px;margin:0 auto;padding:24px;font:13px/1.45 Inter,Helvetica,Arial,sans-serif;color:#222;background:#fff}.tind-rel h1{font:400 24px/1.2 Raleway,Inter,sans-serif;margin:0 0 4px}.tind-rel h2{font:500 16px/1.3 Raleway,Inter,sans-serif;margin:18px 0 6px;border-bottom:1px solid #999;padding-bottom:3px}.tind-rel .k{font:500 11px/1 "IBM Plex Mono",monospace;letter-spacing:.12em;text-transform:uppercase;color:#b8652f}.tind-rel table{border-collapse:collapse;width:100%;margin:8px 0 14px;font-size:12px}.tind-rel th,.tind-rel td{border:1px solid #bbb;padding:4px 6px;text-align:left;vertical-align:top}.tind-rel th{background:#f1efe6}.tind-rel .av{border-left:3px solid #b8652f;padding:4px 10px;margin:8px 0;color:#5a3a1a;background:#fbf6ee}.tind-rel .rp{margin-top:20px;font-size:11px;color:#666;border-top:1px solid #999;padding-top:6px}.tind-rel .nf{white-space:pre-wrap;border:1px solid #bbb;padding:8px;min-height:40px}.tind-rel .np{font-size:12px}@media print{@page{size:A4;margin:14mm}body.tind-print *{visibility:hidden}body.tind-print .tind-rel,body.tind-print .tind-rel *{visibility:visible}body.tind-print .tind-rel{position:absolute;left:0;top:0;width:100%;max-width:none;padding:0}.tind-rel .np{display:none!important}}</style><script>document.body&&document.body.classList.add("tind-print");document.addEventListener("DOMContentLoaded",function(){document.body.classList.add("tind-print");});</script>';
	$h .= '<div class="tind-rel"><p class="np"><a href="' . esc_url( home_url( '/oficina/#indicadores' ) ) . '">← Oficina</a> · <a href="#" onclick="window.print();return false">Imprimir ou guardar em PDF</a> · <a href="' . esc_url( add_query_arg( array( 'formato' => $fmt, '_wpnonce' => wp_create_nonce( 'wp_rest' ) ), rest_url( 'tcd/v1/org/relatorio' ) ) ) . '">CSV</a></p>';
	$h .= '<p class="k">IPR Atlas · ' . esc_html( $nomes[ $fmt ] ) . '</p><h1>' . esc_html( $o['nome'] ) . '</h1><p>' . esc_html( $t['titulo'] ) . ' · ' . esc_html( wp_date( 'j/n/Y' ) ) . ( ! empty( $o['inicio'] ) ? ' · período de trabalho desde ' . esc_html( wp_date( 'j/n/Y', (int) $o['inicio'] ) ) : '' ) . '</p>';
	foreach ( $t['avisos'] as $a ) { $h .= '<p class="av">' . esc_html( $a ) . '</p>'; }
	$ult = null; $aberta = false;
	foreach ( $t['linhas'] as $l ) {
		if ( $t['grupo'] >= 0 && $l[ $t['grupo'] ] !== $ult ) { if ( $aberta ) { $h .= '</tbody></table>'; } $ult = $l[ $t['grupo'] ]; $h .= '<h2>' . esc_html( $ult ) . '</h2><table><thead><tr>'; foreach ( $t['cab'] as $ci => $c ) { if ( $ci !== $t['grupo'] ) { $h .= '<th>' . esc_html( $c ) . '</th>'; } } $h .= '</tr></thead><tbody>'; $aberta = true; }
		elseif ( ! $aberta ) { $h .= '<table><thead><tr>'; foreach ( $t['cab'] as $c ) { $h .= '<th>' . esc_html( $c ) . '</th>'; } $h .= '</tr></thead><tbody>'; $aberta = true; }
		$h .= '<tr>'; foreach ( $l as $ci => $c ) { if ( $ci !== $t['grupo'] ) { $h .= '<td>' . esc_html( $c ) . '</td>'; } } $h .= '</tr>';
	}
	if ( $aberta ) { $h .= '</tbody></table>'; }
	if ( 'elsp' === $fmt ) { $h .= '<h2>O que não funcionou</h2><div class="nf">' . esc_html( tcd_ind_texto( $org, 'nao_funcionou' ) ) . '</div>'; if ( tcd_org_pode( $u, 'gerir', $org ) ) { $h .= '<div class="np">' . tcd_ind_form( 'texto', '<textarea name="texto" rows="4" style="width:100%;max-width:700px" maxlength="4000" placeholder="O que não funcionou e o que mudou">' . esc_html( tcd_ind_texto( $org, 'nao_funcionou' ) ) . '</textarea><br>', 'Guardar o texto' ) . '</div>'; } }
	return $h . '<p class="rp">Gerado no IPR Atlas · ' . esc_html( wp_date( 'j/n/Y H:i' ) ) . ' · Linha de base e meta vêm da candidatura; a série é o que a organização mediu.</p></div>';
}
add_filter( 'do_shortcode_tag', function ( $out, $tag ) {
	if ( 'tcd_oficina' !== $tag || ! tcd_ind_on() || empty( $_GET['relatorio'] ) || ! is_user_logged_in() ) { return $out; } // phpcs:ignore
	$fmt = sanitize_key( wp_unslash( $_GET['relatorio'] ) ); if ( ! in_array( $fmt, array( 'life', 'elsp', 'anual', 'art17', 'e4' ), true ) ) { return $out; } // phpcs:ignore
	$u = wp_get_current_user(); $org = tcd_org_de( $u ); if ( ! $org ) { return $out; }
	return tcd_ind_relatorio_html( $org, $fmt, $u );
}, 22, 2 );
add_action( 'rest_api_init', function () {
	register_rest_route( 'tcd/v1', '/org/relatorio', array( 'methods' => 'GET', 'permission_callback' => function () { return tcd_ind_on() && is_user_logged_in() && tcd_org_de( wp_get_current_user() ) > 0; }, 'callback' => function ( WP_REST_Request $q ) {
		$u = wp_get_current_user(); $org = tcd_org_de( $u ); $fmt = sanitize_key( (string) $q['formato'] ); if ( ! in_array( $fmt, array( 'life', 'elsp', 'anual', 'art17', 'e4' ), true ) ) { $fmt = 'anual'; }
		$k = 'tcd_ind_x_' . $u->ID; if ( get_transient( $k ) ) { return new WP_Error( 'ritmo', 'Já exportou há pouco. Espere um minuto.', array( 'status' => 429 ) ); } set_transient( $k, 1, MINUTE_IN_SECONDS );
		$csv = tcd_ind_csv( tcd_ind_tabela( $org, $fmt, $u ) );
		if ( defined( 'TCD_TESTE' ) ) { return new WP_REST_Response( $csv ); }
		header( 'Content-Type: text/csv; charset=utf-8' ); header( 'Content-Disposition: attachment; filename="ipr-atlas-relatorio-' . $fmt . '-' . (int) $org . '-' . wp_date( 'Y-m-d' ) . '.csv"' ); header( 'Cache-Control: private, no-store' ); echo $csv; exit; // phpcs:ignore
	} ) );
} );

// ---------- acções (admin-post, nonce) ----------
function tcd_ind_form( $op, $campos, $botao, $cls = '' ) { return '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" class="' . esc_attr( 'tind-f ' . $cls ) . '"><input type="hidden" name="action" value="tcd_ind_acao"><input type="hidden" name="op" value="' . esc_attr( $op ) . '">' . wp_nonce_field( 'tcd_ind', '_wpnonce', true, false ) . $campos . '<button type="submit">' . esc_html( $botao ) . '</button></form>'; }
add_action( 'admin_post_tcd_ind_acao', function () {
	check_admin_referer( 'tcd_ind' );
	$u = wp_get_current_user(); $org = tcd_org_de( $u ); $op = sanitize_key( $_POST['op'] ?? '' ); $msg = ''; $anc = 'indicadores'; // phpcs:ignore
	if ( ! tcd_ind_on() || ! $org ) { wp_die( 'Sem acesso.' ); }
	$gere = tcd_org_pode( $u, 'gerir', $org ); $edita = tcd_org_pode( $u, 'editar', $org );
	$k = 'tcd_ind_a_' . $u->ID; $n = (int) get_transient( $k ); if ( $n >= 120 ) { wp_die( 'Muitas alterações numa hora. Tente mais tarde.' ); } set_transient( $k, $n + 1, HOUR_IN_SECONDS );
	if ( 'registar' === $op ) {
		if ( ! $edita ) { wp_die( 'Sem acesso.' ); } $d = tcd_ind_dados( (int) ( $_POST['iid'] ?? 0 ) ); if ( ! $d || (int) $d['org'] !== $org ) { wp_die( 'Sem acesso.' ); } // phpcs:ignore
		$r = tcd_ind_registar( $d['id'], (int) ( $_POST['ano'] ?? 0 ), wp_unslash( $_POST['valor'] ?? '' ), wp_unslash( $_POST['nota'] ?? '' ), $u ); $msg = is_wp_error( $r ) ? $r->get_error_message() : 'Valor registado.'; // phpcs:ignore
	} elseif ( in_array( $op, array( 'novo', 'adoptar', 'texto', 'score', 'activo', 'editar' ), true ) ) {
		if ( ! $gere ) { wp_die( 'Sem acesso.' ); }
		if ( 'novo' === $op ) { $def = wp_unslash( $_POST ); if ( ! empty( $def['origem_soma'] ) ) { $def['origem'] = $def['origem_soma']; } $def['linha_base'] = array( 'valor' => $def['lb_valor'] ?? null, 'ano' => $def['lb_ano'] ?? 0, 'metodo' => $def['lb_metodo'] ?? '' ); $def['meta'] = array( 'valor' => $def['meta_valor'] ?? null, 'ano' => $def['meta_ano'] ?? 0 ); $r = tcd_ind_criar( $org, $def, $u ); $msg = is_wp_error( $r ) ? $r->get_error_message() : 'Indicador criado.'; } // phpcs:ignore
		elseif ( 'editar' === $op ) { $d = tcd_ind_dados( (int) ( $_POST['iid'] ?? 0 ) ); if ( $d && (int) $d['org'] === $org ) { $p = wp_unslash( $_POST ); $d['meta'] = array( 'valor' => tcd_ind_num( $p['meta_valor'] ?? null ), 'ano' => (int) ( $p['meta_ano'] ?? 0 ) ?: null ); $d['linha_base'] = array( 'valor' => tcd_ind_num( $p['lb_valor'] ?? null ), 'ano' => (int) ( $p['lb_ano'] ?? 0 ) ?: null, 'metodo' => mb_substr( sanitize_text_field( (string) ( $p['lb_metodo'] ?? '' ) ), 0, 200 ) ); $d['justificacao'] = mb_substr( sanitize_textarea_field( (string) ( $p['justificacao'] ?? '' ) ), 0, 1000 ); $d['codigo_accao'] = mb_substr( sanitize_text_field( (string) ( $p['codigo_accao'] ?? '' ) ), 0, 12 ); $d['responsavel'] = isset( tcd_org_membros( $org )[ (int) ( $p['responsavel'] ?? 0 ) ] ) ? (int) $p['responsavel'] : 0; tcd_ind_guardar( $d['id'], $d ); $msg = 'Indicador alterado.'; } } // phpcs:ignore
		elseif ( 'activo' === $op ) { $d = tcd_ind_dados( (int) ( $_POST['iid'] ?? 0 ) ); if ( $d && (int) $d['org'] === $org ) { $d['activo'] = (int) ! empty( $_POST['v'] ); tcd_ind_guardar( $d['id'], $d ); $msg = $d['activo'] ? 'Indicador reactivado.' : 'Indicador desactivado (a série fica guardada).'; } } // phpcs:ignore
		elseif ( 'adoptar' === $op ) { $msg = tcd_ind_adoptar( $org, $u ) . ' indicadores adoptados.'; }
		elseif ( 'texto' === $op ) { if ( tcd_org_so_leitura( $org ) ) { wp_die( 'Só leitura.' ); } $r = get_post_meta( $org, '_tcd_org_rel', true ); $r = is_array( $r ) ? $r : array(); $r['nao_funcionou'] = mb_substr( sanitize_textarea_field( wp_unslash( $_POST['texto'] ?? '' ) ), 0, 4000 ); update_post_meta( $org, '_tcd_org_rel', $r ); $msg = 'Texto guardado.'; } // phpcs:ignore
		elseif ( 'score' === $op ) { $anc = 'score'; $r = tcd_ind_score_guardar( $org, (int) ( $_POST['ano'] ?? 0 ), (array) ( $_POST['c'] ?? array() ), wp_unslash( $_POST['painel'] ?? '' ), $u ); $msg = is_wp_error( $r ) ? $r->get_error_message() : 'Avaliação guardada.'; } // phpcs:ignore
	}
	set_transient( 'tcd_of_msg_' . $u->ID, $msg, 60 ); // o bloco é pedido por REST sem a query da página; a mensagem vai por transient
	wp_safe_redirect( add_query_arg( 'ind_msg', rawurlencode( $msg ), home_url( '/oficina/' ) ) . '#' . $anc ); if ( ! defined( 'TCD_TESTE' ) ) { exit; }
} );

// ---------- blocos na Oficina ----------
add_filter( 'tcd_of_blocos', function ( $b ) {
	$u = wp_get_current_user(); if ( ! tcd_ind_on() || ! tcd_org_de( $u ) ) { return $b; }
	$ind = array( 't' => 'Indicadores', 'k' => 'Monitorização', 'f' => 'tcd_ind_bloco', 'w' => 2, 'cache' => 0 ); $sc = array( 't' => 'Rewilding score', 'k' => 'Monitorização', 'f' => 'tcd_ind_bloco_score', 'w' => 1, 'cache' => 0 );
	$novo = array(); foreach ( $b as $k => $v ) { $novo[ $k ] = $v; if ( 'camadas' === $k ) { $novo['indicadores'] = $ind; $novo['score'] = $sc; } }
	if ( ! isset( $novo['indicadores'] ) ) { $novo = array( 'indicadores' => $ind, 'score' => $sc ) + $novo; }
	return $novo;
}, 7 );
function tcd_ind_css() { return '<style>.tind-t{width:100%;border-collapse:collapse;font-size:12px}.tind-t th,.tind-t td{padding:5px 6px;border-bottom:1px solid var(--ln);text-align:left;vertical-align:top}.tind-t th{font-weight:600;color:var(--mu);font-size:11px}.tind-t td.n{text-align:right;white-space:nowrap}.tind-f{margin:0;display:inline-flex;gap:4px;align-items:center;flex-wrap:wrap}.tind-f button{font:600 12px Inter,sans-serif;border:1px solid var(--ln);border-radius:8px;padding:4px 9px;background:var(--p);color:var(--ac2);cursor:pointer}.tind-f.s button{color:var(--te)}.tind-f input,.tind-f select,.tind-f textarea{font:12px Inter,sans-serif;border:1px solid var(--ln);border-radius:8px;padding:3px 6px;background:var(--p);color:var(--tx)}.tind-f input[type=number]{width:80px}.tind-f label{font-size:12px;color:var(--mu);display:inline-flex;gap:3px;align-items:center}.tind-q{margin-top:10px;font-size:13px}.tind-q summary{cursor:pointer;color:var(--ac2);font-weight:600}.tind-g{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:6px;margin:6px 0}.tind-g label{display:flex;flex-direction:column;gap:2px}.tind-b{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}.tind-svg{max-width:100%;height:auto;display:block;margin:6px auto}.tind-c{display:grid;gap:8px;margin:6px 0}.tind-c label{display:grid;grid-template-columns:1fr auto;gap:4px;font-size:12px;color:var(--mu)}.tind-c textarea{grid-column:1/-1;min-height:34px}.tind-av{border-left:3px solid var(--te);padding:4px 10px;margin:8px 0;font-size:12px;color:var(--mu)}</style>'; }
function tcd_ind_bloco( $u ) {
	$org = tcd_org_de( $u ); if ( ! $org ) { return ''; } $o = tcd_org_dados( $org ); $gere = tcd_org_pode( $u, 'gerir', $org ); $edita = tcd_org_pode( $u, 'editar', $org ); $lista = tcd_ind_lista( $org, $gere ); $dim = tcd_ind_dimensoes(); $qs = tcd_ind_quadros(); $ano = (int) wp_date( 'Y' ); $m = tcd_org_membros( $org );
	$h = '<div id="indicadores">' . tcd_ind_css() . '<p class="tof-vz">Linha de base e meta vêm da candidatura; a série é o que mediste.</p>';
	$msg = get_transient( 'tcd_of_msg_' . $u->ID ); if ( $msg ) { delete_transient( 'tcd_of_msg_' . $u->ID ); $h .= '<p class="tof-vz" role="status">' . esc_html( $msg ) . '</p>'; }
	if ( ! $lista ) { $h .= tcd_of_vazio( 'Ainda não há indicadores.' ); }
	foreach ( $dim as $dk => $dn ) {
		$do = array_filter( $lista, function ( $i ) use ( $dk ) { return $i['dimensao'] === $dk; } ); if ( ! $do ) { continue; }
		$h .= '<p class="tof-k" style="margin-top:10px">' . esc_html( $dn ) . '</p><table class="tind-t"><thead><tr><th>Indicador</th><th>Unidade</th><th>Linha de base</th><th>Meta</th><th>Último valor</th><th></th><th>Desvio</th><th>Quadros</th><th>Origem</th>' . ( $edita ? '<th>Registar</th>' : '' ) . '</tr></thead><tbody>';
		foreach ( $do as $i ) {
			$v = tcd_ind_valor( $i ); $dv = tcd_ind_desvio( $i ); $pills = ''; foreach ( (array) $i['quadros'] as $q ) { $pills .= '<span class="tof-pill">' . esc_html( $qs[ $q ] ?? $q ) . '</span> '; }
			$h .= '<tr' . ( empty( $i['activo'] ) ? ' style="opacity:.5"' : '' ) . '><td><b>' . esc_html( $i['nome'] ) . '</b>' . ( ! empty( $i['essencial'] ) ? ' <span class="tof-pill" title="Indicador essencial">essencial</span>' : '' ) . ( empty( $i['activo'] ) ? ' <span class="tof-pill">desactivado</span>' : '' ) . ( $i['metodo'] ? '<br><small class="tof-vz">' . esc_html( mb_substr( $i['metodo'], 0, 120 ) ) . '</small>' : '' ) . '</td><td>' . esc_html( $i['unidade'] ) . '</td>'
				. '<td class="n">' . esc_html( tcd_ind_fmt( $i['linha_base']['valor'] ) . ( $i['linha_base']['ano'] ? ' (' . $i['linha_base']['ano'] . ')' : '' ) ) . '</td><td class="n">' . esc_html( tcd_ind_fmt( $i['meta']['valor'] ) . ( $i['meta']['ano'] ? ' (' . $i['meta']['ano'] . ')' : '' ) ) . '</td>'
				. '<td class="n">' . ( $v ? esc_html( tcd_ind_fmt( $v['valor'] ) . ' (' . $v['ano'] . ')' ) : '<span class="tof-vz">sem valor</span>' ) . '</td><td>' . esc_html( tcd_ind_tendencia( $i ) ) . '</td>'
				. '<td class="n">' . ( $dv ? esc_html( tcd_ind_fmt( $dv['abs'] ) . ( null !== $dv['pct'] ? ' (' . tcd_ind_fmt( $dv['pct'], 1 ) . ' %)' : '' ) ) : '' ) . '</td><td>' . $pills . '</td><td>' . ( tcd_ind_auto( $i ) ? '<span class="tof-pill" title="' . esc_attr( $i['origem'] . ' · o valor do ano é recalculado das camadas; registos à mão nesse ano são substituídos' ) . '">automático</span>' : 'manual' ) . '</td>';
			if ( $edita ) { $h .= '<td>' . ( ! empty( $i['activo'] ) ? tcd_ind_form( 'registar', '<input type="hidden" name="iid" value="' . (int) $i['id'] . '"><input type="number" name="ano" value="' . $ano . '" min="1990" max="2100"><input type="text" name="valor" placeholder="valor" size="7" required><input type="text" name="nota" placeholder="nota" size="14" maxlength="1000">', 'Guardar' ) : '' )
				. ( $gere ? '<details class="tind-q"><summary>Editar</summary>' . tcd_ind_form( 'editar', '<input type="hidden" name="iid" value="' . (int) $i['id'] . '"><div class="tind-g">' . tcd_ind_campos( $i, $m ) . '</div>', 'Guardar' ) . tcd_ind_form( 'activo', '<input type="hidden" name="iid" value="' . (int) $i['id'] . '"><input type="hidden" name="v" value="' . ( empty( $i['activo'] ) ? '1' : '0' ) . '">', empty( $i['activo'] ) ? 'Reactivar' : 'Desactivar', 's' ) . '</details>' : '' ) . '</td>'; }
			$h .= '</tr>';
		}
		$h .= '</tbody></table>';
	}
	$h .= '<div class="tind-b">'; foreach ( array( 'life' => 'Relatório LIFE', 'elsp' => 'Relatório ELSP', 'anual' => 'Relatório anual', 'art17' => 'Art. 17', 'e4' => 'ESRS E4' ) as $k => $t ) { $h .= tcd_of_btn( $t, home_url( '/oficina/?relatorio=' . $k ), 'anual' === $k ); } $h .= '</div>';
	if ( $gere && 'activa' === $o['estado'] ) {
		$h .= '<div class="tind-b">' . tcd_ind_form( 'adoptar', '', 'Adoptar indicadores dos modelos' ) . '</div><details class="tind-q"><summary>Novo indicador</summary>';
		$dsel = ''; foreach ( $dim as $k => $t ) { $dsel .= '<option value="' . esc_attr( $k ) . '">' . esc_html( $t ) . '</option>'; } $qck = ''; foreach ( $qs as $k => $t ) { $qck .= '<label><input type="checkbox" name="quadros[]" value="' . esc_attr( $k ) . '"> ' . esc_html( $t ) . '</label> '; }
		$gsel = '<option value="manual">manual</option>'; foreach ( tcd_cam_grupos( $org ) as $gk => $gx ) { $gsel .= '<option value="grupo_ha:' . esc_attr( $gk ) . '">ha das camadas: ' . esc_html( $gx['nome'] ) . '</option><option value="grupo_n:' . esc_attr( $gk ) . '">n de elementos: ' . esc_html( $gx['nome'] ) . '</option>'; }
		$asel = '<option value="">pela dimensão</option>'; foreach ( tcd_ind_areas_life() as $k => $t ) { $asel .= '<option value="' . esc_attr( $k ) . '">' . esc_html( $t ) . '</option>'; }
		$h .= tcd_ind_form( 'novo', '<div class="tind-g"><label>Nome<input type="text" name="nome" maxlength="90" required></label><label>Unidade<input type="text" name="unidade" maxlength="30" placeholder="ha, n, casais, horas"></label><label>Dimensão<select name="dimensao">' . $dsel . '</select></label><label>Periodicidade<input type="text" name="periodicidade" value="anual" maxlength="40"></label><label>Origem<select name="origem">' . $gsel . '</select></label><label>Ou soma de uma propriedade<input type="text" name="origem_soma" placeholder="grupo_soma:fauna:n_ind" maxlength="90"></label><label>Custo (1 a 3)<input type="number" name="custo" value="1" min="1" max="3"></label><label>Área LIFE<select name="area_life">' . $asel . '</select></label>' . tcd_ind_campos( array(), $m ) . '<label>Método<textarea name="metodo" rows="2" maxlength="1000"></textarea></label></div><p><label><input type="checkbox" name="essencial" value="1"> essencial</label> ' . $qck . '</p>', 'Criar indicador' ) . '</details>';
	}
	return $h . '</div>';
}
function tcd_ind_campos( $i, $m ) { $lb = $i['linha_base'] ?? array(); $mt = $i['meta'] ?? array(); return '<label>Linha de base<input type="text" name="lb_valor" value="' . esc_attr( tcd_ind_fmt( $lb['valor'] ?? null ) ) . '" size="6"></label><label>Ano da base<input type="number" name="lb_ano" value="' . esc_attr( $lb['ano'] ?? '' ) . '" min="1990" max="2100"></label><label>Método da base<input type="text" name="lb_metodo" value="' . esc_attr( $lb['metodo'] ?? '' ) . '" maxlength="200"></label><label>Meta<input type="text" name="meta_valor" value="' . esc_attr( tcd_ind_fmt( $mt['valor'] ?? null ) ) . '" size="6"></label><label>Ano da meta<input type="number" name="meta_ano" value="' . esc_attr( $mt['ano'] ?? '' ) . '" min="1990" max="2100"></label><label>Código de acção<input type="text" name="codigo_accao" value="' . esc_attr( $i['codigo_accao'] ?? '' ) . '" maxlength="12" placeholder="C1"></label><label>Responsável<select name="responsavel"><option value="0">—</option>' . tcd_ind_opcoes_membros( $m, (int) ( $i['responsavel'] ?? 0 ) ) . '</select></label><label>Justificação do desvio<input type="text" name="justificacao" value="' . esc_attr( $i['justificacao'] ?? '' ) . '" maxlength="1000"></label>'; }
function tcd_ind_opcoes_membros( $m, $sel ) { $s = ''; foreach ( $m as $uid => $x ) { if ( 'activo' === ( $x['estado'] ?? '' ) ) { $s .= '<option value="' . (int) $uid . '"' . selected( (int) $uid, $sel, false ) . '>' . esc_html( $x['nome'] ?? '' ) . '</option>'; } } return $s; }
function tcd_ind_bloco_score( $u ) {
	$org = tcd_org_de( $u ); if ( ! $org ) { return ''; } $o = tcd_org_dados( $org ); $gere = tcd_org_pode( $u, 'gerir', $org ); $sc = tcd_ind_scores( $org ); $comp = tcd_ind_componentes(); $ano = (int) wp_date( 'Y' );
	$h = '<div id="score">' . tcd_ind_css() . '<p class="tind-av">A pontuação máxima não é o objectivo por defeito (Torres et al. 2018); registe o parecer pericial como dado.</p>';
	if ( ! $sc ) { $h .= tcd_of_vazio( 'Ainda não há avaliações. Dois eixos: forçamento humano (entradas e saídas materiais da gestão) e integridade ecológica (estocasticidade, perturbação, conectividade, complexidade trófica).' ); }
	else {
		$h .= tcd_ind_score_svg( $org ) . '<table class="tind-t"><thead><tr><th>Ano</th>'; foreach ( array_keys( $comp ) as $k ) { $h .= '<th title="' . esc_attr( $comp[ $k ] ) . '">' . esc_html( $k ) . '</th>'; } $h .= '<th>Humano</th><th>Integridade</th><th>Painel</th></tr></thead><tbody>';
		foreach ( $sc as $a => $s ) { $e = tcd_ind_score_eixos( $s ); $h .= '<tr><td>' . (int) $a . '</td>'; foreach ( array_keys( $comp ) as $k ) { $h .= '<td class="n" title="' . esc_attr( $s['componentes'][ $k ]['parecer'] ?? '' ) . '">' . esc_html( tcd_ind_fmt( (float) ( $s['componentes'][ $k ]['valor'] ?? 0 ), 1 ) ) . '</td>'; } $h .= '<td class="n">' . esc_html( tcd_ind_fmt( $e['humano'] ) ) . '</td><td class="n">' . esc_html( tcd_ind_fmt( $e['integridade'] ) ) . '</td><td><small>' . esc_html( $s['painel'] ?? '' ) . '</small></td></tr>'; }
		$h .= '</tbody></table>';
	}
	if ( $gere && 'activa' === $o['estado'] ) {
		$act = $sc[ $ano ] ?? null; $f = '<label>Ano <input type="number" name="ano" value="' . $ano . '" min="1990" max="2100"></label><div class="tind-c">';
		foreach ( $comp as $k => $t ) { $c = $act['componentes'][ $k ] ?? array(); $v = (float) ( $c['valor'] ?? 2.5 ); $f .= '<label>' . esc_html( $k . '. ' . $t ) . ' <output>' . esc_html( tcd_ind_fmt( $v, 1 ) ) . '</output><input type="range" name="c[' . $k . '][valor]" min="0" max="5" step="0.5" value="' . esc_attr( $v ) . '" oninput="this.previousElementSibling.value=this.value" style="grid-column:1/-1"><textarea name="c[' . $k . '][parecer]" maxlength="1500" placeholder="Parecer do perito">' . esc_html( $c['parecer'] ?? '' ) . '</textarea><input type="text" name="c[' . $k . '][evidencia]" maxlength="200" placeholder="evidência: códigos de indicadores, separados por vírgula" value="' . esc_attr( implode( ', ', (array) ( $c['evidencia'] ?? array() ) ) ) . '" style="grid-column:1/-1"></label>'; }
		$f .= '</div><label>Painel (nomes dos peritos) <input type="text" name="painel" maxlength="300" value="' . esc_attr( $act['painel'] ?? '' ) . '" size="30"></label><br>';
		$h .= '<details class="tind-q"' . ( $sc ? '' : ' open' ) . '><summary>Avaliação de ' . $ano . ( $act ? ' (substitui a existente)' : '' ) . '</summary>' . tcd_ind_form( 'score', $f, 'Guardar avaliação' ) . '</details>';
	}
	return $h . '</div>';
}
