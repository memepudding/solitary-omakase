const assert=require('node:assert/strict');
const plans=require('../lib/preparation.json');
const actions=new Set(['slice','mix','simmer','shape','sear','rice','pour','roll','plate','garnish']);
assert.equal(Object.keys(plans).length,63);
for(const [kind,steps] of Object.entries(plans)){
 assert(steps.length>=1&&steps.length<=3,kind);
 if(parseInt(kind)%3===0)assert.equal(steps.length,1,kind);
 for(const step of steps){assert(actions.has(step.action),kind);assert(step.ko.trim()&&step.en.trim(),kind);}
}
console.log('PASS: 63 preparation plans, 1–3 scenes each, all 21 desserts one scene, bilingual captions.');
