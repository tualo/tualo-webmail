Ext.define('Ext.tualo.ide.components.AccountProfile', {
	extend: 'Ext.panel.Panel',
	requires: [
		'Ext.form.Panel',
		'Ext.tualo.ide.components.EditProfile'
	],
	layout: 'card',
	getAllFormElements: function(){
		var scope =this;
		var ids = [
			'oldpassword',
			'newpassword',
			'newpasswordrep'
		]
		var elms=[];
		for(var i in ids){
			elms.push(Ext.getCmp(scope.xid+'-'+ids[i]));
		}
		return elms;
	},
	initComponent: function () {
		var scope = this;
		scope.form = Ext.create('Ext.form.Panel',{
			bodyPadding: 15,
			items: [
				{
					xtype: 'fieldset',
					title: dictionary.get('account.profile.title'),
					defaults: {anchor: '100%'},
					items: [
						{
							xtype: 'textfield',
							value: '',
							disabled: true,
							allowBlank: false,
							id: scope.xid+'-oldpassword',
							name: 'oldpassword',
							inputType: 'password',
							fieldLabel: dictionary.get('account.oldpassword.label')
						},
						{
							xtype: 'textfield',
							value: '',
							disabled: true,
							allowBlank: false,
							id: scope.xid+'-newpassword',
							name: 'newpassword',
							inputType: 'password',
							fieldLabel: dictionary.get('account.newpassword.label')
						},
						{
							xtype: 'textfield',
							value: '',
							disabled: true,
							allowBlank: false,
							id: scope.xid+'-newpasswordrep',
							name: 'newpasswordrep',
							inputType: 'password',
							fieldLabel: dictionary.get('account.newpasswordrep.label')
						}
					]
				}
			]
		}); 
		
		
		scope.modelID = Ext.id();
		Ext.define(this.modelID, {
			extend: 'Ext.data.Model',
			fields: [{
				name: 'id',
				type: 'string'
			}, {
				name: 'isAdmin',
				type: 'boolean'
			}]
		});
		
		var store = Ext.create('Ext.data.Store', {
			model: this.modelID,
			proxy: {
				type: 'ajax',
				api: {
					read: '/admin/accounts'
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
								title: window.dictionary.get('grid.RemoteException'),
								msg: o.msg,
								icon: Ext.MessageBox.ERROR,
								buttons: Ext.MessageBox.OK
							});
						}catch(e){
							Ext.MessageBox.show({
								title: window.dictionary.get('grid.RemoteException'),
								msg: response.responseText,
								icon: Ext.MessageBox.ERROR,
								buttons: Ext.MessageBox.OK
							});
						}
						
					}
				}
			},
			listeners: {
				scope: scope,
				beforeload: function(store,options,eOpt){
					var scope = this;
					/*
					if (scope._treeID === 'undefined') return false;
					if (typeof options==='undefined'){ options = {}; }
					if (typeof options.params==='undefined'){ options.params = {}; }
					options.params.node = scope._treeID;
					*/
					return true;
				}
			}
		});
		
		scope.grid = Ext.create('Ext.grid.Panel', {
			title: window.dictionary.get('admin.accounts.title'),
			store: store,
			columns: [
				{ 
					text: window.dictionary.get('admin.accounts.id'),  
					dataIndex: 'id', 
					flex: 1,
					renderer: function(value,meta,record,row,col,store){
						return value;
					}
				},
				{ 
					text: window.dictionary.get('admin.accounts.isAdmin'),  
					dataIndex: 'isAdmin', 
					flex: 1,
					renderer: function(value,meta,record,row,col,store){
						return value;
					}
				}
			],
			listeners:{
				scope: this,
				itemdblclick: function( grid, record, item, index, e, eOpts ){
					var scope=this;
					var id = record.get('id');
					var wnd = Ext.create('Ext.tualo.ide.components.EditProfile',{
						title: dictionary.get('admin.accounts.edit.title'),
						width: scope.getWidth()*0.8,
						height: scope.getHeight()*0.8,
						modal: true,
						listeners: {
							scope: scope,
							submited: function(){
								var scope=this;
								scope.grid.getStore().load();
							}
						}
					});
					wnd.show();
					wnd.load(id);
				}
			},
			tools:[ 
				{
					type: 'plus',
					tooltip:  dictionary.get('admin.accounts.new.tooltip'),
					scope: scope,
					handler: function(){
						var scope =  this;
						var wnd = Ext.create('Ext.tualo.ide.components.EditProfile',{
							title: dictionary.get('admin.accounts.edit.title'),
							width: scope.getWidth()*0.8,
							height: scope.getHeight()*0.8,
							modal: true,
							listeners: {
								scope: scope,
								submited: function(){
									var scope=this;
									scope.grid.getStore().load();
								}
							}
						});
						wnd.show();
						wnd.load();
					}
				}
			]
		});
		
		scope.items=[
			scope.grid,
			scope.form
		]
		scope.callParent(arguments);
		store.load();
	}
});