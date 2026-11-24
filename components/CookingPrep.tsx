'use client';
import {useEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {RoundedBox,useGLTF} from '@react-three/drei';
import * as T from 'three';
import AssetFood from './AssetFood';
import {dishModel,isAssetDish,type DishKind} from '@/lib/menu';
import {preparationFor,PREP_STEP_MS,type PrepAction} from '@/lib/preparation';
import {GUEST_SEAT} from '@/lib/staging';

type Vec=[number,number,number];
function Pebble({position=[0,0,0],scale=[1,1,1],color='#f4e4ba'}:{position?:Vec;scale?:Vec;color?:string}){
 return <mesh position={position} scale={scale} castShadow><sphereGeometry args={[1,16,12]}/><meshStandardMaterial color={color} roughness={.58}/></mesh>;
}
function Cuboid({position=[0,0,0],size,color}:{position?:Vec;size:Vec;color:string}){
 return <RoundedBox position={position} args={size} radius={.025} smoothness={2} castShadow><meshStandardMaterial color={color} roughness={.62}/></RoundedBox>;
}
function Bowl({pot=false}:{pot?:boolean}){
 const profile=useMemo(()=>[new T.Vector2(0,0),new T.Vector2(.25,0),new T.Vector2(.34,.05),new T.Vector2(.39,.23),new T.Vector2(.36,.23),new T.Vector2(.31,.06),new T.Vector2(0,.04)],[]);
 return <group>
  <mesh castShadow receiveShadow><latheGeometry args={[profile,32]}/><meshStandardMaterial color={pot?'#685b45':'#e9d8ba'} roughness={.3} side={T.DoubleSide}/></mesh>
  {pot&&[-1,1].map(side=><mesh key={side} position={[side*.43,.14,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.09,.025,8,20]}/><meshStandardMaterial color="#4c4033"/></mesh>)}
 </group>;
}
function Paw({side,action,phase,reducedMotion,torch}:{torch:boolean;side:number;action:PrepAction;phase:React.RefObject<number>;reducedMotion:boolean}){
 const hand=useRef<T.Group>(null);
 useFrame(()=>{
  if(!hand.current)return;
  const t=reducedMotion?1.2:phase.current,move=reducedMotion?0:Math.sin(t*7);
  const mixing=action==='mix'||action==='simmer';
  hand.current.position.set(side*.52,.37,-.12);
  hand.current.rotation.set(-.15,side*.15,side*.18);
  if(side===1){
   if(action==='slice'){hand.current.position.x=.18+Math.floor(t*2)%4*.06;hand.current.position.y=.34+Math.abs(move)*.13;}
   if(mixing){hand.current.position.x=.18+Math.cos(t*3)*.09;hand.current.position.z=Math.sin(t*3)*.09;}
   if(action==='pour'){hand.current.position.set(.3,.58,-.04);hand.current.rotation.z=-.65;}
   if(action==='garnish'||action==='plate'){hand.current.position.x=.28*(1-Math.min(t/2,1));hand.current.position.y=.7-Math.min(t/2,1)*.25;}
   if(action==='sear'){hand.current.position.set(.38,.52,move*.1);}
  }
  if(action==='shape'||action==='roll'){hand.current.position.x=side*(.28+Math.abs(move)*.045);hand.current.position.z=move*.07;}
 });
 return <group ref={hand}>
  <mesh position={[side*.07,.17,-.35]} rotation={[-Math.PI/2+.4,0,-side*.15]}><cylinderGeometry args={[.13,.18,.85,20]}/><meshStandardMaterial color="#f5eadc" roughness={.8}/></mesh>
  <Pebble scale={[.14,.105,.17]} color="#efbd73"/>
  {[-.07,0,.07].map(x=><Pebble key={x} position={[x,-.02,.115]} scale={[.044,.055,.055]} color="#f5c982"/>)}
  {side===1&&action==='slice'&&<group position={[-.06,-.08,.16]}><Cuboid size={[.06,.06,.19]} color="#694a31"/><mesh position={[-.1,-.08,.17]}><boxGeometry args={[.012,.15,.34]}/><meshStandardMaterial color="#c9cecb" metalness={.65} roughness={.2}/></mesh></group>}
  {side===1&&(action==='mix'||action==='simmer'||action==='rice')&&<group position={[-.06,-.13,.07]} rotation={[0,0,.3]}><mesh><cylinderGeometry args={[.018,.018,.44,10]}/><meshStandardMaterial color="#91633c"/></mesh><Pebble position={[0,-.23,0]} scale={[.07,.025,.1]} color="#a37547"/></group>}
  {side===1&&action==='pour'&&<mesh position={[-.02,-.05,.08]}><cylinderGeometry args={[.08,.07,.17,20]}/><meshStandardMaterial color="#e7dcc9" roughness={.25}/></mesh>}
  {side===1&&action==='sear'&&torch&&<group position={[-.04,-.08,.09]} rotation={[0,0,.5]}><mesh><cylinderGeometry args={[.04,.04,.22,16]}/><meshStandardMaterial color="#7b7e7c" metalness={.7} roughness={.3}/></mesh><mesh position={[0,-.17,0]}><coneGeometry args={[.045,.18,16]}/><meshBasicMaterial color="#83c7e7" transparent opacity={.65}/></mesh></group>}
 </group>;
}
export default function CookingPrep({kind,step,reducedMotion,onReady}:{kind:DishKind;step:number;reducedMotion:boolean;onReady:()=>void}){
 const plan=preparationFor(kind),action=plan[step].action,final=step===plan.length-1;
 const phase=useRef(0),slices=useRef<T.Group>(null),raw=useRef<T.Group>(null),garnish=useRef<T.Group>(null),steam=useRef<T.Group>(null),stream=useRef<T.Mesh>(null);
 const id=parseInt(kind),fish=[2,11,17,23,26,32,38,41,46,47,49,50,53,56,59].includes(id);
 const green=[16,31,43,55].includes(id),mushroom=[4,20].includes(id);
 const color=id===5?'#975432':green?'#769448':mushroom?'#c8ac83':fish?(id===17||id===23||id===41?'#f3d8bd':id===38||id===53?'#c85e59':'#ed9970'):id===13?'#ad815a':id===22?'#da6547':id===7?'#f8e9c5':'#e7bb64';
 useEffect(()=>{phase.current=0;},[kind,step]);
 useEffect(()=>{if(isAssetDish(kind))useGLTF.preload(dishModel(kind));},[kind]);
 useFrame((_,dt)=>{
  phase.current+=Math.min(dt,.1);const p=Math.min(phase.current/(PREP_STEP_MS/1000),1);
  if(raw.current)raw.current.scale.x=action==='slice'?Math.max(.05,1-p*.9):1;
  if(slices.current)slices.current.children.forEach((o,i)=>{o.visible=reducedMotion||p>(i+1)/7;});
  if(garnish.current){garnish.current.position.y=reducedMotion?.35:.8-Math.min(p*1.6,1)*.45;garnish.current.visible=p<.82;}
  if(stream.current)stream.current.scale.y=reducedMotion?1:Math.max(.05,Math.sin(Math.PI*p));
  if(steam.current)steam.current.children.forEach((o,i)=>{const u=reducedMotion?.4:(phase.current*.45+i*.24)%1;o.position.y=.24+u*.45;o.position.x=Math.sin(i*2+u*2)*.15;o.scale.setScalar(.035+u*.045);(o as T.Mesh<T.SphereGeometry,T.MeshBasicMaterial>).material.opacity=(1-u)*.22;});
 });
 const cooking=action==='simmer'||action==='mix'||action==='rice';
 return <group position={[GUEST_SEAT.x,2.13,.88]}>
  {/* The unrigged chef uses close-up sleeve and paw props for gentle, bounded gestures. */}
  <RoundedBox position={[0,.82,-.64]} args={[1.3,1.75,.55]} radius={.18} smoothness={4}><meshStandardMaterial color="#f4e9da" roughness={.8}/></RoundedBox>
  <group position={[0,.83,-.352]} rotation={[0,0,-.5]}><Cuboid size={[.04,1.25,.015]} color="#dbcebb"/></group>
  <Cuboid position={[0,.22,-.34]} size={[1.15,.08,.045]} color="#e2d4bf"/>
  <Cuboid position={[0,-.035,0]} size={[1.85,.065,1.22]} color="#c49663"/>
  <Paw side={-1} action={action} phase={phase} reducedMotion={reducedMotion} torch={[2,26,56].includes(id)}/><Paw side={1} action={action} phase={phase} reducedMotion={reducedMotion} torch={[2,26,56].includes(id)}/>
  <group visible={final} position={[0,.025,.08]} scale={.78}>
   {isAssetDish(kind)&&<AssetFood kind={kind} onReady={onReady}/>}
  </group>
  {!final&&<group position={[0,.015,.08]}>
   {action==='sear'&&![2,26,56].includes(id)&&<group position={[0,-.025,0]}><mesh><cylinderGeometry args={[.43,.4,.04,32]}/><meshStandardMaterial color="#4a4238" roughness={.4}/></mesh><Cuboid position={[-.52,0,0]} size={[.3,.04,.07]} color="#6d5036"/></group>}
   {cooking?<><Bowl pot={action==='simmer'}/><mesh position={[0,.13,0]}><cylinderGeometry args={[.32,.32,.02,32]}/><meshStandardMaterial color={action==='rice'?'#f5e8c8':color} roughness={.25}/></mesh>{Array.from({length:12},(_,i)=><Pebble key={i} position={[Math.sin(i*2.4)*.22,.15,Math.cos(i*2.4)*.22]} scale={[.045,.025,.03]} color={action==='rice'?'#fff0d1':color}/>)}</>
   :action==='shape'?<><Pebble scale={[.23,.09,.16]} position={[0,.1,0]}/><Cuboid position={[0,.19,0]} size={[.46,.05,.29]} color={color}/></>
   :action==='roll'?<><Cuboid position={[0,.02,0]} size={[.67,.015,.5]} color="#b39966"/><mesh position={[0,.1,0]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.12,.12,.52,24]}/><meshStandardMaterial color={id===37?'#e8bc54':'#f2e5c6'}/></mesh></>
   :<><group ref={raw} position={[-.14,.11,0]}>{mushroom?<><Pebble scale={[.18,.07,.16]} color={color}/><Cuboid position={[0,-.055,.1]} size={[.06,.06,.22]} color="#e3cfac"/></>:id===22?<Pebble scale={[.18,.17,.18]} color={color}/>:<Cuboid size={[.48,.16,.27]} color={color}/>}</group><group ref={slices}>{Array.from({length:5},(_,i)=><Cuboid key={i} position={[.13+i*.075,.07,.015]} size={[.055,.09,.26]} color={color}/>)}</group></>}
  </group>}
  {(action==='simmer'||action==='sear')&&<group ref={steam}>{[0,1,2,3,4].map(i=><mesh key={i} position={[0,.3,0]}><sphereGeometry args={[1,10,8]}/><meshBasicMaterial color="#fff6e1" transparent opacity={.18} depthWrite={false}/></mesh>)}</group>}
  {action==='pour'&&<mesh ref={stream} position={[.12,.3,.08]}><cylinderGeometry args={[.012,.018,.44,10]}/><meshStandardMaterial color={id===30?'#945021':'#cba25b'} transparent opacity={.7}/></mesh>}
  {(action==='garnish'||action==='plate')&&<group ref={garnish} position={[0,.8,.08]}><Pebble scale={[.055,.018,.028]} color={id%3===0?'#6d9149':'#dfb768'}/></group>}
 </group>;
}
