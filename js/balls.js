var mainModule = {
  s: Snap("#svg"),
  drawingConfig: {
    circles: {
      amount: 20,
      sizeMin: 10,
      sizeMax: 20,
      proximity: 100,
      circleGroup: null,
      circleArray: [],
      animTime: 2000
    },
    canvas: {
      width: 800,
      height: 600
    }
  },

  init: function(){
    this.sizeCanvas();
    this.makeCircles();
  },

  sizeCanvas: function(){
    $('#svg').width(this.drawingConfig.canvas.width).height(this.drawingConfig.canvas.height);
  },

  makeCircles: function(){
    this.drawingConfig.circles.circleGroup = this.s.g();

    for (var i=0; i<this.drawingConfig.circles.amount;i++){
      var circleX = this.randomNumber(0, this.drawingConfig.canvas.width);
      var circleY = this.randomNumber(0, this.drawingConfig.canvas.height);
      var circleRadius = this.randomNumber(this.drawingConfig.circles.sizeMin,this.drawingConfig.circles.sizeMax);
      var circleFill = '#'+Math.floor(Math.random()*16777215).toString(16);
      var circleShape = this.s.circle(circleX, circleY, circleRadius);
      circleShape.attr({
        fill: circleFill
      });
      this.drawingConfig.circles.circleGroup.add(circleShape);

      var circleIncline = this.setIncline();
      var circleObj = { incline: circleIncline, shape: circleShape };

      this.drawingConfig.circles.circleArray.push(circleObj);

    }

    this.update();


  },

  setIncline: function(){
    return { incX: this.randomNumber(-5,5), incY: this.randomNumber(-5,5) }
  },

  update: function(){

    var lines = Snap.selectAll('line');
    lines.remove();

    for (var i=0; i<this.drawingConfig.circles.amount; i++){
      var circle = this.drawingConfig.circles.circleArray[i];
      var circleX = circle.shape.node.cx.animVal.value;
      var circleY = circle.shape.node.cy.animVal.value;
      this.move(circle,circleX,circleY);

      for (var j=0;j<i;j++){
        if (i != j){
          var circle2 = this.drawingConfig.circles.circleArray[j];
          var circle2X = circle2.shape.node.cx.animVal.value;
          var circle2Y = circle2.shape.node.cy.animVal.value;
          var dist = mainModule.distance(circleX,circleY,circle2X,circle2Y);
          if (dist <= mainModule.drawingConfig.circles.proximity){ //
            var lineWeight = 10/dist;
            var line = mainModule.s.line(circleX, circleY, circle2X, circle2Y).attr({stroke: '#a6a8ab', strokeWidth: '1px'});
          }

          if (dist <= 10) { //collision
            circle.incline = mainModule.setIncline();
            circle2.incline = mainModule.setIncline();
          }

        }
      }

    }

    setTimeout(function(){ mainModule.update(); },10);

  },

  distance: function(circleX,circleY,circle2X,circle2Y){
    var distX = circle2X - circleX;
    var distY = circle2Y - circleY;
    distX = distX*distX;
    distY = distY*distY;
    return Math.sqrt(distX + distY);
  },

  move: function(circle,curX,curY){
    if (curX > this.drawingConfig.canvas.width || curX < 0) {
      circle.incline.incX = -circle.incline.incX;
    }
    if (curY > this.drawingConfig.canvas.height || curY < 0) {
      circle.incline.incY = -circle.incline.incY;
    }
    curX = curX + circle.incline.incX;
    curY = curY + circle.incline.incY;

    if (curX > this.drawingConfig.canvas.width) {
      curX = this.drawingConfig.canvas.width-10;
      circle.incline = this.setIncline();
    } else if (curX < 0) {
      curX = 10;
      circle.incline = this.setIncline();
    }

    if (curY > this.drawingConfig.canvas.height) {
      curY = this.drawingConfig.canvas.height-10;
      circle.incline = this.setIncline();
    } else if (curY < 0) {
      curY = 10;
      circle.incline = this.setIncline();
    }

    circle.shape.attr({ cx: curX, cy: curY });

  },

  randomNumber: function(min,max){
    return Math.floor(Math.random()*(max-min+1)+min);
  },

  getBounds: function(shape){
    shapeBox = shape.node.getBoundingClientRect();
  }

}

mainModule.init();
