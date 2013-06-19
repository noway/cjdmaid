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

var util = require(__dirname + "/util");
var when = require("when");
var fs = require("fs");

var JSONcomments = require("json-comments-js");

exports.CJDMAID_CONFIG_PATH = "/etc/cjdmaid.conf";
exports.CJDMAID_CONFIG_NAME = "cjdmaidConf";

//this is needed
exports.CONFIGS_COMMENTS = {
	"cjdmaidConf":
		"\n\t\tCjdmaid config. You can edit it, if you wish.\n\t"
};


exports.readJson = function (jsonfile) {
	var deferred = when.defer();

	fs.readFile(jsonfile, "utf8", function (err, data) {
		if (err) {
			return util.panic(err);
		}

		//data = util.stripComments(data);

		var confJson = {};
		try {
			confJson = JSONcomments.parse(data);
		} catch(err) {
			console.error(err);
			return util.panic("Bad json in " + jsonfile + ": " + err);
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
			/*
		cjdmaidJson.cjdrouteNodesConf =
			util.expanduser(cjdmaidJson.cjdrouteNodesConf);
		cjdmaidJson.cjdrouteTempConf =
			util.expanduser(cjdmaidJson.cjdrouteTempConf);
		cjdmaidJson.cjdrouteBinary =
			util.expanduser(cjdmaidJson.cjdrouteBinary);*/
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


exports.writeJson = function (jsonfile, document/*, comment*/) {
	var deferred = when.defer();
	var writingText = JSONcomments.stringify(document, null, "\t");

	//writingText = "/*\n" + comment + "*/\n\n" + writingText;

	fs.writeFile(jsonfile, writingText, function (err) {
		if(err) {
			return util.panic(err);
		}

		deferred.resolve();
	});

	return deferred.promise;
};

exports.writeCjdmaidConf = function (document) {
	//var comment = exports.CONFIGS_COMMENTS[exports.CJDMAID_CONFIG_NAME];
	return exports.writeJson(exports.CJDMAID_CONFIG_PATH, document/*, comment*/);
};


exports.writeCustomConf = function (confname, document) {
	if (confname === exports.CJDMAID_CONFIG_NAME) {
		return exports.writeCjdmaidConf(document);
	}

	return when(
		exports.readCjdmaidConf()
	)
	.then(function (cjdmaidJson) {
		//var comment = exports.CONFIGS_COMMENTS[confname];
		return exports.writeJson(cjdmaidJson[confname], document/*, comment*/);
	});
};

