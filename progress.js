export function progressSummary(record,delivery=false){
 const labels=delivery?['신청 접수','방문 준비','운송·설치','전달 완료']:['신청 접수','수거 준비','이동·처리','처리 완료'];
 const cancelled=record.status==='취소',done=record.status==='완료';
 const stage=record.stage||0,index=done?3:stage>=2?2:stage===1?1:0;
 const current=cancelled?'신청 취소':done?labels[3]:stage===4?(delivery?'도착 · 설치 확인 중':'처리장 도착 · 처리 대기'):stage===3?(delivery?'목적지로 운송 중':'최종 처리장으로 이동 중'):stage===2?(delivery?'물품 인수 완료':'수거 완료'):labels[index];
 const next=cancelled?'진행이 중단된 신청이에요.':done?(delivery?'인수 확인 내역을 볼 수 있어요.':'처리 내역과 적립 포인트를 확인하세요.'):stage===4?(delivery?'설치·전달 확인 후 완료돼요.':'최종 처리 확인 후 포인트가 적립돼요.'):stage>=2?'도착하면 인수·처리 확인으로 이어져요.':stage===1?'파트너가 물품을 수거할 예정이에요.':'파트너 배정과 방문 준비가 이어져요.';
 return {labels,index,done,cancelled,current,next};
}
export function progressHTML(record,delivery=false){const p=progressSummary(record,delivery);if(p.cancelled)return '<div class="journey-cancelled">취소된 신청 · 진행이 중단되었어요.</div>';return `<div class="journey-progress"><div class="journey-heading"><b>${p.current}</b><span>${p.index+1}<small> / 4단계</small></span></div><ol aria-label="${p.index+1}/4단계 ${p.current}">${p.labels.map((text,i)=>`<li class="${i<=p.index?'reached':''} ${i===p.index?'current':''}" ${i===p.index?'aria-current="step"':''}><i>${i<p.index||p.done?'✓':i+1}</i><span>${text}</span></li>`).join('')}</ol><p>${p.next}</p></div>`;}
