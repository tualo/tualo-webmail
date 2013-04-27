var session = require('./session');
var Imap = require('tualo-imap');
var MailParser = require("mailparser").MailParser;


var handleError = function(err,req, res, next){
	var output = {
		success: false,
		msg: err.message
	}
	res.json(200,output);
}

var tree = function(req, res, next) {
	var sessionConfig  = session.getCurrentSession();
	var output = [];
	for(var i in sessionConfig.accounts){
		var entry = {
			id: 'account-'+i,
			text: sessionConfig.accounts[i].title,
			leaf: true
		}
		output.push(entry);
	}
	res.json(200,output);
}

var list = function(req, res, next) {
	var imap = new Imap();
	imap.on('error',function(conn,err){
		console.log('[test] error');
		console.log(err);
	})
	
	imap.on('imap error',function(conn,keyName,msg,shortmsg){
		console.log('[test] imap error ('+keyName+'): '+msg+' '+shortmsg);
	})
	
	imap.on('error chained',function(conn,keyName,msg,shortmsg){
		console.log('[test] error chained ('+keyName+'): '+msg+' '+shortmsg);
	})
	
	imap.on('chained',function(conn){
		console.log('[test] chain finished');
		console.log(conn.get('message1'));
		console.log(conn.get('body1'));
	});

	imap.chained()
		.connect()
		.login()
		.select('inbox','key1') // open the inbox
		.fetch(1,'RFC822','body1')
		.logout()
		.execute();
	handleError(new Error('not implemented yet'),req, res, next);
}

var read = function(req, res, next) {
	handleError(new Error('not implemented yet'),req, res, next);
}

exports.initRoute=function(app){

	
	app.get("/tree",tree);
	app.get("/list",list);
	app.post("/list",list);
	app.post("/read",read);
}



function quoted_printable_decode (str) {
  // http://kevin.vanzonneveld.net
  // +   original by: Ole Vrijenhoek
  // +   bugfixed by: Brett Zamir (http://brett-zamir.me)
  // +   reimplemented by: Theriault
  // +   improved by: Brett Zamir (http://brett-zamir.me)
  // +   bugfixed by: Theriault
  // *     example 1: quoted_printable_decode('a=3Db=3Dc');
  // *     returns 1: 'a=b=c'
  // *     example 2: quoted_printable_decode('abc  =20\r\n123  =20\r\n');
  // *     returns 2: 'abc   \r\n123   \r\n'
  // *     example 3: quoted_printable_decode('012345678901234567890123456789012345678901234567890123456789012345678901234=\r\n56789');
  // *     returns 3: '01234567890123456789012345678901234567890123456789012345678901234567890123456789'
  // *    example 4: quoted_printable_decode("Lorem ipsum dolor sit amet=23, consectetur adipisicing elit");
  // *    returns 4: Lorem ipsum dolor sit amet#, consectetur adipisicing elit
  // Removes softline breaks
  var RFC2045Decode1 = /=\r\n/gm,
    // Decodes all equal signs followed by two hex digits
    RFC2045Decode2IN = /=([0-9A-F]{2})/gim,
    // the RFC states against decoding lower case encodings, but following apparent PHP behavior
    // RFC2045Decode2IN = /=([0-9A-F]{2})/gm,
    RFC2045Decode2OUT = function (sMatch, sHex) {
      return String.fromCharCode(parseInt(sHex, 16));
    };
  return str.replace(RFC2045Decode1, '').replace(RFC2045Decode2IN, RFC2045Decode2OUT);
}
