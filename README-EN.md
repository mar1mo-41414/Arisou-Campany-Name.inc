# Arisou-Campany-Name.inc

[Japanese README →](README.md)

A web tool that generates **plausible Japanese company names**. Pick your rules (character types,
length, corporate type, industry) and press generate — you get names that feel like they exist
somewhere in Japan.

> [!NOTE]
> Everything is generated inside your browser. No server, no network.
> **A generated name may coincidentally match a real company** — that is the point of "plausible".
> Do not present a generated name as the name of a real company.

## Usage

1. Open `web/index.html` in a browser (double-clicking works).
2. Choose the rules.
3. Press generate.

To view over `http://`, start the small static server from the repository root:

```bash
python3 tools/serve.py          # http://localhost:8000/
python3 tools/serve.py --port 9000 --host 0.0.0.0
```

## Rules you can choose

| Rule | Meaning |
| --- | --- |
| Character type | Kanji / katakana / hiragana / Latin letters (multi-select; mixed names are allowed) |
| Length | Min/max length of the name body (corporate type excluded), e.g. 3–6 characters |
| Corporate type | 株式会社 / 有限会社 / 合同会社 / 合名会社 / 合資会社 / none (trade name only) |
| Position | For 株式会社 only: prefix (株式会社◯◯), suffix (◯◯株式会社), or automatic |
| Industry | Tendency of the suffix (商事, 製作所, システムズ, ホールディングス …). Unselected = all, or "no suffix" |
| Digits | Allow digits in the name (e.g. 青葉88建設) |
| Seed | Empty = a new result each press. Fill it in to lock it: same seed + same rules = same results |
| Count | 1–50 names per run |

Presets (Japanese trading house / IT & systems / global / hiragana-ish) fill in common combinations.

## Output notes

Each card shows the name, its reading (よみがな), the character count of the body, and tags
(industry, place name, mixed script). Individual names and the whole list can be copied.

The UI itself is Japanese only, on purpose: it is about Japanese company naming, and the reading
data is Japanese.

## Layout

```
web/index.html      UI
web/app.js          rule handling, rendering, copying (UI only)
web/generator.js    name generation (dependency-free; works in browsers and Node)
tests/              unit tests for generator.js (Node only, no npm packages)
tools/serve.py      static server for local checking (Python stdlib only)
docs/               how it works (Japanese)
AGENTS.md           guidance for contributors and agents (Japanese)
```

## Tests

```bash
node tests/generator.test.js
```

Node 18+. No `npm install` needed. Generation is deterministic for a given seed.

## License

MIT
