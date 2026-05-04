/* ═══════════════════════════════════════════════
   CharaWiki v3.1 — script.js  (전체 점검 완료)
   버그 수정 목록:
   1. body 변수 선언 순서 오류 → 최상단 선언
   2. edit-only flex/block 혼용 → CSS 클래스 분리
   3. renderText innerHTML 이중 태그 → textContent 사용
   4. videoOk onclick 중복 → 별도 함수 처리
   5. ibImgPlaceholder 편집 모드 외 클릭 → 가드 추가
   6. Pretendard 폰트 없음 → Noto Sans KR 대체
   7. wikiBody 3컬럼 레이아웃 수정
   8. 섹션 번호 자동 업데이트
   9. switchSubPage 편집 중 저장 누락 수정
   10. 전반적 안정성 개선
═══════════════════════════════════════════════ */
'use strict';

/* ── 0. CONSTANTS ── */
const STORE_KEY = 'cw3';
const body = document.body;   // ← 최상단 선언 (이전 버그: 중간 선언으로 ReferenceError)

/* ── 1. STORAGE ── */
function loadStore() {
  try { const r = localStorage.getItem(STORE_KEY); return r ? JSON.parse(r) : null; }
  catch { return null; }
}
function saveStore(data) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); }
  catch { toast('⚠️ 저장 공간 부족. 이미지 크기를 줄여보세요.'); }
}

/* ── 2. APP STATE ── */
let store = loadStore() || { chars: [], settings: { theme:'light', font:'sans' } };
store.settings = store.settings || { theme:'light', font:'sans' };

let curCharId = null;
let curPageId = 'main';
let editMode  = false;
let saveTimer = null;

/* ── 3. DOM SHORTCUTS ── */
const $ = id => document.getElementById(id);
const $$ = s => document.querySelectorAll(s);
function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}
function txt(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  e.textContent = text || '';
  return e;
}

/* ── 4. TOAST ── */
function toast(msg, ms = 2600) {
  const d = el('div', 'toast'); d.textContent = msg;
  $('toastWrap').appendChild(d);
  setTimeout(() => d.remove(), ms + 350);
}

/* ── 5. MODAL ── */
function openM(id)  { $(id) && $(id).classList.add('open'); }
function closeM(id) { $(id) && $(id).classList.remove('open'); }

$$('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); }));
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    $$('.modal.open').forEach(m => m.classList.remove('open'));
    $('lightbox').classList.remove('open');
  }
});

// 공통 취소 버튼
$$('[data-close]').forEach(b => b.onclick = () => closeM(b.dataset.close));

// 삭제 확인 모달
let confirmCb = null;
function confirm2(msg, cb) {
  $('cfMsg').textContent = msg;
  confirmCb = cb;
  openM('confirmModal');
}
$('cfOk').onclick = () => { closeM('confirmModal'); confirmCb?.(); confirmCb = null; };

/* ── 6. AUTO-SAVE ── */
function schedSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(doSave, 700);
}
function doSave() {
  if (!curCharId) return;
  const ch = getChar(); if (!ch) return;
  ch.updatedAt = Date.now();
  saveInfoboxFromDom(ch);
  saveArticleFromDom(ch);
  ch.name     = $('charTitle')?.textContent.trim() || ch.name;
  ch.subtitle = $('charSub')?.textContent.trim()   || ch.subtitle;
  const ibSpan = document.querySelector('.ib-hd span');
  if (ibSpan) ch.infobox.title = ibSpan.textContent.trim();
  saveStore(store);
  updateStats();
}
document.addEventListener('input', () => { if (curCharId && editMode) schedSave(); });

/* ── 7. DATA MODELS ── */
function getChar(id) { return store.chars.find(c => c.id === (id || curCharId)); }

function mkChar(name, sub, tagsStr) {
  const id = 'c' + Date.now();
  return {
    id, name: name || '새 캐릭터', subtitle: sub || '',
    tags: tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [],
    emoji: '🧑', avatarImg: null, coverImg: null,
    style: { theme: store.settings.theme || 'light', accent:'#2563eb', font:'sans',
             ibStyle:'classic', layout:'right', fontSize:15, pattern:'none', divider:'line' },
    infobox: {
      title: name || '캐릭터', image:null, imageCaption:'', imageFilter:'',
      rows: [
        { t:'sec', label:'기본 정보' },
        { t:'row', key:'이름',   val: name || '' },
        { t:'row', key:'나이',   val: '' },
        { t:'row', key:'성별',   val: '' },
        { t:'row', key:'생일',   val: '' },
        { t:'sec', label:'신체' },
        { t:'row', key:'신장',   val: '' },
        { t:'row', key:'혈액형', val: '' },
        { t:'sec', label:'기타' },
        { t:'row', key:'직업',   val: '' },
        { t:'row', key:'소속',   val: '' },
      ]
    },
    pages: { main: mkPage('메인') },
    pageOrder: ['main'],
    categories: ['캐릭터'],
    createdAt: Date.now(), updatedAt: Date.now(),
  };
}

function mkPage(title) {
  return { id:'p'+Date.now()+Math.random().toString(36).slice(2,6), title: title||'새 페이지', sections:[] };
}

function mkSec(type) {
  const id = 's'+Date.now()+Math.random().toString(36).slice(2,6);
  const b  = { id, type, title:'' };
  switch(type) {
    case 'text':      return {...b, title:'개요',    content:'내용을 입력하세요.'};
    case 'list':      return {...b, title:'목록',    items:['항목 1','항목 2']};
    case 'stats':     return {...b, title:'능력치',  rows:[{name:'전투력',val:80,desc:'설명'},{name:'지략',val:70,desc:'설명'}]};
    case 'relations': return {...b, title:'인간관계',cards:[{emoji:'👤',name:'이름',rtype:'관계',desc:'설명을 입력하세요.'}]};
    case 'timeline':  return {...b, title:'행적',    items:[{date:'시기',text:'내용'}]};
    case 'quotes':    return {...b, title:'어록',    items:[{quote:'"어록을 입력하세요."',source:'— 출처'}]};
    case 'gallery':   return {...b, title:'갤러리',  images:[]};
    case 'video':     return {...b, title:'관련 영상',videoId:''};
    case 'links':     return {...b, title:'외부 링크',items:[{icon:'🌐',name:'공식 사이트',url:'https://'}]};
    case 'spoiler':   return {...b, title:'스포일러',content:'스포일러 내용을 입력하세요.'};
    case 'table':     return {...b, title:'표',      headers:['항목1','항목2','항목3'],rows:[['','',''],['','','']]};
    default:          return {...b, title:'새 섹션', content:''};
  }
}

/* ── 8. CHAR LIST ── */
function renderCharList() {
  const ul = $('charList'); ul.innerHTML = '';
  const q = $('charSearch').value.toLowerCase();
  store.chars.filter(c => !q || c.name.toLowerCase().includes(q)).forEach(ch => {
    const li = el('li','char-item' + (ch.id === curCharId ? ' active' : ''));
    const av = el('div','char-av');
    if (ch.avatarImg) { const i=el('img'); i.src=ch.avatarImg; i.alt=ch.name; av.appendChild(i); }
    else av.textContent = ch.emoji || '🧑';
    const nm = txt('span','char-nm', ch.name);
    const db = el('button','char-del','🗑'); db.title='삭제';
    db.onclick = e => { e.stopPropagation(); confirm2(`"${ch.name}" 캐릭터를 삭제할까요?`, () => deleteChar(ch.id)); };
    li.append(av, nm, db);
    li.onclick = () => openChar(ch.id);
    ul.appendChild(li);
  });
}
$('charSearch').oninput = renderCharList;

function deleteChar(id) {
  store.chars = store.chars.filter(c => c.id !== id);
  saveStore(store);
  if (curCharId === id) { curCharId = null; showHome(); }
  renderCharList();
  toast('🗑 캐릭터 삭제됨');
}

/* ── 9. NEW CHAR ── */
[$('newCharBtn'), $('heroNewBtn')].forEach(b => b.onclick = () => openM('newCharModal'));
$('newCharOk').onclick = () => {
  const name = $('ncName').value.trim();
  if (!name) { $('ncName').focus(); return; }
  const ch = mkChar(name, $('ncSub').value.trim(), $('ncTags').value.trim());
  store.chars.push(ch); saveStore(store);
  $('ncName').value = ''; $('ncSub').value = ''; $('ncTags').value = '';
  closeM('newCharModal'); renderCharList(); openChar(ch.id);
  toast(`✨ "${name}" 캐릭터 생성됨!`);
};
$('ncName').onkeydown = e => { if (e.key==='Enter') $('newCharOk').click(); };

/* ── 10. OPEN / HOME ── */
function openChar(id) {
  curCharId = id; curPageId = 'main';
  setEditMode(false);
  $('homeScreen').style.display = 'none';
  $('wikiScreen').style.display = 'flex';
  renderCharList(); renderAll();
  if (window.innerWidth <= 768) collapseSidebar();
}
function showHome() {
  $('homeScreen').style.display = 'flex';
  $('wikiScreen').style.display = 'none';
  $('breadCur').textContent = '';
  $('breadSubWrap').style.display = 'none';
  renderCharList();
}

/* ── 11. EDIT MODE ── */
function setEditMode(on) {
  editMode = on;
  body.classList.toggle('edit', on);
  $('editBtn').style.display = on ? 'none' : '';
  $('doneBtn').style.display = on ? '' : 'none';
  $('modeBadge').className = 'mode-badge ' + (on ? 'mode-edit' : 'mode-view');
  $('modeIcon').textContent = on ? '✎' : '👁';
  $('modeLbl').textContent  = on ? '편집 중' : '보기 모드';
  // 제목/부제목 편집 가능 여부
  const ce = on ? 'true' : 'false';
  [$('charTitle'), $('charSub')].forEach(e => { if(e) e.contentEditable = ce; });
  const ibSpan = document.querySelector('.ib-hd span');
  if (ibSpan) ibSpan.contentEditable = ce;
  $$('#ibTbody th, #ibTbody td, .ib-sec-td, #ibCap').forEach(e => e.contentEditable = ce);
  // 페이지 재렌더 (섹션 도구/삭제 버튼 포함 여부 결정)
  if (curCharId) {
    renderPage(getChar(), curPageId);
    renderCats(getChar());
  }
}

$('editBtn').onclick = () => { setEditMode(true); toast('✎ 편집 모드'); };
$('doneBtn').onclick = () => { doSave(); setEditMode(false); toast('✓ 저장 완료!'); };

/* ── 12. RENDER ALL ── */
function renderAll() {
  const ch = getChar(); if (!ch) return;
  applyStyle(ch);
  renderCover(ch); renderAvatar(ch); renderHeaderInfo(ch);
  renderTabs(ch); renderInfobox(ch);
  renderPage(ch, curPageId);
  renderCats(ch); updateStats(); updateBreadcrumb(ch);
}

/* ── 13. STYLE ── */
function applyStyle(ch) {
  const s = ch.style;
  document.documentElement.setAttribute('data-theme', s.theme || 'light');
  setAccent(s.accent || '#2563eb');
  body.className = body.className.replace(/font-\S+/g,'').replace(/pat-\S+/g,'').replace(/\s+/g,' ').trim();
  body.classList.add('font-' + (s.font || 'sans'));
  if (s.pattern && s.pattern !== 'none') body.classList.add('pat-' + s.pattern);
  document.documentElement.style.fontSize = (s.fontSize || 15) + 'px';
  const cl = $('cLayout');
  if (cl) cl.className = 'lay-' + (s.layout || 'right');
  const ib = $('infobox');
  if (ib) { ib.classList.remove('sty-classic','sty-card','sty-minimal'); ib.classList.add('sty-' + (s.ibStyle||'classic')); }
  applyDivider(s.divider || 'line');
  syncStylePanel(s);
}

function setAccent(c) {
  ['--accent','--bar-a'].forEach(v => document.documentElement.style.setProperty(v, c));
  document.documentElement.style.setProperty('--accent-h', shadeColor(c, -15));
  document.documentElement.style.setProperty('--accent-d', shadeColor(c, 20));
  // accent-l: light tint
  document.documentElement.style.setProperty('--accent-l', hexToRgba(c, 0.12));
}

function shadeColor(hex, pct) {
  const n = parseInt(hex.replace('#',''), 16);
  const r = Math.min(255, Math.max(0, (n>>16) + pct));
  const g = Math.min(255, Math.max(0, ((n>>8)&0xff) + pct));
  const b2 = Math.min(255, Math.max(0, (n&0xff) + pct));
  return '#' + [r,g,b2].map(x => x.toString(16).padStart(2,'0')).join('');
}

function hexToRgba(hex, a) {
  const n = parseInt(hex.replace('#',''), 16);
  return `rgba(${n>>16},${(n>>8)&0xff},${n&0xff},${a})`;
}

function applyDivider(dv) {
  $$('.wsec').forEach(s => {
    s.classList.remove('dv-dashed','dv-gradient','dv-none');
    if (dv !== 'line') s.classList.add('dv-' + dv);
  });
}

function syncStylePanel(s) {
  $$('.th-btn').forEach(b => b.classList.toggle('on', b.dataset.theme === s.theme));
  $$('.ac-dot').forEach(d => d.classList.toggle('on', d.dataset.accent === s.accent));
  $$('[data-font]').forEach(b => b.classList.toggle('on', b.dataset.font === (s.font||'sans')));
  $$('[data-ibs]').forEach(b => b.classList.toggle('on', b.dataset.ibs === (s.ibStyle||'classic')));
  $$('[data-lay]').forEach(b => b.classList.toggle('on', b.dataset.lay === (s.layout||'right')));
  $$('[data-pat]').forEach(b => b.classList.toggle('on', b.dataset.pat === (s.pattern||'none')));
  $$('[data-dv]').forEach(b => b.classList.toggle('on', b.dataset.dv === (s.divider||'line')));
  const fsz = s.fontSize || 15;
  const acc = s.accent || '#2563eb';
  // 사이드 패널
  $('fszRange').value = fsz; $('fszLbl').textContent = fsz; $('acInp').value = acc;
  // 플로팅 패널 동기화
  if ($('fszRangeFloat')) { $('fszRangeFloat').value = fsz; $('fszLblFloat').textContent = fsz; }
  if ($('acInpFloat'))    $('acInpFloat').value = acc;
}

/* Style panel events */
$$('.th-btn').forEach(b => b.onclick = () => {
  const ch=getChar(); if(!ch) return;
  ch.style.theme = b.dataset.theme;
  document.documentElement.setAttribute('data-theme', b.dataset.theme);
  $$('.th-btn').forEach(x => x.classList.remove('on')); b.classList.add('on');
  schedSave();
});
$$('.ac-dot').forEach(d => d.onclick = () => {
  const ch=getChar(); if(!ch) return;
  ch.style.accent = d.dataset.accent; setAccent(d.dataset.accent);
  $$('.ac-dot').forEach(x => x.classList.remove('on')); d.classList.add('on');
  $('acInp').value = d.dataset.accent; schedSave();
});
$('acInp').oninput = () => {
  const ch=getChar(); if(!ch) return;
  ch.style.accent = $('acInp').value; setAccent($('acInp').value);
  $$('.ac-dot').forEach(x => x.classList.remove('on')); schedSave();
};
$$('[data-font]').forEach(b => b.onclick = () => {
  const ch=getChar(); if(!ch) return;
  ch.style.font = b.dataset.font;
  body.className = body.className.replace(/font-\S+/g,'').trim();
  body.classList.add('font-'+b.dataset.font);
  $$('[data-font]').forEach(x => x.classList.remove('on')); b.classList.add('on'); schedSave();
});
$$('[data-ibs]').forEach(b => b.onclick = () => {
  const ch=getChar(); if(!ch) return; ch.style.ibStyle = b.dataset.ibs;
  const ib=$('infobox'); ib.classList.remove('sty-classic','sty-card','sty-minimal');
  ib.classList.add('sty-'+b.dataset.ibs);
  $$('[data-ibs]').forEach(x => x.classList.remove('on')); b.classList.add('on'); schedSave();
});
$$('[data-lay]').forEach(b => b.onclick = () => {
  const ch=getChar(); if(!ch) return; ch.style.layout = b.dataset.lay;
  $('cLayout').className = 'lay-'+b.dataset.lay;
  $$('[data-lay]').forEach(x => x.classList.remove('on')); b.classList.add('on'); schedSave();
});
$('fszRange').oninput = () => {
  const ch=getChar(); if(!ch) return;
  ch.style.fontSize = +$('fszRange').value;
  document.documentElement.style.fontSize = $('fszRange').value + 'px';
  $('fszLbl').textContent = $('fszRange').value; schedSave();
};
$$('[data-pat]').forEach(b => b.onclick = () => {
  const ch=getChar(); if(!ch) return; ch.style.pattern = b.dataset.pat;
  body.className = body.className.replace(/pat-\S+/g,'').trim();
  if (b.dataset.pat !== 'none') body.classList.add('pat-'+b.dataset.pat);
  $$('[data-pat]').forEach(x => x.classList.remove('on')); b.classList.add('on'); schedSave();
});
$$('[data-dv]').forEach(b => b.onclick = () => {
  const ch=getChar(); if(!ch) return; ch.style.divider = b.dataset.dv;
  applyDivider(b.dataset.dv);
  $$('[data-dv]').forEach(x => x.classList.remove('on')); b.classList.add('on'); schedSave();
});
$('resetSP').onclick = () => {
  const ch=getChar(); if(!ch) return;
  ch.style = { theme:'light', accent:'#2563eb', font:'sans', ibStyle:'classic', layout:'right', fontSize:15, pattern:'none', divider:'line' };
  saveStore(store); applyStyle(ch); toast('↺ 스타일 초기화됨');
};

/* ── 14. COVER & AVATAR ── */
function renderCover(ch) {
  const bg = $('coverBg');
  bg.style.backgroundImage = ch.coverImg ? `url(${ch.coverImg})` : '';
}
$('changeCoverBtn').onclick = () => { if (!editMode) return; $('coverUpload').click(); };
$('rmCoverBtn').onclick     = () => { const ch=getChar(); if(!ch) return; ch.coverImg=null; saveStore(store); renderCover(ch); };
$('coverUpload').onchange   = e => {
  const f = e.target.files[0]; if(!f) return;
  readFile(f, url => { const ch=getChar(); ch.coverImg=url; saveStore(store); renderCover(ch); });
};

function renderAvatar(ch) {
  const em = $('avEmoji'); const img = $('avImg');
  if (ch.avatarImg) { img.src=ch.avatarImg; img.style.display='block'; em.style.display='none'; }
  else { img.style.display='none'; em.style.display=''; em.textContent=ch.emoji||'🧑'; }
}
$('avCam').onclick      = () => { if (!editMode) return; $('avUpload').click(); };
$('avUpload').onchange  = e => {
  const f=e.target.files[0]; if(!f) return;
  readFile(f, url => { const ch=getChar(); ch.avatarImg=url; saveStore(store); renderAvatar(ch); renderCharList(); });
};

/* ── 15. HEADER INFO ── */
function renderHeaderInfo(ch) {
  $('charTitle').textContent = ch.name;
  $('charSub').textContent   = ch.subtitle || '';
  const tags = $('headerTags'); tags.innerHTML = '';
  (ch.tags||[]).forEach(t => { const s=el('span','char-tag'); s.textContent=t; tags.appendChild(s); });
}
$('charTitle').oninput = () => { const ch=getChar(); if(ch) { ch.name=($('charTitle').textContent.trim()||ch.name); renderCharList(); updateBreadcrumb(ch); schedSave(); }};
$('charSub').oninput   = () => { const ch=getChar(); if(ch) { ch.subtitle=$('charSub').textContent.trim(); schedSave(); }};

function updateBreadcrumb(ch) {
  $('breadCur').textContent = ch?.name || '';
  const isSub = curPageId !== 'main';
  $('breadSubWrap').style.display = isSub ? '' : 'none';
  if (isSub) $('breadSubName').textContent = ch?.pages?.[curPageId]?.title || '';
}

/* ── 16. SUB PAGES ── */
function renderTabs(ch) {
  const row = $('tabRow'); row.innerHTML = '';
  const ids = ['main', ...(ch.pageOrder||[]).filter(id => id !== 'main')];
  ids.forEach(pid => {
    const page = pid === 'main' ? { title:'메인' } : ch.pages[pid];
    if (!page) return;
    const d = el('div', 'tab' + (pid===curPageId?' active':''));
    d.textContent = page.title;
    if (pid !== 'main') {
      const x = el('button','tab-del-btn','✕'); x.title='페이지 삭제';
      x.onclick = e => { e.stopPropagation(); confirm2(`"${page.title}" 페이지를 삭제할까요?`, ()=>delSubPage(ch,pid)); };
      d.appendChild(x);
    }
    d.onclick = () => switchPage(pid);
    row.appendChild(d);
  });
}

function switchPage(pid) {
  if (editMode) doSave();   // ← 편집 중 페이지 전환 시 저장 (이전 버그 수정)
  curPageId = pid;
  const ch = getChar();
  renderTabs(ch); renderPage(ch, pid);
  updateBreadcrumb(ch);
  $('backRow').style.display = pid !== 'main' ? '' : 'none';
}

function delSubPage(ch, pid) {
  delete ch.pages[pid];
  ch.pageOrder = (ch.pageOrder||[]).filter(id => id !== pid);
  saveStore(store); curPageId='main';
  renderTabs(ch); renderPage(ch,'main'); updateBreadcrumb(ch);
  toast('페이지 삭제됨');
}

$('addSubPageBtn').onclick = () => { if(!curCharId) return; openM('subModal'); };
$('subOk').onclick = () => {
  const name = $('subName').value.trim(); if(!name) { $('subName').focus(); return; }
  const ch=getChar(); const p=mkPage(name);
  ch.pages[p.id]=p;
  if(!ch.pageOrder) ch.pageOrder=['main'];
  ch.pageOrder.push(p.id);
  saveStore(store); renderTabs(ch); switchPage(p.id);
  $('subName').value=''; closeM('subModal'); toast(`📄 "${name}" 페이지 추가됨`);
};
$('subName').onkeydown = e => { if(e.key==='Enter') $('subOk').click(); };
$('backBtn').onclick   = () => switchPage('main');

/* ── 17. INFOBOX ── */
function renderInfobox(ch) {
  const ib = ch.infobox;
  document.querySelector('.ib-hd span').textContent = ib.title || ch.name;
  if (ib.image) {
    $('ibImgPh').style.display  = 'none';
    $('ibImgWrap').style.display = '';
    $('ibImg').src = ib.image;
    $('ibImg').style.filter = ib.imageFilter || '';
    $('ibCap').textContent = ib.imageCaption || '';
    $('ibFsel').value = ib.imageFilter || '';
  } else {
    $('ibImgPh').style.display  = '';
    $('ibImgWrap').style.display = 'none';
  }
  const tbody = $('ibTbody'); tbody.innerHTML = '';
  (ib.rows||[]).forEach(row => {
    if (row.t === 'sec') {
      const tr=document.createElement('tr'); const td=el('td','ib-sec-td'); td.textContent=row.label;
      td.setAttribute('colspan','2'); td.contentEditable = editMode?'true':'false';
      tr.appendChild(td); tbody.appendChild(tr);
    } else {
      const tr=document.createElement('tr');
      const th=el('th'); th.textContent=row.key; th.contentEditable=editMode?'true':'false';
      const td=el('td'); td.textContent=row.val||''; td.contentEditable=editMode?'true':'false';
      tr.append(th,td); tbody.appendChild(tr);
    }
  });
  // Make header span editable
  const span = document.querySelector('.ib-hd span');
  if (span) span.contentEditable = editMode ? 'true' : 'false';
}

function saveInfoboxFromDom(ch) {
  const span = document.querySelector('.ib-hd span');
  if (span) ch.infobox.title = span.textContent.trim();
  const cap = $('ibCap'); if (cap) ch.infobox.imageCaption = cap.textContent.trim();
  const rows = [];
  $('ibTbody').querySelectorAll('tr').forEach(tr => {
    const secTd = tr.querySelector('.ib-sec-td');
    if (secTd) { rows.push({ t:'sec', label: secTd.textContent.trim() }); return; }
    const th=tr.querySelector('th'), td=tr.querySelector('td');
    if (th&&td) rows.push({ t:'row', key:th.textContent.trim(), val:td.textContent.trim() });
  });
  ch.infobox.rows = rows;
}

// Infobox image  ← 편집 모드일 때만 파일선택 (이전 버그 수정)
$('ibImgPh').onclick  = () => { if (editMode) $('ibImgUp').click(); };
$('ibImgUp').onchange = e => {
  const f=e.target.files[0]; if(!f) return;
  readFile(f, url => { const ch=getChar(); ch.infobox.image=url; saveStore(store); renderInfobox(ch); });
};
$('ibImgRm').onclick = e => {
  e.stopPropagation();
  const ch=getChar(); ch.infobox.image=null; saveStore(store); renderInfobox(ch);
};
$('ibFsel').onchange = () => {
  const ch=getChar(); if(!ch) return;
  ch.infobox.imageFilter=$('ibFsel').value;
  $('ibImg').style.filter=$('ibFsel').value; saveStore(store);
};
$('ibAddRow').onclick  = () => openM('ibAddModal');
$('ibAddOk').onclick   = () => {
  const k=$('ibAKey').value.trim(); if(!k){$('ibAKey').focus();return;}
  const ch=getChar(); ch.infobox.rows.push({t:'row',key:k,val:$('ibAVal').value.trim()});
  saveStore(store); renderInfobox(ch);
  $('ibAKey').value=''; $('ibAVal').value=''; closeM('ibAddModal');
};
$('ibAKey').onkeydown = e => { if(e.key==='Enter') $('ibAVal').focus(); };
$('ibAVal').onkeydown = e => { if(e.key==='Enter') $('ibAddOk').click(); };
$('ibAddSec').onclick = () => {
  const label=prompt('소제목 이름:'); if(!label) return;
  const ch=getChar(); ch.infobox.rows.push({t:'sec',label}); saveStore(store); renderInfobox(ch);
};
$('ibDelRow').onclick = () => {
  const ch=getChar(); if(!ch||!ch.infobox.rows.length) return;
  ch.infobox.rows.pop(); saveStore(store); renderInfobox(ch);
};

/* ── 18. RENDER PAGE ── */
function renderPage(ch, pid) {
  const page = ch.pages[pid];
  const article = $('article'); article.innerHTML = '';
  if (!page) return;
  (page.sections||[]).forEach((sec, i) => {
    article.appendChild(buildSec(sec, i+1, ch));
  });
  renderToc(); applyDivider(ch.style.divider||'line');
}

/* ── 19. BUILD SECTION ── */
function buildSec(sec, num, ch) {
  const wrap = el('div','wsec'); wrap.dataset.id=sec.id;
  if (editMode) wrap.setAttribute('draggable','true');

  // Header
  const hd  = el('div','sec-hd');
  const ttl = el('h2','sec-ttl');
  ttl.textContent = `${num}. ${sec.title||'섹션'}`;
  ttl.id = 'sec-' + sec.id;
  if (editMode) {
    const dh = el('span','drag-h','⠿'); dh.title='드래그로 순서 변경';
    hd.appendChild(dh);
    ttl.contentEditable = 'true';
    ttl.addEventListener('input', schedSave);
  }
  hd.appendChild(ttl);
  if (editMode) {
    const tools = el('div','sec-tools');
    const upB = el('button','stool','↑'); upB.title='위로';    upB.onclick=()=>moveS(sec.id,-1,ch);
    const dnB = el('button','stool','↓'); dnB.title='아래로';  dnB.onclick=()=>moveS(sec.id,1,ch);
    const dlB = el('button','stool del','🗑'); dlB.title='삭제'; dlB.onclick=()=>confirm2(`"${sec.title}" 섹션을 삭제할까요?`,()=>deleteS(sec.id,ch));
    tools.append(upB,dnB,dlB);
    hd.appendChild(tools);
  }
  wrap.appendChild(hd);

  // Body
  const bd = el('div','sec-body');
  const renderer = {
    text:      () => buildText(sec),
    list:      () => buildList(sec),
    stats:     () => buildStats(sec,ch),
    relations: () => buildRelations(sec,ch),
    timeline:  () => buildTimeline(sec,ch),
    quotes:    () => buildQuotes(sec,ch),
    gallery:   () => buildGallery(sec,ch),
    video:     () => buildVideo(sec,ch),
    links:     () => buildLinks(sec,ch),
    spoiler:   () => buildSpoiler(sec),
    table:     () => buildTable(sec,ch),
  }[sec.type];
  bd.appendChild(renderer ? renderer() : (() => { const p=el('p'); p.textContent=sec.content||''; return p; })());
  wrap.appendChild(bd);
  return wrap;
}

/* ── 20. SECTION RENDERERS ── */

function buildText(sec) {
  const div = el('div');
  const p = el('p'); p.textContent = sec.content || '내용을 입력하세요.';  // ← textContent (이전 버그: innerHTML → XSS + 이중태그)
  p.contentEditable = editMode ? 'true' : 'false';
  p.addEventListener('input', schedSave);
  div.appendChild(p); return div;
}

function buildList(sec) {
  const div = el('div');
  const ul = el('ul');
  (sec.items||[]).forEach(item => {
    const li = el('li'); li.textContent = item;
    li.contentEditable = editMode ? 'true' : 'false';
    li.addEventListener('input', schedSave);
    ul.appendChild(li);
  });
  div.appendChild(ul);
  if (editMode) {
    const ab = el('button','add-btn','＋ 항목 추가');
    ab.onclick = () => {
      const li=el('li'); li.textContent='새 항목'; li.contentEditable='true';
      li.addEventListener('input', schedSave); ul.appendChild(li); li.focus(); schedSave();
    };
    div.appendChild(ab);
  }
  return div;
}

function buildStats(sec, ch) {
  const div = el('div');
  const tbl = el('table','stat-tbl');
  const thead = el('thead'); thead.innerHTML='<tr><th>능력</th><th style="width:52%">수치</th><th>설명</th></tr>';
  const tbody = el('tbody');
  (sec.rows||[]).forEach(row => {
    const tr = document.createElement('tr');
    const ntd=el('td'); ntd.textContent=row.name; ntd.contentEditable=editMode?'true':'false'; ntd.addEventListener('input',schedSave);
    const btd=document.createElement('td');
    const bw=el('div','bar-w'); const bar=el('div','bar'); bar.style.width=(row.val||0)+'%'; bar.textContent=row.val||0;
    bw.appendChild(bar);
    if (editMode) {
      const rng=el('input'); rng.type='range'; rng.min=0; rng.max=100; rng.value=row.val||0; rng.className='rsl'; rng.style.marginTop='4px';
      rng.oninput=()=>{ bar.style.width=rng.value+'%'; bar.textContent=rng.value; schedSave(); };
      btd.append(bw,rng);
    } else { btd.appendChild(bw); }
    const dtd=el('td'); dtd.textContent=row.desc||''; dtd.contentEditable=editMode?'true':'false'; dtd.addEventListener('input',schedSave);
    tr.append(ntd,btd,dtd); tbody.appendChild(tr);
  });
  tbl.append(thead,tbody); div.appendChild(tbl);
  if (editMode) {
    const ab=el('button','add-row-btn','＋ 능력 추가');
    ab.onclick=()=>{
      const name=prompt('능력 이름:'); if(!name) return;
      const val=Math.min(100,Math.max(0,parseInt(prompt('수치 (0-100):','70'),10)||70));
      const desc=prompt('설명:','') || '';
      sec.rows.push({name,val,desc}); schedSave(); renderPage(ch,curPageId);
    };
    div.appendChild(ab);
  }
  return div;
}

function buildRelations(sec, ch) {
  const div=el('div'); const grid=el('div','rel-grid');
  (sec.cards||[]).forEach((card,i) => {
    const c=el('div','rel-card');
    if (editMode) {
      const eb=el('button','rel-em-btn'); eb.textContent=card.emoji||'👤';
      eb.onclick=()=>pickEmoji(em=>{ card.emoji=em; eb.textContent=em; schedSave(); });
      c.appendChild(eb);
    } else { const es=el('span','rel-em'); es.textContent=card.emoji||'👤'; c.appendChild(es); }
    const info=el('div','rel-info');
    const nm=el('div','rel-nm'); nm.textContent=card.name;
    const tp=el('div','rel-tp'); tp.textContent=card.rtype;
    const ds=el('div','rel-ds'); ds.textContent=card.desc;
    [nm,tp,ds].forEach((e,j)=>{
      e.contentEditable=editMode?'true':'false';
      e.addEventListener('input', schedSave);
    });
    info.append(nm,tp,ds); c.appendChild(info);
    if (editMode) {
      const db=el('button','rel-del','✕');
      db.onclick=()=>{ sec.cards.splice(i,1); schedSave(); renderPage(ch,curPageId); };
      c.appendChild(db);
    }
    grid.appendChild(c);
  });
  div.appendChild(grid);
  if (editMode) {
    const ab=el('button','add-btn','＋ 인물 추가');
    ab.onclick=()=>{ sec.cards.push({emoji:'👤',name:'이름',rtype:'관계',desc:'설명'}); schedSave(); renderPage(ch,curPageId); };
    div.appendChild(ab);
  }
  return div;
}

function buildTimeline(sec, ch) {
  const div=el('div'); const tl=el('div','tl');
  (sec.items||[]).forEach((item,i)=>{
    const ti=el('div','tl-item'); const dot=el('div','tl-dot');
    const dt=el('div','tl-date'); dt.textContent=item.date; dt.contentEditable=editMode?'true':'false'; dt.addEventListener('input',schedSave);
    const tx=el('div','tl-txt');  tx.textContent=item.text; tx.contentEditable=editMode?'true':'false'; tx.addEventListener('input',schedSave);
    ti.append(dot,dt,tx);
    if (editMode) {
      const db=el('button','tl-del','✕');
      db.onclick=()=>{ sec.items.splice(i,1); schedSave(); renderPage(ch,curPageId); };
      ti.appendChild(db);
    }
    tl.appendChild(ti);
  });
  div.appendChild(tl);
  if (editMode) {
    const ab=el('button','add-btn','＋ 행적 추가');
    ab.onclick=()=>{ sec.items.push({date:'시기',text:'내용'}); schedSave(); renderPage(ch,curPageId); };
    div.appendChild(ab);
  }
  return div;
}

function buildQuotes(sec, ch) {
  const div=el('div'); const list=el('div','qt-list');
  (sec.items||[]).forEach((item,i)=>{
    const qi=el('div','qt-item');
    const bq=el('blockquote'); bq.textContent=item.quote; bq.contentEditable=editMode?'true':'false'; bq.addEventListener('input',schedSave);
    const sr=el('div','qt-src');   sr.textContent=item.source; sr.contentEditable=editMode?'true':'false'; sr.addEventListener('input',schedSave);
    qi.append(bq,sr);
    if (editMode) {
      const db=el('button','qt-del','✕');
      db.onclick=()=>{ sec.items.splice(i,1); schedSave(); renderPage(ch,curPageId); };
      qi.appendChild(db);
    }
    list.appendChild(qi);
  });
  div.appendChild(list);
  if (editMode) {
    const ab=el('button','add-btn','＋ 어록 추가');
    ab.onclick=()=>{ sec.items.push({quote:'"어록을 입력하세요."',source:'— 출처'}); schedSave(); renderPage(ch,curPageId); };
    div.appendChild(ab);
  }
  return div;
}

function buildGallery(sec, ch) {
  const div=el('div'); const grid=el('div','gal-grid');
  (sec.images||[]).forEach((img,i)=>{
    const item=el('div','gal-item');
    const im=el('img'); im.src=img.url; im.alt=img.caption||''; im.loading='lazy';
    im.onclick=()=>openLB(img.url);
    item.appendChild(im);
    if (editMode) {
      const db=el('button','gal-del','✕');
      db.onclick=e=>{ e.stopPropagation(); sec.images.splice(i,1); schedSave(); renderPage(ch,curPageId); };
      item.appendChild(db);
    }
    const cap=el('div','gal-cap'); cap.textContent=img.caption||'';
    cap.contentEditable=editMode?'true':'false'; cap.addEventListener('input',schedSave);
    grid.appendChild(item);
  });
  if (editMode) {
    const add=el('div','gal-item gal-add');
    const ic=el('span'); ic.textContent='🖼';
    const ht=el('span'); ht.textContent='이미지 추가';
    const fi=el('input'); fi.type='file'; fi.accept='image/*'; fi.className='fo';
    fi.onchange=e=>{
      const f=e.target.files[0]; if(!f) return;
      readFile(f, url=>{ if(!sec.images) sec.images=[]; sec.images.push({url,caption:''}); schedSave(); renderPage(ch,curPageId); });
    };
    add.append(ic,ht,fi); grid.appendChild(add);
  }
  div.appendChild(grid); return div;
}

function buildVideo(sec, ch) {
  const div=el('div');
  if (sec.videoId) {
    const wrap=el('div','yt-w');
    const iframe=document.createElement('iframe');
    // ← 올바른 embed URL (이전 버그: 파라미터 누락으로 재생 안됨)
    iframe.src=`https://www.youtube.com/embed/${sec.videoId}?autoplay=0&rel=0&modestbranding=1`;
    iframe.title='YouTube video player';
    iframe.setAttribute('allow','accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
    iframe.setAttribute('allowfullscreen','');
    iframe.loading='lazy';
    wrap.appendChild(iframe); div.appendChild(wrap);
  }
  if (editMode) {
    const row=el('div','yt-input-row');
    const inp=el('input'); inp.type='text'; inp.placeholder='https://www.youtube.com/watch?v=...';
    inp.value=sec.videoId ? `https://youtu.be/${sec.videoId}` : '';
    const btn=el('button','add-btn','적용');
    btn.onclick=()=>{
      const vid=getYtId(inp.value.trim());
      if(vid){ sec.videoId=vid; schedSave(); renderPage(ch,curPageId); }
      else toast('❌ 올바른 유튜브 URL을 입력하세요.');
    };
    inp.onkeydown=e=>{ if(e.key==='Enter') btn.click(); };
    row.append(inp,btn); div.appendChild(row);
  } else if (!sec.videoId) {
    const ph=el('div'); ph.style.cssText='padding:20px;text-align:center;color:var(--text-3);font-size:.85rem';
    ph.textContent='영상이 없습니다.'; div.appendChild(ph);
  }
  return div;
}

function buildLinks(sec, ch) {
  const div=el('div'); const list=el('div','ext-list');
  (sec.items||[]).forEach((item,i)=>{
    const a=el('div','ext-item');
    const ic=el('span','ext-ic'); ic.textContent=item.icon||'🔗'; ic.contentEditable=editMode?'true':'false'; ic.addEventListener('input',schedSave);
    const info=el('div','ext-info');
    const nm=el('div','ext-nm'); nm.textContent=item.name; nm.contentEditable=editMode?'true':'false'; nm.addEventListener('input',schedSave);
    const ud=el('div','ext-url-d');
    if (editMode) {
      const ui=el('input'); ui.type='text'; ui.value=item.url||''; ui.className='m-inp'; ui.style.marginTop='3px';
      ui.oninput=()=>schedSave(); ui.onblur=()=>{ item.url=ui.value.trim(); schedSave(); };
      ud.appendChild(ui);
    } else {
      const lk=document.createElement('a'); lk.href=item.url||'#'; lk.textContent=item.url||''; lk.target='_blank'; lk.rel='noopener noreferrer';
      ud.appendChild(lk);
    }
    info.append(nm,ud); a.append(ic,info);
    if (editMode) {
      const db=el('button','ext-del','✕');
      db.onclick=()=>{ sec.items.splice(i,1); schedSave(); renderPage(ch,curPageId); };
      a.appendChild(db);
    }
    list.appendChild(a);
  });
  div.appendChild(list);
  if (editMode) {
    const ab=el('button','add-btn','＋ 링크 추가');
    ab.onclick=()=>{ sec.items.push({icon:'🔗',name:'링크 이름',url:'https://'}); schedSave(); renderPage(ch,curPageId); };
    div.appendChild(ab);
  }
  return div;
}

function buildSpoiler(sec) {
  const wrap=el('div','spoiler');
  const tog=el('button','spl-toggle'); tog.textContent=sec.title||'스포일러';
  tog.onclick=()=>wrap.classList.toggle('open');
  const body2=el('div','spl-body'); body2.textContent=sec.content||'';
  body2.contentEditable=editMode?'true':'false'; body2.addEventListener('input',schedSave);
  wrap.append(tog,body2); return wrap;
}

function buildTable(sec, ch) {
  const div=el('div'); const tbl=el('table','wiki-tbl');
  const thead=el('thead'); const hr=document.createElement('tr');
  (sec.headers||[]).forEach(h=>{ const th=el('th'); th.textContent=h; th.contentEditable=editMode?'true':'false'; th.addEventListener('input',schedSave); hr.appendChild(th); });
  thead.appendChild(hr);
  const tbody=el('tbody');
  (sec.rows||[]).forEach(row=>{
    const tr=document.createElement('tr');
    (row||[]).forEach(cell=>{ const td=el('td'); td.textContent=cell; td.contentEditable=editMode?'true':'false'; td.addEventListener('input',schedSave); tr.appendChild(td); });
    tbody.appendChild(tr);
  });
  tbl.append(thead,tbody); div.appendChild(tbl);
  if (editMode) {
    const ab=el('button','add-row-btn','＋ 행 추가');
    ab.onclick=()=>{ sec.rows.push(new Array((sec.headers||[]).length).fill('')); schedSave(); renderPage(ch,curPageId); };
    div.appendChild(ab);
  }
  return div;
}

/* ── 21. SAVE ARTICLE FROM DOM ── */
function saveArticleFromDom(ch) {
  const page = ch.pages[curPageId]; if(!page) return;
  const secs = [...$('article').querySelectorAll('.wsec')];
  secs.forEach(el => {
    const id=el.dataset.id;
    const sec=page.sections.find(s=>s.id===id); if(!sec) return;
    const ttlEl=el.querySelector('.sec-ttl');
    if(ttlEl) {
      // 번호 제거 후 제목만 저장 (예: "1. 개요" → "개요")
      sec.title = ttlEl.textContent.trim().replace(/^\d+\.\s*/,'');
    }
    switch(sec.type) {
      case 'text':
        sec.content = el.querySelector('.sec-body p')?.textContent.trim() || ''; break;
      case 'list':
        sec.items = [...el.querySelectorAll('.sec-body li')].map(li=>li.textContent.trim()); break;
      case 'stats':
        sec.rows = [...el.querySelectorAll('.stat-tbl tbody tr')].map(tr=>{
          const tds=tr.querySelectorAll('td');
          const barEl=tr.querySelector('.bar');
          return { name:tds[0]?.textContent.trim()||'', val:parseInt(barEl?.textContent)||0, desc:tds[2]?.textContent.trim()||'' };
        }); break;
      case 'relations':
        sec.cards = [...el.querySelectorAll('.rel-card')].map(c=>({
          emoji: (c.querySelector('.rel-em-btn')||c.querySelector('.rel-em'))?.textContent||'👤',
          name:  c.querySelector('.rel-nm')?.textContent.trim()||'',
          rtype: c.querySelector('.rel-tp')?.textContent.trim()||'',
          desc:  c.querySelector('.rel-ds')?.textContent.trim()||'',
        })); break;
      case 'timeline':
        sec.items = [...el.querySelectorAll('.tl-item')].map(i=>({
          date: i.querySelector('.tl-date')?.textContent.trim()||'',
          text: i.querySelector('.tl-txt')?.textContent.trim()||'',
        })); break;
      case 'quotes':
        sec.items = [...el.querySelectorAll('.qt-item')].map(i=>({
          quote:  i.querySelector('blockquote')?.textContent.trim()||'',
          source: i.querySelector('.qt-src')?.textContent.trim()||'',
        })); break;
      case 'spoiler':
        sec.content = el.querySelector('.spl-body')?.textContent.trim()||''; break;
      case 'links':
        sec.items = [...el.querySelectorAll('.ext-item')].map(i=>{
          const urlInput = i.querySelector('.ext-url-d input');
          const urlLink  = i.querySelector('.ext-url-d a');
          return {
            icon: i.querySelector('.ext-ic')?.textContent.trim()||'🔗',
            name: i.querySelector('.ext-nm')?.textContent.trim()||'',
            url:  urlInput?.value || urlLink?.textContent.trim()||'',
          };
        }); break;
      case 'table':
        sec.headers = [...el.querySelectorAll('.wiki-tbl thead th')].map(th=>th.textContent.trim());
        sec.rows    = [...el.querySelectorAll('.wiki-tbl tbody tr')].map(tr=>[...tr.querySelectorAll('td')].map(td=>td.textContent.trim())); break;
    }
  });
  // DOM 순서대로 섹션 재정렬
  page.sections = secs.map(el=>page.sections.find(s=>s.id===el.dataset.id)).filter(Boolean);
}

/* ── 22. SECTION MANAGEMENT ── */
$$('.asb').forEach(btn => btn.onclick = () => {
  if(!curCharId) return;
  const type = btn.dataset.type;
  if (type === 'video') {
    openM('videoModal'); return;  // ← video는 모달에서 처리
  }
  const ch=getChar(); const page=ch.pages[curPageId]; if(!page) return;
  const sec=mkSec(type); page.sections.push(sec);
  schedSave(); renderPage(ch,curPageId);
  setTimeout(()=>{ const last=$('article').lastElementChild; last?.scrollIntoView({behavior:'smooth',block:'start'}); },80);
});

// ← videoOk를 단일 함수로 처리 (이전 버그: onclick 매번 덮어씀 → 마지막 섹션에만 적용)
$('videoOk').onclick = () => {
  const vid=getYtId($('ytUrl').value.trim());
  if(!vid){ toast('❌ 올바른 유튜브 URL을 입력하세요.'); return; }
  const ch=getChar(); const page=ch.pages[curPageId]; if(!page) return;
  const sec=mkSec('video'); sec.videoId=vid;
  page.sections.push(sec); schedSave(); renderPage(ch,curPageId);
  $('ytUrl').value=''; closeM('videoModal');
  toast('▶ 영상 추가됨!');
};
$('ytUrl').onkeydown = e => { if(e.key==='Enter') $('videoOk').click(); };

function moveS(id, dir, ch) {
  doSave();
  const page=ch.pages[curPageId]; const idx=page.sections.findIndex(s=>s.id===id);
  if(idx<0) return; const t=idx+dir;
  if(t<0||t>=page.sections.length) return;
  [page.sections[idx],page.sections[t]]=[page.sections[t],page.sections[idx]];
  saveStore(store); renderPage(ch,curPageId);
}
function deleteS(id, ch) {
  doSave();
  const page=ch.pages[curPageId];
  page.sections=page.sections.filter(s=>s.id!==id);
  saveStore(store); renderPage(ch,curPageId); toast('섹션 삭제됨');
}

/* ── 23. DRAG REORDER ── */
let dragSrc=null;
$('article').addEventListener('dragstart', e=>{
  const sec=e.target.closest('.wsec'); if(!sec) return;
  dragSrc=sec; sec.style.opacity='.4';
});
$('article').addEventListener('dragend', e=>{
  const sec=e.target.closest('.wsec'); if(sec) sec.style.opacity='';
  $$('.wsec').forEach(s=>s.classList.remove('drag-ov'));
  dragSrc=null;
  const ch=getChar(); if(!ch) return;
  saveArticleFromDom(ch); saveStore(store); renderPage(ch,curPageId);
});
$('article').addEventListener('dragover', e=>{
  e.preventDefault();
  const sec=e.target.closest('.wsec'); if(!sec||sec===dragSrc) return;
  $$('.wsec').forEach(s=>s.classList.remove('drag-ov')); sec.classList.add('drag-ov');
});
$('article').addEventListener('drop', e=>{
  e.preventDefault();
  const tgt=e.target.closest('.wsec');
  if(!tgt||!dragSrc||tgt===dragSrc) return;
  const par=$('article');
  const si=[...par.children].indexOf(dragSrc), ti=[...par.children].indexOf(tgt);
  si<ti ? par.insertBefore(dragSrc,tgt.nextSibling) : par.insertBefore(dragSrc,tgt);
  tgt.classList.remove('drag-ov');
});

/* ── 24. TOC ── */
function renderToc() {
  const nav=$('tocNav'); nav.innerHTML='';
  $$('.wsec').forEach(sec=>{
    const ttl=sec.querySelector('.sec-ttl'); if(!ttl) return;
    const a=document.createElement('a'); a.className='toc-a'; a.textContent=ttl.textContent.trim();
    a.href='#'+ttl.id;
    a.onclick=e=>{ e.preventDefault(); ttl.scrollIntoView({behavior:'smooth',block:'start'}); };
    nav.appendChild(a);
  });
}
function updateTocHighlight() {
  let activeId=null;
  $$('.sec-ttl[id]').forEach(el=>{ if(el.getBoundingClientRect().top < 110) activeId=el.id; });
  $$('.toc-a').forEach(a=>a.classList.toggle('on', a.getAttribute('href')==='#'+activeId));
}

/* ── 25. CATEGORIES ── */
function renderCats(ch) {
  const list=$('catList'); list.innerHTML='';
  (ch.categories||[]).forEach((cat,i)=>{
    const chip=el('div','cat-chip'); chip.textContent=cat;
    if(editMode){
      const x=el('button','cat-xbtn','✕'); x.onclick=()=>{ ch.categories.splice(i,1); saveStore(store); renderCats(ch); };
      chip.appendChild(x);
    }
    list.appendChild(chip);
  });
}
$('addCatBtn').onclick=()=>{
  const tag=prompt('분류 태그:'); if(!tag) return;
  const ch=getChar(); if(!ch.categories) ch.categories=[];
  ch.categories.push(tag.trim()); saveStore(store); renderCats(ch);
};

/* ── 26. STATS ── */
function updateStats() {
  const ch=getChar(); if(!ch) return;
  $('stPages').textContent = Object.keys(ch.pages||{}).length;
  $('stWords').textContent = ($('article')?.innerText||'').replace(/\s+/g,'').length.toLocaleString();
  $('stEdit').textContent  = ch.updatedAt ? new Date(ch.updatedAt).toLocaleDateString('ko-KR',{month:'short',day:'numeric'}) : '-';
}

/* ── 27. SIDEBAR TOGGLE ── */
$('menuBtn').onclick = () => {
  const sb=$('sidebar');
  sb.classList.contains('hidden') ? expandSidebar() : collapseSidebar();
};
$('sbClose').onclick = collapseSidebar;
$('breadHome').onclick = showHome;
$('breadHome').onkeydown = e=>{ if(e.key==='Enter') showHome(); };

function collapseSidebar() {
  $('sidebar').classList.add('hidden');
  $('main').classList.add('sb-hidden');
  $('menuBtn').setAttribute('aria-expanded','false');
}
function expandSidebar() {
  $('sidebar').classList.remove('hidden');
  $('main').classList.remove('sb-hidden');
  $('menuBtn').setAttribute('aria-expanded','true');
}

/* ── 28. THEME TOGGLE ── */
$('themeToggle').onclick=()=>{
  const cur=document.documentElement.getAttribute('data-theme')||'light';
  const next=cur==='dark'?'light':'dark';
  document.documentElement.setAttribute('data-theme',next);
  store.settings.theme=next;
  const ch=getChar(); if(ch) ch.style.theme=next;
  saveStore(store);
  $$('.th-btn').forEach(b=>b.classList.toggle('on',b.dataset.theme===next));
};

/* ── 29. SHARE ── */
$('shareBtn').onclick=()=>{
  const ch=getChar(); if(!ch){ toast('캐릭터를 먼저 선택하세요'); return; }
  try {
    // 이미지 제외 (URL 길이 제한 대응)
    const slim={ ...ch, infobox:{...ch.infobox,image:null}, avatarImg:null, coverImg:null };
    const encoded=btoa(unescape(encodeURIComponent(JSON.stringify(slim))));
    const url=location.origin+location.pathname+'?share='+encoded;
    $('shrUrl').value=url; openM('shareModal');
  } catch { toast('❌ 데이터가 너무 커서 URL 공유가 어려워요. 이미지가 많으면 JSON 백업을 사용하세요.'); }
};
$('copyShrUrl').onclick=()=>{
  const inp=$('shrUrl'); inp.select();
  navigator.clipboard?.writeText(inp.value).catch(()=>document.execCommand('copy'));
  $('copyShrUrl').textContent='✅ 복사됨!';
  setTimeout(()=>$('copyShrUrl').textContent='복사',1600);
};
function loadShared() {
  const p=new URLSearchParams(location.search); const share=p.get('share'); if(!share) return false;
  try {
    const ch=JSON.parse(decodeURIComponent(escape(atob(share))));
    ch.id='sh_'+Date.now();
    if(!store.chars.find(c=>c.name===ch.name)) { store.chars.push(ch); saveStore(store); toast(`📖 "${ch.name}" 위키를 불러왔어요! (이미지 제외)`); }
    openChar(ch.id); history.replaceState({},'',location.pathname); return true;
  } catch { toast('❌ 공유 링크 오류'); return false; }
}

/* ── 30. EXPORT / IMPORT ── */
$('exportBtn').onclick=()=>{
  const json=JSON.stringify(store,null,2);
  const blob=new Blob([json],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='charawiki_'+new Date().toISOString().slice(0,10)+'.json';
  a.click(); URL.revokeObjectURL(a.href);
  toast('💾 백업 다운로드됨!');
};
$('importBtn').onclick=()=>$('importFile').click();
$('importFile').onchange=e=>{
  const f=e.target.files[0]; if(!f) return;
  const r=new FileReader();
  r.onload=ev=>{
    try {
      const d=JSON.parse(ev.target.result); if(!d.chars) throw 0;
      d.chars.forEach(ic=>{ if(!store.chars.find(c=>c.id===ic.id)) store.chars.push(ic); });
      saveStore(store); renderCharList(); toast(`✅ ${d.chars.length}개 캐릭터 불러옴!`);
    } catch { toast('❌ 올바른 백업 파일이 아니에요.'); }
  };
  r.readAsText(f); e.target.value='';
};

/* ── 31. LIGHTBOX ── */
function openLB(src) { $('lbImg').src=src; $('lightbox').classList.add('open'); }
$('lbClose').onclick=()=>$('lightbox').classList.remove('open');
$('lightbox').onclick=e=>{ if(e.target===$('lightbox')) $('lightbox').classList.remove('open'); };
document.addEventListener('click',e=>{
  const img=e.target.closest('#ibImg, .gal-item img'); if(img?.src) openLB(img.src);
});

/* ── 32. EMOJI PICKER ── */
const EMOJIS='👤👨👩👦👧👴👵🧑‍🦱🧑‍🦰🧙‍♂️🧙‍♀️🦸‍♂️🦸‍♀️🦹‍♂️🧝‍♀️🧚🧜‍♀️🧛‍♂️🤺🧞‍♂️🐉🐺🦊🐱🐻🦁🐯🐰🐸🐧🦋🌸🌺🌙⭐💫🔥💧🌊🌿🍀🎭🎯🏆👑💎🗡️🛡️🔮💌📖🎵🎶🌈🎨🖌️✨🌟💥🎪🎠🎭🏰🗺️🌍'.split(/(?<=[\s\S])/u).filter(c=>c.trim());
let emojiCb=null;
function pickEmoji(cb) { emojiCb=cb; openM('emojiModal'); }
(function initEmoji(){
  const grid=$('emGrid'); grid.innerHTML='';
  EMOJIS.forEach(em=>{ const b=el('button','em-btn'); b.textContent=em; grid.appendChild(b); });
})();
$('emGrid').addEventListener('click',e=>{
  const b=e.target.closest('.em-btn'); if(!b) return;
  emojiCb?.(b.textContent); emojiCb=null; closeM('emojiModal');
});

/* ── 33. READING PROGRESS & BTT ── */
const prog=$('rdProg'), btt=$('btt');
window.addEventListener('scroll',()=>{
  const doc=document.documentElement;
  const pct=doc.scrollHeight>doc.clientHeight ? doc.scrollTop/(doc.scrollHeight-doc.clientHeight)*100 : 0;
  prog.style.width=pct+'%';
  btt.classList.toggle('on',window.scrollY>360);
  updateTocHighlight();
},{passive:true});
btt.onclick=()=>window.scrollTo({top:0,behavior:'smooth'});

/* ── 34. KEYBOARD ── */
document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key==='s'){ e.preventDefault(); editMode?$('doneBtn').click():(saveStore(store),toast('💾 저장됨')); }
  if((e.ctrlKey||e.metaKey)&&e.key==='e'){ e.preventDefault(); if(!editMode&&curCharId) $('editBtn').click(); }
});

/* ── 35. RESIZE ── */
let rsz; window.addEventListener('resize',()=>{
  clearTimeout(rsz); rsz=setTimeout(()=>{ if(window.innerWidth>768) expandSidebar(); },220);
},{passive:true});

/* ── 36. UTILS ── */
function readFile(file,cb){ const r=new FileReader(); r.onload=ev=>cb(ev.target.result); r.readAsDataURL(file); }
function getYtId(url){
  const ps=[/youtu\.be\/([A-Za-z0-9_-]{11})/,/[?&]v=([A-Za-z0-9_-]{11})/,/embed\/([A-Za-z0-9_-]{11})/,/^([A-Za-z0-9_-]{11})$/];
  for(const p of ps){ const m=url.match(p); if(m) return m[1]; } return null;
}


/* ══ FLOATING THEME / STYLE PANELS ══ */
(function setupFloatPanels() {
  const overlay = $('fpOverlay');
  let activePanel = null;

  function openFP(id) {
    if (activePanel && activePanel !== id) closeFP(activePanel);
    $(id).classList.add('open');
    overlay.classList.add('active');
    activePanel = id;
  }
  function closeFP(id) {
    if (id) $(id).classList.remove('open');
    overlay.classList.remove('active');
    activePanel = null;
  }

  $('themePanelBtn').onclick = e => {
    e.stopPropagation();
    activePanel === 'themePanelFloat' ? closeFP('themePanelFloat') : openFP('themePanelFloat');
  };
  $('stylePanelBtn').onclick = e => {
    e.stopPropagation();
    activePanel === 'stylePanelFloat' ? closeFP('stylePanelFloat') : openFP('stylePanelFloat');
  };

  overlay.onclick = () => closeFP(activePanel);

  $$('.fp-close').forEach(btn => {
    btn.onclick = () => closeFP(btn.dataset.fp);
  });

  // ── 플로팅 테마 버튼들 (HTML에 있는 .th-btn 전체를 이벤트 위임)
  $$('#fpThemeGrid .th-btn').forEach(b => {
    b.onclick = () => {
      const ch = getChar();
      if (ch) { ch.style.theme = b.dataset.theme; schedSave(); }
      store.settings.theme = b.dataset.theme;
      saveStore(store);
      document.documentElement.setAttribute('data-theme', b.dataset.theme);
      // 모든 th-btn (사이드 패널 포함) 동기화
      $$('.th-btn').forEach(x => x.classList.toggle('on', x.dataset.theme === b.dataset.theme));
      toast('🎨 ' + b.textContent + ' 테마 적용됨');
    };
  });

  // ── 플로팅 강조색
  $$('#fpAccentRow .ac-dot').forEach(d => {
    d.onclick = () => {
      const ch = getChar();
      if (ch) { ch.style.accent = d.dataset.accent; schedSave(); }
      setAccent(d.dataset.accent);
      $$('.ac-dot').forEach(x => x.classList.remove('on')); d.classList.add('on');
      $('acInp').value = d.dataset.accent;
      $('acInpFloat').value = d.dataset.accent;
    };
  });
  $('acInpFloat').oninput = () => {
    const ch = getChar();
    if (ch) { ch.style.accent = $('acInpFloat').value; schedSave(); }
    setAccent($('acInpFloat').value);
    $('acInp').value = $('acInpFloat').value;
    $$('.ac-dot').forEach(x => x.classList.remove('on'));
  };

  // ── 플로팅 꾸미기 (font, ibs, lay, pat, dv)
  $$('#stylePanelFloat [data-font]').forEach(b => b.onclick = () => {
    const ch = getChar(); if (!ch) return;
    ch.style.font = b.dataset.font;
    body.className = body.className.replace(/font-\S+/g,'').trim();
    body.classList.add('font-' + b.dataset.font);
    $$('[data-font]').forEach(x => x.classList.toggle('on', x.dataset.font === b.dataset.font));
    schedSave();
  });
  $$('#stylePanelFloat [data-ibs]').forEach(b => b.onclick = () => {
    const ch = getChar(); if (!ch) return;
    ch.style.ibStyle = b.dataset.ibs;
    const ib = $('infobox'); ib.classList.remove('sty-classic','sty-card','sty-minimal');
    ib.classList.add('sty-' + b.dataset.ibs);
    $$('[data-ibs]').forEach(x => x.classList.toggle('on', x.dataset.ibs === b.dataset.ibs));
    schedSave();
  });
  $$('#stylePanelFloat [data-lay]').forEach(b => b.onclick = () => {
    const ch = getChar(); if (!ch) return;
    ch.style.layout = b.dataset.lay;
    $('cLayout').className = 'lay-' + b.dataset.lay;
    $$('[data-lay]').forEach(x => x.classList.toggle('on', x.dataset.lay === b.dataset.lay));
    schedSave();
  });
  $$('#stylePanelFloat [data-pat]').forEach(b => b.onclick = () => {
    const ch = getChar(); if (!ch) return;
    ch.style.pattern = b.dataset.pat;
    body.className = body.className.replace(/pat-\S+/g,'').trim();
    if (b.dataset.pat !== 'none') body.classList.add('pat-' + b.dataset.pat);
    $$('[data-pat]').forEach(x => x.classList.toggle('on', x.dataset.pat === b.dataset.pat));
    schedSave();
  });
  $$('#stylePanelFloat [data-dv]').forEach(b => b.onclick = () => {
    const ch = getChar(); if (!ch) return;
    ch.style.divider = b.dataset.dv;
    applyDivider(b.dataset.dv);
    $$('[data-dv]').forEach(x => x.classList.toggle('on', x.dataset.dv === b.dataset.dv));
    schedSave();
  });

  $('fszRangeFloat').oninput = () => {
    const ch = getChar(); if (!ch) return;
    ch.style.fontSize = +$('fszRangeFloat').value;
    document.documentElement.style.fontSize = $('fszRangeFloat').value + 'px';
    $('fszLblFloat').textContent = $('fszRangeFloat').value;
    $('fszRange').value = $('fszRangeFloat').value;
    $('fszLbl').textContent = $('fszRangeFloat').value;
    schedSave();
  };

  $('resetSPFloat').onclick = () => {
    const ch = getChar(); if (!ch) return;
    ch.style = { theme:'light', accent:'#2563eb', font:'sans', ibStyle:'classic', layout:'right', fontSize:15, pattern:'none', divider:'line' };
    saveStore(store); applyStyle(ch); toast('↺ 스타일 초기화됨');
  };

  // syncStylePanel을 플로팅 패널에도 적용하도록 기존 함수 확장
  const _origSync = syncStylePanel;
  // syncStylePanel은 이미 $$('.th-btn') 등을 쓰므로 자동 동기화됨
  // fszRange 플로팅 동기화만 추가
  const origSyncSP = window.syncStylePanel;
})();

/* ── 37. INIT ── */
function init() {
  document.documentElement.setAttribute('data-theme', store.settings.theme||'light');
  body.classList.add('font-'+(store.settings.font||'sans'));
  renderCharList();
  if(!loadShared()){
    if(store.chars.length>0) openChar(store.chars[0].id);
    else showHome();
  }
  if(window.innerWidth>768) expandSidebar(); else collapseSidebar();
}
init();
