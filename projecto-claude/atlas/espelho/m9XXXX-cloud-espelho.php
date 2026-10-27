<?php
// Módulo 90132: espelho do site para a IPR Cloud e separador Cloud do Atlas (pedido do Nuno, 20/10/2026).
// Só leitura. O sincronizador do motor lê GET /tcd/v1/cloud/espelho (X-TCD-Token, tcd_wk_auth do m14618)
// e o Atlas lê GET /tcd/v1/cloud/meus (sessão). Especificação: atlas/ipr-cloud-sincronizacao-site-2026-10-20.md.
// Regras: pessoas ligadas a terrenos só por user_id confirmado (encomenda paga de conta com sessão);
// o papel Web nunca entra. Só escreve a opção tcd_ce_ultima (hora da última sincronização) e uma cache de 30 min.
if ( ! defined( 'ABSPATH' ) ) { exit; }

define( 'TCD_CE_SERVICO', 'ipr-servico' );
define( 'TCD_CE_SSO', 'terracrua' );
define( 'TCD_CE_URL', 'https://cloud.terracruadesign.pt' );

// Na Cloud o nome tem de ter pelo menos 3 caracteres: u01, u04, u187.
function tcd_ce_u( $uid ) { return sprintf( 'u%02d', intval( $uid ) ); }

function tcd_ce_pessoa( $u ) {
	$u = is_object( $u ) ? $u : get_userdata( intval( $u ) );
	if ( ! $u ) { return null; }
	$nome = trim( (string) $u->first_name );
	$apel = trim( (string) $u->last_name );
	if ( '' === $nome ) { $nome = (string) $u->display_name; }
	return array( 'utilizador' => tcd_ce_u( $u->ID ), 'email' => strtolower( $u->user_email ),
		'nome' => mb_substr( $nome, 0, 150 ), 'apelido' => mb_substr( $apel, 0, 150 ), 'sso' => intval( $u->ID ) );
}

// Papel da equipa (m90055). Web fica fora da Cloud.
function tcd_ce_papel_eq( $uid ) {
	return function_exists( 'tcd_pg_papel' ) ? (string) tcd_pg_papel( intval( $uid ) ) : '';
}

// Contas que pagaram encomendas ligadas a um terreno: a única ligação por user_id que o site tem hoje.
function tcd_ce_compradores( $dados ) {
	$uids = array();
	$ids = isset( $dados['lig']['encomendas'] ) ? (array) $dados['lig']['encomendas'] : array();
	foreach ( $ids as $oid ) {
		if ( ! function_exists( 'wc_get_order' ) ) { break; }
		$o = wc_get_order( intval( $oid ) );
		if ( ! $o || ! in_array( $o->get_status(), array( 'completed', 'processing' ), true ) ) { continue; }
		$cid = intval( $o->get_customer_id() );
		if ( $cid > 0 && ! in_array( $cid, $uids, true ) ) { $uids[] = $cid; }
	}
	return $uids; // pela ordem das encomendas: o primeiro é o dono
}

// Projectos adjudicados (m90068): proposta aceite -> pedido -> terreno.
function tcd_ce_adjudicados() {
	$out = array();
	$q = get_posts( array( 'post_type' => 'tcd_proposta', 'post_status' => 'any',
		'meta_key' => '_tcd_pr_estado', 'meta_value' => 'aceite', 'fields' => 'ids', 'numberposts' => -1 ) );
	foreach ( $q as $pid ) {
		if ( function_exists( 'tcd_pr_dados' ) ) {
			$d = (array) tcd_pr_dados( $pid );
			if ( ! empty( $d['teste'] ) ) { continue; }
		}
		$prj = (array) get_post_meta( $pid, '_tcd_prj', true );
		if ( isset( $prj['estado'] ) && 'entregue' === $prj['estado'] ) { continue; }
		$ped = intval( get_post_meta( $pid, '_tcd_pr_pedido', true ) );
		$ter = $ped ? intval( get_post_meta( $ped, '_tcd_terreno', true ) ) : 0;
		if ( $ter > 0 ) { $out[ $ter ] = array( 'proposta' => $pid, 'resp' => intval( $prj['resp'] ?? 0 ) ); }
	}
	return $out;
}

// Cache de 30 min: percorre terrenos e encomendas, não pode correr a cada pedido (guarda de carga, m90110).
// O motor reconstrói de 15 em 15 min por /espelho; o /meus só lê a cache e, se faltar, só um pedido a reconstrói.
function tcd_ce_dependencias() {
	foreach ( array( 'tcd_pg_pessoas', 'tcd_pg_papel', 'tcd_cdt_codigo', 'wc_get_order', 'tcd_cl_estado', 'tcd_cl_planos' ) as $f ) {
		if ( ! function_exists( $f ) ) { return $f; }
	}
	return '';
}

function tcd_ce_construir( $fresco = false ) {
	$c = $fresco ? false : get_transient( 'tcd_ce_cache' );
	if ( is_array( $c ) ) { return $c; }
	if ( ! $fresco ) {
		if ( get_transient( 'tcd_ce_trinco' ) ) { return null; }
		set_transient( 'tcd_ce_trinco', 1, MINUTE_IN_SECONDS );
	}
	$r = tcd_ce_construir_ja();
	set_transient( 'tcd_ce_cache', $r, 30 * MINUTE_IN_SECONDS );
	delete_transient( 'tcd_ce_trinco' );
	return $r;
}

function tcd_ce_construir_ja() {
	$avisos = array();
	$pessoas = array();
	$add = function ( $uid ) use ( &$pessoas ) {
		$p = tcd_ce_pessoa( $uid );
		if ( $p ) { $pessoas[ $p['utilizador'] ] = $p; return $p['utilizador']; }
		return null;
	};

	// 1. Equipa e organização IPR (sem o papel Web e sem a conta partilhada info@).
	$equipa = function_exists( 'tcd_pg_pessoas' ) ? tcd_pg_pessoas() : array();
	$dono_ipr = null; $membros = array(); $papeis = array();
	foreach ( $equipa as $u ) {
		$papel = tcd_ce_papel_eq( $u->ID );
		if ( 'web' === $papel || '' === $papel ) { continue; }
		$k = $add( $u );
		$papeis[ $k ] = $papel;
		if ( 'direccao' === $papel && ! $dono_ipr ) { $dono_ipr = $k; continue; }
		$membros[] = array( 'utilizador' => $k, 'papel' => 'direccao' === $papel ? 'admin' : 'member' );
	}
	if ( ! $dono_ipr ) { $avisos[] = 'sem pessoa com papel direccao: organizacao ipr nao gerada'; }
	$equipas = array();
	$grupos = (array) get_option( 'tcd_grupos', array() );
	foreach ( $grupos as $slug => $g ) {
		if ( 'web' === $slug || ! preg_match( '/^[a-z][a-z0-9_-]+$/', (string) $slug ) ) { continue; }
		$m = array();
		foreach ( array_keys( $papeis ) as $k ) {
			$uid = intval( substr( $k, 1 ) );
			if ( ! empty( $g['todos'] ) || in_array( $uid, array_map( 'intval', (array) ( $g['membros'] ?? array() ) ), true ) ) { $m[] = $k; }
		}
		$equipas[] = array( 'nome' => $slug, 'membros' => $m );
	}
	$orgs = array();
	if ( $dono_ipr ) {
		$orgs['ipr'] = array( 'nome' => 'ipr', 'titulo' => 'Terracrua Design', 'dono' => $dono_ipr,
			'convites' => 50, 'membros' => $membros, 'equipas' => $equipas );
	}
	$leitores = array(); $gestores = array();
	foreach ( $papeis as $k => $p ) {
		if ( in_array( $p, array( 'coordenacao', 'imobiliario' ), true ) ) { $leitores[] = $k; }
		if ( 'socio' === $p ) { $gestores[] = $k; }
	}

	// 2. Terrenos: Base (organização do cliente) e desenho (organização gerida pela Terracrua Design).
	$planos = function_exists( 'tcd_cl_planos' ) ? tcd_cl_planos() : array();
	$adj = tcd_ce_adjudicados();
	$projectos = array();
	$ters = get_posts( array( 'post_type' => 'tcd_terreno', 'post_status' => 'any', 'numberposts' => -1, 'fields' => 'ids' ) );
	foreach ( $ters as $tid ) {
		$cod = function_exists( 'tcd_cdt_codigo' ) ? (string) tcd_cdt_codigo( $tid ) : (string) get_post_meta( $tid, '_tcd_cdt_cod', true );
		if ( '' === $cod ) { continue; }
		$d = (array) get_post_meta( $tid, '_tcd_cdt', true );
		$comp = tcd_ce_compradores( $d );
		$desenho = isset( $adj[ $tid ] );
		if ( ! $comp && ! $desenho ) { continue; }
		if ( count( $comp ) > 1 ) { $avisos[] = "$cod: varios compradores, dono = o primeiro"; }
		$cli = $comp ? $add( $comp[0] ) : null;
		if ( $comp && ! $cli ) { $avisos[] = "$cod: comprador sem conta no site (apagada?)"; if ( ! $desenho ) { continue; } }
		if ( $desenho ) {
			if ( ! $cli ) { $avisos[] = "$cod: projecto adjudicado sem cliente confirmado por encomenda"; }
			$on = $cli ? 'tcd-c' . substr( $cli, 1 ) : 'tcd-t' . $tid;
			if ( ! isset( $orgs[ $on ] ) ) {
				$mem = array();
				if ( $dono_ipr ) { $mem[] = array( 'utilizador' => $dono_ipr, 'papel' => 'admin' ); }
				if ( $cli ) { $mem[] = array( 'utilizador' => $cli, 'papel' => 'member' ); }
				$orgs[ $on ] = array( 'nome' => $on, 'titulo' => $d['cliente'] ?? $cod, 'dono' => TCD_CE_SERVICO, 'membros' => $mem );
			}
			$col = array();
			$resp = $adj[ $tid ]['resp'];
			if ( $resp && isset( $papeis[ tcd_ce_u( $resp ) ] ) ) { $col[ tcd_ce_u( $resp ) ] = 'manager'; }
			foreach ( $gestores as $k ) { $col[ $k ] = 'manager'; }
			foreach ( $leitores as $k ) { if ( ! isset( $col[ $k ] ) ) { $col[ $k ] = 'reader'; } }
			if ( $cli ) { $col[ $cli ] = 'reporter'; }
			$lista = array();
			$ja = array();
			foreach ( $orgs[ $on ]['membros'] as $m ) { $ja[ $m['utilizador'] ] = true; }
			foreach ( $col as $k => $p ) {
				if ( $k === $dono_ipr ) { continue; }
				$lista[] = array( 'utilizador' => $k, 'papel' => $p );
				// a Cloud só aceita colaboradores que sejam membros da organização (papel por omissão vazio: sem acesso implícito)
				if ( empty( $ja[ $k ] ) ) { $orgs[ $on ]['membros'][] = array( 'utilizador' => $k, 'papel' => 'member' ); $ja[ $k ] = true; }
			}
			$projectos[] = array( 'org' => $on, 'nome' => $cod, 'terreno' => $tid, 'tipo' => 'desenho', 'colaboradores' => $lista );
		} else {
			$on = 'c' . substr( $cli, 1 );
			if ( ! isset( $orgs[ $on ] ) ) {
				$orgs[ $on ] = array( 'nome' => $on, 'titulo' => $d['cliente'] ?? $cod, 'dono' => $cli, 'membros' => array(),
					'convites' => intval( $planos['base']['pessoas'] ?? 3 ) );
			}
			$projectos[] = array( 'org' => $on, 'nome' => $cod, 'terreno' => $tid, 'tipo' => 'base', 'colaboradores' => array() );
		}
	}

	// 3. Profissionais com plano pago da Cloud: organização própria.
	$ac = (array) get_option( 'tcd_cloud_acessos', array() );
	foreach ( $ac as $email => $x ) {
		if ( ! function_exists( 'tcd_cl_estado' ) ) { break; }
		$e = tcd_cl_estado( $email );
		if ( empty( $e['plano'] ) || in_array( $e['plano'], array( 'nenhum', 'base' ), true ) ) { continue; }
		$u = get_user_by( 'email', $email );
		if ( ! $u ) { $avisos[] = "plano {$e['plano']} sem conta no site: " . substr( md5( $email ), 0, 8 ); continue; }
		$k = $add( $u );
		$on = 'p' . substr( $k, 1 );
		$orgs[ $on ] = array( 'nome' => $on, 'titulo' => $u->display_name, 'dono' => $k, 'membros' => array(),
			'plano' => $e['plano'], 'convites' => min( 9999, intval( $planos[ $e['plano'] ]['clientes'] ?? 3 ) ) );
	}

	return array( 'versao' => 1, 'gerado' => gmdate( 'c' ), 'conta_servico' => TCD_CE_SERVICO,
		'sso_fornecedor' => TCD_CE_SSO, 'pessoas' => array_values( $pessoas ),
		'organizacoes' => array_values( $orgs ), 'projectos' => $projectos, 'avisos' => $avisos );
}

// Vista do utilizador para o separador Cloud do Atlas: só o que lhe diz respeito.
function tcd_ce_meus() {
	$me = tcd_ce_u( get_current_user_id() );
	$e = tcd_ce_construir();
	if ( ! is_array( $e ) ) { return array( 'servidor' => TCD_CE_URL, 'terrenos' => array(), 'a_preparar' => true ); }
	$nomes = array();
	foreach ( $e['pessoas'] as $p ) { $nomes[ $p['utilizador'] ] = trim( $p['nome'] . ' ' . $p['apelido'] ); }
	$orgs = array();
	foreach ( $e['organizacoes'] as $o ) { $orgs[ $o['nome'] ] = $o; }
	$out = array();
	foreach ( $e['projectos'] as $pr ) {
		$o = $orgs[ $pr['org'] ] ?? array();
		$meu = null;
		if ( ( $o['dono'] ?? '' ) === $me ) { $meu = 'admin'; }
		foreach ( (array) ( $o['membros'] ?? array() ) as $m ) { if ( $m['utilizador'] === $me && 'admin' === $m['papel'] ) { $meu = 'admin'; } }
		foreach ( $pr['colaboradores'] as $c ) { if ( $c['utilizador'] === $me ) { $meu = $meu ?: $c['papel']; } }
		if ( ! $meu ) { continue; }
		$d = (array) get_post_meta( $pr['terreno'], '_tcd_cdt', true );
		$pess = array();
		foreach ( $pr['colaboradores'] as $c ) { $pess[] = array( 'nome' => $nomes[ $c['utilizador'] ] ?? '', 'papel' => $c['papel'] ); }
		$out[] = array( 'codigo' => $pr['nome'], 'nome' => (string) ( $d['nome'] ?? '' ), 'local' => (string) ( $d['local'] ?? '' ),
			'area_ha' => floatval( $d['area_ha'] ?? 0 ), 'centro' => $d['centro'] ?? null, 'bbox' => $d['bbox'] ?? null,
			'tipo' => $pr['tipo'], 'papel' => $meu, 'pessoas' => $pess, 'org' => $pr['org'] );
	}
	$plano = function_exists( 'tcd_cl_estado' ) ? tcd_cl_estado( wp_get_current_user()->user_email ) : array();
	$sinc = get_option( 'tcd_ce_ultima', array() );
	return array( 'servidor' => TCD_CE_URL, 'terrenos' => $out, 'plano' => $plano,
		'sincronizado' => is_array( $sinc ) ? ( $sinc['hora'] ?? null ) : null );
}

add_action( 'rest_api_init', function () {
	if ( function_exists( 'tcd_wk_auth' ) ) {
		register_rest_route( 'tcd/v1', '/cloud/espelho', array(
			'methods' => 'GET', 'permission_callback' => 'tcd_wk_auth',
			'callback' => function () {
				// sem as dependências o espelho sairia vazio e o motor desactivaria toda a gente: falha fechada
				$falta = tcd_ce_dependencias();
				if ( $falta ) { return new WP_Error( 'tcd_ce_dep', "falta $falta", array( 'status' => 503 ) ); }
				$r = rest_ensure_response( tcd_ce_construir( true ) );
				$r->header( 'Cache-Control', 'no-store' );
				return $r;
			},
		) );
		// O motor diz quando sincronizou (para o Atlas mostrar «sincronizado há X min»).
		register_rest_route( 'tcd/v1', '/cloud/espelho/estado', array(
			'methods' => 'POST', 'permission_callback' => 'tcd_wk_auth',
			'callback' => function ( WP_REST_Request $q ) {
				$x = array( 'hora' => gmdate( 'c' ), 'alteracoes' => intval( $q['alteracoes'] ), 'falhas' => intval( $q['falhas'] ) );
				update_option( 'tcd_ce_ultima', $x, false );
				return array( 'ok' => true );
			},
		) );
	}
	register_rest_route( 'tcd/v1', '/cloud/meus', array(
		'methods' => 'GET', 'permission_callback' => function () { return is_user_logged_in(); },
		'callback' => function () {
			$r = rest_ensure_response( tcd_ce_meus() );
			$r->header( 'Cache-Control', 'private, no-store' );
			return $r;
		},
	) );
}, 20 );

// Separador «Cloud» do Atlas: o ficheiro vive no Núcleo (assets/atlas/cloud.js) e só se carrega na página /atlas/ com sessão.
add_action( 'wp_enqueue_scripts', function () {
	if ( ! is_user_logged_in() || ! is_page( array( 14581, 'atlas' ) ) ) { return; }
	wp_enqueue_script( 'tcd-ce-atlas-cloud', content_url( 'plugins/terracrua-nucleo/assets/atlas/cloud.js' ), array(), 'efef4c250d', true );
}, 30 );
