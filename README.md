# docsify-prism

A docsify plugin that integrates Prism plugins for enhanced code blocks.

## Supported Prism plugins

The following Prism plugins are currently supported:

- [x] [line-numbers](https://prismjs.com/plugins/line-numbers/) — Add line numbers to code blocks.
- [x] [line-highlight](https://prismjs.com/plugins/line-highlight/) — Highlight individual lines or ranges.
- [x] [diff-highlight](https://prismjs.com/plugins/diff-highlight/) — Highlight added and deleted lines while preserving language syntax highlighting. Requires the Diff language definition.

## Requirements

- docsify 5 or later.
- The Prism plugins and language definitions needed by your code blocks.

docsify provides Prism. This plugin connects Prism's rendering hooks to docsify's page lifecycle and includes layout styles for the docsify theme. Prism plugins and their stylesheets are loaded separately.

## Installation

Load the plugin from jsDelivr after docsify.

Add the stylesheets **after your docsify theme** and the scripts **after docsify**. The following example enables all three features:

<!-- prettier-ignore -->
```html
<!-- In <head>, after your docsify theme -->
<link rel="stylesheet" href="//cdn.jsdelivr.net/npm/prismjs@1/plugins/line-numbers/prism-line-numbers.min.css" />
<link rel="stylesheet" href="//cdn.jsdelivr.net/npm/prismjs@1/plugins/line-highlight/prism-line-highlight.min.css" />
<link rel="stylesheet" href="//cdn.jsdelivr.net/npm/prismjs@1/plugins/diff-highlight/prism-diff-highlight.min.css" />

<!-- At the end of <body> -->
<script src="//cdn.jsdelivr.net/npm/docsify@5/dist/docsify.min.js"></script>
<script src="//cdn.jsdelivr.net/npm/@sy-records/docsify-prism@1/dist/index.min.js"></script>
<script src="//cdn.jsdelivr.net/npm/prismjs@1/plugins/line-numbers/prism-line-numbers.min.js"></script>
<script src="//cdn.jsdelivr.net/npm/prismjs@1/plugins/line-highlight/prism-line-highlight.min.js"></script>
<script src="//cdn.jsdelivr.net/npm/prismjs@1/components/prism-diff.min.js"></script>
<script src="//cdn.jsdelivr.net/npm/prismjs@1/plugins/diff-highlight/prism-diff-highlight.min.js"></script>
```

If your site already loads docsify, keep that script and add the plugin scripts after it. Load these scripts before the page initializes, in the order shown, without `async`.

Only include the resources for the features you use:

| Feature           | Prism resources                                   |
| ----------------- | ------------------------------------------------- |
| Line numbers      | `line-numbers` JS and CSS                         |
| Line highlighting | `line-highlight` JS and CSS                       |
| Code diffs        | `prism-diff.js`, plus `diff-highlight` JS and CSS |

For language-specific highlighting, load the corresponding Prism language definition after docsify and before page initialization. JavaScript, CSS, and markup are available in docsify by default.

## Usage

### Line numbers

Add `:class="line-numbers"` to a code fence:

````markdown
```js :class="line-numbers"
const count = 2;
console.log(count);
```
````

To enable line numbers throughout the page, add `class="line-numbers"` to `<body>`. Use `:class="no-line-numbers"` on an individual fence to opt out.

### Line highlighting

Use `:data-line` to select individual lines or inclusive ranges. Line numbers start at 1.

````markdown
```js :data-line="1,3-4"
const count = 2;

console.log(count);
console.log(count * 2);
```
````

Line highlighting works with or without the Line Numbers plugin. Without line numbers, labels appear in a separate gutter to the left of the code. Invalid ranges are ignored, and ranges extending beyond the code are limited to existing lines.

### Code diffs

Use `diff-` followed by a Prism language name, and add `:class="diff-highlight"`:

````markdown
```diff-javascript :class="diff-highlight"
-const count = 1;
+const count = 2;
 console.log(count);
```
````

Prefix added lines with `+`, deleted lines with `-`, and unchanged lines with a space. Added and deleted lines receive green and red backgrounds while retaining syntax highlighting.

Prism aliases such as `diff-js` are supported. Use `diff` for a plain diff without language-specific highlighting. The diff markers must be supplied in the Markdown; the plugin does not calculate differences between two versions.

### Combining features

````markdown
```diff-js :class="line-numbers diff-highlight" :data-line="3"
-const count = 1;
+const count = 2;
 console.log(count);
```
````

The supported fence options are `:class` and `:data-line`. Values may be double-quoted, single-quoted, or unquoted when they contain no spaces. Other attributes are ignored.

## Configuration

The plugin registers itself and is enabled by default. Set options in your existing docsify configuration, before loading docsify:

```js
window.$docsify = {
  prism: true,
};
```

| Setting                   | Behavior                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| Omitted or `prism: true`  | Enable the plugin and its theme compatibility styles.                                      |
| `prism: false`            | Disable the plugin.                                                                        |
| `prism: { style: false }` | Enable the plugin without injecting its compatibility styles. Provide your own layout CSS. |

The `style` option controls this plugin's layout styles. Prism's plugin stylesheets are still required for line numbers, highlight labels, and diff backgrounds.

### Dynamic content

Code blocks are processed automatically after each docsify page renders. For code blocks inserted manually inside `.markdown-section`, call:

```js
window.DocsifyPrism.applyHighlighting();
```

The method processes new `<pre data-lang="…"><code>…</code></pre>` elements. Elements already processed by this plugin are skipped to avoid duplicate decorations. Replace a processed element before applying highlighting to changed content.

## Development

Use Node.js 20.11 or later. From the project directory:

```sh
npm install
npm run build
npm test
```

The build produces:

- `dist/index.js` — readable browser script.
- `dist/index.min.js` — minified browser script.

Run `npm run build` after changing the source to update the files used by the demo and browser tests.

### Local demo

The demo server needs a docsify installation. Either install docsify locally:

```sh
npm install --no-save docsify@5
npm run dev
```

Or point it to an existing docsify checkout with built JavaScript and theme files in `dist/`:

```sh
DOCSIFY_ROOT=/absolute/path/to/docsify npm run dev
```

Open [http://127.0.0.1:4174](http://127.0.0.1:4174). The demo covers individual and combined features.

### Tests

Run unit tests with `npm test`. To run the browser tests, install Chromium once:

```sh
npx playwright install chromium
npm run test:e2e
```

When using a docsify checkout instead of a local installation:

```sh
DOCSIFY_ROOT=/absolute/path/to/docsify npm run test:e2e
```

Stop the demo server before running browser tests; the test runner starts its own server on port 4174. The tests cover desktop and mobile layouts, line label positioning, navigation, delayed loading, empty blocks, invalid options, missing plugins, and the minified build.

### Packaging

Inspect the package contents before publishing:

```sh
npm pack --dry-run
```

The package name is `@sy-records/docsify-prism`. The package includes the two files in `dist/`, the README, the license, and package metadata.

## License

[MIT](LICENSE)
