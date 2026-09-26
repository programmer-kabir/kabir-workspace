//Self Invoking function which creates a private namespace for game.
var debugLog = function(message){
	console.log(message);
};

function togglesound(){
	buzz.all().toggleMute();
	var controlItem = document.getElementById("soundcontrol");
	if(controlItem.innerHTML == "Sound ON"){
		controlItem.innerHTML = "Sound OFF";
	}else{
		controlItem.innerHTML = "Sound ON";
	}
};

(function(){

	//Main game object, starting point of the application
	var Game = {

		presents : {

		},

		//Level Indicator Variable
		currentLevel : null,
		worldW : 615,
		worldH : 360,
		stats : null,
		totalScore : 0, 
		resouceLoadCompleteCallback : function(){
			//Loading of resource is completed. We can proceed with the games.
			debugLog("Loaded All Items");
			//dsafasd.ad();
			var url = window.location.href;
			var params = url.split('?');
			if(params.length > 1 && !isNaN(parseInt(params[1])))
				currentLevel = params[1];

			document.getElementById("PRELOADER").style.visibility = 'hidden';
			Game.gotoNextLevel();	
		},
		getSVGItem : function(svgID) {
			//Get the svgItem from the resouce Manager. Usage getSVGItem("LEVEL003_BACKGROUND")
			return this.resouceManager.getSVGItem(svgID);
		},
		getAudioItem : function(audioID) {
			return this.resouceManager.getAudioItem(audioID);
		},
		updateOverallScore : function(score){
			Game.totalScore += score;
		},
		getScore : function(){
			return Game.totalScore;
		},
		//Application starter function.
		initialize: function() {
			//Do paper specific initializations.
			paper.install(window);
			paper.setup('myCanvas');
			tool = new Tool();
			currentLevel = 0;

			
				
			Game.resouceManager = new ResourceManager(Game.resouceLoadCompleteCallback);
			Game.resouceManager.loadAssets();


			//Finding out the FPS
			stats = new Stats();
			stats.setMode( 2 );
			stats.domElement.style.display = 'none';
			document.body.appendChild( stats.domElement );			
		},
		getLocaleString : function(stringID){
			var splittedStringArr = stringID.split("=", 2);
			
			var localeID = splittedStringArr[0];
			var localizedString = splittedStringArr[1];
			
			var divElement = document.getElementById(localeID);
			if(divElement && divElement.innerHTML.length != 0){
				localizedString = divElement.innerHTML;
			}
			return localizedString;
		},
		startStat : function(){
			stats.begin();
		},
		endStat : function(){
			stats.end();
		},
		gotoNextLevel: function() {
			currentLevel++;
			if(currentLevel > 8)
				currentLevel = 1;
			switch(currentLevel) {
				case 1 : 
						var straightlineintro = new StraightLineIntro(Game);
						straightlineintro.setupCanvas();
						straightlineintro.create();
                        siteCatalyst.trackCustomLink('level-1');
						break;
				case 2 : 
						var straightlineTutorial = new StraightLineTutorial(Game);
						straightlineTutorial.setupCanvas();
						straightlineTutorial.create();
                        siteCatalyst.trackCustomLink('level-2');
						break;

				case 3 :
						var tunnelGameStraightLine = new TunnelGame(Game, "LEVEL002_BACKGROUND", "LEVEL002_TUNNEL");
						tunnelGameStraightLine.setupCanvas("Click to start");
						tunnelGameStraightLine.initialize();
						tunnelGameStraightLine.setupMouseHandlers();
                        siteCatalyst.trackCustomLink('level-3');
						break;
				case 4 :
						var straightlineChallenge = new StraightLineChallenge(Game, "LEVEL003_STRAIGHT");
						paper.settings.handleSize = 8;
						straightlineChallenge.setupCanvas();
						straightlineChallenge.initialize();
						straightlineChallenge.setupMouseHandlers();
                        siteCatalyst.trackCustomLink('level-4');
						break;						

				case 5 : 
						var curvelineTutorial = new CurveLineTutorial(Game);
						curvelineTutorial.setupCanvas();
						curvelineTutorial.create();
                        siteCatalyst.trackCustomLink('level-5');
						break;
				case 6 :
						var tunnelGameCurve = new TunnelGame(Game, "LEVEL005_BACKGROUND", "LEVEL005_TUNNEL");
						tunnelGameCurve.setupCanvas("Click and drag to start");
						tunnelGameCurve.initialize();
						tunnelGameCurve.setupMouseHandlers();
                        siteCatalyst.trackCustomLink('level-6');
						break;

				case 7 :
                        var straightlineChallenge = new StraightLineChallenge(Game, "LEVEL003_CURVES");
						paper.settings.handleSize = 8;
						straightlineChallenge.setupCanvas();
						straightlineChallenge.initialize();
						straightlineChallenge.setupMouseHandlers();
                        siteCatalyst.trackCustomLink('level-7');
						break;
				case 8 : 
						var endStage = new EndStage(Game);
						endStage.setupCanvas();
						endStage.create();
                        siteCatalyst.trackCustomLink('level-8');
						break;

			}
			paper.view.update();
		},

		//List all the assets and fire loading event.
		demoText: function() {

			debugLog("Demo Text");
			var textItem = new PointText({
				content: 'Game Loaded.',
				point: new Point(100, 200),
				fillColor: '#DDDDDD',
				fontSize: 70
			});
		


		}



	};

	window.addEventListener('load', Game.initialize);

})();
