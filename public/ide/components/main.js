// Sample Text
Ext.define('Ext.tualo.ide.components.Main', {
	extend: 'Ext.container.Viewport',
	requires: [
		'Ext.panel.Panel',
		'Ext.tualo.ide.components.MessageBox',
		'Ext.tualo.ide.components.AccountTree'
	],
	layout: 'card',
	constructor: function (config) {
		this.callParent([ config ]);
	},
	initComponent: function () {
		var scope =this;
		
		scope.xid = Ext.id();
		scope.treePanel = Ext.create('Ext.tualo.ide.components.AccountTree', {
			region: 'west',
			split: true,
			width: 300,
			listeners: {
				scope: scope,
				itemclick: function( scope, record, item, index, e, eOpts ){
					
					var scope = this;
					if (record.get('id')!==''){
						if (record.get('id').indexOf('-boxes-')>-1){
							scope.accountPanel.load(record.get('id'));
							var path = record.getPath('text',' &gt; ');
							scope.mainFrame.setTitle( window.document.title + ' '+path);
							//scope.accountPanel.setTitle(record.get('text'));
						}
					}
				},
				itemdblclick: function( scope, record, item, index, e, eOpts ){
					/*
					if (record.get('id')!==''){
						window.open(window.location.href+record.get('id'),'_blank',
						[
							'location=no',
							'menubar=no',
							'status=no',
							'toolbar=no',
							'titlebar=no'
						].join(','));
					}
					*/
				},
				itemcontextmenu: function( tPanel, record, item, index, e, eOpts ){
					//var p= e.getXY();
					//scope.menu.showAt(p);
					e.preventDefault();
					e.stopEvent();
					return false;
				},
				maildropped: function(index,message,mailbox){
					//console.log(message);
					//console.log(mailbox);
					// messageId
					var scope = this;
					Ext.Ajax.request({
						url: '/move',
						scope: scope,
						params: {
							messageId: message,
							boxId: mailbox
						},
						success: function(response){
							var scope = this;
							//scope.mask.hide();
							try{
							var text = response.responseText;
							// process server response here
							var resObject = Ext.JSON.decode(text);
							if (resObject.success===true){
								scope.accountPanel.load(); // reload the grid after successfully moving the message
							}else{
								Ext.MessageBox.show({
									title: 'REMOTE EXCEPTION',
									msg: resObject.msg,
									icon: Ext.MessageBox.ERROR,
									buttons: Ext.MessageBox.OK
								});
							}
							}catch(e){
								Ext.MessageBox.show({
									title: 'REMOTE EXCEPTION',
									msg: response.responseText,
									icon: Ext.MessageBox.ERROR,
									buttons: Ext.MessageBox.OK
								});
							}
						}
					});
				}
			}
		});
		
		scope.accountPanel = Ext.create('Ext.tualo.ide.components.MessageBox',{
			//title: scope.dictionary.get('sampleTitle'),
		});
		
		// those card can be used to show content right of the tree
		// mailbox or calendar
		scope.cards = Ext.create('Ext.panel.Panel',{
			region: 'center',
			layout: 'card',
			items:[
				scope.accountPanel
			]
		});
		
		
		scope.loginPanel = Ext.create('Ext.tualo.ide.components.Login',{
			//title: scope.dictionary.get('sampleTitle'),
			listeners: {
				scope: scope,
				loggedin: function(){
					var scope = this;
					scope.getLayout().setActiveItem(scope.mainFrame);
				}
			}
		});
		
		//scope.activeItem = 0;
		
		scope.items = [
			scope.loginPanel,
			scope.mainFrame = Ext.create('Ext.panel.Panel',{
				title: window.document.title,
				tools: [{
					type: 'logout',
					handler: function(){
						// show help here   icon-signout
					}
				}],
				layout: {
					type: 'border',
					padding: 5
				},
				items: [scope.treePanel,scope.cards]
			})
		]
		scope.callParent(arguments);
	}
});