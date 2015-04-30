var app = (function(){
	var svg, border, perimeter;

	var gridSize = 0;

	var origin = {
		x: 20,
		y: 20
	};

	var corners = {
		topLeft: null,
		topRight: null,
		bottomRight: null,
		bottomLeft: null
	};

	var border = {
		width: 600,
		height: 600,
		strokeWidth: 10,
		attr : {
			fill: 'transparent',
			stroke: 'black',
			strokeWidth: 10,
			opacity: 0.2
		}
	};

	var borderStrokeOffset = border.attr.strokeWidth / 2;

	function init(){
		svg = Snap('#canvas')
		svg.rect(origin.x, origin.y, border.width, border.height).attr(border.attr);

		perimeter = svg.rect(
			origin.x + borderStrokeOffset,
			origin.y + borderStrokeOffset,
			border.width - border.attr.strokeWidth,
			border.height - border.attr.strokeWidth
		).attr({
			fill: 'transparent',
			stroke: 'red',
			strokeWidth: 1
		}).mousedown(onMouseDownGrid);

		var bbox = perimeter.getBBox();
		var gridSizes = getCommonFactors(bbox.width, bbox.height);
		//console.log(gridSizes);		
		gridSize = gridSizes[3] //5
		drawGrid(gridSize);

		//drawBox(0, 0);
	}

	function dummyBoxes(){
		var bbox = perimeter.getBBox();
		var width = bbox.width + bbox.x;
		var height = bbox.height + bbox.y;

		for(var count = 0; count < 10; count++){
			var x = getValidGridPoint();
			var y = getValidGridPoint();
			//console.log(x + ', ' + y);
			drawBox(x, y);
		}
	}

	function onMouseDownGrid(mouseEvent, x, y){
		console.log('(' + x + ', ' + y + ')');
	}

	function drawGrid(size){
		var bbox = perimeter.getBBox();
		//console.log(bbox);

		var gridAttr = { stroke: 'red', strokeWidth: .5};
		var xOffset = size + bbox.x;
		var yOffset = size + bbox.y;
		var width = bbox.width + bbox.x;
		var height = bbox.height + bbox.y;

		for(var col = xOffset; col < width; col += size){
			svg.line(col, bbox.y, col, height).attr(gridAttr);
		}

		for(var row = yOffset; row < height; row += size){
			svg.line(bbox.x, row, width, row).attr(gridAttr);
		}
	}

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

		svg.rect(getValueOffset(x), getValueOffset(y), box.width, box.height).attr(box.attr);
	}

	function getValueOffset(value){
		return value + origin.x + borderStrokeOffset;
	}

	function getRandomHexValue(){
		return '#' + (Math.random() * 0xFFFFFF << 0).toString(16);
	}

	function getRandomInteger(min, max){
		return (Math.floor(Math.random() * (max - min + 1)) + min);
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
		init : init
	}
})();

$(function(){
	app.init();
});