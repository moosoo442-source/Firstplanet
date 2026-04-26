/* ===================================================
   CharaWiki v2 — script.js
=================================================== */

// ============ STATE ============
const S = {
  theme:'default', font:'gothic', pattern:'none',
  border:'solid', divider:'solid', card:'off',
  cursor:'default', anim:'normal', ibpos:'right',
  accent:'#3366cc', fontSize:15,
  bgImg:null, bgOpacity:20,
};

// ============ ELEMENTS ============
const body = document.body;
const overlay = document.getElementById('panelOverlay');
let activePanel = null;
let currentEmojiTarget = null;

// ============ PANELS ============
function openPanel(id) {
  const p = document.getElementById(id);
  if (!p) return;
  if (activePanel && activePanel !== p) closeAllPanels();
  p.classList.add('open');
  overlay.classList.add('active');
  activePanel = p;
}
function closeAllPanels() {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('open'));
  overlay.classList.remove('active');
  activePanel = null;
}

document.getElementById('themeToggleBtn').onclick = (e) => { e.stopPropagation(); activePanel?.id==='themePanel'?closeAllPanels():openPanel('themePanel'); };
document.getElementById('decorToggleBtn').onclick = (e) => { e.stopPropagation(); activePanel?.id==='decorPanel'?closeAllPanels():openPanel('decorPanel'); };
document.getElementById('editToggleBtn').onclick  = (e) => { e.stopPropagation(); activePanel?.id==='editPanel'?closeAllPanels():openPanel('editPanel'); };
overlay.onclick = closeAllPanels;

document.querySelectorAll('.panel-close').forEach(btn => {
  btn.onclick = () => closeAllPanels();
});

// ============ THEME ============
const THEMES = ['default','dark','sakura','ocean','forest','galaxy','retro','halloween','xmas'];
document.querySelectorAll('.theme-btn').forEach(btn => {
  btn.onclick = () => {
    applyTheme(btn.dataset.theme);
    document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  };
});
function applyTheme(t) {
  THEMES.forEach(x => body.classList.remove('theme-'+x));
  body.classList.add('theme-'+t);
  S.theme = t; save();
}

// ============ FONT ============
document.querySelectorAll('[data-font]').forEach(btn => {
  btn.onclick = () => { applyFont(btn.dataset.font); setActive('[data-font]', btn); };
});
function applyFont(f) {
  ['gothic','serif','handwriting','cute'].forEach(x => body.classList.remove('font-'+x));
  body.classList.add('font-'+f); S.font = f; save();
}

// ============ PATTERN ============
document.querySelectorAll('[data-pattern]').forEach(btn => {
  btn.onclick = () => { applyPattern(btn.dataset.pattern); setActive('[data-pattern]', btn); };
});
function applyPattern(p) {
  ['none','grid','dot','diagonal','wave','star'].forEach(x => body.classList.remove('pattern-'+x));
  body.classList.add('pattern-'+p); S.pattern = p; save();
}

// ============ BORDER ============
const infobox = document.getElementById('infobox');
document.querySelectorAll('[data-border]').forEach(btn => {
  btn.onclick = () => { applyBorder(btn.dataset.border); setActive('[data-border]', btn); };
});
function applyBorder(b) {
  ['solid','dashed','double','shadow','glow'].forEach(x => infobox.classList.remove('border-'+x));
  infobox.classList.add('border-'+b); S.border = b; save();
}

// ============ DIVIDER ============
document.querySelectorAll('[data-divider]').forEach(btn => {
  btn.onclick = () => { applyDivider(btn.dataset.divider); setActive('[data-divider]', btn); };
});
function applyDivider(d) {
  document.querySelectorAll('.section-divider').forEach(el => {
    ['solid','dashed','gradient','double','none'].forEach(x => el.classList.remove('divider-'+x));
    el.classList.add('divider-'+d);
  });
  S.divider = d; save();
}

// ============ CARD STYLE ============
document.querySelectorAll('[data-card]').forEach(btn => {
  btn.onclick = () => { applyCard(btn.dataset.card); setActive('[data-card]', btn); };
});
function applyCard(c) {
  const article = document.getElementById('article');
  article.classList.toggle('card-on', c === 'on');
  S.card = c; save();
}

// ============ CURSOR ============
const cursorDot  = document.getElementById('cursorDot');
const cursorRing = document.getElementById('cursorRing');
let mouseX = 0, mouseY = 0;
let ringX = 0, ringY = 0;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX; mouseY = e.clientY;
  cursorDot.style.left  = mouseX + 'px';
  cursorDot.style.top   = mouseY + 'px';
});

function animRing() {
  ringX += (mouseX - ringX) * 0.12;
  ringY += (mouseY - ringY) * 0.12;
  cursorRing.style.left = ringX + 'px';
  cursorRing.style.top  = ringY + 'px';
  requestAnimationFrame(animRing);
}
animRing();

const CURSOR_EMOJIS = { star:'⭐', heart:'❤️', pen:'✒️' };
let trailThrottle = 0;

document.querySelectorAll('[data-cursor]').forEach(btn => {
  btn.onclick = () => { applyCursor(btn.dataset.cursor); setActive('[data-cursor]', btn); };
});
function applyCursor(c) {
  ['default','star','heart','pen'].forEach(x => body.classList.remove('cursor-'+x));
  body.classList.add('cursor-'+c);
  S.cursor = c; save();

  if (c !== 'default') {
    document.addEventListener('mousemove', spawnTrail);
  } else {
    document.removeEventListener('mousemove', spawnTrail);
  }
}
function spawnTrail(e) {
  const now = Date.now();
  if (now - trailThrottle < 60) return;
  trailThrottle = now;
  const emoji = CURSOR_EMOJIS[S.cursor];
  if (!emoji) return;
  const el = document.createElement('div');
  el.className = 'cursor-trail';
  el.textContent = emoji;
  el.style.left = e.clientX + 'px';
  el.style.top  = e.clientY + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 700);
}

// ============ ANIMATION ============
document.querySelectorAll('[data-anim]').forEach(btn => {
  btn.onclick = () => { applyAnim(btn.dataset.anim); setActive('[data-anim]', btn); };
});
function applyAnim(a) {
  ['none','normal','strong'].forEach(x => body.classList.remove('anim-'+x));
  body.classList.add('anim-'+a); S.anim = a; save();
}

// ============ INFOBOX POSITION ============
const wikiBody = document.getElementById('wikiBody');
document.querySelectorAll('[data-ibpos]').forEach(btn => {
  btn.onclick = () => { applyIbpos(btn.dataset.ibpos); setActive('[data-ibpos]', btn); };
});
function applyIbpos(p) {
  ['right','left','top'].forEach(x => wikiBody.classList.remove('ibpos-'+x));
  wikiBody.classList.add('ibpos-'+p); S.ibpos = p; save();
}

// ============ ACCENT COLOR ============
document.querySelectorAll('.cdot').forEach(dot => {
  dot.onclick = () => {
    applyAccent(dot.dataset.color);
    document.querySelectorAll('.cdot').forEach(d => d.classList.remove('active'));
    dot.classList.add('active');
  };
});
const customAccent = document.getElementById('customAccent');
customAccent.oninput = () => {
  applyAccent(customAccent.value);
  document.querySelectorAll('.cdot').forEach(d => d.classList.remove('active'));
};
function applyAccent(c) {
  ['--accent','--text-link','--quote-border','--tag-color'].forEach(v => body.style.setProperty(v, c));
  S.accent = c; save();
}

// ============ FONT SIZE ============
const fszRange = document.getElementById('fszRange');
const fszVal   = document.getElementById('fszVal');
fszRange.oninput = () => {
  const s = fszRange.value;
  document.documentElement.style.fontSize = s + 'px';
  fszVal.textContent = s + 'px';
  S.fontSize = +s; save();
};

// ============ BACKGROUND IMAGE ============
const bgLayer    = document.getElementById('bgImgLayer');
const bgOpSlider = document.getElementById('bgOpacity');
const bgOpVal    = document.getElementById('bgOpacityVal');

document.querySelectorAll('[data-bgimg]').forEach(btn => {
  btn.onclick = () => {
    if (btn.dataset.bgimg === 'upload') {
      document.getElementById('bgImgUpload').click();
    } else {
      bgLayer.style.backgroundImage = '';
      bgLayer.style.opacity = 0;
      S.bgImg = null; save();
      setActive('[data-bgimg]', btn);
    }
  };
});

document.getElementById('bgImgUpload').onchange = e => {
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = ev => {
    bgLayer.style.backgroundImage = `url(${ev.target.result})`;
    bgLayer.style.opacity = bgOpSlider.value / 100;
    S.bgImg = ev.target.result;
    save();
  };
  r.readAsDataURL(f);
};

bgOpSlider.oninput = () => {
  const v = bgOpSlider.value;
  bgLayer.style.opacity = v / 100;
  bgOpVal.textContent = v + '%';
  S.bgOpacity = +v; save();
};

// ============ RESET DECOR ============
document.getElementById('resetDecor').onclick = () => {
  if (!confirm('꾸미기 설정을 초기화할까요?')) return;
  applyFont('gothic');     setActiveByValue('[data-font]', 'gothic');
  applyPattern('none');    setActiveByValue('[data-pattern]', 'none');
  applyBorder('solid');    setActiveByValue('[data-border]', 'solid');
  applyDivider('solid');   setActiveByValue('[data-divider]', 'solid');
  applyCard('off');        setActiveByValue('[data-card]', 'off');
  applyCursor('default');  setActiveByValue('[data-cursor]', 'default');
  applyAnim('normal');     setActiveByValue('[data-anim]', 'normal');
  applyIbpos('right');     setActiveByValue('[data-ibpos]', 'right');
  applyAccent('#3366cc');
  customAccent.value = '#3366cc';
  document.querySelectorAll('.cdot').forEach((d,i) => d.classList.toggle('active', i===0));
  document.documentElement.style.fontSize = '15px';
  fszRange.value = 15; fszVal.textContent = '15px';
  bgLayer.style.backgroundImage = '';
  bgLayer.style.opacity = 0;
  bgOpSlider.value = 20; bgOpVal.textContent = '20%';
  Object.assign(S, { font:'gothic', pattern:'none', border:'solid', divider:'solid', card:'off', cursor:'default', anim:'normal', ibpos:'right', accent:'#3366cc', fontSize:15, bgImg:null, bgOpacity:20 });
  save();
};

// ============ IMAGE UPLOAD (INFOBOX) ============
const imgUpload      = document.getElementById('imgUpload');
const imgPlaceholder = document.getElementById('imgPlaceholder');
const imgLoaded      = document.getElementById('imgLoaded');
const charImg        = document.getElementById('charImg');

document.getElementById('imgWrap').onclick = () => imgUpload.click();
imgUpload.onclick = e => e.stopPropagation();
imgUpload.onchange = e => {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = ev => { charImg.src = ev.target.result; imgPlaceholder.classList.add('hidden'); imgLoaded.classList.remove('hidden'); };
  r.readAsDataURL(f);
};
document.getElementById('removeImgBtn').onclick = e => {
  e.stopPropagation();
  charImg.src = ''; imgLoaded.classList.add('hidden'); imgPlaceholder.classList.remove('hidden');
};

// IMAGE FILTERS
document.querySelectorAll('.filt-btn').forEach(btn => {
  btn.onclick = e => {
    e.stopPropagation();
    const FILTERS = { none:'', sepia:'sepia(1)', grayscale:'grayscale(1)', bright:'brightness(1.3) contrast(1.1)' };
    charImg.style.filter = FILTERS[btn.dataset.filter] || '';
    document.querySelectorAll('.filt-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  };
});

// ============ TOC TOGGLE ============
const tocToggle = document.getElementById('tocToggle');
const toc       = document.getElementById('toc');
tocToggle.onclick = () => {
  toc.classList.toggle('toc-collapsed');
  tocToggle.textContent = toc.classList.contains('toc-collapsed') ? '▼ 펼치기' : '▲ 접기';
};

// ============ SECTION DELETE ============
document.addEventListener('click', e => {
  if (e.target.classList.contains('sec-del-btn')) {
    const sec = e.target.closest('.wiki-section');
    if (sec && confirm('이 섹션을 삭제할까요?')) { sec.remove(); updateToc(); }
  }
});

// ============ ADD ROW (INFOBOX) ============
const addRowModal = document.getElementById('addRowModal');
document.getElementById('addRowBtn').onclick = () => openModal('addRowModal');
document.getElementById('addRowOk').onclick = () => {
  const k = document.getElementById('newRowKey').value.trim();
  const v = document.getElementById('newRowVal').value.trim();
  if (!k) { document.getElementById('newRowKey').focus(); return; }
  const tr = document.createElement('tr');
  tr.innerHTML = `<th>${k}</th><td contenteditable="true">${v||'-'}</td>`;
  document.getElementById('infoTableBody').appendChild(tr);
  document.getElementById('newRowKey').value = '';
  document.getElementById('newRowVal').value = '';
  closeModal('addRowModal');
};

// ============ ADD INFO HEADER ============
document.getElementById('addInfoHeaderBtn').onclick = () => {
  const name = prompt('소제목 이름을 입력하세요:');
  if (!name) return;
  const tr = document.createElement('tr');
  tr.innerHTML = `<th colspan="2" class="info-head" contenteditable="true">${name}</th>`;
  document.getElementById('infoTableBody').appendChild(tr);
};

// ============ ADD SECTION ============
document.getElementById('addSectionBtn').onclick = () => openModal('addSectionModal');
document.getElementById('addSectionOk').onclick = () => {
  const title = document.getElementById('newSecTitle').value.trim();
  if (!title) { document.getElementById('newSecTitle').focus(); return; }
  const idx = document.querySelectorAll('.wiki-section').length + 1;
  const id  = 'sec-custom-' + Date.now();
  const sec = document.createElement('section');
  sec.className = 'wiki-section';
  sec.id = id;
  sec.dataset.title = title;
  sec.innerHTML = `
    <div class="section-header-row">
      <h2 class="section-heading" contenteditable="true">${idx}. ${title}</h2>
      <div class="section-tools"><button class="sec-del-btn" title="섹션 삭제">🗑️</button></div>
    </div>
    <div class="section-divider divider-${S.divider}"></div>
    <p contenteditable="true">내용을 여기에 입력하세요.</p>`;
  document.getElementById('sectionsEnd').before(sec);
  updateToc();
  document.getElementById('newSecTitle').value = '';
  closeModal('addSectionModal');
  sec.scrollIntoView({ behavior:'smooth', block:'start' });
};

// ============ ADD GALLERY SECTION ============
document.getElementById('addGalleryBtn').onclick = () => {
  const title = prompt('갤러리 섹션 제목:', '갤러리');
  if (title === null) return;
  const idx = document.querySelectorAll('.wiki-section').length + 1;
  const sec = document.createElement('section');
  sec.className = 'wiki-section';
  sec.dataset.title = title || '갤러리';
  sec.innerHTML = `
    <div class="section-header-row">
      <h2 class="section-heading" contenteditable="true">${idx}. ${title || '갤러리'}</h2>
      <div class="section-tools"><button class="sec-del-btn">🗑️</button></div>
    </div>
    <div class="section-divider divider-${S.divider}"></div>
    <div class="gallery-grid" id="gallery-${Date.now()}">
      ${makeGalleryItem()}${makeGalleryItem()}${makeGalleryItem()}
    </div>
    <button class="btn-add-gallery-item">＋ 이미지 추가</button>`;
  document.getElementById('sectionsEnd').before(sec);
  bindGallery(sec);
  updateToc();
  closeAllPanels();
};

function makeGalleryItem() {
  return `<div class="gallery-item">
    <div class="gallery-item-placeholder">
      <span>🖼️</span>
      <input type="file" accept="image/*"/>
    </div>
    <button class="gallery-del">✕</button>
    <div class="gallery-caption" contenteditable="true">캡션</div>
  </div>`;
}

function bindGallery(sec) {
  sec.addEventListener('change', e => {
    if (e.target.type !== 'file') return;
    const f = e.target.files[0]; if (!f) return;
    const item = e.target.closest('.gallery-item');
    const r = new FileReader();
    r.onload = ev => {
      item.innerHTML = `<img src="${ev.target.result}" alt="gallery"/>
        <button class="gallery-del">✕</button>
        <div class="gallery-caption" contenteditable="true">캡션</div>`;
    };
    r.readAsDataURL(f);
  });
  sec.addEventListener('click', e => {
    if (e.target.classList.contains('gallery-del')) { e.target.closest('.gallery-item').remove(); return; }
    if (e.target.classList.contains('btn-add-gallery-item')) {
      const grid = sec.querySelector('.gallery-grid');
      const div = document.createElement('div');
      div.innerHTML = makeGalleryItem();
      grid.appendChild(div.firstElementChild);
      bindGallery(sec);
    }
  });
}

// ============ ADD VIDEO SECTION ============
document.getElementById('addVideoBtn').onclick = () => openModal('videoModal');
document.getElementById('videoOk').onclick = () => {
  let url  = document.getElementById('ytUrl').value.trim();
  const title = document.getElementById('ytTitle').value.trim() || '관련 영상';
  if (!url) { document.getElementById('ytUrl').focus(); return; }
  // extract video ID
  let vid = url;
  const m = url.match(/(?:youtu\.be\/|v=|embed\/)([A-Za-z0-9_-]{11})/);
  if (m) vid = m[1];
  const idx = document.querySelectorAll('.wiki-section').length + 1;
  const sec = document.createElement('section');
  sec.className = 'wiki-section';
  sec.dataset.title = title;
  sec.innerHTML = `
    <div class="section-header-row">
      <h2 class="section-heading" contenteditable="true">${idx}. ${title}</h2>
      <div class="section-tools"><button class="sec-del-btn">🗑️</button></div>
    </div>
    <div class="section-divider divider-${S.divider}"></div>
    <div class="yt-wrap">
      <iframe src="https://www.youtube.com/embed/${vid}" allowfullscreen loading="lazy"></iframe>
    </div>`;
  document.getElementById('sectionsEnd').before(sec);
  updateToc();
  document.getElementById('ytUrl').value = '';
  document.getElementById('ytTitle').value = '';
  closeModal('videoModal');
};

// ============ ADD LINKS SECTION ============
document.getElementById('addLinksBtn').onclick = () => {
  if (document.getElementById('sec-links')) { alert('외부 링크 섹션이 이미 있어요!'); return; }
  const idx = document.querySelectorAll('.wiki-section').length + 1;
  const sec = document.createElement('section');
  sec.className = 'wiki-section'; sec.id = 'sec-links'; sec.dataset.title = '외부 링크';
  sec.innerHTML = `
    <div class="section-header-row">
      <h2 class="section-heading">${idx}. 외부 링크</h2>
      <div class="section-tools"><button class="sec-del-btn">🗑️</button></div>
    </div>
    <div class="section-divider divider-${S.divider}"></div>
    <div class="ext-links" id="extLinksList">
      ${makeExtLink('🌐','공식 사이트','https://example.com')}
      ${makeExtLink('🐦','트위터 / X','https://twitter.com')}
    </div>
    <button class="add-btn" id="addExtLinkBtn">＋ 링크 추가</button>`;
  document.getElementById('sectionsEnd').before(sec);
  bindExtLinks(sec);
  updateToc();
  closeAllPanels();
};

function makeExtLink(icon, label, url) {
  return `<div class="ext-link-item">
    <span class="ext-link-icon" contenteditable="true">${icon}</span>
    <div>
      <div class="ext-link-label" contenteditable="true">${label}</div>
      <div class="ext-link-url"><a href="${url}" target="_blank" contenteditable="true">${url}</a></div>
    </div>
    <button class="ext-link-del">✕</button>
  </div>`;
}

function bindExtLinks(sec) {
  sec.addEventListener('click', e => {
    if (e.target.classList.contains('ext-link-del')) { e.target.closest('.ext-link-item').remove(); return; }
    if (e.target.id === 'addExtLinkBtn') {
      const list = sec.querySelector('.ext-links');
      const div = document.createElement('div');
      div.innerHTML = makeExtLink('🔗','링크 이름','https://');
      list.appendChild(div.firstElementChild);
    }
  });
}

// ============ RELATION ============
document.getElementById('addRelBtn').onclick = () => {
  const card = document.createElement('div');
  card.className = 'relation-card';
  card.innerHTML = `
    <div class="rel-emoji-wrap"><button class="rel-emoji-btn" title="이모지 변경">👤</button></div>
    <div class="rel-info">
      <div class="rel-name" contenteditable="true">이름</div>
      <div class="rel-type" contenteditable="true">관계</div>
      <div class="rel-desc" contenteditable="true">설명을 입력하세요.</div>
    </div>
    <button class="rel-del">✕</button>`;
  document.getElementById('relationCards').appendChild(card);
  card.querySelector('.rel-name').focus();
};

document.addEventListener('click', e => {
  if (e.target.classList.contains('rel-del')) e.target.closest('.relation-card').remove();
  if (e.target.classList.contains('rel-emoji-btn')) {
    currentEmojiTarget = e.target;
    buildEmojiGrid();
    openModal('emojiModal');
  }
  if (e.target.classList.contains('emoji-btn-item')) {
    if (currentEmojiTarget) currentEmojiTarget.textContent = e.target.textContent;
    closeModal('emojiModal');
  }
});

function buildEmojiGrid() {
  const grid = document.getElementById('emojiGrid');
  const emojis = [...document.getElementById('emojiGrid').textContent];
  grid.innerHTML = '';
  emojis.forEach(em => {
    if (em.trim()) {
      const btn = document.createElement('button');
      btn.className = 'emoji-btn-item';
      btn.textContent = em;
      grid.appendChild(btn);
    }
  });
}
// init emoji grid on load
(function initEmoji() {
  const grid = document.getElementById('emojiGrid');
  const raw = grid.textContent;
  grid.innerHTML = '';
  [...raw].forEach(em => {
    if (em.trim()) {
      const btn = document.createElement('button');
      btn.className = 'emoji-btn-item';
      btn.textContent = em;
      grid.appendChild(btn);
    }
  });
})();

// ============ TIMELINE ============
document.getElementById('addTlBtn').onclick = () => {
  const item = document.createElement('div');
  item.className = 'tl-item';
  item.innerHTML = `
    <div class="tl-dot"></div>
    <div class="tl-content">
      <div class="tl-date" contenteditable="true">시기</div>
      <div class="tl-text" contenteditable="true">내용을 입력하세요.</div>
      <button class="tl-del">✕</button>
    </div>`;
  document.getElementById('timeline').appendChild(item);
  item.querySelector('.tl-date').focus();
};
document.addEventListener('click', e => {
  if (e.target.classList.contains('tl-del')) e.target.closest('.tl-item').remove();
});

// ============ QUOTES ============
document.getElementById('addQuoteBtn').onclick = () => {
  const item = document.createElement('div');
  item.className = 'quote-item';
  item.innerHTML = `
    <blockquote contenteditable="true">"어록을 입력하세요."</blockquote>
    <div class="quote-src" contenteditable="true">— 출처</div>
    <button class="quote-del">✕</button>`;
  document.getElementById('quotesList').appendChild(item);
  item.querySelector('blockquote').focus();
};
document.addEventListener('click', e => {
  if (e.target.classList.contains('quote-del')) e.target.closest('.quote-item').remove();
});

// ============ ADD ABILITY ============
document.getElementById('addAbilityBtn').onclick = () => openModal('abilityModal');
document.getElementById('abilityOk').onclick = () => {
  const name = document.getElementById('abilityName').value.trim();
  const val  = Math.min(100, Math.max(0, +document.getElementById('abilityVal').value || 70));
  const desc = document.getElementById('abilityDesc').value.trim();
  if (!name) { document.getElementById('abilityName').focus(); return; }
  const tr = document.createElement('tr');
  tr.innerHTML = `<td contenteditable="true">${name}</td><td><div class="bar-wrap"><div class="bar" style="width:${val}%"><span>${val}</span></div></div></td><td contenteditable="true">${desc||'-'}</td>`;
  document.getElementById('abilityTableBody').appendChild(tr);
  ['abilityName','abilityDesc'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('abilityVal').value = 70;
  closeModal('abilityModal');
};

// ============ TAGS ============
document.getElementById('addTagBtn').onclick = addTag;
document.getElementById('newTagInput').onkeydown = e => { if (e.key === 'Enter') addTag(); };
function addTag() {
  const input = document.getElementById('newTagInput');
  const val = input.value.trim(); if (!val) return;
  const item = document.createElement('span');
  item.className = 'tag-item';
  item.innerHTML = `${val}<button class="tag-del">✕</button>`;
  item.querySelector('.tag-del').onclick = () => item.remove();
  document.getElementById('tagList').appendChild(item);
  input.value = '';
}

// ============ EXPORT JSON ============
document.getElementById('exportJsonBtn').onclick = () => {
  const data = {
    title: document.querySelector('.wiki-title')?.textContent || '',
    subtitle: document.querySelector('.wiki-subtitle')?.textContent || '',
    settings: S,
    sections: [...document.querySelectorAll('.wiki-section')].map(s => ({
      id: s.id, title: s.dataset.title, html: s.innerHTML
    }))
  };
  document.getElementById('exportTextarea').value = JSON.stringify(data, null, 2);
  openModal('exportModal');
};
document.getElementById('copyJsonBtn').onclick = () => {
  const ta = document.getElementById('exportTextarea');
  ta.select();
  document.execCommand('copy');
  document.getElementById('copyJsonBtn').textContent = '✅ 복사됨!';
  setTimeout(() => document.getElementById('copyJsonBtn').textContent = '📋 복사', 1500);
};

// ============ IMPORT JSON ============
document.getElementById('importJsonBtn').onclick = () => document.getElementById('importJsonFile').click();
document.getElementById('importJsonFile').onchange = e => {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (data.title)    document.querySelector('.wiki-title').textContent    = data.title;
      if (data.subtitle) document.querySelector('.wiki-subtitle').textContent = data.subtitle;
      if (data.settings) loadStateObj(data.settings);
      alert('불러오기 완료!');
    } catch { alert('JSON 형식이 올바르지 않아요.'); }
  };
  r.readAsText(f);
};

// ============ EXPORT / PRINT ============
document.getElementById('exportBtn').onclick = () => {
  document.getElementById('exportJsonBtn').click();
};
[document.getElementById('printBtn'), document.getElementById('printBtn2')].forEach(btn => {
  if (btn) btn.onclick = () => window.print();
});

// ============ COPY URL ============
document.getElementById('copyUrlBtn').onclick = () => {
  navigator.clipboard.writeText(location.href).then(() => {
    document.getElementById('copyUrlBtn').textContent = '✅ 복사됨!';
    setTimeout(() => document.getElementById('copyUrlBtn').textContent = '🔗 URL 복사', 1500);
  });
};

// ============ TOC UPDATE ============
function updateToc() {
  const list = document.getElementById('tocList');
  list.innerHTML = '';
  document.querySelectorAll('.wiki-section').forEach((sec, i) => {
    const heading = sec.querySelector('.section-heading');
    if (!heading) return;
    const li = document.createElement('li');
    const a  = document.createElement('a');
    a.href = '#' + sec.id;
    a.textContent = heading.textContent;
    a.onclick = e => { e.preventDefault(); sec.scrollIntoView({ behavior:'smooth' }); };
    li.appendChild(a);
    list.appendChild(li);
  });
}

// ============ MODAL HELPERS ============
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.querySelectorAll('.btn-cancel').forEach(btn => {
  btn.onclick = () => { const id = btn.dataset.modal; if (id) closeModal(id); };
});
document.querySelectorAll('.modal').forEach(m => {
  m.onclick = e => { if (e.target === m) m.classList.remove('open'); };
});

// ============ HELPERS ============
function setActive(selector, activeBtn) {
  document.querySelectorAll(selector).forEach(b => b.classList.remove('active'));
  activeBtn.classList.add('active');
}
function setActiveByValue(selector, value) {
  document.querySelectorAll(selector).forEach(b => {
    const v = Object.values(b.dataset)[0];
    b.classList.toggle('active', v === value);
  });
}

// ============ SAVE / LOAD ============
function save() {
  try { localStorage.setItem('cwiki2', JSON.stringify(S)); } catch(e) {}
}

function loadStateObj(saved) {
  if (!saved) return;
  if (saved.theme)   { applyTheme(saved.theme);   setActiveByValue('.theme-btn', saved.theme); }
  if (saved.font)    { applyFont(saved.font);      setActiveByValue('[data-font]', saved.font); }
  if (saved.pattern) { applyPattern(saved.pattern);setActiveByValue('[data-pattern]', saved.pattern); }
  if (saved.border)  { applyBorder(saved.border);  setActiveByValue('[data-border]', saved.border); }
  if (saved.divider) { applyDivider(saved.divider);setActiveByValue('[data-divider]', saved.divider); }
  if (saved.card)    { applyCard(saved.card);       setActiveByValue('[data-card]', saved.card); }
  if (saved.cursor)  { applyCursor(saved.cursor);   setActiveByValue('[data-cursor]', saved.cursor); }
  if (saved.anim)    { applyAnim(saved.anim);       setActiveByValue('[data-anim]', saved.anim); }
  if (saved.ibpos)   { applyIbpos(saved.ibpos);     setActiveByValue('[data-ibpos]', saved.ibpos); }
  if (saved.accent)  { applyAccent(saved.accent); customAccent.value = saved.accent; }
  if (saved.fontSize){ document.documentElement.style.fontSize = saved.fontSize + 'px'; fszRange.value = saved.fontSize; fszVal.textContent = saved.fontSize + 'px'; }
  if (saved.bgImg)   { bgLayer.style.backgroundImage = `url(${saved.bgImg})`; bgLayer.style.opacity = (saved.bgOpacity||20)/100; bgOpSlider.value = saved.bgOpacity||20; bgOpVal.textContent = (saved.bgOpacity||20)+'%'; }
  Object.assign(S, saved);
}

function loadSaved() {
  try {
    const raw = localStorage.getItem('cwiki2');
    if (raw) loadStateObj(JSON.parse(raw));
  } catch(e) {}
}

// ============ LAST MODIFIED ============
const lastMod = document.getElementById('lastMod');
if (lastMod) lastMod.textContent = new Date().toLocaleDateString('ko-KR', { year:'numeric', month:'long', day:'numeric' });

// ============ SMOOTH TOC ============
document.querySelectorAll('.toc-list a').forEach(a => {
  a.onclick = e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior:'smooth', block:'start' }); }
  };
});

// ============ INIT ============
loadSaved();
updateToc();

// Bind galleries and ext links that exist on load
document.querySelectorAll('.wiki-section').forEach(sec => {
  if (sec.querySelector('.gallery-grid')) bindGallery(sec);
  if (sec.querySelector('.ext-links'))   bindExtLinks(sec);
});
