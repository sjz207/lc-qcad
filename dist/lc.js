(function(root,factory){if(typeof define==='function'&&define.amd){define(['exports'],factory);}else if(typeof exports==='object'){factory(exports);}else{factory(root);}}(this,function(exports){function Node(obj,dimension,parent){this.obj=obj;this.left=null;this.right=null;this.parent=parent;this.dimension=dimension;}
function kdTree(points,metric,dimensions){var self=this;function buildTree(points,depth,parent){var dim=depth%dimensions.length,median,node;if(points.length===0){return null;}
if(points.length===1){return new Node(points[0],dim,parent);}
points.sort(function(a,b){return a[dimensions[dim]]-b[dimensions[dim]];});median=Math.floor(points.length/2);node=new Node(points[median],dim,parent);node.left=buildTree(points.slice(0,median),depth+1,node);node.right=buildTree(points.slice(median+1),depth+1,node);return node;}
function loadTree(data){self.root=data;function restoreParent(root){if(root.left){root.left.parent=root;restoreParent(root.left);}
if(root.right){root.right.parent=root;restoreParent(root.right);}}
restoreParent(self.root);}
if(!Array.isArray(points))loadTree(points,metric,dimensions);else this.root=buildTree(points,0,null);this.toJSON=function(src){if(!src)src=this.root;var dest=new Node(src.obj,src.dimension,null);if(src.left)dest.left=self.toJSON(src.left);if(src.right)dest.right=self.toJSON(src.right);return dest;};this.insert=function(point){function innerSearch(node,parent){if(node===null){return parent;}
var dimension=dimensions[node.dimension];if(point[dimension]<node.obj[dimension]){return innerSearch(node.left,node);}else{return innerSearch(node.right,node);}}
var insertPosition=innerSearch(this.root,null),newNode,dimension;if(insertPosition===null){this.root=new Node(point,0,null);return;}
newNode=new Node(point,(insertPosition.dimension+1)%dimensions.length,insertPosition);dimension=dimensions[insertPosition.dimension];if(point[dimension]<insertPosition.obj[dimension]){insertPosition.left=newNode;}else{insertPosition.right=newNode;}};this.remove=function(point){var node;function nodeSearch(node){if(node===null){return null;}
if(node.obj===point){return node;}
var dimension=dimensions[node.dimension];if(point[dimension]<node.obj[dimension]){return nodeSearch(node.left,node);}else{return nodeSearch(node.right,node);}}
function removeNode(node){var nextNode,nextObj,pDimension;function findMin(node,dim){var dimension,own,left,right,min;if(node===null){return null;}
dimension=dimensions[dim];if(node.dimension===dim){if(node.left!==null){return findMin(node.left,dim);}
return node;}
own=node.obj[dimension];left=findMin(node.left,dim);right=findMin(node.right,dim);min=node;if(left!==null&&left.obj[dimension]<own){min=left;}
if(right!==null&&right.obj[dimension]<min.obj[dimension]){min=right;}
return min;}
if(node.left===null&&node.right===null){if(node.parent===null){self.root=null;return;}
pDimension=dimensions[node.parent.dimension];if(node.obj[pDimension]<node.parent.obj[pDimension]){node.parent.left=null;}else{node.parent.right=null;}
return;}
if(node.right!==null){nextNode=findMin(node.right,node.dimension);nextObj=nextNode.obj;removeNode(nextNode);node.obj=nextObj;}else{nextNode=findMin(node.left,node.dimension);nextObj=nextNode.obj;removeNode(nextNode);node.right=node.left;node.left=null;node.obj=nextObj;}}
node=nodeSearch(self.root);if(node===null){return;}
removeNode(node);};this.nearest=function(point,maxNodes,maxDistance){var i,result,bestNodes;bestNodes=new BinaryHeap(function(e){return-e[1];});function nearestSearch(node){var bestChild,dimension=dimensions[node.dimension],ownDistance=metric(point,node.obj),linearPoint={},linearDistance,otherChild,i;function saveNode(node,distance){bestNodes.push([node,distance]);if(bestNodes.size()>maxNodes){bestNodes.pop();}}
for(i=0;i<dimensions.length;i+=1){if(i===node.dimension){linearPoint[dimensions[i]]=point[dimensions[i]];}else{linearPoint[dimensions[i]]=node.obj[dimensions[i]];}}
linearDistance=metric(linearPoint,node.obj);if(node.right===null&&node.left===null){if(bestNodes.size()<maxNodes||ownDistance<bestNodes.peek()[1]){saveNode(node,ownDistance);}
return;}
if(node.right===null){bestChild=node.left;}else if(node.left===null){bestChild=node.right;}else{if(point[dimension]<node.obj[dimension]){bestChild=node.left;}else{bestChild=node.right;}}
nearestSearch(bestChild);if(bestNodes.size()<maxNodes||ownDistance<bestNodes.peek()[1]){saveNode(node,ownDistance);}
if(bestNodes.size()<maxNodes||Math.abs(linearDistance)<bestNodes.peek()[1]){if(bestChild===node.left){otherChild=node.right;}else{otherChild=node.left;}
if(otherChild!==null){nearestSearch(otherChild);}}}
if(maxDistance){for(i=0;i<maxNodes;i+=1){bestNodes.push([null,maxDistance]);}}
if(self.root)
nearestSearch(self.root);result=[];for(i=0;i<Math.min(maxNodes,bestNodes.content.length);i+=1){if(bestNodes.content[i][0]){result.push([bestNodes.content[i][0].obj,bestNodes.content[i][1]]);}}
return result;};this.balanceFactor=function(){function height(node){if(node===null){return 0;}
return Math.max(height(node.left),height(node.right))+1;}
function count(node){if(node===null){return 0;}
return count(node.left)+count(node.right)+1;}
return height(self.root)/(Math.log(count(self.root))/Math.log(2));};}
function BinaryHeap(scoreFunction){this.content=[];this.scoreFunction=scoreFunction;}
BinaryHeap.prototype={push:function(element){this.content.push(element);this.bubbleUp(this.content.length-1);},pop:function(){var result=this.content[0];var end=this.content.pop();if(this.content.length>0){this.content[0]=end;this.sinkDown(0);}
return result;},peek:function(){return this.content[0];},remove:function(node){var len=this.content.length;for(var i=0;i<len;i++){if(this.content[i]==node){var end=this.content.pop();if(i!=len-1){this.content[i]=end;if(this.scoreFunction(end)<this.scoreFunction(node))
this.bubbleUp(i);else
this.sinkDown(i);}
return;}}
throw new Error("Node not found.");},size:function(){return this.content.length;},bubbleUp:function(n){var element=this.content[n];while(n>0){var parentN=Math.floor((n+1)/2)-1,parent=this.content[parentN];if(this.scoreFunction(element)<this.scoreFunction(parent)){this.content[parentN]=element;this.content[n]=parent;n=parentN;}
else{break;}}},sinkDown:function(n){var length=this.content.length,element=this.content[n],elemScore=this.scoreFunction(element);while(true){var child2N=(n+1)*2,child1N=child2N-1;var swap=null;if(child1N<length){var child1=this.content[child1N],child1Score=this.scoreFunction(child1);if(child1Score<elemScore)
swap=child1N;}
if(child2N<length){var child2=this.content[child2N],child2Score=this.scoreFunction(child2);if(child2Score<(swap==null?elemScore:child1Score)){swap=child2N;}}
if(swap!=null){this.content[n]=this.content[swap];this.content[swap]=element;n=swap;}
else{break;}}}};exports.kdTree=kdTree;exports.BinaryHeap=BinaryHeap;}));(function(){var doc=getDocument();var di=getDocumentInterface();var entities=doc.queryAllEntities();var layA=doc.queryLayer('Schneiden');if(isNull(layA)){layA=addLayer('Schneiden','Black');}
var layB=doc.queryLayer('Gravur');if(!isNull(layB)){var op=new RModifyObjectsOperation();layB.setLineweight(RLineweight.Weight000);layB.setColor(new RColor('Red'));op.addObject(layB,false);di.applyOperation(op);}
function SetStyle(itm){if(itm.getLayerName()!='Gravur'){itm.setLayerId(layA.getId());}
itm.setLinetypeId(0);itm.setLineweight(RLineweight.WeightByLayer);itm.setColor(new RColor(RColor.ByLayer));}
var hatches=doc.queryAllEntities(false,true,RS.EntityHatch);var op=new RDeleteObjectsOperation(false);for(var i=0;i<hatches.length;i++){op.deleteObject(doc.queryEntity(hatches[i]));}
di.applyOperation(op);var op=new RModifyObjectsOperation(false);var blocks=doc.queryAllBlockReferences();for(var i=0;i<blocks.length;i++){var ent=doc.queryEntity(blocks[i]);ent.setLayerId(doc.getLayer0Id());op.addObject(ent);}
di.applyOperation(op);var op=new RAddObjectsOperation(false);var circles=doc.queryAllEntities(false,true,RS.EntityCircle);for(var i=0;i<circles.length;i++){var ent=doc.queryEntity(circles[i]),sh=ent.castToShape();var rad=sh.getRadius(),c=sh.getCenter();var arcA=new RArc(c,rad,0,Math.PI),arcB=new RArc(c,rad,Math.PI,2*Math.PI);var entA=shapeToEntity(doc,arcA),entB=shapeToEntity(doc,arcB);entA.copyAttributesFrom(ent.data());entB.copyAttributesFrom(ent.data());op.addObject(entA,false);op.addObject(entB,false);op.deleteObject(ent);}
di.applyOperation(op);var op=new RModifyObjectsOperation(false);var rest=doc.queryAllEntities(false,true,[RS.EntityArc,RS.EntityPolyline,RS.EntityLine]);for(var i=0;i<rest.length;i++){var ent=doc.queryEntity(rest[i]);SetStyle(ent);op.addObject(ent,false);}
di.applyOperation(op);var op=new RAddObjectsOperation(false);var lines=doc.queryAllEntities(false,true,[RS.EntityPolyline,RS.EntityLine]);for(var i=0;i<lines.length;i++){var ent=doc.queryEntity(lines[i]),sh=ent.castToShape();if(isLineEntity(ent)){if(sh.getLength()<.1){op.deleteObject(ent);}}else{var expl=sh.getExploded().filter(function(s){return isArcShape(s)||s.getLength()>.1;});var n=expl.length;if(n>1){for(var j=0;j<n;j++){if(isLineShape(expl[j])){var pre=expl[(j+n-1)%n],nxt=expl[(j+1)%n];if(expl[j].getStartPoint().equalsFuzzy(pre.getEndPoint(),.1)){expl[j].setStartPoint(pre.getEndPoint());}
if(expl[j].getEndPoint().equalsFuzzy(nxt.getStartPoint(),.1)){expl[j].setEndPoint(nxt.getStartPoint());}}}}
var newPl=new RPolyline(expl);var newEnt=shapeToEntity(doc,newPl);newEnt.copyAttributesFrom(ent.data());op.addObject(newEnt,false);op.deleteObject(ent);}}
di.applyOperation(op);var op=new RDeleteObjectsOperation(false);var layers=doc.queryAllLayers();for(var i=0;i<layers.length;i++){if(doc.queryLayerEntities(layers[i],true).length==0){op.deleteObject(doc.queryLayer(layers[i]));}}
di.applyOperation(op);})();(function(){var doc=getDocument();var di=getDocumentInterface();var entities=doc.queryAllEntities(false,true);var filtered=[],pts=[];for(var i=0;i<entities.length;i++){var obj=entities[i],ent=doc.queryEntity(obj);if(isArcEntity(ent)||isLineEntity(ent)){var sPt=ent.getStartPoint(),ePt=ent.getEndPoint();pts.push({'x':sPt.x,'y':sPt.y,'obj':obj,'end':0});pts.push({'x':ePt.x,'y':ePt.y,'obj':obj,'end':1});filtered.push(obj);}}
function df(a,b){return(a.x-b.x)*(a.x-b.x)+(a.y-b.y)*(a.y-b.y);}
var tree=new kdTree(pts,df,['x','y']);function Search(shs,side,layId){if(side=='right'){var sh=shs[shs.length-1];var pt=sh.shape.getEndPoint();var nearest=tree.nearest({'x':pt.x,'y':pt.y},5);for(var i=0;i<nearest.length;i++){var near=nearest[i];var ent=doc.queryEntity(near[0].obj);if(near[1]<1e-5&&near[0].obj!=sh.id&&near[0].obj!=shs[0].id&&layId==ent.getLayerId()){var sh2=ent.castToShape().clone();if(near[0].end==1){sh2.reverse();}
shs.push({'shape':sh2,'id':near[0].obj});Search(shs,side,layId);break;}}}else{var sh=shs[0];var pt=sh.shape.getStartPoint();var nearest=tree.nearest({'x':pt.x,'y':pt.y},5);for(var i=0;i<nearest.length;i++){var near=nearest[i];var ent=doc.queryEntity(near[0].obj);if(near[1]<1e-5&&near[0].obj!=sh.id&&near[0].obj!=shs[shs.length-1].id&&layId==ent.getLayerId()){var sh2=ent.castToShape().clone();if(near[0].end==0){sh2.reverse();}
shs.unshift({'shape':sh2,'id':near[0].obj});Search(shs,side,layId);break;}}}}
var visited=[];for(var i=0;i<filtered.length;i++){var id=filtered[i];if(visited.indexOf(id)<0){var f=doc.queryEntity(id);var shapes=[{'id':id,'shape':f.castToShape().clone()}];Search(shapes,'right',f.getLayerId());Search(shapes,'left',f.getLayerId());var ids=shapes.map(function(s){return s.id;});Array.prototype.push.apply(visited,ids);var newPl=new RPolyline(shapes.map(function(s){return s.shape;}));var pl=shapeToEntity(doc,newPl);pl.copyAttributesFrom(f.data());var op=new RAddObjectsOperation(false);op.addObject(pl,false);di.applyOperation(op);}}
var op=new RDeleteObjectsOperation(false);for(var i=0;i<visited.length;i++){op.deleteObject(doc.queryEntity(visited[i]));}
di.applyOperation(op);})();(function(){var doc=getDocument();var di=getDocumentInterface();var offsLay=doc.queryLayer('Offs');if(isNull(offsLay)){offsLay=addLayer('Offs','Green');}
var entities=doc.queryAllEntities();for(var i=0;i<entities.length;i++){var ent=doc.queryEntity(entities[i]);if(isBlockReferenceEntity(ent)){var itms=doc.queryBlockEntities(ent.getReferencedBlockId());var filtered=[];for(var j=0;j<itms.length;j++){var itmA=doc.queryEntity(itms[j]),shA=itmA.castToShape();if(isPolylineEntity(itmA)&&itmA.isClosed()&&itmA.getLayerName()!='Gravur'){var c=0;for(var k=0;k<itms.length;k++){if(j!=k){var itmB=doc.queryEntity(itms[k]),shB=itmB.castToShape();if(shB.containsShape(shA)){c++;break;}}}
if(c>0^shA.getOrientation()==RS.CW){var op=new RModifyObjectsOperation(false);itmA.reverse();op.addObject(itmA,false);di.applyOperation(op);}
filtered.push(itmA);}}
for(var j=0;j<filtered.length;j++){var expl=filtered[j].getExploded();for(var k=0;k<expl.length;k++){var newPl=new RPolyline(expl);newPl.convertToClosed();var worker=new RPolygonOffset(.15/2,1,RVector.invalid,RS.JoinMiter,false);worker.setForceSide(RS.RightHand);worker.addPolyline(newPl);var offs=worker.getOffsetShapes();if(offs.length==0){expl.push(expl.shift());}else{var op=new RAddObjectsOperation(false);for(var k=0;k<offs.length;k++){var off=shapeToEntity(doc,offs[k].data());off.copyAttributesFrom(filtered[j].data());off.setLayerId(offsLay.getId());if(offs[k].getOrientation()==RS.CCW){off.setCustomProperty('Foo','Outer','yes');}
op.addObject(off,false);}
di.applyOperation(op);break;}}}}}})();(function(){var doc=getDocument();var di=getDocumentInterface();function Node(pos,h,w){this.obj=null;this.pos=pos;this.h=h;this.w=w;}
var bb=doc.queryBlock('BB');if(!isNull(bb)){var _op=new RDeleteObjectsOperation(false);_op.deleteObject(bb);di.applyOperation(_op);}
var op=new RModifyObjectsOperation(false);var entities=doc.queryAllEntities();var objs=[];var len=entities.length;for(var i=0;i<len;i++){var entity=doc.queryEntity(entities[i]);var bb=entity.getBoundingBox();var h=bb.getHeight();var w=bb.getWidth();objs.push({'h':h,'w':w,'area':h*w,'pos':bb.getCorner1(),'entity':entity});}
objs.sort(function(a,b){if(Math.abs(a.area-b.area)<1e-6){return 0;}else if(a.area<b.area){return 1;}else{return-1;}});var nodes=[new Node([0,0],500-10,750-10)];for(var i=0;i<len;i++){var obj=objs[i];for(var j=0;j<nodes.length;j++){var node=nodes[j];if(node.obj!==null){continue;}
var oh=obj.h+3,ow=obj.w+3;if(ow<=node.w&&oh<=node.h){node.obj=obj;var dw=node.w-ow,dh=node.h-oh;if(dw>dh){nodes.push(new Node([node.pos[0],node.pos[1]+oh],node.h-oh,ow));nodes.push(new Node([node.pos[0]+ow,node.pos[1]],node.h,node.w-ow));}else{nodes.push(new Node([node.pos[0]+ow,node.pos[1]],oh,node.w-ow));nodes.push(new Node([node.pos[0],node.pos[1]+oh],node.h-oh,node.w));}
nodes.sort(function(a,b){if(Math.abs(a.pos[0]-b.pos[0])<1e-7){if(a.pos[1]<b.pos[1]){return-1;}
else{return 1;}}else{if(a.pos[0]<b.pos[0]){return-1;}
else{return 1;}}});var v=new RVector(node.pos[0]-obj.pos.getX()+1.5,node.pos[1]-obj.pos.getY()+1.5);obj.entity.move(v);op.addObject(obj.entity,false);break;}}}
di.applyOperation(op);var op2=new RAddObjectsOperation(false);var block=new RBlock(doc,'BB',new RVector(0,0));op2.addObject(block);di.applyOperation(op2);var id=doc.getBlockId('BB');var op3=new RAddObjectsOperation(false);di.setCurrentBlock('BB');for(var i=0;i<nodes.length;i++){var node=nodes[i];var a=new RVector(node.pos[0],node.pos[1]),b=new RVector(node.pos[0]+node.w,node.pos[1]+node.h);var box=new RBox(a,b);var box_=new RPolylineEntity(doc,new RPolylineData());box_.setShape(box.getPolyline2d());op3.addObject(box_);}
di.applyOperation(op3);di.setCurrentBlock(RBlock.modelSpaceName);var br=new RBlockReferenceEntity(doc,new RBlockReferenceData(id,new RVector(0,0),new RVector(1,1),0));op4=new RAddObjectOperation(br);di.applyOperation(op4);})();(function(){var doc=getDocument();var di=getDocumentInterface();var blocks=doc.queryAllBlockReferences();var model=doc.getModelSpaceBlockId();for(var i=0;i<blocks.length;i++){var b=doc.queryEntity(blocks[i]);var pos=b.getPosition();var rot=b.getRotation();if(b.getReferencedBlockName()=='BB'){continue;}
var itms=doc.queryBlockEntities(b.getReferencedBlockId());var op=new RModifyObjectsOperation(false);for(var j=0;j<itms.length;j++){var itm=doc.queryEntity(itms[j]);itm.setBlockId(model);itm.rotate(rot);itm.move(pos);op.addObject(itm,false);}
di.applyOperation(op);var op2=new RDeleteObjectsOperation(false);op2.deleteObject(doc.queryBlock(b.getReferencedBlockId()));di.applyOperation(op2);}})();function GetCX(pts){var n=pts.length;var s=0;for(var i=1;i<n;i++){if(pts[i].y<pts[s].y){s=i;}}
var dat=[];dat.length=n;dat[s]={'i':s,'ang':0,'l':0};for(var i=0;i<n;i++){if(i!=s){var p=[pts[i].x-pts[s].x,pts[i].y-pts[s].y],l=Math.sqrt(p[0]*p[0]+p[1]*p[1]);dat[i]={'i':i,'ang':Math.acos(p[0]/l),'l':l};}}
dat.sort(function(a,b){if(a.ang<b.ang){return-1;}else if(a.ang>b.ang){return 1;}
return 0;});var dat2=[];var angs=dat.map(function(itm){return itm.ang.toFixed(4);});var uniq=angs.filter(function(itm,pos,ary){return!pos||itm!=ary[pos-1];});for(var i=0;i<uniq.length;i++){var inds=angs.reduce(function(ary,val,idx){if(val==uniq[i]){ary.push(idx);}
return ary;},[]);var ls=inds.map(function(ind){return dat[ind].l;});dat2.push(dat[inds[ls.indexOf(Math.max.apply(null,ls))]]);}
if(dat2[0].i!=s){dat2.unshift({'i':s,'ang':0,'l':0});}
var cx=[0,1];var n_=dat2.length;var i=2;while(i<n_){var m=cx.length;var a=cx[m-2],b=cx[m-1];var pA=pts[dat2[a].i],pB=pts[dat2[b].i],pC=pts[dat2[i].i];var d=(pB.x-pA.x)*(pC.y-pA.y)
-(pC.x-pA.x)*(pB.y-pA.y);if(d>1e-5){cx.push(i);i++;}else{cx.pop();}}
var res=[];for(var i=0;i<cx.length;i++){res.push(dat2[cx[i]].i);}
RemoveInts(pts,res);return res;}
function GetOBB(pts,cx){var _pts=cx.map(function(id){return pts[id];});var ys=_pts.map(function(pt){return pt.y;});var yMn=Math.min.apply(null,ys);var idA=ys.indexOf(yMn);var yMx=Math.max.apply(null,ys);var idB=ys.indexOf(yMx);var n=_pts.length;var ref=new RVector(1,0);var _id=idA;var s=0;var dat=[];var changed=false;do{var nxtA=(idA+1)%n;var nxtB=(idB+1)%n;var vA=_pts[nxtA].operator_subtract(_pts[idA]);var vB=_pts[nxtB].operator_subtract(_pts[idB]);vA.normalize();vB.normalize();var angA=Math.acos(vA.dot(ref));var angB=Math.acos(vB.dot(ref.getNegated()));if(angA<angB){ref=vA;idA=nxtA;changed=true;}else{ref=vB.getNegated();idB=nxtB;}
var perp=new RVector(-ref.y,ref.x);var ws=[0],hs=[0];for(var i=1;i<_pts.length;i++){var v=_pts[i].operator_subtract(_pts[0]);ws.push(v.dot(ref));hs.push(v.dot(perp));}
var ext=[Math.min.apply(null,ws),Math.max.apply(null,ws),Math.min.apply(null,hs),Math.max.apply(null,hs)];var width=ext[1]-ext[0],height=ext[3]-ext[2];var area=height*width;var vecs=[ref.operator_multiply(ext[0]).operator_add(perp.operator_multiply(ext[2])),ref.operator_multiply(ext[1]).operator_add(perp.operator_multiply(ext[2])),ref.operator_multiply(ext[1]).operator_add(perp.operator_multiply(ext[3])),ref.operator_multiply(ext[0]).operator_add(perp.operator_multiply(ext[3]))];var rect=new RPolyline([_pts[0].operator_add(vecs[0]),_pts[0].operator_add(vecs[1]),_pts[0].operator_add(vecs[2]),_pts[0].operator_add(vecs[3])],true);dat.push([area,height,width,ref,rect]);s++;}while(!changed||idA!=_id);var areas=dat.map(function(itm){return itm[0];});var best=dat[areas.indexOf(Math.min.apply(null,areas))];return best;}
function TestLD(a,b,c){var vA=b.operator_subtract(a),vB=c.operator_subtract(a);vB.normalize();var d=Math.abs(-vB.y*vA.x+vB.x*vA.y);return d<1e-5;}
function RemoveInts(pts,cx){var num=cx.length;var ids=[];for(var i=0;i<num;i++){var j=(i+1)%num,k=(j+1)%num;var pA=pts[cx[i]],pB=pts[cx[j]],pC=pts[cx[k]];if(TestLD(pA,pB,pC)){ids.push(j);}}
ids.reverse();for(var i=0;i<ids.length;i++){cx.splice(ids[i],1);}}
function GetInfos(pts,cx,obb){var infos=[];var num=pts.length;var ref=obb[3],perp=new RVector(-ref.y,ref.x);var cxNum=cx.length;for(var i=0;i<cxNum;i++){var j=(i+1)%cxNum;var pA=pts[cx[i]],pB=pts[cx[j]];var v=pB.operator_subtract(pA);var x=ref.dot(v),y=perp.dot(v);var ax=Math.abs(x),ay=Math.abs(y);var nxt=cx[i];var info={'side':ax>ay?(x>0?'A':'C'):(y>0?'B':'D'),'ids':[nxt],'l':v.getMagnitude()};var c=0;for(;;){nxt=(nxt+1)%num;if(nxt==cx[j]){info.ids.push(nxt);break;}
if(TestLD(pA,pB,pts[nxt])){info.ids.push(nxt);}
c++;}
info.real=c==0;infos.push(info);}
return infos;}
function AddGaps(pts,ids,q,_a){var pA=pts[ids[0]],pB=pts[ids[1]];var v=pB.operator_subtract(pA);var l=v.getMagnitude();v.normalize();if(l>2){var n=l/25>>0;if(n==0){n=1;}
var d=l/n;if(_a&&n==1&&l>25&&d/25>.5){d=l/++n;}
var mids=[];for(var i=0;i<n;i++){var mid=pA.operator_add(v.operator_multiply((i+.5)*d));mids.push(mid);}
var all=[pA];for(var i=0;i<n;i++){all.push(mids[i].operator_add(v.operator_multiply(-.25)));all.push(mids[i].operator_add(v.operator_multiply(.25)));}
all.push(pB);var lines=[];for(var i=0;i<n+1;i++){lines.push([all[2*i],all[2*i+1]]);}
q[ids[0]]=lines;}}
function AddSideGaps(pts,infos,sides,q){for(var i=0;i<infos.length;i++){var info=infos[i];if((info.real||info.ids.length>2)&&sides.indexOf(info.side)>-1){if(info.ids.length==2){AddGaps(pts,info.ids,q,true);}else{var n=info.ids.length/2;for(var j=0;j<n;j++){var e=info.ids[2*j],f=info.ids[2*j+1];AddGaps(pts,[e,f],q,false);}}}}}
(function(){var doc=getDocument();var di=getDocumentInterface();var entities=doc.queryAllEntities();var layA=doc.queryLayer('Convex');if(isNull(layA)){layA=addLayer('Convex','Magenta');}
var layB=doc.queryLayer('OBB');if(isNull(layB)){layB=addLayer('OBB','Blue');}
var layC=doc.queryLayer('New');if(isNull(layC)){layC=addLayer('New','Cyan');}
var layD=doc.queryLayer('Gravur');var i;for(i=0;i<entities.length;i++){var ent=doc.queryEntity(entities[i]);var layName=ent.getLayerName();if(layName=='Offs'||layName=='Gravur'){if(layName=='Offs'&&ent.hasCustomProperty('Foo','Outer')){var pl=ent.getData();var segs=pl.getExploded();var simplified=[];var pars=[];for(var j=0;j<segs.length;j++){var seg=segs[j];if(isArcShape(seg)){var apr=seg.approximateWithLines(1),expl=apr.getExploded();Array.prototype.push.apply(simplified,expl);for(var k=0;k<expl.length;k++){pars.push(j);}}else{simplified.push(seg);pars.push(j);}}
var pts=[];for(var j=0;j<simplified.length;j++){pts.push(simplified[j].getStartPoint());}
var cx=GetCX(pts);var cxPoly=new RPolyline(cx.map(function(id){return pts[id];}),true),cxEnt=shapeToEntity(doc,cxPoly);var obb=GetOBB(pts,cx);var obbEnt=shapeToEntity(doc,obb[4]);var infos=GetInfos(pts,cx,obb);for(var j=0;j<infos.length;j++){cxEnt.setCustomProperty('Infos','E'+j,infos[j].side+'; '+infos[j].ids.join(',')+'; '+infos[j].real);}
var R={};var ratio=obb[1]/obb[2];ratio=Math.min(ratio,1/ratio);var pairs=['AC','BD'];var diag=obb[1]*obb[1]+obb[2]*obb[2];if(diag<196){AddGaps(pts,infos.filter(function(info){return info.real;}).reduce(function(p,c){return p.l<c.l?p:c;}).ids,R,true);}else{if(ratio<.8){var sides=obb[2]>obb[1]?pairs[0]:pairs[1];if(ratio>.2){AddSideGaps(pts,infos,sides,R);}else{if(infos.some(function(info){return info.side==sides[0]&&info.ids.length>2;})){AddSideGaps(pts,infos,sides[0],R);}else if(infos.some(function(info){return info.side==sides[1]&&info.ids.length>2;})){AddSideGaps(pts,infos,sides[1],R);}else{AddSideGaps(pts,infos,pairs[(pairs.indexOf(sides)+1)%2],R);}}}else{AddSideGaps(pts,infos,'ABCD',R);}}
var num=pts.length;var newSegs=[],used=[];for(var j=0;j<num;j++){if(R.hasOwnProperty(j)){Array.prototype.push.apply(newSegs,R[j].map(function(r){return new RLine(r[0],r[1]);}));}else{if(used.indexOf(pars[j])<0){newSegs.push(segs[pars[j]].clone());used.push(pars[j]);}}}
var op=new RAddObjectsOperation(false);for(var j=0;j<newSegs.length;j++){var newEnt=shapeToEntity(doc,newSegs[j]);newEnt.setLayerId(layC.getId());op.addObject(newEnt,false);}
di.applyOperation(op);cxEnt.setLayerId(layA.getId());obbEnt.setLayerId(layB.getId());var op2=new RAddObjectsOperation(false);op2.addObject(cxEnt,false);op2.addObject(obbEnt,false);di.applyOperation(op2);}else{var op=new RAddObjectsOperation(false);var expl=ent.getExploded();for(var j=0;j<expl.length;j++){var newEnt=shapeToEntity(doc,expl[j].clone());newEnt.setLayerId(layName=='Gravur'?layD.getId():layC.getId());op.addObject(newEnt,false);}
di.applyOperation(op);}
var op3=new RDeleteObjectsOperation(false);op3.deleteObject(ent);di.applyOperation(op3);}}})();