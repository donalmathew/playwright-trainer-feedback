import {test,expect} from '@playwright/test'
import {LoginPage} from './loginPage'

test.describe('Authentication and signup forms',()=>{
    test.beforeEach(async ({ page }) => {
        await page.goto('http://127.0.0.1:5501/index1.html');
    });

    test('Test the Login Functionality', async ({ page }) => {
        const login=new LoginPage(page)
        await login.loginTest('donalmathewpt@gmail.com','333333')
    });

    test('Verify login failure with invalid password', async ({ page }) => {
        const login=new LoginPage(page)
        await login.loginTest('donalmathewpt@gmail.com','wrongpassword')
    });

    test('Verify login failure with invalid username.', async ({ page }) => {
        const login=new LoginPage(page)
        await login.loginTest('wrong@user.com','333333')
    });

    test('Verify login failure with empty credentials.', async ({ page }) => {
        const login=new LoginPage(page)
        await login.loginTest('','')
    });

    test('Verify the "Sign up" link reveals the signup form.', async ({ page }) => {
        const login=new LoginPage(page)
        await login.revealSignupForm()
    });
})
