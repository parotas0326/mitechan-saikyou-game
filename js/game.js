'use strict';
(async()=>{
 const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
 const names=['idle0','idle1','idle2','idle3','walk0','walk1','walk2','walk3','punch0','punch1'];const images={};
 const load=src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src;});
 try{
  await Promise.all(names.map(async n=>images[n]=await load('assets/'+n+'.png')));
  images.stage=await load('assets/stage1_night_street.png');images.title=await load('assets/title_screen.png');images.portrait=await load('assets/mite_portrait_power.png');images.dragon=await load('assets/hyper_ultra_seiryuuha_forward.png');images.cutin=await load('assets/special_cutin.jpg');images.bossCutin=await load('assets/boss_cutin.png');images.acorn=await load('assets/acorn.png');
  images.yankee=await load('assets/enemies/yankee.png');images.ninja=await load('assets/enemies/ninja.png');images.horseman=await load('assets/enemies/horseman.png');images.horseMount=await load('assets/enemies/horse_mount.png');images.horseRider=await load('assets/enemies/horse_rider.png');images.boss=await load('assets/enemies/boss.png');
  images.stage2=await load('assets/stage2/background.jpg');images.stage2BossCutin=await load('assets/stage2/boss_cutin.jpg');
  for(let i=0;i<6;i++){images['s2_mob1_'+i]=await load('assets/stage2/mob1_'+i+'.png');images['s2_mob2_'+i]=await load('assets/stage2/mob2_'+i+'.png');}
  images.s2_tank=await load('assets/stage2/tank.png');
  images.s2_boss_idle=await load('assets/stage2/boss_idle.png');images.s2_boss_hurt=await load('assets/stage2/boss_hurt.png');
  for(let i=0;i<8;i++)images['s2_boss_attack_'+i]=await load('assets/stage2/boss_attack_'+i+'.png');
  images.gameClear=await load('assets/game_clear.png');images.gameOver=await load('assets/gameover_mite.png');images.continueButton=await load('assets/continue_button.png');images.stage3BossCutin=await load('assets/stage3_boss_cutin.png');images.finalClearCutin=await load('assets/final_clear_cutin.png');
  images.stage3=await load('assets/stage3/background.png');
  for(let i=1;i<=8;i++){images['s3_alien_walk_'+i]=await load('assets/stage3/alien/walk_'+String(i).padStart(2,'0')+'.png');images['s3_alien_attack_'+i]=await load('assets/stage3/alien/attack_'+String(i).padStart(2,'0')+'.png');}
  images.s3_ufo_idle_1=await load('assets/stage3/ufo/idle_01.png');images.s3_ufo_idle_2=await load('assets/stage3/ufo/idle_02.png');images.s3_ufo_hover=await load('assets/stage3/ufo/hover.png');images.s3_ufo_move_1=await load('assets/stage3/ufo/move_01.png');images.s3_ufo_move_2=await load('assets/stage3/ufo/move_02.png');images.s3_ufo_charge_1=await load('assets/stage3/ufo/beam_charge_01.png');images.s3_ufo_charge_2=await load('assets/stage3/ufo/beam_charge_02.png');images.s3_ufo_fire=await load('assets/stage3/ufo/beam_fire.png');images.s3_ufo_damage=await load('assets/stage3/ufo/damage.png');images.s3_ufo_destroy=await load('assets/stage3/ufo/destroy.png');
  images.s3_badom_idle_1=await load('assets/stage3/badom/idle_01.png');images.s3_badom_idle_2=await load('assets/stage3/badom/idle_02.png');for(const n of ['summon_charge','summon_release','beam_charge','beam_fire','damage','defeat'])images['s3_badom_'+n]=await load('assets/stage3/badom/'+n+'.png');
 }catch(e){document.getElementById('loading').textContent='画像を読み込めません。ZIPをすべて展開して開いてください。';return;}
 document.getElementById('loading').hidden=true;document.getElementById('loading').style.display='none';
 const input=new Mite.Input(),stage=new Mite.Stage(images.stage),player=new Mite.Player(stage);
 const world={stageNum:1,enemies:[],projectiles:[],boss:null,sparks:[],mode:'title',score:0,startedLatch:false,shake:0,flash:0,banner:'',bannerT:0,clearT:0,clearOverlayT:0,clearPending:false,lastGate:null,gameOverSfx:false,clearSfx:false,tapStart:false,bossFreeze:0,hitstop:0,specialLatch:false,enemyHitFx:null,bossIntroT:0,specialCharge:0,specialPending:false,cutinT:0,cutinMax:.78};
 class DragonWave{
  constructor(x,y,dir){this.x=x;this.y=y;this.dir=dir;this.t=1.85;this.remove=false;this.hit=new Set();this.age=0;this.travel=0;}
  get reveal(){return Math.max(.02,Math.min(1,this.age/.58));}
  get width(){return 315*this.reveal;}
  get body(){const base=this.x+this.dir*this.travel,w=this.width;return{x:this.dir>0?base:base-w,y:this.y-112,width:w,height:105};}
  update(dt){
   this.age+=dt;this.t-=dt;if(this.age>.58)this.travel+=150*dt;
   if(this.reveal>.20){for(const e of world.enemies){if(e.dead||this.hit.has(e))continue;if(Mite.rectsOverlap(this.body,e.body)){this.hit.add(e);const dmg=((world.stageNum===2||world.stageNum===3)&&e.isBoss)?3:5;const killed=e.damage(dmg,this.dir,true);world.score+=e.isBoss?800:350;addSpark(e.x,e.y-52,true);world.hitstop=Math.max(world.hitstop,killed?.10:.065);world.shake=Math.max(world.shake,.22);world.flash=Math.max(world.flash,.08);}}}
   const base=this.x+this.dir*this.travel;if(this.t<=0||base<-360||base>stage.width+360)this.remove=true;
  }
  draw(){
   const base=this.x+this.dir*this.travel,sx=base-stage.cameraX;if(sx<-360||sx>1000)return;
   const im=images.dragon,r=this.reveal,sw=Math.max(1,Math.floor(im.width*r)),dw=315*r;
   ctx.save();ctx.translate(Math.round(sx),Math.round(this.y));ctx.scale(this.dir,1);const pulse=1+Math.sin(this.age*24)*.025;ctx.scale(pulse,pulse);ctx.globalAlpha=Math.min(1,this.age*6,this.t*3);ctx.shadowColor='#23baff';ctx.shadowBlur=16;
   ctx.drawImage(im,0,0,sw,im.height,0,-120,dw,92);
   if(this.age<.30){const q=1-this.age/.30;ctx.globalCompositeOperation='lighter';ctx.fillStyle=`rgba(115,235,255,${.65*q})`;ctx.beginPath();ctx.arc(0,-60,8+22*(1-q),0,Math.PI*2);ctx.fill();}
   ctx.shadowBlur=0;ctx.restore();
  }
 }
 function resetCommon(){
  player.vy=0;player.healFull();Mite.SFX?.resetPowerReady();Mite.SFX?.startBgm();stage.cameraX=0;stage.lockX=null;world.enemies=[];world.projectiles=[];world.sparks=[];world.boss=null;world.shake=0;world.flash=0;world.clearT=0;world.clearOverlayT=0;world.clearPending=false;world.lastGate=null;world.gameOverSfx=false;world.clearSfx=false;world.bossFreeze=0;world.hitstop=0;world.specialLatch=false;world.bossIntroT=0;world.specialCharge=0;world.specialPending=false;world.cutinT=0;world.startedLatch=true;
 }
 function reset(){
  world.stageNum=1;world.score=0;stage.configure(1,images.stage);resetCommon();player.x=160;player.y=stage.floor;world.banner='STAGE 1  夜の商店街';world.bannerT=2.2;spawnStage1();world.mode='play';
 }
 function spawnStage1(){
  world.enemies.push(new Mite.Yankee(720),new Mite.Yankee(1120));
  world.enemies.push(new Mite.Yankee(1510),new Mite.Ninja(1635),new Mite.Yankee(1735));
  world.enemies.push(new Mite.Ninja(2140),new Mite.HorseMan(2550));
  world.boss=new Mite.Boss(3200);world.boss.hp=world.boss.maxHp=10;world.enemies.push(world.boss);
 }
 function enterStage2(fromContinue=false){
  world.stageNum=2;stage.configure(2,images.stage2);resetCommon();player.x=150;player.y=stage.floor;world.banner='STAGE 2  戦場';world.bannerT=2.2;world.shake=.08;world.flash=.08;world.bossFreeze=fromContinue?.35:.65;
  world.enemies.push(new Mite.Stage2Soldier(700),new Mite.Stage2Soldier(1030));
  world.enemies.push(new Mite.Stage2Assault(1450),new Mite.Stage2Soldier(1585),new Mite.Stage2Assault(1740));
  world.enemies.push(new Mite.Stage2Tank(2200),new Mite.Stage2Soldier(2360));
  world.boss=new Mite.Stage2Boss(3200);world.enemies.push(world.boss);world.mode='play';
 }
 function enterStage3(fromContinue=false){
  world.stageNum=3;stage.configure(3,images.stage3);resetCommon();player.x=150;player.y=stage.floor;world.banner='STAGE 3  宇宙';world.bannerT=2.2;world.shake=.08;world.flash=.08;world.bossFreeze=fromContinue?.30:.55;
  world.enemies.push(new Mite.Stage3Alien(700),new Mite.Stage3Alien(980));
  world.enemies.push(new Mite.Stage3Alien(1420),new Mite.Stage3UFO(1620));
  world.enemies.push(new Mite.Stage3Alien(2080),new Mite.Stage3UFO(2290),new Mite.Stage3Alien(2420));
  world.boss=new Mite.Stage3Badom(3170);world.enemies.push(world.boss);world.mode='play';
 }
 function continueCurrent(){const st=world.stageNum;if(st===3)enterStage3(true);else if(st===2)enterStage2(true);else{const keep=world.score;world.stageNum=1;stage.configure(1,images.stage);resetCommon();world.score=keep;player.x=160;player.y=stage.floor;world.banner='STAGE 1  夜の商店街';world.bannerT=1.6;spawnStage1();world.mode='play';}}
 function addSpark(x,y,big=false){world.sparks.push({x,y,t:big?.27:.17,big});world.shake=Math.max(world.shake,big?.15:.06);}
 function hitTest(){
  const hb=player.hitbox;if(!hb)return;
  for(const e of world.enemies){
   if(e.dead||!e.hittable||e.lastHit===player.attackId)continue;
   if(world.stageNum===3&&e instanceof Mite.Stage3Badom){
    if(player.y>=stage.floor-28)continue; // バドムは空中：地上パンチは届かない
    if(Mite.rectsOverlap(hb,e.body)){
     e.lastHit=player.attackId;const strong=player.comboStep===3;const killed=e.damage(strong?2:1,player.facing,strong);player.addPower(10);world.score+=strong?450:300;addSpark(e.x,e.y,strong||killed);world.hitstop=Math.max(world.hitstop,killed?.09:strong?.06:.04);world.shake=Math.max(world.shake,.11);if(killed)world.flash=Math.max(world.flash,.06);
    }
    continue;
   }
   if(world.stageNum===2&&e instanceof Mite.Stage2Boss){
    if(Mite.rectsOverlap(hb,e.body)){
     e.lastHit=player.attackId;const killed=e.damage(1,player.facing,false);player.addPower(10);world.score+=300;addSpark(player.facing>0?e.x-58:e.x+58,Math.max(48,e.y-126),true);world.hitstop=Math.max(world.hitstop,killed?.09:.05);world.shake=Math.max(world.shake,.11);if(killed)world.flash=Math.max(world.flash,.06);
    }
    continue;
   }
   if(Mite.rectsOverlap(hb,e.body)){
    e.lastHit=player.attackId;const strong=player.comboStep===3;const killed=e.damage(strong?2:1,player.facing,strong);player.addPower(10);world.score+=e.isBoss?(strong?400:250):(strong?180:100);addSpark(e.x,e.y-45,strong||killed);world.hitstop=Math.max(world.hitstop,killed?.09:strong?.06:.032);if(killed)world.flash=Math.max(world.flash,.06);
   }
  }
 }
 function maybeSpecial(){const pressed=input.down('special');if(!pressed){world.specialLatch=false;return;}if(world.specialLatch)return;world.specialLatch=true;if(player.canSpecial()){player.startSpecial(false);world.cutinT=world.cutinMax;world.specialPending=true;world.specialCharge=-1;world.banner='';world.bannerT=0;world.shake=.08;world.flash=.04;Mite.SFX?.cutin();}}
 function update(dt){
  const startPressed=input.down('punch')||input.down('jump')||world.tapStart;world.tapStart=false;
  if(world.mode!=='play'){
   if(startPressed&&!world.startedLatch){world.startedLatch=true;if(world.mode==='gameover')continueCurrent();else reset();}
   if(!startPressed)world.startedLatch=false;return;
  }
  if(world.clearOverlayT>0){world.clearOverlayT=Math.max(0,world.clearOverlayT-dt);if(world.clearOverlayT===0&&world.clearPending){world.clearPending=false;if(world.stageNum===1)enterStage2();else if(world.stageNum===2)enterStage3();else{world.mode='clear';world.startedLatch=true;Mite.SFX?.stopBgm();}}return;}
  world.shake=Math.max(0,world.shake-dt);world.flash=Math.max(0,world.flash-dt);world.bannerT=Math.max(0,world.bannerT-dt);world.bossFreeze=Math.max(0,world.bossFreeze-dt);world.bossIntroT=Math.max(0,world.bossIntroT-dt);
  if(world.cutinT>0){world.cutinT=Math.max(0,world.cutinT-dt);if(world.cutinT===0&&world.specialPending&&world.specialCharge<0){world.specialCharge=.30;world.banner='ハイパーウルトラ青龍波!!';world.bannerT=.72;world.shake=.18;world.flash=.10;Mite.SFX?.special();}return;}
  if(world.specialPending&&world.specialCharge>=0){world.specialCharge-=dt;if(world.specialCharge<=0){world.specialPending=false;world.projectiles.push(new DragonWave(player.x+player.facing*48,player.y-26,player.facing));world.shake=.26;world.flash=.14;}}
  maybeSpecial();
  if(world.hitstop>0){world.hitstop=Math.max(0,world.hitstop-dt);return;}
  if(world.bossFreeze<=0)player.update(dt,input,stage);
  for(const e of world.enemies){if(world.bossFreeze<=0||e!==world.boss)e.update(dt,player,stage,world);}
  for(const p of world.projectiles)p.update(dt,player,stage,world);
  hitTest();world.enemies=world.enemies.filter(e=>!e.remove);world.projectiles=world.projectiles.filter(p=>!p.remove);for(const s of world.sparks)s.t-=dt;world.sparks=world.sparks.filter(s=>s.t>0);
  const aliveRange=(a,b)=>world.enemies.some(e=>!e.dead&&(e.spawnX??e.x)>=a&&(e.spawnX??e.x)<=b);
  if(world.stageNum===1){
   if(player.x>610&&aliveRange(620,920))stage.lockX=930;
   else if(player.x>1390&&aliveRange(1400,1810))stage.lockX=1810;
   else if(player.x>2010&&aliveRange(2020,2260))stage.lockX=2300;
   else if(player.x>2420&&aliveRange(2420,2740))stage.lockX=2770;
   else stage.lockX=null;
  }else if(world.stageNum===2){
   if(player.x>610&&aliveRange(620,1120))stage.lockX=1140;
   else if(player.x>1360&&aliveRange(1380,1810))stage.lockX=1840;
   else if(player.x>2070&&aliveRange(2080,2450))stage.lockX=2480;
   else stage.lockX=null;
  }else{
   if(player.x>610&&aliveRange(620,1050))stage.lockX=1110;
   else if(player.x>1330&&aliveRange(1360,1740))stage.lockX=1790;
   else if(player.x>1990&&aliveRange(2020,2480))stage.lockX=2530;
   else stage.lockX=null;
  }
  if(world.lastGate!==stage.lockX){if(world.lastGate==null&&stage.lockX!=null){world.banner=world.stageNum===2&&stage.lockX===1840?'MIX BATTLE!':'ENEMY!';world.bannerT=.6;}else if(world.lastGate!=null&&stage.lockX==null){world.banner='GO! →';world.bannerT=.72;}world.lastGate=stage.lockX;}
  stage.updateCamera(player);
  if(player.x>2850&&world.boss&&!world.boss.entered){world.boss.entered=true;stage.lockX=null;if(world.stageNum===3){world.banner='';world.bannerT=0;world.bossIntroT=1.35;world.bossFreeze=1.35;}else{world.banner='';world.bannerT=0;world.bossIntroT=1.35;world.bossFreeze=1.35;}world.shake=.22;Mite.SFX?.boss();}
  if(player.dead){world.mode='gameover';world.startedLatch=true;Mite.SFX?.stopBgm();if(!world.gameOverSfx){world.gameOverSfx=true;Mite.SFX?.gameover();}}
  if(world.boss&&world.boss.dead&&!world.clearPending&&world.clearOverlayT<=0&&(world.stageNum===3||world.boss.remove)){world.clearPending=true;world.clearOverlayT=1.75;world.bossFreeze=1.75;if(!world.clearSfx){world.clearSfx=true;Mite.SFX?.clear();}}
 }
 function frame(x,y,w,h,accent='#3b7cff'){ctx.fillStyle='#07122b';ctx.fillRect(x,y,w,h);ctx.fillStyle=accent;ctx.fillRect(x,y,w,3);ctx.fillStyle='#f0f6ff';ctx.fillRect(x,y,2,h);ctx.fillRect(x+w-2,y,2,h);ctx.fillRect(x,y+h-2,w,2);}
 function drawHud(){
  const sp=document.querySelector('[data-action="special"]');if(sp)sp.classList.toggle('ready',player.power>=player.maxPower);
  // New HP + POWER HUD based on the approved pixel UI.
  frame(8,7,332,66,'#357bff');ctx.drawImage(images.portrait,12,11,60,55);
  ctx.fillStyle='#fff';ctx.font='bold 11px monospace';ctx.fillText('HP',78,21);ctx.fillStyle='#202b43';ctx.fillRect(78,27,196,14);ctx.fillStyle=player.hp<=25?'#ff493f':'#ff316e';ctx.fillRect(78,27,196*(player.hp/player.maxHp),14);ctx.fillStyle='#fff';ctx.textAlign='right';ctx.font='bold 9px monospace';ctx.fillText(player.hp+' / 100',332,38);ctx.textAlign='left';
  ctx.fillStyle='#ffd326';ctx.font='bold 9px monospace';ctx.fillText('POWER',78,53);ctx.fillStyle='#202b43';ctx.fillRect(121,46,153,12);ctx.fillStyle='#ffd326';ctx.fillRect(121,46,153*(player.power/player.maxPower),12);ctx.textAlign='right';ctx.fillStyle=player.power>=100?(Math.floor(performance.now()/120)%2?'#fff':'#ffd326'):'#fff';ctx.fillText(player.power>=100?'MAX!':player.power+' / 100',332,56);ctx.textAlign='left';
  if(player.power>=100){ctx.fillStyle='rgba(255,210,38,.18)';ctx.fillRect(6,5,336,70);ctx.strokeStyle='#ffd326';ctx.strokeRect(6,5,336,70);}
  ctx.textAlign='right';ctx.fillStyle='#fff';ctx.font='bold 10px monospace';ctx.fillText('SCORE '+String(world.score).padStart(6,'0'),630,18);ctx.textAlign='left';const prog=Math.max(0,Math.min(1,(player.x-48)/(stage.width-124)));ctx.fillStyle='#17243a';ctx.fillRect(508,27,122,5);ctx.fillStyle='#f4c647';ctx.fillRect(508,27,122*prog,5);ctx.fillStyle='#fff';ctx.fillRect(508+122*prog-1,25,2,9);
  if(player.hp<=25){ctx.fillStyle=Math.floor(performance.now()/180)%2?'#ff4b57':'#ffd84a';ctx.font='bold 10px monospace';ctx.fillText('! DANGER',350,56);}
  if(world.boss&&!world.boss.dead&&world.boss.entered){frame(174,78,292,28,'#df4bc1');ctx.fillStyle='#fff';ctx.font='bold 10px monospace';ctx.fillText('BOSS',181,94);ctx.fillStyle='#271d38';ctx.fillRect(224,86,226,10);ctx.fillStyle='#ff2e68';ctx.fillRect(224,86,226*(world.boss.hp/world.boss.maxHp),10);ctx.textAlign='right';ctx.fillText(world.boss.hp+' / '+world.boss.maxHp,458,94);ctx.textAlign='left';}
 }
 function drawSpark(s){const x=Math.round(s.x-stage.cameraX),y=Math.round(s.y),k=s.big?1.55:1;ctx.save();ctx.translate(x,y);ctx.scale(k,k);ctx.fillStyle='#ff5c34';ctx.fillRect(-14,-2,28,4);ctx.fillRect(-2,-14,4,28);ctx.fillStyle='#ffd84a';ctx.fillRect(-10,-5,20,10);ctx.fillRect(-5,-10,10,20);ctx.fillStyle='#fff';ctx.fillRect(-3,-3,6,6);ctx.restore();}
 function drawPlay(){
  const mag=world.shake>0?Math.min(7,2+world.shake*22):0,ox=mag?(Math.random()-.5)*mag:0,oy=mag?(Math.random()-.5)*mag:0;ctx.save();ctx.translate(Math.round(ox),Math.round(oy));stage.draw(ctx);for(const p of world.projectiles)p.draw(ctx,stage,images);for(const e of world.enemies)e.draw(ctx,stage,images);player.draw(ctx,images,stage);for(const s of world.sparks)drawSpark(s);if(world.specialPending){const sx=player.x-stage.cameraX,sy=player.y-58;ctx.save();ctx.globalCompositeOperation='lighter';for(let i=0;i<4;i++){ctx.strokeStyle=i%2?'#53e5ff':'#2b7fff';ctx.lineWidth=3;ctx.globalAlpha=.8-i*.13;ctx.beginPath();ctx.arc(sx,sy,24+i*9+(Math.sin(performance.now()/55+i)*3),0,Math.PI*2);ctx.stroke();}ctx.restore();}ctx.restore();drawHud();
  if(world.flash>0){ctx.fillStyle=`rgba(120,220,255,${Math.min(.35,world.flash*3)})`;ctx.fillRect(0,0,640,360);}
  if(world.bannerT>0){const a=Math.min(1,world.bannerT*2);ctx.globalAlpha=a;ctx.fillStyle='rgba(5,10,20,.84)';ctx.fillRect(132,136,376,48);ctx.strokeStyle=world.banner.includes('青龍波')?'#5fdcff':'#f4c647';ctx.strokeRect(133,137,374,46);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font=world.banner.includes('青龍波')?'bold 17px monospace':'bold 18px monospace';ctx.fillText(world.banner,320,166);ctx.textAlign='left';ctx.globalAlpha=1;}
  drawBossIntro();drawSpecialCutin();if(world.clearOverlayT>0)drawClearOverlay(false);
 }

 function drawSpecialCutin(){
  if(world.cutinT<=0||!images.cutin)return;
  const elapsed=world.cutinMax-world.cutinT;
  const enter=Math.min(1,elapsed/.16),exit=Math.min(1,world.cutinT/.14);
  const ease=1-Math.pow(1-enter,3),alpha=Math.min(1,enter*1.5)*exit;
  const y=72,h=216,slide=(1-ease)*-110;
  ctx.save();ctx.globalAlpha=Math.min(.86,alpha);ctx.fillStyle='#020713';ctx.fillRect(0,0,640,360);ctx.globalAlpha=alpha;
  ctx.fillStyle='#53dfff';ctx.fillRect(0,y-8,640,4);ctx.fillStyle='#ffffff';ctx.fillRect(0,y-3,640,2);
  const im=images.cutin,scale=Math.max(640/im.width,h/im.height),dw=im.width*scale,dh=im.height*scale;
  ctx.beginPath();ctx.rect(0,y,640,h);ctx.clip();ctx.drawImage(im,(640-dw)/2+slide,y+(h-dh)/2,dw,dh);
  ctx.restore();
  ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle='#fff';ctx.fillRect(0,y+h+2,640,2);ctx.fillStyle='#53dfff';ctx.fillRect(0,y+h+6,640,4);
  if(elapsed<.12){ctx.globalAlpha=(.12-elapsed)/.12*.52;ctx.fillStyle='#dffcff';ctx.fillRect(0,0,640,360);}ctx.restore();
 }

 function drawBossIntro(){
  const cut=world.stageNum===3?images.stage3BossCutin:(world.stageNum===2?images.stage2BossCutin:images.bossCutin);if(world.bossIntroT<=0||!cut)return;
  const total=world.stageNum===3?1.35:(world.stageNum===2?1.35:1.25),elapsed=total-world.bossIntroT;
  const enter=Math.min(1,elapsed/.16),exit=Math.min(1,world.bossIntroT/.16);
  const ease=1-Math.pow(1-enter,3),alpha=Math.min(1,enter*1.7)*exit;
  ctx.save();ctx.globalAlpha=Math.min(.88,alpha);ctx.fillStyle='#04060a';ctx.fillRect(0,0,640,360);ctx.globalAlpha=alpha;
  const im=cut;
  if(world.stageNum===2){
   const pad=4,scale=Math.min((640-pad*2)/im.width,(360-pad*2)/im.height),dw=im.width*scale,dh=im.height*scale,slide=(1-ease)*70;
   ctx.drawImage(im,(640-dw)/2+slide,(360-dh)/2,dw,dh);
   ctx.fillStyle='#ff2d2d';ctx.fillRect(0,2,640,4);ctx.fillRect(0,354,640,4);
  }else if(world.stageNum===3){
   const bandY=58,bandH=244,scale=Math.max(640/im.width,bandH/im.height),dw=im.width*scale,dh=im.height*scale,slide=(1-ease)*84;
   ctx.beginPath();ctx.rect(0,bandY,640,bandH);ctx.clip();ctx.drawImage(im,(640-dw)/2+slide,bandY+(bandH-dh)/2,dw,dh);
   ctx.restore();ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle='#b64dff';ctx.fillRect(0,bandY-8,640,4);ctx.fillStyle='#fff';ctx.fillRect(0,bandY-3,640,2);ctx.fillStyle='#fff';ctx.fillRect(0,bandY+bandH+2,640,2);ctx.fillStyle='#b64dff';ctx.fillRect(0,bandY+bandH+6,640,4);
  }else{
   const bandY=54,bandH=252,scale=Math.max(640/im.width,bandH/im.height),dw=im.width*scale,dh=im.height*scale,slide=(1-ease)*90;
   ctx.beginPath();ctx.rect(0,bandY,640,bandH);ctx.clip();ctx.drawImage(im,(640-dw)/2+slide,bandY+(bandH-dh)/2,dw,dh);
   ctx.restore();ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle='#ff2d2d';ctx.fillRect(0,bandY-7,640,4);ctx.fillRect(0,bandY+bandH+3,640,4);
  }
  if(elapsed<.11){ctx.globalAlpha=(.11-elapsed)/.11*.52;ctx.fillStyle='#fff';ctx.fillRect(0,0,640,360);}ctx.restore();
 }
 function fitTitle(){ctx.fillStyle='#07111f';ctx.fillRect(0,0,640,360);const im=images.title,scale=Math.max(640/im.width,360/im.height),w=im.width*scale,h=im.height*scale;ctx.drawImage(im,(640-w)/2,(360-h)/2,w,h);ctx.fillStyle='rgba(3,8,18,.28)';ctx.fillRect(0,286,640,74);ctx.fillStyle='#07142d';ctx.fillRect(226,304,188,32);ctx.strokeStyle='#77b5ff';ctx.lineWidth=2;ctx.strokeRect(227,305,186,30);ctx.fillStyle='#fff';ctx.font='bold 17px monospace';ctx.textAlign='center';ctx.fillText('GAME START',320,326);ctx.font='9px monospace';ctx.fillText('画面タップ / A / B でスタート',320,349);ctx.textAlign='left';}
 function containImage(im,maxW,maxH){const sc=Math.min(maxW/im.width,maxH/im.height);return{w:im.width*sc,h:im.height*sc};}
 function drawClearOverlay(final=false){
  ctx.save();ctx.fillStyle='rgba(4,7,15,.70)';ctx.fillRect(0,0,640,360);const sz=containImage(images.gameClear,570,190);ctx.drawImage(images.gameClear,(640-sz.w)/2,final?62:84,sz.w,sz.h);
  if(final){ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='bold 12px monospace';ctx.fillText('SCORE  '+String(world.score).padStart(6,'0'),320,257);ctx.font='11px monospace';ctx.fillText('A / B / 画面タップでもう一度',320,282);ctx.textAlign='left';}
  ctx.restore();
 }
 function drawGameOver(){
  drawPlay();ctx.save();ctx.fillStyle='rgba(4,7,15,.78)';ctx.fillRect(0,0,640,360);let sz=containImage(images.gameOver,570,184);ctx.drawImage(images.gameOver,(640-sz.w)/2,42,sz.w,sz.h);sz=containImage(images.continueButton,300,78);ctx.drawImage(images.continueButton,(640-sz.w)/2,236,sz.w,sz.h);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='10px monospace';ctx.fillText('A / B / 画面タップでコンティニュー',320,335);ctx.textAlign='left';ctx.restore();
 }
 function drawClearEnd(){
  if(world.stageNum!==3){drawPlay();drawClearOverlay(true);return;}
  drawPlay();ctx.save();ctx.fillStyle='rgba(3,5,18,.82)';ctx.fillRect(0,0,640,360);const finalIm=images.finalClearCutin||images.gameClear;let sz=containImage(finalIm,596,250);ctx.drawImage(finalIm,(640-sz.w)/2,22,sz.w,sz.h);
  ctx.textAlign='center';ctx.fillStyle='#fff';ctx.font='bold 11px monospace';ctx.fillText('SCORE  '+String(world.score).padStart(6,'0'),320,300);ctx.font='10px monospace';ctx.fillText('A / B / 画面タップでもう一度',320,324);ctx.textAlign='left';ctx.restore();
 }
 canvas.addEventListener('pointerdown',e=>{if(world.mode!=='play'){e.preventDefault();world.tapStart=true;Mite.SFX?.unlock();}},{passive:false});
 let previous=0,acc=0;const step=1/120;
 function loop(t){const dt=previous?Math.min((t-previous)/1000,.05):0;previous=t;if(!document.hidden){acc+=dt;while(acc>=step){update(step);acc-=step;}}if(world.mode==='title')fitTitle();else if(world.mode==='play')drawPlay();else if(world.mode==='gameover')drawGameOver();else drawClearEnd();requestAnimationFrame(loop);}
 document.addEventListener('visibilitychange',()=>{previous=0;acc=0;});
 window.miteState=()=>({mode:world.mode,x:player.x,screenX:player.x-stage.cameraX,cameraX:stage.cameraX,hp:player.hp,power:player.power,combo:player.comboStep,enemyCount:world.enemies.filter(e=>!e.dead).length,bossHp:world.boss?world.boss.hp:null,projectiles:world.projectiles.length,score:world.score,gate:stage.lockX,stage:world.stageNum,version:'RC1.10 FINALCUT FIX'});
 requestAnimationFrame(loop);
})();
