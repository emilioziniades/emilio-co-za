# This script calculates hashes of inline style elements in html documents.
# Then, it builds out a Content-Security-Policy header, and modifies the netlify.toml
# configuration file with the new Content-Security-Policy header. To run it, use uv:
# `uv run scripts/csp.py`
# For future Emilio, the reason I wrote this script is because netlify suddenly started putting
# CSP headers onto my website, but the hashes were wrong, so my inline styles weren't working. I use
# inline styles because the theme I am using, zola-bearblog, ALSO uses inline styles, and mixing inline
# styles with css files creates weird splashes.

import base64
import os
from dataclasses import dataclass
from hashlib import sha256
from html.parser import HTMLParser
from pathlib import Path

import toml


@dataclass
class ContentSecurityPolicy:
    directive: str
    sources: list[str]

    def __str__(self) -> str:
        sources = " ".join(f"{src}" for src in sorted(self.sources))
        return f"{self.directive} {sources}"


@dataclass
class ContentSecurityPolicyHeader:
    policies: list[ContentSecurityPolicy]

    def __str__(self) -> str:
        return "; ".join(str(p) for p in self.policies)


class InlineStyleParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_inline_style_tag = False
        self.inline_styles: list[str] = []

    def handle_starttag(self, tag: str, attrs):
        if tag == "style":
            self.in_inline_style_tag = True

    def handle_endtag(self, tag: str):
        if tag == "style":
            self.in_inline_style_tag = False

    def handle_data(self, data: str):
        if self.in_inline_style_tag:
            self.inline_styles.append(data)


# All from Starter Policy (https://content-security-policy.com/), except style-src
CONTENT_SECURITY_POLICIES = [
    ContentSecurityPolicy("default-src", ["'none'"]),
    ContentSecurityPolicy("script-src", ["'self'"]),
    ContentSecurityPolicy("connect-src", ["'self'"]),
    ContentSecurityPolicy("img-src", ["'self'"]),
    ContentSecurityPolicy("base-uri", ["'self'"]),
    ContentSecurityPolicy("form-action", ["'self'"]),
]
BUILD_DIRECTORY = Path(__file__).parent.parent / "public"
NETLIFY_CONFIG_FILE = Path(__file__).parent.parent / "netlify.toml"


def main():
    inline_style_hashes = get_inline_style_hashes(BUILD_DIRECTORY)
    style_src_sources = ["'self'"] + list(f"'{i}'" for i in inline_style_hashes)
    style_src_policy = ContentSecurityPolicy("style-src", style_src_sources)

    csp_header = ContentSecurityPolicyHeader(
        CONTENT_SECURITY_POLICIES + [style_src_policy]
    )

    netlify_config = toml.loads(NETLIFY_CONFIG_FILE.read_text())

    # Update the Content-Security-Policy header, which is assumed to be the first header in the config
    netlify_config["headers"][0]["values"]["Content-Security-Policy"] = str(csp_header)

    NETLIFY_CONFIG_FILE.write_text(toml.dumps(netlify_config))


def csp_hash(text: str) -> str:
    sha256sum = sha256(text.encode()).digest()
    base64_sha256sum = base64.b64encode(sha256sum).decode()

    return f"sha256-{base64_sha256sum}"


def get_inline_style_hashes(build_directory: Path) -> set[str]:
    inline_style_hashes = set()

    for root, _, files in os.walk(build_directory):
        for file in files:
            path = Path(root, file)

            if path.suffix != ".html":
                continue

            parser = InlineStyleParser()
            parser.feed(path.read_text())

            inline_style_hashes.update(csp_hash(i) for i in parser.inline_styles)

    return inline_style_hashes


if __name__ == "__main__":
    main()
