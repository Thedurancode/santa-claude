# Stack Threads

Hoodies and tees printed with developer quotes. A stand-alone shop with its own repo,
hosting, server and admin panel.

| Part | Where |
| --- | --- |
| Shop | https://thedurancode.github.io/santa-claude/ (GitHub Pages; publish by pushing to `main`) |
| Admin panel | `/admin/` on the shop. Preview it with sample data at `/admin/?demo` |
| Store server | `checkout-worker/`, a Cloudflare Worker with a D1 database: Stripe checkout, visitor stats, settings, conversion reporting |
| MCP server | `<store server>/mcp`, so AI agents can read sales and traffic and change products and pixels |

## Files

- `js/shop-config.js`: designs (colours and the quote lines printed front and back), default prices, bundle discount, shipping, size chart, and
  the store server URL (`api` and `checkout.stripeEndpoint`).
- `js/pixels.js`: ad pixels (Meta, TikTok, GA4, Google Ads, GTM, Pinterest, Snap) and the
  visit tracking that feeds the admin panel. Pixel IDs come from the admin panel.
- `js/shop.js`: the shop itself (home, product pages, bag, checkout, thank-you).
- `admin/`: the admin panel.
- `checkout-worker/`: the store server. Setup, secrets and the MCP tools are in its README.
- `tools/build_worker.py`: copies products and prices from `shop-config.js` into the server.
- `assets/p/*.png`: a picture of each design, used by Stripe checkout, search results and link
  previews. The shop itself draws the designs live, so after adding a design, render a new
  picture of it (or the server falls back to `assets/og.png`).

## Run it locally

```sh
python3 -m http.server 4180
```

Then open http://127.0.0.1:4180/ (shop) or http://127.0.0.1:4180/admin/?demo (admin preview).

Until the store server is deployed, checkout takes "hold my order" requests and emails them to
`checkout.holdEmail`.
