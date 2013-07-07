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
		var path, doc, docIter;
		var result, pointer;

		it("should return positive value if last type correct", function () {
			path = ["key", "key2"];
			doc = { key: { key2: {} } };
			docIter = doc;

			assert.ok(configpath.isPossible(path, docIter, Object));


			path = ["key", "key2"];
			doc = { key: { key2: [] } };
			docIter = doc;

			assert.ok(configpath.isPossible(path, docIter, Array));
		});

		it("should return false if last type incorrect", function () {
			path = ["key", "key2"];
			doc = { key: { key2: [] } };
			docIter = doc;

			assert.ok(!configpath.isPossible(path, docIter, Object));


			path = ["key", "key2"];
			doc = { key: { key2: {} } };
			docIter = doc;

			assert.ok(!configpath.isPossible(path, docIter, Array));
		});

		it("should initialize undefined nodes", function () {
			path = ["key", "key2", "key3"];
			doc = { key: {} };
			docIter = doc;
			result = { key: { key2: { key3: {} } } };

			configpath.isPossible(path, docIter, Object);
			assert.deepEqual(doc, result);


			path = ["key", "key2", "key3"];
			doc = { key: {} };
			docIter = doc;
			result = { key: { key2: { key3: [] } } };

			configpath.isPossible(path, docIter, Array);
			assert.deepEqual(doc, result);
		});

		it("should return pointer to last node", function () {
			path = ["key", "key2"];
			doc = { key: { key2: {} } };
			docIter = doc;
			result = { key: { key2: { test: "val" } } };

			pointer =
				configpath.isPossible(path, docIter, Object).pointer;
			pointer.test = "val";
			assert.deepEqual(doc, result);


			path = ["key", "key2"];
			doc = { key: { key2: [] } };
			docIter = doc;
			result = { key: { key2: [1, 2, 3] } };

			pointer =
				configpath.isPossible(path, docIter, Array).pointer;
			pointer.push(1, 2, 3);
			assert.deepEqual(doc, result);
		});
	});
});
