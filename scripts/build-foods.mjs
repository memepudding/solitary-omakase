import * as T from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import fs from 'node:fs';
const catalog=JSON.parse(fs.readFileSync('lib/food-catalog.json'));const out='public/foods/assets';
const colors={cream:'#efddbb',pink:'#edb8a7',wood:'#af7540',brown:'#885538',plate:'#685244',rice:'#f5e5c6',green:'#658c38',darkgreen:'#385c2b',salmon:'#f29469',tuna:'#d85e5b',toro:'#e99189',white:'#f5ddc9',yellow:'#f7c454',caramel:'#a35424',purple:'#704458',red:'#ed6560',nori:'#34422b',sesame:'#dbc8a5',gold:'#ecc07a'};
let scene,seed=1;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const mats=new Map();function material(c,rough=.65,alpha=1){c=colors[c]||c;let key=c+rough+alpha;if(!mats.has(key))mats.set(key,new T.MeshStandardMaterial({color:c,roughness:rough,transparent:alpha<1,opacity:alpha,side:T.DoubleSide}));return mats.get(key);}
function add(geo,c,p=[0,0,0],s=[1,1,1],r=[0,0,0],rough=.65,alpha=1){const m=new T.Mesh(geo,material(c,rough,alpha));m.position.set(...p);m.scale.set(...s);m.rotation.set(...r);scene.add(m);return m;}
function ball(p,s,c,rough=.65){return add(new T.SphereGeometry(1,20,12),c,p,s,[0,0,0],rough);}
function box(p,s,c,r=[0,0,0]){return add(new RoundedBoxGeometry(...s,3,Math.min(...s)*.18),c,p,[1,1,1],r);}
function cyl(p,rt,rb,h,c,rough=.65){return add(new T.CylinderGeometry(rt,rb,h,40),c,p,[1,1,1],[0,0,0],rough);}
function tube(points,r,c){return add(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),Math.max(16,points.length*3),r,7,false),c);}
function lathe(profile,c,p=[0,0,0],alpha=1,flute=0){const g=new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),64);if(flute){const pos=g.attributes.position;for(let i=0;i<pos.count;i++){const a=Math.atan2(pos.getZ(i),pos.getX(i)),v=1+Math.cos(a*12)*flute;pos.setX(i,pos.getX(i)*v);pos.setZ(i,pos.getZ(i)*v);}g.computeVertexNormals();}return add(g,c,p,[1,1,1],[0,0,0],.35,alpha);}
function plate(c='plate',r=1){lathe([[0,.03],[r*.7,.03],[r,.09],[r,.15],[r*.94,.18],[r*.7,.12],[0,.11]],c);}
function bowl(c='cream',r=.83,h=.48,flute=.03,glass=false){lathe([[0,.02],[r*.45,.02],[r*.5,.08],[r*.7,h*.5],[r*.92,h*.85],[r,h],[r-.025,h+.025],[r-.065,h],[r*.82,h*.72],[r*.6,.16],[0,.13]],c,[0,0,0],glass?.4:1,flute);}
function sauce(c,y=.29,r=.69){cyl([0,y,0],r,r,.025,c,.22);}
function garnish(y,x=0,z=0){for(let i=0;i<5;i++){let a=i*2.4;ball([x+Math.cos(a)*.09,y+i*.009,z+Math.sin(a)*.07],[.045,.025,.07],'green');}}
function seeds(y,r=.3){for(let i=0;i<25;i++){let a=random()*6.28,d=random()*r;ball([Math.cos(a)*d,y+random()*.03,Math.sin(a)*d],[.018,.012,.035],'gold');}}
function leaf(y,x=0,z=0){for(let i=0;i<2;i++){let m=ball([x+(i-.5)*.1,y+.03,z],[.08,.012,.15],'green');m.rotation.z=(i-.5)*.6;m.rotation.y=i*.7;}}
function rice(x=0,y=.25,z=0,s=1){ball([x,y,z],[.29*s,.14*s,.44*s],'rice');for(let i=0;i<70;i++){let a=random()*6.28,d=Math.sqrt(random());ball([x+Math.cos(a)*d*.28*s,y+.1*s*(1-d*.5)+random()*.04,z+Math.sin(a)*d*.4*s],[.04*s,.025*s,.065*s],'rice');}}
function fish(x,y,z,c,s=1,striped=false){let m=ball([x,y,z],[.34*s,.1*s,.49*s],c,.35);if(striped)for(let j=-3;j<=3;j++){tube([[x-.27*s,y+.03,z+j*.1*s-.03],[x,y+.102*s,z+j*.1*s],[x+.27*s,y+.03,z+j*.1*s+.07]],.008*s,c==='salmon'?'white':'pink');}return m;}
function sushi(c='salmon',count=1,board=false){if(board){box([0,.11,0],[1.8,.15,1.1],'wood').userData.vessel=true;box([-.65,.04,0],[.16,.15,.8],'wood').userData.vessel=true;box([.65,.04,0],[.16,.15,.8],'wood').userData.vessel=true;}else plate();for(let i=0;i<count;i++){let x=(i-(count-1)/2)*.57,s=count>1?.78:1;rice(x,.26,0,s);fish(x,.4,0,Array.isArray(c)?c[i]:c,s,true);garnish(.49,x,0);}}
function pudding(c='yellow',topping='caramel'){plate('wood',.83);lathe([[0,.15],[.55,.15],[.56,.21],[.43,.81],[.4,.85],[0,.85]],c);cyl([0,.856,0],.41,.41,.018,topping,.22);}
function chestnut(y){ball([0,y,0],[.18,.15,.16],'caramel',.3);for(let i=-2;i<=2;i++)tube([[i*.035,y-.08,.14],[i*.035,y+.06,.16],[i*.025,y+.13,.05]],.007,'wood');}
function custard(top){plate('wood',.86);lathe([[0,.13],[.53,.13],[.57,.22],[.57,.82],[.55,.85],[.5,.84],[.5,.24],[0,.22]],'cream');sauce('yellow',.79,.5);if(top==='uni'){for(let i=0;i<3;i++)ball([(i-1)*.15,.85,0],[.1,.06,.23],'yellow');}else if(top==='scallop'){scallop(0,.85,0);}else{for(let i=0;i<3;i++)ball([(i-1)*.12,.84,0],[.09,.06,.13],'salmon');}garnish(.94);for(let i=0;i<5;i++){let a=i*6.28/5;ball([Math.cos(a)*.08,.47+Math.sin(a)*.08,.565],[.06,.05,.015],'pink');}let lid=cyl([-.68,.48,-.08],.56,.56,.08,'cream');lid.rotation.z=-.7;}
function mushroom(x,y,z){cyl([x,y,z],.035,.045,.2,'cream');ball([x,y+.1,z],[.12,.055,.11],'sesame');}
function pot(){bowl('brown',.86,.55,0);sauce('rice',.46,.75);for(let i=0;i<80;i++){let a=random()*6.28,d=Math.sqrt(random())*.7;ball([Math.cos(a)*d,.49+random()*.05,Math.sin(a)*d],[.035,.02,.055],'rice');}for(let x of [-.93,.93])ball([x,.36,0],[.15,.06,.15],'brown').userData.vessel=true;}
function scallop(x,y,z){cyl([x,y,z],.17,.18,.15,'gold');for(let i=0;i<9;i++){let a=i*6.28/9;tube([[x+Math.cos(a)*.06,y+.08,z+Math.sin(a)*.06],[x+Math.cos(a)*.17,y+.02,z+Math.sin(a)*.17]],.005,'caramel');}}
function cupGlass(){lathe([[0,.03],[.4,.03],[.43,.08],[.17,.14],[.13,.27],[.25,.34],[.65,.53],[.72,.85],[.68,.87],[.61,.55],[.2,.36],[.07,.27],[0,.27]],'#e7dfcc',[0,0,0],.36);}
function sorbet(c){cupGlass();ball([0,.71,0],[.48,.43,.48],c,.12);for(let i=0;i<100;i++){let a=random()*6.28,b=random()*Math.PI;ball([Math.sin(b)*Math.cos(a)*.477,.71+Math.cos(b)*.427,Math.sin(b)*Math.sin(a)*.477],[.018,.012,.018],c,.15);}leaf(1.13);}
function strawberry(x,y,z,s=.25){ball([x,y,z],[s,s*1.25,s*.8],'red');for(let i=0;i<18;i++){let a=random()*6.28,b=random()*Math.PI;ball([x+Math.sin(b)*Math.cos(a)*s,y+Math.cos(b)*s*1.25,z+Math.sin(b)*Math.sin(a)*s*.81],[.009,.014,.008],'cream');}}
function strawberrySlice(x,y,z,s=.25){
 // A filled flat cut face, pale center and radial seed marks — not a whole berry.
 const shape=new T.Shape();shape.moveTo(0,-s);shape.bezierCurveTo(-s*.8,-s*.5,-s,s*.55,-s*.45,s*.8);shape.quadraticCurveTo(0,s, s*.45,s*.8);shape.bezierCurveTo(s,s*.55,s*.8,-s*.5,0,-s);
 add(new T.ExtrudeGeometry(shape,{depth:.025,bevelEnabled:true,bevelSize:.008,bevelThickness:.008,bevelSegments:2,curveSegments:24}),'red',[x,y,z]);
 ball([x,y+.04,z+.035],[s*.24,s*.65,.018],'pink');
 for(let i=0;i<12;i++){let a=i*6.28/12;ball([x+Math.cos(a)*s*.55,y+Math.sin(a)*s*.65,z+.037],[.008,.018,.006],'cream');}
}
function mochi(c='white',fill='none'){plate('cream',.8);if(fill==='none'){for(let i=0;i<3;i++)ball([(i-1)*.37,.32,i===1?-.19:.08],[.26,.26,.27],c,.94);return;}
 // Closed cut hemisphere: cream fills the entire interior and fruit is embedded in its face.
 add(new T.SphereGeometry(1,40,24,Math.PI,Math.PI),c,[0,.51,0],[.57,.5,.52]);
 add(new T.CircleGeometry(1,64),c,[0,.51,.015],[.57,.5,1]);
 add(new T.SphereGeometry(1,40,24,Math.PI,Math.PI),'cream',[0,.51,0],[.49,.43,.45]);
 add(new T.CircleGeometry(1,64),'cream',[0,.51,.025],[.49,.43,1]);
 if(fill==='strawberry')strawberrySlice(0,.51,.04,.34);
 else if(fill==='mango')for(let i=0;i<4;i++)box([(i%2-.5)*.22,.4+Math.floor(i/2)*.2,.055],[.21,.2,.045],'yellow');
 else {strawberrySlice(-.15,.67,.04,.16);ball([.19,.43,.05],[.21,.19,.025],'yellow');ball([-.16,.32,.05],[.15,.14,.025],'green');ball([.03,.29,.08],[.075,.075,.02],'nori');}
}

function roll(c='gold',tuna=false){plate();for(let j=-1;j<=1;j++){let x=j*.51;let n=cyl([x,.34,0],.27,.27,.45,'nori');n.rotation.x=Math.PI/2;let r=cyl([x,.34,.235],.235,.235,.025,'rice');r.rotation.x=Math.PI/2;ball([x-.06,.34,.26],[.09,.13,.025],'salmon');ball([x+.09,.34,.26],[.05,.15,.025],'green');for(let i=0;i<50;i++){let a=random()*6.28,z=(random()-.5)*.44;ball([x+Math.cos(a)*.275,.34+Math.sin(a)*.275,z],[.035,.035,.04],c);}if(tuna)fish(x,.59,0,'tuna',.62,true);garnish(.67,x,0);}}
function shrimp(x,y,z,s=1){for(let i=0;i<7;i++){let a=i*.22;ball([x+Math.sin(a)*.24*s,y+Math.cos(a)*.1*s,z+(i-3)*.075*s],[.13*s,.085*s,.075*s],'salmon');}for(let i=-1;i<=1;i++){let m=ball([x+.2*s+i*.06*s,y-.02*s,z+.36*s],[.045*s,.015*s,.16*s],'salmon');m.rotation.y=i*.3;}}
function exportGLB(file){scene.updateMatrixWorld(true);let grouped=new Map();for(const m of scene.children){let g=m.geometry.clone();if(g.index)g=g.toNonIndexed();g.applyMatrix4(m.matrixWorld);for(const key of Object.keys(g.attributes))if(!['position','normal'].includes(key))g.deleteAttribute(key);const key=m.material.uuid+':'+!!m.userData.vessel;if(!grouped.has(key))grouped.set(key,{mat:m.material,geos:[],vessel:!!m.userData.vessel});grouped.get(key).geos.push(g);}
 const doc={asset:{version:'2.0',generator:'TEEPU hand-built food geometry'},scene:0,scenes:[{nodes:[0]}],nodes:[{mesh:0,name:scene.name}],meshes:[{primitives:[]}],materials:[],buffers:[{byteLength:0}],bufferViews:[],accessors:[]};let chunks=[],offset=0;
 function attr(array,type){const buf=Buffer.from(array.buffer,array.byteOffset,array.byteLength);let view=doc.bufferViews.length;doc.bufferViews.push({buffer:0,byteOffset:offset,byteLength:buf.length,target:34962});chunks.push(buf);offset+=buf.length;const a={bufferView:view,componentType:5126,count:array.length/3,type:'VEC3'};if(type==='POSITION'){a.min=[Infinity,Infinity,Infinity];a.max=[-Infinity,-Infinity,-Infinity];for(let i=0;i<array.length;i++){let k=i%3;a.min[k]=Math.min(a.min[k],array[i]);a.max[k]=Math.max(a.max[k],array[i]);}}doc.accessors.push(a);return doc.accessors.length-1;}
 for(const {mat,geos,vessel} of grouped.values()){let g=mergeGeometries(geos);let materialIndex=doc.materials.length;doc.materials.push({name:mat.color.getHexString(),extras:{vessel},pbrMetallicRoughness:{baseColorFactor:[mat.color.r,mat.color.g,mat.color.b,mat.opacity],metallicFactor:0,roughnessFactor:mat.roughness},doubleSided:true,...(mat.transparent?{alphaMode:'BLEND'}:{})});doc.meshes[0].primitives.push({attributes:{POSITION:attr(g.attributes.position.array,'POSITION'),NORMAL:attr(g.attributes.normal.array,'NORMAL')},material:materialIndex});}
 doc.buffers[0].byteLength=offset;let json=Buffer.from(JSON.stringify(doc));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);const bin=Buffer.concat(chunks);const head=Buffer.alloc(20);head.write('glTF');head.writeUInt32LE(2,4);head.writeUInt32LE(28+json.length+bin.length,8);head.writeUInt32LE(json.length,12);head.write('JSON',16);const bh=Buffer.alloc(8);bh.writeUInt32LE(bin.length,0);bh.writeUInt32LE(0x004e4942,4);fs.writeFileSync(file,Buffer.concat([head,json,bh,bin]));}
function recipe(form){
 if(form==='eggplant'){plate();for(let i=-1;i<=1;i++){let p=[i*.45,.22,i%2*.1];let m=cyl(p,.3,.3,.22,'purple');m.rotation.x=.12;let q=cyl([p[0],.34,p[2]],.27,.27,.025,'caramel',.3);q.rotation.x=.12;for(let j=-1;j<=1;j++)tube([[p[0]-.2,.36,p[2]+j*.1],[p[0]+.2,.36,p[2]+j*.1]],.008,'gold');}garnish(.42);}
 else if(form==='crab-rice'){bowl();sauce('rice',.36);sauce('yellow',.43,.71);for(let i=0;i<90;i++){let a=random()*6.28,r=random()*.6;ball([Math.cos(a)*r,.47+random()*.12,Math.sin(a)*r],[.1,.07,.1],'yellow');}for(let i=0;i<24;i++)tube([[(random()-.5)*.6,.57,(random()-.5)*.5],[(random()-.5)*.3,.82,(random()-.5)*.3]],.025,i%2?'salmon':'white');garnish(.83);}
 else if(form.includes('pudding')){pudding(form==='soy-pudding'?'cream':'yellow',form==='soy-pudding'?'cream':'caramel');if(form==='chestnut-pudding')chestnut(.98);else if(form==='soy-pudding'){seeds(.89,.13);leaf(.9);}}
 else if(form==='cucumber'){bowl('cream',.8,.4,.05);for(let i=0;i<9;i++){let a=i*2.4,r=Math.sqrt(i/9)*.45,p=[Math.cos(a)*r,.3+i*.025,Math.sin(a)*r];cyl(p,.22,.22,.055,'green');cyl([p[0],p[1]+.03,p[2]],.18,.18,.008,'cream');for(let j=0;j<5;j++)ball([p[0]+Math.cos(j)*.08,p[1]+.04,p[2]+Math.sin(j)*.08],[.015,.008,.03],'gold');}seeds(.56);}
 else if(['white-sushi','flounder','tuna-sushi','toro','wagyu'].includes(form)){sushi(form==='tuna-sushi'?'tuna':form==='toro'?'toro':form==='wagyu'?'caramel':'white',form==='tuna-sushi'||form==='toro'?2:1);if(form==='wagyu'){for(let i=-3;i<=3;i++)tube([[-.25,.49,i*.11],[.25,.49,i*.11+.07]],.01,'wood');} }
 else if(form.includes('jelly')){if(form==='matcha-jelly'){bowl('brown',.75,.4);box([0,.43,0],[.7,.5,.7],'green').material=material('green',.08);seeds(.7,.18);}else{cupGlass();if(form==='pear-jelly'){for(let i=0;i<6;i++)box([(i%3-1)*.3,.55+Math.floor(i/3)*.25,(i%2-.5)*.2],[.28,.25,.27],'cream').material=material('cream',.08);}else{ball([0,.68,0],[.43,.39,.43],'pink',.06);ball([.08,.71,.24],[.17,.25,.1],'gold');}leaf(1.08);}}
 else if(form.startsWith('tofu')||form==='sesame-tofu'){bowl(form==='tofu-roe'?'pink':'cream',.85,.4,.05);sauce('gold',.24);box([0,.43,0],[.7,.5,.65],'cream');if(form==='tofu-mushroom'){for(let i=0;i<5;i++)mushroom(Math.sin(i)*.2,.76,Math.cos(i)*.2);}else if(form==='tofu-roe'){for(let i=0;i<14;i++)ball([(random()-.5)*.35,.74+random()*.09,(random()-.5)*.3],[.055,.055,.055],'salmon',.2);}else seeds(.7);garnish(.82);}
 else if(form==='mushroom-rice'||form==='scallop-rice'){pot();if(form==='mushroom-rice'){for(let i=0;i<9;i++){let x=Math.sin(i*2.4)*.46,z=Math.cos(i*2.4)*.46;box([x,.56,z],[.09,.04,.3],'cream',[0,i*.8,0]);ball([x,.59,z+.12],[.16,.055,.12],'sesame');}}else{for(let i=0;i<3;i++)scallop(Math.sin(i*2.1)*.32,.65,Math.cos(i*2.1)*.32);box([0,.8,0],[.17,.13,.17],'yellow');}garnish(.8);}
 else if(form==='vanilla-mochi')mochi();
 else if(form==='tomato'){bowl('cream',.85,.42,.06);sauce('gold',.27);ball([0,.51,0],[.49,.42,.49],'red',.08);leaf(.95);}
 else if(form==='white-trio')sushi(['white','cream','sesame'],3);
 else if(form.includes('sorbet'))sorbet(form==='citrus-sorbet'?'gold':'yellow');
 else if(form==='tuna-roll'||form==='shrimp-roll')roll('gold',form==='tuna-roll');
 else if(form.includes('custard'))custard(form.split('-')[0]);
 else if(form==='spinach'||form==='greens'){bowl('cream',.8,.4,.06);for(let i=0;i<30;i++){let x=(random()-.5)*.8,z=(random()-.5)*.65; tube([[x,.25,z],[x+.1,.42+random()*.18,z+.1],[x-.15,.42,z+.15]],.035,i%3?'green':'darkgreen');}seeds(.58);}
 else if(form==='salmon-egg'){sushi(['salmon','yellow'],2,true);box([.28,.43,0],[.44,.23,.6],'yellow');box([.28,.43,0],[.1,.26,.62],'nori');}
 else if(form==='sweet-potato'){plate();box([0,.37,0],[.85,.5,.8],'purple');for(let i=0;i<3;i++)box([(i-1)*.12,.68,0],[.15,.13,.14],'yellow');seeds(.76,.14);}
 else if(form==='lotus'){plate();for(let i=0;i<5;i++){let shape=new T.Shape();shape.absarc(0,0,.34,0,Math.PI*2,false);for(let j=0;j<7;j++){let hole=new T.Path(),a=j*6.28/7;hole.absellipse(Math.cos(a)*.19,Math.sin(a)*.19,.055,.075,0,Math.PI*2,true,a);shape.holes.push(hole);}let g=new T.ExtrudeGeometry(shape,{depth:.035,bevelEnabled:true,bevelSize:.008,bevelThickness:.008,bevelSegments:2,curveSegments:12});add(g,'gold',[(i%3-1)*.4,.22+Math.floor(i/3)*.12,(i%2-.5)*.4],[1,1,1],[-1.3,0,i*.4]);}}
 else if(form==='parfait'){cupGlass();for(let i=0;i<25;i++)ball([(random()-.5)*.65,.38+random()*.1,(random()-.5)*.65],[.05,.04,.05],'wood');for(let i=0;i<6;i++)strawberry(Math.sin(i)*.38,.66,Math.cos(i)*.38,.15);for(let i=0;i<5;i++){let y=.77+i*.065;cyl([0,y,0],.38-i*.055,.42-i*.055,.09,'cream');}strawberry(0,1.15,0,.19);leaf(1.4);}
 else if(form==='omelette'){box([0,.09,0],[1.7,.14,1.1],'plate').userData.vessel=true;box([-.12,.39,0],[1,.48,.7],'yellow');ball([.63,.24,0],[.16,.13,.15],'rice');}
 else if(form==='soba'){bowl('cream',.9,.55);sauce('brown',.4,.78);for(let i=0;i<11;i++){let pts=[];for(let j=0;j<35;j++){let a=j*.3+i;pts.push([Math.cos(a)*(.3+i*.035),.45+Math.sin(j)*.02,Math.sin(a)*(.3+i*.035)]);}tube(pts,.025,'sesame');}for(let i=0;i<50;i++)ball([-.25+i/100,.56+i/250,(random()-.5)*.25],[.065,.055,.065],'gold');shrimp(.16,.7,.08,.6);garnish(.6,-.45);}
 else if(form==='monaka'){plate('cream',.85);cyl([0,.19,0],.58,.58,.15,'gold');for(let i=0;i<40;i++){let a=random()*6.28,d=Math.sqrt(random())*.5;ball([Math.cos(a)*d,.29+random()*.12,Math.sin(a)*d],[.07,.055,.08],'caramel',.32);}let lid=cyl([.2,.62,-.08],.58,.58,.12,'gold');lid.rotation.z=-.4;for(let i=0;i<5;i++)ball([.2+Math.cos(i*1.26)*.09,.72,-.08+Math.sin(i*1.26)*.09],[.06,.01,.04],'yellow');}
 else if(form==='tartare'){bowl('cream',.8,.45,.03);for(let i=0;i<35;i++)box([(random()-.5)*.9,.31+random()*.26,(random()-.5)*.9],[.15,.12,.14],'salmon');for(let i=0;i<15;i++)ball([(random()-.5)*.3,.65+random()*.1,(random()-.5)*.3],[.055,.055,.055],'gold',.18);garnish(.8);}
 else if(form==='shrimp-sushi'){plate();rice();shrimp(-.15,.43,-.03,1.5);garnish(.59);}
 else if(form==='carpaccio'){bowl('pink',.85,.4,.06);for(let i=0;i<9;i++){let a=i*6.28/9;let m=ball([Math.sin(a)*.36,.34,Math.cos(a)*.36],[.1,.05,.3],'pink',.32);m.rotation.y=a;}for(let i=0;i<17;i++)ball([(random()-.5)*.3,.4+random()*.12,(random()-.5)*.3],[.05,.05,.05],'gold',.2);shrimp(.4,.48,-.3,.7);}
 else if(form==='sushi-trio'||form==='premium-sushi'){sushi(['salmon','white','tuna'],3,form==='sushi-trio');if(form==='premium-sushi'){shrimp(-.1,.46,0,.8);for(let i=0;i<6;i++)ball([0,.55+i*.014,0],[.04,.04,.04],'gold');}}
 else if(form==='daifuku')mochi('pink','strawberry');
 else if(form==='cream-mochi')mochi('pink','strawberry');
 else if(form==='mango-mochi')mochi('white','mango');
 else if(form==='fruit-mochi')mochi('white','fruit');
 else if(form==='montblanc'){plate();lathe([[0,.14],[.5,.14],[.06,.9],[0,.9]],'cream');let pts=[];for(let i=0;i<400;i++){let p=i/399,a=p*6.28*8,r=.51*(1-p)+.06;pts.push([Math.cos(a)*r,.2+p*.7,Math.sin(a)*r]);}tube(pts,.045,'wood');chestnut(1.03);}
 else if(form==='peas'){bowl('cream',.8,.4,.06);for(let i=0;i<40;i++){let a=random()*6.28,r=Math.sqrt(random())*.58;ball([Math.cos(a)*r,.25+random()*.22,Math.sin(a)*r],[.09,.08,.09],'green');}ball([0,.59,0],[.12,.1,.12],'yellow');seeds(.49);}
 else if(form==='sleepy-bread'){plate('pink',1.05);ball([0,.4,0],[.6,.29,.61],'gold',.25);for(let side of [-1,1]){let e=ball([side*.53,.4,0],[.23,.18,.4],'gold',.25);e.rotation.y=side*.3;ball([side*.12,.7,.3],[.16,.05,.13],'cream');tube([[side*.2-.05,.72,.08],[side*.2,.74,.07],[side*.2+.05,.72,.08]],.025,'brown');}ball([0,.77,.25],[.055,.035,.045],'brown');}
 else if(form==='cheese-gratin'){plate('cream',1.2);bowl('cream',.72,.43,0);sauce('yellow',.4,.64);for(let i=0;i<60;i++){let a=random()*6.28,r=Math.sqrt(random())*.58;ball([Math.cos(a)*r,.43+random()*.04,Math.sin(a)*r],[.09,.035,.08],i%4?'yellow':'caramel',.25);}for(let side of [-1,1])ball([side*.75,.35,0],[.14,.05,.15],'cream').userData.vessel=true;for(let i=0;i<8;i++)ball([.7+random()*.2,.25+random()*.08,-.65+random()*.2],[.14,.05,.18],'green');for(let i=0;i<3;i++)ball([.7+i*.1,.35,-.5],[.09,.035,.09],i%2?'red':'yellow');garnish(.5);}
 else if(form==='puppy-pancakes'){plate('cream',1.15);for(let i=0;i<3;i++){cyl([0,.24+i*.23,0],.68,.68,.18,'gold');cyl([0,.335+i*.23,0],.65,.65,.014,'caramel',.4);if(i<2)for(let j=0;j<20;j++){let a=j*6.28/20;ball([Math.sin(a)*.56,.36+i*.23,Math.cos(a)*.56],[.1,.07,.1],'cream');}}ball([0,1,0],[.3,.24,.27],'gold');for(let side of [-1,1]){ball([side*.3,.96,0],[.12,.2,.16],'gold');ball([side*.1,1.04,.25],[.027,.027,.024],'brown');}ball([0,.98,.27],[.035,.03,.03],'brown');for(let i=0;i<4;i++)ball([0,1.22+i*.045,0],[.13-i*.03,.05,.13-i*.03],'cream');for(let i=0;i<5;i++){let a=i*6.28/5;for(let j=0;j<3;j++)ball([Math.cos(a)*.88,.2+j*.065,Math.sin(a)*.88],[.13-j*.035,.06,.13-j*.035],'cream');}}
 else throw Error('Missing recipe '+form);
}
const vesselWrap=fn=>(...args)=>{const start=scene.children.length,result=fn(...args);for(const mesh of scene.children.slice(start))mesh.userData.vessel=true;return result;};
plate=vesselWrap(plate);bowl=vesselWrap(bowl);cupGlass=vesselWrap(cupGlass);
for(const [id,d] of Object.entries(catalog.dishes)){if((parseInt(id)<=12&&id!=='12-strawberry-daifuku')||(process.argv.length>2&&!process.argv.slice(2).includes(id)))continue;scene=new T.Group();scene.name=d.name;seed=parseInt(id)*97;recipe(d.form);exportGLB(`${out}/${id}.glb`);
 console.log(id,fs.statSync(`${out}/${id}.glb`).size);
}
console.log('Food GLB generation complete.');
