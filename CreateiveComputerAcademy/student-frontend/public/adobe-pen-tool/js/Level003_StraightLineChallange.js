//Straight Line Intro Class

var StraightLineChallenge = function( world , backgroundID) {
	//Declare all the public vairables
	this.game = world;
    this.backgroundID = backgroundID;
	//this.tool = new Tool();
	//this.mouseClick = 0;
    this.idealShape;
    this.weber;
    this.weberText;
    this.finalBubble;
    this.score = 0 ;
	this.pathDrawingStarted = false;
	this.levelCrossed = false;
	this.numPts = 0 ;
	this.startingPoint;
	this.traceDone = false;
    this.scoreTxtMsg;
    this.scoreTxtMsg2;
    this.scoreTxtMsg3;
    this.weberBubble;
    this.lastPoint;
};

StraightLineChallenge.prototype.resetLevel = function(){
	this.score = 0 ;
    this.numPts = 0 ;
	this.pathDrawingStarted = false;
	this.levelCrossed = false;
	this.drawnPath.removeSegments();
    this.drawnPath.clear();
    this.endPath.removeSegments();
    this.endPath.clear();
    this.drawnPath.closed = false;
	//.scoreText.content = '';
    //this.scoreText2.content = '';
    this.drawnPath.fillColor = "rgba(0,0,0,0)";
	this.drawnPath.strokeWidth = 2;
    this.traceDone =false;
    this.weber.visible = true;
    this.weberText.visible = true;
    this.currentSegment = null;
    this.drawnPath.selected = true;
    this.scoreTxtMsg.visible = false;
    this.weberBubble.visible = true;
    this.finalBubble.visible = false;
    this.scoreTxtMsg.visible = false;
    this.scoreTxtMsg2.visible = false;
    this.scoreTxtMsg3.visible = false;

    this.mouseFollowCurve.visible = false;      
    this.showMouseFollowCurve = false;
};

StraightLineChallenge.prototype.setupCanvas = function(){
	project.clear();
    document.getElementById("myCanvas").style.cursor="url(./assets/penCursor.png), url(./assets/penCursor.cur), auto";
    var background = this.game.getSVGItem(this.backgroundID);
	debugLog(background);
	if(background)
	{
		(project.activeLayer || new Layer()).insertChild(0, background);
        //remember ideal shape for comparison
        this.idealShape = background._children["idealShape"];
        this.postDrawingElements = background._children["postDrawingElements"];
        if(this.postDrawingElements){
            this.postDrawingElements.visible = false;
        }

        this.startPoint = background._children["startpoint"];

        this.weber = background._children["weber"];
        this.weberText = this.weber._children["text"];
        this.weberBubble = this.weber._children["weberBubble"];
        console.log(this.weber);
		background.visible = true;

        this.scoreTxtMsg = new PointText({
				content: '',
            	fontFamily: 'adobe clean',
             	fontWeight: 400,
				point: new Point(124, 316),
				fillColor: '#6666FF',
				fontSize: 18
        });

         this.scoreTxtMsg2 = new PointText({
				content: '... Stellar! Your total score is: ',
            	fontFamily: 'adobe clean',
                fontWeight: 400,
				point: new Point(185, 316),
				fillColor: '#FFEBBA',
				fontSize: 18
        });

         this.scoreTxtMsg3 = new PointText({
				content: '',
            	fontFamily: 'adobe clean',
             	fontWeight: 400,
				point: new Point(400, 316),
				fillColor: '#6666FF',
				fontSize: 18
        });

        this.scoreTxtMsg2.visible = false;
        this.scoreTxtMsg3.visible = false;
        this.finalBubble = background._children["finalBubble"];
        this.finalBubble.visible = false;

	}



    //set up path
    this.drawnPath = new Path();
    this.endPath = new Path();
    //this.endPath.visible = false;

    this.buttonRect = new Path.Rectangle(512, 302, 82, 42);

    this.mouseFollowCurve = new Path();

};

StraightLineChallenge.prototype.initialize = function(){
	//Variable used to track the path drawn by the user.
	this.drawnPath.strokeColor = '#85DAD1';
	this.drawnPath.strokeWidth = 2;
	this.drawnPath.selected = true;
	this.drawnPath.visible = true;

    this.mouseFollowCurve.strokeColor = '#4F80FF';
    this.mouseFollowCurve.strokeWidth = 1;

    //Initialize the curve with 2 points.
    this.mouseFollowCurve.add(new Point(100, 100));
    this.mouseFollowCurve.add(new Point(300, 300));

    this.mouseFollowCurve.visible = false;
    this.showMouseFollowCurve = false; 
};

StraightLineChallenge.prototype.setupMouseHandlers = function(){

	//Create the world here.
	var self = this;
    var currentSegment;
	var currentTempSegment;

	var mouseDownHandler = function(event){
	if(!self.traceDone) {
        self.mouseFollowCurve.visible = false;
        self.showMouseFollowCurve = false;

		currentSegment = null;
		currentSegment = self.drawnPath.add(event.point);

		//count number of points to determine starting point
		self.numPts++;

		//assign starting point
		if(self.numPts == 1) {
			self.startingPoint = event.point;            
            if(self.startPoint){
                self.startPoint.visible = false;
            }
        }

    }
    else {
        self.weber.visible = false;
        self.endPath.add(event.point);
    }

    self.lastPoint = event.point;


	};

    var mouseDragHandler = function(event){
        currentSegment.selected = true;
		var delta = event.delta.clone();
		currentSegment.handleIn.x -= delta.x;
		currentSegment.handleIn.y -= delta.y;
		currentSegment.handleOut.x += delta.x;
		currentSegment.handleOut.y += delta.y;
	};

	var mouseUpHandler = function(event) {
        currentSegment.selected = false;
		//when finished with shape...
		if(self.checkClosedPath(self.lastPoint, self.startingPoint) && self.numPts > 2) {
            //self.finalizeStage();
			console.log("path closed!");
			self.drawnPath.closed = true;

			//finish drawing
			document.getElementById("myCanvas").style.cursor = 'default';
			self.drawnPath.fillColor = "rgba(255,255,255,.2)";
			self.drawnPath.strokeWidth =0;
			self.drawnPath.selected = false;

			self.score = self.compareShapes();
			console.log("score: " + self.score);

			self.traceDone = true;
            self.weber.visible = true;
            self.weberText.visible = false;
            self.weberBubble.visible = false;
            self.scoreTxtMsg.visibile = true;
            self.scoreTxtMsg2.visible = true;
            self.scoreTxtMsg3.content = self.game.getScore() + self.score;
            self.scoreTxtMsg3.visible = true;
            self.finalBubble.visible = true;
            self.scoreTxtMsg.content = self.score + "/100";
            self.game.updateOverallScore(self.score);

            if(self.postDrawingElements){
                self.postDrawingElements.bringToFront();
                self.postDrawingElements.visible = true;
            }
		}

        if(self.traceDone && self.buttonRect.bounds.contains(event.point)){
            self.resetLevel();
            self.scoreTxtMsg.content = "";
            self.finalizeStage();
            self.game.gotoNextLevel();
        }

        if(!self.traceDone){
            self.mouseFollowCurve.segments[0] = currentSegment;           
            self.showMouseFollowCurve = true;            
        }
	};

    var mouseMoveHandler = function(event){
        //Drawing happening.
        if(self.showMouseFollowCurve){
            self.mouseFollowCurve.segments[1].point = event.point;
            self.mouseFollowCurve.visible = true;
        }
    };


	tool.on({
		mousedown : mouseDownHandler,
        mousedrag : mouseDragHandler,
        mousemove : mouseMoveHandler,        
		mouseup   : mouseUpHandler
	});

}

 //borrowed from Swapnil's isPointInCloseVicinity method
StraightLineChallenge.prototype.checkClosedPath = function( point1, point2){
	var tolerance = 10;
	var pointVicinity = false;
	if( point1 && point2 && (Math.abs(point1.x - point2.x) < tolerance ) && ( Math.abs(point1.y - point2.y) < tolerance ) ) {
		pointVicinity = true;
	}
	return pointVicinity;
};

//compare shapes to determine accuracy
StraightLineChallenge.prototype.compareShapes = function () {
	//Testing accuracy
	var intersectionPath = this.idealShape.intersect(this.drawnPath);

    intersectionPath.style = {
        fillColor: new Color(0, 1, 0, 0.5),
        strokeColor: new Color(1, 1, 1, 0.5),
        strokeWidth: 3
    };
	
    var drawnArea = Math.abs( this.drawnPath.getArea() );
    var idealArea = Math.abs( this.idealShape.getArea() );
    var intersectionArea = Math.abs( intersectionPath.getArea() );

    var outerDeviation = Math.abs(drawnArea - intersectionArea) / drawnArea;
    var innerDeviation = Math.abs(idealArea - intersectionArea) /idealArea;

    var maxDeviation = Math.max(outerDeviation, innerDeviation);
    if(maxDeviation > 1)
        maxDeviation = 1;

    var percent = Math.ceil(100 * (1 - maxDeviation));
    
    return percent;

};


StraightLineChallenge.prototype.finalizeStage = function(){
	tool.detach('mousedown');
	tool.detach('mousedrag');
	tool.detach('mouseup');
    tool.detach('mousemove');
};
