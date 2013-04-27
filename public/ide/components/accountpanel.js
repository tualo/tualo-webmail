// Sample Text
Ext.define('Ext.tualo.ide.components.AccountPanel', {
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
		scope.grid.getStore().load();
	},
	constructor: function (config) {
		var scope = this;
		scope.modelID = Ext.id();
		Ext.define(this.modelID, {
			extend: 'Ext.data.Model',
			fields: [{
				name: 'uid',
				type: 'number'
			}, {
				name: 'seqno',
				type: 'number'
			}, {
				name: 'date',
				type: 'date'
			}, {
				name: 'from',
				type: 'string'
			}, {
				name: 'to',
				type: 'number'
			}, {
				name: 'subject',
				type: 'string'
			}, {
				name: 'unseen',
				type: 'boolean'
			}]
		});
		
		var store = Ext.create('Ext.data.Store', {
			model: this.modelID,
			proxy: {
				type: 'ajax',
				api: {
					read: '/inbox'
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
			}
		});
		
		this.grid = Ext.create('Ext.grid.Panel', {
			//title: window.dictionary.get('grid.InboxTitle'),
			region: 'north',
			height: 300,
			split: true,
			store: store,
			columns: [
				{ 
					text: window.dictionary.get('grid.From'),  
					dataIndex: 'from', 
					flex: 1,
					renderer: function(value){
						if (value.indexOf('" ')>0){
							var parts = value.split('" ');
							return '<span class="grid-header-from-text">'+parts[0].replace('"','')+'</span>'+'&nbsp;<span class="grid-header-from-mail">'+( parts[1].replace("<","").replace(">","") ) +'</span>';
						}else{
							return value;
						}
					}
				},
				{ 
					text: window.dictionary.get('grid.Subject'), 
					dataIndex: 'subject', 
					flex: 1,
					renderer: function(value,meta,record){
						if (record.get('unseen')===true){
							return '<b>'+value+'</b>';
						}
						return value;
					}
				},
				{ 
					text: window.dictionary.get('grid.Date'), 
					dataIndex: 'date', 
					xtype: 'datecolumn', 
					format: window.dictionary.get('grid.DateFormat'),
					width: 160
				}
			],
			listeners:{
				scope: this,
				itemclick: function( grid, record, item, index, e, eOpts ){
					this.message.load(record.get('uid'));
				}
			}
		});
		
		this.message = Ext.create('Ext.tualo.ide.components.Message', {
			region: 'center'
		})
		
		this.items = [this.grid,this.message];
		
		this.callParent([ config ]);
	},
	initComponent: function () {
		this.callParent(arguments);
	}
})