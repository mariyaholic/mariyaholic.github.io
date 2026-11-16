# Paper click counter

This counter records clicks on the download and repository links of the paper pages. It shows, for each link, the total number of clicks and the number of unique visitors.

It has two parts:

| Part | File | Where it runs |
|---|---|---|
| Page script | `js/track.js` | In the browser, on paper pages only |
| Counter | `tools/click-counter/worker.js` | Cloudflare Workers, with a Workers KV namespace |

GitHub Pages cannot receive data, so the counter runs on Cloudflare. The free plan is sufficient.

## What is counted

- Each link that has a `data-track` attribute, for example `data-track="cubic-acute-sets/pdf"`. The name is `<paper>/<link>`.
- **Clicks**: all clicks. The page script sends one click for each link for each page view.
- **Unique visitors**: the number of different visitors who clicked the link. A visitor is a keyed hash of the IP address and the browser identification. The same person on a different network or browser counts as a new visitor, so this number is an approximation.

## What is not stored or sent

- No cookies and no browser storage.
- No raw IP address or browser identification. The KV namespace keeps only a hash that cannot be reversed without the `SALT` secret.
- Nothing from browsers that send Global Privacy Control or Do Not Track.
- No clicks from crawlers and other automated clients.
- No clicks that do not come from the site (the `Origin` must be in `ALLOWED_ORIGINS`).

## Current installation

| Item | Value |
|---|---|
| Counter address | `https://paper-clicks.guimauveqt.workers.dev` |
| Worker name | `paper-clicks` |
| KV namespace | `paper-clicks` (`4ad08d1541784f1591e69d88042c687f`) |
| Secrets | `SALT`, `STATS_TOKEN` (set; the values are not in this repository) |

The owner keeps the `STATS_TOKEN` value in a password manager.

## Install the counter again

Use these steps only for a new installation, for example in a different Cloudflare account.

Requirements: a Cloudflare account and Node.js 22 or later. An API token needs the "Edit Cloudflare Workers" template permissions (Workers Scripts and Workers KV Storage).

1. Install the Cloudflare command-line tool and sign in:
   ```sh
   npm install -g wrangler
   wrangler login
   ```
2. Go to this folder:
   ```sh
   cd tools/click-counter
   ```
3. Make the KV namespace:
   ```sh
   wrangler kv namespace create paper-clicks
   ```
4. Copy the `id` that the command shows into the `[[kv_namespaces]]` block of `wrangler.toml`.
5. Set the two secrets. Use long random values. Keep them out of the repository.
   ```sh
   wrangler secret put SALT
   wrangler secret put STATS_TOKEN
   ```
6. Deploy:
   ```sh
   wrangler deploy
   ```
   The command shows the counter address, for example `https://paper-clicks.<account>.workers.dev`.
7. On each paper page, put the counter address in the `click-endpoint` meta tag:
   ```html
   <meta name="click-endpoint" content="https://paper-clicks.<account>.workers.dev">
   ```
8. Commit the change. Open a paper page and click the PDF button. Then read the counts (next section).

> **Caution:** Do not change `SALT` after the counter starts. A new value makes every earlier visitor count again as a new visitor.

## Read the counts

```sh
curl -H "Authorization: Bearer <STATS_TOKEN>" https://paper-clicks.guimauveqt.workers.dev/stats
```

The result looks like this:

```json
{
  "generated_at": "2026-11-16T09:00:00.000Z",
  "links": [
    { "link": "cubic-acute-sets/pdf", "clicks": 12, "first_seen": "…", "last_seen": "…", "unique_visitors": 9 }
  ]
}
```

## Add a link to the count

1. Add `data-track="<paper>/<link>"` to the link. Use lowercase letters, digits and hyphens only.
2. Make sure that the page has the `click-endpoint` meta tag and loads `js/track.js`.

## Test the counter

```sh
node test.mjs
```

The test uses an in-memory copy of the KV calls. It needs no Cloudflare account.

## Limits

- The page script cannot see "Save link as" from the context menu. Those downloads are not counted.
- Zenodo counts its own views and downloads on the record page. Those numbers include visitors who did not come from this site.
- Workers KV is eventually consistent. New counts can take up to about a minute to show in `/stats`, and two clicks at the same moment on one link can count as one click.
- The free Workers plan allows 1,000 KV writes each day. Each click uses one or two writes, so the counter records about 500 clicks each day before it stops counting until the next day.
