/// <reference path="./js/typings/snapsvg.d.ts" />
var app = (function(){
	var svg, origin, perimeter, grid, tileSize;
	var numCols = 0, numRows = 0;
	var tileMatrix = [];

	var tileType = Object.freeze({
		empty: 1,
		blocked: 2,
		start: 3,
		end: 4,
		path: 5
	});

	function initSvg(params){
		svg = Snap(params.element);
		setOriginOffset(params.originOffset);
		imageTest('images/dolphin.png', params.width, params.height);

		//Perimeter
		perimeter = svg.rect(0,	0, params.width, params.height).attr(params.grid.borderAttr);
		grid = svg.group(perimeter).click(onClickGrid);

		//Only allow square tiles
		var validTileSizes = utils.getCommonFactors(params.width, params.height);
		tileSize = validTileSizes[6];

		drawGrid(tileSize, params.grid.lineAttr);
		initTilesMatrix(tileSize);

		setViewBox();
	}

	function setOriginOffset(offset){
		//jQuery offset does not support getting the offset coordinates of hidden elements or accounting for borders, margins, or padding set on the body element
		origin = {
			x: Math.floor(offset.left),
			y: Math.floor(offset.top)
		};
	}

	function setViewBox(){
		var bbox = svg.getBBox();
		svg.attr("viewBox", [bbox.x, bbox.y, bbox.width, bbox.height]);
		svg.width = bbox.width;
		svg.height = bbox.height;
	}

	function initTilesMatrix(tileSize){
		var maxCols = perimeter.getBBox().width / tileSize;
		var maxRows = perimeter.getBBox().height / tileSize;

		for(var c = 0; c < maxCols; c++){
			tileMatrix.push([]);
			for(var r = 0; r < maxRows; r++){
				tileMatrix[c].push({ 
					column: c, 
					row: r, 
					tileType: tileType.empty,
					tileRect: null //Storing a reference to the svg element because I'm not sure of another way to keep track of them for now
				});
			}
		}
	}

	function imageTest(imagePath, width, height){
		svg.image(imagePath, 0, 0, width, height).attr({
			preserveAspectRatio : "xMidYMin"
		});
	}

	function drawGrid(tileSize, attr){
		var bbox = perimeter.getBBox(), line;
		var left = tileSize, top = tileSize;
		var width = bbox.width, height = bbox.height;

		for(var col = left; col < width; col += tileSize){
			grid.add(svg.line(col, bbox.y, col, height).attr(attr));
			numCols++;
		}

		for(var row = top; row < height; row += tileSize){
			grid.add(svg.line(bbox.x, row, width, row).attr(attr));
			numRows++;
		}

		//Adding these because we skip one by not drawing the border as a grid line
		numCols++;
		numRows++;
	}

	//Given an (x, y) point on the viewport, return the tile at this coordinate
	function viewportToGrid(x, y){
		//var actualTileSize = getActualTileSize();
		//var z = getActualTileSize();

		//Get the closest top-left corner coordinates
		var localX = x - (x % tileSize);
		var localY = y - (y % tileSize);

		//Determine how far over/down the corner is in the viewport
		var column = Math.floor(localX / tileSize);
		var row = Math.floor(localY / tileSize);

		return { column: column, row: row };
	}

	//Given a [column, row] in the tile matrix, return the top-left point of that tile
	function gridToViewport(column, row){
		var x = (column * tileSize);
		var y = (row * tileSize);

		return{ x: x, y: y };
	}

	//Get the size of the tiles after any transformations have been applied to the SVG
	function getActualTileSize(){
		var rect = document.getElementById('grid').getBoundingClientRect();
		return Math.floor(rect.width / numCols);
	}

	function onClickGrid(mouseEvent, x, y){
		var x1 = Math.floor(mouseEvent.pageX - origin.x);
		var y1 = Math.floor(mouseEvent.pageY - origin.y);

		var x2 = mouseEvent.offsetX;
		var y2 = mouseEvent.offsetY;

		var x3 = mouseEvent.pageX;
		var y3 = mouseEvent.pageY;

		svg.circle(origin.x, origin.y, 4).attr({ fill: 'blue', stroke: 'black', strokeWidth: .25 });
		//svg.circle(x, y, 1).attr({ fill: 'blue', stroke: 'black', strokeWidth: .25 });
		svg.circle(x1, y1, 1).attr({ fill: 'yellow', stroke: 'black', strokeWidth: .25 });
		svg.circle(x2, y2, 1).attr({ fill: 'red', stroke: 'black', strokeWidth: .25 });
		//svg.circle(x3, y3, 1).attr({ fill: 'green', stroke: 'black', strokeWidth: .25 });
	
		svg.circle(tileSize, tileSize, 3).attr({ fill: 'pink', stroke: 'black', strokeWidth: .25 });

		//var tile = viewportToGrid(0, 0);

		//createTile(tile.column, tile.row, tileType.blocked);
	}

	function onClickBlockedTile(mouseEvent, x, y){
		var tile = viewportToGrid(this.attr("x"), this.attr("y"));
		changeTileType(tile.column, tile.row, tileType.start);
	}

	function onClickStartTile(mouseEvent, x, y){
		var tile = viewportToGrid(this.attr("x"), this.attr("y"));
		changeTileType(tile.column, tile.row, tileType.end);
	}

	function onClickEndTile(mouseEvent, x, y){
		var tile = viewportToGrid(this.attr("x"), this.attr("y"));
		changeTileType(tile.column, tile.row, tileType.empty);
	}

	function onClickTileError(mouseEvent, x, y){
		console.error("Invalid tile type");
	}

	function createTile(column, row, type){
		var coord = gridToViewport(column, row);
		var tile = svg.rect(coord.x, coord.y, tileSize, tileSize).attr({
			column: column,
			row: row,
			fill: getTileColor(type),
			opacity: 0.2
		}).click(getTileClickHandler(type));

		tileMatrix[column][row].tileType = type;
		tileMatrix[column][row].tileRect = tile;
	}

	function removeTile(column, row){
		var tile = tileMatrix[column][row];
		var tileRect = tile.tileRect;

		tile.tileType = tileType.empty;
		tile.tileRect = null;
		
		tileRect.remove();
	}

	//TODO: refactor to be based on (column, row) instead of the SVG element
	function changeTileType(column, row, newType){
		if(newType === tileType.empty){
			removeTile(column, row)
		} else {
			var tileRect = tileMatrix[column][row].tileRect;
			var currentType = tileMatrix[column][row].tileType;

			tileRect.attr("fill", getTileColor(newType))
				.unclick(getTileClickHandler(currentType))
				.click(getTileClickHandler(newType));

			tileMatrix[column][row].tileType = newType;
		}
	}

	function getTileByType(type){
		for(var c = 0; c < tileMatrix.length; c++){
			for(var r = 0; r < tileMatrix[0].length; r++){
				if( tileMatrix[c][r].tileType === type)
					return [c, r];
			}
		}
	}

	function getTileClickHandler(type){
		switch(type){
			case tileType.blocked: return onClickBlockedTile; break;
			case tileType.start: return onClickStartTile; break;
			case tileType.end: return onClickEndTile; break;
			default: return onClickTileError; break;
		}
	}

	function getTileColor(type){
		switch(type){
			case tileType.blocked: return "black"; break;
			case tileType.start: return "lightgreen"; break;
			case tileType.end: return "red"; break;
			case tileType.path: return "yellow"; break;
		}
	}

	function buildWalkabilityMatrix(){
		var matrix = [];
		var numCols = tileMatrix.length;
		var numRows = tileMatrix[0].length;

		for(var r = 0; r < numRows; r++){
			matrix.push([]);
			for(var c = 0; c < numCols; c++){
				matrix[r][c] = tileMatrix[c][r].tileType == tileType.blocked ? 1 : 0;
			}
		}

		return matrix;
	}

	function setWalkableTiles(grid){
		tileMatrix.forEach(function(tiles){
			tiles.forEach(function(tile){
				if (tileMatrix[tile.column][tile.row].tileType === tileType.blocked)
					grid.setWalkableAt(tile.column, tile.row, false);
			});
		});
	}

	function findPath(){
		//This doesn't seem to work?
		//var walkabilityMatrix = buildWalkabilityMatrix();
		//var grid = new PF.Grid(walkabilityMatrix);
		var start = getTileByType(tileType.start);
		var end = getTileByType(tileType.end);
		var pathGrid = new PF.Grid(tileMatrix.length, tileMatrix[0].length);
		setWalkableTiles(pathGrid);

		var finder = new PF.AStarFinder({
			allowDiagonal: true,
    		dontCrossCorners: true
    	});

		var path = finder.findPath(start[0], start[1], end[0], end[1], pathGrid.clone());
		//var smoothPath = PF.Util.smoothenPath(grid.clone(), path);

		if(path.length > 0){
			drawPath(path);
		} else{
			alert("No path exists");
		}		
	}

	function drawPath(path){
		//Draw path between start/end tiles
		for(var i = 1; i < path.length - 1; i++)
			createTile(path[i][0], path[i][1], tileType.path);
	}

	function randomizeGrid(density){
		var tile;
		var blockedCount = 0;
		var maxTiles = tileMatrix.length * tileMatrix[0].length;
		if( density > maxTiles)
			density = maxTiles
		
		while(blockedCount < density){
			 tile = getRandomTile();

			if(tile.tileType === tileType.empty){
				createTile(tile.column, tile.row, tileType.blocked);
				blockedCount++;
			}
		}
	}

	function resetGrid(){
		tileMatrix.forEach(function(tiles){
			tiles.forEach(function(tile){
				if(tile.tileType !== tileType.empty)
					removeTile(tile.column, tile.row);
			});
		});
	}

	function getRandomInt(min, max) {
		return Math.floor(Math.random() * (max - min)) + min;
	}

	function getRandomTile(){
		var maxCols = tileMatrix.length;
		var maxRows = tileMatrix[0].length;
		return tileMatrix[getRandomInt(0, maxCols)][getRandomInt(0, maxRows)];
	}

	function bindEventHandlers(){
		$('#find-path').click(function(){
			findPath();
		});

		$('#reset').click(function(){
			resetGrid();
		});

		$('#randomize').click(function(){
			randomizeGrid(50);
		});

		$(window).resize(function(){
			setOriginOffset($("svg").offset());
		});

		document.onmousemove = function(event){
			var event = event || window.event;
			myMouseX = event.clientX;
			myMouseY = event.clientY;

			myMouseX + document.documentElement.scrollLeft;
			myMouseY + document.documentElement.scrollTop;

			//console.log(myMouseX, myMouseY);
		}
	}

	return{
		initSvg : initSvg,
		setOriginOffset: setOriginOffset,
		findPath : findPath,
		resetGrid : resetGrid,
		randomizeGrid : randomizeGrid,
		bindEventHandlers: bindEventHandlers
	}
})();

$(function(){
	app.bindEventHandlers();

	app.initSvg({
		element: '#grid',
		width: 400, 
		height: 400,
		originOffset: $("svg").offset(),
		grid : {
			borderAttr : {
				fill: 'transparent',
				stroke: 'grey',
				strokeWidth: .5
			},
			lineAttr : {
				stroke: 'grey',
				strokeWidth: 0.25
			}
		}
	});
});