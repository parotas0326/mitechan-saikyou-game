'use strict';
window.Mite=window.Mite||{};
Mite.SFX=(()=>{
 let ac=null,muted=false,readyPlayed=false,bgm=null,bgmBuf=null,bgmSource=null,bgmLoading=null;
 const get=()=>{if(muted)return null;try{ac||=new(window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume();return ac}catch{return null}};
 const tone=(freq=440,dur=.05,type='square',vol=.045,slide=0)=>{const c=get();if(!c)return;const o=c.createOscillator(),g=c.createGain(),t=c.currentTime;o.type=type;o.frequency.setValueAtTime(freq,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(40,freq+slide),t+dur);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+dur+.015)};
 const noise=(dur=.035,vol=.025)=>{const c=get();if(!c)return;const len=Math.max(1,Math.floor(c.sampleRate*dur)),b=c.createBuffer(1,len,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*(1-i/len);const s=c.createBufferSource(),g=c.createGain();s.buffer=b;g.gain.value=vol;s.connect(g);g.connect(c.destination);s.start()};
 async function ensureBgm(){
  const c=get();if(!c||bgmBuf)return bgmBuf;if(!bgmLoading)bgmLoading=fetch('assets/bgm.m4a').then(r=>r.arrayBuffer()).then(b=>c.decodeAudioData(b)).then(b=>bgmBuf=b).catch(()=>null);return bgmLoading;
 }
 async function startBgm(){
  if(muted)return;const c=get();if(!c)return;const buf=await ensureBgm();if(buf){if(bgmSource)return;const s=c.createBufferSource(),g=c.createGain();s.buffer=buf;s.loop=true;g.gain.value=.36;s.connect(g);g.connect(c.destination);s.start();bgmSource=s;s.onended=()=>{if(bgmSource===s)bgmSource=null};return;}
  if(!bgm){bgm=new Audio('assets/bgm.m4a');bgm.loop=true;bgm.volume=.38;bgm.preload='auto';}if(bgm.paused){bgm.currentTime=0;bgm.play().catch(()=>{});}
 }
 function stopBgm(){if(bgmSource){try{bgmSource.stop()}catch{}bgmSource=null;}if(bgm){bgm.pause();bgm.currentTime=0;}}
 const api={unlock(){get();startBgm();},startBgm,stopBgm,
  punch(step=1){tone(160+step*28,.045,'square',.026,65)},jump(){tone(300,.08,'square',.025,220)},
  hit(strong=false){noise(strong?.065:.04,strong?.055:.04);tone(strong?92:120,strong?.07:.045,'square',.026,-45)},hurt(){noise(.07,.035);tone(95,.10,'sawtooth',.03,-35)},
  throw(){tone(520,.05,'square',.018,-180)},charge(){tone(120,.17,'sawtooth',.025,120)},enemyAttack(type){tone(type==='kick'?210:160,.08,'square',.02,type==='kick'?-90:80)},
  ko(){tone(190,.08,'square',.03,-100);setTimeout(()=>tone(95,.11,'square',.025,-40),55)},boss(){tone(105,.18,'sawtooth',.035,-25);setTimeout(()=>tone(85,.22,'sawtooth',.035,-20),150)},
  powerReady(){if(readyPlayed)return;readyPlayed=true;[440,660,880].forEach((f,i)=>setTimeout(()=>tone(f,.09,'square',.025,40),i*70))},resetPowerReady(){readyPlayed=false;},
  cutin(){noise(.075,.055);tone(170,.11,'sawtooth',.035,520);setTimeout(()=>tone(520,.09,'square',.025,520),70);setTimeout(()=>noise(.055,.035),120)},
  special(){readyPlayed=false;noise(.14,.05);[130,180,260,420].forEach((f,i)=>setTimeout(()=>tone(f,.17,'sawtooth',.035,220),i*60))},
  clear(){[392,523,659,784].forEach((f,i)=>setTimeout(()=>tone(f,.14,'square',.025,20),i*105))},gameover(){[220,165,110].forEach((f,i)=>setTimeout(()=>tone(f,.18,'square',.025,-20),i*150))},
  toggle(){muted=!muted;if(muted)stopBgm();else startBgm();return muted},get muted(){return muted}
 };
 window.addEventListener('pointerdown',()=>api.unlock(),{passive:true,once:true});window.addEventListener('keydown',()=>api.unlock(),{passive:true,once:true});return api;
})();
