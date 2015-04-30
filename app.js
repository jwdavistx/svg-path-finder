var app = (function(){
	var svg, border, gridRect, origin, cellSize, grid;
	var gridArray = [];

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

		grid = svg.group(gridRect).mousedown(onMouseDownGrid);

		//Determine common factors of the height and width so that the grid cell are always square
		var gridSizes = getCommonFactors(params.width, params.height);
		//console.log(gridSizes);
		cellSize = gridSizes[12];
		console.log('cellSize:' + cellSize)

		drawGrid(cellSize);
		initGridArray(cellSize);

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

	//TODO
	//Bounds checking!
	function screenToGrid(x, y){
		//console.log('(' + x + ', ' + y + ')');
		//HEY STUPID!  This is not gonna work if there's no offset from the actual origin!  So, whatever, make that work better later/
		//Just always use an offset for now with the same x, y values!
		var localX = xOffset((Math.floor(x / cellSize)  * cellSize)) - cellSize;
		var localY = yOffset((Math.floor(y / cellSize) * cellSize)) - cellSize;

		//console.log('(local:' + localX + ', local:' + localY + ')');

		var row = Math.floor(localX / cellSize);
		var column = Math.floor(localY / cellSize);

		//console.log('(gridX:' + gridX + ', gridY:' + gridY + ')');

		return { row: row, column: column };
	}

	function gridToScreen(column, row){

	}

	function onMouseDownGrid(mouseEvent, x, y){
		screenToGrid(x, y);
		//console.log('(' + x + ', ' + y + ')');

		//HEY STUPID!  This is not gonna work if there's no offset from the actual origin!  So, whatever, make that work better later/
		//Just always use an offset for now with the same x, y values!
		var localX = xOffset((Math.floor(x / cellSize)  * cellSize)) - cellSize;
		var localY = yOffset((Math.floor(y / cellSize) * cellSize)) - cellSize;
		//console.log('(local:' + localX + ', local:' + localY + ')');

		//TODO
		//Also need to do bounds checking for clicks on perimeter!


		selectCell(localX, localY);
	}

	function onMouseDownSelected(mouseEvent, x, y){
		this.remove();
	}

	function selectCell(x, y){
		var handle = svg.circle(x, y, 3).attr({ fill: 'blue'});
		var highlight = svg.rect(x, y, cellSize, cellSize).attr({
			fill: 'yellow',
			opacity: '0.2'
		});

		svg.group(handle, highlight).mousedown(onMouseDownSelected);
	}

	function drawGrid(cellSize){
		var bbox = gridRect.getBBox();
		var attr = { stroke: 'red', strokeWidth: .5 };

		var left = xOffset(cellSize);
		var top = yOffset(cellSize);
		var width = xOffset(bbox.width);
		var height = yOffset(bbox.height);	

		for(var col = left; col < width; col += cellSize){
			var columnLine = svg.line(col, bbox.y, col, height).attr(attr);
			grid.group(columnLine);
		}

		for(var row = top; row < height; row += cellSize){
			var rowLine = svg.line(bbox.x, row, width, row).attr(attr);
			grid.group(rowLine);
		}
	}

	function initGridArray(cellSize){
		var maxCols = gridRect.getBBox().width / cellSize;
		var maxRows = gridRect.getBBox().height / cellSize;

		for(var row = 0; row < maxRows; row++){
			gridArray.push([]);
			for(var col = 0; col < maxCols; col++){
				gridArray[row].push({ column: col, row: row, isSelected: false });
			}
		}
	}

	function xOffset(x){ return origin.x + x; }
	function yOffset(y){ return origin.y + y; }

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
});