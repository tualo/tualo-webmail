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
		
		scope.form = Ext.create('Ext.form.Panel',{
			title: 'Anmelden',
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
				fieldLabel: 'Benutzername',
				name: 'username',
				allowBlank: false
			},{
				fieldLabel: 'Passwort',
				name: 'password',
				inputType: 'password',
				allowBlank: false
			}],
			
			// Reset and Submit buttons
			buttons: [{
				text: 'Abbruch',
				handler: function() {
					this.up('form').getForm().reset();
				}
			}, {
				text: 'Anmelden',
				scope: scope,
				formBind: true, //only enabled once the form is valid
				handler: function() {
					var scope = this;
					var form = scope.form.getForm();
					if (form.isValid()) {
						form.submit({
							scope: scope,
							success: function(form, action) {
								var scope = this;
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
			}]
		});
		
		scope.items = [
			scope.form
		]
		scope.callParent(arguments);
	}
});