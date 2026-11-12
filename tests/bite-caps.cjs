const fs=require('fs'),ts=require('typescript'),assert=require('node:assert/strict'),T=require('three');
const source=ts.transpileModule(fs.readFileSync('lib/bite-caps.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const moduleCaps={exports:{}};new Function('require','module','exports',source)(require,moduleCaps,moduleCaps.exports);const {makeBiteCaps}=moduleCaps.exports;
const catalog=JSON.parse(fs.readFileSync('lib/food-catalog.json'));
for(const kind of Object.keys(catalog.dishes)){
 const bytes=fs.readFileSync(`public/foods/assets/${kind}.glb`),length=bytes.readUInt32LE(12),doc=JSON.parse(bytes.toString('utf8',20,20+length)),base=28+length;
 const read=index=>{const a=doc.accessors[index],v=doc.bufferViews[a.bufferView],count=({SCALAR:1,VEC2:2,VEC3:3,VEC4:4})[a.type],C=({5126:Float32Array,5123:Uint16Array,5125:Uint32Array})[a.componentType],offset=base+(v.byteOffset||0)+(a.byteOffset||0);return new C(bytes.buffer.slice(bytes.byteOffset+offset,bytes.byteOffset+offset+a.count*count*C.BYTES_PER_ELEMENT));};
 const scene=new T.Group();for(const mesh of doc.meshes)for(const p of mesh.primitives){const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(read(p.attributes.POSITION),3));if(p.indices!==undefined)g.setIndex(new T.BufferAttribute(read(p.indices),1));const m=doc.materials[p.material],material=new T.MeshStandardMaterial();material.name=m.name||'';material.userData=m.extras||{};scene.add(new T.Mesh(g,material));}
 const box=new T.Box3().setFromObject(scene),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());const caps=makeBiteCaps(scene,kind,new T.Vector3(center.x,box.min.y,center.z),Math.max(size.x,size.z),{value:1});
 assert(caps.children.length>0,`${kind}: missing solid cut faces`);caps.traverse(o=>{if(o.isMesh){assert([...o.geometry.attributes.position.array].every(Number.isFinite));o.geometry.dispose();o.material.dispose();}});scene.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});
}
const scene=new T.Group(),plate=new T.Mesh(new T.CylinderGeometry(1,1,.1),new T.MeshStandardMaterial());plate.material.userData.vessel=true;scene.add(plate);assert.equal(makeBiteCaps(scene,'61-sleepy-bread',new T.Vector3(),2,{value:1}).children.length,0);
console.log('PASS: solid bite faces generated for all 63 foods; vessels excluded; all vertices finite.');
