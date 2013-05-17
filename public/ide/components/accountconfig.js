// Sample Text
Ext.define('Ext.tualo.ide.components.AccountConfig', {
	extend: 'Ext.panel.Panel',
	requires: [
		'Ext.panel.Panel'
	],
	layout: {
		type: 'border',
		padding: 0
		
	},
	border: false,
	load: function(){
		//this.getStore().load();
		this.tree.getStore().load({
			node: this.tree.getRootNode()
		});
		
	},
	getAllFormElements: function(){
		var scope =this;
		var ids = [
			'imapServer',
			'imapPort',
			'imapAccount',
			'imapPassword',
			'smtpServer',
			'smtpPort',
			'smtpAccount',
			'smtpPassword',
			'title',
			'signature',
			'remotetitle'
		]
		var elms=[];
		for(var i in ids){
			elms.push(Ext.getCmp(scope.xid+'-'+ids[i]));
		}
		return elms;
	},
	initComponent: function () {
		var scope =this;
		
		scope.xid = Ext.id();
		scope.modelID = Ext.id();
		Ext.define(this.modelID, {
			extend: 'Ext.data.Model',
			fields: [
				'imapServer',
				'imapPort',
				'imapAccount',
				'imapPassword',
				'smtpServer',
				'smtpPort',
				'smtpAccount',
				'smtpPassword',
				'title',
				'text',
				'id',
				'signature',
				'remotetitle'
			]
		});
		scope.store = Ext.create('Ext.data.TreeStore', {
			model: scope.modelID,
			autoLoad: false,
			proxy: {
				type: 'ajax',
				api: {
					read: '/accounts' // session route
				},
				reader: {
					type: 'json',
					successProperty: 'success',
					root: 'data',
					messageProperty: 'msg',
					totalProperty  : 'total'
				},
				listeners: {
					scope: this,
					exception: function(proxy, response, operation){
						try{
							var o = Ext.JSON.decode(response.responseText);
							
							Ext.MessageBox.show({
								title: 'REMOTE EXCEPTION',
								msg: o.msg,
								icon: Ext.MessageBox.ERROR,
								buttons: Ext.MessageBox.OK
							});
							
						}catch(e){
							Ext.MessageBox.show({
								title: 'REMOTE EXCEPTION*',
								msg: response.responseText,
								icon: Ext.MessageBox.ERROR,
								buttons: Ext.MessageBox.OK
							});
						}
						
					}
				}
			}
		});
		
		scope.tree = Ext.create('Ext.tree.Panel',{
			region: 'west',
			store: scope.store,
			split: true,
			width: 250,
			title: dictionary.get('account.accounts.title'),
			rootVisible: false,
			tools: [
				{
					type: 'plus',
					scope: scope,
					handler: function(){
						var scope =this;
						var elems = scope.getAllFormElements();
						for (var i in elems){
							elems[i].setDisabled(false);
						}
					}
				},
				{
					type: 'minus',
					scope: scope,
					handler: function(){
						var scope =this;
					}
				},
				{
					type: 'refresh',
					scope: scope,
					handler: function(){
						var scope =this;
						scope.load();
					}
				}
			],
			listeners: {
				scope: scope,
				itemclick: function( tree, record, item, index, e, eOpts ){
					var scope =this;
					scope.config.getForm().setValues(record.getData());
				}
			}
		});
		
		scope.config = Ext.create('Ext.form.Panel',{
			region: 'center',
			split: true,
			width: 250,
			bodyPadding: 15,
			overflowY: 'auto',
			url: '/saveaccount',
			tbar:[
				{
					text: dictionary.get('account.save.title'),
					scope: scope,
					handler: function(){
						var scope = this;
						var form = scope.config.getForm();
						if (form.isValid()){
							form.submit();
						}else{
						
						}
					}
				}
			],
			items:[
				{
					xtype: 'fieldset',
					title: dictionary.get('account.imap.title'),
					defaults: {anchor: '100%'},
					items: [
						{
							xtype: 'textfield',
							value: '',
							disabled: true,
							allowBlank: false,
							id: scope.xid+'-imapServer',
							name: 'imapServer',
							fieldLabel: dictionary.get('account.imap.server.label')
						},
						{
							xtype: 'textfield',
							value: '',
							disabled: true,
							allowBlank: false,
							id: scope.xid+'-imapPort',
							name: 'imapPort',
							fieldLabel: dictionary.get('account.imap.port.label')
						},
						{
							xtype: 'textfield',
							value: '',
							disabled: true,
							allowBlank: false,
							id: scope.xid+'-imapAccount',
							name: 'imapAccount',
							fieldLabel: dictionary.get('account.imap.account.label')
						},
						{
							xtype: 'textfield',
							value: '',
							disabled: true,
							id: scope.xid+'-imapPassword',
							name: 'imapPassword',
							fieldLabel: dictionary.get('account.imap.password.label'),
							inputType: 'password'
						}
					]
				},
				{
					xtype: 'fieldset',
					title: dictionary.get('account.smtp.title'),
					defaults: {anchor: '100%'},
					items: [
						{
							xtype: 'textfield',
							value: '',
							disabled: true,
							id: scope.xid+'-smtpServer',
							name: 'smtpServer',
							allowBlank: false,
							fieldLabel: dictionary.get('account.smtp.server.label')
						},
						{
							xtype: 'textfield',
							value: '',
							disabled: true,
							id: scope.xid+'-smtpPort',
							name: 'smtpPort',
							allowBlank: false,
							fieldLabel: dictionary.get('account.smtp.port.label')
						},
						{
							xtype: 'textfield',
							value: '',
							disabled: true,
							id: scope.xid+'-smtpAccount',
							name: 'smtpAccount',
							fieldLabel: dictionary.get('account.smtp.account.label')
						},
						{
							xtype: 'textfield',
							value: '',
							disabled: true,
							id: scope.xid+'-smtpPassword',
							name: 'smtpPassword',
							fieldLabel: dictionary.get('account.smtp.password.label'),
							inputType: 'password'
						}
					]
				},
				{
					xtype: 'fieldset',
					title: dictionary.get('account.title'),
					defaults: {anchor: '100%'},
					items: [
						{ // helper field for finding the config on the server
							xtype: 'hidden',
							id: scope.xid+'-remotetitle',
							name: 'remotetitle'
						},
						{
							xtype: 'textfield',
							value: '',
							disabled: true,
							id: scope.xid+'-title',
							name: 'title',
							allowBlank: false,
							fieldLabel: dictionary.get('account.title.label')
						},
						{
							xtype: 'textarea',
							value: '',
							disabled: true,
							id: scope.xid+'-signature',
							name: 'signature',
							fieldLabel: dictionary.get('account.signature.label'),
							height: 200
						}
					]
				}
			]
		});
		
		scope.items = [
			scope.tree,
			scope.config
		]
		scope.store.load();
		scope.callParent(arguments);
		 
	}
});