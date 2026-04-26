/* ============================================
   CharaWiki v2.0 — script.js
   더 많은 테마 / 꾸미기 / 미디어 / 편집 기능
============================================ */

const STORAGE_KEY = 'charawiki-state-v2';
const CONTENT_KEY = 'charawiki-content-v2';

// ============ STATE ============
const state = {
  theme: 'default',
  font: 'gothic',
  pattern: 'none',
  border: 'solid',
  divider: 'solid',
  accent: '#3366cc',
  fontSize: 15,
  cursor: 'default',
  anim: 'medium',
  bgImage: '',
  bgOpacity: 30,
  textColor: '',
  linkColor: '',
  infoboxHeader: '',
  cardStyle: false,
  infoPos: 'right',
  cols: '1',
  stickyToc: false,
  autoDark: false,
  imgFilter: 'none',
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const body = document.body;

// ============ TOAST ============
const toast = $('#toast');
let toastTimer = null;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
}

// ============ PANELS ============
let activePanel = null;
const overlay = $('#panelOverlay');

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
function togglePanel(panel) {
  activePanel === panel ? closePanel(panel) : openPanel(panel);
}

$('#themeToggleBtn').addEventListener('click', e => { e.stopPropagation(); togglePanel($('#themePanel')); });
$('#decorToggleBtn').addEventListener('click', e => { e.stopPropagation(); togglePanel($('#decorPanel')); });
$('#layoutToggleBtn').addEventListener('click', e => { e.stopPropagation(); togglePanel($('#layoutPanel')); });
$('#dataToggleBtn').addEventListener('click', e => { e.stopPropagation(); togglePanel($('#dataPanel')); });
$$('.panel-close').forEach(btn => btn.addEventListener('click', () => closePanel($('#' + btn.dataset.close))));
overlay.addEventListener('click', () => closePanel(activePanel));

// ============ THEME ============
const THEMES = ['default', 'dark', 'sakura', 'ocean', 'forest', 'galaxy', 'retro', 'halloween', 'christmas'];
$$('.theme-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    applyTheme(btn.dataset.theme);
    $$('.theme-btn').forEach(b => b.classList.toggle('active', b === btn));
    saveState();
  });
});
function applyTheme(theme) {
  THEMES.forEach(t => body.classList.remove(`theme-${t}`));
  body.classList.add(`theme-${theme}`);
  state.theme = theme;
}

// ============ FONT ============
const FONTS = ['gothic', 'serif', 'handwriting', 'cute', 'bold', 'pen'];
$$('[data-font]').forEach(btn => {
  btn.addEventListener('click', () => {
    applyFont(btn.dataset.font);
    $$('[data-font]').forEach(b => b.classList.toggle('active', b === btn));
    saveState();
  });
});
function applyFont(font) {
  FONTS.forEach(f => body.classList.remove(`font-${f}`));
  body.classList.add(`font-${font}`);
  state.font = font;
}

// ============ PATTERN ============
const PATTERNS = ['none', 'grid', 'dot', 'diagonal', 'paper', 'hearts', 'stars'];
$$('[data-pattern]').forEach(btn => {
  btn.addEventListener('click', () => {
    applyPattern(btn.dataset.pattern);
    $$('[data-pattern]').forEach(b => b.classList.toggle('active', b === btn));
    saveState();
  });
});
function applyPattern(pattern) {
  PATTERNS.forEach(p => body.classList.remove(`pattern-${p}`));
  body.classList.add(`pattern-${pattern}`);
  state.pattern = pattern;
}

// ============ BG IMAGE ============
$('#bgImageUpload').addEventListener('change', e => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    state.bgImage = ev.target.result;
    applyBgImage();
    saveState();
    showToast('배경 이미지가 적용되었어요');
  };
  reader.readAsDataURL(file);
});
$('#bgImageRemove').addEventListener('click', () => {
  state.bgImage = '';
  applyBgImage();
  saveState();
  showToast('배경 이미지가 제거되었어요');
});
$('#bgOpacityRange').addEventListener('input', e => {
  state.bgOpacity = +e.target.value;
  $('#bgOpacityVal').textContent = state.bgOpacity + '%';
  document.documentElement.style.setProperty('--bg-image-opacity', state.bgOpacity / 100);
  saveState();
});
function applyBgImage() {
  if (state.bgImage) {
    body.classList.add('has-bg-image');
    document.documentElement.style.setProperty('--bg-image', `url(${state.bgImage})`);
  } else {
    body.classList.remove('has-bg-image');
    document.documentElement.style.setProperty('--bg-image', 'none');
  }
}

// ============ CURSOR ============
const CURSOR_EMOJIS = { star: '⭐', heart: '💗', sparkle: '✨', leaf: '🍃' };
const customCursor = $('#customCursor');
$$('[data-cursor]').forEach(btn => {
  btn.addEventListener('click', () => {
    applyCursor(btn.dataset.cursor);
    $$('[data-cursor]').forEach(b => b.classList.toggle('active', b === btn));
    saveState();
  });
});
function applyCursor(cursor) {
  body.classList.toggle('cursor-default', cursor === 'default');
  state.cursor = cursor;
  if (cursor === 'default') {
    customCursor.classList.add('hidden');
  } else {
    customCursor.classList.remove('hidden');
    customCursor.textContent = CURSOR_EMOJIS[cursor] || '';
  }
}
document.addEventListener('mousemove', e => {
  if (state.cursor !== 'default') {
    customCursor.style.left = e.clientX + 'px';
    customCursor.style.top = e.clientY + 'px';
  }
});

// ============ INFOBOX BORDER ============
const infobox = $('#infobox');
const BORDERS = ['solid', 'dashed', 'double', 'shadow', 'rounded', 'glow'];
$$('[data-border]').forEach(btn => {
  btn.addEventListener('click', () => {
    applyBorder(btn.dataset.border);
    $$('[data-border]').forEach(b => b.classList.toggle('active', b === btn));
    saveState();
  });
});
function applyBorder(border) {
  BORDERS.forEach(b => infobox.classList.remove(`border-${b}`));
  infobox.classList.add(`border-${border}`);
  state.border = border;
}

// ============ INFOBOX HEADER COLOR ============
$('#infoboxHeaderColor').addEventListener('input', e => {
  state.infoboxHeader = e.target.value;
  applyInfoboxHeader();
  saveState();
});
function applyInfoboxHeader() {
  if (state.infoboxHeader) {
    document.documentElement.style.setProperty('--bg-infobox-header', state.infoboxHeader);
  } else {
    document.documentElement.style.removeProperty('--bg-infobox-header');
  }
}

// ============ DIVIDER ============
const DIVIDERS = ['solid', 'dashed', 'gradient', 'double', 'wave'];
$$('[data-divider]').forEach(btn => {
  btn.addEventListener('click', () => {
    applyDivider(btn.dataset.divider);
    $$('[data-divider]').forEach(b => b.classList.toggle('active', b === btn));
    saveState();
  });
});
function applyDivider(divider) {
  $$('.section-divider').forEach(el => {
    DIVIDERS.forEach(d => el.classList.remove(`divider-${d}`));
    el.classList.add(`divider-${divider}`);
  });
  state.divider = divider;
}

// ============ ACCENT ============
$$('.color-dot').forEach(dot => {
  dot.addEventListener('click', () => {
    applyAccent(dot.dataset.color);
    $$('.color-dot').forEach(d => d.classList.toggle('active', d === dot));
    $('#customColor').value = dot.dataset.color;
    saveState();
  });
});
$('#customColor').addEventListener('input', e => {
  applyAccent(e.target.value);
  $$('.color-dot').forEach(d => d.classList.remove('active'));
  saveState();
});
function applyAccent(color) {
  document.documentElement.style.setProperty('--accent', color);
  body.style.setProperty('--accent', color);
  body.style.setProperty('--quote-border', color);
  body.style.setProperty('--tag-color', color);
  state.accent = color;
}

// ============ TEXT/LINK COLOR ============
$('#textColor').addEventListener('input', e => {
  state.textColor = e.target.value;
  applyTextColor();
  saveState();
});
$('#textColorReset').addEventListener('click', () => {
  state.textColor = '';
  $('#textColor').value = '#202122';
  applyTextColor();
  saveState();
});
function applyTextColor() {
  if (state.textColor) body.style.setProperty('--text', state.textColor);
  else body.style.removeProperty('--text');
}

$('#linkColor').addEventListener('input', e => {
  state.linkColor = e.target.value;
  applyLinkColor();
  saveState();
});
$('#linkColorReset').addEventListener('click', () => {
  state.linkColor = '';
  $('#linkColor').value = state.accent || '#3366cc';
  applyLinkColor();
  saveState();
});
function applyLinkColor() {
  if (state.linkColor) body.style.setProperty('--text-link', state.linkColor);
  else body.style.removeProperty('--text-link');
}

// ============ FONT SIZE ============
$('#fontSizeRange').addEventListener('input', e => {
  state.fontSize = +e.target.value;
  document.documentElement.style.fontSize = state.fontSize + 'px';
  $('#fontSizeVal').textContent = state.fontSize + 'px';
  saveState();
});

// ============ ANIMATIONS ============
const ANIMS = ['none', 'medium', 'strong'];
$$('[data-anim]').forEach(btn => {
  btn.addEventListener('click', () => {
    applyAnim(btn.dataset.anim);
    $$('[data-anim]').forEach(b => b.classList.toggle('active', b === btn));
    saveState();
  });
});
function applyAnim(anim) {
  ANIMS.forEach(a => body.classList.remove(`anim-${a}`));
  body.classList.add(`anim-${anim}`);
  state.anim = anim;
}

// ============ CARD STYLE ============
$('#cardStyleToggle').addEventListener('change', e => {
  state.cardStyle = e.target.checked;
  body.classList.toggle('card-style', state.cardStyle);
  saveState();
});

// ============ LAYOUT ============
const wikiBody = $('#wikiBody');
const article = $('#article');
const toc = $('#toc');
$$('[data-infopos]').forEach(btn => {
  btn.addEventListener('click', () => {
    applyInfoPos(btn.dataset.infopos);
    $$('[data-infopos]').forEach(b => b.classList.toggle('active', b === btn));
    saveState();
  });
});
function applyInfoPos(pos) {
  wikiBody.classList.remove('infopos-right', 'infopos-left', 'infopos-top');
  wikiBody.classList.add(`infopos-${pos}`);
  if (pos === 'top') {
    wikiBody.style.flexDirection = 'column';
    const articleEl = $('.article');
    wikiBody.insertBefore(infobox, articleEl);
  }
  state.infoPos = pos;
}

$$('[data-cols]').forEach(btn => {
  btn.addEventListener('click', () => {
    applyCols(btn.dataset.cols);
    $$('[data-cols]').forEach(b => b.classList.toggle('active', b === btn));
    saveState();
  });
});
function applyCols(c) {
  article.classList.toggle('cols-2', c === '2');
  state.cols = c;
}

$('#stickyTocToggle').addEventListener('change', e => {
  state.stickyToc = e.target.checked;
  toc.classList.toggle('sticky-toc', state.stickyToc);
  saveState();
});

$('#autoDarkToggle').addEventListener('change', e => {
  state.autoDark = e.target.checked;
  applyAutoDark();
  saveState();
});
function applyAutoDark() {
  if (state.autoDark && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    applyTheme('dark');
    $$('.theme-btn').forEach(b => b.classList.toggle('active', b.dataset.theme === 'dark'));
  }
}

// ============ RESET DECOR ============
$('#resetDecor').addEventListener('click', () => {
  if (!confirm('꾸미기 설정을 초기화할까요? (내용은 유지됩니다)')) return;
  applyFont('gothic'); applyPattern('none'); applyBorder('solid'); applyDivider('solid');
  applyAnim('medium'); applyCursor('default');
  state.bgImage = ''; state.bgOpacity = 30; state.textColor = '';
  state.linkColor = ''; state.infoboxHeader = ''; state.cardStyle = false;
  applyBgImage(); applyTextColor(); applyLinkColor(); applyInfoboxHeader();
  body.classList.remove('card-style');
  document.documentElement.style.removeProperty('font-size');
  $('#fontSizeRange').value = 15; $('#fontSizeVal').textContent = '15px';
  $('#bgOpacityRange').value = 30; $('#bgOpacityVal').textContent = '30%';
  body.style.removeProperty('--accent');
  body.style.removeProperty('--quote-border');
  body.style.removeProperty('--tag-color');
  document.documentElement.style.removeProperty('--accent');
  $('#customColor').value = '#3366cc';
  $('#infoboxHeaderColor').value = '#cee0f2';
  $('#textColor').value = '#202122';
  $('#linkColor').value = '#3366cc';
  $('#cardStyleToggle').checked = false;
  $$('[data-font]').forEach(b => b.classList.toggle('active', b.dataset.font === 'gothic'));
  $$('[data-pattern]').forEach(b => b.classList.toggle('active', b.dataset.pattern === 'none'));
  $$('[data-border]').forEach(b => b.classList.toggle('active', b.dataset.border === 'solid'));
  $$('[data-divider]').forEach(b => b.classList.toggle('active', b.dataset.divider === 'solid'));
  $$('[data-anim]').forEach(b => b.classList.toggle('active', b.dataset.anim === 'medium'));
  $$('[data-cursor]').forEach(b => b.classList.toggle('active', b.dataset.cursor === 'default'));
  $$('.color-dot').forEach((d, i) => d.classList.toggle('active', i === 0));
  state.font = 'gothic'; state.pattern = 'none'; state.border = 'solid';
  state.divider = 'solid'; state.accent = '#3366cc'; state.fontSize = 15;
  state.anim = 'medium'; state.cursor = 'default';
  saveState();
  showToast('꾸미기 초기화 완료');
});

// ============ IMAGE UPLOAD ============
const imgUpload = $('#imgUpload');
const imgPlaceholder = $('#imgPlaceholder');
const charImg = $('#charImg');
const imgWrap = $('.infobox-img-wrap');

imgWrap.addEventListener('click', e => {
  if (e.target.classList.contains('img-filter-btn')) return;
  imgUpload.click();
});
imgUpload.addEventListener('change', e => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    charImg.src = ev.target.result;
    charImg.classList.remove('hidden');
    imgPlaceholder.style.display = 'none';
    imgWrap.classList.add('has-img');
    saveContent();
  };
  reader.readAsDataURL(file);
});

const FILTERS = ['none', 'sepia', 'grayscale', 'bright', 'vintage', 'warm'];
$$('.img-filter-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const f = btn.dataset.filter;
    FILTERS.forEach(x => charImg.classList.remove(`filter-${x}`));
    if (f !== 'none') charImg.classList.add(`filter-${f}`);
    $$('.img-filter-btn').forEach(b => b.classList.toggle('active', b === btn));
    state.imgFilter = f;
    saveState();
  });
});

// ============ INFOBOX ROWS ============
const infoTableBody = $('#infoTableBody');
const addRowModal = $('#addRowModal');

$('#addRowBtn').addEventListener('click', () => openModal('addRowModal'));
$('#addSectionHeaderBtn').addEventListener('click', () => {
  const name = prompt('섹션 헤더 이름을 입력하세요:', '추가 정보');
  if (!name) return;
  const tr = document.createElement('tr');
  tr.className = 'info-section-row';
  tr.innerHTML = `<th colspan="2" class="info-section-header" contenteditable="true">${escapeHtml(name)}</th>`;
  infoTableBody.appendChild(tr);
  saveContent();
});

$('#modalOk').addEventListener('click', () => {
  const key = $('#newRowKey').value.trim();
  const val = $('#newRowVal').value.trim();
  if (!key) { $('#newRowKey').focus(); return; }
  const tr = document.createElement('tr');
  tr.innerHTML = `<th contenteditable="true">${escapeHtml(key)}</th><td contenteditable="true">${escapeHtml(val) || '-'}</td><td class="row-del" title="삭제">×</td>`;
  infoTableBody.appendChild(tr);
  closeModal('addRowModal');
  $('#newRowKey').value = ''; $('#newRowVal').value = '';
  saveContent();
});

infoTableBody.addEventListener('click', e => {
  if (e.target.classList.contains('row-del')) {
    e.target.closest('tr').remove();
    saveContent();
  }
});

// ============ TAGS ============
const wikiTags = $('#wikiTags');
$('#addTagBtn').addEventListener('click', () => {
  const name = prompt('새 태그 이름:', '');
  if (!name) return;
  const span = document.createElement('span');
  span.className = 'wiki-tag';
  span.contentEditable = 'true';
  span.innerHTML = `${escapeHtml(name)}<button class="tag-del" title="삭제">×</button>`;
  wikiTags.appendChild(span);
  saveContent();
});
wikiTags.addEventListener('click', e => {
  if (e.target.classList.contains('tag-del')) {
    e.target.closest('.wiki-tag').remove();
    saveContent();
  }
});

// ============ ABILITY BARS ============
function bindAbilityRow(row) {
  const range = row.querySelector('.ability-range');
  const bar = row.querySelector('.bar');
  range.addEventListener('input', () => {
    bar.style.width = range.value + '%';
    bar.textContent = range.value;
    saveContent();
  });
  row.querySelector('.ability-del').addEventListener('click', () => {
    row.remove();
    saveContent();
  });
}
$$('.ability-row').forEach(bindAbilityRow);

document.addEventListener('click', e => {
  if (e.target.matches('[data-add-ability]')) {
    const list = $('#abilityList');
    const row = document.createElement('div');
    row.className = 'ability-row';
    row.innerHTML = `
      <span class="ability-name" contenteditable="true">새 능력</span>
      <div class="bar-wrap"><div class="bar" style="width:50%">50</div></div>
      <input type="range" class="ability-range" min="0" max="100" value="50" />
      <button class="ability-del" title="삭제">×</button>`;
    list.appendChild(row);
    bindAbilityRow(row);
    row.querySelector('.ability-name').focus();
    saveContent();
  }
});

// ============ RELATIONS ============
const EMOJI_LIST = ['👤','👨','👩','👨‍👦','👩‍👧','👫','👬','👭','💑','💔','❤️','🤝','⚔️','🤺','👹','👺','😈','🦹','🧙','🧝','🧛','🧚','🐉','🐺','🦊','🦁','🐯','🐻','🦅'];
const emojiPicker = $('#emojiPicker');
const emojiPickerRow = $('#emojiPickerRow');
EMOJI_LIST.forEach(emo => {
  const b = document.createElement('button');
  b.textContent = emo;
  b.addEventListener('click', () => {
    if (emojiPicker._target) {
      emojiPicker._target.textContent = emo;
      saveContent();
    }
    emojiPicker.classList.remove('open');
  });
  emojiPickerRow.appendChild(b);
});

document.addEventListener('click', e => {
  if (e.target.classList.contains('emoji-pick')) {
    e.stopPropagation();
    const rect = e.target.getBoundingClientRect();
    emojiPicker.style.top = (rect.bottom + window.scrollY + 4) + 'px';
    emojiPicker.style.left = (rect.left + window.scrollX) + 'px';
    emojiPicker._target = e.target;
    emojiPicker.classList.add('open');
  } else if (!emojiPicker.contains(e.target)) {
    emojiPicker.classList.remove('open');
  }
});

$('#addRelationBtn').addEventListener('click', () => {
  const card = document.createElement('div');
  card.className = 'relation-card';
  card.innerHTML = `
    <button class="relation-icon emoji-pick">👤</button>
    <div class="relation-info">
      <div class="relation-name" contenteditable="true">이름</div>
      <div class="relation-type" contenteditable="true">관계</div>
      <div class="relation-desc" contenteditable="true">설명을 입력하세요.</div>
    </div>
    <button class="card-del" title="삭제">×</button>`;
  $('#relationCards').appendChild(card);
  card.querySelector('.relation-name').focus();
  saveContent();
});

// ============ TIMELINE ============
$('#addTimelineBtn').addEventListener('click', () => {
  const item = document.createElement('div');
  item.className = 'timeline-item';
  item.innerHTML = `
    <div class="timeline-dot"></div>
    <div class="timeline-content">
      <div class="timeline-date" contenteditable="true">시기</div>
      <div class="timeline-text" contenteditable="true">내용을 입력하세요.</div>
    </div>
    <button class="card-del" title="삭제">×</button>`;
  $('#timeline').appendChild(item);
  item.querySelector('.timeline-date').focus();
  saveContent();
});

// ============ QUOTES ============
$('#addQuoteBtn').addEventListener('click', () => {
  const item = document.createElement('div');
  item.className = 'quote-item';
  item.innerHTML = `
    <blockquote class="quote-text" contenteditable="true">"어록을 입력하세요."</blockquote>
    <div class="quote-source" contenteditable="true">— 출처</div>
    <button class="card-del" title="삭제">×</button>`;
  $('#quotesList').appendChild(item);
  item.querySelector('.quote-text').focus();
  saveContent();
});

// ============ CARD DELETE (delegated) ============
document.addEventListener('click', e => {
  if (e.target.classList.contains('card-del')) {
    const item = e.target.closest('.relation-card, .timeline-item, .quote-item, .link-item, .video-item, .gallery-item');
    if (item) { item.remove(); saveContent(); }
  }
});

// ============ GALLERY ============
const galleryGrid = $('#galleryGrid');
$('#galleryUpload').addEventListener('change', e => {
  Array.from(e.target.files || []).forEach(file => {
    const reader = new FileReader();
    reader.onload = ev => {
      addGalleryItem(ev.target.result);
      saveContent();
    };
    reader.readAsDataURL(file);
  });
  e.target.value = '';
});
function addGalleryItem(src) {
  const item = document.createElement('div');
  item.className = 'gallery-item';
  item.innerHTML = `<img src="${src}" alt="갤러리 이미지" /><button class="card-del" title="삭제">×</button>`;
  galleryGrid.appendChild(item);
}

// ============ VIDEOS ============
const videoList = $('#videoList');
$('#addVideoBtn').addEventListener('click', () => openModal('addVideoModal'));
$('#videoModalOk').addEventListener('click', () => {
  const url = $('#newVideoUrl').value.trim();
  const caption = $('#newVideoCaption').value.trim();
  if (!url) return;
  const id = parseYouTubeId(url);
  if (!id) { showToast('올바른 YouTube URL을 입력해 주세요'); return; }
  addVideo(id, caption);
  closeModal('addVideoModal');
  $('#newVideoUrl').value = ''; $('#newVideoCaption').value = '';
  saveContent();
});
function parseYouTubeId(input) {
  if (/^[\w-]{11}$/.test(input)) return input;
  const m = input.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}
function addVideo(id, caption) {
  const item = document.createElement('div');
  item.className = 'video-item';
  item.innerHTML = `
    <div class="video-frame-wrap">
      <iframe src="https://www.youtube-nocookie.com/embed/${id}" title="YouTube" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
    </div>
    <div class="video-caption" contenteditable="true">${escapeHtml(caption || '영상 설명')}</div>
    <button class="card-del" title="삭제">×</button>`;
  videoList.appendChild(item);
}

// ============ LINKS ============
const linkList = $('#linkList');
$('#addLinkBtn').addEventListener('click', () => openModal('addLinkModal'));
$('#linkModalOk').addEventListener('click', () => {
  const icon = $('#newLinkIcon').value.trim() || '🌐';
  const url = $('#newLinkUrl').value.trim();
  const label = $('#newLinkLabel').value.trim() || '링크';
  if (!url) return;
  addLink(icon, url, label);
  closeModal('addLinkModal');
  $('#newLinkUrl').value = ''; $('#newLinkLabel').value = '';
  saveContent();
});
function addLink(icon, url, label) {
  const item = document.createElement('div');
  item.className = 'link-item';
  item.innerHTML = `
    <span class="link-icon">${escapeHtml(icon)}</span>
    <span class="link-label" contenteditable="true">${escapeHtml(label)}</span>
    <a class="link-url" href="${escapeAttr(url)}" target="_blank" rel="noopener" contenteditable="true">${escapeHtml(url)}</a>
    <button class="card-del" title="삭제">×</button>`;
  linkList.appendChild(item);
}

// ============ SECTIONS (add/move/delete) ============
const sectionsRoot = $('#sectionsRoot');

document.addEventListener('click', e => {
  if (!e.target.classList.contains('sec-btn')) return;
  const action = e.target.dataset.action;
  const section = e.target.closest('.wiki-section');
  if (!section) return;
  if (action === 'up' && section.previousElementSibling) {
    sectionsRoot.insertBefore(section, section.previousElementSibling);
    rebuildToc();
    saveContent();
  } else if (action === 'down' && section.nextElementSibling) {
    sectionsRoot.insertBefore(section.nextElementSibling, section);
    rebuildToc();
    saveContent();
  } else if (action === 'del') {
    if (confirm('이 섹션을 삭제할까요?')) {
      section.remove();
      rebuildToc();
      saveContent();
    }
  }
});

$('#addSectionBtn').addEventListener('click', () => openModal('addSectionModal'));
$('#sectionModalOk').addEventListener('click', () => {
  const title = $('#newSectionTitle').value.trim();
  if (!title) return;
  const sec = document.createElement('section');
  sec.className = 'wiki-section';
  sec.dataset.sectionId = 'custom-' + Date.now();
  sec.innerHTML = `
    <div class="section-header-bar">
      <h2 class="section-heading" contenteditable="true">${escapeHtml(title)}</h2>
      <div class="section-controls">
        <button class="sec-btn" data-action="up">↑</button>
        <button class="sec-btn" data-action="down">↓</button>
        <button class="sec-btn" data-action="del">×</button>
      </div>
    </div>
    <div class="section-divider divider-${state.divider}"></div>
    <div class="section-body" contenteditable="true"><p>여기에 내용을 입력하세요.</p></div>`;
  sectionsRoot.appendChild(sec);
  closeModal('addSectionModal');
  $('#newSectionTitle').value = '';
  rebuildToc();
  saveContent();
});

// ============ TOC ============
function rebuildToc() {
  const tocList = $('#tocList');
  tocList.innerHTML = '';
  $$('.wiki-section', sectionsRoot).forEach((sec, i) => {
    const h = sec.querySelector('.section-heading');
    if (!h) return;
    const id = 'sec-' + (sec.dataset.sectionId || i);
    sec.id = id;
    const li = document.createElement('li');
    li.innerHTML = `<a href="#${id}">${i + 1}. ${escapeHtml(h.textContent)}</a>`;
    tocList.appendChild(li);
  });
  $$('#tocList a').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const t = document.querySelector(a.getAttribute('href'));
      if (t) t.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

// Update TOC when section headings are edited (with debounce)
let tocTimer = null;
sectionsRoot.addEventListener('input', e => {
  if (e.target.classList.contains('section-heading')) {
    clearTimeout(tocTimer);
    tocTimer = setTimeout(rebuildToc, 400);
  }
  saveContentDebounced();
});

// ============ MODAL HELPERS ============
function openModal(id) { $('#' + id).classList.add('open'); const f = $('#' + id + ' .modal-input'); if (f) f.focus(); }
function closeModal(id) { $('#' + id).classList.remove('open'); }
$$('[data-modal-close]').forEach(b => b.addEventListener('click', () => closeModal(b.dataset.modalClose)));
$$('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); }));
$$('.modal-input').forEach(input => input.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const ok = input.closest('.modal-box').querySelector('.btn-modal-ok');
    if (ok) ok.click();
  }
}));

// ============ ESCAPE HELPERS ============
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }
function escapeAttr(s) { return escapeHtml(s); }

// ============ SHARE / PRINT / URL ============
$('#shareBtn').addEventListener('click', async () => {
  const url = window.location.href;
  if (navigator.share) {
    try { await navigator.share({ title: $('#charName').textContent, url }); return; } catch {}
  }
  navigator.clipboard.writeText(url).then(() => showToast('URL이 복사되었어요'));
});
$('#copyUrlBtn').addEventListener('click', () => {
  navigator.clipboard.writeText(window.location.href).then(() => showToast('URL이 복사되었어요'));
});
$('#printBtn').addEventListener('click', () => window.print());

// ============ EXPORT / IMPORT JSON ============
$('#exportJsonBtn').addEventListener('click', () => {
  const data = {
    state,
    content: getContentSnapshot(),
    exportedAt: new Date().toISOString(),
    version: '2.0',
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `charawiki-${($('#charName').textContent || 'export').trim().replace(/\s+/g, '-')}-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('JSON 파일로 저장했어요');
});

$('#importJsonInput').addEventListener('change', e => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (data.content?.html) {
        if (!confirm('현재 내용을 모두 덮어쓸까요?')) return;
        loadContentSnapshot(data.content);
      }
      if (data.state) {
        Object.assign(state, data.state);
        applyAllState();
        saveState();
      }
      showToast('불러오기 완료!');
    } catch (err) {
      showToast('잘못된 JSON 파일이에요');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
});

$('#resetAllBtn').addEventListener('click', () => {
  if (!confirm('모든 내용과 설정을 초기화할까요?\n(저장된 데이터가 모두 사라져요)')) return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(CONTENT_KEY);
  location.reload();
});

// ============ CONTENT SNAPSHOT ============
function getContentSnapshot() {
  return {
    html: {
      title: $('#charName').innerHTML,
      subtitle: $('#charSubtitle').innerHTML,
      tags: wikiTags.innerHTML,
      infoboxTitle: $('#infoboxTitle').innerHTML,
      infoboxImg: charImg.classList.contains('hidden') ? '' : charImg.src,
      infoboxImgCaption: $('.infobox-img-caption').innerHTML,
      infoTable: infoTableBody.innerHTML,
      sections: sectionsRoot.innerHTML,
    },
  };
}
function loadContentSnapshot(c) {
  const h = c.html || {};
  if (h.title != null) $('#charName').innerHTML = h.title;
  if (h.subtitle != null) $('#charSubtitle').innerHTML = h.subtitle;
  if (h.tags != null) wikiTags.innerHTML = h.tags;
  if (h.infoboxTitle != null) $('#infoboxTitle').innerHTML = h.infoboxTitle;
  if (h.infoboxImg) {
    charImg.src = h.infoboxImg;
    charImg.classList.remove('hidden');
    imgPlaceholder.style.display = 'none';
    imgWrap.classList.add('has-img');
  }
  if (h.infoboxImgCaption != null) $('.infobox-img-caption').innerHTML = h.infoboxImgCaption;
  if (h.infoTable != null) infoTableBody.innerHTML = h.infoTable;
  if (h.sections != null) sectionsRoot.innerHTML = h.sections;
  $$('.ability-row').forEach(bindAbilityRow);
  rebuildToc();
}

// ============ SAVE / LOAD ============
let saveTimer = null;
function saveContentDebounced() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveContent, 700);
}
function saveContent() {
  try {
    localStorage.setItem(CONTENT_KEY, JSON.stringify(getContentSnapshot()));
  } catch (e) {
    console.warn('저장 실패 (localStorage 용량 초과 가능)', e);
  }
}
function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
}

function loadContent() {
  try {
    const c = JSON.parse(localStorage.getItem(CONTENT_KEY));
    if (c) loadContentSnapshot(c);
  } catch (e) {}
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return;
    Object.assign(state, saved);
    applyAllState();
  } catch (e) {}
}

function applyAllState() {
  applyTheme(state.theme || 'default');
  applyFont(state.font || 'gothic');
  applyPattern(state.pattern || 'none');
  applyBorder(state.border || 'solid');
  applyDivider(state.divider || 'solid');
  applyAccent(state.accent || '#3366cc');
  applyCursor(state.cursor || 'default');
  applyAnim(state.anim || 'medium');
  applyBgImage();
  applyTextColor();
  applyLinkColor();
  applyInfoboxHeader();
  applyInfoPos(state.infoPos || 'right');
  applyCols(state.cols || '1');
  body.classList.toggle('card-style', !!state.cardStyle);
  toc.classList.toggle('sticky-toc', !!state.stickyToc);
  if (state.fontSize) document.documentElement.style.fontSize = state.fontSize + 'px';
  document.documentElement.style.setProperty('--bg-image-opacity', (state.bgOpacity || 30) / 100);

  if (state.imgFilter && state.imgFilter !== 'none') charImg.classList.add(`filter-${state.imgFilter}`);

  // sync UI controls
  $$('.theme-btn').forEach(b => b.classList.toggle('active', b.dataset.theme === state.theme));
  $$('[data-font]').forEach(b => b.classList.toggle('active', b.dataset.font === state.font));
  $$('[data-pattern]').forEach(b => b.classList.toggle('active', b.dataset.pattern === state.pattern));
  $$('[data-border]').forEach(b => b.classList.toggle('active', b.dataset.border === state.border));
  $$('[data-divider]').forEach(b => b.classList.toggle('active', b.dataset.divider === state.divider));
  $$('[data-anim]').forEach(b => b.classList.toggle('active', b.dataset.anim === state.anim));
  $$('[data-cursor]').forEach(b => b.classList.toggle('active', b.dataset.cursor === state.cursor));
  $$('[data-infopos]').forEach(b => b.classList.toggle('active', b.dataset.infopos === state.infoPos));
  $$('[data-cols]').forEach(b => b.classList.toggle('active', b.dataset.cols === state.cols));
  $$('.color-dot').forEach(d => d.classList.toggle('active', d.dataset.color === state.accent));
  $$('.img-filter-btn').forEach(b => b.classList.toggle('active', b.dataset.filter === (state.imgFilter || 'none')));
  $('#customColor').value = state.accent || '#3366cc';
  $('#fontSizeRange').value = state.fontSize || 15;
  $('#fontSizeVal').textContent = (state.fontSize || 15) + 'px';
  $('#bgOpacityRange').value = state.bgOpacity || 30;
  $('#bgOpacityVal').textContent = (state.bgOpacity || 30) + '%';
  $('#textColor').value = state.textColor || '#202122';
  $('#linkColor').value = state.linkColor || '#3366cc';
  $('#infoboxHeaderColor').value = state.infoboxHeader || '#cee0f2';
  $('#cardStyleToggle').checked = !!state.cardStyle;
  $('#stickyTocToggle').checked = !!state.stickyToc;
  $('#autoDarkToggle').checked = !!state.autoDark;
}

// ============ AUTO-SAVE CONTENT ON EDIT ============
document.addEventListener('input', e => {
  if (e.target.matches('[contenteditable], .ability-range, .modal-input')) {
    if (!e.target.classList.contains('modal-input')) {
      saveContentDebounced();
    }
  }
});

// ============ LAST MODIFIED ============
function updateLastModified() {
  $('#lastModified').textContent = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

// ============ INIT ============
loadState();
loadContent();
rebuildToc();
updateLastModified();
applyAutoDark();

// listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (state.autoDark) applyAutoDark();
});
