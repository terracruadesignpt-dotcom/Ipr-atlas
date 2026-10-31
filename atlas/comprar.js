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
   Decisões do Nuno (30/10/2026, 18h22): a Leitura Territorial leva sempre a Base, e o preço mostrado é o das duas (com o
   pacote −10 % quando o site o diz); o cartão abre também ao escolher parcelas do cadastro (#ipe-plist), uma vez por
   conjunto; a Planta de Localização passa a 19 € quando o m90551 estiver ligado (window.IPR_PRECOS.planta.preco e .rota):
   compra-se para um terreno novo: o limite fica guardado no site e a pessoa segue para o carrinho e o checkout normais
   do WooCommerce. Depois de pagar, «As minhas Plantas» (lista à parte) ou /atlas/?planta=ID abrem o diálogo da Planta
   do Atlas para esse terreno (cookie ipr_planta só enquanto o diálogo está aberto). No cartão há a caixa do pedido expresso
   de entrega imediata (livre resolução, conteúdo digital); sem ela, a Planta fica disponível ao fim dos 14 dias. Quem já tem Bases continua a fazer a
   planta delas como hoje. Sem o m90551, fica «incluída na Base». O total da Leitura + Base usa a tabela do site
   (IPR_PRECOS.tabela) e as regras de arredondamento do m90430; sem ela, soma o que o formulário mostra.
   Preços: window.IPR_PRECOS (módulo m90550, só leitura dos produtos WooCommerce e da tabela do m14473). Sem ele, o «desde»
   vem do formulário de encomenda e os planos levam à página /ipr-cloud/. Nada é inventado: o que não se sabe não aparece.
   Não edita app.js, ajustes.js nem outros add-ons: só DOM, window.__ipe e eventos. Texto escapado (textContent).
   Desligar: ?comprar=0 no endereço, localStorage ipr_comprar_off = 1, ou window.IPR_COMPRAR_OFF = true. */
/* v4 (Nuno, 30/10/2026, 22h15 a 22h17, no iPad): «enganei-me, queria voltar atrás [...] não consigo voltar atrás para
   selecionar outro polígono»; «está exigida conta [...] plantas de localização, leituras e mesmo bases cartográficas não
   é preciso conta»; «apresentar isso mais como horizontal, na base cá em baixo do ecrã».
   a) Cartão com «Mudar o terreno» (fecha o cartão; uma pílula «Ver os preços» volta a abri-lo; mudar as parcelas reabre-o
      sozinho) e «Começar de novo» (limpa o terreno com o #ipe-limpar e volta a ligar o desenho, se era desenho).
   b) Planta sem sessão: segue pelo assistente (window.iprAssistenteComprar), que compra sem conta pelo m90590, com o
      pedido expresso de entrega imediata marcado no cartão. Com sessão continua pelo m90551 (carrinho).
   d) v5 (23h18 a 23h19): os passos «1 Escolher» e «2 Desenhar o terreno» passam a botões para voltar atrás; o cartão não
         faz scroll; a legenda esconde-se com o cartão aberto; ao encomendar o mapa fica só com ortofoto, cadastro e
         toponímia (window.iprModoSimples do assistente.js).
   e) v6 (23h33): o cartão tem pega para arrastar e regulador de transparência (como todos os pop-ups de compra).
   c) No computador o cartão é uma faixa horizontal no fundo do mapa, com os três produtos lado a lado; o botão
      «Comprar passo a passo» esconde-se enquanto o cartão ou a pílula estão abertos. */
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
      leitura: "Leitura Territorial", leituraT: "Relatório PDF do terreno. Leva sempre a Base Cartográfica: o preço é o das duas.",
      leituraC: "Leitura Territorial + Base", leituraSoma: "Base + Leitura",
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
      plantaVende: "Desenhe o terreno ou escolha as parcelas. Paga a planta e faz o PDF logo a seguir, aqui no Atlas. Se encomendar a Base, a planta vem incluída.",
      plantaOutro: "Planta para outro terreno", plantaDesenhar: "Desenhar o terreno", plantaComprar: "Comprar a Planta",
      plantaOu: "ou incluída na Base", mudar: "‹ Voltar: mudar o terreno", limpar: "Começar de novo", verPrecos: "Ver os preços deste terreno", mudarG: "Clique nas parcelas para juntar ou retirar, ou ajuste o desenho. Os preços voltam a aparecer.", novoG: "Terreno limpo. Clique nas parcelas do cadastro ou desenhe o limite.", plantaEntrar: "Para comprar a planta precisa de conta. Entre ou crie a conta e volte a este passo.",
      plantaAEnviar: "A pôr a Planta no carrinho…", plantaErro: "Não foi possível pôr a Planta no carrinho. Tente outra vez ou escreva-nos.",
      minhas: "As minhas Plantas", fazerPdf: "Fazer o PDF", dispA: "disponível a {d}",
      c1: "Peço expressamente a entrega imediata da Planta de Localização (conteúdo digital), antes de terminar o prazo de 14 dias de livre resolução. Sei que perco o direito de livre resolução quando a puder fazer.",
      c1Sem: "Sem esta caixa, a Planta fica disponível no fim dos 14 dias de livre resolução.",
      plantaSemTerreno: "Não encontrei o limite do terreno no mapa. Desenhe-o outra vez.",
      semNome: "Terreno sem nome", aCarregar: "A carregar os seus projectos…",
      cTitulo: "O seu terreno", cArea: "Área", cRodape: "Preços sem IVA. O pagamento é no passo seguinte.",
      cBase: "Encomendar", cLeit: "Base + Leitura", cPlanta: "Com a Base", orcamento: "Pedir orçamento",
      escolhido: "escolhido", pacote: "Base e Leitura juntas: −10 % (com plano IPR Cloud, os 10 % ficam só na Leitura).",
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
      leitura: "Land Reading", leituraT: "PDF report on the plot. It always includes the Base Map: the price is for both.",
      leituraC: "Land Reading + Base", leituraSoma: "Base + Reading",
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
      plantaVende: "Draw your plot or pick the parcels. Pay for the plan and make the PDF straight away, here in the Atlas. If you order the Base, the plan is included.",
      plantaOutro: "Plan for another plot", plantaDesenhar: "Draw the plot", plantaComprar: "Buy the Plan",
      plantaOu: "or included with the Base", mudar: "‹ Back: change the land", limpar: "Start again", verPrecos: "See the prices for this land", mudarG: "Click parcels to add or remove them, or adjust the drawing. The prices come back.", novoG: "Land cleared. Click the cadastral parcels or draw the boundary.", plantaEntrar: "You need an account to buy the plan. Sign in or create one, then come back to this step.",
      plantaAEnviar: "Adding the Plan to your cart…", plantaErro: "The Plan could not be added to your cart. Try again or write to us.",
      minhas: "My Location Plans", fazerPdf: "Make the PDF", dispA: "available on {d}",
      c1: "I expressly request the immediate supply of the Location Plan (digital content), before the 14-day withdrawal period ends. I know that I lose my right of withdrawal once I can make the PDF.",
      c1Sem: "Without this box, the Plan becomes available when the 14-day withdrawal period ends.",
      plantaSemTerreno: "The plot boundary was not found on the map. Please draw it again.",
      semNome: "Unnamed site", aCarregar: "Loading your projects…",
      cTitulo: "Your plot", cArea: "Area", cRodape: "Prices exclude VAT. You pay in the next step.",
      cBase: "Order", cLeit: "Base + Reading", cPlanta: "With the Base", orcamento: "Request a quote",
      escolhido: "chosen", pacote: "Base and Reading together: −10% (with an IPR Cloud plan, the 10% applies to the Reading only).",
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
  function num(v) { return typeof v === "number" && isFinite(v) && v > 0; } // nunca «0 €»
  // promoção com data de fim (AAAA-MM-DD, último dia incluído, hora de Lisboa): passada a data, vale o preço normal
  function promoValida(ate) {
    if (!ate) return true;
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ate)); if (!m) return false;
    return Date.now() < Date.UTC(+m[1], +m[2] - 1, +m[3] + 1, 0, 0, 0); // Lisboa no Inverno = UTC; margem de uma hora no Verão
  }
  // {preco, tabela} já com a promoção resolvida; null se não houver preço válido
  function resolver(o) {
    if (!o || typeof o !== "object") return null;
    var promo = num(o.tabela) && num(o.desde != null ? o.desde : o.preco) && promoValida(o.promo_ate);
    var v = o.desde != null ? o.desde : o.preco;
    if (num(o.tabela) && !promoValida(o.promo_ate)) return { preco: o.tabela, tabela: null };
    if (!num(v)) return null;
    return { preco: v, tabela: promo && o.tabela > v ? o.tabela : null };
  }
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
      var rb = p && resolver(p.base); if (rb) return { v: eur(rb.preco) };
      lerDesdeDom(); return DOM_DESDE.base ? { v: DOM_DESDE.base } : null;
    }
    if (k === "leitura") {
      // a Leitura leva sempre a Base: o «desde» é o das duas juntas (com o pacote −10 % quando o site o diz)
      var rl = p && resolver(p.leitura), rb2 = p && resolver(p.base);
      if (rl && rb2) return { v: eur(somaPacote(rb2.preco, rl.preco)) };
      lerDesdeDom();
      var nb = euros(DOM_DESDE.base), nl = euros(DOM_DESDE.leitura);
      return nb && nl ? { v: eur(somaPacote(nb, nl)) } : null;
    }
    if (k === "planta") {
      var pv = plantaVendida(); return pv ? { v: eur(pv.preco), fixo: 1 } : null;
    }
    if (k === "intel") {
      var m = p && p.intel && resolver(p.intel.mes);
      if (m) return { v: eur(m.preco) + t("mes"), riscado: m.tabela ? eur(m.tabela) : "" };
      return null;
    }
    return null;
  }
  // «1 099 €», «153 € · −50 % até 31/12», «€1,099» -> número; null se não houver valor em euros
  function euros(s) {
    s = String(s || "");
    var m = /([0-9][0-9.,\s\u00a0\u202f]*)\s*€/.exec(s) || /€\s*([0-9][0-9.,\s\u00a0\u202f]*)/.exec(s); if (!m) return null;
    var x = m[1].replace(/[\s\u00a0\u202f]/g, "");
    if (/,\d{1,2}$/.test(x)) x = x.replace(/\./g, "").replace(",", "."); // 1.099,50
    else x = x.replace(/[.,](?=\d{3}(\D|$))/g, "");                       // 1.099 ou 1,099
    var v = parseFloat(x); return isFinite(v) && v > 0 ? v : null;
  }
  function r2(v) { return Math.round(v * 100) / 100; }
  // Conta do terreno como o servidor: tabela do m14473 (window.IPR_PRECOS.tabela, do m90550), interpolação igual ao
  // tcd_preco() e ao c() do app.js, arredondada ao euro; Leitura a metade ao cêntimo como o m90430, enquanto a promoção durar.
  function tabelaPreco(ha, col) {
    var p = PR(), tb = p && Array.isArray(p.tabela) ? p.tabela : null;
    if (!tb || !tb.length || !(ha > 0)) return null;
    if (ha <= tb[0][0]) return tb[0][col];
    for (var i = 1; i < tb.length; i++) if (ha <= tb[i][0]) return Math.round(tb[i - 1][col] + (ha - tb[i - 1][0]) * (tb[i][col] - tb[i - 1][col]) / (tb[i][0] - tb[i - 1][0]));
    return null; // acima do último escalão: sob consulta
  }
  function leituraMeia() { var p = PR(); return !!(p && p.leitura_meia && promoValida(p.leitura && p.leitura.promo_ate)); }
  function totalLeituraBase(ha) {
    var b = tabelaPreco(ha, 1), l = tabelaPreco(ha, 2);
    if (!num(b) || !num(l)) return null;
    if (leituraMeia()) l = r2(l / 2);
    return somaPacote(b, l);
  }
  // «12,5 ha», «1 234,56 ha», «12.5 ha» -> número
  function haNum(s) {
    var m = /([0-9][0-9.,\s\u00a0\u202f]*)\s*ha/.exec(String(s || "")); if (!m) return null;
    var x = m[1].replace(/[\s\u00a0\u202f]/g, "");
    if (/,/.test(x)) x = x.replace(/\./g, "").replace(",", ".");          // pt-PT: 1.234,5 ou 1 234,56
    else if (/\.\d{3}(\.|$)/.test(x)) x = x.replace(/\./g, "");          // 1.234 (milhares, sem decimais)
    var v = parseFloat(x); return isFinite(v) && v > 0 ? v : null;
  }
  // Base + Leitura: o m90430 tira 10 % a cada linha quando vão juntas (pacote ligado); sem essa informação, soma simples
  function somaPacote(b, l) { var p = PR(); return p && p.pacote10 ? r2(r2(b * 0.9) + r2(l * 0.9)) : r2(b + l); }
  // Planta à venda (m90551 ligado): preço e rota de encomenda vêm do site; senão, null e fica «incluída na Base»
  function plantaVendida() {
    var p = PR(), pl = p && p.planta;
    if (!pl || !num(pl.preco) || !urlSegura(pl.rota, "")) return null;
    return { preco: pl.preco, rota: pl.rota, minhas: urlSegura(pl.minhas, "") };
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
    "@media (max-width:480px){#ipr-cp-b{width:40px;padding:0;justify-content:center;margin:0 0 0 2px}#ipr-cp-b span{display:none}}" +
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
    ".ipr-cp-c1{display:flex;gap:8px;align-items:flex-start;margin:10px 0 0;font-size:12.5px;line-height:1.4;cursor:pointer}" +
    ".ipr-cp-c1 input{flex:none;width:20px;height:20px;margin:1px 0 0;accent-color:var(--ac,#a8b878)}" +
    ".ipr-cp-a:disabled{opacity:.6;cursor:default}" +
    ".ipr-cp-luz{outline:2px solid var(--ac,#a8b878)!important;outline-offset:3px;border-radius:6px}" +
    ".ipr-cp-ps li.vai{cursor:pointer;border-radius:6px}.ipr-cp-ps li.vai:hover,.ipr-cp-ps li.vai:focus-visible{background:rgba(148,190,57,.14);outline:none}.ipr-cp-ps li.vai span{text-decoration:underline;text-underline-offset:3px}" +
    "html:has(#ipr-cp-ct) #tcdfmb,html:has(#ipr-cp-ct) #ipr-as-b{display:none!important}@media (max-width:900px){html:has(#ipr-cp-ct) #ipe .ipe-dir{visibility:hidden!important}.ipr-cp-ct{max-height:calc(100dvh - 70px)!important;overflow-y:auto}}" +
    "html:has(#ipr-cp-ct) #ipr-lgd,html:has(#ipr-cp-vt) #ipr-lgd{display:none!important}" +
    ".ipr-cp-ct>.ipr-jan{position:absolute;top:8px;right:50px;margin:0}.ipr-cp-ct>h2{padding-right:150px}" +
    ".ipr-cp-nv{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 8px}.ipr-cp-nv .ipr-cp-a{width:auto;min-height:36px;margin:0;padding:6px 12px;font-size:12.5px}" +
    ".ipr-cp-vt{position:fixed;z-index:57;left:50%;transform:translateX(-50%);top:calc(58px + env(safe-area-inset-top));display:flex;align-items:center;gap:10px;max-width:calc(100vw - 20px);padding:8px 8px 8px 14px;border:1px solid var(--ac,#94BE39);border-radius:10px;background:var(--p1,#171a13);box-shadow:0 10px 30px rgba(0,0,0,.45);font:13px/1.35 " + F + ";color:var(--tx,#ebe7d8)}" +
    ".ipr-cp-vt .ipr-cp-a{width:auto;margin:0;flex:none;min-height:38px}.ipr-cp-vt .ipr-cp-x{position:static;flex:none;width:34px;height:34px}" +
    "body:has(#ipr-cp-ct) #ipr-as-b,body:has(#ipr-cp-vt) #ipr-as-b{display:none!important}" +
    "@media (min-width:901px){#ipe.ipr-cp-foco{--wl:0px!important;--wr:0px!important;grid-template-columns:0 minmax(0,1fr) 0!important}#ipe.ipr-cp-foco .ipe-esq,#ipe.ipr-cp-foco .ipe-dir{visibility:hidden!important;border:0!important}#ipe.ipr-cp-foco .ipr-px-wl,#ipe.ipr-cp-foco .ipr-px-wr{display:none!important}" +
    ".ipr-cp-ct{left:calc(var(--wl,0px) + 14px);right:calc(var(--wr,0px) + 196px);width:auto;max-width:1120px;max-height:min(46vh,430px);display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-flow:row dense;column-gap:18px;padding:12px 16px}" +
    ".ipr-cp-ct{max-height:calc(100vh - 130px)!important}.ipr-cp-ct>*{grid-column:1/-1}.ipr-cp-ct>h2{grid-column:1;margin:0;align-self:center}.ipr-cp-ct>.ipr-cp-ar{grid-column:2/-1;justify-self:end;align-self:center;margin:0 150px 0 0}" +
    ".ipr-cp-ct>.ipr-cp-r{grid-column:auto;align-self:stretch;padding:10px 0;min-width:0;grid-template-columns:minmax(0,1fr);align-content:start}.ipr-cp-ct>.ipr-cp-r>b,.ipr-cp-ct>.ipr-cp-r>.ipr-cp-p{grid-column:1;min-width:0}.ipr-cp-ct>.ipr-cp-r .ipr-cp-a{grid-column:1;grid-row:3;width:100%;min-width:0;margin-top:6px}.ipr-cp-ct>.ipr-cp-n,.ipr-cp-ct>.ipr-cp-c1{margin-top:8px}}" +
    "@media (max-width:900px){.ipr-cp-ct{left:10px;right:10px;width:auto;max-width:none;bottom:calc(10px + env(safe-area-inset-bottom))}}" +
    "@media (max-width:600px){.ipr-cp-pn{left:10px;right:10px;width:auto}.ipr-cp-g{grid-template-columns:1fr}.ipr-cp-sb{padding:14px}.ipr-cp-fu{padding:10px;align-items:flex-start}.ipr-cp-ps{font-size:11px}}";
  function css() {
    if ($("ipr-cp-css")) return;
    var s = el("style"); s.id = "ipr-cp-css"; s.textContent = ESTILO + JAN_CSS; document.head.appendChild(s);
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
    // uma vez, no fim do grupo (depois do último botão que já lá está): não muda a ordem dos outros nem é reposicionado
    if (!b.isConnected) tr.appendChild(b);
  }

  function passos(n) {
    var ol = el("ol", "ipr-cp-ps");
    t("passos").forEach(function (p, i) { var li = el("li", i + 1 === n ? "on" : ""); li.appendChild(el("b", "", i + 1)); li.appendChild(el("span", "", p)); ol.appendChild(li); });
    return ol;
  }
  function preco(d, alt) {
    var p = el("span", "ipr-cp-p");
    if (d) {
      if (!d.fixo) p.appendChild(el("small", "", t("desde")));
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
    l.appendChild(item("planta", t("planta"), t("plantaT"), desde("planta"), t("incluida")));
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
      if (k === "planta-nova") { fecharPainel(); comecar("planta"); return; }
      if (k === "planta-paga") { abrirPlantaPaga(a.getAttribute("data-v")); return; }
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
    var pv = plantaVendida();
    // quem já tem Bases continua a fazer a planta delas como hoje (incluída); a compra é só para outro terreno
    if (ms.length === 1 && !pv) { fecharPainel(); fecharEsquerdaMovel(); window.__iprPlanta(ms[0].encomenda || ms[0].id); return; }
    if (ms.length > 1 || (ms.length === 1 && pv)) {
      d.appendChild(el("p", "", t("plantaComo")));
      ms.slice(0, 12).forEach(function (m) {
        var b = botao("ipr-cp-a", m.local || t("semNome"), "planta-id"); b.setAttribute("data-v", String(m.encomenda || m.id));
        if (m.area_ha) b.appendChild(el("small", "", (+m.area_ha).toLocaleString(lg() === "en" ? "en-GB" : "pt-PT", { maximumFractionDigits: 2 }) + " ha"));
        d.appendChild(b);
      });
      if (pv) d.appendChild(botao("ipr-cp-a pri", t("plantaOutro") + " · " + eur(pv.preco), "planta-nova"));
    } else if (pv) {
      d.appendChild(el("p", "", t("plantaVende")));
      d.appendChild(botao("ipr-cp-a pri", t("plantaDesenhar"), "planta-nova"));
    } else d.appendChild(el("p", "", t("plantaSem")));
    if (!ms.length || !pv) d.appendChild(botao("ipr-cp-a" + (pv ? "" : " pri"), t("encBase"), "planta-base"));
    if (pv && pv.minhas && sessao()) minhasPlantas(d, pv.minhas);
    try { d.scrollIntoView({ block: "nearest" }); } catch (e) {}
  }
  // «As minhas Plantas»: as compradas, numa lista à parte (não entram nos projectos do Atlas)
  function minhasPlantas(d, url) {
    fetch(url, { credentials: "same-origin", headers: { "X-WP-Nonce": window.tcdNonce || "" } }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      var l = j && Array.isArray(j.plantas) ? j.plantas : [];
      if (!l.length || !d.isConnected) return;
      var w = el("div"); w.appendChild(el("p", "", t("minhas")));
      l.slice(0, 12).forEach(function (x) {
        var id = String(x.id || "").replace(/\D/g, ""); if (!id) return;
        var disp = x.disponivel !== false;
        var b = botao("ipr-cp-a", (x.local || t("semNome")) + " · " + (disp ? t("fazerPdf") : t("dispA").replace("{d}", String(x.desde || "").split("-").reverse().join("/"))), "planta-paga"); b.setAttribute("data-v", id);
        if (!disp) b.disabled = true;
        if (num(x.area_ha)) b.appendChild(el("small", "", (+x.area_ha).toLocaleString(lg() === "en" ? "en-GB" : "pt-PT", { maximumFractionDigits: 2 }) + " ha · #" + (x.numero || id)));
        w.appendChild(b);
      });
      d.insertBefore(w, d.firstChild);
    }).catch(function () {});
  }
  // Abre o diálogo da Planta do Atlas para uma Planta paga: o cookie ipr_planta diz ao m90551 para o /meus-mapas devolver
  // esse terreno enquanto o diálogo estiver aberto; apaga-se quando o diálogo fecha (ou ao fim de 15 minutos).
  function limparCookiePlanta() { try { document.cookie = "ipr_planta=; path=/; max-age=0; SameSite=Lax"; } catch (e) {} }
  function abrirPlantaPaga(id) {
    id = String(id || "").replace(/\D/g, "");
    if (!id || typeof window.__iprPlanta !== "function") return false;
    try { document.cookie = "ipr_planta=" + id + "; path=/; max-age=900; SameSite=Lax" + (location.protocol === "https:" ? "; Secure" : ""); } catch (e) {}
    fecharPainel(); fecharEsquerdaMovel();
    window.__iprPlanta(id);
    var n = 0;
    (function v() { if ($("ipr-pl") || n++ < 5) { setTimeout(v, 1000); return; } limparCookiePlanta(); })();
    return true;
  }
  // Volta do pagamento: /atlas/?planta=ID abre o diálogo dessa Planta quando o Atlas estiver pronto
  function plantaDoEndereco() {
    var id = null; try { id = new URLSearchParams(location.search).get("planta"); } catch (e) {}
    if (!id || !/^\d{1,12}$/.test(id) || !plantaVendida()) return;
    esperarPor(function () { var P = est(); return sessao() && typeof window.__iprPlanta === "function" && P && P.dados; }, 20000, function () { abrirPlantaPaga(id); });
  }

  // passo 2: desenhar o terreno com a ferramenta do Atlas
  function comecar(k) {
    ESCOLHA = k; simples(true);
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
      // o Atlas recalcula a área e o preço neste mesmo evento; o promo.js corrige a Leitura logo a seguir
      setTimeout(function () { try { if (abrirCartao(false)) novo.forEach(function (id) { VISTOS[id] = 1; }); } catch (e) {} }, 250);
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
    var area = areaTexto(); if (!area) return false;
    // o assistente mandou a pessoa para o formulário da Base: o cartão não se abre por cima dele (31/10, ronda de lançamento)
    if (!forcar && (window.__iprFormAte || 0) > Date.now()) return false;
    var vb = txt("ipe-preco"), vl = txt("ipe-preco-l");
    if (!vb || /^desde\s/i.test(vb)) { if (!forcar) return false; }
    css(); fecharCartao(); fecharPilula();
    var c = el("div", "ipr-cp ipr-cp-ct"); c.id = "ipr-cp-ct"; c.setAttribute("role", "dialog"); c.setAttribute("aria-label", t("cTitulo")); c.lang = lg();
    var x = botao("ipr-cp-x", "×", "fechar"); x.setAttribute("aria-label", t("fechar")); x.title = t("fechar"); c.appendChild(x);
    c.appendChild(el("h2", "", t("cTitulo")));
    var ps = passos(3); c.appendChild(ps);
    [].forEach.call(ps.children, function (li, i) {
      if (i > 1) return;
      li.classList.add("vai"); li.setAttribute("role", "button"); li.tabIndex = 0;
      var ir = function () { if (i === 0) { fecharCartao(true); simples(false); try { abrirPainel(); } catch (e) {} } else mudarTerreno(false); };
      li.addEventListener("click", ir); li.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); ir(); } });
    });
    var nv = el("div", "ipr-cp-nv"); nv.appendChild(botao("ipr-cp-a", t("mudar"), "mudar")); nv.appendChild(botao("ipr-cp-a", t("limpar"), "limpar")); c.appendChild(nv);
    var ar = el("p", "ipr-cp-ar"); ar.appendChild(el("span", "", t("cArea"))); ar.appendChild(el("strong", "", area)); c.appendChild(ar);
    // acima de 5000 ha o Atlas escreve «sob consulta» (sem €): pede-se orçamento pelo mesmo formulário
    var consulta = !/\d\s*€|€\s*\d/.test(vb);
    c.appendChild(linha("base", t("base"), vb, consulta ? t("orcamento") : t("cBase"), "c-base"));
    // Leitura: leva sempre a Base; mostra-se o total das duas para esta área (pacote −10 % quando o site o diz)
    // com a tabela do site faz-se a conta exacta (cêntimos como o servidor); sem ela, soma-se o que o formulário mostra
    var nb = euros(vb), nl = euros(vl), tot = totalLeituraBase(haNum(area));
    if (tot == null && nb && nl) tot = somaPacote(nb, nl);
    if (vl) c.appendChild(linha("leitura", t("leituraC"), consulta || tot == null ? vl : eur(tot), consulta ? t("orcamento") : t("cLeit"), "c-leitura"));
    var pv = plantaVendida();
    if (pv) {
      var lp = linha("planta", t("planta"), eur(pv.preco), t("plantaComprar"), "c-planta-comprar"); lp.querySelector(".ipr-cp-p").appendChild(el("small", "", t("plantaOu"))); c.appendChild(lp);
      // livre resolução: pedido expresso de entrega imediata (conteúdo digital); sem ele, a Planta espera os 14 dias.
      // Sem sessão a compra segue pelo assistente, que pergunta isto no passo dos dados (bateria de ecrãs, 30/10 23h45:
      // no telemóvel o cartão saía do ecrã); com sessão segue pelo carrinho (m90551) e a caixa fica aqui.
      if (sessao() || typeof window.iprAssistenteComprar !== "function") {
        var ck = el("label", "ipr-cp-c1"), ci = el("input"); ci.type = "checkbox"; ci.id = "ipr-cp-c1";
        ck.appendChild(ci); ck.appendChild(el("span", "", t("c1"))); c.appendChild(ck);
        c.appendChild(el("p", "ipr-cp-n", t("c1Sem")));
      }
    }
    else c.appendChild(linha("planta", t("planta"), t("incluida"), t("cPlanta"), "c-planta"));
    var msg = el("p", "ipr-cp-n"); msg.id = "ipr-cp-msg"; msg.setAttribute("aria-live", "polite"); msg.hidden = true; c.appendChild(msg);
    var p = PR();
    if (p && p.pacote10 && vl && !consulta) c.appendChild(el("p", "ipr-cp-n", t("pacote")));
    c.appendChild(el("p", "ipr-cp-n", t("cRodape")));
    c.addEventListener("click", function (e) {
      try {
        var a = e.target.closest("[data-cp]"); if (!a) return;
        var k = a.getAttribute("data-cp");
        if (k === "fechar") { fecharCartao(); return; }
        if (k === "mudar") { mudarTerreno(false); return; }
        if (k === "limpar") { mudarTerreno(true); return; }
        if (k === "c-planta-comprar") { comprarPlanta(a); return; }
        if (k === "c-base" || k === "c-planta") encomendar(false);
        else if (k === "c-leitura") encomendar(true);
      } catch (x) {}
    });
    casa().appendChild(c); foco(true); simples(true);
    try { janela(c, "cartao", c, null); } catch (e) {}
    try { c.querySelector(".ipr-cp-a.pri").focus({ preventScroll: true }); } catch (e) {}
    return true;
  }
  // Janela móvel (Nuno, 30/10/2026, 23h33: «sempre que aparece um pop-up, tem que dar para fechar, voltar atrás, mover no
  // ecrã [...] e um regulador de transparência»). Acrescenta ao cabeçalho uma pega para arrastar e um regulador de
  // transparência; a posição e a transparência ficam lembradas neste navegador (localStorage, falha em silêncio).
  function janela(p, chave, onde, antes) {
    if (!p || !onde || p.querySelector(".ipr-jan")) return;
    var K = "ipr_jan_" + chave, G = {}; try { G = JSON.parse(localStorage.getItem(K) || "{}") || {}; } catch (e) { G = {}; }
    var w = document.createElement("span"); w.className = "ipr-jan";
    var pg = document.createElement("button"); pg.type = "button"; pg.className = "ipr-jan-m"; pg.title = pg.ariaLabel = JAN_T().mover;
    pg.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 2l3 3h-2v4h4V7l3 3-3 3v-2h-4v4h2l-3 3-3-3h2v-4H7v2l-3-3 3-3v2h4V5H9z"/></svg>';
    var op = document.createElement("input"); op.type = "range"; op.min = "35"; op.max = "100"; op.step = "5"; op.className = "ipr-jan-o";
    op.title = op.ariaLabel = JAN_T().transp; op.value = String(G.o || 100);
    w.appendChild(pg); w.appendChild(op);
    if (antes && antes.parentNode === onde) onde.insertBefore(w, antes); else onde.appendChild(w);
    function aplicarO() { p.style.opacity = String(Math.max(35, Math.min(100, +op.value || 100)) / 100); }
    function guardar() { try { localStorage.setItem(K, JSON.stringify(G)); } catch (e) {} }
    op.addEventListener("input", function () { G.o = +op.value; aplicarO(); guardar(); });
    ["pointerdown", "mousedown", "touchstart", "keydown", "click", "wheel"].forEach(function (ev) { op.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true }); });
    aplicarO();
    function por(x, y) {
      var par = p.offsetParent || document.body, pr = par === document.body ? { left: 0, top: 0 } : par.getBoundingClientRect();
      var b = p.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight;
      x = Math.max(4 - b.width + 80, Math.min(vw - 80, x)); y = Math.max(0, Math.min(vh - 48, y));
      var st = p.style;
      st.setProperty("left", Math.round(x - pr.left) + "px", "important"); st.setProperty("top", Math.round(y - pr.top) + "px", "important");
      st.setProperty("right", "auto", "important"); st.setProperty("bottom", "auto", "important"); st.setProperty("transform", "none", "important");
      st.setProperty("width", Math.round(b.width) + "px", "important"); st.setProperty("max-width", "none", "important");
      p.__iprMovido = 1;
    }
    if (G.x != null && G.y != null && !(window.innerWidth <= 900)) setTimeout(function () { try { por(G.x, G.y); } catch (e) {} }, 0);
    var A = null;
    pg.addEventListener("pointerdown", function (e) {
      e.preventDefault(); e.stopPropagation();
      var b = p.getBoundingClientRect(); A = { dx: e.clientX - b.left, dy: e.clientY - b.top };
      try { pg.setPointerCapture(e.pointerId); } catch (x) {}
    });
    pg.addEventListener("pointermove", function (e) { if (!A) return; e.preventDefault(); por(e.clientX - A.dx, e.clientY - A.dy); });
    function fim(e) { if (!A) return; A = null; var b = p.getBoundingClientRect(); G.x = Math.round(b.left); G.y = Math.round(b.top); guardar(); try { pg.releasePointerCapture(e.pointerId); } catch (x) {} }
    pg.addEventListener("pointerup", fim); pg.addEventListener("pointercancel", fim);
    // com o teclado: setas movem 20 px
    pg.addEventListener("keydown", function (e) {
      var d = { ArrowLeft: [-20, 0], ArrowRight: [20, 0], ArrowUp: [0, -20], ArrowDown: [0, 20] }[e.key]; if (!d) return;
      e.preventDefault(); var b = p.getBoundingClientRect(); por(b.left + d[0], b.top + d[1]); G.x = Math.round(b.left + d[0]); G.y = Math.round(b.top + d[1]); guardar();
    });
    // duplo toque na pega: volta ao sítio de origem
    pg.addEventListener("dblclick", function () { G = { o: G.o }; guardar(); ["left", "top", "right", "bottom", "transform", "width", "max-width"].forEach(function (k) { p.style.removeProperty(k); }); p.__iprMovido = 0; if (typeof window.__iprJanReposta === "function") try { window.__iprJanReposta(p); } catch (x) {} });
  }
  function JAN_T() { return (document.documentElement.lang || "").indexOf("en") === 0 || (window.IPR_LINGUA === "en") ? { mover: "Move (double-tap to reset)", transp: "Transparency" } : { mover: "Mover (duplo toque repõe)", transp: "Transparência" }; }
  var JAN_CSS = ".ipr-jan{display:inline-flex;align-items:center;gap:6px;margin-left:auto;margin-right:4px;flex:none}" +
    ".ipr-jan-m{all:unset;box-sizing:border-box;cursor:grab;touch-action:none;display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:6px;color:#9AA088;border:1px solid transparent}" +
    ".ipr-jan-m:hover,.ipr-jan-m:focus-visible{color:#E4E2D8;border-color:#2E3A26;outline:none}.ipr-jan-m:active{cursor:grabbing}" +
    ".ipr-jan-o{width:64px;height:20px;accent-color:#94BE39;cursor:pointer;margin:0;touch-action:pan-x}" +
    "@media (max-width:560px){.ipr-jan-o{width:48px}}";

  function fecharCartao(manter) { var c = $("ipr-cp-ct"); if (c) c.remove(); foco(false); if (!manter && !$("ipr-cp-vt")) simples(false); }
  window.iprFecharCartao = function () { try { fecharCartao(true); fecharPilula(); } catch (e) {} };
  // só ortofoto, cadastro e toponímia enquanto se escolhe o terreno e o produto (Nuno, 30/10, 23h19)
  function simples(on) { try { if (typeof window.iprModoSimples === "function") window.iprModoSimples(!!on); } catch (e) {} }
  // enquanto o cartão está aberto, o mapa fica com a largura toda (Nuno, 30/10, 22h13: «não precisa de mostrar os blocos laterais»)
  function foco(on) {
    var R = raiz(); if (!R || R.classList.contains("ipr-cp-foco") === !!on) return;
    R.classList.toggle("ipr-cp-foco", !!on);
    [60, 320].forEach(function (ms) { setTimeout(function () { try { var m = window.__ipe && window.__ipe.mapa; if (m) m.resize(); } catch (e) {} }, ms); });
  }
  // «Mudar o terreno» / «Começar de novo»: o cartão sai da frente; mudar as parcelas volta a abri-lo sozinho
  function mudarTerreno(limpar) {
    fecharCartao(true); VISTOS = {}; VISTOS_P = {}; simples(true);
    if (limpar) {
      var P = est(), parcelas = !!(P && P.tool === "parcelas") || !!conjuntoParcelas();
      var l = $("ipe-limpar"); if (l && !l.disabled) try { l.click(); } catch (e) {}
      if (!parcelas) setTimeout(function () { try { var f = ferramentaDesenho(); if (f && f.getAttribute("aria-pressed") !== "true") f.click(); } catch (e) {} }, 150);
      pilula(t("novoG"), false);
    } else pilula(t("mudarG"), true);
  }
  function fecharPilula(fim) { var p = $("ipr-cp-vt"); if (p) p.remove(); if (fim && !$("ipr-cp-ct")) simples(false); }
  function pilula(texto, verPrecos) {
    css(); fecharPilula();
    var p = el("div", "ipr-cp ipr-cp-vt"); p.id = "ipr-cp-vt"; p.setAttribute("role", "status"); p.lang = lg();
    p.appendChild(el("span", "", texto));
    if (verPrecos) { var v = botao("ipr-cp-a pri", t("verPrecos"), "ver"); v.addEventListener("click", function () { fecharPilula(); abrirCartao(true); }); p.appendChild(v); }
    var x = botao("ipr-cp-x", "×", "fechar"); x.setAttribute("aria-label", t("fechar")); x.addEventListener("click", function () { fecharPilula(true); }); p.appendChild(x);
    casa().appendChild(p);
    clearTimeout(pilula.t); pilula.t = setTimeout(function () { if (!haTerreno()) fecharPilula(); }, 90000);
  }

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
          else if (c && !comLeitura && c.checked) { c.click(); LT_MINHA = false; } // o total bate com o cartão
          var kpi = $("ipe-preco"); kpi = kpi && (kpi.closest(".ipe-kpi") || kpi);
          luz(kpi);
        } catch (e) {}
      });
    }, 150);
  }

  // Limite do terreno tal como está no mapa (desenhado ou parcelas do cadastro): os polígonos da fonte do desenho
  function terreno() {
    var m = window.__ipe && window.__ipe.mapa, st = null;
    try { st = m && m.getStyle && m.getStyle(); } catch (e) {}
    var fs = [];
    ["mapbox-gl-draw-cold", "mapbox-gl-draw-hot"].forEach(function (k) {
      var src = st && st.sources && st.sources[k], d = src && src.data;
      ((d && d.features) || []).forEach(function (f) {
        var g = f && f.geometry; if (!g || (g.type !== "Polygon" && g.type !== "MultiPolygon")) return;
        if (f.properties && f.properties.meta && f.properties.meta !== "feature") return;
        var id = f.properties && f.properties.id;
        if (id && fs.some(function (x) { return x.properties.id === id; })) return; // o mesmo polígono nas duas fontes
        fs.push({ type: "Feature", properties: { id: id || null }, geometry: g });
      });
    });
    return fs.length ? { type: "FeatureCollection", features: fs } : null;
  }
  function msgCartao(s) { var m = $("ipr-cp-msg"); if (m) { m.textContent = s; m.hidden = !s; } }
  // Compra da Planta (m90551): guarda o limite do terreno no site e segue para o carrinho e o checkout normais do
  // WooCommerce (NIF, morada, termos e livre resolução), com a Planta já no carrinho.
  function comprarPlanta(b) {
    var pv = plantaVendida(); if (!pv) return;
    if (!sessao() && typeof window.iprAssistenteComprar === "function") {
      var c1 = !!($("ipr-cp-c1") && $("ipr-cp-c1").checked);
      fecharCartao();
      if (window.iprAssistenteComprar("planta", { c1: c1 })) return;
    }
    if (!sessao()) { msgCartao(t("plantaEntrar")); var a = el("a", "ipr-cp-a pri", t("entrar")); a.href = entrarUrl(); var m = $("ipr-cp-msg"); if (m) m.appendChild(a); return; }
    var gj = terreno(); if (!gj) { msgCartao(t("plantaSemTerreno")); return; }
    if (b) b.disabled = true; msgCartao(t("plantaAEnviar"));
    fetch(pv.rota, {
      method: "POST", credentials: "same-origin",
      headers: { "Content-Type": "application/json", "X-WP-Nonce": window.tcdNonce || "" },
      body: JSON.stringify({ geojson: gj, local: String(($("ipe-local") || {}).value || "").slice(0, 80), c1: !!($("ipr-cp-c1") && $("ipr-cp-c1").checked), lingua: lg() })
    }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); }).then(function (x) {
      var u = x.ok && x.j && (x.j.carrinho || x.j.pagar);
      // só para o próprio site
      if (typeof u === "string" && (u.indexOf(location.origin + "/") === 0 || /^\/(?!\/)/.test(u))) { location.href = u; return; }
      if (b) b.disabled = false; msgCartao((x.j && x.j.message) || t("plantaErro"));
    }).catch(function () { if (b) b.disabled = false; msgCartao(t("plantaErro")); });
  }

  // Parcelas do cadastro: o Atlas junta-as ao terreno sem «draw.create» e lista-as em #ipe-plist (NIC). O cartão abre uma
  // vez por conjunto de parcelas, quando a escolha pára (a pessoa vai clicando parcela a parcela).
  var VISTOS_P = {};
  function conjuntoParcelas() {
    var l = $("ipe-plist"); if (!l) return "";
    return [].map.call(l.querySelectorAll("tbody tr"), function (tr) { var td = tr.querySelector("td"); return td ? td.textContent.trim() : ""; }).filter(Boolean).sort().join("|");
  }
  // volta a ligar-se se o Atlas substituir o #ipe-plist (chamado também pelo ciclo)
  var OBS_P = null, OBS_EL = null, TM_P = null;
  function vigiarParcelas() {
    var l = $("ipe-plist");
    if (!l || l === OBS_EL) return;
    if (OBS_P) try { OBS_P.disconnect(); } catch (e) {}
    OBS_EL = l;
    OBS_P = new MutationObserver(function () {
      clearTimeout(TM_P);
      TM_P = setTimeout(function () {
        try {
          if (window.tcdEquipa) return;
          var k = conjuntoParcelas(); if (!k || VISTOS_P[k]) return;
          if (abrirCartao(false)) VISTOS_P[k] = 1; // só fica visto se o cartão abriu
        } catch (e) {}
      }, 1200);
    });
    OBS_P.observe(l, { childList: true, subtree: true, characterData: true });
  }

  function ligarMapa() {
    var m = window.__ipe && window.__ipe.mapa;
    if (!m || typeof m.on !== "function") { setTimeout(ligarMapa, 400); return; }
    if (m.__iprCp) return; m.__iprCp = 1;
    try { m.on("draw.create", aoCriar); } catch (e) {}
    try { m.on("draw.delete", function () { if (!haTerreno()) fecharCartao(); }); } catch (e) {}
    try { m.on("draw.update", function () { if ($("ipr-cp-vt") || $("ipr-cp-ct")) setTimeout(function () { try { if (haTerreno() && !$("ipr-cp-ct")) pilula(t("mudarG"), true); } catch (e) {} }, 300); }); } catch (e) {}
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
    var p = PR(), im0 = p && p.intel && p.intel.mes, ia0 = p && p.intel && p.intel.ano, im = resolver(im0), ia = resolver(ia0);
    if (im) {
      var v = el("p", "ipr-cp-v"); if (im.tabela) v.appendChild(el("s", "", eur(im.tabela))); v.appendChild(document.createTextNode(eur(im.preco) + t("mes"))); i.appendChild(v);
      if (ia) { var v2 = el("p", "ipr-cp-v2", t("ou") + " "); if (ia.tabela) v2.appendChild(el("s", "", eur(ia.tabela))); v2.appendChild(document.createTextNode(" " + eur(ia.preco) + t("ano"))); i.appendChild(v2); }
    }
    var ui = el("ul"); t("intelL").forEach(function (s) { ui.appendChild(el("li", "", s)); }); i.appendChild(ui);
    if (nivel === "intelligence") i.appendChild(el("p", "ipr-cp-v2", t("jaTemTxt")));
    else {
      var um = im && urlSegura(im0.url, ""), ua = ia && urlSegura(ia0.url, "");
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

  var T0 = Date.now();
  function ciclo() {
    try { montarBotao(); lerDesdeDom(); vigiarParcelas(); } catch (e) {}
    // rápido só no arranque, até o botão estar posto (no máximo 30 s); depois, de 2 em 2 s
    setTimeout(ciclo, !$("ipr-cp-b") && Date.now() - T0 < 30000 ? 300 : 2000);
  }
  ciclo();
  ligarMapa();
  plantaDoEndereco();
})();
