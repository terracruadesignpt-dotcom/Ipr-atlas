(function(){
'use strict';
function rgba(c){var m=/rgba?\(([^)]+)\)/.exec(c||'');if(!m)return null;var p=m[1].split(/[ ,\/]+/).filter(Boolean).map(parseFloat);return{r:p[0],g:p[1],b:p[2],a:p.length>3?p[3]:1};}
function L(c){function f(v){v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);}return .2126*f(c.r)+.7152*f(c.g)+.0722*f(c.b);}
function fundo(e){for(var n=e;n&&n.nodeType===1;n=n.parentElement){var s=getComputedStyle(n);if(s.backgroundImage&&s.backgroundImage!=='none'&&!/gradient/.test(s.backgroundImage))return null;var c=rgba(s.backgroundColor);if(c&&c.a>=.6)return c;}return{r:255,g:255,b:255,a:1};}
function proprioTexto(e){for(var n=e.firstChild;n;n=n.nextSibling){if(n.nodeType===3&&n.nodeValue.trim())return true;}return false;}
function passar(){
 var raiz=document.querySelector('main,#content,.site-content,.entry-content')||document.body;
 var t=raiz.querySelectorAll('*'),k=0;
 for(var i=0;i<t.length&&k<4000;i++){var e=t[i];if(e.__tcdC||!proprioTexto(e))continue;k++;
  if(/^(SCRIPT|STYLE|SVG|PATH|OPTION|TEXTAREA|INPUT)$/i.test(e.tagName))continue;
  var s=getComputedStyle(e);if(s.display==='none'||s.visibility==='hidden')continue;
  var c=rgba(s.color),b=fundo(e);if(!c||!b||c.a<.5)continue;
  var l1=L(c),l2=L(b),cr=(Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);
  if(cr<3){e.__tcdC=1;e.style.setProperty('color',l2<.18?'#f4f1e6':'#2b2f22','important');if(e.tagName==='A')e.style.setProperty('text-decoration','underline');}
 }
}
var tm=0;function pedir(){clearTimeout(tm);tm=setTimeout(passar,300);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',pedir);else pedir();
addEventListener('load',pedir);setTimeout(pedir,2500);
if(window.MutationObserver){new MutationObserver(pedir).observe(document.body,{childList:true,subtree:true});}
})();
