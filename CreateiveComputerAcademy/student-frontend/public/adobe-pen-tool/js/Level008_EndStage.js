//Straight Line Intro Class

var EndStage = function( world ) {
	//Declare all the public vairables
	this.game = world;
	this.currentScene = 1;

};

EndStage.prototype.setupCanvas = function(){
	project.clear();
	
	this.background = this.game.getSVGItem("LEVEL008_ENDSTAGE");
	if(this.background)
	{
		(project.activeLayer || new Layer()).insertChild(0, this.background);
		this.background.visible = true;

		for (var i = 1; i <= 3; i++) {
			var sceneName = "scene00" + i;
			var currentScene = this.background.children[sceneName];
			if( currentScene ){
				if (i == 1) {
					currentScene.visible = true;
				} else {
					currentScene.visible = false;
				}				
			}

		};

		this.background.children['scene001'].children['finalscore'].content = this.game.totalScore;
		
		this.GoButtonRect = new Path.Rectangle(450, 254, 80, 40);
		this.PlayAgainButtonRect = new Path.Rectangle(450, 254, 114, 40);
		
	}
		
};

EndStage.prototype.create = function(){
	
	var self = this;
	var mouseHandler = function(event){

		switch(self.currentScene){
		case 1:
				if(self.GoButtonRect.bounds.contains(event.point)){
					self.gotoNextScene();
				}
				break;
		case 2:
				if(self.GoButtonRect.bounds.contains(event.point)){
					self.gotoNextScene();
				}
				break;
		case 3:
				if(self.PlayAgainButtonRect.bounds.contains(event.point)){
					tool.detach('mouseup');
					location.reload();
				}
				break;
		}
	};

	tool.on({
		mouseup 	: mouseHandler
	});
};

EndStage.prototype.gotoNextScene = function(){
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
