const fs=require('fs');
const rows=[
['quiet','수고했어','수고|애썼|고생|퇴근|열심히','차완무시|아부리 연어 초밥|호지차 푸딩','custard|salmon|pudding'],
['restore','충전','피곤|지쳤|지치|지쳐|졸리|졸려|졸음|자고 싶|잠이 와|잠이 온|잠이 오|기운이 없|녹초|야근|과로|에너지|충전','버섯 다시 수프|장어 솥밥|흑임자 모찌','soup|unagi|mochi'],
['refresh','기운 내','기운 내|응원|힘내|힘들|힘든|의욕|기운내','유자 무절임|새우 텐푸라 롤|레몬 소르베','radish|roll|sorbet'],
['comfort','작은 위로','우울|위로|외로|외롭|슬프|슬퍼|슬펐|눈물|울었|이별|헤어|lonely|sad','단호박 계란찜|연어 오차즈케|딸기 다이후쿠','custard|ochazuke|daifuku'],
['cozy','포근함','집에 가고 싶|집 가고 싶|집에가고싶|포근|추워|추운|춥|따뜻|보고 싶|그리워','된장 가지구이|게살 달걀 덮밥|밤 푸딩','eggplant|crab-rice|chestnut-pudding'],
['okay','괜찮아','괜찮|실수|걱정|불안|긴장|실패|망쳤|anxious','오이 초절임|도미 소금 초밥|배 젤리','cucumber|white-sushi|pear-jelly'],
['slow','천천히','쉬고 싶|눕고 싶|천천히|쉬어|휴식|쉬고싶|바쁘|바빴|바쁜|고단|지친','두부 앙카케|버섯 솥밥|바닐라 모찌','tofu-mushroom|mushroom-rice|vanilla-mochi'],
['clear','마음 정리','정리|복잡|생각이 많|생각 많|혼란|잊고|정신없|답답','토마토 다시 절임|흰살생선 초밥 3종|유자 셔벗','tomato|white-trio|yuzu-sorbet'],
['anger','화풀이','빡쳐|빡치|화남|화나|화가|화났|짜증|열받|분노|억울|스트레스|angry|stress','냉두부 폰즈|매콤 아부리 참치롤|시트러스 소르베','tofu-roe|tuna-roll|citrus-sorbet'],
['soothe','달래기','속상|서운|마음 아|마음이 아|상처|섭섭|달래','새우 계란찜|간장 버터 관자 솥밥|캐러멜 푸딩','shrimp-custard|scallop-rice|caramel-pudding'],
['restart','다시 시작','다시 시작|새출발|새 출발|도전|재도전|다짐|시작','시금치 참깨무침|연어·계란 초밥|고구마 양갱','spinach|salmon-egg|sweet-potato'],
['bored','심심 탈출','심심|지루|따분|재미없|bored','바삭한 연근칩|크런치 새우롤|딸기 파르페','lotus|shrimp-roll|parfait'],
['focus','몰입','집중|몰입|공부|시험|마감|일해야|작업','다시 계란말이|참치 아카미 초밥|말차 젤리','omelette|tuna-sushi|matcha-jelly'],
['quiet-day','고요한','조용|고요|평온|혼자|평범|무난|별일 없|별일없는','연두부 참깨소스|광어 초밥|두유 푸딩','sesame-tofu|flounder|soy-pudding'],
['leisure','느긋한','느긋|여유|주말|휴가|한가|산책','제철 채소 오히타시|새우튀김 메밀소바|팥 모나카','greens|soba|monaka'],
['flutter','두근두근','설레|두근|데이트|첫 만남|좋아하는 사람|고백','연어 타르타르|붉은새우 초밥|복숭아 젤리','tartare|shrimp-sushi|peach-jelly'],
['happy','행복 가득','ㅋㅋ|ㅎㅎ|하하|웃겨|웃음|행복|기뻐|기쁘|기쁜|즐거|즐겁|신나|신났|좋았|좋은|happy','단새우 카르파초|3종 모둠 초밥|딸기 크림 모찌','carpaccio|sushi-trio|cream-mochi'],
['celebrate','셀프 축하','축하|합격|성공|생일|승진|해냈|뿌듯|기념|celebrat','관자 차완무시|오도로 초밥|밤 몽블랑','scallop-custard|toro|montblanc'],
['adventure','모험','모험|새로운|색다른|여행|기분 전환|기분전환|용기','와사비 완두콩 무침|와규 아부리 초밥|망고 다이후쿠','peas|wagyu|mango-mochi'],

['special','스페셜','특별|스페셜|최고|보상|선물|플렉스|호사','성게알 차완무시|제철 프리미엄 초밥 3종|계절 과일 모찌','uni-custard|premium-sushi|fruit-mochi'],
['bakery','포근한 베이커리','빵|베이커리|팬케이크|그라탱|브런치|bread|pancake|gratin|bakery','졸린 강아지 우유빵|노릇한 치즈 그라탱|티푸 크림 팬케이크','sleepy-bread|cheese-gratin|puppy-pancakes']
];
const ids=['01-chawanmushi','02-aburi-salmon','03-hojicha-pudding','04-mushroom-dashi','05-unagi-rice','06-sesame-mochi','07-yuzu-radish','08-tempura-roll','09-lemon-sorbet','10-pumpkin-custard','11-salmon-ochazuke','12-strawberry-daifuku'];
const notes=['작은 한 입부터, 오늘의 속도로.','당신을 위해 준비한 한 접시예요.','끝에는 작은 다정함을 남겨둘게요.'];
const descriptions={'sleepy-bread':'우유를 넣어 부드럽게 구운 강아지 모양 빵이에요.','cheese-gratin':'노릇한 치즈를 덮은 그라탱에 산뜻한 샐러드를 곁들였어요.','puppy-pancakes':'폭신한 팬케이크 사이에 크림을 채우고 작은 티푸를 올렸어요.',eggplant:'부드럽게 구운 가지에 된장 소스를 발랐어요.', 'crab-rice':'폭신한 달걀과 게살을 따뜻한 밥 위에 올렸어요.', 'chestnut-pudding':'고소한 밤을 올린 부드러운 푸딩이에요.', cucumber:'아삭한 오이를 새콤하게 절였어요.', 'white-sushi':'담백한 도미에 소금을 살짝 더한 초밥이에요.', 'pear-jelly':'맑고 산뜻한 배의 단맛을 담은 젤리예요.', 'tofu-mushroom':'연두부에 따뜻한 버섯 소스를 끼얹었어요.', 'mushroom-rice':'버섯 향이 밴 따뜻한 솥밥이에요.', 'vanilla-mochi':'말랑한 찹쌀떡에 바닐라 향을 담았어요.',tomato:'껍질을 벗긴 토마토를 맑은 다시에 절였어요.', 'white-trio':'서로 다른 흰살생선을 올린 초밥 세 점이에요.', 'yuzu-sorbet':'유자 향이 은은한 시원한 셔벗이에요.', 'tofu-roe':'차가운 두부에 폰즈와 연어알을 더했어요.', 'tuna-roll':'참치를 살짝 구워 매콤한 소스를 올린 롤이에요.', 'citrus-sorbet':'감귤의 상큼함을 담은 소르베예요.', 'shrimp-custard':'새우를 얹은 부드러운 달걀찜이에요.', 'scallop-rice':'구운 관자와 버터, 간장 향을 담은 솥밥이에요.', 'caramel-pudding':'캐러멜 소스를 얹은 달콤한 푸딩이에요.', spinach:'시금치에 고소한 참깨 양념을 더했어요.', 'salmon-egg':'연어와 계란말이 초밥을 한 상에 담았어요.', 'sweet-potato':'고구마의 은은한 단맛을 담은 양갱이에요.',lotus:'얇게 썬 연근을 바삭하게 튀겼어요.', 'shrimp-roll':'바삭한 튀김옷을 두른 새우 롤이에요.',parfait:'딸기와 크림, 바삭한 크럼블을 층층이 담았어요.',omelette:'다시를 넣어 촉촉하게 말아낸 계란말이예요.', 'tuna-sushi':'붉은 참치 아카미를 올린 초밥 두 점이에요.', 'matcha-jelly':'말차의 은은한 쌉쌀함을 담은 젤리예요.', 'sesame-tofu':'말랑한 연두부에 고소한 참깨 소스를 더했어요.',flounder:'담백하고 부드러운 광어 초밥이에요.', 'soy-pudding':'두유의 고소한 맛을 살린 부드러운 푸딩이에요.',greens:'제철 푸른 채소를 다시에 가볍게 무쳤어요.',soba:'메밀면 위에 바삭한 새우튀김을 올렸어요.',monaka:'바삭한 과자 사이에 달콤한 팥을 채웠어요.',tartare:'잘게 썬 연어에 연어알과 채소를 더했어요.', 'shrimp-sushi':'붉은새우의 단맛을 담은 초밥이에요.', 'peach-jelly':'복숭아 조각을 담은 투명한 젤리예요.',carpaccio:'단새우를 꽃처럼 펼치고 연어알을 얹었어요.', 'sushi-trio':'연어, 흰살생선, 참치를 한 상에 담았어요.', 'cream-mochi':'딸기와 부드러운 크림을 찹쌀떡으로 감쌌어요.', 'scallop-custard':'도톰한 관자를 얹은 차완무시예요.',toro:'풍부한 맛의 참치 뱃살 초밥이에요.',montblanc:'밤 크림을 층층이 두른 몽블랑이에요.',peas:'완두콩에 와사비와 참깨를 가볍게 버무렸어요.',wagyu:'살짝 구운 와규를 밥 위에 올렸어요.', 'mango-mochi':'노란 망고를 말랑한 떡으로 감쌌어요.', 'uni-custard':'성게알을 얹은 부드러운 차완무시예요.', 'premium-sushi':'제철 생선과 새우를 담은 특별한 초밥 세 점이에요.', 'fruit-mochi':'여러 가지 제철 과일을 담은 찹쌀떡이에요.'};
let dishes={},menus=[];
rows.forEach(([id,title,words,names,forms],i)=>{const kinds=names.split('|').map((name,j)=>{const n=i*3+j,form=forms.split('|')[j],key=ids[n]||`${String(n+1).padStart(2,'0')}-${form}`;dishes[key]={name,description:descriptions[form]||`${name}의 맛을 담아 정성껏 준비한 한 접시예요.`,note:notes[j],form};return key;});menus.push({id,name:title+' 코스',keywords:words.split('|'),kinds});});
fs.writeFileSync('lib/food-catalog.json',JSON.stringify({dishes,menus},null,2)+'\n');
