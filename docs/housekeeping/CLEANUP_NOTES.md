Project cleanup (2025-08-10)

Removed unused assets to keep the bundle and repo tidy:

- public/sw-disabled.js — not referenced; service worker already disabled/unregistered in index.html and public/sw.js is a no-op.
- public/offline.html — unused offline page; no references from index.html or redirects.

Notes:
- manifest.json and icons are kept (referenced by index.html and netlify.toml).
- sw.js remains as a no-op to satisfy platform references and avoid caching issues.

If you re-enable PWA in the future, reintroduce an actual service worker and offline page and wire them in index.html and netlify config.
