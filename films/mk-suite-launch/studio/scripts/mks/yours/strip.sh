#!/usr/bin/env bash
# Usage: strip.sh <clip.mp4> <out.png> [every=6]  -> 4×4 grid of every Nth frame (480×270 thumbs, row-major)
n=${3:-6}
ffmpeg -v error -y -i "$1" -vf "select='not(mod(n\,$n))',scale=480:270,tile=4x4" -frames:v 1 -vsync vfr "$2"
