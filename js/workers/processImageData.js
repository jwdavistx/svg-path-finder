self.onmessage = function(messageEvent){
	console.log("worker spawned");
	var data = messageEvent.data.canvasData.data;
	var tile = messageEvent.data.tile;
	var result = isMostlyEmpty(data);

	self.postMessage({ result: result, tile: tile })
}

function isMostlyEmpty(data){
	var r, g, b, a;
	var sampleSize = data.length / 4;
	var avgBrightness = 0, grayscaled = 0, totalBrightness = 0;
	var darknessTolerance = 255 - (255 * .2);

	//Loop through all of the pixels in the sample size
	for(var i = 0; i < data.length; i += 4){
		r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];

		//Regardless of color, if it's even slightly transparent then let's just say it's empty
		if(a < 255) return true;

		grayscaled = rgbToGrayscale(r, g, b);
		totalBrightness += getRgbBrightness(grayscaled, grayscaled, grayscaled);
	}

	//Is the average brightness of all the (greyscaled) pixels greater than what is set as "too dark"?
	return Math.floor(totalBrightness / sampleSize) > darknessTolerance;
}

function rgbToGrayscale(r, g, b){
	return (r + g + b) / 3;
}

function getRgbBrightness(r, g, b){
	//HSP color model for perceived brightness [0, 255]
	return Math.sqrt((0.299 * (Math.pow(r, 2))) + (0.587 * (Math.pow(g, 2))) + (0.114 * (Math.pow(b, 2))));
}