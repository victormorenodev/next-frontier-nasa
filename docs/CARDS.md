# Cartas de evento — catálogo e conversão

Fonte: [CSV original](<../Cartas de evento - Página1.csv>). O arquivo foi preservado. Este documento registra escolhas editoriais e a conversão autorizada, não parâmetros científicos de uma base real.

## Regras de importação

- IDs 1–13 e dificuldades vêm da planilha; resposta 1 → left, resposta 2 → right.
- Valores `15/-15` ou `15\-15` representam pontos percentuais da capacidade: valor de simulação = percentual × max / 100. Não são percentuais do estoque restante.
- Capacidades atuais: O₂ 200 kg, Water 1900 L, Shield 100 pontos (100%), Energy 1480 kWh e Food 235 kg secos.
- Campos vazios ou somente separador viram zero. As cartas 3–8 ficam sem efeitos quantificados; nenhuma taxa ou consequência agendada foi inventada.
- Probabilidades das cinco categorias mantidas. A classificação por tema é editorial; dentro da categoria, chances iguais.
- Textos de frente e botões foram resumidos para crianças; `sourceDescription` guarda os enunciados originais e o verso guarda as respostas completas (com ajuste da menção a 15 kWh na carta 10 para a bateria atual). `sourceResponse` preserva o texto original de cada resposta, ou vazio quando ela foi completada.

## Respostas completadas por autorização

- 7 / segunda: “Choose soybeans for a larger harvest later.” (Plant soybeans).
- 8 / primeira: “Pause battery charging and let the power lines cool.” (Pause charging).
- 8 / segunda: “Keep charging the battery while watching the hot power lines.” (Keep charging).
- A carta 7 não produz colheita automaticamente: o CSV não define quantidade nem prazo.

## Efeitos imediatos nas unidades de simulação

| ID | Dificuldade | Categoria | Primeira resposta | Segunda resposta |
| --- | --- | --- | --- | --- |
| 1 | easy | emergency | O₂ +30 kg; Shield -5% | O₂ -30 kg; Shield +5% |
| 2 | medium | emergency | O₂ +20 kg; Energy -148 kWh | O₂ -40 kg; Shield +10% |
| 3 | hard | maintenance | 0 | 0 |
| 4 | easy | routine | 0 | 0 |
| 5 | medium | maintenance | 0 | 0 |
| 6 | hard | maintenance | 0 | 0 |
| 7 | medium | science | 0 | 0 |
| 8 | hard | maintenance | 0 | 0 |
| 9 | hard | exploration | O₂ -30 kg; Energy +222 kWh | O₂ +20 kg; Energy -222 kWh |
| 10 | medium | maintenance | O₂ -20 kg; Energy +222 kWh | O₂ +30 kg; Energy -296 kWh |
| 11 | medium | emergency | 0 | 0 |
| 12 | hard | maintenance | Energy -222 kWh; Water -285 L | Energy +222 kWh; Water +380 L |
| 13 | medium | maintenance | Food -35.25 kg; Water +380 L | Energy -296 kWh; Water -475 L |

Os limites 0–capacidade continuam aplicados pelo motor. Um ganho pode ser parcialmente limitado quando o estoque já está cheio. Easy converte somente a apresentação e mantém Life Support como mínimo proporcional de água/oxigênio.

## Referências e imagens

Cada imagem usa exatamente o ID da carta, incluindo 6.png e 12.png. Legendas descrevem a imagem efetivamente fornecida: a 8 mostra coletores solares na Terra e a 12 é uma ilustração de base espacial. Não são fotos de uma base humana em Marte.

As cartas 1–6 têm a referência ESA preenchida no CSV. Para 7–13, sem referência científica preenchida, o campo Source fica ausente no verso. Esses links não validam os números de balanceamento. SFX anotados no CSV não foram implementados porque não há áudio fornecido nem implementação solicitada.

## Reprodução

```bash
python scripts/import_event_cards.py
python scripts/import_event_cards.py --check
npm test
```

O jogo usa data/cards.json; a conversão não faz parte da inicialização do navegador. Saves antigos não são sobrescritos: somente novas missões passam a sortear estas cartas.

Shield usa diretamente pontos percentuais nos dois modos: −5 no CSV vira −5 pontos do índice 0–100, e não −0,5 g/cm². O valor inicial é 75% no Easy e 50% no Hard; essa escala não mede dose nem quantidade física de blindagem.

## Fontes das cartas e das imagens

O verso mostra Source somente quando a carta possui uma referência preenchida; não mostra Image source nem reserva espaço quando source está ausente. O importador usa somente a coluna Referência para source. A origem da imagem permanece separada em imageSource e aparece ao final da legenda: “Image source:” seguida de um link com o domínio. Sem origem informada, o rótulo permanece e o valor fica vazio. O link abre em outra aba e não inicia arrasto da carta. Saves antigos com source de tipo image têm a origem na legenda, sem essa linha no verso.
