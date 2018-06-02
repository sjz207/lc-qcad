/* Copyright (c) 2018, Ronald Römer
This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.
*/

include('/home/zippy/lc-qcad/kdTree.js');

var cfg = JSON.parse(readTextFile('/home/zippy/lc-qcad/cfg.json'));

(function() {
    var before = Date.now();

    var doc = getDocument();
    var di = getDocumentInterface();

    var entities = doc.queryAllEntities(false, true);

    var filtered = [],
        pts = [];

    for (var i = 0; i < entities.length; i++) {
        var obj = entities[i],
            ent = doc.queryEntityDirect(obj);

        if (isArcEntity(ent) || isLineEntity(ent)) {
            var sPt = ent.getStartPoint(),
                ePt = ent.getEndPoint();

            var layId = ent.getLayerId();

            pts.push({ 'x': sPt.x, 'y': sPt.y, 'obj': obj, 'end': 0, 'endPt': ePt, 'layId': layId });
            pts.push({ 'x': ePt.x, 'y': ePt.y, 'obj': obj, 'end': 1, 'endPt': sPt, 'layId': layId });

            filtered.push(obj);

        }
    }

    function df (a, b) {
        return (a.x-b.x)*(a.x-b.x)+(a.y-b.y)*(a.y-b.y);
    }

    var tree = new kdTree(pts, df, ['x', 'y']);

    for (var i = 0; i < pts.length; i++) {
        pts[i].i = i;
    }

    var dupl = [];

    for (var i = 0; i < pts.length; i++) {
        if (dupl.indexOf(pts[i].obj) < 0) {
            var nearest = tree.nearest(pts[i], 5);

            for (var j = 0; j < nearest.length; j++) {
                if (nearest[j][1] < 1e-5
                    && nearest[j][0].obj != pts[i].obj
                    && dupl.indexOf(nearest[j][0].obj) < 0) {

                    if (df(nearest[j][0].endPt, pts[i].endPt) < 1e-5) {
                        var shA = doc.queryEntityDirect(nearest[j][0].obj).castToShape(),
                            shB = doc.queryEntityDirect(pts[i].obj).castToShape();

                        if (isArcShape(shA) && isArcShape(shB)) {
                            if (shA.equals(shB, 1e-5)) {
                                dupl.push(nearest[j][0].obj);
                            }

                        } else {
                            dupl.push(nearest[j][0].obj);
                        }

                    }
                }
            }
        }

    }

    function GetAng (a, b) {
        var ang = Math.atan2(a.x*b.y-b.x*a.y, a.x*b.x+a.y*b.y);
        if (ang < 0) {
            ang += 2*Math.PI;
        }
        return ang;
    }

    function Mod (a, b) {
        return ((a%b)+b)%b;
    }

    var skip = [];

    for (var i = 0; i < pts.length; i++) {
        if (skip.indexOf(i) < 0 && dupl.indexOf(pts[i].obj) < 0) {

            var nearest = tree.nearest(pts[i], 5);

            var objs = nearest.filter(function (p) {
                return dupl.indexOf(p[0].obj) < 0
                    && p[0].obj != pts[i].obj
                    && p[1] < 1e-5
                    && pts[i].layId == p[0].layId;
            });

            if (objs.length > 1) {
                throw new Error('Ambiguous connection found at coordinate [' + pts[i].x + ', ' + pts[i].y + '].');

            } else if (objs.length == 1) {

                var obj = doc.queryEntityDirect(objs[0][0].obj),
                    sh = obj.castToShape();

                if (isLineEntity(obj)) {
                    if (objs[0][0].end == 0) {
                        obj.setStartPoint(new RVector(pts[i].x, pts[i].y));
                    } else {
                        obj.setEndPoint(new RVector(pts[i].x, pts[i].y));
                    }

                } else {
                    // Arc

                    var phi = Mod(obj.getEndAngle()-obj.getStartAngle(), 2*Math.PI);

                    if (obj.isReversed()) {
                        phi = 2*Math.PI-phi;
                    }

                    phi /= 2;

                    if (objs[0][0].end == 1) {
                        var pt = obj.getStartPoint();
                    } else {
                        var pt = obj.getEndPoint();
                    }

                    var v = new RVector(pt.x-pts[i].x, pt.y-pts[i].y),
                        l = v.getMagnitude()/2;

                    v.normalize();

                    var d = l/Math.tan(phi);

                    var f = (objs[0][0].end == 0 ^ obj.isReversed()) ? 1 : -1;

                    var c = new RVector(pts[i].x+l*v.x-f*d*v.y, pts[i].y+l*v.y+f*d*v.x);

                    var vA = new RVector(pts[i].x-c.x, pts[i].y-c.y),
                        vB = new RVector(pt.x-c.x, pt.y-c.y);

                    var r = vA.getMagnitude();

                    vA.normalize();
                    vB.normalize();

                    var x = new RVector(1, 0);

                    var angA = GetAng(x, vA),
                        angB = GetAng(x, vB);

                    sh.setCenter(c);
                    sh.setRadius(r);

                    if (objs[0][0].end == 0) {
                        sh.setStartAngle(angA);
                        sh.setEndAngle(angB);
                    } else {
                        sh.setEndAngle(angA);
                        sh.setStartAngle(angB);
                    }

                }

                var op = new RModifyObjectOperation(obj, false);
                di.applyOperation(op);

                skip.push(objs[0][0].i);

            }
        }
    }

    function Search (shs, side, layId) {
        if (side == 'right') {
            var sh = shs[shs.length-1];
            var pt = sh.shape.getEndPoint();
            var nearest = tree.nearest({ 'x': pt.x, 'y': pt.y }, 2);

            for (var i = 0; i < nearest.length; i++) {
                var near = nearest[i];

                if (near[1] < 1e-5
                    && near[0].obj != sh.id
                    && near[0].obj != shs[0].id
                    && dupl.indexOf(near[0].obj) < 0
                    && layId == near[0].layId) {

                    var ent = doc.queryEntityDirect(near[0].obj),
                        sh2 = ent.castToShape().clone();

                    if (near[0].end == 1) {
                        sh2.reverse();
                    }

                    shs.push({ 'shape': sh2, 'id': near[0].obj });

                    return true;

                }
            }
        } else {
            var sh = shs[0];
            var pt = sh.shape.getStartPoint();
            var nearest = tree.nearest({ 'x': pt.x, 'y': pt.y }, 2);

            for (var i = 0; i < nearest.length; i++) {
                var near = nearest[i];

                if (near[1] < 1e-5
                    && near[0].obj != sh.id
                    && near[0].obj != shs[shs.length-1].id
                    && dupl.indexOf(near[0].obj) < 0
                    && layId == near[0].layId) {

                    var ent = doc.queryEntityDirect(near[0].obj),
                        sh2 = ent.castToShape().clone();

                    if (near[0].end == 0) {
                        sh2.reverse();
                    }

                    shs.unshift({ 'shape': sh2, 'id': near[0].obj });

                    return true;

                }
            }
        }

        return false;
    }

    var visited = [];

    var op = new RAddObjectsOperation(false);

    for (var i = 0; i < filtered.length; i++) {
        var id = filtered[i];

        if (visited.indexOf(id) < 0
            && dupl.indexOf(id) < 0) {

            var f = doc.queryEntityDirect(id);

            var shapes = [{ 'id': id, 'shape': f.castToShape().clone() }];

            while (Search(shapes, 'right', f.getLayerId())) {};
            while (Search(shapes, 'left', f.getLayerId())) {};

            var ids = shapes.map(function (s) { return s.id; });

            Array.prototype.push.apply(visited, ids);

            var newPl = new RPolyline(shapes.map(function (s) { return s.shape; }));

            var pl = shapeToEntity(doc, newPl);

            pl.copyAttributesFrom(f.data());

            op.addObject(pl, false);

        }
    }

    Array.prototype.push.apply(visited, dupl);

    for (var i = 0; i < visited.length; i++) {
        op.deleteObject(doc.queryEntityDirect(visited[i]));
    }

    di.applyOperation(op);

    qDebug((Date.now()-before)/1e3, 's');

})();
