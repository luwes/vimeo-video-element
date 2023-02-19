import process from 'node:process';
import { chromium } from 'playwright-core';
import { createServer } from './server.js';

try {
  const { url } = await createServer();
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage();

  page.on('console', event => {
    const msg = event.text();
    console.log(msg);

    const match = msg.match(/^# fail +(\d+)$/);
    if (match) {
      if (match[1] == 0) process.exit(0);
      else process.exit(1);
    }
  });

  await page.goto(`${url}/test/`);
  await page.waitForTimeout(15000);

  process.exit(2);
} catch (e) {
  console.error(e);
  process.exit(1);
}
