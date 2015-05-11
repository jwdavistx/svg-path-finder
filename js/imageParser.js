var ImageParser = (function(){
	var canvas, context;
	var workerPath = './js/workers/processImageWorker.js';

	var self = function(img){
		initCanvas();
		drawImageToCanvas(img);
	};

	function initCanvas(){
		canvas = $('<canvas/>')[0];
		context = canvas.getContext('2d');
	}

	function drawImageToCanvas(img){
		canvas.width = img.naturalWidth;
		canvas.height = img.naturalHeight;

		context.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
	}

	self.prototype.processImage = function(args, onProcessImageComplete){
		//Work is split in to evenly divisible rectangular portions, we're just picking the middle value for now!
		var blockHeight = args.rowsPerWorker * args.tileSize;
		var maxWorkers = canvas.height / blockHeight;
		var workers = [];

		for(var i = 0; i < maxWorkers; i++){
			var y = blockHeight * i;
			var imageData = context.getImageData(0, y, canvas.width, blockHeight);

			//utils.createBlob(imageData.data);

			workers.push($.doWork({ 
				file: workerPath, 
				args: {
					imageData: imageData, 
					tileOffset: { column: 0, row: args.rowsPerWorker * i },
					tileSize: args.tileSize
				}
			}));
		}

		//Wait for all of the workers to complete before returning it all as a single array
		$.when.apply($, workers).done(function(){
			var result = [];
			Array.prototype.slice.call(arguments).forEach(function(e){
				result = $.merge(result, e.result);
			});

			onProcessImageComplete(result);
		});
	}

	$.doWork = function(args) { 
		var def = $.Deferred(function(dfd) {
			var w;
			if (window.Worker) {
				var w = new Worker(args.file); 
				w.onmessage = function(event) {
					dfd.resolve(event.data); 
				};
				w.onerror = function(event) {
					dfd.reject(event); 
				};

				w.postMessage(args.args);
			} else {
				console.error('no worker? no worky!');
			}
		});

		return def.promise(); 
	};

	return self;
})();