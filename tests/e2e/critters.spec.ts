import { test, expect, type Page } from '@playwright/test';

// Bichinhos em pixel art (spec 6). Montam depois do load, com a CPU livre (scripts/critters.ts).
const ready = async (page: Page) => {
  await page.goto('/');
  await page.waitForLoadState('load');
  await expect(page.locator('[data-critter]').first()).toBeAttached({ timeout: 10_000 });
};

// Cada tela onde os bichinhos andam: capa, tela 02, cada projeto da tela 03, telas 04 a 06.
const screens = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('#top, #living, [data-ai-screen], #fundamentals, #workflow, #contact')].map((e) => '#' + e.id),
  );

const inView = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('[data-critter]')].flatMap((e) => {
      const r = e.getBoundingClientRect();
      const on = r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
      return on ? [{ kind: e.dataset.kind!, x: r.x + r.width / 2, y: r.y + r.height / 2, l: r.left, r: r.right }] : [];
    }),
  );

test.describe('desktop', () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test.beforeEach(({}, info) => test.skip(info.project.name === 'mobile'));

  test('no máximo 3 de projeto e 4 figurantes por tela', async ({ page }) => {
    await ready(page);
    let seen = 0;
    for (const s of await screens(page)) {
      await page.locator(s).evaluate((e) => e.scrollIntoView({ block: 'start', behavior: 'instant' }));
      await page.waitForTimeout(150);
      const list = await inView(page);
      seen += list.length;
      expect(list.filter((c) => c.kind === 'projeto').length, s).toBeLessThanOrEqual(3);
      expect(list.filter((c) => c.kind === 'figurante').length, s).toBeLessThanOrEqual(4);
    }
    expect(seen, 'nenhum bichinho visível').toBeGreaterThan(0);
  });

  test('projeto é link com nome; figurante é decorativo e não recebe clique', async ({ page }) => {
    await ready(page);
    const p = page.locator('[data-critter][data-kind="projeto"]').first();
    await expect(p).toHaveAttribute('href', /^#p-[a-z-]+$/);
    await expect(p).toHaveAttribute('aria-label', /\S/);
    // só mouse/toque: não entra na ordem do Tab
    await expect(p).toHaveAttribute('tabindex', '-1');
    const f = page.locator('[data-critter][data-kind="figurante"]').first();
    await expect(f).toHaveAttribute('aria-hidden', 'true');
    await expect(f).toHaveCSS('pointer-events', 'none');
  });

  test('o Tab nunca para num bichinho de projeto', async ({ page }) => {
    await ready(page);
    const stops = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('a[data-critter]')].filter((e) => e.tabIndex >= 0).length,
    );
    expect(stops).toBe(0);
  });

  test('nenhum bichinho rouba o clique de um link ou botão', async ({ page }) => {
    await ready(page);
    const headerH = (await page.locator('header').boundingBox())!.height;
    for (const s of await screens(page)) {
      await page.locator(s).evaluate((e) => e.scrollIntoView({ block: 'start', behavior: 'instant' }));
      for (const wait of [200, 800]) {
        await page.waitForTimeout(wait);
        const bad = await page.evaluate((top) => {
          const out: string[] = [];
          for (const el of document.querySelectorAll<HTMLElement>('main :is(a, button):not([data-critter])')) {
            const r = el.getBoundingClientRect();
            const x = r.x + r.width / 2;
            const y = r.y + r.height / 2;
            if (!r.width || !r.height || y < top || y > innerHeight || x < 0 || x > innerWidth) continue;
            if (getComputedStyle(el).visibility === 'hidden') continue;
            const hit = document.elementFromPoint(x, y);
            if (hit?.closest('[data-critter]')) out.push(el.outerHTML.slice(0, 80));
          }
          return out;
        }, headerH);
        expect(bad, s).toEqual([]);
      }
    }
  });

  test('o bichinho de projeto mais perto segue o mouse e para antes de encostar', async ({ page }) => {
    // o Firefox lembra onde o mouse ficou no teste anterior e o reenvia ao rolar: começa no canto, longe de todos
    await page.mouse.move(1, 1);
    await ready(page);
    // em alguma tela, um ponto a 200 px de um bichinho de projeto, dentro da tela e com o caminho livre de texto
    let plan: { i: number; x: number; y: number } | null = null;
    for (const s of await screens(page)) {
      await page.locator(s).evaluate((e) => e.scrollIntoView({ block: 'start', behavior: 'instant' }));
      await page.waitForTimeout(200);
      plan = await page.evaluate(() => {
        // pelos retângulos, não por elementFromPoint: a foto da capa não recebe ponteiro, mas é evitada
        const rects = [...document.querySelectorAll(':is(h1, h2, h3, p, li, pre, td, th, dt, dd, summary, a, button, img, video, [data-critter-avoid], header):not([data-critter])')]
          .map((e) => e.getBoundingClientRect())
          .filter((r) => r.width && r.height);
        const free = (x: number, y: number) => !rects.some((r) => x >= r.left - 8 && x <= r.right + 8 && y >= r.top - 8 && y <= r.bottom + 8);
        const all = [...document.querySelectorAll<HTMLElement>('[data-critter]')];
        for (const el of all.filter((e) => e.dataset.kind === 'projeto')) {
          const r = el.getBoundingClientRect();
          const cx = r.x + r.width / 2;
          const cy = r.y + r.height / 2;
          if (r.top < 80 || r.bottom > innerHeight) continue;
          for (let a = 0; a < 16; a++) {
            const t = (a / 16) * Math.PI * 2;
            const x = cx + Math.cos(t) * 200;
            const y = cy + Math.sin(t) * 200;
            if (x < 10 || y < 90 || x > innerWidth - 10 || y > innerHeight - 10) continue;
            // o corredor inteiro, da largura do bichinho com folga, sem texto; e nenhum outro de projeto mais perto do ponto
            const half = Math.max(r.width, r.height) / 2 + 12;
            const [nx, ny] = [-Math.sin(t), Math.cos(t)];
            const lane = [0.2, 0.4, 0.6, 0.8, 1].every((k) =>
              [-half, 0, half].every((o) => free(cx + (x - cx) * k + nx * o, cy + (y - cy) * k + ny * o)),
            );
            const rival = all.some((o) => {
              if (o === el || o.dataset.kind !== 'projeto') return false;
              const q = o.getBoundingClientRect();
              return Math.hypot(q.x + q.width / 2 - x, q.y + q.height / 2 - y) < 260;
            });
            if (lane && !rival) return { i: all.indexOf(el), x, y };
          }
        }
        return null;
      });
      if (plan) break;
    }
    expect(plan, 'sem bichinho de projeto com caminho livre').not.toBeNull();
    const critter = page.locator('[data-critter]').nth(plan!.i);
    const dist = async () => {
      const b = (await critter.boundingBox())!;
      return Math.hypot(b.x + b.width / 2 - plan!.x, b.y + b.height / 2 - plan!.y);
    };
    await page.mouse.move(plan!.x, plan!.y);
    const d0 = await dist();
    await page.waitForTimeout(1500);
    const d1 = await dist();
    expect(d1).toBeLessThan(d0 - 20);
    expect(d1).toBeGreaterThanOrEqual(40);
  });

  test('movimento reduzido: os bichinhos ficam parados', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await ready(page);
    const before = await page.evaluate(() => [...document.querySelectorAll('[data-critter]')].map((e) => e.getBoundingClientRect().toJSON()));
    expect(before.length).toBeGreaterThan(0);
    await page.waitForTimeout(2000);
    const after = await page.evaluate(() => [...document.querySelectorAll('[data-critter]')].map((e) => e.getBoundingClientRect().toJSON()));
    expect(after).toEqual(before);
  });
});

// O PDF do currículo é gerado em mídia print depois do networkidle, quando os bichinhos já montaram.
test('na impressão, nenhum bichinho aparece', async ({ page }) => {
  await ready(page);
  await page.emulateMedia({ media: 'print' });
  const shown = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('[data-critter]')].filter((e) => e.getClientRects().length).length);
  expect(shown).toBe(0);
});

test.describe('celular', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test.beforeEach(({}, info) => test.skip(info.project.name !== 'mobile'));

  test('com toque, os bichinhos andam só pelas bordas', async ({ page }) => {
    await ready(page);
    let seen = 0;
    for (const s of await screens(page)) {
      await page.locator(s).evaluate((e) => e.scrollIntoView({ block: 'start', behavior: 'instant' }));
      await page.waitForTimeout(300);
      for (const c of await inView(page)) {
        seen++;
        expect(Math.min(c.l, 390 - c.r), `${s}: longe da borda`).toBeLessThanOrEqual(24);
      }
    }
    expect(seen, 'nenhum bichinho visível').toBeGreaterThan(0);
  });
});
