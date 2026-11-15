# Cartas de evento — Página1 + Página2

Fontes atuais: [Página1](<../Cartas de evento - Página1.csv>) e [Página2](<../Cartas de evento - Página2.csv>). Os CSVs são preservados; linhas sem ID são ignoradas.

O catálogo combina 14 cartas da Página1 e 17 da Página2: **31 eventos distintos**. IDs 5, 9 e 11 aparecem nas duas páginas; os IDs internos da Página2 permanecem intactos e as versões da Página1 usam page1-5, page1-9 e page1-11. sourceCardId preserva o ID original, catalogSheet identifica a página e imageId aponta para o arquivo numérico, compartilhado pelas versões quando necessário. Não são deduplicados por terem textos/efeitos diferentes.

Categoria e dificuldade vêm das planilhas. Pesos iguais são recalculados dentro da categoria sobre o catálogo combinado: Routine 9, Maintenance 9, Exploration 1, Science 5 e Emergency 7. Easy tem 27 cartas elegíveis (exclui 9, 26, page1-9 e 12); Hard tem as 31. Todas as categorias têm cartas elegíveis nos dois modos.

## Efeitos e textos

A Página2 usa `primeira resposta // segunda resposta`, com unidades explícitas: kg para oxigênio/comida seca, L para água, kWh para energia e p para pontos de Shield. **Não são porcentagens da capacidade.** O importador valida as unidades, aceita vírgula decimal e espaços entre sinal e número, e ignora os pontos soltos antes do separador nas células de água 15/16. Valores não são arredondados nem escalados pela capacidade.

A Página1 aceita pares separados por barra, barra dupla ou barras invertidas, com unidades opcionais. Seus valores atuais também são unidades físicas/pontos, sem conversão de percentuais. Notas laterais de capacidade não alteram a configuração do jogo.

A primeira resposta vira left, a segunda right. A frente e os botões têm resumos em inglês simples; sourceDescription/sourceResponse preservam os originais. Respostas completas aparecem no verso. Sources (Página2) e Referência (Página1) alimentam Source no verso; o campo Source Verified? é preservado em sourceVerified e não transforma as referências em validação científica dos efeitos.

A coluna Side effects da carta 9 menciona redução de geração por oito sols. Como o painel/tipo de cartas contínuas foi retirado e a geração automática deixou de existir, a anotação fica em sourceSideEffects, **sem executar efeitos contínuos**. Extra informations permanece em sourceNotes. Somente as alterações imediatas das cinco colunas de recursos são aplicadas.

## Imagens pelo ID

`imageById: true` faz `src/card-images.js` procurar, em ordem, `images/cards/imageId.jpg`, `.png` e `.jpeg` (ou ID se imageId estiver ausente) a cada apresentação. O campo image continua com o caminho convencional JPG, sem assumir que existe. Não há listagem de diretório nem build. Arquivos antigos não são sorteados só por estarem nessa pasta.

Sem arquivo válido, usar `images/cards/placeholder.svg`, alt e legenda “Image not available yet.”. O carregador tenta novamente a cada 15 segundos enquanto a frente continua aberta; um arquivo adicionado passa a aparecer automaticamente. URLs de tentativa mudam para evitar cache negativo. Ao mudar de carta/face, cancelar atualizações pendentes para não trocar a imagem da próxima carta. Os três formatos são decodificados pelo navegador; um arquivo quebrado não impede testar o seguinte.

A legenda termina sempre com Image source: e o link da coluna Imagem da carta, com o domínio como rótulo. Sem link, manter o rótulo e o valor vazio. Ao carregar uma imagem, usar sua descrição; durante o placeholder, não descrever uma foto ausente.

Após integrar o commit remoto d5ee7bf, todos os 17 IDs da Página2 têm imagem local. As imagens 11 e 19 foram substituídas, e 21, 22, 23, 24 e 29 foram adicionadas. Legendas e alt foram revisados após inspeção dos sete arquivos. A apresentação usa a legenda/alt atuais também para saves com o mesmo ID e caminho de imagem, sem alterar seus recursos ou escolhas. O placeholder continua disponível para imagens removidas, ausentes ou inválidas.

Os arquivos 5, 18 e 20 diferem do assunto/imagem principal de suas páginas informadas. A imagem 11 agora mostra uma erupção solar, enquanto o link original da planilha era o de uma ilustração de nave. As legendas descrevem o arquivo local sem atribuir identidades incertas. Os links de origem informados pelo autor são preservados, não certificados como correspondência exata.

## Reprodução

```bash
python scripts/import_event_cards.py
python scripts/import_event_cards.py --check
npm test
```

O navegador lê data/cards.json. Python serve apenas para importação editorial. Saves em andamento preservam o catálogo com que começaram; novas missões usam as duas páginas.

## Verificação das 31 cartas

O pull até f6c9621 adicionou 25.png. Todos os 31 eventos têm imagem local válida, totalizando 28 arquivos distintos porque três IDs visuais são compartilhados. A imagem 25 ilustra partículas solares chegando a Marte; legenda baseada na inspeção do arquivo e no link NASA da planilha. O placeholder permanece como segurança, sem ser necessário no catálogo completo atual.

Referências múltiplas da Página1 aparecem juntas no verso; texto original permanece em sourceReferenceText. O endereço de busca Google da carta page1-11 foi normalizado para o link NASA contido no parâmetro q. As duas referências de 8 foram preservadas, e a anotação “pdf de pesquisa da nasa” de 7 não entra no URL. Cartas 12 e 13 não possuem Source. A frente de 8/10 não repete o antigo limite de 15 kWh e 10/13 não exigem uma carta anterior, pois o sorteio é independente. Originais permanecem em sourceDescription/sourceResponse. A carta 25 usa linguagem geral sobre radiação; seu texto original não constitui um modelo científico de raios cósmicos ou proteção ativa.

O importador também atualiza categories.json: peso da categoria = número de cartas / 31 (ou total do catálogo futuro). --check verifica ambos os arquivos. Com pesos internos iguais, cada carta do catálogo completo Hard tem chance-base de 1/31 por sorteio. No Easy permanece o filtro e a normalização dos pesos-base existentes.
