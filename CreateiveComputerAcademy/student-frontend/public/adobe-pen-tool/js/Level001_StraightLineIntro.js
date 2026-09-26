//Straight Line Intro Class

var StraightLineIntro = function( world ) {
	//Declare all the public vairables
	this.game = world;
	//this.tool = new Tool();
	this.currentScene = 1;
};


StraightLineIntro.prototype.setupCanvas = function(){
	project.clear();
	debugLog("setupCanvas");
	var background = this.game.getSVGItem("LEVEL001_BACKGROUND");
	debugLog(background);
	if(background)
	{
		(project.activeLayer || new Layer()).insertChild(0, background);
		background.visible = true;

		this.scene001 = background.children.scene001;
		if(this.scene001){
			this.scene001.visible = true;
		}
		this.scene002 = background.children.scene002;
		if(this.scene002){
			this.scene002.visible = false;
		}
		this.scene003 = background.children.scene003;
		if(this.scene003){
			this.scene003.visible = false;
		}

		this.buttonRect = new Path.Rectangle(456, 255, 73, 36);

	}
		
	paper.view.update();

};

StraightLineIntro.prototype.create = function(){
	
	var self = this;
	var mouseHandler = function(event){
		switch(self.currentScene){
		case 1: 
				if(self.buttonRect.bounds.contains(event.point)){
					self.scene001.visible = false;
					self.scene002.visible = true;
					self.currentScene = 2;					
				}
				break;
		case 2:
				if(self.buttonRect.bounds.contains(event.point)){
					self.scene002.visible = false;
					self.scene003.visible = true;
					self.currentScene = 3;
				}
				break;
		case 3:
			if(self.buttonRect.bounds.contains(event.point)){
				tool.detach('mouseup');
				self.game.gotoNextLevel();
			}
			break;
		}
	};
	
	tool.on({
		mouseup : mouseHandler
	});
};
