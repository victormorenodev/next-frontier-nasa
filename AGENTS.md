# Mission: Perseverance — orientações vigentes para agentes

Revisado em **15/11/2026** contra o código e os JSONs atuais. Leia este documento, [README.md](README.md) e [ARCHITECTURE.md](ARCHITECTURE.md) antes de alterar o projeto. Conteúdo e fontes: [docs/CARDS.md](docs/CARDS.md), [docs/GLOSSARY.md](docs/GLOSSARY.md) e [docs/RESEARCH.md](docs/RESEARCH.md). `docs/history/` contém versões anteriores, não instruções vigentes. Não duplicar regras em CLAUDE.md.

## Produto e regras atuais

- Jogo de decisões por cartas inspirado em Reigns, com quatro astronautas numa base marciana e **35 sols** por nova missão. Surgiu a partir do desafio Junior Astronaut Mission Trainer do NASA Space Apps; não afirmar endosso, premiação ou submissão oficial sem evidência.
- Textos visíveis em inglês simples. Público de referência: crianças de 7–12 anos; interface indica Operation Steins / Easy para 7–10 e Operation Gate / Hard para 11+. Priorizar legibilidade, contraste, ícones claros e controles de toque/teclado.
- Menu com Start New Mission, Continue mission, Glossary, Credits e controle de som, sem sair. Briefing usa imagem NASA com crédito; botão, arrasto ou setas levam ao seletor “Welcome, Captain!”. Esquerda escolhe Operation Steins; direita, Operation Gate; botões/setas também funcionam.
- Cada sol tem uma carta (80%) ou duas (20%), nunca zero. Sortear categoria e depois carta com reposição, permitindo repetições consecutivas. Não introduzir períodos jogáveis de manhã/tarde/noite: terços de sol são integração interna.
- Catálogo de **31 eventos**: 14 da Página1 e 17 da Página2. Os IDs 5/9/11 repetidos são preservados como eventos distintos, usando page1-5/page1-9/page1-11 nas versões da Página1 e imageId numérico para as imagens. Há 28 imagens distintas, todas presentes.
- Pesos-base das categorias são proporcionais à quantidade de cartas: Routine 9/31, Maintenance 9/31, Exploration 1/31, Science 5/31 e Emergency 7/31. Cartas são equiprováveis dentro da categoria. Easy permite easy/medium (27 cartas); Hard permite os três níveis (31). Após filtrar, normalizar os pesos existentes e excluir categorias sem opções elegíveis.
- As cartas atuais aplicam somente efeitos imediatos, em kg/L/kWh/pontos, **sem conversão de percentuais**. A anotação Side effects da carta 9 fica apenas nos metadados. Consumo-base é aplicado uma vez após a última carta do sol; efeitos contínuos/agendados continuam suportados para saves antigos.
- `Engine` centraliza iniciar/responder/avançar/encerrar. A UI renderiza snapshots. Preservar aplicação única de efeitos, inclusive ao continuar pelo verso.

## Recursos e apresentação

- Máximos: Oxygen 200 kg, Water 1900 L, Energy 1480 kWh, Food 235 kg secos e Shield 100 pontos. `mission.difficulties.*.initialResourceFraction` inicia todos os recursos em 75% no Easy e 50% no Hard. Valores start em resources.json são fallback legado, não os estoques das novas missões atuais.
- Perdas-base por sol para a base inteira: O₂ 3,5 kg, água 10 L, energia 5 kWh, comida 2,6 kg; Shield sem perda diária. São parâmetros autorais `perSol`/`simulated`, sem multiplicação adicional por quatro ou conversão de dia terrestre. Não há produção automática de O₂/energia.
- Sem seletor Faster daily use: novas missões usam `dailyCostResource: null` e consumo normal. O campo `dailyCostMultiplier: 3` permanece para compatibilidade; saves antigos preservam seleção ou multiplicador global com que começaram. Efeitos de cartas não são multiplicados.
- Estoques físicos e Shield mantêm frações internas. Easy exibe estoques normalizados de 0 a 100 sem unidade. Shield é um índice de proteção dos **astronautas**, com símbolo % em ambos os modos e ícone de capacete/ombros dentro de escudo. Não é dose, massa ou porcentagem garantida de radiação bloqueada.
- Easy tem Life Support (cruz de saúde), Shield, Energy e Food. Life Support é `round(100 × min(oxygen / oxygen.max, water / water.max))`, somente visual. Manter água e oxigênio independentes. Detalhe mostra número combinado e previsão sem estoques separados; verso identifica Changes water/Changes oxygen, sem somar deltas como índice combinado. [Detalhes](ARCHITECTURE.md#life-support-no-easy).
- No Easy e em Shield, variações usam a diferença dos inteiros arredondados antes/depois, inclusive na troca do recurso limitante de Life Support. Hard mantém unidades físicas nos outros estoques. Não arredondar o estado nem causar derrota por um zero apenas visual.
- Detalhes dos recursos abrem por hover, foco de teclado ou segurar/deslizar no toque; soltar fecha. Explicam uso e previsão após um sol, sem “If nothing changes”.
- Deltas ficam numa faixa reservada por 1,4 s, com preenchimento verde/vermelho; contornos da escolha ficam até avançar. Ao concluir um sol, salvar o novo snapshot e animar 1,4 s antes de atualizar contador/carta; luz do fundo atravessa por 600 ms sem bloquear o evento seguinte. Respeitar movimento reduzido.
- Sem rolagem da página; preservar celular/tablet em retrato/paisagem e overflow interno de segurança. Fundo de Marte pela moldura da base; menu tem habitats marcianos. Mãos e painel inferior de efeitos foram removidos. Tablet de relatório permanece com botão oculto; não reativar sem solicitação.

## Cartas, glossário, tutorial e som

- Frente: imagem, legenda, problema e alternativas; sem dificuldade ou contador de eventos na HUD. Verso: escolha, descrição opcional, ícones/nomes, efeitos e Source quando preenchido. Descrições vazias e referências ausentes não ocupam espaço.
- Image source fica somente no fim da legenda: rótulo sempre presente, valor/link opcional. Source do verso vem de Referência/Sources, aceita múltiplos links e não usa origem da imagem como referência científica.
- Carregador busca JPG, PNG e JPEG pelo imageId (ou ID), usa placeholder quando faltam/falham e tenta novamente a cada 15 s enquanto a frente estiver aberta. Cancelar cargas ao mudar carta/face; não inserir imagens remotas automaticamente. Legenda/alt atuais têm prioridade para saves com mesmo ID/caminho.
- Glossário com **41 entradas** em inglês simples e ordem alfabética, disponível no menu e em legendas/enunciados/textos do verso. Cor e sublinhado pontilhado; hover, toque ou foco abrem popover. Aliases completos, sem diferenciar maiúsculas, com prioridade para os mais longos. Não marcar links, fontes, definições internas nem **botões de escolha**; consultar um termo não deve responder nem arrastar a carta.
- Tutorial novo: cinco etapas no Easy, seis no Hard (indicadores e carta). Shield começa explicando radiação. Reutilizar detalhes/previsões; textos longos rolam internamente sem cobrir o indicador e sem esconder Skip/Next. Next/deslize/setas avançam; última etapa demonstra inclinação e preenchimento dos botões até Let’s play!. Skip e Escape disponíveis desde o início; sem contador de etapas ou dica antiga de swipe. Não alterar simulação nem repetir tutorial ao continuar.
- Música e nave em loop, iniciados por interação permitida pelo navegador. Som tem controle no menu e HUD, preferência independente em `next-frontier-sound`. Indicadores/botões tocam button; mudança de sol toca sol se a missão não terminou; inclinação acima de 8 px toca swipe **uma vez por gesto**, inclusive se cancelar, sem repetir na confirmação. Demonstração do tutorial silenciosa.
- Áudio retoma em interações futuras/retorno à aba, com uma tentativa pendente por loop; nunca reativar preferência off silenciosamente. Desligar pausa loops e efeitos já em reprodução. Sons/volumes em src/audio.js; não adicionar dependência de áudio ao motor.

## Finais e persistência

- Qualquer recurso interno em zero encerra com Mission Failed, após efeitos imediatos e em cada passo diário/agendado. Parar ao zerar, sem resgate posterior; falha tem prioridade no sol 35. Empate usa a ordem oxygen, water, shield, energy, food.
- Easy tem quatro causas visuais de falha (Life Support para água/O₂, Shield, Energy, Food); Hard, cinco. Seis imagens aprovadas em images/endings/ são usadas integralmente, com botão Start New Mission fora, texto acessível e ícones vetoriais de fallback. Sucesso e desistência usam ícones vetoriais. Artes de falha não entram no sorteio. Originais/prompts em docs/previews/endings/.
- Um único slot versionado `next-frontier-save` guarda apenas a última missão em andamento. Vitória, derrota ou desistência remove o save; tela final só permanece na sessão atual. Saves antigos encerrados são descartados na inicialização. Continue desativado sem save válido; inválidos podem ser substituídos por nova missão sem confirmação.
- Abrir briefing/seletor preserva a partida; escolher modo substitui o slot. End mission ainda pede confirmação. Outra aba alterando o save suspende ações até recarregar. Progresso pertence ao navegador/origem, sem login, sincronização ou suporte offline dedicado.
- Saves mantêm capacidades, duração, recursos, cronograma/baralho, efeitos pendentes e parâmetros antigos. Sem dificuldade, usar Hard; sem categorias, preservar sequência. Textos atuais da interface, descrições de recursos e glossário têm prioridade visual. Shield antigo em g/cm² é convertido proporcionalmente para 0–100, incluindo cartas/efeitos pendentes, sem reaplicar escolhas.
- A fila interna de compatibilidade limita efeitos contínuos/agendados a três. Evicção cancela contribuições futuras sem desfazer o passado; descartar efeitos antigos panelHidden na retomada. Não recriar painel nem etapa de tutorial para essa compatibilidade.

## Dados, precisão científica e entrega

- HTML na raiz; src/ contém motor/UI; data/ configurações e conteúdo; assets/ CSS/fundos; images/ imagens; sfx/ sons; scripts/ importação; tests/ validação. HTTP e módulos nativos obrigatórios; Node/Python são ferramentas de desenvolvimento, sem build/dependências npm para jogar.
- Importar as planilhas com `python scripts/import_event_cards.py`; o script atualiza cards.json e categories.json juntos. Validar referências, tipos e probabilidades (categorias somam 1; cartas somam 1 por categoria antes do filtro). Parâmetros ficam nos JSONs, sem fórmulas executáveis; novos comportamentos podem exigir código.
- CSS/bootstrap no HTML usam a mesma versão v; bootstrap propaga aos módulos e busca os sete JSONs com cache: no-store. Atualizar os dois links juntos quando necessário para evitar mistura de versões.
- Distinguir medição, hipótese e balanceamento. Preservar fontes/unidades/contexto; não confundir kW/kWh, comida hidratada/seca ou Gy/Sv. Preservar massa em transferências físicas; não converter água automaticamente em pontos de Shield. Não existe dose nem consumo físico de blindagem por radiação. Propostas de pesquisa não autorizam implementação.
- A meta histórica de 15–20 minutos não foi validada com crianças. Atualizar documentos vigentes quando comportamento/estrutura mudar; manter histórico separado.

```bash
python -m http.server 8000 --bind 127.0.0.1
npm test
python scripts/import_event_cards.py --check
git diff --check
git status --short
```

Para mudanças visuais, conferir também navegador em 320×568, 375×667, 1032×1376 e 844×390, toque/teclado e movimento reduzido. Não usar testes históricos como prova de mudanças novas. Não incluir prints/logs de diagnóstico em commits sem necessidade.

Publish game (`.github/workflows/pages.yml`) testa e publica em GitHub Pages por push na main ou execução manual, empacotando index.html, src/, data/, assets/, images/ e sfx/. Hospedagem estática alternativa é possível. Não presumir autenticação, sincronização de branches ou sucesso de publicação sem consultar o estado real.
