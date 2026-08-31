# NumberWalk

NumberWalk is a small, static, mobile-first web app for surveying house-number locations while walking a street. It helps a person record which building belongs to which house number, compare a surveyed building location with Google's geocoded position (optional), and keep a queue of addresses to correct manually in Google Maps.

## What NumberWalk does — and does not do

NumberWalk **does not submit edits to Google Maps** and it does not log in to a Google account. It opens an address in Google Maps; the user then makes and submits the correction in Google Maps while signed in there. Google, not NumberWalk, handles the account identity and review of the edit.

NumberWalk never asks for, receives, or stores a Google username or password.

## Typical use

1. Open NumberWalk on a phone over HTTPS and allow precise location access.
2. Start a Street Session by entering the street, locality/postcode, first house number, and odd/even/all sequence.
3. Walk to a house, identify its number, and tap/drag the marker to the centre of the correct building on the aerial map.
4. Optionally attach a reference photo or note.
5. Optionally press **Compare Google** to see how far Google's geocoded position is from the surveyed building.
6. Press **Save & Next House**. NumberWalk advances by +2 for odd/even sessions or +1 for all numbers.
7. Use **Review** to check the surveyed street.
8. In **Queue**, open each address in Google Maps and use Google's normal edit tools to correct the address/pin. Mark the item submitted in NumberWalk afterwards.

## Hosting on GitHub Pages

This repository contains only static HTML, CSS and JavaScript. No build step or server is required.

1. Create a GitHub repository.
2. Put `index.html`, `app.js`, `styles.css`, `sw.js`, `manifest.webmanifest`, and the `icons/` folder at the repository root.
3. In **Settings → Pages**, deploy from the `main` branch and `/(root)`.
4. Open the resulting `https://USERNAME.github.io/REPOSITORY/` URL.
5. On iPhone, Safari's **Share → Add to Home Screen** can install it as a PWA-like Home Screen app.

HTTPS is required for normal browser geolocation.

## Optional Google comparison

Surveying works without any Google API key. **Compare Google** uses the browser-side Maps JavaScript API Geocoding Service.

If enabling it:

- create a separate Google Maps Platform browser key for this app;
- restrict the key to the website(s) that host NumberWalk;
- restrict the key to only the Maps JavaScript API and Geocoding API;
- disable unused Google APIs in the project;
- monitor API usage;
- use NumberWalk's local daily comparison limit as an additional guard, not as a billing/security control.

See `GOOGLE_API_SETUP.md` for setup details.

### API-key storage

A browser Maps API key is **not a secret credential** in the same sense as a password: any client-side key can be observed by the browser while it is being used. Security therefore comes from Google Cloud website and API restrictions.

NumberWalk keeps the API key in `sessionStorage` by default, so it normally disappears when that browser session ends. Users can explicitly choose **Remember API key on this device**, which persists it in browser storage for convenience. The app never writes a key into the GitHub repository.

## Local data and privacy

NumberWalk has no application backend and sends no survey database to the repository owner. Street sessions, address coordinates, notes, optional reference photos, queue status and settings are stored in the browser on the user's device.

Important limitations:

- browser storage is not encrypted by NumberWalk;
- anyone with access to the unlocked device/browser may be able to view or clear it;
- on GitHub Pages project sites, storage is scoped to the whole `USERNAME.github.io` origin, not one repository path. Other pages controlled under the same origin can technically access the same origin's browser storage;
- clearing browser/site data removes NumberWalk records;
- aerial/street-map tiles are loaded from Esri and OpenStreetMap infrastructure, so those providers receive normal web requests (such as IP address and requested tile coordinates);
- pressing **Compare Google** sends the typed address to Google for geocoding;
- opening the submission link transfers the address to Google Maps in the URL/query.

For stronger origin isolation, deploy NumberWalk on a dedicated custom hostname.

## Security measures in v0.6

- no Google account credentials or OAuth tokens in the source;
- no server-side database or write API to attack;
- user-entered text is rendered using DOM text nodes rather than executable HTML in record/queue views;
- Leaflet 1.9.4 is pinned and protected with the integrity hashes published by Leaflet;
- a Content Security Policy limits scripts, connections and images to the app and required mapping services;
- the service worker caches only known **same-origin** app assets and never caches Google/Esri/OpenStreetMap cross-origin requests;
- external Google Maps windows are opened with `noopener`;
- API-key persistence is opt-in;
- reference photos are validated as images, size-limited and resized/compressed before storage;
- malformed local-storage state is handled defensively;
- a user-accessible control clears all NumberWalk local data.

See `SECURITY.md` for the audit scope and residual risks and `PRIVACY.md` for a user-readable privacy summary.

## Dependencies and external services

- Leaflet 1.9.4, loaded from unpkg with Subresource Integrity (SRI)
- Esri World Imagery tiles
- OpenStreetMap tiles
- optional Google Maps JavaScript API / Geocoding Service
- Google Maps website for manual edit submission

## Contributions

This is intentionally a small static app. Before publishing changes, avoid putting API keys, passwords, OAuth credentials, personal survey exports or other secrets into commits. Test geolocation and Google API restrictions from the actual HTTPS deployment, not from a local `file://` URL.

If you fork the project, change the Google Cloud website restriction to match **your own** deployment URL. Do not reuse somebody else's API key.

## Disclaimer

NumberWalk is an independent utility and is not affiliated with or endorsed by Google, Esri, OpenStreetMap or Leaflet. Map/address edits are ultimately submitted to and reviewed by Google under Google's own policies.
