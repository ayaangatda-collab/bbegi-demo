const sheets=[
 {w:887,h:1774,cols:4,rows:[0,199,401,598,797,997,1198,1415,1774]},
 {w:887,h:1774,cols:4,rows:[0,222,444,665,887,1109,1331,1553,1774]},
 {w:887,h:1774,cols:4,rows:[0,222,444,665,887,1109,1331,1553,1774]},
 {w:768,h:2048,cols:3,rows:[0,231,464,691,924,1165,1399,1671,2048]}
];
export function generatedPhoto(index){const type=index%15,row=Math.floor(index/15),group=Math.floor(type/4),sheet=sheets[group],col=type%4;return {file:`market-atlas-${group}.webp`,x:Math.round(col*sheet.w/sheet.cols)+3,y:sheet.rows[row]+3,w:Math.round(sheet.w/sheet.cols)-6,h:sheet.rows[row+1]-sheet.rows[row]-6,sheetWidth:sheet.w,sheetHeight:sheet.h};}
const escape=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function productPhoto(item,className=''){
 const crop=item.photoCrop;
 if(!crop)return `<img ${item.owned?'translate="no"':''} class="product-photo ${className}" src="assets/${escape(item.img)}" alt="${escape(item.name||'상품 사진')}" loading="lazy" decoding="async">`;
 return `<svg ${item.owned?'translate="no"':''} class="product-photo ${className}" viewBox="${crop.x} ${crop.y} ${crop.w} ${crop.h}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${escape(item.name)}"><image href="assets/${escape(crop.file)}" width="${crop.sheetWidth}" height="${crop.sheetHeight}"/></svg>`;
}
export async function drawProductPhoto(ctx,item,x,y,w,h){
 const im=new Image(),crop=item.photoCrop;im.src='assets/'+(crop?.file||item.img);await im.decode();
 const sx=crop?.x||0,sy=crop?.y||0,sw=crop?.w||im.width,sh=crop?.h||im.height,ratio=w/h;
 const cw=Math.min(sw,sh*ratio),ch=cw/ratio;
 ctx.drawImage(im,sx+(sw-cw)/2,sy+(sh-ch)/2,cw,ch,x,y,w,h);
}
