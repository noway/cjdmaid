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
var configpath = {};

/** public properties **/

function Configpath(configPath, docIter, lastType) {
	if (!(this instanceof Configpath)) {
		return new Configpath();
	}

	this.configPath = configPath;
	this.docIter = docIter;
	this.lastType = lastType;

	this.isLast = false;

	this.nextKey = null;
	this.currentKey = null;
}

Configpath.prototype._initObject = function () {
	if (this.isLast) {
		if (this.lastType === "array") {
			this.docIter[this.currentKey] = [];
		}
		else {
			this.docIter[this.currentKey] = {};
		}
	}
	else if (util.isInt(this.nextKey)) {
		this.docIter[this.currentKey] = []; // array
	}
	else {
		this.docIter[this.currentKey] = {}; // object
	}
};

Configpath.prototype._checkObject = function () {
	if (this.isLast) {
		if (this.lastType === "array") {
			if (!util.isArray(this.docIter[this.currentKey])) {
				return false;
			}
		}
		else {
			if (!util.isObject(this.docIter[this.currentKey])) {
				return false;
			}
		}
	}
	else if (util.isInt(this.nextKey)) {
		if (!util.isArray(this.docIter[this.currentKey])) {
			return false;
		}
	}
	else {
		if (!util.isObject(this.docIter[this.currentKey])) {
			return false;
		}
	}
	return true;
};

Configpath.prototype._updateVars = function (i) {
	this.currentKey = this.configPath[i];

	if (i >= this.configPath.length - 1) {
		this.isLast = true;
	}
	else {
		this.isLast = false;
	}

	if (!this.isLast) {
		this.nextKey = this.configPath[i + 1];
	}
	else {
		this.nextKey = null;
	}
};

Configpath.prototype.isPossible = function () {
	for (var i = 0; i < this.configPath.length; i++) {
		this._updateVars(i);

		if (!util.isDef(this.docIter[this.currentKey])) {
			this._initObject();

			this.docIter = this.docIter[this.currentKey];
			continue;
		}

		if (this._checkObject()) {
			this.docIter = this.docIter[this.currentKey];
			continue;
		}

		return false;
	}

	return { "pointer": this.docIter }; // objects are always pointers so
};

// So we left just 1 function for working with all of this.

configpath.isPossible = function (configPath, docIter, last) {
	var configpathCopy = new Configpath(configPath, docIter, last);
	return configpathCopy.isPossible();
};

module.exports = configpath;
