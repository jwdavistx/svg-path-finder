self.onmessage = function(e){
	console.log('worker spawned:', e.data.workerIndex);

	var result = processImage(e.data.canvasData.data, { 
		tileSize: e.data.tileSize,
		width: e.data.canvasData.width,
		height: e.data.canvasData.height
	});

	self.postMessage({ result: result, index: e.data.workerIndex });
}

function processImage(data, params){
	var results = [];
	var r, g, b, a;
	var grayscaled = 0, totalBrightness = 0;
	var darknessTolerance = 255 - (255 * .2);
	var row, col, baseOffset, offset, x, y;
	var rowOffsetSize = data.length / params.height;
	var pixelsPerTile = Math.pow(params.tileSize, 2);
	
	for(row = 0; row < params.height / params.tileSize; row++){
		for(col = 0; col < params.width / params.tileSize; col++){
			//Should be the top-left pixel offset of each tile
			baseOffset = (params.tileSize * row * rowOffsetSize) + (params.tileSize * col * 4);
			//console.log('processing: (', row, ',', col, ') @ offset:', baseOffset);

			//Process each row of pixels for current tile
			for(y = 0; y < params.tileSize; y++){
				for(x = 0; x < params.tileSize; x++){
					offset = baseOffset + (x * 4);
					r = data[offset], g = data[offset + 1], b = data[offset + 2], a = data[offset + 3];

					grayscaled = rgbToGrayscale(r, g, b);
					totalBrightness += getRgbBrightness(grayscaled, grayscaled, grayscaled);

					results.push({ 
						row: row, 
						column: col, 
						result: (a < 255) ? true : Math.floor(totalBrightness / pixelsPerTile) > darknessTolerance 
					});
				}
				//jump to next row of pixels
				baseOffset += rowOffsetSize;
			}
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