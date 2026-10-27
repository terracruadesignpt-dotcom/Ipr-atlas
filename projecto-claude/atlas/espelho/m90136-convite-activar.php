<?php
// Módulo 90136: resgate do convite a profissionais no Atlas, /atlas/?convite=PRO-XXXXXX (20/10/2026; par do m90135).
// Mostra, por cima do Atlas, a caixa «Convite da Terracrua Design» com a oferta e um campo de e-mail. Ao confirmar
// (admin-ajax, sem sessão): valida o código (opção tcd_convites: por usar, dentro da validade, e-mail igual ao do convite
// quando o convite tem e-mail), cria a conta se não existir (o WooCommerce envia o e-mail para definir a palavra-passe),
// e liga a oferta: Designer ou Estúdio por 90 dias no registo tcd_cloud_acessos (com a marca do convite e o prazo do preço
// de lançamento, 30 dias depois do fim), Intelligence por 90 dias (ou 12 meses com intel12) em tcd_atlas_intel, Rede IPR
// (meta tcd_rede), e um cupão OFERTA-CV-XXXXXX de Base até 100 ha (699 €) ou até 10 ha (159 €), ligado ao e-mail em
// _tcd_entregue. Responde com a ligação do Atlas já com o vale preenchido. Marca o convidado como «aceitou» e avisa no Telegram.
// Limite 10 tentativas/h por IP. Interruptor: tcd_convites_off = 1. Prefixo tcd_cvr_.
if ( ! defined( 'ABSPATH' ) ) { exit; }

function tcd_cvr_on() { return '1' !== (string) get_option( 'tcd_convites_off', '' ); }
function tcd_cvr_cod( $s ) { $c = strtoupper( preg_replace( '/[^A-Za-z0-9-]/', '', (string) $s ) ); return preg_match( '/^PRO-[A-Z0-9]{6}$/', $c ) ? $c : ''; }
function tcd_cvr_convite( $cod ) { $r = get_option( 'tcd_convites', array() ); return is_array( $r ) && isset( $r[ $cod ] ) && is_array( $r[ $cod ] ) ? $r[ $cod ] : null; }
function tcd_cvr_nomes() { return function_exists( 'tcd_cv_ofertas' ) ? tcd_cv_ofertas() : array(); }

// Caixa por cima do Atlas.
add_filter( 'do_shortcode_tag', function ( $out, $tag ) {
	if ( 'ipr_atlas' !== $tag || ! tcd_cvr_on() || empty( $_GET['convite'] ) ) { return $out; } // phpcs:ignore
	$cod = tcd_cvr_cod( wp_unslash( $_GET['convite'] ) ); // phpcs:ignore
	$c   = $cod ? tcd_cvr_convite( $cod ) : null;
	$es  = $c && function_exists( 'tcd_cv_es' ) && ! empty( $c['pais'] ) ? tcd_cv_es( $c['pais'] ) : ( isset( $_GET['lang'] ) && 'es' === $_GET['lang'] ); // phpcs:ignore
	$css = '<style>.tcvr{max-width:720px;margin:18px auto 10px;padding:18px 20px;border:1px solid #75834a;border-radius:10px;background:#faf8f1;font:15px/1.5 Inter,Helvetica,Arial,sans-serif;color:#2f2f2a}.tcvr h2{font:400 22px/1.25 Raleway,Inter,sans-serif;margin:0 0 8px}.tcvr ul{margin:8px 0 12px 18px;padding:0}.tcvr .k{font:500 11px/1 "IBM Plex Mono",monospace;letter-spacing:.12em;text-transform:uppercase;color:#b8652f}.tcvr input{font:inherit;padding:9px 11px;border:1px solid #cfc9b4;border-radius:6px;width:min(100%,320px)}.tcvr button{font:600 14px Raleway,Inter,sans-serif;background:#75834a;color:#fff;border:0;border-radius:6px;padding:10px 16px;cursor:pointer}.tcvr .r{margin-top:10px;font-size:14px}.tcvr .r.ok{color:#3f4630}.tcvr .r.mau{color:#9a2f1f}.tcvr .a{display:inline-block;margin-top:8px;background:#75834a;color:#fff;padding:9px 14px;border-radius:6px;text-decoration:none}</style>';
	if ( ! $c ) { return $css . '<div class="tcvr"><p class="k">Terracrua Design</p><h2>' . ( $es ? 'Invitación no encontrada' : 'Convite não encontrado' ) . '</h2><p>' . ( $es ? 'El código del enlace no existe. Escríbanos a info@terracruadesign.pt.' : 'O código da ligação não existe. Escreva-nos para info@terracruadesign.pt.' ) . '</p></div>' . $out; }
	if ( ! empty( $c['usado'] ) ) { return $css . '<div class="tcvr"><p class="k">Terracrua Design</p><h2>' . ( $es ? 'Invitación ya activada' : 'Convite já activado' ) . '</h2><p>' . ( $es ? 'Esta invitación ya se usó. Entre en su cuenta o escríbanos a info@terracruadesign.pt.' : 'Este convite já foi usado. Entre na sua conta ou escreva-nos para info@terracruadesign.pt.' ) . '</p></div>' . $out; }
	if ( (int) $c['validade'] < time() ) { return $css . '<div class="tcvr"><p class="k">Terracrua Design</p><h2>' . ( $es ? 'Invitación caducada' : 'Convite caducado' ) . '</h2><p>' . ( $es ? 'Pasaron los 60 días. Escríbanos a info@terracruadesign.pt y lo renovamos.' : 'Passaram os 60 dias. Escreva-nos para info@terracruadesign.pt e renovamos.' ) . '</p></div>' . $out; }
	$n = tcd_cvr_nomes(); $li = '';
	foreach ( (array) $c['ofertas'] as $k ) { if ( isset( $n[ $k ] ) ) { $li .= '<li>' . esc_html( $n[ $k ][ $es ? 2 : 1 ] ) . '</li>'; } }
	$h = $css . '<div class="tcvr" id="tcvr"><p class="k">Terracrua Design</p><h2>' . ( $es ? 'Invitación para ' : 'Convite para ' ) . esc_html( $c['nome'] ) . '</h2><p>' . ( $es ? 'Le ofrecemos, sin coste:' : 'Oferecemos-lhe, sem custo:' ) . '</p><ul>' . $li . '</ul>'
		. '<p>' . ( $es ? 'Confirme su e-mail para activar. Si aún no tiene cuenta, la creamos ahora y recibirá un e-mail para definir la contraseña.' : 'Confirme o seu e-mail para activar. Se ainda não tem conta, criamo-la agora e recebe um e-mail para definir a palavra-passe.' ) . '</p>'
		. '<p><input type="email" id="tcvr-em" placeholder="' . ( $es ? 'su e-mail' : 'o seu e-mail' ) . '" value="' . esc_attr( (string) $c['email'] ) . '" autocomplete="email"> <button type="button" id="tcvr-b">' . ( $es ? 'Activar la invitación' : 'Activar o convite' ) . '</button></p><div class="r" id="tcvr-r"></div></div>'
		. '<script>(function(){var b=document.getElementById("tcvr-b"),r=document.getElementById("tcvr-r");b.addEventListener("click",function(){b.disabled=true;r.className="r";r.textContent="…";var f=new FormData();f.append("action","tcd_cvr_activar");f.append("codigo",' . wp_json_encode( $cod ) . ');f.append("email",document.getElementById("tcvr-em").value);fetch(' . wp_json_encode( admin_url( 'admin-ajax.php' ) ) . ',{method:"POST",body:f,credentials:"same-origin"}).then(function(x){return x.json();}).then(function(j){if(j&&j.success){r.className="r ok";r.innerHTML=j.data.html;}else{r.className="r mau";r.textContent=(j&&j.data)||"Não foi possível activar.";b.disabled=false;}}).catch(function(){r.className="r mau";r.textContent="Sem ligação. Tente de novo.";b.disabled=false;});});})();</script>';
	return $h . $out;
}, 25, 2 );

add_action( 'wp_ajax_nopriv_tcd_cvr_activar', 'tcd_cvr_activar' );
add_action( 'wp_ajax_tcd_cvr_activar', 'tcd_cvr_activar' );
function tcd_cvr_activar() {
	if ( ! tcd_cvr_on() ) { wp_send_json_error( 'Desligado.', 403 ); }
	$ip = function_exists( 'tcd_sn_ip' ) ? (string) tcd_sn_ip() : (string) ( $_SERVER['REMOTE_ADDR'] ?? '0' ); // phpcs:ignore
	$k = 'tcd_cvr_' . md5( $ip ); $n = (int) get_transient( $k ); if ( $n >= 10 ) { wp_send_json_error( 'Demasiadas tentativas. Tente daqui a uma hora.', 429 ); } set_transient( $k, $n + 1, HOUR_IN_SECONDS );
	$cod = tcd_cvr_cod( wp_unslash( $_POST['codigo'] ?? '' ) ); $c = $cod ? tcd_cvr_convite( $cod ) : null;
	$em  = strtolower( sanitize_email( wp_unslash( $_POST['email'] ?? '' ) ) );
	if ( ! $c || ! empty( $c['usado'] ) || (int) $c['validade'] < time() ) { wp_send_json_error( 'Convite inválido, já usado ou caducado.', 400 ); }
	if ( ! is_email( $em ) ) { wp_send_json_error( 'Escreva um e-mail válido.', 400 ); }
	if ( ! empty( $c['email'] ) && strtolower( $c['email'] ) !== $em ) { wp_send_json_error( 'Este convite foi enviado para outro e-mail. Use esse, ou escreva para info@terracruadesign.pt.', 400 ); }
	$es = function_exists( 'tcd_cv_es' ) && ! empty( $c['pais'] ) ? tcd_cv_es( $c['pais'] ) : false;
	$u  = get_user_by( 'email', $em ); $nova = false;
	if ( ! $u && function_exists( 'wc_create_new_customer' ) ) {
		$p = preg_split( '/\s+/', trim( (string) $c['nome'] ), 2 );
		$uid = wc_create_new_customer( $em, '', '', array( 'first_name' => $p[0] ?? '', 'last_name' => $p[1] ?? '' ) );
		if ( is_wp_error( $uid ) ) { wp_send_json_error( 'Não foi possível criar a conta: ' . $uid->get_error_message(), 400 ); }
		$u = get_userdata( (int) $uid ); $nova = true;
	}
	if ( ! $u ) { wp_send_json_error( 'Não foi possível criar a conta.', 400 ); }
	$of = (array) $c['ofertas']; $agora = time(); $fim = $agora + ( in_array( 'designer12', $of, true ) ? 365 : ( in_array( 'org6', $of, true ) ? 180 : 90 ) ) * DAY_IN_SECONDS; $feito = array();
	// Plano por 90 dias, directamente no registo (tcd_cl_prolongar soma sempre um ano).
	$plano = in_array( 'org6', $of, true ) ? 'org' : ( in_array( 'estudio3', $of, true ) ? 'estudio' : ( in_array( 'designer3', $of, true ) || in_array( 'designer12', $of, true ) ? 'designer' : '' ) );
	if ( $plano ) {
		$r = get_option( 'tcd_cloud_acessos', array() ); if ( ! is_array( $r ) ) { $r = array(); }
		$x = isset( $r[ $em ] ) && is_array( $r[ $em ] ) ? $r[ $em ] : array();
		$x[ $plano ] = max( (int) ( $x[ $plano ] ?? 0 ), $fim );
		$x['convite'] = $cod; $x['lancamento_ate'] = $fim + 30 * DAY_IN_SECONDS; // preço de lançamento garantido 30 dias depois do fim
		$r[ $em ] = $x; update_option( 'tcd_cloud_acessos', $r, false );
		$nomes = array( 'designer' => array( 'IPR Cloud Designer até ', 'IPR Cloud Designer hasta ' ), 'estudio' => array( 'IPR Cloud Estúdio até ', 'IPR Cloud Estudio hasta ' ), 'org' => array( 'IPR Cloud Organização até ', 'IPR Cloud Organización hasta ' ) );
		$feito[] = $nomes[ $plano ][ $es ? 1 : 0 ] . date_i18n( 'j/n/Y', $fim );
	}
	if ( function_exists( 'tcd_nv_prolongar' ) && ( $plano || in_array( 'intel12', $of, true ) ) ) {
		tcd_nv_prolongar( $em, in_array( 'intel12', $of, true ) || in_array( 'designer12', $of, true ) || in_array( 'org6', $of, true ) ? 12 * MONTH_IN_SECONDS : 90 * DAY_IN_SECONDS, 'convite ' . $cod );
		$feito[] = 'Atlas Intelligence';
	}
	if ( in_array( 'oficina', $of, true ) ) { update_user_meta( $u->ID, 'tcd_rede', $agora ); $feito[] = $es ? 'Red IPR y Taller' : 'Rede IPR e Oficina'; }
	$vale = '';
	$base = in_array( 'base100', $of, true ) ? 699 : ( in_array( 'base10', $of, true ) ? 159 : 0 );
	if ( $base && class_exists( 'WC_Coupon' ) ) {
		$vale = 'OFERTA-CV-' . strtoupper( substr( str_replace( array( '0', 'O', 'I', '1' ), array( '2', 'A', 'J', '7' ), wp_generate_password( 8, false, false ) ), 0, 6 ) );
		$cp = new WC_Coupon(); $cp->set_code( strtolower( $vale ) ); $cp->set_discount_type( 'fixed_product' ); $cp->set_amount( $base ); $cp->set_individual_use( true );
		$cp->set_product_ids( array( 14471 ) ); $cp->set_usage_limit( 1 ); $cp->set_usage_limit_per_user( 1 ); $cp->set_limit_usage_to_x_items( 1 );
		$cp->set_date_expires( $agora + 180 * DAY_IN_SECONDS ); $cp->set_description( 'Convite a profissional ' . $cod . ' (' . $c['nome'] . '). Base até ' . ( 699 === $base ? '100' : '10' ) . ' ha.' );
		$cp->update_meta_data( '_tcd_entregue', array( 'nome' => (string) $c['nome'], 'email' => $em, 'canal' => 'convite', 'quando' => current_time( 'mysql' ), 'por' => 'm90136 ' . $cod ) );
		$cp->save(); delete_transient( 'tcd_va2_entregues' );
		$feito[] = ( $es ? 'Base Cartográfica hasta ' : 'Base Cartográfica até ' ) . ( 699 === $base ? '100' : '10' ) . ' ha (' . $vale . ')';
	}
	$reg = get_option( 'tcd_convites', array() ); $reg[ $cod ]['usado'] = $agora; $reg[ $cod ]['email_usado'] = $em; $reg[ $cod ]['user'] = (int) $u->ID; update_option( 'tcd_convites', $reg, false );
	if ( ! empty( $c['conv'] ) ) { update_post_meta( (int) $c['conv'], '_cv_estado', 'aceitou' ); update_post_meta( (int) $c['conv'], '_cv_proximo', '' ); $h = get_post_meta( (int) $c['conv'], '_cv_hist', true ); $h = is_array( $h ) ? $h : array(); $h[] = array( 'quando' => current_time( 'mysql' ), 'canal' => 'activou', 'codigo' => $cod, 'email' => $em ); update_post_meta( (int) $c['conv'], '_cv_hist', $h ); }
	if ( function_exists( 'tcd_tg_enviar' ) ) { tcd_tg_enviar( 'Convite ' . $cod . ' activado por ' . esc_html( $c['nome'] ) . ' (' . esc_html( $em ) . '): ' . esc_html( implode( ', ', $feito ) ) . ( $nova ? '. Conta nova.' : '.' ) ); }
	$lig = $vale ? home_url( '/atlas/?modo=encomenda&vale=' . rawurlencode( $vale ) ) : home_url( '/atlas/' );
	$html = '<p><b>' . ( $es ? 'Invitación activada.' : 'Convite activado.' ) . '</b> ' . esc_html( implode( '; ', $feito ) ) . '.</p>'
		. ( $nova ? '<p>' . ( $es ? 'Creamos su cuenta: revise el e-mail para definir la contraseña.' : 'Criámos a sua conta: veja o e-mail para definir a palavra-passe.' ) . '</p>' : '' )
		. ( $vale ? '<p>' . ( $es ? 'Para pedir la Base, dibuje la finca en el Atlas; el vale ya va relleno:' : 'Para pedir a Base, desenhe o terreno no Atlas; o vale já vai preenchido:' ) . '<br><a class="a" href="' . esc_url( $lig ) . '">' . ( $es ? 'Pedir la Base Cartográfica' : 'Pedir a Base Cartográfica' ) . '</a></p>' : '' );
	wp_send_json_success( array( 'html' => $html, 'vale' => $vale ) );
}
