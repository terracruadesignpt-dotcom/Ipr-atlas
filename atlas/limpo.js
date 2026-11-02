/* IPR Atlas · limpo.js (02/11/2026). Terracrua Design. Só acrescenta; não altera nenhum outro ficheiro.
   Pedido do Nuno (02/11, 11h36), depois do retorno do Hugo Tornelo («toda a gente queixa-se que a plataforma está
   demasiado complicada»): «vamos avançar com a simplificação [...] podes mudar tudo o que sugeres. A ideia é que o meu
   cliente burro consiga comprar». Escolhas: «Entrada por objectivo», «Ecrã limpo por omissão», «Ajuda humana» (os vídeos
   ficam para depois). Regra: nada é retirado, só fica atrás de «Modo completo».
   1. Ecrã limpo por omissão (classe html.ipr-limpo). Escondidos, não apagados:
      topo: Explorer, beta, −Auto+, tema, App, Actualizar;
      mapa: barra grande de ferramentas, Exportar prancha, perfil, barrinha de mover e transparência das janelas (ficava
            por cima do Comprar);
      esquerda: Produtos (repete o Comprar) e a linha dos Temas (#ipr-t62; as Vistas do activas.js fazem isso);
      barra de baixo: coordenadas, escala, zoom, elevação (fica «Reportar problema»);
      painel da direita: fechado ao abrir, no computador (o assistente de compra abre-o sozinho quando é preciso).
   2. Botão «Ver tudo» / «Simplificar» no topo, antes do «Entrar» (o único do género: ao simplificar põe também as camadas
      base do mapa-simples.js, que passou para dentro do menu «…» com o nome «Camadas base») (no telemóvel, no cimo da gaveta da esquerda). A escolha fica lembrada neste navegador (localStorage ipr_modo).
      Quem tem window.IPR_PERFIL.modo === "avancado" e a equipa (window.tcdEquipa) começam no modo completo (decisão do
      Nuno, 02/11, 12h20).
   2b. Barra de cima, nos dois modos: sem o subtítulo genérico, sem «Comprar passo a passo», língua num botão pequeno.
   3. Ecrã de entrada (#ipr-ini do inicio.js): cada documento ganha uma frase simples do que é e para que serve, e por
      baixo «Não sabe o que escolher? Fale com um técnico» (marcação da consultoria e WhatsApp).
   Desliga-se com ?limpo=0 ou localStorage ipr_limpo_off = 1. Força o modo completo com ?completo=1. Falha em silêncio. */
(function () {
  "use strict";
  var W = window, D = document, H = D.documentElement, K = "ipr_modo";
  var q; try { q = new URLSearchParams(location.search); } catch (e) { q = null; }
  try { if ((q && q.get("limpo") === "0") || localStorage.getItem("ipr_limpo_off") === "1") return; } catch (e) {}
  if (W.__iprLimpo) return; W.__iprLimpo = 1;

  function lingua() { var l = W.IPR_LINGUA || (/^(en|es)/i.exec(H.lang || "") || ["pt"])[0]; l = String(l).slice(0, 2).toLowerCase(); return l === "en" || l === "es" ? l : "pt"; }
  var TX = {
    pt: { completo: "Ver tudo", simples: "Simplificar", tc: "Mostra todas as ferramentas, barras e painéis do Atlas", ts: "Esconde o que é avançado; fica o mapa, as camadas e o Comprar",
      duvida: "Não sabe o que escolher?", tecnico: "Fale com um técnico", wa: "WhatsApp",
      docs: ["A planta do terreno para a Câmara, o banco ou uma escritura. Pronta a imprimir.",
        "O que já se sabe do terreno: condicionantes, água, relevo e incêndio. Sem pagar.",
        "Um relatório em linguagem simples: o que o terreno permite, os riscos e o potencial.",
        "Relevo, água e limites do terreno, em ficheiros para o técnico e no mapa."] },
    en: { completo: "Show all", simples: "Simplify", tc: "Show every Atlas tool, bar and panel", ts: "Hide the advanced parts; keep the map, the layers and Buy",
      duvida: "Not sure which one?", tecnico: "Talk to a technician", wa: "WhatsApp",
      docs: ["The land plan for the council, the bank or a deed. Ready to print.",
        "What is already known about the land: constraints, water, relief and fire. Free.",
        "A plain language report: what the land allows, its risks and its potential.",
        "Relief, water and boundaries of the land, as files for your technician and on the map."] },
    es: { completo: "Ver todo", simples: "Simplificar", tc: "Muestra todas las herramientas, barras y paneles del Atlas", ts: "Oculta lo avanzado; quedan el mapa, las capas y Comprar",
      duvida: "¿No sabe qué elegir?", tecnico: "Hable con un técnico", wa: "WhatsApp",
      docs: ["El plano del terreno para el ayuntamiento, el banco o una escritura. Listo para imprimir.",
        "Lo que ya se sabe del terreno: condicionantes, agua, relieve e incendio. Gratis.",
        "Un informe en lenguaje sencillo: lo que permite el terreno, sus riesgos y su potencial.",
        "Relieve, agua y límites del terreno, en archivos para su técnico y en el mapa."] }
  };
  function T() { return TX[lingua()]; }
  var TEC = "/servicos/consultoria-tecnica/#marcar", WA = "https://wa.me/351910748670";

  // ---------------------------------------------------------------- modo
  function modoInicial() {
    try { if (q && q.get("completo") === "1") return "completo"; } catch (e) {}
    try { var g = localStorage.getItem(K); if (g === "completo" || g === "simples") return g; } catch (e) {}
    try { if (W.IPR_PERFIL && W.IPR_PERFIL.modo === "avancado") return "completo"; } catch (e) {}
    if (W.tcdEquipa) return "completo";
    return "simples";
  }
  function escolhaGuardada() { try { var g = localStorage.getItem(K); return g === "completo" || g === "simples"; } catch (e) { return false; } }
  var modo = modoInicial(), dirFechadaPorNos = false, dirFeito = false;
  function desk() { return W.innerWidth > 900; }
  function ipe() { var e = D.getElementById("ipe"); return e && e.classList.contains("ipe") && D.getElementById("ipe-dir") ? e : null; }
  var pronto = 0; // o app.js reescreve a classe do #ipe ao montar: o painel só se fecha com o mapa já criado
  function mapaPronto() { try { if (W.__ipe && W.__ipe.mapa) { if (!pronto) pronto = Date.now(); return Date.now() - pronto > 1200; } } catch (e) {} return false; }
  function redim() { setTimeout(function () { try { var m = W.__ipe && W.__ipe.mapa; if (m) m.resize(); } catch (e) {} }, 80); }
  function aplicar(guardar) {
    H.classList.toggle("ipr-limpo", modo === "simples");
    if (guardar) { try { localStorage.setItem(K, modo); } catch (e) {} }
    var R = ipe();
    if (R && desk()) {
      if (modo === "simples" && !dirFeito) { if (!mapaPronto()) { botao(); return; } dirFeito = true; if (!R.classList.contains("sem-dir")) { R.classList.add("sem-dir"); dirFechadaPorNos = true; marcarPn(R); redim(); } }
      else if (modo === "completo" && dirFechadaPorNos && guardar) { dirFechadaPorNos = false; R.classList.remove("sem-dir"); marcarPn(R); redim(); }
    }
    botao();
  }
  function marcarPn(R) { var pn = D.getElementById("ipe-pn"); if (pn) pn.setAttribute("aria-pressed", String(!R.classList.contains("sem-dir"))); }

  // ---------------------------------------------------------------- estilos
  var css = ""
    // topo
    + "html.ipr-limpo #ipe .ipe-nivel,html.ipr-limpo #ipe .ipe-beta,html.ipr-limpo #ipe .ipe-vsep,html.ipr-limpo #ipr-z67,"
    + "html.ipr-limpo #ipe-tema,html.ipr-limpo #ipr-app-b,html.ipr-limpo #ipr-ref{display:none!important}"
    // mapa
    + "html.ipr-limpo #ipr-pb-barra,html.ipr-limpo #ipr-perfil-b,html.ipr-limpo #ipe-mapa [data-tool=foto],html.ipr-limpo .ipr-janb{display:none!important}"
    // esquerda
    + "html.ipr-limpo #ipr-pd,html.ipr-limpo #ipr-t62{display:none!important}"
    // barra de baixo: só «Reportar problema» e o rodapé
    + "@media(min-width:901px){html.ipr-limpo #ipe-st>span:not(.esp):not(.dono):not(:has(#ipe-bug)){display:none!important}}"
    // barra de cima harmonizada (Nuno, 02/11, 14h00), nos dois modos: sem o subtítulo genérico «IPR Atlas · plataforma
    // territorial» (o nome do projecto aberto continua), sem «Comprar passo a passo» (repete o Comprar, que abre o mesmo
    // assistente), e a língua num botão pequeno que mostra só a outra
    + "#ipe .ipe-ctx.ipr-as-eco,#ipr-tp-as{display:none!important}"
    + "@media(max-width:900px){#ipe .ipe-nivel,#ipe .ipe-beta{display:none!important}}"
    + "#ipr-lg-topo .ipr-lg-top{border:0!important;background:transparent!important;gap:0!important}"
    + "#ipr-lg-topo button[aria-pressed=true]{display:none!important}"
    + "#ipr-lg-topo button[aria-pressed=false]{font:600 11px/1 Inter,system-ui,sans-serif!important;letter-spacing:.06em;padding:7px 9px!important;border-radius:999px!important;border:1px solid rgba(228,226,216,.35)!important;background:transparent!important;color:inherit!important;min-height:30px}"
    // botão do modo
    + "#ipr-modo{font:600 12px/1 Inter,system-ui,sans-serif;padding:7px 11px;border-radius:999px;border:1px solid rgba(228,226,216,.35);background:transparent;color:inherit;cursor:pointer;white-space:nowrap;margin:0 6px;min-height:30px}"
    + "#ipr-modo:hover{border-color:#9BC53D}#ipr-modo:focus-visible{outline:2px solid #9BC53D;outline-offset:2px}"
    + "#ipr-modo.ipr-modo-g{display:block;margin:10px 12px 0;padding:10px 12px;font-size:13px;border-radius:999px;align-self:flex-start;min-height:40px}"
    // entrada
    + "#ipr-ini .g a i.ipr-ld{font:400 13px/1.4 Inter,system-ui,sans-serif;font-style:normal;color:#C9C8BC;margin-top:4px}"
    + "#ipr-ini .ipr-tec{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;justify-content:center;font-size:14px;color:#C9C8BC;text-align:center}"
    + "#ipr-ini .ipr-tec a{color:#C5DE7A;font-weight:600;min-height:44px;display:inline-flex;align-items:center}";
  function estilos() { if (D.getElementById("ipr-limpo-css")) return; var s = D.createElement("style"); s.id = "ipr-limpo-css"; s.textContent = css; (D.head || H).appendChild(s); }

  // ---------------------------------------------------------------- botão
  function botao() {
    var top = D.querySelector("#ipe header.ipe-top"); if (!top) return;
    var b = D.getElementById("ipr-modo");
    if (!b) {
      b = D.createElement("button"); b.type = "button"; b.id = "ipr-modo";
      b.addEventListener("click", function (e) {
        e.preventDefault(); modo = modo === "simples" ? "completo" : "simples"; aplicar(true);
        // «Só um botão» (Nuno, 02/11, 13h55): simplificar também põe as camadas base (mapa-simples.js); ver tudo repõe as que estavam
        try { if (typeof W.iprCamadasBase === "function") W.iprCamadasBase(modo === "simples"); } catch (x) {}
      });
    }
    var t = T(), txt = modo === "simples" ? t.completo : t.simples;
    if (b.textContent !== txt) { b.textContent = txt; b.title = modo === "simples" ? t.tc : t.ts; }
    b.setAttribute("aria-pressed", modo === "completo" ? "true" : "false");
    // no telemóvel a barra de cima já não tem lugar: o botão vai para o topo da gaveta da esquerda
    var E = D.getElementById("ipe-esq");
    if (!desk() && E) { if (E.firstChild !== b) E.insertBefore(b, E.firstChild); b.classList.add("ipr-modo-g"); return; }
    b.classList.remove("ipr-modo-g");
    // 02/11, 13h47: antes ia para o primeiro lugar da barra, o mesmo que o «Camadas base» (mapa-simples.js) quer, e os dois
    // trocavam de lugar a cada segundo (piscavam). Agora fica logo antes do «Entrar» / «Conta» (ou do menu «…»), ou no fim da barra.
    var tr = top.querySelector(":scope > .ipe-tr");
    if (tr) {
      var alvo = null; ["ipe-entrar", "ipe-user", "ipe-mais"].some(function (id) { var e = D.getElementById(id); if (e && e.parentNode === tr) { alvo = e; return true; } return false; });
      if (b.parentNode !== tr || (alvo ? b.nextSibling !== alvo : tr.lastChild !== b)) tr.insertBefore(b, alvo);
    }
    else if (b.parentNode !== top) top.appendChild(b);
  }

  // ---------------------------------------------------------------- entrada
  function entrada() {
    var o = D.getElementById("ipr-ini"); if (!o) return;
    var t = T(), cards = o.querySelectorAll(".g > a");
    [].forEach.call(cards, function (a, i) {
      if (a.querySelector("i.ipr-ld") || !t.docs[i]) return;
      var d = D.createElement("i"); d.className = "ipr-ld"; d.textContent = t.docs[i]; a.appendChild(d);
    });
    if (!o.querySelector(".ipr-tec")) {
      var g = o.querySelector(".g"); if (!g) return;
      var p = D.createElement("p"); p.className = "ipr-tec";
      var s = D.createElement("span"); s.textContent = t.duvida; p.appendChild(s);
      var a1 = D.createElement("a"); a1.href = TEC; a1.textContent = t.tecnico + " →"; p.appendChild(a1);
      var a2 = D.createElement("a"); a2.href = WA; a2.target = "_blank"; a2.rel = "noopener"; a2.textContent = t.wa; p.appendChild(a2);
      g.parentNode.insertBefore(p, g.nextSibling);
    }
  }

  // ---------------------------------------------------------------- arranque
  estilos();
  H.classList.toggle("ipr-limpo", modo === "simples");
  var n = 0;
  (function ciclo() {
    try { entrada(); } catch (e) {}
    // a equipa (window.tcdEquipa, posto pelo site) começa no modo completo, se ainda não escolheu
    try { if (W.tcdEquipa && modo === "simples" && !escolhaGuardada() && !(q && q.get("completo") === "0")) { modo = "completo"; } } catch (e) {}
    try { if (ipe()) { aplicar(false); } } catch (e) {}
    n++; setTimeout(ciclo, n < 40 ? 250 : 1500);
  })();
  try { W.addEventListener("ipr:lingua", function () { try { botao(); } catch (e) {} }); } catch (e) {}
  W.iprModo = function (m) { if (m === "simples" || m === "completo") { modo = m; aplicar(true); } return modo; };
})();
