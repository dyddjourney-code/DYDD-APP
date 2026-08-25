import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";
import sharp from "sharp";

const outDir = join(process.cwd(), "public", "brand", "badges");
const iconDir = join(process.cwd(), "public", "brand", "tools", "badge-icons");
const reflectionIconDir = join(process.cwd(), "public", "brand", "reflection-icons");
mkdirSync(outDir, { recursive: true });
mkdirSync(iconDir, { recursive: true });
mkdirSync(reflectionIconDir, { recursive: true });

for (const file of readdirSync(outDir)) {
  if (file.endsWith("-badge.svg") || file.endsWith("-badge.png") || file === "dydd-trail-badges-preview.png") {
    rmSync(join(outDir, file));
  }
}

const cream = "#fff8e7";
const black = "#171915";
const dyddGreen = "#365f3f";
const pine = "#243f27";
const moss = "#6f8d57";
const architectGold = "#D4A451";
const artisanBlue = "#647C9B";
const shepherdGreen = "#739D5E";
const stewardPurple = "#5A496B";
const gold = architectGold;
const blue = artisanBlue;
const designAccentGold = "#c89a38";
const purple = "#70509a";
const patchGold = "#d9b866";

function assetDataUri(relativePath) {
  const fullPath = join(process.cwd(), relativePath);
  const ext = extname(fullPath).toLowerCase();
  const mime =
    ext === ".svg"
      ? "image/svg+xml"
      : ext === ".webp"
        ? "image/webp"
        : ext === ".png"
          ? "image/png"
          : "image/jpeg";
  const data = readFileSync(fullPath).toString("base64");
  return `data:${mime};base64,${data}`;
}

function whiteToTransparent({ data, info, threshold = 230, fade = 42 }) {
  const pixels = Buffer.from(data);
  for (let index = 0; index < pixels.length; index += info.channels) {
    const red = pixels[index];
    const green = pixels[index + 1];
    const blue = pixels[index + 2];
    const maxChannel = Math.max(red, green, blue);
    const minChannel = Math.min(red, green, blue);
    const isNeutralLight = minChannel > threshold - fade && maxChannel - minChannel < 28;
    const isNearlyWhite = minChannel > 246;
    if (isNeutralLight || isNearlyWhite) {
      const alphaIndex = index + 3;
      const alphaScale = Math.max(0, Math.min(1, (threshold - minChannel) / fade));
      pixels[alphaIndex] = Math.round(pixels[alphaIndex] * alphaScale);
    }
  }
  return sharp(pixels, { raw: info });
}

async function makeLogoIcon({ source, name, left = 0, top = 0, size, removeWhite = true }) {
  const destination = join(iconDir, `${name}.png`);
  let icon = sharp(join(process.cwd(), source))
    .extract({ left, top, width: size, height: size })
    .ensureAlpha();

  if (removeWhite) {
    const { data, info } = await icon.raw().toBuffer({ resolveWithObject: true });
    icon = whiteToTransparent({ data, info });
  }

  await icon
    .resize(420, 420, { fit: "contain", background: { r: 255, g: 248, b: 231, alpha: 0 } })
    .png()
    .toFile(destination);
  return `public/brand/tools/badge-icons/${name}.png`;
}

async function makeTrimmedIcon({ source, name }) {
  const destination = join(iconDir, `${name}.png`);
  const icon = sharp(join(process.cwd(), source))
    .trim({ background: "#ffffff", threshold: 18 })
    .ensureAlpha();
  const { data, info } = await icon.raw().toBuffer({ resolveWithObject: true });
  await whiteToTransparent({ data, info })
    .resize(420, 420, { fit: "contain", background: { r: 255, g: 248, b: 231, alpha: 0 } })
    .png()
    .toFile(destination);
  return `public/brand/tools/badge-icons/${name}.png`;
}

async function makeCleanPatch({ source, name, left, top, size, outputSize = 420 }) {
  const destination = join(process.cwd(), "public", "brand", "reflection-badges", `${name}-patch-clean.png`);
  const patch = await sharp(join(process.cwd(), source))
    .extract({ left, top, width: size, height: size })
    .resize(outputSize, outputSize, { fit: "cover" })
    .png()
    .toBuffer();
  const radius = Math.floor(outputSize / 2) - 6;
  const center = outputSize / 2;
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${outputSize}" height="${outputSize}">
<circle cx="${center}" cy="${center}" r="${radius}" fill="#fff"/>
</svg>`);
  await sharp(patch)
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toFile(destination);
  return `public/brand/reflection-badges/${name}-patch-clean.png`;
}

async function makeCharacterPatch({ source, name, centerX, centerY, size }) {
  const left = Math.max(0, Math.round(centerX - size / 2));
  const top = Math.max(0, Math.round(centerY - size / 2));
  return makeCleanPatch({ source, name, left, top, size, outputSize: 420 });
}

function titleCase(value) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function baseBadge({ title, desc, bodyFill, ribbonFill, shape = "circle", center }) {
  const frame =
    shape === "hex"
      ? `<path d="M256 42 431 132v188L256 470 81 320V132z" fill="${bodyFill}"/>
<path d="M256 76 399 150v154L256 427 113 304V150z" fill="none" stroke="${cream}" stroke-width="12"/>`
      : shape === "rounded"
        ? `<path d="M118 68h276c38 0 69 31 69 69v238c0 38-31 69-69 69H118c-38 0-69-31-69-69V137c0-38 31-69 69-69Z" fill="${bodyFill}"/>
<path d="M130 100h252c27 0 50 23 50 50v212c0 27-23 50-50 50H130c-27 0-50-23-50-50V150c0-27 23-50 50-50Z" fill="none" stroke="${cream}" stroke-width="12"/>`
        : `<circle cx="256" cy="256" r="214" fill="${bodyFill}"/>
<circle cx="256" cy="256" r="184" fill="none" stroke="${cream}" stroke-width="12"/>`;

  const fontSize = title.length > 13 ? 22 : title.length > 10 ? 26 : title.length > 8 ? 30 : 36;
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" role="img" aria-labelledby="title desc">
<title id="title">${title} badge</title>
<desc id="desc">${desc}</desc>
<defs>
  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="0" dy="8" stdDeviation="7" flood-color="#000" flood-opacity=".22"/>
  </filter>
  <radialGradient id="paperGlow" cx="50%" cy="38%" r="62%">
    <stop offset="0%" stop-color="#ffffff" stop-opacity=".32"/>
    <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
  </radialGradient>
</defs>
<rect width="512" height="512" fill="none"/>
<g filter="url(#shadow)">
${frame}
<path d="M108 118c57-32 129-44 207-28 45 9 78 25 97 46" fill="none" stroke="#ffffff" stroke-opacity=".18" stroke-width="18" stroke-linecap="round"/>
<circle cx="256" cy="218" r="126" fill="url(#paperGlow)"/>
${center}
<text x="256" y="124" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="900" letter-spacing="5" fill="${cream}">DYDD</text>
<path d="M82 354h348l28 34-28 34H82l-28-34z" fill="${ribbonFill}" stroke="${cream}" stroke-width="10"/>
<text x="256" y="399" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="900" letter-spacing="1.5" fill="${cream}">${title.toUpperCase()}</text>
<circle cx="114" cy="388" r="8" fill="${cream}"/>
<circle cx="398" cy="388" r="8" fill="${cream}"/>
</g>
</svg>`;
}

function designIcon(kind) {
  const line = `fill="none" stroke="${pine}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"`;
  const fine = `fill="none" stroke="${pine}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"`;
  const accent = `fill="none" stroke="${designAccentGold}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"`;
  const icons = {
    identity: `<g>
<circle cx="256" cy="235" r="103" fill="${cream}" stroke="${black}" stroke-opacity=".22" stroke-width="5"/>
<circle cx="256" cy="191" r="20" fill="${pine}"/>
<path ${line} d="M211 304c7-43 24-70 45-70s38 27 45 70"/>
<path ${line} d="M212 232c-20-20-36-42-47-67"/>
<path ${line} d="M300 232c20-20 36-42 47-67"/>
</g>`,
    expertise: `<g>
<circle cx="256" cy="235" r="103" fill="${cream}" stroke="${black}" stroke-opacity=".22" stroke-width="5"/>
<path ${line} d="M181 303h150"/>
<path ${line} d="M199 303v-44h37v44"/>
<path ${line} d="M238 303v-75h37v75"/>
<path ${line} d="M277 303v-111h37v111"/>
<path ${accent} d="M190 206c29-37 66-56 112-58"/>
<path ${accent} d="M301 148 283 169M301 148l-23-13"/>
</g>`,
    story: `<g>
<circle cx="256" cy="235" r="103" fill="${cream}" stroke="${black}" stroke-opacity=".22" stroke-width="5"/>
<path ${line} d="M171 193c32-10 60-3 85 22 25-25 53-32 85-22v99c-32-10-60-3-85 22-25-25-53-32-85-22z"/>
<path ${fine} d="M256 215v99"/>
<path ${fine} d="M199 231h29M199 257h29M284 231h29M284 257h29"/>
<path ${accent} d="M256 143v31M224 154l17 25M288 154l-17 25"/>
</g>`,
    desire: `<g>
<circle cx="256" cy="235" r="103" fill="${cream}" stroke="${black}" stroke-opacity=".22" stroke-width="5"/>
<path ${line} d="M256 323c-53-36-86-70-86-109 0-27 20-47 47-47 18 0 32 10 39 28 7-18 21-28 39-28 27 0 47 20 47 47 0 39-33 73-86 109Z"/>
<path ${accent} d="M198 239h27l14-31 24 58 17-42 10 15h24"/>
</g>`,
    gifts: `<g>
<circle cx="256" cy="235" r="103" fill="${cream}" stroke="${black}" stroke-opacity=".22" stroke-width="5"/>
<path ${line} d="M189 224h134v80H189zM178 188h156v40H178zM256 188v116"/>
<path ${line} d="M256 187c-27-34-60-24-49 0 11 21 49 0 49 0Zm0 0c27-34 60-24 49 0-11 21-49 0-49 0Z"/>
<path ${accent} d="M178 228h156"/>
</g>`,
    niche: `<g>
<circle cx="256" cy="235" r="103" fill="${cream}" stroke="${black}" stroke-opacity=".22" stroke-width="5"/>
<path ${line} d="M256 157v155"/>
<path ${line} d="M215 179h58l17 17-17 17h-58z"/>
<path ${line} d="M297 226h-58l-17 17 17 17h58"/>
<path ${accent} d="M229 196h30M253 243h30"/>
</g>`,
  };
  return icons[kind];
}

const toolLogoOverlays = new Map();

function toolCenter(slug, relativeLogoPath, scale = 150) {
  toolLogoOverlays.set(slug, { relativeLogoPath, scale });
  return `<g>
<circle cx="256" cy="235" r="103" fill="${cream}" stroke="${black}" stroke-opacity=".22" stroke-width="5"/>
<image href="${assetDataUri(relativeLogoPath)}" xlink:href="${assetDataUri(relativeLogoPath)}" x="${256 - scale / 2}" y="${235 - scale / 2}" width="${scale}" height="${scale}" preserveAspectRatio="xMidYMid meet"/>
</g>`;
}

function reflectionPatchSvg({ type, color, label }) {
  const darkBase = type === "architect" ? "#171915" : type === "artisan" ? "#243f52" : type === "steward" ? "#382748" : "#263f27";
  const line = `fill="none" stroke="${patchGold}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"`;
  const fine = `fill="none" stroke="${patchGold}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"`;
  const glyphs = {
    shepherd: `<path ${line} d="M256 335c-78-51-126-99-126-153 0-38 27-66 64-66 28 0 48 16 62 43 14-27 34-43 62-43 37 0 64 28 64 66 0 54-48 102-126 153Z"/>`,
    artisan: `<path ${line} d="M150 330c42-36 86-39 131-10 32 20 62 22 90 4"/>
<path d="M209 268 318 159c14-14 36-14 50 0l14 14c14 14 14 36 0 50L273 332l-73 13z" fill="${darkBase}" stroke="${patchGold}" stroke-width="16" stroke-linejoin="round"/>
<path ${fine} d="M318 159 382 223M273 332l-73 13 9-77"/>`,
    architect: `<path ${line} d="M140 331h232M157 331v-76h49m149 76v-76h-49"/>
<path ${line} d="M180 331V229c0-62 34-104 76-104s76 42 76 104v102"/>
<path ${fine} d="M256 103v306M108 259h296M132 207h248M169 379h174"/>`,
    steward: `<path ${line} d="M256 121v229M174 171h164M205 350h102"/>
<path ${line} d="M164 188 108 317h112L164 188Zm184 0-56 129h112l-56-129Z"/>
<path ${fine} d="M108 317c27 27 85 27 112 0M292 317c27 27 85 27 112 0"/>
<circle cx="256" cy="104" r="19" fill="${patchGold}"/>`,
  };

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="${label} Reflection icon">
<rect width="512" height="512" fill="none"/>
<circle cx="256" cy="256" r="212" fill="${darkBase}"/>
<circle cx="256" cy="256" r="212" fill="${color}" fill-opacity=".18"/>
<circle cx="256" cy="256" r="190" fill="none" stroke="${patchGold}" stroke-width="19"/>
<circle cx="256" cy="256" r="153" fill="none" stroke="${cream}" stroke-opacity=".38" stroke-width="8"/>
${glyphs[type]}
</svg>`;
}

async function makeReflectionLineIcon({ type, color, label }) {
  const svg = reflectionPatchSvg({ type, color, label });
  const svgPath = join(reflectionIconDir, `${type}-reflection-icon.svg`);
  const pngPath = join(reflectionIconDir, `${type}-reflection-icon.png`);
  writeFileSync(svgPath, svg);
  await sharp(Buffer.from(svg)).resize(512, 512).png().toFile(pngPath);
  return `public/brand/reflection-icons/${type}-reflection-icon.png`;
}

function reflectionCenter({ type, color, icon }) {
  const iconData = assetDataUri(icon);
  const dark = type === "architect" ? black : pine;
  const centerY = 244;
  const imageSize = 142;
  const imageX = Math.round(256 - imageSize / 2);
  const imageY = Math.round(centerY - imageSize / 2);
  return `<g>
<circle cx="256" cy="${centerY}" r="106" fill="${dark}" fill-opacity=".28" stroke="${cream}" stroke-width="8"/>
<circle cx="256" cy="${centerY}" r="86" fill="${color}" fill-opacity=".38"/>
<circle cx="256" cy="${centerY}" r="76" fill="${cream}" stroke="${black}" stroke-opacity=".28" stroke-width="5"/>
<image href="${iconData}" xlink:href="${iconData}" x="${imageX}" y="${imageY}" width="${imageSize}" height="${imageSize}" preserveAspectRatio="xMidYMid meet" style="image-rendering:auto"/>
</g>`;
}

const designIdIcon = await makeLogoIcon({
  source: "public/brand/tools/designid-logo.webp",
  name: "designid-icon",
  left: 0,
  top: 0,
  size: 575,
});

const designPdIcon = await makeLogoIcon({
  source: "public/brand/tools/designpd-logo.jpg",
  name: "designpd-icon",
  left: 0,
  top: 0,
  size: 348,
});

const spiritualGiftsIcon = await makeTrimmedIcon({
  source: "public/brand/tools/spiritual-gifts-icon-correct.png",
  name: "spiritual-gifts-icon",
});

const fruitLifeIcon = await makeLogoIcon({
  source: "public/brand/tools/fruitful-life-360-logo.jpg",
  name: "fruitlife-360-icon",
  left: 0,
  top: 0,
  size: 512,
});

const designPathwaysIcon = await makeTrimmedIcon({
  source: "public/brand/tools/design-pathways-icon-source.jpg",
  name: "design-pathways-icon",
});

const shepherdIcon = await makeReflectionLineIcon({
  type: "shepherd",
  color: shepherdGreen,
  label: "Shepherd",
});

const artisanIcon = await makeReflectionLineIcon({
  type: "artisan",
  color: blue,
  label: "Artisan",
});

const architectIcon = await makeReflectionLineIcon({
  type: "architect",
  color: gold,
  label: "Architect",
});

const stewardIcon = await makeReflectionLineIcon({
  type: "steward",
  color: stewardPurple,
  label: "Steward",
});

const badges = [
  ["identity", "Identity", "DYDD DESIGN badge for Identity", baseBadge({ title: "Identity", desc: "DYDD DESIGN badge for Identity", bodyFill: dyddGreen, ribbonFill: black, shape: "circle", center: designIcon("identity") })],
  ["expertise", "Expertise", "DYDD DESIGN badge for Expertise", baseBadge({ title: "Expertise", desc: "DYDD DESIGN badge for Expertise", bodyFill: dyddGreen, ribbonFill: black, shape: "hex", center: designIcon("expertise") })],
  ["story", "Story", "DYDD DESIGN badge for Story", baseBadge({ title: "Story", desc: "DYDD DESIGN badge for Story", bodyFill: dyddGreen, ribbonFill: black, shape: "rounded", center: designIcon("story") })],
  ["desire", "Desire", "DYDD DESIGN badge for Desire", baseBadge({ title: "Desire", desc: "DYDD DESIGN badge for Desire", bodyFill: dyddGreen, ribbonFill: black, shape: "circle", center: designIcon("desire") })],
  ["gifts", "Gifts", "DYDD DESIGN badge for Gifts", baseBadge({ title: "Gifts", desc: "DYDD DESIGN badge for Gifts", bodyFill: dyddGreen, ribbonFill: black, shape: "hex", center: designIcon("gifts") })],
  ["niche", "Niche", "DYDD DESIGN badge for Niche", baseBadge({ title: "Niche", desc: "DYDD DESIGN badge for Niche", bodyFill: dyddGreen, ribbonFill: black, shape: "rounded", center: designIcon("niche") })],
  ["designid", "DesignID", "DYDD trail badge for DesignID", baseBadge({ title: "DesignID", desc: "DYDD trail badge for DesignID", bodyFill: dyddGreen, ribbonFill: black, shape: "circle", center: toolCenter("designid", designIdIcon, 158) })],
  ["spiritual-gifts", "Spiritual Gifts", "DYDD trail badge for Spiritual Gifts", baseBadge({ title: "Spiritual Gifts", desc: "DYDD trail badge for Spiritual Gifts", bodyFill: pine, ribbonFill: moss, shape: "hex", center: toolCenter("spiritual-gifts", spiritualGiftsIcon, 158) })],
  ["design-pathways", "Design Pathways", "DYDD trail badge for Design Pathways", baseBadge({ title: "Design Pathways", desc: "DYDD trail badge for Design Pathways", bodyFill: dyddGreen, ribbonFill: black, shape: "hex", center: toolCenter("design-pathways", designPathwaysIcon, 158) })],
  ["designpd", "DesignPD", "DYDD trail badge for DesignPD", baseBadge({ title: "DesignPD", desc: "DYDD trail badge for DesignPD", bodyFill: pine, ribbonFill: moss, shape: "circle", center: toolCenter("designpd", designPdIcon, 158) })],
  ["fruitlife-360", "FruitLife 360", "DYDD trail badge for FruitLife 360", baseBadge({ title: "FruitLife 360", desc: "DYDD trail badge for FruitLife 360", bodyFill: dyddGreen, ribbonFill: black, shape: "rounded", center: toolCenter("fruitlife-360", fruitLifeIcon, 158) })],
  ["shepherd", "Shepherd", "DYDD Reflection badge for Shepherd", baseBadge({ title: "Shepherd", desc: "DYDD Reflection badge for Shepherd", bodyFill: shepherdGreen, ribbonFill: black, shape: "rounded", center: reflectionCenter({ type: "shepherd", color: shepherdGreen, icon: shepherdIcon }) })],
  ["artisan", "Artisan", "DYDD Reflection badge for Artisan", baseBadge({ title: "Artisan", desc: "DYDD Reflection badge for Artisan", bodyFill: blue, ribbonFill: black, shape: "circle", center: reflectionCenter({ type: "artisan", color: blue, icon: artisanIcon }) })],
  ["architect", "Architect", "DYDD Reflection badge for Architect", baseBadge({ title: "Architect", desc: "DYDD Reflection badge for Architect", bodyFill: gold, ribbonFill: black, shape: "hex", center: reflectionCenter({ type: "architect", color: gold, icon: architectIcon }) })],
  ["steward", "Steward", "DYDD Reflection badge for Steward", baseBadge({ title: "Steward", desc: "DYDD Reflection badge for Steward", bodyFill: stewardPurple, ribbonFill: black, shape: "rounded", center: reflectionCenter({ type: "steward", color: stewardPurple, icon: stewardIcon }) })],
];

for (const [slug, , , svg] of badges) {
  writeFileSync(join(outDir, `${slug}-badge.svg`), svg);
  let png = await sharp(Buffer.from(svg)).png().toBuffer();
  const overlay = toolLogoOverlays.get(slug);
  if (overlay) {
    const logo = await sharp(join(process.cwd(), overlay.relativeLogoPath))
      .resize(overlay.scale, overlay.scale, { fit: "contain" })
      .png()
      .toBuffer();
    png = await sharp(png)
      .composite([
        {
          input: logo,
          left: Math.round(256 - overlay.scale / 2),
          top: Math.round(235 - overlay.scale / 2),
        },
      ])
      .png()
      .toBuffer();
  }
  writeFileSync(join(outDir, `${slug}-badge.png`), png);
}

const cell = 230;
const labelHeight = 42;
const cols = 5;
const rows = Math.ceil(badges.length / cols);
const composites = [];

for (let index = 0; index < badges.length; index += 1) {
  const [slug, label] = badges[index];
  const left = (index % cols) * cell;
  const top = Math.floor(index / cols) * (cell + labelHeight);
  const badgePng = await sharp(join(outDir, `${slug}-badge.png`)).resize(176, 176).png().toBuffer();
  const labelSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cell}" height="${labelHeight}">
<text x="${cell / 2}" y="28" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="800" fill="${black}">${titleCase(label)}</text>
</svg>`;
  composites.push({ input: badgePng, left: left + 27, top: top + 18 });
  composites.push({ input: Buffer.from(labelSvg), left, top: top + 194 });
}

const preview = await sharp({
  create: {
    width: cols * cell,
    height: rows * (cell + labelHeight),
    channels: 4,
    background: "#fbfaf4",
  },
})
  .composite(composites)
  .png()
  .toBuffer();

writeFileSync(join(outDir, "dydd-trail-badges-preview.png"), preview);
console.log(`Generated ${badges.length} badge SVGs and preview image.`);
