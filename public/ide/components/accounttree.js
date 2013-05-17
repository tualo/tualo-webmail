// Sample Text
Ext.define('Ext.tualo.ide.components.AccountTree', {
	extend: 'Ext.tree.Panel',
	requires: [
		'Ext.panel.Panel'
	],
	layout: {
		type: 'border',
		padding: 0
		
	},
	border: false,
	load: function(){
		this.getStore().load(this.getRootNode());
	},
	initComponent: function () {
		var scope =this;
		
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
		scope.rootVisible = true;
		scope.store = Ext.create('Ext.data.TreeStore', {
			model: this.modelID,
			autoLoad: false,
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
		scope.xid = Ext.id();
		scope.viewConfig = {
			plugins: {
				ptype: 'treeviewdragdrop',
				dragGroup: 'folderItem',
				dropGroup: 'mailItem',
				enableDrag: false,
				enableDrop: true
			},
			listeners: {
				scope: scope,
				drop: function(node, data, dropRec, dropPosition) {
					var dropOn = dropRec ? ' ' + dropPosition + ' ' + dropRec.get('name') : ' on empty view';
					console.log('Drag from grid to tree', 'Dropped ' + data.records[0].get('name') + dropOn);
				},
				beforedrop: function(node, data, overModel, dropPosition, dropHandlers){
					var scope = this;
					
					dropHandlers.cancelDrop();
					// data.records[0].get('id')  << Message ID
					// overModel.get('id') << Folder ID
					var messageID = data.records[0].get('id');
					var dropOverBoxID = overModel.get('id');
					if (messageID.indexOf(dropOverBoxID)==0){
						return 0;
					}else{
						scope.fireEvent('maildropped',scope,data.records[0].get('id'),overModel.get('id'));
					}
					//console.log('Drag test from grid to tree', 'Dropped ' +  + ' *** ' +  overModel.get('id'));
					//console.log(arguments);
					return true;
				}
			}
		}
		scope.columns = [
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
		];
		
		scope.root= {
			text: window.dictionary.get('tree.Title'),
			expanded: true,
			type: 'folder',
			id: ''
		}
		
		scope.callParent(arguments);
	}
});