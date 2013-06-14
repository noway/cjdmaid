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

var cjdmaid = {
	"cjdrouteConf": "Fill this: Path to your cjdroute.conf",
	"cjdrouteNodesConf": "/etc/cjdroute.nodes.conf",
	"cjdrouteTempConf": "/tmp/cjdroute.temp.conf",
	"cjdrouteBinary": "Fill this: Path to cjdroute binary",
	"name": "Fill this: Enter your nickname here",
	"email": "Fill this: Your email",
	"location": "Fill this: Your location",
	"address": "Fill this: Enter your node address in format ip:port"
};

config.writeCustomConf("cjdrouteNodesConf", cjdrouteNodesConf)
.yield(config.writeCustomConf("cjdmaidConf", cjdmaid))
.then(function () {
	console.log("installed");
	process.exit(0);
});


/*
function writeToFile (doc, path, comment, callback) {
	var result_json = JSON.stringify(doc, null, "\t");

	result_json = comment + result_json;

	fs.writeFile(path, result_json, function (err) {
		if(err) {
			console.log("WARNING! " + path + " is not created! Here error" +
				err + ". You need create it by yourself");
			callback();
			return;
		}

		console.log(path + " saved!");
		callback();
	});
}
*/
