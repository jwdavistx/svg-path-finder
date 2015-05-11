var app = (function(){
	var svg, origin, grid, tileSize, inDebug;
	var tileMatrix = [];

	var tileType = Object.freeze({
		empty: 1,
		blocked: 2,
		start: 3,
		end: 4,
		path: 5
	});

	function init(args){
		inDebug = args.inDebug;

		var img = new Image();
		img.onload = function(e){	
			svg = Snap(args.svgSelector);
			svg.attr("width", this.naturalWidth);
			svg.attr("height", this.naturalHeight);

			setBackgroundImage(this.src, this.naturalWidth, this.naturalHeight);

			var squareTiles = utils.getCommonFactors(this.naturalWidth, this.naturalHeight);
			tileSize = squareTiles[2];
			initTilesMatrix(tileSize);

			//A clickable surface that isn't the SVG element
			grid = svg.group(svg.rect(0, 0, this.naturalWidth, this.naturalHeight).attr({ fill: 'transparent' })).click(onClickGrid);

			if(args.grid.doDraw){
				drawGrid(tileSize, args.grid.lineAttr);
			}

			//The order of these 2 things apparently matters, but I dunno why just yet
			setViewBox();
			setOriginOffset($("svg").offset());

			translateImageToGrid(this);
		}

		img.src = args.imagePath;
	}

	//Load the image to a <canvas> element so that the pixel values can be mapped to tiles in the grid
	function translateImageToGrid(img){
		var factors = utils.getFactors(getNumRows());
		var rowsPerWorker = factors[factors.length / 2];
		var parser = new ImageParser(img);

		parser.processImage({
				rowsPerWorker: rowsPerWorker,
				tileSize: tileSize
			},
			seedTileMatrixFromCanvas
		);
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
		var maxCols = svg.getBBox().width / tileSize;
		var maxRows = svg.getBBox().height / tileSize;

		for(var c = 0; c < maxCols; c++){
			tileMatrix.push([]);
			for(var r = 0; r < maxRows; r++){
				tileMatrix[c].push({ 
					column: c, 
					row: r, 
					tileType: tileType.empty,
					rect: null
				});
			}
		}
	}

	function setBackgroundImage(imagePath, width, height){
		svg.image(imagePath, 0, 0, width, height).attr({
			preserveAspectRatio : "xMidYMin"
		});
	}

	function drawGrid(tileSize, attr){
		var bbox = svg.getBBox(), line;
		var left = tileSize, top = tileSize;
		var width = bbox.width, height = bbox.height;

		for(var col = 0; col < width; col += tileSize){
			grid.add(svg.line(col, bbox.y, col, height).attr(attr));
		}

		for(var row = 0; row < height; row += tileSize){
			grid.add(svg.line(bbox.x, row, width, row).attr(attr));
		}
	}

	function getNumRows(){
		return svg.getBBox().height / tileSize;
	}

	function getNumCols(){
		return svg.getBBox().width / tileSize;
	}

	//Given an (x, y) point on the viewport, return the tile at this coordinate
	function viewportToGrid(x, y){
		//Get the closest top-left corner coordinates
		var localX = x - (x % tileSize);
		var localY = y - (y % tileSize);

		//How far over/down the corner is in the viewport
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
		return Math.floor(rect.width / getNumCols());
	}

	function onClickGrid(mouseEvent, x, y){
		var scale = getSvgScale();
		//Mouse position relative to top-left of SVG container
		var x = mouseEvent.pageX - origin.x;
		var y = mouseEvent.pageY - origin.y;

		//Translate screen coordinate to viewport.
		var localX = Math.floor(x / scale);
		var localY = Math.floor(y / scale);

		var tile = viewportToGrid(localX, localY);
		if(inDebug) svg.circle(localX, localY, .5).attr({ fill: 'blue', stroke: 'black', strokeWidth: '.25' });

		createTile(tile.column, tile.row, tileType.blocked);
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
			opacity: inDebug ? '0.2' : '1'
		}).click(getTileClickHandler(type));

		tileMatrix[column][row].tileType = type;
		tileMatrix[column][row].rect = tile;
	}

	function removeTile(column, row){
		var tile = tileMatrix[column][row];
		var rect = tile.rect;

		tile.tileType = tileType.empty;
		tile.rect = null;
		
		rect.remove();
	}

	function changeTileType(column, row, newType){
		if(newType === tileType.empty){
			removeTile(column, row)
		} else {
			var rect = tileMatrix[column][row].rect;
			var currentType = tileMatrix[column][row].tileType;

			rect.attr("fill", getTileColor(newType))
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

		for(var r = 0; r < getNumRows(); r++){
			matrix.push([]);
			for(var c = 0; c < getNumCols(); c++){
				matrix[r][c] = tileMatrix[c][r].tileType == tileType.blocked ? 1 : 0;
			}
		}

		return matrix;
	}

	function seedTileMatrixFromCanvas(processedImageData){
		if(inDebug){
			console.log('processed ' + processedImageData.length + ' tiles');
			utils.createBlob(processedImageData);
		}

		processedImageData.forEach(function(e, i, a){
			if(!e.isEmpty){
				tileMatrix[e.column][e.row].tileType = tileType.blocked;
			}
		});
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

	function randomizeGrid(percentOfMax){
		var tile;
		var blockedCount = 0;
		var maxTiles = tileMatrix.length * tileMatrix[0].length;
		var density = maxTiles * percentOfMax;
		
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

	function getRandomTile(){
		var maxCols = tileMatrix.length;
		var maxRows = tileMatrix[0].length;
		return tileMatrix[utils.getRandomInt(0, maxCols)][utils.getRandomInt(0, maxRows)];
	}

	function getSvgScale(){
		return getActualTileSize() / tileSize;
	}

	function bindEventHandlers(){
		$('#find-path').click(function(){
			findPath();
		});

		$('#reset').click(function(){
			resetGrid();
		});

		$('#randomize').click(function(){
			randomizeGrid(.1);
		});

		$(window).resize(function(){
			setOriginOffset($("svg").offset());
		});

		$(document).ajaxStart(function(){
			console.log('start');
		});

		$(document).ajaxStop(function(){
			console.log('stop');
		});
	}

	return{
		init : init,
		findPath : findPath,
		resetGrid : resetGrid,
		randomizeGrid : randomizeGrid,
		bindEventHandlers: bindEventHandlers
	}
})();

$(function(){
	app.bindEventHandlers();

	app.init({
		inDebug: false,
		svgSelector: '#grid',
		imagePath: './images/maze3.png',
		grid : {
			doDraw: false,
			lineAttr : {
				stroke: 'gray',
				strokeWidth: 0.25
			}
		}
	});
});