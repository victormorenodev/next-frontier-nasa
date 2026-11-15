# Arquitetura atual — Next Frontier

Consolidada em **15/11/2026** a partir do código atual. Este documento descreve a implementação vigente; a cronologia anterior foi preservada em [docs/history/ARCHITECTURE.md](docs/history/ARCHITECTURE.md). Regras do produto estão em [AGENTS.md](AGENTS.md); execução e edição, em [README.md](README.md); referências científicas, em [docs/RESEARCH.md](docs/RESEARCH.md).

## Organização

| Caminho | Responsabilidade |
| --- | --- |
| `index.html` | Briefing, seletor, estrutura do jogo, detalhes e diálogos |
| `data/mission.json` | Tripulação, duração do sol, duração da missão, eventos/sol e configurações dos modos |
| `data/resources.json` | Quantidades, capacidades, unidades, descrições e indicadores |
| `data/categories.json` | IDs, nomes e probabilidades das categorias |
| `data/cards.json` | Dez cartas mock, escolhas, descrições opcionais, efeitos, imagens, legendas, fontes e probabilidades condicionais |
| `data/flows.json` | Consumos/produções, bases de conversão e classificação reference/simulated |
| `data/interface.json` | Textos, templates, imagem e crédito do briefing |
| `src/bootstrap.js` | Carregamento HTTP, validação, leitura do save, inicialização e tratamento de falha |
| `src/validation.js` | Validação dos dados e snapshots salvos; compatibilidade com saves anteriores |
| `src/indicators.js` | Estado físico dos recursos, aplicação de efeitos e limites 0–capacidade |
| `src/mission.js` | Relógio, sorteio de 1/2 eventos e encerramento |
| `src/flows.js` | Conversão de coeficientes, fluxos contínuos e efeitos futuros |
| `src/deck.js` | Validação, filtragem por dificuldade e sorteio ponderado categoria → carta |
| `src/engine.js` | Ações puras sobre snapshots: start, answer, next, end |
| `src/display.js` | Conversão física/inteiros normalizados, arredondamento e variações exibidas |
| `src/icons.js` | Desenhos compartilhados entre indicadores e resultados das cartas |
| `src/card-ui.js` | Frente/verso, legendas, escolhas, efeitos e gestos da carta |
| `src/ui.js` | Orquestração da interface, modos, detalhes, animações, saves e tablet oculto |
| `assets/style.css` | Layout responsivo, apresentação visual, animações e movimento reduzido |
| `assets/images/mars-window.svg` | Paisagem decorativa de Marte |
| `images/` | Imagem NASA do briefing e imagem mock das cartas |
| `tests/` | Sete suítes Node e helper de carregamento do motor |
| `.github/workflows/pages.yml` | Testes, empacotamento estático e deploy GitHub Pages |

## Inicialização e dependências

O navegador abre o HTML por HTTP e importa `bootstrap.js` como módulo nativo. O bootstrap lê os seis JSONs em paralelo, valida os dados e tenta validar o save. Se válido, usa o snapshot dos dados salvo para as regras da partida; os textos atuais da interface têm prioridade. Preenche o HTML e importa, em sequência, indicators → mission → flows → deck → engine → icons → display → card-ui → ui.

Os arquivos carregados são módulos do navegador, mas ainda expõem suas APIs pelo `globalThis`; a ordem importa. Os testes usam `vm` para carregar a lógica e importar a validação. Não há framework, instalação de dependências ou etapa de build obrigatória. Caminhos relativos atendem tanto a raiz quanto subdiretórios de hospedagem estática. `file://` não é suportado.

Uma falha de fetch/JSON/validação na inicialização é registrada no console e mostra um aviso com **Try again**. Save inválido é preservado, com opção de substituir ao iniciar nova missão.

## Dados e sorteio

Configuração padrão: 4 astronautas, 40 sols, 80% de um evento e 20% de dois. `Engine.start(random, difficulty)` gera o cronograma completo e pede ao Deck exatamente a soma dos eventos: de 40 a 80 cartas.

| Categoria | Probabilidade-base |
| --- | ---: |
| Routine | 35% |
| Maintenance | 25% |
| Exploration | 20% |
| Science | 15% |
| Emergency | 5% |

Cada evento consome dois sorteios independentes: categoria e carta dentro dela. Probabilidades são frações de 0 a 1; categorias somam 1 e cartas somam 1 por categoria, com tolerância 1e-9. Não há rodadas balanceadas nem proibição de repetição consecutiva. Probabilidade zero desabilita a seleção.

Easy permite cartas easy/medium; Hard permite easy/medium/hard. O Deck valida os dados originais, filtra as cartas, remove categorias sem cartas elegíveis de probabilidade positiva e normaliza as chances restantes proporcionalmente. Conjunto sem opções elegíveis gera erro. Os nomes das categorias permanecem nos dados; não são rótulos obrigatórios na HUD.

`left` e `right` definem label, description opcional e efeitos. `effects` altera estoques imediatamente; `ongoing` registra rates por sol, espera opcional e duração opcional; `later` agenda efeitos após um número de sols. description ausente/vazia/só espaços não ocupa espaço no verso. `imageCaption` descreve a imagem real na frente. Textos dinâmicos são inseridos com textContent; o SVG dos ícones vem do código.

## Estado, tempo e ações

O snapshot do motor contém `state`, `mission`, `flows`, `deck`, `index`, `eventIndex`, `schedule` e `savedSide`.

1. Briefing → seletor Easy/Hard → iniciar snapshot; continuar pula o seletor.
2. `answer` aplica a escolha e registra fluxos no instante atual, sem avançar o relógio. Não reaplica se a carta já tem savedSide.
3. A interface vira a carta, mostra resultados e salva.
4. `next` passa à próxima carta do mesmo sol ou integra um sol completo após a última.
5. Ao concluir o sol 40, marca `ended: true`, `reason: 'complete'`; não exibe um sol 41. Encerramento manual usa `reason: 'quit'`.

`mission.elapsed` usa terços inteiros de sol, sem períodos jogáveis. Fluxos são aplicados em três passos internos por sol. Coeficientes `perCrewEarthDay` multiplicam amount por crew × solHours/24; os `perSol` já são totais diários. Cada passo respeita os limites do estoque e executa efeitos agendados quando devidos. Blindagem não é consumida por radiação.

Recursos internos: O₂ em kg, água em L, blindagem em g/cm², energia em kWh e comida seca em kg. Valores iniciais e capacidades são escolhas de protótipo nos JSONs, não dimensionamento científico de uma base.

## Apresentação dos recursos e animações

Hard mostra unidades físicas. Easy usa `round(value / max * 100)`, sem % e sem unidade. Arredondamento é simétrico para sinais e somente visual: valores fracionários continuam no estado e no save. Variações reais/previsões são a diferença entre os inteiros antes e depois. Efeitos imediatos do verso podem usar a reserva anterior e o limite da capacidade; taxas e efeitos futuros são convertidos e arredondados como quantidades previstas. Mudanças sem alteração no inteiro não mostram número flutuante no Easy.

Os indicadores mostram ícones e nível de preenchimento, sem setas de tendência. Hover de mouse, segurar/deslizar no toque e foco de teclado abrem detalhes: função do recurso, estoque e previsão escrita após um sol. A previsão usa `Flows.passTime` sem modificar a partida.

Uma faixa superior permanente reserva espaço para os deltas. Mudanças reais animam por 1,4 s: valor/unidade, contorno e líquido verdes ou vermelhos. O líquido volta à cor original; os contornos da escolha ficam até avançar. `cardChanges` permite restaurar os contornos no verso após recarga.

Após concluir um sol, a UI salva o novo snapshot, anima os recursos por 1,4 s e então atualiza o contador/carta. Carta e botões ficam temporariamente bloqueados para evitar aplicação duplicada. A luz do background atravessa da direita para a esquerda por 600 ms; o próximo evento já está disponível nessa etapa. Movimento reduzido elimina a espera da passagem e os deslocamentos.

Frente da carta: imagem/legenda, problema e respostas, sem dificuldade nem contagem de eventos. Verso: escolha, explicação opcional, ícones/nomes dos recursos, valores, fonte e botão de avanço. A página não rola; o layout usa altura dinâmica, safe areas, padding e organização lateral em telas baixas. A lista interna de efeitos tem overflow de segurança para conteúdo extenso.

O tablet de relatório está implementado com abertura/recolhimento, paginação e tom de missão, mas seu botão está oculto. Não há painel fixo de efeitos nem mãos de astronauta.

## Persistência e compatibilidade

`next-frontier-save` em localStorage guarda versão 1, dados da partida, snapshot, dificuldade em mission, e cardChanges. Saves preservam o baralho já sorteado. Um marcador serializa Infinity nas durações de efeitos. A UI salva após início, respostas, avanços e encerramento; não salva foco, drag ou animações.

Continuar restaura o verso se já houve escolha, sem duplicar efeitos. Saves antigos sem dificuldade usam Hard; sem categorias mantêm a sequência existente; sem campos opcionais de texto continuam aceitos. Nova missão usa os dados atuais, com recarga quando necessário. sessionStorage transporta a dificuldade ao reiniciar após um save carregado. Alteração do slot por outra aba torna o jogo antigo inert e oferece recarregar. Falha de gravação mostra aviso; armazenamento não é garantido em modo privado, quando desativado ou após limpeza dos dados do site. Não há sincronização entre dispositivos nem migração automática de progresso entre origens.

## Validação e limites atuais

Executar `npm test` e `git diff --check`. A suíte cobre indicadores, missão, fluxos, baralho, validação de dados/saves, ações do motor e conversão de apresentação. Testes visuais dependem do navegador e não fazem parte do npm test. Referências usadas nas verificações manuais incluem 320×568, 375×667, 1032×1376 e 844×390; validar novamente após alterações relevantes.

Ainda não existem derrota por estoque vazio, login, sincronização, suporte offline dedicado ou cartas com efeitos dimensionados cientificamente. A duração de 15–20 minutos não foi validada com crianças. Arquivos de pesquisa sugerem ideias futuras, não funcionalidades implementadas.

## Publicação

O workflow Publish game roda `npm test`, prepara `public/` com index.html, src/, data/, assets/ e images/, e usa GitHub Pages. Gatilhos: push na main e execução manual. Não publica documentação/testes/prints de diagnóstico. Qualquer hospedagem estática HTTP compatível pode servir os mesmos arquivos. A presença do workflow ou de um endereço informado anteriormente não confirma disponibilidade do site: consultar o resultado da publicação quando necessário.
