import { test, expect, type Page } from '@playwright/test';

// O projeto "no-webgl" roda o Chromium com --disable-3d-apis (playwright.config.ts).
const noWebgl = (name: string) => name === 'no-webgl';
const toLiving = (page: Page) => page.locator('#living').scrollIntoViewIfNeeded();
// A cena só baixa depois do load e da primeira interação (scripts/globe.ts).
const interact = async (page: Page) => {
  await page.waitForLoadState('load');
  await page.keyboard.press('Shift');
};

// Sem WebGL2 (ex.: navegador headless sem GL), o certo é o globo estático: o teste afirma esse caminho em vez de pular.
const webgl2 = (page: Page) => page.evaluate(() => !!document.createElement('canvas').getContext('webgl2'));

test('cena 3D assume a capa e a tela 02 com um único canvas', async ({ page }, info) => {
  test.skip(noWebgl(info.project.name));
  await page.goto('/');
  if (!(await webgl2(page))) return assertStatic(page);
  await page.waitForLoadState('load');
  await page.waitForTimeout(1000);
  expect(await page.locator('canvas').count(), 'sem interação, nada de cena').toBe(0);
  await interact(page);
  await expect(page.locator('html')).toHaveAttribute('data-globe-live', '', { timeout: 15_000 });
  await toLiving(page);
  await expect(page.locator('html')).toHaveAttribute('data-globe-state', 'living');
  expect(await page.locator('canvas').count()).toBe(1);
  // o estático some por opacidade (continua no layout: a cena lê a posição dele)
  await expect(page.locator('[data-hero] [data-globe-static]')).toHaveCSS('opacity', '0');
  await expect(page.locator('#living [data-globe-static]')).toHaveCSS('opacity', '0');
});

test('o laço da cena para longe das telas do globo e volta na tela 02', async ({ page }, info) => {
  test.skip(noWebgl(info.project.name));
  // conta as chamadas de desenho WebGL: é o canvas da cena quem desenha
  await page.addInitScript(() => {
    if (typeof WebGL2RenderingContext === 'undefined') return;
    const draw = WebGL2RenderingContext.prototype.drawArrays;
    WebGL2RenderingContext.prototype.drawArrays = function (...args) {
      (window as any).__draws = ((window as any).__draws ?? 0) + 1;
      return draw.apply(this, args);
    };
  });
  await page.goto('/');
  if (!(await webgl2(page))) return assertStatic(page);
  await interact(page);
  await expect(page.locator('html')).toHaveAttribute('data-globe-live', '', { timeout: 15_000 });
  await expect(page.locator('html')).not.toHaveAttribute('data-globe-paused');
  const frames = () => page.evaluate(() => (window as any).__draws ?? 0);
  await expect.poll(frames).toBeGreaterThan(0);
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await expect(page.locator('html')).toHaveAttribute('data-globe-paused', '');
  const a = await frames();
  await page.waitForTimeout(500);
  expect(await frames()).toBe(a);
  await toLiving(page);
  await expect(page.locator('html')).not.toHaveAttribute('data-globe-paused');
  await expect.poll(frames).toBeGreaterThan(a);
});

const staysStatic = async (page: Page) => {
  await page.goto('/');
  await assertStatic(page);
};

async function assertStatic(page: Page) {
  await interact(page);
  await page.waitForTimeout(1500); // tempo de sobra para a cena tentar montar
  await toLiving(page);
  await page.waitForTimeout(500);
  expect(await page.locator('canvas').count()).toBe(0);
  await expect(page.locator('html')).not.toHaveAttribute('data-globe-live');
  await expect(page.locator('#living [data-globe-static]')).toBeVisible();
  await expect(page.locator('#living [data-globe-static]')).toHaveCSS('opacity', '1');
  await page.evaluate(() => scrollTo(0, 0));
  await expect(page.locator('[data-hero] [data-globe-static]')).toBeVisible();
  await expect(page.locator('[data-hero] [data-globe-static]')).toHaveCSS('opacity', '1');
};

test('movimento reduzido: sem canvas, globo estático visível', async ({ page }, info) => {
  test.skip(noWebgl(info.project.name));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await staysStatic(page);
});

test('sem WebGL: sem canvas, globo estático visível', async ({ page }, info) => {
  test.skip(!noWebgl(info.project.name));
  await staysStatic(page);
});

test('o LCP da capa não é o canvas', async ({ page, browserName }, info) => {
  test.skip(noWebgl(info.project.name) || browserName !== 'chromium', 'LCP só no Chromium');
  // observador registrado antes de tudo: guarda cada candidato a LCP desde o início da página
  await page.addInitScript(() => {
    (window as any).__lcp = [];
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) (window as any).__lcp.push((e as PerformanceEntry & { element?: Element }).element?.tagName ?? '?');
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  });
  await page.goto('/');
  await page.waitForFunction(() => (window as any).__lcp.length > 0); // o LCP da capa já saiu; a interação encerra a medição
  await interact(page);
  await expect(page.locator('html')).toHaveAttribute('data-globe-live', '', { timeout: 15_000 });
  await page.waitForTimeout(500);
  const tags: string[] = await page.evaluate(() => (window as any).__lcp);
  expect(tags.length).toBeGreaterThan(0);
  expect(tags).not.toContain('CANVAS');
});

// ── Momentos e microinterações (Task 9): só animam o que já está no HTML estático.
const mobile = (name: string) => name === 'mobile';
// O snippet como o HTML estático o entrega: lido num contexto sem JS.
const staticSnippet = async (browser: import('@playwright/test').Browser) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const p = await ctx.newPage();
  await p.goto('/');
  const text = await p.locator('#fundamentals pre[data-snippet]').innerText();
  await ctx.close();
  return text;
};
const opacityNow = (page: Page, sel: string) =>
  page.locator(sel).evaluateAll((els) => els.map((e) => getComputedStyle(e).opacity));

test('movimento reduzido: snippet inteiro, respostas e textos visíveis sem esperar', async ({ page, browser }, info) => {
  test.skip(noWebgl(info.project.name));
  const snippet = await staticSnippet(browser);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.waitForLoadState('load');
  await page.locator('#fundamentals').scrollIntoViewIfNeeded();
  expect(await page.locator('#fundamentals pre[data-snippet]').innerText()).toBe(snippet);
  await page.locator('#workflow .answers').scrollIntoViewIfNeeded();
  expect(await page.locator('#workflow [data-answer]').count()).toBe(3);
  expect(await opacityNow(page, '#workflow [data-answer]')).toEqual(['1', '1', '1']);
  await page.locator('#ai').scrollIntoViewIfNeeded();
  for (const o of await opacityNow(page, '#ai [data-reveal]')) expect(o).toBe('1');
  expect(await page.locator('[data-hero] .name span, .duo .figure').evaluateAll((els) => els.flatMap((e) => e.getAnimations()).length)).toBe(0);
});

test('o código é digitado e termina igual ao snippet', async ({ page, browser }, info) => {
  test.skip(noWebgl(info.project.name));
  const snippet = await staticSnippet(browser);
  await page.goto('/');
  await page.waitForLoadState('load');
  const pre = page.locator('#fundamentals pre[data-snippet]');
  await expect(pre).toHaveAttribute('data-typing', 'armed'); // a digitação só se arma depois do load, com a CPU livre
  // mede dentro da página, poucos quadros depois de rolar: sem a latência do protocolo, que sob carga já veria o fim
  const early = await pre.evaluate(
    (e) =>
      new Promise<number>((done) => {
        e.scrollIntoView({ block: 'center', behavior: 'instant' });
        // o menor comprimento visto quadro a quadro, por meio segundo (o Firefox entrega o IntersectionObserver uns quadros depois)
        let min = Infinity;
        const t0 = performance.now();
        const look = () => {
          min = Math.min(min, e.innerText.length);
          if (performance.now() - t0 < 500) requestAnimationFrame(look);
          else done(min);
        };
        look();
      }),
  );
  expect(early, 'a digitação começa vazia').toBeLessThan(snippet.length);
  await page.waitForTimeout(3000);
  expect(await pre.innerText()).toBe(snippet);
});

test('tela 05: botões com aria-pressed alternam a resposta em destaque', async ({ page }, info) => {
  test.skip(noWebgl(info.project.name));
  await page.goto('/');
  const buttons = page.locator('#workflow [data-answer-pick] button');
  const answers = page.locator('#workflow [data-answer]');
  await buttons.first().scrollIntoViewIfNeeded();
  expect(await buttons.count()).toBe(3);
  const check = async (i: number) => {
    for (let j = 0; j < 3; j++) await expect(buttons.nth(j)).toHaveAttribute('aria-pressed', String(i === j));
    await expect(page.locator('#workflow [data-answer][data-active]')).toHaveCount(1);
    await expect(answers.nth(i)).toHaveAttribute('data-active', '');
  };
  await check(0);
  await buttons.nth(1).click();
  await check(1);
  await buttons.nth(2).focus();
  await page.keyboard.press('Enter');
  await check(2);
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Space');
  await check(1);
});

test('cards da tela 04 inclinam com o mouse, nunca com movimento reduzido', async ({ page }, info) => {
  test.skip(noWebgl(info.project.name) || mobile(info.project.name), 'só ponteiro fino');
  const card = page.locator('#fundamentals .card').first();
  const tilt = async () => {
    // o card é mais alto que a janela: o topo dele fica logo abaixo do cabeçalho fixo
    await card.evaluate((e) => scrollTo({ top: scrollY + e.getBoundingClientRect().top - 150, behavior: 'instant' }));
    const b = (await card.boundingBox())!;
    // perto da quina de propósito: o lado sob o ponteiro sobe, então ele não escapa do card e a inclinação não pisca
    await page.mouse.move(b.x + b.width * 0.9, b.y + 40);
    await page.mouse.move(b.x + b.width * 0.95, b.y + 20, { steps: 3 });
    await page.waitForTimeout(400);
    return card.evaluate((e) => getComputedStyle(e).transform);
  };
  await page.goto('/');
  const t = await tilt();
  expect(t).not.toBe('none');
  // rotação máxima de 4°: m11 de rotateY(4°) é cos(4°) ≈ 0,9976
  const m = t.match(/matrix3d\(([^)]+)\)/)![1].split(',').map(Number);
  expect(m[0]).toBeGreaterThanOrEqual(Math.cos((4 * Math.PI) / 180) - 1e-3);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  expect(await tilt()).toBe('none');
});

test('a página escurece até o preto antes da tela 06, sem cobrir texto da 05', async ({ page }, info) => {
  test.skip(noWebgl(info.project.name));
  await page.goto('/');
  const dusk = page.locator('#workflow [data-dusk]');
  const box = async (sel: string) => (await page.locator(sel).boundingBox())!;
  // a faixa vem depois de todo o texto da 05 e encosta na 06
  const [last, d, c] = [await box('#workflow .evolution'), await box('#workflow [data-dusk]'), await box('#contact')];
  expect(d.y).toBeGreaterThanOrEqual(last.y + last.height);
  expect(Math.abs(d.y + d.height - c.y)).toBeLessThan(1);
  expect(await dusk.evaluate((e) => getComputedStyle(e).backgroundImage)).toMatch(/linear-gradient\(.*rgb\(15, 15, 16\)\)$/);
  // com a tabela à vista e a faixa entrando, o centro da tabela continua sendo a tabela
  await dusk.evaluate((e) => scrollTo({ top: scrollY + e.getBoundingClientRect().top - innerHeight / 2, behavior: 'instant' }));
  const hit = await page.locator('#workflow .evolution').evaluate((t) => {
    const r = t.getBoundingClientRect();
    const y = Math.max(r.top, Math.min(r.bottom, innerHeight / 2) - 10);
    return t.contains(document.elementFromPoint(r.left + r.width / 2, y));
  });
  expect(hit).toBe(true);
});
