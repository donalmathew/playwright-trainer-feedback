// tests/api.spec.ts
import { test, expect } from '@playwright/test';

// We'll define the full URLs we've discovered
// The 'key' will be specific to your Firebase project. You get it from the Network tab.
const API_KEY = 'AIzaSyAL2O0MUxmRySxab1lrLZ_BdihBUGO7uAM'; // <-- IMPORTANT: Replace this!
const loginUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
const signupUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`;

// This is your Realtime Database URL. We'll append '.json' to use its REST API.
const questionsUrl = 'https://js-project-f22e3-default-rtdb.firebaseio.com/multiTrainerQuestions.json';

const testUser = {
  email: 'donalmathewpt@gmail.com',
  password: '333333'
};

test.describe('API - Authentication', () => {

    test('should log in successfully with valid credentials', async ({ request }) => {
        const response = await request.post(loginUrl, {
            data: {
                email: testUser.email,
                password: testUser.password,
                returnSecureToken: true
            }
        });

        expect(response.status()).toBe(200);
        const responseBody = await response.json();
        expect(responseBody.email).toBe(testUser.email);
        expect(responseBody).toHaveProperty('idToken'); // Firebase calls it idToken
    });

    test('should fail login with an incorrect password', async ({ request }) => {
        const response = await request.post(loginUrl, {
            data: {
                email: testUser.email,
                password: 'wrongpassword',
                returnSecureToken: true
            },
            // We expect this to fail, so we tell Playwright not to throw an error on a non-2xx status
            failOnStatusCode: false 
        });

        expect(response.status()).toBe(400); // Firebase auth errors are often 400 Bad Request
        const responseBody = await response.json();
        expect(responseBody.error.message).toBe('INVALID_LOGIN_CREDENTIALS');
    });
});