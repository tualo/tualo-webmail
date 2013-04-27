Ext.define('Ext.tualo.ide.language.Dictionary', {
	extend: 'Ext.util.Observable',
	constructor: function (config) {
		this.loadLanguage = config.language;
		if (typeof this.loadLanguage!=='undefined'){
			this.loadLanguage = this.loadLanguage.replace(/[^a-z]/,''); // only letters are allowed, protect from loading different fiels
		}
		this.dict = {};
		this.callParent([ config ]);
		Ext.Ajax.request({
			url: '/ide/language/en.json',
			scope: this,
			success: function(response){
				try{
					 
					this.dict = Ext.JSON.decode(response.responseText);
					 
				}catch(error){
					console.log(error);
				} 
				this.load();
			},
			failure: function(){
				this.load();
			}
		});
	},
	load: function(){
		if (typeof this.loadLanguage!=='undefined'){
			Ext.Ajax.request({
				url: '/ide/language/'+this.loadLanguage+'.json',
				scope: this,
				success: function(response){
					try{
						this.dict = Ext.Object.merge(this.dict, Ext.JSON.decode(response.responseText));
					}catch(error){
					} 
					this.loaded();
				},
				failure: function(){
					this.loaded();
				}
			});
		}else{
			this.loaded();
		}
	},
	loaded: function(){
		Ext.Loader.loadScript({
			scope: this,
			url: window.location.origin + '/extjs/locale/ext-lang-' +this.loadLanguage+'.js',
			onLoad: function(){
				this.fireEvent('loaded',this);
			},
			onError: function(){
				this.fireEvent('loaded',this);
			}
		});
	},
	get: function(){
		if (arguments.length==0){
			return this.dict;
		}else{
			if (typeof this.dict[arguments[0]]!=='undefined'){
				var str = this.dict[arguments[0]];
				for(var i=1;i<arguments.length; i++){
					str = str.replace('{'+i+'}',arguments[i]);
				}
				return str;
			}else{
				return arguments[0];
			}
		}
	}
});