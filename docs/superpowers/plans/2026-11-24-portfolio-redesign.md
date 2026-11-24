# Redesign visual do portfólio — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refazer o visual do site já publicado (Astro) seguindo o redesign aprovado: capa amarelo/laranja com retícula, nome em dupla tipográfica, globo 3D de partículas, seis telas novas, movimento por tela e bichinhos em pixel art. Conteúdo, i18n, segurança, LGPD e deploy continuam funcionando.

**Architecture:**
- **Páginas e fallback**: o Astro continua gerando páginas estáticas e completas sem JS. Cada efeito tem uma versão estática renderizada no servidor (SVG/HTML), que serve de fallback para quem está sem JS, sem WebGL ou com movimento reduzido.
- **Ilhas React**: o movimento entra por elas, carregadas tarde.
  - Uma cena React Three Fiber única para o globo (capa → tela 02 → moldura da tela 03).
  - GSAP ScrollTrigger para a rolagem; Motion para as microinterações.
  - Uma ilha leve, só SVG, para os bichinhos.
- **Lógica testável**: tudo que é calculável (geometria do globo, sprites, comportamento dos bichinhos, hashes da CSP) fica em funções puras em `src/lib/`.

**Tech Stack:**
- Astro 7 (atual) + `@astrojs/react`, React 19, `three`, `@react-three/fiber`.
- `gsap` (ScrollTrigger), `motion`, Tailwind CSS v4 (`@tailwindcss/vite`).
- Fontes Fontsource copiadas para `public/fonts`.
- Testes: Vitest, Playwright e LHCI (já existentes).

**Spec:** `docs/superpowers/specs/2026-11-24-portfolio-redesign-visual-design.md`. Ela substitui as partes visuais de `2026-11-22-portfolio-design.md`; o restante daquele doc continua valendo. Esboços aprovados: `docs/redesign/*.png`. Desenhos dos bichinhos: `docs/redesign/bichinhos-sprites.json`. Comparação real de IAs: `docs/redesign/comparacao-ia.md`.

**Branch:** `feat/redesign`, criada a partir da `main` depois do merge da `feat/site-v1`. Se esse PR ainda estiver aberto, crie a partir da `feat/site-v1` e avise o Lucas.

## Global Constraints

- Commits e PRs **sem** `Co-Authored-By` nem qualquer atribuição ao Claude.
- **Cores**:
  - `#FFC83D` (amarelo, lado "à mão"), `#FF5A1F` (laranja, lado "IA"), `#0F0F10` (preto, secundária), `#EDEBE6` (texto claro, só sobre preto), `#55db9c` (só selo "concluído").
  - Texto sobre amarelo ou laranja é **sempre** `#0F0F10`.
  - O único fundo preto é a tela 06 e o rodapé.
- **Regra de cor por lado**: "à mão" usa amarelo e "IA" usa laranja, inclusive em cards, etiquetas e destaques; elementos neutros usam preto.
- **Fontes**:
  - Instrument Serif itálico 400 para os destaques "à mão".
  - Archivo 900 (tracking −0,04em) para os destaques "IA".
  - Inter 400/500/600 para texto e interface; DM Mono (já no repo) para código.
  - Todas servidas de `public/fonts`, subconjunto latino, `font-display: swap`. Nada de CDN.
- **CSP**: continua `default-src 'self'`. Proibido `unsafe-inline` ou `unsafe-eval` em `script-src`. A única ampliação permitida são hashes `sha256-` de scripts embutidos, gerados no build. Nenhum atributo `style=""` no HTML gerado.
- **Desempenho**:
  - Lighthouse: performance ≥ 0,90 no desktop e ≥ 0,85 no celular; LCP < 2.500 ms no celular.
  - O chunk do `three` **não** pode estar no caminho crítico (nem `modulepreload` nem `<script>` direto em `index.html`).
  - O teste "JS total abaixo de 15 KB" é substituído pelo da Task 1.
- **Acessibilidade mínima**, confirmada pelo Lucas:
  - `prefers-reduced-motion` desliga todo movimento;
  - texto alternativo em fotos, prints e vídeos;
  - links e botões alcançáveis por teclado, com foco visível.
  - O resto fica adiado e é registrado no `docs/CONFORMIDADE.md`.
- **Conteúdo**:
  - Nenhum número sem fonte (regra do `CLAUDE.md`).
  - Nenhum texto inventado na tela 05.
  - Todo texto novo existe em PT e EN no esquema Zod (`l10n`).
- **Personagens**: os bichinhos são originais (`bichinhos-sprites.json`). É proibido usar ou imitar personagens de terceiros, como os inimigos de Space Invaders.
- **Skills**:
  - Taste (`design-taste-frontend`) dirige o visual; Emil (`emil-design-eng`, `animate`, `review-animations`) cuida do movimento; Impeccable faz o polimento; Web Design Guidelines faz a conferência final.
  - Componentes do shadcn e do Magic estão liberados, mas **sempre reestilizados** com os tokens.

## Review Focus

1. **CSP em produção.** O `astro preview` não aplica o `_headers`. Se uma ilha injetar um script embutido sem hash, o site quebra no Cloudflare e parece normal no local. A tela deve continuar interativa com a CSP real. *Teste: `tests/e2e/csp.spec.ts` passa a ler `dist/_headers` e rola até a tela 06 com as ilhas hidratadas (Task 1 e Task 8).*
2. **Sem WebGL, sem JS ou com movimento reduzido.** O visitante vê o globo estático, todas as telas e todos os links. *Testes: `nojs.spec.ts` (Task 7), `motion.spec.ts` com `reducedMotion: 'reduce'` e com WebGL desligado (Task 8).*
3. **Celular lento.** O 3D não pode atrasar a capa. *Testes: `security.test.ts` (o `three` fora do caminho crítico, Task 1) e LHCI no celular (Task 12).*
4. **Bichinhos atrapalhando.** Eles não podem cobrir texto nem roubar o clique de um link. *Teste: `critters.spec.ts`. No centro de cada link visível, `elementFromPoint` devolve o próprio link (Task 10).*
5. **Inglês com palavras longas em tipo gigante.** Títulos como "Always under construction" não podem gerar rolagem horizontal. *Teste: `responsive.spec.ts`, com `scrollWidth <= innerWidth` em 360 px para `/` e `/en/` (Task 11).*

---

### Task 1: Base técnica — React, Tailwind, CSP com hashes e novos orçamentos

**Files:**
- Modify: `package.json` (deps: `@astrojs/react`, `react`, `react-dom`, `three`, `@react-three/fiber`, `gsap`, `motion`, `tailwindcss`, `@tailwindcss/vite`; devDeps `@types/react`, `@types/react-dom`, `@types/three`), `astro.config.mjs`
- Create: `scripts/csp-hashes.mjs`, `src/lib/csp.ts`
- Modify: `package.json` script `build` → `astro build && node scripts/csp-hashes.mjs && node scripts/build-pdf.mjs`
- Modify: `tests/e2e/csp.spec.ts` (lê `dist/_headers`), `tests/dist/security.test.ts`, `lighthouserc.cjs`, `lighthouserc.desktop.cjs`
- Modify: `CLAUDE.md`, `docs/GUIA-SKILLS.md`, `docs/CONFORMIDADE.md`
- Copy: spec para `docs/superpowers/specs/`, `kit/docs/redesign/` para `docs/redesign/`, este plano para `docs/superpowers/plans/`
- Test: `tests/unit/csp.test.ts`

**Interfaces:**
- Produces:
  - `inlineScriptHashes(html: string): string[]` em `src/lib/csp.ts`: `'sha256-…'` de cada `<script>` sem `src`, sem duplicatas e em ordem estável.
  - `withScriptHashes(headers: string, hashes: string[]): string`: insere os hashes logo após `script-src 'self'` na linha `Content-Security-Policy`.
  - `scripts/csp-hashes.mjs` lê todo `dist/**/*.html` e grava `dist/_headers`.

- [ ] **Step 1: Write the failing test** `tests/unit/csp.test.ts`
  - `inlineScriptHashes('<script>a()</script><script src="/x.js"></script><script>a()</script>')` → `["'sha256-" + base64(sha256('a()')) + "'"]` (um só item).
  - `withScriptHashes("Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'", ["'sha256-AAA'"])` contém `script-src 'self' 'sha256-AAA';` e **não** contém `unsafe`.
  - Com `hashes = []`, o texto volta igual.
- [ ] **Step 2: Run** `npx vitest run tests/unit/csp.test.ts` → FAIL (módulo inexistente).
- [ ] **Step 3: Implement** `src/lib/csp.ts`, com `node:crypto`; o conteúdo do script é hasheado exatamente como está entre as tags. Implemente também `scripts/csp-hashes.mjs`, que usa `src/lib/csp.ts`.
- [ ] **Step 4: Run** `npx vitest run tests/unit/csp.test.ts` → PASS.
- [ ] **Step 5: Adicione as integrações**
  - `@astrojs/react` em `integrations` e `@tailwindcss/vite` em `vite.plugins`, sem alterar `site`, `trailingSlash` nem `build`.
  - `src/styles/global.css` importa `tailwindcss`.
- [ ] **Step 6: Atualize os testes de orçamento**
  - Em `tests/dist/security.test.ts`, troque `JS total abaixo de 15 KB` por `three fora do caminho crítico`: nenhum `<link rel="modulepreload">` nem `<script src>` de `dist/index.html` e `dist/en/index.html` aponta para um arquivo cujo conteúdo contenha `WebGLRenderer`.
  - Adicione `todo <script> embutido tem hash no dist/_headers`: para cada HTML de `dist`, cada hash de `inlineScriptHashes` aparece em `dist/_headers`.
  - Adicione `nenhum atributo style no HTML`: regex `/\sstyle=/` em todo `dist/**/*.html` → 0 ocorrências.
- [ ] **Step 7: Atualize o LHCI**
  - `lighthouserc.cjs` (celular): `performance` 0,85, `accessibility` 0,90, `largest-contentful-paint` 2500, `resource-summary:script:size` 450000.
  - Desktop: `performance` 0,90, demais iguais.
  - `best-practices`, `seo` e `errors-in-console` ficam como estão.
- [ ] **Step 8: Atualize o `csp.spec.ts`** para ler a CSP de `dist/_headers` em vez de `public/_headers`. O resto do teste continua igual.
- [ ] **Step 9: Atualize as regras**
  - `CLAUDE.md`: troque a fonte da verdade para incluir a spec nova; "Lighthouse >= 95" vira as metas acima; "Não instalar componentes do 21st/shadcn sem pedir ao Lucas" vira "shadcn e 21st liberados, sempre reestilizados com os tokens".
  - `docs/GUIA-SKILLS.md`: inclua a tabela de papéis da spec, seção 8.
  - `docs/CONFORMIDADE.md`: registre a acessibilidade avançada como adiada, com a data 24/11/2026 e o mínimo mantido.
- [ ] **Step 10: Verify** `npm run check && npm test && npm run build && npm run test:dist` → tudo verde (o site ainda é o antigo).
- [ ] **Step 11: Commit** `chore: base para o redesign (React, Tailwind, CSP com hashes, novos orçamentos)`

### Task 2: Tokens, fontes e tipografia

**Files:**
- Modify: `src/styles/tokens.css` (reescrita), `src/styles/global.css` (`@theme` do Tailwind lendo os tokens), `public/fonts/LICENSES.md`
- Create: `public/fonts/instrument-serif-italic-latin.woff2`, `archivo-800-latin.woff2`, `archivo-900-latin.woff2`, `inter-400-latin.woff2`, `inter-500-latin.woff2`, `inter-600-latin.woff2` (copiados de `@fontsource/*`, instalado só como devDependency temporária e removido depois da cópia)
- Delete: `public/fonts/instrument-sans-latin.woff2`, se nada mais usar
- Create: `src/lib/contrast.ts`
- Test: `tests/unit/contrast.test.ts`, `tests/dist/base.test.ts` (atualizar)

**Interfaces:**
- Produces:
  - Tokens CSS: `--c-mao: #ffc83d`, `--c-ia: #ff5a1f`, `--c-ink: #0f0f10`, `--c-paper: #edebe6`, `--c-ok: #55db9c`, `--font-serif`, `--font-block`, `--font-sans`, `--font-mono`, mais a escala de espaçamento atual.
  - Classes utilitárias: `.t-mao` (serif itálico) e `.t-ia` (Archivo 900, `letter-spacing: -0.04em`).
  - `contrastRatio(fg: string, bg: string): number` (WCAG 2.x).

- [ ] **Step 1: Write the failing test** `tests/unit/contrast.test.ts`
  - `contrastRatio('#0f0f10', '#ffc83d') >= 4.5`
  - `contrastRatio('#0f0f10', '#ff5a1f') >= 4.5`
  - `contrastRatio('#edebe6', '#0f0f10') >= 4.5`
  - `contrastRatio('#ffffff', '#ffc83d') < 4.5` (documenta por que branco sobre amarelo é proibido)
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** `contrastRatio`, com luminância relativa sRGB.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Escreva os tokens e o `@font-face`** (6 arquivos, `font-display: swap`). Atualize `tests/dist/base.test.ts`: cada woff2 novo existe em `dist/fonts` e é referenciado no CSS gerado; nenhuma URL externa de fonte.
- [ ] **Step 6: Verify** `npm test && npm run build && npm run test:dist` → PASS.
- [ ] **Step 7: Commit** `feat(redesign): tokens, fontes e tipografia em dupla`

### Task 3: Modelo de conteúdo das telas novas

**Files:**
- Modify: `src/lib/i18n.ts`, `src/lib/schema.ts`, `src/content/site.yaml`, `src/content/projects/*.yaml`
- Create: `src/content/snippets/calculadora-ideiaV1.py`
- Test: `tests/unit/schema.test.ts`, `tests/unit/content.test.ts`, `tests/unit/i18n.test.ts`

**Interfaces:**
- Produces:
  - `SECTION_IDS = ['living', 'ai', 'fundamentals', 'workflow', 'contact'] as const`, nessa ordem, que é a ordem das telas 02 a 06.
  - `common.lastChange: l10n.optional()` nos projetos.
  - `siteSchema` ganha:
    - `heroLabels: { mao: { title: l10n, sub: l10n }, ia: { title: l10n, sub: l10n } }`
    - `method: l10n[]` (exatamente 3)
    - `comparison: { prompt: l10n, answers: { ai: 'Claude'|'GPT'|'Gemini'|'Copilot', excerpt: l10n }[] (0..4, `ai` único), conclusion: l10n.optional() }`
    - `evolution: { label: l10n, before: l10n, after: l10n }[]` (mínimo 1)
  - `site.sections.stack` e `site.sections.about` deixam de existir. Os parágrafos de `about` vão para um único `about: l10n`, curto, mostrado na tela 06.

- [ ] **Step 1: Write the failing tests**
  - `schema.test.ts`: aceita uma `comparison` com 3 respostas e sem `conclusion`; rejeita `ai: 'Bard'`; rejeita duas respostas com o mesmo `ai`; rejeita `method` com 2 itens; aceita um projeto sem `lastChange`.
  - `i18n.test.ts`: `SECTION_IDS` é igual à lista acima; `switchHref('/', 'workflow', 'en')` → `'/en/#workflow'`.
  - `content.test.ts`: todo texto novo tem `pt` e `en` não vazios; cada `answers[].excerpt.pt` tem no máximo 220 caracteres.
- [ ] **Step 2: Run** `npm test` → FAIL.
- [ ] **Step 3: Implement** os esquemas e preencha o `site.yaml`:
  - `heroLabels`: "Fundamentos" / "construídos sem atalho" e "Engenharia de IA" / "prompt, orquestração e revisão" (o EN é proposto pelo construtor e marcado para revisão do Lucas no PR).
  - `method`: "Escrevo o pedido com contexto, regras e formato." / "Mando o mesmo pedido para quatro IAs." / "Comparo, testo e fico com o que se sustenta."
  - `comparison.prompt`: resumo do pedido de `docs/redesign/comparacao-ia.md`.
  - `comparison.answers`: Gemini, Copilot e GPT, com trechos **copiados** daquele arquivo (até 2 linhas cada, sem mudar o sentido). O do GPT tem que incluir a "Atenção arquitetural".
  - `comparison.conclusion`: fica ausente até o Lucas escrever.
  - `evolution`: as três linhas da tabela do fim de `comparacao-ia.md`.
  - Títulos de seção: `living` "Sempre / em obra."; `ai` "Engenharia de IA"; `fundamentals` "à mão."; `workflow` "Quatro / respostas."; `contact` "Vamos / conversar.".
- [ ] **Step 4: Snippet.** Copie para `src/content/snippets/calculadora-ideiaV1.py` as linhas de entrada e de cálculo de `ideiaV1.py`, **direto do repositório** `ViancoDeviolo/calculadora-python` (via `gh`), sem redigitar.
- [ ] **Step 5: Run** `npm test` → PASS.
- [ ] **Step 6: Commit** `feat(redesign): conteúdo das telas novas (seções, comparação real, evolução)`

### Task 4: Geometria do globo (funções puras)

**Files:**
- Create: `src/lib/globe.ts`
- Test: `tests/unit/globe.test.ts`

**Interfaces:**
- Produces:
  - `fibonacciSphere(n: number): Float32Array`: `n*3` valores, todos os pontos com norma 1 ± 1e-6.
  - `particleCount(o: { coarsePointer: boolean; width: number }): number`: 900 se `coarsePointer` ou `width < 768`, senão 2200.
  - `frameTargets(w: number, h: number, step: number): Float32Array`: pontos do contorno de um retângulo centrado na origem, espaçados de `step`.
  - `globeSvg(n: number, r: number, tilt: number): string`: SVG estático, só hemisfério da frente, círculos ordenados por profundidade, `fill` por atributo (sem `style`).

- [ ] **Step 1: Write the failing tests**
  - `fibonacciSphere(500).length === 1500`, e toda norma é ≈ 1.
  - `particleCount({ coarsePointer: true, width: 1440 }) === 900`; `particleCount({ coarsePointer: false, width: 1440 }) === 2200`.
  - `frameTargets(100, 50, 10)`: todo ponto tem `|x| === 50` ou `|y| === 25`.
  - `globeSvg(300, 100, 0.35)` começa com `<svg`, não contém `style=` e tem menos de 300 `<circle`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** (algoritmo de Fibonacci com ângulo áureo). **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(redesign): geometria do globo`

### Task 5: Lógica dos bichinhos (funções puras)

**Files:**
- Create: `src/lib/critters/sprites.ts` (importa `docs/redesign/bichinhos-sprites.json`, copiado para `src/lib/critters/sprites.json`), `src/lib/critters/behavior.ts`
- Test: `tests/unit/critters.test.ts`

**Interfaces:**
- Produces:
  - `type Critter = { id: string; kind: 'projeto' | 'figurante'; projectId?: string; x: number; y: number; vx: number; vy: number; frame: 0 | 1 }`
  - `spriteRects(grid: string[], px: number): { x: number; y: number; w: number; h: number }[]`
  - `PROJECT_CRITTERS: Record<string, string>`, que mapeia `projectId` → nome do sprite (`arapuca` → formiga, `easyfood` → marmita, `analitic-blitz` → candle, `nfe-hub` → nota fiscal, `banco-java` → moeda, `renovacao-apolices` → robô).
  - `step(c: Critter, cursor: { x: number; y: number } | null, dt: number, rules: Rules): Critter`
  - `Rules = { followStop: 48; fleeRadius: 120; speed: 40; fleeSpeed: 160 }` (px e px/s)
  - `blocked(box: Box, exclusions: Box[]): boolean`
  - `capPerViewport(list: Critter[]): Critter[]`: no máximo 3 `projeto` e 4 `figurante`.

- [ ] **Step 1: Write the failing tests**
  - `spriteRects(['#.', '.#'], 5)` → 2 retângulos de 5×5.
  - Projeto a 300 px do cursor: depois de `step`, a distância diminui.
  - Projeto a 40 px: fica parado (`vx === 0 && vy === 0`).
  - Figurante a 100 px do cursor: a distância aumenta.
  - Figurante a 200 px: não reage.
  - Com `cursor = null`, anda e alterna `frame`.
  - `blocked` é true quando há interseção.
  - `capPerViewport` com 5 projetos e 6 figurantes devolve 3 + 4.
  - Todo `projectId` de `PROJECT_CRITTERS` existe em `src/content/projects/`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(redesign): lógica dos bichinhos`

### Task 6: Capa estática (tela 01)

**Files:**
- Modify: `src/components/Hero.astro` (reescrita), `src/components/Header.astro` (pílulas; PT/EN como botão preto preenchido)
- Create: `src/components/Halftone.astro` (retícula em SVG gerada no build), `src/components/GlobeStatic.astro` (usa `globeSvg`)
- Test: `tests/dist/hero.test.ts` (reescrita)

**Interfaces:**
- Consumes: `globeSvg` (Task 4), tokens (Task 2), `site.heroLabels` (Task 3)
- Produces:
  - `<section id="top" data-hero>` com:
    - `[data-hero-name]`, contendo `<span class="t-mao">Lucas</span><span class="t-ia">Cruz</span>`;
    - `[data-globe-static]`, o globo estático;
    - `[data-halftone]`, a retícula.
  - O ponto de montagem da cena 3D é `#globe-stage` (vazio no HTML).

- [ ] **Step 1: Write the failing test** `tests/dist/hero.test.ts`, para `dist/index.html` e `dist/en/index.html`:
  - `h1` contém "Lucas" e "Cruz";
  - existe `[data-globe-static] svg`;
  - as duas fotos têm `alt` igual a `site.heroAlt`;
  - os rótulos da capa vêm de `heroLabels` e **não** contêm "Claude", "GPT", "Gemini" nem "Copilot";
  - a `img` do casual vem antes da do terno no DOM.
- [ ] **Step 2: Run** `npm run build && npm run test:dist` → FAIL.
- [ ] **Step 3: Implement** a capa conforme `docs/redesign/redesign-capa.png`:
  - metade esquerda `--c-mao`, metade direita `--c-ia`;
  - retícula com pontos laranja crescendo da esquerda para a direita na faixa central, começando abaixo do cabeçalho;
  - globo de pontos pretos atrás das fotos; nome gigante atrás das fotos;
  - selo "portfólio vivo" com a data de `livingNote`.
  - Use a skill Taste para medidas e hierarquia.
- [ ] **Step 4: Run** → PASS. Compare com o esboço pelo Playwright MCP (captura de 1440×900 lado a lado).
- [ ] **Step 5: Commit** `feat(redesign): capa estática`

### Task 7: Telas 02 a 06 estáticas

**Files:**
- Modify: `src/components/Home.astro`, `src/components/ProjectCard.astro` (vira `ProjectScreen.astro` para os projetos de IA), `src/components/Workflow.astro`, `src/components/Contact.astro`, `src/components/Footer.astro`
- Create: `src/components/Living.astro` (tela 02: lista de etiquetas + `GlobeStatic`), `src/components/Fundamentals.astro` (tela 04, com `<pre>` do snippet e os cards), `src/components/Comparison.astro` (tela 05)
- Delete: `src/components/Stack.astro`, `src/components/About.astro`
- Test: `tests/dist/sections.test.ts`, `tests/dist/projects.test.ts`, `tests/e2e/nojs.spec.ts`, `tests/e2e/keyboard.spec.ts`

**Interfaces:**
- Consumes: `SECTION_IDS`, `comparison`, `evolution`, `method`, `lastChange` (Task 3); `GlobeStatic` (Task 6)
- Produces:
  - Cada tela é um `<section id={SECTION_IDS[i]}>` com `h2`.
  - Tela 02: `[data-living-tag][data-project-id]`, uma por projeto, com link `href="#p-<id>"`. A cor segue o `side`: `fund` → amarelo, `ia` → preto.
  - Tela 03: `<article id="p-<id>" data-ai-screen>` por projeto `ia`, com `[data-media-frame]`, contador `NN / total` e link "próximo", e quatro blocos (`problem`, `iDecided` com `iDecidedLabel`, `aiDid`, `evidence`). Os vídeos seguem o `src/scripts/videos.ts` atual: só tocam quando visíveis.
  - Tela 04: `id="p-<id>"` em cada card `fund`. O card do Banco é preto com texto amarelo, nunca laranja.
  - Tela 05: método, evolução e respostas. O bloco de respostas só aparece se `answers.length >= 3`; a conclusão, só se existir.

- [ ] **Step 1: Write the failing tests**
  - `sections.test.ts`: em PT e EN, as seções aparecem na ordem de `SECTION_IDS`; não existem `#stack` nem `#about`; `#workflow` contém "Claude", "GPT", "Gemini" e "Copilot" só se houver resposta de cada uma no `site.yaml` (hoje: GPT, Gemini e Copilot, e o teste deve refletir isso); `#contact` contém os três itens de `studyingNow`.
  - `projects.test.ts`: cada projeto tem exatamente uma `[data-living-tag]` e um alvo `#p-<id>`; cada etiqueta mostra o rótulo de status do `statusLabels`.
  - `nojs.spec.ts`: troque `SECTIONS` por `SECTION_IDS`; com JS desligado, cada etiqueta da tela 02 é um link visível que leva ao seu projeto.
  - `keyboard.spec.ts`: as etiquetas da tela 02 são alcançáveis por Tab, com foco visível (contorno ≥ 2 px).
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** seguindo `S02`…`S06` em `docs/redesign/`:
  - Fundo da tela 05 meio a meio.
  - Tela 06 preta, com LinkedIn amarelo, GitHub laranja e e-mail (com o mecanismo de ofuscação atual de `Email.astro`), mais o `about` curto.
  - A navegação aponta para `#living` (Projetos), `#workflow` (Como eu uso IA), `#fundamentals` e `#contact`.
- [ ] **Step 4: Run** `npm run build && npm run test:dist && npm run e2e` → PASS.
- [ ] **Step 5: Commit** `feat(redesign): telas 02 a 06 estáticas`

### Task 8: Cena 3D do globo e rolagem

**Files:**
- Create: `src/components/islands/GlobeScene.tsx` (R3F; montado em `#globe-stage` com `client:only="react"`, após o load), `src/components/islands/useScrollStage.ts` (GSAP ScrollTrigger), `src/lib/motionPrefs.ts`
- Modify: `src/components/Hero.astro`, `src/components/Living.astro`, `src/components/Home.astro`
- Test: `tests/unit/motionPrefs.test.ts`, `tests/e2e/motion.spec.ts`, `tests/e2e/csp.spec.ts`

**Interfaces:**
- Consumes: `fibonacciSphere`, `particleCount`, `frameTargets` (Task 4)
- Produces:
  - `canAnimate(o: { reducedMotion: boolean; webgl: boolean }): boolean`
  - Atributo `data-globe-live` em `<html>` quando a cena assume. O CSS esconde os `[data-globe-static]` só nesse estado.
  - Estados da cena: `hero` → `living` → `frame:<projectId>` (a moldura de pontos ao redor de `[data-media-frame]` da tela 03).

- [ ] **Step 1: Write the failing tests**
  - `motionPrefs.test.ts`: `canAnimate` é falso se `reducedMotion` ou se `!webgl`.
  - `motion.spec.ts`:
    - em `/`, com rolagem até `#living`, existe exatamente um `canvas` e `html[data-globe-live]`;
    - com `reducedMotion: 'reduce'`, não há `canvas` e o `[data-globe-static]` está visível;
    - com WebGL desligado (`--disable-3d-apis` no projeto chromium do teste), o mesmo;
    - o LCP da capa não é o `canvas` (`PerformanceObserver`).
  - `csp.spec.ts`: depois de rolar até o fim, `__csp` continua vazio, agora com o canvas presente.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement**
  - **Cena**: uma única `Canvas` fixa atrás do conteúdo, `dpr={[1, 1.5]}`, `frameloop` pausado quando `document.hidden`. Partículas em `THREE.Points` com um shader simples (cor `#0f0f10`, tamanho por profundidade).
  - **Interação**: rotação lenta, com leve inclinação seguindo o mouse.
  - **Rolagem**: a ScrollTrigger interpola entre os alvos dos estados.
  - **Etiquetas da tela 02**: projetadas da esfera para a tela (posição das `[data-living-tag]` via `transform`, feita por JS e não por atributo `style` no HTML); escala e opacidade por profundidade. Passar o mouse numa etiqueta pausa a rotação e mostra `lastChange`, quando existir.
  - **Movimento**: durações e curvas pela skill `animate`; revisão com `review-animations`.
- [ ] **Step 4: Run** `npm test && npm run build && npm run test:dist && npm run e2e` → PASS.
- [ ] **Step 5: Commit** `feat(redesign): globo 3D, rolagem e etiquetas vivas`

### Task 9: Momentos e microinterações por tela

**Files:**
- Create: `src/components/islands/HeroIntro.tsx`, `src/components/islands/TypeCode.tsx`, `src/components/islands/AnswersReveal.tsx`, `src/scripts/reveal.ts` (GSAP para entrada de texto e escurecimento da tela 06)
- Modify: `src/components/Fundamentals.astro`, `src/components/Comparison.astro`, `src/components/Contact.astro`
- Test: `tests/e2e/motion.spec.ts` (ampliar)

**Interfaces:**
- Consumes: `canAnimate` (Task 8)
- Produces:
  - Os componentes só animam o que já existe no HTML estático. Sem JS, o conteúdo final aparece inteiro.

- [ ] **Step 1: Write the failing tests** (`motion.spec.ts`)
  - Com `reducedMotion: 'reduce'`, o `<pre>` da tela 04 mostra o snippet inteiro logo ao carregar, e as três respostas da tela 05 estão visíveis sem esperar.
  - Sem `reduce`, depois de rolar até `#fundamentals` e esperar 3 s, o texto do `<pre>` é igual ao snippet (a digitação termina).
  - Na tela 05, as respostas podem ser alternadas por botões com `aria-pressed`, e só uma fica em destaque por vez.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** os momentos da tabela da spec (seção 5):
  - entrada do nome em duas partes e fotos se aproximando;
  - texto entrando com a rolagem (uma vez, depois fica parado);
  - código sendo digitado;
  - respostas aparecendo uma a uma;
  - página escurecendo até o preto na tela 06;
  - cards da tela 04 inclinando com o mouse (no máximo 4°);
  - botões com resposta a hover e toque.
  - Use `emil-design-eng` e `animate`; aprove com `review-animations`.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(redesign): momentos e microinterações`

### Task 10: Bichinhos em pixel art

**Files:**
- Create: `src/components/islands/Critters.tsx` (`client:idle`, SVG, fora da cena 3D)
- Modify: `src/components/Home.astro`
- Test: `tests/e2e/critters.spec.ts`

**Interfaces:**
- Consumes: `spriteRects`, `step`, `blocked`, `capPerViewport`, `PROJECT_CRITTERS` (Task 5); `canAnimate` (Task 8)
- Produces:
  - `[data-critter][data-kind="projeto"]` é um `<a href="#p-<id>" aria-label="<título do projeto>">`.
  - `[data-critter][data-kind="figurante"]` é `aria-hidden="true"` com `pointer-events: none`.
  - As exclusões são os retângulos de `h1, h2, h3, p, li, pre, a, button, img, video, [data-critter-avoid]` dentro da tela visível, recalculadas no `resize`.

- [ ] **Step 1: Write the failing tests** (`critters.spec.ts`, desktop 1440×900)
  - Em cada tela, há no máximo 3 `[data-kind="projeto"]` e 4 `[data-kind="figurante"]` visíveis.
  - Para cada `a` e `button` visível, `document.elementFromPoint` no centro dele devolve o próprio elemento ou um filho.
  - Com o mouse parado a 200 px de um bichinho de projeto, depois de 1,5 s a distância diminuiu e ficou ≥ 40 px.
  - Com `reducedMotion: 'reduce'`, as posições não mudam em 2 s.
  - Em viewport 390×844 com `hasTouch`, os bichinhos ficam a até 24 px das bordas.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement**
  - Loop de `requestAnimationFrame` com `step`; os quadros alternam a cada 300 ms.
  - Cores: preto, ou amarelo, laranja e `#EDEBE6` dentro de `#contact`.
  - Pixel de 5 px para projeto e 3 px para figurante.
  - Pausa quando a aba não está visível.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(redesign): bichinhos em pixel art`

### Task 11: Layout de celular

**Files:**
- Modify: componentes das Tasks 6, 7 e 9 (só CSS e breakpoints)
- Test: `tests/e2e/responsive.spec.ts`

- [ ] **Step 1: Write the failing tests**
  - Em 360, 390 e 768 px, para `/` e `/en/`: `document.documentElement.scrollWidth <= innerWidth`.
  - Em 390 px, a divisa da capa fica horizontal: `[data-hero]` tem a metade amarela acima da laranja, verificado pela cor de fundo do pixel do topo e do pixel do fim (via `page.screenshot` + leitura do pixel).
  - O nome em duas linhas cabe na largura.
  - Os testes atuais desse arquivo (impressão e área de toque de 44 px) continuam passando.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement**, decidindo com a Taste. **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(redesign): layout de celular`

### Task 12: Portão de qualidade e PR

**Files:**
- Modify: `docs/CONFORMIDADE.md`, `docs/EVIDENCIAS.md` (se algum número mudou de lugar)

- [ ] **Step 1: Direção.** Rode o verificador da skill `design-taste-frontend` no navegador, em `/` e `/en/`, em 1440 e 390 px. Corrija tudo o que ele apontar como "cara de template".
- [ ] **Step 2: Polimento e conferência.** Rode `impeccable` (polimento) e `web-design-guidelines` (conferência). Itens de acessibilidade avançada vão para o `CONFORMIDADE.md` como adiados, sem bloquear.
- [ ] **Step 3: Movimento.** Rode `review-animations` sobre as Tasks 8 a 10.
- [ ] **Step 4: Comparação visual.** Pelo Playwright MCP, tire uma captura de cada tela em 1440×900 e compare com `docs/redesign/*.png`. Liste as diferenças no PR.
- [ ] **Step 5: Verify** `npm run check && npm test && npm run build && npm run test:dist && npm run e2e && npx lhci autorun --config=lighthouserc.cjs && npx lhci autorun --config=lighthouserc.desktop.cjs` → tudo verde. Pelo Chrome DevTools MCP, o console fica limpo.
- [ ] **Step 6: PR** `feat/redesign` → `main`, sem atribuição ao Claude. A descrição lista para o Lucas revisar:
  - os textos em EN;
  - as diferenças da comparação visual;
  - a pendência da tela 05 (resposta do Claude e conclusão dele);
  - os itens adiados de acessibilidade.
