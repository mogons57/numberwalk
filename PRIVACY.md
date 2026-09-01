# Privacy

NumberWalk is a static browser application with no NumberWalk server or survey database.

## Stored on the device

The app stores street-session settings, surveyed house numbers and coordinates, queue/submission status, Google-comparison usage counters and app settings in browser storage. New v0.7 records do not capture notes or photos.

An optional Google Maps browser API key is session-only by default. If the user explicitly enables **Remember API key on this device**, it is persisted in browser storage.

## Data sent to third parties

- **Esri / OpenStreetMap:** normal map-tile requests, including ordinary web-request information and the geographic tiles being viewed.
- **Google:** only when the user presses **Compare Google**, the current address is sent for geocoding; when the user opens a queue item, the address is passed to Google Maps in the Maps URL.
- **Email/share destination:** only when the user activates **Email / share backup** and chooses a destination. NumberWalk generates the CSV locally first.

NumberWalk does not receive the user's Google username or password and does not submit Google Maps edits itself.

## Backup contents

The exported CSV contains house number, address, surveyed latitude/longitude, survey timestamp, submitted/not-submitted state, a Google Maps address-search link and a link to the surveyed coordinate. Treat the file as location data and store/share it accordingly.

## Browser-origin consideration

GitHub Pages project sites under one `USERNAME.github.io` hostname share the same browser origin. A dedicated custom hostname gives NumberWalk stronger storage isolation from unrelated pages controlled under the same GitHub Pages origin.


## FindMyAddress

Choosing **Check official address** opens `https://www.findmyaddress.co.uk/search` in a new browser tab.

NumberWalk does not transmit your saved survey database, GPS coordinates, API key, or Google account information to FindMyAddress. Any address search you perform there is entered directly into the FindMyAddress website and is subject to that service's own privacy terms and usage limits.


## Clearing local data
**Clear survey data** deletes surveyed house records while keeping NumberWalk settings and any API key you chose to remember. **Clear all NumberWalk data** removes the entire NumberWalk local state, including survey records, settings and API-key storage.
