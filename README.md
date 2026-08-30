# NumberWalk — GitHub Pages edition

This folder is ready to upload directly to a GitHub repository and publish with GitHub Pages. It uses relative paths, so it works at a project URL such as:

`https://YOUR-USERNAME.github.io/numberwalk/`

## Publish it

1. In GitHub, create a new **public** repository called `numberwalk` (or any name you prefer).
2. Choose **Add file → Upload files**.
3. Upload **the contents of this folder**: `index.html`, `app.js`, `styles.css`, `manifest.webmanifest`, `sw.js`, and the `icons` folder. Do not upload the enclosing `numberwalk-github` folder itself.
4. Commit the files to the `main` branch.
5. Open **Settings → Pages**.
6. Under **Build and deployment**, choose **Deploy from a branch**.
7. Select `main`, choose `/(root)`, then Save.
8. GitHub will show the Pages web address. Open it on the iPhone and allow precise location access.
9. In Safari, use **Share → Add to Home Screen** to launch NumberWalk like an app.

No Mac, Xcode, server, database, or build step is needed.

## What works without a Google API key

- live phone GPS
- aerial imagery and an OpenStreetMap layer
- tap/drag placement at the centre of the correct building
- street sessions and +1/+2 number stepping
- reference photos stored on that phone
- walk review map
- Google Maps submission queue
- local browser storage
- Home Screen installation/PWA support

The optional **Compare Google** button uses the browser-side **Maps JavaScript API Geocoding Service**. Add your own restricted Google Maps Platform browser API key in NumberWalk Settings. The rest of NumberWalk does not need a Google key. See `GOOGLE_API_SETUP.md` for the exact setup for `https://mogons57.github.io/numberwalk/`.

## Important data note

Survey information is stored in that browser using localStorage. It is not synced to GitHub or another phone. Do not clear Safari website data if you need the captured records. An export/backup feature is a sensible next addition.


## v0.5 API call safety limit
Settings now includes a configurable local daily limit for Google comparisons. The default is 250 comparisons per local calendar day. The app shows today's usage and refuses further Compare Google requests once the limit is reached, resetting automatically the next day. This is a client-side safety guard; keep the Google website and API-key restrictions enabled as well.
