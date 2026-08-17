#!/bin/bash
# Generate luxury property images in parallel for the Dubai real estate portal

set -e
OUT_DIR="/home/z/my-project/public/images"
mkdir -p "$OUT_DIR"

# Property 1: Penthouse - Dubai Marina
z-ai image -p "Luxury penthouse interior with floor-to-ceiling windows overlooking Dubai Marina at twilight, modern minimalist design, marble floors, warm ambient lighting, designer furniture, panoramic skyline view, professional architectural photography, ultra detailed" -o "$OUT_DIR/prop-penthouse-marina.png" -s 1024x1024 &

# Property 2: Villa - Palm Jumeirah
z-ai image -p "Modern luxury beachfront villa in Palm Jumeirah Dubai at golden hour, infinity pool, glass walls, white minimalist architecture, palm trees, ocean view, twilight sky with purple pink tones, architectural photography, ultra detailed" -o "$OUT_DIR/prop-villa-palm.png" -s 1024x1024 &

# Property 3: Apartment - Downtown Dubai
z-ai image -p "Luxurious modern apartment living room in Downtown Dubai with view of Burj Khalifa through floor-to-ceiling windows, contemporary furniture, warm wood accents, soft golden hour lighting, marble floors, professional interior photography" -o "$OUT_DIR/prop-apt-downtown.png" -s 1024x1024 &

# Property 4: Villa - Emirates Hills
z-ai image -p "Opulent Mediterranean-style mansion in Emirates Hills Dubai, landscaped gardens, private pool, two-story luxury villa, manicured lawn, blue sky at golden hour, twilight, professional real estate photography, ultra detailed" -o "$OUT_DIR/prop-villa-emirates.png" -s 1024x1024 &

# Property 5: Penthouse - Business Bay
z-ai image -p "Ultra-luxurious duplex penthouse terrace in Business Bay Dubai with private infinity pool, glass railing, panoramic skyline view at sunset, modern outdoor furniture, warm orange sky, professional photography, ultra detailed" -o "$OUT_DIR/prop-penthouse-bizbay.png" -s 1024x1024 &

# Property 6: Apartment - JBR
z-ai image -p "Beachfront luxury apartment in Jumeirah Beach Residence Dubai, bright airy living room, white interior, blue ocean view through large windows, contemporary minimalist design, natural daylight, professional interior photography" -o "$OUT_DIR/prop-apt-jbr.png" -s 1024x1024 &

wait
echo "All property images generated."
ls -la "$OUT_DIR"
