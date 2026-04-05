/**
 * screenshot.js – Take 5 screenshots of the Up the River score tracker.
 * Serves static files from the repo root, then drives Chromium via Playwright.
 */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

// ── Static file server ────────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, '..');
const OUT  = path.join(ROOT, 'screenshots');

const MIME = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
};

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
      const filePath = path.join(ROOT, urlPath);
      const ext = path.extname(filePath);
      try {
        const data = fs.readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(data);
      } catch {
        res.writeHead(404);
        res.end('Not found');
      }
    });
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, port });
    });
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function shot(page, name) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, name), fullPage: true });
  console.log('  ✓', name);
}

async function fillInputs(page, selector, values) {
  const inputs = await page.$$(selector);
  for (let i = 0; i < values.length; i++) {
    await inputs[i].fill(String(values[i]));
  }
}

/** Play one complete hand: fill values and click action twice (predict → tricks). */
async function playHand(page, predictions, tricks) {
  // Enter predictions
  await fillInputs(page, '#player-inputs input[type=number]', predictions);
  await page.click('#action-btn');
  await page.waitForTimeout(200);
  // Enter tricks
  await fillInputs(page, '#player-inputs input[type=number]', tricks);
  await page.click('#action-btn');
  await page.waitForTimeout(200);
}

// ── Main ──────────────────────────────────────────────────────────────────────

(async () => {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

  const { server, port } = await startServer();
  const BASE = `http://127.0.0.1:${port}`;
  console.log(`Server running at ${BASE}`);

  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });

  try {
    // ── 01-setup.png ─────────────────────────────────────────────────────────
    console.log('Taking 01-setup.png …');
    {
      const page = await ctx.newPage();
      await page.goto(BASE, { waitUntil: 'domcontentloaded' });

      // Add 3rd player
      await page.click('button.stepper-btn:not([id])'); // "+" button
      await page.waitForTimeout(200);

      // Fill names
      await page.fill('#pname-0', 'Alice');
      await page.fill('#pname-1', 'Bob');
      await page.fill('#pname-2', 'Carol');
      // Set max cards
      await page.fill('#max-cards', '5');

      await shot(page, '01-setup.png');
      await page.close();
    }

    // ── 02-predict.png ───────────────────────────────────────────────────────
    console.log('Taking 02-predict.png …');
    {
      const page = await ctx.newPage();
      await page.goto(BASE, { waitUntil: 'domcontentloaded' });

      await page.click('button.stepper-btn:not([id])');
      await page.waitForTimeout(200);

      await page.fill('#pname-0', 'Alice');
      await page.fill('#pname-1', 'Bob');
      await page.fill('#pname-2', 'Carol');
      await page.fill('#max-cards', '5');
      await page.click('button.btn.btn-primary.full-width');
      await page.waitForSelector('#game-screen.active');

      // Fill some predictions (hand 1 = 5 cards)
      const inputs = await page.$$('#player-inputs input[type=number]');
      await inputs[0].fill('2');
      await inputs[1].fill('1');
      await inputs[2].fill('1');

      await shot(page, '02-predict.png');
      await page.close();
    }

    // ── 03-tricks.png ────────────────────────────────────────────────────────
    console.log('Taking 03-tricks.png …');
    {
      const page = await ctx.newPage();
      await page.goto(BASE, { waitUntil: 'domcontentloaded' });

      await page.click('button.stepper-btn:not([id])');
      await page.waitForTimeout(200);

      await page.fill('#pname-0', 'Alice');
      await page.fill('#pname-1', 'Bob');
      await page.fill('#pname-2', 'Carol');
      await page.fill('#max-cards', '5');
      await page.click('button.btn.btn-primary.full-width');
      await page.waitForSelector('#game-screen.active');

      // Lock in predictions 2,1,1 → then fill tricks
      await fillInputs(page, '#player-inputs input[type=number]', [2, 1, 1]);
      await page.click('#action-btn');
      await page.waitForTimeout(300);

      // Fill tricks
      const inputs = await page.$$('#player-inputs input[type=number]');
      await inputs[0].fill('3');
      await inputs[1].fill('1');
      await inputs[2].fill('1');

      await shot(page, '03-tricks.png');
      await page.close();
    }

    // ── 04-scoreboard.png ────────────────────────────────────────────────────
    // Play hands 5→4→3 fully, then screenshot predict phase of hand 4 (2 cards)
    console.log('Taking 04-scoreboard.png …');
    {
      const page = await ctx.newPage();
      await page.goto(BASE, { waitUntil: 'domcontentloaded' });

      await page.click('button.stepper-btn:not([id])');
      await page.waitForTimeout(200);

      await page.fill('#pname-0', 'Alice');
      await page.fill('#pname-1', 'Bob');
      await page.fill('#pname-2', 'Carol');
      await page.fill('#max-cards', '5');
      await page.click('button.btn.btn-primary.full-width');
      await page.waitForSelector('#game-screen.active');

      // Hand 1: 5 cards – predictions 2,1,1 / tricks 3,1,1
      await playHand(page, [2, 1, 1], [3, 1, 1]);
      // Hand 2: 4 cards – predictions 1,2,1 / tricks 2,2,0
      await playHand(page, [1, 2, 1], [2, 2, 0]);
      // Hand 3: 3 cards – predictions 1,1,1 / tricks 1,1,1
      await playHand(page, [1, 1, 1], [1, 1, 1]);

      // Now in hand 4 (2 cards), predict phase
      await shot(page, '04-scoreboard.png');
      await page.close();
    }

    // ── 05-results.png ───────────────────────────────────────────────────────
    // maxCards=3 → hands: 3,2,1,1,2,3 (6 hands)
    console.log('Taking 05-results.png …');
    {
      const page = await ctx.newPage();
      await page.goto(BASE, { waitUntil: 'domcontentloaded' });

      await page.click('button.stepper-btn:not([id])');
      await page.waitForTimeout(200);

      await page.fill('#pname-0', 'Alice');
      await page.fill('#pname-1', 'Bob');
      await page.fill('#pname-2', 'Carol');
      await page.fill('#max-cards', '3');
      await page.click('button.btn.btn-primary.full-width');
      await page.waitForSelector('#game-screen.active');

      // 6 hands: 3,2,1,1,2,3
      await playHand(page, [1, 1, 1], [1, 1, 1]); // 3 cards
      await playHand(page, [1, 0, 1], [1, 0, 1]); // 2 cards
      await playHand(page, [0, 1, 0], [0, 1, 0]); // 1 card
      await playHand(page, [0, 1, 0], [0, 1, 0]); // 1 card
      await playHand(page, [1, 0, 1], [1, 0, 1]); // 2 cards
      await playHand(page, [1, 1, 1], [1, 1, 1]); // 3 cards

      await page.waitForSelector('#results-screen.active');
      await shot(page, '05-results.png');
      await page.close();
    }

  } finally {
    await browser.close();
    server.close();
    console.log('Done.');
  }
})();
