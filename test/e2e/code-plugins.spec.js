const { test, expect } = require("@playwright/test");
const path = require("node:path");

const fence = (info, code = "") => `\`\`\`${info}\n${code}\n\`\`\``;
const source = "-const count = 1;\n+const count = 2;\n console.log(count);";
const plugins = ["line-numbers", "line-highlight", "diff-highlight"];

async function initSite(
  page,
  {
    markdown,
    enabled = plugins,
    inherited = false,
    waitForMarkdown,
    bridge = true,
  } = {},
) {
  await page.route("**/README.md", async (route) => {
    await waitForMarkdown;
    await route.fulfill({ body: markdown });
  });
  await page.route("**/next.md", (route) =>
    route.fulfill({
      body: "# Next\n\n" + markdown + "\n\n[Home](/)",
    }),
  );
  await page.route("**/code-plugins.html", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><html><head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link rel="stylesheet" href="/docsify/themes/core.css">
      ${enabled.map((name) => `<link rel="stylesheet" href="/node_modules/prismjs/plugins/${name}/prism-${name}.css">`).join("")}
      </head><body class="${inherited ? "line-numbers" : ""}"><div id="app"></div>
      <script>window.$docsify = { basePath: '/', auto2top: true };</script>
      <script src="/docsify/docsify.js"></script>
      ${bridge ? '<script src="/dist/index.js"></script>' : ""}
      ${enabled.includes("diff-highlight") ? '<script src="/node_modules/prismjs/components/prism-diff.js"></script>' : ""}
      ${enabled.map((name) => `<script src="/node_modules/prismjs/plugins/${name}/prism-${name}.js"></script>`).join("")}
      </body></html>`,
    }),
  );
  await page.goto("/code-plugins.html");
  await expect(page.locator("#main pre").first()).toBeVisible();
}

for (const width of [1280, 375]) {
  test(`Prism plugins combine, scroll and survive navigation at ${width}px`, async ({
    page,
  }, testInfo) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    const longSource =
      source + '\n+console.log("' + "long code ".repeat(30) + '");';
    await initSite(page, {
      markdown:
        "# Code plugins\n\n" +
        fence(
          'diff-js :class="line-numbers diff-highlight" :data-line="2"',
          longSource,
        ) +
        "\n\n[Next](next)",
    });
    const pre = page.locator("#main pre");
    await expect(pre.locator(".line-numbers-rows > span")).toHaveCount(4);
    await expect(pre.locator(".line-highlight")).toHaveCount(1);
    await expect(pre.locator(".inserted .keyword").first()).toHaveText("const");
    await expect(pre.locator(".deleted .keyword")).toHaveText("const");
    await expect(pre.locator(".inserted:not(.prefix)").first()).toHaveCSS(
      "background-color",
      "rgba(0, 255, 128, 0.1)",
    );
    await expect(pre.locator(".deleted:not(.prefix)")).toHaveCSS(
      "background-color",
      "rgba(255, 0, 0, 0.1)",
    );

    const row = await pre
      .locator(".line-numbers-rows > span")
      .nth(1)
      .boundingBox();
    const highlight = await pre.locator(".line-highlight").boundingBox();
    const insertion = await pre
      .locator(".inserted:not(.prefix)")
      .first()
      .boundingBox();
    expect(Math.abs(row.y - highlight.y)).toBeLessThan(1);
    expect(Math.abs(row.height - highlight.height)).toBeLessThan(1);
    expect(Math.abs(row.y - insertion.y)).toBeLessThan(1);
    expect(await pre.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(
      true,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath("code-plugins.png"),
      fullPage: true,
    });
    await pre.evaluate((el) => {
      el.scrollLeft = 200;
    });
    expect(await pre.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);

    await page.getByRole("link", { name: "Next", exact: true }).click();
    await expect(page.locator("#main h1").first()).toHaveText("Next");
    await expect(pre.locator(".line-numbers-rows")).toHaveCount(1);
    await expect(pre.locator(".line-highlight")).toHaveCount(1);
    await page.getByRole("link", { name: "Home", exact: true }).click();
    await expect(page.locator("#main h1").first()).toHaveText("Code plugins");
    await expect(pre.locator(".line-numbers-rows > span")).toHaveCount(4);
    await expect(pre.locator(".line-highlight")).toHaveCount(1);
    expect(errors).toEqual([]);
  });
}

test("line highlighting works independently and ignores invalid ranges", async ({
  page,
}, testInfo) => {
  await initSite(page, {
    enabled: ["line-highlight"],
    markdown: fence(
      'js :data-line="1,3,2-99,42,0,3-1,bad" :onclick="alert(1)"',
      "const a = 1;\nconst b = 2;\nconsole.log(count);",
    ),
  });
  const pre = page.locator("#main pre");
  await expect(pre).toHaveAttribute("data-lang", "js");
  await expect(pre).not.toHaveAttribute("onclick");
  await expect(pre.locator(".keyword")).toHaveCount(2);
  await expect(pre.locator(".line-highlight")).toHaveCount(3);
  await expect(pre.locator(".line-numbers-rows")).toHaveCount(0);
  for (const width of [1280, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await page.reload();
    await expect(pre.locator(".line-highlight")).toHaveCount(3);
    const code = await pre.locator("code").boundingBox();
    const highlight = await pre
      .locator(".line-highlight")
      .first()
      .boundingBox();
    expect(Math.abs(code.y - highlight.y)).toBeLessThan(1);
    const badgeRight = await pre
      .locator('.line-highlight[data-range="3"]')
      .evaluate((el) => {
        const style = getComputedStyle(el, "::before");
        return (
          el.getBoundingClientRect().x +
          parseFloat(style.left) +
          parseFloat(style.width) +
          parseFloat(style.paddingLeft) +
          parseFloat(style.paddingRight)
        );
      });
    expect(badgeRight).toBeLessThan(code.x);
    await page.screenshot({
      path: testInfo.outputPath(`line-highlight-only-${width}.png`),
      fullPage: true,
    });
    const dimensions = await pre.evaluate((el) => ({
      scroll: el.scrollWidth,
      client: el.clientWidth,
    }));
    expect(dimensions.scroll, JSON.stringify(dimensions)).toBeLessThanOrEqual(
      dimensions.client,
    );
  }
});

test("inherited line numbers allow opt-out and empty blocks", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await initSite(page, {
    inherited: true,
    markdown: [
      fence("js", "const a = 1;"),
      fence("js :class=no-line-numbers", "const b = 2;"),
      fence("js :class=line-numbers :data-line=1"),
    ].join("\n\n"),
  });
  const blocks = page.locator("#main pre");
  await expect(blocks.nth(0).locator(".line-numbers-rows > span")).toHaveCount(
    1,
  );
  await expect(blocks.nth(1).locator(".line-numbers-rows")).toHaveCount(0);
  await expect(blocks.nth(2).locator("code")).toHaveText("");
  await expect(blocks.nth(2).locator(".line-highlight")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("missing plugins preserve readable, escaped code", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await initSite(page, {
    enabled: [],
    markdown:
      fence(
        'diff-js :class="line-numbers diff-highlight" :data-line="1"',
        source,
      ) +
      "\n\n" +
      fence("unknown :data-line=bad", "<img src=x onerror=alert(1)>"),
  });
  await expect(page.locator("#main pre").first().locator("code")).toHaveText(
    source,
  );
  await expect(page.locator("#main pre").nth(1).locator("code")).toHaveText(
    "<img src=x onerror=alert(1)>",
  );
  await expect(page.locator("#main pre img")).toHaveCount(0);
  await expect(
    page.locator("#main .line-numbers-rows, #main .line-highlight"),
  ).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("initializes plugins when the first Markdown response arrives late", async ({
  page,
}) => {
  let release;
  const waitForMarkdown = new Promise((resolve) => {
    release = resolve;
  });
  const requested = page.waitForRequest("**/README.md");
  const ready = initSite(page, {
    waitForMarkdown,
    markdown: fence(
      "js :class=line-numbers :data-line=1",
      "const ready = true;",
    ),
  });
  await requested;
  await expect(page.locator("#main pre")).toHaveCount(0);
  release();
  await ready;
  await expect(page.locator("#main .line-numbers-rows > span")).toHaveCount(1);
  await expect(page.locator("#main .line-highlight")).toHaveCount(1);
});

test("plain diffs and unloaded base languages retain diff highlighting", async ({
  page,
}) => {
  await initSite(page, {
    enabled: ["diff-highlight"],
    markdown:
      fence("diff :class=diff-highlight", "-before\n+after") +
      "\n\n" +
      fence("diff-python :class=diff-highlight", "-print(1)\n+print(2)"),
  });
  await expect(page.locator("#main .inserted:not(.prefix)")).toHaveCount(2);
  await expect(page.locator("#main .deleted:not(.prefix)")).toHaveCount(2);
});

test("without the Docsify plugin, ordinary code rendering stays unchanged", async ({
  page,
}) => {
  await initSite(page, {
    bridge: false,
    enabled: [],
    markdown:
      fence("js", "const answer = 42;") +
      "\n\n" +
      fence("js :class=line-numbers :data-line=1", "const answer = 42;"),
  });
  const blocks = page.locator("#main pre");
  await expect(blocks.first()).toHaveAttribute("data-lang", "js");
  await expect(blocks.first()).toHaveClass("language-js");
  await expect(blocks.first().locator(".keyword")).toHaveText("const");
  await expect(blocks.nth(1)).not.toHaveAttribute("data-line");
  await expect(
    page.locator("#main .line-numbers-rows, #main .line-highlight"),
  ).toHaveCount(0);
});

test("the demo runs with the minified standalone bundle", async ({
  page,
}, testInfo) => {
  await page.route("**/dist/index.js", (route) =>
    route.fulfill({
      path: path.resolve(__dirname, "../../dist/index.min.js"),
      contentType: "application/javascript",
    }),
  );
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(
    page.getByRole("heading", { name: "Supported Prism plugins", exact: true }),
  ).toBeVisible();
  await page.locator('.sidebar-nav a[href="#/examples"]').click();
  await expect(page.locator("#main pre .line-numbers-rows")).toHaveCount(2);
  await expect(page.locator("#main pre .inserted:not(.prefix)")).toHaveCount(2);
  await expect(
    page.locator('#main pre[data-lang="js"].no-line-numbers .line-highlight'),
  ).toHaveCount(2);
  await page.screenshot({
    path: testInfo.outputPath("standalone-demo.png"),
    fullPage: true,
  });
  await expect(
    page.getByRole("heading", { name: "Page navigation", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator('#main a[href="#/next"]')).toHaveCount(0);
  await page.locator('.sidebar-nav a[href="#/development"]').click();
  await expect(page.locator("#main")).toContainText("npm run build");
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/?mobile=1#/examples");
  await expect(page.locator("#main pre .line-numbers-rows")).toHaveCount(2);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("docs-examples-mobile.png"),
    fullPage: true,
  });
});
