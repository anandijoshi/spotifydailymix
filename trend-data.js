/* trend-data.js — External trend signals: Reddit, Wikipedia, Apple Music, Hacker News */

(() => {
  'use strict';

  const CACHE_BASE = 'daily_mix_ext_v2';
  const CACHE_TTL  = 2 * 60 * 60 * 1000; // 2 hours

  const REDDIT_SUBS = {
    music: 'Music+hiphopheads+indieheads+popheads+rnbheads+spotify',
    tech:  'technology+artificial+MachineLearning+futurism+gadgets',
    pop:   'entertainment+television+movies+popculture',
  };

  const WIKI_SKIP = /^(main_page|special:|wikipedia:|portal:|talk:|file:|category:|help:|draft:)/i;

  async function _reddit(cat, period) {
    try {
      const res = await fetch(
        `https://www.reddit.com/r/${REDDIT_SUBS[cat]}/top.json?limit=30&t=${period}`,
        { credentials: 'omit' }
      );
      if (!res.ok) return [];
      const { data } = await res.json();
      return (data?.children || [])
        .map(c => ({
          title:     c.data.title,
          score:     c.data.score,
          subreddit: c.data.subreddit,
          url:       `https://www.reddit.com${c.data.permalink}`,
        }))
        .filter(p => p.title && p.score > 0);
    } catch { return []; }
  }

  async function _wikipedia() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, '0');
    const dd   = String(d.getDate()).padStart(2, '0');
    try {
      const res = await fetch(
        `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia/all-access/${yyyy}/${mm}/${dd}`
      );
      if (!res.ok) return [];
      const json = await res.json();
      return (json.items?.[0]?.articles || [])
        .filter(a => !WIKI_SKIP.test(a.article))
        .slice(0, 30)
        .map(a => ({
          title: a.article.replace(/_/g, ' '),
          views: a.views,
          url:   `https://en.wikipedia.org/wiki/${a.article}`,
        }));
    } catch { return []; }
  }

  async function _appleMusic() {
    try {
      const res = await fetch(
        'https://rss.applemarketingtools.com/api/v2/us/music/most-played/25/songs.json'
      );
      if (!res.ok) return [];
      const json = await res.json();
      return (json.feed?.results || []).map((s, i) => ({
        rank:   i + 1,
        name:   s.name,
        artist: s.artistName,
        url:    s.url,
      }));
    } catch { return []; }
  }

  async function _hackerNews() {
    try {
      const idsRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
      if (!idsRes.ok) return [];
      const ids = (await idsRes.json()).slice(0, 12);
      const stories = await Promise.all(
        ids.map(id =>
          fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
            .then(r => r.json())
            .catch(() => null)
        )
      );
      return stories
        .filter(s => s && s.type === 'story' && s.title)
        .map(s => ({
          title:    s.title,
          score:    s.score || 0,
          url:      s.url || `https://news.ycombinator.com/item?id=${s.id}`,
          comments: s.descendants || 0,
        }));
    } catch { return []; }
  }

  function _readCache(period) {
    try {
      const raw = sessionStorage.getItem(`${CACHE_BASE}_${period}`);
      if (!raw) return null;
      const { fetchedAt, data } = JSON.parse(raw);
      return Date.now() - fetchedAt < CACHE_TTL ? data : null;
    } catch { return null; }
  }

  function _writeCache(period, data) {
    try {
      sessionStorage.setItem(`${CACHE_BASE}_${period}`, JSON.stringify({ fetchedAt: Date.now(), data }));
    } catch {}
  }

  async function fetchAll(period = 'week') {
    const cached = _readCache(period);
    if (cached) return cached;

    const [music, tech, pop, wikipedia, appleMusic, hackerNews] = await Promise.allSettled([
      _reddit('music', period),
      _reddit('tech',  period),
      _reddit('pop',   period),
      _wikipedia(),
      _appleMusic(),
      _hackerNews(),
    ]).then(rs => rs.map(r => r.status === 'fulfilled' ? r.value : []));

    const data = { reddit: { music, tech, pop }, wikipedia, appleMusic, hackerNews };
    _writeCache(period, data);
    return data;
  }

  window.TrendData = { fetchAll };
})();
