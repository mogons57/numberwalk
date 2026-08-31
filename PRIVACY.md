# Privacy

NumberWalk is designed as a local-first static web application.

## Information stored on the device

The browser can store:

- current Street Session details;
- surveyed house numbers and building coordinates;
- notes;
- optional compressed reference photos;
- whether an item has been marked submitted;
- the local Google-comparison usage counter and limit;
- optionally, a remembered Google Maps browser API key.

NumberWalk itself has no backend server and does not upload this survey database to the repository owner.

## Information sent to third parties

Normal use can contact:

- **Esri** for aerial map tiles;
- **OpenStreetMap tile infrastructure** for street-map tiles;
- **Google Maps Platform** only when the user enables and presses Compare Google; the address being compared is sent for geocoding;
- **Google Maps** when the user opens an address to submit/check an edit;
- **unpkg** to load the pinned Leaflet library and stylesheet.

Those services may receive ordinary web request metadata such as IP address, user agent, referrer/origin where applicable, and the requested resource. Map tile coordinates also reveal the map area being viewed.

## Google account identity

NumberWalk does not know the user's Google account. It does not receive a Google name, email address, password or OAuth token. If a Google Maps edit is submitted, Google associates it with the Google account currently signed into Google Maps, independently of NumberWalk.

## Removing local data

Open NumberWalk Settings → Privacy & local data → **Clear all NumberWalk data**. Browser/site-data controls can also remove it.

## Shared-origin note for GitHub Pages

Browser storage is scoped by origin. Multiple project sites under the same `https://USERNAME.github.io` origin are not isolated from each other by repository path. A dedicated custom hostname provides stronger separation.
