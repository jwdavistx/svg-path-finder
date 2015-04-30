var app = (function(){
	var svg, border, gridRect, origin, cellSize, grid;

	//debugging stuff
	function getGridRect(){
		return gridRect;
	}

	function initSvg(params){
		svg = Snap('#canvas');

		//New local origin
		origin = {
			x: params.x,
			y: params.y
		};

		//Draw perimeter of grid container
		gridRect = svg.rect(
			origin.x,
			origin.y,
			params.width,
			params.height
		).attr(params.gridAttr);

		grid = svg.group(gridRect).mousedown(onMouseDownGrid);

		//Determine common factors of the height and width so that the grid cell are always square
		var gridSizes = getCommonFactors(params.width, params.height);
		cellSize = gridSizes[10];
		console.log('cellSize:' + cellSize)
		drawGrid(cellSize);

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

	function onMouseDownGrid(mouseEvent, x, y){
		//console.log('(' + x + ', ' + y + ')');
		var localX = Math.floor(x / cellSize)  * cellSize;
		var localY = Math.floor(y / cellSize) * cellSize;
		//highlightTopLeft(localX, localY);
		highlightCell(localX, localY);
	}

	function highlightCell(x, y){
		svg.rect(x, y, cellSize, cellSize).attr({
			fill: 'yellow',
			opacity: '0.2'
		});
	}

	function highlightTopLeft(x, y){
		svg.circle(x, y, 3).attr({ fill: 'blue'});		
	}

	function drawGrid(cellSize){
		var bbox = gridRect.getBBox();
		var attr = { stroke: 'red', strokeWidth: .5 };
		var left = x(cellSize);
		var top = y(cellSize);
		var width = x(bbox.width);
		var height = y(bbox.height);

		for(var col = left; col < width; col += cellSize){
			var l = svg.line(col, bbox.y, col, height).attr(attr);
			grid.group(l);
		}

		for(var row = top; row < height; row += cellSize){
			var l = svg.line(bbox.x, row, width, row).attr(attr);
			grid.group(l);
		}
	}

	function x(x){ return origin.x + x; }
	function y(y){ return origin.y + y; }

	function drawBox(x, y){
		var box = {
			width: gridSize,
			height: gridSize,
			attr: {
				fill: getRandomHexValue(),
				stroke: 'black',
				strokeWidth: 1
			}
		};

		svg.rect(x, y, box.width, box.height).attr(box.attr);
	}

	function getRandomHexValue(){
		return '#' + (Math.random() * 0xFFFFFF << 0).toString(16);
	}

	function getValidGridPoint(){
		var max = perimeter.getBBox().width - gridSize;
		var min = origin.x + gridSize;
		return (Math.floor(Math.random() * (max - min + 1)) + min) * gridSize;
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
		initSvg : initSvg,
		gridRect: getGridRect
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

	//for debugging stuff
	window.app = app;
});