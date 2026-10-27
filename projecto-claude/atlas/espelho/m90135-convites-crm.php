<?php
// Módulo 90135: Convites a profissionais (CRM) no Estúdio, /area-equipa/?v=convites (pedido do Nuno, 20/10/2026, 15h30).
// Lista de profissionais de Portugal e Espanha (importada por POST /tcd/v1/convites/importar com a lista em JSON, a partir
// da pesquisa de 20/10; nunca por ficheiro público), com ligação ao site, profissões, região, confiança, prioridade (A/B/C) e notas, para o Nuno ver quem vale a pena.
// Caixas por linha e caixas da oferta (3 meses Designer, 1 Base até 100 ha, Base até 10 ha, Intelligence 12 meses, Oficina,
// 3 meses Estúdio). Pré-visualização do e-mail (PT ou ES pelo país), ecrã de confirmação e só então o envio: empresas pelo
// site (wp_mail, Reply-To info@); pessoas singulares não recebem e-mail do site (consentimento prévio), o Nuno envia à mão
// e o registo fica na mesma. Cada envio cria um código PRO-XXXXXX ligado ao e-mail (opção tcd_convites), resgatado pelo m90136.
// Lembrete: 30 dias depois sem resposta, o convidado entra em «Para seguir» e o Nuno recebe um aviso no Telegram às 08h30.
// Só administradores. Rotas REST (manage_options): GET /tcd/v1/convites, POST /tcd/v1/convites/importar. Prefixo tcd_cv_.
// Interruptor: opção tcd_convites_off = 1.
if ( ! defined( 'ABSPATH' ) ) { exit; }

function tcd_cv_on() { return '1' !== (string) get_option( 'tcd_convites_off', '' ); }
function tcd_cv_pode() { return is_user_logged_in() && current_user_can( 'manage_options' ); }
function tcd_cv_ofertas() {
	return array(
		'org6' => array( 'IPR Cloud Organização, 6 meses', 'IPR Cloud Organização durante 6 meses (24 projectos, 30 convidados, 9 pessoas por projecto, Atlas Intelligence incluído)', 'IPR Cloud Organización durante 6 meses (24 proyectos, 30 clientes, 9 personas por proyecto, Atlas Intelligence incluido)' ),
		'designer12' => array( 'IPR Cloud Designer, 12 meses', 'IPR Cloud Designer durante 12 meses (3 projectos, 3 clientes, 3 pessoas por projecto, Atlas Intelligence incluído)', 'IPR Cloud Designer durante 12 meses (3 proyectos, 3 clientes, 3 personas por proyecto, Atlas Intelligence incluido)' ),
		'designer3' => array( 'IPR Cloud Designer, 3 meses', 'IPR Cloud Designer durante 3 meses (3 projectos, 3 clientes, 3 pessoas por projecto, Atlas Intelligence incluído)', 'IPR Cloud Designer durante 3 meses (3 proyectos, 3 clientes, 3 personas por proyecto, Atlas Intelligence incluido)' ),
		'base100'   => array( 'Base Cartográfica até 100 ha', 'uma Base Cartográfica de um terreno até 100 ha, sem custo (acima, paga só a diferença), com 12 meses de alojamento e de Intelligence', 'una Base Cartográfica de una finca de hasta 100 ha, sin coste (por encima, solo la diferencia), con 12 meses de alojamiento e Intelligence' ),
		'base10'    => array( 'Base Cartográfica até 10 ha', 'uma Base Cartográfica de um terreno até 10 ha, sem custo', 'una Base Cartográfica de una finca de hasta 10 ha, sin coste' ),
		'intel12'   => array( 'Atlas Intelligence, 12 meses', 'IPR Atlas Intelligence durante 12 meses', 'IPR Atlas Intelligence durante 12 meses' ),
		'oficina'   => array( 'Rede IPR e Oficina', 'entrada na Rede IPR e na Oficina dos profissionais', 'entrada en la Red IPR y en el Taller de profesionales' ),
		'estudio3'  => array( 'IPR Cloud Estúdio, 3 meses', 'IPR Cloud Estúdio durante 3 meses (12 projectos, 15 clientes, 6 pessoas por projecto)', 'IPR Cloud Estúdio durante 3 meses (12 proyectos, 15 clientes, 6 personas por proyecto)' ),
	);
}

// Tipo de conteúdo, só interno.
add_action( 'init', function () {
	register_post_type( 'tcd_conv', array( 'labels' => array( 'name' => 'Convidados' ), 'public' => false, 'show_ui' => false, 'supports' => array( 'title' ), 'rewrite' => false ) );
}, 5 );

function tcd_cv_meta_campos() { return array( 'ref', 'organizacao', 'tipo', 'profissoes', 'pais', 'regiao', 'site', 'email', 'email_fonte', 'telefone', 'linguas', 'notas', 'confianca', 'prioridade', 'estado', 'ultimo', 'proximo', 'codigo', 'nota_nuno' ); }
function tcd_cv_ler( $id ) {
	$p = get_post( $id ); if ( ! $p || 'tcd_conv' !== $p->post_type ) { return null; }
	$d = array( 'id' => (int) $id, 'nome' => $p->post_title );
	foreach ( tcd_cv_meta_campos() as $k ) { $d[ $k ] = (string) get_post_meta( $id, '_cv_' . $k, true ); }
	$h = get_post_meta( $id, '_cv_hist', true ); $d['hist'] = is_array( $h ) ? $h : array();
	return $d;
}
function tcd_cv_prioridade_sugerida( $r ) {
	$pro = strtolower( (string) ( $r['profissoes'] ?? '' ) );
	$nucleo = preg_match( '/permacultura|keyline|agua|água|agrofloresta|paisag|regenerativ/u', $pro );
	$c = strtolower( (string) ( $r['confianca'] ?? '' ) ); $em = ! empty( $r['email'] );
	if ( 'alta' === $c && $em && $nucleo ) { return 'A'; }
	if ( ( 'alta' === $c || ( 'média' === $c || 'media' === $c ) ) && $em ) { return 'B'; }
	return 'C';
}
// Importa (ou actualiza) uma lista de objectos com os campos do CSV da pesquisa (id, nome, organizacao, tipo, …).
function tcd_cv_importar( $l ) {
	if ( ! is_array( $l ) || ! $l ) { return new WP_Error( 'tcd_cv', 'Lista vazia ou ilegível.' ); }
	$novos = 0; $act = 0;
	foreach ( $l as $r ) {
		$ref = sanitize_key( $r['id'] ?? '' ); $nome = sanitize_text_field( $r['nome'] ?? '' );
		if ( '' === $ref || '' === $nome ) { continue; }
		$ex = get_posts( array( 'post_type' => 'tcd_conv', 'post_status' => 'any', 'meta_key' => '_cv_ref', 'meta_value' => $ref, 'numberposts' => 1, 'fields' => 'ids' ) );
		$id = $ex ? (int) $ex[0] : wp_insert_post( array( 'post_type' => 'tcd_conv', 'post_status' => 'private', 'post_title' => $nome ) );
		if ( ! $id || is_wp_error( $id ) ) { continue; }
		foreach ( array( 'organizacao', 'tipo', 'profissoes', 'pais', 'regiao', 'site', 'email', 'email_fonte', 'telefone', 'linguas', 'notas', 'confianca' ) as $k ) {
			$v = 'site' === $k || 'email_fonte' === $k ? esc_url_raw( (string) ( $r[ $k ] ?? '' ) ) : ( 'email' === $k ? sanitize_email( (string) ( $r[ $k ] ?? '' ) ) : sanitize_text_field( (string) ( $r[ $k ] ?? '' ) ) );
			update_post_meta( $id, '_cv_' . $k, $v );
		}
		update_post_meta( $id, '_cv_ref', $ref );
		if ( ! get_post_meta( $id, '_cv_prioridade', true ) ) { update_post_meta( $id, '_cv_prioridade', tcd_cv_prioridade_sugerida( $r ) ); }
		if ( ! get_post_meta( $id, '_cv_estado', true ) ) { update_post_meta( $id, '_cv_estado', 'por_convidar' ); }
		if ( $ex ) { $act++; } else { $novos++; }
	}
	return array( 'novos' => $novos, 'actualizados' => $act );
}
function tcd_cv_todos() {
	$ids = get_posts( array( 'post_type' => 'tcd_conv', 'post_status' => 'any', 'numberposts' => 2000, 'fields' => 'ids', 'orderby' => 'title', 'order' => 'ASC' ) );
	$out = array(); foreach ( $ids as $i ) { $d = tcd_cv_ler( $i ); if ( $d ) { $out[] = $d; } } return $out;
}

// Código do convite e mensagem.
function tcd_cv_codigo() { return 'PRO-' . strtoupper( substr( str_replace( array( '0', 'O', 'I', '1' ), array( '2', 'A', 'J', '7' ), wp_generate_password( 8, false, false ) ), 0, 6 ) ); }
function tcd_cv_es( $pais ) { return 0 === stripos( (string) $pais, 'es' ); }
function tcd_cv_mensagem( $d, $ofertas, $codigo, $seguimento = false ) {
	$es = tcd_cv_es( $d['pais'] ); $o = tcd_cv_ofertas(); $lista = array(); $meses = in_array( 'designer12', $ofertas, true ) ? '12' : ( in_array( 'org6', $ofertas, true ) ? '6' : '3' );
	foreach ( $ofertas as $k ) { if ( isset( $o[ $k ] ) ) { $lista[] = $o[ $k ][ $es ? 2 : 1 ]; } }
	$lig  = home_url( '/atlas/?convite=' . rawurlencode( $codigo ) );
	$nome = trim( (string) $d['nome'] ); $org = trim( (string) $d['organizacao'] );
	if ( $es ) {
		$t = ( $seguimento ? "Hola de nuevo,\n\nHace unas semanas le escribimos con una invitación de Terracrua Design. Sigue abierta, por si no llegó a verla.\n\n" : "Hola,\n\nSoy Nuno Mamede Santos, de Terracrua Design (Alentejo, Portugal). Trabajamos cartografía y diseño regenerativo de fincas y acabamos de abrir el IPR Atlas y la IPR Cloud a profesionales de Portugal y España.\n\n" )
			. "Le invitamos a probarlo sin coste con:\n- " . implode( "\n- ", $lista ) . "\n\nPara activar, abra este enlace y confirme su e-mail:\n" . $lig . "\n\nEl código es personal (" . $codigo . ") y caduca en 60 días. Al final de los " . $meses . " meses no hay cargo automático: si quiere seguir, el plan Designer tiene el precio de lanzamiento (294 €/año en lugar de 420 €) durante 30 días más.\n\nSi prefiere no recibir más mensajes nuestros, responda con «baja» y no volveremos a escribir.\n\nUn saludo,\nNuno Mamede Santos\nTerracrua Design · terracruadesign.pt";
	} else {
		$t = ( $seguimento ? "Olá de novo,\n\nHá umas semanas escrevemos-lhe com um convite da Terracrua Design. Continua aberto, caso não o tenha visto.\n\n" : "Olá,\n\nSou o Nuno Mamede Santos, da Terracrua Design (Baixo Alentejo). Trabalhamos cartografia e desenho regenerativo de propriedades e acabámos de abrir o IPR Atlas e a IPR Cloud a profissionais de Portugal e Espanha.\n\n" )
			. "Convidamo-lo a experimentar sem custo, com:\n- " . implode( "\n- ", $lista ) . "\n\nPara activar, abra esta ligação e confirme o seu e-mail:\n" . $lig . "\n\nO código é pessoal (" . $codigo . ") e caduca em 60 dias. No fim dos " . $meses . " meses não há cobrança automática: se quiser continuar, o plano Designer fica ao preço de lançamento (294 €/ano em vez de 420 €) durante mais 30 dias.\n\nSe preferir não receber mais mensagens nossas, responda com «remover» e não voltamos a escrever.\n\nCumprimentos,\nNuno Mamede Santos\nTerracrua Design · terracruadesign.pt";
	}
	return ( $org && $org !== $nome ? ( $es ? 'Para ' : 'Para ' ) . $nome . ' (' . $org . ")\n\n" : '' ) . $t;
}

// Envio (confirmado no ecrã). admin-ajax, só administradores.
add_action( 'wp_ajax_tcd_cv_enviar', function () {
	if ( ! tcd_cv_on() || ! tcd_cv_pode() ) { wp_send_json_error( 'Sem acesso.', 403 ); }
	check_ajax_referer( 'tcd_cv', 'n' );
	$ids = array_map( 'absint', (array) ( $_POST['ids'] ?? array() ) );
	$of  = array_values( array_intersect( array_map( 'sanitize_key', (array) ( $_POST['ofertas'] ?? array() ) ), array_keys( tcd_cv_ofertas() ) ) );
	$seg = ! empty( $_POST['seguimento'] );
	if ( ! $ids || ! $of ) { wp_send_json_error( 'Escolha pelo menos um convidado e uma oferta.', 400 ); }
	if ( count( $ids ) > 60 ) { wp_send_json_error( 'No máximo 60 de cada vez.', 400 ); }
	$reg = get_option( 'tcd_convites', array() ); if ( ! is_array( $reg ) ) { $reg = array(); }
	$u = wp_get_current_user(); $res = array(); $enviados = 0; $amao = 0;
	foreach ( $ids as $id ) {
		$d = tcd_cv_ler( $id ); if ( ! $d ) { continue; }
		$cod = $d['codigo'] && isset( $reg[ $d['codigo'] ] ) && empty( $reg[ $d['codigo'] ]['usado'] ) ? $d['codigo'] : tcd_cv_codigo();
		$reg[ $cod ] = array( 'email' => strtolower( $d['email'] ), 'nome' => $d['nome'], 'pais' => $d['pais'], 'conv' => $id, 'ofertas' => $of, 'criado' => time(), 'validade' => time() + 60 * DAY_IN_SECONDS, 'usado' => 0 );
		$msg = tcd_cv_mensagem( $d, $of, $cod, $seg );
		$canal = 'mao';
		if ( 'empresa' === $d['tipo'] && is_email( $d['email'] ) ) {
			$ok = wp_mail( $d['email'], tcd_cv_es( $d['pais'] ) ? 'Invitación de Terracrua Design: IPR Atlas e IPR Cloud' : 'Convite da Terracrua Design: IPR Atlas e IPR Cloud', $msg, array( 'Reply-To: info@terracruadesign.pt', 'Content-Type: text/plain; charset=UTF-8' ) );
			$canal = $ok ? 'site' : 'falhou';
			if ( $ok ) { $enviados++; }
		} else { $amao++; }
		$h = $d['hist']; $h[] = array( 'quando' => current_time( 'mysql' ), 'canal' => $canal, 'ofertas' => $of, 'codigo' => $cod, 'por' => $u->display_name, 'seguimento' => $seg ? 1 : 0 );
		update_post_meta( $id, '_cv_hist', $h );
		update_post_meta( $id, '_cv_codigo', $cod );
		update_post_meta( $id, '_cv_estado', $seg ? 'seguimento' : 'convidado' );
		update_post_meta( $id, '_cv_ultimo', current_time( 'mysql' ) );
		update_post_meta( $id, '_cv_proximo', gmdate( 'Y-m-d', time() + 30 * DAY_IN_SECONDS ) );
		$res[] = array( 'id' => $id, 'nome' => $d['nome'], 'email' => $d['email'], 'canal' => $canal, 'codigo' => $cod, 'mensagem' => 'mao' === $canal ? $msg : '', 'mailto' => 'mao' === $canal && is_email( $d['email'] ) ? 'mailto:' . rawurlencode( $d['email'] ) . '?subject=' . rawurlencode( 'Convite da Terracrua Design' ) . '&body=' . rawurlencode( $msg ) : '' );
	}
	update_option( 'tcd_convites', $reg, false );
	if ( function_exists( 'tcd_tg_enviar' ) ) { tcd_tg_enviar( 'Convites a profissionais: ' . $enviados . ' enviados pelo site, ' . $amao . ' para enviar à mão (' . esc_html( implode( ', ', $of ) ) . ').' ); }
	wp_send_json_success( array( 'enviados' => $enviados, 'amao' => $amao, 'itens' => $res ) );
} );

// Guardar prioridade, estado e nota de uma linha.
add_action( 'wp_ajax_tcd_cv_guardar', function () {
	if ( ! tcd_cv_on() || ! tcd_cv_pode() ) { wp_send_json_error( 'Sem acesso.', 403 ); }
	check_ajax_referer( 'tcd_cv', 'n' );
	$id = absint( $_POST['id'] ?? 0 ); if ( ! tcd_cv_ler( $id ) ) { wp_send_json_error( 'Convidado desconhecido.', 400 ); }
	if ( isset( $_POST['prioridade'] ) && in_array( $_POST['prioridade'], array( 'A', 'B', 'C' ), true ) ) { update_post_meta( $id, '_cv_prioridade', $_POST['prioridade'] ); }
	if ( isset( $_POST['estado'] ) && in_array( $_POST['estado'], array( 'por_convidar', 'convidado', 'seguimento', 'respondeu', 'aceitou', 'recusou', 'fora' ), true ) ) {
		update_post_meta( $id, '_cv_estado', $_POST['estado'] );
		if ( in_array( $_POST['estado'], array( 'aceitou', 'recusou', 'fora', 'respondeu' ), true ) ) { update_post_meta( $id, '_cv_proximo', '' ); }
	}
	if ( isset( $_POST['nota_nuno'] ) ) { update_post_meta( $id, '_cv_nota_nuno', mb_substr( sanitize_textarea_field( wp_unslash( $_POST['nota_nuno'] ) ), 0, 600 ) ); }
	if ( isset( $_POST['proximo'] ) ) { $p = sanitize_text_field( wp_unslash( $_POST['proximo'] ) ); update_post_meta( $id, '_cv_proximo', preg_match( '/^\d{4}-\d{2}-\d{2}$/', $p ) ? $p : '' ); }
	wp_send_json_success( tcd_cv_ler( $id ) );
} );

// REST para administrar de fora (importar e listar).
add_action( 'rest_api_init', function () {
	$perm = function () { return tcd_cv_on() && current_user_can( 'manage_options' ); };
	register_rest_route( 'tcd/v1', '/convites/importar', array( 'methods' => 'POST', 'permission_callback' => $perm, 'callback' => function ( $req ) { $r = tcd_cv_importar( $req->get_json_params() ); return is_wp_error( $r ) ? $r : rest_ensure_response( $r ); } ) );
	register_rest_route( 'tcd/v1', '/convites', array( 'methods' => 'GET', 'permission_callback' => $perm, 'callback' => function () { $t = tcd_cv_todos(); return rest_ensure_response( array( 'n' => count( $t ), 'itens' => array_map( function ( $d ) { unset( $d['hist'] ); return $d; }, $t ) ) ); } ) );
} );

// Lembrete diário: quem passou os 30 dias sem resposta.
add_action( 'init', function () { if ( tcd_cv_on() && ! wp_next_scheduled( 'tcd_cv_lembretes' ) ) { wp_schedule_event( strtotime( 'tomorrow 08:30' ), 'daily', 'tcd_cv_lembretes' ); } }, 50 );
add_action( 'tcd_cv_lembretes', function () {
	if ( ! tcd_cv_on() ) { return; }
	$hoje = gmdate( 'Y-m-d' ); $l = array();
	foreach ( tcd_cv_todos() as $d ) { if ( in_array( $d['estado'], array( 'convidado', 'seguimento' ), true ) && $d['proximo'] && $d['proximo'] <= $hoje ) { $l[] = $d['nome'] . ( $d['organizacao'] && $d['organizacao'] !== $d['nome'] ? ' (' . $d['organizacao'] . ')' : '' ); } }
	if ( $l && function_exists( 'tcd_tg_enviar' ) ) { tcd_tg_enviar( count( $l ) . ' convite(s) a profissionais sem resposta há 30 dias: ' . esc_html( implode( '; ', array_slice( $l, 0, 15 ) ) ) . ( count( $l ) > 15 ? '…' : '' ) . "\nSeguir em " . home_url( '/area-equipa/?v=convites&f=seguir' ) ); }
} );

// Vista no Estúdio.
add_action( 'init', function () {
	$ant = shortcode_exists( 'tcd_equipa' ) ? $GLOBALS['shortcode_tags']['tcd_equipa'] : null; if ( ! $ant ) { return; }
	add_shortcode( 'tcd_equipa', function ( $atts = array(), $content = '' ) use ( $ant ) {
		$v = isset( $_GET['v'] ) ? sanitize_key( $_GET['v'] ) : ''; // phpcs:ignore
		if ( 'convites' !== $v || ! tcd_cv_on() ) { return call_user_func( $ant, $atts, $content ); }
		if ( ! tcd_cv_pode() ) { return '<p>Sem acesso.</p>'; }
		return tcd_cv_vista();
	} );
}, 140 );
add_filter( 'tcd_mesa_atalhos', function ( $a ) {
	if ( tcd_cv_on() && tcd_cv_pode() ) { $a[] = array( 'Convites a profissionais', home_url( '/area-equipa/?v=convites' ), 'Lista de Portugal e Espanha, prioridades, oferta, envio e seguimento', 'negocio', 'Negócio' ); }
	return $a;
} );
function tcd_cv_vista() {
	$todos = tcd_cv_todos();
	$cfg = array( 'ajax' => admin_url( 'admin-ajax.php' ), 'nonce' => wp_create_nonce( 'tcd_cv' ), 'ofertas' => array_map( function ( $o ) { return $o[0]; }, tcd_cv_ofertas() ), 'itens' => $todos, 'hoje' => gmdate( 'Y-m-d' ), 'filtro' => isset( $_GET['f'] ) ? sanitize_key( $_GET['f'] ) : '' ); // phpcs:ignore
	return '<div id="tcv" class="tcv"><p class="k">Negócio</p><h1>Convites a profissionais</h1><p class="m">' . count( $todos ) . ' profissionais de Portugal e Espanha, da pesquisa de 20/10/2026. Prioridade sugerida pelo site, corrigível. Os de tipo «pessoa» não recebem e-mail do site: o texto fica pronto para enviar à mão.</p><div id="tcv-app">A carregar…</div></div>'
		. '<script id="tcv-cfg" type="application/json">' . wp_json_encode( $cfg, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE ) . '</script>'
		. '<link rel="stylesheet" href="' . esc_url( content_url( 'plugins/terracrua-nucleo/assets/atlas/convites.css' ) ) . '?ver=81f4a44290">'
		. '<script src="' . esc_url( content_url( 'plugins/terracrua-nucleo/assets/atlas/convites.js' ) ) . '?ver=ebb4ce9f0c" defer></script>';
}
