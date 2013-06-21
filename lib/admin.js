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

var dgram = require("dgram");
var when = require("when");
var bencode = require("bencode");

function Udp(host, port) {
	if (!(this instanceof Udp)) {
		return new Udp();
	}
	var that = this;

	that.host = host;
	that.port = port;

	that.client = dgram.createSocket("udp4");
	that.deferred = null;

	that.client.on("message", function (msg, rinfo) {
		that.deferred.resolve({ msg: msg, rinfo: rinfo });
	});

	that.client.on("close", function () {
		console.log("client closed");
	});

	that.client.on("error", function (err) {
		console.log("got client error " + err);
	});

	that.send = function (msg) {
		var message = new Buffer(msg);

		that.client.send(
			message,
			0,
			message.length,
			that.port,
			that.host,
			function (err, bytes) {
				if (err) {
					console.error("Error spotted (" + bytes + " bytes):");
					console.error(err);
				}
			}
		);
	};

	that.recv = function () {
		that.deferred = when.defer();
		return that.deferred.promise;
	};

	that.close = function () {
		that.client.close();
	};
}


function Admin() {
	if (!(this instanceof Admin)) {
		return new Admin();
	}

	var that = this;

	that.udp = new Udp("localhost", 11234);

	that._fetchAllFunctions = function (page, funcs) {
		page = page || 0;
		funcs = funcs || {};

		that.udp.send("d1:q24:Admin_availableFunctions4:argsd4:pagei" +
			page + "eee");

		return when(
			that.udp.recv()
		)
		.then(function (data) {
			var benc = bencode.decode(data.msg);

			for (var i in benc.availableFunctions) {
				if (benc.availableFunctions.hasOwnProperty(i)) {
					funcs[i] = benc.availableFunctions[i];
				}
			}

			if (typeof benc.more !== "undefined") {
				return that._fetchAllFunctions(page + 1, funcs);
			} else {
				return when.resolve(funcs);
			}
		});
	};

	that.connect = function () {

		that.udp.send("d1:q4:pinge");

		when(
			that.udp.recv()
		)
		.then(function (data) {
			if (data.msg.toString() !== "d1:q4:ponge") {
				var err = new Error("Looks like " + data.rinfo.address + ":" +
					data.rinfo.port + " is to a non-cjdns socket.");
				throw err;
			}
			return that._fetchAllFunctions();
		})
		.then(function (funcs) {
			console.log(funcs);
			that.udp.close();
		});

	};
}

var admin = new Admin();

admin.connect();
