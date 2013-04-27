/**
 * Created with tualo IDE.
 * Author: Thomas Hoffmann
 * Date: 2013-04-22
 */

var config = require('../config/server').config;


var startUI = function(req, res, next) {
	res.render('layout',{
		title: 'tualo webmail'
	});
}

exports.initRoute=function(app){
	app.get("/",startUI);
}

