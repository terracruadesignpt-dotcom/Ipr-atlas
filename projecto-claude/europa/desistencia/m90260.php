<?php
// Módulo 90260: Espanha, ES-11 (textos de espanha/legal-es/formulario-desistimiento.md, secções C a F; decisão 15 do
// espanha/estado.md). Só actua em encomendas espanholas (meta _tcd_lingua = es, do m90240, ou país de facturação ES).
// 1. Página de pagamento (order-pay, onde se paga a Base e a Leitura Territorial): «Contrata como» particular/empresa,
//    caixas C.1/C.2/C.3 conforme os artigos (não marcadas), caixa obrigatória dos Términos, botão «Pedido con obligación
//    de pago» e linha com o total. O texto exacto, marcado ou não, fica na encomenda com data e hora (_tcd_es11).
// 2. Pagamento normal (bloco de checkout, IPR Cloud e Intelligence): os mesmos dados por campos adicionais do WooCommerce.
// 3. Particular sem a caixa C.1 (Base) ou C.2 (Leitura): a encomenda não entra na fila do worker; fica «diferido» e entra
//    sozinha quando terminam os 14 dias (cron horário). Desistência antes disso: «desistido», nunca entra.
// 4. Função de desistência (Directiva (UE) 2023/2673): botão «Desistir del contrato aquí» na lista de encomendas e no
//    e-mail; ecrã em [tcd_desistir] (página /es/desistimiento/); confirmação de recepção por e-mail com data e hora;
//    aviso à equipa. O reembolso continua a ser feito pela equipa.
// 5. Parágrafos F.1 a F.5 no e-mail de confirmação da encomenda.
// v-Europa (21/10/2026, 19h): textos em es, pt e en; com tcd_es11_eu_on = '1' cobre também as encomendas portuguesas e
// do resto da UE/EEE (a função de desistência é obrigatória em toda a UE desde 19/06/2026). Páginas por língua na opção
// tcd_es11_paginas; [tcd_desistir lg="pt"] fixa a língua do ecrã.
// Interruptor: tcd_es11_off = '1'. Prefixo tcd_es11_. Depende do m90240 (tcd_esp_*) e do m14618 (tcd_wk_por_na_fila).
if ( ! defined( 'ABSPATH' ) ) { exit; }

function tcd_es11_ligado() { return '1' !== (string) get_option( 'tcd_es11_off', '0' ); }
// Textos por língua da encomenda (es: espanha/legal-es; pt: DL 24/2014; en: base europeia europa/legal/terms-eu-en).
// Os textos pt e en dos botões da Directiva 2023/2673 estão por confirmar com o jurista (LEIA-ME).
function tcd_es11_textos() {
	return array(
		'es' => array(
			'tipo' => 'Contrata como', 'particular' => 'Particular (consumidor)', 'empresa' => 'Empresa o profesional',
			'c1' => 'Solicito expresamente que Terracrua Design empiece a procesar la Base Cartográfica de inmediato, antes de que termine el plazo de desistimiento de 14 días. Sé que, al empezar el procesamiento, pierdo mi derecho de desistimiento.',
			'c1_ayuda' => 'Si no marca esta casilla, puede continuar el pedido y el procesamiento empezará cuando terminen los 14 días del plazo de desistimiento.',
			'c2' => 'Solicito expresamente que la prestación del servicio empiece durante el plazo de desistimiento de 14 días. Sé que, si desisto, deberé pagar la parte proporcional del servicio ya prestado, y que perderé el derecho de desistimiento cuando el servicio se haya prestado por completo.',
			'c3' => 'Solicito el acceso inmediato. Sé que, si desisto en los 14 días siguientes, se me reembolsará el importe pagado menos la parte proporcional al tiempo transcurrido.',
			'c23_ayuda' => 'Si no marca la casilla, el servicio empezará cuando terminen los 14 días del plazo de desistimiento.',
			'c23' => 'Solicito expresamente que el servicio o el acceso empiece de inmediato, durante el plazo de desistimiento de 14 días. Sé que, si desisto, deberé pagar la parte proporcional del servicio prestado o del tiempo transcurrido, y que perderé el derecho de desistimiento cuando el servicio se haya prestado por completo.',
			'c4' => 'He leído y acepto los %s.', 'c4_bloque' => 'He leído y acepto los Términos y condiciones (terracruadesign.pt/es/terminos/).', 'terminos' => 'Términos y condiciones',
			'boton' => 'Pedido con obligación de pago', 'linea_d' => 'Al pulsar, su pedido queda confirmado y deberá pagar el importe total indicado: %s (IVA incluido).',
			'err_tipo' => 'Indique si contrata como particular o como empresa o profesional.', 'err_c4' => 'Para continuar, lea y acepte los Términos y condiciones.',
			'desistir' => 'Desistir del contrato aquí', 'guarda' => 'Para pagar este pedido, abra el enlace de pago y marque las casillas del pedido. Si el problema continúa, escríbanos a info@terracruadesign.pt.',
			'e_titulo' => 'Desistir del contrato', 'e_nombre' => 'Nombre', 'e_pedido' => 'Pedido', 'e_email' => 'Correo electrónico para la confirmación', 'e_motivo' => 'Motivo (opcional)',
			'e_aviso' => 'Al confirmar, nos comunica su decisión de desistir de este contrato. Le enviaremos de inmediato una confirmación de recepción por correo electrónico con la fecha y la hora.',
			'e_boton' => 'Confirmar desistimiento',
			'e_ok' => 'Hemos recibido su decisión de desistir del pedido n.º %s el %s a las %s (hora de Lisboa). Le hemos enviado la confirmación de recepción por correo electrónico.',
			'e_verificar' => 'Hemos recibido su comunicación. No hemos podido asociarla automáticamente a un pedido dentro del plazo; la revisaremos y le responderemos por correo electrónico.',
			'e_erro' => 'No hemos podido registrar la comunicación. Escríbanos a %s.',
			'e_fora' => 'Este pedido ya no admite el desistimiento en línea (plazo terminado, desistimiento ya comunicado o derecho perdido). Si tiene dudas, escríbanos a %s.',
			'm_texto' => 'Desisto del contrato del pedido n.º %s (%s).', 'm_motivo' => ' Motivo: %s',
			'm_assunto' => 'Hemos recibido su desistimiento · Pedido n.º %s',
			'm_corpo' => "Hola, %s:\n\nHemos recibido el %s, a las %s (hora de Lisboa), su decisión de desistir del contrato siguiente:\n\nPedido n.º %s · %s\n\nTexto de su comunicación: «%s»\n\nLe devolveremos los pagos que correspondan en un plazo máximo de 14 días naturales desde hoy, por el mismo medio de pago que usó. Si el servicio ya había empezado a petición suya, descontaremos la parte proporcional ya prestada y le indicaremos el cálculo.\n\nSi no ha sido usted quien ha enviado esta comunicación, escríbanos a info@terracruadesign.pt.\n\nTerracrua Design",
			'f1_sim' => 'Usted solicitó expresamente, el %s a las %s, que empezáramos a procesar la Base Cartográfica de inmediato, antes de que terminara el plazo de desistimiento, y reconoció que con ello perdía su derecho de desistimiento. Le confirmamos ese consentimiento y ese reconocimiento. Por este motivo, una vez iniciado el procesamiento, no puede desistir de este pedido. Si la Base no se ajusta a lo descrito, conserva sus derechos de conformidad: escríbanos a info@terracruadesign.pt.',
			'f1_nao' => 'Usted no ha pedido el inicio inmediato. El procesamiento de la Base Cartográfica empezará el %s, al terminar el plazo de desistimiento de 14 días. Hasta entonces puede desistir del pedido y le devolveremos el importe íntegro.',
			'f3' => 'Usted solicitó expresamente, el %s a las %s, que la prestación empezara durante el plazo de desistimiento, que termina el %s. Si desiste antes de esa fecha, le devolveremos lo pagado menos la parte proporcional del servicio ya prestado. Cuando el servicio esté prestado por completo, ya no podrá desistir.',
			'f4' => 'Usted solicitó el acceso inmediato el %s a las %s. Puede desistir hasta el %s; en ese caso le devolveremos el importe pagado menos la parte proporcional al tiempo transcurrido. Este acceso no se renueva automáticamente.',
			'f5_anexo' => 'Tiene derecho a desistir de este contrato en un plazo de 14 días naturales desde hoy, en las condiciones indicadas arriba y en los Términos y condiciones adjuntos. Para hacerlo, use el botón «Desistir del contrato aquí» (%s), el formulario adjunto o escríbanos a info@terracruadesign.pt.',
			'f5_link' => 'Tiene derecho a desistir de este contrato en un plazo de 14 días naturales desde hoy, en las condiciones indicadas arriba y en los Términos y condiciones (%s). Para hacerlo, use el botón «Desistir del contrato aquí» (%s), el formulario de desistimiento (%s) o escríbanos a info@terracruadesign.pt.',
		),
		'pt' => array(
			'tipo' => 'Compra como', 'particular' => 'Particular (consumidor)', 'empresa' => 'Empresa ou profissional',
			'c1' => 'Peço expressamente que a Terracrua Design comece já a processar a Base Cartográfica, antes de terminar o prazo de 14 dias de livre resolução. Sei que, quando o processamento começar, perco o direito de livre resolução.',
			'c1_ajuda' => 'Se não marcar esta caixa, pode continuar a encomenda e o processamento começa quando terminarem os 14 dias do prazo de livre resolução.',
			'c2' => 'Peço expressamente que a prestação do serviço comece durante o prazo de 14 dias de livre resolução. Sei que, se resolver o contrato, pago a parte do serviço já prestada, e que perco o direito de livre resolução quando o serviço estiver totalmente prestado.',
			'c3' => 'Peço o acesso imediato. Sei que, se resolver o contrato nos 14 dias seguintes, recebo o valor pago menos a parte correspondente ao tempo decorrido.',
			'c23_ajuda' => 'Se não marcar a caixa, o serviço começa quando terminarem os 14 dias do prazo de livre resolução.',
			'c23' => 'Peço expressamente que o serviço ou o acesso comece já, durante o prazo de 14 dias de livre resolução. Sei que, se resolver o contrato, pago a parte do serviço prestada ou do tempo decorrido, e que perco o direito de livre resolução quando o serviço estiver totalmente prestado.',
			'c4' => 'Li e aceito os %s.', 'c4_bloque' => 'Li e aceito os Termos e Condições (terracruadesign.pt/terms-conditions/).', 'terminos' => 'Termos e Condições',
			'boton' => 'Encomenda com obrigação de pagar', 'linea_d' => 'Ao carregar, a sua encomenda fica confirmada e tem de pagar o valor total indicado: %s (IVA incluído).',
			'err_tipo' => 'Indique se compra como particular ou como empresa ou profissional.', 'err_c4' => 'Para continuar, leia e aceite os Termos e Condições.',
			'desistir' => 'Resolver o contrato aqui', 'guarda' => 'Para pagar esta encomenda, abra a ligação de pagamento e marque as caixas da encomenda. Se o problema continuar, escreva para info@terracruadesign.pt.',
			'e_titulo' => 'Resolver o contrato', 'e_nombre' => 'Nome', 'e_pedido' => 'Encomenda', 'e_email' => 'E-mail para a confirmação', 'e_motivo' => 'Motivo (opcional)',
			'e_aviso' => 'Ao confirmar, comunica-nos a sua decisão de resolver este contrato. Enviamos logo uma confirmação de recepção por e-mail, com a data e a hora.',
			'e_boton' => 'Confirmar a resolução',
			'e_ok' => 'Recebemos a sua decisão de resolver a encomenda n.º %s a %s às %s (hora de Lisboa). Enviámos a confirmação de recepção por e-mail.',
			'e_verificar' => 'Recebemos a sua comunicação. Não conseguimos associá-la automaticamente a uma encomenda dentro do prazo; vamos vê-la e responder por e-mail.',
			'e_erro' => 'Não conseguimos registar a comunicação. Escreva para %s.',
			'e_fora' => 'Esta encomenda já não admite a resolução em linha (prazo terminado, resolução já comunicada ou direito perdido). Em caso de dúvida, escreva para %s.',
			'm_texto' => 'Resolvo o contrato da encomenda n.º %s (%s).', 'm_motivo' => ' Motivo: %s',
			'm_assunto' => 'Recebemos a sua resolução do contrato · Encomenda n.º %s',
			'm_corpo' => "Olá, %s,\n\nRecebemos a %s, às %s (hora de Lisboa), a sua decisão de resolver o contrato seguinte:\n\nEncomenda n.º %s · %s\n\nTexto da sua comunicação: «%s»\n\nDevolvemos os pagamentos devidos no prazo máximo de 14 dias a contar de hoje, pelo mesmo meio de pagamento que usou. Se o serviço já tinha começado a seu pedido, descontamos a parte já prestada e indicamos o cálculo.\n\nSe não foi o próprio a enviar esta comunicação, escreva para info@terracruadesign.pt.\n\nTerracrua Design",
			'f1_sim' => 'Pediu expressamente, a %s às %s, que começássemos já a processar a Base Cartográfica, antes de terminar o prazo de livre resolução, e reconheceu que assim perdia o direito de livre resolução. Confirmamos esse consentimento e esse reconhecimento. Por isso, depois de o processamento começar, não pode resolver esta encomenda. Se a Base não corresponder ao descrito, mantém os seus direitos de conformidade: escreva para info@terracruadesign.pt.',
			'f1_nao' => 'Não pediu o início imediato. O processamento da Base Cartográfica começa a %s, quando terminar o prazo de 14 dias de livre resolução. Até lá pode resolver a encomenda e devolvemos o valor total.',
			'f3' => 'Pediu expressamente, a %s às %s, que a prestação começasse durante o prazo de livre resolução, que termina a %s. Se resolver o contrato antes dessa data, devolvemos o valor pago menos a parte do serviço já prestada. Depois de o serviço estar totalmente prestado, deixa de poder resolver.',
			'f4' => 'Pediu o acesso imediato a %s às %s. Pode resolver o contrato até %s; nesse caso devolvemos o valor pago menos a parte correspondente ao tempo decorrido. Este acesso não se renova automaticamente.',
			'f5_anexo' => 'Tem o direito de resolver este contrato no prazo de 14 dias a contar de hoje, nas condições acima e nos Termos e Condições em anexo. Para isso, use o botão «Resolver o contrato aqui» (%s), o formulário em anexo ou escreva para info@terracruadesign.pt.',
			'f5_link' => 'Tem o direito de resolver este contrato no prazo de 14 dias a contar de hoje, nas condições acima e nos Termos e Condições (%s). Para isso, use o botão «Resolver o contrato aqui» (%s), o formulário de livre resolução (%s) ou escreva para info@terracruadesign.pt.',
		),
		'en' => array(
			'tipo' => 'Buying as', 'particular' => 'Private individual (consumer)', 'empresa' => 'Business or professional',
			'c1' => 'I expressly request that Terracrua Design start processing the Cartographic Base immediately, before the 14-day withdrawal period ends. I know that once processing starts I lose my right of withdrawal.',
			'c1_ajuda' => 'If you do not tick this box you can still place the order, and processing will start when the 14-day withdrawal period ends.',
			'c2' => 'I expressly request that the service start during the 14-day withdrawal period. I know that if I withdraw I will pay for the part already provided, and that I lose the right of withdrawal once the service has been fully provided.',
			'c3' => 'I request immediate access. I know that if I withdraw within the next 14 days I will be refunded the amount paid less a share for the time elapsed.',
			'c23_ajuda' => 'If you do not tick the box, the service will start when the 14-day withdrawal period ends.',
			'c23' => 'I expressly request that the service or access start immediately, during the 14-day withdrawal period. I know that if I withdraw I will pay for the part of the service provided or the time elapsed, and that I lose the right of withdrawal once the service has been fully provided.',
			'c4' => 'I have read and accept the %s.', 'c4_bloque' => 'I have read and accept the Terms and Conditions (terracruadesign.pt/terms/).', 'terminos' => 'Terms and Conditions',
			'boton' => 'Order with obligation to pay', 'linea_d' => 'When you click, your order is confirmed and you must pay the total shown: %s (VAT included).',
			'err_tipo' => 'Please say whether you are buying as a private individual or as a business.', 'err_c4' => 'To continue, please read and accept the Terms and Conditions.',
			'desistir' => 'Withdraw from contract here', 'guarda' => 'To pay for this order, open the payment link and tick the order boxes. If the problem continues, write to info@terracruadesign.pt.',
			'e_titulo' => 'Withdraw from contract', 'e_nombre' => 'Name', 'e_pedido' => 'Order', 'e_email' => 'Email for the confirmation', 'e_motivo' => 'Reason (optional)',
			'e_aviso' => 'By confirming, you tell us that you are withdrawing from this contract. We will immediately send you an acknowledgement of receipt by email, with the date and time.',
			'e_boton' => 'Confirm withdrawal',
			'e_ok' => 'We received your decision to withdraw from order no. %s on %s at %s (Lisbon time). We have emailed you an acknowledgement of receipt.',
			'e_verificar' => 'We received your message. We could not match it automatically to an order within the period; we will review it and reply by email.',
			'e_erro' => 'We could not record your message. Please write to %s.',
			'e_fora' => 'This order can no longer be withdrawn online (period ended, withdrawal already sent or right lost). If in doubt, write to %s.',
			'm_texto' => 'I withdraw from the contract for order no. %s (%s).', 'm_motivo' => ' Reason: %s',
			'm_assunto' => 'We received your withdrawal · Order no. %s',
			'm_corpo' => "Hello %s,\n\nOn %s at %s (Lisbon time) we received your decision to withdraw from the following contract:\n\nOrder no. %s · %s\n\nText of your message: \"%s\"\n\nWe will refund the amounts due within 14 days from today, using the same payment method you used. If the service had already started at your request, we will deduct the part already provided and show you the calculation.\n\nIf you did not send this message, please write to info@terracruadesign.pt.\n\nTerracrua Design",
			'f1_sim' => 'On %s at %s you expressly requested that we start processing the Cartographic Base immediately, before the withdrawal period ended, and acknowledged that you would thereby lose your right of withdrawal. We confirm that consent and acknowledgement. Once processing has started you can therefore no longer withdraw from this order. If the Base does not match its description, you keep your conformity rights: write to info@terracruadesign.pt.',
			'f1_nao' => 'You did not request an immediate start. Processing of the Cartographic Base will start on %s, when the 14-day withdrawal period ends. Until then you can withdraw and we will refund the full amount.',
			'f3' => 'On %s at %s you expressly requested that the service start during the withdrawal period, which ends on %s. If you withdraw before that date, we will refund the amount paid less the part of the service already provided. Once the service has been fully provided you can no longer withdraw.',
			'f4' => 'You requested immediate access on %s at %s. You can withdraw until %s; we will then refund the amount paid less a share for the time elapsed. This access does not renew automatically.',
			'f5_anexo' => 'You have the right to withdraw from this contract within 14 days from today, under the conditions above and in the attached Terms and Conditions. To do so, use the button "Withdraw from contract here" (%s), the attached form, or write to info@terracruadesign.pt.',
			'f5_link' => 'You have the right to withdraw from this contract within 14 days from today, under the conditions above and in the Terms and Conditions (%s). To do so, use the button "Withdraw from contract here" (%s), the withdrawal form (%s), or write to info@terracruadesign.pt.',
		),
	);
}
// Língua de uma encomenda: es nas espanholas, pt nas portuguesas, en no resto da UE (ou a língua guardada, se for uma destas).
function tcd_es11_lg( $o = null ) {
	if ( $o ) {
		$l = (string) $o->get_meta( '_tcd_lingua' ); if ( in_array( $l, array( 'es', 'pt', 'en' ), true ) ) { return $l; }
		$p = strtoupper( (string) $o->get_billing_country() );
		if ( 'ES' === $p ) { return 'es'; }
		if ( 'PT' === $p || '' === $p ) { return 'pt'; }
		return 'en';
	}
	$l = function_exists( 'tcd_i18n_lingua' ) ? tcd_i18n_lingua() : 'pt';
	return in_array( $l, array( 'es', 'pt', 'en' ), true ) ? $l : 'en';
}
function tcd_es11_t( $k, $lg = 'es' ) {
	static $t = null; if ( null === $t ) { $t = tcd_es11_textos(); }
	$lg = isset( $t[ $lg ] ) ? $lg : 'en';
	if ( 'pt' === $lg && 'c1_ayuda' === $k ) { $k = 'c1_ajuda'; }
	if ( 'pt' === $lg && 'c23_ayuda' === $k ) { $k = 'c23_ajuda'; }
	if ( 'en' === $lg && 'c1_ayuda' === $k ) { $k = 'c1_ajuda'; }
	if ( 'en' === $lg && 'c23_ayuda' === $k ) { $k = 'c23_ajuda'; }
	return $t[ $lg ][ $k ] ?? ( $t['es'][ $k ] ?? $k );
}
// Páginas por língua (opção tcd_es11_paginas, JSON, sobrepõe): desistência e termos.
function tcd_es11_pagina( $qual, $lg ) {
	$p = array( 'es' => array( 'desist' => '/es/desistimiento/', 'termos' => '/es/terminos/' ), 'pt' => array( 'desist' => '/livre-resolucao/', 'termos' => '/terms-conditions/' ), 'en' => array( 'desist' => '/withdrawal/', 'termos' => '/terms/' ) );
	$x = json_decode( (string) get_option( 'tcd_es11_paginas', '' ), true );
	if ( is_array( $x ) && isset( $x[ $lg ][ $qual ] ) && is_string( $x[ $lg ][ $qual ] ) && '/' === substr( $x[ $lg ][ $qual ], 0, 1 ) ) { return $x[ $lg ][ $qual ]; }
	return $p[ $lg ][ $qual ] ?? $p['en'][ $qual ];
}

// Que caixa cabe a cada artigo: c1 Base (conteúdo digital), c3 acesso por período (IPR Cloud, Intelligence),
// 'v' vales-oferta (sem caixa: não começam nada, mas têm desistência e F.5), c2 o resto (Leitura, visitas, videochamadas).
function tcd_es11_tipo_item( $pid, $sku ) {
	$pid = (int) $pid; $sku = (string) $sku;
	if ( $pid === (int) apply_filters( 'tcd_es11_produto_base', 14471 ) ) { return 'c1'; }
	if ( preg_match( '/^IPR-(CLOUD|ATLAS)-/i', $sku ) ) { return 'c3'; }
	if ( preg_match( '/^tcd-vale-/i', $sku ) ) { return 'v'; }
	return 'c2';
}
function tcd_es11_caixas_itens( $itens ) {
	$c = array();
	foreach ( $itens as $it ) {
		$k = tcd_es11_tipo_item( $it['pid'], $it['sku'] );
		if ( $k ) { $c[ $k ] = true; }
	}
	return array_values( array_intersect( array( 'c1', 'c2', 'c3' ), array_keys( $c ) ) );
}
function tcd_es11_tem_itens( $o ) { return array() !== tcd_es11_itens( $o ); }
function tcd_es11_itens( $o ) {
	$r = array();
	foreach ( $o->get_items() as $it ) {
		$p = method_exists( $it, 'get_product' ) ? $it->get_product() : null;
		$r[] = array( 'pid' => (int) $it->get_product_id(), 'sku' => $p ? (string) $p->get_sku() : '' );
	}
	return $r;
}
function tcd_es11_eu_on() { return '1' === (string) get_option( 'tcd_es11_eu_on', '0' ); }
function tcd_es11_ue() { return array( 'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','IS','LI','NO' ); }
// Encomenda abrangida: espanhola sempre (ES-11); portuguesa e do resto da UE/EEE só com tcd_es11_eu_on = '1'
// (21/10/2026: a função de desistência é obrigatória em toda a UE desde 19/06/2026; ligar depois da decisão do Nuno).
function tcd_es11_es( $o ) {
	if ( ! $o || ! tcd_es11_ligado() ) { return false; }
	if ( 'es' === (string) $o->get_meta( '_tcd_lingua' ) || 'ES' === strtoupper( (string) $o->get_billing_country() ) ) { return true; }
	if ( ! tcd_es11_eu_on() ) { return false; }
	$p = strtoupper( (string) $o->get_billing_country() );
	return '' === $p || in_array( $p, tcd_es11_ue(), true );
}
function tcd_es11_registo( $o ) { $r = $o->get_meta( '_tcd_es11' ); return is_array( $r ) ? $r : array(); }
// Particular? Com registo, o que a pessoa escolheu; sem registo (vale que cobre tudo, encomenda antiga), particular
// quando não há empresa na facturação: na dúvida aplica-se a protecção do consumidor.
function tcd_es11_particular( $o ) {
	$r = tcd_es11_registo( $o );
	if ( ! empty( $r['tipo'] ) ) { return 'particular' === $r['tipo']; }
	return '' === trim( (string) $o->get_billing_company() );
}
function tcd_es11_marcada( $o, $k ) { $r = tcd_es11_registo( $o ); return ! empty( $r['caixas'][ $k ]['marcada'] ); }
function tcd_es11_quando( $o ) {
	$r = tcd_es11_registo( $o );
	return ! empty( $r['t'] ) ? (int) $r['t'] : 0;
}
// Data do contrato (pagamento confirmado) e fim do prazo de 14 dias.
function tcd_es11_contrato( $o ) {
	$d = $o->get_date_paid(); if ( ! $d ) { $d = $o->get_date_created(); }
	return $d ? (int) $d->getTimestamp() : time();
}
// O dia do contrato não conta (Regulamento 1182/71); o prazo acaba às 23:59:59 do 14.º dia natural seguinte, hora de Lisboa.
function tcd_es11_fim_prazo( $o ) {
	$tz = new DateTimeZone( 'Europe/Lisbon' );
	$d = ( new DateTimeImmutable( '@' . tcd_es11_contrato( $o ) ) )->setTimezone( $tz )->setTime( 23, 59, 59 )->modify( '+14 days' );
	return (int) $d->getTimestamp();
}
function tcd_es11_inicio_diferido( $o ) { return tcd_es11_fim_prazo( $o ) + 1; }
function tcd_es11_data( $ts ) { return function_exists( 'wp_date' ) ? wp_date( 'd/m/Y', $ts ) : gmdate( 'd/m/Y', $ts ); }
function tcd_es11_hora( $ts ) { return function_exists( 'wp_date' ) ? wp_date( 'H:i', $ts ) : gmdate( 'H:i', $ts ); }

function tcd_es11_gravar( $o, $tipo, $marcadas, $via, $c4 = true ) {
	$caixas = array();
	foreach ( tcd_es11_caixas_itens( tcd_es11_itens( $o ) ) as $k ) {
		$caixas[ $k ] = array( 'marcada' => in_array( $k, $marcadas, true ), 'texto' => tcd_es11_t( 'block' === $via && 'c1' !== $k ? 'c23' : $k, tcd_es11_lg( $o ) ) );
	}
	$caixas['c4'] = array( 'marcada' => (bool) $c4, 'texto' => 'block' === $via ? tcd_es11_t( 'c4_bloque', tcd_es11_lg( $o ) ) : sprintf( tcd_es11_t( 'c4', tcd_es11_lg( $o ) ), tcd_es11_t( 'terminos', tcd_es11_lg( $o ) ) ) );
	$o->update_meta_data( '_tcd_es11', array( 'tipo' => $tipo, 'caixas' => 'empresa' === $tipo ? array( 'c4' => $caixas['c4'] ) : $caixas, 't' => time(), 'via' => $via ) );
	$o->save();
}

// 1. Página de pagamento (order-pay).
function tcd_es11_pedido_pagina() {
	global $wp;
	$id = isset( $wp->query_vars['order-pay'] ) ? absint( $wp->query_vars['order-pay'] ) : 0;
	return $id && function_exists( 'wc_get_order' ) ? wc_get_order( $id ) : null;
}
add_action( 'woocommerce_pay_order_before_submit', function () {
	$o = tcd_es11_pedido_pagina();
	if ( ! tcd_es11_es( $o ) ) { return; }
	echo tcd_es11_html_pagamento( $o ); // phpcs:ignore WordPress.Security.EscapeOutput -- montado com esc_*.
} );
function tcd_es11_html_pagamento( $o ) {
	$lg = tcd_es11_lg( $o );
	$emp = '' !== trim( (string) $o->get_billing_company() );
	$h  = '<fieldset class="tcd-es11" style="border:0;padding:0;margin:1em 0">';
	$h .= '<p><strong>' . esc_html( tcd_es11_t( 'tipo', $lg ) ) . '</strong><br>';
	$h .= '<label><input type="radio" name="tcd_es_tipo" value="particular"' . ( $emp ? '' : ' checked' ) . '> ' . esc_html( tcd_es11_t( 'particular', $lg ) ) . '</label> &nbsp; ';
	$h .= '<label><input type="radio" name="tcd_es_tipo" value="empresa"' . ( $emp ? ' checked' : '' ) . '> ' . esc_html( tcd_es11_t( 'empresa', $lg ) ) . '</label></p>';
	$h .= '<div data-tcd-es11-cons' . ( $emp ? ' hidden' : '' ) . '>';
	$cx = tcd_es11_caixas_itens( tcd_es11_itens( $o ) );
	foreach ( $cx as $k ) {
		$h .= '<p><label><input type="checkbox" name="tcd_es_' . $k . '" value="1"> ' . esc_html( tcd_es11_t( $k, $lg ) ) . '</label>';
		if ( 'c1' === $k ) { $h .= '<br><small>' . esc_html( tcd_es11_t( 'c1_ayuda', $lg ) ) . '</small>'; }
		$h .= '</p>';
	}
	if ( array_intersect( array( 'c2', 'c3' ), $cx ) ) { $h .= '<p><small>' . esc_html( tcd_es11_t( 'c23_ayuda', $lg ) ) . '</small></p>'; }
	$h .= '</div>';
	$lt = '<a href="' . esc_url( home_url( tcd_es11_pagina( 'termos', $lg ) ) ) . '" target="_blank" rel="noopener">' . esc_html( tcd_es11_t( 'terminos', $lg ) ) . '</a>';
	$h .= '<p><label><input type="checkbox" name="tcd_es_c4" value="1" required> ' . sprintf( esc_html( tcd_es11_t( 'c4', $lg ) ), $lt ) . ' *</label></p>';
	$tot = function_exists( 'wc_price' ) ? wp_strip_all_tags( wc_price( $o->get_total(), array( 'currency' => $o->get_currency() ) ) ) : (string) $o->get_total();
	$h .= '<p><small>' . esc_html( sprintf( tcd_es11_t( 'linea_d', $lg ), $tot ) ) . '</small></p>';
	$h .= '</fieldset><script>(function(){var f=document.querySelector(".tcd-es11");if(!f)return;var d=f.querySelector("[data-tcd-es11-cons]");'
		. 'f.addEventListener("change",function(e){if(e.target.name==="tcd_es_tipo"){d.hidden=e.target.value!=="particular";}});})();</script>';
	return $h;
}
// O WooCommerce mostra a sua caixa de termos (página portuguesa); nas encomendas espanholas fica só a nossa.
add_filter( 'woocommerce_checkout_show_terms', function ( $v ) {
	$o = function_exists( 'is_checkout_pay_page' ) && is_checkout_pay_page() ? tcd_es11_pedido_pagina() : null;
	return tcd_es11_es( $o ) ? false : $v;
} );
add_filter( 'woocommerce_pay_order_button_text', function ( $t ) {
	$o = tcd_es11_pedido_pagina(); return tcd_es11_es( $o ) ? tcd_es11_t( 'boton', tcd_es11_lg( $o ) ) : $t;
} );
// Validação no servidor: com erro, o WooCommerce não chega a cobrar (wc_notice_count('error') em pay_action).
add_action( 'woocommerce_before_pay_action', function ( $o ) {
	if ( ! tcd_es11_es( $o ) ) { return; }
	$tipo = isset( $_POST['tcd_es_tipo'] ) ? sanitize_key( wp_unslash( $_POST['tcd_es_tipo'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification -- nonce do WooCommerce já verificado.
	$ok = true;
	if ( ! in_array( $tipo, array( 'particular', 'empresa' ), true ) ) { wc_add_notice( tcd_es11_t( 'err_tipo', tcd_es11_lg( $o ) ), 'error' ); $ok = false; }
	if ( empty( $_POST['tcd_es_c4'] ) ) { wc_add_notice( tcd_es11_t( 'err_c4', tcd_es11_lg( $o ) ), 'error' ); $ok = false; } // phpcs:ignore WordPress.Security.NonceVerification
	if ( ! $ok ) { return; }
	$m = array();
	foreach ( array( 'c1', 'c2', 'c3' ) as $k ) { if ( ! empty( $_POST[ 'tcd_es_' . $k ] ) ) { $m[] = $k; } } // phpcs:ignore WordPress.Security.NonceVerification
	tcd_es11_gravar( $o, $tipo, $m, 'order-pay' );
}, 5 );

// 2. Bloco de checkout (IPR Cloud, Intelligence, videochamadas). Os campos só existem nos pedidos em castelhano.
add_action( 'woocommerce_init', function () {
	if ( ! tcd_es11_ligado() || ! function_exists( 'woocommerce_register_additional_checkout_field' ) ) { return; }
	$es = function_exists( 'tcd_esp_lingua_es' ) && tcd_esp_lingua_es();
	if ( ! $es && ! tcd_es11_eu_on() ) { return; }
	$lg = $es ? 'es' : tcd_es11_lg();
	woocommerce_register_additional_checkout_field( array( 'id' => 'tcd/es-tipo', 'label' => tcd_es11_t( 'tipo', $lg ), 'location' => 'order', 'type' => 'select', 'required' => true,
		'options' => array( array( 'value' => 'particular', 'label' => tcd_es11_t( 'particular', $lg ) ), array( 'value' => 'empresa', 'label' => tcd_es11_t( 'empresa', $lg ) ) ) ) );
	woocommerce_register_additional_checkout_field( array( 'id' => 'tcd/es-inicio', 'label' => tcd_es11_t( 'c23', $lg ), 'location' => 'order', 'type' => 'checkbox' ) );
	woocommerce_register_additional_checkout_field( array( 'id' => 'tcd/es-terminos', 'label' => tcd_es11_t( 'c4_bloque', $lg ), 'location' => 'order', 'type' => 'checkbox', 'required' => true ) );
} );
add_action( 'woocommerce_store_api_checkout_order_processed', function ( $o ) {
	if ( ! tcd_es11_es( $o ) ) { return; }
	$tipo = (string) $o->get_meta( '_wc_other/tcd/es-tipo' );
	if ( ! in_array( $tipo, array( 'particular', 'empresa' ), true ) ) { return; }
	if ( ! $o->get_meta( '_wc_other/tcd/es-terminos' ) ) { return; } // sem registo, o guarda abaixo recusa o pagamento
	$ini = (bool) $o->get_meta( '_wc_other/tcd/es-inicio' );
	tcd_es11_gravar( $o, $tipo, $ini ? array( 'c2', 'c3' ) : array(), 'block' ); // a Base nunca se autoriza por esta caixa
} );
// Guarda de todos os pagamentos pela Store API (bloco de checkout, checkout/{id}, botões expressos da página de pagamento):
// encomenda espanhola sem consentimento gravado não é cobrada.
add_action( 'woocommerce_rest_checkout_process_payment_with_context', function ( $ctx, $res ) {
	$o = is_object( $ctx ) && isset( $ctx->order ) ? $ctx->order : null;
	if ( ! tcd_es11_es( $o ) || ! empty( tcd_es11_registo( $o )['caixas']['c4']['marcada'] ) ) { return; }
	$m = tcd_es11_t( 'guarda', tcd_es11_lg( $o ) );
	if ( class_exists( 'Automattic\\WooCommerce\\StoreApi\\Exceptions\\RouteException' ) ) { throw new \Automattic\WooCommerce\StoreApi\Exceptions\RouteException( 'tcd_es11_consentimento', $m, 400 ); }
	throw new Exception( $m );
}, 1, 2 );
add_action( 'wp_enqueue_scripts', function () {
	$es = function_exists( 'tcd_esp_lingua_es' ) && tcd_esp_lingua_es();
	if ( ! tcd_es11_ligado() || ( ! $es && ! tcd_es11_eu_on() ) || ! function_exists( 'is_checkout' ) || ! is_checkout() ) { return; }
	$js = '(function(){var r=window.wc&&wc.blocksCheckout&&wc.blocksCheckout.registerCheckoutFilters;if(r){r("tcd-es11",{placeOrderButtonLabel:function(){return ' . wp_json_encode( tcd_es11_t( 'boton', $es ? 'es' : tcd_es11_lg() ) ) . ';}});}})();';
	wp_add_inline_script( 'wc-blocks-checkout', $js, 'after' );
}, 30 );

// 3. Início diferido: Base (c1) e Leitura (c2) de particulares sem a caixa marcada não entram na fila do worker.
function tcd_es11_diferir( $o ) {
	if ( ! tcd_es11_es( $o ) || ! tcd_es11_particular( $o ) ) { return false; }
	$cx = tcd_es11_caixas_itens( tcd_es11_itens( $o ) );
	foreach ( array( 'c1', 'c2' ) as $k ) { if ( in_array( $k, $cx, true ) && ! tcd_es11_marcada( $o, $k ) ) { return true; } }
	return false;
}
add_action( 'woocommerce_order_status_processing', 'tcd_es11_ao_pagar', 20, 2 ); // antes do m14618 (30), que relê a encomenda
add_action( 'woocommerce_order_status_completed', 'tcd_es11_ao_pagar', 20, 2 );
function tcd_es11_ao_pagar( $id, $o = null ) {
	if ( ! is_object( $o ) ) { $o = function_exists( 'wc_get_order' ) ? wc_get_order( $id ) : null; }
	if ( ! $o || $o->get_meta( '_tcd_job_estado' ) ) { return; }
	$ini = tcd_es11_inicio_diferido( $o );
	// Sem terreno (IPR Cloud, Intelligence, visitas, videochamadas): o acesso não passa pelo worker; fica a nota à equipa.
	if ( ! $o->get_meta( '_tcd_geojson' ) ) {
		if ( ! tcd_es11_es( $o ) || ! tcd_es11_particular( $o ) || $o->get_meta( '_tcd_es11_nota' ) ) { return; }
		$falta = array_filter( array_intersect( array( 'c2', 'c3' ), tcd_es11_caixas_itens( tcd_es11_itens( $o ) ) ), function ( $k ) use ( $o ) { return ! tcd_es11_marcada( $o, $k ); } );
		if ( ! $falta ) { return; }
		$o->update_meta_data( '_tcd_es11_nota', time() );
		$o->add_order_note( 'ES-11: particular sem pedido de início imediato. O serviço ou o acesso só deve começar a ' . tcd_es11_data( $ini ) . '. Este módulo não adia o acesso da IPR Cloud nem do Intelligence: confirmar à mão.' );
		if ( function_exists( 'tcd_tg_enviar' ) ) { tcd_tg_enviar( strtoupper( (string) $o->get_billing_country() ?: 'PT' ) . ': encomenda ' . $o->get_order_number() . ' sem início imediato; começar a ' . tcd_es11_data( $ini ) . '.' ); }
		$o->save();
		return;
	}
	if ( ! tcd_es11_diferir( $o ) ) { return; }
	$o->update_meta_data( '_tcd_job_estado', 'diferido' );
	$o->update_meta_data( '_tcd_es11_inicio', $ini );
	$o->add_order_note( 'ES-11: particular sem pedido de início imediato. Entra na fila sozinha a ' . tcd_es11_data( $ini ) . ' às ' . tcd_es11_hora( $ini ) . ', se não desistir antes.' );
	$o->save();
}
add_action( 'init', function () {
	if ( function_exists( 'wp_next_scheduled' ) && ! wp_next_scheduled( 'tcd_es11_cron' ) ) { wp_schedule_event( time() + 300, 'hourly', 'tcd_es11_cron' ); }
} );
add_action( 'tcd_es11_cron', 'tcd_es11_soltar' );
function tcd_es11_soltar() {
	if ( ! function_exists( 'wc_get_orders' ) || ! tcd_es11_ligado() ) { return 0; }
	$ids = wc_get_orders( array( 'limit' => 200, 'orderby' => 'date', 'order' => 'ASC', 'status' => array( 'processing', 'completed' ), 'return' => 'ids',
		'meta_query' => array( array( 'key' => '_tcd_job_estado', 'value' => 'diferido' ), array( 'key' => '_tcd_es11_inicio', 'value' => time(), 'compare' => '<=', 'type' => 'NUMERIC' ) ) ) );
	$n = 0;
	foreach ( $ids as $id ) {
		$o = wc_get_order( $id );
		if ( ! $o || 'diferido' !== $o->get_meta( '_tcd_job_estado' ) || (int) $o->get_meta( '_tcd_es11_inicio' ) > time() || $o->get_meta( '_tcd_es11_desist' ) ) { continue; }
		$o->delete_meta_data( '_tcd_job_estado' ); $o->save();
		if ( function_exists( 'tcd_wk_por_na_fila' ) ) { tcd_wk_por_na_fila( $o, 'Fila: terminou o prazo de desistência (ES-11); a encomenda entrou na fila.' ); $n++; }
	}
	return $n;
}

// 4. Desistência.
function tcd_es11_url_desistir( $o ) { return home_url( tcd_es11_pagina( 'desist', tcd_es11_lg( $o ) ) ) . '?pedido=' . (int) $o->get_id() . '&k=' . rawurlencode( (string) $o->get_order_key() ); }
function tcd_es11_pode_desistir( $o ) {
	if ( ! tcd_es11_es( $o ) || ! tcd_es11_particular( $o ) || $o->get_meta( '_tcd_es11_desist' ) ) { return false; }
	if ( ! in_array( $o->get_status(), array( 'processing', 'completed', 'on-hold' ), true ) ) { return false; }
	if ( time() > tcd_es11_fim_prazo( $o ) ) { return false; }
	$cx = tcd_es11_caixas_itens( tcd_es11_itens( $o ) );
	$job = (string) $o->get_meta( '_tcd_job_estado' );
	// Só Base, com a caixa C.1 marcada e o processamento já começado: o direito perdeu-se (art. 103.m TRLGDCU).
	if ( array( 'c1' ) === $cx && tcd_es11_marcada( $o, 'c1' ) && '' !== $job && 'diferido' !== $job ) { return false; }
	return tcd_es11_tem_itens( $o );
}
add_filter( 'woocommerce_my_account_my_orders_actions', function ( $a, $o ) {
	if ( tcd_es11_pode_desistir( $o ) ) { $a['tcd_desistir'] = array( 'url' => tcd_es11_url_desistir( $o ), 'name' => tcd_es11_t( 'desistir', tcd_es11_lg( $o ) ) ); }
	return $a;
}, 10, 2 );

function tcd_es11_ip_ok() {
	$ip = function_exists( 'tcd_esp_ip' ) ? tcd_esp_ip() : ( $_SERVER['REMOTE_ADDR'] ?? '' ); // phpcs:ignore
	$k = 'tcd_es11_lim_' . md5( (string) $ip ); $n = (int) get_transient( $k );
	if ( $n >= 8 ) { return false; }
	set_transient( $k, $n + 1, HOUR_IN_SECONDS ); return true;
}
function tcd_es11_registar_desistencia( $o, $nome, $email, $motivo, $via ) {
	$t = time();
	$item = array(); foreach ( $o->get_items() as $it ) { $item[] = $it->get_name(); }
	$servico = implode( ', ', $item );
	$lg = tcd_es11_lg( $o );
	$texto = sprintf( tcd_es11_t( 'm_texto', $lg ), $o->get_order_number(), $servico ) . ( '' !== $motivo ? sprintf( tcd_es11_t( 'm_motivo', $lg ), $motivo ) : '' );
	$o->update_meta_data( '_tcd_es11_desist', array( 't' => $t, 'nome' => $nome, 'email' => $email, 'texto' => $texto, 'via' => $via ) );
	if ( 'diferido' === $o->get_meta( '_tcd_job_estado' ) ) { $o->update_meta_data( '_tcd_job_estado', 'desistido' ); }
	$o->add_order_note( 'ES-11: o cliente desistiu do contrato a ' . tcd_es11_data( $t ) . ' às ' . tcd_es11_hora( $t ) . ' (' . $via . '). Texto: «' . $texto . '». Fazer o reembolso em 14 dias (descontar a parte prestada, se houve início pedido).' );
	$o->save();
	$assunto = sprintf( tcd_es11_t( 'm_assunto', $lg ), $o->get_order_number() );
	$corpo = sprintf( tcd_es11_t( 'm_corpo', $lg ),
		$nome, tcd_es11_data( $t ), tcd_es11_hora( $t ), $o->get_order_number(), $servico, $texto );
	// Só para o e-mail da encomenda: o formulário não serve para mandar e-mails a terceiros.
	if ( is_email( (string) $o->get_billing_email() ) ) { wp_mail( (string) $o->get_billing_email(), $assunto, $corpo, array( 'Reply-To: Terracrua Design <info@terracruadesign.pt>' ) ); }
	wp_mail( 'info@terracruadesign.pt', 'Desistência (' . strtoupper( (string) $o->get_billing_country() ?: 'PT' ) . ') · encomenda ' . $o->get_order_number(), "Desistência recebida.\n\n" . $texto . "\n\nTratar o reembolso em 14 dias: " . admin_url( 'post.php?post=' . $o->get_id() . '&action=edit' ) );
	if ( function_exists( 'tcd_tg_enviar' ) ) { tcd_tg_enviar( 'Desistência (' . strtoupper( (string) $o->get_billing_country() ?: 'PT' ) . ') na encomenda ' . $o->get_order_number() . '. Reembolso em 14 dias.' ); }
	return $t;
}
// O envio trata-se antes da página (template_redirect) e redirecciona com o resultado: recarregar não repete nada.
function tcd_es11_dono( $pid, $k ) {
	$o = $pid && function_exists( 'wc_get_order' ) ? wc_get_order( $pid ) : null;
	$ok = $o && ( ( '' !== $k && hash_equals( (string) $o->get_order_key(), $k ) ) || ( is_user_logged_in() && (int) $o->get_customer_id() === get_current_user_id() ) );
	return $ok ? $o : null;
}
function tcd_es11_processar() {
	$pid = isset( $_POST['pedido'] ) ? absint( $_POST['pedido'] ) : 0; // phpcs:ignore WordPress.Security.NonceVerification
	$k   = isset( $_POST['k'] ) ? sanitize_text_field( wp_unslash( $_POST['k'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification
	$o = tcd_es11_dono( $pid, $k ); $dono = (bool) $o;
	if ( ! tcd_es11_ip_ok() ) { return array( 'r' => 'limite' ); }
	$nonce_ok = wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['tcd_es11_n'] ?? '' ) ), 'tcd_es11_desist' ); // phpcs:ignore
	$nome   = sanitize_text_field( wp_unslash( $_POST['nombre'] ?? '' ) ); // phpcs:ignore
	$email  = sanitize_email( wp_unslash( $_POST['email'] ?? '' ) ); // phpcs:ignore
	$motivo = mb_substr( sanitize_textarea_field( wp_unslash( $_POST['motivo'] ?? '' ) ), 0, 1000 ); // phpcs:ignore
	$num    = sanitize_text_field( wp_unslash( $_POST['numero'] ?? '' ) ); // phpcs:ignore
	if ( $nonce_ok && ! $o && '' !== $num && function_exists( 'wc_get_order' ) ) {
		$c = wc_get_order( absint( preg_replace( '/\D/', '', $num ) ) );
		if ( $c && is_email( $email ) && 0 === strcasecmp( (string) $c->get_billing_email(), $email ) ) { $o = $c; }
	}
	if ( $nonce_ok && $o && tcd_es11_pode_desistir( $o ) ) {
		$t = tcd_es11_registar_desistencia( $o, $nome, $email, $motivo, $dono ? 'botão' : 'formulário' );
		return array( 'r' => 'ok', 'n' => $o->get_order_number(), 't' => $t, 'lg' => tcd_es11_lg( $o ) );
	}
	// Sem encomenda identificada, fora do prazo ou com a página antiga em cache (nonce caducado): nada se perde;
	// fica registado com data e hora e a equipa verifica e responde.
	$l = get_option( 'tcd_es11_livres', array() ); $l = is_array( $l ) ? array_slice( $l, -199 ) : array();
	$l[] = array( 't' => time(), 'nome' => $nome, 'email' => $email, 'numero' => $num, 'motivo' => $motivo, 'pedido' => $o ? $o->get_id() : 0, 'nonce' => $nonce_ok ? 1 : 0 );
	update_option( 'tcd_es11_livres', $l, false );
	wp_mail( 'info@terracruadesign.pt', 'Desistência por verificar', "Nome: $nome\nE-mail: $email\nPedido indicado: $num\nMotivo: $motivo\n\nNão foi possível registar automaticamente (encomenda não identificada, fora do prazo ou página antiga). Verificar e responder à pessoa." );
	if ( function_exists( 'tcd_tg_enviar' ) ) { tcd_tg_enviar( 'Desistência por verificar: ' . esc_html( $email ) . ', pedido ' . esc_html( $num ) . '.' ); }
	return array( 'r' => 'verificar' );
}
add_action( 'template_redirect', function () {
	if ( ! tcd_es11_ligado() || 'POST' !== ( $_SERVER['REQUEST_METHOD'] ?? '' ) || ! isset( $_POST['tcd_es11_n'] ) ) { return; } // phpcs:ignore
	$res = tcd_es11_processar();
	$c = wp_generate_password( 16, false, false ); set_transient( 'tcd_es11_res_' . $c, $res, HOUR_IN_SECONDS );
	$lg = isset( $_POST['lg'] ) && in_array( $_POST['lg'], array( 'es', 'pt', 'en' ), true ) ? $_POST['lg'] : 'es'; // phpcs:ignore
	wp_safe_redirect( add_query_arg( 'tcd_es11_r', $c, home_url( tcd_es11_pagina( 'desist', $lg ) ) ) ); exit;
} );
add_shortcode( 'tcd_desistir', 'tcd_es11_ecra' );
function tcd_es11_ecra( $atts = array() ) {
	$lg = is_array( $atts ) && isset( $atts['lg'] ) && in_array( $atts['lg'], array( 'es', 'pt', 'en' ), true ) ? $atts['lg'] : tcd_es11_lg();
	if ( ! defined( 'DONOTCACHEPAGE' ) ) { define( 'DONOTCACHEPAGE', true ); }
	$h = '<div class="tcd-desistir"><h2>' . esc_html( tcd_es11_t( 'e_titulo', $lg ) ) . '</h2>';
	$rc = isset( $_GET['tcd_es11_r'] ) ? preg_replace( '/[^A-Za-z0-9]/', '', (string) $_GET['tcd_es11_r'] ) : ''; // phpcs:ignore
	$res = '' !== $rc ? get_transient( 'tcd_es11_res_' . $rc ) : false;
	if ( is_array( $res ) ) {
		if ( isset( $res['lg'] ) && in_array( $res['lg'], array( 'es', 'pt', 'en' ), true ) ) { $lg = $res['lg']; $h = '<div class="tcd-desistir"><h2>' . esc_html( tcd_es11_t( 'e_titulo', $lg ) ) . '</h2>'; }
		if ( 'ok' === $res['r'] ) { return $h . '<p>' . esc_html( sprintf( tcd_es11_t( 'e_ok', $lg ), $res['n'], tcd_es11_data( $res['t'] ), tcd_es11_hora( $res['t'] ) ) ) . '</p></div>'; }
		if ( 'verificar' === $res['r'] ) { return $h . '<p>' . esc_html( tcd_es11_t( 'e_verificar', $lg ) ) . '</p></div>'; }
		return $h . '<p>' . sprintf( esc_html( tcd_es11_t( 'e_erro', $lg ) ), '<a href="mailto:info@terracruadesign.pt">info@terracruadesign.pt</a>' ) . '</p></div>';
	}
	$pid = isset( $_GET['pedido'] ) ? absint( $_GET['pedido'] ) : 0; // phpcs:ignore WordPress.Security.NonceVerification
	$k   = isset( $_GET['k'] ) ? sanitize_text_field( wp_unslash( $_GET['k'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification
	$o   = tcd_es11_dono( $pid, $k );
	if ( $o && ! ( is_array( $atts ) && isset( $atts['lg'] ) ) ) { $lg = tcd_es11_lg( $o ); }
	if ( $o && ! tcd_es11_pode_desistir( $o ) ) {
		$h .= '<p>' . sprintf( esc_html( tcd_es11_t( 'e_fora', $lg ) ), '<a href="mailto:info@terracruadesign.pt">info@terracruadesign.pt</a>' ) . '</p>';
	}
	$v = function ( $s ) { return esc_attr( (string) $s ); };
	$nome = $o ? trim( $o->get_billing_first_name() . ' ' . $o->get_billing_last_name() ) : '';
	$h .= '<form method="post">';
	$h .= '<p><label>' . esc_html( tcd_es11_t( 'e_nombre', $lg ) ) . '<br><input type="text" name="nombre" required value="' . $v( $nome ) . '"></label></p>';
	$h .= '<p><label>' . esc_html( tcd_es11_t( 'e_pedido', $lg ) ) . '<br><input type="text" name="numero" required value="' . $v( $o ? $o->get_order_number() : '' ) . '"' . ( $o ? ' readonly' : '' ) . '></label>';
	if ( $o ) { $it = array(); foreach ( $o->get_items() as $i ) { $it[] = $i->get_name(); } $h .= '<br><small>' . esc_html( implode( ', ', $it ) ) . '</small>'; }
	$h .= '</p><p><label>' . esc_html( tcd_es11_t( 'e_email', $lg ) ) . '<br><input type="email" name="email" required value="' . $v( $o ? $o->get_billing_email() : '' ) . '"></label></p>';
	$h .= '<p><label>' . esc_html( tcd_es11_t( 'e_motivo', $lg ) ) . '<br><textarea name="motivo" rows="3" maxlength="1000"></textarea></label></p>';
	$h .= '<p>' . esc_html( tcd_es11_t( 'e_aviso', $lg ) ) . '</p><input type="hidden" name="lg" value="' . esc_attr( $lg ) . '">';
	$h .= '<input type="hidden" name="tcd_es11_n" value="' . $v( wp_create_nonce( 'tcd_es11_desist' ) ) . '">';
	if ( $o ) { $h .= '<input type="hidden" name="pedido" value="' . (int) $o->get_id() . '"><input type="hidden" name="k" value="' . $v( $k ) . '">'; }
	$h .= '<p><button type="submit"><strong>' . esc_html( tcd_es11_t( 'e_boton', $lg ) ) . '</strong></button></p></form></div>';
	return $h;
}

// 5. E-mail de confirmação da encomenda (F.1 a F.5), só para particulares.
function tcd_es11_paragrafos( $o ) {
	if ( ! tcd_es11_es( $o ) || ! tcd_es11_particular( $o ) ) { return array(); }
	$cx = tcd_es11_caixas_itens( tcd_es11_itens( $o ) );
	if ( ! tcd_es11_tem_itens( $o ) ) { return array(); }
	$lg = tcd_es11_lg( $o );
	$q = tcd_es11_quando( $o ) ?: tcd_es11_contrato( $o ); $fim = tcd_es11_fim_prazo( $o );
	$p = array();
	if ( in_array( 'c1', $cx, true ) ) {
		$p[] = tcd_es11_marcada( $o, 'c1' ) ? sprintf( tcd_es11_t( 'f1_sim', $lg ), tcd_es11_data( $q ), tcd_es11_hora( $q ) ) : sprintf( tcd_es11_t( 'f1_nao', $lg ), tcd_es11_data( $fim ) );
	}
	if ( in_array( 'c2', $cx, true ) && tcd_es11_marcada( $o, 'c2' ) ) { $p[] = sprintf( tcd_es11_t( 'f3', $lg ), tcd_es11_data( $q ), tcd_es11_hora( $q ), tcd_es11_data( $fim ) ); }
	if ( in_array( 'c3', $cx, true ) && tcd_es11_marcada( $o, 'c3' ) ) { $p[] = sprintf( tcd_es11_t( 'f4', $lg ), tcd_es11_data( $q ), tcd_es11_hora( $q ), tcd_es11_data( $fim ) ); }
	$p[] = tcd_es11_adjuntos()
		? sprintf( tcd_es11_t( 'f5_anexo', $lg ), tcd_es11_url_desistir( $o ) )
		: sprintf( tcd_es11_t( 'f5_link', $lg ), home_url( tcd_es11_pagina( 'termos', $lg ) ), tcd_es11_url_desistir( $o ), home_url( tcd_es11_pagina( 'desist', $lg ) ) );
	return $p;
}
add_action( 'woocommerce_email_order_meta', function ( $o, $admin, $plain, $email = null ) {
	if ( $admin || ! $email || ! in_array( $email->id, array( 'customer_processing_order', 'customer_completed_order' ), true ) ) { return; }
	if ( 'customer_completed_order' === $email->id && 'customer_processing_order' === $o->get_meta( '_tcd_es11_f' ) ) { return; }
	$p = tcd_es11_paragrafos( $o );
	if ( ! $p ) { return; }
	if ( $plain ) { echo "\n" . implode( "\n\n", $p ) . "\n"; } // phpcs:ignore WordPress.Security.EscapeOutput
	else { foreach ( $p as $x ) { echo '<p>' . make_clickable( esc_html( $x ) ) . '</p>'; } } // phpcs:ignore WordPress.Security.EscapeOutput
	$o->update_meta_data( '_tcd_es11_f', $email->id ); $o->save_meta_data();
}, 20, 4 );

// Anexos do e-mail de confirmação (secção F): Términos e formulário em PDF. Caminhos absolutos na opção
// tcd_es11_adjuntos (lista). Sem ficheiros, o F.5 leva ligações em vez de «adjuntos».
function tcd_es11_adjuntos() {
	$l = get_option( 'tcd_es11_adjuntos', array() );
	return array_values( array_filter( is_array( $l ) ? $l : array(), function ( $f ) { return is_string( $f ) && '.pdf' === strtolower( substr( $f, -4 ) ) && file_exists( $f ); } ) );
}
add_filter( 'woocommerce_email_attachments', function ( $a, $id, $o = null ) {
	if ( ! in_array( $id, array( 'customer_processing_order', 'customer_completed_order' ), true ) || ! is_object( $o ) || ! method_exists( $o, 'get_meta' ) ) { return $a; }
	if ( 'customer_completed_order' === $id && 'customer_processing_order' === $o->get_meta( '_tcd_es11_f' ) ) { return $a; }
	if ( ! tcd_es11_paragrafos( $o ) ) { return $a; }
	return array_merge( (array) $a, tcd_es11_adjuntos() );
}, 10, 3 );
