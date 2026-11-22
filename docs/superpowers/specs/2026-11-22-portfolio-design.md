# Portfólio Lucas Cruz — Documento de Design

Data: 22/11/2026 · Status: **aprovado pelo Lucas em 22/11/2026**
Repositório: novo, `ViancoDeviolo/portfolio` (substitui o portfólio anterior, que não tinha repositório)
Destino no repositório: `docs/superpowers/specs/2026-11-22-portfolio-design.md`
Documentos irmãos (mesma pasta `docs/`): `CONFORMIDADE.md` (LGPD, acessibilidade, segurança — obrigatório) e `GUIA-SKILLS.md` (precedência das skills).

---

## 1. Intenção e o porquê

Lucas é estudante de Engenharia de Computação (UniFECAF, 6º semestre) e analista júnior na MAPFRE, migrando para engenharia de software com foco em backend (Java/Spring, PostgreSQL, Python) em bancos e seguradoras. O portfólio existe para um recrutador entender, em poucos segundos, uma ideia só:

> **"Ele usa IA de forma madura — e sabe fazer sem ela."**

O mercado usa muito código gerado por IA; a dúvida do avaliador é se o candidato domina o que está por baixo. O site responde mostrando os dois lados lado a lado, como uma dupla: o **Lucas casual** (fundamentos, feitos na mão) e o **Lucas de terno** (engenharia com IA). O site é o principal canal: o link vai no currículo, no LinkedIn e no GitHub.

## 2. Objetivos, não-objetivos e anti-objetivos

**Objetivos**
- Comunicar o conceito da dupla na primeira tela.
- Mostrar cada projeto rodando (vídeo curto ou print) com evidência verificável (testes, CI, decisões).
- Deixar explícito, em cada projeto de IA, **o que a IA fez e o que o Lucas decidiu**.
- PT e EN completos, com endereço próprio por idioma.
- Lighthouse ≥ 95 em todas as categorias, WCAG 2.2 AA, cabeçalhos de segurança nota A.
- Adicionar um projeto novo = preencher uma ficha de conteúdo, sem tocar em layout.
- **Deixar claro que é um portfólio vivo**: os projetos estão em evolução constante (ver §5.7).

**Não-objetivos**
- Blog, CMS, painel administrativo, login, banco de dados.
- Formulário de contato (contato por `mailto:` e LinkedIn; ver §9).
- Analytics nesta versão.

**Anti-objetivos** (se acontecer, falhou mesmo que funcione)
- Cara de template ou "site feito por IA": parede de logos, gradientes genéricos, hero com frase vazia, cards idênticos de SaaS, emojis como ícones.
- Qualquer dado pessoal real em print ou vídeo (nome, CPF, e-mail pessoal, endereço, chaves, saldos).
- Exagero: números ou promessas que o repositório não comprove.
- Rastreamento de terceiros ou banner de cookies.

## 3. Restrições

- Hospedagem gratuita; domínio próprio fica para depois (`*.pages.dev` por ora).
- Mantido por uma pessoa, que vai adicionar projetos do curso ao longo de 2027.
- Fotos da dupla: edições por IA a partir das fotos originais (o Lucas não tem terno); resolução de origem limitada (casual 774×1024, terno 1086×1448). A composição deve funcionar com isso.
- Commits **sem** `Co-Authored-By` ou qualquer atribuição ao Claude.
- Seguir `CONFORMIDADE.md` integralmente.

## 4. Abordagens consideradas

| Abordagem | Prós | Contras | Decisão |
|---|---|---|---|
| **Astro (estático) + Cloudflare Pages** | i18n por rota nativo; *content collections* com esquema Zod (build falha sem tradução); zero JS por padrão; otimização de imagens embutida; `_headers` para CSP/HSTS | Uma ferramenta nova para aprender | **Escolhida pelo Lucas** |
| Next.js (React) | React é pedido em vagas; integra com skills Vercel/shadcn | Aplicação inteira para servir páginas estáticas; mais JS; i18n e validação de conteúdo manuais | Descartada: complexidade sem justificativa |
| HTML/CSS/JS à mão | Coerente com o discurso "na unha"; controle total | Páginas duplicadas por idioma; tradução esquecida passa em silêncio; otimização manual; manutenção cresce a cada projeto | Descartada: não cumpre "build falha sem tradução" sem reinventar um gerador |

Hospedagem: **Cloudflare Pages** (grátis, CDN global, `_headers` com suporte completo). Vercel seria equivalente; GitHub Pages foi descartado por não permitir cabeçalhos HTTP de segurança. Cloudflare hoje recomenda Workers + static assets para projetos novos; para um site estático que depende de `_headers`, Pages é mais simples. Migrar para Workers fica registrado como melhoria futura, não como requisito.

## 5. Decisões do Lucas (fechadas)

### 5.1 Conceito visual
- **Capa (hero)**: as duas fotos de braços cruzados, **de costas uma para a outra**, como pôster de dupla. **Casual à esquerda** (fundamentos), **terno à direita** (engenharia com IA) — a leitura esquerda→direita segue a ordem das seções.
- Cada metade é **clicável** e leva à sua seção (âncora). Página única; o recrutador sempre consegue ver os dois lados.
- **Mesma tipografia e diagramação** nos dois lados; **só o acento de cor muda**.

### 5.2 Paleta (contraste verificado sobre o fundo)
| Token | Cor | Uso | Contraste sobre `#0F0F10` |
|---|---|---|---|
| `--bg` | `#0F0F10` | fundo | — |
| `--text` | `#EDEBE6` | texto principal | 16,1:1 |
| `--muted` | `#8A8A8E` | texto secundário | 5,6:1 |
| `--accent-fund` | `#FFC83D` | lado casual / fundamentos | 12,4:1 |
| `--accent-ia` | `#FF5A1F` | lado terno / IA | 6,1:1 |

Cor só em acentos (títulos de seção, links, foco, borda de card, barra de progresso de vídeo). Preto com laranja/amarelo em excesso lembra sinalização de obra — evitar.

Na capa, cada figura ganha um **brilho de recorte sutil** na cor do seu lado (resolve roupa escura sobre fundo escuro). Protótipo aprovado: `fotos/teste-dupla.jpg`.

### 5.3 Idiomas
- PT em `/` (padrão), EN em `/en/`. Botão PT/EN no topo; ao trocar, mantém a seção atual (mesma âncora).
- `<html lang>` correto e `hreflang` alternados em cada página.
- Conteúdo separado do layout; **o build falha se qualquer texto não tiver as duas versões**.

### 5.4 Seções (ordem)
1. **Capa** — dupla + nome + uma frase curta de posicionamento + PT/EN.
2. **Fundamentos** (amarelo) — Banco em Java (âncora da seção), Calculadoras Java/Python, card "em construção" para os projetos do curso.
3. **Engenharia com IA** (laranja) — Arapuca HoneyAnt, EasyFood, Analitic Blitz, NFE Hub (marcado "em desenvolvimento"), Renovação de Apólices (CrewAI).
4. **Como eu trabalho com IA** — fluxo em 3 passos, sem parede de logos:
   1. *Construo* — Claude / Claude Code: prompts estruturados, arquitetura, código revisado por mim.
   2. *Valido* — GPT, Gemini, Copilot: a mesma pergunta em mais de um modelo; divergência = investigar.
   3. *Decido* — eu: testes, leitura do código, fundamentos (aponta para a seção Fundamentos).
   Rodapé da seção: agentes com CrewAI + Groq; curso Oracle Agentic AI Foundations.
5. **Stack** — tecnologias que aparecem nos projetos (Java, Spring, PostgreSQL, Oracle, Python, Node/Express, AWS, Docker, testes). Sem barras de "nível".
6. **Sobre** — MAPFRE (atendimento → Backoffice Cliente → CNO Broker), UniFECAF, previsão de formatura 2027.
7. **Contato** — `mailto:lucascruzcorp@gmail.com`, LinkedIn `https://www.linkedin.com/in/lucas-alves-cruz/`, GitHub `https://github.com/ViancoDeviolo`, link para o PDF.
8. **Rodapé** — Privacidade, Termos, alternância de idioma.

### 5.5 Ficha de projeto (o que cada card mostra)
- Título, uma frase do problema que resolve, stack.
- Mídia: vídeo curto (loop, mudo) ou print; sempre com `alt`/descrição em texto.
- **Meu papel** (obrigatório em projetos de equipe: Arapuca).
- **Lado IA**: "o que a IA fez / o que eu decidi". **Lado fundamentos**: "o que este projeto prova".
- **Evidência**: números verificáveis no repositório (testes, cobertura, ADRs, PRs).
- Links: repositório público ou o selo **"repositório privado"** (hoje só o NFE Hub é privado; Analitic Blitz agora é público), demo se existir.
- Status: `concluído` · `em evolução` · `em desenvolvimento`, sempre com **"atualizado em <mês/ano>"**.

### 5.6 Saídas de teste e estrutura de pastas
Mostradas como **texto real** num bloco estilo terminal com rolagem (não imagem): nítido, acessível, verificável.

### 5.7 Portfólio vivo (requisito do Lucas)
O site precisa deixar claro, sem parecer desculpa, que os projetos continuam evoluindo:
- Uma linha curta na capa ou logo abaixo dela, no tom de "portfólio vivo: projetos em evolução constante, atualizado em <mês/ano>". A data vem do build, não é escrita à mão.
- Selo de status em cada card (ver §5.5) com a data da última atualização do projeto (campo da ficha).
- O card "em construção" da seção Fundamentos mostra o que está sendo estudado agora (campo da ficha `site.yaml`).
- Na ficha de cada projeto, um campo opcional `proximos_passos` (1–3 itens) exibido de forma discreta, para mostrar direção e não só estado.

### 5.8 Versão PDF
Uma página, gerada **a partir do próprio site** (folha de estilo de impressão ou script de build) — uma única fonte de conteúdo.

### 5.9 Sem rastreamento
Nenhum script ou fonte de terceiros. Sem cookies não essenciais → sem banner de cookies. Fontes servidas do próprio domínio.

## 6. Inventário de mídia (pronto)

| Projeto | Lado | Arquivos | Texto/evidência para o card |
|---|---|---|---|
| Banco em Java | Fundamentos | `banco-java-completo.mp4` (borrado, 2:15) ou `banco-java-cadastro-deposito.mp4` | Java 17, Swing, PostgreSQL, BCrypt, DAO; validação de CPF |
| Calculadoras | Fundamentos | `calculadoras-java-python.mp4`, `calculadoras-lado-a-lado.png` | Mesma conta, dois arredondamentos (0,63 × 0,62) → por que dinheiro usa BigDecimal/Decimal |
| Arapuca HoneyAnt | IA | trechos do pitch (1:29–1:47 rota; 1:50–2:10 mitigação), prints 0:25–0:40, 2:35–2:55, 3:55 | 330 ataques reais, 37 países, 574 testes, 11 ADRs, 28 PRs; equipe de 5 com papel do Lucas |
| EasyFood | IA | `easyfood-cliente-pedido.mp4`, `easyfood-dono-status.mp4`, print Docker/Oracle, print ADRs, saída de testes (texto) | 73 testes, 12 suítes, 8 ADRs, Oracle em transação |
| Analitic Blitz (repo público) | IA | print ao vivo, print backtest 2021–2025, saída de testes (texto) | 300 operações em 5 anos × 200 sorteios: reprovada no critério pré-registrado; 539 testes, 98% cobertura, mypy estrito (após correções) |
| NFE Hub (repo privado) | IA | `nfehub-api-rotas.png`, estrutura em texto, saída de testes (texto) | 79 testes, incluindo path traversal e OAuth state adulterado; **em desenvolvimento** (emissão ainda não implementada) |
| Renovação de Apólices | IA | `crewai-regras-legado.png`, `crewai-proposta-final.png`, `crewai-comparativo.png` | 4 agentes, regras do legado em Python, 58 s medidos; migrado após descontinuação do modelo |
| Dupla (capa) | — | recortes em `fotos/` | — |

Todos os arquivos de mídia: sem metadados, sem áudio, conferidos contra dados pessoais.

## 7. Arquitetura

### 7.1 Estrutura de pastas
```
portfolio/
├── docs/                       # este design, CONFORMIDADE.md, GUIA-SKILLS.md, plano
├── public/
│   ├── _headers                # CSP, HSTS, etc. (Cloudflare Pages)
│   ├── fonts/                  # fontes auto-hospedadas
│   ├── media/<projeto>/        # vídeos e pôsteres (já otimizados)
│   └── lucas-cruz-cv.pdf       # gerado no build
├── src/
│   ├── content/
│   │   ├── config.ts           # esquemas Zod (fonte da validação)
│   │   ├── projects/<id>.yaml  # 1 ficha por projeto, campos PT e EN juntos
│   │   └── site.yaml           # textos fixos (capa, seções, sobre) PT e EN
│   ├── components/             # Hero, ProjectCard, Terminal, LangSwitch...
│   ├── layouts/Base.astro
│   ├── pages/
│   │   ├── index.astro         # PT
│   │   ├── en/index.astro      # EN
│   │   ├── privacidade.astro / en/privacy.astro
│   │   └── termos.astro / en/terms.astro
│   ├── styles/tokens.css       # paleta, tipografia, espaçamento
│   └── lib/i18n.ts             # helpers puros (testáveis)
├── tests/
│   ├── unit/                   # Vitest: esquema, i18n, utilitários
│   └── e2e/                    # Playwright: navegação, idioma, teclado, axe
└── .github/workflows/ci.yml
```

**Por que assim:** conteúdo (`content/`) separado de apresentação (`components/`) e de regras (`lib/`). Uma ficha por projeto com os dois idiomas **no mesmo arquivo** torna impossível esquecer uma tradução sem o esquema acusar. `lib/` só tem funções puras, testáveis sem navegador.

### 7.2 Dependências (mínimo justificado)
| Dependência | Por quê |
|---|---|
| `astro` | gerador estático, i18n, content collections, imagens |
| `typescript` | tipagem dos esquemas e componentes |
| `vitest` | testes unitários de esquema e i18n |
| `@playwright/test` + `@axe-core/playwright` | e2e e acessibilidade automatizada |
| `@lhci/cli` | Lighthouse no CI |

Sem framework de UI (React/Vue), sem Tailwind, sem biblioteca de animação, sem bibliotecas de componentes: CSS próprio com tokens. Qualquer dependência nova precisa de justificativa escrita no PR.

### 7.3 Interação e movimento
- Hover/foco em cada metade da dupla: o brilho do lado aumenta sutilmente; clique leva à seção.
- Vídeos: `autoplay muted loop playsinline` **apenas** quando visíveis e quando `prefers-reduced-motion` não estiver ativo; com reduced-motion, mostra o pôster e um botão de play. Sempre com controle de pausa.
- Animações construídas com a skill `animate` e aprovadas com `review-animations`.

### 7.4 Desempenho
- Fotos da capa em AVIF/WebP com `srcset`; `fetchpriority="high"` só na imagem da capa.
- Vídeos ≤ 2 MB cada, `preload="none"`, pôster leve.
- Fontes: uma família variável + uma monoespaçada, subconjunto latino, `font-display: swap`.
- Orçamento: LCP < 2,0 s em 4G simulado; JS total < 15 KB.

## 8. Segurança e conformidade

Tudo em `CONFORMIDADE.md`. Resumo do que entra no design:
- `_headers`: CSP `default-src 'self'` sem `unsafe-inline` em script, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors 'none'`.
- Links externos com `rel="noopener noreferrer"`.
- E-mail montado de forma a dificultar coleta por robôs.
- Páginas de Privacidade e Termos em PT e EN.
- Secret scanning + push protection no GitHub; Dependabot.

## 9. Estratégia de testes

| Tipo | O que cobre | Ferramenta |
|---|---|---|
| Unitário | esquema rejeita ficha sem EN; helpers de i18n (rota equivalente, âncora mantida) | Vitest |
| Integração | build completo gera `/` e `/en/` com as mesmas seções e IDs | Vitest + `astro build` |
| E2E | troca PT/EN mantém seção; metades da capa levam às seções; navegação só por teclado; foco visível | Playwright |
| Acessibilidade | zero violações axe nas duas línguas | axe + Playwright |
| Segurança | `_headers` contém as diretivas obrigatórias (teste lê o arquivo); nenhum script/fonte externo no HTML gerado; `npm audit` sem vulnerabilidade alta; gitleaks | Vitest + CI |
| Desempenho | Lighthouse ≥ 95 nas 4 categorias, mobile e desktop, nas duas línguas | Lighthouse CI |

CI no GitHub Actions roda tudo em cada PR; o deploy só acontece da `main`.

## 10. Pré-requisitos fora do site (antes de publicar o link)

| Repositório | Correção |
|---|---|
| easyfood | CI vermelho no último commit; remover pasta duplicada `easyfood/easyfood/` |
| Analitic-Blitz | `ids=` no `test_lixo`; override do mypy para `MetaTrader5` |
| banco-java | depósito/saque negativos; saldo não atualiza após transferência; `CriarTabelas` com sintaxe SQLite; (ideal) BigDecimal, Maven/Gradle, README |
| calculadora-java/python | (opcional) validação de entrada |
| notebook CrewAI | cabeçalho ainda cita LLaMA; fixar versão do crewai |

Não bloqueiam o desenvolvimento do site; bloqueiam a divulgação do link.

## 11. Uso obrigatório de skills e ferramentas (requisito do Lucas)

O Claude Code deve usar **todas as skills e MCPs relevantes** instalados para levar a qualidade ao máximo, seguindo a precedência de `docs/GUIA-SKILLS.md` (quando duas discordam, o guia decide). No início, rodar `/skills` e `/mcp` e registrar no plano quais estão disponíveis. Mapeamento mínimo por fase:

| Fase | Skills / MCPs |
|---|---|
| Plano | `superpowers:writing-plans` (a partir deste documento aprovado) |
| Execução | `superpowers:subagent-driven-development` ou `executing-plans`; `superpowers:test-driven-development` em toda lógica (`lib/`, esquemas) |
| Visual | `design-taste-frontend` (autoridade), `emil-design-eng`, `frontend-design`, `impeccable` (auditoria/polimento) |
| Movimento | `animate` para construir, `review-animations` para aprovar |
| Texto PT/EN | `copywriting` |
| UX e acessibilidade | `web-design-guidelines`, `ui-ux-pro-max` (só como checklist de UX) |
| Mídia | `media-toolkit` (compressão final, pôsteres); Adobe MCP para refinar o recorte das fotos da dupla |
| Verificação visual | Chrome DevTools MCP (console, rede, Lighthouse) e Playwright MCP (e2e, screenshots) |
| Revisão e entrega | `superpowers:requesting-code-review`, `superpowers:verification-before-completion`, `strix-pentest` no site publicado, `superpowers:finishing-a-development-branch` |
| Economia | Ponytail corta código, **nunca** requisito deste documento ou do `CONFORMIDADE.md`; Caveman só no chat |

Deliberadamente fora (decisão registrada): 21st MCP e shadcn MCP — catálogos de componentes prontos puxam para a "cara de template" que este projeto quer evitar. Só com pedido explícito do Lucas.

Toda tela é considerada pronta apenas depois de: `web-design-guidelines` sem pendências, `impeccable` sem problemas graves, Lighthouse ≥ 95 e axe sem violações, nas duas línguas.

## 11b. Fica a critério do construtor (Claude Code)
- Nome exibido: **"Lucas Cruz"** (escolha provisória do Claude, sem resposta do Lucas; fica num único campo de `site.yaml`).
- Escolha das fontes (licença aberta, auto-hospedáveis), seguindo `design-taste-frontend`.
- Redação final dos textos PT/EN, com a skill `copywriting`, respeitando os fatos deste documento.
- Detalhes de espaçamento, grid e responsividade.
- Como gerar o PDF (impressão via Playwright no build é a sugestão).

---

## 12. Revisão crítica

**Pontos fortes**: conceito único e memorável; site estático = superfície de ataque mínima; validação de conteúdo impede o erro mais provável (tradução esquecida); evidência verificável em cada card; sem dependências supérfluas.

**Pontos fracos e riscos**
- Resolução das fotos da capa (casual 1024 px de altura) pode ficar suave em telas de alta densidade → compor a dupla em tamanho moderado, não em tela cheia.
- Fotos editadas por IA: coerente com o conceito, mas é uma conversa possível em entrevista.
- Projetos com bugs conhecidos (banco-java) ou incompletos (NFE Hub) ficam expostos → §10 e status honesto.
- Manutenção bilíngue dobra o texto de cada projeto novo.

**Escalabilidade**: adicionar projeto é O(1) em esforço (uma ficha). Hospedagem estática em CDN não tem limite prático para o tráfego de um portfólio.

**Melhorias futuras**: domínio próprio; migração para Workers static assets se surgir necessidade de lógica no servidor; métricas sem cookies; página por projeto (estudo de caso longo).

**Dívida técnica aceita**: sem modo claro (só escuro); PDF regenerado a cada build mesmo sem mudança.

**Notas** — Arquitetura: 9/10 · Segurança: 9/10 · Escalabilidade: 9/10
