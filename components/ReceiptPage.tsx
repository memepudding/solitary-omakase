'use client';
import {useEffect,useMemo,useState} from 'react';
import Receipt from './Receipt';
import {decodeReceipt,receiptCourses,type ReceiptData} from '@/lib/receipt-data';
import {downloadReceipt} from '@/lib/receipt';
import {useLanguage} from './Language';
export default function ReceiptPage(){
 const {locale,t}=useLanguage();const [data,setData]=useState<ReceiptData|null>(null),[error,setError]=useState(false),[saving,setSaving]=useState(false),[status,setStatus]=useState('');
 useEffect(()=>{const load=()=>{try{setData(decodeReceipt(location.hash));setError(false);}catch{setData(null);setError(true);}};load();addEventListener('hashchange',load);return()=>removeEventListener('hashchange',load);},[]);
 const courses=useMemo(()=>data?receiptCourses(data):[],[data]);
 async function save(){if(!data)return;setSaving(true);try{await downloadReceipt(courses,data.m,true,data.d,locale);setStatus(t('영수증 PNG를 저장했어요.','Receipt PNG saved.'));}catch{setStatus(t('다시 시도해 주세요.','Please try again.'));}finally{setSaving(false);}}
 return <main className="saved-receipt-page"><header><a href="/">← {t('고독한 오마카세','Solitary Omakase')}</a><h1>{t('당신의 한 끼, 그대로.','Your meal, a little keepsake.')}</h1><p>{t('이날의 주문과 세 접시를 이미지로 간직하세요.','Keep your note and three dishes as an image.')}</p></header>{error?<section className="receipt-error" role="alert">{t('영수증 주소를 다시 확인해 주세요.','Please check your receipt link.')}</section>:!data?<p role="status">{t('영수증을 펼치는 중…','Opening your receipt…')}</p>:<><div className="saved-receipt-sheet"><Receipt courses={courses} message={data.m} includeNote={true} issuedAt={data.d}/></div><div className="saved-receipt-toolbar"><button disabled={saving} onClick={save}>{saving?t('저장 중…','Saving…'):t('영수증 PNG 저장','Save receipt PNG')} ↓</button><p role="status">{status}</p></div></>}</main>;
}
