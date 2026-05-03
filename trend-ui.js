/* trend-ui.js — Written trend analysis + digest modal */

// ── Style injection ──────────────────────────────────────────────────────────

function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* ── Horizon pills ──────────────────────────────────────────── */
    #section-trends { width: 100%; }

    .trend-horizon-bar {
      display: flex;
      gap: 8px;
      margin-bottom: 36px;
    }
    .horizon-pill {
      padding: 6px 18px;
      border-radius: 20px;
      border: 1.5px solid var(--border);
      background: transparent;
      color: var(--muted);
      font-size: 12px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: all var(--transition);
      letter-spacing: 0.3px;
    }
    .horizon-pill:hover { color: var(--white); border-color: #555; }
    .horizon-pill.active {
      background: var(--green);
      border-color: var(--green);
      color: #000;
    }

    /* ── Written analysis ───────────────────────────────────────── */
    .analysis-wrap { max-width: 720px; }

    .analysis-section { margin-bottom: 40px; }

    .analysis-heading {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: var(--muted);
      border-left: 3px solid var(--green);
      padding-left: 10px;
      margin: 0 0 4px 0;
      line-height: 1.4;
    }

    .analysis-meta {
      font-size: 12px;
      color: #4a4a4a;
      margin: 0 0 14px 0;
      padding-left: 13px;
    }

    .analysis-para {
      font-size: 15px;
      line-height: 1.75;
      color: #c8c8c8;
      font-weight: 300;
      margin: 0 0 12px 0;
    }
    .analysis-para em {
      font-style: normal;
      font-weight: 600;
      color: var(--white);
    }
    .analysis-para strong { font-weight: 600; color: var(--white); }

    .analysis-rising { color: var(--green); font-weight: 500; }

    .analysis-divider {
      height: 1px;
      background: var(--border);
      margin: 0 0 40px 0;
    }

    /* ── Cross-sector list ──────────────────────────────────────── */
    .analysis-cross-list {
      list-style: none;
      padding: 0;
      margin: 14px 0 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .analysis-cross-item {
      font-size: 14px;
      line-height: 1.6;
      color: #c8c8c8;
      font-weight: 300;
      padding-left: 16px;
      border-left: 2px solid var(--border);
    }
    .analysis-cross-item em {
      font-style: normal;
      font-weight: 600;
      color: var(--white);
    }

    /* ── Reddit community posts ─────────────────────────────────── */
    .analysis-reddit-list {
      list-style: none;
      padding: 0;
      margin: 14px 0 0;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .analysis-reddit-item {
      padding-left: 16px;
      border-left: 2px solid var(--border);
    }
    .analysis-reddit-link {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: var(--white);
      text-decoration: none;
      line-height: 1.5;
      transition: color var(--transition);
      margin-bottom: 2px;
    }
    .analysis-reddit-link:hover { color: var(--green); }
    .analysis-reddit-meta {
      font-size: 11px;
      color: #4a4a4a;
    }

    /* ── Wikipedia pulse ────────────────────────────────────────── */
    .analysis-wiki-list {
      list-style: none;
      padding: 0;
      margin: 14px 0 0;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 32px;
    }
    .analysis-wiki-item {
      display: flex;
      align-items: baseline;
      gap: 8px;
      font-size: 13px;
    }
    .analysis-wiki-link {
      color: #c8c8c8;
      text-decoration: none;
      font-weight: 400;
      flex: 1;
      min-width: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: color var(--transition);
    }
    .analysis-wiki-link:hover { color: var(--green); }
    .analysis-wiki-views {
      font-size: 11px;
      color: #4a4a4a;
      white-space: nowrap;
      flex-shrink: 0;
    }

    /* ── Loading state ──────────────────────────────────────────── */
    .analysis-loading {
      font-size: 12px;
      color: #4a4a4a;
      padding: 20px 0;
      font-style: italic;
    }
    @keyframes analysis-pulse {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 1; }
    }
    .analysis-loading { animation: analysis-pulse 1.6s ease infinite; }

    .analysis-empty {
      color: var(--muted);
      font-size: 14px;
      padding: 40px 0;
    }

    /* ── Digest modal ───────────────────────────────────────────── */
    .digest-item {
      display: flex !important;
      flex-direction: column !important;
      gap: 6px !important;
      padding: 16px !important;
      background: var(--surface2) !important;
      border-radius: 10px !important;
      border: 1px solid var(--border) !important;
      text-decoration: none !important;
      transition: border-color var(--transition) !important;
    }
    .digest-item:hover { border-color: rgba(29,185,84,0.4) !important; }
    .digest-item-header {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .digest-source { font-size: 11px; color: var(--muted); font-weight: 500; }
    .digest-time   { font-size: 11px; color: #555; margin-left: auto; }
    .digest-item-title {
      font-size: 15px;
      font-weight: 700;
      color: var(--white);
      line-height: 1.4;
      display: block;
      text-decoration: none;
      transition: color var(--transition);
    }
    .digest-item:hover .digest-item-title { color: var(--green); }
    .digest-item-takeaway {
      font-size: 13px;
      color: var(--muted);
      line-height: 1.6;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .digest-item-footer {
      font-size: 12px;
      font-weight: 600;
      color: var(--green);
      margin-top: 2px;
    }
    .digest-number { display: none !important; }
    .digest-content { display: contents; }
  `;
  document.head.appendChild(style);
}

injectStyles();

// ── Helpers ──────────────────────────────────────────────────────────────────

function _stripHtml(s) {
  return (s || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
    .replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g,' ')
    .replace(/\s+/g,' ').trim();
}

function _timeAgo(dateString) {
  if (!dateString) return '';
  const diff = Date.now() - new Date(dateString);
  const m = Math.floor(diff/60000), h = Math.floor(diff/3600000), d = Math.floor(diff/86400000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d === 1) return 'Yesterday';
  if (d < 7) return `${d}d ago`;
  return new Date(dateString).toLocaleDateString('en-US', { month:'short', day:'numeric' });
}

function _fmtScore(n) {
  if (!n) return '0';
  if (n >= 1000) return `${(n/1000).toFixed(1)}k`;
  return String(n);
}

function _fmtViews(n) {
  if (!n) return '0';
  if (n >= 1000000) return `${(n/1000000).toFixed(1)}M`;
  if (n >= 1000) return `${Math.round(n/1000)}k`;
  return String(n);
}

const CAT_CFG = {
  music:   { label:'Music Industry', color:'#9b59b6', chip:'music'   },
  tech:    { label:'Tech & AI',      color:'#4687D6', chip:'tech'    },
  pop:     { label:'Pop Culture',    color:'#E91E8C', chip:'pop'     },
  spotify: { label:'Spotify',        color:'#1DB954', chip:'spotify' },
};
function _cat(c) { return CAT_CFG[c] || CAT_CFG.spotify; }

function _termList(terms, n) {
  const t = terms.slice(0, n).map(x => `<em>${x.term}</em>`);
  if (!t.length) return '';
  if (t.length === 1) return t[0];
  if (t.length === 2) return `${t[0]} and ${t[1]}`;
  return `${t.slice(0,-1).join(', ')}, and ${t[t.length-1]}`;
}

// ── extractTakeaway ──────────────────────────────────────────────────────────

function extractTakeaway(article) {
  const raw = _stripHtml(article.description || '');
  if (!raw) return '';

  const sentences = raw.split(/(?<=[.!?])\s+(?=[A-Z"'"\(])/);
  if (!sentences.length) return raw.slice(0, 280);

  const titleWords = new Set(
    (article.title || '').toLowerCase().split(/\W+/).filter(w => w.length > 4)
  );
  const isTitleRepeat = s => {
    const sw = s.toLowerCase().split(/\W+/).filter(w => w.length > 4);
    const overlap = sw.filter(w => titleWords.has(w)).length;
    return sw.length > 0 && overlap / sw.length > 0.6;
  };

  const candidates = sentences.filter(s => s.trim().length >= 30 && !isTitleRepeat(s.trim()));
  const pool = candidates.length ? candidates : sentences;

  let result = '';
  for (const s of pool) {
    const next = result ? result + ' ' + s.trim() : s.trim();
    if (next.length > 280) break;
    result = next;
    if (result.length >= 100) break;
  }
  return result || raw.slice(0, 200);
}

// ── buildDigestItems ─────────────────────────────────────────────────────────

function buildDigestItems(articles) {
  const buckets = { spotify:[], music:[], tech:[], pop:[] };
  articles.forEach(a => { if (buckets[a.category]) buckets[a.category].push(a); });

  const picks = [];
  const order = ['spotify','music','tech','pop'];
  let idx = 0, running = true;
  while (picks.length < 8 && running) {
    running = false;
    for (const c of order) {
      if (buckets[c][idx]) { picks.push(buckets[c][idx]); running = true; }
      if (picks.length >= 8) break;
    }
    idx++;
  }

  if (!picks.length) return '<p class="analysis-empty">No articles loaded yet.</p>';

  return picks.map(a => {
    const cfg = _cat(a.category);
    const takeaway = extractTakeaway(a);
    return `
      <a href="${a.link}" target="_blank" rel="noopener noreferrer" class="digest-item">
        <div class="digest-item-header">
          <span class="category-chip ${cfg.chip}">${cfg.label}</span>
          <span class="digest-source">${a.source}</span>
          <span class="digest-time">${_timeAgo(a.pubDate)}</span>
        </div>
        <span class="digest-item-title">${a.title}</span>
        ${takeaway ? `<p class="digest-item-takeaway">${takeaway}</p>` : ''}
        <div class="digest-item-footer">Read article →</div>
      </a>`;
  }).join('');
}

// ── Article-based analysis writers ───────────────────────────────────────────

function _writeOverview(pool, horizonLabel, uniqueSources, overallTerms, risingTerms) {
  const top5 = overallTerms.slice(0, 5);

  if (!top5.length) {
    return `<div class="analysis-section">
      <h2 class="analysis-heading">What's Happening</h2>
      <p class="analysis-para">Not enough articles loaded yet. Refresh to pull the latest news.</p>
    </div>`;
  }

  const topStr  = _termList(top5, 3);
  const extra   = top5[3] ? `, and <em>${top5[3].term}</em>` : '';
  const rising3 = risingTerms.slice(0, 3);
  const risingStr = rising3.length ? _termList(rising3, 3) : '';

  return `
    <div class="analysis-section">
      <h2 class="analysis-heading">What's Happening</h2>
      <p class="analysis-meta">${pool.length} articles · ${uniqueSources} sources · ${horizonLabel}</p>
      <p class="analysis-para">
        Over ${horizonLabel}, the conversation across music, tech, and pop culture is being shaped by
        ${topStr}${extra}. These themes are surfacing across the tracked sources, reflecting the overlapping
        pressures Spotify and its peers are navigating.
      </p>
      ${risingStr ? `<p class="analysis-para">
        <span class="analysis-rising">🔥 Picking up speed:</span> ${risingStr}
        ${rising3.length === 1 ? 'is' : 'are'} appearing with increasing frequency in recent headlines,
        suggesting a story still developing.
      </p>` : ''}
    </div>`;
}

function _writeCategorySection(cat, pool, data) {
  const cfg         = _cat(cat);
  const catData     = (data.byCategory || {})[cat];
  const terms       = catData?.trending || catData || [];
  const catArticles = pool.filter(a => a.category === cat);
  if (!catArticles.length) return '';

  const topSource = catData?.topSource || (() => {
    const src = {};
    catArticles.forEach(a => src[a.source] = (src[a.source]||0)+1);
    return Object.entries(src).sort((a,b) => b[1]-a[1])[0]?.[0] || '';
  })();

  const top4   = terms.slice(0, 4);
  const rising = terms.filter(t => t.momentum > 0.65).slice(0, 2);

  const openers = {
    music:   'In music industry coverage',
    tech:    'On the tech and AI side',
    pop:     'Across pop culture coverage',
    spotify: 'Within Spotify-specific coverage',
  };
  const opener = openers[cat] || 'In this category';

  let body = '';
  if (top4.length >= 4) {
    body = `${opener}, ${_termList(top4, 2)} are leading the conversation, with ${_termList(top4.slice(2), 2)} also generating significant attention.`;
  } else if (top4.length === 3) {
    body = `${opener}, the dominant stories center on ${_termList(top4, 3)}.`;
  } else if (top4.length === 2) {
    body = `${opener}, coverage is primarily focused on ${_termList(top4, 2)}.`;
  } else if (top4.length === 1) {
    body = `${opener}, <em>${top4[0].term}</em> is the standout topic this period.`;
  } else {
    body = `${opener}, there isn't enough data yet to identify a clear theme.`;
  }

  const risingProse = rising.length
    ? `<p class="analysis-para"><span class="analysis-rising">🔥 Rising:</span> ${_termList(rising, 2)} ${rising.length === 1 ? 'is' : 'are'} appearing more frequently in recent headlines.</p>`
    : '';

  return `
    <div class="analysis-section">
      <h2 class="analysis-heading" style="border-left-color:${cfg.color}">${cfg.label}</h2>
      <p class="analysis-meta">${catArticles.length} article${catArticles.length!==1?'s':''}${topSource?` · Top source: ${topSource}`:''}</p>
      <p class="analysis-para">${body}</p>
      ${risingProse}
    </div>`;
}

function _writeCrossSection(cross) {
  if (!cross.length) return '';
  const items = cross.slice(0, 6).map(t => {
    const cats    = (t.categories || []).map(c => _cat(c).label);
    const catStr  = cats.length >= 2
      ? cats.slice(0,-1).join(', ') + ' and ' + cats[cats.length-1]
      : cats[0] || 'multiple sectors';
    const note = t.momentum > 0.7 ? ', with strong and rising momentum'
               : t.momentum > 0.4 ? ', with steady ongoing coverage' : '';
    return `<li class="analysis-cross-item"><em>${t.term}</em> — spanning ${catStr}${note}.</li>`;
  }).join('');

  return `
    <div class="analysis-section">
      <h2 class="analysis-heading">Cross-Sector Themes</h2>
      <p class="analysis-para">
        The following topics are cutting across multiple verticals — a signal of broader industry conversations
        that aren't confined to a single beat:
      </p>
      <ul class="analysis-cross-list">${items}</ul>
    </div>`;
}

// ── External data injectors (Reddit + Wikipedia) ──────────────────────────────

function _writeRedditSection(cat, posts) {
  if (!posts || !posts.length) return '';
  const cfg = _cat(cat);
  const top = posts.slice(0, 5);
  const items = top.map(p => `
    <li class="analysis-reddit-item">
      <a href="${p.url}" target="_blank" rel="noopener noreferrer" class="analysis-reddit-link">${p.title}</a>
      <span class="analysis-reddit-meta">r/${p.subreddit} · ${_fmtScore(p.score)} upvotes</span>
    </li>`).join('');
  return `
    <div class="analysis-section">
      <h2 class="analysis-heading" style="border-left-color:${cfg.color}">${cfg.label} — Community Pulse</h2>
      <p class="analysis-meta">Top discussions on Reddit this week</p>
      <ul class="analysis-reddit-list">${items}</ul>
    </div>`;
}

function _writeWikiSection(articles) {
  if (!articles || !articles.length) return '';
  const items = articles.slice(0, 20).map(a => `
    <li class="analysis-wiki-item">
      <a href="${a.url}" target="_blank" rel="noopener noreferrer" class="analysis-wiki-link" title="${a.title}">${a.title}</a>
      <span class="analysis-wiki-views">${_fmtViews(a.views)}</span>
    </li>`).join('');
  return `
    <div class="analysis-section">
      <h2 class="analysis-heading">Wikipedia Pulse</h2>
      <p class="analysis-para">What people are actively reading about right now — a window into the broader cultural moment:</p>
      <ul class="analysis-wiki-list">${items}</ul>
    </div>`;
}

function _injectExternal(wrap, ext) {
  const placeholder = wrap.querySelector('#trend-ext-placeholder');
  if (!placeholder) return;

  const reddit  = ext.reddit  || {};
  const wiki    = ext.wikipedia || [];

  const musicReddit  = _writeRedditSection('music', reddit.music);
  const techReddit   = _writeRedditSection('tech',  reddit.tech);
  const popReddit    = _writeRedditSection('pop',   reddit.pop);
  const wikiSection  = _writeWikiSection(wiki);

  const parts = [musicReddit, techReddit, popReddit, wikiSection].filter(Boolean);

  if (!parts.length) {
    placeholder.remove();
    return;
  }

  const div = document.createElement('div');
  div.innerHTML = parts.join('<div class="analysis-divider"></div>');
  placeholder.replaceWith(div);
}

// ── renderTrendTab ────────────────────────────────────────────────────────────

function renderTrendTab(articles, horizon) {
  horizon = horizon || '7d';
  const section = document.getElementById('section-trends');
  if (!section) return;

  let content = section.querySelector('.trend-content');
  if (!content) {
    content = document.createElement('div');
    content.className = 'trend-content';
    const existing = section.querySelector('.section-header');
    section.innerHTML = '';
    if (existing) section.appendChild(existing);
    section.appendChild(content);
  }

  if (!articles || articles.length === 0) {
    content.innerHTML = `<p class="analysis-empty">📊 Loading trend data…</p>`;
    return;
  }

  const cutoffMs = { '24h':86400000, '7d':7*86400000, '30d':30*86400000 }[horizon] || 7*86400000;
  const now = Date.now();
  const filtered = articles.filter(a => (now - new Date(a.pubDate).getTime()) <= cutoffMs);
  const pool = filtered.length >= 5 ? filtered : articles;

  const data         = window.TrendEngine ? window.TrendEngine.analyze(pool, horizon) : _localAnalyze(pool);
  const overallTerms = data.overall?.trending || data.overall || [];
  const risingTerms  = data.risingTerms || overallTerms.filter(t => t.momentum > 0.65).slice(0, 5);
  const cross        = data.crossSector || [];

  const horizonLabel  = { '24h':'the past 24 hours', '7d':'the past 7 days', '30d':'the past 30 days' }[horizon];
  const uniqueSources = new Set(pool.map(a => a.source)).size;

  const horizonBar = `
    <div class="trend-horizon-bar">
      ${['24h','7d','30d'].map(h => `
        <button class="horizon-pill${h===horizon?' active':''}" data-horizon="${h}">
          ${h==='24h'?'Last 24h':h==='7d'?'Last 7 days':'Last 30 days'}
        </button>`).join('')}
    </div>`;

  const overview    = _writeOverview(pool, horizonLabel, uniqueSources, overallTerms, risingTerms);
  const catSections = ['music','tech','pop','spotify']
    .map(cat => _writeCategorySection(cat, pool, data))
    .filter(Boolean)
    .join('<div class="analysis-divider"></div>');
  const crossSection = _writeCrossSection(cross);

  // Phase 1: render immediately with article-based analysis
  content.innerHTML = `
    ${horizonBar}
    <div class="analysis-wrap">
      ${overview}
      <div class="analysis-divider"></div>
      ${catSections}
      ${crossSection ? '<div class="analysis-divider"></div>' + crossSection : ''}
      <div class="analysis-divider"></div>
      <div id="trend-ext-placeholder">
        <p class="analysis-loading">Fetching community signals from Reddit and Wikipedia…</p>
      </div>
    </div>`;

  content.querySelectorAll('.horizon-pill').forEach(btn => {
    btn.addEventListener('click', () => renderTrendTab(articles, btn.dataset.horizon));
  });

  // Phase 2: inject external data when ready
  const wrap = content.querySelector('.analysis-wrap');
  if (window.TrendData && wrap) {
    window.TrendData.fetchAll()
      .then(ext => _injectExternal(wrap, ext))
      .catch(() => {
        const ph = wrap.querySelector('#trend-ext-placeholder');
        if (ph) ph.remove();
      });
  } else if (wrap) {
    const ph = wrap.querySelector('#trend-ext-placeholder');
    if (ph) ph.remove();
  }
}

// ── Local trend analysis fallback ─────────────────────────────────────────────

function _localAnalyze(articles) {
  const STOP = new Set(['the','a','an','in','of','for','to','and','or','is','are','was','were','it','its','with','at','by','from','as','on','be','this','that','have','has','had','not','but','we','they','he','she','you','i','will','can','do','did','so','if','about','into','than','then','there','their','our','more','also','been','when','who','which','what','how','all','up','out','new','just','over','after','said','says','would','could','should','may','no','one','two','three','year','years']);

  const termCats = {};
  for (const a of articles) {
    const titleWords = a.title.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    const grams = [];
    for (let i = 0; i < titleWords.length - 1; i++) {
      if (!STOP.has(titleWords[i]) && !STOP.has(titleWords[i+1]))
        grams.push(`${titleWords[i]} ${titleWords[i+1]}`);
    }
    const words = (a.title + ' ' + (a.description||'')).toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    for (const term of [...new Set([...words.filter(w => !STOP.has(w)), ...grams])]) {
      if (!termCats[term]) termCats[term] = { count:0, cats: new Set() };
      termCats[term].count++;
      termCats[term].cats.add(a.category);
    }
  }

  const entries  = Object.entries(termCats).filter(([,v]) => v.count >= 2);
  const maxCount = Math.max(...entries.map(([,v]) => v.count), 1);
  const toTerm   = ([term, v]) => ({ term, score: v.count, momentum: v.count/maxCount, categories: [...v.cats] });
  const sorted   = entries.map(toTerm).sort((a, b) => b.score - a.score);

  const byCategory = {};
  for (const cat of ['music','tech','pop','spotify']) {
    const catArticles = articles.filter(a => a.category === cat);
    const catTerms    = {};
    for (const a of catArticles) {
      const words = (a.title + ' ' + (a.description||'')).toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
      for (const w of words) if (!STOP.has(w)) catTerms[w] = (catTerms[w]||0)+1;
    }
    const catMax = Math.max(...Object.values(catTerms), 1);
    byCategory[cat] = Object.entries(catTerms)
      .filter(([,c]) => c >= 2)
      .map(([term, c]) => ({ term, score:c, momentum: c/catMax }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);
  }

  return {
    overall:     sorted.slice(0, 20),
    byCategory,
    crossSector: sorted.filter(t => t.categories.length >= 2).slice(0, 10),
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

window.TrendUI = { renderTrendTab, buildDigestItems, extractTakeaway, injectStyles };
