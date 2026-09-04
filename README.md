# Aghria Nuakhai Bhetghat — Bengaluru

Website for the annual Aghria Nuakhai Bhetghat, a community harvest gathering
of Aghria families in Bengaluru. Plain HTML, CSS and JavaScript — no build
step, no dependencies, deployable straight to GitHub Pages.

Live: https://hemsagar24.github.io/nuakhai/

---

## Editing the event details

**Everything about the upcoming event lives in one place: the `EVENT` object at
the top of [`script.js`](script.js).** Nothing else needs to change between years.

```js
const EVENT = {
    edition: 'v4.0',
    year: 2026,
    startsAt: '2026-09-13T09:00:00+05:30',   // drives the countdown
    dateLabel: 'September 13, 2026 (Sunday)', // shown to visitors
    timeLabel: '9:00 AM onwards',
    dateConfirmed: false,                     // true hides the "tentative" notes
    venue: { name: '…', area: 'Bengaluru', mapsUrl: '…' },
    registrationUrl: '',                      // empty ⇒ Register buttons disabled
    counter: { workspace: '…', name: '…' }    // null ⇒ visit counter removed
};
```

### Current placeholders — these need real values

| Field | Status |
| --- | --- |
| `startsAt` / `dateLabel` | ⚠️ **Placeholder** (13 Sep 2026, a Sunday). Replace with the confirmed date, then set `dateConfirmed: true`. |
| `venue.name` / `venue.mapsUrl` | ⚠️ Not announced. Until `mapsUrl` is filled, "Get Directions" renders disabled. |
| `registrationUrl` | ⚠️ No 2026 form yet. Until it's set, Register buttons read "Registration opens soon" and are disabled. |
| Contact details | ⚠️ See the `TODO organisers` comment in the Contact section of `index.html`. |
| Social links | ⚠️ Footer icons point at `#`. Replace the URLs or delete the unused ones. |

### How the countdown behaves

- **Before the event** — live days/hours/minutes/seconds.
- **On the day** (`startsAt` → `startsAt + 10h`) — switches to "Nuakhai Juhar — it's happening today!".
- **Afterwards** — switches to a wrap-up message. The site degrades gracefully
  instead of breaking, so a stale date is no longer a crash.

## Adding photos from a new year

1. Create `images/events/<year>/` and add photos named `image1.jpg`,
   `image2.jpg`, … in the order you want them shown.
2. Add (or update) that year's entry in `EVENT_HISTORY` in `script.js`, setting
   `photos` to how many files you added.

`EVENT_HISTORY` is explicit rather than auto-probing so the page makes no
wasted network requests. Please also replace the placeholder year descriptions
with what actually happened — they're intentionally generic right now.

## Registrations page

[`registrations.html`](registrations.html) reads the organisers' Google Sheet as
CSV (no API key needed) and shows live counts plus a searchable list. The sheet
ID and GID are at the top of [`registrations.js`](registrations.js); the sheet
must be shared as "anyone with the link can view".

## Project structure

```
├── index.html            Main event page
├── styles.css            All styling for both pages
├── script.js             EVENT config + all page behaviour
├── registrations.html    Live registration list
├── registrations.js      Google Sheets CSV fetch + table/stats
├── samleimaa.png         Logo, also used as the favicon
├── videos/               Hero background video
├── images/
│   ├── dhan.jpg          Paddy photo used in the About section
│   └── events/<year>/    Gallery photos per year
└── public/               Standalone stats page (optional)
```

## Running locally

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>. A server is needed rather than opening the
file directly, because the Google Sheets fetch and the video require `http://`.
The visit counter deliberately does **not** increment on `localhost`.

## Accessibility & performance notes

- Skip link, real focus styles, keyboard-navigable gallery (arrows + Escape),
  and `aria-*` state on the mobile menu and dialog.
- `prefers-reduced-motion` disables the slideshow, reveal animations and
  scroll smoothing.
- The hero video falls back to a photo slideshow if it fails or autoplay is blocked.
- ⚠️ **Known issue:** the gallery JPEGs are 600–900 KB each and are served at
  full size. Resizing them to ~1600px wide and adding thumbnails would cut
  several megabytes off the page. Not done yet.
