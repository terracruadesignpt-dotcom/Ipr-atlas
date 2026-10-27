<?php
// Módulo 90251: Oficina como estúdio de blocos, parte 2 (página e interface). Pedido do Nuno, 20/10/2026, 18h40.
// Substitui o conteúdo de [tcd_oficina] para quem é Rede IPR; as páginas de entrada (sem sessão, equipa, sem Rede)
// continuam a ser as do m90069. Cada bloco carrega à parte, um de cada vez, pela ordem do ecrã (guarda de carga).
// «Arrumar»: mostrar e esconder blocos, mudar a ordem com setas (telemóvel e teclado) ou a arrastar (rato), quatro tons,
// e «Repor o arranjo de origem». Tudo guardado na conta (m90250, /tcd/v1/oficina/arranjo).
// Pré-visualização para administradores: /oficina/?previa=1. Página antiga: /oficina/?classica=1.
// Interruptor: o mesmo do m90250 (tcd_oficina2_off = 1). Prefixo tcd_ofu_.
if ( ! defined( 'ABSPATH' ) ) { exit; }

add_action( 'init', function () {
	global $shortcode_tags;
	if ( ! function_exists( 'tcd_of_on' ) || empty( $shortcode_tags['tcd_oficina'] ) ) { return; }
	$antiga = $shortcode_tags['tcd_oficina'];
	add_shortcode( 'tcd_oficina', function ( $atts = array(), $c = '', $tag = '' ) use ( $antiga ) {
		$u = wp_get_current_user();
		$previa = ! empty( $_GET['previa'] ) && current_user_can( 'manage_options' ); // phpcs:ignore
		$usa = tcd_of_on() && is_user_logged_in() && empty( $_GET['classica'] ) && ( $previa || tcd_rede_e( $u ) ); // phpcs:ignore
		return $usa ? tcd_ofu_pagina( $u, $previa ) : call_user_func( $antiga, $atts, $c, $tag );
	} );
}, 200 );

function tcd_ofu_pagina( $u, $previa ) {
	$a = tcd_of_arranjo( $u ); $bl = tcd_of_blocos();
	$nome = $u->first_name ? $u->first_name : $u->display_name;
	$tipo = function_exists( 'tcd_tipo_nome' ) ? tcd_tipo_nome( $u->ID ) : '';
	$verif = function_exists( 'tcd_pro_verificado' ) && tcd_pro_verificado( $u->ID );
	$cfg = array( 'rest' => esc_url_raw( rest_url( 'tcd/v1/oficina/' ) ), 'nonce' => wp_create_nonce( 'wp_rest' ), 'arr' => $a, 'nomes' => array_map( function ( $b ) { return $b['t']; }, $bl ) );
	$h = '<style>' . tcd_ofu_css() . '</style><div class="tof" data-tom="' . esc_attr( $a['tom'] ) . '">';
	if ( $previa ) { $h .= '<p class="tof-aviso">Pré-visualização de administrador, com os dados da tua conta. Os profissionais vêem os seus.</p>'; }
	if ( ! empty( $_GET['vale'] ) ) { $h .= '<p class="tof-aviso">Vale aplicado. A sua Base está em produção e aparece em «Os meus mapas» quando estiver pronta.</p>'; } // phpcs:ignore
	$h .= '<header class="tof-top"><div><p class="tof-k">Oficina</p><h1>' . esc_html( $nome ) . '</h1><p class="tof-chip">Rede IPR' . ( $tipo ? ' · ' . esc_html( $tipo ) : '' ) . ( $verif ? ' · verificado' : '' ) . '</p></div>';
	$h .= '<div class="tof-ctl"><button type="button" class="tof-btn s" data-of-arrumar aria-pressed="false">Arrumar</button></div></header>';
	$h .= '<div class="tof-painel" hidden data-of-painel><div><b>Tom</b> <span class="tof-toms">';
	foreach ( array( 'linho' => 'Linho', 'oliva' => 'Oliva', 'terra' => 'Terra', 'noite' => 'Noite' ) as $k => $t ) { $h .= '<button type="button" data-of-tom="' . esc_attr( $k ) . '" class="t-' . esc_attr( $k ) . '">' . esc_html( $t ) . '</button>'; }
	$h .= '</span></div><div><b>Blocos escondidos</b> <span data-of-escondidos></span></div><div><button type="button" class="tof-lnk" data-of-repor>Repor o arranjo de origem</button> <small data-of-msg></small></div></div>';
	if ( function_exists( 'tcd_tipo_form' ) && function_exists( 'tcd_tipo_de' ) && ( '' === tcd_tipo_de( $u->ID ) || ! empty( $_GET['mudar'] ) ) ) { $h .= '<section class="tof-b w"><p class="tof-k">Perfil</p>' . tcd_tipo_form( home_url( '/oficina/' ) ) . '</section>'; } // phpcs:ignore
	$h .= '<div class="tof-g" data-of-grelha>';
	foreach ( $a['ordem'] as $id ) {
		if ( ! isset( $bl[ $id ] ) ) { continue; }
		$h .= tcd_ofu_casca( $id, $bl[ $id ], in_array( $id, $a['ocultos'], true ) );
	}
	$h .= '</div><p class="tof-pe">Para mudar o que aparece aqui, use «Arrumar». Fica guardado na sua conta, em qualquer computador ou telemóvel.</p></div>';
	return $h . '<script>window.TOF=' . wp_json_encode( $cfg, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT ) . ';</script><script>' . tcd_ofu_js() . '</script>';
}
function tcd_ofu_casca( $id, $b, $oculto ) {
	return '<section class="tof-b' . ( 2 === (int) $b['w'] ? ' w' : '' ) . '" data-of-id="' . esc_attr( $id ) . '"' . ( $oculto ? ' hidden' : '' ) . '><div class="tof-bh"><div><p class="tof-k">' . esc_html( $b['k'] ) . '</p><h2>' . esc_html( $b['t'] ) . '</h2></div><span class="tof-ed"><button type="button" data-of-mv="-1" aria-label="Subir">↑</button><button type="button" data-of-mv="1" aria-label="Descer">↓</button><button type="button" data-of-esc aria-label="Esconder">✕</button></span></div><div class="tof-c" data-of-c><p class="tof-vz">A carregar…</p></div></section>';
}

function tcd_ofu_css() {
	return <<<'CSS'
.tof{--bg:#f4f2ea;--p:#fff;--ln:#e3dfcc;--tx:#2f2f2a;--mu:#6b6f5c;--ac:#75834a;--ac2:#3f4630;--te:#b8652f;max-width:1180px;margin:0 auto;padding:26px 16px 60px;font:15px/1.55 Inter,Helvetica,Arial,sans-serif;color:var(--tx);background:var(--bg);border-radius:18px}
.tof[data-tom=oliva]{--bg:#e9ecdc;--ln:#d2d8bb}.tof[data-tom=terra]{--bg:#f3e8dc;--ln:#e5d2bd;--ac:#9a5a2c;--ac2:#6b3b19}
.tof[data-tom=noite]{--bg:#1f231b;--p:#2a2f24;--ln:#3b4232;--tx:#ecebe2;--mu:#a9ad98;--ac:#a7b86e;--ac2:#d6dfb0;--te:#e09a62}
.tof *{box-sizing:border-box}.tof [hidden]{display:none!important}.tof a{color:var(--ac2)}
.tof-k{margin:0;font:600 11px/1 "IBM Plex Mono",monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--ac)}
.tof h1{margin:6px 0 4px;font:300 32px/1.15 Raleway,Helvetica,Arial,sans-serif;color:var(--ac2);text-align:left}
.tof h2{margin:4px 0 0;font:400 18px/1.2 Raleway,Helvetica,Arial,sans-serif;color:var(--ac2);text-align:left}
.tof-top{display:flex;justify-content:space-between;align-items:flex-end;gap:14px;flex-wrap:wrap;margin-bottom:18px}
.tof-chip{display:inline-block;margin:0;padding:3px 10px;border-radius:14px;background:var(--p);border:1px solid var(--ln);font:600 12px Inter,sans-serif;color:var(--ac2)}
.tof-aviso{background:var(--p);border:1px solid var(--ac);border-radius:10px;padding:10px 14px;margin:0 0 14px;font-size:14px}
.tof-painel{display:flex;flex-wrap:wrap;gap:12px 28px;align-items:center;background:var(--p);border:1px dashed var(--ac);border-radius:12px;padding:12px 16px;margin-bottom:16px;font-size:14px}
.tof-toms button,.tof-pill{font:600 12px Inter,sans-serif;border:1px solid var(--ln);border-radius:14px;padding:5px 11px;margin:2px;cursor:pointer;background:#fff;color:#2f2f2a}
.tof-toms .t-oliva{background:#e9ecdc}.tof-toms .t-terra{background:#f3e8dc}.tof-toms .t-noite{background:#1f231b;color:#ecebe2}
.tof-lnk{border:0;background:none;color:var(--te);text-decoration:underline;cursor:pointer;font:inherit;padding:0}
.tof-g{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;align-items:start}
.tof-b{background:var(--p);border:1px solid var(--ln);border-radius:14px;padding:16px 18px;min-width:0}
.tof-b.w{grid-column:span 2}@media(max-width:720px){.tof-b.w{grid-column:auto}.tof-g{grid-template-columns:1fr}}
.tof-bh{display:flex;justify-content:space-between;gap:8px;margin-bottom:10px}
.tof-ed{display:none;gap:4px;align-items:flex-start}.tof.ed .tof-ed{display:flex}.tof.ed .tof-b{outline:2px dashed var(--ln);cursor:grab}.tof.ed .tof-b.drag{opacity:.4}
.tof-ed button{width:32px;height:32px;border:1px solid var(--ln);border-radius:8px;background:var(--bg);color:var(--tx);cursor:pointer;font-size:15px}
.tof-c small,.tof-vz{color:var(--mu);font-size:13px}.tof-vz{margin:4px 0 8px}
.tof-l{list-style:none;margin:0;padding:0}.tof-l li{display:flex;gap:12px;align-items:center;padding:8px 0;border-top:1px solid var(--ln)}.tof-l li:first-child{border-top:0}
.tof-l li>div{flex:1;min-width:0}.tof-l .e{margin-left:auto;font:600 12px Inter,sans-serif;color:var(--ac);white-space:nowrap}.tof-l .e.fr{color:var(--mu)}
.tof-l li.p3{border-left:3px solid var(--te);padding-left:8px}.tof-l li.p2{border-left:3px solid var(--ac);padding-left:8px}
.tof-btn{display:inline-block;padding:8px 15px;border-radius:6px;background:var(--ac);color:#fff!important;text-decoration:none;font:600 13px Inter,sans-serif;margin:10px 8px 0 0;border:1px solid var(--ac);cursor:pointer}
.tof-btn.s{background:transparent;color:var(--ac2)!important}.tof-btn[aria-pressed=true]{background:var(--ac);color:#fff!important}
.tof-bar{height:9px;border-radius:6px;background:var(--ln);overflow:hidden;margin:6px 0}.tof-bar i{display:block;height:100%;background:linear-gradient(90deg,#9fb060,var(--ac))}
.tof-num,.tof-big{margin:0;font:300 26px/1.2 Raleway,sans-serif;color:var(--ac2)}
.tof-passos{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:2px 10px;list-style:none;margin:6px 0;padding:0;font-size:13px;color:var(--mu)}.tof-passos li.ok{color:var(--tx)}.tof-passos li:before{content:"○ "}.tof-passos li.ok:before{content:"● ";color:var(--ac)}
.tof-map{width:100%;height:auto;background:linear-gradient(180deg,#e9ecdc,#f4f2ea);border-radius:10px;border:1px solid var(--ln)}
.tof-map path{fill:rgba(184,101,47,.22);stroke:#b8652f;stroke-width:1.6;vector-effect:non-scaling-stroke}.tof-map circle{fill:#b8652f;stroke:#fff;stroke-width:2}.tof-map a:hover path{fill:rgba(184,101,47,.45)}
.tof-map text{font:600 11px "IBM Plex Mono",monospace;fill:#3f4630;text-anchor:middle;paint-order:stroke;stroke:#fff;stroke-width:3px}
.tof-med{display:grid;grid-template-columns:1fr auto;gap:2px 10px;align-items:center;margin-top:8px;font-size:13px}.tof-med .tof-bar{grid-column:1/-1;margin:0}
.tof-vales{display:flex;gap:6px;margin:4px 0}.tof-vales i{width:34px;height:8px;border-radius:4px;background:var(--ln)}.tof-vales i.u{background:var(--ac)}
.tof-vg{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:6px 0;border-top:1px solid var(--ln)}.tof-vg:first-child{border-top:0}
.tof-sp{width:160px;height:40px}.tof-sp polyline{fill:none;stroke:var(--ac);stroke-width:2}.al{color:var(--te);font-weight:600}
.tof-ads{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}.tof-ad{margin:0}.tof-ad>div{position:relative;display:inline-block;width:49%}.tof-ad img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:8px;display:block}
.tof-ad span{position:absolute;left:6px;bottom:6px;background:rgba(0,0,0,.55);color:#fff;font:600 11px Inter,sans-serif;padding:2px 6px;border-radius:4px}.tof-ad figcaption{font-size:13px;color:var(--mu);margin-top:4px}
.tof-at{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:8px}.tof-at a{display:block;padding:10px 12px;border:1px solid var(--ln);border-radius:10px;text-decoration:none}.tof-at a:hover{border-color:var(--ac)}.tof-at small{display:block}
.tof .tcdo-av,.tof-av{display:inline-flex;align-items:center;justify-content:center;background:var(--bg);color:var(--ac);font:600 12px Inter,sans-serif;width:34px;height:34px;border-radius:50%;object-fit:cover;flex:0 0 34px}
.tof-mem{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:6px 14px}.tof-mem>div{display:flex;gap:8px;align-items:center}.tof-mem em.v{font:600 11px Inter,sans-serif;color:#2a7a2a;font-style:normal}
.tof-url{width:100%;border:1px solid var(--ln);border-radius:6px;padding:7px 9px;font:13px "IBM Plex Mono",monospace;background:var(--bg);color:var(--tx)}
.tof-tp{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}.tof-tpc{border:1px solid var(--ln);border-radius:10px;padding:10px 12px}.tof-tpc small{display:block}
.tof-dias{display:flex;gap:6px;margin-top:6px}.tof-dias span{flex:1;text-align:center;font-size:12px;color:var(--mu)}.tof-dias em{display:block;font:600 11px Inter,sans-serif;font-style:normal;color:var(--tx)}.tof-dias .ch{display:block;width:14px;margin:4px auto 2px;background:#5b8db8;border-radius:3px 3px 0 0}
.tof-rcm{font:700 12px Inter,sans-serif;padding:4px 9px;border-radius:12px;color:#fff;white-space:nowrap}.tof-rcm.r1{background:#4f9a4b}.tof-rcm.r2{background:#c9b52f;color:#2f2f2a}.tof-rcm.r3{background:#e08a2c}.tof-rcm.r4{background:#d0482c}.tof-rcm.r5{background:#7d1f1f}
.tof-pe{margin:18px 0 0;font-size:13px;color:var(--mu)}
@media(max-width:600px){.tof h1{font-size:26px}.tof-at{grid-template-columns:1fr}}
CSS;
}

function tcd_ofu_js() {
	return <<<'JS'
(function(){
var C=window.TOF,R=document.querySelector('.tof'),G=document.querySelector('[data-of-grelha]');if(!C||!R||!G)return;
var A=C.arr,msg=document.querySelector('[data-of-msg]'),fila=[],aCorrer=false;
function api(p,o){o=o||{};o.credentials='same-origin';o.headers={'X-WP-Nonce':C.nonce,'Content-Type':'application/json'};return fetch(C.rest+p,o).then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error(j&&j.message||'Erro');return j;});});}
function carregar(sec){if(sec.dataset.ok)return;sec.dataset.ok=1;fila.push(sec);if(!aCorrer)prox();}
function prox(){var s=fila.shift();if(!s){aCorrer=false;return;}aCorrer=true;var c=s.querySelector('[data-of-c]');
 api('bloco/'+s.dataset.ofId).then(function(j){c.innerHTML=j.html||'<p class="tof-vz">Sem conteúdo.</p>';}).catch(function(){c.innerHTML='<p class="tof-vz">Não carregou. Volte a abrir a página.</p>';delete s.dataset.ok;}).then(prox);}
function secs(){return [].slice.call(G.querySelectorAll('[data-of-id]'));}
secs().forEach(function(s){if(!s.hidden)carregar(s);});
var t=null;function guardar(){clearTimeout(t);t=setTimeout(function(){A.ordem=secs().map(function(s){return s.dataset.ofId;});A.ocultos=secs().filter(function(s){return s.hidden;}).map(function(s){return s.dataset.ofId;});
 if(msg)msg.textContent='A guardar…';api('arranjo',{method:'POST',body:JSON.stringify({ordem:A.ordem,ocultos:A.ocultos,tom:A.tom})}).then(function(){if(msg)msg.textContent='Guardado.';}).catch(function(e){if(msg)msg.textContent=e.message;});},400);}
function escondidos(){var el=document.querySelector('[data-of-escondidos]');if(!el)return;el.innerHTML='';var l=secs().filter(function(s){return s.hidden;});
 if(!l.length){el.textContent='nenhum';return;}l.forEach(function(s){var b=document.createElement('button');b.type='button';b.className='tof-pill';b.textContent='+ '+(C.nomes[s.dataset.ofId]||s.dataset.ofId);b.onclick=function(){s.hidden=false;G.prepend(s);carregar(s);escondidos();guardar();s.scrollIntoView({behavior:'smooth',block:'center'});};el.appendChild(b);});}
var bA=document.querySelector('[data-of-arrumar]'),P=document.querySelector('[data-of-painel]'),fino=window.matchMedia&&matchMedia('(pointer:fine)').matches;
bA.onclick=function(){var on=!R.classList.contains('ed');R.classList.toggle('ed',on);P.hidden=!on;bA.setAttribute('aria-pressed',on);bA.textContent=on?'Concluído':'Arrumar';secs().forEach(function(s){s.draggable=on&&fino;});escondidos();};
G.addEventListener('click',function(e){var b=e.target.closest('button');if(!b||!R.classList.contains('ed'))return;var s=b.closest('[data-of-id]');if(!s)return;
 if(b.hasAttribute('data-of-esc')){s.hidden=true;escondidos();guardar();return;}
 if(b.dataset.ofMv){var v=secs().filter(function(x){return !x.hidden;}),i=v.indexOf(s),j=i+(+b.dataset.ofMv);if(j<0||j>=v.length)return;if(+b.dataset.ofMv<0)G.insertBefore(s,v[j]);else G.insertBefore(s,v[j].nextSibling);b.focus();guardar();}});
var arr=null;G.addEventListener('dragstart',function(e){arr=e.target.closest('[data-of-id]');if(arr){arr.classList.add('drag');e.dataTransfer.effectAllowed='move';}});
G.addEventListener('dragend',function(){if(arr){arr.classList.remove('drag');arr=null;guardar();}});
G.addEventListener('dragover',function(e){if(!arr)return;e.preventDefault();var s=e.target.closest('[data-of-id]');if(!s||s===arr)return;var r=s.getBoundingClientRect(),dep=(e.clientY-r.top)>r.height/2||(e.clientX-r.left)>r.width*0.66;G.insertBefore(arr,dep?s.nextSibling:s);});
[].forEach.call(document.querySelectorAll('[data-of-tom]'),function(b){b.onclick=function(){A.tom=b.dataset.ofTom;R.dataset.tom=A.tom;guardar();};});
var rp=document.querySelector('[data-of-repor]');if(rp)rp.onclick=function(){if(!confirm('Voltar ao arranjo de origem? Perde a ordem e os tons que escolheu.'))return;api('arranjo',{method:'POST',body:JSON.stringify({repor:1})}).then(function(){location.reload();});};
})();
JS;
}
