/**
 * build-assets.mjs — 生成 GitHub Profile README 用的 SVG 资产（明/暗两套）。
 *
 * 用法： node tools/build-assets.mjs
 * 输出： assets/hero-{light,dark}.svg
 *        assets/project-pulseink-{light,dark}.svg
 *        assets/project-fdanet-{light,dark}.svg
 *
 * 改配色只动下面的 THEMES；改文案只动 HERO / PROJECTS。
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'assets')

const SANS = "Inter, 'Segoe UI', -apple-system, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif"
const MONO = "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', monospace"

/* ── 配色 ─────────────────────────────────────────────────────────────── */
const THEMES = {
  light: {
    surface1: '#F8FEFC', surface2: '#FFFFFF',
    grid: '#E7FAF2',
    ink: '#0F172A', body: '#3D4C5A', meta: '#64748B',
    accent: '#10B981', accentDeep: '#047857', accentSoft: '#6EE7B7',
    chipBg: '#ECFDF5', chipText: '#047857',
    card: '#FFFFFF', cardBorder: '#D1FAE5',
    blobAlpha: '0.30',
  },
  dark: {
    surface1: '#0B211C', surface2: '#071A16',
    grid: '#112E27',
    ink: '#EAF7F2', body: '#B9D6CC', meta: '#8FB3A9',
    accent: '#34D399', accentDeep: '#6EE7B7', accentSoft: '#047857',
    chipBg: '#0F2E26', chipText: '#6EE7B7',
    card: '#0B211C', cardBorder: '#14532D',
    blobAlpha: '0.22',
  },
}

/* ── 文案 ─────────────────────────────────────────────────────────────── */
const HERO = {
  kicker: '你好，我是',
  name: 'j11andme',
  tagline: 'Agent 应用工程 · 内容工作流 · 计算机视觉',
  meta: 'Java · Python · PyTorch · Vue · Docker',
  alt: 'j11andme — Agent 应用工程、内容工作流与计算机视觉',
  desc: '资料横幅：左侧姓名与方向，右侧同心信号环与脉冲核心。',
}

const PROJECTS = [
  {
    file: 'project-pulseink',
    index: '01',
    label: 'OPEN SOURCE · JAVA AGENT',
    title: 'PulseInk',
    lines: [
      '面向内容活动的 Java Agent 智能工作台：',
      '知识检索、多角色协作、人工审批、可解释评测。',
    ],
    tags: ['Java 21', 'Spring AI', 'Vue 3'],
    alt: 'PulseInk — 面向内容活动的 Java Agent 智能工作台',
  },
  {
    file: 'project-fdanet',
    index: '02',
    label: 'PAPER CODE · DOMAIN GENERALIZATION',
    title: 'FDA-Net',
    lines: [
      '水下目标检测域泛化：频域解耦与对齐，',
      '配套论文代码，S-UODAC2020 上取得 SOTA。',
    ],
    tags: ['PyTorch', 'MMDetection', 'YOLO11s'],
    alt: 'FDA-Net — 水下目标检测域泛化的频域对齐框架',
  },
]

/* ── 工具 ─────────────────────────────────────────────────────────────── */
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** 按字符视觉宽度估算文本像素宽度（CJK 记 1，其余记 0.55）。 */
const textWidth = (s, size) => {
  let units = 0
  for (const ch of s) units += /[\u2E80-\u9FFF\uFF00-\uFFEF]/.test(ch) ? 1 : 0.55
  return units * size
}

/** 等宽字体的宽度估算（SVG 里没有 textLength，只能自己算）。 */
const monoWidth = (s, size) => s.length * size * 0.62

const MOTION_CSS = `
    .halo { transform-box: fill-box; transform-origin: center; animation: halo 3.4s ease-in-out infinite; }
    .spin { transform-box: fill-box; transform-origin: center; animation: spin 24s linear infinite; }
    @keyframes halo { 0%, 100% { opacity: .14; transform: scale(1); } 50% { opacity: .36; transform: scale(1.55); } }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { .halo, .spin { animation: none !important; } }`

/* ── hero ─────────────────────────────────────────────────────────────── */
function hero(t, key) {
  const W = 1200, H = 300, CX = 990, CY = 150
  const node = (deg, r) => {
    const a = (deg * Math.PI) / 180
    return [CX + r * Math.cos(a), CY + r * Math.sin(a)]
  }
  const nodes = [150, 30, 270].map((d) => node(d, 96))
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t d">
  <title id="t">${esc(HERO.alt)}</title>
  <desc id="d">${esc(HERO.desc)}</desc>
  <defs>
    <linearGradient id="surface" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${t.surface1}" />
      <stop offset="1" stop-color="${t.surface2}" />
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${t.accentSoft}" />
      <stop offset="1" stop-color="${t.accent}" />
    </linearGradient>
    <radialGradient id="blob">
      <stop offset="0" stop-color="${t.accent}" stop-opacity="${t.blobAlpha}" />
      <stop offset="1" stop-color="${t.accent}" stop-opacity="0" />
    </radialGradient>
    <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
      <path d="M32 0H0V32" fill="none" stroke="${t.grid}" stroke-width="1" />
    </pattern>
    <clipPath id="frame"><rect width="${W}" height="${H}" rx="26" /></clipPath>
  </defs>
  <style>${MOTION_CSS}
  </style>
  <g clip-path="url(#frame)">
    <rect width="${W}" height="${H}" fill="url(#surface)" />
    <rect width="${W}" height="${H}" fill="url(#grid)" opacity="0.85" />
    <ellipse cx="${CX}" cy="118" rx="250" ry="200" fill="url(#blob)" />

    <text x="64" y="78" font-family="${MONO}" font-size="12" letter-spacing="3.2" fill="${t.accentDeep}">${esc(HERO.kicker)}</text>
    <text x="64" y="146" font-family="${SANS}" font-size="58" font-weight="700" letter-spacing="-0.5" fill="${t.ink}">${esc(HERO.name)}</text>
    <rect x="66" y="166" width="56" height="4" rx="2" fill="url(#accent)" />
    <text x="64" y="212" font-family="${SANS}" font-size="21" fill="${t.body}">${esc(HERO.tagline)}</text>
    <text x="64" y="248" font-family="${MONO}" font-size="13" fill="${t.meta}">${esc(HERO.meta)}</text>

    <g fill="none" stroke="${t.accent}">
      <circle cx="${CX}" cy="${CY}" r="52" stroke-width="1.6" opacity="0.5" />
      <circle cx="${CX}" cy="${CY}" r="96" stroke-width="1.4" opacity="0.3" />
      <circle cx="${CX}" cy="${CY}" r="140" stroke-width="1.2" opacity="0.15" />
    </g>
    <circle class="spin" cx="${CX}" cy="${CY}" r="118" fill="none" stroke="${t.accentSoft}"
            stroke-width="1.6" stroke-dasharray="5 12" stroke-linecap="round" opacity="0.55" />
    <g fill="${t.accent}">
      ${nodes.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" />`).join('\n      ')}
    </g>
    <circle class="halo" cx="${CX}" cy="${CY}" r="20" fill="${t.accent}" />
    <circle cx="${CX}" cy="${CY}" r="9" fill="url(#accent)" />
  </g>
  <rect x="0.75" y="0.75" width="${W - 1.5}" height="${H - 1.5}" rx="25" fill="none" stroke="${t.cardBorder}" stroke-width="1.5" />
</svg>
`
}

/* ── 项目卡 ───────────────────────────────────────────────────────────── */
/* ── 项目卡（按并排显示的实际尺寸 1:1 设计，字才不会缩成蚂蚁） ────────── */
function project(t, p) {
  const W = 440, H = 240
  let x = 28
  const pills = p.tags.map((tag) => {
    const w = Math.round(monoWidth(tag, 10.5) + 24)
    const pill = `<g>
      <rect x="${x}" y="180" width="${w}" height="24" rx="12" fill="${t.chipBg}" />
      <text x="${x + w / 2}" y="196" text-anchor="middle" font-family="${MONO}" font-size="10.5" fill="${t.chipText}">${esc(tag)}</text>
    </g>`
    x += w + 7
    return pill
  })
  const chipX = W - 28 - 26
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t d">
  <title id="t">${esc(p.alt)}</title>
  <desc id="d">项目卡片：编号 ${p.index}，${esc(p.title)}。</desc>
  <defs>
    <linearGradient id="bar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${t.accentSoft}" />
      <stop offset="1" stop-color="${t.accent}" />
    </linearGradient>
    <clipPath id="card"><rect width="${W}" height="${H}" rx="16" /></clipPath>
  </defs>
  <g clip-path="url(#card)">
    <rect width="${W}" height="${H}" fill="${t.card}" />
    <rect x="0" y="0" width="4" height="${H}" fill="url(#bar)" />
    <text x="28" y="42" font-family="${MONO}" font-size="10" letter-spacing="2" fill="${t.chipText}">${esc(p.label)}</text>
    <rect x="${chipX}" y="28" width="26" height="26" rx="8" fill="${t.chipBg}" />
    <text x="${chipX + 13}" y="46" text-anchor="middle" font-family="${MONO}" font-size="11.5" fill="${t.chipText}">${esc(p.index)}</text>
    <text x="28" y="98" font-family="${SANS}" font-size="24" font-weight="600" fill="${t.ink}">${esc(p.title)}</text>
    ${p.lines.map((line, i) => `<text x="28" y="${132 + i * 22}" font-family="${SANS}" font-size="12.5" fill="${t.body}">${esc(line)}</text>`).join('\n    ')}
    ${pills.join('\n    ')}
    <text x="${W - 28}" y="196" text-anchor="end" font-family="${MONO}" font-size="16" fill="${t.accent}">→</text>
  </g>
  <rect x="0.75" y="0.75" width="${W - 1.5}" height="${H - 1.5}" rx="15" fill="none" stroke="${t.cardBorder}" stroke-width="1.5" />
</svg>
`
}

/* ── 输出 ─────────────────────────────────────────────────────────────── */
mkdirSync(OUT, { recursive: true })
const written = []
for (const [key, t] of Object.entries(THEMES)) {
  written.push([`hero-${key}.svg`, hero(t, key)])
  for (const p of PROJECTS) written.push([`${p.file}-${key}.svg`, project(t, p)])
}
for (const [name, body] of written) {
  writeFileSync(join(OUT, name), body, 'utf8')
  console.log('wrote assets/' + name, body.length + 'B')
}
