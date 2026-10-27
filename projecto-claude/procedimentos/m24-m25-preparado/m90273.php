<?php
// Módulo 90273: Azenhas e Castelos, fase 1, vista na área da equipa (/area-equipa/?v=azenhas). Par do m90271 e do m90272.
// Lista dos imóveis com os seus negócios e artigos; página do negócio com pessoas, passos, documentos, avisos, lista da
// escritura e partilha. Pensada para o iPad (botões grandes, letra de 16 px nos campos). Cores --tcdp-* do m90058.
// Em inglês para quem está na opção tcd_ass_en (tcd_acn_en no m90272; rótulos também lá). Embrulha o [tcd_equipa] no init 146.
// Interruptor: tcd_ac_off = 1. Prefixo tcd_acn_.
if ( ! defined( 'ABSPATH' ) ) { exit; }


add_action( 'init', function () {
	$ant = shortcode_exists( 'tcd_equipa' ) ? $GLOBALS['shortcode_tags']['tcd_equipa'] : null; if ( ! $ant ) { return; }
	add_shortcode( 'tcd_equipa', function ( $atts = array(), $content = '' ) use ( $ant ) {
		$v = isset( $_GET['v'] ) && is_string( $_GET['v'] ) ? sanitize_key( wp_unslash( $_GET['v'] ) ) : ''; // phpcs:ignore
		if ( 'azenhas' !== $v || ! function_exists( 'tcd_acn_pode' ) || ! function_exists( 'tcd_acn_en' ) || ! tcd_acn_on() ) { return call_user_func( $ant, $atts, $content ); }
		if ( ! tcd_acn_pode() ) { return '<p style="margin:40px;text-align:center">' . ( tcd_acn_en() ? 'No access.' : 'Sem acesso.' ) . '</p>'; }
		return tcd_acn_vista();
	} );
}, 146 );

function tcd_acn_vista() {
	$eq = array();
	foreach ( function_exists( 'tcd_pg_pessoas' ) ? tcd_pg_pessoas() : array() as $u ) { if ( tcd_acn_pode( $u ) ) { $eq[] = array( 'id' => $u->ID, 'n' => $u->display_name ); } }
	$cfg = array( 'r' => esc_url_raw( rest_url( 'tcd/v1/azenhas' ) ), 'nonce' => wp_create_nonce( 'wp_rest' ), 'en' => tcd_acn_en(), 'eq' => $eq, 'eu' => get_current_user_id() );
	$css = '.tcac{max-width:980px;margin:0 auto;padding:16px;color:var(--tcdp-tx,#2b2f22);font-size:16px}.tcac h2{font-weight:300;margin:6px 0 14px}.tcac h3{font:600 12px/1.2 var(--tcdp-mono,monospace);letter-spacing:.08em;text-transform:uppercase;color:var(--tcdp-mu,#5d6150);margin:22px 0 8px}'
		. '.tcac .c{background:var(--tcdp-p2,#fff);border:1px solid var(--tcdp-ln,#ddd7c6);border-radius:12px;padding:14px;margin:0 0 12px;box-shadow:var(--tcdp-sh,none)}'
		. '.tcac button,.tcac .b{min-height:44px;padding:8px 14px;border-radius:8px;border:1px solid var(--tcdp-ln2,#c9c1aa);background:var(--tcdp-p1,#f8f6ef);color:inherit;font-size:15px;cursor:pointer}.tcac .p{background:var(--tcdp-ac,#b8652f);border-color:var(--tcdp-ac,#b8652f);color:#fff}'
		. '.tcac input,.tcac select,.tcac textarea{font-size:16px;min-height:44px;padding:6px 8px;border:1px solid var(--tcdp-ln,#ddd7c6);border-radius:8px;background:var(--tcdp-p1,#f8f6ef);width:100%;box-sizing:border-box}'
		. '.tcac .ng{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:10px 0;border-top:1px solid var(--tcdp-ar,#e9e5d6);cursor:pointer}.tcac .ch{font:12px var(--tcdp-mono,monospace);padding:3px 8px;border-radius:20px;background:var(--tcdp-acs,#f3e6dc)}'
		. '.tcac .g{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;align-items:end;margin:0 0 8px}.tcac .m{color:var(--tcdp-mu2,#737761);font-size:14px}.tcac .ko{color:var(--tcdp-ko,#b6432e)}.tcac label{display:block;font-size:13px;color:var(--tcdp-mu,#5d6150)}';
	return '<style>' . $css . '</style><div class="tcac" id="tcac"></div><script>window.TCAC=' . wp_json_encode( $cfg, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT ) . ';</script><script>' . str_replace( '/*ROTULOS*/', function_exists( 'tcd_acn_rotulos_js' ) ? tcd_acn_rotulos_js() : '', tcd_acn_js() ) . '</script>';
}

function tcd_acn_js() {
	return <<<'JS'
(function(){var C=window.TCAC,R=document.getElementById('tcac'),E=C.en,L=[],N=null;
/*ROTULOS*/
function t(k){return W[k][E?1:0];}function l(o,k){return o[k]?o[k][E?1:0]:k;}
function e(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function api(c,b){var o={credentials:'same-origin',headers:{'X-WP-Nonce':C.nonce}};if(b){o.method='POST';o.headers['Content-Type']='application/json';o.body=JSON.stringify(b);}return fetch(C.r+c,o).then(function(r){return r.json();});}
function sel(n,o,v){return '<select name="'+n+'">'+Object.keys(o).map(function(k){return '<option value="'+e(k)+'"'+(k===v?' selected':'')+'>'+e(l(o,k))+'</option>';}).join('')+'</select>';}
function inp(n,v,ty){return '<input name="'+n+'" type="'+(ty||'text')+'" value="'+e(v)+'">';}
function tab(id,cols,rows){return '<div data-tab="'+id+'">'+rows.concat([{}]).map(function(r){return '<div class="g" data-row>'+cols.map(function(c){var v=r[c[0]]==null?'':r[c[0]];return '<label>'+e(c[1])+(c[2]==='s'?sel(c[0],c[3],v):c[2]==='c'?'<input name="'+c[0]+'" type="checkbox"'+(v?' checked':'')+' style="width:auto">':inp(c[0],v,c[2]))+'</label>';}).join('')+'</div>';}).join('')+'</div>';}
function ler(id){return [].map.call(R.querySelectorAll('[data-tab="'+id+'"] [data-row]'),function(r){var o={};[].forEach.call(r.querySelectorAll('input,select'),function(i){o[i.name]=i.type==='checkbox'?i.checked:i.value;});return o;});}
function aviso(alvo,lista){return '<h3>'+t('av')+'</h3>'+(lista||[]).map(function(a,i){return a.fechado?'':'<div class="ng"><span>'+e(a.texto)+(a.ate?' <span class="m">· '+e(a.ate)+'</span>':'')+'</span><button data-fa="'+e(alvo)+'" data-i="'+i+'">'+t('fe')+'</button></div>';}).join('')+'<div class="g" data-av="'+e(alvo)+'"><label>'+t('av')+inp('texto','')+'</label><label>→<select name="para"><option value="0">'+t('to')+'</option>'+C.eq.map(function(u){return '<option value="'+u.id+'">'+e(u.n)+'</option>';}).join('')+'</select></label><label>'+(E?'Until':'Até')+inp('ate','','date')+'</label><button class="p" data-nav="'+e(alvo)+'">+</button></div>';}
function lista(){api('').then(function(j){L=j.imoveis||[];N=null;var h='<h2>'+t('t')+'</h2>';L.forEach(function(m){h+='<div class="c"><b>'+e(m.nome)+'</b> <span class="ch">'+e(m.estado)+'</span>'+(m.negocios.length?m.negocios.map(function(n){return '<div class="ng" data-n="'+n.id+'"><span>'+e(n.comprador||'·')+'</span><span>'+(n.valor?e(Number(n.valor).toLocaleString('pt-PT'))+' € ':'')+'<span class="ch">'+e(l(F,n.fase))+'</span></span></div>';}).join(''):'<p class="m">'+t('sm')+'</p>')+'<p><button data-novo="'+m.id+'">'+t('nv')+'</button></p><details><summary class="m">'+t('ar')+' ('+m.artigos.length+')</summary>'+tab('ar'+m.id,[['tipo','',  's',A],['artigo','Art.'],['seccao',E?'Section':'Secção'],['freguesia',E?'Parish':'Freguesia'],['a_cad',E?'Area (tax)':'Área caderneta'],['a_reg',E?'Area (registry)':'Área registo'],['a_bupi','BUPi'],['fonte',E?'Source':'Fonte'],['data',E?'Date':'Data','date']],m.artigos)+'<button class="p" data-sa="'+m.id+'">'+t('sv')+'</button></details>'+aviso('im:'+m.id,m.avisos)+'</div>';});R.innerHTML=h;});}
function abrir(id){api('/negocio/'+id).then(function(j){if(!j.ok)return;N=j.negocio;var n=N,h='<p><button data-volta>'+t('vt')+'</button></p><h2>'+e(n.comprador||t('cp'))+'</h2><div class="c" data-cab><div class="g"><label>'+t('cp')+inp('comprador',n.comprador)+'</label><label>'+t('fa')+sel('fase',F,n.fase)+'</label><label>'+t('va')+inp('valor',n.valor,'number')+'</label><label>'+t('cv')+inp('cpcv',n.cpcv,'date')+'</label><label>'+t('es')+inp('escritura',n.escritura,'date')+'</label></div>';
h+='<h3>'+t('pe')+'</h3>'+tab('pessoas',[['papel','','s',P],['nome',E?'Name':'Nome'],['contacto',E?'Contact':'Contacto']],n.pessoas);
h+='<h3>'+t('pa')+'</h3>'+tab('passos',[['t',E?'Step':'Passo'],['resp',E?'Who':'Responsável'],['prazo',E?'Due':'Prazo','date'],['feito','✓','c']],n.passos);
var hoje=new Date().toISOString().slice(0,10);h+='<h3>'+t('dc')+'</h3>'+tab('docs',[['tipo','','s',D],['nome',E?'Name':'Nome'],['emitido',E?'Issued':'Emitido','date'],['validade',E?'Valid until':'Válido até','date'],['nota',E?'Note':'Nota']],n.docs)+n.docs.filter(function(d){return d.validade&&d.validade<hoje;}).map(function(d){return '<p class="ko">'+e(l(D,d.tipo))+': '+t('cad')+' ('+e(d.validade)+')</p>';}).join('');
if(n.escritura){h+='<h3>'+t('li')+'</h3><p class="m">'+t('lb')+'</p><div data-li>'+Object.keys(n.lista).map(function(k){return '<label style="font-size:16px;margin:8px 0"><input type="checkbox" name="'+e(k)+'" style="width:auto;min-height:0"'+(n.lista[k]?' checked':'')+'> '+e(l(K,k))+'</label>';}).join('')+'</div>';}
h+='<p><button class="p" data-sn>'+t('sv')+'</button> <span class="m" data-msg></span></p></div><div class="c">'+aviso('ng:'+n.id,n.avisos)+'</div><div class="c"><h3>'+t('sh')+'</h3><div class="g" data-sh><label>E-mail'+inp('email','','email')+'</label><label>'+(E?'Days':'Dias')+inp('dias','30','number')+'</label><label><input type="checkbox" name="enviar" style="width:auto"> '+t('en')+'</label><button class="p" data-psh>→</button></div><p class="m" data-shm></p>'+n.partilhas.map(function(p){return '<p class="m">'+e(p.quem)+' · '+e(p.em)+'</p>';}).join('')+'</div>';R.innerHTML=h;window.scrollTo(0,0);});}
function cab(){var o={id:N.id};[].forEach.call(R.querySelectorAll('[data-cab]>.g input,[data-cab]>.g select'),function(i){o[i.name]=i.value;});['pessoas','passos','docs'].forEach(function(k){o[k]=ler(k);});var li=R.querySelector('[data-li]');if(li){o.lista={};[].forEach.call(li.querySelectorAll('input'),function(i){o.lista[i.name]=i.checked;});}return o;}
R.addEventListener('click',function(ev){var b=ev.target.closest('button,[data-n]');if(!b)return;var d=b.dataset;
if(d.n)abrir(d.n);else if(d.volta!=null)lista();
else if(d.novo){var c=prompt(t('cp'));if(c!==null)api('/negocio',{imovel:+d.novo,comprador:c}).then(function(j){if(j.ok)abrir(j.negocio.id);});}
else if(d.sn!=null)api('/negocio',cab()).then(function(j){var m=R.querySelector('[data-msg]');if(j.ok){abrir(N.id);}else if(m)m.textContent=j.message||'';});
else if(d.sa)api('/imovel',{id:+d.sa,artigos:ler('ar'+d.sa)}).then(lista);
else if(d.nav){var g=b.parentNode,o={alvo:d.nav};[].forEach.call(g.querySelectorAll('input,select'),function(i){o[i.name]=i.value;});api('/aviso',o).then(function(){N?abrir(N.id):lista();});}
else if(d.fa)api('/aviso',{alvo:d.fa,fechar:+d.i}).then(function(){N?abrir(N.id):lista();});
else if(d.psh!=null){var s=R.querySelector('[data-sh]');api('/partilha',{negocio:N.id,email:s.querySelector('[name=email]').value,dias:+s.querySelector('[name=dias]').value,enviar:s.querySelector('[name=enviar]').checked}).then(function(j){var m=R.querySelector('[data-shm]');m.textContent=j.ok?t('ln')+': '+j.url:(j.message||'');});}});
lista();})();
JS;
}
