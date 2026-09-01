# Security notes

NumberWalk is deliberately a static web application with no application backend, login system or automatic Google Maps write API.

## Credential model

NumberWalk never asks for or stores a Google account username/password. Google Maps edits are submitted manually after the app opens Google Maps, so attribution is handled by the Google account signed into Google Maps.

The optional Google Maps JavaScript API key is a browser key, not a password. It is session-only by default and should always be protected in Google Cloud with both website restrictions and API restrictions. The local per-day comparison limit is only an accidental-use guard and is not a Google-enforced billing control.

## Browser protections

- Content Security Policy limits executable scripts and network/image destinations to the static app and required map providers.
- Leaflet 1.9.4 is version pinned and loaded with its published Subresource Integrity hash.
- The rotation extension is pinned to `@tomickigrzegorz/leaflet-rotate` 0.2.4 rather than an unversioned/latest URL.
- Survey text is inserted with DOM text properties in record/queue views rather than interpreted as HTML.
- External Google Maps windows use `noopener`.
- The service worker only handles/caches known same-origin NumberWalk assets; it does not cache Google, Esri, OpenStreetMap or unpkg responses.
- Local-storage parsing is defensive and corrupted state falls back to a clean app state.
- There is a user control to clear NumberWalk local data.
- Backup CSV values are CSV-escaped before export.

## Map-rotation dependency

Map rotation requires functionality that Leaflet itself does not provide. v0.7 uses the pinned MIT-licensed `@tomickigrzegorz/leaflet-rotate` 0.2.4 browser build from unpkg. This avoids an unpinned dependency but remains a third-party CDN supply-chain dependency. A future hardening step could vendor the reviewed plugin file into this repository and then remove unpkg from `script-src` for that dependency.

## Local data risks

Browser storage is not encrypted by NumberWalk. Someone with access to the unlocked device/browser may be able to inspect or erase it. On GitHub Pages, different project paths under the same `USERNAME.github.io` hostname share an origin; use a dedicated custom hostname if separation from other projects is important.

The exported CSV is deliberately readable and contains location data and Google Maps links. Email/share it only to destinations you trust.

## Scope limitations

This is a lightweight static-app review, not a formal penetration test. Browser, operating-system, CDN, map-provider and Google platform vulnerabilities remain outside NumberWalk's control. Keep third-party dependencies pinned and review changes before upgrading them.


## FindMyAddress integration

The FindMyAddress integration is intentionally link-only. NumberWalk does not scrape or call undocumented FindMyAddress endpoints, does not store FindMyAddress credentials, and does not attempt to evade usage limits. The site is opened with `noopener` to prevent the new page from controlling the NumberWalk window.
