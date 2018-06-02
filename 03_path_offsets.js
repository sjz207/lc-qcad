/* Copyright (c) 2018, Ronald Römer
This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.
*/

var cfg = JSON.parse(readTextFile('/home/zippy/lc-qcad/cfg.json'));

(function() {
    var before = Date.now();

    var doc = getDocument();
    var di = getDocumentInterface();

    var offsLay = doc.queryLayer('Offs');

    if (isNull(offsLay)) {
        offsLay = addLayer('Offs', 'Green');
    }

    var entities = doc.queryAllEntities();

    var op = new RAddObjectsOperation(false);

    for (var i = 0; i < entities.length; i++) {
        var ent = doc.queryEntity(entities[i]);

        if (isBlockReferenceEntity(ent)) {
            var itms = doc.queryBlockEntities(ent.getReferencedBlockId());

            var filtered = [];

            var op2 = new RModifyObjectsOperation(false);

            for (var j = 0; j < itms.length; j++) {
                var itmA = doc.queryEntity(itms[j]),
                    shA = itmA.castToShape();

                if (isPolylineEntity(itmA)
                    && itmA.isClosed()
                    && itmA.getLayerName() != cfg['engraving-layer-name']) {

                    var c = 0;

                    for (var k = 0; k < itms.length; k++) {
                        if (j != k) {
                            var itmB = doc.queryEntity(itms[k]),
                                shB = itmB.castToShape();

                            if (shB.containsShape(shA)) {
                                c++;

                                break;
                            }
                        }

                    }

                    if (c > 0 ^ shA.getOrientation() == RS.CW) {
                        // richtung umkehren

                        itmA.reverse();
                        op2.addObject(itmA, false);
                    }

                    filtered.push(itmA);
                }

            }

            di.applyOperation(op2);

            // mit workaround

            for (var j = 0; j < filtered.length; j++) {

                var expl = filtered[j].getExploded();

                for (var k = 0; k < expl.length; k++) {
                    var newPl = new RPolyline(expl);
                    newPl.convertToClosed();

                    var worker = new RPolygonOffset(cfg['cutting-width']/2, 1, RVector.invalid, RS.JoinMiter, false);
                    worker.setForceSide(RS.RightHand);
                    worker.addPolyline(newPl);

                    var offs = worker.getOffsetShapes();

                    if (offs.length == 0) {
                        expl.push(expl.shift());

                    } else {

                        for (var k = 0; k < offs.length; k++) {
                            var off = shapeToEntity(doc, offs[k].data());

                            off.copyAttributesFrom(filtered[j].data());
                            off.setLayerId(offsLay.getId());

                            if (offs[k].getOrientation() == RS.CCW) {
                                off.setCustomProperty('lc-qcad', 'outside', 1);
                            }

                            op.addObject(off, false);
                        }

                        break;
                    }

                }

            }
        }
    }

    di.applyOperation(op);

    qDebug((Date.now()-before)/1e3, 's');

})();
