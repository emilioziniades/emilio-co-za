#!/usr/bin/env bash

themes=$(curl -s https://api.github.com/repos/getzola/zola/contents/components/config/sublime/themes | jq -r '.[].name' | sed 's/.tmTheme//')

echo "All themes:"
echo "$themes" | tr " " "\n"
echo ""

for theme in $themes; do
    echo "$theme"
    sed -i "s/highlight_theme = \".*\"/highlight_theme = \"$theme\"/" config.toml
    echo "press any key to try the next theme"
    read -r
done
