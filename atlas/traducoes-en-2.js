/* IPR Atlas · traduções EN, segunda volta (teste geral, 12/11/2026, 16h). Com o navegador em inglês, o Atlas abre em inglês
   (IPR_LINGUA = en), mas o ecrã de entrada, o menu do site, o pedido sem mapa, o painel de cookies, as camadas da Europa e
   das ilhas e alguns botões ficavam em português, misturados com o inglês. Junta estes textos ao dicionário do §73c do
   ajustes.js (window.__ipr73c.dic) e volta a aplicar. Não toca no português. Desligar: window.IPR_TREN2_OFF = true.
   Propriedade de IPR – Instituto de Planeamento Regenerativo, Lda. */
(function () {
  "use strict";
  var W = window;
  if (W.IPR_TREN2_OFF || W.__iprTrEn2) return;
  W.__iprTrEn2 = 1;
  var T = {
    // menu e rodapé do site
    "SERVIÇOS": "SERVICES", "Todos os serviços": "All services", "Análise antes da compra": "Pre-purchase analysis",
    "Diagnóstico e visita técnica": "Diagnosis and technical visit", "Água e acessos": "Water and access",
    "Plano de estrutura": "Structure plan", "Plano de produção": "Production plan", "Implementação": "Implementation",
    "Consultoria técnica": "Technical consultancy", "Todos os projectos": "All projects", "Planta de Localização": "Location Plan",
    "Desenhar o projecto": "Design the project", "Atelier fundador do": "Founding studio of", "Pedido de contacto": "Contact request",
    "Antes de comprar": "Before buying", "Biológica e biodinâmica": "Organic and biodynamic", "Design de quintas": "Farm design",
    "Terracrua Design© e Terracrua© são marcas registadas do": "Terracrua Design© and Terracrua© are registered trademarks of",
    "Termos e Condições": "Terms and Conditions", "Livro de Reclamações": "Complaints Book", "Abrir o menu": "Open the menu",
    "IPR Atlas · Territorial Studio: o território de Portugal num mapa": "IPR Atlas · Territorial Studio: the territory of Portugal on a map",
    "Versão beta": "Beta version", "Versão beta · comentários construtivos são bem-vindos": "Beta version · constructive comments are welcome",
    "Reportar: versão beta, dê-nos feedback": "Report: beta version, give us feedback",
    // entrada (computador e telemóvel)
    "O seu terreno, num mapa.": "Your land, on a map.",
    "Encontre-o e veja logo a Ficha da propriedade, grátis: condicionantes, água, relevo e risco de incêndio. Depois escolha o documento de que precisa.":
      "Find it and see the Property Sheet straight away, free: constraints, water, relief and fire risk. Then choose the document you need.",
    "Onde está o terreno?": "Where is the land?", "Localidade, morada, coordenadas ou NIC.": "Town, address, coordinates or NIC.",
    "Procurar local, coordenadas ou NIC": "Search a place, coordinates or NIC", "Carregar um ficheiro": "Upload a file",
    "Desenhar o limite": "Draw the boundary", "Ficha da propriedade": "Property Sheet", "grátis": "free",
    "O que já se sabe do terreno: condicionantes, água, relevo e incêndio. No ecrã, sem conta.": "What is already known about the land: constraints, water, relief and fire. On screen, no account.",
    "19 € + IVA · 23,37 € com IVA": "€19 + VAT · €23.37 with VAT",
    "desde 79 € + IVA · 97,17 € com IVA": "from €79 + VAT · €97.17 with VAT", "desde 99 € + IVA · 121,77 € com IVA": "from €99 + VAT · €121.77 with VAT",
    "desde 79 € + IVA · desde 97,17 € com IVA": "from €79 + VAT · from €97.17 with VAT", "desde 99 € + IVA · desde 121,77 € com IVA": "from €99 + VAT · from €121.77 with VAT",
    "A planta do terreno para a câmara, o banco ou a escritura. Pronta a imprimir.": "The plan of the land for the council, the bank or the deed. Ready to print.",
    "Relatório para decidir: o que o terreno permite, os riscos e o potencial.": "A report to decide: what the land allows, the risks and the potential.",
    "Para trabalhar: relevo, água e limites do terreno, em ficheiros para o seu técnico (QGIS, QField).": "To work the land: relief, water and boundaries, in files for your technician (QGIS, QField).",
    "Já trabalho com mapas: abrir o mapa completo": "I already work with maps: open the full map", "Ver só o mapa": "Just the map",
    "O seu terreno": "Your land", "Toque no seu terreno": "Tap your land",
    "Toque no seu terreno no mapa (as parcelas do cadastro aparecem ao aproximar) ou desenhe o limite.": "Tap your land on the map (cadastral parcels appear as you zoom in) or draw the boundary.",
    "O que quer ver?": "What do you want to see?", "O que não posso construir (REN)": "Where I cannot build (REN)",
    "Solos agrícolas protegidos (RAN)": "Protected farmland (RAN)", "Relevo e curvas de nível": "Relief and contour lines",
    "Risco de incêndio": "Fire risk", "Imagem de fundo": "Background image",
    "Leitura indicativa, sem valor jurídico. Confirme junto das entidades oficiais.": "Indicative reading, with no legal value. Confirm with the official bodies.",
    "Abrir o mapa completo": "Open the full map", "Diga-nos o que procura. Mostramos o caminho, a começar pelo que é grátis.": "Tell us what you are looking for. We show you the way, starting with what is free.",
    "Quero conhecer um terreno": "I want to know a plot", "Ver as condicionantes, a água, o relevo e o risco. Começa pela Ficha da propriedade, grátis.": "See the constraints, water, relief and risk. Start with the Property Sheet, free.",
    "Preciso de uma planta do terreno": "I need a plan of the land", "Uma Planta de Localização à escala para a câmara, o banco ou a escritura.": "A scaled Location Plan for the council, the bank or the deed.",
    "Quero planear ou trabalhar o terreno": "I want to plan or work the land", "Relevo, água e limites em ficheiros: a Base Cartográfica.": "Relief, water and boundaries in files: the Base Map.",
    "Trabalho com terrenos": "I work with land", "Arquitectos, engenheiros, topógrafos, consultores e agentes: o mapa completo.": "Architects, engineers, surveyors, consultants and agents: the full map.",
    "Base Cartográfica ↗": "Base Map ↗", "Ficha gratuita da propriedade": "Free Property Sheet", "sem conta, indicativa": "no account, indicative",
    "Ver a ficha gratuita da propriedade": "See the free Property Sheet",
    "Veja um projecto real de exemplo ou indique o seu terreno para encomendar a Base Cartográfica.": "See a real sample project or point to your land to order the Base Map.",
    "Encomendar a Base do meu terreno": "Order the Base Map of my land",
    "Declaro que os limites indicados são da minha responsabilidade e que a Terracrua Design não os verificou no terreno. *": "I declare that the boundaries given are my responsibility and that Terracrua Design has not checked them on site. *",
    "O Intelligence abre com a Base Cartográfica ou por assinatura.": "Intelligence opens with the Base Map or by subscription.",
    "Nível de aproximação do mapa: 0 é o mundo inteiro, 20 é o pormenor máximo.": "Map zoom level: 0 is the whole world, 20 is the most detail.",
    "Morada, nome da propriedade, artigo matricial ou coordenadas (ex.: 37.4886, -8.1445)": "Address, property name, land registry article or coordinates (e.g. 37.4886, -8.1445)",
    "Escreva a sua pergunta…": "Type your question…", "O que podemos melhorar? (opcional)": "What can we improve? (optional)",
    // pedido sem mapa
    "Peça já, sem o mapa": "Order now, without the map", "O que precisa": "What you need", "Onde fica o terreno": "Where the land is",
    "Aceito a": "I accept the", "política de privacidade": "privacy policy", "Pedir agora, sem pagar ainda": "Request now, pay later",
    "Sem conta. Confirmamos o terreno e enviamos o valor e a ligação de pagamento por e-mail.": "No account. We confirm the land and send the price and the payment link by e-mail.",
    "with a file of the boundary: KML, Shapefile (em .zip) ou GeoJSON, which you can send to": "with a file of the boundary: KML, Shapefile (as .zip) or GeoJSON, which you can send to",
    // ajuda, opinião e cookies
    "A equipa responde por escrito": "The team replies in writing", "Reportar um erro": "Report an error", "Com captura do ecrã": "With a screenshot",
    "Para conversas rápidas": "For quick chats", "O assistente do IPR.": "The IPR assistant.",
    "Captura do ecrã inteiro ou de uma área, áudio, texto e ficheiro.": "Screenshot of the whole screen or an area, audio, text and file.",
    "Assistente automático com as perguntas frequentes, sem inteligência artificial.": "Automatic assistant with frequently asked questions, without artificial intelligence.",
    "Respostas automáticas preparadas pela equipa do IPR. O que escreve aqui não é enviado.": "Automatic answers prepared by the IPR team. What you type here is not sent.",
    "Os cookies necessários fazem o site funcionar (sessão, carrinho, segurança). Com a sua autorização usamos também cookies de estatística, para perceber como o site é usado, e de marketing, para medir campanhas. Pode mudar de ideias a qualquer momento.":
      "Necessary cookies make the site work (session, cart, security). With your consent we also use statistics cookies, to understand how the site is used, and marketing cookies, to measure campaigns. You can change your mind at any time.",
    "Política de privacidade": "Privacy policy", "Necessários": "Necessary", "Estatística": "Statistics", "A sua opinião": "Your opinion",
    "Isto está a ser-lhe útil?": "Is this useful to you?", "Documentos do terreno": "Land documents", "Os meus dados": "My details",
    "O site está em versão beta e o seu feedback ajuda-nos a melhorá-lo. Para reportar um erro ou deixar uma ideia, entre na sua conta. Cada contribuição conta pontos.":
      "The site is in beta and your feedback helps us improve it. To report an error or leave an idea, sign in to your account. Each contribution earns points.",
    // camadas da Europa, de Espanha e das ilhas; projecto de demonstração
    "Água de cheia vista pelo radar do Sentinel-1 na última passagem, mesmo com nuvens (20 m). Serve para confirmar onde a água se acumula de facto.":
      "Flood water seen by Sentinel-1 radar on the last pass, even through clouds (20 m). It confirms where water actually collects.",
    "Humidade do solo na zona das raízes": "Root-zone soil moisture", "Perigo meteorológico de incêndio (FWI) · previsão": "Fire weather danger (FWI) · forecast",
    "Índice canadiano de perigo de incêndio (FWI) previsto pelo EFFIS para hoje: junta temperatura, humidade, vento e secura dos combustíveis (cerca de 8 km).":
      "Canadian Fire Weather Index (FWI) forecast by EFFIS for today: combines temperature, humidity, wind and fuel dryness (about 8 km).",
    "Pastagens · mudança 2015 a 2018": "Grassland · change 2015 to 2018", "Vegetação lenhosa 2021": "Woody vegetation 2021",
    "Copa arbórea · perda e ganho 2015 a 2018": "Tree cover · loss and gain 2015 to 2018", "Água e zonas húmidas 2018": "Water and wetness 2018",
    "Ocupação do solo CLC+ 2021": "Land cover CLC+ 2021", "Ocupação do solo CLC+ 2021 (10 m)": "Land cover CLC+ 2021 (10 m)",
    "Galerias ripícolas 2018": "Riparian zones 2018", "Produtividade da vegetação 2000 a 2019": "Vegetation productivity 2000 to 2019",
    "Tendência da produtividade da terra 2000 a 2016": "Land productivity trend 2000 to 2016", "Rede hidrográfica EU-Hydro": "EU-Hydro river network",
    "Rede hidrográfica EU-Hydro (ordem de Strahler)": "EU-Hydro river network (Strahler order)", "ordem de Strahler": "Strahler order",
    "Rios, ribeiras e massas de água de toda a Europa, com a ordem de Strahler de cada troço.": "Rivers, streams and water bodies across Europe, with the Strahler order of each reach.",
    "Projecto de demonstração · Base Cartográfica de exemplo": "Demonstration project · sample Base Map",
    "Sub-bacia da Ribeira do Torgal, bacia do Mira (Odemira) · LiDAR DGT": "Ribeira do Torgal sub-basin, Mira basin (Odemira) · DGT LiDAR",
    "Limite da sub-bacia": "Sub-basin boundary", "Formas do relevo (geomorphons)": "Landforms (geomorphons)", "Risco de erosão": "Erosion risk",
    "Exposição ao vento": "Wind exposure", "Linhas de água (LiDAR)": "Watercourses (LiDAR)", "Bacias de drenagem": "Drainage basins",
    "Mapa IGN Base": "IGN base map", "Recintos SIGPAC (uso agrícola)": "SIGPAC enclosures (farm use)", "Zona inundável T10": "Flood zone T10",
    "Zona inundável T100": "Flood zone T100", "Zona inundável T500": "Flood zone T500", "Água e relevo": "Water and relief",
    "Pontos de água (IGME)": "Water points (IGME)", "Curvas de nível (IGN)": "Contour lines (IGN)",
    "Fontes oficiais espanholas e europeias. Informação indicativa; a referência vinculativa é a publicada pelo organismo.": "Official Spanish and European sources. Indicative information; the binding reference is the one published by the body.",
    "Source: © SRAAC/GRA · ortofotomapas de 2024 ·": "Source: © SRAAC/GRA · 2024 orthophoto maps ·",
    "Source: © SRAAC/GRA · ortofotomapas de 2004 a 2008 ·": "Source: © SRAAC/GRA · 2004 to 2008 orthophoto maps ·",
    "Source: © Agência Europeia do Ambiente (Natura 2000) ·": "Source: © European Environment Agency (Natura 2000) ·",
    // créditos no fim da página
    "Fontes e licenças": "Sources and licences"
  };
  var vezes = 0;
  function juntar() {
    var a = W.__ipr73c;
    if (!a || !a.dic) { if (vezes++ < 60) setTimeout(juntar, 500); return; }
    for (var k in T) if (Object.prototype.hasOwnProperty.call(T, k) && !Object.prototype.hasOwnProperty.call(a.dic, k)) a.dic[k] = T[k];
    if (String(W.IPR_LINGUA || "pt").toLowerCase().indexOf("pt") !== 0 && a.aplicar) a.aplicar();
  }
  juntar();
})();
