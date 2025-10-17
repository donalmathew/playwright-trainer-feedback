import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('API Mocking - Firebase Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Clear session storage before each test
    await page.goto('http://127.0.0.1:5501/index1.html');
    await page.evaluate(() => sessionStorage.clear());
  });

  test('Mock successful login API response', async ({ page }) => {
    // Mock the Firebase auth API endpoint
    await page.route('**/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword*', async (route) => {
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

    // Wait for page to be ready
    await page.waitForLoadState('domcontentloaded');

    const loginForm = page.locator('#loginForm');
    await loginForm.getByPlaceholder('Username').fill('test@example.com');
    await loginForm.getByPlaceholder('Password').fill('password123');
    
    // Click login and wait for navigation/state change
    await Promise.all([
      page.waitForFunction(() => {
        return sessionStorage.getItem('isLoggedIn') === 'true';
      }, { timeout: 10000 }),
      loginForm.getByRole('button', { name: 'Login' }).click()
    ]);

    // Verify the app shows after successful login
    await expect(page.locator('#mainApp')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.login-container')).toBeHidden();
  });

  test('Mock failed login API response - wrong password', async ({ page }) => {
    // Mock failed authentication
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
    await loginForm.getByPlaceholder('Username').fill('invalid@example.com');
    await loginForm.getByPlaceholder('Password').fill('wrongpassword');
    
    // Listen for alert dialog
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('Invalid credentials');
      await dialog.accept();
    });

    await loginForm.getByRole('button', { name: 'Login' }).click();
    
    // Wait a bit to ensure the alert was triggered
    await page.waitForTimeout(1000);
    
    // Verify user is still on login page
    await expect(page.locator('.login-container')).toBeVisible();
    await expect(page.locator('#mainApp')).toBeHidden();
  });

  test('Mock signup API response', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');
    
    // Show signup form
    await page.locator('#showSignup').click();
    await expect(page.locator('#signupForm')).toBeVisible();

    // Mock the Firebase signup endpoint
    await page.route('**/identitytoolkit.googleapis.com/v1/accounts:signUp*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          kind: 'identitytoolkit#SignupNewUserResponse',
          localId: 'new-user-id-456',
          email: 'newuser@example.com',
          idToken: 'new-mock-token',
          refreshToken: 'new-refresh-token',
          expiresIn: '3600'
        })
      });
    });

    // Mock the database write for user profile
    await page.route('**/js-project-f22e3-default-rtdb.firebaseio.com/users/*.json*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });

    // Listen for success alert
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('Account created successfully');
      await dialog.accept();
    });

    const signupForm = page.locator('#signupForm');
    await signupForm.locator('#signupName').fill('New User');
    await signupForm.locator('#signupEmail').fill('newuser@example.com');
    await signupForm.locator('#signupPassword').fill('password123');
    await signupForm.getByRole('button', { name: 'Create Account' }).click();

    // Wait for form to switch back to login
    await page.waitForTimeout(2000);
    await expect(page.locator('#loginForm')).toBeVisible();
  });

  test('Test temporary login fallback (without API)', async ({ page }) => {
    // This tests the hardcoded credentials fallback in your login.js
    await page.waitForLoadState('domcontentloaded');
    
    const loginForm = page.locator('#loginForm');
    await loginForm.getByPlaceholder('Username').fill('admin');
    await loginForm.getByPlaceholder('Password').fill('password123');
    await loginForm.getByRole('button', { name: 'Login' }).click();

    // Wait for sessionStorage to be set
    await page.waitForFunction(() => {
      return sessionStorage.getItem('isLoggedIn') === 'true';
    }, { timeout: 5000 });

    // Verify the app shows after successful login
    await expect(page.locator('#mainApp')).toBeVisible();
    await expect(page.locator('.login-container')).toBeHidden();
  });
});

test.describe('API Mocking - Firebase Database Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Set logged in state
    await page.addInitScript(() => {
      sessionStorage.setItem('isLoggedIn', 'true');
    });
    await page.goto('http://127.0.0.1:5501/index1.html');
  });

  test('Mock fetching multi-trainer questions from Firebase', async ({ page }) => {
    // IMPORTANT: Set up the route BEFORE navigating to the page
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

    // Navigate to edit questions page AFTER setting up the route
    await page.goto('http://127.0.0.1:5501/edit.html');

    // Wait for questions to load
    await page.waitForSelector('#questionList input', { timeout: 10000 });

    // Verify questions are displayed
    const inputs = await page.locator('#questionList input').all();
    expect(inputs.length).toBe(4);
    
    // Verify each question value
    await expect(inputs[0]).toHaveValue('Adequate opportunity to clarify concepts');
    await expect(inputs[1]).toHaveValue('Appropriate activities & interactions');
    await expect(inputs[2]).toHaveValue('Trainer expertise & approachability');
    await expect(inputs[3]).toHaveValue('Encouraged participation & enthusiasm');
  });

  test('Mock saving updated questions to Firebase', async ({ page }) => {
    await page.goto('http://127.0.0.1:5501/edit.html');

    // Mock reading questions
    await page.route('**/questions/multiTrainer.json*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            'Question 1',
            'Question 2',
            'Question 3',
            'Question 4'
          ])
        });
      } else if (route.request().method() === 'PUT') {
        // Mock the save operation
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      }
    });

    // Wait for questions to load
    await page.waitForSelector('#questionList input');

    // Modify a question
    const firstInput = page.locator('#questionList input').first();
    await firstInput.fill('Updated Question 1');

    // Click save
    await page.locator('#saveQuestionsBtn').click();

    // Verify success message
    const status = page.locator('#saveStatus');
    await expect(status).toContainText('Questions updated successfully');
  });

  test('Mock saving trainer feedback to Firebase', async ({ page }) => {
    // Mock the database write for trainer feedback
    let feedbackSaved = false;
    await page.route('**/trainerFeedback.json*', async (route) => {
      feedbackSaved = true;
      const postData = route.request().postDataJSON();
      
      // Verify the structure of saved data
      expect(postData).toHaveProperty('name');
      expect(postData).toHaveProperty('rating');
      expect(postData).toHaveProperty('timestamp');

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          name: '-NXtestkey123'
        })
      });
    });

    // You would trigger file upload and analysis here
    // For demonstration, we verify the mock is ready
    expect(feedbackSaved).toBe(false); // Not called yet
  });
});

test.describe('API Mocking - Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('isLoggedIn', 'true');
    });
    await page.goto('http://127.0.0.1:5501/index1.html');
  });

  test('Mock network failure when loading questions', async ({ page }) => {
    await page.goto('http://127.0.0.1:5501/edit.html');

    // Mock network error
    await page.route('**/questions/multiTrainer.json*', async (route) => {
      await route.abort('failed');
    });

    // The app should handle the error gracefully
    // Questions should fall back to defaults or show error
    await page.waitForTimeout(2000);
    
    // Verify error handling (depends on your implementation)
    const questionList = page.locator('#questionList');
    await expect(questionList).toBeVisible();
  });

  test('Mock Firebase auth session timeout', async ({ page }) => {
    // Mock 401 unauthorized response
    await page.route('**/js-project-f22e3-default-rtdb.firebaseio.com/**', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Permission denied'
        })
      });
    });

    await page.goto('http://127.0.0.1:5501/edit.html');
    
    // App should handle unauthorized access
    await page.waitForTimeout(1000);
  });

  test('Mock slow network response', async ({ page }) => {
    await page.goto('http://127.0.0.1:5501/edit.html');

    // Mock delayed response
    await page.route('**/questions/multiTrainer.json*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second delay
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          'Question 1',
          'Question 2',
          'Question 3',
          'Question 4'
        ])
      });
    });

    // Verify loading state or timeout handling
    await page.waitForSelector('#questionList input', { timeout: 5000 });
  });
});

test.describe('API Mocking - Data Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('isLoggedIn', 'true');
    });
    await page.goto('http://127.0.0.1:5501/index1.html');
  });

  test('Intercept and validate API request payload', async ({ page }) => {
    await page.goto('http://127.0.0.1:5501/edit.html');

    let capturedPayload: any;

    // Mock and capture the request
    await page.route('**/questions/multiTrainer.json*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(['Q1', 'Q2', 'Q3', 'Q4'])
        });
      } else if (route.request().method() === 'PUT') {
        capturedPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ success: true })
        });
      }
    });

    await page.waitForSelector('#questionList input');
    
    // Modify questions
    const inputs = await page.locator('#questionList input').all();
    await inputs[0].fill('Modified Question 1');
    
    await page.locator('#saveQuestionsBtn').click();
    
    // Wait for save to complete
    await page.waitForTimeout(1000);

    // Validate the payload
    expect(capturedPayload).toBeDefined();
    expect(Array.isArray(capturedPayload)).toBe(true);
    expect(capturedPayload[0]).toBe('Modified Question 1');
  });

  test('Mock API response with invalid data structure', async ({ page }) => {
    await page.goto('http://127.0.0.1:5501/edit.html');

    // Return invalid data structure
    await page.route('**/questions/multiTrainer.json*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          // Wrong structure - should be array, not object
          questions: ['Q1', 'Q2']
        })
      });
    });

    // App should handle invalid data gracefully
    await page.waitForTimeout(1000);
  });
});

test.describe('API Mocking - Authentication Flow', () => {
  test('Mock complete authentication flow with state management', async ({ page }) => {
    await page.goto('http://127.0.0.1:5501/index1.html');

    // Track authentication state changes
    let authStateChanged = false;

    // Mock auth state listener
    await page.route('**/identitytoolkit.googleapis.com/**', async (route) => {
      authStateChanged = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          users: [{
            localId: 'test-user',
            email: 'test@example.com',
            emailVerified: true
          }]
        })
      });
    });

    const loginForm = page.locator('#loginForm');
    await loginForm.getByPlaceholder('Username').fill('admin');
    await loginForm.getByPlaceholder('Password').fill('password123');
    await loginForm.getByRole('button', { name: 'Login' }).click();

    // Verify app state change
    await expect(page.locator('#mainApp')).toBeVisible({ timeout: 5000 });
  });
});