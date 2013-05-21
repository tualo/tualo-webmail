var fs = require('fs');
var crypto = require('crypto');
var path = require('path');
var config = require('../config/server').config;
var session = require('./session');

var profile =  function(req, res, next) {
	var output = {
		success: false
	};
	output.data = {};
	output.data.username = '';
	output.data.password = ''; 
	output.data.passwordrep = '';
	output.data.isadmin = false;
	if (config.db.indexOf('text:')===0){
		if (typeof req.body.username === 'string'){
			
			if (typeof req.body.password !== 'undefined'){
				// date for saving exists
				if (req.body.password!==req.body.passwordrep){
					ouput.success=false;
					ouput.msg='the passwords does not match';
					
					
					
					res.json(200,output);
				}else{
					
					var filePath = config.db.substring(5);
					var md5sum = crypto.createHash('md5');
					md5sum.update(req.body.username);
					var user_hash =	md5sum.digest('hex');
					 
					var exists = fs.existsSync(path.join(filePath,user_hash+'.json'));
					if (exists===true){
						output.success=false;
						output.msg='account exists';
						res.json(200,output);
					}else{
						session.createUserAccount({
							username: req.body.username,
							isAdmin: (req.body.isAdmin==='on')?true:false,
							accounts: []
						},req.body.password,function(err,user){
							if (err){
								output.success=true;
								output.msg=err.message;
								res.json(200,output);
								return;
							}
							output.success=true;
							output.msg='created';
							res.json(200,output);
						})
					}
					
					
				}
				
			}else{
				
				var filePath = config.db.substring(5);
				var md5sum = crypto.createHash('md5');
				md5sum.update(req.body.username);
				var user_hash =	md5sum.digest('hex');
				fs.readFile(path.join(filePath,user_hash+'.json'),function(err,data){
					if (err){
						// maybe file does not exitst
						
					}
					try{
						var d = JSON.parse(data);
						output.data.username = d.username;
						output.data.isAdmin = d.isAdmin;
						output.data.password = '******'; // never submit the real password!
						output.data.passwordrep = '******';
					}catch(e){
					
					}
					output.success=true;
					res.json(200,output);
				});
				
			}
		}else{
			output.success=true;
			res.json(200,output);
		} 
	}else{
		output.msg = 'not supported';
		res.json(200,output);
	}
}

var accounts = function(req, res, next) {
	var output = {
		success: false
	};
	if (config.db.indexOf('text:')===0){
		var filePath = config.db.substring(5);
		fs.readdir(filePath,function(err,files){
			if (err){
				output.msg = err.message;
				res.json(200,output);
				return;
			}
			var data = [];
			for(var i in files){
				var fParts = files[i].split('.');
				if (fParts[fParts.length-1]=='json'){
					try{
						var fileData = fs.readFileSync(path.join(filePath,files[i]));
						var account = JSON.parse(fileData);
						if (typeof account.username !== 'undefined'){
							data.push({
								id: account.username,
								isAdmin: (account.isAdmin===true)?true:false
							});
						}
					}catch(e){} // maybe logging errors
				}
			}
			output.success = true;
			output.total = data.length;
			output.data = data;
			res.json(200,output);
		});
	}else{
		output.msg = 'not supported';
		res.json(200,output);
	}
	
}

exports.initRoute=function(app){
	 
	app.get("/admin/accounts",accounts);
	app.post("/admin/accounts",accounts);
	 
	app.post("/admin/profile",profile);
}