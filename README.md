# Next Frontier

Protótipo simples de decisões por cartas para uma base marciana com quatro astronautas. Interface em português, sem dependências ou instalação.

Abra `entry.html` no navegador. Alternativamente, execute `python -m http.server 8000` e acesse `http://localhost:8000/entry.html`.

## Partida

- 30 sols, 45 decisões e 1–3 cartas por sol.
- Oxigênio e água separados sob Life Support; energia em kWh e alimentos secos em kg.
- Blindagem em g/cm²: água distribuída sobre 20 m², transferida com conservação de massa.
- Reinício, vitória e interrupção ao esgotar um recurso essencial.

Os custos, equipamentos e eventos são ilustrativos. O balanço contínuo usa frações do sol para não multiplicar o consumo por número de cartas. A referência de consumo é 0,84 kg de O₂ e 0,62 kg de sólidos alimentares por pessoa/dia terrestre. A produção de O₂ de 3 kg/sol, perda líquida de água de 4 kg/sol e saldo elétrico de 40 kWh/sol são parâmetros de teste. Custos das cartas são adicionais. Não há APIs, previsão de radiação, simulação completa de suporte à vida ou armazenamento de progresso. Estufa, doses e eventos solares ficam para uma próxima versão. O tempo de partida ainda não foi validado com crianças.

Fontes e distinção entre dados de referência e parâmetros simulados estão disponíveis na interface.
