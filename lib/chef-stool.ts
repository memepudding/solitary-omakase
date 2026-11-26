import {COOK_STATION} from './staging';
export type ChefPoint={x:number;y:number;z:number};
export const CHEF_FLOOR_Y=.32;
export const CHEF_STEP_Y=.72;
export const CLIMB_SECONDS=1.8;
export const HOP_SECONDS=.7;
const ease=(p:number)=>p*p*(3-2*p);
const blend=(a:ChefPoint,b:ChefPoint,p:number,arc=0):ChefPoint=>({x:a.x+(b.x-a.x)*ease(p),y:a.y+(b.y-a.y)*ease(p)+Math.sin(Math.PI*p)*arc,z:a.z+(b.z-a.z)*ease(p)});
export const stoolTop:ChefPoint={x:COOK_STATION.chefX,y:COOK_STATION.chefY,z:COOK_STATION.chefZ};
export const stoolFoot:ChefPoint={x:COOK_STATION.chefX,y:CHEF_FLOOR_Y,z:COOK_STATION.chefZ-.9};
export function sampleStoolMove(from:ChefPoint,progress:number,up:boolean,reducedMotion=false):ChefPoint{
 const p=Math.max(0,Math.min(1,progress));
 if(!up)return blend(from,stoolFoot,p,reducedMotion?0:.3);
 const step={x:stoolTop.x,y:CHEF_STEP_Y,z:stoolTop.z-.4};
 if(p<.45)return blend(from,stoolFoot,p/.45);
 if(p<.72)return blend(stoolFoot,step,(p-.45)/.27,reducedMotion?0:.07);
 return blend(step,stoolTop,(p-.72)/.28,reducedMotion?0:.07);
}
