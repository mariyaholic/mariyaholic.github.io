# papers hand-off

Open `TODO(finish)` markers: 3, all in `papers/cubic-acute-sets/index.html`. All three wait for the Zenodo record of the cubic acute sets preprint.

1. `<head>`: uncomment `citation_doi` and `citation_pdf_url` and put in the real record number.
2. `.actions` list: give the PDF, Zenodo record and archive links their real `href`. Remove `aria-disabled="true"` and the `todo` class.
3. Cite section: replace "DOI pending" in the text and BibTeX forms with the DOI (add `doi = {...}` to the BibTeX).

Owner decisions (not markers):

- `noindex` is on the paper page and `papers/index.html`, as on every page. Google Scholar does not index these pages until it is removed.
- The PDF is not copied into this repository. Its abstract and provenance paragraph name the AI tools used, and the repository rule says no committed file names an AI model or vendor. The page links to Zenodo instead. Copy the PDF in only if the owner allows that exception (Google Scholar prefers a PDF on the same site).
- The primary navigation of the main look does not have a Papers link yet. `sitemap.html` and the docs hub link to it.

Accept: `grep -rn "TODO(finish)" papers/` prints nothing, and each link on the paper page opens the published file.
