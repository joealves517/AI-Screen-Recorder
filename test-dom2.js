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
  
  // Check DOM recursively
  const content = await page.evaluate(() => {
    let html = "No aisr-ui";
    const el = document.querySelector('#aisr-ui');
    if (el) {
       html = el.innerHTML;
       // react-shadow injects a wrapper div that has the shadow root
       const shadowHost = el.firstChild;
       if (shadowHost && shadowHost.shadowRoot) {
           return "SHADOW ROOT FOUND! Inner HTML: " + shadowHost.shadowRoot.innerHTML.slice(0, 500);
       }
    }
    return html;
  });
  console.log("Content:", content);

  await browser.close();
})();
