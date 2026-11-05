export const avatarNames=['차분한 미소','산뜻한 단발','안경 쓴 친구','은빛 미소','곱슬머리 친구','수염 난 친구','호기심 고양이','포근한 토끼','느긋한 판다'];
export function avatarHTML(profile={},extra=''){
 const n=Number.isInteger(profile.avatar)&&profile.avatar>=0&&profile.avatar<9?profile.avatar:0;
 return `<span class="memoji ${extra}" role="img" aria-label="${avatarNames[n]}" style="background-position:${n%3*50}% ${Math.floor(n/3)*50}%"></span>`;
}
export function createAvatars({s,save,openModal,closeModal,toast,rerender,esc}){
 let selected=0;
 function show(){openModal('나를 닮은 프로필',`<div class="avatar-preview">${avatarHTML({avatar:selected})}<h3>${esc(s().profile?.nickname||'김빼기')} 님</h3><p>마음에 드는 얼굴을 골라보세요.</p></div><div class="avatar-grid" role="group" aria-label="프로필 캐릭터 선택">${avatarNames.map((name,n)=>`<button type="button" data-action="avatar-select" data-id="${n}" aria-label="${name}" aria-pressed="${selected===n}" class="avatar-choice ${selected===n?'selected':''}">${avatarHTML({avatar:n})}<span>${name}</span></button>`).join('')}</div><button type="button" class="btn wide" data-action="avatar-save">이 프로필로 저장</button>`);}
 return {action(a,d){if(a==='avatar-picker'){selected=s().profile?.avatar||0;show();}else if(a==='avatar-select'){const n=Number(d.id);if(Number.isInteger(n)&&n>=0&&n<9){selected=n;show();}}else if(a==='avatar-save'){s().profile={...s().profile,avatar:selected};save();closeModal();rerender();toast('나의 프로필을 바꿨어요.');}else return false;return true;}};
}
