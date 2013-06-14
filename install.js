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
var when = require("when");
var fs = require("fs");

var config = require(__dirname + "/lib/config");



var cjdrouteNodesConf = {
	"authorizedPasswords": [],
	"interfaces": {
		"UDPInterface": [ { "connectTo": {} } ]
	},
	"router": {
		"ipTunnel":	{ "allowedConnections": [],	"outgoingConnections": [] }
	}
};

var cjdmaidConf = {
	"cjdrouteConf": "Fill this: Path to your cjdroute.conf",
	"cjdrouteNodesConf": "/etc/cjdroute.nodes.conf",
	"cjdrouteTempConf": "/tmp/cjdroute.temp.conf",
	"cjdrouteBinary": "Fill this: Path to cjdroute binary",
	"name": "Fill this: Enter your nickname here",
	"email": "Fill this: Your email",
	"location": "Fill this: Your location",
	"address": "Fill this: Enter your node address in format ip:port"
};


writeToFile(
	cjdrouteNodesConf,
	cjdmaidConf.cjdrouteNodesConf,
	config.CONFIGS_COMMENTS.cjdrouteNodesConf
)
.yield(
	writeToFile(
		cjdmaidConf,
		config.CJDMAID_CONFIG_PATH,
		config.CONFIGS_COMMENTS.cjdmaidConf
	)
)
.then(function() {
	var editor = process.env.EDITOR || "nano";

	console.log("Editing " + config.CJDMAID_CONFIG_PATH + "...");
	var child = childProcess.spawn(editor,	[config.CJDMAID_CONFIG_PATH], {
		stdio: "inherit"
	});

	child.on("exit", function (/* code, signal */) {
		console.log("User close editor!");
		console.log("Now installed");
	});
});

function writeToFile (doc, path, comment) {
	var deferred = when.defer();
	var writingText = JSON.stringify(doc, null, "\t");

	writingText = "/*\n" + comment + "*/\n\n" + writingText;

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
