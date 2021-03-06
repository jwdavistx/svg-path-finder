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
	var darknessTolerance = Math.floor(maxColor - (maxColor * .5));
	var transparencyTolerance = Math.floor(maxColor / 2);
	//The imageData array is sequential, but we need to know where each new row of tiles starts
	var rowOffsetSize = data.length / args.height;
	var tileSize = args.tileSize;
	var pixelsPerTile = Math.pow(args.tileSize, 2);

	//This [row, col] is relative to the pixel data sent to the worker
	for(var row = 0; row < args.height / tileSize; row++){
		for(var col = 0; col < args.width / tileSize; col++){
			var totalBrightness = 0;
			//Should be the top-left pixel offset of each tile
			var baseOffset = (tileSize * row * rowOffsetSize) + (tileSize * col * 4);
			//Process each row of pixels for current tile
			for(var y = 0; y < tileSize; y++){
				for(var x = 0; x < tileSize; x++){
					//Determine the offset for this specific pixel in the imageData (rows of tile pixels are not sequential in the imageData array)
					var offset = baseOffset + (x * 4);
					var r = data[offset], g = data[offset + 1], b = data[offset + 2], a = data[offset + 3];

					if(a  < transparencyTolerance){
						totalBrightness += maxColor;
					} else{
						var grayscaled = rgbToGrayscale(r, g, b);
						totalBrightness += Math.floor(getRgbBrightness(grayscaled, grayscaled, grayscaled))	
					}
				}

				//An attempt to leave the loop early
				var isBrighterThanTolerance = Math.floor(totalBrightness / pixelsPerTile) > darknessTolerance;
				if(isBrighterThanTolerance) break;
				//Advance offset to next row of pixels in the imageData array
				baseOffset += rowOffsetSize;
			}

			//This push could be slower on non-Chrome browsers
			results.push({ 
				row: row + args.tileOffset.row, 
				column: col, 
				isEmpty: isBrighterThanTolerance
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