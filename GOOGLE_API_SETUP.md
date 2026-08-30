# Google comparison setup for NumberWalk

NumberWalk's survey features do not require Google Maps Platform. These steps are only for the optional **Compare Google** button.

## 1. Use a Google Cloud project with billing enabled

Open Google Cloud Console, select or create a project (for example `NumberWalk`), and attach a billing account.

## 2. Enable the required APIs

In **APIs & Services → Library**, enable:

- **Maps JavaScript API**
- **Geocoding API**

NumberWalk uses Google's Geocoding Service *through the Maps JavaScript API in the browser*. It does not call the Geocoding REST endpoint directly.

## 3. Create an API key

Go to **APIs & Services → Credentials → Create credentials → API key**.

## 4. Restrict the key to your NumberWalk website

Open the new key and set **Application restrictions** to **Websites (HTTP referrers)**.

Add this website restriction:

    https://mogons57.github.io/numberwalk/*

You may also add this while testing if needed:

    https://mogons57.github.io/numberwalk/

Do not use an IP-address restriction for this browser key.

## 5. Restrict which Google APIs the key can use

Under **API restrictions**, choose **Restrict key** and allow only:

- Maps JavaScript API
- Geocoding API

Save the key settings. Google notes that restriction changes can take a short time to propagate.

## 6. Set a defensive quota

In **APIs & Services**, open **Geocoding API → Quotas & System Limits** and set a modest daily quota suitable for your surveying. For example, if you cannot realistically survey more than 500 houses in one day, a daily geocoding request limit around that level gives an additional safeguard against unexpected use. Choose a number that does not interrupt your intended work.

## 7. Put the key into NumberWalk

Open NumberWalk in Safari, press the **gear** button, paste the key into **Google Maps browser API key**, and press **Save**.

The key is stored in that browser's local storage. It is not written into this GitHub repository. Browser API keys are still visible to a sufficiently technical visitor while the site uses them, which is why the website and API restrictions above are important.

## Troubleshooting

If **Compare Google** fails:

1. Confirm billing is active for the project.
2. Confirm both Maps JavaScript API and Geocoding API are enabled.
3. Confirm the website restriction includes `https://mogons57.github.io/numberwalk/*`.
4. Confirm the API restriction includes both required APIs.
5. If you just changed restrictions, try again after the settings have propagated.
6. If you changed the key in NumberWalk after Google had already loaded, reload the page before comparing again.


## NumberWalk local daily limit
Version 0.5 also defaults to 250 Google comparisons per day. Change this under the gear/settings button. The counter resets on the next local calendar day. This protects against accidental calls made by NumberWalk, but because it runs in browser JavaScript it is not a Google-enforced billing cap.
