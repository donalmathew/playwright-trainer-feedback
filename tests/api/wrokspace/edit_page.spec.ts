import { test, expect } from '@playwright/test';

// --- Test Configuration ---
const databaseURL = 'https://js-project-f22e3-default-rtdb.firebaseio.com';

/**
 * This test suite focuses on the "Edit Questions" page functionality.
 */
test.describe('Edit Questions Page API Mocking', () => {

  /**
   * Test: Mocking the initial fetch of questions.
   * Scenario: When a user navigates to the Edit Questions page, we will intercept
   * the API call that fetches the questions and provide our own custom list.
   * We will then verify that our custom questions are displayed in the input fields.
   */
  test('should display mocked questions in the input fields on page load', async ({ page }) => {
    
    // Arrange: Define our own list of questions that we want to inject into the page.
    const myMockQuestions = [
      "TEST QUESTION 1: How clear were the trainer's explanations?",
      "TEST QUESTION 2: Was the training environment conducive to learning?",
      "TEST QUESTION 3: Did this question come from a mock API response?"
    ];

    // Arrange: Set up the network interception. This MUST be done BEFORE navigating
    // to the page, because the API call happens as soon as the page loads.
    await page.route(`**/${databaseURL}/questions/multiTrainer.json`, async route => {
      console.log(`Intercepted questions fetch on the Edit page: ${route.request().url()}`);

      // Fulfill the request with our custom mock data.
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(myMockQuestions),
      });
    });

    // Act: First, log in to the main application to get access to the navigation sidebar.
    await page.goto('http://127.0.0.1:5501/index1.html');
    const loginForm = page.locator('#loginForm');
    await loginForm.getByPlaceholder('Username').fill('donalmathewpt@gmail.com');
    await loginForm.getByPlaceholder('Password').fill('333333');
    await loginForm.getByRole('button', { name: 'Login' }).click();

    // Wait for the main application to appear to confirm a successful login
    await expect(page.locator('#mainApp')).toBeVisible();

    // Act: Click the "Edit Questions" link in the sidebar to navigate to the page.
    // This navigation is the action that triggers the API call we are intercepting.
    await page.getByRole('link', { name: 'Edit Questions' }).click();

    // Assert: Now, we verify that the page is displaying our mocked data.
    
    // 1. Check that the correct number of input fields has been rendered.
    const inputFields = page.locator('#questionList input');
    await expect(inputFields).toHaveCount(myMockQuestions.length);

    // 2. Check that each input field contains the exact text from our mock questions.
    // We can check each one individually for clarity.
    await expect(inputFields.nth(0)).toHaveValue(myMockQuestions[0]);
    await expect(inputFields.nth(1)).toHaveValue(myMockQuestions[1]);
    await expect(inputFields.nth(2)).toHaveValue(myMockQuestions[2]);

    console.log('Successfully verified that the Edit page displayed the mocked questions.');
  });

  test.only('should display 4 mocked questions after intercepting the API call', async ({ page }) => {
    
    // Arrange: Define our mock questions.
    const myMockQuestions = [
      "MOCK #1: How would you rate the trainer's expertise?",
      "MOCK #2: Were the activities and interactions appropriate?",
      "MOCK #3: Did the trainer encourage participation?",
      "MOCK #4: Was the overall learning objective met?"
    ];

    // Arrange: Set up the network interception with the robust glob pattern.
    // We will add a log inside to confirm if it's being triggered.
    await page.route('**/questions/multiTrainer.json', async route => {
      // THIS IS CRITICAL DEBUGGING: This line will ONLY appear in your
      // terminal if the interception is successful.
      console.log(`✅ SUCCESS: Intercepted API call to ${route.request().url()}`);

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(myMockQuestions),
      });
    });

    // Act: Log in to the application.
    await page.goto('http://127.0.0.1:5501/index1.html');
    const loginForm = page.locator('#loginForm');
    await loginForm.getByPlaceholder('Username').fill('donalmathewpt@gmail.com');
    await loginForm.getByPlaceholder('Password').fill('333333');
    await loginForm.getByRole('button', { name: 'Login' }).click();

    // Wait for the main application to appear to confirm a successful login
    await expect(page.locator('#mainApp')).toBeVisible();

    // Act: Click the link to navigate. This action will trigger the API call on the next page.
    await page.getByRole('link', { name: 'Edit Questions' }).click();

    // **THE FIX:** Explicitly wait for the network response to complete.
    // This pauses the test until the browser receives the data for the questions,
    // solving any timing or race condition issues.
    const response = await page.waitForResponse('**/questions/multiTrainer.json');

    // Optional Debugging: Confirm that the response we waited for was our mocked one.
    console.log(`Response Status: ${response.status()}`);
    console.log(`Response Body: ${JSON.stringify(await response.json())}`);

    // Assert: Now that we have waited for the API response to be processed,
    // we can safely check the state of the UI.
    const inputFields = page.locator('#questionList input');
    
    await expect(inputFields).toHaveCount(4);
    await expect(inputFields.nth(0)).toHaveValue(myMockQuestions[0]);
    await expect(inputFields.nth(1)).toHaveValue(myMockQuestions[1]);
    await expect(inputFields.nth(2)).toHaveValue(myMockQuestions[2]);
    await expect(inputFields.nth(3)).toHaveValue(myMockQuestions[3]);
  });
});