var session = require('./session');
var Imap = require('tualo-imap');
var MailParser = require("mailparser").MailParser;



if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function (obj, fromIndex) {
    if (fromIndex == null) {
        fromIndex = 0;
    } else if (fromIndex < 0) {
        fromIndex = Math.max(0, this.length + fromIndex);
    }
    for (var i = fromIndex, j = this.length; i < j; i++) {
        if (this[i] === obj)
            return i;
    }
    return -1;
  };
}
/*
if (!Array.prototype.deepIndexOf) {
	Array.prototype.deepIndexOf = function (obj, fromIndex) {
		
		if (fromIndex == null) {
			fromIndex = 0;
		} else if (fromIndex < 0) {
			fromIndex = Math.max(0, this.length + fromIndex);
		}
		for (var i = fromIndex, j = this.length; i < j; i++) {
			if (this[i] === obj){
				return i;
			}else if (typeof this[i]=='array'){
				var r = this[i].deepIndexOf(obj);
				if (r!=-1){
					return i+'/'+r;
				}
			}
		}
		return -1;
	};
}
*/
var getImapInitObject = function(account){
	var o = {
		user: account.imapLogin,
		password: account.imapPassword,
		host: account.smtpServer,
		port: account.imapPort, // 993
		secure: account.imapSecure,
		debug: false,
		timeout: 5000
	};
	return o;
}
var getIMAPConnection=function(account){
	var imap = new Imap(getImapInitObject(account));
	return imap;
}

var handleError = function(err,req, res, next){
	var output = {
		success: false,
		msg: err.message
	}
	res.json(200,output);
}
var _treeSort = function(a,b){
	if (a.text.toLowerCase()>b.text.toLowerCase()) return 1;
	if (a.text.toLowerCase()<b.text.toLowerCase()) return -1;
	return 0
}

var _listSort = function(a,b){
	if (a.date>b.date) return 1;
	if (a.date<b.date) return -1;
	return 0
}

var tree = function(req, res, next) {
	var sessionConfig  = session.getCurrentSession();
	var output = [];
	if (req.query.node===''){
		for(var i in sessionConfig.accounts){
			var entry = {
				id: 'account-'+i,
				text: sessionConfig.accounts[i].title,
				leaf: false,
				expanded: true
			}
			output.push(entry);
		}
		res.json(200,output);
	}else{
		var nodeParts = req.query.node.split('-boxes-'); // id haben den aufbau <account>/<folder>/<folder>
		if (nodeParts.length == 0 ) {return handleError(new Error('invalid request'),req, res, next);}
		
		var accountID = (nodeParts[0].replace('account-',''))*1;
		var reference = (nodeParts[1])?nodeParts[1]:'';
		
		var account = sessionConfig.accounts[accountID];
		if (typeof account==='undefined'){return handleError(new Error('account not found'),req, res, next);}
			
		var imap = getIMAPConnection(account);
		
		imap.on('error',function(conn,err){handleError(new Error('could not connect to the server'),req, res, next);});
		imap.on('imap error',function(conn,keyName,msg,shortmsg){ handleError(new Error('error chained ('+keyName+'): '+msg+' '+shortmsg),req, res, next);});
		imap.on('error chained',function(conn,keyName,msg,shortmsg){handleError(new Error('error chained ('+keyName+'): '+msg+' '+shortmsg),req, res, next);});
		
		imap.on('chained',function(imap){
			var list = imap.get('list').getList();
			//console.log(list);
			var output = [];
			for(var i in list){
				var name = list[i].text;
				if (reference!=''){
					name=name.replace(reference+'.','');
				}
				var id = 'account-'+accountID+'-boxes-'+list[i].text;
				if (name.indexOf('.')<0){
					var entry = {
						id: id,
						text: name,
						leaf: !list[i].children,
						expanded: list[i].children
					}
					output.push(entry);
				}
			}
			output.sort(_treeSort);
			res.json(200,output);
		});
		imap.chained()
			.connect()
			.login()
			.list(reference,'*','list')
			.logout()
			.execute();
	}
}

var list = function(req, res, next) {
	var sessionConfig  = session.getCurrentSession();
	var nodeParts = req.query.node.split('-boxes-'); // id haben den aufbau <account>/<folder>/<folder>
	if (nodeParts.length == 0 ) {return handleError(new Error('invalid request'),req, res, next);}
	var accountID = (nodeParts[0].replace('account-',''))*1;
	var reference = (nodeParts[1])?nodeParts[1]:'';
	var account = sessionConfig.accounts[accountID];
	var mailParser = new MailParser();
	
	var imap = getIMAPConnection(account);
	
	imap.on('error',function(conn,err){
		handleError(new Error('could not connect to the server'),req, res, next);
	})
	
	imap.on('imap error',function(conn,keyName,msg,shortmsg){
		handleError(new Error('error chained ('+keyName+'): '+msg+' '+shortmsg),req, res, next);
	})
	
	imap.on('error chained',function(conn,keyName,msg,shortmsg){
		handleError(new Error('error chained ('+keyName+'): '+msg+' '+shortmsg),req, res, next);
	})
	
	imap.on('chained',function(imap){
		
		if (imap.executed('search')){
			imap.searchListHelper = imap.get('search').getSearchList();
			imap.removeKey('search'); // prevend event loop
			imap.dataHelper = []; // set temporarily helper var
			if (imap.searchListHelper.length==0){
				imap.chained()
					.logout('logout')
					.execute();
			}else{
				var nextMessageNumber = imap.searchListHelper.shift();
				imap.chained()
					.fetch(nextMessageNumber,'FULL','fetch')
					.execute();
			}
		}
		
		if (imap.executed('fetch')){
			var fetchedObj = imap.get('fetch').getFetched();
			imap.removeKey('fetch'); // prevend event loop
						imap.dataHelper.push({
				id: req.query.node +'_msg_'+ fetchedObj.number,
				size: fetchedObj.size,
				subject: mailParser._replaceMimeWords(fetchedObj.envelope.subject),
				fromName: mailParser._replaceMimeWords(fetchedObj.envelope.from.name),
				from: fetchedObj.envelope.from.mailbox+'@'+fetchedObj.envelope.from.host,
				to: fetchedObj.envelope.to.mailbox+'@'+fetchedObj.envelope.to.host,
				toName: mailParser._replaceMimeWords(fetchedObj.envelope.to.name),
				date: new Date(fetchedObj.envelope.date),
				replyTo: fetchedObj.envelope.replyTo.mailbox+'@'+fetchedObj.envelope.replyTo.host,
				seen: fetchedObj.flags.indexOf('\\Seen')!=-1,
				answered: fetchedObj.flags.indexOf('\\Answered')!=-1,
				unseen: fetchedObj.flags.indexOf('\\Unseen')!=-1,
				forwarded: fetchedObj.flags.indexOf('$Forwarded')!=-1,
				attachment: fetchedObj.bodyStructure.indexOf('"mixed"')!=-1 // maybe not the safest method, to determine attachments
			});
			
			if (imap.searchListHelper.length==0){
				imap.chained()
					.logout('logout')
					.execute();
			}else{
				var nextMessageNumber = imap.searchListHelper.shift();
				imap.chained()
					.fetch(nextMessageNumber,'FULL','fetch')
					.execute();
			}
		}
		
		if (imap.executed('logout')){
			imap.dataHelper.sort(_listSort);
			imap.dataHelper.reverse();
			var output = {
				success: true,
				total: imap.dataHelper.length,
				data: imap.dataHelper,
				msg: 'all ok'
			};
			res.json(200,output);
		}
	});

	 
	imap.chained()
		.connect()
		.login()
		.select('"'+reference+'"','inbox') // open the inbox
		.search('SINCE 01-Apr-2013','','search')
		.execute();
	
}

var read = function(req, res, next) {
	var sessionConfig  = session.getCurrentSession();
	var nodeParts = req.body.id.split('-boxes-'); // id haben den aufbau <account>/<folder>/<folder>
	if (nodeParts.length == 0 ) {return handleError(new Error('invalid request'),req, res, next);}
	var accountID = (nodeParts[0].replace('account-',''))*1;
	var ref = (nodeParts[1])?nodeParts[1]:'';
	var ref_parts = ref.split('_msg_');
	var reference = (ref_parts[0])?ref_parts[0]:'';
	var number = (ref_parts[1])?ref_parts[1]:'9999999999';
	var account = sessionConfig.accounts[accountID];
	
	
	var imap = getIMAPConnection(account);
	imap.on('error',function(conn,err){
		handleError(new Error('could not connect to the server'),req, res, next);
	});
	
	imap.on('imap error',function(conn,keyName,msg,shortmsg){
		handleError(new Error('error chained ('+keyName+'): '+msg+' '+shortmsg),req, res, next);
	});
	
	imap.on('error chained',function(conn,keyName,msg,shortmsg){
		handleError(new Error('error chained ('+keyName+'): '+msg+' '+shortmsg),req, res, next);
	});
	
	imap.on('chained',function(imap){
		if (imap.executed('logout')){
			var fetch = imap.get('fetch').getFetched();
			var mailparser = new MailParser();
			mailparser.on("end", function(mail){
				
				// remove attachment buffer, reduce unneeded traffic
				if (typeof mail.attachments!=='undefined'){
					for(var i in mail.attachments){
						delete mail.attachments[i].content;
					}
				}
				
				var output = {
					success: true,
					data: mail,
					msg: 'all ok'
				};
				res.json(200,output);
			});
			mailparser.write(fetch.text);
			mailparser.end();
		}
	});
	
	imap.chained()
		.connect()
		.login()
		.select('"'+reference+'"','inbox') // open the inbox
		.fetch(number,'RFC822','fetch')
		.logout('logout')
		.execute();	
	
}



var move = function(req, res, next) {
	var sessionConfig  = session.getCurrentSession();
	var nodeParts = req.body.messageId.split('-boxes-'); // id haben den aufbau <account>/<folder>/<folder>
	
	if (nodeParts.length == 0 ) {return handleError(new Error('invalid request'),req, res, next);}
	var accountID = (nodeParts[0].replace('account-',''))*1;
	var ref = (nodeParts[1])?nodeParts[1]:'';
	var ref_parts = ref.split('_msg_');
	var fromBox = (ref_parts[0])?ref_parts[0]:'';
	var number = (ref_parts[1])?ref_parts[1]:'9999999999';
	var account = sessionConfig.accounts[accountID];
	
	var toNodeParts = req.body.boxId.split('-boxes-'); // id haben den aufbau <account>/<folder>/<folder>
	if (toNodeParts.length == 0 ) {return handleError(new Error('invalid request'),req, res, next);}
	var toBox = (toNodeParts[1])?toNodeParts[1]:'';
	
	
	var imap = getIMAPConnection(account);
	imap.on('error',function(conn,err){
		handleError(new Error('could not connect to the server'),req, res, next);
	});
	
	imap.on('imap error',function(conn,keyName,msg,shortmsg){
		handleError(new Error('error chained ('+keyName+'): '+msg+' '+shortmsg),req, res, next);
	});
	
	imap.on('error chained',function(conn,keyName,msg,shortmsg){
		handleError(new Error('error chained ('+keyName+'): '+msg+' '+shortmsg),req, res, next);
	});
	
	imap.on('chained',function(imap){
		if (imap.executed('copy')){
			
			imap.store(number,'+FLAGS','\deleted','store')
			imap.removeKey('copy'); // prevend event loop
			imap.execute();	
		}

		if (imap.executed('store')){
			imap.removeKey('store'); // prevend event loop
			imap.expunge();
			imap.logout('logout');
			imap.execute();
		}
		
		if (imap.executed('logout')){
			var output = {
				success: true,
				msg: 'all ok'
			};
			res.json(200,output);
		}
	});
	

	
	imap.chained()
		.connect()
		.login()
		.select('"'+reference+'"','inbox') // open the inbox
		.copy(number,toBox,'copy')
		//.logout('logout')
		.execute();	
}


exports.initRoute=function(app){

	
	app.get("/tree",tree);
	app.post("/tree",tree);
	
	app.get("/list",list);
	app.post("/list",list);
	
	app.post("/read",read);
	app.post("/move",move);
}

