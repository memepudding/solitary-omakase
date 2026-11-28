'use client';
import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as T from 'three';
import RiggedTeepu from './RiggedTeepu';
import {sampleChefRoutine} from '@/lib/chef-routine';
import {COOK_STATION,type ChefMode} from '@/lib/staging';
export default function ImportedTeepu({mode,reducedMotion,atStation,stirring=false,cooking=false}:{mode:ChefMode;reducedMotion:boolean;atStation:boolean;stirring?:boolean;cooking?:boolean}){
 const root=useRef<T.Group>(null),body=useRef<T.Group>(null);
 useFrame(({clock},dt)=>{
  if(!root.current||!body.current)return;
  const t=clock.elapsedTime,r=sampleChefRoutine(t,reducedMotion),routine=!atStation;
  const destination=new T.Vector3(routine?T.MathUtils.clamp(r.x,-1.65,1.65):COOK_STATION.chefX,.32,routine?T.MathUtils.clamp(r.z,-1.85,-.8):COOK_STATION.chefZ);
  const moving=root.current.position.distanceTo(destination)>.025;
  root.current.position.lerp(destination,reducedMotion?1:1-Math.exp(-dt*5));
  const yaw=routine?r.yaw:0;
  root.current.rotation.y+=Math.atan2(Math.sin(yaw-root.current.rotation.y),Math.cos(yaw-root.current.rotation.y))*(1-Math.exp(-dt*8));
  body.current.position.y=reducedMotion||cooking?0:moving?Math.abs(Math.sin(t*13))*.025:0;
  body.current.rotation.z=reducedMotion||cooking?0:mode==='think'?Math.sin(t*2)*.045:moving?Math.sin(t*13)*.02:0;
  body.current.rotation.x=mode==='serve'?.055:0;
 });
 return <group ref={root} position={[0,.32,-.8]}><group ref={body} scale={3.25}><RiggedTeepu pose={stirring?'stir':'rest'} reducedMotion={reducedMotion}/></group></group>;
}
