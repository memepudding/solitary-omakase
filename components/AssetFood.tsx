'use client';
import { Component, Suspense, useEffect, useMemo, type ReactNode } from 'react';
import { Html, useGLTF } from '@react-three/drei';
import * as T from 'three';
import {makeBiteCaps} from '@/lib/bite-caps';
import { dishModel, dishPoster, DISHES, type AssetDishKind } from '@/lib/menu';

function Model({kind,bites=0,onReady}:{kind:AssetDishKind;bites?:number;onReady?:()=>void}){
 const {scene}=useGLTF(dishModel(kind));
 const model=useMemo(()=>{
  const clone=scene.clone(true);clone.updateMatrixWorld(true);
  const box=new T.Box3().setFromObject(clone),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());
  const span=Math.max(size.x,size.z),scale=Math.min(1.12/span,.8/size.y),uniform={value:0},materials:T.Material[]=[];
  const caps=makeBiteCaps(clone,kind,new T.Vector3(center.x,box.min.y,center.z),span,uniform);
  clone.traverse(object=>{if(!(object instanceof T.Mesh))return;
   object.castShadow=true;object.receiveShadow=true;
   const base=Array.isArray(object.material)?object.material:[object.material];
   const mapped=base.map(original=>{
    const mat=original.clone() as T.MeshStandardMaterial;materials.push(mat);
    const sourceMatrix=object.matrixWorld.clone();
    const suppliedVessels=['Ivory glazed ceramic','Honey wood grain','Warm earthenware','Barrel bronze bands','Cocoa speckled pottery','Matte cocoa','Warm clear glass'];
    const vessel=original.userData.vessel===true || (parseInt(kind)<=11&&(suppliedVessels.includes(original.name)||(kind==='01-chawanmushi'&&original.name==='Peach blossom glaze')));
    const marked=typeof original.userData.vessel==='boolean'||parseInt(kind)<=11;
    // Older supplied models are a single baked mesh. Keep their lower vessel region.
    const legacyFloor=(['01-chawanmushi','04-mushroom-dashi','05-unagi-rice','10-pumpkin-custard','11-salmon-ochazuke'].includes(kind)?.43:.15)*size.y/span;
    mat.onBeforeCompile=shader=>{
     shader.uniforms.biteCount=uniform;shader.uniforms.biteTransform={value:sourceMatrix};shader.uniforms.biteOrigin={value:new T.Vector3(center.x,box.min.y,center.z)};shader.uniforms.biteSpan={value:span};
     shader.vertexShader='varying vec3 bitePosition; uniform mat4 biteTransform; uniform vec3 biteOrigin; uniform float biteSpan;\n'+shader.vertexShader;
     shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','bitePosition=((biteTransform*vec4(transformed,1.0)).xyz-biteOrigin)/biteSpan;\n#include <project_vertex>');
     shader.fragmentShader='varying vec3 bitePosition; uniform float biteCount;\n'+shader.fragmentShader;
     const edible=vessel?'false':marked?'true':`bitePosition.y > ${legacyFloor.toFixed(5)}`;
     shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>
       if (${edible}) {
        vec2 p=bitePosition.xz;
        if(biteCount>=3.0 || (biteCount>=1.0 && distance(p,vec2(-0.40,0.26))<0.40) || (biteCount>=2.0 && distance(p,vec2(0.36,0.22))<0.44)) discard;
       }`);
    };
    mat.customProgramCacheKey=()=>`bite-v3-${kind}-${marked}-${vessel}`;
    return mat;
   });
   object.material=Array.isArray(object.material)?mapped:mapped[0];
  });
  clone.add(caps);
  return {clone,caps,scale,offset:[-center.x*scale,-box.min.y*scale,-center.z*scale] as [number,number,number],uniform,materials};
 },[scene,kind]);
 useEffect(()=>{onReady?.();},[model,onReady]);
 model.uniform.value=bites;
 useEffect(()=>{model.clone.traverse(o=>{if(o instanceof T.Mesh)o.castShadow=bites===0;});},[model,bites]);
 useEffect(()=>()=>{model.materials.forEach(m=>m.dispose());model.caps.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();(o.material as T.Material).dispose();}});},[model]);
 return <group position={model.offset}><primitive object={model.clone} scale={model.scale} dispose={null}/></group>;
}
class FoodBoundary extends Component<{children:ReactNode;kind:AssetDishKind},{failed:boolean}>{
 state={failed:false};static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?<Html center><img src={dishPoster(this.props.kind)} width="110" alt={DISHES[this.props.kind].name}/></Html>:this.props.children;}
}
export default function AssetFood({kind,bites=0,onReady}:{kind:AssetDishKind;bites?:number;onReady?:()=>void}){
 return <FoodBoundary key={kind} kind={kind}><Suspense fallback={<mesh rotation={[-Math.PI/2,0,0]}><torusGeometry args={[.15,.012,8,32]}/><meshBasicMaterial color="#e8d9b9"/></mesh>}><Model kind={kind} bites={bites} onReady={onReady}/></Suspense></FoodBoundary>;
}
