/**
 * Regenerates every raster brand asset from the vector sources:
 *
 *   app/icon.svg                -> app/apple-icon.png
 *                                -> app/favicon.ico (16/32/48)
 *                                -> public/icons/icon-192.png
 *                                -> public/icons/icon-512.png
 *   brand/maskable.svg          -> public/icons/icon-512-maskable.png
 *   brand/opengraph-image.html  -> app/opengraph-image.png (2400x1260)
 *
 * The sources are the files to edit; the PNG/ICO outputs are derivatives and
 * must not be hand-edited.
 *
 * Requires Playwright. Install it in the project (`pnpm add -D playwright-core
 * && npx playwright-core install chromium`) or point the script at an existing
 * browser and module:
 *
 *   PLAYWRIGHT_MODULE=/path/to/playwright-core/index.mjs \
 *   CHROMIUM_PATH=/path/to/chrome node brand/generate-icons.mjs
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const CLIENT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const loadPlaywright = async () => {
  const candidates = [
    process.env.PLAYWRIGHT_MODULE,
    "playwright-core",
    "playwright",
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      return await import(
        candidate.startsWith("/") ? pathToFileURL(candidate).href : candidate
      );
    } catch {
      // try the next candidate
    }
  }

  throw new Error(
    "Playwright not found. See the header comment in brand/generate-icons.mjs.",
  );
};

const svgDocument = (svg, size) => `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      * { margin: 0; padding: 0; }
      html, body { background: transparent; }
      body { width: ${size}px; height: ${size}px; }
      svg { display: block; width: ${size}px; height: ${size}px; }
    </style>
  </head>
  <body>${svg}</body>
</html>
`;

const { chromium } = await loadPlaywright();

const browser = await chromium.launch({
  ...(process.env.CHROMIUM_PATH
    ? { executablePath: process.env.CHROMIUM_PATH }
    : {}),
  args: ["--no-sandbox"],
});

const render = async (html, { width, height, scale = 1 }) => {
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: scale,
  });
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  const buffer = await page.screenshot({ omitBackground: true });
  await page.close();
  return buffer;
};

const write = async (out, buffer) => {
  const path = resolve(CLIENT, out);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, buffer);
  console.log(`  ${out} (${(buffer.length / 1024).toFixed(1)} kB)`);
};

const [icon, maskable, og] = await Promise.all([
  readFile(resolve(CLIENT, "app/icon.svg"), "utf8"),
  readFile(resolve(CLIENT, "brand/maskable.svg"), "utf8"),
  readFile(resolve(CLIENT, "brand/opengraph-image.html"), "utf8"),
]);

console.log("mark derivatives");
await write("app/apple-icon.png", await render(svgDocument(icon, 180), {
  width: 180,
  height: 180,
}));
await write(
  "public/icons/icon-192.png",
  await render(svgDocument(icon, 192), { width: 192, height: 192 }),
);
await write(
  "public/icons/icon-512.png",
  await render(svgDocument(icon, 512), { width: 512, height: 512 }),
);
await write(
  "public/icons/icon-512-maskable.png",
  await render(svgDocument(maskable, 512), { width: 512, height: 512 }),
);

/** ICO container holding PNG-encoded entries (Vista and newer). */
const buildIco = (entries) => {
  const header = Buffer.alloc(6 + entries.length * 16);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);

  let offset = header.length;
  const payloads = entries.map(({ size, data }, index) => {
    const entry = 6 + index * 16;
    header.writeUInt8(size, entry);
    header.writeUInt8(size, entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(data.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += data.length;
    return data;
  });

  return Buffer.concat([header, ...payloads]);
};

const icoEntries = [];
for (const size of [16, 32, 48]) {
  icoEntries.push({
    size,
    data: await render(svgDocument(icon, size), {
      width: size,
      height: size,
    }),
  });
}
await write("app/favicon.ico", buildIco(icoEntries));

console.log("open graph card");
await write("app/opengraph-image.png", await render(og, {
  width: 1200,
  height: 630,
  scale: 2,
}));

await browser.close();