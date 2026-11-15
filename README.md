# Next Frontier

Jogo de decisões por cartas em uma base marciana, com quatro astronautas e uma missão de **40 sols**. Todo o conteúdo do jogo está em inglês simples.

Documentação consolidada em **15/11/2026**, conforme o código e os JSONs atuais.

## Executar localmente

Na raiz do repositório:

```bash
python -m http.server 8000 --bind 127.0.0.1
```

Abra **http://127.0.0.1:8000/**. O jogo precisa de HTTP para ler os JSONs; abrir index.html por duplo clique não é suportado. Não há framework, dependências npm ou build obrigatório. Python é uma opção de servidor local; jogadores acessam o endereço publicado pelo navegador.

## Como funciona

O briefing apresenta a missão e a imagem da NASA com crédito. Clique, arraste ou use as setas para ir ao seletor:

| Modo | Público indicado | Recursos | Cartas permitidas |
| --- | --- | --- | --- |
| Easy | Cientistas de 7–10 anos | Estoques de 0 a 100 sem unidade; Shield de 0 a 100% | easy e medium |
| Hard | Astronautas de 11+ anos | Estoques com unidades físicas; Shield de 0 a 100% | easy, medium e hard |

O₂, água, energia e comida usam unidades físicas nos dois modos; Shield usa um índice percentual de 0 a 100. Easy arredonda apenas a exibição; as frações continuam acumulando. Previsões e variações reais refletem a diferença entre os inteiros exibidos antes e depois.

Cada sol tem uma carta (80%) ou duas (20%). Resolva todas para concluir o sol; ler ou responder não gasta um sol por carta. Consumo, produção e efeitos programados são calculados uma vez ao concluir cada sol. O objetivo implementado é concluir o sol 40. Qualquer recurso zerado encerra a missão com “Mission Failed”.

As cartas podem repetir, inclusive consecutivamente. O sorteio seleciona categoria e depois carta dentro dela. Chances-base: Routine 35%, Maintenance 25%, Exploration 15%, Science 20%, Emergency 5%. No Easy, cartas não elegíveis são removidas e as chances restantes são normalizadas.

Na frente, cada imagem tem legenda. No verso, a explicação da escolha aparece somente se preenchida; os resultados mostram ícones e nomes dos recursos. Dificuldade e número de eventos não aparecem na HUD.

Passe o mouse sobre um indicador no PC ou segure/deslize no toque para ver a função do recurso e sua previsão após um sol. Números e preenchimento animam em verde/vermelho por 1,4 s; os contornos da carta permanecem até avançar. A passagem de sol anima primeiro os recursos e depois a luz do fundo, da direita para a esquerda. Movimento reduzido é respeitado. A página não rola e se adapta a celular/tablet em retrato/paisagem. O tablet de relatório está temporariamente oculto.

## Editar configuração e conteúdo

| Arquivo | O que editar |
| --- | --- |
| `data/mission.json` | Tripulação, duração do sol, duração da missão, chances de 1/2 eventos e modos |
| `data/resources.json` | Estoques iniciais, capacidades, unidades, descrições, indicadores, ícones e cores |
| `data/categories.json` | Categorias e chances-base |
| `data/cards.json` | Eventos, imagens, legendas, fontes, alternativas e efeitos |
| `data/flows.json` | Consumo/produção e coeficientes científicos ou simulados |
| `data/interface.json` | Textos, templates, imagem e crédito do briefing |

Probabilidades são frações entre 0 e 1. Categorias somam 1 e cartas somam 1 por categoria, com tolerância de 1e-9. Cada categoria precisa de cartas e total positivo. Probabilidade zero desabilita a seleção. Uma categoria com uma única carta usa probability 1 nessa carta. O filtro de dificuldade remove categorias sem cartas elegíveis e preserva a proporção entre as restantes.

Cada carta tem ID único, category, probability, difficulty, description, image, imageAlt, imageCaption, source e respostas left/right. Cada resposta possui label e pode incluir description, effects, ongoing e later. Textos devem ser curtos e em inglês. As 13 cartas atuais vêm de `Cartas de evento - Página1.csv`, usam suas imagens por ID e têm rótulos curtos com a resposta completa no verso. As respostas ausentes das cartas 7/8 foram completadas e influências vazias receberam zero, conforme autorizado.

- `effects`: mudanças imediatas nas unidades físicas dos estoques e pontos percentuais de Shield, inclusive no Easy.
- `ongoing`: rates por sol, after opcional e for opcional; omitir for significa continuar indefinidamente.
- `later`: efeitos após um número inteiro positivo de sols.
- `left.description`/`right.description`: explicação no verso somente para a escolha feita; ausente, vazia ou só espaços não ocupa espaço.
- `imageCaption`: legenda da imagem na frente; ausente/vazia não ocupa espaço. Saves antigos podem usar a legenda atual se ID e imagem coincidirem.

Fluxos usam amount e basis: perSol ou perCrewEarthDay. Esta última multiplica amount por crew × solHours/24. Preserve unidade, fonte e classificação reference/simulated. Templates da interface aceitam campos como `{crew}`, `{totalSols}`, `{sol}` e `{amount}`, conforme a mensagem. JSONs não contêm fórmulas executáveis.

Layout, animações, gestos, desenhos dos ícones e tipos de regras ficam em CSS/JavaScript. O motor não interpreta qualquer comportamento arbitrário só por adicioná-lo ao JSON. Código em src/, CSS/ilustração em assets/, imagens de briefing/cartas em images/.

## Progresso salvo

O jogo salva automaticamente em um slot de localStorage, incluindo dificuldade, recursos, efeitos pendentes, fase da carta, sequência e dados usados pela missão. **Continue mission** restaura a partida sem reaplicar escolhas. Novas missões usam os dados atuais. Saves anteriores sem modo retomam em Hard; alterações de textos da interface podem aparecer também em partidas anteriores.

O progresso fica no mesmo navegador e origem do site. Limpar os dados remove o save; armazenamento privado/desativado pode não persistir. Não há login nem sincronização entre dispositivos. Mudar o domínio não transfere o progresso. Quando outra aba altera o save, a aba antiga suspende ações até recarregar. Saves incompatíveis não são apagados automaticamente: iniciar uma nova missão substitui o save ao escolher o modo, sem confirmação.

## Validar

```bash
npm test
git diff --check
```

Node é necessário apenas para desenvolvimento/testes. Não precisa instalar pacotes. São sete suítes: indicadores, missão, fluxos, baralho, dados/saves, ações do motor e apresentação dos recursos. Para alterações visuais, conferir também o navegador em celular e tablet, incluindo paisagem e movimento reduzido.

## Publicar

O workflow **Publish game**, em `.github/workflows/pages.yml`, testa e publica em GitHub Pages ao receber push na main ou execução manual. Em Settings → Pages, configurar Source como GitHub Actions. É preciso enviar as alterações e integrá-las à branch de publicação; commit local não publica sozinho.

Para outra hospedagem estática, como Cloudflare, enviar somente:

```text
index.html
src/
data/
assets/
images/
```

Manter essa estrutura e verificar o resultado do deploy. O estado atual de disponibilidade pública não foi revalidado nesta revisão documental. Não enviar prints, ZIPs de logs, testes ou documentação interna como parte do pacote do jogo.

## Documentos

- [AGENTS.md](AGENTS.md): regras vigentes e orientações para agentes.
- [ARCHITECTURE.md](ARCHITECTURE.md): estrutura e funcionamento atuais.
- [CLAUDE.md](CLAUDE.md): ponto de entrada para a mesma documentação, sem regras duplicadas.
- [docs/RESEARCH.md](docs/RESEARCH.md): pesquisa, fontes e cuidados científicos.
- [Histórico de implementação](docs/history/ARCHITECTURE.md) e [contexto anterior](docs/history/PROJECT_CONTEXT.md): versões arquivadas, não instruções atuais.

## Painel de efeitos no Hard

O modo Hard exibe um painel inferior com três espaços quadrados. Efeitos contínuos e consequências agendadas das escolhas ocupam os espaços, com ícones dos recursos afetados. Hover, foco de teclado ou toque abrem o detalhe; um segundo toque no mesmo ícone fecha. O detalhe mostra nome, impacto físico por sol (ou alteração única agendada) e tempo restante/espera. Efeitos encerrados desaparecem. O painel funciona como fila de três ícones, sem paginação: um novo efeito remove o efeito mais antigo e seu ícone, deslocando os demais para a esquerda. O efeito retirado é cancelado: suas taxas futuras param e mudanças agendadas ainda não aplicadas são descartadas. Alterações já causadas nos recursos não são revertidas; efeitos removidos não voltam quando outro termina. Efeitos imediatos continuam apresentados no verso, pois não têm taxa por sol. O painel não aparece no Easy e o botão do tablet continua oculto.

## Life Support no Easy

No Easy, água e oxigênio aparecem juntos em **Life Support**, com uma cruz de saúde. São quatro indicadores na HUD; Hard continua com cinco. O número de 0 a 100 é o menor dos dois estoques proporcionais: oxigênio 60 e água 80 mostram Life Support 60. Água e oxigênio continuam separados na simulação e no save.

O detalhe descreve o oxigênio que se respira e a água que se bebe e mostra o número combinado de Life Support e sua variação prevista após um sol, sem valores de estoque separados. O verso usa Life Support com “Changes water” ou “Changes oxygen”, identificando qual componente muda. Uma mudança no estoque não limitante pode não mudar o número da HUD. Nome, cor e descrição ficam em `data/resources.json` → `easyLifeSupport`.

O índice simplifica a disponibilidade; não estima tempo de sobrevivência nem todo o suporte à vida real. Consulte o [cálculo e a compatibilidade](ARCHITECTURE.md#life-support-no-easy) e os [limites científicos](docs/RESEARCH.md#simplificação-visual-life-support-no-easy).

## Finais da missão e teste de consumo

Concluir os 40 sols sem zerar recursos mantém o final de sucesso. Zerar um recurso, por escolha ou durante a resolução diária, mostra **Mission Failed** e uma explicação específica. Easy tem quatro finais de falha: Life Support (oxigênio ou água), Radiation Shield, Energy Supply e Food Stock. Hard separa oxigênio e água, com cinco finais de falha. Encerrar manualmente continua mostrando Mission ended.

Temporariamente, `data/mission.json` → `dailyCostMultiplier: 3` triplica o consumo-base de apenas um recurso escolhido para facilitar testes. No seletor Easy/Hard, escolher em Faster daily use o recurso ou Normal daily use para consumo normal. Produção e efeitos das cartas permanecem com seus valores próprios. Os coeficientes científicos originais em `flows.json` foram preservados. Para restaurar o consumo normal, usar 1 e começar uma nova missão; continuar um save preserva o multiplicador salvo (saves anteriores usam 1).

Não há desgaste diário de blindagem: ela pode zerar por efeitos de cartas. O zero da derrota é o valor interno do recurso; um indicador Easy arredondado para zero ainda pode conter uma pequena reserva.

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

## Tutorial da missão

Ao iniciar uma nova missão, uma guia curta apresenta os indicadores e depois a carta. Easy usa quatro indicadores; Hard usa os cinco recursos separados e acrescenta uma etapa sobre o painel de efeitos antes da carta. As explicações usam as descrições e previsões já disponíveis nos detalhes dos recursos. A carta se move continuamente para os lados e preenche o botão correspondente como no arrasto real; nenhuma escolha é aplicada nessa demonstração. A etapa só termina por Let’s play! ou por pular.

Toque em Next, deslize para qualquer lado ou use as setas para avançar; na última etapa, use Let’s play!. Skip tutorial está disponível desde a primeira etapa, e Escape também permite pular. Durante a guia, recursos e tempo ficam intactos. Continuar uma missão salva não repete o tutorial. No Hard, a explicação do painel mostra como consultar mudanças por sol e eventos agendados, sem explicações sobre a remoção de efeitos da fila.

O tutorial não exibe contador de etapas nem a dica “Swipe sideways or tap the button”. Os gestos e setas continuam avançando as etapas de indicadores; no passo final, não encerram a demonstração. Let’s play! inicia o jogo; Skip tutorial e Escape continuam disponíveis para pular.

No tutorial Hard, a etapa Lasting effects destaca os três espaços reais do painel, sem criar efeitos fictícios. Explica alterações por sol e eventos agendados, sem explicar a remoção de efeitos pela fila. Em celulares em retrato, somente no passo da carta o painel é ocultado temporariamente para manter a carta legível; ao concluir ou pular, ele reaparece sem alterar os efeitos.

## Catálogo atual de eventos

As novas missões usam as 13 cartas do CSV e as imagens `images/cards/1.jpg` a `13.jpg` (6 e 12 são PNG). As influências são percentuais da capacidade máxima do recurso, convertidos antes do jogo para unidades de simulação (físicas nos estoques e pontos percentuais em Shield): `efeito = percentual × capacidade / 100`. Por exemplo, 15 pontos de Oxygen equivalem a 30 kg; 15 de Water, 285 L; 15 de Energy, 222 kWh. As capacidades atuais foram definidas pelo autor, independentemente das notas laterais da planilha.

Os valores da primeira resposta vão para left e os da segunda para right. O arquivo usa barra invertida como separador; o importador também aceita `/`. Esses efeitos são imediatos. Influências vazias são zero; não há durações ou taxas criadas para preencher lacunas. O JSON guarda `effectPercentages` para auditoria, mas o motor aplica apenas `effects`, em unidades físicas dos estoques e pontos percentuais de Shield.

Para regenerar após editar o CSV ou as capacidades:

```bash
python scripts/import_event_cards.py
python scripts/import_event_cards.py --check
```

O Python é necessário apenas para essa conversão editorial; jogar e executar `npm test` continuam sem essa etapa. O navegador lê o JSON, não o CSV. [Mapeamento, respostas completadas e conversões](docs/CARDS.md).

Continuar missões antigas preserva o baralho salvo, inclusive cartas mock. Inicie uma nova missão para usar o catálogo novo. A imagem mock e sua apresentação ficam disponíveis somente para compatibilidade dos saves antigos.

## Shield em porcentagem

Shield vai de **0 a 100% no Easy e no Hard**, começando em **75% no Easy e 50% no Hard**. É um índice de proteção do jogo, não g/cm², dose ou porcentagem garantida de radiação bloqueada. Os demais recursos mantêm suas unidades físicas internas e a apresentação de cada modo. No Easy, Shield é a exceção à regra de números sem %.

Os valores de Shield das cartas são pontos percentuais: −5 muda 80% para 75%. O estado mantém frações, mas a interface arredonda para inteiros; previsões e números de variação comparam os inteiros exibidos. Não há consumo diário de Shield por radiação.

Saves antigos em g/cm² são convertidos automaticamente, preservando a proporção da capacidade: 8 de 10 vira 80%. A conversão inclui efeitos das cartas, efeitos pendentes e destaques já salvos, sem reaplicar escolhas ou alterar os outros recursos.

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
