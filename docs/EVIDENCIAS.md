# Evidências

Regra: nenhum número no site sem origem. Cada `evidence[].source` de uma ficha é uma destas:

- `evidencias/<arquivo>.txt`: o arquivo está em `src/content/evidencias/` e contém o `value` literalmente.
- `media/<projeto>/<arquivo>.webp`: o arquivo existe em `src/assets/` (o Astro gera as versões AVIF/WebP publicadas) e aparece aqui, com o trecho conferido. O `.webp` é a conversão do PNG do kit (`kit/media/...`), citado na coluna "fonte do kit".
- `https://github.com/...`: a URL exata aparece aqui.

Nota sobre os `.txt`: copiados de `kit/evidencias/` sem alteração, exceto o caminho `C:\Users\lucas\` trocado por `~\` (aprovado por Lucas). Só isso mudou.

Tudo que está em "pendente" **não entra em ficha** até Lucas confirmar.

## Confirmado por arquivo de texto

| projeto | valor | fonte | trecho visto |
|---|---|---|---|
| Analitic Blitz | 98% | `evidencias/analitic-blitz-pytest-resumo.txt` | `TOTAL 2998 38 678 33 98%` |
| EasyFood | 73 (testes) | `evidencias/easyfood-npm-test.txt` | `tests 73` |
| EasyFood | 12 (suítes) | `evidencias/easyfood-npm-test.txt` | `suites 12` |
| NFE Hub | 79 (testes) | `evidencias/nfe-hub-pytest.txt` | `collected 79 items` e `79 passed, 1 warning in 3.71s` |
| NFE Hub | estrutura em camadas (sem número) | `evidencias/nfe-hub-estrutura.txt` | árvore `src/` com api, application, core, fiscal, infra, marketplaces |

## Confirmado por print (aberto e conferido)

| projeto | valor | fonte (publicada) | fonte do kit | trecho visto |
|---|---|---|---|---|
| Analitic Blitz | 300 operações | `media/analitic-blitz/analitic-backtest-2021-2025.webp` | `kit/media/analitic-blitz/analitic-backtest-2021-2025.png` | `Sinais: 341 operações executadas: 300`; critério `[OK] pelo menos 100 operações (300)` |
| Analitic Blitz | 200 sorteios | `media/analitic-blitz/analitic-backtest-2021-2025.webp` | idem | `Referência aleatória (200 sorteios, ...)` |
| Analitic Blitz | 2021 a 2025 | `media/analitic-blitz/analitic-backtest-2021-2025.webp` | idem | `Backtest BTCUSDT ... de 2021-01 a 2025-12` |
| Analitic Blitz | reprovada no critério pré-registrado | `media/analitic-blitz/analitic-backtest-2021-2025.webp` | idem | quatro `[FALHOU]` e `Conclusão: REPROVADA no critério` |
| Analitic Blitz | print ao vivo (sem número usado) | `media/analitic-blitz/analitic-ao-vivo.webp` | `kit/media/analitic-blitz/analitic-ao-vivo.png` | `Ao vivo: BTCUSDT`, `Nenhuma ordem é enviada`, estratégia v3 REPROVADA contra o acaso (E4) |
| Calculadoras | 0,63 e 0,62 | `media/calculadoras/calculadoras-lado-a-lado.webp` | `kit/media/calculadoras/calculadoras-lado-a-lado.png` | Java: `5.0 / 8.0 = 0.63`; Python: `5.0 / 8.0 = 0.62` |
| EasyFood | 8 ADRs | `media/easyfood/easyfood-adrs.webp` | `kit/media/easyfood/easyfood-adrs.png` | lista `ADR-001` a `ADR-008` + README |
| EasyFood | Oracle em Docker (sem número) | `media/easyfood/easyfood-docker-oracle.webp` | `kit/media/easyfood/easyfood-docker-oracle.png` | `Container easyfood-oracle Healthy`, `EasyFood rodando na porta 3000 (banco: oracle)` |
| NFE Hub | rotas da API (sem número) | `media/nfe-hub/nfehub-api-rotas.webp` | `kit/media/nfe-hub/nfehub-api-rotas.png` | `NFE Hub 0.1.0`; GET `/auth/mercado-livre/iniciar`, GET `/callback`, GET `/saude`, POST `/webhooks/mercado-livre` |
| Renovação de Apólices | 58 s | `media/renovacao-apolices/crewai-comparativo.webp` | `kit/media/renovacao-apolices/crewai-comparativo.png` | `Tempo de renovação ... TO-BE: 58 s (medido)` |
| Renovação de Apólices | regras do legado em Python | `media/renovacao-apolices/crewai-comparativo.webp` | idem | `Rota de emissão ... Regra em Python` |
| Renovação de Apólices | verificação do legado (sem número) | `media/renovacao-apolices/crewai-regras-legado.webp` | `kit/media/renovacao-apolices/crewai-regras-legado.png` | coberturas não suportadas pelo legado Java v2.1; rota de emissão API v2 |
| Renovação de Apólices | proposta final (sem número) | `media/renovacao-apolices/crewai-proposta-final.webp` | `kit/media/renovacao-apolices/crewai-proposta-final.png` | proposta com forma de emissão via API v2 e status final |
| Arapuca | 330 ataques reais; 326 Telnet; 4 MQTT; 37 países; 164 em 24 h | `media/arapuca/arapuca-ataques-reais.webp` | `kit/media/arapuca/arapuca-ataques-reais.png` | "330 ataques reais acumulados", Telnet 326, MQTT 4, "37 países numa janela de 24 h (164 ataques)", fonte: resumo da isca, 07/11 16:54 |

Os prints da Renovação mostram valores em reais (prêmio, exposição financeira "hipótese"): **não usar** no site.

## Arapuca HoneyAnt (repositório público)

Conferido em clone do commit `f5e8c838c4638232c725d69202f0e0c6e90d5559` (branch principal, 2026-11-09).

| valor | fonte | como foi conferido |
|---|---|---|
| 330 ataques reais (326 Telnet + 4 MQTT) | https://github.com/ViancoDeviolo/arapuca-honeyant/blob/f5e8c838c4638232c725d69202f0e0c6e90d5559/docs/demo/resumo-real-2026-11-07.json | campo `acumulado_por_servico` = `{"telnet": 326, "mqtt": 4}` |
| 37 países | mesmo arquivo | `por_pais` tem 37 entradas |
| 164 eventos em 24 h | mesmo arquivo | `total_eventos` = 164, `janela_horas` = 24 |
| 11 ADRs | https://github.com/ViancoDeviolo/arapuca-honeyant/tree/f5e8c838c4638232c725d69202f0e0c6e90d5559/docs/adr | 11 arquivos (0001 a 0011) |
| 44 testes JS | https://github.com/ViancoDeviolo/arapuca-honeyant/tree/f5e8c838c4638232c725d69202f0e0c6e90d5559/tests/js | contadas as linhas `test(` ou `it(` em `tests/js/*.test.mjs`: 2+10+3+7+14+4+4 = 44 |
| Equipe de 5 e papéis | https://github.com/ViancoDeviolo/arapuca-honeyant/blob/f5e8c838c4638232c725d69202f0e0c6e90d5559/README.md | seção "Equipe": 5 linhas (Lucas, Rafael, Kawe, Kauã, Gustavo) |

Papéis (README, seção "Equipe", confirmados por Lucas):
- Lucas: `core` (contratos), `arapuca`, `pathfinder` (fuzzy, ACO, Dijkstra), `painel` e formigueiro, twin (configuração, mitigação e capturas), `apps/`, CI, deploy na AWS e documentação, e a implementação final de `intel` e `sensor`.
- Rafael: `intel` e `sensor`.
- Kawe: planta da casa (twin).
- Kauã: replay determinístico e ADRs 0005 e 0006.
- Gustavo: login do painel.

## Pendente — Lucas

Não entram em ficha.

| projeto | valor | motivo |
|---|---|---|
| Analitic Blitz | 539 testes (valor do design) | O resumo em texto diz `537 passed, 1 warning, 3 errors`. Nenhum número de testes vai ao site até Lucas rodar de novo. |
| Arapuca | 574 testes pytest | `uv run pytest --collect-only -q` no commit acima terminou com `1108 tests collected in 6.37s`. Não bate; pendente. |
| Arapuca | 28 PRs | API pública do GitHub (`/pulls?state=all&per_page=100`) devolve 38 PRs (31 mesclados, 7 fechados sem merge) em 2026-11-22. Não bate; pendente. |
| Renovação de Apólices | 4 agentes | Não aparece nos prints (o comparativo fala em "Log por agente", sem contagem). |
| Renovação de Apólices | migrado após descontinuação do modelo | Sem arquivo ou print que mostre. |
| Banco em Java | Java 17, Swing, PostgreSQL, BCrypt, DAO, validação de CPF | Os vídeos não foram abertos nesta tarefa; sem evidência registrada. |
| EasyFood | Oracle em transação | Sem print ou texto que mostre a transação. |
| NFE Hub | testes de path traversal e OAuth state adulterado | Os nomes aparecem em `nfe-hub-pytest.txt` (`resource_fora_do_formato...`, `callback_com_state_adulterado_e_recusado`), mas a frase do design é interpretação; Lucas confirma o texto. |
| Analitic Blitz | mypy estrito (após correções) | Sem arquivo ou print de mypy. |
| Arapuca | trechos de vídeo do pitch (rota 1:29–1:47; mitigação 1:50–2:10) e demais prints | Fora do escopo desta tarefa; conferir na Tarefa 5 ao gerar a mídia. |
