#!/usr/bin/env bash
# sheet.sh out.png a.png b.png ...  -> contact sheet, 3 columns of 640x360 tiles (row-major, in argument order)
out=$1; shift
args=(); fc=""; n=0
for f in "$@"; do
  args+=(-i "$f")
  lab=$(basename "$f" .png | sed 's/.*-f//')
  fc+="[$n]scale=640:360[t$n];"
  n=$((n+1))
done
while [ $((n % 3)) -ne 0 ]; do args+=(-f lavfi -i color=c=gray:s=640x360:d=1); fc+="[$n]null[t$n];"; n=$((n+1)); done
rows=$((n / 3)); stack=""
for ((r=0; r<rows; r++)); do fc+="[t$((3*r))][t$((3*r+1))][t$((3*r+2))]hstack=3[r$r];"; stack+="[r$r]"; done
if [ $rows -gt 1 ]; then fc+="${stack}vstack=$rows[o]"; else fc+="${stack}null[o]"; fi
ffmpeg -v error -y "${args[@]}" -filter_complex "$fc" -map "[o]" -frames:v 1 "$out"
