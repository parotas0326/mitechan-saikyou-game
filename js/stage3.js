'use strict';
(function(){
 const Base=Mite.EnemyBase;
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

 Mite.Stage3Alien=class extends Base{
  constructor(x,summoned=false){super(x,3);this.attackT=0;this.attackMax=.66;this.didHit=false;this.anim=0;this.summoned=summoned;this.y=260;}
  get body(){return{x:this.x-22,y:this.y-72,width:44,height:72};}
  update(dt,player,stage,world){
   if(!this.dead)this.y=stage.floor;
   this.tick(dt);this.anim+=dt;if(this.dead)return;
   if(!this.active){if(Math.abs(player.x-this.spawnX)>520)return;this.active=true;}
   const d=player.x-this.x,ad=Math.abs(d);this.facing=d>=0?1:-1;
   if(this.hitstun>0)return;
   if(this.attackT>0){
    this.attackT-=dt;this.state='attack';
    const p=1-this.attackT/this.attackMax;
    if(!this.didHit&&p>.48&&p<.78&&ad<72){this.didHit=true;if(player.hurt(10,this.x))world.shake=.11;}
    return;
   }
   if(ad>58){this.x+=Math.sign(d)*88*dt;this.state='walk';}
   else if(this.cooldown<=0){this.attackT=this.attackMax;this.cooldown=1.05;this.didHit=false;this.telegraph=.18;this.state='windup';}
   else this.state='idle';
   this.x=clamp(this.x,50,stage.width-60);
  }
  draw(ctx,stage,images){
   this.shadow(ctx,stage,21);const x=Math.round(this.x-stage.cameraX),y=this.dead?this.y:stage.floor;
   let im,frame;
   if(this.attackT>0){const p=1-this.attackT/this.attackMax;im=images.s3_alien_attack_sheet;frame=Math.min(7,Math.floor(p*8));}
   else{im=images.s3_alien_walk_sheet;frame=Math.floor(this.anim/.095)%8;}
   ctx.save();ctx.translate(x,y);ctx.scale(this.facing,1);if(this.dead)ctx.rotate(this.deathRot*this.facing);if(this.flash>0)ctx.filter='brightness(2.35) saturate(0)';ctx.drawImage(im,frame*112,0,112,112,-48,-92,96,96);ctx.filter='none';ctx.restore();
   if(this.telegraph>0)this.alert(ctx,stage,'#ffd84a','!');this.hpPips(ctx,x,stage.floor);
  }
 };

 Mite.Stage3UFO=class extends Base{
  constructor(x){super(x,5);this.y=122;this.state='idle';this.phaseT=0;this.anim=0;this.didHit=false;this.hurtT=0;this.destroyT=0;}
  get body(){return{x:this.x-47,y:this.y-35,width:94,height:64};}
  damage(amount,dir,strong=false){
   if(this.dead)return false;this.active=true;this.hp-=amount;this.flash=.12;this.hurtT=.22;this.hitstun=.20;Mite.SFX?.hit(strong);
   if(this.hp<=0){this.dead=true;this.destroyT=.72;this.state='destroy';Mite.SFX?.ko();return true;}return false;
  }
  update(dt,player,stage,world){
   this.anim+=dt;this.flash=Math.max(0,this.flash-dt);this.hitstun=Math.max(0,this.hitstun-dt);this.cooldown=Math.max(0,this.cooldown-dt);this.hurtT=Math.max(0,this.hurtT-dt);
   if(this.dead){this.destroyT-=dt;if(this.destroyT<=0)this.remove=true;return;}
   if(!this.active){if(Math.abs(player.x-this.spawnX)>600)return;this.active=true;this.cooldown=.55;}
   if(this.hurtT>0)return;
   const d=player.x-this.x,ad=Math.abs(d);this.facing=d>=0?1:-1;
   if(this.phaseT>0){
    this.phaseT-=dt;
    if(this.state==='charge'){this.telegraph=Math.max(this.telegraph,.08);if(this.phaseT<=0){this.state='fire';this.phaseT=.38;this.didHit=false;Mite.SFX?.enemyAttack('punch');}}
    else if(this.state==='fire'){
     if(!this.didHit&&Math.abs(player.x-this.x)<31){this.didHit=true;if(player.hurt(14,this.x))world.shake=.14;}
     if(this.phaseT<=0){this.state='hover';this.cooldown=1.35+Math.random()*.35;}
    }
    return;
   }
   const target=player.x+Math.sin(this.anim*1.5)*42;
   if(Math.abs(target-this.x)>38){this.x+=Math.sign(target-this.x)*78*dt;this.state='move';}
   else this.state='hover';
   if(this.cooldown<=0&&ad<360){this.state='charge';this.phaseT=.72;this.telegraph=.52;}
   this.x=clamp(this.x,90,stage.width-90);
  }
  draw(ctx,stage,images){
   const x=Math.round(this.x-stage.cameraX),bob=Math.sin(this.anim*4)*3;
   let im=images.s3_ufo_hover;
   if(this.dead)im=images.s3_ufo_destroy;
   else if(this.hurtT>0)im=images.s3_ufo_damage;
   else if(this.state==='move')im=images['s3_ufo_move_'+(Math.floor(this.anim/.11)%2+1)];
   else if(this.state==='charge')im=images['s3_ufo_charge_'+(Math.floor(this.anim/.13)%2+1)];
   else if(this.state==='fire')im=images.s3_ufo_fire;
   else if(this.state==='idle')im=images['s3_ufo_idle_'+(Math.floor(this.anim/.18)%2+1)];
   if(this.state==='fire'&&!this.dead){
    ctx.save();ctx.globalAlpha=.22;ctx.fillStyle='#ff4cff';ctx.fillRect(x-22,this.y+28,44,stage.floor-(this.y+28));ctx.globalAlpha=.55;ctx.fillStyle='#fff';ctx.fillRect(x-5,this.y+28,10,stage.floor-(this.y+28));ctx.restore();
    ctx.save();if(this.flash>0)ctx.filter='brightness(2.3) saturate(0)';ctx.drawImage(im,x-90,stage.floor-180,180,180);ctx.filter='none';ctx.restore();
   }else{
    ctx.save();if(this.flash>0)ctx.filter='brightness(2.3) saturate(0)';ctx.drawImage(im,x-75,Math.round(this.y-75+bob),150,150);ctx.filter='none';ctx.restore();
   }
   if(this.state==='charge'&&!this.dead){ctx.save();ctx.strokeStyle='#ff5aff';ctx.globalAlpha=.75;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(x,this.y+28);ctx.lineTo(x,stage.floor);ctx.stroke();ctx.setLineDash([]);ctx.restore();}
   this.hpPips(ctx,x,stage.floor);
  }
 };

 Mite.Stage3Badom=class extends Base{
  constructor(x){super(x,16);this.entered=false;this.isBoss=true;this.y=132;this.anim=0;this.action='idle';this.actionT=0;this.beamDidHit=false;this.defeatT=0;this.specialHitT=0;this.nextSummon=false;this.facing=-1;this.attackDir=-1;}
  get body(){return{x:this.x-57,y:this.y-61,width:114,height:92};}
  damage(amount,dir,strong=false){
   if(this.dead)return false;this.active=true;this.hp-=amount;this.flash=.13;this.hitstun=strong?.20:.15;this.specialHitT=strong?.42:0;Mite.SFX?.hit(strong);
   if(this.hp<=0){this.dead=true;this.defeatT=1.0;this.action='defeat';Mite.SFX?.ko();return true;}return false;
  }
  update(dt,player,stage,world){
   this.anim+=dt;this.flash=Math.max(0,this.flash-dt);this.hitstun=Math.max(0,this.hitstun-dt);this.cooldown=Math.max(0,this.cooldown-dt);this.specialHitT=Math.max(0,this.specialHitT-dt);
   if(this.dead){this.defeatT-=dt;if(this.defeatT<=0)this.remove=true;return;}
   if(!this.entered)return;this.active=true;const d=player.x-this.x,desiredFacing=d>=0?1:-1;
   if(this.hitstun>0){this.facing=desiredFacing;return;}
   if(this.actionT>0){
    this.actionT-=dt;
    if(this.action==='summonCharge'){this.facing=desiredFacing;if(this.actionT<=0){this.action='summonRelease';this.actionT=.30;const alive=world.enemies.filter(e=>e instanceof Mite.Stage3Alien&&!e.dead&&e.summoned).length;if(alive<2){const sx=clamp(this.x-this.facing*210+(-this.facing)*(Math.random()*80),stage.cameraX+85,stage.width-85);world.enemies.push(new Mite.Stage3Alien(sx,true));world.shake=.08;}}}
    else if(this.action==='summonRelease'&&this.actionT<=0){this.action='idle';this.cooldown=.95;}
    else if(this.action==='beamCharge'){this.facing=desiredFacing;this.attackDir=this.facing;if(this.actionT<=0){this.action='beamFire';this.actionT=.22;this.beamDidHit=false;Mite.SFX?.enemyAttack('kick');}}
    else if(this.action==='beamFire'){
     const beamLen=540,beamH=18,beamY=stage.floor-24,startX=this.attackDir<0?this.x-68-beamLen:this.x+68;
     const beam={x:startX,y:beamY,width:beamLen,height:beamH};
     if(!this.beamDidHit&&Mite.rectsOverlap(beam,player.body)){this.beamDidHit=true;if(player.hurt(18,this.x))world.shake=.18;}
     if(this.actionT<=0){this.action='idle';this.cooldown=1.05;}
    }
    return;
   }
   this.facing=desiredFacing;
   const summoned=world.enemies.filter(e=>e instanceof Mite.Stage3Alien&&!e.dead&&e.summoned).length;
   if(this.cooldown<=0){
    const summon=summoned<2&&(this.nextSummon||Math.random()<.42);this.nextSummon=!summon;
    if(summon){this.action='summonCharge';this.actionT=.50;this.telegraph=.36;}
    else{this.action='beamCharge';this.actionT=.48;this.telegraph=.42;}
   }else this.action='idle';
  }
  draw(ctx,stage,images){
   const x=Math.round(this.x-stage.cameraX),bob=Math.sin(this.anim*3.4)*4;let im;
   if(this.dead)im=images.s3_badom_defeat;
   else if(this.hitstun>0||this.specialHitT>0)im=images.s3_badom_damage;
   else if(this.action==='summonCharge')im=images.s3_badom_summon_charge;
   else if(this.action==='summonRelease')im=images.s3_badom_summon_release;
   else if(this.action==='beamCharge')im=images.s3_badom_beam_charge;
   else if(this.action==='beamFire')im=images.s3_badom_beam_fire;
   else im=images['s3_badom_idle_'+(Math.floor(this.anim/.20)%2+1)];
   if(this.action==='beamFire'&&!this.dead){
    const beamLen=540,beamH=18,beamY=stage.floor-24,start=this.attackDir<0?x-67-beamLen:x+67,end=this.attackDir<0?x-67:x+67;
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle='rgba(203,61,255,.25)';ctx.fillRect(Math.min(start,end),beamY-10,Math.abs(end-start),36);ctx.fillStyle='#fd6cff';ctx.fillRect(Math.min(start,end),beamY,Math.abs(end-start),beamH);ctx.fillStyle='#fff';ctx.fillRect(Math.min(start,end),beamY+4,Math.abs(end-start),8);ctx.restore();
   }
   ctx.save();ctx.translate(x,Math.round(this.y+bob));ctx.scale(-this.facing,1);if(this.flash>0||this.specialHitT>0)ctx.filter='brightness(2.45) saturate(.25)';ctx.drawImage(im,-98,-98,196,196);ctx.filter='none';ctx.restore();
   if((this.action==='summonCharge'||this.action==='beamCharge')&&!this.dead)this.alert(ctx,stage,this.action==='beamCharge'?'#ff58f0':'#8affff','!!');
  }
 };
})();
