import { test, expect } from '@playwright/test';

test.beforeEach(async({page}) => {
    await page.goto('http://127.0.0.1:5501/index1.html')
});

test('Login',async({page})=>{
    await page.getByRole('textbox',{name: "Username"}).first().click()
    await page.getByRole('textbox',{name:"Username"}).fill('donalmathewpt@gmail.com')
    await page.getByRole('textbox',{name:"Password"}).fill('333333')
    await page.getByRole('button').click() 
})

test('Checking Header',async({page})=>{
    await page.getByRole('textbox',{name: "Username"}).first().click()
    await page.getByRole('textbox',{name:"Username"}).fill('donalmathewpt@gmail.com')
    await page.getByRole('textbox',{name:"Password"}).fill('333333')
    await page.getByRole('button').click() 
    await expect(page).toHaveTitle(/Training Feedback Analyzer/); 
})

test('Clicking a link',async({page})=>{
    await page.getByRole('textbox',{name: "Username"}).first().click()
    await page.getByRole('textbox',{name:"Username"}).fill('donalmathewpt@gmail.com')
    await page.getByRole('textbox',{name:"Password"}).fill('333333')
    await page.getByRole('button').click()

    await page.getByRole('link', { name: ' Edit Questions' }).click();  
})

test('Accessing via Id',async({page})=>{
    await page.locator('#username').click();
})

test('Accessing child elements',async({page})=>{
    await page.getByRole('textbox',{name: "Username"}).first().click()
    await page.getByRole('textbox',{name:"Username"}).fill('donalmathewpt@gmail.com')
    await page.getByRole('textbox',{name:"Password"}).fill('333333')
    await page.getByRole('button').click()

    await page.locator('.upload-section').locator('#analyzeBtn').click();
})

test('Updating question',async({page})=>{
    await page.getByRole('textbox',{name: "Username"}).first().click()
    await page.getByRole('textbox',{name:"Username"}).fill('donalmathewpt@gmail.com')
    await page.getByRole('textbox',{name:"Password"}).fill('333333')
    await page.getByRole('button').click()

    await page.getByRole('link', { name: ' Edit Questions' }).click();
    await page.locator('#question-0').click();
    await page.locator('#question-0').fill("new question");
})

test('Reusing FIlters for signin',async({page})=>{
    const username = page.getByRole('textbox',{name: "Username"})
    await username.first().click()
    await username.fill('donalmathewpt@gmail.com')
    await page.getByRole('textbox',{name:"Password"}).fill('333333')
    await page.getByRole('button').click()
})

test('Assertion',async({page})=>{
    const username = page.getByRole('textbox',{name: "Username"})
    await username.first().click()
    await username.fill('donalmathewpt@gmail.com')
    await expect(username).toHaveValue('donalmathewpt@gmail.com')
})

test.only('Extracting Values',async({page})=>{
    const username = page.getByRole('textbox', { name: "Username" });
    await username.click();
    await username.fill('donalmathewpt@gmail.com');
    await page.getByRole('textbox', { name: "Password" }).fill('333333');
    await page.getByRole('button').click();

    await page.getByRole('link', { name: ' Edit Questions' }).click();
    const question1 = await page.locator('#question-0').inputValue();
    console.log('Extracted question:', question1);
    expect(question1).toContain('Adequat oppotunities to clarify concepts');
})

