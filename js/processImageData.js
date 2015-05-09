self.onmessage = function(messageEvent){
	console.log("worker spawned: ", messageEvent.data.workerIndex);

	var data = messageEvent.data.canvasData.data;
	//var origin = messageEvent.data.origin;
	var tileSize = messageEvent.data.tileSize;
	var workerIndex = messageEvent.data.workerIndex;

	var result = isMostlyEmpty(data, tileSize);

	self.postMessage({ result: result, index: workerIndex });
}

function isMostlyEmpty(data, tileSize){
	var r, g, b, a;
	//How many pixel elements do we expect for each tile
	var segmentSize = tileSize * 2;
	//How many tiles of pixel data are in the array
	var chunkSize = data.length / segmentSize;
	var grayscaled = 0, totalBrightness = 0;
	var darknessTolerance = 255 - (255 * .2);
	var result = [];

	//Loop through all of the tile chunks in the array
	for(var offset = 0; offset < data.length; offset += chunkSize){
		totalBrightness = 0;

		//var tile = { column: 0,	row: (offset + origin.y) / tileSize	};
		//Now loop through all the pixels for this tile
		for(var i = offset; i < segmentSize; i += 4){
			r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];

			//Regardless of color, if it's even slightly transparent then let's just say it's empty
			if(a < 255) return true;

			grayscaled = rgbToGrayscale(r, g, b);
			totalBrightness += getRgbBrightness(grayscaled, grayscaled, grayscaled);
		}

		//Is the average brightness of all the (greyscaled) pixels greater than what is set as "too dark"?
		result.push(Math.floor(totalBrightness / sampleSize) > darknessTolerance);
	}

	return result;
}

function rgbToGrayscale(r, g, b){
	return (r + g + b) / 3;
}

function getRgbBrightness(r, g, b){
	//HSP color model for perceived brightness [0, 255]
	return Math.sqrt((0.299 * (Math.pow(r, 2))) + (0.587 * (Math.pow(g, 2))) + (0.114 * (Math.pow(b, 2))));
}