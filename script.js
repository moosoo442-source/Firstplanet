'use strict';
/* CharaWiki v3.3 — script.js */

const STORE_KEY = 'cw3';
const body = document.body;

/* ── STORAGE ── */
function loadStore(){try{const r=localStorage.getItem(STORE_KEY);return r?JSON.parse(r):null;}catch{return null;}}
function saveStore(d){try{localStorage.setItem(STORE_KEY,JSON.stringify(d));}catch{toast('⚠️ 저장 공간 부족');}}

/* ── STATE ── */
let store = loadStore()||{chars:[],settings:{theme:'light',font:'sans'}};
store.settings = store.settings||{theme:'light',font:'sans'};
let curCharId=null, curPageId='main', editMode=false, saveTimer=null;

/* ── DOM ── */
const $=id=>document.getElementById(id);
const $$=s=>document.querySelectorAll(s);
function el(tag,cls,html){const e=document.createElement(tag);if(cls)e.className=cls;if(html!==undefined)e.innerHTML=html;return e;}
function tx(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;e.textContent=text||'';return e;}

/* ── TOAST ── */
function toast(msg,ms=2600){const d=tx('div','toast',msg);$('toastWrap').appendChild(d);setTimeout(()=>d.remove(),ms+350);}

/* ── MODAL ── */
function openM(id){$(id)&&$(id).classList.add('open');}
function closeM(id){$(id)&&$(id).classList.remove('open');}
$$('.modal').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)m.classList.remove('open');}));
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){$$('.modal.open').forEach(m=>m.classList.remove('open'));$('lightbox').classList.remove('open');closeFP(activeFP);}
});
$$('[data-close]').forEach(b=>b.onclick=()=>closeM(b.dataset.close));

/* 삭제 확인 */
let cfCb=null;
function confirm2(msg,cb){$('cfMsg').textContent=msg;cfCb=cb;openM('confirmModal');}
$('cfOk').onclick=()=>{closeM('confirmModal');cfCb?.();cfCb=null;};

/* ── AUTO-SAVE ── */
function schedSave(){clearTimeout(saveTimer);saveTimer=setTimeout(doSave,700);}
function doSave(){
  if(!curCharId)return;
  const ch=getChar();if(!ch)return;
  ch.updatedAt=Date.now();
  saveInfoboxFromDom(ch);
  saveArticleFromDom(ch);
  ch.name=$('charTitle')?.textContent.trim()||ch.name;
  ch.subtitle=$('charSub')?.textContent.trim()||ch.subtitle;
  const ibSpan=document.querySelector('.ib-hd span');
  if(ibSpan)ch.infobox.title=ibSpan.textContent.trim();
  saveStore(store);
  updateStats();
}
document.addEventListener('input',()=>{if(curCharId&&editMode)schedSave();});

/* ── DATA MODELS ── */
function getChar(id){return store.chars.find(c=>c.id===(id||curCharId));}
function mkChar(name,sub,tagsStr){
  const id='c'+Date.now();
  return{id,name:name||'새 캐릭터',subtitle:sub||'',
    tags:tagsStr?tagsStr.split(',').map(t=>t.trim()).filter(Boolean):[],
    emoji:'🧑',avatarImg:null,coverImg:null,
    style:{theme:store.settings.theme||'light',accent:'#2563eb',font:'sans',ibStyle:'classic',layout:'right',fontSize:15,pattern:'none',divider:'line'},
    infobox:{title:name||'캐릭터',image:null,imageCaption:'',imageFilter:'',
      rows:[{t:'sec',label:'기본 정보'},{t:'row',key:'이름',val:name||''},{t:'row',key:'나이',val:''},{t:'row',key:'성별',val:''},{t:'row',key:'생일',val:''},
            {t:'sec',label:'신체'},{t:'row',key:'신장',val:''},{t:'row',key:'혈액형',val:''},
            {t:'sec',label:'기타'},{t:'row',key:'직업',val:''},{t:'row',key:'소속',val:''}]},
    pages:{main:mkPage('메인')},pageOrder:['main'],
    categories:['캐릭터'],createdAt:Date.now(),updatedAt:Date.now()};
}
function mkPage(title){return{id:'p'+Date.now()+Math.random().toString(36).slice(2,6),title:title||'새 페이지',sections:[]};}
function mkSec(type){
  const id='s'+Date.now()+Math.random().toString(36).slice(2,6);
  const b={id,type,title:''};
  switch(type){
    case 'text':      return{...b,title:'개요',content:'내용을 입력하세요.'};
    case 'list':      return{...b,title:'목록',items:['항목 1','항목 2']};
    case 'stats':     return{...b,title:'능력치',rows:[{name:'전투력',val:80,desc:'설명'},{name:'지략',val:70,desc:'설명'}]};
    case 'relations': return{...b,title:'인간관계',cards:[{emoji:'👤',name:'이름',rtype:'관계',desc:'설명을 입력하세요.'}]};
    case 'timeline':  return{...b,title:'행적',items:[{date:'시기',text:'내용'}]};
    case 'quotes':    return{...b,title:'어록',items:[{quote:'"어록을 입력하세요."',source:'— 출처'}]};
    case 'gallery':   return{...b,title:'갤러리',images:[]};
    case 'video':     return{...b,title:'관련 영상',videoId:''};
    case 'links':     return{...b,title:'외부 링크',items:[{icon:'🌐',name:'공식 사이트',url:'https://'}]};
    case 'spoiler':   return{...b,title:'스포일러',content:'스포일러 내용을 입력하세요.'};
    case 'table':     return{...b,title:'표',headers:['항목1','항목2','항목3'],rows:[['','',''],['','','']]};
    default:          return{...b,title:'새 섹션',content:''};
  }
}

/* ── CHAR LIST ── */
function renderCharList(){
  const ul=$('charList');ul.innerHTML='';
  const q=$('charSearch').value.toLowerCase();
  store.chars.filter(c=>!q||c.name.toLowerCase().includes(q)).forEach(ch=>{
    const li=el('li','char-item'+(ch.id===curCharId?' active':''));
    const av=el('div','char-av');
    if(ch.avatarImg){const i=el('img');i.src=ch.avatarImg;i.alt=ch.name;av.appendChild(i);}
    else av.textContent=ch.emoji||'🧑';
    const nm=tx('span','char-nm',ch.name);
    const db=el('button','char-del','🗑');db.title='삭제';
    db.onclick=e=>{e.stopPropagation();confirm2(`"${ch.name}" 캐릭터를 삭제할까요?`,()=>deleteChar(ch.id));};
    li.append(av,nm,db);li.onclick=()=>openChar(ch.id);
    ul.appendChild(li);
  });
}
$('charSearch').oninput=renderCharList;

function deleteChar(id){
  store.chars=store.chars.filter(c=>c.id!==id);saveStore(store);
  if(curCharId===id){curCharId=null;showHome();}
  renderCharList();toast('🗑 캐릭터 삭제됨');
}

/* ── NEW CHAR ── */
[$('newCharBtn'),$('heroNewBtn')].forEach(b=>b.onclick=()=>openM('newCharModal'));
$('newCharOk').onclick=()=>{
  const name=$('ncName').value.trim();if(!name){$('ncName').focus();return;}
  const ch=mkChar(name,$('ncSub').value.trim(),$('ncTags').value.trim());
  store.chars.push(ch);saveStore(store);
  $('ncName').value='';$('ncSub').value='';$('ncTags').value='';
  closeM('newCharModal');renderCharList();openChar(ch.id);
  toast(`✨ "${name}" 캐릭터 생성됨!`);
};
$('ncName').onkeydown=e=>{if(e.key==='Enter')$('newCharOk').click();};

/* ── OPEN / HOME ── */
function openChar(id){
  curCharId=id;curPageId='main';
  setEditMode(false);
  $('homeScreen').style.display='none';
  $('wikiScreen').style.display='flex';
  renderCharList();renderAll();
  if(window.innerWidth<=768)collapseSidebar();
}
function showHome(){
  $('homeScreen').style.display='flex';
  $('wikiScreen').style.display='none';
  $('breadCur').textContent='';
  $('breadSubWrap').style.display='none';
  renderCharList();
}

/* ── EDIT MODE ── */
function setEditMode(on){
  editMode=on;
  body.classList.toggle('edit',on);
  $('editBtn').style.display=on?'none':'';
  $('doneBtn').style.display=on?'':'none';
  $('modeBadge').className='mode-badge '+(on?'mode-edit':'mode-view');
  $('modeIcon').textContent=on?'✎':'👁';
  $('modeLbl').textContent=on?'편집 중':'보기 모드';
  const ce=on?'true':'false';
  [$('charTitle'),$('charSub')].forEach(e=>{if(e)e.contentEditable=ce;});
  const ibSpan=document.querySelector('.ib-hd span');
  if(ibSpan)ibSpan.contentEditable=ce;
  $$('#ibTbody th,#ibTbody td,.ib-sec-td,#ibCap').forEach(e=>e.contentEditable=ce);
  if(curCharId){renderPage(getChar(),curPageId);renderCats(getChar());}
}
$('editBtn').onclick=()=>{setEditMode(true);toast('✎ 편집 모드');};
$('doneBtn').onclick=()=>{doSave();setEditMode(false);toast('✓ 저장 완료!');};

/* ── RENDER ALL ── */
function renderAll(){
  const ch=getChar();if(!ch)return;
  applyStyle(ch);renderCover(ch);renderAvatar(ch);renderHeaderInfo(ch);
  renderTabs(ch);renderInfobox(ch);renderPage(ch,curPageId);
  renderCats(ch);updateStats();updateBreadcrumb(ch);
}

/* ── STYLE ── */
function applyStyle(ch){
  const s=ch.style;
  document.documentElement.setAttribute('data-theme',s.theme||'light');
  setAccent(s.accent||'#2563eb');
  body.className=body.className.replace(/font-\S+/g,'').replace(/pat-\S+/g,'').replace(/\s+/g,' ').trim();
  body.classList.add('font-'+(s.font||'sans'));
  if(s.pattern&&s.pattern!=='none')body.classList.add('pat-'+s.pattern);
  document.documentElement.style.fontSize=(s.fontSize||15)+'px';
  const cl=$('cLayout');if(cl)cl.className='lay-'+(s.layout||'right');
  const ib=$('infobox');
  if(ib){ib.classList.remove('sty-classic','sty-card','sty-minimal');ib.classList.add('sty-'+(s.ibStyle||'classic'));}
  applyDivider(s.divider||'line');
  syncStylePanel(s);
}

function setAccent(c){
  /* 테마 고유 변수를 건드리지 않고 accent만 오버라이드 */
  document.documentElement.style.setProperty('--ac',c);
  document.documentElement.style.setProperty('--ac-h',shadeColor(c,-18));
  document.documentElement.style.setProperty('--ac-l',hexToRgba(c,0.1));
  document.documentElement.style.setProperty('--bar-a',c);
}
function shadeColor(hex,pct){
  const n=parseInt(hex.replace('#',''),16);
  const r=Math.min(255,Math.max(0,(n>>16)+pct));
  const g=Math.min(255,Math.max(0,((n>>8)&0xff)+pct));
  const b2=Math.min(255,Math.max(0,(n&0xff)+pct));
  return '#'+[r,g,b2].map(x=>x.toString(16).padStart(2,'0')).join('');
}
function hexToRgba(hex,a){
  const n=parseInt(hex.replace('#',''),16);
  return`rgba(${n>>16},${(n>>8)&0xff},${n&0xff},${a})`;
}
function applyDivider(dv){
  $$('.wsec').forEach(s=>{
    s.classList.remove('dv-dashed','dv-gradient','dv-none');
    if(dv!=='line')s.classList.add('dv-'+dv);
  });
}

function syncStylePanel(s){
  const th=s.theme||'light',ac=s.accent||'#2563eb',fn=s.font||'sans';
  const ibs=s.ibStyle||'classic',lay=s.layout||'right';
  const pat=s.pattern||'none',dv=s.divider||'line',fsz=s.fontSize||15;
  $$('.th-btn').forEach(b=>b.classList.toggle('on',b.dataset.theme===th));
  $$('.ac-dot').forEach(d=>d.classList.toggle('on',d.dataset.accent===ac));
  $$('[data-font]').forEach(b=>b.classList.toggle('on',b.dataset.font===fn));
  $$('[data-ibs]').forEach(b=>b.classList.toggle('on',b.dataset.ibs===ibs));
  $$('[data-lay]').forEach(b=>b.classList.toggle('on',b.dataset.lay===lay));
  $$('[data-pat]').forEach(b=>b.classList.toggle('on',b.dataset.pat===pat));
  $$('[data-dv]').forEach(b=>b.classList.toggle('on',b.dataset.dv===dv));
  [$('fszRange'),$('fszRangeFloat')].forEach(r=>{if(r)r.value=fsz;});
  [$('fszLbl'),$('fszLblFloat')].forEach(l=>{if(l)l.textContent=fsz;});
  [$('acInp'),$('acInpFloat')].forEach(i=>{if(i)i.value=ac;});
}

/* Style panel events — 사이드 패널 */
$$('#stylePanel .th-btn').forEach(b=>b.onclick=()=>applyThemeBtn(b));
$$('#stylePanel .ac-dot').forEach(d=>d.onclick=()=>applyAccentBtn(d));
$$('#stylePanel [data-font]').forEach(b=>b.onclick=()=>applyFontBtn(b));
$$('#stylePanel [data-ibs]').forEach(b=>b.onclick=()=>applyIbsBtn(b));
$$('#stylePanel [data-lay]').forEach(b=>b.onclick=()=>applyLayBtn(b));
$$('#stylePanel [data-pat]').forEach(b=>b.onclick=()=>applyPatBtn(b));
$$('#stylePanel [data-dv]').forEach(b=>b.onclick=()=>applyDvBtn(b));
$('fszRange').oninput=()=>applyFsz($('fszRange').value);
$('acInp').oninput=()=>applyAccentColor($('acInp').value);
$('resetSP').onclick=()=>resetStyle();

/* Floating panel events */
$$('#fpThemeGrid .th-btn').forEach(b=>b.onclick=()=>applyThemeBtn(b));
$$('#fpAccentRow .ac-dot').forEach(d=>d.onclick=()=>applyAccentBtn(d));
$$('#stylePanelFloat [data-font]').forEach(b=>b.onclick=()=>applyFontBtn(b));
$$('#stylePanelFloat [data-ibs]').forEach(b=>b.onclick=()=>applyIbsBtn(b));
$$('#stylePanelFloat [data-lay]').forEach(b=>b.onclick=()=>applyLayBtn(b));
$$('#stylePanelFloat [data-pat]').forEach(b=>b.onclick=()=>applyPatBtn(b));
$$('#stylePanelFloat [data-dv]').forEach(b=>b.onclick=()=>applyDvBtn(b));
$('fszRangeFloat').oninput=()=>applyFsz($('fszRangeFloat').value);
$('acInpFloat').oninput=()=>applyAccentColor($('acInpFloat').value);
$('resetSPFloat').onclick=()=>resetStyle();

const THEME_ACCENTS={light:'#2563eb',dark:'#3b82f6',sepia:'#92400e',pink:'#be185d',mint:'#059669',navy:'#38bdf8',galaxy:'#c084fc',retro:'#b45309'};
function applyThemeBtn(b){
  const ch=getChar();const t=b.dataset.theme;
  if(ch){
    ch.style.theme=t;
    /* 캐릭터 accent가 이전 테마 기본값이었으면 새 테마 기본값으로 교체 */
    const oldDefault=THEME_ACCENTS[store.settings.theme||'light'];
    if(!ch.style.accent||ch.style.accent===oldDefault){
      ch.style.accent=THEME_ACCENTS[t]||'#2563eb';
    }
    schedSave();
  }
  store.settings.theme=t;saveStore(store);
  document.documentElement.setAttribute('data-theme',t);
  /* CSS 변수 초기화 후 캐릭터 accent 재적용 */
  document.documentElement.style.removeProperty('--ac');
  document.documentElement.style.removeProperty('--ac-h');
  document.documentElement.style.removeProperty('--ac-l');
  document.documentElement.style.removeProperty('--bar-a');
  if(ch&&ch.style.accent!==THEME_ACCENTS[t]){
    setAccent(ch.style.accent);
  }
  $$('.th-btn').forEach(x=>x.classList.toggle('on',x.dataset.theme===t));
  syncStylePanel(ch?.style||{theme:t,accent:THEME_ACCENTS[t]||'#2563eb'});
  toast('🎨 '+b.textContent.trim()+' 테마');
}
function applyAccentBtn(d){
  applyAccentColor(d.dataset.accent);
  $$('.ac-dot').forEach(x=>x.classList.remove('on'));d.classList.add('on');
  [$('acInp'),$('acInpFloat')].forEach(i=>{if(i)i.value=d.dataset.accent;});
}
function applyAccentColor(c){
  const ch=getChar();if(ch){ch.style.accent=c;schedSave();}
  setAccent(c);
  $$('.ac-dot').forEach(x=>x.classList.toggle('on',x.dataset.accent===c));
}
function applyFontBtn(b){
  const ch=getChar();if(!ch)return;ch.style.font=b.dataset.font;
  body.className=body.className.replace(/font-\S+/g,'').trim();
  body.classList.add('font-'+b.dataset.font);
  $$('[data-font]').forEach(x=>x.classList.toggle('on',x.dataset.font===b.dataset.font));
  schedSave();
}
function applyIbsBtn(b){
  const ch=getChar();if(!ch)return;ch.style.ibStyle=b.dataset.ibs;
  const ib=$('infobox');ib.classList.remove('sty-classic','sty-card','sty-minimal');
  ib.classList.add('sty-'+b.dataset.ibs);
  $$('[data-ibs]').forEach(x=>x.classList.toggle('on',x.dataset.ibs===b.dataset.ibs));
  schedSave();
}
function applyLayBtn(b){
  const ch=getChar();if(!ch)return;ch.style.layout=b.dataset.lay;
  $('cLayout').className='lay-'+b.dataset.lay;
  $$('[data-lay]').forEach(x=>x.classList.toggle('on',x.dataset.lay===b.dataset.lay));
  schedSave();
}
function applyPatBtn(b){
  const ch=getChar();if(!ch)return;ch.style.pattern=b.dataset.pat;
  body.className=body.className.replace(/pat-\S+/g,'').trim();
  if(b.dataset.pat!=='none')body.classList.add('pat-'+b.dataset.pat);
  $$('[data-pat]').forEach(x=>x.classList.toggle('on',x.dataset.pat===b.dataset.pat));
  schedSave();
}
function applyDvBtn(b){
  const ch=getChar();if(!ch)return;ch.style.divider=b.dataset.dv;
  applyDivider(b.dataset.dv);
  $$('[data-dv]').forEach(x=>x.classList.toggle('on',x.dataset.dv===b.dataset.dv));
  schedSave();
}
function applyFsz(v){
  const ch=getChar();if(!ch)return;ch.style.fontSize=+v;
  document.documentElement.style.fontSize=v+'px';
  [$('fszRange'),$('fszRangeFloat')].forEach(r=>{if(r)r.value=v;});
  [$('fszLbl'),$('fszLblFloat')].forEach(l=>{if(l)l.textContent=v;});
  schedSave();
}
function resetStyle(){
  const ch=getChar();if(!ch)return;
  ch.style={theme:'light',accent:'#2563eb',font:'sans',ibStyle:'classic',layout:'right',fontSize:15,pattern:'none',divider:'line'};
  saveStore(store);applyStyle(ch);toast('↺ 스타일 초기화됨');
}

/* ── FLOATING PANELS ── */
let activeFP=null;
const fpOverlay=$('fpOverlay');
function openFP(id){
  if(activeFP&&activeFP!==id)closeFP(activeFP);
  $(id)?.classList.add('open');fpOverlay.classList.add('on');activeFP=id;
}
function closeFP(id){if(id)$(id)?.classList.remove('open');fpOverlay.classList.remove('on');activeFP=null;}
$('themePanelBtn').onclick=e=>{e.stopPropagation();activeFP==='themePanelFloat'?closeFP('themePanelFloat'):openFP('themePanelFloat');};
$('stylePanelBtn').onclick=e=>{e.stopPropagation();activeFP==='stylePanelFloat'?closeFP('stylePanelFloat'):openFP('stylePanelFloat');};
fpOverlay.onclick=()=>closeFP(activeFP);
$$('.fp-close').forEach(b=>b.onclick=()=>closeFP(b.dataset.fp));

/* ── COVER & AVATAR ── */
function renderCover(ch){$('coverBg').style.backgroundImage=ch.coverImg?`url(${ch.coverImg})`:''}
$('changeCoverBtn').onclick=()=>{if(!editMode)return;$('coverUpload').click();};
$('rmCoverBtn').onclick=()=>{const ch=getChar();if(!ch)return;ch.coverImg=null;saveStore(store);renderCover(ch);};
$('coverUpload').onchange=e=>{const f=e.target.files[0];if(!f)return;readFile(f,url=>{const ch=getChar();ch.coverImg=url;saveStore(store);renderCover(ch);});};
function renderAvatar(ch){
  const em=$('avEmoji'),img=$('avImg');
  if(ch.avatarImg){img.src=ch.avatarImg;img.style.display='block';em.style.display='none';}
  else{img.style.display='none';em.style.display='';em.textContent=ch.emoji||'🧑';}
}
$('avCam').onclick=()=>{if(!editMode)return;$('avUpload').click();};
$('avUpload').onchange=e=>{const f=e.target.files[0];if(!f)return;readFile(f,url=>{const ch=getChar();ch.avatarImg=url;saveStore(store);renderAvatar(ch);renderCharList();});};

/* ── HEADER INFO ── */
function renderHeaderInfo(ch){
  $('charTitle').textContent=ch.name;
  $('charSub').textContent=ch.subtitle||'';
  const tags=$('headerTags');tags.innerHTML='';
  (ch.tags||[]).forEach(t=>{const s=tx('span','char-tag',t);tags.appendChild(s);});
}
$('charTitle').oninput=()=>{const ch=getChar();if(ch){ch.name=($('charTitle').textContent.trim()||ch.name);renderCharList();updateBreadcrumb(ch);schedSave();}};
$('charSub').oninput=()=>{const ch=getChar();if(ch){ch.subtitle=$('charSub').textContent.trim();schedSave();}};
function updateBreadcrumb(ch){
  $('breadCur').textContent=ch?.name||'';
  const isSub=curPageId!=='main';
  $('breadSubWrap').style.display=isSub?'':'none';
  if(isSub)$('breadSubName').textContent=ch?.pages?.[curPageId]?.title||'';
}

/* ── SUB PAGES ── */
function renderTabs(ch){
  const row=$('tabRow');row.innerHTML='';
  const ids=['main',...(ch.pageOrder||[]).filter(id=>id!=='main')];
  ids.forEach(pid=>{
    const page=pid==='main'?{title:'메인'}:ch.pages[pid];if(!page)return;
    const d=el('div','tab'+(pid===curPageId?' active':''));d.textContent=page.title;
    if(pid!=='main'){
      const x=el('button','tab-del-btn','✕');x.title='페이지 삭제';
      x.onclick=e=>{e.stopPropagation();confirm2(`"${page.title}" 페이지를 삭제할까요?`,()=>delSubPage(ch,pid));};
      d.appendChild(x);
    }
    d.onclick=()=>switchPage(pid);row.appendChild(d);
  });
}
function switchPage(pid){
  if(editMode)doSave();
  curPageId=pid;const ch=getChar();
  renderTabs(ch);renderPage(ch,pid);updateBreadcrumb(ch);
  $('backRow').style.display=pid!=='main'?'':'none';
}
function delSubPage(ch,pid){
  delete ch.pages[pid];ch.pageOrder=(ch.pageOrder||[]).filter(id=>id!==pid);
  saveStore(store);curPageId='main';renderTabs(ch);renderPage(ch,'main');updateBreadcrumb(ch);toast('페이지 삭제됨');
}
$('addSubPageBtn').onclick=()=>{if(!curCharId)return;openM('subModal');};
$('subOk').onclick=()=>{
  const name=$('subName').value.trim();if(!name){$('subName').focus();return;}
  const ch=getChar();const p=mkPage(name);ch.pages[p.id]=p;
  if(!ch.pageOrder)ch.pageOrder=['main'];ch.pageOrder.push(p.id);
  saveStore(store);renderTabs(ch);switchPage(p.id);$('subName').value='';closeM('subModal');toast(`📄 "${name}" 페이지 추가됨`);
};
$('subName').onkeydown=e=>{if(e.key==='Enter')$('subOk').click();};
$('backBtn').onclick=()=>switchPage('main');

/* ── INFOBOX ── */
function renderInfobox(ch){
  const ib=ch.infobox;
  document.querySelector('.ib-hd span').textContent=ib.title||ch.name;
  if(ib.image){
    $('ibImgPh').style.display='none';$('ibImgWrap').style.display='';
    $('ibImg').src=ib.image;$('ibImg').style.filter=ib.imageFilter||'';
    $('ibCap').textContent=ib.imageCaption||'';$('ibFsel').value=ib.imageFilter||'';
  }else{$('ibImgPh').style.display='';$('ibImgWrap').style.display='none';}
  const tbody=$('ibTbody');tbody.innerHTML='';
  (ib.rows||[]).forEach(row=>{
    if(row.t==='sec'){
      const tr=document.createElement('tr');
      const td=el('td','ib-sec-td');td.textContent=row.label;td.setAttribute('colspan','2');
      td.contentEditable=editMode?'true':'false';tr.appendChild(td);tbody.appendChild(tr);
    }else{
      const tr=document.createElement('tr');
      const th=el('th');th.textContent=row.key;th.contentEditable=editMode?'true':'false';
      const td=el('td');td.textContent=row.val||'';td.contentEditable=editMode?'true':'false';
      tr.append(th,td);tbody.appendChild(tr);
    }
  });
  const span=document.querySelector('.ib-hd span');
  if(span)span.contentEditable=editMode?'true':'false';
}
function saveInfoboxFromDom(ch){
  const span=document.querySelector('.ib-hd span');if(span)ch.infobox.title=span.textContent.trim();
  const cap=$('ibCap');if(cap)ch.infobox.imageCaption=cap.textContent.trim();
  const rows=[];
  $('ibTbody').querySelectorAll('tr').forEach(tr=>{
    const st=tr.querySelector('.ib-sec-td');
    if(st){rows.push({t:'sec',label:st.textContent.trim()});return;}
    const th=tr.querySelector('th'),td=tr.querySelector('td');
    if(th&&td)rows.push({t:'row',key:th.textContent.trim(),val:td.textContent.trim()});
  });
  ch.infobox.rows=rows;
}
$('ibImgPh').onclick=()=>{if(editMode)$('ibImgUp').click();};
$('ibImgUp').onchange=e=>{const f=e.target.files[0];if(!f)return;readFile(f,url=>{const ch=getChar();ch.infobox.image=url;saveStore(store);renderInfobox(ch);});};
$('ibImgRm').onclick=e=>{e.stopPropagation();const ch=getChar();ch.infobox.image=null;saveStore(store);renderInfobox(ch);};
$('ibFsel').onchange=()=>{const ch=getChar();if(!ch)return;ch.infobox.imageFilter=$('ibFsel').value;$('ibImg').style.filter=$('ibFsel').value;saveStore(store);};
$('ibAddRow').onclick=()=>openM('ibAddModal');
$('ibAddOk').onclick=()=>{
  const k=$('ibAKey').value.trim();if(!k){$('ibAKey').focus();return;}
  const ch=getChar();ch.infobox.rows.push({t:'row',key:k,val:$('ibAVal').value.trim()});
  saveStore(store);renderInfobox(ch);$('ibAKey').value='';$('ibAVal').value='';closeM('ibAddModal');
};
$('ibAKey').onkeydown=e=>{if(e.key==='Enter')$('ibAVal').focus();};
$('ibAVal').onkeydown=e=>{if(e.key==='Enter')$('ibAddOk').click();};
$('ibAddSec').onclick=()=>{const label=prompt('소제목 이름:');if(!label)return;const ch=getChar();ch.infobox.rows.push({t:'sec',label});saveStore(store);renderInfobox(ch);};
$('ibDelRow').onclick=()=>{const ch=getChar();if(!ch||!ch.infobox.rows.length)return;ch.infobox.rows.pop();saveStore(store);renderInfobox(ch);};

/* ── RENDER PAGE ── */
function renderPage(ch,pid){
  const page=ch.pages[pid];const article=$('article');article.innerHTML='';
  if(!page)return;
  (page.sections||[]).forEach((sec,i)=>article.appendChild(buildSec(sec,i+1,ch)));
  renderToc();applyDivider(ch.style.divider||'line');
}

/* ── BUILD SECTION ── */
function buildSec(sec,num,ch){
  const wrap=el('div','wsec');wrap.dataset.id=sec.id;
  if(editMode)wrap.setAttribute('draggable','true');
  const hd=el('div','sec-hd');
  if(editMode){
    const dh=el('span','drag-h','⠿');dh.title='드래그로 순서 변경';hd.appendChild(dh);
  }
  const ttl=el('h2','sec-ttl');
  ttl.textContent=`${num}. ${sec.title||'섹션'}`;
  ttl.id='sec-'+sec.id;
  if(editMode){ttl.contentEditable='true';ttl.addEventListener('input',schedSave);}
  hd.appendChild(ttl);
  if(editMode){
    const tools=el('div','sec-tools');
    const upB=el('button','stool','↑');upB.title='위로';upB.onclick=()=>moveS(sec.id,-1,ch);
    const dnB=el('button','stool','↓');dnB.title='아래로';dnB.onclick=()=>moveS(sec.id,1,ch);
    const dlB=el('button','stool del','🗑');dlB.title='삭제';
    dlB.onclick=()=>confirm2(`"${sec.title}" 섹션을 삭제할까요?`,()=>deleteS(sec.id,ch));
    tools.append(upB,dnB,dlB);hd.appendChild(tools);
  }
  wrap.appendChild(hd);
  const bd=el('div','sec-body');
  const r={text:()=>bText(sec),list:()=>bList(sec),stats:()=>bStats(sec,ch),
    relations:()=>bRelations(sec,ch),timeline:()=>bTimeline(sec,ch),
    quotes:()=>bQuotes(sec,ch),gallery:()=>bGallery(sec,ch),
    video:()=>bVideo(sec,ch),links:()=>bLinks(sec,ch),
    spoiler:()=>bSpoiler(sec),table:()=>bTable(sec,ch)}[sec.type];
  bd.appendChild(r?r():(()=>{const p=el('p');p.textContent=sec.content||'';return p;})());
  wrap.appendChild(bd);return wrap;
}

/* ── SECTION BUILDERS ── */
function bText(sec){
  const div=el('div'),p=el('p');p.textContent=sec.content||'내용을 입력하세요.';
  if(editMode){p.contentEditable='true';p.addEventListener('input',schedSave);}
  div.appendChild(p);return div;
}
function bList(sec){
  const div=el('div'),ul=el('ul');
  (sec.items||[]).forEach(item=>{
    const li=el('li');li.textContent=item;
    if(editMode){li.contentEditable='true';li.addEventListener('input',schedSave);}
    ul.appendChild(li);
  });
  div.appendChild(ul);
  if(editMode){const ab=el('button','add-btn','＋ 항목 추가');ab.onclick=()=>{const li=el('li');li.textContent='새 항목';li.contentEditable='true';li.addEventListener('input',schedSave);ul.appendChild(li);li.focus();schedSave();};div.appendChild(ab);}
  return div;
}
function bStats(sec,ch){
  const div=el('div');
  const wrap=el('div','stat-wrap');
  const tbl=el('table','stat-tbl');
  const thead=el('thead');thead.innerHTML='<tr><th>능력</th><th>수치</th><th>설명</th></tr>';
  const tbody=el('tbody');
  (sec.rows||[]).forEach(row=>{
    const tr=document.createElement('tr');
    const ntd=el('td');ntd.textContent=row.name;if(editMode){ntd.contentEditable='true';ntd.addEventListener('input',schedSave);}
    const btd=document.createElement('td');
    const bw=el('div','bar-w'),bar=el('div','bar');bar.style.width=(row.val||0)+'%';bar.textContent=row.val||0;bw.appendChild(bar);
    if(editMode){const rng=el('input');rng.type='range';rng.min=0;rng.max=100;rng.value=row.val||0;rng.style.cssText='width:100%;margin-top:3px;accent-color:var(--ac)';rng.oninput=()=>{bar.style.width=rng.value+'%';bar.textContent=rng.value;schedSave();};btd.append(bw,rng);}else btd.appendChild(bw);
    const dtd=el('td');dtd.textContent=row.desc||'';if(editMode){dtd.contentEditable='true';dtd.addEventListener('input',schedSave);}
    tr.append(ntd,btd,dtd);tbody.appendChild(tr);
  });
  tbl.append(thead,tbody);wrap.appendChild(tbl);div.appendChild(wrap);
  if(editMode){
    const ab=el('button','add-row-btn','＋ 능력 추가');
    ab.onclick=()=>{const name=prompt('능력 이름:');if(!name)return;const val=Math.min(100,Math.max(0,parseInt(prompt('수치(0-100):','70'),10)||70));const desc=prompt('설명:','')||'';sec.rows.push({name,val,desc});schedSave();renderPage(ch,curPageId);};
    div.appendChild(ab);
  }
  return div;
}
function bRelations(sec,ch){
  const div=el('div'),grid=el('div','rel-grid');
  (sec.cards||[]).forEach((card,i)=>{
    const c=el('div','rel-card');
    if(editMode){const eb=el('button','rel-em-btn');eb.textContent=card.emoji||'👤';eb.onclick=()=>pickEmoji(em=>{card.emoji=em;eb.textContent=em;schedSave();});c.appendChild(eb);}
    else{const es=el('span','rel-em');es.textContent=card.emoji||'👤';c.appendChild(es);}
    const info=el('div','rel-info');
    const nm=el('div','rel-nm');nm.textContent=card.name;
    const tp=el('div','rel-tp');tp.textContent=card.rtype;
    const ds=el('div','rel-ds');ds.textContent=card.desc;
    if(editMode)[nm,tp,ds].forEach(e=>{e.contentEditable='true';e.addEventListener('input',schedSave);});
    info.append(nm,tp,ds);c.appendChild(info);
    if(editMode){const db=el('button','rel-del','✕');db.onclick=()=>{sec.cards.splice(i,1);schedSave();renderPage(ch,curPageId);};c.appendChild(db);}
    grid.appendChild(c);
  });
  div.appendChild(grid);
  if(editMode){const ab=el('button','add-btn','＋ 인물 추가');ab.onclick=()=>{sec.cards.push({emoji:'👤',name:'이름',rtype:'관계',desc:'설명'});schedSave();renderPage(ch,curPageId);};div.appendChild(ab);}
  return div;
}
function bTimeline(sec,ch){
  const div=el('div'),tl=el('div','tl');
  (sec.items||[]).forEach((item,i)=>{
    const ti=el('div','tl-item'),dot=el('div','tl-dot');
    const dt=el('div','tl-date');dt.textContent=item.date;
    const tx2=el('div','tl-txt');tx2.textContent=item.text;
    if(editMode){[dt,tx2].forEach(e=>{e.contentEditable='true';e.addEventListener('input',schedSave);});}
    ti.append(dot,dt,tx2);
    if(editMode){const db=el('button','tl-del','✕');db.onclick=()=>{sec.items.splice(i,1);schedSave();renderPage(ch,curPageId);};ti.appendChild(db);}
    tl.appendChild(ti);
  });
  div.appendChild(tl);
  if(editMode){const ab=el('button','add-btn','＋ 행적 추가');ab.onclick=()=>{sec.items.push({date:'시기',text:'내용'});schedSave();renderPage(ch,curPageId);};div.appendChild(ab);}
  return div;
}
function bQuotes(sec,ch){
  const div=el('div'),list=el('div','qt-list');
  (sec.items||[]).forEach((item,i)=>{
    const qi=el('div','qt-item');
    const bq=el('blockquote');bq.textContent=item.quote;
    const sr=el('div','qt-src');sr.textContent=item.source;
    if(editMode){[bq,sr].forEach(e=>{e.contentEditable='true';e.addEventListener('input',schedSave);});}
    qi.append(bq,sr);
    if(editMode){const db=el('button','qt-del','✕');db.onclick=()=>{sec.items.splice(i,1);schedSave();renderPage(ch,curPageId);};qi.appendChild(db);}
    list.appendChild(qi);
  });
  div.appendChild(list);
  if(editMode){const ab=el('button','add-btn','＋ 어록 추가');ab.onclick=()=>{sec.items.push({quote:'"어록을 입력하세요."',source:'— 출처'});schedSave();renderPage(ch,curPageId);};div.appendChild(ab);}
  return div;
}
function bGallery(sec,ch){
  const div=el('div'),grid=el('div','gal-grid');
  (sec.images||[]).forEach((img,i)=>{
    const item=el('div','gal-item');
    const im=el('img');im.src=img.url;im.alt=img.caption||'';im.loading='lazy';
    im.onclick=()=>openLB(img.url);item.appendChild(im);
    if(editMode){const db=el('button','gal-del','✕');db.onclick=e=>{e.stopPropagation();sec.images.splice(i,1);schedSave();renderPage(ch,curPageId);};item.appendChild(db);}
    grid.appendChild(item);
  });
  if(editMode){
    const add=el('div','gal-item gal-add');
    const ic=el('span');ic.textContent='🖼';const ht=el('span');ht.textContent='이미지 추가';
    const fi=el('input');fi.type='file';fi.accept='image/*';fi.className='fo';
    fi.onchange=e=>{const f=e.target.files[0];if(!f)return;readFile(f,url=>{if(!sec.images)sec.images=[];sec.images.push({url,caption:''});schedSave();renderPage(ch,curPageId);});};
    add.append(ic,ht,fi);grid.appendChild(add);
  }
  div.appendChild(grid);return div;
}
function bVideo(sec,ch){
  const div=el('div');
  if(sec.videoId){
    const w=el('div','yt-w'),iframe=document.createElement('iframe');
    iframe.src=`https://www.youtube.com/embed/${sec.videoId}?rel=0&modestbranding=1`;
    iframe.title='YouTube';iframe.setAttribute('allow','accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture');
    iframe.setAttribute('allowfullscreen','');iframe.loading='lazy';
    w.appendChild(iframe);div.appendChild(w);
  }
  if(editMode){
    const row=el('div','yt-input-row');
    const inp=el('input');inp.type='text';inp.placeholder='https://www.youtube.com/watch?v=...';inp.value=sec.videoId?`https://youtu.be/${sec.videoId}`:'';
    const btn=el('button','add-btn','적용');
    btn.onclick=()=>{const vid=getYtId(inp.value.trim());if(vid){sec.videoId=vid;schedSave();renderPage(ch,curPageId);}else toast('❌ 올바른 유튜브 URL을 입력하세요.');};
    inp.onkeydown=e=>{if(e.key==='Enter')btn.click();};
    row.append(inp,btn);div.appendChild(row);
  }else if(!sec.videoId){
    const ph=el('div');ph.style.cssText='padding:20px;text-align:center;color:var(--tx-3);font-size:.85rem;background:var(--bg-ib);border-radius:var(--r-m)';
    ph.textContent='영상이 없습니다.';div.appendChild(ph);
  }
  return div;
}
function bLinks(sec,ch){
  const div=el('div'),list=el('div','ext-list');
  (sec.items||[]).forEach((item,i)=>{
    const a=el('div','ext-item');
    const ic=el('span','ext-ic');ic.textContent=item.icon||'🔗';if(editMode){ic.contentEditable='true';ic.addEventListener('input',schedSave);}
    const info=el('div','ext-info');
    const nm=el('div','ext-nm');nm.textContent=item.name;if(editMode){nm.contentEditable='true';nm.addEventListener('input',schedSave);}
    const ud=el('div','ext-url-d');
    if(editMode){const ui=el('input');ui.type='text';ui.value=item.url||'';ui.style.cssText='width:100%;margin-top:3px;padding:4px 8px;border:1px solid var(--bd);border-radius:4px;background:var(--bg);color:var(--tx);font-size:.78rem';ui.oninput=()=>{item.url=ui.value.trim();schedSave();};ud.appendChild(ui);}
    else{const lk=document.createElement('a');lk.href=item.url||'#';lk.textContent=item.url||'';lk.target='_blank';lk.rel='noopener noreferrer';ud.appendChild(lk);}
    info.append(nm,ud);a.append(ic,info);
    if(editMode){const db=el('button','ext-del','✕');db.onclick=()=>{sec.items.splice(i,1);schedSave();renderPage(ch,curPageId);};a.appendChild(db);}
    list.appendChild(a);
  });
  div.appendChild(list);
  if(editMode){const ab=el('button','add-btn','＋ 링크 추가');ab.onclick=()=>{sec.items.push({icon:'🔗',name:'링크 이름',url:'https://'});schedSave();renderPage(ch,curPageId);};div.appendChild(ab);}
  return div;
}
function bSpoiler(sec){
  const wrap=el('div','spoiler');
  const tog=el('button','spl-toggle');tog.textContent=sec.title||'스포일러';tog.onclick=()=>wrap.classList.toggle('open');
  const body2=el('div','spl-body');body2.textContent=sec.content||'';
  if(editMode){body2.contentEditable='true';body2.addEventListener('input',schedSave);}
  wrap.append(tog,body2);return wrap;
}
function bTable(sec,ch){
  const div=el('div');
  const tblWrap=el('div','tbl-wrap');
  const tbl=el('table','wiki-tbl');
  const thead=el('thead'),hr=document.createElement('tr');
  (sec.headers||[]).forEach(h=>{const th=el('th');th.textContent=h;if(editMode){th.contentEditable='true';th.addEventListener('input',schedSave);}hr.appendChild(th);});
  thead.appendChild(hr);
  const tbody=el('tbody');
  (sec.rows||[]).forEach(row=>{
    const tr=document.createElement('tr');
    (row||[]).forEach(cell=>{const td=el('td');td.textContent=cell;if(editMode){td.contentEditable='true';td.addEventListener('input',schedSave);}tr.appendChild(td);});
    tbody.appendChild(tr);
  });
  tbl.append(thead,tbody);tblWrap.appendChild(tbl);div.appendChild(tblWrap);
  if(editMode){const ab=el('button','add-row-btn','＋ 행 추가');ab.onclick=()=>{sec.rows.push(new Array((sec.headers||[]).length).fill(''));schedSave();renderPage(ch,curPageId);};div.appendChild(ab);}
  return div;
}

/* ── SAVE ARTICLE FROM DOM ── */
function saveArticleFromDom(ch){
  const page=ch.pages[curPageId];if(!page)return;
  const secs=[...$('article').querySelectorAll('.wsec')];
  secs.forEach(el2=>{
    const id=el2.dataset.id,sec=page.sections.find(s=>s.id===id);if(!sec)return;
    const ttlEl=el2.querySelector('.sec-ttl');if(ttlEl)sec.title=ttlEl.textContent.trim().replace(/^\d+\.\s*/,'');
    switch(sec.type){
      case 'text':sec.content=el2.querySelector('.sec-body p')?.textContent.trim()||'';break;
      case 'list':sec.items=[...el2.querySelectorAll('.sec-body li')].map(li=>li.textContent.trim());break;
      case 'stats':sec.rows=[...el2.querySelectorAll('.stat-tbl tbody tr')].map(tr=>{const tds=tr.querySelectorAll('td');const bar=tr.querySelector('.bar');return{name:tds[0]?.textContent.trim()||'',val:parseInt(bar?.textContent)||0,desc:tds[2]?.textContent.trim()||''};});break;
      case 'relations':sec.cards=[...el2.querySelectorAll('.rel-card')].map(c=>({emoji:(c.querySelector('.rel-em-btn')||c.querySelector('.rel-em'))?.textContent||'👤',name:c.querySelector('.rel-nm')?.textContent.trim()||'',rtype:c.querySelector('.rel-tp')?.textContent.trim()||'',desc:c.querySelector('.rel-ds')?.textContent.trim()||''}));break;
      case 'timeline':sec.items=[...el2.querySelectorAll('.tl-item')].map(i=>({date:i.querySelector('.tl-date')?.textContent.trim()||'',text:i.querySelector('.tl-txt')?.textContent.trim()||''}));break;
      case 'quotes':sec.items=[...el2.querySelectorAll('.qt-item')].map(i=>({quote:i.querySelector('blockquote')?.textContent.trim()||'',source:i.querySelector('.qt-src')?.textContent.trim()||''}));break;
      case 'spoiler':sec.content=el2.querySelector('.spl-body')?.textContent.trim()||'';break;
      case 'links':sec.items=[...el2.querySelectorAll('.ext-item')].map(i=>{const ui=i.querySelector('.ext-url-d input'),lk=i.querySelector('.ext-url-d a');return{icon:i.querySelector('.ext-ic')?.textContent.trim()||'🔗',name:i.querySelector('.ext-nm')?.textContent.trim()||'',url:ui?.value||lk?.textContent.trim()||''};});break;
      case 'table':sec.headers=[...el2.querySelectorAll('.wiki-tbl thead th')].map(th=>th.textContent.trim());sec.rows=[...el2.querySelectorAll('.wiki-tbl tbody tr')].map(tr=>[...tr.querySelectorAll('td')].map(td=>td.textContent.trim()));break;
    }
  });
  page.sections=secs.map(el2=>page.sections.find(s=>s.id===el2.dataset.id)).filter(Boolean);
}

/* ── SECTION MANAGEMENT ── */
$$('.asb').forEach(btn=>btn.onclick=()=>{
  if(!curCharId)return;
  if(btn.dataset.type==='video'){openM('videoModal');return;}
  const ch=getChar(),page=ch.pages[curPageId];if(!page)return;
  const sec=mkSec(btn.dataset.type);page.sections.push(sec);
  schedSave();renderPage(ch,curPageId);
  setTimeout(()=>{$('article').lastElementChild?.scrollIntoView({behavior:'smooth',block:'start'});},80);
});
$('videoOk').onclick=()=>{
  const vid=getYtId($('ytUrl').value.trim());
  if(!vid){toast('❌ 올바른 유튜브 URL을 입력하세요.');return;}
  const ch=getChar(),page=ch.pages[curPageId];if(!page)return;
  const sec=mkSec('video');sec.videoId=vid;page.sections.push(sec);
  schedSave();renderPage(ch,curPageId);$('ytUrl').value='';closeM('videoModal');toast('▶ 영상 추가됨!');
};
$('ytUrl').onkeydown=e=>{if(e.key==='Enter')$('videoOk').click();};

function moveS(id,dir,ch){
  doSave();const page=ch.pages[curPageId],idx=page.sections.findIndex(s=>s.id===id);
  if(idx<0)return;const t=idx+dir;if(t<0||t>=page.sections.length)return;
  [page.sections[idx],page.sections[t]]=[page.sections[t],page.sections[idx]];
  saveStore(store);renderPage(ch,curPageId);
}
function deleteS(id,ch){
  doSave();ch.pages[curPageId].sections=ch.pages[curPageId].sections.filter(s=>s.id!==id);
  saveStore(store);renderPage(ch,curPageId);toast('섹션 삭제됨');
}

/* ── DRAG ── */
let dragSrc=null;
$('article').addEventListener('dragstart',e=>{const s=e.target.closest('.wsec');if(!s)return;dragSrc=s;s.style.opacity='.4';});
$('article').addEventListener('dragend',e=>{const s=e.target.closest('.wsec');if(s)s.style.opacity='';$$('.wsec').forEach(x=>x.classList.remove('drag-ov'));dragSrc=null;const ch=getChar();if(!ch)return;saveArticleFromDom(ch);saveStore(store);renderPage(ch,curPageId);});
$('article').addEventListener('dragover',e=>{e.preventDefault();const s=e.target.closest('.wsec');if(!s||s===dragSrc)return;$$('.wsec').forEach(x=>x.classList.remove('drag-ov'));s.classList.add('drag-ov');});
$('article').addEventListener('drop',e=>{e.preventDefault();const tgt=e.target.closest('.wsec');if(!tgt||!dragSrc||tgt===dragSrc)return;const par=$('article'),si=[...par.children].indexOf(dragSrc),ti=[...par.children].indexOf(tgt);si<ti?par.insertBefore(dragSrc,tgt.nextSibling):par.insertBefore(dragSrc,tgt);tgt.classList.remove('drag-ov');});

/* ── TOC ── */
function renderToc(){
  const nav=$('tocNav');nav.innerHTML='';
  $$('.wsec').forEach(sec=>{
    const ttl=sec.querySelector('.sec-ttl');if(!ttl)return;
    const a=document.createElement('a');a.className='toc-a';a.textContent=ttl.textContent.trim();
    a.href='#'+ttl.id;a.onclick=e=>{e.preventDefault();ttl.scrollIntoView({behavior:'smooth',block:'start'});};
    nav.appendChild(a);
  });
}
function updateTocHL(){
  let activeId=null;
  $$('.sec-ttl[id]').forEach(el2=>{if(el2.getBoundingClientRect().top<110)activeId=el2.id;});
  $$('.toc-a').forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#'+activeId));
}

/* ── CATEGORIES ── */
function renderCats(ch){
  const list=$('catList');list.innerHTML='';
  (ch.categories||[]).forEach((cat,i)=>{
    const chip=el('div','cat-chip');chip.textContent=cat;
    if(editMode){const x=el('button','cat-xbtn','✕');x.onclick=()=>{ch.categories.splice(i,1);saveStore(store);renderCats(ch);};chip.appendChild(x);}
    list.appendChild(chip);
  });
}
$('addCatBtn').onclick=()=>{
  const tag=prompt('분류 태그 입력:');if(!tag)return;
  const ch=getChar();if(!ch.categories)ch.categories=[];
  ch.categories.push(tag.trim());saveStore(store);renderCats(ch);
};

/* ── STATS ── */
function updateStats(){
  const ch=getChar();if(!ch)return;
  $('stPages').textContent=Object.keys(ch.pages||{}).length;
  $('stWords').textContent=($('article')?.innerText||'').replace(/\s+/g,'').length.toLocaleString();
  $('stEdit').textContent=ch.updatedAt?new Date(ch.updatedAt).toLocaleDateString('ko-KR',{month:'short',day:'numeric'}):'-';
}

/* ── SIDEBAR ── */
$('menuBtn').onclick=()=>{const sb=$('sidebar');sb.classList.contains('hidden')?expandSidebar():collapseSidebar();};
$('sbClose').onclick=collapseSidebar;
$('sbOverlay').onclick=collapseSidebar;
$('breadHome').onclick=showHome;$('breadHome').onkeydown=e=>{if(e.key==='Enter')showHome();};
function collapseSidebar(){$('sidebar').classList.add('hidden');$('main').classList.add('sb-hidden');$('sbOverlay').classList.remove('on');$('menuBtn').setAttribute('aria-expanded','false');}
function expandSidebar(){$('sidebar').classList.remove('hidden');$('main').classList.remove('sb-hidden');if(window.innerWidth<=768)$('sbOverlay').classList.add('on');$('menuBtn').setAttribute('aria-expanded','true');}

/* ── THEME TOGGLE ── */
$('themeToggle').onclick=()=>{
  const cur=document.documentElement.getAttribute('data-theme')||'light';
  const next=cur==='dark'?'light':'dark';
  document.documentElement.setAttribute('data-theme',next);
  store.settings.theme=next;const ch=getChar();if(ch)ch.style.theme=next;
  saveStore(store);$$('.th-btn').forEach(b=>b.classList.toggle('on',b.dataset.theme===next));
};

/* ── SHARE ── */
$('shareBtn').onclick=()=>{
  const ch=getChar();if(!ch){toast('캐릭터를 먼저 선택하세요');return;}
  try{
    const slim={...ch,infobox:{...ch.infobox,image:null},avatarImg:null,coverImg:null};
    const encoded=btoa(unescape(encodeURIComponent(JSON.stringify(slim))));
    const url=location.origin+location.pathname+'?share='+encoded;
    $('shrUrl').value=url;openM('shareModal');
  }catch{toast('❌ 데이터가 너무 커요. JSON 백업을 사용하세요.');}
};
$('copyShrUrl').onclick=()=>{
  const inp=$('shrUrl');inp.select();
  navigator.clipboard?.writeText(inp.value).catch(()=>document.execCommand('copy'));
  $('copyShrUrl').textContent='✅ 복사됨!';setTimeout(()=>$('copyShrUrl').textContent='복사',1600);
};
function loadShared(){
  const p=new URLSearchParams(location.search),share=p.get('share');if(!share)return false;
  try{
    const ch=JSON.parse(decodeURIComponent(escape(atob(share))));ch.id='sh_'+Date.now();
    if(!store.chars.find(c=>c.name===ch.name)){store.chars.push(ch);saveStore(store);toast(`📖 "${ch.name}" 위키를 불러왔어요!`);}
    openChar(ch.id);history.replaceState({},'',location.pathname);return true;
  }catch{toast('❌ 공유 링크 오류');return false;}
}

/* ── EXPORT / IMPORT ── */
$('exportBtn').onclick=()=>{
  const blob=new Blob([JSON.stringify(store,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='charawiki_'+new Date().toISOString().slice(0,10)+'.json';a.click();URL.revokeObjectURL(a.href);toast('💾 백업 다운로드됨!');
};
$('importBtn').onclick=()=>$('importFile').click();
$('importFile').onchange=e=>{
  const f=e.target.files[0];if(!f)return;
  const r=new FileReader();r.onload=ev=>{
    try{const d=JSON.parse(ev.target.result);if(!d.chars)throw 0;d.chars.forEach(ic=>{if(!store.chars.find(c=>c.id===ic.id))store.chars.push(ic);});saveStore(store);renderCharList();toast(`✅ ${d.chars.length}개 캐릭터 불러옴!`);}
    catch{toast('❌ 올바른 백업 파일이 아니에요.');}
  };r.readAsText(f);e.target.value='';
};

/* ── LIGHTBOX ── */
function openLB(src){$('lbImg').src=src;$('lightbox').classList.add('open');}
$('lbClose').onclick=()=>$('lightbox').classList.remove('open');
$('lightbox').onclick=e=>{if(e.target===$('lightbox'))$('lightbox').classList.remove('open');};
document.addEventListener('click',e=>{const img=e.target.closest('#ibImg,.gal-item img');if(img?.src)openLB(img.src);});

/* ── EMOJI PICKER ── */
const EMOJIS='👤👨👩👦👧👴👵🧑‍🦱🧑‍🦰🧙‍♂️🧙‍♀️🦸‍♂️🦸‍♀️🦹‍♂️🧝‍♀️🧚🧜‍♀️🧛‍♂️🤺🧞‍♂️🐉🐺🦊🐱🐻🦁🐯🐰🐸🐧🦋🌸🌺🌙⭐💫🔥💧🌊🌿🍀🎭🎯🏆👑💎🗡️🛡️🔮💌📖🎵🎶🌈🎨✨🌟'.split(/(?<=[\s\S])/u).filter(c=>c.trim());
let emojiCb=null;
function pickEmoji(cb){emojiCb=cb;openM('emojiModal');}
(function initEmoji(){const grid=$('emGrid');grid.innerHTML='';EMOJIS.forEach(em=>{const b=el('button','em-btn');b.textContent=em;grid.appendChild(b);});})();
$('emGrid').addEventListener('click',e=>{const b=e.target.closest('.em-btn');if(!b)return;emojiCb?.(b.textContent);emojiCb=null;closeM('emojiModal');});

/* ── PROGRESS / BTT ── */
const prog=$('rdProg'),btt=$('btt');
window.addEventListener('scroll',()=>{
  const doc=document.documentElement;
  const pct=doc.scrollHeight>doc.clientHeight?doc.scrollTop/(doc.scrollHeight-doc.clientHeight)*100:0;
  prog.style.width=pct+'%';
  btt.classList.toggle('on',window.scrollY>360);
  updateTocHL();
},{passive:true});
btt.onclick=()=>window.scrollTo({top:0,behavior:'smooth'});

/* ── KEYBOARD ── */
document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key==='s'){e.preventDefault();editMode?$('doneBtn').click():(saveStore(store),toast('💾 저장됨'));}
  if((e.ctrlKey||e.metaKey)&&e.key==='e'){e.preventDefault();if(!editMode&&curCharId)$('editBtn').click();}
});

/* ── RESIZE ── */
let rsz;window.addEventListener('resize',()=>{clearTimeout(rsz);rsz=setTimeout(()=>{if(window.innerWidth>768)$('sbOverlay').classList.remove('on');},200);},{passive:true});

/* ── UTILS ── */
function readFile(file,cb){const r=new FileReader();r.onload=ev=>cb(ev.target.result);r.readAsDataURL(file);}
function getYtId(url){const ps=[/youtu\.be\/([A-Za-z0-9_-]{11})/,/[?&]v=([A-Za-z0-9_-]{11})/,/embed\/([A-Za-z0-9_-]{11})/,/^([A-Za-z0-9_-]{11})$/];for(const p of ps){const m=url.match(p);if(m)return m[1];}return null;}

/* ── INIT ── */
function init(){
  document.documentElement.setAttribute('data-theme',store.settings.theme||'light');
  body.classList.add('font-'+(store.settings.font||'sans'));
  renderCharList();
  if(!loadShared()){if(store.chars.length>0)openChar(store.chars[0].id);else showHome();}
  if(window.innerWidth>768)expandSidebar();else collapseSidebar();
}
init();
