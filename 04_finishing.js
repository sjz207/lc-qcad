/* Copyright (c) 2018, Ronald Römer
This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.
*/

(function() {

    var doc = getDocument();
    var di = getDocumentInterface();

    var blocks = doc.queryAllBlockReferences();
    var model = doc.getModelSpaceBlockId();

    // löst die blöcke auf

    for (var i = 0; i < blocks.length; i++) {
        var b = doc.queryEntity(blocks[i]);
        var pos = b.getPosition();
        var rot = b.getRotation();

        if (b.getReferencedBlockName() == 'BB') {
            continue;
        }

        var itms = doc.queryBlockEntities(b.getReferencedBlockId());

        var op = new RModifyObjectsOperation();
        for (var j = 0; j < itms.length; j++) {
            var itm = doc.queryEntity(itms[j]);
            itm.setBlockId(model);
            itm.rotate(rot);
            itm.move(pos);

            op.addObject(itm, false);
        }
        di.applyOperation(op);
    }

    // löscht leere blöcke und layer
    var op2 = new RDeleteObjectsOperation(false);

    var blocks = doc.queryAllBlocks();
    for (var i = 0; i < blocks.length; i++) {
        if (!doc.hasBlockEntities(blocks[i])) {
            op2.deleteObject(doc.queryBlock(blocks[i]));
        }
    }

    di.applyOperation(op2);

    var op2 = new RDeleteObjectsOperation(false);

    var layers = doc.queryAllLayers();
    for (var i = 0; i < layers.length; i++) {
        if (doc.queryLayerEntities(layers[i]).length == 0) {
            op2.deleteObject(doc.queryLayer(layers[i]));
        }
    }
    di.applyOperation(op2);

    /*

    // zerlegt die polylines
    var all = doc.queryAllEntities();

    for (var i = 0; i < all.length; i++) {
        var line = doc.queryEntity(all[i]);
        if (isPolylineEntity(line)) {
            var op2 = new RAddObjectsOperation(false);

            var shapes = line.getExploded();

            for (var j = 0; j < shapes.length; j++) {
                var cloned = shapes[j].clone();

                var ent = shapeToEntity(doc, cloned);
                ent.copyAttributesFrom(line.data());

                if (line.hasCustomProperties()) {
                    ent.copyCustomPropertiesFrom(line.data(), 'Foo');
                }

                op2.addObject(ent, false);
            }

            op2.deleteObject(line);
            di.applyOperation(op2);
        }
    }

    */

})();
