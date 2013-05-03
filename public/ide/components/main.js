// Sample Text
Ext.define('Ext.tualo.ide.components.Main', {
	extend: 'Ext.container.Viewport',
	requires: [
		'Ext.panel.Panel',
		'Ext.tualo.ide.components.MessageBox'
	],
	layout: 'fit',
	constructor: function (config) {
		this.callParent([ config ]);
	},
	initComponent: function () {
		var scope =this;
		scope.files = [];
		
		scope.modelID = Ext.id();
		Ext.define(this.modelID, {
			extend: 'Ext.data.Model',
			fields: [{
				name: 'id',
				type: 'string'
			}, {
				name: 'mtime',
				type: 'date'
			}, {
				name: 'text',
				type: 'string'
			}, {
				name: 'fsize',
				type: 'number'
			}, {
				name: 'type',
				type: 'string'
			}]
		});
		
		var store = Ext.create('Ext.data.TreeStore', {
			model: this.modelID,
			proxy: {
				type: 'ajax',
				api: {
					read: '/tree'
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
								title: 'REMOTE EXCEPTION',
								msg: response.responseText,
								icon: Ext.MessageBox.ERROR,
								buttons: Ext.MessageBox.OK
							});
						}
						
					}
				}
			}
		});
		scope.xid = Ext.id();
		scope.treePanel = Ext.create('Ext.tree.Panel', {
			region: 'west',
			split: true,
			width: 300,
			store: store,
			rootVisible: true,
			viewConfig: {
				plugins: {
					ptype: 'treeviewdragdrop',
					dragGroup: 'folderItem',
					dropGroup: 'mailItem',
					enableDrag: false,
					enableDrop: true
				},
				listeners: {
					drop: function(node, data, dropRec, dropPosition) {
						var dropOn = dropRec ? ' ' + dropPosition + ' ' + dropRec.get('name') : ' on empty view';
						console.log('Drag from grid to tree', 'Dropped ' + data.records[0].get('name') + dropOn);
					},
					beforedrop: function(node, data, overModel, dropPosition, dropHandlers){
						dropHandlers.cancelDrop();
						// data.records[0].get('id')  << Message ID
						// overModel.get('id') << Folder ID
						var messageID = data.records[0].get('id');
						var dropOverBoxID = overModel.get('id');
						if (messageID.indexOf(dropOverBoxID)==0){
							return 0;
						}else{
						
						}
						console.log('Drag test from grid to tree', 'Dropped ' + data.records[0].get('id') + ' *** ' +  overModel.get('id'));
						console.log(arguments);
						return true;
					}
				}
			},
			columns : [
				{
					xtype : 'treecolumn',
					dataIndex : 'text',
					flex: 1,
					renderer : function(value,meta, record){
						value = value.replace(/^inbox$/i	 ,window.dictionary.get('tree.Inbox'));
						value = value.replace(/^trash$/i	 ,window.dictionary.get('tree.Trash'));
						value = value.replace(/^drafts$/i	 ,window.dictionary.get('tree.Drafts'));
						value = value.replace(/^junk$/i		,window.dictionary.get('tree.Junk'));
						//value = value.replace(/^sent\sitems$/i		,window.dictionary.get('tree.SentItems'));
						value = value.replace(/^sent$/i		,window.dictionary.get('tree.Sent'));
						return value;
					}
				}
			],
			root: {
				text: window.dictionary.get('tree.Title'),
				expanded: true,
				type: 'folder',
				id: ''
			},
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
				}
			}
		});
		
		scope.accountPanel = Ext.create('Ext.tualo.ide.components.MessageBox',{
			//title: scope.dictionary.get('sampleTitle'),
		})
		scope.cards = Ext.create('Ext.panel.Panel',{
			region: 'center',
			layout: 'card',
			items:[
				scope.accountPanel
			]
		});
		 
		scope.items = [
			scope.mainFrame = Ext.create('Ext.panel.Panel',{
				title: window.document.title,
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