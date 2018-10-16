/* Copyright (c) 2018, Ronald Römer
This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.
*/

include('/home/zippy/lc-qcad/tools.js');

var cfg = JSON.parse(readTextFile('/home/zippy/lc-qcad/cfg.json'));

(function() {
    var before = Date.now();

    var doc = getDocument();
    var di = getDocumentInterface();

    if (cfg['del-tmp-layers']) {
        var layers = ['Convex', 'New', 'OBB', 'Offs'];

        if (!cfg['add-markers']) {
            layers.push('Markers');
        }

        var op = new RDeleteObjectsOperation(false);

        layers.forEach(function (name) {
            var lay = doc.queryLayer(name);
            op.deleteObject(lay);
        });

        di.applyOperation(op);
    }

    qDebug((Date.now()-before)/1e3, 's');

})();
