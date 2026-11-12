# 고독한 오마카세 · Omakase for One

밤의 작은 식당에서 오늘의 마음을 한 끼로 내어주는 3D 웹 시제품.

## 실행

Node.js 20.9 이상과 pnpm을 설치한 환경에서:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

http://127.0.0.1:3000 에서 확인합니다.

```sh
pnpm typecheck
pnpm build
pnpm start
```

## 현재 구현

- Next.js App Router, React, TypeScript.
- React Three Fiber + Three.js로 직접 만든 식당: 낮은 스툴, 나무 카운터, 조명, 창문, 선반, 식기.
- 넓어진 중앙 작업 공간과 뒤 왼쪽 싱크대(움푹 파인 볼, 수전, 수건, 수납장).
- 입장 시 카메라 이동, 공간 둘러보기, 기본 서빙 이동.
- 주문지의 두 가지 입력 모드, 준비 연출, 세 코스, 차, PNG 영수증.
- 첨부 GLB와 자체 제작 GLB 총 63개로 21가지 3접시 코스를 구성합니다. 이야기·먹고 싶은 음식에 따라 코스가 달라집니다. 분류 기준과 전체 메뉴는 `docs/menu-design.md`를 참고하세요.
- 쪽지가 담긴 영수증 PNG 저장. QR 주소에 메뉴·날짜·쪽지가 포함되며 링크를 가진 사람은 영수증을 볼 수 있습니다. 서버에 저장하지 않습니다.
- 작은 화면 대응, 동작 줄이기 설정, 키보드 포커스, WebGL 미지원 시 참고 이미지 대체.
- 입장 후 음식 등장 차임과 한입 효과음을 재생합니다. 소리 버튼으로 끌 수 있습니다.

## 현재 범위

현재 공간은 코드로 만든 초기 3D 시제품입니다. 참고 이미지와 동일한 완성도의 모델은 아닙니다.
티푸는 제공받은 GLB로 교체했습니다. 이 파일에는 관절과 애니메이션이 없어서 팔 형태를 유지하며 몸의 이동·기울기로 연출합니다. 문어 소시지 손님은 코드로 제작한 3D 캐릭터이며 다섯 가지 대화를 제공합니다. 실제 AI 메뉴 선택, 계정과 데이터베이스는 연결하지 않았습니다.
AI를 연결할 때는 서버 엔드포인트와 서버 환경 변수만 사용하고 브라우저 코드에 API 키를 넣지 않습니다.
현재 API 키나 유료 외부 서비스가 필요하지 않습니다.
Google Fonts에서 글꼴을 불러오며 연결할 수 없을 경우 기본 글꼴을 사용합니다.

## Vercel 배포

1. 이 폴더를 GitHub 저장소에 올립니다. `.gitignore`가 node_modules, 빌드 출력, 환경 변수를 제외합니다.
2. Vercel의 Add New → Project에서 해당 저장소를 가져옵니다.
3. Framework Preset: Next.js, Root Directory: 저장소 루트.
4. Build Command: `pnpm build`. Output Directory는 Next.js 기본값 그대로 둡니다.
5. 현재 환경 변수는 필요하지 않습니다. Deploy 후 Vercel이 반환한 주소를 확인합니다.

현재 Vercel 프로젝트나 GitHub 원격 저장소는 생성하지 않았습니다.
초기 시제품은 검색엔진 색인을 막도록 설정했습니다. 정식 공개 시 app/layout.tsx의 robots 설정을 변경합니다.

## 주요 파일

- `components/Restaurant.tsx`: 실제 3D 공간과 음식.
- `components/Experience.tsx`: 사용자 흐름과 주문지.
- `lib/menu.ts`: 21개 코스 분류 및 선택.
- `app/globals.css`: UI 및 모바일 레이아웃.
- `assets/references/`: 원본 디자인 시안과 이미지 편집 프롬프트.
- `public/references/interior.png`: 웹에서 보는 참고 시안 및 WebGL 대체 화면.
- `docs/teepu-production-plan.md`: 주방 배치와 다음 단계의 티푸 모델·애니메이션 제작 기준.

## 중앙 UI, 티푸와 영수증

- 모든 질문 중앙 정렬. 음식은 공중에서 회전하며 마지막에만 영수증을 표시합니다.
- 티푸는 중앙 주방 안의 싱크대·서랍·조리대 사이를 이동합니다. 관절이 없는 제공 모델의 팔은 변형하지 않습니다.
- 영수증: 잘린 종이 모양 가장자리, 굵은 제목, 음식 그림 3개, 주문, 음식 설명, $1.50, 저장 페이지 QR. 금액은 표시용이며 결제는 없습니다.
- QR은 현재 접속 주소를 사용하므로 다른 기기에서 스캔하려면 Vercel 공개 주소에서 새 영수증을 생성해야 합니다.
- components/Teepu.tsx 및 lib/chef-routine.ts: 캐릭터와 동작.
- lib/receipt.ts 및 lib/receipt-data.ts: 영수증 PNG, QR, 데이터 검증.

음식 코스 검증: `node tests/menu.cjs` (설치된 TypeScript로 테스트 파일을 읽습니다).

## 착석과 공중 서빙

입장 선택 → 주문지 → 실제 앞쪽 스툴(x=0.9, z=2.95) 위의 눈높이로 2.2초 이동 → 티푸가 2초 고민 → 1.2초 손 내밀기 → 공중 음식 순서입니다. 식사 중에는 사진·종이 카드 없이 실제 GLB와 하단 자막을 표시합니다. 음식은 24초에 한 번 회전하며 동작 줄이기 설정에서는 회전을 멈춥니다. 영수증은 마지막에만 표시됩니다. `/menu-guide`에서 실제 분류 결과를 별도로 확인할 수 있습니다.

## 2026-11-11 업데이트와 검증

- 졸린 강아지 빵 → 치즈 그라탱과 샐러드 → 강아지 크림 팬케이크의 포근한 베이커리 코스 추가.
- 음식은 12초에 한 바퀴 회전. 세 번 먹으면 음식만 사라지고 접시는 빠르게 회전한 뒤 다음 코스로 전환. 모델 로딩이 완료되어야 등장 효과와 먹기 입력 활성화.
- 영수증 제목 중앙 정렬, 저장·머물기 버튼 75% 호버 배경, 다시 코스 먹기 제공.
- Vercel 국가 헤더가 KR이면 한국어, 다른 국가면 영어. 국가 정보가 없는 로컬에서는 브라우저 언어 사용. 직접 언어 선택은 하루 동안 우선 적용.
- `node tests/menu.cjs`: 21코스·63에셋, 한영 분류, 영수증 데이터 검사.
- 서버 실행 중 `node tests/locale-http.cjs`: 한국·미국·일본·프랑스 및 수동 선택 등 8가지 HTTP 조건 검사. 국가 헤더 모의 테스트이며 실제 해외 회선 검사는 아님.
- 브라우저에서 신규 3코스의 3회 먹기, 영수증 PNG 저장, 손님 5가지 대화, 390px 영어 화면 확인. 프로덕션 빌드 성공.

## 2026-11-12 interaction update

- Third-person visitor arrival: arrow keys or marked-seat button, approach prompt, seating, then ordering. Repeat meals return directly to the order plate.
- Glazed ceramic order panel; manual course and written note are mutually exclusive with disabled-state guidance.
- Teepu now uses a gently weighted lowered-arm rest pose and small quick walking bobs. The original GLB remains intact.
- Removed chopping-board garnish and guest spoon; moved guest and stool slightly away from the counter.
- Added open tomato soup pot, induction hob, bubbles and steam beside the sink.
- Chef dialogue appears at the right in larger text; food description below its title, tap prompt above the plate, no course number or three dots.
- Real curved bite faces are generated from food surface entry/exit intersections. `node tests/bite-caps.cjs` validates all 63 foods and excludes vessels.
- Verified first arrival, seating, both mutually exclusive order paths, three bites/course transitions, repeat ordering, Korean/English mobile order screen. Production build and existing menu tests pass.
