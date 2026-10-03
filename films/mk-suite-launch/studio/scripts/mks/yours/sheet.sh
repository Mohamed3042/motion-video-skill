#!/usr/bin/env bash
# Usage: sheet.sh <out.png> <img1> <img2> [img3 img4]  -> 2×2 contact sheet of 960×540 thumbs (labelled by file name)
out=$1; shift
args=(); n=0
for f in "$@"; do args+=(-i "$f"); n=$((n+1)); done
while [ $n -lt 4 ]; do args+=(-f lavfi -i "color=c=black:s=1920x1080:d=1"); n=$((n+1)); done
ffmpeg -v error -y "${args[@]}" -filter_complex "[0]scale=960:540[a];[1]scale=960:540[b];[2]scale=960:540[c];[3]scale=960:540[d];[a][b][c][d]xstack=inputs=4:layout=0_0|w0_0|0_h0|w0_h0" -frames:v 1 "$out"
