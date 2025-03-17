build:
    zola build

csp: build
    uv run --directory scripts csp.py
