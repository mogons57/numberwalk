# Google Maps Platform setup (optional)

NumberWalk does not need a Google API key to survey streets. A key is needed only for **Compare Google**.

## Required APIs

Enable only:

1. **Maps JavaScript API**
2. **Geocoding API**

The app uses the Geocoding Service through the Maps JavaScript API in the browser.

## Create and restrict a key

Create a dedicated browser API key for NumberWalk. Then configure both kinds of restriction:

### Application restriction

Choose **Websites** and allow only the HTTPS site that actually hosts the app. For example:

`https://USERNAME.github.io/numberwalk/*`

Use your own username/repository. Do not copy somebody else's restriction.

### API restriction

Choose **Restrict key** and allow only:

- Maps JavaScript API
- Geocoding API

Disable unrelated APIs in the project if they are not used elsewhere.

## Put the key into NumberWalk

Open Settings (gear icon), paste the key, and save. By default it is kept only in browser session storage. Tick **Remember API key on this device** only if you want persistent convenience.

A client-side browser API key is observable while in use; that is expected. The website/API restrictions are what prevent the same key being freely reused elsewhere.

## Daily NumberWalk limit

NumberWalk defaults to 250 Compare Google attempts per local calendar day. This helps prevent accidental loops or excessive use by the app itself. It is **not** a Google-enforced quota and must not be relied on as a billing/security boundary.

## If comparison fails

Check that:

- the two required APIs are enabled;
- billing/account requirements for Google Maps Platform are satisfied;
- the key's Websites restriction matches the deployed HTTPS site;
- both Maps JavaScript API and Geocoding API are in the key's API restriction list;
- the current NumberWalk daily limit has not been reached.
