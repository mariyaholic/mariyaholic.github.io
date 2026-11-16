-- Click counter tables (Cloudflare D1, SQLite).
-- No raw IP address or user agent is stored. "visitor" is a keyed hash that cannot be reversed without the SALT secret.

CREATE TABLE IF NOT EXISTS uniques (
  link       TEXT NOT NULL,
  visitor    TEXT NOT NULL,
  first_seen TEXT NOT NULL,
  PRIMARY KEY (link, visitor)
);

CREATE TABLE IF NOT EXISTS totals (
  link       TEXT PRIMARY KEY,
  clicks     INTEGER NOT NULL DEFAULT 0,
  first_seen TEXT NOT NULL,
  last_seen  TEXT NOT NULL
);
