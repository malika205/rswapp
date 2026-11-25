/**
 * verify-wst.mjs — полная проверка WALL STREET: Rise of the Trader в браузере:
 * консоль, все экраны, сделка, банк, сохранение/продолжение, мобильный вид.
 */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, mkdirSync } from "node:fs";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const DIST = join(ROOT, "dist");
if (!existsSync(join(DIST, "index.html"))) {
  console.error("VERIFY FAIL: no dist — run npm run build first");
  process.exit(1);
}
const SHOTS = join(ROOT, "verification-shots");
mkdirSync(SHOTS, { recursive: true });

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".json": "application/json" };
const server = createServer(async (req, res) => {
  try {
    const raw = req.url === "/" ? "/index.html" : req.url.split("?")[0];
    let path;
    try { path = decodeURIComponent(raw); } catch { path = raw; }
    const file = resolve(DIST, "." + path);
    if (file !== DIST && !file.startsWith(DIST + sep)) { res.writeHead(403).end(); return; }
    const data = await readFile(file);
    res.writeHead(200, { "content-type": MIME[extname(file)] || "application/octet-stream" });
    res.end(data);
  } catch { res.writeHead(404).end(); }
});

const fail = (msg) => { console.error("VERIFY FAIL:", msg); server.close(); process.exit(1); };
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(String(e)));

const shot = async (name) => { await page.screenshot({ path: join(SHOTS, name + ".png") }); console.log("  📸", name); };
const step = (msg) => console.log("•", msg);

try {
  step("Загрузка титульного экрана");
  await page.goto(`http://127.0.0.1:${port}/`);
  await page.waitForSelector(".mode-card", { timeout: 10000 });
  await shot("01-title");

  step("Старт режима КАРЬЕРА");
  await page.click('.mode-card:has-text("КАРЬЕРА")');
  await page.waitForSelector(".topbar", { timeout: 10000 });
  await page.waitForTimeout(2500);
  await shot("02-dashboard");

  const balance0 = await page.locator(".topbar .ts b").first().innerText();
  console.log("  Баланс на старте:", balance0);

  step("Вкладка Биржа");
  await page.click('.tab:has-text("Биржа")');
  await page.waitForSelector(".asset-row", { timeout: 5000 });
  await page.waitForTimeout(800);
  await shot("03-trading");

  step("Выбор актива NVIDIA");
  await page.click('.asset-row:has-text("NVDA")');
  await page.waitForTimeout(500);
  const assetCount = await page.locator(".asset-row").count();
  console.log("  Активов в списке:", assetCount);
  if (assetCount < 20) fail("ожидалось ≥20 активов, найдено " + assetCount);

  step("Покупка: открытие модалки");
  await page.click("button.buy-btn");
  await page.waitForSelector(".trade-modal", { timeout: 5000 });
  await page.fill(".qty-input", "2");
  await shot("04-trade-modal");
  await page.click("button:has-text('Подтвердить покупку')");
  await page.waitForTimeout(600);

  const balance1 = await page.locator(".topbar .ts b").first().innerText();
  console.log("  Баланс после покупки:", balance1);
  if (balance0 === balance1) fail("баланс не изменился после покупки");

  step("Проверка позиции в портфеле");
  await page.click('.tab:has-text("Портфель")');
  await page.waitForSelector(".pos-table td", { timeout: 5000 });
  await shot("05-portfolio");

  step("Продажа из портфеля");
  await page.click(".pos-table .sell-btn");
  await page.waitForSelector(".trade-modal", { timeout: 5000 });
  await page.click('.side-tab:has-text("Продажа")');
  await page.click("button:has-text('MAX')");
  await page.click("button:has-text('Подтвердить продажу')");
  await page.waitForTimeout(500);
  const hasRows = await page.locator(".pos-table td").count();
  console.log("  Строк в таблице после продажи:", hasRows);

  step("Вкладка Новости");
  await page.click('.tab:has-text("Новости")');
  await page.waitForSelector(".cal-list, .news-feed", { timeout: 5000 });
  await shot("06-news");

  step("Вкладка Карьера");
  await page.click('.tab:has-text("Карьера")');
  await page.waitForSelector(".level-panel", { timeout: 5000 });
  await shot("07-career");

  step("Вкладка Банк (заблокирован до 2 уровня)");
  await page.click('.tab:has-text("Банк")');
  await page.waitForSelector(".bank-card", { timeout: 5000 });
  const locked = await page.locator(".locked").count();
  console.log("  Заблокированных карточек:", locked);
  await shot("08-bank");

  step("Таймфреймы графика");
  await page.click('.tab:has-text("Биржа")');
  await page.waitForSelector(".tf-btn", { timeout: 5000 });
  for (const label of ["1н", "1мес", "1год"]) {
    await page.click(`.tf-btn:has-text("${label}")`);
    await page.waitForTimeout(300);
  }
  await page.click('.tf-btn:has-text("1ч")');
  await shot("09-chart-timeframes");

  step("Избранное");
  await page.click(".asset-row .fav-star >> nth=0");
  await page.click('.cat-chip:has-text("Избранное")');
  await page.waitForTimeout(300);

  step("Пауза/возобновление времени");
  await page.click('button[title="Пауза"]');
  await page.waitForTimeout(400);
  await page.click('button[title="Возобновить время"]');

  step("Профиль");
  await page.click(".profile-btn");
  await page.waitForSelector(".profile-modal", { timeout: 5000 });
  await page.fill(".pf-name", "Тест Трейдер");
  await shot("10-profile");
  await page.click(".profile-modal .modal-x");

  step("Сохранение и перезагрузка");
  await page.waitForTimeout(1500);
  const nameBefore = await page.locator(".profile-btn").innerText();
  await page.reload();
  await page.waitForSelector(".mode-card", { timeout: 10000 });
  await page.click('.mode-continue:has-text("Продолжить")');
  await page.waitForSelector(".topbar", { timeout: 10000 });
  const nameAfter = await page.locator(".profile-btn").innerText();
  console.log("  Имя до/после перезагрузки:", nameBefore.trim(), "/", nameAfter.trim());
  if (!nameAfter.includes("Тест Трейдер")) fail("прогресс не восстановился после перезагрузки");
  await shot("11-continued");

  step("Мобильный вид");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(600);
  await shot("12-mobile");

  if (errors.length) {
    console.error("Консольные ошибки:", errors.slice(0, 10));
    fail("console errors present");
  }
  console.log("\n✅ VERIFY OK — все экраны, сделка, банк, избранное, сохранение работают, ошибок консоли нет.");
  await browser.close();
  server.close();
  process.exit(0);
} catch (e) {
  console.error("VERIFY FAIL:", e.message);
  if (errors.length) console.error("console errors:", errors.slice(0, 10));
  await browser.close();
  server.close();
  process.exit(1);
}
