# Development

Use Node.js 20.11 or later. From the project directory:

```sh
npm install
npm run build
npm test
```

The build produces:

- `dist/index.js` — readable browser script.
- `dist/index.min.js` — minified browser script.

`npm run dev` automatically builds the plugin before starting the demo server. If you change the source while the server is running, run `npm run build` and refresh the page, or restart `npm run dev`.

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

Run unit tests with `npm test`. Browser tests use the files in `dist/` and do not build automatically. Install Chromium once, then build the plugin before running browser tests:

```sh
npx playwright install chromium
npm run build
npm run test:e2e
```

When using a docsify checkout instead of a local installation:

```sh
npm run build
DOCSIFY_ROOT=/absolute/path/to/docsify npm run test:e2e
```

Stop the demo server before running browser tests; the test runner starts its own server on port 4174. The tests cover desktop and mobile layouts, line label positioning, navigation, delayed loading, empty blocks, invalid options, missing plugins, and the minified build.

### Packaging

Inspect the package contents before publishing:

```sh
npm pack --dry-run
```

The package name is `@sy-records/docsify-prism`. The package includes the two files in `dist/`, the README, the license, and package metadata.
