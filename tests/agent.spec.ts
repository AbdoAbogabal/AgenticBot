import { test, expect } from '@playwright/test';

test('Agent Search', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await expect(page.locator('.status-indicator')).toContainText('Searching for context');
});
