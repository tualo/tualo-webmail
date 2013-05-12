/**
 * Created with tualo IDE.
 * Author: Thomas Hoffmann
 * Date: 2013-04-22
 *
 * Diese Route soll ein Benutzer und Login System abbilden,
 * geschehen ist davon fast nix.
 *
 * auth_user ist als middleware implementiert führt aber nur den next-step aus
 */

var auth_user = function(req, res, next) {
	console.log('sign: auth_user');
    next();
}

exports.initRoute=function(app){
    app.use(auth_user);
}