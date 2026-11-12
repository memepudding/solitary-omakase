'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { isAssetDish, type DishKind } from '@/lib/menu';
import AssetFood from './AssetFood';
import Arrival from './Arrival';
import SimmerPot from './SimmerPot';
import { GUEST_SEAT, type ChefMode } from '@/lib/staging';
import { KitchenRoutineProps } from './Teepu';
import ImportedTeepu from './ImportedTeepu';
import SausageGuest from './SausageGuest';
import {DISH_ROTATION_SECONDS} from '@/lib/tasting';

type Vec = [number, number, number];
type SceneProps = { onDishPosition:(x:number,y:number,top:number)=>void; walking:boolean; seatTarget:boolean; onSeatSelect:()=>void; onSeatNear:()=>void; chefMode:ChefMode; entered: boolean; inspect: boolean; dish?: DishKind; tea: boolean; reducedMotion: boolean; bites:number; clearing:boolean; chefSpeech:string; guestNear:boolean; guestSpeech:string; onGuestNear:(near:boolean)=>void; onApproach:()=>void; onDishReady:()=>void };

// Keep the guest-facing counter fixed; expand the chef's working aisle behind it.
const KITCHEN = {
  sideX: 3.95,
  sideZ: -1.4,
  sideLength: 4.35,
  backOffset: -1.2,
  sink: [-2.4, 1.8, -3.985] as Vec,
};

function Block({ position, size, color='#805237', radius=.04, texture }: { position: Vec; size: Vec; color?: string; radius?: number; texture?: THREE.Texture }) {
  return <RoundedBox args={size} radius={radius} smoothness={3} position={position} castShadow receiveShadow>
    <meshStandardMaterial color={color} roughness={.8} map={texture} />
  </RoundedBox>;
}

function Cylinder({ position, radius, height, color, topRadius, emissive }: { position: Vec; radius: number; height: number; color: string; topRadius?: number; emissive?: boolean }) {
  return <mesh position={position} castShadow receiveShadow>
    <cylinderGeometry args={[topRadius ?? radius, radius, height, 40]} />
    <meshStandardMaterial color={color} roughness={.6} emissive={emissive ? color : '#000000'} emissiveIntensity={emissive ? 1.8 : 0} />
  </mesh>;
}

function Lamp({ position }: {position:Vec}) {
  return <group position={position}>
    <Cylinder position={[0,.06,0]} radius={.14} height={.12} color="#725037" />
    <Cylinder position={[0,.25,0]} radius={.132} height={.28} color="#ffcf83" emissive />
    <Cylinder position={[0,.4,0]} radius={.14} height={.035} color="#725037" />
    <pointLight position={[0,.28,0]} intensity={1.2} color="#ffba65" distance={2} decay={2}/>
  </group>;
}

function Stool({ position, rotation=0, texture }: {position:Vec;rotation?:number;texture:THREE.Texture}) {
  return <group position={position} rotation={[0,rotation,0]}>
    <Block position={[0,.84,0]} size={[.72,.17,.63]} radius={.035} color="#c6a47c" />
    <Block position={[0,.72,0]} size={[.65,.09,.56]} color="#815132" texture={texture}/>
    {[-1,1].flatMap(x=>[-1,1].map(z=><Block key={`${x}${z}`} position={[x*.26,.36,z*.22]} size={[.075,.72,.075]} color="#704b32"/>))}
    <Block position={[0,.24,.22]} size={[.56,.055,.055]} color="#704b32"/>
    <Block position={[0,.24,-.22]} size={[.56,.055,.055]} color="#704b32"/>
  </group>;
}

function TableSetting({position, rotation=0}:{position:Vec;rotation?:number}) {
  return <group position={position} rotation={[0,rotation,0]}>
    <Block position={[0,0,0]} size={[.83,.025,.34]} color="#4f3829" radius={.01}/>
    <Block position={[.23,.055,.015]} size={[.29,.085,.19]} color="#e2d6be" radius={.035}/>
    <Cylinder position={[-.03,.027,-.02]} radius={.085} height={.025} color="#b89a6b"/>
    <Cylinder position={[-.03,.042,-.02]} radius={.067} height={.006} color="#483d2c"/>
    {[-.06,-.015].map(z=><Block key={z} position={[-.23,.026,z+.09]} size={[.34,.018,.017]} color="#ca9857" radius={.005}/>)}
  </group>;
}

function Branch({start,end}:{start:Vec;end:Vec}) {
  const direction=new THREE.Vector3(...end).sub(new THREE.Vector3(...start));
  const midpoint=new THREE.Vector3(...start).add(new THREE.Vector3(...end)).multiplyScalar(.5);
  const quaternion=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.clone().normalize());
  return <mesh position={midpoint} quaternion={quaternion}><cylinderGeometry args={[.008,.014,direction.length(),6]}/><meshStandardMaterial color="#725031"/></mesh>;
}

function Flowers() {
  const tips:Vec[]=[[-.32,.73,.08],[.2,.9,0],[.44,.64,.04],[-.1,1.05,0],[.04,.66,.2]];
  return <group position={[1.4,2.16,-2.88]}>
    <mesh position={[0,.16,0]} scale={[.25,.24,.22]} castShadow><sphereGeometry args={[1,24,20]}/><meshStandardMaterial color="#b39472" roughness={.65}/></mesh>
    <Cylinder position={[0,.33,0]} radius={.095} height={.13} color="#b39472"/>
    {tips.map((tip,i)=><group key={i}>
      <Branch start={[0,.32,0]} end={tip}/>
      {[0,1,2,3,4].map(j=><mesh key={j} position={[tip[0]+Math.cos(j*Math.PI*.4)*.043,tip[1]+Math.sin(j*Math.PI*.4)*.043,tip[2]]}><sphereGeometry args={[.035,10,8]}/><meshStandardMaterial color="#e9c9a0"/></mesh>)}
    </group>)}
  </group>;
}

function Sink() {
  const basin = useMemo(() => {
    // Five solid surfaces form a genuinely recessed bowl, open at the top.
    const top:Vec[]=[[-.73,0,-.32],[.73,0,-.32],[.73,0,.32],[-.73,0,.32]];
    const bottom:Vec[]=[[-.58,-.32,-.22],[.58,-.32,-.22],[.58,-.32,.22],[-.58,-.32,.22]];
    const vertices:number[]=[];
    const quad=(a:Vec,b:Vec,c:Vec,d:Vec)=>vertices.push(...a,...b,...c,...a,...c,...d);
    for(let i=0;i<4;i++) quad(top[i],top[(i+1)%4],bottom[(i+1)%4],bottom[i]);
    quad(bottom[3],bottom[2],bottom[1],bottom[0]);
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    geometry.computeVertexNormals();
    return geometry;
  },[]);
  const spout=useMemo(()=>new THREE.CatmullRomCurve3([
    new THREE.Vector3(0,.025,-.45),new THREE.Vector3(0,.48,-.45),
    new THREE.Vector3(0,.62,-.38),new THREE.Vector3(0,.63,-.18),
    new THREE.Vector3(0,.52,-.09),new THREE.Vector3(0,.43,-.09),
  ]),[]);
  useEffect(()=>()=>basin.dispose(),[basin]);
  const rims:{position:Vec;size:Vec}[]=[
    {position:[0,.012,-.34],size:[1.56,.035,.055]},
    {position:[0,.012,.34],size:[1.56,.035,.055]},
    {position:[-.755,.012,0],size:[.055,.035,.68]},
    {position:[.755,.012,0],size:[.055,.035,.68]},
  ];
  return <group position={KITCHEN.sink}>
    <mesh geometry={basin} receiveShadow><meshStandardMaterial color="#929c95" metalness={.5} roughness={.32} side={THREE.DoubleSide}/></mesh>
    {rims.map((rim,i)=><RoundedBox key={i} position={rim.position} args={rim.size} radius={.012} smoothness={3} castShadow><meshStandardMaterial color="#bcc2b5" metalness={.65} roughness={.27}/></RoundedBox>)}
    <Cylinder position={[0,-.313,.02]} radius={.055} height={.006} color="#454b43"/>
    <Cylinder position={[0,-.308,.02]} radius={.034} height={.003} color="#a0aa9f"/>
    <mesh castShadow><tubeGeometry args={[spout,32,.026,10,false]}/><meshStandardMaterial color="#c0c3b2" metalness={.65} roughness={.26}/></mesh>
    <Cylinder position={[0,.02,-.45]} radius={.065} height={.04} color="#a2a995"/>
    <Cylinder position={[.18,.035,-.45]} radius={.04} height={.07} color="#9da78f"/>
    <Block position={[.18,.075,-.4]} size={[.025,.025,.14]} color="#b4baa9" radius={.01}/>
  </group>;
}

function RearKitchen({texture}:{texture:THREE.Texture}) {
  return <group>
    {/* Split cabinetry and worktop around the sink, so neither fills its bowl. */}
    <Block position={[-3.75,.85,-4]} size={[1.1,1.7,1.05]} color="#6b4c34" texture={texture}/>
    <Block position={[1.35,.85,-4]} size={[5.9,1.7,1.05]} color="#6b4c34" texture={texture}/>
    <Block position={[-2.4,.64,-4]} size={[1.6,1.28,1.05]} color="#6b4c34" texture={texture}/>
    <Block position={[-2.4,1.49,-3.47]} size={[1.6,.42,.06]} color="#6b4c34" texture={texture}/>
    <Block position={[-3.75,1.74,-4]} size={[1.1,.1,1.15]} color="#a07a54" texture={texture}/>
    <Block position={[1.35,1.74,-4]} size={[5.9,.1,1.15]} color="#a07a54" texture={texture}/>
    <Block position={[-2.4,1.74,-4.4475]} size={[1.6,.1,.255]} color="#a07a54" texture={texture}/>
    <Block position={[-2.4,1.74,-3.5375]} size={[1.6,.1,.225]} color="#a07a54" texture={texture}/>
    <Sink/>
    {/* Small cabinet handles and a folded towel beside the wash station. */}
    {[-3.75,-2.4,-.65,2.45,3.65].map(x=><Block key={x} position={[x,1.37,-3.44]} size={[.3,.025,.04]} color="#b99b6e" radius={.01}/>)}
    <Block position={[-1.25,1.84,-3.85]} size={[.28,.09,.38]} color="#ded4bb" radius={.035}/>
  </group>;
}

function Food({ kind }: {kind:DishKind}) {
  return <group>
    <Cylinder position={[0,0,0]} radius={.47} height={.035} color="#b5ae91"/>
    {kind==='sushi' ? [-.19,.19].map((x,i)=><group key={i} position={[x,.065,0]} rotation={[0,-.2,0]}>
      <Block position={[0,0,0]} size={[.24,.1,.38]} radius={.05} color="#f3e6c5"/>
      <Block position={[0,.06,0]} size={[.27,.06,.42]} radius={.025} color="#d7794e"/>
      {[-.12,-.04,.04,.12].map(z=><Block key={z} position={[0,.092,z]} size={[.25,.005,.012]} color="#f0c49c" radius={.002}/>)}
    </group>) : <>
      <Cylinder position={[0,.1,0]} radius={.26} topRadius={.34} height={.18} color="#62654c"/>
      <Cylinder position={[0,.195,0]} radius={.316} height={.01} color={kind==='soup'?'#c28b40':kind==='rice'?'#e7d4a0':'#efb44e'}/>
      {kind==='sorbet' ? <mesh position={[0,.26,0]} castShadow><sphereGeometry args={[.22,24,16]}/><meshStandardMaterial color="#ecaa43" roughness={.95}/></mesh> : null}
      {kind==='rice' ? [-.15,0,.15].map((x,i)=><mesh key={i} position={[x,.218,(i%2)*.1-.04]} scale={[1,.3,.8]}><sphereGeometry args={[.09,12,8]}/><meshStandardMaterial color="#8a6240"/></mesh>) : null}
      <mesh position={[.03,kind==='sorbet'?.44:.21,.02]} rotation={[0,.3,.25]} scale={[1,.15,.4]}><sphereGeometry args={[.085,12,8]}/><meshStandardMaterial color="#6d813d"/></mesh>
    </>}
  </group>;
}

function ServedDish({kind, reducedMotion,bites,clearing,onReady,onPosition}:{onPosition:(x:number,y:number,top:number)=>void;kind:DishKind;reducedMotion:boolean;bites:number;clearing:boolean;onReady:()=>void}) {
  const ref=useRef<THREE.Group>(null),elapsed=useRef(0),exitTime=useRef(0);
  const labelPoints=useMemo(()=>[-.56,.56].flatMap(x=>[0,.8].flatMap(y=>[-.56,.56].map(z=>new THREE.Vector3(x,y,z)))),[]);
  const projected=useMemo(()=>new THREE.Vector3(),[]);
  const {size,camera}=useThree();const portrait=size.width/size.height<.85;
  useFrame((_,delta)=>{
    if(!ref.current)return;
    elapsed.current+=Math.min(delta,.1);
    const t=elapsed.current,p=reducedMotion?1:Math.min(t/1.3,1),ease=p*p*(3-2*p);
    ref.current.position.set(GUEST_SEAT.x,2.12+ease*.14+(reducedMotion?0:Math.sin(t*1.4)*.025),.7+ease*.55);
    if(clearing)exitTime.current+=Math.min(delta,.1);
    ref.current.rotation.y=reducedMotion?0:t*Math.PI*2/DISH_ROTATION_SECONDS+exitTime.current*14;
    ref.current.rotation.x=.16;
    ref.current.scale.setScalar((portrait?.45:.58)*(.8+.2*ease)*(clearing?Math.max(.01,1-exitTime.current/.85):1));
    // Project the full normalized food envelope, including tall dishes and rotation.
    ref.current.updateMatrixWorld(true);
    let top=size.height;
    for(const corner of labelPoints){projected.copy(corner).applyMatrix4(ref.current.matrixWorld).project(camera);top=Math.min(top,(1-projected.y)*size.height/2);}
    projected.copy(ref.current.position).project(camera);
    onPosition((projected.x+1)*size.width/2,(1-projected.y)*size.height/2,top);
  });
  return <group ref={ref} position={[GUEST_SEAT.x,2.16,.7]} scale={.5}>{isAssetDish(kind)?<AssetFood kind={kind} bites={bites} onReady={onReady}/>:<Food kind={kind}/>}</group>;
}

function CameraRig({entered,walking,inspect,reducedMotion,guestNear,onGuestNear}:SceneProps) {
  const {camera,size}=useThree();
  const target=useMemo(()=>new THREE.Vector3(0,1.55,-1.05),[]);
  useFrame((_,delta)=>{
    if(inspect&&!guestNear){if(camera.position.distanceTo(new THREE.Vector3(4.85,2,-.8))<2.6)onGuestNear(true);return;}
    const portrait=size.width/size.height<.85;
    const destination=walking?new THREE.Vector3(GUEST_SEAT.x,5.6,10.5):guestNear?new THREE.Vector3(3,3.15,2.1):entered?new THREE.Vector3(GUEST_SEAT.x,GUEST_SEAT.eyeY,GUEST_SEAT.z):new THREE.Vector3(portrait?7:8,portrait?7:6.6,portrait?13:10);
    const look=walking?new THREE.Vector3(GUEST_SEAT.x,1.3,2.5):guestNear?new THREE.Vector3(4.8,2.4,-.8):entered?new THREE.Vector3(GUEST_SEAT.x,2.35,-.25):new THREE.Vector3(0,1.55,-1.05);
    const alpha=reducedMotion?1:1-Math.exp(-Math.min(delta,.1)*3);
    camera.position.lerp(destination,alpha);target.lerp(look,alpha);camera.lookAt(target);
    if(camera instanceof THREE.PerspectiveCamera){camera.fov=THREE.MathUtils.lerp(camera.fov,entered?(portrait?72:61):43,alpha);camera.updateProjectionMatrix();}
  });
  return <OrbitControls enabled={inspect&&!guestNear} target={entered?[GUEST_SEAT.x,2.35,-.25]:[0,1.55,-1.05]} enablePan={false} minDistance={2.8} maxDistance={14} minPolarAngle={.55} maxPolarAngle={1.45} minAzimuthAngle={-.65} maxAzimuthAngle={1.2} enableDamping/>;
}

function Room(props:SceneProps) {
  const wood=useMemo(()=>{
    const canvas=document.createElement('canvas');canvas.width=128;canvas.height=512;
    const ctx=canvas.getContext('2d')!;ctx.fillStyle='#d6b38c';ctx.fillRect(0,0,128,512);
    for(let i=0;i<190;i++){
      const x=(Math.sin(i*127.1)*43758.5453)%1*128;
      ctx.strokeStyle=`rgba(65,32,14,${.025+(i%5)*.01})`;ctx.lineWidth=.3+(i%3)*.3;
      ctx.beginPath();ctx.moveTo(Math.abs(x),0);ctx.bezierCurveTo(Math.abs(x)+4,180,Math.abs(x)-5,340,Math.abs(x)+1,512);ctx.stroke();
    }
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(2,1);return texture;
  },[]);
  useEffect(()=>()=>wood.dispose(),[wood]);
  return <>
    <color attach="background" args={['#201b17']}/>
    <fog attach="fog" args={['#33271d',18,36]}/>
    <pointLight position={[2,4,3]} intensity={7} color="#fff5df" distance={9}/>
    <ambientLight intensity={.65} color="#f6d9ab"/>
    <hemisphereLight args={['#e9c69a','#35291d',1.3]}/>
    <directionalLight position={[-3,7,4]} intensity={2.2} color="#ffd69b" castShadow shadow-mapSize={[2048,2048]} shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={7} shadow-camera-bottom={-7} shadow-normalBias={.04}/>
    <pointLight position={[0,3.7,0]} intensity={18} color="#ffc37b" distance={10} decay={2}/>
    <pointLight position={[1,3.3,-3.8]} intensity={7} color="#ffa954" distance={5}/>
    <pointLight position={[-2.4,3.5,-3.4]} intensity={3} color="#f4d9a6" distance={3}/>
    <Block position={[0,-.09,-.6]} size={[13,.16,13.2]} color="#59412e" texture={wood}/>
    {Array.from({length:16},(_,i)=><Block key={i} position={[i*.7-5.3,2.5,-4.85]} size={[.69,5,.14]} color={i%3===0?'#78543c':'#886246'} texture={wood}/>)}
    <Block position={[5.2,2.5,-4.15]} size={[.18,5,1.3]} color="#705039" texture={wood}/>
    <Block position={[-5.2,2.5,-1.1]} size={[.16,5,7.4]} color="#292d28"/>
    {/* Night window, with physical mullions and a small garden beyond the glass. */}
    <Block position={[-5.09,2.6,-1.4]} size={[.035,3.7,5.7]} color="#1f3035"/>
    {[-4,-2.65,-1.3,.05,1.4].map(z=><Block key={z} position={[-5,2.6,z]} size={[.1,4.1,.075]} color="#302b23"/>)}
    {[1,2.6,4.25].map(y=><Block key={y} position={[-4.98,y,-1.4]} size={[.12,.075,5.4]} color="#302b23"/>)}
    {Array.from({length:24},(_,i)=><mesh key={i} position={[-4.93,1+Math.sin(i*2.3)*.65,(i/24)*5-3.8]} scale={[.12,.5,.6]}><sphereGeometry args={[.5,12,10]}/><meshStandardMaterial color={i%2?'#3c492b':'#55603a'} roughness={1}/></mesh>)}
    {/* Recessed display shelf. */}
    <group position={[0,0,KITCHEN.backOffset]}>
    <Block position={[1,3.05,-3.44]} size={[5.8,2,.2]} color="#9f734a"/>
    <Block position={[1,2.14,-3.15]} size={[6,.14,.8]} color="#9d7651" texture={wood}/>
    <Block position={[1,4.06,-3.13]} size={[6,.12,.8]} color="#745138" texture={wood}/>
    <mesh position={[1,3.98,-3.2]}><boxGeometry args={[5.7,.025,.08]}/><meshStandardMaterial color="#ffc47c" emissive="#ffb45f" emissiveIntensity={3}/></mesh>
    <Flowers/>
    <Lamp position={[3.1,2.22,-2.95]}/>
    </group>
    {/* U-shaped counter; no character or food is part of this fixed environment. */}
    <Block position={[0,.96,1.45]} size={[9,1.92,1.36]} color="#94653f" texture={wood}/>
    <Block position={[0,1.96,1.45]} size={[9.35,.16,1.6]} color="#d1a775" radius={.08} texture={wood}/>
    {[-KITCHEN.sideX,KITCHEN.sideX].map(x=><group key={x}>
      <Block position={[x,.96,KITCHEN.sideZ]} size={[1.1,1.92,KITCHEN.sideLength-.05]} color="#94653f" texture={wood}/>
      <Block position={[x,1.96,KITCHEN.sideZ]} size={[1.4,.16,KITCHEN.sideLength]} color="#d1a775" radius={.07} texture={wood}/>
    </group>)}
    <RearKitchen texture={wood}/><SimmerPot reducedMotion={props.reducedMotion}/>
    <Block position={[0,.15,-1.5]} size={[6.3,.3,3.65]} color="#715139" texture={wood}/>
    {/* Closely spaced grooves lend the front its warm timber texture. */}
    {Array.from({length:60},(_,i)=><Block key={i} position={[-4.4+i*.149,.98,2.139]} size={[.012,1.8,.006]} color="#745035" radius={.001}/>)}
    {[-2.7,-.9,GUEST_SEAT.x,2.7].map(x=><Stool key={x} position={[x,0,GUEST_SEAT.z]} texture={wood}/>)}
    {[-2.8,-.65].map(z=><Stool key={z} position={[-4.85,0,z]} rotation={Math.PI/2} texture={wood}/>)}
    <Stool position={[5.24,0,-.8]} rotation={-Math.PI/2} texture={wood}/>
    {[-2.6,-.85,GUEST_SEAT.x,2.6].map(x=><TableSetting key={x} position={[x,2.057,1.9]}/>)}
    <TableSetting position={[-4,2.057,-.8]} rotation={Math.PI/2}/>
    <TableSetting position={[4.15,2.057,-2.1]} rotation={-Math.PI/2}/>
    <Lamp position={[-3.15,2.04,.9]}/><Lamp position={[2.7,2.04,.85]}/>
    <Block position={[GUEST_SEAT.x,2.07,.93]} size={[1.7,.07,.61]} color="#ba8750" radius={.025} texture={wood}/>
    <Block position={[GUEST_SEAT.x,2.05,1.48]} size={[2.1,.025,.4]} color="#55493a" radius={.01}/>
    <Cylinder position={[-1.7,2.25,.95]} radius={.34} height={.4} color="#bc8c51"/>
    <Cylinder position={[-1.7,2.454,.95]} radius={.3} height={.007} color="#69482e"/>
    <Cylinder position={[-2.22,2.17,1.2]} radius={.14} topRadius={.19} height={.25} color="#c9b28b"/>
    {/* Broad pendant above the counter. */}
    <Cylinder position={[0,4.85,.4]} radius={.015} height={1.5} color="#35251b"/>
    <Cylinder position={[0,4.12,.4]} radius={1.75} height={.2} color="#543b28"/>
    <Cylinder position={[0,4.01,.4]} radius={1.66} height={.015} color="#ffd79c" emissive/>
    <ImportedTeepu reducedMotion={props.reducedMotion} mode={props.chefMode}/>
    <SausageGuest reducedMotion={props.reducedMotion} onApproach={props.onApproach}/>

    <Html position={[4.85,3.7,-.8]} center style={{pointerEvents:'none'}}><div className="world-bubble guest-speech" style={{visibility:props.guestSpeech&&props.guestNear?'visible':'hidden'}}>{props.guestSpeech}</div></Html>
    <KitchenRoutineProps reducedMotion={props.reducedMotion} active={props.chefMode==='routine'}/>
    {props.dish && <ServedDish key={props.dish} kind={props.dish} reducedMotion={props.reducedMotion} bites={props.bites} clearing={props.clearing} onReady={props.onDishReady} onPosition={props.onDishPosition}/>}
    {props.tea && <group position={[.65,2.045,1.7]}><Cylinder position={[0,.12,0]} radius={.12} height={.23} color="#b8b18b"/><Cylinder position={[0,.239,0]} radius={.1} height={.004} color="#6b713e"/></group>}
    {props.walking&&<Arrival target={props.seatTarget} onNear={props.onSeatNear} onSelect={props.onSeatSelect} reducedMotion={props.reducedMotion}/>}
    <CameraRig {...props}/>
  </>;
}

export default function Restaurant(props:SceneProps) {
  return <Canvas shadows dpr={[1,1.5]} camera={{ position:[8,6.6,10], fov:43, near:.1, far:60 }} gl={{antialias:true,alpha:false,powerPreference:'high-performance'}}>
    <Room {...props}/>
  </Canvas>;
}
