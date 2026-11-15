# Mission: Perseverance

Jogo de decisões por cartas em uma base marciana, com quatro astronautas e uma missão de **25 sols no Easy ou 30 no Hard**. O jogador assume o papel de capitão. Textos do jogo em inglês simples, voltados ao público de 7–12 anos.

Documentação revisada contra o código e os JSONs em **15/11/2026**. Pesquisa e modelos históricos estão em [docs/RESEARCH.md](docs/RESEARCH.md); não definem as regras atuais.

## Executar

Na raiz do repositório:

```bash
python -m http.server 8000 --bind 127.0.0.1
```

Abra **http://127.0.0.1:8000/**. São módulos JavaScript nativos e JSONs por fetch: HTTP é obrigatório, `file://` não funciona. Não há framework, dependências npm ou build obrigatório para jogar.

## Jogar

O menu tem **Start New Mission**, **Continue mission**, **Glossary** e controle de som (Credits está oculto), sem botão de sair. Continue fica desativado quando não há missão válida em andamento no navegador.

Start New Mission abre o briefing com imagem NASA e crédito. Botão, arrasto ou setas levam à seleção **Welcome, Captain!**. Arrastar à esquerda escolhe Operation Steins; à direita, Operation Gate. Botões e setas também funcionam. O seletor de consumo acelerado foi retirado; novas missões usam consumo normal.

| Missão | Modo interno | Indicação na interface | Recursos iniciais | Cartas elegíveis |
| --- | --- | --- | ---: | ---: |
| Operation Steins | Easy | Ages 7–10 | 75% da capacidade | 27 (easy/medium) |
| Operation Gate | Hard | Ages 11+ | 50% da capacidade | 31 (easy/medium/hard) |

Cada sol tem uma carta (80%) ou duas (20%). Responda por botão, arrasto ou setas; o verso mostra a escolha, explicação opcional, efeitos imediatos e **Source:** quando há referência. Efeitos diários são aplicados uma vez, após a última carta do sol. Cartas podem reaparecer, mas nunca imediatamente após o mesmo ID, inclusive entre sols. Completar 25 sols no Easy ou 30 no Hard vence; qualquer recurso interno em zero causa **Mission Failed**, com prioridade sobre a vitória.

## Recursos e consumo

Valores físicos internos não são arredondados. Shield é um índice abstrato de proteção dos astronautas, de 0 a 100 pontos, sem equivalência a dose ou porcentagem garantida de radiação bloqueada.

| Recurso | Máximo | Início Easy | Início Hard | Perda normal por sol (base inteira) |
| --- | ---: | ---: | ---: | ---: |
| Oxygen Level | 200 kg | 150 kg | 100 kg | 3,5 kg |
| Water Stock | 1900 L | 1425 L | 950 L | 10 L |
| Radiation Shield | 100 pontos | 75 | 50 | nenhuma |
| Energy Supply | 1480 kWh | 1110 kWh | 740 kWh | 5 kWh |
| Food Stock | 235 kg secos | 176,25 kg | 117,5 kg | 2,6 kg |

Não há produção automática compensando essas perdas. As cartas aplicam alterações adicionais nas unidades dos estoques e pontos de Shield. Os valores são balanceamento autoral, não dimensionamento científico de uma base real.

Easy exibe inteiros de 0 a 100 sem unidade nos estoques. Água e oxigênio aparecem juntos em **Life Support**, com cruz de saúde: `round(100 × min(oxygen / oxygen.max, water / water.max))`. Seus estoques continuam separados. Hard mostra os cinco indicadores com unidades físicas; **Shield mostra % nos dois modos**, com ícone de astronauta dentro de escudo. Um zero apenas arredondado não encerra a missão.

Hover ou foco de teclado nos indicadores abre o detalhe; no toque, segurar/deslizar mostra e soltar fecha. Life Support mostra só o valor combinado e sua previsão, sem números separados de água/oxigênio. No verso, “Changes water”/“Changes oxygen” identifica cada componente, sem somar essas variações como se fossem o delta combinado.

Mudanças animam por 1,4 s; a passagem de sol inclui luz do fundo por 600 ms, respeitando movimento reduzido. Não há painel de efeitos abaixo das cartas. O tablet de relatório continua implementado com botão oculto.

## Cartas, imagens e probabilidades

O catálogo combina **14 cartas da Página1 e 17 da Página2**. Os IDs 5/9/11 repetidos são eventos distintos: as versões da Página1 usam `page1-5`, `page1-9` e `page1-11`. `imageId` preserva o número usado para a imagem. Há **28 arquivos de imagem para os 31 eventos**, todos disponíveis no catálogo atual.

| Categoria | Cartas | Probabilidade-base |
| --- | ---: | ---: |
| Routine | 9 | 9/31 ≈ 29,03% |
| Maintenance | 9 | 9/31 ≈ 29,03% |
| Exploration | 1 | 1/31 ≈ 3,23% |
| Science | 5 | 5/31 ≈ 16,13% |
| Emergency | 7 | 7/31 ≈ 22,58% |

Sorteia-se categoria e depois carta, com chances iguais dentro da categoria. No Easy, as cartas Hard são excluídas e os pesos restantes normalizados; os pesos-base das categorias vêm do catálogo completo. Partidas salvas mantêm seus pesos antigos.

Imagens são procuradas por `imageId` (ou ID), nas extensões `.jpg`, `.png`, `.jpeg`. Se faltarem ou forem inválidas, aparece um placeholder; o carregador tenta novamente a cada 15 segundos enquanto a frente está aberta. A legenda termina com **Image source:** e link da origem, ou valor vazio. As referências do verso são independentes; sem referência, a linha Source não aparece.

Para reimportar as planilhas e recalcular os pesos:

```bash
python scripts/import_event_cards.py
python scripts/import_event_cards.py --check
```

O importador atualiza `data/cards.json` e `data/categories.json`. Os efeitos atuais são **unidades explícitas, não percentuais da capacidade**. O navegador lê os JSONs, sem executar Python. [Mapeamento e auditoria](docs/CARDS.md).

## Tutorial, glossário e áudio

Novas missões têm tutorial sobre os indicadores e a carta: cinco etapas no Easy, seis no Hard. Radiation Shield explica o que é radiação e a proteção dos astronautas. Next, deslize ou setas avançam; Skip tutorial está disponível desde o início. A última etapa demonstra a inclinação e o preenchimento dos botões continuamente até **Let’s play!**, sem aplicar escolhas nem tocar o som de arrasto. Continuar missão não repete o tutorial.

O glossário tem **41 termos**, em ordem alfabética, no menu e nos textos das cartas, com cor e sublinhado pontilhado. Hover, toque ou foco mostram explicações curtas; **botões de escolha não recebem glossário**. [Auditoria e fontes](docs/GLOSSARY.md).

Música e som ambiente ficam em loop após uma interação permitida pelo navegador. O botão de som no menu e no jogo controla todos os sons e guarda a preferência. Há efeitos para indicadores/botões, avanço do sol e início da inclinação da carta (uma vez por arrasto, mesmo sem confirmar). Interrupções são recuperadas nas próximas interações ou no retorno à aba, respeitando o som desligado.

## Progresso salvo

Um slot `next-frontier-save` guarda **somente a última missão em andamento**, incluindo fase, modo, estoques, baralho e configuração original. Continuar restaura sem reaplicar escolhas. Vitória, derrota ou desistência removem o save; a tela final permanece só na sessão atual. Saves antigos já encerrados são descartados na inicialização.

Abrir o briefing não substitui uma missão; escolher o novo modo substitui o slot sem confirmação. A confirmação de End mission continua existindo. Saves antigos preservam duração, capacidades, cartas, sequência e ajustes de consumo. A migração de Shield antigo em g/cm² converte proporcionalmente para 0–100 sem reaplicar escolhas.

O progresso pertence ao navegador e à origem do site; não há login, sincronização ou suporte offline dedicado. Outra aba que altera o save suspende a interface antiga. Falhas de armazenamento mostram aviso; saves inválidos podem ser substituídos iniciando outra missão. A preferência `next-frontier-sound` é independente da partida.

## Editar e validar

| Arquivo | Conteúdo |
| --- | --- |
| `data/mission.json` | Duração, tripulação, eventos/sol e fração inicial por modo |
| `data/resources.json` | Máximos, unidades, descrições, indicadores e fallback inicial legado |
| `data/cards.json`, `data/categories.json` | Conteúdo e probabilidades gerados pelo importador |
| `data/flows.json` | Perdas/produções-base; atualmente apenas perdas `perSol`, `simulated` |
| `data/interface.json` | Textos e caminhos das imagens de briefing/finais |
| `data/glossary.json` | Termos, aliases e definições |
| `scripts/import_event_cards.py` | Leitura das planilhas, textos resumidos e legendas editoriais |

Layout, gestos, cálculos, ícones e áudio ficam no código. Não inserir fórmulas executáveis nos JSONs. O motor ainda aceita efeitos contínuos/agendados para compatibilidade, mas o catálogo atual só aplica efeitos imediatos.

```bash
npm test
python scripts/import_event_cards.py --check
git diff --check
git status --short
```

São **nove suítes Node**, sem dependências npm, cobrindo motor, dados, apresentação, persistência e áudio. Node é ferramenta de desenvolvimento, não requisito do jogador. Alterações visuais exigem conferência no navegador: 320×568, 375×667, 1032×1376 e 844×390, incluindo toque, teclado e movimento reduzido. A duração histórica de 15–20 minutos não foi validada com crianças.

## Publicar e consultar documentos

O workflow **Publish game** (`.github/workflows/pages.yml`) testa e publica em GitHub Pages por push na `main` ou execução manual. O pacote contém `index.html`, `src/`, `data/`, `assets/`, `images/` e `sfx/`; também pode ser servido por outra hospedagem estática HTTP. Commit local não publica sozinho. Não presumir sucesso de deploy nem enviar prints/logs/documentação interna como parte do jogo.

- [AGENTS.md](AGENTS.md): orientações vigentes para agentes.
- [ARCHITECTURE.md](ARCHITECTURE.md): implementação e compatibilidade.
- [docs/CARDS.md](docs/CARDS.md): importação, imagens e fontes das cartas.
- [docs/GLOSSARY.md](docs/GLOSSARY.md): termos revisados e referências.
- [docs/RESEARCH.md](docs/RESEARCH.md): pesquisa e limites científicos.
- [CLAUDE.md](CLAUDE.md): ponto de entrada, sem duplicar regras.
- [docs/history/](docs/history/): versões históricas, sem valor de instrução atual.
