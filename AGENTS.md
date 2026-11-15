# Next Frontier — orientações vigentes para agentes

Consolidado em **15/11/2026** a partir do código e dos JSONs atuais. Leia este documento, [README.md](README.md) e [ARCHITECTURE.md](ARCHITECTURE.md) antes de alterar o projeto. A pesquisa está em [docs/RESEARCH.md](docs/RESEARCH.md). Arquivos em `docs/history/` são registros de versões anteriores, não instruções atuais.

## Produto e regras atuais

- Jogo de decisões por cartas inspirado em Reigns: administrar uma base marciana com **quatro astronautas**. O projeto surgiu a partir do desafio Junior Astronaut Mission Trainer do NASA Space Apps; não afirmar endosso, premiação ou submissão oficial sem evidência.
- Todo texto visível ao jogador é **em inglês simples**. Documentação interna pode ser em português. Priorizar crianças: ícones claros, frases curtas, contraste e controles de toque/teclado acessíveis.
- A missão termina ao concluir **40 sols**. Cada sol tem **1 carta (80%)** ou **2 cartas (20%)**; não há sols sem eventos. A meta histórica de 15–20 minutos ainda não foi validada com usuários.
- Sortear primeiro categoria, depois carta da categoria, com reposição. Repetições consecutivas são permitidas, inclusive no mesmo sol. Categorias-base: Routine 35%, Maintenance 25%, Exploration 20%, Science 15%, Emergency 5%.
- Após o briefing, escolher **Easy** (cientistas de 7–10 anos) ou **Hard** (astronautas de 11+). Easy sorteia somente cartas easy/medium; Hard permite os três níveis. Após filtrar, normalizar probabilidades e excluir categorias sem cartas elegíveis.
- A simulação usa unidades físicas em ambos os modos. Easy exibe inteiros normalizados de **0 a 100, sem símbolo %** e sem unidade. Não arredondar o estado interno. Previsões e variações reais usam a diferença dos valores arredondados antes/depois; frações continuam acumulando. Hard exibe unidades físicas.
- Cinco recursos: Oxygen Level (kg), Water Stock (L), Radiation Shield (g/cm²), Energy Supply (kWh) e Food Stock (kg de alimento seco). Quantidades iniciais, capacidades, explicações e cores vêm dos JSONs.
- As cartas não possuem duração individual. Escolhas aplicam efeitos imediatos e registram efeitos contínuos/agendados; consumo e produção de um sol são aplicados uma única vez após sua última carta. Terços de sol são apenas passos internos de integração, sem manhã/tarde/noite jogáveis.
- Existem dez cartas mock, com efeitos simulados. Ainda não há derrota automática por recurso zerado nem cartas cientificamente dimensionadas para uma base real.

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
- Preservar massa em transferências de água/blindagem. Radiação não consome blindagem; densidade superficial não é dose nem garantia de proteção. Não confundir kW/kWh, comida hidratada/seca ou Gy/Sv.
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
