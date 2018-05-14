/* Copyright (c) 2018, Ronald Römer
This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.
*/

(function() {

    var doc = getDocument();
    var di = getDocumentInterface();

    var offsLay = doc.queryLayer('Offs');

    if (isNull(offsLay)) {
        offsLay = addLayer('Offs', 'Green');
    }

    var entities;

    if (doc.countSelectedEntities() > 0) {
        entities = doc.querySelectedEntities();
    } else {
        entities = doc.queryAllEntities();
    }

    for (var i = 0; i < entities.length; i++) {
        var ent = doc.queryEntity(entities[i]);

        if (isBlockReferenceEntity(ent)) {
            var blkId = ent.getReferencedBlockId();
            var itms = doc.queryBlockEntities(blkId);

            di.setCurrentBlock(blkId);

            var filtered = [];

            for (var j = 0; j < itms.length; j++) {
                var itmA = doc.queryEntity(itms[j]),
                    shA = itmA.castToShape();

                if (isPolylineEntity(itmA)
                    && itmA.isClosed()
                    && itmA.getLayerName() != 'Gravur') {

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

                        var op = new RModifyObjectsOperation();

                        itmA.reverse();
                        op.addObject(itmA, false);
                        di.applyOperation(op);
                    }

                    filtered.push(itmA);
                }

            }

            var offs = [];

            /*
            for (var j = 0; j < filtered.length; j++) {
                var worker = new RPolygonOffset(.15/2, 1, RVector.invalid, RS.JoinMiter, false);
                worker.setForceSide(RS.RightHand);
                worker.addPolyline(filtered[j].castToShape());

                Array.prototype.push.apply(offs, worker.getOffsetShapes());
            }
            */

            // mit workaround

            for (var j = 0; j < filtered.length; j++) {

                var expl = filtered[j].getExploded();

                for (var k = 0; k < expl.length; k++) {
                    var newPl = new RPolyline(expl);
                    newPl.convertToClosed();

                    var worker = new RPolygonOffset(.15/2, 1, RVector.invalid, RS.JoinMiter, false);
                    worker.setForceSide(RS.RightHand);
                    worker.addPolyline(newPl);

                    var res = worker.getOffsetShapes();

                    if (res.length == 0) {
                        expl.push(expl.shift());
                    } else {
                        Array.prototype.push.apply(offs, res);

                        break;
                    }

                }

            }

            di.setCurrentLayer(offsLay.getId());

            var op = new RAddObjectsOperation();

            for (var j = 0; j < offs.length; j++) {
                var off = shapeToEntity(doc, offs[j].data());

                if (offs[j].getOrientation() == RS.CCW) {
                    off.setCustomProperty('Foo', 'Outer', 'yes');
                }

                op.addObject(off);
            }

            di.applyOperation(op);

            di.setCurrentLayer(doc.getLayer0Id());


            di.setCurrentBlock(doc.getModelSpaceBlockId());
        }
    }

})();
