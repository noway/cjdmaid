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

var when   = require("when");
var path   = require("path");
var crypto = require("crypto");
var util   = {};

util.expanduser = function (pathbname) {
	return path.normalize(pathbname.replace(/~/mg, process.env.HOME));
};

util.isDef = function (variable) {
	return (typeof variable !== "undefined");
};

util.isInt = function (n) {
	return (typeof n === "number") && (n % 1 === 0);
};

util.isObject = function (obj) {
	return (Object.prototype.toString.call(obj) === "[object Object]");
};

util.isArray = function (arr) {
	return (Object.prototype.toString.call(arr) === "[object Array]");
};

util.cloneObject = function (obj) {
	return JSON.parse(JSON.stringify(obj));
};

util.deleteEmptyRows = function (obj) {
	for (var i in obj) {
		if (obj.hasOwnProperty(i)) {
			if (obj[i] === "" || obj[i] === null) {
				delete obj[i];
			}
		}
	}
	return obj;
};

util.generatePassword = function (length) {
	var deferred = when.defer();
	var password = "";
	crypto.randomBytes(256, function getRandomBytes(err, buf) {
		if (err) {
			return util.panic(err);
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

util.panic = function (error) {
	console.error("Fatal error: ");
	console.error(error.stack);
	console.error("Exiting...");
	process.exit(1);
};

module.exports = util;
