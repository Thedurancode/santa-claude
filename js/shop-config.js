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
  bundle: { qty: 2, percentOff: 15 },  // 2+ hoodies in the bag = 15% off each (add a matching automatic discount in Shopify)
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

  // body: hoodie colour · ink: print colour · ink2: second print colour · art: which print (see shop.js PRINTS)
  // variants: Shopify variant ID per size, e.g. { S: '44123456789', M: '…' }
  products: [
    {
      id: 'sweater', name: 'Ugly Sweater.exe', price: 74, body: '#1E5A45', ink: '#F3F5FA', ink2: '#E5323B', art: 'sweater',
      blurb: 'A knit-pattern chest band built from pixels, and a pixel tree on the back that says DEPLOY FREEZE.',
      badge: '', variants: {}
    },
    {
      id: 'sleigh', name: 'Works on My Sleigh', price: 72, body: '#161C40', ink: '#F3F5FA', ink2: '#F4C542', art: 'sleigh',
      blurb: 'For every “it works on my machine” you’ve ever said. Small hat on the chest, the full excuse on the back.',
      badge: '', variants: {}
    },
    {
      id: 'hotfix', name: 'Ho Ho Hotfix', price: 72, body: '#D92F38', ink: '#F3F5FA', ink2: '#F4C542', art: 'hotfix',
      blurb: 'Candy-cane red, for the one who patches prod on Christmas Eve. The commit message is on the back.',
      badge: '', variants: {}
    },
    {
      id: 'gift', name: 'git push --gift', price: 72, body: '#E7EDF6', ink: '#161C40', ink2: '#D92F38', art: 'gift',
      blurb: 'Snow white with the command on the chest and the naughty-or-nice check on the back, in code.',
      badge: '', variants: {}
    }
  ],

  details: [
    ['Fabric', '400 gsm brushed cotton fleece, 80% cotton / 20% polyester. Heavy, soft inside, holds its shape.'],
    ['Fit', 'Relaxed and a little boxy, with dropped shoulders. Take your usual size; size down for a closer fit.'],
    ['Print', 'Screen printed, so it won’t crack or peel.'],
    ['Care', 'Wash cold inside out. Tumble dry low or hang dry.']
  ],

  // Chest width and body length in inches, laid flat.
  sizeChart: [['S', 21, 27], ['M', 22.5, 28], ['L', 24, 29], ['XL', 25.5, 30], ['2XL', 27, 31]]
};
