# Arquitetura atual — Mission: Perseverance

Revisada contra o código e os JSONs em **15/11/2026**. Orientações em [AGENTS.md](AGENTS.md), execução em [README.md](README.md), conteúdo em [docs/CARDS.md](docs/CARDS.md) e [docs/GLOSSARY.md](docs/GLOSSARY.md). Pesquisa em [docs/RESEARCH.md](docs/RESEARCH.md); cronologia anterior em [docs/history/](docs/history/), sem valor de regra atual.

## Organização e inicialização

| Caminho | Responsabilidade |
| --- | --- |
| `index.html` | Menu, briefing, seletor, HUD, carta e diálogos |
| `data/mission.json` | 25/30 sols por dificuldade, quatro astronautas, eventos/sol, modos e frações iniciais |
| `data/resources.json` | Unidades, máximos, descrições, indicadores e Life Support visual |
| `data/cards.json`, `data/categories.json` | 31 cartas e pesos gerados das planilhas |
| `data/flows.json` | Quatro perdas-base por sol, classificadas simulated |
| `data/interface.json`, `data/glossary.json` | Textos/caminhos da apresentação e 41 termos com aliases |
| `src/bootstrap.js`, `src/validation.js` | Fetch/validação, compatibilidade do save e inicialização |
| `src/indicators.js`, `src/mission.js` | Estado dos recursos, limites, relógio e condições de encerramento |
| `src/flows.js`, `src/deck.js`, `src/engine.js` | Integração, sorteio e ações puras sobre snapshots |
| `src/display.js`, `src/icons.js` | Unidades/normalização visual e desenhos dos ícones |
| `src/card-ui.js`, `src/card-images.js` | Frente/verso, escolhas/gestos e resolução das imagens por ID |
| `src/ui.js`, `src/tutorial.js`, `src/glossary.js` | Navegação, saves/animações, onboarding e definições |
| `src/audio.js`, `sfx/` | Efeitos e dois loops de fundo |
| `assets/style.css`, `assets/images/` | Layout/animações e fundos ilustrados do menu/jogo |
| `images/` | Briefing, eventos, placeholder e finais |
| `scripts/import_event_cards.py` | Importação editorial das duas planilhas |
| `tests/`, `package.json` | Dez suítes Node, sem dependências npm |
| `.github/workflows/pages.yml` | Teste e publicação do pacote estático |

O bootstrap lê **sete JSONs** em paralelo: categories, mission, resources, flows, cards, interface e glossary. Expõe CurrentGameData, tenta restaurar/migrar um save e define GameData como o snapshot salvo ou os dados atuais. Copy prioriza os textos da interface atual e interpola os parâmetros da missão. Falha de carregamento/validação mostra Try again; save inválido permite começar outra missão.

Ordem dos módulos: indicators → mission → flows → deck → engine → icons → display → glossary → audio → card-images → card-ui → tutorial → ui. São módulos nativos com APIs em globalThis; a ordem importa. HTML e CSS/bootstrap compartilham versão v, propagada aos módulos; JSONs usam cache: no-store. HTTP obrigatório; sem framework/build. Caminhos atendem também hospedagem em subdiretório.

Uma camada opaca “Loading…” cobre o carregamento inicial e as transições de tela, incluindo a recarga ao substituir uma missão salva. Bloqueia interação com as telas cobertas e aguarda imagens visíveis por até quatro segundos, liberando a interface também quando uma imagem falha. Movimento reduzido mantém o indicador estático.

## Navegação e início

Menu centralizado mobile-first com Start New Mission, Continue mission, Glossary e som (Credits está oculto). Continue exige save válido em andamento. Nova missão abre briefing NASA; botão, arrasto ou setas levam ao seletor Welcome, Captain!. Operation Steins é easy, Operation Gate é hard. Arrastar o painel à esquerda/direita escolhe respectivamente easy/hard, com movimento e realce antes de soltar; gesto curto/cancelado não inicia. Botões/setas também funcionam.

O briefing/seletor não substitui o save; escolher modo substitui sem confirmação. Se GameData veio de um save, a UI recarrega usando sessionStorage para transportar a escolha e iniciar com CurrentGameData. Novas missões passam `dailyCostResource: null`, sem seletor de consumo acelerado. End mission mantém diálogo de confirmação.

`Engine.start` gera um cronograma de 25 entradas no Easy ou 30 no Hard, cada uma com 1 evento (80%) ou 2 (20%), e sorteia um baralho de 25–50 eventos no Easy ou 30–60 no Hard. Inicializa cada recurso com `max × initialResourceFraction`: 0,75 no Easy, 0,5 no Hard. Sem esse parâmetro, usa o fallback start de resources.json. Não arredonda o estado.

## Catálogo, probabilidades e fontes

14 cartas da Página1 + 17 da Página2 = 31 eventos. Colisões 5/9/11 usam IDs internos page1-5/page1-9/page1-11 nas versões da Página1; imageId/sourceCardId preservam o número original e catalogSheet identifica a planilha. As cartas compartilhadas continuam eventos distintos.

| Categoria | Cartas | Peso-base |
| --- | ---: | ---: |
| Routine | 9 | 9/31 |
| Maintenance | 9 | 9/31 |
| Exploration | 1 | 1/31 |
| Science | 5 | 5/31 |
| Emergency | 7 | 7/31 |

O importador atualiza cards.json e categories.json: peso da categoria = contagem/total; peso da carta = 1/contagem da categoria. Não arredondar os pesos. Categorias somam 1 e cartas somam 1 por categoria, tolerância 1e-9. Sorteios categoria → carta, com reposição, excluindo o ID anterior a cada sorteio. Os pesos conjuntos restantes são normalizados, inclusive quando uma categoria fica temporariamente sem opções. A regra vale dentro do mesmo sol e entre sols; saves existentes preservam a sequência já sorteada. Menos de dois eventos elegíveis impede gerar uma sequência com mais de uma carta.

Easy permite easy/medium (27 cartas); Hard, os três níveis (31). Deck valida o catálogo original, filtra cartas, remove categorias vazias e normaliza os pesos existentes. Os pesos-base das categorias não são recalculados pela contagem filtrada: no Easy, os eventos elegíveis de cada categoria continuam iguais entre si, mas não têm necessariamente a mesma chance global de cartas de outra categoria. Conjunto sem opções elegíveis gera erro.

A Página2 usa pares resposta 1 // resposta 2 com unidades; a Página1 aceita barras simples/duplas/invertidas e unidades opcionais. Os valores atuais são kg, L, kWh e pontos de Shield, sem multiplicação pela capacidade. Notas laterais de capacidades não alteram recursos. Textos curtos da frente/botões são editoriais; sourceDescription/sourceResponse preservam os originais; respostas completas aparecem no verso.

`source` é opcional e vem de Sources/Referência, nunca do link da imagem como substituto. Source do verso admite `source.references` para múltiplos links; campos vazios não ocupam espaço. Metadados sourceVerified/sourceSideEffects/sourceNotes são de auditoria, sem execução. O Side effects de 9 não gera fluxo contínuo. [Regras e ressalvas das fontes/imagens](docs/CARDS.md).

## Imagens e apresentação das cartas

CardImages procura `images/cards/{imageId ?? id}.webp`, `.jpg`, `.png`, `.jpeg` quando imageById é true; cartas antigas sem isso usam image. Há 28 imagens distintas válidas para os 31 eventos. Sem imagem decodificável, mostra placeholder.svg e legenda/alt Image not available yet.; tenta novamente em 15 s enquanto a frente estiver aberta. A primeira tentativa usa URL estável para reutilizar o cache; somente novas tentativas após falha recebem URL nova para evitar cache negativo. Durante cada tentativa, o painel da imagem exibe “Loading image…” com indicador animado (estático com movimento reduzido) e aria-busy. Sucesso aguarda a decodificação; falha encerra o indicador e mantém o placeholder até a próxima tentativa. Cancelamento ao trocar carta/face impede resposta assíncrona trocando a imagem seguinte.

A legenda descreve o arquivo e sempre termina com Image source:; quando informado, exibe link com domínio e abertura em nova aba. Sem origem, mantém o rótulo vazio. Para saves de mesmo ID/caminho (ou mesmo imageId para imagens por ID), legenda/alt atuais têm prioridade; link de imagem vem separado de Source. A correspondência exata entre alguns arquivos e páginas informadas não foi certificada.

Frente contém imagem, legenda, problema e botões; sem dificuldade/contador de eventos na HUD. Verso contém escolha, descrição opcional, efeitos imediatos, fonte opcional e avanço. Campos de texto usam nós de texto/textContent, sem executar HTML do conteúdo. SVGs vêm do código.

Arrasto real começa após 8 px, acompanha o deslocamento e inclina a carta. Ao ultrapassar 28% da largura, realça a alternativa; soltar além do limiar responde. Botões/setas também respondem. Consultar termo do glossário ou link não inicia arrasto. Apenas a face visível é acessível por foco/leitor de tela.

O painel inferior de efeitos foi removido. O tablet de relatório ainda existe (com paginação e efeitos legados), mas seu botão está oculto. Mãos removidas. A página não rola; usar safe areas, altura dinâmica e overflow interno para textos extensos.

As imagens exibidas usam WebP com qualidade 82, sem metadados e sem ampliar originais menores. Cartas têm limite de 960×960 px, preservando proporção; briefing e finais têm limite de 1280×1280 px. Gerar com `python scripts/optimize_images.py` (ImageMagick). JPG/PNG/JPEG originais ficam preservados como fallback; pesquisas em `docs/previews/` não são publicadas. A hospedagem atual é Cloudflare Pages; o workflow GitHub Pages permanece como alternativa.

## Estado, tempo e falhas

Snapshot do motor: state, mission, flows, deck, index, eventIndex, schedule, savedSide. A UI acrescenta cardChanges ao persistir destaques.

1. `start` cria estado/cronograma/baralho e salva antes do tutorial.
2. `answer` aplica effects e registra fluxos, sem avançar tempo; ignora nova resposta se savedSide já estiver preenchido.
3. `next` avança à outra carta do mesmo sol ou integra um sol após a última carta.
4. `end` marca encerramento manual. A UI salva somente snapshots ativos e remove o slot ao encerrar.

mission.elapsed é um contador de terços de sol; cada sol integra três passos internos, sem fases jogáveis. O sucesso ocorre após 75 terços no Easy (sol 25) ou 90 no Hard (sol 30). A duração fica em mission.totalSols no snapshot; saves antigos sem esse campo usam data.mission.totalSols do próprio save. Saves mantêm sua duração original.

`Indicators.depleted` usa o valor interno real, nunca o inteiro visual. `Engine.checkFailure` verifica após resposta e na retomada; Flows.passTime com stopOnEmpty verifica cada passo e consequência agendada. Ao zerar, interrompe, sem permitir recuperação posterior no mesmo sol. Falha tem prioridade sobre sucesso. Empate segue oxygen, water, shield, energy, food.

O catálogo atual só usa effects imediatos. O motor ainda suporta ongoing (rates por sol, after/for opcionais) e later (efeito único após sols positivos), para compatibilidade. Flows.limitEffects limita o conjunto ongoing/later a três efeitos; remove expirados/panelHidden e os mais antigos. Remoção cancela contribuições futuras sem desfazer o passado. Essa fila não tem painel nem etapa de tutorial atuais.

## Recursos, integração e exibição

| Recurso | Máximo | Easy inicial | Hard inicial | Saldo-base normal/sol |
| --- | ---: | ---: | ---: | ---: |
| Oxygen | 200 kg | 150 kg | 100 kg | −3,5 kg |
| Water | 1900 L | 1425 L | 950 L | −10 L |
| Shield | 100 pontos | 75 | 50 | 0 |
| Energy | 1480 kWh | 1110 kWh | 740 kWh | −5 kWh |
| Food | 235 kg secos | 176,25 kg | 117,5 kg | −2,6 kg |

Todos os fluxos-base atuais são perSol/simulated: totais para a base inteira, sem produção automática. O motor também aceita perCrewEarthDay, multiplicando por crew × solHours/24, mas os dados atuais não usam essa base. Integração e efeitos respeitam 0–max sem arredondar o estado.

`dailyCostMultiplier: 3` é compatibilidade de teste: com dailyCostResource null, não multiplica nada; com ID, multiplica só perdas-base daquele recurso. Saves antigos sem esse campo preservam o multiplicador global do seu snapshot. Produção e efeitos de cartas não são multiplicados. Não há desgaste diário de Shield por radiação.

Shield representa proteção dos astronautas, com capacete/ombros dentro de escudo. O índice é abstrato, sem dose, massa ou garantia de bloqueio de radiação. É arredondado visualmente e mostra % nos dois modos. Os outros quatro recursos mantêm unidades físicas no Hard; o formatador usa menos casas em valores grandes, sem alterar o estado.

Easy exibe `round(value/max × 100)`, sem unidade nos estoques. ResourceDisplay.round é simétrico para sinais. Mudanças e previsões no Easy e em Shield comparam inteiros antes/depois; frações acumulam. Hard usa diferenças físicas nos outros recursos. Efeitos do verso no Easy/Shield podem considerar o estoque anterior e o clamp para obter o delta visível.

### Life Support no Easy

HUD Easy: Life Support, Shield, Energy, Food. Life Support é somente visual, com cruz de saúde: `round(100 × min(oxygen/oxygen.max, water/water.max))`. Nunca somar água e oxigênio. Troca do recurso limitante é considerada nas previsões/animações. O índice não é autonomia nem um modelo completo de suporte à vida.

Detalhe mostra descrição, número combinado e previsão de um sol, sem estoques separados. Verso mantém Changes water/Changes oxygen e deltas normalizados dos componentes, não somáveis como delta combinado. Configuração visual em resources.easyLifeSupport atual atende saves antigos sem alterar capacidades/estoques. Descrições atuais dos outros recursos também têm prioridade visual.

## Detalhes, animações e finais

Hover de mouse ou foco de teclado abre detalhes; no toque, segurar/deslizar mostra e soltar fecha. Previsão integra um sol com stopOnEmpty sem alterar o snapshot real. Não mostra “If nothing changes”.

Deltas ocupam faixa reservada por 1,4 s; líquido/número ficam verdes/vermelhos e o líquido volta à cor original. Contornos da escolha duram até avançar; cardChanges restaura o destaque ao continuar pelo verso. Mudança sem alterar o inteiro visual não gera delta no Easy/Shield.

Ao resolver um sol, salvar snapshot primeiro, bloquear brevemente controles e animar recursos por 1,4 s. Depois atualizar contador/carta; luz do fundo cruza da direita à esquerda por 600 ms sem bloquear o evento novo. Movimento reduzido elimina espera/movimento de passagem.

Falhas imediatas mostram o final sem verso; falhas durante integração usam a animação antes do final. Easy agrupa água/O₂ em Life Support; Hard conserva as cinco causas. Seis imagens de falha aprovadas, integrais e sem corte, vêm de endingImage-*; botão Start New Mission fica fora. Título/descrição HTML atendem leitores de tela e fallback vetorial se a imagem falhar. Sucesso e quit usam vetores. Finais não entram no sorteio. As artes aprovadas e seus textos podem preservar representações anteriores; o indicador atual descreve proteção pessoal. [Originais e prompts](docs/previews/endings/README.md).

## Tutorial e glossário

Cada nova missão inicia um diálogo modal sobre a UI real: quatro indicadores + carta no Easy, cinco + carta no Hard. Copia descrições/previsões dos detalhes; em Shield, acrescenta tutorialRadiationBody explicando energia em ondas/partículas e possíveis danos. Não existe etapa Lasting effects. A altura se ajusta ao espaço sem cobrir o alvo; texto longo rola internamente mantendo Skip/Next visíveis.

Next, deslize ou setas avançam indicadores; Skip/Escape encerram desde o início. Na última etapa, a carta inclina continuamente ±18 px/3 graus e preenche a alternativa em sincronia, até Let’s play! ou pular. Gestos/setas não encerram essa etapa. Respeitar movimento reduzido e impedir ações do jogo. Tutorial não altera recursos/tempo/baralho e não tem progresso próprio salvo; Continue não o repete.

Glossary no menu lista 41 entradas de CurrentGameData.glossary, ordenadas nos dados. Glossary.decorate marca aliases com limites de palavra, sem diferenciar maiúsculas e priorizando os mais longos. Usa nós de texto, sem HTML. Marca legendas/enunciados, escolha/descrição/efeitos do verso; exclui links e botões de escolha. Hover, toque ou foco abre popover na camada superior; Escape, toque fora, blur/saída ou mudança de carta fecham conforme o controle utilizado. Não decorar definições nem provocar resposta ao consultar um termo. [Auditoria](docs/GLOSSARY.md).

## Áudio

GameAudio é independente do motor e usa arquivos em sfx/:

| Arquivo | Gatilho | Volume |
| --- | --- | ---: |
| button_clicking.mp3 | Toque/Enter/Espaço em indicador; resposta por botão/seta; avanço do verso | 0,55 |
| card_swipe_v2.mp3 | Início da inclinação acima de 8 px e cada novo movimento com a carta segura: virada de direção de 24 px ou retomada de 24 px após 250 ms parada. Tremidas menores ficam em silêncio; vale também para gesto cancelado | 0,7 |
| day_change_v2.mp3 | Final da passagem para um novo sol, se a missão não terminou | 0,7 |
| main_track.mp3 | Música em loop | 0,4 |
| spacecraft_bg.mp3 | Ambiente da nave em loop | 0,12 |

Tudo toca pela **Web Audio API**: os arquivos são baixados e decodificados uma vez ao carregar. Efeitos tocam na hora, cada um como uma fonte própria (repetições se sobrepõem), começando no primeiro trecho audível do arquivo: o silêncio inicial (abaixo de 2% do pico, menos 5 ms de margem) é pulado, cerca de 250 ms no clique. Loops usam `AudioBufferSourceNode.loop`, que emenda fim e início sem intervalo; só silêncio digital de codificação nas pontas (até 100 ms) fica fora do trecho em loop. Não voltar a `<audio loop>` nem a `cloneNode()`, que causavam pausa no loop e atraso nos cliques.

O contexto de áudio é retomado em interações autorizadas pelo navegador; então os loops começam e sobem de volume em 1,5 s. Os ouvintes permanecem ativos para retomar o contexto se o navegador o suspender ou interromper; cada loop tem uma única fonte, sem duplicação. visibilitychange/pagehide suspendem o contexto, mantendo a posição da música; pageshow e o retorno à aba tentam retomar. Desligar o som para loops e efeitos ativos; ligar de novo reinicia os loops com fade. O tutorial não toca swipe na demonstração.

bindToggle sincroniza os botões menu/HUD; `next-frontier-sound` guarda on/off separadamente do save. `loopVolumes()` e `effectOffsets()` ajudam na inspeção. Volumes são escolhas de apresentação, não parâmetros científicos.

## Persistência e migração

`next-frontier-save` guarda version 1, GameData e snapshot ativo com dificuldade/cardChanges. Infinity usa marcador __infinity. A UI salva no início, resposta e avanço; não salva foco, arrasto ou animação. Vitória, falha ou quit remove o slot e desativa Continue; saves antigos encerrados são descartados no bootstrap. A tela final fica só na sessão atual, sem histórico.

Continue restaura savedSide e o verso sem reaplicar efeitos. Sem dificuldade, usar Hard; sem categorias/campos opcionais, preservar sequência antiga. Saves ativos mantêm duração, capacidades, estoques, cartas, cronograma, fluxos e multiplicador originais. Somente a apresentação atual prioriza textos da interface, descrições, glossário e legendas/alt compatíveis. Erros de armazenamento mostram aviso; outra aba alterando o slot deixa a UI antiga inert e oferece recarregar. Não há login/sincronização/offline dedicado.

Shield antigo é aceito por validateSave com allowLegacyShield e convertido antes de importar o motor: fator 100/old.max. migrateShieldSave copia e converte state, start, data.cards/deck (efeitos imediatos, ongoing e later), fluxos-base Shield, efeitos pendentes e cardChanges. Não duplica o fator em cartas compartilhadas, não altera percentuais de auditoria, outros recursos, relógio ou sequência. Unidade % com max 100 é idempotente. Resultado validado é gravado; se a gravação falhar, a cópia convertida continua em memória. O formato do slot permanece versão 1.

## Verificação e publicação

```bash
npm test
python scripts/import_event_cards.py --check
git diff --check
git status --short
```

Dez suítes Node: mission, indicators, flows, deck, data, engine, display, persistence e audio. Testes visuais não integram npm test; conferir navegador em 320×568, 375×667, 1032×1376 e 844×390, com toque/teclado/movimento reduzido. Testes e pesquisa não validam dimensionamento real da base nem a duração de 15–20 minutos com usuários.

Publish game testa e empacota index.html, src/, data/, assets/, images/ e sfx/ para GitHub Pages, por push na main ou execução manual. Documentos/testes/prints não entram no pacote. Hospedagem estática HTTP alternativa é compatível. Consultar o resultado do deploy em vez de presumir disponibilidade.
