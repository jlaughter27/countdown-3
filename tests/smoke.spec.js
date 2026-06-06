const { test, expect } = require('@playwright/test');

// End-to-end smoke test: boots the real app, walks the first-run flow, and
// verifies the core surfaces (countdown, quotes, settings, loved ones) work —
// with no uncaught page errors along the way.

test('first-run flow: onboarding → countdown, quotes, settings, loved ones', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });

  // Start from a clean slate so onboarding is guaranteed to show.
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  // 1) Onboarding appears on first run.
  const onboarding = page.locator('#onboarding');
  await expect(onboarding).toBeVisible();
  await expect(page.locator('#app-main')).toBeHidden();

  // 2) Complete onboarding.
  await page.fill('#ob-birthdate', '1990-01-01');
  await page.fill('#ob-lifespan', '80');
  await page.fill('#ob-slogan', 'Live like it matters');
  await page.click('#ob-start');

  // 3) App reveals and the countdown is populated (not the "—" placeholder).
  await expect(page.locator('#app-main')).toBeVisible();
  await expect(page.locator('#cd-days')).toContainText('days');
  await expect(page.locator('#cd-days')).not.toHaveText('—');
  await expect(page.locator('#percentage-lived')).toContainText('% lived');
  await expect(page.locator('#slogan-display')).toHaveText('Live like it matters');

  // The seconds tick (live clock is running).
  const firstSeconds = await page.locator('#cd-ss').textContent();
  await expect.poll(async () => page.locator('#cd-ss').textContent(), { timeout: 4000 })
    .not.toBe(firstSeconds);

  // 4) A real quote replaces the placeholder.
  await expect(page.locator('#quote')).not.toContainText('Quote will appear here', { timeout: 5000 });
  await expect(page.locator('#quote')).toHaveAttribute('role', 'button');

  // 5) Settings dialog opens and closes.
  await page.click('#open-settings');
  await expect(page.locator('#settings-dialog')).toBeVisible();
  await expect(page.locator('#user-birthdate')).toHaveValue('1990-01-01');
  await page.locator('#settings-form button[value="cancel"]').click();
  await expect(page.locator('#settings-dialog')).toBeHidden();

  // 6) Add a loved one and confirm it renders with a days-left count.
  await page.click('#add-loved-one');
  await expect(page.locator('#loved-one-dialog')).toBeVisible();
  await page.fill('#lo-name', 'Sam');
  await page.fill('#lo-birthdate', '2015-06-01');
  await page.click('#save-loved-one');
  await expect(page.locator('#loved-one-dialog')).toBeHidden();
  await expect(page.locator('#loved-ones-list')).toContainText('Sam');
  await expect(page.locator('#loved-ones-list')).toContainText('days left');

  // 7) No uncaught errors during the whole flow.
  expect(errors, errors.join('\n')).toEqual([]);
});

test('rejects a future birthdate during onboarding', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await expect(page.locator('#onboarding')).toBeVisible();
  await page.fill('#ob-birthdate', '2999-01-01');
  await page.fill('#ob-lifespan', '80');
  await page.click('#ob-start');

  // Validation blocks it: the dialog stays open and the app stays hidden.
  await expect(page.locator('#onboarding')).toBeVisible();
  await expect(page.locator('#app-main')).toBeHidden();
  const valid = await page.locator('#ob-birthdate').evaluate((el) => el.checkValidity());
  expect(valid).toBe(false);
});
