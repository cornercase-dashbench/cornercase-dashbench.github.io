// DashBench project page. Template helpers (copyBibTeX, scrollToTop) come from the
// Academic Project Page Template; data lives in static/js/data.js.

const PROMPT_COLS = ['Q1', 'Q2', 'Q3', 'Q4R', 'Q5'];
const FAMILY_CLASS = { 'Closed-source': 'fam-closed', 'Open-source': 'fam-open', 'Specialist': 'fam-spec' };
const FAMILY_COLOR = { 'Closed-source': '#f8a800', 'Open-source': '#64748b', 'Specialist': '#d63a2f' };
const FAMILY_LABEL = { 'Closed-source': 'Closed-source', 'Open-source': 'Open-source', 'Specialist': 'Driving specialists' };

const PROMPT_INFO = {
  Q1: 'Unusual: explicitly asks the model to search for anomalies.',
  Q2: 'Dangerous: explicitly asks the model to search for hazards.',
  Q3: 'Describe: a plain scene description with no hint of danger. A model that truly understands the scene should mention the corner case on its own.',
  Q4: 'Detect + explain: a JSON answer with free-text reasoning (Q4R) and a true/false detection (Q4TF).',
  Q5: 'Definition-guided: defines what a corner case is, with examples, then asks the model to identify and describe one.'
};

const fmt = v => (v === null || v === undefined) ? '–' : v.toFixed(2);

function copyText(text, btn) {
  const done = () => {
    const old = btn.innerHTML;
    btn.classList.add('copied');
    btn.innerHTML = '<i class="fas fa-check"></i> Copied';
    setTimeout(() => { btn.classList.remove('copied'); btn.innerHTML = old; }, 1500);
  };
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(done);
  } else {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    done();
  }
}

// ---------- Template helpers ----------
function copyBibTeX() {
  const code = document.getElementById('bibtex-code');
  const button = document.querySelector('.copy-bibtex-btn');
  const label = button.querySelector('.copy-text');
  const finish = () => {
    button.classList.add('copied');
    label.textContent = 'Cop';
    setTimeout(() => { button.classList.remove('copied'); label.textContent = 'Copy'; }, 2000);
  };
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(code.textContent).then(finish);
  } else {
    copyText(code.textContent, document.createElement('button'));
    finish();
  }
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.addEventListener('scroll', () => {
  const btn = document.querySelector('.scroll-to-top');
  if (btn) btn.classList.toggle('visible', window.pageYOffset > 300);
}, { passive: true });

// ---------- Example gallery: one large viewer ----------
const viewer = { list: [], idx: 0, frame: 0, timer: null };

function frameSrc(ex, i) {
  return `static/examples/${ex.id}/${String(i).padStart(2, '0')}.jpg`;
}

function preloadExample(ex) {
  if (!ex || ex._preloaded) return;
  ex._preloaded = true;
  for (let i = 0; i < ex.n; i++) { const im = new Image(); im.src = frameSrc(ex, i); }
}

function showFrame(i) {
  const ex = viewer.list[viewer.idx];
  if (ex.video) return;
  viewer.frame = i;
  const img = document.getElementById('viewerImg');
  img.src = frameSrc(ex, i);
  img.alt = `${ex.category}: frame ${i + 1} of ${ex.n}`;
  document.getElementById('viewerSlider').value = i;
  document.getElementById('viewerFrame').textContent = `Frame ${i + 1} / ${ex.n}`;
}

function setPlaying(on) {
  clearInterval(viewer.timer);
  viewer.timer = null;
  const btn = document.getElementById('viewerPlay');
  if (on) {
    viewer.timer = setInterval(() => {
      const ex = viewer.list[viewer.idx];
      showFrame((viewer.frame + 1) % ex.n);
    }, 300);
  }
  btn.innerHTML = on ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
  btn.setAttribute('aria-label', on ? 'Pause' : 'Play');
}

function showExample(idx) {
  const n = viewer.list.length;
  viewer.idx = (idx + n) % n;
  const ex = viewer.list[viewer.idx];
  document.getElementById('viewerSlider').max = ex.n - 1;
  document.getElementById('viewerTags').innerHTML =
    `<span class="tag-pill ${ex.type}">${ex.type === 'collision' ? 'Collision' : 'Non-collision'}</span>` ;
  document.getElementById('viewerCategory').textContent = ex.category;
  document.getElementById('viewerGt').textContent = ex.gt;
  document.querySelectorAll('#viewerDots .viewer-dot').forEach((d, i) => d.classList.toggle('active', i === viewer.idx));
  const vid = document.getElementById('viewerVideo');
  const isVid = !!ex.video;
  document.getElementById('viewerImg').hidden = isVid;
  vid.hidden = !isVid;
  document.getElementById('viewerControls').hidden = isVid;
  document.getElementById('viewerFrame').hidden = isVid;
  if (isVid) {
    setPlaying(false);
    vid.src = ex.video;
    vid.play().catch(() => {});
  } else {
    vid.pause();
    vid.removeAttribute('src');
    vid.load();
    preloadExample(ex);
    preloadExample(viewer.list[(viewer.idx + 1) % n]);
    showFrame(0);
    setPlaying(true);
  }
}

function buildDots() {
  const dots = document.getElementById('viewerDots');
  dots.innerHTML = '';
  viewer.list.forEach((ex, i) => {
    const d = document.createElement('button');
    d.className = 'viewer-dot';
    d.setAttribute('aria-label', `Example ${i + 1}: ${ex.category}`);
    d.addEventListener('click', () => showExample(i));
    dots.appendChild(d);
  });
}

function initGallery() {
  const filters = [
    ['All', () => true],
    ['Collision', ex => ex.type === 'collision'],
    ['Non-collision', ex => ex.type === 'non-collision'],
  ];
  const row = document.getElementById('galleryFilters');
  filters.forEach(([label, pred], i) => {
    const b = document.createElement('button');
    b.className = 'pill' + (i === 0 ? ' active' : '');
    b.textContent = label;
    b.addEventListener('click', () => {
      row.querySelectorAll('.pill').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      viewer.list = EXAMPLES.filter(pred);
      buildDots();
      showExample(0);
    });
    row.appendChild(b);
  });

  viewer.list = EXAMPLES.slice();
  buildDots();

  document.getElementById('viewerPrev').addEventListener('click', () => showExample(viewer.idx - 1));
  document.getElementById('viewerNext').addEventListener('click', () => showExample(viewer.idx + 1));
  document.getElementById('viewerPlay').addEventListener('click', () => setPlaying(!viewer.timer));
  document.getElementById('viewerSlider').addEventListener('input', e => { setPlaying(false); showFrame(+e.target.value); });

  const box = document.getElementById('viewer');
  box.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); showExample(viewer.idx - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); showExample(viewer.idx + 1); }
    if (e.key === ' ' && !viewer.list[viewer.idx].video) { e.preventDefault(); setPlaying(!viewer.timer); }
  });

  // Swipe on touch screens
  let x0 = null;
  const stage = box.querySelector('.viewer-stage');
  stage.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) showExample(viewer.idx + (dx < 0 ? 1 : -1));
    x0 = null;
  });

  // Only animate while the viewer is on screen.
  showExample(0);
  new IntersectionObserver(entries => {
    entries.forEach(en => setPlaying(en.isIntersecting));
  }, { threshold: 0.3 }).observe(stage);
}

// ---------- Prompts ----------
function initPrompts() {
  const tabs = document.getElementById('promptTabs');
  const text = document.getElementById('promptText');
  const desc = document.getElementById('promptDesc');
  const select = key => {
    tabs.querySelectorAll('.pill').forEach(t => t.classList.toggle('active', t.dataset.key === key));
    text.textContent = PROMPTS[key];
    desc.textContent = `${key} · ${PROMPT_INFO[key]}`;
  };
  Object.keys(PROMPTS).forEach(key => {
    const t = document.createElement('button');
    t.className = 'pill';
    t.dataset.key = key;
    t.textContent = key;
    t.addEventListener('click', () => select(key));
    tabs.appendChild(t);
  });
  select('Q1');
  document.getElementById('copyPrompt').addEventListener('click', e => copyText(text.textContent, e.currentTarget));
}

// ---------- Leaderboard ----------
const lbState = { sortKey: null, sortDir: -1, family: 'all', grouped: true };

function rankWithinFamily(rows, key) {
  // Returns {model: 'best'|'second'} for a column within each family.
  const out = {};
  [...new Set(rows.map(r => r.family))].forEach(f => {
    const fam = rows.filter(r => r.family === f && r[key] !== null);
    const vals = [...new Set(fam.map(r => r[key]))].sort((a, b) => b - a);
    fam.forEach(r => {
      if (r[key] === vals[0]) out[r.model] = 'best';
      else if (vals.length > 2 && r[key] === vals[1]) out[r.model] = 'second';
    });
  });
  return out;
}

function renderLeaderboard() {
  const table = document.getElementById('leaderboardTable');
  const cols = [...PROMPT_COLS, 'Avg', 'Q4TF'];
  const marks = {};
  PROMPT_COLS.forEach(c => { marks[c] = rankWithinFamily(LEADERBOARD, c); });
  const overall = [...LEADERBOARD].sort((a, b) => b.Avg - a.Avg).map(r => r.model);

  let rows = LEADERBOARD.filter(r => lbState.family === 'all' || r.family === lbState.family);
  if (lbState.sortKey) {
    const k = lbState.sortKey;
    rows = [...rows].sort((a, b) => {
      if (k === 'model') return lbState.sortDir * a.model.localeCompare(b.model);
      if (a[k] === null) return 1;  // missing values always last
      if (b[k] === null) return -1;
      return lbState.sortDir * (a[k] - b[k]);
    });
  }
  const familyOrder = ['Closed-source', 'Open-source', 'Specialist'];
  if (lbState.grouped) {
    rows = [...rows].sort((a, b) => familyOrder.indexOf(a.family) - familyOrder.indexOf(b.family));
  }

  const head = ['#', 'Model', ...cols].map((c, i) => {
    if (i === 0) return '<th class="rank-cell">#</th>';
    const key = c === 'Model' ? 'model' : c;
    const sorted = lbState.sortKey === key;
    const ind = sorted ? (lbState.sortDir === -1 ? '▼' : '▲') : '';
    const extra = (c === 'Avg' ? ' avg-bar-cell' : '') + (c === 'Model' ? ' left' : '');
    return `<th class="sortable${sorted ? ' sorted' : ''}${extra}" data-key="${key}">${c}<span class="sort-ind">${ind}</span></th>`;
  }).join('');

  const maxAvg = Math.max(...LEADERBOARD.map(r => r.Avg));
  let body = '';
  let lastFam = null;
  rows.forEach(r => {
    if (lbState.grouped && r.family !== lastFam) {
      body += `<tr class="group-row"><td colspan="${cols.length + 2}"><span class="family-dot ${FAMILY_CLASS[r.family]}"></span>${FAMILY_LABEL[r.family]}</td></tr>`;
      lastFam = r.family;
    }
    const cells = cols.map(c => {
      const v = r[c];
      if (v === null) return '<td class="na">–</td>';
      if (c === 'Avg') {
        const w = (v / maxAvg * 100).toFixed(1);
        return `<td class="avg-col avg-bar-cell"><div class="avg-bar"><div class="fill" style="width:${(w * 1.7).toFixed(1)}px;background:${FAMILY_COLOR[r.family]}"></div><strong>${fmt(v)}</strong></div></td>`;
      }
      const m = marks[c] && marks[c][r.model];
      return `<td class="${m || ''}">${fmt(v)}</td>`;
    }).join('');
    body += `<tr><td class="rank-cell">${overall.indexOf(r.model) + 1}</td><td class="left">${r.model}</td>${cells}</tr>`;
  });

  table.innerHTML = `<thead><tr>${head}</tr></thead><tbody>${body}</tbody>`;
  table.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.key;
      if (lbState.sortKey === key) lbState.sortDir *= -1;
      else { lbState.sortKey = key; lbState.sortDir = key === 'model' ? 1 : -1; }
      renderLeaderboard();
    });
  });
}

function initLeaderboard() {
  document.querySelectorAll('#familyFilter .pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#familyFilter .pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      lbState.family = btn.dataset.family;
      renderLeaderboard();
    });
  });
  document.getElementById('groupToggle').addEventListener('change', e => {
    lbState.grouped = e.target.checked;
    renderLeaderboard();
  });
  renderLeaderboard();
}

// ---------- Experiment tables ----------
function deltaSpan(after, before) {
  const d = after - before;
  return `<span class="${d >= 0 ? 'delta-up' : 'delta-down'}">${d >= 0 ? '+' : '−'}${Math.abs(d).toFixed(2)}</span>`;
}

function renderCompareTable(id, header, groups) {
  // groups: [[label, baseValues, [[rowLabel, values], ...]]]
  const cols = [...PROMPT_COLS, 'Avg', 'Q4TF'];
  const head = `<thead><tr><th>${header}</th>${cols.map(c => `<th${c === 'Avg' ? ' class="avg-col"' : ''}>${c}</th>`).join('')}</tr></thead>`;
  let body = '';
  groups.forEach(([label, base, variants]) => {
    body += `<tr><td class="left"><strong>${label}</strong></td>${base.map((v, i) => `<td${i === 5 ? ' class="avg-col"' : ''}>${fmt(v)}</td>`).join('')}</tr>`;
    variants.forEach(([vl, vals]) => {
      body += `<tr><td class="left">&nbsp;&nbsp;${vl}</td>${vals.map((v, i) => `<td${i === 5 ? ' class="avg-col"' : ''}>${fmt(v)}${deltaSpan(v, base[i])}</td>`).join('')}</tr>`;
    });
  });
  document.getElementById(id).innerHTML = head + `<tbody>${body}</tbody>`;
}

// ---------- Section nav highlighting ----------
function initSectionNav() {
  const links = [...document.querySelectorAll('.section-nav a')];
  const targets = links.map(a => document.querySelector(a.getAttribute('href')));
  const onScroll = () => {
    let active = -1;
    targets.forEach((t, i) => { if (t && t.getBoundingClientRect().top < 120) active = i; });
    links.forEach((a, i) => a.classList.toggle('active', i === active));
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

document.addEventListener('DOMContentLoaded', () => {
  initGallery();
  initPrompts();
  initLeaderboard();
  renderCompareTable('ccwTable', 'Model', CCW.map(([m, full, ccw]) => [m, full, [['+ CCW', ccw]]]));
  renderCompareTable('mitigationTable', 'Method', [[MITIGATION[0][0], MITIGATION[0][1], MITIGATION.slice(1)]]);
  initSectionNav();
});
