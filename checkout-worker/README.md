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

To test, use card 4242 4242 4242 4242 with any future date and any CVC while on the `sk_test_` key.
