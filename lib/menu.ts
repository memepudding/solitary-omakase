import {EN_NAMES} from './locale';
import catalog from './food-catalog.json';
export const DISHES=catalog.dishes;
export type AssetDishKind=keyof typeof DISHES;
export type DishKind=AssetDishKind|'soup'|'rice'|'sushi'|'sorbet';
export type Course={name:string;note:string;kind:DishKind};
export type OrderMode='day'|'craving';
export const MENUS=catalog.menus as {id:string;name:string;keywords:string[];kinds:AssetDishKind[]}[];
export type MenuId=string;
export function isAssetDish(kind:string):kind is AssetDishKind{return Object.hasOwn(DISHES,kind);}
export function dishModel(kind:AssetDishKind){return `/foods/assets/${kind}.glb`;}
export function dishPoster(kind:AssetDishKind){return `/foods/posters/${kind}.png`;}
const EN_KEYWORDS=[['well done','worked hard'],['tired','sleepy','sleep','exhausted','drained'],['encouragement','cheer up','motivation'],['lonely','sad','depressed','breakup'],['go home','homesick','warm','cold'],['anxious','worried','mistake','nervous'],['rest','slow down','take a break'],['clear my mind','overthinking','confused'],['angry','annoyed','frustrated','stress'],['hurt','upset','disappointed'],['fresh start','start again','new beginning'],['bored','boring'],['focus','studying','deadline'],['quiet','peaceful','ordinary'],['weekend','leisure','relax','holiday'],['date','butterflies','crush'],['happy','joy','fun','lol'],['celebrate','birthday','passed','promotion','success'],['adventure','travel','something new'],['special','treat myself','reward'],['bread','gratin','pancakes','bakery','brunch']];
const normalize=(text:string)=>text.normalize('NFKC').toLowerCase().replace(/\s+/g,'');
function mentions(text:string,word:string){const w=normalize(word),index=text.indexOf(w);return index>=0&&!/(?:not|never|dont|don’t)$/.test(text.slice(Math.max(0,index-5),index))&&!/^(?:[가-힣]{0,3})(?:않|아니|싫|말고|빼|못먹)/.test(text.slice(index+w.length,index+w.length+7));}
function hash(text:string){let n=0;for(const c of text)n=(Math.imul(n,31)+c.charCodeAt(0))>>>0;return n;}
export function classifyMessage(mode:OrderMode,message:string,previous?:string){
 const text=normalize(message);
 const scores=MENUS.map((menu,index)=>{
  const exact=menu.kinds.filter(k=>mentions(text,DISHES[k].name)||mentions(text,EN_NAMES[parseInt(k)-1]));
  const food=exact.length?exact.reduce((sum,k)=>sum+100+normalize(DISHES[k].name).length,0):menu.kinds.reduce((sum,k)=>sum+DISHES[k].name.split(/[ ·]+/).filter(w=>w.length>=2&&!['다시','제철','3종','모둠','바삭한','프리미엄'].includes(w)&&mentions(text,w)).reduce((n,w)=>n+w.length,0),0);
  const matches=[...menu.keywords,...EN_KEYWORDS[index]].filter((w,i,all)=>all.findIndex(other=>normalize(other)===normalize(w))===i&&mentions(text,w));
  return {id:menu.id,food,mood:matches.reduce((n,w)=>n+normalize(w).length,0),matches,exact};
 });
 const maxFood=Math.max(...scores.map(s=>s.food)),maxMood=Math.max(...scores.map(s=>s.mood));
 const source=maxFood>0?'food':maxMood>0?'mood':'fallback';
 let candidates=scores.filter(s=>source==='food'?s.food===maxFood:source==='mood'?s.mood===maxMood:true);
 // Do not keep sending unknown statements or ambiguous cravings to the first menu.
 if(candidates.length>1&&previous)candidates=candidates.filter(s=>s.id!==previous);
 const chosen=candidates[hash(text)%candidates.length];
 return {id:chosen.id,source,mode,matches:source==='food'?(chosen.exact.length?chosen.exact.map(k=>DISHES[k].name):['음식 이름 또는 재료']):chosen.matches,scores};
}
export function selectMenuId(mode:OrderMode,message:string,previous?:string):MenuId{return classifyMessage(mode,message,previous).id;}
export function menuCourses(id:MenuId):Course[]{return (MENUS.find(m=>m.id===id)||MENUS[0]).kinds.map(kind=>({kind,name:DISHES[kind].name,note:DISHES[kind].note}));}
export function selectMenu(mode:OrderMode,message:string):Course[]{return menuCourses(selectMenuId(mode,message));}
