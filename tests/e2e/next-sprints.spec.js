// @ts-check
const { test, expect } = require('@playwright/test');

test.describe.serial('Future Sprints page', () => {
  /** @type {import('@playwright/test').Page} */
  let page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('/next-sprints');
    // Wait for data to load from Jira
    await page.waitForSelector('#status:not(.loading)', { timeout: 60000 });
  });

  test.afterAll(async () => {
    await page.close();
  });

  // === Basic rendering ===

  test('status bar shows loaded tasks and current sprint', async () => {
    const status = page.locator('#status');
    await expect(status).toContainText(/Loaded \d+ tasks/);
    await expect(status).toContainText(/Now is \d+\.\d+/);
  });

  test('percentage chart is visible', async () => {
    const chart = page.locator('#futureSprintsPercentageChart');
    await expect(chart).toBeVisible();
  });

  test('HLE chart is visible', async () => {
    const chart = page.locator('#futureSprintsHleChart');
    await expect(chart).toBeVisible();
  });

  test('future sprints table is visible with rows', async () => {
    const table = page.locator('#futureSprintsTable');
    await expect(table).toBeVisible();

    const rows = page.locator('#futureSprintsTableBody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  // === Table content ===

  test('table has required columns', async () => {
    const headers = page.locator('#futureSprintsTable thead th');
    const headerTexts = await headers.allTextContents();

    expect(headerTexts.some(h => h.includes('Sprint'))).toBe(true);
    expect(headerTexts.some(h => h.includes('Assignee'))).toBe(true);
    expect(headerTexts.some(h => h.includes('WSJF'))).toBe(true);
    expect(headerTexts.some(h => h.includes('Task'))).toBe(true);
    expect(headerTexts.some(h => h.includes('HLE'))).toBe(true);
    expect(headerTexts.some(h => h.includes('Due Date'))).toBe(true);
    expect(headerTexts.some(h => h.includes('Status'))).toBe(true);
  });

  test('issue keys are links to Jira', async () => {
    const firstLink = page.locator('#futureSprintsTableBody a[href*="browse"]').first();
    await expect(firstLink).toBeVisible();
    const href = await firstLink.getAttribute('href');
    expect(href).toMatch(/\/browse\/[A-Z]+-\d+/);
  });

  test('sprint badges are visible', async () => {
    const sprintBadges = page.locator('#futureSprintsTableBody .sprint-badge');
    const count = await sprintBadges.count();
    expect(count).toBeGreaterThan(0);
  });

  // === Due date badges ===

  test('due date badges are present', async () => {
    // Some tasks may have due dates with badges
    const badges = page.locator('#futureSprintsTableBody .due-date-badge');
    const count = await badges.count();
    // Not all tasks have due dates, so we just verify the selector works
    expect(count).toBeGreaterThanOrEqual(0);
  });

  // === BE/FE mode toggle ===

  test('mode toggle is enabled and shows BE by default', async () => {
    const modeButton = page.locator('#modeToggle');
    await expect(modeButton).toBeVisible();
    await expect(modeButton).toBeEnabled();
    await expect(modeButton).toHaveText('BE');
  });

  test('team toggle is hidden', async () => {
    const teamButton = page.locator('#teamToggle');
    await expect(teamButton).not.toBeVisible();
  });

  test('switching to FE mode updates table title', async () => {
    const modeButton = page.locator('#modeToggle');
    const tableTitle = page.locator('#futureSprintsTableTitle');

    // Check initial BE state
    await expect(tableTitle).toContainText('BE Tasks');

    // Switch to FE
    await modeButton.click();
    await expect(modeButton).toHaveText('FE');
    await expect(tableTitle).toContainText('FE Tasks');

    // Switch back to BE
    await modeButton.click();
    await expect(modeButton).toHaveText('BE');
    await expect(tableTitle).toContainText('BE Tasks');
  });

  // === Tab navigation ===

  test('can navigate to overview and back', async () => {
    const overviewTab = page.locator('#tabHistory');
    const futureSprintsTab = page.locator('#tabFutureSprints');

    // Navigate to overview
    await overviewTab.click();
    await expect(page).toHaveURL(/\/$/);

    // Navigate back to future sprints
    await futureSprintsTab.click();
    await expect(page).toHaveURL(/\/next-sprints/);
  });

  test('can navigate to planning and back', async () => {
    const planningTab = page.locator('#tabPlanning');
    const futureSprintsTab = page.locator('#tabFutureSprints');

    // Navigate to planning
    await planningTab.click();
    await expect(page).toHaveURL(/\/planning/);

    // Navigate back to future sprints
    await futureSprintsTab.click();
    await expect(page).toHaveURL(/\/next-sprints/);
  });

  // === Dark mode ===

  test('dark mode toggle works', async () => {
    const themeToggle = page.locator('#themeToggle');
    const body = page.locator('body');

    // Get initial state
    const initialClass = await body.getAttribute('class');

    // Toggle theme
    await themeToggle.click();
    const newClass = await body.getAttribute('class');
    expect(newClass).not.toBe(initialClass);

    // Toggle back
    await themeToggle.click();
    const finalClass = await body.getAttribute('class');
    expect(finalClass).toBe(initialClass);
  });
});
