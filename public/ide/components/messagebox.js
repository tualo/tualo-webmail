// Sample Text
Ext.define('Ext.tualo.ide.components.MessageBox', {
	extend: 'Ext.panel.Panel',
	requires: [
		'Ext.panel.Panel'
	],
	layout: {
		type: 'border',
		padding: 0
		
	},
	border: false,
	/**
	* Loads a mailbox into the grid by the given mailbox id. If no id is set, 
	* the last id will be used to reload the grid.
	*
	* @params {string} id optional, mailbox id to be displayed
	*/
	load: function(id){
		var scope = this;
		if (typeof id!=='undefined'){
			scope._treeID = id;
		}
		//console.log('MessageBox ID:'+id);
		scope.grid.getStore().load();
		scope.grid.show();
	},
	constructor: function (config) {
		var scope = this;
		scope.modelID = Ext.id();
		Ext.define(this.modelID, {
			extend: 'Ext.data.Model',
			fields: [{
				name: 'id',
				type: 'string'
			}, {
				name: 'date',
				type: 'date'
			}, {
				name: 'fromName',
				type: 'string'
			}, {
				name: 'from',
				type: 'string'
			}, {
				name: 'to',
				type: 'string'
			}, {
				name: 'subject',
				type: 'string'
			}, {
				name: 'seen',
				type: 'boolean'
			}, {
				name: 'answered',
				type: 'boolean'
			}, {
				name: 'forwarded',
				type: 'boolean'
			}, {
				name: 'attachment',
				type: 'boolean'
			}, {
				name: 'size',
				type: 'int'
			}]
		});
		
		var store = Ext.create('Ext.data.Store', {
			model: this.modelID,
			proxy: {
				type: 'ajax',
				api: {
					read: '/list'
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
					if (scope._treeID === 'undefined') return false;
					if (typeof options==='undefined'){ options = {}; }
					if (typeof options.params==='undefined'){ options.params = {}; }
					options.params.node = scope._treeID;
					return true;
				}
			}
		});
		
		this.grid = Ext.create('Ext.grid.Panel', {
			//title: window.dictionary.get('grid.InboxTitle'),
			region: 'north',
			flex: 1,
			hidden: true,
			split: true,
			store: store,
			viewConfig: {
				plugins: {
					ptype: 'gridviewdragdrop',
					dragGroup: 'mailItem',
					dropGroup: 'mailItem'
				},
				listeners: {
					drop: function(node, data, dropRec, dropPosition) {
						var dropOn = dropRec ? ' ' + dropPosition + ' ' + dropRec.get('name') : ' on empty view';
						console.log('Drag from grid', 'Dropped ' + data.records[0].get('name') + dropOn);
					}
				}
			},
			columns: [
				{ 
					text: window.dictionary.get('grid.IconColumn'),  
					dataIndex: 'attachment', 
					width: 20,
					renderer: function(value,meta,record,row,col,store){
						if(value===true){
							value ='<i class="icon-paper-clip"></i>';
						}else{
							value = '';
						}
						return value;
					}
				},
				{ 
					text: window.dictionary.get('grid.IconColumn'),  
					dataIndex: 'forwarded', 
					width: 20,
					renderer: function(value,meta,record,row,col,store){
						if(value===true){
							value ='<i class="icon-forward"></i>';
						}else{
							value = '';
						}
						return value;
					}
				},
				{ 
					text: window.dictionary.get('grid.IconColumn'),  
					dataIndex: 'answered', 
					width: 20,
					renderer: function(value,meta,record,row,col,store){
						if(value===true){
							value ='<i class="icon-play"></i>';
						}else{
							value = '';
						}
						return value;
					}
				},
				{ 
					text: window.dictionary.get('grid.From'),  
					dataIndex: 'fromName', 
					flex: 1,
					renderer: function(value,meta,record,row,col,store){
						if (value==''){
							value = record.get('from');
						}
						if(record.get('seen')!==true){
							value = '<b>'+value+'</b>';
						}
						return value;
					}
				},
				{ 
					text: window.dictionary.get('grid.Subject'), 
					dataIndex: 'subject', 
					flex: 1,
					renderer: function(value,meta,record,row,col,store){
						if(record.get('seen')!==true){
							value = '<b>'+value+'</b>';
						}
						return value;
					}
				},
				{ 
					text: window.dictionary.get('grid.Date'), 
					dataIndex: 'date', 
					xtype: 'datecolumn', 
					//format: window.dictionary.get('grid.DateFormat'),
					width: 160,
					renderer: function(value,meta,record,row,col,store){
						
						value = Ext.util.Format.date(value,window.dictionary.get('grid.DateFormat'));
						if(record.get('seen')!==true){
							value = '<b>'+value+'</b>';
						}
						return value;
					}
				},
				{ 
					text: window.dictionary.get('grid.Size'), 
					dataIndex: 'size', 
					xtype: 'numbercolumn', 
					align: 'right',
					width: 100,
					renderer: function(value,meta,record,row,col,store){
						var res = value;
						var end = ' B';
						if (Math.round(value/1024)>1){ end='kB'; res=value/1024;}
						if (Math.round(value/1024/1024)>1){ end='MB'; res=value/1024/1024;}
						
						value = Ext.util.Format.number( res,window.dictionary.get('grid.SizeFormat')+end);
						if(record.get('seen')!==true){
							value = '<b>'+value+'</b>';
						}
						return  value;
					}
				}
			],
			listeners:{
				scope: this,
				itemclick: function( grid, record, item, index, e, eOpts ){
					var scope=this;
					scope.message.load(record.get('id'));
					/*
					var p= e.getXY();
					scope.menu.showAt(p);
					e.preventDefault();
					e.stopEvent();
					*/
				}
			}
		});
		
		this.message = Ext.create('Ext.tualo.ide.components.Message', {
			region: 'center',
			flex: 2
		})
		
		this.items = [this.grid,this.message];
		
		this.callParent([ config ]);
	},
	initComponent: function () {
		this.callParent(arguments);
	}
})