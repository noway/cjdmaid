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

exports.CJDMAID_CONFIG_PATH = "/etc/cjdmaid.conf";
exports.CJDMAID_CONFIG_NAME = "cjdmaidConf";

exports.CONFIGS_COMMENTS = {
	"cjdrouteNodesConf":
		"\tCjdns peers config. You can edit it, if you wish.\n" +
		"\tAll comments would be erased!\n",

	"cjdrouteTempConf":
		"\tWarning! This is temporary file!\n" +
		"\tDon't edit it! All changes would be erased!\n" +
		"\tYou can find files that you can edit in ~/.cjdmaid\n",

	"cjdmaidConf":
		"\tCjdmaid config. You can edit it, if you wish.\n" +
		"\tAll comments would be erased!\n"
};

exports.readJson = function (jsonfile) {
	var deferred = when.defer();

	fs.readFile(jsonfile, "utf8", function (err, data) {
		if (err) {
			return util.panic(err);
		}

		data = util.stripComments(data);

		var confJson = {};
		try {
			confJson = JSON.parse(data);
		} catch(err) {
			return util.panic("Bad json in " + jsonfile + ": " + err);
		}

		deferred.resolve(confJson);
	});

	return deferred.promise;
};


exports.readCjdmaidConf = function () {
	return exports.readJson(exports.CJDMAID_CONFIG_PATH)
		.then(function (cjdmaidJson) {
			cjdmaidJson.cjdrouteConf =
				util.expanduser(cjdmaidJson.cjdrouteConf);
			cjdmaidJson.cjdrouteNodesConf =
				util.expanduser(cjdmaidJson.cjdrouteNodesConf);
			cjdmaidJson.cjdrouteTempConf =
				util.expanduser(cjdmaidJson.cjdrouteTempConf);
			cjdmaidJson.cjdrouteBinary =
				util.expanduser(cjdmaidJson.cjdrouteBinary);
			return cjdmaidJson;
		});
};


exports.readCustomConf = function (confname) {
	if (confname === exports.CJDMAID_CONFIG_NAME) {
		return exports.readCjdmaidConf();
	}

	return exports.readCjdmaidConf().then(function (cjdmaidJson) {
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


exports.writeJson = function (jsonfile, document, comment) {
	var deferred = when.defer();
	var writingText = JSON.stringify(document, null, "\t");

	writingText = "/*\n" + comment + "*/\n\n" + writingText;

	fs.writeFile(jsonfile, writingText, function (err) {
		if(err) {
			return util.panic(err);
		}

		deferred.resolve();
	});

	return deferred.promise;
};

exports.writeCjdmaidConf = function (document) {
	var comment = exports.CONFIGS_COMMENTS[exports.CJDMAID_CONFIG_NAME];
	return exports.writeJson(exports.CJDMAID_CONFIG_PATH, document, comment);
};


exports.writeCustomConf = function (confname, document) {
	if (confname === exports.CJDMAID_CONFIG_NAME) {
		return exports.writeCjdmaidConf(document);
	}

	return exports.readCjdmaidConf().then(function (cjdmaidJson) {
		var comment = exports.CONFIGS_COMMENTS[confname];
		return exports.writeJson(cjdmaidJson[confname], document, comment);
	});
};

