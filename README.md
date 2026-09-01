# NumberWalk

NumberWalk is a small mobile-first web app for surveying the real-world positions of house numbers while walking a street and then working through those observations as a Google Maps edit queue.

It is a **field capture and workflow aid**. It does not sign in to Google and does not submit edits automatically. Google Maps edits are still made manually by the person using Google Maps, under that person's signed-in Google account.

## v0.7 field workflow

The survey screen is designed to leave as much of an iPhone screen as possible for the aerial map.

- The map can be rotated with the left/right rotation buttons or with a two-finger rotate gesture. **N** returns to north-up.
- The map opens at high zoom when GPS is centred so individual buildings remain usable while the larger map area gives street context.
- Every saved NumberWalk record is labelled on the survey map, not only records from the current street session.
- The compact house-number box still supports manual typing and `−` / `+` one-number adjustment.
- **Next** controls what happens after **SAVE & NEXT HOUSE**: `−2`, `−1`, `0`, `+1`, or `+2`.
- Notes and reference-photo capture have been removed from the field screen to reduce clutter.
- The Queue screen has **Email / share backup**. On supported iPhones this opens the system share sheet with a CSV attachment; choose Mail to email it to yourself. The CSV includes each address, surveyed coordinates, submission status, a Google Maps address link and a surveyed-pin link.

Existing records created by earlier NumberWalk versions remain compatible.

## Typical use

1. Open NumberWalk on the phone and allow precise location.
2. Start a street session and enter the street/locality once.
3. Set the first house number and choose the usual post-save step.
4. Rotate the map to match the direction you are walking if useful.
5. Tap the centre of the correct building on the aerial image.
6. Press **SAVE & NEXT HOUSE**.
7. Adjust the number manually or change the post-save step whenever the numbering pattern changes.
8. Use **Compare Google** only when you want to see Google's geocoded position for an address.
9. Open the Queue later and submit corrections manually in Google Maps.
10. For a long survey, use **Email / share backup** periodically.

## Hosting on GitHub Pages

This repository contains static HTML, CSS and JavaScript. No build step or server is required.

1. Create a GitHub repository.
2. Put `index.html`, `app.js`, `styles.css`, `sw.js`, `manifest.webmanifest`, and the `icons/` folder at the repository root.
3. In **Settings → Pages**, deploy from `main` and `/(root)`.
4. Open `https://USERNAME.github.io/REPOSITORY/`.
5. On iPhone, Safari **Share → Add to Home Screen** can install it as a PWA-like Home Screen app.

HTTPS is required for normal browser geolocation.

For stronger browser-storage isolation, use a dedicated custom hostname rather than sharing the whole `USERNAME.github.io` origin with unrelated projects.

## Optional Google comparison

Surveying works without a Google API key. **Compare Google** uses Google's browser-side Maps JavaScript API Geocoding Service.

If enabling it:

- create your own Google Maps Platform browser key;
- restrict it to the website(s) hosting your copy of NumberWalk;
- restrict it to the Maps JavaScript API and Geocoding API only;
- disable unused Google APIs;
- monitor API usage;
- keep NumberWalk's local daily comparison limit enabled as an additional accidental-use guard.

See `GOOGLE_API_SETUP.md`.

### API-key storage

The API key is kept in `sessionStorage` by default and normally disappears when that browser session ends. **Remember API key on this device** deliberately persists it in browser storage. NumberWalk never adds the user's API key, Google account name, Google password or OAuth credentials to the repository.

Browser Maps API keys are client-side identifiers and can be observed while in use; Google Cloud website and API restrictions are therefore essential.

## Local data and backups

NumberWalk has no application backend. Survey records and queue status are stored locally in the browser on the device.

Closing the page normally does **not** erase browser storage, but clearing Safari/site data can. The CSV share/export is therefore useful for longer surveys. The CSV is generated locally in the browser and is only sent somewhere if the user chooses a destination in the share sheet/email client.

Normal map use still requests tiles from Esri/OpenStreetMap. Pressing **Compare Google** sends the current address to Google. Opening a queue item sends that address to Google Maps through the Maps URL.

See `PRIVACY.md` and `SECURITY.md` for details.

## Dependencies and external services

- Leaflet 1.9.4 (pinned; SRI protected)
- `@tomickigrzegorz/leaflet-rotate` 0.2.4 (pinned) for map bearing and touch rotation
- Esri World Imagery
- OpenStreetMap tiles
- optional Google Maps JavaScript API / Geocoding Service
- Google Maps website for manual edit submission

The rotation plugin is MIT licensed and has no package dependencies at version 0.2.4. It is loaded from a pinned unpkg URL; see `SECURITY.md` for the remaining supply-chain consideration.

## Public forks

If you fork NumberWalk:

- create and restrict your own Google API key rather than copying somebody else's;
- never commit API keys, passwords, OAuth credentials, survey exports or personal data;
- update Google Cloud website restrictions to your deployment hostname;
- retain attribution required by the map providers and third-party libraries;
- test GPS, rotation and the iPhone share-sheet backup from the actual HTTPS deployment.

## Disclaimer

NumberWalk is an independent utility and is not affiliated with or endorsed by Google, Esri, OpenStreetMap or Leaflet. Address edits are submitted to and reviewed by Google under Google's own policies.


## v0.8 — compare both locations in Google Maps
Queue entries now have two Google actions. **Show both positions** opens Google Maps with Google's geocoded position and the NumberWalk surveyed position visible together as the two endpoints of a short walking-directions view. **Edit address** opens the normal address listing so you can submit the correction. If you used Compare Google before saving a house, that Google coordinate is stored with the record. Older records are geocoded once on demand (subject to the local API-call limit) and the result is then stored. CSV backups now include the Google coordinate and comparison-map link when available.


## FindMyAddress support

NumberWalk v0.9 adds **Check official address** links to the Survey and Queue screens.

The button opens the official GeoPlace/Ordnance Survey-backed FindMyAddress website in a new browser tab. This is intended for occasional cases where a house number or official address is unclear.

NumberWalk deliberately does **not** scrape, automate, proxy, or attempt to bypass FindMyAddress's published personal-use search limit. You perform the lookup directly on FindMyAddress and can then return to NumberWalk to record the correct number/address.

No NumberWalk survey record, GPS coordinate, Google API key, or account credential is automatically sent to FindMyAddress.


## v0.10 field refinements
The locate button now centres at zoom 19 rather than zoom 20, avoiding unavailable aerial imagery at excessive zoom. Settings → Privacy & local data now has two deletion options: **Clear survey data** removes surveyed house records while preserving the Google API key and settings; **Clear all NumberWalk data** removes surveys, settings and API-key storage.


## v0.12 zoom behaviour
The Survey and Review maps now support half-step zoom levels (`zoomSnap: 0.5`, `zoomDelta: 0.5`). The Locate control centres the survey map at zoom 18.5.
