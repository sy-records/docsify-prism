const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const { JSDOM } = require("jsdom");
const source = fs.readFileSync(require.resolve("../src/index.js"), "utf8");

function loadPlugin(config, withPrism = true) {
  const dom = new JSDOM('<main class="markdown-section"></main>', {
    runScripts: "outside-only",
  });
  const { window } = dom;
  window.$docsify = { prism: config };
  if (withPrism) {
    window.Prism = { manual: true };
    for (const file of [
      "prismjs",
      "prismjs/components/prism-diff",
      "prismjs/plugins/diff-highlight/prism-diff-highlight",
      "prismjs/plugins/line-numbers/prism-line-numbers",
    ]) {
      window.eval(fs.readFileSync(require.resolve(file), "utf8"));
    }
  }
  window.eval(source);
  return { window, api: window.DocsifyPrism };
}

function addCode(window, info, text) {
  const pre = window.document.createElement("pre");
  pre.dataset.lang = info;
  pre.className = `language-${info}`;
  const code = window.document.createElement("code");
  code.className = `language-${info}`;
  code.textContent = text;
  pre.append(code);
  window.document.querySelector("main").append(pre);
  return pre;
}

test("registers a doneEach hook without requiring changes to Docsify", () => {
  const { window, api } = loadPlugin();
  let hook;
  window.$docsify.plugins[0]({
    doneEach: (callback) => {
      hook = callback;
    },
  });
  assert.equal(hook, api.applyHighlighting);
});

test("parses quotes, repeated classes, and safe line ranges", () => {
  const { api } = loadPlugin();
  const parsed = api.parseCodeInfo(
    'js :class="line-numbers diff-highlight" :class=line-numbers :data-line="1, 2-3"',
  );
  assert.deepEqual(JSON.parse(JSON.stringify(parsed)), {
    language: "js",
    hasMetadata: true,
    classes: ["line-numbers", "diff-highlight"],
    lines: ["1", "2-3"],
  });
});

test("unsafe options never become event handlers or arbitrary attributes", () => {
  const { window, api } = loadPlugin();
  const pre = addCode(
    window,
    'js :class=\'line-numbers " onmouseover="alert(1)\' :onclick="alert(1)" :style="display:none" :data-line="0,-1,3-2,bad,1,9007199254740992"',
    "const answer = 42;",
  );
  api.applyHighlighting();
  assert.deepEqual([...pre.classList].sort(), ["language-js", "line-numbers"]);
  assert.equal(pre.dataset.line, "1");
  assert.equal(pre.hasAttribute("onclick"), false);
  assert.equal(pre.hasAttribute("onmouseover"), false);
  assert.equal(pre.hasAttribute("style"), false);
  assert.equal(pre.querySelector(".keyword").textContent, "const");
});

test("diff-js preserves JavaScript tokens and creates decorations only once", () => {
  const { window, api } = loadPlugin();
  const pre = addCode(
    window,
    'diff-js :class="line-numbers diff-highlight"',
    "-const count = 1;\n+const count = 2;",
  );
  api.applyHighlighting();
  api.applyHighlighting();
  assert.equal(pre.querySelector(".inserted .keyword").textContent, "const");
  assert.equal(pre.querySelector(".deleted .keyword").textContent, "const");
  assert.equal(pre.querySelectorAll(".line-numbers-rows").length, 1);
  assert.equal(pre.querySelectorAll(".line-numbers-rows > span").length, 2);
  assert.equal(
    window.document.querySelectorAll("#docsify-prism-style").length,
    1,
  );
});

test("empty blocks and metadata without a language do not throw", () => {
  const { window, api } = loadPlugin();
  const pre = addCode(window, ":class=line-numbers :data-line=1", "");
  api.applyHighlighting();
  assert.equal(pre.dataset.lang, "markup");
  assert.equal(pre.querySelector("code").textContent, "");
  assert.equal(pre.querySelectorAll(".line-numbers-rows").length, 0);
});

test("prism false leaves the DOM and styles unchanged", () => {
  const { window, api } = loadPlugin(false);
  const pre = addCode(window, "js :class=line-numbers", "const a = 1;");
  const before = pre.outerHTML;
  api.applyHighlighting();
  assert.equal(pre.outerHTML, before);
  assert.equal(window.document.querySelector("style"), null);
});

test("style false allows sites to provide their own theme integration", () => {
  const { window, api } = loadPlugin({ style: false });
  const pre = addCode(window, "js :class=line-numbers", "const a = 1;");
  api.applyHighlighting();
  assert.equal(window.document.querySelector("style"), null);
  assert.equal(pre.querySelectorAll(".line-numbers-rows").length, 1);
});

test("missing Prism is safe and can be retried after Prism loads", () => {
  const { window, api } = loadPlugin(undefined, false);
  const pre = addCode(window, "js :class=line-numbers", "const a = 1;");
  assert.doesNotThrow(() => api.applyHighlighting());
  window.Prism = { manual: true };
  window.eval(fs.readFileSync(require.resolve("prismjs"), "utf8"));
  api.applyHighlighting();
  assert.equal(pre.dataset.lang, "js");
  assert.equal(pre.querySelector(".keyword").textContent, "const");
});
