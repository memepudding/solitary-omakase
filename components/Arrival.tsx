'use client';
import {useEffect,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as T from 'three';
import {GUEST_SEAT} from '@/lib/staging';
export default function Arrival({target,onNear,onSelect,reducedMotion}:{target:boolean;onNear:()=>void;onSelect:()=>void;reducedMotion:boolean}){
 const avatar=useRef<T.Group>(null),arrow=useRef<T.Group>(null),keys=useRef(new Set<string>()),legs=useRef<T.Group>(null),latched=useRef(false);
 useEffect(()=>{const down=(e:KeyboardEvent)=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(e.key)){e.preventDefault();keys.current.add(e.key);}},up=(e:KeyboardEvent)=>keys.current.delete(e.key),blur=()=>keys.current.clear();window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);};},[]);
 useFrame(({clock},dt)=>{if(!avatar.current)return;const p=avatar.current.position,k=keys.current;let dx=Number(k.has('d')||k.has('ArrowRight'))-Number(k.has('a')||k.has('ArrowLeft')),dz=Number(k.has('s')||k.has('ArrowDown'))-Number(k.has('w')||k.has('ArrowUp'));if(target){dx=GUEST_SEAT.x-p.x;dz=GUEST_SEAT.z-p.z;const length=Math.hypot(dx,dz);if(length>.01){dx/=length;dz/=length;}}
 const moving=Math.hypot(dx,dz)>.01;if(moving){p.x=T.MathUtils.clamp(p.x+dx*Math.min(dt,.05)*1.7,-4,4);p.z=T.MathUtils.clamp(p.z+dz*Math.min(dt,.05)*1.7,GUEST_SEAT.z,6);avatar.current.rotation.y=Math.atan2(dx,dz);}
 // Accept an approach at the front edge of the actual stool, even when the
 // movement clamp stops the avatar. Align before handing off to the seat camera.
 const close=Math.abs(p.x-GUEST_SEAT.x)<.42&&Math.abs(p.z-GUEST_SEAT.z)<.48;
 if(!latched.current&&close&&(target||dz<0)){
  latched.current=true;p.set(GUEST_SEAT.x,0,GUEST_SEAT.z);keys.current.clear();onNear();
 }

 p.y=moving&&!reducedMotion?Math.abs(Math.sin(clock.elapsedTime*11))*.045:0;if(legs.current)legs.current.children.forEach((leg,i)=>leg.rotation.x=moving&&!reducedMotion?Math.sin(clock.elapsedTime*11+i*Math.PI)*.25:0);
 if(arrow.current)arrow.current.position.y=1.9+(reducedMotion?0:Math.sin(clock.elapsedTime*3)*.12);
 });
 return <><group ref={avatar} position={[GUEST_SEAT.x,0,5.4]} rotation={[0,Math.PI,0]}>
 <mesh position={[0,1.15,0]} castShadow><sphereGeometry args={[.22,24,16]}/><meshStandardMaterial color="#e9c9a1"/></mesh><mesh position={[0,.74,0]} castShadow><capsuleGeometry args={[.19,.38,8,20]}/><meshStandardMaterial color="#78856a"/></mesh>
 <group ref={legs}>{[-1,1].map(side=><mesh key={side} position={[side*.11,.28,0]} castShadow><capsuleGeometry args={[.075,.34,6,12]}/><meshStandardMaterial color="#dec9a8"/></mesh>)}</group>{[-1,1].map(side=><mesh key={side} position={[side*.25,.72,0]} rotation={[0,0,side*.1]}><capsuleGeometry args={[.06,.32,6,12]}/><meshStandardMaterial color="#e9c9a1"/></mesh>)}
 </group><group ref={arrow} position={[GUEST_SEAT.x,1.9,GUEST_SEAT.z]} onClick={e=>{e.stopPropagation();onSelect();}}><mesh rotation={[0,0,Math.PI]}><coneGeometry args={[.17,.28,4]}/><meshStandardMaterial color="#ffe2a0" emissive="#e0ad50" emissiveIntensity={.7}/></mesh><mesh position={[0,.23,0]}><cylinderGeometry args={[.055,.055,.3,12]}/><meshStandardMaterial color="#ffe2a0"/></mesh></group></>;
}
