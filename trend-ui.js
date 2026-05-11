/* trend-ui.js — Cultural Intelligence Terminal v3 */

// ── Style injection ──────────────────────────────────────────────────────────
function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    #section-trends { width: 100%; }

    /* ── Command bar ───────────────────────────────────────────── */
    .intel-command-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 28px;
      flex-wrap: wrap;
    }
    .intel-live-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: var(--green);
      margin-right: 4px;
    }
    .intel-live-dot {
      width: 7px; height: 7px;
      background: var(--green);
      border-radius: 50%;
      animation: pulse-dot 1.6s ease-in-out infinite;
      flex-shrink: 0;
    }
    .horizon-pill {
      padding: 6px 16px;
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
    .horizon-pill.active { background: var(--green); border-color: var(--green); color: #000; }
    .intel-feed-meta {
      margin-left: auto;
      font-size: 11px;
      color: #444;
    }

    /* ── Section label ─────────────────────────────────────────── */
    .intel-section-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .intel-section-label::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--border);
    }

    /* ── Charts section ────────────────────────────────────────── */
    .intel-charts-wrap { margin-bottom: 36px; }

    .charts-tabs {
      display: flex;
      gap: 2px;
      margin-bottom: 14px;
      background: var(--surface2);
      border-radius: 8px;
      padding: 3px;
      width: fit-content;
      flex-wrap: wrap;
    }
    .charts-tab-btn {
      padding: 6px 16px;
      border-radius: 6px;
      border: none;
      background: transparent;
      color: var(--muted);
      font-size: 11px;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      transition: all var(--transition);
      letter-spacing: 0.3px;
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .charts-tab-btn.active {
      background: var(--surface);
      color: var(--white);
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
    }
    .charts-tab-btn .tab-source-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .charts-tab-btn[data-chart-tab="spotify"] .tab-source-dot   { background: #1DB954; }
    .charts-tab-btn[data-chart-tab="billboard"] .tab-source-dot { background: #e8b400; }
    .charts-tab-btn[data-chart-tab="apple"] .tab-source-dot     { background: #fc3c44; }
    .charts-tab-btn .tab-count {
      font-size: 9px; font-weight: 800;
      padding: 1px 5px; border-radius: 4px;
      background: var(--surface2); color: var(--muted);
    }
    .charts-tab-btn.active .tab-count { background: rgba(29,185,84,0.15); color: var(--green); }

    .charts-list-wrap { display: none; }
    .charts-list-wrap.active { display: block; }

    /* list view for long charts */
    .chart-list-view {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .chart-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      border-radius: 8px;
      background: var(--surface);
      border: 1px solid transparent;
      text-decoration: none;
      transition: border-color var(--transition), background var(--transition);
    }
    .chart-row:hover { border-color: rgba(29,185,84,0.3); background: #222; }

    .chart-row-rank {
      font-size: 13px; font-weight: 800;
      color: #444; min-width: 22px; text-align: right;
      flex-shrink: 0; font-variant-numeric: tabular-nums;
    }
    .chart-row:nth-child(1) .chart-row-rank,
    .chart-row:nth-child(2) .chart-row-rank,
    .chart-row:nth-child(3) .chart-row-rank { color: var(--green); }

    .chart-row-art {
      width: 34px; height: 34px;
      border-radius: 4px;
      object-fit: cover;
      flex-shrink: 0;
      background: linear-gradient(135deg, #1a1a2e, #282828);
    }
    .chart-row-art-ph {
      width: 34px; height: 34px;
      border-radius: 4px;
      background: linear-gradient(135deg, #1a1a2e, #282828);
      flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px;
    }

    .chart-row-info { flex: 1; min-width: 0; }
    .chart-row-name {
      font-size: 13px; font-weight: 700; color: var(--white);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .chart-row-artist {
      font-size: 11px; color: var(--muted);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      margin-top: 1px;
    }

    .chart-row-meta {
      display: flex; align-items: center; gap: 8px;
      flex-shrink: 0;
    }
    .chart-row-movement {
      font-size: 10px; font-weight: 700;
      min-width: 28px; text-align: center;
    }
    .move-up   { color: var(--green); }
    .move-down { color: #ff7a5c; }
    .move-same { color: #555; }
    .move-new  { color: #ffd54f; }

    .chart-row-weeks {
      font-size: 10px; color: #444;
      white-space: nowrap;
    }

    .chart-trend-badge {
      font-size: 9px; font-weight: 700;
      padding: 2px 6px; border-radius: 6px;
      white-space: nowrap; flex-shrink: 0;
      letter-spacing: 0.5px;
    }
    .chart-trend-badge.rising  { background: rgba(29,185,84,0.15);  color: var(--green); }
    .chart-trend-badge.stable  { background: rgba(70,135,214,0.12); color: #9ac0ff; }
    .chart-trend-badge.cooling { background: rgba(255,100,60,0.12); color: #ff7a5c; }

    /* two-column list for big charts */
    .chart-columns {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 20px;
    }
    @media (max-width: 900px) { .chart-columns { grid-template-columns: 1fr; } }

    /* Skeleton cards */
    .chart-card-skeleton {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 11px 12px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 10px;
    }
    @media (max-width: 1100px) { .charts-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 680px)  { .charts-grid { grid-template-columns: repeat(2, 1fr); } }
    .sk-art   { width:34px; height:34px; border-radius:4px; flex-shrink:0; }
    .sk-lines { flex:1; display:flex; flex-direction:column; gap:6px; }
    .sk-ln    { height:11px; border-radius:4px; }
    .sk-ln-w1 { width:80%; }
    .sk-ln-w2 { width:55%; }

    /* ── Intelligence grid ─────────────────────────────────────── */
    .intel-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 36px;
    }
    @media (max-width: 1100px) { .intel-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 680px)  { .intel-grid { grid-template-columns: 1fr; } }

    /* ── Trend card ────────────────────────────────────────────── */
    .trend-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 13px;
      position: relative;
      overflow: hidden;
      transition: transform var(--transition), border-color var(--transition), box-shadow var(--transition);
    }
    .trend-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 40px rgba(0,0,0,0.5);
    }
    .trend-card.breakout-high {
      border-color: rgba(29,185,84,0.45);
      box-shadow: 0 0 20px rgba(29,185,84,0.07);
    }
    .trend-card.breakout-high::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, var(--green), transparent);
    }
    .trend-card.breakout-medium { border-color: rgba(255,193,7,0.25); }
    .trend-card.pattern-controversy_cycle { border-color: rgba(255,100,60,0.35); }
    .trend-card.pattern-controversy_cycle::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, #ff6433, transparent);
    }

    .trend-card-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
    }
    .trend-pattern-badge {
      font-size: 9px; font-weight: 700; letter-spacing: 0.8px;
      text-transform: uppercase; padding: 3px 8px; border-radius: 5px;
      white-space: nowrap; flex-shrink: 0;
    }
    .pat-viral_spike        { background:rgba(255,62,78,0.15);  color:#ff8f9a; border:1px solid rgba(255,62,78,0.3); }
    .pat-organic_growth     { background:rgba(29,185,84,0.15);  color:var(--green); border:1px solid rgba(29,185,84,0.3); }
    .pat-event_driven       { background:rgba(70,135,214,0.15); color:#9ac0ff; border:1px solid rgba(70,135,214,0.3); }
    .pat-controversy_cycle  { background:rgba(255,120,30,0.15); color:#ffb07a; border:1px solid rgba(255,120,30,0.3); }
    .pat-sustained_narrative{ background:rgba(155,89,182,0.15); color:#c39ee8; border:1px solid rgba(155,89,182,0.3); }
    .pat-emerging_signal    { background:rgba(255,193,7,0.12);  color:#ffd54f; border:1px solid rgba(255,193,7,0.3); }

    .trend-breakout-wrap { text-align: right; flex-shrink: 0; }
    .trend-breakout-num {
      font-size: 22px; font-weight: 800; line-height: 1;
      font-variant-numeric: tabular-nums;
    }
    .trend-breakout-num .bpct { font-size: 11px; font-weight: 500; color: var(--muted); }
    .bp-high   { color: var(--green); }
    .bp-medium { color: #ffd54f; }
    .bp-low    { color: #555; }
    .trend-breakout-lbl {
      font-size: 9px; font-weight: 600; letter-spacing: 1px;
      text-transform: uppercase; color: var(--muted); margin-top: 2px;
    }

    .trend-term {
      font-size: 16px; font-weight: 800; color: var(--white);
      line-height: 1.3; text-transform: capitalize; letter-spacing: -0.2px;
    }

    /* Signal bars */
    .trend-bars { display: flex; flex-direction: column; gap: 7px; }
    .bar-row { display: flex; align-items: center; gap: 8px; }
    .bar-lbl {
      font-size: 9px; font-weight: 700; letter-spacing: 1px;
      text-transform: uppercase; color: #444;
      width: 50px; flex-shrink: 0;
    }
    .bar-track {
      flex: 1; height: 4px;
      background: var(--surface2); border-radius: 2px; overflow: hidden;
    }
    .bar-fill { height: 100%; border-radius: 2px; }
    .bar-signal  { background: linear-gradient(90deg, #1DB954, #1ed760); }
    .bar-vel     { background: linear-gradient(90deg, #4687D6, #7eb3ff); }
    .bar-decline { background: linear-gradient(90deg, #ff6433, #ffab7a); }
    .bar-val {
      font-size: 11px; font-weight: 700; color: var(--muted);
      width: 32px; text-align: right; flex-shrink: 0;
      font-variant-numeric: tabular-nums;
    }

    /* Sparkline */
    .sparkline-row { display: flex; align-items: center; gap: 8px; }
    .sparkline-lbl {
      font-size: 9px; font-weight: 700; letter-spacing: 1px;
      text-transform: uppercase; color: #444;
      width: 50px; flex-shrink: 0;
    }
    .trend-sparkline { flex: 1; height: 30px; }
    .accel-badge {
      font-size: 11px; font-weight: 700;
      white-space: nowrap; flex-shrink: 0;
    }
    .accel-up   { color: var(--green); }
    .accel-down { color: #ff7a5c; }
    .accel-flat { color: #555; }

    /* Driver chips */
    .drivers-row { display: flex; flex-wrap: wrap; gap: 5px; }
    .driver-chip {
      font-size: 10px; font-weight: 600;
      padding: 2px 8px; border-radius: 5px;
      display: flex; align-items: center; gap: 3px;
    }
    .dr-tiktok      { background:rgba(255,62,78,0.12);  color:#ff8f9a; border:1px solid rgba(255,62,78,0.2); }
    .dr-tour        { background:rgba(70,135,214,0.12); color:#9ac0ff; border:1px solid rgba(70,135,214,0.2); }
    .dr-award       { background:rgba(255,193,7,0.12);  color:#ffd54f; border:1px solid rgba(255,193,7,0.2); }
    .dr-controversy { background:rgba(255,120,30,0.12); color:#ffb07a; border:1px solid rgba(255,120,30,0.2); }
    .dr-playlisting { background:rgba(29,185,84,0.12);  color:var(--green); border:1px solid rgba(29,185,84,0.2); }
    .dr-collab      { background:rgba(155,89,182,0.12); color:#c39ee8; border:1px solid rgba(155,89,182,0.2); }
    .dr-release     { background:rgba(240,98,146,0.12); color:#f48fb1; border:1px solid rgba(240,98,146,0.2); }
    .dr-streaming   { background:rgba(29,185,84,0.12);  color:var(--green); border:1px solid rgba(29,185,84,0.2); }
    .dr-deal        { background:rgba(70,135,214,0.12); color:#9ac0ff; border:1px solid rgba(70,135,214,0.2); }
    .dr-default     { background:rgba(150,150,150,0.1); color:#666; border:1px solid rgba(150,150,150,0.15); }

    /* Intel blocks */
    .intel-blocks { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .intel-block {
      background: var(--surface2);
      border-radius: 7px;
      padding: 8px 10px;
    }
    .intel-block-lbl {
      font-size: 9px; font-weight: 700; letter-spacing: 1px;
      text-transform: uppercase; color: #444; margin-bottom: 3px;
    }
    .intel-block-val {
      font-size: 14px; font-weight: 700; color: var(--white); line-height: 1;
    }
    .intel-block-sub { font-size: 10px; color: #555; margin-top: 2px; }

    /* Card footer */
    .trend-card-foot {
      display: flex; align-items: center;
      justify-content: space-between; gap: 8px;
      padding-top: 10px;
      border-top: 1px solid var(--border);
    }
    .foot-sources {
      font-size: 10px; color: #444; flex: 1;
      overflow: hidden; text-overflow: ellipsis;
      white-space: nowrap; min-width: 0;
    }
    .foot-count {
      font-size: 10px; font-weight: 700;
      color: #444; white-space: nowrap; flex-shrink: 0;
    }

    /* ── Narrative block ──────────────────────────────────────── */
    .trend-narrative {
      font-size: 11.5px;
      color: #999;
      line-height: 1.65;
      padding: 9px 11px;
      background: rgba(255,255,255,0.03);
      border-radius: 7px;
      border-left: 2px solid var(--border);
      margin: 0;
    }

    /* Forecast label tag */
    .forecast-label-tag {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: #777;
      padding: 2px 6px;
      border-radius: 4px;
      background: var(--surface2);
      display: inline-block;
    }

    /* Cross-signal confirmation chips */
    .signal-sources {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
    }
    .signal-src-chip {
      font-size: 9px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 5px;
      background: rgba(29,185,84,0.08);
      color: #1DB954;
      border: 1px solid rgba(29,185,84,0.2);
      letter-spacing: 0.3px;
    }

    /* ── External panels ───────────────────────────────────────── */
    .intel-ext-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 36px;
    }
    @media (max-width: 900px) { .intel-ext-grid { grid-template-columns: 1fr; } }

    .intel-ext-panel {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
    }
    .ext-panel-title {
      font-size: 10px; font-weight: 700; letter-spacing: 1.5px;
      text-transform: uppercase; color: var(--muted);
      margin-bottom: 14px;
    }
    .ext-list { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:9px; }
    .ext-item { display:flex; gap:9px; align-items:baseline; }
    .ext-rank {
      font-size:11px; font-weight:800; color:#333;
      min-width:16px; flex-shrink:0; font-variant-numeric:tabular-nums;
    }
    .ext-link {
      font-size:12px; font-weight:500; color:#c8c8c8;
      text-decoration:none; line-height:1.45; flex:1; min-width:0;
      overflow:hidden; display:-webkit-box;
      -webkit-line-clamp:2; -webkit-box-orient:vertical;
      transition:color var(--transition);
    }
    .ext-link:hover { color:var(--green); }
    .ext-meta { font-size:10px; color:#444; white-space:nowrap; flex-shrink:0; }

    /* ── Loading / skeleton ────────────────────────────────────── */
    .intel-loading {
      padding: 48px 24px; text-align: center;
      color: var(--muted); font-size: 13px;
    }
    .intel-spinner {
      display: inline-block;
      width: 16px; height: 16px;
      border: 2px solid var(--border);
      border-top-color: var(--green);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      vertical-align: middle;
      margin-right: 8px;
    }
    .skeleton {
      background: linear-gradient(90deg, var(--surface2) 25%, #303030 37%, var(--surface2) 63%);
      background-size: 700px 100%;
      animation: shimmer 1.4s infinite linear;
      border-radius: 4px;
    }

    /* ── Digest modal ──────────────────────────────────────────── */
    .digest-item {
      display:flex !important; flex-direction:column !important;
      gap:6px !important; padding:16px !important;
      background:var(--surface2) !important; border-radius:10px !important;
      border:1px solid var(--border) !important;
      text-decoration:none !important;
      transition:border-color var(--transition) !important;
    }
    .digest-item:hover { border-color:rgba(29,185,84,0.4) !important; }
    .digest-item-header { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
    .digest-source { font-size:11px; color:var(--muted); font-weight:500; }
    .digest-time   { font-size:11px; color:#555; margin-left:auto; }
    .digest-item-title {
      font-size:15px; font-weight:700; color:var(--white);
      line-height:1.4; display:block; text-decoration:none;
      transition:color var(--transition);
    }
    .digest-item:hover .digest-item-title { color:var(--green); }
    .digest-item-takeaway {
      font-size:13px; color:var(--muted); line-height:1.6; margin:0;
      display:-webkit-box; -webkit-line-clamp:3;
      -webkit-box-orient:vertical; overflow:hidden;
    }
    .digest-item-footer { font-size:12px; font-weight:600; color:var(--green); margin-top:2px; }
    .digest-number { display:none !important; }
    .digest-content { display:contents; }
  `;
  document.head.appendChild(style);
}
injectStyles();

// ── Helpers ──────────────────────────────────────────────────────────────────

const _strip = s => (s||'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();

function _timeAgo(d) {
  const diff = Date.now() - new Date(d);
  const m = Math.floor(diff/60000), h = Math.floor(diff/3600000), dy = Math.floor(diff/86400000);
  if (m<1) return 'Just now'; if (m<60) return `${m}m ago`;
  if (h<24) return `${h}h ago`; if (dy===1) return 'Yesterday';
  if (dy<7) return `${dy}d ago`;
  return new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric'});
}

function _fmt(n) {
  if (!n) return '0';
  if (n>=1000000) return `${(n/1000000).toFixed(1)}M`;
  if (n>=1000) return `${(n/1000).toFixed(0)}k`;
  return String(n);
}

const CAT_CFG = {
  music:   {label:'Music Industry',color:'#9b59b6',chip:'music'},
  tech:    {label:'Tech & AI',     color:'#4687D6',chip:'tech'},
  pop:     {label:'Pop Culture',   color:'#E91E8C',chip:'pop'},
  spotify: {label:'Spotify',       color:'#1DB954',chip:'spotify'},
};
const _cat = c => CAT_CFG[c] || CAT_CFG.spotify;

// ── Sparkline ─────────────────────────────────────────────────────────────────

function _sparkline(data, color) {
  if (!data || data.length < 2) data = [5,10,15,20,30,50,80];
  const W=120, H=30, pad=2;
  const max=Math.max(...data,1), min=Math.min(...data,0), range=max-min||1;
  const pts = data.map((v,i) => {
    const x = pad + (i/(data.length-1))*(W-pad*2);
    const y = H - pad - ((v-min)/range)*(H-pad*2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const id = `sp${Math.random().toString(36).slice(2,7)}`;
  const areaD = `M ${pts[0].split(',')[0]},${H} L ${pts.join(' L ')} L ${pts[pts.length-1].split(',')[0]},${H} Z`;
  return `<svg class="trend-sparkline" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${color}" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
    </linearGradient></defs>
    <path d="${areaD}" fill="url(#${id})"/>
    <path d="M ${pts.join(' L ')}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${pts[pts.length-1].split(',')[0]}" cy="${pts[pts.length-1].split(',')[1]}" r="2.5" fill="${color}"/>
  </svg>`;
}

// ── Driver helpers ────────────────────────────────────────────────────────────

const DRIVER_ICONS = {tiktok:'📱',tour:'🎤',award:'🏆',controversy:'🔥',playlisting:'📋',collab:'🎸',release:'💿',streaming:'📈',deal:'🤝'};
const PAT_LABELS = {viral_spike:'Viral Spike',organic_growth:'Organic Growth',event_driven:'Event-Driven',controversy_cycle:'Controversy',sustained_narrative:'Sustained',emerging_signal:'Emerging'};

function _driverChips(drivers) {
  if (!drivers?.length) return '';
  return drivers.slice(0,3).map(d => {
    const cls = `dr-${d.type||'default'}`;
    const icon = DRIVER_ICONS[d.type] || '◆';
    return `<span class="driver-chip ${cls}"><span>${icon}</span>${d.label}</span>`;
  }).join('');
}

// ── Trend card ────────────────────────────────────────────────────────────────

function _buildTrendCard(term, articles) {
  const hp           = term.historicalPattern;
  const pattern      = (hp?.type) || term.pattern || 'emerging_signal';
  const duration     = term.predictedDuration || term.durationEstimate || '1–2 weeks';
  const breakout     = term.breakoutScore   ?? Math.round((term.momentum||0)*80);
  const confidence   = term.confidence      ?? Math.min(85, (term.count||1)*7);
  const velocity     = Math.round(((term.velocity ?? term.momentum ?? 0))*100);
  const accel        = term.acceleration    ?? 0;
  const declineRisk  = term.declineRisk     ?? (hp?.declineRisk) ?? 35;
  const drivers      = term.causalDrivers   ?? [];
  const trajectory   = term.trajectoryData  ?? null;
  const forecastLbl  = term.forecastLabel   || '';
  const narrative    = term.narrative       || '';
  const signalSrcs   = term.signalSources   || [];

  const signalStrength = Math.min(100, Math.round((term.score||term.count*5)/3));

  let cardCls = `trend-card pattern-${pattern}`;
  if (breakout >= 70) cardCls += ' breakout-high';
  else if (breakout >= 45) cardCls += ' breakout-medium';

  const bpCls = breakout>=70 ? 'bp-high' : breakout>=40 ? 'bp-medium' : 'bp-low';
  const sparkColor = breakout>=70 ? '#1DB954' : breakout>=40 ? '#ffd54f' : '#666';

  let accelHtml;
  if (accel > 0.05)       accelHtml = `<span class="accel-badge accel-up">↑ +${Math.round(accel*100)}%</span>`;
  else if (accel < -0.05) accelHtml = `<span class="accel-badge accel-down">↓ ${Math.round(accel*100)}%</span>`;
  else                    accelHtml = `<span class="accel-badge accel-flat">→ flat</span>`;

  const firstWord = term.term.toLowerCase().split(' ')[0];
  const related = articles.filter(a => ((a.title||'')+(a.description||'')).toLowerCase().includes(firstWord)).slice(0,4);
  const srcList = [...new Set(related.map(a=>a.source))].slice(0,3);
  const extraSrc = Math.max(0,(term.count||0)-srcList.length);
  const srcText = srcList.join(', ')+(extraSrc>0?` +${extraSrc} more`:'');

  const patLabel      = PAT_LABELS[pattern] || 'Signal';
  const driversHtml   = drivers.length ? `<div class="drivers-row">${_driverChips(drivers)}</div>` : '';
  const narrativeHtml = narrative ? `<p class="trend-narrative">${narrative}</p>` : '';
  const signalSrcsHtml = signalSrcs.length
    ? `<div class="signal-sources">${signalSrcs.map(s=>`<span class="signal-src-chip">◆ ${s}</span>`).join('')}</div>`
    : '';

  return `
    <div class="${cardCls}">
      <div class="trend-card-top">
        <div style="display:flex;flex-direction:column;gap:4px">
          <span class="trend-pattern-badge pat-${pattern}">${patLabel}</span>
          ${forecastLbl ? `<span class="forecast-label-tag">${forecastLbl}</span>` : ''}
        </div>
        <div class="trend-breakout-wrap">
          <div class="trend-breakout-num ${bpCls}">${breakout}<span class="bpct">%</span></div>
          <div class="trend-breakout-lbl">breakout</div>
        </div>
      </div>

      <div class="trend-term">${term.term}</div>

      <div class="trend-bars">
        <div class="bar-row">
          <span class="bar-lbl">Signal</span>
          <div class="bar-track"><div class="bar-fill bar-signal" style="width:${signalStrength}%"></div></div>
          <span class="bar-val">${signalStrength}</span>
        </div>
        <div class="bar-row">
          <span class="bar-lbl">Velocity</span>
          <div class="bar-track"><div class="bar-fill bar-vel" style="width:${velocity}%"></div></div>
          <span class="bar-val">${velocity}</span>
        </div>
        <div class="bar-row">
          <span class="bar-lbl">Decline</span>
          <div class="bar-track"><div class="bar-fill bar-decline" style="width:${declineRisk}%"></div></div>
          <span class="bar-val">${declineRisk}</span>
        </div>
      </div>

      <div class="sparkline-row">
        <span class="sparkline-lbl">Forecast</span>
        ${_sparkline(trajectory, sparkColor)}
        ${accelHtml}
      </div>

      ${driversHtml}
      ${narrativeHtml}

      <div class="intel-blocks">
        <div class="intel-block">
          <div class="intel-block-lbl">Confidence</div>
          <div class="intel-block-val">${confidence}%</div>
          <div class="intel-block-sub">${term.count||'?'} articles</div>
        </div>
        <div class="intel-block">
          <div class="intel-block-lbl">Duration Est.</div>
          <div class="intel-block-val" style="font-size:12px">${duration}</div>
          <div class="intel-block-sub">${patLabel.toLowerCase()}</div>
        </div>
      </div>

      ${signalSrcsHtml}

      <div class="trend-card-foot">
        <span class="foot-sources">${srcText||'multiple sources'}</span>
        <span class="foot-count">${term.count||'?'} mentions</span>
      </div>
    </div>`;
}

// ── Charts panel ──────────────────────────────────────────────────────────────

function _skeletonCharts(n) {
  return `<div class="chart-list-view">${Array.from({length:n},()=>`
    <div class="chart-card-skeleton">
      <div style="width:22px;height:13px;border-radius:3px" class="skeleton"></div>
      <div class="sk-art skeleton"></div>
      <div class="sk-lines">
        <div class="sk-ln sk-ln-w1 skeleton"></div>
        <div class="sk-ln sk-ln-w2 skeleton"></div>
      </div>
    </div>`).join('')}</div>`;
}

function _movementHtml(entry) {
  const cur  = entry.rank;
  const prev = entry.lastWeekRank;
  if (!prev || prev === cur) return `<span class="chart-row-movement move-same">—</span>`;
  const diff = prev - cur; // positive = moved up
  if (diff > 0) return `<span class="chart-row-movement move-up">▲${diff}</span>`;
  return `<span class="chart-row-movement move-down">▼${Math.abs(diff)}</span>`;
}

function _chartRowHtml(entry, icon) {
  const art = entry.artwork
    ? `<img class="chart-row-art" src="${entry.artwork}" alt="" loading="lazy" onerror="this.outerHTML='<div class=\\'chart-row-art-ph\\'>${icon}</div>'">`
    : `<div class="chart-row-art-ph">${icon}</div>`;
  const href = entry.url ? `href="${entry.url}" target="_blank" rel="noopener noreferrer"` : '';
  const trend = entry.trend || 'stable';
  const weeks = entry.weeksOnChart > 0 ? `<span class="chart-row-weeks">${entry.weeksOnChart}wk</span>` : '';
  const peak  = entry.peakRank && entry.peakRank <= 5 ? `<span class="chart-trend-badge rising">Peak #${entry.peakRank}</span>` : `<span class="chart-trend-badge ${trend}">${trend==='rising'?'↑ Hot':trend==='cooling'?'↓':'→'}</span>`;
  const movement = _movementHtml(entry);

  return `<a class="chart-row" ${href}>
    <span class="chart-row-rank">${entry.rank}</span>
    ${art}
    <div class="chart-row-info">
      <div class="chart-row-name">${entry.name}</div>
      <div class="chart-row-artist">${entry.artist||'—'}</div>
    </div>
    <div class="chart-row-meta">
      ${movement}
      ${weeks}
      ${peak}
    </div>
  </a>`;
}

function _buildChartPanel(entries, icon, emptyMsg) {
  if (!entries?.length) return `<p style="color:var(--muted);padding:16px 0;font-size:13px">${emptyMsg}</p>`;
  const top = entries.slice(0, 50);
  // For longer charts, use two-column layout
  if (top.length > 15) {
    const half = Math.ceil(top.length / 2);
    const col1 = top.slice(0, half).map(e => _chartRowHtml(e, icon)).join('');
    const col2 = top.slice(half).map(e => _chartRowHtml(e, icon)).join('');
    return `<div class="chart-columns">
      <div class="chart-list-view">${col1}</div>
      <div class="chart-list-view">${col2}</div>
    </div>`;
  }
  return `<div class="chart-list-view">${top.map(e => _chartRowHtml(e, icon)).join('')}</div>`;
}

function _buildChartsPanel(ext) {
  const spotify   = ext?.spotifyCharts   || [];
  const billboard = ext?.billboardHot100 || [];
  const apple     = ext?.appleMusic?.length ? ext.appleMusic : (ext?.itunesTopSongs || []);

  // Need at least one chart
  if (!spotify.length && !billboard.length && !apple.length) return '';

  const tabs = [];
  const panels = [];

  if (spotify.length) {
    tabs.push(`<button class="charts-tab-btn active" data-chart-tab="spotify">
      <span class="tab-source-dot"></span>Spotify Global
      <span class="tab-count">${Math.min(spotify.length,50)}</span>
    </button>`);
    panels.push(`<div class="charts-list-wrap active" data-chart-panel="spotify">
      ${_buildChartPanel(spotify, '🎵', 'Spotify chart data unavailable')}
    </div>`);
  }

  if (billboard.length) {
    const isFirst = !spotify.length;
    tabs.push(`<button class="charts-tab-btn${isFirst?' active':''}" data-chart-tab="billboard">
      <span class="tab-source-dot"></span>Billboard Hot 100
      <span class="tab-count">${Math.min(billboard.length,100)}</span>
    </button>`);
    panels.push(`<div class="charts-list-wrap${isFirst?' active':''}" data-chart-panel="billboard">
      ${_buildChartPanel(billboard, '🎵', 'Billboard chart data unavailable')}
    </div>`);
  }

  if (apple.length) {
    const isFirst = !spotify.length && !billboard.length;
    tabs.push(`<button class="charts-tab-btn${isFirst?' active':''}" data-chart-tab="apple">
      <span class="tab-source-dot"></span>Apple Music
      <span class="tab-count">${Math.min(apple.length,25)}</span>
    </button>`);
    panels.push(`<div class="charts-list-wrap${isFirst?' active':''}" data-chart-panel="apple">
      ${_buildChartPanel(apple, '🎵', 'Apple Music data unavailable')}
    </div>`);
  }

  // Albums tab if available
  const albums = ext?.appleTopAlbums || [];
  if (albums.length) {
    tabs.push(`<button class="charts-tab-btn" data-chart-tab="albums">
      <span class="tab-source-dot" style="background:#fc3c44"></span>Top Albums
      <span class="tab-count">${albums.length}</span>
    </button>`);
    panels.push(`<div class="charts-list-wrap" data-chart-panel="albums">
      ${_buildChartPanel(albums, '💿', 'Album data unavailable')}
    </div>`);
  }

  return `<div class="intel-charts-wrap">
    <div class="intel-section-label">Live Charts</div>
    <div class="charts-tabs">${tabs.join('')}</div>
    ${panels.join('')}
  </div>`;
}

function _bindChartTabs(container) {
  container.querySelectorAll('.charts-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.chartTab;
      container.querySelectorAll('.charts-tab-btn').forEach(b => b.classList.toggle('active', b===btn));
      container.querySelectorAll('.charts-list-wrap').forEach(p => p.classList.toggle('active', p.dataset.chartPanel===tab));
    });
  });
}

// ── External panels ───────────────────────────────────────────────────────────

function _buildExternalPanels(ext) {
  if (!ext) return '';

  const redditPosts = [
    ...(ext.reddit?.music||[]).slice(0,3),
    ...(ext.reddit?.pop||[]).slice(0,2),
  ].slice(0,5);

  const wiki = (ext.wikiTodayTop?.length ? ext.wikiTodayTop : ext.wikipedia||[]).slice(0,10);

  if (!redditPosts.length && !wiki.length) return '';

  const redditHtml = redditPosts.length ? `
    <div class="intel-ext-panel">
      <div class="ext-panel-title">Community Pulse — Reddit</div>
      <ul class="ext-list">
        ${redditPosts.map((p,i)=>`
          <li class="ext-item">
            <span class="ext-rank">${i+1}</span>
            <a href="${p.url}" target="_blank" rel="noopener noreferrer" class="ext-link">${p.title}</a>
            <span class="ext-meta">${_fmt(p.score)} pts</span>
          </li>`).join('')}
      </ul>
    </div>` : '';

  const wikiHtml = wiki.length ? `
    <div class="intel-ext-panel">
      <div class="ext-panel-title">Wikipedia — Most Read Today</div>
      <ul class="ext-list">
        ${wiki.map((a,i)=>`
          <li class="ext-item">
            <span class="ext-rank">${i+1}</span>
            <a href="${a.url}" target="_blank" rel="noopener noreferrer" class="ext-link">${a.title}</a>
            <span class="ext-meta">${_fmt(a.views||a.count)}</span>
          </li>`).join('')}
      </ul>
    </div>` : '';

  return `<div class="intel-section-label">External Signal Feed</div>
    <div class="intel-ext-grid">${redditHtml}${wikiHtml}</div>`;
}

// ── Main render ───────────────────────────────────────────────────────────────

function renderTrendTab(articles, horizon) {
  horizon = horizon || '7d';
  const section = document.getElementById('section-trends');
  if (!section) return;

  const header = section.querySelector('.section-header');
  section.innerHTML = '';
  if (header) {
    const sub = header.querySelector('.section-subtitle');
    if (sub) sub.textContent = 'Predictive cultural intelligence — breakout signals, trend forecasts, streaming charts';
    section.appendChild(header);
  }

  const wrap = document.createElement('div');
  section.appendChild(wrap);

  if (!articles || articles.length === 0) {
    wrap.innerHTML = `<div class="intel-loading"><span class="intel-spinner"></span>Loading intelligence feed…</div>`;
    return;
  }

  const data = window.TrendEngine ? window.TrendEngine.analyze(articles, horizon) : null;
  if (!data) {
    wrap.innerHTML = `<div class="intel-loading">Trend engine unavailable.</div>`;
    return;
  }

  const totalArticles = data.totalArticles || articles.length;
  const uniqueSources = new Set(articles.map(a=>a.source)).size;

  // Command bar
  const cmdBar = `<div class="intel-command-bar">
    <div class="intel-live-indicator"><div class="intel-live-dot"></div>Live Feed</div>
    ${['24h','7d','30d'].map(h=>`
      <button class="horizon-pill${h===horizon?' active':''}" data-horizon="${h}">
        ${h==='24h'?'Last 24h':h==='7d'?'Last 7 days':'Last 30 days'}
      </button>`).join('')}
    <span class="intel-feed-meta">${totalArticles} articles · ${uniqueSources} sources</span>
  </div>`;

  // Trend cards
  const allTerms = new Map();
  (data.overall?.trending||[]).slice(0,12).forEach(t => { if (!allTerms.has(t.term)) allTerms.set(t.term,t); });
  (data.risingTerms||[]).slice(0,6).forEach(t => { if (!allTerms.has(t.term)) allTerms.set(t.term,t); });
  const displayTerms = [...allTerms.values()].slice(0,12);

  const gridCards = displayTerms.length
    ? displayTerms.map(t => _buildTrendCard(t, articles)).join('')
    : `<div class="intel-loading">Not enough data for this window.</div>`;

  // Phase 1: render structure immediately (charts = skeleton)
  wrap.innerHTML = `${cmdBar}
    <div id="charts-ph">
      <div class="intel-charts-wrap">
        <div class="intel-section-label">Live Charts</div>
        ${_skeletonCharts(8)}
      </div>
    </div>
    <div class="intel-section-label">Trend Intelligence — Breakout Signals</div>
    <div class="intel-grid">${gridCards}</div>
    <div id="ext-ph"><div class="intel-loading"><span class="intel-spinner"></span>Loading external signals…</div></div>`;

  // Bind horizon pills
  wrap.querySelectorAll('.horizon-pill').forEach(btn => {
    btn.addEventListener('click', () => renderTrendTab(articles, btn.dataset.horizon));
  });

  // Phase 2: enrich cards + load real chart + external data
  if (window.TrendData) {
    window.TrendData.fetchAll()
      .then(ext => {
        // Cross-signal enrichment: upgrade confidence, narrative, signal badges
        if (window.TrendEngine?.enrichWithExternal && data) {
          window.TrendEngine.enrichWithExternal(data, ext);
          const grid = wrap.querySelector('.intel-grid');
          if (grid) {
            grid.style.opacity = '0.5';
            grid.style.transition = 'opacity 0.35s ease';
            const enrichedTerms = new Map();
            (data.overall?.trending||[]).slice(0,12).forEach(t => { if (!enrichedTerms.has(t.term)) enrichedTerms.set(t.term,t); });
            (data.risingTerms||[]).slice(0,6).forEach(t => { if (!enrichedTerms.has(t.term)) enrichedTerms.set(t.term,t); });
            grid.innerHTML = [...enrichedTerms.values()].slice(0,12).map(t => _buildTrendCard(t, articles)).join('');
            requestAnimationFrame(() => { grid.style.opacity = '1'; });
          }
        }

        const chartsEl = document.getElementById('charts-ph');
        if (chartsEl) {
          const html = _buildChartsPanel(ext);
          if (html) {
            chartsEl.outerHTML = html;
            const newEl = wrap.querySelector('.intel-charts-wrap');
            if (newEl) _bindChartTabs(newEl);
          } else {
            chartsEl.remove();
          }
        }
        const extEl = document.getElementById('ext-ph');
        if (extEl) {
          const extHtml = _buildExternalPanels(ext);
          if (extHtml) extEl.outerHTML = extHtml;
          else extEl.remove();
        }
      })
      .catch(() => {
        document.getElementById('charts-ph')?.remove();
        document.getElementById('ext-ph')?.remove();
      });
  } else {
    document.getElementById('charts-ph')?.remove();
    document.getElementById('ext-ph')?.remove();
  }
}

// ── extractTakeaway ───────────────────────────────────────────────────────────

function extractTakeaway(article) {
  const raw = _strip(article.description||'');
  if (!raw) return '';
  const sentences = raw.split(/(?<=[.!?])\s+(?=[A-Z"'"\(])/);
  if (!sentences.length) return raw.slice(0,280);
  const tw = new Set((article.title||'').toLowerCase().split(/\W+/).filter(w=>w.length>4));
  const notRepeat = s => { const sw = s.toLowerCase().split(/\W+/).filter(w=>w.length>4); return !sw.length || sw.filter(w=>tw.has(w)).length/sw.length < 0.6; };
  const pool = sentences.filter(s=>s.trim().length>=30&&notRepeat(s.trim()));
  const src  = pool.length ? pool : sentences;
  let r='';
  for (const s of src) {
    const n = r ? r+' '+s.trim() : s.trim();
    if (n.length>280) break;
    r=n;
    if (r.length>=100) break;
  }
  return r||raw.slice(0,200);
}

// ── buildDigestItems ──────────────────────────────────────────────────────────

function buildDigestItems(articles) {
  const b={spotify:[],music:[],tech:[],pop:[]};
  articles.forEach(a=>{if(b[a.category])b[a.category].push(a);});
  const picks=[], order=['spotify','music','tech','pop'];
  let idx=0, running=true;
  while(picks.length<8&&running){
    running=false;
    for(const c of order){
      if(b[c][idx]){picks.push(b[c][idx]);running=true;}
      if(picks.length>=8)break;
    }
    idx++;
  }
  if(!picks.length) return '<p style="color:var(--muted);padding:16px">No articles loaded yet.</p>';
  return picks.map(a=>{
    const cfg=_cat(a.category);
    const tw=extractTakeaway(a);
    return `<a href="${a.link}" target="_blank" rel="noopener noreferrer" class="digest-item">
      <div class="digest-item-header">
        <span class="category-chip ${cfg.chip}">${cfg.label}</span>
        <span class="digest-source">${a.source}</span>
        <span class="digest-time">${_timeAgo(a.pubDate)}</span>
      </div>
      <span class="digest-item-title">${a.title}</span>
      ${tw?`<p class="digest-item-takeaway">${tw}</p>`:''}
      <div class="digest-item-footer">Read article →</div>
    </a>`;
  }).join('');
}

// ── Public API ────────────────────────────────────────────────────────────────
window.TrendUI = { renderTrendTab, buildDigestItems, extractTakeaway, injectStyles };
