import { test, expect } from '@playwright/test';
for (const era of [1970,1980,1990,2000]) {
 test(`colección de cinco temas ${era}`, async ({page}) => {
  await page.route('https://open.spotify.com/embed/**', route => route.fulfill({contentType:'text/html',body:'Spotify de prueba'}));
  await page.setViewportSize({width:1440,height:1000});
  await page.goto(`/?era=${era}`);
  const trigger=page.getByRole('button',{name:/Elegir canción/});
  await trigger.click();
  const dialog=page.locator('.song-picker');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.song-choice')).toHaveCount(5);
  await page.screenshot({path:`test-results/song-library-${era}.png`});
  for(let i=0;i<5;i++) {
   if(i) await trigger.click();
   const option=dialog.locator('.song-choice').nth(i);
   const title=await option.locator('strong').innerText();
   await option.click();
   await expect(dialog).not.toBeVisible();
   await expect(page.locator('.track-open strong')).toHaveText(title);
  }
  await expect(page.locator('.spotify-player')).toHaveCount(0);
  await page.getByRole('button',{name:'Pista siguiente'}).click();
  await expect(trigger).toContainText('1 / 5');
  await page.getByRole('button',{name:'Pista anterior'}).click();
  await expect(trigger).toContainText('5 / 5');
  await page.getByRole('button',{name:'Abrir reproductor',exact:true}).click();
  const previous=await page.locator('.spotify-player').getAttribute('src');
  await trigger.click();
  await dialog.locator('.song-choice').nth(2).click();
  await expect(page.locator('.spotify-player')).not.toHaveAttribute('src',previous!);
  await trigger.click();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await page.setViewportSize({width:390,height:844});
  await trigger.click();
  await expect(dialog).toBeVisible();
  const box=await dialog.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x+box!.width).toBeLessThanOrEqual(390);
  await dialog.locator('.song-choice').last().click();
  await trigger.click();
  await page.screenshot({path:`test-results/song-library-mobile-${era}.png`});
  await page.mouse.click(2,2);
  await expect(dialog).not.toBeVisible();
 });
}

for (const era of [1970,1980,1990]) {
 test(`arrastrar al equipo ${era}`,async({page})=>{
  await page.setViewportSize({width:1440,height:1000});
  await page.goto(`/?era=${era}`);
  await page.getByRole('button',{name:/Elegir canción/}).click();
  const choice=page.locator('.song-choice').nth(2);
  const title=await choice.locator('strong').innerText();
  await choice.dragTo(page.locator('.device-illustration'));
  await expect(page.locator('.track-open strong')).toHaveText(title);
  await expect(page.locator('.song-picker')).not.toBeVisible();
  await expect(page.locator('.music-card')).toHaveClass(/device-changing/);
  await expect(page.locator('.spotify-player')).toHaveCount(0);
  await expect(page.locator('.music-card')).not.toHaveClass(/device-changing/,{timeout:4000});
 });
}
