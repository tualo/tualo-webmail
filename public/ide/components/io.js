Ext.define('Ext.tualo.ide.components.IO', {
	extend: 'Ext.util.Observable',
	constructor: function (config) {
		this.projectID = config.projectID;
		this.projectTitle = config.projectTitle;
		this.callParent([ config ]);
	},
	open: function(fileName){
		Ext.Ajax.request({
			url: '/'+this.projectID+'/file/open',
			scope: this,
			params: {
					file: fileName
			},
			success: function(response){
				try{
					var text = response.responseText;
					console.log(this);
					this.fireEvent('fileopened',Ext.JSON.decode(text));
					console.log('fileopened');
				}catch(error){
					console.log(error);
				}
			}
		})
	},
	stat: function(fileName){
		Ext.Ajax.request({
			url: '/'+this.projectID+'/file/stat',
			scope: this,
			params: {
					file: fileName
			},
			success: function(response){
				try{
					var text = response.responseText;
					this.fireEvent('filestat',Ext.JSON.decode(text));
				}catch(error){
					console.log(error);
				}
			}
		})
	},
	add: function(fileName){
		Ext.Ajax.request({
			url: '/'+this.projectID+'/file/add',
			scope: this,
			params: {
					file: fileName
			},
			success: function(response){
				try{
					var text = response.responseText;
					this.fireEvent('fileadded',Ext.JSON.decode(text));
				}catch(error){
					console.log(error);
				}
			}
		})
	},
	del: function(fileName){
		Ext.Ajax.request({
			url: '/'+this.projectID+'/file/del',
			scope: this,
			params: {
					file: fileName
			},
			success: function(response){
				try{
					var text = response.responseText;
					this.fireEvent('filedeleted',Ext.JSON.decode(text));
				}catch(error){
					console.log(error);
				}
			}
		})
	},
	addFolder: function(folderName){
		Ext.Ajax.request({
			url: '/'+this.projectID+'/file/addFolder',
			scope: this,
			params: {
					folder: folderName
			},
			success: function(response){
				try{
					var text = response.responseText;
					this.fireEvent('folderadded',Ext.JSON.decode(text));
				}catch(error){
					console.log(error);
				}
			}
		})
	},
	delFolder: function(folderName){
		Ext.Ajax.request({
			url: '/'+this.projectID+'/file/delFolder',
			scope: this,
			params: {
					folder: folderName
			},
			success: function(response){
				try{
					var text = response.responseText;
					this.fireEvent('folderdeleted',Ext.JSON.decode(text));
				}catch(error){
					console.log(error);
				}
			}
		})
	},
	save: function(fileName,content){
		Ext.Ajax.request({
			url: '/'+this.projectID+'/file/save',
			scope: this,
			params: {
				file: fileName,
				content: content
			},
			success: function(response){
				try{
					var text = response.responseText;
					this.fireEvent('filesaved',Ext.JSON.decode(text));
				}catch(error){
					console.log(error);
				}
			}
		})
	},
	checkSyntax: function(fileName,content){
		Ext.Ajax.request({
			url: '/'+this.projectID+'/syntax/check',
			scope: this,
			params: {
				file: fileName,
				content: content
			},
			success: function(response){
				try{
					var text = response.responseText;
					this.fireEvent('syntaxChecked',Ext.JSON.decode(text));
				}catch(error){
					console.log(error);
				}
			}
		})
	}
});