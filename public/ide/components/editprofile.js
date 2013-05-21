Ext.define('Ext.tualo.ide.components.EditProfile', {
	extend: 'Ext.window.Window',
	requires: [
		'Ext.form.Panel'
	],
	load: function(id){
		var scope = this;
		scope.form.getForm().load({
			params: {
				username: id
			}
		})
	},
	constructor: function (config) {
		this.callParent([ config ]);
	},
	layout: 'fit',
	border: false,
	initComponent: function () {
		var scope = this;
		scope.xid = Ext.id();
		scope.form =  Ext.create('Ext.form.Panel',{
			bodyPadding: 15,
			border: false, // removes the *white stripe* artefact on neptune theme
			overflowY: 'auto',
			url: '/admin/profile',
			bbar: [
				{
					text: dictionary.get('admin.accounts.form.cancel'),
					scope: scope,
					handler: function(){
						scope.close();
					}
				},'->',
				{
					text: dictionary.get('admin.accounts.form.submit'),
					scope: scope,
					id: scope.xid+'-submit',
					handler: function(){
						// save the data
						var scope = this;
						if (scope.form.getForm().isValid()){
							scope.form.getForm().submit();
						}
					}
				}
			],
			items: [
				{
					xtype: 'label',
					text: dictionary.get('admin.accounts.form.text')
				},
				
				{
						xtype: 'fieldset',
						title: dictionary.get('admin.accounts.form.title'),
						defaults: {anchor: '100%'},
						items: [
							{
								xtype: 'textfield',
								value: '',
								disabled: false,
								allowBlank: false,
								id: scope.xid+'-username',
								name: 'username',
								fieldLabel: dictionary.get('admin.accounts.form.username')
							},
							{
								xtype: 'textfield',
								value: '',
								disabled: false,
								allowBlank: false,
								id: scope.xid+'-password',
								name: 'password',
								fieldLabel: dictionary.get('admin.accounts.form.password')
							},
							{
								xtype: 'textfield',
								value: '',
								disabled: false,
								allowBlank: false,
								id: scope.xid+'-passwordrep',
								scope: scope,
								validator: function(txt){
									var xid= this.id.replace('-passwordrep','');
									if(Ext.getCmp(xid+'-password').getValue()===txt){
										return true;
									}
									return dictionary.get('admin.accounts.form.passwordnotmatch')
								},
								name: 'passwordrep',
								fieldLabel: dictionary.get('admin.accounts.form.passwordrep')
							},
							{
								xtype: 'checkbox',
								value: '',
								disabled: false,
								allowBlank: false,
								id: scope.xid+'-isAdmin',
								name: 'isAdmin',
								fieldLabel: dictionary.get('admin.accounts.form.isadmin')
							}
						]
				}
			],
			listeners: {
				scope: scope,
				actioncomplete: function(form,action,eopts){
					var scope = this;
					if (action.type==='load'){
						if (action.result.data.password === '******'){
							Ext.getCmp(scope.xid+'-password').setDisabled(true);
							Ext.getCmp(scope.xid+'-passwordrep').setDisabled(true);
							Ext.getCmp(scope.xid+'-username').setDisabled(true);
							Ext.getCmp(scope.xid+'-isAdmin').setDisabled(true);
							Ext.getCmp(scope.xid+'-submit').setDisabled(true);
						}
					}
					if (action.type==='submit'){
						scope.fireEvent('submited');
						scope.close();
					}
				},
				actionfailed: function(form,action,eopts){
					var scope = this;
					Ext.MessageBox.show({
						title: 'REMOTE EXCEPTION',
						msg: action.result.msg,
						icon: Ext.MessageBox.ERROR,
						buttons: Ext.MessageBox.OK
					});
				}
			}
		});
		scope.items = [
			scope.form
		]
		scope.callParent(arguments);
	}
});