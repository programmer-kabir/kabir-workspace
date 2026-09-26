



var ResourceManager = function( onLoadCompleteCallback ) {
	this.svgAssetsArray = {
		LEVEL001_BACKGROUND 	: 'assets/svg/intro_master.svg',
		LEVEL001_01_BACKGROUND 	: 'assets/svg/pt-straight-line-learn.svg',
		LEVEL002_TUNNEL 		: 'assets/svg/level002_tunnel_dev.svg',
		SPACESHIP 				: 'assets/svg/spaceship.svg',
		LEVEL003_BACKGROUND 	: 'assets/svg/background_level003.svg',
		SCORE_MESSAGEBOX		: 'assets/svg/scoreMessageBox003.svg',
		LEVEL005_TUNNEL 		: 'assets/svg/level005_tunnel_dev.svg',
		CURVE_TUTORIAL			: 'assets/svg/pt-curve-line-learn.svg',
        LEVEL003_STRAIGHT	    : 'assets/svg/straight_challenge.svg',
        LEVEL003_CURVES 	    : 'assets/svg/curvy_challenge.svg',		
        LEVEL008_ENDSTAGE 	    : 'assets/svg/pt-game-ending.svg'		
	};

	this.audioAssetsArray = {
		BACKGROUND_LOOP			: 'assets/audio/gamebackground',
		CLICKSOUND1				: 'assets/audio/createnode1',
		CLICKSOUND2				: 'assets/audio/createnode2',
		CLICKSOUND3				: 'assets/audio/createnode3',
		CLICKSOUND4				: 'assets/audio/createnode4',
		DRAG					: 'assets/audio/drag',
	};

	this.svgItemsList = {};

	this.audioItemsList = {};

	this.imageAssetList = {
		DEMO_PNG_ASSET : 'assets/png/bg.png'
	};

	this.totalLoaded = 0;
	this.totalAudioLoaded = 0;
	this.loadCompleteCallback = onLoadCompleteCallback;
};


ResourceManager.prototype.getSVGItem = function( svgID ) {
	if( this.totalLoaded != this.totalSVGItems)
		return null;
	else
		return this.svgItemsList[svgID];

};

ResourceManager.prototype.getAudioItem = function( audioID ) {
	if( this.totalAudioLoaded != this.totalAudioItems)
		return null;
	else
		return this.audioItemsList[audioID];

};

ResourceManager.prototype.loadSVGAssets = function() {
	this.totalSVGItems = Object.keys(this.svgAssetsArray).length;
	for( var svgItem in this.svgAssetsArray )
	{
		self = this;
		key = svgItem;
		url = this.svgAssetsArray[svgItem];
		
		project.importSVG(url, (function(key){
			return function(item){
				self.totalLoaded++;
				self.svgItemsList[key] = item;
				item.visible = false;
				debugLog( key );
				if( self.totalLoaded == self.totalSVGItems ){
					self.loadAudioAssets();
				}
			};
		})(key) );
	}
};


ResourceManager.prototype.loadAudioAssets = function() {
	this.totalAudioItems = Object.keys(this.audioAssetsArray).length;
	buzz.defaults.preload = 'auto';
	buzz.defaults.formats = ['mp3'];	

	for( var audioItem in this.audioAssetsArray )
	{
		self = this;
		key = audioItem;
		url = this.audioAssetsArray[audioItem];
		var audio = new buzz.sound(url);
		this.audioItemsList[key] = audio;		
		audio.bindOnce('canplay', function(event){
			self.totalAudioLoaded++;
			if(self.totalAudioLoaded >= self.totalAudioItems){
				self.loadCompleteCallback.call(self);
			}				
		});
	}
};


ResourceManager.prototype.loadAssets = function(){
	this.loadSVGAssets();
	this.totalImageItems = Object.keys(this.imageAssetList).length;
	this.totalAudioItems = Object.keys(this.audioAssetsArray).length;
};
