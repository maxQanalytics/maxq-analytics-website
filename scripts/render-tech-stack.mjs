// Generates src/diagrams/tech-stack-<date>.svg, the "Tech stack" flow chart on
// the homepage. Same visual language as the architecture diagrams in our
// proposals (maxq-sales, reports/proposals/*: white tool boxes with an ink
// stroke, soft boxes for sources and consumers, dashed bands for layers,
// mono column labels, elbow connectors — never diagonals). Explicit layout,
// no auto-layout engine. Edit the SPEC, run
//
//   node scripts/render-tech-stack.mjs
//
// and commit the regenerated SVG with your change. The page inlines the SVG
// (`import ... '?raw'` + set:html) so it picks up the site's fonts and scales
// with its container; the page keeps a stacked CSS version for phones. Vendor
// logos are referenced from public/logos by absolute path.
//
// Layout: sources → extraction → warehouse → semantic layer → consumers, left
// to right. The transformation layer (dbt) sits underneath the warehouse with
// an arrow going up into it, the way the proposals draw dbt under Snowflake.

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Orchestration variants (2026-10-26, preview only): pass one as an argument,
//   node scripts/render-tech-stack.mjs lane|sequence|badges
// to draw Dagster into the Semantic Nexus. Without an argument the script
// writes the live chart, unchanged.
//   lane      a full-width orchestration layer under the stack, dashed control
//             lines up into batch extraction, dbt and the semantic layer
//   sequence  Dagster as a peer of dbt in the empty slot under extraction,
//             numbered run order 1-2-3 on the layers it drives
//   badges    no extra layer: a Dagster pill on the frame border and a small
//             Dagster badge on every tool it schedules
const VARIANTS = { lane: '2026-10-26-lane', sequence: '2026-10-26-sequence', badges: '2026-10-26-badges' };
const VARIANT = process.argv[2] ?? null;
if (VARIANT && !VARIANTS[VARIANT]) throw new Error(`unknown variant ${VARIANT}; use ${Object.keys(VARIANTS).join(', ')}`);
const DATE = VARIANT ? VARIANTS[VARIANT] : '2026-10-09h';

// ---------------------------------------------------------------- spec

const INK = '#0a0a0f';
const TEXT = '#3d3b38';   // secondary text: sub lines, source and consumer names
const LINE = '#5c5a56';   // strokes and column labels
const BRAND = '#1a4fff';
const SANS = `'Outfit', system-ui, sans-serif`;
const MONO = `'DM Mono', 'SF Mono', ui-monospace, monospace`;

const SOURCE_GROUPS = [
  { label: 'PRODUCT DATABASE', stream: true, items: [
    { name: 'MySQL', icon: '/logos/mysql.svg', iconW: 30, tip: 'Your application database, streamed with change data capture.' },
    { name: 'PostgreSQL', oss: true, icon: '/logos/postgresql.svg', tip: 'Your application database, streamed with change data capture.' },
  ] },
  { label: 'BOOKKEEPING', items: [
    { name: 'Exact Online', icon: '/logos/exact.png', iconW: 46, tip: 'Exact Online general ledger, invoices and accounts.' },
    { name: 'Yuki', icon: '/logos/yuki.png', tip: 'Yuki bookkeeping.' },
  ] },
  { label: 'CRM', items: [{ name: 'HubSpot', icon: '/logos/hubspot.svg', tip: 'HubSpot companies, deals, contacts and line items.' }] },
  { label: 'ERP', items: [
    { name: 'Float', icon: '/logos/float.png', tip: 'Float resource and time planning.' },
    { name: 'Infor', icon: '/logos/infor.png', tip: 'Infor ERP.' },
  ] },
  { label: 'CUSTOMER CARE', items: [
    { name: 'Freshdesk', icon: '/logos/freshworks.png', tip: 'Freshdesk tickets and conversations.' },
    { name: 'Zendesk', icon: '/logos/zendesk.svg', tip: 'Zendesk tickets and conversations.' },
  ] },
  { label: 'SPREADSHEETS', items: [
    { name: 'Google Sheets', icon: '/logos/google-sheets.svg', tip: 'Manual inputs, targets and mappings kept in Google Sheets.' },
    { name: 'Excel', icon: '/logos/excel.svg', tip: 'Manual inputs, targets and mappings kept in Excel.' },
  ] },
];

const BATCH = {
  label: 'EXTRACTION · BATCH',
  tools: [
    { name: 'Airbyte', oss: true, logo: '/logos/airbyte.svg', sub: 'open-source connectors', url: 'https://airbyte.com', tip: 'Open-source data integration platform for syncing data from APIs, databases and files.' },
    { name: 'dlt', oss: true, logo: '/logos/dlt.png', logoH: 20, sub: 'python pipelines · code', url: 'https://dlthub.com', tip: 'Open-source Python library (data load tool) for writing extraction pipelines in code, with schema inference, incremental loads and a growing set of verified sources.' },
    { name: 'Hevo Data', logo: '/logos/hevo.png', logoH: 20, sub: 'no-code · 150+ sources', url: 'https://hevodata.com', tip: 'No-code pipeline platform for extracting and syncing data from 150+ sources into your warehouse.' },
  ],
};

const STREAM = {
  label: 'EXTRACTION · STREAMING',
  tools: [
    { name: 'Debezium', oss: true, logo: '/logos/debezium.png', sub: 'change data capture', url: 'https://debezium.io', tip: 'Open-source CDC platform that streams database changes in real time for event-driven data pipelines.' },
  ],
};

// the real-time warehouse is fed by the streaming extraction; the batch
// warehouse by the batch extraction
const REALTIME = {
  label: 'WAREHOUSE · REAL-TIME',
  tools: [
    { name: 'ClickHouse', oss: true, logo: '/logos/clickhouse.png', sub: 'real-time analytics', url: 'https://clickhouse.com', tip: 'High-performance columnar database optimised for real-time analytics on very large datasets, fed by the streaming extraction.' },
  ],
};

const WAREHOUSE = {
  label: 'WAREHOUSE · BATCH',
  tools: [
    { name: 'BigQuery', logo: '/logos/bigquery.png', sub: 'serverless · Google Cloud', url: 'https://cloud.google.com/bigquery', tip: "Google's serverless, scalable cloud data warehouse built for fast SQL analytics at any scale." },
    { name: 'Snowflake', logo: '/logos/snowflake.png', sub: 'storage and compute apart', url: 'https://www.snowflake.com', tip: 'Cloud data platform with separated storage and compute, enabling flexible and cost-efficient scaling.' },
    { name: 'Microsoft Fabric', logo: '/logos/fabric.png', logoH: 22, sub: 'data warehouse', url: 'https://www.microsoft.com/en-us/microsoft-fabric', tip: 'The Fabric data warehouse, for clients on the Microsoft stack.' },
  ],
};

// sits under the warehouse, arrow going up into it
const TRANSFORMATION = {
  label: 'TRANSFORMATION',
  tool: { name: 'dbt', oss: true, logo: '/logos/dbt.png', sub: 'models · tests · docs in git', url: 'https://www.getdbt.com', tip: 'SQL-based transformation tool that lets analytics engineers build, test and document data models in version control. Runs as its own layer on top of the warehouse.' },
};

const SEMANTIC = {
  label: 'SEMANTIC LAYER',
  tools: [
    { name: 'Cube', oss: true, logo: '/logos/cube.png', sub: 'metrics defined once · API', url: 'https://cube.dev', tip: 'Semantic layer that defines business metrics centrally and exposes them consistently via API to any downstream tool.' },
    { name: 'Microsoft Fabric', logo: '/logos/fabric.png', logoH: 22, sub: 'semantic models', url: 'https://www.microsoft.com/en-us/microsoft-fabric', tip: "Microsoft Fabric semantic models, the semantic layer for Power BI and the rest of the Microsoft stack." },
  ],
};

const CONSUMER_GROUPS = [
  {
    label: 'AI MODELS',
    items: [
      { name: 'Claude', icon: '/logos/claude-icon.svg', url: 'https://claude.ai', tip: "Anthropic's models, connected to your semantic layer through an MCP server for natural-language data questions." },
      { name: 'OpenAI', icon: '/logos/openai.svg', url: 'https://openai.com', tip: 'OpenAI models, reading the same metric definitions through the semantic layer API.' },
      { name: 'Gemini', icon: '/logos/gemini.svg', url: 'https://gemini.google.com', tip: "Google's Gemini models, reading the same metric definitions through the semantic layer API." },
    ],
  },
  {
    label: 'MCPS',
    items: [
      { name: 'nao analytics', oss: true, icon: '/logos/nao.png', url: '/add-ons/analytics-assistant', tip: 'Maxq add-on: the nao-based Analytics Assistant, an MCP server that answers data questions in Slack and in Claude.', self: true },
    ],
  },
  {
    label: 'AI AGENTS',
    items: [
      { name: 'Quality Guardian', icon: '/logos/quality-guardian.png', url: '/add-ons/quality-guardian', tip: 'Maxq add-on: an agent that investigates failing data-entry tests and writes the fix back to the source system.', self: true },
      { name: 'LangChain agents', icon: '/logos/langchain.svg', iconW: 22, url: 'https://www.langchain.com', tip: 'Your own agents, built on LangChain or a similar framework, reading governed metrics through the semantic layer instead of raw tables.' },
    ],
  },
  {
    label: 'REPORTS',
    items: [
      { name: 'Data Studio', icon: '/logos/data-studio-icon.svg', url: 'https://lookerstudio.google.com', tip: "Google's free BI tool for building interactive, shareable dashboards connected directly to your data sources." },
      { name: 'Power BI', icon: '/logos/powerbi-icon.svg', url: 'https://powerbi.microsoft.com', tip: "Microsoft's business intelligence platform for creating rich reports and dashboards across your organisation." },
    ],
  },
  {
    label: 'YOUR OWN APPS',
    items: [
      { name: 'Next.js', icon: '/logos/nextjs.svg', url: 'https://nextjs.org', tip: 'React framework for client portals and embedded analytics, reading metrics from the semantic layer API.' },
      { name: 'Django', icon: '/logos/django.svg', url: 'https://www.djangoproject.com', tip: 'Python web framework for internal tools and portals, reading metrics from the semantic layer API.' },
    ],
  },
];

// orchestration (variants only): Dagster runs the batch side of the Nexus;
// the streaming side (Debezium into ClickHouse) runs continuously on its own
const ORCH = {
  label: 'ORCHESTRATION',
  tool: { name: 'Dagster', oss: true, icon: '/logos/dagster.svg', sub: VARIANT === 'sequence' ? 'runs steps 1 → 2 → 3' : 'schedules · retries · lineage', url: 'https://dagster.io', tip: 'Open-source orchestrator. It runs the batch extraction, then the dbt models and tests, then the semantic layer refresh, on a schedule or as soon as new data arrives, and retries or alerts when a step fails.' },
};

// geometry
const SRC = { x: 14, w: 160 };
const GAP = 18;                                   // between the columns inside the Semantic Nexus
const OUTER = 82;                                 // sources -> frame and frame -> consumers
const FRAME_PAD = 28;                             // frame edge to the first / last band
const BAND = { y: 76, pad: 14, w: 206, labelH: 19 };
const TOOL = { h: 64, pitch: 78.5, logoW: 130, logoH: 24 };   // 14.5 between boxes, room for the OS tag
// firstY puts the midpoint of the first two source boxes level with the
// streaming band's centre, so the arrow between them runs straight
const CON = { w: 160, h: 34, pitch: 38, groupGap: 12, labelH: 18, firstY: 77.5 };
const LABEL_Y = 44;
const FONT = { label: 11, sub: 12, name: 13 };
const STROKE = 1.2;                               // every connector, arrow or tick, same weight

const extX = SRC.x + SRC.w + OUTER;
const whX = extX + BAND.w + GAP;
const semW = BAND.w;
const semX = whX + BAND.w + GAP;
const busX = semX + semW + OUTER / 2;
const conX = semX + semW + OUTER;
const toolW = BAND.w - 2 * BAND.pad;

const bandHFor = (n) => BAND.pad + BAND.labelH + TOOL.h + (n - 1) * TOOL.pitch + BAND.pad;
const mid = (b) => b.y + b.h / 2;
const STREAMBAND = { y: BAND.y, h: bandHFor(STREAM.tools.length) };
const BATCHBAND = { y: STREAMBAND.y + STREAMBAND.h + 14, h: bandHFor(BATCH.tools.length) };
const RTBAND = { y: BAND.y, h: bandHFor(REALTIME.tools.length) };
const WHBAND = { y: RTBAND.y + RTBAND.h + 14, h: bandHFor(WAREHOUSE.tools.length) };
const TR = { y: WHBAND.y + WHBAND.h + 22, h: bandHFor(1) };
const SEMBAND = { y: BAND.y, h: WHBAND.y + WHBAND.h - BAND.y };

// grouped columns (sources and consumers): label rows and item rows
function groupRows(groups) {
  const rows = [];
  let y = CON.firstY;
  groups.forEach((g) => {
    rows.push({ kind: 'label', y: y + 11, text: g.label });
    y += CON.labelH;
    g.items.forEach((it) => { rows.push({ kind: 'item', y, item: it, stream: !!g.stream }); y += CON.pitch; });
    y += CON.groupGap - (CON.pitch - CON.h);
  });
  return rows;
}
const conRows = groupRows(CONSUMER_GROUPS);
const srcRows = groupRows(SOURCE_GROUPS);
const itemRows = conRows.filter((r) => r.kind === 'item');
const srcItems = srcRows.filter((r) => r.kind === 'item');
const conBottom = itemRows[itemRows.length - 1].y + CON.h;
const srcBottom = srcItems[srcItems.length - 1].y + CON.h;
// lane: the orchestration layer under the dbt row, across all three columns
const LANE = { y: TR.y + TR.h + 22, h: bandHFor(1) };
// sequence: the control line to the semantic layer runs under the dbt band
const UNDER_Y = TR.y + TR.h + 12;
const FRAME_BOTTOM = VARIANT === 'lane' ? LANE.y + LANE.h + 12 : VARIANT === 'sequence' ? UNDER_Y + 12 : TR.y + TR.h + 12;
const LEGEND_Y = FRAME_BOTTOM + 24;
const CANVAS = { w: conX + CON.w + 14, h: Math.max(VARIANT ? LEGEND_Y + 4 : TR.y + TR.h, conBottom, srcBottom) + 14 };

// ---------------------------------------------------------------- helpers

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function colLabel(x, y, text, { anchor = 'middle' } = {}) {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${MONO}" font-size="${FONT.label}" letter-spacing="0.08em" fill="${LINE}">${esc(text)}</text>`;
}

// open source tag: the OSI keyhole (a thick ring open at the bottom) with
// 'OS' next to it, in a small light green pill sitting on the box's lower
// right corner, overlapping both the bottom and the right border
const OSI_GREEN = '#3da639';
const TAG = { h: 16, pad: 4, icon: 10, gap: 3, font: 8, text: 'OS', overlap: 6 };
const TAG_FILL = '#e9f6e5';   // very light green, so the tag stands out from the box
const TAG_LINE = '#a9d9a2';
TAG.w = TAG.pad + TAG.icon + TAG.gap + TAG.text.length * 5.2 + TAG.pad;
function ossTag(rightX, borderY) {
  const x = rightX - TAG.w, y = borderY - TAG.h / 2;
  const cx = x + TAG.pad + TAG.icon / 2, cy = borderY, r = 3.5;
  const a = (deg) => [cx + r * Math.cos(deg * Math.PI / 180), cy + r * Math.sin(deg * Math.PI / 180)];
  const [sx, sy] = a(125), [ex, ey] = a(55);
  return `<rect x="${x}" y="${y}" width="${TAG.w}" height="${TAG.h}" rx="${TAG.h / 2}" fill="${TAG_FILL}" stroke="${TAG_LINE}" stroke-width="0.8"/>
    <path d="M${sx.toFixed(2)},${sy.toFixed(2)} A${r},${r} 0 1 1 ${ex.toFixed(2)},${ey.toFixed(2)}" fill="none" stroke="${OSI_GREEN}" stroke-width="2.1" stroke-linecap="butt"/>
    <text x="${x + TAG.pad + TAG.icon + TAG.gap}" y="${cy + 3}" font-family="${MONO}" font-size="${TAG.font}" letter-spacing="0.04em" fill="${INK}">${TAG.text}</text>`;
}

function image(href, cx, cy, w, h) {
  return `<image href="${esc(href)}" x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>`;
}

// each component is a hover target: the page's script reads data-tip-name and
// data-tip-text and shows its own tooltip (no SVG title element, so no native
// delay and nothing pops up in the empty space between components)
function link(url, name, tip, inner) {
  const data = `data-tip-name="${esc(name)}" data-tip-text="${esc(tip)}"`;
  if (!url) return `<g ${data}>\n    ${inner}\n  </g>`;
  const target = url.startsWith('/') ? '' : ' target="_blank" rel="noopener"';
  return `<a href="${esc(url)}"${target} ${data}>\n    ${inner}\n  </a>`;
}

function toolBox(x, y, w, tool) {
  const cx = x + w / 2;
  const lh = tool.logoH ?? TOOL.logoH;
  // a tool with only a mark (no wordmark logo): mark + name in the logo slot
  let mark;
  if (tool.logo) mark = image(tool.logo, cx, y + 23, TOOL.logoW, lh);
  else {
    const iw = 22, textW = tool.name.length * 8.6, startX = cx - (iw + 7 + textW) / 2;
    mark = `${image(tool.icon, startX + iw / 2, y + 23, iw, iw)}
    <text x="${startX + iw + 7}" y="${y + 28.5}" font-family="${SANS}" font-size="16" font-weight="600" fill="${INK}">${esc(tool.name)}</text>`;
  }
  const inner = `<rect x="${x}" y="${y}" width="${w}" height="${TOOL.h}" rx="4" fill="#ffffff" stroke="${INK}" stroke-width="1.2"/>
    ${mark}
    <text x="${cx}" y="${y + 52}" text-anchor="middle" font-family="${SANS}" font-size="${FONT.sub}" fill="${TEXT}">${esc(tool.sub)}</text>
    ${tool.oss ? ossTag(x + w + TAG.overlap, y + TOOL.h) : ''}`;
  return link(tool.url, tool.name, tool.tip, inner);
}

function itemBox(x, y, it, w = CON.w) {
  const cx = x + w / 2;
  let content;
  if (it.logo) {
    content = image(it.logo, cx, y + CON.h / 2, 118, 20);
  } else if (it.icon) {
    const iw = it.iconW ?? 18;
    const textW = it.name.length * 7.2;
    const startX = cx - (iw + 8 + textW) / 2;
    content = `${image(it.icon, startX + iw / 2, y + CON.h / 2, iw, 18)}
    <text x="${startX + iw + 8}" y="${y + CON.h / 2 + 4.5}" font-family="${SANS}" font-size="${FONT.name}" font-weight="600" fill="${INK}">${esc(it.name)}</text>`;
  } else {
    content = `<text x="${cx}" y="${y + CON.h / 2 + 4.5}" text-anchor="middle" font-family="${SANS}" font-size="${FONT.name}" font-weight="600" fill="${INK}">${esc(it.name)}</text>`;
  }
  const inner = `<rect x="${x}" y="${y}" width="${w}" height="${CON.h}" rx="3" fill="#f5f3f0" stroke="${LINE}" stroke-width="1"/>
    ${content}
    ${it.oss ? ossTag(x + w + TAG.overlap, y + CON.h) : ''}`;
  return link(it.url, it.name, it.tip, inner);
}

function band(x, y, w, h) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="#fafaf8" stroke="${LINE}" stroke-width="1"/>`;
}

// elbow connector: horizontal, vertical, horizontal; turns at midX
function elbow(x1, y1, x2, y2, { thin = false, midX } = {}) {
  const mx = midX ?? (x1 + x2) / 2;
  return `<path d="M${x1},${y1} L${mx},${y1} L${mx},${y2} L${x2},${y2}" fill="none" stroke="${thin ? LINE : INK}" stroke-width="${STROKE}"/>`;
}

function line(x1, y1, x2, y2, { thin = false, arrow = false } = {}) {
  const m = arrow ? ' marker-end="url(#ts-arrow)"' : '';
  return `<path d="M${x1},${y1} L${x2},${y2}" fill="none" stroke="${thin ? LINE : INK}" stroke-width="${STROKE}"${m}/>`;
}

// ---------------------------------------------------------------- build

const parts = [];

// Semantic Nexus frame first, so every arrow is drawn on top of its fill
{
  const fx = extX - FRAME_PAD, fy = BAND.y - 24;
  const fw = semX + semW + FRAME_PAD - fx;
  const fh = FRAME_BOTTOM - fy;
  parts.push(`<rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="8" fill="#eef2ff" stroke="${BRAND}" stroke-width="1.2" stroke-dasharray="6 4"/>`);
  parts.push(`<text x="${fx + fw / 2}" y="${fy - 8}" text-anchor="middle" font-family="${MONO}" font-size="${FONT.label}" font-weight="500" letter-spacing="0.08em" fill="${BRAND}">SEMANTIC NEXUS</text>`);
}

// a band with its label and tool boxes
function drawBand(x, b, spec) {
  parts.push(band(x, b.y, BAND.w, b.h));
  parts.push(colLabel(x + BAND.w / 2, b.y + 19, spec.label));
  spec.tools.forEach((t, j) => parts.push(toolBox(x + BAND.pad, b.y + BAND.pad + BAND.labelH + j * TOOL.pitch, toolW, t)));
}

// sources column: two lanes, streaming sources into the streaming band, the rest into the batch band
parts.push(colLabel(SRC.x + SRC.w / 2, LABEL_Y, 'SOURCES'));
const laneX = SRC.x + SRC.w + (extX - FRAME_PAD - SRC.x - SRC.w) / 2;
srcRows.forEach((r) => {
  if (r.kind === 'label') parts.push(colLabel(SRC.x, r.y, r.text, { anchor: 'start' }));
  else {
    parts.push(line(SRC.x + SRC.w, r.y + CON.h / 2, laneX, r.y + CON.h / 2, { thin: true }));
    parts.push(itemBox(SRC.x, r.y, r.item, SRC.w));
  }
});
const streamMids = srcItems.filter((r) => r.stream).map((r) => r.y + CON.h / 2);
const batchMids = srcItems.filter((r) => !r.stream).map((r) => r.y + CON.h / 2);
parts.push(line(laneX, Math.min(...streamMids, mid(STREAMBAND)), laneX, Math.max(...streamMids, mid(STREAMBAND)), { thin: true }));
parts.push(line(laneX, mid(STREAMBAND), extX, mid(STREAMBAND), { arrow: true }));
parts.push(line(laneX, Math.min(...batchMids, mid(BATCHBAND)), laneX, Math.max(...batchMids, mid(BATCHBAND)), { thin: true }));
parts.push(line(laneX, mid(BATCHBAND), extX, mid(BATCHBAND), { arrow: true }));

// extraction: streaming on top, batch below; each feeds its own warehouse band
drawBand(extX, STREAMBAND, STREAM);
drawBand(extX, BATCHBAND, BATCH);
parts.push(line(extX + BAND.w, mid(STREAMBAND), whX, mid(STREAMBAND), { arrow: true }));
parts.push(line(extX + BAND.w, mid(BATCHBAND), whX, mid(BATCHBAND), { arrow: true }));

// warehouse: real-time on top, batch below; transformation under the batch warehouse, arrow up
drawBand(whX, RTBAND, REALTIME);
drawBand(whX, WHBAND, WAREHOUSE);
drawBand(whX, TR, { label: TRANSFORMATION.label, tools: [TRANSFORMATION.tool] });
parts.push(line(whX + BAND.w / 2, TR.y, whX + BAND.w / 2, WHBAND.y + WHBAND.h, { arrow: true }));
parts.push(line(whX + BAND.w, mid(RTBAND), semX, mid(RTBAND), { arrow: true }));
parts.push(line(whX + BAND.w, mid(WHBAND), semX, mid(WHBAND), { arrow: true }));

// semantic layer: one band spanning both warehouse bands, boxes stacked around its middle
parts.push(band(semX, SEMBAND.y, semW, SEMBAND.h));
parts.push(colLabel(semX + semW / 2, SEMBAND.y + 19, SEMANTIC.label));
{
  const n = SEMANTIC.tools.length;
  const top = mid(SEMBAND) - ((n - 1) * TOOL.pitch + TOOL.h) / 2;
  SEMANTIC.tools.forEach((t, j) => parts.push(toolBox(semX + BAND.pad, top + j * TOOL.pitch, toolW, t)));
}

// consumers: one bus line from the semantic layer, ticks into each box
parts.push(colLabel(conX + CON.w / 2, LABEL_Y, 'CONSUMERS'));
const firstMid = itemRows[0].y + CON.h / 2;
const lastMid = itemRows[itemRows.length - 1].y + CON.h / 2;
parts.push(line(semX + semW, mid(SEMBAND), busX, mid(SEMBAND)));
parts.push(line(busX, Math.min(firstMid, mid(SEMBAND)), busX, Math.max(lastMid, mid(SEMBAND)), { thin: true }));
conRows.forEach((r) => {
  if (r.kind === 'label') parts.push(colLabel(conX, r.y, r.text, { anchor: 'start' }));
  else {
    parts.push(line(busX, r.y + CON.h / 2, conX, r.y + CON.h / 2, { arrow: true }));
    parts.push(itemBox(conX, r.y, r.item));
  }
});

// ---------------------------------------------------------------- orchestration variants

// control flow: dashed, in the brand colour, so it never reads as data flow
function ctl(points, { arrow = true } = {}) {
  const d = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ');
  const m = arrow ? ' marker-end="url(#ts-arrow-ctl)"' : '';
  return `<path d="${d}" fill="none" stroke="${BRAND}" stroke-width="${STROKE}" stroke-dasharray="4 3"${m}/>`;
}
function ctlNote(x, y, text, anchor = 'start') {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${MONO}" font-size="10" letter-spacing="0.04em" fill="${BRAND}">${esc(text)}</text>`;
}
// numbered run step, brand disc with a white digit
function step(cx, cy, n) {
  return `<circle cx="${cx}" cy="${cy}" r="9" fill="${BRAND}"/>
  <text x="${cx}" y="${cy + 3.5}" text-anchor="middle" font-family="${MONO}" font-size="10" font-weight="500" fill="#ffffff">${n}</text>`;
}
// small Dagster mark in a white disc, sitting on a box's top-left corner
function dagsterBadge(cx, cy) {
  return `<circle cx="${cx}" cy="${cy}" r="9.5" fill="#ffffff" stroke="${BRAND}" stroke-width="1"/>
  ${image(ORCH.tool.icon, cx, cy, 12, 12)}`;
}
// legend under the frame, centred on it: data vs orchestration
function legend(cx, y, ctlSample) {
  const w = 330, x = cx - w / 2;
  return `${line(x, y, x + 26, y)}
  <text x="${x + 34}" y="${y + 3.5}" font-family="${MONO}" font-size="10" letter-spacing="0.04em" fill="${LINE}">data flow</text>
  ${ctlSample(x + 130, y)}
  <text x="${x + 164}" y="${y + 3.5}" font-family="${MONO}" font-size="10" letter-spacing="0.04em" fill="${LINE}">orchestrated by Dagster</text>`;
}

if (VARIANT) {
  const frameCx = (extX - FRAME_PAD + semX + semW + FRAME_PAD) / 2;
  const sem = { l: semX, r: semX + semW };
  if (VARIANT === 'lane') {
    // a full-width layer under everything; Dagster under the warehouse column
    parts.push(band(extX, LANE.y, semX + semW - extX, LANE.h));
    parts.push(colLabel(extX + 14, LANE.y + 19, ORCH.label, { anchor: 'start' }));
    const by = LANE.y + BAND.pad + BAND.labelH, bmid = by + TOOL.h / 2;
    const extLine = extX + 150, semLine = semX + 56;
    parts.push(ctl([[whX + BAND.pad, bmid], [extLine, bmid], [extLine, BATCHBAND.y + BATCHBAND.h]]));
    parts.push(ctl([[whX + BAND.w / 2, by], [whX + BAND.w / 2, TR.y + TR.h]]));
    parts.push(ctl([[whX + BAND.w - BAND.pad, bmid], [semLine, bmid], [semLine, SEMBAND.y + SEMBAND.h]]));
    parts.push(ctlNote(extLine - 8, 540, 'runs the syncs', 'end'));
    parts.push(ctlNote(whX + BAND.w / 2 + 8, LANE.y + 14, 'builds and tests'));
    parts.push(ctlNote(semLine + 8, 540, 'refreshes the cache'));
    parts.push(toolBox(whX + BAND.pad, by, toolW, ORCH.tool));
    parts.push(legend(frameCx, LEGEND_Y, (x, y) => ctl([[x, y], [x + 26, y]], { arrow: false })));
  } else if (VARIANT === 'sequence') {
    // Dagster in the empty slot under batch extraction, next to dbt
    drawBand(extX, TR, { label: ORCH.label, tools: [ORCH.tool] });
    const cx = extX + BAND.w / 2;
    parts.push(ctl([[cx, TR.y], [cx, BATCHBAND.y + BATCHBAND.h]]));
    parts.push(ctl([[extX + BAND.w, mid(TR)], [whX, mid(TR)]]));
    parts.push(ctl([[cx, TR.y + TR.h], [cx, UNDER_Y], [semX + semW / 2, UNDER_Y], [semX + semW / 2, SEMBAND.y + SEMBAND.h]]));
    // run order on the layers it drives
    parts.push(step(extX + BAND.w - 16, BATCHBAND.y + 15, 1));
    parts.push(step(whX + BAND.w - 16, TR.y + 15, 2));
    parts.push(step(sem.r - 16, SEMBAND.y + 15, 3));
    parts.push(ctlNote(semX + semW / 2 + 8, 540, 'cache refresh'));
    parts.push(legend(frameCx, LEGEND_Y, (x, y) => ctl([[x, y], [x + 26, y]], { arrow: false })));
  } else if (VARIANT === 'badges') {
    // Dagster pill on the frame's top border, a badge on every tool it runs
    const fy = BAND.y - 24, px = extX - FRAME_PAD + 18, ph = 28, pw = 214;
    const pill = `<rect x="${px}" y="${fy - ph / 2}" width="${pw}" height="${ph}" rx="${ph / 2}" fill="#ffffff" stroke="${BRAND}" stroke-width="1.2"/>
    ${image(ORCH.tool.icon, px + 22, fy, 16, 16)}
    <text x="${px + 36}" y="${fy + 4.5}" font-family="${SANS}" font-size="14" font-weight="600" fill="${INK}">Dagster</text>
    <text x="${px + 96}" y="${fy + 3.5}" font-family="${MONO}" font-size="10" letter-spacing="0.06em" fill="${BRAND}">ORCHESTRATION</text>
    ${ossTag(px + pw + TAG.overlap - 8, fy + ph / 2)}`;
    parts.push(link(ORCH.tool.url, ORCH.tool.name, ORCH.tool.tip, pill));
    const boxY = (b, j) => b.y + BAND.pad + BAND.labelH + j * TOOL.pitch;
    BATCH.tools.forEach((_, j) => parts.push(dagsterBadge(extX + BAND.pad, boxY(BATCHBAND, j))));
    parts.push(dagsterBadge(whX + BAND.pad, boxY(TR, 0)));
    const n = SEMANTIC.tools.length, top = mid(SEMBAND) - ((n - 1) * TOOL.pitch + TOOL.h) / 2;
    SEMANTIC.tools.forEach((_, j) => parts.push(dagsterBadge(semX + BAND.pad, top + j * TOOL.pitch)));
    parts.push(legend(frameCx, LEGEND_Y, (x, y) => dagsterBadge(x + 13, y)));
  }
}

const ORCH_ARIA = {
  lane: ' Underneath the stack, an orchestration layer with Dagster runs the batch extraction, the dbt build and the semantic layer refresh.',
  sequence: ' Dagster sits next to dbt and runs three steps in order: 1 batch extraction, 2 dbt, 3 the semantic layer refresh.',
  badges: ' Dagster orchestrates the Semantic Nexus: every tool it schedules (Airbyte, dlt, Hevo Data, dbt, Cube, Fabric semantic models) carries a Dagster badge.',
};

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS.w} ${CANVAS.h}" role="img" aria-label="Tech stack: product databases (PostgreSQL, MySQL) are streamed with Debezium into the real-time warehouse (ClickHouse); bookkeeping (Exact Online, Yuki), CRM (HubSpot), ERP (Float, Infor), customer care (Freshdesk, Zendesk) and spreadsheets (Google Sheets, Excel) are loaded in batch with Airbyte or Hevo Data into the batch warehouse (BigQuery, Snowflake or the Microsoft Fabric data warehouse). dbt runs as a separate transformation layer underneath the batch warehouse. Both warehouses feed the semantic layer, Cube or Microsoft Fabric semantic models. Extraction, warehouses, transformation and semantic layer together are the Semantic Nexus. Consumers read from the semantic layer in five groups: AI models (Claude, OpenAI, Gemini), MCPs (nao analytics), AI agents (the Quality Guardian, your own LangChain agents), reports (Data Studio, Power BI) and your own apps (Next.js, Django).${VARIANT ? ORCH_ARIA[VARIANT] : ''}" style="width:100%;height:auto;display:block">
  <defs>
    <marker id="ts-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="${INK}"/>
    </marker>${VARIANT ? `
    <marker id="ts-arrow-ctl" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="${BRAND}"/>
    </marker>` : ''}
  </defs>
  ${parts.join('\n  ')}
</svg>
`;

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'src', 'diagrams');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, `tech-stack-${DATE}.svg`);
writeFileSync(outPath, svg);
console.log(`wrote ${outPath} (${CANVAS.w}x${CANVAS.h})`);
