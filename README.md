# Reunivo — pre-launch website

One static page (`index.html`). No install, no build. Double-click it to open.

## What's on the page
1. **Hero**: "Every lost thing has a way home", with a swinging tag whose QR code is real (once online, it opens this page).
2. **The film**: a 30-second animated story with captions and a play/pause bar (backpack tagged → left at a café → scanned → owner alerted → reunited).
3. **How it works**: 3 steps.
4. **Try it yourself**: an interactive demo. The visitor plays the finder on one phone and watches the owner's phone get the alert and message.
5. **Who it's for**: travellers, students, parents, pet parents, and more.
6. **The tags**: mini sticker, keychain, luggage tag, pet tag.
7. **Privacy**: what a finder sees vs what stays hidden.
8. **Comparison**: name label vs GPS tracker vs Reunivo.
9. **Waitlist**: name, email, and "what would you tag first?" chips.
10. **FAQ** and footer.

## 1. Receiving sign-ups (Formspree)
Sign-ups go to Formspree: `https://formspree.io/f/mljbgpky`. It's set in two places in `index.html`: `const FORM_ENDPOINT = ...` near the top, and the `action` on `<form id="join-form">`. To switch forms, change both.

Each sign-up sends the name, email, what they'd tag first (`wants_to_tag`) and the time (`joined_at`). If sending fails, the visitor sees an error and can try again. You can export the list as CSV from Formspree.

Formspree may ask you to confirm the form (via an email link) the first time it receives a submission.

## 2. Use a real video instead of the animated film (optional)
On the same config lines near the top, set `VIDEO_URL`:
- YouTube: `const VIDEO_URL = 'https://www.youtube.com/embed/YOUR_VIDEO_ID';`
- Your own file: put `film.mp4` in this folder and set `const VIDEO_URL = 'film.mp4';`

Leave it empty to keep the animated film.

## 3. Put it online (free)
1. Go to https://app.netlify.com/drop
2. Drag the whole `reunivo` folder onto the page.
3. You get a live link like `reunivo-xyz.netlify.app`. The QR on the hero tag will then point to it, so people can scan it from a slide or a printed card.

## Notes
- Needs internet to load fonts and styles (Google Fonts, Tailwind CDN, a small QR library).
- Prices, launch dates and features on the page are placeholders. Edit any text directly in `index.html`.
