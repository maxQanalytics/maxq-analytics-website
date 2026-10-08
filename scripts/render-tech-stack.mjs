// Generates src/diagrams/tech-stack-<date>.svg, the "Tech stack" flow chart on
// the homepage. Same visual language as the architecture diagrams in our
// proposals (maxq-sales, reports/proposals/*: white tool boxes with an ink
// stroke, soft boxes for sources and consumers, dashed bands for groups,
// mono column labels, elbow connectors — never diagonals). Explicit layout,
// no auto-layout engine. Edit the SPEC, run
//
//   node scripts/render-tech-stack.mjs
//
// and commit the regenerated SVG with your change. The page inlines the SVG
// (`import ... '?raw'` + set:html) so it picks up the site's fonts and scales
// with its container; the page keeps a stacked CSS version for phones.

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

// sources and consumers: soft boxes (no links)
const SOURCES = ['ERP', 'CRM', 'Bookkeeping', 'Product database', 'Spreadsheets', 'Support tooling'];
const CONSUMERS = [
  { name: 'Looker Studio', sub: 'dashboards', url: 'https://lookerstudio.google.com', tip: "Google's free BI tool for building interactive, shareable dashboards connected directly to your data sources." },
  { name: 'Power BI', sub: 'reports', url: 'https://powerbi.microsoft.com', tip: "Microsoft's business intelligence platform for creating rich reports and dashboards across your organisation." },
  { name: 'Claude', sub: 'ask in plain language', url: 'https://claude.ai', tip: "Anthropic's AI assistant, connected to your semantic layer via an MCP server for natural-language data querying." },
];

// the three stages between sources and consumers: one dashed band each,
// white tool boxes inside
const STAGES = [
  {
    label: 'EXTRACTION',
    tools: [
      { name: 'Airbyte', sub: 'open-source connectors', url: 'https://airbyte.com', tip: 'Open-source data integration platform for syncing data from APIs, databases and files.' },
      { name: 'Hevo Data', sub: 'no-code · 150+ sources', url: 'https://hevodata.com', tip: 'No-code pipeline platform for extracting and syncing data from 150+ sources into your warehouse.' },
      { name: 'Debezium', sub: 'change data capture', url: 'https://debezium.io', tip: 'Open-source CDC platform that streams database changes in real time for event-driven data pipelines.' },
    ],
  },
  {
    label: 'WAREHOUSE',
    tools: [
      { name: 'BigQuery', sub: 'serverless · Google Cloud', url: 'https://cloud.google.com/bigquery', tip: "Google's serverless, scalable cloud data warehouse built for fast SQL analytics at any scale." },
      { name: 'Snowflake', sub: 'storage and compute apart', url: 'https://www.snowflake.com', tip: 'Cloud data platform with separated storage and compute, enabling flexible and cost-efficient scaling.' },
      { name: 'ClickHouse', sub: 'real-time columnar analytics', url: 'https://clickhouse.com', tip: 'High-performance columnar database optimised for real-time analytics on very large datasets.' },
    ],
  },
  {
    label: 'TRANSFORMATION · SEMANTICS',
    tools: [
      { name: 'dbt', sub: 'models · tests · docs, in git', url: 'https://www.getdbt.com', tip: 'SQL-based transformation tool that lets analytics engineers build, test and document data models in version control.' },
      { name: 'Cube', sub: 'semantic layer · metrics API', url: 'https://cube.dev', tip: 'Semantic layer that defines business metrics centrally and exposes them consistently via API to any downstream tool.' },
      { name: 'Microsoft Fabric', sub: 'all-in-one alternative', url: 'https://www.microsoft.com/en-us/microsoft-fabric', tip: "Microsoft's all-in-one analytics platform combining data engineering, warehousing and BI in a unified environment." },
    ],
  },
];

const OWNED_LABEL = 'YOUR OWN CLOUD ACCOUNTS · YOU STAY IN CONTROL';

// geometry
const SRC = { x: 14, w: 132, h: 26, pitch: 32, firstY: 86 };
const BAND = { w: 188, gap: 46, firstX: 196, y: 54, labelY: 72, pad: 14 };
const TOOL = { w: 160, h: 58, pitch: 70, firstY: 86 };
const CON = { w: 150, h: 40, pitch: 56, firstY: 104 };
const LABEL_Y = 44;

const bandX = (i) => BAND.firstX + i * (BAND.w + BAND.gap);
const bandRight = (i) => bandX(i) + BAND.w;
const toolX = (i) => bandX(i) + BAND.pad;
const toolY = (j) => TOOL.firstY + j * TOOL.pitch;
const lastToolBottom = toolY(TOOL_COUNT() - 1) + TOOL.h;
function TOOL_COUNT() { return Math.max(...STAGES.map((s) => s.tools.length)); }
const bandH = lastToolBottom + BAND.pad - BAND.y;
const bandMidY = BAND.y + bandH / 2;
const conX = bandRight(STAGES.length - 1) + BAND.gap + 18;
const CANVAS = { w: conX + CON.w + 14, h: BAND.y + bandH + 48 };

// ---------------------------------------------------------------- helpers

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function colLabel(x, y, text, { brand = false } = {}) {
  return `<text x="${x}" y="${y}" text-anchor="middle" font-family="${MONO}" font-size="9.5" letter-spacing="0.08em" fill="${brand ? BRAND : SOFT}"${brand ? ' font-weight="500"' : ''}>${esc(text)}</text>`;
}

function softBox(x, y, w, h, text, sub) {
  const out = [`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="#f5f3f0" stroke="${SOFT}" stroke-width="1"/>`];
  if (sub) {
    out.push(`<text x="${x + w / 2}" y="${y + 17}" text-anchor="middle" font-family="${SANS}" font-size="12.5" font-weight="600" fill="${INK}">${esc(text)}</text>`);
    out.push(`<text x="${x + w / 2}" y="${y + 31}" text-anchor="middle" font-family="${SANS}" font-size="10" fill="${SOFT}">${esc(sub)}</text>`);
  } else {
    out.push(`<text x="${x + w / 2}" y="${y + 17}" text-anchor="middle" font-family="${SANS}" font-size="10.5" fill="${SOFT}">${esc(text)}</text>`);
  }
  return out.join('\n  ');
}

function toolBox(x, y, tool) {
  return `<a href="${esc(tool.url)}" target="_blank" rel="noopener">
    <title>${esc(tool.tip)}</title>
    <rect x="${x}" y="${y}" width="${TOOL.w}" height="${TOOL.h}" rx="4" fill="#ffffff" stroke="${INK}" stroke-width="1.2"/>
    <text x="${x + TOOL.w / 2}" y="${y + 25}" text-anchor="middle" font-family="${SANS}" font-size="13.5" font-weight="700" fill="${INK}">${esc(tool.name)}</text>
    <text x="${x + TOOL.w / 2}" y="${y + 43}" text-anchor="middle" font-family="${SANS}" font-size="10.5" fill="${SOFT}">${esc(tool.sub)}</text>
  </a>`;
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

// ---------------------------------------------------------------- build

const parts = [];

// sources column
const srcCx = SRC.x + SRC.w / 2;
parts.push(colLabel(srcCx, LABEL_Y, 'SOURCES'));
SOURCES.forEach((name, j) => {
  const y = SRC.firstY + j * SRC.pitch;
  parts.push(softBox(SRC.x, y, SRC.w, SRC.h, name));
  parts.push(elbow(SRC.x + SRC.w, y + SRC.h / 2, bandX(0), bandMidY, { thin: true, midX: SRC.x + SRC.w + (bandX(0) - SRC.x - SRC.w) / 2 }));
});
parts.push(`<path d="M${bandX(0) - 6},${bandMidY} L${bandX(0)},${bandMidY}" fill="none" stroke="${INK}" stroke-width="1.4" marker-end="url(#ts-arrow)"/>`);

// stage bands with tools
STAGES.forEach((stage, i) => {
  parts.push(band(bandX(i), BAND.y, BAND.w, bandH));
  parts.push(colLabel(bandX(i) + BAND.w / 2, BAND.labelY, stage.label));
  stage.tools.forEach((tool, j) => parts.push(toolBox(toolX(i), toolY(j), tool)));
  if (i < STAGES.length - 1) {
    parts.push(elbow(bandRight(i), bandMidY, bandX(i + 1), bandMidY, { arrow: true }));
  }
});

// consumers column
const conCx = conX + CON.w / 2;
parts.push(colLabel(conCx, LABEL_Y, 'CONSUMERS'));
const lastRight = bandRight(STAGES.length - 1);
CONSUMERS.forEach((c, j) => {
  const y = CON.firstY + j * CON.pitch;
  parts.push(elbow(lastRight, bandMidY, conX, y + CON.h / 2, { thin: true, midX: lastRight + (conX - lastRight) / 2 }));
  parts.push(`<a href="${esc(c.url)}" target="_blank" rel="noopener"><title>${esc(c.tip)}</title>${softBox(conX, y, CON.w, CON.h, c.name, c.sub)}</a>`);
});

// ownership label under the three bands
const ownedCx = (bandX(0) + bandRight(STAGES.length - 1)) / 2;
parts.push(colLabel(ownedCx, BAND.y + bandH + 26, OWNED_LABEL, { brand: true }));

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS.w} ${CANVAS.h}" role="img" aria-labelledby="ts-title" style="width:100%;height:auto;display:block">
  <title id="ts-title">Tech stack: your sources (ERP, CRM, bookkeeping, product database, spreadsheets, support tooling) are extracted with Airbyte, Hevo Data or Debezium into a warehouse (BigQuery, Snowflake or ClickHouse), transformed with dbt and served through the Cube semantic layer (or Microsoft Fabric as an all-in-one alternative) to Looker Studio, Power BI and Claude. Everything runs in your own cloud accounts.</title>
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
