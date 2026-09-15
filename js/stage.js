'use strict';
Mite.Stage = class {
 constructor(background){this.width=3400;this.height=360;this.floor=300;this.viewportWidth=640;this.cameraX=0;this.background=background||null;this.followX=245;this.lockX=null;}
 updateCamera(player){let maxCam=this.width-this.viewportWidth;if(this.lockX!=null)maxCam=Math.min(maxCam,Math.max(0,this.lockX-this.viewportWidth+120));const wanted=player.x-this.followX;this.cameraX=Math.max(0,Math.min(maxCam,wanted));}
 draw(ctx){ctx.fillStyle='#101827';ctx.fillRect(0,0,640,360);const cam=this.cameraX;if(this.background){const tileW=960;for(let x=0;x<this.width;x+=tileW){const sx=Math.round(x-cam);if(sx>640||sx+tileW<0)continue;ctx.drawImage(this.background,sx,0,tileW,360);}}
 const tint=(x,w,a)=>{const sx=x-cam;if(sx<640&&sx+w>0){ctx.fillStyle=`rgba(2,6,16,${a})`;ctx.fillRect(sx,0,w,300);}};tint(1180,560,.16);tint(1740,620,.32);tint(2360,440,.5);const plaza=2800-cam;if(plaza<640){ctx.fillStyle='rgba(9,17,32,.44)';ctx.fillRect(Math.max(0,plaza),28,640-Math.max(0,plaza),255);}
 ctx.fillStyle='rgba(10,15,24,.72)';ctx.fillRect(0,this.floor,640,60);ctx.fillStyle='#d5b76b';ctx.fillRect(0,this.floor,640,3);ctx.fillStyle='rgba(94,104,118,.72)';for(let wx=Math.floor(cam/40)*40;wx<cam+680;wx+=40){const x=Math.round(wx-cam);ctx.fillRect(x,309,1,51);ctx.fillRect(x+8,329,24,2);}ctx.font='bold 11px monospace';ctx.fillStyle='rgba(235,240,248,.68)';ctx.fillText('STAGE 1  夜の商店街',18,24);}
 constrain(player){player.x=Math.max(48,Math.min(this.width-76,player.x));if(this.lockX!=null)player.x=Math.min(player.x,this.lockX);if(player.y>=this.floor){player.y=this.floor;player.vy=0;}}
};
