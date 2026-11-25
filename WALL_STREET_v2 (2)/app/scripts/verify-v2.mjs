// Browser smoke test for the updated single-mode game. Run after npm run build.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4179','--strictPort'],{stdio:'ignore'});
let browser;
try {
  for(let i=0;i<50;i++){try{if((await fetch('http://127.0.0.1:4179')).ok)break;}catch{}await new Promise(r=>setTimeout(r,200));}
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4179');
  await page.getByRole('button',{name:'Начать карьеру'}).click();
  await page.getByRole('heading',{name:'Добро пожаловать на рынок'}).waitFor();
  await page.getByRole('button',{name:'Далее'}).click();
  await page.getByRole('button',{name:'Далее'}).click();
  await page.getByRole('button',{name:'$100,20',exact:true}).click();
  assert(await page.getByRole('button',{name:'Далее'}).isDisabled());
  await page.getByRole('button',{name:'$200,20',exact:true}).click();
  await page.getByRole('button',{name:'Далее'}).click();
  await page.getByRole('button',{name:'+10%',exact:true}).click();
  await page.getByRole('button',{name:'Далее'}).click();
  await page.getByRole('button',{name:'Распределить средства между активами'}).click();
  await page.getByRole('button',{name:'Далее'}).click();
  await page.getByRole('button',{name:'К первой сделке'}).click();
  await page.locator('.asset-row .asset-icon').first().waitFor();
  assert.equal(await page.locator('.asset-row .asset-icon').count(),23);
  await page.locator('.dh-actions .buy-btn').click();
  await page.getByRole('button',{name:/Подтвердить покупку/}).click();
  await page.locator('.dh-actions .sell-btn').click();
  await page.getByRole('button',{name:/Подтвердить продажу/}).click();
  await page.getByRole('dialog',{name:'Отчёт о результате'}).waitFor();
  assert.match(await page.locator('.result-value').innerText(),/\$/);
  await page.getByRole('button',{name:'Закрыть',exact:true}).click();
  await page.getByRole('button',{name:'Повторить обучение'}).click();
  await page.getByRole('button',{name:'Пропустить'}).click();
  await page.reload();
  await page.getByRole('button',{name:'Продолжить игру'}).click();
  await page.locator('.shell').waitFor();
  assert.equal(await page.locator('.tutorial-card').count(),0);
  assert.deepEqual(errors,[]);
  console.log('PASS: career, onboarding, asset icons, trade result, save/resume');
}finally{await browser?.close();server.kill();}
