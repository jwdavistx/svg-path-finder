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
	var darknessTolerance = 255 - (255 * .2);
	var rowOffsetSize = data.length / args.height;
	var pixelsPerTile = Math.pow(args.tileSize, 2);
	
	//This [row, col] is relative to the pixel data sent to the worker!
	for(var row = 0; row < args.height / args.tileSize; row++){
		for(var col = 0; col < args.width / args.tileSize; col++){
			var totalBrightness = 0;
			//Should be the top-left pixel offset of each tile
			var baseOffset = (args.tileSize * row * rowOffsetSize) + (args.tileSize * col * 4);
			//Process each row of pixels for current tile
			for(var y = 0; y < args.tileSize; y++){
				for(var x = 0; x < args.tileSize; x++){
					var offset = baseOffset + (x * 4);
					var r = data[offset], g = data[offset + 1], b = data[offset + 2], a = data[offset + 3];

					var grayscaled = rgbToGrayscale(r, g, b);
					totalBrightness += Math.floor(getRgbBrightness(grayscaled, grayscaled, grayscaled))
				}
				//Advance offset to next row of pixels in the overall image
				baseOffset += rowOffsetSize;
			}

			results.push({ 
				row: row + args.tileOffset.row, 
				column: col, 
				isEmpty: Math.floor(totalBrightness / pixelsPerTile) > darknessTolerance,
				totalBrightness: totalBrightness 
			});
		}
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