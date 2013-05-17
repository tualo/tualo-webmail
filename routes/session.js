var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var ursa = require('ursa');
var config = require('../config/server').config;


/**
* Generate a session encrypted by the session_secret.
* @private
* @param {object} user the user to be stored
* @param {object} res the response object for sending the cookie
* @returns void
*/
function gen_session(user, res) {
	var auth_token = encrypt(JSON.stringify(user), config.session_secret);
	res.cookie(config.auth_cookie_name, auth_token, {
		path : '/',
		maxAge : 1000 * 60 * 60 * 24 * 30
	});
}

/**
* Encrypts the given string with the secret by using aes192
* @param {string} str the string to be encrypted
* @param {string} secret the passphrase use to encrypt
*/
function encrypt(str, secret) {
	var cipher = crypto.createCipher('aes192', secret);
	var enc = cipher.update(str, 'utf8', 'hex');
	enc += cipher.final('hex');
	return enc;
}

/**
* Decrypts the given string with the secret by using aes192
* @param {string} str the string to be decrypted
* @param {string} secret the passphrase use to decrypt
*/
function decrypt(str, secret) {
	var decipher = crypto.createDecipher('aes192', secret);
	var dec = decipher.update(str, 'hex', 'utf8');
	dec += decipher.final('utf8');
	return dec;
}

/**
* Check if the directory exists
* @param {string} dir the directory
* @param {function} cb the callback function with the arguments err, exists
**/
function  dirExists (dir, cb) { 
	fs.stat(dir, function(er, s) { 
		if(er && er.errno == 2){ 
			cb(null, false); 
		}else{ 
			cb(er, er ? false : true); 
		} 
	}); 
} 

/**
* Save the given user account
* @param {object} userobj
* @param {function} cb the callback function with the arguments err, userobj
**/
var saveUserAccountFile = function(userobj,callback){
	var filePath = config.db.substring(5);
	var md5sum = crypto.createHash('md5');
	md5sum.update(userobj.username);
	var user_hash =	md5sum.digest('hex');
	
	fs.writeFile(path.join(filePath,user_hash+'.json'),JSON.stringify(userobj),function(err,o){
		if (err){
			callback(err,null);
		}else{
			callback(null,userobj);
		}
	});
}

/**
* Create the user account
* @param {object} userobj
* @param {string} password
* @param {function} cb the callback function with the arguments err, userobj
**/
var createUserAccount = function(userobj,password,callback){
	if (config.db.indexOf('text:')===0){
		var keyPair = ursa.generatePrivateKey();
		
		userobj.private = keyPair.toPrivatePem('utf8');
		userobj.public = keyPair.toPublicPem('utf8');
		userobj.password = keyPair.encrypt(password,'utf8','base64'); // encrypt the password
		//userobj.accounts = keyPair.encrypt(JSON.stringify(userobj.accounts),'utf8','base64'); // encrypt the account configs
		var json_txt = JSON.stringify(JSON.stringify(userobj.accounts));
		var chunks = json_txt.match(/.{1,41}/g);
		for(var i in chunks){
			chunks[i] = public.encrypt(chunks[i],'utf8','base64');
		}
		userobj.accounts=chunks;
		saveUserAccountFile(userobj,callback);
		
	}else{
		callback({message:'not implemented'},null);
	}
} 

/**
* Read the user account if the account exists and the given password matches
* @param {object} userobj
* @param {string} password
* @param {function} cb the callback function with the arguments err, userobj
**/
var getUserAccount = function(username,password,callback){
	if (config.db.indexOf('text:')===0){
		var filePath = config.db.substring(5);
		var md5sum = crypto.createHash('md5');
		md5sum.update(username);
		var user_hash =	md5sum.digest('hex');
		if (fs.existsSync(path.join(filePath,user_hash+'.json'))){
			
			fs.readFile(path.join(filePath,user_hash+'.json'), function (err, data) {
				if (err){
					callback({
						message: err.message
					},[]);
				}else{
					try{
						var userObj = JSON.parse(data);
						var private = ursa.createPrivateKey(userObj.private);
						if (private.decrypt(userObj.password,'base64','utf8')===password){
							
							var acc = [];
							console.log(typeof userObj.accounts);
							if (typeof userObj.accounts==='object'){
								var json_text = '';
								for(var i in userObj.accounts){
									json_text += private.decrypt(userObj.accounts[i],'base64','utf8')
								}
								acc = JSON.parse(json_text);
							}
							console.log(acc);
							callback(null,acc);
						}else{
							callback({
								message: 'password is wrong'
							},null);
						}
					}catch(e){
						callback({
							message: 'invalid account file ('+e.message+')'
						},null);
					}
					
				}
			});
		}else{
			dirExists(filePath,function(err,exists){
				if (exists){
					callback({
						message: 'username not found'
					},null);
				}else{
					// new server instance
					// create the first account as admin-account
					// if config flag createadminfirst is set to false
					// nothing will be done
					if ((typeof config.createadminfirst!=='undefined')&&(createadminfirst===false)){
						callback({
							message: 'invalid server configuration or service currently not avialable'
						},null);
					}else{
						fs.mkdir(filePath,'0777',function(err,path){
							if (err){
								callback({
									message: '0001: '+err.message + ' store: '+ filePath
								},null);
							}else{
								var userobj = {
									username: username,
									isAdmin: true, // first account is the admin account
									accounts: []
								}
								createUserAccount(userobj,password,function(err,user){
									callback(null,userobj.accounts);
								})
								
							}
						});
						
					}
				}
			});
			
		}
	}else{
		// not implemented yet
		callback({
			message: 'not implemented'
		},null);
	}
}

/**
* Return all accounts for the matching session
**/
var getCurrentAccounts = function(req) {
	 
	if ((typeof req.session!=='undefined')&&(typeof req.session.user!=='undefined')&&(req.session.user.loggedIn===true)){
		return {
			accounts: (typeof req.session.accounts==='undefined')?[]:req.session.accounts
		}
		
	}else{
		return {
			accounts: []
		}
	}
}

/**
* Authentication middleware, reads the cookie (if exists) 
*/
var auth_user = function(req, res, next) {
	if (typeof req.session.user!=='undefined') {
		if (req.app.route==='/'){
			next();
		}else{
			var output = {
				success: true,
				data: [],
				total: 0,
				msg: ""
			}
			return res.json(200,output);
		}
	}else{
		var cookie = req.cookies[config.auth_cookie_name];
		if (!cookie){
			return next();
		}
		try{
			req.session.user = JSON.parse(decrypt(cookie, config.session_secret));
		}catch(e){
			// something went wrong with the cookie, ignore it!
		}
		next();
	}
}
	
/**
* Handle the login. Read the post parameter username and password and try to find a matching user account.
* 
* 
*/
var login = function(req, res, next){
	var username = req.body.username;
	var password = req.body.password;
	
	getUserAccount(username,password,function(err,accounts){
		if (err){
			var output = {
				success: false,
				msg: err.message
			};
			res.json(200,output);
		}else{
			var user = {
				user: username,
				loggedIn: true
			};
			req.session.user = user;
			req.session.accounts = accounts;
			gen_session(user,res); // generate the cookie
			var output = {
				success: true
			};
			res.json(200,output);
		}
	});
}

var saveaccount = function(req, res, next){
	if (config.db.indexOf('text:')===0){
		var filePath = config.db.substring(5);
		var md5sum = crypto.createHash('md5');
		
		md5sum.update(req.session.user.user);
		var user_hash =	md5sum.digest('hex');
		fs.readFile(path.join(filePath,user_hash+'.json'), function (err, data) {
			if (err){
				var output = {
					success: false,
					msg: err.message
				};
				res.json(200,output);
			}else{
				var userobj = JSON.parse(data);
				var accs = getCurrentAccounts(req);
				var found = -1;

				for(var i in accs.accounts){
					if (accs.accounts[i].title==req.body.remotetitle){
						found=i;
						break;
					}
				}
				
				if (found==-1){
					for(var i in accs.accounts){ // search duplicate title
						if (accs.accounts[i].title==req.body.title){
							found=i;
							break;
						}
					}
				}
				
				if (found==-1){
					accs.accounts.push({});
					found = accs.accounts.length-1;
				}
				accs.accounts[found].title = req.body.title;
				accs.accounts[found].signature = req.body.signature;
				
				accs.accounts[found].imapServer = req.body.imapServer;
				accs.accounts[found].imapPort = req.body.imapPort;
				accs.accounts[found].imapAccount = req.body.imapAccount;
				if (req.body.imapPassword!='******'){
					accs.accounts[found].imapPassword = req.body.imapPassword;
				}
				
				accs.accounts[found].smtpServer = req.body.smtpServer;
				accs.accounts[found].smtpPort = req.body.smtpPort;
				accs.accounts[found].smtpAccount = req.body.smtpAccount;
				if (req.body.smtpPassword!='******'){
					accs.accounts[found].smtpPassword = req.body.smtpPassword;
				}
				
				
				var public = ursa.createPublicKey(userobj.public);
				//console.log(userobj.public);
				
				var json_txt = JSON.stringify(accs.accounts);
				var chunks = json_txt.match(/.{1,41}/g);
				for(var i in chunks){
					chunks[i] = public.encrypt(chunks[i],'utf8','base64');
				}
				userobj.accounts = chunks;
				saveUserAccountFile(userobj,function(err,uo){
					if (err){
						var output = {
							success: false,
							msg: err.message
						};
						res.json(200,output);
					}else{
						var output = {
							success: true,
							msg: uo
						};
						res.json(200,output);
					}
				});
				 
				
			}
		})
	}else{
		var output = {
			success: false,
			msg: 'not supported'
		};
		res.json(200,output);
	}
}

var accounts = function(req, res, next){
	
	var accs = getCurrentAccounts(req);
	for(var i in accs.accounts){
		accs.accounts[i].id = accs.accounts[i].title; // tree needs an id
		accs.accounts[i].remotetitle = accs.accounts[i].title;
		accs.accounts[i].text = accs.accounts[i].title; // tree needs a text
		accs.accounts[i].leaf = true; // prevent tree form loading subnodes 
		accs.accounts[i].imapPassword='******'; // don't submit any passwords
		accs.accounts[i].smtpPassword='******'; // don't submit any passwords
	}
	res.json(200,accs.accounts);
}

exports.auth_user = auth_user;
exports.getCurrentAccounts = getCurrentAccounts;
exports.initRoute=function(app){
	app.use(auth_user);
	app.post("/login",login);
	app.post("/saveaccount",saveaccount);
	
	app.get("/accounts",accounts); // Ext Tree Store queries sometimes via get
	app.post("/accounts",accounts);
}


