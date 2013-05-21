// Sample Text
Ext.define('Ext.tualo.ide.components.Login', {
	extend: 'Ext.panel.Panel',
	requires: [
		'Ext.form.Panel'
	],
	layout: {
		type: 'vbox',
		align: 'center',
		pack: 'center'
	},
	constructor: function (config) {
		this.callParent([ config ]);
	},
	initComponent: function () {
		var scope =this;
		
		scope.sessionID = "";
		scope.xid = Ext.id();
		
		scope.form = Ext.create('Ext.form.Panel',{
			title: dictionary.get('login.form.title'),
			width: 400,
			height: 200,
			layout: 'anchor',
			url: '/login',
			bodyPadding: 15,
			defaults: {
					anchor: '100%'
			},
			defaultType: 'textfield',
			items: [{
				fieldLabel: dictionary.get('login.form.username'),
				id: scope.xid+'-username',
				name: 'username',
				allowBlank: false,
				enableKeyEvents: true,
				listeners: {
					scope: scope,
					keydown: function(fld,e,eopts){
						var scope = this;
						if(e.getKey()===13){
							Ext.getCmp(scope.xid+'-password').focus();
							return false;
						}
					}
				}
			},{
				fieldLabel: dictionary.get('login.form.password'),
				name: 'password',
				id: scope.xid+'-password',
				inputType: 'password',
				allowBlank: false,
				enableKeyEvents: true,
				listeners: {
					scope: scope,
					keydown: function(fld,e,eopts){
						var scope = this;
						if(e.getKey()===13){
							scope.submit();
							return false;
						}
					}
				}
			}],
			
			// Reset and Submit buttons
			buttons: [{
				text: dictionary.get('login.form.cancel'),
				handler: function() {
					this.up('form').getForm().reset();
				}
			}, {
				text: dictionary.get('login.form.submit'),
				scope: scope,
				formBind: true, //only enabled once the form is valid
				handler: function() {
					var scope = this;
					scope.submit();
				}
			}]
		});
		
		scope.items = [
			scope.form
		]
		scope.callParent(arguments);
	},
	submit: function(){
		var scope = this;
		var form = scope.form.getForm();
		if (form.isValid()) {
			form.submit({
				scope: scope,
				success: function(form, action) {
					var scope = this;
					scope.result = action.result;
					scope.fireEvent('loggedin');
					//scope.up().getLayout().setActiveItem(1);  // switch to main view
					//Ext.Msg.alert('Success', action.result.msg);
				},
				failure: function(form, action) {
					Ext.MessageBox.alert('Failed', action.result.msg);
				}
			});
		}
	}
});