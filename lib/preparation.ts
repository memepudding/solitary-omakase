import plans from './preparation.json';
import type {DishKind} from './menu';
export type PrepAction='slice'|'mix'|'simmer'|'shape'|'sear'|'rice'|'pour'|'roll'|'plate'|'garnish';
export type PrepStep={action:PrepAction;ko:string;en:string};
export const PREP_STEP_MS=3200*2/3;
export const PREP_ENTRY_MS=800*2/3;
export function preparationFor(kind:DishKind):PrepStep[]{
 return (plans[kind as keyof typeof plans]||[{action:'garnish',ko:'마지막 장식을 더해요',en:'Add the finishing touch'}]) as PrepStep[];
}
