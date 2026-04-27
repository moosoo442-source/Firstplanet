/* ============================================================
   CharaWiki v2.0 — script.js
   관리자/방문자 모드 + 전체 인터랙션 로직
============================================================ */

/* ============ CONSTANTS ============ */
const PW_KEY    = 'charawiki-pw-hash';
const STATE_KEY = 'charawiki-state';
const THEMES    = ['default','dark','sakura','ocean','forest','galaxy','retro','halloween','christmas'];

/* ============ ELEMENTS ============ */
const body = document.body;

/* panels */
const themePanel  = document.getElementById('themePanel');
const decorPanel  = document.getElementById('decorPanel');
const overlay     = document.getElementById('panelOverlay');
const themeClose  = document.getElementById('themeClose');
const decorClose  = document.getElementById('decorClose');
const themeBtn    = document.getElementById('themeToggleBtn');
const decorBtn    = document.getElementById('decorToggleBtn');

/* admin */
const adminLockBtn    = document.getElementById('adminLockBtn');
const adminBar        = document.getElementById('adminBar');
const adminLogoutBtn  = document.getElementById('adminLogoutBtn');
const adminModal      = document.getElementById('adminModal');
const adminPwInput    = document.getElementById('adminPwInput');
const adminConfirm    = document.getElementById('adminConfirm');
const adminCancel     = document.getElementById('adminCancel');
const adminErrorMsg   = document.getElementById('adminErrorMsg');
const adminModalTitle = document.getElementById('adminModalTitle');
const adminModalDesc  = document.getElementById('adminModalDesc');

/* change pw */
const changePwBtn     = document.getElementById('changePwBtn');
const changePwModal   = document.getElementById('changePwModal');
const oldPwInput      = document.getElementById('oldPwInput');
const newPwInput      = document.getElementById('newPwInput');
const newPwConfirm    = document.getElementById('newPwConfirm');
const changePwError   = document.getElementById('changePwError');
const changePwCancel  = document.getElementById('changePwCancel');
const changePwConfirm = document.getElementById('changePwConfirm');

/* state */
const state = {
  theme:'default', font:'gothic', pattern:'none',
  border:'solid', divider:'solid', accent:'#3366cc',
  textColor:'', fontSize:15, card:'flat', anim:'normal',
  cursor:'default', bgOpacity:40, infoPos:'right',
};

let isAdmin = false;
let activePanel = null;
let galleryImages = []; // {src, caption}
let lightboxIdx = 0;

/* ============ UTILS ============ */
function showToast(msg, dur=2200) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), dur);
}

async function hashStr(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

/* ============ PANEL LOGIC ============ */
function openPanel(panel) {
  if (activePanel && activePanel !== panel) closePanel(activePanel);
  panel.classList.add('open');
  overlay.classList.add('active');
  activePanel = panel;
}
function closePanel(panel) {
  if (!panel) return;
  panel.classList.remove('open');
  overlay.classList.remove('active');
  activePanel = null;
}

themeBtn.addEventListener('click', e => {
  e.stopPropagation();
  activePanel === themePanel ? closePanel(themePanel) : openPanel(themePanel);
});
decorBtn.addEventListener('click', e => {
  e.stopPropagation();
  activePanel === decorPanel ? closePanel(decorPanel) : openPanel(decorPanel);
});
themeClose.addEventListener('click', () => closePanel(themePanel));
decorClose.addEventListener('click', () => closePanel(decorPanel));
overlay.addEventListener('click', () => closePanel(activePanel));

/* ============ ADMIN SYSTEM ============ */
async function isFirstTime() {
  return !localStorage.getItem(PW_KEY);
}

adminLockBtn.addEventListener('click', () => {
  if (isAdmin) {
    // already admin — just close
    return;
  }
  openAdminModal();
});

async function openAdminModal() {
  const first = await isFirstTime();
  adminModalTitle.textContent = first ? '🔐 관리자 비밀번호 설정' : '🔐 관리자 로그인';
  adminModalDesc.innerHTML = first
    ? '처음 사용이에요! 원하는 비밀번호를 설정하세요.<br><small style="color:var(--text-muted)">※ 4자 이상 권장</small>'
    : '관리자 비밀번호를 입력하세요.';
  adminErrorMsg.classList.add('hidden');
  adminPwInput.value = '';
  adminModal.classList.add('open');
  setTimeout(() => adminPwInput.focus(), 80);
}

adminCancel.addEventListener('click', () => adminModal.classList.remove('open'));
adminModal.addEventListener('click', e => { if (e.target === adminModal) adminModal.classList.remove('open'); });

adminConfirm.addEventListener('click', async () => {
  const pw = adminPwInput.value.trim();
  if (!pw) { adminPwInput.focus(); return; }
  const stored = localStorage.getItem(PW_KEY);
  const hash = await hashStr(pw);
  if (!stored) {
    // first time — set password
    localStorage.setItem(PW_KEY, hash);
    adminModal.classList.remove('open');
    enableAdmin();
    showToast('✅ 비밀번호가 설정되었습니다! 관리자 모드 활성화.');
  } else {
    if (hash === stored) {
      adminModal.classList.remove('open');
      enableAdmin();
      showToast('🛡️ 관리자 모드 활성화됨');
    } else {
      adminErrorMsg.classList.remove('hidden');
      adminPwInput.value = '';
      adminPwInput.focus();
    }
  }
});
adminPwInput.addEventListener('keydown', e => { if (e.key === 'Enter') adminConfirm.click(); });

function enableAdmin() {
  isAdmin = true;
  body.classList.add('is-admin');
  adminBar.classList.remove('hidden');
  document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
  document.querySelectorAll('.editable-admin').forEach(el => el.setAttribute('contenteditable','true'));
  document.querySelectorAll('.infobox-img-wrap').forEach(el => {
    el.style.cursor = 'pointer';
  });
  adminLockBtn.title = '관리자 모드 ON';
}

adminLogoutBtn.addEventListener('click', () => {
  isAdmin = false;
  body.classList.remove('is-admin');
  adminBar.classList.add('hidden');
  document.querySelectorAll('.admin-only').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.editable-admin').forEach(el => el.setAttribute('contenteditable','false'));
  adminLockBtn.title = '관리자';
  showToast('🔒 관리자 모드 해제됨');
});

/* ============ CHANGE PASSWORD ============ */
if (changePwBtn) {
  changePwBtn.addEventListener('click', () => {
    oldPwInput.value = ''; newPwInput.value = ''; newPwConfirm.value = '';
    changePwError.classList.add('hidden');
    changePwModal.classList.add('open');
    setTimeout(() => oldPwInput.focus(), 80);
  });
}
changePwCancel.addEventListener('click', () => changePwModal.classList.remove('open'));
changePwModal.addEventListener('click', e => { if (e.target === changePwModal) changePwModal.classList.remove('open'); });
changePwConfirm.addEventListener('click', async () => {
  const old = oldPwInput.value.trim();
  const nw  = newPwInput.value.trim();
  const cf  = newPwConfirm.value.trim();
  const stored = localStorage.getItem(PW_KEY);
  const oldHash = await hashStr(old);
  changePwError.classList.add('hidden');
  if (oldHash !== stored) { changePwError.textContent = '현재 비밀번호가 틀렸습니다.'; changePwError.classList.remove('hidden'); return; }
  if (nw.length < 4) { changePwError.textContent = '비밀번호는 4자 이상이어야 합니다.'; changePwError.classList.remove('hidden'); return; }
  if (nw !== cf) { changePwError.textContent = '새 비밀번호가 일치하지 않습니다.'; changePwError.classList.remove('hidden'); return; }
  const newHash = await hashStr(nw);
  localStorage.setItem(PW_KEY, newHash);
  changePwModal.classList.remove('open');
  showToast('✅ 비밀번호가 변경되었습니다.');
});

/* ============ THEME ============ */
document.querySelectorAll('.theme-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    applyTheme(btn.dataset.theme);
    document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});
function applyTheme(theme) {
  THEMES.forEach(t => body.classList.remove(`theme-${t}`));
  if (theme !== 'default') body.classList.add(`theme-${theme}`);
  state.theme = theme;
  saveState();
}

/* ============ FONT ============ */
document.querySelectorAll('[data-font]').forEach(btn => {
  btn.addEventListener('click', () => {
    applyFont(btn.dataset.font);
    document.querySelectorAll('[data-font]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});
function applyFont(font) {
  ['gothic','serif','handwriting','round'].forEach(f => body.classList.remove(`font-${f}`));
  body.classList.add(`font-${font}`);
  state.font = font;
  saveState();
}

/* ============ PATTERN ============ */
document.querySelectorAll('[data-pattern]').forEach(btn => {
  btn.addEventListener('click', () => {
    applyPattern(btn.dataset.pattern);
    document.querySelectorAll('[data-pattern]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});
function applyPattern(pattern) {
  ['none','grid','dot','diagonal','cross'].forEach(p => body.classList.remove(`pattern-${p}`));
  if (pattern !== 'none') body.classList.add(`pattern-${pattern}`);
  state.pattern = pattern;
  saveState();
}

/* ============ BG IMAGE ============ */
const bgImgUpload  = document.getElementById('bgImgUpload');
const removeBgBtn  = document.getElementById('removeBgBtn');
const bgOpacityRange = document.getElementById('bgOpacityRange');
const bgOpacityVal   = document.getElementById('bgOpacityVal');

bgImgUpload.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    applyBgImage(ev.target.result, bgOpacityRange.value);
    state.bgImg = ev.target.result;
    saveState();
  };
  reader.readAsDataURL(file);
});

removeBgBtn.addEventListener('click', () => {
  body.style.backgroundImage = '';
  delete state.bgImg;
  saveState();
  showToast('배경 이미지가 제거되었습니다.');
});

bgOpacityRange.addEventListener('input', () => {
  const v = bgOpacityRange.value;
  bgOpacityVal.textContent = `${v}%`;
  state.bgOpacity = parseInt(v);
  if (state.bgImg) applyBgImage(state.bgImg, v);
  saveState();
});

function applyBgImage(src, opacity) {
  const alpha = (parseInt(opacity) / 100 * 0.6).toFixed(2);
  body.style.backgroundImage =
    `linear-gradient(rgba(var(--bg-rgb, 248,249,250),${1-alpha}),rgba(var(--bg-rgb,248,249,250),${1-alpha})), url('${src}')`;
  body.style.backgroundSize = 'cover';
  body.style.backgroundAttachment = 'fixed';
}

/* ============ INFOBOX BORDER ============ */
const infobox = document.getElementById('infobox');
document.querySelectorAll('[data-border]').forEach(btn => {
  btn.addEventListener('click', () => {
    applyBorder(btn.dataset.border);
    document.querySelectorAll('[data-border]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});
function applyBorder(border) {
  ['solid','dashed','double','shadow'].forEach(b => infobox.classList.remove(`border-${b}`));
  infobox.classList.add(`border-${border}`);
  state.border = border;
  saveState();
}

/* ============ DIVIDERS ============ */
document.querySelectorAll('[data-divider]').forEach(btn => {
  btn.addEventListener('click', () => {
    applyDivider(btn.dataset.divider);
    document.querySelectorAll('[data-divider]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});
function applyDivider(divider) {
  document.querySelectorAll('.section-divider').forEach(el => {
    ['solid','dashed','gradient','double'].forEach(d => el.classList.remove(`divider-${d}`));
    el.classList.add(`divider-${divider}`);
  });
  state.divider = divider;
  saveState();
}

/* ============ CARD STYLE ============ */
document.querySelectorAll('[data-card]').forEach(btn => {
  btn.addEventListener('click', () => {
    applyCard(btn.dataset.card);
    document.querySelectorAll('[data-card]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});
function applyCard(card) {
  ['flat','raised','glass'].forEach(c => body.classList.remove(`card-${c}`));
  body.classList.add(`card-${card}`);
  state.card = card;
  saveState();
}

/* ============ ANIMATION ============ */
document.querySelectorAll('[data-anim]').forEach(btn => {
  btn.addEventListener('click', () => {
    applyAnim(btn.dataset.anim);
    document.querySelectorAll('[data-anim]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});
function applyAnim(anim) {
  ['none','normal','strong'].forEach(a => body.classList.remove(`anim-${a}`));
  if (anim !== 'normal') body.classList.add(`anim-${anim}`);
  state.anim = anim;
  saveState();
}

/* ============ CURSOR ============ */
const customCursor = document.getElementById('customCursor');
const CURSOR_ICONS = { star:'⭐', heart:'❤️', cat:'🐱' };
document.querySelectorAll('[data-cursor]').forEach(btn => {
  btn.addEventListener('click', () => {
    applyCursor(btn.dataset.cursor);
    document.querySelectorAll('[data-cursor]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});
function applyCursor(cursor) {
  ['default','star','heart','cat'].forEach(c => body.classList.remove(`cursor-${c}`));
  body.classList.add(`cursor-${cursor}`);
  if (cursor !== 'default') {
    customCursor.textContent = CURSOR_ICONS[cursor] || '';
    customCursor.style.display = 'block';
    document.body.style.cursor = 'none';
  } else {
    customCursor.style.display = 'none';
    document.body.style.cursor = '';
  }
  state.cursor = cursor;
  saveState();
}
document.addEventListener('mousemove', e => {
  if (state.cursor !== 'default') {
    customCursor.style.left = e.clientX + 'px';
    customCursor.style.top  = e.clientY + 'px';
  }
});

/* ============ ACCENT COLOR ============ */
document.querySelectorAll('.color-dot').forEach(dot => {
  dot.addEventListener('click', () => {
    applyAccent(dot.dataset.color);
    document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
    dot.classList.add('active');
  });
});
const customColorInput = document.getElementById('customColor');
customColorInput.addEventListener('input', () => {
  applyAccent(customColorInput.value);
  document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
});
function applyAccent(color) {
  document.documentElement.style.setProperty('--accent', color);
  body.style.setProperty('--accent', color);
  body.style.setProperty('--text-link', color);
  body.style.setProperty('--quote-border', color);
  body.style.setProperty('--tag-color', color);
  state.accent = color;
  saveState();
}

/* ============ TEXT COLOR ============ */
const customTextColor = document.getElementById('customTextColor');
const resetTextColor  = document.getElementById('resetTextColor');
customTextColor.addEventListener('input', () => {
  document.documentElement.style.setProperty('--text', customTextColor.value);
  body.style.setProperty('--text', customTextColor.value);
  state.textColor = customTextColor.value;
  saveState();
});
resetTextColor.addEventListener('click', () => {
  document.documentElement.style.removeProperty('--text');
  body.style.removeProperty('--text');
  state.textColor = '';
  saveState();
});

/* ============ FONT SIZE ============ */
const fontSizeRange = document.getElementById('fontSizeRange');
const fontSizeVal   = document.getElementById('fontSizeVal');
fontSizeRange.addEventListener('input', () => {
  const size = fontSizeRange.value;
  document.documentElement.style.fontSize = `${size}px`;
  fontSizeVal.textContent = `${size}px`;
  state.fontSize = parseInt(size);
  saveState();
});

/* ============ INFOBOX POSITION ============ */
const wikiBody = document.getElementById('wikiBody');
document.querySelectorAll('[data-infopos]').forEach(btn => {
  btn.addEventListener('click', () => {
    applyInfoPos(btn.dataset.infopos);
    document.querySelectorAll('[data-infopos]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});
function applyInfoPos(pos) {
  infobox.classList.remove('infobox-pos-left','infobox-pos-top');
  wikiBody.style.flexDirection = '';
  if (pos === 'left')  infobox.classList.add('infobox-pos-left');
  if (pos === 'top') { infobox.classList.add('infobox-pos-top'); wikiBody.style.flexDirection = 'column'; }
  state.infoPos = pos;
  saveState();
}

/* ============ RESET DECOR ============ */
document.getElementById('resetDecor').addEventListener('click', () => {
  if (!confirm('꾸미기 설정을 초기화할까요?')) return;
  applyFont('gothic');
  applyPattern('none');
  applyBorder('solid');
  applyDivider('solid');
  applyCard('flat');
  applyAnim('normal');
  applyCursor('default');
  applyInfoPos('right');
  document.documentElement.style.removeProperty('font-size');
  fontSizeRange.value = 15; fontSizeVal.textContent = '15px';
  body.style.removeProperty('--accent');
  body.style.removeProperty('--text-link');
  body.style.removeProperty('--quote-border');
  body.style.removeProperty('--tag-color');
  body.style.removeProperty('--text');
  document.documentElement.style.removeProperty('--text');
  customColorInput.value = '#3366cc';
  customTextColor.value = '#202122';
  body.style.backgroundImage = '';
  delete state.bgImg;
  document.querySelectorAll('[data-font]').forEach(b => b.classList.toggle('active', b.dataset.font==='gothic'));
  document.querySelectorAll('[data-pattern]').forEach(b => b.classList.toggle('active', b.dataset.pattern==='none'));
  document.querySelectorAll('[data-border]').forEach(b => b.classList.toggle('active', b.dataset.border==='solid'));
  document.querySelectorAll('[data-divider]').forEach(b => b.classList.toggle('active', b.dataset.divider==='solid'));
  document.querySelectorAll('[data-card]').forEach(b => b.classList.toggle('active', b.dataset.card==='flat'));
  document.querySelectorAll('[data-anim]').forEach(b => b.classList.toggle('active', b.dataset.anim==='normal'));
  document.querySelectorAll('[data-cursor]').forEach(b => b.classList.toggle('active', b.dataset.cursor==='default'));
  document.querySelectorAll('[data-infopos]').forEach(b => b.classList.toggle('active', b.dataset.infopos==='right'));
  document.querySelectorAll('.color-dot').forEach((d,i) => d.classList.toggle('active', i===0));
  Object.assign(state, { font:'gothic', pattern:'none', border:'solid', divider:'solid',
    accent:'#3366cc', textColor:'', fontSize:15, card:'flat', anim:'normal', cursor:'default', infoPos:'right' });
  saveState();
  showToast('꾸미기가 초기화되었습니다.');
});

/* ============ IMAGE UPLOAD (infobox) ============ */
const imgUpload      = document.getElementById('imgUpload');
const imgPlaceholder = document.getElementById('imgPlaceholder');
const charImg        = document.getElementById('charImg');
const imgWrap        = document.getElementById('imgWrap');

imgWrap.addEventListener('click', () => { if (isAdmin) imgUpload.click(); });
imgUpload.addEventListener('click', e => e.stopPropagation());
imgUpload.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    charImg.src = ev.target.result;
    charImg.classList.remove('hidden');
    imgPlaceholder.style.display = 'none';
  };
  reader.readAsDataURL(file);
});

/* ============ IMAGE FILTER ============ */
document.querySelectorAll('[data-imgfilter]').forEach(btn => {
  btn.addEventListener('click', () => {
    const filter = btn.dataset.imgfilter;
    charImg.className = 'infobox-img';
    if (filter !== 'none') charImg.classList.add(`filter-${filter}`);
    document.querySelectorAll('[data-imgfilter]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

/* ============ ADD INFOBOX ROW ============ */
const addRowModal    = document.getElementById('addRowModal');
const modalCancel    = document.getElementById('modalCancel');
const modalOk        = document.getElementById('modalOk');
const newRowKey      = document.getElementById('newRowKey');
const newRowVal      = document.getElementById('newRowVal');
const infoTableBody  = document.getElementById('infoTableBody');
const addRowBtn      = document.getElementById('addRowBtn');
const addSectionHeaderBtn = document.getElementById('addSectionHeaderBtn');

addRowBtn.addEventListener('click', () => { addRowModal.classList.add('open'); newRowKey.focus(); });
modalCancel.addEventListener('click', closeRowModal);
addRowModal.addEventListener('click', e => { if (e.target === addRowModal) closeRowModal(); });
function closeRowModal() { addRowModal.classList.remove('open'); newRowKey.value = ''; newRowVal.value = ''; }

modalOk.addEventListener('click', () => {
  const key = newRowKey.value.trim();
  const val = newRowVal.value.trim();
  if (!key) { newRowKey.focus(); return; }
  const tr = document.createElement('tr');
  tr.innerHTML = `<th>${key}</th><td class="editable-admin" contenteditable="${isAdmin?'true':'false'}">${val||'-'}</td>`;
  infoTableBody.appendChild(tr);
  closeRowModal();
});
newRowVal.addEventListener('keydown', e => { if (e.key === 'Enter') modalOk.click(); });

addSectionHeaderBtn.addEventListener('click', () => {
  const title = prompt('섹션 헤더 이름:');
  if (!title) return;
  const tr = document.createElement('tr');
  tr.innerHTML = `<th colspan="2" class="info-section-header">${title}</th>`;
  infoTableBody.appendChild(tr);
});

/* ============ TAGS ============ */
const addTagBtn   = document.getElementById('addTagBtn');
const addTagModal = document.getElementById('addTagModal');
const newTagInput = document.getElementById('newTagInput');
const tagCancel   = document.getElementById('tagCancel');
const tagOk       = document.getElementById('tagOk');
const tagArea     = document.getElementById('tagArea');

addTagBtn.addEventListener('click', () => { addTagModal.classList.add('open'); newTagInput.value = ''; newTagInput.focus(); });
tagCancel.addEventListener('click', () => addTagModal.classList.remove('open'));
addTagModal.addEventListener('click', e => { if (e.target === addTagModal) addTagModal.classList.remove('open'); });
tagOk.addEventListener('click', () => {
  const tag = newTagInput.value.trim();
  if (!tag) return;
  const span = document.createElement('span');
  span.className = 'wiki-tag';
  span.dataset.removable = 'true';
  span.textContent = tag;
  span.addEventListener('click', () => { if (isAdmin && confirm(`"${tag}" 태그를 삭제할까요?`)) span.remove(); });
  tagArea.insertBefore(span, addTagBtn);
  addTagModal.classList.remove('open');
});
newTagInput.addEventListener('keydown', e => { if (e.key === 'Enter') tagOk.click(); });

// existing tag click-to-delete
document.querySelectorAll('.wiki-tag[data-removable]').forEach(tag => {
  tag.addEventListener('click', () => {
    if (isAdmin && confirm(`이 태그를 삭제할까요?`)) tag.remove();
  });
});

/* ============ ADD SECTION ============ */
const addSectionBtn     = document.getElementById('addSectionBtn');
const addSectionModal   = document.getElementById('addSectionModal');
const newSectionTitle   = document.getElementById('newSectionTitle');
const newSectionContent = document.getElementById('newSectionContent');
const sectionCancel     = document.getElementById('sectionCancel');
const sectionOk         = document.getElementById('sectionOk');
const wikiArticle       = document.getElementById('wikiArticle');

addSectionBtn.addEventListener('click', () => {
  addSectionModal.classList.add('open'); newSectionTitle.value = ''; newSectionContent.value = ''; newSectionTitle.focus();
});
sectionCancel.addEventListener('click', () => addSectionModal.classList.remove('open'));
addSectionModal.addEventListener('click', e => { if (e.target === addSectionModal) addSectionModal.classList.remove('open'); });
sectionOk.addEventListener('click', () => {
  const title   = newSectionTitle.value.trim();
  const content = newSectionContent.value.trim();
  if (!title) { newSectionTitle.focus(); return; }
  const id = 'sec-custom-' + Date.now();
  const sec = document.createElement('section');
  sec.id = id;
  sec.className = 'wiki-section';
  sec.innerHTML = `
    <div class="section-title-row">
      <h2 class="section-heading editable-admin" contenteditable="true">${title}</h2>
      <div class="section-admin-tools admin-only">
        <button class="sec-tool-btn" data-action="move-up">↑</button>
        <button class="sec-tool-btn" data-action="move-down">↓</button>
        <button class="sec-tool-btn danger" data-action="delete">🗑</button>
      </div>
    </div>
    <div class="section-divider ${getDividerClass()}"></div>
    <p class="editable-admin" contenteditable="true">${content || '내용을 입력하세요.'}</p>`;
  const cats = document.querySelector('.wiki-categories');
  wikiArticle.insertBefore(sec, cats);
  addSectionToolEvents(sec);
  addSectionModal.classList.remove('open');
  updateToc();
  showToast('섹션이 추가되었습니다.');
});

function getDividerClass() {
  return `divider-${state.divider}`;
}

/* ============ SECTION TOOLS ============ */
function addSectionToolEvents(sec) {
  sec.querySelectorAll('.sec-tool-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const action = btn.dataset.action;
      if (action === 'delete') {
        if (confirm('이 섹션을 삭제할까요?')) { sec.remove(); updateToc(); }
      } else if (action === 'move-up') {
        const prev = sec.previousElementSibling;
        if (prev && prev.classList.contains('wiki-section')) {
          sec.parentNode.insertBefore(sec, prev);
          updateToc();
        }
      } else if (action === 'move-down') {
        const next = sec.nextElementSibling;
        if (next && next.classList.contains('wiki-section')) {
          sec.parentNode.insertBefore(next, sec);
          updateToc();
        }
      }
    });
  });
}

document.querySelectorAll('.wiki-section').forEach(sec => addSectionToolEvents(sec));

/* ============ TOC UPDATE ============ */
function updateToc() {
  const tocList = document.getElementById('tocList');
  tocList.innerHTML = '';
  document.querySelectorAll('.wiki-section').forEach((sec, i) => {
    const heading = sec.querySelector('.section-heading');
    if (!heading) return;
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#' + sec.id;
    a.textContent = (i+1) + '. ' + heading.textContent.trim();
    a.addEventListener('click', e => {
      e.preventDefault();
      sec.scrollIntoView({ behavior:'smooth', block:'start' });
    });
    li.appendChild(a);
    tocList.appendChild(li);
  });
}

/* ============ ABILITY BARS ============ */
const addAbilityBtn   = document.getElementById('addAbilityBtn');
const addAbilityModal = document.getElementById('addAbilityModal');
const newAbilityName  = document.getElementById('newAbilityName');
const newAbilityVal   = document.getElementById('newAbilityVal');
const abilityValDisplay = document.getElementById('abilityValDisplay');
const abilityCancel   = document.getElementById('abilityCancel');
const abilityOk       = document.getElementById('abilityOk');
const abilityBars     = document.getElementById('abilityBars');

newAbilityVal.addEventListener('input', () => { abilityValDisplay.textContent = newAbilityVal.value; });

addAbilityBtn.addEventListener('click', () => {
  addAbilityModal.classList.add('open'); newAbilityName.value = ''; newAbilityVal.value = 50; abilityValDisplay.textContent = '50'; newAbilityName.focus();
});
abilityCancel.addEventListener('click', () => addAbilityModal.classList.remove('open'));
addAbilityModal.addEventListener('click', e => { if (e.target === addAbilityModal) addAbilityModal.classList.remove('open'); });
abilityOk.addEventListener('click', () => {
  const name = newAbilityName.value.trim();
  const val  = newAbilityVal.value;
  if (!name) { newAbilityName.focus(); return; }
  addAbilityBar(name, parseInt(val), true);
  addAbilityModal.classList.remove('open');
});

function addAbilityBar(name, val, animate=false) {
  const item = document.createElement('div');
  item.className = 'ability-bar-item';
  item.innerHTML = `
    <div class="ability-bar-label">
      <span class="editable-admin" contenteditable="${isAdmin?'true':'false'}">${name}</span>
      <span class="ability-val">${val}</span>
    </div>
    <div class="bar-track"><div class="bar-fill" style="width:${val}%"></div></div>
    <button class="btn-del-ability admin-only ${isAdmin?'':'hidden'}" title="삭제">✕</button>`;
  item.querySelector('.btn-del-ability').addEventListener('click', () => {
    if (confirm('이 능력치를 삭제할까요?')) item.remove();
  });
  abilityBars.appendChild(item);
}

document.querySelectorAll('.btn-del-ability').forEach(btn => {
  btn.addEventListener('click', () => {
    if (confirm('이 능력치를 삭제할까요?')) btn.closest('.ability-bar-item').remove();
  });
});

/* ============ RELATIONS ============ */
const addRelationBtn = document.getElementById('addRelationBtn');
const relationCards  = document.getElementById('relationCards');
const EMOJIS = ['👤','👨','👩','👦','👧','🧑','👨‍👦','👩‍👧','🧙','⚔️','🌹','🔥','💀','🐉','🦊'];

addRelationBtn.addEventListener('click', () => {
  const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
  const card = document.createElement('div');
  card.className = 'relation-card';
  card.innerHTML = `
    <div class="relation-icon" title="클릭해서 이모지 변경" style="cursor:pointer;">${emoji}</div>
    <div class="relation-info">
      <div class="relation-name editable-admin" contenteditable="true">이름</div>
      <div class="relation-type editable-admin" contenteditable="true">관계</div>
      <div class="relation-desc editable-admin" contenteditable="true">설명을 입력하세요.</div>
    </div>
    <button class="btn-del-card admin-only" title="삭제">✕</button>`;
  card.querySelector('.relation-icon').addEventListener('click', () => {
    const cur = card.querySelector('.relation-icon').textContent;
    const idx = EMOJIS.indexOf(cur);
    card.querySelector('.relation-icon').textContent = EMOJIS[(idx+1) % EMOJIS.length];
  });
  card.querySelector('.btn-del-card').addEventListener('click', () => {
    if (confirm('이 인물을 삭제할까요?')) card.remove();
  });
  relationCards.appendChild(card);
  card.querySelector('.relation-name').focus();
});

document.querySelectorAll('.relation-card .btn-del-card').forEach(btn => {
  btn.addEventListener('click', () => {
    if (confirm('이 인물을 삭제할까요?')) btn.closest('.relation-card').remove();
  });
});

/* ============ TIMELINE ============ */
const addTimelineBtn = document.getElementById('addTimelineBtn');
const timelineList   = document.getElementById('timelineList');

addTimelineBtn.addEventListener('click', () => {
  const item = document.createElement('div');
  item.className = 'timeline-item';
  item.innerHTML = `
    <div class="timeline-dot"></div>
    <div class="timeline-content">
      <div class="timeline-date editable-admin" contenteditable="true">시기</div>
      <div class="timeline-text editable-admin" contenteditable="true">내용을 입력하세요.</div>
    </div>
    <button class="btn-del-card admin-only" title="삭제">✕</button>`;
  item.querySelector('.btn-del-card').addEventListener('click', () => {
    if (confirm('이 행적을 삭제할까요?')) item.remove();
  });
  timelineList.appendChild(item);
  item.querySelector('.timeline-date').focus();
});

document.querySelectorAll('.timeline-item .btn-del-card').forEach(btn => {
  btn.addEventListener('click', () => {
    if (confirm('이 행적을 삭제할까요?')) btn.closest('.timeline-item').remove();
  });
});

/* ============ QUOTES ============ */
const addQuoteBtn = document.getElementById('addQuoteBtn');
const quotesList  = document.getElementById('quotesList');

addQuoteBtn.addEventListener('click', () => {
  const item = document.createElement('div');
  item.className = 'quote-item';
  item.innerHTML = `
    <blockquote class="quote-text editable-admin" contenteditable="true">"어록을 입력하세요."</blockquote>
    <div class="quote-source editable-admin" contenteditable="true">— 출처</div>
    <button class="btn-del-card admin-only" title="삭제">✕</button>`;
  item.querySelector('.btn-del-card').addEventListener('click', () => {
    if (confirm('이 어록을 삭제할까요?')) item.remove();
  });
  quotesList.appendChild(item);
  item.querySelector('.quote-text').focus();
});

document.querySelectorAll('.quote-item .btn-del-card').forEach(btn => {
  btn.addEventListener('click', () => {
    if (confirm('이 어록을 삭제할까요?')) btn.closest('.quote-item').remove();
  });
});

/* ============ GALLERY ============ */
const galleryUpload = document.getElementById('galleryUpload');
const galleryGrid   = document.getElementById('galleryGrid');
const lightbox      = document.getElementById('lightbox');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev  = document.getElementById('lightboxPrev');
const lightboxNext  = document.getElementById('lightboxNext');
const lightboxImg   = document.getElementById('lightboxImg');
const lightboxCaption = document.getElementById('lightboxCaption');

galleryUpload.addEventListener('change', e => {
  const files = Array.from(e.target.files);
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = ev => addGalleryImage(ev.target.result, file.name);
    reader.readAsDataURL(file);
  });
});

function addGalleryImage(src, caption='') {
  // Remove placeholder if present
  const ph = galleryGrid.querySelector('.gallery-placeholder');
  if (ph) ph.remove();

  galleryImages.push({ src, caption });
  const idx = galleryImages.length - 1;

  const item = document.createElement('div');
  item.className = 'gallery-item';
  item.innerHTML = `<img src="${src}" alt="${caption}"/><button class="gallery-item-del admin-only" title="삭제">✕</button>`;
  item.querySelector('img').addEventListener('click', () => openLightbox(idx));
  item.querySelector('.gallery-item-del').addEventListener('click', e => {
    e.stopPropagation();
    if (confirm('이 이미지를 삭제할까요?')) {
      galleryImages.splice(idx, 1);
      item.remove();
      if (galleryGrid.children.length === 0) {
        galleryGrid.innerHTML = '<div class="gallery-placeholder"><span class="gallery-placeholder-icon">🖼️</span><span>이미지를 추가해 보세요</span></div>';
      }
    }
  });
  galleryGrid.appendChild(item);
}

function openLightbox(idx) {
  lightboxIdx = idx;
  lightboxImg.src = galleryImages[idx].src;
  lightboxCaption.textContent = galleryImages[idx].caption || '';
  lightbox.classList.add('open');
}
lightboxClose.addEventListener('click', () => lightbox.classList.remove('open'));
lightbox.addEventListener('click', e => { if (e.target === lightbox) lightbox.classList.remove('open'); });
lightboxPrev.addEventListener('click', e => {
  e.stopPropagation();
  if (galleryImages.length === 0) return;
  lightboxIdx = (lightboxIdx - 1 + galleryImages.length) % galleryImages.length;
  openLightbox(lightboxIdx);
});
lightboxNext.addEventListener('click', e => {
  e.stopPropagation();
  if (galleryImages.length === 0) return;
  lightboxIdx = (lightboxIdx + 1) % galleryImages.length;
  openLightbox(lightboxIdx);
});
document.addEventListener('keydown', e => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'ArrowLeft') lightboxPrev.click();
  if (e.key === 'ArrowRight') lightboxNext.click();
  if (e.key === 'Escape') lightbox.classList.remove('open');
});

/* ============ YOUTUBE ============ */
const addYoutubeBtn   = document.getElementById('addYoutubeBtn');
const addYoutubeModal = document.getElementById('addYoutubeModal');
const youtubeUrl      = document.getElementById('youtubeUrl');
const youtubeTitle    = document.getElementById('youtubeTitle');
const youtubeCancel   = document.getElementById('youtubeCancel');
const youtubeOk       = document.getElementById('youtubeOk');
const mediaGrid       = document.getElementById('mediaGrid');

addYoutubeBtn.addEventListener('click', () => {
  addYoutubeModal.classList.add('open'); youtubeUrl.value = ''; youtubeTitle.value = ''; youtubeUrl.focus();
});
youtubeCancel.addEventListener('click', () => addYoutubeModal.classList.remove('open'));
addYoutubeModal.addEventListener('click', e => { if (e.target === addYoutubeModal) addYoutubeModal.classList.remove('open'); });
youtubeOk.addEventListener('click', () => {
  const url   = youtubeUrl.value.trim();
  const title = youtubeTitle.value.trim();
  const vid   = extractYoutubeId(url);
  if (!vid) { showToast('❌ 올바른 YouTube URL을 입력하세요.'); return; }
  addYoutubeEmbed(vid, title);
  addYoutubeModal.classList.remove('open');
});

function extractYoutubeId(url) {
  try {
    const u = new URL(url.startsWith('http') ? url : 'https://' + url);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('?')[0];
    if (u.searchParams.get('v')) return u.searchParams.get('v');
    const match = url.match(/(?:embed\/|v=|youtu\.be\/)([\w-]{11})/);
    return match ? match[1] : null;
  } catch { return null; }
}

function addYoutubeEmbed(vid, title) {
  const ph = mediaGrid.querySelector('.gallery-placeholder');
  if (ph) ph.remove();
  const item = document.createElement('div');
  item.className = 'media-item';
  item.innerHTML = `
    <iframe src="https://www.youtube.com/embed/${vid}" allowfullscreen loading="lazy" title="${title||'YouTube'}"></iframe>
    ${title ? `<div class="media-item-title">${title}</div>` : ''}
    <button class="media-item-del admin-only" title="삭제">✕</button>`;
  item.querySelector('.media-item-del').addEventListener('click', () => {
    if (confirm('이 영상을 삭제할까요?')) {
      item.remove();
      if (mediaGrid.children.length === 0) {
        mediaGrid.innerHTML = '<div class="gallery-placeholder"><span class="gallery-placeholder-icon">▶️</span><span>YouTube 영상을 추가해 보세요</span></div>';
      }
    }
  });
  mediaGrid.appendChild(item);
  showToast('▶️ 영상이 추가되었습니다.');
}

/* ============ EXTERNAL LINKS ============ */
const addLinkBtn   = document.getElementById('addLinkBtn');
const addLinkModal = document.getElementById('addLinkModal');
const newLinkIcon  = document.getElementById('newLinkIcon');
const newLinkLabel = document.getElementById('newLinkLabel');
const newLinkUrl   = document.getElementById('newLinkUrl');
const linkCancel   = document.getElementById('linkCancel');
const linkOk       = document.getElementById('linkOk');
const linksList    = document.getElementById('linksList');

addLinkBtn.addEventListener('click', () => {
  addLinkModal.classList.add('open'); newLinkIcon.value='🔗'; newLinkLabel.value=''; newLinkUrl.value=''; newLinkLabel.focus();
});
linkCancel.addEventListener('click', () => addLinkModal.classList.remove('open'));
addLinkModal.addEventListener('click', e => { if (e.target === addLinkModal) addLinkModal.classList.remove('open'); });
linkOk.addEventListener('click', () => {
  const icon  = newLinkIcon.value.trim() || '🔗';
  const label = newLinkLabel.value.trim();
  const url   = newLinkUrl.value.trim();
  if (!label) { newLinkLabel.focus(); return; }
  const link = document.createElement('a');
  link.className = 'link-item';
  link.href = url || '#';
  if (url) link.target = '_blank';
  link.innerHTML = `
    <span class="link-icon">${icon}</span>
    <span class="link-label">${label}</span>
    <span class="link-url">${url || ''}</span>
    <button class="btn-del-card admin-only" title="삭제">✕</button>`;
  link.querySelector('.btn-del-card').addEventListener('click', e => {
    e.preventDefault(); e.stopPropagation();
    if (confirm('이 링크를 삭제할까요?')) link.remove();
  });
  linksList.appendChild(link);
  addLinkModal.classList.remove('open');
});

document.querySelectorAll('.link-item .btn-del-card').forEach(btn => {
  btn.addEventListener('click', e => {
    e.preventDefault(); e.stopPropagation();
    if (confirm('이 링크를 삭제할까요?')) btn.closest('.link-item').remove();
  });
});

/* ============ EXPORT / IMPORT ============ */
document.getElementById('exportBtn').addEventListener('click', exportJson);
document.getElementById('exportJsonBtn').addEventListener('click', exportJson);
function exportJson() {
  const data = { state, content: document.getElementById('wikiArticle').innerHTML };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'charawiki-data.json';
  a.click();
  showToast('📥 JSON이 다운로드되었습니다.');
}

const importJsonBtn   = document.getElementById('importJsonBtn');
const importJsonInput = document.getElementById('importJsonInput');
importJsonBtn.addEventListener('click', () => importJsonInput.click());
importJsonInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (data.content) document.getElementById('wikiArticle').innerHTML = data.content;
      if (data.state) {
        Object.assign(state, data.state);
        applyTheme(state.theme);
        applyFont(state.font);
        applyPattern(state.pattern);
        applyBorder(state.border);
        applyDivider(state.divider);
        applyAccent(state.accent);
        if (state.textColor) { document.documentElement.style.setProperty('--text', state.textColor); body.style.setProperty('--text', state.textColor); }
        if (state.fontSize) { document.documentElement.style.fontSize = state.fontSize + 'px'; fontSizeRange.value = state.fontSize; fontSizeVal.textContent = state.fontSize + 'px'; }
        applyCard(state.card || 'flat');
        applyAnim(state.anim || 'normal');
        applyCursor(state.cursor || 'default');
        applyInfoPos(state.infoPos || 'right');
        if (state.bgImg) applyBgImage(state.bgImg, state.bgOpacity || 40);
      }
      showToast('✅ JSON이 불러와졌습니다.');
    } catch { showToast('❌ JSON 파싱 오류'); }
  };
  reader.readAsText(file);
});

/* ============ COPY URL ============ */
document.getElementById('copyUrlBtn').addEventListener('click', () => {
  navigator.clipboard.writeText(location.href).then(() => showToast('🔗 URL이 복사되었습니다.'));
});

/* ============ PRINT ============ */
function doPrint() { window.print(); }
document.getElementById('printBtn').addEventListener('click', doPrint);
document.getElementById('printBtn2').addEventListener('click', doPrint);

/* ============ LAST MODIFIED ============ */
const lastModified = document.getElementById('lastModified');
if (lastModified) {
  const now = new Date();
  lastModified.textContent = now.toLocaleDateString('ko-KR', { year:'numeric', month:'long', day:'numeric' });
}

/* ============ TOC SMOOTH SCROLL ============ */
document.querySelectorAll('.toc-list a').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior:'smooth', block:'start' }); }
  });
});

/* ============ SAVE / LOAD STATE ============ */
function saveState() {
  try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch(e) {}
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STATE_KEY));
    if (!saved) return;
    if (saved.theme)     { applyTheme(saved.theme); document.querySelectorAll('.theme-btn').forEach(b => b.classList.toggle('active', b.dataset.theme===saved.theme)); }
    if (saved.font)      { applyFont(saved.font); document.querySelectorAll('[data-font]').forEach(b => b.classList.toggle('active', b.dataset.font===saved.font)); }
    if (saved.pattern)   { applyPattern(saved.pattern); document.querySelectorAll('[data-pattern]').forEach(b => b.classList.toggle('active', b.dataset.pattern===saved.pattern)); }
    if (saved.border)    { applyBorder(saved.border); document.querySelectorAll('[data-border]').forEach(b => b.classList.toggle('active', b.dataset.border===saved.border)); }
    if (saved.divider)   { applyDivider(saved.divider); document.querySelectorAll('[data-divider]').forEach(b => b.classList.toggle('active', b.dataset.divider===saved.divider)); }
    if (saved.card)      { applyCard(saved.card); document.querySelectorAll('[data-card]').forEach(b => b.classList.toggle('active', b.dataset.card===saved.card)); }
    if (saved.anim)      { applyAnim(saved.anim); document.querySelectorAll('[data-anim]').forEach(b => b.classList.toggle('active', b.dataset.anim===saved.anim)); }
    if (saved.cursor)    { applyCursor(saved.cursor); document.querySelectorAll('[data-cursor]').forEach(b => b.classList.toggle('active', b.dataset.cursor===saved.cursor)); }
    if (saved.infoPos)   { applyInfoPos(saved.infoPos); document.querySelectorAll('[data-infopos]').forEach(b => b.classList.toggle('active', b.dataset.infopos===saved.infoPos)); }
    if (saved.accent)    { applyAccent(saved.accent); customColorInput.value = saved.accent; }
    if (saved.textColor) { document.documentElement.style.setProperty('--text', saved.textColor); body.style.setProperty('--text', saved.textColor); customTextColor.value = saved.textColor; }
    if (saved.fontSize)  { document.documentElement.style.fontSize = saved.fontSize + 'px'; fontSizeRange.value = saved.fontSize; fontSizeVal.textContent = saved.fontSize + 'px'; }
    if (saved.bgImg)     { applyBgImage(saved.bgImg, saved.bgOpacity || 40); bgOpacityRange.value = saved.bgOpacity || 40; bgOpacityVal.textContent = (saved.bgOpacity || 40) + '%'; }
    Object.assign(state, saved);
  } catch(e) {}
}

/* ============ INIT ============ */
loadState();
updateToc();
