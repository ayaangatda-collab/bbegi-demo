// Illustrative fixed tariff informed by publicly advertised one-ton and assembly services.
export const disposalStages=['신청 접수','파트너 배정','수거 완료','처리장 이동','처리장 도착','최종 처리 완료'];
export const deliveryStages=['신청 접수','파트너 배정','물품 인수','운송 중','도착·설치','전달 완료'];
export function transportQuote(item,{distance=10,stairs=0,dismantle=true,install=true}={}){
 if(![10,20,30,50].includes(Number(distance))||![0,1,2,3].includes(Number(stairs)))throw Error('운송 조건을 확인해 주세요.');
 const vehicle=50000,travel=({10:0,20:15000,30:30000,50:55000})[distance];
 const handling=item.kg>=40?60000:30000,stairFee=Number(stairs)*10000;
 const disassembly=dismantle?(item.photo==='bed'||item.photo==='bookshelf'?30000:20000):0;
 const assembly=install?(item.photo==='bed'||item.photo==='bookshelf'?40000:30000):0;
 return {vehicle,travel,handling,stairs:stairFee,disassembly,assembly,total:vehicle+travel+handling+stairFee+disassembly+assembly};
}
export function advanceTracking(record){
 if(record.status==='취소'||record.status==='완료')return false;
 const stage=Math.min(5,(record.stage||0)+1);record.stage=stage;
 record.events=record.events||[];record.events.push({stage,time:Date.now()});
 if(stage===5)record.status='완료';return true;
}
export function sharedProductURL(origin,item){
 if(!item.owned)return `${origin}/#/item?id=${encodeURIComponent(item.id)}`;
 // A small self-contained fictional snapshot makes local user-created listings shareable too.
 const snapshot={id:item.id,name:item.name,price:item.price,region:item.region,img:item.img,transport:item.transport,category:item.category,photo:item.photo,kg:item.kg,size:item.size,base:item.base,saved:item.saved};
 return `${origin}/#/item?id=${encodeURIComponent(item.id)}&item=${encodeURIComponent(JSON.stringify(snapshot))}`;
}
export function readSharedProduct(params){
 try{const p=JSON.parse(params.get('item'));if(!p||!(/^[a-zA-Z0-9-]{1,50}$/).test(p.id)||typeof p.name!=='string'||p.name.length>80||!Number.isFinite(p.price)||p.price<0||p.price>10000000||typeof p.img!=='string'||!/^[a-z0-9-]+\.(webp|png)$/.test(p.img))return null;
 return {...p,id:String(p.id).slice(0,50),name:p.name,region:String(p.region).slice(0,50),source:'빼기',owned:false,sold:false,transport:!!p.transport,kg:Number(p.kg)||20,size:Number(p.size)||100,base:Number(p.base)||80,saved:Number(p.saved)||48,condition:'사용감 적음',description:'이웃이 공유한 물건이에요. 새로운 쓰임을 기다리고 있어요.'};}catch{return null;}
}
