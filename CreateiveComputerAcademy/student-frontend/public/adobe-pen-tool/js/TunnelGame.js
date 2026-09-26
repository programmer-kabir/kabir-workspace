var CONST_PLANET_OFFSET = 72;

var TunnelGame = function( world, backgroundID, tunnelID ) {
	//Declare all the public vairables
	this.game = world;
	this.tunnelID = tunnelID;
	this.backgroundID = backgroundID;

	this.defaultStartingPoint = new Point( 50, 180 );

	//Variables for World Adjustments.
	this.worldConstantSpeed = 0.25;
	this.stopWorldMovement = true;
	this.desirablePositionOfNextPoint = this.game.worldW * 0.5;
	this.worldAdjustmentDeltaOriginal = 0;
	this.worldAdjustmentVelocity = 1;
	this.worldAdjustmentVelocityFactor = 0.7;

	//Character Speed.
	this.viewportLeftMargin = 50;
	this.characterSpeedIncrement = 0;
	this.outsideViewportCharacterSpeed = 10;
	this.finishAnimationCharacterSpeed = 5;
	this.characterSpeed = 1.25;
	this.score = this.game.getScore() ;
	this.lastSegmentScore = 0;
	this.spaceShipDropped = false;
	this.spaceShipCollided = false;
	this.pathDrawingStarted = false;
	this.totalTranslation = 0;
	this.collisionCircleGroup = null;

	this.totalLengthofTunnel = 0;

	this.levelCrossed = false;
	this.messageTextItem = null;
	this.finishPointReached = false;
	this.showStageFinishAnimation = false;
	this.showLandingAnimation = false;
	this.escPressedOnce = false;	
	this.spaceShipInsideLowerBound = true;

	this.backgroundAudio = this.game.getAudioItem('BACKGROUND_LOOP');
	this.backgroundAudio.play();
	this.backgroundAudio.loop();
	this.backgroundAudio.setVolume(50);

	this.mouseClickAudioArray = new Array();
	this.mouseClickAudioArray.push(this.game.getAudioItem('CLICKSOUND1'));						
	this.mouseClickAudioArray.push(this.game.getAudioItem('CLICKSOUND2'));						
	this.mouseClickAudioArray.push(this.game.getAudioItem('CLICKSOUND3'));						
	this.mouseClickAudioArray.push(this.game.getAudioItem('CLICKSOUND4'));

	this.mouseDragFinishAudio = this.game.getAudioItem('DRAG');

	document.getElementById("myCanvas").style.cursor="url(./assets/penCursor.png), url(./assets/penCursor.cur), auto";
	//buzz.all().mute();

	this.retryButtonRect = new Path.Rectangle(246, 212, 125, 36);
	this.stopNewPathDrawing = false;
};

TunnelGame.prototype.resetLevel = function(){
	this.score = this.game.getScore() ;
	this.lastSegmentScore = 0;
	this.characterSpeedIncrement = 0;
	this.worldAdjustmentDeltaOriginal = 0;

	this.lowerInersectionPoint = null;
	this.upperInersectionPoint = null;

	this.pathCollisionDetected = false;
	this.spaceShipCollided = false;	
	this.spaceShipDropped = false;
	this.pathDrawingStarted = false;
	this.levelCrossed = false;

	this.drawnPath.removeSegments();
	this.drawnPath.add( new Point( this.defaultStartingPoint.x - this.totalTranslation, this.defaultStartingPoint.y ) );
	this.tempPathSegment.removeSegments();
	this.tempPathSegment.add(new Point( this.defaultStartingPoint.x - this.totalTranslation, this.defaultStartingPoint.y ));
	
	this.spaceShip.position = this.defaultStartingPoint;
	this.spaceShip.rotation = 0;
	this.spaceShipInsideLowerBound = true;

	this.scoreText.content = '';
	this.lastSegmentScoreText.content = '';

	this.movingItemsGroup.translate(this.totalTranslation, 0);
	this.totalTranslation = 0;
	this.characterSpeed = 5 * this.worldConstantSpeed;

	//debugLog(this.collisionCircleGroup);
	this.collisionCircleGroup.removeChildren(); 
	this.scoreMessageBox.visible = false;
	this.mbReasonState.children.success.visible = false;
	this.mbReasonState.children.drop.visible = false ;
	this.mbReasonState.children.crash.visible = false ;	

	this.mouseFollowCurve.visible = false;		
	this.showMouseFollowCurve = false;
	this.finishPointReached = false;
	this.showStageFinishAnimation = false;
	this.showLandingAnimation = false;
	this.escPressedOnce = false;

	this.clickAnywhereHint.visible = true;
	this.stopNewPathDrawing = false;

};

TunnelGame.prototype.showMessage = function( reason, btnLabel ){
	//this.mbReason.content = message;
	//this.scoreMessageBox.position = new Point( 308 + 26, 180 + 60);//new Point( this.game.worldW/2, this.game.worldH/2 );
	this.mbScore.content = this.score > 10 ? this.score : '0' + this.score ;
	this.mbButtonLabel.content = btnLabel;
	this.scoreMessageBox.visible = true;

	switch(reason){
		case 1 : //Crash
				this.mbReasonState.children.crash.visible = true ;
				break;
		case 2 : //drop
				this.mbReasonState.children.drop.visible = true ;
				break;
		case 3 : //Success
				this.mbReasonState.children.success.visible = true ;
				break;
	}
};

TunnelGame.prototype.setupCanvas = function(startHint){
	
	project.clear();
	
	//var background = this.game.getSVGItem(this.backgroundID);
	//sshrivas 30/09/2014 : Part of Optimization, using Raster instead of SVG to improve performance.
	var background = new Raster(this.backgroundID);

	if(background)
	{
		background.position = view.center;
		(project.activeLayer || new Layer()).insertChild(0, background);
		background.visible = true;
	}

	this.stars = new Stars( 20, this.game );

	this.tunnelSVG = this.game.getSVGItem(this.tunnelID);
	
	if(this.tunnelSVG){
		
		this.totalLengthofTunnel = this.tunnelSVG.bounds.width;
		//Customize tunnel Graphics before adding to the DOM.		
		(project.activeLayer || new Layer()).addChild(this.tunnelSVG);
		this.tunnelSVG.visible = true;

		//Get the Upper and Lower Constraints from the Tunnel
		var constraintGroup = this.tunnelSVG.children.constraints;
		this.upperConstraint = null;
		this.lowerConstraint = null;

		this.lowerInersectionPoint = null;
		this.upperInersectionPoint = null;

		this.pathCollisionDetected = false;
		this.spaceShipCollided = false;

		if(constraintGroup && constraintGroup.children.length > 1){
			this.lowerConstraint = constraintGroup.children[0];
			this.upperConstraint = constraintGroup.children[1];

			//sshrivas 30/09/2014 :  Removing dashed style of the stroke to improve the performance.
			//lot of CPU was getting used to render dashed lines of the constraints.
			//Style the tunnel.
			this.upperConstraint.style =  this.lowerConstraint.style = {
			    fillColor: 'black',
			    strokeColor: 'black',
			    //strokeWidth: 4,
			    // dashArray: [5, 7]
			};
		}

		this.finishPoint = new Point( this.totalLengthofTunnel, 140 );

		//Finish Point detection.
		this.finishPointGroup = this.tunnelSVG.children.finishpoint;
		
		if(this.finishPointGroup){
			this.finishPoint.x = this.finishPointGroup.bounds.x + this.finishPointGroup.bounds.width/2;
			this.finishPoint.y = this.finishPointGroup.bounds.y + this.finishPointGroup.bounds.height/2;
		}

		this.escMessageGroup = new Group();
		this.tunnelSVG.addChild(this.escMessageGroup);
		this.escMessageGroup.visible = false;

		var escapeMessageTextItem = new PointText({
		    point: [this.finishPoint.x, 112],
		    content: this.game.getLocaleString("escape_message=Press ESC to\n end your path"),
		    fillColor: '#FFEBBA',
		    fontFamily: 'adobe clean',
		    fontSize: 18,
		    justification: 'center'
		});

		this.escMessageGroup.addChild(escapeMessageTextItem);

	}

	this.drawnPath = new Path();

	//Collision Detection Line Segment.
	this.tempPathSegment = new Path();	

	//Follow Mouse pointer path.
	this.mouseFollowCurve = new Path();

	this.movingItemsGroup = new Group([this.tunnelSVG, this.drawnPath, this.tempPathSegment]);

	this.spaceShip = this.game.getSVGItem('SPACESHIP');

	if(this.spaceShip){
		(project.activeLayer || new Layer()).addChild(this.spaceShip);
		this.spaceShip.position = this.defaultStartingPoint;
		this.spaceShip.visible = true;
		this.spaceShip.applyMatrix = false;

		var stand = this.spaceShip.children.stand;
		if(stand){
			stand.visible = false;
		}
		var fire = this.spaceShip.children.fire;
		if(fire)
			fire.opacity = 1;
	}

	this.scoreText = new PointText({
		content: '',
		point: new Point(this.game.worldW - 75, 65),
        fontFamily: 'adobe clean',
		justification : 'right',
		fillColor: '#2ccab9',
		fontSize: 28
	});	

	this.lastSegmentScoreText = new PointText({
		content: '',
		point: new Point(100, 100),
        fontFamily: 'adobe clean',
		fillColor: '#00DD00',
		fontSize: 12
	});

	this.movingItemsGroup.addChild( this.lastSegmentScoreText );
	this.collisionCircleGroup = new Group();

	this.scoreMessageBox = this.game.getSVGItem("SCORE_MESSAGEBOX");
	if(this.scoreMessageBox){
		(project.activeLayer || new Layer()).addChild(this.scoreMessageBox);
		//debugLog( this.scoreMessageBox.bounds );
		//this.scoreMessageBox.position = new Point( this.game.worldW/2, this.game.worldH/2 );
		var editableGroup = this.scoreMessageBox.children.Editable;
		if(editableGroup.children.length >= 2){
			this.mbButtonLabel = editableGroup.children.label;
			this.mbScore = editableGroup.children.gamescore;
			//this.mbReason = editableGroup.children.reason;
		}
		this.mbReasonState = this.scoreMessageBox.children.states;
		if(this.mbReasonState && this.mbReasonState.children.length >= 3){
			this.mbReasonState.children.success.visible = false ;
			this.mbReasonState.children.drop.visible = false;
			this.mbReasonState.children.crash.visible = false;			
		}

		this.scoreMessageBox.visible = false;
	}

	var clickAnywhereHintText = new PointText({
	    point: [450, 250],
	    content: startHint,
	    fillColor: '#FFEBBA',
	    fontFamily: 'adobe clean',
        fontWeight: 300,
	    fontSize: 18,
	    justification: 'center'
	});

	var clickAnywhereHintCircleInner = new Path.Circle({
		center: [450, 200],
		radius: 12,
		fillColor: '#D5DAEE'
	});
	
	var clickAnywhereHintCircleOuter = new Path.Circle({
		center: [450, 200],
		radius: 19,
		strokeWidth: 2,
		strokeColor: '#D5DAEE'
	});

	//Help hint to get started.
	this.clickAnywhereHint = new Group([clickAnywhereHintText, clickAnywhereHintCircleInner, clickAnywhereHintCircleOuter]);


};

TunnelGame.prototype.initialize = function(){
	//Variable used to track the path drawn by the user.
	this.drawnPath.strokeColor = '#dddddd';
	this.drawnPath.strokeWidth = 1;
	this.drawnPath.dashArray = [10, 4];
	this.drawnPath.selected = false;
	this.drawnPath.visible = true;
	this.drawnPath.add( this.defaultStartingPoint );

	this.tempPathSegment.strokeColor = '#00DDDD';
	this.tempPathSegment.strokeWidth = 1;
	this.tempPathSegment.add(this.defaultStartingPoint);

	this.mouseFollowCurve.strokeColor = '#4F80FF';
	this.mouseFollowCurve.strokeWidth = 1;

	//Initialize the curve with 2 points.
	this.mouseFollowCurve.add(new Point(100, 100));
	this.mouseFollowCurve.add(new Point(300, 300));

	this.mouseFollowCurve.visible = false;
	this.showMouseFollowCurve = false;
};

TunnelGame.prototype.updateScore = function(){
	//Scoring Logic.
	this.lastSegmentScore = Math.floor( this.tempPathSegment.length / 100 );

	//If user is drawing point backword give zero score.
	if(this.tempPathSegment.segments[0].point.x > this.tempPathSegment.segments[1].point.x)
		this.lastSegmentScore = 0;

	//Check for Bezier curve, if Yes make the point double.
	if(this.tempPathSegment.segments.length > 1 && !this.tempPathSegment.lastSegment.linear){
		this.lastSegmentScore *= 2;
	}

	this.score += this.lastSegmentScore;

	//Update the score path location to the middle of path segment.
	if(this.tempPathSegment.segments.length > 1){
		var midPoint = this.tempPathSegment.getLocationAt( this.tempPathSegment.length / 2 );

		this.lastSegmentScoreText.point = new Point( midPoint.point.x, midPoint.point.y - 10);
	}
	
};

TunnelGame.prototype.setupMouseHandlers = function(){
	
	//Create the world here.
	var self = this;
	var currentSegment;
	var currentTempSegment;
	var dragDetected = false;

	var mouseDownHandler = function(event){

		if( self.spaceShipCollided || self.spaceShipDropped || self.levelCrossed || self.showStageFinishAnimation || self.stopNewPathDrawing){
			return;
		}


		self.clickAnywhereHint.visible = false;
		var randomIndex = Math.round(Math.random() * (self.mouseClickAudioArray.length-1) );
		//debugLog(randomIndex);
		self.mouseClickAudioArray[randomIndex].load().play();
		
		if (currentSegment)
			currentSegment.selected = false;

		currentSegment = null;
		currentSegment = self.drawnPath.add(event.point);
		currentTempSegment = self.tempPathSegment.add(event.point);
		currentSegment.selected = true;
		self.stopWorldMovement = true;

		self.computeCollision();

		self.mouseFollowCurve.visible = false;
		self.showMouseFollowCurve = false;

		//Check for finish point.
		if( self.isPointInCloseVicinity(self.finishPoint, new Point( event.point.x + self.totalTranslation, event.point.y), 12)){
			//Game Finished, show the esc message and animate the ship.
			self.finishPointReached = true;
			self.showStageFinishAnimation = true;
			self.finishPointGroup.visible = false;
			self.showMouseFollowCurve = false;
			self.mouseFollowCurve.visible = false;
			currentSegment.selected = false;
		}

		dragDetected = false;
	};

	var mouseDragHandler = function(event){

		if( self.spaceShipCollided || self.spaceShipDropped || self.levelCrossed || self.showStageFinishAnimation || self.stopNewPathDrawing){
			return;
		}
		var delta = event.delta.clone();
		if(delta.x > 0 || delta.y > 0)
			dragDetected = true;

		currentSegment.handleIn.x -= delta.x;
		currentSegment.handleIn.y -= delta.y;
		currentSegment.handleOut.x += delta.x;
		currentSegment.handleOut.y += delta.y;		
		
		currentTempSegment.handleIn.x -= delta.x;
		currentTempSegment.handleIn.y -= delta.y;
		currentTempSegment.handleOut.x += delta.x;
		currentTempSegment.handleOut.y += delta.y;		

		self.computeCollision();
	};

	var mouseUpHandler = function(event) {

		if(self.levelCrossed && self.retryButtonRect.bounds.contains(event.point)){
			//Goto next level.
			self.game.updateOverallScore(self.score);
			self.resetLevel();
			self.cleanUp();
			self.game.gotoNextLevel();
			return;
		}

		if( (self.spaceShipCollided || self.spaceShipDropped) && self.retryButtonRect.bounds.contains(event.point) ){
			self.resetLevel();
			return;
		}

		if(self.showStageFinishAnimation || self.stopNewPathDrawing){
			return;
		}

		self.pathDrawingStarted = true;

		if (currentSegment){
			currentSegment.selected = false;				
			self.drawnPath.selected =false;
			self.stopWorldMovement = false;
		}

		//Move the screen so that next point is at the desirable Position
		if(!self.finishPointReached){
			
			//Normally adjust the world moving the current click point to 50% of the screen space.
			self.worldAdjustmentDeltaOriginal = self.worldAdjustmentDelta = currentSegment.point.x - self.desirablePositionOfNextPoint;
			
			if(self.worldAdjustmentDelta < 0)
				self.worldAdjustmentDelta = 0;

			//Check whether after adjustments we are moving in the finishPoint, if yes move till the finish point.
			if((self.totalTranslation + self.worldAdjustmentDelta + self.game.worldW ) > ( self.finishPoint.x + 75 ) ){
				self.worldAdjustmentDeltaOriginal = self.worldAdjustmentDelta = self.finishPoint.x + 75 - (self.totalTranslation + self.game.worldW);
				self.finishPointReached = true;
			}
			self.worldAdjustmentVelocity = 1;
		}

		//If collision is detected then speed up the character to show the collision quickly.
		if(self.pathCollisionDetected){
			self.characterSpeed = 20 * self.worldConstantSpeed;
			self.stopNewPathDrawing = true;
		}

		//Update the score
		self.updateScore();		
		self.scoreText.content = self.score;
		
		if(self.lastSegmentScore )
			self.lastSegmentScoreText.content = '+' + self.lastSegmentScore;
		else
			self.lastSegmentScoreText.content = '';
		
		if(currentTempSegment){
			//remove the first segment from the temp Path Segment.
			self.tempPathSegment.removeSegment(0);
			self.mouseFollowCurve.segments[0] = self.tempPathSegment.lastSegment;			
			self.showMouseFollowCurve = true;
		}

		if(dragDetected){
			self.mouseDragFinishAudio.load().play();
		}

	};

	var mouseMoveHandler = function(event){
		//Drawing happening.
		if(self.showMouseFollowCurve && !(self.pathCollisionDetected || self.spaceShipDropped)){
			self.mouseFollowCurve.segments[1].point = event.point;
			self.mouseFollowCurve.visible = true;
		}
	};

	var frameHandler = function(event){

		if(!self.pathDrawingStarted)
			return;

		self.game.startStat();

		var worldMovementAmount = self.calculateWorldMovementAmount();
		
		if(!self.stopWorldMovement && !self.pathCollisionDetected && !self.spaceShipDropped && !self.levelCrossed) {
			self.totalTranslation += worldMovementAmount;
			self.movingItemsGroup.translate(-worldMovementAmount, 0);
			self.stars.moveStarsHorizontally( worldMovementAmount );			
		}
		self.moveSpaceShipOnDrawnPath();
		self.game.endStat();
	};

	var keyDownHandler = function(event){
		if(event.key == 'escape'){
			if(self.showLandingAnimation){
				self.escPressedOnce = true;
				document.getElementById("myCanvas").style.cursor = 'default';
			}
		} else if(event.key == 'option'){
			debugLog('Alt key Down');
		}
	};

	var keyUpHandler = function(event){
		if(event.key == 'option'){
			debugLog('Alt Key Up');
		}
	}



	tool.on({
		mousedown 	: mouseDownHandler,
		mousedrag 	: mouseDragHandler,
		mouseup 	: mouseUpHandler,
		mousemove 	: mouseMoveHandler,
		keydown		: keyDownHandler,
		keyup 		: keyUpHandler
	});	

	view.on({
		frame : frameHandler
	});
}

TunnelGame.prototype.create = function(){
	var createMe = true;
};

TunnelGame.prototype.finalizeStage = function(){
	tool.detach('mousedown');
	tool.detach('mousedrag');
	tool.detach('mouseup');
	tool.detach('mousemove');
	tool.detach('keydown');
	tool.detach('keyup');
	document.getElementById("myCanvas").style.cursor="pointer";
};

TunnelGame.prototype.calculateWorldMovementAmount = function(){
	var movementAmout = 0;
    if(this.worldAdjustmentDelta > 1)
    {
    	movementAmout = this.worldAdjustmentVelocity;				    	
    	this.worldAdjustmentDelta -= this.worldAdjustmentVelocity;

    	//console.log(worldAdjustmentVelocity);

    	if( this.worldAdjustmentDelta > this.worldAdjustmentDeltaOriginal/2 )
    		this.worldAdjustmentVelocity += this.worldAdjustmentVelocityFactor;
    	else if(this.worldAdjustmentVelocity > 1)
    		this.worldAdjustmentVelocity -= this.worldAdjustmentVelocityFactor;

    } else if(!this.finishPointReached){
    	movementAmout = this.worldConstantSpeed;
    }
    else if(this.finishPointReached){
    	movementAmout = 0;
    }

    return movementAmout;
};

TunnelGame.prototype.isPointInCloseVicinity = function( point1, point2, tolerance){
	var pointVicinity = false;
	if( point1 && point2 && (Math.abs(point1.x - point2.x) < tolerance ) && ( Math.abs(point1.y - point2.y) < tolerance ) ) {
		pointVicinity = true;
	}
	return pointVicinity;
};

TunnelGame.prototype.moveSpaceShipOnDrawnPath = function(){

	if(this.levelCrossed)
		return;
	
	if( this.spaceShipCollided ){
		//Collide the ship amd move down.
		this.spaceShip.position.y += this.characterSpeed;
		if( this.spaceShip.rotation == 100)
			this.spaceShip.rotation = 80;
		else 
			this.spaceShip.rotation = 100;
		return;
	}

	if(this.spaceShipDropped && this.spaceShipInsideLowerBound){
		this.spaceShip.position.x += this.characterSpeed/2;
		this.spaceShip.position.y += this.characterSpeed*3;
		
		if( this.spaceShip.rotation == 100)
			this.spaceShip.rotation = 80;
		else 
			this.spaceShip.rotation = 100;

		//debugLog(this.spaceShip.position.y);
		if(this.spaceShip.position.y > this.game.worldH){
			this.spaceShipInsideLowerBound = false;
			this.showMessage(2, "TRY AGAIN");		
		}


		return;

	}

	if(this.showLandingAnimation){

		if(this.escPressedOnce){
			this.escMessageGroup.visible = false;
		}
		else{
			this.escMessageGroup.visible = true;
			return;
		}
			

		this.spaceShip.rotation = 270;
		this.spaceShip.position.x = this.landingPoint.x;
		var landingDiff = this.landingPoint.y - this.spaceShip.position.y;
		if( landingDiff > 5 ){
			//Slowly fade the fire.
			this.spaceShip.children.fire.opacity = landingDiff/CONST_PLANET_OFFSET;
			
			//Show Landing gear when spaceship is near the planet
			if(landingDiff < 10){
				this.spaceShip.children.stand.visible = true;
			}
			this.spaceShip.position.y += landingDiff/40;
		}else{
        	this.levelCrossed = true;
        	this.drawnPath.selected = false;
        	this.showMessage(3, "NEXT LEVEL");			
		}
		return;
	}

   	//If character is moved out of the screen move at double the speed.
   	if( (this.spaceShip.position.x - this.viewportLeftMargin) < 0)
   		this.characterSpeedIncrement += this.outsideViewportCharacterSpeed;
   	else if(this.showStageFinishAnimation)
   		this.characterSpeedIncrement += this.finishAnimationCharacterSpeed;
   	else
   		this.characterSpeedIncrement += this.characterSpeed;

   	var offset = this.characterSpeedIncrement;

   	currentCharacterMovementOffset = offset;

   	//Check Weather Spaceship has crossed the drawn path.
   	if(offset > this.drawnPath.length){
   		if(this.showStageFinishAnimation){
   			this.landingPoint = new Point(this.finishPoint.x - this.totalTranslation, this.finishPoint.y + CONST_PLANET_OFFSET);
   			this.showLandingAnimation = true;
   		}else {
	   		this.spaceShipDropped = true;
   		}
   		return;
   	}

    var loc = this.drawnPath.getLocationAt(offset % this.drawnPath.length);
    if (loc) {
    	movementDelta = loc.point.x - this.spaceShip.position.x;
        
        //Check for Collision Detection.
        if(this.pathCollisionDetected) {
        	if( this.isPointInCloseVicinity(loc.point, this.upperInersectionPoint, 10) || this.isPointInCloseVicinity(loc.point, this.lowerInersectionPoint, 10) ){
        		this.spaceShipCollided = true;
        		this.showMessage(1, "TRY AGAIN");
    	    }
        } 

        this.spaceShip.position = loc.point;
        this.spaceShip.rotation = loc.tangent.angle;

    }				
};

TunnelGame.prototype.drawIntersection = function(path1, path2) {
	var firstIntersectionPoint = null;
	var intersections = path1.getIntersections(path2);
	for (var i = 0; i < intersections.length; i++) {
		
		var collisionCircle = new Path.Circle({
			center: intersections[i].point,
			radius: 5,
			fillColor: '#ff0000'
		}).removeOnDrag();

		//this.collisionCircleGroup.addChild( collisionCircle );

		if(i == 0){
			firstIntersectionPoint = intersections[0].point;
		}
		//this.movingItemsGroup.addChild( collisionCircle );
		this.collisionCircleGroup.addChild( collisionCircle );		
		//debugLog( this.collisionCircleGroup );
	}
	return firstIntersectionPoint;
}

TunnelGame.prototype.computeCollision = function(){
	if( this.upperConstraint && this.lowerConstraint)
	{
		this.upperInersectionPoint = this.drawIntersection(this.upperConstraint, this.tempPathSegment);
		this.lowerInersectionPoint = this.drawIntersection(this.lowerConstraint, this.tempPathSegment);

		if(this.upperInersectionPoint || this.lowerInersectionPoint ){
			this.pathCollisionDetected = true;
		} else {
			this.pathCollisionDetected = false;
		}
	}
};

TunnelGame.prototype.cleanUp = function(){
	tool.detach('mouseup');
	tool.detach('mousedown');
	tool.detach('mousedrag');
	tool.detach('mousemove');
	view.detach('frame');
	this.backgroundAudio.stop();
};
