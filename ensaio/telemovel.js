
(function(){
"use strict";var W=window,D=document,H=D.documentElement;
try{if(/[?&]tm=0(&|$)/.test(location.search))localStorage.setItem("ipr_tm_off","1");if(/[?&]tm=1(&|$)/.test(location.search))localStorage.removeItem("ipr_tm_off");if(localStorage.getItem("ipr_tm_off")==="1")return;}catch(e){}
if(W.__iprTm)return;W.__iprTm=1;
function pt(){var l=(W.IPR_LINGUA||H.lang||"pt").toLowerCase();return l.indexOf("en")!==0;}
function T(a,b){return pt()?a:b;}
function tel(){return W.matchMedia&&W.matchMedia("(max-width:600px)").matches;}
function vis(e){if(!e)return false;var r=e.getBoundingClientRect(),c=W.getComputedStyle(e);return c.display!=="none"&&c.visibility!=="hidden"&&r.width>0&&r.height>0;}
function el(t,c,x){var e=D.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e;}
function clicar(n){if(!n)return;try{n.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true,view:W}));}catch(e){n.click();}}
var B=null,F=null;
function itens(){
  var L=[],x;
  x=D.getElementById("tcdatdq-b");if(x)L.push(["?",T("Falar com um técnico","Talk to a technician"),T("Nos dias úteis, das 9h às 13h; fora disso fica um pedido","Weekdays 9:00 to 13:00; otherwise a ticket is left"),function(){clicar(x);}]);
  x=D.getElementById("tcdfmb");if(x)L.push(["F",T("Formiga","Formiga"),T("Assistente: dúvidas e problemas","Assistant: questions and problems"),function(){clicar(x);}]);
  var dk=D.getElementById("tcd_dock-l");
  if(dk)[].forEach.call(dk.querySelectorAll("a[href],button"),function(a){var t=(a.textContent||a.getAttribute("aria-label")||"").trim();if(!t||a.id==="tcdfmb")return;L.push([t.charAt(0).toUpperCase(),t,"",function(){if(a.tagName==="A"&&a.href){if(a.target==="_blank")W.open(a.href,"_blank","noopener");else location.href=a.href;}else clicar(a);}]);});
  x=D.getElementById("t393d");if(x)L.push(["i",T("O que tem e o que vem","What you have and what comes next"),T("Ficheiros, QGIS e o ponto de cada Base","Files, QGIS and the status of each base"),function(){x.classList.add("ipr-tm-ver");clicar(D.getElementById("t393db"));}]);
  x=D.getElementById("ipr-lg-topo");if(x)L.push(["Aa",T("English","Português"),"",function(){var b=x.querySelector("button,a")||x;clicar(b);}]);
  [].forEach.call(D.querySelectorAll("a.ipr-tm-es"),function(a){L.push(["ES","Español","",function(){location.href=a.href;}]);});
  x=D.getElementById("ipr-be-topo");if(x&&x.querySelector("button,a"))L.push(["P",T("Produtos","Products"),"",function(){clicar(x.querySelector("button,a"));}]);
  x=D.getElementById("ipr-ms-app");if(x)L.push(["↓",T("Instalar a app IPR Atlas","Install the IPR Atlas app"),"",function(){clicar(x);}]);
  x=D.getElementById("ipr-painel");if(x&&x.href)L.push(["E",T("Painel da equipa","Team panel"),"",function(){location.href=x.href;}]);
  return L;
}
function fechar(){if(F)F.hidden=true;if(B){B.setAttribute("aria-expanded","false");try{B.focus({preventScroll:true});}catch(e){}}}
function abrir(){
  if(!F){F=el("div");F.id="ipr-tm-f";F.hidden=true;F.setAttribute("role","dialog");F.setAttribute("aria-modal","true");
    F.addEventListener("click",function(e){if(e.target===F)fechar();});D.addEventListener("keydown",function(e){if(e.key==="Escape"&&F&&!F.hidden)fechar();});D.body.appendChild(F);}
  F.textContent="";var s=el("div","s"),h=el("div","h",T("Ajuda","Help")),x=el("button","","×");x.type="button";x.setAttribute("aria-label",T("Fechar","Close"));x.addEventListener("click",fechar);h.appendChild(x);s.appendChild(h);
  F.setAttribute("aria-label",T("Ajuda","Help"));
  itens().forEach(function(o){var b=el("button","i");b.type="button";b.appendChild(el("span","ic",o[0]));var t=el("span");t.appendChild(D.createTextNode(o[1]));if(o[2])t.appendChild(el("small","",o[2]));b.appendChild(t);b.addEventListener("click",function(){fechar();setTimeout(o[3],30);});s.appendChild(b);});
  F.appendChild(s);F.hidden=false;B.setAttribute("aria-expanded","true");var p=s.querySelector(".i");if(p)try{p.focus({preventScroll:true});}catch(e){}
}
function marcarES(){[].forEach.call(D.querySelectorAll("a[href]"),function(a){if(a.classList.contains("ipr-tm-es"))return;if(/^\s*ES\s*$/.test(a.textContent||"")&&W.getComputedStyle(a).position==="fixed")a.classList.add("ipr-tm-es");});}
function aberto(){
  var ipe=D.getElementById("ipe");
  if(ipe&&(ipe.classList.contains("esq-aberto")||!ipe.classList.contains("sem-dir")))return true;
  var fm=D.getElementById("tcd_fmf");if(fm&&vis(fm)&&fm.getBoundingClientRect().height>200)return true;
  var p=D.getElementById("t393dp");if(p&&!p.hidden&&vis(p))return true;
  var ae=D.activeElement;if(ae&&/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)&&!(F&&F.contains(ae)))return true;
  return false;
}
function baixo(){var d=D.getElementById("ipe-dir"),v=16;if(d&&vis(d)){var r=d.getBoundingClientRect();if(r.top>W.innerHeight*0.5)v=Math.max(16,W.innerHeight-r.top+12);}return v;}
function vigia(){
  if(!tel()){if(H.classList.contains("ipr-tm"))H.classList.remove("ipr-tm");return;}
  if(!H.classList.contains("ipr-tm"))H.classList.add("ipr-tm");marcarES();
  if(!B){B=el("button");B.id="ipr-tm-b";B.type="button";B.setAttribute("aria-haspopup","dialog");B.setAttribute("aria-expanded","false");B.setAttribute("aria-label",T("Ajuda","Help"));B.textContent="?";B.addEventListener("click",function(){if(F&&!F.hidden)fechar();else abrir();});D.body.appendChild(B);}
  var t393=D.getElementById("t393d"),pp=D.getElementById("t393dp");if(t393&&t393.classList.contains("ipr-tm-ver")&&(!pp||pp.hidden))t393.classList.remove("ipr-tm-ver");
  var esc=aberto();if(H.classList.contains("ipr-tm-escondido")!==esc)H.classList.toggle("ipr-tm-escondido",esc);
  var bx=baixo()+"px";if(H.style.getPropertyValue("--ipr-tm-baixo")!==bx)H.style.setProperty("--ipr-tm-baixo",bx);
  var a=D.getElementById("tcdatdq-b"),n=a&&a.querySelector("i"),k=n&&!n.hidden&&+n.textContent>0?n.textContent:"";
  var p=B.querySelector(".p");if(k){if(!p){p=el("span","p");B.appendChild(p);}p.textContent=k;}else if(p)p.remove();
}
var t=0;function agendar(){clearTimeout(t);t=setTimeout(function(){try{vigia();}catch(e){}},150);}
new MutationObserver(function(ms){for(var i=0;i<ms.length;i++){var x=ms[i].target;if(x&&x.closest&&x.closest("#ipr-tm-f,#ipr-tm-b"))continue;agendar();return;}}).observe(D.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["class","hidden","style"]});
W.addEventListener("resize",agendar);D.addEventListener("focusin",agendar);D.addEventListener("focusout",agendar);
agendar();
})();
