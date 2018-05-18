#!/bin/bash
~/go/bin/minify --type js -o dist/lc.js < <(gawk '!/kdTree.js/' 0*.js | cat kdTree.js -)
