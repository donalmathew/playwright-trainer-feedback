import { test, expect } from '@playwright/test';

test.describe('API Mocking - Network Interception', () => {
  test.beforeEach(async ({ page }) => {
    // To Clear session storage before each test
    await page.goto('http://127.0.0.1:5501/index1.html');
    await page.evaluate(() => sessionStorage.clear());
  });

  test('Mock failed login API response - wrong password', async ({ page }) => {
    await page.route('**/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword*', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 400,
            message: 'INVALID_PASSWORD',
            errors: [{
              message: 'INVALID_PASSWORD',
              domain: 'global',
              reason: 'invalid'
            }]
          }
        })
      });
    });
    await page.waitForLoadState('domcontentloaded');
    const loginForm = page.locator('#loginForm');
    await loginForm.getByPlaceholder('Username').fill('donalmathewpt@gmail.com');
    await loginForm.getByPlaceholder('Password').fill('333333');
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('Invalid credentials');
      await dialog.accept();
    });
    await loginForm.getByRole('button', { name: 'Login' }).click();
    await page.waitForTimeout(1000);
    await expect(page.locator('.login-container')).toBeVisible();
    await expect(page.locator('#mainApp')).toBeHidden();
  });


  test('Mock successful login API response', async ({ page }) => {
    await page.route('**/identitytoolkit.googleapis.com/**/accounts:signInWithPassword**', async (route) => {
        console.log('Intercepted:', route.request().url());
        await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
            kind: 'identitytoolkit#VerifyPasswordResponse',
            localId: 'mock-user-id-123',
            email: 'test@example.com',
            displayName: 'Test User',
            idToken: 'mock-id-token-xyz',
            registered: true,
            refreshToken: 'mock-refresh-token',
            expiresIn: '3600'
        })
        });
    });
    await page.route('**/identitytoolkit.googleapis.com/**/accounts:lookup**', async (route) => {
        console.log('Intercepted:', route.request().url());
        await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
            kind: 'identitytoolkit#GetAccountInfoResponse',
            users: [{
            localId: 'mock-user-id-123',
            email: 'test@example.com',
            displayName: 'Test User',
            emailVerified: true
            }]
        })
        });
    });
    await page.waitForLoadState('domcontentloaded');
    const loginForm = page.locator('#loginForm');
    await loginForm.getByPlaceholder('Username').fill('test@example.com');
    await loginForm.getByPlaceholder('Password').fill('password123');
    await Promise.all([
        page.waitForFunction(() => sessionStorage.getItem('isLoggedIn') === 'true', { timeout: 10000 }),
        loginForm.getByRole('button', { name: 'Login' }).click()
    ]);
    await expect(page.locator('#mainApp')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.login-container')).toBeHidden();
    });

    // I changed code from developer to use rest-api.
    test('Mock fetching multi-trainer questions from Firebase', async ({ page }) => {
        await page.route('**/js-project-f22e3-default-rtdb.firebaseio.com/questions/multiTrainer.json*', async (route) => {
        console.log('Firebase route intercepted:', route.request().url());
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
            'Adequate opportunity to clarify concepts',
            'Appropriate activities & interactions',
            'Trainer expertise & approachability',
            'Encouraged participation & enthusiasm'
            ])
        });
        });

        await page.goto('http://127.0.0.1:5501/edit.html');
        await page.waitForSelector('#questionList input', { timeout: 10000 });
        const inputs = await page.locator('#questionList input').all();
        expect(inputs.length).toBe(4);
        
        await expect(inputs[0]).toHaveValue('Adequate opportunity to clarify concepts');
        await expect(inputs[1]).toHaveValue('Appropriate activities & interactions');
        await expect(inputs[2]).toHaveValue('Trainer expertise & approachability');
        await expect(inputs[3]).toHaveValue('Encouraged participation & enthusiasm');
    });
});