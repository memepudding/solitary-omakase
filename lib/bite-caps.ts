import * as T from 'three';
import {MeshBVH} from 'three-mesh-bvh';
export const BITE_CIRCLES=[[-.40,.26,.40],[.36,.22,.44]] as const;
export function isVessel(kind:string,material:T.Material){
 const supplied=['Ivory glazed ceramic','Honey wood grain','Warm earthenware','Barrel bronze bands','Cocoa speckled pottery','Matte cocoa','Warm clear glass'];
 return material.userData.vessel===true||(parseInt(kind)<=11&&(supplied.includes(material.name)||(kind==='01-chawanmushi'&&material.name==='Peach blossom glaze')));
}
// Build real curved cut faces through the food volume. Each vertical ray samples
// entry/exit surfaces; winding depth also handles overlapping pieces of rice.
export function makeBiteCaps(scene:T.Object3D,kind:string,origin:T.Vector3,span:number,uniform:{value:number}){
 const result=new T.Group();result.name='Solid food cut faces';scene.updateMatrixWorld(true);
 scene.traverse(object=>{if(!(object instanceof T.Mesh))return;
 const source=object.geometry as T.BufferGeometry,materials=Array.isArray(object.material)?object.material:[object.material];
 for(let mi=0;mi<materials.length;mi++){
  const material=materials[mi] as T.MeshStandardMaterial;if(isVessel(kind,material))continue;
  let geometry=source.clone();
  if(materials.length>1){const raw=geometry.index?geometry.toNonIndexed():geometry;const positions=raw.getAttribute('position'),values:number[]=[];for(const group of raw.groups){if(group.materialIndex!==mi)continue;for(let i=group.start;i<group.start+group.count;i++)values.push(positions.getX(i),positions.getY(i),positions.getZ(i));}geometry.dispose();geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(values,3));if(raw!==source)raw.dispose();}
  if(!geometry.getAttribute('position')?.count){geometry.dispose();continue;}
  geometry.applyMatrix4(object.matrixWorld);geometry.translate(-origin.x,-origin.y,-origin.z);geometry.scale(1/span,1/span,1/span);geometry.computeBoundingBox();
  const bounds=geometry.boundingBox!,bvh=new MeshBVH(geometry,{maxLeafTris:12}),ray=new T.Ray(new T.Vector3(),new T.Vector3(0,1,0));
  BITE_CIRCLES.forEach(([cx,cz,r],bite)=>{
   if(cx+r<bounds.min.x||cx-r>bounds.max.x||cz+r<bounds.min.z||cz-r>bounds.max.z)return;
   const values:number[]=[],segments=160;
   for(let a=0;a<segments;a++){
    const t0=a/segments*Math.PI*2,t1=(a+1)/segments*Math.PI*2,tm=(t0+t1)/2,x=cx+Math.cos(tm)*(r+.00015),z=cz+Math.sin(tm)*(r+.00015);
    ray.origin.set(x,bounds.min.y-.01,z);const hits=bvh.raycast(ray,T.DoubleSide).sort((a,b)=>a.distance-b.distance);
    let depth=0,start=0,previous=-Infinity;
    for(const hit of hits){if(Math.abs(hit.distance-previous)<.00001)continue;previous=hit.distance;const y=hit.point.y,sign=(hit.face?.normal.y??0)<0?1:-1;const old=depth;depth+=sign;
     if(old===0)start=y;
     if(depth===0&&y-start>.00001){const p0=[cx+Math.cos(t0)*(r+.0002),start,cz+Math.sin(t0)*(r+.0002)],p1=[cx+Math.cos(t1)*(r+.0002),start,cz+Math.sin(t1)*(r+.0002)],p2=[p1[0],y,p1[2]],p3=[p0[0],y,p0[2]];values.push(...p0,...p2,...p1,...p0,...p3,...p2);}
    }
   }
   if(!values.length)return;
   const capGeometry=new T.BufferGeometry();capGeometry.setAttribute('position',new T.Float32BufferAttribute(values,3));capGeometry.computeVertexNormals();
   const capMaterial=new T.MeshStandardMaterial({color:material.color?.clone()??new T.Color('#e7cba3'),roughness:.85,side:T.DoubleSide});
   capMaterial.onBeforeCompile=shader=>{shader.uniforms.biteCount=uniform;shader.vertexShader='varying vec3 capPosition;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ncapPosition=position;');shader.fragmentShader='varying vec3 capPosition;uniform float biteCount;\n'+shader.fragmentShader;const other=BITE_CIRCLES[1-bite];shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>\nif(biteCount < ${bite+1}.0 || biteCount >= 3.0 || (biteCount >= 2.0 && distance(capPosition.xz,vec2(${other[0]},${other[1]})) < ${other[2]})) discard;`);};capMaterial.customProgramCacheKey=()=>`solid-bite-${bite}`;
   const cap=new T.Mesh(capGeometry,capMaterial);cap.position.copy(origin);cap.scale.setScalar(span);cap.renderOrder=1;result.add(cap);
  });geometry.dispose();
 }
 });return result;
}
