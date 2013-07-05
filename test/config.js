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

var when    = require("when");
var assert  = require("assert");

var config = require(__dirname + "/../lib/config");


describe("config", function () {
	describe("#readJson()", function () {
		it("should return json", function (done) {
			var exampleJson = {"key": "val", "arr": [1, 2, 3]};
			when(
				config.readJson(__dirname + "/example.json")
			)
			.then(function (data) {
				assert.deepEqual(data, exampleJson);
				done();
			});
		});
	});

	describe("#readCjdmaidConf()", function () {
		it("should return something", function (done) {
			when(
				config.readCjdmaidConf()
			)
			.then(function (data) {
				assert.ok(data);
				done();
			});
		});
	});

	describe("#readCustomConf()", function () {
		it("cjdrouteConf should return something", function (done) {
			when(
				config.readCustomConf("cjdrouteConf")
			)
			.then(function (data) {
				assert.ok(data);
				done();
			});
		});

		it("cjdmaidConf should be same as readCjdmaidConf()", function (done) {
			var readCjdmaidConfResult;
			var readCustomConfResult;

			when(
				config.readCjdmaidConf()
			)
			.then(function (data) {
				readCjdmaidConfResult = data;
				return config.readCustomConf("cjdmaidConf");
			})
			.then(function (data) {
				readCustomConfResult = data;
				assert.deepEqual(readCjdmaidConfResult, readCustomConfResult);
				done();
			});
		});
	});

	describe("#readSeveralConfs()", function () {
		it("cjdrouteConf, cjdmaidConf should be as analogs", function (done) {
			var regularResults = [];

			when(
				config.readCustomConf("cjdmaidConf")
			)
			.then(function (data) {
				regularResults.push(data);
				return config.readCustomConf("cjdrouteConf");
			})
			.then(function (data) {
				regularResults.push(data);
				return config.readSeveralConfs("cjdmaidConf", "cjdrouteConf");
			})
			.then(function (data) {
				assert.deepEqual(regularResults, data);
				done();
			});
		});
	});


});
