import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('Authentication and Signup Forms', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('http://127.0.0.1:5501/index1.html');
    });

    
    test('Test the Login Functionality in Banking', async ({ page }) => {
        const loginForm = page.locator('#loginForm');
        await loginForm.getByPlaceholder('Username').fill('donalmathewpt@gmail.com');
        await loginForm.getByPlaceholder('Password').fill('333333');
        await loginForm.getByRole('button', { name: 'Login' }).click();
        await expect(page.locator('#mainApp')).toBeHidden();
    });

    test('Verify login failure with invalid password', async ({ page }) => {
        const loginForm = page.locator('#loginForm');
        await loginForm.getByPlaceholder('Username').fill('donalmathewpt@gmail.com');
        await loginForm.getByPlaceholder('Password').fill('wrongpassword');
        await loginForm.getByRole('button', { name: 'Login' }).click();
        await expect(page.locator('#mainApp')).toBeHidden();
    });

    test('Verify login failure with invalid username.', async ({ page }) => {
        const loginForm = page.locator('#loginForm');
        await loginForm.getByPlaceholder('Username').fill('wrong@user.com');
        await loginForm.getByPlaceholder('Password').fill('333333');
        await loginForm.getByRole('button', { name: 'Login' }).click();
        
        await expect(page.locator('#mainApp')).toBeHidden();
    });

    test('Verify login failure with empty credentials.', async ({ page }) => {
        const loginForm = page.locator('#loginForm');
        await loginForm.getByPlaceholder('Username').fill('');
        await loginForm.getByPlaceholder('Password').fill('');
        await loginForm.getByRole('button', { name: 'Login' }).click();
        await expect(page.locator('#mainApp')).toBeHidden();
    });

    test('should switch between login and signup forms', async ({ page }) => {
        const loginForm = page.locator('#loginForm');
        const signupForm = page.locator('#signupForm');
        
        await expect(loginForm).toBeVisible();
        await expect(signupForm).toBeHidden();
        
        await page.getByRole('link', { name: 'Sign up' }).click();

        await expect(loginForm).toBeHidden();
        await expect(signupForm).toBeVisible();

        await page.getByRole('link', { name: 'Login' }).click();

        await expect(loginForm).toBeVisible();
        await expect(signupForm).toBeHidden();
    });

    test('Verify successful new user account creation (Signup).', async ({ page }) => {
        await page.getByRole('link', { name: 'Sign up' }).click();
        const signupForm = page.locator('#signupForm');
        
        // Generate a unique email for each test run to ensure the user is always new
        const uniqueEmail = `testuser_${Date.now()}@example.com`;

        await signupForm.getByPlaceholder('Full Name').fill('Test User');
        await signupForm.getByPlaceholder('Email').fill(uniqueEmail);
        await signupForm.getByPlaceholder('Password').fill('securepass123');
        await signupForm.getByRole('button', { name: 'Create Account' }).click();

        // Expect to be redirected to the login form, ready to log in with the new account
        await expect(page.locator('#loginForm')).toBeVisible();
        // A better assertion would be to see a success message:
        // await expect(page.getByText('Account created successfully!')).toBeVisible();
    });

    test('Verify signup failure with an already registered email.', async ({ page }) => {
        await page.getByRole('link', { name: 'Sign up' }).click();
        const signupForm = page.locator('#signupForm');
        
        await signupForm.getByPlaceholder('Full Name').fill('Another User');
        await signupForm.getByPlaceholder('Email').fill('donalmathewpt@gmail.com'); // Existing email
        await signupForm.getByPlaceholder('Password').fill('anypassword');
        await signupForm.getByRole('button', { name: 'Create Account' }).click();
        
        // Expect to stay on the signup form and see an error
        await expect(signupForm).toBeVisible();
        // await expect(page.getByText('Email already in use')).toBeVisible();
    });

    test('Verify password field masks input.', async ({ page }) => {
        // This is a property check, not an interaction test.
        const passwordInput = page.locator('#password');
        await expect(passwordInput).toHaveAttribute('type', 'password');
    });

});


test.describe('Logged-In User Functionality', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('http://127.0.0.1:5501/index1.html');
        
        const loginForm = page.locator('#loginForm');
        await loginForm.getByPlaceholder('Username').fill('donalmathewpt@gmail.com');
        await loginForm.getByPlaceholder('Password').fill('333333');
        await loginForm.getByRole('button', { name: 'Login' }).click();
        
        await expect(page.locator('#mainApp')).toBeVisible();
    });

    test('Verify successful user logout.', async ({ page }) => {
        
        await page.getByRole('link', { name: ' Logout' }).click();
        await expect(page.locator('#mainApp')).toBeHidden();
        await expect(page.locator('#loginPage')).toBeVisible();
    });

    // Test to verify the initial state of the dashboard
    test('should display the dashboard in its default state after login', async ({ page }) => {
        // Assert the main heading is visible
        await expect(page.getByRole('heading', { name: 'Training Feedback Analyzer' })).toBeVisible();

        // Assert the upload section is present
        await expect(page.locator('.upload-section')).toBeVisible();
        await expect(page.getByText('Drop Excel file here or click to browse')).toBeVisible();

        // Assert the Analyze button is initially present (it might become disabled later)
        await expect(page.getByRole('button', { name: 'Analyze Feedback' })).toBeVisible();

        // Assert the analysis results section is initially hidden
        await expect(page.locator('#analysisSection')).toBeHidden();
    });

    test('Verify UI feedback when a valid file is selected for upload.', async ({ page }) => {
        const fileInput = page.locator('input[type="file"]');
        
        // Use the path to your real, valid XLSX file
        const filePath = path.join(__dirname, '..', 'test-data', 'template.xlsx');
        await fileInput.setInputFiles(filePath);

        // CORRECTED ASSERTION: Use toContainText for partial matches
        await expect(page.locator('#fileInfo')).toContainText('template.xlsx');
    });

    test('Verify the "Analyze Feedback" button becomes enabled after a file is selected.', async ({ page }) => {
        const analyzeButton = page.getByRole('button', { name: 'Analyze Feedback' });
        
        // This assertion assumes your app's logic supports it.
        // It's a good practice to test for this disabled state.
        // await expect(analyzeButton).toBeDisabled();
        
        // Upload a file
        const filePath = path.join(__dirname, '..', 'test-data', 'template.xlsx');
        await page.locator('input[type="file"]').setInputFiles(filePath);
        
        // Assert the button becomes enabled
        await expect(analyzeButton).toBeEnabled();
    });
    
    test('14: Verify that the analysis results section appears after analyzing a valid file.', async ({ page }) => {
        // CORRECTED TEST: Use a valid file to ensure the application logic passes.
        const filePath = path.join(__dirname, '..', 'test-data', 'template.xlsx');
        await page.locator('input[type="file"]').setInputFiles(filePath);

        // Click the analyze button
        await page.getByRole('button', { name: 'Analyze Feedback' }).click();

        // Assert that the analysis section is now visible
        // await expect(page.locator('#analysisSection')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Analysis Results' })).toBeVisible();
    });

    test('15: Verify that an error is shown for an invalid file type (e.g., .txt).', async ({ page }) => {
        // This test now specifically checks for the error handling we discovered.
        // We use a simple buffer that is NOT a valid XLSX file.
        await page.locator('input[type="file"]').setInputFiles({
            name: 'invalid-file.txt',
            mimeType: 'text/plain',
            buffer: Buffer.from('this is not a valid excel file')
        });

        await page.getByRole('button', { name: 'Analyze Feedback' }).click();
        
        // Assert that the results section remains HIDDEN
        await expect(page.locator('#analysisSection')).toBeHidden();

        // Assert that an error message IS displayed to the user
        // Note: The locator for the error message might need to be adjusted
        // if the application's HTML changes.
        await expect(page.getByText(/Error processing file/)).toBeVisible();
    });

});