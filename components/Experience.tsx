'use client';
import dynamic from 'next/dynamic';
import {Component,useCallback,useEffect,useMemo,useRef,useState,type ReactNode} from 'react';
import {menuCourses,selectMenuId,MENUS} from '@/lib/menu';
import {FOOD_DETAILS} from '@/lib/receipt-data';
import {dishName,dishDescription,EN_MENU} from '@/lib/locale';
import {useLanguage} from './Language';
import {downloadReceipt} from '@/lib/receipt';
import Receipt from './Receipt';
import BackgroundMusic from './BackgroundMusic';
import {SEATING_MS,THINKING_MS,SERVING_MS,type ChefMode} from '@/lib/staging';
import {nextBite,CLEARING_MS} from '@/lib/tasting';
const Restaurant=dynamic(()=>import('./Restaurant'),{ssr:false});
type Stage='outside'|'walking'|'note'|'seating'|'thinking'|'serving'|'course'|'clearing'|'tea';
class SceneBoundary extends Component<{children:ReactNode;onFailure:()=>void},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return{failed:true};}componentDidCatch(){this.props.onFailure();}render(){return this.state.failed?null:this.props.children;}}
function Arrow(){return <span aria-hidden="true">→</span>;}
const GUEST_LINES=[
 ['…안녕하세요. 여기 푸딩이 맛있어서요. 세 번째 왔어요.','…Hello. The pudding is lovely here. This is my third visit.'],
 ['혼자 오면 조용해서 좋아요. 아, 같이 조용히 있어도… 괜찮고요.','I like how quiet it is alone. Though… being quiet together is nice too.'],
 ['눈썹 때문에 화난 줄 아시는데… 사실 낯을 조금 가려요.','People think I look cross because of my eyebrows… I’m just a little shy.'],
 ['티푸가 푸딩을 흔들지 않고 가져와요. 저는 인사하다가 제가 흔들려요.','Teepu carries pudding without a wobble. I’m the one who wobbles when saying hello.'],
 ['…말 걸어주셔서 고마워요. 다음에 오시면, 옆자리 비워둘게요.','…Thank you for saying hello. Next time, I’ll save you the seat beside me.'],
];
export default function Experience(){
 const {locale,setLocale,t}=useLanguage();
 const [stage,setStage]=useState<Stage>('outside'),[mode,setMode]=useState<'day'|'course'>('day'),[message,setMessage]=useState('');
 const [course,setCourse]=useState(0),[bites,setBites]=useState(0),[inspect,setInspect]=useState(false),[webgl,setWebgl]=useState<boolean|null>(null),[reducedMotion,setReducedMotion]=useState(false);
 const [saving,setSaving]=useState(false),[notice,setNotice]=useState(''),[sound,setSound]=useState(true),[waiting,setWaiting]=useState(false),[issuedAt,setIssuedAt]=useState('');
 const [menuChoice,setMenuChoice]=useState('auto'),[activeMenu,setActiveMenu]=useState(MENUS[0].id),[guestNear,setGuestNear]=useState(false),[dialogue,setDialogue]=useState(-1);
 const [seatTarget,setSeatTarget]=useState(false);
 const [foodReady,setFoodReady]=useState(false);const onDishReady=useCallback(()=>setFoodReady(true),[]);
 const screen=useRef<HTMLElement>(null);const onDishPosition=useCallback((x:number,y:number,top:number)=>{screen.current?.style.setProperty('--dish-x',`${x}px`);screen.current?.style.setProperty('--dish-y',`${y}px`);screen.current?.style.setProperty('--dish-top',`${top}px`);},[]);
 const audio=useRef<AudioContext|null>(null),heading=useRef<HTMLHeadingElement>(null),previousMenu=useRef<string|undefined>(undefined),lastBite=useRef(0);
 const courses=useMemo(()=>menuCourses(activeMenu),[activeMenu]),selectedIndex=MENUS.findIndex(m=>m.id===activeMenu),current=courses[course];
 const menuName=locale==='en'?EN_MENU[selectedIndex]:MENUS[selectedIndex].name;
 const entered=stage!=='outside',seated=!['outside','walking'].includes(stage),tasting=stage==='course'||stage==='clearing';
 const chefMode:ChefMode=stage==='thinking'?'think':stage==='serving'?'serve':tasting?'watch':['tea','outside','walking','note'].includes(stage)?'routine':'idle';
 const title=dishName(current.kind,current.name,locale),description=dishDescription(current.kind,FOOD_DETAILS[current.kind].description,locale);
 const chefSpeech=guestNear||inspect?'':stage==='thinking'?'…':stage==='serving'?t('당신을 위해 준비한 한 접시예요.','A little plate, prepared just for you.'):stage==='course'?(course===0&&message.trim()?t(`“${message.slice(0,36)}”라고 하셨죠. 오늘은 조금 쉬어가세요.`,`You wrote, “${message.slice(0,36)}”. Take a little rest here.`):course===2?t('디저트 배는 따로 있다고 믿어요.','There is always room for dessert.'):t('천천히 즐겨주세요.','Take your time and enjoy.')):stage==='clearing'?t('빈 접시가 제일 반가운 인사네요.','An empty plate is my favorite compliment.'):'';

 useEffect(()=>{const canvas=document.createElement('canvas'),gl=canvas.getContext('webgl2');setWebgl(Boolean(gl));gl?.getExtension('WEBGL_lose_context')?.loseContext();const media=matchMedia('(prefers-reduced-motion: reduce)'),update=()=>setReducedMotion(media.matches);update();media.addEventListener('change',update);return()=>{media.removeEventListener('change',update);void audio.current?.close();};},[]);
 useEffect(()=>{if(stage!=='outside')heading.current?.focus({preventScroll:true});},[stage,course]);
 useEffect(()=>{if(!notice)return;const id=setTimeout(()=>setNotice(''),4500);return()=>clearTimeout(id);},[notice]);
 useEffect(()=>{const next=stage==='seating'?'note':stage==='thinking'?'serving':stage==='serving'?'course':null;if(!next)return;const id=setTimeout(()=>setStage(next),stage==='seating'?(reducedMotion?100:SEATING_MS):stage==='thinking'?THINKING_MS:SERVING_MS);return()=>clearTimeout(id);},[stage,reducedMotion]);
 useEffect(()=>{if(stage!=='clearing')return;const id=setTimeout(()=>{setBites(0);setFoodReady(false);if(course<2){setCourse(c=>c+1);setStage('serving');}else setStage('tea');},reducedMotion?250:CLEARING_MS);return()=>clearTimeout(id);},[stage,course,reducedMotion]);
 useEffect(()=>{if(stage==='course'&&foodReady)play('arrival');},[stage,foodReady]);
 function play(kind:'arrival'|'bite'|'soft',force=false){
  if(!sound&&!force)return;
  try{audio.current??=new AudioContext();const ctx=audio.current;void ctx.resume();
   if(kind==='bite'){const buffer=ctx.createBuffer(1,Math.floor(ctx.sampleRate*.16),ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.exp(-i/data.length*7);const noise=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();noise.buffer=buffer;filter.type='lowpass';filter.frequency.value=1250;gain.gain.value=.14;noise.connect(filter);filter.connect(gain);gain.connect(ctx.destination);noise.start();return;}
   const notes=kind==='arrival'?[784,1047,1568]:[620];notes.forEach((hz,i)=>{const osc=ctx.createOscillator(),gain=ctx.createGain(),start=ctx.currentTime+i*.065;osc.type='sine';osc.frequency.value=hz;gain.gain.setValueAtTime(.035,start);gain.gain.exponentialRampToValueAtTime(.001,start+.45);osc.connect(gain);gain.connect(ctx.destination);osc.start(start);osc.stop(start+.5);});
  }catch{setSound(false);}
 }
 function eat(){if(stage!=='course'||!foodReady||guestNear||inspect)return;const now=performance.now();if(now-lastBite.current<220)return;lastBite.current=now;play('bite');const count=nextBite(bites);setBites(count);if(count===3)setStage('clearing');}
 function reset(){setMode('day');setSeatTarget(false);setStage('outside');setInspect(false);setGuestNear(false);setDialogue(-1);setCourse(0);setBites(0);setFoodReady(false);setMessage('');setMenuChoice('auto');setNotice('');}
 function another(){setMode('day');setMessage('');setCourse(0);setBites(0);setFoodReady(false);setMenuChoice('auto');setStage('note');setInspect(false);setGuestNear(false);}
 function approach(){setInspect(false);setGuestNear(true);setDialogue(-1);}
 async function save(){setSaving(true);try{await downloadReceipt(courses,message,true,issuedAt,locale);setNotice(t('오늘의 영수증을 저장했어요.','Your receipt has been saved.'));}catch{setNotice(t('저장하지 못했어요. 다시 시도해 주세요.','Could not save. Please try again.'));}finally{setSaving(false);}}
 return <main ref={screen} className={`experience ${entered?'is-inside':''} ${inspect?'is-exploring':''} ${seated?'is-seated':''} ${tasting?'is-tasting':''}`}>
  <BackgroundMusic enabled={sound}/>
  <div className="scene" role="img" aria-label={t('티푸와 작은 손님이 있는 3D 오마카세 식당','A 3D omakase restaurant with Teepu and a shy guest')}>
   {webgl!==true&&<div className="reference-fallback"/>}
   {webgl===true&&<SceneBoundary onFailure={()=>setWebgl(false)}><Restaurant entered={seated} walking={stage==='walking'} seatTarget={seatTarget} onSeatSelect={()=>setSeatTarget(true)} onSeatNear={()=>{setSeatTarget(false);setStage('seating');}} inspect={inspect} chefMode={chefMode} dish={tasting?current.kind:undefined} tea={stage==='tea'} reducedMotion={reducedMotion} bites={bites} clearing={stage==='clearing'} chefSpeech={chefSpeech} guestNear={guestNear} guestSpeech={dialogue>=0?GUEST_LINES[dialogue][locale==='ko'?0:1]:''} onGuestNear={setGuestNear} onApproach={approach} onDishReady={onDishReady} onDishPosition={onDishPosition}/></SceneBoundary>}
  </div><div className="scene-shade"/>{chefSpeech&&<aside className="chef-aside world-bubble" aria-live="polite">{chefSpeech}</aside>}
  {stage==='course'&&foodReady&&!reducedMotion&&<div key={`${issuedAt}-${course}`} className="arrival-glow" aria-hidden="true"/>}
  <header className="site-header"><div className="wordmark"><span className="brand-mark" aria-hidden="true">一</span><div>{t('고독한 오마카세','SOLITARY OMAKASE')}<small>OMAKASE FOR ONE</small></div></div><div className="header-actions"><button className="text-button" onClick={()=>setLocale(locale==='ko'?'en':'ko')} aria-label={t('영어로 변경','Switch to Korean')}>{locale==='ko'?'EN':'한국어'}</button><button className="text-button sound-button" aria-pressed={sound} onClick={()=>{if(!sound)play('soft',true);setSound(s=>!s);}}>♪ {sound?t('소리 켜짐','Sound on'):t('소리 꺼짐','Sound off')}</button><span className="open-sign"><i/>{t('한 자리가 준비되어 있어요','A seat is waiting for you')}</span></div></header>
  {tasting&&!guestNear&&!inspect&&<button className="eat-target" onClick={eat} disabled={stage==='clearing'||!foodReady} aria-label={t(`음식 먹기, ${bites}/3 입`,`Take a bite, ${bites} of 3`)}><span className="sr-only">{t('화면을 터치해서 한 입 먹기','Tap the screen to take a bite')}</span></button>}
  {tasting&&!inspect&&!guestNear&&<p className="tap-instruction" aria-live="polite">{stage==='clearing'?t('잘 먹었습니다! 다음 순간을 준비해요.','All finished! A little moment for the next course.'):!foodReady?t('접시를 가져오는 중…','Bringing your plate…'):t('화면을 터치하세요!','Tap the screen!')}</p>}
  {!inspect&&!guestNear&&<div className="content">
   {stage==='outside'?<section className="welcome"><p className="eyebrow">A QUIET TABLE, JUST FOR YOU</p><h1>{t('고독한','SOLITARY')}<br/>{t('오마카세','OMAKASE')}</h1><p className="welcome-copy">{t('조금 지친 날에도, 별일 없던 날에도.','For the long days, and the ordinary ones.')}<br/>{t('당신만을 위해 불을 켜둔 작은 식당입니다.','A small restaurant keeping a light on for you.')}</p><div className="invitation">{waiting&&<p>{t('문은 열어둘게요.','We’ll leave the door open.')}</p>}<div className="invitation-actions"><button className="primary-button" onClick={()=>{setWaiting(false);setStage('walking');play('soft');}}>{t('네, 들어갈게요','Yes, I’ll come in')} <Arrow/></button><button className="quiet-button" onClick={()=>setWaiting(true)}>{t('조금 이따가요','A little later')}</button></div></div></section>
   :stage==='walking'?<section className="seat-invitation"><p>{t('캐릭터와 함께 표시된 의자로 이동하면 자동으로 앉아요.','Walk to the marked seat to sit down automatically.')}</p><button onPointerDown={()=>{if(webgl===false)setStage('seating');else setSeatTarget(true);}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();if(webgl===false)setStage('seating');else setSeatTarget(true);}}} onClick={()=>{if(webgl===false)setStage('seating');else setSeatTarget(true);}}>{t('내 의자 곁으로 이동','Walk to my seat')}</button></section>
   :['seating','thinking','serving'].includes(stage)?<div className="scene-caption" role="status">{stage==='seating'?t('당신의 자리에 앉는 중…','Taking your seat…'):stage==='thinking'?'…':t('티푸가 한 접시를 내어드려요.','Teepu is bringing your plate.')}</div>
   :tasting?<section className="tasting-caption" aria-label={t('오늘의 식사','Your meal')}><h2 ref={heading} tabIndex={-1}>{title}</h2><p className="tasting-description">{description}</p></section>
   :<div className="inside-layout"><section className={`paper-card ${stage==='tea'?'receipt-card':''}`} aria-label={t('오늘의 식사','Your meal')}>
    {stage==='note'?<><div className="paper-top"><span>{t('고독한 오마카세','SOLITARY OMAKASE')}</span><span>{t('一人前','FOR ONE')}</span></div><form onSubmit={e=>{e.preventDefault();if(mode==='day'?!message.trim():menuChoice==='auto')return;const id=mode==='day'?selectMenuId('day',message,previousMenu.current):menuChoice;if(mode==='course')setMessage('');previousMenu.current=id;setActiveMenu(id);setIssuedAt(new Date().toISOString());setCourse(0);setBites(0);setFoodReady(false);setStage('thinking');play('soft');}}><p className="card-kicker">01 / {t('작은 주문지','A SMALL ORDER NOTE')}</p><h2 ref={heading} tabIndex={-1}>{locale==='ko'?<>어떤 이야기를<br/>담아드릴까요?</>:<>What shall we make<br/>for your day?</>}</h2><fieldset className="mode-selector"><legend className="sr-only">{t('주문 방식','Order method')}</legend>{(['day','course'] as const).map(m=><label key={m} className={mode===m?'selected':''}><input type="radio" name="mode" checked={mode===m} onChange={()=>setMode(m)}/>{m==='day'?t('오늘 있었던 일','About my day'):t('코스 선택하기','Choose a course')}</label>)}</fieldset>
    {mode==='course'?<label className="course-choice"><span className="sr-only">{t('코스 선택하기','Choose a course')}</span><select value={menuChoice} onChange={e=>setMenuChoice(e.target.value)} required><option value="auto" disabled>{t('코스를 골라주세요','Select a course')}</option>{MENUS.map((m,i)=><option key={m.id} value={m.id}>{String(i+1).padStart(2,'0')} · {locale==='en'?EN_MENU[i]:m.name}</option>)}</select></label>:<><label htmlFor="note" className="sr-only">{t('오늘의 쪽지','Your note')}</label><textarea id="note" value={message} onChange={e=>setMessage(e.target.value)} maxLength={240} required placeholder={t('오늘 있었던 일이나 먹고 싶은 음식을 적어주세요.','Tell us about your day or what you’d like to eat.')}/><div className="note-meta"><span>{t('주문은 서버에 저장하지 않아요.','Your note is not stored on a server.')}</span><span>{message.length} / 240</span></div></>}
    <button className="ink-button" disabled={mode==='day'?!message.trim():menuChoice==='auto'}>{t('주문지 건네기','Hand over my note')} <Arrow/></button><p className="demo-note">{t('21가지 코스 · 63개의 입체 음식. 직접 골라도 좋아요.','21 courses · 63 little dishes. You can choose one too.')}</p></form></>
    :<><h2 className="sr-only" ref={heading} tabIndex={-1}>{t('오늘의 주문 영수증','Your receipt')}</h2><Receipt courses={courses} message={message} includeNote={true} issuedAt={issuedAt}/><div className="receipt-actions"><button className="ink-button" disabled={saving} onClick={save}>{saving?t('저장 중…','Saving…'):t('영수증 PNG 저장','Save receipt PNG')} ↓</button><button className="linger-button" onClick={()=>setInspect(true)}>{t('차 마시며 더 머물기','Stay a little longer with tea')}</button><button className="linger-button" onClick={another}>{t('또 코스요리 먹기','Enjoy another course')}</button></div></>}
   </section></div>}
  </div>}
  {inspect&&!guestNear&&<div className="explore-caption"><span>{t('잠시, 둘러보세요.','Take a little look around.')}</span><p>{t('드래그해서 시선을 옮길 수 있어요.','Drag to look around.')}</p><button className="outline-button" onClick={approach}>{t('작은 손님 곁으로','Visit the little guest')} ↗</button><button className="outline-button" onClick={()=>setInspect(false)}>{t('내 자리로 돌아가기','Back to my seat')} <Arrow/></button></div>}
  {guestNear&&<section className="guest-dialogue" aria-label={t('작은 손님과 대화','Talk with the little guest')}><h2>{dialogue<0?t('말을 거시겠습니까?','Would you like to say hello?'):t('소소 · 부끄럼 많은 단골','Soso · a shy regular')}</h2>{dialogue<0?<><button onClick={()=>setDialogue(0)}>{t('말 걸기','Say hello')}</button><button onClick={()=>{setGuestNear(false);setInspect(false);}}>{t('그냥 지나가기','Just pass by')}</button></>:<><p className="sr-only" aria-live="polite">{GUEST_LINES[dialogue][locale==='ko'?0:1]}</p>{dialogue<4?<button onClick={()=>setDialogue(d=>d+1)}>{t('조금 더 이야기하기','Keep chatting')} ({dialogue+1}/5)</button>:<button onClick={()=>{setGuestNear(false);setDialogue(-1);}}>{t('다음에 또 만나요','See you next time')}</button>}<button onClick={()=>{setGuestNear(false);setDialogue(-1);}}>{t('조용히 인사하고 돌아가기','Wave goodbye quietly')}</button></>}</section>}
  <footer className="site-footer"><div><span className="footer-number">01 —</span>{t('작은 식당의 첫 번째 밤','A little restaurant, one quiet night')}</div><div className="footer-actions">{entered&&!inspect&&!guestNear&&<button onClick={reset}>{t('식사 마치기','Leave the restaurant')}</button>}{!tasting&&!guestNear&&!inspect&&<button onClick={()=>setInspect(true)}>{t('식당 둘러보기','Look around')} ↗</button>}</div></footer>
  {webgl===false&&<p className="webgl-notice">{t('이 브라우저에서는 참고 이미지로 보여드려요.','Your browser is showing the reference image.')}</p>}<div className={`toast ${notice?'visible':''}`} role="status">{notice}</div>
 </main>;
}
