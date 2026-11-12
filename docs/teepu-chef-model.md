# 티푸 셰프 3D 모델

- 파일: `public/models/teepu-chef.glb`
- 미리보기: `/teepu-model`
- GLB 2.0, 3,208,800 bytes, 28,514 triangles
- 재질 1개, 텍스처 3개 모두 파일 내부에 포함
- 정적 모델: 뼈대와 캐릭터 동작 애니메이션은 포함되지 않음
- 사용자 제공 정면·옆면·뒷면 이미지를 사용하여 Tripo H3.1로 생성
- 털은 텍스처로 표현되어 원본 이미지의 개별 털 실루엣과 차이가 있음

기존 Three.js / React Three Fiber Canvas 안에서 `components/TeepuModelPreview.tsx`의 `TeepuModel`을 Suspense로 감싸 사용할 수 있습니다. 이 컴포넌트는 원본 모델의 방향을 정면으로 회전시킵니다. 미리보기에서는 Center와 Bounds로 위치 및 크기를 자동 조정합니다.

생성 작업: `70010a18-be6e-48f2-ac18-4ba50e3ee5ee`
