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
  page.on('pageerror', err => console.log('CONTENT ERROR:', err.toString()));
  
  await page.goto('https://example.com');
  await new Promise(r => setTimeout(r, 2000));
  
  const targets = await browser.targets();
  const extensionTarget = targets.find(target => target.type() === 'service_worker');
  const worker = await extensionTarget.worker();

  console.log("Injecting message from BG...");
  await worker.evaluate(async () => {
    const tabs = await chrome.tabs.query({active: true, currentWindow: true});
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "toggle-popup" });
    }
  });
  
  await new Promise(r => setTimeout(r, 2000));
  
  // Check DOM
  const hasPopup = await page.evaluate(() => {
    return !!document.querySelector('#aisr-ui');
  });
  console.log("Has aisr-ui wrapper?", hasPopup);
  
  if (hasPopup) {
    const isVisible = await page.evaluate(() => {
      const root = document.querySelector('#aisr-ui');
      // check if it has a shadow root
      if (!root.shadowRoot) return "No shadow root";
      // check if PopupContainer is inside Wrapper
      return !!root.shadowRoot.querySelector('.container');
    });
    console.log("Popup container visible in shadow root?", isVisible);
  }

  await browser.close();
})();
