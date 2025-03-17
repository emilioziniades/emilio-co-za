serve:
    zola serve

build:
    zola build

check: check-csp
    zola check

check-csp: csp
    git diff netlify.toml
    git diff --quiet netlify.toml || exit 1

csp: build
    uv run --directory scripts csp.py
