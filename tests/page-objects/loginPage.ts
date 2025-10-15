import {Page} from "@playwright/test";
import { expect } from "@playwright/test";

export class LoginPage{
    readonly page: Page

    constructor(page: Page){
        this.page=page
    }

    async loginTest(username:string, password:string){
        const loginForm = this.page.locator('#loginForm');
        await loginForm.getByPlaceholder('Username').fill(username);
        await loginForm.getByPlaceholder('Password').fill(password);
        await loginForm.getByRole('button', { name: 'Login' }).click();
        await expect(this.page.locator('#mainApp')).toBeHidden();
    }

    async revealSignupForm(){
        const loginForm = this.page.locator('#loginForm');
        const signupForm = this.page.locator('#signupForm');
        await expect(loginForm).toBeVisible();
        await expect(signupForm).toBeHidden();
        await this.page.getByRole('link', { name: 'Sign up' }).click();
        await expect(loginForm).toBeHidden();
        await expect(signupForm).toBeVisible();
    }
}