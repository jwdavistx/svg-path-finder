var utils = (function(){
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

	function getRandomInt(min, max) {
		return Math.floor(Math.random() * (max - min)) + min;
	}

	return {
		getFactors: getFactors,
		getCommonFactors : getCommonFactors,
		getRandomInt : getRandomInt
	}
})();