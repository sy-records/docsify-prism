const fs = require("node:fs/promises");
const path = require("node:path");
const terser = require("terser");
const pkg = require("../package.json");

const root = path.join(__dirname, "..");
const srcFile = path.join(root, "src/index.js");
const distDir = path.join(root, "dist");
const distFile = path.join(distDir, "index.js");
const minFile = path.join(distDir, "index.min.js");
const banner = `/*!
 * ${pkg.name} v${pkg.version}
 * ${pkg.description}
 * (c) 2026 sy-records
 * ${pkg.license} license
 */
`;

async function build() {
  const source = await fs.readFile(srcFile, "utf8");

  await fs.mkdir(distDir, { recursive: true });
  await fs.writeFile(distFile, banner + source);

  const minified = await terser.minify(source, {
    compress: true,
    mangle: true,
    output: {
      comments: /^!/,
    },
  });

  if (minified.error) {
    throw minified.error;
  }

  await fs.writeFile(minFile, banner + minified.code + "\n");
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
