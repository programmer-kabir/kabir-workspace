//Straight Line Intro Class

var StraightLineTutorial = function( world ) {
	//Declare all the public vairables
	this.game = world;
	this.currentScene = 1;

};


StraightLineTutorial.prototype.setupCanvas = function(){
	project.clear();
	
	this.background = this.game.getSVGItem("LEVEL001_01_BACKGROUND");
	this.clickHintGroup = null;

	if(this.background)
	{
		(project.activeLayer || new Layer()).insertChild(0, this.background);
		this.background.visible = true;

		for (var i = 1; i <= 9; i++) {
			var sceneName = "scene00" + i;
			var currentScene = this.background.children[sceneName];
			if( currentScene ){
				if (i == 1) {
					currentScene.visible = true;
				} else {
					currentScene.visible = false;
				}				
			}
			if(i == 2){
				this.clickHintGroup = currentScene.children["click_x5F_note"];
				if(this.clickHintGroup)
					this.clickHintGroup.visible = false;
			}

		};
		this.GoButtonRect = new Path.Rectangle(514, 291, 77, 39);
		this.skipButtonRect = new Path.Rectangle(545, 14, 70, 17);
		
		this.circle001 = new Path.Circle(129.5, 152.5, 18);
		this.circle002 = new Path.Circle(240.5, 81.5, 18);
		this.circle003 = new Path.Circle(365.5, 203.5, 18);
		this.circle004 = new Path.Circle(514.5, 159.5, 18);


	}
		
	this.drawnPath = new Path();
	
	this.drawnPath.strokeColor = '#dddddd';
	this.drawnPath.strokeWidth = 1;
	this.drawnPath.dashArray = [10, 4];
	this.drawnPath.selected = true;
	this.drawnPath.visible = true;

	this.mouseFollowCurve = new Path();

	this.mouseFollowCurve.strokeColor = '#4F80FF';
	this.mouseFollowCurve.strokeWidth = 1;

	//Initialize the curve with 2 points.
	this.mouseFollowCurve.add(new Point(0, 0));
	this.mouseFollowCurve.add(new Point(0, 0));

	this.mouseFollowCurve.visible = false;
	this.showMouseFollowCurve = false;
	this.lastMouseDownPoint = new Point(0,0);
	this.enableMouseFollowCurve = false;
	this.pathDrawingEscaped = false;

};

StraightLineTutorial.prototype.create = function(){
	
	var self = this;

	var mouseUpHandler = function(event){

		if(self.skipButtonRect.bounds.contains(event.point)){
			tool.detach('mousedown');
			tool.detach('mouseup');
			tool.detach('mousemove');
			tool.detach('keydown');
			self.game.gotoNextLevel();
			return;
		}

		if(self.enableMouseFollowCurve){
			self.mouseFollowCurve.segments[0].point = self.lastMouseDownPoint;
			self.showMouseFollowCurve = true;			
		}

		if(self.pathDrawingEscaped){
			self.showMouseFollowCurve = false;
			self.enableMouseFollowCurve = false;
		}

		switch(self.currentScene){
		case 7:
				if(self.GoButtonRect.bounds.contains(event.point)){
					self.drawnPath.visible = false;
					tool.detach('mousedown');
					tool.detach('mouseup');
					tool.detach('mousemove');
					tool.detach('keydown');
					self.game.gotoNextLevel();				
				}
				break;
		}


	};

	var mouseDownHandler = function(event){

		self.enableMouseFollowCurve = false;

		switch(self.currentScene){
		case 1:
				// Click to advance past "PRESS 'P' TO SELECT THE PEN TOOL"
				document.getElementById("myCanvas").style.cursor="url(./assets/penCursor.png), url(./assets/penCursor.cur), auto";
				self.gotoNextScene();
				break;
		case 2:
				if(self.circle001.bounds.contains(event.point)){
					self.enableMouseFollowCurve = true;
					self.drawnPath.add( event.point );
					self.gotoNextScene();
				}
				else if(self.clickHintGroup) {
					self.clickHintGroup.visible = true;
				}
				break;
		case 3:
				if(self.circle002.bounds.contains(event.point)){
					self.enableMouseFollowCurve = true;
					self.drawnPath.add( event.point );
					self.gotoNextScene();
				}
				break;
		case 4:
				if(self.circle003.bounds.contains(event.point)){
					self.enableMouseFollowCurve = true;
					self.drawnPath.add( event.point );
					self.gotoNextScene();
				}
				break;
		case 5:
				if(self.circle004.bounds.contains(event.point)){
					self.enableMouseFollowCurve = true;
					self.drawnPath.add( event.point );
					self.gotoNextScene();
				}
				break;
		}

		if(self.enableMouseFollowCurve){
			self.mouseFollowCurve.visible = false;
			self.showMouseFollowCurve = false;
			self.lastMouseDownPoint = event.point;			
		}

		if(self.pathDrawingEscaped){
			self.mouseFollowCurve.visible = false;
			self.showMouseFollowCurve = false;
			self.lastMouseDownPoint = new Point(0,0);						
		}
	};

	var mouseMoveHandler = function(event){
		//Drawing happening.
		if(self.showMouseFollowCurve){
			self.mouseFollowCurve.segments[1].point = event.point;
			self.mouseFollowCurve.visible = true;
		}
	};

	var handleKeyAction = function(key, keyCode) {
		var k = (key || '').toLowerCase();
		if((k === 'p' || keyCode === 80) && self.currentScene == 1){
				document.getElementById("myCanvas").style.cursor="url(./assets/penCursor.png), url(./assets/penCursor.cur), auto";
				self.gotoNextScene();		
		}
		
		if((k === 'escape' || keyCode === 27) && self.currentScene == 6){
				self.drawnPath.selected = false;
				self.pathDrawingEscaped = true;
				self.mouseFollowCurve.visible = false;
				self.showMouseFollowCurve = false;
				self.gotoNextScene();		
		}
	};

	var keyDownHandler = function(event){
		handleKeyAction(event.key, event.keyCode);
	};

	var globalKeyDownHandler = function(e) {
		handleKeyAction(e.key, e.keyCode);
	};
	window.addEventListener('keydown', globalKeyDownHandler);

	var cleanupListeners = function() {
		window.removeEventListener('keydown', globalKeyDownHandler);
	};

	tool.on({
		mousedown 	: mouseDownHandler,
		mouseup 	: function(event) {
			if(self.skipButtonRect.bounds.contains(event.point) || (self.currentScene === 7 && self.GoButtonRect.bounds.contains(event.point))) {
				cleanupListeners();
			}
			mouseUpHandler(event);
		},
		mousemove 	: mouseMoveHandler,		
		keydown		: keyDownHandler
	});
};

StraightLineTutorial.prototype.gotoNextScene = function(){
	var sceneName = "scene00" + this.currentScene;
	var currentScene = this.background.children[sceneName];
	if(currentScene){
		currentScene.visible = false;
	}

	this.currentScene++;

	sceneName = "scene00" + this.currentScene;
	currentScene = this.background.children[sceneName];
	if(currentScene){
		currentScene.visible = true;
	}

};
