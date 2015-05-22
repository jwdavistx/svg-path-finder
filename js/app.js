var app = (function(){
	var svg, origin, grid, image;
	var tileMatrix = [[]];

	var tileType = Object.freeze({
		empty: 1,
		blocked: 2,
		start: 3,
		end: 4,
		path: 5
	});

	function init(args){
		svg = Snap(args.svgSelector);
		$("#clear, #load, #randomize, #empty-grid, #tile-size, #toggle-grid").prop('disabled', true);

		if(args.imagePath){
			loadImage(args.imagePath);
		}
	}

	function loadImage(imagePath, afterImageLoaded){
		var img = new Image();
		img.onload = function(e){	
			image = this;
			var w = this.naturalWidth, h = this.naturalHeight;
			svg.attr({
				width: w,
				height: h,
				viewBox: [0, 0, w, h],
				preserveAspectRatio: 'xMaxYMax'
			});

			setOriginOffset();
			setSvgImage(this.src, w, h);
			generateValidTileSizes();

			if(typeof afterImageLoaded === 'function' ) afterImageLoaded();
		}

		img.src = imagePath;
	}

	//Load the image to a <canvas> element so that the pixel values can be mapped to tiles in the grid
	function processImage(onProcessImageComplete){
		var factors = utils.getFactors(getNumRows());
		var rowsPerWorker = factors[factors.length / 2];
		var parser = new ImageParser(image);
		var tileSize = getTileSize();

		parser.processImage({
				rowsPerWorker: rowsPerWorker,
				tileSize: tileSize
			},
			onProcessImageComplete
		);
	}

	function setOriginOffset(){
		//jQuery offset does not support getting the offset coordinates of hidden elements or accounting for borders, margins, or padding set on the body element
		//However, I seemingly don't need to account for the 60px padding-top that exists?
		origin = {
			x: Math.floor($("svg").offset().left),
			y: Math.floor($("svg").offset().top)
		};
	}

	function setSvgImage(imagePath, width, height){
		svg.image(imagePath, 0, 0, width, height).attr({
			preserveAspectRatio : "xMidYMin"
		});
	}

	function setGridVisibility(isVisible){
		//grid.attr("visibility", isVislbe ? "visible", "hidden"); //if visibility: hidden, then events wont fire?
		grid.attr("opacity", isVisible ? 1 : 0);
	}

	function initGrid(tileSize){
		var bbox = svg.getBBox(), line;
		var left = tileSize, top = tileSize;
		var width = bbox.width, height = bbox.height;
		var attr = { 
			stroke: 'red', 
			strokeWidth: .5, 
			opacity: 1 
		};

		if(grid) {
			grid.remove();
			grid = null;
		}
		//A clickable surface that isn't the SVG element
		grid = svg.group(svg.rect(0, 0, bbox.width, bbox.height).attr({ fill: 'transparent' })).click(onClickGrid);

		for(var col = 0; col < width; col += tileSize){
			grid.add(svg.line(col, bbox.y, col, height).attr(attr));
		}

		for(var row = 0; row < height; row += tileSize){
			grid.add(svg.line(bbox.x, row, width, row).attr(attr));
		}
	}

	function generateValidTileSizes(){
		var bbox = svg.getBBox();
		var squareTiles = utils.getCommonFactors(bbox.width, bbox.height);
		populateTileSizeDropdown(squareTiles);
	}

	function populateTileSizeDropdown(sizes){
		var dropdown = $("#tile-size");
		dropdown.empty();
		dropdown.append('<option selected="selected">choose</option>');

		sizes.forEach(function(e, i){
			dropdown.append('<option value="' + e + '">' + e + '</option>');	
		});

		dropdown.prop('disabled', false);
	}

	function getNumRows(){
		return svg.getBBox().height / getTileSize();
	}

	function getNumCols(){
		return svg.getBBox().width / getTileSize();
	}

	//Given an (x, y) point on the viewport, return the tile at this coordinate
	function viewportToGrid(x, y){
		var tileSize = getTileSize();
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
		var tileSize = getTileSize();
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
		//svg.circle(localX, localY, 5).attr({ fill: 'blue', stroke: 'black', strokeWidth: '.25' }); //show mouse click position

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
		var tileSize = getTileSize();
		var tile = svg.rect(coord.x, coord.y, tileSize, tileSize).attr({
			column: column,
			row: row,
			fill: getTileColor(type),
			opacity: 1
		}).click(getTileClickHandler(type));

		tileMatrix[column][row].tileType = type;
		tileMatrix[column][row].rect = tile;
	}

	function removeTile(column, row){
		var tile = tileMatrix[column][row];
		var rect = tile.rect;

		tile.tileType = tileType.empty;
		tile.rect = null;
		
		if(rect)	rect.remove();
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
		for(var c = 0; c < tileMatrix.length - 1; c++){
			for(var r = 0; r < tileMatrix[0].length - 1; r++){
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
			case tileType.path: return "orange"; break;
		}
	}

	function getTileSize(){
		return parseInt($("#tile-size option:selected").val());
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

	function initTileMatrix(tileSize){
		var tileSize = getTileSize();
		var maxCols = svg.getBBox().width / tileSize;
		var maxRows = svg.getBBox().height / tileSize;
		tileMatrix = [];

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

	function populateTileMatrix(tiles){
		console.log('processed ' + tiles.length + ' tiles');
		//utils.createBlob(processedImageData);		

		initTileMatrix(getTileSize());

		tiles.forEach(function(e){
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

		if(start && end){
			var pathGrid = new PF.Grid(getNumCols(), getNumRows());
			setWalkableTiles(pathGrid);

			var finder = new PF.AStarFinder({
				allowDiagonal: true,
		 		dontCrossCorners: true
		 	});

			var path = finder.findPath(start[0], start[1], end[0], end[1], pathGrid);

			if(path.length > 0){
				drawPath(path);	
			} else{
				displayAlert("No path exists");
			}
		} else{
			displayAlert("Missing start/end points");
		}

		/*
		var w = new Worker('/js/workers/findPathWorker.js');
		w.postMessage({ start: start, end: end, grid: pathGrid.clone() });
		w.onmessage = drawPath;
		*/
	}

	function drawPath(path){
		for(var i = 1; i < path.length - 1; i++)
			createTile(path[i][0], path[i][1], tileType.path);
	}

	function randomizeGrid(percentOfMax){
		var tile;
		var blockedCount = 0;
		var maxTiles = (tileMatrix.length - 1) * (tileMatrix[0].length - 1);
		var density = maxTiles * (percentOfMax / 100);
		
		while(blockedCount < density){
			 tile = getRandomTile();

			if(tile.tileType === tileType.empty){
				createTile(tile.column, tile.row, tileType.blocked);
				blockedCount++;
			}
		}
	}

	function resetPath(){
		tileMatrix.forEach(function(tiles){
			tiles.forEach(function(tile){
				var t = tile.tileType;
				if(t === tileType.path || t === tileType.start || t === tileType.end)
					removeTile(tile.column, tile.row);
			});
		});
	}

	function getRandomTile(){
		var maxCols = tileMatrix.length - 1;
		var maxRows = tileMatrix[0].length - 1;
		return tileMatrix[utils.getRandomInt(0, maxCols)][utils.getRandomInt(0, maxRows)];
	}

	function getSvgScale(){
		return getActualTileSize() / getTileSize();
	}

	function displayAlert(text){
		$(".alert").text(text).show();
	}

	function bindEventHandlers(){
		$('#run').click(function(){
			findPath();
		});

		$('#reset').click(function(){
			resetPath();
		});

		$('#clear').click(function(){
			clearGrid();
		});

		$('#randomize').click(function(){
			randomizeGrid(10);
		});

		$("#toggle-grid").click(function(){
			var isVisible = grid.attr("opacity") > 0;
			setGridVisibility(!isVisible);
		});

		$(window).resize(function(){
			setOriginOffset();
		});

		$(".alert").click(function(){
			$(this).closest('.alert').hide();
		});

		$("#tile-size").change(function(e){
			var i = $('option:selected', $(this)).index();
			if(i > 0){
				initGrid(getTileSize());
				processImage(populateTileMatrix);

				$("#toggle-grid").prop("disabled", false);
			}
		});
	}

	return{
		init : init,
		findPath : findPath,
		bindEventHandlers: bindEventHandlers
	}
})();

$(function(){
	app.bindEventHandlers();

	app.init({
		svgSelector: '#grid',
		imagePath: './images/maze4.png'
	});
});