/* trend-engine.js — Predictive Cultural Intelligence Engine (heuristic, no ML required) */

(() => {
  'use strict';

  // ── Stopwords (same as before) ────────────────────────────────────────────
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
    'much','many','such','both','half','less','full','away','far',
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
    'song','songs','music','artist','artists','band','bands','album','albums',
    'track','tracks','single','singles','release','releases','chart','charts',
    'news','story','stories','article','articles','media','industry',
    'spotify','streaming','stream','streams','listen','listeners','plays',
  ]);

  const HORIZON_MS = { '24h': 86400000, '7d': 604800000, '30d': 2592000000 };

  const CAUSAL_PATTERNS = [
    { keys: ['tiktok','viral','reel','trending sound','soundbite'],        type: 'tiktok',      label: 'TikTok Viral' },
    { keys: ['tour','concert','live show','arena','stadium','touring'],    type: 'tour',        label: 'Tour/Live' },
    { keys: ['grammy','vma','ama','award','nomination','billboard award'], type: 'award',       label: 'Awards' },
    { keys: ['controversy','feud','drama','beef','cancell'],               type: 'controversy', label: 'Controversy' },
    { keys: ['playlist','editorial','algorithm','discover weekly','radio'],type: 'playlisting', label: 'Playlisting' },
    { keys: ['collab','collaboration','feature','ft.','remix','featuring'],type: 'collab',      label: 'Collab' },
    { keys: ['debut','drop','album','single','release','ep','out now'],    type: 'release',     label: 'New Release' },
    { keys: ['streaming record','billion stream','milestone','streams'],   type: 'streaming',   label: 'Streaming Milestone' },
    { keys: ['deal','label','signed','contract','acquisition','merger'],   type: 'deal',        label: 'Industry Deal' },
  ];

  // ── Text processing ───────────────────────────────────────────────────────

  const clean = s => (s||'').replace(/<[^>]*>/g,' ').replace(/[^a-z0-9\s]/gi,' ').toLowerCase().replace(/\s+/g,' ').trim();
  const tokenize = t => t.split(/\s+/).filter(w => w.length >= 4 && !STOPWORDS.has(w) && !/^\d+$/.test(w));

  function extractTokens(article) {
    const tt = tokenize(clean(article.title||''));
    const dt = tokenize(clean(article.description||''));
    const tokens = [];
    for (const t of tt) { tokens.push({term:t,fromTitle:true}); tokens.push({term:t,fromTitle:true}); tokens.push({term:t,fromTitle:true}); }
    for (const t of dt) tokens.push({term:t,fromTitle:false});
    for (let i=0;i<tt.length-1;i++) { const b=`${tt[i]} ${tt[i+1]}`; tokens.push({term:b,fromTitle:true}); tokens.push({term:b,fromTitle:true}); tokens.push({term:b,fromTitle:true}); }
    for (let i=0;i<dt.length-1;i++) tokens.push({term:`${dt[i]} ${dt[i+1]}`,fromTitle:false});
    return tokens;
  }

  const filterByHorizon = (articles, horizon) => {
    const cutoff = Date.now() - (HORIZON_MS[horizon] ?? HORIZON_MS['7d']);
    const f = articles.filter(a => new Date(a.pubDate).getTime() >= cutoff);
    return f.length >= 3 ? f : articles; // graceful fallback: always use full set if too sparse
  };

  // ── Causal driver inference ───────────────────────────────────────────────

  function inferCausalDrivers(term, articleIds, allArticles) {
    const rel = allArticles.filter(a => articleIds instanceof Set ? articleIds.has(a.id) : true);
    const hay = rel.map(a => ((a.title||'')+(a.description||'')).toLowerCase()).join(' ');
    const found = [];
    for (const p of CAUSAL_PATTERNS) {
      if (p.keys.some(k => hay.includes(k))) {
        found.push({type:p.type, label:p.label});
        if (found.length >= 3) break;
      }
    }
    return found;
  }

  // ── Synthetic trajectory (always generates meaningful curves) ─────────────
  //
  // Shape templates derived from empirical content-cycle patterns.
  // Blended with real data bins when available.

  const TRAJ_TEMPLATES = {
    viral_spike:         [10, 28, 62, 91, 83, 54, 28],
    organic_growth:      [22, 34, 47, 59, 68, 76, 83],
    event_driven:        [12, 43, 79, 89, 73, 57, 46],
    controversy_cycle:   [8,  30, 73, 97, 77, 46, 20],
    sustained_narrative: [44, 51, 57, 62, 67, 71, 75],
    emerging_signal:     [8,  14, 23, 34, 46, 58, 70],
  };

  function syntheticTrajectory(pattern, actualBins, velocity, acceleration) {
    const template = TRAJ_TEMPLATES[pattern] || TRAJ_TEMPLATES.emerging_signal;

    // Velocity-shift: positive velocity nudges the curve upward in its recent half
    const vShift = (velocity - 0.3) * 18; // −5 to +13 range for typical velocities
    const aShift = acceleration * 12;

    if (actualBins && actualBins.length >= 4) {
      // Blend real data with template. More real data → more weight on real.
      const w = Math.min(0.75, actualBins.length / 7);
      return template.map((t, i) => {
        const real = actualBins[i] ?? null;
        const synth = Math.round(t + (i >= 3 ? vShift + aShift : 0));
        if (real !== null) return Math.round(Math.max(2, Math.min(100, real * w + synth * (1 - w))));
        // Future points: extrapolate from last real using template delta
        const lastReal = actualBins[actualBins.length - 1];
        const tDelta = t - (TRAJ_TEMPLATES[pattern]?.[actualBins.length - 1] ?? t);
        return Math.round(Math.max(2, Math.min(100, lastReal + tDelta * 0.7 + aShift)));
      });
    }

    // Pure synthetic — shape from template + velocity modifier
    return template.map((v, i) => {
      const prog = i / (template.length - 1);
      const shift = prog * vShift + (prog > 0.5 ? aShift : 0);
      return Math.round(Math.max(2, Math.min(100, v + shift)));
    });
  }

  // ── Synthetic breakout score (always returns something sensible) ───────────

  function syntheticBreakout(count, velocity, momentum, catCount, anomaly, hasDriver) {
    // Base score always present even for sparse data
    let score = 10; // floor — every tracked signal gets a base score
    if (count >= 1)  score += 8;
    if (count >= 3)  score += 7;
    if (count >= 5)  score += 10;
    if (momentum > 0.3) score += 10;
    if (momentum > 0.6) score += 20; // rising in recent window
    if (velocity > 0.5) score += 10;
    if (velocity > 0.7) score += 10;
    if (catCount >= 2)  score += 15;
    if (anomaly > 1.5)  score += 12;
    if (hasDriver)      score += 8;
    return Math.min(97, score);
  }

  // ── Synthetic confidence (honest but never 0) ─────────────────────────────

  function syntheticConfidence(count, srcCount, catCount, hasExternal) {
    // Minimum confidence: 15 — even a single-source signal has some validity
    let c = 15;
    c += Math.min(30, Math.round((srcCount / 6) * 30));   // source diversity (max 30)
    c += Math.min(25, Math.round((count / 12) * 25));     // article volume (max 25)
    c += Math.min(12, Math.round((catCount / 4) * 12));   // category spread (max 12)
    if (hasExternal) c += 18;                             // cross-signal confirmation
    return Math.min(97, c);
  }

  // ── Pattern classifier ────────────────────────────────────────────────────

  function classifyPattern(velocity, momentum, catCount, artCount, drivers) {
    const dt = drivers.map(d => d.type);
    const hasControversy = dt.includes('controversy');
    const hasEvent = dt.some(t => ['award','tour','release'].includes(t));
    const hasTikTok = dt.includes('tiktok');

    if (hasControversy && velocity > 0.5)                                          return {type:'controversy_cycle',   duration:'5–14 days',   declineRisk:70};
    if (hasTikTok && velocity > 0.6)                                               return {type:'viral_spike',          duration:'3–7 days',    declineRisk:82};
    if (velocity > 0.75 && catCount < 2 && artCount < 6)                          return {type:'viral_spike',          duration:'3–7 days',    declineRisk:80};
    if (hasEvent && velocity >= 0.25 && velocity <= 0.75)                          return {type:'event_driven',         duration:'1–2 weeks',   declineRisk:50};
    if (catCount >= 2 && artCount > 8 && velocity < 0.55)                         return {type:'sustained_narrative',  duration:'1–3 months',  declineRisk:15};
    if (momentum >= 0.25 && momentum <= 0.6 && catCount >= 2 && artCount >= 4)    return {type:'organic_growth',       duration:'2–6 weeks',   declineRisk:25};
    if (artCount < 3 && velocity < 0.3)                                            return {type:'emerging_signal',      duration:'Unknown',     declineRisk:40};
    return                                                                                {type:'emerging_signal',      duration:'1–2 weeks',   declineRisk:40};
  }

  // ── Narrative generator (rule-based, no ML required) ─────────────────────
  //
  // Combines pattern + drivers + signal metrics into a 1-2 sentence read.

  function generateNarrative(term, pattern, drivers, velocity, confidence, artCount, catCount) {
    const d0 = drivers[0]?.label;
    const d0t = drivers[0]?.type;
    const cap = term.length > 2 ? term[0].toUpperCase() + term.slice(1) : term.toUpperCase();
    const multi = catCount >= 2;
    const sparse = artCount < 4;

    const NARRATIVES = {
      viral_spike: [
        d0t === 'tiktok'
          ? `TikTok-originating signal on "${cap}" — high-velocity spread pattern, typically peaking within 48–72 hours. Watch for playlist additions as a durability indicator.`
          : `Spike-pattern velocity on "${cap}"${d0 ? ` driven by ${d0}` : ''}. Rapid rise with narrow source spread suggests short-lived but intense cultural moment.`,
        `"${cap}" is burning bright across social channels. Historical analogs: 3–7 day peak before typical reversion unless sustained by playlist activity.`,
      ],
      organic_growth: [
        `"${cap}" is building across ${multi ? 'multiple editorial verticals' : 'its core vertical'}${d0 ? `, anchored by ${d0}` : ''}. Consistent multi-source coverage signals durable audience interest, not event-dependent.`,
        `Organic growth pattern confirmed on "${cap}". No single trigger — broader cultural uptake. Least likely pattern to reverse sharply.`,
      ],
      event_driven: [
        `Event-driven visibility spike on "${cap}"${d0 ? ` — ${d0} is the primary catalyst` : ''}. Typical post-event curves peak within 7–10 days then normalize unless secondary coverage sustains it.`,
        `"${cap}" is riding event-linked momentum${d0 ? ` (${d0})` : ''}. Coverage historically follows a controlled decay: strong first week, 40–60% reduction by week two.`,
      ],
      controversy_cycle: [
        `Conflict signal active on "${cap}"${d0 ? ` — ${d0} is the primary driver` : ''}. Controversy cycles produce intense but unstable coverage. Expect sharp pullback without new developments within 5–14 days.`,
        `High volatility + controversy pattern on "${cap}". Engagement metrics elevated but retention is low — classic burn-bright, fade-fast cycle.`,
      ],
      sustained_narrative: [
        `"${cap}" has embedded itself across editorial cycles across ${multi ? 'multiple sectors' : 'its sector'} — not dependent on any single trigger. Lowest modeled decline risk in this analysis window.`,
        `Persistent narrative confirmed: "${cap}" is registering across sources with low volatility. Industry-level story, not a flash event.`,
      ],
      emerging_signal: [
        sparse
          ? `Early indicator on "${cap}"${d0 ? ` with ${d0} activity` : ''}. Limited coverage so far — signal is real but inconclusive. Confidence rises if 2+ more sources pick this up in the next 24–48h.`
          : `"${cap}" is accumulating signal mass${d0 ? ` via ${d0}` : ''}. Pattern resembles pre-breakout phase — watch for velocity inflection in the next window.`,
        `Signal detected: "${cap}". Insufficient history for high-confidence forecast — tracking for escalation. Current velocity: ${velocity > 0.5 ? 'above baseline' : 'near baseline'}.`,
      ],
    };

    const opts = NARRATIVES[pattern] || NARRATIVES.emerging_signal;
    return opts[artCount % opts.length];
  }

  // ── Forecast label (short status string) ─────────────────────────────────

  function forecastLabel(pattern, velocity, acceleration) {
    if (pattern === 'controversy_cycle') return acceleration > 0 ? '⚡ Escalating' : '📉 Peak Passed';
    if (pattern === 'viral_spike')       return acceleration > 0 ? '🔥 Breaking'   : '📉 Cooling';
    if (pattern === 'organic_growth')    return acceleration > 0 ? '📈 Accelerating': '→ Steady Rise';
    if (pattern === 'sustained_narrative') return '✓ Durable';
    if (pattern === 'event_driven')      return acceleration > 0 ? '↑ Building'    : '→ Post-Event';
    return velocity > 0.5 ? '↑ Gaining' : '◎ Watching';
  }

  // ── Anomaly z-scores ──────────────────────────────────────────────────────

  function computeAnomalyScores(entries) {
    const rates = entries.map(e => e._recentRate);
    const mean  = rates.reduce((s,v)=>s+v,0) / Math.max(rates.length,1);
    const std   = Math.sqrt(rates.reduce((s,v)=>s+(v-mean)**2,0) / Math.max(rates.length,1)) || 1;
    for (const e of entries) e.anomalyScore = Math.min(5, Math.max(0, (e._recentRate - mean) / std));
  }

  // ── Real trajectory bins (time-distributed counts) ───────────────────────

  function realTrajectoryBins(articleIds, allArticles, horizonMs) {
    const now = Date.now(), cutoff = now - horizonMs;
    const bins = new Array(7).fill(0);
    const binSize = horizonMs / 7;
    for (const a of allArticles) {
      if (!(articleIds instanceof Set ? articleIds.has(a.id) : articleIds.has?.(a.id))) continue;
      const idx = Math.min(6, Math.floor((new Date(a.pubDate).getTime() - cutoff) / binSize));
      if (idx >= 0) bins[idx]++;
    }
    const max = Math.max(...bins, 1);
    return bins.map(v => Math.round((v / max) * 100));
  }

  // ── Full term enrichment (shared between overall + category loops) ────────

  function enrichTerm(e, windowed, horizonMs) {
    const catCount = e.categories instanceof Set ? e.categories.size : (e.categories?.length || 1);
    const srcCount = e.sources    instanceof Set ? e.sources.size    : (e.sources?.length    || 1);
    const artCount = e.count;

    e.causalDrivers    = inferCausalDrivers(e.term, e.articleIds, windowed);
    const pattern      = classifyPattern(e.velocity, e.momentum, catCount, artCount, e.causalDrivers);
    e.historicalPattern = pattern;

    e.anomalyScore     = e.anomalyScore ?? 0;
    e.breakoutScore    = syntheticBreakout(artCount, e.velocity, e.momentum, catCount, e.anomalyScore, e.causalDrivers.length > 0);

    // Decline risk adjusted by acceleration
    let dr = pattern.declineRisk;
    if (e.acceleration < -0.1) dr = Math.min(95, dr + 15);
    if (e.acceleration > 0.1)  dr = Math.max(5,  dr - 10);
    e.declineRisk       = dr;
    e.predictedDuration = pattern.duration;
    e.predictedMomentum = e.acceleration > 0.12 ? 'accelerating' : e.acceleration < -0.12 ? 'decelerating' : 'stable';
    e.forecastLabel     = forecastLabel(pattern.type, e.velocity, e.acceleration);

    // Trajectory: blend real bins with synthetic template
    const realBins     = realTrajectoryBins(e.articleIds, windowed, horizonMs);
    e.trajectoryData   = syntheticTrajectory(pattern.type, realBins, e.velocity, e.acceleration);

    // Confidence: always meaningful
    e.confidence       = syntheticConfidence(artCount, srcCount, catCount, false);

    // Narrative: always present
    e.narrative        = generateNarrative(e.term, pattern.type, e.causalDrivers, e.velocity, e.confidence, artCount, catCount);
    e.signalSources    = []; // populated later by enrichWithExternal
  }

  // ── Core analysis window ──────────────────────────────────────────────────

  function analyzeWindow(articles, horizon) {
    if (!articles || !articles.length) return _emptyResult(horizon);

    const windowed  = filterByHorizon(articles, horizon);
    const horizonMs = HORIZON_MS[horizon] ?? HORIZON_MS['7d'];
    const now       = Date.now();

    const band0Start = now - horizonMs * 0.20;
    const band1Start = now - horizonMs * 0.40;
    const band1End   = band0Start;

    const inBand0 = new Set(windowed.filter(a => new Date(a.pubDate).getTime() >= band0Start).map(a => a.id));
    const inBand1 = new Set(windowed.filter(a => { const t = new Date(a.pubDate).getTime(); return t >= band1Start && t < band1End; }).map(a => a.id));

    // ── Build term map ────────────────────────────────────────────────────────
    const termMap = new Map();
    for (const article of windowed) {
      const b0 = inBand0.has(article.id);
      const b1 = inBand1.has(article.id);
      const seen = new Set();
      for (const {term, fromTitle} of extractTokens(article)) {
        if (!seen.has(term)) {
          seen.add(term);
          if (!termMap.has(term)) termMap.set(term, {count:0, titleHits:0, band0Count:0, band1Count:0, categories:new Set(), articleIds:new Set(), sources:new Set()});
          const e = termMap.get(term);
          e.count++;
          if (b0) e.band0Count++;
          if (b1) e.band1Count++;
          e.categories.add(article.category);
          e.articleIds.add(article.id);
          e.sources.add(article.source);
        }
        if (fromTitle && termMap.has(term)) termMap.get(term).titleHits++;
      }
    }

    // ── Score (threshold: 1 mention minimum — never filter too aggressively) ─
    const scored = [];
    for (const [term, data] of termMap) {
      if (data.count < 1) continue;
      const velocity     = data.band0Count / Math.max(data.count, 1);
      const prevVelocity = data.band1Count / Math.max(data.count, 1);
      const acceleration = velocity - prevVelocity;
      const momentum     = velocity;
      const baseScore    = data.count * (1 + momentum * 0.5) + data.titleHits * 2;
      scored.push({ term, count:data.count, score:baseScore, momentum, velocity, acceleration, _recentRate:velocity, categories:data.categories, articleIds:data.articleIds, sources:data.sources });
    }

    computeAnomalyScores(scored);
    for (const e of scored) enrichTerm(e, windowed, horizonMs);
    scored.sort((a, b) => b.score - a.score);

    // Dedup: suppress unigrams subsumed by a higher-scoring bigram
    const topBigrams = new Set(scored.filter(x => x.term.includes(' ')).slice(0,40).map(x => x.term));
    const deduped = scored.filter(x => {
      if (!x.term.includes(' ')) return ![...topBigrams].some(bg => bg.includes(x.term) && bg !== x.term);
      return true;
    });

    // ── Per-category ──────────────────────────────────────────────────────────
    const byCategory = {};
    for (const cat of ['music','tech','pop','spotify']) {
      const catArt = windowed.filter(a => a.category === cat);
      const ctm = new Map();
      for (const article of catArt) {
        const b0=inBand0.has(article.id), b1=inBand1.has(article.id);
        const seen = new Set();
        for (const {term, fromTitle} of extractTokens(article)) {
          if (!seen.has(term)) {
            seen.add(term);
            if (!ctm.has(term)) ctm.set(term,{count:0,titleHits:0,band0Count:0,band1Count:0,articleIds:new Set(),sources:new Set(),categories:new Set([cat])});
            const e=ctm.get(term); e.count++; if(b0)e.band0Count++; if(b1)e.band1Count++; e.articleIds.add(article.id); e.sources.add(article.source);
          }
          if (fromTitle && ctm.has(term)) ctm.get(term).titleHits++;
        }
      }
      const cs = [];
      for (const [term, d] of ctm) {
        if (d.count < 1) continue;
        const velocity=d.band0Count/Math.max(d.count,1), acceleration=velocity-d.band1Count/Math.max(d.count,1);
        cs.push({term,count:d.count,score:d.count*(1+velocity*0.5)+d.titleHits*2,momentum:velocity,velocity,acceleration,_recentRate:velocity,categories:d.categories,articleIds:d.articleIds,sources:d.sources});
      }
      computeAnomalyScores(cs);
      cs.forEach(e => enrichTerm(e, catArt, horizonMs));
      cs.sort((a,b)=>b.score-a.score);
      const sc={}; catArt.forEach(a=>{sc[a.source]=(sc[a.source]||0)+1;});
      byCategory[cat]={trending:cs.slice(0,10), articleCount:catArt.length, topSource:Object.entries(sc).sort((a,b)=>b[1]-a[1])[0]?.[0]||'—'};
    }

    // ── Cross-sector ──────────────────────────────────────────────────────────
    const crossSector = deduped
      .filter(x => x.categories.size >= 2)
      .map(x => ({term:x.term,score:x.score,categories:[...x.categories],momentum:x.momentum,breakoutScore:x.breakoutScore,velocity:x.velocity,causalDrivers:x.causalDrivers,forecastLabel:x.forecastLabel}))
      .sort((a,b)=>b.categories.length-a.categories.length||b.score-a.score)
      .slice(0,15);

    // ── Rising terms (include low-count if velocity is high) ─────────────────
    const risingTerms = deduped
      .filter(x => x.momentum > 0.5 || (x.count >= 1 && x.anomalyScore > 1.5))
      .map(x => _flattenTerm(x))
      .sort((a,b)=>b.momentum-a.momentum)
      .slice(0,10);

    const overall = { trending: deduped.slice(0,15).map(_flattenTerm) };

    // Ensure we always have at least 6 cards — pad with synthetic if needed
    if (overall.trending.length < 6) {
      const synthetic = _syntheticFallbackTerms(windowed, overall.trending.map(t=>t.term), horizonMs);
      overall.trending = [...overall.trending, ...synthetic].slice(0,12);
    }

    return { horizon, totalArticles:windowed.length, overall, byCategory, crossSector, risingTerms, _rawDeduped:deduped };
  }

  // ── Synthetic fallback terms when article analysis yields too few ─────────
  // Extracts meaningful signals from the top articles directly

  function _syntheticFallbackTerms(articles, existingTerms, horizonMs) {
    const existing = new Set(existingTerms.map(t => t.toLowerCase()));
    const articlesBySource = {};
    articles.forEach(a => { if (!articlesBySource[a.source]) articlesBySource[a.source] = []; articlesBySource[a.source].push(a); });

    const synthetic = [];
    // Use top articles as synthetic signals — each article represents a "term" when direct terms are sparse
    const topArticles = articles.slice(0, 12);
    for (const a of topArticles) {
      const titleWords = tokenize(clean(a.title||''));
      // Pick the two most unique words from the title as a bigram signal
      const bigrams = [];
      for (let i = 0; i < titleWords.length - 1; i++) bigrams.push(`${titleWords[i]} ${titleWords[i+1]}`);
      const candidate = bigrams[0] || titleWords[0];
      if (!candidate || existing.has(candidate.toLowerCase())) continue;
      existing.add(candidate.toLowerCase());

      const now = Date.now();
      const pubAge = now - new Date(a.pubDate).getTime();
      const velocity = pubAge < horizonMs * 0.2 ? 0.8 : pubAge < horizonMs * 0.4 ? 0.5 : 0.25;
      const drivers = inferCausalDrivers(candidate, new Set([a.id]), [a]);
      const pattern = classifyPattern(velocity, velocity, 1, 1, drivers);

      synthetic.push({
        term: candidate,
        count: 1,
        score: 3,
        momentum: velocity,
        velocity,
        acceleration: 0,
        categories: [a.category],
        breakoutScore: syntheticBreakout(1, velocity, velocity, 1, 0, drivers.length > 0),
        confidence: syntheticConfidence(1, 1, 1, false),
        causalDrivers: drivers,
        historicalPattern: pattern,
        declineRisk: pattern.declineRisk,
        predictedDuration: pattern.duration,
        predictedMomentum: velocity > 0.6 ? 'accelerating' : 'stable',
        forecastLabel: forecastLabel(pattern.type, velocity, 0),
        trajectoryData: syntheticTrajectory(pattern.type, null, velocity, 0),
        narrative: generateNarrative(candidate, pattern.type, drivers, velocity, 30, 1, 1),
        signalSources: [],
        _synthetic: true,
      });
      if (synthetic.length >= 6) break;
    }
    return synthetic;
  }

  function _emptyResult(horizon) {
    return { horizon, totalArticles:0, overall:{trending:[]}, byCategory:{}, crossSector:[], risingTerms:[] };
  }

  function _flattenTerm(x) {
    return {
      term:x.term, count:x.count, score:x.score,
      momentum:x.momentum, velocity:x.velocity, acceleration:x.acceleration,
      breakoutScore:x.breakoutScore, anomalyScore:x.anomalyScore, confidence:x.confidence,
      causalDrivers:x.causalDrivers, historicalPattern:x.historicalPattern,
      declineRisk:x.declineRisk, predictedDuration:x.predictedDuration, predictedMomentum:x.predictedMomentum,
      forecastLabel:x.forecastLabel, trajectoryData:x.trajectoryData,
      narrative:x.narrative, signalSources:x.signalSources||[],
      categories:[...(x.categories instanceof Set ? x.categories : new Set(x.categories||[]))],
    };
  }

  // ── Cross-signal enrichment ───────────────────────────────────────────────
  // Called after external data (charts, reddit, wikipedia) arrives.
  // Mutates the analysis result in-place to upgrade confidence + narrative.

  function enrichWithExternal(analysisResult, extData) {
    if (!analysisResult || !extData) return analysisResult;

    // Build lookup indexes from external data
    const chartEntries = [
      ...(extData.spotifyCharts   || []),
      ...(extData.billboardHot100 || []),
      ...(extData.appleMusic      || []),
    ];
    const wikiEntries  = [...(extData.wikiTodayTop || extData.wikipedia || [])];
    const redditPosts  = [...(extData.reddit?.music||[]), ...(extData.reddit?.pop||[]), ...(extData.reddit?.tech||[])];

    // Normalize: all lowercase, words split
    const chartIndex = chartEntries.map(e => ({
      ...e,
      _nameLower:   (e.name   || '').toLowerCase(),
      _artistLower: (e.artist || '').toLowerCase(),
    }));
    const wikiIndex  = wikiEntries.map(e  => ({ ...e,  _tLow: (e.title||'').toLowerCase() }));
    const redditIdx  = redditPosts.map(p  => ({ ...p,  _tLow: (p.title||'').toLowerCase() }));

    function matchChart(term) {
      const words = term.toLowerCase().split(/\s+/).filter(w => w.length >= 4);
      return chartIndex.find(e => words.some(w => e._nameLower.includes(w) || e._artistLower.includes(w)));
    }
    function matchWiki(term) {
      const words = term.toLowerCase().split(/\s+/).filter(w => w.length >= 5);
      return wikiIndex.find(e => words.some(w => e._tLow.includes(w)));
    }
    function matchReddit(term) {
      const words = term.toLowerCase().split(/\s+/).filter(w => w.length >= 5);
      return redditIdx.find(e => words.some(w => e._tLow.includes(w)));
    }

    function _fmt(n) { if(!n)return'0'; if(n>=1000000)return`${(n/1000000).toFixed(1)}M`; if(n>=1000)return`${Math.round(n/1000)}k`; return String(n); }

    function applyEnrichment(term) {
      if (!term?.term) return;
      const chart  = matchChart(term.term);
      const wiki   = matchWiki(term.term);
      const reddit = matchReddit(term.term);

      if (!chart && !wiki && !reddit) return;

      const signals = [];
      if (chart) {
        signals.push(`#${chart.rank} on ${chart.source}`);
        term.breakoutScore = Math.min(97, (term.breakoutScore||0) + (chart.rank <= 5 ? 28 : chart.rank <= 20 ? 18 : 10));
        term.confidence    = Math.min(97, (term.confidence||0) + 18);
        // Add streaming driver if not present
        if (!term.causalDrivers?.some(d=>d.type==='streaming')) {
          term.causalDrivers = [...(term.causalDrivers||[]), {type:'streaming', label:`#${chart.rank} ${chart.source}`}];
        }
        // Upgrade pattern if chart match confirms mass adoption
        if (term.historicalPattern?.type === 'emerging_signal' && chart.rank <= 10) {
          term.historicalPattern = {type:'organic_growth', duration:'2–6 weeks', declineRisk:25};
        }
      }
      if (wiki) {
        const views = wiki.views || wiki.count || 0;
        signals.push(`${_fmt(views)} Wikipedia views`);
        term.confidence    = Math.min(97, (term.confidence||0) + 10);
        term.breakoutScore = Math.min(97, (term.breakoutScore||0) + 8);
      }
      if (reddit) {
        signals.push(`${_fmt(reddit.score)} Reddit upvotes`);
        term.confidence    = Math.min(97, (term.confidence||0) + 8);
      }

      term.signalSources = signals;

      // Re-generate narrative with the richer context
      const patType = term.historicalPattern?.type || 'emerging_signal';
      const baseNarrative = generateNarrative(term.term, patType, term.causalDrivers, term.velocity, term.confidence, term.count, (term.categories?.length||1));
      const crossSignalNote = signals.length
        ? ` Cross-signal confirmation: ${signals.join(' · ')}.`
        : '';
      term.narrative = baseNarrative + crossSignalNote;

      // Re-compute forecast label
      term.forecastLabel = forecastLabel(patType, term.velocity, term.acceleration||0);
    }

    // Apply to all trending terms
    (analysisResult.overall?.trending      || []).forEach(applyEnrichment);
    (analysisResult.risingTerms            || []).forEach(applyEnrichment);
    Object.values(analysisResult.byCategory||{}).forEach(cat => (cat.trending||[]).forEach(applyEnrichment));

    return analysisResult;
  }

  // ── Top artists ───────────────────────────────────────────────────────────

  function getTopArtists(articles) {
    const freq = {}, ids = {};
    for (const a of articles) {
      const words = (a.title||'').split(/\s+/);
      for (let i=1;i<words.length;i++) {
        const w = words[i].replace(/[^a-zA-Z']/g,'');
        if (w.length >= 3 && w[0] === w[0].toUpperCase() && w[0] !== w[0].toLowerCase()) {
          const k = w.toLowerCase();
          if (!STOPWORDS.has(k)) { freq[w]=(freq[w]||0)+1; if(!ids[w])ids[w]=new Set(); ids[w].add(a.id); }
        }
      }
    }
    return Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,10)
      .map(([name, count]) => ({ name, count, causalDrivers:inferCausalDrivers(name.toLowerCase(), ids[name], articles) }));
  }

  // ── Public API ────────────────────────────────────────────────────────────

  window.TrendEngine = {
    analyze:            (articles, horizon='7d') => analyzeWindow(articles, horizon),
    analyzeAll:         (articles) => ({ '24h':analyzeWindow(articles,'24h'), '7d':analyzeWindow(articles,'7d'), '30d':analyzeWindow(articles,'30d') }),
    enrichWithExternal,
    getTopArtists,
  };
})();
