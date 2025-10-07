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

    test.skip('Verify successful new user account creation (Signup).', async ({ page }) => {
        await page.getByRole('link', { name: 'Sign up' }).click();
        const signupForm = page.locator('#signupForm');
        
        const uniqueEmail = `testuser_${Date.now()}@example.com`;

        await signupForm.getByPlaceholder('Full Name').fill('Test User');
        await signupForm.getByPlaceholder('Email').fill(uniqueEmail);
        await signupForm.getByPlaceholder('Password').fill('securepass123');
        await signupForm.getByRole('button', { name: 'Create Account' }).click();

        await expect(page.locator('#loginForm')).toBeVisible();
    });

    test('Verify signup failure with an already registered email.', async ({ page }) => {
        await page.getByRole('link', { name: 'Sign up' }).click();
        const signupForm = page.locator('#signupForm');
        
        await signupForm.getByPlaceholder('Full Name').fill('Another User');
        await signupForm.getByPlaceholder('Email').fill('donalmathewpt@gmail.com'); 
        await signupForm.getByPlaceholder('Password').fill('anypassword');
        await signupForm.getByRole('button', { name: 'Create Account' }).click();
        
        await expect(signupForm).toBeVisible();
    });

    test('Verify password field masks input.', async ({ page }) => {
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

    test('Verify initial state of the dashboard page.', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Training Feedback Analyzer' })).toBeVisible();

        await expect(page.locator('.upload-section')).toBeVisible();
        await expect(page.getByText('Drop Excel file here or click to browse')).toBeVisible();

        await expect(page.getByRole('button', { name: 'Analyze Feedback' })).toBeVisible();

        await expect(page.locator('#analysisSection')).toBeHidden();
    });

    test('Verify UI feedback when a valid file is selected for upload.', async ({ page }) => {
        const fileInput = page.locator('input[type="file"]');
        
        const filePath = path.join(__dirname, '..', 'test-data', 'template.xlsx');
        await fileInput.setInputFiles(filePath);

        await expect(page.locator('#fileInfo')).toContainText('template.xlsx');
    });

    test('Verify the "Analyze Feedback" button becomes enabled after a file is selected.', async ({ page }) => {
        const analyzeButton = page.getByRole('button', { name: 'Analyze Feedback' });

        const filePath = path.join(__dirname, '..', 'test-data', 'template.xlsx');
        await page.locator('input[type="file"]').setInputFiles(filePath);

        await expect(analyzeButton).toBeEnabled();
    });
    
    test('14: Verify that the analysis results section appears after analyzing a valid file.', async ({ page }) => {
        const filePath = path.join(__dirname, '..', 'test-data', 'template.xlsx');
        await page.locator('input[type="file"]').setInputFiles(filePath);

        await page.getByRole('button', { name: 'Analyze Feedback' }).click();

        await expect(page.getByRole('heading', { name: 'Analysis Results' })).toBeVisible();
    });

    test('15: Verify that an error is shown for an invalid file type (e.g., .txt).', async ({ page }) => {
        await page.locator('input[type="file"]').setInputFiles({
            name: 'invalid-file.txt',
            mimeType: 'text/plain',
            buffer: Buffer.from('this is not a valid excel file')
        });
        await page.getByRole('button', { name: 'Analyze Feedback' }).click();
        
        await expect(page.locator('#analysisSection')).toBeHidden();
        await expect(page.getByText(/Error processing file/)).toBeVisible();
    });

    test('Verify that an error is shown for a structurally invalid spreadsheet (e.g., empty).',async({page})=>{
        const filePath = path.join(__dirname, '..', 'test-data', 'Book.xlsx');
        await page.locator('input[type="file"]').setInputFiles(filePath);
        await page.getByRole('button',{name:'Analyze Feedback'}).click()
        await expect(page.getByRole('heading', { name: 'Analysis Results' })).toBeHidden();
    })

    test('Verify the state of the sidebar menu on the dashboard.',async({page})=>{
        const dashboardLink = page.getByRole('link', { name: 'Dashboard' });
        const editQuestionsLink = page.getByRole('link', { name: 'Edit Questions' });
        await expect(dashboardLink.locator('..')).toHaveClass(/active/);
        await expect(editQuestionsLink.locator('..')).not.toHaveClass(/active/);
    })

    test('Verify navigation from Dashboard to Edit Questions page.',async({page})=>{
        const dashboardLink = page.getByRole('link', { name: 'Dashboard' });
        const editQuestionsLink = page.getByRole('link', { name: 'Edit Questions' });
        await expect(dashboardLink.locator('..')).toHaveClass(/active/);

        await editQuestionsLink.click();
        await expect(page).toHaveURL(/edit.html/);
        await expect(page.getByRole('heading', { name: 'Edit Multi-Trainer Questions' })).toBeVisible();
    })

    test('Verify that the button "Generate PDF Reports" is clickable.',async({page})=>{
        const filePath = path.join(__dirname, '..', 'test-data', 'template.xlsx');
        await page.locator('input[type="file"]').setInputFiles(filePath);
        await page.getByRole('button', { name: 'Analyze Feedback' }).click();

        await expect(page.locator('#analysisSection')).toBeVisible();

        const generatePdfButton = page.getByRole('button', { name: 'Generate PDF Reports' });
        await generatePdfButton.click();
    })

    

});