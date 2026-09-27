import { test, expect } from '@playwright/test';
for(const era of [1970,1980,1990,2000]) {
 test(`Spotify state drives device ${era}`, async({page})=>{
  await page.route('https://open.spotify.com/embed/iframe-api/v1',route=>route.fulfill({contentType:'application/javascript',body:`
   window.onSpotifyIframeApiReady({createController(element, options, callback){
    const iframe=document.createElement('iframe'); element.replaceWith(iframe);
    const listeners={};
    window.spotifyTestUpdate=data=>listeners.playback_update?.({data});
    callback({addListener(name,fn){listeners[name]=fn},destroy(){iframe.remove()}});
   }});`}));
  await page.goto('/?era='+era);
  await page.getByRole('button',{name:'Abrir reproductor',exact:true}).click();
  await expect(page.locator('.spotify-player')).toHaveCount(1);
  const player=page.locator('.music-card');
  await expect(player).not.toHaveClass(/device-playing/);
  async function update(isPaused:boolean,isBuffering=false,position=1000){await page.evaluate(data=>(window as any).spotifyTestUpdate(data),{isPaused,isBuffering,position,duration:30000});}
  await update(false);
  await expect(player).toHaveClass(/device-playing/);
  await page.waitForTimeout(2100);
  await expect(player).toHaveClass(/device-playing/);
  await update(true);
  await expect(player).not.toHaveClass(/device-playing/);
  await update(false,true);
  await expect(player).not.toHaveClass(/device-playing/);
  await update(false);
  await expect(player).toHaveClass(/device-playing/);
  await update(false,false,30000);
  await expect(player).not.toHaveClass(/device-playing/);
  await update(false);
  await page.getByRole('button',{name:'Ocultar música y detener reproducción'}).click();
  await expect(player).not.toHaveClass(/device-playing/);
 });
}
