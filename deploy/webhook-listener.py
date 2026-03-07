#!/usr/bin/env python3
"""Lightweight webhook listener for GitHub Release deployments.

Validates HMAC signatures and triggers deploy.sh on valid requests.
No external dependencies — uses Python stdlib only.
"""

import hashlib
import hmac
import json
import os
import subprocess
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler

WEBHOOK_SECRET = os.environ.get("WEBHOOK_SECRET", "")
DEPLOY_SCRIPT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "deploy.sh")
PORT = int(os.environ.get("WEBHOOK_PORT", "9000"))


def verify_signature(payload: bytes, signature: str) -> bool:
    if not WEBHOOK_SECRET:
        print("WARNING: WEBHOOK_SECRET not set, rejecting all requests", flush=True)
        return False
    if not signature.startswith("sha256="):
        return False
    expected = hmac.new(
        WEBHOOK_SECRET.encode(), payload, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature[7:])


class WebhookHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != "/deploy-webhook":
            self.send_response(404)
            self.end_headers()
            return

        content_length = int(self.headers.get("Content-Length", 0))
        payload = self.rfile.read(content_length)
        signature = self.headers.get("X-Hub-Signature-256", "")

        if not verify_signature(payload, signature):
            print(f"Invalid signature from {self.client_address[0]}", flush=True)
            self.send_response(403)
            self.end_headers()
            self.wfile.write(b"Invalid signature")
            return

        try:
            data = json.loads(payload)
            tag = data.get("tag", "")
        except (json.JSONDecodeError, KeyError):
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b"Invalid payload")
            return

        if not tag:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b"Missing tag")
            return

        print(f"Deploying {tag}...", flush=True)

        # Spawn deploy in background
        subprocess.Popen(
            [DEPLOY_SCRIPT, "deploy", tag],
            stdout=open(f"/tmp/deploy-{tag}.log", "w"),
            stderr=subprocess.STDOUT,
            start_new_session=True,
        )

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"status": "deploying", "tag": tag}).encode())

    def do_GET(self):
        if self.path == "/deploy-webhook":
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"Webhook listener active")
            return
        self.send_response(404)
        self.end_headers()

    def log_message(self, format, *args):
        print(f"[webhook] {args[0]}", flush=True)


def main():
    if not WEBHOOK_SECRET:
        print("ERROR: WEBHOOK_SECRET environment variable is required", file=sys.stderr)
        sys.exit(1)

    server = HTTPServer(("0.0.0.0", PORT), WebhookHandler)
    print(f"Webhook listener started on port {PORT}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...", flush=True)
        server.server_close()


if __name__ == "__main__":
    main()
