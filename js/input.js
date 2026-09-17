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
    const releasePointer = e => {
      this.sources.delete('p'+e.pointerId); this.paint();
    };
    this.buttons.forEach(button => {
      button.addEventListener('pointerdown', e => {
        e.preventDefault(); if(e.pointerType==='mouse' && e.button!==0)return;
        try{button.setPointerCapture(e.pointerId);}catch(_e){}
        this.sources.set('p'+e.pointerId, button.dataset.action); this.paint();
      });
      for (const event of ['pointerup','pointercancel','lostpointercapture']) button.addEventListener(event,releasePointer);
    });
    // iOS/Safari can occasionally lose the button-level release event when a finger
    // leaves the element or the browser chrome interrupts the gesture. Catch releases
    // globally as a safety net so movement can never remain latched.
    window.addEventListener('pointerup',releasePointer,{passive:true});
    window.addEventListener('pointercancel',releasePointer,{passive:true});
    document.addEventListener('touchcancel',()=>this.clear(),{passive:true});
    window.addEventListener('keydown',e=>{if(this.keyMap[e.code]){e.preventDefault();this.sources.set(e.code,this.keyMap[e.code]);this.paint();}});
    window.addEventListener('keyup',e=>{if(this.keyMap[e.code]){e.preventDefault();this.sources.delete(e.code);this.paint();}});
    window.addEventListener('blur',()=>this.clear());
    window.addEventListener('pagehide',()=>this.clear());
    window.addEventListener('resize',()=>this.clear());
    document.addEventListener('visibilitychange',()=>this.clear());
    document.addEventListener('contextmenu',e=>e.preventDefault());
    // Keep Safari from interpreting rapid game-button taps as page zoom/gesture commands.
    for(const event of ['gesturestart','gesturechange','gestureend'])document.addEventListener(event,e=>e.preventDefault(),{passive:false});
    document.addEventListener('touchmove',e=>{if(e.target.closest?.('.console'))e.preventDefault();},{passive:false});
    document.addEventListener('touchend',e=>{if(e.target.closest?.('.console'))e.preventDefault();},{passive:false});
    document.addEventListener('dblclick',e=>{if(e.target.closest?.('.console'))e.preventDefault();},{passive:false});
  }
  down(action){return [...this.sources.values()].includes(action);}
  paint(){this.buttons.forEach(b=>b.classList.toggle('held',this.down(b.dataset.action)));}
  clear(){this.sources.clear();this.paint();}
};
