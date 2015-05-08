var app = (function(){
	var canvas, container, tileSize;
	var tileMatrix = [];

	var tileType = Object.freeze({
		empty: 1,
		blocked: 2,
		start: 3,
		end: 4,
		path: 5
	});

	function initPage(params){
		var size = getImageSize(params.image);
		container = params.container;
		canvas = new fabric.Canvas(params.canvas, { 
			width: params.width, 
			height: params.height,
			renderOnAddRemove: false,
			stateful: false,
			//selection: false,
			skipTargetFind: true
		});

		var validTileSizes = utils.getCommonFactors(canvas.getWidth(), canvas.getHeight());
		tileSize = validTileSizes[4];  //8
		//console.log('tileSize: ', tileSize);

		initMap(params.image, tileSize);
		initTilesMatrix(tileSize);
	}

	function initMap(imagePath, tileSize){
		var i = new Image();
		i.crossOrigin = 'Anonymous';
		i.src = imagePath;

		fabric.Image.fromURL(i.src, function(img){
			img.selectable = false;
			img.hasControls = false;
			img.hasBorders = false;
			img.hasRotatingPoint = false;

			canvas.add(img);
			//initGrid(tileSize);

			canvas.renderAll();
		});
	}

	//Should switch to use HTML5-based naturalHeight/naturalWidth
	function getImageSize(imagePath){
		var img = new Image();
		img.src = imagePath;

		img.onload = function() {
  			return { width: this.width, height: this.height };
		}
	}

	function initGrid(tileSize){
		var x, y;
		var width = canvas.getWidth(), height = canvas.getHeight();

		for(x = tileSize; x < width; x += tileSize){
			canvas.add(drawGridLine([x, 0, x, canvas.getHeight()]))
		}

		for(y = tileSize; y < height; y += tileSize){
			canvas.add(drawGridLine([0, y, canvas.getWidth(), y]))
		}

		canvas.renderAll();
	}

	function initTilesMatrix(tileSize){
		var c, r;

		for(c = 0; c < getNumCols(); c++){
			tileMatrix.push([]);
			for(r = 0; r < getNumRows(); r++){
				tileMatrix[c].push({ 
					column: c, 
					row: r, 
					tileType: tileType.empty,
					rect: null
				});
			}
		}
	}

	function drawGridLine(coords){
		return new fabric.Line(coords, {
			fill: 'none',
			stroke: 'grey',
			strokeWidth: .25,
			selectable: false,
			hasControls: false,
			hasBorders: false,
			hasRotatingPoint: false
		});
	}

	function drawTile(pos){
		return new fabric.Rect({
			left: pos.x,
			top: pos.y,
			width: tileSize,
			height: tileSize,
			fill: '#000000',
			selectable: true,
			hasControls: false,
			hasBorders: false,
			hasRotatingPoint: false
		}).on('selected', function(){
			console.log(this.column, this.row);
		});
	}

	function gridToCanvas(column, row){
		return{
			x: column * tileSize,
			y: row * tileSize
		}
	}

	function createTile(column, row, type){
		var pos = gridToCanvas(column, row);
		var rect = drawTile(pos);

		rect.column = column;
		rect.row = row;

		tileMatrix[column][row].tileType = type;
		tileMatrix[column][row].rect = rect;

		return rect;
	}

	function removeTile(column, row){
		var tile = tileMatrix[column][row];
		var rect = tile.rect;

		tile.tileType = tileType.empty;
		tile.rect = null;
		
		rect.remove();
	}

	function getRandomTile(){
		return tileMatrix[utils.getRandomInt(0, getNumCols())][utils.getRandomInt(0, getNumRows())];
	}

	function getNumCols(){
		return canvas.getWidth() / tileSize;
	}

	function getNumRows(){
		return canvas.getHeight() / tileSize;
	}

	function findPath(){
		processImage();
	}

	function processImage(){
		/*
		for(var x = 0; x < tileSize * 1; x += tileSize){
			for(var y = 0; y < tileSize * 1; y += tileSize){
				var data = canvas.getContext('2d').getImageData(0, 0, tileSize, tileSize).data;
			}
		}
		*/

		var d1 = canvas.getContext('2d').getImageData(tileSize * 18, 0, tileSize, tileSize).data;
		var d2 = canvas.getContext('2d').getImageData(tileSize * 19, 0, tileSize, tileSize).data;

		console.log(isMostlyEmpty(d1), isMostlyEmpty(d2));
	}

	function isMostlyEmpty(data){
		var r, g, b, a;
		var sampleSize = data.length / 4;
		var avgBrightness = 0;
		var darknessTolerance = .2
		var grayscaled = 0, totalBrightness = 0;

		//Loop through all of the pixels in the sample size
		for(var i = 0; i < data.length; i += 4){
			r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];

			//Regardless of color, if it's even slightly transparent then let's just say it's empty
			if(a < 255) return true;

			grayscaled = rgbToGrayscale(r, g, b);
			totalBrightness += getRgbBrightness(grayscaled, grayscaled, grayscaled);
		}

		//Is the average brightness of all the greyscaled pixels greater than what is set as "too dark"?
		return Math.floor(totalBrightness / sampleSize) > (255 - (255 * darknessTolerance));
	}

	function rgbToGrayscale(r, g, b){
		return (r + g + b) / 3;
	}

	function getRgbBrightness(r, g, b){
		//HSP color model for perceived brightness [0, 255]
		return Math.sqrt((0.299 * (Math.pow(r, 2))) + (0.587 * (Math.pow(g, 2))) + (0.114 * (Math.pow(b, 2))));
	}

	function randomizeGrid(){
		var tile;
		var blockedCount = 0;
		var maxTiles = getNumCols() * getNumRows();

		var density = maxTiles * .1;
		
		while(blockedCount < density){
			 tile = getRandomTile();

			if(tile.tileType === tileType.empty){
				canvas.add(createTile(tile.column, tile.row, tileType.blocked));
				blockedCount++;
			}
		}

		canvas.renderAll();
	}

	function resetGrid(){
		tileMatrix.forEach(function(tiles){
			tiles.forEach(function(tile){
				if(tile.tileType !== tileType.empty)
					removeTile(tile.column, tile.row);
			});
		});

		canvas.renderAll();
	}

	function bindEventHandlers(){
		$('#find-path').click(function(){
			findPath();
		});

		$('#reset').click(function(){
			resetGrid();
		});

		$('#randomize').click(function(){
			randomizeGrid();
		});

		$(window).resize(function(){

		});
	}

	return {
		initPage : initPage,
		bindEventHandlers : bindEventHandlers
	}
})();

$(function(){
	app.initPage({
		canvas: 'grid',
		width: 1280,
		height: 800,
		container: $("#page-content"),
		image: './images/dolphin.png'
	});

	app.bindEventHandlers();
});