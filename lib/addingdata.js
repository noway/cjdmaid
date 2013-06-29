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

/** private properties **/

var util = require(__dirname + "/util");
var commfn = require(__dirname + "/commander/function");
var program = require("commander");
var when = require("when");

/** public properties **/

function Addingdata(options) {
	if (!(this instanceof Addingdata)) {
		return new Addingdata();
	}

	options = options || {};
	var that = this;

	that.addingData = {};
	that.addingKeys = options.addingKeys;
	that.onlyOne = options.onlyOne || false;

	that.setDataField = function (key, value) {
		if (!util.isDef(value)) {
			return;
		}

		if (that.addingKeys.indexOf(key) !== -1){
			that.addingData[key] = value;
		} else {
			that.addingKeys.push(key);
			that.addingData[key] = value;
		}
	};

	that.promptFieldEdit = function (field) {
		return when(
			commfn.call(program.prompt, program, field + ": ")
		)
		.then(function (data) {
			that.setDataField(field, data);
		});
	};

	that.promptFieldAdd = function(field) {
		if (util.isDef(field)) {
			that.addingKeys.push(field);

			return when(
				commfn.call(program.prompt, program, field + ": ")
			)
			.then(function (data) {
				that.setDataField(field, data);
			});
		}
		else {
			var newfield;

			return when(
				commfn.call(program.prompt, program, "Field name: ")
			)
			.then(function (data) {
				newfield = data;

				if (!newfield.length) {
					return when.reject();
				}

				return commfn.call(program.prompt, program, newfield + ": ");
			}).then(function (data) {
				that.setDataField(newfield, data);
			});
		}
	};

	that.promptMissingFields = function () {
		var neededData = {};
		for (var i = 0; i < that.addingKeys.length; i++) {
			if (!util.isDef(that.addingData[that.addingKeys[i]])) {
				neededData[that.addingKeys[i]] = that.addingKeys[i] + ": ";
			}
		}

		return when(
			commfn.call(program.prompt, program, neededData)
		)
		.then(function (data) {
			for (var i in data) {
				if (data.hasOwnProperty(i)) {
					that.setDataField(i, data[i]);
				}
			}
		});
	};

	that.chooseRemoveField = function () {
		var deferred = when.defer();

		console.log("");
		for (var i = 0; i < that.addingKeys.length; i++) {
			console.log("[" + (i + 1) + "] Remove \"" + that.addingKeys[i] +
				"\" (" + that.addingData[that.addingKeys[i]] + ")");
		}

		console.log("");
		console.log("[n] Cancel");
		console.log("");

		program.prompt(
			"What you want remove [n]?: ",
			function askRemovingDataLine(data) {

				switch (data.toLowerCase()) {
				case "":
				case "n":
					return deferred.resolve();

				default:
					var index = parseInt(data, 10) - 1;

					if (index < 0 ||
						index >= that.addingKeys.length ||
						isNaN(index)) {

						console.log("No such option");
						return program.prompt("What you want remove [n]?: ",
							that.askRemovingDataLine);
					}
					delete that.addingData[that.addingKeys[index]];
					that.addingKeys.splice(index, 1);
					return deferred.resolve();
				}
			}
		);
		return deferred.promise;
	};

	that.chooseAction = function () {

		function noSuchOption() {
			console.log("No such option");
			return program.prompt("What you want to do [y]?: ",
				that.askAddingDataLine);
		}

		var deferred = when.defer();

		console.log("");

		for (var i = 0; i < that.addingKeys.length; i++) {
			console.log("[" + (i + 1) + "] Edit \"" + that.addingKeys[i] +
				"\" (" + that.addingData[that.addingKeys[i]] + ")");
		}

		console.log("");

		if (!that.onlyOne) {
			console.log("[a] Add new field");
			console.log("[r] Remove field");
		}
		console.log("[y] Continue");
		console.log("[n] Cancel");

		console.log("");

		program.prompt(
			"What you want to do [y]?: ",
			function askAddingDataLine(data) {
				switch (data.toLowerCase()) {

				case "a":
					if (that.onlyOne) {
						return noSuchOption();
					}
					return when(
						that.promptFieldAdd()
					)
					.then(function () {
						that.chooseAction();
					});

				case "r":
					if (that.onlyOne) {
						return noSuchOption();
					}
					return when(
						that.chooseRemoveField()
					)
					.then(function () {
						that.chooseAction();
					});

				case "y":
				case "":
					return deferred.resolve();

				case "n":
					console.log("exiting...");
					return process.stdin.destroy();

				default:
					var index = parseInt(data, 10) - 1;

					if (index < 0 ||
						index >= that.addingKeys.length ||
						isNaN(index)) {

						return noSuchOption();
					}

					return when(
						that.promptFieldEdit(that.addingKeys[index])
					)
					.then(function () {
						that.chooseAction();
					});
				}
			}
		);
		return deferred.promise;
	};
}


module.exports = Addingdata;
