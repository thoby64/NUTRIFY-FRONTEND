#!/usr/bin/env python3
"""Serve the frontend with extensionless HTML routes.

Examples:
  python3 serve.py
  python3 serve.py 5000
"""

from __future__ import annotations

import argparse
import posixpath
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit, urlunsplit


ROOT = Path(__file__).resolve().parent


class ExtensionlessFrontendHandler(SimpleHTTPRequestHandler):
    """Map extensionless routes onto HTML files and canonicalize browser URLs."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self) -> None:  # noqa: N802 - inherited API
        if self._redirect_to_canonical():
            return
        super().do_GET()

    def do_HEAD(self) -> None:  # noqa: N802 - inherited API
        if self._redirect_to_canonical():
            return
        super().do_HEAD()

    def translate_path(self, path: str) -> str:
        parsed = urlsplit(path)
        request_path = unquote(parsed.path)
        resolved = self._resolve_route(request_path)
        if resolved is not None:
            return str(resolved)
        return super().translate_path(request_path)

    def _redirect_to_canonical(self) -> bool:
        parsed = urlsplit(self.path)
        request_path = unquote(parsed.path)
        canonical = self._canonical_path(request_path)
        if canonical is None or canonical == request_path:
            return False

        location = urlunsplit(("", "", canonical, parsed.query, parsed.fragment))
        self.send_response(301)
        self.send_header("Location", location)
        self.end_headers()
        return True

    def _canonical_path(self, request_path: str) -> str | None:
        normalized = request_path or "/"

        if normalized == "/index.html":
            return "/"

        if normalized.endswith("/index.html"):
            base = normalized[:-10]
            return base or "/"

        if normalized.endswith(".html"):
            return normalized[:-5] or "/"

        if normalized != "/" and normalized.endswith("/"):
            html_candidate = ROOT / f"{normalized.strip('/')}.html"
            if html_candidate.is_file():
                return normalized.rstrip("/")

        if not normalized.endswith("/"):
            index_candidate = ROOT / normalized.lstrip("/") / "index.html"
            if index_candidate.is_file():
                return f"{normalized}/"

        return None

    def _resolve_route(self, request_path: str) -> Path | None:
        normalized = posixpath.normpath(request_path)
        if request_path.endswith("/") and not normalized.endswith("/"):
            normalized = f"{normalized}/"

        if normalized in {"", "."}:
            normalized = "/"

        if normalized == "/":
            root_index = ROOT / "index.html"
            return root_index if root_index.is_file() else None

        relative = normalized.lstrip("/")
        direct_candidate = ROOT / relative
        if direct_candidate.is_file():
            return direct_candidate

        if normalized.endswith("/"):
            index_candidate = ROOT / relative / "index.html"
            return index_candidate if index_candidate.is_file() else None

        html_candidate = ROOT / f"{relative}.html"
        if html_candidate.is_file():
            return html_candidate

        index_candidate = ROOT / relative / "index.html"
        if index_candidate.is_file():
            return index_candidate

        return None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Serve the frontend with extensionless routes")
    parser.add_argument("port", nargs="?", type=int, default=5000, help="Port to listen on")
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind to")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    server = ThreadingHTTPServer((args.host, args.port), ExtensionlessFrontendHandler)
    print(f"Serving frontend from {ROOT} at http://{args.host}:{args.port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
