var app = (function(){
	var svg, origin, border, gridRect, grid, tileSize;
	var startTile = {}, endTile = {};
	var tileMatrix = [];	

	var tileType = Object.freeze({
		empty: "empty",
		blocked: "blocked",
		start: "start",
		end: "end"
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

		grid = svg.group(gridRect).click(onClickGrid);

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
		createTile(tile.column, tile.row);
	}

	function onClickTile(mouseEvent, x, y){
		updateTileType(this);
	}

	//Need to find a smart way to coorelate the tileMatrix data to the rendering of the tiles.  Right now they're separate, annnnnd it sucks!
	function createTile(column, row){
		var coord = gridToScreen(column, row);
		var tileRect = svg.rect(coord.x, coord.y, tileSize, tileSize).attr({ 
			column: column,
			row: row
		});

		tileMatrix[column][row].tileRect = tileRect;
		tileRect.click(onClickTile);
		updateTileType(tileRect);
	}

	//Need to find a smart way to coorelate the tileMatrix data to the rendering of the tiles.  Right now they're separate, annnnnd it sucks!
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
				tileInfo.tile = null;
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

		//Draw just the interior rows/columns.  We don't need to re-draw the border
		for(var col = left; col < width; col += tileSize){
			var columnLine = svg.line(col, bbox.y, col, height).attr(attr);
			grid.group(columnLine);
		}

		for(var row = top; row < height; row += tileSize){
			var rowLine = svg.line(bbox.x, row, width, row).attr(attr);
			grid.group(rowLine);
		}
	}

	function initTilesMatrix(tileSize){
		var maxCols = gridRect.getBBox().width / tileSize;
		var maxRows = gridRect.getBBox().height / tileSize;

		for(var col = 0; col < maxCols; col++){
			tileMatrix.push([]);
			for(var row = 0; row < maxRows; row++){
				tileMatrix[col].push({ 
					column: col, 
					row: row, 
					tileType: tileType.empty,
					tileRect: null
				});
			}
		}
	}

	function xOffset(x){ return origin.x + x; }
	function yOffset(y){ return origin.y + y; }

	function getRandomHexValue(){
		return '#' + (Math.random() * 0xFFFFFF << 0).toString(16);
	}

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
		initSvg : initSvg
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
		//e.preventDefault();
		//console.log(e);
	});
});