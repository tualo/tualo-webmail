// Sample Text
Ext.define('Ext.tualo.ide.components.Message', {
	extend: 'Ext.panel.Panel',
	requires: [
		'Ext.panel.Panel'
	],
	layout: {
		type: 'border',
		padding: 0
		
	},
	border: false,
	load: function(id){
		var scope = this;
		console.log('read ID:'+id);
		scope.mask.show();
		Ext.Ajax.request({
			url: '/read',
			scope: scope,
			params: {
				id: id
			},
			success: function(response){
				var scope = this;
				scope.mask.hide();
				var text = response.responseText;
				// process server response here
				var resObject = Ext.JSON.decode(text);
				console.log(resObject);
				var headHTML = "";
				
				var minHeight = 0;
				if (typeof resObject.data.attachments!=='undefined'){
					var attachmentHTML = '';
					for(var i in resObject.data.attachments){
						attachmentHTML += '<a href="#"><i class="icon-paper-clip"></i> &nbsp; '+resObject.data.attachments[i].fileName+'</a><br/>';
					}
					headHTML += '<div class="message-header-attachments">'+attachmentHTML+'</div>';
					minHeight = Math.max(minHeight,(resObject.data.attachments.length)*15 + 15);
				}
				
				var mainLineCounter = 0;
				headHTML += '<span class="message-header-label">'+window.dictionary.get('message.From')+'</span>&nbsp;<span class="grid-header-from-text">'+resObject.data.from[0].name+'</span>&nbsp;<span class="grid-header-from-mail">'+resObject.data.from[0].address+'</span>';
				headHTML += '<br/>';
				mainLineCounter++;
				headHTML += '<span class="message-header-label">'+window.dictionary.get('message.Subject')+'</span>&nbsp;<span class="grid-header-from-subject">'+resObject.data.subject+'</span>';
				mainLineCounter++;
				
				minHeight = Math.max(minHeight,mainLineCounter*15);
				
				window.document.getElementById('message-'+this.xid).innerHTML = '';
				if (typeof resObject.data.text!='undefined'){
					window.document.getElementById('message-'+this.xid).innerHTML = resObject.data.text.replace(/\n/g,'<br />');
				}else if (typeof resObject.data.html!='undefined'){
					//ToDo remove scripts!!!!
					window.document.getElementById('message-'+this.xid).innerHTML = resObject.data.html;
				}
				window.document.getElementById('header-'+this.xid).innerHTML = headHTML;
				scope.messageHeader.setHeight(minHeight + 15);
			}
		});
	},
	constructor: function (config) {
		
		
		this.callParent([ config ]);
	},
	initComponent: function () {
		
		this.messageHeader=Ext.create('Ext.panel.Panel',{
			html: '<div id="header-'+this.xid+'" style="width:100%;height:100%;padding: 12px;"></div>',
			height: 60,
			region: 'north'
		});
		this.messageBody=Ext.create('Ext.panel.Panel',{
			html: '<div id="message-'+this.xid+'" style="width:100%;height:100%;overflow:auto;padding: 12px;"></div>',
			region: 'center'
		});
		this.items = [this.messageHeader,this.messageBody];
		
		this.callParent(arguments);
		this.mask = new Ext.LoadMask(this, {msg: window.dictionary.get('loader.PleaseWait') });

	}
})