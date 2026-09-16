'use strict';
Mite.rectsOverlap=(a,b)=>!!a&&!!b&&a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
class EnemyBase{
 constructor(x,hp=2){this.x=x;this.spawnX=x;this.y=300;this.hp=hp;this.maxHp=hp;this.dead=false;this.remove=false;this.hitstun=0;this.flash=0;this.lastHit=-1;this.facing=-1;this.cooldown=0;this.state='idle';this.telegraph=0;this.active=false;this.deathVx=0;this.deathVy=0;this.deathRot=0;this.deathT=0;this.isBoss=false;}
 get body(){return{x:this.x-22,y:this.y-82,width:44,height:82};}
 get hittable(){return true;}
 damage(amount,dir,strong=false){if(this.dead||!this.hittable)return false;this.active=true;this.hp-=amount;this.hitstun=strong?(this.isBoss?.42:.30):.18;this.flash=.13;this.x+=dir*(strong?(this.isBoss?46:32):16);Mite.SFX?.hit(strong);if(this.hp<=0){this.dead=true;this.deathT=.72;this.deathVx=dir*(strong?285:205);this.deathVy=strong?-350:-270;this.state='down';Mite.SFX?.ko();return true;}return false;}
 tick(dt){this.hitstun=Math.max(0,this.hitstun-dt);this.flash=Math.max(0,this.flash-dt);this.cooldown=Math.max(0,this.cooldown-dt);this.telegraph=Math.max(0,this.telegraph-dt);if(this.dead){this.deathT-=dt;this.x+=this.deathVx*dt;this.y+=this.deathVy*dt;this.deathVy+=900*dt;this.deathRot+=dt*(this.deathVx>0?5:-5);if(this.deathT<=0)this.remove=true;}}
 shadow(ctx,stage,w=23){if(this.dead)return;const sx=this.x-stage.cameraX;ctx.fillStyle='#050b1580';ctx.beginPath();ctx.ellipse(sx,stage.floor-1,w,5,0,0,Math.PI*2);ctx.fill();}
 drawArt(ctx,stage,img,w,h,dy=0){if(!img)return false;const x=Math.round(this.x-stage.cameraX),y=this.dead?this.y:stage.floor;ctx.save();ctx.translate(x,y+dy);ctx.scale(this.facing,1);if(this.dead)ctx.rotate(this.deathRot*this.facing);let bob=0;if(!this.dead&&(this.state==='walk'||this.state==='retreat'||this.state==='charge'))bob=(Math.floor(performance.now()/90)%2)*-2;if(!this.dead&&(this.state==='attack'||this.state==='throw'||this.state==='punch'||this.state==='kick'))ctx.translate(3,0);ctx.globalAlpha=1;if(this.flash>0)ctx.filter='brightness(2.35) saturate(0) contrast(1.15)';ctx.drawImage(img,-w/2,-h+bob,w,h);ctx.filter='none';ctx.restore();return true;}
 hpPips(ctx,x,y){if(this.maxHp<=4&&!this.dead&&this.hittable){for(let i=0;i<this.maxHp;i++){ctx.fillStyle=i<this.hp?'#ff4d64':'#2b3240';ctx.fillRect(x-18+i*10,y-94,7,3);}}}
 alert(ctx,stage,color='#ffd84a',text='!'){const x=Math.round(this.x-stage.cameraX),y=stage.floor;ctx.save();ctx.textAlign='center';ctx.font='bold 22px monospace';ctx.fillStyle=color;ctx.strokeStyle='#08101d';ctx.lineWidth=4;ctx.strokeText(text,x,y-112);ctx.fillText(text,x,y-112);ctx.restore();}
}
Mite.Yankee=class extends EnemyBase{
 constructor(x){super(x,3);this.attack=0;}
 update(dt,player,stage,world){this.tick(dt);if(this.dead)return;if(!this.active){if(Math.abs(player.x-this.spawnX)>470)return;this.active=true;}const d=player.x-this.x;this.facing=d>=0?1:-1;if(this.hitstun>0)return;if(this.attack>0){this.attack-=dt;this.state='attack';if(!this.didHit&&this.attack<.17&&this.attack>.08&&Math.abs(d)<74){this.didHit=true;if(player.hurt(9,this.x)){world.shake=.10;world.enemyHitFx={x:this.x+this.facing*35,y:this.y-55,t:.12};}}return;}
  if(Math.abs(d)>60){this.x+=Math.sign(d)*94*dt;this.state='walk';}else if(this.cooldown<=0){this.attack=.42;this.cooldown=1.05;this.didHit=false;this.telegraph=.16;this.state='windup';}else this.state='idle';this.x=Math.max(50,Math.min(stage.width-60,this.x));}
 draw(ctx,stage,images){this.shadow(ctx,stage);const x=Math.round(this.x-stage.cameraX),y=stage.floor;this.drawArt(ctx,stage,images&&images.yankee,76,110);if(this.telegraph>0)this.alert(ctx,stage,'#ffd84a');this.hpPips(ctx,x,y);}
};
Mite.Ninja=class extends EnemyBase{
 constructor(x){super(x,2);this.throwWind=0;this.didThrow=false;}
 update(dt,player,stage,world){this.tick(dt);if(this.dead)return;if(!this.active){if(Math.abs(player.x-this.spawnX)>540)return;this.active=true;}const d=player.x-this.x;this.facing=d>=0?1:-1;if(this.hitstun>0)return;const ad=Math.abs(d);if(this.throwWind>0){this.throwWind-=dt;this.state='throw';if(!this.didThrow&&this.throwWind<.12){this.didThrow=true;world.projectiles.push(new Mite.Acorn(this.x+this.facing*30,this.y-48,this.facing));Mite.SFX?.throw();}return;}
  if(ad<160){this.x-=Math.sign(d)*112*dt;this.state='retreat';}else if(ad>300){this.x+=Math.sign(d)*70*dt;this.state='walk';}else this.state='idle';if(this.cooldown<=0&&ad<430){this.cooldown=1.85;this.throwWind=.52;this.didThrow=false;this.telegraph=.42;}this.x=Math.max(70,Math.min(stage.width-70,this.x));}
 draw(ctx,stage,images){this.shadow(ctx,stage);const x=Math.round(this.x-stage.cameraX),y=stage.floor;this.drawArt(ctx,stage,images&&images.ninja,82,88);if(this.telegraph>0)this.alert(ctx,stage,'#72e6ff','🌰');this.hpPips(ctx,x,y);}
};
Mite.HorseMan=class extends EnemyBase{
 constructor(x){super(x,3);this.phase='intro';this.timer=.70;this.chargeDir=-1;this.attack=0;this.didHit=false;this.announced=false;}
 get hittable(){return this.phase==='rider';}
 get body(){if(this.phase==='mountCharge')return{x:this.x-34,y:this.y-57,width:68,height:57};return{x:this.x-24,y:this.y-86,width:48,height:86};}
 update(dt,player,stage,world){this.tick(dt);if(this.dead)return;if(!this.active){if(Math.abs(player.x-this.spawnX)>520)return;this.active=true;this.timer=.72;this.phase='intro';if(!this.announced){this.announced=true;world.banner='人馬おじさん 登場！';world.bannerT=1.0;}}
  if(this.hitstun>0)return;const d=player.x-this.x;this.facing=d>=0?1:-1;
  if(this.phase==='intro'){this.state='idle';this.timer-=dt;this.telegraph=.12;if(this.timer<=0){this.phase='mountCharge';this.timer=1.05;this.chargeDir=player.x>=this.x?1:-1;this.facing=this.chargeDir;this.didHit=false;Mite.SFX?.charge();world.banner='人馬が突っ込んでくる！';world.bannerT=.75;}return;}
  if(this.phase==='mountCharge'){this.state='charge';this.timer-=dt;this.x+=this.chargeDir*430*dt;if(!this.didHit&&Mite.rectsOverlap(this.body,player.body)){this.didHit=true;if(player.hurt(16,this.x))world.shake=.22;}if(this.timer<=0||Math.abs(this.x-this.spawnX)>390){this.phase='rider';this.timer=0;this.cooldown=.35;this.attack=0;this.didHit=false;this.x=Math.max(80,Math.min(stage.width-80,this.x));world.banner='今度はおじさんが殴ってくる！';world.bannerT=.78;}return;}
  // Rider phase: behaves like a standard close-range enemy.
  const ad=Math.abs(d);this.facing=d>=0?1:-1;
  if(this.attack>0){this.attack-=dt;this.state='attack';if(!this.didHit&&this.attack<.17&&this.attack>.08&&ad<76){this.didHit=true;if(player.hurt(10,this.x))world.shake=.11;}return;}
  if(ad>62){this.x+=Math.sign(d)*92*dt;this.state='walk';}else if(this.cooldown<=0){this.attack=.42;this.cooldown=1.05;this.didHit=false;this.telegraph=.16;this.state='windup';}else this.state='idle';this.x=Math.max(60,Math.min(stage.width-60,this.x));
 }
 draw(ctx,stage,images){const x=Math.round(this.x-stage.cameraX),y=this.dead?this.y:stage.floor;if(this.phase==='intro'){this.shadow(ctx,stage,29);this.drawArt(ctx,stage,images&&images.horseman,108,120);if(this.active)this.alert(ctx,stage,'#ff6158');return;}
  if(this.phase==='mountCharge'){this.shadow(ctx,stage,31);this.drawArt(ctx,stage,images&&images.horseMount,96,72,0);ctx.save();ctx.strokeStyle='#fff';ctx.globalAlpha=.55;ctx.lineWidth=3;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(x-this.facing*(58+i*13),y-35+i*8);ctx.lineTo(x-this.facing*(86+i*18),y-35+i*8);ctx.stroke();}ctx.restore();return;}
  this.shadow(ctx,stage,23);ctx.save();ctx.translate(x,y);ctx.scale(this.facing,1);if(this.dead)ctx.rotate(this.deathRot*this.facing);if(this.flash>0)ctx.filter='brightness(2.35) saturate(0)';ctx.drawImage(images&&images.horseRider,-44,-105,88,78);ctx.filter='none';// simple legs so the upper-body crop reads as a standing enemy
  ctx.fillStyle='#294a76';ctx.fillRect(-19,-31,14,25);ctx.fillRect(5,-31,14,25);ctx.fillStyle='#1a2030';ctx.fillRect(-22,-8,20,8);ctx.fillRect(2,-8,20,8);ctx.restore();if(this.telegraph>0)this.alert(ctx,stage,'#ffd84a');this.hpPips(ctx,x,y);
 }
};
Mite.Acorn=class{
 constructor(x,y,dir){this.x=x;this.y=y;this.dir=dir;this.remove=false;this.spin=0;this.age=0;}
 get body(){return{x:this.x-10,y:this.y-9,width:20,height:18};}
 update(dt,player,stage,world){this.x+=this.dir*155*dt;this.spin+=dt*10;this.age+=dt;if(Mite.rectsOverlap(this.body,player.body)){if(player.hurt(8,this.x))world.shake=.08;this.remove=true;}if(this.x<0||this.x>stage.width+40)this.remove=true;}
 draw(ctx,stage){const x=this.x-stage.cameraX;if(x<-40||x>680)return;ctx.save();ctx.translate(Math.round(x),Math.round(this.y));ctx.rotate(this.spin);ctx.fillStyle='#101015';ctx.fillRect(-11,-8,22,17);ctx.fillStyle='#9a5b2f';ctx.fillRect(-9,-6,18,14);ctx.fillStyle='#4e2b18';ctx.fillRect(-8,-10,16,5);ctx.fillStyle='#d5a95e';ctx.fillRect(-5,-3,5,4);ctx.fillStyle='#fff4d0';ctx.fillRect(3,-4,3,3);ctx.restore();if(this.age<.42){ctx.save();ctx.textAlign='center';ctx.font='bold 9px monospace';ctx.fillStyle='#fff';ctx.strokeStyle='#111827';ctx.lineWidth=3;ctx.strokeText('どんぐり!',Math.round(x),Math.round(this.y-17));ctx.fillText('どんぐり!',Math.round(x),Math.round(this.y-17));ctx.restore();}}
};
Mite.Boss=class extends EnemyBase{
 constructor(x){super(x,14);this.attackType='';this.attackTimer=0;this.name='JL BOSS';this.entered=false;this.windup=0;this.didHit=false;this.isBoss=true;}
 update(dt,player,stage,world){this.tick(dt);if(this.dead)return;if(!this.entered)return;this.active=true;const d=player.x-this.x,ad=Math.abs(d);this.facing=d>=0?1:-1;if(this.hitstun>0)return;
  if(this.windup>0){this.windup-=dt;this.state='windup';this.telegraph=.08;if(this.windup<=0){this.attackTimer=this.attackType==='kick'?.48:.36;this.didHit=false;Mite.SFX?.enemyAttack(this.attackType);}return;}
  if(this.attackTimer>0){this.attackTimer-=dt;this.state=this.attackType;const active=this.attackType==='kick'?this.attackTimer<.29&&this.attackTimer>.12:this.attackTimer<.23&&this.attackTimer>.08;const reach=this.attackType==='kick'?112:80;if(active&&!this.didHit&&ad<reach){this.didHit=true;if(player.hurt(this.attackType==='kick'?16:11,this.x))world.shake=this.attackType==='kick'?.18:.11;}return;}
  if(ad>88){this.x+=Math.sign(d)*82*dt;this.state='walk';}else this.state='idle';if(this.cooldown<=0&&ad<150){this.cooldown=1.18+Math.random()*.35;this.attackType=Math.random()<.48?'kick':'punch';this.windup=this.attackType==='kick'?.46:.30;}this.x=Math.max(2820,Math.min(stage.width-70,this.x));}
 draw(ctx,stage,images){this.shadow(ctx,stage,27);const x=Math.round(this.x-stage.cameraX),y=stage.floor;this.drawArt(ctx,stage,images&&images.boss,88,116);if(this.windup>0)this.alert(ctx,stage,this.attackType==='kick'?'#ff7b59':'#ffd84a',this.attackType==='kick'?'KICK!':'PUNCH!');if(this.attackTimer>0){ctx.save();ctx.translate(x,y);ctx.scale(this.facing,1);const pulse=Math.floor(performance.now()/45)%2;if(this.attackType==='punch'&&this.attackTimer<.25){ctx.fillStyle=pulse?'#fff4ab':'#ffcf4a';ctx.fillRect(30,-64,44,9);ctx.fillStyle='#ff6a34';ctx.fillRect(66,-70,18,22);ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.strokeRect(29,-65,56,11);}if(this.attackType==='kick'&&this.attackTimer<.35){ctx.strokeStyle=pulse?'#d8fbff':'#55d9ff';ctx.lineWidth=9;ctx.beginPath();ctx.arc(8,-34,65,-.72,.36);ctx.stroke();ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(8,-34,65,-.72,.36);ctx.stroke();}ctx.restore();}}
};
