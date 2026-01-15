#!/usr/bin/env bash
set -euo pipefail

location=${1:-}
format=${2:-3}

if [[ -n "${location}" ]]; then
  url="https://wttr.in/${location}?format=${format}"
else
  url="https://wttr.in/?format=${format}"
fi

curl -fsSL "${url}"
