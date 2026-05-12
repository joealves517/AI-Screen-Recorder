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

  const dummyPage = await browser.newPage();
  await dummyPage.goto('chrome://extensions');

  const targets = await browser.targets();
  const extensionTarget = targets.find(target => target.type() === 'service_worker');
  
  if (!extensionTarget) {
    console.log('No service worker found!');
    await browser.close();
    return;
  }

  const worker = await extensionTarget.worker();
  
  worker.on('console', msg => console.log('BG LOG:', msg.text()));
  worker.on('error', err => console.log('BG ERROR:', err.toString()));
  
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
