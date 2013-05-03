var fs = require('fs');
var getCurrentSession = function() {
	var file = '/Users/thomashoffmann/Documents/tualo-webmail/.accounts';
	var acc = JSON.parse(fs.readFileSync(file, 'utf8'));
	return {
		name: 'tualo',
		accounts: acc
	}
}


exports.getCurrentSession = getCurrentSession;
exports.initRoute=function(app){
    //app.get("/",startUI);
}