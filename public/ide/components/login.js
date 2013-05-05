// Sample Text
Ext.define('Ext.tualo.ide.components.Main', {
	extend: 'Ext.container.Viewport',
	requires: [
		'Ext.panel.Panel',
		'Ext.tualo.ide.components.MessageBox',
		'Ext.tualo.ide.components.AccountTree'
	],
	layout: 'fit',
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
			bodyPadding: 15,
			defaults: {
					anchor: '100%'
			},
			defaultType: 'textfield',
			items: [{
				fieldLabel: 'Mandant',
				name: 'mandant',
				allowBlank: false
			},{
				fieldLabel: 'Benutzername',
				name: 'login',
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
				formBind: true, //only enabled once the form is valid
				handler: function() {
					var form = this.up('form').getForm();
					if (form.isValid()) {
						form.submit({
							success: function(form, action) {
								Ext.Msg.alert('Success', action.result.msg);
							},
							failure: function(form, action) {
								Ext.Msg.alert('Failed', action.result.msg);
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