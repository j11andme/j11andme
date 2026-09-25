/**
 * build-preview.mjs — 生成 preview/ 下的本地预览页，模拟 GitHub 的 README 渲染。
 * 仅用于本地看效果；GitHub 上的真实渲染以 README.md + assets/ 为准。
 *
 * 用法： node tools/build-preview.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import http from 'node:http'
import tls from 'node:tls'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PV = join(ROOT, 'preview')
const BADGES = join(PV, 'badges')
mkdirSync(BADGES, { recursive: true })

const MONO_FAMILY = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace'
const SANS_FAMILY = 'Inter, "Segoe UI", -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif'

/* ── 徽章：与 README 完全一致的 URL ──────────────────────────────────── */
const BADGE_URLS = {
  'java.svg': 'https://img.shields.io/badge/JAVA-047857?style=for-the-badge&logo=openjdk&logoColor=FFFFFF',
  'python.svg': 'https://img.shields.io/badge/PYTHON-047857?style=for-the-badge&logo=python&logoColor=FFFFFF',
  'pytorch.svg': 'https://img.shields.io/badge/PYTORCH-047857?style=for-the-badge&logo=pytorch&logoColor=FFFFFF',
  'spring.svg': 'https://img.shields.io/badge/SPRING-047857?style=for-the-badge&logo=springboot&logoColor=FFFFFF',
  'vue.svg': 'https://img.shields.io/badge/VUE-047857?style=for-the-badge&logo=vuedotjs&logoColor=FFFFFF',
  'docker.svg': 'https://img.shields.io/badge/DOCKER-047857?style=for-the-badge&logo=docker&logoColor=FFFFFF',
  'stars-pulseink.svg': 'https://img.shields.io/github/stars/j11andme/pulseink?style=flat-square&label=%E2%98%85&labelColor=047857&color=10B981',
  'stars-fdanet.svg': 'https://img.shields.io/github/stars/j11andme/FDA-Net?style=flat-square&label=%E2%98%85&labelColor=047857&color=10B981',
}

const PROXY = { host: '127.0.0.1', port: 7892 }

/** 经本地 HTTP 代理建 CONNECT 隧道取回二进制（直连不稳时用）。 */
const viaProxy = (url) => new Promise((resolve, reject) => {
  const u = new URL(url)
  const req = http.request({ host: PROXY.host, port: PROXY.port, method: 'CONNECT', path: `${u.hostname}:443`, headers: { Host: `${u.hostname}:443` } })
  req.setTimeout(20000, () => req.destroy(new Error('proxy timeout')))
  req.on('connect', (res, socket) => {
    if (res.statusCode !== 200) return reject(new Error('CONNECT ' + res.statusCode))
    const t = tls.connect({ socket, servername: u.hostname }, () => {
      t.write(`GET ${u.pathname}${u.search} HTTP/1.1\r\nHost: ${u.hostname}\r\nUser-Agent: Mozilla/5.0 dsh\r\nAccept: image/svg+xml,*/*\r\nConnection: close\r\n\r\n`)
    })
    t.setTimeout(20000, () => t.destroy(new Error('tls timeout')))
    const chunks = []
    t.on('data', (c) => chunks.push(c))
    t.on('end', () => {
      const raw = Buffer.concat(chunks)
      const head = raw.subarray(0, raw.indexOf('\r\n\r\n')).toString('latin1')
      if (!/^HTTP\/1\.[01] 200/.test(head)) return reject(new Error(head.split('\r\n')[0]))
      let body = raw.subarray(raw.indexOf('\r\n\r\n') + 4)
      if (/transfer-encoding: chunked/i.test(head)) {
        const out = []
        let rest = body
        for (;;) {
          const nl = rest.indexOf('\r\n')
          if (nl < 0) break
          const size = parseInt(rest.subarray(0, nl).toString('latin1'), 16)
          if (!size) break
          out.push(rest.subarray(nl + 2, nl + 2 + size))
          rest = rest.subarray(nl + 2 + size + 2)
        }
        body = Buffer.concat(out)
      }
      resolve(body)
    })
    t.on('error', reject)
  })
  req.on('error', reject)
  req.end()
})

const looksLikeSvg = (buf) => buf && buf.length > 200 && buf.subarray(0, 400).toString('utf8').includes('<svg')

const download = async (url, dest) => {
  const attempts = [
    async () => Buffer.from(await (await fetch(url, { signal: AbortSignal.timeout(12000) })).arrayBuffer()),
    () => viaProxy(url),
    async () => Buffer.from(await (await fetch(url, { signal: AbortSignal.timeout(15000) })).arrayBuffer()),
    () => viaProxy(url),
  ]
  for (const attempt of attempts) {
    try {
      const buf = await attempt()
      if (looksLikeSvg(buf)) { writeFileSync(dest, buf); return true }
    } catch { /* next */ }
  }
  return false
}

/* ── 贡献图（真实数据由 Action 生成，这里只是示意图） ────────────────── */
const mulberry = (seed) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

function mockSnake(dark) {
  const COLS = 34, ROWS = 7, CELL = 12, GAP = 4, PAD = 8
  const scale = dark
    ? ['#0F2E26', '#14532D', '#047857', '#10B981', '#6EE7B7']
    : ['#ECFDF5', '#D1FAE5', '#A7F3D0', '#6EE7B7', '#34D399']
  const rand = mulberry(20260924)
  const W = PAD * 2 + COLS * (CELL + GAP) - GAP
  const H = PAD * 2 + ROWS * (CELL + GAP) - GAP
  let cells = ''
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const v = rand()
      const level = v > 0.86 ? 4 : v > 0.68 ? 3 : v > 0.45 ? 2 : v > 0.22 ? 1 : 0
      cells += `  <rect x="${PAD + c * (CELL + GAP)}" y="${PAD + r * (CELL + GAP)}" width="${CELL}" height="${CELL}" rx="3" fill="${scale[level]}" />\n`
    }
  }
  const y = (r) => PAD + r * (CELL + GAP) + CELL / 2
  const x = (c) => PAD + c * (CELL + GAP) + CELL / 2
  const path = `M ${x(2)} ${y(5)} L ${x(7)} ${y(5)} L ${x(7)} ${y(2)} L ${x(13)} ${y(2)} L ${x(13)} ${y(4)} L ${x(19)} ${y(4)} L ${x(19)} ${y(1)} L ${x(26)} ${y(1)}`
  const snakeColor = dark ? '#34D399' : '#10B981'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="贡献活跃度示意图">
${cells}  <path d="${path}" fill="none" stroke="${snakeColor}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.9" />
</svg>
`
}

/* ── 页面 ─────────────────────────────────────────────────────────────── */
const page = (dark) => {
  const k = dark ? 'dark' : 'light'
  const c = dark
    ? { bg: '#0d1117', fg: '#f0f6fc', muted: '#8b949e', link: '#4493f8', hr: '#3d444d', code: 'rgba(110,118,129,0.4)', border: '#30363d', chip: '#161b22' }
    : { bg: '#ffffff', fg: '#1f2328', muted: '#59636e', link: '#0969da', hr: '#d1d9e0', code: 'rgba(175,184,193,0.2)', border: '#d1d9e0', chip: '#f6f8fa' }
  const badge = (name, alt) => `<img class="badge" src="./badges/${name}" alt="${alt}" height="28" />`
  return `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8" />
<title>README 预览（${k}）</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; background: ${c.bg}; color: ${c.fg}; font-family: ${SANS_FAMILY}; font-size: 16px; line-height: 1.5; }
  .wrap { width: 944px; margin: 0 auto; padding: 20px 32px 48px; }
  .topbar { display: flex; align-items: center; gap: 8px; padding: 10px 16px; border: 1px solid ${c.border}; border-radius: 10px; color: ${c.muted}; font-size: 13px; margin-bottom: 22px; }
  .dot { width: 9px; height: 9px; border-radius: 50%; background: #10B981; }
  .who { display: flex; align-items: center; gap: 16px; margin-bottom: 26px; }
  .avatar { width: 84px; height: 84px; border-radius: 50%; background: linear-gradient(135deg, #10B981, #047857); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 34px; font-weight: 700; }
  .name { font-size: 26px; font-weight: 600; letter-spacing: -0.3px; }
  .login { color: ${c.muted}; font-size: 19px; font-weight: 300; }
  .bio { color: ${c.fg}; font-size: 15px; margin-top: 4px; }
  .md h3 { font-size: 1.15em; font-weight: 600; margin: 26px 0 14px; }
  .md p { margin: 0 0 16px; }
  .md a { color: ${c.link}; text-decoration: none; }
  .md a:hover { text-decoration: underline; }
  .md code { font-family: ${MONO_FAMILY}; font-size: 85%; background: ${c.code}; border-radius: 6px; padding: .2em .4em; }
  .md hr { border: 0; border-top: 1px solid ${c.hr}; margin: 24px 0; }
  .center { text-align: center; }
  .badges img { margin: 2px 3px; vertical-align: middle; }
  .shots img { display: block; width: 100%; margin: 0 0 18px; }
  .stack { margin-bottom: 16px; }
  .foot { color: ${c.muted}; font-size: 14px; margin-top: 10px; }
  .snakebox { border: 1px solid ${c.border}; border-radius: 12px; padding: 16px 18px; background: ${c.chip}; }
  .note { color: ${c.muted}; font-size: 12px; margin-top: 8px; }
</style></head>
<body><div class="wrap">
  <div class="topbar"><span class="dot"></span> github.com/j11andme — 个人主页 README 预览（${k === 'dark' ? '深色' : '浅色'}模式）</div>

  <div class="who">
    <div class="avatar">j</div>
    <div>
      <div><span class="name">j11andme</span> <span class="login">j11andme</span></div>
      <div class="bio">Agent 应用工程 · 内容工作流 · 计算机视觉（bio 为建议文案，可在主页右侧改）</div>
    </div>
  </div>

  <div class="md">
    <div class="center">
      <div class="shots"><img src="../assets/hero-${k}.svg" alt="j11andme — Agent 应用工程、内容工作流与计算机视觉" /></div>
      <p class="badges">${badge('java.svg', 'Java')} ${badge('python.svg', 'Python')} ${badge('pytorch.svg', 'PyTorch')} ${badge('spring.svg', 'Spring')} ${badge('vue.svg', 'Vue')} ${badge('docker.svg', 'Docker')}</p>
      <p><strong>现在在做：</strong>把内容活动工作流做成可用的 Agent 工坊（<a href="#">PulseInk</a>），以及把论文里的频域对齐方法开源出来（<a href="#">FDA-Net</a>）。</p>
      <p><a href="#">Repositories</a> · <a href="#">Email</a></p>
    </div>

    <hr />

    <h3><code>// SELECTED_WORK</code> · 精选项目</h3>
    <div class="shots">
      <a href="#"><img src="../assets/project-pulseink-${k}.svg" alt="PulseInk — 面向内容活动的 Java Agent 智能工作台" /></a>
      <p class="stack"><code>Java 21</code> <code>Spring AI</code> <code>Vue 3</code> &nbsp; <a href="#">Repository</a> · <a href="#">Releases</a> ${badge('stars-pulseink.svg', 'Stars')}</p>
      <a href="#"><img src="../assets/project-fdanet-${k}.svg" alt="FDA-Net — 水下目标检测域泛化的频域对齐框架" /></a>
      <p class="stack"><code>PyTorch</code> <code>MMDetection</code> <code>YOLO11s</code> &nbsp; <a href="#">Repository</a> · <a href="#">Paper code</a> ${badge('stars-fdanet.svg', 'Stars')}</p>
    </div>

    <hr />

    <h3><code>// ACTIVITY</code> · 贡献信号</h3>
    <div class="snakebox">
      <img src="./mock-snake-${k}.svg" alt="贡献活跃度" style="width:100%" />
      <div class="note">此处为示意图；上线后由 GitHub Action 每天生成真实贡献蛇。</div>
    </div>

    <div class="center foot"><br /><a href="#">聊聊 →</a></div>
  </div>
</div></body></html>
`
}

/* ── 执行 ─────────────────────────────────────────────────────────────── */
let ok = 0, fail = 0
for (const [name, url] of Object.entries(BADGE_URLS)) {
  const good = await download(url, join(BADGES, name))
  good ? ok++ : fail++
  if (!good) console.log('badge FAILED:', name, url)
}
console.log(`badges: ${ok} ok, ${fail} failed`)

for (const dark of [false, true]) {
  const k = dark ? 'dark' : 'light'
  writeFileSync(join(PV, `mock-snake-${k}.svg`), mockSnake(dark), 'utf8')
  writeFileSync(join(PV, `preview-${k}.html`), page(dark), 'utf8')
  console.log('wrote preview/preview-' + k + '.html')
}
