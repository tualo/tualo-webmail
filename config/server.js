/**
 * Created with tualo IDE.
 * Author: Thomas Hoffmann
 * Date: 2013-04-22
 *
 * This file contains all configuration options.
 * CURRENTLY: https and sdpy is not implemented!!!
 *
 * db: is used for user auth. database, currently only text is supported (all passwords and account configs will be stored encrypted in that file
 *     please set a full path and filename, the file should not be stored in the public folder!
 * session_secret: is a password for encryption of the cookies
 * auth_cookie_name: is the name for storing th cookie in the client browser
 * host: is the name or ip where the service should listen
 * port: is the port where the service should listen
 *
 */


var config = {
	db: 'text:/Users/thomashoffmann/.webmail',
	session_secret: '732evSR&vsjhuzt&',
	auth_cookie_name: 'tualo-webmail',
	host: 'localhost',
	port: 8099
}
exports.config = config;