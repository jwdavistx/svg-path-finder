importScripts('../libs/pathfinding-browser.min.js');

onmessage = function(e){
	var start = e.data.start;
	var end = e.data.end;
	var grid = e.data.grid;

	var finder = new PF.AStarFinder({
		allowDiagonal: true,
 		dontCrossCorners: true
 	});

	//This doesn't work from a Web Worker, and I have no idea why
	var path = finder.findPath(start[0], start[1], end[0], end[1], grid);

 	postMessage({ result: path });
}