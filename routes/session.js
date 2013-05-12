var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var ursa = require('ursa');
var config = require('../config/server').config;


function  dirExists (d, cb) { 
	fs.stat(d, function(er, s) { 
		if(er && er.errno == 2){ 
			cb(null, false); 
		}else{ 
			cb(er, er ? false : true); 
		} 
	}); 
} 

var saveUserAccount = function(userobj,callback){
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

var createUserAccount = function(userobj,password,callback){
	if (config.db.indexOf('text:')===0){
		var keyPair = ursa.generatePrivateKey();
		
		userobj.private = keyPair.toPrivatePem('utf8');
		userobj.public = keyPair.toPublicPem('utf8');
		userobj.password = keyPair.encrypt(password,'utf8','base64'); // encrypt the password
		
		saveUserAccount(userobj,callback);
		
	}else{
		callback({message:'not implemented'},null);
	}
} 


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
					//console.log(path.join(filePath,user_hash+'.json'));
					console.log('#'+data);
					try{
						var userObj = JSON.parse(data);
						var private = ursa.createPrivateKey(userObj.private);
						//var public = ursa.createPublicKey(userObj.public,'utf8');
						//console.log((userObj.password===private.decr(password,'utf8','utf8') )?'OK':'FAILED');
						//console.log(private.encrypt(password,'utf8','utf8'));
						
						if (private.decrypt(userObj.password,'base64','utf8')===password){
							callback(null,userObj.accounts);
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
									message: '0001: '+err.message + filePath
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


var getCurrentSession = function(req) {
	if ((typeof req.session!=='undefined')&&(typeof req.session.user!=='undefined')&&(req.session.user.loggedIn===true)){
		
		//var file = '/Users/thomashoffmann/Documents/tualo-webmail/.accounts';
		//var acc = JSON.parse(fs.readFileSync(file, 'utf8'));
		
		return {
			accounts: req.session.accounts
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

exports.auth_user = auth_user;
exports.getCurrentSession = getCurrentSession;
exports.initRoute=function(app){
	app.use(auth_user);
	app.post("/login",login);
}



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