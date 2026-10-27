<?php
// Módulo 90255 · Modelos de organização e biblioteca central de grupos (IPR Atlas)
// (decisão do Nuno, 21/10/2026, 16h05: «Podem vir todos [os 15] mas isto não pode ser saloio, tem que ser altamente
// profissional; se for arriscado estarmos nós a dar os grupos, é melhor não; podem lá estar como exemplo, opcionais;
// se não houver algum grupo que eles têm, é criado automaticamente e estendido às outras organizações do género
// através da inteligência central do site.»)
//  - 15 modelos (tcd_mdl_modelos) vindos da investigação sobre a rede europeia de rewilding: cada um com grupos de
//    camadas, formulários de campo (para QField) e indicadores com origem (manual ou calculada das camadas pelo m90259).
//    Os grupos, formulários e indicadores vivem em catálogos únicos: o mesmo id é o mesmo objecto em todos os modelos,
//    por isso juntar modelos nunca duplica nada. Categorias de sensibilidade GBIF (0 sem restrição … 4 baixa).
//  - Uma organização pode ter vários modelos ($d['modelos']); o «modelo» singular do m90253 fica como o primeiro.
//    tcd_mdl_aplicar cria só os grupos em falta (tcd_cam_grupo_criar, automatico); nada se apaga nem se renomeia.
//  - Biblioteca central (opção tcd_mdl_biblioteca, autoload no, tecto de 500 entradas): grupos criados à mão por uma
//    organização entram como «sugerido»; «usos» = organizações distintas (orgs[]), recontado pelo cron diário. Só o que o
//    Nuno aprova em Ferramentas › Biblioteca de grupos chega a outras organizações («usado por N organizações», nunca o
//    nome de quem); 2 ou mais organizações com o mesmo grupo só aceleram a curadoria (Telegram). Revisão de 21/10 (M1, B2, B7).
//  - Bloco «Modelos de organização» na Oficina (entre org e camadas); REST GET /tcd/v1/org/formularios para o QField.
// Filtros usados: tcd_org_modelos, tcd_org_grupos_modelo, tcd_of_blocos. Acções: tcd_cam_grupo_novo, tcd_org_diario.
// Interruptor: tcd_mdl_off = 1. Prefixo tcd_mdl_. Depende do m90253 e do m90254.
if ( ! defined( 'ABSPATH' ) ) { exit; }

function tcd_mdl_on() { return '1' !== (string) get_option( 'tcd_mdl_off', '' ) && function_exists( 'tcd_org_de' ) && function_exists( 'tcd_cam_grupos' ); }
function tcd_mdl_quadros() { return array( 'LIFE' => 'LIFE (LPI)', 'ELSP' => 'ELSP', 'art17' => 'Directiva Habitats art. 17', 'restauro' => 'Lei do Restauro', 'E4' => 'ESRS E4', 'score' => 'Rewilding score' ); }
// Catálogos escritos uma entrada por linha, campos separados por «|»: id => [campos restantes].
function tcd_mdl_linhas( $txt ) { $o = array(); foreach ( explode( "\n", $txt ) as $l ) { $l = trim( $l ); if ( '' === $l ) { continue; } $p = explode( '|', $l ); $o[ array_shift( $p ) ] = $p; } return $o; }

// ---------- catálogo de grupos: id => nome, cor, sensível, conta ha, categoria GBIF, descrição ----------
function tcd_mdl_catalogo() {
	static $c = null; if ( null !== $c ) { return $c; }
	$l = tcd_mdl_linhas( '
	limite|Limite e zonamento|#b8652f|0|1|0|Limite da área de trabalho e zonas de gestão
	nucleos|Núcleos e área sob gestão|#a0522d|0|1|0|Áreas núcleo geridas directamente
	acordos|Parcelas por tipo de acordo|#c98a3f|1|1|2|Parcelas com proprietários, por tipo de acordo; não se publicam
	pastoreio|Zonas de pastoreio|#c9b52f|0|1|0|Pastoreio natural ou tradicional, com direitos e épocas
	cercados|Cercados|#8a7a2a|0|0|0|Cercados de aclimatação, maneio e protecção nocturna
	agua|Pontos de água e charcos|#5b8db8|0|0|0|Charcos, bebedouros e nascentes
	vedacoes|Vedações|#6b6f5c|0|0|0|Vedações de gado, eléctricas e virtuais
	manadas|Manadas e efectivos|#7a6a3a|1|0|2|Localização e efectivo das manadas; sensível
	ninhos|Ninhos naturais e artificiais|#7d1f1f|1|0|3|Ninhos e plataformas; publicação só a 1 km
	capan|Campos de alimentação (CAPAN e APAAN)|#9b3d2a|1|0|3|Campos vedados e abertos de alimentação de necrófagos
	carcacas|Deposição de carcaças|#b0613a|1|0|3|Pontos e registos de deposição
	sossego|Perímetros de sossego|#c77f5a|1|1|2|Zonas sem perturbação em época de reprodução
	veneno|Veneno e armadilhas|#d0482c|1|0|3|Achados de veneno, laços e armadilhas
	gps|Trajectórias GPS|#4a4a8a|1|0|2|Colares e emissores; só a quem gere
	camaras|Câmaras de fotografia|#3a3a3a|1|0|3|Armadilhas fotográficas; localização só a quem gere
	hidro|Rede hidrográfica|#2e6f9e|0|0|0|Rios, ribeiras e troços de trabalho
	barreiras|Barreiras fluviais|#3f5f7f|0|0|0|Açudes, barragens e passagens inventariadas ou removidas
	trocos|Troços restaurados|#3f8f8f|0|0|0|Troços reconectados ou com margem restaurada
	cascalheiras|Cascalheiras e leitos de desova|#8a9aa8|0|0|0|Leitos de desova e cascalheiras restauradas
	sonar|Contagem de peixes|#5a7a9a|0|0|0|Pontos de sonar, armadilha ou contagem visual
	presenca|Presença de espécies|#4f6b3a|1|0|3|Rastos, dejectos, pêlo e observações
	alcateias|Alcateias e grupos|#5a2d2d|1|0|2|Áreas de alcateias e grupos reprodutores
	corredores|Corredores ecológicos|#6a9a5a|0|1|0|Corredores de ligação entre núcleos
	estradas|Estradas de risco e atropelamentos|#555555|0|0|0|Troços de risco e registos de atropelamento
	ataques|Ataques a gado|#a03030|1|0|3|Ataques registados; a exploração não se publica
	caes|Cães de gado|#6a5a3a|1|0|2|Cães entregues e explorações acompanhadas
	trilhos|Trilhos e sinalética|#8b6b4a|0|0|0|Trilhos, marcações e painéis
	visita|Observatórios e alojamentos|#9a7a4a|0|0|0|Observatórios, alojamentos e pontos de visita
	condicionadas|Zonas condicionadas|#b08a3a|0|1|0|Zonas com acesso condicionado ou fechado
	exploracoes|Explorações e pastos|#8a9a4a|1|1|2|Explorações pecuárias e pastos acompanhados
	compartes|Compartes e parcelas|#a07a3a|0|1|0|Parcelas do baldio e áreas dos compartes
	regeneracao|Regeneração e plantação|#4f7f3a|0|1|0|Parcelas de plantação e regeneração natural
	combustivel|Faixas de gestão de combustível|#d08a4a|0|1|0|Faixas e mosaicos de gestão de combustível
	ardidas|Áreas ardidas|#e08a2c|0|1|0|Áreas ardidas por ano
	membros|Propriedades da rede|#b8652f|0|1|0|Ponto e polígono de cada membro, com categoria
	processos|Processos naturais em curso|#6a9a5a|0|1|0|Pastoreio natural, regeneração, dinâmica fluvial
	lagoas|Lagoas, diques e canais|#3a7aa8|0|1|0|Lagoas, diques, canais e plataformas
	colonias|Colónias nidificantes|#7d1f1f|1|0|3|Colónias de aves aquáticas
	libertacao|Áreas de libertação e ocupação|#5a7a3a|1|1|2|Área de libertação e área ocupada pela espécie
	viveiros|Viveiros e protecções|#6a8a4a|0|0|0|Viveiros, protectores e sementeiras
	fotos|Pontos fixos de fotografia|#7a7a7a|0|0|0|Fotos 360 e pontos fixos de repetição
	certificadas|Parcelas certificadas|#8a7a2a|0|1|0|Parcelas sob certificação ou pagamento
	praticas|Práticas verificadas|#9a8a3a|0|0|0|Pontos de verificação de práticas
	aderentes|Propriedades aderentes|#a08a4a|1|1|2|Propriedades com contrato; não se publicam
	acoes|Acções do projecto|#75834a|0|1|0|Áreas por acção e código do projecto
	rondas|Rondas de vigilância|#4a4a4a|1|0|2|Traçados de ronda e pontos de paragem
	ignicoes|Ignições e intervenções|#e0602c|0|0|0|Ignições, apoios e rescaldos
	semintervencao|Zonas sem intervenção|#3f6f3f|0|1|0|Zonas de não intervenção
	pressao|Pontos de pressão|#a05030|1|0|3|Pressões e ameaças identificadas
' );
	$c = array(); foreach ( $l as $k => $v ) { $c[ $k ] = array( 'id' => $k, 'nome' => $v[0], 'cor' => $v[1], 'sensivel' => (int) $v[2], 'ha' => (int) $v[3], 'cat' => (int) $v[4], 'descr' => $v[5] ); }
	return $c;
}
// ---------- catálogo de formulários (QField): id => nome, grupo, campos «nome:tipo[*][=opção,opção]» ----------
function tcd_mdl_cat_formularios() {
	static $c = null; if ( null !== $c ) { return $c; }
	$l = tcd_mdl_linhas( '
	contagem_manada|Contagem de manada|manadas|especie:escolha*=Tauros,Sorraia,Przewalski,Bisonte,Garrano,Outra;manada:texto*;data:data*;adultos:numero*;juvenis:numero;crias:numero;foto:foto
	nascimento_morte|Nascimento ou morte|manadas|manada:texto*;data:data*;tipo:escolha*=Nascimento,Morte;n:numero*;causa:texto;foto:foto
	estado_vedacao|Estado de vedação|vedacoes|data:data*;estado:escolha*=Boa,Danificada,Caída;intervencao:sim_nao;notas:texto;foto:foto
	ponto_agua|Ponto de água|agua|data:data*;nivel:escolha*=Seco,Baixo,Médio,Cheio;vedado:sim_nao;uso_fauna:texto;foto:foto
	visita_ninho|Visita a ninho|ninhos|ninho:texto*;data:data*;especie:escolha*=Grifo,Abutre-preto,Britango,Águia-real,Outra;ocupado:sim_nao*;fase:escolha=Incubação,Cria,Voada,Falhado;crias:numero;foto:foto
	deposicao|Deposição de carcaça|carcacas|data:data*;local:texto*;kg:numero*;origem:escolha*=Gado,Caça,Outra;consumo:escolha=Total,Parcial,Nulo;aves:numero;foto:foto
	achado_veneno|Achado de veneno ou armadilha|veneno|data:data*;tipo:escolha*=Isco,Cadáver,Laço,Armadilha,Suspeita;especie:texto;removido:sim_nao;gnr_avisada:sim_nao*;foto:foto;notas:texto
	camara|Câmara de fotografia|camaras|data:data*;camara:texto*;estado:escolha*=Operacional,Avariada,Furtada;cartao_trocado:sim_nao;fotos:numero
	ficha_barreira|Ficha de barreira|barreiras|nome:texto*;tipo:escolha*=Açude,Barragem,Passagem hidráulica,Outra;altura_m:numero;proprietario:texto;estado:escolha*=Em uso,Obsoleta,Removida;data:data*;foto:foto
	obra_rio|Obra no rio|trocos|data:data*;barreira:texto*;tipo:escolha*=Remoção,Passagem para peixes,Restauro de margem;km_reconectados:numero;custo_eur:numero;foto:foto
	contagem_peixes|Contagem de peixes|sonar|data:data*;local:texto*;especie:texto*;n:numero*;metodo:escolha=Sonar,Visual,Armadilha
	presenca|Presença de espécie|presenca|data:data*;especie:texto*;tipo:escolha*=Rasto,Dejecto,Pêlo,Observação,Câmara;n:numero;foto:foto;notas:texto
	ataque|Ataque a gado|ataques|data:data*;gado:escolha*=Ovino,Caprino,Bovino,Equino,Outro;mortos:numero*;feridos:numero;predador:escolha*=Lobo,Cão,Urso,Desconhecido;proteccao:escolha=Cão,Vedação,Pastor,Nenhuma;foto:foto
	atropelamento|Atropelamento|estradas|data:data*;especie:texto*;estrada:texto*;km:numero;estado:escolha*=Morto,Ferido;foto:foto
	vedacao_electrica|Vedação eléctrica|vedacoes|data:data*;exploracao:texto*;metros:numero*;estado:escolha*=Instalada,Revisão,Danificada;foto:foto
	entrega_cao|Entrega de cão de gado|caes|data:data*;exploracao:texto*;raca:escolha*=Cão de Castro Laboreiro,Cão da Serra da Estrela,Rafeiro do Alentejo,Outra;sexo:escolha=M,F;microchip:texto
	acompanhamento_cao|Acompanhamento de cão|caes|data:data*;cao:texto*;saude:escolha*=Boa,Doente,Ferido,Morto;comportamento:escolha=Bom,Em aprendizagem,Problema;foto:foto
	pedido_apoio|Pedido de apoio|exploracoes|data:data*;exploracao:texto*;tipo:escolha*=Cão,Vedação,Cercado nocturno,Outro;animais:numero;notas:texto
	visitantes|Visitantes|visita|data:data*;n:numero*;tipo:escolha*=Visita guiada,Livre,Escola,Alojamento;receita_eur:numero
	estado_trilho|Estado de trilho|trilhos|data:data*;trilho:texto*;estado:escolha*=Bom,Manutenção,Fechado;sinaletica:sim_nao;foto:foto
	incidente|Incidente|condicionadas|data:data*;tipo:escolha*=Acesso indevido,Lixo,Fogo,Caça,Outro;descricao:texto*;foto:foto
	inventario|Inventário de espécies|presenca|data:data*;especie:texto*;n:numero;metodo:escolha=Transecto,Ponto,Câmara,Ocasional
	plantacao|Plantação|regeneracao|data:data*;parcela:texto*;especie:texto*;arvores:numero*;proteccao:sim_nao;foto:foto
	regeneracao|Regeneração natural|regeneracao|data:data*;parcela:texto*;especie:texto;densidade:escolha*=Baixa,Média,Alta;foto:foto
	pos_fogo|Intervenção pós-fogo|ardidas|data:data*;parcela:texto*;intervencao:escolha*=Corte,Sementeira,Faixa,Nenhuma;ha:numero;foto:foto
	pastoreio|Pastoreio|pastoreio|data:data*;zona:texto*;especie:escolha*=Ovino,Caprino,Bovino,Equino;n:numero*;dias:numero
	adesao|Adesão de membro|membros|data:data*;nome:texto*;ha:numero*;categoria:escolha*=Rewilding,Regeneração,Pastoreio natural,Floresta,Zona húmida;contacto:texto
	actualizacao_anual|Actualização anual|membros|ano:numero*;ha:numero*;accoes:texto;especies:texto;foto:foto
	nivel_agua|Nível de água|lagoas|data:data*;lagoa:texto*;nivel_cm:numero*;salinidade:numero;foto:foto
	contagem_colonia|Contagem de colónia|colonias|data:data*;especie:texto*;casais:numero*;fase:escolha=Instalação,Incubação,Crias,Vazia
	charco|Charco|agua|data:data*;tipo:escolha*=Construído,Restaurado,Natural;m2:numero;vedado:sim_nao;foto:foto
	dique|Dique removido|lagoas|data:data*;metros:numero*;ha_reconectados:numero;foto:foto
	chegada|Chegada de animal|cercados|data:data*;especie:texto*;origem:texto*;sexo:escolha*=M,F,Desconhecido;microchip:texto;idade:texto;foto:foto
	libertacao|Libertação|libertacao|data:data*;individuo:texto*;colar_gps:sim_nao;local:texto
	saude|Saúde e mortalidade|presenca|data:data*;individuo:texto*;estado:escolha*=Saudável,Doente,Ferido,Morto;causa:texto;foto:foto
	sobrevivencia|Sobrevivência de plantação|regeneracao|data:data*;parcela:texto*;vivas:numero*;mortas:numero*;causa:escolha=Seca,Herbivoria,Fogo,Outra;foto:foto
	foto_fixa|Foto de ponto fixo|fotos|data:data*;ponto:texto*;foto:foto*
	verificacao_pratica|Verificação de prática|praticas|data:data*;propriedade:texto*;pratica:escolha*=Pastoreio extensivo,Sem mobilização,Regeneração natural,Sebes,Charco;cumprida:sim_nao*;foto:foto
	inventario_montado|Inventário de montado|certificadas|data:data*;parcela:texto*;arvores_ha:numero;regeneracao:escolha=Nula,Fraca,Boa;foto:foto
	registo_accao|Registo de acção|acoes|data:data*;codigo:texto*;descricao:texto*;custo_eur:numero;ha:numero
	ronda|Ronda de vigilância|rondas|data:data*;equipa:texto*;km:numero;horas:numero;achados:numero;notas:texto
	intervencao_fogo|Intervenção em fogo|ignicoes|data:data*;tipo:escolha*=Ignição,Apoio a bombeiros,Rescaldo;resposta_min:numero;ha:numero;foto:foto
	auditoria|Auditoria de critério|semintervencao|data:data*;criterio:texto*;cumprido:sim_nao*;evidencia:texto;foto:foto
	pressao|Registo de pressão|pressao|data:data*;tipo:escolha*=Acesso,Caça,Fogo,Infra-estrutura,Outro;descricao:texto*;foto:foto
' );
	$c = array(); foreach ( $l as $k => $v ) { $c[ $k ] = array( 'id' => $k, 'nome' => $v[0], 'grupo' => $v[1], 'campos' => tcd_mdl_campos( $v[2] ) ); }
	return $c;
}
function tcd_mdl_campos( $spec ) {
	$out = array();
	foreach ( explode( ';', $spec ) as $c ) { if ( preg_match( '/^([a-z0-9_]+):(texto|numero|data|escolha|foto|sim_nao)(\*?)(?:=(.+))?$/u', trim( $c ), $m ) ) { $out[] = array( 'nome' => $m[1], 'tipo' => $m[2], 'opcoes' => isset( $m[4] ) && '' !== $m[4] ? explode( ',', $m[4] ) : array(), 'obrigatorio' => '*' === $m[3] ? 1 : 0 ); } }
	return $out;
}
// ---------- catálogo de indicadores: slug => nome, unidade, dimensão, essencial, periodicidade, quadros, origem ----------
// origem: manual | grupo_ha:<grupo> (soma de ha das camadas) | grupo_n:<grupo> (n de elementos) | grupo_soma:<grupo>:<propriedade>
function tcd_mdl_cat_indicadores() {
	static $c = null; if ( null !== $c ) { return $c; }
	$l = tcd_mdl_linhas( '
	ha_gestao|Hectares sob gestão|ha|ecologia|1|anual|LIFE,ELSP,restauro,E4,score|grupo_ha:nucleos
	ha_acordos|Hectares por acordo|ha|economia|1|anual|LIFE,ELSP|grupo_ha:acordos
	ha_pastoreio|Hectares de pastoreio natural|ha|ecologia|1|anual|ELSP,score|grupo_ha:pastoreio
	efectivo|Efectivo por espécie|animais|ecologia|1|anual|LIFE,ELSP,score|grupo_soma:manadas:n
	nascimentos|Nascimentos|animais|ecologia|0|anual|ELSP|manual
	mortes|Mortes|animais|ecologia|0|anual|ELSP|manual
	pontos_agua|Pontos de água e charcos|n|ecologia|0|anual|LIFE|grupo_n:agua
	casais|Casais reprodutores|casais|ecologia|1|anual|art17,LIFE,ELSP,score|manual
	ninhos_ocupados|Ninhos ocupados|n|ecologia|1|anual|art17,LIFE|manual
	crias_voadas|Crias voadas|n|ecologia|1|anual|art17,LIFE,ELSP|manual
	carcaca_t|Carcaça depositada|t|ecologia|0|anual|LIFE|manual
	incidentes_veneno|Incidentes de veneno e armadilhas|n|ecologia|1|anual|LIFE,ELSP|grupo_n:veneno
	aves_gps|Aves marcadas com GPS|n|ecologia|0|anual|LIFE|manual
	barreiras_inventariadas|Barreiras inventariadas|n|ecologia|0|anual|restauro|grupo_n:barreiras
	barreiras_removidas|Barreiras removidas|n|ecologia|1|anual|restauro,LIFE,ELSP|manual
	km_reconectados|Quilómetros de rio reconectados|km|ecologia|1|anual|restauro,LIFE,ELSP,score|grupo_soma:trocos:km
	passagens_peixes|Passagens de peixes|n|ecologia|0|anual|LIFE|manual
	individuos|Indivíduos estimados|indivíduos|ecologia|1|anual|art17,LIFE,score|manual
	atropelamentos|Atropelamentos|n|ecologia|1|anual|LIFE|grupo_n:estradas
	ataques_mes|Ataques a gado|n|sociedade|1|mensal|LIFE,ELSP|grupo_n:ataques
	caes_activos|Cães de gado activos|n|sociedade|1|anual|LIFE,ELSP|grupo_n:caes
	vedacoes_instaladas|Vedações instaladas|n|sociedade|0|anual|LIFE|grupo_n:vedacoes
	criadores_apoiados|Criadores apoiados|n|sociedade|1|anual|LIFE,ELSP|manual
	ha_reserva|Hectares da reserva|ha|ecologia|1|anual|LIFE,ELSP,E4|grupo_ha:limite
	visitantes|Visitantes|pessoas|economia|1|mensal|ELSP,E4|manual
	dormidas|Dormidas|n|economia|0|mensal|ELSP|manual
	receita|Receita de visitação|EUR|economia|1|anual|ELSP|manual
	km_trilhos|Quilómetros de trilho|km|sociedade|0|anual|ELSP|grupo_soma:trilhos:km
	especies|Espécies registadas|n|ecologia|1|anual|art17,ELSP,score|manual
	exploracoes_cobertas|Explorações cobertas|n|sociedade|1|anual|LIFE,ELSP|grupo_n:exploracoes
	ataques_antes|Ataques antes do apoio|n/ano|sociedade|1|anual|LIFE,ELSP|manual
	ha_regenerados|Hectares em regeneração|ha|ecologia|1|anual|restauro,LIFE,ELSP,E4|grupo_ha:regeneracao
	ha_ardidos|Hectares ardidos|ha|ecologia|1|anual|restauro,ELSP|grupo_ha:ardidas
	arvores|Árvores plantadas|n|ecologia|1|anual|LIFE,ELSP|manual
	receitas_se|Receitas de serviços de ecossistema|EUR|economia|0|anual|ELSP,E4|manual
	compartes|Compartes|n|sociedade|0|anual|ELSP|manual
	membros|Membros da rede|n|sociedade|1|anual|ELSP|grupo_n:membros
	ha_rede|Hectares da rede|ha|ecologia|1|anual|ELSP,restauro,E4|grupo_ha:membros
	accoes_tipo|Acções por tipo|n|ecologia|0|anual|ELSP|manual
	ha_reconectados|Hectares reconectados|ha|ecologia|1|anual|restauro,LIFE,ELSP,score|manual
	charcos|Charcos construídos ou restaurados|n|ecologia|1|anual|LIFE,ELSP|grupo_n:agua
	casais_nidificantes|Casais nidificantes|casais|ecologia|1|anual|art17,LIFE|manual
	ha_humida|Hectares de zona húmida|ha|ecologia|0|anual|art17,restauro|grupo_ha:lagoas
	translocados|Animais translocados|animais|ecologia|1|anual|LIFE,ELSP|manual
	libertados|Animais libertados|animais|ecologia|1|anual|LIFE,ELSP,score|manual
	nascidos|Nascidos em liberdade|animais|ecologia|1|anual|LIFE|manual
	mortos|Mortos|animais|ecologia|1|anual|LIFE|manual
	dispersao_max|Dispersão máxima|km|ecologia|0|anual|ELSP|manual
	ha_ocupada|Área ocupada pela espécie|ha|ecologia|0|anual|art17,score|grupo_ha:libertacao
	sobrevivencia|Sobrevivência de plantação|%|ecologia|1|anual|LIFE,ELSP|manual
	ha_corredor|Hectares de corredor|ha|ecologia|0|anual|restauro,score|grupo_ha:corredores
	ha_certificados|Hectares certificados|ha|economia|1|anual|E4,ELSP|grupo_ha:certificadas
	proprietarios|Proprietários aderentes|n|sociedade|1|anual|ELSP|grupo_n:aderentes
	pagamentos|Pagamentos por serviços de ecossistema|EUR|economia|1|anual|E4,ELSP|manual
	orcamento|Orçamento total|EUR|economia|1|anual|LIFE|manual
	contribuicao_ue|Contribuição da UE|EUR|economia|1|anual|LIFE|manual
	ha_por_accao|Hectares por acção|ha|ecologia|1|anual|LIFE|grupo_ha:acoes
	pessoas_formadas|Pessoas formadas|n|sociedade|0|anual|LIFE,ELSP|manual
	escolas|Escolas envolvidas|n|sociedade|0|anual|LIFE|manual
	artigos|Artigos e peças nos media|n|sociedade|0|anual|LIFE|manual
	emprego|Postos de trabalho|n|economia|0|anual|LIFE,ELSP|manual
	achados_mes|Achados por mês|n|ecologia|1|mensal|LIFE|grupo_n:veneno
	tempo_resposta|Tempo de resposta|min|sociedade|0|mensal|ELSP|manual
	intervencoes_fogo|Intervenções em incêndios|n|sociedade|1|anual|LIFE|grupo_n:ignicoes
	km_rondas|Quilómetros de ronda|km|sociedade|0|mensal|ELSP|grupo_soma:rondas:km
	ha_sem_intervencao|Hectares sem intervenção|ha|ecologia|1|anual|score,restauro,E4|grupo_ha:semintervencao
	criterios_cumpridos|Critérios cumpridos|n|ecologia|1|anual|score|manual
	pontos_pressao|Pontos de pressão|n|ecologia|0|anual|score|grupo_n:pressao
' );
	$c = array(); foreach ( $l as $k => $v ) { $c[ $k ] = array( 'slug' => $k, 'nome' => $v[0], 'unidade' => $v[1], 'dimensao' => $v[2], 'essencial' => (int) $v[3], 'periodicidade' => $v[4], 'quadros' => explode( ',', $v[5] ), 'origem' => $v[6] ); }
	return $c;
}
// ---------- os 15 modelos: slug => nome, descrição, exemplos reais, grupos, formulários, indicadores ----------
function tcd_mdl_modelos() {
	static $c = null; if ( null !== $c ) { return $c; }
	$l = tcd_mdl_linhas( '
	herbivoros|Paisagem de rewilding com herbívoros|Grandes áreas com manadas em pastoreio natural, acordos com proprietários e pontos de água.|Côa, Iberian Highlands, Velebit, Ródopes|limite,nucleos,acordos,pastoreio,cercados,agua,vedacoes,manadas|contagem_manada,nascimento_morte,estado_vedacao,ponto_agua|ha_gestao,ha_acordos,ha_pastoreio,efectivo,nascimentos,mortes,pontos_agua
	necrofagos|Colónia de necrófagos|Ninhos, campos de alimentação, carcaças e luta contra o veneno.|Contenda, Malcata, Douro Internacional, Ródopes|ninhos,capan,carcacas,sossego,veneno,gps,camaras|visita_ninho,deposicao,achado_veneno,camara|casais,ninhos_ocupados,crias_voadas,carcaca_t,incidentes_veneno,aves_gps
	rio|Rio livre|Inventário e remoção de barreiras, troços restaurados e contagem de peixes.|Lapónia, Oder, Dauphiné, Dam Removal Europe|hidro,barreiras,trocos,cascalheiras,sonar|ficha_barreira,obra_rio,contagem_peixes|barreiras_inventariadas,barreiras_removidas,km_reconectados,passagens_peixes
	carnivoro|Corredor de grande carnívoro|Presença, alcateias, estradas de risco, ataques e medidas de coexistência.|Apeninos, LynxConnect, WolFlux|presenca,alcateias,corredores,estradas,vedacoes,ataques,camaras,caes|presenca,ataque,atropelamento,vedacao_electrica,entrega_cao|individuos,atropelamentos,ataques_mes,caes_activos,vedacoes_instaladas,criadores_apoiados
	reserva|Reserva privada com visitação|Limites, trilhos, observatórios e alojamentos, com registo de visitantes e incidentes.|Faia Brava, Knepp, Ken Hill, Contenda|limite,trilhos,visita,condicionadas,presenca|visitantes,estado_trilho,incidente,inventario|ha_reserva,visitantes,dormidas,receita,km_trilhos,especies
	pastores|Associação de pastores e cães de gado|Explorações acompanhadas, cães entregues, cercados nocturnos e ataques antes e depois.|Grupo Lobo, Programa Alcateia, Bear-Smart|exploracoes,pastoreio,cercados,caes,ataques|entrega_cao,acompanhamento_cao,ataque,pedido_apoio|caes_activos,exploracoes_cobertas,ataques_antes,ataques_mes
	baldio|Município com floresta comunitária ou baldio|Compartes, parcelas de regeneração, faixas de combustível e áreas ardidas.|Contenda e baldios do Norte e Centro|limite,compartes,regeneracao,combustivel,ardidas,pastoreio|plantacao,regeneracao,pos_fogo,pastoreio|ha_regenerados,ha_ardidos,arvores,receitas_se,compartes
	pequenas|Rede de pequenas propriedades|Um ponto e um polígono por membro, com categoria, espécies e processos; mapa público de membros.|Rewilding Britain, Northwoods, European Rewilding Network, Montis|membros,processos,presenca|adesao,actualizacao_anual,inventario|membros,ha_rede,accoes_tipo
	humida|Zona húmida e delta|Lagoas, diques, canais, colónias e charcos, com níveis de água.|Delta do Danúbio, Oder, charcos do Côa|lagoas,colonias,agua,hidro|nivel_agua,contagem_colonia,charco,dique|ha_reconectados,charcos,casais_nidificantes,ha_humida
	reintroducao|Reintrodução com cercado|Cercado de aclimatação, área de libertação, área ocupada e trajectórias.|Bisonte, kulan, cegonha-branca, castor, lince|cercados,libertacao,gps,presenca|chegada,libertacao,presenca,saude|translocados,libertados,nascidos,mortos,dispersao_max,ha_ocupada
	florestal|Restauro florestal e corredor ecológico|Parcelas de plantação, viveiros, protecções e pontos fixos de fotografia.|Mossy Earth, Tree-Nation, Trees for Life|regeneracao,corredores,viveiros,fotos|plantacao,sobrevivencia,foto_fixa|arvores,sobrevivencia,ha_regenerados,ha_corredor
	montado|Montado com pagamento por serviços de ecossistema|Parcelas certificadas, propriedades aderentes e verificação de práticas.|Green Heart of Cork|certificadas,aderentes,praticas|verificacao_pratica,inventario_montado|ha_certificados,proprietarios,pagamentos
	reporte|Reporte LIFE ou ELSP|Bloco transversal de indicadores com meta e valor por ano, orçamento e acções por código.|Projectos LIFE e Endangered Landscapes & Seascapes Programme|acoes|registo_accao|orcamento,contribuicao_ue,ha_por_accao,pessoas_formadas,escolas,artigos,emprego
	vigilancia|Vigilância de fogo e armadilhagem ilegal|Rondas com traçado GPS, achados de laços e veneno, ignições e áreas ardidas.|Equipa de vigilância do Côa|rondas,veneno,ignicoes,ardidas|ronda,achado_veneno,intervencao_fogo|achados_mes,ha_ardidos,tempo_resposta,intervencoes_fogo,km_rondas
	wilder|Área protegida em transição para Wilder Park|Zonamento, zonas sem intervenção e pontos de pressão, com auditoria de critérios.|Wilder Parks, European Wilderness Society|limite,semintervencao,pressao,presenca|auditoria,pressao,inventario|ha_sem_intervencao,criterios_cumpridos,pontos_pressao
' );
	$g = tcd_mdl_catalogo(); $f = tcd_mdl_cat_formularios(); $i = tcd_mdl_cat_indicadores(); $c = array();
	foreach ( $l as $k => $v ) {
		$m = array( 'slug' => $k, 'nome' => $v[0], 'descr' => $v[1], 'exemplos' => $v[2], 'grupos' => array(), 'formularios' => array(), 'indicadores' => array() );
		foreach ( explode( ',', $v[3] ) as $x ) { if ( isset( $g[ $x ] ) ) { $m['grupos'][] = $g[ $x ]; } }
		foreach ( explode( ',', $v[4] ) as $x ) { if ( isset( $f[ $x ] ) ) { $m['formularios'][] = $f[ $x ] + array( 'modelo' => $k ); } }
		foreach ( explode( ',', $v[5] ) as $x ) { if ( isset( $i[ $x ] ) ) { $m['indicadores'][] = $i[ $x ] + array( 'modelo' => $k ); } }
		$c[ $k ] = $m;
	}
	return $c;
}
function tcd_mdl_modelo( $slug ) { return tcd_mdl_modelos()[ sanitize_key( (string) $slug ) ] ?? null; }

// ---------- ligação ao m90253 (modelos) e ao m90254 (grupos de origem) ----------
add_filter( 'tcd_org_modelos', function ( $m ) { if ( ! tcd_mdl_on() ) { return $m; } foreach ( tcd_mdl_modelos() as $k => $x ) { if ( ! isset( $m[ $k ] ) ) { $m[ $k ] = $x['nome']; } } return $m; } );
add_filter( 'tcd_org_grupos_modelo', function ( $grupos, $modelo ) { if ( ! tcd_mdl_on() ) { return $grupos; } $m = tcd_mdl_modelo( $modelo ); if ( ! $m ) { return $grupos; } $out = array(); foreach ( $m['grupos'] as $g ) { $out[] = $g + array( 'modelo' => $m['slug'] ); } return $out; }, 10, 2 );
// Modelos adoptados pela organização (slugs deste módulo). Sem «modelos» guardados, vale o «modelo» singular se for um dos 15.
function tcd_mdl_de( $org ) {
	$d = tcd_org_dados( $org ); if ( ! $d ) { return array(); }
	$l = isset( $d['modelos'] ) && is_array( $d['modelos'] ) ? $d['modelos'] : array( (string) ( $d['modelo'] ?? '' ) );
	$out = array(); foreach ( $l as $s ) { $s = sanitize_key( $s ); if ( tcd_mdl_modelo( $s ) && ! in_array( $s, $out, true ) ) { $out[] = $s; } } return $out;
}
// Aplicar modelos: guarda a lista (junta ou substitui), cria só os grupos em falta. Devolve criados, existiam, falhados ou WP_Error.
function tcd_mdl_aplicar( $org, $slugs, $u = null, $juntar = true ) {
	$org = (int) $org; $d = tcd_org_dados( $org ); if ( ! $d ) { return new WP_Error( 'org', 'Organização não encontrada.' ); }
	if ( tcd_org_so_leitura( $org ) ) { return new WP_Error( 'leitura', 'A organização está em só leitura: nada muda.' ); }
	$slugs = array_values( array_unique( array_filter( array_map( 'sanitize_key', (array) $slugs ), 'tcd_mdl_modelo' ) ) );
	$tem = tcd_cam_grupos( $org ); if ( empty( $d['grupos'] ) && $tem ) { $d['grupos'] = array_values( $tem ); } // fixa os grupos de origem antes de mudar o modelo
	$lista = $juntar ? array_values( array_unique( array_merge( tcd_mdl_de( $org ), $slugs ) ) ) : $slugs;
	$d['modelos'] = $lista; if ( $lista ) { $d['modelo'] = $lista[0]; } tcd_org_guardar( $org, $d );
	$r = array( 'criados' => array(), 'existiam' => array(), 'falhados' => array(), 'protegidos' => array() );
	foreach ( $slugs as $s ) { foreach ( tcd_mdl_modelo( $s )['grupos'] as $g ) {
		$tem = tcd_cam_grupos( $org );
		if ( isset( $tem[ $g['id'] ] ) ) {
			if ( ! in_array( $g['id'], $r['existiam'], true ) ) { $r['existiam'][] = $g['id']; }
			if ( tcd_mdl_proteger( $org, $g['id'], $g ) && ! in_array( $g['id'], $r['protegidos'], true ) ) { $r['protegidos'][] = $g['id']; } // B7: eleva sensível e categoria, nunca baixa
			continue;
		}
		$k = tcd_cam_grupo_criar( $org, $g['nome'], array( 'id' => $g['id'], 'cor' => $g['cor'], 'sensivel' => $g['sensivel'], 'ha' => $g['ha'], 'cat' => $g['cat'], 'descr' => $g['descr'], 'modelo' => $s, 'automatico' => true ), $u );
		if ( $k ) { $r['criados'][] = $k; } else { $r['falhados'][] = $g['id']; }
	} }
	do_action( 'tcd_mdl_aplicado', $org, $slugs, $u ); // m90259 cria os indicadores
	return $r;
}
// Grupo já existente com o mesmo id de um grupo do catálogo: fica pelo menos tão protegido como o catálogo (sensível, categoria GBIF mais restritiva, 1 = mais). Devolve true se mudou.
function tcd_mdl_proteger( $org, $id, $cat ) {
	$d = tcd_org_dados( $org ); if ( ! $d || empty( $d['grupos'] ) || ( empty( $cat['sensivel'] ) && empty( $cat['cat'] ) ) ) { return false; } $mudou = false;
	foreach ( $d['grupos'] as $i => $g ) {
		if ( ( $g['id'] ?? '' ) !== $id ) { continue; }
		if ( ! empty( $cat['sensivel'] ) && empty( $g['sensivel'] ) ) { $d['grupos'][ $i ]['sensivel'] = 1; $mudou = true; }
		$a = (int) ( $g['cat'] ?? 0 ); $c = (int) $cat['cat']; $m = function_exists( 'tcd_sen_mais_restritiva' ) ? (int) tcd_sen_mais_restritiva( $a, $c ) : ( $a > 0 && $c > 0 ? min( $a, $c ) : max( $a, $c ) );
		if ( $m !== $a ) { $d['grupos'][ $i ]['cat'] = $m; $mudou = true; }
	}
	if ( $mudou ) { tcd_org_guardar( $org, $d ); } return $mudou;
}
// União dos indicadores (por slug) e dos formulários (por id) dos modelos da organização.
function tcd_mdl_indicadores( $org ) { $out = array(); foreach ( tcd_mdl_de( $org ) as $s ) { foreach ( tcd_mdl_modelo( $s )['indicadores'] as $i ) { if ( ! isset( $out[ $i['slug'] ] ) ) { $out[ $i['slug'] ] = $i; } } } return array_values( $out ); }
function tcd_mdl_formularios( $org ) { $out = array(); foreach ( tcd_mdl_de( $org ) as $s ) { foreach ( tcd_mdl_modelo( $s )['formularios'] as $f ) { if ( ! isset( $out[ $f['id'] ] ) ) { $out[ $f['id'] ] = $f; } } } return array_values( $out ); }

// ---------- biblioteca central ----------
function tcd_mdl_bib() { $b = get_option( 'tcd_mdl_biblioteca', array() ); return is_array( $b ) ? $b : array(); }
function tcd_mdl_bib_guardar( $b ) { if ( false === get_option( 'tcd_mdl_biblioteca', false ) ) { add_option( 'tcd_mdl_biblioteca', $b, '', 'no' ); } else { update_option( 'tcd_mdl_biblioteca', $b, false ); } }
function tcd_mdl_bib_entrada( $grupo, $org, $mods ) { return array( 'id' => sanitize_key( $grupo['id'] ), 'nome' => mb_substr( sanitize_text_field( (string) $grupo['nome'] ), 0, 40 ), 'cor' => tcd_cam_cor( $grupo['cor'] ?? '' ), 'sensivel' => (int) ! empty( $grupo['sensivel'] ), 'ha' => (int) ! empty( $grupo['ha'] ), 'cat' => min( 4, max( 0, (int) ( $grupo['cat'] ?? 0 ) ) ), 'modelos' => array_values( $mods ), 'origem_org' => (int) $org, 'orgs' => array( (int) $org ), 'usos' => 1, 'estado' => 'sugerido', 'quando' => time() ); }
function tcd_mdl_bib_orgs( $e ) { return array_values( array_unique( array_map( 'intval', (array) ( $e['orgs'] ?? array( (int) ( $e['origem_org'] ?? 0 ) ) ) ) ) ); }
// Telegram ao Nuno, no máximo uma mensagem por organização por hora.
function tcd_mdl_tg( $org, $txt ) { $t = 'tcd_mdl_tg_' . (int) $org; if ( ! function_exists( 'tcd_tg_enviar' ) || get_transient( $t ) ) { return; } set_transient( $t, 1, HOUR_IN_SECONDS ); tcd_tg_enviar( $txt ); }
// Ids de grupo que já vêm de algum modelo (os 15 e os do m90254): não precisam de biblioteca.
function tcd_mdl_conhecidos() { static $c = null; if ( null !== $c ) { return $c; } $c = tcd_mdl_catalogo(); foreach ( array_keys( tcd_org_modelos() ) as $s ) { foreach ( tcd_cam_grupos_modelo( $s ) as $g ) { if ( ! empty( $g['id'] ) ) { $c[ $g['id'] ] = 1; } } } return $c; }
// Grupo criado à mão por uma organização: entra como sugerido (os automáticos já vêm dos modelos; os conhecidos não precisam).
add_action( 'tcd_cam_grupo_novo', function ( $org, $grupo, $u, $automatico ) {
	if ( ! tcd_mdl_on() || $automatico || empty( $grupo['id'] ) ) { return; }
	$k = sanitize_key( $grupo['id'] ); if ( isset( tcd_mdl_conhecidos()[ $k ] ) ) { return; }
	$b = tcd_mdl_bib(); $mods = tcd_mdl_de( $org ); $novo = ! isset( $b[ $k ] );
	if ( $novo && count( $b ) >= 500 ) { return; } // tecto da biblioteca
	if ( $novo ) { $b[ $k ] = tcd_mdl_bib_entrada( $grupo, $org, $mods ); }
	else { $o = tcd_mdl_bib_orgs( $b[ $k ] ); if ( ! in_array( (int) $org, $o, true ) ) { $o[] = (int) $org; } $b[ $k ]['orgs'] = $o; $b[ $k ]['usos'] = count( $o ); $b[ $k ]['modelos'] = array_values( array_unique( array_merge( (array) $b[ $k ]['modelos'], $mods ) ) ); }
	tcd_mdl_bib_guardar( $b ); $e = $b[ $k ];
	if ( $novo ) { tcd_mdl_tg( $org, 'Biblioteca de grupos: sugestão nova «' . esc_html( $e['nome'] ) . '» (' . $k . ')' . ( $mods ? ', modelos ' . implode( ', ', $mods ) : '' ) . '. Aprovar ou ocultar em Ferramentas › Biblioteca de grupos.' ); }
	elseif ( 'sugerido' === $e['estado'] && $e['usos'] >= 2 ) { tcd_mdl_tg( $org, 'Biblioteca de grupos: ' . (int) $e['usos'] . ' organizações usam «' . esc_html( $e['nome'] ) . '» (' . $k . '). Aprovar? Ferramentas › Biblioteca de grupos.' ); }
}, 10, 4 );
// Varrimento diário: conta usos por id de grupo em todas as organizações e acolhe grupos manuais fora dos modelos que ainda não estejam na biblioteca.
add_action( 'tcd_org_diario', function () {
	if ( ! tcd_mdl_on() ) { return; }
	$b = tcd_mdl_bib(); $cat = tcd_mdl_conhecidos(); $o = array(); $m = array(); $novos = 0;
	foreach ( get_posts( array( 'post_type' => 'tcd_org', 'post_status' => 'any', 'numberposts' => 500, 'fields' => 'ids' ) ) as $org ) {
		$mods = tcd_mdl_de( $org );
		foreach ( tcd_cam_grupos( $org ) as $k => $g ) {
			if ( isset( $cat[ $k ] ) || ( ! empty( $g['modelo'] ) && 'biblioteca' !== $g['modelo'] ) ) { continue; } $o[ $k ][] = (int) $org; $m[ $k ] = array_values( array_unique( array_merge( (array) ( $m[ $k ] ?? array() ), $mods ) ) );
			if ( ! isset( $b[ $k ] ) && count( $b ) < 500 ) { $b[ $k ] = tcd_mdl_bib_entrada( $g, $org, array() ); $novos++; }
		}
	}
	foreach ( $b as $k => $e ) { $orgs = array_values( array_unique( $o[ $k ] ?? array() ) ); $b[ $k ]['orgs'] = $orgs; $b[ $k ]['usos'] = count( $orgs ); $b[ $k ]['modelos'] = array_values( array_unique( array_merge( (array) $e['modelos'], $m[ $k ] ?? array() ) ) ); }
	tcd_mdl_bib_guardar( $b );
	if ( $novos && function_exists( 'tcd_tg_enviar' ) ) { tcd_tg_enviar( 'Biblioteca de grupos: o varrimento diário acolheu ' . $novos . ' grupo' . ( 1 === $novos ? '' : 's' ) . ' novo' . ( 1 === $novos ? '' : 's' ) . ' como sugerido' . ( 1 === $novos ? '' : 's' ) . '.' ); }
}, 30 );
// Sugestões para uma organização: só grupos aprovados pelo Nuno, com um modelo em comum, que a organização não tem.
function tcd_mdl_sugestoes( $org ) {
	$mods = tcd_mdl_de( $org ); if ( ! $mods ) { return array(); } $tem = tcd_cam_grupos( $org ); $out = array();
	foreach ( tcd_mdl_bib() as $k => $e ) {
		if ( isset( $tem[ $k ] ) ) { continue; }
		if ( 'aprovado' === ( $e['estado'] ?? '' ) && array_intersect( $mods, (array) $e['modelos'] ) ) { $out[ $k ] = $e; }
	}
	return $out;
}
function tcd_mdl_adoptar( $org, $k, $u ) {
	$s = tcd_mdl_sugestoes( $org ); if ( ! isset( $s[ $k ] ) ) { return false; } $e = $s[ $k ];
	$r = tcd_cam_grupo_criar( $org, $e['nome'], array( 'id' => $k, 'cor' => $e['cor'], 'sensivel' => $e['sensivel'], 'ha' => $e['ha'], 'cat' => $e['cat'], 'modelo' => 'biblioteca', 'automatico' => true ), $u );
	if ( $r ) { $b = tcd_mdl_bib(); $o = tcd_mdl_bib_orgs( $b[ $k ] ); if ( ! in_array( (int) $org, $o, true ) ) { $o[] = (int) $org; } $b[ $k ]['orgs'] = $o; $b[ $k ]['usos'] = count( $o ); $b[ $k ]['modelos'] = array_values( array_unique( array_merge( (array) $b[ $k ]['modelos'], tcd_mdl_de( $org ) ) ) ); tcd_mdl_bib_guardar( $b ); }
	return (bool) $r;
}

// ---------- bloco «Modelos de organização» na Oficina (entre «org» e «camadas») ----------
add_filter( 'tcd_of_blocos', function ( $b ) {
	$u = wp_get_current_user(); if ( ! tcd_mdl_on() || ! tcd_org_de( $u ) ) { return $b; }
	$m = array( 't' => 'Modelos de organização', 'k' => 'Ponto de partida', 'f' => 'tcd_mdl_bloco', 'w' => 1, 'cache' => 0 ); $n = array();
	foreach ( $b as $k => $v ) { if ( 'camadas' === $k && ! isset( $n['modelos'] ) ) { $n['modelos'] = $m; } $n[ $k ] = $v; if ( 'org' === $k ) { $n['modelos'] = $m; } }
	if ( ! isset( $n['modelos'] ) ) { $n['modelos'] = $m; }
	return $n;
}, 7 );
function tcd_mdl_form( $op, $campos, $botao, $cls = '' ) { return '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" class="' . esc_attr( 'tmdl-f ' . $cls ) . '"><input type="hidden" name="action" value="tcd_mdl_acao"><input type="hidden" name="op" value="' . esc_attr( $op ) . '">' . wp_nonce_field( 'tcd_mdl', '_wpnonce', true, false ) . $campos . '<button type="submit">' . esc_html( $botao ) . '</button></form>'; }
function tcd_mdl_bloco( $u ) {
	$org = tcd_org_de( $u ); if ( ! $org ) { return ''; }
	$gere = tcd_org_pode( $u, 'gerir', $org ); $tem = tcd_mdl_de( $org ); $todos = tcd_mdl_modelos(); $h = '<div id="modelos">';
	if ( isset( $_GET['mdl_msg'] ) ) { $h .= '<p class="tof-vz" role="status">' . esc_html( sanitize_text_field( wp_unslash( $_GET['mdl_msg'] ) ) ) . '</p>'; } // phpcs:ignore
	if ( ! $gere ) {
		if ( ! $tem ) { return $h . tcd_of_vazio( 'A organização ainda não escolheu um modelo. Quem a gere pode fazê-lo aqui.' ) . '</div>'; }
		$h .= '<p class="tof-vz">Modelos adoptados pela organização. Definem os grupos de camadas, os formulários de campo e os indicadores de partida; tudo é editável por quem gere.</p><ul class="tof-l">';
		foreach ( $tem as $s ) { $h .= '<li><div><b>' . esc_html( $todos[ $s ]['nome'] ) . '</b><br><small>' . esc_html( $todos[ $s ]['descr'] ) . '</small></div></li>'; }
		return $h . '</ul></div>';
	}
	$h .= '<p class="tof-vz">Os modelos são pontos de partida opcionais, feitos a partir do que as organizações de rewilding e conservação europeias já fazem. Cada um traz grupos de camadas, formulários de campo (QField) e indicadores. Pode escolher vários: o mesmo grupo nunca se repete, os grupos que já criou ficam como estão e tudo é editável depois, em «Camadas da organização».</p>';
	$lis = '';
	foreach ( $todos as $s => $m ) { $lis .= '<li><label><input type="checkbox" name="modelos[]" value="' . esc_attr( $s ) . '"' . checked( in_array( $s, $tem, true ), true, false ) . '> <b>' . esc_html( $m['nome'] ) . '</b><br><small>' . esc_html( $m['descr'] ) . '</small><br><small class="tmdl-ex">Ex.: ' . esc_html( $m['exemplos'] ) . ' · ' . count( $m['grupos'] ) . ' grupos · ' . count( $m['formularios'] ) . ' formulários · ' . count( $m['indicadores'] ) . ' indicadores</small></label></li>'; }
	$h .= tcd_mdl_form( 'aplicar', '<ul class="tof-l tmdl-l">' . $lis . '</ul>', 'Aplicar os modelos escolhidos', 'tmdl-apl' );
	$sug = tcd_mdl_sugestoes( $org );
	if ( $sug ) {
		$h .= '<p class="tof-k" style="margin-top:12px">Grupos usados por organizações semelhantes</p><p class="tof-vz">Criados por outras organizações com modelos em comum e aprovados pela Terracrua Design. Adoptar cria o grupo vazio; pode renomeá-lo ou apagá-lo depois.</p><ul class="tof-l">';
		foreach ( $sug as $k => $e ) { $h .= '<li><div><i style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' . esc_attr( $e['cor'] ) . ';margin-right:6px"></i><b>' . esc_html( $e['nome'] ) . '</b>' . ( ! empty( $e['sensivel'] ) ? ' <span class="tof-pill">sensível</span>' : '' ) . '<br><small>usado por ' . (int) $e['usos'] . ' organiza' . ( 1 === (int) $e['usos'] ? 'ção' : 'ções' ) . '</small></div>' . tcd_mdl_form( 'adoptar', '<input type="hidden" name="gid" value="' . esc_attr( $k ) . '">', 'Adoptar', 's' ) . '</li>'; }
		$h .= '</ul>';
	}
	$h .= '<style>.tmdl-l li{display:block}.tmdl-l label{display:block;cursor:pointer}.tmdl-l small{color:var(--mu)}.tmdl-ex{font-size:11px}.tmdl-f{margin:0}.tmdl-f button{font:600 12px Inter,sans-serif;border:1px solid var(--ln);border-radius:8px;padding:4px 9px;background:var(--p);color:var(--ac2);cursor:pointer}.tmdl-f.s{display:inline-flex}.tmdl-apl button{margin-top:8px;padding:7px 12px;font-size:13px}</style>';
	return $h . '</div>';
}
add_action( 'admin_post_tcd_mdl_acao', function () {
	check_admin_referer( 'tcd_mdl' );
	$u = wp_get_current_user(); $org = tcd_org_de( $u );
	if ( ! tcd_mdl_on() || ! $org || ! tcd_org_pode( $u, 'gerir', $org ) ) { wp_die( 'Sem acesso.' ); }
	$k = 'tcd_mdl_a_' . $u->ID; $n = (int) get_transient( $k ); if ( $n >= 30 ) { wp_die( 'Demasiadas alterações numa hora. Tente mais tarde.' ); } set_transient( $k, $n + 1, HOUR_IN_SECONDS );
	$op = sanitize_key( $_POST['op'] ?? '' ); $msg = ''; // phpcs:ignore
	if ( 'aplicar' === $op ) {
		$r = tcd_mdl_aplicar( $org, array_map( 'sanitize_key', (array) ( $_POST['modelos'] ?? array() ) ), $u, false ); // phpcs:ignore
		if ( is_wp_error( $r ) ) { $msg = $r->get_error_message(); }
		else { $msg = 'Modelos guardados: ' . count( tcd_mdl_de( $org ) ) . '. Grupos criados: ' . count( $r['criados'] ) . ( $r['existiam'] ? '; já existiam: ' . count( $r['existiam'] ) : '' ) . ( $r['falhados'] ? '; não criados (limite de 30 grupos): ' . count( $r['falhados'] ) : '' ) . ( $r['protegidos'] ? '; marcados como sensíveis por serem grupos do modelo: ' . implode( ', ', $r['protegidos'] ) : '' ) . '.'; }
	} elseif ( 'adoptar' === $op ) {
		$g = sanitize_key( $_POST['gid'] ?? '' ); $msg = tcd_mdl_adoptar( $org, $g, $u ) ? 'Grupo adoptado. Está em «Camadas da organização».' : 'Esse grupo não está disponível.'; // phpcs:ignore
	}
	wp_safe_redirect( add_query_arg( 'mdl_msg', rawurlencode( $msg ), home_url( '/oficina/' ) ) . '#modelos' ); if ( ! defined( 'TCD_TESTE' ) ) { exit; }
} );

// ---------- REST: formulários dos modelos da organização (QField, QGIS) ----------
add_action( 'rest_api_init', function () {
	register_rest_route( 'tcd/v1', '/org/formularios', array( 'methods' => 'GET', 'permission_callback' => function () { return tcd_mdl_on() && is_user_logged_in() && tcd_org_de( wp_get_current_user() ) > 0; }, 'callback' => function () {
		$u = wp_get_current_user(); $org = tcd_org_de( $u ); $d = tcd_org_dados( $org ); $g = tcd_cam_grupos( $org ); $fs = array();
		foreach ( tcd_mdl_formularios( $org ) as $f ) { $fs[] = array( 'id' => $f['id'], 'nome' => $f['nome'], 'grupo' => $f['grupo'], 'grupo_nome' => $g[ $f['grupo'] ]['nome'] ?? '', 'modelo' => $f['modelo'], 'campos' => $f['campos'] ); }
		$r = rest_ensure_response( array( 'org' => array( 'id' => $org, 'nome' => $d['nome'] ), 'modelos' => tcd_mdl_de( $org ), 'tipos' => array( 'texto', 'numero', 'data', 'escolha', 'foto', 'sim_nao' ), 'formularios' => $fs, 'gerado' => wp_date( 'c' ) ) ); $r->header( 'Cache-Control', 'private, no-store' ); return $r;
	} ) );
} );

// ---------- curadoria (só o Nuno): Ferramentas › Biblioteca de grupos ----------
add_action( 'admin_menu', function () { if ( tcd_mdl_on() && current_user_can( 'manage_options' ) && ! get_user_meta( get_current_user_id(), 'tcd_webmaster', true ) ) { add_management_page( 'Biblioteca de grupos', 'Biblioteca de grupos', 'manage_options', 'tcd-mdl', 'tcd_mdl_pagina' ); } } );
function tcd_mdl_pagina() {
	if ( ! current_user_can( 'manage_options' ) ) { return; }
	$todos = tcd_mdl_modelos(); $b = tcd_mdl_bib(); $est = array( 'sugerido' => 'Sugerido', 'aprovado' => 'Aprovado', 'oculto' => 'Oculto' );
	echo '<div class="wrap"><h1>Biblioteca de grupos</h1><p>Grupos de camadas criados à mão pelas organizações. Só «Aprovado» aparece a outras organizações que partilham um modelo; «Sugerido» e «Oculto» nunca aparecem (2 ou mais organizações com o mesmo grupo só avisam no Telegram). Usos = organizações distintas. Tecto: 500 entradas. Nunca se mostra o nome da organização de origem às outras. Catálogo fixo: ' . count( $todos ) . ' modelos, ' . count( tcd_mdl_catalogo() ) . ' grupos, ' . count( tcd_mdl_cat_formularios() ) . ' formulários, ' . count( tcd_mdl_cat_indicadores() ) . ' indicadores.</p>';
	if ( isset( $_GET['ok'] ) ) { echo '<div class="notice notice-success"><p>' . esc_html( sanitize_text_field( wp_unslash( $_GET['ok'] ) ) ) . '</p></div>'; } // phpcs:ignore
	if ( ! $b ) { echo '<p>Ainda não há sugestões.</p></div>'; return; }
	echo '<table class="widefat striped"><thead><tr><th>Grupo</th><th>Id</th><th>Sensível · ha · cat.</th><th>Modelos</th><th>Usos</th><th>Origem</th><th>Estado</th><th></th></tr></thead><tbody>';
	$f = function ( $op, $txt, $k, $extra = '' ) { return '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" style="display:inline"><input type="hidden" name="action" value="tcd_mdl_admin"><input type="hidden" name="op" value="' . esc_attr( $op ) . '"><input type="hidden" name="gid" value="' . esc_attr( $k ) . '">' . wp_nonce_field( 'tcd_mdl_admin', '_wpnonce', true, false ) . $extra . '<button class="button button-small">' . esc_html( $txt ) . '</button></form> '; };
	foreach ( $b as $k => $e ) {
		$o = tcd_org_dados( (int) $e['origem_org'] ); $mods = array(); foreach ( (array) $e['modelos'] as $s ) { $mods[] = $todos[ $s ]['nome'] ?? $s; }
		echo '<tr><td><i style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' . esc_attr( $e['cor'] ) . ';margin-right:6px"></i><b>' . esc_html( $e['nome'] ) . '</b></td><td><code>' . esc_html( $k ) . '</code></td><td>' . ( $e['sensivel'] ? 'sim' : 'não' ) . ' · ' . ( $e['ha'] ? 'sim' : 'não' ) . ' · ' . (int) $e['cat'] . '</td><td>' . esc_html( $mods ? implode( ', ', $mods ) : 'sem modelo' ) . '</td><td>' . (int) $e['usos'] . '</td><td>' . esc_html( $o ? $o['nome'] : '(varrimento)' ) . '<br><small>' . esc_html( wp_date( 'j/n/Y', (int) $e['quando'] ) ) . '</small></td><td>' . esc_html( $est[ $e['estado'] ] ?? $e['estado'] ) . '</td><td>'
			. ( 'aprovado' !== $e['estado'] ? $f( 'aprovar', 'Aprovar', $k ) : '' ) . ( 'oculto' !== $e['estado'] ? $f( 'ocultar', 'Ocultar', $k ) : $f( 'sugerido', 'Repor como sugerido', $k ) ) . $f( 'renomear', 'Renomear', $k, '<input type="text" name="nome" value="' . esc_attr( $e['nome'] ) . '" maxlength="40" style="width:160px">' ) . '</td></tr>';
	}
	echo '</tbody></table><p class="description">Renomear muda só a biblioteca: os grupos que as organizações já têm nunca são renomeados nem apagados.</p></div>';
}
add_action( 'admin_post_tcd_mdl_admin', function () {
	check_admin_referer( 'tcd_mdl_admin' );
	if ( ! tcd_mdl_on() || ! current_user_can( 'manage_options' ) || get_user_meta( get_current_user_id(), 'tcd_webmaster', true ) ) { wp_die( 'Sem acesso.' ); }
	$op = sanitize_key( $_POST['op'] ?? '' ); $k = sanitize_key( $_POST['gid'] ?? '' ); $b = tcd_mdl_bib(); $ok = 'Grupo não encontrado.'; // phpcs:ignore
	if ( isset( $b[ $k ] ) ) {
		if ( in_array( $op, array( 'aprovar', 'ocultar', 'sugerido' ), true ) ) { $b[ $k ]['estado'] = 'aprovar' === $op ? 'aprovado' : ( 'ocultar' === $op ? 'oculto' : 'sugerido' ); $ok = '«' . $b[ $k ]['nome'] . '»: ' . $b[ $k ]['estado'] . '.'; }
		elseif ( 'renomear' === $op ) { $nm = mb_substr( sanitize_text_field( wp_unslash( $_POST['nome'] ?? '' ) ), 0, 40 ); if ( $nm ) { $b[ $k ]['nome'] = $nm; $ok = 'Renomeado para «' . $nm . '».'; } } // phpcs:ignore
		tcd_mdl_bib_guardar( $b );
	}
	wp_safe_redirect( add_query_arg( 'ok', rawurlencode( $ok ), admin_url( 'tools.php?page=tcd-mdl' ) ) ); if ( ! defined( 'TCD_TESTE' ) ) { exit; }
} );
