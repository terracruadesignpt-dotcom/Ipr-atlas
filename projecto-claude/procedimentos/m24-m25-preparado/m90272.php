<?php
// Módulo 90272: Azenhas e Castelos, fase 1, avisos, partilhas e «Precisa de atenção» (M24 I-1; par do m90271).
// Avisos escritos à mão (texto, imóvel ou negócio, para quem, até quando, fechado por) aparecem no «Precisa de atenção»
// (filtro tcd_at_itens do m90188) de quem pode abrir Azenhas e Castelos; também as certidões permanentes a caducar.
// Partilhar o imóvel com o comprador de um negócio usa a partilha do m90018 e regista quem partilhou; a partilha só leva
// o imóvel, por isso os interessados no mesmo imóvel nunca se vêem uns aos outros.
// Depende do m90271 (tcd_acn_pode, tcd_acn_m, tcd_acn_guardar). Interruptor: tcd_ac_off = 1 (o mesmo). Prefixo tcd_acn_.
if ( ! defined( 'ABSPATH' ) ) { exit; }

// Lê em inglês? A mesma lista do m90181 (opção tcd_ass_en; por omissão a Lotte, #188).
function tcd_acn_en( $u = null ) { return in_array( (int) ( $u ? $u->ID : get_current_user_id() ), array_map( 'intval', (array) get_option( 'tcd_ass_en', array( 188 ) ) ), true ); }

// Caixa no catálogo do Estúdio (não entra nas caixas de ninguém sem a pessoa a escolher) e linha no Estúdio do Imobiliário.
add_filter( 'tcd_mesa_atalhos', function ( $a ) {
	if ( function_exists( 'tcd_acn_pode' ) && tcd_acn_pode() ) { $a['azenhas-e-castelos'] = array( 'Azenhas e Castelos', home_url( '/area-equipa/?v=azenhas' ), tcd_acn_en() ? 'Deals, people, documents, steps' : 'Negócios, pessoas, documentos, passos', 'imoveis', 'Imóveis' ); }
	return $a;
} );
add_filter( 'tcd_estudio_mensagens', function ( $h ) {
	if ( ! function_exists( 'tcd_acn_pode' ) || ! tcd_acn_pode() || ! function_exists( 'tcd_pg_papel' ) || 'imobiliario' !== tcd_pg_papel() ) { return $h; }
	return '<p class="tce-m"><a href="' . esc_url( home_url( '/area-equipa/?v=azenhas' ) ) . '"><b>Azenhas e Castelos</b></a></p>' . $h;
} );

add_action( 'rest_api_init', function () {
	if ( ! function_exists( 'tcd_acn_pode' ) ) { return; }
	$pode = function () { return tcd_acn_pode(); };
	$erro = function ( $m, $s = 400 ) { return new WP_Error( 'tcd_acn', $m, array( 'status' => $s ) ); };
	register_rest_route( 'tcd/v1', '/azenhas/aviso', array( 'methods' => 'POST', 'permission_callback' => $pode, 'callback' => function ( WP_REST_Request $r ) use ( $erro ) {
		$id = tcd_acn_alvo( $r->get_param( 'alvo' ) );
		if ( ! $id ) { return $erro( 'Imóvel ou negócio não encontrado.', 404 ); }
		$d = tcd_acn_m( $id ); $av = array_values( (array) ( $d['avisos'] ?? array() ) ); $f = $r->get_param( 'fechar' );
		if ( is_numeric( $f ) ) {
			if ( ! isset( $av[ (int) $f ] ) ) { return $erro( 'Aviso não encontrado.', 404 ); }
			$av[ (int) $f ]['fechado'] = get_current_user_id(); $av[ (int) $f ]['fechado_em'] = current_time( 'mysql' );
		} else {
			$t = tcd_acn_t( $r->get_param( 'texto' ), 500 );
			if ( '' === $t ) { return $erro( 'Escreve o aviso.' ); }
			$av = array_slice( $av, -49 );
			$av[] = array( 'texto' => $t, 'para' => absint( $r->get_param( 'para' ) ), 'ate' => tcd_acn_d( $r->get_param( 'ate' ) ), 'por' => get_current_user_id(), 'em' => current_time( 'mysql' ), 'fechado' => 0 );
		}
		$d['avisos'] = $av; tcd_acn_guardar( $id, $d );
		return rest_ensure_response( array( 'ok' => true, 'avisos' => $av ) );
	} ) );
	// Partilhar o imóvel com o comprador deste negócio, pela partilha do m90018; fica registado quem partilhou.
	register_rest_route( 'tcd/v1', '/azenhas/partilha', array( 'methods' => 'POST', 'permission_callback' => $pode, 'callback' => function ( WP_REST_Request $r ) use ( $erro ) {
		$id = absint( $r->get_param( 'negocio' ) );
		if ( 'tcd_negocio' !== get_post_type( $id ) ) { return $erro( 'Negócio não encontrado.', 404 ); }
		$d = tcd_acn_m( $id ); $u = wp_get_current_user();
		$q = new WP_REST_Request( 'POST', '/tcd/v1/equipa/partilha' );
		$q->set_body_params( array( 'origem' => 'im:' . (int) get_post_meta( $id, '_tcd_acn_im', true ), 'para' => $d['comprador'] ?? '', 'email' => is_scalar( $r->get_param( 'email' ) ) ? sanitize_email( (string) $r->get_param( 'email' ) ) : '',
			'dias' => max( 1, min( 90, absint( $r->get_param( 'dias' ) ) ?: 30 ) ), 'mensagem' => is_scalar( $r->get_param( 'mensagem' ) ) ? mb_substr( sanitize_textarea_field( (string) $r->get_param( 'mensagem' ) ), 0, 2000 ) : '', 'enviar' => $r->get_param( 'enviar' ) ? 1 : 0, 'marca' => 'azenhas' ) );
		$res = rest_do_request( $q );
		if ( $res->is_error() ) { return $res->as_error(); }
		$b = $res->get_data();
		$d['partilhas'] = array_slice( (array) ( $d['partilhas'] ?? array() ), -49 );
		$d['partilhas'][] = array( 'quem' => $u->display_name, 'uid' => $u->ID, 'em' => current_time( 'mysql' ), 'sid' => (int) ( $b['partilha']['id'] ?? 0 ) );
		tcd_acn_guardar( $id, $d );
		return rest_ensure_response( array( 'ok' => true, 'url' => $b['url'] ?? '', 'enviado' => ! empty( $b['enviado'] ) ) );
	} ) );
} );

// «Precisa de atenção»: avisos abertos para esta pessoa (ou para todos) e certidões a caducar em negócios activos.
add_filter( 'tcd_at_itens', function ( $it, $u ) {
	if ( ! $u || ! function_exists( 'tcd_acn_pode' ) || ! tcd_acn_pode( $u ) ) { return $it; }
	$en = tcd_acn_en( $u );
	$hoje = current_time( 'Y-m-d' ); $lim = gmdate( 'Y-m-d', strtotime( $hoje . ' +15 days' ) ); $n = 0; $alta = false; $prim = ''; $cad = 0;
	foreach ( get_posts( array( 'post_type' => array( 'tcd_negocio', 'tcd_imovel' ), 'post_status' => 'private', 'numberposts' => 200, 'meta_key' => '_tcd_acn_av', 'meta_value' => 0, 'meta_compare' => '>', 'meta_type' => 'NUMERIC' ) ) as $p ) {
		foreach ( (array) ( tcd_acn_m( $p->ID )['avisos'] ?? array() ) as $a ) {
			if ( ! empty( $a['fechado'] ) || ! in_array( (int) ( $a['para'] ?? 0 ), array( 0, (int) $u->ID ), true ) ) { continue; }
			$n++; $prim = $prim ?: $a['texto']; if ( ! empty( $a['ate'] ) && $a['ate'] <= $hoje ) { $alta = true; }
		}
	}
	foreach ( get_posts( array( 'post_type' => 'tcd_negocio', 'post_status' => 'private', 'numberposts' => 200 ) ) as $p ) {
		$d = tcd_acn_m( $p->ID );
		if ( in_array( $d['fase'] ?? '', array( 'fechado', 'desistiu' ), true ) ) { continue; }
		foreach ( (array) ( $d['docs'] ?? array() ) as $x ) { if ( 'certidao' === ( $x['tipo'] ?? '' ) && ! empty( $x['validade'] ) && $x['validade'] <= $lim ) { $cad++; } }
	}
	$url = home_url( '/area-equipa/?v=azenhas' );
	if ( $n ) { $it[] = array( 'prio' => $alta ? 'alta' : 'media', 'n' => $n, 'tit' => $en ? 'Azenhas e Castelos: notes' : 'Azenhas e Castelos: avisos', 'det' => $prim, 'url' => $url, 'bot' => $en ? 'Open' : 'Abrir', 'grande' => false ); }
	if ( $cad ) { $it[] = array( 'prio' => 'media', 'n' => $cad, 'tit' => $en ? 'Land registry certificates expiring' : 'Certidões permanentes a caducar', 'det' => $en ? 'Within 15 days or already expired.' : 'Nos próximos 15 dias ou já caducadas.', 'url' => $url, 'bot' => $en ? 'Open' : 'Abrir', 'grande' => false ); }
	return $it;
}, 30, 2 );

// Rótulos da vista (m90273), em português e em inglês: [pt, en].
function tcd_acn_rotulos_js() {
	return <<<'JS'
var W={t:['Azenhas e Castelos','Azenhas e Castelos'],nv:['+ Negócio','+ Deal'],sv:['Guardar','Save'],vt:['← Imóveis','← Properties'],cp:['Comprador','Buyer'],fa:['Fase','Stage'],va:['Valor acordado (€)','Agreed price (€)'],cv:['Data do CPCV','Promissory contract date'],es:['Data da escritura','Deed date'],pe:['Pessoas no negócio','People in the deal'],pa:['Passos','Steps'],dc:['Documentos','Documents'],av:['Avisos','Notes'],li:['Lista da escritura','Deed checklist'],lb:['Base a confirmar com o solicitador.','Starting list, to confirm with the solicitor.'],ar:['Artigos matriciais','Land registry articles'],sh:['Partilhar com o comprador','Share with the buyer'],ad:['+ Linha','+ Row'],fe:['Fechar','Close'],ok:['Guardado.','Saved.'],sm:['Sem negócios.','No deals.'],to:['Todos','Everyone'],cad:['caducado','expired'],en:['Enviar por e-mail','Send by e-mail'],ln:['Ligação','Link']};
var F={contacto:['Contacto','Contact'],visita:['Visita','Visit'],proposta:['Proposta','Offer'],cpcv:['CPCV','Promissory contract'],escritura:['Escritura','Deed'],fechado:['Fechado','Closed'],desistiu:['Desistiu','Withdrew']};
var P={vendedor:['Vendedor','Seller'],comprador:['Comprador','Buyer'],procurador:['Procurador','Attorney'],solicitador:['Solicitador','Solicitor'],banco:['Banco','Bank'],colaborador:['Colaborador','Agent']};
var D={certidao:['Certidão permanente','Land registry certificate'],caderneta:['Caderneta predial','Tax register extract'],licenca:['Licença de utilização ou isenção','Use licence or exemption'],ficha:['Ficha técnica','Technical file'],energetico:['Certificado energético','Energy certificate'],procuracao:['Procuração','Power of attorney'],ident:['Identificação e NIF','ID and tax number'],distrate:['Distrate','Mortgage release'],preferencia:['Comunicações de preferência','Pre-emption notices'],cpcv:['CPCV e sinal','Promissory contract and deposit'],imt:['IMT e Imposto do Selo','IMT and stamp duty'],outro:['Outro','Other']};
var K=Object.assign({},D,{pagamento:['Meios de pagamento','Means of payment'],branqueamento:['Identificação (branqueamento)','Anti-money-laundering ID'],mediacao:['Contrato de mediação','Brokerage contract']});
var A={rustico:['Rústico','Rural'],urbano:['Urbano','Urban'],misto:['Misto','Mixed']};
JS;
}
