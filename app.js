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
		console.log(gridSizes);
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

	//Returns wrong values if x,y is already a top-left corner value!
	function screenToGrid(x, y){
		var localX = x - (x % cellSize);
		var localY = y - (y % cellSize);
		//var localX = Math.floor(x / cellSize) * cellSize;
		//var localY = Math.floor(y / cellSize) * cellSize;

		//Round down because were assuming a top-left corner as the origin
		var column, row;
		//console.log(x % cellSize, y % cellSize);
		if(x === localX || y === localY){
			console.log('on corner');
			column = (localX / cellSize);
			row = (localY / cellSize);			
		} else{
			console.log('not on corner');
			column = (localX / cellSize) - 1;
			row = (localY / cellSize) - 1;
		}	

		if(column < 0) column = 0;
		if(row < 0) row = 0;

		return { column: column, row: row };
	}

	//Get absolute screen screen coordinates for top-left corner of cell at [column, row]
	function gridToScreen(column, row){
		var x = xOffset(column * cellSize);
		var y = yOffset(row * cellSize);

		return{ x: x, y: y };
	}

	function onMouseDownGrid(mouseEvent, x, y){
		console.log(x, y);
		//Should there be a better way to translate this value?  Seems like we don't need to know anything abuot the grid yet. Just the screen?
		var cell = screenToGrid(x, y);
		var coord = gridToScreen(cell.column, cell.row);

		console.log(cell);

		selectCell(coord.x, coord.y);
	}

	function onMouseDownSelected(mouseEvent, x, y){
		this.remove();
	}

	function selectCell(x, y){
		console.log(x, y);
		var handle = svg.circle(x, y, 3).attr({ fill: 'blue'});
		var highlight = svg.rect(x, y, cellSize, cellSize).attr({
			fill: 'yellow',
			opacity: '0.2'
		});

		svg.group(handle, highlight).mousedown(onMouseDownSelected);

		var cell = screenToGrid(x, y);
		console.log(cell);
		//gridArray[cell.row][cell.column].isSelected = true;
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