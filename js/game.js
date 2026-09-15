'use strict';
(async()=>{
 const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
 const names=['idle0','idle1','idle2','idle3','walk0','walk1','walk2','walk3','punch0','punch1'];const images={};
 const load=src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src;});
 try{await Promise.all(names.map(async n=>images[n]=await load('assets/'+n+'.png')));images.stage=await load('assets/stage1_night_street.png');images.title=await load('assets/title_screen.png');images.portrait=await load('assets/mite_portrait.png');images.yankee=await load('assets/enemies/yankee.png');images.ninja=await load('assets/enemies/ninja.png');images.horseman=await load('assets/enemies/horseman.png');images.boss=await load('assets/enemies/boss.png');}catch(e){document.getElementById('loading').textContent='画像を読み込めません。ZIPをすべて展開して開いてください。';return;}
 document.getElementById('loading').hidden=true;document.getElementById('loading').style.display='none';
 const input=new Mite.Input(),stage=new Mite.Stage(images.stage),player=new Mite.Player(stage);
 const world={enemies:[],projectiles:[],boss:null,sparks:[],mode:'title',score:0,startedLatch:false,shake:0,flash:0,banner:'',bannerT:0,clearT:0,lastGate:null,gameOverSfx:false,clearSfx:false,tapStart:false,bossFreeze:0,gateNotice:''};
 function reset(){player.x=160;player.y=stage.floor;player.vy=0;player.healFull();stage.cameraX=0;stage.lockX=null;world.enemies=[];world.projectiles=[];world.sparks=[];world.score=0;world.boss=null;world.shake=0;world.flash=0;world.banner='STAGE 1  夜の商店街';world.bannerT=2.2;world.clearT=0;world.lastGate=null;world.gameOverSfx=false;world.clearSfx=false;world.bossFreeze=0;world.gateNotice='';spawn();world.mode='play';}
 function spawn(){world.enemies.push(new Mite.Yankee(720),new Mite.Yankee(1140),new Mite.Yankee(1515),new Mite.Yankee(1590),new Mite.Ninja(1970),new Mite.Ninja(2255),new Mite.HorseMan(2590));world.boss=new Mite.Boss(3200);world.enemies.push(world.boss);}
 function addSpark(x,y,big=false){world.sparks.push({x,y,t:big?.23:.16,big});world.shake=Math.max(world.shake,big?.12:.055);}
 function hitTest(){const hb=player.hitbox;if(!hb)return;for(const e of world.enemies){if(e.dead||e.lastHit===player.attackId)continue;if(Mite.rectsOverlap(hb,e.body)){e.lastHit=player.attackId;e.damage(1,player.facing);world.score+=e instanceof Mite.Boss?250:100;addSpark(e.x,e.y-45,e instanceof Mite.Boss);}}}
 function update(dt){
  const startPressed=input.down('punch')||input.down('jump')||world.tapStart;
  world.tapStart=false;if(world.mode!=='play'){if(startPressed&&!world.startedLatch){world.startedLatch=true;reset();}if(!startPressed)world.startedLatch=false;return;}
  world.shake=Math.max(0,world.shake-dt);world.flash=Math.max(0,world.flash-dt);world.bannerT=Math.max(0,world.bannerT-dt);world.bossFreeze=Math.max(0,world.bossFreeze-dt);
  if(world.bossFreeze<=0)player.update(dt,input,stage);for(const e of world.enemies){if(world.bossFreeze<=0||e!==world.boss)e.update(dt,player,stage,world);}for(const p of world.projectiles)p.update(dt,player,stage,world);hitTest();world.enemies=world.enemies.filter(e=>!e.remove);world.projectiles=world.projectiles.filter(p=>!p.remove);for(const s of world.sparks)s.t-=dt;world.sparks=world.sparks.filter(s=>s.t>0);
  const aliveRange=(a,b)=>world.enemies.some(e=>!e.dead&&(e.spawnX??e.x)>=a&&(e.spawnX??e.x)<=b);
  if(player.x>610&&aliveRange(620,960))stage.lockX=930;
  else if(player.x>1390&&aliveRange(1400,1710))stage.lockX=1710;
  else if(player.x>1870&&aliveRange(1880,2350))stage.lockX=2350;
  else if(player.x>2440&&aliveRange(2440,2740))stage.lockX=2740;
  else if(player.x>2820&&world.boss&&!world.boss.dead)stage.lockX=3310;
  else stage.lockX=null;
  if(world.lastGate!==stage.lockX){if(world.lastGate==null&&stage.lockX!=null&&stage.lockX<3000){world.banner='ENEMY!';world.bannerT=.52;}else if(world.lastGate!=null&&stage.lockX==null){world.banner='GO! →';world.bannerT=.72;}world.lastGate=stage.lockX;}
  stage.updateCamera(player);
  if(player.x>2850&&world.boss&&!world.boss.entered){world.boss.entered=true;world.banner='BOSS  JL';world.bannerT=1.55;world.bossFreeze=.62;world.shake=.20;Mite.SFX?.boss();}
  if(player.dead){world.mode='gameover';world.startedLatch=true;if(!world.gameOverSfx){world.gameOverSfx=true;Mite.SFX?.gameover();}}
  if(world.boss&&world.boss.dead&&world.boss.remove){world.clearT+=dt;if(world.clearT>.15){world.mode='clear';world.startedLatch=true;if(!world.clearSfx){world.clearSfx=true;Mite.SFX?.clear();}}}
 }
 function barFrame(x,y,w,h,accent='#3b7cff'){ctx.fillStyle='#07122b';ctx.fillRect(x,y,w,h);ctx.fillStyle=accent;ctx.fillRect(x,y,w,3);ctx.fillStyle='#dcecff';ctx.fillRect(x,y,2,h);ctx.fillRect(x+w-2,y,2,h);ctx.fillRect(x,y+h-2,w,2);}
 function drawHud(){
  // Type-1 inspired compact HUD: portrait + simple retro gauge.
  barFrame(9,8,259,48,'#2f70e9');ctx.drawImage(images.portrait,12,10,46,40);ctx.fillStyle='#fff';ctx.font='bold 10px monospace';ctx.fillText('MITECHAN',62,21);ctx.fillText('HP',242,21);ctx.fillStyle='#202b43';ctx.fillRect(62,28,151,14);ctx.fillStyle=player.hp<=25?'#ff493f':'#ff2e68';ctx.fillRect(62,28,151*(player.hp/player.maxHp),14);ctx.fillStyle='#fff';ctx.font='bold 9px monospace';ctx.fillText(player.hp+' / 100',217,40);
  ctx.textAlign='right';ctx.font='bold 10px monospace';ctx.fillText('SCORE '+String(world.score).padStart(6,'0'),630,18);ctx.textAlign='left';const prog=Math.max(0,Math.min(1,(player.x-48)/(stage.width-124)));ctx.fillStyle='#17243a';ctx.fillRect(508,27,122,5);ctx.fillStyle='#f4c647';ctx.fillRect(508,27,122*prog,5);ctx.fillStyle='#fff';ctx.fillRect(508+122*prog-1,25,2,9);if(player.hp<=25){ctx.fillStyle=Math.floor(performance.now()/180)%2?'#ff4b57':'#ffd84a';ctx.font='bold 10px monospace';ctx.fillText('! DANGER',279,40);}
  if(world.boss&&!world.boss.dead&&world.boss.entered){barFrame(174,58,292,28,'#df4bc1');ctx.fillStyle='#fff';ctx.font='bold 10px monospace';ctx.fillText('BOSS',181,74);ctx.fillStyle='#271d38';ctx.fillRect(224,66,226,10);ctx.fillStyle='#ff2e68';ctx.fillRect(224,66,226*(world.boss.hp/world.boss.maxHp),10);ctx.textAlign='right';ctx.fillText(world.boss.hp+' / '+world.boss.maxHp,458,74);ctx.textAlign='left';}
 }
 function drawSpark(s){const x=Math.round(s.x-stage.cameraX),y=Math.round(s.y),k=s.big?1.35:1;ctx.save();ctx.translate(x,y);ctx.scale(k,k);ctx.fillStyle='#ff5c34';ctx.fillRect(-13,-2,26,4);ctx.fillRect(-2,-13,4,26);ctx.fillStyle='#ffd84a';ctx.fillRect(-9,-5,18,10);ctx.fillRect(-5,-9,10,18);ctx.fillStyle='#fff';ctx.fillRect(-3,-3,6,6);ctx.restore();}
 function drawPlay(){
  const mag=world.shake>0?Math.min(5,2+world.shake*20):0,ox=mag?(Math.random()-.5)*mag:0,oy=mag?(Math.random()-.5)*mag:0;ctx.save();ctx.translate(Math.round(ox),Math.round(oy));stage.draw(ctx);for(const p of world.projectiles)p.draw(ctx,stage);for(const e of world.enemies)e.draw(ctx,stage,images);player.draw(ctx,images,stage);for(const s of world.sparks)drawSpark(s);ctx.restore();drawHud();
  if(world.bannerT>0){const a=Math.min(1,world.bannerT*2);ctx.globalAlpha=a;ctx.fillStyle='rgba(5,10,20,.82)';ctx.fillRect(170,142,300,44);ctx.strokeStyle='#f4c647';ctx.strokeRect(171,143,298,42);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='bold 18px monospace';ctx.fillText(world.banner,320,171);ctx.textAlign='left';ctx.globalAlpha=1;}
 }
 function fitTitle(){ctx.fillStyle='#07111f';ctx.fillRect(0,0,640,360);const im=images.title,scale=Math.max(640/im.width,360/im.height),w=im.width*scale,h=im.height*scale;ctx.drawImage(im,(640-w)/2,(360-h)/2,w,h);ctx.fillStyle='rgba(3,8,18,.28)';ctx.fillRect(0,286,640,74);ctx.fillStyle='#07142d';ctx.fillRect(226,304,188,32);ctx.strokeStyle='#77b5ff';ctx.lineWidth=2;ctx.strokeRect(227,305,186,30);ctx.fillStyle='#fff';ctx.font='bold 17px monospace';ctx.textAlign='center';ctx.fillText('GAME START',320,326);ctx.font='9px monospace';ctx.fillText('画面タップ / A / B でスタート',320,349);ctx.textAlign='left';}
 function drawEnd(title,sub,accent){drawPlay();ctx.fillStyle='rgba(4,7,15,.80)';ctx.fillRect(0,0,640,360);ctx.strokeStyle=accent;ctx.lineWidth=3;ctx.strokeRect(160,106,320,146);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='bold 34px monospace';ctx.fillText(title,320,158);ctx.font='13px monospace';ctx.fillText(sub,320,193);ctx.fillText('SCORE  '+String(world.score).padStart(6,'0'),320,218);ctx.font='11px monospace';ctx.fillText('A / B でもう一度',320,240);if(title.includes('CLEAR')){for(let i=0;i<18;i++){const x=(i*73+Math.floor(performance.now()/22))%640,y=(i*47+Math.floor(performance.now()/14))%95+18;ctx.fillStyle=i%3===0?'#ffd84a':i%3===1?'#65b7ff':'#ff5c9b';ctx.fillRect(x,y,4,4);}}ctx.textAlign='left';}
 canvas.addEventListener('pointerdown',e=>{if(world.mode!=='play'){e.preventDefault();world.tapStart=true;Mite.SFX?.unlock();}},{passive:false});
 let previous=0,acc=0;const step=1/120;
 function loop(t){const dt=previous?Math.min((t-previous)/1000,.05):0;previous=t;if(!document.hidden){acc+=dt;while(acc>=step){update(step);acc-=step;}}if(world.mode==='title')fitTitle();else if(world.mode==='play')drawPlay();else if(world.mode==='gameover')drawEnd('GAME OVER','ミテちゃん、まだやれる！','#ff5757');else drawEnd('STAGE CLEAR!','ミテちゃんは最強だぜ！','#f4c647');requestAnimationFrame(loop);}
 document.addEventListener('visibilitychange',()=>{previous=0;acc=0;});
 window.miteState=()=>({mode:world.mode,x:player.x,screenX:player.x-stage.cameraX,cameraX:stage.cameraX,hp:player.hp,enemyCount:world.enemies.filter(e=>!e.dead).length,bossHp:world.boss?world.boss.hp:null,projectiles:world.projectiles.length,score:world.score,gate:stage.lockX});
 requestAnimationFrame(loop);
})();
