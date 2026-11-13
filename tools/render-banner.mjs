#!/usr/bin/env node
// Draws assets/banner.jpg, the banner at the top of the studio's GitHub profile, the way the
// studio's own link card is drawn: the home painting, the shield, Sora and Inter, laid out in
// Chromium at 1280x400 and photographed at twice that size.
//
//   node tools/render-banner.mjs <the studio website's folder>
//   CHROME_PATH=/usr/bin/chromium node tools/render-banner.mjs ...   # a Chromium of your own
//
// The website's folder gives the painting (scripts/page-cards/art/home.webp), the shield's paths
// (src/components/brand/Logo.tsx) and the typefaces (src/fonts), so the banner follows the site.
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL, fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const site = resolve(process.argv[2] ?? "");
if (!process.argv[2]) throw new Error("usage: node tools/render-banner.mjs <the studio website's folder>");
const here = dirname(dirname(fileURLToPath(import.meta.url)));
const { chromium } = createRequire(join(site, "package.json"))("playwright");

const url = (p) => pathToFileURL(join(site, p)).href;
const logo = readFileSync(join(site, "src/components/brand/Logo.tsx"), "utf8");
const [FIELD, RIM, EDGE, HILL, STAR] = [...logo.matchAll(/\bd="([^"]+)"/g)].map((m) => m[1]);
if (!STAR) throw new Error("Logo.tsx no longer draws the shield this script expects");
const MARK = `<svg viewBox="6.5 7 87 87" width="100%" height="100%" fill="none"><defs><clipPath id="f"><path d="${FIELD}"/></clipPath></defs>
<path d="${RIM}" fill="#e8a13a"/><path d="${EDGE}" fill="#15110e"/><path d="${HILL}" fill="#b3471f" clip-path="url(#f)"/>
<path d="${STAR}" fill="#e8a13a"/></svg>`;

const W = 1280, H = 400;
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: Sora; src: url(${url("src/fonts/sora-variable.woff2")}) format("woff2"); font-weight: 100 900; }
@font-face { font-family: Inter; src: url(${url("src/fonts/inter-variable.woff2")}) format("woff2"); font-weight: 100 900; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: #0a0807; }
.card { position: relative; width: 100%; height: 100%; overflow: hidden; font-family: Inter, sans-serif; color: #f5ecd9; }
.art { position: absolute; inset: 0; background: url(${url("scripts/page-cards/art/home.webp")}) right 0 top 22% / 860px auto no-repeat; }
.scrim { position: absolute; inset: 0; background:
  linear-gradient(90deg, rgba(10,8,7,1) 0%, rgba(10,8,7,1) 38%, rgba(10,8,7,.82) 47%, rgba(10,8,7,.25) 62%, rgba(10,8,7,0) 74%),
  linear-gradient(0deg, rgba(10,8,7,.55) 0%, rgba(10,8,7,0) 30%),
  linear-gradient(180deg, rgba(10,8,7,.45) 0%, rgba(10,8,7,0) 26%); }
.glow { position: absolute; left: -180px; bottom: -260px; width: 820px; height: 560px;
  background: radial-gradient(closest-side, rgba(212,132,42,.16), rgba(212,132,42,0)); }
.frame { position: absolute; inset: 14px; border-radius: 20px; border: 1px solid rgba(236,190,91,.26); }
.copy { position: absolute; left: 64px; top: 0; bottom: 0; width: 640px; display: flex; flex-direction: column; justify-content: center; }
.top { display: flex; align-items: center; gap: 16px; margin-bottom: 18px; }
.mark { width: 44px; height: 44px; filter: drop-shadow(0 6px 14px rgba(0,0,0,.5)); }
.kicker { display: flex; align-items: center; gap: 14px; font-family: Sora; font-weight: 600; font-size: 14px; letter-spacing: .28em; text-transform: uppercase; color: #ecbe5b; }
.kicker::before { content: ""; width: 32px; height: 2px; border-radius: 2px; background: linear-gradient(90deg, #f3d693, #b3661f); }
h1 { font-family: Sora; font-weight: 800; font-size: 66px; line-height: .98; letter-spacing: -.025em; color: #fdf6e8; text-shadow: 0 2px 24px rgba(0,0,0,.55); }
h1 em { font-style: normal; background: linear-gradient(180deg, #faecc9 0%, #ecbe5b 55%, #d4842a 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }
p { margin-top: 16px; max-width: 560px; font-size: 22px; line-height: 1.36; font-weight: 450; color: rgba(250,236,201,.88); text-wrap: pretty; }
.foot { margin-top: 18px; display: flex; align-items: center; gap: 10px; font-family: Sora; font-weight: 600; font-size: 14px; letter-spacing: .12em; color: rgba(236,190,91,.8); }
.foot svg { width: 12px; height: 12px; }
</style></head><body><div class="card">
<div class="art"></div><div class="scrim"></div><div class="glow"></div><div class="frame"></div>
<div class="copy">
  <div class="top"><div class="mark">${MARK}</div><div class="kicker">Independent game studio</div></div>
  <h1>Liberty Hill<br><em>Studios</em></h1>
  <p>Independent games, built in the open with the crew who play them.</p>
  <div class="foot"><svg viewBox="0 0 24 24"><path d="M12 2l3.1 6.6 7.2.9-5.3 5 1.4 7.1L12 18.2l-6.4 3.4 1.4-7.1-5.3-5 7.2-.9z" fill="#e8a13a"/></svg>libertyhillstudio.com</div>
</div></div></body></html>`;

const work = mkdtempSync(join(process.env.TMPDIR || tmpdir(), "lhs-banner-"));
try {
  const page_ = join(work, "banner.html");
  writeFileSync(page_, html);
  const browser = await chromium.launch({ args: ["--mute-audio"], executablePath: process.env.CHROME_PATH || undefined });
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
  await page.goto(pathToFileURL(page_).href);
  await page.evaluate(() => document.fonts.ready);
  const fit = await page.evaluate(() => {
    const h = document.querySelector("h1"), c = document.querySelector(".copy");
    return { titleFits: h.scrollWidth <= c.clientWidth, copyFits: c.scrollHeight <= c.clientHeight };
  });
  if (!fit.titleFits || !fit.copyFits) throw new Error(`the words don't fit: ${JSON.stringify(fit)}`);
  const png = join(work, "banner.png");
  await page.screenshot({ path: png });
  await browser.close();
  execFileSync("magick", [png, "-strip", "-quality", "90", "-sampling-factor", "4:4:4", join(here, "assets", "banner.jpg")]);
  console.log("assets/banner.jpg: 2560x800");
} finally {
  rmSync(work, { recursive: true, force: true });
}
