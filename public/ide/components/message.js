// Sample Text
Ext.define('Ext.tualo.ide.components.Message', {
	extend: 'Ext.panel.Panel',
	requires: [
		'Ext.panel.Panel'
	],
	layout: {
		type: 'border',
		padding: 5
		
	},
	load: function(id){
		var scope = this;
		console.log(id);
		Ext.Ajax.request({
			url: '/read',
			params: {
				uid: id
			},
			success: function(response){
				var text = response.responseText;
				// process server response here
				var resObject = Ext.JSON.decode(text);
				console.log(resObject);
				window.document.getElementById('message-'+this.xid).innerHTML = resObject.mail.text.replace(/\n/g,'<br />');
			}
		});
	},
	constructor: function (config) {
		
		
		this.callParent([ config ]);
	},
	initComponent: function () {
		
		this.messageHeader=Ext.create('Ext.panel.Panel',{
			html: 'header',
			region: 'north'
		});
		this.messageBody=Ext.create('Ext.panel.Panel',{
			html: '<div id="message-'+this.xid+'" style="width:100%;height:100%;overflow:auto;padding: 12px;"></div>',
			region: 'center'
		});
		this.items = [this.messageHeader,this.messageBody];
		
		this.callParent(arguments);
	}
})