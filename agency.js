import {t} from './i18n-core.js?v=84c050cff1c8';

// 점포철거비 정산 필수 서류 (희망리턴패키지 공고 · 2차 정산서류 기준)
const DOC_TYPES=[
 {id:'bizCert',t:'사업자등록증명원 (또는 폐업사실증명원)',short:'사업자등록증명원'},
 {id:'closedCert',t:'폐업사실증명',short:'폐업사실증명'},
 {id:'lease',t:'점포 임대차계약서 사본',short:'임대차계약서'},
 {id:'building',t:'건축물대장',short:'건축물대장'},
 {id:'vat',t:'부가가치세 과세표준증명',short:'과세표준증명'},
 {id:'photoIn',t:'철거 전 내부 사진',short:'철거 전 내부'},
 {id:'photoOut',t:'철거 전 외부 사진',short:'철거 전 외부'},
 {id:'photoAfter',t:'철거 후 사진',short:'철거 후'},
 {id:'sheet',t:'공사내역서 (견적서)',short:'공사내역서'},
 {id:'taxInvoice',t:'전자세금계산서 (또는 카드전표)',short:'세금계산서'},
 {id:'transfer',t:'이체확인증 (또는 카드대금 완납확인증)',short:'이체확인증'},
 {id:'bankbook',t:'통장(계좌) 사본',short:'통장사본'}
];

const CASES=[
 {id:'HR-260311',store:'성수동 작은 카페',ceo:'김도윤',bizNo:'112-34-56780',region:'서울 성동구',type:'카페 · 베이커리',size:18,closed:'2026-10-02',done:'2026-10-14',supply:5200000,support:3600000,status:'검토 완료',missing:[],note:'현장 확인 완료 · 사진 3매 확인'},
 {id:'HR-260312',store:'연남동 백반집',ceo:'이서연',bizNo:'204-55-12340',region:'서울 마포구',type:'음식점 · 주점',size:26,closed:'2026-09-28',done:'2026-10-11',supply:7800000,support:5200000,status:'검토 완료',missing:[],note:'주방 집기 철거 포함'},
 {id:'HR-260318',store:'일산 편의점',ceo:'박준호',bizNo:'318-22-90451',region:'경기 고양시',type:'소매 · 편의점',size:12,closed:'2026-10-05',done:'2026-10-16',supply:2900000,support:2400000,status:'보완 요청',missing:['building','transfer'],note:'건축물대장 · 이체확인증 재제출 요청'},
 {id:'HR-260322',store:'성수 공유오피스',ceo:'정하늘',bizNo:'140-81-33220',region:'서울 성동구',type:'사무 · 공유오피스',size:34,closed:'2026-09-20',done:'2026-10-08',supply:9100000,support:6000000,status:'검토 완료',missing:[],note:'한도 상한(600만원) 적용'},
 {id:'HR-260327',store:'연남 미용실',ceo:'최유진',bizNo:'229-14-77812',region:'서울 마포구',type:'미용 · 서비스',size:15,closed:'2026-10-08',done:'2026-10-19',supply:3400000,support:3000000,status:'검토 완료',missing:[],note:'철거 후 사진 4매 확인'},
 {id:'HR-260331',store:'일산 베이커리',ceo:'한지민',bizNo:'412-73-66104',region:'경기 고양시',type:'카페 · 베이커리',size:21,closed:'2026-10-10',done:'2026-10-21',supply:4600000,support:4200000,status:'보완 요청',missing:['closedCert'],note:'폐업사실증명 발급 후 재제출 필요'},
 {id:'HR-260402',store:'성수 편집숍',ceo:'오세훈',bizNo:'101-24-55893',region:'서울 성동구',type:'소매 · 편의점',size:9,closed:'2026-10-12',done:'2026-10-23',supply:1800000,support:1800000,status:'검토 완료',missing:[],note:'소규모 철거 · 자부담 없음'},
 {id:'HR-260407',store:'마포 사무실',ceo:'윤가은',bizNo:'105-88-22047',region:'서울 마포구',type:'사무 · 공유오피스',size:30,closed:'2026-10-14',done:'2026-10-26',supply:6900000,support:6000000,status:'검토 완료',missing:[],note:'파티션 · 냉난방 철거 포함'}
];

const won=n=>Number(n||0).toLocaleString('ko-KR');

// store-only ZIP (no compression) so bulk download works offline
const CRC_TABLE=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
function crc32(buf){let c=0xFFFFFFFF;for(let i=0;i<buf.length;i++)c=CRC_TABLE[(c^buf[i])&0xFF]^(c>>>8);return (c^0xFFFFFFFF)>>>0}
function zip(files){
 const enc=new TextEncoder();
 const chunks=[],central=[];let offset=0;
 const dt=new Date();const time=((dt.getHours()<<11)|(dt.getMinutes()<<5)|(dt.getSeconds()>>1))&0xFFFF;
 const date=(((dt.getFullYear()-1980)<<9)|((dt.getMonth()+1)<<5)|dt.getDate())&0xFFFF;
 files.forEach(f=>{
  const name=enc.encode(f.name);const data=typeof f.data==='string'?enc.encode(f.data):f.data;
  const crc=crc32(data);
  const local=new Uint8Array(30+name.length);
  const v=new DataView(local.buffer);
  v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x0800,true);v.setUint16(8,0,true);
  v.setUint16(10,time,true);v.setUint16(12,date,true);v.setUint32(14,crc,true);
  v.setUint32(18,data.length,true);v.setUint32(22,data.length,true);v.setUint16(26,name.length,true);v.setUint16(28,0,true);
  local.set(name,30);
  chunks.push(local,data);
  const cen=new Uint8Array(46+name.length);const cv=new DataView(cen.buffer);
  cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0x0800,true);cv.setUint16(10,0,true);
  cv.setUint16(12,time,true);cv.setUint16(14,date,true);cv.setUint32(16,crc,true);
  cv.setUint32(20,data.length,true);cv.setUint32(24,data.length,true);cv.setUint16(28,name.length,true);
  cv.setUint32(42,offset,true);cen.set(name,46);
  central.push(cen);
  offset+=local.length+data.length;
 });
 const centralSize=central.reduce((a,c)=>a+c.length,0);
 const end=new Uint8Array(22);const ev=new DataView(end.buffer);
 ev.setUint32(0,0x06054b50,true);ev.setUint16(8,files.length,true);ev.setUint16(10,files.length,true);
 ev.setUint32(12,centralSize,true);ev.setUint32(16,offset,true);
 return new Blob([...chunks,...central,end],{type:'application/zip'});
}
function save(blob,name){
 const url=URL.createObjectURL(blob);
 const a=document.createElement('a');a.href=url;a.download=name;
 document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),4000);
}

export function createAgency({agencyShell,icon,esc,toast,openModal,closeModal,btn}){
 const cases=()=>CASES.map(c=>({...c,submitted:DOC_TYPES.length-c.missing.length}));
 let filter='all',selected=new Set(CASES.map(c=>c.id)),openId=null;

 const docsOf=c=>DOC_TYPES.map(d=>({...d,ok:!c.missing.includes(d.id),file:c.missing.includes(d.id)?'':`${c.id}_${d.id}.pdf`}));
 const badge=c=>c.status==='검토 완료'?'green':c.status==='보완 요청'?'warn':'gray';
 const list=()=>cases().filter(c=>filter==='all'?true:filter==='ok'?c.missing.length===0:c.missing.length>0);

 function csv(rows){
  const head=['신청번호','상호명','대표자','사업자등록번호','지역','업종','전용면적(평)','폐업일','철거완료일','공사금액','지원금','자부담','서류제출','필수서류','미제출서류','검토상태','비고'];
  const body=rows.map(c=>[c.id,c.store,c.ceo,c.bizNo,c.region,c.type,c.size,c.closed,c.done,c.supply,c.support,Math.max(0,c.supply-c.support),c.submitted,DOC_TYPES.length,DOC_TYPES.filter(d=>c.missing.includes(d.id)).map(d=>d.short).join(' / ')||'-',c.status,c.note]);
  return '\uFEFF'+[head,...body].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\r\n');
 }
 function caseText(c){
  const docs=docsOf(c);
  return [
   `[점포철거비 정산 검토 카드]`,
   `신청번호 : ${c.id}`,
   `상호명 : ${c.store}`,
   `대표자 : ${c.ceo}`,
   `사업자등록번호 : ${c.bizNo}`,
   `지역 : ${c.region}`,
   `업종 : ${c.type}`,
   `전용면적 : ${c.size}평`,
   `폐업일 : ${c.closed}`,
   `철거완료일 : ${c.done}`,
   `공사금액 : ${won(c.supply)}원`,
   `지원금 : ${won(c.support)}원`,
   `자부담 : ${won(Math.max(0,c.supply-c.support))}원`,
   `검토상태 : ${c.status}`,
   ``,
   `[필수 서류 ${c.submitted}/${DOC_TYPES.length}]`,
   ...docs.map((d,i)=>`${String(i+1).padStart(2,'0')}. ${d.ok?'제출':'미제출'}  ${d.t}${d.ok?`  (${d.file})`:''}`),
   ``,
   `비고 : ${c.note}`,
   ``,
   `※ 본 자료는 시연용 가상 데이터입니다. 실제 심사 · 지급 자료가 아닙니다.`
  ].join('\r\n');
 }

 function header(){
  const list=cases();
  const total=list.reduce((a,c)=>a+c.support,0);
  const pending=list.filter(c=>c.missing.length).length;
  return `<section class="ag-head"><div class="ag-head-top"><span class="ag-badge">${icon('shield')}${esc(t('공단 확인용'))}</span><span class="ag-dummy">${esc(t('가상 데이터'))}</span></div><h1>${esc(t('점포철거비 정산 확인'))}</h1><p>${esc(t('철거 완료된 신청 건의 필수 서류와 내역을 확인하고 일괄 내려받을 수 있어요.'))}</p><div class="ag-stats"><div><small>${esc(t('철거 완료'))}</small><b>${list.length}<i>${esc(t('건'))}</i></b></div><div><small>${esc(t('지원금 합계'))}</small><b>${won(total)}<i>${esc(t('원'))}</i></b></div><div><small>${esc(t('서류 보완'))}</small><b class="${pending?'amber':''}">${pending}<i>${esc(t('건'))}</i></b></div></div></section>`;
 }

 function toolbar(count){
  const all=count>0&&list().every(c=>selected.has(c.id));
  return `<div class="ag-toolbar"><button type="button" class="ag-check ${all?'on':''}" data-action="ag-all" aria-pressed="${all}"><span>${all?'✓':''}</span>${esc(t('전체 선택'))}</button><div class="ag-chips">${[['all',t('전체')],['ok',t('서류 완비')],['warn',t('보완 필요')]].map(([k,label])=>`<button type="button" class="ag-chip ${filter===k?'on':''}" data-action="ag-filter" data-value="${k}" aria-pressed="${filter===k}">${esc(label)}</button>`).join('')}</div></div>`;
 }

 function bulkBar(){
  const n=selected.size;
  return `<div class="ag-bulk ${n?'show':''}"><span><b>${n}</b>${esc(t('건 선택됨'))}</span><div><button type="button" class="ag-bulk-btn" data-action="ag-csv" ${n?'':'disabled'}>${esc(t('CSV'))}</button><button type="button" class="ag-bulk-btn primary" data-action="ag-zip" ${n?'':'disabled'}>${esc(t('서류 일괄 다운로드'))}</button></div></div>`;
 }

 function row(c){
  const docs=docsOf(c);
  const shortage=DOC_TYPES.length-c.submitted;
  return `<article class="ag-card"><button type="button" class="ag-tick ${selected.has(c.id)?'on':''}" data-action="ag-tick" data-id="${c.id}" aria-pressed="${selected.has(c.id)}" aria-label="${esc(t('선택'))}"><span>${selected.has(c.id)?'✓':''}</span></button><button type="button" class="ag-body" data-action="ag-open" data-id="${c.id}"><div class="ag-body-top"><span class="pill ${badge(c)}">${esc(t(c.status))}</span><small>${esc(c.id)}</small></div><b class="ag-store">${esc(t(c.store))}</b><p class="ag-meta">${esc(t(c.region))} · ${esc(t(c.type))} · ${c.size}${esc(t('평'))}</p><div class="ag-money"><span>${esc(t('지원금'))} <b>${won(c.support)}${esc(t('원'))}</b></span><span class="${shortage?'amber':''}">${esc(t('서류'))} ${c.submitted}/${DOC_TYPES.length}${shortage?` · ${esc(t('미비'))} ${shortage}`:''}</span></div><div class="ag-dots">${docs.map(d=>`<i class="${d.ok?'on':''}"></i>`).join('')}</div></button></article>`;
 }

 function detail(c){
  const docs=docsOf(c);
  const self=Math.max(0,c.supply-c.support);
  agencyShell(`<article class="ag-detail"><button type="button" class="ag-back" data-action="ag-close">${icon('chevron')}${esc(t('목록으로'))}</button><section class="ag-detail-head"><div class="ag-head-top"><span class="pill ${badge(c)}">${esc(t(c.status))}</span><small>${esc(c.id)}</small></div><h1>${esc(t(c.store))}</h1><p>${esc(t(c.region))} · ${esc(t(c.type))} · ${c.size}${esc(t('평'))}</p></section>
  <section class="ag-block"><h2>${esc(t('신청 · 정산 정보'))}</h2><dl class="ag-dl">${[[t('대표자'),c.ceo],[t('사업자등록번호'),c.bizNo],[t('폐업일'),c.closed],[t('철거완료일'),c.done],[t('공사금액'),won(c.supply)+t('원')],[t('지원금'),won(c.support)+t('원')],[t('자부담'),won(self)+t('원')]].map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></section>
  <section class="ag-block"><div class="ag-block-head"><h2>${esc(t('필수 서류'))}</h2><b class="${c.missing.length?'amber':'green'}">${c.submitted} / ${DOC_TYPES.length}</b></div><div class="ag-docs">${docs.map(d=>`<div class="ag-doc ${d.ok?'ok':'miss'}"><span class="ag-doc-ic">${d.ok?icon('check'):icon('close')}</span><div><b>${esc(t(d.t))}</b><small>${d.ok?esc(d.file):esc(t('미제출 · 보완 요청 대상'))}</small></div><em>${d.ok?esc(t('제출')):esc(t('미제출'))}</em></div>`).join('')}</div><p class="note">${esc(t('서류 항목은 희망리턴패키지 점포철거비 2차 정산서류 기준이에요. 이 화면의 파일명은 가상입니다.'))}</p></section>
  <section class="ag-block"><h2>${esc(t('검토 메모'))}</h2><p class="ag-note-text">${esc(t(c.note))}</p></section>
  <div class="ag-detail-actions">${btn(t('이 건 서류 내려받기'),'ag-one',`data-id="${c.id}"`,'wide')}${c.missing.length?btn(t('보완 요청 보내기'),'ag-ask',`data-id="${c.id}"`,'outline wide'):btn(t('검토 완료 처리'),'ag-approve',`data-id="${c.id}"`,'outline wide')}</div><div class="ag-disclaimer">${icon('info')}<p>${esc(t('시연용 가상 화면입니다. 실제 심사 · 지급 · 서류 열람과 연결되지 않습니다.'))}</p></div></article>`);
 }

 function listPage(){
  const rows=list();
  agencyShell(`${header()}${toolbar(rows.length)}<div class="ag-list">${rows.map(row).join('')||`<div class="ag-empty">${esc(t('조건에 맞는 건이 없어요'))}</div>`}</div><p class="note ag-note">${esc(t('철거 완료 후 정산 검토 단계의 건만 표시됩니다. 서류 미비 건은 보완 요청 대상이에요.'))}</p>${bulkBar()}`);
 }

 function pick(ids){
  return cases().filter(c=>ids.includes(c.id));
 }
 function downloadCsv(rows){
  if(!rows.length){toast(t('내려받을 건을 선택해 주세요.'));return;}
  save(new Blob([csv(rows)],{type:'text/csv;charset=utf-8'}),`점포철거비_정산목록_${rows.length}건.csv`);
  toast(t('CSV 파일을 내려받았어요.'));
 }
 function downloadZip(rows){
  if(!rows.length){toast(t('내려받을 건을 선택해 주세요.'));return;}
  const files=[{name:'정산목록.csv',data:csv(rows)}];
  rows.forEach(c=>{
   files.push({name:`${c.id}_검토카드.txt`,data:caseText(c)});
   files.push({name:`${c.id}_서류목록.csv`,data:'\uFEFF'+['서류명','제출여부','파일명'].concat(docsOf(c).map(d=>[d.t,d.ok?'제출':'미제출',d.file||'-'])).map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\r\n')});
  });
  files.push({name:'README.txt',data:['점포철거비 정산 일괄 다운로드 (시연용)','','- 정산목록.csv : 선택한 건의 정산 요약','- <신청번호>_검토카드.txt : 건별 요약과 서류 체크 결과','- <신청번호>_서류목록.csv : 필수 서류 제출 여부','','※ 실제 서류 원본(PDF·이미지)은 포함되지 않는 가상 데이터입니다.'].join('\r\n')});
  save(zip(files),`점포철거비_정산서류_${rows.length}건.zip`);
  toast(t('서류 묶음(ZIP)을 내려받았어요.'));
 }

 return {
  render(name){
   if(name==='ag-detail'&&openId){const c=cases().find(x=>x.id===openId);if(c)return detail(c);}
   listPage();
  },
  page(){listPage();},
  detail(id){openId=id;const c=cases().find(x=>x.id===id);if(c)detail(c);},
  action(a,d){
   if(a==='ag-filter'){filter=d.value;listPage();return true;}
   if(a==='ag-tick'){selected.has(d.id)?selected.delete(d.id):selected.add(d.id);listPage();return true;}
   if(a==='ag-all'){const rows=list();if(rows.every(c=>selected.has(c.id)))rows.forEach(c=>selected.delete(c.id));else rows.forEach(c=>selected.add(c.id));listPage();return true;}
   if(a==='ag-open'){openId=d.id;this.detail(d.id);return true;}
   if(a==='ag-close'){openId=null;listPage();return true;}
   if(a==='ag-csv'){downloadCsv(pick([...selected]));return true;}
   if(a==='ag-zip'){downloadZip(pick([...selected]));return true;}
   if(a==='ag-one'){downloadZip(cases().filter(c=>c.id===d.id));return true;}
   if(a==='ag-ask'){toast(t('보완 요청을 기록했어요. (시연)'));return true;}
   if(a==='ag-approve'){const c=CASES.find(x=>x.id===d.id);if(c)c.status='검토 완료';toast(t('검토 완료로 표시했어요. (시연)'));this.detail(d.id);return true;}
   return false;
  }
 };
}
