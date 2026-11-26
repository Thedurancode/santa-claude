/* Santa Claude shop settings — the only file you need to edit to run the store.

   1. PRODUCTS  prices, names, colours, sizes.
   2. CHECKOUT  paste your Shopify store domain and each size's variant ID.
                Until that is filled in, the bag sends a "hold my order"
                request to the inbox instead of taking payment.
   3. PIXELS    paste your Meta / TikTok / Google IDs. Empty = not loaded.
*/
window.SHOP = {
  brand: 'Santa Claude',
  currency: 'USD',
  freeShippingOver: 100,               // dollars; 0 hides the progress bar
  bundle: { qty: 2, percentOff: 15 },  // 2+ items in the bag = 15% off each (add a matching automatic discount in Shopify)
  shipsIn: 'Ships in 2–3 business days',
  returns: 'Free size exchanges within 30 days',
  holidayCutoff: 'Order by December 15 for US delivery before Christmas',

  checkout: {
    shopifyDomain: '',          // e.g. 'santa-claude.myshopify.com'. Empty = "hold my order" mode.
    discountCode: '',           // optional code added to every checkout link
    holdEmail: 'emprezarioinc@gmail.com'
  },

  pixels: {
    metaPixelId: '',      // Meta (Facebook / Instagram) Pixel ID
    tiktokPixelId: '',    // TikTok Pixel ID
    ga4Id: '',            // Google Analytics 4, 'G-XXXXXXX'
    gtmId: '',            // Google Tag Manager, 'GTM-XXXXXXX' (optional)
    pinterestTagId: '',   // Pinterest Tag ID (optional)
    snapPixelId: ''       // Snapchat Pixel ID (optional)
  },

  sizes: ['S', 'M', 'L', 'XL', '2XL'],

  // type: 'hoodie' or 'sweater' · body: main colour (used for the thumbnail background)
  // photos: front first; add a second path for a back view
  // variants: Shopify variant ID per size, e.g. { S: '44123456789', M: '…' }
  products: [
    { id: 'santa-hoodie', name: 'Santa Claude hoodie', type: 'hoodie', price: 68, body: '#EDE3D3', photos: ['assets/p/santa-hoodie.jpg'],
      blurb: 'The original. A pixel Santa Claude dropping down the chimney, in brick red on oatmeal.', badge: 'Original', variants: {} },
    { id: 'compact-hoodie', name: 'Claude /compact hoodie', type: 'hoodie', price: 68, body: '#2B2B2D', photos: ['assets/p/compact-hoodie.jpg'],
      blurb: 'Santa sitting on a suitcase that won’t close. Everyone who has run /compact knows the feeling.', badge: '', variants: {} },
    { id: 'wishlist-hoodie', name: 'Claude Wrote My Wishlist hoodie', type: 'hoodie', price: 68, body: '#1F4A35', photos: ['assets/p/wishlist-hoodie.jpg'],
      blurb: 'Every box already checked. Pine green with a fountain pen and a very long scroll.', badge: '', variants: {} },
    { id: 'snow-hoodie', name: 'let it snow hoodie', type: 'hoodie', price: 68, body: '#B4502A', photos: ['assets/p/snow-hoodie.jpg'],
      blurb: 'A beige CRT printing an asterisk Christmas tree after one command: > let it snow.', badge: '', variants: {} },
    { id: 'prompt-actually', name: 'Prompt Actually hoodie', type: 'hoodie', price: 68, body: '#1E4A33', photos: ['assets/p/prompt-actually.jpg'],
      blurb: 'A retro terminal with a pixel tree on screen and fairy lights around the base.', badge: '', variants: {} },
    { id: 'ship-friday', name: 'Ship It on Friday hoodie', type: 'hoodie', price: 68, body: '#1B1B1C', photos: ['assets/p/ship-friday.jpg'],
      blurb: 'Santa in sunglasses, carrying the deploy. For people who live dangerously in December.', badge: '', variants: {} },
    { id: 'silent-night', name: 'Silent Night, Loud Bugs hoodie', type: 'hoodie', price: 68, body: '#1C2446', photos: ['assets/p/silent-night.jpg'],
      blurb: 'A rubber duck in a Santa hat debugging by mug light while the bugs multiply.', badge: '', variants: {} },
    { id: 'vibe-xmas', name: 'Vibe Coding Till Xmas hoodie', type: 'hoodie', price: 68, body: '#7A1C26', photos: ['assets/p/vibe-xmas.jpg'],
      blurb: 'A gingerbread dev in headphones, shipping by the tree.', badge: '', variants: {} },
    { id: 'one-more-prompt', name: 'Just One More Prompt hoodie', type: 'hoodie', price: 68, body: '#EAE0CF', photos: ['assets/p/one-more-prompt.jpg'],
      blurb: 'An exhausted elf at 2 a.m., promising it’s the last one. It isn’t.', badge: '', variants: {} },
    { id: 'context-full', name: 'Context Window Full hoodie', type: 'hoodie', price: 68, body: '#A9C8E8', photos: ['assets/p/context-full.jpg'],
      blurb: 'A snowman squished against the window by too many presents. Ice blue.', badge: '', variants: {} },
    { id: 'agent-workshop', name: 'Agent Workshop hoodie', type: 'hoodie', price: 68, body: '#6E1E2A', photos: ['assets/p/agent-workshop.jpg'],
      blurb: 'Robot elves building a rocket under the workshop lights. Burgundy.', badge: '', variants: {} },
    { id: 'green-build', name: 'All I Want Is One Green Build hoodie', type: 'hoodie', price: 68, body: '#1E4A33', photos: ['assets/p/green-build.jpg'],
      blurb: 'A Christmas tree made of passing checks. The best present a team can get.', badge: '', variants: {} },
    { id: 'santa-knit', name: 'Santa Claude knit sweater', type: 'sweater', price: 84, body: '#EFE6D6', photos: ['assets/p/santa-knit.jpg'],
      blurb: 'The Santa Claude chimney scene, knitted, with fair isle trees and snowflakes.', badge: '', variants: {} },
    { id: 'compact-knit', name: 'Claude /compact knit sweater', type: 'sweater', price: 84, body: '#333335', photos: ['assets/p/compact-knit.jpg'],
      blurb: 'Charcoal knit with the overstuffed suitcase and a /compact command across the hem.', badge: '', variants: {} },
    { id: 'wishlist-knit', name: 'Claude Wrote My Wishlist knit sweater', type: 'sweater', price: 84, body: '#24503A', photos: ['assets/p/wishlist-knit.jpg'],
      blurb: 'Pine green knit, the wishlist scroll, and a border of trees and stars.', badge: '', variants: {} },
    { id: 'snow-knit', name: 'let it snow knit sweater', type: 'sweater', price: 84, body: '#B34A26', photos: ['assets/p/snow-knit.jpg'],
      blurb: 'Rust red knit with a terminal window full of snow and a little tree.', badge: '', variants: {} }
  ],

  // Shown under the product, per type.
  details: {
    hoodie: [
      ['Fabric', '400 gsm brushed cotton fleece, 80% cotton / 20% polyester. Heavy, soft inside, holds its shape.'],
      ['Fit', 'Relaxed, with dropped shoulders. Take your usual size; size down for a closer fit.'],
      ['Print', 'Screen printed, so it won’t crack or peel.'],
      ['Care', 'Wash cold inside out. Tumble dry low or hang dry.']
    ],
    sweater: [
      ['Fabric', 'Knitted cotton-acrylic blend, warm without the itch.'],
      ['Fit', 'Classic crew neck with ribbed cuffs and hem. Take your usual size.'],
      ['Design', 'Knitted in, not printed, so it never fades.'],
      ['Care', 'Hand wash or machine wash cold on a gentle cycle. Dry flat.']
    ]
  },

  // Chest width and body length in inches, laid flat.
  sizeChart: [['S', 21, 27], ['M', 22.5, 28], ['L', 24, 29], ['XL', 25.5, 30], ['2XL', 27, 31]]
};
