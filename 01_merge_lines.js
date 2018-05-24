/* Copyright (c) 2018, Ronald Römer
This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.
*/

include('/home/zippy/lc-qcad/kdTree.js');

var cfg = JSON.parse(readTextFile('/home/zippy/lc-qcad/cfg.json'));

(function() {

    var doc = getDocument();
    var di = getDocumentInterface();

    var entities = doc.queryAllEntities(false, true);

    var filtered = [],
        pts = [];

    for (var i = 0; i < entities.length; i++) {
        var obj = entities[i],
            ent = doc.queryEntity(obj);

        if (isArcEntity(ent) || isLineEntity(ent)) {
            var sPt = ent.getStartPoint(),
                ePt = ent.getEndPoint();

            pts.push({ 'x': sPt.x, 'y': sPt.y, 'obj': obj, 'end': 0 });
            pts.push({ 'x': ePt.x, 'y': ePt.y, 'obj': obj, 'end': 1 });

            filtered.push(obj);
        }
    }

    function df (a, b) {
        return (a.x-b.x)*(a.x-b.x)+(a.y-b.y)*(a.y-b.y);
    }

    var tree = new kdTree(pts, df, ['x', 'y']);

    function Search (shs, side, layId) {
        if (side == 'right') {
            var sh = shs[shs.length-1];
            var pt = sh.shape.getEndPoint();
            var nearest = tree.nearest({ 'x': pt.x, 'y': pt.y }, 5);

            for (var i = 0; i < nearest.length; i++) {
                var near = nearest[i];

                var ent = doc.queryEntity(near[0].obj);

                if (near[1] < 1e-5
                    && near[0].obj != sh.id
                    && near[0].obj != shs[0].id
                    && layId == ent.getLayerId()) {

                    var sh2 = ent.castToShape().clone();

                    if (near[0].end == 1) {
                        sh2.reverse();
                    }

                    shs.push({ 'shape': sh2, 'id': near[0].obj });

                    Search(shs, side, layId);

                    break;

                }
            }
        } else {
            var sh = shs[0];
            var pt = sh.shape.getStartPoint();
            var nearest = tree.nearest({ 'x': pt.x, 'y': pt.y }, 5);

            for (var i = 0; i < nearest.length; i++) {
                var near = nearest[i];

                var ent = doc.queryEntity(near[0].obj);

                if (near[1] < 1e-5
                    && near[0].obj != sh.id
                    && near[0].obj != shs[shs.length-1].id
                    && layId == ent.getLayerId()) {

                    var sh2 = ent.castToShape().clone();

                    if (near[0].end == 0) {
                        sh2.reverse();
                    }

                    shs.unshift({ 'shape': sh2, 'id': near[0].obj });

                    Search(shs, side, layId);

                    break;

                }
            }
        }
    }

    var visited = [];

    for (var i = 0; i < filtered.length; i++) {
        var id = filtered[i];

        if (visited.indexOf(id) < 0) {
            var f = doc.queryEntity(id);

            var shapes = [{ 'id': id, 'shape': f.castToShape().clone() }];

            Search(shapes, 'right', f.getLayerId());
            Search(shapes, 'left', f.getLayerId());

            var ids = shapes.map(function (s) { return s.id; });

            Array.prototype.push.apply(visited, ids);

            var newPl = new RPolyline(shapes.map(function (s) { return s.shape; }));

            var pl = shapeToEntity(doc, newPl);

            pl.copyAttributesFrom(f.data());

            var op = new RAddObjectsOperation(false);
            op.addObject(pl, false);
            di.applyOperation(op);

        }
    }

    var op = new RDeleteObjectsOperation(false);
    for (var i = 0; i < visited.length; i++) {
        op.deleteObject(doc.queryEntity(visited[i]));
    }
    di.applyOperation(op);

})();
