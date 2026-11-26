const assert=require('node:assert/strict');
const ts=require('typescript');
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(require('fs').readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,file);
const {sampleStoolMove,stoolTop,stoolFoot}=require('../lib/chef-stool.ts');
const from={x:-1.5,y:.32,z:-1.8};
const near=(a,b)=>Object.keys(a).forEach(k=>assert(Math.abs(a[k]-b[k])<1e-8,`${k}: ${a[k]} != ${b[k]}`));
near(sampleStoolMove(from,0,true),from);
near(sampleStoolMove(from,1,true),stoolTop);
near(sampleStoolMove(stoolTop,0,false),stoolTop);
near(sampleStoolMove(stoolTop,1,false),stoolFoot);
for(const boundary of [.45,.72]){
 const a=sampleStoolMove(from,boundary-1e-7,true),b=sampleStoolMove(from,boundary+1e-7,true);
 for(const axis of ['x','y','z'])assert(Math.abs(a[axis]-b[axis])<1e-5,'Continuous step boundary');
}
assert(sampleStoolMove(stoolTop,.2,false).y>stoolTop.y,'Hop arcs upward before descending');
assert.equal(sampleStoolMove(stoolTop,.2,false,true).y<stoolTop.y,true,'Reduced motion omits hop arc');
const {PREP_STEP_MS,PREP_ENTRY_MS}=require('../lib/preparation.ts');
for(let scenes=1;scenes<=3;scenes++)assert(Math.abs((PREP_STEP_MS*scenes+PREP_ENTRY_MS)/(3200*scenes+800)-2/3)<1e-10);
console.log('PASS: continuous two-step climb, hop landing, reduced motion, and 2/3 cooking duration.');
