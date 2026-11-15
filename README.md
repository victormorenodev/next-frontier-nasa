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
| Easy | Cientistas de 7–10 anos | Inteiros de 0 a 100, sem % nem unidades | easy e medium |
| Hard | Astronautas de 11+ anos | Quantidades com unidades físicas | easy, medium e hard |

A simulação usa unidades físicas nos dois modos. Easy arredonda apenas a exibição; as frações continuam acumulando. Previsões e variações reais refletem a diferença entre os inteiros exibidos antes e depois.

Cada sol tem uma carta (80%) ou duas (20%). Resolva todas para concluir o sol; ler ou responder não gasta um sol por carta. Consumo, produção e efeitos programados são calculados uma vez ao concluir cada sol. O objetivo implementado é concluir o sol 40. Qualquer recurso físico zerado encerra a missão com “Mission Failed”.

As cartas podem repetir, inclusive consecutivamente. O sorteio seleciona categoria e depois carta dentro dela. Chances-base: Routine 35%, Maintenance 25%, Exploration 20%, Science 15%, Emergency 5%. No Easy, cartas não elegíveis são removidas e as chances restantes são normalizadas.

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

Cada carta tem ID único, category, probability, difficulty, description, image, imageAlt, imageCaption, source e respostas left/right. Cada resposta possui label e pode incluir description, effects, ongoing e later. Textos devem ser curtos e em inglês. As dez cartas atuais são mock e compartilham uma imagem/legenda de teste; suas explicações de escolha começam vazias.

- `effects`: mudanças imediatas nas unidades físicas dos recursos, inclusive no Easy.
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

O modo Hard exibe um painel inferior com três espaços quadrados. Efeitos contínuos e consequências agendadas das escolhas ocupam os espaços, com ícones dos recursos afetados. Hover, foco de teclado ou toque abrem o detalhe; um segundo toque no mesmo ícone fecha. O detalhe mostra nome, impacto físico por sol (ou alteração única agendada) e tempo restante/espera. Efeitos encerrados desaparecem. O painel funciona como fila de três ícones, sem paginação: um novo efeito retira o ícone mais antigo e desloca os demais para a esquerda. Ícones retirados não voltam quando outro efeito termina; os efeitos continuam na simulação até seu término. Efeitos imediatos continuam apresentados no verso, pois não têm taxa por sol. O painel não aparece no Easy e o botão do tablet continua oculto.

## Life Support no Easy

No Easy, água e oxigênio aparecem juntos em **Life Support**, com uma cruz de saúde. São quatro indicadores na HUD; Hard continua com cinco. O número de 0 a 100 é o menor dos dois estoques proporcionais: oxigênio 60 e água 80 mostram Life Support 60. Água e oxigênio continuam separados na simulação e no save.

O detalhe descreve o oxigênio que se respira e a água que se bebe e mostra o número combinado de Life Support e sua variação prevista após um sol, sem valores de estoque separados. O verso usa Life Support com “Changes water” ou “Changes oxygen”, identificando qual componente muda. Uma mudança no estoque não limitante pode não mudar o número da HUD. Nome, cor e descrição ficam em `data/resources.json` → `easyLifeSupport`.

O índice simplifica a disponibilidade; não estima tempo de sobrevivência nem todo o suporte à vida real. Consulte o [cálculo e a compatibilidade](ARCHITECTURE.md#life-support-no-easy) e os [limites científicos](docs/RESEARCH.md#simplificação-visual-life-support-no-easy).

## Finais da missão e teste de consumo

Concluir os 40 sols sem zerar recursos mantém o final de sucesso. Zerar um recurso, por escolha ou durante a resolução diária, mostra **Mission Failed** e uma explicação específica. Easy tem quatro finais de falha: Life Support (oxigênio ou água), Radiation Shield, Energy Supply e Food Stock. Hard separa oxigênio e água, com cinco finais de falha. Encerrar manualmente continua mostrando Mission ended.

Temporariamente, `data/mission.json` → `dailyCostMultiplier: 3` triplica o consumo-base de apenas um recurso escolhido para facilitar testes. No seletor Easy/Hard, escolher em Faster daily use o recurso ou Normal daily use para consumo normal. Produção e efeitos das cartas permanecem com seus valores próprios. Os coeficientes científicos originais em `flows.json` foram preservados. Para restaurar o consumo normal, usar 1 e começar uma nova missão; continuar um save preserva o multiplicador salvo (saves anteriores usam 1).

Não há desgaste diário de blindagem: ela pode zerar por efeitos de cartas. O zero da derrota é o estoque físico real; um indicador Easy arredondado para zero ainda pode conter uma pequena reserva.

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

Start New Mission abre o briefing da nova missão; Continue mission retoma diretamente a fase e o modo salvos, sem passar pelo briefing. A continuação não aparece mais como botão dentro do briefing. Nessa tela foram removidos o rótulo “Next Frontier · Mission briefing” e o parágrafo “Look after…”. Novas missões Easy mostram o tutorial descrito abaixo; Hard não tem tutorial. Créditos abrem um diálogo com a atribuição da imagem NASA e das ilustrações geradas.

O menu não altera nem apaga o save. Continuar restaura a missão existente; escolher uma nova missão mantém o fluxo atual. A recarga interna usada para iniciar uma nova missão com dados atuais mantém a seleção de modo/consumo e vai direto ao jogo. Se a inicialização falhar, o aviso e Try again continuam acessíveis na tela de briefing. Textos novos ficam em `data/interface.json`; a navegação e os diálogos ficam em `src/ui.js`.

O menu é mobile-first e usa uma única coluna centralizada horizontal e verticalmente em celulares, tablets e desktop, em ambas as orientações. Título, textos dos botões e aviso de save são centralizados. A largura é limitada a 360 px na base e 440 px em telas a partir de 768 px com altura suficiente; telas baixas usam tipografia e espaçamentos compactos, preservando os alvos de toque e as safe areas. Ícones decorativos identificam as três ações. Os botões têm fundo sólido, foco visível e estado desativado explícito, sem depender de transparência sobre a paisagem.

Para impedir mistura de HTML novo com CSS/módulos/textos antigos do cache, os links de CSS e bootstrap no HTML usam a mesma versão de assets (`v`). O bootstrap propaga essa versão aos módulos (inclusive validation) e busca os JSONs com `cache: no-store`. Ao mudar a versão de assets em uma entrega, atualizar os dois links do HTML juntos. Os snapshots de regras das missões salvas continuam preservados; os textos atuais seguem prioritários.

## Tutorial do Easy

Ao iniciar uma nova missão Easy, uma guia curta apresenta os quatro indicadores e depois a carta. As explicações usam as descrições e previsões já disponíveis nos detalhes dos recursos. A carta se move continuamente para os lados e preenche o botão correspondente como no arrasto real; nenhuma escolha é aplicada nessa demonstração. A etapa só termina por Let’s play! ou por pular.

Toque em Next, deslize para qualquer lado ou use as setas para avançar; na última etapa, use Let’s play!. Skip tutorial está disponível desde a primeira etapa, e Escape também permite pular. Durante a guia, recursos e tempo ficam intactos. Continuar uma missão salva não repete o tutorial. Hard mantém o início direto, sem tutorial por enquanto.

O tutorial não exibe contador de etapas nem a dica “Swipe sideways or tap the button”. Os gestos e setas continuam avançando as etapas de indicadores; no passo final, não encerram a demonstração. Let’s play! inicia o jogo; Skip tutorial e Escape continuam disponíveis para pular.
