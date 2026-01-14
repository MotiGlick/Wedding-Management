const { Builder, By, until } = require('selenium-webdriver');
const fs = require('fs');

const BASE_URL = 'https://wedding-management-0253.onrender.com';

async function takeScreenshot(driver, name) {
    const image = await driver.takeScreenshot();
    fs.writeFileSync(name, image, 'base64');
    console.log(`📸 Screenshot saved: ${name}`);
}

async function runWeddingProjectTests() {
    const driver = await new Builder().forBrowser('chrome').build();
    const timestamp = Date.now();

    const testUser = {
        fullName: `משתמש_${timestamp}`,
        email: `user${timestamp}@wedding-test.com`,
        password: `Wp!${timestamp}`
    };

    try {
        console.log(`\n🔍 Starting Unified Tests with user: ${testUser.email}\n`);

        // ==========================================
        // Test 1: Registration & Logout (REQUIREMENT)
        // ==========================================
        console.log('🚀 Test 1: Registration');
        await driver.get(`${BASE_URL}/registration.html`);
        await driver.wait(until.elementLocated(By.id('fullName')), 10000);
        await driver.findElement(By.id('fullName')).sendKeys(testUser.fullName);
        await driver.findElement(By.id('email')).sendKeys(testUser.email);
        await driver.findElement(By.id('password')).sendKeys(testUser.password);
        await driver.findElement(By.id('confirm')).sendKeys(testUser.password);
        await driver.findElement(By.id('terms')).click();
        await driver.findElement(By.id('submitBtn')).click();
        
        await driver.wait(until.urlContains('homePage.html'), 15000);
        console.log('✅ Registration Passed');

        // ניתוק מיידי לאחר הרישום
        console.log('🔄 Logging out after registration...');
        await driver.executeScript('sessionStorage.clear();');
        await driver.get(`${BASE_URL}/landing.html`);
        console.log('✅ Disconnected successfully after registration');

        // =============================
        // Test 2: Security Redirect
        // =============================
        console.log('🚀 Test 2: Security Redirect');
        await driver.get(`${BASE_URL}/homePage.html`);
        await driver.wait(until.urlContains('landing.html'), 10000);
        console.log('✅ Security Redirect Passed');

        // =============================
        // Test 3: Login
        // =============================
        console.log('🚀 Test 3: Login');
        await driver.get(`${BASE_URL}/login.html`);
        await driver.wait(until.elementLocated(By.id('email')), 10000);
        await driver.findElement(By.id('email')).sendKeys(testUser.email);
        await driver.findElement(By.id('password')).sendKeys(testUser.password);
        await driver.findElement(By.css('button[type="submit"]')).click();
        await driver.wait(until.urlContains('homePage.html'), 20000);
        console.log('✅ Login Passed');

        // =============================
        // Test 4: Task Creation
        // =============================
        console.log('🚀 Test 4: Task Creation');
        const taskTitle = `משימה_${timestamp}`;
        await driver.get(`${BASE_URL}/task.html`);
        await driver.wait(until.elementLocated(By.id('calendar')), 15000);
        await driver.wait(async () => {
            return await driver.executeScript('return typeof window.openAddTaskModal === "function"');
        }, 10000);
        await driver.executeScript(`window.openAddTaskModal('2026-06-15');`);
        await driver.wait(until.elementLocated(By.id('modal-task-title')), 5000);
        await driver.findElement(By.id('modal-task-title')).sendKeys(taskTitle);
        await driver.findElement(By.id('modal-save-btn')).click();
        await driver.wait(async () => {
            const text = await driver.findElement(By.id('task-list-display')).getText();
            return text.includes(taskTitle);
        }, 15000);
        console.log('✅ Task Creation Passed');

        // ==========================================
        // Test 5: Add Guest (ROBUST FIX)
        // ==========================================
        console.log('🚀 Test 5: Navigate to Guest List & Add Guest');
        
        await driver.get(`${BASE_URL}/AllGuests.html`);
        await driver.wait(until.elementLocated(By.css('a[href="Add_guest.html"]')), 10000);
        await driver.findElement(By.css('a[href="Add_guest.html"]')).click();

        await driver.wait(until.elementLocated(By.id('firstName')), 10000);
        const guestLastName = `ישראלי_${timestamp}`;
        
        await driver.findElement(By.id('firstName')).sendKeys('ישראל');
        await driver.findElement(By.id('lastName')).sendKeys(guestLastName);
        await driver.findElement(By.id('email')).sendKeys(`guest_${timestamp}@test.com`);

        // שימוש ב-JS כדי להבטיח בחירת ערכים ב-Select לפני השליחה (מונע שגיאת ENUM בשרת)
        await driver.executeScript(`
            document.getElementById('side').value = 'חתן';
            document.getElementById('rsvp').value = 'yes';
        `);

        // לחיצה על כפתור השליחה
        const submitBtn = await driver.findElement(By.css('button[type="submit"]'));
        await submitBtn.click();

        // טיפול ב-Alert כולל הדפסת תוכן השגיאה אם קיימת
        try {
            await driver.wait(until.alertIsPresent(), 10000);
            const alert = await driver.switchTo().alert();
            const alertText = await alert.getText();
            console.log(`🗨️ Alert text: ${alertText}`);
            await alert.accept();
        } catch (e) {
            console.log("⚠️ No alert detected, checking for redirect...");
        }

        // וידוי מעבר לדף הרשימה וטעינת הטבלה
        await driver.wait(until.urlContains('AllGuests.html'), 20000);
        const tableBody = await driver.wait(until.elementLocated(By.id('guestTableBody')), 15000);
        
        await driver.wait(async () => {
            const text = await tableBody.getText();
            return text.includes(guestLastName);
        }, 15000);

        console.log('✅ Guest Flow Passed');

    } catch (err) {
        console.error('\n❌ TEST FAILED:', err.message);
        await takeScreenshot(driver, `fail_${timestamp}.png`);
    } finally {
        console.log('\n🧹 Closing browser session...');
        await driver.quit();
    }
}

runWeddingProjectTests();

//node tests\selenium\test.js