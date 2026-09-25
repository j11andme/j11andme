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
    track: '#DCF6EA',
    seal: '#C1352B',
    shadow: '#0F172A',
    // [颜色, 不透明度, cx, cy, rx, ry]
    mesh: [
      ['#6EE7B7', 0.88, 1030, 0, 400, 280],
      ['#34D399', 0.70, 1190, 250, 340, 240],
      ['#2DD4BF', 0.55, 660, 300, 360, 230],
      ['#A7F3D0', 0.82, 880, 90, 300, 210],
    ],
    // 极光光束：[颜色, 不透明度, cx, cy, 宽, 高, 旋转角]
    beams: [
      ['#6EE7B7', 0.78, 950, 40, 1040, 130, -17],
      ['#2DD4BF', 0.58, 1080, 250, 920, 110, -13],
      ['#A7F3D0', 0.70, 820, 150, 860, 90, -20],
    ],
  },
  dark: {
    surface1: '#0B211C', surface2: '#071A16',
    grid: '#112E27',
    ink: '#EAF7F2', body: '#B9D6CC', meta: '#8FB3A9',
    accent: '#34D399', accentDeep: '#6EE7B7', accentSoft: '#047857',
    chipBg: '#0F2E26', chipText: '#6EE7B7',
    card: '#0B211C', cardBorder: '#14532D',
    track: '#123A2F',
    seal: '#E0685E',
    shadow: '#E6F4EF',
    mesh: [
      ['#10B981', 0.46, 1030, 0, 400, 280],
      ['#047857', 0.62, 1190, 250, 340, 240],
      ['#0D9488', 0.42, 660, 300, 360, 230],
      ['#065F46', 0.74, 880, 90, 300, 210],
    ],
    beams: [
      ['#10B981', 0.44, 950, 40, 1040, 130, -17],
      ['#0D9488', 0.36, 1080, 250, 920, 110, -13],
      ['#34D399', 0.26, 820, 150, 860, 90, -20],
    ],
  },
}

/* ── 文案 ─────────────────────────────────────────────────────────────── */
const HERO = {
  kicker: '你好，我是',
  name: 'j11andme',
  tagline: 'Agent 应用工程 · 内容工作流 · 计算机视觉',
  meta: 'Java · Python · PyTorch · Vue · Docker',
  alt: 'j11andme — Agent 应用工程、内容工作流与计算机视觉',
  desc: '资料横幅：左侧姓名与技术方向，右侧为青绿柔光色团背景，色团缓慢漂移。',
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

/* 自我介绍卡：内容为虚构的戏谑版，不含真实个人信息 */
const INTRO = {
  handle: '@j11andme',
  role: 'Agent 玩家 · 后端开发',
  score: '8.5',
  scoreUnit: '/ 10 · 自评',
  stamp: '成分表：纯路人',
  egg: '1-16',
  // [图标, 名称, 格数]
  metrics: [
    ['server', '后端开发', 8], ['agent', 'Agent', 7],
    ['chat', '和美女聊天', 10], ['gym', '健身', 9],
    ['fish', '摸鱼', 6], ['moon', '早睡', 1],
  ],
  alt: 'j11andme 的成分表卡片：后端开发 8 格、Agent 7 格、和美女聊天 10 格、健身 9 格、摸鱼 6 格、早睡 1 格，盖有「成分表：纯路人」印章',
}

/* 自评条用的小图标：15×15 线性图标，描边走主色 */
const ICONS = {
  server: '<rect x="1" y="1.6" width="12" height="4.6" rx="1.6" /><rect x="1" y="7.8" width="12" height="4.6" rx="1.6" />',
  agent: '<rect x="1.6" y="3.6" width="10.8" height="9" rx="3" /><path d="M7 3.6V1.2" /><circle cx="5.4" cy="8" r="0.85" /><circle cx="8.6" cy="8" r="0.85" />',
  chat: '<rect x="0.9" y="2.4" width="12.2" height="8.2" rx="2.6" /><path d="M4.2 10.6V13l3.1-2.4" />',
  gym: '<path d="M4.8 7h4.4" /><rect x="0.8" y="4" width="2.6" height="6" rx="1.1" /><rect x="10.6" y="4" width="2.6" height="6" rx="1.1" />',
  fish: '<ellipse cx="5.8" cy="7" rx="4.7" ry="2.9" /><path d="M10.4 7l3-2.4v4.8z" />',
  moon: '<path d="M11.4 9.4A5.4 5.4 0 0 1 4.6 2.6a5.4 5.4 0 1 0 6.8 6.8z" />',
}

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
    .drift { animation: drift 34s ease-in-out infinite alternate; }
    .drift-b { animation-duration: 46s; animation-direction: alternate-reverse; }
    .drift-c { animation-duration: 58s; }
    @keyframes drift { from { transform: translate(0px, 0px); } to { transform: translate(-28px, 20px); } }
    .beam { animation: sway 40s ease-in-out infinite alternate; }
    .beam-b { animation-duration: 54s; animation-direction: alternate-reverse; }
    .beam-c { animation-duration: 66s; }
    @keyframes sway { from { transform: translateX(-34px); } to { transform: translateX(38px); } }
    .pt { animation-name: rise; animation-timing-function: linear; animation-iteration-count: infinite; }
    @keyframes rise {
      0% { transform: translateY(18px); opacity: 0; }
      22% { opacity: .8; }
      72% { opacity: .45; }
      100% { transform: translateY(-48px); opacity: 0; }
    }
    .cell { animation-name: cellOn; animation-timing-function: ease-in-out; animation-iteration-count: infinite; opacity: 0; }
    @keyframes cellOn { 0%, 100% { opacity: 0; } 42%, 58% { opacity: .22; } }
    .flow { animation-name: flowX; animation-timing-function: linear; animation-iteration-count: infinite; opacity: 0; }
    .flow-y { animation-name: flowY; }
    @keyframes flowX {
      0% { transform: translateX(-96px); opacity: 0; }
      14% { opacity: .9; }
      86% { opacity: .9; }
      100% { transform: translateX(96px); opacity: 0; }
    }
    @keyframes flowY {
      0% { transform: translateY(-64px); opacity: 0; }
      16% { opacity: .85; }
      84% { opacity: .85; }
      100% { transform: translateY(64px); opacity: 0; }
    }
    @media (prefers-reduced-motion: reduce) { .drift, .beam, .pt, .cell, .flow { animation: none !important; } }`

/* 固定种子，保证每次生成结果一致 */
const makeRnd = (seed) => () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff
  return seed / 0x7fffffff
}

/* 随机点亮的网格单元（只在右半区，避免干扰左侧文字） */
const GRID_CELLS = (() => {
  const r = makeRnd(20260925)
  return Array.from({ length: 24 }, () => ({
    x: (18 + Math.floor(r() * 19)) * 32,
    y: Math.floor(r() * 8) * 32,
    dur: (6 + r() * 9).toFixed(1),
    delay: (r() * 15).toFixed(1),
  }))
})()

/* 沿网格线流动的点：[x, y, 方向] */
const GRID_FLOWS = [
  [608, 32, 'x'], [768, 96, 'x'], [928, 160, 'x'], [1088, 224, 'x'],
  [672, 192, 'x'], [1152, 64, 'y'], [1024, 128, 'y'], [832, 224, 'y'],
]

/* ── hero：柔光色团背景（mesh gradient）+ 左侧文字 ────────────────────── */
function hero(t) {
  const W = 1200, H = 272

  // 色团：[颜色, 不透明度, cx, cy, rx, ry]
  const mesh = t.mesh
  const blobs = mesh.map(([color, alpha, cx, cy, rx, ry], i) => `
    <radialGradient id="m${i}">
      <stop offset="0" stop-color="${color}" stop-opacity="${alpha}" />
      <stop offset="0.55" stop-color="${color}" stop-opacity="${(alpha * 0.45).toFixed(3)}" />
      <stop offset="1" stop-color="${color}" stop-opacity="0" />
    </radialGradient>`).join('')

  const shapes = mesh.map(([, , cx, cy, rx, ry], i) =>
    `<ellipse class="drift${i === 1 ? ' drift-b' : i === 2 ? ' drift-c' : ''}" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#m${i})" />`).join('\n    ')

  // 极光光束：左端透明 → 中间最亮 → 右端透明，整条斜着扫过
  const beamGrads = t.beams.map(([color, alpha], i) => `
    <linearGradient id="beam${i}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${color}" stop-opacity="0" />
      <stop offset="0.5" stop-color="${color}" stop-opacity="${alpha}" />
      <stop offset="1" stop-color="${color}" stop-opacity="0" />
    </linearGradient>`).join('')
  const beams = t.beams.map(([, , cx, cy, w, h, rot], i) =>
    `<g transform="rotate(${rot} ${cx} ${cy})"><g class="beam${i === 1 ? ' beam-b' : i === 2 ? ' beam-c' : ''}"><rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" fill="url(#beam${i})" /></g></g>`).join('\n    ')

  // 漂浮微粒：只在右半区，避免干扰左侧文字
  const DOTS = [
    [672, 214, 2.6, 0.55, 17, 0], [716, 96, 1.8, 0.42, 21, 3.5], [758, 258, 2.2, 0.5, 15, 7],
    [802, 148, 1.6, 0.36, 23, 1.5], [846, 62, 2.8, 0.58, 19, 9], [890, 232, 1.9, 0.4, 16, 5],
    [934, 118, 2.4, 0.5, 22, 11], [978, 268, 1.7, 0.34, 18, 2.5], [1022, 74, 2.1, 0.46, 20, 8],
    [1066, 196, 1.5, 0.32, 24, 13], [1110, 128, 2.6, 0.52, 17, 4.5], [1152, 246, 1.8, 0.38, 21, 6.5],
    [900, 30, 1.4, 0.3, 25, 12], [1160, 58, 2.0, 0.44, 19, 10],
  ]
  const dots = DOTS.map(([x, y, r, o, dur, delay]) =>
    `<circle class="pt" cx="${x}" cy="${y}" r="${r}" fill="${t.accent}" opacity="${o}" style="animation-duration:${dur}s;animation-delay:${delay}s" />`).join('\n    ')

  // 随机点亮的网格单元 + 沿网格线流动的点
  const cells = GRID_CELLS.map(({ x, y, dur, delay }) =>
    `<rect class="cell" x="${x + 1}" y="${y + 1}" width="30" height="30" rx="5" fill="${t.accent}" style="animation-duration:${dur}s;animation-delay:${delay}s" />`).join('\n    ')
  const flows = GRID_FLOWS.map(([x, y, dir], i) =>
    `<circle class="flow${dir === 'y' ? ' flow-y' : ''}" cx="${x}" cy="${y}" r="2.4" fill="${t.accent}" style="animation-duration:${(9 + i * 1.3).toFixed(1)}s;animation-delay:${(i * 0.9).toFixed(1)}s" />`).join('\n    ')

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
    <linearGradient id="fade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${t.surface2}" stop-opacity="0.97" />
      <stop offset="0.40" stop-color="${t.surface2}" stop-opacity="0.62" />
      <stop offset="0.74" stop-color="${t.surface2}" stop-opacity="0" />
    </linearGradient>
    <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
      <path d="M32 0H0V32" fill="none" stroke="${t.grid}" stroke-width="1" />
    </pattern>
    <clipPath id="frame"><rect width="${W}" height="${H}" rx="26" /></clipPath>${blobs}${beamGrads}
  </defs>
  <style>${MOTION_CSS}
  </style>
  <g clip-path="url(#frame)">
    <rect width="${W}" height="${H}" fill="url(#surface)" />
    ${shapes}
    ${beams}
    <rect width="${W}" height="${H}" fill="url(#grid)" opacity="0.45" />
    <rect width="${W}" height="${H}" fill="url(#fade)" />
    ${cells}
    ${flows}
    ${dots}

    <text x="64" y="66" font-family="${MONO}" font-size="12" letter-spacing="3.2" fill="${t.accentDeep}">${esc(HERO.kicker)}</text>
    <text x="64" y="134" font-family="${SANS}" font-size="58" font-weight="700" letter-spacing="-0.5" fill="${t.ink}">${esc(HERO.name)}</text>
    <rect x="66" y="154" width="56" height="4" rx="2" fill="url(#accent)" />
    <text x="64" y="200" font-family="${SANS}" font-size="21" fill="${t.body}">${esc(HERO.tagline)}</text>
    <text x="64" y="236" font-family="${MONO}" font-size="13" fill="${t.meta}">${esc(HERO.meta)}</text>
  </g>
  <rect x="0.75" y="0.75" width="${W - 1.5}" height="${H - 1.5}" rx="25" fill="none" stroke="${t.cardBorder}" stroke-width="1.5" />
</svg>
`
}

/* ── 项目卡 ───────────────────────────────────────────────────────────── */
/* ── 项目卡（按并排显示的实际尺寸 1:1 设计，字才不会缩成蚂蚁） ────────── */
function project(t, p) {
  const W = 440, H = 210
  let x = 28
  const pills = p.tags.map((tag) => {
    const w = Math.round(monoWidth(tag, 10.5) + 24)
    const pill = `<g>
      <rect x="${x}" y="164" width="${w}" height="24" rx="12" fill="${t.chipBg}" />
      <text x="${x + w / 2}" y="180" text-anchor="middle" font-family="${MONO}" font-size="10.5" fill="${t.chipText}">${esc(tag)}</text>
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
    <text x="28" y="38" font-family="${MONO}" font-size="10" letter-spacing="2" fill="${t.chipText}">${esc(p.label)}</text>
    <rect x="${chipX}" y="22" width="26" height="26" rx="8" fill="${t.chipBg}" />
    <text x="${chipX + 13}" y="40" text-anchor="middle" font-family="${MONO}" font-size="11.5" fill="${t.chipText}">${esc(p.index)}</text>
    <text x="28" y="90" font-family="${SANS}" font-size="24" font-weight="600" fill="${t.ink}">${esc(p.title)}</text>
    ${p.lines.map((line, i) => `<text x="28" y="${122 + i * 22}" font-family="${SANS}" font-size="12.5" fill="${t.body}">${esc(line)}</text>`).join('\n    ')}
    ${pills.join('\n    ')}
    <text x="${W - 28}" y="182" text-anchor="end" font-family="${MONO}" font-size="16" fill="${t.accent}">→</text>
  </g>
  <rect x="0.75" y="0.75" width="${W - 1.5}" height="${H - 1.5}" rx="15" fill="none" stroke="${t.cardBorder}" stroke-width="1.5" />
</svg>
`
}

/* ── 自我介绍卡（成分表 + 闪电阴影 + 居中印章）──────────────────────── */
function intro(t) {
  const W = 900, H = 296
  const p = INTRO
  const cols = [52, 470], rows = [160, 204, 248]
  const SEG_W = 20, SEG_GAP = 4, SEG_X = 112

  const bars = p.metrics.map(([icon, label, n], i) => {
    const x = cols[i % 2], y = rows[Math.floor(i / 2)]
    let cells = ''
    for (let k = 0; k < 10; k++) {
      const fill = k < n ? 'url(#seg)' : t.track
      cells += `<rect x="${x + SEG_X + k * (SEG_W + SEG_GAP)}" y="${y - 6}" width="${SEG_W}" height="12" rx="3.5" fill="${fill}" />`
    }
    return `<g transform="translate(${x} ${y - 11})" fill="none" stroke="${t.accent}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" opacity="0.85">${ICONS[icon]}</g>
    <text x="${x + 22}" y="${y}" font-family="${SANS}" font-size="12" fill="${t.body}">${esc(label)}</text>${cells}
    <text x="${x + SEG_X + 10 * (SEG_W + SEG_GAP) + 6}" y="${y + 1}" font-family="${MONO}" font-size="10" fill="${t.meta}" opacity="0.75">${n}</text>`
  }).join('\n    ')

  const SEAL_FONT = "'SimSun', 'Songti SC', 'STSong', 'Noto Serif CJK SC', serif"
  const stampW = Math.round(p.stamp.length * 22 * 0.92 + 40)
  const stampX = 390, stampY = 250

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t d">
  <title id="t">${esc(p.alt)}</title>
  <desc id="d">自我介绍卡片：${esc(p.handle)}，${esc(p.role)}，含六项自评条、闪电阴影背景与一枚印章。</desc>
  <defs>
    <linearGradient id="ava" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${t.accentSoft}" />
      <stop offset="1" stop-color="${t.accentDeep}" />
    </linearGradient>
    <linearGradient id="seg" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${t.accentDeep}" />
      <stop offset="1" stop-color="${t.accent}" />
    </linearGradient>
    <filter id="ink" x="-14%" y="-22%" width="128%" height="144%">
      <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="3" seed="7" result="noise" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.2" xChannelSelector="R" yChannelSelector="G" />
    </filter>
    <clipPath id="card"><rect width="${W}" height="${H}" rx="16" /></clipPath>
  </defs>
  <g clip-path="url(#card)">
    <rect width="${W}" height="${H}" fill="${t.card}" />

    <path d="M55,0 L10,80 L40,80 L22,150 L78,62 L46,62 L74,0 Z" transform="translate(560 0) scale(2.8 2.15)"
          fill="${t.shadow}" opacity="0.055" />

    <circle cx="52" cy="50" r="24" fill="url(#ava)" />
    <text x="52" y="59" text-anchor="middle" font-family="${SANS}" font-size="22" font-weight="700" fill="#FFFFFF">j</text>
    <text x="88" y="42" font-family="${SANS}" font-size="19" font-weight="600" fill="${t.ink}">${esc(p.handle)}</text>
    <text x="88" y="64" font-family="${SANS}" font-size="12.5" fill="${t.meta}">${esc(p.role)}</text>

    <text x="${W - 52}" y="60" text-anchor="end" font-family="${SANS}" font-size="40" font-weight="700" letter-spacing="-1" fill="${t.ink}">${esc(p.score)}</text>
    <text x="${W - 52}" y="78" text-anchor="end" font-family="${SANS}" font-size="11" fill="${t.meta}">${esc(p.scoreUnit)}</text>

    <line x1="52" y1="94" x2="${W - 52}" y2="94" stroke="${t.cardBorder}" stroke-width="1" />

    <g transform="rotate(-4 ${stampX} ${stampY})" opacity="0.9" filter="url(#ink)">
      <rect x="${stampX - stampW / 2}" y="${stampY - 31}" width="${stampW}" height="62" rx="6" fill="none" stroke="${t.seal}" stroke-width="3.5" />
      <rect x="${stampX - stampW / 2 + 6}" y="${stampY - 25}" width="${stampW - 12}" height="50" rx="3" fill="none" stroke="${t.seal}" stroke-width="1" />
      <text x="${stampX}" y="${stampY + 8}" text-anchor="middle" font-family="${SEAL_FONT}" font-size="22" font-weight="700" fill="${t.seal}">${esc(p.stamp)}</text>
    </g>

    ${bars}

    <text x="${W - 24}" y="${H - 14}" text-anchor="end" font-family="${MONO}" font-size="9" fill="${t.meta}" opacity="0.55">${esc(p.egg)}</text>
  </g>
  <rect x="0.75" y="0.75" width="${W - 1.5}" height="${H - 1.5}" rx="15" fill="none" stroke="${t.cardBorder}" stroke-width="1.5" />
</svg>
`
}

/* ── 输出 ─────────────────────────────────────────────────────────────── */
mkdirSync(OUT, { recursive: true })
const written = []
for (const [key, t] of Object.entries(THEMES)) {
  written.push([`hero-${key}.svg`, hero(t)])
  written.push([`intro-card-${key}.svg`, intro(t)])
  for (const p of PROJECTS) written.push([`${p.file}-${key}.svg`, project(t, p)])
}
for (const [name, body] of written) {
  writeFileSync(join(OUT, name), body, 'utf8')
  console.log('wrote assets/' + name, body.length + 'B')
}
