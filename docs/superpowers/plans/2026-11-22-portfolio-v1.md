# Portfólio Lucas Cruz v1 — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Site estático bilíngue (PT em `/`, EN em `/en/`) que mostra a dupla "Lucas casual (fundamentos) × Lucas de terno (engenharia com IA)", com cards de projeto verificáveis, páginas legais, PDF de uma página e cabeçalhos de segurança, publicado em `*.pages.dev`.

**Architecture:** Astro gera HTML estático a partir de fichas YAML validadas por Zod (PT e EN no mesmo arquivo, o build falha se faltar idioma). Regras puras ficam em `src/lib/` (testadas com Vitest), a apresentação em `src/components/` com CSS próprio por tokens, e há ~3 scripts de cliente pequenos (troca de idioma, vídeos, e-mail). O CI no GitHub Actions roda unitários, build, testes do `dist/`, e2e+axe, Lighthouse, audit e gitleaks, e só a `main` com CI verde é publicada via `wrangler pages deploy`.

**Tech Stack:** Astro (última estável, versão exata), TypeScript strict, Zod (`astro/zod`), Vitest, @playwright/test + @axe-core/playwright, @lhci/cli, ffmpeg (mídia), sharp (já vem com o Astro), GitHub Actions, Cloudflare Pages.

**Spec:** `docs/superpowers/specs/2026-11-22-portfolio-design.md` (aprovado). Obrigatórios junto: `docs/CONFORMIDADE.md`, `docs/GUIA-SKILLS.md`.

---

## 0. Antes do código (exigido pelo Lucas)

### 0.1 Requisitos (rastreados até as tarefas)

| Requisito (origem) | Tarefa |
|---|---|
| Conceito da dupla na primeira tela, metades clicáveis, casual à esquerda (§5.1) | 7 |
| Paleta fixa, cor só em acentos, brilho de recorte por lado (§5.2) | 6, 7 |
| PT `/`, EN `/en/`, `lang`, `hreflang`, troca mantém a seção, build falha sem tradução (§5.3) | 1, 2, 6, 10 |
| Ordem das 8 seções (§5.4) | 8, 9 |
| Ficha de projeto completa, papel obrigatório em equipe, status + "atualizado em" (§5.5) | 2, 4, 8 |
| Saídas de teste como texto real em bloco de terminal (§5.6) | 3, 8 |
| Portfólio vivo: linha com data do build, selo por card, "em construção", `proximos_passos` (§5.7) | 1, 4, 7, 8 |
| PDF de uma página gerado do site (§5.8) | 13 |
| Sem terceiros, sem cookies, fontes locais (§5.9) | 6, 12 |
| Mídia sem metadados/áudio, revisão quadro a quadro (§6, CONFORMIDADE §3) | 5 |
| Vídeos: autoplay só visível e sem reduced-motion, pôster, pausa (§7.3) | 8, 14 |
| Desempenho: AVIF/WebP, vídeo ≤ 2 MB, LCP < 2,0 s, JS < 15 KB (§7.4) | 5, 7, 15 |
| Cabeçalhos, noopener, e-mail anti-robô (§8, CONFORMIDADE §5) | 9, 12 |
| Privacidade e Termos PT/EN com itens LGPD (CONFORMIDADE §1) | 11 |
| Testes da §9 (unit, integração, e2e, axe, segurança, Lighthouse) | 1–3, 12, 14, 15 |
| Portões de tela pronta (§11) | 16 |
| Nenhum número sem origem (regra do Lucas) | 3 |

### 0.2 Riscos

| Risco | Impacto | Mitigação |
|---|---|---|
| **Números do design sem origem no kit** (ver §0.5) | Viola a regra "nenhum número sem origem" | Tarefa 3: cada número vira `evidencia` com `fonte` e um teste confere a fonte. Número sem fonte não entra |
| `kit/` está no `.gitignore` | CI não enxerga mídia nem evidências | Tarefas 3 e 5 copiam para `src/content/evidencias/` e `public/media/` (versionados) |
| Caminho pessoal na evidência (`C:\Users\lucas\nfe-hub`) | Dado pessoal leve no site | Tarefa 3 troca o caminho por `~\nfe-hub`, registrando que só o caminho mudou |
| Astro inlina `<script>` pequenos | Quebra a CSP sem `unsafe-inline` | `vite.build.assetsInlineLimit: 0`, mais teste no `dist/` que proíbe `<script>` sem `src` |
| Recorte das fotos pelo Adobe MCP envia as fotos do Lucas a um serviço externo | Privacidade | Pedir ok explícito antes. Sem ok, usar os recortes provisórios |
| Skills e MCPs de portão ausentes (ver §0.6) | Portões da §11 não podem ser cumpridos como escritos | Lucas decide: instalar ou aceitar o substituto (no fim deste plano) |
| Foto casual com 1024 px de altura | Imagem suave em telas 2x | Capa com altura máxima de 560 px CSS (§12 do design) |
| Build no Cloudflare não tem navegador para gerar o PDF | Build quebra | Deploy pelo GitHub Actions (`wrangler`) depois do CI verde, sem build no Cloudflare |
| Data "atualizado em" calculada em UTC | Build às 23h do dia 30 mostra o mês seguinte | Fuso `America/Sao_Paulo` fixo, com teste (Review Focus) |

### 0.3 Arquitetura (detalhes sobre o §7 do design)

- O design manda as fichas para `src/content/config.ts`. A API atual do Astro usa `src/content.config.ts` com loaders, e é esse o arquivo usado aqui. O esquema mora em `src/lib/schema.ts` para ser testável sem o Astro. Isso detalha o design, não muda nada.
- Fichas: `src/content/projects/<id>.yaml` (loader `glob`). Textos fixos: `src/content/site.yaml` (loader `file`, uma entrada `site`).
- Evidências de terminal: `src/content/evidencias/*.txt`, lidas com `import.meta.glob(..., { query: '?raw', eager: true })`.
- IDs de seção são **os mesmos nas duas línguas**, para a âncora sobreviver à troca: `fundamentals`, `ai`, `workflow`, `stack`, `about`, `contact` (constante `SECTION_IDS`).
- Rotas pareadas: `/` ↔ `/en/`, `/privacidade/` ↔ `/en/privacy/`, `/termos/` ↔ `/en/terms/`.
- PDF: `scripts/build-pdf.mjs` sobe `astro preview` e imprime `/` e `/en/` com Playwright para `dist/lucas-cruz-cv.pdf` e `dist/lucas-cruz-cv-en.pdf`. O design cita `public/`, mas gerar direto no `dist/` evita um segundo build.
- Deploy: job `deploy` em `.github/workflows/ci.yml`, só em push na `main`, depois de todos os jobs, com `cloudflare/wrangler-action` e os segredos `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID`, que ficam no GitHub e nunca no repositório.

### 0.4 Alternativas descartadas (nesta camada; as de stack estão no §4 do design)

| Alternativa | Por que não |
|---|---|
| Integração Git do Cloudflare Pages | Publicaria mesmo com CI vermelho e não tem Playwright para gerar o PDF |
| Arquivos de tradução JSON separados por idioma | Permitiriam esquecer uma chave. Ficha única PT+EN já é a decisão do design |
| Pacotes `@fontsource` | Dependência extra para servir dois `.woff2`. Os arquivos são copiados para `public/fonts/` |
| Atualizar o hash da URL durante a rolagem para lembrar a seção | Polui o histórico. A seção visível é lida só no clique do PT/EN |
| Montar o e-mail via imagem | Inacessível. Ele é montado via JS a partir de partes em `data-*`, com texto legível em `<noscript>` |
| Lista de stack escrita à mão | Pode citar tecnologia que nenhum projeto usa. Um teste exige que cada item apareça em alguma ficha |

### 0.5 Auditoria inicial de números (kit × design)

| Projeto | Número no design | Origem encontrada | Situação |
|---|---|---|---|
| NFE Hub | 79 testes; path traversal; OAuth state adulterado | `kit/evidencias/nfe-hub-pytest.txt` ("79 passed", `test_callback_com_state_adulterado_e_recusado`, `/orders/../users/me`) | ✅ |
| EasyFood | 73 testes, 12 suítes | `kit/evidencias/easyfood-npm-test.txt` ("tests 73", "suites 12") | ✅ |
| EasyFood | 8 ADRs | só `kit/media/easyfood/easyfood-adrs.png` | ⚠️ conferir no print/repositório |
| Analitic Blitz | 98% cobertura | `analitic-blitz-pytest-resumo.txt` ("98%") | ✅ |
| Analitic Blitz | **539 testes** | o arquivo diz **"537 passed, 1 warning, 3 errors"** | ❌ diverge. Precisa de uma saída nova depois da correção da §10 (`ids=` no `test_lixo`) |
| Analitic Blitz | 300 operações, 5 anos, 200 sorteios; mypy estrito | só o print do backtest | ⚠️ conferir |
| Arapuca | 330 ataques, 37 países, 574 testes, 11 ADRs, 28 PRs, equipe de 5 | nenhum `.txt`; prints em `kit/media/arapuca/` | ⚠️ conferir nos prints/repositório |
| Renovação de Apólices | 4 agentes, 58 s | prints `crewai-*.png` | ⚠️ conferir |
| Calculadoras | 0,63 × 0,62 | `calculadoras-lado-a-lado.png` | ⚠️ conferir |

### 0.6 Skills e MCPs da §11 nesta máquina (22/11/2026)

Os comandos `/skills` e `/mcp` não podem ser executados pelo agente. O inventário abaixo vem das skills carregadas na sessão, de `~/.claude/skills`, dos plugins e da configuração de MCP (`~/.claude.json` sem `mcpServers`; sem `.mcp.json` no projeto).

| Fase | Disponível | Falta |
|---|---|---|
| Plano/execução | writing-plans, subagent-driven-development, executing-plans, test-driven-development | — |
| Visual | design-taste-frontend, frontend-design, impeccable | **emil-design-eng** |
| Movimento | — | **animate**, **review-animations** |
| Texto | copywriting | — |
| UX/a11y | — | **web-design-guidelines**, **ui-ux-pro-max** |
| Mídia | media-toolkit, Adobe MCP | — |
| Verificação visual | — | **Chrome DevTools MCP**, **Playwright MCP** (Figma MCP é opcional) |
| Revisão/entrega | requesting-code-review, verification-before-completion, finishing-a-development-branch, strix-pentest; extras: code-review, security-review, simplify | — |
| Economia | — | **Ponytail** (`/ponytail-debt`), **Caveman** — nenhum dos dois está ativo |
| Ferramentas de linha de comando | node 26, npm 11, ffmpeg/ffprobe 9 | **exiftool**, **gh**, **gitleaks** (no CI entram via Action) |

---

## Global Constraints

- Paleta exata: `--bg #0F0F10`, `--text #EDEBE6`, `--muted #8A8A8E`, `--accent-fund #FFC83D`, `--accent-ia #FF5A1F`. Cor só em acentos.
- Mesma tipografia e diagramação nos dois lados; só o acento muda.
- Dependências de runtime/dev: só `astro`, `typescript`, `vitest`, `@playwright/test`, `@axe-core/playwright`, `@lhci/cli` (mais `@astrojs/check` para `astro check`). Qualquer outra pede justificativa no PR. Sem React/Vue/Tailwind/lib de animação/lib de componentes. Versões exatas (`npm i -E`).
- Nenhum script, fonte ou recurso de terceiros no HTML gerado. Sem cookies.
- CSP sem `unsafe-inline` em script. Nenhum `<script>` inline no `dist/`.
- Todo texto visível existe em PT e EN. Nenhum número sem `fonte` (Tarefa 3).
- Vídeos ≤ 2 MB, sem trilha de áudio, `muted loop playsinline preload="none"` com pôster.
- JS total < 15 KB; LCP < 2,0 s em 4G simulado; Lighthouse ≥ 95 nas 4 categorias, mobile e desktop, PT e EN.
- WCAG 2.2 AA; axe sem violações; alvos ≥ 24×24 px; zoom 200% sem rolagem horizontal.
- Commits em Conventional Commits, em português, **sem `Co-Authored-By` nem menção ao Claude**. O trabalho acontece no branch `feat/site-v1`, nunca direto na `main`.
- Textos do site, docs e commits em linguagem normal (Caveman não se aplica).
- URL do site: constante única `SITE_URL` em `astro.config.mjs` (valor confirmado pelo Lucas, ver perguntas no fim).

## Review Focus

1. **JS desligado ou falhando**: o site precisa ser lido inteiro. A troca de idioma leva à raiz da outra língua, o e-mail aparece em `<noscript>` e os vídeos mostram pôster com controles nativos. → teste e2e `funciona sem JavaScript` na Tarefa 14.
2. **Troca de idioma em página legal ou com hash desconhecido**: `/privacidade/` → `/en/privacy/`, e hash fora de `SECTION_IDS` é descartado. → casos em `tests/unit/i18n.test.ts` (Tarefa 1).
3. **Tela de 320 px e zoom 200% nas duas línguas** (texto EN mais longo): sem rolagem horizontal, a dupla continua lado a lado. → teste e2e `sem rolagem horizontal` (Tarefa 14).
4. **Build na virada do mês**: "atualizado em" usa o fuso de São Paulo. → `formatMonthYear(new Date('2026-12-01T02:00:00Z'), 'pt') === 'novembro de 2026'` (Tarefa 1).
5. **Reduced-motion ativado no meio da sessão / vídeo fora da tela**: vídeo pausa e não volta a tocar sozinho. → teste e2e `vídeos respeitam reduced-motion` com `page.emulateMedia` depois do carregamento (Tarefa 14).

---

### Task 1: Projeto Astro + helpers puros de i18n e data

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `src/lib/i18n.ts`, `src/lib/date.ts`
- Test: `tests/unit/i18n.test.ts`, `tests/unit/date.test.ts`

**Interfaces:**
- Produces:
  - `type Lang = 'pt' | 'en'`
  - `SECTION_IDS = ['fundamentals','ai','workflow','stack','about','contact'] as const`, `type SectionId`
  - `ROUTES: Record<'home'|'privacy'|'terms', Record<Lang,string>>` = home `/`·`/en/`; privacy `/privacidade/`·`/en/privacy/`; terms `/termos/`·`/en/terms/`
  - `langFromPath(path: string): Lang`
  - `switchHref(path: string, section: string | null, to: Lang): string`
  - `formatMonthYear(d: Date, lang: Lang): string` (fuso `America/Sao_Paulo`)

- [ ] **Step 1:** `git switch -c feat/site-v1`. Criar o projeto Astro mínimo (template vazio, TS strict) com `npm i -E`. Configurar `astro.config.mjs` com `site: SITE_URL`, `trailingSlash: 'always'`, `build.inlineStylesheets: 'never'`, `vite.build.assetsInlineLimit: 0`. Scripts: `dev`, `build`, `preview`, `check` (`astro check`), `test` (`vitest run --project unit`), `test:dist`, `e2e`.
- [ ] **Step 2: Testes que falham**

```ts
// tests/unit/i18n.test.ts
expect(langFromPath('/en/')).toBe('en'); expect(langFromPath('/privacidade/')).toBe('pt');
expect(switchHref('/', 'about', 'en')).toBe('/en/#about');
expect(switchHref('/en/', 'ai', 'pt')).toBe('/#ai');
expect(switchHref('/privacidade/', null, 'en')).toBe('/en/privacy/');
expect(switchHref('/en/terms/', null, 'pt')).toBe('/termos/');
expect(switchHref('/', 'hacked"><x', 'en')).toBe('/en/');      // hash desconhecido descartado
expect(switchHref('/rota-inexistente/', 'about', 'en')).toBe('/en/');
// tests/unit/date.test.ts
expect(formatMonthYear(new Date('2026-11-15T12:00:00Z'), 'pt')).toBe('novembro de 2026');
expect(formatMonthYear(new Date('2026-11-15T12:00:00Z'), 'en')).toBe('November 2026');
expect(formatMonthYear(new Date('2026-12-01T02:00:00Z'), 'pt')).toBe('novembro de 2026');
```
- [ ] **Step 3:** `npm test` → FAIL (módulos não existem).
- [ ] **Step 4:** Implementar com `Intl.DateTimeFormat(lang === 'pt' ? 'pt-BR' : 'en', { month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' })`. `switchHref` só aceita `section` presente em `SECTION_IDS` e só na rota `home`.
- [ ] **Step 5:** `npm test` → PASS. `npm run check` → 0 erros.
- [ ] **Step 6:** Commit `chore: projeto Astro e helpers de i18n e data`.

### Task 2: Esquemas Zod das fichas e do site

**Files:**
- Create: `src/lib/schema.ts`, `src/content.config.ts`
- Test: `tests/unit/schema.test.ts`

**Interfaces:**
- Consumes: `Lang` (Task 1).
- Produces: `l10n` (`{ pt: string; en: string }`, ambos `trim().min(1)`, `.strict()`), `projectSchema`, `siteSchema`, tipos `Project`, `Site`. Coleções `projects` (glob `src/content/projects/*.yaml`) e `site` (file `src/content/site.yaml`, entrada `site`).

Campos de `projectSchema` (união discriminada por `side`):
- comuns: `order: int`, `title: l10n`, `problem: l10n`, `stack: string[] (min 1)`, `media: Media[] (min 1)`, `team?: { size: int ≥ 2, role: l10n }`, `evidence: { value: string, label: l10n, source: string }[]`, `terminal?: { file: string, title: l10n }`, `repo: { url: url } | { private: true }`, `demo?: url`, `status: 'concluido'|'em-evolucao'|'em-desenvolvimento'`, `updated: /^\d{4}-(0[1-9]|1[0-2])$/`, `nextSteps?: l10n[] (1–3)`
- `side: 'fund'` exige `proves: l10n` e aceita `anchor?: boolean`; `side: 'ia'` exige `aiDid: l10n` e `iDecided: l10n`
- `Media`: `{ kind: 'image', src, alt: l10n }` | `{ kind: 'video', src, poster, alt: l10n, description: l10n }`

`siteSchema`: `name: string` (= "Lucas Cruz"), `tagline: l10n`, `livingNote: l10n` (com o marcador `{date}`), `sections: Record<SectionId, { title: l10n, intro?: l10n }>`, `studyingNow: l10n[] (min 1)`, `workflow: { title: l10n, body: l10n }[] (length 3)`, `workflowFooter: l10n`, `stackGroups: { label: l10n, items: string[] }[]`, `about: l10n[]`, `contact: { emailUser, emailDomain, linkedin: url, github: url }`, `statusLabels: Record<status, l10n>`.

- [ ] **Step 1: Testes que falham** (construir a ficha válida mínima num helper `validFund()`/`validIa()`)

```ts
expect(projectSchema.safeParse(validIa()).success).toBe(true);
expect(projectSchema.safeParse({ ...validIa(), title: { pt: 'X' } }).success).toBe(false);          // sem EN
expect(projectSchema.safeParse({ ...validIa(), title: { pt: 'X', en: '  ' } }).success).toBe(false); // EN vazio
expect(projectSchema.safeParse({ ...validIa(), aiDid: undefined }).success).toBe(false);
expect(projectSchema.safeParse({ ...validFund(), proves: undefined }).success).toBe(false);
expect(projectSchema.safeParse({ ...validIa(), team: { size: 5 } }).success).toBe(false);            // equipe sem papel
expect(projectSchema.safeParse({ ...validIa(), media: [{ kind: 'video', src: '/media/x.mp4', alt: L }] }).success).toBe(false); // sem pôster/descrição
expect(projectSchema.safeParse({ ...validIa(), updated: '2026-13' }).success).toBe(false);
expect(projectSchema.safeParse({ ...validIa(), nextSteps: [L, L, L, L] }).success).toBe(false);
```
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implementar `src/lib/schema.ts` (`import { z } from 'astro/zod'`) e `src/content.config.ts` usando esses esquemas.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `feat: esquemas de conteúdo com PT e EN obrigatórios`.

### Task 3: Evidências versionadas e regra "nenhum número sem origem"

**Files:**
- Create: `src/content/evidencias/{nfe-hub-pytest,nfe-hub-estrutura,easyfood-npm-test,analitic-blitz-pytest-resumo}.txt`, `docs/EVIDENCIAS.md`
- Test: `tests/unit/evidence.test.ts`

**Interfaces:**
- Produces: a convenção de `evidence[].source`, que só aceita: `evidencias/<arquivo>.txt` (o arquivo existe e **contém `value` literalmente**), `media/<projeto>/<arquivo>.png` (o arquivo existe em `public/` e aparece em `docs/EVIDENCIAS.md` com o trecho conferido) ou `https://github.com/...` (aparece em `docs/EVIDENCIAS.md`).

- [ ] **Step 1:** Copiar `kit/evidencias/*.txt` sem alterações, exceto `C:\Users\lucas\` → `~\` (nota no topo de `docs/EVIDENCIAS.md`).
- [ ] **Step 2:** Abrir cada print citado em §0.5 (Read da imagem) e registrar em `docs/EVIDENCIAS.md` uma tabela `projeto | valor | fonte | trecho visto`. Valor não confirmado vai para "pendente — Lucas" e **não entra em ficha**.
- [ ] **Step 3: Teste que falha** — percorre todos os `src/content/projects/*.yaml`:

```ts
for (const e of allEvidence()) {
  if (e.source.startsWith('evidencias/')) expect(read(`src/content/${e.source}`)).toContain(e.value);
  else if (e.source.startsWith('media/')) { expect(exists(`public/${e.source}`)).toBe(true); expect(evidenciasMd).toContain(e.source); }
  else { expect(e.source).toMatch(/^https:\/\/github\.com\//); expect(evidenciasMd).toContain(e.source); }
}
// regra extra: dígito em qualquer texto PT/EN de ficha exige evidência com o mesmo número
for (const n of numbersInProse(project)) expect(project.evidence.map(e => e.value).join(' ')).toContain(n);
```
Exceções de `numbersInProse`: anos de `updated` e nomes de tecnologia (`Java 17`, `BCrypt`), listadas em `ALLOWED_TOKENS` no teste.
- [ ] **Step 4:** `npm test` → FAIL até a Tarefa 4 criar as fichas (rodar de novo lá). Por agora, verificar com uma ficha falsa no fixture que o teste reprova `value: '539'` contra o resumo do Analitic Blitz.
- [ ] **Step 5:** Commit `test: origem obrigatória para todo número do site`.

### Task 4: Fichas e textos PT/EN

**Files:**
- Create: `src/content/projects/{banco-java,calculadoras,arapuca,easyfood,analitic-blitz,nfe-hub,renovacao-apolices}.yaml`, `src/content/site.yaml`
- Test: `tests/unit/content.test.ts` (mais o `evidence.test.ts` da Task 3)

**Interfaces:**
- Consumes: `projectSchema`, `siteSchema` (Task 2); convenção de `source` (Task 3); caminhos de mídia (Task 5, em `/media/<projeto>/...`).

- [ ] **Step 1:** Usar a skill **copywriting** para redigir. Os fatos vêm só do §5.4, §6 do design e de `docs/EVIDENCIAS.md`. Tom: frases curtas, sem superlativos, sem "não é X, é Y". Fixos: nome "Lucas Cruz"; contato `lucascruzcorp` / `gmail.com`; LinkedIn e GitHub do §5.4; Arapuca com `team.size: 5` e papel do Lucas (**pergunta ao Lucas**: qual foi o papel?); NFE Hub `repo: { private: true }`, `status: em-desenvolvimento`; Analitic Blitz com repositório público; Banco Java `anchor: true`; `order` segue o §5.4.
- [ ] **Step 2: Teste que falha**

```ts
expect(projects.filter(p => p.side === 'fund').map(p => p.id)).toEqual(['banco-java', 'calculadoras']);
expect(projects.filter(p => p.side === 'ia').map(p => p.id)).toEqual(['arapuca','easyfood','analitic-blitz','nfe-hub','renovacao-apolices']);
// stack: cada item listado na seção Stack aparece em ao menos uma ficha
for (const item of site.stackGroups.flatMap(g => g.items)) expect(allProjectStacks).toContain(item);
```
- [ ] **Step 3:** Escrever as fichas e o `site.yaml` → `npm test` → PASS (incluindo `evidence.test.ts`).
- [ ] **Step 4:** Revisão do Lucas sobre os textos PT/EN (marcar no PR).
- [ ] **Step 5:** Commit `content: fichas dos projetos e textos do site em PT e EN`.

### Task 5: Mídia otimizada e conferida

**Files:**
- Create: `scripts/prepare-media.sh`, `public/media/<projeto>/*` (vídeos + pôsteres `.webp` + prints `.webp`), `src/assets/dupla/{casual,terno}.png`
- Test: `tests/unit/media.test.ts`

- [ ] **Step 1:** O script copia `kit/media/<projeto>/` → `public/media/<projeto>/`. Vídeos: `ffmpeg -i in -map 0:v:0 -an -map_metadata -1 -c:v libx264 -crf 28 -preset slow -movflags +faststart -pix_fmt yuv420p out.mp4`. Pôster: `ffmpeg -ss 1 -frames:v 1 ... poster.webp`. Prints: `.webp` sem metadados (`-map_metadata -1`). Banco Java usa `banco-java-cadastro-deposito.mp4` no card (34 s; o completo tem 2:15, longo demais para loop).
- [ ] **Step 2:** Recorte da dupla: **pedir ok ao Lucas** para enviar as fotos ao Adobe MCP (`image_remove_background`). Com ok, refinar os recortes. Sem ok, usar `*-recorte-provisorio.png`. Salvar em `src/assets/dupla/`.
- [ ] **Step 3: Teste que falha**

```ts
for (const v of videos) { expect(size(v)).toBeLessThanOrEqual(2 * 1024 * 1024); expect(ffprobeStreams(v)).not.toContain('audio'); expect(ffprobeTags(v)).toEqual({}) /* sem creation_time etc. */ }
for (const img of images) { const m = await sharp(img).metadata(); expect(m.exif).toBeUndefined(); expect(m.xmp).toBeUndefined(); }
for (const m of allProjectMedia()) { expect(exists(`public${m.src}`)).toBe(true); if (m.kind === 'video') expect(exists(`public${m.poster}`)).toBe(true); }
```
- [ ] **Step 4:** Rodar o script → `npm test` → PASS.
- [ ] **Step 5 (CONFORMIDADE §3, obrigatório):** Gerar folhas de contato com 1 quadro/s (`ffmpeg -vf fps=1,scale=320:-1,tile=6x6`) no scratchpad, inspecionar cada uma (CPF, nomes, e-mails, tokens, saldos, abas, notificações) e listar o resultado no PR. O Lucas confirma vídeo a vídeo.
- [ ] **Step 6:** Commit `feat: mídia dos projetos sem metadados nem áudio`.

### Task 6: Fundação visual — tokens, fontes, layout base

**Files:**
- Create: `src/styles/tokens.css`, `src/styles/global.css`, `public/fonts/*.woff2`, `src/layouts/Base.astro`, `src/components/{SkipLink,Header,LangSwitch,Footer}.astro`, `public/robots.txt`
- Test: `tests/dist/base.test.ts` (projeto Vitest `dist`, lê `dist/` depois de `npm run build`)

**Interfaces:**
- Consumes: `Lang`, `ROUTES`, `switchHref` (Task 1), `Site` (Task 2).
- Produces: `<Base lang title description route>`, em que `route` é uma chave de `ROUTES`. O `LangSwitch` renderiza `<a href={switchHref(path,null,other)} hreflang lang data-lang-switch>`, com nome acessível "English version" / "Versão em português".

- [ ] **Step 1:** Carregar **design-taste-frontend** (autoridade) e **frontend-design**. Escolher uma família sans variável e uma mono (licença OFL), em subconjunto latino `.woff2`, `font-display: swap`, total ≤ 120 KB, e registrar a escolha e a licença em `public/fonts/LICENSES.md`. Tokens: a paleta das Global Constraints, mais escala tipográfica e espaçamento.
- [ ] **Step 2: Teste que falha**

```ts
for (const [file, lang, alt] of [['index.html','pt-BR','/en/'], ['en/index.html','en','/']]) {
  const $ = load(file);
  expect($('html').attr('lang')).toBe(lang);
  expect($('link[rel=alternate][hreflang=pt-BR]').attr('href')).toMatch(/\/$/);
  expect($('link[rel=alternate][hreflang=en]').attr('href')).toMatch(/\/en\/$/);
  expect($('link[rel=alternate][hreflang=x-default]').length).toBe(1);
  expect($('a.skip-link').attr('href')).toBe('#main');
  expect($('header').length + $('main#main').length + $('footer').length).toBe(3);
  expect($('h1').length).toBe(1);
  expect($('meta[name=description]').attr('content')).toBeTruthy();
}
```
`load()`/`$()`/`text()`/`ids()` ficam em `tests/dist/html.ts`: um helper mínimo com regex sobre o HTML gerado (que é previsível), sem dependência nova de parser. Todas as tarefas `tests/dist/*` usam esse helper.
- [ ] **Step 3:** `npm run build && npm run test:dist` → FAIL.
- [ ] **Step 4:** Implementar o `Base` e as páginas `index.astro`/`en/index.astro`, ainda vazias, com o `Base`.
- [ ] **Step 5:** `npm run build && npm run test:dist` → PASS.
- [ ] **Step 6:** Commit `feat: layout base bilíngue com tokens e fontes locais`.

### Task 7: Capa (dupla) + linha "portfólio vivo"

**Files:**
- Create: `src/components/Hero.astro`
- Test: `tests/dist/hero.test.ts`

**Interfaces:**
- Consumes: `Site.name/tagline/livingNote`, `formatMonthYear(new Date(), lang)` (Task 1), `src/assets/dupla/*` (Task 5).

- [ ] **Step 1:** design-taste-frontend para a composição: duas figuras de costas, casual à esquerda, altura máxima de 560 px CSS, lado a lado também em 320 px. Cada metade é um `<a href="#fundamentals">` / `<a href="#ai">` com rótulo visível ("Fundamentos" / "Engenharia com IA"). O brilho é `filter: drop-shadow` na cor do lado e cresce em `:hover`/`:focus-visible`, com transição curta, desligada sob `prefers-reduced-motion`. `<Picture formats={['avif','webp']} widths={[320,480,640,774]}>` (terno até 1086), `fetchpriority="high"` só nessas duas imagens, `alt` descritivo PT/EN.
- [ ] **Step 2: Teste que falha**

```ts
expect($('.hero a').map(href)).toEqual(['#fundamentals', '#ai']);          // ordem: casual → terno
expect($('.hero img[fetchpriority=high]').length).toBe(2);
expect($('img[fetchpriority=high]').length).toBe(2);                          // nenhuma outra
expect($('.hero img').every(i => i.alt.length > 10)).toBe(true);
expect(text('.living-note')).toContain(formatMonthYear(new Date(), 'pt'));   // data do build
```
- [ ] **Step 3:** FAIL → implementar → `npm run build && npm run test:dist` → PASS.
- [ ] **Step 4:** Commit `feat: capa com a dupla clicável e nota de portfólio vivo`.

### Task 8: Cards de projeto, terminal, vídeo e seções Fundamentos/IA

**Files:**
- Create: `src/components/{ProjectCard,Terminal,ProjectMedia,StatusBadge,BuildingCard,Section}.astro`, `src/scripts/videos.ts`
- Test: `tests/dist/projects.test.ts`

**Interfaces:**
- Consumes: `Project`, `Site.statusLabels/studyingNow`, `formatMonthYear` (aplicado a `updated`).
- Produces: `<Section id={SectionId} accent="fund"|"ia">`; seletor `video[data-autoplay]` para os e2e.

- [ ] **Step 1:** O card mostra, nesta ordem: título, problema, mídia, stack, papel (se `team`), "o que a IA fez / o que eu decidi" **ou** "o que este projeto prova", evidência, terminal (se houver), links, selo de status + "atualizado em <mês/ano>" e `nextSteps` discretos. O selo "repositório privado" aparece quando `repo.private`. Os cards não são idênticos: o card âncora (Banco Java) é maior. O `Terminal` é `<pre tabindex="0" role="region" aria-label={title}>` com rolagem, só texto. Links externos com `rel="noopener noreferrer"`.
- [ ] **Step 2:** `videos.ts`: `IntersectionObserver` toca e pausa, `matchMedia('(prefers-reduced-motion: reduce)')` com listener `change` e um botão de pausa/play acessível por vídeo (`aria-pressed`). Sem JS, `<video controls poster>`. O comportamento é provado nos e2e da Task 14, sem teste unitário (lógica de 3 linhas, ponytail).
- [ ] **Step 3: Teste que falha**

```ts
expect(ids('section')).toEqual(expect.arrayContaining(['fundamentals', 'ai']));
expect(cardsIn('#fundamentals').map(c => c.id)).toEqual(['banco-java', 'calculadoras']);
expect($('#fundamentals .building-card').length).toBe(1);
expect($('#nfe-hub').text()).toContain('repositório privado');
expect($('#arapuca').text()).toContain(arapuca.team.role.pt);
expect($('video').every(v => v.muted && v.loop && v.playsinline && v.preload === 'none' && v.poster)).toBe(true);
expect($('video[autoplay]').length).toBe(0);                 // autoplay só via JS
expect($('pre.terminal').length).toBeGreaterThanOrEqual(3);
```
- [ ] **Step 4:** FAIL → implementar → PASS.
- [ ] **Step 5:** Commit `feat: cards de projeto com evidência, terminal e vídeos`.

### Task 9: Seções Como trabalho, Stack, Sobre, Contato + e-mail anti-robô

**Files:**
- Create: `src/components/{Workflow,Stack,About,Contact}.astro`, `src/lib/email.ts`, `src/scripts/email.ts`
- Test: `tests/unit/email.test.ts`, `tests/dist/sections.test.ts`

**Interfaces:**
- Produces: `buildMailto(user: string, domain: string): string`

- [ ] **Step 1: Testes que falham**

```ts
expect(buildMailto('lucascruzcorp', 'gmail.com')).toBe('mailto:lucascruzcorp@gmail.com');
expect(() => buildMailto('a b', 'gmail.com')).toThrow();
// dist
expect(ids('main > section')).toEqual(['fundamentals','ai','workflow','stack','about','contact']);  // ordem §5.4
expect(html('index.html')).not.toContain('lucascruzcorp@gmail.com');      // sem e-mail literal no HTML
expect($('#workflow ol > li').length).toBe(3);
expect($('#workflow img').length).toBe(0);                                 // sem parede de logos
expect($('#contact a[href="https://www.linkedin.com/in/lucas-alves-cruz/"]').attr('rel')).toBe('noopener noreferrer');
expect($('#contact a[href$="lucas-cruz-cv.pdf"]').length).toBe(1);         // EN: lucas-cruz-cv-en.pdf
```
- [ ] **Step 2:** FAIL → implementar. O e-mail vem de `data-user`/`data-domain` no link; o script troca o `href` e o texto, e o `<noscript>` mostra "lucascruzcorp [arroba] gmail.com". Stack sem barras de nível. O passo 3 do fluxo aponta para `#fundamentals`.
- [ ] **Step 3:** `npm test && npm run build && npm run test:dist` → PASS.
- [ ] **Step 4:** Commit `feat: seções de método, stack, sobre e contato`.

### Task 10: Troca PT/EN mantendo a seção

**Files:**
- Create: `src/scripts/lang-switch.ts`
- Test: `tests/e2e/lang.spec.ts`

**Interfaces:**
- Consumes: `switchHref`, `SECTION_IDS` (Task 1), `a[data-lang-switch]` (Task 6).

- [ ] **Step 1:** Configurar Playwright (`playwright.config.ts`, `webServer: npm run preview`, projetos Chromium e Firefox, mais um mobile, o Pixel 7).
- [ ] **Step 2: Teste que falha**

```ts
await page.goto('/'); await page.locator('#about').scrollIntoViewIfNeeded();
await page.getByRole('link', { name: 'English version' }).click();
await expect(page).toHaveURL(/\/en\/#about$/); await expect(page.locator('#about')).toBeInViewport();
await page.goto('/en/privacy/'); await page.getByRole('link', { name: 'Versão em português' }).click();
await expect(page).toHaveURL(/\/privacidade\/$/);
```
- [ ] **Step 3:** FAIL → implementar. No clique, a seção visível é a última de `SECTION_IDS` cujo topo está acima de 40% da viewport, e o href vira `switchHref(location.pathname, id, to)`.
- [ ] **Step 4:** `npm run build && npm run e2e -- lang` → PASS.
- [ ] **Step 5:** Commit `feat: troca de idioma mantém a seção atual`.

### Task 11: Privacidade e Termos (PT/EN)

**Files:**
- Create: `src/pages/privacidade.astro`, `src/pages/en/privacy.astro`, `src/pages/termos.astro`, `src/pages/en/terms.astro`
- Test: `tests/dist/legal.test.ts`

- [ ] **Step 1: Teste que falha**

```ts
for (const f of ['privacidade/index.html', 'en/privacy/index.html']) {
  const t = text(f);
  for (const must of LEGAL_MUST[langOf(f)]) expect(t).toContain(must);
}
// LEGAL_MUST.pt = ['Lucas Cruz', 'art. 7º', 'art. 18', 'Cloudflare', 'não usa cookies', 'Última atualização']
// LEGAL_MUST.en = ['Lucas Cruz', 'Art. 7', 'Art. 18', 'Cloudflare', 'does not use', 'Last updated']
for (const page of allHtml()) { expect(page).toMatch(/href="\/(en\/)?(privacidade|privacy)\/"/); expect(page).toMatch(/href="\/(en\/)?(termos|terms)\/"/); }
```
- [ ] **Step 2:** FAIL → escrever com **copywriting**. Conteúdo da política: controlador e contato (e-mail com o mesmo mecanismo anti-robô); o site não coleta dados; a Cloudflare (hospedagem) pode registrar IP em logs técnicos; e-mail recebido por `mailto` é usado só para responder (art. 7º, V/IX conforme o caso); retenção; direitos do art. 18 e como pedir; sem cookies. Termos: autoria, projetos de equipe creditados, links externos.
- [ ] **Step 3:** PASS.
- [ ] **Step 4:** Commit `feat: páginas de privacidade e termos em PT e EN`. Revisão humana do Lucas é obrigatória (CONFORMIDADE §6).

### Task 12: Cabeçalhos de segurança e testes de superfície

**Files:**
- Create: `public/_headers`
- Test: `tests/unit/headers.test.ts`, `tests/dist/security.test.ts`

- [ ] **Step 1: Testes que falham**

```ts
// headers
expect(h['/*']['Content-Security-Policy']).toBe("default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; media-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests");
expect(h['/*']['Strict-Transport-Security']).toBe('max-age=63072000; includeSubDomains; preload');
expect(h['/*']['X-Content-Type-Options']).toBe('nosniff');
expect(h['/*']['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
expect(h['/*']['Permissions-Policy']).toBe('camera=(), microphone=(), geolocation=()');
expect(h['/_astro/*']['Cache-Control']).toBe('public, max-age=31536000, immutable');
// dist, todas as páginas
expect(page).not.toMatch(/<script(?![^>]*\bsrc=)[^>]*>/);                   // sem script inline
expect(page).not.toMatch(/<style[\s>]|\sstyle="/);                           // compatível com style-src 'self'
expect(page).not.toMatch(/(src|href)="(https?:)?\/\/(?!github\.com|www\.linkedin\.com)/);  // nada externo além dos links de perfil
for (const a of externalLinks(page)) expect(a.rel).toBe('noopener noreferrer');
expect(totalJsBytes('dist/_astro')).toBeLessThan(15 * 1024);
```
- [ ] **Step 2:** FAIL → criar o `_headers` e corrigir o que o `dist` acusar.
- [ ] **Step 3:** `npm test && npm run build && npm run test:dist` → PASS.
- [ ] **Step 4:** Commit `feat: cabeçalhos de segurança e testes de superfície`.

### Task 13: PDF de uma página

**Files:**
- Create: `src/styles/print.css`, `scripts/build-pdf.mjs`
- Modify: `package.json` (`"build": "astro build && node scripts/build-pdf.mjs"`)
- Test: `tests/dist/pdf.test.ts`

- [ ] **Step 1: Teste que falha**

```ts
for (const f of ['dist/lucas-cruz-cv.pdf', 'dist/lucas-cruz-cv-en.pdf']) {
  const buf = readFileSync(f);
  expect((buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length).toBe(1);
}
```
- [ ] **Step 2:** FAIL → `print.css` (`@media print`): esconde capa, vídeos, terminal e navegação; mostra nome, posicionamento, projetos (título + problema + stack + 1 evidência), sobre e contato com o e-mail em texto. O script usa `page.emulateMedia({ media: 'print' })` e `page.pdf({ format: 'A4', printBackground: false })`.
- [ ] **Step 3:** `npm run build && npm run test:dist` → PASS. Abrir os dois PDFs e conferir visualmente.
- [ ] **Step 4:** Commit `feat: PDF de uma página gerado do próprio site`.

### Task 14: Suíte e2e completa + axe

**Files:**
- Create: `tests/e2e/{navigation,keyboard,a11y,video,nojs,responsive}.spec.ts`

- [ ] **Step 1: Testes** (rodam em PT e EN via `for (const base of ['/', '/en/'])`)

```ts
// navigation: metades da capa
await page.getByRole('link', { name: /Fundamentos|Fundamentals/ }).first().click(); await expect(page.locator('#fundamentals')).toBeInViewport();
// navigation: todos os links internos respondem 200 (request.get em cada href same-origin)
// keyboard: 1º Tab foca o skip link; Enter move o foco para #main; Tab percorre tudo sem armadilha; foco tem outline visível (getComputedStyle outlineStyle !== 'none')
// a11y
expect((await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations).toEqual([]);
// video: emulateMedia({reducedMotion:'reduce'}) antes e DEPOIS do load → todo video.paused === true; botão de play presente
// video: sem reduced-motion, vídeo fora da tela fica pausado; rolado até ele, toca
// nojs (javaScriptEnabled:false): conteúdo das 6 seções visível; link de idioma vai para '/en/'; <noscript> com o e-mail visível
// responsive: viewports 320×640 e 640×800 (= 1280 a 200%): document.documentElement.scrollWidth <= clientWidth
```
- [ ] **Step 2:** `npm run build && npm run e2e` → corrigir o que falhar (usar **superpowers:systematic-debugging**) → PASS em Chromium, Firefox e mobile.
- [ ] **Step 3:** Commit `test: e2e de navegação, teclado, acessibilidade e vídeo`.

### Task 15: CI, Lighthouse, Dependabot e deploy

**Files:**
- Create: `.github/workflows/ci.yml`, `.github/dependabot.yml`, `lighthouserc.cjs`, `lighthouserc.desktop.cjs`, `.nvmrc` (`24`)

- [ ] **Step 1:** `ci.yml` (Node 24 LTS, actions fixadas por SHA). Jobs: `check` (`npm ci`, `npm run check`, `npm test`, `npm audit --audit-level=high`), `build` (build + `test:dist`, upload do `dist`), `e2e` (Playwright com browsers), `lighthouse` (`lhci autorun` mobile e desktop), `gitleaks` (`gitleaks/gitleaks-action`). `deploy` com `needs:` de todos, `if: github.ref == 'refs/heads/main' && github.event_name == 'push'`, `wrangler pages deploy dist --project-name=<nome>`.
- [ ] **Step 2:** `lighthouserc`: URLs `/`, `/en/`, `/privacidade/`, `/en/privacy/`. Asserções: `categories:performance|accessibility|best-practices|seo ≥ 0.95`, `largest-contentful-paint ≤ 2000`, `resource-summary:script:size ≤ 15360`, `errors-in-console = 0`.
- [ ] **Step 3:** `dependabot.yml`: `npm` e `github-actions`, semanal.
- [ ] **Step 4:** Rodar `npx lhci autorun` local nas duas configs → todas as asserções verdes.
- [ ] **Step 5:** Commit `ci: testes, Lighthouse, auditoria, gitleaks e deploy da main`. Lucas, no GitHub: ativar secret scanning + push protection, cadastrar os 2 segredos da Cloudflare e criar o projeto Pages.

### Task 16: Portões de "tela pronta" e entrega

Sem código novo; cada achado vira correção com teste e commit próprio.

- [ ] **Step 1:** **impeccable** (audit/critique) em `/` e `/en/` → sem problemas graves. Refinar detalhes com **emil-design-eng** se instalada; se não, com impeccable (polish).
- [ ] **Step 2:** **web-design-guidelines** sem pendências, nas duas línguas (ou o substituto aceito pelo Lucas, ver perguntas). `ui-ux-pro-max` só como checklist de UX, se instalada.
- [ ] **Step 3:** Animações (hover da dupla, vídeo) revisadas com **review-animations**, ou com a seção de motion do impeccable se ela faltar.
- [ ] **Step 4:** **Chrome DevTools MCP**: console limpo, rede sem domínio externo, Lighthouse ≥ 95 nas 4 categorias, mobile e desktop, PT e EN. **Playwright MCP**: screenshots 320/768/1280/1920 nas duas línguas, anexados ao PR.
- [ ] **Step 5:** Teste com NVDA na home e num card (Lucas, ou roteiro passo a passo enviado a ele).
- [ ] **Step 6:** `/ponytail-debt` (se o Ponytail estiver instalado) → nenhum item que seja requisito.
- [ ] **Step 7:** **superpowers:requesting-code-review** + **security-review** no branch. **superpowers:verification-before-completion** (rodar tudo de novo e colar as saídas). Checklist do CONFORMIDADE marcado item a item no PR.
- [ ] **Step 8:** **superpowers:finishing-a-development-branch** → PR sem atribuição ao Claude → merge → deploy.
- [ ] **Step 9:** Depois de publicado: **strix-pentest** contra a URL `*.pages.dev` (com autorização do Lucas, alvo = o próprio site) e securityheaders.com nota ≥ A.
- [ ] **Step 10:** Revisão crítica com notas 0–10 (arquitetura, segurança, escalabilidade) no PR e no chat. Lembrete: o link só é divulgado depois da §10 do design.

---

## Perguntas abertas para o Lucas (bloqueiam tarefas específicas)

1. **Analitic Blitz**: o kit diz 537 passed + 3 errors; o design diz 539. Você roda de novo depois da correção do `test_lixo` e atualiza `kit/evidencias/`? Até lá o card mostra só o que o arquivo prova. (Tarefas 3 e 4)
2. **Arapuca**: qual foi seu papel na equipe de 5? E o link do repositório que comprova 574 testes, 11 ADRs e 28 PRs? (Tarefas 3 e 4)
3. **Nome do projeto no Cloudflare Pages** (define `SITE_URL`, ex.: `lucas-cruz.pages.dev`). (Tarefas 1 e 15)
4. **Adobe MCP**: posso enviar as fotos da dupla para refinar o recorte? (Tarefa 5)
5. **Skills e MCPs ausentes** (§0.6): instalar antes de começar, ou aceitar os substitutos (impeccable no lugar de emil/animate/review-animations/web-design-guidelines; Playwright e Lighthouse via npm no lugar dos MCPs)?
