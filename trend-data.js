/* trend-data.js — External signals: Spotify Charts, Billboard Hot 100, Apple Music, Reddit, Wikipedia */

(() => {
  'use strict';

  const CACHE_BASE = 'daily_mix_ext_v4';
  const CACHE_TTL  = 2 * 60 * 60 * 1000; // 2 hours

  // CORS proxies — try in order until one succeeds
  const PROXIES = [
    url => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  ];

  const REDDIT_SUBS = {
    music: 'Music+hiphopheads+indieheads+popheads+rnbheads+spotify',
    tech:  'technology+artificial+MachineLearning+futurism+gadgets',
    pop:   'entertainment+television+movies+popculture',
  };

  const WIKI_SKIP = /^(main_page|special:|wikipedia:|portal:|talk:|file:|category:|help:|draft:)/i;

  function _velocityScore(rank, total) {
    return Math.round(100 - ((rank - 1) / Math.max(total - 1, 1)) * 96);
  }
  function _trendLabel(rank) {
    if (rank <= 5)  return 'rising';
    if (rank <= 20) return 'stable';
    return 'cooling';
  }

  // ── CORS proxy fetch ────────────────────────────────────────────────────────

  async function _proxiedFetch(url, timeoutMs = 12000) {
    for (const makeProxy of PROXIES) {
      try {
        const signal = typeof AbortSignal.timeout === 'function'
          ? AbortSignal.timeout(timeoutMs)
          : undefined;
        const res = await fetch(makeProxy(url), { signal });
        if (!res.ok) continue;
        const json = await res.json();
        // allorigins returns { contents, status }; corsproxy returns raw text
        const text = json.contents !== undefined ? json.contents : (typeof json === 'string' ? json : JSON.stringify(json));
        if (text && text.length > 200) return text;
      } catch { continue; }
    }
    return null;
  }

  function _extractNextData(html) {
    if (!html) return null;
    const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!m) return null;
    try { return JSON.parse(m[1]); } catch { return null; }
  }

  // ── Spotify US Daily Charts ─────────────────────────────────────────────────

  async function _spotifyCharts() {
    try {
      const html = await _proxiedFetch('https://charts.spotify.com/charts/view/regional-us-daily/latest', 14000);
      const nd = _extractNextData(html);
      if (!nd) { console.warn('[TrendData] Spotify: no __NEXT_DATA__'); return []; }

      const pp = nd?.props?.pageProps || {};

      // Spotify embeds the chart under several possible paths — try all
      let entries =
        pp.chartData?.chartEntryData ||
        pp.chartData?.entries ||
        pp.entries ||
        pp.chartEntryData ||
        [];

      // Some builds nest it one level deeper
      if (!entries.length && pp.chartData) {
        const cd = pp.chartData;
        entries = cd.chartEntries || cd.items || Object.values(cd).find(v => Array.isArray(v) && v.length > 10) || [];
      }

      if (!entries.length) {
        console.warn('[TrendData] Spotify: found __NEXT_DATA__ but could not locate entries. Keys:', Object.keys(pp));
        return [];
      }

      console.log(`[TrendData] Spotify: parsed ${entries.length} entries`);
      return entries.slice(0, 50).map((e, i) => {
        const meta  = e.trackMetadata || e;
        const chart = e.chartEntryData || e;
        const rank  = chart.currentRank ?? chart.rank ?? (i + 1);
        return {
          rank,
          name:         meta.trackName  || meta.name    || e.song   || '',
          artist:       (meta.artists||[]).map(a => a.name||a).join(', ') || meta.artistName || e.artist || '',
          url:          meta.externalUrl || meta.spotifyUrl || `https://charts.spotify.com`,
          artwork:      meta.displayImageUri || meta.imageUrl || meta.artwork || null,
          streams:      chart.currentStreams || chart.streams || 0,
          peakRank:     chart.peakRank  || rank,
          weeksOnChart: chart.consecutiveAppearances || chart.weeksOnChart || 0,
          lastWeekRank: chart.previousRank || null,
          velocity:     _velocityScore(rank, 50),
          trend:        _trendLabel(rank),
          source:       'Spotify',
        };
      }).filter(e => e.name);
    } catch (err) {
      console.warn('[TrendData] Spotify charts error:', err.message);
      return [];
    }
  }

  // ── Billboard Hot 100 ───────────────────────────────────────────────────────

  async function _billboardHot100() {
    try {
      const html = await _proxiedFetch('https://www.billboard.com/charts/hot-100/', 16000);
      if (!html) return [];

      // --- Path 1: __NEXT_DATA__ JSON ---
      const nd = _extractNextData(html);
      if (nd) {
        const pp = nd?.props?.pageProps || {};
        const chartItems =
          pp.chartData?.chartItems ||
          pp.data?.charts?.chartItems ||
          pp.charts?.chartItems ||
          pp.chartItems ||
          pp.chartData?.entries ||
          [];

        if (chartItems.length) {
          console.log(`[TrendData] Billboard: parsed ${chartItems.length} items from __NEXT_DATA__`);
          return chartItems.slice(0, 100).map((item, i) => {
            const ci = item.chart_item || item.chartItem || item;
            const rank = parseInt(ci.current_week || ci.rank || ci.position) || (i + 1);
            return {
              rank,
              name:         ci.title || ci.name || ci.song || '',
              artist:       ci.artist || ci.artistName || '',
              url:          ci.url   || 'https://www.billboard.com/charts/hot-100/',
              artwork:      ci.image || ci.thumbnail || ci.albumArt || null,
              lastWeekRank: parseInt(ci.last_week || ci.lastWeek) || null,
              weeksOnChart: parseInt(ci.weeks_on_chart || ci.weeksOnChart) || 0,
              peakRank:     parseInt(ci.peak_rank || ci.peakRank) || rank,
              velocity:     _velocityScore(rank, 100),
              trend:        _trendLabel(rank),
              source:       'Billboard',
            };
          }).filter(e => e.name);
        }
      }

      // --- Path 2: DOM parsing ---
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const results = [];

      // Billboard embeds a JSON blob in a <script type="application/json"> sometimes
      doc.querySelectorAll('script[type="application/json"]').forEach(s => {
        if (results.length) return;
        try {
          const d = JSON.parse(s.textContent);
          const items = d?.chartItems || d?.data?.chartItems || d?.charts?.[0]?.chartItems || [];
          items.slice(0, 100).forEach((item, i) => {
            const ci = item.chart_item || item;
            const rank = parseInt(ci.current_week || ci.rank) || (i + 1);
            if (ci.title || ci.name) results.push({
              rank,
              name:         ci.title || ci.name || '',
              artist:       ci.artist || '',
              url:          'https://www.billboard.com/charts/hot-100/',
              artwork:      ci.image || null,
              lastWeekRank: parseInt(ci.last_week) || null,
              weeksOnChart: parseInt(ci.weeks_on_chart) || 0,
              peakRank:     parseInt(ci.peak_rank) || rank,
              velocity:     _velocityScore(rank, 100),
              trend:        _trendLabel(rank),
              source:       'Billboard',
            });
          });
        } catch {}
      });
      if (results.length) {
        console.log(`[TrendData] Billboard: parsed ${results.length} items via script tag`);
        return results;
      }

      // --- Path 3: HTML element scraping ---
      const selectors = [
        '.o-chart-results-list__item',
        '[class*="chart-element"]',
        '[class*="chart-list-item"]',
      ];
      for (const sel of selectors) {
        const items = doc.querySelectorAll(sel);
        if (!items.length) continue;
        items.forEach((el, i) => {
          const rankEl   = el.querySelector('[class*="rank__number"], [class*="chart-element--rank"] span');
          const titleEl  = el.querySelector('h3[id], h3[class*="title"], [class*="song"], .c-title');
          const artistEl = el.querySelector('[class*="artist"], .c-label');
          const imgEl    = el.querySelector('img[src*="billboard"]');
          const rank = parseInt(rankEl?.textContent?.trim()) || (i + 1);
          const name = titleEl?.textContent?.trim() || '';
          if (name) results.push({
            rank, name,
            artist:       artistEl?.textContent?.trim() || '',
            url:          'https://www.billboard.com/charts/hot-100/',
            artwork:      imgEl?.src || null,
            weeksOnChart: 0,
            lastWeekRank: null,
            peakRank:     rank,
            velocity:     _velocityScore(rank, 100),
            trend:        _trendLabel(rank),
            source:       'Billboard',
          });
        });
        if (results.length) break;
      }

      console.log(`[TrendData] Billboard: HTML parse found ${results.length} items`);
      return results.slice(0, 100);
    } catch (err) {
      console.warn('[TrendData] Billboard error:', err.message);
      return [];
    }
  }

  // ── Apple Music ─────────────────────────────────────────────────────────────

  async function _appleMusic() {
    try {
      const res = await fetch('https://rss.applemarketingtools.com/api/v2/us/music/most-played/25/songs.json');
      if (!res.ok) return [];
      const json = await res.json();
      return (json.feed?.results || []).map((s, i) => {
        const rank = i + 1;
        return {
          rank,
          name:     s.name,
          artist:   s.artistName,
          url:      s.url,
          artwork:  s.artworkUrl100 || null,
          velocity: _velocityScore(rank, 25),
          trend:    _trendLabel(rank),
          source:   'Apple Music',
        };
      });
    } catch { return []; }
  }

  async function _appleTopAlbums() {
    try {
      const res = await fetch('https://rss.applemarketingtools.com/api/v2/us/music/most-played/10/albums.json');
      if (!res.ok) return [];
      const json = await res.json();
      return (json.feed?.results || []).map((a, i) => ({
        rank:     i + 1,
        name:     a.name,
        artist:   a.artistName,
        url:      a.url,
        artwork:  a.artworkUrl100 || null,
        velocity: _velocityScore(i + 1, 10),
        trend:    _trendLabel(i + 1),
        source:   'Apple Music',
      }));
    } catch { return []; }
  }

  // ── iTunes Top Songs ────────────────────────────────────────────────────────

  async function _itunesTopSongs() {
    try {
      const res = await fetch('https://itunes.apple.com/us/rss/topsongs/limit=25/json');
      if (!res.ok) return [];
      const json = await res.json();
      const entries = json.feed?.results || json.feed?.entry || [];
      return entries.map((s, i) => {
        const rank   = i + 1;
        const name   = s['im:name']?.label   || s.name        || '';
        const artist = s['im:artist']?.label  || s.artistName  || '';
        const url    = s.link?.attributes?.href || s.url        || '';
        const artwork = s['im:image']?.[2]?.label || s.artworkUrl100 || null;
        return { rank, name, artist, url, artwork, velocity: _velocityScore(rank, 25), trend: _trendLabel(rank), source: 'iTunes' };
      }).filter(s => s.name);
    } catch { return []; }
  }

  // ── Reddit ──────────────────────────────────────────────────────────────────

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

  // ── Wikipedia ───────────────────────────────────────────────────────────────

  async function _wikipedia() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, '0');
    const dd   = String(d.getDate()).padStart(2, '0');
    try {
      const res = await fetch(`https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia/all-access/${yyyy}/${mm}/${dd}`);
      if (!res.ok) return [];
      const json = await res.json();
      return (json.items?.[0]?.articles || [])
        .filter(a => !WIKI_SKIP.test(a.article))
        .slice(0, 30)
        .map(a => ({ title: a.article.replace(/_/g,' '), views: a.views, url: `https://en.wikipedia.org/wiki/${a.article}` }));
    } catch { return []; }
  }

  async function _wikipediaToday() {
    try {
      const res = await fetch('https://en.wikipedia.org/w/api.php?action=query&list=mostviewed&pviprop=title|count&pvimlimit=30&format=json&origin=*');
      if (!res.ok) return [];
      const json = await res.json();
      return (json.query?.mostviewed || [])
        .filter(a => a.title && !WIKI_SKIP.test(a.title.toLowerCase()))
        .slice(0, 25)
        .map(a => ({ title: a.title.replace(/_/g,' '), count: a.count || 0, url: `https://en.wikipedia.org/wiki/${encodeURIComponent(a.title)}` }));
    } catch { return []; }
  }

  // ── Cache ───────────────────────────────────────────────────────────────────

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

  // ── fetchAll ────────────────────────────────────────────────────────────────

  async function fetchAll(period = 'week') {
    const cached = _readCache(period);
    if (cached) return cached;

    const [
      redditMusic, redditTech, redditPop,
      wikipedia, wikiTodayTop,
      appleMusic, appleTopAlbums, itunesTopSongs,
      spotifyCharts, billboardHot100,
    ] = await Promise.allSettled([
      _reddit('music', period),
      _reddit('tech',  period),
      _reddit('pop',   period),
      _wikipedia(),
      _wikipediaToday(),
      _appleMusic(),
      _appleTopAlbums(),
      _itunesTopSongs(),
      _spotifyCharts(),
      _billboardHot100(),
    ]).then(rs => rs.map(r => r.status === 'fulfilled' ? r.value : []));

    const data = {
      reddit: { music: redditMusic, tech: redditTech, pop: redditPop },
      wikipedia,
      wikiTodayTop,
      appleMusic,
      appleTopAlbums,
      itunesTopSongs,
      spotifyCharts,
      billboardHot100,
    };

    _writeCache(period, data);
    return data;
  }

  window.TrendData = { fetchAll };
})();
