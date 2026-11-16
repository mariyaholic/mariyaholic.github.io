# papers hand-off

## Open marker

`TODO(finish)` in `papers/cubic-acute-sets/index.html`: the `click-endpoint` meta tag is empty. Deploy the counter with the steps in `tools/click-counter/README.md`, then put its address in the tag.

Accept: a click on the PDF button shows up in `GET /stats`. Until then, the page sends nothing.

## Part I (`papers/cubic-acute-sets/`)

- DOI: `10.5281/zenodo.24210870` (record `https://zenodo.org/records/24210870`).
- The PDF is on this site: `papers/cubic-acute-sets/cubic-acute-sets.pdf`, copied from commit `75b994a` of the paper repository (the build uploaded to Zenodo). `citation_pdf_url` points at this copy.
- The archive link uses the file name from the release plan, `cubic-acute-sets-v1.0.0.zip`. Open it once on the live page. If the name on the record is different, change its `href`.
- The paper pages have no `noindex`. `robots.txt` points to `sitemap.xml`, which lists `papers/` and `papers/cubic-acute-sets/`.
- Clicks on the PDF, Zenodo and archive links have `data-track` names `cubic-acute-sets/pdf`, `cubic-acute-sets/zenodo` and `cubic-acute-sets/archive`.

## Part II

On hold until it is published. See pull request #15.
