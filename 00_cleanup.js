/* Copyright (c) 2018, Ronald Römer
This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.
*/

var cfg = JSON.parse(readTextFile('/home/zippy/lc-qcad/cfg.json'));

(function() {

    var doc = getDocument();
    var di = getDocumentInterface();
    var entities = doc.queryAllEntities();

    var layA = doc.queryLayer('New');
    if (isNull(layA)) {
        layA = addLayer('New', 'Cyan');
    }

    var layB = doc.queryLayer(cfg['engraving-layer-name']);

    if (!isNull(layB)) {
        var op = new RModifyObjectsOperation();

        layB.setLineweight(RLineweight.Weight000);
        layB.setColor(new RColor('Red'));

        op.addObject(layB, false);
        di.applyOperation(op);
    }

    function SetStyle (itm) {
        if (itm.getLayerName() != cfg['engraving-layer-name']) {
            itm.setLayerId(layA.getId());
        }
        itm.setLinetypeId(0);
        itm.setLineweight(RLineweight.WeightByLayer);
        itm.setColor(new RColor(RColor.ByLayer));
    }


    var hatches = doc.queryAllEntities(false, true, RS.EntityHatch);

    var op = new RDeleteObjectsOperation(false);
    for (var i = 0; i < hatches.length; i++) {
        op.deleteObject(doc.queryEntity(hatches[i]));
    }
    di.applyOperation(op);

    // verschiebt die blöcke auf die 0

    var op = new RModifyObjectsOperation(false);

    var blocks = doc.queryAllBlockReferences();
    for (var i = 0; i < blocks.length; i++) {
        var ent = doc.queryEntity(blocks[i]);

        var pos = ent.getPosition();
        var rot = ent.getRotation();

        var itms = doc.queryBlockEntities(ent.getReferencedBlockId());

        var op2 = new RModifyObjectsOperation(false);

        for (var j = 0; j < itms.length; j++) {
            var itm = doc.queryEntity(itms[j]);
            itm.rotate(rot);
            itm.move(pos);

            op2.addObject(itm, false);
        }

        di.applyOperation(op2);

        ent.setPosition(new RVector(0, 0));
        ent.setRotation(0);
        ent.setLayerId(doc.getLayer0Id());
        op.addObject(ent);
    }

    di.applyOperation(op);

    // wandelt die circles in arcs um

    var op = new RAddObjectsOperation(false);

    var circles = doc.queryAllEntities(false, true, RS.EntityCircle);

    for (var i = 0; i < circles.length; i++) {
        var ent = doc.queryEntity(circles[i]),
            sh = ent.castToShape();

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

    }

    di.applyOperation(op);

    // löst die polylines auf

    var op = new RAddObjectsOperation(false);

    var plines = doc.queryAllEntities(false, true, RS.EntityPolyline);

    for (var i = 0; i < plines.length; i++) {
        var ent = doc.queryEntity(plines[i]),
            sh = ent.castToShape();;

        var expl = sh.getExploded();

        for (var j = 0; j < expl.length; j++) {
            var newEnt = shapeToEntity(doc, expl[j].clone());
            newEnt.copyAttributesFrom(ent.data());
            op.addObject(newEnt, false);
        }

        op.deleteObject(ent);

    }

    di.applyOperation(op);

    var op = new RModifyObjectsOperation(false);

    var rest = doc.queryAllEntities(false, true, [RS.EntityArc, RS.EntityLine]);

    for (var i = 0; i < rest.length; i++) {
        var ent = doc.queryEntity(rest[i]);

        SetStyle(ent);
        op.addObject(ent, false);
    }

    di.applyOperation(op);

    var op = new RAddObjectsOperation(false);

    var lines = doc.queryAllEntities(false, true, RS.EntityLine);

    for (var i = 0; i < lines.length; i++) {
        var ent = doc.queryEntity(lines[i]),
            sh = ent.castToShape();

        if (sh.getLength() < .1) {
            op.deleteObject(ent);
        }

    }

    di.applyOperation(op);

    var op = new RDeleteObjectsOperation(false);

    var layers = doc.queryAllLayers();
    for (var i = 0; i < layers.length; i++) {
        if (doc.queryLayerEntities(layers[i], true).length == 0
            && layers[i] != doc.getLayer0Id()) {
            op.deleteObject(doc.queryLayer(layers[i]));
        }
    }
    di.applyOperation(op);

})();
