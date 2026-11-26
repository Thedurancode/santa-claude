# Santa Claude

Hoodies for developers. A static store hosted on GitHub Pages at
https://thedurancode.github.io/santa-claude/. To publish a change, commit and push to `main`.

- `js/shop-config.js` is the only file you need to edit. It holds the products, prices, colours, the bundle discount, the free-shipping threshold, the Christmas cutoff, the size chart, checkout settings and pixel IDs.
- **Checkout:** set `checkout.shopifyDomain` and give each product `variants: { S: 'id', M: 'id', ... }`. The bag then sends shoppers straight to Shopify checkout (Shop Pay, Apple Pay and Google Pay) through a cart permalink, carrying UTM and click IDs along. Until that's set, "Check out" opens a "Hold my order" form that emails the order to `checkout.holdEmail` through FormSubmit. The first submission triggers a one-time activation email to that address.
- **Pixels:** `js/pixels.js` loads Meta, TikTok, GA4, GTM, Pinterest and Snap, but only the ones with an ID filled in. It sends ViewContent, AddToCart, InitiateCheckout, Lead and Purchase events. Track purchases with Shopify's own Meta, TikTok and Google apps, since the purchase happens on Shopify's checkout.
- **Pictures:** the hoodies are SVG drawings made from each product's colours (see PRINTS in `js/shop.js`). To use real photos, add `photos: ['front.jpg', 'back.jpg']` to a product.
