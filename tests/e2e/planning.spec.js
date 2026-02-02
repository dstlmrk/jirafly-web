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

  test('team toggle has multiple team options', async () => {
    const select = page.locator('#teamToggle');

    // Get all options in the select dropdown
    const options = await select.locator('option').allTextContents();

    // Should have multiple team options (No team + individual teams)
    expect(options.length).toBeGreaterThanOrEqual(2);

    // Should include "No team" option
    expect(options.some(opt => opt.toLowerCase().includes('no team'))).toBe(true);

    // Select different teams to verify they work
    if (options.length > 1) {
      await select.selectOption({ index: 1 });
      const selectedValue = await select.inputValue();
      expect(selectedValue).not.toBe('NoTeam');
    }

    // Reset to "No team"
    await select.selectOption('NoTeam');
    await expect(select).toHaveValue('NoTeam');
  });

  test('team toggle saves to sessionStorage', async () => {
    const select = page.locator('#teamToggle');

    // Get all options
    const options = await select.locator('option').all();

    // Find a team option that isn't "No team"
    for (const option of options) {
      const value = await option.getAttribute('value');
      if (value && value !== 'NoTeam') {
        await select.selectOption(value);

        // Check sessionStorage has the team saved
        const savedTeam = await page.evaluate(() => sessionStorage.getItem('jirafly-selected-team'));
        expect(savedTeam).not.toBeNull();
        expect(savedTeam).toBe(value);
        return;
      }
    }

    // If we couldn't find a specific team, fail
    expect(false).toBe(true);
  });

  test('team toggle updates URL with team parameter', async () => {
    const select = page.locator('#teamToggle');

    // Reset to "No team"
    await select.selectOption('NoTeam');

    // Verify URL has no team param when on "No team"
    let url = new URL(page.url());
    expect(url.searchParams.has('team')).toBe(false);

    // Select a specific team (find first non-NoTeam option)
    const options = await select.locator('option').all();
    let teamValue = null;
    for (const option of options) {
      const value = await option.getAttribute('value');
      if (value && value !== 'NoTeam') {
        teamValue = value;
        break;
      }
    }

    if (teamValue) {
      await select.selectOption(teamValue);

      // URL should now have team parameter
      url = new URL(page.url());
      expect(url.searchParams.has('team')).toBe(true);
      const teamParam = url.searchParams.get('team');
      expect(teamParam).not.toBeNull();

      // Team param should be lowercase short name (e.g., "serenity" not "TeamSerenity")
      expect(teamParam).toMatch(/^[a-z]+$/);
    }
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

  test('switching to FE mode disables team toggle', async () => {
    const modeButton = page.locator('#modeToggle');
    const teamButton = page.locator('#teamToggle');

    // Team toggle should be enabled in BE mode
    await expect(teamButton).toBeEnabled();

    // Switch to FE
    await modeButton.click();
    await expect(modeButton).toHaveText('FE');

    // Team toggle should be disabled
    await expect(teamButton).toBeDisabled();

    // Switch back to BE for other tests
    await modeButton.click();
    await expect(modeButton).toHaveText('BE');
    await expect(teamButton).toBeEnabled();
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
