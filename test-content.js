const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const extensionPath = path.resolve('/Users/alvesoscar517gmail.com/projects/AI Screen Recorder/build');
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`
    ]
  });

  const page = await browser.newPage();
  
  page.on('console', msg => console.log('CONTENT LOG:', msg.text()));
  page.on('pageerror', err => console.log('CONTENT ERROR:', err.toString()));
  
  await page.goto('https://example.com');
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("Sending toggle-popup...");
  await page.evaluate(() => {
    window.postMessage({ type: 'toggle-popup' }, '*');
  });
  
  await new Promise(r => setTimeout(r, 3000));
  await browser.close();
})();
