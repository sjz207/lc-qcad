/* Copyright (c) 2018, Ronald Römer
This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.
*/

(function() {

    var doc = getDocument();
    var di = getDocumentInterface();
    var entities = doc.queryAllEntities();

    var layA = doc.queryLayer('Schneiden');
    if (isNull(layA)) {
        layA = addLayer('Schneiden', 'Black');
    }

    var layB = doc.queryLayer('Gravur');

    if (!isNull(layB)) {
        var op = new RModifyObjectsOperation();

        layB.setLineweight(RLineweight.Weight000);
        layB.setColor(new RColor('Red'));

        op.addObject(layB, false);
        di.applyOperation(op);
    }

    function SetStyle (itm) {
        if (itm.getLayerName() != 'Gravur') {
            itm.setLayerId(layA.getId());
        }
        itm.setLinetypeId(0);
        itm.setLineweight(RLineweight.WeightByLayer);
        itm.setColor(new RColor(RColor.ByLayer));
    }

    for (var i = 0; i < entities.length; i++) {
        var ent = doc.queryEntity(entities[i]);

        if (isBlockReferenceEntity(ent)) {
            var b = ent.getReferencedBlockId();
            var itms = doc.queryBlockEntities(b);

            var op = new RDeleteObjectsOperation(false);

            for (var j = 0; j < itms.length; j++) {
                var itm = doc.queryEntity(itms[j]);

                if (isHatchEntity(itm)) {
                    op.deleteObject(itm);
                }
            }

            di.applyOperation(op);

            var op2 = new RModifyObjectsOperation();

            for (var j = 0; j < itms.length; j++) {
                var itm = doc.queryEntity(itms[j]);

                if (!isNull(itm)) {
                    SetStyle(itm);

                    if (isPolylineEntity(itm)) {

                        var newSegs = [];

                        var c = 0;

                        for (var k = 0; k < itm.countSegments(); k++) {
                            var seg = itm.getSegmentAt(k);
                            if (isLineShape(seg)) {
                                if (seg.getLength() < 1e-5) {
                                    c++;
                                    continue;
                                }
                            }

                            newSegs.push(seg.clone());
                        }

                        if (c > 0) {
                            var num = newSegs.length;

                            for (var k = 0; k < num; k++) {
                                var shA = newSegs[k],
                                    shB = newSegs[(k+1)%num];

                                if (isArcShape(shA) && isArcShape(shB)) {
                                    // nix
                                } else if (isArcShape(shA) && isLineShape(shB)) {
                                    if (shB.getStartPoint().equalsFuzzy(shA.getEndPoint(), 1e-5)) {
                                        shB.setStartPoint(shA.getEndPoint());
                                    }
                                } else {
                                    if (shA.getEndPoint().equalsFuzzy(shB.getStartPoint(), 1e-5)) {
                                        shA.setEndPoint(shB.getStartPoint());
                                    }
                                }

                            }

                            var pl = new RPolyline();

                            for (var k = 0; k < num; k++) {
                                pl.appendShapeAuto(newSegs[k]);
                            }

                            if (pl.isGeometricallyClosed(1e-5)) {
                                pl.convertToClosed();
                            }

                            itm.setShape(pl);
                        }

                    }

                    op2.addObject(itm, false);
                }
            }
            di.applyOperation(op2);

        } else if (isHatchEntity(ent)) {
            var op = new RDeleteObjectsOperation(false);
            op.deleteObject(ent);
            di.applyOperation(op);

        } else {
            var op = new RModifyObjectsOperation();
            SetStyle(ent);
            op.addObject(ent, false);
            di.applyOperation(op);

        }
    }

    // verschiebt die blöcke auf die 0

    var op = new RModifyObjectsOperation(false);

    var blocks = doc.queryAllBlockReferences();
    for (var i = 0; i < blocks.length; i++) {
        var ent = doc.queryEntity(blocks[i]);

        ent.setLayerId(doc.getLayer0Id());
        op.addObject(ent);
    }

    di.applyOperation(op);

    // löscht leere layer

    var op = new RDeleteObjectsOperation(false);

    var layers = doc.queryAllLayers();
    for (var i = 0; i < layers.length; i++) {
        if (doc.queryLayerEntities(layers[i], true).length == 0) {
            op.deleteObject(doc.queryLayer(layers[i]));
        }
    }
    di.applyOperation(op);

})();
