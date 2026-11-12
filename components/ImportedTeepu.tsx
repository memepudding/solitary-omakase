'use client';
import {useMemo,useRef} from 'react';
import {useGLTF} from '@react-three/drei';
import {useFrame} from '@react-three/fiber';
import * as T from 'three';
import {sampleChefRoutine} from '@/lib/chef-routine';
import {GUEST_SEAT,type ChefMode} from '@/lib/staging';
export default function ImportedTeepu({mode,reducedMotion}:{mode:ChefMode;reducedMotion:boolean}){
 const {scene}=useGLTF('/characters/teepu.glb');const root=useRef<T.Group>(null),body=useRef<T.Group>(null);
 const model=useMemo(()=>{const clone=scene.clone(true),box=new T.Box3().setFromObject(clone),size=box.getSize(new T.Vector3()),c=box.getCenter(new T.Vector3()),scale=3.25/size.y;clone.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=true;o.receiveShadow=true;
 // Pose only the low, outstretched sleeve/arm region; keep head and ears untouched.
 o.geometry=o.geometry.clone();const positions=o.geometry.getAttribute('position');
 for(let i=0;i<positions.count;i++){
  const v=new T.Vector3().fromBufferAttribute(positions,i);const side=Math.sign(v.z);
  const outer=T.MathUtils.smoothstep(Math.abs(v.z),.145,.245);
  const height=1-T.MathUtils.smoothstep(v.y,-.085,-.035);
  const lower=T.MathUtils.smoothstep(v.y,-.40,-.32);
  const angle=outer*height*lower*1.35;const dz=Math.abs(v.z)-.16,dy=v.y+.20;
  v.z=side*(.16+dz*Math.cos(angle)+dy*Math.sin(angle));v.y=-.20+dy*Math.cos(angle)-dz*Math.sin(angle);
  positions.setXYZ(i,v.x,v.y,v.z);
 }o.geometry.computeVertexNormals();o.geometry.computeBoundingSphere();}});return{clone,scale,offset:[-c.x*scale,-box.min.y*scale,-c.z*scale] as [number,number,number]};},[scene]);
 useFrame(({clock},dt)=>{if(!root.current||!body.current)return;const t=clock.elapsedTime,r=sampleChefRoutine(t,reducedMotion),routine=mode==='routine';root.current.position.lerp(new T.Vector3(routine?T.MathUtils.clamp(r.x,-1.65,1.65):GUEST_SEAT.x,.32,routine?T.MathUtils.clamp(r.z,-1.85,-.8):-.8),1-Math.exp(-dt*5));root.current.rotation.y=routine?r.yaw:0;body.current.position.y=reducedMotion?0:routine&&r.moving?Math.abs(Math.sin(t*13))*.055:Math.sin(t*1.6)*.009;body.current.rotation.z=reducedMotion?0:mode==='think'?Math.sin(t*2)*.045:routine&&r.moving?Math.sin(t*13)*.025:0;body.current.rotation.x=mode==='serve'?.055:0;});
 // A gentle sleeve-weighted rest pose avoids sharp elbow bends in this unrigged model.
 return <group ref={root}><group ref={body}><group position={model.offset}><group rotation={[0,-Math.PI/2,0]}><primitive object={model.clone} scale={model.scale} dispose={null}/></group></group></group></group>;
}
