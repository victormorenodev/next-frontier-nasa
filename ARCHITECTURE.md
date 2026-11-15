# Arquitetura — Next Frontier

Documento vivo: cresce a cada passo do jogo. Registra **o que existe agora**, por que foi feito assim e como as partes se conectam. Contexto de produto e fontes científicas ficam em `CLAUDE.md`.

## Regras que moldam a arquitetura

| Regra | Consequência no código |
| --- | --- |
| O jogo é em inglês | Todo texto visível ao jogador está em inglês |
| Roda abrindo um HTML, sem servidor | Só `<script src>` clássicos; sem ES modules, sem `fetch` de arquivos locais, sem npm nem build |
| Público de 7 a 12 anos (lema de interface) | Ícones antes de texto, alvos grandes, alto contraste, mouse e toque com o mesmo comportamento |
| Quantidades com significado físico | Cada quantidade tem unidade (`unit`) e nome da unidade por extenso (`unitName`) |

## Estrutura vigente — atualização de 14/11/2026

Esta seção substitui as referências históricas abaixo a 30 sols, 45 cartas, 1–3 cartas por sol e períodos do dia.

- A missão termina após concluir **40 sols**, incluindo o último sol inteiro.
- Cada sol sorteia **1 evento (80%)** ou **2 eventos (20%)**, conforme definido pelo usuário. Não há sols sem cartas.
- As cartas não têm duração individual. Resolver eventos não avança o relógio; concluir o sol contabiliza uma vez o consumo, a produção e os efeitos agendados, com 1 ou 2 eventos.
- Não há períodos jogáveis de manhã/tarde/noite. Ao passar de sol, apenas o background anima uma virada de dia com luz quente atravessando o céu e voltando ao fundo escuro. Cartas e indicadores permanecem visíveis, sem tela de transição nem órbita em primeiro plano. Respeitar movimento reduzido.
- O baralho é dimensionado pelo total de eventos sorteados nos 40 sols (40 a 80 cartas). As cartas se repetem ao longo da missão; continua sem cartas iguais consecutivas.
- O motor de fluxos conserva terços de sol apenas como unidade interna de integração; a energia solar é um orçamento diário distribuído nesses passos.

## Arquivos

| Arquivo | Camada | Papel |
| --- | --- | --- |
| `index.html` | Página | Estrutura mínima; carrega os scripts em ordem |
| `style.css` | Visual | Estilo mobile first |
| `indicators.js` | Lógica | Sistema de indicadores. Sem DOM. Expõe `Indicators` |
| `mission.js` | Lógica | Estado da missão: sol atual, se acabou e por quê. Sem DOM. Expõe `Mission` |
| `flows.js` | Lógica | Consumo e produção ao longo do tempo, e efeitos das respostas que duram ou vêm depois. Sem DOM. Expõe `Flows` |
| `cards.js` | Dados | As cartas (por enquanto, 10 de teste). Expõe `CardData` |
| `deck.js` | Lógica | Valida cartas, embaralha e monta o baralho conforme os eventos dos 40 sols. Sem DOM. Expõe `Deck` |
| `card-ui.js` | Interface | Desenha a carta (frente e costas), o giro e o arrastar. Expõe `CardUI` |
| `images/` | Imagens | Imagens das cartas (`mock-card.svg` é a imagem de teste) |
| `ui.js` | Interface | Barra da missão, indicadores (hover/toque/foco) e o fluxo do jogo (começar, responder, próxima carta, fim) |
| `tests/*.test.js` | Desenvolvimento | Verificações no Node (`indicators`, `mission`, `flows` e `deck`). O jogo não precisa do Node |

```
index.html
  ├─ indicators.js   → window.Indicators   (lógica pura, sem DOM)
  ├─ mission.js      → window.Mission      (lógica pura, sem DOM)
  ├─ flows.js        → window.Flows        (lógica pura; usa Indicators)
  ├─ cards.js        → window.CardData     (dados)
  ├─ deck.js         → window.Deck         (lógica pura; usa Indicators)
  ├─ card-ui.js      → window.CardUI       (desenha a carta; usa Indicators e Deck)
  └─ ui.js           → usa tudo acima e conduz o jogo
```

A ordem dos `<script>` importa: cada arquivo vem depois daqueles de que depende, e `ui.js` vem por último. Cada arquivo de lógica termina com o mesmo trecho: no Node exporta com `module.exports`; no navegador cria uma variável global. Assim a mesma lógica roda no jogo e nos testes.

## Passo 1 — Sistema de indicadores (`indicators.js`)

### Quantidades × indicadores

O sistema separa **o que a base guarda** (quantidades) de **o que o jogador vê** (indicadores).

```
Quantidades (estado)          Indicadores (o que aparece)
  oxygen ─┐
  water  ─┴──────────────▶  Life Support       (mostra a parte mais baixa)
  shield ────────────────▶  Shield Protection
  energy ────────────────▶  Energy
  food   ────────────────▶  Food Stock
```

Oxigênio e água ficam separados no estado, mas aparecem juntos em Life Support, como pede o `CLAUDE.md`. O nível de Life Support é o da parte mais baixa: muita água não esconde pouco oxigênio.

### Definições

- `QUANTITIES`: cada quantidade com `name`, `unit`, `unitName`, `start` e `max` (ver Passo 3).
- `INDICATORS`: os quatro indicadores, na ordem da tela, cada um com suas `parts`.

### Funções

Todas são puras: devolvem um estado novo e nunca alteram o recebido.

| Função | O que faz |
| --- | --- |
| `createState()` | Estado inicial: `{oxygen, water, shield, energy, food}` |
| `change(state, key, amount)` | Soma `amount` (pode ser negativo) e mantém entre 0 e `max`. Rejeita chaves desconhecidas |
| `level(state, key)` | Quão cheia está a quantidade, de 0 a 1 |
| `read(state)` | Lista dos quatro indicadores com `level`, a parte mais baixa (`lowest`) e cada parte com `value`, `max`, `level`, `unit` e `unitName` |

A interface só usa `read()`, nunca o estado cru.

## Passo 2 — Interface só com indicadores (`ui.js`, `style.css`)

### O que aparece

1. **Linha de quatro contêineres** no topo, um por indicador, cada um com um ícone (pulmões, escudo, raio, maçã) e uma cor própria. O contêiner se enche de baixo para cima conforme o `level`: dá para ver de longe o que está acabando, sem ler números.
2. **Área de detalhe**, numa faixa própria entre os indicadores e a carta (ver Passo 5). Sem indicador ativo, a faixa fica invisível (Passo 7). Ao apontar para um indicador, mostra o nome, o nome da unidade por extenso, a quantidade em números grandes com a sigla (`240 kWh`), a capacidade (`of 300`) e uma barra. Life Support mostra oxigênio e água lado a lado, cada um com sua unidade.

### Interação

| Entrada | Comportamento |
| --- | --- |
| Mouse | Passar por cima mostra o detalhe; sair da linha esconde |
| Toque | Encostar o dedo mostra; **deslizar o dedo pela linha** troca de indicador; ao soltar, o detalhe fica 2 s e some |
| Teclado | Focar um indicador (Tab) mostra; sair da linha esconde |

Detalhes de implementação:

- Os eventos ficam na linha inteira (`#indicators`), não em cada contêiner. O indicador sob o ponteiro é achado com `document.elementFromPoint`. Isso é necessário porque, no toque, o navegador prende o dedo ao primeiro elemento tocado.
- `touch-action: none` na linha impede que deslizar o dedo role a página.
- Os contêineres são `<button>`, o que dá foco pelo teclado. O `aria-label` de cada um traz nome e valores, e a área de detalhe é `aria-live`.
- Os ícones são SVG inline em `ui.js`: não dependem de arquivos externos nem de fontes de emoji.

### Visual (mobile first)

- Base para telas estreitas (a partir de 320 px). Os quatro contêineres sempre ficam em uma linha; `minmax(0, 1fr)` impede que os SVGs alarguem as colunas.
- A partir de 600 px, só aumenta o espaçamento.
- Cores por indicador em variáveis CSS (`--lifeSupport`, `--shield`, `--energy`, `--food`).
- `prefers-reduced-motion` desliga as animações.

## Passo 3 — Unidades

Cada quantidade ganhou uma unidade física apropriada. Os valores iniciais e as capacidades foram reaproveitados do protótipo anterior (`CLAUDE.md`, seção 5): são escolhas de protótipo, não dimensionamento real.

| Quantidade | Unidade | Por extenso (na tela) | Início | Capacidade (`max`) | Por que essa unidade |
| --- | --- | --- | --- | --- | --- |
| Oxygen | kg | kilograms | 60 | 60 | O consumo de referência é dado em massa (kg por pessoa por dia) |
| Water | L | liters | 600 | 700 | Medida familiar para crianças; 1 L de água ≈ 1 kg. Capacidade maior que o início desde o Passo 8 |
| Shield | g/cm² | grams per square centimeter | 8 | 10 | Densidade superficial: 1.600 kg de água sobre 20 m² = 8 g/cm² |
| Energy | kWh | kilowatt-hours | 240 | 300 | Energia guardada na bateria; kW (potência) é outra grandeza |
| Food | kg | kilograms of dry food | 100 | 100 | Massa de alimentos secos |

Cuidados registrados:

- **Shield** mede quanta água envolve o abrigo por área. **Não é dose de radiação**, e o jogo não afirma quanto ela protege.
- A capacidade de 10 g/cm² do Shield é o teto visual do protótipo anterior, não um limite físico.
- Formatação na tela: números inteiros a partir de 100 e uma casa decimal abaixo disso (ex.: `8.5 g/cm²`), em formato inglês (`1,600`).

## Passo 4 — Espaço da carta

Um quadrado vazio abaixo dos indicadores reserva o lugar das cartas. Ainda não há cartas nem conteúdo. A borda é tracejada porque é um espaço reservado; quando as cartas existirem, deve virar sólida.

Na primeira versão, o detalhe dos indicadores flutuava por cima do topo do quadrado. O Passo 5 trocou isso por uma faixa própria.

## Passo 5 — Faixa de detalhe: o detalhe não cobre a carta

```
┌────┬────┬────┬────┐   .indicators   (no máximo 440 px de largura)
│ ◉  │ ⬡  │ ϟ  │ ✿  │
└────┴────┴────┴────┘
┌───────────────────┐   .readout      (altura fixa: --readout-h)
│      detalhe      │   └ #detail     (visível só com indicador ativo)
└───────────────────┘
         18 px
┌───────────────────┐
│                   │   #card  .card-slot  (quadrado)
│  espaço da carta  │
│                   │
└───────────────────┘
```

- **Faixa reservada**: `.readout` tem altura fixa. O detalhe nunca cobre a carta e nada se mexe quando ele abre ou fecha.
- **Detalhe compacto**, para caber na faixa:
  - título (nome do indicador);
  - linha com o nome da unidade por extenso (e o nome da parte, no Life Support);
  - número grande + sigla, com a capacidade (`of 300`) na mesma linha, à direita;
  - barra.

  Com mais de uma parte, as partes ficam **lado a lado** (`--n` colunas), então o Life Support tem a mesma altura que os outros.
- **Carta empurrada para baixo**: o espaço da carta fica abaixo da faixa (tamanho e posição atuais: Passo 6).
- **Tokens de layout** em `:root`:

  | Token | Até 599 px | A partir de 600 px |
  | --- | --- | --- |
  | `--readout-h` (altura da faixa) | 98 px | 108 px |
  | Número grande do detalhe | 26 px | 32 px |

  (Valores reduzidos no Passo 8 para subir a carta.)
- **Detalhe escondido** com `.empty` (opacidade 0, sem receber cliques), sem sair do DOM, para o `aria-live` continuar anunciando.

Conferido via `file://` em 375×667, 320×568 e 760×800: o detalhe termina 18 px acima da carta e nada transborda da faixa.

## Passo 6 — Carta em retrato, centralizada

A carta deixou de ser quadrada: agora é um **retângulo em pé, proporção 3:4** (como uma carta de baralho), centralizado no espaço que sobra abaixo da faixa de detalhe.

```
main  (coluna flex, altura = 100svh)
├ .indicators   altura do conteúdo, não encolhe
├ .readout      altura fixa (--readout-h), não encolhe
└ .card-area    flex: 1 → ocupa todo o resto
   └ #card .card-slot   3:4, centralizada na horizontal e na vertical
```

- **Ocupar o resto da tela**: `main` virou uma coluna flex com a altura da tela (`100svh`). Indicadores e faixa têm `flex-shrink: 0`; `.card-area` tem `flex: 1` e fica com todo o espaço restante.
- **Centralizar**: `.card-area` usa `display: grid`. No Passo 8 passou de `place-items: center` para `start center`: centralizada na horizontal e encostada no topo, para ficar mais alta na tela.
- **Tamanho da carta**: `.card-area` é um *container* de tamanho (`container-type: size`), e a carta se mede por ele: `width: min(100cqw, 100cqh * 3 / 4)` com `aspect-ratio: 3 / 4`. Ela fica a maior possível sem passar da largura nem da altura disponível, então nunca precisa rolar. Isso substitui o cálculo manual do passo anterior (`--above-card`), que precisava ser ajustado sempre que algo acima mudava.
- **Telas muito baixas**: `.card-area` tem `min-height: 300px`; abaixo disso a página rola em vez de esmagar a carta.

Medidas conferidas via `file://`:

| Tela | Carta (L × A) | Observação |
| --- | --- | --- |
| 375×667 | 307×410 | Limitada pela altura; centralizada |
| 390×844 | 355×473 | Limitada pela largura; ~72 px acima e abaixo |
| 320×568 | 243×324 | Sem rolagem |
| 760×800 | 365×487 | Centralizada na horizontal |

## Passo 7 — Barra da missão e detalhe sem moldura vazia

### Barra da missão (acima dos indicadores)

```
☼ Sol 1                [ End mission ]
  Daytime
┌────┬────┬────┬────┐
│ ◉  │ ⬡  │ ϟ  │ ✿  │
```

- **Sol atual** à esquerda, com um ícone e o período do dia embaixo (Passo 9). O valor vem de `mission.sol`.
- **End mission** à direita: botão com contorno vermelho e altura mínima de 44 px.
- `.topbar` tem `flex-shrink: 0` e a mesma largura máxima dos indicadores (440 px). A carta encolhe sozinha para dar espaço (Passo 6).

### Estado da missão (`mission.js`)

| Função | O que faz |
| --- | --- |
| `createMission()` | Missão nova no Sol 1 (campos completos no Passo 9) |
| `endMission(mission)` | Devolve a missão com `ended: true`; encerrar de novo não muda nada |

`FIRST_SOL` é 1. A passagem do tempo entrou no Passo 9.

### Fluxo de encerramento

```
End mission ──▶ diálogo "End the mission?"
                 ├ Keep playing (ou tocar fora) ──▶ fecha, nada muda
                 └ End mission ──▶ Mission.endMission
                                    ├ botão End mission desativado
                                    └ carta mostra "Mission ended" + "New mission"
                                                                   └▶ indicadores e missão voltam ao início
```

- **Confirmação**: um `<dialog>` nativo (`showModal`) evita que um toque sem querer encerre a missão. O foco começa em "Keep playing", a opção segura.
- **Carta encerrada**: a classe `.ended` deixa a borda sólida e centraliza a mensagem.

### Detalhe sem moldura vazia

A dica com borda tracejada ("Touch or point at an icon…") foi removida. Sem indicador ativo, a faixa `.readout` continua reservando o espaço, mas fica invisível. O detalhe simplesmente aparece quando o jogador aponta para um indicador. Manter o espaço reservado garante que a carta não pule nem seja coberta.

Conferido via `file://` em 375×667: tela inicial, detalhe ao tocar, diálogo aberto e missão encerrada, sem rolagem (carta de 266×354).

## Passo 8 — Sistema de cartas

### Formato de uma carta (`cards.js`)

```js
{
  id: 'mock-solar-storm',          // único; cartas iguais nunca vêm em seguida
  mock: true,                       // carta de teste: números não são reais
  difficulty: 'hard',               // 'easy' | 'medium' | 'hard'
  time: '1',                        // '1/3' | '2/3' | '1' sol (Passo 9)
  description: 'A solar storm is coming! …',
  image: 'images/mock-card.svg',    // caminho relativo ao index.html
  imageAlt: 'The Sun throwing out a big storm',
  source: {institution: 'NASA', url: 'https://www.nasa.gov/…'},
  left:  {label: 'Keep it as is',      effects: {}},
  right: {label: 'Add water to walls', effects: {water: -100, shield: 0.5, energy: -6}}
}
```

- **Efeitos** usam a unidade de cada quantidade: oxygen kg, water L, shield g/cm², energy kWh, food kg. Uma resposta pode mexer em vários recursos ou em nenhum.
- **Água ↔ blindagem conserva a massa**: o abrigo tem 20 m², então 100 L de água = 100 kg = 5 kg/m² = **0,5 g/cm²**. As cartas de teste que movem água usam essa conta, e um teste confere a massa total.
- **Capacidade da água**: subiu de 600 para 700 L (escolha de protótipo). Com o tanque cheio no início, devolver água da blindagem seria cortado no limite e "sumiria" massa.
- Os dados ficam em `.js`, não em `.json`: abrindo o HTML direto (`file://`), o navegador não deixa `fetch` ler arquivos locais.
- **Dificuldade**: por enquanto só aparece na carta (Easy/Medium/Hard, com cor). Ainda não muda regras nem a montagem do baralho.

### Cartas de teste

São 10 cartas (`mock: true`). As fontes apontam para páginas reais sobre o assunto (NASA, NASA JPL, Canadian Space Agency), mas **os valores dos efeitos foram inventados**. As costas dessas cartas avisam: "Test card: these numbers are not real." Todas usam a mesma imagem de teste.

### Baralho (`deck.js`)

| Função | O que faz |
| --- | --- |
| `validateCard(card)` | Lista os problemas de uma carta: dificuldade inválida, sem descrição/imagem/fonte, resposta sem rótulo, efeito em quantidade que não existe |
| `shuffle(list, random)` | Embaralhamento Fisher–Yates; `random` pode ser trocado nos testes |
| `createDeck(cards, size = 45, random)` | Monta o baralho da missão |

Como `createDeck` funciona:

1. Valida todas as cartas; se houver erro, para com a lista de problemas.
2. Monta **rodadas**: cada rodada é o conjunto inteiro de cartas embaralhado. Com 10 cartas, 45 = 4 rodadas completas + 5 cartas de uma quinta. Assim cada carta aparece 4 ou 5 vezes.
3. Dentro de uma rodada não há repetição. Na emenda entre rodadas, se a nova começaria com a mesma carta que terminou a anterior, as duas primeiras trocam de lugar. **Resultado: nunca duas cartas iguais em seguida.**
4. Um baralho novo é embaralhado a cada missão (início do jogo e "New mission").

O teste roda 500 embaralhamentos e confere 45 cartas, nenhuma repetição seguida e cada carta 4 ou 5 vezes.

### A carta na tela (`card-ui.js`)

```
.card-slot (#card)            tamanho 3:4 (Passo 6)
└ .card3d                     arrastar: translateX + rotate
  └ .card-inner               girar: rotateY(180deg) com .flipped
    ├ .face.front             dificuldade · n/45 · imagem · descrição · ← resposta | resposta →
    └ .face.back              escolha · efeitos · fonte (instituição) · Next card
```

- **Frente**: dificuldade, contador (`1 / 45`), imagem, descrição e as duas respostas (`← esquerda` e `direita →`).
- **Responder**, de três jeitos:
  - **tocar/clicar** em uma das respostas;
  - **arrastar** a carta. Ela acompanha o dedo ou o mouse e inclina; passando de 28% da largura, a resposta daquele lado acende e, ao soltar, vale. Antes disso, ela volta ao centro. Movimentos de até 8 px contam como toque, não arrasto;
  - **setas ← →** do teclado.
- **Costas**: só aparecem depois de responder. A carta gira (0,6 s) e mostra a resposta escolhida, cada efeito com a cor do indicador e o valor com unidade (`−8 kWh`, `+0.5 g/cm²`), e a fonte. A fonte mostra **só a instituição**, como link para a página completa (abre em outra aba).
- **Próxima carta**: o botão "Next card" ("Finish" na última) traz a próxima, que entra com uma animação curta. A volta para a frente é instantânea, sem girar ao contrário.
- **Acessibilidade**: a face escondida fica `inert` (fora do Tab e do leitor de tela). Com `prefers-reduced-motion`, giro e animações são desligados; o conteúdo troca na hora.

### Fluxo do jogo (`ui.js`)

```
startMission ─▶ indicadores iniciais, Sol 1, baralho novo, mostra carta 1
     │
resposta ─▶ Indicators.apply(efeitos) + Mission.advance(tempo) ─▶ indicadores pulsam, sol/céu mudam ─▶ costas
     │
Next card ─▶ próxima carta ── depois da 45ª ─▶ Mission.endMission('complete') ─▶ "Mission complete!"
End mission ─▶ confirmação ─▶ Mission.endMission('quit') ─▶ "Mission ended"
"New mission" ─▶ startMission
```

`Indicators.apply(state, effects)` aplica vários efeitos de uma vez, cada um limitado entre 0 e a capacidade. `Mission.endMission(mission, reason)` guarda o motivo: `'quit'` ou `'complete'`.

### Posição da carta

A carta subiu: `.card-area` encosta a carta no topo (`place-items: start center`, margem de 6 px) e a faixa de detalhe ficou mais baixa (98 px). Em 375×667 a carta passou de 266×354 para 289×386.

### Ainda pendente nas cartas

- Recurso chegando a zero não encerra a missão.
- A dificuldade não muda as regras.
- Imagens e dados reais.

Conferido via `file://` (Edge headless): frente, arrasto com inclinação, giro para as costas, efeitos nos indicadores, e uma partida inteira de 45 cartas sem repetição seguida, terminando em "Mission complete!".

## Passo 9 — Tempo das cartas, contagem de sols e céu do dia

### Tempo de cada carta

Cada carta tem um campo `time`: quanto tempo responder a ela consome.

| `time` na carta | Na tela | Terços de sol (`thirds`) |
| --- | --- | --- |
| `'1/3'` | ⅓ sol | 1 |
| `'2/3'` | ⅔ sol | 2 |
| `'1'` | 1 sol | 3 |

- A tabela fica em `Deck.TIMES`; `validateCard` recusa outros valores.
- **O tempo é contado em terços inteiros**, não em frações decimais: ⅓ + ⅓ + ⅓ dá exatamente 1 sol, sem erro de arredondamento.
- A frente da carta mostra o tempo com um relógio (`⏱ ⅓ sol`). As costas mostram "Time" como primeira linha, antes dos efeitos.
- As 10 cartas de teste somam, em média, 0,6 sol por carta: **45 cartas ≈ 27 sols**, perto dos 30 sols propostos no `CLAUDE.md`. Um teste confere que o total fica entre 20 e 35 sols.

### Contagem de sols (`mission.js`)

A missão guarda o tempo total em terços (`elapsed`) e calcula o resto:

| Campo | Cálculo | Exemplo (`elapsed = 7`) |
| --- | --- | --- |
| `sol` | `1 + floor(elapsed / 3)` | Sol 3 |
| `period` | `['day', 'afternoon', 'night'][elapsed % 3]` | afternoon |

| Função | O que faz |
| --- | --- |
| `createMission()` | `{elapsed: 0, sol: 1, period: 'day', ended: false, reason: null}` |
| `advance(mission, thirds)` | Soma o tempo. Só aceita terços inteiros; depois do fim, não muda nada |
| `endMission(mission, reason)` | Encerra com o motivo `'quit'` ou `'complete'` |

Cada sol tem três partes: **dia → tarde → noite**, e depois começa o próximo sol de dia. Gastar ⅓ muda a parte do dia mas mantém o sol; ao completar 3 terços, o número do sol sobe. Uma carta de 1 sol mantém a parte do dia e passa para o sol seguinte (noite do Sol 1 → noite do Sol 2).

Ao responder, `ui.js` chama `Mission.advance(mission, Deck.TIMES[card.time].thirds)` e redesenha a barra da missão.

### Barra da missão

- **Ícone maior** (48 px, antes 30 px) e diferente por período: sol (dia), sol se pondo no horizonte (tarde), lua (noite).
- **"Sol N"** em 24 px e, embaixo, o período por escrito: *Daytime*, *Afternoon* ou *Night*. A explicação "A sol is a day on Mars" ficou no `title`.
- No fim do baralho, a mensagem conta o tempo vivido: "The crew lived 26⅔ sols on Mars."

### Céu no fundo (`html[data-period]`)

`ui.js` coloca o período em `<html data-period="…">` e o CSS troca o céu:

| Período | Fundo | Texto na barra |
| --- | --- | --- |
| `day` | Creme amarelado; gradiente diagonal (165°) com brilho de sol no canto superior direito | Marrom escuro |
| `afternoon` | Laranja; gradiente (200°) de laranja claro a vermelho-tijolo, com o sol se pondo no canto inferior esquerdo | Marrom escuro |
| `night` | Azul-violeta escuro (gradiente vertical) com algumas estrelas | Claro |

- **Três camadas fixas** (`.sky-day`, `.sky-afternoon`, `.sky-night`) atrás de tudo. Só a do período atual fica visível, e a troca é um *fade* de 1,2 s. Gradientes não podem ser animados diretamente, por isso as camadas.
- **Cores do que fica direto sobre o céu** (só a barra da missão) vêm de variáveis por período: `--page-text`, `--page-muted`, `--page-danger`, `--sky-icon`. Indicadores, faixa de detalhe, carta e diálogo são painéis escuros com cor própria (`color: var(--text)`), legíveis em qualquer céu.
- O `<meta name="theme-color">` também muda, para a barra do navegador no celular acompanhar o céu.
- Com `prefers-reduced-motion`, o céu troca sem *fade*.

Conferido via `file://` (Edge headless, 375×667): os três céus, a passagem Sol 3/noite → Sol 4/dia com uma carta de ⅓, as costas com "Time ⅓ sol" e uma partida inteira terminando no Sol 27.

## Passo 10 — Consumo diário e efeitos que duram

### Ideia

Agora o tempo gasta e produz recursos. A cada **terço de sol** que passa, a equipe respira e come, a reciclagem perde um pouco de água, os painéis carregam a bateria (só com Sol) e a base gasta energia. As respostas das cartas, além do efeito imediato, podem **mudar esse ritmo por alguns sols** ou **agendar algo para depois**.

### Fluxos de base (`flows.js` → `BASE_FLOWS`)

| Fluxo | Recurso | Por sol | Quando | Natureza |
| --- | --- | --- | --- | --- |
| Respiração (4 pessoas) | O₂ | −3,45 kg | sempre | **Referência**: 0,84 kg/pessoa/dia terrestre × 24,6597/24 (NASA NTRS 20160005782) |
| Máquina de oxigênio | O₂ | +3 kg | sempre | Simulado |
| Alimentação (4 pessoas) | comida | −2,55 kg | sempre | **Referência**: 0,62 kg/pessoa/dia terrestre × 24,6597/24 (mesmo estudo) |
| Perda na reciclagem | água | −4 L | sempre | Simulado |
| Painéis solares | energia | +100 kWh | só dia e tarde (+50 em cada) | Simulado |
| Consumo da base | energia | −60 kWh | sempre (−20 por terço) | Simulado |

Saldo por sol: O₂ −0,45 kg, água −4 L, energia +40 kWh, comida −2,55 kg, blindagem 0 (a radiação não gasta a blindagem). Os valores repetem os do protótipo anterior (`CLAUDE.md`, seção 5). A novidade é dividir a energia entre painéis e consumo: **a bateria sobe de dia e à tarde (+30 por terço) e cai à noite (−20)**.

### Efeitos de uma resposta

```js
right: {label: 'Plant them',
  effects: {water: -20, energy: -10},                                     // agora
  ongoing: [                                                               // todo sol
    {rates: {energy: -3}, for: 13, note: 'Grow lights'},                   //  já, por 13 sols
    {rates: {food: 1.5}, after: 3, for: 10, note: 'New plants'}            //  daqui a 3 sols, por 10
  ],
  later: [{after: 2, effects: {food: 6}, note: 'Bigger lettuce'}]         // uma vez, daqui a 2 sols
}
```

| Campo | Significado | Regras (`validateCard`) |
| --- | --- | --- |
| `effects` | Muda os estoques agora | Quantidades conhecidas |
| `ongoing[]` | Soma `rates` (por sol) aos fluxos. `after` = sols de espera (padrão 0); `for` = sols de duração (sem `for` = para sempre) | `rates` não vazio; sols inteiros; `for > 0` |
| `later[]` | Aplica `effects` uma vez, `after` sols depois da resposta | `after ≥ 1`; `effects` não vazio |

### Como o tempo passa (`Flows.passTime`)

Para cada terço `t` que passa:

1. soma a parte daquele terço de cada fluxo de base (painéis só nos terços de dia e tarde) e de cada `ongoing` ativo (`início ≤ t < fim`, dividido por 3);
2. aplica tudo com `Indicators.apply`, que mantém cada estoque entre 0 e a capacidade (bateria cheia não guarda mais);
3. dispara os `later` cujo momento chegou e os remove da lista.

Mudanças `ongoing` que terminaram saem da lista. A função devolve também `happened`: os eventos `later` que dispararam.

### Ordem ao responder (`ui.js`)

```
efeito imediato ─▶ registra ongoing/later ─▶ passa o tempo da carta (terço a terço) ─▶ avança o sol ─▶ costas
```

Os indicadores que **a resposta** mudou na hora pulsam. O consumo do tempo não faz pulsar, para não piscar tudo a cada carta.

### O que o jogador vê

- **Seta em cada indicador**: ▲ verde se está subindo por sol agora, ▼ vermelha se está caindo, nada se está estável. No Life Support, a seta é da parte mais baixa (O₂ ou água).
- **Detalhe do indicador**: ao lado do nome da unidade, quanto muda por sol agora (`▼ 0.45/sol`, `▲ 10/sol`).
- **Costas da carta**, uma linha por efeito:
  - **agora**: `Water −20 L`;
  - **todo sol**: `Energy −3 kWh/sol`, com "for 13 sols · Grow lights" embaixo;
  - **depois**: `Food +6 kg`, com "in 2 sols · Bigger lettuce" embaixo;
  - **acabou de acontecer**: algo agendado antes que disparou durante o tempo desta carta, com fundo destacado e "just happened · Bigger lettuce".
- **Cartas pequenas**: o cartão é um *container* (`container: card / inline-size`). Até 300 px de largura, as costas ficam mais compactas; até 240 px, as dicas têm uma linha só. Assim todas as linhas cabem sem rolar, mesmo em celulares de 320 px.

### Cartas de teste atualizadas

| Carta | Resposta | Efeito ao longo do tempo |
| --- | --- | --- |
| Poeira nos painéis | Wait for wind | Energia −30 kWh/sol por 3 sols |
| Máquina de O₂ | Repair later | O₂ −1,5 kg/sol por 4 sols (máquina fraca) |
| Máquina de O₂ | Repair now | −10 kWh agora; O₂ −3 kg/sol por 1 sol (máquina parada no conserto) |
| Alface | Let it grow | Energia −3 kWh/sol por 2 sols; +6 kg de comida em 2 sols |
| Filtro de água | Skip it | Água −6 L/sol por 3 sols |
| Bateria quente | Lights off | Energia +10 kWh/sol e comida −0,5 kg/sol por 2 sols |
| Equipe com sede | Save water | Água +2 L/sol por 3 sols |
| Sementes | Plant them | Agora −20 L e −10 kWh; energia −3 kWh/sol por 13 sols; comida +1,5 kg/sol a partir de 3 sols, por 10 sols |

O conserto da máquina de O₂ segue a orientação do `CLAUDE.md`: parar para manutenção consome o estoque durante a parada, em vez de dar um bônus instantâneo.

### Balanceamento observado (300 partidas com respostas aleatórias)

| Recurso | Menor valor na partida (mediana) | No fim (mediana) |
| --- | --- | --- |
| O₂ (de 60 kg) | 23,8 | 23,8 |
| Água (de 600 L) | 346 — **chega a 0 em algumas partidas** | 393 |
| Energia (de 240 kWh) | 240 | 288 |
| Comida (de 100 kg) | 70 | 74 |

A água pode acabar quando "Add water to walls" (−100 L) se repete. Recurso em zero **ainda não encerra a missão**.

Conferido via `file://` (Edge headless): setas e "por sol" no detalhe, costas com efeitos imediatos, por sol, depois e "just happened", em 375×667 e 320×568.

## Passo 11 — Cinco indicadores

Os indicadores passaram de quatro para cinco, **um por quantidade**. O antigo *Life Support* foi dividido em dois.

| Antes | Agora (`id` · nome na tela) | Ícone | Cor (`--id`) |
| --- | --- | --- | --- |
| Life Support (O₂ + água) | `oxygen` · **Oxygen Level** | pulmões | `#5fd4e6` |
| (parte do Life Support) | `water` · **Water Stock** | gota | `#6b9dff` |
| Shield Protection | `shield` · **Radiation Shield** | escudo | `#a99bff` |
| Energy | `energy` · **Energy Supply** | raio | `#ffd25e` |
| Food Stock | `food` · **Food Stock** | maçã | `#7ddc8a` |

- **`indicators.js`**: `INDICATORS` lista os cinco, cada um com uma parte só (`parts: ['oxygen']` etc.), e o `id` do indicador é igual ao da quantidade. A lógica de "parte mais baixa" e de várias partes continua no código, mas nenhum indicador a usa agora. O que vale para "Life Support" nos passos anteriores (detalhe em duas colunas, seta pela parte mais baixa) ficou como histórico.
- **Nomes curtos nas costas da carta**: as linhas de efeito continuam usando o nome da quantidade (*Oxygen*, *Water*, *Shield*, *Energy*, *Food*), que cabe melhor. O nome completo aparece no detalhe do indicador.
- **Cores**: como o `id` do indicador é igual ao da quantidade, cada efeito nas costas usa a cor do seu indicador. A água ganhou cor própria (azul).
- **Linha de cinco**: grade de 5 colunas (`repeat(5, minmax(0, 1fr))`), espaço de 7 px (12 px a partir de 600 px), largura máxima de 460 px e ícone ocupando 56% do quadrado. Cada indicador mede 62 px num celular de 375 px e 51 px num de 320 px.

Conferido via `file://` em 375×667, 320×568 e 760×800: cinco indicadores, sem rolagem, detalhe sem transbordar.

## Passo 12 — Fechar a explicação com um clique e faixa de efeitos ativos

### Clicar no indicador aberto fecha a explicação

| Entrada | Antes | Agora |
| --- | --- | --- |
| Mouse | Passar por cima abre; sair da linha fecha | Igual, e **clicar no indicador aberto fecha**. Ele fica "quieto" (não reabre ao mexer o mouse sobre ele) até o ponteiro ir para outro indicador ou sair da linha |
| Toque | Tocar abre; some 2 s depois de soltar | Igual, e **tocar de novo no indicador aberto fecha** na hora |
| Teclado | Focar abre | Igual, e **Enter/Espaço** no indicador aberto fecha (e reabre) |

Em `ui.js`: `close(id)` fecha e guarda `quiet = id`; `show(id)` ignora o indicador quieto. O clique é tratado no `pointerdown`, que é quando se sabe se a explicação já estava aberta. O `click` só trata o teclado (`event.detail === 0`).

### Faixa de efeitos ativos

Logo abaixo da área da explicação há uma faixa fixa (30 px) que lista os efeitos `ongoing` **em andamento agora**: dust, máquina fraca, luzes de cultivo, plantas dando comida etc. Efeitos que ainda vão começar (`after`) e eventos `later` não aparecem.

```
[ Dusty panels ●▼ 2⅔ sols ] [ New plants ●▲ 8⅔ sols ] [ Grow li…   ← fade: há mais
```

- **Um chip por efeito**: nome (`note`), um ponto na cor de cada recurso afetado com ▲ ou ▼, e quantos sols faltam (em terços: `2⅔ sols`; `always` se não tem fim).
- **Sem efeitos**: aparece só o texto "No active effects", sem moldura.
- **Muitos efeitos**: a faixa não cresce. Ela rola para o lado, com um *fade* na borda direita indicando que há mais.
- **Detalhes**: `title` (ao passar o mouse) e `aria-label` (leitor de tela) dizem os valores por extenso, por exemplo "Dusty panels: Energy minus 30 kWh per sol, 2⅔ sols left".
- **Lógica**: `Flows.active(flows, now)` devolve os efeitos com `início ≤ now < fim` e `thirdsLeft` (terços restantes). O teste confere que poeira some ao acabar e que as plantas aparecem só quando começam.
- **Espaço**: a carta encolhe sozinha para dar lugar à faixa. A altura mínima da área da carta caiu de 300 para 260 px, para não rolar em celulares de 320×568.

Conferido via `file://`: fechar com clique (mouse e toque), faixa vazia, com um efeito e com vários (com *fade*), em 375×667 e 320×568 sem rolagem.

## Passo 13 — Caixa de efeitos ativos e "segurar para ver"

Substitui a interação e a faixa de efeitos do Passo 12.

### Caixa de efeitos ativos (sob os indicadores)

```
┌ .readout (altura --readout-h: 102 px; 108 px a partir de 600 px) ┐
│ .effects-box  "Active effects"                         +2 more    │  ← sempre visível
│   Weaker machine                       ● ▼   3⅓ sols left         │
│   Dusty panels                         ● ▼   2 sols left          │  máx. 3 linhas
│   Dirty filter                         ● ▼   1⅔ sols left         │
└───────────────────────────────────────────────────────────────────┘
  #detail: mesmo tamanho e lugar; cobre a caixa enquanto um indicador é segurado
```

- A caixa ocupa **o mesmo retângulo** que o detalhe do indicador (as duas ficam em posição absoluta dentro de `.readout`). O detalhe tem `z-index: 1` e fundo opaco, então **cobre** a caixa. Não há mais faixa extra, e a carta ganhou de volta esse espaço.
- **No máximo 3 efeitos**, os mais recentes primeiro. Se houver mais, o título mostra "+N more".
- Cada linha mostra o nome, um ponto na cor do recurso com ▲/▼ e quantos sols faltam.
- Sem efeitos, a caixa mostra "No active effects".
- `title` e `aria-label` de cada linha trazem os valores por extenso.

### Segurar para ver o detalhe

| Entrada | Comportamento |
| --- | --- |
| Mouse | **Apertar e segurar** num indicador mostra o detalhe; arrastar ainda apertado troca de indicador; **soltar** fecha. Só passar o mouse não abre mais |
| Toque | Igual: encostar e segurar mostra, deslizar troca, levantar o dedo fecha |
| Teclado | Focar com Tab mostra; sair da linha ou Esc fecha |

- **Abrir** é rápido (0,12 s); **fechar** é um *fade* suave de 0,35 s, com um leve recuo para cima. O conteúdo do detalhe é mantido enquanto ele some, para não desaparecer de uma vez. Com `prefers-reduced-motion`, sem animação.
- Implementação (`ui.js`): `pointerdown` guarda o ponteiro (`pressing`) e o captura na linha (`setPointerCapture`), de modo que soltar fora da linha também fecha. `pointermove` só troca de indicador enquanto pressionado. `pointerup` e `pointercancel` fecham.
- O clique do mouse também foca o botão; o `focusin` só abre o detalhe quando o foco é de teclado (`:focus-visible`).
- **Toque longo** não abre menu: `contextmenu` é cancelado na linha e `-webkit-touch-callout: none` evita o balão do iPhone.
- Foram removidos o "fechar com clique", o estado "quieto" e o atraso de 2 s do toque.

Conferido via `file://`: passar o mouse não abre; apertar abre; arrastar troca; soltar fecha (mouse e toque); caixa com 0, 3 e mais de 3 efeitos; detalhe do mesmo tamanho da caixa; sem rolagem em 375×667 e 320×568.

## Passo 14 — Caixa de efeitos que cresce e mais espaço até a carta

- **A caixa cresce com os efeitos**: `.effects-box` deixou de ocupar a região inteira (`inset: 0 0 auto 0`, altura automática). Medidas em 375×667:

  | Efeitos | Altura da caixa | Espaço até a carta |
  | --- | --- | --- |
  | 0 ("No active effects") ou 1 | 60 px | 62 px |
  | 2 | 81 px | 41 px |
  | 3 (máximo, + "+N more") | 102 px | 20 px |

- **A carta não pula**: `.readout` continua uma região fixa do tamanho da caixa com 3 efeitos (`--readout-h`). A caixa cresce dentro dela, e o detalhe do indicador cobre a região toda. Assim a carta não muda de lugar nem de tamanho quando efeitos começam ou acabam (284×379 em todos os casos medidos), e o detalhe nunca encosta nela.
- **Mais espaço até a carta**: a margem de `.card-area` passou de 6 para 20 px. Esse é o espaço mínimo, com a caixa cheia.
- **Linha nova aparece com fade** (0,3 s). Para não repetir a animação a cada redesenho (por exemplo, ao segurar um indicador), `renderActive` só refaz a lista quando os efeitos mudam (compara um `JSON.stringify` da lista).

Conferido via `file://` com 0, 1, 2 e 3 efeitos e com o detalhe aberto; sem rolagem em 375×667.

## Como validar

```bash
node --check indicators.js
node --check mission.js
node --check flows.js
node --check cards.js
node --check deck.js
node --check card-ui.js
node --check ui.js
node tests/indicators.test.js
node tests/mission.test.js
node tests/flows.test.js
node tests/deck.test.js
```

Depois, abra `index.html` com duplo clique e confira os contêineres, o hover e o toque (no celular ou no modo de dispositivo do navegador).

## Ainda não existe

Derrota por falta de recurso, regras de dificuldade e cartas reais. Cada um entra aqui quando for construído.

## Passo 15 — Missão de 60 sols e eventos por sol

`Mission.eventsForSol(random)` sorteia 0/1/2 eventos. `ui.js` monta um cronograma de 60 posições no início e pede ao `Deck` o número exato de cartas. `eventIndex` conta os eventos do sol atual; `index` conta cartas da missão. A última resposta de um sol mostra **End sol**; com dois eventos, a primeira mostra **Next event**.

`CardUI.showQuiet(sol)` reutiliza o arrastar e os controles de teclado da carta para o aviso **No events today**. Um cancelamento de ponteiro nunca confirma o avanço. O fim de qualquer sol chama `Flows.passTime(..., 3)` uma única vez, seguido de `Mission.advance`. Após o sol 60 a missão termina com `reason: 'complete'`, sem mostrar Sol 61. Efeitos atrasados que chegam aparecem na transição.

O overlay `#sol-transition` bloqueia entradas durante uma órbita CSS de 1 segundo; notificações de efeitos agendados estendem a pausa para 1,8 s. Com movimento reduzido não há órbita nem espera, exceto 1,2 s para essas notificações. A barra mostra **Sol N / 60**, com fundo fixo. Os campos `time`, `Deck.TIMES`, os períodos da missão e o tema por período foram removidos. A geração de energia mantém o orçamento simulado de 100 kWh/sol, distribuído uniformemente nos passos internos (consumo-base de 60 kWh/sol).

As seções Passos 1–14 são histórico de implementação; as regras deste passo prevalecem.

## Passo 16 — Virada de sol apenas no background

A transição orbital em primeiro plano foi substituída por uma camada decorativa fixa atrás do jogo (`#sol-transition`, `aria-hidden`, sem interceptar ponteiros). Um gradiente quente atravessa o fundo e desaparece em 1 segundo, sugerindo a virada do dia; cartas e indicadores ficam visíveis durante toda a animação. Não existem mais Sol/Marte desenhados na transição nem mensagem central. Avisos de efeitos agendados aparecem em `#sol-notice`, abaixo do contador da missão, com anúncio acessível. A contagem e o consumo de recursos permanecem iguais ao Passo 15. Movimento reduzido desativa a animação do fundo.

## Passo 17 — Transição de fundo mais suave

A virada de sol passou a durar 1,6 s, com cores menos saturadas, pico de opacidade de 0,35 e deslocamento horizontal de apenas ±8% (antes ±25%). A curva de aceleração e desaceleração é suave e simétrica. O tempo de transição em `ui.js` acompanha a animação; notificações continuam com 1,8 s e movimento reduzido permanece respeitado.

## Passo 18 — Avanço imediato e fundo discreto

A passagem de sol atualiza o contador e mostra a próxima carta imediatamente. A animação do fundo é apenas decorativa, dura 450 ms, chega a 0,12 de opacidade e não desloca o cenário. Não existem mais bloqueio de entrada nem timer de espera; `animationend` esconde a camada. Avançar rapidamente reinicia a animação. Avisos de efeitos agendados permanecem abaixo do contador, sem atrasar o jogo. Com movimento reduzido, a camada não aparece.

## Passo 19 — 40 sols, sempre com eventos

A duração confirmada é de **40 sols**. `Mission.eventsForSol` retorna 1 com probabilidade de 80% e 2 com probabilidade de 20%; nunca retorna zero. `showSol` sempre mostra uma carta de evento. O cronograma dimensiona um baralho de 40 a 80 cartas, com repetições em rodadas embaralhadas; a mesma carta não aparece duas vezes seguidas. A missão só termina após concluir o sol 40. Contador e mensagem final acompanham a nova duração. O avanço continua imediato e o efeito de fundo permanece discreto e sem bloqueio.

## Passo 20 — Luz da direita para a esquerda

O gradiente da virada de sol agora atravessa o background da direita para a esquerda (`translateX(60%)` até `translateX(-60%)`). Mantém 450 ms, opacidade máxima de 0,12 e avanço imediato do jogo. Apenas a camada de luz se move; cartas e indicadores ficam no lugar. Movimento reduzido continua desativando o efeito.

## Passo 21 — Briefing antes da missão

`index.html` começa com `#mission-intro`: imagem local `images/conceptual_outpost.jpeg`, texto curto em inglês, botão **Start mission**, dica de arrastar e link para o documento NASA *Moon to Mars Architecture Definition Document*, revisão C (dezembro de 2025). O texto adapta os temas de habitação, saúde da equipe e resposta a emergências em Marte (casos UC-H-103 M, UC-H-107 M e UC-H-108 M, página impressa 129); quatro astronautas, duração de 40 sols e cartas são regras do jogo, não requisitos da NASA.

`#game` fica oculto e a missão não é inicializada até o jogador clicar ou arrastar horizontalmente o briefing em qualquer direção. O gesto exige 22% da largura (máximo 80 px), distingue rolagem vertical e cancela sem iniciar em `pointercancel`. Setas do teclado também iniciam; o botão funciona com Enter/espaço. Ao iniciar, o foco vai à primeira resposta. Novas missões após o fim reiniciam diretamente o jogo. O briefing usa CSS responsivo e não depende de rede, inclusive para a imagem; apenas o link de referência abre um documento externo.

A imagem do briefing usa `<figure>` e legenda abaixo, sem link: **Image credit: NASA — First Humans on Mars (artist’s concept).** Origem conferida no NASA Science Photojournal, imagem PIA23302: https://science.nasa.gov/photojournal/first-humans-on-mars-artists-concept/.

Por solicitação do usuário, a frase e o link “Inspired by NASA’s Moon to Mars architecture” foram removidos da tela inicial; o crédito da imagem permanece. O documento continua como referência do texto na documentação interna.

## Passo 22 — Layout ampliado para tablets

Em telas com pelo menos 768 × 700 px, a coluna do jogo ocupa 88% da largura até 800 px, e a barra/indicadores vão até 640 px. A altura acompanha a tela até 1.400 px; acima disso, o conjunto fica centralizado verticalmente. Indicadores, textos, detalhes e botões aumentam, e a carta fica centralizada no espaço restante. Uma container query amplia a tipografia e os controles de cartas com pelo menos 400 px de largura, incluindo o verso. O layout de celular mantém suas regras.

Validado no Chromium via `file://` em 1032×1376, 1024×1366, 1366×1024, 768×1024, 375×667 e 320×568: sem transbordamento horizontal/vertical, frente e verso dentro da carta e sem erros JavaScript. Em 1032×1376, a carta mede aproximadamente 670×893 px, texto de 25 px e botões de pelo menos 60 px.

## Passo 23 — Apresentação ampliada para tablets

O briefing usa até 800 px de largura nos tablets, imagem de até 420 px de altura, título de 44 px, texto de 22 px e botão de 66 px, centralizado na tela. Em tablets com altura de 700–899 px, reduz a imagem e os espaçamentos para caber em paisagem. Celulares baixos usam apresentação compacta, preservando o texto e botão de pelo menos 48 px.

Conferido no Chromium via `file://` em 1032×1376, 1366×1024, 768×1024, 1024×768, 768×700, 375×667 e 320×568: imagem carregada, conteúdo sem transbordamento e botão iniciando a missão.

## Motor com JSONs

Dados de missão, recursos, fluxos e cartas migrados para data/. Bootstrap carrega os dados por HTTP e inicializa módulos em src/. Salvamento versionado usa localStorage e preserva os dados da partida. CSS movido para assets/. README descreve execução e GitHub Pages. A implementação foi complementada pela migração dos textos e pela validação descrita abaixo.


## Configuração, ações e persistência

A fonte editável é `data/`: missão, recursos/indicadores, fluxos, cartas e interface. `src/bootstrap.js` carrega e valida os dados por HTTP, preenche o briefing e inicializa os módulos. Não existe build obrigatório. Os desenhos dos ícones, layout, animações e gestos continuam no código; identificadores e cores dos indicadores vêm dos dados. Consumos de referência usam coeficiente por tripulante/dia terrestre, convertido a partir da tripulação e duração do sol configuradas.

`src/engine.js` centraliza ações puras (`start`, `answer`, `next`, `end`) sobre snapshots. A resposta é aplicada uma vez e `next` só avança depois de uma resposta. O consumo ocorre após o último evento do sol. A UI renderiza o snapshot e salva após cada ação; cenas transitórias não são persistidas.

O slot `next-frontier-save` contém versão, dados completos usados pela partida, recursos, relógio, cronograma, ordem das cartas, posição, resposta e fluxos pendentes. Valores infinitos de duração usam um marcador no JSON. Ao continuar, os dados do save prevalecem para essa partida; começar novamente recarrega os dados atuais. Saves incompatíveis são preservados até confirmação de substituição. Outra aba que salva suspende a interface antiga.

Validação: `npm test` cobre indicadores, missão, fluxos, baralho, JSONs e ações/saves. Teste real no Chromium por HTTP confirmou início, escolha, recarga, retorno pelo verso sem reaplicar efeitos e conclusão da missão no sol 40, sem erros JavaScript. O workflow GitHub Pages executa testes e publica somente arquivos de execução, sem documentos internos ou ferramentas. Publicação remota ainda não realizada.


## Passo 24 — Vista da janela da base

O background usa uma ilustração SVG local simples de Marte (`assets/images/mars-window.svg`), com céu, sol, montanhas em camadas e pedras. `.base-window` fica atrás do jogo, com moldura de habitat e reflexo discreto no vidro; é decorativa, `aria-hidden` e sem interação. A moldura reduz em celulares. As cartas e indicadores mantêm seu layout e fundos opacos; a luz de passagem de sol continua por cima da paisagem, sem bloquear o jogo. A publicação já inclui todo o diretório assets.

## Passo 25 — Área interna e tela sem rolagem

A página usa `100dvh`, overflow oculto em html/body e overscroll desativado. O padding interno é independente da moldura e respeita safe areas. A carta usa somente o espaço restante, sem a antiga altura mínima que forçava rolagem. Tablets mantêm a escala ampliada com margens internas maiores.

Celulares em paisagem baixa usam console à esquerda e carta à direita. O briefing passa a duas colunas nesses formatos e compacta a tipografia em alturas menores. Quando há save, os botões de continuar/nova missão ficam lado a lado; a imagem reduz nos celulares para reservar espaço ao texto. O verso de cartas estreitas tem espaçamentos compactos. A lista interna de efeitos conserva overflow de segurança para conteúdo futuro extenso; a página inteira não rola.

Conferido no Chromium com cache desativado em 320×568, 375×667, 390×844, 768×1024, 1032×1376, 1366×1024, 844×390, 667×375 e 568×320: apresentação, retomada e faces das cartas dentro de suas regiões; contador e botões acessíveis sem rolagem da tela. `npm test` passou.


## Experimento — tablet do astronauta para efeitos ativos

Branch `experiment/astronaut-effects-tablet`, criada a partir de dev com as alterações locais existentes preservadas. Remove a seção fixa de efeitos acima da carta. A faixa de detalhe dos indicadores deixa de ocupar altura; o detalhe aparece como tooltip abaixo da linha, por hover de mouse no PC ou segurar/deslizar no toque, mantendo acesso por foco de teclado.

O botão **Crew tablet** abaixo da carta mostra o total de efeitos e abre um dialog nativo, com animação de entrada de baixo, tablet e luvas/mangas de astronauta em SVG local. O painel apresenta até três efeitos por página, sem limitar o total: nome, duração restante, recurso e variação física por sol. Páginas permitem consultar todos os efeitos sem rolar a tela; estado vazio exibe **All clear**. Fechar, Escape e clique fora encerram o painel e devolvem foco ao botão. O dialog impede respostas às cartas enquanto está aberto. Movimento reduzido desativa a entrada animada.

Textos do tablet ficam no JSON de interface; `Copy` usa o conteúdo atual como fallback para chaves novas ausentes em saves antigos. O desenho e o layout permanecem no CSS/SVG. Em paisagem baixa o botão ocupa a coluna dos controles; o tablet usa três colunas para os efeitos. Conferido no Chromium com sete efeitos em 1032×1376, 375×667, 320×568 e 844×390: hover, ausência da seção antiga, botão dentro da tela, abertura, três páginas e último efeito acessível, sem erros JavaScript. `npm test` passou.

O desenho das luvas foi refinado para uma visão em primeira pessoa: antebraços entram pelos cantos inferiores, quatro dedos arredondados fecham ao redor de cada lateral, e os polegares prendem a borda interna do tablet. Contornos grossos, cores suaves, punhos sanfonados e faixas laranja reforçam o estilo cartunesco. O SVG é simétrico e limita as mãos às bordas para preservar a leitura da tela.

## Revisão do tablet — relatório de missão

As mãos e o SVG do astronauta foram removidos. O tablet sobe ao abrir e desce ao recolher; botão, Escape e clique fora usam o mesmo fluxo de fechamento animado, com fallback de timer e retorno de foco. Movimento reduzido fecha imediatamente. O botão **Outpost report** ganhou visual de controle da base, contador e estado `aria-expanded`.

O relatório mostra **Mars Outpost Status**, uma saudação ao capitão e os efeitos com frases curtas sobre os recursos aumentando/diminuindo, além do tempo restante. Sem efeitos, mostra **All clear, Captain! No active effects right now.** Mantém paginação para não exigir rolagem. Textos atuais da interface têm prioridade sobre os textos de saves antigos; os dados e regras da partida salva continuam preservados.

Validado no Chromium em 1032×1376, 375×667, 320×568 e 844×390: sete efeitos em três páginas, hover, botão e tablet dentro da tela, fechamento com animação e sem erros JavaScript. `npm test` e `git diff --check` passaram.


## Sorteio por categorias

`data/categories.json` define Routine (35%), Maintenance (25%), Exploration (20%), Science (15%) e Emergency (5%). Cada carta em `data/cards.json` tem `category` e `probability` condicional à categoria. As chances iniciais das cartas são iguais dentro de cada grupo. Os números são frações 0–1, com soma 1 para categorias e separadamente para as cartas de cada categoria.

`Deck.createDeck` agora faz duas seleções ponderadas independentes por evento, com reposição. Repetições consecutivas são permitidas, incluindo dentro do mesmo sol; não há rodadas balanceadas. A política antiga avoidConsecutive foi removida da configuração atual. Validação cobre IDs duplicados, referências desconhecidas, probabilidades inválidas, somas e categorias sem cartas. Uma categoria com uma única carta funciona normalmente. A interface preserva a distribuição de 1/2 eventos e a duração de 40 sols.

O bootstrap inclui categories no carregamento. Saves antigos sem categorias são aceitos somente pelo caminho de compatibilidade de saves, preservando cartas e ordem originais; dados atuais precisam das categorias. Novos saves incluem a configuração e o baralho já sorteado. Testes incluem limites de sorteio, zero, uma carta por categoria, repetição consecutiva, distribuição em 100 mil sorteios e restauração de snapshots antigos/novos.

Conferência no Chromium por HTTP com cache desativado confirmou carregamento das cinco categorias, sequência com repetições consecutivas sob sorteio controlado, save e retomada sem reaplicar a escolha, e conclusão no sol 40 sem erros JavaScript.


## Recursos explicados e virada de sol

Cada recurso possui `description` em resources.json, com uma frase simples em inglês sobre sua função na base. O detalhe mostra a reserva e uma previsão escrita: **If nothing else changes: After 1 sol, you will have 4 L less.** A diferença vem da projeção pura `Flows.passTime` de um sol, incluindo limites, fluxos e entregas agendadas; não aplica essa projeção à partida. Saves anteriores recebem a descrição atual como fallback. Setas de tendência dos ícones foram removidas, assim como dificuldade e contador de eventos da frente da carta; as propriedades de dados continuam disponíveis para validação.

Após o último evento, o motor calcula e salva o novo snapshot; a interface anima os níveis por 320 ms com borda verde para aumento e vermelha para queda, mantendo o contador do sol anterior nessa breve etapa. Depois atualiza o contador/carta e anima a luz do background da direita para a esquerda por 600 ms. A carta fica inert e botões ficam desativados somente durante os 320 ms, evitando dupla aplicação; o novo estado já está salvo se houver recarga nesse intervalo. Movimento reduzido pula a espera e as animações.

Verificado no Chromium em 320×568, 375×667, 1032×1376 e 844×390: descrições, previsão de água, ausência de setas/rótulos, borda vermelha antes de atualizar o sol e animação posterior do background. Sem erros JavaScript. Testes do motor e dados passaram.

A frase “If nothing else changes” foi removida do detalhe dos recursos por solicitação do usuário; a previsão continua mostrando diretamente a variação após 1 sol.

## Contornos persistentes e ícones no verso

Mudanças imediatas de estoque ao responder uma carta mantêm os contornos verde/vermelho até avançar para o evento seguinte. Apenas o pulso termina automaticamente. Ao avançar, os destaques da carta são limpos; a animação breve de consumo do sol mantém seu comportamento. `cardChanges` no save registra as diferenças reais de estoque e restaura os contornos quando a partida retorna ao verso, sem reaplicar efeitos. Saves anteriores sem esse campo continuam válidos.

Os desenhos dos indicadores foram extraídos para `src/icons.js` e são compartilhados com as linhas do verso: ícone do recurso, nome por escrito e quantidade. Ícones são decorativos para leitores de tela, pois o nome já identifica o recurso. Bolinhas foram removidas das linhas, e o layout compacto usa ícones menores em cartas estreitas. Conferido no Chromium: destaque ainda visível após 1 segundo, ícones com nomes, restauração após recarga e limpeza ao avançar, sem erros. `npm test` passou.


## Descrição opcional de cada escolha

`left.description` e `right.description` em cards.json são textos opcionais independentes. Todas as escolhas atuais possuem string vazia. `CardUI.showBack` exibe somente a descrição da escolha feita, abaixo do título e acima da lista de efeitos. Texto ausente, vazio ou só espaços oculta o elemento sem reservar espaço; cada troca limpa o conteúdo anterior. Renderização usa textContent. Validação aceita campo ausente para compatibilidade com saves anteriores e rejeita tipos diferentes de string quando presente. CSS ajusta a tipografia à largura da carta.


## Legendas das imagens e tablet temporariamente oculto

O botão do tablet foi ocultado com hidden, saindo do layout e do teclado; o recurso permanece implementado para uso futuro. A frente da carta agrupa imagem e legenda em figure/figcaption. `imageCaption` vem de cards.json e descreve a imagem real; as dez cartas atuais compartilham a legenda do desenho de teste. Saves antigos podem usar a legenda atual quando ID e imagem coincidem. Legendas ausentes/vazias não ocupam espaço. O grupo da imagem encolhe com a altura disponível, mantendo legenda, descrição e respostas visíveis.

## Variações acima dos indicadores

Cada indicador agora vive em `.indicator-slot`, com uma faixa superior permanente de 38 px (46 px em tablets) reservada para o número de variação. Mudanças reais mostram sinal e quantidade, com unidade em segunda linha para caber em celulares estreitos. A informação usa verde para aumento e vermelho para queda e é anunciada com role=status. Estoques limitados pela capacidade mostram somente a diferença realmente aplicada.

O pulso e os números permanecem por 1,4 s; a altura do preenchimento interpola por 1,1 s, ficando verde/vermelha durante a animação e voltando à cor original depois. O contorno de uma mudança de carta continua até avançar, como antes. Avançar limpa timers/números antigos antes de iniciar outra mudança. A passagem de sol espera 1,4 s para a leitura da mudança diária antes de atualizar contador e animar o fundo. Movimento reduzido evita deslocamento e espera de sol, mantendo a leitura estática da variação.

Conferido no Chromium em 320×568, 375×667, 1032×1376 e 844×390: valor e unidade acima do recurso, preenchimento vermelho durante queda, número visível durante a leitura, limpeza posterior sem perder contorno e carta dentro da área disponível. Sem erros JavaScript; `npm test` passou.
