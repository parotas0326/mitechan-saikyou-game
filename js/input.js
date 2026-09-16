'use strict';
window.Mite = window.Mite || {};
Mite.Input = class {
  constructor() {
    this.sources = new Map();
    this.buttons = [...document.querySelectorAll('[data-action]')];
    this.keyMap = {
      ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',
      KeyZ:'punch',KeyX:'jump',KeyV:'special'
    };
    this.buttons.forEach(button => {
      button.addEventListener('pointerdown', e => {
        e.preventDefault(); if(e.pointerType==='mouse' && e.button!==0)return;
        try{button.setPointerCapture(e.pointerId);}catch(_e){}
        this.sources.set('p'+e.pointerId, button.dataset.action); this.paint();
      });
      for (const event of ['pointerup','pointercancel','lostpointercapture']) button.addEventListener(event,e=>{
        this.sources.delete('p'+e.pointerId);this.paint();
      });
    });
    window.addEventListener('keydown',e=>{if(this.keyMap[e.code]){e.preventDefault();this.sources.set(e.code,this.keyMap[e.code]);this.paint();}});
    window.addEventListener('keyup',e=>{if(this.keyMap[e.code]){e.preventDefault();this.sources.delete(e.code);this.paint();}});
    window.addEventListener('blur',()=>this.clear());
    window.addEventListener('pagehide',()=>this.clear());
    window.addEventListener('resize',()=>this.clear());
    document.addEventListener('visibilitychange',()=>this.clear());
    document.addEventListener('contextmenu',e=>e.preventDefault());
    document.addEventListener('gesturestart',e=>e.preventDefault(),{passive:false});
    document.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});
  }
  down(action){return [...this.sources.values()].includes(action);}
  paint(){this.buttons.forEach(b=>b.classList.toggle('held',this.down(b.dataset.action)));}
  clear(){this.sources.clear();this.paint();}
};
