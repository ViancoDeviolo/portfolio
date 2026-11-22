# Guia de skills e MCPs — Portfólio Lucas Cruz

> Copiar o bloco da seção 4 para o `CLAUDE.md` do repositório do portfólio.
> Ele diz ao Claude Code **qual skill manda em quê**, para que regras de skills diferentes não briguem entre si.

## 1. O que foi instalado e para quê

| Item | Tipo | Papel no projeto |
|---|---|---|
| `design-taste-frontend` (Taste) | skill | **Autoridade principal de visual**: tipografia, grid, contra-template |
| `emil-design-eng` | skill | Filosofia de detalhe e polimento de interface |
| `animate` | skill | Construir as poucas animações do site (entrada da dupla, hover, troca PT/EN) |
| `review-animations` | skill | Revisar toda animação antes de aprovar |
| `web-design-guidelines` (Vercel) | skill | Auditoria de acessibilidade, teclado, formulários, performance |
| `ui-ux-pro-max` | plugin | **Só como checklist de UX** — não usar para escolher estilo ou paleta |
| Ponytail | plugin (sempre ativo) | Escrever o mínimo de código que resolve; deixa comentários `ponytail:` no que adiou |
| Caveman | plugin (sempre ativo) | Respostas do agente no chat em modo telegráfico — economiza tokens |
| Playwright | MCP | Testes e2e (navegação, troca de idioma, links, teclado) |
| Chrome DevTools | MCP | Ver o site rodando: console, rede, Lighthouse, Core Web Vitals |
| Figma | MCP | Ler/gerar telas no Figma, se formos desenhar antes de codar |

## 2. Hierarquia quando as skills discordarem

1. **Decisões do Lucas** (design aprovado em `docs/`) — sempre vencem.
2. **Acessibilidade e segurança** (`web-design-guidelines` + `CONFORMIDADE.md`) — vencem qualquer gosto visual.
3. **Visual**: `design-taste-frontend` decide; `emil-design-eng` refina detalhes.
4. **Movimento**: `animate` constrói, `review-animations` aprova.
5. **`ui-ux-pro-max`**: consulta de regras de UX. Ignorar o catálogo de estilos e paletas dela — a paleta já está decidida.
6. **Ponytail** corta excesso de **código**, nunca requisito: páginas legais, acessibilidade, PT/EN, testes e cabeçalhos de segurança do `CONFORMIDADE.md` **não são over-engineering** e não podem ser "adiados".
7. **Caveman** vale só para a **conversa no chat**. Textos do site, `README`, mensagens de commit e documentação são escritos em linguagem normal (o texto do site segue a skill `copywriting`). A revisão crítica do fim de cada entrega continua completa.

> Ponytail e Caveman ligam sozinhos em toda sessão. Para desligar na hora: "stop caveman" / "stop ponytail" (ou `/ponytail off`). Na fase de design e revisão, vale desligar o Caveman para ter explicações completas.

## 3. Opcionais deixados desligados (e por quê)

- **21st MCP (antigo Magic)** — gera componentes a partir de um catálogo público de 12 mil peças prontas. É o atalho mais rápido para o site parecer "mais um feito por IA", que é o oposto do objetivo. Exige chave de API e envia seus prompts para um serviço de terceiro. **Usar só para um componente isolado e chato** (ex.: um acordeão), e sempre reestilizado pela `design-taste-frontend`.
- **shadcn MCP** — é por projeto e só serve se a stack for React + shadcn. Decidimos a stack depois; se não for React, não instala. Preferir o oficial (`npx shadcn@latest mcp init --client claude`) ao `@jpisnice/shadcn-ui-mcp-server`, que pede token do GitHub sem necessidade.

## 4. Bloco para o CLAUDE.md do projeto

```markdown
## Ferramentas e precedência
- Visual: siga `design-taste-frontend`; refine com `emil-design-eng`.
- Toda animação: construir com `animate`, aprovar com `review-animations`;
  respeitar `prefers-reduced-motion`.
- Antes de declarar qualquer tela pronta: rodar `web-design-guidelines` e
  checar no Chrome DevTools MCP (console limpo, Lighthouse ≥ 95 em todas as categorias).
- `ui-ux-pro-max`: só regras de UX. NÃO trocar paleta/estilo a partir dela.
- Não instalar componentes do 21st/shadcn sem pedir ao Lucas.
- Ponytail: cortar código, nunca itens do CONFORMIDADE.md. Rodar `/ponytail-debt` antes de publicar.
- Caveman: só nas respostas do chat. Conteúdo do site, commits e docs em linguagem normal.
- Toda entrega cumpre `docs/CONFORMIDADE.md`.
- Commits sem Co-Authored-By nem qualquer atribuição ao Claude.
```

## 5. Segurança das próprias ferramentas

- Skills são instruções que o agente segue com as suas permissões. Antes de usar, abra cada `SKILL.md` em `%USERPROFILE%\.claude\skills\` e leia — leva 5 minutos.
- MCPs com `@latest` atualizam sozinhos. Depois que tudo estiver funcionando, fixe a versão (ex.: `@playwright/mcp@0.x.y`) para evitar surpresa de cadeia de suprimentos.
- Nunca cole chave de API (21st, etc.) no repositório. Use variável de ambiente.

## 6. Problemas comuns

- **Skill não aparece em `/skills`**: o CLI `skills` às vezes grava em `~/.agents/skills`. Copie a pasta para `%USERPROFILE%\.claude\skills\` e reinicie o Claude Code.
- **MCP aparece como "failed" no Windows**: confira se o comando tem `cmd /c` antes do `npx`.
- **Figma 405 / não conecta**: use o servidor remoto (`https://mcp.figma.com/mcp`) e faça o login por `/mcp`, não pelo app desktop.
