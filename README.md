# Wikipedia Simple Switcher

A small Firefox extension that shows a bottom-right **Simple English** button on Wikipedia articles when a Simple English Wikipedia version exists.

## What it does

- Runs only on Wikipedia article pages.
- Does not run on Simple English Wikipedia itself.
- Skips non-article namespaces such as `Special:`, `Talk:`, `File:`, and `Category:`.
- Uses Wikipedia language links first, so it can find Simple English pages even when the title is different.
- Falls back to checking the same page title on `simple.wikipedia.org`.
- Collects no user data.

## Firefox development test

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on**.
3. Select `manifest.json` from this folder.
4. Open an English Wikipedia article.

## Build for AMO

From this folder:

```bash
npm install --global web-ext
web-ext lint
web-ext build --overwrite-dest
```

Upload the generated ZIP from `web-ext-artifacts/` to the Mozilla Add-ons Developer Hub.

## Privacy

This extension does not collect, store, sell, or transmit personal data. It only requests Wikipedia pages and Wikipedia API endpoints to check whether a Simple English article exists.

## AMO validation note

Version 1.0.1 uses `background.scripts` instead of `background.service_worker` because Firefox Manifest V3 uses background scripts/event pages as its Firefox-compatible background fallback.
