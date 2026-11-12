'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { CHEF_LABELS, sampleChefRoutine, type ChefAction } from '@/lib/chef-routine';

import { GUEST_SEAT, type ChefMode } from '@/lib/staging';

type Vec=[number,number,number];
const fur='#f1c582',ear='#dfac68',cream='#fff0ce',coat='#eee4d5';
function Facet({position=[0,0,0],scale=[1,1,1],color=fur,detail=1}:{position?:Vec;scale?:Vec;color?:string;detail?:number}){
  const texture=useMemo(()=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#888';ctx.fillRect(0,0,128,128);for(let i=0;i<1800;i++){const x=(Math.sin(i*17.3)*12345)%1*128,y=(Math.sin(i*3.17)*6789)%1*128;ctx.strokeStyle=i%2?'#aaa':'#666';ctx.beginPath();ctx.moveTo(Math.abs(x),Math.abs(y));ctx.lineTo(Math.abs(x)+1,Math.abs(y)+4);ctx.stroke();}const t=new THREE.CanvasTexture(canvas);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(3,3);return t;},[]);
  useEffect(()=>()=>texture.dispose(),[texture]);
  return <mesh position={position} scale={scale} castShadow receiveShadow><sphereGeometry args={[1,32,24]}/><meshStandardMaterial color={color} roughness={.85} bumpMap={texture} bumpScale={.025}/></mesh>;
}
function Box({position,size,color}:{position:Vec;size:Vec;color:string}){
  return <mesh position={position} castShadow receiveShadow><boxGeometry args={size}/><meshStandardMaterial color={color} roughness={.7}/></mesh>;
}
function Fold({start,end,width=.02,color='#d3c6b5'}:{start:Vec;end:Vec;width?:number;color?:string}){
  const a=new THREE.Vector3(...start),b=new THREE.Vector3(...end),direction=b.clone().sub(a);
  return <mesh position={a.add(b).multiplyScalar(.5)} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.clone().normalize())}>
    <cylinderGeometry args={[width,width,direction.length(),5]}/><meshStandardMaterial color={color} roughness={.9}/>
  </mesh>;
}

export default function Teepu({reducedMotion,inspect,mode}:{reducedMotion:boolean;inspect:boolean;mode:ChefMode}){
  const root=useRef<THREE.Group>(null),body=useRef<THREE.Group>(null),head=useRef<THREE.Group>(null);
  const leftArm=useRef<THREE.Group>(null),rightArm=useRef<THREE.Group>(null),leftElbow=useRef<THREE.Group>(null),rightElbow=useRef<THREE.Group>(null);
  const leftLeg=useRef<THREE.Group>(null),rightLeg=useRef<THREE.Group>(null),ears=useRef<THREE.Group>(null),tail=useRef<THREE.Group>(null),eyes=useRef<THREE.Group>(null);
  const knife=useRef<THREE.Group>(null),spoon=useRef<THREE.Group>(null),tool=useRef<THREE.Group>(null);
  const lastAction=useRef<ChefAction>('chop');const [action,setAction]=useState<ChefAction>('chop');
  const phase=useRef({mode,start:0});
  useFrame(({clock},delta)=>{
    if(phase.current.mode!==mode){phase.current={mode,start:clock.elapsedTime};}
    const t=reducedMotion?0:clock.elapsedTime,local=clock.elapsedTime-phase.current.start;
    const r=sampleChefRoutine(t,reducedMotion);
    if(mode!=='routine'){
      r.x=GUEST_SEAT.x;r.z=-.25;r.yaw=0;r.moving=false;r.carrying=false;
      r.action=mode==='serve'?'serve':mode==='idle'?(Math.floor(t/5)%2===0?'chop':'rest'):'rest';
      r.progress=Math.min(local/1.2,1);
    }
    if(lastAction.current!==r.action){lastAction.current=r.action;setAction(r.action);}
    if(!root.current||!body.current||!head.current||!leftArm.current||!rightArm.current||!leftElbow.current||!rightElbow.current)return;
    root.current.position.lerp(new THREE.Vector3(r.x,0,r.z),reducedMotion?1:1-Math.exp(-delta*5));root.current.rotation.y=r.yaw;
    const gait=r.moving&&!reducedMotion?Math.sin(r.time*10):0;
    body.current.position.y=r.moving?Math.abs(gait)*.035:reducedMotion?0:Math.sin(t*1.5)*.012;
    head.current.rotation.set(r.action==='rest'?-.035:.08,0,r.moving?gait*.025:Math.sin(t*.8)*.015);
    leftArm.current.rotation.set(.12+gait*.2,0,-.12);rightArm.current.rotation.set(.12-gait*.2,0,.12);
    leftElbow.current.rotation.x=rightElbow.current.rotation.x=0;
    const wave=reducedMotion?0:Math.sin(t*5);
    if(r.action==='chop'){
      rightArm.current.rotation.set(-1.93+wave*.14,0,.13);rightElbow.current.rotation.x=.12;
      leftArm.current.rotation.set(-1.87,0,-.18);leftElbow.current.rotation.x=.08;
      head.current.rotation.x=.16;
    }else if(r.action==='wash'){
      leftArm.current.rotation.set(-1.43+wave*.06,.18,-.16);rightArm.current.rotation.set(-1.43-wave*.06,-.18,.16);
      head.current.rotation.x=.2;
    }else if(r.action==='drawer'){
      leftArm.current.rotation.x=-1.05;rightArm.current.rotation.x=r.progress<.45?-1.12:-1.55;
      rightElbow.current.rotation.x=-.08;head.current.rotation.x=.18;
    }else if(r.action==='stir'){
      rightArm.current.rotation.set(-1.95+Math.sin(t*2)*.04,Math.cos(t*2)*.12,.12);rightElbow.current.rotation.x=.12;
      leftArm.current.rotation.x=-1.85;
    }else if(r.action==='serve'){
      const adjust=Math.sin(r.progress*Math.PI*4)*.035;
      leftArm.current.rotation.set(-1.9,adjust,-.14);rightArm.current.rotation.set(-1.9,adjust,.14);
      head.current.rotation.x=.15;
    }else if(r.carrying){rightArm.current.rotation.x=-1.2;rightElbow.current.rotation.x=-.3;}
    if(mode==='think'){
      head.current.rotation.z=reducedMotion?.12:Math.sin(local*2.5)*.14;
      head.current.rotation.x=.13;rightArm.current.rotation.set(-2.65,0,-.48);rightElbow.current.rotation.x=-.35;
    }
    if(mode==='serve'){
      const reach=reducedMotion?1:Math.min(local/.9,1);
      leftArm.current.rotation.x=rightArm.current.rotation.x=-.3-reach*1.6;
      head.current.rotation.x=-.03;
    }
    if(leftLeg.current)leftLeg.current.rotation.x=gait*.2;
    if(rightLeg.current)rightLeg.current.rotation.x=-gait*.2;
    if(ears.current)ears.current.rotation.z=reducedMotion?0:Math.sin(t*2)*.025;
    if(tail.current)tail.current.rotation.y=reducedMotion?0:Math.sin(t*3)*.25;
    if(eyes.current)eyes.current.scale.y=!reducedMotion&&(t%5.4)>5.23?.15:1;
    if(knife.current)knife.current.visible=r.action==='chop';
    if(spoon.current)spoon.current.visible=r.action==='stir'||r.carrying;
    if(tool.current)tool.current.rotation.x=-(rightArm.current.rotation.x+rightElbow.current.rotation.x);
  });
  return <group ref={root}>
    <group ref={body}>
      {/* Soft rounded body with independently jointed legs, arms, ears and tail. */}
      {[-1,1].map(side=><group key={side} ref={side<0?leftLeg:rightLeg} position={[side*.21,.62,0]}>
        <Facet position={[0,-.2,0]} scale={[.19,.35,.2]}/><Facet position={[0,-.51,.09]} scale={[.24,.14,.3]}/>
      </group>)}
      <mesh position={[0,1.3,0]} castShadow><cylinderGeometry args={[.32,.46,1.05,40]}/><meshStandardMaterial color={coat}  roughness={.95}/></mesh>
      <Facet position={[0,1.88,0]} scale={[.19,.23,.2]}/>
      <Fold start={[-.28,1.82,.25]} end={[.06,1.45,.4]} width={.045} color="#fff2df"/>
      <Fold start={[.28,1.82,.25]} end={[-.22,1.25,.4]} width={.045} color="#fff2df"/>
      <Fold start={[-.22,1.25,.4]} end={[-.22,.83,.4]} width={.012}/>
      <Box position={[0,1.1,.407]} size={[.79,.06,.027]} color="#ded0bd"/>
      {[-1,1].map(side=><group key={side} ref={side<0?leftArm:rightArm} position={[side*.38,1.9,.16]}>
        <mesh position={[0,-.22,0]} castShadow><cylinderGeometry args={[.19,.2,.44,32]}/><meshStandardMaterial color={coat}  roughness={.9}/></mesh>
        <group ref={side<0?leftElbow:rightElbow} position={[0,-.44,0]}>
          <Facet position={[0,-.22,0]} scale={[.14,.27,.15]}/>
          <Facet position={[0,-.44,.02]} scale={[.18,.16,.19]} color={cream}/>
          {side===1 && <group ref={tool} position={[0,-.46,.08]}>
            <group ref={knife}>
              <Box position={[0,0,.06]} size={[.065,.065,.2]} color="#765137"/>
              <mesh position={[0,-.02,.31]} castShadow><boxGeometry args={[.025,.14,.32]}/><meshStandardMaterial color="#c2c6ba" metalness={.65} roughness={.3}/></mesh>
            </group>
            <group ref={spoon} visible={false}>
              <Fold start={[0,.14,0]} end={[0,-.3,.16]} width={.022} color="#a47a45"/>
              <Facet position={[0,-.32,.17]} scale={[.065,.035,.09]} color="#a47a45"/>
            </group>
          </group>}
        </group>
      </group>)}
      <group ref={tail} position={[0,1.05,-.35]}><Facet position={[0,.03,-.18]} scale={[.23,.25,.24]} color={cream}/></group>
      <group ref={head} position={[0,2.46,.02]}>
        <Facet scale={[.59,.56,.53]} color={fur}/>
        <group ref={ears}>
          <group rotation={[0,0,-.15]} position={[-.59,-.05,0]}><Facet scale={[.25,.43,.29]} color={ear}/></group>
          <group rotation={[0,0,.15]} position={[.59,-.05,0]}><Facet scale={[.25,.43,.29]} color={ear}/></group>
        </group>
        <Facet position={[-.17,-.2,.46]} scale={[.24,.2,.2]} color={cream}/>
        <Facet position={[.17,-.2,.46]} scale={[.24,.2,.2]} color={cream}/>
        <group ref={eyes} position={[0,.05,.495]}>{[-1,1].map(side=><group key={side} position={[side*.225,0,0]}>
          <mesh><sphereGeometry args={[.075,24,20]}/><meshStandardMaterial color="#211b14" roughness={.16}/></mesh>
          <mesh position={[-.017,.023,.045]}><sphereGeometry args={[.014,6,6]}/><meshBasicMaterial color="#f8ebd0"/></mesh>
        </group>)}</group>
        <mesh position={[0,-.12,.665]} rotation={[0,0,Math.PI]} scale={[1,.7,.8]}><sphereGeometry args={[.07,24,16]}/><meshStandardMaterial color="#2c2218" /></mesh>
        <Fold start={[0,-.2,.649]} end={[0,-.3,.63]} width={.008} color="#b98246"/>
        <group rotation={[0,0,-.045]}>
          <mesh position={[0,.49,0]} castShadow><cylinderGeometry args={[.49,.5,.15,64]}/><meshStandardMaterial color="#e7ddcf"  roughness={.9}/></mesh>
          <mesh position={[0,.66,0]} castShadow><cylinderGeometry args={[.46,.49,.22,64]}/><meshStandardMaterial color="#f4eadb"  roughness={.9}/></mesh>
          <Fold start={[-.35,.74,.29]} end={[.18,.58,.43]} width={.009} color="#fff6e7"/>
          <Fold start={[.18,.58,.43]} end={[.4,.72,.2]} width={.009} color="#fff6e7"/>
        </group>
      </group>
    </group>
    {mode==='think'&&<group position={[0,3.55,.2]}><mesh scale={[.3,.16,.06]}><sphereGeometry args={[1,24,16]}/><meshBasicMaterial color="#f7eddc"/></mesh>{[-.1,0,.1].map(x=><mesh key={x} position={[x,0,.065]}><sphereGeometry args={[.023,12,8]}/><meshBasicMaterial color="#66533c"/></mesh>)}</group>}
    {inspect&&<Html position={[0,3.72,0]} center style={{pointerEvents:'none'}}><div className="chef-label" role="status">티푸 · {CHEF_LABELS[action]}</div></Html>}
  </group>;
}

export function KitchenRoutineProps({reducedMotion,active=true}:{reducedMotion:boolean;active?:boolean}){
  const drawer=useRef<THREE.Group>(null),water=useRef<THREE.Mesh>(null),storedSpoon=useRef<THREE.Group>(null);
  useFrame(({clock})=>{
    const r=sampleChefRoutine(clock.elapsedTime,reducedMotion);
    if(drawer.current)drawer.current.position.z=-3.39+r.drawerOpen*(active?.52:0);
    if(water.current)water.current.visible=active&&r.action==='wash'&&!reducedMotion;
    if(storedSpoon.current)storedSpoon.current.visible=!(r.carrying||r.action==='stir');
  });
  return <>
    <Box position={[.9,1.39,-3.437]} size={[1.08,.45,.022]} color="#35291e"/>
    <group ref={drawer} position={[.9,1.39,-3.39]}>
      <Box position={[0,-.16,-.36]} size={[.97,.035,.72]} color="#b48b55"/>
      {[-.48,.48].map(x=><Box key={x} position={[x,-.07,-.36]} size={[.035,.2,.72]} color="#b48b55"/>)}
      <Box position={[0,0,0]} size={[1.04,.4,.06]} color="#966943"/>
      <Box position={[0,0,.048]} size={[.3,.025,.045]} color="#c1a47a"/>
      <group ref={storedSpoon} position={[0,-.1,-.25]}><Fold start={[0,0,-.22]} end={[0,0,.1]} width={.022} color="#d9b175"/><Facet position={[0,0,.12]} scale={[.065,.025,.09]} color="#d9b175"/></group>
    </group>
    <mesh ref={water} position={[-2.4,1.89,-4.075]} visible={false}><cylinderGeometry args={[.014,.021,.67,8]}/><meshStandardMaterial color="#c8e5dc" transparent opacity={.55} roughness={.1}/></mesh>

  </>;
}
