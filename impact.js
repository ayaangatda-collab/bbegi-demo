import {balance,totalSaved,products,fmt} from './model.js?v=84c050cff1c8';

export function impactSummary(state){
 const completed=state.activities.filter(item=>item.status==='완료');
 const baseline=completed.reduce((sum,item)=>sum+item.base,0);
 const saved=totalSaved(state);
 const percent=baseline?Math.round(saved/baseline*100):0;
 const available=balance(state);
 const rewards=products.filter(product=>product.price<=available);
 const next=products.slice().sort((a,b)=>a.price-b.price).find(product=>product.price>available);
 return {count:completed.length,baseline,saved,percent,remaining:100-percent,available,rewards,next};
}

export function impactCard(state){
 const data=impactSummary(state);
 return `<article class="impact-card" aria-label="나의 탄소 절감 비교">
  <div class="impact-heading"><div><p>물건 ${data.count}개의 새로운 쓰임</p><h3>${data.count?`탄소는 약 <b>${data.percent}%</b> 가볍게`:'첫 번째 순환을 기다려요'}</h3></div><img src="assets/color/herb.svg" width="32" height="32" alt=""></div>
  ${data.count?`<div class="impact-comparison" role="img" aria-label="같은 물품의 기준 탄소 배출을 100으로 보면 빼기 이용 후 ${data.remaining}. ${data.percent}% 절감한 가상 비교입니다."><div><span>일반 처리</span><i class="impact-track"><i style="width:100%"></i></i><b>100</b></div><div><span>빼기로 순환</span><i class="impact-track"><i style="width:${data.remaining}%"></i></i><b>${data.remaining}</b></div></div>`:'<p class="impact-empty">배출·재활용·중고거래를 완료하면<br>나의 물건이 만든 변화를 볼 수 있어요.</p>'}
  <div class="impact-foot"><span>${fmt(data.saved)} kg CO₂e 절감 · 가상 산정</span><button type="button" data-action="carbon-rule">계산 기준 <span aria-hidden="true">›</span></button></div>
 </article>`;
}
