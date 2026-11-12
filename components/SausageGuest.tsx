'use client';
import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {RoundedBox} from '@react-three/drei';
import * as T from 'three';
export const GUEST_POSITION:[number,number,number]=[5.24,.84,-.8];
function Ball({p,s,c}:{p:[number,number,number];s:[number,number,number];c:string}){return <mesh position={p} scale={s} castShadow><sphereGeometry args={[1,24,16]}/><meshStandardMaterial color={c} roughness={.5}/></mesh>;}
export default function SausageGuest({reducedMotion,onApproach}:{reducedMotion:boolean;onApproach:()=>void}){const body=useRef<T.Group>(null),spoon=useRef<T.Group>(null);useFrame(({clock})=>{if(body.current)body.current.rotation.z=reducedMotion?0:Math.sin(clock.elapsedTime*1.2)*.015;if(spoon.current)spoon.current.rotation.x=reducedMotion?0:Math.sin(clock.elapsedTime*1.6)*.16;});return <group position={GUEST_POSITION} rotation={[0,-Math.PI/2,0]} onClick={e=>{e.stopPropagation();onApproach();}}>
 <group ref={body} scale={1.55}><mesh position={[0,.75,0]} castShadow><capsuleGeometry args={[.36,.8,8,32]}/><meshStandardMaterial color="#ef8433" roughness={.48}/></mesh><Ball p={[0,1.55,0]} s={[.09,.12,.09]} c="#ef8433"/>
 {[-1,1].map(side=><group key={side}><Ball p={[side*.31,.15,0]} s={[.22,.17,.22]} c="#ef8433"/><Ball p={[side*.48,.22,0]} s={[.12,.18,.15]} c="#ef8433"/><RoundedBox position={[side*.17,1.22,.33]} args={[.25,.13,.09]} radius={.045}><meshStandardMaterial color="#4b3526"/></RoundedBox><Ball p={[side*.14,1.01,.36]} s={[.032,.06,.026]} c="#3b2b20"/></group>)}
 <Ball p={[0,.13,.2]} s={[.18,.19,.2]} c="#ef8433"/><mesh position={[0,.86,.38]}><torusGeometry args={[.065,.028,12,24]}/><meshStandardMaterial color="#ffc17e"/></mesh>
 </group>
 <group position={[0,1.24,1.05]}><mesh><cylinderGeometry args={[.24,.24,.025,32]}/><meshStandardMaterial color="#f2d5aa"/></mesh><mesh position={[0,.1,0]}><cylinderGeometry args={[.12,.17,.18,32]}/><meshStandardMaterial color="#edba5b" roughness={.25}/></mesh><mesh position={[0,.195,0]}><cylinderGeometry args={[.12,.12,.013,32]}/><meshStandardMaterial color="#9a4c20" roughness={.12}/></mesh></group>
 </group>;}
