# Arquitetura atual — Next Frontier

Consolidada em **15/11/2026** a partir do código atual. Este documento descreve a implementação vigente; a cronologia anterior foi preservada em [docs/history/ARCHITECTURE.md](docs/history/ARCHITECTURE.md). Regras do produto estão em [AGENTS.md](AGENTS.md); execução e edição, em [README.md](README.md); referências científicas, em [docs/RESEARCH.md](docs/RESEARCH.md).

## Organização

| Caminho | Responsabilidade |
| --- | --- |
| `index.html` | Briefing, seletor, estrutura do jogo, detalhes e diálogos |
| `data/mission.json` | Tripulação, duração do sol, duração da missão, eventos/sol e configurações dos modos |
| `data/resources.json` | Quantidades, capacidades, unidades, descrições e indicadores |
| `data/categories.json` | IDs, nomes e probabilidades das categorias |
| `data/cards.json` | Treze cartas do CSV, escolhas, descrições, percentuais autorais, efeitos em unidades de simulação, imagens, legendas, fontes e probabilidades condicionais |
| `data/flows.json` | Consumos/produções, bases de conversão e classificação reference/simulated |
| `data/interface.json` | Textos, templates, imagem e crédito do briefing |
| `src/bootstrap.js` | Carregamento HTTP, validação, leitura do save, inicialização e tratamento de falha |
| `src/validation.js` | Validação dos dados e snapshots salvos; compatibilidade com saves anteriores |
| `src/indicators.js` | Estoques físicos e índice Shield, aplicação de efeitos e limites 0–capacidade |
| `src/mission.js` | Relógio, sorteio de 1/2 eventos e encerramento |
| `src/flows.js` | Conversão de coeficientes, fluxos contínuos e efeitos futuros |
| `src/deck.js` | Validação, filtragem por dificuldade e sorteio ponderado categoria → carta |
| `src/engine.js` | Ações puras sobre snapshots: start, answer, next, end |
| `src/display.js` | Conversão física/inteiros normalizados, arredondamento e variações exibidas |
| `src/icons.js` | Desenhos compartilhados entre indicadores e resultados das cartas |
| `src/audio.js` | Sons: efeitos das ações, música e som da nave em loop, botão de som |
| `src/card-ui.js` | Frente/verso, legendas, escolhas, efeitos e gestos da carta |
| `src/ui.js` | Orquestração da interface, modos, detalhes, animações, saves e tablet oculto |
| `assets/style.css` | Layout responsivo, apresentação visual, animações e movimento reduzido |
| `assets/images/mars-window.svg` | Paisagem decorativa de Marte |
| `images/` | Imagem NASA do briefing e imagem mock das cartas |
| `tests/` | Sete suítes Node e helper de carregamento do motor |
| `.github/workflows/pages.yml` | Testes, empacotamento estático e deploy GitHub Pages |

## Inicialização e dependências

O navegador abre o HTML por HTTP e importa `bootstrap.js` como módulo nativo. O bootstrap lê os seis JSONs em paralelo, valida os dados e tenta validar o save. Se válido, usa o snapshot dos dados salvo para as regras da partida; os textos atuais da interface têm prioridade. Preenche o HTML e importa, em sequência, indicators → mission → flows → deck → engine → icons → display → glossary → audio → card-ui → tutorial → ui.

Os arquivos carregados são módulos do navegador, mas ainda expõem suas APIs pelo `globalThis`; a ordem importa. Os testes usam `vm` para carregar a lógica e importar a validação. Não há framework, instalação de dependências ou etapa de build obrigatória. Caminhos relativos atendem tanto a raiz quanto subdiretórios de hospedagem estática. `file://` não é suportado.

Uma falha de fetch/JSON/validação na inicialização é registrada no console e mostra um aviso com **Try again**. Save inválido é preservado, com substituição sem confirmação ao iniciar nova missão.

## Dados e sorteio

Configuração padrão: 4 astronautas, 40 sols, 80% de um evento e 20% de dois. `Engine.start(random, difficulty)` gera o cronograma completo e pede ao Deck exatamente a soma dos eventos: de 40 a 80 cartas.

| Categoria | Probabilidade-base |
| --- | ---: |
| Routine | 35% |
| Maintenance | 25% |
| Exploration | 15% |
| Science | 20% |
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
5. Ao concluir o sol 40 sem falha, marca `ended: true`, `reason: 'complete'`; não exibe um sol 41. Recurso zerado encerra com `reason: 'failed'` e `failedResource`; encerramento manual usa `reason: 'quit'`.

`mission.elapsed` usa terços inteiros de sol, sem períodos jogáveis. Fluxos são aplicados em três passos internos por sol. Coeficientes `perCrewEarthDay` multiplicam amount por crew × solHours/24; os `perSol` já são totais diários. Cada passo respeita os limites do estoque e executa efeitos agendados quando devidos. Blindagem não é consumida por radiação.

Recursos internos: O₂ em kg, água em L, Shield em pontos de 0 a 100%, energia em kWh e comida seca em kg. Valores iniciais e capacidades são escolhas de protótipo nos JSONs, não dimensionamento científico de uma base.

## Apresentação dos recursos e animações

Hard mostra unidades físicas nos estoques; Easy usa `round(value / max * 100)`, sem unidade nos estoques. Shield usa a mesma escala 0–100 e símbolo % nos dois modos. Arredondamento é simétrico para sinais e somente visual: valores fracionários continuam no estado e no save. Variações reais/previsões são a diferença entre os inteiros antes e depois. Efeitos imediatos do verso podem usar a reserva anterior e o limite da capacidade; taxas e efeitos futuros são convertidos e arredondados como quantidades previstas. Mudanças sem alteração no inteiro não mostram número flutuante no Easy.

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

O modo Hard exibe um painel inferior com três espaços quadrados. Efeitos contínuos e consequências agendadas das escolhas ocupam os espaços, com ícones dos recursos afetados. Hover, foco de teclado ou toque abrem o detalhe; um segundo toque no mesmo ícone fecha. O detalhe mostra nome, impacto físico por sol (ou alteração única agendada) e tempo restante/espera. Efeitos encerrados desaparecem. O painel funciona como fila de três ícones, sem paginação: um novo efeito remove o efeito mais antigo e seu ícone, deslocando os demais para a esquerda. O efeito retirado é cancelado: suas taxas futuras param e mudanças agendadas ainda não aplicadas são descartadas. Alterações já causadas nos recursos não são revertidas; efeitos removidos não voltam quando outro termina. Efeitos imediatos continuam apresentados no verso, pois não têm taxa por sol. O painel não aparece no Easy e o botão do tablet continua oculto.

## Life Support no Easy

No Easy, a HUD tem quatro indicadores: **Life Support**, Radiation Shield, Energy Supply e Food Stock. Life Support usa uma cruz de saúde e substitui visualmente Oxygen Level e Water Stock. No Hard continuam os cinco indicadores separados.

A fusão é somente visual. O motor, os JSONs de cartas/fluxos e o save mantêm oxigênio em kg e água em L como estoques independentes, com seus próprios limites, consumos, produção e transferências. Não somar nem converter água em oxigênio por causa do indicador.

O nível é `round(100 × min(oxygen / oxygen.max, water / water.max))`, sem unidade ou símbolo %. A proporção mínima é calculada com o estado físico completo, sem arredondamento interno. Exemplo: oxigênio 60/100 e água 80/100 mostram Life Support 60. O indicador representa disponibilidade relativa limitada pelo menor estoque proporcional, não uma média nem tempo de sobrevivência.

Previsões integram um sol com os fluxos existentes e comparam o Life Support arredondado antes/depois, incluindo troca do recurso limitante. Animações e contornos usam essa mesma diferença, sem somar deltas dos componentes. Se só o estoque não limitante mudar e o inteiro combinado ficar igual, não há número flutuante nem destaque de mudança no indicador combinado.

O detalhe explica que Life Support combina o oxigênio respirado e a água bebida e informa o número combinado de Life Support (0 a 100, sem unidade ou %) e a variação combinada prevista após um sol. Não mostra capacidade ou números separados de Oxygen e Water. A previsão usa o índice arredondado antes/depois; pode indicar queda, aumento ou estabilidade. Em paisagem baixa, o detalhe usa tipografia compacta. No verso, cada alteração conserva seu próprio valor normalizado: aparece com a cruz e o nome Life Support, acompanhado de “Changes water” ou “Changes oxygen”. Esses valores são variações do componente identificado, não deltas somáveis do indicador combinado. Taxas e consequências futuras também conservam o componente identificado.

Nome, cor e descrição vêm de `data/resources.json` → `easyLifeSupport`; a cruz é desenhada em `src/icons.js`. O cálculo e a seleção dos indicadores pertencem a `src/display.js`. A configuração visual atual também atende saves Easy antigos, mantendo capacidades e estado da missão salva. Não há novo recurso físico nem migração do formato do save.

## Finais por esgotamento e multiplicador de teste

`Indicators.depleted` encontra o primeiro recurso interno em zero na ordem de `resources.quantities` (oxygen, water, shield, energy, food). Não usa os números arredondados do Easy. `Engine.checkFailure` aplica a regra às escolhas e à retomada de saves ativos antigos com estoque zerado. Saves de missões já encerradas são descartados no bootstrap.

`Flows.passTime(..., {stopOnEmpty: true})` verifica após o saldo de cada terço interno e após cada efeito agendado. Ao zerar, interrompe a integração, mantém consequências não executadas e retorna `failedResource` e `thirdsPassed`. Não existe período jogável novo: são passos internos da resolução diária. `Engine.next` salva o tempo efetivamente integrado e conserva o sol em que houve falha, sem avançar para outro evento. A falha prevalece inclusive no sol 40. Previsões usam a mesma interrupção, sem alterar o estado real. Chamadas sem a opção preservam a integração genérica dos fluxos.

A UI mostra imediatamente a falha de uma escolha e salva o final, sem apresentar o verso como se a missão continuasse. Falhas durante a resolução diária usam a animação de recursos existente antes de mostrar o final. A tela usa `failedTitle` e `failedBody-*` de `interface.json`, com botão New mission. No Easy, failedResource oxygen/water seleciona o mesmo texto life-support; Hard conserva as cinco causas. O save guarda a causa física, validada contra um estoque realmente zerado, e mantém o final somente na sessão atual, removendo o save ao encerrar. Encerramento manual e sucesso permanecem distintos.

`mission.dailyCostMultiplier` (opcional, positivo, padrão 1) multiplica somente os fluxos-base cujo amount é negativo. Está em 3 para teste, em ambos os modos, mas o seletor foi removido e novas missões usam consumo normal. Produção positiva e efeitos imediatos/contínuos/agendados das cartas não são multiplicados. Os coeficientes de referência em `flows.json` permanecem originais; o multiplicador é balanceamento de teste, não nova referência científica. Novas missões usam o valor atual; saves mantêm seu snapshot de dados. Remover o campo ou usar 1 restaura o consumo normal para novas missões. Blindagem não ganha consumo diário.

As telas finais sem imagem (e o fallback de carregamento) usam título e descrição ampliados e ícones próprios: Life Support com pulso interrompido, pulmões riscados (oxigênio), gota rachada (água), escudo rachado (blindagem), raio partido (energia) e caixa vazia (comida). Sucesso usa marca de confirmação e encerramento manual usa saída. Em espaços baixos, ícone e título ficam lado a lado; o painel de efeitos fica oculto ao encerrar para reservar espaço ao final. Os desenhos ficam em `src/icons.js` (`EndingIcons`) e são decorativos, pois o texto identifica o resultado.

## Início de nova missão e seleção de consumo

O botão do briefing e dos finais é **Start New Mission**. Ele abre o seletor sem confirmação de substituição. O save anterior só é substituído ao escolher Easy ou Hard; voltar ao briefing preserva Continue mission. Saves inválidos também podem ser substituídos sem confirmação.

O seletor Faster daily use foi removido da interface. Novas missões usam consumo normal (`dailyCostResource: null`). O motor ainda entende o multiplicador e o recurso selecionado em saves antigos, preservando o comportamento com que começaram. Shield continua sem consumo diário.

A escolha é guardada em `flows.dailyCostResource`: `null` significa consumo normal; um ID de recurso significa multiplicar somente seu consumo-base. A escolha atravessa respostas, integração, saves e reinício após recarga dos dados. Saves antigos sem esse campo preservam o multiplicador global de sua configuração original; não recebem silenciosamente a seleção atual. A confirmação de encerramento manual e o aviso de alteração por outra aba continuam independentes do início de missão.

## Imagens aprovadas das cartas de falha

As seis artes em `images/endings/` são usadas integralmente nas cartas de falha, incluindo seus textos e ícones. Os caminhos ficam em `data/interface.json` → `endingImage-life-support`, `endingImage-oxygen`, `endingImage-water`, `endingImage-shield`, `endingImage-energy` e `endingImage-food`. Easy usa Life Support para oxigênio/água; Hard usa as imagens físicas separadas. Blindagem, energia e comida compartilham imagens entre os modos.

A imagem mantém proporção sem corte e o botão Start New Mission fica fora dela. Título e descrição em HTML continuam disponíveis para leitores de tela; se a imagem falhar, aparecem com o ícone vetorial de fallback. Sucesso e encerramento manual mantêm suas telas com ícones vetoriais. `docs/previews/endings/` preserva os originais aprovados e os prompts. Nenhuma carta de falha entra no sorteio de eventos; a seleção decorre da causa de encerramento já salva.

## Menu inicial

A entrada normal abre um menu com Next Frontier e os botões **Start New Mission**, **Continue mission** e **Credits**, sem botão de sair. Continue mission fica visível, mas desativado quando não há save válido no localStorage (inclusive se o armazenamento estiver indisponível ou o save for inválido), acompanhado de “No saved mission yet.”. O fundo `assets/images/mars-menu.svg` deriva do estilo geométrico de Marte e inclui habitats, antenas e painéis solares; o fundo durante a missão permanece o anterior.

Start New Mission abre o briefing da nova missão; Continue mission retoma diretamente a fase e o modo salvos, sem passar pelo briefing. A continuação não aparece mais como botão dentro do briefing. Nessa tela foram removidos o rótulo “Next Frontier · Mission briefing” e o parágrafo “Look after…”. Novas missões Easy e Hard mostram o tutorial descrito abaixo. Créditos abrem um diálogo com a atribuição da imagem NASA e das ilustrações geradas.

O menu não altera nem apaga o save. Continuar restaura a missão existente; escolher uma nova missão mantém o fluxo atual. A recarga interna usada para iniciar uma nova missão com dados atuais mantém a seleção de modo/consumo e vai direto ao jogo. Se a inicialização falhar, o aviso e Try again continuam acessíveis na tela de briefing. Textos novos ficam em `data/interface.json`; a navegação e os diálogos ficam em `src/ui.js`.

O menu é mobile-first e usa uma única coluna centralizada horizontal e verticalmente em celulares, tablets e desktop, em ambas as orientações. Título, textos dos botões e aviso de save são centralizados. A largura é limitada a 360 px na base e 440 px em telas a partir de 768 px com altura suficiente; telas baixas usam tipografia e espaçamentos compactos, preservando os alvos de toque e as safe areas. Ícones decorativos identificam as três ações. Os botões têm fundo sólido, foco visível e estado desativado explícito, sem depender de transparência sobre a paisagem.

Para impedir mistura de HTML novo com CSS/módulos/textos antigos do cache, os links de CSS e bootstrap no HTML usam a mesma versão de assets (`v`). O bootstrap propaga essa versão aos módulos (inclusive validation) e busca os JSONs com `cache: no-store`. Ao mudar a versão de assets em uma entrega, atualizar os dois links do HTML juntos. Os snapshots de regras das missões salvas continuam preservados; os textos atuais seguem prioritários.

## Tutorial modal da missão

`src/tutorial.js` expõe `MissionTutorial.create`. `ui.js` o inicia depois de renderizar e salvar a primeira carta de uma nova missão de qualquer modo. Easy tem cinco etapas: os quatro indicadores atuais de ResourceDisplay, na ordem da HUD, e a carta real. Hard tem sete: os cinco indicadores, o painel real de efeitos e a carta. A continuação de saves não inicia a guia. Se houver recarga durante a guia, o save retoma a primeira carta sem escolhas já aplicadas e sem reiniciar a guia; a apresentação não é persistida.

O diálogo nativo `mission-tutorial` torna o restante da página inerte e mantém o foco em seus controles. Um realce com sombra ao redor destaca o elemento real. A explicação tenta se posicionar abaixo/acima ou ao lado do alvo, recalculando em resize e visualViewport resize; texto longo tem overflow interno de segurança. No passo da carta, celulares em retrato reservam temporariamente uma margem maior antes dela para a explicação não a cobrir; fechar/pular restaura o layout normal. Cada etapa de recurso chama a mesma renderização dos detalhes e copia somente descrição e previsão, sem duplicar regras científicas ou cálculo.

A última etapa adiciona `tutorial-demo` à carta real: deslocamento contínuo de 18 px nos dois sentidos e rotação de 3 graus, até Let’s play! ou Skip tutorial. O botão correspondente usa o mesmo preenchimento `.lean` do arrasto real, sincronizado com o relógio da animação CSS. É apenas uma animação CSS, sem disparo de gestos nem chamadas de Engine.answer. Movimento reduzido elimina a animação. `CardUI` aceita o guard canAnswer e expõe demonstrate; `ui.js` também bloqueia respostas/avanços de partida durante a guia, inclusive cliques programáticos.

Next, gesto horizontal em qualquer sentido e setas mudam de etapa; a última permanece em demonstração até clicar em Let’s play!. Skip tutorial e Escape fecham em qualquer etapa. O teclado é contido no diálogo, inclusive na etapa final, para não escolher uma alternativa ao fechar. Encerrar/pular remove a animação e devolve o foco à primeira escolha da carta. Os textos curtos em inglês ficam em `interface.json` sob `tutorial*`; não há consumo de sol nem efeitos de cartas durante a guia.

O tutorial não exibe contador de etapas nem a dica “Swipe sideways or tap the button”. Os gestos e setas continuam avançando as etapas de indicadores; no passo final, não encerram a demonstração. Let’s play! inicia o jogo; Skip tutorial e Escape continuam disponíveis para pular.

No tutorial Hard, a etapa Lasting effects destaca os três espaços reais do painel, sem criar efeitos fictícios. Explica alterações por sol e eventos agendados, sem explicar a remoção de efeitos pela fila. Em celulares em retrato, somente no passo da carta o painel é ocultado temporariamente para manter a carta legível; ao concluir ou pular, ele reaparece sem alterar os efeitos.

## Limite real de três efeitos

`Flows.MAX_EFFECTS` centraliza o limite de três efeitos de cartas, compartilhado entre ongoing e later, em ambos os modos. `Flows.limitEffects` filtra efeitos encerrados/antigamente ocultos e mantém os três de maior panelOrder. `addAnswer` aplica o limite ao estado: o efeito mais antigo é removido das coleções, em vez de marcado como oculto. Mais de três efeitos criados pela mesma escolha também preservam somente os três últimos, na ordem de registro (ongoing, depois later). Fluxos-base e efeitos imediatos não ocupam esses espaços.

Taxas de um efeito removido param nas integrações futuras, e consequências agendadas removidas não disparam. O cancelamento não reverte estoques alterados antes dele, não restitui recursos consumidos e não reativa efeitos anteriores quando uma vaga fica livre. Previsões, active e integração usam a mesma normalização. `Engine.checkFailure` normaliza saves antigos na retomada; a UI salva essa migração quando os fluxos mudam, preservando estado físico, relógio e sequência.

O tutorial do painel fala somente sobre consultar alterações por sol e eventos agendados; a regra de cancelamento não aparece na explicação ao jogador.

## Importação das 13 cartas autorais

`scripts/import_event_cards.py` lê o CSV original sem modificá-lo, localiza o cabeçalho Id, ignora linhas sem ID e exige os 13 IDs únicos. Liga cada ID à única imagem correspondente em `images/cards/`, respeitando JPG/PNG. Dificuldades vêm do CSV. Categorias são uma classificação editorial por assunto; as probabilidades-base continuam as atuais e as chances das cartas são iguais dentro de cada categoria. Easy tem oito cartas elegíveis e exclui Exploration, cuja única carta é Hard; Hard tem as 13.

Influências separadas por `\` ou `/` são pares da resposta 1/2. O importador usa Decimal para converter pontos percentuais da capacidade para kg, L, kWh e pontos percentuais de Shield, sem arredondar estado em execução. Vazios e pares vazios viram zero. `effects` é o valor nas unidades de simulação usado pelo motor; `effectPercentages` é metadado numérico de auditoria e a validação verifica sua correspondência com a capacidade. Alterar capacidades exige regenerar os efeitos antes de iniciar novas missões.

A primeira resposta é left e a segunda right. Rótulos e descrições da frente são curtos; as respostas completas ficam nas descrições do verso, com a menção da carta 10 a 15 kWh ajustada à bateria atual; `sourceResponse` e `sourceDescription` preservam os textos originais. A segunda resposta da carta 7 e as duas da 8 foram completadas por autorização. Não foram inventadas taxas, durações, colheitas ou SFX. Textos 8/10 evitam a capacidade de 15 kWh de outro equipamento; cartas 10/13 são independentes de uma escolha anterior, conforme o sorteio com reposição.

Referências preenchidas no CSV usam `source.kind: reference`; sem referência, o importador omite source e a UI oculta a linha no verso. Saves antigos com `source.kind: image` também têm essa linha ocultada. `imageSource` preserva a origem informada para cada imagem. Os coeficientes de efeito são balanceamento do autor, não medições dos artigos citados. `source.kind`, `sourceDescription`, `sourceResponse`, `imageSource` e `effectPercentages` são opcionais para continuar validando saves anteriores.

A substituição afeta o catálogo de novas missões. Snapshots anteriores mantêm cartas, sequência e dados físicos salvos; o asset mock não é removido para não quebrar essas partidas. [Auditoria do conteúdo](docs/CARDS.md).

## Escala percentual de Shield e migração

`resources.quantities.shield` usa `max: 100`, `unit: %` e `unitName: percent`. Shield é um índice abstrato; os outros quatro recursos continuam físicos. `ResourceDisplay.read` arredonda Shield para inteiro com % em ambos os modos. Mudanças reais usam a diferença dos valores arredondados; frações permanecem no motor. Não se aplica conversão física de água para pontos do índice.

O bootstrap valida o save antigo com `allowLegacyShield` e chama `migrateShieldSave` antes de importar o motor/UI. Para a unidade antiga g/cm², multiplica os valores de Shield por `100 / old.max`: estado, estoque inicial, cards/deck, efeitos imediatos, rates ongoing, later, fluxos-base e cardChanges. Copia os objetos sem mutar a origem nem aplicar o fator duas vezes a cartas compartilhadas. Percentuais originais de auditoria, relógio, sequência, dificuldade e resultados da missão em andamento são preservados. Infinity continua sendo serializado pelo marcador existente.

O resultado é validado e salvo automaticamente; se a gravação falhar, a partida convertida continua disponível em memória. A migração é idempotente: saves com unidade % e capacidade 100 não são convertidos novamente. Novos dados exigem a escala percentual; a escala g/cm² é aceita somente para carregar e migrar saves antigos. O formato do slot continua na versão 1, discriminando a escala pela unidade/capacidade.

## Capacidades e partida em andamento

Novas missões usam os máximos O₂ 200 kg, água 1900 L, comida seca 235 kg, energia 1480 kWh e Shield 100 pontos. Os estoques iniciais são 75% dos máximos no Easy e 50% no Hard; as perdas diárias seguem a seção abaixo. São parâmetros de balanceamento, não dimensionamento científico. Efeitos percentuais das cartas foram recalculados com essas capacidades. Partidas em andamento preservam seu snapshot de capacidades e cartas.

O único slot de localStorage guarda somente a última missão em andamento. Iniciar outra missão substitui esse slot; terminar com sucesso, falhar ou desistir remove o save. A tela final continua visível na sessão atual, mas não é retomada após recarregar. Saves antigos já encerrados são descartados na inicialização e não habilitam Continue mission. Nenhum histórico de partidas é armazenado.

## Perdas diárias atuais

Em novas missões, o saldo-base por sol da base inteira de quatro pessoas é O₂ −3,5 kg, água −10 L, energia −5 kWh e comida seca −2,6 kg. Shield não perde pontos diariamente. `data/flows.json` usa `basis: perSol` e `kind: simulated`: são valores de balanceamento definidos pelo autor, sem multiplicação adicional por tripulação ou duração do sol. Não há produção automática de oxigênio ou energia compensando essas perdas. Efeitos das cartas continuam adicionais. Novas missões aplicam esses valores sem multiplicador; saves antigos com consumo acelerado conservam seu ajuste. Saves em andamento preservam seus fluxos anteriores.

## Recursos iniciais por modo

`mission.difficulties.easy.initialResourceFraction` é 0,75; Hard usa 0,5. `Engine.start` multiplica a capacidade de cada recurso pela fração do modo, incluindo Shield, sem arredondar o estado. Easy começa com O₂ 150 kg, água 1425 L, comida 176,25 kg, energia 1110 kWh e Shield 75 pontos. Hard começa com O₂ 100 kg, água 950 L, comida 117,5 kg, energia 740 kWh e Shield 50 pontos. Life Support inicia em 75 no Easy. Valores start em resources.json são apenas o fallback para configurações antigas sem a fração; não determinam os estoques das novas missões atuais. A regra só é aplicada ao iniciar: continuar restaura os valores salvos sem recalcular.

## Glossário

Glossary no menu inicial abre os dez termos de `data/glossary.json`, com nomes e definições em inglês simples. O glossário atual é usado também para partidas antigas, sem alterar seus dados de simulação. `src/glossary.js` destaca aliases completos, sem diferenciar maiúsculas, em legendas, enunciados, alternativas e descrições/efeitos do verso. Usa nós de texto, sem interpretar HTML; aliases mais longos têm prioridade. Os termos recebem cor e sublinhado pontilhado. Hover, toque ou foco de teclado mostram a definição em um popover acima da interface. Escape, toque fora ou mudança de carta fecham; consultar um termo não escolhe uma resposta nem inicia arrasto. A lista do menu tem rolagem interna em telas pequenas. Fontes e URLs não são anotadas.

## Seleção das missões MARINER 4 e OPPORTUNITY

O modo interno Easy aparece como MARINER 4, com recursos iniciais em 75%; Hard aparece como OPPORTUNITY, com recursos em 50%. A tela conserva as indicações Easy/Hard e de idade para esclarecer a dificuldade. Arrastar o painel para a esquerda escolhe MARINER 4; para a direita, OPPORTUNITY. O painel acompanha o gesto e realça a alternativa ao ultrapassar o limiar; soltar antes dele ou cancelar não inicia missão. Toques nos botões e setas de teclado continuam disponíveis. Faster daily use foi retirado da tela: novas missões usam consumo normal. Saves existentes conservam seus ajustes e IDs internos easy/hard.

## Fontes das cartas e das imagens

O verso mostra Source somente quando a carta possui uma referência preenchida; não mostra Image source nem reserva espaço quando source está ausente. O importador usa somente a coluna Referência para source. A origem da imagem permanece separada em imageSource e aparece ao final da legenda: “Image source:” seguida de um link com o domínio. Sem origem informada, o rótulo permanece e o valor fica vazio. O link abre em outra aba e não inicia arrasto da carta. Saves antigos com source de tipo image têm a origem na legenda, sem essa linha no verso.

## Áudio

`src/audio.js` cria `GameAudio` antes de `card-ui` e `ui`, que o chamam com `globalThis.GameAudio?.play(nome)`. O motor (`engine`, `flows` etc.) não conhece sons.

| Ponto no código | Som |
| --- | --- |
| `ui.js`, `pointerdown` na linha de indicadores (tile) e `keydown` Enter/Espaço | `button` |
| `card-ui.js`, `answer(side, how)`: `how = 'button'` para botões e setas, `'swipe'` para arrasto além do limiar; só toca se a resposta for aceita | `button` / `swipe` |
| `card-ui.js`, botão Next/Finish do verso | `button` |
| `ui.js`, `onNext` → `finish()` da passagem de sol, se a missão não terminou | `sol` |

Loops (`music`, `ship`): `Audio` com `loop`, iniciados no primeiro `pointerdown`/`pointerup`/`touchend`/`click`/`keydown` (fase de captura) e removidos esses ouvintes quando um `play()` dá certo. Começam no volume 0 e sobem em 1,5 s. `visibilitychange` pausa/retoma. `bindToggle(botão, render)` liga os dois botões de som ao mesmo estado; `setEnabled` grava `next-frontier-sound`. `loopVolumes()` ajuda a conferir os volumes no console.

Validação feita: no navegador (via HTTP), registrando as chamadas de `play()`: menu → loops; toque no indicador → button; hover → nada; resposta por botão/seta → button; Next → button; passagem para o Sol 2 → sol; arrasto à direita/esquerda → swipe; arrasto curto → nada; som desligado → nenhum efeito, loops pausados, preferência salva. *Fade-in* e silêncio conferidos com `Audio` simulado no Node. O volume relativo música × nave foi definido de ouvido pelos valores acima e deve ser ajustado ouvindo no dispositivo.
