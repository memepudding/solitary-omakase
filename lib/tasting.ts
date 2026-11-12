export const BITES_PER_DISH=3;
export const DISH_ROTATION_SECONDS=12;
export const CLEARING_MS=850;
export function nextBite(current:number){return Math.min(BITES_PER_DISH,Math.max(0,current)+1);}
