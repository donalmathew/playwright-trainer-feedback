import { test, expect } from '@playwright/test';


const API_KEY = 'AIzaSyAL2O0MUxmRySxab1lrLZ_BdihBUGO7uAM'; 
const loginUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
const signupUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`;

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
        expect(responseBody).toHaveProperty('idToken'); 
    });

    test('should fail login with an incorrect password', async ({ request }) => {
        const response = await request.post(loginUrl, {
            data: {
                email: testUser.email,
                password: 'wrongpassword',
                returnSecureToken: true
            },
            failOnStatusCode: false 
        });

        expect(response.status()).toBe(400); 
        const responseBody = await response.json();
        expect(responseBody.error.message).toBe('INVALID_LOGIN_CREDENTIALS');
    });
});