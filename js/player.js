'use strict';
Mite.Player = class {
 constructor(stage){
  this.x=160;this.y=stage.floor;this.vy=0;this.facing=1;this.clock=0;this.walkClock=0;
  this.attack=0;this.attackId=0;this.attackQueued=false;this.state='idle';this.frame='idle0';this.jumpLatch=false;
  this.maxHp=100;this.hp=100;this.invuln=0;this.hitstun=0;this.dead=false;
 }
 update(dt,input,stage){
  this.clock+=dt;this.invuln=Math.max(0,this.invuln-dt);this.hitstun=Math.max(0,this.hitstun-dt);
  const direction=this.hitstun>0?0:Number(input.down('right'))-Number(input.down('left'));
  if(direction){this.facing=direction;this.x+=direction*188*dt;this.walkClock+=dt;}else this.walkClock=0;
  const jumpHeld=input.down('jump');
  if(this.hitstun<=0 && jumpHeld && !this.jumpLatch && this.y>=stage.floor){this.vy=-480;this.jumpLatch=true;Mite.SFX?.jump();}
  if(!jumpHeld)this.jumpLatch=false;
  this.vy+=1450*dt;this.y+=this.vy*dt;stage.constrain(this);

  const punchHeld=input.down('punch');
  if(this.attack>0){this.attack=Math.max(0,this.attack-dt);if(punchHeld && this.attack<.12)this.attackQueued=true;}
  if(this.hitstun<=0 && punchHeld && this.attack===0){this.attack=.30;this.attackId++;this.attackQueued=false;Mite.SFX?.punch();}
  if(this.hitstun<=0 && this.attack===0 && this.attackQueued){this.attack=.30;this.attackId++;this.attackQueued=false;Mite.SFX?.punch();}

  this.state=this.hitstun>0?'hurt':this.attack>0?'punch':this.y<stage.floor?'jump':direction?'walk':'idle';
  if(this.state==='punch')this.frame=this.attack>.22 || this.attack<.06?'punch0':'punch1';
  else if(this.state==='hurt')this.frame='idle1';
  else if(this.state==='jump')this.frame='walk1';
  else if(this.state==='walk')this.frame='walk'+(Math.floor(this.walkClock/.105)%4);
  else this.frame='idle'+(Math.floor(this.clock/.22)%4);
 }
 hurt(amount,fromX){
  if(this.invuln>0||this.dead)return false;
  this.hp=Math.max(0,this.hp-amount);this.invuln=.82;this.hitstun=.24;this.attack=0;this.attackQueued=false;
  this.x += this.x<fromX?-28:28;Mite.SFX?.hurt();
  if(this.hp<=0)this.dead=true;
  return true;
 }
 healFull(){this.hp=this.maxHp;this.dead=false;this.invuln=0;this.hitstun=0;this.attack=0;this.attackQueued=false;this.jumpLatch=false;}
 get body(){return {x:this.x-20,y:this.y-90,width:40,height:90};}
 get hitbox(){return this.attack>.065 && this.attack<.215?{x:this.facing>0?this.x+18:this.x-68,y:this.y-82,width:50,height:25}:null;}
 draw(ctx,images,stage){
  const screenX=this.x-stage.cameraX;
  ctx.fillStyle='#0c142480';ctx.beginPath();ctx.ellipse(screenX,stage.floor-2,27,5,0,0,Math.PI*2);ctx.fill();
  ctx.save();ctx.translate(Math.round(screenX),Math.round(this.y));ctx.scale(this.facing,1);
  ctx.globalAlpha=(this.invuln>0 && Math.floor(this.invuln*18)%2)?.42:1;
  ctx.drawImage(images[this.frame],-52,-120,128,128);ctx.restore();
 }
};
