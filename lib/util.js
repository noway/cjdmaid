/**
 * This file is part of Cjdmaid.
 *
 * Cjdmaid program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

var config = require(__dirname + "/config");

var when = require("when");
var path = require("path");
var crypto = require("crypto");

exports.stripComments = function (data) {
	data = data.replace(/\/\*(.|\n)+?\*\//mg, "");
	data = data.replace(/\/\/(.*)$/mg, "");
	return data;
};

exports.configpath = function (path) {
	var result = [];
	path.split(".").forEach(function (e) {
		result.push(e.split("[")[0]);
		var re = /\[(\d+)\]/g;
		var match = null;
		while((match = re.exec(e)) !== null) {
			result.push(parseInt(match[1], 10));
		}
	});
	return result;
};

exports.expanduser = function (pathbname) {
	return path.normalize(pathbname.replace(/~/mg, process.env.HOME));
};

exports.skip = function () {
	var deferred = when.defer();
	process.nextTick(function() {
		deferred.resolve();
	});
	return deferred.promise;
};

exports.isDef = function (varieble) {
	return (typeof varieble !== "undefined");
};

exports.isInt = function (n) {
	return (typeof n === "number") && (n % 1 === 0);
};

exports.isObject = function (obj) {
	return (Object.prototype.toString.call(obj) === "[object Object]");
};

exports.isArray = function (arr) {
	return (Object.prototype.toString.call(arr) === "[object Array]");
};

exports.cloneObject = function (obj) {
	return JSON.parse(JSON.stringify(obj));
};

exports.generatePassword = function (length) {
	var deferred = when.defer();
	var password = "";
	crypto.randomBytes(256, function getRandomBytes(err, buf) {
		if (err) {
			return exports.panic(err);
		}
		password += buf.toString().replace(/[^a-z0-9]/ig, "");
		if (password.length < length) {
			crypto.randomBytes(256, getRandomBytes);
		} else {
			deferred.resolve(password.substring(0, length));
		}
	});
	return deferred.promise;
};

exports.panic = function (error) {
	console.error("Fatal error: ");
	console.error(error);
	console.error("Exiting...");
	process.exit(1);
};

exports.isConfigPathPossible = function (configPath, last) {
	var deferred = when.defer();

	config.readCustomConf("cjdrouteNodesConf")
	.then(function (doc) {
		var docIter = doc; // pointer

		for (var i = 0; i < configPath.length; i++) { // creating missing objects
			if (!exports.isDef(docIter[configPath[i]])) {
				if (i + 1 >= configPath.length){
					if (last === "array") {
						docIter[configPath[i]] = [];
					} else {
						docIter[configPath[i]] = {};
					}
				}
				else if(exports.isInt(configPath[i + 1])) {
					docIter[configPath[i]] = []; // array
				}
				else {
					docIter[configPath[i]] = {}; // object
				}
			} else {
				if (i + 1 >= configPath.length){
					if (last === "array") {
						if(!exports.isArray(docIter[configPath[i]])) {
							return deferred.resolve(false);
						}
					} else {
						if(!exports.isObject(docIter[configPath[i]])) {
							return deferred.resolve(false);
						}
					}
				}
				else if(exports.isInt(configPath[i + 1])) {
					if(!exports.isArray(docIter[configPath[i]])) {
						return deferred.resolve(false);
					}
				}
				else {
					if(!exports.isObject(docIter[configPath[i]])) {
						return deferred.resolve(false);
					}
				}
			}
			docIter = docIter[configPath[i]];

		}
		return deferred.resolve(true);
	});
	return deferred.promise;
};
