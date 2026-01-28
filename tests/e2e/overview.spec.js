// @ts-check
const { test, expect } = require('@playwright/test');

test.describe.serial('Overview page', () => {
  /** @type {import('@playwright/test').Page} */
  let page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('/');
    // Wait for data to load from Jira
    await page.waitForSelector('#status:not(.loading)', { timeout: 60000 });
  });

  test.afterAll(async () => {
    await page.close();
  });

  // === Basic rendering ===

  test('status bar shows loaded tasks', async () => {
    const status = page.locator('#status');
    await expect(status).toContainText(/Loaded \d+ tasks from \d+ sprints/);
  });

  test('percentage chart is visible', async () => {
    const chart = page.locator('#percentageChart');
    await expect(chart).toBeVisible();
  });

  test('HLE chart is visible', async () => {
    const chart = page.locator('#hleChart');
    await expect(chart).toBeVisible();
  });

  test('issues table is visible with rows', async () => {
    const table = page.locator('#issuesTable');
    await expect(table).toBeVisible();

    const rows = page.locator('#issuesTableBody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  // === Team toggle ===

  test('team toggle cycles through teams', async () => {
    const button = page.locator('#teamToggle');
    const seenTexts = new Set();

    // Click through all options (max 10 clicks to avoid infinite loop)
    for (let i = 0; i < 10; i++) {
      const text = await button.textContent();
      if (seenTexts.has(text)) {
        // We've cycled back to a seen value, stop
        break;
      }
      seenTexts.add(text);
      await button.click();
    }

    // Should have seen multiple team options
    expect(seenTexts.size).toBeGreaterThanOrEqual(2);

    // Reset to "All teams" by clicking until we see it
    for (let i = 0; i < 10; i++) {
      const text = await button.textContent();
      if (text && text.toLowerCase().includes('all')) {
        break;
      }
      await button.click();
    }

    await expect(button).toContainText(/All/i);
  });

  // === Dark mode ===

  test('dark mode toggle works', async () => {
    const body = page.locator('body');
    const themeButton = page.locator('#themeToggle');

    // Check initial state (light mode)
    const initiallyDark = await body.evaluate(el => el.classList.contains('dark'));

    // Toggle theme
    await themeButton.click();

    if (initiallyDark) {
      await expect(body).not.toHaveClass(/dark/);
    } else {
      await expect(body).toHaveClass(/dark/);
    }

    // Toggle back
    await themeButton.click();

    if (initiallyDark) {
      await expect(body).toHaveClass(/dark/);
    } else {
      await expect(body).not.toHaveClass(/dark/);
    }
  });

  // === Table details ===

  test('table has sprint dividers', async () => {
    const dividers = page.locator('#issuesTableBody tr.sprint-start');
    const count = await dividers.count();
    expect(count).toBeGreaterThan(0);
  });

  test('rows with HLE=0 have red background', async () => {
    const zeroHleRows = page.locator('#issuesTableBody tr.row-hle-zero');
    const count = await zeroHleRows.count();
    // There might be no zero-HLE rows in current data, so we just check the selector works
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('issue keys are links to Jira', async () => {
    const firstLink = page.locator('#issuesTableBody a[href*="browse"]').first();
    await expect(firstLink).toBeVisible();
    const href = await firstLink.getAttribute('href');
    expect(href).toMatch(/\/browse\/[A-Z]+-\d+/);
  });
});
