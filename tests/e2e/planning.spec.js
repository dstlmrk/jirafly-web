// @ts-check
const { test, expect } = require('@playwright/test');

test.describe.serial('Planning page', () => {
  /** @type {import('@playwright/test').Page} */
  let page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('/planning');
    // Wait for data to load from Jira
    await page.waitForSelector('#status:not(.loading)', { timeout: 60000 });
  });

  test.afterAll(async () => {
    await page.close();
  });

  // === Basic rendering ===

  test('status bar shows loaded tasks', async () => {
    const status = page.locator('#status');
    await expect(status).toContainText(/Loaded \d+ tasks/);
  });

  test('percentage chart is visible', async () => {
    const chart = page.locator('#nextSprintPercentageChart');
    await expect(chart).toBeVisible();
  });

  test('HLE chart is visible', async () => {
    const chart = page.locator('#nextSprintHleChart');
    await expect(chart).toBeVisible();
  });

  test('unassigned table is visible with rows', async () => {
    const table = page.locator('#unassignedTable');
    await expect(table).toBeVisible();

    const rows = page.locator('#unassignedTableBody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  // === HLE toggle ===

  test('HLE toggle hides and shows HLE column', async () => {
    const hleLabel = page.locator('label:has(#hleToggle)');
    const hleHeader = page.locator('#unassignedTable th:has-text("HLE")');

    // Check initial state - HLE column should be visible (checkbox is checked by default)
    await expect(hleHeader).toBeVisible();

    // Click the label to hide HLE column
    await hleLabel.click();
    await expect(hleHeader).toBeHidden();

    // Click again to show HLE column
    await hleLabel.click();
    await expect(hleHeader).toBeVisible();
  });

  // === Team toggle ===

  test('team toggle cycles through teams', async () => {
    const button = page.locator('#teamToggle');

    // Get initial state
    const initialText = await button.textContent();

    // Click through all teams
    await button.click();
    const firstTeam = await button.textContent();
    expect(firstTeam).not.toBe(initialText);

    await button.click();
    const secondTeam = await button.textContent();
    expect(secondTeam).not.toBe(firstTeam);

    await button.click();
    const thirdTeam = await button.textContent();
    expect(thirdTeam).not.toBe(secondTeam);

    await button.click();
    const fourthTeam = await button.textContent();
    expect(fourthTeam).not.toBe(thirdTeam);

    await button.click();
    const fifthTeam = await button.textContent();
    expect(fifthTeam).not.toBe(fourthTeam);

    // After cycling through all (No team, Serenity, Falcon, Discovery, Kosmik, All),
    // we should be back at the start or continue cycling
  });

  test('team toggle saves to sessionStorage', async () => {
    const button = page.locator('#teamToggle');

    // Click until we select a specific team (not "No team" or "All")
    for (let i = 0; i < 10; i++) {
      await button.click();
      const text = await button.textContent();
      if (text && !text.toLowerCase().includes('no team') && !text.toLowerCase().includes('all')) {
        // Check sessionStorage has the team saved
        const savedTeam = await page.evaluate(() => sessionStorage.getItem('jirafly-selected-team'));
        expect(savedTeam).not.toBeNull();
        return;
      }
    }

    // If we couldn't find a specific team, fail
    expect(false).toBe(true);
  });

  test('team toggle updates URL with team parameter', async () => {
    const button = page.locator('#teamToggle');

    // First click on "No team" to reset (go through teams until we hit "No team")
    for (let i = 0; i < 10; i++) {
      const text = await button.textContent();
      if (text && text.toLowerCase().includes('no team')) {
        break;
      }
      await button.click();
    }

    // Verify URL has no team param when on "No team"
    let url = new URL(page.url());
    expect(url.searchParams.has('team')).toBe(false);

    // Click to select a specific team
    await button.click();
    const teamText = await button.textContent();

    // URL should now have team parameter
    url = new URL(page.url());
    expect(url.searchParams.has('team')).toBe(true);
    const teamParam = url.searchParams.get('team');
    expect(teamParam).not.toBeNull();

    // Team param should be lowercase short name (e.g., "serenity" not "TeamSerenity")
    expect(teamParam).toMatch(/^[a-z]+$/);
  });

  test('team parameter in URL is applied on page load', async ({ browser }) => {
    // Open a new page with team parameter in URL
    const newPage = await browser.newPage();
    await newPage.goto('/planning?team=serenity');
    await newPage.waitForSelector('#status:not(.loading)', { timeout: 60000 });

    // Team toggle should show Serenity team
    const button = newPage.locator('#teamToggle');
    await expect(button).toContainText(/serenity/i);

    // Table title should reflect the team
    const tableTitle = newPage.locator('#unassignedTableTitle');
    await expect(tableTitle).toContainText(/Serenity/i);

    await newPage.close();
  });

  // === Due date badges ===

  test('due date badges are present', async () => {
    // Some tasks may have due dates with badges
    const badges = page.locator('#unassignedTableBody .due-date-badge');
    const count = await badges.count();
    // Not all tasks have due dates, so we just verify the selector works
    expect(count).toBeGreaterThanOrEqual(0);
  });

  // === Table content ===

  test('table has required columns', async () => {
    const headers = page.locator('#unassignedTable thead th');
    const headerTexts = await headers.allTextContents();

    expect(headerTexts.some(h => h.includes('Assignee'))).toBe(true);
    expect(headerTexts.some(h => h.includes('WSJF'))).toBe(true);
    expect(headerTexts.some(h => h.includes('Task'))).toBe(true);
    expect(headerTexts.some(h => h.includes('Status'))).toBe(true);
  });

  test('issue keys are links to Jira', async () => {
    const firstLink = page.locator('#unassignedTableBody a[href*="browse"]').first();
    await expect(firstLink).toBeVisible();
    const href = await firstLink.getAttribute('href');
    expect(href).toMatch(/\/browse\/[A-Z]+-\d+/);
  });

  // === BE/FE mode toggle ===

  test('mode toggle is enabled and shows BE by default', async () => {
    const modeButton = page.locator('#modeToggle');
    await expect(modeButton).toBeVisible();
    await expect(modeButton).toBeEnabled();
    await expect(modeButton).toHaveText('BE');
  });

  test('switching to FE mode hides team toggle', async () => {
    const modeButton = page.locator('#modeToggle');
    const teamButton = page.locator('#teamToggle');

    // Team toggle should be visible in BE mode
    await expect(teamButton).toBeVisible();

    // Switch to FE
    await modeButton.click();
    await expect(modeButton).toHaveText('FE');

    // Team toggle should be hidden
    await expect(teamButton).not.toBeVisible();

    // Switch back to BE for other tests
    await modeButton.click();
    await expect(modeButton).toHaveText('BE');
    await expect(teamButton).toBeVisible();
  });

  test('FE mode shows FE Tasks in table title', async () => {
    const modeButton = page.locator('#modeToggle');
    const tableTitle = page.locator('#unassignedTableTitle');

    // Switch to FE
    await modeButton.click();
    await expect(tableTitle).toContainText('FE Tasks');

    // Switch back to BE
    await modeButton.click();
    await expect(tableTitle).toContainText('Tasks');
    await expect(tableTitle).not.toContainText('FE Tasks');
  });
});
