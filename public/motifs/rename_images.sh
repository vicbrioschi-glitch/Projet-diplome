#!/bin/bash
# Script pour renommer les images motifs/ de 1A.png -> chapeau-a.png, etc.

words=(
  "chapeau" "pinceau" "pompier" "fourmis" "chalet" "portefeuille" "mortpion" "cartable" "rideau" "départ"
  "sirene" "rateau" "coussin" "millefeuille" "citron" "boisson" "bricole" "poirreau" "vernis" "page"
)

for i in {1..20}
do
  word=${words[$((i-1))]}
  for suffix in A B
  do
    oldname="${i}${suffix}.png"
    newname="${word}-$(echo $suffix | tr 'A-Z' 'a-z').png"
    if [ -f "$oldname" ]; then
      mv "$oldname" "$newname"
      echo "$oldname -> $newname"
    fi
  done
done
