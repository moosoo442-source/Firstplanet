/* ============================================
   CharaWiki — script.js
   테마 전환 / 꾸미기 / 인터랙션 로직
============================================ */

// ============ STATE ============
const state = {
  theme: 'default',
  font: 'gothic',
  pattern: 'none',
  border: 'solid',
  divider: 'solid',
  accent: '#3366cc',
  fontSize: 15,
};

// ============ ELEMENTS ============
const body = document.body;
const themeBtn = document.getElementById('themeToggleBtn');
const decorBtn = document.getElementById('decorToggleBtn');
const themePanel = document.getElementById('themePanel');
const decorPanel = document.getElementById('decorPanel');
const themeClose = document.getElementById('themeClose');
const decorClose = document.getElementById('decorClose');
const overlay = document.getElementById('panelOverlay');

// ============ PANEL LOGIC ============
let activePanel = null;

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

themeBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  activePanel === themePanel ? closePanel(themePanel) : openPanel(themePanel);
});

decorBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  activePanel === decorPanel ? closePanel(decorPanel) : openPanel(decorPanel);
});

themeClose.addEventListener('click', () => closePanel(themePanel));
decorClose.addEventListener('click', () => closePanel(decorPanel));
overlay.addEventListener('click', () => closePanel(activePanel));

// ============ THEME SWITCHING ============
const THEMES = ['default', 'dark', 'sakura', 'ocean', 'forest', 'galaxy'];

document.querySelectorAll('.theme-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const theme = btn.dataset.theme;
    applyTheme(theme);
    document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

function applyTheme(theme) {
  THEMES.forEach(t => body.classList.remove(`theme-${t}`));
  body.classList.add(`theme-${theme}`);
  state.theme = theme;
  saveState();
}

// ============ FONT ============
document.querySelectorAll('[data-font]').forEach(btn => {
  btn.addEventListener('click', () => {
    applyFont(btn.dataset.font);
    document.querySelectorAll('[data-font]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

function applyFont(font) {
  ['gothic', 'serif', 'handwriting'].forEach(f => body.classList.remove(`font-${f}`));
  body.classList.add(`font-${font}`);
  state.font = font;
  saveState();
}

// ============ BACKGROUND PATTERN ============
document.querySelectorAll('[data-pattern]').forEach(btn => {
  btn.addEventListener('click', () => {
    applyPattern(btn.dataset.pattern);
    document.querySelectorAll('[data-pattern]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

function applyPattern(pattern) {
  ['none', 'grid', 'dot', 'diagonal'].forEach(p => body.classList.remove(`pattern-${p}`));
  body.classList.add(`pattern-${pattern}`);
  state.pattern = pattern;
  saveState();
}

// ============ INFOBOX BORDER ============
const infobox = document.getElementById('infobox');

document.querySelectorAll('[data-border]').forEach(btn => {
  btn.addEventListener('click', () => {
    applyBorder(btn.dataset.border);
    document.querySelectorAll('[data-border]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

function applyBorder(border) {
  ['solid', 'dashed', 'double', 'shadow'].forEach(b => infobox.classList.remove(`border-${b}`));
  infobox.classList.add(`border-${border}`);
  state.border = border;
  saveState();
}

// ============ SECTION DIVIDERS ============
document.querySelectorAll('[data-divider]').forEach(btn => {
  btn.addEventListener('click', () => {
    applyDivider(btn.dataset.divider);
    document.querySelectorAll('[data-divider]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

function applyDivider(divider) {
  document.querySelectorAll('.section-divider').forEach(el => {
    ['solid', 'dashed', 'gradient', 'double'].forEach(d => el.classList.remove(`divider-${d}`));
    el.classList.add(`divider-${divider}`);
  });
  state.divider = divider;
  saveState();
}

// ============ ACCENT COLOR ============
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
  // Also update per-theme custom accent
  body.style.setProperty('--accent', color);
  body.style.setProperty('--text-link', color);
  body.style.setProperty('--quote-border', color);
  body.style.setProperty('--tag-color', color);
  state.accent = color;
  saveState();
}

// ============ FONT SIZE ============
const fontSizeRange = document.getElementById('fontSizeRange');
const fontSizeVal = document.getElementById('fontSizeVal');

fontSizeRange.addEventListener('input', () => {
  const size = fontSizeRange.value;
  document.documentElement.style.setProperty('--font-size-base', `${size}px`);
  document.documentElement.style.fontSize = `${size}px`;
  fontSizeVal.textContent = `${size}px`;
  state.fontSize = parseInt(size);
  saveState();
});

// ============ RESET DECOR ============
document.getElementById('resetDecor').addEventListener('click', () => {
  if (!confirm('꾸미기 설정을 초기화할까요?')) return;

  applyFont('gothic');
  applyPattern('none');
  applyBorder('solid');
  applyDivider('solid');

  document.documentElement.style.removeProperty('--font-size-base');
  document.documentElement.style.removeProperty('font-size');
  fontSizeRange.value = 15;
  fontSizeVal.textContent = '15px';

  body.style.removeProperty('--accent');
  body.style.removeProperty('--text-link');
  body.style.removeProperty('--quote-border');
  body.style.removeProperty('--tag-color');
  customColorInput.value = '#3366cc';

  document.querySelectorAll('[data-font]').forEach(b => b.classList.toggle('active', b.dataset.font === 'gothic'));
  document.querySelectorAll('[data-pattern]').forEach(b => b.classList.toggle('active', b.dataset.pattern === 'none'));
  document.querySelectorAll('[data-border]').forEach(b => b.classList.toggle('active', b.dataset.border === 'solid'));
  document.querySelectorAll('[data-divider]').forEach(b => b.classList.toggle('active', b.dataset.divider === 'solid'));
  document.querySelectorAll('.color-dot').forEach((d, i) => d.classList.toggle('active', i === 0));

  state.font = 'gothic';
  state.pattern = 'none';
  state.border = 'solid';
  state.divider = 'solid';
  state.accent = '#3366cc';
  state.fontSize = 15;
  saveState();
});

// ============ IMAGE UPLOAD ============
const imgUpload = document.getElementById('imgUpload');
const imgPlaceholder = document.getElementById('imgPlaceholder');
const charImg = document.getElementById('charImg');

document.querySelector('.infobox-img-wrap').addEventListener('click', () => imgUpload.click());
imgUpload.addEventListener('click', e => e.stopPropagation());

imgUpload.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    charImg.src = ev.target.result;
    charImg.classList.remove('hidden');
    imgPlaceholder.style.display = 'none';
  };
  reader.readAsDataURL(file);
});

// ============ ADD INFOBOX ROW (MODAL) ============
const addRowBtn = document.getElementById('addRowBtn');
const addRowModal = document.getElementById('addRowModal');
const modalCancel = document.getElementById('modalCancel');
const modalOk = document.getElementById('modalOk');
const newRowKey = document.getElementById('newRowKey');
const newRowVal = document.getElementById('newRowVal');
const infoTableBody = document.getElementById('infoTableBody');

addRowBtn.addEventListener('click', () => {
  addRowModal.classList.add('open');
  newRowKey.focus();
});

modalCancel.addEventListener('click', closeModal);
addRowModal.addEventListener('click', (e) => { if (e.target === addRowModal) closeModal(); });

function closeModal() {
  addRowModal.classList.remove('open');
  newRowKey.value = '';
  newRowVal.value = '';
}

modalOk.addEventListener('click', () => {
  const key = newRowKey.value.trim();
  const val = newRowVal.value.trim();
  if (!key) { newRowKey.focus(); return; }
  const tr = document.createElement('tr');
  tr.innerHTML = `<th>${key}</th><td contenteditable="true">${val || '-'}</td>`;
  infoTableBody.appendChild(tr);
  closeModal();
});

newRowVal.addEventListener('keydown', (e) => { if (e.key === 'Enter') modalOk.click(); });

// ============ ADD RELATION ============
document.getElementById('addRelationBtn').addEventListener('click', () => {
  const card = document.createElement('div');
  card.className = 'relation-card';
  card.innerHTML = `
    <div class="relation-icon" contenteditable="true">👤</div>
    <div class="relation-info">
      <div class="relation-name" contenteditable="true">이름</div>
      <div class="relation-type" contenteditable="true">관계</div>
      <div class="relation-desc" contenteditable="true">설명을 입력하세요.</div>
    </div>`;
  document.getElementById('relationCards').appendChild(card);
  card.querySelector('.relation-name').focus();
});

// ============ ADD QUOTE ============
document.getElementById('addQuoteBtn').addEventListener('click', () => {
  const item = document.createElement('div');
  item.className = 'quote-item';
  item.innerHTML = `
    <blockquote class="quote-text" contenteditable="true">"어록을 입력하세요."</blockquote>
    <div class="quote-source" contenteditable="true">— 출처</div>`;
  document.getElementById('quotesList').appendChild(item);
  item.querySelector('.quote-text').focus();
});

// ============ ADD TIMELINE ============
document.getElementById('addTimelineBtn').addEventListener('click', function() {
  const item = document.createElement('div');
  item.className = 'timeline-item';
  item.innerHTML = `
    <div class="timeline-dot"></div>
    <div class="timeline-content">
      <div class="timeline-date" contenteditable="true">시기</div>
      <div class="timeline-text" contenteditable="true">내용을 입력하세요.</div>
    </div>`;
  this.parentNode.insertBefore(item, this);
  item.querySelector('.timeline-date').focus();
});

// ============ LAST MODIFIED ============
const lastModified = document.getElementById('lastModified');
if (lastModified) {
  const now = new Date();
  lastModified.textContent = now.toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

// ============ SAVE/LOAD STATE (localStorage) ============
function saveState() {
  try { localStorage.setItem('charawiki-state', JSON.stringify(state)); } catch(e) {}
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem('charawiki-state'));
    if (!saved) return;

    // Theme
    if (saved.theme) {
      applyTheme(saved.theme);
      document.querySelectorAll('.theme-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.theme === saved.theme);
      });
    }
    // Font
    if (saved.font) {
      applyFont(saved.font);
      document.querySelectorAll('[data-font]').forEach(b => b.classList.toggle('active', b.dataset.font === saved.font));
    }
    // Pattern
    if (saved.pattern) {
      applyPattern(saved.pattern);
      document.querySelectorAll('[data-pattern]').forEach(b => b.classList.toggle('active', b.dataset.pattern === saved.pattern));
    }
    // Border
    if (saved.border) {
      applyBorder(saved.border);
      document.querySelectorAll('[data-border]').forEach(b => b.classList.toggle('active', b.dataset.border === saved.border));
    }
    // Divider
    if (saved.divider) {
      applyDivider(saved.divider);
      document.querySelectorAll('[data-divider]').forEach(b => b.classList.toggle('active', b.dataset.divider === saved.divider));
    }
    // Accent
    if (saved.accent) {
      applyAccent(saved.accent);
      customColorInput.value = saved.accent;
    }
    // Font size
    if (saved.fontSize) {
      document.documentElement.style.fontSize = `${saved.fontSize}px`;
      fontSizeRange.value = saved.fontSize;
      fontSizeVal.textContent = `${saved.fontSize}px`;
    }
  } catch(e) {}
}

// ============ SMOOTH TOC SCROLL ============
document.querySelectorAll('.toc-list a').forEach(link => {
  link.addEventListener('click', (e) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ============ INIT ============
loadState();
