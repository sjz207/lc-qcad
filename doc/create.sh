#!/bin/bash
pdflatex values.tex && convert -density 300 -geometry 750 values.pdf -background white -flatten -unsharp 5x1 values.png
