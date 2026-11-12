import { DISHES, MENUS, type Course, type DishKind } from './menu';

export const RECEIPT_PRICE = '$1.50';
export const FOOD_DETAILS: Record<DishKind, { name: string; description: string }> = {
  ...DISHES,
  soup: { name: '따뜻한 밤 수프', description: '고소한 밤을 부드럽게 끓여 따뜻하게 내어드리는 수프.' },
  rice: { name: '노릇한 버섯 솥밥', description: '노릇하게 구운 버섯을 올려 포근하게 지은 솥밥.' },
  sushi: { name: '작은 바다 초밥', description: '부드러운 연어와 은은하게 간한 밥으로 만든 작은 초밥.' },
  sorbet: { name: '작은 귤 셔벗', description: '식사의 끝을 산뜻하게 마무리하는 상큼한 귤 셔벗.' },
};
export type ReceiptData = { v: 1; m: string; k: DishKind[]; d: string };
export function makeReceiptData(courses: Course[], message: string, includeNote: boolean, date: string): ReceiptData {
  return { v:1, m:includeNote ? message.slice(0,240) : '', k:courses.map(c=>c.kind), d:date };
}
export function encodeReceipt(data: ReceiptData): string {
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  return btoa(Array.from(bytes, byte=>String.fromCharCode(byte)).join('')).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
export function decodeReceipt(hash: string): ReceiptData {
  const value=hash.replace(/^#/,'');
  if(!value || value.length>2400 || !/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('영수증 주소가 올바르지 않아요.');
  try {
    const binary=atob(value.replace(/-/g,'+').replace(/_/g,'/'));
    const data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(binary,c=>c.charCodeAt(0))));
    if(data.v!==1 || typeof data.m!=='string' || data.m.length>240 || !Array.isArray(data.k) || data.k.length!==3 || !(data.k[0]==='soup' && ['rice','sushi'].includes(data.k[1]) && data.k[2]==='sorbet' || MENUS.some(menu=>menu.kinds.every((kind,i)=>kind===data.k[i]))) || typeof data.d!=='string' || !/^\d{4}-\d{2}-\d{2}T/.test(data.d) || !Number.isFinite(Date.parse(data.d))) throw new Error();
    return {v:1,m:data.m,k:data.k,d:data.d};
  } catch { throw new Error('영수증을 읽을 수 없어요. 원래 영수증의 QR을 다시 스캔해 주세요.'); }
}
export function receiptURL(data: ReceiptData, origin: string): string {
  const url = new URL('/receipt',origin);
  // The fragment stays out of server request logs; no server storage is needed.
  url.hash=encodeReceipt(data);return url.toString();
}
export function receiptCourses(data: ReceiptData): Course[] {
  return data.k.map(kind=>({kind,name:FOOD_DETAILS[kind].name,note:FOOD_DETAILS[kind].description}));
}
