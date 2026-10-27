<?php
// Módulo 90123: aviso de cookies e consentimento (pedido do Nuno, 20/10/2026).
// Liga à WP Consent API (já instalada) e ao modo de consentimento do Site Kit (já activo para a Europa):
// sem escolha, o Google Analytics e o Google Ads ficam em "negado"; ao aceitar, o Site Kit actualiza o consentimento.
// Três escolhas iguais em peso (Aceitar, Recusar, Escolher), como pede o RGPD. A escolha fica 6 meses no cookie tcd_ck.
// Para reabrir o aviso: link "Cookies" no canto inferior esquerdo, shortcode [tcd_cookies] ou window.tcdCookies().
// v2, 21/10/2026 (ES-12): em /es (tcd_esp_lingua_es, m90244) os textos saem em castelhano e a ligação vai para
// /es/cookies/. O comportamento e o cookie tcd_ck são os mesmos nas duas línguas.
function tcd_ck_t( $k ) {
	$es = function_exists( 'tcd_esp_lingua_es' ) && tcd_esp_lingua_es();
	$t = array(
		'pref'    => array( 'Preferências de cookies', 'Preferencias de cookies' ),
		'titulo'  => array( 'Este site usa cookies', 'Este sitio usa cookies' ),
		'texto'   => array( 'Os cookies necessários fazem o site funcionar (sessão, carrinho, segurança). Com a sua autorização usamos também cookies de estatística, para perceber como o site é usado, e de marketing, para medir campanhas. Pode mudar de ideias a qualquer momento.', 'Las cookies necesarias hacen funcionar el sitio (sesión, carrito, seguridad). Con su autorización usamos también cookies de estadística, para entender cómo se usa el sitio, y de marketing, para medir campañas. Puede cambiar de opinión en cualquier momento.' ),
		'pol'     => array( 'Política de privacidade', 'Política de cookies' ),
		'nec'     => array( 'Necessários', 'Necesarias' ),
		'est'     => array( 'Estatística', 'Estadística' ),
		'mkt'     => array( 'Marketing', 'Marketing' ),
		'nao'     => array( 'Recusar', 'Rechazar' ),
		'esc'     => array( 'Escolher', 'Elegir' ),
		'guardar' => array( 'Guardar escolha', 'Guardar elección' ),
		'sim'     => array( 'Aceitar', 'Aceptar' ),
		'link'    => array( 'Cookies', 'Cookies' ),
	);
	return $t[ $k ][ $es ? 1 : 0 ];
}
function tcd_ck_politica() {
	if ( function_exists( 'tcd_esp_lingua_es' ) && tcd_esp_lingua_es() ) { return home_url( '/es/cookies/' ); }
	return function_exists( 'get_privacy_policy_url' ) ? get_privacy_policy_url() : '';
}
if ( ! defined( 'ABSPATH' ) ) { exit; }

// O site exige consentimento prévio (opt-in) para estatística e marketing.
add_filter( 'wp_get_consent_type', function () { return 'optin'; } );

add_shortcode( 'tcd_cookies', function () {
	return '<a href="#" onclick="window.tcdCookies&&window.tcdCookies();return false;">' . esc_html( tcd_ck_t( 'pref' ) ) . '</a>';
} );

add_action( 'wp_footer', function () {
	if ( is_admin() || wp_doing_ajax() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) { return; }
	$pol = tcd_ck_politica();
	?>
<div id="tcdck" role="dialog" aria-live="polite" aria-label="<?php echo esc_attr( tcd_ck_t( 'link' ) ); ?>" hidden>
	<div class="tcdck-c">
		<p class="tcdck-t"><?php echo esc_html( tcd_ck_t( 'titulo' ) ); ?></p>
		<p><?php echo esc_html( tcd_ck_t( 'texto' ) ); if ( $pol ) { echo ' <a href="' . esc_url( $pol ) . '">' . esc_html( tcd_ck_t( 'pol' ) ) . '</a>.'; } ?></p>
		<div class="tcdck-op" hidden>
			<label><input type="checkbox" checked disabled> <?php echo esc_html( tcd_ck_t( 'nec' ) ); ?></label>
			<label><input type="checkbox" id="tcdck-est"> <?php echo esc_html( tcd_ck_t( 'est' ) ); ?></label>
			<label><input type="checkbox" id="tcdck-mkt"> <?php echo esc_html( tcd_ck_t( 'mkt' ) ); ?></label>
		</div>
		<div class="tcdck-b">
			<button type="button" data-a="nao"><?php echo esc_html( tcd_ck_t( 'nao' ) ); ?></button>
			<button type="button" data-a="escolher"><?php echo esc_html( tcd_ck_t( 'esc' ) ); ?></button>
			<button type="button" data-a="sim"><?php echo esc_html( tcd_ck_t( 'sim' ) ); ?></button>
		</div>
	</div>
</div>
<a href="#" id="tcdck-l" hidden><?php echo esc_html( tcd_ck_t( 'link' ) ); ?></a>
<style>
#tcdck{position:fixed;left:16px;right:16px;bottom:16px;z-index:999998;display:flex;justify-content:flex-start;pointer-events:none}
#tcdck[hidden],#tcdck-l[hidden],#tcdck .tcdck-op[hidden]{display:none}
#tcdck .tcdck-c{pointer-events:auto;max-width:440px;background:#fbfaf6;color:#2f2f2a;border:1px solid #e3dfcc;border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,.12);padding:16px 18px;font:14px/1.5 Inter,Helvetica,Arial,sans-serif}
#tcdck p{margin:0 0 10px}#tcdck .tcdck-t{font-weight:600;color:#3f4630;margin-bottom:4px}
#tcdck a{color:#3f4630;text-decoration:underline}
#tcdck .tcdck-op{display:flex;flex-wrap:wrap;gap:6px 16px;margin:0 0 12px}
#tcdck .tcdck-op label{display:flex;gap:6px;align-items:center;cursor:pointer}
#tcdck .tcdck-b{display:flex;gap:8px;flex-wrap:wrap}
#tcdck button{flex:1 1 0;min-width:90px;padding:8px 12px;border:1px solid #3f4630;border-radius:6px;background:#fff;color:#3f4630;font:600 14px Inter,Helvetica,Arial,sans-serif;cursor:pointer}
#tcdck button[data-a="sim"]{background:#3f4630;color:#fff}
#tcdck-l{position:fixed;left:10px;bottom:10px;z-index:999997;font:12px Inter,Helvetica,Arial,sans-serif;color:#6b6b60;background:rgba(251,250,246,.9);border:1px solid #e3dfcc;border-radius:12px;padding:2px 9px;text-decoration:none}
@media print{#tcdck,#tcdck-l{display:none!important}}
</style>
<script>
(function(){
	var C='tcd_ck',b=document.getElementById('tcdck'),l=document.getElementById('tcdck-l'),TG=<?php echo wp_json_encode( tcd_ck_t( 'guardar' ) ); ?>,TE=<?php echo wp_json_encode( tcd_ck_t( 'esc' ) ); ?>;
	if(!b)return;
	var op=b.querySelector('.tcdck-op'),est=document.getElementById('tcdck-est'),mkt=document.getElementById('tcdck-mkt');
	function ler(){var m=document.cookie.match(/(?:^|; )tcd_ck=([^;]*)/);return m?decodeURIComponent(m[1]):'';}
	function aplicar(e,k){
		var s=function(c,v){try{if(typeof window.wp_set_consent==='function'){window.wp_set_consent(c,v?'allow':'deny');}}catch(x){}};
		s('functional',1);s('preferences',1);s('statistics',e);s('statistics-anonymous',e);s('marketing',k);
		try{if(typeof window.gtag==='function'){window.gtag('consent','update',{analytics_storage:e?'granted':'denied',ad_storage:k?'granted':'denied',ad_user_data:k?'granted':'denied',ad_personalization:k?'granted':'denied'});}}catch(x){}
	}
	function guardar(e,k){
		var d=new Date();d.setTime(d.getTime()+182*864e5);
		document.cookie=C+'='+encodeURIComponent('v1:'+(e?1:0)+(k?1:0))+';expires='+d.toUTCString()+';path=/;SameSite=Lax'+(location.protocol==='https:'?';Secure':'');
		aplicar(e,k);b.hidden=true;l.hidden=false;
	}
	function abrir(){var v=ler();est.checked=v.charAt(3)==='1';mkt.checked=v.charAt(4)==='1';op.hidden=!v;b.querySelector('[data-a="escolher"]').textContent=v?TG:TE;b.hidden=false;l.hidden=true;}
	window.tcdCookies=abrir;
	b.addEventListener('click',function(ev){
		var a=ev.target&&ev.target.getAttribute('data-a');if(!a)return;
		if(a==='sim'){guardar(1,1);}
		else if(a==='nao'){guardar(0,0);}
		else if(op.hidden){op.hidden=false;ev.target.textContent=TG;}
		else{guardar(est.checked,mkt.checked);ev.target.textContent=TE;}
	});
	l.addEventListener('click',function(ev){ev.preventDefault();abrir();});
	var v=ler();
	if(v.indexOf('v1:')===0){aplicar(v.charAt(3)==='1',v.charAt(4)==='1');l.hidden=false;}else{b.hidden=false;}
})();
</script>
	<?php
}, 5 );
