<?php
// Módulo 90261 · Página pública por organização e painel de rede opt-in (IPR Atlas)
// Pedido do Nuno, 21/10/2026, 16h16 a 16h27, três decisões que mandam em tudo:
//  (a) «Não vale a pena divulgar a rede enquanto não há utilizadores; fica mal mostrar uma rede vazia.» O painel e qualquer
//      menção a «rede» só aparecem quando há pelo menos TCD_PUB_MIN_REDE organizações a aderir (opção tcd_pub_min_rede).
//      Abaixo disso, /organizacoes/ lista só as páginas públicas que existem, sem números agregados e sem a palavra «rede».
//  (b) «Dar a possibilidade a pessoas que [...] só querem comprar bases cartográficas, de se manterem à parte da rede. Toda a
//      gente tem um perfil e pode configurá-lo.» Usermeta tcd_rede_fora (1 = fora): interruptor na Minha conta do WooCommerce;
//      função tcd_pub_fora($u) e filtro tcd_rede_visivel($visivel, $u) para os outros módulos. Uma organização cujo dono está
//      fora da rede nunca entra no painel.
//  (c) «Muitas pessoas têm preocupações com os dados privados. Temos de os tranquilizar e ser eticamente incríveis e
//      transparentes.» Secção «Os seus dados» (tcd_pub_dados_texto, filtro com o mesmo nome) na Minha conta e no rodapé de
//      cada página pública: o que guardamos, o que não fazemos, o que a pessoa controla, generalização GBIF, contacto.
// Peças: configuração por organização em $d['publico'] (m90253), bloco Oficina «publico» (gestor) e «cronica» (editores),
// CPT tcd_cronica, páginas /organizacoes/ e /organizacoes/<slug>/ em HTML próprio (sem o tema), REST público limitado por IP,
// camadas sempre lidas com tcd_cam_geojson($c, 0, 'publico') (o m90256 generaliza; sem ele, nada sensível é público).
// Referências: página pública ao estilo Mossy Earth (cronologia, «o que não funcionou» do ELSP), painel ERN com agregação
// opcional, interface pt/en/es.
// Revisão de segurança (21/10, 17h): camadas sensíveis só públicas com tcd_sen_on() e o filtro registado, verificado também na rota;
// ficheiro público pré-gerado pub-<id>-<hash>.geojson servido por readfile; limite por IP com chave /64 (tcd_org_ip_chave);
// índice slug → id em tcd_pub_slugs (404 em O(1), cache negativa 10 min); caches limpas em tcd_cam_alterada, tcd_cam_carregada e
// ao mudar tcd_sen_off ou tcd_pub_off; rewrite só se não há página «organizacoes»; fundo do mapa OpenFreeMap (filtro tcd_pub_fundo);
// «Os seus dados» diz que serviços externos vêem o IP; lixo das crónicas purgado aos 30 dias; mensagens por chave.
// Interruptor: tcd_pub_off = 1. Prefixo tcd_pub_. Depende do m90253 e do m90254.
if ( ! defined( 'ABSPATH' ) ) { exit; }

define( 'TCD_PUB_MIN_REDE', 3 ); define( 'TCD_PUB_RW_V', '1' );
function tcd_pub_on() { return '1' !== (string) get_option( 'tcd_pub_off', '' ) && function_exists( 'tcd_org_dados' ) && function_exists( 'tcd_cam_lista' ); }
function tcd_pub_minimo() { $n = (int) get_option( 'tcd_pub_min_rede', TCD_PUB_MIN_REDE ); return max( 1, $n ?: TCD_PUB_MIN_REDE ); }
function tcd_pub_linguas() { return array( 'pt', 'en', 'es' ); }
function tcd_pub_licencas() { return array( 'CC BY 4.0' => 'CC BY 4.0 (uso livre com atribuição)', 'CC BY-SA 4.0' => 'CC BY-SA 4.0 (atribuição, partilha igual)', 'CC0 1.0' => 'CC0 (domínio público)', 'reservado' => 'Todos os direitos reservados' ); }
add_action( 'init', function () { register_post_type( 'tcd_cronica', array( 'public' => false, 'show_ui' => false, 'supports' => array( 'title' ), 'label' => 'Cronologia de organizações' ) ); }, 5 );

// ---------- (b) fora da rede: perfil de toda a gente ----------
function tcd_pub_fora( $u ) { $id = is_object( $u ) ? (int) ( $u->ID ?? 0 ) : (int) $u; return $id > 0 && '1' === (string) get_user_meta( $id, 'tcd_rede_fora', true ); }
if ( ! function_exists( 'tcd_rede_visivel' ) ) { function tcd_rede_visivel( $u ) { return (bool) apply_filters( 'tcd_rede_visivel', ! tcd_pub_fora( $u ), $u ); } }
add_action( 'woocommerce_edit_account_form', function () {
	if ( ! tcd_pub_on() ) { return; } $u = wp_get_current_user(); if ( ! $u || empty( $u->ID ) ) { return; }
	echo '<fieldset class="tcd-pub-conta" style="margin:18px 0;padding:14px 16px;border:1px solid #d9d4c2;border-radius:8px"><legend style="font-weight:600;padding:0 6px">Rede do IPR Atlas e os seus dados</legend>'
		. '<p class="form-row"><label><input type="checkbox" name="tcd_rede_fora" value="1"' . checked( tcd_pub_fora( $u ), true, false ) . '> Manter-me fora da rede do IPR Atlas (sem convites, sugestões nem listagens)</label></p>'
		. wp_nonce_field( 'tcd_pub_conta', 'tcd_pub_n', true, false ) . tcd_pub_dados_html( true, false ) . '</fieldset>';
} );
add_action( 'woocommerce_save_account_details', function ( $uid ) {
	if ( ! tcd_pub_on() || ! isset( $_POST['tcd_pub_n'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['tcd_pub_n'] ) ), 'tcd_pub_conta' ) ) { return; } // phpcs:ignore
	if ( (int) $uid !== get_current_user_id() ) { return; }
	update_user_meta( (int) $uid, 'tcd_rede_fora', empty( $_POST['tcd_rede_fora'] ) ? '0' : '1' ); tcd_pub_limpar_cache( array() ); // phpcs:ignore
} );

// ---------- (c) Os seus dados ----------
// $rede: se a rede está activa pode usar-se a palavra; senão a frase é a mesma sem ela. Devolve {t, p[]} pelo filtro tcd_pub_dados_texto.
function tcd_pub_dados_texto( $rede = null ) {
	$rede = null === $rede ? tcd_pub_rede_activa() : (bool) $rede;
	$p = array(
		'guardamos' => 'O que guardamos: a sua conta (nome, e-mail e palavra-passe cifrada), as camadas que carregou e, se pertence a uma organização, a lista dos seus membros e papéis; se comprou algo, os dados da encomenda que a lei obriga a guardar.',
		'nao'       => 'O que não fazemos: não vendemos nem cedemos dados a ninguém; não criamos perfis publicitários; não publicamos nada sem o gestor da organização ligar a página pública.',
		'externos'  => 'Serviços externos: a página pública carrega tipos de letra do Google Fonts, bibliotecas do jsDelivr e mapas do OpenFreeMap (dados OpenStreetMap). Esses serviços vêem o endereço IP de quem a visita; nós não lhes enviamos mais nada.',
		'controla'  => 'O que controla: pode exportar tudo em qualquer altura pela Oficina, pedir a eliminação da conta e dos dados, e ' . ( $rede ? 'sair da rede do IPR Atlas' : 'manter-se à parte de convites, sugestões e listagens' ) . ' quando quiser.',
		'sensivel'  => 'Coordenadas sensíveis (ninhos, tocas, espécies ameaçadas, acordos com proprietários) são generalizadas em tudo o que é público, segundo o guia do GBIF para dados sensíveis.',
		'contacto'  => 'Dúvidas ou pedidos: info@terracruadesign.pt. Respondemos pessoalmente.',
	);
	return (array) apply_filters( 'tcd_pub_dados_texto', array( 't' => 'Os seus dados', 'p' => $p ), $rede );
}
function tcd_pub_dados_html( $rede = null, $resumido = false ) {
	$d = tcd_pub_dados_texto( $rede ); $p = (array) ( $d['p'] ?? array() ); if ( $resumido ) { $p = array_intersect_key( $p, array( 'nao' => 1, 'externos' => 1, 'sensivel' => 1, 'contacto' => 1 ) ); }
	$h = '<div class="tpub-dados"><h3>' . esc_html( $d['t'] ?? 'Os seus dados' ) . '</h3>'; foreach ( $p as $x ) { $h .= '<p>' . esc_html( $x ) . '</p>'; }
	if ( $resumido ) { $h .= '<p><a href="' . esc_url( tcd_pub_url_conta() ) . '">' . esc_html( 'Texto completo e opções na sua conta' ) . '</a></p>'; }
	return $h . '</div>';
}
function tcd_pub_url_conta() { return function_exists( 'wc_get_page_permalink' ) ? wc_get_page_permalink( 'myaccount' ) : home_url( '/minha-conta/' ); }

// ---------- configuração por organização ----------
function tcd_pub_slug_ok( $s ) { return (bool) preg_match( '/^[a-z0-9-]{3,40}$/', (string) $s ); }
function tcd_pub_cfg( $d ) {
	$p = is_array( $d['publico'] ?? null ) ? $d['publico'] : array(); $slug = (string) ( $p['slug'] ?? '' ); if ( ! tcd_pub_slug_ok( $slug ) ) { $slug = substr( preg_replace( '/[^a-z0-9-]/', '', (string) ( $d['slug'] ?? '' ) ), 0, 40 ); }
	return array(
		'on' => (int) ! empty( $p['on'] ), 'slug' => tcd_pub_slug_ok( $slug ) ? $slug : '', 'titulo' => (string) ( $p['titulo'] ?? '' ),
		'resumo' => array_merge( array( 'pt' => '', 'en' => '', 'es' => '' ), (array) ( $p['resumo'] ?? array() ) ),
		'blocos' => array_values( array_intersect( (array) ( $p['blocos'] ?? array( 'mapa', 'indicadores', 'cronologia' ) ), array( 'mapa', 'indicadores', 'cronologia', 'equipa', 'nao_funcionou' ) ) ),
		'camadas_publicas' => array_values( array_unique( array_map( 'intval', (array) ( $p['camadas_publicas'] ?? array() ) ) ) ),
		'equipa' => (int) ! empty( $p['equipa'] ), 'rede' => array( 'on' => (int) ! empty( $p['rede']['on'] ), 'agrega' => array_values( array_intersect( (array) ( $p['rede']['agrega'] ?? array() ), array( 'ha', 'camadas', 'indicadores' ) ) ) ),
		'contacto' => is_email( (string) ( $p['contacto'] ?? '' ) ) ? (string) $p['contacto'] : '', 'licenca' => isset( tcd_pub_licencas()[ $p['licenca'] ?? '' ] ) ? $p['licenca'] : 'CC BY 4.0',
	);
}
function tcd_pub_url( $org ) { $d = is_array( $org ) ? $org : tcd_org_dados( $org ); if ( ! $d ) { return ''; } $c = tcd_pub_cfg( $d ); return $c['slug'] ? home_url( '/organizacoes/' . $c['slug'] . '/' ) : ''; }
function tcd_pub_todas() { return get_posts( array( 'post_type' => 'tcd_org', 'post_status' => 'any', 'numberposts' => 500, 'fields' => 'ids' ) ); }
function tcd_pub_slug_livre( $slug, $org ) { $i = tcd_pub_indice( true ); return ! isset( $i[ $slug ] ) || (int) $i[ $slug ] === (int) $org; }
// Organizações com página pública ligada e dono dentro da rede (nunca arquivadas).
function tcd_pub_orgs() {
	$out = array(); foreach ( tcd_pub_todas() as $id ) { $d = tcd_org_dados( $id ); if ( ! $d || 'arquivada' === $d['estado'] ) { continue; } $c = tcd_pub_cfg( $d ); if ( ! $c['on'] || ! $c['slug'] || ( ! empty( $d['dono'] ) && ! tcd_rede_visivel( get_userdata( (int) $d['dono'] ) ?: (int) $d['dono'] ) ) ) { continue; } $out[ $id ] = $d; }
	return $out;
}
// Índice slug => id (opção tcd_pub_slugs, autoload no), refeito ao guardar e no cron: o 404 por slug não percorre as organizações.
function tcd_pub_indice( $refazer = false ) {
	$i = get_option( 'tcd_pub_slugs', null ); if ( is_array( $i ) && ! $refazer ) { return $i; } $i = array();
	foreach ( tcd_pub_todas() as $id ) { $d = tcd_org_dados( $id ); if ( ! $d ) { continue; } $c = tcd_pub_cfg( $d ); if ( $c['slug'] ) { $i[ $c['slug'] ] = (int) $id; } }
	update_option( 'tcd_pub_slugs', $i, false ); return $i;
}
function tcd_pub_por_slug( $slug ) {
	if ( ! tcd_pub_slug_ok( $slug ) ) { return null; } $i = tcd_pub_indice(); if ( ! isset( $i[ $slug ] ) ) { return null; }
	$d = tcd_org_dados( (int) $i[ $slug ] ); if ( ! $d || tcd_pub_cfg( $d )['slug'] !== $slug ) { tcd_pub_indice( true ); return null; } return $d;
}
add_action( 'tcd_org_diario', function () { tcd_pub_indice( true ); }, 30 );
function tcd_pub_rede_lista() { $out = array(); foreach ( tcd_pub_orgs() as $id => $d ) { if ( ! empty( tcd_pub_cfg( $d )['rede']['on'] ) ) { $out[ $id ] = $d; } } return $out; }
function tcd_pub_rede_activa() { return tcd_pub_on() && count( tcd_pub_rede_lista() ) >= tcd_pub_minimo(); }
// Segurança própria: sem o m90256 presente, nada sensível (grupo ou camada) é público, mesmo que marcado.
function tcd_pub_sen_ok() { return function_exists( 'tcd_sen_on' ) && tcd_sen_on() && has_filter( 'tcd_cam_geojson' ); }
function tcd_pub_sensivel( $c, $g ) { return ! empty( $c['sensivel'] ) || ! empty( $g[ $c['grupo'] ?? '' ]['sensivel'] ); }
function tcd_pub_pode_publicar( $c, $g ) { if ( empty( $c ) || ! empty( $c['lixo'] ) ) { return false; } return ! tcd_pub_sensivel( $c, $g ) || tcd_pub_sen_ok(); }
function tcd_pub_camadas( $d ) {
	$c = tcd_pub_cfg( $d ); if ( ! $c['camadas_publicas'] ) { return array(); } $g = tcd_cam_grupos( $d['id'] ); $out = array();
	foreach ( tcd_cam_lista( $d['id'], null, false ) as $x ) { if ( in_array( (int) $x['id'], $c['camadas_publicas'], true ) && tcd_pub_pode_publicar( $x, $g ) ) { $x['cor'] = function_exists( 'tcd_cam_cor' ) ? tcd_cam_cor( $g[ $x['grupo'] ]['cor'] ?? '' ) : '#75834a'; $x['grupo_nome'] = $g[ $x['grupo'] ]['nome'] ?? ''; $x['sens'] = tcd_pub_sensivel( $x, $g ); $out[] = $x; } }
	return $out;
}
function tcd_pub_bbox_arred( $b, $passo ) { return array_map( function ( $v ) use ( $passo ) { return round( floor( (float) $v / $passo ) * $passo, 1 ); }, (array) $b ); }
function tcd_pub_indicadores( $org ) { // m90259: tcd_ind_lista($org) com nome, unidade, essencial, serie[{ano,valor}]; tcd_ind_valor($i) dá {valor, ano}
	if ( ! function_exists( 'tcd_ind_lista' ) ) { return array(); } $out = array();
	foreach ( (array) tcd_ind_lista( (int) $org ) as $i ) { $i = (array) $i; if ( empty( $i['publico'] ) && empty( $i['essencial'] ) ) { continue; } $v = function_exists( 'tcd_ind_valor' ) ? tcd_ind_valor( $i ) : null;
		if ( ! $v && ! empty( $i['serie'] ) ) { $s = array(); foreach ( (array) $i['serie'] as $x ) { if ( isset( $x['ano'], $x['valor'] ) ) { $s[ (int) $x['ano'] ] = $x['valor']; } } if ( $s ) { ksort( $s ); $v = array( 'valor' => end( $s ), 'ano' => array_key_last( $s ) ); } }
		if ( ! $v || null === $v['valor'] || '' === $v['valor'] ) { continue; } $out[] = array( 'nome' => (string) ( $i['nome'] ?? '' ), 'valor' => is_numeric( $v['valor'] ) ? (float) $v['valor'] : (string) $v['valor'], 'ano' => (string) ( $v['ano'] ?? '' ), 'unidade' => (string) ( $i['unidade'] ?? '' ) ); }
	return $out;
}
function tcd_pub_cronicas( $org, $so_publicas = true, $com_lixo = false ) {
	$out = array(); foreach ( get_posts( array( 'post_type' => 'tcd_cronica', 'post_status' => 'any', 'numberposts' => 200, 'fields' => 'ids', 'meta_key' => '_tcd_cron_org', 'meta_value' => (int) $org ) ) as $id ) { $m = get_post_meta( $id, '_tcd_cron', true ); if ( ! is_array( $m ) || ( ! empty( $m['lixo'] ) && ! $com_lixo ) || ( $so_publicas && empty( $m['publico'] ) ) ) { continue; } $m['id'] = (int) $id; $m['titulo'] = get_the_title( $id ); $out[] = $m; }
	usort( $out, function ( $a, $b ) { return strcmp( (string) $b['data'], (string) $a['data'] ); } ); return $out;
}
function tcd_pub_resumo( $c, $l ) { $r = $c['resumo']; $l = in_array( $l, tcd_pub_linguas(), true ) ? $l : 'pt'; return '' !== trim( (string) ( $r[ $l ] ?? '' ) ) ? $r[ $l ] : (string) $r['pt']; }
// Ficha pública (também a resposta JSON do REST). Nunca sai nada que não esteja em camadas_publicas.
function tcd_pub_ficha( $org, $l = '' ) {
	$d = is_array( $org ) ? $org : tcd_org_dados( $org ); if ( ! $d ) { return null; } $c = tcd_pub_cfg( $d ); $l = $l ?: ( $d['lingua'] ?? 'pt' );
	$cam = array(); foreach ( tcd_pub_camadas( $d ) as $x ) { $cam[] = array( 'id' => (int) $x['id'], 'nome' => $x['nome'], 'grupo' => $x['grupo_nome'], 'cor' => $x['cor'], 'geom' => $x['geom'], 'n' => (int) $x['n'], 'bbox' => tcd_pub_bbox_arred( $x['bbox'], $x['sens'] ? 0.1 : 0.01 ), 'url' => rest_url( 'tcd/v1/publico/org/' . $c['slug'] . '/camada/' . (int) $x['id'] ) ); }
	$f = array( 'nome' => $c['titulo'] ?: $d['nome'], 'slug' => $c['slug'], 'pais' => (string) ( $d['pais'] ?? '' ), 'lingua' => $l, 'modelo' => tcd_org_modelos()[ $d['modelo'] ?? '' ] ?? '', 'resumo' => tcd_pub_resumo( $c, $l ), 'blocos' => $c['blocos'], 'licenca' => $c['licenca'], 'contacto' => $c['contacto'], 'camadas' => $cam, 'url' => tcd_pub_url( $d ) );
	$f['indicadores'] = in_array( 'indicadores', $c['blocos'], true ) ? tcd_pub_indicadores( $d['id'] ) : array();
	$f['cronologia'] = array(); if ( in_array( 'cronologia', $c['blocos'], true ) ) { foreach ( tcd_pub_cronicas( $d['id'] ) as $x ) { $f['cronologia'][] = array( 'data' => $x['data'], 'titulo' => $x['titulo'], 'texto' => $x['texto'] ); } }
	$f['nao_funcionou'] = in_array( 'nao_funcionou', $c['blocos'], true ) ? (string) ( $d['relatorios']['nao_funcionou'] ?? '' ) : ''; // texto do m90259; o gestor marca a secção como pública no bloco
	$f['equipa'] = array(); if ( $c['equipa'] && in_array( 'equipa', $c['blocos'], true ) ) { foreach ( tcd_org_membros( $d['id'] ) as $uid => $m ) { if ( 'activo' === ( $m['estado'] ?? '' ) && tcd_rede_visivel( get_userdata( (int) $uid ) ?: (int) $uid ) ) { $f['equipa'][] = (string) ( $m['nome'] ?? '' ); } } }
	return $f;
}
function tcd_pub_centro( $d ) { $b = null; foreach ( tcd_pub_camadas( $d ) as $x ) { $bb = (array) $x['bbox']; if ( 4 !== count( $bb ) ) { continue; } $b = $b ? array( min( $b[0], $bb[0] ), min( $b[1], $bb[1] ), max( $b[2], $bb[2] ), max( $b[3], $bb[3] ) ) : $bb; } return $b ? array( round( ( $b[0] + $b[2] ) / 2, 1 ), round( ( $b[1] + $b[3] ) / 2, 1 ) ) : null; }
// Painel agregado: só existe quando n >= mínimo. Cada organização decide o que agrega.
function tcd_pub_rede() {
	if ( ! tcd_pub_rede_activa() ) { return null; } $lista = tcd_pub_rede_lista(); $ha = 0.0; $ncam = 0; $paises = array(); $orgs = array();
	foreach ( $lista as $id => $d ) { $c = tcd_pub_cfg( $d ); if ( in_array( 'ha', $c['rede']['agrega'], true ) ) { $ha += (float) tcd_org_uso( $id )['ha']; } if ( in_array( 'camadas', $c['rede']['agrega'], true ) ) { $ncam += count( tcd_pub_camadas( $d ) ); } if ( ! empty( $d['pais'] ) ) { $paises[ $d['pais'] ] = 1; } $orgs[] = array( 'nome' => $c['titulo'] ?: $d['nome'], 'pais' => (string) ( $d['pais'] ?? '' ), 'slug' => $c['slug'], 'centro' => tcd_pub_centro( $d ), 'url' => tcd_pub_url( $d ) ); }
	return array( 'n' => count( $lista ), 'ha' => round( $ha ), 'camadas' => $ncam, 'paises' => count( $paises ), 'organizacoes' => $orgs );
}
// Ficheiro público pré-gerado (já generalizado) por camada: pub-<id>-<hash>.geojson na pasta da organização; o hash muda com o
// ficheiro de origem, o grupo, a marca sensível e o estado do m90256, por isso o URL antigo deixa de existir quando a camada muda.
function tcd_pub_ficheiro( $c ) { return tcd_cam_pasta( $c['org'] ) . '/pub-' . (int) $c['id'] . '-' . substr( md5( (string) ( $c['fich'] ?? '' ) . '|' . (int) ! empty( $c['sensivel'] ) . '|' . (string) ( $c['grupo'] ?? '' ) . '|' . (int) tcd_pub_sen_ok() ), 0, 12 ) . '.geojson'; }
function tcd_pub_gerar( $c ) { $f = tcd_pub_ficheiro( $c ); if ( file_exists( $f ) ) { return $f; } $gj = tcd_cam_geojson( $c, 0, 'publico' ); if ( null === $gj ) { return null; } return false === @file_put_contents( $f, wp_json_encode( $gj ) ) ? null : $f; }
function tcd_pub_apagar_ficheiros( $org, $id = 0, $manter = '' ) { foreach ( (array) glob( tcd_cam_pasta( $org ) . '/pub-' . ( $id ? (int) $id : '*' ) . '-*.geojson' ) as $f ) { if ( $f !== $manter ) { @unlink( $f ); } } }
// Põe os ficheiros públicos de uma organização em dia: gera os das camadas públicas, apaga os das outras e os desactualizados.
function tcd_pub_sincronizar( $d ) {
	$d = is_array( $d ) ? $d : tcd_org_dados( $d ); if ( ! $d ) { return; } $pub = array(); $on = tcd_pub_cfg( $d )['on'];
	foreach ( tcd_pub_camadas( $d ) as $c ) { $f = $on ? tcd_pub_gerar( $c ) : ''; tcd_pub_apagar_ficheiros( $d['id'], $c['id'], (string) $f ); $pub[ (int) $c['id'] ] = 1; }
	foreach ( (array) glob( tcd_cam_pasta( $d['id'] ) . '/pub-*-*.geojson' ) as $f ) { if ( preg_match( '/pub-(\d+)-/', basename( $f ), $m ) && empty( $pub[ (int) $m[1] ] ) ) { @unlink( $f ); } }
}
function tcd_pub_limpar_tudo() { foreach ( tcd_pub_indice() as $s => $id ) { tcd_pub_limpar_cache( array( $s ) ); $d = tcd_org_dados( $id ); if ( $d ) { tcd_pub_apagar_ficheiros( $id ); tcd_pub_sincronizar( $d ); } } tcd_pub_limpar_cache( array() ); }
add_action( 'update_option_tcd_sen_off', 'tcd_pub_limpar_tudo' ); add_action( 'add_option_tcd_sen_off', 'tcd_pub_limpar_tudo' );
add_action( 'update_option_tcd_pub_off', function () { flush_rewrite_rules( false ); delete_option( 'tcd_pub_rw' ); tcd_pub_limpar_tudo(); } );
function tcd_pub_limpar_cache( $slugs ) { foreach ( (array) $slugs as $s ) { if ( ! $s ) { continue; } foreach ( tcd_pub_linguas() as $l ) { delete_transient( 'tcd_pub_' . $s . '_' . $l ); } } foreach ( tcd_pub_linguas() as $l ) { delete_transient( 'tcd_pub__lista_' . $l ); } foreach ( (array) $slugs as $s ) { if ( $s ) { delete_transient( 'tcd_pub_404_' . $s ); } } }

// ---------- páginas públicas: /organizacoes/ e /organizacoes/<slug>/ ----------
add_action( 'init', function () {
	if ( ! tcd_pub_on() ) { return; }
	if ( function_exists( 'get_page_by_path' ) && get_page_by_path( 'organizacoes' ) ) { if ( ! get_option( 'tcd_pub_aviso_pagina' ) ) { update_option( 'tcd_pub_aviso_pagina', time(), false ); if ( function_exists( 'tcd_tg_enviar' ) ) { tcd_tg_enviar( 'm90261: existe uma página WordPress «organizacoes»; as páginas públicas das organizações não foram ligadas. Apagar ou renomear essa página.' ); } } return; }
	add_rewrite_tag( '%tcd_org_pub%', '([a-z0-9_-]+)' );
	add_rewrite_rule( '^organizacoes/([a-z0-9-]+)/?$', 'index.php?tcd_org_pub=$matches[1]', 'top' );
	add_rewrite_rule( '^organizacoes/?$', 'index.php?tcd_org_pub=_lista', 'top' );
	if ( TCD_PUB_RW_V !== (string) get_option( 'tcd_pub_rw', '' ) ) { flush_rewrite_rules( false ); update_option( 'tcd_pub_rw', TCD_PUB_RW_V, false ); }
}, 20 );
add_filter( 'query_vars', function ( $v ) { $v[] = 'tcd_org_pub'; return $v; } );
add_action( 'template_redirect', function () {
	$q = (string) get_query_var( 'tcd_org_pub' ); if ( '' === $q ) { return; }
	$l = sanitize_key( $_GET['l'] ?? '' ); $r = tcd_pub_on() ? tcd_pub_responder( $q, $l ) : array( 'status' => 404, 'html' => '' ); // desligado: 404, nunca a página inicial // phpcs:ignore
	if ( 404 === $r['status'] ) { status_header( 404 ); nocache_headers(); global $wp_query; if ( is_object( $wp_query ) && method_exists( $wp_query, 'set_404' ) ) { $wp_query->set_404(); } return; }
	status_header( 200 ); header( 'Content-Type: text/html; charset=utf-8' ); header( 'Cache-Control: public, max-age=600' ); header( 'X-Content-Type-Options: nosniff' ); header( 'Referrer-Policy: strict-origin-when-cross-origin' ); header( 'X-Frame-Options: SAMEORIGIN' );
	echo $r['html']; if ( ! defined( 'TCD_TESTE' ) ) { exit; } // phpcs:ignore
} );
// Devolve {status, html}. A lista é «_lista». Cache por transient 1 h, apagada ao guardar.
function tcd_pub_responder( $q, $l = '' ) {
	$l = in_array( $l, tcd_pub_linguas(), true ) ? $l : '';
	if ( '_lista' === $q ) { $l = $l ?: 'pt'; $k = 'tcd_pub__lista_' . $l; $h = get_transient( $k ); if ( ! $h ) { $h = tcd_pub_html_lista( $l ); set_transient( $k, $h, HOUR_IN_SECONDS ); } return array( 'status' => 200, 'html' => $h ); }
	if ( ! tcd_pub_slug_ok( $q ) || get_transient( 'tcd_pub_404_' . $q ) ) { return array( 'status' => 404, 'html' => '' ); }
	$d = tcd_pub_por_slug( $q ); $c = $d ? tcd_pub_cfg( $d ) : null; if ( ! $d || 'arquivada' === $d['estado'] || ! $c['on'] ) { set_transient( 'tcd_pub_404_' . $q, 1, 10 * MINUTE_IN_SECONDS ); return array( 'status' => 404, 'html' => '' ); }
	$l = $l ?: ( in_array( $d['lingua'] ?? '', tcd_pub_linguas(), true ) ? $d['lingua'] : 'pt' ); $k = 'tcd_pub_' . $c['slug'] . '_' . $l; $h = get_transient( $k );
	if ( ! $h ) { $h = tcd_pub_html_org( $d, $l ); set_transient( $k, $h, HOUR_IN_SECONDS ); }
	return array( 'status' => 200, 'html' => $h );
}
function tcd_pub_t( $l ) {
	$t = array(
		'pt' => array( 'mapa' => 'Mapa', 'ind' => 'Indicadores', 'cron' => 'Cronologia', 'equipa' => 'Equipa', 'nao' => 'O que não funcionou', 'camadas' => 'Camadas públicas', 'lic' => 'Dados públicos sob licença', 'gerada' => 'Página gerada no IPR Atlas, Terracrua Design', 'contacto' => 'Contacto', 'orgs' => 'Organizações no IPR Atlas', 'vazio' => 'As organizações que trabalham no IPR Atlas podem publicar aqui a sua página.', 'ver' => 'Ver página', 'n_org' => 'organizações', 'n_ha' => 'hectares em conjunto', 'n_pais' => 'países', 'painel' => 'Organizações que partilham o seu progresso', 'elementos' => 'elementos', 'todas' => 'Todas as organizações' ),
		'en' => array( 'mapa' => 'Map', 'ind' => 'Indicators', 'cron' => 'Timeline', 'equipa' => 'Team', 'nao' => 'What did not work', 'camadas' => 'Public layers', 'lic' => 'Public data licensed under', 'gerada' => 'Page generated in IPR Atlas, Terracrua Design', 'contacto' => 'Contact', 'orgs' => 'Organisations in IPR Atlas', 'vazio' => 'Organisations working in IPR Atlas can publish their page here.', 'ver' => 'View page', 'n_org' => 'organisations', 'n_ha' => 'hectares together', 'n_pais' => 'countries', 'painel' => 'Organisations sharing their progress', 'elementos' => 'features', 'todas' => 'All organisations' ),
		'es' => array( 'mapa' => 'Mapa', 'ind' => 'Indicadores', 'cron' => 'Cronología', 'equipa' => 'Equipo', 'nao' => 'Lo que no funcionó', 'camadas' => 'Capas públicas', 'lic' => 'Datos públicos bajo licencia', 'gerada' => 'Página generada en IPR Atlas, Terracrua Design', 'contacto' => 'Contacto', 'orgs' => 'Organizaciones en IPR Atlas', 'vazio' => 'Las organizaciones que trabajan en IPR Atlas pueden publicar aquí su página.', 'ver' => 'Ver página', 'n_org' => 'organizaciones', 'n_ha' => 'hectáreas en conjunto', 'n_pais' => 'países', 'painel' => 'Organizaciones que comparten su progreso', 'elementos' => 'elementos', 'todas' => 'Todas las organizaciones' ),
	);
	return $t[ $l ] ?? $t['pt'];
}
function tcd_pub_css() {
	return '<style>:root{--bg:#faf8f1;--tx:#2f2f2a;--mu:#6b6f5c;--ln:#d9d4c2;--p:#fff;--ac:#75834a;--ac2:#b8652f}@media(prefers-color-scheme:dark){:root{--bg:#1d1e1a;--tx:#e8e4d8;--mu:#a9ab9a;--ln:#3a3b33;--p:#262720;--ac:#9aa86a;--ac2:#d08a55}}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--tx);font:16px/1.55 Inter,Helvetica,Arial,sans-serif}a{color:var(--ac2)}.w{max-width:960px;margin:0 auto;padding:0 16px}header.t{padding:28px 0 10px;border-bottom:1px solid var(--ln)}.k{font:500 11px/1 "IBM Plex Mono",monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--ac2);margin:0 0 8px}h1{font:400 30px/1.2 Raleway,Inter,sans-serif;margin:0 0 6px}h2{font:400 21px/1.25 Raleway,Inter,sans-serif;margin:30px 0 10px}h3{font:600 15px/1.3 Inter,sans-serif;margin:16px 0 6px}.mu{color:var(--mu);font-size:14px}.ls a{margin-right:10px;font-size:13px}#mapa{height:420px;border:1px solid var(--ln);border-radius:10px;background:var(--p)}.leg{display:flex;flex-wrap:wrap;gap:8px 16px;margin:8px 0 0;padding:0;list-style:none;font-size:13px}.leg i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:5px}.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px}.card{background:var(--p);border:1px solid var(--ln);border-radius:10px;padding:12px 14px}.card b{display:block;font:500 24px/1.1 Raleway,Inter,sans-serif}.card small{color:var(--mu)}.cron{list-style:none;margin:0;padding:0 0 0 14px;border-left:2px solid var(--ln)}.cron li{margin:0 0 16px;padding-left:12px}.cron time{font:500 12px "IBM Plex Mono",monospace;color:var(--ac2)}.cron p{margin:4px 0 0;white-space:pre-line}.nao{background:var(--p);border-left:4px solid var(--ac2);padding:12px 14px;border-radius:0 10px 10px 0;white-space:pre-line}.eq{display:flex;flex-wrap:wrap;gap:8px;padding:0;list-style:none}.eq li{background:var(--p);border:1px solid var(--ln);border-radius:20px;padding:4px 12px;font-size:14px}footer.f{margin:40px 0 30px;padding-top:16px;border-top:1px solid var(--ln);font-size:13px;color:var(--mu)}.tpub-dados h3{margin-top:10px}.tpub-dados p{margin:4px 0}.orgs{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;padding:0;list-style:none}.orgs li{background:var(--p);border:1px solid var(--ln);border-radius:10px;padding:14px 16px}.orgs b{font:500 18px/1.2 Raleway,Inter,sans-serif}.orgs p{margin:6px 0;font-size:14px}.resumo{white-space:pre-line;max-width:720px}</style>';
}
function tcd_pub_cabeca( $titulo, $descr, $l ) {
	return '<!doctype html><html lang="' . esc_attr( $l ) . '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' . esc_html( $titulo ) . ' · IPR Atlas</title><meta name="description" content="' . esc_attr( mb_substr( $descr, 0, 160 ) ) . '"><meta property="og:title" content="' . esc_attr( $titulo ) . '"><meta property="og:description" content="' . esc_attr( mb_substr( $descr, 0, 200 ) ) . '"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Raleway:wght@400;500&display=swap"><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/maplibre-gl@5.24.0/dist/maplibre-gl.css">' . tcd_pub_css() . '</head><body>';
}
// Fundo do mapa: por defeito o estilo OpenFreeMap usado no Atlas (sem chave nem limites publicados; dados OpenStreetMap). Os tiles de
// tile.openstreetmap.org não se usam: a política da OSMF reserva-os ao projecto e não garante serviço a sites de terceiros.
// O filtro tcd_pub_fundo aceita um URL de estilo ou um objecto de estilo maplibre (por exemplo um raster próprio com atribuição).
function tcd_pub_fundo() { return apply_filters( 'tcd_pub_fundo', 'https://tiles.openfreemap.org/styles/liberty' ); }
function tcd_pub_js_mapa( $cfg ) {
	$cfg['fundo'] = tcd_pub_fundo(); return '<script src="https://cdn.jsdelivr.net/npm/maplibre-gl@5.24.0/dist/maplibre-gl.js"></script><script>(function(c){var el=document.getElementById("mapa");if(!el||!window.maplibregl)return;var m=new maplibregl.Map({container:"mapa",style:c.fundo,center:c.centro||[-8,39.5],zoom:c.centro?6:5,attributionControl:{compact:true}});m.addControl(new maplibregl.NavigationControl(),"top-right");'
		. 'm.on("load",function(){if(c.bbox){m.fitBounds([[c.bbox[0],c.bbox[1]],[c.bbox[2],c.bbox[3]]],{padding:30,maxZoom:12,duration:0});}'
		. '(c.camadas||[]).forEach(function(x){var s="c"+x.id;m.addSource(s,{type:"geojson",data:x.url});m.addLayer({id:s+"f",type:"fill",source:s,filter:["==",["geometry-type"],"Polygon"],paint:{"fill-color":x.cor,"fill-opacity":.25}});m.addLayer({id:s+"l",type:"line",source:s,paint:{"line-color":x.cor,"line-width":1.5}});m.addLayer({id:s+"p",type:"circle",source:s,filter:["==",["geometry-type"],"Point"],paint:{"circle-color":x.cor,"circle-radius":5,"circle-stroke-color":"#fff","circle-stroke-width":1}});});'
		. '(c.pontos||[]).forEach(function(p){if(!p.centro)return;var a=document.createElement("a");a.href=p.url;a.title=p.nome;a.style.cssText="display:block;width:14px;height:14px;border-radius:50%;background:#b8652f;border:2px solid #fff;box-shadow:0 0 0 1px #b8652f";new maplibregl.Marker({element:a}).setLngLat(p.centro).addTo(m);});});})(' . wp_json_encode( $cfg, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT ) . ');</script>';
}
function tcd_pub_num( $v ) { return is_numeric( $v ) ? number_format( (float) $v, ( floor( (float) $v ) == (float) $v ) ? 0 : 1, ',', ' ' ) : (string) $v; }
function tcd_pub_html_org( $d, $l ) {
	$f = tcd_pub_ficha( $d, $l ); $t = tcd_pub_t( $l ); $c = tcd_pub_cfg( $d ); $rede = tcd_pub_rede_activa();
	$h = tcd_pub_cabeca( $f['nome'], $f['resumo'] ?: $f['nome'], $l ) . '<header class="t"><div class="w"><p class="k">IPR Atlas</p><h1>' . esc_html( $f['nome'] ) . '</h1><p class="mu">' . esc_html( trim( $f['pais'] . ( $f['modelo'] ? ' · ' . $f['modelo'] : '' ) ) ) . '</p><p class="ls">';
	foreach ( tcd_pub_linguas() as $x ) { if ( '' !== trim( (string) $c['resumo'][ $x ] ) || $x === $l ) { $h .= $x === $l ? '<b>' . $x . '</b> ' : '<a href="' . esc_url( add_query_arg( 'l', $x, $f['url'] ) ) . '">' . $x . '</a>'; } }
	$h .= '</p></div></header><main class="w">';
	if ( $f['resumo'] ) { $h .= '<p class="resumo">' . esc_html( $f['resumo'] ) . '</p>'; }
	if ( in_array( 'mapa', $f['blocos'], true ) && $f['camadas'] ) {
		$h .= '<h2>' . esc_html( $t['mapa'] ) . '</h2><div id="mapa"></div><ul class="leg">'; $bb = null;
		foreach ( $f['camadas'] as $x ) { $h .= '<li><i style="background:' . esc_attr( $x['cor'] ) . '"></i>' . esc_html( $x['nome'] ) . ' <span class="mu">' . esc_html( tcd_pub_num( $x['n'] ) . ' ' . $t['elementos'] ) . '</span></li>'; $b = $x['bbox']; $bb = $bb ? array( min( $bb[0], $b[0] ), min( $bb[1], $b[1] ), max( $bb[2], $b[2] ), max( $bb[3], $b[3] ) ) : $b; }
		$h .= '</ul>' . tcd_pub_js_mapa( array( 'camadas' => $f['camadas'], 'bbox' => $bb ) );
	}
	if ( $f['indicadores'] ) { $h .= '<h2>' . esc_html( $t['ind'] ) . '</h2><div class="cards">'; foreach ( $f['indicadores'] as $i ) { $h .= '<div class="card"><small>' . esc_html( $i['nome'] ) . '</small><b>' . esc_html( tcd_pub_num( $i['valor'] ) ) . ( $i['unidade'] ? ' <span class="mu" style="font-size:14px">' . esc_html( $i['unidade'] ) . '</span>' : '' ) . '</b>' . ( $i['ano'] ? '<small>' . esc_html( $i['ano'] ) . '</small>' : '' ) . '</div>'; } $h .= '</div>'; }
	if ( $f['cronologia'] ) { $h .= '<h2>' . esc_html( $t['cron'] ) . '</h2><ul class="cron">'; foreach ( $f['cronologia'] as $x ) { $h .= '<li><time>' . esc_html( $x['data'] ) . '</time><br><b>' . esc_html( $x['titulo'] ) . '</b><p>' . esc_html( $x['texto'] ) . '</p></li>'; } $h .= '</ul>'; }
	if ( '' !== trim( $f['nao_funcionou'] ) ) { $h .= '<h2>' . esc_html( $t['nao'] ) . '</h2><div class="nao">' . esc_html( $f['nao_funcionou'] ) . '</div>'; }
	if ( $f['equipa'] ) { $h .= '<h2>' . esc_html( $t['equipa'] ) . '</h2><ul class="eq">'; foreach ( $f['equipa'] as $n ) { $h .= '<li>' . esc_html( $n ) . '</li>'; } $h .= '</ul>'; }
	if ( $f['contacto'] ) { $h .= '<p class="mu">' . esc_html( $t['contacto'] ) . ': <a href="mailto:' . esc_attr( $f['contacto'] ) . '">' . esc_html( $f['contacto'] ) . '</a></p>'; }
	$h .= '</main><footer class="f"><div class="w">' . ( 'reservado' !== $f['licenca'] ? '<p>' . esc_html( $t['lic'] ) . ' ' . esc_html( $f['licenca'] ) . '.</p>' : '' ) . tcd_pub_dados_html( $rede, true ) . '<p><a href="' . esc_url( home_url( '/organizacoes/' ) ) . '">' . esc_html( $t['todas'] ) . '</a> · ' . esc_html( $t['gerada'] ) . '</p></div></footer></body></html>';
	return $h;
}
function tcd_pub_html_lista( $l ) {
	$t = tcd_pub_t( $l ); $orgs = tcd_pub_orgs(); $r = tcd_pub_rede();
	$h = tcd_pub_cabeca( $t['orgs'], $t['vazio'], $l ) . '<header class="t"><div class="w"><p class="k">IPR Atlas</p><h1>' . esc_html( $r ? $t['painel'] : $t['orgs'] ) . '</h1></div></header><main class="w">';
	if ( $r ) {
		$h .= '<div class="cards"><div class="card"><b>' . esc_html( tcd_pub_num( $r['n'] ) ) . '</b><small>' . esc_html( $t['n_org'] ) . '</small></div>' . ( $r['ha'] > 0 ? '<div class="card"><b>' . esc_html( tcd_pub_num( $r['ha'] ) ) . '</b><small>' . esc_html( $t['n_ha'] ) . '</small></div>' : '' ) . '<div class="card"><b>' . esc_html( tcd_pub_num( $r['paises'] ) ) . '</b><small>' . esc_html( $t['n_pais'] ) . '</small></div></div><div id="mapa" style="margin-top:14px"></div>' . tcd_pub_js_mapa( array( 'pontos' => $r['organizacoes'] ) );
	}
	if ( ! $orgs ) { $h .= '<p class="resumo">' . esc_html( $t['vazio'] ) . '</p>'; }
	else { $h .= '<ul class="orgs">'; foreach ( $orgs as $d ) { $c = tcd_pub_cfg( $d ); $h .= '<li><b>' . esc_html( $c['titulo'] ?: $d['nome'] ) . '</b><p class="mu">' . esc_html( (string) ( $d['pais'] ?? '' ) ) . '</p><p>' . esc_html( mb_substr( tcd_pub_resumo( $c, $l ), 0, 180 ) ) . '</p><p><a href="' . esc_url( tcd_pub_url( $d ) ) . '">' . esc_html( $t['ver'] ) . '</a></p></li>'; } $h .= '</ul>'; }
	return $h . '</main><footer class="f"><div class="w">' . tcd_pub_dados_html( (bool) $r, true ) . '<p>' . esc_html( $t['gerada'] ) . '</p></div></footer></body></html>';
}

// ---------- REST público (sem sessão, limitado por IP) ----------
function tcd_pub_ip_ok() {
	$ip = function_exists( 'tcd_sn_ip' ) ? (string) tcd_sn_ip() : (string) ( $_SERVER['REMOTE_ADDR'] ?? '0' ); // phpcs:ignore
	$k = 'tcd_pub_ip_' . ( function_exists( 'tcd_org_ip_chave' ) ? tcd_org_ip_chave( $ip ) : md5( $ip ) ); $n = (int) get_transient( $k ); if ( $n >= 60 ) { return false; } set_transient( $k, $n + 1, HOUR_IN_SECONDS ); return true;
}
add_action( 'rest_api_init', function () {
	if ( ! tcd_pub_on() ) { return; }
	$erro = function ( $m, $s ) { return new WP_Error( 'pub', $m, array( 'status' => $s ) ); }; $ok = function ( $d, $max ) { $r = new WP_REST_Response( $d ); $r->header( 'Cache-Control', 'public, max-age=' . (int) $max ); return $r; };
	register_rest_route( 'tcd/v1', '/publico/org/(?P<slug>[a-z0-9-]{3,40})', array( 'methods' => 'GET', 'permission_callback' => '__return_true', 'callback' => function ( WP_REST_Request $q ) use ( $erro, $ok ) {
		if ( ! tcd_pub_ip_ok() ) { return $erro( 'Demasiados pedidos. Tente daqui a uma hora.', 429 ); }
		$d = tcd_pub_por_slug( (string) $q['slug'] ); if ( ! $d || 'arquivada' === $d['estado'] || ! tcd_pub_cfg( $d )['on'] ) { return $erro( 'Página não encontrada.', 404 ); }
		$l = sanitize_key( $q['l'] ?? '' ); return $ok( tcd_pub_ficha( $d, in_array( $l, tcd_pub_linguas(), true ) ? $l : '' ), 600 );
	} ) );
	register_rest_route( 'tcd/v1', '/publico/org/(?P<slug>[a-z0-9-]{3,40})/camada/(?P<id>\d+)', array( 'methods' => 'GET', 'permission_callback' => '__return_true', 'callback' => function ( WP_REST_Request $q ) use ( $erro, $ok ) {
		if ( ! tcd_pub_ip_ok() ) { return $erro( 'Demasiados pedidos. Tente daqui a uma hora.', 429 ); }
		$d = tcd_pub_por_slug( (string) $q['slug'] ); if ( ! $d || 'arquivada' === $d['estado'] || ! tcd_pub_cfg( $d )['on'] ) { return $erro( 'Página não encontrada.', 404 ); }
		$c = null; foreach ( tcd_pub_camadas( $d ) as $x ) { if ( (int) $x['id'] === (int) $q['id'] ) { $c = $x; break; } } if ( ! $c ) { return $erro( 'Camada não encontrada.', 404 ); }
		if ( $c['sens'] && ! tcd_pub_sen_ok() ) { return $erro( 'Camada não encontrada.', 404 ); } // segunda barreira: nunca sai sensível sem o m90256 ligado
		$f = tcd_pub_gerar( $c ); if ( ! $f ) { return $erro( 'Camada não encontrada.', 404 ); }
		if ( ! defined( 'TCD_TESTE' ) ) { header( 'Content-Type: application/geo+json; charset=utf-8' ); header( 'Cache-Control: public, max-age=3600' ); header( 'X-Content-Type-Options: nosniff' ); header( 'Content-Length: ' . filesize( $f ) ); readfile( $f ); exit; } // ficheiro pré-gerado, sem descodificar
		return $ok( json_decode( (string) file_get_contents( $f ), true ), 3600 );
	} ) );
	register_rest_route( 'tcd/v1', '/publico/rede', array( 'methods' => 'GET', 'permission_callback' => '__return_true', 'callback' => function () use ( $erro, $ok ) {
		if ( ! tcd_pub_ip_ok() ) { return $erro( 'Demasiados pedidos. Tente daqui a uma hora.', 429 ); }
		$r = tcd_pub_rede(); return $r ? $ok( $r, 600 ) : $erro( 'Nada para mostrar por agora.', 404 );
	} ) );
} );

// ---------- Oficina: bloco «publico» (gestor) e «cronica» (editores) ----------
add_filter( 'tcd_of_blocos', function ( $b ) {
	$u = wp_get_current_user(); if ( ! tcd_pub_on() || ! tcd_org_de( $u ) ) { return $b; }
	$org = tcd_org_de( $u ); $gere = in_array( tcd_org_papel( $u, $org ), array( 'dono', 'gestor' ), true );
	$novo = array( 'publico' => array( 't' => 'Página pública', 'k' => 'Divulgação', 'f' => 'tcd_pub_bloco', 'w' => 2, 'cache' => 0 ), 'cronica' => array( 't' => 'Cronologia', 'k' => 'Divulgação', 'f' => 'tcd_pub_bloco_cronica', 'w' => 1, 'cache' => 0 ) );
	if ( ! $gere ) { unset( $novo['publico'] ); } $apos = isset( $b['indicadores'] ) ? 'indicadores' : 'camadas'; $out = array(); $posto = false;
	foreach ( $b as $k => $v ) { $out[ $k ] = $v; if ( $k === $apos ) { $out += $novo; $posto = true; } }
	return $posto ? $out : $out + $novo;
}, 9 );
function tcd_pub_msgs() { return array( 'slug' => 'Endereço inválido: só letras minúsculas, números e hífenes, 3 a 40 caracteres.', 'usado' => 'Esse endereço já está a ser usado por outra organização.', 'ligada' => 'Página pública guardada e ligada.', 'desligada' => 'Guardado. A página fica desligada.', 'data' => 'Falta a data ou o título.', 'limite' => 'Limite de 200 entradas (incluindo o lixo). Espere pela limpeza do lixo ou fale connosco.', 'cronica' => 'Entrada guardada. O gestor decide se é pública.', 'publica' => 'Entrada pública.', 'oculta' => 'Entrada oculta.', 'lixo' => 'Entrada no lixo (apagada ao fim de 30 dias).' ); }
function tcd_pub_form( $op, $campos, $botao, $cls = '' ) { return '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" class="' . esc_attr( 'tpub-f ' . $cls ) . '"><input type="hidden" name="action" value="tcd_pub_acao"><input type="hidden" name="op" value="' . esc_attr( $op ) . '">' . wp_nonce_field( 'tcd_pub', '_wpnonce', true, false ) . $campos . '<button type="submit" class="tof-btn">' . esc_html( $botao ) . '</button></form>'; }
function tcd_pub_bloco( $u ) {
	$org = tcd_org_de( $u ); $d = $org ? tcd_org_dados( $org ) : null; if ( ! $d || ! in_array( tcd_org_papel( $u, $org ), array( 'dono', 'gestor' ), true ) ) { return ''; }
	$c = tcd_pub_cfg( $d ); $so = tcd_org_so_leitura( $org ); $g = tcd_cam_grupos( $org ); $min = tcd_pub_minimo(); $h = '<div id="publico">';
	if ( isset( $_GET['pub_msg'] ) ) { $h .= '<p class="tof-vz" role="status">' . esc_html( tcd_pub_msgs()[ sanitize_key( $_GET['pub_msg'] ) ] ?? '' ) . '</p>'; } // phpcs:ignore
	$h .= '<p class="tof-vz">' . ( $c['on'] && $c['slug'] ? 'A página está ligada: <a href="' . esc_url( tcd_pub_url( $d ) ) . '">' . esc_html( tcd_pub_url( $d ) ) . '</a>' : 'A página pública está desligada. Nada da organização é visível fora dela enquanto não a ligares.' ) . '</p>';
	$cb = function ( $n, $v, $on, $txt, $dis = false ) { return '<label class="tpub-cb"><input type="checkbox" name="' . esc_attr( $n ) . '" value="' . esc_attr( $v ) . '"' . ( $on ? ' checked' : '' ) . ( $dis ? ' disabled' : '' ) . '> ' . esc_html( $txt ) . '</label>'; };
	$f = '<p class="tof-k">Página</p>' . $cb( 'on', '1', $c['on'], 'Ligar a página pública' ) . '<label>Endereço<span class="tof-vz">/organizacoes/</span><input type="text" name="slug" value="' . esc_attr( $c['slug'] ) . '" pattern="[a-z0-9-]{3,40}" maxlength="40" placeholder="nome-da-organizacao"></label><label>Título (vazio = nome da organização)<input type="text" name="titulo" value="' . esc_attr( $c['titulo'] ) . '" maxlength="90"></label>';
	foreach ( tcd_pub_linguas() as $l ) { $f .= '<label>Resumo (' . $l . ')<textarea name="resumo_' . $l . '" maxlength="1200" rows="3">' . esc_textarea( $c['resumo'][ $l ] ) . '</textarea></label>'; }
	$f .= '<p class="tof-k">Secções</p>'; foreach ( array( 'mapa' => 'Mapa', 'indicadores' => 'Indicadores', 'cronologia' => 'Cronologia', 'equipa' => 'Equipa (nomes dos membros activos)', 'nao_funcionou' => 'O que não funcionou (do relatório)' ) as $k => $v ) { $f .= $cb( 'blocos[]', $k, in_array( $k, $c['blocos'], true ), $v ); }
	$f .= '<p class="tof-k">Camadas públicas</p><p class="tof-vz">Só estas saem para fora, sempre generalizadas se forem sensíveis. ' . ( tcd_pub_sen_ok() ? '' : 'Sem o módulo de dados sensíveis ligado, as camadas sensíveis não podem ser publicadas.' ) . '</p>';
	$lista = tcd_cam_lista( $org, null, false ); if ( ! $lista ) { $f .= tcd_of_vazio( 'Ainda não há camadas.' ); }
	foreach ( $lista as $x ) { $pode = tcd_pub_pode_publicar( $x, $g ); $f .= $cb( 'camadas[]', (int) $x['id'], $pode && in_array( (int) $x['id'], $c['camadas_publicas'], true ), $x['nome'] . ' (' . ( $g[ $x['grupo'] ]['nome'] ?? '' ) . ')' . ( $pode ? '' : ' · sensível, não publicável' ), ! $pode ); }
	$f .= '<p class="tof-k">Partilha com outras organizações</p><p class="tof-vz">Um painel conjunto só aparece quando pelo menos ' . (int) $min . ' organizações aderem. Escolhe o que agregas; nunca saem coordenadas exactas.</p>' . $cb( 'rede_on', '1', $c['rede']['on'], 'Aderir ao painel conjunto' );
	foreach ( array( 'ha' => 'hectares', 'camadas' => 'número de camadas públicas', 'indicadores' => 'indicadores públicos' ) as $k => $v ) { $f .= $cb( 'agrega[]', $k, in_array( $k, $c['rede']['agrega'], true ), 'agregar ' . $v ); }
	$sel = '<select name="licenca">'; foreach ( tcd_pub_licencas() as $k => $v ) { $sel .= '<option value="' . esc_attr( $k ) . '"' . selected( $k, $c['licenca'], false ) . '>' . esc_html( $v ) . '</option>'; } $sel .= '</select>';
	$f .= '<p class="tof-k">Outros</p>' . $cb( 'equipa', '1', $c['equipa'], 'Mostrar os nomes da equipa (quem se puser fora da rede na sua conta não aparece)' ) . '<label>E-mail público (opcional)<input type="email" name="contacto" value="' . esc_attr( $c['contacto'] ) . '"></label><label>Licença do que é público' . $sel . '</label>';
	$h .= $so ? '<div class="tpub-so">' . str_replace( '<input', '<input disabled', str_replace( '<textarea', '<textarea disabled', str_replace( '<select', '<select disabled', $f ) ) ) . '<p class="tof-vz">A organização está em leitura: a página pública mantém-se como está.</p></div>' : tcd_pub_form( 'guardar', $f, 'Guardar página pública' );
	$h .= '<style>.tpub-f,.tpub-so{display:grid;gap:6px}.tpub-f label,.tpub-so label{display:flex;flex-direction:column;gap:3px;font-size:13px;color:var(--mu)}.tpub-cb{flex-direction:row!important;align-items:center;gap:6px!important;color:var(--tx)!important}.tpub-f input[type=text],.tpub-f input[type=email],.tpub-f textarea,.tpub-f select,.tpub-so input,.tpub-so textarea,.tpub-so select{font:14px Inter,sans-serif;border:1px solid var(--ln);border-radius:8px;padding:7px 9px;background:var(--p);color:var(--tx)}.tpub-f .tof-btn{justify-self:start}.tpub-f .tof-k{margin:10px 0 2px}.tpub-l{margin:0;padding:0;list-style:none}.tpub-l li{display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-bottom:1px solid var(--ln);font-size:13px}.tpub-l .tpub-f{display:inline-flex;gap:4px}.tpub-l .tof-btn{padding:3px 8px;font-size:12px}</style></div>';
	return $h;
}
function tcd_pub_bloco_cronica( $u ) {
	$org = tcd_org_de( $u ); $d = $org ? tcd_org_dados( $org ) : null; if ( ! $d ) { return ''; } $gere = tcd_org_pode( $u, 'gerir', $org ); $edita = tcd_org_pode( $u, 'editar', $org ); $h = '<div id="cronica">';
	if ( isset( $_GET['cron_msg'] ) ) { $h .= '<p class="tof-vz" role="status">' . esc_html( tcd_pub_msgs()[ sanitize_key( $_GET['cron_msg'] ) ] ?? '' ) . '</p>'; } // phpcs:ignore
	$h .= '<p class="tof-vz">Marcos do trabalho da organização. Só as entradas marcadas «pública» pelo gestor saem na página pública.</p>';
	$lista = tcd_pub_cronicas( $org, false ); if ( ! $lista ) { $h .= tcd_of_vazio( 'Ainda não há entradas.' ); } else { $h .= '<ul class="tpub-l">'; foreach ( array_slice( $lista, 0, 30 ) as $x ) { $h .= '<li><div><b>' . esc_html( $x['data'] ) . '</b> ' . esc_html( $x['titulo'] ) . ( ! empty( $x['publico'] ) ? ' <span class="tof-pill">pública</span>' : '' ) . '</div><div>' . ( $gere ? tcd_pub_form( 'cronica_publico', '<input type="hidden" name="cid" value="' . (int) $x['id'] . '"><input type="hidden" name="v" value="' . ( empty( $x['publico'] ) ? '1' : '0' ) . '">', empty( $x['publico'] ) ? 'Tornar pública' : 'Ocultar' ) : '' ) . ( ( $gere || ( $edita && (int) ( $x['por'] ?? 0 ) === (int) $u->ID ) ) ? tcd_pub_form( 'cronica_lixo', '<input type="hidden" name="cid" value="' . (int) $x['id'] . '">', 'Lixo', 's' ) : '' ) . '</div></li>'; } $h .= '</ul>'; }
	if ( $edita ) { $h .= tcd_pub_form( 'cronica', '<label>Data<input type="date" name="data" value="' . esc_attr( wp_date( 'Y-m-d' ) ) . '" required></label><label>Título<input type="text" name="titulo" maxlength="120" required></label><label>Texto<textarea name="texto" maxlength="2000" rows="3"></textarea></label>', 'Acrescentar' ); }
	return $h . '</div>';
}
add_action( 'admin_post_tcd_pub_acao', function () {
	check_admin_referer( 'tcd_pub' );
	$u = wp_get_current_user(); $org = tcd_org_de( $u ); $op = sanitize_key( $_POST['op'] ?? '' ); $msg = ''; $anc = 'publico'; // phpcs:ignore
	if ( ! tcd_pub_on() || ! $org ) { wp_die( 'Sem acesso.' ); } $d = tcd_org_dados( $org ); $gere = tcd_org_pode( $u, 'gerir', $org ); $edita = tcd_org_pode( $u, 'editar', $org );
	if ( 'guardar' === $op ) {
		if ( ! $gere ) { wp_die( 'Sem acesso.' ); } $velho = tcd_pub_cfg( $d ); $slug = strtolower( sanitize_text_field( wp_unslash( $_POST['slug'] ?? '' ) ) ); // phpcs:ignore
		if ( ! tcd_pub_slug_ok( $slug ) ) { $msg = 'slug'; }
		elseif ( ! tcd_pub_slug_livre( $slug, $org ) ) { $msg = 'usado'; }
		else {
			$r = array(); foreach ( tcd_pub_linguas() as $l ) { $r[ $l ] = mb_substr( sanitize_textarea_field( wp_unslash( $_POST[ 'resumo_' . $l ] ?? '' ) ), 0, 1200 ); } // phpcs:ignore
			$cam = array(); $g = tcd_cam_grupos( $org ); $todas = array(); foreach ( tcd_cam_lista( $org, null, false ) as $x ) { $todas[ (int) $x['id'] ] = $x; }
			foreach ( array_map( 'intval', (array) ( $_POST['camadas'] ?? array() ) ) as $cid ) { if ( isset( $todas[ $cid ] ) && tcd_pub_pode_publicar( $todas[ $cid ], $g ) ) { $cam[] = $cid; } } // phpcs:ignore
			$d['publico'] = tcd_pub_cfg( array( 'slug' => $d['slug'] ?? '', 'publico' => array( 'on' => ! empty( $_POST['on'] ), 'slug' => $slug, 'titulo' => mb_substr( sanitize_text_field( wp_unslash( $_POST['titulo'] ?? '' ) ), 0, 90 ), 'resumo' => $r, 'blocos' => array_map( 'sanitize_key', (array) ( $_POST['blocos'] ?? array() ) ), 'camadas_publicas' => $cam, 'equipa' => ! empty( $_POST['equipa'] ), 'rede' => array( 'on' => ! empty( $_POST['rede_on'] ), 'agrega' => array_map( 'sanitize_key', (array) ( $_POST['agrega'] ?? array() ) ) ), 'contacto' => sanitize_email( wp_unslash( $_POST['contacto'] ?? '' ) ), 'licenca' => sanitize_text_field( wp_unslash( $_POST['licenca'] ?? '' ) ) ) ) ); // phpcs:ignore
			tcd_org_guardar( $org, $d ); tcd_pub_indice( true ); tcd_pub_limpar_cache( array( $velho['slug'], $slug ) ); tcd_pub_sincronizar( tcd_org_dados( $org ) ); $msg = $d['publico']['on'] ? 'ligada' : 'desligada';
			if ( function_exists( 'tcd_tg_enviar' ) && (int) $d['publico']['on'] !== (int) $velho['on'] ) { tcd_tg_enviar( 'Organização ' . esc_html( $d['nome'] ) . ': página pública ' . ( $d['publico']['on'] ? 'ligada' : 'desligada' ) . ' por ' . esc_html( $u->display_name ) . '.' ); }
		}
	} elseif ( 'cronica' === $op ) {
		$anc = 'cronica'; if ( ! $edita ) { wp_die( 'Sem acesso.' ); } $data = sanitize_text_field( wp_unslash( $_POST['data'] ?? '' ) ); $tit = mb_substr( sanitize_text_field( wp_unslash( $_POST['titulo'] ?? '' ) ), 0, 120 ); // phpcs:ignore
		if ( ! preg_match( '/^\d{4}-\d{2}-\d{2}$/', $data ) || '' === $tit ) { $msg = 'data'; }
		elseif ( count( tcd_pub_cronicas( $org, false, true ) ) >= 200 ) { $msg = 'limite'; }
		else { $id = wp_insert_post( array( 'post_type' => 'tcd_cronica', 'post_status' => 'private', 'post_title' => $tit, 'post_author' => (int) $u->ID ) ); if ( $id && ! is_wp_error( $id ) ) { update_post_meta( $id, '_tcd_cron', array( 'org' => $org, 'data' => $data, 'texto' => mb_substr( sanitize_textarea_field( wp_unslash( $_POST['texto'] ?? '' ) ), 0, 2000 ), 'publico' => 0, 'por' => (int) $u->ID, 'lixo' => 0 ) ); update_post_meta( $id, '_tcd_cron_org', $org ); $msg = 'cronica'; } } // phpcs:ignore
	} elseif ( in_array( $op, array( 'cronica_publico', 'cronica_lixo' ), true ) ) {
		$anc = 'cronica'; $cid = (int) ( $_POST['cid'] ?? 0 ); $m = $cid && 'tcd_cronica' === get_post_type( $cid ) ? get_post_meta( $cid, '_tcd_cron', true ) : null; // phpcs:ignore
		if ( ! is_array( $m ) || (int) $m['org'] !== $org ) { wp_die( 'Sem acesso.' ); }
		if ( 'cronica_publico' === $op ) { if ( ! $gere ) { wp_die( 'Sem acesso.' ); } $m['publico'] = (int) ! empty( $_POST['v'] ); $msg = $m['publico'] ? 'publica' : 'oculta'; } // phpcs:ignore
		else { if ( ! ( $gere || ( $edita && (int) $m['por'] === (int) $u->ID ) ) ) { wp_die( 'Sem acesso.' ); } $m['lixo'] = time(); $msg = 'lixo'; }
		update_post_meta( $cid, '_tcd_cron', $m ); tcd_pub_limpar_cache( array( tcd_pub_cfg( $d )['slug'] ) );
	}
	wp_safe_redirect( add_query_arg( 'cronica' === $anc ? 'cron_msg' : 'pub_msg', $msg, home_url( '/oficina/' ) ) . '#' . $anc ); if ( ! defined( 'TCD_TESTE' ) ) { exit; }
} );
// Caches e ficheiros públicos caem quando entram camadas (tcd_cam_carregada) ou mudam (tcd_cam_alterada: lixo, repor, grupo, sensível, quem, nome).
function tcd_pub_camada_mudou( $id, $c ) { $d = is_array( $c ) && ! empty( $c['org'] ) ? tcd_org_dados( (int) $c['org'] ) : null; if ( ! $d ) { return; } tcd_pub_limpar_cache( array( tcd_pub_cfg( $d )['slug'] ) ); tcd_pub_sincronizar( $d ); }
add_action( 'tcd_cam_carregada', 'tcd_pub_camada_mudou', 10, 2 ); add_action( 'tcd_cam_alterada', 'tcd_pub_camada_mudou', 10, 2 );
// Cron diário: lixo das crónicas apagado de vez aos 30 dias.
add_action( 'tcd_org_diario', function () { foreach ( get_posts( array( 'post_type' => 'tcd_cronica', 'post_status' => 'any', 'numberposts' => 1000, 'fields' => 'ids' ) ) as $id ) { $m = get_post_meta( $id, '_tcd_cron', true ); if ( is_array( $m ) && ! empty( $m['lixo'] ) && (int) $m['lixo'] <= time() - 30 * DAY_IN_SECONDS ) { wp_delete_post( $id, true ); } } }, 25 );
