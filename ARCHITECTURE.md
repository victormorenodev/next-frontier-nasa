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

Uma falha de fetch/JSON/validação na inicialização é registrada no console e mostra um aviso com **Try again**. Save inválido é preservado, com substituição sem confirmação ao iniciar nova missão.

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
5. Ao concluir o sol 40 sem falha, marca `ended: true`, `reason: 'complete'`; não exibe um sol 41. Recurso físico zerado encerra com `reason: 'failed'` e `failedResource`; encerramento manual usa `reason: 'quit'`.

`mission.elapsed` usa terços inteiros de sol, sem períodos jogáveis. Fluxos são aplicados em três passos internos por sol. Coeficientes `perCrewEarthDay` multiplicam amount por crew × solHours/24; os `perSol` já são totais diários. Cada passo respeita os limites do estoque e executa efeitos agendados quando devidos. Blindagem não é consumida por radiação.

Recursos internos: O₂ em kg, água em L, blindagem em g/cm², energia em kWh e comida seca em kg. Valores iniciais e capacidades são escolhas de protótipo nos JSONs, não dimensionamento científico de uma base.

## Apresentação dos recursos e animações

Hard mostra unidades físicas. Easy usa `round(value / max * 100)`, sem % e sem unidade. Arredondamento é simétrico para sinais e somente visual: valores fracionários continuam no estado e no save. Variações reais/previsões são a diferença entre os inteiros antes e depois. Efeitos imediatos do verso podem usar a reserva anterior e o limite da capacidade; taxas e efeitos futuros são convertidos e arredondados como quantidades previstas. Mudanças sem alteração no inteiro não mostram número flutuante no Easy.

Os indicadores mostram ícones e nível de preenchimento, sem setas de tendência. Hover de mouse, segurar/deslizar no toque e foco de teclado abrem detalhes: função do recurso, estoque e previsão escrita após um sol. A previsão usa `Flows.passTime` sem modificar a partida.

Uma faixa superior permanente reserva espaço para os deltas. Mudanças reais animam por 1,4 s: valor/unidade, contorno e líquido verdes ou vermelhos. O líquido volta à cor original; os contornos da escolha ficam até avançar. `cardChanges` permite restaurar os contornos no verso após recarga.

Após concluir um sol, a UI salva o novo snapshot, anima os recursos por 1,4 s e então atualiza o contador/carta. Carta e botões ficam temporariamente bloqueados para evitar aplicação duplicada. A luz do background atravessa da direita para a esquerda por 600 ms; o próximo evento já está disponível nessa etapa. Movimento reduzido elimina a espera da passagem e os deslocamentos.

Frente da carta: imagem/legenda, problema e respostas, sem dificuldade nem contagem de eventos. Verso: escolha, explicação opcional, ícones/nomes dos recursos, valores, fonte e botão de avanço. A página não rola; o layout usa altura dinâmica, safe areas, padding e organização lateral em telas baixas. A lista interna de efeitos tem overflow de segurança para conteúdo extenso.

O tablet de relatório está implementado com abertura/recolhimento, paginação e tom de missão, mas seu botão está oculto. O painel inferior do Hard é independente do tablet, conforme descrito abaixo. Não há mãos de astronauta.

## Persistência e compatibilidade

`next-frontier-save` em localStorage guarda versão 1, dados da partida, snapshot, dificuldade em mission, e cardChanges. Saves preservam o baralho já sorteado. Um marcador serializa Infinity nas durações de efeitos. A UI salva após início, respostas, avanços e encerramento; não salva foco, drag ou animações.

Continuar restaura o verso se já houve escolha, sem duplicar efeitos. Saves antigos sem dificuldade usam Hard; sem categorias mantêm a sequência existente; sem campos opcionais de texto continuam aceitos. Nova missão usa os dados atuais, com recarga quando necessário. sessionStorage transporta a dificuldade ao reiniciar após um save carregado. Alteração do slot por outra aba torna o jogo antigo inert e oferece recarregar. Falha de gravação mostra aviso; armazenamento não é garantido em modo privado, quando desativado ou após limpeza dos dados do site. Não há sincronização entre dispositivos nem migração automática de progresso entre origens.

## Validação e limites atuais

Executar `npm test` e `git diff --check`. A suíte cobre indicadores, missão, fluxos, baralho, validação de dados/saves, ações do motor e conversão de apresentação. Testes visuais dependem do navegador e não fazem parte do npm test. Referências usadas nas verificações manuais incluem 320×568, 375×667, 1032×1376 e 844×390; validar novamente após alterações relevantes.

Ainda não existem login, sincronização, suporte offline dedicado ou cartas com efeitos dimensionados cientificamente. A duração de 15–20 minutos não foi validada com crianças. Arquivos de pesquisa sugerem ideias futuras, não funcionalidades implementadas.

## Publicação

O workflow Publish game roda `npm test`, prepara `public/` com index.html, src/, data/, assets/ e images/, e usa GitHub Pages. Gatilhos: push na main e execução manual. Não publica documentação/testes/prints de diagnóstico. Qualquer hospedagem estática HTTP compatível pode servir os mesmos arquivos. A presença do workflow ou de um endereço informado anteriormente não confirma disponibilidade do site: consultar o resultado da publicação quando necessário.

## Painel de efeitos no Hard

O modo Hard exibe um painel inferior com três espaços quadrados. Efeitos contínuos e consequências agendadas das escolhas ocupam os espaços, com ícones dos recursos afetados. Hover, foco de teclado ou toque abrem o detalhe; um segundo toque no mesmo ícone fecha. O detalhe mostra nome, impacto físico por sol (ou alteração única agendada) e tempo restante/espera. Efeitos encerrados desaparecem. O painel funciona como fila de três ícones, sem paginação: um novo efeito retira o ícone mais antigo e desloca os demais para a esquerda. Ícones retirados não voltam quando outro efeito termina; os efeitos continuam na simulação até seu término. Efeitos imediatos continuam apresentados no verso, pois não têm taxa por sol. O painel não aparece no Easy e o botão do tablet continua oculto.

## Life Support no Easy

No Easy, a HUD tem quatro indicadores: **Life Support**, Radiation Shield, Energy Supply e Food Stock. Life Support usa uma cruz de saúde e substitui visualmente Oxygen Level e Water Stock. No Hard continuam os cinco indicadores físicos separados.

A fusão é somente visual. O motor, os JSONs de cartas/fluxos e o save mantêm oxigênio em kg e água em L como estoques independentes, com seus próprios limites, consumos, produção e transferências. Não somar nem converter água em oxigênio por causa do indicador.

O nível é `round(100 × min(oxygen / oxygen.max, water / water.max))`, sem unidade ou símbolo %. A proporção mínima é calculada com o estado físico completo, sem arredondamento interno. Exemplo: oxigênio 60/100 e água 80/100 mostram Life Support 60. O indicador representa disponibilidade relativa limitada pelo menor estoque proporcional, não uma média nem tempo de sobrevivência.

Previsões integram um sol com os fluxos existentes e comparam o Life Support arredondado antes/depois, incluindo troca do recurso limitante. Animações e contornos usam essa mesma diferença, sem somar deltas dos componentes. Se só o estoque não limitante mudar e o inteiro combinado ficar igual, não há número flutuante nem destaque de mudança no indicador combinado.

O detalhe explica que Life Support combina o oxigênio respirado e a água bebida e informa o número combinado de Life Support (0 a 100, sem unidade ou %) e a variação combinada prevista após um sol. Não mostra capacidade ou números separados de Oxygen e Water. A previsão usa o índice arredondado antes/depois; pode indicar queda, aumento ou estabilidade. Em paisagem baixa, o detalhe usa tipografia compacta. No verso, cada alteração conserva seu próprio valor normalizado: aparece com a cruz e o nome Life Support, acompanhado de “Changes water” ou “Changes oxygen”. Esses valores são variações do componente identificado, não deltas somáveis do indicador combinado. Taxas e consequências futuras também conservam o componente identificado.

Nome, cor e descrição vêm de `data/resources.json` → `easyLifeSupport`; a cruz é desenhada em `src/icons.js`. O cálculo e a seleção dos indicadores pertencem a `src/display.js`. A configuração visual atual também atende saves Easy antigos, mantendo capacidades e estado da missão salva. Não há novo recurso físico nem migração do formato do save.

## Finais por esgotamento e multiplicador de teste

`Indicators.depleted` encontra o primeiro estoque físico em zero na ordem de `resources.quantities` (oxygen, water, shield, energy, food). Não usa os números arredondados do Easy. `Engine.checkFailure` aplica a regra às escolhas e à retomada de saves ativos antigos com estoque zerado. Missões já encerradas preservam seu final.

`Flows.passTime(..., {stopOnEmpty: true})` verifica após o saldo de cada terço interno e após cada efeito agendado. Ao zerar, interrompe a integração, mantém consequências não executadas e retorna `failedResource` e `thirdsPassed`. Não existe período jogável novo: são passos internos da resolução diária. `Engine.next` salva o tempo efetivamente integrado e conserva o sol em que houve falha, sem avançar para outro evento. A falha prevalece inclusive no sol 40. Previsões usam a mesma interrupção, sem alterar o estado real. Chamadas sem a opção preservam a integração genérica dos fluxos.

A UI mostra imediatamente a falha de uma escolha e salva o final, sem apresentar o verso como se a missão continuasse. Falhas durante a resolução diária usam a animação de recursos existente antes de mostrar o final. A tela usa `failedTitle` e `failedBody-*` de `interface.json`, com botão New mission. No Easy, failedResource oxygen/water seleciona o mesmo texto life-support; Hard conserva as cinco causas. O save guarda a causa física, validada contra um estoque realmente zerado, e retoma o mesmo final sem reaplicar efeitos. Encerramento manual e sucesso permanecem distintos.

`mission.dailyCostMultiplier` (opcional, positivo, padrão 1) multiplica somente os fluxos-base cujo amount é negativo. Está em 3 para teste, em ambos os modos, e novas missões aplicam o fator somente ao recurso escolhido em Faster daily use; Normal daily use é o padrão. Produção positiva e efeitos imediatos/contínuos/agendados das cartas não são multiplicados. Os coeficientes de referência em `flows.json` permanecem originais; o multiplicador é balanceamento de teste, não nova referência científica. Novas missões usam o valor atual; saves mantêm seu snapshot de dados. Remover o campo ou usar 1 restaura o consumo normal para novas missões. Blindagem não ganha consumo diário.

As telas finais sem imagem (e o fallback de carregamento) usam título e descrição ampliados e ícones próprios: Life Support com pulso interrompido, pulmões riscados (oxigênio), gota rachada (água), escudo rachado (blindagem), raio partido (energia) e caixa vazia (comida). Sucesso usa marca de confirmação e encerramento manual usa saída. Em espaços baixos, ícone e título ficam lado a lado; o painel de efeitos fica oculto ao encerrar para reservar espaço ao final. Os desenhos ficam em `src/icons.js` (`EndingIcons`) e são decorativos, pois o texto identifica o resultado.

## Início de nova missão e seleção de consumo

O botão do briefing e dos finais é **Start New Mission**. Ele abre o seletor sem confirmação de substituição. O save anterior só é substituído ao escolher Easy ou Hard; voltar ao briefing preserva Continue mission. Saves inválidos também podem ser substituídos sem confirmação.

Antes de escolher o modo, **Faster daily use** permite selecionar um recurso físico ou **Normal daily use** (padrão). Apenas os fluxos-base negativos do recurso escolhido recebem `mission.dailyCostMultiplier` (3). Produção e efeitos de cartas mantêm seus valores. Shield está identificado como sem consumo diário: selecionar essa opção não cria desgaste nem consumo por radiação. Água e oxigênio são opções físicas separadas também no Easy.

A escolha é guardada em `flows.dailyCostResource`: `null` significa consumo normal; um ID de recurso significa multiplicar somente seu consumo-base. A escolha atravessa respostas, integração, saves e reinício após recarga dos dados. Saves antigos sem esse campo preservam o multiplicador global de sua configuração original; não recebem silenciosamente a seleção atual. A confirmação de encerramento manual e o aviso de alteração por outra aba continuam independentes do início de missão.

## Imagens aprovadas das cartas de falha

As seis artes em `images/endings/` são usadas integralmente nas cartas de falha, incluindo seus textos e ícones. Os caminhos ficam em `data/interface.json` → `endingImage-life-support`, `endingImage-oxygen`, `endingImage-water`, `endingImage-shield`, `endingImage-energy` e `endingImage-food`. Easy usa Life Support para oxigênio/água; Hard usa as imagens físicas separadas. Blindagem, energia e comida compartilham imagens entre os modos.

A imagem mantém proporção sem corte e o botão Start New Mission fica fora dela. Título e descrição em HTML continuam disponíveis para leitores de tela; se a imagem falhar, aparecem com o ícone vetorial de fallback. Sucesso e encerramento manual mantêm suas telas com ícones vetoriais. `docs/previews/endings/` preserva os originais aprovados e os prompts. Nenhuma carta de falha entra no sorteio de eventos; a seleção decorre da causa de encerramento já salva.

## Menu inicial

A entrada normal abre um menu com Next Frontier e os botões **Start New Mission**, **Continue mission** e **Credits**, sem botão de sair. Continue mission fica visível, mas desativado quando não há save válido no localStorage (inclusive se o armazenamento estiver indisponível ou o save for inválido), acompanhado de “No saved mission yet.”. O fundo `assets/images/mars-menu.svg` deriva do estilo geométrico de Marte e inclui habitats, antenas e painéis solares; o fundo durante a missão permanece o anterior.

Start New Mission abre o briefing da nova missão; Continue mission retoma diretamente a fase e o modo salvos, sem passar pelo briefing. A continuação não aparece mais como botão dentro do briefing. Nessa tela foram removidos o rótulo “Next Frontier · Mission briefing” e o parágrafo “Look after…”. Não há tutorial implementado nesta alteração. Créditos abrem um diálogo com a atribuição da imagem NASA e das ilustrações geradas.

O menu não altera nem apaga o save. Continuar restaura a missão existente; escolher uma nova missão mantém o fluxo atual. A recarga interna usada para iniciar uma nova missão com dados atuais mantém a seleção de modo/consumo e vai direto ao jogo. Se a inicialização falhar, o aviso e Try again continuam acessíveis na tela de briefing. Textos novos ficam em `data/interface.json`; a navegação e os diálogos ficam em `src/ui.js`.

O menu é mobile-first e usa uma única coluna centralizada horizontal e verticalmente em celulares, tablets e desktop, em ambas as orientações. Título, textos dos botões e aviso de save são centralizados. A largura é limitada a 360 px na base e 440 px em telas a partir de 768 px com altura suficiente; telas baixas usam tipografia e espaçamentos compactos, preservando os alvos de toque e as safe areas. Ícones decorativos identificam as três ações. Os botões têm fundo sólido, foco visível e estado desativado explícito, sem depender de transparência sobre a paisagem.

Para impedir mistura de HTML novo com CSS/módulos/textos antigos do cache, os links de CSS e bootstrap no HTML usam a mesma versão de assets (`v`). O bootstrap propaga essa versão aos módulos (inclusive validation) e busca os JSONs com `cache: no-store`. Ao mudar a versão de assets em uma entrega, atualizar os dois links do HTML juntos. Os snapshots de regras das missões salvas continuam preservados; os textos atuais seguem prioritários.
