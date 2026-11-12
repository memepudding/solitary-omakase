// Exercise real server-rendered responses with Vercel country headers.
const assert=require('node:assert/strict');
(async()=>{
 const cases=[['KR','en-US',null,'ko'],['US','ko-KR',null,'en'],['JP','ja',null,'en'],['FR','fr',null,'en'],[null,'ko-KR',null,'ko'],[null,'en-US',null,'en'],['US','en-US','teepu-lang=ko','ko'],['KR','ko-KR','teepu-lang=en','en']];
 for(const [country,language,cookie,expected] of cases){
  const headers={'accept-language':language};if(country)headers['x-vercel-ip-country']=country;if(cookie)headers.cookie=cookie;
  const response=await fetch('http://127.0.0.1:3000/',{headers});assert.equal(response.status,200);
  const html=await response.text();assert(html.includes(`<html lang="${expected}"`),JSON.stringify({country,language,cookie,expected}));
  assert(html.includes(expected==='ko'?'네, 들어갈게요':'Yes, I’ll come in'));
  assert(!/s-maxage/.test(response.headers.get('cache-control')||''),'Do not share a country-specific page in a public cache');
 }
 console.log('PASS: 8 HTTP country / browser-language / manual-preference combinations. Simulated country headers, not an overseas VPN.');
})().catch(e=>{console.error(e);process.exitCode=1;});
