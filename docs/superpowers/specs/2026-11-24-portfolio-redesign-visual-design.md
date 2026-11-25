# Portfólio Lucas Cruz — Redesign visual (3D e movimento)

**Data:** 24/11/2026 · **Status:** aprovado pelo Lucas em 24/11/2026
**Substitui** no doc `2026-11-22-portfolio-design.md`: paleta e tipografia da seção 5, as subseções 7.2, 7.3 e 7.4, e o item de acessibilidade da seção 8. Todo o resto daquele doc continua valendo: conteúdo, i18n PT/EN, esquemas Zod, segurança, LGPD, CI e deploy.
**Referências visuais aprovadas:** pasta `docs/redesign/` (PNG). São esboços estáticos: a composição e o tom são a referência, não as medidas exatas em pixel.

---

## 1. Intenção e o porquê

O site no ar ficou funcional, mas genérico. O Lucas quer um site moderno, com 3D e movimento, no nível de criatividade dos sites que mandou como referência. Esses sites (Slush, Air, Auros, Hungry Tiger) servem de régua de qualidade, mas o site **não pode se parecer com eles**.

O que eles ensinam, e este redesign aplica:
- uma ideia central forte, que cabe numa frase;
- um elemento de marca que se repete em todas as telas;
- tipografia gigante tratada como objeto;
- regras que proíbem coisas.

**A frase deste site:** *dois lados do mesmo engenheiro, de costas um para o outro, ligados por pontos.*
- **Amarelo**: o lado "à mão", com os fundamentos escritos sem IA.
- **Laranja**: o lado "com IA", a engenharia de IA.
- **Os pontos**: o elemento de marca, que aparece no globo, na retícula e na moldura dos vídeos.

## 2. Objetivos, não-objetivos e anti-objetivos

**Objetivos**
- Na primeira tela, quem visita entende a dualidade sem ler nada.
- O movimento tem função: guiar, mostrar o estado dos projetos, levar a eles.
- A personalidade do Lucas aparece, por exemplo nos bichinhos em pixel art.

**Não-objetivos**
- Reescrever conteúdo, esquemas, i18n ou a pipeline de CI/deploy.
- Acessibilidade avançada nesta etapa (ver seção 9).

**Anti-objetivos** (se acontecer, falhou mesmo funcionando)
- Cara de template ou de "site feito por IA": cards genéricos, degradês roxos, ícones de biblioteca sem tratamento.
- Copiar ou imitar qualquer site de referência ou personagem de terceiros. **Inimigos de Space Invaders (Taito) estão proibidos**, inclusive versões parecidas.
- Movimento que atrapalha a leitura: texto que precisa ser lido entra uma vez e fica parado.
- Número sem fonte em qualquer tela.

## 3. Sistema visual

### 3.1 Paleta
| Papel | Cor |
|---|---|
| Lado "à mão" (dominante) | `#FFC83D` amarelo |
| Lado "IA" (dominante) | `#FF5A1F` laranja |
| Secundária: texto, navegação, bichinhos, detalhes | `#0F0F10` preto |
| Texto claro, só sobre preto | `#EDEBE6` |
| Status "concluído" (só em selos de status) | `#55db9c` |

- Laranja e amarelo dominam; o preto é secundário.
- Texto sobre amarelo e sobre laranja é sempre preto. Texto branco sobre essas cores é proibido.
- A única tela com fundo preto é a 06 (contato) e o rodapé.
- **Regra de cor por lado**: tudo que é "à mão" usa amarelo e tudo que é "IA" usa laranja, inclusive em cards, etiquetas e destaques. Elementos neutros usam preto.

### 3.2 Tipografia
| Uso | Fonte |
|---|---|
| Destaques do lado "à mão" | **Instrument Serif itálico** (400) |
| Destaques do lado "IA" | **Archivo** 900, com tracking de cerca de −0,04em |
| Texto corrido e interface | **Inter** (400, 500, 600) |
| Código | monoespaçada à escolha do construtor (ex.: JetBrains Mono) |

- O nome da capa é escrito em dupla: "*Lucas*" no serifado itálico e "**Cruz**" em Archivo. Títulos de seção seguem a mesma regra (ex.: "*Sempre* / **em obra.**").
- Fontes servidas do próprio domínio via Fontsource, com subconjunto latino e `font-display: swap`. Sem Google Fonts por CDN.

### 3.3 Elemento de marca: pontos
- **Globo de partículas**: aparece na capa e na tela 02.
- **Retícula de meios-tons**: faz a passagem do amarelo para o laranja na capa, começando abaixo da navegação.
- **Moldura pontilhada**: envolve os vídeos dos projetos (tela 03) e é feita com as partículas do globo.
- **Formas**: botões e etiquetas em pílula; cards com raio de 16 a 20 px; contorno preto de 1,5 px quando houver borda. Sem sombras, exceto as do próprio 3D.

## 4. Telas (ordem e conteúdo)

| # | Tela | Fundo | Esboço |
|---|---|---|---|
| 01 | Capa | amarelo e laranja, com retícula | `redesign-capa.png` |
| 02 | Sempre em obra | laranja | `S02-sempre-em-obra.png` |
| 03 | Engenharia de IA: uma tela por projeto | laranja | `S03-engenharia-de-ia.png` |
| 04 | Fundamentos: à mão | amarelo | `S04-fundamentos.png` |
| 05 | Como eu uso IA | metade amarelo, metade laranja | `S05-como-eu-uso-ia.png` |
| 06 | Estudando agora + contato, rodapé legal | preto | `S06-contato.png` |

- **01 – Capa**
  - Navegação em pílulas; o seletor PT/EN fica num botão preto preenchido. Selo "portfólio vivo · projetos em evolução".
  - Nome em dupla tipográfica, gigante, atrás das fotos.
  - Fotos recortadas: casual à esquerda (amarelo), terno à direita (laranja), costas encostadas no centro. O globo de pontos pretos fica atrás das fotos.
  - Rótulos de baixo, sem listar ferramentas:
    - esquerda: "Fundamentos" / "construídos sem atalho";
    - direita: "Engenharia de IA" / "prompt, orquestração e revisão".
  - A lista de IAs (Claude, GPT, Gemini, Copilot) **não aparece na capa**; ela fica na tela 05.
- **02 – Sempre em obra**
  - Globo grande com uma etiqueta por projeto, mostrando nome e status: amarela para "à mão", preta para "IA".
  - Legenda "feito à mão / com IA". Clicar numa etiqueta leva ao projeto.
  - Status atuais:
    | Projeto | Status |
    |---|---|
    | Arapuca HoneyAnt | concluído |
    | EasyFood | concluído |
    | Analitic Blitz | em evolução |
    | NFE Hub | em desenvolvimento |
    | Renovação de Apólices | em evolução |
    | Banco em Java | em evolução |
    | Calculadoras | em evolução |
- **03 – Engenharia de IA**
  - Uma tela por projeto de IA (Arapuca, Analitic Blitz, NFE Hub, EasyFood, Renovação), com paginação "01 / 05".
  - Cada tela tem: título em Archivo, contexto, selo de status, vídeo ou print dentro da moldura pontilhada e quatro colunas (O problema, O que eu decidi, O que a IA fez, Resultado).
  - Os textos vêm das fichas de conteúdo que já existem no site.
- **04 – Fundamentos**
  - Título "*à mão.*" e um bloco de código real do Lucas (calculadora em Python, `ideiaV1.py`) aparecendo como se estivesse sendo digitado.
  - Cards: Calculadoras (amarelo), Banco em Java (preto, porque laranja é a cor da IA) e Próximos (contorno tracejado, "em construção").
- **05 – Como eu uso IA**
  - Três passos do método, o pedido e as quatro respostas (Claude, GPT, Gemini, Copilot) aparecendo uma a uma.
  - **O conteúdo tem que ser uma comparação real do Lucas** (ver seção 10). Enquanto ela não existir, a tela não vai ao ar com respostas inventadas.
  - **Comparação real disponível (24/11/2026)**: o pedido de revisão da função `verificar_compatibilidade_legado` (projeto Renovação), com as respostas de Gemini, Copilot e GPT. A do Claude ainda vai ser feita numa conversa nova, sem contexto. Na tela entram trechos curtos de cada resposta e a conclusão do Lucas. Nunca entram texto inventado nem a publicidade que veio colada na resposta do GPT.
  - **Bloco complementar**: a evolução real da Renovação, da v1 (um agente genérico com Gemini, guiado pelo GPT) até a atual (quatro agentes, Groq `gpt-oss-120b` e decisão do legado em código).
- **06 – Contato**
  - Título "*Vamos* / **conversar.**". Lista "Estudando agora": Fundamentos de Java e Python; Inteligência computacional; Oracle Agentic AI.
  - Botões: LinkedIn (amarelo), GitHub (laranja) e E-mail (contorno). Rodapé com as páginas legais.

## 5. Movimento

Regra geral: **um momento grande por tela** e **pequenos movimentos em tudo o que dá para tocar**. O texto que precisa ser lido entra uma vez e não se mexe mais.

| Tela | Momento | Microinterações |
|---|---|---|
| 01 | globo gira devagar e reage ao mouse; a retícula "escorre" com a rolagem | entrada do nome em duas partes ("Lucas" de um lado, "Cruz" do outro); as fotos se aproximam até encostar |
| 02 | etiquetas presas ao globo giram com ele: maiores quando estão na frente, somem quando passam para trás | passar o mouse numa etiqueta pausa o globo e mostra "o que mudou na última versão" |
| 03 | as partículas do globo se desmontam e viram a moldura do vídeo | o texto entra com a rolagem; o vídeo só toca quando está visível |
| 04 | o código é digitado na tela | os cards inclinam levemente seguindo o mouse |
| 05 | as quatro respostas aparecem uma a uma, como se cada IA estivesse respondendo | dá para alternar e comparar as respostas |
| 06 | a página escurece até o preto | os botões reagem a hover e toque |

**Durações e curvas**: definidas pela skill do Emil (`emil-design-eng`/`animate`) e revisadas com `review-animations`.

## 6. Bichinhos em pixel art

Os desenhos de partida estão em `docs/redesign/bichinhos-sprites.json` (grades de pixels) e `R7-bichinhos-todos.png`. O traço pode ser refinado, mas todos os personagens continuam originais.

| | De projeto | Figurantes |
|---|---|---|
| Quais | formiga (Arapuca), marmita (EasyFood), candle (Analitic Blitz), nota fiscal (NFE Hub), moeda (Banco), robô (Renovação) | bug, café, disquete, chaves {}, faísca |
| Tamanho | pixel de cerca de 5 a 6 px | cerca de metade |
| Mouse (desktop) | o mais próximo **segue** o cursor devagar e para a uma distância curta | **fogem** quando o cursor chega perto |
| Clique | abre o projeto dele | nada (decorativo, `aria-hidden`) |
| Limite por tela | 3 | 4 |

- **Comportamento geral**:
  - Andam isolados, com animação de 2 quadros.
  - São pretos por padrão; na tela preta (06) usam amarelo, laranja ou `#EDEBE6`.
  - Nunca passam por cima de texto: as áreas de texto ficam fora do caminho deles.
- **Celular**: andam só pelas bordas e não seguem o toque.
- **Movimento reduzido** (`prefers-reduced-motion`): ficam parados.
- **Técnica**: feitos em SVG ou CSS, fora da cena 3D.

## 7. Arquitetura técnica (decisão do Lucas: opção completa)

| Peça | Escolha | Por quê |
|---|---|---|
| Base | **Astro**, mantido | conteúdo, i18n e esquemas já prontos |
| Ilhas interativas | **React** (`@astrojs/react`) | exigido pelo R3F, pelo shadcn e pelo Magic |
| 3D | **React Three Fiber** + **three** (+ `@react-three/drei` só se usar algo dele) | globo, transformação das partículas, liberdade para 3D futuro |
| Rolagem | **GSAP** + ScrollTrigger | padrão de mercado para animação guiada pela rolagem |
| Microinterações | **Motion** (`motion/react`) | componentes React |
| Estilo | **Tailwind CSS v4** com tokens da seção 3 | exigido pelo shadcn e pelo Magic; os tokens ficam num `@theme` único |
| Componentes | **shadcn MCP** e **Magic MCP**, liberados | sempre reestilizados pela Taste antes de entrar; nenhum componente com o visual padrão |

**Alternativas descartadas**:
- **Canvas 2D + GSAP**: mais leve, mas limita o 3D no futuro; o Lucas preferiu a opção completa.
- **Spline**: pesado, depende do serviço deles e coloca marca d'água no plano gratuito.

**Regras de desempenho** (substituem a 7.4 antiga):
- **Carregamento do 3D**:
  - A cena só carrega quando entra na tela (`client:visible` mais `import()` dinâmico).
  - Uma única cena WebGL é reaproveitada entre a capa e a tela 02, sem abrir um contexto novo por tela.
- **Celular**: menos partículas, renderização limitada a `dpr` 1,5 e pausa quando a aba não está visível.
- **Versão parada**:
  - Sem WebGL ou com `prefers-reduced-motion`, entra uma imagem estática do globo e das animações.
  - O site continua navegável e completo sem JavaScript.
- **Orçamento**:
  - Lighthouse acima de 90 no desktop e acima de 85 no celular (meta do celular assumida em 85; o Lucas pode subir para 90).
  - LCP abaixo de 2,5 s em 4G simulado.
  - O limite antigo de 15 KB de JS deixa de valer; todo JS de animação e 3D fica fora do caminho crítico da capa.
- **Mídia**: as regras da 7.4 antiga continuam (AVIF/WebP, vídeos ≤ 2 MB com `preload="none"`).

**Segurança**: os cabeçalhos do `_headers` continuam valendo. A CSP só pode ser ampliada no mínimo necessário (ex.: `worker-src blob:` se algum loader exigir), nunca com `unsafe-eval` ou `unsafe-inline` em script. Toda mudança na CSP vai documentada no PR.

## 8. Ferramentas e skills (atualiza a seção 11 do doc anterior)

| Papel | Ferramenta |
|---|---|
| Direção | **Taste** (`design-taste-frontend`): referências reais e verificador no navegador para barrar cara de template |
| Movimento | **Emil** (`emil-design-eng`, `animate`, `review-animations`) |
| Polimento | **Impeccable** |
| Peças | **Magic MCP** e **shadcn MCP**, sempre reestilizados |
| Conferência final | **Web Design Guidelines**, sem barrar por acessibilidade avançada |
| Verificação no navegador | **Playwright MCP** / **Chrome DevTools MCP**: comparar cada tela com o esboço correspondente |

## 9. Acessibilidade (decisão do Lucas: avançada adiada)

O mínimo abaixo foi confirmado pelo Lucas em 24/11/2026:
- `prefers-reduced-motion` respeitado em todo movimento;
- texto alternativo em fotos, prints e vídeos;
- navegação básica por teclado: links e botões alcançáveis, com foco visível.

O resto (auditoria axe completa, leitores de tela, contraste AA em todos os estados) fica adiado e é registrado no `CONFORMIDADE.md` como pendência com data.

## 10. Pendências antes de publicar

1. **Tela 05**: faltam a resposta do Claude (conversa nova) e a conclusão do Lucas. Se a correção apontada pelo GPT for feita no notebook (status e rota definidos pelo código, não pelo LLM), ela entra como desfecho da comparação.
2. **Recortes definitivos** das fotos: os atuais são provisórios.
4. Pendências do doc anterior que continuam abertas: páginas legais, correções nos repositórios e revisão do site no ar.

## 11. Fica a critério do construtor

- Medidas exatas, espaçamentos e breakpoints, desde que fiéis aos esboços.
- Curvas e durações (pela skill do Emil).
- Contagem de partículas por aparelho.
- Fonte monoespaçada.
- Estrutura interna dos componentes React.
- **Celular** (não há esboço): o construtor decide com a Taste, respeitando a seção 3. Ponto de partida sugerido: a divisa amarelo/laranja vira horizontal (amarelo em cima, laranja embaixo), o nome fica em duas linhas e o globo vai para trás das fotos, com menos partículas.
- **Textos em inglês** dos títulos novos ("Sempre em obra", "à mão", "Vamos conversar", rótulos da capa): o construtor propõe e o Lucas revisa antes do merge.

**Decisões minhas (Claude), para o Lucas conferir:**
- **Campo novo na ficha de cada projeto**: `lastChange`, em PT e EN, opcional, para o hover das etiquetas da tela 02. Sem ele, a etiqueta mostra só nome e status.
- **Fotos da capa**: usar os recortes de `kit/media/dupla/` até chegarem os definitivos.

## 12. Revisão crítica

**Pontos fortes**
- Ideia central única e coerente: a dualidade aparece na cor, na tipografia e nos bichinhos.
- Um elemento de marca (os pontos) amarra todas as telas.
- O 3D tem função: status dos projetos e transição para eles.

**Pontos fracos e riscos**
- O 3D completo aumenta o JS e o risco de lentidão no celular. A mitigação está nas regras da seção 7, mas a meta do celular baixou para 85.
- O Tailwind e o React entram num projeto que antes não tinha nenhum dos dois. O risco é de inconsistência; a mitigação são os tokens únicos no `@theme`.
- Os bichinhos podem virar poluição; a mitigação são os limites por tela e a regra de nunca cobrir texto.
- A tela 05 depende de conteúdo real que ainda não existe.

**Dívida técnica aceita**: acessibilidade avançada adiada.

| | Nota |
|---|---|
| Arquitetura | 8/10 |
| Segurança | 8/10 (CSP sob controle, nenhum serviço externo novo) |
| Escalabilidade | 8/10 (fichas de conteúdo e uma cena 3D reaproveitável) |
