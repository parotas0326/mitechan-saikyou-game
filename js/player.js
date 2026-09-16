'use strict';
Mite.Player = class {
 constructor(stage){
  this.x=160;this.y=stage.floor;this.vy=0;this.facing=1;this.clock=0;this.walkClock=0;
  this.attack=0;this.attackId=0;this.attackQueued=false;this.attackKind='none';this.state='idle';this.frame='idle0';this.jumpLatch=false;
  this.punchLatch=false;this.specialLatch=false;
  this.maxHp=100;this.hp=100;this.invuln=0;this.hitstun=0;this.dead=false;
  this.comboStep=0;this.comboGrace=0;this.power=0;this.maxPower=100;this.special=0;
 }
 update(dt,input,stage){
  this.clock+=dt;this.invuln=Math.max(0,this.invuln-dt);this.hitstun=Math.max(0,this.hitstun-dt);this.comboGrace=Math.max(0,this.comboGrace-dt);
  if(this.attack===0&&this.comboGrace===0)this.comboStep=0;
  const direction=(this.hitstun>0||this.special>0)?0:Number(input.down('right'))-Number(input.down('left'));
  if(direction){this.facing=direction;this.x+=direction*188*dt;this.walkClock+=dt;}else this.walkClock=0;
  const jumpHeld=input.down('jump');
  if(this.hitstun<=0&&this.special<=0&&this.attack===0&&jumpHeld&&!this.jumpLatch&&this.y>=stage.floor){this.vy=-520;this.jumpLatch=true;Mite.SFX?.jump();}
  if(!jumpHeld)this.jumpLatch=false;
  this.vy+=1450*dt;this.y+=this.vy*dt;stage.constrain(this);

  const punchHeld=input.down('punch');
  if(!punchHeld)this.punchLatch=false;
  if(this.special>0){this.special=Math.max(0,this.special-dt);this.attack=0;this.attackQueued=false;this.attackKind='none';}
  else{
   if(this.attack>0){this.attack=Math.max(0,this.attack-dt);if(this.attackKind==='punch'&&punchHeld&&this.attack<.10)this.attackQueued=true;if(this.attack===0)this.attackKind='none';}
   if(this.hitstun<=0&&this.attack===0&&punchHeld){this.startPunch();this.punchLatch=true;}
   if(this.hitstun<=0&&this.attack===0&&this.attackQueued){this.startPunch();this.attackQueued=false;}
  }

  this.state=this.hitstun>0?'hurt':this.special>0?'special':this.attack>0?'punch':this.y<stage.floor?'jump':direction?'walk':'idle';
  if(this.state==='punch'||this.state==='special')this.frame=this.attack>.20||this.special>.44?'punch0':'punch1';
  else if(this.state==='hurt')this.frame='idle1';
  else if(this.state==='jump')this.frame='walk1';
  else if(this.state==='walk')this.frame='walk'+(Math.floor(this.walkClock/.105)%4);
  else this.frame='idle'+(Math.floor(this.clock/.22)%4);
 }
 startPunch(){
  this.attackKind='punch';this.comboStep=this.comboGrace>0?(this.comboStep%3)+1:1;
  this.comboGrace=.52;this.attack=this.comboStep===3?.36:.28;this.attackId++;this.attackQueued=false;Mite.SFX?.punch(this.comboStep);
 }
 addPower(amount=10){this.power=Math.min(this.maxPower,this.power+amount);if(this.power>=this.maxPower)Mite.SFX?.powerReady();}
 canSpecial(){return this.power>=this.maxPower&&this.special<=0&&this.hitstun<=0&&!this.dead;}
 startSpecial(playSound=true){this.power=0;this.special=1.05;this.attack=0;this.attackQueued=false;this.attackKind='none';this.comboStep=0;this.attackId++;if(playSound)Mite.SFX?.special();}
 hurt(amount,fromX){
  if(this.invuln>0||this.dead)return false;
  this.hp=Math.max(0,this.hp-amount);this.invuln=.82;this.hitstun=.24;this.attack=0;this.attackQueued=false;this.attackKind='none';this.special=0;
  this.x+=this.x<fromX?-28:28;Mite.SFX?.hurt();
  if(this.hp<=0)this.dead=true;
  return true;
 }
 healFull(){this.hp=this.maxHp;this.power=0;this.dead=false;this.invuln=0;this.hitstun=0;this.attack=0;this.attackQueued=false;this.attackKind='none';this.jumpLatch=false;this.special=0;this.comboStep=0;this.comboGrace=0;this.specialLatch=false;}
 get body(){return{x:this.x-20,y:this.y-90,width:40,height:90};}
 get hitbox(){
  if(this.special>0)return null;
  if(this.attackKind==='punch'&&this.attack>.055&&this.attack<(this.comboStep===3?.26:.205))return{x:this.facing>0?this.x+18:this.x-68,y:this.y-84,width:this.comboStep===3?58:50,height:28};
  return null;
 }
 draw(ctx,images,stage){
  const screenX=this.x-stage.cameraX;
  ctx.fillStyle='#0c142480';ctx.beginPath();ctx.ellipse(screenX,stage.floor-2,27,5,0,0,Math.PI*2);ctx.fill();
  ctx.save();ctx.translate(Math.round(screenX),Math.round(this.y));ctx.scale(this.facing,1);
  ctx.globalAlpha=(this.invuln>0&&Math.floor(this.invuln*18)%2)?.42:1;
  ctx.drawImage(images[this.frame],-52,-120,128,128);
  if(this.comboStep===3&&this.attackKind==='punch'&&this.attack>.08&&this.attack<.28){ctx.fillStyle='#fff2a4';ctx.fillRect(52,-82,14,5);ctx.fillStyle='#ff9f31';ctx.fillRect(62,-86,11,13);}
  ctx.restore();
 }
};
