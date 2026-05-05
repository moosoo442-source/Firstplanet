/* ===== CharaWiki v3.3 ===== */
'use strict';

const $  = (s, p=document) => p.querySelector(s);
const $$ = (s, p=document) => [...p.querySelectorAll(s)];
const uid = () => Math.random().toString(36).slice(2,10);

// ---------- Store ----------
const DEFAULT_SETTINGS = { theme:'light', accent:'#3b82f6', font:'modern', infobox:'classic', layout:'right', pattern:'none', divider:'solid', fontSize:15 };
const SECTION_TYPES = [
  ['text','📝 텍스트'], ['list','📋 목록'], ['stats','📊 능력치'],
  ['relations','👥 인물관계'], ['timeline','⏱ 타임라인'], ['quotes','💬 어록'],
  ['gallery','🖼 갤러리'], ['youtube','▶️ 유튜브'], ['external','🔗 외부링크'],
  ['spoiler','⚠️ 스포일러'], ['table','📑 표']
];

function newPage(name='메인') {
  return {
    id: uid(), name,
    sections: [{ id:uid(), type:'text', title:'개요', body:'여기에 내용을 적어주세요.' }]
  };
}
function newChar(name='새 캐릭터') {
  const p = newPage();
  return {
    id: uid(), name, subtitle:'부제목을 입력하세요',
    cover:'', avatar:'', tags:[], categories:[],
    settings: structuredClone(DEFAULT_SETTINGS),
    infobox: {
      image:'', imageFilter:'', caption:'',
      rows: [
        { type:'sub', label:'기본 정보' },
        { type:'row', key:'이름', value:name },
        { type:'row', key:'성별', value:'-' },
        { type:'row', key:'나이', value:'-' }
      ]
    },
    pages: { [p.id]: p },
    pageOrder: [p.id],
    activePage: p.id
  };
}

let store = loadStore();
let editMode = false;
let saveTimer = null;
let currentEmojiTarget = null;

function loadStore() {
  try {
    const raw = localStorage.getItem('charawiki_v3');
    if (raw) return JSON.parse(raw);
  } catch(e){}
  // URL 공유로부터 읽기
  if (location.hash.startsWith('#share=')) {
    try {
      const data = JSON.parse(decodeURIComponent(atob(location.hash.slice(7))));
      toast('공유된 데이터를 불러왔습니다 (읽기 전용)');
      return data;
    } catch(e){}
  }
  const c = newChar('첫 캐릭터');
  return { chars:[c], activeId: c.id, settings: structuredClone(DEFAULT_SETTINGS) };
}
function saveStore() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem('charawiki_v3', JSON.stringify(store)); } catch(e){ toast('저장 실패: 용량 초과'); }
  }, 800);
}
function getActive() { return store.chars.find(c => c.id === store.activeId); }
function getActivePage() { const c = getActive(); return c.pages[c.activePage]; }

// ---------- Render ----------
function applySettings() {
  const c = getActive();
  const s = c?.settings || store.settings;
  document.body.dataset.theme    = s.theme;
  document.body.dataset.font     = s.font;
  document.body.dataset.infobox  = s.infobox;
  document.body.dataset.layout   = s.layout;
  document.body.dataset.pattern  = s.pattern;
  document.body.dataset.divider  = s.divider;
  document.documentElement.style.setProperty('--accent', s.accent);
  document.documentElement.style.setProperty('--fs', s.fontSize + 'px');
  $('#fsLabel').textContent = s.fontSize;
  $('#fontSize').value = s.fontSize;
}

function renderSidebar() {
  const list = $('#charList');
  const q = $('#charSearch').value.toLowerCase();
  list.innerHTML = '';
  store.chars.filter(c => c.name.toLowerCase().includes(q)).forEach(c => {
    const li = document.createElement('li');
    if (c.id === store.activeId) li.classList.add('active');
    li.innerHTML = `<span>${escapeHtml(c.name)}</span><button class="del" title="삭제">✕</button>`;
    li.onclick = (e) => {
      if (e.target.classList.contains('del')) {
        if (store.chars.length === 1) return toast('마지막 캐릭터는 삭제할 수 없습니다');
        if (!confirm(`"${c.name}" 삭제?`)) return;
        store.chars = store.chars.filter(x => x.id !== c.id);
        if (store.activeId === c.id) store.activeId = store.chars[0].id;
        saveStore(); renderAll();
      } else {
        store.activeId = c.id; saveStore(); renderAll();
        if (window.innerWidth <= 768) document.body.classList.remove('sb-open');
      }
    };
    list.appendChild(li);
  });
}

function renderTitleBlock() {
  const c = getActive();
  $('#title').textContent = c.name;
  $('#subtitle').textContent = c.subtitle;
  $('#cover').style.backgroundImage = c.cover ? `url(${c.cover})` : '';
  $('#cover').classList.toggle('has', !!c.cover);
  $('#avatar').style.backgroundImage = c.avatar ? `url(${c.avatar})` : '';

  const tags = $('#tags');
  tags.innerHTML = '';
  c.tags.forEach((t, i) => {
    const el = document.createElement('span');
    el.className = 'tag';
    el.innerHTML = `${escapeHtml(t)}${editMode ? '<button class="x" data-i="'+i+'">✕</button>' : ''}`;
    if (editMode) el.querySelector('.x').onclick = () => { c.tags.splice(i,1); saveStore(); renderTitleBlock(); };
    tags.appendChild(el);
  });
  if (editMode) {
    const add = document.createElement('button');
    add.className = 'add-btn'; add.style.display = 'inline-flex';
    add.textContent = '+ 태그';
    add.onclick = () => {
      const v = prompt('태그 이름?'); if (!v) return;
      c.tags.push(v); saveStore(); renderTitleBlock();
    };
    tags.appendChild(add);
  }
}

function renderTabs() {
  const c = getActive();
  const tabs = $('#tabs');
  tabs.innerHTML = '';
  c.pageOrder.forEach(pid => {
    const p = c.pages[pid];
    const btn = document.createElement('button');
    btn.className = 'tab' + (pid === c.activePage ? ' active' : '');
    btn.innerHTML = `<span>${escapeHtml(p.name)}</span>${editMode && c.pageOrder.length > 1 ? '<button class="x">✕</button>' : ''}`;
    btn.querySelector('span').onclick = () => { c.activePage = pid; saveStore(); renderPage(); renderTabs(); };
    if (editMode) {
      btn.querySelector('span').ondblclick = () => {
        const v = prompt('페이지 이름?', p.name); if (v) { p.name = v; saveStore(); renderTabs(); }
      };
      const x = btn.querySelector('.x');
      if (x) x.onclick = () => {
        if (!confirm(`"${p.name}" 삭제?`)) return;
        delete c.pages[pid]; c.pageOrder = c.pageOrder.filter(x => x !== pid);
        if (c.activePage === pid) c.activePage = c.pageOrder[0];
        saveStore(); renderTabs(); renderPage();
      };
    }
    tabs.appendChild(btn);
  });
  if (editMode) {
    const add = document.createElement('button');
    add.className = 'tab'; add.textContent = '+ 페이지';
    add.onclick = () => {
      const name = prompt('페이지 이름?', '새 페이지'); if (!name) return;
      const p = newPage(name); c.pages[p.id] = p; c.pageOrder.push(p.id); c.activePage = p.id;
      saveStore(); renderTabs(); renderPage();
    };
    tabs.appendChild(add);
  }
}

function renderInfobox() {
  const c = getActive();
  const ib = c.infobox;
  const box = $('#infobox');
  box.innerHTML = '';

  // Image
  if (ib.image || editMode) {
    const wrap = document.createElement('div');
    if (ib.image) {
      const img = document.createElement('img');
      img.src = ib.image; img.className = 'ib-img ' + (ib.imageFilter || '');
      img.onclick = () => openLightbox(ib.image);
      wrap.appendChild(img);
    }
    if (editMode) {
      const lbl = document.createElement('label');
      lbl.className = 'btn-sm'; lbl.textContent = ib.image ? '이미지 변경' : '+ 이미지 업로드';
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = 'image/*'; inp.hidden = true;
      inp.onchange = e => readImage(e.target.files[0], src => { ib.image = src; saveStore(); renderInfobox(); });
      lbl.appendChild(inp);
      wrap.appendChild(lbl);
      if (ib.image) {
        const filt = document.createElement('select');
        ['', 'filt-bw','filt-sepia','filt-sharp','filt-soft'].forEach(f => {
          const o = document.createElement('option'); o.value = f;
          o.textContent = {'':'필터 없음','filt-bw':'흑백','filt-sepia':'세피아','filt-sharp':'선명','filt-soft':'소프트'}[f];
          if (ib.imageFilter === f) o.selected = true;
          filt.appendChild(o);
        });
        filt.onchange = () => { ib.imageFilter = filt.value; saveStore(); renderInfobox(); };
        wrap.appendChild(filt);
      }
    }
    box.appendChild(wrap);

    // Caption
    if (ib.caption || editMode) {
      const cap = document.createElement('div');
      cap.className = 'ib-caption';
      cap.textContent = ib.caption || (editMode ? '캡션 입력...' : '');
      makeEditable(cap, v => { ib.caption = v; saveStore(); });
      box.appendChild(cap);
    }
  }

  // Rows
  ib.rows.forEach((r, i) => {
    if (r.type === 'sub') {
      const el = document.createElement('div');
      el.className = 'ib-sub';
      el.textContent = r.label;
      makeEditable(el, v => { r.label = v; saveStore(); });
      box.appendChild(el);
    } else {
      const row = document.createElement('div');
      row.className = 'ib-row';
      const k = document.createElement('div'); k.className = 'ib-key'; k.textContent = r.key;
      const v = document.createElement('div'); v.textContent = r.value;
      makeEditable(k, val => { r.key = val; saveStore(); });
      makeEditable(v, val => { r.value = val; saveStore(); });
      row.appendChild(k); row.appendChild(v);
      box.appendChild(row);
    }
  });

  if (editMode) {
    const tools = document.createElement('div');
    tools.style.marginTop = '10px';
    tools.innerHTML = `
      <button class="add-btn">+ 항목</button>
      <button class="add-btn">+ 소제목</button>
      <button class="add-btn">- 마지막</button>`;
    const [b1, b2, b3] = tools.querySelectorAll('button');
    b1.onclick = () => { ib.rows.push({ type:'row', key:'항목', value:'값' }); saveStore(); renderInfobox(); };
    b2.onclick = () => { ib.rows.push({ type:'sub', label:'소제목' }); saveStore(); renderInfobox(); };
    b3.onclick = () => { ib.rows.pop(); saveStore(); renderInfobox(); };
    box.appendChild(tools);
  }
}

function renderSections() {
  const page = getActivePage();
  const wrap = $('#sections');
  wrap.innerHTML = '';
  page.sections.forEach((s, idx) => wrap.appendChild(buildSec(s, idx, page)));

  if (editMode) {
    const picker = document.createElement('div');
    picker.className = 'sec-picker';
    picker.innerHTML = '<strong style="width:100%">+ 섹션 추가:</strong>';
    SECTION_TYPES.forEach(([t, label]) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.onclick = () => {
        page.sections.push(blankSection(t));
        saveStore(); renderSections(); renderTOC();
      };
      picker.appendChild(b);
    });
    wrap.appendChild(picker);
  }
  renderTOC();
}

function blankSection(type) {
  const base = { id: uid(), type, title: SECTION_TYPES.find(x=>x[0]===type)[1].slice(2) };
  switch(type) {
    case 'text': return { ...base, body:'내용을 입력하세요.' };
    case 'list': return { ...base, items:['항목 1','항목 2'] };
    case 'stats': return { ...base, items:[{name:'공격력', value:80, max:100},{name:'방어력', value:60, max:100}] };
    case 'relations': return { ...base, items:[{name:'친구 A', role:'친구', desc:'설명', img:''}] };
    case 'timeline': return { ...base, items:[{date:'1세', event:'태어남'},{date:'10세', event:'각성'}] };
    case 'quotes': return { ...base, items:[{text:'명대사', src:'1화'}] };
    case 'gallery': return { ...base, items:[] };
    case 'youtube': return { ...base, urls:[''] };
    case 'external': return { ...base, items:[{label:'공식 사이트', url:'https://example.com'}] };
    case 'spoiler': return { ...base, body:'스포일러 내용 (클릭하여 표시)' };
    case 'table': return { ...base, headers:['이름','값'], rows:[['행1', '값1']] };
  }
}

function buildSec(s, idx, page) {
  const el = document.createElement('section');
  el.className = 'sec';
  el.dataset.id = s.id;
  el.draggable = editMode;

  const tools = editMode ? `<div class="sec-tools">
    <button data-act="up">▲</button><button data-act="dn">▼</button><button data-act="del">✕</button>
  </div>` : '';

  const titleH = `<h2>${tools}<span class="sec-title">${escapeHtml(s.title)}</span></h2>`;
  el.innerHTML = titleH;

  const titleEl = el.querySelector('.sec-title');
  makeEditable(titleEl, v => { s.title = v; saveStore(); renderTOC(); });

  if (editMode) {
    el.addEventListener('dragstart', e => { el.classList.add('dragging'); e.dataTransfer.effectAllowed='move'; e.dataTransfer.setData('text/plain', s.id); });
    el.addEventListener('dragend', () => el.classList.remove('dragging'));
    el.addEventListener('dragover', e => { e.preventDefault(); });
    el.addEventListener('drop', e => {
      e.preventDefault();
      const srcId = e.dataTransfer.getData('text/plain');
      const srcIdx = page.sections.findIndex(x => x.id === srcId);
      if (srcIdx < 0 || srcIdx === idx) return;
      const [moved] = page.sections.splice(srcIdx, 1);
      page.sections.splice(idx, 0, moved);
      saveStore(); renderSections();
    });
    el.querySelectorAll('.sec-tools button').forEach(b => {
      b.onclick = () => {
        const act = b.dataset.act;
        if (act === 'del') { if(confirm('삭제?')){ page.sections.splice(idx,1); saveStore(); renderSections(); } }
        if (act === 'up' && idx>0) { [page.sections[idx-1],page.sections[idx]]=[page.sections[idx],page.sections[idx-1]]; saveStore(); renderSections(); }
        if (act === 'dn' && idx<page.sections.length-1) { [page.sections[idx+1],page.sections[idx]]=[page.sections[idx],page.sections[idx+1]]; saveStore(); renderSections(); }
      };
    });
  }

  const body = document.createElement('div');
  el.appendChild(body);
  renderSecBody(s, body);
  return el;
}

function renderSecBody(s, body) {
  body.innerHTML = '';
  switch(s.type) {
    case 'text': {
      const p = document.createElement('div');
      p.innerHTML = (s.body || '').replace(/\n/g,'<br>');
      makeEditable(p, v => { s.body = v.replace(/<br\s*\/?>/gi,'\n').replace(/<[^>]+>/g,''); saveStore(); }, true);
      body.appendChild(p);
      break;
    }
    case 'list': {
      const ul = document.createElement('ul');
      s.items.forEach((it,i)=>{
        const li = document.createElement('li');
        li.textContent = it;
        makeEditable(li, v => { s.items[i] = v; saveStore(); });
        if (editMode) {
          const x = document.createElement('button'); x.className='x'; x.textContent='✕'; x.style.cssText='background:transparent;border:0;opacity:.5;margin-left:6px';
          x.onclick = () => { s.items.splice(i,1); saveStore(); renderSecBody(s,body); };
          li.appendChild(x);
        }
        ul.appendChild(li);
      });
      body.appendChild(ul);
      addBtn(body, '+ 항목', () => { s.items.push('새 항목'); saveStore(); renderSecBody(s,body); });
      break;
    }
    case 'stats': {
      s.items.forEach((it,i)=>{
        const row = document.createElement('div'); row.className='stat';
        const n = document.createElement('div'); n.textContent = it.name;
        const bar = document.createElement('div'); bar.className='stat-bar';
        const fill = document.createElement('div'); fill.style.width = Math.min(100, it.value/it.max*100) + '%';
        bar.appendChild(fill);
        const v = document.createElement('div'); v.textContent = it.value;
        makeEditable(n, val=>{ it.name=val; saveStore(); });
        makeEditable(v, val=>{ it.value = parseInt(val)||0; saveStore(); renderSecBody(s,body); });
        row.appendChild(n); row.appendChild(bar); row.appendChild(v);
        body.appendChild(row);
      });
      addBtn(body, '+ 능력치', () => { s.items.push({name:'새 능력', value:50, max:100}); saveStore(); renderSecBody(s,body); });
      break;
    }
    case 'relations': {
      s.items.forEach((it,i)=>{
        const row = document.createElement('div'); row.className='rel';
        const av = document.createElement('div'); av.className='rel-avatar';
        if (it.img) av.style.backgroundImage=`url(${it.img})`;
        const info = document.createElement('div'); info.style.flex='1';
        const n = document.createElement('div'); n.innerHTML = `<strong>${escapeHtml(it.name)}</strong> <small style="color:var(--muted)">${escapeHtml(it.role)}</small>`;
        const d = document.createElement('div'); d.style.fontSize='.9em'; d.textContent = it.desc;
        info.appendChild(n); info.appendChild(d);
        row.appendChild(av); row.appendChild(info);
        if (editMode) {
          row.style.cursor='pointer';
          row.onclick = () => {
            const name = prompt('이름?', it.name); if (name===null) return;
            const role = prompt('관계?', it.role); if (role===null) return;
            const desc = prompt('설명?', it.desc); if (desc===null) return;
            it.name=name; it.role=role; it.desc=desc; saveStore(); renderSecBody(s,body);
          };
          const x = document.createElement('button'); x.textContent='✕'; x.style.cssText='background:transparent;border:0';
          x.onclick = e => { e.stopPropagation(); s.items.splice(i,1); saveStore(); renderSecBody(s,body); };
          row.appendChild(x);
        }
        body.appendChild(row);
      });
      addBtn(body, '+ 관계', () => { s.items.push({name:'새 인물', role:'관계', desc:'설명', img:''}); saveStore(); renderSecBody(s,body); });
      break;
    }
    case 'timeline': {
      const tl = document.createElement('div'); tl.className='tl';
      s.items.forEach((it,i)=>{
        const item = document.createElement('div'); item.className='tl-item';
        const d = document.createElement('div'); d.className='tl-date'; d.textContent = it.date;
        const e = document.createElement('div'); e.textContent = it.event;
        makeEditable(d, v=>{ it.date=v; saveStore(); });
        makeEditable(e, v=>{ it.event=v; saveStore(); });
        item.appendChild(d); item.appendChild(e);
        if (editMode) {
          const x = document.createElement('button'); x.textContent='✕'; x.style.cssText='background:transparent;border:0;float:right';
          x.onclick = () => { s.items.splice(i,1); saveStore(); renderSecBody(s,body); };
          item.appendChild(x);
        }
        tl.appendChild(item);
      });
      body.appendChild(tl);
      addBtn(body, '+ 사건', () => { s.items.push({date:'시점', event:'사건'}); saveStore(); renderSecBody(s,body); });
      break;
    }
    case 'quotes': {
      s.items.forEach((it,i)=>{
        const q = document.createElement('div'); q.className='quote';
        const t = document.createElement('div'); t.textContent = '"' + it.text + '"';
        const src = document.createElement('span'); src.className='src'; src.textContent = '— ' + it.src;
        makeEditable(t, v=>{ it.text=v.replace(/^"|"$/g,''); saveStore(); });
        makeEditable(src, v=>{ it.src=v.replace(/^—\s*/,''); saveStore(); });
        q.appendChild(t); q.appendChild(src);
        if (editMode) {
          const x = document.createElement('button'); x.textContent='✕'; x.style.cssText='background:transparent;border:0;float:right';
          x.onclick = () => { s.items.splice(i,1); saveStore(); renderSecBody(s,body); };
          q.appendChild(x);
        }
        body.appendChild(q);
      });
      addBtn(body, '+ 어록', () => { s.items.push({text:'명대사', src:'출처'}); saveStore(); renderSecBody(s,body); });
      break;
    }
    case 'gallery': {
      const g = document.createElement('div'); g.className='gallery';
      s.items.forEach((src,i)=>{
        const wrap = document.createElement('div'); wrap.style.position='relative';
        const img = document.createElement('img'); img.src=src;
        img.onclick = () => openLightbox(src);
        wrap.appendChild(img);
        if (editMode) {
          const x = document.createElement('button'); x.textContent='✕';
          x.style.cssText='position:absolute;top:4px;right:4px;background:rgba(0,0,0,.6);color:#fff;border:0;border-radius:50%;width:22px;height:22px';
          x.onclick = () => { s.items.splice(i,1); saveStore(); renderSecBody(s,body); };
          wrap.appendChild(x);
        }
        g.appendChild(wrap);
      });
      body.appendChild(g);
      if (editMode) {
        const lbl = document.createElement('label'); lbl.className='add-btn'; lbl.style.display='inline-flex';
        lbl.textContent = '+ 이미지';
        const inp = document.createElement('input'); inp.type='file'; inp.accept='image/*'; inp.multiple=true; inp.hidden=true;
        inp.onchange = e => {
          [...e.target.files].forEach(f => readImage(f, src => { s.items.push(src); saveStore(); renderSecBody(s,body); }));
        };
        lbl.appendChild(inp); body.appendChild(lbl);
      }
      break;
    }
    case 'youtube': {
      s.urls.forEach((url,i)=>{
        if (!url) return;
        const id = ytId(url); if (!id) return;
        const w = document.createElement('div'); w.className='yt-wrap';
        w.innerHTML = `<iframe src="https://www.youtube.com/embed/${id}" allowfullscreen></iframe>`;
        body.appendChild(w);
        if (editMode) {
          const x = document.createElement('button'); x.textContent='✕ 삭제'; x.className='btn-sm';
          x.style.marginTop='4px';
          x.onclick = () => { s.urls.splice(i,1); saveStore(); renderSecBody(s,body); };
          body.appendChild(x);
        }
      });
      if (editMode) addBtn(body, '+ 유튜브 URL', () => {
        const u = prompt('YouTube URL?'); if (u){ s.urls.push(u); saveStore(); renderSecBody(s,body); }
      });
      break;
    }
    case 'external': {
      s.items.forEach((it,i)=>{
        const a = document.createElement('a'); a.className='ext-link'; a.href=it.url; a.target='_blank'; a.rel='noopener';
        a.innerHTML = `🔗 <span>${escapeHtml(it.label)}</span>`;
        body.appendChild(a);
        if (editMode) {
          a.onclick = e => {
            e.preventDefault();
            const lbl = prompt('표시 이름?', it.label); if (lbl===null) return;
            const url = prompt('URL?', it.url); if (url===null) return;
            it.label=lbl; it.url=url; saveStore(); renderSecBody(s,body);
          };
        }
      });
      addBtn(body, '+ 링크', () => { s.items.push({label:'새 링크', url:'https://'}); saveStore(); renderSecBody(s,body); });
      break;
    }
    case 'spoiler': {
      const sp = document.createElement('div'); sp.className='spoiler';
      sp.textContent = s.body;
      sp.onclick = () => sp.classList.toggle('open');
      makeEditable(sp, v=>{ s.body=v; saveStore(); });
      body.appendChild(sp);
      break;
    }
    case 'table': {
      const t = document.createElement('table'); t.className='tbl';
      const thead = document.createElement('thead'); const trh = document.createElement('tr');
      s.headers.forEach((h,ci)=>{
        const th = document.createElement('th'); th.textContent = h;
        makeEditable(th, v=>{ s.headers[ci]=v; saveStore(); });
        trh.appendChild(th);
      });
      thead.appendChild(trh); t.appendChild(thead);
      const tb = document.createElement('tbody');
      s.rows.forEach((r,ri)=>{
        const tr = document.createElement('tr');
        r.forEach((cell,ci)=>{
          const td = document.createElement('td'); td.textContent = cell;
          makeEditable(td, v=>{ s.rows[ri][ci]=v; saveStore(); });
          tr.appendChild(td);
        });
        if (editMode) {
          const td = document.createElement('td');
          const x = document.createElement('button'); x.textContent='✕'; x.style.cssText='background:transparent;border:0';
          x.onclick = () => { s.rows.splice(ri,1); saveStore(); renderSecBody(s,body); };
          td.appendChild(x); tr.appendChild(td);
        }
        tb.appendChild(tr);
      });
      t.appendChild(tb); body.appendChild(t);
      if (editMode) {
        addBtn(body, '+ 행', () => { s.rows.push(s.headers.map(()=>'-')); saveStore(); renderSecBody(s,body); });
        addBtn(body, '+ 열', () => { s.headers.push('새 열'); s.rows.forEach(r=>r.push('-')); saveStore(); renderSecBody(s,body); });
      }
      break;
    }
  }
}

function addBtn(parent, text, onclick) {
  if (!editMode) return;
  const b = document.createElement('button'); b.className='add-btn'; b.style.display='inline-flex';
  b.textContent = text; b.onclick = onclick;
  parent.appendChild(b);
}

function renderTOC() {
  const toc = $('#toc');
  const page = getActivePage();
  if (!page.sections.length) { toc.innerHTML = ''; return; }
  toc.innerHTML = '<strong>📑 목차</strong><ul></ul>';
  const ul = toc.querySelector('ul');
  page.sections.forEach(s => {
    const li = document.createElement('li');
    li.textContent = s.title;
    li.dataset.id = s.id;
    li.onclick = () => {
      const el = document.querySelector(`[data-id="${s.id}"]`);
      if (el) el.scrollIntoView({behavior:'smooth', block:'start'});
    };
    ul.appendChild(li);
  });
}

function renderPage() {
  renderInfobox();
  renderSections();
}

function renderAll() {
  applySettings();
  renderSidebar();
  renderTitleBlock();
  renderTabs();
  renderPage();
}

// ---------- Edit helpers ----------
function makeEditable(el, onSave, multiline=false) {
  if (!editMode) return;
  el.contentEditable = 'true';
  el.spellcheck = false;
  el.addEventListener('blur', () => onSave(el.textContent.trim()));
  el.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !multiline) { e.preventDefault(); el.blur(); }
  });
}

function readImage(file, cb) {
  if (!file) return;
  const r = new FileReader();
  r.onload = () => cb(r.result);
  r.readAsDataURL(file);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function ytId(url) {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

function openLightbox(src) {
  $('#lbImg').src = src;
  $('#lightbox').classList.remove('hidden');
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.add('hidden'), 2500);
}

// ---------- Wiring ----------
function wire() {
  // Edit mode
  $('#editToggle').onclick = () => {
    editMode = !editMode;
    document.body.classList.toggle('editing', editMode);
    $('#editToggle').textContent = editMode ? '👁 보기' : '✏️ 편집';
    renderAll();
  };
  $('#saveBtn').onclick = () => { saveStore(); toast('저장됨'); };

  // Title editable on dblclick when edit mode
  $('#title').addEventListener('dblclick', () => {
    if (!editMode) return;
    const v = prompt('이름?', getActive().name); if (v) { getActive().name = v; saveStore(); renderAll(); }
  });
  $('#subtitle').addEventListener('dblclick', () => {
    if (!editMode) return;
    const v = prompt('부제목?', getActive().subtitle); if (v!==null) { getActive().subtitle = v; saveStore(); renderTitleBlock(); }
  });

  // Sidebar
  $('#sidebarToggle').onclick = () => document.body.classList.toggle('sb-open');
  $('#sidebarOverlay').onclick = () => document.body.classList.remove('sb-open');
  $('#charSearch').oninput = renderSidebar;
  $('#addCharBtn').onclick = () => {
    const name = prompt('새 캐릭터 이름?', '새 캐릭터'); if (!name) return;
    const c = newChar(name); store.chars.push(c); store.activeId = c.id;
    saveStore(); renderAll();
  };

  // Backup
  $('#exportBtn').onclick = () => {
    const blob = new Blob([JSON.stringify(store, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `charawiki_${Date.now()}.json`; a.click();
    toast('백업 완료');
  };
  $('#importBtn').onclick = () => $('#importFile').click();
  $('#importFile').onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { try { store = JSON.parse(r.result); saveStore(); renderAll(); toast('불러오기 완료'); } catch(err){ toast('파일 오류'); } };
    r.readAsText(f);
  };
  $('#shareBtn').onclick = () => {
    // 이미지 제외 사본
    const copy = JSON.parse(JSON.stringify(store));
    copy.chars.forEach(c => {
      c.cover=''; c.avatar=''; c.infobox.image='';
      Object.values(c.pages).forEach(p => p.sections.forEach(s => { if (s.type==='gallery') s.items=[]; }));
    });
    const url = location.origin + location.pathname + '#share=' + btoa(encodeURIComponent(JSON.stringify(copy)));
    navigator.clipboard.writeText(url).then(()=>toast('공유 링크 복사됨 (이미지 제외)')).catch(()=>prompt('공유 링크', url));
  };

  // Theme & deco panel
  $('#themeBtn').onclick = () => $('#themePanel').classList.toggle('hidden');
  $('#decoBtn').onclick = () => $('#decoPanel').classList.toggle('hidden');

  $$('#themePanel [data-theme]').forEach(b => b.onclick = () => { getActive().settings.theme = b.dataset.theme; saveStore(); applySettings(); });
  $$('#themePanel [data-font]').forEach(b => b.onclick = () => { getActive().settings.font = b.dataset.font; saveStore(); applySettings(); });
  $$('#accentRow [data-accent]').forEach(b => b.onclick = () => { getActive().settings.accent = b.dataset.accent; saveStore(); applySettings(); });
  $('#accentPicker').oninput = e => { getActive().settings.accent = e.target.value; saveStore(); applySettings(); };
  $('#fontSize').oninput = e => { getActive().settings.fontSize = +e.target.value; saveStore(); applySettings(); };

  $$('#decoPanel [data-infobox]').forEach(b => b.onclick = () => { getActive().settings.infobox = b.dataset.infobox; saveStore(); applySettings(); });
  $$('#decoPanel [data-layout]').forEach(b => b.onclick = () => { getActive().settings.layout = b.dataset.layout; saveStore(); applySettings(); });
  $$('#decoPanel [data-pattern]').forEach(b => b.onclick = () => { getActive().settings.pattern = b.dataset.pattern; saveStore(); applySettings(); });
  $$('#decoPanel [data-divider]').forEach(b => b.onclick = () => { getActive().settings.divider = b.dataset.divider; saveStore(); applySettings(); });

  $('#coverUpload').onchange = e => readImage(e.target.files[0], src => { getActive().cover = src; saveStore(); renderTitleBlock(); });
  $('#coverRemove').onclick = () => { getActive().cover = ''; saveStore(); renderTitleBlock(); };
  $('#avatarUpload').onchange = e => readImage(e.target.files[0], src => { getActive().avatar = src; saveStore(); renderTitleBlock(); });

  // Lightbox
  $('#lightbox').onclick = () => $('#lightbox').classList.add('hidden');

  // Read progress + top button + TOC scroll
  window.addEventListener('scroll', () => {
    const h = document.documentElement;
    const pct = h.scrollTop / (h.scrollHeight - h.clientHeight) * 100;
    $('#readBar').style.width = pct + '%';
    $('#topBtn').classList.toggle('show', h.scrollTop > 400);

    // TOC active
    const sections = $$('#sections .sec');
    let activeId = null;
    sections.forEach(s => { if (s.getBoundingClientRect().top < 120) activeId = s.dataset.id; });
    $$('#toc li').forEach(li => li.classList.toggle('active', li.dataset.id === activeId));
  });
  $('#topBtn').onclick = () => window.scrollTo({top:0, behavior:'smooth'});

  // Hotkeys
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveStore(); toast('저장됨'); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') { e.preventDefault(); $('#editToggle').click(); }
  });
}

// ---------- Init ----------
wire();
renderAll();
