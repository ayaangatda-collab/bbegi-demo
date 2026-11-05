import {matchesSearch} from './i18n-core.js?v=84c050cff1c8';
import {generatedPhoto} from './product-photos.js?v=84c050cff1c8';
// Fictional inventory; photos are representative category imagery, never real seller listings.
export const platforms=['당근','번개장터','중고나라'];
export const platformURLs={'당근':'https://www.daangn.com/kr/','번개장터':'https://m.bunjang.co.kr/','중고나라':'https://web.joongna.com/'};
export const templates=[
 {name:'패브릭 2인 소파',category:'가구',photo:'sofa',fallback:'market-sofa.webp',price:65000,kg:28,size:150,base:80,saved:48,asset:'selfdrop'},
 {name:'머스터드 라운지 의자',category:'가구',photo:'chair',fallback:'market-chair.webp',price:18000,kg:5,size:48,base:31,saved:18.6,asset:'resell'},
 {name:'라운드 원목 테이블',category:'가구',photo:'table',fallback:'market-coffee-table.webp',price:55000,kg:22,size:120,base:60,saved:36,asset:'selfdrop'},
 {name:'화이트 원목 수납장',category:'가구',photo:'bookshelf',fallback:'market-sideboard.webp',price:32000,kg:25,size:180,base:50,saved:30,asset:'selfdrop'},
 {name:'퀸 침대 프레임',category:'가구',photo:'bed',fallback:'used-bed.png',price:95000,kg:40,size:200,base:95,saved:57,asset:'selfdrop'},
 {name:'빌트인 전자레인지',category:'가전',photo:'microwave',fallback:'market-microwave.webp',price:45000,kg:15,size:60,base:55,saved:33,asset:'entrust'},
 {name:'27인치 모니터',category:'디지털',photo:'monitor',fallback:'market-monitor.webp',price:85000,kg:6,size:62,base:110,saved:66,asset:'entrust'},
 {name:'빈티지 테이블 조명',category:'생활',photo:'lamp',fallback:'market-desk-lamp.webp',price:24000,kg:2,size:35,base:15,saved:9,asset:'resell'},
 {name:'실버 냉장고',category:'가전',photo:'fridge',fallback:'market-refrigerator.webp',price:260000,kg:95,size:178,base:70,saved:39.2,asset:'entrust'},
 {name:'드럼 세탁기 9kg',category:'가전',photo:'washer',fallback:'market-washing-machine.webp',price:160000,kg:60,size:85,base:150,saved:90,asset:'entrust'},
 {name:'홈카페 커피머신',category:'가전',photo:'coffee',fallback:'market-coffee-machine.webp',price:55000,kg:4,size:32,base:40,saved:24,asset:'entrust'},
 {name:'데일리 자전거',category:'취미',photo:'bicycle',fallback:'market-bicycle.webp',price:95000,kg:13,size:170,base:100,saved:60,asset:'resell'},
 {name:'반려식물 화분',category:'생활',photo:'plant',fallback:'market-plant.webp',price:12000,kg:3,size:45,base:8,saved:4.8,asset:'resell'},
 {name:'캔버스 토트백',category:'패션',photo:'tote',fallback:'tote.webp',price:10000,kg:.4,size:36,base:12,saved:7.2,asset:'resell'},
 {name:'리유저블 텀블러',category:'생활',photo:'tumbler',fallback:'tumbler.webp',price:8000,kg:.3,size:24,base:5,saved:3,asset:'resell'}
];
const regions=['성수1가1동','성수2가3동','왕십리도선동','행당1동','연남동','합정동','망원1동','백석1동','마두1동','화정1동'];
const adjectives=['깔끔하게 사용한','이사 정리','새집에 어울리는','아끼던','상태 좋은','공간을 비우며','구매 후 보관한','편하게 쓰기 좋은'];
export function needsTransport(item){return Number(item.kg)>=12||Number(item.size)>=100}
export const inventory=Array.from({length:120},(_,n)=>{const t=templates[n%templates.length],variant=Math.floor(n/templates.length),transport=needsTransport(t);return {...t,id:'item-'+String(n+1).padStart(3,'0'),name:`${adjectives[variant]} ${t.name}`,price:n%13===0?0:Math.round(t.price*(.72+variant*.08)/1000)*1000,region:regions[(n*7)%regions.length],district:n%10<4?'성동구':n%10<7?'마포구':'고양시',transport,source:transport&&n%4!==0?platforms[n%3]:'빼기',origin:'sample',condition:['사용감 적음','생활 흔적 있음','거의 새것'][n%3],minutes:12+n*17,likes:(n*7)%43,views:54+(n*29)%460,base:t.base,saved:t.saved,img:t.fallback,photoCrop:generatedPhoto(n),itemId:t.category==='가전'?'fridge':t.photo==='chair'?'chair':'sofa',description:`${adjectives[variant]} ${t.name}입니다. ${variant%2?'방 구조를 바꾸며 필요한 이웃에게 전하고 싶어요.':'이사를 준비하면서 정리하고 있어요.'} ${n%3===0?'작은 사용 흔적이 있지만 사용에는 문제가 없어요.':'깨끗하게 관리했어요.'}`,owned:false,sold:false};});
export function selectInventory(list,{query='',category='전체',source='전체',transport='전체',sort='latest'}={}){let out=list.filter(p=>(category==='전체'||(category==='나눔'?p.price===0:p.category===category))&&(source==='전체'||p.source===source)&&(transport==='전체'||(transport==='운반 도움'?p.transport:!p.transport))&&(matchesSearch(`${p.name} ${p.category} ${p.region}`,query)));if(sort==='low')out.sort((a,b)=>a.price-b.price);if(sort==='high')out.sort((a,b)=>b.price-a.price);return out;}
export const communitySources={seongdong:'https://www.sd.go.kr/pr/webNewsToolDetail.do?eatitle=2021%EB%85%84+9%EC%9B%94%ED%98%B8&key=5091&subNo=19394',mapo:'https://council.mapo.seoul.kr/attach/record/MAPO/appendix/a09/A0008258.pdf',goyang:'https://www.youtube.com/watch?v=gNqkOb5w2pM'};
export function districtFor(region){return region.includes('마포')?'마포구':region.includes('고양')?'고양시':'성동구'}
export function community(region){const district=districtFor(region),near=district==='성동구'?'광진구':district==='마포구'?'서대문구':'파주시';const source=district==='성동구'?communitySources.seongdong:district==='마포구'?communitySources.mapo:communitySources.goyang;return {district,near,source,shops:[
 {id:'refill',name:`${district==='성동구'?'성수':district==='마포구'?'연남':'일산'} 리필생활`,district,type:'리필·생활용품',desc:'빈 용기에 필요한 만큼 담는 생활세제 리필숍',distance:'650m',img:'soap.webp',benefit:'주방 세트 3,500P 교환',product:'soap'},
 {id:'again',name:'다시, 쓰임',district,type:'새활용 공방',desc:'버려진 원단으로 만드는 가방과 생활 소품',distance:'1.2km',img:'tote.webp',benefit:'재생 코튼백 포인트 교환',product:'tote'},
 {id:'cup',name:'오래 쓰는 상점',district,type:'다회용 제품',desc:'한 번보다 오래, 일상에 함께하는 재사용 제품',distance:'1.8km',img:'tumbler.webp',benefit:'텀블러 8,500P 교환',product:'tumbler'},
 {id:'nearby',name:'이웃 순환상점',district:near,type:'재활용·생활용품',desc:'이웃 동네에서 만나는 친환경 생활용품',distance:'3.4km',img:'soap.webp',benefit:'주방 세트 3,500P 교환',product:'soap'}],news:[
 {id:'resource',tag:'자원순환',title:'종이팩과 폐건전지, 모아서 바꿔요',date:'2026.09.10',body:'씻어 말린 종이팩과 다 쓴 건전지를 분리해 모아주세요. 동네 수거 거점에서 재활용품 교환과 올바른 분리배출을 안내합니다. 가상 프로그램에서는 매주 수요일 오후 2시부터 5시까지 참여할 수 있어요.',place:`${district} 동 주민센터 수거 거점`,source},
 {id:'market',tag:'우리동네 행사',title:'다시 쓰는 주말, 자원순환 장터',date:'2026.09.09',body:'더 이상 쓰지 않는 물건을 이웃에게 전하고, 새활용 상품을 만나보세요. 가상 행사에서는 중고 물품 나눔, 수리 상담, 리필 체험을 함께 진행합니다.',place:`${district} 주민광장`,source},
 {id:'notice',tag:'생활 안내',title:'대형폐기물 배출 전, 이것만 확인하세요',date:'2026.09.07',body:'품목과 수거 장소, 희망일을 확인한 후 예약번호를 잘 보이게 표시해 주세요. 품목별 수수료와 배출 가능일은 지역의 안내를 확인하세요.',place:`${district} 배출 안내`,source}
 ]};}
