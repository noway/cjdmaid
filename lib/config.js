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


var fs = require("fs");
var path = require("path");
var when = require("when");
var nodefn = require("when/node/function");

var JSONcomments = require("json-comments-js");
var util = require(__dirname + "/util");


exports.CJDMAID_CONFIG_PATH = "/etc/cjdmaid.conf";
exports.CJDMAID_CONFIG_NAME = "cjdmaidConf";

//this is needed
exports.CONFIGS_COMMENTS = {
	"cjdmaidConf":
		"\tCjdmaid config. You can edit it, if you wish."
};


exports.readJson = function (jsonfile) {
	var deferred = when.defer();

	fs.readFile(jsonfile, "utf8", function (err, data) {
		if (err) {
			return util.panic(err);
		}

		var confJson = {};
		try {
			confJson = JSONcomments.parse(data);
		} catch(e) {
			return util.panic(e);
		}

		deferred.resolve(confJson);
	});

	return deferred.promise;
};


exports.readCjdmaidConf = function () {
	return when(
		exports.readJson(exports.CJDMAID_CONFIG_PATH)
	)
	.then(function (cjdmaidJson) {
		cjdmaidJson.cjdrouteConf =
			util.expanduser(cjdmaidJson.cjdrouteConf);
		return cjdmaidJson;
	});
};


exports.readCustomConf = function (confname) {
	if (confname === exports.CJDMAID_CONFIG_NAME) {
		return exports.readCjdmaidConf();
	}

	return when(
		exports.readCjdmaidConf()
	)
	.then(function (cjdmaidJson) {
		return exports.readJson(cjdmaidJson[confname]);
	});
};

// WARNING: pass array to this func, not just args!
exports.readSeveralConfs = function (names) {
	var deferreds = [];

	for(var i = 0; i < names.length; i++) {
		deferreds.push(exports.readCustomConf(names[i]));
	}
	return when.all(deferreds);
};


exports.writeJson = function (jsonfile, document) {
	var deferred = when.defer();
	var writingText = JSONcomments.stringify(document, null, "\t");

	fs.writeFile(jsonfile, writingText, function (err) {
		if(err) {
			return util.panic(err);
		}

		deferred.resolve();
	});

	return deferred.promise;
};

exports.writeCjdmaidConf = function (document) {
	return exports.writeJson(exports.CJDMAID_CONFIG_PATH, document);
};


exports.writeCustomConf = function (confname, document) {
	if (confname === exports.CJDMAID_CONFIG_NAME) {
		return exports.writeCjdmaidConf(document);
	}

	return when(
		exports.readCjdmaidConf()
	)
	.then(function (cjdmaidJson) {
		return exports.writeJson(cjdmaidJson[confname], document);
	});
};

exports.writeCustomConfSafe = function (confname, document) {
	if (confname === exports.CJDMAID_CONFIG_NAME) {
		return when(
			nodefn.call(fs.readFile, exports.CJDMAID_CONFIG_PATH, "utf8")
		)
		.then(function (data) {
			var backup = util.expanduser("~/." +
				path.basedir(exports.CJDMAID_CONFIG_PATH) + "-back");

			return nodefn.call(fs.writeFile, backup, data);
		})
		.then(function () {
			return exports.writeCjdmaidConf(document);
		});
	}

	var cjdmaidJson;

	return when(
		exports.readCjdmaidConf()
	)
	.then(function (readed) {
		cjdmaidJson = readed;
		return nodefn.call(fs.readFile, cjdmaidJson[confname], "utf8");
	})
	.then(function (data) {
		var backup = util.expanduser("~/." +
			path.basename(cjdmaidJson[confname]) + "-back");

		return nodefn.call(fs.writeFile, backup, data);
	})
	.then(function () {
		return exports.writeJson(cjdmaidJson[confname], document);
	});
};

