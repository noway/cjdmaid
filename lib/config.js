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

var fs           = require("fs");
var path         = require("path");
var when         = require("when");
var nodefn       = require("when/node/function");
var JSONcomments = require("json-comments-js");

var util = require(__dirname + "/util");

var config = {};

config.CJDMAID_CONFIG_PATH = "/etc/cjdmaid.conf";
config.CJDMAID_CONFIG_NAME = "cjdmaidConf";

//this is needed
config.CONFIGS_COMMENTS = {
	"cjdmaidConf":
		"\n\t\tCjdmaid config. You can edit it, if you wish.\n\t"
};


config.readJson = function (jsonfile) {
	return when(
		nodefn.call(fs.readFile, jsonfile, "utf8")
	)
	.then(function (data) {
		return JSONcomments.parse(data);
	})
	.otherwise(function (err) {
		if (err) {
			return util.panic(err);
		}
	});
};

config.readCjdmaidConf = function () {
	return when(
		config.readJson(config.CJDMAID_CONFIG_PATH)
	)
	.then(function (cjdmaidJson) {
		cjdmaidJson.cjdrouteConf =
			util.expanduser(cjdmaidJson.cjdrouteConf);
		cjdmaidJson.cjdnsadminConf =
			util.expanduser(cjdmaidJson.cjdnsadminConf);
		return cjdmaidJson;
	});
};


config.readCustomConf = function (confname) {
	if (confname === config.CJDMAID_CONFIG_NAME) {
		return config.readCjdmaidConf();
	}

	return when(
		config.readCjdmaidConf()
	)
	.then(function (cjdmaidJson) {
		return config.readJson(cjdmaidJson[confname]);
	});
};

config.readSeveralConfs = function () {
	var deferreds = [];
	var names = Array.prototype.slice.call(arguments);

	for(var i = 0; i < names.length; i++) {
		deferreds.push(config.readCustomConf(names[i]));
	}
	return when.all(deferreds);
};

config.writeJson = function (jsonfile, document) {
	var writingText = JSONcomments.stringify(document, null, "\t");

	return when(
		nodefn.call(fs.writeFile, jsonfile, writingText)
	)
	.otherwise(function (err) {
		if (err) {
			return util.panic(err);
		}
	});
};

config.writeCjdmaidConf = function (document) {
	return config.writeJson(config.CJDMAID_CONFIG_PATH, document);
};


config.writeCustomConf = function (confname, document) {
	if (confname === config.CJDMAID_CONFIG_NAME) {
		return config.writeCjdmaidConf(document);
	}

	return when(
		config.readCjdmaidConf()
	)
	.then(function (cjdmaidJson) {
		return config.writeJson(cjdmaidJson[confname], document);
	});
};

config.writeCustomConfSafe = function (confname, document) {
	if (confname === config.CJDMAID_CONFIG_NAME) {
		return when(
			nodefn.call(fs.readFile, config.CJDMAID_CONFIG_PATH, "utf8")
		)
		.then(function (data) {
			var backup = util.expanduser("~/." +
				path.basedir(config.CJDMAID_CONFIG_PATH) + "-back");

			return nodefn.call(fs.writeFile, backup, data);
		})
		.then(function () {
			return config.writeCjdmaidConf(document);
		})
		.otherwise(function (err) {
			if (err) {
				return util.panic(err);
			}
		});
	}

	var cjdmaidJson;

	return when(
		config.readCjdmaidConf()
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
		return config.writeJson(cjdmaidJson[confname], document);
	})
	.otherwise(function (err) {
		if (err) {
			return util.panic(err);
		}
	});
};


module.exports = config;
