import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Application API Mocking Tests', () => {
// The URL for your Firebase Realtime Database to intercept API calls.
const databaseURL = 'https://js-project-f22e3-default-rtdb.firebaseio.com';
test('should intercept the request for questions and provide mock data', async ({ page }) => {
    // --- Step 1: Set up the Network Interception ---
// We tell Playwright to intercept the specific GET request for the questions.
// This must be set up BEFORE the page navigation.
await page.route(`**/${databaseURL}/questions/multiTrainer.json`, async route => {
  console.log('Intercepted API call to fetch questions:', route.request().url());

  // Define our fake (mocked) data that we want to send back to the application.
  const mockQuestions = [
    "MOCK QUESTION: Was the trainer prepared for the session?",
    "MOCK QUESTION: Were the examples and activities useful?",
    "MOCK QUESTION: Was the trainer engaging and interactive?",
    "MOCK QUESTION: Would you take another course with this trainer?"
  ];
  
  // Fulfill the intercepted request with our mock JSON body.
  // The application will now use this data instead of hitting the real Firebase database.
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(mockQuestions),
  });
});

// --- Step 2: Navigate to the application and log in ---
await page.goto('http://127.0.0.1:5501/index1.html');
const loginForm = page.locator('#loginForm');
await loginForm.getByPlaceholder('Username').fill('donalmathewpt@gmail.com');
await loginForm.getByPlaceholder('Password').fill('333333');
await loginForm.getByRole('button', { name: 'Login' }).click();

// Wait for the main application to appear to confirm a successful login
await expect(page.locator('#mainApp')).toBeVisible();

// --- Step 3: Perform the action that triggers the API call ---
// As we discovered, we must upload a file to trigger the 'processFile' function.

// **CORRECTED**: Use the new file path.
// This assumes your 'test-data' folder is in the root of your project.
const filePath = 'test-data/template.xlsx'; 
await page.locator('#fileInput').setInputFiles(filePath);

// Click the analyze button to trigger the processFile function, which contains the API call.
await page.getByRole('button', { name: 'Analyze Feedback' }).click();

// --- Step 4: Assert the outcome ---
// Our main goal is to confirm the application functions correctly with our mocked data.
// The analysis section appearing proves the app didn't crash and handled our fake response.
await expect(page.locator('#analysisSection')).toBeVisible();

// We can also check that the UI rendered some expected result from the Excel file.
// (You may need to adjust 'John Doe' to a trainer name from your template.xlsx file).
await expect(page.locator('.trainer-name')).toBeVisible();

console.log('Test completed successfully! The application worked with the mocked API response.');
});
});

