'use client';
import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as T from 'three';
import RiggedTeepu from './RiggedTeepu';
import {sampleChefRoutine} from '@/lib/chef-routine';
import {type ChefMode} from '@/lib/staging';
import {sampleStoolMove,stoolTop,CLIMB_SECONDS,HOP_SECONDS,CHEF_FLOOR_Y,type ChefPoint} from '@/lib/chef-stool';
export default function ImportedTeepu({mode,reducedMotion,onStool,stirring=false,cooking=false}:{mode:ChefMode;reducedMotion:boolean;onStool:boolean;stirring?:boolean;cooking?:boolean}){
 const root=useRef<T.Group>(null),body=useRef<T.Group>(null);
 const previous=useRef(false),move=useRef<{from:ChefPoint;elapsed:number;up:boolean}|null>(null);
 useFrame(({clock},dt)=>{
  if(!root.current||!body.current)return;
  const t=clock.elapsedTime,r=sampleChefRoutine(t,reducedMotion);
  if(previous.current!==onStool){
   previous.current=onStool;
   move.current={from:root.current.position.clone(),elapsed:0,up:onStool};
  }
  const transition=move.current;
  if(transition){
   transition.elapsed+=dt;
   const p=transition.elapsed/(transition.up?CLIMB_SECONDS:HOP_SECONDS);
   const pos=sampleStoolMove(transition.from,p,transition.up,reducedMotion);
   root.current.position.set(pos.x,pos.y,pos.z);
   if(p>=1)move.current=null;
  }else if(onStool){
   root.current.position.set(stoolTop.x,stoolTop.y,stoolTop.z);
  }else{
   root.current.position.lerp(new T.Vector3(T.MathUtils.clamp(r.x,-1.65,1.65),CHEF_FLOOR_Y,T.MathUtils.clamp(r.z,-1.85,-.8)),1-Math.exp(-dt*3));
  }
  const routine=!onStool&&!transition;
  const yaw=routine?r.yaw:0;
  root.current.rotation.y+=Math.atan2(Math.sin(yaw-root.current.rotation.y),Math.cos(yaw-root.current.rotation.y))*(1-Math.exp(-dt*8));
  body.current.position.y=reducedMotion||onStool||transition?0:r.moving?Math.abs(Math.sin(t*13))*.055:Math.sin(t*1.6)*.009;
  body.current.rotation.z=reducedMotion||cooking||transition?0:mode==='think'?Math.sin(t*2)*.045:routine&&r.moving?Math.sin(t*13)*.025:0;
  body.current.rotation.x=transition&&!reducedMotion?-.07*Math.sin(Math.PI*Math.min(1,transition.elapsed/(transition.up?CLIMB_SECONDS:HOP_SECONDS))):mode==='serve'?.055:0;
 });
 return <group ref={root} position={[0,CHEF_FLOOR_Y,-.8]}><group ref={body} scale={3.25}><RiggedTeepu pose={stirring?'stir':'rest'} reducedMotion={reducedMotion}/></group></group>;
}
