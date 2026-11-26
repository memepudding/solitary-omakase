'use client';
import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as T from 'three';
import RiggedTeepu from './RiggedTeepu';
import {sampleChefRoutine} from '@/lib/chef-routine';
import {GUEST_SEAT,COOK_STATION,type ChefMode} from '@/lib/staging';
export default function ImportedTeepu({mode,reducedMotion,stirring=false,cooking=false}:{mode:ChefMode;reducedMotion:boolean;stirring?:boolean;cooking?:boolean}){
 const root=useRef<T.Group>(null),body=useRef<T.Group>(null);
 useFrame(({clock},dt)=>{
  if(!root.current||!body.current)return;
  const t=clock.elapsedTime,r=sampleChefRoutine(t,reducedMotion),routine=mode==='routine'&&!cooking;
  root.current.position.lerp(new T.Vector3(routine?T.MathUtils.clamp(r.x,-1.65,1.65):cooking?COOK_STATION.chefX:GUEST_SEAT.x,cooking?COOK_STATION.chefY:.32,routine?T.MathUtils.clamp(r.z,-1.85,-.8):cooking?COOK_STATION.chefZ:-.8),1-Math.exp(-dt*5));
  root.current.rotation.y=routine?r.yaw:0;
  body.current.position.y=reducedMotion||cooking?0:routine&&r.moving?Math.abs(Math.sin(t*13))*.055:Math.sin(t*1.6)*.009;
  body.current.rotation.z=reducedMotion||cooking?0:mode==='think'?Math.sin(t*2)*.045:routine&&r.moving?Math.sin(t*13)*.025:0;
  body.current.rotation.x=mode==='serve'?.055:0;
 });
 return <group ref={root}><group ref={body} scale={3.25}><RiggedTeepu pose={stirring?'stir':'rest'} reducedMotion={reducedMotion}/></group></group>;
}
