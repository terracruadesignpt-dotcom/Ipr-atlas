<?php
// Módulo 90244: Espanha, textos em castelhano (2.ª metade) e aplicação. Quando a língua é «es» (prefixo /es/, cabeçalho
// X-TCD-Lingua ou cookie tcd_lingua; ver m90071), troca os textos portugueses conhecidos pelos castelhanos nas respostas
// REST de tcd/v1 e nos e-mails enviados nesse pedido. Texto não conhecido fica como está (português).
if ( ! defined( 'ABSPATH' ) ) { exit; }

function tcd_esp_textos_b() {
	return array(
		'O terreno desenhado tem menos de 0,05 ha. Confirme o desenho no mapa.' => 'El terreno dibujado tiene menos de 0,05 ha. Revise el dibujo en el mapa.',
		'Não conseguimos ler o limite do terreno. Desenhe-o de novo no mapa.' => 'No hemos podido leer el límite del terreno. Dibújelo de nuevo en el mapa.',
		'O NIF indicado não é válido. Corrija-o ou deixe o campo em branco.' => 'El NIF, NIE o CIF indicado no es válido. Corríjalo o deje el campo en blanco.',
		'Os ficheiros ficam disponíveis quando a equipa terminar a revisão.' => 'Los archivos estarán disponibles cuando el equipo termine la revisión.',
		'Base Cartográfica: dados confirmados, pode avançar com o pagamento' => 'Base Cartográfica: datos confirmados, ya puede realizar el pago',
		'Para definir ou recuperar a palavra-passe: definir palavra-passe.' => 'Para establecer o recuperar la contraseña: establecer contraseña.',
		'Projecto QGIS / QField (abrir no telemóvel ou no computador) · %s' => 'Proyecto QGIS / QField (abrir en el móvil o en el ordenador) · %s',
		'A verificação de cobertura está ocupada; tente daqui a um minuto.' => 'La verificación de cobertura está ocupada; inténtelo dentro de un minuto.',
		'%s de 3 propriedades do vale por usar (Base gratuita até 100 ha).' => '%s de 3 propiedades del vale sin utilizar (Base gratuita hasta 100 ha).',
		'Guardado neste aparelho. Entre na conta para o ter na sua área.' => 'Guardado en este dispositivo. Acceda a su cuenta para tenerlo en su área.',
		'%s partilhou consigo um mapa na Terracrua Design%s, como %s.' => '%s ha compartido con usted un mapa en Terracrua Design%s, con permiso de %s.',
		'Pacote completo (projecto QGIS, PDF, Shapefile, KMZ) · %s' => 'Paquete completo (proyecto QGIS, PDF, Shapefile, KMZ) · %s',
		'Chegou aos 60 projectos. Apague algum para guardar outro.' => 'Ha llegado a los 60 proyectos. Elimine alguno para guardar otro.',
		'WhatsApp / E-mail / LinkedIn / Facebook / Copiar ligação' => 'WhatsApp / Correo electrónico / LinkedIn / Facebook / Copiar enlace',
		'Muitas consultas seguidas. Tente daqui a alguns minutos.' => 'Demasiadas consultas seguidas. Inténtelo dentro de unos minutos.',
		'Recebemos o seu pedido da Base Cartográfica Digital%s.' => 'Hemos recibido su pedido de la Base Cartográfica Digital%s.',
		'Esta encomenda não está à espera de pagamento.' => 'Este pedido no está pendiente de pago.',
		'Esse vale já está aplicado a esta encomenda.' => 'Ese vale ya está aplicado a este pedido.',
		'Escolha o ficheiro com o limite do terreno.' => 'Elija el archivo con el límite del terreno.',
		'Recebemos o seu pedido da Base Cartográfica' => 'Hemos recibido su pedido de la Base Cartográfica',
		'A sua área de cliente Terracrua está activa' => 'Su área de cliente de Terracrua Design ya está activa',
		'As 3 propriedades do vale já estão usadas.' => 'Las 3 propiedades del vale ya están utilizadas.',
		'Relatório da Base Cartográfica (PDF) · %s' => 'Informe de la Base Cartográfica (PDF) · %s',
		'Só o dono do mapa pode retirar convites.' => 'Solo el propietario del mapa puede retirar invitaciones.',
		'Não foi possível guardar. Tente de novo.' => 'No se ha podido guardar. Inténtelo de nuevo.',
		'Esta encomenda não pertence à sua conta.' => 'Este pedido no pertenece a su cuenta.',
		'A área tem de estar entre 0 e 10 000 ha.' => 'La superficie debe estar entre 0 y 10 000 ha.',
		'Demasiadas consultas. Tente mais tarde.' => 'Demasiadas consultas. Inténtelo más tarde.',
		'Envio demasiado rápido. Tente de novo.' => 'Envío demasiado rápido. Inténtelo de nuevo.',
		'Fora do continente: confirmamos à mão.' => 'Fuera de la península: confirmamos la cobertura manualmente.',
		'Bases cartográficas / Entregas e vales' => 'Bases cartográficas / Entregas y vales',
		'Desenhe primeiro o limite do terreno.' => 'Dibuje primero el límite del terreno.',
		'O CDD da DGT não respondeu (HTTP %s).' => 'El servicio de cobertura LiDAR oficial no respondió (HTTP %s).',
		'Demasiados pedidos. Tente mais tarde.' => 'Demasiadas solicitudes. Inténtelo más tarde.',
		'Criámos a sua conta com este e-mail.' => 'Hemos creado su cuenta con este correo electrónico.',
		'GeoPackage (camadas vectoriais) · %s' => 'GeoPackage (capas vectoriales) · %s',
		'Só o dono do mapa o pode partilhar.' => 'Solo el propietario del mapa puede compartirlo.',
		'Esse e-mail já é o dono deste mapa.' => 'Ese correo electrónico ya es el del propietario de este mapa.',
		'Não foi possível aplicar o vale: %s' => 'No se ha podido aplicar el vale: %s',
		'A sua área de cliente está activa' => 'Su área de cliente ya está activa',
		'O seu pedido da Base Cartográfica' => 'Su pedido de la Base Cartográfica',
		'Leitura Territorial · %s (%s ha)' => 'Lectura Territorial · %s (%s ha)',
		'Leitura Territorial (PDF) · %s' => 'Lectura Territorial (PDF) · %s',
		'%s partilhou um mapa consigo' => '%s ha compartido un mapa con usted',
		'Aguarda confirmação de preço' => 'Pendiente de confirmación de precio',
		'Ligação ao CDD indisponível.' => 'El servicio de consulta de cobertura no está disponible.',
		'Guardado em Os meus mapas.' => 'Guardado en Mis mapas.',
		'Indique um e-mail válido.' => 'Indique un correo electrónico válido.',
		'Encomenda não encontrada.' => 'Pedido no encontrado.',
		'Área demasiado detalhada.' => 'El límite tiene demasiados vértices.',
		'Tem um vale da Terracrua?' => '¿Tiene un vale de Terracrua Design?',
		'Referência do pedido: %s' => 'Referencia del pedido: %s',
		'Projecto não encontrado.' => 'Proyecto no encontrado.',
		'para uma área de %s ha' => 'para una superficie de %s ha',
		'Em revisão pela equipa' => 'En revisión por el equipo',
		'Em análise pela equipa' => 'En análisis por el equipo',
		'Ficheiro indisponível.' => 'Archivo no disponible.',
		'A preparar a sua Base' => 'Preparando su Base',
		'%s — preço de cliente' => '%s · precio de cliente',
		'Entre na sua conta.' => 'Acceda a su cuenta.',
		'Abrir a minha área' => 'Abrir mi área',
		'Relatório PDF · %s' => 'Informe PDF · %s',
		'Sobre o seu pedido' => 'Sobre su pedido',
		'Dados confirmados' => 'Datos confirmados',
		'Ligação copiada.' => 'Enlace copiado.',
		'Pagamento falhou' => 'Pago fallido',
		'Área inválida.' => 'Superficie no válida.',
		'Aplicar o vale' => 'Aplicar el vale',
		'Reembolsada' => 'Reembolsado',
		'j de F de Y' => 'j \\d\\e F \\d\\e Y',
		'em produção' => 'en producción',
		'Pagar agora' => 'Pagar ahora',
		'Sem acesso.' => 'Sin acceso.',
		'Em análise' => 'En análisis',
		'Partilhar' => 'Compartir',
		'Cancelada' => 'Cancelado',
		'em espera' => 'en espera',
		'Entregue' => 'Entregado',
		'pendente' => 'pendiente',
		'entregue' => 'entregada',
		'Olá %s,' => 'Hola, %s:',
		'leitor' => 'lector',
		'falhou' => 'fallida',
		'Olá,' => 'Hola:',
	);
}

// ---------- aplicação ----------
function tcd_esp_textos() {
	static $t = null; if ( null !== $t ) { return $t; }
	$t = array_merge( function_exists( 'tcd_esp_textos_a' ) ? tcd_esp_textos_a() : array(), tcd_esp_textos_b() );
	// Espanha em modo «a pedido»: a cobertura confirma-se por e-mail antes do pagamento.
	$t['Fora do continente: confirmamos à mão.'] = 'La cobertura PNOA-LiDAR la confirmamos por correo antes del pago.';
	return $t;
}
function tcd_esp_padroes() {
	static $p = null; if ( null !== $p ) { return $p; }
	$p = array();
	foreach ( tcd_esp_textos() as $pt => $es ) {
		if ( false === strpos( $pt, '%s' ) ) { continue; }
		$n = 0; $rx = '/' . implode( '(.+?)', array_map( function ( $x ) { return preg_quote( $x, '/' ); }, explode( '%s', $pt ) ) ) . '/u';
		$rep = preg_replace_callback( '/%s/', function () use ( &$n ) { $n++; return '${' . $n . '}'; }, $es );
		$p[ $rx ] = $rep;
	}
	return $p;
}
function tcd_esp_traduzir( $s ) {
	if ( ! is_string( $s ) || '' === $s ) { return $s; }
	$t = tcd_esp_textos();
	if ( isset( $t[ $s ] ) ) { return $t[ $s ]; }
	$fixos = array(); foreach ( $t as $pt => $es ) { if ( false === strpos( $pt, '%s' ) && strlen( $pt ) >= 12 ) { $fixos[ $pt ] = $es; } }
	$s = strtr( $s, $fixos );
	foreach ( tcd_esp_padroes() as $rx => $rep ) { $s = preg_replace( $rx, $rep, $s ); }
	return $s;
}
function tcd_esp_lingua_es() { return function_exists( 'tcd_i18n_lingua' ) && 'es' === tcd_i18n_lingua() && function_exists( 'tcd_esp_visivel' ) && tcd_esp_visivel(); }
function tcd_esp_traduzir_dados( $d ) {
	if ( ! is_array( $d ) ) { return $d; }
	foreach ( $d as $k => $v ) {
		if ( is_array( $v ) ) { $d[ $k ] = tcd_esp_traduzir_dados( $v ); }
		elseif ( is_string( $v ) && in_array( (string) $k, array( 'message', 'mensagem', 'nota', 'titulo', 'estado', 'erro', 'rotulo' ), true ) ) { $d[ $k ] = tcd_esp_traduzir( $v ); }
	}
	return $d;
}
add_filter( 'rest_post_dispatch', function ( $res, $srv, $req ) {
	if ( ! ( $res instanceof WP_REST_Response ) || ! ( $req instanceof WP_REST_Request ) || 0 !== strpos( (string) $req->get_route(), '/tcd/v1/' ) || ! tcd_esp_lingua_es() ) { return $res; }
	$res->set_data( tcd_esp_traduzir_dados( $res->get_data() ) );
	return $res;
}, 20, 3 );
add_filter( 'wp_mail', function ( $a ) {
	if ( ! is_array( $a ) || ! tcd_esp_lingua_es() ) { return $a; }
	if ( isset( $a['subject'] ) ) { $a['subject'] = tcd_esp_traduzir( $a['subject'] ); }
	if ( isset( $a['message'] ) && is_string( $a['message'] ) ) { $a['message'] = tcd_esp_traduzir( $a['message'] ); }
	return $a;
}, 20 );
