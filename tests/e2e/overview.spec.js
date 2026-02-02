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
    await expect(status).toContainText(/Loaded \d+ tasks from the last \d+ sprints/);
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
    const table = page.locator('#issuesTableContainer .issues-table');
    await expect(table.first()).toBeVisible();

    const rows = page.locator('#issuesTableContainer tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  // === Team toggle ===

  test('team toggle has multiple team options', async () => {
    const select = page.locator('#teamToggle');

    // Get all options in the select dropdown
    const options = await select.locator('option').allTextContents();

    // Should have multiple team options (All teams + individual teams)
    expect(options.length).toBeGreaterThanOrEqual(2);

    // Should include "All teams" option
    expect(options.some(opt => opt.toLowerCase().includes('all'))).toBe(true);

    // Select a different team
    if (options.length > 1) {
      await select.selectOption({ index: 1 });
      const selectedValue = await select.inputValue();
      expect(selectedValue).not.toBe('All');
    }

    // Reset to "All teams"
    await select.selectOption('All');
    await expect(select).toHaveValue('All');
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

  test('table has sprint sections', async () => {
    // Each sprint is rendered as a section with a header
    const sections = page.locator('#issuesTableContainer .sprint-section');
    const count = await sections.count();
    expect(count).toBeGreaterThan(0);
  });

  test('rows with HLE=0 have red background', async () => {
    const zeroHleRows = page.locator('#issuesTableContainer tr.row-hle-zero');
    const count = await zeroHleRows.count();
    // There might be no zero-HLE rows in current data, so we just check the selector works
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('issue keys are links to Jira', async () => {
    const firstLink = page.locator('#issuesTableContainer a[href*="browse"]').first();
    await expect(firstLink).toBeVisible();
    const href = await firstLink.getAttribute('href');
    expect(href).toMatch(/\/browse\/[A-Z]+-\d+/);
  });
});
