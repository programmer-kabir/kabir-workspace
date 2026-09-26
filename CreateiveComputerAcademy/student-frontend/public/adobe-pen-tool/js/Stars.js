//Class for managing the stars.
var Stars = function(count, world){
	this.count = count;
	this.game = world;
	this.starArray = new Array();

	// Create a symbol, which we will use to place instances of later:
	var center = new Point(0, 0);
	var points = 4;
	var radius1 = 1;
	var radius2 = 5;
	//var path = new Shape.rectangle(new Point(0, 0), new Size(60, 60));
	var path = new Path.Star(center, points, radius1, radius2);
	path.fillColor = 'white';

	var symbol = new Symbol(path);

	for (var i = 0; i < count; i++) {
		// The center position is a random point in the view:
		var centerX = Math.random() * this.game.worldW;
		var centerY = Math.random() * this.game.worldH;
		var center = new Point( centerX, centerY);
		var placed = symbol.place(center);
		placed.scale( i / count + 0.01);
		
		placed.data = {
			vector: new Point({
				length : (i / count) * Math.random() / 5
			})
		};

		this.starArray.push(placed);
	}
};

Stars.prototype.keepInView = function(item) {
	var position = item.position;
	var viewBounds = view.bounds;
	if (position.isInside(viewBounds))
		return;
	var itemBounds = item.bounds;
	if (position.x > viewBounds.width + 5) {
		position.x = -item.bounds.width;
	}

	if (position.x < -itemBounds.width - 5) {
		position.x = viewBounds.width;
	}

	if (position.y > viewBounds.height + 5) {
		position.y = -itemBounds.height;
	}

	if (position.y < -itemBounds.height - 5) {
		position.y = viewBounds.height
	}
};

Stars.prototype.moveStarsHorizontally = function(displacement) {				
	for (var i = 0; i < this.count; i++) {
		var item =  this.starArray[i];
		var size = item.bounds.size;
		var length = displacement * size.width/6;
		item.position.x -= length;
		this.keepInView(item);
	}
};
