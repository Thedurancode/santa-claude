"""Local helper: serves the shop and saves cut-out images posted by tools/cutout.html.
Run from the repo root: python3 tools/cutout_server.py  (port 4190). Not part of the site."""
import http.server, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'p', 'cut')


class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def do_PUT(self):
        m = re.fullmatch(r'/save/([a-z0-9-]+\.webp)', self.path)
        if not m:
            self.send_error(400); return
        os.makedirs(OUT, exist_ok=True)
        data = self.rfile.read(int(self.headers['Content-Length']))
        open(os.path.join(OUT, m.group(1)), 'wb').write(data)
        self.send_response(204); self.end_headers()


http.server.ThreadingHTTPServer(('127.0.0.1', 4190), H).serve_forever()
