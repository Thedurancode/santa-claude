/* Stack Threads shop settings: the only file you need to edit to run the store.

   1. PRODUCTS  names, prices, colours and the quote printed on each one.
                Each product is drawn by the site from these settings, so a new
                design needs no photo shoot. Front and back are lists of lines;
                start a line with ^ to print it in the accent colour.
   2. CHECKOUT  the store server URL (see checkout-worker/README.md). Until it
                is set, the bag sends a "hold my order" request to the inbox.
   3. PIXELS    paste your Meta / TikTok / Google IDs here, or better, in the
                admin panel (/admin/) once the store server is connected.
*/
window.SHOP = {
  brand: 'Stack Threads',
  tagline: 'Hoodies and tees for people who write code',
  currency: 'USD',
  freeShippingOver: 100,
  shippingFlat: 8,                     // dollars, charged under the free-shipping threshold
  bundle: { qty: 2, percentOff: 15 },  // 2+ items in the bag = 15% off each
  shipsIn: 'Ships in 2–3 business days',
  returns: 'Free size exchanges within 30 days',

  // The store server (checkout-worker/), e.g. 'https://stack-threads.yourname.workers.dev'.
  // It powers the admin panel at /admin/: visitor stats, orders, pixels and product settings.
  api: '',

  checkout: {
    // Stripe: the store server URL again. Empty = "hold my order" mode.
    stripeEndpoint: '',
    shopifyDomain: '',          // alternative to Stripe: e.g. 'stack-threads.myshopify.com'
    discountCode: '',           // optional code added to every checkout link
    holdEmail: 'emprezarioinc@gmail.com',
    captureLeads: true          // email the inbox when someone starts checkout, so abandoned bags can be followed up
  },

  pixels: {
    metaPixelId: '',      // Meta (Facebook / Instagram) Pixel ID
    tiktokPixelId: '',    // TikTok Pixel ID
    ga4Id: '',            // Google Analytics 4, 'G-XXXXXXX'
    googleAdsId: '',      // Google Ads, 'AW-XXXXXXXXX'
    googleAdsPurchaseLabel: '', // the label of your Purchase conversion action
    gtmId: '',            // Google Tag Manager, 'GTM-XXXXXXX' (optional)
    pinterestTagId: '',   // Pinterest Tag ID (optional)
    snapPixelId: ''       // Snapchat Pixel ID (optional)
  },

  sizes: ['S', 'M', 'L', 'XL', '2XL'],

  // type: 'hoodie' or 'tee' · body: garment colour · ink / ink2: print colours
  // font: 'mono', 'sans' (heavy block letters) or 'pix' (pixel)
  // image: picture used by Stripe, search engines and link previews
  products: [
    { id: 'works-on-my-machine', name: 'It Works On My Machine hoodie', type: 'hoodie', price: 64, body: '#22252B', ink: '#F2F4F7', ink2: '#7EE787', font: 'mono',
      front: ['it works', '^on my machine'], back: ['IT WORKS', 'ON MY', '^MACHINE'], image: 'assets/p/works-on-my-machine.png',
      blurb: 'The oldest defence in software, on heavyweight charcoal fleece. Ship the machine.', badge: 'Bestseller', variants: {} },
    { id: 'localhost', name: 'No Place Like 127.0.0.1 hoodie', type: 'hoodie', price: 64, body: '#E3E6EA', ink: '#15181D', ink2: '#2F5BFF', font: 'mono',
      front: ['^~$', 'cd ~'], back: ['THERE\'S NO', 'PLACE LIKE', '^127.0.0.1'], image: 'assets/p/localhost.png',
      blurb: 'For people whose favourite address is the one that always answers. Heather grey.', badge: '', variants: {} },
    { id: 'not-a-bug', name: 'Not A Bug hoodie', type: 'hoodie', price: 64, body: '#25345E', ink: '#FFFFFF', ink2: '#FFB454', font: 'sans',
      front: ['not a bug'], back: ['IT\'S NOT', 'A BUG.', '^IT\'S A', '^FEATURE.'], image: 'assets/p/not-a-bug.png',
      blurb: 'Release notes, but make it fashion. Navy with an amber print.', badge: '', variants: {} },
    { id: 'touch-grass', name: 'TODO: Touch Grass hoodie', type: 'hoodie', price: 64, body: '#34513A', ink: '#EAF2E3', ink2: '#B5E48C', font: 'mono',
      front: ['// TODO:', '^touch grass'], back: ['// TODO:', '^TOUCH', '^GRASS'], image: 'assets/p/touch-grass.png',
      blurb: 'A reminder you will keep pushing to the next sprint. Forest green.', badge: '', variants: {} },
    { id: 'merge-conflicts', name: 'Merge Conflicts Build Character hoodie', type: 'hoodie', price: 64, body: '#D9E0E7', ink: '#15181D', ink2: '#D7263D', font: 'mono',
      front: ['<<<<<<< HEAD'], back: ['<<<<<<< HEAD', 'MERGE CONFLICTS', '^BUILD CHARACTER', '>>>>>>> main'], image: 'assets/p/merge-conflicts.png',
      blurb: 'Every rebase makes you stronger. Pale steel with a red resolution.', badge: 'New', variants: {} },
    { id: 'deploy-friday', name: 'I Deploy On Fridays hoodie', type: 'hoodie', price: 64, body: '#A8382C', ink: '#FFF3E8', ink2: '#15181D', font: 'sans',
      front: ['git push', '^--friday'], back: ['I DEPLOY', 'ON', '^FRIDAYS'], image: 'assets/p/deploy-friday.png',
      blurb: 'For people who live dangerously and keep the rollback script open. Brick red.', badge: '', variants: {} },
    { id: 'exit-zero', name: 'Exit 0 hoodie', type: 'hoodie', price: 64, body: '#123F40', ink: '#E6FFFB', ink2: '#5EEAD4', font: 'mono',
      front: ['$ echo $?', '^0'], back: ['EXIT 0', '^ALL TESTS', '^PASSED'], image: 'assets/p/exit-zero.png',
      blurb: 'The best number in computing, in deep teal. Wear it on green-build days.', badge: '', variants: {} },
    { id: 'while-alive', name: 'while (alive) hoodie', type: 'hoodie', price: 64, body: '#45386F', ink: '#F3EFFF', ink2: '#FFD166', font: 'mono',
      front: ['while (alive) {', '^  code();', '}'], back: ['while (alive) {', '  eat();', '  sleep();', '^  code();', '}'], image: 'assets/p/while-alive.png',
      blurb: 'The whole life loop, no exit condition. Grape purple with a gold call.', badge: '', variants: {} },
    { id: 'hello-world', name: 'Hello, World. tee', type: 'tee', price: 32, body: '#FAFAFA', ink: '#15181D', ink2: '#2F5BFF', font: 'mono',
      front: ['^>', 'Hello, World.'], back: ['printf(', '^"hello, world\\n"', ');'], image: 'assets/p/hello-world.png',
      blurb: 'Where every one of us started. Clean white tee, blue prompt.', badge: '', variants: {} },
    { id: 'sleep-not-found', name: '404 Sleep Not Found tee', type: 'tee', price: 32, body: '#22252B', ink: '#F2F4F7', ink2: '#FF7B72', font: 'sans',
      front: ['^404'], back: ['^404', 'SLEEP', 'NOT FOUND'], image: 'assets/p/sleep-not-found.png',
      blurb: 'For on-call weeks and launch nights. Charcoal with a coral 404.', badge: '', variants: {} },
    { id: 'code-coffee-repeat', name: 'Code. Coffee. Repeat. tee', type: 'tee', price: 32, body: '#7A5137', ink: '#FFF4E6', ink2: '#FFD7A8', font: 'mono',
      front: ['code.', 'coffee.', '^repeat.'], back: ['for (;;) {', '  code();', '  coffee();', '^}'], image: 'assets/p/code-coffee-repeat.png',
      blurb: 'The infinite loop most of us actually run. Espresso brown.', badge: '', variants: {} },
    { id: 'dark-mode', name: 'Dark Mode Only tee', type: 'tee', price: 32, body: '#131518', ink: '#8B95A5', ink2: '#FFFFFF', font: 'sans',
      front: ['^dark mode'], back: ['DARK', 'MODE', '^ONLY'], image: 'assets/p/dark-mode.png',
      blurb: 'Light themes need not apply. Black on black with a white hit.', badge: '', variants: {} }
  ],

  // Shown under the product, per type.
  details: {
    hoodie: [
      ['Fabric', '400 gsm brushed cotton fleece, 80% cotton / 20% polyester. Heavy, soft inside, holds its shape.'],
      ['Fit', 'Relaxed, with dropped shoulders. Take your usual size; size down for a closer fit.'],
      ['Print', 'Screen printed, so it won’t crack or peel.'],
      ['Care', 'Wash cold inside out. Tumble dry low or hang dry.']
    ],
    tee: [
      ['Fabric', '220 gsm combed cotton. Thick enough that it won’t go see-through, soft from the first wear.'],
      ['Fit', 'Regular fit, slightly boxy. Take your usual size.'],
      ['Print', 'Screen printed, so it won’t crack or peel.'],
      ['Care', 'Wash cold inside out. Tumble dry low.']
    ]
  },

  // Chest width and body length in inches, laid flat, per type.
  sizeChart: {
    hoodie: [['S', 21, 27], ['M', 22.5, 28], ['L', 24, 29], ['XL', 25.5, 30], ['2XL', 27, 31]],
    tee: [['S', 19, 28], ['M', 20.5, 29], ['L', 22, 30], ['XL', 23.5, 31], ['2XL', 25, 32]]
  }
};
