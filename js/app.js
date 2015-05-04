/// <reference path="./js/typings/snapsvg.d.ts" />
var app = (function(){
	var svg, origin, gridRect, gridLines, tileSize;
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
				
		//New local origin
		origin = {
			x: params.x,
			y: params.y
		};
		
		//Draw grid perimeter
		gridRect = svg.rect(
			origin.x,
			origin.y,
			params.width,
			params.height
		).attr(params.gridAttr);

		gridLines = svg.group(gridRect).click(onClickGrid);

		//Only allow square tiles
		var validTileSizes = utils.getCommonFactors(params.width, params.height);
		tileSize = validTileSizes[12];

		drawGrid(tileSize);
		initTilesMatrix(tileSize);
	}

	function initTilesMatrix(tileSize){
		var maxCols = gridRect.getBBox().width / tileSize;
		var maxRows = gridRect.getBBox().height / tileSize;

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

	function drawGrid(tileSize){
		var bbox = gridRect.getBBox();
		var attr = { stroke: 'red', strokeWidth: .5 };

		var left = xOffset(tileSize);
		var top = yOffset(tileSize);
		var width = xOffset(bbox.width);
		var height = yOffset(bbox.height);	

		for(var col = left; col < width; col += tileSize){
			var columnLine = svg.line(col, bbox.y, col, height).attr(attr);
			gridLines.group(columnLine);
		}

		for(var row = top; row < height; row += tileSize){
			var rowLine = svg.line(bbox.x, row, width, row).attr(attr);
			gridLines.group(rowLine);
		}
	}

	//Assumes the values coming in are relative to the view port, and not the screen.  
	//If it were actually screen coordinates, then this wouldn't work.
	function screenToGrid(x, y){
		var column, row;

		if(x % tileSize === origin.x && y % tileSize === origin.y){
			column = Math.floor(x / tileSize);
			row = Math.floor(y / tileSize);                                    
		} else{
			var localX = x - ((x - origin.x) % tileSize);
			var localY = y - ((y - origin.y) % tileSize);

			column = Math.floor(localX / tileSize);
			row = Math.floor(localY / tileSize);
		}              

		return { column: column, row: row };
    }

	function gridToScreen(column, row){
		var x = xOffset(column * tileSize);
		var y = yOffset(row * tileSize);

		return{ x: x, y: y };
	}

	//Use mouse position that's relative to the top left corner of viewport
	function onClickGrid(mouseEvent, x, y){
		var tile = screenToGrid(mouseEvent.pageX, mouseEvent.pageY);
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

		var finder = new PF.AStarFinder();
		var path = finder.findPath(start[0], start[1], end[0], end[1], grid);

		drawPath(path);
	}

	function drawPath(path){
		//Draw path between start/end tiles
		for(var i = 1; i < path.length - 1; i++)
			createTile(path[i][0], path[i][1], tileType.path);
	}

	function resetGrid(){
		tileMatrix.forEach(function(tiles){
			tiles.forEach(function(tile){
				if(tile.tileType !== tileType.empty)
					removeTile(tile.tileRect);
			})
		});
	}

	function xOffset(x){ return origin.x + x; }
	function yOffset(y){ return origin.y + y; }

	return{
		initSvg : initSvg,
		findPath : findPath,
		resetGrid : resetGrid
	}
})();

$(function(){
	app.initSvg({
		element: '#grid',
		x: 20, 
		y: 20, 
		width: 600, 
		height: 600,
		gridAttr : {
			fill: 'transparent',
			stroke: 'red',
			strokeWidth: 1
		}
	});

	$('#find-path').click(function(){
		app.findPath();
	});

	$('#reset').click(function(){
		app.resetGrid();
	});
});