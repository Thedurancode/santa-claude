# Store server: checkout, tracking and the admin panel

The shop is a static site. This small Cloudflare Worker does everything that needs a server:

- **Admin panel data** (`/admin/` on the shop): visitors, where they came from, their country
  and city, what they looked at, held and paid orders, and the pixel and product settings.
- **Stripe Checkout**: builds each payment page. Prices come from the catalog or from a price
  set in the admin panel, never from the browser.
- **Server-side conversions**: reports every paid order to Meta, TikTok and GA4, so ad
  blockers can't hide a sale.

It runs on Cloudflare's free plan (100,000 requests a day, plus a free D1 database).

## Set up (about 15 minutes)

You need a free Cloudflare account and Node.js. In a terminal, inside this `checkout-worker` folder:

```sh
npx wrangler login                      # opens Cloudflare in your browser
npx wrangler d1 create santa-claude     # prints a database_id
```

1. Paste the `database_id` into `wrangler.toml`.
2. Set the secrets (each command asks you to paste the value):
   ```sh
   npx wrangler secret put ADMIN_PASSWORD       # the password for /admin/, make it long
   npx wrangler secret put STRIPE_SECRET_KEY    # sk_live_… (or sk_test_… to try it out)
   ```
3. Deploy:
   ```sh
   npx wrangler deploy
   ```
   It prints the server URL, for example `https://santa-claude.<you>.workers.dev`.
4. In `js/shop-config.js`, put that URL in both `api` and `checkout.stripeEndpoint`, then commit and push.
5. Open `https://thedurancode.github.io/santa-claude/admin/` and sign in with your password.
6. In Stripe, go to **Settings → Payment methods** and turn on Apple Pay, Google Pay and Link.

## Stripe webhook (records paid orders)

1. In Stripe, go to **Developers → Webhooks → Add endpoint**:
   - URL: `<your server URL>/webhook`
   - Events: `checkout.session.completed` and `checkout.session.async_payment_succeeded`
2. Copy the signing secret (`whsec_…`) and run `npx wrangler secret put STRIPE_WEBHOOK_SECRET`.

## Pixels and conversion tokens

Enter them in the admin panel under **Pixels & tracking**. No redeploy needed: the shop picks
up changes within a minute. Each product can also have its own Meta pixel, TikTok pixel and
Google Ads conversion label, under **Products**.

Server tokens (Meta Conversions API, TikTok Events API, GA4 Measurement Protocol secret) are
stored on the server and never shown again after saving.

## After changing products in `js/shop-config.js`

Adding or removing a design, or changing a default price, needs a rebuild:

```sh
python3 ../tools/build_worker.py && npx wrangler deploy
```

Prices, badges and hiding a design can be changed in the admin panel without this.

## Checking it

- Open the shop with `?debug=tracking` at the end of the URL and watch the browser console.
- Visit the shop from your phone and watch it appear under **Live** in the admin panel.
- Test card for `sk_test_` keys: 4242 4242 4242 4242, any future date, any CVC.
