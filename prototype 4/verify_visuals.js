const puppeteer = require('puppeteer');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\Dusanapudi.Ganesh\\.gemini\\antigravity\\brain\\17731cc2-4c59-43d8-81a7-ad375b68ff5b';

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    await page.goto('http://localhost:8080');

    // Wait for load
    await page.waitForTimeout(2000);

    // Base map screenshot
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'premium_base_map.png') });

    // Click Maharashtra IN-MH
    await page.click('#IN-MH');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'premium_maharashtra.png') });

    // Close overlay by clicking back
    await page.click('.btn-close-card');
    await page.waitForTimeout(1000);

    // Click Gujarat IN-GJ
    await page.click('#IN-GJ');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'premium_gujarat.png') });

    await browser.close();
    console.log('Screenshots captured successfully');
})();
