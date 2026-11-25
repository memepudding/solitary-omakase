import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
globalThis.ProgressEvent=class ProgressEvent {constructor(type,init){this.type=type;Object.assign(this,init);}};
const bytes=fs.readFileSync(new URL('../public/characters/teepu-rigged.glb',import.meta.url));
const jsonLength=bytes.readUInt32LE(12),json=JSON.parse(bytes.subarray(20,20+jsonLength).toString());
const binaryOffset=20+jsonLength+8;
assert.equal(json.skins.length,1);assert.equal(json.skins[0].joints.length,9);
assert.deepEqual(json.animations.map(a=>a.name).sort(),['ArmsRelaxed','StirRight']);
// Geometry-only loading lets us verify exported bones without a browser image decoder.
json.buffers[0].uri='data:application/octet-stream;base64,'+bytes.subarray(binaryOffset).toString('base64');
for(const mesh of json.meshes)for(const p of mesh.primitives)delete p.material;
json.materials=[];json.images=[];json.textures=[];
const gltf=await new Promise((resolve,reject)=>new GLTFLoader().parse(JSON.stringify(json),'',resolve,reject));
let mesh;gltf.scene.traverse(o=>{if(o.isSkinnedMesh)mesh=o;});assert(mesh);
assert(mesh.geometry.attributes.position.count>=16169&&mesh.geometry.attributes.position.count<=16177,'Only export seam splits may add vertices');
const mixer=new T.AnimationMixer(gltf.scene);
function sample(name,time){
 mixer.stopAllAction();mixer.clipAction(gltf.animations.find(a=>a.name===name)).play();mixer.setTime(time);
 gltf.scene.updateMatrixWorld(true);mesh.skeleton.update();
 return mesh.skeleton.bones.find(b=>b.name==='PawR').getWorldPosition(new T.Vector3());
}
const rest=sample('ArmsRelaxed',.5);assert(rest.y<.25,'Resting paw must hang below shoulder');
const a=sample('StirRight',.1),b=sample('StirRight',.85);assert(a.distanceTo(b)>.01,'Stirring paw must move');
const pos=mesh.geometry.attributes.position;
let checked=0;
for(let i=0;i<pos.count;i++){
 const original=new T.Vector3().fromBufferAttribute(pos,i);
 if(original.y>.47){assert(mesh.applyBoneTransform(i,original.clone()).distanceTo(original)<1e-5,'Face/ears must not deform');checked++;}
}
assert(checked>3000);
console.log(`PASS: 16,169 source vertices (export seam splits allowed); 9 bones; 2 exported clips; moving paw; ${checked} head/ear vertices unchanged.`);
