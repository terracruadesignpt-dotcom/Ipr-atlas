<?php
// Módulo 90250: Oficina como estúdio de blocos, parte 1 (dados, blocos e rotas). Pedido do Nuno, 20/10/2026, 18h40:
// «a zona de cada profissional tem de ser muito fixe», com ambiente de trabalho configurável (M13, fases 1 e 2).
// Cada bloco é uma função que devolve HTML já escapado; a lista é o filtro tcd_of_blocos (o m90252 junta tempo e fogo).
// O arranjo de cada pessoa (ordem, escondidos, tom) fica no user meta tcd_of_arranjo, no servidor, não no navegador.
// Arranjo de fábrica segundo o assistente m90208 (nível médio e temas). Decisões do Nuno, 20/10: sem bloco «Pedidos na
// minha zona»; a montra pública só depois da verificação pelo Nuno.
// Rotas (só Rede IPR, ou administrador em pré-visualização): GET /tcd/v1/oficina/bloco/<id>, GET e POST /tcd/v1/oficina/arranjo.
// Depende do m90069 (tcd_rede_*), e usa quando existem m90080, m90060, m90085, m90031, m90208, m90070 e m90059.
// Interruptor: opção tcd_oficina2_off = 1 (a Oficina volta à página antiga do m90069). Prefixo tcd_of_.
if ( ! defined( 'ABSPATH' ) ) { exit; }

function tcd_of_on() { return '1' !== (string) get_option( 'tcd_oficina2_off', '' ) && function_exists( 'tcd_rede_e' ); }
// Quem pode usar: Rede IPR; o administrador vê a sua própria pré-visualização (?previa=1) para testar.
function tcd_of_pode( $u = null ) {
	$u = $u ? $u : wp_get_current_user();
	if ( ! $u || ! $u->ID ) { return false; }
	return tcd_rede_e( $u ) || user_can( $u, 'manage_options' );
}
function tcd_of_n( $x, $d = 1 ) { return number_format( (float) $x, $x < 10 ? $d : 0, ',', '.' ); }
function tcd_of_vazio( $t ) { return '<p class="tof-vz">' . esc_html( $t ) . '</p>'; }
function tcd_of_btn( $t, $url, $s = false ) { return '<a class="tof-btn' . ( $s ? ' s' : '' ) . '" href="' . esc_url( $url ) . '">' . esc_html( $t ) . '</a>'; }

// Terrenos da pessoa com os dados do Caderno (limite, centro, código). Máximo 40.
function tcd_of_terrenos( $u ) {
	static $c = array();
	if ( isset( $c[ $u->ID ] ) ) { return $c[ $u->ID ]; }
	$out = array();
	if ( function_exists( 'tcd_cdt_dados' ) ) {
		$ids = get_posts( array( 'post_type' => 'tcd_terreno', 'post_status' => 'any', 'numberposts' => 40, 'fields' => 'ids', 'orderby' => 'modified', 'order' => 'DESC', 'meta_key' => '_tcd_cdt_email', 'meta_value' => strtolower( $u->user_email ) ) );
		foreach ( $ids as $tid ) {
			$d = tcd_cdt_dados( $tid );
			$out[] = array( 'id' => (int) $tid, 'cod' => tcd_cdt_codigo( $tid ), 'nome' => $d['nome'] ? $d['nome'] : tcd_cdt_codigo( $tid ), 'local' => (string) $d['local'], 'ha' => (float) $d['area_ha'], 'geo' => $d['geo'], 'centro' => is_array( $d['centro'] ) ? $d['centro'] : null );
		}
	}
	return $c[ $u->ID ] = $out;
}

// ---------- os blocos ----------
function tcd_of_blocos() {
	$b = array(
		'perfil'   => array( 't' => 'Perfil profissional', 'k' => 'Rede IPR', 'f' => 'tcd_of_b_perfil', 'w' => 1, 'cache' => 0 ),
		'hoje'     => array( 't' => 'Hoje', 'k' => 'O que pede atenção', 'f' => 'tcd_of_b_hoje', 'w' => 1, 'cache' => 300 ),
		'mapa'     => array( 't' => 'Mapa dos meus projectos', 'k' => 'Projectos', 'f' => 'tcd_of_b_mapa', 'w' => 2, 'cache' => 600 ),
		'terrenos' => array( 't' => 'Os meus terrenos', 'k' => 'Projectos', 'f' => 'tcd_of_b_terrenos', 'w' => 1, 'cache' => 300 ),
		'bases'    => array( 't' => 'Bases e vales', 'k' => 'Base Cartográfica', 'f' => 'tcd_of_b_bases', 'w' => 1, 'cache' => 120 ),
		'clientes' => array( 't' => 'Os meus clientes', 'k' => 'Partilhas', 'f' => 'tcd_of_b_clientes', 'w' => 1, 'cache' => 300 ),
		'plano'    => array( 't' => 'O meu plano', 'k' => 'IPR Cloud', 'f' => 'tcd_of_b_plano', 'w' => 1, 'cache' => 300 ),
		'vigia'    => array( 't' => 'Vigia do satélite', 'k' => 'Vegetação', 'f' => 'tcd_of_b_vigia', 'w' => 1, 'cache' => 1800 ),
		'fotos'    => array( 't' => 'Fotopontos', 'k' => 'Antes e depois', 'f' => 'tcd_of_b_fotos', 'w' => 2, 'cache' => 600 ),
		'montra'   => array( 't' => 'A minha montra', 'k' => 'Perfil público', 'f' => 'tcd_of_b_montra', 'w' => 1, 'cache' => 0 ),
		'atalhos'  => array( 't' => 'Atalhos', 'k' => 'Ferramentas', 'f' => 'tcd_of_b_atalhos', 'w' => 1, 'cache' => 0 ),
		'equipa'   => array( 't' => 'A equipa', 'k' => 'Terracrua Design', 'f' => 'tcd_of_b_equipa', 'w' => 1, 'cache' => 600 ),
		'membros'  => array( 't' => 'Quem está na plataforma', 'k' => 'Comunidade', 'f' => 'tcd_of_b_membros', 'w' => 2, 'cache' => 600 ),
	);
	return apply_filters( 'tcd_of_blocos', $b );
}

// Arranjo de fábrica: depende do nível (m90208) e dos temas. A maioria nunca mexe, por isso tem de estar bem de origem.
function tcd_of_fabrica( $u ) {
	$p = function_exists( 'tcd_pf8_perfil' ) ? tcd_pf8_perfil( $u->ID ) : array();
	$s = array(); foreach ( array( 's1', 's2', 's3', 's4', 's5', 's6' ) as $k ) { if ( ! empty( $p[ $k ] ) ) { $s[] = (int) $p[ $k ]; } }
	$media = $s ? array_sum( $s ) / count( $s ) : 3.5;
	$temas = array_map( 'intval', (array) ( $p['temas'] ?? array() ) );
	$ordem = array( 'hoje', 'mapa', 'bases', 'clientes', 'plano', 'perfil' );
	if ( in_array( 1, $temas, true ) ) { $ordem[] = 'tempo'; } // água: chuva logo à frente
	if ( in_array( 3, $temas, true ) ) { $ordem[] = 'fogo'; }
	$ordem = array_merge( $ordem, array( 'terrenos', 'fotos', 'vigia' ) );
	if ( ! in_array( 'tempo', $ordem, true ) ) { $ordem[] = 'tempo'; }
	if ( ! in_array( 'fogo', $ordem, true ) ) { $ordem[] = 'fogo'; }
	$ordem = array_merge( $ordem, array( 'atalhos', 'montra', 'equipa', 'membros' ) );
	$ocultos = $media <= 2.5 ? array( 'vigia', 'fotos', 'membros' ) : array( 'membros' ); // modo simples: menos blocos
	return array( 'ordem' => $ordem, 'ocultos' => $ocultos, 'tom' => 'linho', 'fabrica' => 1 );
}
function tcd_of_arranjo( $u ) {
	$a = get_user_meta( $u->ID, 'tcd_of_arranjo', true );
	$todos = array_keys( tcd_of_blocos() );
	$f = tcd_of_fabrica( $u );
	$f['ordem'] = array_values( array_intersect( $f['ordem'], $todos ) ); $f['ocultos'] = array_values( array_intersect( $f['ocultos'], $todos ) );
	foreach ( $todos as $k ) { if ( ! in_array( $k, $f['ordem'], true ) ) { $f['ordem'][] = $k; } }
	if ( ! is_array( $a ) || empty( $a['ordem'] ) ) { return $f; }
	$ordem = array_values( array_intersect( (array) $a['ordem'], $todos ) );
	foreach ( $todos as $k ) { if ( ! in_array( $k, $ordem, true ) ) { $ordem[] = $k; $a['ocultos'][] = $k; } } // blocos novos chegam escondidos
	return array( 'ordem' => $ordem, 'ocultos' => array_values( array_intersect( (array) ( $a['ocultos'] ?? array() ), $todos ) ), 'tom' => in_array( $a['tom'] ?? '', array( 'linho', 'oliva', 'terra', 'noite' ), true ) ? $a['tom'] : 'linho', 'fabrica' => 0 );
}

function tcd_of_render( $id, $u ) {
	$b = tcd_of_blocos();
	if ( ! isset( $b[ $id ] ) || ! is_callable( $b[ $id ]['f'] ) ) { return ''; }
	$ck = 'tcd_of_' . $id . '_' . $u->ID;
	if ( ! empty( $b[ $id ]['cache'] ) ) { $h = get_transient( $ck ); if ( is_string( $h ) ) { return $h; } }
	try { $h = (string) call_user_func( $b[ $id ]['f'], $u ); } catch ( Throwable $e ) { $h = tcd_of_vazio( 'Este bloco não carregou. Os outros continuam a funcionar.' ); }
	if ( ! empty( $b[ $id ]['cache'] ) ) { set_transient( $ck, $h, (int) $b[ $id ]['cache'] ); }
	return $h;
}

function tcd_of_b_perfil( $u ) {
	if ( ! function_exists( 'tcd_rede_perfil_pct' ) ) { return ''; }
	$pct = tcd_rede_perfil_pct( $u->ID ); $verif = function_exists( 'tcd_pro_verificado' ) && tcd_pro_verificado( $u->ID );
	$h = '<div class="tof-bar"><i style="width:' . (int) $pct . '%"></i></div><p class="tof-num">' . (int) $pct . ' %</p><ul class="tof-passos">';
	foreach ( tcd_rede_perfil_passos( $u->ID ) as $x ) { $h .= '<li class="' . ( $x[1] ? 'ok' : '' ) . '">' . esc_html( $x[0] ) . '</li>'; }
	$h .= '</ul>';
	$h .= $verif ? tcd_of_vazio( 'Perfil verificado pela Terracrua.' ) : ( $pct >= 100 ? tcd_of_vazio( 'Completo. A Terracrua vai vê-lo e dar a verificação.' ) : '' );
	return $h . tcd_of_btn( $pct ? 'Continuar o perfil' : 'Começar o perfil', home_url( '/atlas/' ), true ) . ' <small>No Atlas: Comunidade › O meu perfil.</small>';
}

function tcd_of_b_hoje( $u ) {
	$it = array();
	$bases = function_exists( 'tcd_rede_bases' ) ? tcd_rede_bases( $u ) : array();
	foreach ( $bases as $b ) {
		if ( $b['pagar'] ) { $it[] = array( 2, 'Base #' . $b['num'] . ' por confirmar', $b['local'], $b['pagar'] ); }
		elseif ( false !== stripos( $b['estado'], 'produ' ) || false !== stripos( $b['estado'], 'process' ) ) { $it[] = array( 1, 'Base #' . $b['num'] . ' em produção', $b['local'], '' ); }
	}
	foreach ( tcd_of_terrenos( $u ) as $t ) {
		if ( function_exists( 'tcd_vgt_dados' ) ) { $v = tcd_vgt_dados( $t['id'] ); if ( ! empty( $v['alerta'] ) ) { $it[] = array( 3, 'Queda de vegetação em ' . $t['nome'], 'Visto pelo satélite. Vale a pena confirmar no terreno.', home_url( '/caderno/?t=' . rawurlencode( $t['cod'] ) ) ); } }
		if ( function_exists( 'tcd_ftp_dados' ) ) {
			$f = tcd_ftp_dados( $t['id'] ); $mes = (int) current_time( 'n' );
			foreach ( $f['pontos'] as $pid => $p ) {
				if ( ! empty( $p['retirado'] ) ) { continue; }
				$prim = null; foreach ( $f['fotos'] as $x ) { if ( ( $x['p'] ?? '' ) === $pid && ( null === $prim || $x['data'] < $prim ) ) { $prim = $x['data']; } }
				if ( $prim && (int) substr( $prim, 5, 2 ) === $mes && substr( $prim, 0, 4 ) !== current_time( 'Y' ) ) { $it[] = array( 1, 'Fotoponto a repetir este mês', $t['nome'] . ' · ' . $p['nome'], home_url( '/caderno/?t=' . rawurlencode( $t['cod'] ) ) ); }
			}
		}
	}
	if ( function_exists( 'tcd_cl_estado' ) ) {
		$e = tcd_cl_estado( $u->user_email );
		if ( $e['ate'] && 'base' !== $e['plano'] && $e['ate'] - time() < 15 * DAY_IN_SECONDS ) { $it[] = array( 3, 'O plano ' . ucfirst( $e['plano'] ) . ' acaba a ' . date_i18n( 'j/n', $e['ate'] ), 'Depois disso os projectos ficam só para leitura.', home_url( '/ipr-cloud/' ) ); }
	}
	if ( ! $it ) { return tcd_of_vazio( 'Nada à espera de si. Bom dia de trabalho.' ); }
	usort( $it, function ( $a, $b ) { return $b[0] - $a[0]; } );
	$h = '<ul class="tof-l">';
	foreach ( array_slice( $it, 0, 8 ) as $x ) { $h .= '<li class="p' . (int) $x[0] . '"><div><b>' . esc_html( $x[1] ) . '</b>' . ( $x[2] ? '<br><small>' . esc_html( $x[2] ) . '</small>' : '' ) . '</div>' . ( $x[3] ? '<a class="e" href="' . esc_url( $x[3] ) . '">Abrir</a>' : '' ) . '</li>'; }
	return $h . '</ul>';
}

// Mapa em SVG, sem fundo de terceiros: os limites dos terrenos à escala, com o código. Um clique abre o Caderno.
function tcd_of_b_mapa( $u ) {
	$ts = array_filter( tcd_of_terrenos( $u ), function ( $t ) { return ! empty( $t['geo'] ); } );
	if ( ! $ts || ! function_exists( 'tcd_cdt_poligonos' ) ) { return tcd_of_vazio( 'Ainda não há terrenos com limite. Desenhe o primeiro no mapa e peça a Base.' ) . tcd_of_btn( 'Desenhar um terreno', home_url( '/cartografia/' ) ); }
	$todos = array(); $b = array( 180, 90, -180, -90 );
	foreach ( $ts as $t ) { $pl = tcd_cdt_poligonos( $t['geo'] ); if ( ! $pl ) { continue; } $todos[] = array( $t, $pl ); $bb = tcd_cdt_bbox( $pl ); $b = array( min( $b[0], $bb[0] ), min( $b[1], $bb[1] ), max( $b[2], $bb[2] ), max( $b[3], $bb[3] ) ); }
	if ( ! $todos ) { return tcd_of_vazio( 'Sem limites para desenhar.' ); }
	$k = cos( deg2rad( ( $b[1] + $b[3] ) / 2 ) ); $W = 640; $H = 300; $pad = 0.08;
	$dx = max( 1e-4, ( $b[2] - $b[0] ) * $k ); $dy = max( 1e-4, $b[3] - $b[1] );
	$s = min( $W / ( $dx * ( 1 + 2 * $pad ) ), $H / ( $dy * ( 1 + 2 * $pad ) ) );
	$ox = ( $W - $dx * $s ) / 2; $oy = ( $H - $dy * $s ) / 2;
	$xy = function ( $p ) use ( $b, $k, $s, $ox, $oy, $H ) { return round( $ox + ( $p[0] - $b[0] ) * $k * $s, 1 ) . ',' . round( $H - ( $oy + ( $p[1] - $b[1] ) * $s ), 1 ); };
	$svg = '<svg class="tof-map" viewBox="0 0 ' . $W . ' ' . $H . '" role="img" aria-label="Mapa dos meus terrenos">';
	foreach ( $todos as $x ) {
		list( $t, $pl ) = $x; $d = '';
		foreach ( $pl as $poly ) { foreach ( $poly as $anel ) { $d .= 'M' . implode( 'L', array_map( $xy, $anel ) ) . 'Z'; } }
		$bb = tcd_cdt_bbox( $pl ); list( $cx, $cy ) = explode( ',', $xy( array( ( $bb[0] + $bb[2] ) / 2, $bb[3] ) ) ); list( $mx, $my ) = explode( ',', $xy( array( ( $bb[0] + $bb[2] ) / 2, ( $bb[1] + $bb[3] ) / 2 ) ) );
		$svg .= '<a href="' . esc_url( home_url( '/caderno/?t=' . rawurlencode( $t['cod'] ) ) ) . '"><title>' . esc_html( $t['nome'] . ' · ' . tcd_of_n( $t['ha'] ) . ' ha' ) . '</title><path d="' . esc_attr( $d ) . '"/><circle cx="' . esc_attr( $mx ) . '" cy="' . esc_attr( $my ) . '" r="5"/><text x="' . esc_attr( $cx ) . '" y="' . esc_attr( max( 12, (float) $cy - 6 ) ) . '">' . esc_html( $t['cod'] ) . '</text></a>';
	}
	$svg .= '</svg>';
	$km = round( $dx * 111.32 ); $tot = 0; foreach ( $todos as $x ) { $tot += $x[0]['ha']; }
	return $svg . '<p class="tof-vz">' . count( $todos ) . ' terreno' . ( count( $todos ) > 1 ? 's' : '' ) . ' · ' . tcd_of_n( $tot ) . ' ha' . ( $km > 1 ? ' · ' . $km . ' km de ponta a ponta' : '' ) . '</p>' . tcd_of_btn( 'Abrir no IPR Atlas', home_url( '/atlas/' ), true );
}

function tcd_of_b_terrenos( $u ) {
	$ts = tcd_of_terrenos( $u );
	if ( ! $ts ) { return tcd_of_vazio( 'Ainda não há terrenos. O primeiro aparece aqui quando pedir a Base.' ) . tcd_of_btn( 'Nova Base Cartográfica', home_url( '/cartografia/' ) ); }
	$h = '<ul class="tof-l">';
	foreach ( array_slice( $ts, 0, 12 ) as $t ) { $h .= '<li><div><b>' . esc_html( $t['nome'] ) . '</b><br><small>' . esc_html( $t['cod'] . ( $t['local'] ? ' · ' . $t['local'] : '' ) . ( $t['ha'] ? ' · ' . tcd_of_n( $t['ha'] ) . ' ha' : '' ) ) . '</small></div><a class="e" href="' . esc_url( home_url( '/caderno/?t=' . rawurlencode( $t['cod'] ) ) ) . '">Caderno</a></li>'; }
	return $h . '</ul>' . tcd_of_btn( 'Nova Base Cartográfica', home_url( '/cartografia/' ) );
}

function tcd_of_b_bases( $u ) {
	$bases = function_exists( 'tcd_rede_bases' ) ? tcd_rede_bases( $u ) : array();
	$nv = function_exists( 'tcd_rede_encomendas_vale' ) ? count( tcd_rede_encomendas_vale( $u ) ) : 0;
	$h = '';
	if ( $nv || get_user_meta( $u->ID, 'tcd_rede', true ) ) {
		$h .= '<div class="tof-vales">'; for ( $i = 0; $i < 3; $i++ ) { $h .= '<i class="' . ( $i < $nv ? 'u' : '' ) . '"></i>'; } $h .= '</div><small>' . ( $nv >= 3 ? 'As 3 propriedades do vale estão usadas.' : ( 3 - $nv ) . ' de 3 propriedades do vale por usar.' ) . '</small>';
	}
	if ( ! $bases ) { return $h . tcd_of_vazio( 'Ainda não há Bases. Cada uma traz o relevo LiDAR, declives, água e curvas de nível.' ); }
	$h .= '<ul class="tof-l">';
	foreach ( array_slice( $bases, 0, 8 ) as $b ) { $h .= '<li><div><b>#' . esc_html( $b['num'] ) . '</b> <small>' . esc_html( $b['data'] ) . '</small><br><small>' . esc_html( ( $b['local'] ? $b['local'] : 'Base' ) . ( $b['ha'] ? ' · ' . tcd_of_n( $b['ha'] ) . ' ha' : '' ) ) . '</small></div>' . ( $b['pagar'] ? '<a class="e" href="' . esc_url( $b['pagar'] ) . '">Confirmar</a>' : '<span class="e">' . esc_html( $b['estado'] ) . '</span>' ) . '</li>'; }
	return $h . '</ul>' . tcd_of_btn( 'Os meus mapas', home_url( '/os-meus-mapas/' ), true );
}

// Quem foi convidado por esta pessoa para os seus mapas, e quando entrou pela última vez.
function tcd_of_b_clientes( $u ) {
	global $wpdb;
	$t = $wpdb->prefix . 'tcd_mapa_acessos';
	if ( $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $t ) ) !== $t ) { return tcd_of_vazio( 'A partilha de mapas ainda não está ligada.' ); }
	$rows = $wpdb->get_results( $wpdb->prepare( "SELECT email, papel, order_id, criado FROM {$t} WHERE convidado_por = %s ORDER BY criado DESC LIMIT 30", strtolower( $u->user_email ) ), ARRAY_A ); // phpcs:ignore
	$h = '';
	if ( ! $rows ) { $h .= tcd_of_vazio( 'Ainda não convidou ninguém. Partilhe um mapa com o cliente e ele acompanha o projecto daqui.' ); }
	else {
		$h .= '<ul class="tof-l">';
		foreach ( $rows as $r ) {
			$cu = get_user_by( 'email', $r['email'] ); $ult = $cu ? (int) get_user_meta( $cu->ID, 'wc_last_active', true ) : 0;
			$nome = $cu ? ( $cu->first_name ? trim( $cu->first_name . ' ' . $cu->last_name ) : $cu->display_name ) : $r['email'];
			$o = function_exists( 'wc_get_order' ) ? wc_get_order( (int) $r['order_id'] ) : null; $loc = $o ? (string) $o->get_meta( '_tcd_local' ) : '';
			$quando = $ult ? ( ( time() - $ult ) < DAY_IN_SECONDS ? 'entrou hoje' : 'entrou há ' . human_time_diff( $ult ) ) : ( $cu ? 'ainda não entrou' : 'sem conta ainda' );
			$h .= '<li><div><b>' . esc_html( $nome ) . '</b><br><small>' . esc_html( ( $loc ? $loc . ' · ' : '' ) . ( 'editor' === $r['papel'] ? 'pode editar' : 'pode ver' ) ) . '</small></div><span class="e' . ( $ult ? '' : ' fr' ) . '">' . esc_html( $quando ) . '</span></li>';
		}
		$h .= '</ul>';
	}
	return $h . tcd_of_btn( 'Convidar um cliente', home_url( '/os-meus-mapas/' ) );
}

function tcd_of_b_plano( $u ) {
	if ( ! function_exists( 'tcd_cl_estado' ) ) { return ''; }
	$e = tcd_cl_estado( $u->user_email ); $pl = tcd_cl_planos();
	if ( 'nenhum' === $e['plano'] ) { return tcd_of_vazio( 'Sem plano da IPR Cloud. Cada Base traz um projecto de campo durante 12 meses.' ) . tcd_of_btn( 'Ver os planos', home_url( '/ipr-cloud/' ) ); }
	$p = $pl[ $e['plano'] ]; $n = count( tcd_of_terrenos( $u ) ); $lim = (int) $p['projectos'] + (int) $e['proj_extra'];
	$h = '<p class="tof-big">' . esc_html( 'base' === $e['plano'] ? 'Incluído na Base' : $p['nome'] ) . '</p><small>até ' . esc_html( date_i18n( 'j \d\e F \d\e Y', $e['ate'] ) ) . '</small>';
	$h .= '<div class="tof-med"><span>Projectos</span><div class="tof-bar"><i style="width:' . (int) min( 100, $lim ? 100 * $n / $lim : 0 ) . '%"></i></div><b>' . (int) $n . ' / ' . (int) $lim . '</b></div>';
	$h .= '<div class="tof-med"><span>Pessoas por projecto</span><b>' . (int) $p['pessoas'] . '</b></div><div class="tof-med"><span>Espaço</span><b>' . (int) $e['gb'] . ' GB</b></div>';
	if ( 'base' === $e['plano'] || 'designer' === $e['plano'] ) { $h .= tcd_of_btn( 'designer' === $e['plano'] ? 'Passar ao Estúdio' : 'Ver os planos', home_url( '/ipr-cloud/' ), true ); }
	return $h;
}

function tcd_of_b_vigia( $u ) {
	if ( ! function_exists( 'tcd_vgt_dados' ) ) { return ''; }
	$h = ''; $n = 0;
	foreach ( tcd_of_terrenos( $u ) as $t ) {
		$v = tcd_vgt_dados( $t['id'] ); if ( ! $v['serie'] ) { continue; } $n++;
		$s = array_slice( $v['serie'], -12, 12, true ); $max = 0.9; $pts = array(); $i = 0; $c = count( $s );
		foreach ( $s as $m => $x ) { $pts[] = round( $c > 1 ? 4 + 152 * $i / ( $c - 1 ) : 80, 1 ) . ',' . round( 36 - 32 * max( 0, min( $max, (float) $x['p'] ) ) / $max, 1 ); $i++; }
		$ult = end( $s );
		$h .= '<div class="tof-vg"><div><b>' . esc_html( $t['nome'] ) . '</b><br><small>NDVI ' . esc_html( number_format( (float) $ult['p'], 2, ',', '' ) ) . ( ! empty( $v['alerta'] ) ? ' · <span class="al">queda</span>' : '' ) . '</small></div><svg viewBox="0 0 160 40" class="tof-sp"><polyline points="' . esc_attr( implode( ' ', $pts ) ) . '"/></svg></div>';
		if ( $n >= 6 ) { break; }
	}
	return $h ? $h . '<p class="tof-vz">Vigor da vegetação nos últimos 12 meses (Sentinel-2).</p>' : tcd_of_vazio( 'O satélite ainda não tem série para os seus terrenos. Começa a aparecer no primeiro mês com limite desenhado.' );
}

function tcd_of_b_fotos( $u ) {
	if ( ! function_exists( 'tcd_ftp_dados' ) ) { return ''; }
	$h = '';
	foreach ( tcd_of_terrenos( $u ) as $t ) {
		$f = tcd_ftp_dados( $t['id'] ); if ( ! $f['fotos'] ) { continue; }
		$por = array(); foreach ( $f['fotos'] as $x ) { $por[ $x['p'] ][] = $x; }
		foreach ( $por as $pid => $l ) {
			usort( $l, function ( $a, $b ) { return strcmp( $a['data'], $b['data'] ); } );
			$a = $l[0]; $z = end( $l ); $ua = wp_get_attachment_image_url( (int) $a['att'], 'medium' ); $uz = wp_get_attachment_image_url( (int) $z['att'], 'medium' );
			if ( ! $ua ) { continue; }
			$nome = $f['pontos'][ $pid ]['nome'] ?? '';
			$h .= '<figure class="tof-ad"><div><img src="' . esc_url( $ua ) . '" alt="" loading="lazy"><span>' . esc_html( substr( $a['data'], 0, 7 ) ) . '</span></div>' . ( count( $l ) > 1 && $uz ? '<div><img src="' . esc_url( $uz ) . '" alt="" loading="lazy"><span>' . esc_html( substr( $z['data'], 0, 7 ) ) . '</span></div>' : '' ) . '<figcaption>' . esc_html( $t['nome'] . ( $nome ? ' · ' . $nome : '' ) ) . '</figcaption></figure>';
			if ( substr_count( $h, '<figure' ) >= 4 ) { break 2; }
		}
	}
	return $h ? '<div class="tof-ads">' . $h . '</div>' : tcd_of_vazio( 'Ainda sem fotopontos. Marque três a cinco pontos fixos no Caderno e volte lá uma vez por ano: o antes e depois aparece aqui.' ) . tcd_of_btn( 'Abrir o Caderno', home_url( '/caderno/' ), true );
}

// Montra: o perfil público só aparece aos proprietários depois da verificação pelo Nuno (decisão de 20/10).
function tcd_of_b_montra( $u ) {
	$p = function_exists( 'tcd_soc_perfil_row' ) ? tcd_soc_perfil_row( $u->ID ) : null;
	$verif = function_exists( 'tcd_pro_verificado' ) && tcd_pro_verificado( $u->ID );
	$pct = function_exists( 'tcd_rede_perfil_pct' ) ? tcd_rede_perfil_pct( $u->ID ) : 0;
	if ( $verif && $p && ! empty( $p['alcunha'] ) ) {
		$url = home_url( '/atlas/?perfil=' . rawurlencode( $p['alcunha'] ) );
		return '<p class="tof-big">Visível</p><small>Perfil verificado: aparece aos proprietários na Rede IPR.</small><p><input class="tof-url" readonly value="' . esc_attr( $url ) . '" onclick="this.select()"></p>' . tcd_of_btn( 'Ver como os outros vêem', $url, true );
	}
	return '<p class="tof-big">Ainda não visível</p><small>' . esc_html( $pct >= 100 ? 'O perfil está completo e à espera da verificação da Terracrua. Depois disso fica visível aos proprietários.' : 'Complete o perfil (' . $pct . ' %). Com ele completo, a Terracrua verifica-o e a montra abre.' ) . '</small>';
}

function tcd_of_b_atalhos( $u ) {
	$l = array(
		array( 'Nova Base Cartográfica', '/cartografia/', 'Desenhar o terreno e ver o preço' ),
		array( 'IPR Atlas', '/atlas/', 'Camadas, relevo, água, condicionantes' ),
		array( 'Caderno do terreno', '/caderno/', 'Cronologia, notas e fotopontos' ),
		array( 'Os meus mapas', '/os-meus-mapas/', 'Entregas, descargas e partilhas' ),
		array( 'IPR Cloud', '/ipr-cloud/', 'QGIS e QField no campo' ),
		array( 'Pedir apoio à equipa', '/contacto/?tipo=' . rawurlencode( 'Rede IPR' ), 'Uma dúvida técnica ou comercial' ),
	);
	$h = '<ul class="tof-at">';
	foreach ( $l as $x ) { $h .= '<li><a href="' . esc_url( home_url( $x[1] ) ) . '"><b>' . esc_html( $x[0] ) . '</b><small>' . esc_html( $x[2] ) . '</small></a></li>'; }
	return $h . '</ul>';
}

function tcd_of_av( $foto, $nome ) { return function_exists( 'tcd_rede_av' ) ? tcd_rede_av( $foto, $nome ) : ''; }
function tcd_of_b_equipa( $u ) {
	$eq = function_exists( 'tcd_rede_equipa' ) ? tcd_rede_equipa() : array();
	if ( ! $eq ) { return tcd_of_vazio( 'Em breve.' ); }
	$h = '<ul class="tof-l">';
	foreach ( $eq as $p ) { $h .= '<li>' . tcd_of_av( $p['foto'], $p['nome'] ) . '<div>' . ( $p['url'] ? '<a href="' . esc_url( $p['url'] ) . '"><b>' . esc_html( $p['nome'] ) . '</b></a>' : '<b>' . esc_html( $p['nome'] ) . '</b>' ) . ( $p['papel'] ? '<br><small>' . esc_html( $p['papel'] ) . '</small>' : '' ) . '</div></li>'; }
	return $h . '</ul>';
}
function tcd_of_b_membros( $u ) {
	$m = function_exists( 'tcd_rede_membros' ) ? tcd_rede_membros() : array( 'lista' => array(), 'total' => 0 );
	if ( ! $m['lista'] ) { return tcd_of_vazio( 'Ainda não há membros.' ); }
	$h = '<p class="tof-vz">' . (int) $m['total'] . ' membros</p><div class="tof-mem">';
	foreach ( array_slice( $m['lista'], 0, 60 ) as $x ) { $h .= '<div>' . tcd_of_av( $x['foto'], $x['nome'] ) . '<span>' . ( $x['url'] ? '<a href="' . esc_url( $x['url'] ) . '"><b>' . esc_html( $x['nome'] ) . '</b></a>' : '<b>' . esc_html( $x['nome'] ) . '</b>' ) . ( $x['verificado'] ? ' <em class="v">verificado</em>' : '' ) . '<br><small>' . esc_html( $x['concelho'] ) . '</small></span></div>'; }
	return $h . '</div>';
}

// ---------- rotas ----------
add_action( 'rest_api_init', function () {
	if ( ! tcd_of_on() ) { return; }
	register_rest_route( 'tcd/v1', '/oficina/bloco/(?P<id>[a-z0-9_-]{2,20})', array( 'methods' => 'GET', 'permission_callback' => function () { return tcd_of_pode(); }, 'callback' => function ( WP_REST_Request $r ) {
		$u = wp_get_current_user(); $id = sanitize_key( $r['id'] );
		$b = tcd_of_blocos(); if ( ! isset( $b[ $id ] ) ) { return new WP_Error( 'bloco', 'Bloco desconhecido.', array( 'status' => 404 ) ); }
		$k = 'tcd_of_l_' . $u->ID; $n = (int) get_transient( $k ); if ( $n > 240 ) { return new WP_Error( 'limite', 'Demasiados pedidos. Tente daqui a pouco.', array( 'status' => 429 ) ); } set_transient( $k, $n + 1, 10 * MINUTE_IN_SECONDS );
		$res = rest_ensure_response( array( 'id' => $id, 'html' => tcd_of_render( $id, $u ) ) ); $res->header( 'Cache-Control', 'private, no-store' ); return $res;
	} ) );
	register_rest_route( 'tcd/v1', '/oficina/arranjo', array(
		array( 'methods' => 'GET', 'permission_callback' => function () { return tcd_of_pode(); }, 'callback' => function () { return rest_ensure_response( tcd_of_arranjo( wp_get_current_user() ) ); } ),
		array( 'methods' => 'POST', 'permission_callback' => function () { return tcd_of_pode(); }, 'callback' => function ( WP_REST_Request $r ) {
			$u = wp_get_current_user();
			if ( $r->get_param( 'repor' ) ) { delete_user_meta( $u->ID, 'tcd_of_arranjo' ); return rest_ensure_response( tcd_of_arranjo( $u ) ); }
			$todos = array_keys( tcd_of_blocos() );
			$ordem = array_values( array_unique( array_intersect( array_map( 'sanitize_key', (array) $r->get_param( 'ordem' ) ), $todos ) ) );
			$oc = array_values( array_unique( array_intersect( array_map( 'sanitize_key', (array) $r->get_param( 'ocultos' ) ), $todos ) ) );
			$tom = sanitize_key( (string) $r->get_param( 'tom' ) );
			if ( ! $ordem ) { return new WP_Error( 'ordem', 'Arranjo vazio.', array( 'status' => 400 ) ); }
			update_user_meta( $u->ID, 'tcd_of_arranjo', array( 'ordem' => $ordem, 'ocultos' => $oc, 'tom' => $tom, 't' => time() ) );
			return rest_ensure_response( tcd_of_arranjo( $u ) );
		} ),
	) );
} );
