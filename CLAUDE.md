# Next Frontier — contexto para Claude

Este documento transfere o contexto de produto, pesquisa e implementação para o próximo agente. Leia-o junto com `ARCHITECTURE.md` e o código antes de sugerir alterações. Está escrito em português, idioma utilizado pelo responsável pelo projeto; **o jogo em si é em inglês**.

## 1. Origem e objetivo

O projeto foi concebido para o **NASA International Space Apps Challenge 2026**, especificamente o desafio **Build a Junior Astronaut Mission Trainer**.

- [Desafio oficial](https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/)
- [Aba oficial Resources — ponto de partida da pesquisa](https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/?tab=resources)
- [Evento Space Apps 2026](https://www.spaceappschallenge.org/2026/)
- [Sobre o hackathon](https://www.spaceappschallenge.org/about/)
- [Repositório GitHub](https://github.com/victormorenodev/next-frontier-nasa)

O desafio pede um jogo ou aplicativo interativo para crianças de 7–12 anos administrarem uma base lunar ou marciana, aprendendo decisões de engenharia envolvendo suporte à vida, energia, radiação, alimentos e comunicação. O foco é tornar os conflitos entre necessidades compreensíveis por meio das consequências das escolhas.

**Nosso recorte é uma base marciana e um jogo de decisões por cartas inspirado em Reigns.** O jogador assume o comando de uma base já instalada. Cada carta apresenta um problema, um personagem e duas alternativas. As escolhas alteram estoques, disponibilidade de equipamentos e consequências futuras.

A associação ao hackathon descreve a origem e a proposta do projeto; não implica endosso, premiação ou validação da NASA. Não há confirmação nesta conversa de inscrição ou submissão oficial da equipe.

## 2. Decisões expressamente confirmadas pelo usuário

1. A equipe tem **quatro astronautas**.
2. Uma partida vencedora deve durar aproximadamente **15–20 minutos**.
3. Devem ocorrer **1–3 cartas por sol**, dependendo dos eventos.
4. **Cinco indicadores** (pedido de 14/11/2026, substitui a decisão anterior de reunir O₂ e água em "Life Support"): **Oxygen Level**, **Water Stock**, **Radiation Shield**, **Energy Supply** e **Food Stock**. Oxigênio e água são indicadores separados também na interface.
5. A blindagem (hoje **Radiation Shield**) estava em aberto; o usuário pediu uma sugestão (abaixo, seção 4).
6. O usuário considerou bons os exemplos de infraestrutura: painéis solares, reator, baterias, estufa e reabastecimento. Isso não define potências ou capacidades.
7. O público é de **7–12 anos**.
8. As quantidades devem ter significado físico: massa de alimentos, energia armazenada em bateria etc., em vez de pontos arbitrários com aparência científica.
9. O projeto **recomeçou do zero** (novembro de 2026): o protótipo anterior foi removido e a construção é incremental, um passo por pedido.
10. **O jogo é em inglês**: todo texto visível ao jogador (nomes, rótulos, mensagens) em inglês. Documentação interna pode continuar em português.
11. **O jogo roda abrindo um arquivo HTML diretamente no navegador** (`file://`). Não pode exigir servidor, instalação, build ou dependências. Consequência técnica: nada de ES modules (`type="module"`), `fetch` de arquivos locais ou bibliotecas via npm; usar `<script src>` clássicos.
12. **Unidades definidas** (pedido de 14/11/2026, "com a medida apropriada"): oxigênio em kg, água em litros (L), blindagem em g/cm² (densidade superficial), energia da bateria em kWh, alimentos secos em kg. A interface mostra a sigla e o nome por extenso em inglês. Valores iniciais e capacidades vêm do protótipo anterior (tabela da seção 5) e continuam sendo escolhas de protótipo.

### Lema de interface

> **O público-alvo tem de 7 a 12 anos.**

Toda decisão de interface parte disso: ícones claros antes de texto, alvos de toque grandes, alto contraste, pouca informação por vez, frases curtas em inglês simples e funcionamento igual com mouse e com toque.

## 3. Proposta de design apresentada, ainda sujeita a validação

- **30 sols por partida**, representando uma janela operacional de uma missão maior.
- Aproximadamente **45 decisões** para buscar a duração de 15–20 minutos.
- Distribuição inicial: 18 sols com 1 carta, 9 com 2 e 3 com 3 = 45 cartas.
- O tempo avança após a escolha; ler a carta não consome recursos.
- Vitória: concluir o sol 30 mantendo a equipe e a operação em condições adequadas.
- Fracasso comunicado como interrupção preventiva da missão, sem violência gráfica.
- ~~Life Support destaca o componente mais próximo do limite~~ — superado: O₂ e água agora são indicadores separados (decisão 4).
- Mostrar unidades junto de explicações simples e estimativas de autonomia.
- O reabastecimento futuro deve representar logística previamente planejada, não uma entrega instantânea da Terra.

**Atenção:** 30 sols, 45 cartas, estoques iniciais e distribuição de eventos são propostas de design. A duração em minutos não foi medida com usuários. No protótipo, a quantidade de cartas depende da fase da partida, ainda não do evento sorteado.

## 4. Os cinco indicadores

| Indicador | Grandezas físicas | Intenção |
| --- | --- | --- |
| Oxygen Level | O₂ em kg; produção/consumo por sol; futuramente remoção de CO₂ | Manter ar respirável |
| Water Stock | Água utilizável em litros; perdas e reciclagem | Manter reserva de água, separada da água da blindagem |
| Radiation Shield | Material, cobertura e densidade superficial em g/cm²; futuramente exposição acumulada | Preparar e utilizar um abrigo físico |
| Energy Supply | Energia da bateria em kWh; geração e demanda em kW | Balancear geração, operação e períodos de déficit |
| Food Stock | Massa por categoria, energia alimentar, validade e produção | Manter alimentação adequada ao longo da missão |

Não confundir kW (potência) e kWh (energia), kg de comida hidratada e kg de sólidos alimentares, nem Gy e Sv.

### Sugestão para Radiation Shield

Representar a proteção física do habitat/abrigo e a possibilidade de proteger os quatro astronautas. A radiação **não consome a blindagem como combustível**. Materiais podem ser redistribuídos e a configuração pode mudar; a exposição da equipe é uma variável distinta.

O protótipo usa água sobre uma área total de 20 m². 1 g/cm² corresponde a 10 kg/m²; portanto, 2.000 kg distribuídos uniformemente sobre 20 m² equivalem a 10 g/cm². É apenas uma relação geométrica de massa e área, não uma garantia de redução de dose. Geometria, composição, direções de exposição e espectro de partículas importam.

Mover água utilizável para a blindagem deve conservar a massa total, sem duplicar o recurso. Uso de água para consumo pode modificar a cobertura. Não atribuir um fator de proteção radiológica sem modelo/documentação específicos.

## 5. Estado real do código

O código atual é descrito em `ARCHITECTURE.md`, que é atualizado a cada passo. Resumo do recomeço:

1. Sistema de indicadores (`indicators.js`), com unidade em cada quantidade.
2. Interface com os indicadores (hoje cinco; `index.html`, `style.css`, `ui.js`): contêineres simples com ícones; ao passar o mouse ou o dedo, o valor atual aparece em destaque.
3. Espaço reservado para as cartas (retângulo 3:4, centralizado abaixo dos indicadores; ainda vazio).
4. Barra da missão acima dos indicadores: sol atual (`mission.js`) e botão **End mission**, com confirmação e opção de começar uma nova missão.

5. Sistema de cartas: dados em `cards.js` (10 cartas **mockup** para teste, com efeitos inventados), baralho de 45 em `deck.js` (embaralhado a cada missão, nunca a mesma carta duas vezes seguidas), carta na tela em `card-ui.js` (responder tocando, arrastando ou com as setas; as costas, com efeitos e instituição da fonte, aparecem girando depois da resposta).

Formato das cartas e regras do baralho: `ARCHITECTURE.md`, Passo 8. A capacidade de água subiu para 700 L para que mover água da blindagem para a reserva conserve a massa.

6. Tempo: cada carta consome ⅓, ⅔ ou 1 sol (campo `time`). A missão conta o tempo em terços de sol: cada sol tem dia → tarde → noite, e o número do sol sobe a cada sol completo. O fundo da página mostra o período (creme de dia, laranja à tarde, escuro à noite) e a barra mostra "Sol N" e o período, com ícone maior. Detalhes: `ARCHITECTURE.md`, Passo 9.

7. Consumo diário (`flows.js`): a cada terço de sol a equipe respira e come (coeficientes de referência), a reciclagem perde água, os painéis carregam a bateria só de dia e à tarde e a base gasta energia o tempo todo. As respostas podem ter efeito imediato (`effects`), mudar o ritmo por sol por alguns sols (`ongoing`, com espera e duração) ou agendar algo (`later`). Por exemplo, plantar sementes dá comida depois de 3 sols. Indicadores mostram setas ▲▼ e o detalhe mostra quanto muda por sol. Detalhes: `ARCHITECTURE.md`, Passo 10.

8. Cinco indicadores: Oxygen Level, Water Stock, Radiation Shield, Energy Supply e Food Stock (`ARCHITECTURE.md`, Passo 11).
9. Detalhe dos indicadores: **apertar e segurar** mostra (mouse ou toque; deslizar troca de indicador), **soltar** fecha com um *fade* suave. Sob os indicadores, uma caixa do mesmo tamanho do detalhe lista até 3 efeitos ativos (nome, recurso ▲/▼, sols restantes, "+N more"); o detalhe aparece por cima dela. A caixa cresce conforme o número de efeitos dentro de uma região fixa, para a carta não mudar de tamanho; há 20 px até a carta. Detalhes: `ARCHITECTURE.md`, Passos 12 a 14.

Ainda não existem derrota por falta de recurso (a água pode chegar a zero em algumas partidas aleatórias), regras de dificuldade nem cartas com dados reais.

Para executar: abrir `index.html` no navegador. Não há servidor.

### Referência histórica: parâmetros do protótipo anterior

O protótipo removido (commit `45928f0`, branch `prototype`) usava os valores abaixo. Os estoques iniciais foram reaproveitados em `indicators.js` e os consumos/produções em `flows.js` (a energia +40 kWh/sol virou painéis +100 só de dia e tarde, menos consumo de 60).

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

## 6. Fontes oficiais do desafio e uso esperado

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

## 7. Exemplos reais pesquisados e como aproveitá-los

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

**Features:** plantar inicia um processo, sem comida instantânea. Para haver colheita numa partida de 30 sols, a base pode começar com plantas já em crescimento. Operar 70 W por 12 horas equivale a 0,84 kWh, mas esse cálculo isolado não define fotoperíodo ideal, rendimento ou tolerância à falta de luz. Dados da ISS são referências experimentais, não validação de uma estufa em Marte. Um kg de alface não substitui nutricionalmente um kg de ração seca. O OSD-267 não fornece automaticamente probabilidade de contaminação nem produção em toneladas.

## 8. Princípios para continuar

- Priorizar escolhas compreensíveis e consequências coerentes para 7–12 anos.
- Manter a separação entre **medição real**, **modelo/hipótese** e **parâmetro de balanceamento**.
- Registrar fonte, unidade, ambiente, período e transformação de cada parâmetro científico incorporado.
- Dados históricos curados são adequados; não é obrigatório depender de APIs ao vivo.
- Mostrar claramente quando um valor é simulado. Usar unidades reais não torna um número medido.
- Preservar massa nas transferências e contabilizar fluxos pelo tempo decorrido.
- Não penalizar recurso em cada carta como se cada uma durasse um sol completo.
- Construir passo a passo, conforme cada solicitação, sem framework. Registrar cada passo em `ARCHITECTURE.md`.

## 9. Git, validação e próximos passos

- Repositório local: esta pasta (`repo`), dentro de `NASA_Hackathon`.
- `origin`: `https://github.com/victormorenodev/next-frontier-nasa.git`.
- `main` começou com um HTML contendo apenas H1.
- `prototype` contém o protótipo simples anterior (commit `45928f0`). O trabalho atual é o recomeço do zero, na branch `dev`.
- Na última tentativa, push falhou por falta de autenticação HTTPS; `gh auth status` informou ausência de login. Não presumir publicação remota. Verificar novamente antes de afirmar que algo está no GitHub.
- Nenhum site foi publicado pelo Sites; os arquivos são locais.

Comandos básicos:

```bash
node --check indicators.js
node --check mission.js
node --check flows.js
node --check cards.js
node --check deck.js
node --check card-ui.js
node --check ui.js
node tests/indicators.test.js
node tests/mission.test.js
node tests/flows.test.js
node tests/deck.test.js
git diff --check
git status --short
```

Os testes rodam no Node apenas como ferramenta de desenvolvimento; o jogo não depende do Node.

Próxima análise recomendada: verificar se cada um dos cinco indicadores tem um papel estratégico real; dimensionar fluxos de energia e suporte à vida; definir os eventos e a utilidade do abrigo; depois testar a duração e compreensão com o público. Esses são próximos passos sugeridos, não autorização para implementar toda essa expansão sem solicitação.

## 10. Documentos anteriores

Na pasta imediatamente acima do repositório existem PDFs da pesquisa e do conceito:

- `../Analise_Resources_Junior_Astronaut.pdf`
- `../Reigns_Marciano_Resources_e_Mecanicas.pdf`

São artefatos locais fora deste repositório; podem não existir em um clone futuro. Este `CLAUDE.md` reúne o contexto necessário sem depender desses arquivos.
