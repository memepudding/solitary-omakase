const assert=require('node:assert/strict'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(require('fs').readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,f);
const {speechSentences}=require('../lib/speech.ts');
assert.deepEqual(speechSentences('혼자 오면 조용해서 좋아요. 아, 같이 조용히 있어도… 괜찮고요.'),['혼자 오면 조용해서 좋아요.','아, 같이 조용히 있어도… 괜찮고요.']);
assert.deepEqual(speechSentences('…안녕하세요. 여기 푸딩이 맛있어서요.'),['…안녕하세요.','여기 푸딩이 맛있어서요.']);
assert.deepEqual(speechSentences('조금 쉬어가세요! 따뜻하게 준비했어요.'),['조금 쉬어가세요!','따뜻하게 준비했어요.']);
assert.deepEqual(speechSentences('Though… being quiet together is nice too.'),['Though… being quiet together is nice too.']);
assert.deepEqual(speechSentences(''),[]);
console.log('PASS: Korean sentences, hesitation and comma preservation, English, empty speech.');
