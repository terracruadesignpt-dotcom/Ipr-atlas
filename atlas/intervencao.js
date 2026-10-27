/* IPR Atlas · Análise prévia da intervenção (tema «Condicionantes à intervenção»).
   Pedido do Nuno, 26/10/2026 (propostas/intervencao/pedido-nuno-2026-10-26.md). Terracrua Design.
   Carrega-se depois de ajustes.js e de mundo-camadas.js e não mexe em nenhum deles: liga-se pelo DOM (#ipr-t62, cartão
   do tema «cond») e pelo que está em window (__ipe.mapa, __ipe.estado, IPRViz.catalogo, IPRDiag.mvtDecode, IPR_LINGUA,
   IPR_NIVEL). A lógica de classificação (núcleo) não depende do browser e pode ser testada em node:
   require("intervencao.js").nucleo.
   Regras que não se negociam: estar fora de linha de água nunca dá dispensa de licenciamento; a RAN nunca aparece como
   proibição (há utilizações não agrícolas sujeitas a parecer); a falta de dados nunca é lida como facilidade. */
(function (raiz) {
  "use strict";

  // ───────────────────────────── Dicionário (escrito por nós, PT europeu pré-AO90 e inglês britânico) ─────────────────
  var D = {
    pt: {
      botao: "Análise prévia da intervenção", titulo: "Análise prévia da intervenção",
      sub: "Escolha o que pretende fazer, responda ao que souber e desenhe a área. A ficha mostra obstáculos, entidades a consultar e o que falta saber.",
      minimizar: "Minimizar", restaurar: "Abrir", fechar: "Fechar", arrastar: "Arrastar o painel",
      p1: "Tipo", p2: "Perguntas", p3: "Área", p4: "Ficha", pcmp: "Comparar",
      seguinte: "Seguinte", voltar: "Voltar", analisar: "Analisar a área", reanalisar: "Analisar de novo",
      // tipos
      tipoQ: "O que pretende fazer?",
      t_charca: "Charca escavada, fora de linha de água", td_charca: "Escavação para guardar água da chuva, de escorrência, de nascente ou de furo, longe do leito de uma linha de água.",
      t_barragem: "Barragem ou açude, com retenção numa linha de água", td_barragem: "Parede ou aterro que atravessa uma linha de água e retém o caudal.",
      t_valas: "Valas de infiltração e pequenas retenções", td_valas: "Valas em curva de nível, pequenos diques ou bacias para abrandar a água e infiltrá-la no solo.",
      t_modulacao: "Modulação do terreno", td_modulacao: "Terraços, escavações, aterros e plataformas que mudam a forma do terreno.",
      t_limpeza: "Limpeza ou recuperação de estrutura existente", td_limpeza: "Desassorear, reparar ou recuperar uma charca, açude, poço ou muro que já existe.",
      // perguntas
      perguntasQ: "Responda ao que souber. Pode deixar «não sei».", naoSei: "Não sei", escolher: "Escolher…",
      q_finalidade: "Finalidade", q_origem: "Origem da água", q_area: "Área a intervencionar", q_profundidade: "Profundidade máxima",
      q_alturaParede: "Altura da parede ou do aterro", q_volEsc: "Volume aproximado de escavação", q_volArm: "Volume aproximado de armazenamento",
      q_titulo: "A estrutura existente tem título ou licença?",
      qa_area: "Se ficar vazio, usa-se a área desenhada.",
      f_rega: "Rega", f_animais: "Abeberamento de animais", f_incendio: "Reserva para combate a incêndios", f_biodiv: "Biodiversidade e paisagem",
      f_recarga: "Infiltração e recarga do aquífero", f_erosao: "Controlo de erosão e escorrência", f_acesso: "Acesso, plataforma ou construção", f_outra: "Outra",
      o_escorrencia: "Escorrência da chuva no próprio terreno", o_linha: "Linha de água (desvio ou retenção)", o_nascente: "Nascente", o_subterranea: "Furo ou poço",
      o_rede: "Rede pública", o_na: "Não se aplica",
      s_sim: "Sim", s_nao: "Não",
      // área
      areaQ: "Onde fica a intervenção?", desenhar: "Desenhar no mapa", usarTerreno: "Usar o terreno activo", limpar: "Limpar a área",
      desenhoH: "Clique nos cantos da área. Termine no primeiro ponto, com duplo clique ou em «Terminar».",
      terminar: "Terminar", desfazer: "Desfazer ponto", cancelar: "Cancelar", pontos: "{n} pontos",
      semArea: "Ainda não há área desenhada.", areaDes: "Área desenhada: {a}", semTerreno: "Não há terreno activo neste momento. Desenhe a área no mapa.",
      // análise
      aConsultar: "A consultar {n} fontes…", consultadas: "{i} de {n} fontes",
      // estados
      e_menos: "Menos condicionantes identificadas", e_verificacao: "Exige verificação", e_relevantes: "Condicionantes relevantes", e_insuficiente: "Informação insuficiente",
      ed_menos: "As fontes que responderam não mostram sobreposições relevantes. Não é uma dispensa de licenciamento: confirme sempre com as entidades.",
      ed_verificacao: "Há pontos que precisam de ser confirmados antes de avançar.",
      ed_relevantes: "Há condicionantes que pesam na decisão e exigem consulta às entidades.",
      ed_insuficiente: "Faltam dados ou respostas para tirar conclusões. A falta de dados não quer dizer que não haja condicionantes.",
      n_rel: "Condicionante relevante", n_ver: "Exige verificação", n_ok: "Sem sobreposição nesta fonte", n_nd: "Sem dados", n_info: "Nota",
      // leituras
      fisica: "Aptidão física", fisicaD: "Se o terreno se presta a esta intervenção (relevo, água, cheias).",
      admin: "Complexidade administrativa previsível", adminD: "Quantas consultas e procedimentos são de esperar.",
      a_favoravel: "Favorável", a_condicionada: "Condicionada", a_desfavoravel: "Desfavorável", a_indeterminada: "Indeterminada",
      c_menor: "Menor", c_media: "Média", c_elevada: "Elevada", c_indeterminada: "Indeterminada",
      cNota: "Leitura previsível, feita a partir dos dados públicos. Não substitui a consulta das entidades.",
      // secções da ficha
      indicacoes: "Indicações", razao: "Razão", fonte: "Fonte", dataAct: "Actualização", consultado: "Consultado em {d}", modelado: "modelado",
      entidades: "Entidades a consultar", falta: "Informação em falta", passos: "Próximos passos", porque: "por: {x}",
      aviso: "A análise prévia é um apoio à leitura do território. Não substitui o enquadramento jurídico, a consulta do plano em vigor nem a confirmação no terreno. Prevalece o que está publicado em Diário da República.",
      fecharFicha: "Fechar a ficha",
      guardar: "Guardar para comparar", guardado: "Guardada como local {l}", cheio: "Já há três locais guardados. Retire um para guardar outro.",
      copiar: "Copiar texto", copiado: "Texto copiado.", json: "Descarregar JSON", html: "Descarregar HTML",
      // resumo
      r_ident: "Foram identificadas {x}.", r_nada: "As fontes que responderam não mostram sobreposições relevantes, o que não dispensa a confirmação junto das entidades.",
      r_conf: "É necessário confirmar o enquadramento municipal", r_consultar: " e consultar {x}", r_falta: "Falta indicar {x}.", r_nd: "Não foi possível consultar: {x}.", r_ndN: "Não foi possível consultar {n} das {t} fontes, entre elas {x}.",
      r_fim: "Consultar camadas, fontes e próximos passos.",
      e_: " e ", virg: ", ",
      // comparação
      cmpT: "Comparar locais dentro da propriedade", cmpVazio: "Guarde a análise de duas ou três localizações para as ver lado a lado.",
      cmpRetirar: "Retirar", cmpLocal: "Local {l}", cmpEstado: "Estado", cmpArea: "Área", cmpDecl: "Declive médio (modelado)",
      cmpEnt: "Entidades", cmpFalta: "Em falta", cmpVer: "Ver ficha", cmpNovo: "Analisar outro local",
      // explorer
      trancT: "A ficha completa é do Intelligence", trancH: "No Explorer pode escolher o tipo de intervenção e responder às perguntas. O cruzamento com REN, RAN, PDM, linhas de água, Rede Natura, captações e servidões, e a ficha explicada, abrem com o Intelligence.",
      trancB: "Ver o Intelligence", trancFalta: "Com o que já indicou, falta saber:", tranc: "Intelligence",
      // erros
      erroGeo: "A área tem de ter pelo menos três pontos.", erroMapa: "O mapa ainda não está pronto.",
      // nomes curtos das fontes
      fn_ren: "REN", fn_ran: "RAN", fn_ah: "Aproveitamentos hidroagrícolas", fn_crus: "PDM · qualificação do solo", fn_agua: "Linhas de água cartografadas",
      fn_la350: "Linhas de água com bacia > 350 ha", fn_dph: "Domínio público hídrico", fn_n2k: "Rede Natura 2000", fn_rnap: "Áreas protegidas", fn_habitats: "Habitats cartografados",
      fn_albuf: "Albufeiras classificadas", fn_albpub: "Albufeiras de águas públicas", fn_capt: "Perímetros de protecção de captações", fn_aquif: "Captações subterrâneas de abastecimento (SRUP)",
      fn_inund: "Zonas inundáveis", fn_zadj: "Zonas adjacentes", fn_relevo: "Declives e erosão", fn_escorr: "Escorrência e linhas de água modeladas",
      fn_arv: "Árvores de interesse público", fn_cos: "Sobreiro e azinheira (ocupação do solo)", fn_ic: "Património classificado", fn_eletr: "Rede eléctrica",
      fn_viaria: "Rede rodoviária nacional", fn_ferro: "Rede ferroviária", fn_go: "Gasodutos e oleodutos", fn_marcos: "Marcos geodésicos", fn_aero: "Servidões aeronáuticas",
      fn_defesa: "Defesa nacional", fn_perig: "Perigosidade de incêndio", fn_tipo: "Tipo de intervenção", fn_origem: "Origem da água", fn_valores: "Valores indicados",
      // frases do resumo
      fr_ren: "sobreposições com REN", fr_ren_p: "proximidade à REN", fr_ran: "sobreposições com RAN", fr_agua: "interferência com uma linha de água", fr_agua_p: "proximidade a uma linha de água",
      fr_la350: "proximidade a uma linha de água principal", fr_dph: "sobreposição com o domínio público hídrico", fr_n2k: "sobreposição com a Rede Natura 2000", fr_n2k_p: "proximidade à Rede Natura 2000",
      fr_rnap: "sobreposição com uma área protegida", fr_rnap_p: "proximidade a uma área protegida", fr_habitats: "habitats cartografados", fr_albuf: "proximidade a uma albufeira protegida",
      fr_capt: "um perímetro de protecção de captação", fr_inund: "zona inundável", fr_inund_p: "proximidade a zona inundável", fr_zadj: "zona adjacente", fr_relevo: "declives que dificultam a obra (modelado)",
      fr_escorr: "escorrência concentrada (modelado)", fr_arv: "uma árvore de interesse público", fr_cos: "possível presença de sobreiro ou azinheira", fr_ic: "património classificado",
      fr_redes: "faixas de servidão de redes", fr_perig: "perigosidade de incêndio alta", fr_crus: "uma categoria do PDM a confirmar", fr_barragem: "retenção numa linha de água",
      // razões
      g_ok: "Não foi identificada sobreposição nem proximidade (até {b} m) nesta fonte.", g_ok0: "Não foi identificada sobreposição nesta fonte.",
      g_okImg: "Nada visível na imagem do serviço até {b} m. É uma leitura indirecta: confirme na fonte.",
      g_nd: "Não foi possível obter dados desta fonte (pedido falhado, sem cobertura ou resposta ilegível). Não deve ser lido como ausência de condicionantes.",
      g_nomes: " Registos: {x}.", g_pct: " Cerca de {p} % da área.",
      ren_sob: "A área sobrepõe-se à Reserva Ecológica Nacional.{t} A REN condiciona usos e acções; algumas são admitidas mediante comunicação prévia ou autorização da CCDR, consoante a tipologia e a acção.",
      ren_prox: "A REN está a cerca de {d} m. Confirme a delimitação em vigor: pequenas diferenças de desenho podem pôr a área dentro.",
      ran_sob: "A área sobrepõe-se à Reserva Agrícola Nacional.{t} As utilizações não agrícolas são apreciadas caso a caso e dependem de parecer prévio da entidade regional da RAN; obras ligadas à actividade agrícola, como reservatórios de rega, podem ser enquadráveis.",
      ran_prox: "A RAN está a cerca de {d} m. Confirme a delimitação em vigor.",
      ah_nd: "O IPR Atlas ainda não tem a cartografia dos aproveitamentos hidroagrícolas. Confirme com a DGADR ou com a associação de beneficiários se o terreno está num perímetro de rega, onde há consultas específicas.",
      crus_sob: "Categoria do PDM: {c}. As regras de cada categoria estão no regulamento do PDM; confirme com a Câmara se a intervenção é compatível.",
      crus_vazio: "Não há qualificação do solo nos dados para este local. Consulte a planta de ordenamento e o regulamento do PDM em vigor.",
      agua_sob: "A área toca uma linha de água cartografada.{t} Deixa de poder ser tratada como intervenção fora de linha de água: leito e margens são, em regra, domínio hídrico e qualquer obra precisa de título da APA.",
      agua_sob_barr: "A retenção fica numa linha de água cartografada.{t} É uma utilização dos recursos hídricos que exige título da APA.",
      agua_margem: "Há uma linha de água cartografada a cerca de {d} m. As águas não navegáveis têm uma margem de 10 m, em regra domínio público hídrico; obras na margem precisam de título da APA.",
      agua_prox: "Há uma linha de água cartografada a cerca de {d} m. Confirme no terreno o leito, a margem de 10 m e por onde a água corre nas chuvadas.",
      agua_ok: "Nenhuma linha de água cartografada a menos de 50 m. A cartografia não inclui todas as linhas de água nem as escorrências: confirme no terreno. Estar fora de linha de água não dispensa a verificação junto da APA.",
      agua_nada_barr: "Não foi encontrada linha de água cartografada a menos de 50 m. Confirme onde fica a retenção: a cartografia não inclui todas as linhas de água.",
      la350_sob: "A área toca ou fica a menos de 10 m de uma linha de água com bacia superior a 350 ha.{t} Linhas de água desta dimensão têm regras mais exigentes e, muitas vezes, zonas inundáveis associadas.",
      la350_prox: "Linha de água com bacia superior a 350 ha a cerca de {d} m.",
      dph_sob: "A imagem do domínio público hídrico mostra sobreposição com a área (leitura indirecta). Obras em domínio hídrico precisam de título da APA.",
      dph_prox: "A imagem do domínio público hídrico mostra traçado a menos de {d} m (leitura indirecta).",
      n2k_sob: "A área está em Rede Natura 2000.{t} Acções como alteração do uso do solo, escavações e aterros podem precisar de parecer do ICNF e, consoante a dimensão, de avaliação de incidências ambientais.",
      n2k_prox: "A Rede Natura 2000 está a cerca de {d} m. Efeitos sobre a área classificada, como alterações de escoamento, podem ter de ser avaliados.",
      rnap_sob: "A área está numa área protegida.{t} O plano de ordenamento ou o regulamento da área protegida pode condicionar a intervenção; o ICNF tem de ser ouvido.",
      rnap_prox: "Há uma área protegida a cerca de {d} m.",
      habitats_sob: "Há habitats cartografados na área.{t} A destruição de habitats protegidos pode exigir parecer do ICNF.",
      habitats_prox: "Há habitats cartografados a cerca de {d} m.",
      albuf_sob: "A área está numa albufeira classificada ou no seu plano de água.{t} Aplica-se o regime de protecção das albufeiras de águas públicas.",
      albuf_prox: "Há uma albufeira protegida a cerca de {d} m. A zona terrestre de protecção vai, em regra, até 500 m do nível de pleno armazenamento e tem regras próprias.",
      capt_sob: "A área está num perímetro de protecção de uma captação de água para abastecimento público.{t} Conforme a zona (imediata, intermédia ou alargada), há actividades condicionadas.",
      capt_prox: "Há um perímetro de protecção de captação a cerca de {d} m.",
      inund_sob: "A área está em zona inundável ou de risco de inundação.{t} Aterros, escavações e construções são restringidos e a obra pode agravar o risco a jusante.",
      inund_prox: "Há zona inundável a cerca de {d} m.",
      zadj_sob: "A área está numa zona adjacente publicada em Diário da República.{t} Nestas zonas há usos interditos ou sujeitos a parecer da APA.",
      zadj_prox: "Há uma zona adjacente a cerca de {d} m.",
      relevo_ok: "Declive médio modelado de {m} % ({p15} % da área acima de 15 %). Relevo compatível com o tipo de intervenção.",
      relevo_med: "Declive médio modelado de {m} % ({p15} % da área acima de 15 %, {p25} % acima de 25 %). Exige taludes cuidados e mais movimento de terras.",
      relevo_forte: "Declive médio modelado de {m} % ({p25} % da área acima de 25 %). Relevo difícil para esta intervenção, com risco de erosão em taludes e aterros.",
      relevo_plano: "Declive médio modelado de {m} %. O terreno é quase plano: valas e pequenas retenções terão pouco efeito de condução da água.",
      esc_ok: "A modelação do relevo não mostra escorrência concentrada na área (área drenante até cerca de {a} ha).",
      esc_conc: "A modelação do relevo mostra escorrência concentrada na área (área drenante até cerca de {a} ha): pode haver uma linha de água não cartografada. Confirme no terreno.",
      esc_barr: "Área drenante modelada até cerca de {a} ha no ponto mais baixo da área (indicativa; pode estar subestimada se a bacia sair do recorte calculado).",
      esc_barr_pouca: "A área drenante modelada é pequena (cerca de {a} ha): a retenção pode encher pouco. Confirme a bacia no terreno.",
      esc_charca_pouca: "A área que drena para a charca é pequena (cerca de {a} ha, modelado): só com escorrência, o enchimento pode ser fraco.",
      arv_sob: "Há uma árvore de interesse público a cerca de {d} m.{t} As árvores classificadas têm uma zona geral de protecção de 50 m; intervenções nessa zona precisam de autorização do ICNF.",
      arv_prox: "Há uma árvore de interesse público a cerca de {d} m. Confirme a zona de protecção.",
      cos_mont: "A ocupação do solo indica sobreiro ou azinheira na área ({c}). O corte, o arranque e as mobilizações que danifiquem estas árvores precisam de autorização do ICNF.",
      cos_ok: "A ocupação do solo não indica sobreiro nem azinheira (classe principal: {c}). Árvores isoladas podem não estar cartografadas.",
      ic_sob: "A imagem do património classificado mostra sobreposição (leitura indirecta). Obras em zonas de protecção precisam de parecer do Património Cultural, I.P.",
      ic_prox: "A imagem do património classificado mostra uma zona a menos de {d} m (leitura indirecta). A zona geral de protecção é de 50 m.",
      rede_sob: "A área toca {n}.{t} Há uma faixa de servidão a respeitar; confirme com o gestor.",
      rede_prox: "{n} a cerca de {d} m. Confirme a largura da faixa de servidão com o gestor.",
      perig_alta: "Perigosidade estrutural de incêndio {c} em parte da área. Há regras para edificação e para gestão de combustível; uma reserva de água pode ser útil para defesa contra incêndios, a combinar com a Câmara e o ICNF.",
      perig_ok: "Perigosidade estrutural de incêndio predominante {c}.",
      i_charca: "Mesmo fora de linha de água, a escavação, o armazenamento e a origem da água podem estar sujeitos a título de utilização dos recursos hídricos (APA) e a controlo prévio municipal. Estar fora de linha de água não dispensa nenhuma destas verificações.",
      i_barragem: "Retenção numa linha de água: utilização dos recursos hídricos sujeita a título da APA, com procedimento próprio para infra-estruturas hidráulicas. A partir de certas dimensões aplica-se também o regime de segurança de barragens.",
      i_valas: "Valas e pequenas retenções mudam o escoamento. Se tocarem linhas de água ou margens, a APA tem de ser ouvida; a Câmara pode exigir controlo prévio para os movimentos de terra.",
      i_modulacao: "Escavações e aterros dependem de controlo prévio municipal conforme a área, a altura e o volume. Em leitos, margens e zonas inundáveis há procedimento específico da APA para aterros e escavações.",
      i_limpeza: "Se a estrutura não tiver título, ou se a recuperação mudar as dimensões, pode ser preciso regularizar junto da APA e da Câmara. A limpeza de leitos e margens precisa de comunicação ou autorização da APA.",
      i_sub: "Água de furo ou poço: a captação de águas subterrâneas precisa de título da APA (comunicação ou licença, conforme a potência e o volume).",
      i_sup: "Água de linha de água ou nascente: a captação de águas superficiais precisa de título da APA.",
      i_rede: "Água da rede pública: confirme com a entidade gestora se o uso é permitido.",
      i_vol: "Os valores indicados não batem certo: o volume armazenado ({v} m³) é maior do que a área vezes a profundidade ({c} m³). Reveja as respostas.",
      // aptidão
      af_sem: "Sem relevo calculado, não é possível ler a aptidão física.",
      af_inund: "Zona inundável na área: risco para a obra e para quem está a jusante.",
      af_decl: "Declive médio modelado de {m} %.", af_agua: "Linha de água ou escorrência concentrada na área.",
      af_semAgua: "Sem linha de água nem escorrência concentrada para alimentar a retenção.", af_bacia: "Área drenante modelada de cerca de {a} ha.",
      ac_rel: "{n} condicionantes relevantes.", ac_ver: "{n} pontos a verificar.", ac_rel1: "Uma condicionante relevante.", ac_ver1: "Um ponto a verificar.", ac_tipo: "O tipo de intervenção tem procedimento próprio.", ac_dim: "Dimensão significativa (altura, volume ou área).",
      ac_nd: "Fontes principais sem resposta: {x}.", ac_dimFalta: "Faltam dimensões para avaliar o enquadramento.",
      // entidades
      en_camara: "Câmara Municipal (urbanismo e PDM)", en_apa: "APA / Administração da Região Hidrográfica (ARH)", en_ccdr: "CCDR (Reserva Ecológica Nacional)",
      en_dgadr: "DGADR / entidade regional da RAN", en_icnf: "ICNF (conservação da natureza e florestas)", en_patrimonio: "Património Cultural, I.P.",
      en_redes: "Gestores de redes e servidões",
      es_apa: "a APA/ARH", es_ccdr: "a CCDR", es_dgadr: "a entidade regional da RAN", es_icnf: "o ICNF", es_patrimonio: "o Património Cultural, I.P.", es_redes: "os gestores das redes",
      // passos
      ps_terreno: "Confirmar no terreno a localização, as linhas de água, as escorrências e as árvores, antes de fixar a solução.",
      ps_camara: "Pedir à Câmara a planta de ordenamento, a planta de condicionantes e o regulamento do PDM em vigor; para mais segurança, um pedido de informação prévia.",
      ps_apa: "Consultar a APA/ARH sobre o título de utilização dos recursos hídricos (plataforma SILiAmb), indicando finalidade, origem da água, dimensões e volumes.",
      ps_ren: "Verificar com a CCDR se a acção é admitida no regime da REN para a tipologia em causa e qual o procedimento.",
      ps_ran: "Pedir parecer à entidade regional da RAN, explicando a ligação da obra à actividade agrícola.",
      ps_icnf: "Consultar o ICNF sobre as áreas classificadas, os habitats ou as árvores protegidas.",
      ps_patrimonio: "Consultar o Património Cultural, I.P. e a carta arqueológica do PDM antes de escavar.",
      ps_redes: "Pedir aos gestores das redes a largura das faixas de servidão.",
      ps_falta: "Completar as respostas em falta e repetir a análise.",
      ps_nd: "Repetir a análise mais tarde ou confirmar directamente com as entidades as fontes que não responderam.",
      ps_cmp: "Comparar com outra localização dentro da propriedade.",
      ps_leitura: "Para uma leitura técnica completa, pedir a Leitura do Terreno à Terracrua Design."
    },
    en: {
      botao: "Preliminary intervention check", titulo: "Preliminary intervention check",
      sub: "Choose what you plan to do, answer what you know and draw the area. The report shows the obstacles, who to consult and what is still unknown.",
      minimizar: "Minimise", restaurar: "Open", fechar: "Close", arrastar: "Drag the panel",
      p1: "Type", p2: "Questions", p3: "Area", p4: "Report", pcmp: "Compare",
      seguinte: "Next", voltar: "Back", analisar: "Check the area", reanalisar: "Check again",
      tipoQ: "What do you plan to do?",
      t_charca: "Excavated pond, away from watercourses", td_charca: "A dug pond to store rainwater, runoff, spring or borehole water, away from the bed of a watercourse.",
      t_barragem: "Dam or weir holding water in a watercourse", td_barragem: "A wall or embankment across a watercourse that holds back its flow.",
      t_valas: "Infiltration swales and small retention", td_valas: "Swales on contour, small bunds or basins that slow water down and let it soak into the soil.",
      t_modulacao: "Earthworks and terracing", td_modulacao: "Terraces, cuts, fills and platforms that reshape the ground.",
      t_limpeza: "Cleaning or restoring an existing structure", td_limpeza: "Desilting, repairing or restoring a pond, weir, well or wall that is already there.",
      perguntasQ: "Answer what you know. You may leave «don't know».", naoSei: "Don't know", escolher: "Choose…",
      q_finalidade: "Purpose", q_origem: "Water source", q_area: "Area of the works", q_profundidade: "Maximum depth",
      q_alturaParede: "Height of the wall or embankment", q_volEsc: "Approximate volume excavated", q_volArm: "Approximate storage volume",
      q_titulo: "Does the existing structure hold a permit or licence?",
      qa_area: "If left empty, the drawn area is used.",
      f_rega: "Irrigation", f_animais: "Livestock watering", f_incendio: "Firefighting reserve", f_biodiv: "Biodiversity and landscape",
      f_recarga: "Infiltration and aquifer recharge", f_erosao: "Erosion and runoff control", f_acesso: "Access, platform or building", f_outra: "Other",
      o_escorrencia: "Rain runoff on the plot itself", o_linha: "Watercourse (diversion or retention)", o_nascente: "Spring", o_subterranea: "Borehole or well",
      o_rede: "Mains supply", o_na: "Not applicable",
      s_sim: "Yes", s_nao: "No",
      areaQ: "Where are the works?", desenhar: "Draw on the map", usarTerreno: "Use the active plot", limpar: "Clear the area",
      desenhoH: "Click the corners of the area. Finish on the first point, with a double click or with «Finish».",
      terminar: "Finish", desfazer: "Undo point", cancelar: "Cancel", pontos: "{n} points",
      semArea: "No area drawn yet.", areaDes: "Drawn area: {a}", semTerreno: "There is no active plot at the moment. Draw the area on the map.",
      aConsultar: "Querying {n} sources…", consultadas: "{i} of {n} sources",
      e_menos: "Fewer constraints identified", e_verificacao: "Needs checking", e_relevantes: "Significant constraints", e_insuficiente: "Insufficient information",
      ed_menos: "The sources that answered show no significant overlaps. This is not an exemption from permits: always confirm with the authorities.",
      ed_verificacao: "Some points need to be confirmed before going ahead.",
      ed_relevantes: "There are constraints that weigh on the decision and require consulting the authorities.",
      ed_insuficiente: "Data or answers are missing, so no conclusion can be drawn. Missing data does not mean there are no constraints.",
      n_rel: "Significant constraint", n_ver: "Needs checking", n_ok: "No overlap in this source", n_nd: "No data", n_info: "Note",
      fisica: "Physical suitability", fisicaD: "Whether the land suits this kind of work (terrain, water, flooding).",
      admin: "Expected administrative complexity", adminD: "How many consultations and procedures to expect.",
      a_favoravel: "Favourable", a_condicionada: "Constrained", a_desfavoravel: "Unfavourable", a_indeterminada: "Undetermined",
      c_menor: "Lower", c_media: "Moderate", c_elevada: "High", c_indeterminada: "Undetermined",
      cNota: "An expected reading based on public data. It does not replace consulting the authorities.",
      indicacoes: "Findings", razao: "Reason", fonte: "Source", dataAct: "Last update", consultado: "Queried on {d}", modelado: "modelled",
      entidades: "Authorities to consult", falta: "Missing information", passos: "Next steps", porque: "for: {x}",
      aviso: "This preliminary check is an aid to reading the land. It does not replace legal advice, checking the plan in force or confirmation on site. What is published in the Diário da República (Portugal's official gazette) prevails.",
      fecharFicha: "Close the report",
      guardar: "Save to compare", guardado: "Saved as site {l}", cheio: "Three sites are already saved. Remove one to save another.",
      copiar: "Copy text", copiado: "Text copied.", json: "Download JSON", html: "Download HTML",
      r_ident: "We identified {x}.", r_nada: "The sources that answered show no significant overlaps, which does not remove the need to confirm with the authorities.",
      r_conf: "The municipal planning position needs to be confirmed", r_consultar: " and {x} should be consulted", r_falta: "Still missing: {x}.", r_nd: "Could not query: {x}.", r_ndN: "{n} of the {t} sources could not be queried, including {x}.",
      r_fim: "See the layers, sources and next steps.",
      e_: " and ", virg: ", ",
      cmpT: "Compare sites within the property", cmpVazio: "Save the check for two or three locations to see them side by side.",
      cmpRetirar: "Remove", cmpLocal: "Site {l}", cmpEstado: "Status", cmpArea: "Area", cmpDecl: "Mean slope (modelled)",
      cmpEnt: "Authorities", cmpFalta: "Missing", cmpVer: "See report", cmpNovo: "Check another site",
      trancT: "The full report is part of Intelligence", trancH: "In Explorer you can choose the type of works and answer the questions. The overlay with REN, RAN, PDM, watercourses, Natura 2000, water abstractions and easements, and the explained report, are unlocked with Intelligence.",
      trancB: "See Intelligence", trancFalta: "From what you have entered, still unknown:", tranc: "Intelligence",
      erroGeo: "The area needs at least three points.", erroMapa: "The map is not ready yet.",
      fn_ren: "REN (ecological reserve)", fn_ran: "RAN (agricultural reserve)", fn_ah: "Irrigation districts", fn_crus: "PDM · land classification", fn_agua: "Mapped watercourses",
      fn_la350: "Watercourses with catchment > 350 ha", fn_dph: "Public water domain", fn_n2k: "Natura 2000", fn_rnap: "Protected areas", fn_habitats: "Mapped habitats",
      fn_albuf: "Classified reservoirs", fn_albpub: "Public water reservoirs", fn_capt: "Water abstraction protection zones", fn_aquif: "Public supply groundwater abstractions (SRUP)",
      fn_inund: "Flood zones", fn_zadj: "Adjacent zones", fn_relevo: "Slopes and erosion", fn_escorr: "Runoff and modelled watercourses",
      fn_arv: "Trees of public interest", fn_cos: "Cork oak and holm oak (land cover)", fn_ic: "Listed heritage", fn_eletr: "Power lines",
      fn_viaria: "National road network", fn_ferro: "Railway network", fn_go: "Gas and oil pipelines", fn_marcos: "Survey markers", fn_aero: "Aviation easements",
      fn_defesa: "National defence", fn_perig: "Wildfire hazard", fn_tipo: "Type of works", fn_origem: "Water source", fn_valores: "Figures entered",
      fr_ren: "overlaps with REN", fr_ren_p: "proximity to REN", fr_ran: "overlaps with RAN", fr_agua: "interference with a watercourse", fr_agua_p: "proximity to a watercourse",
      fr_la350: "proximity to a main watercourse", fr_dph: "overlap with the public water domain", fr_n2k: "overlap with Natura 2000", fr_n2k_p: "proximity to Natura 2000",
      fr_rnap: "overlap with a protected area", fr_rnap_p: "proximity to a protected area", fr_habitats: "mapped habitats", fr_albuf: "proximity to a protected reservoir",
      fr_capt: "a water abstraction protection zone", fr_inund: "a flood zone", fr_inund_p: "proximity to a flood zone", fr_zadj: "an adjacent zone", fr_relevo: "slopes that make the works harder (modelled)",
      fr_escorr: "concentrated runoff (modelled)", fr_arv: "a tree of public interest", fr_cos: "possible cork oak or holm oak", fr_ic: "listed heritage",
      fr_redes: "network easement strips", fr_perig: "high wildfire hazard", fr_crus: "a PDM category to be confirmed", fr_barragem: "retention in a watercourse",
      g_ok: "No overlap or proximity (within {b} m) found in this source.", g_ok0: "No overlap found in this source.",
      g_okImg: "Nothing visible on the service image within {b} m. This is an indirect reading: confirm at the source.",
      g_nd: "No data could be obtained from this source (request failed, no coverage or unreadable reply). It must not be read as an absence of constraints.",
      g_nomes: " Records: {x}.", g_pct: " About {p} % of the area.",
      ren_sob: "The area overlaps the National Ecological Reserve (REN).{t} REN restricts uses and works; some are allowed after prior notice to, or authorisation from, the CCDR, depending on the category and the work.",
      ren_prox: "REN lies about {d} m away. Check the boundary in force: small drawing differences may put the area inside.",
      ran_sob: "The area overlaps the National Agricultural Reserve (RAN).{t} Non-agricultural uses are assessed case by case and need the prior opinion of the regional RAN body; works linked to farming, such as irrigation reservoirs, may qualify.",
      ran_prox: "RAN lies about {d} m away. Check the boundary in force.",
      ah_nd: "IPR Atlas does not yet hold the map of public irrigation districts. Check with DGADR or the irrigation association whether the land lies in one, as specific consultations apply.",
      crus_sob: "PDM category: {c}. The rules for each category are in the PDM regulations; check with the municipality whether the works are compatible.",
      crus_vazio: "There is no land classification in the data for this site. Check the zoning plan and the PDM regulations in force.",
      agua_sob: "The area touches a mapped watercourse.{t} It can no longer be treated as works away from watercourses: bed and banks are, as a rule, public water domain and any works need an APA permit.",
      agua_sob_barr: "The retention lies on a mapped watercourse.{t} This is a use of water resources that requires an APA permit.",
      agua_margem: "There is a mapped watercourse about {d} m away. Non-navigable waters have a 10 m bank strip, as a rule public water domain; works on it need an APA permit.",
      agua_prox: "There is a mapped watercourse about {d} m away. Check on site the bed, the 10 m bank strip and where water runs in heavy rain.",
      agua_ok: "No mapped watercourse within 50 m. The map does not include every watercourse or runoff path: check on site. Being away from a watercourse does not remove the need to check with APA.",
      agua_nada_barr: "No mapped watercourse was found within 50 m. Check where the retention would be: the map does not include every watercourse.",
      la350_sob: "The area touches, or lies within 10 m of, a watercourse with a catchment over 350 ha.{t} Watercourses of this size have stricter rules and often associated flood zones.",
      la350_prox: "Watercourse with a catchment over 350 ha about {d} m away.",
      dph_sob: "The public water domain image shows an overlap with the area (indirect reading). Works in the water domain need an APA permit.",
      dph_prox: "The public water domain image shows a line within {d} m (indirect reading).",
      n2k_sob: "The area is in Natura 2000.{t} Works such as land-use change, cuts and fills may need an ICNF opinion and, depending on size, an appropriate assessment.",
      n2k_prox: "Natura 2000 lies about {d} m away. Effects on the protected site, such as changes in runoff, may need to be assessed.",
      rnap_sob: "The area is in a protected area.{t} Its management plan or regulations may restrict the works; ICNF must be consulted.",
      rnap_prox: "There is a protected area about {d} m away.",
      habitats_sob: "There are mapped habitats in the area.{t} Destroying protected habitats may require an ICNF opinion.",
      habitats_prox: "There are mapped habitats about {d} m away.",
      albuf_sob: "The area is in a classified reservoir or its water body.{t} The protection rules for public water reservoirs apply.",
      albuf_prox: "There is a protected reservoir about {d} m away. Its land protection zone usually extends 500 m from full supply level and has its own rules.",
      capt_sob: "The area is within the protection zone of a public water supply abstraction.{t} Depending on the zone (immediate, intermediate or extended), some activities are restricted.",
      capt_prox: "There is an abstraction protection zone about {d} m away.",
      inund_sob: "The area is in a flood zone or flood risk area.{t} Fills, cuts and buildings are restricted and the works may increase the risk downstream.",
      inund_prox: "There is a flood zone about {d} m away.",
      zadj_sob: "The area is in an adjacent zone published in the Diário da República.{t} Some uses are banned or need an APA opinion there.",
      zadj_prox: "There is an adjacent zone about {d} m away.",
      relevo_ok: "Modelled mean slope of {m} % ({p15} % of the area above 15 %). The terrain suits this type of works.",
      relevo_med: "Modelled mean slope of {m} % ({p15} % of the area above 15 %, {p25} % above 25 %). Careful batters and more earthmoving are needed.",
      relevo_forte: "Modelled mean slope of {m} % ({p25} % of the area above 25 %). Difficult terrain for these works, with erosion risk on batters and fills.",
      relevo_plano: "Modelled mean slope of {m} %. The ground is nearly flat: swales and small retention will do little to guide the water.",
      esc_ok: "The terrain model shows no concentrated runoff in the area (contributing area up to about {a} ha).",
      esc_conc: "The terrain model shows concentrated runoff in the area (contributing area up to about {a} ha): there may be an unmapped watercourse. Check on site.",
      esc_barr: "Modelled contributing area up to about {a} ha at the lowest point of the area (indicative; it may be underestimated if the catchment extends beyond the modelled window).",
      esc_barr_pouca: "The modelled contributing area is small (about {a} ha): the retention may fill poorly. Check the catchment on site.",
      esc_charca_pouca: "The area draining to the pond is small (about {a} ha, modelled): with runoff alone, filling may be weak.",
      arv_sob: "There is a tree of public interest about {d} m away.{t} Listed trees have a general 50 m protection zone; works within it need ICNF authorisation.",
      arv_prox: "There is a tree of public interest about {d} m away. Check its protection zone.",
      cos_mont: "Land cover indicates cork oak or holm oak in the area ({c}). Felling, uprooting and soil works that damage these trees need ICNF authorisation.",
      cos_ok: "Land cover does not indicate cork oak or holm oak (main class: {c}). Isolated trees may not be mapped.",
      ic_sob: "The listed heritage image shows an overlap (indirect reading). Works in protection zones need the opinion of Património Cultural, I.P.",
      ic_prox: "The listed heritage image shows a zone within {d} m (indirect reading). The general protection zone is 50 m.",
      rede_sob: "The area touches the {n}.{t} There is an easement strip to respect; check with the operator.",
      rede_prox: "{n} about {d} m away. Check the width of the easement strip with the operator.",
      perig_alta: "{c} structural wildfire hazard in part of the area. There are rules for building and for fuel management; a water reserve may help with fire defence, to be agreed with the municipality and ICNF.",
      perig_ok: "Predominant structural wildfire hazard: {c}.",
      i_charca: "Even away from watercourses, the excavation, the storage and the water source may need a water resources permit (APA) and prior municipal control. Being away from a watercourse does not remove any of these checks.",
      i_barragem: "Retention in a watercourse: a use of water resources that needs an APA permit, with its own procedure for hydraulic structures. Above certain dimensions, the dam safety regulations also apply.",
      i_valas: "Swales and small retention change how water flows. If they touch watercourses or banks, APA must be consulted; the municipality may require prior control of the earthworks.",
      i_modulacao: "Cuts and fills depend on prior municipal control according to area, height and volume. In beds, banks and flood zones, APA has a specific procedure for fills and cuts.",
      i_limpeza: "If the structure holds no permit, or if restoring it changes its dimensions, it may have to be regularised with APA and the municipality. Clearing beds and banks needs notice to, or authorisation from, APA.",
      i_sub: "Water from a borehole or well: groundwater abstraction needs an APA permit (notice or licence, depending on pump power and volume).",
      i_sup: "Water from a watercourse or spring: surface water abstraction needs an APA permit.",
      i_rede: "Mains water: check with the water utility whether this use is allowed.",
      i_vol: "The figures do not add up: the storage volume ({v} m³) is larger than area times depth ({c} m³). Please review your answers.",
      af_sem: "Without a terrain model, physical suitability cannot be read.",
      af_inund: "Flood zone in the area: a risk to the works and to those downstream.",
      af_decl: "Modelled mean slope of {m} %.", af_agua: "Watercourse or concentrated runoff in the area.",
      af_semAgua: "No watercourse or concentrated runoff to feed the retention.", af_bacia: "Modelled contributing area of about {a} ha.",
      ac_rel: "{n} significant constraints.", ac_ver: "{n} points to check.", ac_rel1: "One significant constraint.", ac_ver1: "One point to check.", ac_tipo: "This type of works has its own procedure.", ac_dim: "Significant size (height, volume or area).",
      ac_nd: "Main sources without a reply: {x}.", ac_dimFalta: "Dimensions are missing to assess the procedure.",
      en_camara: "Municipality (planning and PDM)", en_apa: "APA / River Basin District Administration (ARH)", en_ccdr: "CCDR (National Ecological Reserve)",
      en_dgadr: "DGADR / regional RAN body", en_icnf: "ICNF (nature conservation and forests)", en_patrimonio: "Património Cultural, I.P. (heritage)",
      en_redes: "Network and easement operators",
      es_apa: "APA/ARH", es_ccdr: "the CCDR", es_dgadr: "the regional RAN body", es_icnf: "ICNF", es_patrimonio: "Património Cultural, I.P.", es_redes: "the network operators",
      ps_terreno: "Check on site the location, watercourses, runoff paths and trees before settling on a design.",
      ps_camara: "Ask the municipality for the zoning plan, the constraints plan and the PDM regulations in force; for more certainty, a prior information request.",
      ps_apa: "Consult APA/ARH on the water resources permit (SILiAmb platform), stating purpose, water source, dimensions and volumes.",
      ps_ren: "Check with the CCDR whether the work is allowed under the REN rules for the category concerned, and which procedure applies.",
      ps_ran: "Ask the regional RAN body for an opinion, explaining how the works relate to farming.",
      ps_icnf: "Consult ICNF about protected sites, habitats or protected trees.",
      ps_patrimonio: "Consult Património Cultural, I.P. and the PDM archaeological map before digging.",
      ps_redes: "Ask the network operators for the width of the easement strips.",
      ps_falta: "Fill in the missing answers and run the check again.",
      ps_nd: "Run the check again later, or confirm directly with the authorities for the sources that did not answer.",
      ps_cmp: "Compare with another location within the property.",
      ps_leitura: "For a full technical reading, order the Land Reading from Terracrua Design."
    }
  };
  function t(l, k, v) {
    var s = (D[l] && D[l][k] != null) ? D[l][k] : (D.pt[k] != null ? D.pt[k] : k);
    if (v) Object.keys(v).forEach(function (x) { s = s.split("{" + x + "}").join(v[x] == null ? "" : v[x]); });
    return s;
  }
  function lista(l, arr) {
    arr = arr.filter(Boolean); if (!arr.length) return ""; if (arr.length === 1) return arr[0];
    return arr.slice(0, -1).join(t(l, "virg")) + t(l, "e_") + arr[arr.length - 1];
  }
  function num(l, n, d) { if (n == null || isNaN(n)) return "–"; try { return Number(n).toLocaleString(l === "en" ? "en-GB" : "pt-PT", { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); } catch (e) { return String(Math.round(n)); } }
  function areaTxt(l, m2) { if (m2 == null) return "–"; return m2 >= 10000 ? num(l, m2 / 10000, 2) + " ha" : num(l, m2) + " m²"; }

  // ───────────────────────────── Tipos, perguntas e fontes ─────────────────────────────
  var TIPOS = ["charca", "barragem", "valas", "modulacao", "limpeza"];
  var FINS = ["rega", "animais", "incendio", "biodiv", "recarga", "erosao", "acesso", "outra"];
  var ORIG = ["escorrencia", "linha", "nascente", "subterranea", "rede", "na"];
  var PERG = { // [chave, tipo de campo, unidade]
    finalidade: ["finalidade", "sel", FINS], origem: ["origem", "sel", ORIG], titulo: ["titulo", "sel", ["sim", "nao"]],
    area: ["area", "num", "m²"], profundidade: ["profundidade", "num", "m"], alturaParede: ["alturaParede", "num", "m"],
    volEsc: ["volEsc", "num", "m³"], volArm: ["volArm", "num", "m³"]
  };
  var POR_TIPO = {
    charca: ["finalidade", "origem", "area", "profundidade", "alturaParede", "volEsc", "volArm"],
    barragem: ["finalidade", "origem", "area", "profundidade", "alturaParede", "volEsc", "volArm"],
    valas: ["finalidade", "origem", "area", "profundidade", "volEsc", "volArm"],
    modulacao: ["finalidade", "area", "profundidade", "alturaParede", "volEsc"],
    limpeza: ["finalidade", "origem", "titulo", "area", "profundidade", "alturaParede", "volArm"]
  };
  var ESSENCIAIS = {
    charca: ["finalidade", "origem", "area", "profundidade", "volArm"],
    barragem: ["finalidade", "alturaParede", "volArm", "area"],
    valas: ["finalidade", "area", "profundidade", "volEsc"],
    modulacao: ["finalidade", "area", "alturaParede", "volEsc"],
    limpeza: ["finalidade", "titulo", "area", "volArm"]
  };
  var AGUA_TIPOS = { charca: 1, barragem: 1, valas: 1, limpeza: 1 };
  // Frases da falta (artigo incluído) para o resumo
  var FALTA_TXT = {
    pt: { finalidade: "a finalidade", origem: "a origem da água", titulo: "se a estrutura tem título", area: "a área", profundidade: "a profundidade", alturaParede: "a altura da parede", volEsc: "o volume de escavação", volArm: "o volume armazenado" },
    en: { finalidade: "the purpose", origem: "the water source", titulo: "whether the structure holds a permit", area: "the area", profundidade: "the depth", alturaParede: "the wall height", volEsc: "the excavation volume", volArm: "the storage volume" }
  };

  // Fontes. q: como se consulta (mvt = DGT OGC API, ags = ArcGIS REST, wmsp = proxy WMS do site, dem = relevo, cos, perig, nenhuma)
  // sobre/prox: nível quando sobrepõe / quando está a menos de prox[0] m. buf: distância de procura. nucleo: sem ela a ficha é insuficiente.
  var FONTES = [
    { id: "ren", q: "mvt", col: "srup_ren_areal", sobre: "rel", prox: [25, "ver"], buf: 50, nucleo: 1, ent: ["ccdr", "camara"], fr: "fr_ren", frp: "fr_ren_p", lei: "adm",
      fonte: "DGT · SNIT/SRUP · REN", act: { pt: "Delimitação municipal publicada no SNIT; a data varia por município.", en: "Municipal boundary published on SNIT; the date varies by municipality." } },
    { id: "ran", q: "mvt", col: "srup_ran", sobre: "rel", prox: [25, "ver"], buf: 50, nucleo: 1, ent: ["dgadr", "camara"], fr: "fr_ran", lei: "adm",
      fonte: "DGT · SNIT/SRUP · RAN", act: { pt: "Delimitação municipal publicada no SNIT; a data varia por município.", en: "Municipal boundary published on SNIT; the date varies by municipality." } },
    { id: "ah", q: "nenhuma", semFonte: 1, ent: ["dgadr"], lei: "adm", fonte: "IPR Atlas (sem cartografia)", act: { pt: "Sem fonte no IPR Atlas.", en: "No source in IPR Atlas." } },
    { id: "crus", q: "mvt", col: "crus", sobre: "ver", buf: 0, nucleo: 1, ent: ["camara"], fr: "fr_crus", lei: "adm",
      fonte: "DGT · CRUS (qualificação do solo dos PDM)", act: { pt: "Versão do PDM publicada no SNIT; confirme a versão em vigor na Câmara.", en: "PDM version published on SNIT; check the version in force with the municipality." } },
    { id: "agua", q: "ags", url: "https://sniambgeoogc.apambiente.pt/getogc/rest/services/SNIAmb/RdHidrografica_GeoCodificada/MapServer", camadas: [0], buf: 50, nucleo: 1, ent: ["apa"], lei: "ambas",
      fonte: "APA · Rede hidrográfica geocodificada (SNIAmb)", act: { pt: "Cartografia de referência da APA.", en: "APA reference mapping." } },
    { id: "la350", q: "ags", url: "https://sniambgeoogc.apambiente.pt/getogc/rest/services/Visualizador/DominioPublicoHidrico/MapServer", camadas: [43], sobre: "rel", prox: [100, "ver"], buf: 100, ent: ["apa"], fr: "fr_la350", lei: "ambas",
      fonte: "APA · Domínio público hídrico (linhas de água com bacia > 350 ha)", act: { pt: "Cartografia de referência da APA.", en: "APA reference mapping." } },
    { id: "dph", q: "wmsp", src: "dph", sobre: "rel", prox: [20, "ver"], buf: 20, ent: ["apa"], fr: "fr_dph", lei: "adm",
      fonte: "DGT · SNIT (domínio público hídrico), pelo servidor do IPR Atlas", act: { pt: "Imagem do serviço oficial no momento da consulta.", en: "Image of the official service at the time of the query." } },
    { id: "n2k", q: "ags", url: "https://sigservices.icnf.pt/server/rest/services/BDG/RN2000/MapServer", camadas: [0, 1], sobre: "rel", prox: [200, "ver"], buf: 200, ent: ["icnf"], fr: "fr_n2k", frp: "fr_n2k_p", lei: "adm",
      fonte: "ICNF · Rede Natura 2000 (ZEC e ZPE)", act: { pt: "Limites oficiais do ICNF.", en: "Official ICNF boundaries." } },
    { id: "rnap", q: "ags", url: "https://sigservices.icnf.pt/server/rest/services/BDG/RNAP/MapServer", camadas: [0], sobre: "rel", prox: [200, "ver"], buf: 200, ent: ["icnf"], fr: "fr_rnap", frp: "fr_rnap_p", lei: "adm",
      fonte: "ICNF · Rede Nacional de Áreas Protegidas", act: { pt: "Limites oficiais do ICNF.", en: "Official ICNF boundaries." } },
    { id: "habitats", q: "ags", url: "https://sigservices.icnf.pt/server/rest/services/BDG/habitats_zec/MapServer", camadas: [0], sobre: "ver", buf: 0, ent: ["icnf"], fr: "fr_habitats", lei: "adm",
      fonte: "ICNF · Habitats em ZEC", act: { pt: "Cartografia de habitats do ICNF.", en: "ICNF habitat mapping." } },
    { id: "albuf", q: "mvt", col: "srup_albufeiras", sobre: "rel", prox: [500, "ver"], buf: 500, ent: ["apa"], fr: "fr_albuf", lei: "adm",
      fonte: "DGT · SNIT/SRUP · albufeiras classificadas", act: { pt: "Publicado no SNIT.", en: "Published on SNIT." } },
    { id: "albpub", q: "ags", url: "https://sniambgeoogc.apambiente.pt/getogc/rest/services/SNIAmb/Albufeiras_AguasPublicas/MapServer", camadas: [0], sobre: "rel", prox: [500, "ver"], buf: 500, ent: ["apa"], fr: "fr_albuf", lei: "adm", rk: "albuf",
      fonte: "APA · Albufeiras de águas públicas", act: { pt: "Cartografia da APA (SNIAmb).", en: "APA mapping (SNIAmb)." } },
    { id: "capt", q: "ags", url: "https://sniambgeoogc.apambiente.pt/getogc/rest/services/SNIAmb/ProtCaptacoes_AgConsHumano/MapServer", camadas: [1, 2, 3, 4, 6, 7], sobre: "rel", prox: [50, "ver"], buf: 50, ent: ["apa"], fr: "fr_capt", lei: "adm",
      fonte: "APA · Perímetros de protecção de captações para consumo humano", act: { pt: "Perímetros aprovados, publicados pela APA.", en: "Approved zones, published by APA." } },
    { id: "aquif", q: "mvt", col: "srup_aquiferos", sobre: "rel", prox: [50, "ver"], buf: 50, ent: ["apa"], fr: "fr_capt", lei: "adm", rk: "capt",
      fonte: "DGT · SNIT/SRUP · captações de abastecimento público", act: { pt: "Publicado no SNIT.", en: "Published on SNIT." } },
    { id: "inund", q: "ags", url: "https://sniambgeoogc.apambiente.pt/getogc/rest/services/SNIAmb/Diretiva200760CE_2c/MapServer", camadas: [1], sobre: "rel", prox: [50, "ver"], buf: 50, ent: ["apa", "camara"], fr: "fr_inund", frp: "fr_inund_p", lei: "ambas",
      fonte: "APA · Zonas inundáveis (Directiva 2007/60/CE, 2.º ciclo)", act: { pt: "Cartografia do 2.º ciclo de gestão dos riscos de inundação.", en: "Second flood risk management cycle mapping." } },
    { id: "zadj", q: "ags", url: "https://sniambgeoogc.apambiente.pt/getogc/rest/services/SNIAmb/ZonasAdjacentes_PubDR/MapServer", camadas: [0], sobre: "rel", prox: [50, "ver"], buf: 50, ent: ["apa", "camara"], fr: "fr_zadj", lei: "ambas",
      fonte: "APA · Zonas adjacentes publicadas em Diário da República", act: { pt: "Conforme a publicação em Diário da República.", en: "As published in the Diário da República." } },
    { id: "relevo", q: "dem", lei: "fis", modelado: 1, fr: "fr_relevo",
      fonte: "Mapterhorn · LiDAR DGT; declives calculados pelo IPR Atlas", act: { pt: "Modelo digital de terreno a cerca de 2 m; resultado modelado.", en: "Digital terrain model at about 2 m; modelled result." } },
    { id: "escorr", q: "dem", lei: "fis", modelado: 1, fr: "fr_escorr", ent: ["apa"],
      fonte: "Mapterhorn · LiDAR DGT; escoamento (D8) calculado pelo IPR Atlas", act: { pt: "Modelado sobre o relevo; não substitui a confirmação no terreno.", en: "Modelled from the terrain; does not replace confirmation on site." } },
    { id: "arv", q: "mvt", col: "srup_arvores_point", sobre: "rel", prox: [100, "ver"], buf: 100, pontoProt: 50, ent: ["icnf"], fr: "fr_arv", lei: "adm",
      fonte: "DGT · SNIT/SRUP · árvores de interesse público", act: { pt: "Publicado no SNIT.", en: "Published on SNIT." } },
    { id: "cos", q: "mvt", col: "cos2023v1", buf: 0, ent: ["icnf"], fr: "fr_cos", lei: "adm",
      fonte: "DGT · Carta de Uso e Ocupação do Solo 2023", act: { pt: "COS 2023.", en: "COS 2023." } },
    { id: "ic", q: "wmsp", src: "srup_ic", sobre: "rel", prox: [50, "ver"], buf: 50, ent: ["patrimonio", "camara"], fr: "fr_ic", lei: "adm",
      fonte: "DGT · SNIT/SRUP · imóveis classificados, pelo servidor do IPR Atlas", act: { pt: "Imagem do serviço oficial no momento da consulta.", en: "Image of the official service at the time of the query." } },
    { id: "eletr", q: "mvt", col: "srup_rede_electrica", sobre: "ver", prox: [50, "ver"], buf: 50, ent: ["redes"], fr: "fr_redes", lei: "adm", rede: 1,
      fonte: "DGT · SNIT/SRUP · rede eléctrica", act: { pt: "Publicado no SNIT.", en: "Published on SNIT." } },
    { id: "viaria", q: "mvt", col: "srup_rede_viaria", sobre: "ver", prox: [50, "ver"], buf: 50, ent: ["redes", "camara"], fr: "fr_redes", lei: "adm", rede: 1,
      fonte: "DGT · SNIT/SRUP · rede rodoviária nacional", act: { pt: "Publicado no SNIT.", en: "Published on SNIT." } },
    { id: "ferro", q: "mvt", col: "srup_rede_ferroviaria", sobre: "ver", prox: [50, "ver"], buf: 50, ent: ["redes"], fr: "fr_redes", lei: "adm", rede: 1,
      fonte: "DGT · SNIT/SRUP · rede ferroviária", act: { pt: "Publicado no SNIT.", en: "Published on SNIT." } },
    { id: "go", q: "wmsp", src: "srup_go", sobre: "ver", prox: [50, "ver"], buf: 50, ent: ["redes"], fr: "fr_redes", lei: "adm", rede: 1,
      fonte: "DGT · SNIT/SRUP · gasodutos e oleodutos, pelo servidor do IPR Atlas", act: { pt: "Imagem do serviço oficial no momento da consulta.", en: "Image of the official service at the time of the query." } },
    { id: "marcos", q: "mvt", col: "srup_marcos_geod", sobre: "ver", prox: [30, "ver"], buf: 30, ent: ["redes"], fr: "fr_redes", lei: "adm", rede: 1,
      fonte: "DGT · SNIT/SRUP · marcos geodésicos", act: { pt: "Publicado no SNIT.", en: "Published on SNIT." } },
    { id: "aero", q: "mvt", col: "srup_aeronautica", sobre: "ver", buf: 0, ent: ["redes"], fr: "fr_redes", lei: "adm", rede: 1,
      fonte: "DGT · SNIT/SRUP · servidões aeronáuticas", act: { pt: "Publicado no SNIT.", en: "Published on SNIT." } },
    { id: "defesa", q: "mvt", col: "srup_defesa_militar", sobre: "ver", buf: 0, ent: ["redes"], fr: "fr_redes", lei: "adm", rede: 1,
      fonte: "DGT · SNIT/SRUP · defesa nacional", act: { pt: "Publicado no SNIT.", en: "Published on SNIT." } },
    { id: "perig", q: "perig", url: "https://sigservices.icnf.pt/server/rest/services/BDG/perigosidade_estrutural/MapServer", ent: ["icnf", "camara"], fr: "fr_perig", lei: "adm",
      fonte: "ICNF · Perigosidade estrutural de incêndio rural 2020–2030", act: { pt: "Carta estrutural 2020–2030.", en: "Structural map 2020–2030." } }
  ];
  var FIDX = {}; FONTES.forEach(function (f) { FIDX[f.id] = f; });
  var PERIG_PT = ["muito baixa", "baixa", "média", "alta", "muito alta"], PERIG_EN = ["Very low", "Low", "Moderate", "High", "Very high"];
  var LIM_DECL = { charca: [8, 15], barragem: [20, 35], valas: [15, 25], modulacao: [15, 25], limpeza: [25, 40] };

  // ───────────────────────────── Núcleo: respostas, regras e classificação ─────────────────────────────
  function vazio(v) { return v == null || v === "" || (typeof v === "number" && isNaN(v)); }
  function faltaRespostas(tipo, resp) {
    resp = resp || {}; var ess = ESSENCIAIS[tipo] || [], falta = [], naoSei = [];
    (POR_TIPO[tipo] || []).forEach(function (k) {
      var v = resp[k];
      if (v === "ns") naoSei.push(k);
      if ((v === "ns" || vazio(v)) && ess.indexOf(k) >= 0) falta.push(k);
    });
    return { falta: falta, naoSei: naoSei, essenciais: ess.length };
  }
  function nr(v) { return (v == null || v === "ns" || v === "") ? null : (isNaN(+v) ? null : +v); }

  // Avalia uma fonte a partir do resultado bruto. Devolve {id, nivel, razao (chave), p (parâmetros)}.
  function avaliar(def, raw, tipo, resp) {
    var it = { id: def.id, nivel: "nd", razao: "g_nd", p: {}, lei: def.lei, modelado: !!def.modelado, img: def.q === "wmsp", ent: (def.ent || []).slice(), fr: null };
    if (def.semFonte) { it.razao = def.id + "_nd"; return it; }
    if (!raw || !raw.ok) return it;
    it.datas = raw.datas || []; it.nomes = raw.nomes || [];
    var tx = raw.nomes && raw.nomes.length ? "{nomes}" : "", rk = def.rk || def.id;
    it.p.t = tx; it.p.pct = raw.pct; it.p.b = def.buf;
    if (def.id === "relevo") {
      if (raw.media == null) return it;
      var L = LIM_DECL[tipo] || [15, 25]; it.p = { m: raw.media, p15: raw.p15, p25: raw.p25 };
      if (tipo === "valas" && raw.media < 1) { it.nivel = "ver"; it.razao = "relevo_plano"; it.fis = "condicionada"; }
      else if (raw.media < L[0]) { it.nivel = "ok"; it.razao = "relevo_ok"; it.fis = "favoravel"; }
      else if (raw.media < L[1]) { it.nivel = "ver"; it.razao = "relevo_med"; it.fis = "condicionada"; it.fr = "fr_relevo"; }
      else { it.nivel = "ver"; it.razao = "relevo_forte"; it.fis = "desfavoravel"; it.fr = "fr_relevo"; }
      return it;
    }
    if (def.id === "escorr") {
      if (raw.maxHa == null) return it;
      var a = raw.maxHa; it.p = { a: a < 10 ? Math.round(a * 10) / 10 : Math.round(a) };
      if (tipo === "barragem") { if (a >= 5) { it.nivel = "ok"; it.razao = "esc_barr"; it.agua = 1; } else { it.nivel = "ver"; it.razao = "esc_barr_pouca"; it.fis = "condicionada"; } }
      else if (a >= 5) { it.nivel = "ver"; it.razao = "esc_conc"; it.fr = "fr_escorr"; it.agua = 1; }
      else if (tipo === "charca" && resp && resp.origem === "escorrencia" && a < 0.5) { it.nivel = "ver"; it.razao = "esc_charca_pouca"; it.fis = "condicionada"; }
      else { it.nivel = "ok"; it.razao = "esc_ok"; }
      return it;
    }
    if (def.id === "perig") {
      if (!raw.maxima) return it;
      it.p = { c: raw.maxima, cp: raw.predominante };
      if (raw.maxima >= 4) { it.nivel = "ver"; it.razao = "perig_alta"; it.fr = "fr_perig"; } else { it.nivel = "ok"; it.razao = "perig_ok"; }
      return it;
    }
    if (def.id === "cos") {
      var cls = raw.nomes || []; it.p = { c: cls.slice(0, 2).join("; ") || "–" };
      if (!cls.length) return it; // sem classe = sem dados
      var mont = cls.filter(function (c) { return /sobreir|azinh/i.test(c); });
      if (mont.length) { it.nivel = "ver"; it.razao = "cos_mont"; it.p.c = mont.slice(0, 2).join("; "); it.fr = "fr_cos"; }
      else { it.nivel = "ok"; it.razao = "cos_ok"; }
      it.nomes = []; return it;
    }
    if (def.id === "crus") {
      // a categoria do PDM é sempre uma nota (a confirmação municipal está em todas as fichas); passa a «verificar» quando a
      // própria categoria indica protecção, risco ou valores naturais e culturais
      if (raw.n > 0) { var cc = (raw.nomes || []).slice(0, 3); it.p.c = cc.join("; ") || "–"; it.nomes = [];
        if (!cc.length || /natur|prote|ecol|cultur|patrim|risco|inund|paisag|recurso|reserva|albufeira|ribeir|lito/i.test(cc.join(" "))) { it.nivel = "ver"; it.fr = "fr_crus"; } else it.nivel = "info";
        it.razao = "crus_sob"; }
      else { it.nivel = "nd"; it.razao = "crus_vazio"; }
      return it;
    }
    if (def.id === "agua") {
      var d = raw.n > 0 ? 0 : raw.dist;
      if (d === 0) { it.nivel = "rel"; it.razao = tipo === "barragem" ? "agua_sob_barr" : "agua_sob"; it.fr = "fr_agua"; it.agua = 1; }
      else if (d != null && d <= 10) { it.nivel = "rel"; it.razao = "agua_margem"; it.p.d = Math.round(d); it.fr = "fr_agua_p"; it.agua = 1; }
      else if (d != null && d <= 50) { it.nivel = "ver"; it.razao = "agua_prox"; it.p.d = Math.round(d); it.fr = "fr_agua_p"; it.agua = tipo === "barragem" ? 1 : 0; }
      else if (tipo === "barragem") { it.nivel = "ver"; it.razao = "agua_nada_barr"; }
      else { it.nivel = "ok"; it.razao = "agua_ok"; }
      return it;
    }
    if (def.id === "arv") {
      if (raw.dist != null && raw.dist <= def.pontoProt) { it.nivel = "rel"; it.razao = "arv_sob"; it.p.d = Math.round(raw.dist); it.fr = "fr_arv"; }
      else if (raw.dist != null && raw.dist <= def.prox[0]) { it.nivel = "ver"; it.razao = "arv_prox"; it.p.d = Math.round(raw.dist); it.fr = "fr_arv"; }
      else { it.nivel = "ok"; it.razao = "g_ok"; }
      return it;
    }
    if (def.rede) {
      it.p.n = "fn_" + def.id; // nome traduzido na apresentação
      if (raw.n > 0) { it.nivel = def.sobre; it.razao = "rede_sob"; it.fr = "fr_redes"; }
      else if (def.prox && raw.dist != null && raw.dist <= def.prox[0]) { it.nivel = def.prox[1]; it.razao = "rede_prox"; it.p.d = Math.round(raw.dist); it.fr = "fr_redes"; }
      else { it.nivel = "ok"; it.razao = def.q === "wmsp" ? "g_okImg" : (def.buf ? "g_ok" : "g_ok0"); }
      return it;
    }
    // genérico
    if (raw.n > 0) { it.nivel = def.sobre || "ver"; it.razao = rk + "_sob"; it.fr = def.fr; if (def.id === "la350") it.agua = 1; if (def.id === "inund" || def.id === "zadj") it.fis = "condicionada"; }
    else if (def.prox && raw.dist != null && raw.dist <= def.prox[0]) { it.nivel = def.prox[1]; it.razao = rk + "_prox"; it.p.d = Math.max(1, Math.round(raw.dist)); it.fr = def.frp || def.fr; }
    else { it.nivel = "ok"; it.razao = def.q === "wmsp" ? "g_okImg" : (def.buf ? "g_ok" : "g_ok0"); }
    return it;
  }

  // Notas que vêm do tipo e das respostas (não dependem dos dados)
  function notasTipo(tipo, resp) {
    var n = []; resp = resp || {};
    n.push({ id: "tipo", nivel: tipo === "barragem" ? "rel" : "info", razao: "i_" + tipo, p: {}, lei: "adm", ent: AGUA_TIPOS[tipo] ? ["apa", "camara"] : ["camara", "apa"], fr: tipo === "barragem" ? "fr_barragem" : null });
    var o = resp.origem;
    if (o === "subterranea") n.push({ id: "origem", nivel: "info", razao: "i_sub", p: {}, lei: "adm", ent: ["apa"] });
    else if (o === "linha" || o === "nascente") n.push({ id: "origem", nivel: "info", razao: "i_sup", p: {}, lei: "adm", ent: ["apa"] });
    else if (o === "rede") n.push({ id: "origem", nivel: "info", razao: "i_rede", p: {}, lei: "adm", ent: [] });
    var A = nr(resp.area), P = nr(resp.profundidade), V = nr(resp.volArm);
    if (A && P && V && V > A * P * 1.1) n.push({ id: "valores", nivel: "info", razao: "i_vol", p: { v: Math.round(V), c: Math.round(A * P) }, lei: "adm", ent: [] });
    return n;
  }

  // Aptidão física para o tipo escolhido
  function aptidao(tipo, I) {
    var r = [], nivel = "indeterminada", rel = I.relevo, esc = I.escorr, inund = (I.inund && I.inund.nivel === "rel") || (I.zadj && I.zadj.nivel === "rel");
    var temRelevo = rel && rel.nivel !== "nd";
    if (temRelevo) { nivel = rel.fis || "favoravel"; r.push(["af_decl", { m: rel.p.m }]); }
    else r.push(["af_sem", {}]);
    var aguaNa = (I.agua && I.agua.agua) || (esc && esc.agua) || (I.la350 && I.la350.agua);
    if (tipo === "barragem") {
      if (esc && esc.nivel !== "nd") r.push(["af_bacia", { a: esc.p.a }]);
      if (aguaNa) r.push(["af_agua", {}]);
      else if ((I.agua && I.agua.nivel !== "nd") && (esc && esc.nivel !== "nd")) { r.push(["af_semAgua", {}]); nivel = pior(nivel, "desfavoravel"); }
      if (esc && esc.fis) nivel = pior(nivel, esc.fis);
    } else {
      if (esc && esc.fis) nivel = pior(nivel, esc.fis);
      if (aguaNa && (tipo === "charca" || tipo === "modulacao")) { r.push(["af_agua", {}]); nivel = pior(nivel, "condicionada"); }
    }
    if (inund) { r.push(["af_inund", {}]); nivel = pior(nivel === "indeterminada" ? "condicionada" : nivel, tipo === "limpeza" ? "condicionada" : "desfavoravel"); }
    if (!temRelevo && nivel !== "desfavoravel" && nivel !== "condicionada") nivel = "indeterminada";
    return { nivel: nivel, razoes: r };
  }
  function pior(a, b) { var o = { indeterminada: -1, favoravel: 0, condicionada: 1, desfavoravel: 2 }; return (o[b] > o[a]) ? b : a; }

  // Classificação completa. entrada: {tipo, resp, brutos:{id:raw}, area_m2}
  function classificar(e) {
    var tipo = e.tipo, resp = e.resp || {}, brutos = e.brutos || {};
    var ahRel = resp.finalidade === "rega" || tipo === "barragem" || tipo === "charca";
    var itens = FONTES.filter(function (f) { return f.id !== "ah" || ahRel; }).map(function (f) { return avaliar(f, brutos[f.id], tipo, resp); });
    var notas = notasTipo(tipo, resp), I = {}; itens.forEach(function (x) { I[x.id] = x; });
    var fr = faltaRespostas(tipo, resp);
    var nRel = 0, nVer = 0, nd = [], coreNd = [], comFonte = 0;
    itens.concat(notas).forEach(function (x) { if (x.nivel === "rel") nRel++; else if (x.nivel === "ver") nVer++; });
    itens.forEach(function (x) { var f = FIDX[x.id]; if (f.semFonte) return; comFonte++; if (x.nivel === "nd") { nd.push(x.id); if (f.nucleo) coreNd.push(x.id); } });
    var semGeo = !e.area_m2 && !e.geometria;
    var estado;
    if (nRel > 0) estado = "relevantes";
    else if (semGeo || coreNd.length || nd.length >= comFonte / 2 || fr.falta.length >= Math.ceil(fr.essenciais / 2)) estado = "insuficiente";
    else if (nVer > 0 || fr.falta.length) estado = "verificacao";
    else estado = "menos";
    // complexidade administrativa previsível (nunca «nenhuma»)
    var adm = itens.concat(notas).filter(function (x) { return x.lei !== "fis"; }), aRel = 0, aVer = 0;
    adm.forEach(function (x) { if (x.nivel === "rel") aRel++; else if (x.nivel === "ver") aVer++; });
    var base = { barragem: 2, modulacao: 1, charca: 1, valas: 0, limpeza: 0 }[tipo] || 0;
    var H = nr(resp.alturaParede), V = nr(resp.volArm), VE = nr(resp.volEsc), A = nr(resp.area) || e.area_m2 || 0;
    var dim = (H != null && H >= 3) || (V != null && V >= 10000) || (VE != null && VE >= 1000) || A >= 10000;
    var cr = []; if (aRel) cr.push([aRel === 1 ? "ac_rel1" : "ac_rel", { n: aRel }]); if (aVer) cr.push([aVer === 1 ? "ac_ver1" : "ac_ver", { n: aVer }]); if (base >= 1) cr.push(["ac_tipo", {}]); if (dim) cr.push(["ac_dim", {}]);
    var dimFalta = fr.falta.filter(function (k) { return /alturaParede|volArm|volEsc|area|profundidade/.test(k); }).length > 0; if (dimFalta) cr.push(["ac_dimFalta", {}]);
    var score = 2 * aRel + aVer + base + (dim ? 1 : 0), cn;
    if (coreNd.length && !aRel) { cn = "indeterminada"; cr.push(["ac_nd", { ids: coreNd }]); }
    else cn = score >= 5 ? "elevada" : score >= 2 ? "media" : "menor";
    if (coreNd.length && aRel) cr.push(["ac_nd", { ids: coreNd }]);
    // entidades
    var ents = {}, ordem = ["camara", "apa", "ccdr", "dgadr", "icnf", "patrimonio", "redes"];
    function junta(k, porque) { if (!ents[k]) ents[k] = []; if (porque && ents[k].indexOf(porque) < 0) ents[k].push(porque); }
    junta("camara", "crus"); if (AGUA_TIPOS[tipo]) junta("apa", "tipo");
    itens.concat(notas).forEach(function (x) { if (x.nivel === "rel" || x.nivel === "ver" || (x.nivel === "info" && x.id !== "tipo") || (x.nivel === "nd" && FIDX[x.id] && (FIDX[x.id].semFonte || FIDX[x.id].nucleo))) (x.ent || []).forEach(function (k) { junta(k, x.id); }); });
    var entidades = ordem.filter(function (k) { return ents[k]; }).map(function (k) { return { id: k, porque: ents[k] }; });
    // próximos passos
    var tem = function (id) { var x = I[id]; return x && (x.nivel === "rel" || x.nivel === "ver"); };
    var passos = ["ps_terreno", "ps_camara"];
    if (ents.apa) passos.push("ps_apa");
    if (tem("ren")) passos.push("ps_ren");
    if (tem("ran")) passos.push("ps_ran");
    if (["n2k", "rnap", "habitats", "arv", "cos"].some(tem)) passos.push("ps_icnf");
    if (tem("ic") || tipo === "modulacao" || tipo === "barragem" || tipo === "charca") passos.push("ps_patrimonio");
    if (["eletr", "viaria", "ferro", "go", "marcos", "aero", "defesa"].some(tem)) passos.push("ps_redes");
    if (fr.falta.length) passos.push("ps_falta");
    if (nd.length) passos.push("ps_nd");
    passos.push("ps_cmp", "ps_leitura");
    return {
      tipo: tipo, resp: resp, estado: estado, itens: itens, notas: notas, fisica: aptidao(tipo, I), admin: { nivel: cn, razoes: cr },
      entidades: entidades, falta: fr.falta, naoSei: fr.naoSei, nd: nd, coreNd: coreNd, passos: passos, contagem: { rel: nRel, ver: nVer, nd: nd.length }
    };
  }

  // Textos de uma ficha numa língua
  function razaoTxt(l, x) {
    var p = {}; Object.keys(x.p || {}).forEach(function (k) { p[k] = x.p[k]; });
    if (p.d != null) p.d = num(l, p.d); if (p.m != null) p.m = num(l, p.m, 1); if (p.p15 != null) p.p15 = num(l, p.p15); if (p.p25 != null) p.p25 = num(l, p.p25); if (p.a != null) p.a = num(l, p.a, p.a < 10 ? 1 : 0);
    if (x.id === "perig" && p.c) { var c = x.razao === "perig_ok" ? (p.cp || p.c) : p.c; p.c = l === "en" ? PERIG_EN[c - 1] : PERIG_PT[c - 1]; }
    if (x.id === "valores") { p.v = num(l, p.v); p.c = num(l, p.c); }
    if (p.n && /^fn_/.test(p.n)) p.n = t(l, p.n);
    var nomes = (x.nomes || []).filter(Boolean).slice(0, 3);
    p.t = (p.t && nomes.length) ? t(l, "g_nomes", { x: nomes.join("; ") }) : "";
    if (x.p && x.p.pct != null && x.p.pct > 0 && (x.nivel === "rel" || x.nivel === "ver") && x.p.pct < 99.5) p.t += t(l, "g_pct", { p: num(l, Math.max(1, Math.round(x.p.pct))) });
    var s = t(l, x.razao, p);
    return s;
  }
  function nomeFonte(l, id) { return t(l, "fn_" + id); }
  function textos(f, l, meta) {
    meta = meta || {};
    var itens = f.notas.concat(f.itens), ordemN = { rel: 0, ver: 1, info: 2, nd: 3, ok: 4 };
    itens = itens.slice().sort(function (a, b) { return ordemN[a.nivel] - ordemN[b.nivel]; });
    var frases = [], vistos = {};
    itens.forEach(function (x) { if ((x.nivel === "rel" || x.nivel === "ver") && x.fr && !vistos[x.fr]) { vistos[x.fr] = 1; frases.push(t(l, x.fr)); } });
    var entN = f.entidades.filter(function (e) { return e.id !== "camara"; }).map(function (e) { return t(l, "es_" + e.id); });
    var fal = f.falta.map(function (k) { return FALTA_TXT[l === "en" ? "en" : "pt"][k]; });
    var resumo = [t(l, "titulo") + "."];
    resumo.push(frases.length ? t(l, "r_ident", { x: lista(l, frases.slice(0, 5)) }) : (f.estado === "insuficiente" ? "" : t(l, "r_nada")));
    resumo.push(t(l, "r_conf") + (entN.length ? t(l, "r_consultar", { x: lista(l, entN) }) : "") + ".");
    if (fal.length) resumo.push(t(l, "r_falta", { x: lista(l, fal) }));
    if (f.nd.length > 5) { var ndO = f.coreNd.concat(f.nd.filter(function (id) { return f.coreNd.indexOf(id) < 0; })); resumo.push(t(l, "r_ndN", { n: f.nd.length, t: f.itens.filter(function (x) { return !(FIDX[x.id] || {}).semFonte; }).length, x: lista(l, ndO.slice(0, 4).map(function (id) { return nomeFonte(l, id); })) })); }
    else if (f.nd.length) resumo.push(t(l, "r_nd", { x: lista(l, f.nd.map(function (id) { return nomeFonte(l, id); })) }));
    resumo.push(t(l, "r_fim"));
    var dataC = meta.data ? fmtData(l, meta.data) : "";
    return {
      titulo: t(l, "titulo"), tipo: t(l, "t_" + f.tipo), estado: t(l, "e_" + f.estado), estadoD: t(l, "ed_" + f.estado),
      resumo: resumo.filter(Boolean).join(" "),
      fisica: { nome: t(l, "a_" + f.fisica.nivel), razoes: f.fisica.razoes.map(function (r) { return t(l, r[0], fmtP(l, r[1])); }) },
      admin: { nome: t(l, "c_" + f.admin.nivel), razoes: f.admin.razoes.map(function (r) { var p = fmtP(l, r[1]); if (r[1].ids) p.x = lista(l, r[1].ids.map(function (id) { return nomeFonte(l, id); })); return t(l, r[0], p); }) },
      itens: itens.map(function (x) {
        var def = FIDX[x.id] || {};
        var act = def.act ? def.act[l === "en" ? "en" : "pt"] : "";
        if (x.datas && x.datas.length) act = x.datas.join("; ") + (act ? " · " + act : "");
        return { id: x.id, nivel: x.nivel, nivelNome: t(l, "n_" + x.nivel), nome: nomeFonte(l, x.id), razao: razaoTxt(l, x), fonte: def.fonte || (x.id === "tipo" || x.id === "origem" || x.id === "valores" ? (l === "en" ? "Your answers" : "As suas respostas") : ""), act: act, consultado: dataC, modelado: !!x.modelado };
      }),
      entidades: f.entidades.map(function (e) { return { nome: t(l, "en_" + e.id), porque: lista(l, e.porque.map(function (id) { return nomeFonte(l, id); }).filter(function (s, i, a) { return a.indexOf(s) === i; }).slice(0, 4)) }; }),
      falta: f.falta.map(function (k) { return t(l, "q_" + k); }).concat(f.nd.map(function (id) { return nomeFonte(l, id) + " (" + t(l, "n_nd").toLowerCase() + ")"; })).concat(f.itens.some(function (x) { return x.id === "ah"; }) ? [nomeFonte(l, "ah") + " (" + t(l, "n_nd").toLowerCase() + ")"] : []).filter(function (s, i, a) { return a.indexOf(s) === i; }),
      passos: f.passos.map(function (k) { return t(l, k); }),
      aviso: t(l, "aviso")
    };
  }
  function fmtP(l, p) { var o = {}; Object.keys(p || {}).forEach(function (k) { o[k] = typeof p[k] === "number" ? num(l, p[k], (k === "m" || (k === "a" && p[k] < 10)) ? 1 : 0) : p[k]; }); return o; }
  function fmtData(l, iso) { try { var d = new Date(iso); return d.toLocaleString(l === "en" ? "en-GB" : "pt-PT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch (e) { return String(iso); } }
  function textoSimples(T, meta) {
    var o = [T.titulo.toUpperCase(), "", T.tipo + (meta && meta.area ? " · " + meta.area : ""), T.estado + ". " + T.estadoD, "", T.resumo, ""];
    o.push((meta && meta.l === "en" ? "Physical suitability: " : "Aptidão física: ") + T.fisica.nome + ". " + T.fisica.razoes.join(" "));
    o.push((meta && meta.l === "en" ? "Expected administrative complexity: " : "Complexidade administrativa previsível: ") + T.admin.nome + ". " + T.admin.razoes.join(" "), "");
    T.itens.forEach(function (x) { o.push("- " + x.nome + " [" + x.nivelNome + (x.modelado ? ", " + (meta && meta.l === "en" ? "modelled" : "modelado") : "") + "]: " + x.razao + (x.fonte ? " (" + x.fonte + (x.act ? "; " + x.act : "") + ")" : "")); });
    o.push("", (meta && meta.l === "en" ? "Authorities to consult:" : "Entidades a consultar:")); T.entidades.forEach(function (e) { o.push("- " + e.nome + (e.porque ? " (" + e.porque + ")" : "")); });
    if (T.falta.length) { o.push("", (meta && meta.l === "en" ? "Missing information:" : "Informação em falta:")); T.falta.forEach(function (s) { o.push("- " + s); }); }
    o.push("", (meta && meta.l === "en" ? "Next steps:" : "Próximos passos:")); T.passos.forEach(function (s, i) { o.push((i + 1) + ". " + s); });
    o.push("", T.aviso, "", "IPR Atlas · Terracrua Design");
    return o.join("\n");
  }

  var nucleo = { D: D, t: t, TIPOS: TIPOS, POR_TIPO: POR_TIPO, ESSENCIAIS: ESSENCIAIS, FONTES: FONTES, faltaRespostas: faltaRespostas, avaliar: avaliar, notasTipo: notasTipo, aptidao: aptidao, classificar: classificar, textos: textos, textoSimples: textoSimples };
  if (typeof module !== "undefined" && module.exports) module.exports = { nucleo: nucleo };
  if (typeof window === "undefined" || typeof document === "undefined") return;

  // ═════════════════════════════ Parte do browser ═════════════════════════════
  var W = window;
  W.IPR_INTERVENCAO = W.IPR_INTERVENCAO || {};
  W.IPR_INTERVENCAO.nucleo = nucleo;
  W.IPR_INTERVENCAO.ultima = W.IPR_INTERVENCAO.ultima || null;

  function L() { return W.IPR_LINGUA === "en" ? "en" : "pt"; }
  function T(k, v) { return t(L(), k, v); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function mapa() { return W.__ipe && W.__ipe.mapa; }
  function explorer() { return W.IPR_NIVEL === "explorer"; }
  function ler(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function gravar(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  var CAD = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  var IC = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 18c3-1 4-4 9-4s6 3 9 4"/><path d="M12 3v7M9 7l3 3 3-3"/></svg>';

  // ───────────── Geometria ─────────────
  function anelExt(g) {
    if (!g) return null;
    if (g.type === "Feature") g = g.geometry;
    if (g.type === "FeatureCollection") { var best = null, ba = 0; (g.features || []).forEach(function (f) { var r = anelExt(f.geometry); if (r) { var a = areaAnel(r); if (a > ba) { ba = a; best = r; } } }); return best; }
    if (g.type === "Polygon") return g.coordinates[0];
    if (g.type === "MultiPolygon") { var b2 = null, a2 = 0; g.coordinates.forEach(function (p) { var a = areaAnel(p[0]); if (a > a2) { a2 = a; b2 = p[0]; } }); return b2; }
    return null;
  }
  function rad(x) { return x * Math.PI / 180; }
  function areaAnel(r) { var n = r.length, s = 0; if (n < 4) return 0; for (var i = 0; i < n - 1; i++) { var a = r[i], b = r[i + 1]; s += (rad(r[(i + 2) % (n - 1)][0]) - rad(a[0])) * Math.sin(rad(b[1])); } return Math.abs(s * 6378137 * 6378137 / 2); }
  function bboxAnel(r) { var b = [180, 90, -180, -90]; r.forEach(function (p) { b[0] = Math.min(b[0], p[0]); b[1] = Math.min(b[1], p[1]); b[2] = Math.max(b[2], p[0]); b[3] = Math.max(b[3], p[1]); }); return b; }
  function alargar(b, m) { var lat = (b[1] + b[3]) / 2, dy = m / 110540, dx = m / (111320 * Math.cos(rad(lat))); return [b[0] - dx, b[1] - dy, b[2] + dx, b[3] + dy]; }
  function projector(lng0, lat0) { var kx = 111320 * Math.cos(rad(lat0)), ky = 110540; return function (p) { return [(p[0] - lng0) * kx, (p[1] - lat0) * ky]; }; }
  function pip(pt, ring) { var x = pt[0], y = pt[1], dentro = false; for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) { var xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1]; if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) dentro = !dentro; } return dentro; }
  function pipMulti(pt, rings) { var c = false; rings.forEach(function (r) { if (r.length > 2 && pip(pt, r)) c = !c; }); return c; }
  function dSeg(p, a, b) { var dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy, u = l2 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2 : 0; u = Math.max(0, Math.min(1, u)); var x = a[0] + u * dx - p[0], y = a[1] + u * dy - p[1]; return Math.sqrt(x * x + y * y); }
  function cruza(a, b, c, d) { function o(p, q, r) { return (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]); } var d1 = o(c, d, a), d2 = o(c, d, b), d3 = o(a, b, c), d4 = o(a, b, d); return ((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0)); }
  // Distância (m) de um elemento (k: 1 ponto, 2 linha, 3 polígono; partes em metros) ao polígono P (anel em metros). 0 = toca.
  function distancia(feat, P, amostras) {
    var partes = feat.partes, i, j, k;
    for (i = 0; i < partes.length; i++) for (j = 0; j < partes[i].length; j++) if (pip(partes[i][j], P)) return { d: 0, pct: feat.k === 3 ? pctDentro(feat, amostras) : null };
    if (feat.k === 3) { for (k = 0; k < P.length; k++) if (pipMulti(P[k], partes)) return { d: 0, pct: pctDentro(feat, amostras) }; }
    var min = Infinity;
    for (i = 0; i < partes.length; i++) {
      var pr = partes[i];
      if (pr.length === 1) { for (k = 0; k < P.length - 1; k++) min = Math.min(min, dSeg(pr[0], P[k], P[k + 1])); continue; }
      for (j = 0; j < pr.length - 1; j++) for (k = 0; k < P.length - 1; k++) {
        if (cruza(pr[j], pr[j + 1], P[k], P[k + 1])) return { d: 0, pct: feat.k === 3 ? pctDentro(feat, amostras) : null };
        min = Math.min(min, dSeg(pr[j], P[k], P[k + 1]), dSeg(P[k], pr[j], pr[j + 1]));
      }
    }
    return { d: min, pct: null };
  }
  function pctDentro(feat, amostras) { if (!amostras || !amostras.length) return null; var n = 0; amostras.forEach(function (s) { if (pipMulti(s, feat.partes)) n++; }); return 100 * n / amostras.length; }
  function amostrasDe(P) { var b = bboxAnel(P), out = [], N = 18; for (var i = 0; i < N; i++) for (var j = 0; j < N; j++) { var p = [b[0] + (i + .5) / N * (b[2] - b[0]), b[1] + (j + .5) / N * (b[3] - b[1])]; if (pip(p, P)) out.push(p); } if (!out.length) out.push(P[0]); return out; }

  // ───────────── Pedidos ─────────────
  function comTempo(pr, ms) { return Promise.race([pr, new Promise(function (_, rej) { setTimeout(function () { rej(new Error("tempo")); }, ms); })]); }
  function proxPx(u) { return location.origin + "/wp-json/tcd/v1/viz/px?u=" + encodeURIComponent(u); }
  // Pedido directo; se o browser o bloquear (CORS) tenta pelo proxy do site, como o viz.js faz.
  function obter(u, tipo, ms) {
    function ler2(r) { if (!r.ok) throw new Error("HTTP " + r.status); return tipo === "bin" ? r.arrayBuffer() : tipo === "blob" ? r.blob() : r.text().then(function (s) { return JSON.parse(s); }); }
    return comTempo(fetch(u, { credentials: "omit", mode: "cors" }).then(ler2, function (e) {
      return fetch(proxPx(u), { credentials: "same-origin" }).then(ler2);
    }), ms || 20000);
  }
  function gunzip(buf) {
    var b = new Uint8Array(buf);
    if (b[0] === 31 && b[1] === 139 && W.DecompressionStream) return new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer();
    return Promise.resolve(buf);
  }
  function nomesDe(props) {
    var out = []; Object.keys(props || {}).forEach(function (k) {
      if (!/tipolog|categ|design|^classe|^nome|^name|site_name|site_code|^tipo|denomin|^cos23_n4_l|descri/i.test(k)) return;
      var v = props[k]; if (typeof v === "string" && v.trim() && v.length < 140) out.push(v.trim());
    });
    return out;
  }
  function datasDe(props) {
    var out = []; Object.keys(props || {}).forEach(function (k) {
      if (!/data|date|^dt_|public|vigor|versao|edicao/i.test(k)) return; var v = props[k];
      if (typeof v === "number" && v > 1e11) { try { out.push(new Date(v).toISOString().slice(0, 10)); } catch (e) {} }
      else if (typeof v === "string" && /\d{4}/.test(v) && v.length < 40) out.push(v.trim());
    });
    return out;
  }
  function juntar(acc, feats, P, amostras, proj, buf) {
    feats.forEach(function (f) {
      var fm = { k: f.k, partes: f.partes.map(function (r) { return r.map(proj); }) };
      var r = distancia(fm, P, amostras);
      if (r.d > buf && !(r.d === 0)) return;
      if (r.d === 0) { acc.n++; if (r.pct != null) acc.pcts.push({ f: fm }); }
      acc.dist = acc.dist == null ? r.d : Math.min(acc.dist, r.d);
      if (r.d <= Math.max(buf, 0)) { nomesDe(f.props).forEach(function (s) { if (acc.nomes.indexOf(s) < 0) acc.nomes.push(s); }); datasDe(f.props).forEach(function (s) { if (acc.datas.indexOf(s) < 0) acc.datas.push(s); }); }
    });
  }
  function fechar(acc, amostras) {
    var pct = null;
    if (acc.pcts.length && amostras.length) { var n = 0; amostras.forEach(function (s) { if (acc.pcts.some(function (x) { return pipMulti(s, x.f.partes); })) n++; }); pct = 100 * n / amostras.length; }
    return { ok: true, n: acc.n, dist: acc.dist, pct: pct, nomes: acc.nomes.slice(0, 4), datas: acc.datas.slice(0, 2) };
  }
  function novoAcc() { return { n: 0, dist: null, nomes: [], datas: [], pcts: [] }; }
  function lx(x) { return (x + 180) / 360; }
  function ly(y) { var a = rad(y); return (1 - Math.log(Math.tan(a) + 1 / Math.cos(a)) / Math.PI) / 2; }
  function inv(tx, ty, z) { var n = Math.pow(2, z); return [tx / n * 360 - 180, Math.atan(Math.sinh(Math.PI * (1 - 2 * ty / n))) * 180 / Math.PI]; }
  function mosaicos(b, z) { var n = Math.pow(2, z), out = []; for (var x = Math.floor(lx(b[0]) * n); x <= Math.floor(lx(b[2]) * n); x++) for (var y = Math.floor(ly(b[3]) * n); y <= Math.floor(ly(b[1]) * n); y++) out.push([x, y]); return out; }
  // DGT OGC API, mosaicos vectoriais (como o viz.js e o IPRDiag)
  function consultaMvt(def, ctx) {
    var dec = W.IPRDiag && W.IPRDiag.mvtDecode; if (!dec) return Promise.reject(new Error("sem descodificador"));
    var b = alargar(ctx.bb, def.buf || 0), z = 14; while (z > 11 && mosaicos(b, z).length > 6) z--;
    var ts = mosaicos(b, z); if (ts.length > 12) return Promise.reject(new Error("área grande"));
    var acc = novoAcc();
    return Promise.all(ts.map(function (m) {
      var u = "https://ogcapi.dgterritorio.gov.pt/collections/" + def.col + "/tiles/WebMercatorQuad/" + z + "/" + m[1] + "/" + m[0] + "?f=mvt";
      return obter(u, "bin", 20000).then(gunzip).then(function (buf) {
        if (!buf || !buf.byteLength) return;
        var fs = dec(buf).map(function (f) {
          return { k: f.tipo, props: f.props, partes: f.aneis.map(function (r) { return r.map(function (p) { return inv(m[0] + p[0] / f.ext, m[1] + p[1] / f.ext, z); }); }) };
        });
        juntar(acc, fs, ctx.P, ctx.amostras, ctx.proj, def.buf || 0);
      });
    })).then(function () { return fechar(acc, ctx.amostras); });
  }
  function geoParaPartes(g) {
    if (!g) return null; var c = g.coordinates;
    switch (g.type) {
      case "Point": return { k: 1, partes: [[c]] }; case "MultiPoint": return { k: 1, partes: c.map(function (p) { return [p]; }) };
      case "LineString": return { k: 2, partes: [c] }; case "MultiLineString": return { k: 2, partes: c };
      case "Polygon": return { k: 3, partes: c }; case "MultiPolygon": return { k: 3, partes: [].concat.apply([], c) };
    } return null;
  }
  var META = {};
  function metaAgs(url, cam) {
    var k = url + "/" + cam; if (META[k]) return META[k];
    META[k] = obter(url + "/" + cam + "?f=json", "json", 8000).then(function (j) { var e = j && j.editingInfo, v = e && (e.dataLastEditDate || e.lastEditDate); return v ? new Date(v).toISOString().slice(0, 10) : null; }).catch(function () { return null; });
    return META[k];
  }
  // ArcGIS REST: consulta por envelope alargado; a distância e a sobreposição calculam-se aqui
  function consultaAgs(def, ctx) {
    var b = alargar(ctx.bb, def.buf || 0), env = encodeURIComponent(JSON.stringify({ xmin: b[0], ymin: b[1], xmax: b[2], ymax: b[3], spatialReference: { wkid: 4326 } }));
    var acc = novoAcc();
    return Promise.all(def.camadas.map(function (c) {
      var u = def.url + "/" + c + "/query?where=1%3D1&geometry=" + env + "&geometryType=esriGeometryEnvelope&inSR=4326&outSR=4326&spatialRel=esriSpatialRelIntersects&outFields=*&returnGeometry=true&geometryPrecision=6&f=geojson";
      return obter(u, "json", 20000).then(function (j) {
        if (!j || !Array.isArray(j.features)) throw new Error("resposta inválida");
        var fs = j.features.map(function (f) { var g = geoParaPartes(f.geometry); if (!g) return null; g.props = f.properties || {}; return g; }).filter(Boolean);
        juntar(acc, fs, ctx.P, ctx.amostras, ctx.proj, def.buf || 0);
        return metaAgs(def.url, c).then(function (d) { if (d && acc.datas.indexOf(d) < 0) acc.datas.push((L() === "en" ? "data edited " : "dados editados em ") + d); });
      });
    })).then(function () { return fechar(acc, ctx.amostras); });
  }
  // Imagem do proxy WMS do site (/wp-json/tcd/v1/wms/<src>): o proxy só serve GetMap, por isso lê-se a imagem por píxeis.
  function consultaWmsp(def, ctx) {
    var c = ctx.bb, cx = (lx(c[0]) + lx(c[2])) / 2, cy = (ly(c[1]) + ly(c[3])) / 2;
    var bm = alargar(c, (def.buf || 0) + 20), half = Math.max(lx(bm[2]) - lx(bm[0]), ly(bm[1]) - ly(bm[3])) / 2;
    var x0 = cx - half, x1 = cx + half, y0 = cy - half, y1 = cy + half, R = 20037508.342789244;
    var bbox = [(x0 * 2 - 1) * R, (1 - y1 * 2) * R, (x1 * 2 - 1) * R, (1 - y0 * 2) * R].map(function (v) { return v.toFixed(2); }).join(",");
    var u = location.origin + "/wp-json/tcd/v1/wms/" + def.src + "?bbox=" + bbox;
    return comTempo(fetch(u, { credentials: "same-origin" }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      if (!/^image\//.test(r.headers.get("content-type") || "")) throw new Error("não é imagem");
      return r.blob();
    }).then(function (bl) { return createImageBitmap(bl); }).then(function (img) {
      if (!img || img.width < 64 || img.height < 64) throw new Error("imagem pequena (" + (img && img.width) + " px)");
      var w = img.width, h = img.height, cv = document.createElement("canvas"); cv.width = w; cv.height = h;
      var x = cv.getContext("2d", { willReadFrequently: true }); x.drawImage(img, 0, 0);
      var im = x.getImageData(0, 0, w, h).data;
      var mk = document.createElement("canvas"); mk.width = w; mk.height = h; var m = mk.getContext("2d", { willReadFrequently: true });
      var px = function (p) { return [(lx(p[0]) - x0) / (x1 - x0) * w, (ly(p[1]) - y0) / (y1 - y0) * h]; };
      var mpp = (x1 - x0) * 40075016.686 * Math.cos(rad((c[1] + c[3]) / 2)) / w;
      m.beginPath(); ctx.anel.forEach(function (p, i) { var q = px(p); if (i) m.lineTo(q[0], q[1]); else m.moveTo(q[0], q[1]); }); m.closePath();
      m.fillStyle = "#f00"; m.fill(); var dentro = m.getImageData(0, 0, w, h).data;
      m.lineJoin = "round"; m.strokeStyle = "#0f0"; m.lineWidth = Math.max(2, 2 * (def.buf || 0) / mpp); m.stroke(); m.fillStyle = "#f00"; m.fill();
      var anel = m.getImageData(0, 0, w, h).data, nIn = 0, nTot = 0, nAnel = 0;
      for (var i = 0; i < w * h; i++) {
        var a = im[i * 4 + 3] > 40;
        if (dentro[i * 4] > 128) { nTot++; if (a) nIn++; } else if (anel[i * 4 + 1] > 128 && a) nAnel++;
      }
      return { ok: true, n: nIn > 2 ? 1 : 0, dist: nIn > 2 ? 0 : (nAnel > 2 ? (def.buf || 0) : null), pct: nTot ? 100 * nIn / nTot : null, nomes: [], datas: [], img: true };
    }), 20000);
  }
  // Perigosidade estrutural: identify em pontos da área (como a ficha do terreno)
  function consultaPerig(def, ctx) {
    var pts = ctx.amostras.filter(function (_, i) { return i % Math.max(1, Math.floor(ctx.amostras.length / 6)) === 0; }).slice(0, 6).map(ctx.desproj);
    var b = alargar(ctx.bb, 200);
    return Promise.all(pts.map(function (p) {
      var u = def.url + "/identify?geometry=" + p[0].toFixed(6) + "," + p[1].toFixed(6) + "&geometryType=esriGeometryPoint&sr=4326&layers=all&tolerance=0&mapExtent=" + b.join(",") + "&imageDisplay=400,400,96&returnGeometry=false&f=json";
      return obter(u, "json", 15000).then(function (j) { if (!j || !Array.isArray(j.results)) throw new Error("x"); var a = j.results[0], v = a && a.attributes ? parseInt(a.attributes["Raster.Value"] || a.attributes["UniqueValue.Pixel Value"], 10) : NaN; return v >= 1 && v <= 5 ? v : null; }).catch(function () { return null; });
    })).then(function (vs) {
      vs = vs.filter(function (v) { return v != null; }); if (!vs.length) throw new Error("sem valores");
      var c = {}; vs.forEach(function (v) { c[v] = (c[v] || 0) + 1; });
      return { ok: true, maxima: Math.max.apply(null, vs), predominante: +Object.keys(c).sort(function (a, b) { return c[b] - c[a]; })[0] };
    });
  }
  // COS 2023: classes de nível 4 dentro da área (por amostras)
  function consultaCos(def, ctx) {
    var dec = W.IPRDiag && W.IPRDiag.mvtDecode; if (!dec) return Promise.reject(new Error("x"));
    var z = 14; while (z > 11 && mosaicos(ctx.bb, z).length > 6) z--;
    var cont = {}, tot = 0, ts = mosaicos(ctx.bb, z), feats = [];
    return Promise.all(ts.map(function (m) {
      var u = "https://ogcapi.dgterritorio.gov.pt/collections/" + def.col + "/tiles/WebMercatorQuad/" + z + "/" + m[1] + "/" + m[0] + "?f=mvt";
      return obter(u, "bin", 20000).then(gunzip).then(function (buf) {
        if (!buf || !buf.byteLength) return;
        dec(buf).forEach(function (f) { if (f.tipo !== 3) return; feats.push({ props: f.props, partes: f.aneis.map(function (r) { return r.map(function (p) { return ctx.proj(inv(m[0] + p[0] / f.ext, m[1] + p[1] / f.ext, z)); }); }) }); });
      });
    })).then(function () {
      ctx.amostras.forEach(function (s) { for (var i = 0; i < feats.length; i++) if (pipMulti(s, feats[i].partes)) { var p = feats[i].props, l = p.COS23_n4_L || p.cos23_n4_l || p.COS23_n4_C || ""; if (l) { cont[l] = (cont[l] || 0) + 1; tot++; } break; } });
      var cls = Object.keys(cont).sort(function (a, b) { return cont[b] - cont[a]; });
      return { ok: true, n: tot ? 1 : 0, nomes: cls.slice(0, 5), datas: [] };
    });
  }
  // Relevo (DEM terrarium do Mapterhorn, o mesmo da ficha do terreno): declives e escoamento D8. Resultado modelado.
  var DEM_P = null;
  function consultaDem(ctx) {
    if (DEM_P && DEM_P.k === ctx.chave) return DEM_P.p;
    var b = alargar(ctx.bb, 400), z;
    for (z = 15; z >= 10; z--) { var n = Math.pow(2, z); if ((lx(b[2]) - lx(b[0])) * n * 512 <= 700 && (ly(b[1]) - ly(b[3])) * n * 512 <= 700) break; }
    var N = Math.pow(2, z), x0 = lx(b[0]), y0 = ly(b[3]), Wd = Math.max(16, Math.round((lx(b[2]) - x0) * N * 512)), Hd = Math.max(16, Math.round((ly(b[1]) - y0) * N * 512));
    var cv = document.createElement("canvas"); cv.width = Wd; cv.height = Hd; var cx = cv.getContext("2d", { willReadFrequently: true }); cx.imageSmoothingEnabled = false;
    var ts = mosaicos(b, z), ok = 0;
    var p = Promise.all(ts.map(function (m) {
      return comTempo(fetch("https://tiles.mapterhorn.com/" + z + "/" + m[0] + "/" + m[1] + ".webp").then(function (r) { if (!r.ok) throw new Error("x"); return r.blob(); }).then(function (bl) { return createImageBitmap(bl); }), 20000)
        .then(function (img) { if (img.width < 64) return; cx.drawImage(img, Math.round((m[0] / N - x0) * N * 512), Math.round((m[1] / N - y0) * N * 512), 512, 512); ok++; }).catch(function () {});
    })).then(function () {
      if (!ok) throw new Error("sem relevo");
      var d = cx.getImageData(0, 0, Wd, Hd).data, E = new Float32Array(Wd * Hd), V = new Uint8Array(Wd * Hd);
      for (var i = 0; i < Wd * Hd; i++) { if (d[i * 4 + 3] < 255) continue; var e = d[i * 4] * 256 + d[i * 4 + 1] + d[i * 4 + 2] / 256 - 32768; if (e > -500 && e < 3500) { E[i] = e; V[i] = 1; } }
      var latC = (b[1] + b[3]) / 2, pxM = 40075016.686 * Math.cos(rad(latC)) / (N * 512);
      // máscara da área
      var mk = document.createElement("canvas"); mk.width = Wd; mk.height = Hd; var m2 = mk.getContext("2d", { willReadFrequently: true });
      m2.beginPath(); ctx.anel.forEach(function (q, k) { var X = (lx(q[0]) - x0) * N * 512, Y = (ly(q[1]) - y0) * N * 512; if (k) m2.lineTo(X, Y); else m2.moveTo(X, Y); }); m2.closePath(); m2.fillStyle = "#000"; m2.fill();
      var md = m2.getImageData(0, 0, Wd, Hd).data, M = new Uint8Array(Wd * Hd), nM = 0;
      for (i = 0; i < Wd * Hd; i++) if (md[i * 4 + 3] > 127) { M[i] = 1; nM++; }
      if (!nM) { var cxp = Math.floor((lx((ctx.bb[0] + ctx.bb[2]) / 2) - x0) * N * 512), cyp = Math.floor((ly((ctx.bb[1] + ctx.bb[3]) / 2) - y0) * N * 512); if (cxp >= 0 && cyp >= 0 && cxp < Wd && cyp < Hd) { M[cyp * Wd + cxp] = 1; nM = 1; } }
      var s = 0, ns = 0, n15 = 0, n25 = 0, mn = 1e9, mx = -1e9;
      for (var y = 1; y < Hd - 1; y++) for (var x = 1; x < Wd - 1; x++) {
        var k = y * Wd + x; if (!M[k] || !V[k] || !V[k - 1] || !V[k + 1] || !V[k - Wd] || !V[k + Wd]) continue;
        var gx = (E[k + 1] - E[k - 1]) / (2 * pxM), gy = (E[k + Wd] - E[k - Wd]) / (2 * pxM), sl = 100 * Math.sqrt(gx * gx + gy * gy);
        if (sl > 400) continue; s += sl; ns++; if (sl > 15) n15++; if (sl > 25) n25++; if (E[k] < mn) mn = E[k]; if (E[k] > mx) mx = E[k];
      }
      // D8: ordena por cota e acumula para jusante
      var ord = new Uint32Array(Wd * Hd), c2 = 0; for (i = 0; i < Wd * Hd; i++) if (V[i]) ord[c2++] = i;
      ord = ord.subarray(0, c2); var ordA = Array.prototype.slice.call(ord); ordA.sort(function (a, b) { return E[b] - E[a]; });
      var acc = new Float32Array(Wd * Hd), nb = [-Wd - 1, -Wd, -Wd + 1, -1, 1, Wd - 1, Wd, Wd + 1], dist = [1.414, 1, 1.414, 1, 1, 1.414, 1, 1.414];
      for (var q = 0; q < ordA.length; q++) {
        var c = ordA[q], cx2 = c % Wd; acc[c] += 1; var best = -1, bs = 0;
        for (var j = 0; j < 8; j++) { var nn = c + nb[j], nx = nn % Wd; if (nn < 0 || nn >= Wd * Hd || Math.abs(nx - cx2) > 1 || !V[nn]) continue; var dz = (E[c] - E[nn]) / dist[j]; if (dz > bs) { bs = dz; best = nn; } }
        if (best >= 0) acc[best] += acc[c];
      }
      var maxA = 0; for (i = 0; i < Wd * Hd; i++) if (M[i] && acc[i] > maxA) maxA = acc[i];
      var cel = pxM * pxM;
      return { relevo: ns ? { ok: true, media: Math.round(10 * s / ns) / 10, p15: Math.round(100 * n15 / ns), p25: Math.round(100 * n25 / ns), min: Math.round(mn), max: Math.round(mx), res: Math.round(pxM * 10) / 10 } : null,
        escorr: { ok: true, maxHa: maxA * cel / 10000, margem: 400 } };
    });
    DEM_P = { k: ctx.chave, p: p }; return p;
  }

  // ───────────── Estado da ferramenta ─────────────
  var S = { aberto: false, min: false, passo: 1, tipo: null, resp: {}, anel: null, origemGeo: null, desenho: null, ficha: null, prog: null, guardadas: [], vendo: null };
  try { var g0 = JSON.parse(ler("ipr_int_v1") || "null"); if (g0 && Array.isArray(g0.guardadas)) S.guardadas = g0.guardadas.slice(0, 3); if (g0 && g0.tipo) { S.tipo = g0.tipo; S.resp = g0.resp || {}; } } catch (e) {}
  function guardarEstado() { if (W.IPR_INTERVENCAO) W.IPR_INTERVENCAO.guardadas = S.guardadas; gravar("ipr_int_v1", JSON.stringify({ tipo: S.tipo, resp: S.resp, guardadas: S.guardadas })); }

  // ───────────── CSS ─────────────
  function css() {
    if (document.getElementById("ipr-int-css")) return;
    var st = document.createElement("style"); st.id = "ipr-int-css";
    st.textContent =
      "#ipr-int{position:absolute;z-index:40;top:12px;left:12px;width:372px;max-width:calc(100% - 24px);max-height:calc(100% - 24px);display:flex;flex-direction:column;background:var(--p1,#171a13);color:var(--tx,#ebe7d8);border:1px solid var(--ln2,#3b4232);border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.35);font:13px/1.45 Inter,system-ui,sans-serif;overflow:hidden}" +
      "#ipr-int[hidden]{display:none}#ipr-int *{box-sizing:border-box}" +
      "#ipr-int .ii-cab,#ipr-int .ii-passos,#ipr-int .ii-pe{flex:0 0 auto}#ipr-int .ii-cab{display:flex;align-items:center;gap:8px;padding:9px 10px 9px 12px;border-bottom:1px solid var(--ln,#2b3024);cursor:grab;user-select:none;touch-action:none;background:var(--p2,#1d2118)}#ipr-int .ii-cab:active{cursor:grabbing}" +
      "#ipr-int .ii-cab svg{color:var(--ac,#a8b878);flex:0 0 auto}#ipr-int .ii-cab b{font:600 13.5px Raleway,Inter,sans-serif;letter-spacing:.01em;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
      "#ipr-int .ii-ib{border:0;background:transparent;color:var(--mu,#a3a690);cursor:pointer;width:30px;height:30px;border-radius:7px;display:inline-flex;align-items:center;justify-content:center;font:600 15px Inter,sans-serif;flex:0 0 auto}#ipr-int .ii-ib:hover{background:var(--acs,rgba(168,184,120,.16));color:var(--tx,#ebe7d8)}" +
      "#ipr-int.min{max-height:none}#ipr-int.min .ii-corpo,#ipr-int.min .ii-pe,#ipr-int.min .ii-passos{display:none}" +
      "#ipr-int .ii-passos{display:flex;gap:2px;padding:6px 8px;border-bottom:1px solid var(--ln,#2b3024);overflow-x:auto;scrollbar-width:none}" +
      "#ipr-int .ii-passos button{flex:1 0 auto;border:0;background:transparent;color:var(--mu,#a3a690);font:500 11.5px Inter,sans-serif;padding:5px 7px;border-radius:999px;cursor:pointer;white-space:nowrap}#ipr-int .ii-passos button i{font:600 10px 'IBM Plex Mono',monospace;font-style:normal;margin-right:4px;opacity:.8}" +
      "#ipr-int .ii-passos button[aria-current=step]{background:var(--acs,rgba(168,184,120,.16));color:var(--tx,#ebe7d8)}#ipr-int .ii-passos button:disabled{opacity:.4;cursor:default}" +
      "#ipr-int .ii-corpo{overflow:auto;padding:10px 12px 12px;flex:1 1 auto;min-height:0;overscroll-behavior:contain}" +
      "#ipr-int .ii-pe{display:flex;gap:6px;justify-content:space-between;padding:8px 12px;border-top:1px solid var(--ln,#2b3024);background:var(--p2,#1d2118)}" +
      "#ipr-int .ii-sub{margin:0 0 10px;color:var(--mu,#a3a690);font-size:12px}#ipr-int .ii-q{font:600 12.5px Inter,sans-serif;margin:0 0 8px}" +
      "#ipr-int .ii-h{display:block;font:600 10.5px Inter,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--mu,#a3a690);margin:12px 0 6px}" +
      "#ipr-int .ii-tipos{display:flex;flex-direction:column;gap:6px}#ipr-int .ii-tipos button{display:flex;flex-direction:column;align-items:flex-start;gap:2px;text-align:left;padding:8px 10px;border-radius:9px;border:1px solid var(--ln,#2b3024);background:var(--p2,#1d2118);color:var(--tx,#ebe7d8);cursor:pointer;font:500 12.5px Inter,sans-serif}" +
      "#ipr-int .ii-tipos button small{font-size:11.5px;color:var(--mu,#a3a690);font-weight:400;line-height:1.4}#ipr-int .ii-tipos button[aria-checked=true]{border-color:var(--ac,#a8b878);background:var(--acs,rgba(168,184,120,.16))}#ipr-int .ii-tipos button:hover{border-color:var(--ln2,#3b4232)}" +
      "#ipr-int .ii-f{display:grid;grid-template-columns:1fr;gap:3px;margin:0 0 9px}#ipr-int .ii-f label.r{font-size:12px;font-weight:500}#ipr-int .ii-f .ln{display:flex;gap:8px;align-items:center}" +
      "#ipr-int .ii-f select,#ipr-int .ii-f input[type=number]{flex:1 1 0;width:0;min-width:0;height:32px;padding:4px 8px;border-radius:7px;border:1px solid var(--ln2,#3b4232);background:var(--bg,#121410);color:var(--tx,#ebe7d8);font:13px Inter,sans-serif}" +
      "#ipr-int .ii-f .un{font:500 11px 'IBM Plex Mono',monospace;color:var(--mu,#a3a690);min-width:22px}#ipr-int .ii-f .ns{flex:0 0 auto;display:inline-flex;align-items:center;gap:4px;font-size:11.5px;color:var(--mu,#a3a690);white-space:nowrap;cursor:pointer}" +
      "#ipr-int .ii-f .aj{font-size:11px;color:var(--mu2,#737761)}#ipr-int .ii-f input:disabled,#ipr-int .ii-f select:disabled{opacity:.45}" +
      "#ipr-int .ii-b{font:500 12.5px Inter,sans-serif;padding:7px 11px;border-radius:8px;border:1px solid var(--ln2,#3b4232);background:transparent;color:var(--tx,#ebe7d8);cursor:pointer;min-height:34px}#ipr-int .ii-b:hover{border-color:var(--ac,#a8b878)}" +
      "#ipr-int .ii-b.pri{background:var(--ac,#a8b878);border-color:var(--ac,#a8b878);color:#141814;font-weight:600}#ipr-int .ii-b:disabled{opacity:.45;cursor:default}" +
      "#ipr-int .ii-acc{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}" +
      "#ipr-int .ii-nota{font-size:12px;color:var(--mu,#a3a690);margin:6px 0}#ipr-int .ii-area{font:500 12.5px 'IBM Plex Mono',monospace;margin:6px 0}" +
      "#ipr-int .ii-des{padding:8px 10px;border:1px dashed var(--ac,#a8b878);border-radius:9px;margin:8px 0;font-size:12px}" +
      "#ipr-int .ii-prog{height:4px;border-radius:2px;background:var(--ln,#2b3024);overflow:hidden;margin:8px 0}#ipr-int .ii-prog i{display:block;height:100%;background:var(--ac,#a8b878);transition:width .2s}" +
      // ficha
      "#ipr-int .ii-est{display:flex;flex-direction:column;gap:2px;padding:9px 11px;border-radius:9px;border:1px solid var(--c);background:color-mix(in srgb,var(--c) 14%,transparent);margin:0 0 10px}" +
      "#ipr-int .ii-est b{font:600 13.5px Raleway,Inter,sans-serif;color:var(--tx,#ebe7d8)}#ipr-int .ii-est span{font-size:12px;color:var(--tx,#ebe7d8);opacity:.85}#ipr-int .ii-est.insuficiente{border-style:dashed}" +
      "#ipr-int .ii-res{margin:0 0 10px;font-size:13px;line-height:1.55}" +
      "#ipr-int .ii-lt{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:0 0 6px}#ipr-int .ii-lt>div{border:1px solid var(--ln,#2b3024);border-radius:9px;padding:8px 9px;background:var(--p2,#1d2118)}" +
      "#ipr-int .ii-lt small{display:block;font:600 10px Inter,sans-serif;letter-spacing:.05em;text-transform:uppercase;color:var(--mu,#a3a690)}#ipr-int .ii-lt b{display:block;font:600 13px Inter,sans-serif;margin:2px 0 3px}#ipr-int .ii-lt p{margin:0;font-size:11.5px;color:var(--mu,#a3a690);line-height:1.4}" +
      "#ipr-int .ii-cn{font-size:10.5px;color:var(--mu2,#737761);margin:0 0 8px}" +
      "#ipr-int .ii-it{border-left:3px solid var(--c);padding:6px 0 6px 9px;margin:0 0 6px}#ipr-int .ii-it summary{cursor:pointer;display:flex;gap:6px;align-items:baseline;justify-content:space-between;list-style:none}#ipr-int .ii-it summary::-webkit-details-marker{display:none}" +
      "#ipr-int .ii-it summary b{font:600 12.5px Inter,sans-serif}#ipr-int .ii-it summary em{font:500 10.5px Inter,sans-serif;font-style:normal;color:var(--c);white-space:nowrap}#ipr-int .ii-it p{margin:4px 0 0;font-size:12px;line-height:1.45}" +
      "#ipr-int .ii-it .fo{font-size:11px;color:var(--mu,#a3a690)}#ipr-int .ii-it .md{font:600 9.5px 'IBM Plex Mono',monospace;padding:0 4px;border:1px solid currentColor;border-radius:4px;margin-left:4px;color:var(--mu,#a3a690)}" +
      "#ipr-int .ii-grp{margin:0 0 4px}#ipr-int .ii-grp>summary{cursor:pointer;font:600 10.5px Inter,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--mu,#a3a690);padding:4px 0}" +
      "#ipr-int ul.ii-l,#ipr-int ol.ii-l{margin:0;padding-left:18px;font-size:12px}#ipr-int .ii-l li{margin:0 0 4px}#ipr-int .ii-l li small{color:var(--mu,#a3a690)}" +
      "#ipr-int .ii-av{margin:12px 0 0;padding:7px 9px;border-left:3px solid var(--ac2,#cdd6a8);background:var(--p2,#1d2118);font-size:11.5px;line-height:1.45}" +
      "#ipr-int .ii-ok{font-size:11.5px;color:var(--ac,#a8b878);min-height:16px}" +
      // comparação
      "#ipr-int .ii-cmp{overflow-x:auto}#ipr-int .ii-cmp table{border-collapse:collapse;width:100%;font-size:11.5px;min-width:300px}#ipr-int .ii-cmp th,#ipr-int .ii-cmp td{border-bottom:1px solid var(--ln,#2b3024);padding:5px 4px;text-align:left;vertical-align:top}" +
      "#ipr-int .ii-cmp th{font:600 10px Inter,sans-serif;letter-spacing:.04em;text-transform:uppercase;color:var(--mu,#a3a690)}#ipr-int .ii-cmp td i{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--c);margin-right:4px}" +
      "#ipr-int .ii-cmp .lb{display:inline-flex;width:20px;height:20px;border-radius:50%;align-items:center;justify-content:center;background:var(--ac,#a8b878);color:#141814;font:700 11px Inter,sans-serif}" +
      "#ipr-int .ii-tranc{border:1px solid var(--ln2,#3b4232);border-radius:9px;padding:10px;background:var(--p2,#1d2118)}#ipr-int .ii-tranc .ipr-t62-l{padding:0 0 6px}#ipr-int .ii-tranc p{margin:0 0 8px;font-size:12px}" +
      ".ipr-int-mk{width:22px;height:22px;border-radius:50%;background:#e8c547;color:#141814;font:700 12px Inter,sans-serif;display:flex;align-items:center;justify-content:center;border:2px solid #141814;box-shadow:0 1px 4px rgba(0,0,0,.4)}" +
      "#ipr-t62 [data-int62]{border-color:var(--ac,#a8b878)!important;display:inline-flex;align-items:center;gap:5px}#ipr-t62 [data-int62] svg{color:var(--ac,#a8b878)}" +
      "@media (max-width:600px){#ipr-int{left:8px!important;right:8px;top:auto!important;bottom:60px;width:auto;max-width:none;max-height:min(62vh,calc(100% - 76px))}#ipr-int .ii-lt{grid-template-columns:1fr}#ipr-int .ii-cab{cursor:default}}";
    document.head.appendChild(st);
  }
  var COR = { menos: "#7fae5a", verificacao: "#d9a441", relevantes: "#d9534f", insuficiente: "#8f9384", rel: "#d9534f", ver: "#d9a441", ok: "#7fae5a", nd: "#8f9384", info: "#6fa0c8" };

  // ───────────── Painel ─────────────
  var P = null;
  function painel() {
    if (P) return P; css();
    var host = document.getElementById("ipe-mapa") || (mapa() && mapa().getContainer().parentNode) || document.body;
    P = document.createElement("section"); P.id = "ipr-int"; P.setAttribute("role", "dialog"); P.setAttribute("aria-modal", "false"); P.hidden = true;
    host.appendChild(P);
    P.addEventListener("click", aoClicar); P.addEventListener("change", aoMudar); P.addEventListener("input", aoMudar);
    arrastavel(P);
    return P;
  }
  function arrastavel(el) {
    var ini = null;
    el.addEventListener("pointerdown", function (e) {
      var cab = e.target.closest(".ii-cab"); if (!cab || e.target.closest("button") || W.innerWidth <= 600) return;
      var r = el.getBoundingClientRect(), pr = el.parentNode.getBoundingClientRect();
      ini = { x: e.clientX, y: e.clientY, l: r.left - pr.left, t: r.top - pr.top, pw: pr.width, ph: pr.height, w: r.width, h: r.height };
      try { cab.setPointerCapture(e.pointerId); } catch (x) {} e.preventDefault();
    });
    el.addEventListener("pointermove", function (e) {
      if (!ini) return; var l = ini.l + e.clientX - ini.x, tp = ini.t + e.clientY - ini.y;
      l = Math.max(0, Math.min(ini.pw - 60, l)); tp = Math.max(0, Math.min(ini.ph - 40, tp));
      el.style.left = l + "px"; el.style.top = tp + "px";
    });
    function fim() { if (ini) { ini = null; gravar("ipr_int_pos", JSON.stringify({ l: el.style.left, t: el.style.top })); } }
    el.addEventListener("pointerup", fim); el.addEventListener("pointercancel", fim);
  }
  function abrir() {
    painel(); S.aberto = true; S.min = false; P.hidden = false; P.classList.remove("min");
    if (W.innerWidth > 600) { try { var ps = JSON.parse(ler("ipr_int_pos") || "null"); if (ps && ps.l) { P.style.left = ps.l; P.style.top = ps.t; } } catch (e) {} }
    if (W.innerWidth <= 760) { var lb = document.querySelector('#ipe-camadas[aria-pressed="true"]'); if (lb) lb.click(); }
    if (!S.tipo) S.passo = 1; else if (S.ficha) S.passo = 4;
    pintar(); garantirCamadas();
  }
  function fecharPainel() { if (S.desenho) pararDesenho(false); S.aberto = false; if (P) P.hidden = true; }

  function passosHtml() {
    var ps = [[1, "p1"], [2, "p2"], [3, "p3"], [4, "p4"], ["c", "pcmp"]];
    return '<nav class="ii-passos" aria-label="' + esc(T("titulo")) + '">' + ps.map(function (x) {
      var dis = (x[0] === 2 && !S.tipo) || (x[0] === 3 && !S.tipo) || (x[0] === 4 && !S.ficha) || (x[0] === "c" && !S.guardadas.length);
      var lab = x[0] === "c" ? T(x[1]) + (S.guardadas.length ? " (" + S.guardadas.length + ")" : "") : T(x[1]);
      return '<button type="button" data-ii-passo="' + x[0] + '"' + (String(S.passo) === String(x[0]) ? ' aria-current="step"' : "") + (dis ? " disabled" : "") + ">" + (x[0] === "c" ? "" : "<i>" + x[0] + "</i>") + esc(lab) + "</button>";
    }).join("") + "</nav>";
  }
  function pintar() {
    if (!P || P.hidden) return;
    var foco = document.activeElement && P.contains(document.activeElement) ? (document.activeElement.getAttribute("data-ii-k") || document.activeElement.getAttribute("data-ii-passo")) : null;
    var scroll = P.querySelector(".ii-corpo") ? P.querySelector(".ii-corpo").scrollTop : 0;
    P.setAttribute("aria-label", T("titulo")); P.setAttribute("lang", L());
    var h = '<div class="ii-cab" title="' + esc(T("arrastar")) + '">' + IC + "<b>" + esc(T("titulo")) + "</b>" +
      '<button type="button" class="ii-ib" data-ii="min" aria-label="' + esc(T(S.min ? "restaurar" : "minimizar")) + '" title="' + esc(T(S.min ? "restaurar" : "minimizar")) + '">' + (S.min ? "+" : "–") + "</button>" +
      '<button type="button" class="ii-ib" data-ii="fechar" aria-label="' + esc(T("fechar")) + '" title="' + esc(T("fechar")) + '">×</button></div>';
    if (S.desenho) { h += '<div class="ii-corpo">' + desenhoHtml() + "</div>"; P.innerHTML = h; P.classList.toggle("min", false); return; }
    h += passosHtml() + '<div class="ii-corpo">';
    var pe = "";
    if (S.passo === 1) {
      h += '<p class="ii-sub">' + esc(T("sub")) + '</p><p class="ii-q">' + esc(T("tipoQ")) + '</p><div class="ii-tipos" role="radiogroup">' + TIPOS.map(function (k) {
        return '<button type="button" role="radio" data-ii-tipo="' + k + '" aria-checked="' + (S.tipo === k) + '"><span>' + esc(T("t_" + k)) + "</span><small>" + esc(T("td_" + k)) + "</small></button>";
      }).join("") + "</div>";
      pe = '<span></span><button type="button" class="ii-b pri" data-ii-ir="2"' + (S.tipo ? "" : " disabled") + ">" + esc(T("seguinte")) + "</button>";
    } else if (S.passo === 2) {
      h += '<p class="ii-q">' + esc(T("t_" + S.tipo)) + '</p><p class="ii-sub">' + esc(T("perguntasQ")) + "</p>" + POR_TIPO[S.tipo].map(campoHtml).join("");
      pe = '<button type="button" class="ii-b" data-ii-ir="1">' + esc(T("voltar")) + '</button><button type="button" class="ii-b pri" data-ii-ir="3">' + esc(T("seguinte")) + "</button>";
    } else if (S.passo === 3) {
      if (explorer()) h += trancHtml();
      else h += areaHtml();
      pe = '<button type="button" class="ii-b" data-ii-ir="2">' + esc(T("voltar")) + "</button>" + (explorer() ? "<span></span>" : '<button type="button" class="ii-b pri" data-ii="analisar"' + (S.anel && !S.prog ? "" : " disabled") + ">" + esc(T(S.ficha ? "reanalisar" : "analisar")) + "</button>");
    } else if (S.passo === 4) {
      h += S.ficha ? fichaHtml(S.vendo || S.ficha) : "";
      pe = '<button type="button" class="ii-b" data-ii-ir="3">' + esc(T("voltar")) + '</button><button type="button" class="ii-b" data-ii="guardar">' + esc(T("guardar")) + "</button>";
    } else if (S.passo === "c") {
      h += cmpHtml();
      pe = '<button type="button" class="ii-b" data-ii="novo">' + esc(T("cmpNovo")) + "</button><span></span>";
    }
    h += "</div>" + (pe ? '<div class="ii-pe">' + pe + "</div>" : "");
    P.innerHTML = h; P.classList.toggle("min", S.min);
    var c = P.querySelector(".ii-corpo"); if (c) c.scrollTop = scroll;
    if (foco) { var f = P.querySelector('[data-ii-k="' + foco + '"]') || P.querySelector('[data-ii-passo="' + foco + '"]'); if (f) try { f.focus(); } catch (e) {} }
  }
  function campoHtml(k) {
    var d = PERG[k], v = S.resp[k], ns = v === "ns", id = "ii-q-" + k, h = '<div class="ii-f"><label class="r" for="' + id + '">' + esc(T("q_" + k)) + '</label><div class="ln">';
    if (d[1] === "sel") {
      h += '<select id="' + id + '" data-ii-k="' + k + '"' + (ns ? " disabled" : "") + '><option value="">' + esc(T("escolher")) + "</option>" + d[2].map(function (o) {
        var lab = k === "finalidade" ? T("f_" + o) : k === "origem" ? T("o_" + o) : T("s_" + o);
        return '<option value="' + o + '"' + (v === o ? " selected" : "") + ">" + esc(lab) + "</option>";
      }).join("") + "</select>";
    } else {
      h += '<input type="number" inputmode="decimal" min="0" step="any" id="' + id + '" data-ii-k="' + k + '" value="' + (ns || vazio(v) ? "" : esc(v)) + '"' + (ns ? " disabled" : "") + (k === "area" && S.anel ? ' placeholder="' + esc(Math.round(areaAnel(S.anel))) + '"' : "") + '><span class="un">' + d[2] + "</span>";
    }
    h += '<label class="ns"><input type="checkbox" data-ii-ns="' + k + '"' + (ns ? " checked" : "") + "> " + esc(T("naoSei")) + "</label></div>";
    if (k === "area") h += '<span class="aj">' + esc(T("qa_area")) + "</span>";
    return h + "</div>";
  }
  function trancHtml() {
    var fr = faltaRespostas(S.tipo, S.resp);
    var h = '<div class="ii-tranc"><div class="ipr-t62-l tranc" title="' + esc(T("trancT")) + '"><span class="cad">' + CAD + "</span><span><b>" + esc(T("trancT")) + "</b></span><em>" + esc(T("tranc")) + "</em></div><p>" + esc(T("trancH")) + "</p>";
    if (fr.falta.length) h += '<p class="ii-nota">' + esc(T("trancFalta")) + " " + esc(lista(L(), fr.falta.map(function (k) { return FALTA_TXT[L()][k]; }))) + ".</p>";
    h += '<button type="button" class="ii-b pri" data-ii="intel">' + CAD + " " + esc(T("trancB")) + "</button></div>";
    return h;
  }
  function areaHtml() {
    var h = '<p class="ii-q">' + esc(T("areaQ")) + '</p><div class="ii-acc"><button type="button" class="ii-b" data-ii="desenhar">' + esc(T("desenhar")) + '</button><button type="button" class="ii-b" data-ii="terreno">' + esc(T("usarTerreno")) + "</button>" + (S.anel ? '<button type="button" class="ii-b" data-ii="limpar">' + esc(T("limpar")) + "</button>" : "") + "</div>";
    h += '<p class="ii-area">' + esc(S.anel ? T("areaDes", { a: areaTxt(L(), areaAnel(S.anel)) }) : T("semArea")) + "</p>";
    if (S.avisoArea) h += '<p class="ii-nota">' + esc(S.avisoArea) + "</p>";
    if (S.prog) h += '<p class="ii-nota">' + esc(T("aConsultar", { n: S.prog.n })) + " " + esc(T("consultadas", { i: S.prog.i, n: S.prog.n })) + '</p><div class="ii-prog"><i style="width:' + Math.round(100 * S.prog.i / S.prog.n) + '%"></i></div>';
    return h;
  }
  function desenhoHtml() {
    var n = S.desenho.pts.length;
    return '<div class="ii-des"><p style="margin:0 0 6px">' + esc(T("desenhoH")) + '</p><p class="ii-area" style="margin:0">' + esc(T("pontos", { n: n })) + (n >= 3 ? " · " + esc(areaTxt(L(), areaAnel(S.desenho.pts.concat([S.desenho.pts[0]])))) : "") + '</p></div><div class="ii-acc"><button type="button" class="ii-b pri" data-ii="terminar"' + (n >= 3 ? "" : " disabled") + ">" + esc(T("terminar")) + '</button><button type="button" class="ii-b" data-ii="desfazer"' + (n ? "" : " disabled") + ">" + esc(T("desfazer")) + '</button><button type="button" class="ii-b" data-ii="cancelar">' + esc(T("cancelar")) + "</button></div>";
  }
  function fichaHtml(a) {
    var l = L(), Tx = a.textos[l] || textos(a.ficha, l, { data: a.criado }), f = a.ficha;
    var h = '<div class="ii-est ' + f.estado + '" style="--c:' + COR[f.estado] + '"><b>' + esc(Tx.estado) + "</b><span>" + esc(Tx.estadoD) + "</span></div>";
    if (a.rotulo) h += '<p class="ii-nota" style="margin-top:-4px">' + esc(T("cmpLocal", { l: a.rotulo })) + " · " + esc(Tx.tipo) + "</p>"; else h += '<p class="ii-nota" style="margin-top:-4px">' + esc(Tx.tipo) + " · " + esc(areaTxt(l, a.area_m2)) + "</p>";
    h += '<p class="ii-res">' + esc(Tx.resumo) + "</p>";
    h += '<div class="ii-lt"><div title="' + esc(T("fisicaD")) + '"><small>' + esc(T("fisica")) + "</small><b>" + esc(Tx.fisica.nome) + "</b><p>" + esc(Tx.fisica.razoes.join(" ")) + '</p></div><div title="' + esc(T("adminD")) + '"><small>' + esc(T("admin")) + "</small><b>" + esc(Tx.admin.nome) + "</b><p>" + esc(Tx.admin.razoes.join(" ")) + '</p></div></div><p class="ii-cn">' + esc(T("cNota")) + "</p>";
    h += '<span class="ii-h">' + esc(T("indicacoes")) + "</span>";
    var grupos = { rel: [], ver: [], info: [], nd: [], ok: [] };
    Tx.itens.forEach(function (x) { grupos[x.nivel].push(x); });
    function item(x) {
      return '<details class="ii-it" style="--c:' + COR[x.nivel] + '"' + (x.nivel === "rel" || x.nivel === "ver" ? " open" : "") + "><summary><b>" + esc(x.nome) + (x.modelado ? '<span class="md">' + esc(T("modelado")) + "</span>" : "") + "</b><em>" + esc(x.nivelNome) + "</em></summary>" +
        "<p><b>" + esc(T("razao")) + ":</b> " + esc(x.razao) + "</p>" + (x.fonte ? '<p class="fo"><b>' + esc(T("fonte")) + ":</b> " + esc(x.fonte) + "</p>" : "") +
        (x.act || x.consultado ? '<p class="fo"><b>' + esc(T("dataAct")) + ":</b> " + esc([x.act, x.consultado ? T("consultado", { d: x.consultado }) : ""].filter(Boolean).join(" · ")) + "</p>" : "") + "</details>";
    }
    h += grupos.rel.concat(grupos.ver, grupos.info).map(item).join("");
    if (grupos.nd.length) h += '<details class="ii-grp"><summary>' + esc(T("n_nd")) + " (" + grupos.nd.length + ")</summary>" + grupos.nd.map(item).join("") + "</details>";
    if (grupos.ok.length) h += '<details class="ii-grp"><summary>' + esc(T("n_ok")) + " (" + grupos.ok.length + ")</summary>" + grupos.ok.map(item).join("") + "</details>";
    h += '<span class="ii-h">' + esc(T("entidades")) + '</span><ul class="ii-l">' + Tx.entidades.map(function (e) { return "<li>" + esc(e.nome) + (e.porque ? " <small>" + esc(T("porque", { x: e.porque })) + "</small>" : "") + "</li>"; }).join("") + "</ul>";
    if (Tx.falta.length) h += '<span class="ii-h">' + esc(T("falta")) + '</span><ul class="ii-l">' + Tx.falta.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ul>";
    h += '<span class="ii-h">' + esc(T("passos")) + '</span><ol class="ii-l">' + Tx.passos.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ol>";
    h += '<p class="ii-av">' + esc(Tx.aviso) + "</p>";
    h += '<div class="ii-acc"><button type="button" class="ii-b" data-ii="copiar">' + esc(T("copiar")) + '</button><button type="button" class="ii-b" data-ii="json">' + esc(T("json")) + '</button><button type="button" class="ii-b" data-ii="html">' + esc(T("html")) + '</button></div><p class="ii-ok" role="status"></p>';
    return h;
  }
  function cmpHtml() {
    var l = L(), G = S.guardadas;
    var h = '<p class="ii-q">' + esc(T("cmpT")) + "</p>";
    if (!G.length) return h + '<p class="ii-nota">' + esc(T("cmpVazio")) + "</p>";
    if (G.length < 2) h += '<p class="ii-nota">' + esc(T("cmpVazio")) + "</p>";
    function linha(rot, fn) { return "<tr><th>" + esc(rot) + "</th>" + G.map(function (a) { return "<td>" + fn(a) + "</td>"; }).join("") + "</tr>"; }
    var temas = ["ren", "ran", "crus", "agua", "n2k", "inund", "relevo", "escorr"];
    h += '<div class="ii-cmp"><table><thead><tr><th></th>' + G.map(function (a) { return '<th><span class="lb">' + esc(a.rotulo) + "</span></th>"; }).join("") + "</tr></thead><tbody>";
    h += linha(T("cmpEstado"), function (a) { return '<i style="--c:' + COR[a.ficha.estado] + '"></i>' + esc(T("e_" + a.ficha.estado)); });
    h += linha(T("fisica"), function (a) { return esc(T("a_" + a.ficha.fisica.nivel)); });
    h += linha(T("admin"), function (a) { return esc(T("c_" + a.ficha.admin.nivel)); });
    h += linha(T("cmpArea"), function (a) { return esc(areaTxt(l, a.area_m2)); });
    h += linha(T("cmpDecl"), function (a) { var r = (a.brutos && a.brutos.relevo) || {}; return r.media != null ? esc(num(l, r.media, 1)) + " %" : "–"; });
    temas.forEach(function (id) { h += linha(nomeFonte(l, id), function (a) { var x = a.ficha.itens.filter(function (y) { return y.id === id; })[0]; return x ? '<i style="--c:' + COR[x.nivel] + '"></i>' + esc(T("n_" + x.nivel)) : "–"; }); });
    h += linha(T("cmpEnt"), function (a) { return esc(String(a.ficha.entidades.length)); });
    h += linha(T("cmpFalta"), function (a) { return esc(String(a.ficha.falta.length + a.ficha.nd.length)); });
    h += linha("", function (a) { return '<button type="button" class="ii-b" data-ii-ver="' + esc(a.rotulo) + '">' + esc(T("cmpVer")) + '</button> <button type="button" class="ii-b" data-ii-ret="' + esc(a.rotulo) + '">' + esc(T("cmpRetirar")) + "</button>"; });
    return h + "</tbody></table></div>";
  }

  // ───────────── Eventos do painel ─────────────
  function aoMudar(e) {
    var el = e.target, k;
    if ((k = el.getAttribute("data-ii-ns"))) { S.resp[k] = el.checked ? "ns" : ""; guardarEstado(); pintar(); return; }
    if ((k = el.getAttribute("data-ii-k"))) {
      if (e.type === "input" && el.tagName === "SELECT") return;
      var v = el.value; S.resp[k] = PERG[k][1] === "num" ? (v === "" ? "" : +v) : v; guardarEstado();
      if (e.type === "change" && el.tagName === "SELECT") { /* nada a repintar */ }
    }
  }
  function aoClicar(e) {
    var b = e.target.closest("button"); if (!b || !P.contains(b)) return; var a;
    if ((a = b.getAttribute("data-ii-tipo"))) { if (S.tipo !== a) { S.tipo = a; S.ficha = null; S.vendo = null; } guardarEstado(); pintar(); return; }
    if ((a = b.getAttribute("data-ii-ir")) || (a = b.getAttribute("data-ii-passo"))) { S.passo = a === "c" ? "c" : +a; if (S.passo === 4) S.vendo = null; S.min = false; pintar(); return; }
    if ((a = b.getAttribute("data-ii-ver"))) { var g = S.guardadas.filter(function (x) { return x.rotulo === a; })[0]; if (g) { S.vendo = g; S.passo = 4; if (!S.ficha) S.ficha = g; pintar(); voarPara(g.geometria.coordinates[0]); } return; }
    if ((a = b.getAttribute("data-ii-ret"))) { S.guardadas = S.guardadas.filter(function (x) { return x.rotulo !== a; }); guardarEstado(); actualizarMapa(); if (!S.guardadas.length) S.passo = S.ficha ? 4 : 3; pintar(); return; }
    switch (b.getAttribute("data-ii")) {
      case "min": S.min = !S.min; pintar(); break;
      case "fechar": fecharPainel(); break;
      case "desenhar": iniciarDesenho(); break;
      case "terreno": usarTerreno(); break;
      case "limpar": S.anel = null; S.avisoArea = ""; actualizarMapa(); pintar(); break;
      case "terminar": pararDesenho(true); break;
      case "desfazer": if (S.desenho) { S.desenho.pts.pop(); actualizarMapa(); pintar(); } break;
      case "cancelar": pararDesenho(false); break;
      case "analisar": analisar(); break;
      case "guardar": guardarComparacao(); break;
      case "novo": S.anel = null; S.ficha = null; S.vendo = null; S.passo = 3; actualizarMapa(); pintar(); break;
      case "copiar": copiar(); break;
      case "json": descarregar("json"); break;
      case "html": descarregar("html"); break;
      case "intel": location.href = "/ipr-cloud/"; break;
    }
  }
  function aviso(txt) { var o = P && P.querySelector(".ii-ok"); if (o) { o.textContent = txt; clearTimeout(aviso.t); aviso.t = setTimeout(function () { o.textContent = ""; }, 4000); } }

  // ───────────── Desenho e camadas no mapa ─────────────
  var SRC = "ipr-int", marcadores = [];
  function garantirCamadas() {
    var M = mapa(); if (!M || !M.getStyle) return false;
    try {
      if (!M.getSource(SRC)) M.addSource(SRC, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      if (!M.getLayer("ipr-int-f")) M.addLayer({ id: "ipr-int-f", type: "fill", source: SRC, filter: ["==", ["geometry-type"], "Polygon"], paint: { "fill-color": ["match", ["get", "k"], "actual", "#e8c547", "#9fc0de"], "fill-opacity": ["match", ["get", "k"], "actual", 0.2, 0.1] } });
      if (!M.getLayer("ipr-int-l")) M.addLayer({ id: "ipr-int-l", type: "line", source: SRC, filter: ["any", ["==", ["geometry-type"], "Polygon"], ["==", ["geometry-type"], "LineString"]], paint: { "line-color": ["match", ["get", "k"], "guard", "#9fc0de", "#e8c547"], "line-width": 2.2, "line-dasharray": ["match", ["get", "k"], "guard", ["literal", [2, 1.5]], ["literal", [1, 0]]] } });
      if (!M.getLayer("ipr-int-p")) M.addLayer({ id: "ipr-int-p", type: "circle", source: SRC, filter: ["==", ["geometry-type"], "Point"], paint: { "circle-radius": ["match", ["get", "k"], "v0", 6, 4], "circle-color": "#e8c547", "circle-stroke-color": "#141814", "circle-stroke-width": 1.5 } });
      if (!garantirCamadas.liga) { garantirCamadas.liga = 1; M.on("styledata", function () { if (!M.getSource(SRC)) setTimeout(function () { garantirCamadas(); actualizarMapa(); }, 50); }); }
      return true;
    } catch (e) { return false; }
  }
  function actualizarMapa() {
    var M = mapa(); if (!M || !garantirCamadas()) return;
    var fs = [];
    S.guardadas.forEach(function (g) { fs.push({ type: "Feature", properties: { k: "guard", l: g.rotulo }, geometry: g.geometria }); });
    if (S.desenho) {
      var p = S.desenho.pts;
      if (p.length) fs.push({ type: "Feature", properties: { k: "des" }, geometry: { type: "LineString", coordinates: p.concat(S.desenho.rato ? [S.desenho.rato] : []) } });
      p.forEach(function (q, i) { fs.push({ type: "Feature", properties: { k: i ? "v" : "v0" }, geometry: { type: "Point", coordinates: q } }); });
    } else if (S.anel) fs.push({ type: "Feature", properties: { k: "actual" }, geometry: { type: "Polygon", coordinates: [S.anel] } });
    try { M.getSource(SRC).setData({ type: "FeatureCollection", features: fs }); } catch (e) {}
    marcadores.forEach(function (m) { try { m.remove(); } catch (e) {} }); marcadores = [];
    if (W.maplibregl && W.maplibregl.Marker) S.guardadas.forEach(function (g) {
      var el = document.createElement("div"); el.className = "ipr-int-mk"; el.textContent = g.rotulo;
      try { marcadores.push(new W.maplibregl.Marker({ element: el }).setLngLat(g.centro).addTo(M)); } catch (e) {}
    });
  }
  var H = {};
  function iniciarDesenho() {
    var M = mapa(); if (!M) { S.avisoArea = T("erroMapa"); pintar(); return; }
    garantirCamadas(); S.desenho = { pts: [], rato: null, ferr: W.__ipe && W.__ipe.estado ? W.__ipe.estado.tool : null, dz: M.doubleClickZoom && M.doubleClickZoom.isEnabled() };
    // a identificação de camadas do Atlas só corre com a ferramenta «nav»: muda-se enquanto se desenha
    if (W.__ipe && W.__ipe.estado) W.__ipe.estado.tool = "intervencao";
    if (M.doubleClickZoom) M.doubleClickZoom.disable();
    M.getCanvas().style.cursor = "crosshair";
    // no telemóvel o toque nem sempre chega como «click»: reconhece-se o toque curto e ignora-se o click sintético que venha a seguir
    H.ts = function (ev) { var o = ev.originalEvent; H.toque = (o && o.touches && o.touches.length === 1) ? { x: ev.point.x, y: ev.point.y, t: Date.now() } : null; };
    H.te = function (ev) {
      var q = H.toque; H.toque = null; if (!q || !S.desenho) return;
      if (Date.now() - q.t > 600 || Math.hypot(ev.point.x - q.x, ev.point.y - q.y) > 10) return;
      H.ultToque = Date.now(); H.click(ev, true);
    };
    H.click = function (ev, deToque) {
      if (!deToque && H.ultToque && Date.now() - H.ultToque < 700) return;
      var d = S.desenho; if (!d) return; var p = [ev.lngLat.lng, ev.lngLat.lat];
      if (d.pts.length >= 3) { var a = M.project(d.pts[0]); if (Math.hypot(a.x - ev.point.x, a.y - ev.point.y) < 12) { pararDesenho(true); return; } }
      d.pts.push(p); actualizarMapa(); pintar();
    };
    H.dbl = function (ev) { if (S.desenho && S.desenho.pts.length >= 3) { if (ev.preventDefault) ev.preventDefault(); pararDesenho(true); } };
    H.move = function (ev) { if (S.desenho && S.desenho.pts.length) { S.desenho.rato = [ev.lngLat.lng, ev.lngLat.lat]; actualizarMapa(); } };
    M.on("click", H.click); M.on("dblclick", H.dbl); M.on("mousemove", H.move); M.on("touchstart", H.ts); M.on("touchend", H.te);
    pintar();
  }
  function pararDesenho(aceitar) {
    var M = mapa(), d = S.desenho; if (!d) return;
    if (M) { M.off("click", H.click); M.off("dblclick", H.dbl); M.off("mousemove", H.move); M.off("touchstart", H.ts); M.off("touchend", H.te); M.getCanvas().style.cursor = ""; if (d.dz && M.doubleClickZoom) setTimeout(function () { M.doubleClickZoom.enable(); }, 300); }
    if (W.__ipe && W.__ipe.estado && W.__ipe.estado.tool === "intervencao") W.__ipe.estado.tool = d.ferr || "nav";
    S.desenho = null;
    if (aceitar) {
      var pts = d.pts.filter(function (p, i, a) { return !i || p[0] !== a[i - 1][0] || p[1] !== a[i - 1][1]; });
      if (pts.length >= 3) { S.anel = pts.concat([pts[0]]); S.origemGeo = "desenho"; S.avisoArea = ""; S.ficha = null; S.vendo = null; }
      else S.avisoArea = T("erroGeo");
    }
    actualizarMapa(); pintar();
  }
  function terrenoActivo() {
    try { var a = W.__ipe && W.__ipe.estado && W.__ipe.estado.actual; if (a && a.geojson) { var r = anelExt(a.geojson); if (r) return r; } } catch (e) {}
    var M = mapa(); if (!M) return null;
    try {
      var s = M.getSource("mapbox-gl-draw-cold"), d = s && (s._data || (s.serialize && s.serialize().data));
      if (d && typeof d === "object") { var fs = (d.features || []).filter(function (f) { return f.geometry && /Polygon/.test(f.geometry.type) && (!f.properties || f.properties.meta !== "vertex"); }); if (fs.length) return anelExt({ type: "FeatureCollection", features: fs }); }
    } catch (e) {}
    return null;
  }
  function usarTerreno() { var r = terrenoActivo(); if (r && r.length >= 4) { S.anel = r; S.origemGeo = "terreno"; S.avisoArea = ""; S.ficha = null; S.vendo = null; voarPara(r); } else S.avisoArea = T("semTerreno"); actualizarMapa(); pintar(); }
  function voarPara(r) { var M = mapa(); if (!M || !r) return; var b = bboxAnel(r); try { M.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: 80, maxZoom: 17, duration: 600 }); } catch (e) {} }

  // ───────────── Análise ─────────────
  function analisar() {
    if (explorer() || !S.anel || S.prog) return;
    var anel = S.anel, b = bboxAnel(anel), c = [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2], proj = projector(c[0], c[1]);
    var kx = 111320 * Math.cos(rad(c[1])), ky = 110540, Pm = anel.map(proj);
    var ctx = { anel: anel, bb: b, P: Pm, proj: proj, desproj: function (p) { return [c[0] + p[0] / kx, c[1] + p[1] / ky]; }, chave: JSON.stringify(anel) };
    ctx.amostras = amostrasDe(Pm);
    var fontes = FONTES.filter(function (f) { return !f.semFonte && f.q !== "dem"; }), n = fontes.length + 1, brutos = {};
    S.prog = { i: 0, n: n }; pintar();
    function feito() { S.prog.i++; if (S.passo === 3) { var pr = P.querySelector(".ii-prog i"); if (pr) pr.style.width = Math.round(100 * S.prog.i / S.prog.n) + "%"; var nt = P.querySelectorAll(".ii-nota"); if (nt.length) nt[nt.length - 1].textContent = T("aConsultar", { n: n }) + " " + T("consultadas", { i: S.prog.i, n: n }); } }
    var trab = fontes.map(function (f) {
      var p = f.q === "mvt" ? (f.id === "cos" ? consultaCos(f, ctx) : consultaMvt(f, ctx)) : f.q === "ags" ? consultaAgs(f, ctx) : f.q === "wmsp" ? consultaWmsp(f, ctx) : f.q === "perig" ? consultaPerig(f, ctx) : Promise.reject(new Error("?"));
      return comTempo(p, 30000).then(function (r) { brutos[f.id] = r; }, function (e) { brutos[f.id] = { ok: false, erro: String(e && e.message || e) }; }).then(feito);
    });
    trab.push(comTempo(consultaDem(ctx), 40000).then(function (r) { brutos.relevo = r.relevo || { ok: false }; brutos.escorr = r.escorr; }, function (e) { brutos.relevo = { ok: false, erro: String(e && e.message || e) }; brutos.escorr = { ok: false }; }).then(feito));
    Promise.all(trab).then(function () {
      var area = areaAnel(anel), resp = {}; Object.keys(S.resp).forEach(function (k) { if (POR_TIPO[S.tipo].indexOf(k) >= 0) resp[k] = S.resp[k]; });
      if (vazio(resp.area) && resp.area !== "ns") resp.area = Math.round(area);
      var ficha = classificar({ tipo: S.tipo, resp: resp, brutos: brutos, area_m2: area, geometria: true });
      var agora = new Date().toISOString();
      var an = { versao: 1, ferramenta: "IPR Atlas · " + t("pt", "titulo"), autor: "Terracrua Design", criado: agora, lingua: L(), tipo: S.tipo, respostas: resp, area_m2: Math.round(area), centro: c,
        geometria: { type: "Polygon", coordinates: [anel] }, origemGeometria: S.origemGeo, brutos: limparBrutos(brutos), ficha: ficha, textos: { pt: textos(ficha, "pt", { data: agora }), en: textos(ficha, "en", { data: agora }) } };
      S.ficha = an; S.vendo = null; S.prog = null; S.passo = 4; S.min = false;
      W.IPR_INTERVENCAO.ultima = an;
      try { document.dispatchEvent(new CustomEvent("ipr:intervencao", { detail: an })); } catch (e) {}
      pintar();
    });
  }
  function limparBrutos(b) { var o = {}; Object.keys(b).forEach(function (k) { var x = b[k] || {}; o[k] = { ok: !!x.ok }; ["n", "dist", "pct", "nomes", "datas", "media", "p15", "p25", "min", "max", "res", "maxHa", "maxima", "predominante", "erro", "img"].forEach(function (c) { if (x[c] != null) o[k][c] = typeof x[c] === "number" ? Math.round(x[c] * 100) / 100 : x[c]; }); }); return o; }
  function guardarComparacao() {
    var a = S.vendo || S.ficha; if (!a) return;
    if (a.rotulo && S.guardadas.some(function (g) { return g.rotulo === a.rotulo; })) { S.passo = "c"; pintar(); return; }
    if (S.guardadas.length >= 3) { aviso(T("cheio")); return; }
    var usados = S.guardadas.map(function (g) { return g.rotulo; }), r = ["A", "B", "C"].filter(function (x) { return usados.indexOf(x) < 0; })[0];
    a.rotulo = r; S.guardadas.push(a); guardarEstado(); W.IPR_INTERVENCAO.guardadas = S.guardadas;
    actualizarMapa(); pintar(); aviso(T("guardado", { l: r }));
  }

  // ───────────── Exportar ─────────────
  function actualA() { return S.vendo || S.ficha; }
  function copiar() {
    var a = actualA(); if (!a) return; var l = L(), s = textoSimples(a.textos[l], { l: l, area: areaTxt(l, a.area_m2) });
    function ok() { aviso(T("copiado")); }
    function alt() { var ta = document.createElement("textarea"); ta.value = s; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); } catch (e) {} ta.remove(); ok(); }
    try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(s).then(ok, alt); else alt(); } catch (e) { alt(); }
  }
  function nomeFicheiro(ext) { var a = actualA(); return "analise-previa-intervencao-" + (a.rotulo ? a.rotulo.toLowerCase() + "-" : "") + a.criado.slice(0, 10) + "." + ext; }
  function descarregar(fmt) {
    var a = actualA(); if (!a) return; var corpo, tipo;
    if (fmt === "json") { corpo = JSON.stringify(a, null, 2); tipo = "application/json"; }
    else { corpo = htmlExport(a, L()); tipo = "text/html"; }
    var bl = new Blob([corpo], { type: tipo + ";charset=utf-8" }), u = URL.createObjectURL(bl), el = document.createElement("a");
    el.href = u; el.download = nomeFicheiro(fmt); document.body.appendChild(el); el.click(); el.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 2000);
  }
  function htmlExport(a, l) {
    var Tx = a.textos[l], e2 = esc;
    var h = '<!doctype html><html lang="' + l + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + e2(Tx.titulo) + "</title><style>" +
      "body{font:14px/1.55 Inter,system-ui,sans-serif;color:#1d211a;background:#fbfaf6;max-width:760px;margin:0 auto;padding:28px 18px}h1{font:600 22px Raleway,Inter,sans-serif;margin:0 0 4px}h2{font:600 12px Inter,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#5f6553;margin:22px 0 8px}" +
      ".est{border:1px solid;border-radius:8px;padding:10px 12px;margin:14px 0}.lt{display:grid;grid-template-columns:1fr 1fr;gap:10px}.lt div{border:1px solid #d9d8cf;border-radius:8px;padding:10px}.it{border-left:3px solid;padding:4px 0 4px 10px;margin:0 0 10px}.it p{margin:2px 0}.fo{font-size:12px;color:#5f6553}" +
      ".av{border-left:3px solid #a8b878;background:#f1f0e8;padding:8px 10px;font-size:12.5px}small{color:#5f6553}@media(max-width:560px){.lt{grid-template-columns:1fr}}</style></head><body>";
    h += "<h1>" + e2(Tx.titulo) + "</h1><small>" + e2(Tx.tipo) + " · " + e2(areaTxt(l, a.area_m2)) + " · " + e2(fmtData(l, a.criado)) + " · " + a.centro.map(function (v) { return v.toFixed(5); }).join(", ") + "</small>";
    h += '<div class="est" style="border-color:' + COR[a.ficha.estado] + '"><b>' + e2(Tx.estado) + "</b><br>" + e2(Tx.estadoD) + "</div><p>" + e2(Tx.resumo) + "</p>";
    h += '<div class="lt"><div><small>' + e2(t(l, "fisica")) + "</small><br><b>" + e2(Tx.fisica.nome) + "</b><br>" + e2(Tx.fisica.razoes.join(" ")) + "</div><div><small>" + e2(t(l, "admin")) + "</small><br><b>" + e2(Tx.admin.nome) + "</b><br>" + e2(Tx.admin.razoes.join(" ")) + "</div></div><p><small>" + e2(t(l, "cNota")) + "</small></p>";
    h += "<h2>" + e2(t(l, "indicacoes")) + "</h2>" + Tx.itens.map(function (x) { return '<div class="it" style="border-color:' + COR[x.nivel] + '"><p><b>' + e2(x.nome) + "</b> · " + e2(x.nivelNome) + (x.modelado ? " · " + e2(t(l, "modelado")) : "") + "</p><p>" + e2(x.razao) + '</p><p class="fo">' + e2(t(l, "fonte")) + ": " + e2(x.fonte) + (x.act ? " · " + e2(t(l, "dataAct")) + ": " + e2(x.act) : "") + (x.consultado ? " · " + e2(t(l, "consultado", { d: x.consultado })) : "") + "</p></div>"; }).join("");
    h += "<h2>" + e2(t(l, "entidades")) + "</h2><ul>" + Tx.entidades.map(function (x) { return "<li>" + e2(x.nome) + (x.porque ? " <small>(" + e2(x.porque) + ")</small>" : "") + "</li>"; }).join("") + "</ul>";
    if (Tx.falta.length) h += "<h2>" + e2(t(l, "falta")) + "</h2><ul>" + Tx.falta.map(function (s) { return "<li>" + e2(s) + "</li>"; }).join("") + "</ul>";
    h += "<h2>" + e2(t(l, "passos")) + "</h2><ol>" + Tx.passos.map(function (s) { return "<li>" + e2(s) + "</li>"; }).join("") + "</ol>";
    h += '<p class="av">' + e2(Tx.aviso) + "</p><p><small>IPR Atlas · Terracrua Design</small></p></body></html>";
    return h;
  }

  // ───────────── Botão no cartão do tema «Condicionantes» ─────────────
  function botaoCond() {
    var w = document.getElementById("ipr-t62"); if (!w) return;
    var cond = w.querySelector('[data-t62="cond"][aria-pressed="true"]'), f = w.querySelector(".ipr-t62-c .ipr-t62-f");
    if (!cond || !f) return;
    var b = f.querySelector("[data-int62]");
    if (!b) { b = document.createElement("button"); b.type = "button"; b.setAttribute("data-int62", ""); f.appendChild(b); }
    var txt = IC + "<span>" + esc(T("botao")) + "</span>" + (explorer() ? ' <span class="cad" style="display:inline-flex;color:var(--ac,#a8b878)">' + CAD + "</span>" : "");
    if (b.getAttribute("data-l") !== L() + (explorer() ? "x" : "")) { b.innerHTML = txt; b.setAttribute("data-l", L() + (explorer() ? "x" : "")); }
  }
  // O §62 reescreve #ipr-t62 com innerHTML a cada mudança e o §66 pode recriar o próprio elemento: observa-se o elemento
  // actual e, de segundo a segundo, confirma-se que continua a ser o mesmo.
  var obsT = null, obsEl = null;
  function observar() {
    var w = document.getElementById("ipr-t62");
    if (w && w !== obsEl) { if (obsT) obsT.disconnect(); obsEl = w; obsT = new MutationObserver(botaoCond); obsT.observe(w, { childList: true, subtree: true }); botaoCond(); }
    return !!w;
  }
  if (!observar()) {
    var obsB = new MutationObserver(function () { if (observar()) obsB.disconnect(); });
    obsB.observe(document.documentElement, { childList: true, subtree: true });
  }
  setInterval(function () { if (!document.hidden) observar(); }, 1000);
  document.addEventListener("click", function (e) { var b = e.target.closest && e.target.closest("[data-int62]"); if (b) { e.preventDefault(); e.stopPropagation(); abrir(); } }, true);
  document.addEventListener("ipr:lingua", function () { botaoCond(); pintar(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && S.desenho) pararDesenho(false); });
  W.IPR_INTERVENCAO.abrir = abrir;
  W.IPR_INTERVENCAO.guardadas = S.guardadas;
  // mostra no mapa o que ficou guardado da sessão anterior
  (function esperarMapa(n) { var M = mapa(); if (M && M.isStyleLoaded && M.isStyleLoaded()) { actualizarMapa(); return; } if (M) { M.once("idle", function () { actualizarMapa(); }); return; } if (n < 60) setTimeout(function () { esperarMapa(n + 1); }, 500); })(0);
})(this);
