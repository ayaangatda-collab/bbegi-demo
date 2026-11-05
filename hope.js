import {fmt} from './model.js?v=84c050cff1c8';
import {t} from './i18n-core.js?v=84c050cff1c8';

const storeTypes=['카페 · 베이커리','음식점 · 주점','소매 · 편의점','사무 · 공유오피스','미용 · 서비스','기타 업종'];
const itemOptions=['냉장고 · 냉동고','조리기구 · 식기','테이블 · 의자','진열대 · 선반','계산대 · 집기','간판 · 조명','포장재 · 소모품','기타 폐기물'];
const regions=['서울 성동구 성수1가1동','서울 마포구 연남동','경기 고양시 일산동구'];
const steps=['접수','현장 확인','수거 · 철거','공사내역서'];
const agencySteps=[
 {t:'정산서류 제출',d:'폐업사실증명 · 세금계산서 · 이체확인증 등 정산서류를 제출했어요.'},
 {t:'공단 접수',d:'소상공인시장진흥공단에 정산서류가 접수됐어요.'},
 {t:'서류 검토',d:'공단 담당자가 제출 서류와 철거 전후 사진을 확인해요.'},
 {t:'지원금 결정',d:'지원 한도 안에서 지급 금액이 확정돼요.'},
 {t:'지급 완료',d:'등록한 계좌로 지원금이 입금돼요.'}
];
const uploadDocs=[
 {id:'bizLicense',t:'사업자등록증',h:'사업자등록증 사본 (이미지 · PDF)',kind:'doc'},
 {id:'photoIn',t:'철거 전 내부 사진',h:'매장 내부가 보이는 사진',kind:'image'},
 {id:'photoOut',t:'철거 전 외부 사진',h:'간판 · 출입구가 보이는 사진',kind:'image'},
 {id:'lease',t:'사업장 임대차계약서',h:'임대차계약서 사본 (이미지 · PDF)',kind:'doc'},
 {id:'vat',t:'부가가치세 과세표준증명',h:'국세청 발급 과세표준증명 (이미지 · PDF)',kind:'doc'}
];
const MAX_FILE=10*1024*1024;
const eventLabels=['신청 접수','담당자 배정','현장 확인','수거 · 철거 완료','처리장 도착','최종 처리 완료'];
const typeBase={'카페 · 베이커리':300000,'음식점 · 주점':350000,'소매 · 편의점':250000,'사무 · 공유오피스':200000,'미용 · 서비스':220000,'기타 업종':250000};
// 공식 안내 기준: 전용면적 3.3㎡(1평)당 20만원 이내, 최대 600만원(부가세 지원 제외).
const LIMIT_PER_PYEONG=200000;
const LIMIT_CAP=6000000;
const round1k=n=>Math.round(n/1000)*1000;

const won=n=>fmt(Math.round(Number(n)||0))+'원';
const clamp=(n,min,max)=>Math.min(max,Math.max(min,Number(n)||min));
const num=n=>Number(String(n).replace(/[^\d]/g,''))||0;

export function quoteFor(d){
 const pyeong=clamp(d.size||10,3,200);
 const base=typeBase[d.type]||250000;
 const transport=round1k(60000+pyeong*30000);
 const dismantle=round1k(pyeong*180000);
 const waste=round1k(pyeong*90000);
 const total=base+transport+dismantle+waste;
 const limit=Math.min(pyeong*LIMIT_PER_PYEONG,LIMIT_CAP);
 const eligible=d.eligible!==false;
 const support=eligible?Math.min(total,limit):0;
 const self=total-support;
 return {base,transport,dismantle,waste,total,limit,support,self,pyeong,cap:LIMIT_CAP,perPyeong:LIMIT_PER_PYEONG,eligible};
}

const eligChecks=[
 {id:'lease',t:'임대차계약서를 제출할 수 있는 임차 사업장이에요.'},
 {id:'first',t:'점포철거비 지원을 받은 적이 없어요.'},
 {id:'commercial',t:'사업장이 주거용도 건축물이 아니에요.'},
 {id:'closing',t:'단순 이전이 아니라 폐업(예정)이에요.'},
 {id:'business',t:'영리 사업자이며 희망리턴패키지 제외 업종이 아니에요.'}
];
const eligQuestions=[
 {id:'lease',t:'임대차계약서를 제출할 수 있는 임차 사업장인가요?',fail:'자가 건물이거나 무상 임차라면 점포철거비 지원 대상에서 제외됩니다.'},
 {id:'first',t:'점포철거비 지원을 받은 적이 없나요?',fail:'점포철거비 지원은 주민등록번호 기준 1회만 신청할 수 있습니다.'},
 {id:'commercial',t:'사업장이 주거용도 건축물이 아닌가요?',fail:'건축물대장상 용도가 주택·아파트 등 주거용이면 지원되지 않습니다.'},
 {id:'closing',t:'단순 이전이 아닌 폐업(예정)인가요?',fail:'사업장 이전은 지원 대상이 아니며, 폐업 후 같은 장소 재창업은 3년간 제한됩니다.'},
 {id:'business',t:'영리 사업자이며 희망리턴패키지 제외 업종이 아닌가요?',fail:'비영리 사업자·법인이나 제외 업종은 지원되지 않습니다.'}
];

export function createHope({s,save,shell,flowShell,icon,esc,openModal,closeModal,toast,btn,detailTable,today,uid,go}){
 let estimate={type:'카페 · 베이커리',size:18,checks:{}};
 let applyStep=1,applyDraft=null,started=false,previewApp=null;
 let flowMode=false,autoMode=false,autoTimer=null;

 const ymd=at=>{const d=at?new Date(at):new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
 const stamp=at=>{const d=new Date(at);return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`};
 const apps=()=>s().hopeApplications||[];
 const reserved=n=>'HR-'+String(n||Date.now()).slice(-6);

 /* ---------- 예상 지원금 ---------- */
 function paintQuote(){
  const box=document.querySelector('#hope-quote');
  if(!box)return;
  const checked=eligChecks.filter(c=>estimate.checks[c.id]).length;
  const eligible=checked===eligChecks.length;
  const q=quoteFor({...estimate,eligible});
  const capped=q.limit>=q.cap;
  const head=eligible
    ?`<div class="hope-quote-total"><small>${esc(t('예상 지원금'))}</small><strong>${won(q.support)}</strong><span>${esc(t('평당 20만원 이내 · 최대 600만원 · 부가세 제외'))}${capped?' · '+esc(t('한도 상한 적용')):''}</span></div>`
    :`<div class="hope-quote-total pending"><small>${esc(t('예상 지원금'))}</small><strong>${esc(t('확인 필요'))}</strong><span>${esc(t('지원 대상 확인 5개 항목을 모두 체크하면 계산돼요.'))}</span></div>`;
  const foot=eligible
    ?`<div class="hope-support-row"><span>${esc(t('지원 한도'))}<small><span>${t('{0}평').replace('{0}',q.pyeong)}</span> · <span>${won(q.limit)}</span></small></span><b class="blue">${won(q.limit)}</b></div><div class="hope-support-row self"><span>${esc(t('예상 자부담'))}<small>${esc(t('정리 비용에서 지원금을 뺀 금액'))}</small></span><b>${won(q.self)}</b></div>`
    :`<div class="hope-elig-progress">${esc(t('지원 대상 확인'))} <b>${checked} / ${eligChecks.length}</b><div class="hope-elig-bar"><span style="width:${Math.round(checked/eligChecks.length*100)}%"></span></div><small>${esc(t('체크하지 않은 항목이 있으면 지원금을 계산하지 않아요.'))}</small></div>`;
  box.innerHTML=head+foot;
  document.querySelectorAll('[data-action="hope-est-type"]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.value===estimate.type)));
  document.querySelectorAll('[data-action="hope-elig-check"]').forEach(el=>{el.checked=!!estimate.checks[el.dataset.id]});
  const size=document.querySelector('#hope-size-value');
  if(size)size.textContent=t('{0}평').replace('{0}',estimate.size);
  const count=document.querySelector('#hope-elig-count');
  if(count)count.textContent=`${checked} / ${eligChecks.length}`;
 }

 /* ---------- 희망리턴패키지 안내 ---------- */
 function intro(){
  shell(`<article class="hope-landing hope-intro"><section class="hope-hero"><span class="hope-badges"><i>${esc(t('희망리턴패키지 안내'))}</i><i class="ghost">${esc(t('소상공인시장진흥공단'))}</i></span><h1 data-i18n-text="${esc('점포 정리,\n지원금부터 확인하세요')}">점포 정리,<br>지원금부터 확인하세요</h1><p>${esc(t('폐업을 앞둔 소상공인의 사업 정리와 재기를 돕는 소상공인시장진흥공단의 지원 사업이에요. 점포철거비는 전용면적 1평당 20만원 이내, 최대 600만원까지 지원됩니다.'))}</p><div class="hope-hero-foot"><span>${icon('info')}${esc(t('2025년 7월 11일 이후 폐업 기준'))}</span><img src="assets/color/house.svg" alt="" width="92" height="92"></div></section>
  <div class="hope-intro-actions">${btn(t('예상 지원금 계산하기'),'hope-start-calc','','wide')}<button type="button" class="btn outline wide" data-action="hope-jump" data-id="hope-exclusions">${esc(t('지원 제외 사유 보기'))}</button></div>
  <section class="hope-section"><h2>${esc(t('누가 지원받을 수 있나요?'))}</h2><div class="hope-who">${[['폐업 · 폐업 예정 소상공인','사업을 정리하려는 개인사업자 · 소상공인'],['경영위기 소상공인','매출 감소 등으로 경영 정상화가 필요한 소상공인']].map(([title,desc])=>`<article><span>${icon('user')}</span><div><b>${esc(t(title))}</b><p>${esc(t(desc))}</p></div></article>`).join('')}</div><p class="note">${esc(t('상시 신청이 아니라 사업별 공고 기간에 접수하며, 세부 자격은 공고문 기준으로 확인해야 해요.'))}</p></section>
  <section class="hope-section"><h2>${esc(t('무엇을 지원하나요?'))}</h2><div class="hope-tracks">${[['원스톱 폐업 지원',['사업정리 컨설팅 (5개 분야 중 최대 3개)','점포철거비 평당 20만원 이내 · 최대 600만원','법률자문 · 채무조정 지원']],['특화 취업 지원',['단계별 재취업 교육','전직장려수당 최대 100만원']],['재기 사업화 지원',['경영 · 재창업 진단과 교육','사업화 자금 최대 2,000만원 (총사업비의 50%)']]].map(([title,rows])=>`<article><b>${esc(t(title))}</b><ul>${rows.map(r=>`<li>${esc(t(r))}</li>`).join('')}</ul></article>`).join('')}</div></section>
  <section class="hope-section"><h2>${esc(t('점포철거비 지원 한도'))}</h2><div class="hope-limit"><div><small>${esc(t('지원 단가'))}</small><b>${esc(t('평당 20만원 이내'))}</b></div><div><small>${esc(t('최대 한도'))}</small><b>600만원</b></div><p>${esc(t('부가세는 지원 대상에서 제외돼요. 폐업일이 2025년 7월 11일 이전이면 최대 400만원이 적용됩니다.'))}</p></div><p class="note">${esc(t('실제 지급액은 제출 서류와 현장 확인 결과에 따라 달라지며, 한도는 연도별 공고에 따라 바뀔 수 있어요.'))}</p></section>
  <section class="hope-section" id="hope-exclusions"><h2>${esc(t('지원 제외 사유'))}</h2><p class="hope-lead">${esc(t('아래 항목에 하나라도 해당하면 점포철거비 지원을 받을 수 없어요.'))}</p><div class="hope-excl-list">${eligQuestions.map(q=>`<div><span>${icon('close')}</span><p>${esc(t(q.fail))}</p></div>`).join('')}</div><p class="note">${esc(t('이 확인은 공단의 공식 심사가 아닌 안내용 예시예요. 정확한 판정은 소상공인시장진흥공단 상담으로 확인해 주세요.'))}</p>${btn(t('예상 지원금 계산하며 확인하기'),'hope-start-calc','','outline wide')}</section>
  <section class="hope-section"><h2>${esc(t('신청 절차'))}</h2><ol class="hope-flow">${[['사업정리 컨설팅 신청','희망리턴패키지 누리집에서 폐업 · 정리 상담을 먼저 신청해요.'],['서류 · 현장 확인','임대차계약서 등 서류를 내고 담당자의 현장 확인을 받아요.'],['철거 · 원상복구','확인된 범위대로 철거하고 완료 사진과 증빙을 남겨요.'],['지원금 지급','증빙 확인 후 지원 한도 안에서 지원금이 지급돼요.']].map(([title,desc],n)=>`<li><i>${n+1}</i><div><b>${esc(t(title))}</b><p>${esc(t(desc))}</p></div></li>`).join('')}</ol></section>
  <section class="hope-section"><h2>${esc(t('문의처'))}</h2><div class="hope-contact-info">${[['소상공인 통합콜센터','1533-0100'],['중소기업 통합콜센터','1357']].map(([name,tel])=>`<div><small>${esc(t(name))}</small><b>${esc(tel)}</b></div>`).join('')}</div><a class="btn outline wide" href="https://www.sbiz.or.kr/nhrp/main.do" target="_blank" rel="noopener">${esc(t('희망리턴패키지 공식 누리집'))} ${icon('arrow')}</a></section>
  <div class="hope-cta-card"><b>${esc(t('우리 매장 지원금은 얼마일까요?'))}</b><p>${esc(t('업종과 평수만 넣으면 예상 지원금과 자부담을 바로 계산해요.'))}</p>${btn(t('예상 지원금 계산하기'),'hope-start-calc','','wide')}</div>
  <div class="hope-disclaimer">${icon('info')}<p>${esc(t('이 화면은 협업 제안을 위한 시연입니다. 지원 제도 안내는 공단 공식 공고를 요약한 것이며, 신청 · 지급은 공단 절차로만 이루어집니다.'))}</p></div></article>`);
 }

 /* ---------- 시연 랜딩 ---------- */
 const findApp=id=>apps().find(x=>x.id===id)||(previewApp&&previewApp.id===id?previewApp:null);
 function advanceApp(app){
  if(!app||app.stage>=5)return false;
  app.stage=clamp((app.stage||0)+1,0,5);
  app.events=app.events||[];
  if(!app.events.some(e=>e.stage===app.stage))app.events.push({stage:app.stage,at:Date.now()});
  if(app.stage>=5)app.status='완료';
  if(app.id!=='demo-preview')save();
  return true;
 }
 function stopAuto(){autoMode=false;if(autoTimer){clearTimeout(autoTimer);autoTimer=null;}}
 function autoStep(id){
  const app=findApp(id);if(!app||!autoMode){stopAuto();return;}
  advanceApp(app);rerender(flowMode?'hope-flow-status':'hope-status',true);
  if(app.stage>=5){stopAuto();toast(t('시연이 끝났어요. 공사내역서를 확인해 보세요.'));return;}
  autoTimer=setTimeout(()=>autoStep(id),1500);
 }

 function landing(){
  applyDraft=null;applyStep=1;
  const latest=apps()[0];
  shell(`<article class="hope-landing"><button type="button" class="hope-back-link" data-action="hope-intro">${esc(t('희망리턴패키지 안내 보기'))} ${icon('chevron')}</button><section class="hope-hero"><span class="hope-badges"><i>${esc(t('희망리턴패키지 협업 시연'))}</i><i class="ghost">${esc(t('가상 데이터'))}</i></span><h1 data-i18n-text="${esc('가게의 마지막 정리까지,\n빼기가 함께할게요')}">가게의 마지막 정리까지,<br>빼기가 함께할게요</h1><p>${esc(t('폐업 · 이전을 준비하는 소상공인의 집기 처분, 철거, 폐기물 처리, 증빙까지 한 흐름으로 정리합니다.'))}</p><div class="hope-hero-foot"><span>${icon('shield')}${esc(t('소상공인시장진흥공단 협업 제안용'))}</span><img src="assets/color/house.svg" alt="" width="92" height="92"></div></section>
  ${latest?`<button type="button" class="hope-latest" data-action="hope-open" data-id="${esc(latest.id)}"><span class="hope-latest-icon">${icon('truck')}</span><span><small>${esc(t('진행 중인 신청'))}</small><b><span ${latest.localized?'':'translate="no"'}>${esc(latest.localized?t(latest.store?.name||''):latest.store?.name||'')}</span> · ${esc(t(latest.status))}</b><em>${esc(latest.reservation)}</em></span>${icon('chevron')}</button>`:''}
  ${estimatorBlock(false)}
  <section class="hope-section"><h2>${esc(t('왜 빼기와 함께할까요?'))}</h2><div class="hope-values">${[['box','한 번에 정리','집기 처분부터 철거 · 폐기물까지 한 번에 접수해요.'],['clock','비용을 투명하게','운송 · 해체 · 처리 비용을 항목별로 미리 확인해요.'],['shield','처리 증빙까지','처리 확인서와 요약을 협업 검토에 활용할 수 있어요.']].map(([ic,title,desc])=>`<article><span>${icon(ic)}</span><b>${esc(t(title))}</b><p>${esc(t(desc))}</p></article>`).join('')}</div></section>
    <section class="hope-section"><h2>${esc(t('서류 준비 체크리스트'))}</h2><div class="hope-docs">${['사업자등록증 사본','폐업 · 이전 사실 증빙','임대차계약서 사본','현장 사진 (선택)'].map((v,n)=>`<div><span>${n+1}</span><p>${esc(t(v))}</p>${icon('check')}</div>`).join('')}</div><p class="note">${esc(t('서류는 시연 화면에서 실제로 제출되지 않아요. 협업 시에는 공단 접수 기준에 맞춰 안내합니다.'))}</p></section>
  <section class="hope-section"><h2>${esc(t('자주 묻는 질문'))}</h2><div class="hope-faq">${[['희망리턴패키지 지원을 확정해 주나요?','아니요. 이 화면은 협업 예시이며, 지원 대상 · 금액 · 조건은 공단의 별도 심사로 정해져요.'],['실제로 수거 · 철거가 진행되나요?','아니요. 신청과 진행은 가상 데이터로 체험되며 실제 배출 · 철거 · 결제는 발생하지 않아요.'],['처리 확인서를 바로 받을 수 있나요?','시연에서는 진행 단계를 올리면 가상 확인서를 미리 볼 수 있어요. 실제 발급은 처리 완료 후 이루어집니다.'],['4개 언어로 모두 볼 수 있나요?','네. 화면 오른쪽 위 언어 버튼에서 한국어 · English · 日本語 · 简体中文를 선택할 수 있어요.']].map(([q,a])=>`<details><summary>${esc(t(q))}</summary><p>${esc(t(a))}</p></details>`).join('')}</div></section>
  <div class="hope-cta-card"><b>${esc(t('우리 매장도 정리해 볼까요?'))}</b><p>${esc(t('3단계 입력으로 예상 지원금과 진행 흐름을 확인해요.'))}</p><button type="button" class="hope-demo-link" data-action="hope-demo">${esc(t('예시 진행 화면 보기'))} ›</button></div></article><div class="hope-bottom">${btn(t('점포 정리 신청 시작'),'hope-start','','wide')}</div>`);
  paintQuote();
 }

 function estimatorBlock(compact){
  const lead=compact?t('매장 조건과 지원 대상 여부를 확인하면 예상 지원금이 바로 계산돼요.'):t('매장 조건과 지원 대상 여부를 확인하면 예상 지원금이 바로 계산돼요.');
  return `<section class="hope-section${compact?' flow-estimator':''}"><h2>${esc(t('예상 지원금 계산'))}</h2><p class="hope-lead">${esc(lead)}</p><div class="hope-estimator"><div class="hope-field"><span>${esc(t('업종'))}</span><div class="hope-chips">${storeTypes.map(v=>`<button type="button" class="hope-chip" data-action="hope-est-type" data-value="${esc(v)}" aria-pressed="${estimate.type===v}">${esc(t(v))}</button>`).join('')}</div></div><div class="hope-field"><span>${esc(t('매장 평수'))}</span><div class="hope-stepper"><button type="button" data-action="hope-size" data-delta="-1" aria-label="${esc(t('평수 줄이기'))}">−</button><b id="hope-size-value">${t('{0}평').replace('{0}',estimate.size)}</b><button type="button" data-action="hope-size" data-delta="1" aria-label="${esc(t('평수 늘리기'))}">+</button></div></div><div class="hope-field hope-elig-field"><div class="hope-elig-head"><span>${esc(t('지원 대상 확인'))}</span><b id="hope-elig-count" class="hope-elig-count">0 / ${eligChecks.length}</b></div>${eligChecks.map(c=>`<label class="hope-check"><input type="checkbox" data-action="hope-elig-check" data-id="${c.id}" ${estimate.checks[c.id]?'checked':''}><span>${esc(t(c.t))}</span></label>`).join('')}</div><div id="hope-quote"></div><p class="note">${esc(t('지원금은 평당 20만원 · 최대 600만원 한도로 계산한 예시예요. 실제 지급액은 공단 심사와 증빙 확인으로 결정됩니다.'))}</p></div></section>`;
 }

 /* ---------- 시연 홈 ---------- */
 function flowHome(){
  const latest=apps()[0];
  const guide=[['1','신청서 작성','상호명 · 업종 · 평수 · 처분 품목을 3단계로 입력해요.'],
   ['2','진행 확인','단계 버튼으로 직접 넘기거나 자동으로 진행해 보세요.'],
   ['3','공사내역서','처리 완료 후 업체가 작성한 공사내역서를 PDF나 이미지로 저장해요.']];
  flowShell(`<article class="flow-home"><section class="flow-hero"><span class="hope-badges"><i>${esc(t('신청 흐름 시연'))}</i><i class="ghost">${esc(t('가상 데이터'))}</i></span><h1 data-i18n-text="${esc('점포 정리,\n신청부터 확인서까지')}">점포 정리,<br>신청부터 확인서까지</h1><p>${esc(t('희망리턴패키지 점포철거비 지원을 가정한 시연이에요. 신청서를 작성하면 접수 → 현장 확인 → 수거 · 철거 → 처리 확인서까지 직접 진행해 볼 수 있어요.'))}</p><div class="flow-hero-meta"><span>${icon('clock')}${esc(t('약 3분'))}</span><span>${icon('shield')}${esc(t('실제 접수 · 결제 없음'))}</span></div></section>
  ${estimatorBlock(true)}
  <div class="flow-start"><button type="button" class="btn wide" data-action="hope-flow-start">${esc(t('점포 정리 신청 시작'))}</button><p>${esc(t('입력한 내용은 이 브라우저에만 저장되고 실제 신청은 이루어지지 않아요.'))}</p></div>
  ${latest?`<button type="button" class="hope-latest" data-action="hope-flow-continue" data-id="${esc(latest.id)}"><span class="hope-latest-icon">${icon('truck')}</span><span><small>${esc(t('이어서 볼 신청'))}</small><b><span ${latest.localized?'':'translate="no"'}>${esc(latest.localized?t(latest.store?.name||''):latest.store?.name||'')}</span> · ${esc(t(latest.status))}</b><em>${esc(latest.reservation)}</em></span>${icon('chevron')}</button>`:''}
  <section class="flow-steps-card"><h2>${esc(t('이렇게 진행돼요'))}</h2><ol>${guide.map(([n,title,desc])=>`<li><i>${n}</i><div><b>${esc(t(title))}</b><p>${esc(t(desc))}</p></div></li>`).join('')}</ol></section>
  <a class="flow-info-card" href="#/hope-intro" aria-label="${esc(t('희망리턴패키지 지원 제도 안내'))}"><span class="flow-info-icon">${icon('info')}</span><span class="flow-info-copy"><small>${esc(t('지원 제도 안내'))}</small><b>${esc(t('희망리턴패키지 점포철거비'))}</b><span>${esc(t('지원 대상 · 제외 사유 · 신청 절차를 확인해요.'))}</span></span><span class="flow-info-go">${esc(t('자세히'))}${icon('chevron')}</span></a></article>`);
  paintQuote();
 }

 /* ---------- 신청 ---------- */
 function applyMarkup(){
  const d=applyDraft;
  return `<article class="hope-apply"><div class="hope-progress" aria-label="${esc(t('신청 단계'))}">${steps.map((v,n)=>`<div class="${n<=applyStep-1?'active':''}"><i>${n+1}</i><span>${esc(t(v))}</span></div>`).join('')}</div><div class="hope-apply-head"><small>${esc(t('점포 정리 신청'))}</small><h1>${esc(t('매장 정보를 차례로 알려주세요'))}</h1></div><form id="hope-form" novalidate>
  <fieldset class="hope-step" data-step="1" ${applyStep!==1?'hidden':''}><legend>${esc(t('1. 점포 정보'))}</legend><label class="form-field"><span>${esc(t('상호명'))}</span><input name="storeName" maxlength="40" value="${esc(d.store.name)}" placeholder="${esc(t('예: 성수동 작은 카페'))}" autocomplete="organization"></label><label class="form-field"><span>${esc(t('업종'))}</span><select name="storeType">${storeTypes.map(v=>`<option value="${esc(v)}" ${d.store.type===v?'selected':''}>${esc(t(v))}</option>`).join('')}</select></label><label class="form-field"><span>${esc(t('매장 평수'))}</span><input name="storeSize" type="number" inputmode="numeric" min="3" max="200" value="${d.store.size}" placeholder="${esc(t('예: 18'))}"></label><label class="form-field"><span>${esc(t('지역'))}</span><select name="storeRegion">${regions.map(v=>`<option value="${esc(v)}" ${d.store.region===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label><label class="form-field"><span>${esc(t('상세 주소 (동 · 층)'))}</span><input name="storeAddress" maxlength="60" value="${esc(d.store.address)}" placeholder="${esc(t('예: 1층 101호'))}"></label><label class="form-field"><span>${esc(t('폐업 · 이전 예정일'))}</span><input name="closingDate" type="date" min="${today()}" value="${d.store.closingDate}"></label></fieldset>
  <fieldset class="hope-step" data-step="2" ${applyStep!==2?'hidden':''}><legend>${esc(t('2. 처분 범위'))}</legend><p class="hope-lead">${esc(t('처분할 집기를 하나 이상 선택해 주세요.'))}</p><div class="hope-choices">${itemOptions.map(v=>`<label class="hope-choice"><input type="checkbox" name="items" value="${esc(v)}" ${d.items.includes(v)?'checked':''}><span>${esc(t(v))}</span></label>`).join('')}</div><label class="form-field"><span>${esc(t('방문 희망일'))}</span><input name="visitDate" type="date" min="${today()}" value="${d.visitDate}"></label></fieldset>
  <fieldset class="hope-step" data-step="3" ${applyStep!==3?'hidden':''}><legend>${esc(t('3. 신청자 정보'))}</legend><label class="form-field"><span>${esc(t('담당자명'))}</span><input name="manager" maxlength="20" value="${esc(d.manager)}" placeholder="${esc(t('예: 김사장'))}" autocomplete="name"></label><label class="form-field"><span>${esc(t('연락처'))}</span><input name="phone" type="tel" inputmode="tel" maxlength="13" value="${esc(d.phone)}" placeholder="010-0000-0000" autocomplete="tel"></label><label class="form-field"><span>${esc(t('사업자등록번호'))}</span><input name="bizNo" inputmode="numeric" maxlength="12" value="${esc(d.bizNo)}" placeholder="000-00-00000"></label><div class="hope-upload-sec"><div class="hope-upload-head"><p>${esc(t('증빙 서류 업로드'))}</p><b id="hope-upload-count">0 / ${uploadDocs.length}</b></div><p class="hope-upload-lead">${esc(t('사진은 JPG · PNG, 서류는 이미지나 PDF로 올려주세요. 파일당 10MB까지 가능해요.'))}</p><div id="hope-uploads">${docUploadSlots()}</div><button type="button" class="hope-sample-btn" data-action="hope-sample-files">${icon('check')}${esc(t('샘플 파일로 채워 보기'))}</button></div><div id="hope-review" class="hope-review"></div><label class="check-row hope-consent"><input type="checkbox" id="hope-consent"><span>${esc(t('입력한 정보는 이 브라우저에만 저장되며 실제 신청 · 결제 · 지원금 지급이 발생하지 않음을 확인했어요.'))}</span></label><p class="note">${esc(t('상호명 · 담당자명 · 연락처는 시연용 예시로 입력해 주세요. 실제 개인정보를 입력하지 않아도 됩니다.'))}</p></fieldset>
  <div id="hope-error" class="error-text" role="alert"></div>
  <div class="hope-actions">${applyStep<3?btn(t('다음'),'hope-next','','wide'):btn(t('시연 신청 완료'),'hope-submit','','wide')}${applyStep>1?btn(t('이전'),'hope-back','','outline wide'):(flowMode?'':`<a class="btn outline wide" href="#/hope">${esc(t('취소'))}</a>`)}</div></form></article>`;
 }
 function flowBar(){
  return `<div class="flow-bar"><span class="flow-bar-badge">${icon('box')}${esc(t('신청 흐름 시연'))}</span><p>${esc(t('신청부터 공사내역서 발급까지 한 번에 체험할 수 있어요.'))}</p></div>`;
 }
 function applyPage(flow=false){
  if(!started||!applyDraft){started=true;applyStep=1;applyDraft={store:{name:'',type:storeTypes[0],size:18,region:s().region,address:'',closingDate:today()},items:[],visitDate:today(),manager:'',phone:'',bizNo:'',files:{}};}
  const params=new URLSearchParams(location.hash.split('?')[1]||'');
  const want=Number(params.get('step'));
  if(want>=1&&want<=3){
   applyStep=want;
   if(params.get('demo')==='1'&&!applyDraft.store.name){
    applyDraft.store={name:'성수동 작은 카페',type:storeTypes[0],size:18,region:s().region,address:'1층 101호',closingDate:today()};
    applyDraft.items=[itemOptions[0],itemOptions[2],itemOptions[5]];
    applyDraft.manager=t('김사장');applyDraft.phone='010-0000-0000';applyDraft.bizNo='000-00-00000';
    fillSamples(true);
   }
  }
  const view=applyMarkup();
  (flow?flowShell:shell)((flow?flowBar():'')+view);
  if(applyStep===3){paintReview();bindUploads();}
 }

 function docUploadSlots(){
  const d=applyDraft;if(!d)return '';
  return uploadDocs.map(u=>{const f=d.files?.[u.id];
   return `<div class="hope-upload${f?' filled':''}"><div class="hope-upload-top"><b>${esc(t(u.t))}</b><span class="hope-upload-req">${esc(t('필수'))}</span></div><p class="hope-upload-hint">${esc(t(u.h))}</p>${f?`<div class="hope-upload-file">${f.thumb?`<img src="${f.thumb}" alt="">`:`<span class="hope-upload-icon">${icon('box')}</span>`}<div class="hope-upload-meta"><b>${esc(f.name)}</b><small>${f.size?esc(fmtSize(f.size)):esc(t('샘플 파일'))}</small></div><div class="hope-upload-acts"><button type="button" data-action="hope-file-pick" data-id="${u.id}">${esc(t('교체'))}</button><button type="button" class="danger" data-action="hope-file-remove" data-id="${u.id}" aria-label="${esc(t('삭제'))}">${esc(t('삭제'))}</button></div></div>`:`<button type="button" class="hope-upload-btn" data-action="hope-file-pick" data-id="${u.id}">${icon('plus')}${esc(t('파일 선택'))}</button>`}<input type="file" id="hope-file-${u.id}" data-doc="${u.id}" accept="${u.kind==='image'?'image/jpeg,image/png,image/webp':'.jpg,.jpeg,.png,.pdf'}" hidden></div>`}).join('');
 }
 function fmtSize(n){return n>=1048576?(n/1048576).toFixed(1)+' MB':Math.max(1,Math.round(n/1024))+' KB';}
 function paintUploads(){
  const box=document.querySelector('#hope-uploads');if(!box||!applyDraft)return;
  box.innerHTML=docUploadSlots();
  const count=document.querySelector('#hope-upload-count');
  if(count)count.textContent=`${uploadDocs.filter(u=>applyDraft.files?.[u.id]).length} / ${uploadDocs.length}`;
 }
 function cleanFileName(name){return String(name||'file').slice(0,60);}
 async function takeFile(id,file){
  if(!applyDraft||!file)return;
  const meta=uploadDocs.find(u=>u.id===id);if(!meta)return;
  const okType=meta.kind==='image'?/^image\/(jpeg|png|webp)$/.test(file.type):/^(image\/(jpeg|png|webp)|application\/pdf)$/.test(file.type);
  if(!okType){toast(t(meta.kind==='image'?'JPG · PNG 사진만 올릴 수 있어요.':'이미지 또는 PDF만 올릴 수 있어요.'));return;}
  if(file.size>MAX_FILE){toast(t('파일 용량은 10MB까지 올릴 수 있어요.'));return;}
  applyDraft.files=applyDraft.files||{};
  const entry={name:cleanFileName(file.name),size:file.size,type:file.type,at:Date.now()};
  if(/^image\//.test(file.type)){
   try{entry.thumb=await thumbOf(file);}catch{entry.thumb='';}
  }
  applyDraft.files[id]=entry;
  paintUploads();
  const box=document.querySelector('#hope-error');if(box)box.textContent='';
  toast(t('파일을 첨부했어요.'));
 }
 function thumbOf(file){
  return new Promise((resolve,reject)=>{
   const url=URL.createObjectURL(file);const img=new Image();
   img.onload=()=>{try{
    const max=420;const scale=Math.min(1,max/Math.max(img.width,img.height));
    const c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.width*scale));c.height=Math.max(1,Math.round(img.height*scale));
    c.getContext('2d').drawImage(img,0,0,c.width,c.height);
    URL.revokeObjectURL(url);resolve(c.toDataURL('image/jpeg',0.6));
   }catch(e){URL.revokeObjectURL(url);reject(e);}};
   img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('image'));};
   img.src=url;
  });
 }
 function sampleThumb(label,tone){
  const c=document.createElement('canvas');c.width=320;c.height=220;const x=c.getContext('2d');
  if(!x)throw new Error('canvas');
  x.fillStyle=tone;x.fillRect(0,0,320,220);
  x.fillStyle='#ffffff';x.font='bold 22px sans-serif';x.textAlign='center';x.fillText(label,160,118);
  x.font='14px sans-serif';x.fillText('SAMPLE',160,150);
  return c.toDataURL('image/jpeg',0.7);
 }
 function fillSamples(prefill){
  if(!applyDraft)return;
  applyDraft.files=applyDraft.files||{};
  const tones=['#4f63ff','#8b6cf0','#2fa27a','#e08a45','#5c6b8a'];
  uploadDocs.forEach((u,n)=>{
   if(applyDraft.files[u.id])return;
   let thumb='';
   try{thumb=sampleThumb(t(u.t),tones[n%tones.length]);}catch{}
   applyDraft.files[u.id]={name:`sample-${u.id}.jpg`,size:0,type:'image/jpeg',thumb,sample:true,at:Date.now()};
  });
  if(!prefill){paintUploads();toast(t('샘플 파일 5개를 첨부했어요.'));}
 }
 function bindUploads(){
  document.querySelectorAll('input[type="file"][data-doc]').forEach(input=>{
   input.addEventListener('change',()=>{const f=input.files?.[0];input.value='';if(f)takeFile(input.dataset.doc,f);});
  });
 }
 function formValues(form){
  try{
   const fd=new FormData(form);const out=[];
   for(const [k,v] of fd.entries())out.push([k,String(v)]);
   return out;
  }catch{
   if(!form||typeof form.querySelectorAll!=='function')return [];
   try{return [...form.querySelectorAll('input,select,textarea')].filter(el=>!el.disabled&&el.type!=='file').map(el=>[el.name,(el.type==='checkbox'||el.type==='radio')?(el.checked?el.value:''):String(el.value)]);}catch{return [];}
  }
 }
 function readForm(){
  const form=document.querySelector('#hope-form');
  if(!form||!applyDraft)return;
  const values=formValues(form);
  const data={get:k=>{const hit=values.find(v=>v[0]===k);return hit?hit[1]:null;},getAll:k=>values.filter(v=>v[0]===k).map(v=>v[1]).filter(Boolean)};
  applyDraft.store={name:String(data.get('storeName')||'').trim(),type:String(data.get('storeType')||storeTypes[0]),size:Number(data.get('storeSize')||0),region:String(data.get('storeRegion')||''),address:String(data.get('storeAddress')||'').trim(),closingDate:String(data.get('closingDate')||'')};
  applyDraft.items=data.getAll('items').map(String);
  applyDraft.visitDate=String(data.get('visitDate')||'');
  applyDraft.eligible=eligChecks.every(c=>estimate.checks[c.id]);
  applyDraft.manager=String(data.get('manager')||'').trim();
  applyDraft.phone=String(data.get('phone')||'').trim();
  applyDraft.bizNo=String(data.get('bizNo')||'').trim();

 }

 function fail(message,selector){
  const box=document.querySelector('#hope-error');
  if(box){box.textContent=message;try{box.scrollIntoView({behavior:'smooth',block:'center'});}catch{}}
  toast(message);
  if(selector)document.querySelector(selector)?.focus();
  return false;
 }

 function validate(step){
  readForm();
  const d=applyDraft;if(!d)return false;
  if(step===1){
   if(!d.store.name)return fail(t('상호명을 입력해 주세요.'),'[name="storeName"]');
   if(!d.store.size||d.store.size<3||d.store.size>200)return fail(t('매장 평수를 3~200 사이로 입력해 주세요.'),'[name="storeSize"]');
   if(!d.store.closingDate)return fail(t('폐업 · 이전 예정일을 선택해 주세요.'),'[name="closingDate"]');
   if(d.store.closingDate<today())return fail(t('오늘 이후 날짜를 선택해 주세요.'),'[name="closingDate"]');
  }
  if(step===2){
   if(!d.items.length)return fail(t('처분할 집기를 하나 이상 선택해 주세요.'),'[name="items"]');
   if(!d.visitDate)return fail(t('방문 희망일을 선택해 주세요.'),'[name="visitDate"]');
   if(d.visitDate<today())return fail(t('오늘 이후 날짜를 선택해 주세요.'),'[name="visitDate"]');
  }
  if(step===3){
   if(!d.manager)return fail(t('담당자명을 입력해 주세요.'),'[name="manager"]');
   if(!/^0\d{1,2}-?\d{3,4}-?\d{4}$/.test(d.phone))return fail(t('연락처를 확인해 주세요.'),'[name="phone"]');
   if(String(d.bizNo||'').replace(/\D/g,'').length!==10)return fail(t('사업자등록번호 10자리를 확인해 주세요.'),'[name="bizNo"]');
   const missing=uploadDocs.filter(u=>!d.files?.[u.id]);
   if(missing.length)return fail(`${t('첨부하지 않은 서류가 있어요')}: ${missing.map(u=>t(u.t)).join(', ')}`,'.hope-upload-sec');
   if(!document.querySelector('#hope-consent')?.checked)return fail(t('시연용 안내 확인에 체크해 주세요.'),'#hope-consent');
  }
  const box=document.querySelector('#hope-error');if(box)box.textContent='';
  return true;
 }

 function paintReview(){
  readForm();
  const d=applyDraft,box=document.querySelector('#hope-review');
  if(!d||!box)return;
  const q=quoteFor(d);
  box.innerHTML=`<h3>${esc(t('지원금 요약'))}</h3>${detailTable([['업종',esc(t(d.store.type))],['매장 평수',t('{0}평').replace('{0}',d.store.size)],['처분 품목',t('{0}종').replace('{0}',d.items.length)],['방문 희망일',d.visitDate],['예상 지원금',`<strong class="blue">${won(q.support)}</strong>`],['예상 자부담',won(q.self)]])}<p class="note">${esc(t('지원금은 평당 20만원 · 최대 600만원 한도로 계산한 예시이며 실제 지급되지 않아요.'))}</p>`;
 }

 function setStep(n){
  applyStep=clamp(n,1,3);
  document.querySelectorAll('.hope-step').forEach(el=>{el.hidden=Number(el.dataset.step)!==applyStep});
  document.querySelectorAll('.hope-progress>div').forEach((el,i)=>{el.classList.toggle('active',i<=applyStep-1)});
  const actions=document.querySelectorAll('.hope-actions .btn');
  if(actions.length){actions[0].textContent=t(applyStep<3?'다음':'시연 신청 완료');actions[0].dataset.action=applyStep<3?'hope-next':'hope-submit';}
  const back=document.querySelector('[data-action="hope-back"]');
  if(back)back.hidden=applyStep===1;
  if(applyStep===3)paintReview();
  window.scrollTo({top:0,behavior:'instant'});
 }

 function submit(){
  if(!validate(3)||!applyDraft)return;
  const d=applyDraft,q=quoteFor(d);
  if(apps().some(a=>a.store?.name===d.store.name&&a.store?.closingDate===d.store.closingDate&&a.status!=='취소')){toast(t('같은 조건의 신청이 이미 있어요.'));return;}
  const record={id:uid(),reservation:reserved(Date.now()),createdAt:Date.now(),status:'접수 완료',stage:0,store:{...d.store},items:[...d.items],visitDate:d.visitDate,eligible:d.eligible,applicant:{manager:d.manager,phone:d.phone,bizNo:d.bizNo,docs:uploadDocs.filter(u=>d.files?.[u.id]).map(u=>u.t),files:{...(d.files||{})}},quote:q,events:[{stage:0,at:Date.now()}]};
  s().hopeApplications=s().hopeApplications||[];s().hopeApplications.unshift(record);save();
  applyDraft=null;started=false;applyStep=1;
  stopAuto();
  const target=(flowMode?'hope-flow-status?id=':'hope-status?id=')+record.id;
  go(target);
  toast(t('시연 신청이 접수됐어요.'));
 }

 /* ---------- 진행 ---------- */
 const agencyStageOf=app=>Number.isFinite(app.agencyStage)?app.agencyStage:(app.stage>=5?0:0);
 function agencyCard(app,done){
  if(!done)return '';
  const st=agencyStageOf(app);const last=agencySteps.length-1;
  const q=app.quote||quoteFor(app);
  const cur=agencySteps[Math.min(st,last)];
  const payDate=(()=>{const d=new Date(app.createdAt||Date.now());d.setDate(d.getDate()+21);return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`})();
  const finished=st>=last;
  return `<section class="hope-section ag-track"><div class="hope-section-head"><h2>${esc(t('점포철거비 지원 현황'))}</h2><span class="pill ${finished?'green':''}">${esc(t(finished?'지급 완료':'진행 중'))}</span></div>
  <div class="ag-track-hero"><div class="ag-track-top"><span>${esc(t('지원금'))}</span><b>${won(q.support)}</b></div><div class="ag-track-bar"><span style="width:${Math.round(st/last*100)}%"></span></div><p class="ag-track-now">${esc(t(cur.t))} · ${st+1}/${agencySteps.length}</p><p class="ag-track-desc">${esc(t(cur.d))}</p></div>
  <ol class="ag-track-list">${agencySteps.map((v,n)=>{const on=n<=st;return `<li class="${on?'on':''} ${n===st&&!finished?'now':''}"><i>${on?'✓':n+1}</i><div><b>${esc(t(v.t))}</b><small>${esc(on?t('완료'):t('예정'))}</small></div></li>`}).join('')}</ol>
  <div class="ag-track-meta">${detailTable([[t('예상 지급일'),finished?esc(t('지급 완료')):payDate],[t('지급 계좌'),esc(t('등록된 계좌 (가상)'))],[t('처리 상태'),esc(t(finished?'지원금 지급 완료':'공단 검토 진행 중'))]])}</div>
  ${st<last?btn(t('공단 진행 단계 (시연)'),'hope-agency-advance',`data-id="${esc(app.id)}"`,'outline wide'):''}
  <p class="note">${esc(t('공단 진행 상황은 시연용 가상 데이터예요. 실제 심사 · 지급 결과는 소상공인시장진흥공단 안내를 확인해 주세요.'))}</p></section>`;
 }

 function status(flow=false){
  const params=new URLSearchParams(location.hash.split('?')[1]||'');const id=params.get('id');
  const demo=id==='demo'||params.get('demo')==='1';
  const app=demo?(previewApp||(previewApp=demoApplication())):(apps().find(a=>a.id===id)||apps()[0]);
  if(!app){(flow?flowShell:shell)(`<div class="empty">${icon('box')}<h2>${esc(t('아직 점포 정리 신청이 없어요'))}</h2><p>${esc(t('예상 지원금을 확인하고 첫 신청을 시작해 보세요.'))}</p><a class="btn" href="#/${flow?'hope-flow':'hope'}">${esc(t('점포 정리 지원 보기'))}</a></div>`);return;}
  const q=app.quote||quoteFor(app);
  const stepIndex=app.stage>=5?3:app.stage>=3?2:app.stage>=1?1:0;
  const done=app.status==='완료';
  const view=`<article class="hope-status">${flow?flowControls(app):''}<section class="hope-status-hero"><div class="between"><span class="pill ${done?'green':''}">${esc(t(app.status))}</span><small>${esc(app.reservation)}</small></div><h1 ${app.localized?'':'translate="no"'}>${esc(app.localized?t(app.store?.name||''):app.store?.name||t('점포 정리 신청'))}</h1><p>${esc(t('신청일'))} ${app.createdAt?ymd(app.createdAt).replaceAll('-','.'):ymd().replaceAll('-','.')} · ${esc(t('방문 희망일'))} ${esc(app.visitDate||'-')}</p><div class="hope-street">${steps.map((v,n)=>`<div class="${n<=stepIndex?'on':''} ${n===stepIndex?'now':''}"><i>${n<stepIndex||done?'✓':n+1}</i><span>${esc(t(v))}</span></div>`).join('')}</div></section>
  <section class="hope-section"><div class="hope-section-head"><h2>${esc(t('처리 타임라인'))}</h2>${flow?'':(app.stage<5?btn(t('다음 단계 진행 (시연)'),'hope-advance',`data-id="${esc(app.id)}"`,'hope-mini'):`<span class="pill green">${esc(t('처리 완료'))}</span>`)}</div><ol class="hope-timeline">${eventLabels.map((v,n)=>{const reached=app.stage>=n;const ev=(app.events||[]).find(e=>e.stage===n);return `<li class="${reached?'on':''}"><i>${reached?'✓':n+1}</i><div><b>${esc(t(v))}</b><small>${reached?esc(stamp(ev?.at||app.createdAt||Date.now())):esc(t('예정'))}</small></div></li>`}).join('')}</ol><p class="note">${esc(t('진행 단계는 시연을 위해 직접 바꿀 수 있어요. 실제 배차 · 수거 · 처리는 이루어지지 않습니다.'))}</p></section>
  ${agencyCard(app,done)}
  <section class="hope-section"><h2>${esc(t('처리 품목과 지원금'))}</h2><div class="hope-item-tags">${(app.items||[]).map(v=>`<span>${esc(t(v))}</span>`).join('')}</div>${detailTable([['업종',esc(t(app.store?.type||'기타 업종'))],['매장 평수',t('{0}평').replace('{0}',app.store?.size||0)]])}<div class="hope-support-card"><div><small>${esc(t('예상 지원금'))}</small><b>${won(q.support)}</b><p>${esc(t('평당 20만원 · 최대 600만원 한도'))}</p></div><div><small>${esc(t('예상 자부담'))}</small><b>${won(q.self)}</b><p>${esc(t('시연용 가상 금액'))}</p></div></div><p class="note">${esc(t('실제 지원 여부 · 금액은 소상공인시장진흥공단의 심사와 증빙 확인으로 결정됩니다.'))}</p></section>
  <section class="hope-section"><div class="hope-section-head"><h2>${esc(t('증빙 서류'))}</h2><span class="pill">${esc(t(done?'발급 완료':'확인 대기'))}</span></div><div class="hope-doc-list">${uploadDocs.map(u=>{const f=app.applicant?.files?.[u.id];return `<div class="hope-doc-item">${f?.thumb?`<img class="hope-doc-thumb" src="${f.thumb}" alt="">`:`<span>${icon(f?'check':'box')}</span>`}<p>${esc(t(u.t))}${f?`<small class="hope-doc-name">${esc(f.name)}</small>`:''}</p><small>${esc(t(f?'제출 완료':'미첨부'))}</small></div>`}).join('')}<div><span>${icon('shield')}</span><p>${esc(t('공사내역서'))}</p><small>${esc(t(done?'발급 완료':'처리 후 발급'))}</small></div></div><p class="note">${esc(t('공사내역서는 업체가 작성해 처리 완료 후 확인할 수 있어요. 고객이 올리는 서류가 아니에요.'))}</p><div class="hope-actions">${done?btn(t('공사내역서 보기'),'hope-doc',`data-id="${esc(app.id)}"`,'wide'):''}${btn(t('공유 문구 복사'),'hope-share',`data-id="${esc(app.id)}"`,'outline wide')}</div></section>
  <section class="hope-section hope-contact"><h2>${esc(t('도움이 필요하신가요?'))}</h2><p>${esc(t('빼기 소상공인 지원팀이 남긴 문의를 확인해요. 실제 담당자 연결은 이루어지지 않아요.'))}</p>${btn(t('문의 남기기'),'hope-contact-open',`data-id="${esc(app.id)}"`,'outline wide')}</section>
  <div class="hope-disclaimer">${icon('info')}<p>${esc(t('이 화면은 소상공인시장진흥공단 협업 제안을 위한 시연입니다. 실제 신청 · 결제 · 수거 · 지원금 지급과 연결되지 않으며 모든 수치와 확인서는 가상입니다.'))}</p></div></article>`;
  (flow?flowShell:shell)((flow?flowBar('status'):'')+view);
 }

 function flowControls(app){
  const done=(app.stage||0)>=5||app.status==='완료';
  return `<section class="flow-controls"><div class="flow-dots">${eventLabels.map((v,n)=>`<i class="${app.stage>=n?'on':''}" title="${esc(t(v))}"></i>`).join('')}</div><div class="flow-control-copy"><b>${esc(t(done?'처리 완료':'시연 진행'))}</b><p>${esc(t(done?'처리 확인서를 열어 인쇄하거나 저장할 수 있어요.':'버튼을 눌러 단계를 직접 넘기거나 자동으로 진행해 보세요.'))}</p></div><div class="flow-control-actions">${done?btn(t('공사내역서 보기'),'hope-doc',`data-id="${esc(app.id)}"`,'wide'):btn(t('다음 단계'),'hope-advance',`data-id="${esc(app.id)}"`,'wide')}${done?'':btn(autoMode?t('자동 진행 중지'):t('자동으로 진행하기'),'hope-auto',`data-id="${esc(app.id)}"`,'outline wide')}</div><div class="flow-control-foot"><button type="button" class="flow-link" data-action="hope-flow-reset">${esc(t('처음부터 다시'))}</button><span>${esc(t('모든 데이터는 이 브라우저에만 저장됩니다.'))}</span></div></section>`;
 }

 function demoApplication(){
  const q=quoteFor({type:'카페 · 베이커리',size:18,items:['냉장고 · 냉동고','테이블 · 의자','간판 · 조명'],elevator:'있음',parking:'있음'});
  return {id:'demo-preview',localized:true,reservation:'HR-DEMO01',createdAt:Date.now()-3*86400000,status:'접수 완료',stage:2,store:{name:'성수동 작은 카페',type:'카페 · 베이커리',size:18,address:'1층 101호',region:'서울 성동구 성수1가1동',closingDate:'2026-11-30'},items:['냉장고 · 냉동고','테이블 · 의자','간판 · 조명'],scale:'보통',visitDate:'2026-11-20',elevator:'있음',parking:'있음',applicant:{manager:'김사장',phone:'010-0000-0000',bizNo:'0000000000',docs:['사업자등록증 사본','폐업 · 이전 사실 증빙']},quote:q,agencyStage:2,events:[{stage:0,at:Date.now()-3*86400000},{stage:1,at:Date.now()-2*86400000},{stage:2,at:Date.now()-86400000}]};
 }

 /* ---------- 공사내역서 (업체 작성 · 처리 완료 후 열람) ---------- */
 const supplier={bizNo:'123-45-67890',name:'빼기 순환 파트너',ceo:'김정리',addr:'서울 성동구 성수이로 00, 2층',biz:'서비스업',item:'폐기물 수집 · 운반 · 철거',manager:'이담당',phone:'02-0000-0000'};
 function docLines(app){
  const q=app.quote||quoteFor(app);
  const qty=Math.max(1,Math.ceil((app.store?.size||10)/10));
  const unit=Math.max(10000,Math.round(q.transport/qty/1000)*1000);
  const items=(app.items||[]).length||1;
  const lines=[
   {name:'양중하역',spec:'운반 · 상하차',qty,unit},
   {name:'철거 · 해체',spec:t('{0}평').replace('{0}',app.store?.size||0),qty:1,unit:Math.round(q.dismantle)},
   {name:'폐기물 처리',spec:t('{0}종').replace('{0}',items),qty:1,unit:Math.round(q.waste)},
   {name:'현장 정리 · 원상복구',spec:'집기 처분 포함',qty:1,unit:Math.round(q.base)}
  ];
  const sum=lines.reduce((a,l)=>a+l.qty*l.unit,0);
  const diff=Math.round(q.total)-sum;
  if(diff)lines[lines.length-1].unit=Math.max(0,lines[lines.length-1].unit+diff);
  return lines;
 }
 function docTotals(app){
  const lines=docLines(app);
  const total=lines.reduce((a,l)=>a+l.qty*l.unit,0);
  const supply=Math.round(total/1.1);
  return {lines,total,supply,tax:total-supply};
 }
 function docSheetHTML(app){
  const {lines,total,supply,tax}=docTotals(app);
  const rows=lines.slice();while(rows.length<18)rows.push(null);
  const store=app.store||{},ap=app.applicant||{};
  const party=(label,rowsHtml,cls)=>`<table class="doc-box ${cls}"><tr><th class="doc-side" rowspan="${rowsHtml.length}">${esc(t(label))}</th>${rowsHtml[0]}</tr>${rowsHtml.slice(1).map(r=>`<tr>${r}</tr>`).join('')}</table>`;
  const buyer=[
   `<th>${esc(t('사업자번호'))}</th><td colspan="3">${esc(ap.bizNo||'-')}</td>`,
   `<th>${esc(t('상호'))}</th><td colspan="3" ${store.name?'':'translate="no"'}>${esc(store.name||'-')}</td>`,
   `<th>${esc(t('성명'))}</th><td colspan="3">${esc(ap.manager||'-')}</td>`,
   `<th>${esc(t('주소'))}</th><td colspan="3">${esc(((store.region||'')+' '+(app.localized?t(store.address||''):(store.address||''))).trim()||'-')}</td>`,
   `<th>${esc(t('업태'))}</th><td colspan="3">${esc(t(store.type||''))} · ${esc(t('소상공인'))}</td>`
  ];
  const vendor=[
   `<th>${esc(t('사업자번호'))}</th><td colspan="3">${esc(supplier.bizNo)}</td>`,
   `<th>${esc(t('상호'))}</th><td>${esc(supplier.name)}</td><th>${esc(t('성명'))}</th><td>${esc(supplier.ceo)}</td>`,
   `<th>${esc(t('주소'))}</th><td colspan="3">${esc(supplier.addr)}</td>`,
   `<th>${esc(t('업태'))}</th><td>${esc(supplier.biz)}</td><th>${esc(t('종목'))}</th><td>${esc(supplier.item)}</td>`,
   `<th>${esc(t('담당자'))}</th><td>${esc(supplier.manager)}</td><th>${esc(t('연락처'))}</th><td>${esc(supplier.phone)}</td>`
  ];
  return `<div class="doc-sheet" id="doc-print"><h1>${esc(t('공사내역서'))}</h1><div class="doc-party">${party('공급받는자',buyer,'buyer')}${party('공급자',vendor,'vendor')}</div>
  <table class="doc-table"><thead><tr><th rowspan="2" class="c-no">NO</th><th rowspan="2">${esc(t('품목명'))}</th><th rowspan="2" class="c-spec">${esc(t('규격'))}</th><th rowspan="2" class="c-qty">${esc(t('수량'))}</th><th rowspan="2" class="c-unit">${esc(t('단가'))}</th><th colspan="2">${esc(t('거래금액'))}</th></tr><tr><th>${esc(t('공급가액'))}</th><th>${esc(t('세액'))}</th></tr></thead>
  <tbody>${rows.map((l,i)=>`<tr><td class="c-no">${i+1}</td><td class="doc-name">${l?esc(t(l.name)):''}</td><td class="c-spec">${l?esc(l.spec):''}</td><td class="c-qty">${l?l.qty:''}</td><td class="c-unit">${l?fmt(l.unit):''}</td>${i===0?`<td class="doc-merge" rowspan="${rows.length}">${fmt(supply)}</td><td class="doc-merge" rowspan="${rows.length}">${fmt(tax)}</td>`:''}</tr>`).join('')}</tbody>
  <tfoot><tr><td colspan="5" class="doc-sum-label">${esc(t('합계(원)'))}</td><td colspan="2" class="doc-sum-value">${fmt(total)}</td></tr></tfoot></table>
  <p class="doc-note">${esc(t('본 문서는 시연용 가상 공사내역서이며 실제 공사 · 청구 · 세금계산서 발행과 무관합니다.'))}</p></div>`;
 }
 function fitDoc(){
  const inner=document.querySelector('#doc-inner');if(!inner)return;
  const box=inner.parentElement;if(!box)return;
  const nat=700;const w=box.clientWidth||360;
  const sc=Math.min(1,(w-2)/nat);
  const apply=()=>{inner.style.transform=`scale(${sc})`;box.style.height=Math.ceil(inner.scrollHeight*sc)+10+'px';};
  apply();
  if(typeof requestAnimationFrame==='function')requestAnimationFrame(apply);
  setTimeout(apply,120);
 }
 function docPage(){
  const params=new URLSearchParams(location.hash.split('?')[1]||'');const id=params.get('id');
  const fromFlow=params.get('back')==='flow';
  const backRoute=fromFlow?'hope-flow-status':'hope-status';
  let app=(id==='demo'||params.get('demo')==='1')?(previewApp||(previewApp=demoApplication())):(findApp(id)||apps()[0]);
  if(app&&(params.get('demo')==='1'||id==='demo')&&(app.stage||0)<5){app={...app,stage:5,status:'완료'};previewApp=app;}
  if(!app){flowShell(`<div class="empty">${icon('box')}<h2>${esc(t('아직 점포 정리 신청이 없어요'))}</h2><a class="btn" href="#/hope-flow-home">${esc(t('신청 흐름 시연으로'))}</a></div>`);return;}
  const done=(app.stage||0)>=5||app.status==='완료';
  if(!done){
   flowShell(`<article class="doc-locked">${icon('shield')}<h2>${esc(t('아직 공사내역서가 없어요'))}</h2><p>${esc(t('처리 완료 후 업체가 작성한 공사내역서를 확인할 수 있어요.'))}</p><a class="btn" href="#/${backRoute}?id=${esc(app.id)}">${esc(t('진행 화면으로'))}</a></article>`);
   return;
  }
  flowShell(`<article class="doc-page"><div class="doc-toolbar"><button type="button" class="btn wide" data-action="hope-doc-png" data-id="${esc(app.id)}">${esc(t('이미지로 저장 (PNG)'))}</button><button type="button" class="btn outline wide" data-action="hope-doc-print" data-id="${esc(app.id)}">${esc(t('PDF · 인쇄'))}</button></div><div class="doc-wrap"><div class="doc-inner" id="doc-inner">${docSheetHTML(app)}</div></div><a class="doc-back" href="#/${backRoute}?id=${esc(app.id)}">${esc(t('진행 화면으로 돌아가기'))}</a></article>`);
  fitDoc();
 }
 function printDoc(){
  const inner=document.querySelector('#doc-inner');
  if(!inner){toast(t('문서를 찾을 수 없어요.'));return;}
  inner.style.transform='none';
  document.body.classList.add('print-doc');
  const after=()=>{document.body.classList.remove('print-doc');fitDoc();window.removeEventListener('afterprint',after);};
  window.addEventListener('afterprint',after);
  try{window.print();}catch{toast(t('이 환경에서는 인쇄를 지원하지 않아요.'));}
  setTimeout(after,1200);
 }
 function downloadDoc(app){
  const {lines,total,supply,tax}=docTotals(app);
  const W=1400,H=1980,M=70;
  const c=document.createElement('canvas');c.width=W;c.height=H;
  const x=c.getContext&&c.getContext('2d');
  if(!x){toast(t('이 브라우저에서는 이미지 저장을 지원하지 않아요.'));return;}
  const store=app.store||{},ap=app.applicant||{};
  x.fillStyle='#fff';x.fillRect(0,0,W,H);
  x.strokeStyle='#000';x.fillStyle='#000';x.lineWidth=2;
  const font=(size,bold)=>`${bold?'700':'400'} ${size}px "Malgun Gothic","Noto Sans KR","Apple SD Gothic Neo",sans-serif`;
  const cell=(x1,y1,x2,y2,text,opt={})=>{
   if(opt.fill){x.fillStyle=opt.fill;x.fillRect(x1,y1,x2-x1,y2-y1);x.fillStyle='#000';}
   x.strokeRect(x1,y1,x2-x1,y2-y1);
   if(text){x.font=font(opt.size||22,opt.bold);x.textAlign=opt.align||'center';x.textBaseline='middle';
    const tx=opt.align==='left'?x1+10:opt.align==='right'?x2-10:(x1+x2)/2;
    x.fillText(String(text),tx,(y1+y2)/2+1);}
  };
  x.font=font(46,true);x.textAlign='center';x.textBaseline='middle';x.fillText(t('공사내역서'),W/2,M+40);
  // party boxes
  const pTop=M+95,pW=(W-2*M-30)/2,pRow=46;
  const drawParty=(ox,label,rows)=>{
   const inner=ox+56;const colW=(pW-56)/4;
   x.fillStyle='#f2f2f2';x.fillRect(ox,pTop,56,pRow*rows.length);x.fillStyle='#000';
   x.strokeRect(ox,pTop,56,pRow*rows.length);
   x.save();x.translate(ox+28,pTop+(pRow*rows.length)/2);x.rotate(-Math.PI/2);x.font=font(18,true);x.fillText(label,0,0);x.restore();
   rows.forEach((r,i)=>{
    const y=pTop+i*pRow;let cx=inner;
    r.forEach(seg=>{
     const w=seg.w*colW;
     cell(cx,y,cx+w,y+pRow,seg.t,{size:seg.size||18,bold:seg.bold,align:seg.align||'center',fill:seg.head?'#f7f7f7':null});
     cx+=w;
    });
   });
  };
  const buyer=[
   [{t:t('사업자번호'),head:true,w:1},{t:ap.bizNo||'-',w:3,size:18}],
   [{t:t('상호'),head:true,w:1},{t:store.name||'-',w:3,size:18}],
   [{t:t('성명'),head:true,w:1},{t:ap.manager||'-',w:3,size:18}],
   [{t:t('주소'),head:true,w:1},{t:((store.region||'')+' '+(store.address||'')).trim()||'-',w:3,size:15}],
   [{t:t('업태'),head:true,w:1},{t:t(store.type||'')+' · '+t('소상공인'),w:3,size:16}]
  ];
  const vendor=[
   [{t:t('사업자번호'),head:true,w:1},{t:supplier.bizNo,w:3,size:18}],
   [{t:t('상호'),head:true,w:1},{t:supplier.name,w:1,size:15},{t:t('성명'),head:true,w:1},{t:supplier.ceo,w:1,size:16}],
   [{t:t('주소'),head:true,w:1},{t:supplier.addr,w:3,size:15}],
   [{t:t('업태'),head:true,w:1},{t:supplier.biz,w:1,size:15},{t:t('종목'),head:true,w:1},{t:supplier.item,w:1,size:13}],
   [{t:t('담당자'),head:true,w:1},{t:supplier.manager,w:1,size:16},{t:t('연락처'),head:true,w:1},{t:supplier.phone,w:1,size:15}]
  ];
  drawParty(M,t('공급받는자'),buyer);
  drawParty(M+pW+30,t('공급자'),vendor);
  // table
  const tTop=pTop+pRow*5+34,headH=34;
  const cw=[70,330,150,90,170,180,150];
  const tw=cw.reduce((a,b)=>a+b,0);
  const tx0=M+ (W-2*M-tw)/2;
  const xs=[tx0];cw.forEach(w=>xs.push(xs[xs.length-1]+w));
  // header row1
  cell(xs[0],tTop,xs[1],tTop+headH*2,t('NO'),{size:18,bold:true,fill:'#f2f2f2'});
  cell(xs[1],tTop,xs[2],tTop+headH*2,t('품목명'),{size:18,bold:true,fill:'#f2f2f2'});
  cell(xs[2],tTop,xs[3],tTop+headH*2,t('규격'),{size:18,bold:true,fill:'#f2f2f2'});
  cell(xs[3],tTop,xs[4],tTop+headH*2,t('수량'),{size:18,bold:true,fill:'#f2f2f2'});
  cell(xs[4],tTop,xs[5],tTop+headH*2,t('단가'),{size:18,bold:true,fill:'#f2f2f2'});
  cell(xs[5],tTop,xs[7],tTop+headH,t('거래금액'),{size:17,bold:true,fill:'#f2f2f2'});
  cell(xs[5],tTop+headH,xs[6],tTop+headH*2,t('공급가액'),{size:16,bold:true,fill:'#f2f2f2'});
  cell(xs[6],tTop+headH,xs[7],tTop+headH*2,t('세액'),{size:16,bold:true,fill:'#f2f2f2'});
  const ROWS=18,rowH=48,tb=tTop+headH*2;
  for(let i=0;i<ROWS;i++){
   const y=tb+i*rowH,l=lines[i];
   cell(xs[0],y,xs[1],y+rowH,String(i+1),{size:16});
   cell(xs[1],y,xs[2],y+rowH,l?t(l.name):'',{size:17,align:'left'});
   cell(xs[2],y,xs[3],y+rowH,l?l.spec:'',{size:15});
   cell(xs[3],y,xs[4],y+rowH,l?String(l.qty):'',{size:16});
   cell(xs[4],y,xs[5],y+rowH,l?fmt(l.unit):'',{size:16,align:'right'});
  }
  cell(xs[5],tb,xs[6],tb+ROWS*rowH,fmt(supply),{size:20,align:'center'});
  cell(xs[6],tb,xs[7],tb+ROWS*rowH,fmt(tax),{size:20,align:'center'});
  const sy=tb+ROWS*rowH;
  cell(xs[0],sy,xs[5],sy+56,t('합계(원)'),{size:19,bold:true,align:'right'});
  cell(xs[5],sy,xs[7],sy+56,fmt(total),{size:24,bold:true,align:'right'});
  x.font=font(15);x.textAlign='left';x.fillStyle='#555';
  x.fillText(t('본 문서는 시연용 가상 공사내역서이며 실제 공사 · 청구 · 세금계산서 발행과 무관합니다.'),M,H-60);
  try{
   c.toBlob(blob=>{
    if(!blob){toast(t('이미지를 만들지 못했어요.'));return;}
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=`공사내역서_${app.reservation||app.id}.png`;
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),4000);
    toast(t('공사내역서 이미지를 저장했어요.'));
   },'image/png');
  }catch{toast(t('이 브라우저에서는 이미지 저장을 지원하지 않아요.'));}
 }
 async function share(app){
  const text=[app.store?.name||'',t('점포 정리 신청'),app.reservation,t(app.status)].join(' · ')+'\n'+t('빼기 × 희망리턴패키지 협업 시연');
  try{await navigator.clipboard.writeText(text);toast(t('공유 문구를 복사했어요.'));}
  catch{openModal(t('공유 문구'),`<p>${esc(t('문구를 길게 눌러 복사해 주세요.'))}</p><textarea class="hope-share-text" readonly>${esc(text)}</textarea>${btn(t('닫기'),'close','','wide')}`);}
 }

 function rerender(name,keepAuto){
  if(!keepAuto)stopAuto();
  flowMode=['hope-flow-home','hope-flow','hope-flow-status'].includes(name);
  if(name==='hope-intro')intro();
  else if(name==='hope')landing();
  else if(name==='hope-apply')applyPage(true);
  else if(name==='hope-status')status(false);
  else if(name==='hope-flow')applyPage(true);
  else if(name==='hope-flow-status')status(true);
  else if(name==='hope-flow-home')flowHome();
  else if(name==='hope-doc')docPage();
 }
 function render(name){rerender(name);}
 return {
  render(routeName){rerender(routeName);},
  action(a,d){
   if(a==='hope-intro'){go('hope-intro');return true;}
   if(a==='hope-start-calc'){go('hope');return true;}
   if(a==='hope-jump'){const el=document.querySelector('#'+d.id);el?.scrollIntoView({behavior:'smooth',block:'start'});return true;}
   if(a==='hope-elig-check'){estimate.checks[d.id]=!estimate.checks[d.id];paintQuote();return true;}
   if(a==='hope-start'){go('hope-apply');return true;}
   if(a==='hope-flow'){go('hope-flow-home');return true;}
   if(a==='hope-flow-start'){if(!eligChecks.every(c=>estimate.checks[c.id])){toast(t('지원 대상 확인 5개 항목을 먼저 체크해 주세요.'));return true;}applyDraft=null;started=false;applyStep=1;stopAuto();go('hope-flow');return true;}
   if(a==='hope-flow-continue'){go('hope-flow-status?id='+d.id);return true;}
   if(a==='hope-flow-reset'){stopAuto();applyDraft=null;started=false;applyStep=1;previewApp=null;go('hope-flow-home');return true;}
   if(a==='hope-flow-exit'){stopAuto();go('hope-flow-home');return true;}
   if(a==='hope-auto'){const app=findApp(d.id);if(!app)return true;if(autoMode){stopAuto();rerender('hope-flow-status');return true;}autoMode=true;autoStep(d.id);return true;}
   if(a==='hope-print'){if(typeof print==='function')print();return true;}
   if(a==='hope-open'){go('hope-status?id='+d.id);return true;}
   if(a==='hope-demo'){previewApp=null;go('hope-status?demo=1');return true;}
   if(a==='hope-est-type'){estimate.type=d.value;paintQuote();return true;}
   if(a==='hope-size'){estimate.size=clamp(estimate.size+Number(d.delta),3,200);paintQuote();return true;}
   if(a==='hope-next'){if(validate(applyStep))setStep(applyStep+1);return true;}
   if(a==='hope-back'){setStep(applyStep-1);const box=document.querySelector('#hope-error');if(box)box.textContent='';return true;}
   if(a==='hope-file-pick'){document.querySelector(`#hope-file-${d.id}`)?.click();return true;}
   if(a==='hope-file-remove'){if(applyDraft?.files)delete applyDraft.files[d.id];paintUploads();return true;}
   if(a==='hope-sample-files'){fillSamples();return true;}
   if(a==='hope-submit'){submit();return true;}
   if(a==='hope-advance'){const app=findApp(d.id);if(!app||app.stage>=5)return true;advanceApp(app);rerender(flowMode?'hope-flow-status':'hope-status');toast(t('시연 진행 단계를 올렸어요.'));return true;}
   if(a==='hope-cert'||a==='hope-doc'){go('hope-doc?id='+d.id+(flowMode?'&back=flow':''));return true;}
   if(a==='hope-agency-advance'){const app=findApp(d.id);if(!app)return true;const st=agencyStageOf(app);app.agencyStage=Math.min(agencySteps.length-1,st+1);if(app.id!=='demo-preview')save();rerender(flowMode?'hope-flow-status':'hope-status');toast(t('공단 진행 단계를 반영했어요.'));return true;}
   if(a==='hope-doc-png'){const app=findApp(d.id);if(app)downloadDoc(app);return true;}
   if(a==='hope-doc-print'){printDoc();return true;}
   if(a==='hope-share'){const app=apps().find(x=>x.id===d.id)||(previewApp?.id===d.id?previewApp:null);if(app)share(app);return true;}
   if(a==='hope-contact-open'){openModal(t('문의 남기기'),`<p>${esc(t('협업 · 지원 관련 문의를 남겨 주세요. 시연용으로만 저장돼요.'))}</p><label class="form-field"><span>${esc(t('문의 내용'))}</span><textarea name="hope-message" id="hope-message" rows="4" maxlength="300" placeholder="${esc(t('예: 20평 카페 철거 견적을 상담하고 싶어요.'))}"></textarea></label>${btn(t('문의 저장'),'hope-contact-save','','wide')}`);return true;}
   if(a==='hope-contact-save'){const value=document.querySelector('#hope-message')?.value.trim();if(!value){toast(t('문의 내용을 입력해 주세요.'));return true;}s().hopeInquiries=s().hopeInquiries||[];s().hopeInquiries.unshift({id:uid(),message:value,date:today()});save();closeModal();toast(t('문의를 저장했어요.'));return true;}
   return false;
  }
 };
}
