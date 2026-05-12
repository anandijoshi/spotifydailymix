// Spotify Pulse — UI Engine
// Handles rendering, tabs, digest modal, Q&A search, and refresh

const UIEngine = (() => {
  // ─── Helpers ────────────────────────────────────────────────────────────────

  function timeAgo(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date)) return '';
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function stripHtml(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').trim();
  }

  function truncate(str, n) {
    if (!str) return '';
    const clean = stripHtml(str);
    return clean.length > n ? clean.slice(0, n).trimEnd() + '…' : clean;
  }

  function todayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function greeting() {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return 'Good morning';
    if (h >= 12 && h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  function formattedDate() {
    return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }

  function formattedTime() {
    return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  // ─── Category config ─────────────────────────────────────────────────────────

  const CATEGORY_CONFIG = {
    music:    { label: 'Music Industry', color: '#1DB954', gradient: 'linear-gradient(135deg, #6B2FA0, #1DB954)' },
    tech:     { label: 'Tech & AI',      color: '#4687D6', gradient: 'linear-gradient(135deg, #0D3B8C, #1DB954)' },
    pop:      { label: 'Pop Culture',    color: '#E91E8C', gradient: 'linear-gradient(135deg, #E91E8C, #FF6B35)' },
    spotify:  { label: 'Spotify',        color: '#1DB954', gradient: 'linear-gradient(135deg, #1DB954, #191414)' },
    linkedin: { label: 'LinkedIn News',  color: '#0A66C2', gradient: 'linear-gradient(135deg, #004182, #0A66C2)' },
  };

  function categoryConfig(cat) {
    return CATEGORY_CONFIG[cat] || CATEGORY_CONFIG['spotify'];
  }

  // ─── Skeleton cards ──────────────────────────────────────────────────────────

  function skeletonHTML(count = 6) {
    return Array.from({ length: count }, () => `
      <div class="card skeleton-card">
        <div class="skeleton skeleton-thumb"></div>
        <div class="card-body">
          <div class="skeleton skeleton-badge"></div>
          <div class="skeleton skeleton-title"></div>
          <div class="skeleton skeleton-title short"></div>
          <div class="skeleton skeleton-desc"></div>
          <div class="skeleton skeleton-desc short"></div>
          <div class="skeleton skeleton-link"></div>
        </div>
      </div>`).join('');
  }

  function showSkeletons() {
    ['cards-today', 'cards-music', 'cards-tech', 'cards-pop', 'cards-linkedin', 'cards-all'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = skeletonHTML();
    });
  }

  // ─── Card rendering ──────────────────────────────────────────────────────────

  function renderCard(article, highlightTerms = []) {
    const cfg = categoryConfig(article.category);
    const thumb = article.thumbnail
      ? `<img src="${article.thumbnail}" alt="" class="card-thumb" loading="lazy" onerror="this.parentElement.style.background='${cfg.gradient}';this.remove()">`
      : '';
    const thumbStyle = article.thumbnail ? '' : `style="background:${cfg.gradient}"`;
    const badgeStyle = `background:${cfg.color}22;color:${cfg.color};border:1px solid ${cfg.color}44`;

    let title = article.title || 'Untitled';
    let desc = truncate(article.description, 140);

    if (highlightTerms.length) {
      const pattern = new RegExp(`(${highlightTerms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
      title = title.replace(pattern, '<mark>$1</mark>');
      desc = desc.replace(pattern, '<mark>$1</mark>');
    }

    // Find context snippet — the sentence containing a keyword match
    let contextSnippet = '';
    if (highlightTerms.length && article.description) {
      const fullDesc = stripHtml(article.description);
      const sentences = fullDesc.split(/(?<=[.!?])\s+/);
      for (const sent of sentences) {
        if (highlightTerms.some(t => sent.toLowerCase().includes(t.toLowerCase()))) {
          contextSnippet = truncate(sent, 160).replace(
            new RegExp(`(${highlightTerms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi'),
            '<mark>$1</mark>'
          );
          break;
        }
      }
    }

    return `
      <article class="card" data-category="${article.category}">
        <div class="card-thumb-wrap" ${thumbStyle}>${thumb}</div>
        <div class="card-body">
          <div class="card-meta">
            <span class="badge" style="${badgeStyle}">${cfg.label}</span>
            <span class="card-time">${timeAgo(article.pubDate)}</span>
          </div>
          <h3 class="card-title">
            <a href="${article.link}" target="_blank" rel="noopener noreferrer">${title}</a>
          </h3>
          ${contextSnippet
            ? `<p class="card-context">"…${contextSnippet}…"</p>`
            : `<p class="card-desc">${desc}</p>`
          }
          <div class="card-footer">
            <span class="card-source">${article.source || ''}</span>
            <a href="${article.link}" target="_blank" rel="noopener noreferrer" class="read-link">Read Source →</a>
          </div>
        </div>
      </article>`;
  }

  function renderCards(containerId, articles, highlightTerms = []) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (!articles || articles.length === 0) {
      el.innerHTML = `<div class="empty-state"><span class="empty-icon">🔍</span><p>No Spotify-related articles found in this category right now.</p><p class="empty-sub">Try refreshing or check back later.</p></div>`;
      return;
    }
    el.innerHTML = articles.map(a => renderCard(a, highlightTerms)).join('');
  }

  function renderError(containerId, message) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = `<div class="empty-state error-state"><span class="empty-icon">⚠️</span><p>${message}</p><button onclick="UIEngine.refresh()" class="retry-btn">Try Again</button></div>`;
  }

  // ─── Tab switching ────────────────────────────────────────────────────────────

  let allArticles = {};

  function initTabs() {
    document.querySelectorAll('[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
  }

  function switchTab(tabName) {
    document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === tabName));
    document.querySelectorAll('.tab-section').forEach(s => s.classList.toggle('active', s.id === `section-${tabName}`));
  }

  function updateTabCounts(data) {
    const counts = {
      today:    (data.all || []).filter(a => {
        const d = new Date(a.pubDate);
        return (Date.now() - d) < 86400000 * 2;
      }).length,
      music:    (data.music    || []).length,
      tech:     (data.tech     || []).length,
      pop:      (data.pop      || []).length,
      linkedin: (data.linkedin || []).length,
      all:      (data.all      || []).length,
    };
    Object.entries(counts).forEach(([tab, count]) => {
      const badge = document.querySelector(`[data-tab="${tab}"] .tab-count`);
      if (badge && count > 0) { badge.textContent = count; badge.style.display = 'inline-flex'; }
    });
  }

  // ─── Daily Digest Modal ───────────────────────────────────────────────────────

  function showDigestModal(articles) {
    const modal = document.getElementById('digest-modal');
    if (!modal) return;

    const dateEl = modal.querySelector('.digest-date');
    const greetEl = modal.querySelector('.digest-greeting');
    const itemsEl = modal.querySelector('.digest-items');

    if (dateEl) dateEl.textContent = formattedDate();
    if (greetEl) greetEl.textContent = `${greeting()}, here's your Spotify Pulse`;

    // Pick top 8: prefer variety across categories
    const picks = [];
    const byCategory = { music: [], tech: [], pop: [], spotify: [] };
    articles.forEach(a => {
      if (byCategory[a.category]) byCategory[a.category].push(a);
    });
    // Round-robin pick
    let remaining = true;
    let idx = 0;
    const cats = ['music', 'tech', 'pop', 'spotify'];
    while (picks.length < 8 && remaining) {
      remaining = false;
      for (const cat of cats) {
        if (byCategory[cat][idx]) { picks.push(byCategory[cat][idx]); remaining = true; }
        if (picks.length >= 8) break;
      }
      idx++;
    }

    if (itemsEl) {
      itemsEl.innerHTML = picks.map(a => {
        const cfg = categoryConfig(a.category);
        const badgeStyle = `background:${cfg.color}22;color:${cfg.color};border:1px solid ${cfg.color}44`;
        return `
          <div class="digest-item">
            <div class="digest-item-meta">
              <span class="badge" style="${badgeStyle}">${cfg.label}</span>
              <span class="digest-time">${timeAgo(a.pubDate)}</span>
            </div>
            <a href="${a.link}" target="_blank" rel="noopener noreferrer" class="digest-headline">${a.title}</a>
            <p class="digest-snippet">${truncate(a.description, 110)}</p>
          </div>`;
      }).join('');
    }

    modal.classList.add('visible');
    document.body.style.overflow = 'hidden';

    // Close handlers
    const close = () => {
      modal.classList.remove('visible');
      document.body.style.overflow = '';
    };
    modal.querySelector('.close-modal')?.addEventListener('click', close, { once: true });
    modal.addEventListener('click', e => { if (e.target === modal) close(); }, { once: true });
  }

  // ─── Q&A Search ───────────────────────────────────────────────────────────────

  const STOP_WORDS = new Set(['the','is','are','was','were','what','about','does','did','do','a','an','in','of','for','to','how','when','where','who','which','that','this','these','those','with','and','or','but','not','from','by','on','at','up','has','have','had','been','be','can','could','would','should','will','any','all','get','got','its','it','as','so','if','then','than','there','their','they','we','he','she','you','i','my','your','his','her','our','me','him','us','them']);

  function extractKeywords(query) {
    return query.toLowerCase().split(/\s+/).map(w => w.replace(/[^a-z0-9]/g, '')).filter(w => w.length > 1 && !STOP_WORDS.has(w));
  }

  function scoreArticle(article, keywords) {
    let score = 0;
    const title = (article.title || '').toLowerCase();
    const desc = stripHtml(article.description || '').toLowerCase();
    keywords.forEach(kw => {
      if (title.includes(kw)) score += 3;
      if (desc.includes(kw)) score += 1;
    });
    return score;
  }

  function initSearch() {
    const input = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const qaPanel = document.getElementById('qa-panel');
    const closeBtn = qaPanel?.querySelector('.qa-close');

    const doSearch = () => {
      const query = input?.value?.trim();
      if (!query) return;
      const keywords = extractKeywords(query);
      if (!keywords.length) return;

      const flat = allArticles.all || [];
      const scored = flat.map(a => ({ article: a, score: scoreArticle(a, keywords) }))
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score);

      const queryEl = qaPanel?.querySelector('.qa-query');
      const countEl = qaPanel?.querySelector('.qa-count');
      const resultsEl = qaPanel?.querySelector('.qa-results');

      if (queryEl) queryEl.textContent = `Results for: "${query}"`;
      if (countEl) countEl.textContent = `Showing ${scored.length} article${scored.length !== 1 ? 's' : ''}`;
      if (resultsEl) {
        if (!scored.length) {
          resultsEl.innerHTML = `<div class="empty-state"><span class="empty-icon">🔍</span><p>No articles matched "<strong>${query}</strong>"</p><p class="empty-sub">Try different keywords like "AI", "podcast", "artist", "streaming"</p></div>`;
        } else {
          resultsEl.innerHTML = scored.map(x => renderCard(x.article, keywords)).join('');
        }
      }

      qaPanel?.classList.add('visible');
      document.getElementById('section-today')?.parentElement?.classList.add('blurred');
    };

    input?.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
    searchBtn?.addEventListener('click', doSearch);

    const closeSearch = () => {
      qaPanel?.classList.remove('visible');
      if (input) input.value = '';
      document.getElementById('section-today')?.parentElement?.classList.remove('blurred');
    };
    closeBtn?.addEventListener('click', closeSearch);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && qaPanel?.classList.contains('visible')) closeSearch(); });
  }

  // ─── Refresh ─────────────────────────────────────────────────────────────────

  async function refresh() {
    const btn = document.getElementById('refresh-btn');
    if (btn) btn.classList.add('spinning');
    showSkeletons();
    try {
      const data = await window.NewsEngine.forceRefresh();
      renderAll(data);
    } catch (e) {
      ['cards-today', 'cards-music', 'cards-tech', 'cards-pop', 'cards-all'].forEach(id => {
        renderError(id, 'Refresh failed. Check your connection.');
      });
    } finally {
      if (btn) btn.classList.remove('spinning');
    }
  }

  function renderAll(data) {
    allArticles = data;
    const now = Date.now();
    const todayArticles = (data.all || []).filter(a => (now - new Date(a.pubDate)) < 86400000 * 2);

    renderCards('cards-today',    todayArticles.length ? todayArticles : (data.all || []).slice(0, 12));
    renderCards('cards-music',    data.music    || []);
    renderCards('cards-tech',     data.tech     || []);
    renderCards('cards-pop',      data.pop      || []);
    renderCards('cards-linkedin', data.linkedin || []);
    renderCards('cards-all',      data.all      || []);
    updateTabCounts(data);

    const lastUpdated = document.getElementById('last-updated');
    if (lastUpdated) lastUpdated.textContent = `Updated ${formattedTime()}`;
  }

  // ─── Init ────────────────────────────────────────────────────────────────────

  async function initApp() {
    initTabs();
    initSearch();
    showSkeletons();

    // Digest banner click
    const banner = document.getElementById('digest-banner');
    banner?.addEventListener('click', () => {
      if (allArticles.all?.length) showDigestModal(allArticles.all);
    });

    // Refresh button
    document.getElementById('refresh-btn')?.addEventListener('click', refresh);

    try {
      const data = await window.NewsEngine.fetchAll();
      renderAll(data);

      // Show digest if not shown today
      const shownDate = localStorage.getItem('spotify_pulse_shown_date');
      if (shownDate !== todayString()) {
        setTimeout(() => {
          showDigestModal(data.all || []);
          localStorage.setItem('spotify_pulse_shown_date', todayString());
        }, 1500);
      }
    } catch (err) {
      console.error('NewsEngine.fetchAll failed:', err);
      ['cards-today', 'cards-music', 'cards-tech', 'cards-pop', 'cards-linkedin', 'cards-all'].forEach(id => {
        renderError(id, 'Could not load news. Check your internet connection and try refreshing.');
      });
    }
  }

  document.addEventListener('DOMContentLoaded', initApp);

  return { refresh, showDigestModal, renderCard, switchTab };
})();

window.UIEngine = UIEngine;
