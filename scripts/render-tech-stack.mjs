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

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const DATE = '2026-10-08';

// ---------------------------------------------------------------- spec

const INK = '#0a0a0f';
const SOFT = '#5c5a56';
const BRAND = '#1a4fff';
const SANS = `'Outfit', system-ui, sans-serif`;
const MONO = `'DM Mono', 'SF Mono', ui-monospace, monospace`;

const SOURCES = ['ERP', 'CRM', 'Bookkeeping', 'Product database', 'Spreadsheets', 'Support tooling'];

// layers between sources and consumers, left to right: one dashed band each,
// white tool boxes inside (logo on top, one line of what it does below)
const LAYERS = [
  {
    label: 'EXTRACTION', w: 188,
    tools: [
      { name: 'Airbyte', logo: '/logos/airbyte.svg', sub: 'open-source connectors', url: 'https://airbyte.com', tip: 'Open-source data integration platform for syncing data from APIs, databases and files.' },
      { name: 'Hevo Data', logo: '/logos/hevo.png', logoH: 20, sub: 'no-code · 150+ sources', url: 'https://hevodata.com', tip: 'No-code pipeline platform for extracting and syncing data from 150+ sources into your warehouse.' },
      { name: 'Debezium', logo: '/logos/debezium.png', sub: 'change data capture', url: 'https://debezium.io', tip: 'Open-source CDC platform that streams database changes in real time for event-driven data pipelines.' },
    ],
  },
  {
    label: 'WAREHOUSE', w: 188,
    tools: [
      { name: 'BigQuery', logo: '/logos/bigquery.png', sub: 'serverless · Google Cloud', url: 'https://cloud.google.com/bigquery', tip: "Google's serverless, scalable cloud data warehouse built for fast SQL analytics at any scale." },
      { name: 'Snowflake', logo: '/logos/snowflake.png', sub: 'storage and compute apart', url: 'https://www.snowflake.com', tip: 'Cloud data platform with separated storage and compute, enabling flexible and cost-efficient scaling.' },
      { name: 'ClickHouse', logo: '/logos/clickhouse.png', sub: 'real-time columnar analytics', url: 'https://clickhouse.com', tip: 'High-performance columnar database optimised for real-time analytics on very large datasets.' },
    ],
  },
  {
    label: 'TRANSFORMATION', w: 160,
    tools: [
      { name: 'dbt', logo: '/logos/dbt.png', sub: 'models · tests · docs, in git', url: 'https://www.getdbt.com', tip: 'SQL-based transformation tool that lets analytics engineers build, test and document data models in version control. Runs as its own layer on top of the warehouse.' },
    ],
  },
  {
    label: 'SEMANTIC LAYER', w: 160,
    tools: [
      { name: 'Cube', logo: '/logos/cube.png', sub: 'metrics defined once · API', url: 'https://cube.dev', tip: 'Semantic layer that defines business metrics centrally and exposes them consistently via API to any downstream tool.' },
    ],
  },
];

// the all-in-one alternative, drawn as one wide soft box under the warehouse
// and transformation bands
const ALT = { name: 'Microsoft Fabric', logo: '/logos/fabric.png', sub: 'all-in-one alternative for both layers', url: 'https://www.microsoft.com/en-us/microsoft-fabric', tip: "Microsoft's all-in-one analytics platform combining data engineering, warehousing and BI in a unified environment.", spans: [1, 2] };

// consumers, clustered
const CONSUMER_GROUPS = [
  {
    label: 'AI AGENTS',
    items: [
      { name: 'Claude', icon: '/logos/claude-icon.svg', url: 'https://claude.ai', tip: "Anthropic's AI assistant, connected to your semantic layer through an MCP server for natural-language data questions." },
      { name: 'OpenAI', icon: '/logos/openai.svg', url: 'https://openai.com', tip: 'OpenAI models and agents, reading the same metric definitions through the semantic layer API.' },
      { name: 'Quality Guardian', url: '/add-ons/quality-guardian', tip: 'Maxq add-on: an agent that investigates failing data-entry tests and writes the fix back to the source system.', self: true },
    ],
  },
  {
    label: 'REPORTS',
    items: [
      { name: 'Looker Studio', logo: '/logos/looker-studio.png', url: 'https://lookerstudio.google.com', tip: "Google's free BI tool for building interactive, shareable dashboards connected directly to your data sources." },
      { name: 'Power BI', logo: '/logos/powerbi.png', url: 'https://powerbi.microsoft.com', tip: "Microsoft's business intelligence platform for creating rich reports and dashboards across your organisation." },
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

const OWNED_LABEL = 'YOUR OWN CLOUD ACCOUNTS · YOU STAY IN CONTROL';

// geometry
const SRC = { x: 14, w: 132, h: 26, pitch: 32, firstY: 86 };
const BAND = { gap: 46, firstX: 196, y: 54, labelY: 72, pad: 14 };
const TOOL = { h: 62, pitch: 74, firstY: 86, logoW: 120, logoH: 24 };
const CON = { w: 150, h: 32, pitch: 36, groupGap: 12, labelH: 16, firstY: 58 };
const LABEL_Y = 44;

const bandXs = LAYERS.reduce((xs, l, i) => { xs.push(i === 0 ? BAND.firstX : xs[i - 1] + LAYERS[i - 1].w + BAND.gap); return xs; }, []);
const bandX = (i) => bandXs[i];
const bandW = (i) => LAYERS[i].w;
const bandRight = (i) => bandX(i) + bandW(i);
const toolW = (i) => bandW(i) - 2 * BAND.pad;
const toolX = (i) => bandX(i) + BAND.pad;
const toolY = (j) => TOOL.firstY + j * TOOL.pitch;
const maxTools = Math.max(...LAYERS.map((l) => l.tools.length));
const lastToolBottom = toolY(maxTools - 1) + TOOL.h;
const bandH = lastToolBottom + BAND.pad - BAND.y;
const bandMidY = BAND.y + bandH / 2;
const altY = BAND.y + bandH + 16;
const altH = 36;
const conX = bandRight(LAYERS.length - 1) + BAND.gap + 18;
const busX = bandRight(LAYERS.length - 1) + BAND.gap / 2 + 9;

// consumer rows
const conRows = [];
{
  let y = CON.firstY;
  CONSUMER_GROUPS.forEach((g) => {
    conRows.push({ kind: 'label', y: y + 10, text: g.label });
    y += CON.labelH;
    g.items.forEach((it) => { conRows.push({ kind: 'item', y, item: it }); y += CON.pitch; });
    y += CON.groupGap - (CON.pitch - CON.h);
  });
}
const conBottom = Math.max(...conRows.filter((r) => r.kind === 'item').map((r) => r.y)) + CON.h;
const ownedY = Math.max(altY + altH, conBottom) + 28;
const CANVAS = { w: conX + CON.w + 14, h: ownedY + 14 };

// ---------------------------------------------------------------- helpers

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function colLabel(x, y, text, { brand = false, anchor = 'middle' } = {}) {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${MONO}" font-size="9.5" letter-spacing="0.08em" fill="${brand ? BRAND : SOFT}"${brand ? ' font-weight="500"' : ''}>${esc(text)}</text>`;
}

function image(href, cx, cy, w, h) {
  return `<image href="${esc(href)}" x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>`;
}

function link(url, tip, inner) {
  const target = url.startsWith('/') ? '' : ' target="_blank" rel="noopener"';
  return `<a href="${esc(url)}"${target}>\n    <title>${esc(tip)}</title>\n    ${inner}\n  </a>`;
}

function toolBox(x, y, w, tool) {
  const cx = x + w / 2;
  const lh = tool.logoH ?? TOOL.logoH;
  const inner = `<rect x="${x}" y="${y}" width="${w}" height="${TOOL.h}" rx="4" fill="#ffffff" stroke="${INK}" stroke-width="1.2"/>
    ${image(tool.logo, cx, y + 22, TOOL.logoW, lh)}
    <text x="${cx}" y="${y + 50}" text-anchor="middle" font-family="${SANS}" font-size="10.5" fill="${SOFT}">${esc(tool.sub)}</text>`;
  return link(tool.url, tool.tip, inner);
}

function altBox(x, y, w) {
  const inner = `<rect x="${x}" y="${y}" width="${w}" height="${altH}" rx="3" fill="#f5f3f0" stroke="${SOFT}" stroke-width="1"/>
    ${image(ALT.logo, x + 76, y + altH / 2, 110, 20)}
    <text x="${x + 144}" y="${y + altH / 2 + 4}" font-family="${SANS}" font-size="10.5" fill="${SOFT}">${esc(ALT.sub)}</text>`;
  return link(ALT.url, ALT.tip, inner);
}

function consumerBox(x, y, it) {
  const cx = x + CON.w / 2;
  let content;
  if (it.logo) {
    content = image(it.logo, cx, y + CON.h / 2, 110, it.logoH ?? 18);
  } else if (it.icon) {
    const textW = it.name.length * 6.6;
    const startX = cx - (16 + 8 + textW) / 2;
    content = `${image(it.icon, startX + 8, y + CON.h / 2, 16, 16)}
    <text x="${startX + 24}" y="${y + CON.h / 2 + 4}" font-family="${SANS}" font-size="12" font-weight="600" fill="${INK}">${esc(it.name)}</text>`;
  } else {
    content = `<text x="${cx}" y="${y + CON.h / 2 + 4}" text-anchor="middle" font-family="${SANS}" font-size="12" font-weight="600" fill="${INK}">${esc(it.name)}</text>`;
  }
  const stroke = it.self ? BRAND : SOFT;
  const inner = `<rect x="${x}" y="${y}" width="${CON.w}" height="${CON.h}" rx="3" fill="#f5f3f0" stroke="${stroke}" stroke-width="1"/>
    ${content}`;
  return link(it.url, it.tip, inner);
}

function band(x, y, w, h) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="#fafaf8" stroke="${SOFT}" stroke-width="1" stroke-dasharray="5 4"/>`;
}

// elbow connector: horizontal, vertical, horizontal; turns at midX
function elbow(x1, y1, x2, y2, { thin = false, arrow = false, midX } = {}) {
  const mx = midX ?? (x1 + x2) / 2;
  const stroke = thin ? SOFT : INK;
  const width = thin ? 0.9 : 1.4;
  const m = arrow ? ' marker-end="url(#ts-arrow)"' : '';
  return `<path d="M${x1},${y1} L${mx},${y1} L${mx},${y2} L${x2},${y2}" fill="none" stroke="${stroke}" stroke-width="${width}"${m}/>`;
}

function line(x1, y1, x2, y2, { thin = false, arrow = false } = {}) {
  const stroke = thin ? SOFT : INK;
  const width = thin ? 0.9 : 1.4;
  const m = arrow ? ' marker-end="url(#ts-arrow)"' : '';
  return `<path d="M${x1},${y1} L${x2},${y2}" fill="none" stroke="${stroke}" stroke-width="${width}"${m}/>`;
}

// ---------------------------------------------------------------- build

const parts = [];

// sources column, fanning into the extraction band through one elbow lane
const srcCx = SRC.x + SRC.w / 2;
parts.push(colLabel(srcCx, LABEL_Y, 'SOURCES'));
SOURCES.forEach((name, j) => {
  const y = SRC.firstY + j * SRC.pitch;
  parts.push(`<rect x="${SRC.x}" y="${y}" width="${SRC.w}" height="${SRC.h}" rx="3" fill="#f5f3f0" stroke="${SOFT}" stroke-width="1"/>
  <text x="${srcCx}" y="${y + 17}" text-anchor="middle" font-family="${SANS}" font-size="10.5" fill="${SOFT}">${esc(name)}</text>`);
  parts.push(elbow(SRC.x + SRC.w, y + SRC.h / 2, bandX(0) - 8, bandMidY, { thin: true, midX: SRC.x + SRC.w + (bandX(0) - SRC.x - SRC.w) / 2 }));
});
parts.push(line(bandX(0) - 8, bandMidY, bandX(0), bandMidY, { arrow: true }));

// layer bands with tools; single-tool bands centre their box vertically
LAYERS.forEach((layer, i) => {
  parts.push(band(bandX(i), BAND.y, bandW(i), bandH));
  parts.push(colLabel(bandX(i) + bandW(i) / 2, BAND.labelY, layer.label));
  const n = layer.tools.length;
  layer.tools.forEach((tool, j) => {
    const y = n === maxTools ? toolY(j) : bandMidY - TOOL.h / 2 + (j - (n - 1) / 2) * TOOL.pitch;
    parts.push(toolBox(toolX(i), y, toolW(i), tool));
  });
  if (i < LAYERS.length - 1) parts.push(line(bandRight(i), bandMidY, bandX(i + 1), bandMidY, { arrow: true }));
});

// all-in-one alternative under the warehouse and transformation bands
const altX = bandX(ALT.spans[0]);
const altW = bandRight(ALT.spans[1]) - altX;
parts.push(altBox(altX, altY, altW));

// consumers: one bus line from the semantic layer, ticks into each box
parts.push(colLabel(conX + CON.w / 2, LABEL_Y, 'CONSUMERS'));
const itemRows = conRows.filter((r) => r.kind === 'item');
const firstMid = itemRows[0].y + CON.h / 2;
const lastMid = itemRows[itemRows.length - 1].y + CON.h / 2;
parts.push(line(bandRight(LAYERS.length - 1), bandMidY, busX, bandMidY));
parts.push(line(busX, firstMid, busX, lastMid, { thin: true }));
conRows.forEach((r) => {
  if (r.kind === 'label') parts.push(colLabel(conX, r.y, r.text, { anchor: 'start' }));
  else {
    parts.push(line(busX, r.y + CON.h / 2, conX, r.y + CON.h / 2, { thin: true }));
    parts.push(consumerBox(conX, r.y, r.item));
  }
});

// ownership label under the bands
const ownedCx = (bandX(0) + bandRight(LAYERS.length - 1)) / 2;
parts.push(colLabel(ownedCx, ownedY, OWNED_LABEL, { brand: true }));

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS.w} ${CANVAS.h}" role="img" aria-labelledby="ts-title" style="width:100%;height:auto;display:block">
  <title id="ts-title">Tech stack: your sources (ERP, CRM, bookkeeping, product database, spreadsheets, support tooling) are extracted with Airbyte, Hevo Data or Debezium into a warehouse (BigQuery, Snowflake or ClickHouse). dbt runs as a separate transformation layer on top of the warehouse, Cube serves the result as the semantic layer, and Microsoft Fabric is the all-in-one alternative for warehouse and transformation. Consumers read from the semantic layer in three groups: AI agents (Claude, OpenAI, the Quality Guardian), reports (Looker Studio, Power BI) and your own apps (Next.js, Django). Everything runs in your own cloud accounts.</title>
  <defs>
    <marker id="ts-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="${INK}"/>
    </marker>
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
