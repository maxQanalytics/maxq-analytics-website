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

const DATE = '2026-10-08';

// ---------------------------------------------------------------- spec

const INK = '#0a0a0f';
const TEXT = '#3d3b38';   // secondary text: sub lines, source and consumer names
const LINE = '#5c5a56';   // strokes and column labels
const BRAND = '#1a4fff';
const SANS = `'Outfit', system-ui, sans-serif`;
const MONO = `'DM Mono', 'SF Mono', ui-monospace, monospace`;

const SOURCES = ['ERP', 'CRM', 'Bookkeeping', 'Product database', 'Spreadsheets', 'Support tooling'];

const EXTRACTION = {
  label: 'EXTRACTION',
  tools: [
    { name: 'Airbyte', logo: '/logos/airbyte.svg', sub: 'open-source connectors', url: 'https://airbyte.com', tip: 'Open-source data integration platform for syncing data from APIs, databases and files.' },
    { name: 'Hevo Data', logo: '/logos/hevo.png', logoH: 20, sub: 'no-code · 150+ sources', url: 'https://hevodata.com', tip: 'No-code pipeline platform for extracting and syncing data from 150+ sources into your warehouse.' },
    { name: 'Debezium', logo: '/logos/debezium.png', sub: 'change data capture', url: 'https://debezium.io', tip: 'Open-source CDC platform that streams database changes in real time for event-driven data pipelines.' },
  ],
};

const WAREHOUSE = {
  label: 'WAREHOUSE',
  tools: [
    { name: 'BigQuery', logo: '/logos/bigquery.png', sub: 'serverless · Google Cloud', url: 'https://cloud.google.com/bigquery', tip: "Google's serverless, scalable cloud data warehouse built for fast SQL analytics at any scale." },
    { name: 'Snowflake', logo: '/logos/snowflake.png', sub: 'storage and compute apart', url: 'https://www.snowflake.com', tip: 'Cloud data platform with separated storage and compute, enabling flexible and cost-efficient scaling.' },
    { name: 'ClickHouse', logo: '/logos/clickhouse.png', sub: 'real-time analytics', url: 'https://clickhouse.com', tip: 'High-performance columnar database optimised for real-time analytics on very large datasets.' },
  ],
};

// sits under the warehouse, arrow going up into it
const TRANSFORMATION = {
  label: 'TRANSFORMATION',
  tool: { name: 'dbt', logo: '/logos/dbt.png', sub: 'models · tests · docs in git', url: 'https://www.getdbt.com', tip: 'SQL-based transformation tool that lets analytics engineers build, test and document data models in version control. Runs as its own layer on top of the warehouse.' },
};

const SEMANTIC = {
  label: 'SEMANTIC LAYER',
  tools: [
    { name: 'Cube', logo: '/logos/cube.png', sub: 'metrics defined once · API', url: 'https://cube.dev', tip: 'Semantic layer that defines business metrics centrally and exposes them consistently via API to any downstream tool.' },
    { name: 'Microsoft Fabric', logo: '/logos/fabric.png', logoH: 22, sub: 'semantic models', url: 'https://www.microsoft.com/en-us/microsoft-fabric', tip: "Microsoft Fabric semantic models, the semantic layer for Power BI and the rest of the Microsoft stack." },
  ],
};

const CONSUMER_GROUPS = [
  {
    label: 'AI AGENTS',
    items: [
      { name: 'Quality Guardian', icon: '/logos/quality-guardian.png', url: '/add-ons/quality-guardian', tip: 'Maxq add-on: an agent that investigates failing data-entry tests and writes the fix back to the source system.', self: true },
      { name: 'Client agents', tip: 'Your own agents, reading governed metrics through the semantic layer instead of raw tables.' },
    ],
  },
  {
    label: 'MCPS',
    items: [
      { name: 'nao analytics MCP', icon: '/logos/nao.png', url: '/add-ons/analytics-assistant', tip: 'Maxq add-on: the nao-based Analytics Assistant, an MCP server that answers data questions in Slack and in Claude.', self: true },
    ],
  },
  {
    label: 'AI MODELS',
    items: [
      { name: 'Claude', icon: '/logos/claude-icon.svg', url: 'https://claude.ai', tip: "Anthropic's models, connected to your semantic layer through an MCP server for natural-language data questions." },
      { name: 'OpenAI', icon: '/logos/openai.svg', url: 'https://openai.com', tip: 'OpenAI models, reading the same metric definitions through the semantic layer API.' },
      { name: 'Gemini', icon: '/logos/gemini.svg', url: 'https://gemini.google.com', tip: "Google's Gemini models, reading the same metric definitions through the semantic layer API." },
    ],
  },
  {
    label: 'REPORTS',
    items: [
      { name: 'Data Studio', logo: '/logos/data-studio.png', url: 'https://lookerstudio.google.com', tip: "Google's free BI tool for building interactive, shareable dashboards connected directly to your data sources." },
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

// geometry
const SRC = { x: 14, w: 142, h: 28, pitch: 34, firstY: 88 };
const GAP = 36;                                   // between columns
const BAND = { y: 54, labelY: 73, pad: 14, w: 206 };
const TOOL = { h: 64, pitch: 76, firstY: 90, logoW: 130, logoH: 24 };
const CON = { w: 160, h: 34, pitch: 38, groupGap: 12, labelH: 18, firstY: 58 };
const LABEL_Y = 44;
const FONT = { label: 11, sub: 12, name: 13 };

const extX = SRC.x + SRC.w + 50;
const whX = extX + BAND.w + GAP;
const semW = BAND.w;
const semX = whX + BAND.w + GAP;
const busX = semX + semW + GAP / 2 + 6;
const conX = semX + semW + GAP + 16;

const toolW = BAND.w - 2 * BAND.pad;
const toolY = (j) => TOOL.firstY + j * TOOL.pitch;
const bandH = toolY(2) + TOOL.h + BAND.pad - BAND.y;
const bandMidY = BAND.y + bandH / 2;
const bandBottom = BAND.y + bandH;

const TR = { y: bandBottom + 22, h: BAND.pad + 19 + TOOL.h + BAND.pad };   // transformation band

// consumer rows
const conRows = [];
{
  let y = CON.firstY;
  CONSUMER_GROUPS.forEach((g) => {
    conRows.push({ kind: 'label', y: y + 11, text: g.label });
    y += CON.labelH;
    g.items.forEach((it) => { conRows.push({ kind: 'item', y, item: it }); y += CON.pitch; });
    y += CON.groupGap - (CON.pitch - CON.h);
  });
}
const itemRows = conRows.filter((r) => r.kind === 'item');
const conBottom = itemRows[itemRows.length - 1].y + CON.h;
const CANVAS = { w: conX + CON.w + 14, h: Math.max(TR.y + TR.h, conBottom) + 14 };

// ---------------------------------------------------------------- helpers

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function colLabel(x, y, text, { anchor = 'middle' } = {}) {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${MONO}" font-size="${FONT.label}" letter-spacing="0.08em" fill="${LINE}">${esc(text)}</text>`;
}

function image(href, cx, cy, w, h) {
  return `<image href="${esc(href)}" x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>`;
}

function link(url, tip, inner) {
  if (!url) return `<g>\n    <title>${esc(tip)}</title>\n    ${inner}\n  </g>`;
  const target = url.startsWith('/') ? '' : ' target="_blank" rel="noopener"';
  return `<a href="${esc(url)}"${target}>\n    <title>${esc(tip)}</title>\n    ${inner}\n  </a>`;
}

function toolBox(x, y, w, tool) {
  const cx = x + w / 2;
  const lh = tool.logoH ?? TOOL.logoH;
  const inner = `<rect x="${x}" y="${y}" width="${w}" height="${TOOL.h}" rx="4" fill="#ffffff" stroke="${INK}" stroke-width="1.2"/>
    ${image(tool.logo, cx, y + 23, TOOL.logoW, lh)}
    <text x="${cx}" y="${y + 52}" text-anchor="middle" font-family="${SANS}" font-size="${FONT.sub}" fill="${TEXT}">${esc(tool.sub)}</text>`;
  return link(tool.url, tool.tip, inner);
}

function softBox(x, y, w, h, text) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="#f5f3f0" stroke="${LINE}" stroke-width="1"/>
  <text x="${x + w / 2}" y="${y + h / 2 + 4}" text-anchor="middle" font-family="${SANS}" font-size="${FONT.sub}" fill="${TEXT}">${esc(text)}</text>`;
}

function consumerBox(x, y, it) {
  const cx = x + CON.w / 2;
  let content;
  if (it.logo) {
    content = image(it.logo, cx, y + CON.h / 2, 118, 20);
  } else if (it.icon) {
    const textW = it.name.length * 7.2;
    const startX = cx - (18 + 8 + textW) / 2;
    content = `${image(it.icon, startX + 9, y + CON.h / 2, 18, 18)}
    <text x="${startX + 26}" y="${y + CON.h / 2 + 4.5}" font-family="${SANS}" font-size="${FONT.name}" font-weight="600" fill="${INK}">${esc(it.name)}</text>`;
  } else {
    content = `<text x="${cx}" y="${y + CON.h / 2 + 4.5}" text-anchor="middle" font-family="${SANS}" font-size="${FONT.name}" font-weight="600" fill="${INK}">${esc(it.name)}</text>`;
  }
  const inner = `<rect x="${x}" y="${y}" width="${CON.w}" height="${CON.h}" rx="3" fill="#f5f3f0" stroke="${it.self ? BRAND : LINE}" stroke-width="1"/>
    ${content}`;
  return link(it.url, it.tip, inner);
}

function band(x, y, w, h) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="#fafaf8" stroke="${LINE}" stroke-width="1" stroke-dasharray="5 4"/>`;
}

// elbow connector: horizontal, vertical, horizontal; turns at midX
function elbow(x1, y1, x2, y2, { thin = false, midX } = {}) {
  const mx = midX ?? (x1 + x2) / 2;
  return `<path d="M${x1},${y1} L${mx},${y1} L${mx},${y2} L${x2},${y2}" fill="none" stroke="${thin ? LINE : INK}" stroke-width="${thin ? 1 : 1.5}"/>`;
}

function line(x1, y1, x2, y2, { thin = false, arrow = false } = {}) {
  const m = arrow ? ' marker-end="url(#ts-arrow)"' : '';
  return `<path d="M${x1},${y1} L${x2},${y2}" fill="none" stroke="${thin ? LINE : INK}" stroke-width="${thin ? 1 : 1.5}"${m}/>`;
}

// ---------------------------------------------------------------- build

const parts = [];

// sources column, fanning into the extraction band through one elbow lane
parts.push(colLabel(SRC.x + SRC.w / 2, LABEL_Y, 'SOURCES'));
SOURCES.forEach((name, j) => {
  const y = SRC.firstY + j * SRC.pitch;
  parts.push(softBox(SRC.x, y, SRC.w, SRC.h, name));
  parts.push(elbow(SRC.x + SRC.w, y + SRC.h / 2, extX - 8, bandMidY, { thin: true, midX: SRC.x + SRC.w + (extX - SRC.x - SRC.w) / 2 }));
});
parts.push(line(extX - 8, bandMidY, extX, bandMidY, { arrow: true }));

// extraction band
parts.push(band(extX, BAND.y, BAND.w, bandH));
parts.push(colLabel(extX + BAND.w / 2, BAND.labelY, EXTRACTION.label));
EXTRACTION.tools.forEach((t, j) => parts.push(toolBox(extX + BAND.pad, toolY(j), toolW, t)));
parts.push(line(extX + BAND.w, bandMidY, whX, bandMidY, { arrow: true }));

// warehouse band
parts.push(band(whX, BAND.y, BAND.w, bandH));
parts.push(colLabel(whX + BAND.w / 2, BAND.labelY, WAREHOUSE.label));
WAREHOUSE.tools.forEach((t, j) => parts.push(toolBox(whX + BAND.pad, toolY(j), toolW, t)));
parts.push(line(whX + BAND.w, bandMidY, semX, bandMidY, { arrow: true }));

// transformation band under the warehouse, arrow up into it
parts.push(band(whX, TR.y, BAND.w, TR.h));
parts.push(colLabel(whX + BAND.w / 2, TR.y + 19, TRANSFORMATION.label));
parts.push(toolBox(whX + BAND.pad, TR.y + BAND.pad + 19, toolW, TRANSFORMATION.tool));
parts.push(line(whX + BAND.w / 2, TR.y, whX + BAND.w / 2, bandBottom, { arrow: true }));

// semantic layer band, boxes stacked around the band's middle
parts.push(band(semX, BAND.y, semW, bandH));
parts.push(colLabel(semX + semW / 2, BAND.labelY, SEMANTIC.label));
{
  const n = SEMANTIC.tools.length;
  const top = bandMidY - ((n - 1) * TOOL.pitch + TOOL.h) / 2;
  SEMANTIC.tools.forEach((t, j) => parts.push(toolBox(semX + BAND.pad, top + j * TOOL.pitch, toolW, t)));
}

// consumers: one bus line from the semantic layer, ticks into each box
parts.push(colLabel(conX + CON.w / 2, LABEL_Y, 'CONSUMERS'));
const firstMid = itemRows[0].y + CON.h / 2;
const lastMid = itemRows[itemRows.length - 1].y + CON.h / 2;
parts.push(line(semX + semW, bandMidY, busX, bandMidY));
parts.push(line(busX, firstMid, busX, lastMid, { thin: true }));
conRows.forEach((r) => {
  if (r.kind === 'label') parts.push(colLabel(conX, r.y, r.text, { anchor: 'start' }));
  else {
    parts.push(line(busX, r.y + CON.h / 2, conX, r.y + CON.h / 2, { thin: true }));
    parts.push(consumerBox(conX, r.y, r.item));
  }
});

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS.w} ${CANVAS.h}" role="img" aria-labelledby="ts-title" style="width:100%;height:auto;display:block">
  <title id="ts-title">Tech stack: your sources (ERP, CRM, bookkeeping, product database, spreadsheets, support tooling) are extracted with Airbyte, Hevo Data or Debezium into a warehouse (BigQuery, Snowflake or ClickHouse). dbt runs as a separate transformation layer underneath the warehouse, Cube or Microsoft Fabric semantic models serve the result as the semantic layer. Consumers read from the semantic layer in five groups: AI agents (the Quality Guardian, your own client agents), MCPs (the nao analytics MCP), AI models (Claude, OpenAI, Gemini), reports (Data Studio, Power BI) and your own apps (Next.js, Django).</title>
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
