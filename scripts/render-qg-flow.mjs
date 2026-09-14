// Generates src/diagrams/quality-guardian-flow-<date>.svg, the "How it works"
// flow chart on the Quality Guardian add-on page. Explicit layout, no
// auto-layout engine (same approach and arrow helpers as
// maxq-sales/scripts/render-sales-funnel.mjs). Edit the SPEC, run
//
//   node scripts/render-qg-flow.mjs
//
// and commit the regenerated SVG with your change. The page inlines the SVG
// (`import ... '?raw'` + set:html), so it picks up the site's fonts and
// scales with its container; the page keeps a stacked CSS version for phones.

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const DATE = '2026-09-14';

// ---------------------------------------------------------------- spec

const INK = '#0a0a0f';
const LINE = '#6b6762';
const MUTED = '#7a766f';
const SANS = `'Outfit', system-ui, sans-serif`;
const MONO = `'DM Mono', 'SF Mono', ui-monospace, monospace`;

const NODE = { fill: '#ebe7e1', stroke: '#d6d1c8' };
const OK = { fill: '#f0fdf4', stroke: '#bbf7d0', badge: '#16a34a', text: '#166534' };
const WARN = { fill: '#fffbeb', stroke: '#fde68a', badge: '#d97706', text: '#92400e' };
const BADGE = '#f59e0b';

const CANVAS = { w: 1210, h: 410 };
const ROW_Y = 110; // top of the main-flow nodes
const NODE_H = 130;
const NODE_W = 230;

const nodes = {
  tests:   { x: 30,  y: ROW_Y, w: NODE_W, h: NODE_H, n: '1',  kicker: 'Your warehouse',      title: ['Data-entry', 'tests fail'] },
  agent:   { x: 340, y: ROW_Y, w: NODE_W, h: NODE_H, n: '2',  kicker: 'Per failing record',  title: ['The agent', 'investigates'] },
  verdict: { x: 650, y: ROW_Y, w: NODE_W, h: NODE_H, n: '3',  kicker: 'Always',              title: ['A verdict with a', 'confidence score'] },
  fix:     { x: 950, y: 20,    w: 230,    h: 140,    n: '4a', kicker: 'High confidence, own data', title: ['Fix written to the', 'source system'], tone: OK },
  card:    { x: 950, y: 190,   w: 230,    h: 140,    n: '4b', kicker: 'Everything else',     title: ['Action card to the', 'test owner'], tone: WARN },
};

// satellite pills hanging under a node (label, optional number)
const satellites = {
  tests: ['runs with your dbt build', 'one named owner per test', 'Snowflake or BigQuery'],
  agent: ['2a · read-only SQL over curated tables', '2b · web search as fallback', '2c · step budget per record'],
};
const SAT = { w: 262, h: 30, pitch: 40, gapBelowNode: 34 };

// ---------------------------------------------------------------- helpers

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const cx = (n) => n.x + n.w / 2;
const cy = (n) => n.y + n.h / 2;
const right = (n) => n.x + n.w;
const bottom = (n) => n.y + n.h;

function badge(x, y, label, fill, r = 13) {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>
  <text x="${x}" y="${y + 4}" text-anchor="middle" font-family="${SANS}" font-size="11" font-weight="800" fill="#ffffff">${esc(label)}</text>`;
}

function node(n) {
  const tone = n.tone ?? NODE;
  const badgeFill = n.tone ? n.tone.badge : BADGE;
  const kickerFill = n.tone ? n.tone.text : MUTED;
  const out = [];
  out.push(`<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="16" fill="${tone.fill}" stroke="${tone.stroke}" stroke-width="1.5"/>`);
  out.push(badge(n.x + 22, n.y, n.n, badgeFill));
  out.push(`<text x="${n.x + 20}" y="${n.y + 30}" font-family="${MONO}" font-size="9.5" letter-spacing="0.08em" fill="${kickerFill}">${esc(n.kicker.toUpperCase())}</text>`);
  n.title.forEach((line, i) => {
    out.push(`<text x="${n.x + 20}" y="${n.y + 54 + i * 21}" font-family="${SANS}" font-size="17" font-weight="700" fill="${INK}" letter-spacing="-0.01em">${esc(line)}</text>`);
  });
  return out.join('\n  ');
}

function chip(x, y, label, fill, stroke, text, w) {
  return `<rect x="${x}" y="${y}" width="${w}" height="22" rx="6" fill="${fill}" stroke="${stroke}" stroke-width="1"/>
  <text x="${x + w / 2}" y="${y + 15}" text-anchor="middle" font-family="${MONO}" font-size="10.5" fill="${text}">${esc(label)}</text>`;
}

function pill(x, y, label) {
  return `<rect x="${x}" y="${y}" width="${SAT.w}" height="${SAT.h}" rx="8" fill="#ffffff" stroke="${NODE.stroke}" stroke-width="1"/>
  <text x="${x + 12}" y="${y + 19}" font-family="${MONO}" font-size="10.5" fill="${INK}">${esc(label)}</text>`;
}

// satellites: a spine down from the node's bottom-left area, ticks into each pill
function satelliteGroup(n, items) {
  const out = [];
  const spineX = n.x + 22;
  const firstY = bottom(n) + SAT.gapBelowNode;
  const lastY = firstY + (items.length - 1) * SAT.pitch;
  out.push(`<path d="M${spineX},${bottom(n)} L${spineX},${lastY + SAT.h / 2}" fill="none" stroke="${LINE}" stroke-width="1.5" stroke-dasharray="3 3"/>`);
  items.forEach((label, i) => {
    const y = firstY + i * SAT.pitch;
    const px = spineX + 14;
    out.push(`<path d="M${spineX},${y + SAT.h / 2} L${px},${y + SAT.h / 2}" fill="none" stroke="${LINE}" stroke-width="1.5"/>`);
    out.push(pill(px, y, label));
  });
  return out.join('\n  ');
}

// horizontal arrow with straight lead-in/lead-out (from the sales-funnel renderer)
function arrowRight(x1, y1, x2, y2, { straight = 0.2 } = {}) {
  const total = x2 - x1;
  const xA = x1 + total * straight;
  const xB = x2 - total * straight;
  return `<path d="M${x1},${y1} L${xA},${y1} C${xA + total * 0.16},${y1} ${xB - total * 0.16},${y2} ${xB},${y2} L${x2},${y2}" fill="none" stroke="${LINE}" stroke-width="2" marker-end="url(#qg-arrow)"/>`;
}

// curved arrow entering its target horizontally
function arrow(x1, y1, x2, y2, { dashed = false, bend = 60 } = {}) {
  const dash = dashed ? ' stroke-dasharray="6 4"' : '';
  return `<path d="M${x1},${y1} C${x1 + bend},${y1} ${x2 - bend},${y2} ${x2},${y2}" fill="none" stroke="${LINE}" stroke-width="2"${dash} marker-end="url(#qg-arrow)"/>`;
}

// the feedback loop: from a node's right edge, out to a lane, up over the top
// and back down into the tests node. Rounded corners, dashed.
function returnLoop(sx, sy, laneX, topY, ex, ey, { r = 14, marker = true } = {}) {
  const m = marker ? ' marker-end="url(#qg-arrow)"' : '';
  return `<path d="M${sx},${sy} L${laneX - r},${sy} Q${laneX},${sy} ${laneX},${sy - r} L${laneX},${topY + r} Q${laneX},${topY} ${laneX - r},${topY} L${ex + r},${topY} Q${ex},${topY} ${ex},${topY + r} L${ex},${ey}" fill="none" stroke="${LINE}" stroke-width="2" stroke-dasharray="6 4"${m}/>`;
}

function label(x, y, text, { anchor = 'middle', fill = MUTED, size = 10.5 } = {}) {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${MONO}" font-size="${size}" letter-spacing="0.06em" fill="${fill}">${esc(text.toUpperCase())}</text>`;
}

// ---------------------------------------------------------------- build

const parts = [];
const { tests, agent, verdict, fix, card } = nodes;

// main flow arrows
parts.push(arrowRight(right(tests), cy(tests), agent.x, cy(agent)));
parts.push(arrowRight(right(agent), cy(agent), verdict.x, cy(verdict)));

// split after the verdict
parts.push(arrow(right(verdict), cy(verdict) - 8, fix.x, cy(fix), { bend: 50 }));
parts.push(arrow(right(verdict), cy(verdict) + 8, card.x, cy(card), { bend: 50 }));

// feedback loop: both outcomes come back to the tests on the next build
const laneX = 1196;
const topY = 12;
parts.push(returnLoop(right(card), cy(card), laneX, topY, cx(tests), tests.y));
parts.push(`<path d="M${right(fix)},${cy(fix)} L${laneX - 14},${cy(fix)}" fill="none" stroke="${LINE}" stroke-width="2" stroke-dasharray="6 4"/>`);
const loopMid = (cx(tests) + laneX) / 2;
parts.push(`<rect x="${loopMid - 240}" y="${topY - 10}" width="480" height="20" fill="#f5f3f0"/>`);
parts.push(label(loopMid, topY + 4, 'next build re-tests the record · fixed by the agent or by the owner'));

// nodes
Object.values(nodes).forEach((n) => parts.push(node(n)));

// verdict chips
const chipY = verdict.y + 94;
parts.push(chip(verdict.x + 20, chipY, 'high', '#f0fdf4', '#bbf7d0', '#166534', 54));
parts.push(chip(verdict.x + 82, chipY, 'medium', '#fffbeb', '#fde68a', '#92400e', 66));
parts.push(chip(verdict.x + 156, chipY, 'low', '#fef2f2', '#fecaca', '#991b1b', 46));

// fix / card chips
parts.push(chip(fix.x + 20, fix.y + 92, 'fill a field', '#ffffff', OK.stroke, OK.text, 84));
parts.push(chip(fix.x + 112, fix.y + 92, 'create a row', '#ffffff', OK.stroke, OK.text, 88));
parts.push(chip(card.x + 20, card.y + 88, 'Slack', '#ffffff', WARN.stroke, WARN.text, 50));
parts.push(chip(card.x + 78, card.y + 88, 'one card per record', '#ffffff', WARN.stroke, WARN.text, 132));
parts.push(chip(card.x + 20, card.y + 114, 'Issue · Found · Action · Where', '#ffffff', WARN.stroke, WARN.text, 200));

// satellites
parts.push(satelliteGroup(tests, satellites.tests));
parts.push(satelliteGroup(agent, satellites.agent));

// note under the outcomes
parts.push(`<text x="${card.x}" y="${bottom(card) + 34}" font-family="${SANS}" font-size="12.5" fill="${MUTED}">Write-back is off until you switch it on;</text>`);
parts.push(`<text x="${card.x}" y="${bottom(card) + 52}" font-family="${SANS}" font-size="12.5" fill="${MUTED}">while off, the run shows what it would write.</text>`);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS.w} ${CANVAS.h}" role="img" aria-labelledby="qg-flow-title" style="width:100%;height:auto;display:block">
  <title id="qg-flow-title">How the Quality Guardian works: data-entry tests fail in the warehouse, the agent investigates each record, reaches a verdict with a confidence score, then either writes the fix to the source system or sends an action card to the test owner; the next build re-tests the record.</title>
  <defs>
    <marker id="qg-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="${LINE}"/>
    </marker>
  </defs>
  ${parts.join('\n  ')}
</svg>
`;

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'src', 'diagrams');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, `quality-guardian-flow-${DATE}.svg`);
writeFileSync(outPath, svg);
console.log(`wrote ${outPath}`);
