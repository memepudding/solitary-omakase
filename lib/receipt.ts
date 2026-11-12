import {dishName,dishDescription,type Locale} from './locale';
import QRCode from 'qrcode';
import { dishPoster, isAssetDish, type Course, type DishKind } from './menu';
import { FOOD_DETAILS, RECEIPT_PRICE, makeReceiptData, receiptURL } from './receipt-data';

function wrap(ctx:CanvasRenderingContext2D,text:string,width:number):string[] {
  const lines:string[]=[];let line='';
  for(const char of text){
    if(char==='\n'){lines.push(line);line='';continue;}
    if(ctx.measureText(line+char).width>width){lines.push(line);line=char;}else line+=char;
  }
  lines.push(line);return lines;
}
function dishIcon(ctx:CanvasRenderingContext2D,kind:DishKind,x:number,y:number){
  ctx.save();ctx.translate(x,y);ctx.lineWidth=1.7;ctx.strokeStyle='#555246';
  ctx.fillStyle='#ddd6c5';ctx.beginPath();ctx.ellipse(0,19,51,10,0,0,Math.PI*2);ctx.fill();
  if(isAssetDish(kind)){
    const ellipse=(x:number,y:number,rx:number,ry:number,color:string)=>{ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();ctx.stroke();};
    const bowl=(color:string)=>{ctx.fillStyle='#ad785a';ctx.beginPath();ctx.ellipse(0,3,38,25,0,0,Math.PI);ctx.fill();ctx.stroke();ellipse(0,3,38,12,color);};
    if(kind==='02-aburi-salmon'){
      ellipse(0,8,33,13,'#f8ebce');ellipse(0,0,38,13,'#e5a078');ctx.strokeStyle='#fbe1bb';for(const x of [-20,-5,10]){ctx.beginPath();ctx.moveTo(x,-9);ctx.lineTo(x+9,9);ctx.stroke();}
    }else if(kind==='08-tempura-roll'){
      for(const x of [-23,0,23]){ellipse(x,4,14,17,'#ebd8af');ellipse(x,4,10,12,'#52614b');ellipse(x,4,6,7,'#e7a36b');}
    }else if(kind==='06-sesame-mochi'||kind==='12-strawberry-daifuku'){
      ellipse(0,1,31,25,kind==='06-sesame-mochi'?'#a89a89':'#e6abb0');
      if(kind==='12-strawberry-daifuku'){ellipse(3,4,14,17,'#f9e8ca');ellipse(3,6,9,12,'#ce6867');}else{ctx.fillStyle='#625b52';for(let i=0;i<20;i++)ctx.fillRect(Math.sin(i*7)*22,Math.cos(i*4)*17,1.5,1.5);}
    }else if(kind==='09-lemon-sorbet'){
      bowl('#e5dfca');ellipse(0,-8,29,27,'#edce70');
    }else if(kind==='07-yuzu-radish'){
      for(const x of [-22,0,22]){ctx.fillStyle='#f5e5b7';ctx.fillRect(x-10,-12,19,30);ctx.strokeRect(x-10,-12,19,30);ellipse(x,-12,9.5,4,'#fff0c9');}
    }else if(kind==='03-hojicha-pudding'){
      ctx.fillStyle='#d7a069';ctx.beginPath();ctx.moveTo(-21,-20);ctx.lineTo(21,-20);ctx.lineTo(30,18);ctx.lineTo(-30,18);ctx.closePath();ctx.fill();ctx.stroke();ellipse(0,-20,21,6,'#805044');
    }else if(kind==='01-chawanmushi'||kind==='10-pumpkin-custard'){
      ctx.fillStyle=kind==='01-chawanmushi'?'#f0d6ad':'#e9b369';ctx.fillRect(-27,-20,54,43);ctx.strokeRect(-27,-20,54,43);ellipse(0,-20,27,8,'#f4cb87');ellipse(0,-21,7,4,'#79965f');
    }else{
      bowl(kind==='04-mushroom-dashi'?'#c29c7c':'#efdfbd');
      if(kind==='04-mushroom-dashi'){for(const x of [-18,0,18])ellipse(x,0,9,5,'#f1dcb2');}
      if(kind==='05-unagi-rice'){for(const x of [-17,5]){ctx.fillStyle='#985a3b';ctx.fillRect(x,-6,15,15);ctx.strokeRect(x,-6,15,15);}}
      if(kind==='11-salmon-ochazuke'){ctx.fillStyle='#d78d7b';for(const x of [-23,0,20])ctx.fillRect(x,-3,12,8);}
    }
    ctx.restore();return;
  }
  if(kind==='sushi'){
    for(const dx of [-22,22]){
      ctx.fillStyle='#fbf5e4';ctx.beginPath();ctx.ellipse(dx,8,21,12,-.15,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.fillStyle='#d68e6d';ctx.beginPath();ctx.ellipse(dx,0,24,9,-.15,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.strokeStyle='#f8d7b0';for(const z of [-10,0,10]){ctx.beginPath();ctx.moveTo(dx+z-4,-6);ctx.lineTo(dx+z+3,6);ctx.stroke();}ctx.strokeStyle='#555246';
    }
  }else{
    ctx.fillStyle='#a7aa8f';ctx.beginPath();ctx.ellipse(0,6,40,23,0,0,Math.PI);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle=kind==='soup'?'#cba261':kind==='rice'?'#eee1ba':'#e8ab58';
    ctx.beginPath();ctx.ellipse(0,5,39,kind==='sorbet'?25:11,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    if(kind==='rice'){ctx.fillStyle='#8b7152';for(const dx of [-19,0,19]){ctx.beginPath();ctx.ellipse(dx,3,8,4,-.4,0,Math.PI*2);ctx.fill();}}
    ctx.fillStyle='#7e8e59';ctx.beginPath();ctx.ellipse(6,kind==='sorbet'?-18:0,9,3,-.5,0,Math.PI*2);ctx.fill();
    if(kind==='soup'){ctx.strokeStyle='#9b927c';for(const dx of [-13,0,13]){ctx.beginPath();ctx.moveTo(dx,-13);ctx.bezierCurveTo(dx-6,-20,dx+6,-23,dx,-30);ctx.stroke();}}
  }
  ctx.restore();
}

export async function createReceiptCanvas(courses:Course[],message='',includeNote=true,issuedAt=new Date().toISOString(),locale:Locale='ko'){
  await document.fonts.ready;
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
  if(!ctx)throw new Error('이미지 저장을 지원하지 않는 브라우저예요.');
  const font='"Noto Sans KR", Arial, sans-serif',ink='#20211b',paper='#f2ecdf';
  ctx.font=`17px ${font}`;
  const noteLines=wrap(ctx,includeNote?message:'(주문 메시지 제외)',536);
  const rows=courses.map(c=>({name:dishName(c.kind,c.name,locale),lines:wrap(ctx,dishDescription(c.kind,FOOD_DETAILS[c.kind].description,locale),536)}));
  const qr=QRCode.create(receiptURL(makeReceiptData(courses,message,includeNote,issuedAt),window.location.origin),{errorCorrectionLevel:'M'});
  const moduleScale=Math.max(2,Math.floor(150/(qr.modules.size+8))),qrSize=(qr.modules.size+8)*moduleScale;
  const height=740+noteLines.length*27+rows.reduce((n,r)=>n+48+r.lines.length*26,0)+qrSize;
  canvas.width=1280;canvas.height=height*2;ctx.scale(2,2);
  // The cut edge is part of the PNG, including transparent notches.
  ctx.save();ctx.beginPath();ctx.moveTo(0,12);
  for(let x=0;x<640;x+=16){ctx.lineTo(x+8,4);ctx.lineTo(Math.min(x+16,640),12);}
  ctx.lineTo(640,height-12);
  for(let x=640;x>0;x-=16){ctx.lineTo(x-8,height-4);ctx.lineTo(Math.max(x-16,0),height-12);}
  ctx.closePath();ctx.clip();ctx.fillStyle=paper;ctx.fillRect(0,0,640,height);
  ctx.fillStyle=ink;ctx.textBaseline='top';ctx.textAlign='left';
  ctx.font='900 75px Impact, "Arial Black", sans-serif';
  ctx.textAlign='center';ctx.fillText('SOLITARY',320,43,544);ctx.fillText('OMAKASE',320,120,544);ctx.textAlign='left';
  const illustrations=await Promise.all(courses.map(course=>new Promise<HTMLImageElement|null>(resolve=>{
    if(!isAssetDish(course.kind)){resolve(null);return;}const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=dishPoster(course.kind);
  })));
  courses.forEach((course,i)=>{
    const img=illustrations[i];
    // New recipes use miniatures rendered from their real geometry; legacy dishes retain line drawings.
    if(img&&isAssetDish(course.kind)&&parseInt(course.kind)>12){const w=130,h=130*img.height/img.width;ctx.drawImage(img,78+i*176,211+(106-h)/2,w,h);}else dishIcon(ctx,course.kind,143+i*176,262);
  });
  ctx.fillStyle=ink;ctx.font=`13px ${font}`;
  ctx.fillText(`ORDER ${issuedAt.replace(/\D/g,'').slice(2,14)}`,48,330);
  ctx.fillText(new Date(issuedAt).toLocaleString(locale==='ko'?'ko-KR':'en-US',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}),48,352);
  const rule=(y:number)=>{ctx.save();ctx.strokeStyle='#8e897c';ctx.lineWidth=.8;ctx.setLineDash([4,6]);ctx.beginPath();ctx.moveTo(48,y);ctx.lineTo(592,y);ctx.stroke();ctx.restore();};
  let y=395;rule(y);y+=25;
  ctx.font=`500 14px ${font}`;ctx.fillText(locale==='ko'?'요청한 주문 / REQUESTED ORDER':'REQUESTED ORDER',48,y);y+=29;
  ctx.font=`17px ${font}`;noteLines.forEach(line=>{ctx.fillText(line,48,y);y+=27;});
  y+=20;rule(y);y+=26;
  ctx.font=`500 14px ${font}`;ctx.fillText(locale==='ko'?'음식 코스 / THE COURSES':'THE COURSES',48,y);y+=35;
  rows.forEach((row,i)=>{
    ctx.font=`500 18px ${font}`;ctx.fillText(`0${i+1}  ${row.name}`,48,y);y+=29;
    ctx.font=`16px ${font}`;row.lines.forEach(line=>{ctx.fillText(line,48,y);y+=26;});y+=19;
  });
  rule(y);y+=25;ctx.font=`500 27px ${font}`;ctx.fillText('TOTAL',48,y);ctx.textAlign='right';ctx.fillText(RECEIPT_PRICE,592,y);ctx.textAlign='left';y+=67;
  ctx.font=`13px ${font}`;ctx.fillText('MADE JUST FOR YOU.',48,y);ctx.fillText('THANK YOU FOR DINING WITH YOURSELF.',48,y+22);y+=67;
  const qrX=48;ctx.fillStyle='#fff';ctx.fillRect(qrX,y,qrSize,qrSize);ctx.fillStyle='#000';
  for(let row=0;row<qr.modules.size;row++)for(let col=0;col<qr.modules.size;col++)if(qr.modules.get(row,col))ctx.fillRect(qrX+(col+4)*moduleScale,y+(row+4)*moduleScale,moduleScale,moduleScale);
  ctx.fillStyle=ink;ctx.font=`13px ${font}`;ctx.fillText('SCAN & KEEP',qrX+qrSize+22,y+qrSize/2-20);ctx.fillText(locale==='ko'?'오늘의 영수증 저장':'Save your receipt',qrX+qrSize+22,y+qrSize/2+5);
  ctx.restore();return canvas;
}

export async function downloadReceipt(courses:Course[],message:string,includeNote:boolean,issuedAt?:string,locale:Locale='ko'){
  const canvas=await createReceiptCanvas(courses,message,includeNote,issuedAt,locale);
  const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/png'));
  if(!blob)throw new Error('영수증을 저장하지 못했어요. 다시 시도해 주세요.');
  const url=URL.createObjectURL(blob);const link=document.createElement('a');
  link.href=url;link.download='solitary-omakase-receipt.png';link.click();
  setTimeout(()=>URL.revokeObjectURL(url),10000);
}
