'use client';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import AssetFood from './AssetFood';
import type { AssetDishKind } from '@/lib/menu';
export default function FoodPreview({kind}:{kind:AssetDishKind}){
 return <Canvas camera={{position:[1.5,1.3,2],fov:38}} dpr={[1,1.5]}><color attach="background" args={['#e9deca']}/><ambientLight intensity={1.7}/><directionalLight position={[-3,5,4]} intensity={3}/><directionalLight position={[3,2,-2]} intensity={1}/><AssetFood kind={kind}/><OrbitControls target={[0,.3,0]} minDistance={1.3} maxDistance={5} enablePan={false}/></Canvas>;
}
