(function(){
'use strict';
if(window.__tcdFlut)return;window.__tcdFlut=1;
var CONHECIDOS=['.tcdsp-b','.tcd-wa','.tcd-vc','.tcd-fm-btn','[class*="tcdfm"]','[class*="tcd-fm"]','[class*="tcdcv"]','[class*="tcd-cv"]','.tcdr2-b','#tcdck-l'];
var ORDEM=['tcdsp','tcd-wa','tcd-vc','fm','cv','tcdr2','tcdck-l'];
var EXCL='#wpadminbar,#tcdck,#tcd-nl,.ipe,.tcdhb-top,.tcdhb,[role=dialog],dialog,.pswp,.mfp-wrap,#tcd-flut-b';
var lista=[],aberto=false,mob=false,atlas=false,b=null,menu=null,agendado=0;
function el(t,c){var e=document.createElement(t);if(c)e.className=c;return e;}
function visivel(e){if(!e.isConnected)return false;var s=getComputedStyle(e);if(s.display==='none'||s.visibility==='hidden'||+s.opacity===0)return false;var r=e.getBoundingClientRect();return r.width>0&&r.height>0;}
function noAtlas(e){return e.id==='tcdfmb'&&!!document.getElementById('ipe');}
function candidato(e){
 if(!e||e.nodeType!==1||e.__tcdF||e.closest(EXCL)||noAtlas(e))return false;
 var s=getComputedStyle(e);if(s.position!=='fixed')return false;
 var r=e.getBoundingClientRect();if(!r.width||!r.height)return false;
 if(r.width>300||r.height>96)return false;
 if(r.top<innerHeight*.5)return false;
 if(e.querySelector('input,textarea,select,iframe'))return false;
 return true;
}
function peso(e){var k=(e.id+' '+(typeof e.className==='string'?e.className:'')).toLowerCase();for(var i=0;i<ORDEM.length;i++){if(k.indexOf(ORDEM[i])>-1)return i;}return ORDEM.length;}
function rotulo(e){var t=(e.getAttribute('aria-label')||e.getAttribute('title')||e.textContent||'').replace(/\s+/g,' ').trim();if(t.length>40)t=t.slice(0,38)+'…';return t||'Opção';}
function adoptar(e){if(e.__tcdF)return;e.__tcdF=1;e.classList.add('tcdflut');lista.push(e);lista.sort(function(a,b){return peso(a)-peso(b);});}
function procurar(){
 CONHECIDOS.forEach(function(q){var n;try{n=document.querySelectorAll(q);}catch(x){return;}for(var i=0;i<n.length;i++){var e=n[i];if(e.__tcdF||e.closest(EXCL)||noAtlas(e))continue;var s=getComputedStyle(e);if(s.position!=='fixed')continue;var r=e.getBoundingClientRect();if(r.width>0&&r.width<=300&&r.height<=96)adoptar(e);}});
 var c=document.body.children;for(var i=0;i<c.length;i++){var e=c[i];if(candidato(e))adoptar(e);var d=e.children;if(d&&d.length<6){for(var j=0;j<d.length;j++){if(candidato(d[j]))adoptar(d[j]);}}}
}
function base(){var bb=20;var ck=document.getElementById('tcdck');if(ck&&!ck.hidden&&visivel(ck)){var r=ck.getBoundingClientRect();if(r.left<innerWidth-120&&r.width>innerWidth*.6)bb=Math.max(bb,innerHeight-r.top+12);}return bb;}
function dispor(){
 agendado=0;
 lista=lista.filter(function(e){if(noAtlas(e)){e.classList.remove('tcdflut','tcdflut-esc');e.__tcdF=0;return false}return true});
 atlas=!!document.getElementById('ipe-mais');
 var vis=lista.filter(function(e){return e.isConnected&&!e.classList.contains('tcdflut-x')&&visivelSemNos(e);});
 var gap=mob?14:20,y=base(),total=0;
 vis.forEach(function(e){total+=e.offsetHeight+gap;});
 var colapsar=atlas||mob||total>innerHeight*.55;
 document.documentElement.classList.toggle('tcdflut-col',colapsar&&!atlas);
 document.documentElement.classList.toggle('tcdflut-atlas',atlas);
 if(atlas){montarMenu(vis);if(b)b.hidden=true;return;}
 if(colapsar){
  if(!b){b=el('button','tcdflut-b');b.id='tcd-flut-b';b.type='button';b.setAttribute('aria-label','Atalhos: assistente, convidar, reportar e outros');b.title='Atalhos';b.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>';b.addEventListener('click',function(ev){ev.stopPropagation();aberto=!aberto;pedir();});document.body.appendChild(b);}
  b.hidden=!vis.length;b.style.setProperty('--fb',y+'px');b.setAttribute('aria-expanded',String(aberto));b.classList.toggle('on',aberto);
  y+=(b.offsetHeight||44)+gap;
 }else if(b){b.hidden=true;aberto=false;}
 vis.forEach(function(e){
  var esc=colapsar&&!aberto;e.classList.toggle('tcdflut-esc',esc);
  e.style.setProperty('--fb',y+'px');
  if(!esc)y+=e.offsetHeight+gap;
 });
}
function visivelSemNos(e){var s=getComputedStyle(e);if(s.display==='none')return false;if(e.hidden)return false;var r=e.getBoundingClientRect();return r.width>0&&r.height>0||e.classList.contains('tcdflut-esc');}
function montarMenu(vis){
 var m=document.querySelector('#ipe-mais .ipe-mais-m');if(!m)return;
 if(!menu){menu=el('div','tcdflut-menu');m.appendChild(el('hr'));m.appendChild(menu);}
 vis.forEach(function(e){e.classList.add('tcdflut-esc');});
 var chave=vis.map(rotulo).join('|');if(menu.__k===chave)return;menu.__k=chave;
 menu.innerHTML='';
 vis.forEach(function(e){var x=el('button','ipe-lk tcdflut-it');x.type='button';x.textContent=rotulo(e);x.addEventListener('click',function(){e.classList.remove('tcdflut-esc');try{e.click();}catch(z){}setTimeout(function(){e.classList.add('tcdflut-esc');},50);});menu.appendChild(x);});
}
function pedir(){if(!agendado){agendado=requestAnimationFrame(dispor);}}
function ciclo(){procurar();pedir();}
document.addEventListener('click',function(ev){if(aberto&&b&&!b.contains(ev.target)&&!ev.target.closest('.tcdflut')){aberto=false;pedir();}else if(aberto&&ev.target.closest('.tcdflut')){setTimeout(function(){aberto=false;pedir();},150);}},true);
function med(){mob=innerWidth<=782;}
med();addEventListener('resize',function(){med();pedir();});
var n=0,t=setInterval(function(){ciclo();if(++n>20)clearInterval(t);},500);
if(window.MutationObserver){new MutationObserver(function(ms){for(var i=0;i<ms.length;i++){if(ms[i].addedNodes.length){ciclo();return;}}}).observe(document.body,{childList:true});}
setInterval(pedir,1500);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ciclo);else ciclo();
addEventListener('load',ciclo);
})();
