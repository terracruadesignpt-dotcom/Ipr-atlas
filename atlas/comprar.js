/* IPR Atlas · Comprar (pedido do Nuno, 30/10/2026, 17h49: «muito importante que os burros consigam comprar os produtos e
   as subscrições»). Três partes, todas por cima do que o Atlas já faz (não esconde, não tira, não muda nada que exista):
   1. Botão «Comprar» na barra de cima, ao lado da conta (#ipe-user / #ipe-entrar). Abre um painel com a Base Cartográfica,
      a Leitura Territorial, a Planta de Localização e os planos (Explorer e Intelligence), com o preço «desde».
      Escolher um produto leva ao desenho do terreno (ferramenta «Desenhar» do Atlas e separador de encomenda), depois ao
      preço e ao pagamento pelo formulário de encomenda que já existe (#ipe-form, «Enviar pedido»).
   2. Ao fechar um polígono desenhado no mapa (draw.create), um cartão com a área e o preço da Base, da Leitura e da
      Planta para esse terreno, lidos do cálculo do próprio Atlas (#ipe-area, #ipe-preco, #ipe-preco-l, já com a promoção
      do promo.js). Cada linha segue para a encomenda com o terreno. O cartão não volta a abrir sozinho para o mesmo polígono.
   3. Ecrã dos planos: Explorer e Intelligence lado a lado, com o preço e os botões de compra. Ao tocar numa camada ou
      ferramenta fechada (.ipr-it.bl, .ipr-t62-l.tranc, [data-ipr-sim-lock]) aparece, além do que já acontece, um aviso
      pequeno com «Ver planos».
   Preços: window.IPR_PRECOS (módulo m90550, só leitura dos produtos WooCommerce e da tabela do m14473). Sem ele, o «desde»
   vem do formulário de encomenda e os planos levam à página /ipr-cloud/. Nada é inventado: o que não se sabe não aparece.
   Não edita app.js, ajustes.js nem outros add-ons: só DOM, window.__ipe e eventos. Texto escapado (textContent).
   Desligar: ?comprar=0 no endereço, localStorage ipr_comprar_off = 1, ou window.IPR_COMPRAR_OFF = true. */
(function () {
  "use strict";
  if (window.__iprComprar || window.IPR_COMPRAR_OFF) return;
  try { if (new URLSearchParams(location.search).get("comprar") === "0") return; } catch (e) {}
  try { if (localStorage.getItem("ipr_comprar_off") === "1") return; } catch (e) {}
  window.__iprComprar = 1;

  var TX = {
    pt: {
      comprar: "Comprar", comprarT: "Comprar mapas, relatórios e planos",
      titulo: "O que quer comprar?",
      passos: ["Escolher", "Desenhar o terreno", "Ver o preço e pagar"],
      base: "Base Cartográfica", baseT: "Mapas do relevo do seu terreno (LiDAR da DGT), no Atlas e em ficheiros.",
      leitura: "Leitura Territorial", leituraT: "Relatório PDF: o que o terreno permite e o que o condiciona.",
      planta: "Planta de Localização", plantaT: "PDF à escala sobre o ortofotomapa, para a câmara ou o banco.",
      planos: "Explorer e Intelligence", planosT: "Explorer é grátis. Intelligence abre todas as camadas.",
      desde: "desde", gratis: "Grátis", mes: "/mês", ano: "/ano", ou: "ou",
      precoDesenho: "preço ao desenhar", incluida: "incluída na Base",
      semIva: "Preços sem IVA.", entrar: "Já tem conta? Entrar",
      fechar: "Fechar", cancelar: "Cancelar",
      guia: "Passo 2 de 3: toque em cada canto do terreno. Para fechar, toque no primeiro ponto.",
      guiaJa: "Já tem um terreno desenhado. Veja o preço no cartão.",
      plantaComo: "A Planta de Localização faz-se a partir de um projecto seu. Escolha o projecto:",
      plantaSem: "A Planta de Localização vem com a Base Cartográfica. Desenhe o terreno e encomende a Base.",
      semNome: "Terreno sem nome", aCarregar: "A carregar os seus projectos…",
      cTitulo: "O seu terreno", cArea: "Área", cRodape: "Preços sem IVA. O pagamento é no passo seguinte.",
      cBase: "Encomendar", cLeit: "Base + Leitura", cPlanta: "Com a Base",
      escolhido: "escolhido", pacote: "Base e Leitura juntas: mais 10 % de desconto nas duas.",
      sTitulo: "Planos do IPR Atlas",
      exp: "Explorer", expL: ["Mapa do país, ortofotomapa e cadastro", "Pesquisar e desenhar o terreno", "Ficha gratuita do terreno"],
      expB: "Continuar grátis",
      intel: "Intelligence", intelL: ["Condicionantes: REN, RAN, PDM e Rede Natura", "Água, solo, vegetação e risco de incêndio", "Ferramentas de cartografia e projectos guardados"],
      assMes: "Assinar ao mês", assAno: "Assinar ao ano", verPrecos: "Ver preços e assinar",
      jaTem: "Já tem", jaTemTxt: "Já tem o Intelligence nesta conta.",
      agora: "O que tem agora",
      comBase: "Vem 12 meses incluído com qualquer Base Cartográfica.", encBase: "Encomendar a Base",
      sRodape: "Preços sem IVA, sem renovação automática. O Intelligence fica na conta com o e-mail do pagamento.",
      fechada: "Esta parte abre com o IPR Atlas Intelligence.", verPlanos: "Ver planos"
    },
    en: {
      comprar: "Buy", comprarT: "Buy maps, reports and plans",
      titulo: "What would you like to buy?",
      passos: ["Choose", "Draw your plot", "See the price and pay"],
      base: "Base Map", baseT: "Terrain maps of your plot (DGT LiDAR), in the Atlas and as files.",
      leitura: "Land Reading", leituraT: "PDF report: what the plot allows and what constrains it.",
      planta: "Location Plan", plantaT: "Scaled PDF on the orthophoto, for the town hall or the bank.",
      planos: "Explorer and Intelligence", planosT: "Explorer is free. Intelligence opens every layer.",
      desde: "from", gratis: "Free", mes: "/month", ano: "/year", ou: "or",
      precoDesenho: "price when you draw", incluida: "included with the Base",
      semIva: "Prices exclude VAT.", entrar: "Have an account? Sign in",
      fechar: "Close", cancelar: "Cancel",
      guia: "Step 2 of 3: tap each corner of your plot. To close it, tap the first point.",
      guiaJa: "You already have a plot drawn. See the price on the card.",
      plantaComo: "The Location Plan is made from one of your projects. Choose the project:",
      plantaSem: "The Location Plan comes with the Base Map. Draw your plot and order the Base.",
      semNome: "Unnamed site", aCarregar: "Loading your projects…",
      cTitulo: "Your plot", cArea: "Area", cRodape: "Prices exclude VAT. You pay in the next step.",
      cBase: "Order", cLeit: "Base + Reading", cPlanta: "With the Base",
      escolhido: "chosen", pacote: "Base and Reading together: a further 10% off both.",
      sTitulo: "IPR Atlas plans",
      exp: "Explorer", expL: ["Map of the country, orthophoto and cadastre", "Search and draw your plot", "Free plot summary"],
      expB: "Keep using it free",
      intel: "Intelligence", intelL: ["Constraints: REN, RAN, municipal plan and Natura 2000", "Water, soil, vegetation and wildfire hazard", "Mapping tools and saved projects"],
      assMes: "Subscribe monthly", assAno: "Subscribe yearly", verPrecos: "See prices and subscribe",
      jaTem: "You have it", jaTemTxt: "This account already has Intelligence.",
      agora: "What you have now",
      comBase: "Included for 12 months with any Base Map.", encBase: "Order the Base",
      sRodape: "Prices exclude VAT, no automatic renewal. Intelligence goes to the account with the payment e-mail.",
      fechada: "This part opens with IPR Atlas Intelligence.", verPlanos: "See plans"
    }
  };
  function lg() { return (window.IPR_LINGUA || "pt") === "en" ? "en" : "pt"; }
  function t(k) { var v = TX[lg()][k]; return v != null ? v : TX.pt[k]; }

  // ---------- utilitários ----------
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = String(txt); return e; }
  function botao(cls, txt, acc) { var b = el("button", cls, txt); b.type = "button"; if (acc) b.setAttribute("data-cp", acc); return b; }
  function $(id) { return document.getElementById(id); }
  function raiz() { return $("ipe"); }
  function movel() { return window.innerWidth <= 900; }
  function sessao() { return !!window.tcdNonce; }
  function est() { return window.__ipe && window.__ipe.estado || null; }
  function visivel(e) { return !!(e && e.getClientRects().length && getComputedStyle(e).display !== "none"); }
  function sel(v) { return window.CSS && CSS.escape ? CSS.escape(String(v)) : String(v).replace(/["\\]/g, ""); }
  function txt(id) { var e = $(id); return e ? (e.textContent || "").trim() : ""; }
  function num(v) { return typeof v === "number" && isFinite(v) && v >= 0; }
  function eur(v) {
    var s = Number(v).toLocaleString(lg() === "en" ? "en-GB" : "pt-PT", { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 });
    return lg() === "en" ? "€" + s : s + " €";
  }
  function entrarUrl() { return "/conta/?redirect_to=" + encodeURIComponent(location.pathname + location.search); }
  function urlSegura(u, def) { return typeof u === "string" && /^(https?:\/\/[^\s"<>]+|\/(?!\/)[^\s"<>]*)$/.test(u) ? u : def; }
  function esperarPor(fn, limite, feito) {
    var t0 = Date.now();
    (function v() { var r = null; try { r = fn(); } catch (e) {} if (r) { feito(r); return; } if (Date.now() - t0 < (limite || 6000)) setTimeout(v, 150); })();
  }
  function luz(e) {
    if (!e) return;
    try { e.scrollIntoView({ block: "center" }); } catch (x) {}
    e.classList.add("ipr-cp-luz"); clearTimeout(e.__iprCpT); e.__iprCpT = setTimeout(function () { e.classList.remove("ipr-cp-luz"); }, 2600);
  }

  // ---------- preços (nunca inventados) ----------
  function PR() { var p = window.IPR_PRECOS; return p && typeof p === "object" ? p : null; }
  // O formulário de encomenda começa com «desde 99 €»; guarda-se esse texto antes de haver terreno desenhado.
  var DOM_DESDE = { base: "", leitura: "" };
  function lerDesdeDom() {
    var b = txt("ipe-preco"), l = txt("ipe-preco-l");
    if (/^desde\s/i.test(b)) DOM_DESDE.base = b.replace(/^desde\s*/i, "");
    if (/^desde\s/i.test(l)) DOM_DESDE.leitura = l.replace(/^desde\s*/i, "");
  }
  // devolve {v: "99 €", riscado: "250 €"} ou null
  function desde(k) {
    var p = PR();
    if (k === "base") {
      if (p && p.base && num(p.base.desde)) return { v: eur(p.base.desde) };
      lerDesdeDom(); return DOM_DESDE.base ? { v: DOM_DESDE.base } : null;
    }
    if (k === "leitura") {
      if (p && p.leitura && num(p.leitura.desde)) return { v: eur(p.leitura.desde), riscado: num(p.leitura.tabela) ? eur(p.leitura.tabela) : "" };
      lerDesdeDom(); return DOM_DESDE.leitura ? { v: DOM_DESDE.leitura } : null;
    }
    if (k === "intel") {
      var m = p && p.intel && p.intel.mes;
      if (m && num(m.preco)) return { v: eur(m.preco) + t("mes"), riscado: num(m.tabela) ? eur(m.tabela) : "" };
      return null;
    }
    return null;
  }
  function urlPlanos() {
    var p = PR(), s = window.IPR_SIM_BASE;
    return urlSegura(p && p.planos, urlSegura(s && s.planos, "/ipr-cloud/"));
  }

  // ---------- ícones ----------
  var IC = {
    saco: "M5 8h14l-1.2 12H6.2zM9 8V6.5a3 3 0 0 1 6 0V8",
    base: "M12 3l9 5-9 5-9-5zM3 12.5l9 5 9-5M3 16.5l9 5 9-5",
    leitura: "M5 3h11l3 3v15H5zM8 9h8M8 13h8M8 17h5",
    planta: "M6 3h9l4 4v14H6zM15 3v4h4M12.5 17s-2.5-2.4-2.5-4.2a2.5 2.5 0 0 1 5 0c0 1.8-2.5 4.2-2.5 4.2z",
    planos: "M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6-5.3-3-5.3 3 1.2-6L3.4 9.3l6-.7z",
    cad: "M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5z"
  };
  function icone(d, n) {
    var ns = "http://www.w3.org/2000/svg", s = document.createElementNS(ns, "svg"), p = document.createElementNS(ns, "path");
    s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("width", String(n || 18)); s.setAttribute("height", String(n || 18)); s.setAttribute("aria-hidden", "true");
    s.setAttribute("fill", "none"); s.setAttribute("stroke", "currentColor"); s.setAttribute("stroke-width", "1.7"); s.setAttribute("stroke-linejoin", "round"); s.setAttribute("stroke-linecap", "round");
    p.setAttribute("d", d); s.appendChild(p); return s;
  }

  // ---------- estilo ----------
  var F = "Inter,system-ui,-apple-system,'Segoe UI',sans-serif";
  var ESTILO =
    "#ipr-cp-b{display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:0 14px;margin:0 2px;border:0;border-radius:20px;background:var(--ac,#a8b878);color:var(--bg,#121410);font:600 14px/1 " + F + ";cursor:pointer;white-space:nowrap;flex:none;box-shadow:0 1px 0 rgba(0,0,0,.15)}" +
    "#ipr-cp-b:hover{filter:brightness(1.07)}" +
    "#ipr-cp-b:focus-visible,.ipr-cp :focus-visible{outline:2px solid var(--ac2,#cdd6a8);outline-offset:2px}" +
    "#ipr-cp-b[aria-expanded=true]{filter:brightness(.92)}" +
    "@media (max-width:600px){#ipr-cp-b{padding:0 10px;gap:4px;font-size:13px;min-width:40px}}" +
    "@media (max-width:360px){#ipr-cp-b span{display:none}}" +
    ".ipr-cp{font:14px/1.45 " + F + ";color:var(--tx,#ebe7d8);box-sizing:border-box}" +
    ".ipr-cp *{box-sizing:border-box}" +
    ".ipr-cp-pn{position:fixed;z-index:60;top:calc(52px + env(safe-area-inset-top));right:calc(10px + env(safe-area-inset-right));width:360px;max-width:calc(100vw - 20px);max-height:calc(100vh - 70px);overflow:auto;overscroll-behavior:contain;background:var(--p1,#171a13);border:1px solid var(--ln2,#3b4232);border-radius:14px;box-shadow:0 18px 50px rgba(0,0,0,.4);padding:14px}" +
    ".ipr-cp h2{margin:0 34px 8px 0;font:600 17px/1.25 " + F + "}" +
    ".ipr-cp-x{position:absolute;top:8px;right:8px;width:40px;height:40px;border:0;border-radius:10px;background:transparent;color:var(--mu,#a3a690);font:22px/1 " + F + ";cursor:pointer}" +
    ".ipr-cp-x:hover{color:var(--tx,#ebe7d8);background:var(--p3,#252a1f)}" +
    ".ipr-cp-ps{display:flex;gap:6px;margin:0 0 12px;padding:0;list-style:none;font:500 11.5px/1.25 " + F + ";color:var(--mu,#a3a690)}" +
    ".ipr-cp-ps li{flex:1;display:flex;align-items:center;gap:5px}" +
    ".ipr-cp-ps b{flex:none;display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;border:1px solid var(--ln2,#3b4232);font-size:11px}" +
    ".ipr-cp-ps li.on{color:var(--tx,#ebe7d8)}.ipr-cp-ps li.on b{background:var(--ac,#a8b878);border-color:var(--ac,#a8b878);color:var(--bg,#121410)}" +
    ".ipr-cp-l{display:flex;flex-direction:column;gap:8px}" +
    ".ipr-cp-i{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:10px;width:100%;min-height:56px;padding:10px 12px;text-align:left;border:1px solid var(--ln,#2b3024);border-radius:11px;background:var(--p2,#1d2118);color:inherit;cursor:pointer;font:inherit}" +
    ".ipr-cp-i:hover{border-color:var(--ac,#a8b878)}" +
    ".ipr-cp-i>svg{color:var(--ac,#a8b878)}" +
    ".ipr-cp-i b{display:block;font:600 14.5px/1.25 " + F + "}" +
    ".ipr-cp-i small{display:block;margin-top:2px;font:12px/1.35 " + F + ";color:var(--mu,#a3a690)}" +
    ".ipr-cp-p{text-align:right;font:600 13.5px/1.2 " + F + ";white-space:nowrap;color:var(--ac2,#cdd6a8)}" +
    ".ipr-cp-p small{display:block;font-weight:400;font-size:11px;color:var(--mu,#a3a690);margin:0 0 1px}" +
    ".ipr-cp-p s{font-weight:400;color:var(--mu,#a3a690);margin-right:4px}" +
    ".ipr-cp-n{margin:12px 0 0;font:12px/1.4 " + F + ";color:var(--mu,#a3a690)}" +
    ".ipr-cp-n a{color:var(--ac2,#cdd6a8)}" +
    ".ipr-cp-d{margin:10px 0 0;padding:10px;border:1px solid var(--ln,#2b3024);border-radius:10px;background:var(--p2,#1d2118);font-size:13px}" +
    ".ipr-cp-d p{margin:0 0 8px}" +
    ".ipr-cp-a{display:flex;align-items:center;justify-content:center;width:100%;min-height:44px;margin:6px 0 0;padding:8px 12px;border:1px solid var(--ln2,#3b4232);border-radius:10px;background:transparent;color:var(--tx,#ebe7d8);font:600 13.5px/1.25 " + F + ";cursor:pointer;text-decoration:none!important;text-align:center}" +
    ".ipr-cp-a:hover{border-color:var(--ac,#a8b878)}" +
    ".ipr-cp-a.pri{background:var(--ac,#a8b878);border-color:var(--ac,#a8b878);color:var(--bg,#121410)!important}" +
    ".ipr-cp-a.pri:hover{filter:brightness(1.07)}" +
    ".ipr-cp-a small{display:block;font-weight:400;font-size:11.5px;opacity:.8}" +
    // guia do desenho
    ".ipr-cp-gu{position:fixed;z-index:58;left:50%;transform:translateX(-50%);top:calc(60px + env(safe-area-inset-top));width:min(520px,calc(100vw - 20px));display:flex;align-items:center;gap:10px;padding:10px 10px 10px 14px;border-radius:12px;background:var(--p1,#171a13);border:1px solid var(--ac,#a8b878);box-shadow:0 10px 30px rgba(0,0,0,.35);font-weight:500}" +
    ".ipr-cp-gu span{flex:1}" +
    ".ipr-cp-gu .ipr-cp-a{width:auto;margin:0;flex:none}" +
    // cartão do terreno
    ".ipr-cp-ct{position:fixed;z-index:57;left:calc(var(--wl,0px) + 14px);bottom:44px;width:360px;max-width:calc(100vw - 20px);max-height:calc(100vh - 120px);overflow:auto;background:var(--p1,#171a13);border:1px solid var(--ln2,#3b4232);border-radius:14px;box-shadow:0 18px 50px rgba(0,0,0,.4);padding:14px}" +
    ".ipr-cp-ar{display:flex;align-items:baseline;gap:8px;margin:0 0 10px;color:var(--mu,#a3a690);font-size:13px}" +
    ".ipr-cp-ar strong{font:600 20px/1.1 var(--mono,monospace);color:var(--tx,#ebe7d8)}" +
    ".ipr-cp-r{display:grid;grid-template-columns:1fr auto;align-items:center;gap:4px 10px;padding:10px 0;border-top:1px solid var(--ln,#2b3024)}" +
    ".ipr-cp-r b{font:600 14px/1.25 " + F + "}" +
    ".ipr-cp-r b em{font:500 11px/1 " + F + ";font-style:normal;color:var(--bg,#121410);background:var(--ac,#a8b878);border-radius:5px;padding:2px 5px;margin-left:6px;vertical-align:2px}" +
    ".ipr-cp-r .ipr-cp-p{grid-column:1;text-align:left;font-size:14px}" +
    ".ipr-cp-r .ipr-cp-a{grid-column:2;grid-row:1/span 2;width:auto;min-width:118px;margin:0}" +
    // ecrã dos planos
    ".ipr-cp-fu{position:fixed;inset:0;z-index:70;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(10,12,8,.62)}" +
    ".ipr-cp-sb{position:relative;width:min(760px,100%);max-height:calc(100vh - 32px);overflow:auto;overscroll-behavior:contain;background:var(--bg,#121410);border:1px solid var(--ln2,#3b4232);border-radius:16px;padding:18px;box-shadow:0 24px 70px rgba(0,0,0,.5)}" +
    ".ipr-cp-g{display:grid;grid-template-columns:1fr 1fr;gap:16px 12px;margin-top:16px}" +
    ".ipr-cp-pl{position:relative;display:flex;flex-direction:column;padding:16px;border:1px solid var(--ln,#2b3024);border-radius:13px;background:var(--p1,#171a13)}" +
    ".ipr-cp-pl.on{border:2px solid var(--ac,#a8b878)}" +
    ".ipr-cp-pl h3{margin:0 0 4px;font:600 18px/1.2 " + F + "}" +
    ".ipr-cp-pl .ipr-cp-v{margin:0 0 2px;font:600 24px/1.15 " + F + "}" +
    ".ipr-cp-pl .ipr-cp-v s{font-size:15px;font-weight:400;color:var(--mu,#a3a690);margin-right:6px}" +
    ".ipr-cp-pl .ipr-cp-v2{margin:0;font-size:12.5px;color:var(--mu,#a3a690)}" +
    ".ipr-cp-pl ul{margin:12px 0 12px;padding:0 0 0 18px;flex:1;font-size:13.5px}.ipr-cp-pl li{margin:0 0 5px}" +
    ".ipr-cp-et{position:absolute;top:-10px;left:14px;padding:3px 8px;border-radius:5px;background:var(--ac,#a8b878);color:var(--bg,#121410);font:600 11px/1.2 " + F + "}" +
    ".ipr-cp-et.mu{background:var(--p3,#252a1f);color:var(--tx,#ebe7d8);border:1px solid var(--ln2,#3b4232)}" +
    // aviso das partes fechadas
    ".ipr-cp-to{position:fixed;z-index:100000;left:50%;transform:translateX(-50%);bottom:calc(40px + env(safe-area-inset-bottom));width:min(460px,calc(100vw - 20px));display:flex;align-items:center;gap:8px;padding:8px 8px 8px 12px;border-radius:12px;background:var(--p1,#171a13);color:var(--tx,#ebe7d8);border:1px solid var(--ac,#a8b878);box-shadow:0 10px 30px rgba(0,0,0,.4)}" +
    ".ipr-cp-to>svg{flex:none;color:var(--ac,#a8b878)}.ipr-cp-to span{flex:1;font-size:13.5px}" +
    ".ipr-cp-to .ipr-cp-a{width:auto;margin:0;flex:none}" +
    ".ipr-cp-to .ipr-cp-x{position:static;flex:none}" +
    ".ipr-cp-luz{outline:2px solid var(--ac,#a8b878)!important;outline-offset:3px;border-radius:6px}" +
    "@media (max-width:900px){.ipr-cp-ct{left:10px;right:10px;width:auto;max-width:none;bottom:calc(10px + env(safe-area-inset-bottom))}}" +
    "@media (max-width:600px){.ipr-cp-pn{left:10px;right:10px;width:auto}.ipr-cp-g{grid-template-columns:1fr}.ipr-cp-sb{padding:14px}.ipr-cp-fu{padding:10px;align-items:flex-start}.ipr-cp-ps{font-size:11px}}";
  function css() {
    if ($("ipr-cp-css")) return;
    var s = el("style"); s.id = "ipr-cp-css"; s.textContent = ESTILO; document.head.appendChild(s);
  }
  // as camadas de cima ficam dentro do #ipe, para herdar as cores do tema claro ou escuro
  function casa() { return raiz() || document.body; }

  // ---------- caminhos do próprio Atlas ----------
  function fecharEsquerdaMovel() {
    var R = raiz(); if (!movel() || !R || !R.classList.contains("esq-aberto")) return;
    var b = R.querySelector('[data-tool="lado"]'); if (b) b.click();
  }
  function abrirDireita(tab) {
    var R = raiz(), b = R && R.querySelector('.ipe-tab[data-tab="' + sel(tab) + '"]'); if (!b) return false;
    fecharEsquerdaMovel();
    var dir = $("ipe-dir");
    if (!(movel() && b.getAttribute("aria-selected") === "true" && dir && dir.classList.contains("aberto"))) b.click();
    if (!movel() && R.classList.contains("sem-dir")) { var pn = $("ipe-pn"); if (pn) pn.click(); }
    return true;
  }
  function fecharDireitaMovel() {
    var R = raiz(), dir = $("ipe-dir"); if (!movel() || !dir || !dir.classList.contains("aberto")) return;
    var b = R && R.querySelector('.ipe-tab[aria-selected="true"]'); if (b) b.click(); // o próprio Atlas fecha a gaveta assim
  }
  // separador «Base Cartográfica» dentro da encomenda (o mesmo caminho do produtos.js)
  function separadorBase() {
    var sb = [].filter.call(document.querySelectorAll('#ipe [data-pane="enc"] button, #ipe .ipe-tab2 button'), function (b) { return /^(Base Cartogr|Base Map$)/.test(b.textContent.trim()) && visivel(b); })[0];
    if (sb && sb.getAttribute("aria-pressed") !== "true" && sb.getAttribute("aria-selected") !== "true" && !sb.classList.contains("on")) sb.click();
  }
  function areaTexto() { var a = txt("ipe-area"); return /\d/.test(a) && /ha/.test(a) ? a : ""; }
  function haTerreno() { return !!areaTexto(); }
  function ferramentaDesenho() { return document.querySelector('#ipe .ipe-tools [data-tool="desenhar"]') || document.querySelector('#ipe [data-tool="desenhar"]'); }

  // ---------- 1. botão e painel ----------
  var ESCOLHA = null;      // produto escolhido no painel (base, leitura, planta)
  var LT_MINHA = false;    // a caixa «Juntar a Leitura» foi marcada por este ficheiro

  function montarBotao() {
    var R = raiz(); if (!R) return;
    var tr = R.querySelector(".ipe-top .ipe-tr"); if (!tr) return;
    var b = $("ipr-cp-b");
    if (!b) {
      css();
      b = el("button"); b.type = "button"; b.id = "ipr-cp-b";
      b.setAttribute("aria-haspopup", "dialog"); b.setAttribute("aria-expanded", "false"); b.setAttribute("aria-controls", "ipr-cp-pn");
      b.appendChild(icone(IC.saco, 17)); b.appendChild(el("span"));
      b.addEventListener("click", function () { try { if ($("ipr-cp-pn")) fecharPainel(true); else abrirPainel(); } catch (e) {} });
    }
    var sp = b.querySelector("span"); if (sp.textContent !== t("comprar")) sp.textContent = t("comprar");
    if (b.title !== t("comprarT")) { b.title = t("comprarT"); b.setAttribute("aria-label", t("comprarT")); }
    var conta = $("ipe-user") || $("ipe-entrar");
    var antes = conta && conta.parentNode === tr ? conta : ($("ipe-mais") && $("ipe-mais").parentNode === tr ? $("ipe-mais") : null);
    if (b.parentNode !== tr || (antes && b.nextSibling !== antes)) tr.insertBefore(b, antes);
  }

  function passos(n) {
    var ol = el("ol", "ipr-cp-ps");
    t("passos").forEach(function (p, i) { var li = el("li", i + 1 === n ? "on" : ""); li.appendChild(el("b", "", i + 1)); li.appendChild(el("span", "", p)); ol.appendChild(li); });
    return ol;
  }
  function preco(d, alt) {
    var p = el("span", "ipr-cp-p");
    if (d) {
      p.appendChild(el("small", "", t("desde")));
      if (d.riscado) p.appendChild(el("s", "", d.riscado));
      p.appendChild(document.createTextNode(d.v));
    } else p.appendChild(el("small", "", alt || ""));
    return p;
  }
  function item(k, nome, sub, d, alt) {
    var b = botao("ipr-cp-i", null, "p-" + k);
    b.appendChild(icone(IC[k], 20));
    var m = el("span"); m.appendChild(el("b", "", nome)); m.appendChild(el("small", "", sub)); b.appendChild(m);
    b.appendChild(preco(d, alt));
    return b;
  }
  function abrirPainel() {
    css(); fecharTudo();
    var pn = el("div", "ipr-cp ipr-cp-pn"); pn.id = "ipr-cp-pn";
    pn.setAttribute("role", "dialog"); pn.setAttribute("aria-label", t("titulo")); pn.lang = lg();
    var x = botao("ipr-cp-x", "×", "fechar"); x.setAttribute("aria-label", t("fechar")); x.title = t("fechar");
    pn.appendChild(x);
    pn.appendChild(el("h2", "", t("titulo")));
    pn.appendChild(passos(1));
    var l = el("div", "ipr-cp-l");
    l.appendChild(item("base", t("base"), t("baseT"), desde("base"), t("precoDesenho")));
    var dl = desde("leitura"); l.appendChild(item("leitura", t("leitura"), t("leituraT"), dl, t("precoDesenho")));
    var pp = PR() && PR().planta, dp = pp && num(pp.preco) ? { v: eur(pp.preco) } : null;
    l.appendChild(item("planta", t("planta"), t("plantaT"), dp, t("incluida")));
    var di = desde("intel"); l.appendChild(item("planos", t("planos"), t("planosT"), di, di ? "" : t("gratis")));
    pn.appendChild(l);
    var d = el("div", "ipr-cp-d"); d.id = "ipr-cp-pd"; d.hidden = true; pn.appendChild(d);
    var n = el("p", "ipr-cp-n", t("semIva") + " ");
    if (!sessao()) { var a = el("a", "", t("entrar")); a.href = entrarUrl(); n.appendChild(a); }
    pn.appendChild(n);
    pn.addEventListener("click", aoClicarPainel);
    casa().appendChild(pn);
    var b = $("ipr-cp-b"); if (b) b.setAttribute("aria-expanded", "true");
    try { pn.querySelector(".ipr-cp-i").focus(); } catch (e) {}
  }
  function fecharPainel(foco) {
    var pn = $("ipr-cp-pn"); if (pn) pn.remove();
    var b = $("ipr-cp-b"); if (b) { b.setAttribute("aria-expanded", "false"); if (foco) try { b.focus(); } catch (e) {} }
  }
  function aoClicarPainel(e) {
    try {
      var a = e.target.closest("[data-cp]"); if (!a) return;
      var k = a.getAttribute("data-cp");
      if (k === "fechar") { fecharPainel(true); return; }
      if (k === "p-base") { fecharPainel(); comecar("base"); return; }
      if (k === "p-leitura") { fecharPainel(); comecar("leitura"); return; }
      if (k === "p-planos") { fecharPainel(); abrirPlanos(); return; }
      if (k === "p-planta") { planta(); return; }
      if (k === "planta-id") { var id = a.getAttribute("data-v"); fecharPainel(); if (typeof window.__iprPlanta === "function") { fecharEsquerdaMovel(); window.__iprPlanta(id); } return; }
      if (k === "planta-base") { fecharPainel(); comecar("planta"); return; }
    } catch (x) {}
  }
  // Planta: com projectos, o diálogo do Atlas (window.__iprPlanta, ajustes.js); sem projectos, vem com a Base.
  function mapasDaPessoa() {
    var P = est(); if (!P || !P.dados) return null;
    if (P.dados.bloqueado) return [];
    var act = P.modo === "cliente" ? P.actual : null;
    var l = (P.mapas || []).filter(function (m) { return m && m.geojson && (!m.rever || m === act); });
    if (act) l.sort(function (a, b) { return (b === act) - (a === act); });
    return l;
  }
  function planta() {
    var d = $("ipr-cp-pd"); if (!d) return;
    d.textContent = ""; d.hidden = false;
    var ms = sessao() && typeof window.__iprPlanta === "function" ? mapasDaPessoa() : [];
    if (ms === null) { d.appendChild(el("p", "", t("aCarregar"))); return; }
    if (ms.length === 1) { fecharPainel(); fecharEsquerdaMovel(); window.__iprPlanta(ms[0].encomenda || ms[0].id); return; }
    if (ms.length > 1) {
      d.appendChild(el("p", "", t("plantaComo")));
      ms.slice(0, 12).forEach(function (m) {
        var b = botao("ipr-cp-a", m.local || t("semNome"), "planta-id"); b.setAttribute("data-v", String(m.encomenda || m.id));
        if (m.area_ha) b.appendChild(el("small", "", (+m.area_ha).toLocaleString(lg() === "en" ? "en-GB" : "pt-PT", { maximumFractionDigits: 2 }) + " ha"));
        d.appendChild(b);
      });
    } else d.appendChild(el("p", "", t("plantaSem")));
    d.appendChild(botao("ipr-cp-a pri", t("encBase"), "planta-base"));
    try { d.scrollIntoView({ block: "nearest" }); } catch (e) {}
  }

  // passo 2: desenhar o terreno com a ferramenta do Atlas
  function comecar(k) {
    ESCOLHA = k;
    if (haTerreno()) { abrirCartao(true); return; }
    if (!movel()) { abrirDireita("enc"); setTimeout(function () { try { separadorBase(); } catch (e) {} }, 120); }
    else fecharDireitaMovel();
    setTimeout(function () {
      try {
        var f = ferramentaDesenho();
        if (f && f.getAttribute("aria-pressed") !== "true") f.click();
        else if (!f) { var d = $("ipe-desenhar"); if (d) d.click(); }
      } catch (e) {}
      guia();
    }, 200);
  }
  function guia() {
    fecharGuia();
    var g = el("div", "ipr-cp ipr-cp-gu"); g.id = "ipr-cp-gu"; g.setAttribute("role", "status"); g.lang = lg();
    g.appendChild(el("span", "", t("guia")));
    var c = botao("ipr-cp-a", t("cancelar"), "cancelar"); g.appendChild(c);
    c.addEventListener("click", function () { fecharGuia(); ESCOLHA = null; try { var v = document.querySelector('#ipe [data-tool="nav"]'); if (v) v.click(); } catch (e) {} });
    casa().appendChild(g);
    clearTimeout(guia.t); guia.t = setTimeout(fecharGuia, 120000);
  }
  function fecharGuia() { var g = $("ipr-cp-gu"); if (g) g.remove(); }

  // ---------- 2. cartão do terreno ----------
  var VISTOS = {};
  function aoCriar(ev) {
    try {
      fecharGuia();
      if (window.tcdEquipa) return; // a equipa processa sem preço (ajustes.js §14)
      var ids = ((ev && ev.features) || []).map(function (f) { return f && f.id; }).filter(Boolean);
      var novo = ids.filter(function (id) { return !VISTOS[id]; });
      if (ids.length && !novo.length) return;
      novo.forEach(function (id) { VISTOS[id] = 1; });
      // o Atlas recalcula a área e o preço neste mesmo evento; o promo.js corrige a Leitura logo a seguir
      setTimeout(function () { try { abrirCartao(false); } catch (e) {} }, 120);
    } catch (e) {}
  }
  function linha(k, nome, valor, rot, acc) {
    var r = el("div", "ipr-cp-r");
    var b = el("b", "", nome); if (ESCOLHA === k) b.appendChild(el("em", "", t("escolhido")));
    r.appendChild(b);
    r.appendChild(botao("ipr-cp-a" + (ESCOLHA === k || (!ESCOLHA && k === "base") ? " pri" : ""), rot, acc));
    r.appendChild(el("span", "ipr-cp-p", valor));
    return r;
  }
  function abrirCartao(forcar) {
    var area = areaTexto(); if (!area) return;
    var vb = txt("ipe-preco"), vl = txt("ipe-preco-l");
    if (!vb || /^desde\s/i.test(vb)) { if (!forcar) return; }
    css(); fecharCartao();
    var c = el("div", "ipr-cp ipr-cp-ct"); c.id = "ipr-cp-ct"; c.setAttribute("role", "dialog"); c.setAttribute("aria-label", t("cTitulo")); c.lang = lg();
    var x = botao("ipr-cp-x", "×", "fechar"); x.setAttribute("aria-label", t("fechar")); x.title = t("fechar"); c.appendChild(x);
    c.appendChild(el("h2", "", t("cTitulo")));
    c.appendChild(passos(3));
    var ar = el("p", "ipr-cp-ar"); ar.appendChild(el("span", "", t("cArea"))); ar.appendChild(el("strong", "", area)); c.appendChild(ar);
    c.appendChild(linha("base", t("base"), vb, t("cBase"), "c-base"));
    if (vl) c.appendChild(linha("leitura", t("leitura"), vl, t("cLeit"), "c-leitura"));
    var pp = PR() && PR().planta;
    c.appendChild(linha("planta", t("planta"), pp && num(pp.preco) ? eur(pp.preco) : t("incluida"), t("cPlanta"), "c-planta"));
    var p = PR();
    if (p && p.pacote10 && vl) c.appendChild(el("p", "ipr-cp-n", t("pacote")));
    c.appendChild(el("p", "ipr-cp-n", t("cRodape")));
    c.addEventListener("click", function (e) {
      try {
        var a = e.target.closest("[data-cp]"); if (!a) return;
        var k = a.getAttribute("data-cp");
        if (k === "fechar") { fecharCartao(); return; }
        if (k === "c-base" || k === "c-planta") encomendar(false);
        else if (k === "c-leitura") encomendar(true);
      } catch (x) {}
    });
    casa().appendChild(c);
    try { c.querySelector(".ipr-cp-a.pri").focus({ preventScroll: true }); } catch (e) {}
  }
  function fecharCartao() { var c = $("ipr-cp-ct"); if (c) c.remove(); }

  // passo 3: o formulário de encomenda do Atlas, com o terreno já lá; o pagamento segue pelo «Enviar pedido» de sempre
  function encomendar(comLeitura) {
    fecharCartao(); ESCOLHA = null;
    if (!abrirDireita("enc")) { location.href = "/atlas/?modo=encomenda"; return; }
    setTimeout(function () {
      try { separadorBase(); } catch (e) {}
      esperarPor(function () { var f = $("ipe-form"); return f && visivel(f) ? f : null; }, 4000, function (f) {
        try {
          var c = f.querySelector('input[name="leitura"]');
          if (c && comLeitura && !c.checked) { c.click(); LT_MINHA = true; }
          else if (c && !comLeitura && c.checked && LT_MINHA) { c.click(); LT_MINHA = false; }
          var kpi = $("ipe-preco"); kpi = kpi && (kpi.closest(".ipe-kpi") || kpi);
          luz(kpi);
        } catch (e) {}
      });
    }, 150);
  }

  function ligarMapa() {
    var m = window.__ipe && window.__ipe.mapa;
    if (!m || typeof m.on !== "function") { setTimeout(ligarMapa, 400); return; }
    if (m.__iprCp) return; m.__iprCp = 1;
    try { m.on("draw.create", aoCriar); } catch (e) {}
    try { m.on("draw.delete", function () { if (!haTerreno()) fecharCartao(); }); } catch (e) {}
  }

  // ---------- 3. ecrã dos planos ----------
  function abrirPlanos() {
    css(); fecharTudo();
    var fu = el("div", "ipr-cp ipr-cp-fu"); fu.id = "ipr-cp-fu"; fu.lang = lg();
    var sb = el("div", "ipr-cp-sb"); sb.setAttribute("role", "dialog"); sb.setAttribute("aria-modal", "true"); sb.setAttribute("aria-labelledby", "ipr-cp-st");
    var x = botao("ipr-cp-x", "×", "fechar"); x.setAttribute("aria-label", t("fechar")); x.title = t("fechar"); sb.appendChild(x);
    var h = el("h2", "", t("sTitulo")); h.id = "ipr-cp-st"; sb.appendChild(h);
    var g = el("div", "ipr-cp-g");
    var nivel = window.IPR_NIVEL;
    // Explorer
    var e = el("div", "ipr-cp-pl");
    if (nivel !== "intelligence") e.appendChild(el("span", "ipr-cp-et mu", t("agora")));
    e.appendChild(el("h3", "", t("exp"))); e.appendChild(el("p", "ipr-cp-v", t("gratis")));
    var ue = el("ul"); t("expL").forEach(function (s) { ue.appendChild(el("li", "", s)); }); e.appendChild(ue);
    e.appendChild(botao("ipr-cp-a", t("expB"), "fechar"));
    g.appendChild(e);
    // Intelligence
    var i = el("div", "ipr-cp-pl on");
    if (nivel === "intelligence") i.appendChild(el("span", "ipr-cp-et", t("jaTem")));
    i.appendChild(el("h3", "", t("intel")));
    var p = PR(), im = p && p.intel && p.intel.mes, ia = p && p.intel && p.intel.ano;
    if (im && num(im.preco)) {
      var v = el("p", "ipr-cp-v"); if (num(im.tabela)) v.appendChild(el("s", "", eur(im.tabela))); v.appendChild(document.createTextNode(eur(im.preco) + t("mes"))); i.appendChild(v);
      if (ia && num(ia.preco)) { var v2 = el("p", "ipr-cp-v2", t("ou") + " "); if (num(ia.tabela)) v2.appendChild(el("s", "", eur(ia.tabela))); v2.appendChild(document.createTextNode(" " + eur(ia.preco) + t("ano"))); i.appendChild(v2); }
    }
    var ui = el("ul"); t("intelL").forEach(function (s) { ui.appendChild(el("li", "", s)); }); i.appendChild(ui);
    if (nivel === "intelligence") i.appendChild(el("p", "ipr-cp-v2", t("jaTemTxt")));
    else {
      var um = im && urlSegura(im.url, ""), ua = ia && urlSegura(ia.url, "");
      if (um) { var a1 = el("a", "ipr-cp-a pri", t("assMes")); a1.href = um; i.appendChild(a1); }
      if (ua) { var a2 = el("a", "ipr-cp-a" + (um ? "" : " pri"), t("assAno")); a2.href = ua; i.appendChild(a2); }
      if (!um && !ua) { var a3 = el("a", "ipr-cp-a pri", t("verPrecos")); a3.href = urlPlanos(); i.appendChild(a3); }
      i.appendChild(el("p", "ipr-cp-n", t("comBase")));
      i.appendChild(botao("ipr-cp-a", t("encBase"), "s-base"));
    }
    g.appendChild(i);
    sb.appendChild(g);
    var n = el("p", "ipr-cp-n", t("sRodape") + " ");
    if (!sessao()) { var en = el("a", "", t("entrar")); en.href = entrarUrl(); n.appendChild(en); }
    sb.appendChild(n);
    fu.appendChild(sb);
    fu.addEventListener("click", function (ev) {
      try {
        if (ev.target === fu) { fecharPlanos(); return; }
        var a = ev.target.closest("[data-cp]"); if (!a) return;
        var k = a.getAttribute("data-cp");
        if (k === "fechar") fecharPlanos();
        else if (k === "s-base") { fecharPlanos(); comecar("base"); }
      } catch (x2) {}
    });
    casa().appendChild(fu);
    fecharAviso();
    try { (sb.querySelector("a.ipr-cp-a.pri") || x).focus(); } catch (e2) {}
  }
  function fecharPlanos() { var f = $("ipr-cp-fu"); if (f) { f.remove(); var b = $("ipr-cp-b"); if (b) try { b.focus({ preventScroll: true }); } catch (e) {} } }
  function fecharTudo() { fecharPainel(); fecharPlanos(); fecharAviso(); }

  // aviso pequeno ao tocar numa parte fechada (o comportamento do Atlas continua igual)
  var ULT = 0;
  function fechada(alvo) {
    if (!alvo || !alvo.closest) return false;
    if (alvo.closest("#ipr-cp-fu,#ipr-cp-to")) return false;
    if (alvo.closest("[data-ipr-sim-lock]")) return true;
    if (alvo.closest(".ipr-t62-l.tranc")) return true;
    var it = alvo.closest(".ipr-it");
    if (it) {
      var cad = it.querySelector(".ipr-cad");
      if (cad && /Intelligence/i.test(cad.textContent || "")) return true;
    }
    return false;
  }
  function aoTocar(e) {
    try {
      if (!fechada(e.target)) return;
      var agora = Date.now(); if (agora - ULT < 1500) return; ULT = agora;
      setTimeout(aviso, 250);
    } catch (x) {}
  }
  function aviso() {
    if ($("ipr-cp-fu")) return;
    css(); fecharAviso();
    var a = el("div", "ipr-cp ipr-cp-to"); a.id = "ipr-cp-to"; a.setAttribute("role", "status"); a.lang = lg();
    a.appendChild(icone(IC.cad, 18));
    a.appendChild(el("span", "", t("fechada")));
    a.appendChild(botao("ipr-cp-a pri", t("verPlanos"), "ver"));
    var x = botao("ipr-cp-x", "×", "fechar"); x.setAttribute("aria-label", t("fechar")); a.appendChild(x);
    a.addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-cp]"); if (!b) return;
      if (b.getAttribute("data-cp") === "ver") abrirPlanos(); else fecharAviso();
    });
    // por cima de tudo (também dos avisos dos simuladores, que ficam no body)
    document.body.appendChild(a);
    var R = raiz(); if (R) { var cs = getComputedStyle(R); ["--bg", "--p1", "--p2", "--p3", "--ln", "--ln2", "--tx", "--mu", "--ac", "--ac2"].forEach(function (v) { var val = cs.getPropertyValue(v); if (val) a.style.setProperty(v, val.trim()); }); }
    clearTimeout(aviso.t); aviso.t = setTimeout(fecharAviso, 9000);
  }
  function fecharAviso() { var a = $("ipr-cp-to"); if (a) a.remove(); }

  // ---------- teclas, língua e ciclo ----------
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    try {
      if ($("ipr-cp-fu")) { fecharPlanos(); return; }
      if ($("ipr-cp-pn")) { fecharPainel(true); return; }
      if ($("ipr-cp-ct")) { fecharCartao(); return; }
      fecharGuia(); fecharAviso();
    } catch (x) {}
  });
  document.addEventListener("click", aoTocar, true);
  document.addEventListener("pointerup", aoTocar, true); // os interruptores fechados estão desactivados e não dão «click»
  document.addEventListener("click", function (e) {
    try {
      var pn = $("ipr-cp-pn"); if (!pn) return;
      if (e.target.closest && (e.target.closest("#ipr-cp-pn") || e.target.closest("#ipr-cp-b"))) return;
      fecharPainel();
    } catch (x) {}
  });
  document.addEventListener("ipr:lingua", function () {
    try {
      montarBotao();
      if ($("ipr-cp-pn")) abrirPainel();
      if ($("ipr-cp-fu")) abrirPlanos();
      if ($("ipr-cp-ct")) abrirCartao(true);
      if ($("ipr-cp-gu")) guia();
      fecharAviso();
    } catch (e) {}
  });
  // Abrir de fora: window.IPRComprar.planos() / .painel() (outros add-ons podem usar)
  window.IPRComprar = {
    painel: function () { try { abrirPainel(); } catch (e) {} },
    planos: function () { try { abrirPlanos(); } catch (e) {} }
  };

  function ciclo() {
    try { montarBotao(); lerDesdeDom(); } catch (e) {}
    setTimeout(ciclo, $("ipr-cp-b") ? 2000 : 300);
  }
  ciclo();
  ligarMapa();
})();
