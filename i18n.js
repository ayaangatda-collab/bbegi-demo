import {locales,LOCALE_KEY,getLocale,setLocale,normalizeLocale,translateText} from './i18n-core.js?v=84c050cff1c8';
const originals=new WeakMap(),attrs=new WeakMap(),blocks=new WeakMap();
let observer,scheduled=false,started=false;
const ignored='script,style,textarea,[translate="no"],[data-i18n="off"],[data-i18n-text],[contenteditable="true"]';
function updateText(node){if(!node.parentElement||node.parentElement.closest(ignored))return;const prev=originals.get(node);const source=prev&&node.data===prev.last?prev.source:node.data;const translated=translateText(source);originals.set(node,{source,last:translated});if(node.data!==translated)node.data=translated;}
function updateAttrs(el){if(el.closest(ignored))return;
 // A translated option must keep its canonical domain value.
 if(el.tagName==='OPTION'&&!el.hasAttribute('value'))el.setAttribute('value',el.textContent);
 const saved=attrs.get(el)||{};
 for(const attr of ['aria-label','aria-description','placeholder','title','alt',...(el.matches?.('meta[name="description"],meta[property="og:title"],meta[property="og:description"]')?['content']:[])]){if(!el.hasAttribute(attr))continue;const value=el.getAttribute(attr),prev=saved[attr],source=prev&&prev.last===value?prev.source:value,last=translateText(source);saved[attr]={source,last};if(last!==value)el.setAttribute(attr,last);}
 attrs.set(el,saved);
}
export function localizePage(){if(!started)return;observer?.disconnect();
 const lang=getLocale();document.documentElement.lang=lang;document.documentElement.dataset.locale=lang;
 document.querySelectorAll('[data-i18n-text]').forEach(el=>{if(!blocks.has(el))blocks.set(el,el.innerHTML);const source=el.getAttribute('data-i18n-text');if(lang==='ko'){if(el.innerHTML!==blocks.get(el))el.innerHTML=blocks.get(el);}else{const value=translateText(source);if(el.textContent!==value)el.textContent=value;}});
 document.querySelectorAll('option').forEach(updateAttrs);
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while((n=walker.nextNode()))updateText(n);
 document.querySelectorAll('[aria-label],[aria-description],[placeholder],[title],[alt]').forEach(updateAttrs);
 document.querySelectorAll('meta[name="description"],meta[property="og:title"],meta[property="og:description"]').forEach(updateAttrs);
 if(document.querySelector('title')?.firstChild)updateText(document.querySelector('title').firstChild);
 document.querySelectorAll('[data-locale-short]').forEach(e=>{e.textContent=locales.find(l=>l.id===lang).short;});
 observer?.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','aria-label','aria-description','title','alt']});
 observer?.observe(document.head,{subtree:true,childList:true,characterData:true});
}
export function localeButton(){return '<button type="button" class="icon-btn language-button" data-action="language-open" aria-label="언어 변경" aria-haspopup="dialog"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z"/></svg><span data-locale-short translate="no">'+locales.find(l=>l.id===getLocale()).short+'</span></button>';}
export function initializeI18n(){if(started)return;started=true;let requested;try{requested=new URL(location.href).searchParams.get('lang')||localStorage.getItem(LOCALE_KEY);}catch{}setLocale(normalizeLocale(requested));
 document.addEventListener('input',e=>e.target.setCustomValidity?.(''),true);
 document.addEventListener('invalid',e=>{const field=e.target;if(!field.setCustomValidity)return;field.setCustomValidity('');const v=field.validity;field.setCustomValidity(translateText(v.valueMissing?'이 항목을 입력하거나 선택해 주세요.':v.typeMismatch?'올바른 형식으로 입력해 주세요.':v.tooShort?'입력한 내용이 너무 짧아요.':v.rangeUnderflow||v.rangeOverflow?'허용된 범위 안의 값을 입력해 주세요.':'입력한 내용을 다시 확인해 주세요.'));},true);
 observer=new MutationObserver(()=>{if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;localizePage();});});localizePage();
}
export function changeLanguage(id){const locale=setLocale(id);try{localStorage.setItem(LOCALE_KEY,locale);}catch{}const url=new URL(location.href);url.searchParams.set('lang',locale);history.replaceState(history.state,'',url);localizePage();document.dispatchEvent(new CustomEvent('bbegi:locale',{detail:{locale}}));}
export function openLanguagePicker(openModal){openModal('언어 선택',`<p class="language-intro">화면에 표시할 언어를 선택해 주세요.</p><div class="language-options" role="group" aria-label="언어">${locales.map(l=>`<button type="button" data-action="language-set" data-locale="${l.id}" aria-pressed="${getLocale()===l.id}"><span lang="${l.id}" translate="no">${l.label}<small>${l.name}</small></span><span class="language-check" aria-hidden="true">${getLocale()===l.id?'✓':''}</span></button>`).join('')}</div><p class="language-note">언어를 바꿔도 작성 중인 내용과 포인트는 유지돼요. 가격은 원화 기준입니다.</p>`);}
export function untranslatedUI(){return [...document.querySelectorAll('body *')].filter(e=>!e.closest(ignored)).flatMap(e=>[...e.childNodes].filter(n=>n.nodeType===3&&/[가-힣]/.test(n.data)).map(n=>n.data.trim())).filter(Boolean);}
