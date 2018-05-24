#!/bin/bash
~/go/bin/minify --type js -o dist/lc.js < <(gawk '@load "readfile"; BEGIN { printf "var cfg = %s;", readfile("cfg.json") }; !/kdTree.js/ && !/cfg.json/' 0*.js | cat kdTree.js -)
