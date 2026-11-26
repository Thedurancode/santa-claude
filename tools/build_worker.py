"""Copy prices from js/shop-config.js into the checkout worker.

    python3 tools/build_worker.py

Writes checkout-worker/worker.js, the single file you deploy to Cloudflare.
"""
import json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cfg = open(os.path.join(ROOT, 'js/shop-config.js'), encoding='utf-8').read()

products = {}
for m in re.finditer(r"\{\s*id:\s*'([^']+)',\s*name:\s*'((?:[^'\\]|\\.)*)'(.*?)variants:", cfg, re.S):
    rest = m.group(3)
    pic = re.search(r"image:\s*'([^']+)'", rest) or re.search(r"photos:\s*\['([^']+)'", rest)
    products[m.group(1)] = {'name': m.group(2).replace("\\'", "'"), 'price': float(re.search(r"price:\s*([\d.]+)", rest).group(1)), 'photo': pic.group(1) if pic else 'assets/og.png'}
sizes = re.findall(r"'([^']+)'", re.search(r"sizes:\s*\[([^\]]*)\]", cfg).group(1))
bundle = re.search(r"bundle:\s*\{\s*qty:\s*(\d+),\s*percentOff:\s*([\d.]+)", cfg)
free = re.search(r"freeShippingOver:\s*([\d.]+)", cfg)
ship = re.search(r"shippingFlat:\s*([\d.]+)", cfg)
currency = re.search(r"currency:\s*'([A-Za-z]{3})'", cfg).group(1).lower()

catalog = {
    'currency': currency, 'sizes': sizes, 'products': products,
    'bundle': {'qty': int(bundle.group(1)), 'percentOff': float(bundle.group(2))},
    'freeShippingOver': float(free.group(1)) if free else 0,
    'shippingCents': int(round(float(ship.group(1)) * 100)) if ship else 800,
}
tpl = open(os.path.join(ROOT, 'checkout-worker/worker.template.js'), encoding='utf-8').read()
out = re.sub(r"/\*CATALOG\*/.*?/\*END\*/", json.dumps(catalog, ensure_ascii=False, indent=2), tpl, flags=re.S)
open(os.path.join(ROOT, 'checkout-worker/worker.js'), 'w', encoding='utf-8').write(out)
print(f"{len(products)} products, sizes {sizes}, written checkout-worker/worker.js")
