(function (global) {
  "use strict";
  const STYLE_ID = "docsify-prism-style";
  const highlighted = new WeakSet();
  const defaultStyle = `/* Prism DOM plugins measure and decorate the pre's content box. */
.markdown-section
  pre[data-lang]:is(.line-numbers, [data-line], .diff-highlight) {
  overflow: auto;
  padding: 1.5rem !important;
}

.markdown-section
  pre[data-lang]:is(.line-numbers, [data-line], .diff-highlight)
  > code {
  position: relative;
  overflow: visible;
  width: max-content;
  min-width: 100%;
  padding: 0 !important;
}

.markdown-section pre[data-lang]:is(.line-numbers, [data-line]) {
  padding-left: 3.8em !important;
}

.markdown-section pre[data-lang] > .line-highlight {
  margin-top: 1.5rem;
}

.markdown-section pre[data-lang] > code > .line-highlight {
  left: -3.8em;
  /* Prism's inline width includes pre padding, which overflows the code. */
  width: calc(100% + 3.8em) !important;
  margin-top: 0;
}
`;
  /** Parse supported Prism options without exposing arbitrary HTML attributes. */
  function parseCodeInfo(info) {
    const metadataStart = info.search(/(?:^|\s):[\w-]+(?:=|\s|$)/);
    const language = metadataStart < 0 ? info : info.slice(0, metadataStart);
    const metadata = metadataStart < 0 ? "" : info.slice(metadataStart);
    const classes = [];
    const lines = [];
    const options =
      /(?:^|\s):([\w-]+)=(?:"([^"]*)"|'([^']*)'|([^\s"']+))(?=\s|$)/g;

    for (const match of metadata.matchAll(options)) {
      const value = match[2] ?? match[3] ?? match[4];

      if (match[1] === "class") {
        classes.push(
          ...value.split(/\s+/).filter((name) => /^[\w-]+$/.test(name)),
        );
      } else if (match[1] === "data-line") {
        lines.push(
          ...value
            .split(",")
            .map((range) => range.trim())
            .filter((range) => {
              if (!/^\d+(?:-\d+)?$/.test(range)) {
                return false;
              }

              const [start, end = start] = range.split("-").map(Number);
              return (
                Number.isSafeInteger(start) &&
                Number.isSafeInteger(end) &&
                start > 0 &&
                end >= start
              );
            }),
        );
      }
    }

    return {
      language: language.trim() || "markup",
      hasMetadata: metadataStart >= 0,
      classes: [...new Set(classes)],
      lines: [...new Set(lines)],
    };
  }

  function applyHighlighting() {
    const config = (global.$docsify || {}).prism;
    const prism = global.Prism;
    if (config === false || !prism || !global.document) return;
    if (
      (!config || config.style !== false) &&
      !global.document.getElementById(STYLE_ID)
    ) {
      const style = global.document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = defaultStyle;
      global.document.head.appendChild(style);
    }
    global.document
      .querySelectorAll(".markdown-section pre[data-lang] > code")
      .forEach((element) => {
        if (highlighted.has(element)) {
          return;
        }

        highlighted.add(element);
        const pre = /** @type {HTMLElement} */ (element.parentElement);
        const info = parseCodeInfo(pre.dataset.lang || "");

        if (info.hasMetadata) {
          pre.dataset.lang = info.language;
          pre.className = [`language-${info.language}`, ...info.classes].join(
            " ",
          );
          element.className = `lang-${info.language} language-${info.language}`;

          if (info.lines.length) {
            pre.dataset.line = info.lines.join(",");
          }
        }

        const code = element.textContent;

        if (!code) {
          return;
        }

        const language = prism.util.getLanguage(element);
        const isDiff = language === "diff" || language.startsWith("diff-");

        if (info.hasMetadata || isDiff) {
          // Diff Highlight expects the base language's grammar to be loaded by
          // the page. The Diff grammar also works without that optional plugin.
          if (isDiff && prism.languages.diff && !prism.languages[language]) {
            prism.languages[language] = prism.languages.diff;
          }

          prism.highlightElement(element);
        } else {
          // Ordinary blocks were already tokenized by Docsify. Complete the DOM
          // hooks so inherited line-numbers settings work without retokenizing.
          prism.hooks.run("complete", {
            element,
            code,
            language,
            grammar: prism.languages[language],
            highlightedCode: element.innerHTML,
          });
        }
      });
  }
  function install(hook) {
    hook.doneEach(applyHighlighting);
  }
  const api = { install, applyHighlighting, parseCodeInfo };
  global.DocsifyPrism = api;
  global.$docsify = global.$docsify || {};
  global.$docsify.plugins = [install].concat(global.$docsify.plugins || []);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
