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
   v2 (30/10, 19h36): o assistente passa a perguntas com opções, abre sozinho ao entrar (uma vez por sessão) e evita o mapa:
      número do prédio, coordenadas e GPS escolhem a parcela sozinhos; artigo, morada ou só o concelho seguem sem limite
      desenhado e a equipa localiza o terreno (m90590 v3). Ver a secção 2.
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
    "@media (max-width:900px){body:has(#ipr-as-pn) #tcdfmb{display:none!important}}" +
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
    "#ipr-as-pn .corpo{flex:1;overflow:auto;padding:16px}@keyframes iprAsF{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}" +
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
    // pergunta a pergunta: quadro ao centro com fundo, opções grandes, escolhas rápidas
    "#ipr-as-fundo{position:fixed;inset:0;z-index:2147482000;background:rgba(8,12,6,.55);animation:iprAsF .25s ease-out}" +
    "#ipr-as-pn.centro{background:#0F170B;position:fixed!important;z-index:2147482001;left:50%!important;top:50%!important;bottom:auto!important;transform:translate(-50%,-50%);width:min(540px,calc(100vw - 24px));max-width:none;max-height:calc(100vh - 32px);animation:none!important;opacity:1!important}" +
    "@keyframes iprAsC{from{opacity:0;transform:translate(-50%,-46%)}to{opacity:1;transform:translate(-50%,-50%)}}" +
    "#ipr-as-pn.lado{z-index:1001;animation:none!important;opacity:1!important;transform:none!important}#ipr-as-pn.lado .corpo,#ipr-as-pn.lado .ach{animation:none!important}@media (min-width:901px){#ipr-as-pn.lado{bottom:auto!important;max-height:calc(100% - 90px)}}" +
    "#ipr-as-pn .cab .lin .x:first-child{margin-left:-6px}#ipr-as-pn .np{flex:none;font:500 11px/1 " + M + ";color:#94BE39;letter-spacing:.04em;white-space:nowrap}" +
    "#ipr-as-pn .ops{display:grid;gap:7px}" +
    "#ipr-as-pn .op{all:unset;box-sizing:border-box;cursor:pointer;display:flex;align-items:center;gap:12px;padding:12px 12px 12px 12px;border:1px solid #2E3A26;border-left:3px solid #2E3A26;border-radius:2px;background:#14200F;transition:border-color .15s,background .15s,transform .15s}" +
    "#ipr-as-pn .op:hover,#ipr-as-pn .op:focus-visible{border-color:#94BE39;background:#1B2816}#ipr-as-pn .op:active{transform:scale(.99)}#ipr-as-pn .op.on{border-color:#94BE39;border-left-color:#94BE39;background:#1B2816}" +
    "#ipr-as-pn .op .i{flex:none;display:grid;place-items:center;width:34px;height:34px;border-radius:2px;background:#1B2816;color:#94BE39;border:1px solid #2E3A26}" +
    "#ipr-as-pn .op .tx{flex:1;min-width:0}#ipr-as-pn .op .tx b{display:block;font:600 15px/1.3 " + O + ";color:#E4E2D8}#ipr-as-pn .op .tx small{display:block;margin-top:2px;font-size:12.5px;line-height:1.4;color:#9AA088}#ipr-as-pn .op .tx small.pr{font:500 12px/1.4 " + M + ";color:#B8A83A}" +
    "#ipr-as-pn .op em{flex:none;align-self:flex-start;font:600 10.5px/1 " + M + ";font-style:normal;text-transform:uppercase;letter-spacing:.05em;padding:4px 6px;border-radius:2px;background:#94BE39;color:#0F170B}#ipr-as-pn .op em.c2{background:transparent;color:#B8A83A;border:1px solid #64703F}" +
    "#ipr-as-pn .op .se{flex:none;color:#64703F}#ipr-as-pn .op:hover .se{color:#94BE39}" +
    "#ipr-as-pn .chips{display:flex;flex-wrap:wrap;gap:6px}#ipr-as-pn .chip{all:unset;box-sizing:border-box;cursor:pointer;padding:8px 12px;border:1px solid #2E3A26;border-radius:999px;font-size:13px;color:#E4E2D8;background:#14200F}#ipr-as-pn .chip:hover{border-color:#94BE39}#ipr-as-pn .chip.on{border-color:#94BE39;background:#94BE39;color:#0F170B;font-weight:600}" +
    "#ipr-as-pn .res{padding:10px 12px;margin:0 0 6px;border:1px solid #2E3A26;border-radius:2px;background:#14200F}#ipr-as-pn .res small{display:block;font:500 11px/1.4 " + M + ";text-transform:uppercase;letter-spacing:.05em;color:#9AA088}#ipr-as-pn .res b{display:block;font:600 15px/1.35 " + O + ";color:#E4E2D8}#ipr-as-pn .res b+small{text-transform:none;letter-spacing:0;color:#B8A83A;margin-top:2px}" +
    "#ipr-as-pn .lk{all:unset;cursor:pointer;display:block;margin:14px auto 0;font-size:13px;color:#9AA088;text-decoration:underline;text-underline-offset:3px}#ipr-as-pn .lk:hover{color:#94BE39}" +
    "#ipr-as-pn ul.van{margin:0 0 14px}#ipr-as-pn .chips+label.l,#ipr-as-pn .lin2+div{margin-top:10px}#ipr-as-pn .lin2+div .ops{margin-top:10px}" +
    "@media (max-width:900px){#ipr-as-pn.centro{left:0!important;right:0!important;top:auto!important;bottom:0!important;transform:none;width:100%;max-height:88vh;border-left:0;border-right:0;animation:none!important;opacity:1!important}@keyframes iprAsS{from{transform:translateY(30px);opacity:0}to{transform:none;opacity:1}}#ipr-as-pn.centro .rod{padding-bottom:calc(12px + env(safe-area-inset-bottom))}#ipr-as-pn .op{padding:11px 10px}#ipr-as-pn .op .tx b{font-size:14.5px}}" +
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
    "#ipe .ipe-rosa,#ipe .ipe-rosa.rod{background:transparent!important;box-shadow:none!important;border:0!important}" +
    "html body #ipe .ipe-tools>.ipr-nav .ipe-rosa,html body #ipe .ipe-tools>.ipr-nav .ipe-rosa svg,html body #ipe .ipr-nav .ipe-rosa,html body #ipe .ipr-nav .ipe-rosa svg{width:34px!important;height:34px!important;min-width:0!important}" +
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

  // ---------------------------------------------------------------- 2. assistente pergunta a pergunta
  // Nuno, 30/10/2026, 19h36: «todas as vezes que alguém entra no site aparece aquele pop-up com o assistente [...] quem queira
  // uma planta de localização compra sem conta, o mesmo para a leitura territorial, com a opção de fazer conta e explicar as
  // vantagens [...] guiado com perguntas: tem o número, sabe onde está a propriedade, consegue identificá-la em mapa, pelo
  // cadastro [...] evitar ao máximo que as pessoas usem o mapa [...] sugere cenas e checkboxes, pergunta a pergunta».
  // Abre sozinho uma vez por sessão do navegador (sessionStorage ipr_as_auto), fora de um projecto aberto e sem o guia
  // ?servico= activo; fecha a triagem §63 se estiver aberta. O mapa só é pedido quando a pessoa escolhe mostrar o terreno
  // no mapa ou quando o número do prédio, as coordenadas ou o GPS já puseram a parcela no mapa (aí só confirma).
  // Sem limite desenhado (artigo, morada, só o número, sem dados) o pedido segue com a identificação do terreno e a
  // equipa localiza-o (m90590 v3, campo local); na Leitura pergunta-se a área aproximada para o preço.
  var TQ = {
    pt: {
      ola: "Olá! O que precisa para o seu terreno?", olaS: "Responda a umas perguntas rápidas. Não precisa de saber usar o mapa.",
      naoSei: "Não sei bem o que preciso", naoSeiS: "Ajudamos a escolher em 10 segundos.",
      explorar: "Só quero explorar o mapa",
      ajT: "Para que precisa?", ajS: "Escolha a situação mais parecida com a sua.",
      aj: [["camara", "Entregar na câmara, no banco ou no notário", "Licenciamento, crédito, escritura, IFAP.", "planta"],
        ["comprar", "Vou comprar, vender ou herdar um terreno", "Saber o que se pode fazer lá e o que o condiciona.", "leitura"],
        ["construir", "Quero construir ou mudar o uso do terreno", "REN, RAN, PDM e outras condicionantes.", "leitura"],
        ["projectar", "Vou projectar: casa, agricultura, água, floresta", "Preciso do relevo com rigor (curvas, declives, linhas de água).", "base"]],
      semConta: "Sem conta", comConta: "Com conta", recomendado: "Recomendado",
      sabeT: "Que informação tem do terreno?", sabeS: "Escolha a primeira que tiver. Quanto mais exacta, mais rápido.",
      sabe: {
        ja: ["Usar o terreno que já está no mapa", "{a}"],
        nic: ["Tenho o número do prédio", "Referência cadastral (NIC), por exemplo AAA000742446. Está na caderneta ou no BUPi."],
        artigo: ["Tenho a caderneta ou o artigo matricial", "Concelho, freguesia e número do artigo."],
        morada: ["Sei a morada ou o nome do sítio", "Rua, lugar, aldeia ou nome da quinta."],
        gps: ["Estou no terreno agora", "Usamos a localização do telemóvel."],
        coord: ["Tenho as coordenadas", "Latitude e longitude, ou PT-TM06."],
        ficheiro: ["Tenho um ficheiro do terreno", "KML, KMZ, Shapefile, GeoJSON, GPX, DXF ou DWG."],
        mapa: ["Consigo mostrar no mapa", "Clicar nas parcelas do cadastro ou desenhar o limite."],
        nada: ["Não tenho nada disto", "Diga-nos o concelho e a freguesia: nós encontramos o terreno."]
      },
      nicT: "Qual é o número do prédio?", nicS: "3 letras e 9 números. Está na caderneta predial rústica ou no BUPi.", nicIr: "Procurar no cadastro",
      nicMau: "O número tem 3 letras e 9 números, por exemplo AAA000742446.",
      aProcurar: "A procurar no cadastro da DGT…",
      nicFalhou: "Este prédio não está no cadastro digital (ainda só cobre parte do país). Não faz mal: seguimos com o número e nós localizamos o terreno.",
      seguirAssim: "Continuar assim", tentarMapa: "Prefiro mostrar no mapa",
      artT: "Dados da caderneta", artS: "Se tiver a caderneta, pode enviar-nos uma cópia em resposta ao e-mail de confirmação.",
      concelho: "Concelho", freguesia: "Freguesia", artigoN: "Número do artigo", tipo: "Tipo de prédio", tipos: ["Rústico", "Urbano", "Misto"],
      morT: "Onde fica?", morS: "Escreva a morada, o lugar ou o nome da quinta.", morPh: "Ex.: Monte da Azenha, Odemira", morIr: "Procurar",
      morNada: "Não encontrámos. Experimente só o lugar e o concelho.", morErro: "A pesquisa não respondeu. Tente de novo.",
      morAqui: "Já pusemos o mapa nesse sítio. E agora?",
      morTocar: ["Toco no meu terreno no mapa", "Basta tocar na parcela. Mostramos como."],
      morNos: ["Não sei qual é: localizem vocês", "Seguimos com esta morada e confirmamos o terreno consigo."],
      gpsT: "A ver onde está…", gpsS: "Aceite o pedido de localização do navegador.", gpsErro: "Não conseguimos a sua localização. Verifique se o navegador a permite.",
      coordT: "Quais são as coordenadas?", coordS: "Latitude e longitude (38.12345, -8.12345) ou PT-TM06 em metros.",
      aEscolher: "A procurar a parcela nesse ponto…",
      pontoFalhou: "Não encontrámos uma parcela do cadastro nesse ponto. Escolha:",
      pontoNos: ["Seguir com este ponto", "Nós confirmamos o limite consigo."],
      pontoMapa: ["Mostrar o limite no mapa", "Clicar nas parcelas ou desenhar."],
      ficT: "Escolha o ficheiro", ficS: "Abrimos a janela de ficheiros. O limite aparece no mapa e avançamos sozinhos.", ficDeNovo: "Escolher o ficheiro",
      mapaT: "Como prefere mostrar?", mapaS: "O assistente fica ao lado; quando o terreno estiver marcado, avançamos.",
      mapaOp: { cadastro: ["Clicar nas parcelas do cadastro", "Aproxime o mapa do terreno e toque em cada parcela."], desenhar: ["Desenhar o limite", "Toque em cada canto e feche no primeiro ponto."] },
      procurarMapa: "Procurar o sítio", procurarPh: "Lugar, aldeia ou morada",
      espera: "À espera do terreno no mapa…",
      nadaT: "Onde fica o terreno, mais ou menos?", nadaS: "Com o concelho e a freguesia encontramos o terreno e confirmamos consigo antes de começar.",
      descricao: "Como se chega lá ou o que sabe do terreno (opcional)",
      confT: "Encontrámos o terreno", confS: "Confira no mapa. Está certo?",
      confSim: ["Sim, é este", "Continuar para o preço."], confMais: ["Falta uma parte ou não é bem este", "Corrigir no mapa: juntar ou retirar parcelas."],
      areaT: "Qual é a área, mais ou menos?", areaS: "O preço da Leitura depende da área. Se a área real for diferente, confirmamos antes de começar.",
      areas: [["5", "Até 5 ha", 5], ["20", "5 a 20 ha", 20], ["50", "20 a 50 ha", 50], ["100", "50 a 100 ha", 100], ["mais", "Mais de 100 ha", 0], ["nsei", "Não sei", 5]],
      areaConsulta: "Sob consulta", areaNsei: "Cobramos como até 5 ha; se for maior, dizemos antes de começar.",
      precoT: "O seu pedido", terreno: "Terreno", porLocalizar: "por localizar pela nossa equipa", aprox: "aprox.",
      consultaP: "Para esta área fazemos uma proposta. Deixe os seus dados e respondemos no mesmo dia útil, sem compromisso.",
      continuar: "Continuar", pedirProposta: "Pedir proposta",
      contaT: "Quer criar conta? É grátis", contaS: "Não é obrigatório: pode comprar sem conta.",
      contaSim: ["Sim, criar conta com o meu e-mail", "Recebe um e-mail para escolher a palavra-passe."],
      contaNao: ["Não, só comprar", "Recebe o PDF por e-mail na mesma."],
      vantagens: ["Os PDF e as facturas ficam guardados na sua área", "O terreno fica guardado: a próxima encomenda não precisa de o marcar de novo", "Acompanha o estado do pedido", "Usa o IPR Atlas com os seus locais e projectos"],
      dadosT: "Para onde enviamos?", dadosS: "Só o necessário para a factura e para lhe mandar o resultado.",
      finT: "Para que é a planta?",
      baseT: "A Base Cartográfica fica na sua conta", baseS: "É um projecto com mapas e ficheiros que vai querer abrir mais vezes. Entre ou crie conta (1 minuto): o terreno fica guardado.",
      baseOu: "Prefere sem conta? A Planta de Localização e a Leitura Territorial compram-se sem conta.",
      verPlanta: "Planta sem conta", verLeitura: "Leitura sem conta",
      baseSemLimite: "Para a Base precisamos do limite no mapa. Se não o conseguir marcar, preencha o formulário pelo artigo e nós desenhamos.",
      okPropT: "Pedido de proposta enviado", okPropP: "Respondemos para {e} no mesmo dia útil. Referência {r}.",
      aPagar: "A abrir o pagamento…",
      recomecar: "Recomeçar", passoDe: "Passo {i} de {n}", projS: "Um terreno que já tem na conta, com a Base feita."
    },
    en: {
      ola: "Hello! What do you need for your land?", olaS: "Answer a few quick questions. No need to know how to use the map.",
      naoSei: "I'm not sure what I need", naoSeiS: "We help you choose in 10 seconds.",
      explorar: "I just want to explore the map",
      ajT: "What is it for?", ajS: "Pick the situation closest to yours.",
      aj: [["camara", "To hand in at the town hall, the bank or the notary", "Licensing, loans, deeds, farm subsidies.", "planta"],
        ["comprar", "I'm buying, selling or inheriting land", "What can be done there and what constrains it.", "leitura"],
        ["construir", "I want to build or change the land use", "REN, RAN, PDM and other constraints.", "leitura"],
        ["projectar", "I'm designing: house, farming, water, forest", "I need accurate relief (contours, slopes, water lines).", "base"]],
      semConta: "No account", comConta: "Account", recomendado: "Recommended",
      sabeT: "What do you know about the land?", sabeS: "Pick the first one you have. The more exact, the faster.",
      sabe: {
        ja: ["Use the land already on the map", "{a}"],
        nic: ["I have the parcel number", "Cadastral reference (NIC), e.g. AAA000742446. It is on the deed or in BUPi."],
        artigo: ["I have the tax record (caderneta)", "Municipality, parish and article number."],
        morada: ["I know the address or place name", "Street, place, village or estate name."],
        gps: ["I am on the land now", "We use your phone's location."],
        coord: ["I have the coordinates", "Latitude and longitude, or PT-TM06."],
        ficheiro: ["I have a file of the land", "KML, KMZ, Shapefile, GeoJSON, GPX, DXF or DWG."],
        mapa: ["I can show it on the map", "Click the cadastre parcels or draw the boundary."],
        nada: ["I have none of these", "Tell us the municipality and parish: we find the land."]
      },
      nicT: "What is the parcel number?", nicS: "3 letters and 9 digits. It is on the land tax record or in BUPi.", nicIr: "Search the cadastre",
      nicMau: "The number has 3 letters and 9 digits, e.g. AAA000742446.",
      aProcurar: "Searching the DGT cadastre…",
      nicFalhou: "This parcel is not in the digital cadastre (it only covers part of the country). No problem: we carry on with the number and we locate the land.",
      seguirAssim: "Carry on like this", tentarMapa: "I'd rather show it on the map",
      artT: "Tax record details", artS: "If you have the caderneta, you can send us a copy in reply to the confirmation e-mail.",
      concelho: "Municipality", freguesia: "Parish", artigoN: "Article number", tipo: "Type", tipos: ["Rural", "Urban", "Mixed"],
      morT: "Where is it?", morS: "Type the address, the place or the estate name.", morPh: "E.g. Monte da Azenha, Odemira", morIr: "Search",
      morNada: "Nothing found. Try just the place and the municipality.", morErro: "The search did not answer. Try again.",
      morAqui: "The map is now on that place. What next?",
      morTocar: ["I tap my land on the map", "Just tap the parcel. We show you how."],
      morNos: ["I don't know which one: you find it", "We carry on with this address and confirm the land with you."],
      gpsT: "Finding where you are…", gpsS: "Accept the browser's location request.", gpsErro: "We could not get your location. Check that the browser allows it.",
      coordT: "What are the coordinates?", coordS: "Latitude and longitude (38.12345, -8.12345) or PT-TM06 in metres.",
      aEscolher: "Looking for the parcel at that point…",
      pontoFalhou: "We found no cadastre parcel at that point. Choose:",
      pontoNos: ["Carry on with this point", "We confirm the boundary with you."],
      pontoMapa: ["Show the boundary on the map", "Click the parcels or draw."],
      ficT: "Choose the file", ficS: "We opened the file window. The boundary appears on the map and we move on.", ficDeNovo: "Choose the file",
      mapaT: "How would you like to show it?", mapaS: "The assistant stays at the side; once the land is marked, we move on.",
      mapaOp: { cadastro: ["Click the cadastre parcels", "Zoom in on the land and tap each parcel."], desenhar: ["Draw the boundary", "Tap each corner and close on the first point."] },
      procurarMapa: "Find the place", procurarPh: "Place, village or address",
      espera: "Waiting for the land on the map…",
      nadaT: "Roughly where is the land?", nadaS: "With the municipality and parish we find the land and confirm it with you before we start.",
      descricao: "How to get there or what you know about the land (optional)",
      confT: "We found the land", confS: "Check it on the map. Is it right?",
      confSim: ["Yes, that's it", "Go on to the price."], confMais: ["A part is missing or it's not quite it", "Fix it on the map: add or remove parcels."],
      areaT: "Roughly how big is it?", areaS: "The Reading's price depends on the area. If the real area differs, we confirm before we start.",
      areas: [["5", "Up to 5 ha", 5], ["20", "5 to 20 ha", 20], ["50", "20 to 50 ha", 50], ["100", "50 to 100 ha", 100], ["mais", "More than 100 ha", 0], ["nsei", "I don't know", 5]],
      areaConsulta: "On request", areaNsei: "We charge as up to 5 ha; if it is larger, we tell you before we start.",
      precoT: "Your order", terreno: "Land", porLocalizar: "to be located by our team", aprox: "approx.",
      consultaP: "For this area we send a quote. Leave your details and we reply the same working day, no commitment.",
      continuar: "Continue", pedirProposta: "Ask for a quote",
      contaT: "Create a free account?", contaS: "Not required: you can buy without an account.",
      contaSim: ["Yes, create an account with my e-mail", "You get an e-mail to choose a password."],
      contaNao: ["No, just buy", "You still get the PDF by e-mail."],
      vantagens: ["Your PDFs and invoices are kept in your area", "The land is saved: your next order needs no marking", "Follow the order status", "Use the IPR Atlas with your places and projects"],
      dadosT: "Where do we send it?", dadosS: "Only what we need for the invoice and to send you the result.",
      finT: "What is the plan for?",
      baseT: "The Base Map is kept in your account", baseS: "It is a project with maps and files you will open again. Sign in or create an account (1 minute): the land is kept.",
      baseOu: "Rather without an account? The Location Plan and the Territorial Reading can be bought without one.",
      verPlanta: "Plan, no account", verLeitura: "Reading, no account",
      baseSemLimite: "For the Base we need the boundary on the map. If you cannot mark it, fill in the form by tax article and we draw it.",
      okPropT: "Quote request sent", okPropP: "We reply to {e} the same working day. Reference {r}.",
      aPagar: "Opening the payment…",
      recomecar: "Start again", passoDe: "Step {i} of {n}", projS: "Land already in your account, with the Base done."
    }
  };
  function q(k) { var o = TQ[lg()][k]; return o === undefined ? TQ.pt[k] : o; }
  function qf(k, v) { var s = q(k); Object.keys(v || {}).forEach(function (x) { s = s.split("{" + x + "}").join(String(v[x])); }); return s; }

  var S = { q: "produto", hist: [], produto: null, via: null, local: {}, geo: false, ha: null, consulta: false, nsei: false, conta: true, fin: null, leitura: false, enviado: null };
  var FASE = { produto: 1, ajuda: 1, sabe: 2, nic: 2, artigo: 2, morada: 2, morAqui: 2, gps: 2, coord: 2, ponto: 2, ficheiro: 2, mapa: 2, nada: 2, confirmar: 2, area: 2, preco: 3, base: 4, conta: 4, dados: 4, feito: 4 };
  var LADO = { mapa: 1, ficheiro: 1, mapaEspera: 1 };
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
  }
  function abrir(produto) {
    estilos(); var R = raiz(); if (!R) return;
    R.classList.add("ipr-as-on");
    fecharTriagem();
    if (produto && /^(base|leitura|planta)$/.test(produto)) { S.produto = produto; S.hist = ["produto"]; S.q = "sabe"; }
    else if (!S.produto || S.q === "feito") { S.q = "produto"; S.hist = []; }
    desenhar();
    try { if (window.gtag) gtag("event", "assistente_abrir", { produto: produto || "" }); } catch (e) {}
  }
  function fechar() {
    var p = pn(); if (p) p.remove(); var f = $("ipr-as-fundo"); if (f) f.remove();
    var R = raiz(); if (R) R.classList.remove("ipr-as-on"); pararEspera();
    try { sessionStorage.setItem("ipr_as_auto", "1"); } catch (e) {}
  }
  function fecharTriagem() {
    var tri = $("ipr-tri"); if (tri && !tri.hidden) { var x = tri.querySelector('[data-a63="fechar"]'); if (x) try { x.click(); } catch (e) {} }
    document.documentElement.classList.add("ipr-sem-guia");
  }
  function vai(n) { pararEspera(); if (S.q !== n) S.hist.push(S.q); S.q = n; desenhar(); }
  function voltar() { pararEspera(); S.q = S.hist.pop() || "produto"; desenhar(); }

  function desenhar() {
    var R = raiz(); if (!R) return;
    var lado = !!LADO[S.q];
    var host = lado ? (($("ipe-mapa") && $("ipe-mapa").parentNode) || R) : document.body;
    var p = pn();
    if (!p) { p = el("div", "ipr-as"); p.id = "ipr-as-pn"; p.setAttribute("role", "dialog"); p.setAttribute("aria-label", t("abrir")); }
    if (p.parentNode !== host) host.appendChild(p);
    p.lang = lg(); p.innerHTML = ""; p.classList.remove("mini"); p.classList.toggle("centro", !lado); p.classList.toggle("lado", lado);
    var fu = $("ipr-as-fundo");
    if (!lado) { if (!fu) { fu = el("div", "ipr-as"); fu.id = "ipr-as-fundo"; fu.addEventListener("click", function () { fechar(); }); } if (fu.nextSibling !== p) document.body.insertBefore(fu, p); }
    else if (fu) fu.remove();
    posicionar(p);
    var cab = el("div", "cab"), lin = el("div", "lin");
    if (S.hist.length && S.q !== "feito") { var vb = el("button", "x"); vb.type = "button"; vb.setAttribute("aria-label", t("voltar")); vb.title = t("voltar"); vb.appendChild(icone("volta", 16)); vb.addEventListener("click", voltar); lin.appendChild(vb); }
    lin.appendChild(el("b", "", S.produto ? t("prod")[S.produto][0] : t("abrir")));
    var x = el("button", "x"); x.type = "button"; x.setAttribute("aria-label", t("fechar")); x.title = t("fechar"); x.appendChild(icone("x", 18)); x.addEventListener("click", fechar);
    lin.appendChild(x); cab.appendChild(lin);
    var np = passoN(); var pn0 = el("small", "np", qf("passoDe", { i: np[0], n: np[1] })); lin.insertBefore(pn0, x);
    var fz = FASE[S.q] || 1, ol = el("ol", "pp");
    t("passos").forEach(function (n, i) { ol.appendChild(el("li", i + 1 < fz ? "feito" : i + 1 === fz ? "agora" : "", n)); });
    cab.appendChild(ol); p.appendChild(cab);
    var mn = el("button", "mn", t("mini")); mn.type = "button"; mn.addEventListener("click", function () { p.classList.remove("mini"); }); cab.appendChild(mn);
    var corpo = el("div", "corpo"); p.appendChild(corpo);
    var rod = el("div", "rod"); p.appendChild(rod);
    try { (Q[S.q] || Q.produto)(corpo, rod); } catch (e) { corpo.appendChild(el("p", "erro", String(e && e.message || e))); }
    // botão «Voltar» sempre no rodapé (pedido do Nuno, 30/10, 20h49: «em todas as situações tem que haver sempre um botão
    // de voltar para trás e sempre uma barra de progresso»)
    if (S.hist.length && S.q !== "feito") {
      var vt = el("button", "bt s"); vt.type = "button"; vt.appendChild(icone("volta", 14)); vt.appendChild(document.createTextNode(t("voltar"))); vt.addEventListener("click", voltar);
      var pr0 = rod.firstChild; if (pr0 && pr0.tagName === "SPAN" && !pr0.textContent) rod.replaceChild(vt, pr0); else rod.insertBefore(vt, rod.firstChild);
      if (rod.children.length === 1) rod.style.justifyContent = "flex-start";
    }
    if (!rod.children.length) rod.remove();
    if (!lado) { var f1 = corpo.querySelector("input,button.op"); if (f1 && !movel()) setTimeout(function () { try { f1.focus({ preventScroll: true }); } catch (e) {} }, 60); }
  }
  // passo actual e total previsto pelo caminho que a pessoa está a seguir
  var FALTA = { produto: 5, ajuda: 5, sabe: 4, nic: 4, artigo: 3, morada: 4, morAqui: 3, gps: 5, coord: 5, ponto: 4, ficheiro: 4, mapaQ: 5, mapa: 4, nada: 3, projs: 0, confirmar: 3, area: 3, preco: 2, conta: 1, base: 0, dados: 0, feito: 0 };
  function passoN() {
    var i = S.hist.length + 1, f = FALTA[S.q] != null ? FALTA[S.q] : 2;
    if (sessao() && f > 0 && S.q !== "dados" && S.q !== "conta") f -= 1;
    if (S.produto === "leitura" && /^(artigo|nada|morada|morAqui)$/.test(S.q)) f += 1;
    if (S.produto === "base" && f > 1) f -= 1;
    if (S.q === "feito") i = S.hist.length;
    return [i, Math.max(i, i + f)];
  }
  function posicionar(p) {
    try {
      if (p.classList.contains("centro") || movel()) { p.style.left = ""; p.style.top = ""; p.style.bottom = ""; return; }
      var m = $("ipe-mapa"); if (!m) return;
      var hr = p.parentNode.getBoundingClientRect(), mr = m.getBoundingClientRect();
      p.style.left = Math.max(8, mr.left - hr.left + 12) + "px"; p.style.top = Math.max(8, mr.top - hr.top + 12) + "px";
      p.style.bottom = Math.max(8, hr.bottom - mr.bottom + 34) + "px";
    } catch (e) {}
  }
  window.addEventListener("resize", function () { var p = pn(); if (p) posicionar(p); });

  // peças
  function titulo(c, h, s) { c.appendChild(el("h2", "", h)); if (s) c.appendChild(el("p", "sub", s)); }
  function opcoes(c, lista) {
    var g = el("div", "ops");
    lista.forEach(function (o) {
      if (!o) return;
      var b = el("button", "op" + (o.on ? " on" : "")); b.type = "button";
      if (o.ico) { var i = el("span", "i"); i.appendChild(icone(o.ico, 18)); b.appendChild(i); }
      var tx = el("span", "tx"); tx.appendChild(el("b", "", o.t)); if (o.s) tx.appendChild(el("small", "", o.s)); if (o.pr) tx.appendChild(el("small", "pr", o.pr)); b.appendChild(tx);
      if (o.tag) b.appendChild(el("em", o.tagC || "", o.tag));
      var se = el("span", "se"); se.appendChild(icone("seta", 16)); b.appendChild(se);
      b.addEventListener("click", function () { o.fn(b); });
      g.appendChild(b);
    });
    c.appendChild(g); return g;
  }
  function campoL(c, rot, ph, tipo, ac) {
    var l = el("label", "l", rot), i = el("input"); i.type = tipo || "text"; if (ph) i.placeholder = ph; if (ac) i.autocomplete = ac;
    i.id = l.htmlFor = "ipr-as-c" + (++campoL.n); i.addEventListener("keydown", function (e) { e.stopPropagation(); });
    c.appendChild(l); c.appendChild(i); return i;
  }
  campoL.n = 0;
  function linhaIr(c, ph, rot, fn, maius) {
    var l = el("div", "lin2"), i = el("input"); i.type = "text"; i.placeholder = ph; if (maius) i.style.textTransform = "uppercase";
    var b = el("button", "bt"); b.type = "button"; b.textContent = rot;
    i.addEventListener("keydown", function (e) { e.stopPropagation(); if (e.key === "Enter") { e.preventDefault(); fn(i.value, i, b); } });
    b.addEventListener("click", function () { fn(i.value, i, b); });
    l.appendChild(i); l.appendChild(b); c.appendChild(l); return i;
  }
  function chips(c, lista, valor, fn) {
    var w = el("div", "chips");
    lista.forEach(function (v) {
      var b = el("button", "chip" + (valor === v ? " on" : ""), v); b.type = "button"; b.setAttribute("aria-pressed", String(valor === v));
      b.addEventListener("click", function () { [].forEach.call(w.children, function (x) { var on = x === b; x.classList.toggle("on", on); x.setAttribute("aria-pressed", String(on)); }); fn(v); });
      w.appendChild(b);
    });
    c.appendChild(w); return w;
  }
  function esperaBox(c, txt0) { var e = el("div", "esp"); e.appendChild(el("i")); e.appendChild(document.createTextNode(txt0)); c.appendChild(e); return e; }
  function seguinte(rod, rot, fn, ativo) {
    rod.appendChild(el("span"));
    var s = el("button", "bt"); s.type = "button"; s.textContent = rot || q("continuar"); if (ativo === false) s.disabled = true; s.addEventListener("click", function () { if (!s.disabled) fn(); }); rod.appendChild(s); return s;
  }
  function haTxt(h) { return (+h || 0).toLocaleString(lg() === "en" ? "en-GB" : "pt-PT", { maximumFractionDigits: 2 }) + " ha"; }

  // espera do terreno no mapa (#ipe-area muda)
  var ESPERA = null;
  function pararEspera() { if (ESPERA) { clearInterval(ESPERA); ESPERA = null; } }
  function esperarArea(feito, limite, falhou) {
    pararEspera();
    var a0 = areaTexto(), t0 = Date.now();
    ESPERA = setInterval(function () {
      if (!pn()) { pararEspera(); return; }
      fecharEsqMovel();
      var a = areaTexto();
      if (a && a !== a0) { pararEspera(); feito(a); return; }
      if (limite && Date.now() - t0 > limite) { pararEspera(); if (falhou) falhou(); }
    }, 350);
  }
  // no telemóvel, tocar no mapa abre a gaveta da esquerda (ficha do sítio) por cima do mapa: enquanto o assistente espera
  // pelo terreno, a gaveta fecha-se para a pessoa ver o que está a marcar
  function fecharEsqMovel() {
    var R = raiz(); if (!movel() || !R || !R.classList.contains("esq-aberto")) return;
    var l = document.querySelector('#ipe [data-tool="lado"]'); if (l) try { l.click(); } catch (e) {}
    if (R.classList.contains("esq-aberto")) R.classList.remove("esq-aberto");
  }
  function terrenoAchado() { S.geo = true; S.local = {}; S.ha = areaHa(); S.consulta = false; S.nsei = false; vai("confirmar"); }
  function semLimite(local) { S.geo = false; S.local = local || {}; S.ha = null; depoisTerreno(); }
  function depoisTerreno() {
    if (S.produto === "leitura" && !S.geo) return vai("area");
    if (S.produto === "base" && !sessao()) return vai("base");
    if (S.produto === "base") return vai("base");
    vai("preco");
  }
  function ferramentaParcelas() {
    var P = est();
    if (P && P.tool !== "parcelas") { var tb = document.querySelector('#ipe .ipe-t[data-tool="parcelas"]'); if (tb && tb.getAttribute("aria-pressed") !== "true") try { tb.click(); } catch (e) {} if (P.tool !== "parcelas") P.tool = "parcelas"; }
  }
  // põe o mapa no ponto e escolhe a parcela do cadastro que lá está (o mesmo clique que a pessoa faria)
  function parcelaEm(lon, lat) {
    abrirEncomenda(function (f) {
      if (f) metodo("cadastro");
      ferramentaParcelas();
      var m = mapa(); if (!m) return;
      try { m.jumpTo({ center: [lon, lat], zoom: Math.max(16.5, m.getZoom()) }); } catch (e) {}
      marcar(lon, lat);
      var feito1 = false;
      function clicar() {
        if (feito1) return; feito1 = true;
        try { var pt = m.project([lon, lat]); m.fire("click", { lngLat: window.maplibregl ? new maplibregl.LngLat(lon, lat) : { lng: lon, lat: lat }, point: pt, originalEvent: {} }); } catch (e) {}
      }
      try { m.once("idle", clicar); } catch (e) {}
      setTimeout(clicar, 1800);
    });
  }

  var Q = {};
  Q.produto = function (c) {
    titulo(c, q("ola"), q("olaS"));
    var d = t("prod"), pl = PLANTA;
    opcoes(c, [
      { ico: "planta", t: d.planta[0], s: d.planta[1], pr: euros(pl) + " " + t("mais") + " · " + euros(pl * (1 + IVA)) + " " + t("comIva"), tag: q("semConta"), fn: function () { S.produto = "planta"; vai("sabe"); } },
      { ico: "leitura", t: d.leitura[0], s: d.leitura[1], pr: t("desde") + " " + euros(precoDesde("leitura")) + " " + t("mais") + " · " + euros(precoDesde("leitura") * (1 + IVA)) + " " + t("comIva"), tag: q("semConta"), fn: function () { S.produto = "leitura"; preCarregarPrecos(); vai("sabe"); } },
      { ico: "base", t: d.base[0], s: d.base[1], pr: t("desde") + " " + euros(precoDesde("base")) + " " + t("mais") + " · " + euros(precoDesde("base") * (1 + IVA)) + " " + t("comIva"), tag: q("comConta"), tagC: "c2", fn: function () { S.produto = "base"; vai("sabe"); } },
      { ico: "eco", t: q("naoSei"), s: q("naoSeiS"), fn: function () { vai("ajuda"); } }
    ]);
    var ex = el("button", "lk", q("explorar")); ex.type = "button"; ex.addEventListener("click", fechar); c.appendChild(ex);
  };
  Q.ajuda = function (c) {
    titulo(c, q("ajT"), q("ajS"));
    opcoes(c, q("aj").map(function (a) { return { ico: a[3], t: a[1], s: a[2], tag: t("prod")[a[3]][0], fn: function () { S.produto = a[3]; if (a[3] === "leitura") preCarregarPrecos(); vai("sabe"); } }; }));
  };
  Q.sabe = function (c) {
    titulo(c, q("sabeT"), q("sabeS"));
    var sb = q("sabe"), a = areaTexto(), L = [];
    if (a) L.push({ ico: "ok", t: sb.ja[0], s: sb.ja[1].replace("{a}", a), tag: q("recomendado"), fn: function () { S.via = "ja"; terrenoAchado(); } });
    L.push({ ico: "nic", t: sb.nic[0], s: sb.nic[1], fn: function () { S.via = "nic"; vai("nic"); } });
    L.push({ ico: "artigo", t: sb.artigo[0], s: sb.artigo[1], fn: function () { S.via = "artigo"; vai("artigo"); } });
    L.push({ ico: "procurar", t: sb.morada[0], s: sb.morada[1], fn: function () { S.via = "morada"; vai("morada"); } });
    if ("geolocation" in navigator) L.push({ ico: "gps", t: sb.gps[0], s: sb.gps[1], fn: function () { S.via = "gps"; vai("gps"); } });
    L.push({ ico: "coord", t: sb.coord[0], s: sb.coord[1], fn: function () { S.via = "coord"; vai("coord"); } });
    L.push({ ico: "ficheiro", t: sb.ficheiro[0], s: sb.ficheiro[1], fn: function () { S.via = "ficheiro"; vai("ficheiro"); } });
    L.push({ ico: "cadastro", t: sb.mapa[0], s: sb.mapa[1], fn: function () { S.via = "mapa"; vai("mapaQ"); } });
    L.push({ ico: "locais", t: sb.nada[0], s: sb.nada[1], fn: function () { S.via = "nada"; vai("nada"); } });
    if (S.produto === "planta" && sessao() && typeof window.__iprPlanta === "function" && meusProjectos().length) L.push({ ico: "planta", t: t("plantaProjB"), s: q("projS"), fn: function () { vai("projs"); } });
    opcoes(c, L);
  };
  Q.projs = function (c) {
    titulo(c, t("plantaProjB"), q("projS"));
    opcoes(c, meusProjectos().slice(0, 30).map(function (m) { return { ico: "planta", t: m.local || m.nome || ("#" + (m.encomenda || m.id)), s: "#" + (m.encomenda || m.id) + (m.area_ha ? " · " + haTxt(m.area_ha) : ""), fn: function () { fechar(); window.__iprPlanta(m.encomenda || m.id); } }; }));
  };
  FASE.projs = 2;
  Q.nic = function (c, rod) {
    titulo(c, q("nicT"), q("nicS"));
    var msg = el("div");
    var inp = linhaIr(c, t("nicPh"), q("nicIr"), function (v, i, b) {
      var n = String(v || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
      msg.innerHTML = "";
      if (!/^[A-Z]{3}\d{9}$/.test(n)) { msg.appendChild(el("p", "falta", q("nicMau"))); return; }
      S.local = { nic: n }; b.disabled = true; i.disabled = true;
      esperaBox(msg, q("aProcurar"));
      abrirEncomenda(function (f) { if (!f) return; metodo("cadastro"); var ni = $("ipe-nic"), go = $("ipe-nic-ir"); if (ni && go) { ni.value = n; ni.dispatchEvent(new Event("input", { bubbles: true })); go.click(); } });
      esperarArea(function () { S.via = "nic"; terrenoAchado(); S.local = { nic: n }; }, 14000, function () {
        msg.innerHTML = ""; b.disabled = false; i.disabled = false;
        msg.appendChild(el("p", "aviso", q("nicFalhou")));
        opcoes(msg, [{ ico: "ok", t: q("seguirAssim"), fn: function () { semLimite({ nic: n }); } }, { ico: "cadastro", t: q("tentarMapa"), fn: function () { vai("mapaQ"); } }]);
      });
    }, true);
    if (S.local && S.local.nic) inp.value = S.local.nic;
    c.appendChild(msg);
  };
  Q.artigo = function (c, rod) {
    titulo(c, q("artT"), q("artS"));
    var L = S.local || {};
    var co = campoL(c, q("concelho"), "", "text", "address-level2"), fr = campoL(c, q("freguesia")), ar = campoL(c, q("artigoN"), "", "text", "off");
    co.value = L.concelho || ""; fr.value = L.freguesia || ""; ar.value = L.artigo || ""; ar.inputMode = "numeric";
    c.appendChild(el("label", "l", q("tipo")));
    var tipo = L.tipo || q("tipos")[0]; chips(c, q("tipos"), tipo, function (v) { tipo = v; });
    var s = seguinte(rod, q("continuar"), function () { semLimite({ concelho: co.value.trim(), freguesia: fr.value.trim(), artigo: ar.value.trim(), tipo: tipo }); }, false);
    function ver() { s.disabled = !(co.value.trim() && ar.value.trim()); }
    [co, fr, ar].forEach(function (i) { i.addEventListener("input", ver); }); ver();
  };
  Q.morada = function (c) {
    titulo(c, q("morT"), q("morS"));
    var res = el("div");
    var inp = linhaIr(c, q("morPh"), q("morIr"), function (v) { procurarMorada(v, res, function (r) { S.local = { morada: r.nome, coord: r.lat.toFixed(6) + "," + r.lon.toFixed(6) }; try { mapa().jumpTo({ center: [r.lon, r.lat], zoom: 17 }); } catch (e) {} marcar(r.lon, r.lat); vai("morAqui"); }); });
    if (S.local && S.local.morada) inp.value = S.local.morada;
    c.appendChild(res);
  };
  function procurarMorada(v, res, escolher) {
    v = String(v || "").trim(); res.innerHTML = ""; if (v.length < 3) return;
    var cc = lerCoord(v); if (cc) { escolher({ nome: v, lon: cc[0], lat: cc[1] }); return; }
    esperaBox(res, "…");
    fetch("https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&countrycodes=pt&accept-language=" + lg() + "&q=" + encodeURIComponent(v))
      .then(function (r) { return r.json(); })
      .then(function (j) {
        res.innerHTML = "";
        if (!j || !j.length) { res.appendChild(el("p", "falta", q("morNada"))); return; }
        opcoes(res, j.slice(0, 6).map(function (r) { var nm = String(r.display_name || "").split(", "); return { ico: "gps", t: nm.slice(0, 2).join(", "), s: nm.slice(2, 5).join(", "), fn: function () { escolher({ nome: r.display_name, lon: +r.lon, lat: +r.lat }); } }; }));
      })
      .catch(function () { res.innerHTML = ""; res.appendChild(el("p", "falta", q("morErro"))); });
  }
  Q.morAqui = function (c) {
    titulo(c, q("morAqui"), S.local && S.local.morada ? String(S.local.morada).split(", ").slice(0, 3).join(", ") : "");
    var mt = q("morTocar"), mn = q("morNos");
    opcoes(c, [
      { ico: "cadastro", t: mt[0], s: mt[1], tag: q("recomendado"), fn: function () { S.modoMapa = "cadastro"; vai("mapa"); } },
      { ico: "ok", t: mn[0], s: mn[1], fn: function () { semLimite(S.local); } }
    ]);
  };
  Q.gps = function (c) {
    titulo(c, q("gpsT"), q("gpsS"));
    var msg = el("div"); c.appendChild(msg); esperaBox(msg, q("gpsS"));
    navigator.geolocation.getCurrentPosition(function (p) {
      var lon = p.coords.longitude, lat = p.coords.latitude;
      S.local = { coord: lat.toFixed(6) + "," + lon.toFixed(6), gps: 1 };
      vai("ponto"); parcelaEm(lon, lat);
    }, function () { msg.innerHTML = ""; msg.appendChild(el("p", "falta", q("gpsErro"))); opcoes(msg, [{ ico: "coord", t: q("sabe").coord[0], fn: function () { vai("coord"); } }, { ico: "procurar", t: q("sabe").morada[0], fn: function () { vai("morada"); } }]); }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
  };
  Q.coord = function (c) {
    titulo(c, q("coordT"), q("coordS"));
    var msg = el("div");
    linhaIr(c, t("coordPh"), t("coordIr"), function (v) {
      msg.innerHTML = ""; var r = lerCoord(v);
      if (!r) { msg.appendChild(el("p", "falta", t("coordMau"))); return; }
      S.local = { coord: r[1].toFixed(6) + "," + r[0].toFixed(6) };
      vai("ponto"); parcelaEm(r[0], r[1]);
    });
    c.appendChild(msg);
  };
  Q.ponto = function (c) {
    titulo(c, q("aEscolher"));
    var msg = el("div"); c.appendChild(msg); esperaBox(msg, q("aProcurar"));
    var L = S.local;
    esperarArea(function () { terrenoAchado(); S.local = L; }, 12000, function () {
      msg.innerHTML = ""; msg.appendChild(el("p", "aviso", q("pontoFalhou")));
      var a = q("pontoNos"), b = q("pontoMapa");
      opcoes(msg, [{ ico: "ok", t: a[0], s: a[1], fn: function () { semLimite(L); } }, { ico: "cadastro", t: b[0], s: b[1], fn: function () { vai("mapaQ"); } }]);
    });
  };
  Q.ficheiro = function (c, rod) {
    titulo(c, q("ficT"), q("ficS"));
    function abrirF() { abrirEncomenda(function (f) { if (!f) return; metodo("ficheiro"); var fi = $("ipe-carregar"); if (fi) fi.click(); }); }
    var b = el("button", "bt w", q("ficDeNovo")); b.type = "button"; b.addEventListener("click", abrirF); c.appendChild(b);
    esperaBox(c, q("espera"));
    abrirF();
    esperarArea(function () { terrenoAchado(); }, 0);
  };
  Q.mapaQ = function (c) {
    titulo(c, q("mapaT"), q("mapaS"));
    var o = q("mapaOp");
    opcoes(c, [
      { ico: "cadastro", t: o.cadastro[0], s: o.cadastro[1], tag: q("recomendado"), fn: function () { S.modoMapa = "cadastro"; vai("mapa"); } },
      { ico: "desenhar", t: o.desenhar[0], s: o.desenhar[1], fn: function () { S.modoMapa = "desenhar"; vai("mapa"); } }
    ]);
  };
  FASE.mapaQ = 2;
  Q.mapa = function (c) {
    var k = S.modoMapa || "cadastro";
    titulo(c, q("mapaOp")[k][0], t("dica")[k]);
    if (S.via !== "morada") {
      var res = el("div");
      linhaIr(c, q("procurarPh"), q("morIr"), function (v) { procurarMorada(v, res, function (r) { res.innerHTML = ""; try { mapa().jumpTo({ center: [r.lon, r.lat], zoom: 17 }); } catch (e) {} marcar(r.lon, r.lat); }); });
      c.appendChild(res);
    }
    esperaBox(c, q("espera"));
    var tr = el("button", "lk", k === "cadastro" ? q("mapaOp").desenhar[0] : q("mapaOp").cadastro[0]); tr.type = "button";
    tr.addEventListener("click", function () { S.modoMapa = k === "cadastro" ? "desenhar" : "cadastro"; desenhar(); }); c.appendChild(tr);
    abrirEncomenda(function (f) {
      if (!f) return; metodo(k);
      if (k === "desenhar") { var d = $("ipe-desenhar"); if (d) d.click(); }
      else { ferramentaParcelas(); var gb = document.querySelector('#ipe-guia [data-guia="parcelas"]'); if (gb && visivel(gb)) gb.click(); }
    });
    if (movel()) { var pp = pn(); if (pp) setTimeout(function () { pp.classList.add("mini"); }, 900); }
    var L = S.via === "morada" ? S.local : null;
    esperarArea(function () { terrenoAchado(); if (L) S.local = L; }, 0);
  };
  Q.nada = function (c, rod) {
    titulo(c, q("nadaT"), q("nadaS"));
    var L = S.local || {};
    var co = campoL(c, q("concelho"), "", "text", "address-level2"), fr = campoL(c, q("freguesia"));
    var ld = el("label", "l", q("descricao")), ds = el("textarea"); ds.rows = 3; ds.id = ld.htmlFor = "ipr-as-desc"; ds.addEventListener("keydown", function (e) { e.stopPropagation(); }); c.appendChild(ld); c.appendChild(ds);
    co.value = L.concelho || ""; fr.value = L.freguesia || ""; ds.value = L.descricao || "";
    var s = seguinte(rod, q("continuar"), function () { semLimite({ concelho: co.value.trim(), freguesia: fr.value.trim(), descricao: ds.value.trim() }); }, false);
    function ver() { s.disabled = !co.value.trim(); }
    [co, fr].forEach(function (i) { i.addEventListener("input", ver); }); ver();
  };
  Q.confirmar = function (c) {
    titulo(c, q("confT"), q("confS"));
    achadoSemAvancar(c, areaTexto());
    var a = q("confSim"), b = q("confMais");
    opcoes(c, [
      { ico: "ok", t: a[0], s: a[1], fn: function () { S.ha = areaHa(); depoisTerreno(); } },
      { ico: "cadastro", t: b[0], s: b[1], fn: function () { S.modoMapa = "cadastro"; vai("mapa"); } }
    ]);
  };
  Q.area = function (c) {
    titulo(c, q("areaT"), q("areaS"));
    opcoes(c, q("areas").map(function (a) {
      return { ico: "cadastro", t: a[1], s: a[0] === "nsei" ? q("areaNsei") : a[0] === "mais" ? q("areaConsulta") : "", on: S.haK === a[0],
        fn: function () { S.haK = a[0]; S.consulta = a[0] === "mais"; S.nsei = a[0] === "nsei"; S.ha = a[2] || null; vai("preco"); } };
    }));
  };
  var PRECO_L = {};
  function precoLeituraP(ha) {
    var k = String(Math.round(ha * 100) / 100);
    if (!PRECO_L[k]) PRECO_L[k] = fetch("/wp-json/tcd/v1/pedido-produto/preco?ha=" + encodeURIComponent(k), { credentials: "same-origin" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (j) { return j && j.leitura != null ? +j.leitura : null; })
      .catch(function (e) { delete PRECO_L[k]; throw e; });
    return PRECO_L[k];
  }
  function precoLeitura(ha, feito) {
    if (!ha) { feito(null); return; }
    var fim = false, tm = setTimeout(function () { if (!fim) { fim = true; feito(S.geo ? lerEuros(txt("ipe-preco-l")) : null); } }, 12000);
    precoLeituraP(ha).then(function (v) { if (!fim) { fim = true; clearTimeout(tm); feito(v); } }, function () { if (!fim) { fim = true; clearTimeout(tm); feito(S.geo ? lerEuros(txt("ipe-preco-l")) : null); } });
  }
  function preCarregarPrecos() { [5, 20, 50, 100].forEach(function (h) { try { precoLeituraP(h).catch(function () {}); } catch (e) {} }); }
  function resumoTerreno(c) {
    var w = el("div", "res"), L = S.local || {};
    w.appendChild(el("small", "", q("terreno")));
    if (S.geo) w.appendChild(el("b", "", areaTexto() || haTxt(S.ha)));
    else {
      var p = [];
      if (L.nic) p.push("NIC " + L.nic);
      if (L.artigo) p.push((lg() === "en" ? "Article " : "Artigo ") + L.artigo + (L.tipo ? " (" + L.tipo.toLowerCase() + ")" : ""));
      if (L.morada) p.push(String(L.morada).split(", ").slice(0, 3).join(", "));
      else if (L.coord) p.push(L.coord);
      if (L.freguesia || L.concelho) p.push([L.freguesia, L.concelho].filter(Boolean).join(", "));
      w.appendChild(el("b", "", p.join(" · ") || "—"));
      w.appendChild(el("small", "", q("porLocalizar") + (S.produto === "leitura" && S.haK && S.haK !== "nsei" ? " · " + q("aprox") + " " + (q("areas").filter(function (a) { return a[0] === S.haK; })[0] || [0, ""])[1] : "")));
    }
    c.appendChild(w);
  }
  Q.preco = function (c, rod) {
    var k = S.produto, d = t("prod")[k];
    titulo(c, q("precoT"));
    var cart = el("div", "res"); cart.appendChild(el("small", "", lg() === "en" ? "Product" : "Produto")); cart.appendChild(el("b", "", d[0])); c.appendChild(cart);
    resumoTerreno(c);
    var caixa = el("div"); c.appendChild(caixa);
    var ul = el("ul", "inc"); t("inclui")[k].forEach(function (s) { var li = el("li"); li.appendChild(icone("ok", 14)); li.appendChild(el("span", "", s)); ul.appendChild(li); }); c.appendChild(ul);
    var s = seguinte(rod, q("continuar"), function () { vai(sessao() || S.consulta ? "dados" : "conta"); }, false);
    function tabela(v) {
      caixa.innerHTML = "";
      if (S.consulta || v == null) { S.consulta = true; caixa.appendChild(el("p", "aviso", q("consultaP"))); s.textContent = q("pedirProposta"); s.disabled = false; return; }
      S.valor = v;
      var tab = el("table", "pr"), th = el("tr"); ["", t("semIva"), t("comIva")].forEach(function (h) { th.appendChild(el("th", "", h)); }); tab.appendChild(th);
      var tr = el("tr", "tot"); tr.appendChild(el("td", "", d[0])); tr.appendChild(el("td", "", euros(v))); tr.appendChild(el("td", "", euros(v * (1 + IVA)))); tab.appendChild(tr);
      caixa.appendChild(tab);
      if (k === "leitura" && /−\s*50|-\s*50|50\s*%/.test(txt("ipe-preco-l"))) caixa.appendChild(el("p", "nota", txt("ipe-preco-l")));
      if (S.nsei) caixa.appendChild(el("p", "nota", q("areaNsei")));
      s.disabled = false;
    }
    if (k === "planta") tabela(PLANTA);
    else { esperaBox(caixa, "…"); precoLeitura(S.geo ? areaHa() : S.ha, tabela); }
  };
  function meusProjectos() { var P = est(); if (!P) return []; return (P.mapas || []).filter(function (m) { return m && m.geojson && !m.rever; }); }
  Q.conta = function (c) {
    titulo(c, q("contaT"), q("contaS"));
    var ul = el("ul", "inc van"); q("vantagens").forEach(function (s) { var li = el("li"); li.appendChild(icone("ok", 14)); li.appendChild(el("span", "", s)); ul.appendChild(li); }); c.appendChild(ul);
    var a = q("contaSim"), b = q("contaNao");
    opcoes(c, [
      { ico: "ok", t: a[0], s: a[1], tag: q("recomendado"), on: S.conta === true && S.contaVista, fn: function () { S.conta = true; S.contaVista = 1; vai("dados"); } },
      { ico: "seta", t: b[0], s: b[1], on: S.conta === false, fn: function () { S.conta = false; S.contaVista = 1; vai("dados"); } }
    ]);
  };
  Q.base = function (c, rod) {
    if (sessao()) {
      titulo(c, t("p4T"), S.geo ? t("baseForm") : q("baseSemLimite"));
      var b = el("button", "bt w", t("baseIr")); b.type = "button"; c.appendChild(b);
      var irForm = function () {
        abrirEncomenda(function (f) {
          if (!f) return;
          if (!S.geo) { metodo("artigo"); var L = S.local || {}; var lc = $("ipe-local"); if (lc && !lc.value) { lc.value = [L.nic, L.artigo && ("art. " + L.artigo), L.freguesia, L.concelho, L.morada, L.coord].filter(Boolean).join(", "); lc.dispatchEvent(new Event("input", { bubbles: true })); } }
          var n = $("ipe-nome"); luz(n); try { n.focus({ preventScroll: true }); } catch (e) {}
          fechar();
        });
      };
      b.addEventListener("click", irForm);
      return;
    }
    titulo(c, q("baseT"), q("baseS"));
    var ul = el("ul", "inc van"); q("vantagens").forEach(function (s) { var li = el("li"); li.appendChild(icone("ok", 14)); li.appendChild(el("span", "", s)); ul.appendChild(li); }); c.appendChild(ul);
    var a = el("a", "bt w", t("entrar")); a.href = entrarUrl(); a.style.marginTop = "14px"; c.appendChild(a);
    c.appendChild(el("p", "nota", q("baseOu")));
    var w = el("div", "lin2");
    [["planta", q("verPlanta")], ["leitura", q("verLeitura")]].forEach(function (x) { var bb = el("button", "bt s", x[1]); bb.type = "button"; bb.style.flex = "1"; bb.addEventListener("click", function () { S.produto = x[0]; S.hist = ["produto", "sabe"]; S.geo ? vai(x[0] === "leitura" ? "preco" : "preco") : depoisTerreno(); }); w.appendChild(bb); });
    c.appendChild(w);
  };
  Q.dados = function (c, rod) {
    var k = S.produto;
    titulo(c, q("dadosT"), q("dadosS"));
    var form = el("form"); form.noValidate = true; form.autocomplete = "on";
    function campo(nome, rot, tipo, ac) { var l = el("label", "l", rot); var i = el("input"); i.type = tipo || "text"; i.name = nome; if (ac) i.autocomplete = ac; l.htmlFor = i.id = "ipr-as-" + nome; form.appendChild(l); form.appendChild(i); i.addEventListener("keydown", function (e) { e.stopPropagation(); }); return i; }
    var pf = function (id) { var e = $(id); return e ? e.value : ""; };
    var D = S.dados || {};
    var nome = campo("nome", t("nome"), "text", "name"), email = campo("email", t("email"), "email", "email"), tel = campo("telefone", t("tel"), "tel", "tel"), nif = campo("nif", t("nif"), "text", "off");
    nome.value = D.nome || pf("ipe-nome"); email.value = D.email || pf("ipe-email"); tel.value = D.telefone || pf("ipe-tel"); nif.value = D.nif || pf("ipe-nif"); nif.inputMode = "numeric";
    var lp = el("label", "l", t("pais")), pais = el("select"); pais.name = "pais"; pais.id = lp.htmlFor = "ipr-as-pais";
    var src = $("ipe-pais"); if (src) [].forEach.call(src.options, function (o) { var op = el("option", "", o.textContent); op.value = o.value; pais.appendChild(op); }); else { var op = el("option", "", "Portugal"); op.value = "PT"; pais.appendChild(op); }
    pais.value = D.pais || (src ? src.value : "PT"); form.appendChild(lp); form.appendChild(pais);
    if (k === "planta") { form.appendChild(el("label", "l", q("finT"))); if (!S.fin) S.fin = t("fin")[0]; chips(form, t("fin"), S.fin, function (v) { S.fin = v; }); }
    var ln = el("label", "l", t("notas")), notas = el("textarea"); notas.rows = 2; notas.id = ln.htmlFor = "ipr-as-notas"; notas.value = D.notas || ""; notas.addEventListener("keydown", function (e) { e.stopPropagation(); }); form.appendChild(ln); form.appendChild(notas);
    var conta = null;
    if (sessao()) form.appendChild(el("p", "nota", t("contaSessao")));
    else if (S.consulta) {}
    else { var lc = el("label", "ck"); conta = el("input"); conta.type = "checkbox"; conta.checked = S.conta !== false; lc.appendChild(conta); lc.appendChild(el("span", "", t("conta"))); form.appendChild(lc); conta.addEventListener("change", function () { S.conta = conta.checked; }); }
    var lk = el("label", "ck"), cons = el("input"); cons.type = "checkbox"; lk.appendChild(cons);
    var sp = el("span"); var pol = el("a", "", t("consent")); pol.href = "/politica-de-privacidade/"; pol.target = "_blank"; pol.rel = "noopener"; pol.style.color = "inherit"; sp.appendChild(pol); sp.appendChild(document.createTextNode(" *")); lk.appendChild(sp); form.appendChild(lk);
    var hp = el("input"); hp.type = "text"; hp.name = "website"; hp.tabIndex = -1; hp.autocomplete = "off"; hp.setAttribute("aria-hidden", "true"); hp.style.cssText = "position:absolute;left:-9999px;width:1px;height:1px;opacity:0"; form.appendChild(hp);
    var falta = el("p", "falta"); form.appendChild(falta);
    var erro = el("p", "erro"); erro.setAttribute("role", "alert"); form.appendChild(erro);
    c.appendChild(form);
    var T0 = Date.now();
    var rotulo = S.consulta ? q("pedirProposta") : ROTA === false ? t("pedirMail") : t("pagar") + (S.valor ? " · " + euros(S.valor * (1 + IVA)) : "");
    rod.appendChild(el("span"));
    var s = el("button", "bt"); s.type = "button"; s.textContent = rotulo; rod.appendChild(s);
    function guardarD() { S.dados = { nome: nome.value, email: email.value, telefone: tel.value, nif: nif.value, pais: pais.value, notas: notas.value }; }
    function ver(mostrar) {
      var f = [];
      if (!nome.value.trim()) f.push(t("fNome"));
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) f.push(t("fEmail"));
      if (!cons.checked) f.push(t("fConsent"));
      if (mostrar !== false) falta.textContent = f.length ? t("faltam") + f.join(", ") + "." : "";
      return !f.length;
    }
    [nome, email, tel, nif, notas, cons].forEach(function (i) { i.addEventListener("input", function () { guardarD(); if (falta.textContent) ver(); }); i.addEventListener("change", function () { guardarD(); if (falta.textContent) ver(); }); });
    function enviar(ev) {
      if (ev) ev.preventDefault();
      erro.textContent = ""; guardarD();
      if (!ver()) return;
      var fc = S.geo ? terrenoFC() : null;
      var corpo = {
        produto: k, nome: nome.value.trim(), email: email.value.trim(), telefone: tel.value.trim(), nif: nif.value.trim(),
        pais: pais.value, notas: notas.value.trim(), finalidade: k === "planta" ? (S.fin || "") : "", consentimento: 1, conta: conta && conta.checked ? 1 : 0,
        website: hp.value, t: String(Math.min(T0, Date.now() - 9000)), lingua: lg(), via: S.via || ""
      };
      if (fc) corpo.geojson = JSON.stringify(fc);
      else { corpo.local = S.local || {}; if (k === "leitura") { corpo.ha_aprox = S.ha || 0; corpo.ha_escalao = S.haK || ""; } }
      if (S.consulta) corpo.consulta = 1;
      if (ROTA === false) { porEmail(k, corpo); S.enviado = { pedido: "", email: corpo.email, total: (S.valor || 0) * (1 + IVA), area_ha: S.geo ? areaHa() : 0, porEmail: true }; vai("feito"); return; }
      s.disabled = true; s.textContent = t("aEnviar");
      fetch("/wp-json/tcd/v1/pedido-produto", { method: "POST", credentials: "same-origin", headers: Object.assign({ "Content-Type": "application/json" }, window.tcdNonce ? { "X-WP-Nonce": window.tcdNonce } : {}), body: JSON.stringify(corpo) })
        .then(function (r) { return r.text().then(function (x) { var j = null; try { j = JSON.parse(x); } catch (e) {} return { ok: r.ok, s: r.status, j: j }; }); })
        .then(function (r) {
          if (!r.j || !r.ok || !r.j.ok) throw new Error((r.j && r.j.message) || ("HTTP " + r.s));
          S.enviado = r.j; S.enviado.email = corpo.email;
          try { if (window.gtag) gtag("event", S.consulta ? "assistente_proposta" : "assistente_pedido", { produto: k, valor: r.j.total || 0 }); } catch (e) {}
          vai("feito");
          if (r.j.pagar) setTimeout(function () { location.href = r.j.pagar; }, 1800);
        })
        .catch(function (x) { erro.textContent = tf("erro", { m: x && x.message || "rede" }); s.disabled = false; s.textContent = rotulo; });
    }
    form.addEventListener("submit", enviar);
    s.addEventListener("click", enviar);
  };
  Q.feito = function (c) {
    var r = S.enviado || {};
    if (r.consulta) {
      var d = el("div", "ach"), ok = el("span", "ok"); ok.appendChild(icone("ok", 18)); d.appendChild(ok);
      var tx = el("div"); tx.appendChild(el("b", "", q("okPropT"))); d.appendChild(tx); c.appendChild(d);
      c.appendChild(el("p", "nota", qf("okPropP", { e: r.email || "", r: r.pedido || "" })));
    } else {
      feito(c, r);
      if (r.pagar) c.appendChild(el("p", "nota", q("aPagar")));
    }
    var nb = el("button", "lk", q("recomecar")); nb.type = "button"; nb.addEventListener("click", function () { S = { q: "produto", hist: [], produto: null, via: null, local: {}, geo: false, ha: null, consulta: false, nsei: false, conta: true, fin: null, leitura: false, enviado: null }; desenhar(); }); c.appendChild(nb);
  };

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
    var fc = terrenoFC(), c = S.geo && fc && centro(fc), nomeP = t("prod")[k][0], L = dados.local || {};
    var corpo = [nomeP, S.geo ? t("achadoArea") + ": " + (areaTexto() || "—") : "", c ? "Lat/Lon: " + c[0].toFixed(6) + ", " + c[1].toFixed(6) : "",
      Object.keys(L).map(function (x) { return x + ": " + L[x]; }).join("\n"), dados.ha_escalao ? "Área: " + dados.ha_escalao : "",
      t("nome") + ": " + dados.nome, t("email") + ": " + dados.email, dados.telefone ? t("tel") + ": " + dados.telefone : "", dados.nif ? "NIF: " + dados.nif : "", dados.finalidade ? t("finalidade") + " " + dados.finalidade : "", dados.notas || "", "", S.geo && fc ? JSON.stringify(fc).slice(0, 1500) : ""].filter(Boolean).join("\n");
    location.href = "mailto:info@regenerativo.pt?subject=" + encodeURIComponent(nomeP + " · IPR Atlas") + "&body=" + encodeURIComponent(corpo);
  }
  function feito(c, r) {
    var d = el("div", "ach"), ok = el("span", "ok"); ok.appendChild(icone("ok", 18)); d.appendChild(ok);
    var tx = el("div"); tx.appendChild(el("b", "", r.porEmail ? t("okTMail") : t("okT"))); tx.appendChild(el("small", "", euros(r.total || 0) + (+r.area_ha ? " · " + haTxt(r.area_ha) : ""))); d.appendChild(tx); c.appendChild(d);
    c.appendChild(el("p", "nota", r.porEmail ? t("okMail") : tf("okP", { e: r.email || "", r: r.pedido || "" })));
    if (r.conta === "criada") c.appendChild(el("p", "nota", t("okContaC")));
    if (r.conta === "existe") c.appendChild(el("p", "nota", t("okContaE")));
    if (r.pagar) { var a = el("a", "bt w", t("okPagar")); a.href = r.pagar; a.style.marginTop = "14px"; c.appendChild(a); }
  }
  function achadoSemAvancar(caixa, a) {
    var d = el("div", "ach"), ok = el("span", "ok"); ok.appendChild(icone("ok", 18)); d.appendChild(ok);
    var tx = el("div"); tx.appendChild(el("b", "", t("achado"))); tx.appendChild(el("small", "", t("achadoArea") + " " + a)); d.appendChild(tx); caixa.appendChild(d);
  }
  function precoDesde(k) {
    var p = PR();
    if (k === "base") { var b = p && p.base && p.base.desde; if (!b) b = lerEuros(txt("ipe-preco")) || 99; return b; }
    if (k === "leitura") { var l = p && p.leitura && p.leitura.desde; if (!l) l = lerEuros(txt("ipe-preco-l")) || 125; return l; }
    return PLANTA;
  }
  // abre sozinho ao entrar, uma vez por sessão do navegador
  function autoAbrir() {
    try { if (sessionStorage.getItem("ipr_as_auto") === "1") return; } catch (e) {}
    try { if (new URLSearchParams(location.search).get("servico") || sessionStorage.getItem("ipr_guia_v1")) return; } catch (e) {}
    var P = est(); if (P && P.modo === "cliente" && P.actual) return;
    if (pn()) return;
    // no telemóvel o aviso de cookies tapa a parte de baixo do ecrã: abre-se logo a seguir a responder ao aviso
    if (movel() && document.documentElement.classList.contains("tcd-ck-aberto") && (autoAbrir.n = (autoAbrir.n || 0) + 1) < 200) { setTimeout(autoAbrir, 700); return; }
    try { sessionStorage.setItem("ipr_as_auto", "1"); } catch (e) {}
    abrir();
    try { if (window.gtag) gtag("event", "assistente_auto", {}); } catch (e) {}
  }
  // coordenadas e mapa
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

  // 3c. Formiga parada (Nuno, 30/10, 19h11: «o formiga continua a saltar»). O app.js (fm) e o ajustes.js (formigaSitio) põem-na
  // em sítios diferentes, um a seguir ao outro. No computador fica um só sítio: canto inferior direito do mapa, encostada à barra
  // de ferramentas. Qualquer outra mudança ao estilo é reposta antes de o ecrã ser desenhado (MutationObserver).
  var FM = { alvo: null, obs: null, aplicar: false };
  function formigaAlvo() {
    if (movel()) return null;
    var M0 = mapa(), cv = M0 && M0.getContainer ? M0.getContainer() : null; if (!cv) return null;
    var rc = cv.getBoundingClientRect(); if (rc.width < 200) return null;
    var tb = document.querySelector("#ipe .ipe-tools"), rt = tb && tb.getBoundingClientRect();
    var dir = rt && rt.width ? Math.round(window.innerWidth - rt.left + 10) : Math.round(window.innerWidth - rc.right + 12);
    return { right: Math.max(8, dir) + "px", bottom: Math.max(12, Math.round(window.innerHeight - rc.bottom + 12)) + "px" };
  }
  function formigaPor() {
    var b = $("tcdfmb"); if (!b) return;
    var a = formigaAlvo(); FM.alvo = a;
    if (!a) { if (FM.obs) { FM.obs.disconnect(); FM.obs = null; } return; }
    function pos() {
      if (!FM.alvo || FM.aplicar) return;
      var st = b.style, A = FM.alvo;
      if (st.getPropertyValue("right") === A.right && st.getPropertyValue("bottom") === A.bottom && st.getPropertyValue("top") === "auto" && st.getPropertyValue("left") === "auto" && st.getPropertyValue("position") === "fixed") return;
      FM.aplicar = true;
      st.setProperty("position", "fixed", "important"); st.setProperty("right", A.right, "important"); st.setProperty("bottom", A.bottom, "important");
      st.setProperty("top", "auto", "important"); st.setProperty("left", "auto", "important"); st.setProperty("transform", "none", "important");
      FM.aplicar = false;
    }
    pos();
    if (!FM.obs) { FM.obs = new MutationObserver(pos); FM.obs.observe(b, { attributes: true, attributeFilter: ["style"] }); }
  }
  window.addEventListener("resize", function () { clearTimeout(formigaPor.t); formigaPor.t = setTimeout(formigaPor, 150); });

  // ---------------------------------------------------------------- 4. conversor
  function conversor() {
    var d = $("ipe-dir"); if (!d) return;
    var w = document.createTreeWalker(d, NodeFilter.SHOW_TEXT, null), x;
    while ((x = w.nextNode())) { if (/^\s*Failed to fetch\s*$|^\s*NetworkError when attempting to fetch resource\.?\s*$|^\s*Load failed\s*$/.test(x.nodeValue)) x.nodeValue = t("conv"); }
  }

  // ---------------------------------------------------------------- 5. CAOP pelo servidor (PDM na planta de localização)
  // O diálogo da planta (ajustes.js §55/§61) procura o concelho na OGC API da DGT a partir do navegador; quando essa consulta
  // falha ou vem vazia, a caixa do PDM fica em «concelho por confirmar» e a folha não entra. Aqui a mesma consulta passa a ter
  // recurso pelo servidor (m90590, tcd/v1/pedido-produto/caop), com a mesma forma de resposta.
  (function () {
    var orig = window.fetch; if (!orig || orig.__iprCaop) return;
    var RX = /^https:\/\/ogcapi\.dgterritorio\.gov\.pt\/collections\/cont_freguesias\/items\?[^#]*bbox=([-0-9.,]+)/;
    function servidor(bbox) {
      return orig.call(window, "/wp-json/tcd/v1/pedido-produto/caop?bbox=" + encodeURIComponent(bbox), { credentials: "same-origin" });
    }
    var novo = function (u, o) {
      var url = typeof u === "string" ? u : (u && u.url) || "", m = RX.exec(url);
      if (!m) return orig.apply(this, arguments);
      var bbox = m[1], self = this, args = arguments;
      return orig.apply(self, args).then(function (r) {
        if (!r.ok) return servidor(bbox);
        return r.clone().json().then(function (j) { return j && j.features && j.features.length ? r : servidor(bbox).then(function (r2) { return r2.ok ? r2 : r; }); }, function () { return servidor(bbox); });
      }, function () { return servidor(bbox); });
    };
    novo.__iprCaop = 1; window.fetch = novo;
  })();

  // ---------------------------------------------------------------- arranque
  function tudo() { try { formigaPor(); } catch (e) {} try { topo(); } catch (e) {} try { botaoFixo(); } catch (e) {} try { esquerda(); } catch (e) {} try { conversor(); } catch (e) {} }
  function arrancar() {
    if (!raiz() || !$("ipe-ctx-t")) { setTimeout(arrancar, 300); return; }
    estilos(); tudo(); ligarMover(); sondarRota();
    var pend = 0;
    try { new MutationObserver(function () { if (pend) return; pend = setTimeout(function () { pend = 0; tudo(); }, 250); }).observe(raiz(), { childList: true, subtree: true, characterData: true }); } catch (e) {}
    var qa = ""; try { qa = new URLSearchParams(location.search).get("assistente") || ""; } catch (e) {}
    if (/^(base|leitura|planta)$/.test(qa)) setTimeout(function () { try { sessionStorage.setItem("ipr_as_auto", "1"); } catch (e) {} abrir(qa); }, 600);
    else if (qa === "1") setTimeout(function () { try { sessionStorage.setItem("ipr_as_auto", "1"); } catch (e) {} abrir(); }, 600);
    else setTimeout(function () { try { autoAbrir(); } catch (e) {} }, 1400);
    window.__iprAssistenteAbrir = abrir;
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arrancar); else arrancar();
})();
