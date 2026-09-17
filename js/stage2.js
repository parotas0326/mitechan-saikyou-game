'use strict';
(function(){
 const Base=Mite.EnemyBase;
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 class SoldierBase extends Base{
  constructor(x,hp,speed,key){super(x,hp);this.speed=speed;this.key=key;this.attack=0;this.didHit=false;}
  update(dt,player,stage,world){this.tick(dt);if(this.dead)return;if(!this.active){if(Math.abs(player.x-this.spawnX)>500)return;this.active=true;}const d=player.x-this.x,ad=Math.abs(d);this.facing=d>=0?1:-1;if(this.hitstun>0)return;
   if(this.attack>0){this.attack-=dt;this.state='attack';if(!this.didHit&&this.attack<.18&&this.attack>.08&&ad<78){this.didHit=true;if(player.hurt(this.key==='mob2'?13:9,this.x))world.shake=.11;}return;}
   if(ad>62){this.x+=Math.sign(d)*this.speed*dt;this.state='walk';}else if(this.cooldown<=0){this.attack=.44;this.cooldown=this.key==='mob2'?.9:1.15;this.didHit=false;this.telegraph=.18;this.state='windup';}else this.state='idle';this.x=clamp(this.x,50,stage.width-60);
  }
  draw(ctx,stage,images){this.shadow(ctx,stage,this.key==='mob2'?28:23);const idx=this.dead?5:this.state==='attack'?4:this.state==='windup'?3:this.state==='walk'?(Math.floor(performance.now()/120)%2?1:2):0;const im=images[`s2_${this.key}_${idx}`];this.drawArt(ctx,stage,im,this.key==='mob2'?96:82,this.key==='mob2'?122:106);if(this.telegraph>0)this.alert(ctx,stage,'#ffd84a');this.hpPips(ctx,this.x-stage.cameraX,stage.floor);}
 }
 Mite.Stage2Soldier=class extends SoldierBase{constructor(x){super(x,3,96,'mob1');}};
 Mite.Stage2Assault=class extends SoldierBase{constructor(x){super(x,5,112,'mob2');}};

 Mite.TankShot=class{
  constructor(x,y,dir,type){this.x=x;this.y=y;this.dir=dir;this.type=type;this.remove=false;this.vx=type==='high'?215:195;this.age=0;}
  get body(){return{x:this.x-18,y:this.y-10,width:36,height:20};}
  update(dt,player,stage,world){this.age+=dt;this.x+=this.dir*this.vx*dt;if(Mite.rectsOverlap(this.body,player.body)){if(player.hurt(this.type==='high'?14:11,this.x))world.shake=.12;this.remove=true;}if(this.x<-100||this.x>stage.width+100)this.remove=true;}
  draw(ctx,stage){const x=this.x-stage.cameraX;ctx.save();ctx.translate(x,this.y);ctx.fillStyle=this.type==='high'?'#bf7b38':'#4ac7ff';ctx.strokeStyle='#fff';ctx.lineWidth=2;if(this.type==='high'){ctx.beginPath();ctx.ellipse(0,0,18,9,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#ff7929';ctx.fillRect(this.dir>0?-25:15,-4,10,8);}else{ctx.beginPath();ctx.ellipse(0,0,22,8,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.globalAlpha=.5;ctx.fillStyle='#8ce9ff';ctx.fillRect(this.dir>0?-42:20,-5,24,10);}ctx.restore();}
 };
 Mite.Stage2Tank=class extends Base{
  constructor(x){super(x,8);this.attackWind=0;this.attackType='low';this.didFire=false;}
  get body(){return{x:this.x-66,y:this.y-78,width:132,height:78};}
  update(dt,player,stage,world){this.tick(dt);if(this.dead)return;if(!this.active){if(Math.abs(player.x-this.spawnX)>560)return;this.active=true;}const d=player.x-this.x;this.facing=d>=0?1:-1;if(this.hitstun>0)return;
   if(this.attackWind>0){this.attackWind-=dt;this.state='attack';if(!this.didFire&&this.attackWind<.18){this.didFire=true;const high=this.attackType==='high';world.projectiles.push(new Mite.TankShot(this.x+this.facing*70,stage.floor-(high?140:27),this.facing,this.attackType));world.shake=.16;Mite.SFX?.enemyAttack('punch');}return;}
   if(Math.abs(d)>270){this.x+=Math.sign(d)*42*dt;this.state='walk';}else this.state='idle';if(this.cooldown<=0&&Math.abs(d)<520){this.attackType=Math.random()<.5?'high':'low';this.attackWind=.72;this.cooldown=1.75+Math.random()*.45;this.didFire=false;this.telegraph=.55;}this.x=clamp(this.x,90,stage.width-90);
  }
  draw(ctx,stage,images){this.shadow(ctx,stage,60);const x=this.x-stage.cameraX,y=stage.floor;ctx.save();ctx.translate(x,y);ctx.scale(this.facing,1);if(this.dead)ctx.rotate(this.deathRot*this.facing);if(this.flash>0)ctx.filter='brightness(2.4) saturate(.2)';ctx.drawImage(images.s2_tank,-78,-94,156,94);ctx.filter='none';if(this.attackWind>0){ctx.strokeStyle=this.attackType==='high'?'#ff6c43':'#55dfff';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(18,-67);ctx.lineTo(72,this.attackType==='high'?-108:-67);ctx.stroke();}ctx.restore();if(this.telegraph>0)this.alert(ctx,stage,this.attackType==='high'?'#ff6c43':'#55dfff',this.attackType==='high'?'▲':'▬');}
 };

 Mite.GroundWave=class{
  constructor(x,dir){this.x=x;this.dir=dir;this.y=300;this.remove=false;}
  get body(){return{x:this.x-28,y:this.y-26,width:56,height:26};}
  update(dt,player,stage,world){this.x+=this.dir*220*dt;if(Mite.rectsOverlap(this.body,player.body)){if(player.hurt(16,this.x))world.shake=.18;this.remove=true;}if(this.x<0||this.x>stage.width)this.remove=true;}
  draw(ctx,stage){const x=this.x-stage.cameraX;ctx.save();ctx.translate(x,stage.floor);ctx.fillStyle='#ff8a32';ctx.beginPath();ctx.moveTo(-30,0);ctx.lineTo(-18,-16);ctx.lineTo(-5,-6);ctx.lineTo(8,-24);ctx.lineTo(20,-7);ctx.lineTo(30,0);ctx.fill();ctx.restore();}
 };
 Mite.Stage2Boss=class extends Base{
  constructor(x){super(x,12);this.entered=false;this.isBoss=true;this.windup=0;this.slam=0;this.recover=0;this.didWave=false;this.specialHitT=0;this.facing=-1;this.windupMax=.82;this.slamMax=.46;this.recoverMax=.80;}
  get body(){return{x:this.x-88,y:this.y-286,width:176,height:286};}
  get weakBody(){return this.body;}
  damage(amount,dir,strong=false){const killed=super.damage(amount,dir,strong);if(strong)this.specialHitT=.55;return killed;}
  attackFrame(){
   if(this.windup>0){const p=1-this.windup/this.windupMax;if(p<.22)return 1;if(p<.78)return 2;return 3;}
   if(this.slam>0){const p=1-this.slam/this.slamMax;return p<.52?3:4;}
   if(this.recover>0){const p=1-this.recover/this.recoverMax;if(p<.32)return 5;if(p<.68)return 6;return 7;}
   return 0;
  }
  update(dt,player,stage,world){
   this.tick(dt);this.specialHitT=Math.max(0,this.specialHitT-dt);if(this.dead||!this.entered)return;this.active=true;
   const d=player.x-this.x,ad=Math.abs(d);this.facing=-1; // approved: Stage 2 boss always faces LEFT
   if(this.hitstun>0)return;
   if(this.recover>0){this.recover-=dt;this.state='recover';return;}
   if(this.slam>0){this.slam-=dt;this.state='slam';
    if(!this.didWave&&this.slam<this.slamMax*.48){this.didWave=true;world.projectiles.push(new Mite.GroundWave(this.x-35,-1));if(Math.abs(player.x-this.x)<118&&player.y>stage.floor-85)player.hurt(18,this.x);world.shake=.30;world.flash=.08;}
    if(this.slam<=0)this.recover=this.recoverMax;return;
   }
   if(this.windup>0){this.windup-=dt;this.state='raise';this.telegraph=.10;if(this.windup<=0){this.slam=this.slamMax;this.didWave=false;Mite.SFX?.enemyAttack('punch');}return;}
   if(ad>150){this.x+=Math.sign(d)*50*dt;this.state='walk';}else this.state='idle';
   if(this.cooldown<=0&&ad<260){this.cooldown=2.05+Math.random()*.45;this.windup=this.windupMax;this.state='raise';}
   this.x=clamp(this.x,2870,stage.width-110);
  }
  draw(ctx,stage,images){
   this.shadow(ctx,stage,67);const x=this.x-stage.cameraX,y=stage.floor;
   let im=images['s2_boss_attack_'+this.attackFrame()]||images.s2_boss_idle;
   if(this.hitstun>0||this.specialHitT>0)im=images.s2_boss_hurt;
   ctx.save();ctx.translate(x,y); // no horizontal flip: source art is already left-facing and must stay left-facing
   if(this.dead)ctx.rotate(-this.deathRot);
   if(this.flash>0||this.specialHitT>0)ctx.filter='brightness(2.5) saturate(.2)';
   if((this.hitstun>0||this.specialHitT>0)&&im===images.s2_boss_hurt){ctx.drawImage(im,-110,-250,220,248);}else{ctx.drawImage(im,-132,-330,264,350);}
   ctx.filter='none';ctx.restore();
   if(this.windup>0)this.alert(ctx,stage,'#ff563d','!!');
  }
 };
})();
