#!/usr/bin/env python3
"""Optional dev server for Nova Store.

Same as `python3 -m http.server`, except that missing pages get the
store's own 404.html (with a 404 status) instead of Python's default page.

Usage:
    python3 serve.py          # http://localhost:8000
    python3 serve.py 3000     # custom port
"""
import http.server
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000


class StoreHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def send_error(self, code, message=None, explain=None):
        if code != 404:
            return super().send_error(code, message, explain)

        # <base href="/"> keeps css/ and js/ paths working for nested URLs like /a/b/c.
        html = (ROOT / "404.html").read_text(encoding="utf-8")
        body = html.replace("<head>", '<head>\n  <base href="/">', 1).encode("utf-8")

        self.send_response(404)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)


if __name__ == "__main__":
    with http.server.ThreadingHTTPServer(("127.0.0.1", PORT), StoreHandler) as server:
        print(f"Nova Store running at http://localhost:{PORT}  (Ctrl+C to stop)")
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
