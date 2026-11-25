'use client';

import { Component, Suspense, useState, type ReactNode } from 'react';
import { useLanguage } from './Language';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, useProgress } from '@react-three/drei';

import RiggedTeepu, {type TeepuPose} from './RiggedTeepu';

function LoadingStatus() {
  const { active } = useProgress(); const {t}=useLanguage();
  return active ? <p role="status" style={{ position: 'absolute', inset: '45% 0 auto', zIndex: 1 }}>{t('티푸를 불러오는 중…','Loading Teepu…')}</p> : null;
}

export function TeepuModel() {
  const { scene } = useGLTF('/characters/teepu.glb');
  return <group rotation={[0, -Math.PI / 2, 0]}><primitive object={scene} /></group>;
}

class ModelError extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <p role="alert" style={{ padding: 40 }}>3D를 표시할 수 없습니다. / Unable to display 3D. Please download the model below.</p> : this.props.children;
  }
}

export default function TeepuModelPreview() {
  const [rotate, setRotate] = useState(false); const [pose,setPose]=useState<TeepuPose>('rest'); const [paused,setPaused]=useState(false); const {t}=useLanguage();
  return <main style={{ minHeight: '100svh', background: '#f7eddf', color: '#624936', padding: '32px 20px', textAlign: 'center', colorScheme: 'light' }}>
    <p style={{ fontSize: 11, letterSpacing: '.22em' }}>TE E P U · CHARACTER STUDY</p>
    <h1 style={{ fontSize: 36, marginTop: 14 }}>{t('작은 셰프, 티푸','Teepu, the little chef')}</h1>
    <p style={{ fontSize: 13, marginTop: 12 }}>{t('드래그해서 돌려보고, 스크롤하거나 두 손가락으로 확대해 보세요.','Drag to rotate. Scroll or pinch to zoom.')}</p>
    <div style={{ position: 'relative', height: 'min(65svh, 680px)', minHeight: 330, maxWidth: 1000, margin: 'auto' }}>
      <LoadingStatus />
      <ModelError>
        <Canvas camera={{ position: [0, .12, 2.4], fov: 35 }} dpr={[1, 1.5]} fallback={<p>{t('이 브라우저에서는 3D 보기를 지원하지 않습니다.','This browser does not support the 3D viewer.')}</p>}>
          <ambientLight intensity={1.6} />
          <directionalLight position={[-3, 5, 5]} intensity={2.6} />
          <directionalLight position={[4, 2, -3]} intensity={1.4} />
          <Suspense fallback={null}>
            <group position={[0,-.5,0]}>
              <RiggedTeepu pose={pose} reducedMotion={paused}/>
              {pose==='stir'&&<group position={[-.07,.29,.2]}>
                <mesh><cylinderGeometry args={[.105,.08,.07,32,1,true]}/><meshStandardMaterial color="#d5b98e" side={2}/></mesh>
                <mesh position={[0,.024,0]}><cylinderGeometry args={[.099,.099,.009,32]}/><meshStandardMaterial color="#c78643" roughness={.3}/></mesh>
                <mesh position={[0,-.047,0]}><boxGeometry args={[.38,.025,.3]}/><meshStandardMaterial color="#a97a4b"/></mesh>
              </group>}
            </group>
          </Suspense>
          <OrbitControls makeDefault enablePan={false} autoRotate={rotate} autoRotateSpeed={1.5} minPolarAngle={0.25} maxPolarAngle={Math.PI * 0.85} />
        </Canvas>
      </ModelError>
    </div>
    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
      {(['rest','stir','bind'] as const).map(p=><button key={p} aria-pressed={pose===p} onClick={()=>setPose(p)} style={{background:pose===p?'#624936':'#e6d5be',color:pose===p?'#fff6e9':'#624936',borderRadius:30,padding:'14px 24px'}}>{p==='rest'?t('팔 내린 자세','Arms relaxed'):p==='stir'?t('앞발로 젓기','Stir with one paw'):t('원본 자세','Original pose')}</button>)}
      <button onClick={()=>setPaused(!paused)} style={{background:'#e6d5be',color:'#624936',borderRadius:30,padding:'14px 24px'}}>{paused?t('동작 재생','Play motion'):t('동작 멈추기','Pause motion')}</button>
      <button aria-pressed={rotate} onClick={() => setRotate(!rotate)} style={{ background: '#e6d5be', color: '#624936', borderRadius: 30, padding: '14px 24px' }}>{rotate ? t('회전 멈추기','Stop rotation') : t('자동 회전','Auto rotate')}</button>
      <a href="/characters/teepu-rigged.glb" download style={{ background: '#624936', color: '#fff6e9', borderRadius: 30, padding: '14px 24px', textDecoration: 'none' }}>{t('관절 모델 다운로드','Download rigged model')}</a>
    </div>
    <p style={{ fontSize: 11, marginTop: 22, opacity: 0.7 }}>{t('원본 표면·텍스처 유지 · 관절 9개 · 팔 내리기와 젓기 동작','Original surface and textures · 9 bones · Relaxed and stirring animations')}</p>
  </main>;
}
