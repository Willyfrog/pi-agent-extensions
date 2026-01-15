---
name: weather-check
description: Check current weather and forecast via a simple CLI script. Use when the user asks for current conditions, temperature, wind, or a quick forecast. Defaults to Torrejón de Ardoz and metric units.
compatibility: Requires network access and curl.
---

# Weather Check

## Setup

Ensure the script is executable:

```bash
cd /path/to/project
chmod +x .pi/skills/weather-check/scripts/weather.sh
```

## Usage

```bash
./.pi/skills/weather-check/scripts/weather.sh "Berlin"
./.pi/skills/weather-check/scripts/weather.sh "New York"
./.pi/skills/weather-check/scripts/weather.sh "" "v2"   # default location
```

- First argument: location (city name, zip, lat,lon). Leave empty for the default.
- Second argument (optional): wttr.in format (default: `3`, try `v2` for multi-line).
- Output uses metric units.

## Tool

If the `weather` tool is available, call it directly:

```text
weather {"location": "Berlin", "format": "3"}
```

## Command

Use the command to get a quick notification:

```text
/weather
/weather Madrid v2
```

## Workflow

1. Run the script with the requested location.
2. Return the output verbatim.
3. If the user wants more detail, rerun with format `v2`.
