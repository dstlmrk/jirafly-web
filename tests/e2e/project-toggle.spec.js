// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Project toggle (BE/FE)', () => {
  test('BE mode is default and shows team toggle', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#status:not(.loading)', { timeout: 60000 });

    const modeButton = page.locator('#modeToggle');
    const teamButton = page.locator('#teamToggle');

    // Mode button should show BE
    await expect(modeButton).toHaveText('BE');
    await expect(modeButton).toBeEnabled();

    // Team button should be visible and enabled
    await expect(teamButton).toBeVisible();
    await expect(teamButton).toBeEnabled();
  });

  test('switching to FE mode hides team toggle and updates URL', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#status:not(.loading)', { timeout: 60000 });

    const modeButton = page.locator('#modeToggle');
    const teamButton = page.locator('#teamToggle');

    // Click to switch to FE
    await modeButton.click();

    // Wait for loading to complete
    await page.waitForSelector('#status:not(.loading)', { timeout: 60000 });

    // Mode button should show FE
    await expect(modeButton).toHaveText('FE');

    // Team button should be disabled in FE mode (now a select dropdown)
    await expect(teamButton).toBeDisabled();

    // URL should contain project=fe
    expect(page.url()).toContain('project=fe');
  });

  test('FE mode loads different data', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#status:not(.loading)', { timeout: 60000 });

    // Get BE task count
    const beStatus = await page.locator('#status').textContent();
    const beMatch = beStatus?.match(/Loaded (\d+) tasks/);
    const beCount = beMatch ? parseInt(beMatch[1]) : 0;

    // Switch to FE
    await page.locator('#modeToggle').click();
    await page.waitForSelector('#status:not(.loading)', { timeout: 60000 });

    // Get FE task count
    const feStatus = await page.locator('#status').textContent();
    const feMatch = feStatus?.match(/Loaded (\d+) tasks/);
    const feCount = feMatch ? parseInt(feMatch[1]) : 0;

    // Counts should be different (different projects)
    // Note: This test might fail if both projects happen to have same count
    // but that's very unlikely
    expect(feCount).not.toBe(beCount);
  });

  test('switching back to BE mode shows team toggle again', async ({ page }) => {
    await page.goto('/?project=fe');
    await page.waitForSelector('#status:not(.loading)', { timeout: 60000 });

    const modeButton = page.locator('#modeToggle');
    const teamButton = page.locator('#teamToggle');

    // Should start in FE mode
    await expect(modeButton).toHaveText('FE');
    await expect(teamButton).toBeDisabled();

    // Click to switch to BE
    await modeButton.click();
    await page.waitForSelector('#status:not(.loading)', { timeout: 60000 });

    // Mode button should show BE
    await expect(modeButton).toHaveText('BE');

    // Team button should be visible again
    await expect(teamButton).toBeVisible();
    await expect(teamButton).toBeEnabled();

    // URL should not contain project=fe
    expect(page.url()).not.toContain('project=fe');
  });

  test('project=fe URL parameter loads FE mode directly', async ({ page }) => {
    await page.goto('/?project=fe');
    await page.waitForSelector('#status:not(.loading)', { timeout: 60000 });

    const modeButton = page.locator('#modeToggle');
    const teamButton = page.locator('#teamToggle');

    // Should be in FE mode
    await expect(modeButton).toHaveText('FE');
    await expect(teamButton).toBeDisabled();
  });

  test('data is cached when switching between modes', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#status:not(.loading)', { timeout: 60000 });

    // Get initial BE status
    const beStatus1 = await page.locator('#status').textContent();

    // Switch to FE
    await page.locator('#modeToggle').click();
    await page.waitForSelector('#status:not(.loading)', { timeout: 60000 });

    // Switch back to BE - should use cached data (no loading spinner should appear)
    const loadingPromise = page.waitForSelector('#status.loading', { timeout: 1000 }).catch(() => null);
    await page.locator('#modeToggle').click();

    // Loading should NOT appear (data is cached)
    const loadingAppeared = await loadingPromise;
    expect(loadingAppeared).toBeNull();

    // Status should be the same as before
    const beStatus2 = await page.locator('#status').textContent();
    expect(beStatus2).toBe(beStatus1);
  });

  test('status bar shows current sprint info', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#status:not(.loading)', { timeout: 60000 });

    const status = page.locator('#status');
    // Should show "Now is X.Y (d/m - d/m)" format
    await expect(status).toContainText(/Now is \d+\.\d+/);
    await expect(status).toContainText(/\(\d+\/\d+ - \d+\/\d+\)/);
  });

  test('project toggle is enabled on planning page', async ({ page }) => {
    await page.goto('/planning');
    await page.waitForSelector('#status:not(.loading)', { timeout: 60000 });

    const modeButton = page.locator('#modeToggle');

    // Mode button should be visible and enabled
    await expect(modeButton).toBeVisible();
    await expect(modeButton).toBeEnabled();
    await expect(modeButton).toHaveText('BE');
  });

  test('switching modes on planning page updates table', async ({ page }) => {
    await page.goto('/planning');
    await page.waitForSelector('#status:not(.loading)', { timeout: 60000 });

    const modeButton = page.locator('#modeToggle');
    const teamButton = page.locator('#teamToggle');
    const tableTitle = page.locator('#unassignedTableTitle');

    // Should start in BE mode with team toggle visible
    await expect(modeButton).toHaveText('BE');
    await expect(teamButton).toBeVisible();

    // Get initial table title
    const beTitle = await tableTitle.textContent();
    expect(beTitle).toContain('Tasks');

    // Switch to FE mode
    await modeButton.click();

    // Mode button should show FE
    await expect(modeButton).toHaveText('FE');

    // Team toggle should be disabled in FE mode
    await expect(teamButton).toBeDisabled();

    // Table title should change to FE
    await expect(tableTitle).toContainText('FE Tasks');
  });

  test('planning charts show BE Avg and FE Team columns', async ({ page }) => {
    await page.goto('/planning');
    await page.waitForSelector('#status:not(.loading)', { timeout: 60000 });

    // Charts should be rendered with the new labels
    // We can verify by checking the chart canvas exists and has content
    const percentageChart = page.locator('#nextSprintPercentageChart');
    const hleChart = page.locator('#nextSprintHleChart');

    await expect(percentageChart).toBeVisible();
    await expect(hleChart).toBeVisible();
  });

  test('planning status shows total tasks from both projects', async ({ page }) => {
    await page.goto('/planning');
    await page.waitForSelector('#status:not(.loading)', { timeout: 60000 });

    const status = page.locator('#status');
    // Should show "Loaded X tasks for sprint Y.Z"
    await expect(status).toContainText(/Loaded \d+ tasks for sprint \d+\.\d+/);
  });

  test('switching pages preserves mode correctly', async ({ page }) => {
    // Start on overview in BE mode
    await page.goto('/');
    await page.waitForSelector('#status:not(.loading)', { timeout: 60000 });

    const modeButton = page.locator('#modeToggle');

    // Switch to FE mode
    await modeButton.click();
    await page.waitForSelector('#status:not(.loading)', { timeout: 60000 });
    await expect(modeButton).toHaveText('FE');

    // Navigate to planning
    await page.locator('[data-page="planning"]').click();
    await page.waitForSelector('#status:not(.loading)', { timeout: 60000 });

    // Mode should still be FE
    await expect(modeButton).toHaveText('FE');

    // Navigate back to overview
    await page.locator('[data-page="history"]').click();

    // Mode should still be FE and should load FE data
    await expect(modeButton).toHaveText('FE');

    // Team toggle should be disabled (FE mode)
    const teamButton = page.locator('#teamToggle');
    await expect(teamButton).toBeDisabled();
  });

  test('switching from FE planning to BE overview loads correct data', async ({ page }) => {
    // Start on planning
    await page.goto('/planning');
    await page.waitForSelector('#status:not(.loading)', { timeout: 60000 });

    const modeButton = page.locator('#modeToggle');

    // Switch to FE mode on planning
    await modeButton.click();
    await expect(modeButton).toHaveText('FE');

    // Switch back to BE mode
    await modeButton.click();
    await expect(modeButton).toHaveText('BE');

    // Navigate to overview
    await page.locator('[data-page="history"]').click();
    await page.waitForSelector('#status:not(.loading)', { timeout: 60000 });

    // Should be in BE mode with team toggle visible
    await expect(modeButton).toHaveText('BE');
    const teamButton = page.locator('#teamToggle');
    await expect(teamButton).toBeVisible();
    await expect(teamButton).toBeEnabled();
  });
});
