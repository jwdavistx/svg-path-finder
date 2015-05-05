/// <reference path="./js/typings/snapsvg.d.ts" />
var app = (function(){
	var svg, origin, perimeter, gridLines, tileSize;
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
		setViewBox();
		updateOriginOffset($("svg").offset());

		//Perimeter
		perimeter = svg.rect(
			0,
			0,
			params.width,
			params.height
		).attr(params.grid.borderAttr);

		gridLines = svg.group(perimeter).click(onClickGrid);

		//Only allow square tiles
		var validTileSizes = utils.getCommonFactors(params.width, params.height);
		tileSize = validTileSizes[2];

		drawGrid(tileSize, params.grid.lineAttr);
		initTilesMatrix(tileSize);
	}

	function updateOriginOffset(offset){
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

	function imageTest(){
		svg.image('images/dolphin.png', origin.x, origin.y, 100, 100)
	}

	function drawGrid(tileSize, attr){
		var bbox = perimeter.getBBox(), line;
		var left = tileSize, top = tileSize;
		var width = bbox.width, height = bbox.height;

		
		for(var col = left; col < width; col += tileSize){
			gridLines.group(svg.line(col, bbox.y, col, height).attr(attr));
			numCols++;
		}

		for(var row = top; row < height; row += tileSize){
			gridLines.group(svg.line(bbox.x, row, width, row).attr(attr));
			numRows++;
		}

		//Adding these because we skip one by not drawing the border as a grid line
		numCols++;
		numRows++;
	}

	//Assumes the values coming in are relative to the SVG
	function screenToGrid(x, y){
		var actualTileSize = getActualTileSize();

		var localX = x - (x % actualTileSize);
		var localY = y - (y % actualTileSize);
		var column = Math.floor(localX / actualTileSize);
		var row = Math.floor(localY / actualTileSize);

		return { column: column, row: row };
	}

	//Get the size of the tiles after any transformations have been applied
	function getActualTileSize(){
		var bbox = document.getElementById('grid').getBoundingClientRect();
		return Math.floor(bbox.width / numCols);
	}

	//Get the local SVG coordinates for the top-left corner of a given tile
	function gridToScreen(column, row){
		var x = (column * tileSize);
		var y = (row * tileSize);

		return{ x: x, y: y };
	}

	function onClickGrid(mouseEvent, x, y){
		var relativeX = Math.floor(mouseEvent.pageX - origin.x);
		var relativeY = Math.floor(mouseEvent.pageY - origin.y);
		var tile = screenToGrid(relativeX, relativeY);

		console.log('tile: ', tile);

		createTile(tile.column, tile.row, tileType.blocked);
	}

	function onClickBlockedTile(mouseEvent, x, y){
		changeTileType(this, tileType.start);
	}

	function onClickStartTile(mouseEvent, x, y){
		changeTileType(this, tileType.end);
	}

	function onClickEndTile(mouseEvent, x, y){
		changeTileType(this, tileType.empty);
	}

	function onClickTileError(mouseEvent, x, y){
		console.error("Invalid tile type");
	}

	function createTile(column, row, type){
		var coord = gridToScreen(column, row);
		var tile = svg.rect(coord.x, coord.y, tileSize, tileSize).attr({
			column: column,
			row: row,
			fill: getTileColor(type)
		}).click(getTileClickHandler(type));

		tileMatrix[column][row].tileType = type;
		tileMatrix[column][row].tileRect = tile;
	}

	function removeTile(tileRect){
		var column = tileRect.attr("column");
		var row = tileRect.attr("row");

		tileMatrix[column][row].tileType = tileType.empty;
		tileRect.remove();
		tileMatrix[column][row].tileRect = null;
	}

	function changeTileType(tileRect, newType){
		if(newType === tileType.empty){
			removeTile(tileRect)
		} else {
			var column = tileRect.attr("column");
			var row = tileRect.attr("row");
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
		var grid = new PF.Grid(tileMatrix.length, tileMatrix[0].length);
		setWalkableTiles(grid);

		var finder = new PF.AStarFinder({
			allowDiagonal: true,
    		dontCrossCorners: true
    	});

		var path = finder.findPath(start[0], start[1], end[0], end[1], grid.clone());
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
					removeTile(tile.tileRect);
			})
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

	function xOffset(x){ return origin.x + x; }
	function yOffset(y){ return origin.y + y; }

	function bindEventHandlers(){
		$('#find-path').click(function(){
			app.findPath();
		});

		$('#reset').click(function(){
			app.resetGrid();
		});

		$('#randomize').click(function(){
			app.randomizeGrid(10);
		});

		$(window).resize(function(){
			app.updateOriginOffset($("svg").offset());
		});
	}

	return{
		initSvg : initSvg,
		updateOriginOffset: updateOriginOffset,
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
		width: 100, 
		height: 100,
		grid : {
			borderAttr : {
				fill: 'transparent',
				stroke: 'red',
				strokeWidth: 1
			},
			lineAttr : {
				stroke: 'grey',
				strokeWidth: 0.25
			}
		}
	});
});