/**
 * Created with tualo IDE.
 * Author: Thomas Hoffmann
 * Date: 2013-04-22
 */

var config = require('../config/server').config;


var startUI = function(req, res, next) {
	var loggedIn = false;
	if (typeof req.query!=='undefined'){
		if (req.query.logout==='1'){
			req.session.destroy();
			res.clearCookie(config.auth_cookie_name, {
				path : '/'
			});
			res.redirect('/');
		}
	}
	if ((typeof req.session!=='undefined')&& (req.session!==null)){
		if (typeof req.session.user!=='undefined'){
			loggedIn = req.session.user.loggedIn;
		}
	} 
	res.render('layout',{
		title: 'tualo webmail',
		loggedIn: loggedIn
	});
}

exports.initRoute=function(app){
	app.get("/",startUI);
}

