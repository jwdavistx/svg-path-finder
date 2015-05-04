var app = (function(){
	var svg, origin, border, gridRect, gridLines, tileSize;
	var startTile = {}, endTile = {};
	var tileMatrix = [];

	var tileType = Object.freeze({
		empty: 1,
		blocked: 2,
		start: 3,
		end: 4,
		path: 5
	});

	function initSvg(params){
		svg = Snap('#canvas');

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

		//Determine common factors of the height and width so that the tiles are always square
		var validTileSizes = getCommonFactors(params.width, params.height);
		tileSize = validTileSizes[12];

		drawGrid(tileSize);
		initTilesMatrix(tileSize);

		if(params.showBorder){
			var strokeWidthOffset = params.borderAttr.strokeWidth / 2;

			svg.rect(
				origin.x - strokeWidthOffset, 
				params.y - strokeWidthOffset, 
				params.width + params.borderAttr.strokeWidth, 
				params.height + params.borderAttr.strokeWidth)
			.attr(params.borderAttr);	
		}
	}

	//Only works if there's no other screen changes (such as scrolling or DOM elements shifting the SVG element's position)
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

	function onClickGrid(mouseEvent, x, y){
		var tile = screenToGrid(x, y);
		createTile(tile.column, tile.row, tileType.empty);
	}

	function onClickTile(mouseEvent, x, y){
		updateTileType(this);
	}

	//Need to find a smart way to coorelate the tileMatrix data to the drawing of the tiles.
	function createTile(column, row, tileType){
		var coord = gridToScreen(column, row);
		var tileRect = svg.rect(coord.x, coord.y, tileSize, tileSize).attr({ 
			column: column,
			row: row
		});

		tileMatrix[column][row].tileRect = tileRect;
		tileMatrix[column][row].tileType = tileType;
		tileRect.click(onClickTile);

		//This doesn't make any sense to do right here.  Need to stop function chaining. This is baaaad
		updateTileType(tileRect);
	}

	//Need to find a smart way to coorelate the tileMatrix data to the drawing of the tiles.
	function updateTileType(tileRect){
		var column = parseInt(tileRect.attr("column"))
		var row = parseInt(tileRect.attr("row"));
		var tileInfo = tileMatrix[column][row];

		switch (tileInfo.tileType){
			case tileType.empty:
				tileRect.attr({ fill: 'black' });
				tileInfo.tileType = tileType.blocked;
			break;
			case tileType.blocked:
				tileRect.attr({ fill: 'lightgreen' });
				tileInfo.tileType = tileType.start;
			break;
			case tileType.start:
				tileRect.attr({ fill: 'red' });
				tileInfo.tileType = tileType.end;
			break;
			case tileType.end:
				tileRect.remove();
				tileInfo.tileType = tileType.empty;
			break;
			case tileType.path:
				tileRect.attr({ fill: 'yellow' });
			break;
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
		var numCols = tileMatrix.length;
		var numRows = tileMatrix[0].length;

		for(var c = 0; c < numCols; c++){
			for(var r = 0; r < numRows; r++){
				if (tileMatrix[c][r].tileType == tileType.blocked){
					grid.setWalkableAt(c, r, false);
				}
			}
		}
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
					tileRect: null
				});
			}
		}
	}

	function findPath(){
		var walkabilityMatrix = buildWalkabilityMatrix();
		//This doesn't seem to work?
		//var grid = new PF.Grid(walkabilityMatrix);
		var grid = new PF.Grid(tileMatrix.length, tileMatrix[0].length);
		setWalkableTiles(grid);
		var finder = new PF.AStarFinder();
		var path = finder.findPath(0, 0, 10, 10, grid);

		console.log(path);
		drawPath(path);
	}

	function drawPath(path){
		path.forEach(function(e, index, arr){
			createTile(e[0], e[1], tileType.path);
		});
	}

	function xOffset(x){ return origin.x + x; }
	function yOffset(y){ return origin.y + y; }

	function getFactors(number){
		var factors = [],
		quotient = 0;

		for(var i = 1; i <= number; i++){
			quotient = number/i;

			if(quotient === Math.floor(quotient)){
				factors.push(i); 
			}
		}

  		return factors;
	}

	function getCommonFactors(num1, num2){
		var arr1 = getFactors(num1);
		var arr2 = getFactors(num2);

		return arr1.filter(function(i){
			return arr2.indexOf(i) != -1;
		});
	}

	return{
		initSvg : initSvg,
		findPath : findPath
	}
})();

$(function(){
	app.initSvg({ 
		x: 20, 
		y: 20, 
		width: 600, 
		height: 600,
		gridAttr : {
			fill: 'transparent',
			stroke: 'red',
			strokeWidth: 1
		},
		showBorder: false,
		borderAttr : {
			fill: 'transparent',
			stroke: 'black',
			strokeWidth: 10,
			opacity: 0.2
		}
	});

	$('svg').on('contextmenu', function(e){

	});

	$('button').click(function(){
		app.findPath();
	});
});