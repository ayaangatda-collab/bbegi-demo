export const KEY = 'bbegi-demo-v1';
export const items = [
 {id:'sofa',name:'2인용 소파',category:'가구',base:80,saved:48,fee:8000,asset:'selfdrop'},
 {id:'chair',name:'원목 의자',category:'가구',base:31,saved:18.6,fee:3000,asset:'resell'},
 {id:'fridge',name:'소형 냉장고',category:'가전',base:70,saved:39.2,fee:5000,asset:'entrust'},
 {id:'clothes',name:'의류 5kg',category:'생활',base:25,saved:19,fee:0,asset:'resell'}
];
export {greenProducts as products} from './green-catalog.js?v=84c050cff1c8';
import {greenProducts as products} from './green-catalog.js?v=84c050cff1c8';
export const fmt=n=>new Intl.NumberFormat('ko-KR',{maximumFractionDigits:1}).format(n);
export const points=i=>Math.round(i.saved*100);
export const rate=i=>Math.round(i.saved/i.base*100);
export function initialState(){return {version:1,region:'서울 성동구 성수1가1동',activities:items.map((i,n)=>({...i,recordId:'seed-'+i.id,service:['직접버림','중고거래','내려드림','재활용'][n],status:'완료',date:['2026-09-10','2026-09-08','2026-09-05','2026-09-02'][n]})),orders:[],hopeApplications:[],permissions:{name:true,region:true,member:true,points:false},qr:null};}
export const promotionTotal=s=>(s.promoRewards||[]).reduce((sum,r)=>sum+(Number.isFinite(r.points)?r.points:0),0);
export function balance(s){return promotionTotal(s)+s.activities.filter(i=>i.status==='완료').reduce((a,i)=>a+points(i),0)-s.orders.reduce((a,i)=>a+i.price,0)}
export function totalSaved(s){return Math.round(s.activities.filter(i=>i.status==='완료').reduce((a,i)=>a+i.saved,0)*10)/10;}
export function complete(s,id){const i=s.activities.find(i=>i.recordId===id);if(!i||i.status!=='신청 완료')throw Error('이미 처리했거나 취소된 신청이에요.');i.status='완료';return points(i);}
export function cancel(s,id){const i=s.activities.find(i=>i.recordId===id);if(!i||i.status!=='신청 완료')throw Error('신청 상태를 확인해 주세요.');i.status='취소';}
export function redeem(s,productId,orderId){const p=products.find(i=>i.id===productId);if(!p)throw Error('상품을 찾을 수 없어요.');if(s.orders.some(o=>o.id===orderId))throw Error('이미 교환한 주문이에요.');if(balance(s)<p.price)throw Error('포인트가 부족해요.');const order={...p,id:orderId,date:new Date().toISOString().slice(0,10),code:'BB-'+orderId.slice(-8).toUpperCase()};s.orders.unshift(order);return order;}
