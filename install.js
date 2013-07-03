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

var childProcess = require("child_process");
var commfn = require(__dirname + "/lib/commander/function");
var when = require("when");
var nodefn = require("when/node/function");
var fs = require("fs");

var config = require(__dirname + "/lib/config");
var util = require(__dirname + "/lib/util");
var JSONcomments = require("json-comments-js");


var cjdmaidConf = {
	"cjdrouteConf": "Fill this: Path to your cjdroute.conf",
	"ownNodeData": {
		"name": "Optional: Your nickname",
		"email": "Optional: Your email",
		"location": "Optional: Your location",
		"ip": "Optional: Enter your node external ip adress"
	}
};

when(
	commfn.call(fs.exists, fs, config.CJDMAID_CONFIG_PATH)
)
.then(function (exists) {
	if (exists) {
		console.log(config.CJDMAID_CONFIG_PATH + " already exists");
		return when(
			config.readCustomConf("cjdmaidConf")
		)
		.then(function (data) {
			if (util.isDef(data.ownNodeData)) {
				console.log("Now installed");
			}
			else {
				data.ownNodeData = {
					"name": data.name,
					"email": data.email,
					"location": data.location,
					"ip": data.ip
				};
				var pushObject = util.cloneObject(data);

				delete pushObject.name;
				delete pushObject.email;
				delete pushObject.location;
				delete pushObject.ip;

				return when(
					config.writeCustomConf("cjdmaidConf", pushObject)
				)
				.then(function () {
					console.log("Now installed");
				});
			}
		})
		.then(function () {
			return when.reject();
		});
	}

	cjdmaidConf["/**/"] = "\n\t" +
		config.CONFIGS_COMMENTS.cjdmaidConf + "\n\t";

	var writingText = JSONcomments.stringify(cjdmaidConf, null, "\t");

	return when(
		nodefn.call(fs.writeFile, config.CJDMAID_CONFIG_PATH, writingText)
	)
	.then(function () {
		console.log(config.CJDMAID_CONFIG_PATH + " saved!");
	})
	.otherwise(function (err) {
		if (err) {
			console.log("WARNING! " + config.CJDMAID_CONFIG_PATH + " " +
				"is not created! Here error: " + err + ". " +
				"You need create it by yourself. ");
		}
	});
})
.then(function() {
	var editor = process.env.EDITOR || "nano";

	console.log("Editing " + config.CJDMAID_CONFIG_PATH + "...");
	var child = childProcess.spawn(editor, [config.CJDMAID_CONFIG_PATH], {
		stdio: "inherit"
	});

	child.on("exit", function (/* code, signal */) {
		console.log("User close editor!");
		console.log("Now installed");
	});
});
