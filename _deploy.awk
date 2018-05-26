@load "readfile"

BEGIN {
    print readfile("kdTree.js")
    print "function bundleFct (cfg) {";
    printf "if (typeof cfg === 'undefined') { var cfg = %s; }", readfile("cfg.json")
}

END { print "}" }

!/kdTree.js/ && !/cfg.json/
