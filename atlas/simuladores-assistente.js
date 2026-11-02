/* IPR Atlas · Assistente dos simuladores de água e de fogo. IPR – Instituto de Planeamento Regenerativo. 02/11/2026.
   Um assistente passo a passo por cima dos painéis «Simular água» (#ipr-as, agua-simulador.js) e «Simular fogo» (#ipr-fs,
   fogo-simulador.js). Carrega-se depois desses dois ficheiros e do simulador-base.js (aviso, escolha da Base, «Simular»).
   Não mexe no código de nenhum deles: só preenche os campos dos próprios painéis (valor + eventos input e change), carrega
   nos botões deles e lê o estado que publicam (IPR_AGUA_SIM._estado, IPR_FOGO_SIM._estado) para traduzir o progresso.
   O pedido que sai para tcd/v1/agua/simular ou fogo/simular é o que o painel faria (e passa pela guarda do simulador-base).
   1. Ao abrir um simulador, aparece o assistente no lugar do painel (o painel fica escondido, mas vivo). «Abrir o painel
      completo» mostra o painel; a escolha fica lembrada neste navegador (localStorage ipr_sim_assistente).
   2. «O que quer saber?»: três perguntas por simulador, com valores por omissão sensatos.
      Água: onde a água pára (20, 50 e 100 mm); chuva no terreno 2D (IDF, 20 anos, 1 h, mais 3 h); antes e depois com
      charcas ou valas desenhadas no mapa. Fogo: cenário no tempo (D2L2, vento de noroeste a 20 km/h, WindNinja, 3 h,
      isócronas de 30 min); muitas ignições (50, semente 1, 2 h); antes e depois com uma faixa de gestão.
   3. Em cada passo, uma instrução curta, o alvo realçado (no cartão e, ao marcar, uma moldura no mapa), «Seguinte» e
      «Abrir o painel completo». O progresso do painel passa a frases simples. Com o resultado, o painel volta à vista com
      uma caixa «Como ler este resultado»; a pergunta «Isto bate certo…» do painel fica onde está.
   Desligar: ?assistente=0 (o mesmo parâmetro do assistente de compra). Sem os painéis, não faz nada. Cada parte falha em
   silêncio. */
(function (W) {
  "use strict";
  var D = W.document;
  try {
    if (W.__iprSimAssistente) return;
    W.__iprSimAssistente = true;
    if (/[?&]assistente=0(&|#|$)/.test(W.location.search || "")) return;
  } catch (e0) { return; }

  var TXT = {
    pt: {
      t_agua: "Simular água", t_fogo: "Simular fogo", ass: "Assistente",
      painel: "Abrir o painel completo", fechar: "Fechar", passo: "Passo {i} de {n}",
      seguinte: "Seguinte", anterior: "Anterior", simular: "Simular", nova: "Nova pergunta", terreno: "Terreno", trocar: "Trocar",
      perg: "O que quer saber?", pergSub: "Escolha uma pergunta. O assistente preenche o simulador com valores sensatos e diz-lhe o que fazer em cada passo.",
      a_poca: "Onde se junta a água numa chuvada forte", s_poca: "Mostra as depressões do terreno onde a água fica e para onde transborda. Rápido.",
      a_tempestade: "Como corre a água durante uma tempestade", s_tempestade: "Simula a água a correr sobre o terreno ao longo do tempo. Fica em fila e demora mais.",
      a_obra: "O que muda se fizer uma charca ou uma vala", s_obra: "Desenha a obra no mapa e compara o terreno antes e depois.",
      a_avanco: "Por onde avança um fogo a partir de um ponto", s_avanco: "Marca um ponto de ignição e vê até onde a frente chega ao longo do tempo.",
      a_frequencia: "Que zonas ardem mais vezes", s_frequencia: "Lança muitas ignições ao acaso e mostra as zonas que ardem em mais cenários.",
      a_faixa: "O que muda com uma faixa de gestão", s_faixa: "Desenha a faixa no mapa e compara o mesmo fogo sem e com ela.",
      chuvaT: "Que chuvadas testar", chuvaTx: "Vamos testar três chuvadas fortes. Um milímetro de chuva é um litro de água por metro quadrado.",
      chuvaRot: "Alturas de chuva (mm, separadas por vírgulas)", chuvaNota: "São alturas de chuva, não probabilidades. O cálculo é estático: mostra onde a água fica, não quando nem a que velocidade chega.",
      tempT: "Que tempestade", tempTx: "Uma chuvada intensa de 1 hora, como as que se usam em projecto. Escolha quão rara é:",
      T10: "Frequente", T20: "Forte", T100: "Muito rara", Tanos: "uma vez em {T} anos, em média",
      tempNota: "Depois da chuva, o simulador acompanha a água durante mais 3 horas. Fica em fila e costuma demorar cerca de meia hora.",
      obraT: "Desenhe a obra no mapa", obraTx: "Escolha o que quer fazer e desenhe-o no mapa, dentro do terreno. Pode desenhar mais do que uma.",
      charca: "Charca", vala: "Vala em curva de nível", faixaN: "faixa",
      h_charca: "Toque no mapa à volta da charca, ponto a ponto (pelo menos 3 pontos). No fim, carregue em «Terminar».",
      h_vala: "Toque no mapa ao longo da vala, seguindo a curva de nível (pelo menos 2 pontos). No fim, carregue em «Terminar».",
      pontos: "Pontos marcados: {n}", terminar: "Terminar", cancelar: "Cancelar", apagarUlt: "Apagar a última",
      feitas: "Desenhado: {x}.", nada: "Ainda não desenhou nada.",
      obraNota: "A charca fica com 2,5 m de profundidade e a vala com 1 m de largura e 0,5 m de profundidade. Pode mudar estas medidas no painel completo.",
      ignT: "Onde começa o fogo", ignTx: "Marque no mapa o ponto onde o fogo começa. Pode ser dentro ou fora do terreno.",
      ignB: "Marcar o ponto no mapa", h_ign: "Toque no mapa no sítio onde o fogo começa.", ignFeito: "Ponto de ignição marcado.", ignOutro: "Marcar outro ponto",
      zonaT: "Onde podem começar os fogos", zonaTx: "O simulador lança {n} ignições ao acaso. Se não desenhar uma zona, podem cair em qualquer sítio da área de cálculo.",
      zonaB: "Limitar a uma zona (opcional)", h_zona: "Toque no mapa à volta da zona, ponto a ponto (pelo menos 3). No fim, carregue em «Terminar».",
      zonaFeita: "Zona desenhada.", zonaTirar: "Tirar a zona",
      faixaT: "Desenhe a faixa de gestão", faixaTx: "Desenhe a faixa no mapa como um polígono, por exemplo ao longo de um limite ou de um caminho.",
      faixaB: "Desenhar a faixa no mapa", h_faixa: "Toque no mapa nos cantos da faixa, ponto a ponto (pelo menos 3). No fim, carregue em «Terminar».",
      faixaFeita: "Faixa desenhada.", faixaNota: "Dentro da faixa, o combustível passa a pasto baixo (GR1). Pode escolher outro no painel completo.",
      meteoT: "Vento e secura", ventoDe: "Vento vindo de", vel: "Velocidade do vento", v10: "Fraco", v20: "Moderado", v40: "Forte",
      secura: "Secura da vegetação", c_D1L1: "Muito seco", c_D2L2: "Seco", c_D3L3: "Médio",
      meteoNota: "Por omissão, uma tarde de Verão: vento de noroeste e vegetação seca. O vento é ajustado ao relevo (WindNinja) quando o motor o tiver disponível; o resultado diz qual foi usado.",
      durTx: "O fogo é simulado durante {h} horas.",
      pts: { 0: "Norte", 45: "Nordeste", 90: "Leste", 135: "Sudeste", 180: "Sul", 225: "Sudoeste", 270: "Oeste", 315: "Noroeste" },
      simT: "Pronto para simular", simTx: "Vai ser calculado:", simNota: "A simulação fica guardada em «Simulações deste mapa». Pode continuar a usar o mapa enquanto calcula.",
      r_poca: "Chuvadas de {v} mm sobre as depressões do terreno.",
      r_tempestade: "Tempestade de 1 hora que acontece {Ta}, e mais 3 horas a seguir a água.",
      r_obra: "{x}, comparadas com o terreno actual, para chuvadas de {v} mm.",
      r_fogo: "Vento de {d} a {k} km/h, vegetação {c}, {h} horas.",
      r_avanco: "Um fogo a partir do ponto marcado, com isócronas de 30 em 30 minutos.",
      r_frequencia: "{n} ignições ao acaso{z}.", r_zona: ", dentro da zona desenhada",
      r_faixa: "O mesmo fogo sem e com a faixa desenhada.",
      progT: "A simular", enviar: "A enviar o pedido ao simulador…", fila: "O pedido está na fila de espera.", filaPos: "É o {p}.º da fila.",
      filaNota: "Começa assim que o motor ficar livre. Pode haver simulações de outros mapas à frente.",
      corre: "O simulador está a calcular.", correPct: "Vai em {p} %.", ha: "Começou há {t}.", tipico: "Costuma demorar cerca de {m} min.",
      lento: "Está a demorar mais do que o costume. Pode esperar ou voltar mais tarde: o resultado fica guardado em «Simulações deste mapa».",
      progNota: "Pode fechar esta janela: o cálculo continua e o resultado fica na lista deste mapa.",
      erroT: "Não foi possível simular", erroTx: "O simulador respondeu: {m}", tentar: "Tentar de novo",
      bloq: "O simulador está bloqueado neste local (risco de incêndio máximo ou incêndio activo nos concelhos à volta). Em caso de incêndio, siga as indicações da Protecção Civil e ligue 112.",
      falta: "Para continuar, complete primeiro o passo indicado no painel (por exemplo, o aviso). Depois pode voltar ao assistente.",
      lerT: "Como ler este resultado",
      l_poca: "O mapa mostra as depressões onde a água fica retida. Siga a legenda da camada: vai do valor mais baixo, à esquerda, ao mais alto, à direita. Para cada chuvada, o quadro diz quanta água fica no terreno («Retido») e quanta sai («Saiu do terreno»). É um cálculo estático: não diz quando nem a que velocidade a água chega.",
      l_tempestade: "O mapa mostra a altura máxima que a água atinge em cada sítio durante toda a tempestade: não é um instante, é o máximo de cada ponto. Siga a legenda: do valor mais baixo, à esquerda, ao mais alto, à direita. «Caudal de pico à saída» é a maior quantidade de água a sair do terreno, em metros cúbicos por segundo, e o minuto em que acontece. Se o «Erro do balanço» diz «fecha», as contas dos volumes estão coerentes.",
      l_obra: "As camadas em «No mapa» mostram o terreno antes e depois da obra; ligue e desligue-as para comparar. «Ganho de retenção» é a água a mais que fica no terreno por causa das suas intervenções, em cada chuvada. Para cada charca, o quadro dá o volume útil, a cota da água, o corte e o aterro.",
      l_avanco: "As linhas são isócronas: cada uma marca até onde a frente chegou ao fim dos minutos escritos na própria linha. Linhas juntas querem dizer que o fogo avança devagar; afastadas, que avança depressa. As cores vão do amarelo claro, nos primeiros minutos, ao vermelho escuro, horas depois. «Primeira chegada ao terreno» é o tempo até a frente tocar no seu terreno.",
      l_frequencia: "Cada célula mostra a fracção das corridas em que ardeu: 0 quer dizer nunca, 1 quer dizer em todas. As zonas com valores altos ardem em muitos cenários e são as que mais convém gerir. Não é a probabilidade real de arder num ano.",
      l_faixa: "Compare «Antes» e «Depois»: a área ardida e a primeira chegada ao terreno, sem e com a faixa. «Diferença de área» resume o efeito. As isócronas mostram como a frente contorna ou atravessa a faixa. Uma faixa nunca é uma barreira garantida: o modelo não tem projecções nem fogo de copas.",
      lerMais: "Mais abaixo pode ligar e desligar as camadas e descarregar os ficheiros.", lerOp: "No fim, diga-nos se o resultado bate certo com o que conhece do terreno.",
      barraTx: "Prefere ser guiado passo a passo?", barraB: "Abrir o assistente"
    },
    en: {
      t_agua: "Water simulator", t_fogo: "Fire simulator", ass: "Assistant",
      painel: "Open the full panel", fechar: "Close", passo: "Step {i} of {n}",
      seguinte: "Next", anterior: "Back", simular: "Simulate", nova: "New question", terreno: "Land", trocar: "Change",
      perg: "What do you want to know?", pergSub: "Choose a question. The assistant fills in the simulator with sensible values and tells you what to do at each step.",
      a_poca: "Where water collects in a heavy downpour", s_poca: "Shows the depressions in the land where water stays and where it spills. Fast.",
      a_tempestade: "How water flows during a storm", s_tempestade: "Simulates water running over the land through time. Queued; takes longer.",
      a_obra: "What changes with a pond or a swale", s_obra: "Draw the work on the map and compare the land before and after.",
      a_avanco: "Where a fire spreads from one point", s_avanco: "Place an ignition point and see how far the front reaches over time.",
      a_frequencia: "Which areas burn most often", s_frequencia: "Runs many random ignitions and shows the areas that burn in most scenarios.",
      a_faixa: "What changes with a fuel break", s_faixa: "Draw the fuel break on the map and compare the same fire without and with it.",
      chuvaT: "Which downpours to test", chuvaTx: "We will test three heavy downpours. One millimetre of rain is one litre of water per square metre.",
      chuvaRot: "Rainfall depths (mm, comma-separated)", chuvaNota: "These are rainfall depths, not probabilities. The calculation is static: it shows where water stays, not when or how fast it arrives.",
      tempT: "Which storm", tempTx: "An intense 1-hour rainfall, as used in design. Choose how rare it is:",
      T10: "Frequent", T20: "Heavy", T100: "Very rare", Tanos: "once in {T} years, on average",
      tempNota: "After the rain, the simulator follows the water for another 3 hours. It is queued and usually takes about half an hour.",
      obraT: "Draw the work on the map", obraTx: "Choose what you want to build and draw it on the map, inside the land. You can draw more than one.",
      charca: "Pond", vala: "Contour swale", faixaN: "fuel break",
      h_charca: "Tap the map around the pond, point by point (at least 3 points). Then press «Finish».",
      h_vala: "Tap the map along the swale, following the contour (at least 2 points). Then press «Finish».",
      pontos: "Points placed: {n}", terminar: "Finish", cancelar: "Cancel", apagarUlt: "Delete the last one",
      feitas: "Drawn: {x}.", nada: "Nothing drawn yet.",
      obraNota: "The pond is 2.5 m deep and the swale 1 m wide and 0.5 m deep. You can change these in the full panel.",
      ignT: "Where the fire starts", ignTx: "Place on the map the point where the fire starts. It can be inside or outside the land.",
      ignB: "Place the point on the map", h_ign: "Tap the map where the fire starts.", ignFeito: "Ignition point placed.", ignOutro: "Place another point",
      zonaT: "Where fires can start", zonaTx: "The simulator runs {n} random ignitions. Without a zone, they can fall anywhere in the calculation area.",
      zonaB: "Limit to a zone (optional)", h_zona: "Tap the map around the zone, point by point (at least 3). Then press «Finish».",
      zonaFeita: "Zone drawn.", zonaTirar: "Remove the zone",
      faixaT: "Draw the fuel break", faixaTx: "Draw the fuel break on the map as a polygon, for example along a boundary or a track.",
      faixaB: "Draw the fuel break on the map", h_faixa: "Tap the map at the corners of the fuel break, point by point (at least 3). Then press «Finish».",
      faixaFeita: "Fuel break drawn.", faixaNota: "Inside the fuel break, the fuel becomes short grass (GR1). You can choose another in the full panel.",
      meteoT: "Wind and dryness", ventoDe: "Wind from", vel: "Wind speed", v10: "Light", v20: "Moderate", v40: "Strong",
      secura: "Vegetation dryness", c_D1L1: "Very dry", c_D2L2: "Dry", c_D3L3: "Moderate",
      meteoNota: "By default, a summer afternoon: northwest wind and dry vegetation. The wind is adjusted to the terrain (WindNinja) when the engine has it available; the result says which was used.",
      durTx: "The fire is simulated for {h} hours.",
      pts: { 0: "North", 45: "Northeast", 90: "East", 135: "Southeast", 180: "South", 225: "Southwest", 270: "West", 315: "Northwest" },
      simT: "Ready to simulate", simTx: "This will be calculated:", simNota: "The simulation is saved in «Simulations for this map». You can keep using the map while it runs.",
      r_poca: "Downpours of {v} mm over the depressions of the land.",
      r_tempestade: "A 1-hour storm that happens {Ta}, followed by 3 hours of water routing.",
      r_obra: "{x}, compared with the current land, for downpours of {v} mm.",
      r_fogo: "Wind from the {d} at {k} km/h, {c} vegetation, {h} hours.",
      r_avanco: "A fire from the point placed, with isochrones every 30 minutes.",
      r_frequencia: "{n} random ignitions{z}.", r_zona: ", inside the zone drawn",
      r_faixa: "The same fire without and with the fuel break drawn.",
      progT: "Simulating", enviar: "Sending the request to the simulator…", fila: "The request is in the queue.", filaPos: "It is number {p} in the queue.",
      filaNota: "It starts as soon as the engine is free. Simulations from other maps may be ahead.",
      corre: "The simulator is calculating.", correPct: "It is at {p} %.", ha: "Started {t} ago.", tipico: "It usually takes about {m} min.",
      lento: "This is taking longer than usual. You can wait or come back later: the result is saved in «Simulations for this map».",
      progNota: "You can close this window: the calculation continues and the result stays in this map's list.",
      erroT: "Could not simulate", erroTx: "The simulator replied: {m}", tentar: "Try again",
      bloq: "The simulator is blocked here (maximum fire danger or an active fire in the surrounding municipalities). In a fire, follow Civil Protection instructions and call 112.",
      falta: "To continue, first complete the step shown in the panel (for example, the notice). Then you can return to the assistant.",
      lerT: "How to read this result",
      l_poca: "The map shows the depressions where water is retained. Follow the layer legend: from the lowest value, on the left, to the highest, on the right. For each downpour, the table shows how much water stays on the land («Retained») and how much leaves («Left the land»). It is a static calculation: it does not say when or how fast the water arrives.",
      l_tempestade: "The map shows the maximum depth water reaches at each place during the whole storm: not a single moment, but the maximum at each point. Follow the legend: from the lowest value, on the left, to the highest, on the right. «Peak outflow» is the largest amount of water leaving the land, in cubic metres per second, and the minute it happens. If the «Balance error» says «closes», the volume accounts are consistent.",
      l_obra: "The layers under «On the map» show the land before and after the work; switch them on and off to compare. «Retention gain» is the extra water kept on the land because of your interventions, for each downpour. For each pond, the table gives the useful volume, water level, cut and fill.",
      l_avanco: "The lines are isochrones: each one marks how far the front had reached after the minutes written on the line. Lines close together mean the fire advances slowly; far apart, that it advances fast. Colours go from light yellow, in the first minutes, to dark red, hours later. «First arrival at the property» is the time until the front touches your land.",
      l_frequencia: "Each cell shows the fraction of runs in which it burnt: 0 means never, 1 means in all of them. Areas with high values burn in many scenarios and are the ones most worth managing. It is not the real probability of burning in a year.",
      l_faixa: "Compare «Before» and «After»: the burnt area and first arrival at the property, without and with the fuel break. «Area difference» sums up the effect. The isochrones show how the front goes around or through the break. A fuel break is never a guaranteed barrier: the model has no spotting or crown fire.",
      lerMais: "Further down you can switch layers on and off and download the files.", lerOp: "At the end, tell us whether the result matches what you know of the land.",
      barraTx: "Would you rather be guided step by step?", barraB: "Open the assistant"
    }
  };
  function L() { try { return String(W.IPR_LINGUA || D.documentElement.lang || "pt").slice(0, 2) === "en" ? "en" : "pt"; } catch (e) { return "pt"; } }
  function t(k, o) {
    var d = TXT[L()], s = k in d ? d[k] : (TXT.pt[k] != null ? TXT.pt[k] : k);
    if (o && typeof s === "string") Object.keys(o).forEach(function (x) { s = s.split("{" + x + "}").join(String(o[x])); });
    return s;
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function nfmt(x) { try { return Number(x).toLocaleString(L() === "en" ? "en-GB" : "pt-PT", { maximumFractionDigits: 1 }); } catch (e) { return String(x); } }

  // ───────────── preferência (assistente ou painel completo) ─────────────
  var PREF = "ipr_sim_assistente";
  function pref() { try { return localStorage.getItem(PREF) === "painel" ? "painel" : "assistente"; } catch (e) { return "assistente"; } }
  function gravarPref(v) { try { localStorage.setItem(PREF, v); } catch (e) {} }

  // ───────────── ligação aos painéis (só DOM e o estado que eles publicam) ─────────────
  var PID = { agua: "ipr-as", fogo: "ipr-fs" }, ATR = { agua: "data-as", fogo: "data-fs" }, CORPO = { agua: ".as-corpo", fogo: ".fs-corpo" };
  function sim(tp) { return tp === "fogo" ? W.IPR_FOGO_SIM : W.IPR_AGUA_SIM; }
  function est(tp) { try { var s = sim(tp); return (s && s._estado) || null; } catch (e) { return null; } }
  function painel(tp) { return D.getElementById(PID[tp]); }
  function aberto(tp) { var p = painel(tp); return !!p && !p.hidden; }
  function q(tp, sel) { var p = painel(tp); try { return p ? p.querySelector(sel) : null; } catch (e) { return null; } }
  function qa(tp, sel) { var p = painel(tp); try { return p ? [].slice.call(p.querySelectorAll(sel)) : []; } catch (e) { return []; } }
  function botao(tp, a) { return q(tp, "[" + ATR[tp] + '="' + a + '"]'); }
  function clicar(el) { if (!el || el.disabled) return false; try { el.click(); return true; } catch (e) { return false; } }
  function evento(el, nome) { try { el.dispatchEvent(new Event(nome, { bubbles: true })); } catch (e) { try { var ev = D.createEvent("HTMLEvents"); ev.initEvent(nome, true, true); el.dispatchEvent(ev); } catch (e2) {} } }
  // Preenche um campo do painel como uma pessoa o faria: valor, depois «input» e «change» (o painel ouve os dois).
  function definir(tp, k, v) {
    var el = q(tp, '[data-k="' + k + '"]'); if (!el) return false;
    try {
      if (el.type === "checkbox") { if (el.checked === !!v) return true; el.checked = !!v; }
      else {
        var s = String(v);
        if (el.tagName === "SELECT" && ![].some.call(el.options, function (o) { return o.value === s; })) return false;
        if (el.value === s) return true;
        el.value = s;
      }
    } catch (e) { return false; }
    evento(el, "input");
    var el2 = q(tp, '[data-k="' + k + '"]');   // o painel pode ter-se redesenhado com o «input»
    if (el2 === el) evento(el, "change");
    return true;
  }
  function separador(tp, k) {
    var b = q(tp, '[data-tab="' + k + '"]'); if (!b) return false;
    if (b.getAttribute("aria-selected") !== "true") clicar(b);
    var b2 = q(tp, '[data-tab="' + k + '"]'); return !!b2 && b2.getAttribute("aria-selected") === "true";
  }
  function temForm(tp) { return !!botao(tp, "simular"); }
  function desenho(tp) { var S = est(tp); return S && S.des ? S.des : (q(tp, ".des") ? { tipo: "?", pts: [] } : null); }
  function nFeats(tp) { return qa(tp, "[data-apagar]").length; }
  function nIgn(tp) { return qa(tp, "[data-apign]").length; }
  function temZona(tp) { return !!botao(tp, "semzona"); }
  function textoBase(tp) { var b = q(tp, ".ipr-sb-base b"); return b ? b.textContent : ""; }

  // ───────────── perguntas ─────────────
  var ESC = {
    agua: [
      { id: "poca", tab: "ret", passos: ["chuva", "simular"] },
      { id: "tempestade", tab: "2d", passos: ["tempestade", "simular"] },
      { id: "obra", tab: "ad", passos: ["chuva", "obra", "simular"] }
    ],
    fogo: [
      { id: "avanco", tab: "tempo", passos: ["ign", "meteo", "simular"], dur: 3 },
      { id: "frequencia", tab: "muitas", passos: ["zona", "meteo", "simular"], dur: 2 },
      { id: "faixa", tab: "ad", passos: ["ign", "faixa", "meteo", "simular"], dur: 3 }
    ]
  };
  var CEN0 = "20, 50, 100", T0 = 20, VENTO0 = { de: 315, kmh: 20 }, HUM0 = "D2L2";
  function escolha(tp, id) { return (ESC[tp] || []).filter(function (c) { return c.id === id; })[0] || null; }

  // Valores por omissão de cada pergunta, nos campos do próprio painel. Devolve false se o painel não tiver o formulário.
  function aplicar(tp, c) {
    if (!temForm(tp) || !separador(tp, c.tab) || !temForm(tp)) return false;
    if (tp === "agua") {
      if (c.id === "poca") definir(tp, "cenarios", CEN0);
      if (c.id === "tempestade") { definir(tp, "cmodo", "projecto"); definir(tp, "T", T0); definir(tp, "duracao_h", 1); definir(tp, "horas", 3); }
      if (c.id === "obra") { definir(tp, "modoAD", "retencao-rapida"); definir(tp, "cenarios", CEN0); }
    } else {
      definir(tp, "hmodo", "cenario"); definir(tp, "cenario", HUM0);
      definir(tp, "kmh", VENTO0.kmh); definir(tp, "de", VENTO0.de);
      definir(tp, "campoV", "relevo");   // WindNinja: o motor diz no resultado se o usou
      definir(tp, "dur", c.dur);
      if (c.id !== "frequencia") definir(tp, "passo", 30);
    }
    return temForm(tp);
  }

  // ───────────── estado do assistente ─────────────
  var F = null;            // {tipo, c (escolha), i (índice do passo), fase: escolha|passos|progresso|erro|resultado}
  var MODO = { agua: null, fogo: null };   // "assistente" | "painel" enquanto o painel está aberto
  var VISTO = { agua: false, fogo: false };
  var C = null, CX = null, ASS = "";       // cartão, moldura do mapa, assinatura do último desenho

  function css() {
    if (D.getElementById("ipr-sima-css")) return;
    var st = D.createElement("style"); st.id = "ipr-sima-css";
    st.textContent =
      "#ipr-as.ipr-sima-oculto,#ipr-fs.ipr-sima-oculto{visibility:hidden!important;pointer-events:none!important}" +
      "#ipr-sima{position:absolute;z-index:42;top:12px;right:12px;width:380px;max-width:calc(100% - 24px);max-height:calc(100% - 24px);display:flex;flex-direction:column;background:var(--p1,#171a13);color:var(--tx,#ebe7d8);border:1px solid var(--ln2,#3b4232);border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.35);font:14px/1.5 Inter,system-ui,sans-serif;overflow:hidden;--sa:var(--sim-agua,#5BA3D6)}" +
      "#ipr-sima[hidden]{display:none}#ipr-sima *{box-sizing:border-box}#ipr-sima[data-t=fogo]{--sa:var(--sim-fogo,#E07A3F)}" +
      "#ipr-sima .sa-cab{display:flex;align-items:center;gap:8px;padding:9px 8px 9px 12px;border-bottom:1px solid var(--ln,#2b3024);background:var(--p2,#1d2118)}" +
      "#ipr-sima .sa-cab svg{color:var(--sa);flex:0 0 auto}#ipr-sima .sa-cab b{flex:1;min-width:0;font:600 14px/1.25 Raleway,Inter,sans-serif}#ipr-sima .sa-cab small{display:block;font:500 10.5px/1.3 'IBM Plex Mono',monospace;letter-spacing:.06em;text-transform:uppercase;color:var(--mu,#a3a690)}" +
      "#ipr-sima .sa-ib{border:0;background:transparent;color:var(--mu,#a3a690);cursor:pointer;min-width:34px;height:34px;border-radius:7px;font:600 17px Inter,sans-serif}#ipr-sima .sa-ib:hover{background:var(--acs,rgba(168,184,120,.16));color:var(--tx,#ebe7d8)}" +
      "#ipr-sima .sa-corpo{overflow:auto;padding:12px 14px 6px;flex:1 1 auto;min-height:0;overscroll-behavior:contain}" +
      "#ipr-sima h3{margin:0 0 4px;font:600 16px/1.3 Raleway,Inter,sans-serif}#ipr-sima p{margin:0 0 10px}#ipr-sima .sub{color:var(--mu,#a3a690);font-size:13px}#ipr-sima .nota{color:var(--mu,#a3a690);font-size:12.5px}" +
      "#ipr-sima .sa-k{margin:0 0 6px;font:500 10.5px/1.3 'IBM Plex Mono',monospace;letter-spacing:.06em;text-transform:uppercase;color:var(--mu,#a3a690)}" +
      "#ipr-sima .sa-base{display:flex;align-items:center;gap:8px;margin:0 0 10px;font-size:12px;color:var(--mu,#a3a690)}#ipr-sima .sa-base b{flex:1;min-width:0;color:var(--tx,#ebe7d8);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
      "#ipr-sima .sa-ops{display:grid;gap:8px;margin:0 0 8px}" +
      "#ipr-sima .sa-op{display:block;width:100%;text-align:left;padding:12px 12px 12px 14px;min-height:60px;border:1px solid var(--ln2,#3b4232);border-left:3px solid var(--sa);border-radius:9px;background:var(--p2,#1d2118);color:var(--tx,#ebe7d8);cursor:pointer;font:inherit}" +
      "#ipr-sima .sa-op:hover,#ipr-sima .sa-op:focus-visible{border-color:var(--sa);outline:none}#ipr-sima .sa-op b{display:block;font:600 14.5px/1.3 Inter,sans-serif}#ipr-sima .sa-op span{display:block;margin-top:2px;font-size:12.5px;color:var(--mu,#a3a690)}" +
      "#ipr-sima .sa-ch{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 10px}#ipr-sima .sa-ch button{flex:1 1 90px;padding:8px 8px;min-height:44px;border:1px solid var(--ln2,#3b4232);border-radius:8px;background:transparent;color:var(--tx,#ebe7d8);cursor:pointer;font:500 13px/1.25 Inter,sans-serif}" +
      "#ipr-sima .sa-ch button small{display:block;font-size:11px;color:var(--mu,#a3a690)}#ipr-sima .sa-ch button[aria-pressed=true]{border-color:var(--sa);box-shadow:inset 0 0 0 1px var(--sa)}" +
      "#ipr-sima label.f{display:flex;flex-direction:column;gap:4px;margin:0 0 10px;font-size:13px}" +
      "#ipr-sima input[type=text],#ipr-sima select{width:100%;min-width:0;height:40px;padding:4px 10px;border-radius:7px;border:1px solid var(--ln2,#3b4232);background:var(--bg,#121410);color:var(--tx,#ebe7d8);font:15px Inter,sans-serif}" +
      "#ipr-sima .b{display:inline-flex;align-items:center;justify-content:center;gap:6px;font:500 14px Inter,sans-serif;padding:8px 14px;min-height:44px;border-radius:8px;border:1px solid var(--ln2,#3b4232);background:transparent;color:var(--tx,#ebe7d8);cursor:pointer;text-decoration:none}" +
      "#ipr-sima .b:hover{border-color:var(--sa)}#ipr-sima .b.pri{background:var(--sa);border-color:var(--sa);color:#141814;font-weight:600}#ipr-sima .b:disabled{opacity:.45;cursor:default}" +
      "#ipr-sima .acc{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 10px}#ipr-sima .acc .b{flex:1 1 auto}" +
      "#ipr-sima .alvo{animation:iprSimaP 1.6s ease-in-out infinite}@keyframes iprSimaP{0%,100%{box-shadow:0 0 0 0 color-mix(in srgb,var(--sa) 60%,transparent)}50%{box-shadow:0 0 0 6px color-mix(in srgb,var(--sa) 0%,transparent)}}" +
      "#ipr-sima .des{padding:10px 12px;border:1px dashed var(--sa);border-radius:9px;margin:0 0 10px}" +
      "#ipr-sima .ok{padding:8px 10px;border-left:3px solid var(--sa);background:var(--p2,#1d2118);margin:0 0 10px;font-size:13px}" +
      "#ipr-sima .err{padding:8px 10px;border-left:3px solid #d9534f;background:var(--p2,#1d2118);margin:0 0 10px;font-size:13px}" +
      "#ipr-sima ul.res{margin:0 0 10px;padding-left:18px;font-size:13px}" +
      "#ipr-sima .prog{height:4px;border-radius:2px;background:var(--ln,#2b3024);overflow:hidden;margin:4px 0 12px}#ipr-sima .prog i{display:block;height:100%;width:30%;background:var(--sa);animation:iprSimaB 1.4s ease-in-out infinite}#ipr-sima .prog.det i{animation:none;transition:width .6s}@keyframes iprSimaB{0%{margin-left:-30%}100%{margin-left:100%}}" +
      "#ipr-sima .sa-pe{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:10px 14px 12px;border-top:1px solid var(--ln,#2b3024)}#ipr-sima .sa-pe .b{flex:1 1 auto}" +
      "#ipr-sima .sa-pe .lk{flex:1 1 100%;border:0;background:transparent;color:var(--mu,#a3a690);text-decoration:underline;cursor:pointer;font:500 13px Inter,sans-serif;padding:4px 0;min-height:32px;text-align:center}#ipr-sima .sa-pe .lk:hover{color:var(--tx,#ebe7d8)}" +
      "#ipr-sima.compacto .sa-corpo{padding-top:8px}#ipr-sima.compacto .sa-pe{display:none}" +
      "#ipr-sima-mapa{position:absolute;inset:0;z-index:5;pointer-events:none;border:3px dashed var(--sim-agua,#5BA3D6);border-radius:2px;animation:iprSimaM 1.8s ease-in-out infinite}#ipr-sima-mapa[data-t=fogo]{border-color:var(--sim-fogo,#E07A3F)}" +
      "#ipr-sima-mapa span{position:absolute;left:16px;right:410px;top:12px;width:max-content;max-width:calc(100% - 426px);margin:0 auto;padding:7px 12px;border-radius:999px;background:rgba(18,22,15,.92);color:#ebe7d8;font:500 13px/1.35 Inter,system-ui,sans-serif;text-align:center;box-shadow:0 4px 14px rgba(0,0,0,.35)}" +
      "@keyframes iprSimaM{0%,100%{opacity:1}50%{opacity:.55}}" +
      "body:has(#ipr-sima:not([hidden])) #tcdfmb{display:none!important}" +
      // dentro do painel: caixa «Como ler» e barra «Abrir o assistente»
      ".ipr-sima-ler{margin:10px 0;padding:10px 12px;border:1px solid var(--ln2,#3b4232);border-left:3px solid var(--sim-agua,#5BA3D6);border-radius:8px;background:var(--p2,#1d2118);font-size:13px;line-height:1.5}#ipr-fs .ipr-sima-ler{border-left-color:var(--sim-fogo,#E07A3F)}" +
      ".ipr-sima-ler b{display:block;margin:0 0 4px;font:600 13.5px Inter,sans-serif}.ipr-sima-ler p{margin:0 0 8px}.ipr-sima-ler button,.ipr-sima-barra button{min-height:34px;padding:5px 11px;border-radius:8px;border:1px solid var(--ln2,#3b4232);background:transparent;color:var(--tx,#ebe7d8);font:500 12.5px Inter,sans-serif;cursor:pointer}" +
      ".ipr-sima-barra{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:0 0 10px;padding:6px 8px;border:1px dashed var(--ln2,#3b4232);border-radius:8px;font-size:12.5px;color:var(--mu,#a3a690)}.ipr-sima-barra span{flex:1 1 140px}" +
      ".ipr-sima-alvo{outline:2px solid var(--ac2,#cdd6a8)!important;outline-offset:3px}" +
      "@media (max-width:600px){#ipr-sima{left:8px;right:8px;top:auto;bottom:calc(60px + env(safe-area-inset-bottom,0px));width:auto;max-width:none;max-height:min(64vh,calc(100% - 76px))}#ipr-sima.compacto{max-height:40vh}#ipr-sima-mapa span{top:8px;left:104px;right:8px;max-width:calc(100% - 112px);font-size:12.5px}}";
    D.head.appendChild(st);
  }
  var IC = {
    agua: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3c3.5 4.2 6 7.6 6 10.5A6 6 0 0 1 6 13.5C6 10.6 8.5 7.2 12 3z"/><path d="M9 14.5a3 3 0 0 0 3 3"/></svg>',
    fogo: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3c3 4 6 6 6 10a6 6 0 0 1-12 0c0-3 2-5 3-7 1 2 2 3 3 3 0-2-1-4 0-6z"/></svg>'
  };

  function cartao(tp) {
    var p = painel(tp), host = p && p.parentNode; if (!host) return null;
    css();
    if (!C) {
      C = D.createElement("div"); C.id = "ipr-sima"; C.hidden = true; C.setAttribute("role", "dialog");
      C.addEventListener("click", function (e) { try { clique(e); } catch (x) {} });
      C.addEventListener("change", function (e) { try { mudar(e); } catch (x) {} });
      C.addEventListener("input", function (e) { try { escrever(e); } catch (x) {} });
    }
    if (C.parentNode !== host) host.appendChild(C);
    return C;
  }

  // ───────────── modos: assistente por cima do painel, ou painel completo ─────────────
  function modo(tp, m) {
    MODO[tp] = m;
    var p = painel(tp);
    if (p) p.classList.toggle("ipr-sima-oculto", m === "assistente");
    if (m === "assistente") { if (cartao(tp)) { C.hidden = false; ASS = ""; pintar(); } }
    else { if (C) C.hidden = true; moldura(null); injectar(tp); }
  }
  function aoAbrir(tp) {
    if (!F || F.tipo !== tp || !(F.fase === "progresso" || F.fase === "resultado")) F = { tipo: tp, fase: "escolha" };
    modo(tp, F.fase === "resultado" ? "painel" : pref());
  }
  function aoFechar(tp) {
    MODO[tp] = null;
    var p = painel(tp); if (p) p.classList.remove("ipr-sima-oculto");
    if (C && C.getAttribute("data-t") === tp) { C.hidden = true; moldura(null); }
    if (F && F.tipo === tp && F.fase !== "progresso") F = null;
  }

  // ───────────── desenho do cartão ─────────────
  function passoAct() { return F && F.c ? F.c.passos[F.i] : null; }
  function pintar() {
    if (!C || C.hidden || !F) return;
    var tp = F.tipo, h = "", pe = "", ds = desenho(tp);
    C.setAttribute("data-t", tp);
    C.setAttribute("aria-label", t("ass") + " · " + t("t_" + tp));
    C.classList.toggle("compacto", !!ds && W.innerWidth <= 600);
    h += '<div class="sa-cab">' + IC[tp] + "<b><small>" + esc(t("ass")) + "</small>" + esc(t("t_" + tp)) + '</b><button type="button" class="sa-ib" data-sa="x" title="' + esc(t("fechar")) + '" aria-label="' + esc(t("fechar")) + '">×</button></div>';
    h += '<div class="sa-corpo">';
    var nb = textoBase(tp);
    if (nb && !ds) h += '<p class="sa-base"><span>' + esc(t("terreno")) + "</span><b>" + esc(nb) + '</b><button type="button" class="b" style="min-height:32px;padding:3px 10px" data-ipr-sb-trocar="' + tp + '">' + esc(t("trocar")) + "</button></p>";
    if (F.fase === "escolha") {
      h += "<h3>" + esc(t("perg")) + '</h3><p class="sub">' + esc(t("pergSub")) + '</p><div class="sa-ops">';
      ESC[tp].forEach(function (c) { h += '<button type="button" class="sa-op" data-sa-op="' + c.id + '"><b>' + esc(t("a_" + c.id)) + "</b><span>" + esc(t("s_" + c.id)) + "</span></button>"; });
      h += "</div>";
    } else if (F.fase === "passos") {
      var n = F.c.passos.length;
      h += '<p class="sa-k">' + esc(t("passo", { i: F.i + 1, n: n })) + " · " + esc(t("a_" + F.c.id)) + "</p>";
      var r = PASSO[passoAct()](tp) || { h: "", ok: true };
      h += r.h;
      if (!ds) {
        if (F.i > 0) pe += '<button type="button" class="b" data-sa="ant">' + esc(t("anterior")) + "</button>";
        else pe += '<button type="button" class="b" data-sa="inicio">' + esc(t("anterior")) + "</button>";
        if (passoAct() === "simular") pe += '<button type="button" class="b pri alvo" data-sa="simular">' + esc(t("simular")) + "</button>";
        else pe += '<button type="button" class="b pri' + (r.ok && !r.alvo ? " alvo" : "") + '" data-sa="seg"' + (r.ok ? "" : " disabled") + ">" + esc(t("seguinte")) + "</button>";
      }
    } else if (F.fase === "progresso") {
      h += progresso(tp);
    } else if (F.fase === "erro") {
      h += "<h3>" + esc(t("erroT")) + "</h3>";
      h += F.bloq ? '<div class="err">' + esc(t("bloq")) + "</div>" : "";
      if (F.erro) h += '<div class="err">' + esc(t("erroTx", { m: F.erro })) + "</div>";
      pe += '<button type="button" class="b" data-sa="inicio">' + esc(t("nova")) + '</button><button type="button" class="b pri" data-sa="tentar">' + esc(t("tentar")) + "</button>";
    }
    h += "</div>";
    if (!ds) pe += '<button type="button" class="lk" data-sa="painel">' + esc(t("painel")) + "</button>";
    if (pe) h += '<div class="sa-pe">' + pe + "</div>";
    var c0 = C.querySelector(".sa-corpo"), sc = c0 ? c0.scrollTop : 0, foco = D.activeElement && C.contains(D.activeElement) ? D.activeElement.getAttribute("data-sa-foco") : null;
    C.innerHTML = h;
    if (sc) { var c1 = C.querySelector(".sa-corpo"); if (c1) c1.scrollTop = sc; }
    if (foco) { var f = C.querySelector('[data-sa-foco="' + foco + '"]'); if (f) { try { f.focus(); } catch (x) {} } }
    moldura(ds ? tp : null);
  }

  function chips(nome, ops, actual) {
    return '<div class="sa-ch" role="group">' + ops.map(function (o) { return '<button type="button" data-sa-' + nome + '="' + esc(o.v) + '" aria-pressed="' + (String(o.v) === String(actual)) + '">' + esc(o.t) + (o.s ? "<small>" + esc(o.s) + "</small>" : "") + "</button>"; }).join("") + "</div>";
  }
  function blocoDesenho(tp, dica) {
    var ds = desenho(tp), npts = ds && ds.pts ? ds.pts.length : 0, ponto = ds && ds.tipo === "ign_ponto";
    var minimo = ds && (ds.tipo === "vala" || ds.tipo === "acude") ? 2 : 3;
    var h = '<div class="des"><p style="margin:0 0 6px"><b>' + esc(dica) + "</b></p>";
    if (!ponto) h += '<p class="nota" style="margin:0 0 8px">' + esc(t("pontos", { n: npts })) + "</p>";
    h += '<div class="acc" style="margin:0">' + (ponto ? "" : '<button type="button" class="b pri' + (npts >= minimo ? " alvo" : "") + '" data-sa="terminar"' + (npts >= minimo ? "" : " disabled") + ">" + esc(t("terminar")) + "</button>") + '<button type="button" class="b" data-sa="cancelar">' + esc(t("cancelar")) + "</button></div></div>";
    return h;
  }
  function dicaDesenho(tp) {
    var ds = desenho(tp); if (!ds) return "";
    return t({ ign_ponto: "h_ign", charca: "h_charca", vala: "h_vala", zona: "h_zona", faixa: "h_faixa" }[ds.tipo] || "h_charca");
  }
  function S_(tp) { return est(tp) || {}; }
  function nomeTipo(k) { return t(k === "faixa" ? "faixaN" : k).toLowerCase(); }
  function contarFeats(tp) {
    var S = S_(tp), c = {};
    (S.feats || []).forEach(function (f) { var k = f && f.properties && (f.properties.tipo || f.properties._k); if (k) c[k] = (c[k] || 0) + 1; });
    var l = Object.keys(c).map(function (k) { return c[k] + " " + nomeTipo(k); });
    return l.length ? l.join(", ") : String(nFeats(tp));
  }
  function cenTexto(tp) { var S = S_(tp), v = S.cenarios || CEN0; return String(v).split(/[,;\s]+/).filter(Boolean).join(", "); }

  var PASSO = {
    chuva: function (tp) {
      var S = S_(tp);
      return { ok: true, h: "<h3>" + esc(t("chuvaT")) + '</h3><p class="sub">' + esc(t("chuvaTx")) + '</p><label class="f">' + esc(t("chuvaRot")) +
        '<input type="text" inputmode="decimal" data-sa-foco="cen" data-sa-k="cenarios" value="' + esc(S.cenarios || CEN0) + '"></label><p class="nota">' + esc(t("chuvaNota")) + "</p>" };
    },
    tempestade: function (tp) {
      var S = S_(tp), T = S.chuva && S.chuva.T || T0;
      return { ok: true, h: "<h3>" + esc(t("tempT")) + '</h3><p class="sub">' + esc(t("tempTx")) + "</p>" +
        chips("tr", [{ v: 10, t: t("T10"), s: t("Tanos", { T: 10 }) }, { v: 20, t: t("T20"), s: t("Tanos", { T: 20 }) }, { v: 100, t: t("T100"), s: t("Tanos", { T: 100 }) }], T) +
        '<p class="nota">' + esc(t("tempNota")) + "</p>" };
    },
    obra: function (tp) {
      var ds = desenho(tp), n = nFeats(tp), h = "<h3>" + esc(t("obraT")) + "</h3>";
      if (ds) return { ok: false, alvo: true, h: h + blocoDesenho(tp, dicaDesenho(tp)) };
      h += '<p class="sub">' + esc(t("obraTx")) + '</p><div class="acc"><button type="button" class="b' + (n ? "" : " alvo") + '" data-sa-des="charca">' + esc(t("charca")) + '</button><button type="button" class="b' + (n ? "" : " alvo") + '" data-sa-des="vala">' + esc(t("vala")) + "</button></div>";
      h += n ? '<div class="ok">' + esc(t("feitas", { x: contarFeats(tp) })) + ' <button type="button" class="b" style="min-height:30px;padding:2px 9px;margin-left:4px" data-sa="apagarUlt">' + esc(t("apagarUlt")) + "</button></div>" : '<p class="nota">' + esc(t("nada")) + "</p>";
      return { ok: n > 0, alvo: !n, h: h + '<p class="nota">' + esc(t("obraNota")) + "</p>" };
    },
    ign: function (tp) {
      var ds = desenho(tp), n = nIgn(tp), h = "<h3>" + esc(t("ignT")) + "</h3>";
      if (ds) return { ok: false, alvo: true, h: h + blocoDesenho(tp, dicaDesenho(tp)) };
      h += '<p class="sub">' + esc(t("ignTx")) + "</p>";
      if (n) h += '<div class="ok">' + esc(t("ignFeito")) + '</div><div class="acc"><button type="button" class="b" data-sa="ignOutro">' + esc(t("ignOutro")) + "</button></div>";
      else h += '<div class="acc"><button type="button" class="b pri alvo" data-sa="ign">' + esc(t("ignB")) + "</button></div>";
      return { ok: n > 0, alvo: !n, h: h };
    },
    zona: function (tp) {
      var S = S_(tp), ds = desenho(tp), h = "<h3>" + esc(t("zonaT")) + "</h3>";
      if (ds) return { ok: false, alvo: true, h: h + blocoDesenho(tp, dicaDesenho(tp)) };
      h += '<p class="sub">' + esc(t("zonaTx", { n: S.nIgn || 50 })) + "</p>";
      if (temZona(tp)) h += '<div class="ok">' + esc(t("zonaFeita")) + '</div><div class="acc"><button type="button" class="b" data-sa="zonaTirar">' + esc(t("zonaTirar")) + "</button></div>";
      else h += '<div class="acc"><button type="button" class="b" data-sa-des="zona">' + esc(t("zonaB")) + "</button></div>";
      return { ok: true, h: h };
    },
    faixa: function (tp) {
      var ds = desenho(tp), n = nFeats(tp), h = "<h3>" + esc(t("faixaT")) + "</h3>";
      if (ds) return { ok: false, alvo: true, h: h + blocoDesenho(tp, dicaDesenho(tp)) };
      h += '<p class="sub">' + esc(t("faixaTx")) + "</p>";
      h += '<div class="acc"><button type="button" class="b' + (n ? "" : " pri alvo") + '" data-sa-des="faixa">' + esc(t("faixaB")) + "</button></div>";
      if (n) h += '<div class="ok">' + esc(t("faixaFeita")) + " (" + n + ') <button type="button" class="b" style="min-height:30px;padding:2px 9px;margin-left:4px" data-sa="apagarUlt">' + esc(t("apagarUlt")) + "</button></div>";
      return { ok: n > 0, alvo: !n, h: h + '<p class="nota">' + esc(t("faixaNota")) + "</p>" };
    },
    meteo: function (tp) {
      var S = S_(tp), v = S.vento || VENTO0, hum = S.hum && S.hum.cenario || HUM0, P8 = t("pts");
      var h = "<h3>" + esc(t("meteoT")) + '</h3><label class="f">' + esc(t("ventoDe")) + '<select data-sa-foco="de" data-sa-k="de">' +
        Object.keys(P8).map(function (g) { return '<option value="' + g + '"' + (+g === +v.de ? " selected" : "") + ">" + esc(P8[g]) + "</option>"; }).join("") + "</select></label>";
      h += '<p class="sa-k">' + esc(t("vel")) + "</p>" + chips("kmh", [{ v: 10, t: t("v10"), s: "10 km/h" }, { v: 20, t: t("v20"), s: "20 km/h" }, { v: 40, t: t("v40"), s: "40 km/h" }], v.kmh);
      h += '<p class="sa-k">' + esc(t("secura")) + "</p>" + chips("hum", [{ v: "D1L1", t: t("c_D1L1"), s: "D1L1" }, { v: "D2L2", t: t("c_D2L2"), s: "D2L2" }, { v: "D3L3", t: t("c_D3L3"), s: "D3L3" }], hum);
      h += '<p class="nota">' + esc(t("meteoNota")) + " " + esc(t("durTx", { h: nfmt(S.dur || F.c.dur) })) + "</p>";
      return { ok: true, h: h };
    },
    simular: function (tp) {
      var S = S_(tp), c = F.c, l = [];
      if (c.id === "poca") l.push(t("r_poca", { v: cenTexto(tp) }));
      if (c.id === "tempestade") l.push(t("r_tempestade", { Ta: t("Tanos", { T: S.chuva && S.chuva.T || T0 }) }));
      if (c.id === "obra") l.push(t("r_obra", { x: contarFeats(tp), v: cenTexto(tp) }).replace(/^./, function (x) { return x.toUpperCase(); }));
      if (tp === "fogo") {
        if (c.id === "avanco") l.push(t("r_avanco"));
        if (c.id === "frequencia") l.push(t("r_frequencia", { n: S.nIgn || 50, z: temZona(tp) ? t("r_zona") : "" }));
        if (c.id === "faixa") l.push(t("r_faixa"));
        var v = S.vento || VENTO0, hum = S.hum && S.hum.cenario || HUM0;
        l.push(t("r_fogo", { d: String(t("pts")[v.de] || v.de).toLowerCase(), k: v.kmh, c: String(t("c_" + hum) || hum).toLowerCase(), h: nfmt(S.dur || c.dur) }));
      }
      return { ok: true, h: "<h3>" + esc(t("simT")) + '</h3><p class="sub">' + esc(t("simTx")) + '</p><ul class="res">' + l.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + '</ul><p class="nota">' + esc(t("simNota")) + "</p>" };
    }
  };

  // ───────────── progresso: o estado do painel em palavras simples ─────────────
  var TIPICO = { "retencao-rapida": 2, "antes-depois": 10, "simulacao-2d": 30 };   // os mesmos minutos do painel da água
  function dur(ms) {
    var s = Math.max(0, Math.round(ms / 1000)), m = Math.floor(s / 60), hh = Math.floor(m / 60);
    if (hh) return hh + " h " + (m % 60) + " min";
    if (m) return m + " min";
    return s + " s";
  }
  function progresso(tp) {
    var S = S_(tp), j = S.job, h = "<h3>" + esc(t("progT")) + "</h3>";
    if (!j) return h + '<div class="prog"><i></i></div>';
    if (j.enviar) return h + '<div class="prog"><i></i></div><p>' + esc(t("enviar")) + "</p>";
    var d = j.det || {};
    if (j.estado === "running") {
      var pr = typeof d.progresso === "number" && d.progresso > 0 ? Math.round(d.progresso) : null;
      var ini = d.iniciado ? Date.parse(d.iniciado) : (j.t0 || F.t1 || Date.now()), dt = Date.now() - ini;
      h += pr ? '<div class="prog det"><i style="width:' + pr + '%"></i></div>' : '<div class="prog"><i></i></div>';
      h += "<p><b>" + esc(t("corre")) + "</b> " + (pr ? esc(t("correPct", { p: pr })) + " " : "") + esc(t("ha", { t: dur(dt) })) + "</p>";
      var proc = d.processo || j.processo || "", tm = tp === "agua" ? TIPICO[proc] : null;
      if (tm) h += dt > tm * 60000 ? '<div class="err">' + esc(t("lento")) + "</div>" : '<p class="nota">' + esc(t("tipico", { m: tm })) + "</p>";
    } else {
      var f = d.fila;
      h += '<div class="prog"><i></i></div><p><b>' + esc(t("fila")) + "</b>" + (f && f.posicao ? " " + esc(t("filaPos", { p: f.posicao })) : "") + '</p><p class="nota">' + esc(t("filaNota")) + "</p>";
    }
    return h + '<p class="nota">' + esc(t("progNota")) + "</p>";
  }

  // ───────────── acções ─────────────
  function irPara(i) { F.i = Math.max(0, Math.min(F.c.passos.length - 1, i)); ASS = ""; pintar(); var c = C && C.querySelector(".sa-corpo"); if (c) c.scrollTop = 0; }
  function falta(tp) {
    // O painel não tem o formulário (aviso por aceitar, sem conta, sem mapa entregue): mostra-o e realça o que falta.
    modo(tp, "painel");
    var av = q(tp, ".avbox") || q(tp, ".sub");
    if (av) av.classList.add("ipr-sima-alvo");
    F.falta = true; injectar(tp);
  }
  // O painel do fogo lê o aviso ao site ao abrir: espera-se um pouco pelo formulário antes de desistir.
  function comecar(tp, c, t0) {
    if (!F || F.tipo !== tp || F.c !== c) return;
    if (aplicar(tp, c)) return irPara(0);
    if (Date.now() - t0 > 4000) return falta(tp);
    setTimeout(function () { try { comecar(tp, c, t0); } catch (x) {} }, 250);
  }
  function lancar(tp) {
    var b = botao(tp, "simular");
    if (!b) return falta(tp);
    if (b.disabled) return;
    var S = S_(tp);
    F.t0 = Date.now(); F.t1 = null; F.erro = ""; F.bloq = false; F.res = null;
    clicar(b);
    S = S_(tp);
    if (S.job) { F.fase = "progresso"; }
    else if (S.erro) { F.fase = "erro"; F.erro = S.erro; F.bloq = !!S.bloq; }
    else F.fase = "progresso";
    ASS = ""; pintar();
  }
  function clique(e) {
    var el = e.target && e.target.closest ? e.target.closest("button") : null; if (!el || !F) return;
    if (el.hasAttribute("data-ipr-sb-trocar")) return;   // o simulador-base.js trata da troca da Base
    e.preventDefault();
    var tp = F.tipo, a = el.getAttribute("data-sa");
    if (a === "x") { if (!clicar(botao(tp, "x"))) { try { sim(tp).fechar(); } catch (x) {} } return; }
    if (a === "painel") { gravarPref("painel"); if (desenho(tp)) clicar(botao(tp, "cancelar")); modo(tp, "painel"); return; }
    if (el.hasAttribute("data-sa-op")) {
      var c = escolha(tp, el.getAttribute("data-sa-op")); if (!c) return;
      F.c = c; F.i = 0; F.fase = "passos";
      return comecar(tp, c, Date.now());
    }
    if (a === "inicio") { if (desenho(tp)) clicar(botao(tp, "cancelar")); F = { tipo: tp, fase: "escolha" }; ASS = ""; pintar(); return; }
    if (a === "ant") return irPara(F.i - 1);
    if (a === "seg") return irPara(F.i + 1);
    if (a === "simular") return lancar(tp);
    if (a === "tentar") { F.fase = "passos"; F.i = F.c ? F.c.passos.length - 1 : 0; if (!F.c) F.fase = "escolha"; ASS = ""; pintar(); return; }
    if (a === "terminar") { clicar(botao(tp, "terminar")); ASS = ""; pintar(); return; }
    if (a === "cancelar") { clicar(botao(tp, "cancelar")); ASS = ""; pintar(); return; }
    if (a === "ign") { clicar(q(tp, '[data-des="ign_ponto"]')); ASS = ""; pintar(); return; }
    if (a === "ignOutro") { qa(tp, "[data-apign]").reverse().forEach(function () { clicar(q(tp, "[data-apign]")); }); clicar(q(tp, '[data-des="ign_ponto"]')); ASS = ""; pintar(); return; }
    if (a === "apagarUlt") { var l = qa(tp, "[data-apagar]"); clicar(l[l.length - 1]); ASS = ""; pintar(); return; }
    if (a === "zonaTirar") { clicar(botao(tp, "semzona")); ASS = ""; pintar(); return; }
    if (el.hasAttribute("data-sa-des")) { clicar(q(tp, '[data-des="' + el.getAttribute("data-sa-des") + '"]')); ASS = ""; pintar(); return; }
    if (el.hasAttribute("data-sa-tr")) { definir(tp, "T", el.getAttribute("data-sa-tr")); pintar(); return; }
    if (el.hasAttribute("data-sa-kmh")) { definir(tp, "kmh", el.getAttribute("data-sa-kmh")); pintar(); return; }
    if (el.hasAttribute("data-sa-hum")) { definir(tp, "hmodo", "cenario"); definir(tp, "cenario", el.getAttribute("data-sa-hum")); pintar(); return; }
  }
  function mudar(e) { var el = e.target; if (!F || !el || !el.getAttribute) return; if (el.getAttribute("data-sa-k") === "de") definir(F.tipo, "de", el.value); }
  function escrever(e) { var el = e.target; if (!F || !el || !el.getAttribute) return; if (el.getAttribute("data-sa-k") === "cenarios") definir(F.tipo, "cenarios", el.value); }

  // ───────────── moldura no mapa enquanto se marca ─────────────
  function moldura(tp) {
    try {
      var M = W.__ipe && W.__ipe.mapa, host = M && M.getContainer ? M.getContainer() : null;
      if (!tp || !host || MODO[tp] !== "assistente") { if (CX && CX.parentNode) CX.parentNode.removeChild(CX); return; }
      if (!CX) { CX = D.createElement("div"); CX.id = "ipr-sima-mapa"; CX.setAttribute("aria-hidden", "true"); CX.innerHTML = "<span></span>"; }
      if (CX.parentNode !== host) host.appendChild(CX);
      CX.setAttribute("data-t", tp);
      var s = CX.firstChild, txt = dicaDesenho(tp); if (s.textContent !== txt) s.textContent = txt;
    } catch (e) {}
  }

  // ───────────── dentro do painel: «Como ler este resultado» e «Abrir o assistente» ─────────────
  function injectar(tp) {
    try {
      var p = painel(tp); if (!p || p.hidden || MODO[tp] !== "painel") return;
      var corpo = p.querySelector(CORPO[tp]); if (!corpo) return;
      var ler = F && F.tipo === tp && F.fase === "resultado" && F.c && S_(tp).res && S_(tp).res === F.res;
      var chave = L() + (ler ? "r" + F.c.id : "b") + (F && F.falta ? "f" : "");
      var el = corpo.querySelector(":scope > .ipr-sima-ler, :scope > .ipr-sima-barra");
      if (el && el.getAttribute("data-k") === chave) return;
      if (el) el.parentNode.removeChild(el);
      el = D.createElement("div"); el.setAttribute("data-k", chave);
      if (ler) {
        el.className = "ipr-sima-ler";
        el.innerHTML = "<b>" + esc(t("lerT")) + "</b><p>" + esc(t("l_" + F.c.id)) + "</p><p>" + esc(t("lerMais")) + (tp === "agua" ? " " + esc(t("lerOp")) : "") + '</p><button type="button" data-sa-nova>' + esc(t("nova")) + "</button>";
        // logo antes do título «Resultados» do painel; senão, no topo
        var hs = [].slice.call(corpo.querySelectorAll(":scope > .as-h, :scope > .fs-h")), alvo = null, rot = L() === "en" ? "results" : "resultados";
        hs.forEach(function (x) { if (!alvo && x.textContent.trim().toLowerCase() === rot) alvo = x; });
        corpo.insertBefore(el, alvo || corpo.firstChild);
        if (F.rolar && Date.now() - F.rolar < 4000) { try { corpo.scrollTop = Math.max(0, el.offsetTop - corpo.offsetTop - 8); } catch (x) {} }
      } else {
        el.className = "ipr-sima-barra";
        el.innerHTML = "<span>" + esc(F && F.falta ? t("falta") : t("barraTx")) + '</span><button type="button" data-sa-ass>' + esc(t("barraB")) + "</button>";
        var lb = corpo.querySelector(":scope > .ipr-sb-base");
        corpo.insertBefore(el, lb ? lb.nextSibling : corpo.firstChild);
      }
      el.addEventListener("click", function (e) {
        try {
          var b = e.target && e.target.closest ? e.target.closest("button") : null; if (!b) return;
          e.preventDefault(); e.stopPropagation();
          if (b.hasAttribute("data-sa-nova")) { F = { tipo: tp, fase: "escolha" }; modo(tp, "assistente"); }
          if (b.hasAttribute("data-sa-ass")) {
            gravarPref("assistente");
            if (!F || F.tipo !== tp || F.fase !== "progresso") F = { tipo: tp, fase: "escolha" };
            var av = q(tp, ".ipr-sima-alvo"); if (av) av.classList.remove("ipr-sima-alvo");
            modo(tp, "assistente");
          }
        } catch (x) {}
      });
    } catch (e) {}
  }

  // ───────────── vigia ─────────────
  function assinatura(tp) {
    var S = S_(tp), j = S.job, ds = desenho(tp), d = j && j.det || {};
    return [L(), F && F.fase, F && F.i, F && F.c && F.c.id, ds ? ds.tipo + (ds.pts || []).length : "", nFeats(tp), nIgn(tp), temZona(tp), textoBase(tp),
      j ? (j.enviar ? "e" : j.estado) + (d.fila && d.fila.posicao || "") + (d.progresso || "") + (j.estado === "running" ? Math.floor(Date.now() / 1000) : "") : "", S.erro || "", W.innerWidth <= 600].join("|");
  }
  function seguirJob(tp) {
    if (!F || F.tipo !== tp || F.fase !== "progresso") return;
    var S = S_(tp);
    if (S.job) { if (S.job.estado === "running" && !F.t1) F.t1 = Date.now(); return; }
    if (S.res) { F.fase = "resultado"; F.res = S.res; F.rolar = Date.now(); if (MODO[tp]) modo(tp, "painel"); return; }
    if (S.erro) { F.fase = "erro"; F.erro = S.erro; F.bloq = !!S.bloq; ASS = ""; return; }
    if (Date.now() - (F.t0 || 0) > 5000) { F.fase = "erro"; F.erro = ""; ASS = ""; }
  }
  function vigiar() {
    ["agua", "fogo"].forEach(function (tp) {
      try {
        if (!sim(tp) && !painel(tp)) return;
        var ab = aberto(tp);
        if (ab && !VISTO[tp]) { VISTO[tp] = true; aoAbrir(tp); }
        else if (!ab && VISTO[tp]) { VISTO[tp] = false; aoFechar(tp); }
        seguirJob(tp);
        if (!ab) return;
        var p = painel(tp);
        if (MODO[tp] === "assistente") {
          if (p && !p.classList.contains("ipr-sima-oculto")) p.classList.add("ipr-sima-oculto");
          if (C && C.hidden) C.hidden = false;
          if (F && F.tipo === tp) { var a = assinatura(tp); if (a !== ASS) { ASS = a; pintar(); } }
        } else if (MODO[tp] === "painel") injectar(tp);
      } catch (e) {}
    });
  }
  // O painel reescreve-se a cada actualização: repor logo a caixa «Como ler» ou a barra (sem esperar pela vigia).
  var OBS = {};
  function observarPaineis() {
    ["agua", "fogo"].forEach(function (tp) {
      try {
        var p = painel(tp); if (!p || !W.MutationObserver || (OBS[tp] && OBS[tp].el === p)) return;
        if (OBS[tp]) OBS[tp].o.disconnect();
        var o = new MutationObserver(function () { if (MODO[tp] === "painel") injectar(tp); });
        o.observe(p, { childList: true });
        OBS[tp] = { el: p, o: o };
      } catch (e) {}
    });
  }
  try {
    setInterval(function () { if (!D.hidden) { observarPaineis(); vigiar(); } }, 400);
    D.addEventListener("ipr:lingua", function () { try { ASS = ""; pintar(); ["agua", "fogo"].forEach(function (tp) { if (MODO[tp] === "painel") injectar(tp); }); } catch (e) {} });
    W.addEventListener("resize", function () { ASS = ""; });
  } catch (e) {}

  W.IPR_SIM_ASSISTENTE = { _estado: function () { return F; }, painel: function (tp) { if (MODO[tp]) modo(tp, "painel"); }, assistente: function (tp) { if (MODO[tp]) { F = { tipo: tp, fase: "escolha" }; modo(tp, "assistente"); } } };
})(window);
