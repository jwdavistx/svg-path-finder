importScripts('../libs/pathfinding-browser.min.js');

onmessage = function(e){
	var start = e.data.start;
	var end = e.data.end;
	var grid = e.data.pathGrid;

	var finder = new PF.AStarFinder({
		allowDiagonal: true,
 		dontCrossCorners: true
 	});

	var path = finder.findPath(start[0], start[1], end[0], end[1], grid);
 	//var smoothPath = PF.Util.smoothenPath(grid.clone(), path);

 	postMessage({ result: path });
}