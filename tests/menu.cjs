const ts=require('typescript');
const fs=require('node:fs');
const assert=require('node:assert/strict');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,file);
const {EN_NAMES,EN_DESCRIPTIONS,detectLocale}=require('../lib/locale.ts');
assert.equal(EN_NAMES.length,63);assert.equal(EN_DESCRIPTIONS.length,63);
for(const [country,language,expected] of [['KR','en-US','ko'],['US','ko-KR','en'],['JP','ko','en'],['FR','fr','en'],[null,'ko-KR','ko'],[null,'en-US','en']])assert.equal(detectLocale(country,language),expected);
const {nextBite}=require('../lib/tasting.ts');assert.deepEqual([nextBite(0),nextBite(1),nextBite(2),nextBite(3)],[1,2,3,3]);
const {selectMenuId,selectMenu,MENUS,DISHES,dishModel,dishPoster}=require('../lib/menu.ts');
const {makeReceiptData,encodeReceipt,decodeReceipt,receiptCourses}=require('../lib/receipt-data.ts');
const samples=[
 ['I feel sleepy','restore'],['I want to go home','cozy'],['I am bored','bored'],['I am not tired, I am happy','happy'],['bread please','bakery'],['ㅋㅋㅋㅋ','happy'],['우울해','comfort'],['빡쳐','anger'],['수고했어','quiet'],['자고 싶다','restore'],['졸리다','restore'],['야근하고 지쳤어','restore'],
 ['기운 내','refresh'],['외로워','comfort'],['집에 가고 싶다','cozy'],['불안해','okay'],['쉬고 싶다','slow'],
 ['마음이 복잡해','clear'],['짜증나','anger'],['속상해','soothe'],['다시 시작','restart'],['심심하다','bored'],
 ['집중하고 싶다','focus'],['조용한 하루','quiet-day'],['느긋하게','leisure'],['두근두근','flutter'],['행복해','happy'],
 ['합격했어','celebrate'],['모험하고 싶어','adventure'],['특별한 하루','special'],
 ['피곤하지 않아 행복해','happy'],['졸리지 않아 행복해','happy'],['초밥 말고 장어','restore']
];
assert.equal(MENUS.length,21);assert.equal(Object.keys(DISHES).length,63);
assert.equal(new Set(MENUS.flatMap(m=>m.kinds)).size,63);
for(const menu of MENUS)for(const kind of menu.kinds){assert.equal(selectMenuId('craving',DISHES[kind].name),menu.id,DISHES[kind].name);assert.equal(selectMenuId('craving',EN_NAMES[parseInt(kind)-1]),menu.id,EN_NAMES[parseInt(kind)-1]);}
const unknown=['아무거나','음','잘 모르겠어','오늘은 음','생각나는 게 없어'];
assert(new Set(unknown.map(m=>selectMenuId('day',m))).size>1);
for(const m of unknown){const first=selectMenuId('day',m);assert.notEqual(selectMenuId('day',m,first),first);}
for(const [message,id] of samples)for(const mode of ['day','craving'])assert.equal(selectMenuId(mode,message),id,message);
for(const menu of MENUS){
 const message='오늘의 쪽지 🍣 '.repeat(20).slice(0,240);
 const courses=menu.kinds.map(kind=>({kind,...DISHES[kind]}));
 for(const include of [true,false]){
  const data=makeReceiptData(courses,message,include,'2026-11-09T00:00:00.000Z');
  assert.deepEqual(decodeReceipt(encodeReceipt(data)),data);
  assert.deepEqual(receiptCourses(data).map(c=>c.name),courses.map(c=>c.name));
 }
 for(const kind of menu.kinds){
  const buffer=fs.readFileSync(`public${dishModel(kind)}`);
  assert.equal(buffer.toString('ascii',0,4),'glTF');assert.equal(buffer.readUInt32LE(4),2);assert.equal(buffer.readUInt32LE(8),buffer.length);
  const json=JSON.parse(buffer.toString('utf8',20,20+buffer.readUInt32LE(12)));
  assert(json.meshes.length>0);assert(json.accessors.some(a=>a.type==='VEC3'&&a.count>0));
  assert((json.images||[]).every(image=>image.bufferView!==undefined),'embedded textures');
  assert(fs.existsSync(`public${dishPoster(kind)}`));
 }
}
const legacy={v:1,m:'예전 주문',k:['soup','sushi','sorbet'],d:'2026-11-08T00:00:00Z'};
assert.deepEqual(decodeReceipt(encodeReceipt(legacy)),legacy);
assert.throws(()=>decodeReceipt(encodeReceipt({...legacy,k:['01-chawanmushi','05-unagi-rice','09-lemon-sorbet']})));
assert.throws(()=>decodeReceipt('invalid'));
console.log('PASS: 21 courses, 63 assets, Korean and English classification, receipts and legacy QR compatibility.');
