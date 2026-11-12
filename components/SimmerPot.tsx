'use client';
import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as T from 'three';
export default function SimmerPot({reducedMotion}:{reducedMotion:boolean}){
 const bubbles=useRef<T.Group>(null),steam=useRef<T.Group>(null);
 useFrame(({clock})=>{const t=clock.elapsedTime;bubbles.current?.children.forEach((o,i)=>{const p=(t*.6+i*.137)%1;o.position.y=.39+(reducedMotion?0:Math.sin(p*Math.PI)*.045);o.scale.setScalar(reducedMotion?.7:.35+Math.sin(p*Math.PI)*.65);});steam.current?.children.forEach((o,i)=>{const p=(t*.22+i/7)%1;o.position.set(Math.sin(i*2+t)*.12,.5+p*.85,Math.cos(i*2)*.14);o.scale.setScalar(.07+p*.14);( (o as T.Mesh).material as T.MeshStandardMaterial).opacity=reducedMotion?0:Math.sin(p*Math.PI)*.17;});});
 return <group position={[.25,1.8,-3.9]}><mesh position={[0,.035,0]}><boxGeometry args={[1.25,.07,.9]}/><meshStandardMaterial color="#202a29" metalness={.5} roughness={.18}/></mesh><mesh rotation={[-Math.PI/2,0,0]} position={[0,.075,0]}><torusGeometry args={[.36,.012,8,48]}/><meshStandardMaterial color="#bd5140" emissive="#c74525" emissiveIntensity={.65}/></mesh>
 <mesh position={[0,.27,0]}><cylinderGeometry args={[.4,.35,.36,48,1,true]}/><meshStandardMaterial color="#697570" metalness={.65} roughness={.25} side={T.DoubleSide}/></mesh><mesh position={[0,.43,0]} rotation={[-Math.PI/2,0,0]}><torusGeometry args={[.4,.025,10,48]}/><meshStandardMaterial color="#adb3a4" metalness={.6} roughness={.22}/></mesh><mesh position={[0,.39,0]}><cylinderGeometry args={[.375,.375,.025,48]}/><meshStandardMaterial color="#c94727" roughness={.18}/></mesh>
 {[-1,1].map(side=><mesh key={side} position={[side*.46,.29,0]}><boxGeometry args={[.22,.06,.13]}/><meshStandardMaterial color="#303b35"/></mesh>)}
 <group ref={bubbles}>{Array.from({length:10},(_,i)=><mesh key={i} position={[Math.sin(i*2.4)*.26,.4,Math.cos(i*2.4)*.26]}><sphereGeometry args={[.035,12,8]}/><meshStandardMaterial color="#ed8050" roughness={.15}/></mesh>)}</group><group ref={steam}>{Array.from({length:7},(_,i)=><mesh key={i}><sphereGeometry args={[1,12,8]}/><meshStandardMaterial color="#fff6df" transparent opacity={.1} depthWrite={false}/></mesh>)}</group>
 </group>;
}
