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
/* jshint maxdepth: 6, camelcase: false, quotmark: false */

"use strict";

var dgram = require("dgram");
var when = require("when");
var bencode = require("bencode");
var crypto = require("crypto");

var KEEPALIVE_INTERVAL_SECONDS = 2 * 1000;

function randomString(leng){
	var s = "";
	for (var i = 0; i < leng; i++) {
		var n = Math.floor(Math.random() * (10 + 26 + 26));

		if(n < 10) {
			s += n; //1-10
		}
		else if(n >= 10 && n < 10 + 26) {
			s += String.fromCharCode(n + (65 - 10)); //A-Z
		}
		else if (n >= 10 + 26 && n < 10 + 26 + 26) {
			s+= String.fromCharCode(n + (97 - (10 + 26))); //a-z
		}
	}
	return s;
}


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
		console.log("connection was closed");
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

	that._receiverThread = function () {
        if (that.timeOfLastSend + KEEPALIVE_INTERVAL_SECONDS < Date.now()) {
            if (that.timeOfLastRecv + (10 * 1000) < Date.now()) {
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
					console.log("message with no txid:");
					console.log(benc);
				}
			}
			//setTimeout(that._receiverThread, 10);
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



	that.sendAndRecv = function (msg, txid) { // <-- refactor
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
		var txid = randomString(10);

		return when(
			that.sendAndRecv("d1:q6:cookie4:txid10:" +
				txid + "e", txid)
		)
		.then(function (data) {
			var cookie = data.cookie;
			var txid = randomString(10);
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
					"Connect failed, incorrect admin password?\n" + data);
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

var admin = new Admin();
var session;

when(
	admin.connect("localhost", 11234, "ur3wjt40t0nn45wbvy55nlsf60g84gj")
)
.then(function (sess) {
	session = sess;
	return session.ping();
})
.then(function () {
	session.disconnect();
});
