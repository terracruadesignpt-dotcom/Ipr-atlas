/* IPR Atlas · Assistente de compra e descritivo do ecossistema IPR (pedidos do Nuno, 30/10/2026, 18h18 a 18h35):
   «onde diz Nova Base Cartográfica quero antes um descritivo da plataforma e do ecossistema IPR»; «os assistentes de compras
   devem estar mais presentes no ecrã e facilitar os processos das bases, leituras, plantas [...] passo a passo. Inclui as
   várias formas de detectar o terreno»; «as plantas de localização e as leituras territoriais podem ser vendidas sem conta;
   a base cartográfica precisa de conta e em todas as vendas é proposto fazer conta»; arrumação do bloco da esquerda.
   1. Topo: no lugar de «Nova Base Cartográfica · Indique o terreno no mapa» (só fora de um projecto aberto), o nome e a
      frase da plataforma; um clique abre o quadro do ecossistema IPR (Atlas, produtos, IPR Cloud, Oficina, Rede, lidar.pt).
   2. Assistente de compra: botão fixo no mapa e painel passo a passo (1 produto, 2 terreno, 3 preço, 4 dados e pagamento).
      Nove formas de indicar o terreno, todas pelos caminhos que o Atlas já tem (parcelas do cadastro, desenhar, ficheiro,
      NIC, artigo ou caderneta, morada ou local, coordenadas, GPS no terreno, um dos meus locais). O terreno é detectado
      sozinho (#ipe-area) e o assistente avança.
      Base Cartográfica: com conta (sem sessão, propõe entrar ou criar conta); segue pelo formulário de encomenda do Atlas
      (#ipe-form, «Enviar pedido»), que trata do pagamento como sempre.
      Leitura Territorial e Planta de Localização: sem conta, pelo m90590 (POST tcd/v1/pedido-produto), com o preço do
      servidor e a ligação de pagamento da encomenda. Propõe sempre criar conta.
      Planta com um projecto já na conta: abre o diálogo da planta do Atlas (window.__iprPlanta).
   3. Bloco da esquerda: «Camadas ligadas» passa para o fim do bloco, linha verde entre secções, botões dos temas e dos
      produtos mais baixos e em grelha simétrica, contador de «Os meus locais» com o número de locais (não de projectos).
   4. «Failed to fetch» do conversor de ficheiros passa a texto em português.
   Só acrescenta: não edita app.js, ajustes.js nem outros add-ons. Texto escapado (textContent). Cada parte falha em silêncio.
   Desligar: ?assistente=0 no endereço, localStorage ipr_assistente_off = 1, ou window.IPR_ASSISTENTE_OFF = true. */
(function () {
  "use strict";
  if (window.__iprAssistente || window.IPR_ASSISTENTE_OFF) return;
  try { if (new URLSearchParams(location.search).get("assistente") === "0") return; } catch (e) {}
  try { if (localStorage.getItem("ipr_assistente_off") === "1") return; } catch (e) {}
  window.__iprAssistente = 1;

  var IVA = 0.23, PLANTA = 19;
  var TX = {
    pt: {
      topoT: "IPR Atlas · plataforma territorial do IPR",
      topoR: "Ver, medir e encomendar o seu terreno · Ecossistema IPR",
      topoTitle: "Conhecer o ecossistema IPR",
      ecoT: "O ecossistema IPR",
      ecoP: "O IPR – Instituto de Planeamento Regenerativo junta dados públicos, cartografia LiDAR e trabalho de campo para ler e desenhar o território. Tudo começa aqui, no mapa.",
      eco: [
        ["IPR Atlas", "O mapa: relevo, água, solo, fogo, condicionantes e cadastro de Portugal, grátis para explorar.", null],
        ["Base Cartográfica", "O relevo do seu terreno a partir do LiDAR da DGT, no Atlas e em ficheiros para SIG e CAD.", "base"],
        ["Leitura Territorial", "Relatório PDF do que o terreno permite e do que o condiciona.", "leitura"],
        ["Planta de Localização", "PDF à escala sobre o ortofotomapa, para a câmara, o banco ou o notário.", "planta"],
        ["IPR Cloud e Oficina", "Os seus projectos, ficheiros e equipa num só sítio.", "/oficina/"],
        ["Rede IPR", "Profissionais, estudantes e entidades que trabalham pelo território.", "https://paisagemviva.pt"],
        ["Guia do LiDAR", "Como descarregar e usar o LiDAR de Portugal.", "https://lidar.pt"],
        ["IPR", "O instituto: método, publicações e formação.", "https://regenerativo.pt"]
      ],
      abrir: "Comprar passo a passo", abrirS: "Base, Leitura ou Planta",
      fechar: "Fechar", voltar: "Voltar", seguinte: "Seguinte",
      passos: ["Produto", "Terreno", "Preço", "Dados"],
      p1T: "O que precisa?", p1S: "Escolha um produto. Mostramos o caminho até ao fim, passo a passo.",
      prod: {
        base: ["Base Cartográfica", "O relevo do terreno em mapas e ficheiros (LiDAR da DGT): curvas de nível, declives, linhas de água, modelo 3D.", "Precisa de conta"],
        leitura: ["Leitura Territorial", "Relatório PDF: REN, RAN, PDM, Rede Natura, água, fogo e ocupação do solo do seu terreno.", "Sem conta"],
        planta: ["Planta de Localização", "PDF à escala sobre o ortofotomapa, com o limite do terreno, para a câmara ou o banco.", "Sem conta"]
      },
      desde: "desde", mais: "+ IVA",
      p2T: "Onde é o terreno?", p2S: "Escolha a forma mais fácil para si. Assim que o terreno estiver no mapa, avançamos sozinhos.",
      formas: {
        cadastro: ["Clicar nas parcelas", "Aproxime o mapa e clique em cada parcela do cadastro."],
        desenhar: ["Desenhar no mapa", "Clique nos cantos do terreno e feche no primeiro ponto."],
        procurar: ["Procurar morada ou local", "Aldeia, rua, nome da herdade ou freguesia."],
        coord: ["Coordenadas", "Latitude e longitude, ou PT-TM06."],
        gps: ["Estou no terreno", "Usa o GPS do telemóvel para ir ao sítio."],
        nic: ["Número do prédio (NIC)", "A referência cadastral, por exemplo AAA000742446."],
        ficheiro: ["Carregar ficheiro", "KML, KMZ, Shapefile, GeoJSON, GPX, DXF ou DWG."],
        locais: ["Um dos meus locais", "Uma área que já guardou no Atlas."],
        artigo: ["Artigo ou caderneta", "Não sabe o limite? Indique o artigo matricial e nós encontramos o terreno."]
      },
      dica: {
        cadastro: "Aproxime o mapa do terreno e clique nas parcelas. Clique de novo para retirar uma.",
        desenhar: "Clique em cada canto do terreno. Feche no primeiro ponto ou com duplo clique.",
        procurar: "Escreva na caixa de pesquisa, no topo da barra da esquerda, e escolha o resultado. Depois clique nas parcelas ou desenhe.",
        gps: "A ir para a sua posição. Depois clique nas parcelas ou desenhe o limite.",
        ficheiro: "Escolha o ficheiro. O limite aparece no mapa.",
        locais: "Escolha o local na lista.",
        artigo: "Preencha o concelho, a freguesia e o artigo no formulário à direita (ou junte a caderneta)."
      },
      coordPh: "38.12345, -8.12345", coordIr: "Ir", coordMau: "Não percebi as coordenadas. Escreva latitude e longitude, por exemplo 37.65, -8.21.",
      nicPh: "AAA000742446", nicIr: "Localizar",
      semLocais: "Ainda não tem áreas em «Os meus locais». Desenhe uma área no mapa ou importe um KML.",
      aEspera: "À espera do terreno no mapa…",
      achado: "Terreno no mapa", achadoArea: "Área",
      p3T: "Confirme o terreno e o preço", p3S: "Valores sem IVA e com IVA (23 %).",
      semIva: "sem IVA", comIva: "com IVA",
      juntarL: "Juntar a Leitura Territorial", pacote: "Base e Leitura juntas: mais 10 % de desconto nas duas, no pagamento.",
      consulta: "Sob consulta para esta área. Pedimos-lhe os dados e enviamos uma proposta.",
      inclui: {
        base: ["Mapas do relevo no Atlas e em ficheiros (GeoPackage, Shapefile, DXF, GeoTIFF)", "Curvas de nível, declives, exposições, linhas de água e bacias", "Planta de Localização incluída", "Fica na sua conta, com o projecto"],
        leitura: ["Condicionantes: REN, RAN, PDM, Rede Natura, domínio hídrico", "Água, perigosidade de incêndio e ocupação do solo", "Extractos de mapas com o limite do terreno", "PDF por e-mail, normalmente até 5 dias úteis"],
        planta: ["PDF em A4 ou A3, à escala, sobre o ortofotomapa da DGT", "Limite do terreno, coordenadas e área", "Para a câmara, o banco ou o notário", "Por e-mail, normalmente no dia útil seguinte"]
      },
      plantaProj: "Já tem projectos na conta: pode fazer a planta de um deles agora.",
      plantaProjB: "Planta de um projecto meu",
      mudarTerreno: "Mudar o terreno",
      p4T: "Os seus dados", p4S: "Só o necessário para a factura e para lhe enviarmos o resultado.",
      nome: "Nome", email: "E-mail", tel: "Telefone (opcional)", nif: "NIF (opcional)", pais: "País de facturação",
      finalidade: "Para que é a planta?", fin: ["Para a câmara (licenciamento)", "Para o banco ou o notário", "Para mim"],
      notas: "Notas (opcional)",
      conta: "Criar conta com este e-mail: encomendas e ficheiros guardados, IPR Atlas e descontos nas compras seguintes.",
      contaSessao: "A encomenda fica na sua conta.",
      consent: "Li a Política de Privacidade e aceito que usem estes dados para responder ao pedido.",
      pagar: "Encomendar e pagar", pedirMail: "Enviar o pedido", aEnviar: "A registar…",
      faltam: "Falta: ", fNome: "o nome", fEmail: "um e-mail válido", fConsent: "aceitar a Política de Privacidade", fTerreno: "o terreno no mapa",
      okT: "Pedido registado", okTMail: "Pedido pronto a enviar", okP: "Enviámos a confirmação para {e}. Referência {r}.",
      okPagar: "Pagar agora", okContaC: "Criámos a sua conta: vai receber um e-mail para definir a palavra-passe.",
      okContaE: "Este e-mail já tem conta: entre para ver a encomenda na sua área.",
      erro: "Não foi possível registar o pedido: {m}",
      baseConta: "A Base Cartográfica fica na sua conta, com o projecto e os ficheiros. Entre ou crie conta para continuar: o terreno que indicou fica guardado.",
      entrar: "Entrar ou criar conta",
      baseForm: "Preencha os seus dados no formulário à direita e carregue em «Enviar pedido». Com cobertura LiDAR total, paga logo a seguir; sem ela, confirmamos antes de qualquer pagamento.",
      baseIr: "Ir para o formulário",
      okMail: "Abrimos o seu e-mail com o pedido já escrito para info@regenerativo.pt. Envie-o e respondemos com a ligação de pagamento, normalmente no mesmo dia útil.",
      locaisN: "{n} locais", mini: "À espera do terreno no mapa · tocar para abrir o assistente",
      conv: "Sem ligação ao serviço de conversão. Verifique a internet e tente de novo daqui a pouco."
    },
    en: {
      topoT: "IPR Atlas · the IPR land platform",
      topoR: "See, measure and order your land · IPR ecosystem",
      topoTitle: "About the IPR ecosystem",
      ecoT: "The IPR ecosystem",
      ecoP: "IPR – Instituto de Planeamento Regenerativo brings together open data, LiDAR mapping and fieldwork to read and design the land. It all starts here, on the map.",
      eco: [
        ["IPR Atlas", "The map: relief, water, soil, fire, constraints and land registry of Portugal, free to explore.", null],
        ["Base Map", "Your land's relief from DGT LiDAR, in the Atlas and as GIS and CAD files.", "base"],
        ["Territorial Reading", "PDF report on what the land allows and what constrains it.", "leitura"],
        ["Location Plan", "Scaled PDF on the orthophoto, for the town hall, the bank or the notary.", "planta"],
        ["IPR Cloud and Oficina", "Your projects, files and team in one place.", "/oficina/"],
        ["IPR Network", "Professionals, students and organisations working for the land.", "https://paisagemviva.pt"],
        ["LiDAR guide", "How to download and use Portugal's LiDAR.", "https://lidar.pt"],
        ["IPR", "The institute: method, publications and training.", "https://regenerativo.pt"]
      ],
      abrir: "Buy step by step", abrirS: "Base, Reading or Plan",
      fechar: "Close", voltar: "Back", seguinte: "Next",
      passos: ["Product", "Land", "Price", "Details"],
      p1T: "What do you need?", p1S: "Choose a product. We guide you all the way, step by step.",
      prod: {
        base: ["Base Map", "Your land's relief as maps and files (DGT LiDAR): contours, slopes, water lines, 3D model.", "Account needed"],
        leitura: ["Territorial Reading", "PDF report: REN, RAN, PDM, Natura 2000, water, fire and land cover for your land.", "No account"],
        planta: ["Location Plan", "Scaled PDF on the orthophoto, with the land boundary, for the town hall or the bank.", "No account"]
      },
      desde: "from", mais: "+ VAT",
      p2T: "Where is the land?", p2S: "Pick the easiest way for you. As soon as the land is on the map, we move on.",
      formas: {
        cadastro: ["Click the parcels", "Zoom in and click each land registry parcel."],
        desenhar: ["Draw on the map", "Click the corners and close on the first point."],
        procurar: ["Search an address or place", "Village, street, estate or parish name."],
        coord: ["Coordinates", "Latitude and longitude, or PT-TM06."],
        gps: ["I am on the land", "Uses your phone's GPS to go there."],
        nic: ["Parcel number (NIC)", "The cadastral reference, e.g. AAA000742446."],
        ficheiro: ["Upload a file", "KML, KMZ, Shapefile, GeoJSON, GPX, DXF or DWG."],
        locais: ["One of my places", "An area you saved in the Atlas."],
        artigo: ["Tax article or deed", "Don't know the boundary? Give us the tax article and we find the land."]
      },
      dica: {
        cadastro: "Zoom in on the land and click the parcels. Click again to remove one.",
        desenhar: "Click each corner of the land. Close on the first point or double-click.",
        procurar: "Type in the search box at the top of the left bar and pick a result. Then click the parcels or draw.",
        gps: "Going to your position. Then click the parcels or draw the boundary.",
        ficheiro: "Choose the file. The boundary appears on the map.",
        locais: "Choose the place from the list.",
        artigo: "Fill in the municipality, parish and article in the form on the right (or attach the deed)."
      },
      coordPh: "38.12345, -8.12345", coordIr: "Go", coordMau: "I could not read the coordinates. Type latitude and longitude, e.g. 37.65, -8.21.",
      nicPh: "AAA000742446", nicIr: "Find",
      semLocais: "You have no areas in «My places» yet. Draw an area on the map or import a KML.",
      aEspera: "Waiting for the land on the map…",
      achado: "Land on the map", achadoArea: "Area",
      p3T: "Check the land and the price", p3S: "Prices without and with VAT (23 %).",
      semIva: "without VAT", comIva: "with VAT",
      juntarL: "Add the Territorial Reading", pacote: "Base and Reading together: a further 10 % off both, at payment.",
      consulta: "On request for this area. Leave your details and we send a quote.",
      inclui: {
        base: ["Relief maps in the Atlas and as files (GeoPackage, Shapefile, DXF, GeoTIFF)", "Contours, slopes, aspect, water lines and basins", "Location Plan included", "Kept in your account, with the project"],
        leitura: ["Constraints: REN, RAN, PDM, Natura 2000, water domain", "Water, wildfire hazard and land cover", "Map extracts with the land boundary", "PDF by e-mail, usually within 5 working days"],
        planta: ["A4 or A3 PDF, to scale, on the DGT orthophoto", "Land boundary, coordinates and area", "For the town hall, the bank or the notary", "By e-mail, usually the next working day"]
      },
      plantaProj: "You already have projects in your account: you can make the plan for one of them now.",
      plantaProjB: "Plan for one of my projects",
      mudarTerreno: "Change the land",
      p4T: "Your details", p4S: "Only what we need for the invoice and to send you the result.",
      nome: "Name", email: "E-mail", tel: "Phone (optional)", nif: "Tax number (optional)", pais: "Billing country",
      finalidade: "What is the plan for?", fin: ["For the town hall (licensing)", "For the bank or the notary", "For myself"],
      notas: "Notes (optional)",
      conta: "Create an account with this e-mail: saved orders and files, IPR Atlas and discounts on later purchases.",
      contaSessao: "The order goes to your account.",
      consent: "I have read the Privacy Policy and agree to these details being used to answer the request.",
      pagar: "Order and pay", pedirMail: "Send the order", aEnviar: "Registering…",
      faltam: "Missing: ", fNome: "your name", fEmail: "a valid e-mail", fConsent: "accepting the Privacy Policy", fTerreno: "the land on the map",
      okT: "Order registered", okTMail: "Order ready to send", okP: "We sent the confirmation to {e}. Reference {r}.",
      okPagar: "Pay now", okContaC: "We created your account: you will get an e-mail to set your password.",
      okContaE: "This e-mail already has an account: sign in to see the order.",
      erro: "The order could not be registered: {m}",
      baseConta: "The Base Map is kept in your account, with the project and the files. Sign in or create an account to continue: the land you marked is kept.",
      entrar: "Sign in or create an account",
      baseForm: "Fill in your details in the form on the right and press «Send request». With full LiDAR coverage you pay straight away; otherwise we confirm before any payment.",
      baseIr: "Go to the form",
      okMail: "We opened your e-mail with the order already written to info@regenerativo.pt. Send it and we reply with the payment link, usually the same working day.",
      locaisN: "{n} places", mini: "Waiting for the land on the map · tap to open the assistant",
      conv: "No connection to the conversion service. Check the internet and try again shortly."
    }
  };
  function lg() { return (window.IPR_LINGUA || document.documentElement.lang || "pt").slice(0, 2) === "en" ? "en" : "pt"; }
  function t(k) { var o = TX[lg()][k]; return o === undefined ? TX.pt[k] : o; }
  function tf(k, v) { var s = t(k); Object.keys(v || {}).forEach(function (x) { s = s.split("{" + x + "}").join(String(v[x])); }); return s; }
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function raiz() { return $("ipe"); }
  function movel() { return window.innerWidth <= 900; }
  function sessao() { return !!window.tcdNonce; }
  function est() { return window.__ipe && window.__ipe.estado || null; }
  function mapa() { return window.__ipe && window.__ipe.mapa || null; }
  function visivel(e) { return !!(e && e.getClientRects().length && getComputedStyle(e).display !== "none"); }
  function esperar(fn, limite, feito) {
    var t0 = Date.now(); (function v() { var r = null; try { r = fn(); } catch (e) {} if (r) { feito(r); return; } if (Date.now() - t0 < limite) setTimeout(v, 120); })();
  }
  function txt(id) { var e = $(id); return e ? (e.textContent || "").trim() : ""; }
  function euros(v) { return (Math.round(v * 100) / 100).toLocaleString(lg() === "en" ? "en-GB" : "pt-PT", { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 }) + " €"; }
  function lerEuros(s) { var m = /(\d[\d\s.  ]*(?:,\d+)?)\s*€/.exec(String(s || "")); if (!m) return null; var n = parseFloat(m[1].replace(/[\s.  ]/g, "").replace(",", ".")); return isFinite(n) ? n : null; }
  function PR() { var p = window.IPR_PRECOS; return p && typeof p === "object" ? p : null; }
  function entrarUrl() { return "/conta/?redirect_to=" + encodeURIComponent("/atlas/?assistente=base"); }
  var ICO = {
    base: "M3 7l9-4 9 4-9 4-9-4zm0 5l9 4 9-4M3 17l9 4 9-4",
    leitura: "M6 3h9l4 4v14H6zM15 3v4h4M9 12h7M9 16h7M9 8h3",
    planta: "M6 3h9l4 4v14H6zM15 3v4h4M12.5 17s-2.5-2.4-2.5-4.2a2.5 2.5 0 0 1 5 0c0 1.8-2.5 4.2-2.5 4.2z",
    cadastro: "M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z",
    desenhar: "M4 18l5-12 6 4 5-6M4 18h.01M9 6h.01M15 10h.01M20 4h.01",
    procurar: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-5-5",
    coord: "M12 2v4M12 18v4M2 12h4M18 12h4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
    gps: "M12 21s-6-5.5-6-10a6 6 0 0 1 12 0c0 4.5-6 10-6 10zM12 9a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
    nic: "M4 6h16M4 12h16M4 18h10M17 16l2 2 3-4",
    ficheiro: "M14 3H6v18h12V7zM14 3v4h4M12 11v6M9 14l3-3 3 3",
    locais: "M4 4h16v16H4zM8 9h8M8 13h5",
    artigo: "M5 3h10l4 4v14H5zM8 11h8M8 15h8M8 7h4",
    ok: "M5 12l5 5L20 7", seta: "M9 6l6 6-6 6", volta: "M15 6l-9 6 9 6", x: "M6 6l12 12M18 6L6 18", eco: "M12 3c-5 3-7 7-7 11a7 7 0 0 0 14 0c0-4-2-8-7-11zM12 10v11"
  };
  function icone(n, s) {
    var NS = "http://www.w3.org/2000/svg", v = document.createElementNS(NS, "svg");
    v.setAttribute("width", s || 16); v.setAttribute("height", s || 16); v.setAttribute("viewBox", "0 0 24 24"); v.setAttribute("aria-hidden", "true");
    v.setAttribute("fill", "none"); v.setAttribute("stroke", "currentColor"); v.setAttribute("stroke-width", "1.7"); v.setAttribute("stroke-linecap", "round"); v.setAttribute("stroke-linejoin", "round");
    var p = document.createElementNS(NS, "path"); p.setAttribute("d", ICO[n] || ""); v.appendChild(p); return v;
  }

  // ---------------------------------------------------------------- estilos
  var F = "Inter,system-ui,sans-serif", M = "'IBM Plex Mono',ui-monospace,monospace", O = "Outfit,Inter,sans-serif";
  var CSS =
    "#ipe .ipe-ctx.ipr-as-eco{cursor:pointer}#ipe .ipe-ctx.ipr-as-eco:hover #ipe-ctx-r{color:#94BE39}" +
    ".ipr-as{--a-bg:#0F170B;--a-p:#14200F;--a-p2:#1B2816;--a-ln:#2E3A26;--a-ac:#94BE39;--a-ou:#B8A83A;--a-tx:#E4E2D8;--a-mu:#9AA088;font:14px/1.5 " + F + ";color:var(--a-tx)}" +
    ".ipr-as *{box-sizing:border-box}" +
    "#ipr-as-b{position:absolute;z-index:40;left:50%;bottom:calc(46px + env(safe-area-inset-bottom));transform:translateX(-50%);display:flex;align-items:center;gap:10px;padding:9px 18px 9px 12px;border-radius:2px;border:1px solid #94BE39;background:#14200F;color:#E4E2D8;cursor:pointer;box-shadow:0 10px 30px rgba(0,0,0,.45);font:600 14px/1.2 " + F + ";animation:iprAsP 2.6s ease-in-out 3}" +
    "#ipr-as-b small{display:block;font:500 11px/1.3 " + M + ";color:#9AA088;text-transform:uppercase;letter-spacing:.06em}#ipr-as-b .ic{display:grid;place-items:center;width:30px;height:30px;border-radius:2px;background:#94BE39;color:#0F170B}" +
    "#ipr-as-b:hover{background:#1B2816}@keyframes iprAsP{0%,100%{box-shadow:0 10px 30px rgba(0,0,0,.45),0 0 0 0 rgba(148,190,57,.55)}50%{box-shadow:0 10px 30px rgba(0,0,0,.45),0 0 0 10px rgba(148,190,57,0)}}" +
    "@media (min-width:901px){body:has(#ipr-as-pn) #tcdfmb{transform:translateX(410px)}}@media (max-width:900px){body:has(#ipr-as-pn) #tcdfmb{display:none!important}}" +
    ".ipr-as-on #ipr-as-b{display:none}.ipr-as-on #ipr-cp-ct,.ipr-as-on #ipr-cp-gu{display:none!important}" +
    "#ipr-as-pn{position:absolute;z-index:1001;left:12px;top:12px;bottom:40px;width:392px;max-width:calc(100% - 24px);display:flex;flex-direction:column;background:rgba(15,23,11,.97);border:1px solid #2E3A26;border-radius:2px;box-shadow:0 18px 50px rgba(0,0,0,.5);overflow:hidden;animation:iprAsIn .28s ease-out}" +
    "@keyframes iprAsIn{from{opacity:0;transform:translateX(-14px)}to{opacity:1;transform:none}}" +
    "#ipr-as-pn .cab{padding:14px 16px 10px;border-bottom:1px solid #2E3A26;background:#14200F}" +
    "#ipr-as-pn .cab .lin{display:flex;align-items:center;gap:8px}#ipr-as-pn .cab b{flex:1;font:600 12px/1.3 " + M + ";text-transform:uppercase;letter-spacing:.08em;color:#9AA088}" +
    "#ipr-as-pn .x{all:unset;cursor:pointer;display:grid;place-items:center;width:28px;height:28px;color:#9AA088;border-radius:2px}#ipr-as-pn .x:hover{color:#E4E2D8;background:#1B2816}" +
    "#ipr-as-pn ol.pp{list-style:none;margin:10px 0 0;padding:0;display:grid;grid-template-columns:repeat(4,1fr);gap:6px}" +
    "#ipr-as-pn ol.pp li{position:relative;padding-top:8px;font:500 11px/1.2 " + M + ";text-transform:uppercase;letter-spacing:.05em;color:#64703F}" +
    "#ipr-as-pn ol.pp li:before{content:'';position:absolute;left:0;right:0;top:0;height:3px;border-radius:2px;background:#2E3A26;transition:background .35s}" +
    "#ipr-as-pn ol.pp li.feito{color:#9AA088}#ipr-as-pn ol.pp li.feito:before{background:#64703F}#ipr-as-pn ol.pp li.agora{color:#E4E2D8}#ipr-as-pn ol.pp li.agora:before{background:#94BE39}" +
    "#ipr-as-pn .corpo{flex:1;overflow:auto;padding:16px;animation:iprAsF .25s ease-out}@keyframes iprAsF{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}" +
    "#ipr-as-pn h2{margin:0 0 4px;font:500 22px/1.2 " + O + ";color:#E4E2D8}#ipr-as-pn .sub{margin:0 0 14px;color:#9AA088;font-size:13px}" +
    "#ipr-as-pn .cartoes{display:grid;gap:8px}" +
    "#ipr-as-pn .c{all:unset;box-sizing:border-box;cursor:pointer;display:grid;grid-template-columns:32px 1fr auto;gap:2px 10px;align-items:start;padding:12px;border:1px solid #2E3A26;border-left:3px solid #2E3A26;border-radius:2px;background:#14200F;transition:border-color .15s,background .15s}" +
    "#ipr-as-pn .c:hover,#ipr-as-pn .c:focus-visible{border-color:#94BE39;background:#1B2816}#ipr-as-pn .c.on{border-color:#94BE39;border-left-color:#94BE39;background:#1B2816}" +
    "#ipr-as-pn .c .i{grid-column:1;grid-row:1/4;display:grid;place-items:center;width:32px;height:32px;border-radius:2px;background:#1B2816;color:#94BE39;border:1px solid #2E3A26}" +
    "#ipr-as-pn .c b{grid-column:2;grid-row:1;font:600 15px/1.3 " + O + ";color:#E4E2D8}#ipr-as-pn .c em{grid-column:3;grid-row:1;font:500 11px/1.3 " + M + ";font-style:normal;color:#94BE39;text-align:right;white-space:nowrap}" +
    "#ipr-as-pn .c span{grid-column:2/4;grid-row:2;font-size:12.5px;color:#9AA088}#ipr-as-pn .c .pr{grid-column:2/4;grid-row:3;font:500 12px/1.4 " + M + ";color:#B8A83A}" +
    "#ipr-as-pn .formas{display:grid;grid-template-columns:1fr 1fr;gap:6px}" +
    "#ipr-as-pn .f{all:unset;box-sizing:border-box;cursor:pointer;display:flex;flex-direction:column;gap:3px;padding:10px;border:1px solid #2E3A26;border-radius:2px;background:#14200F;min-height:76px;transition:border-color .15s,background .15s}" +
    "#ipr-as-pn .f:hover,#ipr-as-pn .f:focus-visible{border-color:#94BE39;background:#1B2816}#ipr-as-pn .f.on{border-color:#94BE39;background:#1B2816;box-shadow:inset 0 0 0 1px #94BE39}" +
    "#ipr-as-pn .f .t{display:flex;align-items:center;gap:7px;font:600 13px/1.25 " + F + ";color:#E4E2D8}#ipr-as-pn .f .t svg{color:#94BE39;flex:none}#ipr-as-pn .f span{font-size:11.5px;line-height:1.35;color:#9AA088}" +
    "#ipr-as-pn .f.larga{grid-column:1/3;min-height:0}" +
    "#ipr-as-pn .sub2{margin:12px 0 0;padding:10px 12px;border:1px dashed #64703F;border-radius:2px;color:#E4E2D8;font-size:13px;background:#14200F}" +
    "#ipr-as-pn .lin2{display:flex;gap:6px;margin-top:8px}#ipr-as-pn input[type=text],#ipr-as-pn input[type=email],#ipr-as-pn input[type=tel],#ipr-as-pn select,#ipr-as-pn textarea{width:100%;font:14px/1.3 " + F + ";color:#E4E2D8;background:#0F170B;border:1px solid #2E3A26;border-radius:2px;padding:9px 10px}" +
    "#ipr-as-pn input:focus,#ipr-as-pn select:focus,#ipr-as-pn textarea:focus{outline:none;border-color:#94BE39}" +
    "#ipr-as-pn label.l{display:block;margin:10px 0 4px;font:500 11px/1.3 " + M + ";text-transform:uppercase;letter-spacing:.06em;color:#9AA088}" +
    "#ipr-as-pn label.ck{display:flex;gap:9px;align-items:flex-start;margin:12px 0 0;font-size:12.5px;color:#E4E2D8;cursor:pointer}#ipr-as-pn label.ck input{margin:2px 0 0;accent-color:#94BE39;flex:none}" +
    "#ipr-as-pn .bt{all:unset;box-sizing:border-box;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:10px 16px;border-radius:2px;font:600 14px/1 " + F + ";background:#94BE39;color:#0F170B}" +
    "#ipr-as-pn .bt:hover{background:#A6CC4E}#ipr-as-pn .bt[disabled]{opacity:.45;cursor:default}#ipr-as-pn .bt.s{background:transparent;color:#E4E2D8;border:1px solid #2E3A26}#ipr-as-pn .bt.s:hover{border-color:#94BE39}" +
    "#ipr-as-pn .bt.w{width:100%}" +
    "#ipr-as-pn .esp{display:flex;align-items:center;gap:10px;margin-top:12px;padding:10px 12px;border:1px solid #2E3A26;border-radius:2px;background:#14200F;font-size:13px;color:#9AA088}" +
    "#ipr-as-pn .esp i{width:10px;height:10px;border-radius:50%;background:#94BE39;animation:iprAsR 1.2s ease-in-out infinite;flex:none}@keyframes iprAsR{0%,100%{opacity:.25;transform:scale(.8)}50%{opacity:1;transform:scale(1.15)}}" +
    "#ipr-as-pn .ach{display:flex;align-items:center;gap:12px;padding:12px;border:1px solid #94BE39;border-radius:2px;background:#1B2816;animation:iprAsA .5s ease-out}@keyframes iprAsA{0%{transform:scale(.96);opacity:0}60%{transform:scale(1.02);opacity:1}100%{transform:none}}" +
    "#ipr-as-pn .ach .ok{display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:#94BE39;color:#0F170B;flex:none}#ipr-as-pn .ach b{display:block;font:600 15px/1.2 " + O + "}#ipr-as-pn .ach small{font:500 12px " + M + ";color:#B8A83A}" +
    "#ipr-as-pn table.pr{width:100%;border-collapse:collapse;border:0!important;margin:12px 0 4px;font-size:13.5px}#ipr-as-pn table.pr th,#ipr-as-pn table.pr td{padding:8px 4px!important;border:0!important;border-bottom:1px solid #2E3A26!important;background:transparent!important;text-align:right;font-family:" + M + ";font-weight:500}" +
    "#ipr-as-pn table.pr th:first-child,#ipr-as-pn table.pr td:first-child{text-align:left;font-family:" + F + "}#ipr-as-pn table.pr th{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#9AA088}#ipr-as-pn table.pr tr.tot td{color:#94BE39;font-weight:600;border-bottom:0}" +
    "#ipr-as-pn ul.inc{list-style:none;margin:12px 0 0;padding:0;display:grid;gap:5px}#ipr-as-pn ul.inc li{display:flex;gap:8px;font-size:12.5px;color:#E4E2D8}#ipr-as-pn ul.inc li svg{color:#94BE39;flex:none;margin-top:2px}" +
    "#ipr-as-pn .nota{margin:10px 0 0;font-size:12px;color:#9AA088}#ipr-as-pn .aviso{margin:10px 0 0;padding:10px 12px;border-left:3px solid #B8A83A;background:#14200F;font-size:13px}" +
    "#ipr-as-pn .falta{margin:10px 0 0;font-size:12.5px;color:#d9a35b;min-height:1em}#ipr-as-pn .erro{margin:10px 0 0;font-size:13px;color:#e07a5f}" +
    "#ipr-as-pn .rod{display:flex;gap:8px;justify-content:space-between;align-items:center;padding:12px 16px;border-top:1px solid #2E3A26;background:#14200F}" +
    "#ipr-as-pn .proj{display:grid;gap:6px;margin-top:8px}#ipr-as-pn .proj button{all:unset;cursor:pointer;padding:8px 10px;border:1px solid #2E3A26;border-radius:2px;font-size:13px}#ipr-as-pn .proj button:hover{border-color:#94BE39}" +
    "#ipr-as-pn .proj small{display:block;color:#9AA088;font:500 11px " + M + "}" +
    ".ipr-as-luz{outline:2px solid #94BE39!important;outline-offset:3px;animation:iprAsL 1.4s ease-in-out 3}@keyframes iprAsL{50%{outline-color:transparent}}" +
    // quadro do ecossistema
    "#ipr-as-eco{position:fixed;inset:0;z-index:100002;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(8,12,6,.6)}" +
    "#ipr-as-eco .q{width:min(720px,100%);max-height:calc(100vh - 32px);overflow:auto;background:#0F170B;border:1px solid #2E3A26;border-radius:2px;padding:22px;position:relative;animation:iprAsF .25s ease-out}" +
    "#ipr-as-eco h2{margin:0 0 6px;font:500 26px/1.15 " + O + ";color:#E4E2D8}#ipr-as-eco p.i{margin:0 0 16px;color:#9AA088;font-size:14px}" +
    "#ipr-as-eco .g{display:grid;grid-template-columns:1fr 1fr;gap:8px}#ipr-as-eco .e{all:unset;box-sizing:border-box;cursor:pointer;padding:12px;border:1px solid #2E3A26;border-left:3px solid #94BE39;border-radius:2px;background:#14200F}" +
    "#ipr-as-eco .e:hover{border-color:#94BE39}#ipr-as-eco .e b{display:block;font:600 15px/1.3 " + O + ";color:#E4E2D8}#ipr-as-eco .e span{font-size:12.5px;color:#9AA088}" +
    "#ipr-as-eco .e.cur{cursor:default;border-left-color:#B8A83A}#ipr-as-eco .x{position:absolute;top:10px;right:10px}" +
    "#ipr-as-pn .mn{display:none}#ipr-as-pn.mini{max-height:none!important;top:auto!important}#ipr-as-pn.mini .corpo,#ipr-as-pn.mini .rod,#ipr-as-pn.mini ol.pp{display:none}#ipr-as-pn.mini .mn{all:unset;display:block;margin-top:8px;cursor:pointer;font-size:13px;color:#94BE39}" +
    "@media (max-width:900px){#ipr-as-pn{left:8px;right:8px;top:auto;bottom:8px;width:auto;max-width:none;max-height:72vh}#ipr-as-b{bottom:calc(64px + env(safe-area-inset-bottom))}}" +
    "@media (max-width:560px){#ipr-as-eco .g{grid-template-columns:1fr}#ipr-as-pn .formas{grid-template-columns:1fr 1fr}#ipr-as-pn h2{font-size:19px}#ipr-as-b{padding:8px 14px 8px 10px;font-size:13px}}" +
    // 3. bloco da esquerda
    "#ipe #ipe-esq>section.ipe-sb+section.ipe-sb,#ipe #ipe-esq #ipc-loc,#ipe #ipe-esq #ipr-t62,#ipe #ipe-esq .ipr-arv-cab{border-top:1px solid rgba(148,190,57,.45)!important}" +
    "#ipe #ipe-esq #ipc-loc,#ipe #ipe-esq #ipr-t62{margin-top:8px;padding-top:8px}#ipe #ipe-esq .ipr-arv-cab{margin-top:8px;padding-top:10px}" +
    "#ipe #ipe-esq #ipr-cq{border-top:1px solid rgba(148,190,57,.45)!important;margin-top:10px}#ipe #ipr-cq-cont{display:none!important}" +
    "#ipe .ipr-t62-g{display:grid!important;grid-template-columns:1fr 1fr!important;gap:5px!important}" +
    "#ipe .ipr-t62-g>*{min-height:0!important;height:auto!important;padding:5px 9px!important;font-size:12.5px!important;line-height:1.25!important}" +
    "#ipe .ipr-t62-g>*:last-child:nth-child(odd){grid-column:1/3}" +
    "#ipe .ipr-pd-g{gap:5px!important}#ipe .ipr-pd-b{min-height:0!important;padding:7px 10px!important}#ipe #ipe-esq .ipe-sb.ipc-movido #ipr-mb:not([hidden]){display:block!important}#ipe #ipe-esq .ipe-sb.ipc-movido:has(#ipr-mb:not([hidden])){display:block!important;height:auto!important;overflow:visible!important;border-top:1px solid rgba(148,190,57,.45)!important;padding-top:6px}#ipe #ipe-esq .ipe-sb.ipc-movido:has(#ipr-mb:not([hidden]))>.ipe-sbh{display:none!important}#ipe #ipr-mb .ipr-mb-b.ipr-as-aqui>.ipr-mb-bc{box-shadow:inset 3px 0 0 #94BE39}" +
    "#ipe .ipr-pd-b span{font-size:13px!important;line-height:1.25!important;word-break:normal!important;overflow-wrap:normal!important;hyphens:manual!important}";
  function estilos() { if ($("ipr-as-css")) return; var s = el("style"); s.id = "ipr-as-css"; s.textContent = CSS; document.head.appendChild(s); }

  // ---------------------------------------------------------------- 1. topo e ecossistema
  var TOPO_ORIG = /^(Nova Base Cartográfica|New Base Map)$/;
  function topo() {
    var tt = $("ipe-ctx-t"), tr = $("ipe-ctx-r"); if (!tt || !tr) return;
    var P = est(); if (P && P.modo === "cliente" && P.actual) { var c0 = tt.closest(".ipe-ctx") || tt.parentNode; c0.classList.remove("ipr-as-eco"); c0.removeAttribute("title"); return; }
    var c = tt.closest(".ipe-ctx") || tt.parentNode;
    if (TOPO_ORIG.test(tt.textContent.trim()) || tt.getAttribute("data-ipr-as") === "1") {
      if (tt.textContent !== t("topoT")) tt.textContent = t("topoT");
      if (tr.textContent !== t("topoR")) tr.textContent = t("topoR");
      tt.setAttribute("data-ipr-as", "1");
      c.classList.add("ipr-as-eco"); c.title = t("topoTitle");
      if (!c.__iprAs) {
        c.__iprAs = 1; c.setAttribute("role", "button"); c.tabIndex = 0;
        c.addEventListener("click", function () { if (c.classList.contains("ipr-as-eco")) ecossistema(); });
        c.addEventListener("keydown", function (e) { if ((e.key === "Enter" || e.key === " ") && c.classList.contains("ipr-as-eco")) { e.preventDefault(); ecossistema(); } });
      }
    }
  }
  function ecossistema() {
    estilos(); var v = $("ipr-as-eco"); if (v) v.remove();
    v = el("div", "ipr-as"); v.id = "ipr-as-eco"; v.lang = lg();
    var q = el("div", "q"); q.setAttribute("role", "dialog"); q.setAttribute("aria-modal", "true"); q.setAttribute("aria-label", t("ecoT"));
    var x = el("button", "x"); x.type = "button"; x.className = "x"; x.style.cssText = "all:unset;cursor:pointer;position:absolute;top:12px;right:12px;color:#9AA088"; x.setAttribute("aria-label", t("fechar")); x.appendChild(icone("x", 20));
    q.appendChild(x); q.appendChild(el("h2", "", t("ecoT"))); q.appendChild(el("p", "i", t("ecoP")));
    var g = el("div", "g");
    t("eco").forEach(function (e) {
      var b = el(e[2] && /^(https?:|\/)/.test(e[2]) ? "a" : "button", "e" + (e[2] ? "" : " cur"));
      if (b.tagName === "A") { b.href = e[2]; if (/^https?:/.test(e[2])) { b.target = "_blank"; b.rel = "noopener"; } } else b.type = "button";
      b.appendChild(el("b", "", e[0])); b.appendChild(el("span", "", e[1]));
      if (e[2] && !/^(https?:|\/)/.test(e[2])) b.addEventListener("click", function () { v.remove(); abrir(e[2]); });
      else if (!e[2]) b.addEventListener("click", function () { v.remove(); });
      g.appendChild(b);
    });
    q.appendChild(g); v.appendChild(q);
    v.addEventListener("click", function (e) { if (e.target === v || e.target.closest(".x")) v.remove(); });
    document.addEventListener("keydown", function k(e) { if (e.key === "Escape") { v.remove(); document.removeEventListener("keydown", k); } });
    document.body.appendChild(v);
    try { x.focus(); } catch (e) {}
  }

  // ---------------------------------------------------------------- caminhos do Atlas
  function abrirDireita(tab) {
    var R = raiz(), b = R && R.querySelector('.ipe-tab[data-tab="' + tab + '"]'); if (!b) return false;
    var dir = $("ipe-dir");
    if (!(b.getAttribute("aria-selected") === "true" && (!movel() || (dir && dir.classList.contains("aberto"))))) b.click();
    if (!movel() && R.classList.contains("sem-dir")) { var pn = $("ipe-pn"); if (pn) pn.click(); }
    return true;
  }
  function separadorBase() {
    var sb = [].filter.call(document.querySelectorAll('#ipe [data-pane="enc"] button, #ipe .ipe-tab2 button'), function (b) { return /^(Base Cartogr|Base Map$)/.test(b.textContent.trim()) && visivel(b); })[0];
    if (sb && sb.getAttribute("aria-pressed") !== "true" && sb.getAttribute("aria-selected") !== "true" && !sb.classList.contains("on")) sb.click();
  }
  function abrirEncomenda(depois) {
    var P = est();
    if (!$("ipe-form") || (P && P.modo === "cliente")) { /* no projecto aberto o formulário existe na mesma (separador enc) */ }
    if (!abrirDireita("enc")) { if (depois) depois(null); return; }
    setTimeout(function () { try { separadorBase(); } catch (e) {} esperar(function () { var f = $("ipe-form"); return f && visivel(f) ? f : null; }, 4000, function (f) { if (depois) depois(f); }); }, 150);
    if (movel()) setTimeout(fecharDireitaMovel, 700);
  }
  function fecharDireitaMovel() {
    var R = raiz(), dir = $("ipe-dir"); if (!movel() || !dir || !dir.classList.contains("aberto")) return;
    var b = R && R.querySelector('.ipe-tab[aria-selected="true"]'); if (b) b.click();
  }
  function metodo(m) { var b = document.querySelector('#ipe-form .ipe-mb[data-metodo="' + m + '"]'); if (b && b.getAttribute("aria-pressed") !== "true") b.click(); return b; }
  function luz(e) { if (!e) return; try { e.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (x) {} e.classList.add("ipr-as-luz"); setTimeout(function () { e.classList.remove("ipr-as-luz"); }, 4500); }
  function draw() {
    var m = mapa(); if (!m || !m._controls) return null;
    for (var i = 0; i < m._controls.length; i++) { var c = m._controls[i]; if (c && typeof c.getAll === "function" && typeof c.add === "function") return c; }
    return null;
  }
  function terrenoFC() {
    var d = draw(), fs = [];
    if (d) { try { fs = d.getAll().features || []; } catch (e) {} }
    if (!fs.length) { try { var s = JSON.parse(localStorage.getItem("ipe_terreno_v1") || "null"); if (s && s.f) fs = s.f; } catch (e) {} }
    fs = fs.filter(function (f) { var ty = f && f.geometry && f.geometry.type; return ty === "Polygon" || ty === "MultiPolygon"; });
    return fs.length ? { type: "FeatureCollection", features: fs.map(function (f) { return { type: "Feature", properties: {}, geometry: f.geometry }; }) } : null;
  }
  function areaHa() { var a = txt("ipe-area"); if (!/\d/.test(a) || !/ha/.test(a)) return 0; var n = parseFloat(a.replace(/[^\d,.]/g, "").replace(/\.(?=\d{3})/g, "").replace(",", ".")); return isFinite(n) ? n : 0; }
  function areaTexto() { var a = txt("ipe-area"); return /\d/.test(a) && /ha/.test(a) ? a : ""; }

  // ---------------------------------------------------------------- 2. assistente
  var S = { passo: 1, produto: null, forma: null, leitura: false, enviado: null };
  function pn() { return $("ipr-as-pn"); }
  function botaoFixo() {
    var R = raiz(), mapaEl = $("ipe-mapa"); if (!R || !mapaEl) return;
    var host = mapaEl.parentNode || R;
    var b = $("ipr-as-b");
    if (!b) {
      b = el("button"); b.id = "ipr-as-b"; b.type = "button"; b.className = "ipr-as";
      var ic = el("span", "ic"); ic.appendChild(icone("ok", 18)); b.appendChild(ic);
      var tx = el("span"); tx.appendChild(document.createTextNode(t("abrir"))); tx.appendChild(el("small", "", t("abrirS"))); b.appendChild(tx);
      b.addEventListener("click", function () { abrir(); });
    }
    if (b.parentNode !== host) host.appendChild(b);
    var P = est(); b.hidden = !!(P && P.modo === "cliente" && P.actual && !/[?&]assistente=/.test(location.search)) && false;
  }
  function abrir(produto) {
    estilos(); var R = raiz(); if (!R) return;
    R.classList.add("ipr-as-on");
    if (produto) { S.produto = produto; S.passo = areaTexto() ? 3 : 2; } else if (!S.produto) S.passo = 1;
    desenhar();
    try { if (window.gtag) gtag("event", "assistente_abrir", { produto: produto || "" }); } catch (e) {}
  }
  function fechar() { var p = pn(); if (p) p.remove(); var R = raiz(); if (R) R.classList.remove("ipr-as-on"); pararEspera(); }
  function ir(n) { S.passo = n; desenhar(); }

  function desenhar() {
    var R = raiz(); if (!R) return;
    var host = ($("ipe-mapa") && $("ipe-mapa").parentNode) || R;
    var p = pn();
    if (!p) { p = el("div", "ipr-as"); p.id = "ipr-as-pn"; p.setAttribute("role", "dialog"); p.setAttribute("aria-label", t("abrir")); host.appendChild(p); }
    p.lang = lg(); p.innerHTML = ""; p.classList.remove("mini"); posicionar(p);
    var cab = el("div", "cab"), lin = el("div", "lin");
    lin.appendChild(el("b", "", t("abrir")));
    var x = el("button", "x"); x.type = "button"; x.setAttribute("aria-label", t("fechar")); x.title = t("fechar"); x.appendChild(icone("x", 18)); x.addEventListener("click", fechar);
    lin.appendChild(x); cab.appendChild(lin);
    var ol = el("ol", "pp");
    t("passos").forEach(function (n, i) { var li = el("li", i + 1 < S.passo ? "feito" : i + 1 === S.passo ? "agora" : "", (i + 1) + " · " + n); ol.appendChild(li); });
    cab.appendChild(ol); p.appendChild(cab);
    var mn = el("button", "mn", t("mini")); mn.type = "button"; mn.addEventListener("click", function () { p.classList.remove("mini"); }); cab.appendChild(mn);
    var corpo = el("div", "corpo"); p.appendChild(corpo);
    var rod = el("div", "rod"); p.appendChild(rod);
    [null, passo1, passo2, passo3, passo4][S.passo](corpo, rod);
    if (!rod.children.length) rod.remove();
  }
  function posicionar(p) {
    try {
      var m = $("ipe-mapa"); if (!m || !p || movel()) { if (p) { p.style.left = ""; p.style.top = ""; p.style.bottom = ""; } return; }
      var hr = p.parentNode.getBoundingClientRect(), mr = m.getBoundingClientRect();
      p.style.left = Math.max(8, mr.left - hr.left + 12) + "px"; p.style.top = Math.max(8, mr.top - hr.top + 12) + "px";
      p.style.bottom = Math.max(8, hr.bottom - mr.bottom + 34) + "px";
    } catch (e) {}
  }
  window.addEventListener("resize", function () { var p = pn(); if (p) posicionar(p); });
  function rodape(rod, voltar, seguinte, ativo) {
    if (voltar) { var v = el("button", "bt s"); v.type = "button"; v.appendChild(icone("volta", 14)); v.appendChild(document.createTextNode(t("voltar"))); v.addEventListener("click", voltar); rod.appendChild(v); } else rod.appendChild(el("span"));
    if (seguinte) { var s = el("button", "bt"); s.type = "button"; s.textContent = typeof seguinte === "string" ? seguinte : t("seguinte"); if (ativo === false) s.disabled = true; rod.appendChild(s); return s; }
    return null;
  }
  function precoDesde(k) {
    var p = PR();
    if (k === "base") { var b = p && p.base && p.base.desde; if (!b) b = lerEuros(txt("ipe-preco")) || 99; return b; }
    if (k === "leitura") { var l = p && p.leitura && p.leitura.desde; if (!l) l = lerEuros(txt("ipe-preco-l")) || 125; return l; }
    return PLANTA;
  }
  // passo 1: produto
  function passo1(c, rod) {
    c.appendChild(el("h2", "", t("p1T"))); c.appendChild(el("p", "sub", t("p1S")));
    var g = el("div", "cartoes");
    ["base", "leitura", "planta"].forEach(function (k) {
      var d = t("prod")[k], b = el("button", "c" + (S.produto === k ? " on" : "")); b.type = "button";
      var i = el("span", "i"); i.appendChild(icone(k, 18)); b.appendChild(i);
      b.appendChild(el("b", "", d[0])); b.appendChild(el("em", "", d[2])); b.appendChild(el("span", "", d[1]));
      var v = precoDesde(k);
      b.appendChild(el("span", "pr", t("desde") + " " + euros(v) + " " + t("mais") + " · " + euros(v * (1 + IVA)) + " " + t("comIva")));
      b.addEventListener("click", function () { S.produto = k; S.leitura = false; ir(areaTexto() ? 3 : 2); });
      g.appendChild(b);
    });
    c.appendChild(g);
  }
  // passo 2: terreno
  var ESPERA = null;
  function pararEspera() { if (ESPERA) { clearInterval(ESPERA); ESPERA = null; } }
  function esperarTerreno(caixa) {
    pararEspera();
    var a0 = areaTexto();
    ESPERA = setInterval(function () {
      if (!pn()) { pararEspera(); return; }
      var a = areaTexto();
      if (a && a !== a0) { pararEspera(); achado(caixa, a); }
    }, 400);
  }
  function achado(caixa, a) {
    caixa.innerHTML = "";
    var d = el("div", "ach"), ok = el("span", "ok"); ok.appendChild(icone("ok", 18)); d.appendChild(ok);
    var tx = el("div"); tx.appendChild(el("b", "", t("achado"))); tx.appendChild(el("small", "", t("achadoArea") + " " + a)); d.appendChild(tx);
    caixa.appendChild(d);
    setTimeout(function () { if (S.passo === 2 && pn()) ir(3); }, 1300);
  }
  function passo2(c, rod) {
    c.appendChild(el("h2", "", t("p2T"))); c.appendChild(el("p", "sub", t("p2S")));
    var g = el("div", "formas"), extra = el("div"), caixa = el("div");
    var lista = ["cadastro", "desenhar", "procurar", "coord", "gps", "nic", "ficheiro", "locais", "artigo"];
    lista.forEach(function (k) {
      var d = t("formas")[k], b = el("button", "f" + (S.forma === k ? " on" : "") + (k === "artigo" ? " larga" : "")); b.type = "button";
      var tt = el("span", "t"); tt.appendChild(icone(k, 16)); tt.appendChild(document.createTextNode(d[0])); b.appendChild(tt);
      b.appendChild(el("span", "", d[1]));
      b.addEventListener("click", function () {
        S.forma = k; [].forEach.call(g.children, function (x) { x.classList.toggle("on", x === b); });
        extra.innerHTML = ""; usarForma(k, extra, caixa);
      });
      g.appendChild(b);
    });
    c.appendChild(g); c.appendChild(extra); c.appendChild(caixa);
    var a = areaTexto();
    if (a) achadoSemAvancar(caixa, a); else { var e = el("div", "esp"); e.appendChild(el("i")); e.appendChild(document.createTextNode(t("aEspera"))); caixa.appendChild(e); }
    esperarTerreno(caixa);
    var s = rodape(rod, function () { ir(1); }, t("seguinte"), !!a);
    if (s) s.addEventListener("click", function () { if (areaTexto() || S.forma === "artigo") ir(3); });
    // o botão «Seguinte» acompanha o terreno
    var chk = setInterval(function () { if (!pn() || S.passo !== 2) { clearInterval(chk); return; } if (s) s.disabled = !(areaTexto() || S.forma === "artigo"); }, 500);
  }
  function achadoSemAvancar(caixa, a) {
    var d = el("div", "ach"), ok = el("span", "ok"); ok.appendChild(icone("ok", 18)); d.appendChild(ok);
    var tx = el("div"); tx.appendChild(el("b", "", t("achado"))); tx.appendChild(el("small", "", t("achadoArea") + " " + a)); d.appendChild(tx); caixa.appendChild(d);
  }
  function dica(extra, k) { if (t("dica")[k]) extra.appendChild(el("p", "sub2", t("dica")[k])); }
  function usarForma(k, extra, caixa) {
    if (movel() && /^(cadastro|desenhar|procurar|gps)$/.test(k)) { var pp = pn(); if (pp) setTimeout(function () { pp.classList.add("mini"); }, 400); }
    try { if (window.gtag) gtag("event", "assistente_forma", { forma: k }); } catch (e) {}
    if (k === "cadastro" || k === "desenhar" || k === "ficheiro" || k === "artigo") {
      dica(extra, k);
      abrirEncomenda(function (f) {
        if (!f) return;
        var b = metodo(k);
        if (k === "desenhar") { var d = $("ipe-desenhar"); if (d) d.click(); }
        if (k === "ficheiro") { var fi = $("ipe-carregar"); if (fi) fi.click(); }
        if (k === "artigo") { luz($("ipe-local")); try { $("ipe-local").focus({ preventScroll: true }); } catch (e) {} }
        if (k === "cadastro") { var gb = document.querySelector('#ipe-guia [data-guia="parcelas"]'); if (gb && visivel(gb)) gb.click(); else luz(b); }
      });
      return;
    }
    if (k === "procurar") {
      dica(extra, k);
      var q = $("ipe-q");
      if (movel()) { var lado = document.querySelector('#ipe [data-tool="lado"]'); var R = raiz(); if (lado && R && !R.classList.contains("esq-aberto")) lado.click(); }
      if (q) { luz(q.closest("form") || q); setTimeout(function () { try { q.focus(); } catch (e) {} }, 200); }
      metodoQuandoChegar();
      return;
    }
    if (k === "gps") {
      dica(extra, k);
      var g = $("ipe-gpsq"); if (g) g.click(); else if (navigator.geolocation) navigator.geolocation.getCurrentPosition(function (p) { voar(p.coords.longitude, p.coords.latitude, 17); }, function () {});
      metodoQuandoChegar();
      return;
    }
    if (k === "coord") {
      var l = el("div", "lin2"), i = el("input"); i.type = "text"; i.placeholder = t("coordPh"); i.setAttribute("aria-label", t("formas").coord[0]); i.inputMode = "decimal";
      var b = el("button", "bt"); b.type = "button"; b.textContent = t("coordIr");
      var m = el("p", "falta");
      function vai() {
        var r = lerCoord(i.value); if (!r) { m.textContent = t("coordMau"); return; }
        m.textContent = ""; voar(r[0], r[1], 16); marcar(r[0], r[1]); metodoQuandoChegar();
      }
      b.addEventListener("click", vai); i.addEventListener("keydown", function (e) { e.stopPropagation(); if (e.key === "Enter") { e.preventDefault(); vai(); } });
      l.appendChild(i); l.appendChild(b); extra.appendChild(l); extra.appendChild(m); setTimeout(function () { try { i.focus(); } catch (e) {} }, 50);
      return;
    }
    if (k === "nic") {
      var l2 = el("div", "lin2"), i2 = el("input"); i2.type = "text"; i2.placeholder = t("nicPh"); i2.setAttribute("aria-label", t("formas").nic[0]); i2.style.textTransform = "uppercase";
      var b2 = el("button", "bt"); b2.type = "button"; b2.textContent = t("nicIr");
      function vai2() {
        var v = i2.value.trim().toUpperCase(); if (!v) return;
        abrirEncomenda(function (f) { if (!f) return; metodo("cadastro"); var n = $("ipe-nic"), go = $("ipe-nic-ir"); if (n && go) { n.value = v; n.dispatchEvent(new Event("input", { bubbles: true })); go.click(); } });
      }
      b2.addEventListener("click", vai2); i2.addEventListener("keydown", function (e) { e.stopPropagation(); if (e.key === "Enter") { e.preventDefault(); vai2(); } });
      l2.appendChild(i2); l2.appendChild(b2); extra.appendChild(l2); setTimeout(function () { try { i2.focus(); } catch (e) {} }, 50);
      return;
    }
    if (k === "locais") {
      var ls = locaisArea();
      if (!ls.length) { extra.appendChild(el("p", "sub2", t("semLocais"))); return; }
      var w = el("div", "proj");
      ls.forEach(function (o) {
        var bb = el("button"); bb.type = "button"; bb.appendChild(document.createTextNode(o.nome)); if (o.ha) bb.appendChild(el("small", "", o.ha));
        bb.addEventListener("click", function () { usarLocal(o); });
        w.appendChild(bb);
      });
      extra.appendChild(w);
    }
  }
  function metodoQuandoChegar() {
    // depois de ir ao sítio, propõe clicar nas parcelas (o mais rápido)
    abrirEncomenda(function (f) { if (f) metodo("cadastro"); });
  }
  function lerCoord(s) {
    s = String(s || "").trim().replace(/[°º]/g, " ");
    var m = /^\s*(-?\d+(?:[.,]\d+)?)\s*[N|S]?\s*[,;\s]\s*(-?\d+(?:[.,]\d+)?)\s*[EW|O]?\s*$/i.exec(s);
    if (!m) return null;
    var a = parseFloat(m[1].replace(",", ".")), b = parseFloat(m[2].replace(",", "."));
    if (/S/i.test(s) && a > 0) a = -a; if (/[WO]\s*$/i.test(s) && b > 0) b = -b;
    // PT-TM06 (metros): converter
    if (Math.abs(a) > 1000 || Math.abs(b) > 1000) { var r = tm06(a, b); return r; }
    // lat, lon (Portugal: lat 30..43, lon -32..-6); aceita também lon, lat
    if (Math.abs(a) <= 90 && Math.abs(b) <= 180) { if (a < 0 && b > 0 && b <= 90) return [a, b]; return [b, a]; }
    return null;
  }
  function tm06(x, y) {
    // ETRS89 / PT-TM06 (EPSG:3763) inverso, elipsóide GRS80
    var a = 6378137, f = 1 / 298.257222101, k0 = 1, lat0 = 39.66825833333333 * Math.PI / 180, lon0 = -8.133108333333334 * Math.PI / 180;
    var e2 = f * (2 - f), n = f / (2 - f), A = a / (1 + n) * (1 + n * n / 4 + n * n * n * n / 64);
    function Mf(p) { var e4 = e2 * e2, e6 = e4 * e2; return a * ((1 - e2 / 4 - 3 * e4 / 64 - 5 * e6 / 256) * p - (3 * e2 / 8 + 3 * e4 / 32 + 45 * e6 / 1024) * Math.sin(2 * p) + (15 * e4 / 256 + 45 * e6 / 1024) * Math.sin(4 * p) - (35 * e6 / 3072) * Math.sin(6 * p)); }
    var Mm = Mf(lat0) + y / k0, mu = Mm / (a * (1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 * e2 * e2 / 256)), e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
    var p1 = mu + (3 * e1 / 2 - 27 * Math.pow(e1, 3) / 32) * Math.sin(2 * mu) + (21 * e1 * e1 / 16 - 55 * Math.pow(e1, 4) / 32) * Math.sin(4 * mu) + (151 * Math.pow(e1, 3) / 96) * Math.sin(6 * mu);
    var ep2 = e2 / (1 - e2), C1 = ep2 * Math.cos(p1) * Math.cos(p1), T1 = Math.tan(p1) * Math.tan(p1), N1 = a / Math.sqrt(1 - e2 * Math.sin(p1) * Math.sin(p1)), R1 = a * (1 - e2) / Math.pow(1 - e2 * Math.sin(p1) * Math.sin(p1), 1.5), D = x / (N1 * k0);
    var lat = p1 - (N1 * Math.tan(p1) / R1) * (D * D / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * ep2) * Math.pow(D, 4) / 24 + (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * ep2 - 3 * C1 * C1) * Math.pow(D, 6) / 720);
    var lon = lon0 + (D - (1 + 2 * T1 + C1) * Math.pow(D, 3) / 6 + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * ep2 + 24 * T1 * T1) * Math.pow(D, 5) / 120) / Math.cos(p1);
    void A;
    var la = lat * 180 / Math.PI, lo = lon * 180 / Math.PI;
    return (la > 36 && la < 43 && lo > -10 && lo < -6) ? [lo, la] : null;
  }
  function voar(lon, lat, z) { var m = mapa(); if (m && isFinite(lon) && isFinite(lat)) { try { m.flyTo({ center: [lon, lat], zoom: Math.max(z || 16, m.getZoom()), essential: true }); } catch (e) {} } }
  var MARCA = null;
  function marcar(lon, lat) { var m = mapa(); if (!m || !window.maplibregl) return; try { if (MARCA) MARCA.remove(); MARCA = new maplibregl.Marker({ color: "#94BE39" }).setLngLat([lon, lat]).addTo(m); setTimeout(function () { if (MARCA) { MARCA.remove(); MARCA = null; } }, 60000); } catch (e) {} }
  function locaisArea() {
    var out = [];
    try {
      var P = est(), ls = [];
      ["locais", "meusLocais"].forEach(function (k) { if (P && Array.isArray(P[k])) ls = ls.concat(P[k]); });
      if (!ls.length) { var raw = null; for (var i = 0; i < localStorage.length; i++) { var kk = localStorage.key(i); if (/^ipe_?locais/i.test(kk)) { raw = localStorage.getItem(kk); break; } } if (raw) { var j = JSON.parse(raw); ls = Array.isArray(j) ? j : (j && (j.l || j.locais)) || []; } }
      ls.forEach(function (l) {
        if (!l) return; var tipo = l.tipo || (l.geometry && l.geometry.type); var c = l.c || (l.geometry && l.geometry.coordinates);
        if (!(tipo === "area" || tipo === "Polygon") || !c) return;
        var anel = tipo === "Polygon" ? c[0] : c; if (!anel || anel.length < 3) return;
        if (anel[0][0] !== anel[anel.length - 1][0] || anel[0][1] !== anel[anel.length - 1][1]) anel = anel.concat([anel[0]]);
        out.push({ nome: l.nome || "Área", geo: { type: "Polygon", coordinates: [anel] }, ha: "" });
      });
    } catch (e) {}
    // o botão do projectos-extra, quando existir, é o caminho completo (conta, projectos e navegador)
    return out;
  }
  function usarLocal(o) {
    var pe = [].filter.call(document.querySelectorAll("#ipe-form button"), function (b) { return /meus locais|my places/i.test(b.textContent); })[0];
    abrirEncomenda(function (f) {
      if (!f) return;
      metodo("desenhar");
      var d = draw();
      if (d) { try { d.add({ type: "Feature", properties: {}, geometry: o.geo }); var m = mapa(); m && m.fire && m.fire("draw.create", { features: d.getAll().features.slice(-1) }); } catch (e) {} }
      else if (pe) pe.click();
      var r = o.geo.coordinates[0], b = [180, 90, -180, -90]; r.forEach(function (p) { b[0] = Math.min(b[0], p[0]); b[1] = Math.min(b[1], p[1]); b[2] = Math.max(b[2], p[0]); b[3] = Math.max(b[3], p[1]); });
      try { mapa().fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: 80, maxZoom: 17 }); } catch (e) {}
    });
  }

  // passo 3: preço
  function passo3(c, rod) {
    var k = S.produto || "base", d = t("prod")[k];
    c.appendChild(el("h2", "", d[0])); c.appendChild(el("p", "sub", t("p3S")));
    var a = areaTexto();
    if (a) achadoSemAvancar(c, a);
    else if (S.forma === "artigo") c.appendChild(el("p", "aviso", t("dica").artigo));
    var mud = el("button", "bt s"); mud.type = "button"; mud.style.marginTop = "8px"; mud.textContent = t("mudarTerreno"); mud.addEventListener("click", function () { ir(2); }); c.appendChild(mud);
    var tab = el("table", "pr"), th = el("tr"); [d[0].split(" ")[0], t("semIva"), t("comIva")].forEach(function (h) { th.appendChild(el("th", "", h)); }); tab.appendChild(th);
    var linhas = [], consulta = false;
    if (k === "base") {
      var vb = lerEuros(txt("ipe-preco")); consulta = a && !/€/.test(txt("ipe-preco"));
      linhas.push([t("prod").base[0], vb]);
      if (S.leitura) linhas.push([t("prod").leitura[0], lerEuros(txt("ipe-preco-l"))]);
    } else if (k === "leitura") {
      var vl = lerEuros(txt("ipe-preco-l")); consulta = a && !vl; linhas.push([d[0], vl]);
    } else linhas.push([d[0], PLANTA]);
    var tot = 0, temTudo = true;
    linhas.forEach(function (l) { var tr = el("tr"); tr.appendChild(el("td", "", l[0])); tr.appendChild(el("td", "", l[1] != null ? euros(l[1]) : "—")); tr.appendChild(el("td", "", l[1] != null ? euros(l[1] * (1 + IVA)) : "—")); tab.appendChild(tr); if (l[1] == null) temTudo = false; else tot += l[1]; });
    if (linhas.length > 1 && temTudo) { var tr2 = el("tr", "tot"); tr2.appendChild(el("td", "", "Total")); tr2.appendChild(el("td", "", euros(tot))); tr2.appendChild(el("td", "", euros(tot * (1 + IVA)))); tab.appendChild(tr2); }
    if (consulta) c.appendChild(el("p", "aviso", t("consulta"))); else c.appendChild(tab);
    if (k === "base") {
      var lb = el("label", "ck"), ck = el("input"); ck.type = "checkbox"; ck.checked = S.leitura; lb.appendChild(ck); lb.appendChild(el("span", "", t("juntarL") + (txt("ipe-preco-l") ? " (" + txt("ipe-preco-l") + ")" : "")));
      ck.addEventListener("change", function () { S.leitura = ck.checked; desenhar(); }); c.appendChild(lb);
      if (S.leitura && PR() && PR().pacote10) c.appendChild(el("p", "nota", t("pacote")));
    }
    if (k === "base" && /−\s*50|-\s*50/.test(txt("ipe-preco-l")) && S.leitura) c.appendChild(el("p", "nota", txt("ipe-preco-l")));
    if (k === "leitura" && /−\s*50|-\s*50/.test(txt("ipe-preco-l"))) c.appendChild(el("p", "nota", txt("ipe-preco-l")));
    var ul = el("ul", "inc"); t("inclui")[k].forEach(function (s) { var li = el("li"); li.appendChild(icone("ok", 14)); li.appendChild(el("span", "", s)); ul.appendChild(li); }); c.appendChild(ul);
    if (k === "planta" && sessao() && typeof window.__iprPlanta === "function") {
      var ms = meusProjectos();
      if (ms.length) {
        c.appendChild(el("p", "nota", t("plantaProj")));
        var w = el("div", "proj");
        ms.slice(0, 8).forEach(function (m) { var bb = el("button"); bb.type = "button"; bb.appendChild(document.createTextNode(m.local || m.nome || ("#" + (m.encomenda || m.id)))); bb.appendChild(el("small", "", "#" + (m.encomenda || m.id) + (m.area_ha ? " · " + (+m.area_ha).toLocaleString("pt-PT", { maximumFractionDigits: 2 }) + " ha" : ""))); bb.addEventListener("click", function () { fechar(); window.__iprPlanta(m.encomenda || m.id); }); w.appendChild(bb); });
        c.appendChild(w);
      }
    }
    var s = rodape(rod, function () { ir(2); }, t("seguinte"), !!(a || (k === "base" && S.forma === "artigo")));
    if (s) s.addEventListener("click", function () { ir(4); });
  }
  function meusProjectos() { var P = est(); if (!P) return []; return (P.mapas || []).filter(function (m) { return m && m.geojson && !m.rever; }); }

  // passo 4: dados e pagamento
  function passo4(c, rod) {
    var k = S.produto || "base";
    if (k === "base") return passo4Base(c, rod);
    c.appendChild(el("h2", "", t("p4T"))); c.appendChild(el("p", "sub", t("p4S")));
    if (S.enviado) return feito(c, S.enviado);
    var form = el("form"); form.noValidate = true; form.autocomplete = "on";
    function campo(nome, rot, tipo, ac) { var l = el("label", "l", rot); var i = el("input"); i.type = tipo || "text"; i.name = nome; if (ac) i.autocomplete = ac; l.htmlFor = i.id = "ipr-as-" + nome; form.appendChild(l); form.appendChild(i); i.addEventListener("keydown", function (e) { e.stopPropagation(); }); return i; }
    var pf = function (id) { var e = $(id); return e ? e.value : ""; };
    var nome = campo("nome", t("nome"), "text", "name"), email = campo("email", t("email"), "email", "email"), tel = campo("telefone", t("tel"), "tel", "tel"), nif = campo("nif", t("nif"), "text", "off");
    nome.value = pf("ipe-nome"); email.value = pf("ipe-email"); tel.value = pf("ipe-tel"); nif.value = pf("ipe-nif"); nif.inputMode = "numeric";
    var lp = el("label", "l", t("pais")), pais = el("select"); pais.name = "pais"; pais.id = lp.htmlFor = "ipr-as-pais";
    var src = $("ipe-pais"); if (src) [].forEach.call(src.options, function (o) { var op = el("option", "", o.textContent); op.value = o.value; pais.appendChild(op); }); else { var op = el("option", "", "Portugal"); op.value = "PT"; pais.appendChild(op); }
    pais.value = src ? src.value : "PT"; form.appendChild(lp); form.appendChild(pais);
    var fin = null;
    if (k === "planta") {
      var lf = el("label", "l", t("finalidade")); fin = el("select"); fin.id = lf.htmlFor = "ipr-as-fin";
      t("fin").forEach(function (s) { var o = el("option", "", s); o.value = s; fin.appendChild(o); }); form.appendChild(lf); form.appendChild(fin);
    }
    var ln = el("label", "l", t("notas")), notas = el("textarea"); notas.rows = 2; notas.id = ln.htmlFor = "ipr-as-notas"; notas.addEventListener("keydown", function (e) { e.stopPropagation(); }); form.appendChild(ln); form.appendChild(notas);
    var conta = null;
    if (sessao()) form.appendChild(el("p", "nota", t("contaSessao")));
    else { var lc = el("label", "ck"); conta = el("input"); conta.type = "checkbox"; conta.checked = true; lc.appendChild(conta); lc.appendChild(el("span", "", t("conta"))); form.appendChild(lc); }
    var lk = el("label", "ck"), cons = el("input"); cons.type = "checkbox"; lk.appendChild(cons);
    var sp = el("span"); var pol = el("a", "", t("consent")); pol.href = "/politica-de-privacidade/"; pol.target = "_blank"; pol.rel = "noopener"; pol.style.color = "inherit"; sp.appendChild(pol); sp.appendChild(document.createTextNode(" *")); lk.appendChild(sp); form.appendChild(lk);
    var hp = el("input"); hp.type = "text"; hp.name = "website"; hp.tabIndex = -1; hp.autocomplete = "off"; hp.setAttribute("aria-hidden", "true"); hp.style.cssText = "position:absolute;left:-9999px;width:1px;height:1px;opacity:0"; form.appendChild(hp);
    var falta = el("p", "falta"); form.appendChild(falta);
    var erro = el("p", "erro"); erro.setAttribute("role", "alert"); form.appendChild(erro);
    c.appendChild(form);
    var T0 = Date.now();
    var s = rodape(rod, function () { ir(3); }, ROTA === false ? t("pedirMail") : t("pagar"));
    function ver() {
      var f = [];
      if (!nome.value.trim()) f.push(t("fNome"));
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) f.push(t("fEmail"));
      if (!cons.checked) f.push(t("fConsent"));
      if (!terrenoFC()) f.push(t("fTerreno"));
      falta.textContent = f.length ? t("faltam") + f.join(", ") + "." : "";
      return !f.length;
    }
    [nome, email, cons].forEach(function (i) { i.addEventListener("input", ver); i.addEventListener("change", ver); });
    function enviar(ev) {
      if (ev) ev.preventDefault();
      erro.textContent = "";
      if (!ver()) return;
      var fc = terrenoFC();
      var corpo = {
        produto: k, geojson: JSON.stringify(fc), nome: nome.value.trim(), email: email.value.trim(), telefone: tel.value.trim(), nif: nif.value.trim(),
        pais: pais.value, notas: notas.value.trim(), finalidade: fin ? fin.value : "", consentimento: 1, conta: conta && conta.checked ? 1 : 0,
        website: hp.value, t: String(Math.min(T0, Date.now() - 9000)), lingua: lg()
      };
      if (ROTA === false) { porEmail(k, corpo); S.enviado = { pedido: "", email: corpo.email, total: (k === "planta" ? PLANTA : (lerEuros(txt("ipe-preco-l")) || 0)) * (1 + IVA), area_ha: areaHa(), porEmail: true }; desenhar(); return; }
      s.disabled = true; s.textContent = t("aEnviar");
      fetch("/wp-json/tcd/v1/pedido-produto", { method: "POST", credentials: "same-origin", headers: Object.assign({ "Content-Type": "application/json" }, window.tcdNonce ? { "X-WP-Nonce": window.tcdNonce } : {}), body: JSON.stringify(corpo) })
        .then(function (r) { return r.text().then(function (x) { var j = null; try { j = JSON.parse(x); } catch (e) {} return { ok: r.ok, s: r.status, j: j }; }); })
        .then(function (r) {
          if (!r.j || !r.ok || !r.j.ok) throw new Error((r.j && r.j.message) || ("HTTP " + r.s));
          S.enviado = r.j; S.enviado.email = corpo.email;
          try { if (window.gtag) gtag("event", "assistente_pedido", { produto: k, valor: r.j.total || 0 }); } catch (e) {}
          desenhar();
          if (r.j.pagar) setTimeout(function () { location.href = r.j.pagar; }, 1800);
        })
        .catch(function (x) { erro.textContent = tf("erro", { m: x && x.message || "rede" }); s.disabled = false; s.textContent = t("pagar"); });
    }
    form.addEventListener("submit", enviar);
    if (s) s.addEventListener("click", enviar);
  }
  var ROTA = null; // null = por saber; true = m90590 activo; false = sem rota (pedido por e-mail)
  function sondarRota() {
    if (ROTA !== null) return;
    fetch("/wp-json/tcd/v1/pedido-produto/preco?ha=1", { credentials: "same-origin" }).then(function (r) { ROTA = r.ok; }).catch(function () { ROTA = false; });
  }
  function centro(fc) {
    var x = 0, y = 0, n = 0;
    try { (function per(c) { if (typeof c[0] === "number") { x += c[0]; y += c[1]; n++; } else c.forEach(per); })(fc.features.map(function (f) { return f.geometry.coordinates; })); } catch (e) {}
    return n ? [y / n, x / n] : null;
  }
  function porEmail(k, dados) {
    var fc = terrenoFC(), c = fc && centro(fc), nomeP = t("prod")[k][0];
    var corpo = [nomeP, t("achadoArea") + ": " + (areaTexto() || "—"), c ? "Lat/Lon: " + c[0].toFixed(6) + ", " + c[1].toFixed(6) : "", t("nome") + ": " + dados.nome, t("email") + ": " + dados.email, dados.telefone ? t("tel") + ": " + dados.telefone : "", dados.nif ? "NIF: " + dados.nif : "", dados.finalidade ? t("finalidade") + " " + dados.finalidade : "", dados.notas || "", "", fc ? JSON.stringify(fc).slice(0, 1500) : ""].filter(function (x, i) { return x || i === 9; }).join("\n");
    location.href = "mailto:info@regenerativo.pt?subject=" + encodeURIComponent(nomeP + " · IPR Atlas") + "&body=" + encodeURIComponent(corpo);
  }
  function feito(c, r) {
    var d = el("div", "ach"), ok = el("span", "ok"); ok.appendChild(icone("ok", 18)); d.appendChild(ok);
    var tx = el("div"); tx.appendChild(el("b", "", r.porEmail ? t("okTMail") : t("okT"))); tx.appendChild(el("small", "", euros(r.total || 0) + " · " + (+r.area_ha || 0).toLocaleString(lg() === "en" ? "en-GB" : "pt-PT", { maximumFractionDigits: 2 }) + " ha")); d.appendChild(tx); c.appendChild(d);
    c.appendChild(el("p", "nota", r.porEmail ? t("okMail") : tf("okP", { e: r.email || "", r: r.pedido || "" })));
    if (r.conta === "criada") c.appendChild(el("p", "nota", t("okContaC")));
    if (r.conta === "existe") c.appendChild(el("p", "nota", t("okContaE")));
    if (r.pagar) { var a = el("a", "bt w", t("okPagar")); a.href = r.pagar; a.style.marginTop = "14px"; c.appendChild(a); }
  }
  function passo4Base(c, rod) {
    c.appendChild(el("h2", "", t("p4T")));
    if (!sessao()) {
      c.appendChild(el("p", "aviso", t("baseConta")));
      var a = el("a", "bt w", t("entrar")); a.href = entrarUrl(); a.style.marginTop = "14px"; c.appendChild(a);
      rodape(rod, function () { ir(3); });
      return;
    }
    c.appendChild(el("p", "sub", t("baseForm")));
    var b = el("button", "bt w", t("baseIr")); b.type = "button"; c.appendChild(b);
    function irForm() {
      abrirEncomenda(function (f) {
        if (!f) return;
        var ck = f.querySelector('input[name="leitura"]'); if (ck && ck.checked !== !!S.leitura) ck.click();
        var n = $("ipe-nome"); luz(n); try { n.focus({ preventScroll: true }); } catch (e) {}
        if (movel()) fechar();
      });
    }
    b.addEventListener("click", irForm);
    irForm();
    rodape(rod, function () { ir(3); });
  }

  // ---------------------------------------------------------------- 3. bloco da esquerda
  function esquerda() {
    var esq = $("ipe-esq"); if (!esq) return;
    // «Camadas ligadas» para o fim do bloco
    var cq = $("ipr-cq");
    if (cq && cq.parentNode === esq && esq.lastElementChild !== cq) esq.appendChild(cq);
    // contador de «Os meus locais»: número de locais, não de projectos
    var n = $("ipc-loc-n");
    if (n) { var k = document.querySelectorAll("#ipc-loc .ipe-loc-i").length, v = k ? String(k) : ""; if (n.textContent !== v) { n.textContent = v; n.title = k ? tf("locaisN", { n: k }) : ""; n.style.display = k ? "" : "none"; } }
  }
  // 3b. ao aproximar o mapa de uma Base, o projecto abre-se na esquerda com as camadas (pedido do Nuno, 30/10, 18h38)
  var VISTO_AQUI = {};
  function caixaDe(m) {
    if (m.__iprAsBox) return m.__iprAsBox;
    var g = m.geojson; if (typeof g === "string") { try { g = JSON.parse(g); } catch (e) { g = null; } }
    var b = [180, 90, -180, -90], ok = false;
    (function per(c) { if (!c || !c.length) return; if (typeof c[0] === "number") { ok = true; b[0] = Math.min(b[0], c[0]); b[1] = Math.min(b[1], c[1]); b[2] = Math.max(b[2], c[0]); b[3] = Math.max(b[3], c[1]); } else c.forEach(per); })(
      (function col(o) { if (!o) return []; if (o.type === "FeatureCollection") return (o.features || []).map(col); if (o.type === "Feature") return col(o.geometry); return o.coordinates || []; })(g));
    m.__iprAsBox = ok ? b : null; return m.__iprAsBox;
  }
  function baseAqui() {
    var M0 = mapa(), P = est(); if (!M0 || !P || !Array.isArray(P.mapas) || M0.getZoom() < 12.5) return null;
    var c = M0.getCenter(), melhor = null, menor = Infinity;
    P.mapas.forEach(function (m) {
      if (!m || !m.geojson) return; var b = caixaDe(m); if (!b) return;
      var mx = (b[2] - b[0]) * 0.15, my = (b[3] - b[1]) * 0.15;
      if (c.lng >= b[0] - mx && c.lng <= b[2] + mx && c.lat >= b[1] - my && c.lat <= b[3] + my) { var a = (b[2] - b[0]) * (b[3] - b[1]); if (a < menor) { menor = a; melhor = m; } }
    });
    return melhor;
  }
  function aoMover() {
    var m = baseAqui(), box = $("ipr-mb");
    if (box) [].forEach.call(box.querySelectorAll(".ipr-mb-b.ipr-as-aqui"), function (x) { if (!m || x.getAttribute("data-mb") !== String(m.id)) x.classList.remove("ipr-as-aqui"); });
    if (!m || !box || box.hidden) return;
    var li = box.querySelector('.ipr-mb-b[data-mb="' + String(m.id).replace(/["\\]/g, "") + '"]'); if (!li) return;
    li.classList.add("ipr-as-aqui");
    if (VISTO_AQUI[m.id]) return; VISTO_AQUI[m.id] = 1; // abre uma vez por visita; se a pessoa fechar, fica fechado
    if (!li.classList.contains("ab")) { var bt = li.querySelector('[data-mb-acc="ab"]'); if (bt && !bt.disabled) bt.click(); }
    setTimeout(function () { var l2 = box.querySelector('.ipr-mb-b[data-mb="' + String(m.id).replace(/["\\]/g, "") + '"]'); if (l2) { l2.classList.add("ipr-as-aqui"); try { l2.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch (e) {} } }, 250);
  }
  function ligarMover() {
    var M0 = mapa(); if (!M0 || typeof M0.on !== "function") { setTimeout(ligarMover, 500); return; }
    if (M0.__iprAsMov) return; M0.__iprAsMov = 1;
    var tm = 0; M0.on("moveend", function () { clearTimeout(tm); tm = setTimeout(function () { try { aoMover(); } catch (e) {} }, 350); });
  }

  // ---------------------------------------------------------------- 4. conversor
  function conversor() {
    var d = $("ipe-dir"); if (!d) return;
    var w = document.createTreeWalker(d, NodeFilter.SHOW_TEXT, null), x;
    while ((x = w.nextNode())) { if (/^\s*Failed to fetch\s*$|^\s*NetworkError when attempting to fetch resource\.?\s*$|^\s*Load failed\s*$/.test(x.nodeValue)) x.nodeValue = t("conv"); }
  }

  // ---------------------------------------------------------------- arranque
  function tudo() { try { topo(); } catch (e) {} try { botaoFixo(); } catch (e) {} try { esquerda(); } catch (e) {} try { conversor(); } catch (e) {} }
  function arrancar() {
    if (!raiz() || !$("ipe-ctx-t")) { setTimeout(arrancar, 300); return; }
    estilos(); tudo(); ligarMover(); sondarRota();
    var pend = 0;
    try { new MutationObserver(function () { if (pend) return; pend = setTimeout(function () { pend = 0; tudo(); }, 250); }).observe(raiz(), { childList: true, subtree: true, characterData: true }); } catch (e) {}
    var q = ""; try { q = new URLSearchParams(location.search).get("assistente") || ""; } catch (e) {}
    if (/^(base|leitura|planta)$/.test(q)) setTimeout(function () { abrir(q); }, 600);
    else if (q === "1") setTimeout(function () { abrir(); }, 600);
    window.__iprAssistenteAbrir = abrir;
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arrancar); else arrancar();
})();
