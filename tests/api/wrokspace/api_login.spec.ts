import { test, expect } from '@playwright/test';

// No beforeEach needed for this specific test, as we set up differently inside.
// test.beforeEach(async ({page})=>{
//     await page.goto('http://127.0.0.1:5501/index1.html');
// })

test('should show an error message on API login failure', async({ page }) => {

    // ARRANGE: Set up the mock to simulate a failed login
    await page.route('*/**/v1/accounts:signInWithPassword*', async route => {
        const responseBody = { /* ... your error object ... */ };
        await route.fulfill({
            status: 400,
            body: JSON.stringify(responseBody)
        });
    });

    // ACT: Navigate and attempt to log in
    await page.goto('http://127.0.0.1:5501/index1.html');
    const loginForm = page.locator('#loginForm');
    await loginForm.getByPlaceholder('Username').fill('donalmathewpt@email.com');
    await loginForm.getByPlaceholder('Password').fill('333333');
    await loginForm.getByRole('button', { name: 'Login' }).click();

    // ASSERT: Use the CORRECT locator you found with "Pick Locator"
    // This is a likely candidate, as getByText is very robust.
    // const errorMessagePopup = page.getByText('INVALID_LOGIN_CREDENTIALS'); 
    
    // await expect(errorMessagePopup).toBeVisible();
});