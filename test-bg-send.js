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
  
  const targets = await browser.targets();
  const extensionTarget = targets.find(target => target.type() === 'service_worker');
  const worker = await extensionTarget.worker();
  worker.on('console', msg => console.log('BG LOG:', msg.text()));
  worker.on('error', err => console.log('BG ERROR:', err.toString()));

  console.log("Injecting message from BG...");
  await worker.evaluate(async () => {
    const tabs = await chrome.tabs.query({active: true, currentWindow: true});
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "toggle-popup" });
    }
  });
  
  await new Promise(r => setTimeout(r, 3000));
  await browser.close();
})();
