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

"use strict";

var when    = require("when");
var dgram   = require("dgram");
var crypto  = require("crypto");
var bencode = require("bencode");
var timeout = require("when/timeout");

var util   = require(__dirname + "/util");
var config = require(__dirname + "/config");

var KEEPALIVE_INTERVAL = 2 * 1000;
var KEEPALIVE_TIMEOUT = 10 * 1000;
var QUERY_TIMEOUT = 2.5 * 1000;


function Udp(host, port) {
	if (!(this instanceof Udp)) {
		return new Udp();
	}
	var that = this;

	that.host = host;
	that.port = port;
	that.running = true;

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
}

Udp.prototype.send = function (msg) {
	var that = this;
	var message = new Buffer(msg);

	that.client.send(
		message,
		0,
		message.length,
		that.port,
		that.host,
		function (err/*, bytes*/) {
			if (!that.running) {
				return;
			}

			if (err) {
				return util.panic(err);
			}
		}
	);
};

Udp.prototype.recv = function () {
	var that = this;

	that.deferred = when.defer();
	return timeout(that.deferred.promise, QUERY_TIMEOUT);
};

Udp.prototype.close = function () {
	var that = this;

	var err = new Error("client disconnect");
	that.deferred.reject(err);
	that.running = false;
	that.client.close();
};



function Session (parent) {
	if (!(this instanceof Session)) {
		return new Session();
	}

	var that = this;

	that.parent = parent;

	that.disconnect = function () {
		that.parent.disconnect();
	};
}

Session.prototype.functions = function() {
	return this._functions;
};



function Admin() {
	if (!(this instanceof Admin)) {
		return new Admin();
	}

	var that = this;

	that.udp = null;
	that.session = null;

	that.timeOfLastRecv = 0;
	that.timeOfLastSend = 0;

	that.queries = {};
	that.streams = {};

	that.password = null;
}

Admin.prototype._receiverThread = function () {
	var that = this;

	if (!that.udp.running) {
		return;
	}

	if (Date.now() > that.timeOfLastSend + KEEPALIVE_INTERVAL) {
		if (Date.now() > that.timeOfLastRecv + KEEPALIVE_TIMEOUT) {
			var err = new Error("ping timeout");
			return util.panic(err);
		}
		that.udp.send("d1:q18:Admin_asyncEnabled4:txid8:keepalive");
		that.timeOfLastSend = Date.now();
	}

	when(
		that.udp.recv()
	)
	.otherwise(function (err) {
		if (err.message === "client disconnect") {
			for (var i in that.queries) {
				if (that.queries.hasOwnProperty(i)) {
					that.queries[i].reject();
				}
			}
			for (var j in that.streams) {
				if (that.streams.hasOwnProperty(j)) {
					that.streams[j] = false;
				}
			}
			return when.reject();
		}

		if (util.isDef(err) &&
			err.message.substr(0, "timed out".length) === "timed out") {
			return { error: "timeout" };
		}

		if (err) {
			return when.reject(err);
		}
	})
	.then(function (data) {
		if (data.error === "timeout") {
			that._receiverThread();
			return;
		}

		var benc = bencode.decode(data.msg, "ascii");

		if (benc.txid === "keepaliv") {
			if (benc.asyncEnabled === 0) {
				var err = new Error("lost session");
				return when.reject(err);
			}
			that.timeOfLastRecv = Date.now();
		}
		else {
			if (util.isDef(that.queries[benc.txid])) {
				that.queries[benc.txid].resolve(benc);
				delete that.queries[benc.txid];
			}
			else if (util.isDef(that.streams[benc.streamId])) {
				console.log("Got message from stream:");
				console.log(benc);
			}
			else {
				console.log("Got message with not traceable txid:");
				console.log(benc);
			}
		}
		that._receiverThread();
	})
	.otherwise(function (err) {
		if (err) {
			return util.panic(err);
		}
	});
};

Admin.prototype._functionFabric = function (funcName, argList, oargList) {
	var that = this;

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
		return that.callFunc(funcName, callArgs);
	};
};

Admin.prototype.fetchAllFunctions = function (page, funcs) {
	var that = this;

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

		if (util.isDef(benc.more)) {
			return that.fetchAllFunctions(page + 1, funcs);
		} else {
			return when.resolve(funcs);
		}
	});
};

Admin.prototype.sendAndRecv = function (msg, txid) {
	var that = this;

	if (!that.udp.running) {
		return when.reject();
	}

	var defered = when.defer();
	that.queries[txid] = defered;

	that.udp.send(msg);

	return when(
		timeout(defered.promise, QUERY_TIMEOUT)
	)
	.otherwise(function (err) {

		if (util.isDef(err) &&
			err.message.substr(0, "timed out".length) === "timed out") {
			return { error: "timeout" };
		}

		return when.reject(err);
	})
	.then(function (data) {
		return data;
	});
};

Admin.prototype.callFunc = function (funcName, args) {
	var that = this;

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
		if (data.error === "disconnect") {
			return when.reject();
		}

		if (data.error) {
			var err = new Error("can't get cookie");
			when.reject(err);
		}
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
	})
	.then(function (data) {
		if (data.error === "disconnect") {
			return when.reject();
		}
		if (data.error) {
			var err = new Error("can't receive result");
			when.reject(err);
		}

		if (util.isDef(data.streamId) &&
			data.error === "none") {

			that.streams[data.streamId] = true;
		}
		return data;
	});
};

Admin.prototype.connect = function (ipAddr, port, password) {
	var that = this;

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
			var err = new Error("looks like " + data.rinfo.address + ":" +
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

				for (var arg in func) {
					if (func.hasOwnProperty(arg)) {
						argList.push(arg);

						if (func[arg].required) {
							rargList.push(arg);
						} else {
							oargList[arg] =
								(func[arg].type === "Int") ? "0" : "";
						}
					}
				}

				funcArgs[i] = rargList;
				funcOargs[i] = oargList;

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
		if (util.isDef(data.error)) {
			var err = new Error(
				"can't connect: " + data.error);
			throw err;
		}

		that.session = new Session(that);

		that.session._functions = [];

		var funcOargsC = {};
		for (var func in funcOargs) {
			if (funcOargs.hasOwnProperty(func)) {
				funcOargsC[func] = [];
				for (var key in funcOargs[func]) {
					if (funcOargs[func].hasOwnProperty(key)) {
						var kstr = funcOargs[func][key];
						kstr = (kstr === "") ? "\"\"" : kstr;
						funcOargsC[func].push(key + "=" + kstr);
					}
				}
			}
		}

		for (var func2 in availableFunctions) {
			if (availableFunctions.hasOwnProperty(func2)) {
				var arr = funcArgs[func2].concat(funcOargsC[func2]);
				that.session._functions.push(func2 + "(" +
					arr.join(", ") + ")");
			}
		}

		return that.session;
	})
	.otherwise(function (err) {
		that.disconnect(); // clean up
		return when.reject(err); // forward error
	});
};

Admin.prototype.connectWithAdminInfo = function () {
	var that = this;

	return when(
		config.readCustomConf("cjdnsadminConf")
	)
	.then(function (data) {
		return that.connect(data.addr, data.port, data.password);
	});
};

Admin.prototype.unsubscribeAll = function () {
	// var that = this;
	var deferreds = [];

	// AdminLog_unsubscribe not working.
	// Looks like bug in cjdns
	/*
	for(var i in that.streams) {
		if (that.streams.hasOwnProperty(i)) {
			// deferreds.push(that.session.AdminLog_unsubscribe(i));
		}
	}
	*/
	return when.all(deferreds);
};

Admin.prototype.disconnect = function () {
	var that = this;

	return when(
		that.unsubscribeAll()
	)
	.then(function (/* data */) {
		that.udp.close();
	})
	.otherwise(function (err) {
		if (err) {
			return util.panic(err);
		}
	});
};


module.exports = Admin;
