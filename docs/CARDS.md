# Cartas de evento — catálogo e conversão

Fonte: [CSV original](<../Cartas de evento - Página1.csv>). O arquivo foi preservado. Este documento registra escolhas editoriais e a conversão autorizada, não parâmetros científicos de uma base real.

## Regras de importação

- IDs 1–13 e dificuldades vêm da planilha; resposta 1 → left, resposta 2 → right.
- Valores `15/-15` ou `15\-15` representam pontos percentuais da capacidade: valor de simulação = percentual × max / 100. Não são percentuais do estoque restante.
- Capacidades preservadas: O₂ 60 kg, Water 700 L, Shield 100%, Energy 300 kWh e Food 100 kg secos.
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
| 1 | easy | emergency | O₂ +9 kg; Shield -5% | O₂ -9 kg; Shield +5% |
| 2 | medium | emergency | O₂ +6 kg; Energy -30 kWh | O₂ -12 kg; Shield +10% |
| 3 | hard | maintenance | 0 | 0 |
| 4 | easy | routine | 0 | 0 |
| 5 | medium | maintenance | 0 | 0 |
| 6 | hard | maintenance | 0 | 0 |
| 7 | medium | science | 0 | 0 |
| 8 | hard | maintenance | 0 | 0 |
| 9 | hard | exploration | O₂ -9 kg; Energy +45 kWh | O₂ +6 kg; Energy -45 kWh |
| 10 | medium | maintenance | O₂ -6 kg; Energy +45 kWh | O₂ +9 kg; Energy -60 kWh |
| 11 | medium | emergency | 0 | 0 |
| 12 | hard | maintenance | Energy -45 kWh; Water -105 L | Energy +45 kWh; Water +140 L |
| 13 | medium | maintenance | Food -15 kg; Water +140 L | Energy -60 kWh; Water -175 L |

Os limites 0–capacidade continuam aplicados pelo motor. Um ganho pode ser parcialmente limitado quando o estoque já está cheio. Easy converte somente a apresentação e mantém Life Support como mínimo proporcional de água/oxigênio.

## Referências e imagens

Cada imagem usa exatamente o ID da carta, incluindo 6.png e 12.png. Legendas descrevem a imagem efetivamente fornecida: a 8 mostra coletores solares na Terra e a 12 é uma ilustração de base espacial. Não são fotos de uma base humana em Marte.

As cartas 1–6 têm a referência ESA preenchida no CSV. Para 7–13, sem referência científica preenchida, a origem da imagem é identificada como Image source no verso. Esses links não validam os números de balanceamento. SFX anotados no CSV não foram implementados porque não há áudio fornecido nem implementação solicitada.

## Reprodução

```bash
python scripts/import_event_cards.py
python scripts/import_event_cards.py --check
npm test
```

O jogo usa data/cards.json; a conversão não faz parte da inicialização do navegador. Saves antigos não são sobrescritos: somente novas missões passam a sortear estas cartas.

Shield usa diretamente pontos percentuais nos dois modos: −5 no CSV vira −5 pontos do índice 0–100, e não −0,5 g/cm². O valor inicial é 80%; essa escala não mede dose nem quantidade física de blindagem.
