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
var fs = require("fs");

var config = require(__dirname + "/lib/config");
var JSONcomments = require("json-comments-js");


var cjdmaidConf = {
	"cjdrouteConf": "Fill this: Path to your cjdroute.conf",
	"name": "Optional: Your nickname",
	"email": "Optional: Your email",
	"location": "Optional: Your location",
	"ip": "Optional: Enter your node external ip adress"
};

when(
	commfn.call(fs.exists, fs, config.CJDMAID_CONFIG_PATH)
)
.then(function (exists) {
	if (exists) {
		console.log(config.CJDMAID_CONFIG_PATH + " already exists");
		console.log("Now installed");
		process.exit(0);
		return when.reject();
	}

	return writeToFile(
		cjdmaidConf,
		config.CJDMAID_CONFIG_PATH,
		config.CONFIGS_COMMENTS.cjdmaidConf
	);
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

function writeToFile (doc, path, comment) {
	var deferred = when.defer();
	doc["/**/"] = "\n\t" + comment + "\n\t";

	var writingText = JSONcomments.stringify(doc, null, "\t");

	fs.writeFile(path, writingText, function (err) {
		if(err) {
			console.log("WARNING! " + path + " is not created! Here error: " +
				err + ". You need create it by yourself. ");
			deferred.resolve();
			return;
		}

		console.log(path + " saved!");
		deferred.resolve();
	});
	return deferred.promise;
}
