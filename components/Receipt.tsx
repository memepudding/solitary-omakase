'use client';
import {useEffect,useRef,useState} from 'react';
import type {Course} from '@/lib/menu';
import {createReceiptCanvas} from '@/lib/receipt';
import {useLanguage} from './Language';
import {dishName} from '@/lib/locale';
export default function Receipt({courses,message,includeNote,issuedAt}:{courses:Course[];message:string;includeNote:boolean;issuedAt:string}){
 const ref=useRef<HTMLCanvasElement>(null),[error,setError]=useState(false);const {locale,t}=useLanguage();
 useEffect(()=>{let cancelled=false;createReceiptCanvas(courses,message,includeNote,issuedAt,locale).then(canvas=>{if(cancelled||!ref.current)return;ref.current.width=canvas.width;ref.current.height=canvas.height;ref.current.getContext('2d')?.drawImage(canvas,0,0);setError(false);}).catch(()=>{if(!cancelled)setError(true);});return()=>{cancelled=true;};},[courses,message,includeNote,issuedAt,locale]);
 return <><canvas ref={ref} className="receipt-preview" role="img" aria-label={`SOLITARY OMAKASE. ${message}. ${courses.map(c=>dishName(c.kind,c.name,locale)).join(', ')}. $1.50. QR.`}/>{error&&<p role="status">{t('영수증을 불러오지 못했어요. 저장 버튼으로 다시 시도해 주세요.','Could not load the receipt. Please try the save button.')}</p>}</>;
}
