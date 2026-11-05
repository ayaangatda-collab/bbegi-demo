import {translations} from './locales/catalog.js?v=84c050cff1c8';
export const locales=[{id:'ko',label:'한국어',name:'Korean',short:'KO'},{id:'en',label:'English',name:'English',short:'EN'},{id:'ja',label:'日本語',name:'Japanese',short:'JA'},{id:'zh-Hans',label:'简体中文',name:'Simplified Chinese',short:'ZH'}];
export const LOCALE_KEY='bbegi.locale.v1';
let current='ko';
export const getLocale=()=>current;
export function normalizeLocale(v){return /^zh(?:-|$)/i.test(v||'')?'zh-Hans':locales.find(l=>l.id===v)?.id||'ko';}
export function setLocale(value){current=normalizeLocale(value);return current;}
const keys=Object.keys(translations).sort((a,b)=>b.length-a.length);
const escapeRegex=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const fragments=keys.filter(k=>/[가-힣]/.test(k)&&k.length>1&&!k.includes('{'));
const matcher=fragments.length?new RegExp(fragments.map(escapeRegex).join('|'),'g'):null;
const patterns=keys.filter(k=>k.includes('{')).map(key=>({key,regex:new RegExp('^'+escapeRegex(key).replace(/\\\{(\d+)\\\}/g,'(.+?)')+'$')}));
export function translateText(value,locale=current){
 const raw=String(value??'');if(locale==='ko'||!raw)return raw;
 const text=raw.replace(/\s+/g,' ').trim();const lang=normalizeLocale(locale);
 let result=translations[text]?.[lang];
 if(result===undefined&&/^[-+−]?[\d,]+원$/.test(text))result=text.replace(/원$/,lang==='en'?' KRW':lang==='ja'?'ウォン':'韩元');
 if(result===undefined){for(const p of patterns){const m=text.match(p.regex);if(m){result=translations[p.key][lang].replace(/\{(\d+)\}/g,(_,n)=>translateText(m[Number(n)+1],lang));break;}}}
 if(result===undefined&&matcher)result=text.replace(matcher,(match,offset)=>{let out=translations[match]?.[lang]??match;if(lang==='en'){if(offset&&/[\p{L}\p{N}]/u.test(text[offset-1])&&/^[A-Za-z]/.test(out))out=' '+out;if(/[A-Za-z]$/.test(out)&&/[\p{L}\p{N}]/u.test(text[offset+match.length]||''))out+=' ';}return out;});
 if(lang==='en'&&result)result=result.replace(/\b1 (hours|items|minutes)\b/g,(_,unit)=>'1 '+unit.slice(0,-1));
 result=(result??text).replace(/\s+/g,' ').trim();
 return (raw.match(/^\s*/)?.[0]||'')+result+(raw.match(/\s*$/)?.[0]||'');
}
export const t=translateText;
export function matchesSearch(text,query,locale=current){const clean=s=>String(s).normalize('NFKC').replace(/\s/g,'').toLocaleLowerCase();const q=clean(query);return !q||clean(text).includes(q)||clean(translateText(text,locale)).includes(q);}
export function localeLink(url,locale=current){const u=new URL(url,globalThis.location?.origin||'https://example.test');u.searchParams.set('lang',normalizeLocale(locale));return u.href;}
