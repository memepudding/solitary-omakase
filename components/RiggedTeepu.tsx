'use client';
import {useEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {useGLTF} from '@react-three/drei';
import {clone as cloneSkeleton} from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as T from 'three';
export type TeepuPose='rest'|'stir'|'bind';
export default function RiggedTeepu({pose='rest',reducedMotion=false}:{pose?:TeepuPose;reducedMotion?:boolean}){
 const {scene,animations}=useGLTF('/characters/teepu-rigged.glb');
 const root=useRef<T.Group>(null),spoon=useRef<T.Group>(null),previous=useRef<T.AnimationAction|null>(null);
 const model=useMemo(()=>{
  const object=cloneSkeleton(scene);object.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;}});
  const mixer=new T.AnimationMixer(object);
  const clips=Object.fromEntries(animations.map(clip=>[clip.name,mixer.clipAction(clip)]));
  return {object,mixer,clips,paw:object.getObjectByName('PawR')||object.getObjectByName('Paw.R'),socket:new T.Vector3()};
 },[scene,animations]);
 useEffect(()=>{
  if(pose==='bind'){model.mixer.stopAllAction();previous.current=null;return;}
  const next=model.clips[pose==='stir'?'StirRight':'ArmsRelaxed'];
  if(!next)return;
  const old=previous.current;
  next.reset().setEffectiveWeight(1).play();
  if(old&&old!==next&&!reducedMotion){old.fadeOut(.35);next.fadeIn(.35);}else if(old&&old!==next)old.stop();
  if(reducedMotion){next.time=next.getClip().duration*.25;model.mixer.update(0);}
  else model.mixer.update(0);
  previous.current=next;
 },[pose,reducedMotion,model]);
 useEffect(()=>()=>{model.mixer.stopAllAction();model.mixer.uncacheRoot(model.object);},[model]);
 useFrame((_,dt)=>{
  model.mixer.update(reducedMotion?0:Math.min(dt,.05));
  if(spoon.current&&root.current&&model.paw){
   root.current.updateWorldMatrix(true,true);
   model.socket.set(0,.04,0);model.paw.localToWorld(model.socket);root.current.worldToLocal(model.socket);
   spoon.current.position.copy(model.socket);
  }
 });
 return <group ref={root} dispose={null}>
  <primitive object={model.object}/>
  {pose==='stir'&&<group ref={spoon}>
   <mesh position={[0,-.045,0]} castShadow><cylinderGeometry args={[.005,.006,.11,12]}/><meshStandardMaterial color="#8b603b" roughness={.65}/></mesh>
   <mesh position={[0,-.104,0]} scale={[.022,.007,.016]} castShadow><sphereGeometry args={[1,16,10]}/><meshStandardMaterial color="#a77a4a" roughness={.55}/></mesh>
  </group>}
 </group>;
}
