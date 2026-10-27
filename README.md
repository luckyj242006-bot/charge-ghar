# ChargeGhar

EV charging across India. Drivers find chargers on a map. Home and shop owners list their own charger, set their own rate, and drivers can pay a little extra for a priority slot. Every finished session can be reviewed.

This is a working prototype with sample listings. It is a PWA, so it installs on a phone and keeps working offline.

## Files

| File | What it does |
| --- | --- |
| `index.html`, `styles.css`, `app.js` | The app |
| `config.js` | Your Google Maps key goes here |
| `manifest.webmanifest` | Name, colours and icons for installing |
| `sw.js` | Offline support (service worker) |
| `icons/`, `screenshots/` | App icons and store screenshots |
| `privacy.html` | Placeholder privacy page, update before launch |
| `.nojekyll` | Tells GitHub Pages to serve the files as they are |

## 1. Put it on GitHub

1. Open GitHub Desktop and choose **File, Add local repository**. Pick this folder. If it asks, click **create a repository**.
2. Type a summary such as "First version" and click **Commit to main**.
3. Click **Publish repository**. Untick "Keep this code private" if you want GitHub Pages on a free account.

## 2. Make it a website (GitHub Pages)

1. On github.com open the repository, then **Settings, Pages**.
2. Under Branch choose **main** and **/ (root)**, then **Save**.
3. After a minute your app is live at `https://YOURNAME.github.io/REPOSITORY/`. Open it on your phone and choose **Add to Home screen** or **Install app**.

## 3. Turn on the live Google Map

1. In https://console.cloud.google.com create a project and enable **Maps JavaScript API** and **Places API (New)**.
2. Create an API key. Restrict it to your website address (HTTP referrers), for example `https://YOURNAME.github.io/*`.
3. Paste the key into `config.js`, commit and push.

Without a key the app shows a simple map instead.

## 4. Turn it into an Android app with PWABuilder

1. Go to https://www.pwabuilder.com and paste your GitHub Pages address.
2. PWABuilder checks the manifest, icons and service worker. All three are already included.
3. Choose **Package for stores, Android** and download the package. It is signed for Google Play.
4. In Google Play Console, create the app and upload the file PWABuilder gave you.

Two things to know before Play Store:

- **Use the root of a domain.** Android needs a file at `/.well-known/assetlinks.json` on the domain root to hide the browser bar. A project page such as `yourname.github.io/chargeghar/` cannot serve that. Either create a repository named exactly `YOURNAME.github.io`, or use your own domain. PWABuilder gives you the `assetlinks.json` content.
- **Fill in the real parts first.** Listings, payments, chat and verification are sample data. A real launch needs sign-in, a database, UPI payments, charger verification, a real privacy policy, and a check of the rules for selling electricity from a home connection in each state.

## Releasing an update

Edit the files, change `VERSION` in `sw.js` (for example `chargeghar-v2`) so phones fetch the new files, then commit and push.
