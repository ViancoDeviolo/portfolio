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

- [ ] **[obrigatório] Política de Privacidade** (`/privacidade`, `/en/privacy`)
  - quem é o controlador: Lucas Cruz, contato lucascruzcorp@gmail.com
  - quais dados são tratados (se nenhum: dizer isso explicitamente)
  - finalidade e base legal (art. 7º LGPD) de cada dado
  - por quanto tempo é guardado e como é apagado
  - com quem é compartilhado (hospedagem, provedor de formulário, analytics)
  - direitos do titular (art. 18): acesso, correção, eliminação, revogação do consentimento — e como pedir
  - data da última atualização
- [ ] **Aviso de cookies**: só se algum cookie não essencial for usado. Se não usar, a política diz "este site não usa cookies de rastreamento".
- [ ] **Termos de uso / aviso legal** (curto): conteúdo do portfólio é do autor; projetos de equipe creditados; links externos sem responsabilidade pelo conteúdo de terceiros.
- [ ] Links para essas páginas no rodapé de todas as páginas, nos dois idiomas.

## 2. Formulário de contato (só se existir)

- [ ] **[obrigatório]** Coletar o mínimo: nome, e-mail, mensagem. Nada de telefone ou CPF.
- [ ] **[obrigatório]** Texto curto ao lado do botão dizendo a finalidade ("usarei seu e-mail só para responder a esta mensagem") + link para a política.
- [ ] Caixa de consentimento **não pré-marcada**, se a base legal for consentimento.
- [ ] Provedor do formulário declarado na política; dados não ficam guardados no site.
- [ ] Anti-spam sem rastreamento: campo honeypot + limite de envios. Evitar reCAPTCHA (envia dados ao Google); se precisar, Cloudflare Turnstile.
- [ ] Validação no cliente **e** no servidor/provedor; mensagens de erro acessíveis (`aria-live`).

## 3. Mídia: fotos e vídeos dos projetos

- [ ] **[obrigatório] Remover metadados EXIF das fotos** (podem conter GPS da sua casa e modelo do celular). Verificar com `exiftool` antes de publicar.
- [ ] **[obrigatório] Revisar cada gravação de tela quadro a quadro** antes de publicar:
  - NFE Hub: CPF/CNPJ, nomes e endereços de clientes da loja, chaves de NF-e, certificados → borrar ou usar dados fictícios
  - Analitic Blitz: saldo, número de conta, chaves de API da Binance/XP
  - Arapuca / EasyFood / qualquer um: tokens, `.env`, URLs internas, abas abertas, notificações
- [ ] Vídeos sem trilha de áudio (evita gravar conversa ou notificação por engano).
- [ ] Se aparecer colega de equipe (foto/nome), ter o ok da pessoa.

## 4. Acessibilidade — meta WCAG 2.2 nível AA

- [ ] **[obrigatório] `alt` em toda imagem**: descritivo nas fotos da dupla e nos prints; `alt=""` em imagens puramente decorativas.
- [ ] **[obrigatório] Contraste**: texto normal ≥ 4.5:1, texto grande e ícones ≥ 3:1. Conferir laranja `#FF5A1F` e amarelo `#FFC83D` sobre `#0F0F10` e o cinza secundário.
- [ ] **[obrigatório] Navegação por teclado completa**: Tab passa por tudo em ordem lógica, foco sempre visível (contorno na cor do lado), nada preso, link "Pular para o conteúdo" no topo.
- [ ] **[obrigatório] `prefers-reduced-motion`**: vídeos não tocam sozinhos e animações ficam desligadas para quem pede.
- [ ] Vídeos com controle de pausa, nunca piscando mais de 3 vezes por segundo; legenda ou descrição em texto do que o vídeo mostra.
- [ ] `lang="pt-BR"` / `lang="en"` no `<html>` de cada versão; botão de idioma com nome acessível.
- [ ] Hierarquia de títulos correta (um `h1` por página, sem pular níveis); landmarks `header`, `nav`, `main`, `footer`.
- [ ] Alvos de toque ≥ 24×24 px; zoom até 200% sem quebrar layout.
- [ ] Teste real: leitor de tela (NVDA no Windows) em pelo menos a home e um projeto.
- [ ] Automático: axe (via Playwright) sem violações + `web-design-guidelines` sem pendências.

## 5. Segurança

- [ ] **[obrigatório] Cabeçalhos HTTP** (configurados na hospedagem):
  - `Content-Security-Policy` restritiva (`default-src 'self'`; sem `unsafe-inline` em script)
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy` desligando câmera, microfone, geolocalização
  - `frame-ancestors 'none'` (anti-clickjacking)
- [ ] **[obrigatório] HTTPS em tudo**, redirecionamento de HTTP.
- [ ] **[obrigatório] Nenhum segredo no repositório** (chaves, tokens, `.env`). Ativar secret scanning e push protection no GitHub.
- [ ] Links externos com `rel="noopener noreferrer"`.
- [ ] Dependências mínimas; Dependabot ativo; `npm audit` sem vulnerabilidade alta no CI.
- [ ] Fontes e scripts servidos do próprio domínio (sem CDN de terceiros = sem SRI para gerenciar e sem vazamento de IP de visitante).
- [ ] E-mail exibido de forma que dificulte robôs de spam (ex.: montado via JS ou imagem + `mailto`).
- [ ] Varredura final com `strix-pentest` e securityheaders.com nota A ou superior.

## 6. Verificação antes de publicar

- [ ] Lighthouse ≥ 95 em Performance, Acessibilidade, Boas práticas e SEO — nas duas línguas, mobile e desktop.
- [ ] Playwright e2e: troca PT/EN, todos os links, navegação só por teclado, vídeos com reduced-motion.
- [ ] Revisão humana (Lucas) de todos os textos legais e de cada vídeo.
