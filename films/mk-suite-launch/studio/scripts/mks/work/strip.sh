#!/usr/bin/env bash
# strip.sh in.mp4 out.png fromLocal step [cols rows]  -> contact strip of frames (local = composition - 12)
in=$1; out=$2; a=$(( $3 + 12 )); k=$4; c=${5:-4}; r=${6:-3}
ffmpeg -v error -y -i "$in" -vf "select='gte(n,$a)*not(mod(n-$a,$k))',scale=480:270,drawtext=text='%{eif\:n*$k+($3)\:d}':x=6:y=6:fontsize=20:fontcolor=yellow:fontfile='C\:/Windows/Fonts/arial.ttf',tile=${c}x${r}" -frames:v 1 "$out"
