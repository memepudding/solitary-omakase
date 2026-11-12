export type ChefAction='chop'|'walk'|'wash'|'drawer'|'stir'|'serve'|'rest';
type Point=[number,number];
type Stop={duration:number;action:ChefAction;from:Point;to:Point;facing:number};
const prep:Point=[0,-.25],sink:Point=[-2.3,-2.55],drawer:Point=[.9,-2.25],stove:Point=[2.3,-.8];
const stops:Stop[]=[
  {duration:7,action:'chop',from:prep,to:prep,facing:0},
  {duration:4,action:'walk',from:prep,to:sink,facing:Math.PI},
  {duration:6,action:'wash',from:sink,to:sink,facing:Math.PI},
  {duration:3,action:'walk',from:sink,to:drawer,facing:Math.PI},
  {duration:5,action:'drawer',from:drawer,to:drawer,facing:Math.PI},
  {duration:3,action:'walk',from:drawer,to:stove,facing:Math.PI/2},
  {duration:6,action:'stir',from:stove,to:stove,facing:Math.PI/2},
  {duration:3,action:'walk',from:stove,to:prep,facing:0},
  {duration:4,action:'serve',from:prep,to:prep,facing:0},
  {duration:3,action:'rest',from:prep,to:prep,facing:0},
];
export const CHEF_CYCLE_SECONDS=stops.reduce((sum,stop)=>sum+stop.duration,0);
// Conservative body envelope, including ears, stays inside the counter opening.
export const CHEF_BOUNDS={minX:-3.25,maxX:3.25,minZ:-3.425,maxZ:.65,radius:.85};
export const CHEF_LABELS:Record<ChefAction,string>={chop:'재료를 썰고 있어요',walk:'종종걸음으로 이동 중',wash:'싱크대에서 씻는 중',drawer:'서랍에서 도구를 꺼내요',stir:'냄비를 천천히 저어요',serve:'접시를 가지런히 놓아요',rest:'잠깐, 숨을 고르는 중'};
const ease=(p:number)=>p*p*(3-2*p);
function blendAngle(a:number,b:number,p:number){const d=Math.atan2(Math.sin(b-a),Math.cos(b-a));return a+d*p;}
export function sampleChefRoutine(seconds:number,reducedMotion=false){
  let t=reducedMotion?0:((seconds%CHEF_CYCLE_SECONDS)+CHEF_CYCLE_SECONDS)%CHEF_CYCLE_SECONDS;
  let index=0;
  while(index<stops.length-1&&t>=stops[index].duration){t-=stops[index].duration;index++;}
  const step=stops[index],p=t/step.duration,travel=ease(p);
  let yaw=step.facing;
  if(step.action==='walk'){
    const direction=Math.atan2(step.to[0]-step.from[0],step.to[1]-step.from[1]);
    const previous=stops[(index+stops.length-1)%stops.length].facing;
    yaw=p<.18?blendAngle(previous,direction,ease(p/.18)):p>.8?blendAngle(direction,step.facing,ease((p-.8)/.2)):direction;
  }
  const openness=step.action==='drawer'?Math.max(0,Math.min(1,t/.9,(step.duration-t)/.9)):0;
  return {action:step.action,index,progress:p,time:t,x:step.from[0]+(step.to[0]-step.from[0])*travel,z:step.from[1]+(step.to[1]-step.from[1])*travel,yaw,drawerOpen:ease(openness),carrying:index===5||(step.action==='drawer'&&p>.5),moving:step.action==='walk'};
}
