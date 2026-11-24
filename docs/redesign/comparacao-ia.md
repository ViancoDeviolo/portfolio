# Comparação real de IAs — tela 05 (Como eu uso IA)

Fonte: respostas coladas pelo Lucas em 24/11/2026. O texto abaixo é a transcrição fiel delas. Fica de fora só a publicidade que veio colada na resposta do GPT.
No site entram apenas **trechos curtos** de cada resposta (até 2 linhas), sem reescrever o sentido, mais a conclusão do Lucas.

## Pedido (enviado igual às quatro IAs)

```
Sou estudante de engenharia de computação e estou construindo um sistema
multiagente (CrewAI) de renovação de apólices de seguro auto.

A função abaixo decide, sem usar LLM, se uma alteração pedida pelo cliente
é compatível com um sistema legado. Revise-a como um engenheiro sênior:

1. Aponte bugs ou casos de borda que ela não trata.
2. Diga se faz sentido manter essa decisão fora do LLM, e por quê.
3. Sugira no máximo 3 melhorias, em ordem de prioridade.

Responda em português, em até 200 palavras, em tópicos.

[função verificar_compatibilidade_legado — célula 6 do notebook]
```

## Gemini

1. Bugs e casos de borda
- Chaves ausentes ou nulas: `alteracao["novas_coberturas"]` pode ser `None` (lança `TypeError` ao iterar) ou faltar, e `nova_franquia_valor` pode ser `None` ou `<= 0` (falha na comparação `<` ou aceita valor inválido).
- Normalização de strings: `"assistência 24h"` ou espaços extras não batem no `set` (`case-sensitive`).
- Duplicidade e coberturas já existentes: não valida se a cobertura já consta na apólice atual nem evita mensagens duplicadas.
- Regra de franquia ambígua: `franquia_diferenciada=False` com valor abaixo de `3000` passa sem crítica, e a rota assume que `API v2` sempre aceita qualquer combinação.

2. Manter fora do LLM?
- Sim. Regras de negócio, limites financeiros e roteamento de sistemas exigem determinismo, auditoria, baixa latência e zero risco de alucinação. O LLM deve apenas explicar e redigir em cima do resultado já calculado.

3. Melhorias (por prioridade)
1. Validar e normalizar entradas (`get`, valores padrão, `strip`/`lower`, checagem de tipos e `nova_franquia_valor > 0`) antes de avaliar regras.
2. Desacoplar roteamento da lista de conflitos usando uma função própria que avalie compatibilidade do legado e disponibilidade da `API v2`.
3. Externalizar regras e limites em configuração/schema (ex.: Pydantic) em vez de constantes fixas no código.

## Copilot

- Faz sentido manter fora do LLM? Sim, fortemente.
  - A regra é determinística, auditável, reproduzível e regulatória.
  - Evita alucinações e divergências entre execuções.
  - Permite testes unitários simples e rastreabilidade da decisão de emissão.
  - O LLM deve explicar o resultado, não decidir compatibilidade.
- Bugs e casos de borda
  - Acesso direto a chaves (`alteracao["novas_coberturas"]`, etc.) pode lançar `KeyError` se o payload vier incompleto.
  - Se `novas_coberturas` for `None` ou não for lista, o `for` quebra.
  - Comparação de cobertura depende de texto exato. `"Assistencia 24h"`, `"assistência 24h"` ou espaços extras não serão detectados.
  - `nova_franquia_valor` pode ser `None`, string ou negativo, causando erro ou comportamento inválido.
  - Coberturas duplicadas geram conflitos duplicados.
  - A lógica assume que apenas novas coberturas importam. Se o legado também não suportar coberturas já existentes na apólice renovada, isso não é validado.
  - Conflitos são acumulados; se houver múltiplas regras futuras para a mesma cobertura, mensagens podem ficar redundantes.
- Melhorias (prioridade)
  1. Validar entrada explicitamente (schema/Pydantic/dataclass) antes das regras.
  2. Normalizar dados (casefold, trim, remoção de acentos) antes das comparações.
  3. Modelar regras como catálogo configurável (YAML/JSON/tabela), evitando hardcode e facilitando evolução do legado.

## GPT

1. Bugs e casos de borda
- `alteracao["..."]` gera `KeyError` se faltar algum campo; não há validação de entrada nem de tipos.
- `nova_franquia_valor` pode ser `None`, texto ou valor negativo, causando erro ou decisão incorreta.
- A comparação aceita franquia exatamente igual a R$ 3.000, mas isso precisa estar alinhado à regra de negócio.
- Comparação de coberturas é sensível a maiúsculas, espaços e variações de escrita; `"Assistencia 24h"` pode passar indevidamente.
- Não há tratamento para coberturas duplicadas ou valores monetários com precisão decimal.

2. Decisão fora do LLM
- Faz sentido. Compatibilidade é uma regra determinística, com impacto operacional e financeiro. O código garante previsibilidade, rastreabilidade e testes reproduzíveis. O LLM deve explicar os resultados, não decidir ou alterá-los.

3. Melhorias prioritárias
1. Validar e normalizar entradas: campos obrigatórios, tipos, valores positivos e nomes de coberturas.
2. Usar `Decimal` para valores monetários e criar testes unitários para limites, campos ausentes e entradas inválidas.
3. Retornar resultado estruturado (conflitos, rota e status), com versão das regras, para auditoria e integração segura com os agentes.

Atenção arquitetural: a tarefa `task_conflict` pede status final ao LLM. Mesmo com a regra no código, o agente pode contradizê-la. O status e a rota devem ser definidos pelo código; o agente deve apenas produzir a explicação.

## Claude

**Pendente** — enviar o mesmo pedido numa conversa nova, sem contexto.

## Conclusão do Lucas

**Pendente** — nas palavras dele: qual resposta se sustentou e por quê.

## Evolução real da Renovação (bloco complementar da tela 05)

| | Primeira versão (com o GPT) | Versão atual |
|---|---|---|
| Agentes | 1 pesquisador genérico | 4 especializados (risco, preço, compatibilidade, proposta) |
| Modelo | Gemini 2.5 Flash (a chave da OpenAI falhou) | Groq `gpt-oss-120b` (LLaMA 3.3 descontinuado) |
| Decisão crítica | toda com o LLM | regra do legado em função Python determinística |
