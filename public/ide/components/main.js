// Sample Text
Ext.define('Ext.tualo.ide.components.Main', {
	extend: 'Ext.container.Viewport',
	requires: [
		'Ext.panel.Panel',
		'Ext.tualo.ide.components.MessageBox',
		'Ext.tualo.ide.components.AccountTree',
		'Ext.tualo.ide.components.AccountConfig',
		'Ext.tualo.ide.components.AccountProfile'
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
					scope.cards.getLayout().setActiveItem(scope.accountPanel); // show mailbox panel 
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
					 
				},
				itemcontextmenu: function( tPanel, record, item, index, e, eOpts ){
					//var p= e.getXY();
					//scope.menu.showAt(p);
					e.preventDefault();
					e.stopEvent();
					return false;
				},
				maildropped: function(index,message,mailbox){
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
		});
		scope.accountConfigPanel = Ext.create('Ext.tualo.ide.components.AccountConfig',{
		});
		scope.accountProfile = Ext.create('Ext.tualo.ide.components.AccountProfile',{
		});
		// those card can be used to show content right of the tree
		// mailbox or calendar
		scope.cards = Ext.create('Ext.panel.Panel',{
			region: 'center',
			layout: 'card',
			items:[
				scope.accountPanel,
				scope.accountProfile,
				scope.accountConfigPanel
			]
		});
		
		
		scope.loginPanel = Ext.create('Ext.tualo.ide.components.Login',{
			//title: scope.dictionary.get('sampleTitle'),
			listeners: {
				scope: scope,
				loggedin: function(){
					var scope = this;
					isAdmin = scope.loginPanel.result.isAdmin; // override the window variable, see layout.jade
					loggedIn = scope.loginPanel.result.loggedIn; // override the window variable, see layout.jade
					scope.getLayout().setActiveItem(scope.mainFrame);
					Ext.defer(function(){
						var scope = this;
						scope.treePanel.load();
					},100,scope);
				}
			}
		});
		
		//scope.activeItem = 0;
		
		scope.items = [
			scope.loginPanel,
			scope.mainFrame = Ext.create('Ext.panel.Panel',{
				title: window.document.title,
				tools: [
					{
						type: 'gear',
						tooltip: dictionary.get('tools.settings.tooltip'),
						scope: this,
						handler: function(){
							var scope = this;
							scope.cards.getLayout().setActiveItem(scope.accountConfigPanel);
						}
					},
					{
						type: 'user',
						tooltip: dictionary.get('tools.user.tooltip'),
						scope: this,
						handler: function(){
							var scope = this;
							scope.cards.getLayout().setActiveItem(scope.accountProfile);
						}
					},
					{
						type: 'logout',
						tooltip: dictionary.get('tools.logout.tooltip'),
						scope: this,
						handler: function(){
							window.location.href='/?logout=1';
						}
					}
				],
				layout: {
					type: 'border',
					padding: 5
				},
				items: [scope.treePanel,scope.cards]
			})
		]
		scope.callParent(arguments);
		if (loggedIn===true){
			scope.getLayout().setActiveItem(scope.mainFrame);
		}

	}
});