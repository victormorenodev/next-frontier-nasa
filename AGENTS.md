# Next Frontier — orientações vigentes para agentes

Consolidado em **15/11/2026** a partir do código e dos JSONs atuais. Leia este documento, [README.md](README.md) e [ARCHITECTURE.md](ARCHITECTURE.md) antes de alterar o projeto. A pesquisa está em [docs/RESEARCH.md](docs/RESEARCH.md). Arquivos em `docs/history/` são registros de versões anteriores, não instruções atuais.

## Produto e regras atuais

- Jogo de decisões por cartas inspirado em Reigns: administrar uma base marciana com **quatro astronautas**. O projeto surgiu a partir do desafio Junior Astronaut Mission Trainer do NASA Space Apps; não afirmar endosso, premiação ou submissão oficial sem evidência.
- Todo texto visível ao jogador é **em inglês simples**. Documentação interna pode ser em português. Priorizar crianças: ícones claros, frases curtas, contraste e controles de toque/teclado acessíveis.
- A missão termina ao concluir **40 sols** ou quando qualquer recurso zera. Cada sol tem **1 carta (80%)** ou **2 cartas (20%)**; não há sols sem eventos. A meta histórica de 15–20 minutos ainda não foi validada com usuários.
- Sortear primeiro categoria, depois carta da categoria, com reposição. Repetições consecutivas são permitidas, inclusive no mesmo sol. Categorias-base: Routine 35%, Maintenance 25%, Exploration 20%, Science 15%, Emergency 5%.
- Após o briefing, escolher **Easy** (cientistas de 7–10 anos) ou **Hard** (astronautas de 11+). Easy sorteia somente cartas easy/medium; Hard permite os três níveis. Após filtrar, normalizar probabilidades e excluir categorias sem cartas elegíveis.
- O₂, água, energia e comida usam unidades físicas internas em ambos os modos; Shield usa uma escala interna de 0 a 100 pontos percentuais. Easy exibe os estoques normalizados de **0 a 100, sem símbolo %**, e Shield com %. Não arredondar o estado interno. Previsões e variações reais usam a diferença dos valores arredondados antes/depois; frações continuam acumulando. Hard exibe unidades físicas nos estoques e % em Shield.
- Cinco recursos: Oxygen Level (kg), Water Stock (L), Radiation Shield (0–100%), Energy Supply (kWh) e Food Stock (kg de alimento seco). Quantidades iniciais, capacidades, explicações e cores vêm dos JSONs.
- As cartas não possuem duração individual. Escolhas aplicam efeitos imediatos e registram efeitos contínuos/agendados; consumo e produção de um sol são aplicados uma única vez após sua última carta. Terços de sol são apenas passos internos de integração, sem manhã/tarde/noite jogáveis.
- Existem 13 cartas fornecidas no CSV do projeto, com IDs de 1 a 13 e imagens correspondentes em `images/cards/`. Os efeitos são balanceamento autoral convertido de percentuais da capacidade para unidades de simulação (físicas nos estoques, pontos percentuais em Shield). Recursos zerados causam derrota automática; as cartas ainda não são cientificamente dimensionadas para uma base real.

## Interface e comportamento atuais

- Briefing com imagem NASA e crédito em texto; início por botão, arrasto ou setas leva ao seletor. Continuar missão restaura diretamente o modo e a fase salvos.
- Frente da carta: imagem, legenda, problema e alternativas. Sem dificuldade nem contador de eventos na HUD. Verso: escolha, descrição opcional dessa escolha, ícones/nomes dos recursos, efeitos e fonte. Descrições vazias não ocupam espaço.
- No PC, hover de mouse abre o detalhe dos recursos. No toque, segurar/deslizar mostra o detalhe e soltar fecha. Há acesso por foco de teclado. O detalhe explica o uso e a previsão após um sol, sem a frase “If nothing changes”.
- Números de variação aparecem na faixa reservada acima de cada indicador por **1,4 s**, verde para aumento e vermelho para queda. O preenchimento assume essa cor enquanto anima; contornos de mudanças da carta ficam até avançar. No Easy, mudanças sem alteração no inteiro não mostram número flutuante.
- Ao concluir um sol, salvar o novo estado e animar os recursos por **1,4 s** antes de atualizar contador/carta. Depois a luz do fundo atravessa da direita para a esquerda por **600 ms**, sem bloquear o novo evento. Movimento reduzido elimina movimento e espera de passagem de sol.
- Fundo ilustrado de Marte, visto pela moldura de uma base. Layout responsivo com padding, sem rolagem da página. Preservar legibilidade em celular/tablet, retrato/paisagem. A lista de efeitos do verso mantém overflow interno de segurança para textos extensos.
- A seção fixa de efeitos foi removida. O tablet de relatório continua implementado, mas seu botão está **temporariamente oculto**. As mãos foram removidas. Não reativar sem solicitação.

## Organização, dados e persistência

- HTML de entrada na raiz; motor/interface em `src/`; configuração e conteúdo em `data/`; CSS e ilustração em `assets/`; imagens de cartas/briefing em `images/`; testes em `tests/`.
- Execução requer **HTTP**, módulos JavaScript nativos e leitura de JSON por fetch. A regra antiga de duplo clique/file:// foi substituída. Sem framework, dependências npm ou build obrigatório para jogar.
- Editar configuração/conteúdo nos JSONs, sem duplicar parâmetros no motor. Desenhos dos ícones, regras de cálculo, layout, gestos e animações permanecem no código. Novos tipos de comportamento podem exigir código.
- Validar probabilidades, referências e tipos. Categorias somam 1; cartas somam 1 dentro de cada categoria, antes do filtro de dificuldade. Não inserir fórmulas executáveis nos JSONs.
- `Engine` centraliza iniciar/responder/avançar/encerrar. A UI renderiza snapshots. Preservar a aplicação única de efeitos, inclusive ao continuar pelo verso.
- Um slot versionado de localStorage guarda modo, recursos, relógio, ordem das cartas, efeitos pendentes e dados da partida. Saves antigos usam Hard e preservam sua sequência. Novas missões usam os dados atuais. Textos da interface atual têm prioridade sobre cópias antigas.
- Progresso pertence ao navegador e à origem do site; não há login, sincronização ou suporte offline dedicado. Outra aba que altera o save suspende a interface antiga até recarregar.

## Precisão científica e escopo

- Separar medição real, hipótese/modelo e balanceamento. Preservar fontes, unidades, ambiente e transformações dos coeficientes científicos.
- Preservar massa em transferências físicas de água. Shield é um índice de proteção de 0 a 100%, sem conversão automática de água para pontos nem equivalência direta a dose ou massa. Radiação não consome blindagem. Não confundir kW/kWh, comida hidratada/seca ou Gy/Sv.
- Construir incrementalmente conforme os pedidos. Propostas na pesquisa ou no histórico não são autorização de implementação.
- Atualizar os documentos vigentes quando comportamento/estrutura mudar; registrar histórico separadamente e evitar regras duplicadas em CLAUDE.md.

## Execução, validação e entrega

```bash
python -m http.server 8000 --bind 127.0.0.1
# Abrir http://127.0.0.1:8000/
```

```bash
npm test
git diff --check
git status --short
```

Node é ferramenta de desenvolvimento/teste, não requisito do jogador. Para alterações visuais, verificar também no navegador. Referências de tamanho: 320×568, 375×667, 1032×1376 e 844×390; ampliar conforme o caso. Testes históricos não substituem validação de novas alterações.

O workflow **Publish game** está em `.github/workflows/pages.yml`: testa e publica o conteúdo estático ao receber push na main ou execução manual. O projeto também pode ser hospedado estaticamente na Cloudflare. Não presumir sucesso de publicação, autenticação ou sincronização de branches; consultar o estado real quando necessário. Não incluir prints/logs de diagnóstico em commits do jogo sem necessidade.

## Painel de efeitos no Hard

O modo Hard exibe um painel inferior com três espaços quadrados. Efeitos contínuos e consequências agendadas das escolhas ocupam os espaços, com ícones dos recursos afetados. Hover, foco de teclado ou toque abrem o detalhe; um segundo toque no mesmo ícone fecha. O detalhe mostra nome, impacto físico por sol (ou alteração única agendada) e tempo restante/espera. Efeitos encerrados desaparecem. O painel funciona como fila de três ícones, sem paginação: um novo efeito remove o efeito mais antigo e seu ícone, deslocando os demais para a esquerda. O efeito retirado é cancelado: suas taxas futuras param e mudanças agendadas ainda não aplicadas são descartadas. Alterações já causadas nos recursos não são revertidas; efeitos removidos não voltam quando outro termina. Efeitos imediatos continuam apresentados no verso, pois não têm taxa por sol. O painel não aparece no Easy e o botão do tablet continua oculto.

## Life Support no Easy

- Easy tem quatro indicadores: Life Support (cruz de saúde), Radiation Shield, Energy Supply e Food Stock. Hard mantém os cinco indicadores separados.
- Life Support é somente visual: `round(100 × min(oxygen / oxygen.max, water / water.max))`. Manter estoques físicos independentes; não somar água e oxigênio. Previsões, animações e contornos comparam o índice arredondado antes/depois, inclusive quando troca o recurso limitante.
- O detalhe descreve oxigênio e água e mostra o número combinado de Life Support e sua variação prevista após um sol, sem números separados de estoque; no verso, Life Support mantém a identificação “Changes water”/“Changes oxygen” e a variação do componente. Essa variação não é o delta combinado da HUD.
- Configuração visual em `resources.easyLifeSupport`; usar a apresentação atual também para saves antigos. Não migrar nem arredondar estado físico.
- Regras detalhadas em [ARCHITECTURE.md](ARCHITECTURE.md#life-support-no-easy); limites científicos em [docs/RESEARCH.md](docs/RESEARCH.md#simplificação-visual-life-support-no-easy). O índice não mede autonomia ou sobrevivência nem representa todos os sistemas de suporte à vida.

## Finais e consumo temporário para teste

- Recurso em zero encerra com “Mission Failed”. Easy tem quatro finais de falha: Life Support (água ou oxigênio), blindagem, energia e comida. Hard tem cinco: oxigênio, água, blindagem, energia e comida. Os textos ficam em `data/interface.json` (`failedTitle`, `failedBody-*`).
- Verificar após efeitos imediatos e em cada passo interno dos fluxos diários/agendados; interromper ao zerar, sem permitir resgate posterior. Falha tem prioridade sobre sucesso no sol 40. Um zero arredondado na apresentação não causa derrota se o valor interno ainda for positivo, inclusive em Shield. Empate usa a ordem dos recursos em `resources.quantities` (atualmente oxygen, water, shield, energy, food).
- `mission.dailyCostMultiplier` está temporariamente em **3**: triplica somente consumos-base negativos do recurso escolhido na nova missão, mantendo coeficientes originais e produção. Efeitos de cartas não são multiplicados. Voltar para 1 encerra o ajuste de teste em novas missões. Saves preservam a configuração com que começaram; ausência do campo equivale a 1.
- Blindagem continua sem consumo diário por radiação. O final é uma regra do jogo, não um cálculo de dose ou sobrevivência.

As telas finais sem imagem (e o fallback de carregamento) usam título e descrição ampliados e ícones próprios: Life Support com pulso interrompido, pulmões riscados (oxigênio), gota rachada (água), escudo rachado (blindagem), raio partido (energia) e caixa vazia (comida). Sucesso usa marca de confirmação e encerramento manual usa saída. Em espaços baixos, ícone e título ficam lado a lado; o painel de efeitos fica oculto ao encerrar para reservar espaço ao final. Os desenhos ficam em `src/icons.js` (`EndingIcons`) e são decorativos, pois o texto identifica o resultado.

## Início de nova missão e seleção de consumo

O botão do briefing e dos finais é **Start New Mission**. Ele abre o seletor sem confirmação de substituição. O save anterior só é substituído ao escolher Easy ou Hard; voltar ao briefing preserva Continue mission. Saves inválidos também podem ser substituídos sem confirmação.

Antes de escolher o modo, **Faster daily use** permite selecionar um recurso ou **Normal daily use** (padrão). Apenas os fluxos-base negativos do recurso escolhido recebem `mission.dailyCostMultiplier` (3). Produção e efeitos de cartas mantêm seus valores. Shield está identificado como sem consumo diário: selecionar essa opção não cria desgaste nem consumo por radiação. Água e oxigênio são opções físicas separadas também no Easy.

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

## Mini tutorial dos modos Easy e Hard

- Cada nova missão Easy mostra cinco etapas sobre a interface real: Life Support, Radiation Shield, Energy Supply, Food Stock e a carta. Hard tem sete: os cinco indicadores separados, o painel de efeitos e a carta. Continue mission entra diretamente na partida, sem repetir o tutorial.
- Indicadores reutilizam as descrições e previsões dos detalhes existentes, com realce de um indicador por vez. Na última etapa, a carta demonstra continuamente um pequeno arrasto nos dois sentidos, preenchendo o botão correspondente como no arrasto real, sem selecionar alternativas. Respeitar movimento reduzido.
- Next, deslize horizontal em qualquer sentido ou setas avançam. A última etapa usa Let’s play!. Skip tutorial fica disponível desde o início; Escape também pula. O foco e os cliques da partida ficam bloqueados pelo diálogo modal.
- O tutorial não altera recursos, relógio, baralho, escolhas nem efeitos. A missão inicial é salva antes dele. Recarregar e continuar não repete o tutorial; não existe progresso de tutorial persistido.
- `src/tutorial.js` controla a apresentação, o realce e os gestos. Textos em `data/interface.json`; as explicações dos recursos continuam nas fontes já existentes. Conferir posicionamento em celular/tablet e mudança de orientação, sem cobrir o elemento realçado.

O tutorial não exibe contador de etapas nem a dica “Swipe sideways or tap the button”. Os gestos e setas continuam avançando as etapas de indicadores; no passo final, não encerram a demonstração. Let’s play! inicia o jogo; Skip tutorial e Escape continuam disponíveis para pular.

No tutorial Hard, a etapa Lasting effects destaca os três espaços reais do painel, sem criar efeitos fictícios. Explica alterações por sol e eventos agendados, sem explicar a remoção de efeitos pela fila. Em celulares em retrato, somente no passo da carta o painel é ocultado temporariamente para manter a carta legível; ao concluir ou pular, ele reaparece sem alterar os efeitos.

A fila limita os próprios efeitos contínuos/agendados a três, nos dois modos; o painel continua exclusivo do Hard. Remover o mais antigo cancela suas contribuições futuras, sem desfazer o passado. Saves antigos têm efeitos `panelHidden` descartados na retomada, e a fila normalizada é salva. O tutorial não explica essa regra de remoção.
