# Examples

Each example includes the Markdown source and its rendered output. This demo loads the three supported Prism plugins; your site only needs the resources for the features you use.

## Line numbers

Add `:class="line-numbers"` to a code fence. Blank lines are numbered too.

**Markdown**

````markup
```js :class="line-numbers"
const count = 2;

console.log(count);
```
````

**Result**

```js :class="line-numbers"
const count = 2;

console.log(count);
```

To number all code blocks, add `class="line-numbers"` to `<body>`. Use `:class="no-line-numbers"` to opt out on an individual block.

## Line highlighting

Use `:data-line` to highlight individual lines or inclusive ranges. Line numbers start at 1. This example highlights lines 1, 3, and 4 without enabling line numbers.

**Markdown**

````markup
```js :class="no-line-numbers" :data-line="1,3-4"
const count = 2;

console.log(count);
console.log(count * 2);
```
````

**Result**

```js :class="no-line-numbers" :data-line="1,3-4"
const count = 2;

console.log(count);
console.log(count * 2);
```

The labels sit in the left gutter, separate from the code. Line highlighting also works with line numbers enabled. Invalid ranges are ignored, and ranges extending beyond the code are limited to existing lines.

## Code diffs

Use `diff-` followed by the language name, plus `:class="diff-highlight"`. Prefix added lines with `+`, deleted lines with `-`, and unchanged lines with a space.

**Markdown**

````markup
```diff-javascript :class="diff-highlight"
-const count = 1;
+const count = 2;
 console.log(count);
```
````

**Result**

```diff-javascript :class="diff-highlight"
-const count = 1;
+const count = 2;
 console.log(count);
```

Added and deleted lines use green and red backgrounds while retaining JavaScript syntax highlighting. Load the Diff language definition and the Diff Highlight plugin, along with the base language definition when it is not included in docsify.

Use `diff` for a plain diff without language-specific highlighting. The plugin displays the markers you provide; it does not calculate differences between two versions.

## Combining features

List multiple classes in `:class` and add `:data-line` to combine line numbers, diff highlighting, and selected lines. `diff-js` is an alias for `diff-javascript`.

**Markdown**

````markup
```diff-js :class="line-numbers diff-highlight" :data-line="3"
-const count = 1;
+const count = 2;
 console.log(count);
```
````

**Result**

```diff-js :class="line-numbers diff-highlight" :data-line="3"
-const count = 1;
+const count = 2;
 console.log(count);
```

## Fence options

- `:class` applies one or more classes to a code block, such as `:class="line-numbers diff-highlight"`.
- `:data-line` selects individual lines or inclusive ranges, such as `:data-line="1,3-4"`.

Values may use double quotes, single quotes, or no quotes when they contain no spaces. Other attributes are ignored.

## Empty blocks

An empty code block remains empty, even when line numbers or line highlighting are requested.

**Markdown**

````markup
```js :class="line-numbers" :data-line="1"

```
````

**Result**

```js :class="line-numbers" :data-line="1"

```
