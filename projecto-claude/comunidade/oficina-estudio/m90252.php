<?php
// Módulo 90252: Oficina, blocos «Tempo nos meus terrenos» e «Risco de incêndio» (pedido do Nuno, 20/10/2026, 18h40).
// Tempo: Open-Meteo (gratuito, sem chave): chuva das últimas 48 h, previsão de 3 dias, mínimas e aviso de geada,
// no centro de cada terreno (até 4). Fogo: IPMA, risco de incêndio rural por concelho para hoje e amanhã
// (api.ipma.pt, dados abertos), no concelho mais próximo do centro de cada terreno; fora de Portugal não mostra.
// Tudo pedido pelo servidor, com cache de 3 horas por ponto e por ficheiro, nunca mais de 5 pedidos externos por
// carregamento de bloco, e tempo de espera curto (6 s): se a fonte não responder, o bloco diz isso e o resto segue.
// Interruptor: tcd_oficina_ext_off = 1 tira os dois blocos. Prefixo tcd_ofx_. Depende do m90250.
if ( ! defined( 'ABSPATH' ) ) { exit; }

function tcd_ofx_on() { return '1' !== (string) get_option( 'tcd_oficina_ext_off', '' ) && function_exists( 'tcd_of_terrenos' ); }

add_filter( 'tcd_of_blocos', function ( $b ) {
	if ( ! tcd_ofx_on() ) { return $b; }
	$b['tempo'] = array( 't' => 'Tempo nos meus terrenos', 'k' => 'Chuva e geada', 'f' => 'tcd_ofx_b_tempo', 'w' => 2, 'cache' => 1800 );
	$b['fogo']  = array( 't' => 'Risco de incêndio', 'k' => 'IPMA', 'f' => 'tcd_ofx_b_fogo', 'w' => 1, 'cache' => 1800 );
	return $b;
} );

function tcd_ofx_get( $url, $ck ) {
	$c = get_transient( $ck ); if ( false !== $c ) { return $c; }
	$r = wp_remote_get( $url, array( 'timeout' => 6, 'redirection' => 2, 'user-agent' => 'TerracruaDesign/1.0 (+https://terracruadesign.pt)' ) );
	if ( is_wp_error( $r ) || 200 !== (int) wp_remote_retrieve_response_code( $r ) ) { set_transient( $ck, array(), 15 * MINUTE_IN_SECONDS ); return array(); }
	$j = json_decode( wp_remote_retrieve_body( $r ), true ); $j = is_array( $j ) ? $j : array();
	set_transient( $ck, $j, 3 * HOUR_IN_SECONDS );
	return $j;
}

// Até 4 terrenos com centro, sem repetir pontos a menos de ~5 km.
function tcd_ofx_pontos( $u ) {
	$out = array(); $vistos = array();
	foreach ( tcd_of_terrenos( $u ) as $t ) {
		if ( empty( $t['centro'] ) ) { continue; }
		$k = round( $t['centro'][0] / 0.05 ) . ':' . round( $t['centro'][1] / 0.05 );
		if ( isset( $vistos[ $k ] ) ) { continue; } $vistos[ $k ] = 1;
		$out[] = $t; if ( count( $out ) >= 4 ) { break; }
	}
	return $out;
}

function tcd_ofx_b_tempo( $u ) {
	$ps = tcd_ofx_pontos( $u );
	if ( ! $ps ) { return tcd_of_vazio( 'Aparece quando tiver um terreno com limite desenhado.' ); }
	$dias = array( 'dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb' );
	$h = '<div class="tof-tp">';
	foreach ( $ps as $t ) {
		$lo = round( $t['centro'][0], 2 ); $la = round( $t['centro'][1], 2 );
		$j = tcd_ofx_get( 'https://api.open-meteo.com/v1/forecast?latitude=' . $la . '&longitude=' . $lo . '&daily=precipitation_sum,temperature_2m_min,temperature_2m_max&past_days=2&forecast_days=3&timezone=Europe%2FLisbon', 'tcd_ofx_om_' . md5( $la . ',' . $lo ) );
		$d = $j['daily'] ?? null;
		$h .= '<div class="tof-tpc"><b>' . esc_html( $t['nome'] ) . '</b>';
		if ( ! $d || empty( $d['time'] ) ) { $h .= '<small>Sem resposta do serviço de meteorologia.</small></div>'; continue; }
		$ch48 = (float) ( $d['precipitation_sum'][0] ?? 0 ) + (float) ( $d['precipitation_sum'][1] ?? 0 );
		$geada = false; $h .= '<small>' . esc_html( tcd_of_n( $ch48 ) ) . ' mm nas últimas 48 h</small><div class="tof-dias">';
		for ( $i = 2; $i < count( $d['time'] ); $i++ ) {
			$mn = (float) $d['temperature_2m_min'][ $i ]; $mx = (float) $d['temperature_2m_max'][ $i ]; $pr = (float) $d['precipitation_sum'][ $i ];
			if ( $mn <= 1 ) { $geada = true; }
			$h .= '<span><em>' . esc_html( $dias[ (int) gmdate( 'w', strtotime( $d['time'][ $i ] ) ) ] ) . '</em><i class="ch" style="height:' . (int) min( 34, 3 + $pr * 2 ) . 'px"></i>' . esc_html( tcd_of_n( $pr ) ) . ' mm<br>' . (int) round( $mn ) . '° / ' . (int) round( $mx ) . '°</span>';
		}
		$h .= '</div>' . ( $geada ? '<small class="al">Risco de geada nos próximos dias.</small>' : '' ) . '</div>';
	}
	return $h . '</div><p class="tof-vz">Fonte: Open-Meteo. Actualiza de 3 em 3 horas.</p>';
}

// IPMA: rcm-d0.json (hoje) e rcm-d1.json (amanhã), por concelho (DICO), com latitude e longitude de cada um.
function tcd_ofx_rcm( $dia ) {
	$j = tcd_ofx_get( 'https://api.ipma.pt/open-data/forecast/meteorology/rcm/rcm-d' . (int) $dia . '.json', 'tcd_ofx_rcm' . (int) $dia );
	$out = array();
	foreach ( (array) ( $j['local'] ?? array() ) as $dico => $x ) {
		$la = $x['latitude'] ?? null; $lo = $x['longitude'] ?? null; $r = $x['data']['rcm'] ?? null;
		if ( is_numeric( $la ) && is_numeric( $lo ) && is_numeric( $r ) ) { $out[] = array( (float) $lo, (float) $la, (int) $r, (string) $dico ); }
	}
	return $out;
}
function tcd_ofx_perto( $l, $p ) {
	$m = null; $dm = 1e9; $k = cos( deg2rad( $p[1] ) );
	foreach ( $l as $x ) { $dd = pow( ( $x[0] - $p[0] ) * $k, 2 ) + pow( $x[1] - $p[1], 2 ); if ( $dd < $dm ) { $dm = $dd; $m = $x; } }
	return ( $m && sqrt( $dm ) * 111 < 35 ) ? $m : null; // mais de 35 km: fora da cobertura (Espanha, outro país)
}
function tcd_ofx_b_fogo( $u ) {
	$ps = tcd_ofx_pontos( $u );
	if ( ! $ps ) { return tcd_of_vazio( 'Aparece quando tiver um terreno com limite desenhado.' ); }
	$h0 = tcd_ofx_rcm( 0 ); $h1 = tcd_ofx_rcm( 1 );
	if ( ! $h0 ) { return tcd_of_vazio( 'O IPMA não respondeu agora. Volte a tentar mais tarde.' ); }
	$n = array( 1 => 'Reduzido', 2 => 'Moderado', 3 => 'Elevado', 4 => 'Muito elevado', 5 => 'Máximo' );
	$h = '<ul class="tof-l">'; $algum = false;
	foreach ( $ps as $t ) {
		$a = tcd_ofx_perto( $h0, $t['centro'] ); if ( ! $a ) { continue; } $algum = true;
		$b = $h1 ? tcd_ofx_perto( $h1, $t['centro'] ) : null;
		$h .= '<li><div><b>' . esc_html( $t['nome'] ) . '</b><br><small>amanhã: ' . esc_html( $b ? $n[ $b[2] ] ?? '?' : 'sem dados' ) . '</small></div><span class="tof-rcm r' . (int) $a[2] . '">' . esc_html( $n[ $a[2] ] ?? '?' ) . '</span></li>';
	}
	return $algum ? $h . '</ul><p class="tof-vz">Risco de incêndio rural de hoje, por concelho. Fonte: IPMA.</p>' : tcd_of_vazio( 'Os seus terrenos estão fora da cobertura do IPMA.' );
}
