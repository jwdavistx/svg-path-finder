onmessage = function(e){
	console.log('worker spawned:', e.data.workerIndex);

	var result = processImage(e.data.imageData.data, { 
		tileOffset: e.data.tileOffset,
		tileSize: e.data.tileSize,
		width: e.data.imageData.width,
		height: e.data.imageData.height
	});

	postMessage({ result: result, index: e.data.workerIndex, startedOn: performance.now() });
}

function processImage(data, params){
	var results = [];
	var r, g, b, a;
	var row, col, baseOffset, offset, x, y;
	var grayscaled = 0, totalBrightness = 0, darknessTolerance = 255 - (255 * .2);
	var rowOffsetSize = data.length / params.height;
	var pixelsPerTile = Math.pow(params.tileSize, 2);
	
	//This [row, col] is relative to the pixel data sent to the worker!
	for(row = 0; row < params.height / params.tileSize; row++){
		for(col = 0; col < params.width / params.tileSize; col++){
			totalBrightness = 0;
			//Should be the top-left pixel offset of each tile
			baseOffset = (params.tileSize * row * rowOffsetSize) + (params.tileSize * col * 4);
			//Process each row of pixels for current tile
			for(y = 0; y < params.tileSize; y++){
				for(x = 0; x < params.tileSize; x++){
					offset = baseOffset + (x * 4);
					r = data[offset], g = data[offset + 1], b = data[offset + 2], a = data[offset + 3];

					grayscaled = rgbToGrayscale(r, g, b);
					totalBrightness += getRgbBrightness(grayscaled, grayscaled, grayscaled);
				}
				//Advance offset to next row of pixels in the overall image
				baseOffset += rowOffsetSize;
			}

			results.push({ 
				row: row + params.tileOffset.row, 
				column: col, 
				isEmpty: (a < 255) ? true : Math.floor(totalBrightness / pixelsPerTile) > darknessTolerance 
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