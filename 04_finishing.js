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

        var op = new RModifyObjectsOperation(false);
        for (var j = 0; j < itms.length; j++) {
            var itm = doc.queryEntity(itms[j]);
            itm.setBlockId(model);
            itm.rotate(rot);
            itm.move(pos);

            op.addObject(itm, false);
        }
        di.applyOperation(op);

        // löscht den block

        var op2 = new RDeleteObjectsOperation(false);
        op2.deleteObject(doc.queryBlock(b.getReferencedBlockId()));
        di.applyOperation(op2);

    }

})();
