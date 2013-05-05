var fs = require('fs');
var config = require('../config/server').config;

var getCurrentSession = function() {
	var file = '/Users/thomashoffmann/Documents/tualo-webmail/.accounts';
	var acc = JSON.parse(fs.readFileSync(file, 'utf8'));
	return {
		name: 'tualo',
		accounts: acc
	}
}

/**
* Authentication middleware, reads the cookie (if exists) 
*/
var auth_user = function(req, res, next) {
	if (typeof req.session.user!=='undefined') {
		next();
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
	if (password === 'test'){
		var user = {
			user: username
		};
		req.session.user = username;
		gen_session(user,res); // generate the cookie
		var output = {
			success: true
		};
		res.json(200,output);
	}else{
		var output = {
			success: false,
			msg: 'username or password is wrong'
		};
		res.json(200,output);
	}
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