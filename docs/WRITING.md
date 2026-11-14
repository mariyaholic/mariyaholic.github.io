# Writing and layout rules for documentation and papers

These rules apply to pages that use the document look (`css/plain.css`): project documentation in `docs/` and papers in `papers/`. The main site look (`css/site.css`) does not use these rules.

## Pilot status

| Page | Look |
|---|---|
| `docs/yozora/` | Document look |
| `docs/mh-ticker/` | Document look |
| `docs/uika-public/` | Document look |
| `docs/mariyaholic.github.io/` | Document look |
| `papers/` and `papers/<paper>/` | Document look |
| All other `docs/` pages and `docs/index.html` | Main look (not changed yet) |

To move a page to the document look, copy the page template below and move the content into it. Then rewrite the text with the language rules.

## Language rules (ASD-STE100)

Simplified Technical English (ASD-STE100) controls words and sentences so that a reader understands one meaning only.

### Words

1. Use one word for one meaning. Use the same term each time. For example, always write "control panel". Do not change to "settings window" in a different section.
2. Use simple, approved verbs: *start*, *stop*, *open*, *close*, *select*, *push*, *make*, *make sure*, *examine*, *show*, *keep*, *remove*.
3. Do not use a verb as a noun. Write "Install Yozora", not "Installation of Yozora".
4. Do not use *-ing* forms as nouns or as the start of a sentence.
5. Write the names of controls in bold, exactly as the program shows them: **Check for updates**.
6. Write file names, commands, keys and values in code: `config.json`, `npm test`, `--apply`.

### Sentences

1. Procedure sentences: 20 words or fewer.
2. Description sentences: 25 words or fewer.
3. One instruction in each sentence. One topic in each paragraph. Six sentences or fewer in each paragraph.
4. Use the active voice. Write "The installer removes the settings", not "The settings are removed".
5. Use the imperative for instructions. Write "Select **Apply**", not "You should select **Apply**".
6. Put a condition before the instruction: "If the values are different, do not run the file."
7. Keep the articles (*a*, *an*, *the*).

### Procedures

1. Give each procedure a heading that starts with a verb: "Install Yozora", "Remove Yozora".
2. Use a numbered list (`<ol class="steps">`). Write one action in each step.
3. Put a WARNING or CAUTION **before** the step that it applies to.
4. Put the result of a step in the same step, after the action: "Select **Apply**. The strip changes immediately."

### Notices

| Notice | Use it for | Markup |
|---|---|---|
| WARNING | A risk to people, to secrets or to personal data | `<div class="notice warning" role="note"><span class="label">Warning</span>...</div>` |
| CAUTION | A risk to files, settings or the system | `<div class="notice caution" role="note"><span class="label">Caution</span>...</div>` |
| NOTE | Information that helps the reader | `<div class="notice" role="note"><span class="label">Note</span>...</div>` |

A notice gives the risk and the action. Do not use a notice for general text.

### Claims

1. Write only what the source repository shows. Give the commit and the date at the bottom of the page.
2. Keep the release version and the source version separate. Do not write that a source function is in a release if it is not.
3. Do not write that a command ran on every system. Use the standard line: "The commands are from the source. This page does not claim that they ran on every system."

## Layout rules

These rules follow Google's developer documentation style guide, Material Design 3 and web.dev guidance.

1. **Headings.** Use sentence case. Use one `<h1>` on each page. Do not skip heading levels.
2. **Text width.** The reading column is 72 characters wide or less.
3. **Links.** The link text tells the reader where the link goes. Do not use "click here" or "this link".
4. **Contrast.** Body text has a contrast of 4.5:1 or more against its background, in light mode and in dark mode. The colours in `plain.css` meet this.
5. **Targets.** Navigation links are 48 px high or more.
6. **Focus.** Each link and control shows a visible focus ring.
7. **Tables.** Use `<th scope="col">` for column heads. Put a wide table in `<div class="table-wrap">` so that it scrolls on a phone, not the page.
8. **No layout shift.** Give each image a `width` and a `height`.
9. **No scripts.** Document pages do not load `site.js` or any other script.
10. **No external requests.** Use system fonts. Do not load web fonts, analytics or embeds.

## Page template (documentation)

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<meta name="description" content="One sentence: what the reader can do with this page.">
<title>PROJECT documentation | mariyaholic</title>
<link rel="icon" href="../../favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="../../css/plain.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="bar"><div class="bar-in">
  <a class="site" href="../../index.html">mariyaholic</a>
  <nav aria-label="Sections"><a href="../" aria-current="page">Docs</a><a href="../../papers/">Papers</a><a href="../../works.html">Portfolio</a></nav>
</div></header>
<nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="../">Docs</a></li><li><span aria-current="page">PROJECT</span></li></ol></nav>
<div class="page has-toc">
<main id="main" class="doc">
<h1>PROJECT</h1>
<p class="lede">Two or three sentences: what the program is and what it does.</p>
<dl class="facts">
  <dt>Platform</dt><dd>...</dd>
  <dt>Latest release</dt><dd>...</dd>
  <dt>Source</dt><dd>..., commit <code>...</code></dd>
  <dt>License</dt><dd>...</dd>
</dl>
<h2 id="install">Install PROJECT</h2>
<ol class="steps"><li>...</li></ol>
<!-- Then: use, settings, build from source, limits, release changes, reference. -->
<p class="meta">Last checked DATE against source commit <code>...</code>. The commands are from the source. This page does not claim that they ran on every system.</p>
</main>
<nav class="toc" aria-labelledby="toc-h"><h2 id="toc-h">On this page</h2><ol>
  <li><a href="#install">Install</a></li>
</ol></nav>
</div>
<footer class="foot"><span>mariyaholic · Documentation</span><span><a href="../../sitemap.html">Index</a> · <a href="../../colophon.html">Colophon</a></span></footer>
</body>
</html>
```

### Section order

1. Title, lede and facts
2. Install (or "Preview" for a website)
3. Set up and use: one section for each task, each with a verb heading
4. Settings
5. Build from source
6. Limits
7. Release changes (newest first; "Added", "Changed", "Fixed", "Removed")
8. Reference (links to the source documents)

## Paper pages

A paper page is a landing page for one paper. The PDF is the full text. These rules follow the Google Scholar inclusion guidelines and schema.org.

1. Give each paper its own folder: `papers/<short-name>/index.html`.
2. Show the full title, the authors, the date, the publication type and the abstract on the page as text.
3. Add Google Scholar `citation_*` meta tags: `citation_title`, `citation_author`, `citation_publication_date`, `citation_pdf_url`, plus `citation_doi` when the DOI exists.
4. Add one `ScholarlyArticle` JSON-LD block with the same data.
5. Give a "Cite" section with BibTeX and one plain text form.
6. Link the PDF, the DOI and the archive. Write the file type and size in the link text, for example "PDF, 440 KB".
7. Do not add the main-site look, animation or personal labels to a paper page.

### Indexing

Google Scholar and Google Search do not index a page that has `noindex`. The site has `noindex` on all pages now. A paper page can be found in Google Scholar only after the owner removes `noindex` from that page and from `papers/index.html`.
