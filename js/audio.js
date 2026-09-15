'use strict';
window.Mite = window.Mite || {};
Mite.SFX = (()=>{
  let ac=null, muted=false;
  const get=()=>{if(muted)return null;try{ac ||= new (window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume();return ac}catch{return null}};
  const tone=(freq=440,dur=.05,type='square',vol=.045,slide=0)=>{const c=get();if(!c)return;const o=c.createOscillator(),g=c.createGain(),t=c.currentTime;o.type=type;o.frequency.setValueAtTime(freq,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(40,freq+slide),t+dur);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+dur+.015)};
  const noise=(dur=.035,vol=.025)=>{const c=get();if(!c)return;const len=Math.max(1,Math.floor(c.sampleRate*dur)),b=c.createBuffer(1,len,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*(1-i/len);const s=c.createBufferSource(),g=c.createGain();s.buffer=b;g.gain.value=vol;s.connect(g);g.connect(c.destination);s.start()};
  const api={
    unlock:get,
    punch(){tone(170,.045,'square',.028,70)},
    jump(){tone(300,.08,'square',.025,220)},
    hit(){noise(.045,.04);tone(120,.045,'square',.025,-50)},
    hurt(){noise(.07,.035);tone(95,.10,'sawtooth',.03,-35)},
    throw(){tone(520,.04,'square',.018,-170)},
    ko(){tone(190,.08,'square',.03,-100);setTimeout(()=>tone(95,.11,'square',.025,-40),55)},
    boss(){tone(105,.18,'sawtooth',.035,-25);setTimeout(()=>tone(85,.22,'sawtooth',.035,-20),150)},
    clear(){[392,523,659,784].forEach((f,i)=>setTimeout(()=>tone(f,.14,'square',.025,20),i*105))},
    gameover(){[220,165,110].forEach((f,i)=>setTimeout(()=>tone(f,.18,'square',.025,-20),i*150))},
    toggle(){muted=!muted;return muted},
    get muted(){return muted}
  };
  window.addEventListener('pointerdown',get,{passive:true});window.addEventListener('keydown',get,{passive:true});
  return api;
})();
