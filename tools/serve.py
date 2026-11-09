#!/usr/bin/env python3
"""ローカル確認用の静的サーバー。

  python3 tools/serve.py            # http://localhost:8000/
  python3 tools/serve.py --port 9000 --host 0.0.0.0

index.html は file:// でも動く（生成はすべてブラウザ内で完結する）が、
http で見たいとき用。標準ライブラリだけで動く。
"""

import argparse
import functools
import http.server
import os
import socketserver
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), os.pardir, "web")


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # 開発中に編集した内容がすぐ反映されるように
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))


def main():
    ap = argparse.ArgumentParser(description="ありそうな会社名ジェネレータの確認用サーバー")
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--port", type=int, default=8000)
    args = ap.parse_args()

    if not os.path.isfile(os.path.join(ROOT, "index.html")):
        sys.exit("web/index.html が見つかりません: %s" % ROOT)

    handler = functools.partial(Handler, directory=ROOT)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer((args.host, args.port), handler) as httpd:
        print("http://%s:%d/  (%s)" % (args.host, args.port, ROOT))
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n停止しました")


if __name__ == "__main__":
    main()
