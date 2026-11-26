# Stripe checkout worker

The shop is a static site, so a tiny server function creates each Stripe Checkout
session. Prices are read from the catalog inside `worker.js`, never from the browser.

## Set up (about 10 minutes, free)

1. In Stripe, go to **Settings → Payment methods** and turn on Apple Pay, Google Pay and Link.
2. In Cloudflare, go to **Workers & Pages → Create → Worker**, name it `santa-claude-checkout`,
   then paste the contents of `worker.js` and deploy.
3. In the worker's **Settings → Variables**, add:
   - `STRIPE_SECRET_KEY` (type: Secret), your `sk_test_…` key to test or your `sk_live_…` key to go live
   - `SITE_URL` = `https://thedurancode.github.io/santa-claude/`
4. Copy the worker URL (for example `https://santa-claude-checkout.<you>.workers.dev`) into
   `checkout.stripeEndpoint` in `js/shop-config.js`, then commit and push.

After changing prices or products in `js/shop-config.js`, run `python3 tools/build_worker.py`
and paste the new `worker.js` into Cloudflare again.

## Server-side conversion tracking (recommended)

Browser pixels miss sales when an ad blocker is on or the shopper closes the tab
after paying. The worker also reports every paid order from the server.

1. In Stripe, go to **Developers → Webhooks → Add endpoint**:
   - URL: `<your worker URL>/webhook`
   - Events: `checkout.session.completed` and `checkout.session.async_payment_succeeded`
   - Copy the signing secret (`whsec_…`) into the worker as `STRIPE_WEBHOOK_SECRET` (Secret).
2. Add the worker variables for each platform you advertise on:
   - **Meta:** `META_PIXEL_ID`, and `META_CAPI_TOKEN` (Events Manager → your pixel → Settings → Conversions API → Generate access token)
   - **TikTok:** `TIKTOK_PIXEL_ID`, and `TIKTOK_EVENTS_TOKEN` (Events Manager → your pixel → Settings → Events API → Generate access token)
   - **Google Analytics 4:** `GA4_ID`, and `GA4_API_SECRET` (Admin → Data streams → your stream → Measurement Protocol API secrets)
   - Optional: `META_TEST_EVENT_CODE` to watch server events arrive in Meta's Test Events tab.

The server and browser send the same event ID (the Stripe session ID), so each sale is counted once.
For Google Ads, fill in `googleAdsId` and `googleAdsPurchaseLabel` in `js/shop-config.js`.

To check the browser side, open the shop with `?debug=tracking` at the end of the URL and watch
the console, or use Meta Pixel Helper and TikTok Pixel Helper.

To test payments, use card 4242 4242 4242 4242 with any future date and any CVC while on the `sk_test_` key.
