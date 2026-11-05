import {extraServiceIds,serviceGuides} from './services-data.js?v=84c050cff1c8';
import {productPhoto} from './product-photos.js?v=84c050cff1c8';
import {fmt,balance,totalSaved} from './model.js?v=84c050cff1c8';
import {impactSummary,impactCard} from './impact.js?v=84c050cff1c8';
import {inventory} from './catalog.js?v=84c050cff1c8';

const banners=[
 {id:'phone',theme:'phone',tag:'내 폰 바로팔기',title:'쓰지 않는 폰,\n새로운 가치로',sub:'내 폰의 예상 가격을 확인해요',asset:'color/mobile-phone.svg'},
 {id:'donation',theme:'donation',tag:'물품 기부',title:'아름다운 추억,\n기부로 이어가요',sub:'안 쓰는 물건에 다음 이야기를',asset:'color/gift.svg'},
 {id:'moving',theme:'moving',tag:'이사 견적 비교',title:'설레는 이사,\n가격부터 가볍게',sub:'우리 집에 맞는 견적을 한눈에',asset:'color/delivery-truck.svg'},
 {id:'demolition',theme:'demolition',tag:'철거 · 원상복구',title:'공간의 새로운 시작,\n빼기와 함께',sub:'작업 범위부터 차근차근 확인해요',asset:'demolition.svg'},
 {id:'down',theme:'down',tag:'내려드림',title:'혼자 들기 무거울 땐,\n빼기가 내려드려요',sub:'집 안에서 배출 장소까지 편안하게',asset:'entrust.svg'}
];
const compactServiceLabels={construction:['공사장 폐기물','배출신고'],donation:['물품 기부로','연말정산 받기'],phone:['내 폰 팔기','가격 알아보기'],moving:['이사비용','견적 비교'],scrap:['내 차 견적','폐차 신청하기'],clothes:['옷장을 가볍게','의류 수거하기'],recycling:['재활용','방문 수거하기'],insurance:['우리집','화재보험 확인']};
export function createHome({s,save,shell,section,icon,esc,openModal,closeModal,toast,btn,detailTable,today,uid,go,activityRow}){
 let dispose=()=>{},paused=false,current=0,extraIntent=null,disposalChoice=null;
 function render(){
  const impact=impactSummary(s());
  const benefits=[
   {route:'points',icon:'leaf',kind:'points',label:'나의 빼기 포인트',value:fmt(impact.available)+'<small> P</small>',description:'지금 쓸 수 있는 포인트'},
   {route:'qr',icon:'qr',kind:'qr',label:'나의 빼기 QR',value:'내 정보 간편하게',description:'공유할 정보만 선택'},
   {route:'shop',icon:'shop',kind:'shop',label:'포인트로 그린마켓',value:impact.rewards.length?'지금 교환 가능':'다음 보상을 향해',description:impact.rewards.length?`친환경 상품 ${impact.rewards.length}종 보기`:`${fmt(Math.max(0,(impact.next?.price||0)-impact.available))} P 더 모으면 교환`},
   {route:'local',icon:'pin',kind:'local',label:'우리 동네',value:'가까운 좋은 순환',description:'친환경 상점과 지역 소식'}
  ];
  const goods=inventory.slice(0,8),pending=s().activities.find(a=>a.status==='신청 완료');
  shell(`<div class="home-top"><section class="rolling-banner" aria-label="빼기 소식"><div class="banner-track" id="banner-track">${banners.map((b,n)=>`<button type="button" class="banner-slide banner-${b.theme}" data-action="${b.id==='down'?'extra-service':'service-open'}" data-id="${b.id}" aria-label="${n+1}/5 ${b.tag}"><span class="banner-copy"><small>${b.tag}</small><strong data-i18n-text="${esc(b.title)}">${b.title.replace('\n','<br>')}</strong><span>${b.sub}</span></span><img src="assets/${b.asset}" alt=""></button>`).join('')}</div><div class="banner-controls"><button type="button" data-action="banner-pause" id="banner-pause" aria-label="배너 자동 넘김 일시정지">Ⅱ</button><button type="button" data-action="banner-next" aria-label="다음 배너"><span id="banner-count">1</span><span class="banner-total"> / 5</span> ›</button></div></section>
  <a class="hope-strip" href="#/hope-intro"><span class="hope-strip-icon">${icon('shop')}</span><span class="hope-strip-copy"><small>소상공인 협업 예시</small><b>희망리턴패키지 · 점포 정리 지원금</b><span>평당 20만원 · 최대 600만원 한도 확인</span></span>${icon('chevron')}</a>
  <div class="home-section-heading"><h1>새롭게 버리는 공식, 빼기</h1><a href="#/guide" class="service-help">${icon('info')} 서비스 안내</a></div>
  <div class="home-services"><button type="button" class="home-service disposal" data-action="service-select"><h2>대형폐기물<br>버리기</h2><img src="assets/disposal-illustration.svg" alt="소파를 안전하게 옮기는 빼기 일러스트" width="180" height="120"></button><button type="button" class="home-service demolition" data-action="service-open" data-id="demolition"><span class="support-label">공간의 새로운 시작</span><h2>철거 · 원상복구<br>신청하기</h2><img src="assets/demolition.svg" alt=""></button><a class="home-service resale" href="#/market"><h2>꽤 괜찮은 물건<br>거래하기</h2><img src="assets/market-illustration.svg" alt=""></a></div>
  <section class="extra-services"><h2>이런 서비스도 있어요</h2><div class="extra-grid">${extraServiceIds.map(id=>{const g=serviceGuides[id],label=compactServiceLabels[id]||g.short;return `<button type="button" data-action="service-open" data-id="${id}"><span class="extra-icon"><img src="assets/${g.asset}" alt=""></span><b>${label[0]}<br>${label[1]}</b></button>`}).join('')}</div></section></div>
  <div class="home-lower"><section class="home-story-entry"><div><small>빼기 스토리</small><h2>똑똑하게 버리는 방법</h2><p>헷갈릴 땐 검색하거나, 사진으로 찾아요.</p></div><div class="home-story-actions"><a href="#/stories">${icon('search')}품목 검색</a><button type="button" data-action="story-camera">${icon('camera')}사진으로 찾기</button></div></section>${section('거래 중인 중고상품',`<div class="home-market-rail">${goods.map(p=>`<a href="#/item?id=${p.id}" class="home-product"><div class="home-product-image">${productPhoto(p)}${p.transport?`<span>${icon('truck')} 운반 가능</span>`:''}</div><h3>${esc(p.name)}</h3><b>${p.price?fmt(p.price)+'원':'나눔'}</b><p>${esc(p.region)}</p></a>`).join('')}</div>`,'market','구경하기')}
  <section class="section benefits-section"><div class="section-head"><h2>비운 만큼, 더 좋은 일상</h2></div><div class="benefit-grid">${benefits.map(card=>`<a href="#/${card.route}" class="benefit-tile ${card.kind}-tile"><div class="benefit-top">${icon(card.icon)}${icon('chevron')}</div><span>${card.label}</span><strong>${card.value}</strong><p>${card.description}</p></a>`).join('')}</div>${impactCard(s())}</section>
  ${pending?section('지금, 나의 물건은',`<button type="button" class="home-tracking" data-action="track-disposal" data-id="${pending.recordId}">${icon('truck')}<span><b>${esc(pending.name)}</b><small>${pending.stage>=4?'처리장에 도착했어요':pending.stage>=3?'최종 처리장으로 이동 중이에요':'수거를 준비하고 있어요'}</small></span>${icon('chevron')}</button>`,'activity','이용 내역'):''}
  ${section('나의 최근 순환',`<div class="panel recent-circulation">${s().activities.slice(0,3).map(activityRow).join('')}</div>`,'activity')}
  </div>`);mount();
 }
 function mount(){
  dispose();const el=document.querySelector('#banner-track');if(!el?.scrollTo)return;
  current=0;paused=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false;
  const reduced=paused;let touched=false;
  const update=()=>{current=Math.round(el.scrollLeft/el.clientWidth);const count=document.querySelector('#banner-count');if(count)count.textContent=String(current+1)};
  const pauseLabel=()=>{const b=document.querySelector('#banner-pause');if(b){b.textContent=paused?'▶':'Ⅱ';b.setAttribute('aria-label',paused?'배너 자동 넘김 시작':'배너 자동 넘김 일시정지')}};
  pauseLabel();el.addEventListener('scroll',update,{passive:true});
  const start=()=>{touched=true};const end=()=>{touched=false};el.addEventListener('pointerdown',start);window.addEventListener('pointerup',end);window.addEventListener('pointercancel',end);
  const timer=setInterval(()=>{if(!paused&&!touched&&!document.hidden&&!document.querySelector('dialog[open]')&&el.getBoundingClientRect().bottom>0)el.scrollTo({left:((current+1)%banners.length)*el.clientWidth,behavior:reduced?'instant':'smooth'})},5500);
  dispose=()=>{clearInterval(timer);window.removeEventListener('pointerup',end);window.removeEventListener('pointercancel',end)};
 }
 const titles=Object.fromEntries(Object.entries(serviceGuides).map(([id,g])=>[id,g.title]));
 function extra(id){
  if(id==='down'){disposalChoice='내려드림';selectService();return;}
  if(!titles[id])return;
  extraIntent={id:uid(),service:id};
  const field=(label,body)=>`<label class="form-field"><span>${label}</span>${body}</label>`;
  const select=(name,options)=>`<select name="${name}">${options.map(x=>`<option>${x}</option>`).join('')}</select>`;
  const intro={phone:['mobile-phone','오래 함께한 폰의 다음 이야기','기종과 상태로 예상 가격을 확인해요.'],donation:['gift','버리기 아까운 물건, 기부로 이어가요','접수 가능한 물품과 방문 일정을 확인해요.'],moving:['delivery-truck','이사 준비, 비교부터 가볍게','지역과 이사 규모를 선택해 주세요.'],demolition:['package','정리할 공간을 알려주세요','철거 범위에 맞는 상담을 준비해요.'],construction:['package','현장의 폐기물을 간편하게','종류와 예상 규모부터 확인해요.']}[id];
  let fields='';
  if(id==='phone')fields=field('기종',select('model',['iPhone 15 Pro','iPhone 14','iPhone 13','Galaxy S24','Galaxy S23']))+field('저장 용량',select('capacity',['128GB','256GB','512GB']))+field('물품 상태',select('condition',['정상 작동 · 외관 깨끗함','정상 작동 · 생활 흠집','액정 파손 · 점검 필요']));
  else if(id==='donation')fields=field('기부할 물품',select('item',['의류 · 가방','도서 · 문구','생활용품','소형가전']))+field('예상 수량',`<input name="count" type="number" min="1" max="100" value="5" required>`)+field('전달 방법',select('method',['방문 수거 희망','가까운 접수처 방문']));
  else if(id==='moving')fields=field('출발 지역',`<input name="from" value="${esc(s().region)}" maxlength="60" required>`)+field('도착 지역',select('to',['서울 성동구','서울 마포구','서울 강동구','경기 고양시']))+field('이사 규모',select('size',['원룸 · 1톤','투룸 · 2.5톤','가족 이사 · 5톤']));
  else fields=field('작업 유형',select('type',id==='demolition'?['매장 철거 · 원상복구','주거 공간 부분 철거','집기 정리']:['목재 · 가구류','혼합 생활폐기물','포장재 · 기타']))+field('예상 규모',select('size',['소규모 · 10평 미만','중규모 · 10~30평','대규모 · 30평 이상']));
  if(id!=='phone')fields+=field('희망일',`<input name="date" type="date" min="${today()}" value="${today()}" required>`);
  openModal(titles[id],`<div class="extra-intro"><img src="assets/color/${intro[0]}.svg" alt=""><h3>${intro[1]}</h3><p>${intro[2]}</p></div><form id="extra-form">${fields}<p class="note">입력한 조건으로 서비스 이용 과정을 확인할 수 있어요. 가격과 업체는 예시이며 실제 견적·수거 요청은 발송되지 않아요.</p>${btn(id==='phone'?'예상 가격 확인':id==='moving'?'비교 견적 확인':'신청 내용 확인','extra-review',`data-id="${id}"`,'wide')}</form>`);
 }
 function review(id){
  const f=document.querySelector('#extra-form');if(!f.reportValidity())return;
  const data=Object.fromEntries(new FormData(f));if(data.date&&data.date<today()){toast('오늘 이후의 날짜를 선택해 주세요.');return;}
  extraIntent={...extraIntent,data};let details='';
  if(id==='phone'){const base={'iPhone 15 Pro':520000,'iPhone 14':300000,'iPhone 13':220000,'Galaxy S24':360000,'Galaxy S23':240000}[data.model];const amount=Math.round((base+({'128GB':0,'256GB':30000,'512GB':60000}[data.capacity]))*({'정상 작동 · 외관 깨끗함':1,'정상 작동 · 생활 흠집':.85,'액정 파손 · 점검 필요':.45}[data.condition])/10000)*10000;extraIntent.amount=amount;details=`<div class="quote-highlight"><small>입력 조건 기준 · 예시 견적</small><strong>${fmt(amount)}<span>원</span></strong><p>최종 가격은 실물 검수 후 달라질 수 있어요.</p></div>${detailTable([['기종',esc(data.model)+' · '+data.capacity],['상태',esc(data.condition)]])}`;}
  else if(id==='moving'){const amount={'원룸 · 1톤':180000,'투룸 · 2.5톤':420000,'가족 이사 · 5톤':780000}[data.size];details=`${detailTable([['출발',esc(data.from)],['도착',esc(data.to)],['일정',data.date]])}<p class="small muted">가상 파트너의 비교 견적 · 운송과 기본 상하차 포함</p><div class="quote-options">${[['가벼운 이사',amount],['우리동네 운송',amount+30000],['새출발 이사',amount+50000]].map(([name,p],n)=>`<label><input type="radio" name="moving-partner" value="${n}" ${n===0?'checked':''}><span><b>${name}</b><small>시간 예약 · 기본 상하차</small></span><strong>${fmt(p)}원</strong></label>`).join('')}</div><p class="note">계단·장거리·포장·해체·설치는 별도 산정돼요. 실제 운송 신청은 중고상품의 정찰 운송 화면에서 세부 비용을 확인할 수 있어요.</p>`;}
  else details=detailTable(Object.entries(data).map(([k,v])=>[({item:'기부 물품',count:'수량',method:'전달 방법',date:'희망일',size:'예상 규모',type:'작업 유형'})[k],esc(v)]))+ (id==='donation'?'<p class="note">기부영수증 발급 여부와 인정 금액은 실제 기부처의 물품 검수 결과에 따라 정해져요.</p>':'');
  openModal(titles[id],`${details}${btn(id==='phone'?'견적 보관하기':'이 내용으로 요청 저장','extra-save',`data-id="${id}"`,'wide')}${btn('다시 선택하기','extra-service',`data-id="${id}"`,'outline wide')}`);
 }
 function selectService(){openModal('대형폐기물 버리는 방식을 선택해 주세요',`<div class="disposal-options">${[['직접버림','직접 배출신고 후 버릴게요','주민센터 방문 불필요 · 지자체 금액 동일','selfdrop','지정 장소까지 직접 배출하고 예약번호를 붙여주세요.'],['내려드림','파트너가 방문해 대신 내려주세요','작업방식 선택 가능 · 해체·분리 지원','entrust','혼자 옮기기 어려운 물건을 집 안에서 배출 장소까지 옮겨드려요.'],['재활용','다시 쓸 수 있도록 나눌게요','분리배출 · 자원순환 참여','resell','아직 쓸 수 있는 자원이 새로운 쓰임을 만날 수 있어요.']].map(([id,title,tags,img,desc])=>`<button type="button" class="disposal-option ${disposalChoice===id?'selected':''}" data-action="disposal-pick" data-id="${id}" aria-pressed="${disposalChoice===id}"><span><small>${id}</small><b>${title}</b>${disposalChoice===id?`<p>${desc}</p>`:''}<em>${tags}</em></span><img src="assets/${img}.svg" alt=""></button>`).join('')}</div>${btn('다음','booking',`data-service="${disposalChoice||''}" ${!disposalChoice?'disabled':''}`,'wide')}`);}
 return {render,dispose:()=>dispose(),action(a,d){
  if(a==='service-select'){disposalChoice=null;selectService();}
  else if(a==='disposal-pick'){disposalChoice=d.id;selectService();}
  else if(a==='extra-service')extra(d.id);
  else if(a==='extra-review')review(d.id);
  else if(a==='extra-save'){if(!extraIntent)return true;if(!s().inquiries)s().inquiries=[];const partner=document.querySelector('input[name="moving-partner"]:checked')?.value;s().inquiries.unshift({...extraIntent,partner,date:today(),status:'저장 완료'});save();const service=extraIntent.service;extraIntent=null;openModal('나의 요청에 저장했어요',`<div class="success-icon">${icon('check')}</div><h3 class="success-title">${titles[service]}</h3><p class="success-copy">선택한 조건을 보관했어요.<br>마이페이지에서 다시 확인할 수 있어요.</p>${btn('나의 요청 보기','extra-history','','wide')}`);}
  else if(a==='extra-history')openModal('나의 서비스 요청',`<div class="request-history">${s().inquiries?.length?s().inquiries.map(r=>`<article><h3>${titles[r.service]||esc(r.service)}</h3><p>${r.date} · ${r.status||'저장 완료'}</p>${detailTable(Object.entries(r.data||{size:r.size||'-'}).map(([k,v])=>[({model:'기종',capacity:'용량',condition:'상태',item:'물품',count:'수량',method:'전달',date:'희망일',from:'출발',to:'도착',size:'규모',type:'유형'})[k]||k,esc(v)]))}</article>`).join(''):'<p class="success-copy">아직 저장한 서비스 요청이 없어요.</p>'}</div>${btn('확인','close','','wide')}`);
  else if(a==='banner-next'){const el=document.querySelector('#banner-track');el?.scrollTo({left:((current+1)%5)*el.clientWidth,behavior:globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
  else if(a==='banner-pause'){paused=!paused;const b=document.querySelector('#banner-pause');b.textContent=paused?'▶':'Ⅱ';b.setAttribute('aria-label',paused?'배너 자동 넘김 시작':'배너 자동 넘김 일시정지');}
  else return false;return true;
 }};
}
