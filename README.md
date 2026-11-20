# Reunivo — pre-launch website

The pre-launch landing page for **Reunivo**, smart lost & found tags. Someone finds your lost item, scans the tag with any phone camera, and you get an alert and a private message. Your phone number is never shown.

The site's job is to explain the idea in under a minute and collect waitlist sign-ups.

It runs as a **Cloudflare Worker** that serves the static page and one small endpoint for the live sign-up counter. There's no install and no build step.

```
reunivo/
├── public/
│   └── index.html    the whole landing page (layout, styles, and scripts)
├── src/
│   ├── worker.js     Worker entry: /api/signups → counter, everything else → public/
│   └── signups.js    reads the waitlist count from SilentForms (keeps the API token secret)
├── wrangler.jsonc    Cloudflare config (Worker name, public/ folder, routes)
├── .gitignore
└── README.md
```

---

## What the website does

The page is built around one idea: **every lost thing is tied to its owner by an invisible thread, and a Reunivo tag is what lets someone pull it.** Indigo night-city colors, a marigold accent, and handwritten claim-ticket details. No templates borrowed from other tag brands.

### 0. The opening: one big tag, cut loose
- Every time the page loads (including a reload, or coming back with the Back button), it opens on one big marigold tag swinging on a string: *"Every lost thing is tied to someone."*
- After about two seconds the string is snipped ✂️ and the tag falls away, revealing the page. The page always starts at the top.
- Tap anywhere, press Enter/Escape, or hit **Skip** to cut it straight away.
- People who have "reduce motion" turned on skip it entirely.

### 1. "Tonight in the city": the interactive map (hero)
- An illustrated city at night, drawn live in the browser, with six lost things (an umbrella at the station, keys at a café, a beagle in the park…) and four owners' homes.
- **Tap a lost thing:** it pings as it's scanned, then a glowing marigold thread draws itself along the streets to its owner's home, the home's window lights up, and the owner's reply pops up as a speech bubble.
- A card below tells that item's return story (where it was found, who found it, what they wrote, how long it took), and a tally counts "3 of 6 things home tonight". **Lose them all again** resets the city.
- The first time the map comes into view, one thread pulls itself home on its own, so visitors see what to do.
- It's clearly labelled as an illustrated example, since Reunivo hasn't launched yet.

### 2. "Both ends of one scan": two-phone demo
The visitor plays the **finder** on one phone and watches the **owner's** phone react on the other: scan the found wallet, see "This wallet belongs to Aarav" (his number stays hidden), write and send a message, watch it land on the owner's lock screen, and get the owner's reply. The owner's clock and day are real.

### 3. "Write what a stranger will read": the tag maker
- The visitor designs their own tag: picks the item (keys, wallet, bag, suitcase, dog, laptop), types their first name (or hides it), writes the note a finder will read (up to 90 characters, with one-tap ideas like "Reward for its return!"), and picks one of five tag colours.
- **Two live previews update as they type:** the physical tag (colour, "Found my keys?", and a code pattern and tag number that change with the name), and the **finder's phone**, showing "These keys belong to Aarav." plus the note.
- **Save my place for this tag** jumps to the waitlist with that item's chip already ticked and the name filled in. The form still sends the same fields; nothing extra is submitted.
- The code on the preview tag is decorative, not a real scannable code.

### 4. "Take a tag apart": the trust section
Shows that Reunivo is built on trust by letting people open a tag in 3D:
- The tag splits into four layers: **the surface** (no name, number or address printed), **the code** (just one web address), **the ID** (a random string that means nothing until you link it), and **the core** (empty, because nothing about you is stored in the tag).
- Tap a layer to bring it forward with its explanation. A box shows exactly what a decoded tag says, e.g. `reunivo.app/t/7K2M9QX4`.
- Four promises underneath: finders stay anonymous too, you control every tag, nothing to ransom, and your data isn't the product.
- **Check before launch:** the promises ("we won't sell or share your details, or show you ads") and the `reunivo.app/t/…` address format should match how the real product works. Edit them in `public/index.html` if needed.

### 5. Tags and FAQ
Four tag types (mini sticker, keyring, luggage tag, pet tag) with hand-drawn icons, and an expandable FAQ.

### 6. Waitlist: the claim ticket (SilentForms)
- The form is a perforated **claim ticket**: name, email, and "What would you tag first?" chips.
- Once the live count is available, the ticket shows **"Your number #N"** (the real count + 1) and a badge says **"N people are already on the list"**.
- Sign-ups go to **SilentForms** in the background. The visitor stays on the page and the ticket gets stamped **ON THE LIST**, with their name, how many people have subscribed so far, and a **Share with a friend** button.
- Clear errors for a missing name, a bad email, or no connection. Spam protection with a hidden honeypot field.

### 7. Works everywhere
- Responsive down to small phones, with no sideways scrolling.
- Keyboard focus is visible, and screen readers get labels for the map and the demo.
- Turning on "reduce motion" on your device switches off the animations.

---

## How the sign-up form works

Everything is inside `<form id="join-form">` in `public/index.html`:

| Field | What it is |
|---|---|
| `accessKey` (hidden) | Your SilentForms access key. Tells SilentForms which inbox gets the sign-up. |
| `name`, `email` | Typed in by the visitor. Both required. |
| `wants_to_tag` (hidden) | Filled in automatically from the chips the visitor taps, e.g. `🔑 Keys, 🎒 Bag`. |
| `sf_extra` (hidden) | Honeypot spam trap. Left empty by real people. |

When someone taps **Join the waitlist →**:
1. The button changes to "Joining…" so it can't be sent twice.
2. The page sends the form to `https://silentforms.com/api/submit` **in the background**. There's no redirect.
3. The form is replaced by the "You're in!" message.
4. The page asks `/api/signups` for the latest count and shows *"N people have subscribed so far"* (the real number). If the count can't be read, that line just doesn't appear.

If the visitor is offline or the request can't be sent, they see *"Sorry, that didn't go through…"* and can try again.

**One limitation:** SilentForms' submit endpoint doesn't let the page read its reply (browsers block it), so the page can only spot network failures. If SilentForms itself rejected a sign-up, the visitor would still see "You're in!". Check your SilentForms dashboard after going live.

> **Testing tip:** submit a test entry from the **live** website. The subscriber count only works there (it needs the Cloudflare function).
> Also, a work network with a web filter (like Zscaler) may block silentforms.com. If the form fails at the office, try your phone on mobile data.

---

## Live sign-up counter

```
Visitor's page ──► /api/signups  (src/signups.js, runs on Cloudflare)
                        │  uses SILENTFORMS_TOKEN, a secret stored in Cloudflare, never in the page
                        ▼
                 silentforms.com/api/v1/forms  →  each form's "submissions" (inbox count, spam excluded)
                        │
Page gets { "count": N } ◄┘  → shows "N people are already on the list"
```

- **The API token never goes in `public/index.html` or in this repo.** It can read and delete every sign-up, so it lives only in Cloudflare as a secret.
- The function asks SilentForms **at most once every 5 minutes** and reuses that number in between, which keeps you far under the API limit of 120 requests a minute.
- The page receives **only the number**, never names or emails.
- If anything fails (token missing, SilentForms down), the counter simply stays hidden. The rest of the page and the form are not affected.
- Deleting submissions in SilentForms lowers the count.

### Set it up (one time)
1. **SilentForms → API → Create token.** Copy the `sf_…` token. It's shown only once.
2. **Cloudflare → Workers & Pages → `reunivo` → Settings → Variables and Secrets → Add**:
   - `SILENTFORMS_TOKEN` = your `sf_…` token. Choose **Encrypt / Secret**.
   - `SILENTFORMS_FORM_ID` = the ID of your waitlist form (*recommended*). Without it, the count adds up **every active form** in your account, including a contact form if you have one.
3. Saving a secret applies it right away, so there's no need to redeploy.
4. **Check it:** open `https://YOUR-SITE.workers.dev/api/signups` (or your own domain). You should see `{"count": …}`.

**Finding your form ID:** run this on any computer that isn't behind a web filter (the token is only on your screen, nothing is saved):

```bash
curl https://silentforms.com/api/v1/forms -H "Authorization: Bearer sf_YOUR_TOKEN"
```

Each form is listed with its `id`, `name` and `submissions`.

> Until `SILENTFORMS_TOKEN` is set, `/api/signups` answers `503` and the counter simply stays hidden.

---

## Settings

Near the top of `public/index.html`:

```js
const SIGNUP_COUNT_MIN = 25;
```

- `SIGNUP_COUNT_MIN`: the counter only appears once at least this many people have joined. Set it to `1` to always show it.


To switch to a different SilentForms inbox, change the `accessKey` value inside `<form id="join-form">`.

All text, prices and dates are placeholders. Edit them directly in `public/index.html`.

---

## Deploy (Cloudflare Workers, from GitHub)

The project is deployed as a **Worker** with static assets, set up by `wrangler.jsonc`:
- `public/` is the website (served as-is).
- `src/worker.js` handles only `/api/*`. Everything else goes straight to `public/`.

**Cloudflare build settings** (Workers & Pages → `reunivo` → Settings → Build):

| Setting | Value |
|---|---|
| Git repository | `vineethere/Reunivo`, branch `main` |
| Build command | *leave empty* |
| Deploy command | `npx wrangler deploy` |
| Root directory | `/` |

Every push to `main` deploys again automatically. You get a free `reunivo.<your-subdomain>.workers.dev` address with no watermark, and you can add your own domain under **Settings → Domains & Routes**.

> **The Worker name must match.** `"name": "reunivo"` in `wrangler.jsonc` must be the same as your Worker's name in the Cloudflare dashboard. If they differ, the build fails or creates a second Worker. Change the line in `wrangler.jsonc` to match.

Then add the counter settings (`SILENTFORMS_TOKEN`, `SILENTFORMS_FORM_ID`). See [Live sign-up counter](#live-sign-up-counter).

**Try it locally (optional):**
```bash
npx wrangler dev
```
That opens the site at http://localhost:8787 with the counter endpoint working (it needs a `.dev.vars` file containing `SILENTFORMS_TOKEN=…`, which is git-ignored).

**After deploying:** open the live site, submit a test sign-up, check that the "You're in!" message appears, then confirm the entry shows up in your **SilentForms dashboard**. Then open `/api/signups` to check the counter.

---

## Tech
- A [Cloudflare Worker with static assets](https://developers.cloudflare.com/workers/static-assets/) (`src/worker.js`, `wrangler.jsonc`) for hosting and the sign-up counter.
- Plain HTML, CSS and JavaScript in one file. No frameworks, no build step. The city map is SVG drawn by script.
- Google Fonts: Bricolage Grotesque (headings and text) and Kalam (handwritten ticket details).
- Needs an internet connection to load the fonts.
