import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const root = process.cwd();
const outputDir = join(root, "public/brand/trailheads");
const sourceSign = join(outputDir, "source/wooden-signpost-source.jpg");

const courses = [
  {
    slug: "designid",
    logo: "public/brand/tools/designid-logo.webp",
  },
  {
    slug: "spiritual-gifts",
    logo: "public/brand/tools/spiritual-gifts-logo.jpg",
  },
  {
    slug: "designpd",
    logo: "public/brand/tools/designpd-logo.jpg",
  },
  {
    slug: "fruitlife-360",
    logo: "public/brand/tools/fruitful-life-360-logo.jpg",
  },
  {
    slug: "design-pathways",
    logo: "public/brand/tools/design-pathways-logo.jpg",
  },
];

async function removeLightBackground(buffer, threshold = 238) {
  const image = sharp(buffer).ensureAlpha();
  const alpha = await image
    .clone()
    .removeAlpha()
    .greyscale()
    .threshold(threshold)
    .negate()
    .blur(0.4)
    .toColourspace("b-w")
    .toBuffer();

  return image
    .joinChannel(alpha)
    .png()
    .toBuffer();
}

async function createCartoonSign() {
  const cropped = await sharp(sourceSign)
    .trim({ background: "#ffffff", threshold: 12 })
    .resize({ width: 980, height: 820, fit: "inside", withoutEnlargement: true })
    .modulate({ brightness: 1.04, saturation: 1.3 })
    .sharpen({ sigma: 1.4, m1: 1.6, m2: 0.6 })
    .png()
    .toBuffer();

  const transparent = await removeLightBackground(cropped, 245);
  const metadata = await sharp(transparent).metadata();
  const outline = await sharp(transparent)
    .ensureAlpha()
    .extractChannel("alpha")
    .blur(1.2)
    .threshold(12)
    .toColourspace("b-w")
    .toBuffer();

  const outlineLayer = await sharp({
    create: {
      width: metadata.width ?? 980,
      height: metadata.height ?? 820,
      channels: 3,
      background: "#2a180d",
    },
  })
    .joinChannel(outline)
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: metadata.width ?? 980,
      height: metadata.height ?? 820,
      channels: 4,
      background: "#00000000",
    },
  })
    .composite([
      { input: outlineLayer, top: 4, left: 4 },
      { input: transparent, top: 0, left: 0 },
    ])
    .png()
    .toBuffer();
}

async function prepareLogo(relativePath) {
  const input = await sharp(join(root, relativePath))
    .resize({ width: 560, height: 156, fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#ffffff" })
    .modulate({ saturation: 1.06, brightness: 1.02 })
    .sharpen()
    .png()
    .toBuffer();

  const transparent = await removeLightBackground(input, 244);
  const { width = 560, height = 156 } = await sharp(transparent).metadata();
  const alpha = await sharp(transparent).ensureAlpha().extractChannel("alpha").toBuffer();

  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: "#ffffff",
    },
  })
    .joinChannel(alpha)
    .png()
    .toBuffer();
}

async function build() {
  await mkdir(outputDir, { recursive: true });
  const sign = await createCartoonSign();

  await sharp(sign).toFile(join(outputDir, "assessment-signpost-blank.png"));

  for (const course of courses) {
    const logo = await prepareLogo(course.logo);
    const logoMeta = await sharp(logo).metadata();
    const left = Math.round(386 - (logoMeta.width ?? 0) / 2);
    const top = Math.round(160 - (logoMeta.height ?? 0) / 2);

    await sharp(sign)
      .composite([{ input: logo, left, top }])
      .png()
      .toFile(join(outputDir, `${course.slug}-signpost.png`));
  }
}

build().catch((error) => {
  console.error(error);
  process.exit(1);
});
