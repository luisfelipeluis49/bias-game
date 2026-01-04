#!/usr/bin/env bash
set -euo pipefail

CARDS_DIR="$(cd "$(dirname "$0")/../assets/images/cards" && pwd)"
SRC_DIR="$CARDS_DIR/original"
DEST_DIR="$CARDS_DIR/compressed"
CMD=""

if command -v magick >/dev/null 2>&1; then
  CMD="magick"
elif command -v convert >/dev/null 2>&1; then
  CMD="convert"
else
  echo "ImageMagick is required (install via: sudo apt-get install -y imagemagick)" >&2
  exit 1
fi

echo "Source: $SRC_DIR"
echo "Output: $DEST_DIR"

mkdir -p "$DEST_DIR"

# Clean previous AVIF outputs so numbering stays predictable
find "$DEST_DIR" -maxdepth 1 -type f -name 'card_*.avif' -print -delete

mapfile -t FILES < <(find "$SRC_DIR" -maxdepth 1 -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \) -print | sort)
TOTAL=${#FILES[@]}
if (( TOTAL == 0 )); then
  echo "No source images found in $CARDS_DIR" >&2
  exit 0
fi

echo "Converting $TOTAL images to AVIF (compressed)…"
idx=1
for SRC in "${FILES[@]}"; do
  BASENAME=$(basename "$SRC")
  PADDED=$(printf "%03d" "$idx")
  DEST="$DEST_DIR/card_${PADDED}.avif"

  echo "[$idx/$TOTAL] $BASENAME -> $(basename "$DEST")"
  "$CMD" "$SRC" \
    -strip \
    -resize '2048x2048>' \
    -quality 60 \
    -define heic:speed=6 \
    -define heic:lossless=false \
    -define heic:chroma-subsampling=4:2:0 \
    "$DEST"

  idx=$((idx + 1))
done

echo "Done. Created $(find "$DEST_DIR" -maxdepth 1 -type f -name 'card_*.avif' | wc -l) AVIF files."
