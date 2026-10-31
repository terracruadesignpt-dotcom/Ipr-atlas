/* IPR Atlas · Assistente de encomenda com setas (Nuno, 28/10/2026, 13h51: «quando [a pessoa] entra no Atlas [...] que tenha um
   assistente agora a dizer o passo todo, umas setinhas, seja o que for, a ajudar a pessoa a fazer a encomenda. E isso é assim
   para todos os serviços que estão ali naquela página»; 14h00: a Leitura Territorial precisa da Base, vão juntas).
   Liga-se quando o endereço traz ?servico=planta|leitura|territorial|base (cartões, perguntas e situações da página
   /documentos/, módulo m90431). Mostra um cartão pequeno com uma seta que aponta para o sítio certo do Atlas, passo a passo, e
   avança sozinho quando a pessoa faz o que o passo pede. O estado fica na sessão do navegador (sessionStorage ipr_guia_v1), por
   isso continua depois de entrar na conta. Não mexe no app.js nem no ajustes.js: lê o DOM (#ipe-q, #ipe-guia, #ipe-area,
   #ipe-res, input[name=leitura], #ipe-nome, #ipe-email, #tcd-m331-c, #ipe-enviar, #ipe-entrar, #ipe-guardar, botões da Planta)
   e trava a triagem do §63 para não abrir por cima. Fecha com «Sair» ou Esc. Desligar: window.IPR_GUIA_OFF = true. */
(function () {
  "use strict";
  if (window.IPR_GUIA_OFF || window.__iprGuia) return;
  window.__iprGuia = 1;
  var K = "ipr_guia_v1", SERV = ["planta", "leitura", "territorial", "base"];
  var url = new URLSearchParams(location.search), pedido = url.get("servico"), EST = null;
  function lerE() { try { return JSON.parse(sessionStorage.getItem(K) || "null"); } catch (e) { return null; } }
  function gravarE() { try { if (EST) sessionStorage.setItem(K, JSON.stringify(EST)); else sessionStorage.removeItem(K); } catch (e) {} }
  // Planta e Leitura vendem-se sem conta (Nuno, 30/10/2026, 18h35 e 19h36): os cartões da /documentos/ com ?servico=planta,
  // leitura ou territorial passam a abrir o assistente de compra pergunta a pergunta (assistente.js), que não pede conta.
  // A Base Cartográfica continua neste guia (precisa de conta).
  if (pedido && /^(planta|leitura|territorial)$/.test(pedido) && !window.IPR_ASSISTENTE_OFF) {
    var prod = pedido === "planta" ? "planta" : "leitura", n0 = 0;
    try { sessionStorage.removeItem(K); sessionStorage.setItem("ipr_as_auto", "1"); } catch (e) {}
    (function esp() { if (typeof window.__iprAssistenteAbrir === "function") { window.__iprAssistenteAbrir(prod); return; } if (++n0 < 60) setTimeout(esp, 250); })();
    return;
  }
  if (pedido && SERV.indexOf(pedido) >= 0) { EST = { s: pedido, p: 0, t: Date.now(), q: url.get("q") || "", qf: 0 }; gravarE(); }
  else { EST = lerE(); if (!EST || SERV.indexOf(EST.s) < 0 || Date.now() - EST.t > 3 * 3600e3) { EST = null; gravarE(); return; } }
  // A triagem do §63 (ajustes.js) abre na primeira visita: com o assistente ligado não abre.
  try { if (!localStorage.getItem("ipr_triagem_v1")) localStorage.setItem("ipr_triagem_v1", JSON.stringify({ q: null, p: 0, t: Date.now() })); localStorage.setItem("ipe_tour_v1", "1"); localStorage.setItem("ipe_tour_enc1", "1"); } catch (e) {}
  document.documentElement.classList.add("ipr-sem-guia"); // esconde o guia antigo (.ipe-tour) nesta visita, como o §63

  function en() { var l = String(window.IPR_LINGUA || document.documentElement.lang || "pt").toLowerCase(); return l.indexOf("en") === 0; }
  function t(pt, e) { return en() ? e : pt; }
  function $(s) { return document.querySelector(s); }
  function vis(el) { if (!el) return null; var r = el.getBoundingClientRect(); return r.width > 2 && r.height > 2 && el.offsetParent !== null ? el : null; }
  function primeiro(sels) { for (var i = 0; i < sels.length; i++) { var l = document.querySelectorAll(sels[i]); for (var j = 0; j < l.length; j++) if (vis(l[j])) return l[j]; } return null; }
  function logado() { return !!window.tcdNonce; }
  function separador(id) { var b = $('#ipe [data-tab="' + id + '"]'); if (b && (b.getAttribute("aria-selected") !== "true" || window.innerWidth <= 900)) b.click(); } // no telemóvel o clique também abre o painel
  function area() { var a = $("#ipe-area"); var x = a ? String(a.textContent || "").trim() : ""; return x && x !== "—" && !/confirmar|confirm/i.test(x); }
  function ficha() { return vis($("#ipe-res:not([hidden])")); }
  function mapa() { return window.__ipe && window.__ipe.mapa; }
  function preenchido(id) { var i = document.getElementById(id); return !!(i && String(i.value || "").trim().length > 1); }
  function emailOk() { var i = $("#ipe-email"); return !!(i && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(i.value || "")); }

  var NOME = { planta: ["Planta de Localização", "Location Plan"], leitura: ["Leitura do Terreno (grátis)", "Quick Land Reading (free)"],
    territorial: ["Leitura Territorial", "Territorial Reading"], base: ["Base Cartográfica", "Cartographic Base"] };

  // Passos comuns
  var P_PROCURAR = {
    id: "procurar", alvo: function () { return vis($("#ipe-q")) || primeiro(['[data-tool="lado"]', "#ipe-camadas"]); },
    tt: function () { return t("Procure o terreno", "Find the land"); },
    tx: function () { return t("Escreva o lugar, a morada, as coordenadas ou o NIC do cadastro e escolha o resultado. Depois aproxime o mapa até ver bem as parcelas.", "Type the place, address, coordinates or cadastral NIC and pick the result. Then zoom in until you can see the parcels clearly."); },
    entrar: function () {
      var i = $("#ipe-q");
      if (!i && $("#ipe-camadas")) { try { $("#ipe-camadas").click(); } catch (e) {} }
      if (i && EST.q && !EST.qf) { EST.qf = 1; gravarE(); i.value = EST.q; try { i.dispatchEvent(new Event("input", { bubbles: true })); var f = $("#ipe-busca"); if (f && f.requestSubmit) f.requestSubmit(); } catch (e) {} }
    },
    feito: function () { var m = mapa(); return area() || (m && m.getZoom && m.getZoom() >= 15); },
    manual: function () { return t("Já encontrei o terreno", "I have found the land"); }
  };
  var P_ESCOLHER = {
    id: "escolher", alvo: function () { return primeiro(["#ipe-guia", "#ipe-form .ipe-mb", "#ipe-form"]); },
    tt: function () { return t("Marque o seu terreno", "Mark your land"); },
    tx: function () { return t("Escolha uma forma: clicar nas parcelas do cadastro, desenhar o limite no mapa, carregar um ficheiro (KML, SHP, GeoJSON) ou indicar o artigo matricial. A área aparece logo por baixo.", "Choose one way: click the cadastral parcels, draw the boundary on the map, upload a file (KML, SHP, GeoJSON) or give the land registry article. The area appears right below."); },
    entrar: function () { separador("enc"); },
    feito: area
  };
  var P_DADOS = {
    id: "dados", alvo: function () { return vis($("#ipe-nome")) ? $("#ipe-nome").closest("fieldset,div,section") || $("#ipe-nome") : null; },
    tt: function () { return t("Os seus dados", "Your details"); },
    tx: function () { return logado() ? t("Confirme o nome e o e-mail. O NIF só é preciso se quiser a factura com ele.", "Check your name and e-mail. The tax number is only needed if you want it on the invoice.")
      : t("Só o nome e o e-mail: a conta cria-se sozinha e recebe uma ligação para escolher a palavra-passe. Os documentos ficam guardados na conta.", "Just your name and e-mail: the account is created for you and you get a link to choose a password. Your documents stay in the account."); },
    entrar: function () { var i = $("#ipe-nome"); if (i) try { i.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (e) {} },
    feito: function () { return preenchido("ipe-nome") && emailOk(); }
  };
  var P_DECL = {
    id: "decl", saltar: function () { return !vis($("#tcd-m331-c")); }, alvo: function () { return vis($("#tcd-m331-c")); },
    tt: function () { return t("Confirme o limite", "Confirm the boundary"); },
    tx: function () { return t("Marque a declaração: o limite que indicou é da sua responsabilidade.", "Tick the statement: the boundary you gave is your responsibility."); },
    feito: function () { var c = $("#tcd-m331-c input"); return !c || c.checked; }
  };
  var P_ENVIAR = {
    id: "enviar", alvo: function () { return vis($("#ipe-enviar")); },
    tt: function () { return t("Envie o pedido", "Send the order"); },
    tx: function () { return t("Carregue em «Enviar pedido». A seguir vê o resumo e escolhe como pagar (Multibanco, cartão ou transferência).", "Press «Send order». You will then see the summary and choose how to pay (Multibanco, card or bank transfer)."); },
    entrar: function () { var b = $("#ipe-enviar"); if (b) { try { b.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (e) {} b.addEventListener("click", function () { EST.enviou = 1; gravarE(); }, { once: true }); } },
    feito: function () { var e = $("#ipe-estado"); return !!(EST.enviou && e && String(e.textContent || "").trim()); },
    fim: function () { return t("Pedido enviado. Siga o resumo para pagar; os documentos chegam ao seu e-mail e ficam na sua conta.", "Order sent. Follow the summary to pay; the documents arrive by e-mail and stay in your account."); }
  };

  var PASSOS = {
    leitura: [P_PROCURAR, P_ESCOLHER, {
      id: "ficha", alvo: ficha, tt: function () { return t("A leitura grátis do seu terreno", "The free reading of your land"); },
      tx: function () { return t("Aqui está: condicionantes (REN, RAN, Rede Natura), linhas de água, relevo, ocupação do solo e risco de incêndio. É indicativa. Se quiser o relatório completo em PDF, peça a Leitura Territorial.", "Here it is: constraints (REN, RAN, Natura 2000), watercourses, relief, land cover and wildfire hazard. It is indicative. For the full PDF report, order the Territorial Reading."); },
      entrar: function () { separador("enc"); var f = ficha(); if (f) try { f.scrollIntoView({ block: "start", behavior: "smooth" }); } catch (e) {} },
      feito: function () { return false; },
      extra: [["territorial", function () { return t("Quero a Leitura Territorial", "I want the Territorial Reading"); }]],
      manual: function () { return t("Terminar", "Finish"); }, ultimo: 1
    }],
    base: [P_PROCURAR, P_ESCOLHER, {
      id: "preco", alvo: function () { var p = $("#ipe-preco"); return vis(p) ? p.closest("div") || p : null; },
      tt: function () { return t("Área e preço", "Area and price"); },
      tx: function () { return t("Com o terreno marcado vê a área e o preço da Base Cartográfica, sem IVA. Inclui 12 meses de IPR Atlas Intelligence. Se juntar a Leitura Territorial, as duas têm mais 10 % de desconto.", "With the land marked you see the area and the price of the Cartographic Base, excluding VAT. It includes 12 months of IPR Atlas Intelligence. Add the Territorial Reading and both get a further 10% off."); },
      entrar: function () { var p = $("#ipe-preco"); if (p) try { p.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (e) {} },
      feito: function () { return false; }, manual: function () { return t("Continuar", "Continue"); }
    }, P_DADOS, P_DECL, P_ENVIAR],
    territorial: [P_PROCURAR, P_ESCOLHER, {
      id: "leitura", alvo: function () { var c = $('#ipe-form input[name="leitura"]'); return c ? vis(c.closest("label")) : null; },
      tt: function () { return t("Marque a Leitura Territorial", "Tick the Territorial Reading"); },
      tx: function () { return t("A Leitura Territorial é feita com o levantamento LiDAR da Base Cartográfica, por isso pede-se com ela. Juntas têm mais 10 % de desconto, e recebe os mapas técnicos e o relatório.", "The Territorial Reading is built on the LiDAR survey of the Cartographic Base, so it is ordered with it. Together they get a further 10% off, and you receive both the technical maps and the report."); },
      entrar: function () { var c = $('#ipe-form input[name="leitura"]'); if (c) try { c.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (e) {} },
      feito: function () { var c = $('#ipe-form input[name="leitura"]'); return !!(c && c.checked); }
    }, P_DADOS, P_DECL, P_ENVIAR],
    planta: [{
      id: "conta", saltar: logado, alvo: function () { return vis($("#ipe-entrar")); },
      tt: function () { return t("Entre na sua conta", "Sign in"); },
      tx: function () { return t("A Planta fica guardada na sua conta. Entre, ou crie a conta só com o nome e o e-mail. Quando voltar ao Atlas, o assistente continua.", "The plan is kept in your account. Sign in, or create an account with just your name and e-mail. When you come back to the Atlas, the assistant carries on."); },
      feito: logado
    }, P_PROCURAR, P_ESCOLHER, {
      id: "guardar", alvo: function () { return vis($("#ipe-guardar")); },
      tt: function () { return t("Guarde o terreno", "Save the land"); },
      tx: function () { return t("Guarde o terreno como projecto. A Planta de Localização faz-se a partir do projecto.", "Save the land as a project. The Location Plan is made from the project."); },
      entrar: function () { var b = $("#ipe-guardar"); if (b) { try { b.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (e) {} b.addEventListener("click", function () { EST.guardou = 1; gravarE(); }, { once: true }); } },
      feito: function () { return !!EST.guardou || !!vis($('#ipe [data-tab="proj"][aria-selected="true"]')); }
    }, {
      id: "planta", alvo: function () { return primeiro(['#ipe [data-fx="pl"]', "#ipe [data-ppl]", '#ipe [data-a="planta"]', '#ipe [data-tab="proj"]']); },
      tt: function () { return t("Faça a Planta de Localização", "Make the Location Plan"); },
      tx: function () { return t("Em «Projectos», abra o terreno e carregue em «Planta de localização». Escolha a finalidade (câmara, banco, notário), o formato e a escala, e descarregue o PDF.", "In «Projects», open the land and press «Location plan». Choose the purpose (council, bank, notary), the format and the scale, and download the PDF."); },
      entrar: function () { separador("proj"); var l = document.getElementById("ipe"); if (l && !l.__guiaPl) { l.__guiaPl = 1; l.addEventListener("click", function (e) { if (e.target.closest('[data-fx="pl"],[data-ppl],[data-a="planta"]')) { EST.planta = 1; gravarE(); } }, true); } },
      feito: function () { return !!EST.planta; },
      fim: function () { return t("Escolha as opções da Planta e descarregue o PDF. Fica também guardada no projecto.", "Choose the plan options and download the PDF. It is also kept in the project."); }
    }]
  };

  // Interface: anel à volta do alvo, cartão com seta.
  var CSS = "#ipr-gu-anel{position:fixed;z-index:100004;pointer-events:none;border:2px solid #c9d36a;border-radius:10px;box-shadow:0 0 0 4px rgba(201,211,106,.25),0 0 0 9999px rgba(10,12,10,.28);transition:all .25s ease;display:none}" +
    "#ipr-gu{position:fixed;z-index:100005;width:min(340px,calc(100vw - 24px));background:#141814;color:#e9eadf;border:1px solid #c9d36a;border-radius:14px;padding:14px 16px 12px;box-shadow:0 14px 40px rgba(0,0,0,.45);font:14px/1.5 Inter,system-ui,sans-serif;transition:top .25s ease,left .25s ease}" +
    "#ipr-gu .k{margin:0 0 4px;font:600 10.5px 'IBM Plex Mono',monospace;letter-spacing:.05em;text-transform:uppercase;color:#9aa08f}" +
    "#ipr-gu h4{margin:0 0 6px;font:600 16px/1.3 Inter,sans-serif;color:#e9eadf}#ipr-gu p{margin:0 0 10px;color:#cfd2c4}" +
    "#ipr-gu .pp{display:flex;gap:4px;margin:0 0 10px}#ipr-gu .pp i{flex:1;height:3px;border-radius:2px;background:#2c312a}#ipr-gu .pp i.f{background:#8f9a55}#ipr-gu .pp i.a{background:#c9d36a}" +
    "#ipr-gu .b{display:flex;flex-wrap:wrap;gap:6px;align-items:center}#ipr-gu button{font:600 13px Inter,sans-serif;min-height:36px;padding:7px 12px;border-radius:9px;border:1px solid #3a3f36;background:transparent;color:#e9eadf;cursor:pointer}" +
    "#ipr-gu button.pri{background:#c9d36a;border-color:#c9d36a;color:#141814}#ipr-gu button.sai{margin-left:auto;border:0;text-decoration:underline;color:#9aa08f;padding:7px 4px}" +
    "#ipr-gu .seta{position:absolute;width:0;height:0;border:11px solid transparent}" +
    "#ipr-gu[data-l=baixo] .seta{top:-22px;border-bottom-color:#c9d36a}#ipr-gu[data-l=cima] .seta{bottom:-22px;border-top-color:#c9d36a}" +
    "#ipr-gu[data-l=dir] .seta{left:-22px;border-right-color:#c9d36a}#ipr-gu[data-l=esq] .seta{right:-22px;border-left-color:#c9d36a}#ipr-gu[data-l=sem] .seta{display:none}" +
    "#ipr-gu-dedo{position:fixed;z-index:100005;pointer-events:none;font-size:22px;line-height:1;color:#c9d36a;display:none;animation:iprGuB 1s ease-in-out infinite}" +
    "@keyframes iprGuB{0%,100%{transform:translate(0,0)}50%{transform:translate(var(--dx,0),var(--dy,6px))}}" +
    "@media (prefers-reduced-motion:reduce){#ipr-gu-dedo{animation:none}#ipr-gu,#ipr-gu-anel{transition:none}}" +
    "@media (max-width:600px){#ipr-gu{left:12px!important;right:12px;width:auto;top:calc(54px + env(safe-area-inset-top))!important;bottom:auto;padding:12px 14px 10px;font-size:13.5px}#ipr-gu h4{font-size:15px}#ipr-gu .seta{display:none}}";
  var C, ANEL, DEDO, ALVO = null, ULT = "";

  function lista() { return PASSOS[EST.s]; }
  function passo() { return lista()[EST.p]; }
  function montar() {
    if (document.getElementById("ipr-gu")) return;
    var st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
    ANEL = document.createElement("div"); ANEL.id = "ipr-gu-anel"; document.body.appendChild(ANEL);
    DEDO = document.createElement("div"); DEDO.id = "ipr-gu-dedo"; DEDO.setAttribute("aria-hidden", "true"); document.body.appendChild(DEDO);
    C = document.createElement("div"); C.id = "ipr-gu"; C.setAttribute("role", "dialog"); C.setAttribute("aria-live", "polite"); document.body.appendChild(C);
    C.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      var a = b.getAttribute("data-g");
      if (a === "sair") return sair();
      if (a === "seg") { if (passo().ultimo || EST.p >= lista().length - 1) return sair(); avancar(); return; }
      if (a === "vol") {
        // «Voltar» em todos os passos (Nuno, 30/10/2026, 20h49): no fim volta ao último passo; no primeiro volta à página de onde
        // a pessoa veio (documentos, cartões de serviço) ou, sem ela, sai do assistente.
        if (EST.fim) { EST.fim = 0; gravarE(); entrarPasso(); return; }
        if (EST.p > 0) { EST.p--; while (EST.p > 0 && passo().saltar && passo().saltar()) EST.p--; gravarE(); entrarPasso(); return; }
        var ref = ""; try { ref = document.referrer && new URL(document.referrer).origin === location.origin && !/\/atlas\//.test(new URL(document.referrer).pathname) ? document.referrer : ""; } catch (e) {}
        sair(); if (ref) history.back(); return;
      }
      if (a && a.indexOf("ir:") === 0) { EST.s = a.slice(3); EST.p = 0; gravarE(); var i = lista().map(function (x) { return x.id; }).indexOf("escolher"); EST.p = Math.max(0, area() ? i + 1 : 0); entrarPasso(); }
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && document.getElementById("ipr-gu")) sair(); });
    document.addEventListener("ipr:lingua", function () { ULT = ""; pintar(); });
  }
  function sair() { EST = null; gravarE(); ["ipr-gu", "ipr-gu-anel", "ipr-gu-dedo"].forEach(function (id) { var x = document.getElementById(id); if (x) x.remove(); }); clearInterval(TIMER); }
  function avancar() {
    EST.p++;
    while (EST.p < lista().length && passo().saltar && passo().saltar()) EST.p++;
    if (EST.p >= lista().length) { EST.p = lista().length - 1; EST.fim = 1; }
    gravarE(); entrarPasso();
  }
  function entrarPasso() {
    ULT = ""; var p = passo(); if (p.entrar) try { p.entrar(); } catch (e) {} pintar();
    // traz o alvo para a vista quando está fora do ecrã (painel com scroll, telemóvel)
    setTimeout(function () { try { var a = !EST.fim && p.alvo(); if (!a) return; var r = a.getBoundingClientRect(); if (r.top < 60 || r.bottom > window.innerHeight - 20) a.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (e) {} }, 450);
  }
  function pintar() {
    if (!EST || !C) return;
    var p = passo(), L = lista(), n = L.length, fim = EST.fim && p.fim;
    var chave = EST.s + EST.p + (fim ? "f" : "") + (en() ? "e" : "p");
    if (chave !== ULT) {
      ULT = chave;
      var h = '<span class="seta"></span><p class="k">' + t(NOME[EST.s][0], NOME[EST.s][1]) + " · " + t("passo ", "step ") + (EST.p + 1) + t(" de ", " of ") + n + "</p>" +
        '<div class="pp">' + L.map(function (x, i) { return '<i class="' + (i < EST.p ? "f" : i === EST.p ? "a" : "") + '"></i>'; }).join("") + "</div>" +
        "<h4>" + (fim ? t("Feito", "Done") : p.tt()) + "</h4><p>" + (fim ? p.fim() : p.tx()) + '</p><div class="b">';
      h += '<button type="button" data-g="vol">' + t("Voltar", "Back") + "</button>";
      (p.extra || []).forEach(function (x) { h += '<button type="button" class="pri" data-g="ir:' + x[0] + '">' + x[1]() + "</button>"; });
      if (fim) h += '<button type="button" class="pri" data-g="sair">' + t("Fechar", "Close") + "</button>";
      else if (p.manual) h += '<button type="button" class="' + (p.extra ? "" : "pri") + '" data-g="seg">' + p.manual() + "</button>";
      h += '<button type="button" class="sai" data-g="sair">' + t("Sair do assistente", "Leave the assistant") + "</button></div>";
      C.innerHTML = h;
    }
    posicionar();
  }
  function posicionar() {
    var p = passo(), a = null; try { a = EST.fim ? null : p.alvo(); } catch (e) {}
    ALVO = a;
    var W = window.innerWidth, H = window.innerHeight, cw = C.offsetWidth, ch = C.offsetHeight;
    if (!a) { ANEL.style.display = "none"; DEDO.style.display = "none"; C.setAttribute("data-l", "sem"); C.style.left = Math.max(12, (W - cw) / 2) + "px"; C.style.top = Math.max(12, H - ch - 24) + "px"; return; }
    var r = a.getBoundingClientRect(), pad = 6;
    ANEL.style.display = "block"; ANEL.style.left = (r.left - pad) + "px"; ANEL.style.top = (r.top - pad) + "px"; ANEL.style.width = (r.width + 2 * pad) + "px"; ANEL.style.height = (r.height + 2 * pad) + "px";
    if (W <= 600) { C.setAttribute("data-l", "sem"); DEDO.style.display = "none"; return; }
    var l, x, y;
    if (r.left > cw + 40) { l = "esq"; x = r.left - cw - 22; y = r.top + r.height / 2 - 40; }
    else if (W - r.right > cw + 40) { l = "dir"; x = r.right + 22; y = r.top + r.height / 2 - 40; }
    else if (H - r.bottom > ch + 40) { l = "baixo"; x = r.left + r.width / 2 - cw / 2; y = r.bottom + 22; }
    else { l = "cima"; x = r.left + r.width / 2 - cw / 2; y = r.top - ch - 22; }
    x = Math.max(12, Math.min(W - cw - 12, x)); y = Math.max(12, Math.min(H - ch - 12, y));
    C.setAttribute("data-l", l); C.style.left = x + "px"; C.style.top = y + "px";
    var s = C.querySelector(".seta");
    if (s) {
      if (l === "esq" || l === "dir") { s.style.left = l === "dir" ? "-22px" : ""; s.style.right = l === "esq" ? "-22px" : ""; s.style.top = Math.max(10, Math.min(ch - 32, r.top + r.height / 2 - y - 11)) + "px"; s.style.bottom = ""; }
      else { s.style.top = l === "baixo" ? "-22px" : ""; s.style.bottom = l === "cima" ? "-22px" : ""; s.style.left = Math.max(10, Math.min(cw - 32, r.left + r.width / 2 - x - 11)) + "px"; s.style.right = ""; }
    }
    // dedo animado junto ao alvo, do lado oposto ao cartão
    DEDO.style.display = "block";
    var dx = 0, dy = 0, fx, fy, ch2 = "";
    if (l === "esq") { ch2 = "👈"; fx = r.right + 6; fy = r.top + r.height / 2 - 12; dx = "6px"; dy = "0"; }
    else if (l === "dir") { ch2 = "👉"; fx = r.left - 30; fy = r.top + r.height / 2 - 12; dx = "-6px"; dy = "0"; }
    else if (l === "baixo") { ch2 = "👇"; fx = r.left + r.width / 2 - 11; fy = r.top - 30; dx = "0"; dy = "6px"; }
    else { ch2 = "👆"; fx = r.left + r.width / 2 - 11; fy = r.bottom + 6; dx = "0"; dy = "-6px"; }
    if (fy < 4 || fy > H - 26 || fx < 4 || fx > W - 26) { DEDO.style.display = "none"; }
    DEDO.textContent = ch2; DEDO.style.left = fx + "px"; DEDO.style.top = fy + "px"; DEDO.style.setProperty("--dx", dx); DEDO.style.setProperty("--dy", dy);
  }
  var TIMER = null;
  function ciclo() {
    if (!EST) return;
    // a triagem do §63 pode ter aberto antes de o guia arrancar: fecha-a
    var tri = document.getElementById("ipr-tri"); if (tri && !tri.hidden && !tri.classList.contains("min")) { var x = tri.querySelector('[data-a63="fechar"]'); if (x) x.click(); }
    var p = passo();
    if (!EST.fim) { var ok = false; try { ok = p.feito && p.feito(); } catch (e) {} if (ok) { if (EST.p >= lista().length - 1) { EST.fim = 1; gravarE(); ULT = ""; } else { avancar(); return; } } }
    posicionar();
  }
  (function arranque(n) {
    if (!document.getElementById("ipe") || !document.querySelector("#ipe-tabs, #ipe-form, #ipe-q")) { if (n < 120) setTimeout(function () { arranque(n + 1); }, 250); return; }
    setTimeout(function () {
      montar();
      while (EST.p < lista().length - 1 && passo().saltar && passo().saltar()) EST.p++;
      entrarPasso();
      TIMER = setInterval(ciclo, 500);
      window.addEventListener("resize", posicionar); window.addEventListener("scroll", posicionar, true);
    }, 900);
  })(0);
})();
