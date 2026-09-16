'use strict';
Mite.rectsOverlap=(a,b)=>!!a&&!!b&&a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
class EnemyBase{
 constructor(x,hp=2){this.x=x;this.spawnX=x;this.y=300;this.hp=hp;this.maxHp=hp;this.dead=false;this.remove=false;this.hitstun=0;this.flash=0;this.lastHit=-1;this.facing=-1;this.cooldown=0;this.state='idle';this.telegraph=0;this.active=false;this.deathVx=0;this.deathVy=0;this.deathRot=0;this.deathT=0;}
 get body(){return{x:this.x-22,y:this.y-82,width:44,height:82};}
 damage(amount,dir,strong=false){if(this.dead)return false;this.active=true;this.hp-=amount;this.hitstun=strong?.28:.18;this.flash=.11;this.x+=dir*(strong?28:16);Mite.SFX?.hit(strong);if(this.hp<=0){this.dead=true;this.deathT=.72;this.deathVx=dir*(strong?270:205);this.deathVy=strong?-330:-270;this.state='down';Mite.SFX?.ko();return true;}return false;}
 tick(dt){this.hitstun=Math.max(0,this.hitstun-dt);this.flash=Math.max(0,this.flash-dt);this.cooldown=Math.max(0,this.cooldown-dt);this.telegraph=Math.max(0,this.telegraph-dt);if(this.dead){this.deathT-=dt;this.x+=this.deathVx*dt;this.y+=this.deathVy*dt;this.deathVy+=900*dt;this.deathRot+=dt*(this.deathVx>0?5:-5);if(this.deathT<=0)this.remove=true;}}
 shadow(ctx,stage,w=23){if(this.dead)return;const sx=this.x-stage.cameraX;ctx.fillStyle='#050b1580';ctx.beginPath();ctx.ellipse(sx,stage.floor-1,w,5,0,0,Math.PI*2);ctx.fill();}
 drawArt(ctx,stage,img,w,h,dy=0){if(!img)return false;const x=Math.round(this.x-stage.cameraX),y=this.dead?this.y:stage.floor;ctx.save();ctx.translate(x,y+dy);ctx.scale(this.facing,1);if(this.dead)ctx.rotate(this.deathRot*this.facing);ctx.globalAlpha=this.flash>0?.82:1;let bob=0;if(!this.dead&&(this.state==='walk'||this.state==='retreat'||this.state==='charge'))bob=(Math.floor(performance.now()/90)%2)*-2;if(!this.dead&&(this.state==='attack'||this.state==='throw'||this.state==='punch'||this.state==='kick'))ctx.translate(3,0);ctx.drawImage(img,-w/2,-h+bob,w,h);ctx.restore();return true;}
 hpPips(ctx,x,y){if(this.maxHp<=3&&!this.dead){for(let i=0;i<this.maxHp;i++){ctx.fillStyle=i<this.hp?'#ff4d64':'#2b3240';ctx.fillRect(x-13+i*10,y-94,7,3);}}}
 alert(ctx,stage,color='#ffd84a'){const x=Math.round(this.x-stage.cameraX),y=stage.floor;ctx.save();ctx.textAlign='center';ctx.font='bold 22px monospace';ctx.fillStyle=color;ctx.strokeStyle='#08101d';ctx.lineWidth=4;ctx.strokeText('!',x,y-112);ctx.fillText('!',x,y-112);ctx.restore();}
}
Mite.Yankee=class extends EnemyBase{
 constructor(x){super(x,3);this.attack=0;}
 update(dt,player,stage,world){this.tick(dt);if(this.dead)return;if(!this.active){if(Math.abs(player.x-this.spawnX)>470)return;this.active=true;}const d=player.x-this.x;this.facing=d>=0?1:-1;if(this.hitstun>0)return;if(this.attack>0){this.attack-=dt;this.state='attack';if(!this.didHit&&this.attack<.17&&this.attack>.08&&Math.abs(d)<74){this.didHit=true;if(player.hurt(9,this.x)){world.shake=.10;world.enemyHitFx={x:this.x+this.facing*35,y:this.y-55,t:.12};}}return;}
  if(Math.abs(d)>60){this.x+=Math.sign(d)*94*dt;this.state='walk';}else if(this.cooldown<=0){this.attack=.42;this.cooldown=1.05;this.didHit=false;this.telegraph=.16;this.state='windup';}else this.state='idle';this.x=Math.max(50,Math.min(stage.width-60,this.x));}
 draw(ctx,stage,images){this.shadow(ctx,stage);const x=Math.round(this.x-stage.cameraX),y=stage.floor;this.drawArt(ctx,stage,images&&images.yankee,76,110);if(this.telegraph>0)this.alert(ctx,stage,'#ffd84a');this.hpPips(ctx,x,y);}
};
Mite.Ninja=class extends EnemyBase{
 constructor(x){super(x,2);this.throwWind=0;this.didThrow=false;}
 update(dt,player,stage,world){this.tick(dt);if(this.dead)return;if(!this.active){if(Math.abs(player.x-this.spawnX)>540)return;this.active=true;}const d=player.x-this.x;this.facing=d>=0?1:-1;if(this.hitstun>0)return;const ad=Math.abs(d);if(this.throwWind>0){this.throwWind-=dt;this.state='throw';if(!this.didThrow&&this.throwWind<.12){this.didThrow=true;world.projectiles.push(new Mite.Acorn(this.x+this.facing*28,this.y-54,this.facing));Mite.SFX?.throw();}return;}
  if(ad<160){this.x-=Math.sign(d)*112*dt;this.state='retreat';}else if(ad>300){this.x+=Math.sign(d)*70*dt;this.state='walk';}else this.state='idle';if(this.cooldown<=0&&ad<430){this.cooldown=1.85;this.throwWind=.48;this.didThrow=false;this.telegraph=.38;}this.x=Math.max(70,Math.min(stage.width-70,this.x));}
 draw(ctx,stage,images){this.shadow(ctx,stage);const x=Math.round(this.x-stage.cameraX),y=stage.floor;this.drawArt(ctx,stage,images&&images.ninja,82,88);if(this.telegraph>0)this.alert(ctx,stage,'#72e6ff');this.hpPips(ctx,x,y);}
};
Mite.HorseMan=class extends EnemyBase{
 constructor(x){super(x,4);this.phase='windup';this.timer=.72;this.speed=0;this.attack=0;this.didHit=false;}
 update(dt,player,stage,world){this.tick(dt);if(this.dead)return;if(!this.active){if(Math.abs(player.x-this.spawnX)>520)return;this.active=true;}if(this.hitstun>0)return;const d=player.x-this.x;this.facing=d>=0?1:-1;this.timer-=dt;
  if(this.phase==='windup'){this.state='windup';this.telegraph=.12;if(this.timer<=0){this.phase='charge';this.facing=player.x>=this.x?1:-1;this.speed=425;this.didHit=false;this.timer=.82;Mite.SFX?.charge();}return;}
  if(this.phase==='charge'){this.state='charge';this.x+=this.facing*this.speed*dt;if(!this.didHit&&Mite.rectsOverlap(this.body,player.body)){this.didHit=true;if(player.hurt(16,this.x))world.shake=.2;}if(this.timer<=0||Math.abs(this.x-this.spawnX)>320){this.phase='rider';this.timer=.35;this.cooldown=.2;this.speed=0;}return;}
  if(this.phase==='rider'){const ad=Math.abs(d);if(this.attack>0){this.attack-=dt;this.state='attack';if(!this.didHit&&this.attack<.16&&this.attack>.07&&ad<82){this.didHit=true;if(player.hurt(11,this.x))world.shake=.12;}if(this.attack<=0){this.phase='reset';this.timer=.65;}return;}if(ad>64){this.x+=Math.sign(d)*90*dt;this.state='walk';}else if(this.cooldown<=0){this.attack=.38;this.didHit=false;this.cooldown=.8;this.telegraph=.14;}return;}
  if(this.phase==='reset'){this.state='idle';if(this.timer<=0){this.phase='windup';this.timer=.72;}}
 }
 draw(ctx,stage,images){this.shadow(ctx,stage,29);const x=Math.round(this.x-stage.cameraX),y=stage.floor;this.drawArt(ctx,stage,images&&images.horseman,108,120);if(this.phase==='windup'&&this.active)this.alert(ctx,stage,'#ff6158');if(this.phase==='rider'&&this.attack>0){ctx.save();ctx.fillStyle='#fff2a4';ctx.fillRect(x+this.facing*45,y-73,18,5);ctx.fillStyle='#ff9f31';ctx.fillRect(x+this.facing*58,y-79,10,14);ctx.restore();}this.hpPips(ctx,x,y);}
};
Mite.Acorn=class{
 constructor(x,y,dir){this.x=x;this.y=y;this.dir=dir;this.remove=false;this.spin=0;}
 get body(){return{x:this.x-7,y:this.y-7,width:14,height:14};}
 update(dt,player,stage,world){this.x+=this.dir*185*dt;this.spin+=dt*15;if(Mite.rectsOverlap(this.body,player.body)){if(player.hurt(8,this.x))world.shake=.08;this.remove=true;}if(this.x<0||this.x>stage.width+40)this.remove=true;}
 draw(ctx,stage){const x=this.x-stage.cameraX;if(x<-30||x>670)return;ctx.save();ctx.translate(Math.round(x),Math.round(this.y));ctx.rotate(this.spin);ctx.fillStyle='#704224';ctx.fillRect(-7,-6,14,12);ctx.fillStyle='#3b2116';ctx.fillRect(-5,-9,10,4);ctx.fillStyle='#c89d54';ctx.fillRect(-4,-3,4,3);ctx.restore();}
};
Mite.Boss=class extends EnemyBase{
 constructor(x){super(x,14);this.attackType='';this.attackTimer=0;this.name='JL BOSS';this.entered=false;this.windup=0;this.didHit=false;}
 update(dt,player,stage,world){this.tick(dt);if(this.dead)return;if(!this.entered)return;this.active=true;const d=player.x-this.x,ad=Math.abs(d);this.facing=d>=0?1:-1;if(this.hitstun>0)return;
  if(this.windup>0){this.windup-=dt;this.state='windup';this.telegraph=.08;if(this.windup<=0){this.attackTimer=this.attackType==='kick'?.46:.34;this.didHit=false;Mite.SFX?.enemyAttack(this.attackType);}return;}
  if(this.attackTimer>0){this.attackTimer-=dt;this.state=this.attackType;const active=this.attackType==='kick'?this.attackTimer<.28&&this.attackTimer>.12:this.attackTimer<.22&&this.attackTimer>.08;const reach=this.attackType==='kick'?112:78;if(active&&!this.didHit&&ad<reach){this.didHit=true;if(player.hurt(this.attackType==='kick'?16:11,this.x))world.shake=this.attackType==='kick'?.18:.11;}return;}
  if(ad>88){this.x+=Math.sign(d)*82*dt;this.state='walk';}else this.state='idle';if(this.cooldown<=0&&ad<150){this.cooldown=1.18+Math.random()*.35;this.attackType=Math.random()<.48?'kick':'punch';this.windup=this.attackType==='kick'?.42:.26;}this.x=Math.max(2820,Math.min(stage.width-70,this.x));}
 draw(ctx,stage,images){this.shadow(ctx,stage,27);const x=Math.round(this.x-stage.cameraX),y=stage.floor;this.drawArt(ctx,stage,images&&images.boss,88,116);if(this.windup>0)this.alert(ctx,stage,this.attackType==='kick'?'#ff7b59':'#ffd84a');if(this.attackTimer>0){ctx.save();ctx.translate(x,y);ctx.scale(this.facing,1);if(this.attackType==='punch'&&this.attackTimer<.24){ctx.fillStyle='#fff4ab';ctx.fillRect(35,-61,34,7);ctx.fillStyle='#ff9a34';ctx.fillRect(61,-67,14,18);}if(this.attackType==='kick'&&this.attackTimer<.34){ctx.strokeStyle='#66e7ff';ctx.lineWidth=7;ctx.beginPath();ctx.arc(12,-32,62,-.75,.35);ctx.stroke();ctx.fillStyle='#fff';ctx.fillRect(61,-39,25,8);}ctx.restore();}}
};
