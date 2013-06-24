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
/* jshint maxdepth: 6, camelcase: false */
// туду: +проверить с разными функциями, +поработать на выводом
"use strict";

var dgram = require("dgram");
var when = require("when");
var crypto = require("crypto");

var bencode = require("bencode");
var util = require(__dirname + "/util");

var KEEPALIVE_INTERVAL = 2 * 1000;
var KEEPALIVE_TIMEOUT = 10 * 1000;


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
	});

	that.client.on("error", function (err) {
		console.error("got client error " + err);
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


function Session (udp) {
	if (!(this instanceof Session)) {
		return new Session();
	}

	var that = this;

	that.udp = udp;
	that.messages = {};


	that.disconnect = function () {
		that.udp.close();
	};

	that.functions = function () {
		console.log(that._functions);
	};
}

function Admin() {
	if (!(this instanceof Admin)) {
		return new Admin();
	}

	var that = this;

	that.timeOfLastRecv = 0;
	that.timeOfLastSend = 0;
	that.queries = {};


	that._receiverThread = function () {
		if (Date.now() > that.timeOfLastSend + KEEPALIVE_INTERVAL) {
			if (Date.now() > that.timeOfLastRecv + KEEPALIVE_TIMEOUT) {
				var err = new Error("ping timeout");
				throw err;
			}
			console.log("sending keepalive");
			that.udp.send("d1:q18:Admin_asyncEnabled4:txid8:keepalive");
			that.timeOfLastSend = Date.now();
		}

		return when(
			that.udp.recv()
		)
		.then(function (data) {
			var benc = bencode.decode(data.msg, "ascii");

			if (benc.txid === "keepaliv") {
				if (benc.asyncEnabled === 0) {
					var err = new Error("lost session");
					throw err;
				}
				that.timeOfLastRecv = Date.now();
			}
			else {
				if (typeof that.queries[benc.txid] !== "undefined") {
					that.queries[benc.txid].resolve(benc);
					delete that.queries[benc.txid];
				}
				else {
					console.log("Got message with not traceable txid:");
					console.log(benc);
				}
			}
			that._receiverThread();
		});
	};

	that._functionFabric = function (funcName, argList, oargList) {
		return function () {
			var callArgs = {};
			for (var key in oargList) {
				if (oargList.hasOwnProperty(key)) {
					callArgs[key] = oargList[key];
				}
			}

			for (var i = 0; i < argList.length; i++) {
				if (i < arguments.length) {
					callArgs[argList[i]] = arguments[i];
				}
			}
			return when(
				that.callFunc(funcName, callArgs)
			).then(function (data) {
				console.log(data);
			});
		};
	};

	that.fetchAllFunctions = function (page, funcs) {
		page = page || 0;
		funcs = funcs || {};

		that.udp.send("d1:q24:Admin_availableFunctions4:argsd4:pagei" +
			page + "eee");

		return when(
			that.udp.recv()
		)
		.then(function (data) {
			var benc = bencode.decode(data.msg, "ascii");

			for (var i in benc.availableFunctions) {
				if (benc.availableFunctions.hasOwnProperty(i)) {
					funcs[i] = benc.availableFunctions[i];
				}
			}

			if (typeof benc.more !== "undefined") {
				return that.fetchAllFunctions(page + 1, funcs);
			} else {
				return when.resolve(funcs);
			}
		});
	};

	that.sendAndRecv = function (msg, txid) {
		var defered = when.defer();
		that.queries[txid] = defered;

		that.udp.send(msg);

		return when(
			defered.promise
		)
		.then(function (data) {
			return data;
		});
	};

	that.callFunc = function (funcName, password, args) {
		args = args || {};
		var txid;
		var cookie;

		return when(
			util.generatePassword(10)
		)
		.then(function (string) {
			txid = string;
			return that.sendAndRecv("d1:q6:cookie4:txid10:" + txid + "e",
				txid);
		})
		.then(function (data) {
			cookie = data.cookie;
			return util.generatePassword(10);
		})
		.then(function (string) {
			txid = string;

			var req = {
				"q": "auth",
				"aq": funcName,
				"hash": crypto.createHash("sha256")
					.update(that.password + cookie).digest("hex"),
				"cookie": cookie,
				"args": args,
				"txid": txid
			};

			var reqBenc = bencode.encode(req);
			req.hash = crypto.createHash("sha256")
				.update(reqBenc).digest("hex");
			reqBenc = bencode.encode(req);

			return that.sendAndRecv(reqBenc, txid);
		});
	};

	that.connect = function (ipAddr, port, password) {
		var availableFunctions;
		var funcArgs = {};
		var funcOargs = {};

		that.udp = new Udp(ipAddr, port);
		that.password = password;

		that.udp.send("d1:q4:pinge");

		return when(
			that.udp.recv()
		)
		.then(function (data) {
			if (data.msg.toString() !== "d1:q4:ponge") {
				var err = new Error("Looks like " + data.rinfo.address + ":" +
					data.rinfo.port + " is to a non-cjdns socket.");
				throw err;
			}
			return that.fetchAllFunctions();
		})
		.then(function (funcs) {
			availableFunctions = funcs;

			for (var i in availableFunctions) {
				if (availableFunctions.hasOwnProperty(i)) {
					var func = availableFunctions[i];

					var argList = [];
					var rargList = [];
					var oargList = {};

					funcArgs[i] = rargList;
					funcOargs[i] = oargList;

					for (var arg in func) {
						if (func.hasOwnProperty(arg)) {
							argList.push(arg);

							if (func[arg].required) {
								rargList.push(arg);
							} else {
								oargList[arg] =
									(func[arg].type === "Int") ? "\"\"" : "0";
							}
						}
					}
					Session.prototype[i] = that._functionFabric(i, argList,
						oargList);
				}
			}
			that.timeOfLastRecv = Date.now();
			that.timeOfLastSend = Date.now();
			that._receiverThread();

			return that.callFunc("ping", {});
		})
		.then(function (data) {
			if (typeof data.error !== "undefined") {
				var err = new Error(
					"Error while connecting. " + data.error);
				throw err;
			}
			var session = new Session(that.udp);

			session._functions = "";

			var funcOargsC = {};
			for (var func in funcOargs) {
				if (funcOargs.hasOwnProperty(func)) {
					funcOargsC[func] = [];
					for (var key in funcOargs[func]) {
						if (funcOargs[func].hasOwnProperty(key)) {
							funcOargsC[func] = key + "=" +
								funcOargs[func][key];
						}
					}
				}
			}

			for (var func2 in availableFunctions) {
				if (availableFunctions.hasOwnProperty(func2)) {
					var arr = funcArgs[func2].concat(funcOargsC[func2]);
					session._functions += (func2 + "(" +
						arr.join(", ") + ")\n");
				}
			}

			return session;
		})
		.otherwise(function (err) {
			console.error(err);
			that.disconnect();
		});
	};

	that.disconnect = function () {
		return that.udp.close();
	};
}

module.exports = Admin;

/*
var admin = new Admin();
var session;

when(
	admin.connect("localhost", 11234, "already changed")
)
.then(function (sess) {
	session = sess;
	session.functions();
	return session.ping();
})
.then(function () {
	session.disconnect();
});
*/
