# Cartas de evento — Página2

Fonte atual: [Cartas de evento - Página2.csv](<../Cartas de evento - Página2.csv>). O CSV é preservado; linhas sem ID são ignoradas. O catálogo substitui integralmente as cartas anteriores em novas missões.

São 17 IDs: 5, 9, 11, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 26, 27 e 29. Categoria e dificuldade vêm da planilha. Cartas têm pesos iguais dentro da categoria; Easy permite 15 cartas (exclui 9 e 26), Hard permite todas. As cinco categorias têm cartas elegíveis em ambos os modos.

## Efeitos e textos

Cada célula usa `primeira resposta // segunda resposta`, com unidades explícitas: kg para oxigênio/comida seca, L para água, kWh para energia e p para pontos de Shield. **Não são porcentagens da capacidade.** O importador valida as unidades, aceita vírgula decimal e espaços entre sinal e número, e ignora os pontos soltos antes do separador nas células de água 15/16. Valores não são arredondados nem escalados pela capacidade.

A primeira resposta vira left, a segunda right. A frente e os botões têm resumos em inglês simples; sourceDescription/sourceResponse preservam os originais. Respostas completas aparecem no verso. Sources alimenta Source no verso; o campo Source Verified? é preservado em sourceVerified e não transforma as referências em validação científica dos efeitos.

A coluna Side effects da carta 9 menciona redução de geração por oito sols. Como o painel/tipo de cartas contínuas foi retirado e a geração automática deixou de existir, a anotação fica em sourceSideEffects, **sem executar efeitos contínuos**. Extra informations permanece em sourceNotes. Somente as alterações imediatas das cinco colunas de recursos são aplicadas.

## Imagens pelo ID

`imageById: true` faz `src/card-images.js` procurar, em ordem, `images/cards/ID.jpg`, `.png` e `.jpeg` a cada apresentação. O campo image continua com o caminho convencional JPG, sem assumir que existe. Não há listagem de diretório nem build. Arquivos antigos não são sorteados só por estarem nessa pasta.

Sem arquivo válido, usar `images/cards/placeholder.svg`, alt e legenda “Image not available yet.”. O carregador tenta novamente a cada 15 segundos enquanto a frente continua aberta; um arquivo adicionado passa a aparecer automaticamente. URLs de tentativa mudam para evitar cache negativo. Ao mudar de carta/face, cancelar atualizações pendentes para não trocar a imagem da próxima carta. Os três formatos são decodificados pelo navegador; um arquivo quebrado não impede testar o seguinte.

A legenda termina sempre com Image source: e o link da coluna Imagem da carta, com o domínio como rótulo. Sem link, manter o rótulo e o valor vazio. Ao carregar uma imagem, usar sua descrição; durante o placeholder, não descrever uma foto ausente.

Após integrar o commit remoto d5ee7bf, todos os 17 IDs têm imagem local. As imagens 11 e 19 foram substituídas, e 21, 22, 23, 24 e 29 foram adicionadas. Legendas e alt foram revisados após inspeção dos sete arquivos. A apresentação usa a legenda/alt atuais também para saves com o mesmo ID e caminho de imagem, sem alterar seus recursos ou escolhas. O placeholder continua disponível para imagens removidas, ausentes ou inválidas.

Os arquivos 5, 18 e 20 diferem do assunto/imagem principal de suas páginas informadas. A imagem 11 agora mostra uma erupção solar, enquanto o link original da planilha era o de uma ilustração de nave. As legendas descrevem o arquivo local sem atribuir identidades incertas. Os links de origem informados pelo autor são preservados, não certificados como correspondência exata.

## Reprodução

```bash
python scripts/import_event_cards.py
python scripts/import_event_cards.py --check
npm test
```

O navegador lê data/cards.json. Python serve apenas para importação editorial. Saves em andamento preservam o catálogo com que começaram; novas missões usam somente a Página2.
