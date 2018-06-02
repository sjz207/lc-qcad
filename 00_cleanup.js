/* Copyright (c) 2018, Ronald Römer
This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.
*/

var cfg = JSON.parse(readTextFile('/home/zippy/lc-qcad/cfg.json'));

(function() {
    var before = Date.now();

    var doc = getDocument();
    var di = getDocumentInterface();

    var layA = doc.queryLayer('New');
    if (isNull(layA)) {
        layA = addLayer('New', 'Cyan');
    }

    var layB = doc.queryLayer(cfg['engraving-layer-name']);

    var op = new RDeleteObjectsOperation(false);

    var hatches = doc.queryAllEntities(false, true, RS.EntityHatch);

    for (var i = 0; i < hatches.length; i++) {
        op.deleteObject(doc.queryEntity(hatches[i]));
    }

    di.applyOperation(op);

    var op = new RModifyObjectsOperation(false);

    if (!isNull(layB)) {
        layB.setLineweight(RLineweight.Weight000);
        layB.setColor(new RColor('Red'));

        op.addObject(layB, false);
    }

    function SetStyle (itm) {
        if (itm.getLayerName() != cfg['engraving-layer-name']) {
            itm.setLayerId(layA.getId());
        }
        itm.setLinetypeId(0);
        itm.setLineweight(RLineweight.WeightByLayer);
        itm.setColor(new RColor(RColor.ByLayer));
    }

    // verschiebt die blöcke auf die 0

    var blocks = doc.queryAllBlockReferences();

    for (var i = 0; i < blocks.length; i++) {
        var ent = doc.queryEntity(blocks[i]);

        var pos = ent.getPosition();
        var rot = ent.getRotation();

        var itms = doc.queryBlockEntities(ent.getReferencedBlockId());

        for (var j = 0; j < itms.length; j++) {
            var itm = doc.queryEntity(itms[j]);

            itm.rotate(rot);
            itm.move(pos);

            SetStyle(itm);

            op.addObject(itm, false);
        }

        ent.setPosition(new RVector(0, 0));
        ent.setRotation(0);
        ent.setLayerId(doc.getLayer0Id());

        op.addObject(ent, false);
    }

    var all = doc.queryAllEntities(false, false, [RS.EntityArc, RS.EntityLine, RS.EntityCircle, RS.EntityPolyline]);

    for (var i = 0; i < all.length; i++) {
        var ent = doc.queryEntity(all[i]);
        SetStyle(ent);
        op.addObject(ent, false);
    }

    di.applyOperation(op);

    // wandelt die circles in arcs um und löst die polylines auf

    var op = new RAddObjectsOperation(false);

    var other = doc.queryAllEntities(false, true, [RS.EntityCircle, RS.EntityPolyline]);

    for (var i = 0; i < other.length; i++) {
        var ent = doc.queryEntity(other[i]),
            sh = ent.castToShape();

        if (isCircleEntity(ent)) {

            var rad = sh.getRadius(),
                c = sh.getCenter();

            var arcA = new RArc(c, rad, 0, Math.PI),
                arcB = new RArc(c, rad, Math.PI, 2*Math.PI);

            var entA = shapeToEntity(doc, arcA),
                entB = shapeToEntity(doc, arcB);

            entA.copyAttributesFrom(ent.data());
            entB.copyAttributesFrom(ent.data());

            op.addObject(entA, false);
            op.addObject(entB, false);
            op.deleteObject(ent);

        } else {
            var expl = sh.getExploded();

            for (var j = 0; j < expl.length; j++) {
                var newEnt = shapeToEntity(doc, expl[j].clone());
                newEnt.copyAttributesFrom(ent.data());
                op.addObject(newEnt, false);
            }

            op.deleteObject(ent);
        }

    }

    di.applyOperation(op);

    // löscht kurze linien

    var op = new RDeleteObjectsOperation(false);

    var lines = doc.queryAllEntities(false, true, RS.EntityLine);

    for (var i = 0; i < lines.length; i++) {
        var ent = doc.queryEntity(lines[i]),
            sh = ent.castToShape();

        if (sh.getLength() < .1) {
            op.deleteObject(ent);
        }

    }

    di.applyOperation(op);

    // löscht leere layer

    var op = new RDeleteObjectsOperation(false);

    var layers = doc.queryAllLayers();

    for (var i = 0; i < layers.length; i++) {
        if (doc.queryLayerEntities(layers[i], true).length == 0
            && layers[i] != doc.getLayer0Id()) {
            op.deleteObject(doc.queryLayer(layers[i]));
        }
    }

    di.applyOperation(op);

    qDebug((Date.now()-before)/1e3, 's');

})();
