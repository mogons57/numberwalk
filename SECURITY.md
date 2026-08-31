# Security

## Audit scope

Version 0.6 was reviewed as a static browser application. The review covered credential handling, DOM injection/XSS, browser storage, service-worker caching, external scripts, map/API requests, photo handling, navigation to Google Maps and accidental Google API usage.

This is not a formal penetration test and cannot guarantee the absence of every vulnerability. The application has no backend server, login system, database or privileged write API of its own, which substantially reduces its attack surface.

## Credential model

NumberWalk must never ask for a Google username or password. Google account authentication happens only inside Google Maps after the user follows an external link.

The optional Google Maps Platform browser API key is a client-side key. Client-side API keys can be observed during normal browser use and must therefore be protected with Google Cloud restrictions. Do not treat the key like a password.

Recommended restrictions:

- Application restriction: **Websites**
- Allowed referrer: the exact HTTPS deployment origin/path appropriate to the host
- API restrictions: **Maps JavaScript API** and **Geocoding API** only
- Disable other unused APIs in the Google Cloud project

NumberWalk's local daily counter is an accidental-use guard only. Client-side JavaScript can be modified by a determined user and therefore cannot enforce a billing cap.

## Local-data risks

Survey records may include precise building coordinates, notes and reference photos. They are stored locally and are not encrypted by NumberWalk. Do not record sensitive personal information in notes or photos.

GitHub Pages project sites on the same `USERNAME.github.io` hostname share the same browser origin. For stronger separation from other web projects, use a dedicated custom hostname.

## External services

The app necessarily requests map tiles from Esri/OpenStreetMap and, when selected by the user, geocoding from Google. Those providers can receive ordinary request metadata. See `PRIVACY.md`.

## Supply-chain controls

Leaflet is pinned to 1.9.4 and loaded with Subresource Integrity hashes published by the Leaflet project. The Content Security Policy restricts executable script sources. Any dependency change should update and verify the integrity hash rather than removing it.

## Reporting a problem

Do not put real API keys, passwords, private survey data or exploit payloads containing personal data into a public GitHub issue. For non-sensitive bugs, a normal repository issue is appropriate. If maintaining a public fork, add a private security-reporting contact or enable GitHub private vulnerability reporting before accepting external security reports.
