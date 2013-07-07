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
var configpath = require(__dirname + "/../lib/configpath");

describe("configpath", function () {
	describe("#isPossible()", function () {
		var doc, docIter, configpathCopy;

		it("should return true if last type correct", function () {
			doc = { key: { key2: {} } };
			docIter = doc;
			assert.ok(configpath.isPossible(
				["key", "key2"],
				docIter,
				"object"
			));


			doc = { key: { key2: [] } };
			docIter = doc;
			assert.ok(configpath.isPossible(
				["key", "key2"],
				docIter,
				"array"
			));
		});

		it("should return false if last type incorrect", function () {
			doc = { key: { key2: [] } };
			docIter = doc;
			assert.ok(!configpath.isPossible(
				["key", "key2"],
				docIter,
				"object"
			));


			doc = { key: { key2: {} } };
			docIter = doc;
			assert.ok(!configpath.isPossible(
				["key", "key2"],
				docIter,
				"array"
			));
		});
	});
});
