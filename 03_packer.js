/* Copyright (c) 2018, Ronald Römer
This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.
*/

(function() {

    var doc = getDocument();
    var di = getDocumentInterface();

    function Node (pos, h, w) {
        this.obj = null;
        this.pos = pos;
        this.h = h;
        this.w = w;
    }

    // cleanup
    var bb = doc.queryBlock('BB');
    if (!isNull(bb)) {
        var _op = new RDeleteObjectsOperation(false);
        _op.deleteObject(bb);
        di.applyOperation(_op);
    }

    var op = new RModifyObjectsOperation(false);
    var entities = doc.queryAllEntities();

    var objs = [];
    var len = entities.length;
    for (var i = 0; i < len; i++) {
        var entity = doc.queryEntity(entities[i]);
        var bb = entity.getBoundingBox();
        var h = bb.getHeight();
        var w = bb.getWidth();

        objs.push({ 'h': h, 'w': w, 'area': h*w, 'pos': bb.getCorner1(), 'entity': entity });
    }

    // die großen zuerst
    objs.sort(function (a, b) {
        if (Math.abs(a.area-b.area) < 1e-6) {
            return 0;
        } else if (a.area < b.area) {
            return 1;
        } else {
            return -1;
        }
    });

    var nodes = [new Node([0, 0], 500-10, 750-10)];

    for (var i = 0; i < len; i++) {
        var obj = objs[i];

        for (var j = 0; j < nodes.length; j++) {
            var node = nodes[j];

            if (node.obj !== null) {
                continue;
            }

            var oh = obj.h+3,
                ow = obj.w+3;

            // passt das obj in den node?
            if (ow <= node.w
                && oh <= node.h) {

                node.obj = obj;

                var dw = node.w-ow,
                    dh = node.h-oh;

                if (dw > dh) {
                    nodes.push(new Node([node.pos[0], node.pos[1]+oh],
                        node.h-oh, ow)); // A
                    nodes.push(new Node([node.pos[0]+ow, node.pos[1]],
                        node.h, node.w-ow)); // B
                } else {
                    nodes.push(new Node([node.pos[0]+ow, node.pos[1]],
                        oh, node.w-ow)); // A
                    nodes.push(new Node([node.pos[0], node.pos[1]+oh],
                        node.h-oh, node.w)); // B
                }

                nodes.sort(function (a, b) {
                    if (Math.abs(a.pos[0]-b.pos[0]) < 1e-7) {
                        if (a.pos[1] < b.pos[1]) { return -1; }
                        else { return 1; }
                    } else {
                        if (a.pos[0] < b.pos[0]) { return -1; }
                        else { return 1; }
                    }
                });

                // verschieben
                var v = new RVector(node.pos[0]-obj.pos.getX()+1.5, node.pos[1]-obj.pos.getY()+1.5);
                obj.entity.move(v);
                op.addObject(obj.entity, false);

                break;
            }
        }
    }

    di.applyOperation(op);

    var op2 = new RAddObjectsOperation(false);

    var block = new RBlock(doc, 'BB', new RVector(0, 0));
    op2.addObject(block);
    di.applyOperation(op2);

    var id = doc.getBlockId('BB');

    var op3 = new RAddObjectsOperation(false);

    di.setCurrentBlock('BB');

    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        var a = new RVector(node.pos[0], node.pos[1]),
            b = new RVector(node.pos[0]+node.w, node.pos[1]+node.h);
        var box = new RBox(a, b);
        var box_ = new RPolylineEntity(doc, new RPolylineData());
        box_.setShape(box.getPolyline2d());
        op3.addObject(box_);
    }

    di.applyOperation(op3);

    di.setCurrentBlock(RBlock.modelSpaceName);

    var br = new RBlockReferenceEntity(doc, new RBlockReferenceData(id, new RVector(0, 0), new RVector(1, 1), 0));

    op4 = new RAddObjectOperation(br);
    di.applyOperation(op4);

})();
