'use client';
import {useState} from 'react';
import dynamic from 'next/dynamic';
import {classifyMessage,MENUS,DISHES,dishPoster,type AssetDishKind} from '@/lib/menu';
import {EN_MENU,dishName} from '@/lib/locale';
import {useLanguage} from '@/components/Language';
const FoodPreview=dynamic(()=>import('@/components/FoodPreview'),{ssr:false});
export default function MenuGuide(){
 const {locale,setLocale,t}=useLanguage();const [message,setMessage]=useState(''),[preview,setPreview]=useState<AssetDishKind>('61-sleepy-bread');
 const result=classifyMessage('day',message),index=MENUS.findIndex(m=>m.id===result.id),selected=MENUS[index];
 const name=(k:AssetDishKind)=>dishName(k,DISHES[k].name,locale);
 return <main className="menu-guide"><a href="/">← {t('식당으로','Back to the restaurant')}</a><button className="language-guide" onClick={()=>setLocale(locale==='ko'?'en':'ko')}>{locale==='ko'?'English':'한국어'}</button><p className="guide-eyebrow">TEEPU · 21 COURSES / 63 DISHES</p><h1>{t('한 줄이 세 접시가 되는 기준','One little note, three little dishes')}</h1><p>{t('아래에서 실제 선택 결과와 모든 입체 음식을 확인할 수 있어요.','Try a note below and explore every dish in 3D.')}</p>
 <section className="guide-test"><label htmlFor="classify">{t('문장을 적어 확인하기','Try your note')}</label><textarea id="classify" maxLength={240} value={message} onChange={e=>setMessage(e.target.value)} placeholder={t('예: 집에 가고 싶다','For example: I feel sleepy')}/><div aria-live="polite"><strong>{locale==='ko'?selected.name:EN_MENU[index]}</strong><p>{result.source==='fallback'?t('일치하는 표현이 없어 문장에 따라 코스를 골랐어요.','No matching expression: choosing a course from your note.'):locale==='ko'?`인식한 표현: ${result.matches.join(' · ')}`:`Selected by ${result.source==='food'?'your food request':'your mood'}.`}</p><p>{selected.kinds.map(name).join(' → ')}</p></div></section>
 <section className="food-preview-section" id="food-preview"><h2>{name(preview)}</h2><div className="food-preview-canvas"><FoodPreview kind={preview}/></div><p>{t('드래그해서 돌려보세요. 식당에서 나오는 것과 같은 3D 음식이에요.','Drag to rotate. These are the same 3D dishes served in the restaurant.')}</p></section>
 <div className="guide-grid">{MENUS.map((menu,i)=><section key={menu.id}><p className="guide-eyebrow">{String(i+1).padStart(2,'0')}</p><h2>{locale==='ko'?menu.name:EN_MENU[i]}</h2>{locale==='ko'&&<p>{menu.keywords.slice(0,6).join(' · ')}</p>}<div className="guide-dishes">{menu.kinds.map(k=><button key={k} aria-pressed={preview===k} onClick={()=>{setPreview(k);document.getElementById('food-preview')?.scrollIntoView({behavior:'smooth',block:'center'});}}><img src={dishPoster(k)} alt="" loading="lazy"/><span>{name(k)}</span></button>)}</div></section>)}</div><p>{t('문구 규칙으로 선택하며 복잡한 문맥은 놓칠 수 있어요. 원하는 코스는 주문지에서 직접 고를 수 있어요.','Selection uses phrase rules and may miss complex context. You can always choose a course on your order note.')}</p></main>;
}
