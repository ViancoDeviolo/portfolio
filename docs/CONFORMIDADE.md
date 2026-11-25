# Conformidade — LGPD, acessibilidade e segurança

> Registro obrigatório para o Claude Code. Fica em `docs/CONFORMIDADE.md` no repositório.
> Nenhuma entrega é considerada pronta com item **[obrigatório]** pendente.
> Não é parecer jurídico: é a prática recomendada para um site pessoal estático. Em caso de dúvida sobre um ponto legal, consultar um profissional.

## Decisão de base (reduz 80% do trabalho de LGPD)

- **Sem rastreamento de terceiros**: sem Google Analytics, Meta Pixel, Hotjar, fontes do Google carregadas do servidor deles ou embeds do YouTube.
  → Com isso o site **não usa cookies não essenciais e não precisa de banner de cookies**.
- Se quiser métricas de visita: usar uma ferramenta **sem cookies e sem dados pessoais** (ex.: Vercel Web Analytics ou Plausible), declarada na política de privacidade.
- **Contato preferencialmente por `mailto:` + LinkedIn**, sem formulário. Formulário só se houver motivo — ver seção 2.

---

## 1. Páginas legais (PT e EN)

- [x] **[obrigatório] Política de Privacidade** (`/privacidade`, `/en/privacy`) — `tests/dist/legal.test.ts` (itens obrigatórios PT/EN); texto revisado pelo Lucas em 2026-11-23
  - quem é o controlador: Lucas Cruz, contato lucascruzcorp@gmail.com
  - quais dados são tratados (se nenhum: dizer isso explicitamente)
  - finalidade e base legal (art. 7º LGPD) de cada dado
  - por quanto tempo é guardado e como é apagado
  - com quem é compartilhado (hospedagem, provedor de formulário, analytics)
  - direitos do titular (art. 18): acesso, correção, eliminação, revogação do consentimento — e como pedir
  - data da última atualização
- [x] **Aviso de cookies**: só se algum cookie não essencial for usado. Se não usar, a política diz "este site não usa cookies de rastreamento". — a política diz que o site não usa cookies (`src/pages/privacidade.astro`); sem banner, nada a configurar
- [x] **Termos de uso / aviso legal** (curto): conteúdo do portfólio é do autor; projetos de equipe creditados; links externos sem responsabilidade pelo conteúdo de terceiros. — `tests/dist/legal.test.ts`; revisado pelo Lucas
- [x] Links para essas páginas no rodapé de todas as páginas, nos dois idiomas. — `tests/dist/legal.test.ts` ("toda página linka privacidade e termos")

## 2. Formulário de contato (só se existir)

> Não se aplica: o site não tem formulário (contato por `mailto:` + LinkedIn), então os itens abaixo ficam sem marcar.

- [ ] **[obrigatório]** Coletar o mínimo: nome, e-mail, mensagem. Nada de telefone ou CPF.
- [ ] **[obrigatório]** Texto curto ao lado do botão dizendo a finalidade ("usarei seu e-mail só para responder a esta mensagem") + link para a política.
- [ ] Caixa de consentimento **não pré-marcada**, se a base legal for consentimento.
- [ ] Provedor do formulário declarado na política; dados não ficam guardados no site.
- [ ] Anti-spam sem rastreamento: campo honeypot + limite de envios. Evitar reCAPTCHA (envia dados ao Google); se precisar, Cloudflare Turnstile.
- [ ] Validação no cliente **e** no servidor/provedor; mensagens de erro acessíveis (`aria-live`).

## 3. Mídia: fotos e vídeos dos projetos

- [x] **[obrigatório] Remover metadados EXIF das fotos** (podem conter GPS da sua casa e modelo do celular). Verificar com `exiftool` antes de publicar. — `tests/unit/media.test.ts` confere ausência de EXIF/XMP com sharp, sem exiftool; vídeos com `-map_metadata -1`
- [x] **[obrigatório] Revisar cada gravação de tela quadro a quadro** antes de publicar: — Lucas viu os 6 vídeos publicados e as prévias dos borrões e aprovou em 2026-11-22; contact sheets inspecionadas na Task 5; borrões em `scripts/prepare-media.sh`
  - NFE Hub: CPF/CNPJ, nomes e endereços de clientes da loja, chaves de NF-e, certificados → borrar ou usar dados fictícios
  - Analitic Blitz: saldo, número de conta, chaves de API da Binance/XP
  - Arapuca / EasyFood / qualquer um: tokens, `.env`, URLs internas, abas abertas, notificações
- [x] Vídeos sem trilha de áudio (evita gravar conversa ou notificação por engano). — `tests/unit/media.test.ts` ("sem áudio")
- [x] Se aparecer colega de equipe (foto/nome), ter o ok da pessoa. — o handle "ViancoDeviolo" no print easyfood-adrs é do próprio Lucas (confirmado em 2026-11-22); trechos do Arapuca vêm do pitch da equipe e estão creditados nos Termos

## 4. Acessibilidade — meta WCAG 2.2 nível AA

- [x] **[obrigatório] `alt` em toda imagem**: descritivo nas fotos da dupla e nos prints; `alt=""` em imagens puramente decorativas. — axe (`image-alt`) em `tests/e2e/a11y.spec.ts`; alt da capa em `tests/dist/hero.test.ts`
- [x] **[obrigatório] Contraste**: texto normal ≥ 4.5:1, texto grande e ícones ≥ 3:1. Conferir laranja `#FF5A1F` e amarelo `#FFC83D` sobre `#0F0F10` e o cinza secundário. — axe `color-contrast` (wcag2aa) em `tests/e2e/a11y.spec.ts`, 6 páginas; Lighthouse acessibilidade 100
- [x] **[obrigatório] Navegação por teclado completa**: Tab passa por tudo em ordem lógica, foco sempre visível (contorno na cor do lado), nada preso, link "Pular para o conteúdo" no topo. — `tests/e2e/keyboard.spec.ts` (skip link, foco visível, sem armadilha, foco fora do cabeçalho)
- [x] **[obrigatório] `prefers-reduced-motion`**: vídeos não tocam sozinhos e animações ficam desligadas para quem pede. — `tests/e2e/video.spec.ts`
- [x] Vídeos com controle de pausa, nunca piscando mais de 3 vezes por segundo; legenda ou descrição em texto do que o vídeo mostra. — `tests/e2e/video.spec.ts` (botão de pausa) e resumo "O que o vídeo mostra" em cada vídeo
- [x] `lang="pt-BR"` / `lang="en"` no `<html>` de cada versão; botão de idioma com nome acessível. — `tests/dist/legal.test.ts` e axe `html-has-lang`
- [x] Hierarquia de títulos correta (um `h1` por página, sem pular níveis); landmarks `header`, `nav`, `main`, `footer`. — um `h1` por página em `tests/dist/legal.test.ts` e na home; Lighthouse acessibilidade 100
- [x] Alvos de toque ≥ 24×24 px; zoom até 200% sem quebrar layout. — axe `target-size` (wcag22aa); `tests/e2e/responsive.spec.ts` (44 px e sem rolagem horizontal a 320 px); texto a 200% em `tests/e2e/lang.spec.ts`
- [ ] Teste real: leitor de tela (NVDA no Windows) em pelo menos a home e um projeto. (Lucas, após o deploy)
- [x] Automático: axe (via Playwright) sem violações + `web-design-guidelines` sem pendências. — `tests/e2e/a11y.spec.ts` (WCAG 2.2 AA, 6 páginas); `web-design-guidelines` aplicada, ver `.superpowers/sdd/2026-11-22-portfolio-v1/task-16-report.md`

> **Adiado em 24/11/2026 (decisão do Lucas, redesign):** a acessibilidade avançada (auditoria axe completa, leitores de tela, contraste AA em todos os estados) fica para depois do redesign. Segue mantido o mínimo: `prefers-reduced-motion` respeitado, texto alternativo em fotos, prints e vídeos, e links e botões alcançáveis por teclado com foco visível.

**Pendências adiadas encontradas no portão de qualidade do redesign (24/11/2026), sem bloquear:**
- [ ] Etiquetas do globo (tela 02) com 31 a 36 px de altura e bichinhos de projeto com cerca de 40 px: abaixo dos 44 px recomendados para toque no celular (passam no mínimo de 24 px do WCAG 2.2).
- [ ] Texto corrido das fichas da tela 03 em 14 px (19 de 22 parágrafos): avaliar 15 a 16 px para leitura.
- [ ] Os bichinhos de projeto são links e entram na ordem do Tab (até um por tela): conferir com leitor de tela se ajudam ou atrapalham.
- [ ] Contraste AA nos estados de hover e foco e no texto sobre a divisa amarelo/laranja da tela 05 e sobre a retícula da capa: só o estado de repouso é coberto pelo axe.
- [ ] Anel de foco das pílulas do cabeçalho cortado em cerca de 1 px na faixa rolável do celular.
- [ ] O globo 3D (tela 02) tem equivalente em lista de links, mas a cena em si não é anunciada; conferir com NVDA se a lista basta.
- [ ] Teste com leitor de tela (NVDA) na home nova, nas duas línguas.

## 5. Segurança

- [x] **[obrigatório] Cabeçalhos HTTP** (configurados na hospedagem): — `public/_headers` + `tests/unit/headers.test.ts` e `tests/dist/security.test.ts` (inclui `X-Frame-Options: DENY`); conferir a resposta real após o deploy
  - `Content-Security-Policy` restritiva (`default-src 'self'`; sem `unsafe-inline` em script)
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy` desligando câmera, microfone, geolocalização
  - `frame-ancestors 'none'` (anti-clickjacking)
- [ ] **[obrigatório] HTTPS em tudo**, redirecionamento de HTTP. (após o deploy)
- [ ] **[obrigatório] Nenhum segredo no repositório** (chaves, tokens, `.env`). Ativar secret scanning e push protection no GitHub. (Lucas: secret scanning e push protection ativados em 2026-11-23; falta confirmar o histórico)
- [x] Links externos com `rel="noopener noreferrer"`. — `tests/dist/security.test.ts`
- [x] Dependências mínimas; Dependabot ativo; `npm audit` sem vulnerabilidade alta no CI. — `.github/dependabot.yml` e `npm audit --audit-level=high` em `.github/workflows/ci.yml`; Dependabot passa a agir após o merge
- [x] Fontes e scripts servidos do próprio domínio (sem CDN de terceiros = sem SRI para gerenciar e sem vazamento de IP de visitante). — `tests/dist/security.test.ts` ("nenhum recurso de terceiros") e CSP `default-src 'self'`
- [x] E-mail exibido de forma que dificulte robôs de spam (ex.: montado via JS ou imagem + `mailto`). — montado via JS a partir de `data-user`/`data-domain`, com `<noscript>`; `tests/dist/sections.test.ts` e `tests/dist/legal.test.ts`
- [ ] Varredura final com `strix-pentest` e securityheaders.com nota A ou superior. (após o deploy)

## 6. Verificação antes de publicar

- [ ] Lighthouse nas duas línguas, mobile e desktop, home e política. — `npx lhci autorun` (mobile) e `--config=lighthouserc.desktop.cjs`. Na v1, todas as categorias 100. No redesign (24/11/2026) valem as metas da spec 7. Desktop: 1,00 em tudo. Celular: performance de 0,91 a 0,99 (meta ≥ 0,85) e acessibilidade, boas práticas e SEO em 1,00. **Pendente: LCP do celular.** A asserção do LHCI passa porque usa a melhor de três execuções (agregação padrão). A mediana da home, porém, ficou entre 2,27 e 2,57 s conforme a rodada; na última, 2,50 s em `/` e 2,57 s em `/en/`, contra a meta de < 2,5 s
- [x] Playwright e2e: troca PT/EN, todos os links, navegação só por teclado, vídeos com reduced-motion. — `tests/e2e/` (lang, navigation, keyboard, video, nojs, responsive, a11y, csp)
- [x] Revisão humana (Lucas) de todos os textos legais e de cada vídeo. — textos legais revisados em 2026-11-23 e vídeos em 2026-11-22
