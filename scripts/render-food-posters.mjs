// CPU thumbnails from the actual new GLB geometry; no placeholder dish icons.
import fs from 'node:fs';
import {createRequire} from 'node:module';
import * as T from 'three';
const require=createRequire(import.meta.url),{PNG}=createRequire(require.resolve('qrcode'))('pngjs');
const catalog=JSON.parse(fs.readFileSync('lib/food-catalog.json'));
const W=320,H=260,light=new T.Vector3(-.4,.8,1).normalize();
for(const id of Object.keys(catalog.dishes)){
 if((parseInt(id)<=12&&id!=='12-strawberry-daifuku')||(process.argv.length>2&&!process.argv.slice(2).includes(id)))continue;
 const buf=fs.readFileSync(`public/foods/assets/${id}.glb`),jl=buf.readUInt32LE(12),doc=JSON.parse(buf.toString('utf8',20,20+jl)),bin=28+jl;
 const array=i=>{let a=doc.accessors[i],v=doc.bufferViews[a.bufferView];return new Float32Array(buf.buffer,buf.byteOffset+bin+(v.byteOffset||0)+(a.byteOffset||0),a.count*3);};
 const primitives=doc.meshes[0].primitives;
 const bounds=new T.Box3();for(const p of primitives){const a=doc.accessors[p.attributes.POSITION];bounds.expandByPoint(new T.Vector3(...a.min));bounds.expandByPoint(new T.Vector3(...a.max));}
 const center=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3());
 const view=new T.Matrix4().lookAt(new T.Vector3(2.4,2.3,4),new T.Vector3(),new T.Vector3(0,1,0)).invert();
 const vertices=primitives.map(p=>{const pos=array(p.attributes.POSITION),norm=array(p.attributes.NORMAL),v=[];for(let i=0;i<pos.length;i+=3){let q=new T.Vector3(pos[i],pos[i+1],pos[i+2]).sub(center).applyMatrix4(view);v.push([q.x,q.y,q.z,Math.max(0,new T.Vector3(norm[i],norm[i+1],norm[i+2]).dot(light))]);}return v;});
 let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;for(const verts of vertices)for(const v of verts){minX=Math.min(minX,v[0]);maxX=Math.max(maxX,v[0]);minY=Math.min(minY,v[1]);maxY=Math.max(maxY,v[1]);}
 const scale=Math.min((W-30)/(maxX-minX),(H-30)/(maxY-minY));
 for(const verts of vertices)for(const v of verts){v[0]=(v[0]-(minX+maxX)/2)*scale+W/2;v[1]=H/2-(v[1]-(minY+maxY)/2)*scale;}
 const png=new PNG({width:W,height:H}),depth=new Float32Array(W*H).fill(-Infinity);
 // Opaque surfaces first, translucent glass last; preserve transparent background.
 const order=primitives.map((p,i)=>i).sort((a,b)=>(doc.materials[primitives[a].material].alphaMode==='BLEND')-(doc.materials[primitives[b].material].alphaMode==='BLEND'));
 for(const pi of order){const verts=vertices[pi],m=doc.materials[primitives[pi].material],rgba=m.pbrMetallicRoughness.baseColorFactor,col=new T.Color(rgba[0],rgba[1],rgba[2]).convertLinearToSRGB(),alpha=rgba[3];
  for(let i=0;i<verts.length;i+=3){const [a,b,c]=verts.slice(i,i+3),area=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(area)<.001)continue;
   const x0=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0]))),x1=Math.min(W-1,Math.ceil(Math.max(a[0],b[0],c[0]))),y0=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1]))),y1=Math.min(H-1,Math.ceil(Math.max(a[1],b[1],c[1])));
   for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){let u=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/area,v=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/area,w=1-u-v;if(u<0||v<0||w<0)continue;let z=u*a[2]+v*b[2]+w*c[2],k=y*W+x;if(z<=depth[k])continue;let shade=.62+.38*(u*a[3]+v*b[3]+w*c[3]),j=k*4;const old=png.data[j+3]/255,out=alpha+old*(1-alpha);for(let ch=0;ch<3;ch++){let color=[col.r,col.g,col.b][ch]*255*shade;png.data[j+ch]=(color*alpha+png.data[j+ch]*old*(1-alpha))/out;}png.data[j+3]=out*255;if(alpha===1)depth[k]=z;}
  }
 }
 fs.writeFileSync(`public/foods/posters/${id}.png`,PNG.sync.write(png));
}
console.log('Rendered food thumbnails from their GLB geometry.');
