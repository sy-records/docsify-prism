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

## Examples

See [Examples](examples) for Markdown syntax and live output, including line numbers, line highlighting, code diffs, and combined features.

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

See [Development](development) to build the plugin, run the demo, execute tests, and inspect the package.
