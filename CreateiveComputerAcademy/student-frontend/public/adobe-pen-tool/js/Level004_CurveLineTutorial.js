var CurveLineTutorial = function( world ) {
	//Declare all the public vairables
	this.game = world;
	this.currentScene = 1;

};


CurveLineTutorial.prototype.setupCanvas = function(){
	project.clear();
	
	this.background = this.game.getSVGItem("CURVE_TUTORIAL");
	if(this.background)
	{
		(project.activeLayer || new Layer()).insertChild(0, this.background);
		this.background.visible = true;

		for (var i = 1; i <= 12; i++) {
			var sceneName;
			if(i < 10)
				sceneName = "scene00" + i;
			else
				sceneName = "scene0" + i;	
			var currentScene = this.background.children[sceneName];
			if( currentScene ){
				if (i == 1) {
					currentScene.visible = true;
				} else {
					currentScene.visible = false;
				}				
			}

			if(i == 3){
				this.clickHintGroup = currentScene.children["click_x5F_note"];
				if(this.clickHintGroup)
					this.clickHintGroup.visible = false;
			}

			if(i == 4){
				this.clickAndDragHintGroup = currentScene.children["click_x5F_drag_x5F_note"];
				if(this.clickAndDragHintGroup)
					this.clickAndDragHintGroup.visible = false;
			}


		};

		this.click_drag_instruction001 = this.background.children['scene004'].children['click_x5F_drag_x5F_instruction001_1_'];
		this.click_drag_instruction002 = this.background.children['scene005'].children['click_x5F_drag_x5F_instruction002'];
		
		this.GoButtonRect = new Path.Rectangle(506, 292, 77, 39);
		this.skipButtonRect = new Path.Rectangle(545, 14, 70, 17);
		
		this.circle001 = new Path.Circle(129.5, 152.5, 18);
		this.circle002 = new Path.Circle(240, 81, 18);
		this.circle003 = new Path.Circle(365, 203.5, 18);
		this.circle004 = new Path.Circle(514, 159.5, 18);		
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
	this.pointAddedToThePath = false;
};

CurveLineTutorial.prototype.create = function(){
	
	var self = this;
	var currentSegment;
	var dragDetected = false;
	
	var mouseDownHandler = function(event){

		currentSegment = null;
		dragDetected = false;
		self.enableMouseFollowCurve = false;
		self.pointAddedToThePath = false;

		switch(self.currentScene){
		case 1:
				if(self.GoButtonRect.bounds.contains(event.point)){
					self.gotoNextScene();
				}
				break;
		case 2:
				// Click to advance past "PRESS 'P' TO SELECT THE PEN TOOL"
				document.getElementById("myCanvas").style.cursor="url(./assets/penCursor.png), url(./assets/penCursor.cur), auto";
				self.gotoNextScene();
				break;
		case 3:
				if(self.circle001.bounds.contains(event.point)){
					self.enableMouseFollowCurve = true;
					currentSegment = self.drawnPath.add( event.point );
				}else if(self.clickHintGroup) {
					self.clickHintGroup.visible = true;
				}				
				break;			

		case 4:
				if(self.circle002.bounds.contains(event.point)){
					currentSegment = self.drawnPath.add( event.point );
					self.enableMouseFollowCurve = true;
					self.pointAddedToThePath = true;
					//self.gotoNextScene();
				}else if(self.clickAndDragHintGroup) {
					self.clickAndDragHintGroup.visible = true;
				}
				break;
		case 5:
				if(self.circle003.bounds.contains(event.point)){
					currentSegment = self.drawnPath.add( event.point );	
					self.enableMouseFollowCurve = true;
					self.pointAddedToThePath = true;
				}
				break;
		case 7:
				if(self.circle004.bounds.contains(event.point)){
					currentSegment = self.drawnPath.add( event.point );
					self.enableMouseFollowCurve = true;
					//Do it after 3 secs
					self.gotoNextScene();

					//Do it for 3 secs automatically.
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

	var mouseUpHandler = function(event){

		if(self.skipButtonRect.bounds.contains(event.point)){
			tool.detach('mouseup');
			tool.detach('mousedown');				
			tool.detach('mousedrag');				
			tool.detach('keydown');
			tool.detach('mousemove');				
			self.game.gotoNextLevel();
			return;
		}

		if(self.enableMouseFollowCurve){
			self.mouseFollowCurve.segments[0] = currentSegment;
			self.showMouseFollowCurve = true;			
		}

		if(self.pathDrawingEscaped){
			self.showMouseFollowCurve = false;
			self.enableMouseFollowCurve = false;
		}

		
		switch(self.currentScene){
		case 3:
				if(self.circle001.bounds.contains(currentSegment.point)){					
					self.gotoNextScene();
				}
				break;			
		case 4:
				//Do on Mouse Drag complete.
				if(dragDetected){
					self.gotoNextScene();				
				}else if(self.pointAddedToThePath){

					//Remove the last added point.
					self.drawnPath.removeSegment(self.drawnPath.segments.length - 1);
					self.mouseFollowCurve.segments[0] = self.drawnPath.segments[self.drawnPath.segments.length - 1];
					self.click_drag_instruction001.style = { fillColor: '#EE4023'};
					self.click_drag_instruction001.content = "Please try dragging your mouse!";
					if(self.clickAndDragHintGroup) {
						self.clickAndDragHintGroup.visible = true;
					}
				}
					
				break;
		case 5:
				if(dragDetected){
					self.gotoNextScene();
					self.gotoNextScene();					
				}else if(self.pointAddedToThePath) {
					//remove the last added point to the path.
					self.drawnPath.removeSegment(self.drawnPath.segments.length - 1);
					self.mouseFollowCurve.segments[0] = self.drawnPath.segments[self.drawnPath.segments.length - 1];
					self.click_drag_instruction002.style = { fillColor: '#EE4023'};
					self.click_drag_instruction002.content = "PLEASE TRY DRAGGING YOUR MOUSE!!";
				}					

				break;				
		case 10:
			if(self.GoButtonRect.bounds.contains(event.point)){
				tool.detach('mouseup');
				tool.detach('mousedown');				
				tool.detach('mousedrag');				
				tool.detach('keydown');
				tool.detach('mousemove');				
				self.game.gotoNextLevel();
			}
			break;		
		}

	};

	var mouseDragHandler = function(event){

		if(!currentSegment){
			return;
		}

		currentSegment.selected = true;

		var delta = event.delta.clone();
		if(delta.x > 0 || delta.y > 0)
			dragDetected = true;

		currentSegment.handleIn.x -= delta.x;
		currentSegment.handleIn.y -= delta.y;
		currentSegment.handleOut.x += delta.x;
		currentSegment.handleOut.y += delta.y;		
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
		if((k === 'p' || keyCode === 80) && self.currentScene == 2){
				document.getElementById("myCanvas").style.cursor="url(./assets/penCursor.png), url(./assets/penCursor.cur), auto";
				self.gotoNextScene();		
		}
		
		if((k === 'escape' || keyCode === 27) && self.currentScene == 9){
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
		mouseup		: function(event) {
			if(self.skipButtonRect.bounds.contains(event.point) || (self.currentScene === 10 && self.GoButtonRect.bounds.contains(event.point))) {
				cleanupListeners();
			}
			mouseUpHandler(event);
		},
		mousedrag 	: mouseDragHandler,
		mousemove 	: mouseMoveHandler,
		keydown		: keyDownHandler
	});
	
};

CurveLineTutorial.prototype.gotoNextScene = function(){
	var sceneName;
	if(this.currentScene < 10)
		sceneName = "scene00" + this.currentScene;
	else
		sceneName = "scene0" + this.currentScene;

	var currentScene = this.background.children[sceneName];
	if(currentScene){
		currentScene.visible = false;
	}

	this.currentScene++;

	if(this.currentScene < 10)
		sceneName = "scene00" + this.currentScene;
	else
		sceneName = "scene0" + this.currentScene;

	currentScene = this.background.children[sceneName];
	if(currentScene){
		currentScene.visible = true;
	}

};
