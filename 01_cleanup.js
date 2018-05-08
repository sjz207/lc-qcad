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
                            var k = 0;

                            while (k < newSegs.length
                                && (isArcShape(newSegs[0]) || isArcShape(newSegs[newSegs.length-1]))) {

                                newSegs.push(newSegs.shift());

                                k++;
                            }

                            var pl = new RPolyline();

                            for (var k = 0; k < newSegs.length; k++) {
                                pl.appendShapeAuto(newSegs[k]);
                            }

                            pl.convertToClosed();

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

})();
