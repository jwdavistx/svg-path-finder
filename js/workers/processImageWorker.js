onmessage = function(e){
	var result = processImage(e.data.imageData.data, { 
		tileOffset: e.data.tileOffset,
		tileSize: e.data.tileSize,
		width: e.data.imageData.width,
		height: e.data.imageData.height
	});

	postMessage({ result: result });
}

function processImage(data, args){
	var results = [];
	var maxColor = 255;
	var darknessTolerance = maxColor - (maxColor * .2);
	var transparencyTolerance = Math.floor(maxColor / 2);
	var rowOffsetSize = data.length / args.height;
	var tileSize = args.tileSize;
	var pixelsPerTile = Math.pow(args.tileSize, 2);


	var row = 0, rows = args.height / tileSize
	var col = 0, cols = args.width / tileSize;
	//This [row, col] is relative to the pixel data sent to the worker!
	while(row < rows){
		while(col < cols){
			var totalBrightness = 0;
			//Should be the top-left pixel offset of each tile
			var baseOffset = (tileSize * row * rowOffsetSize) + (tileSize * col * 4);
			//Process each row of pixels for current tile
			for(var y = 0; y < tileSize; y++){
				for(var x = 0; x < tileSize; x++){
					var offset = baseOffset + (x * 4);
					var r = data[offset], g = data[offset + 1], b = data[offset + 2], a = data[offset + 3];

					if(a  < transparencyTolerance){
						totalBrightness += maxColor;
					} else{
						var grayscaled = rgbToGrayscale(r, g, b);
						totalBrightness += Math.floor(getRgbBrightness(grayscaled, grayscaled, grayscaled))	
					}
				}
				//Advance offset to next row of pixels in the overall image
				baseOffset += rowOffsetSize;
			}

			//This push could be slower on non-Chrome browsers
			results.push({ 
				row: row + args.tileOffset.row, 
				column: col, 
				isEmpty: Math.floor(totalBrightness / pixelsPerTile) > darknessTolerance,
				totalBrightness: totalBrightness 
			});

			col++
		}
		row++;
	}

	return results;
}

function rgbToGrayscale(r, g, b){
	return (r + g + b) / 3;
}

function getRgbBrightness(r, g, b){
	//HSP color model for perceived brightness [0, 255]
	return Math.sqrt((0.299 * (Math.pow(r, 2))) + (0.587 * (Math.pow(g, 2))) + (0.114 * (Math.pow(b, 2))));
}