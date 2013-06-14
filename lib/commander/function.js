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

// commander.js async style functions

"use strict";

var when = require("when");

function uncurryThis(f) {
	var call = Function.call;
	return function () {
		return call.apply(f, arguments);
	};
}

var arraySlice = uncurryThis(Array.prototype.slice);

exports.apply = function (func, parent, args) {
	var deferred = when.defer();
	args.push(exports.createCallback(deferred.resolver));
	func.apply(parent, args);
	return deferred.promise;
};

exports.call = function (func, parent) {
	return exports.apply(func, parent, arraySlice(arguments, 2));
};

exports.lift = function (func, parent) {
	var args = arraySlice(arguments, 2);
	return function () {
		return exports.apply(func, parent, args.concat(arraySlice(arguments)));
	};
};

exports.createCallback = function (resolver) {
	return function (value) {
		if(arguments.length > 2) {
			resolver.resolve(arraySlice(arguments, 0));
		} else {
			resolver.resolve(value);
		}
	};
};
