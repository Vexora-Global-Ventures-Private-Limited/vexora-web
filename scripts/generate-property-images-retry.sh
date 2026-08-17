#!/bin/bash
# Retry remaining property images sequentially with delays

set -e
OUT_DIR="/home/z/my-project/public/images"
mkdir -p "$OUT_DIR"

generate() {
  local prompt="$1"
  local out="$2"
  if [ -f "$out" ] && [ -s "$out" ]; then
    echo "SKIP (exists): $out"
    return 0
  fi
  for attempt in 1 2 3 4 5; do
    if z-ai image -p "$prompt" -o "$out" -s 1024x1024 2>&1 | tail -2; then
      if [ -f "$out" ] && [ -s "$out" ]; then
        echo "OK: $out"
        return 0
      fi
    fi
    echo "Retry $attempt for $out..."
    sleep 8
  done
  echo "FAIL: $out"
}

generate "Luxurious modern apartment living room in Downtown Dubai with view of Burj Khalifa through floor-to-ceiling windows, contemporary furniture, warm wood accents, soft golden hour lighting, marble floors, professional interior photography" "$OUT_DIR/prop-apt-downtown.png"
sleep 4
generate "Opulent Mediterranean-style mansion in Emirates Hills Dubai, landscaped gardens, private pool, two-story luxury villa, manicured lawn, blue sky at golden hour, twilight, professional real estate photography, ultra detailed" "$OUT_DIR/prop-villa-emirates.png"
sleep 4
generate "Ultra-luxurious duplex penthouse terrace in Business Bay Dubai with private infinity pool, glass railing, panoramic skyline view at sunset, modern outdoor furniture, warm orange sky, professional photography, ultra detailed" "$OUT_DIR/prop-penthouse-bizbay.png"
sleep 4
generate "Beachfront luxury apartment in Jumeirah Beach Residence Dubai, bright airy living room, white interior, blue ocean view through large windows, contemporary minimalist design, natural daylight, professional interior photography" "$OUT_DIR/prop-apt-jbr.png"

echo "=== FINAL ==="
ls -la "$OUT_DIR"
