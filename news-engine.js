/**
 * NewsEngine — client-side RSS news fetching, filtering, and caching module
 * for the Spotify Pulse dashboard.
 *
 * Fetches via api.rss2json.com to avoid CORS. Caches to localStorage for 24h.
 * All articles are filtered for Spotify relevance before being stored.
 */

const RSS2JSON = 'https://api.rss2json.com/v1/api.json';
const CACHE_KEY = 'spotify_pulse_cache';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const SPOTIFY_KEYWORDS = [
  'spotify', 'daniel ek', 'music streaming', 'spotify wrapped',
  'spotify premium', 'spotify free', 'audio streaming', 'podcast streaming',
  'spotify discover', 'spotify playlist', 'soundcloud', 'apple music vs',
  'tidal', 'streaming royalties', 'spotify ai', 'spotify dj', 'spotify blend',
  'spotify connect', 'loud and clear', 'playlist',
];

const SOURCES = [
  // Spotify newsroom — always relevant, no keyword filter needed
  {
    url: 'https://newsroom.spotify.com/feed/',
    name: 'Spotify Newsroom',
    siteUrl: 'https://newsroom.spotify.com',
    category: 'spotify',
    alwaysRelevant: true,
  },
  // Music industry
  {
    url: 'https://www.billboard.com/feed/',
    name: 'Billboard',
    siteUrl: 'https://www.billboard.com',
    category: 'music',
  },
  {
    url: 'https://www.musicbusinessworldwide.com/feed/',
    name: 'Music Business Worldwide',
    siteUrl: 'https://www.musicbusinessworldwide.com',
    category: 'music',
  },
  {
    url: 'https://www.rollingstone.com/music/music-news/feed/',
    name: 'Rolling Stone',
    siteUrl: 'https://www.rollingstone.com',
    category: 'music',
  },
  {
    url: 'https://pitchfork.com/rss/news/feed.aisxml',
    name: 'Pitchfork',
    siteUrl: 'https://pitchfork.com',
    category: 'music',
  },
  // Tech & AI
  {
    url: 'https://techcrunch.com/feed/',
    name: 'TechCrunch',
    siteUrl: 'https://techcrunch.com',
    category: 'tech',
  },
  {
    url: 'https://www.theverge.com/rss/index.xml',
    name: 'The Verge',
    siteUrl: 'https://www.theverge.com',
    category: 'tech',
  },
  {
    url: 'https://www.wired.com/feed/rss',
    name: 'Wired',
    siteUrl: 'https://www.wired.com',
    category: 'tech',
  },
  // Pop culture
  {
    url: 'https://variety.com/feed/',
    name: 'Variety',
    siteUrl: 'https://variety.com',
    category: 'pop',
  },
  {
    url: 'https://ew.com/feed/',
    name: 'Entertainment Weekly',
    siteUrl: 'https://ew.com',
    category: 'pop',
  },
  {
    url: 'https://www.nme.com/feed',
    name: 'NME',
    siteUrl: 'https://www.nme.com',
    category: 'pop',
  },
  // Rising artists & local music
  {
    url: 'https://pigeonsandplanes.com/feed',
    name: 'Pigeons & Planes',
    siteUrl: 'https://pigeonsandplanes.com',
    category: 'rising',
    alwaysRelevant: true,
  },
  {
    url: 'https://www.stereogum.com/feed/',
    name: 'Stereogum',
    siteUrl: 'https://www.stereogum.com',
    category: 'rising',
    alwaysRelevant: true,
  },
  {
    url: 'https://www.hotnewhiphop.com/rss/',
    name: 'HotNewHipHop',
    siteUrl: 'https://www.hotnewhiphop.com',
    category: 'rising',
    alwaysRelevant: true,
  },
  {
    url: 'https://www.thefader.com/rss',
    name: 'The FADER',
    siteUrl: 'https://www.thefader.com',
    category: 'rising',
    alwaysRelevant: true,
  },
  {
    url: 'https://consequenceofsound.net/feed',
    name: 'Consequence of Sound',
    siteUrl: 'https://consequenceofsound.net',
    category: 'rising',
    alwaysRelevant: true,
  },
  // LinkedIn News — official LinkedIn blog; covers business, professional, and industry topics
  {
    url: 'https://blog.linkedin.com/feed/',
    name: 'LinkedIn News',
    siteUrl: 'https://blog.linkedin.com',
    category: 'linkedin',
    alwaysRelevant: true,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Strip all HTML tags and collapse whitespace. */
const stripHtml = (html) =>
  (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

/** Truncate a string to maxLen chars, appending ellipsis if needed. */
const truncate = (str, maxLen = 200) =>
  str.length <= maxLen ? str : str.slice(0, maxLen).trimEnd() + '…';

/** Stable short ID derived from a URL (base64, url-safe subset). */
const makeId = (url) => {
  try {
    return btoa(unescape(encodeURIComponent(url))).replace(/[^A-Za-z0-9]/g, '').slice(0, 16);
  } catch {
    // fallback: simple hash
    let h = 0;
    for (let i = 0; i < url.length; i++) h = (Math.imul(31, h) + url.charCodeAt(i)) | 0;
    return Math.abs(h).toString(36);
  }
};

/**
 * Extract the best thumbnail URL from an rss2json item.
 * rss2json populates: item.thumbnail, item.enclosure.link, or img tags in item.content.
 */
const extractThumbnail = (item) => {
  if (item.thumbnail && item.thumbnail.startsWith('http')) return item.thumbnail;
  if (item.enclosure?.link && /\.(jpe?g|png|webp|gif)/i.test(item.enclosure.link))
    return item.enclosure.link;
  // Pull first <img src="…"> from raw content
  const match = (item.content || '').match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match) return match[1];
  return null;
};

/** Returns true if the article text contains any Spotify-related keyword. */
const isSpotifyRelevant = (title, description) => {
  const haystack = `${title} ${description}`.toLowerCase();
  return SPOTIFY_KEYWORDS.some((kw) => haystack.includes(kw));
};

// ─── Feed fetching ────────────────────────────────────────────────────────────

/**
 * Fetch a single RSS feed via rss2json and return an array of Article objects.
 * Returns [] on any error so Promise.allSettled callers get clean arrays.
 */
const fetchFeed = async (source) => {
  const apiUrl = `${RSS2JSON}?rss_url=${encodeURIComponent(source.url)}&count=20`;

  let data;
  try {
    const res = await fetch(apiUrl, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (err) {
    console.warn(`[NewsEngine] Failed to fetch ${source.name}:`, err.message);
    return [];
  }

  if (data.status !== 'ok' || !Array.isArray(data.items)) {
    console.warn(`[NewsEngine] Bad response from ${source.name}:`, data.status);
    return [];
  }

  console.log(`[NewsEngine] ✓ ${source.name} — ${data.items.length} items`);

  const articles = [];
  for (const item of data.items) {
    const title = stripHtml(item.title || '');
    const rawDesc = stripHtml(item.description || item.content || '');
    const description = truncate(rawDesc);
    const link = item.link || item.guid || '';

    if (!title || !link) continue;

    // Skip non-Spotify articles from general sources
    if (!source.alwaysRelevant && !isSpotifyRelevant(title, rawDesc)) continue;

    articles.push({
      id: makeId(link),
      title,
      description,
      link,
      pubDate: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
      source: source.name,
      sourceUrl: source.siteUrl,
      category: source.category,
      thumbnail: extractThumbnail(item),
    });
  }

  return articles;
};

// ─── Cache helpers ────────────────────────────────────────────────────────────

const readCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const writeCache = (articles) => {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ articles, fetchedAt: new Date().toISOString() }),
    );
  } catch (err) {
    console.warn('[NewsEngine] Could not write cache:', err.message);
  }
};

const isCacheValid = (cached) => {
  if (!cached?.fetchedAt || !Array.isArray(cached.articles)) return false;
  return Date.now() - new Date(cached.fetchedAt).getTime() < CACHE_TTL_MS;
};

// ─── Core fetch logic ─────────────────────────────────────────────────────────

/** Fetch all feeds in parallel, merge, deduplicate, sort, cache, and return. */
const fetchAllFresh = async () => {
  console.log('[NewsEngine] Fetching all feeds…');

  const results = await Promise.allSettled(SOURCES.map(fetchFeed));

  // Flatten fulfilled arrays; ignored rejected (fetchFeed already returns [] on error)
  const merged = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));

  // Deduplicate by link URL (use a Map keyed by id)
  const seen = new Map();
  for (const article of merged) {
    if (!seen.has(article.id)) seen.set(article.id, article);
  }

  // Sort newest-first
  const articles = [...seen.values()].sort(
    (a, b) => new Date(b.pubDate) - new Date(a.pubDate),
  );

  console.log(`[NewsEngine] Total Spotify-relevant articles: ${articles.length}`);
  writeCache(articles);
  return articles;
};

// ─── Internal state ───────────────────────────────────────────────────────────

// articles is populated on first fetchAll() call and updated on forceRefresh()
let _articles = [];

// ─── Public API ───────────────────────────────────────────────────────────────

window.NewsEngine = {
  /**
   * Primary entry point. Returns cached articles if < 24h old,
   * otherwise fetches fresh from all sources.
   */
  fetchAll: async () => {
    const cached = readCache();
    if (isCacheValid(cached)) {
      console.log('[NewsEngine] Using cached articles from', cached.fetchedAt);
      _articles = cached.articles;
      return _articles;
    }
    _articles = await fetchAllFresh();
    return _articles;
  },

  /**
   * Filter the in-memory article list by category.
   * category: "music" | "tech" | "pop" | "spotify"
   * Returns all articles if category is falsy.
   */
  getByCategory: (category) => {
    if (!category) return _articles;
    return _articles.filter((a) => a.category === category);
  },

  /**
   * Bypass cache and re-fetch everything.
   * Use for the manual "Refresh" button.
   */
  forceRefresh: async () => {
    _articles = await fetchAllFresh();
    return _articles;
  },

  /** Returns a Date of when articles were last fetched, or null. */
  getLastFetched: () => {
    const cached = readCache();
    return cached?.fetchedAt ? new Date(cached.fetchedAt) : null;
  },

  /** Returns the current in-memory article array without fetching. */
  getCachedArticles: () => _articles,

  /**
   * Simple keyword search across title + description.
   * Returns articles ranked by number of keyword hits.
   */
  search: (query) => {
    if (!query?.trim()) return _articles;
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const scored = _articles
      .map((a) => {
        const haystack = `${a.title} ${a.description}`.toLowerCase();
        const hits = terms.filter((t) => haystack.includes(t)).length;
        return { article: a, hits };
      })
      .filter((r) => r.hits > 0)
      .sort((a, b) => b.hits - a.hits);
    return scored.map((r) => r.article);
  },

  /** Expose category list for UI tabs */
  CATEGORIES: [
    { id: 'all',      label: 'All News' },
    { id: 'spotify',  label: 'Spotify HQ' },
    { id: 'music',    label: 'Music Industry' },
    { id: 'tech',     label: 'Tech & AI' },
    { id: 'pop',      label: 'Pop Culture' },
    { id: 'rising',   label: 'Rising Artists' },
    { id: 'linkedin', label: 'LinkedIn News' },
  ],
};
