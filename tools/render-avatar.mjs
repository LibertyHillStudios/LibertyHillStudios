#!/usr/bin/env node
// Draws assets/avatar.png, the studio's GitHub avatar: the shield from the website's own vector
// (src/components/brand/Logo.tsx), on the ink tile the site's app icons use, at 2048 pixels so it
// stays sharp wherever GitHub shows it (460 points on a profile, twice that on a high-density
// screen). GitHub cuts avatars to a circle, so the shield sits inside it with room around.
//
//   node tools/render-avatar.mjs <the studio website's folder>
//
// Needs rsvg-convert (librsvg).
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

if (!process.argv[2]) throw new Error("usage: node tools/render-avatar.mjs <the studio website's folder>");
const site = resolve(process.argv[2]);
const here = dirname(dirname(fileURLToPath(import.meta.url)));
const logo = readFileSync(join(site, "src/components/brand/Logo.tsx"), "utf8");
const [clip, rim, field, hill, star] = [...logo.matchAll(/\bd="([^"]+)"/g)].map((m) => m[1]);
if (!star || !rim.startsWith("M50 8L86 18")) throw new Error("Logo.tsx no longer draws the shield this script expects");

const SIZE = 2048, SCALE = 0.72;
const tx = 50 - 50 * SCALE, ty = 50 - 50.5 * SCALE;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#15110e"/>` +
  `<g transform="matrix(${SCALE} 0 0 ${SCALE} ${tx} ${ty})"><clipPath id="f"><path d="${clip}"/></clipPath>` +
  `<path d="${rim}" fill="#e8a13a"/><path d="${field}" fill="#15110e"/>` +
  `<path d="${hill}" fill="#b3471f" clip-path="url(#f)"/><path d="${star}" fill="#e8a13a"/></g></svg>`;
writeFileSync(join(here, "assets", "avatar.png"), execFileSync("rsvg-convert", ["-w", String(SIZE), "-h", String(SIZE)], { input: svg }));
console.log(`assets/avatar.png: ${SIZE}x${SIZE}`);
