/* ═══════════════════════════════════════════════════
   CharaWiki v3 — script.js
   멀티 캐릭터 · 자동 저장 · 완전 편집 · 반응형
═══════════════════════════════════════════════════ */
'use strict';

/* ══════════════════════════════
   1. STORAGE ENGINE
══════════════════════════════ */
const STORE_KEY = 'charawiki_v3';

function loadStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveStore(data) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
  } catch (e) {
    toast('⚠️ 저장 공간이 부족해요. 일부 데이터가 저장되지 않을 수 있어요.');
  }
}

/* ══════════════════════════════
   2. APP STATE
══════════════════════════════ */
let store = loadStore() || {
  chars: [],          // array of character objects
  settings: {         // global settings
    theme: 'light',
    accent: '#2563eb',
    font: 'modern',
  }
};

let currentCharId = null;
let currentSubPageId = 'main';
let isEditMode = false;
let autoSaveTimer = null;

// Ensure settings exist
store.settings = store.settings || { theme: 'light', accent: '#2563eb', font: 'modern' };

/* ══════════════════════════════
   3. CHARACTER MODEL
══════════════════════════════ */
function newCharacter(name, subtitle, tags) {
  const id = 'c' + Date.now();
  return {
    id,
    name: name || '새 캐릭터',
    subtitle: subtitle || '',
    tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    emoji: '🧑',
    avatarImg: null,
    coverImg: null,
    style: {
      theme: store.settings.theme,
      accent: store.settings.accent,
      font: store.settings.font,
      ibStyle: 'classic',
      layout: 'right',
      fontSize: 15,
      pattern: 'none',
      divider: 'line',
    },
    infobox: {
      title: name || '캐릭터',
      image: null,
      imageCaption: '이미지 설명',
      rows: [
        { type:'section', label:'기본 정보' },
        { type:'row', key:'이름', val: name || '' },
        { type:'row', key:'나이', val:'' },
        { type:'row', key:'성별', val:'' },
        { type:'row', key:'생일', val:'' },
        { type:'section', label:'신체' },
        { type:'row', key:'신장', val:'' },
        { type:'row', key:'혈액형', val:'' },
        { type:'section', label:'기타' },
        { type:'row', key:'직업', val:'' },
        { type:'row', key:'소속', val:'' },
      ]
    },
    pages: {
      main: newPage('메인'),
    },
    pageOrder: ['main'],
    categories: ['캐릭터'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function newPage(title) {
  return {
    id: 'p' + Date.now() + Math.random().toString(36).slice(2, 7),
    title: title || '새 페이지',
    sections: [],
  };
}

function newSection(type) {
  const id = 's' + Date.now() + Math.random().toString(36).slice(2, 6);
  const base = { id, type, title: '', draggable: true };
  switch (type) {
    case 'text':      return { ...base, title: '개요', content: '<p>내용을 입력하세요.</p>' };
    case 'list':      return { ...base, title: '목록', items: ['항목 1', '항목 2'] };
    case 'stats':     return { ...base, title: '능력치', rows: [{ name:'전투력', val:80, desc:'설명' }, { name:'지략', val:70, desc:'설명' }] };
    case 'relations': return { ...base, title: '인간관계', cards: [{ emoji:'👤', name:'이름', type:'관계', desc:'설명을 입력하세요.' }] };
    case 'timeline':  return { ...base, title: '행적', items: [{ date:'시기', text:'내용을 입력하세요.' }] };
    case 'quotes':    return { ...base, title: '어록', items: [{ quote:'"어록을 입력하세요."', source:'— 출처' }] };
    case 'gallery':   return { ...base, title: '갤러리', images: [] };
    case 'video':     return { ...base, title: '관련 영상', videoId: '' };
    case 'links':     return { ...base, title: '외부 링크', items: [{ icon:'🌐', name:'공식 사이트', url:'https://' }] };
    case 'spoiler':   return { ...base, title: '스포일러', content: '스포일러 내용을 입력하세요.' };
    case 'table':     return { ...base, title: '표', headers: ['항목1','항목2','항목3'], rows: [['','',''],['','','']] };
    default:          return { ...base, title: '새 섹션', content: '' };
  }
}

/* ══════════════════════════════
   4. DOM HELPERS
══════════════════════════════ */
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}

function ce(tag, attrs = {}, children = []) {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else e.setAttribute(k, v);
  });
  children.forEach(c => c && e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
  return e;
}

/* ══════════════════════════════
   5. TOAST & UI HELPERS
══════════════════════════════ */
function toast(msg, ms = 2600) {
  const wrap = $('toastWrap');
  const div = el('div', 'toast', msg);
  wrap.appendChild(div);
  setTimeout(() => div.remove(), ms + 300);
}

function openModal(id) { $(id).classList.add('open'); }
function closeModal(id) { $(id).classList.remove('open'); }

let confirmCallback = null;
function confirm2(msg, cb) {
  $('confirmMsg').textContent = msg;
  confirmCallback = cb;
  openModal('confirmModal');
}
$('confirmOk').onclick = () => { closeModal('confirmModal'); if (confirmCallback) confirmCallback(); confirmCallback = null; };

$$('.modal-cancel[data-close]').forEach(btn => {
  btn.onclick = () => closeModal(btn.dataset.close);
});
$$('.modal').forEach(m => {
  m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
});

/* ══════════════════════════════
   6. AUTO-SAVE
══════════════════════════════ */
function scheduleAutoSave() {
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    saveCurrentState();
    saveStore(store);
  }, 800);
}

function saveCurrentState() {
  if (!currentCharId) return;
  const char = getChar();
  if (!char) return;
  char.updatedAt = Date.now();
  // Collect infobox
  saveInfoboxFromDom(char);
  // Collect sections
  saveArticleFromDom(char);
  // Collect meta
  char.name = $('charTitle')?.textContent.trim() || char.name;
  char.subtitle = $('charSubtitle')?.textContent.trim() || char.subtitle;
  char.infobox.title = document.querySelector('.ib-header span')?.textContent.trim() || char.infobox.title;
  // Update word count
  updateStats();
}

/* ══════════════════════════════
   7. CHAR LIST
══════════════════════════════ */
function getChar(id) {
  return store.chars.find(c => c.id === (id || currentCharId));
}

function renderCharList() {
  const list = $('charNavList');
  list.innerHTML = '';
  const q = $('charSearch').value.toLowerCase();
  store.chars
    .filter(c => !q || c.name.toLowerCase().includes(q))
    .forEach(char => {
      const li = el('li', 'char-nav-item' + (char.id === currentCharId ? ' active' : ''));
      // avatar
      const av = el('div', 'char-nav-avatar');
      if (char.avatarImg) {
        const img = el('img'); img.src = char.avatarImg; img.alt = char.name;
        av.appendChild(img);
      } else {
        av.textContent = char.emoji || '🧑';
      }
      const name = el('span', 'char-nav-name', char.name);
      const del = el('button', 'char-del-btn', '🗑');
      del.title = '삭제';
      del.onclick = e => { e.stopPropagation(); confirm2(`"${char.name}" 캐릭터를 삭제할까요?`, () => deleteChar(char.id)); };
      li.append(av, name, del);
      li.onclick = () => openChar(char.id);
      list.appendChild(li);
    });
}

$('charSearch').addEventListener('input', renderCharList);

function deleteChar(id) {
  store.chars = store.chars.filter(c => c.id !== id);
  saveStore(store);
  if (currentCharId === id) { currentCharId = null; showHome(); }
  renderCharList();
  toast('🗑 캐릭터가 삭제됐어요.');
}

/* ══════════════════════════════
   8. NEW CHARACTER
══════════════════════════════ */
[$('newCharBtn'), $('heroNewBtn')].forEach(btn => btn.onclick = () => openModal('newCharModal'));

$('newCharOk').onclick = () => {
  const name = $('newCharName').value.trim();
  if (!name) { $('newCharName').focus(); return; }
  const char = newCharacter(name, $('newCharSub').value.trim(), $('newCharTags').value.trim());
  store.chars.push(char);
  saveStore(store);
  $('newCharName').value = ''; $('newCharSub').value = ''; $('newCharTags').value = '';
  closeModal('newCharModal');
  renderCharList();
  openChar(char.id);
  toast(`✨ "${name}" 캐릭터가 만들어졌어요!`);
};
$('newCharName').addEventListener('keydown', e => { if (e.key === 'Enter') $('newCharOk').click(); });

/* ══════════════════════════════
   9. OPEN CHARACTER
══════════════════════════════ */
function openChar(id) {
  currentCharId = id;
  currentSubPageId = 'main';
  isEditMode = false;
  body.classList.remove('edit-mode');
  $('homeScreen').style.display = 'none';
  $('wikiScreen').style.display = 'block';
  renderCharList();
  renderChar();
  collapseSidebarOnMobile();
}

function showHome() {
  $('homeScreen').style.display = '';
  $('wikiScreen').style.display = 'none';
  $('breadChar').textContent = '';
  $('breadSub').style.display = 'none';
  renderCharList();
}

/* ══════════════════════════════
   10. RENDER CHARACTER
══════════════════════════════ */
function renderChar() {
  const char = getChar();
  if (!char) return;

  applyCharStyle(char);
  renderCover(char);
  renderAvatar(char);
  renderHeaderInfo(char);
  renderSubPageTabs(char);
  renderInfobox(char);
  renderPage(char, currentSubPageId);
  renderCategories(char);
  updateStats();
  updateBreadcrumb(char);
}

function applyCharStyle(char) {
  const s = char.style;
  // Theme
  document.documentElement.setAttribute('data-theme', s.theme || 'light');
  // Accent
  setAccentColor(s.accent || '#2563eb');
  // Font
  body.className = body.className.replace(/font-\w+/g, '').replace(/pat-\w+/g, '').trim();
  body.classList.add('font-' + (s.font || 'modern'));
  if (s.pattern && s.pattern !== 'none') body.classList.add('pat-' + s.pattern);
  // Font size
  document.documentElement.style.fontSize = (s.fontSize || 15) + 'px';
  // Layout
  const cl = $('contentLayout');
  if (cl) cl.className = 'layout-' + (s.layout || 'right');
  // Infobox style
  const ib = $('infobox');
  if (ib) { ib.classList.remove('style-classic','style-card','style-minimal'); ib.classList.add('style-' + (s.ibStyle || 'classic')); }
  // Divider
  $$('.wiki-sec').forEach(sec => {
    sec.classList.remove('divider-dashed','divider-gradient','divider-none');
    if (s.divider !== 'line') sec.classList.add('divider-' + s.divider);
  });
  // Sync style panel
  syncStylePanel(s);
}

function renderCover(char) {
  const bg = $('coverBg');
  if (char.coverImg) { bg.style.backgroundImage = `url(${char.coverImg})`; bg.style.opacity = 1; }
  else { bg.style.backgroundImage = ''; bg.style.opacity = 1; }
}

function renderAvatar(char) {
  const emoji = $('avatarEmoji');
  const img = $('avatarImg');
  if (char.avatarImg) {
    img.src = char.avatarImg; img.style.display = 'block'; emoji.style.display = 'none';
  } else {
    img.style.display = 'none'; emoji.style.display = ''; emoji.textContent = char.emoji || '🧑';
  }
}

function renderHeaderInfo(char) {
  $('charTitle').textContent = char.name;
  $('charSubtitle').textContent = char.subtitle || '';
  const tagsEl = $('headerTags');
  tagsEl.innerHTML = '';
  (char.tags || []).forEach(t => {
    const span = el('span', 'char-tag', t);
    tagsEl.appendChild(span);
  });
}

function updateBreadcrumb(char) {
  $('breadChar').textContent = char?.name || '';
  const page = currentSubPageId !== 'main' ? char?.pages?.[currentSubPageId] : null;
  if (page && currentSubPageId !== 'main') {
    $('breadSubName').textContent = page.title;
    $('breadSub').style.display = '';
  } else {
    $('breadSub').style.display = 'none';
  }
}

/* ══════════════════════════════
   11. SUBPAGES
══════════════════════════════ */
function renderSubPageTabs(char) {
  const tabList = $('subPageTabs');
  tabList.innerHTML = '';
  // Main tab always first
  const mainTab = makeTab('main', '메인', char);
  tabList.appendChild(mainTab);
  // Other pages
  (char.pageOrder || []).filter(id => id !== 'main').forEach(pid => {
    const page = char.pages[pid];
    if (!page) return;
    tabList.appendChild(makeTab(pid, page.title, char));
  });
}

function makeTab(pid, title, char) {
  const div = el('div', 'tab-item' + (pid === currentSubPageId ? ' active' : ''));
  div.textContent = title;
  if (pid !== 'main') {
    const del = el('button', 'tab-del', '✕');
    del.title = '페이지 삭제';
    del.onclick = e => { e.stopPropagation(); confirm2(`"${title}" 페이지를 삭제할까요?`, () => deleteSubPage(char, pid)); };
    div.appendChild(del);
  }
  div.onclick = () => switchSubPage(pid);
  return div;
}

function switchSubPage(pid) {
  if (!isEditMode) saveCurrentState();
  currentSubPageId = pid;
  const char = getChar();
  renderSubPageTabs(char);
  renderPage(char, pid);
  updateBreadcrumb(char);
  $('backToMainRow').style.display = pid !== 'main' ? '' : 'none';
}

function deleteSubPage(char, pid) {
  delete char.pages[pid];
  char.pageOrder = (char.pageOrder || []).filter(id => id !== pid);
  saveStore(store);
  currentSubPageId = 'main';
  renderSubPageTabs(char);
  renderPage(char, 'main');
  updateBreadcrumb(char);
  toast('페이지 삭제됨');
}

$('addSubPageBtn').onclick = () => { if (!currentCharId) return; openModal('subpageModal'); };
$('subPageOk').onclick = () => {
  const name = $('subPageName').value.trim();
  if (!name) { $('subPageName').focus(); return; }
  const char = getChar();
  const page = newPage(name);
  char.pages[page.id] = page;
  if (!char.pageOrder) char.pageOrder = ['main'];
  char.pageOrder.push(page.id);
  saveStore(store);
  renderSubPageTabs(char);
  switchSubPage(page.id);
  $('subPageName').value = '';
  closeModal('subpageModal');
  toast(`📄 "${name}" 페이지 추가됨`);
};
$('subPageName').addEventListener('keydown', e => { if (e.key === 'Enter') $('subPageOk').click(); });
$('backToMainBtn').onclick = () => switchSubPage('main');

/* ══════════════════════════════
   12. INFOBOX
══════════════════════════════ */
function renderInfobox(char) {
  const ib = char.infobox;
  // Title
  document.querySelector('.ib-header span').textContent = ib.title || char.name;
  // Image
  if (ib.image) {
    $('ibImgPlaceholder').style.display = 'none';
    $('ibImgLoaded').style.display = '';
    $('ibImg').src = ib.image;
    if (ib.imageFilter) $('ibImg').style.filter = ib.imageFilter;
    $('ibImgCaption').textContent = ib.imageCaption || '';
  } else {
    $('ibImgPlaceholder').style.display = '';
    $('ibImgLoaded').style.display = 'none';
  }
  // Table rows
  const tbody = $('ibTableBody');
  tbody.innerHTML = '';
  (ib.rows || []).forEach(row => {
    if (row.type === 'section') {
      const tr = el('tr', 'ib-section-row');
      const td = el('td', 'ib-section-label', row.label);
      td.setAttribute('colspan', '2');
      tr.appendChild(td);
      tbody.appendChild(tr);
    } else {
      const tr = document.createElement('tr');
      const th = el('th', '', row.key);
      const td = el('td', '', row.val || '');
      tr.append(th, td);
      tbody.appendChild(tr);
    }
  });
}

function saveInfoboxFromDom(char) {
  const titleEl = document.querySelector('.ib-header span');
  if (titleEl) char.infobox.title = titleEl.textContent.trim();
  const captEl = $('ibImgCaption');
  if (captEl) char.infobox.imageCaption = captEl.textContent.trim();
  // rows
  const rows = [];
  $('ibTableBody').querySelectorAll('tr').forEach(tr => {
    if (tr.classList.contains('ib-section-row')) {
      rows.push({ type:'section', label: tr.querySelector('.ib-section-label')?.textContent.trim() || '' });
    } else {
      const th = tr.querySelector('th');
      const td = tr.querySelector('td');
      if (th && td) rows.push({ type:'row', key: th.textContent.trim(), val: td.textContent.trim() });
    }
  });
  char.infobox.rows = rows;
}

// Infobox editable on click (edit mode)
document.querySelector('.ib-header span').addEventListener('input', scheduleAutoSave);

$('ibAddRow').onclick = () => openModal('ibAddModal');
$('ibAddOk').onclick = () => {
  const key = $('ibAddKey').value.trim();
  const val = $('ibAddVal').value.trim();
  if (!key) { $('ibAddKey').focus(); return; }
  const char = getChar();
  char.infobox.rows.push({ type:'row', key, val });
  saveStore(store);
  renderInfobox(char);
  $('ibAddKey').value = ''; $('ibAddVal').value = '';
  closeModal('ibAddModal');
};
$('ibAddKey').addEventListener('keydown', e => { if (e.key === 'Enter') $('ibAddVal').focus(); });
$('ibAddVal').addEventListener('keydown', e => { if (e.key === 'Enter') $('ibAddOk').click(); });

$('ibAddSection').onclick = () => {
  const label = prompt('소제목 이름:');
  if (!label) return;
  const char = getChar();
  char.infobox.rows.push({ type:'section', label });
  saveStore(store);
  renderInfobox(char);
};

$('ibDelRow').onclick = () => {
  const char = getChar();
  if (char.infobox.rows.length > 0) {
    char.infobox.rows.pop();
    saveStore(store);
    renderInfobox(char);
  }
};

// Infobox image upload
$('ibImgUpload').onchange = e => {
  const f = e.target.files[0]; if (!f) return;
  readFileAsDataURL(f, url => {
    const char = getChar();
    char.infobox.image = url;
    saveStore(store);
    renderInfobox(char);
  });
};
$('ibImgRemove').onclick = () => {
  const char = getChar(); char.infobox.image = null; saveStore(store); renderInfobox(char);
};
$('ibImgFilter').onchange = () => {
  const char = getChar();
  char.infobox.imageFilter = $('ibImgFilter').value;
  $('ibImg').style.filter = $('ibImgFilter').value;
  saveStore(store);
};

// Infobox image area click
$('ibImgPlaceholder').onclick = () => $('ibImgUpload').click();

/* ══════════════════════════════
   13. RENDER PAGE (SECTIONS)
══════════════════════════════ */
function renderPage(char, pid) {
  const page = char.pages[pid];
  const article = $('article');
  article.innerHTML = '';
  if (!page) return;
  (page.sections || []).forEach(sec => {
    article.appendChild(renderSection(sec, char));
  });
  renderToc();
  applyDividerStyle(char.style.divider);
}

function renderSection(sec, char) {
  const wrap = el('div', 'wiki-sec');
  wrap.dataset.id = sec.id;
  wrap.setAttribute('draggable', 'true');

  // Header
  const hdr = el('div', 'sec-header');
  const drag = el('span', 'drag-handle', '⠿');
  drag.title = '드래그로 순서 변경';
  const title = el('h2', 'sec-title', sec.title || '섹션');
  title.contentEditable = isEditMode ? 'true' : 'false';
  title.id = 'sec-' + sec.id;
  title.addEventListener('input', scheduleAutoSave);
  const tools = el('div', 'sec-tools');
  const upBtn = el('button', 'sec-tool-btn', '↑'); upBtn.title = '위로';
  const dnBtn = el('button', 'sec-tool-btn', '↓'); dnBtn.title = '아래로';
  const delBtn = el('button', 'sec-tool-btn del', '🗑'); delBtn.title = '삭제';
  upBtn.onclick = () => moveSection(sec.id, -1, char);
  dnBtn.onclick = () => moveSection(sec.id, 1, char);
  delBtn.onclick = () => confirm2(`"${sec.title}" 섹션을 삭제할까요?`, () => deleteSection(sec.id, char));
  tools.append(upBtn, dnBtn, delBtn);
  hdr.append(drag, title, tools);
  wrap.appendChild(hdr);

  // Body
  const body2 = el('div', 'sec-body');
  switch (sec.type) {
    case 'text':      body2.appendChild(renderText(sec)); break;
    case 'list':      body2.appendChild(renderList(sec)); break;
    case 'stats':     body2.appendChild(renderStats(sec)); break;
    case 'relations': body2.appendChild(renderRelations(sec, char)); break;
    case 'timeline':  body2.appendChild(renderTimeline(sec)); break;
    case 'quotes':    body2.appendChild(renderQuotes(sec)); break;
    case 'gallery':   body2.appendChild(renderGallery(sec, char)); break;
    case 'video':     body2.appendChild(renderVideo(sec)); break;
    case 'links':     body2.appendChild(renderLinks(sec)); break;
    case 'spoiler':   body2.appendChild(renderSpoiler(sec)); break;
    case 'table':     body2.appendChild(renderTable(sec)); break;
    default: body2.innerHTML = `<p>${sec.content || ''}</p>`;
  }
  wrap.appendChild(body2);
  return wrap;
}

/* ── SECTION RENDERERS ── */
function renderText(sec) {
  const div = el('div');
  const p = el('p', '', sec.content || '내용을 입력하세요.');
  p.contentEditable = isEditMode ? 'true' : 'false';
  p.addEventListener('input', scheduleAutoSave);
  div.appendChild(p);
  return div;
}

function renderList(sec) {
  const div = el('div');
  const ul = el('ul');
  (sec.items || []).forEach(item => {
    const li = el('li', '', item);
    li.contentEditable = isEditMode ? 'true' : 'false';
    li.addEventListener('input', scheduleAutoSave);
    ul.appendChild(li);
  });
  if (isEditMode) {
    const addBtn = el('button', 'add-item-btn', '＋ 항목 추가');
    addBtn.onclick = () => {
      const li = el('li', '', '새 항목');
      li.contentEditable = 'true';
      li.addEventListener('input', scheduleAutoSave);
      ul.appendChild(li);
      li.focus();
      scheduleAutoSave();
    };
    div.appendChild(ul);
    div.appendChild(addBtn);
  } else {
    div.appendChild(ul);
  }
  return div;
}

function renderStats(sec) {
  const div = el('div');
  const table = el('table', 'ability-table');
  const thead = el('thead');
  thead.innerHTML = '<tr><th>능력</th><th style="width:55%">수치</th><th>설명</th></tr>';
  const tbody = el('tbody');
  (sec.rows || []).forEach(row => {
    const tr = document.createElement('tr');
    const nameTd = el('td', '', row.name);
    nameTd.contentEditable = isEditMode ? 'true' : 'false';
    nameTd.addEventListener('input', scheduleAutoSave);
    const barTd = document.createElement('td');
    const barWrap = el('div', 'bar-wrap');
    const bar = el('div', 'bar');
    bar.style.width = (row.val || 0) + '%';
    bar.textContent = row.val || 0;
    barWrap.appendChild(bar);
    if (isEditMode) {
      const input = el('input');
      input.type = 'range'; input.min = 0; input.max = 100; input.value = row.val || 0;
      input.className = 'range-sl'; input.style.marginTop = '4px';
      input.oninput = () => { bar.style.width = input.value + '%'; bar.textContent = input.value; scheduleAutoSave(); };
      barTd.append(barWrap, input);
    } else {
      barTd.appendChild(barWrap);
    }
    const descTd = el('td', '', row.desc || '');
    descTd.contentEditable = isEditMode ? 'true' : 'false';
    descTd.addEventListener('input', scheduleAutoSave);
    tr.append(nameTd, barTd, descTd);
    tbody.appendChild(tr);
  });
  table.append(thead, tbody);
  div.appendChild(table);
  if (isEditMode) {
    const addBtn = el('button', 'add-row-btn', '＋ 능력 추가');
    addBtn.onclick = () => {
      const name = prompt('능력 이름:'); if (!name) return;
      const val = parseInt(prompt('수치 (0-100):', '70')) || 70;
      const desc = prompt('설명:') || '';
      sec.rows.push({ name, val, desc });
      scheduleAutoSave();
      renderPage(getChar(), currentSubPageId);
    };
    div.appendChild(addBtn);
  }
  return div;
}

function renderRelations(sec, char) {
  const div = el('div');
  const grid = el('div', 'rel-grid');
  (sec.cards || []).forEach((card, idx) => {
    const cardEl = el('div', 'rel-card');
    const emojiBtn = el('button', 'rel-emoji-btn', card.emoji || '👤');
    emojiBtn.title = '이모지 변경';
    if (isEditMode) emojiBtn.onclick = () => pickEmoji(em => { card.emoji = em; emojiBtn.textContent = em; scheduleAutoSave(); });
    const info = el('div', 'rel-info');
    const name = el('div', 'rel-name', card.name);
    const type = el('div', 'rel-type', card.type);
    const desc = el('div', 'rel-desc', card.desc);
    [name, type, desc].forEach(e => {
      e.contentEditable = isEditMode ? 'true' : 'false';
      e.addEventListener('input', scheduleAutoSave);
    });
    info.append(name, type, desc);
    cardEl.append(emojiBtn, info);
    if (isEditMode) {
      const del = el('button', 'rel-del', '✕');
      del.onclick = () => { sec.cards.splice(idx, 1); scheduleAutoSave(); renderPage(char, currentSubPageId); };
      cardEl.appendChild(del);
    }
    grid.appendChild(cardEl);
  });
  div.appendChild(grid);
  if (isEditMode) {
    const addBtn = el('button', 'add-item-btn', '＋ 인물 추가');
    addBtn.onclick = () => { sec.cards.push({ emoji:'👤', name:'이름', type:'관계', desc:'설명' }); scheduleAutoSave(); renderPage(char, currentSubPageId); };
    div.appendChild(addBtn);
  }
  return div;
}

function renderTimeline(sec) {
  const div = el('div');
  const tl = el('div', 'timeline');
  (sec.items || []).forEach((item, idx) => {
    const tlItem = el('div', 'tl-item');
    const dot = el('div', 'tl-dot');
    const date = el('div', 'tl-date', item.date);
    const text = el('div', 'tl-text', item.text);
    date.contentEditable = isEditMode ? 'true' : 'false';
    text.contentEditable = isEditMode ? 'true' : 'false';
    [date, text].forEach(e => e.addEventListener('input', scheduleAutoSave));
    tlItem.append(dot, date, text);
    if (isEditMode) {
      const del = el('button', 'tl-del', '✕');
      del.onclick = () => { sec.items.splice(idx, 1); scheduleAutoSave(); renderPage(getChar(), currentSubPageId); };
      tlItem.appendChild(del);
    }
    tl.appendChild(tlItem);
  });
  div.appendChild(tl);
  if (isEditMode) {
    const addBtn = el('button', 'add-item-btn', '＋ 행적 추가');
    addBtn.onclick = () => { sec.items.push({ date:'시기', text:'내용' }); scheduleAutoSave(); renderPage(getChar(), currentSubPageId); };
    div.appendChild(addBtn);
  }
  return div;
}

function renderQuotes(sec) {
  const div = el('div');
  const list = el('div', 'quotes-list');
  (sec.items || []).forEach((item, idx) => {
    const qItem = el('div', 'quote-item');
    const bq = el('blockquote', '', item.quote);
    const src = el('div', 'quote-src', item.source);
    bq.contentEditable = isEditMode ? 'true' : 'false';
    src.contentEditable = isEditMode ? 'true' : 'false';
    [bq, src].forEach(e => e.addEventListener('input', scheduleAutoSave));
    qItem.append(bq, src);
    if (isEditMode) {
      const del = el('button', 'quote-del', '✕');
      del.onclick = () => { sec.items.splice(idx, 1); scheduleAutoSave(); renderPage(getChar(), currentSubPageId); };
      qItem.appendChild(del);
    }
    list.appendChild(qItem);
  });
  div.appendChild(list);
  if (isEditMode) {
    const addBtn = el('button', 'add-item-btn', '＋ 어록 추가');
    addBtn.onclick = () => { sec.items.push({ quote:'"어록을 입력하세요."', source:'— 출처' }); scheduleAutoSave(); renderPage(getChar(), currentSubPageId); };
    div.appendChild(addBtn);
  }
  return div;
}

function renderGallery(sec, char) {
  const div = el('div');
  const grid = el('div', 'gallery-grid');
  (sec.images || []).forEach((imgData, idx) => {
    const item = el('div', 'gal-item');
    const img = el('img'); img.src = imgData.url; img.alt = imgData.caption || ''; img.loading = 'lazy';
    img.onclick = () => openLightbox(imgData.url);
    item.appendChild(img);
    if (isEditMode) {
      const del = el('button', 'gal-del', '✕');
      del.onclick = e => { e.stopPropagation(); sec.images.splice(idx, 1); scheduleAutoSave(); renderPage(char, currentSubPageId); };
      item.appendChild(del);
    }
    const cap = el('div', 'gal-caption', imgData.caption || '');
    cap.contentEditable = isEditMode ? 'true' : 'false';
    cap.addEventListener('input', scheduleAutoSave);
    grid.appendChild(item);
  });
  if (isEditMode) {
    const addItem = el('div', 'gal-item gal-add');
    const icon = el('span', '', '🖼');
    const hint = el('span', '', '이미지 추가');
    const fileInput = el('input'); fileInput.type = 'file'; fileInput.accept = 'image/*'; fileInput.className = 'file-overlay';
    fileInput.onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      readFileAsDataURL(f, url => {
        if (!sec.images) sec.images = [];
        sec.images.push({ url, caption: '' });
        scheduleAutoSave();
        renderPage(char, currentSubPageId);
      });
    };
    addItem.append(icon, hint, fileInput);
    grid.appendChild(addItem);
  }
  div.appendChild(grid);
  return div;
}

function renderVideo(sec) {
  const div = el('div');
  if (sec.videoId) {
    const wrap = el('div', 'yt-wrap');
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${sec.videoId}?rel=0`;
    iframe.title = 'YouTube video';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.loading = 'lazy';
    wrap.appendChild(iframe);
    div.appendChild(wrap);
  } else if (isEditMode) {
    const placeholder = el('div', '', '');
    placeholder.style.cssText = 'padding:24px;background:var(--bg-ib);border-radius:var(--radius-m);text-align:center;color:var(--text-3);border:2px dashed var(--border-s)';
    placeholder.innerHTML = '<div style="font-size:2rem">▶</div><div style="margin-top:8px;font-size:.85rem">유튜브 URL을 입력해 영상을 추가하세요</div>';
    div.appendChild(placeholder);
  }
  if (isEditMode) {
    const row = el('div', '', '');
    row.style.cssText = 'display:flex;gap:8px;margin-top:10px;';
    const input = el('input'); input.type = 'text'; input.className = 'modal-input'; input.placeholder = 'https://www.youtube.com/watch?v=...';
    input.value = sec.videoId ? `https://www.youtube.com/watch?v=${sec.videoId}` : '';
    const btn = el('button', 'add-item-btn', '적용');
    btn.style.flexShrink = '0';
    btn.onclick = () => {
      const vid = extractYtId(input.value.trim());
      if (vid) { sec.videoId = vid; scheduleAutoSave(); renderPage(getChar(), currentSubPageId); }
      else toast('❌ 유효한 유튜브 URL을 입력해주세요.');
    };
    row.append(input, btn);
    div.appendChild(row);
  }
  return div;
}

function renderLinks(sec) {
  const div = el('div');
  const list = el('div', 'ext-links');
  (sec.items || []).forEach((item, idx) => {
    const a = el('div', 'ext-link-item');
    const icon = el('span', 'ext-icon', item.icon || '🔗');
    icon.contentEditable = isEditMode ? 'true' : 'false';
    icon.addEventListener('input', scheduleAutoSave);
    const info = el('div', 'ext-info');
    const name = el('div', 'ext-name', item.name);
    name.contentEditable = isEditMode ? 'true' : 'false';
    name.addEventListener('input', scheduleAutoSave);
    const url = el('div', 'ext-url');
    const link = document.createElement('a');
    link.href = item.url || '#'; link.textContent = item.url || ''; link.target = '_blank'; link.rel = 'noopener noreferrer';
    link.contentEditable = isEditMode ? 'true' : 'false';
    link.addEventListener('input', e => { link.href = link.textContent; scheduleAutoSave(); });
    url.appendChild(link);
    info.append(name, url);
    a.append(icon, info);
    if (isEditMode) {
      const del = el('button', 'ext-del', '✕');
      del.onclick = () => { sec.items.splice(idx, 1); scheduleAutoSave(); renderPage(getChar(), currentSubPageId); };
      a.appendChild(del);
    }
    list.appendChild(a);
  });
  div.appendChild(list);
  if (isEditMode) {
    const addBtn = el('button', 'add-item-btn', '＋ 링크 추가');
    addBtn.onclick = () => { sec.items.push({ icon:'🔗', name:'링크 이름', url:'https://' }); scheduleAutoSave(); renderPage(getChar(), currentSubPageId); };
    div.appendChild(addBtn);
  }
  return div;
}

function renderSpoiler(sec) {
  const div = el('div', 'spoiler');
  const toggle = el('button', 'spoiler-toggle', sec.title || '스포일러');
  toggle.onclick = () => div.classList.toggle('open');
  const content = el('div', 'spoiler-content', sec.content || '');
  content.contentEditable = isEditMode ? 'true' : 'false';
  content.addEventListener('input', scheduleAutoSave);
  div.append(toggle, content);
  return div;
}

function renderTable(sec) {
  const div = el('div');
  const table = el('table', 'wiki-table');
  const thead = el('thead');
  const headerRow = document.createElement('tr');
  (sec.headers || []).forEach(h => {
    const th = el('th', '', h);
    th.contentEditable = isEditMode ? 'true' : 'false';
    th.addEventListener('input', scheduleAutoSave);
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  const tbody = el('tbody');
  (sec.rows || []).forEach(row => {
    const tr = document.createElement('tr');
    (row || []).forEach(cell => {
      const td = el('td', '', cell);
      td.contentEditable = isEditMode ? 'true' : 'false';
      td.addEventListener('input', scheduleAutoSave);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.append(thead, tbody);
  div.appendChild(table);
  if (isEditMode) {
    const addRow = el('button', 'add-row-btn', '＋ 행 추가');
    addRow.onclick = () => {
      sec.rows.push(new Array((sec.headers || []).length).fill(''));
      scheduleAutoSave(); renderPage(getChar(), currentSubPageId);
    };
    div.appendChild(addRow);
  }
  return div;
}

/* ══════════════════════════════
   14. SAVE ARTICLE FROM DOM
══════════════════════════════ */
function saveArticleFromDom(char) {
  const page = char.pages[currentSubPageId];
  if (!page) return;
  const secs = [...$('article').querySelectorAll('.wiki-sec')];
  secs.forEach((el, i) => {
    const id = el.dataset.id;
    const sec = page.sections.find(s => s.id === id);
    if (!sec) return;
    // Title
    const titleEl = el.querySelector('.sec-title');
    if (titleEl) sec.title = titleEl.textContent.trim();
    // Content by type
    switch (sec.type) {
      case 'text': sec.content = el.querySelector('p')?.innerHTML || ''; break;
      case 'list':
        sec.items = [...el.querySelectorAll('li')].map(li => li.textContent.trim());
        break;
      case 'stats':
        sec.rows = [...el.querySelectorAll('tbody tr')].map(tr => {
          const tds = tr.querySelectorAll('td');
          const barEl = tr.querySelector('.bar');
          return { name: tds[0]?.textContent.trim() || '', val: parseInt(barEl?.textContent) || 0, desc: tds[2]?.textContent.trim() || '' };
        });
        break;
      case 'relations':
        sec.cards = [...el.querySelectorAll('.rel-card')].map(c => ({
          emoji: c.querySelector('.rel-emoji-btn')?.textContent || '👤',
          name: c.querySelector('.rel-name')?.textContent.trim() || '',
          type: c.querySelector('.rel-type')?.textContent.trim() || '',
          desc: c.querySelector('.rel-desc')?.textContent.trim() || '',
        }));
        break;
      case 'timeline':
        sec.items = [...el.querySelectorAll('.tl-item')].map(item => ({
          date: item.querySelector('.tl-date')?.textContent.trim() || '',
          text: item.querySelector('.tl-text')?.textContent.trim() || '',
        }));
        break;
      case 'quotes':
        sec.items = [...el.querySelectorAll('.quote-item')].map(item => ({
          quote: item.querySelector('blockquote')?.textContent.trim() || '',
          source: item.querySelector('.quote-src')?.textContent.trim() || '',
        }));
        break;
      case 'spoiler': sec.content = el.querySelector('.spoiler-content')?.innerHTML || ''; break;
      case 'links':
        sec.items = [...el.querySelectorAll('.ext-link-item')].map(item => ({
          icon: item.querySelector('.ext-icon')?.textContent.trim() || '🔗',
          name: item.querySelector('.ext-name')?.textContent.trim() || '',
          url: item.querySelector('.ext-url a')?.textContent.trim() || '',
        }));
        break;
    }
  });
  // Reorder sections based on DOM order
  page.sections = secs.map(el => page.sections.find(s => s.id === el.dataset.id)).filter(Boolean);
}

/* ══════════════════════════════
   15. SECTION MANAGEMENT
══════════════════════════════ */
$$('.add-sec-btn').forEach(btn => {
  btn.onclick = () => {
    if (!currentCharId) return;
    const char = getChar();
    const page = char.pages[currentSubPageId];
    if (!page) return;
    const sec = newSection(btn.dataset.type);
    if (btn.dataset.type === 'video') {
      openModal('videoModal');
      $('videoOk').onclick = () => {
        const vid = extractYtId($('ytUrl').value.trim());
        if (!vid) { toast('❌ 유효한 유튜브 URL을 입력해주세요.'); return; }
        sec.videoId = vid; sec.title = sec.title || '관련 영상';
        page.sections.push(sec);
        saveStore(store);
        renderPage(char, currentSubPageId);
        $('ytUrl').value = '';
        closeModal('videoModal');
      };
      return;
    }
    page.sections.push(sec);
    saveStore(store);
    renderPage(char, currentSubPageId);
    // Scroll to new section
    setTimeout(() => {
      const newEl = $('article').lastElementChild;
      if (newEl) newEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };
});

function moveSection(id, dir, char) {
  saveArticleFromDom(char);
  const page = char.pages[currentSubPageId];
  const idx = page.sections.findIndex(s => s.id === id);
  if (idx < 0) return;
  const target = idx + dir;
  if (target < 0 || target >= page.sections.length) return;
  [page.sections[idx], page.sections[target]] = [page.sections[target], page.sections[idx]];
  saveStore(store);
  renderPage(char, currentSubPageId);
}

function deleteSection(id, char) {
  saveArticleFromDom(char);
  const page = char.pages[currentSubPageId];
  page.sections = page.sections.filter(s => s.id !== id);
  saveStore(store);
  renderPage(char, currentSubPageId);
  toast('섹션 삭제됨');
}

/* ── DRAG REORDER ── */
let dragSrc = null;
$('article').addEventListener('dragstart', e => {
  const sec = e.target.closest('.wiki-sec');
  if (!sec) return;
  dragSrc = sec; sec.style.opacity = '.45';
});
$('article').addEventListener('dragend', e => {
  const sec = e.target.closest('.wiki-sec');
  if (sec) sec.style.opacity = '';
  $$('.wiki-sec').forEach(s => s.classList.remove('drag-over'));
  dragSrc = null;
  const char = getChar(); if (!char) return;
  saveArticleFromDom(char);
  saveStore(store);
});
$('article').addEventListener('dragover', e => {
  e.preventDefault();
  const sec = e.target.closest('.wiki-sec');
  if (!sec || sec === dragSrc) return;
  $$('.wiki-sec').forEach(s => s.classList.remove('drag-over'));
  sec.classList.add('drag-over');
});
$('article').addEventListener('drop', e => {
  e.preventDefault();
  const target = e.target.closest('.wiki-sec');
  if (!target || !dragSrc || target === dragSrc) return;
  const parent = $('article');
  const srcIdx = [...parent.children].indexOf(dragSrc);
  const tgtIdx = [...parent.children].indexOf(target);
  if (srcIdx < tgtIdx) parent.insertBefore(dragSrc, target.nextSibling);
  else parent.insertBefore(dragSrc, target);
  target.classList.remove('drag-over');
});

/* ══════════════════════════════
   16. TOC
══════════════════════════════ */
function renderToc() {
  const nav = $('tocNav');
  nav.innerHTML = '';
  $$('.wiki-sec').forEach(sec => {
    const titleEl = sec.querySelector('.sec-title');
    if (!titleEl) return;
    const a = el('a', 'toc-link', titleEl.textContent.trim());
    a.href = '#' + (titleEl.id || '');
    a.onclick = e => { e.preventDefault(); titleEl.scrollIntoView({ behavior:'smooth', block:'start' }); };
    nav.appendChild(a);
  });
  // Highlight on scroll
  observeTocLinks();
}

function observeTocLinks() {
  if (!('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        $$('#tocNav .toc-link').forEach(a => a.classList.remove('active'));
        const activeLink = document.querySelector(`#tocNav a[href="#${id}"]`);
        if (activeLink) activeLink.classList.add('active');
      }
    });
  }, { rootMargin: '-30% 0px -60% 0px' });
  $$('.sec-title').forEach(title => { if (title.id) observer.observe(title); });
}

/* ══════════════════════════════
   17. CATEGORIES
══════════════════════════════ */
function renderCategories(char) {
  const catList = $('catList');
  catList.innerHTML = '';
  (char.categories || []).forEach((cat, i) => {
    const chip = el('span', 'cat-chip', cat);
    if (isEditMode) {
      const del = el('button', 'cat-chip-del', '✕');
      del.onclick = () => { char.categories.splice(i, 1); saveStore(store); renderCategories(char); };
      chip.appendChild(del);
    }
    catList.appendChild(chip);
  });
}

$('addCatBtn').onclick = () => {
  const tag = prompt('분류 태그 입력:');
  if (!tag) return;
  const char = getChar();
  if (!char.categories) char.categories = [];
  char.categories.push(tag.trim());
  saveStore(store);
  renderCategories(char);
};

/* ══════════════════════════════
   18. EDIT MODE
══════════════════════════════ */
const body = document.body;

$('editModeBtn').onclick = () => {
  isEditMode = true;
  body.classList.add('edit-mode');
  $('editModeBtn').style.display = 'none';
  $('viewModeBtn').style.display = '';
  $('modeChip').className = 'mode-chip mode-edit';
  $('modeIcon').textContent = '✎';
  $('modeLabel').textContent = '편집 중';
  renderPage(getChar(), currentSubPageId);
  renderCategories(getChar());
  // Enable all contenteditable
  document.querySelectorAll('[contenteditable]').forEach(el => el.setAttribute('contenteditable', 'true'));
  toast('✎ 편집 모드로 전환됐어요');
};

$('viewModeBtn').onclick = () => {
  // Save before switching
  saveCurrentState();
  saveStore(store);
  isEditMode = false;
  body.classList.remove('edit-mode');
  $('editModeBtn').style.display = '';
  $('viewModeBtn').style.display = 'none';
  $('modeChip').className = 'mode-chip mode-view';
  $('modeIcon').textContent = '👁';
  $('modeLabel').textContent = '보기 모드';
  renderPage(getChar(), currentSubPageId);
  renderCategories(getChar());
  toast('✓ 저장됐어요!');
};

/* ══════════════════════════════
   19. STYLE PANEL
══════════════════════════════ */
function syncStylePanel(s) {
  $$('.th-btn').forEach(b => b.classList.toggle('active', b.dataset.theme === s.theme));
  $$('.ac-dot').forEach(d => d.classList.toggle('active', d.dataset.accent === s.accent));
  $$('[data-font]').forEach(b => b.classList.toggle('active', b.dataset.font === s.font));
  $$('[data-ibstyle]').forEach(b => b.classList.toggle('active', b.dataset.ibstyle === s.ibStyle));
  $$('[data-layout]').forEach(b => b.classList.toggle('active', b.dataset.layout === s.layout));
  $$('[data-pat]').forEach(b => b.classList.toggle('active', b.dataset.pat === (s.pattern || 'none')));
  $$('[data-div]').forEach(b => b.classList.toggle('active', b.dataset.div === (s.divider || 'line')));
  $('fszRange').value = s.fontSize || 15;
  $('fszLabel').textContent = s.fontSize || 15;
  $('accentCustom').value = s.accent || '#2563eb';
}

$$('.th-btn').forEach(btn => btn.onclick = () => {
  const char = getChar(); if (!char) return;
  char.style.theme = btn.dataset.theme;
  document.documentElement.setAttribute('data-theme', btn.dataset.theme);
  $$('.th-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active');
  scheduleAutoSave();
});

$$('.ac-dot').forEach(dot => dot.onclick = () => {
  const char = getChar(); if (!char) return;
  char.style.accent = dot.dataset.accent;
  setAccentColor(dot.dataset.accent);
  $$('.ac-dot').forEach(d => d.classList.remove('active')); dot.classList.add('active');
  $('accentCustom').value = dot.dataset.accent;
  scheduleAutoSave();
});

$('accentCustom').oninput = () => {
  const char = getChar(); if (!char) return;
  char.style.accent = $('accentCustom').value;
  setAccentColor($('accentCustom').value);
  $$('.ac-dot').forEach(d => d.classList.remove('active'));
  scheduleAutoSave();
};

$$('[data-font]').forEach(btn => btn.onclick = () => {
  const char = getChar(); if (!char) return;
  char.style.font = btn.dataset.font;
  body.className = body.className.replace(/font-\w+/g, '').trim();
  body.classList.add('font-' + btn.dataset.font);
  $$('[data-font]').forEach(b => b.classList.remove('active')); btn.classList.add('active');
  scheduleAutoSave();
});

$$('[data-ibstyle]').forEach(btn => btn.onclick = () => {
  const char = getChar(); if (!char) return;
  char.style.ibStyle = btn.dataset.ibstyle;
  const ib = $('infobox');
  ib.classList.remove('style-classic','style-card','style-minimal');
  ib.classList.add('style-' + btn.dataset.ibstyle);
  $$('[data-ibstyle]').forEach(b => b.classList.remove('active')); btn.classList.add('active');
  scheduleAutoSave();
});

$$('[data-layout]').forEach(btn => btn.onclick = () => {
  const char = getChar(); if (!char) return;
  char.style.layout = btn.dataset.layout;
  $('contentLayout').className = 'layout-' + btn.dataset.layout;
  $$('[data-layout]').forEach(b => b.classList.remove('active')); btn.classList.add('active');
  scheduleAutoSave();
});

$('fszRange').oninput = () => {
  const char = getChar(); if (!char) return;
  const val = $('fszRange').value;
  char.style.fontSize = +val;
  document.documentElement.style.fontSize = val + 'px';
  $('fszLabel').textContent = val;
  scheduleAutoSave();
};

$$('[data-pat]').forEach(btn => btn.onclick = () => {
  const char = getChar(); if (!char) return;
  char.style.pattern = btn.dataset.pat;
  body.className = body.className.replace(/pat-\w+/g, '').trim();
  if (btn.dataset.pat !== 'none') body.classList.add('pat-' + btn.dataset.pat);
  $$('[data-pat]').forEach(b => b.classList.remove('active')); btn.classList.add('active');
  scheduleAutoSave();
});

$$('[data-div]').forEach(btn => btn.onclick = () => {
  const char = getChar(); if (!char) return;
  char.style.divider = btn.dataset.div;
  applyDividerStyle(btn.dataset.div);
  $$('[data-div]').forEach(b => b.classList.remove('active')); btn.classList.add('active');
  scheduleAutoSave();
});

function applyDividerStyle(div) {
  $$('.wiki-sec').forEach(sec => {
    sec.classList.remove('divider-dashed','divider-gradient','divider-none');
    if (div && div !== 'line') sec.classList.add('divider-' + div);
  });
}

$('resetStyleBtn').onclick = () => {
  const char = getChar(); if (!char) return;
  char.style = { theme:'light', accent:'#2563eb', font:'modern', ibStyle:'classic', layout:'right', fontSize:15, pattern:'none', divider:'line' };
  saveStore(store);
  applyCharStyle(char);
  toast('↺ 스타일 초기화됨');
};

function setAccentColor(color) {
  document.documentElement.style.setProperty('--accent', color);
  // Derive accent-h (darken ~10%)
  document.documentElement.style.setProperty('--accent-h', color);
  // bar
  document.documentElement.style.setProperty('--bar-start', color);
  document.documentElement.style.setProperty('--tl-color', color);
}

/* ══════════════════════════════
   20. COVER & AVATAR
══════════════════════════════ */
$('changeCoverBtn').onclick = () => $('coverUpload').click();
$('coverUpload').onchange = e => {
  const f = e.target.files[0]; if (!f) return;
  readFileAsDataURL(f, url => {
    const char = getChar(); char.coverImg = url; saveStore(store); renderCover(char);
  });
};
$('removeCoverBtn').onclick = () => {
  const char = getChar(); char.coverImg = null; saveStore(store); renderCover(char);
};
$('changeAvatarBtn').onclick = () => $('avatarUpload').click();
$('avatarUpload').onchange = e => {
  const f = e.target.files[0]; if (!f) return;
  readFileAsDataURL(f, url => {
    const char = getChar(); char.avatarImg = url; saveStore(store);
    renderAvatar(char); renderCharList();
  });
};

/* ══════════════════════════════
   21. CHAR TITLE / SUBTITLE (live edit)
══════════════════════════════ */
$('charTitle').addEventListener('input', () => {
  const char = getChar(); if (!char) return;
  char.name = $('charTitle').textContent.trim();
  renderCharList();
  updateBreadcrumb(char);
  scheduleAutoSave();
});
$('charSubtitle').addEventListener('input', () => {
  const char = getChar(); if (!char) return;
  char.subtitle = $('charSubtitle').textContent.trim();
  scheduleAutoSave();
});

/* ══════════════════════════════
   22. THEME TOGGLE (global)
══════════════════════════════ */
$('themeToggle').onclick = () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  store.settings.theme = next;
  const char = getChar(); if (char) char.style.theme = next;
  saveStore(store);
  $$('.th-btn').forEach(b => b.classList.toggle('active', b.dataset.theme === next));
};

/* ══════════════════════════════
   23. SIDEBAR TOGGLE
══════════════════════════════ */
$('sidebarToggle').onclick = collapseSidebar;
$('menuBtn').onclick = () => {
  const sidebar = $('charListSidebar');
  if (sidebar.classList.contains('collapsed')) expandSidebar();
  else collapseSidebar();
};
$('breadHome').onclick = showHome;
$('breadHome').addEventListener('keydown', e => { if (e.key === 'Enter') showHome(); });

function collapseSidebar() {
  $('charListSidebar').classList.add('collapsed');
  $('mainWrap').classList.add('sidebar-collapsed');
  $('menuBtn').setAttribute('aria-expanded', 'false');
}
function expandSidebar() {
  $('charListSidebar').classList.remove('collapsed');
  $('mainWrap').classList.remove('sidebar-collapsed');
  $('menuBtn').setAttribute('aria-expanded', 'true');
}
function collapseSidebarOnMobile() {
  if (window.innerWidth <= 768) collapseSidebar();
  else expandSidebar();
}

/* ══════════════════════════════
   24. SHARE (URL encoding)
══════════════════════════════ */
$('shareBtn').onclick = () => {
  const char = getChar(); if (!char) { toast('먼저 캐릭터를 선택해주세요'); return; }
  try {
    const data = JSON.stringify(char);
    const encoded = btoa(encodeURIComponent(data));
    const url = location.origin + location.pathname + '?share=' + encoded;
    $('shareUrlInput').value = url;
    openModal('shareModal');
  } catch(e) { toast('❌ 데이터가 너무 커서 URL 공유가 어려워요.'); }
};
$('copyShareUrl').onclick = () => {
  navigator.clipboard.writeText($('shareUrlInput').value).then(() => {
    $('copyShareUrl').textContent = '✅ 복사됨!';
    setTimeout(() => $('copyShareUrl').textContent = '복사', 1500);
  }).catch(() => {
    $('shareUrlInput').select(); document.execCommand('copy');
    $('copyShareUrl').textContent = '✅ 복사됨!';
    setTimeout(() => $('copyShareUrl').textContent = '복사', 1500);
  });
};

function loadSharedChar() {
  const params = new URLSearchParams(location.search);
  const share = params.get('share');
  if (!share) return false;
  try {
    const char = JSON.parse(decodeURIComponent(atob(share)));
    char.id = 'shared_' + Date.now();
    // Check if already exists by name
    if (!store.chars.find(c => c.name === char.name)) {
      store.chars.push(char);
      saveStore(store);
      toast(`📖 "${char.name}" 위키를 불러왔어요! (읽기 전용)`);
    }
    openChar(char.id);
    // Clean URL
    history.replaceState({}, '', location.pathname);
    return true;
  } catch { toast('❌ 공유 링크를 불러오는 데 실패했어요.'); return false; }
}

/* ══════════════════════════════
   25. EXPORT / IMPORT ALL
══════════════════════════════ */
$('exportAllBtn').onclick = () => {
  const json = JSON.stringify(store, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'charawiki_backup_' + new Date().toISOString().slice(0,10) + '.json';
  a.click();
  URL.revokeObjectURL(a.href);
  toast('💾 백업 파일이 다운로드됐어요!');
};

$('importAllBtn').onclick = () => $('importFile').click();
$('importFile').onchange = e => {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = ev => {
    try {
      const imported = JSON.parse(ev.target.result);
      if (!imported.chars) throw new Error('잘못된 형식');
      // Merge
      imported.chars.forEach(ic => {
        if (!store.chars.find(c => c.id === ic.id)) store.chars.push(ic);
      });
      saveStore(store);
      renderCharList();
      toast(`✅ ${imported.chars.length}개 캐릭터 불러옴!`);
    } catch { toast('❌ 올바른 백업 파일이 아니에요.'); }
  };
  r.readAsText(f);
  e.target.value = '';
};

/* ══════════════════════════════
   26. STATS
══════════════════════════════ */
function updateStats() {
  const char = getChar(); if (!char) return;
  const pageCount = Object.keys(char.pages || {}).length;
  const wordCount = ($('article')?.innerText || '').replace(/\s+/g,'').length;
  const edited = char.updatedAt ? new Date(char.updatedAt).toLocaleDateString('ko-KR', { month:'short', day:'numeric' }) : '-';
  $('statPages').textContent = pageCount;
  $('statWords').textContent = wordCount.toLocaleString();
  $('statEdited').textContent = edited;
}

/* ══════════════════════════════
   27. READING PROGRESS & BTT
══════════════════════════════ */
const progressBar = $('readProgress');
const btt = $('btt');
window.addEventListener('scroll', () => {
  const doc = document.documentElement;
  const pct = doc.scrollHeight > doc.clientHeight ? doc.scrollTop / (doc.scrollHeight - doc.clientHeight) * 100 : 0;
  progressBar.style.width = pct + '%';
  btt.classList.toggle('show', window.scrollY > 400);
  observeActiveToc();
}, { passive: true });
btt.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });

function observeActiveToc() {
  let activeId = null;
  $$('.sec-title[id]').forEach(el => {
    if (el.getBoundingClientRect().top < 120) activeId = el.id;
  });
  $$('#tocNav .toc-link').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === '#' + activeId);
  });
}

/* ══════════════════════════════
   28. LIGHTBOX
══════════════════════════════ */
function openLightbox(src) {
  $('lbImg').src = src;
  $('lightbox').classList.add('open');
}
$('lbClose').onclick = () => $('lightbox').classList.remove('open');
$('lightbox').onclick = e => { if (e.target === $('lightbox')) $('lightbox').classList.remove('open'); };
document.addEventListener('click', e => {
  const img = e.target.closest('.ib-img, .gal-item img');
  if (img?.src) openLightbox(img.src);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { $$('.modal.open').forEach(m => m.classList.remove('open')); $('lightbox').classList.remove('open'); }
});

/* ══════════════════════════════
   29. EMOJI PICKER
══════════════════════════════ */
const EMOJIS = ['👤','👨','👩','👦','👧','👴','👵','🧑‍🦱','🧑‍🦰','🧑‍🦳','🧙‍♂️','🧙‍♀️','🦸‍♂️','🦸‍♀️','🦹‍♂️','🧝‍♀️','🧚','🧜‍♀️','🧛‍♂️','🤺','🧞‍♂️','🐉','🐺','🦊','🐱','🐻','🦁','🐯','🐰','🐸','🐧','🦋','🌸','🌺','🌙','⭐','💫','🔥','💧','🌊','🌿','🍀','🎭','🎯','🏆','👑','💎','🗡️','🛡️','🔮','💌','📖','🎵'];

function initEmojiGrid() {
  const grid = $('emojiGrid');
  grid.innerHTML = '';
  EMOJIS.forEach(em => {
    const btn = el('button', 'em-btn', em);
    grid.appendChild(btn);
  });
}

let emojiCallback = null;
function pickEmoji(cb) {
  emojiCallback = cb;
  openModal('emojiModal');
}
$('emojiGrid').addEventListener('click', e => {
  const btn = e.target.closest('.em-btn');
  if (!btn) return;
  if (emojiCallback) { emojiCallback(btn.textContent); emojiCallback = null; }
  closeModal('emojiModal');
});

/* ══════════════════════════════
   30. UTILITIES
══════════════════════════════ */
function readFileAsDataURL(file, cb) {
  const r = new FileReader();
  r.onload = ev => cb(ev.target.result);
  r.readAsDataURL(file);
}

function extractYtId(url) {
  const patterns = [
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /embed\/([A-Za-z0-9_-]{11})/,
    /^([A-Za-z0-9_-]{11})$/,
  ];
  for (const p of patterns) { const m = url.match(p); if (m) return m[1]; }
  return null;
}

/* ══════════════════════════════
   31. AUTO SAVE on DOM edits
══════════════════════════════ */
document.addEventListener('input', e => {
  if (!currentCharId || !isEditMode) return;
  scheduleAutoSave();
});

/* ══════════════════════════════
   32. KEYBOARD SHORTCUTS
══════════════════════════════ */
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    if (isEditMode) { $('viewModeBtn').click(); }
    else { saveStore(store); toast('💾 저장됨!'); }
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
    e.preventDefault();
    if (!isEditMode && currentCharId) $('editModeBtn').click();
  }
});

/* ══════════════════════════════
   33. RESIZE HANDLER
══════════════════════════════ */
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (window.innerWidth > 768) expandSidebar();
  }, 200);
}, { passive: true });

/* ══════════════════════════════
   34. INIT
══════════════════════════════ */
function init() {
  initEmojiGrid();

  // Apply global settings
  document.documentElement.setAttribute('data-theme', store.settings.theme || 'light');
  body.classList.add('font-' + (store.settings.font || 'modern'));

  // Render char list
  renderCharList();

  // Load from URL share param first
  if (!loadSharedChar()) {
    // Auto-open last character if any
    if (store.chars.length > 0) {
      openChar(store.chars[0].id);
    } else {
      showHome();
    }
  }

  // On desktop, sidebar is expanded by default
  if (window.innerWidth > 768) expandSidebar();
  else collapseSidebar();
}

init();
