/**
 * Generate all required icon assets from the master SVG logo.
 *
 * The user-provided SVG uses SVG <mask> and <filter> elements with
 * an embedded PNG. resvg-js does NOT support those features, so we
 * render the SVG through `sharp` (which delegates to librsvg / libvips)
 * which handles masks and filters correctly.
 *
 * Usage: node generate-icons.js
 */

const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const ASSETS = path.resolve(__dirname, "src/assets");
const SVG_BLUE = path.join(ASSETS, "new-logo.svg");
const SVG_RED = path.join(ASSETS, "new-logo-red.svg");

/**
 * Render an SVG file to a PNG at a given width (square).
 */
async function renderSvgToPng(svgPath, outPath, size) {
  const svgBuffer = fs.readFileSync(svgPath);
  await sharp(svgBuffer, { density: 300 })
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(outPath);
  console.log(`  ✔ ${path.relative(__dirname, outPath)}  (${size}×${size})`);
}

async function main() {
  console.log("Generating blue (default) icons …");
  await renderSvgToPng(SVG_BLUE, path.join(ASSETS, "icon-34.png"), 34);
  await renderSvgToPng(SVG_BLUE, path.join(ASSETS, "icon-128.png"), 128);
  await renderSvgToPng(SVG_BLUE, path.join(ASSETS, "favicon.png"), 32);
  await renderSvgToPng(SVG_BLUE, path.join(ASSETS, "logo.png"), 128);
  await renderSvgToPng(SVG_BLUE, path.join(ASSETS, "temp-logo.png"), 128);
  await renderSvgToPng(SVG_BLUE, path.join(ASSETS, "editor", "logo.png"), 128);

  // Copy to img/ directory
  fs.copyFileSync(
    path.join(ASSETS, "icon-34.png"),
    path.join(ASSETS, "img", "icon-34.png")
  );
  fs.copyFileSync(
    path.join(ASSETS, "icon-128.png"),
    path.join(ASSETS, "img", "icon-128.png")
  );
  console.log("  ✔ Copied to img/ directory");

  console.log("\nGenerating red (recording) icons …");
  await renderSvgToPng(SVG_RED, path.join(ASSETS, "recording-logo.png"), 34);
  fs.copyFileSync(
    path.join(ASSETS, "recording-logo.png"),
    path.join(ASSETS, "img", "recording-logo.png")
  );
  console.log("  ✔ Copied recording-logo to img/ directory");

  console.log("\n✅ All icons generated successfully!");
}

main().catch((err) => {
  console.error("❌ Error generating icons:", err);
  process.exit(1);
});
