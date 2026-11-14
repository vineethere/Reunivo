# Reunivo — pre-launch website

The pre-launch landing page for **Reunivo**, smart lost & found tags. Someone finds your lost item, scans the tag with any phone camera, and you get an alert and a private message. Your phone number is never shown.

The site's job is to explain the idea in under a minute and collect waitlist sign-ups.

It's a static site with no install and no build step. The only server code is one small Cloudflare function that powers the live sign-up counter.

```
reunivo/
├── index.html   the whole landing page (layout, styles, and scripts)
├── functions/
│   └── api/
│       └── signups.js   Cloudflare function: returns the waitlist count (keeps the API token secret)
├── .gitignore
└── README.md
```

---

## What the website does

### 1. Hero with a live, scannable tag
- Headline: **"Every lost thing has a way home."**
- A Reunivo tag swings gently on a string. Its **QR code is real**: it's generated in the browser and points to the page's own live address, so you can scan it from a laptop screen, a slide, or a printed card and land on the site.

### 2. The 30-second film
- An animated story built with HTML and CSS, not a video file, in 5 scenes: **tag a backpack → it's left at a café → a stranger scans it → the owner is alerted → reunited.**
- Has captions, a play/pause button, a progress bar and a timer.
- Can be swapped for a real video (see [Settings](#settings) below).

### 3. "Try it yourself": interactive demo
The visitor plays the **finder** on one phone and watches the **owner's** phone react on the other:
1. Tap **Scan the tag** on the found wallet → a scanning screen.
2. The finder sees a friendly page: *"This wallet belongs to Aarav"*. Their number stays hidden.
3. At the same moment the owner's lock screen shows **"Your wallet was just scanned 📍"**.
4. The finder writes a message (editable) and taps **Send privately**. It shows up on the owner's phone.
5. The owner taps **Reply**. The finder sees the reply and a "You just helped someone" badge.
6. **Restart demo** runs it again. The owner's clock shows the real time.

### 4. The rest of the story
- **The problem:** why lost things don't come back (no contact, labels expose your number, trackers are costly).
- **How it works:** 3 steps: Tag it → Someone scans → You reunite.
- **Who it's for:** travellers, students, parents, pet parents, gadget lovers, elderly care, teams.
- **The tags:** mini sticker, keychain, luggage tag, pet tag. Waterproof and battery-free.
- **Privacy:** side by side, what a finder sees vs. what stays hidden.
- **Comparison table:** name label vs. GPS tracker vs. Reunivo.
- **FAQ:** expandable questions and answers.

### 5. Waitlist sign-up (SilentForms)
- Fields: **name**, **email**, and **"What would you tag first?"** chips (Keys, Wallet, Bag, Luggage, Pet, Kid's stuff, Laptop). The visitor can pick several.
- Sign-ups go to **[SilentForms](https://silentforms.com)**, and you see them in your SilentForms dashboard.
- After signing up, the visitor **stays on the page**. The form is replaced by a **"You're in!"** message (*"Thanks Vineet! We'll email you@… the moment Reunivo launches."*), a line saying **how many people have already subscribed**, and a **Share with a friend** button (uses the phone's share sheet, or copies the link on desktop).
- **Live sign-up counter:** *"💛 1,280 people have already joined"* above the form, read live from SilentForms. It stays hidden until at least `SIGNUP_COUNT_MIN` people (25 by default) have joined. See [Live sign-up counter](#live-sign-up-counter).
- **Spam protection:** a hidden "honeypot" field (`sf_extra`) that people never see but bots fill in, so SilentForms can drop bot sign-ups.

### 6. Works on phones and desktop
- Built mobile-first. On phones the nav becomes a **☰ menu**, the film switches to a tall frame, the comparison table scrolls sideways, and text and spacing scale down.
- Nothing scrolls sideways on small screens.
- Smooth scrolling to sections, with the floating header never covering section titles.
- Sections fade in as you scroll.

---

## How the sign-up form works

Everything is inside `<form id="join-form">` in `index.html`:

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
4. The page asks `/api/signups` for the latest count and shows *"🎉 1,281 people have already subscribed"*. If the count can't be read, that line just doesn't appear.

If the visitor is offline or the request can't be sent, they see *"Sorry, that didn't go through…"* and can try again.

**One limitation:** SilentForms' submit endpoint doesn't let the page read its reply (browsers block it), so the page can only spot network failures. If SilentForms itself rejected a sign-up, the visitor would still see "You're in!". Check your SilentForms dashboard after going live.

> **Testing tip:** submit a test entry from the **live** website. The subscriber count only works there (it needs the Cloudflare function).
> Also, a work network with a web filter (like Zscaler) may block silentforms.com. If the form fails at the office, try your phone on mobile data.

---

## Live sign-up counter

```
Visitor's page ──► /api/signups  (functions/api/signups.js, runs on Cloudflare)
                        │  uses SILENTFORMS_TOKEN, a secret stored in Cloudflare, never in the page
                        ▼
                 silentforms.com/api/v1/forms  →  each form's "submissions" (inbox count, spam excluded)
                        │
Page gets { "count": 1280 } ◄┘  → shows "1,280 people have already joined"
```

- **The API token never goes in `index.html` or in this repo.** It can read and delete every sign-up, so it lives only in Cloudflare as a secret.
- The function asks SilentForms **at most once every 5 minutes** and reuses that number in between, which keeps you far under the API limit of 120 requests a minute.
- The page receives **only the number**, never names or emails.
- If anything fails (token missing, SilentForms down), the counter simply stays hidden. The rest of the page and the form are not affected.
- Deleting submissions in SilentForms lowers the count.

### Set it up (one time)
1. **SilentForms → API → Create token.** Copy the `sf_…` token. It's shown only once.
2. **Cloudflare → your Pages project → Settings → Variables and Secrets → Add**:
   - `SILENTFORMS_TOKEN` = your `sf_…` token. Choose **Encrypt / Secret**.
   - `SILENTFORMS_FORM_ID` = the ID of your waitlist form (*recommended*). Without it, the count adds up **every active form** in your account, including a contact form if you have one.
3. **Deploy again** so the function picks up the settings.
4. **Check it:** open `https://YOUR-SITE.pages.dev/api/signups`. You should see `{"count": …}`.

**Finding your form ID:** run this on any computer that isn't behind a web filter (the token is only on your screen, nothing is saved):

```bash
curl https://silentforms.com/api/v1/forms -H "Authorization: Bearer sf_YOUR_TOKEN"
```

Each form is listed with its `id`, `name` and `submissions`.

> The function only runs when the site is deployed **from GitHub** (Option A below). With drag-and-drop uploads the `functions/` folder isn't run, so the counter stays hidden.

---

## Settings

Near the top of `index.html`:

```js
const VIDEO_URL = '';
const SIGNUP_COUNT_MIN = 25;
```

- `SIGNUP_COUNT_MIN`: the counter only appears once at least this many people have joined. Set it to `1` to always show it.

`VIDEO_URL`:
- Leave it empty to show the animated film.
- YouTube: `const VIDEO_URL = 'https://www.youtube.com/embed/YOUR_VIDEO_ID';`
- Your own file: put `film.mp4` next to `index.html` and set `const VIDEO_URL = 'film.mp4';`

To switch to a different SilentForms inbox, change the `accessKey` value inside `<form id="join-form">`.

All text, prices and dates are placeholders. Edit them directly in `index.html`.

---

## Deploy (Cloudflare Pages)

**Option A: connected to GitHub** (this repo: `vineethere/Reunivo`)
1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → pick this repo.
2. Build command: *leave empty*. Output directory: `/`.
3. Every push to GitHub deploys the site again automatically.
4. Add the counter settings (`SILENTFORMS_TOKEN`, `SILENTFORMS_FORM_ID`). See [Live sign-up counter](#live-sign-up-counter).

**Option B: drag and drop**
1. **Workers & Pages** → **Create** → **Pages** → **Upload assets**.
2. Drag in the `reunivo` folder and click **Deploy**.
3. Everything works except the live counter, which needs Option A.

You get a free `your-project.pages.dev` address with no watermark. You can add your own domain later under **Custom domains**.

**After deploying:** open the live site, submit a test sign-up, check that the "You're in!" message appears, then confirm the entry shows up in your **SilentForms dashboard**. Then open `/api/signups` to check the counter.

---

## Tech
- One [Cloudflare Pages Function](https://developers.cloudflare.com/pages/functions/) (`functions/api/signups.js`) for the sign-up counter.
- Plain HTML, plus [Tailwind CSS](https://tailwindcss.com) (loaded from its CDN) for styling.
- Google Fonts: Fraunces (headings) and Inter (body text).
- [qrcode-generator](https://github.com/kazuhikoarai/qrcode-generator) for the hero QR code.
- Needs an internet connection to load these.
