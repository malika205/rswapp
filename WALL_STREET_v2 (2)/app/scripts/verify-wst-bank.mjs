/** verify-wst-bank.mjs — проверка банка, сравнения и песочницы. */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const DIST = join(ROOT, "dist");
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
const server = createServer(async (req, res) => {
  try {
    const raw = req.url === "/" ? "/index.html" : req.url.split("?")[0];
    const file = resolve(DIST, "." + decodeURIComponent(raw));
    if (!file.startsWith(DIST + sep)) { res.writeHead(403).end(); return; }
    res.writeHead(200, { "content-type": MIME[extname(file)] || "application/octet-stream" });
    res.end(await readFile(file));
  } catch { res.writeHead(404).end(); }
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(String(e)));
const fail = (m) => { console.error("FAIL:", m); process.exit(1); };

try {
  await page.goto(`http://127.0.0.1:${port}/`);
  await page.waitForSelector(".mode-card");
  // песочница: все функции разблокированы
  await page.click('.mode-card:has-text("ПЕСОЧНИЦА")');
  await page.waitForSelector(".topbar");
  const bal0 = await page.locator(".topbar .ts b").first().innerText();
  console.log("Старт песочницы:", bal0);

  // депозит
  await page.click('.tab:has-text("Банк")');
  await page.waitForSelector(".bank-card");
  await page.fill('.bank-card >> nth=0 >> input', "200000");
  await page.click('button:has-text("Положить")');
  await page.waitForTimeout(400);
  // кредит
  await page.fill('.bank-card >> nth=1 >> input', "100000");
  await page.click('button:has-text("Взять")');
  await page.waitForTimeout(400);
  await page.click('button:has-text("Погасить")');
  await page.waitForTimeout(400);
  const lockedCount = await page.locator(".locked").count();
  console.log("Заблокировано в песочнице (ожидается 0):", lockedCount);
  if (lockedCount > 0) fail("в песочнице не всё разблокировано");

  // улучшение
  await page.click('.upg >> nth=0 >> button');
  await page.waitForTimeout(400);
  const owned = await page.locator(".upg.owned").count();
  console.log("Куплено улучшений (ожидается 1):", owned);
  if (owned < 1) fail("улучшение не купилось");

  // сравнение активов
  await page.click('.tab:has-text("Биржа")');
  await page.click('.asset-row:has-text("BTC")');
  await page.click('button:has-text("Сравнить")');
  await page.click('.asset-row:has-text("ETH")');
  await page.click('button:has-text("Сравнить")');
  await page.waitForTimeout(500);
  const tags = await page.locator(".cmp-tag").count();
  console.log("Тегов сравнения (ожидается 2):", tags);
  if (tags !== 2) fail("сравнение не работает");

  // 1год таймфрейм
  await page.click('.tf-btn:has-text("1год")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(ROOT, "verification-shots", "13-sandbox-year.png") });

  if (errors.length) { console.error(errors.slice(0, 5)); fail("console errors"); }
  console.log("✅ BANK/SANDBOX VERIFY OK");
  await browser.close();
  server.close();
  process.exit(0);
} catch (e) {
  console.error("FAIL:", e.message);
  if (errors.length) console.error(errors.slice(0, 5));
  process.exit(1);
}
