'use client';

import {useEffect,useRef} from 'react';

export default function BackgroundMusic({enabled}:{enabled:boolean}) {
 const allowed=useRef(enabled);
 const playback=useRef<{music:HTMLAudioElement;start:()=>void}|null>(null);
 allowed.current=enabled;
 useEffect(()=>{
  const music=new Audio('/audio/omakase-no-yoru.mp3');
  music.loop=true;
  music.preload='none';
  let context:AudioContext|null=null;
  let disposed=false;
  const start=()=>{
   if(!allowed.current||disposed)return;
   try {
    if(!context){
     context=new AudioContext();
     const source=context.createMediaElementSource(music),gain=context.createGain();
     gain.gain.value=.16;
     source.connect(gain);gain.connect(context.destination);
    }
    void context.resume().catch(()=>{});
    void music.play().catch(()=>{});
   } catch { /* Retry on the next gesture if audio is blocked. */ }
  };
  playback.current={music,start};
  // Browsers require a first gesture; retain the same track through every meal stage.
  window.addEventListener('pointerdown',start);
  window.addEventListener('keydown',start);
  return()=>{
   disposed=true;
   window.removeEventListener('pointerdown',start);
   window.removeEventListener('keydown',start);
   music.pause();music.removeAttribute('src');music.load();
   void context?.close();playback.current=null;
  };
 },[]);
 useEffect(()=>{
  if(enabled)playback.current?.start();else playback.current?.music.pause();
 },[enabled]);
 return null;
}
