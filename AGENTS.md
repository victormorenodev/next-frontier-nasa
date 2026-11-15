# Next Frontier — orientações vigentes para agentes

Consolidado em **15/11/2026** a partir do código e dos JSONs atuais. Leia este documento, [README.md](README.md) e [ARCHITECTURE.md](ARCHITECTURE.md) antes de alterar o projeto. A pesquisa está em [docs/RESEARCH.md](docs/RESEARCH.md). Arquivos em `docs/history/` são registros de versões anteriores, não instruções atuais.

## Produto e regras atuais

- Jogo de decisões por cartas inspirado em Reigns: administrar uma base marciana com **quatro astronautas**. O projeto surgiu a partir do desafio Junior Astronaut Mission Trainer do NASA Space Apps; não afirmar endosso, premiação ou submissão oficial sem evidência.
- Todo texto visível ao jogador é **em inglês simples**. Documentação interna pode ser em português. Priorizar crianças: ícones claros, frases curtas, contraste e controles de toque/teclado acessíveis.
- A missão termina ao concluir **30 sols** ou quando qualquer recurso zera. Cada sol tem **1 carta (80%)** ou **2 cartas (20%)**; não há sols sem eventos. A meta histórica de 15–20 minutos ainda não foi validada com usuários.
- Sortear primeiro categoria, depois carta da categoria, com reposição. Repetições consecutivas são permitidas, inclusive no mesmo sol. Categorias-base: Routine 9/31 (29,03%), Maintenance 9/31 (29,03%), Exploration 1/31 (3,23%), Science 5/31 (16,13%), Emergency 7/31 (22,58%).
- Após o briefing, escolher **Easy** (cientistas de 7–10 anos) ou **Hard** (astronautas de 11+). Easy sorteia somente cartas easy/medium; Hard permite os três níveis. Após filtrar, normalizar probabilidades e excluir categorias sem cartas elegíveis.
- O₂, água, energia e comida usam unidades físicas internas em ambos os modos; Shield usa uma escala interna de 0 a 100 pontos percentuais. Easy exibe os estoques normalizados de **0 a 100, sem símbolo %**, e Shield com %. Não arredondar o estado interno. Previsões e variações reais usam a diferença dos valores arredondados antes/depois; frações continuam acumulando. Hard exibe unidades físicas nos estoques e % em Shield.
- Cinco recursos: Oxygen Level (kg), Water Stock (L), Radiation Shield (0–100%), Energy Supply (kWh) e Food Stock (kg de alimento seco). Capacidades, explicações e cores vêm de resources.json; a fração inicial por modo vem de mission.json.
- As cartas não possuem duração individual. Escolhas aplicam efeitos imediatos e registram efeitos contínuos/agendados; consumo e produção de um sol são aplicados uma única vez após sua última carta. Terços de sol são apenas passos internos de integração, sem manhã/tarde/noite jogáveis.
- Existem 31 cartas das duas planilhas `Cartas de evento - Página1.csv` e `Cartas de evento - Página2.csv`, com categorias/dificuldades e efeitos em unidades explícitas. Imagens são resolvidas por ID em images/cards, com placeholder quando ausentes. Recursos zerados causam derrota automática; as cartas ainda não são cientificamente dimensionadas para uma base real.

## Interface e comportamento atuais

- Briefing com imagem NASA e crédito em texto; início por botão, arrasto ou setas leva ao seletor. Continuar missão restaura diretamente o modo e a fase salvos.
- Frente da carta: imagem, legenda, problema e alternativas. Sem dificuldade nem contador de eventos na HUD. Verso: escolha, descrição opcional dessa escolha, ícones/nomes dos recursos, efeitos e fonte. Descrições vazias não ocupam espaço.
- No PC, hover de mouse abre o detalhe dos recursos. No toque, segurar/deslizar mostra o detalhe e soltar fecha. Há acesso por foco de teclado. O detalhe explica o uso e a previsão após um sol, sem a frase “If nothing changes”.
- Números de variação aparecem na faixa reservada acima de cada indicador por **1,4 s**, verde para aumento e vermelho para queda. O preenchimento assume essa cor enquanto anima; contornos de mudanças da carta ficam até avançar. No Easy, mudanças sem alteração no inteiro não mostram número flutuante.
- Ao concluir um sol, salvar o novo estado e animar os recursos por **1,4 s** antes de atualizar contador/carta. Depois a luz do fundo atravessa da direita para a esquerda por **600 ms**, sem bloquear o novo evento. Movimento reduzido elimina movimento e espera de passagem de sol.
- Fundo ilustrado de Marte, visto pela moldura de uma base. Layout responsivo com padding, sem rolagem da página. Preservar legibilidade em celular/tablet, retrato/paisagem. A lista de efeitos do verso mantém overflow interno de segurança para textos extensos.
- A seção fixa de efeitos foi removida. O tablet de relatório continua implementado, mas seu botão está **temporariamente oculto**. As mãos foram removidas. Não reativar sem solicitação.

## Organização, dados e persistência

- HTML de entrada na raiz; motor/interface em `src/`; configuração e conteúdo em `data/`; CSS e ilustração em `assets/`; imagens de cartas/briefing em `images/`; sons em `sfx/`; testes em `tests/`.
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

## Painel de efeitos retirado

O painel de efeitos abaixo das cartas foi removido de ambos os modos. O tutorial Hard apresenta somente os cinco indicadores e a carta (seis etapas); Easy mantém quatro indicadores e a carta. O catálogo atual contém apenas efeitos imediatos. O motor continua compatível com efeitos pendentes em saves antigos, e o tablet permanece oculto.

## Life Support no Easy

- Easy tem quatro indicadores: Life Support (cruz de saúde), Radiation Shield, Energy Supply e Food Stock. Hard mantém os cinco indicadores separados.
- Life Support é somente visual: `round(100 × min(oxygen / oxygen.max, water / water.max))`. Manter estoques físicos independentes; não somar água e oxigênio. Previsões, animações e contornos comparam o índice arredondado antes/depois, inclusive quando troca o recurso limitante.
- O detalhe descreve oxigênio e água e mostra o número combinado de Life Support e sua variação prevista após um sol, sem números separados de estoque; no verso, Life Support mantém a identificação “Changes water”/“Changes oxygen” e a variação do componente. Essa variação não é o delta combinado da HUD.
- Configuração visual em `resources.easyLifeSupport`; usar a apresentação atual também para saves antigos. Não migrar nem arredondar estado físico.
- Regras detalhadas em [ARCHITECTURE.md](ARCHITECTURE.md#life-support-no-easy); limites científicos em [docs/RESEARCH.md](docs/RESEARCH.md#simplificação-visual-life-support-no-easy). O índice não mede autonomia ou sobrevivência nem representa todos os sistemas de suporte à vida.

## Finais e consumo temporário para teste

- Recurso em zero encerra com “Mission Failed”. Easy tem quatro finais de falha: Life Support (água ou oxigênio), blindagem, energia e comida. Hard tem cinco: oxigênio, água, blindagem, energia e comida. Os textos ficam em `data/interface.json` (`failedTitle`, `failedBody-*`).
- Verificar após efeitos imediatos e em cada passo interno dos fluxos diários/agendados; interromper ao zerar, sem permitir resgate posterior. Falha tem prioridade sobre sucesso no sol 30. Um zero arredondado na apresentação não causa derrota se o valor interno ainda for positivo, inclusive em Shield. Empate usa a ordem dos recursos em `resources.quantities` (atualmente oxygen, water, shield, energy, food).
- `mission.dailyCostMultiplier` está temporariamente em **3**: é mantido para compatibilidade com consumos-base negativos selecionados em saves antigos, mantendo coeficientes originais e produção. Efeitos de cartas não são multiplicados. Voltar para 1 encerra o ajuste de teste em novas missões. Saves preservam a configuração com que começaram; ausência do campo equivale a 1.
- Blindagem continua sem consumo diário por radiação. O final é uma regra do jogo, não um cálculo de dose ou sobrevivência.

As telas finais sem imagem (e o fallback de carregamento) usam título e descrição ampliados e ícones próprios: Life Support com pulso interrompido, pulmões riscados (oxigênio), gota rachada (água), escudo rachado (blindagem), raio partido (energia) e caixa vazia (comida). Sucesso usa marca de confirmação e encerramento manual usa saída. Em espaços baixos, ícone e título ficam lado a lado. Os desenhos ficam em `src/icons.js` (`EndingIcons`) e são decorativos, pois o texto identifica o resultado.

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

## Mini tutorial dos modos Easy e Hard

- Cada nova missão Easy mostra cinco etapas sobre a interface real: Life Support, Radiation Shield, Energy Supply, Food Stock e a carta. Hard tem seis: os cinco indicadores separados e a carta. Continue mission entra diretamente na partida, sem repetir o tutorial.
- Indicadores reutilizam as descrições e previsões dos detalhes existentes, com realce de um indicador por vez. Na última etapa, a carta demonstra continuamente um pequeno arrasto nos dois sentidos, preenchendo o botão correspondente como no arrasto real, sem selecionar alternativas. Respeitar movimento reduzido.
- Next, deslize horizontal em qualquer sentido ou setas avançam. A última etapa usa Let’s play!. Skip tutorial fica disponível desde o início; Escape também pula. O foco e os cliques da partida ficam bloqueados pelo diálogo modal.
- O tutorial não altera recursos, relógio, baralho, escolhas nem efeitos. A missão inicial é salva antes dele. Recarregar e continuar não repete o tutorial; não existe progresso de tutorial persistido.
- `src/tutorial.js` controla a apresentação, o realce e os gestos. Textos em `data/interface.json`; as explicações dos recursos continuam nas fontes já existentes. Conferir posicionamento em celular/tablet e mudança de orientação, sem cobrir o elemento realçado.

O tutorial não exibe contador de etapas nem a dica “Swipe sideways or tap the button”. Os gestos e setas continuam avançando as etapas de indicadores; no passo final, não encerram a demonstração. Let’s play! inicia o jogo; Skip tutorial e Escape continuam disponíveis para pular.


A fila limita os próprios efeitos contínuos/agendados a três, nos dois modos. Remover o mais antigo cancela suas contribuições futuras, sem desfazer o passado. Saves antigos têm efeitos `panelHidden` descartados na retomada, e a fila normalizada é salva. O tutorial não explica essa regra de remoção.

## Capacidades e partida em andamento

Novas missões usam os máximos O₂ 200 kg, água 1900 L, comida seca 235 kg, energia 1480 kWh e Shield 100 pontos. Os estoques iniciais são 75% dos máximos no Easy e 50% no Hard; as perdas diárias seguem a seção abaixo. São parâmetros de balanceamento, não dimensionamento científico. A Página2 já fornece efeitos em unidades explícitas, independentes das capacidades. Partidas em andamento preservam seu snapshot de capacidades e cartas.

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

O verso mostra Source somente quando a carta possui uma referência preenchida; não mostra Image source nem reserva espaço quando source está ausente. O importador usa Sources da Página2 ou Referência da Página1 para source. A origem da imagem permanece separada em imageSource e aparece ao final da legenda: “Image source:” seguida de um link com o domínio. Sem origem informada, o rótulo permanece e o valor fica vazio. O link abre em outra aba e não inicia arrasto da carta. Saves antigos com source de tipo image têm a origem na legenda, sem essa linha no verso.

## Remoção do painel inferior de efeitos

O painel inferior não é renderizado nem ocupa espaço em nenhum modo. A etapa Lasting effects foi retirada do tutorial Hard, que agora tem seis etapas. O catálogo atual usa somente efeitos imediatos, apresentados no verso. A simulação de efeitos contínuos/agendados de saves antigos continua compatível; o tablet permanece oculto.

## Sons

Cinco arquivos em `sfx/`, tocados por `src/audio.js` (`GameAudio`):

| Arquivo | Quando toca | Volume |
| --- | --- | --- |
| `button_clicking.mp3` | Toque/clique num indicador (hover não toca); Enter/Espaço num indicador; botões de resposta da carta (clique ou setas ← →); botão Next/Finish do verso | 0,55 |
| `card_swipe_v2.mp3` | Início da inclinação durante um arrasto da carta, para qualquer lado; uma vez por gesto, mesmo se voltar ao centro | 0,7 |
| `day_change_v2.mp3` | Quando o número do sol sobe (fim da passagem de sol), exceto se a missão terminou | 0,7 |
| `main_track.mp3` | Música de fundo em loop | 0,4 |
| `spacecraft_bg.mp3` | Som da nave em loop, junto da música e bem abaixo dela | 0,12 |

- Navegadores só liberam áudio após interação: os loops começam no primeiro toque, clique ou tecla em qualquer tela (inclusive no menu), com *fade-in* de 1,5 s a partir do volume 0. No celular, a tentativa se repete ao soltar o dedo/clicar até a música realmente começar.
- Botão de som (alto-falante) no menu ("Sound: On/Off") e na barra da missão, ao lado de End mission (ícone de 44 px, 54 px em telas grandes). Desligar pausa os loops e silencia os efeitos. A preferência fica em `localStorage` na chave `next-frontier-sound` (`on`/`off`), separada do save da missão.
- Os loops pausam quando a aba fica oculta e voltam ao reabrir. Efeitos usam uma cópia do áudio para que repetições rápidas se sobreponham.
- Arquivos e volumes ficam em `src/audio.js` (como layout e animações); textos do botão em `data/interface.json` (`soundLabel`, `soundOn`, `soundOff`). O tutorial (demonstração automática da carta) não toca sons.
- Publicação: `sfx/` faz parte do pacote estático (workflow e lista do README).

## Recuperação de áudio

Os eventos reais de interação continuam observados após a primeira reprodução: um loop pausado ou bloqueado é tentado novamente no próximo toque/clique/tecla, independentemente do outro loop. Uma tentativa pendente por loop evita duplicar play durante a sequência pointerdown/pointerup/click. Retorno à aba/pageshow tenta retomar; pagehide pausa os loops. Uma reprodução assíncrona que termina após desligar o som ou ocultar a página não reinicia o áudio. Desligar pausa também efeitos já em reprodução. A preferência off continua respeitada, sem ativar som silenciosamente. Testes em tests/audio.test.cjs cobrem bloqueios parciais/totais, interrupções, retorno à aba e mute durante play pendente.

A música de fundo e o som ambiente usam loop nativo contínuo. O efeito swipe toca uma vez quando a carta começa a inclinar no arrasto (mais de 8 px), mesmo se o jogador cancelar; não se repete ao soltar/confirmar. A demonstração automática do tutorial permanece silenciosa.

Radiation Shield representa a proteção dos próprios astronautas contra radiação. A descrição atual vale também para partidas salvas e o ícone compartilhado dos indicadores/efeitos é um escudo envolvendo o capacete e os ombros de um astronauta. O índice continua abstrato (0–100), sem medir dose nem afirmar que um traje sozinho fornece proteção suficiente.

## Catálogo combinado e IDs visuais

31 eventos: 14 da Página1 e 17 da Página2. Colisões 5/9/11 são mantidas como eventos distintos; as versões da Página1 usam IDs internos page1-5/page1-9/page1-11. O campo imageId conserva o ID visual numérico para procurar JPG/PNG/JPEG; sourceCardId e catalogSheet permitem auditoria. Todas as cartas têm imagem válida (28 arquivos distintos). Probabilidades por carta são recalculadas igualmente dentro da categoria combinada. Valores da Página1 atual usam unidades físicas/pontos, sem aplicar percentuais. Fontes múltiplas aparecem no verso; fontes vazias continuam ocultas. Saves em andamento são preservados; novas missões usam o catálogo combinado.

As probabilidades-base das categorias são proporcionais ao número de cartas no catálogo completo: contagem da categoria / total de cartas. O importador atualiza cards.json e categories.json juntos, sem arredondar os pesos. Cartas dentro da categoria permanecem equiprováveis. O filtro Easy continua removendo cartas Hard e normalizando os pesos existentes; saves preservam seus pesos anteriores.

Novas missões duram 30 sols; partidas salvas conservam a duração original do seu snapshot. O ícone Radiation Shield combina o contorno de um escudo com o capacete e os ombros de um astronauta: proteção pessoal, com menos detalhes para leitura em telas pequenas.
