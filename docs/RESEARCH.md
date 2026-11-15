# Pesquisa e referências — Mission: Perseverance

Revisão documental em 15/11/2026. Referências e contexto preservados da pesquisa existente; os links externos não foram revalidados nesta revisão do estado local. Este documento não define regras do jogo. Valores implementados estão nos JSONs e a operação atual está em [ARCHITECTURE.md](../ARCHITECTURE.md). Exemplos marcados como feature são propostas de pesquisa, não funcionalidades necessariamente implementadas.

## Origem e objetivo

O projeto foi concebido para o **NASA International Space Apps Challenge 2026**, especificamente o desafio **Build a Junior Astronaut Mission Trainer**.

- [Desafio oficial](https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/)
- [Aba oficial Resources — ponto de partida da pesquisa](https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/?tab=resources)
- [Evento Space Apps 2026](https://www.spaceappschallenge.org/2026/)
- [Sobre o hackathon](https://www.spaceappschallenge.org/about/)
- [Repositório GitHub](https://github.com/victormorenodev/next-frontier-nasa)

O desafio pede um jogo ou aplicativo interativo para crianças de 7–12 anos administrarem uma base lunar ou marciana, aprendendo decisões de engenharia envolvendo suporte à vida, energia, radiação, alimentos e comunicação. O foco é tornar os conflitos entre necessidades compreensíveis por meio das consequências das escolhas.

**Nosso recorte é uma base marciana e um jogo de decisões por cartas inspirado em Reigns.** O jogador assume o comando de uma base já instalada. Cada carta atual apresenta uma imagem, um problema e duas alternativas, com efeitos imediatos nos recursos. Consequências futuras continuam como possibilidade do motor e tema de pesquisa, sem novas cartas contínuas/agendadas no catálogo atual.

A associação ao hackathon descreve a origem e a proposta do projeto; não implica endosso, premiação ou validação da NASA. Não há confirmação nesta conversa de inscrição ou submissão oficial da equipe.

## Grandezas e cuidados científicos

| Indicador | Grandezas físicas | Intenção |
| --- | --- | --- |
| Oxygen Level | O₂ em kg; perdas e alterações imediatas das cartas | Manter ar respirável |
| Water Stock | Água utilizável em litros; perdas e reciclagem | Manter reserva de água; o índice Shield atual não representa água armazenada |
| Radiation Shield | Índice de proteção de 0 a 100%, sem unidade física | Representar a proteção dos astronautas no jogo |
| Energy Supply | Energia em kWh; saldo diário e efeitos das cartas | Balancear geração, operação e períodos de déficit |
| Food Stock | kg de alimento seco; perdas e efeitos das cartas | Manter alimentação adequada ao longo da missão |

Não confundir kW (potência) e kWh (energia), kg de comida hidratada e kg de sólidos alimentares, nem Gy e Sv.

### Modelo histórico de blindagem (substituído pelo índice percentual)

Representar a proteção física do habitat/abrigo e a possibilidade de proteger os quatro astronautas. A radiação **não consome a blindagem como combustível**. Materiais podem ser redistribuídos e a configuração pode mudar; a exposição da equipe é uma variável distinta.

No modelo antigo, o protótipo usava água sobre uma área total de 20 m². 1 g/cm² corresponde a 10 kg/m²; portanto, 2.000 kg distribuídos uniformemente sobre 20 m² equivalem a 10 g/cm². É apenas uma relação geométrica de massa e área, não uma garantia de redução de dose. Geometria, composição, direções de exposição e espectro de partículas importam.

Mover água utilizável para a blindagem deve conservar a massa total, sem duplicar o recurso. Uso de água para consumo pode modificar a cobertura. Não atribuir um fator de proteção radiológica sem modelo/documentação específicos.

### Referência histórica: parâmetros do protótipo anterior

O protótipo removido (commit `45928f0`, branch `prototype`) usava os valores abaixo. Alguns estoques iniciais permaneceram como fallback legado em resources.json; novas missões usam 75%/50% das capacidades atuais, e os fluxos atuais são saldos autorais por sol. A geração automática anterior de +100 kWh/sol e o consumo de 60 kWh/sol são históricos e foram substituídos pelo saldo-base atual.

| Parâmetro | Valor | Natureza |
| --- | --- | --- |
| Duração do sol | 24,6597 h | Aproximação astronômica |
| O₂ inicial | 60 kg | Escolha de protótipo |
| Água utilizável inicial | 600 kg | Escolha de protótipo |
| Água na blindagem inicial | 1.600 kg | Escolha de protótipo; separada dos 600 kg |
| Energia inicial / capacidade | 240 / 300 kWh | Escolha de protótipo |
| Alimentos secos iniciais | 100 kg | Escolha de protótipo |
| O₂ por pessoa/dia terrestre | 0,84 kg | Referência de um estudo de suporte à vida, sob suas premissas |
| Sólidos alimentares por pessoa/dia terrestre | 0,62 kg | Referência do mesmo estudo |
| Produção de O₂ | 3 kg/sol | Simulada |
| Perda líquida de água | 4 kg/sol | Simulada |
| Saldo elétrico | +40 kWh/sol | Simulado |

Os coeficientes por dia terrestre eram multiplicados por `SOL_HOURS / 24`: para quatro pessoas, cerca de 3,45 kg O₂ e 2,55 kg de sólidos alimentares por sol.

## Fontes do desafio e uso esperado

| Recurso | Links | Aplicação concreta |
| --- | --- | --- |
| NASA Open APIs | [Portal](https://api.nasa.gov/) | Descoberta de serviços e acesso técnico; não é um conjunto independente de parâmetros da base |
| DONKI | [Visão geral](https://ccmc.gsfc.nasa.gov/tools/DONKI/) · [API](https://ccmc.gsfc.nasa.gov/DONKI/api/) | Selecionar eventos solares históricos para cartas e cenários; preservar datas e contexto |
| OSDR | [Repositório](https://osdr.nasa.gov/bio/repo/) · [Busca](https://osdr.nasa.gov/osdr/data/search?term=KEYWORD) · [Sobre](https://science.nasa.gov/biological-physical/data/osdr/) · [API](https://www.nasa.gov/osdr-api/) | Estudos específicos para cultivo, inspeção e explicações biológicas |
| RadLab, integrante do OSDR | [Visão geral](https://visualization.osdr.nasa.gov/radlab/gui/overview/) · [API](https://visualization.osdr.nasa.gov/radlab/gui/data-api/) · [Tutorial NASA](https://github.com/nasa/OSDR_Tutorials/blob/main/source/pages/guides/radlab_portal.md) | Séries reais de radiação com instrumento, local e horário; não transplantar medições da ISS para Marte |
| Mars Trek | [Portal](https://trek.nasa.gov/mars/) · [Ferramentas](https://trek.nasa.gov/mars/jpl/config/textAbout.html) | Distância, elevação e terreno para localizar a base e planejar rotas |
| CSA — produção de alimentos | [Toolkit](https://www.asc-csa.gc.ca/eng/youth-educators/toolkits/food-production/) · [Desafios](https://www.asc-csa.gc.ca/eng/sciences/food-production/) · [Interplanetary Farming](https://www.asc-csa.gc.ca/eng/youth-educators/activities/fitness-and-nutrition/interplanetary-farming.asp) | Mecânicas de cultivo, espera, água, energia e nutrição; adaptar atividades à idade |
| CSA — recursos para juventude | [Portal educacional](https://www.asc-csa.gc.ca/eng/youth-educators/resources-stem-and-youth-organizations.asp) | Linguagem, tutoriais e apoio a professores/famílias |

Prioridade analítica anteriormente sugerida: DONKI → toolkit alimentar CSA → RadLab → Mars Trek → OSDR → recursos educativos gerais CSA → NASA Open APIs. Não é um ranking oficial. Para dimensionar os estoques deste jogo, as referências complementares abaixo são indispensáveis.

## Estudos e propostas de aplicação

### Suporte à vida

- [Design and Analysis of a Flexible, Reliable Deep Space Life Support System — NASA NTRS, 2016](https://ntrs.nasa.gov/api/citations/20160005782/downloads/20160005782.pdf): referência utilizada para consumo de O₂ e sólidos alimentares.
- [Life Support Baseline Values and Assumptions Document — revisão de 2022](https://ntrs.nasa.gov/api/citations/20210024855/downloads/BVAD_2.15.22-final.pdf): aprofundar antes do dimensionamento definitivo. As premissas e coeficientes podem diferir entre documentos; não misturar valores silenciosamente.
- [NASA Mars24 — duração e convenções do sol](https://www.giss.nasa.gov/tools/mars24/help/notes.html).
- [MOXIE — resultados](https://www.nasa.gov/solar-system/nasas-oxygen-generating-experiment-moxie-completes-mars-mission/): taxa máxima relatada de 12 g O₂/h; demonstração experimental, não equipamento suficiente para sustentar quatro pessoas. Não assumir operação contínua nesse máximo nem escalar potência linearmente sem documentação.

**Feature:** parar a produção para manutenção implica consumir o estoque durante a parada. Especificar produção e consumo elétrico do equipamento escolhido, em vez de bônus arbitrário permanente.

### Energia e poeira

- [InSight — geração após pouso e na primavera de 2022](https://www.jpl.nasa.gov/images/pia25284-insights-power-generation-after-landing-and-spring-2022/): cerca de 5.000 Wh/sol inicialmente e 500 Wh/sol após acumulação de poeira ao longo da missão.
- [Histórico de atualizações do InSight](https://science.nasa.gov/blogs/insight/).

**Feature:** poeira reduz geração e a bateria cobre o déficit. A redução de aproximadamente 90% é histórica, não uma redução instantânea obrigatória por tempestade. Não usar a potência de um pequeno lander como dimensionamento de uma base humana.

### Radiação e abrigo

- [NASA — evento de 20 de maio de 2024 em Marte](https://www.nasa.gov/solar-system/planets/mars/nasa-watches-mars-light-up-during-epic-solar-storm/): relata 8.100 µGy, ou 8,1 mGy, para o evento na superfície; não tratar isso automaticamente como taxa horária ou converter para mSv por fator universal.
- [Curiosity — medições de radiação na superfície](https://science.nasa.gov/resource/radiation-measurements-on-mars/).
- [NASA — referência de proteção radiológica](https://www.nasa.gov/reference/4-0-human-performance/): inclui diretrizes em água equivalente sob condições específicas; ler contexto, geometria e finalidade.
- [NASA NTRS — tabelas modeladas para ambientes e blindagens](https://ntrs.nasa.gov/api/citations/20220002905/downloads/NESC-RP-20-01589_NASA-TM-20220002905final.pdf): resultados dependem de material, geometria, ambiente e grandeza dosimétrica.

**Feature:** evento pode exigir recolher a equipe e interromper tarefas. Não converter classe de flare do DONKI em dose humana com regra inventada. Proteção contra partículas solares e raios cósmicos galácticos não é a mesma questão.

### Cultivo e alimentação

- [NASA — ficha técnica Veggie](https://www.nasa.gov/wp-content/uploads/2019/04/veggie_fact_sheet_508.pdf): aproximadamente 70 W para iluminação, ventiladores e eletrônica da unidade; não inclui toda a infraestrutura de uma estufa marciana.
- A ficha descreve cultivos de alface de 33 dias terrestres, cerca de 32,1 sols, e problemas de germinação/estresse hídrico.
- [OSDR OSD-267 — análise microbiológica e nutricional associada ao VEG-01A](https://osdr.nasa.gov/bio/repo/data/studies/OSD-267).

**Features:** plantar inicia um processo, sem comida instantânea. Para haver colheita numa partida curta, a base pode começar com plantas já em crescimento. Operar 70 W por 12 horas equivale a 0,84 kWh, mas esse cálculo isolado não define fotoperíodo ideal, rendimento ou tolerância à falta de luz. Dados da ISS são referências experimentais, não validação de uma estufa em Marte. Um kg de alface não substitui nutricionalmente um kg de ração seca. O OSD-267 não fornece automaticamente probabilidade de contaminação nem produção em toneladas.


## Referências da apresentação

- Texto do briefing: [NASA Moon to Mars Architecture Definition Document, revisão C, dezembro de 2025](https://www.nasa.gov/wp-content/uploads/2025/12/add-revision-c-20251211.pdf), especialmente habitação, proteção da saúde e resposta a emergências em Marte (UC-H-103 M, UC-H-107 M e UC-H-108 M, página impressa 129). Quatro astronautas e 35 sols são regras atuais do jogo, sem equivalência a um planejamento de missão real.
- Imagem do briefing: [NASA Science — First Humans on Mars (Artist’s Concept), PIA23302](https://science.nasa.gov/photojournal/first-humans-on-mars-artists-concept/). Crédito visível no jogo: NASA, sem link na legenda.
- PDFs locais de pesquisa anteriores: `../Analise_Resources_Junior_Astronaut.pdf` e `../Reigns_Marciano_Resources_e_Mecanicas.pdf`. Estão fora do repositório e não são necessários para executar ou compreender o código.

## Simplificação visual: Life Support no Easy

Life Support é um índice didático de disponibilidade relativa de água e oxigênio: o menor dos dois estoques dividido por sua própria capacidade, apresentado de 0 a 100. Essa escolha é um modelo de interface do jogo, sem coeficiente científico externo. Uma reserva abundante não compensa a falta da outra; a média dos estoques esconderia essa limitação.

O índice não mede massa, potabilidade, pressão parcial de O₂, autonomia em sols ou tempo de sobrevivência. Capacidades e estoques do protótipo são parâmetros de balanceamento; comparar suas frações não determina qual recurso acabará primeiro. Suporte à vida real também envolve controle de CO₂, pressão, temperatura e outros sistemas não representados por esse índice.

A simulação continua calculando água em L e oxigênio em kg separadamente, preservando suas referências e os coeficientes existentes. A cruz de saúde representa o indicador didático; não acrescenta um modelo de saúde dos astronautas. Hard mantém a apresentação física separada.

## Esgotamento de recursos e custos de teste

O encerramento por recurso zerado é uma regra de jogo, não um modelo de mortalidade ou de resposta fisiológica. Água e oxigênio continuam estoques físicos separados; no Easy suas falhas compartilham a apresentação Life Support. Falta de blindagem interrompe a missão por regra de segurança do jogo, sem estimar dose ou tempo de exposição. Radiação não consome blindagem.

Os fluxos-base atuais são totais autorais para quatro pessoas: O₂ −3,5 kg, água −10 L, energia −5 kWh e comida seca −2,6 kg por sol. A produção automática anterior foi retirada. Os coeficientes históricos de 0,84 kg de O₂ e 0,62 kg de alimento seco por pessoa/dia terrestre continuam registrados como referências nesta pesquisa, mas não são os coeficientes ativos de flows.json.

Novas missões usam consumo normal (dailyCostResource null). O multiplicador 3 e a seleção por recurso só permanecem para compatibilidade com saves antigos; não há seletor Faster daily use na interface. Estoques/fluxos de partidas em andamento conservam seus snapshots. Detalhes de persistência e início estão em [ARCHITECTURE.md](../ARCHITECTURE.md#persistência-e-migração).

O limite de três efeitos contínuos/agendados simultaneamente registrados é uma regra de balanceamento do protótipo, não uma limitação científica da base. Retirar um efeito da fila interrompe apenas suas contribuições futuras no modelo; não devolve massa ou energia já consumida nem desfaz transferências imediatas.

## Cartas autorais importadas do CSV

O catálogo atual combina 14 eventos da Página1 e 17 da Página2, totalizando 31. Seus valores são unidades físicas explícitas ou pontos de Shield, não percentuais da capacidade. Fontes e textos originais são preservados, mas os efeitos são balanceamento autoral, não consumos/produções certificados por NASA/ESA. A marca Source Verified? é metadado da planilha, não validação científica do motor.

As narrativas de CO₂, eletrólise, Sabatier e reciclagem não implementam reações químicas ou balanços detalhados desses equipamentos. Efeitos imediatos positivos em comida não simulam prazo de cultivo, composição nutricional ou equivalência de alimento fresco com kg secos. Mudanças no índice Shield não medem massa de blindagem consumida nem dose recebida.

Resumos de 8/10 removem o limite antigo de 15 kWh; 10/13 independem de evento anterior por causa do sorteio com reposição. As versões repetidas 5/9/11 são eventos distintos. A anotação Side effects de 9 fica sem execução. [Auditoria de conteúdo, fontes e imagens](CARDS.md).

## Shield percentual atual

Shield é um índice de proteção de 0 a 100% nos dois modos, iniciado em 75% no Easy e 50% no Hard. Não é densidade superficial, dose nem porcentagem de radiação bloqueada; não permite inferir autonomia, proteção clínica ou conversão direta para massa de água. O modelo geométrico de 20 m² descrito acima é histórico e não governa mais o indicador atual.

Os valores de Shield fornecidos pelo autor são somados diretamente em pontos do índice. Não existe desgaste diário por radiação. Saves antigos preservam o nível proporcional à antiga capacidade, sem apresentar essa normalização como cálculo físico de proteção. O₂, água, energia e alimento seco continuam nas unidades físicas já documentadas.

## Saldo-base atual por sol

Para a base de quatro pessoas, o autor definiu perdas líquidas de 3,5 kg de oxigênio, 10 L de água, 5 kWh de energia e 2,6 kg de comida seca por sol. Shield não tem desgaste diário. São parâmetros de balanceamento (`kind: simulated`), não novos coeficientes atribuídos à NASA. O₂ e comida são próximos dos totais históricos arredondados, mas os valores atuais são totais por sol (`perSol`), sem nova conversão de dia terrestre ou multiplicação por quatro. A produção automática anterior de O₂/energia foi removida para que o saldo real corresponda às perdas solicitadas. Efeitos de cartas continuam adicionais; o multiplicador é apenas compatibilidade legada, sem seletor atual.

Os estoques iniciais atuais são uma fração da capacidade por dificuldade: 75% no Easy e 50% no Hard, incluindo Shield. São escolhas de balanceamento, não estimativas científicas de autonomia. O estado físico conserva as frações de unidade.

## Limites da pesquisa e glossário

As propostas acima não são autorização de novas funcionalidades. A referência vigente de operação é ARCHITECTURE.md, e os parâmetros ativos ficam nos JSONs. A duração atual é 35 sols; a meta histórica de 15–20 minutos ainda não foi validada com crianças. O glossário atual tem 41 definições didáticas, incluindo siglas e termos das cartas; [GLOSSARY.md](GLOSSARY.md) registra a auditoria e fontes específicas. Definir proteção eletromagnética como ideia experimental não valida as consequências físicas da carta 25.
