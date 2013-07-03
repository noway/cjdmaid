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

var assert = require("assert");
var when = require("when");
var timeout = require("when/timeout");
var util = require(__dirname + "/../lib/util");

/* global describe, it */

describe("util", function () {
	describe("#expanduser()", function () {
		it("should replace \"~\" to userdir", function () {
			assert.ok(util.expanduser("~") === process.env.HOME);
			assert.ok(util.expanduser("~/somestuff") ===
				process.env.HOME + "/somestuff");
		});
	});

	describe("#isDef()", function () {
		it("should be ok on defined vars", function () {
			var variable = 1;
			assert.ok(util.isDef(variable));
		});

		it("shouldn't be ok on declared but not defined vars", function () {
			var variable;
			assert.ok(!util.isDef(variable));
		});

		it("shouldn't be ok on undefined vars", function () {
			var variable = [];
			assert.ok(!util.isDef(variable[999]));
		});
	});

	describe("#isInt()", function () {
		it("should be ok on regular numbers", function () {
			assert.ok(util.isInt(1));
			assert.ok(util.isInt(2));
			assert.ok(util.isInt(255));
			assert.ok(util.isInt(256));
		});

		it("should be ok on big numbers", function () {
			assert.ok(util.isInt(3e9)); // 3 billion
		});

		it("should be ok on negative numbers", function () {
			assert.ok(util.isInt(-1));
			assert.ok(util.isInt(-3e9)); // -3 billion
		});

		it("shouldn't be ok on float", function () {
			assert.ok(!util.isInt(1.1));
			assert.ok(!util.isInt(-1.1));
			assert.ok(!util.isInt(3e-9)); // 3 * 10^-9
			assert.ok(!util.isInt(-3e-9)); // -3 * 10^-9
		});

		it("shouldn't be ok on strings", function () {
			assert.ok(!util.isInt(""));
			assert.ok(!util.isInt("1"));
			assert.ok(!util.isInt("-1"));
			assert.ok(!util.isInt("255"));
		});

		it("should be ok on numbers after conversions", function () {
			assert.ok(util.isInt(+"1"));
			assert.ok(util.isInt(Number("1")));
			assert.ok(util.isInt(parseInt("1", 10)));
		});
	});

	describe("#isObject()", function () {
		it("should be ok on {}", function () {
			assert.ok(util.isObject({}));
			assert.ok(util.isObject({k: "val"}));
		});
		it("shouldn't be ok on []", function () {
			assert.ok(!util.isObject([]));
		});
	});

	describe("#isArray()", function () {
		it("should be ok on []", function () {
			assert.ok(util.isArray([]));
		});

		it("shouldn't be ok on {}", function () {
			assert.ok(!util.isArray({}));
		});
	});

	describe("#cloneObject()", function () {
		it("should return equal object", function () {
			var obj = {k: "val", an: {k: "val"}};
			assert.deepEqual(obj, util.cloneObject(obj));
		});

		it("shouldn't make references ", function () {
			var obj = {k: "val", an: {k: "val"}};
			var clone = util.cloneObject(obj);
			obj.an = null;

			assert.notDeepEqual(obj, clone);
		});
	});

	describe("#deleteEmptyRows", function () {
		it("should delete rows with value \"\"", function () {
			var obj = {key: "", key2: "val"};
			var res = {key2: "val"};

			assert.deepEqual(util.deleteEmptyRows(obj), res);
		});

		it("should delete rows with value null", function () {
			var obj = {key: null, key2: "val"};
			var res = {key2: "val"};

			assert.deepEqual(util.deleteEmptyRows(obj), res);
		});
	});

	describe("#generatePassword()", function () {
		it("length should be correct", function (done) {
			var leng = 30;
			when(
				util.generatePassword(leng)
			)
			.then(function (result) {
				assert.ok(result.length === leng);
				done();
			});
		});

		it("should be fast enough", function (done) {
			var leng = 30;
			console.time("generatePassword");
			when(
				timeout(10, util.generatePassword(leng))
			)
			.then(function () {
				console.timeEnd("generatePassword");
				done();
			})
			.otherwise(function (err) {
				console.timeEnd("generatePassword");
				done(err);
			});
		});
	});
});
