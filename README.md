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

Cada sol tem uma carta (80%) ou duas (20%). Resolva todas para concluir o sol; ler ou responder não gasta um sol por carta. Consumo, produção e efeitos programados são calculados uma vez ao concluir cada sol. O objetivo implementado é concluir o sol 40. Ainda não há derrota automática por falta de recursos.

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

O progresso fica no mesmo navegador e origem do site. Limpar os dados remove o save; armazenamento privado/desativado pode não persistir. Não há login nem sincronização entre dispositivos. Mudar o domínio não transfere o progresso. Quando outra aba altera o save, a aba antiga suspende ações até recarregar. Saves incompatíveis não são apagados automaticamente: a interface pede confirmação para substituir ao iniciar novamente.

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
