const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
let docsifyRoot = process.env.DOCSIFY_ROOT;
if (!docsifyRoot) {
  try {
    docsifyRoot = path.dirname(require.resolve("docsify/package.json"));
  } catch {
    console.error(
      "Install docsify@5 locally, or set DOCSIFY_ROOT to a built Docsify checkout.",
    );
    process.exit(1);
  }
}
const prismRoot = path.dirname(require.resolve("prismjs/package.json"));
const mime = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".md": "text/markdown",
  ".png": "image/png",
};

http
  .createServer(async (request, response) => {
    const url = new URL(request.url, "http://localhost");
    let pathname = decodeURIComponent(url.pathname);
    let base = root;
    if (pathname.startsWith("/docsify/")) {
      base = path.join(docsifyRoot, "dist");
      pathname = pathname.slice("/docsify".length);
    } else if (pathname.startsWith("/node_modules/prismjs/")) {
      base = prismRoot;
      pathname = pathname.slice("/node_modules/prismjs".length);
    }
    if (pathname === "/") pathname = "/docs/index.html";
    const file = path.resolve(base, "." + pathname);
    if (!file.startsWith(path.resolve(base) + path.sep)) {
      response.writeHead(403).end();
      return;
    }
    try {
      const content = await fs.readFile(file);
      response.writeHead(200, {
        "content-type": mime[path.extname(file)] || "application/octet-stream",
      });
      response.end(content);
    } catch {
      response.writeHead(404).end("Not found");
    }
  })
  .listen(4174, "127.0.0.1", () => console.log("Demo: http://127.0.0.1:4174"));
