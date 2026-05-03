(() => {
  'use strict';

  // ── Stopwords ────────────────────────────────────────────────────────
  const STOPWORDS = new Set([
    'a','an','the','and','or','but','not','no','nor','so','yet','both','either',
    'neither','for','of','in','on','at','to','by','as','if','up','out','off',
    'into','onto','over','under','through','during','before','after','above',
    'below','from','with','about','against','between','among','along','around',
    'down','upon','within','without','toward','towards','except','since','until',
    'than','then','though','although','because','unless','while','where','when',
    'who','whom','whose','which','what','that','this','these','those','there',
    'here','how','why','each','every','all','any','few','more','most','other',
    'some','such','same','own','even','once','again','further','just','now',
    'also','very','too','only','both','back','way','well','still','part','long',
    'much','many','much','such','both','half','less','full','away','far',
    'i','me','my','we','us','our','you','your','he','him','his','she','her',
    'it','its','they','them','their','one','two','three','four','five','six',
    'seven','eight','nine','ten','s','t','d','m','re','ve','ll',
    'is','are','was','were','be','been','being','am','do','does','did','done',
    'have','has','had','having','will','would','could','should','shall','may',
    'might','must','can','need','dare','ought','used',
    'get','got','getting','make','made','making','take','took','taken','taking',
    'say','said','says','know','knew','known','think','thought','come','came',
    'coming','goes','going','gone','went','go','give','gave','given','giving',
    'see','saw','seen','look','looks','looked','looking','find','found','finding',
    'use','used','using','want','wants','wanted','keep','kept','keeping',
    'let','lets','letting','put','puts','putting','seem','seems','seemed',
    'help','helps','helped','call','calls','called','turn','turns','turned',
    'ask','asks','asked','need','needs','needed','feel','felt','feeling',
    'try','tried','trying','leave','left','leaving','show','shows','showed',
    'move','moves','moved','moving','follow','follows','followed','work',
    'works','worked','working','live','lives','lived','living','hold','held',
    'run','runs','ran','running','meet','met','meeting','pay','pays','paid',
    'play','plays','played','playing','set','sets','setting','add','adds',
    'added','adding','lead','leads','led','leading','bring','brought',
    'plan','plans','planned','planning','happen','happens','happened',
    'include','includes','included','including','continue','continues',
    'continued','continuing','change','changes','changed','changing',
    'point','points','pointed','pointing','start','starts','started',
    'allow','allows','allowed','allowing','create','creates','created',
    'offer','offers','offered','offering','begin','begins','began','begun',
    'state','states','stated','stating','remain','remains','remained',
    'become','becomes','became','becoming','grow','grows','grew','grown',
    'provide','provides','provided','providing','consider','considers',
    'appear','appears','appeared','appearing','expect','expects','expected',
    'new','old','good','great','big','small','large','high','low','long',
    'short','next','last','early','later','little','own','right','left',
    'open','far','free','real','true','false','sure','able','likely',
    'hard','easy','quick','fast','slow','top','best','better','worse',
    'worst','first','second','third','recent','current','major','key',
    'main','general','important','different','various','possible','available',
    'according','including','following','see','per','ago','via','like',
    'week','month','year','day','time','today','yesterday','tomorrow',
    'people','person','thing','things','place','part','point','number',
    'line','fact','case','week','weeks','months','years','days','times',
    'percent','number','lot','lots','said','says','report','reports',
    'company','companies','group','groups','team','teams','world','country',
    'us','uk','users','user','based','known','well','back','came',
  ]);

  // ── Horizon helpers ──────────────────────────────────────────────────
  const HORIZON_MS = { '24h': 86400000, '7d': 604800000, '30d': 2592000000 };

  const filterByHorizon = (articles, horizon) => {
    const cutoff = Date.now() - (HORIZON_MS[horizon] ?? HORIZON_MS['30d']);
    const filtered = articles.filter(a => new Date(a.pubDate).getTime() >= cutoff);
    // If fewer than 5 articles in window, fall back to full set (sparse data)
    return filtered.length >= 5 ? filtered : articles;
  };

  // ── Text processing ──────────────────────────────────────────────────
  const clean = (s) => (s || '').replace(/<[^>]*>/g, ' ').replace(/[^a-z0-9\s]/gi, ' ').toLowerCase().replace(/\s+/g, ' ').trim();

  const tokenize = (text) => text.split(/\s+/).filter(w => w.length >= 4 && !STOPWORDS.has(w) && !/^\d+$/.test(w));

  // Extract weighted tokens from a single article (title 3×, description 1×)
  const extractTokens = (article) => {
    const titleText   = clean(article.title || '');
    const descText    = clean(article.description || '');
    const titleTokens = tokenize(titleText);
    const descTokens  = tokenize(descText);

    const tokens = [];

    // Title tokens at weight 3
    for (const t of titleTokens) {
      tokens.push({ term: t, fromTitle: true });
      tokens.push({ term: t, fromTitle: true });
      tokens.push({ term: t, fromTitle: true });
    }
    // Desc tokens at weight 1
    for (const t of descTokens) tokens.push({ term: t, fromTitle: false });

    // Bigrams from title
    for (let i = 0; i < titleTokens.length - 1; i++) {
      const bigram = `${titleTokens[i]} ${titleTokens[i+1]}`;
      tokens.push({ term: bigram, fromTitle: true });
      tokens.push({ term: bigram, fromTitle: true });
      tokens.push({ term: bigram, fromTitle: true });
    }
    // Bigrams from desc
    for (let i = 0; i < descTokens.length - 1; i++) {
      tokens.push({ term: `${descTokens[i]} ${descTokens[i+1]}`, fromTitle: false });
    }

    return tokens;
  };

  // ── Core analysis ────────────────────────────────────────────────────
  const analyzeWindow = (articles, horizon) => {
    if (!articles.length) return null;

    const windowed = filterByHorizon(articles, horizon);
    const horizonMs = HORIZON_MS[horizon] ?? HORIZON_MS['30d'];

    // The "recent" sub-window is the last 25% of the horizon
    const recentCutoff = Date.now() - horizonMs * 0.25;
    const recentIds = new Set(windowed.filter(a => new Date(a.pubDate).getTime() >= recentCutoff).map(a => a.id));

    // term → { count, titleHits, recentCount, categories: Set, articleIds: Set }
    const termMap = new Map();

    for (const article of windowed) {
      const isRecent  = recentIds.has(article.id);
      const tokens    = extractTokens(article);
      // Deduplicate terms per article so one article can't inflate a term's count
      const seenThisArticle = new Set();

      for (const { term, fromTitle } of tokens) {
        if (!seenThisArticle.has(term)) {
          seenThisArticle.add(term);
          if (!termMap.has(term)) termMap.set(term, { count:0, titleHits:0, recentCount:0, categories: new Set(), articleIds: new Set() });
          const entry = termMap.get(term);
          entry.count++;
          if (isRecent) entry.recentCount++;
          entry.categories.add(article.category);
          entry.articleIds.add(article.id);
        }
        // Title hits counted separately (not deduplicated per article)
        if (fromTitle) {
          const entry = termMap.get(term);
          if (entry) entry.titleHits++;
        }
      }
    }

    // Score every term
    const scored = [];
    for (const [term, data] of termMap) {
      if (data.count < 2) continue; // need at least 2 distinct article mentions
      const momentum = data.recentCount / Math.max(data.count, 1);
      const baseScore = data.count * (1 + momentum * 0.5);
      const score = baseScore + data.titleHits * 2;
      scored.push({ term, count: data.count, score, momentum, categories: data.categories });
    }

    scored.sort((a, b) => b.score - a.score);

    // Dedup: suppress unigrams that are substrings of a higher-scoring bigram
    const topBigrams = new Set(scored.filter(x => x.term.includes(' ')).slice(0, 40).map(x => x.term));
    const deduplicated = scored.filter(x => {
      if (!x.term.includes(' ')) {
        // Suppress if this word appears inside any top bigram
        return !([...topBigrams].some(bg => bg.includes(x.term) && bg !== x.term));
      }
      return true;
    });

    // ── Per-category breakdown ──────────────────────────────────────────
    const CATS = ['music', 'tech', 'pop', 'spotify'];
    const byCategory = {};

    for (const cat of CATS) {
      const catArticles = windowed.filter(a => a.category === cat);
      const catTermMap  = new Map();

      for (const article of catArticles) {
        const isRecent = recentIds.has(article.id);
        const seen     = new Set();
        for (const { term, fromTitle } of extractTokens(article)) {
          if (!seen.has(term)) {
            seen.add(term);
            if (!catTermMap.has(term)) catTermMap.set(term, { count:0, titleHits:0, recentCount:0 });
            const e = catTermMap.get(term);
            e.count++;
            if (isRecent) e.recentCount++;
          }
          if (fromTitle && catTermMap.has(term)) catTermMap.get(term).titleHits++;
        }
      }

      const catScored = [];
      for (const [term, d] of catTermMap) {
        if (d.count < 1) continue;
        const momentum = d.recentCount / Math.max(d.count, 1);
        const score = d.count * (1 + momentum * 0.5) + d.titleHits * 2;
        catScored.push({ term, count: d.count, score, momentum });
      }
      catScored.sort((a, b) => b.score - a.score);

      // Source frequency for this category
      const srcCount = {};
      for (const a of catArticles) srcCount[a.source] = (srcCount[a.source] || 0) + 1;
      const topSource = Object.entries(srcCount).sort((a,b)=>b[1]-a[1])[0]?.[0] || '—';

      byCategory[cat] = {
        trending:     catScored.slice(0, 10),
        articleCount: catArticles.length,
        topSource,
      };
    }

    // ── Cross-sector terms ─────────────────────────────────────────────
    const crossSector = deduplicated
      .filter(x => x.categories.size >= 2)
      .map(x => ({ term: x.term, score: x.score, categories: [...x.categories], momentum: x.momentum }))
      .sort((a, b) => b.categories.length - a.categories.length || b.score - a.score)
      .slice(0, 15);

    // ── Rising terms ──────────────────────────────────────────────────
    const risingTerms = deduplicated
      .filter(x => x.momentum > 0.65 && x.count >= 2)
      .map(x => ({ term: x.term, score: x.score, momentum: x.momentum, category: [...x.categories][0] }))
      .sort((a, b) => b.momentum - a.momentum)
      .slice(0, 10);

    return {
      horizon,
      totalArticles: windowed.length,
      overall:    { trending: deduplicated.slice(0, 15) },
      byCategory,
      crossSector,
      risingTerms,
    };
  };

  window.TrendEngine = {
    analyze:    (articles, horizon = '7d') => analyzeWindow(articles, horizon),
    analyzeAll: (articles) => ({
      '24h': analyzeWindow(articles, '24h'),
      '7d':  analyzeWindow(articles, '7d'),
      '30d': analyzeWindow(articles, '30d'),
    }),
  };
})();
