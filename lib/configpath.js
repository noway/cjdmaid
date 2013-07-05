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

/** public properties **/

function Configpath(configPath, docIter, last) {
	if (!(this instanceof Configpath)) {
		return new Configpath();
	}

	this.configPath = configPath;
	this.docIter = docIter;
	this.last = last;

	this.isLast = false;

	this.next = null;
	this.current = null;
}

Configpath.prototype._initObject = function () {
	if (this.isLast) {
		if (this.last === "array") {
			this.docIter[this.current] = [];
		}
		else {
			this.docIter[this.current] = {};
		}
	}
	else if (util.isInt(this.next)) {
		this.docIter[this.current] = []; // array
	}
	else {
		this.docIter[this.current] = {}; // object
	}
};

Configpath.prototype._checkObject = function () {
	if (this.isLast) {
		if (this.last === "array") {
			if(!util.isArray(this.docIter[this.current])) {
				return false;
			}
		}
		else {
			if(!util.isObject(this.docIter[this.current])) {
				return false;
			}
		}
	}
	else if (util.isInt(this.next)) {
		if(!util.isArray(this.docIter[this.current])) {
			return false;
		}
	}
	else {
		if(!util.isObject(this.docIter[this.current])) {
			return false;
		}
	}
	return true;
};

Configpath.prototype.isPossible = function () {

	for (var i = 0; i < this.configPath.length; i++) {
		if (i + 1 >= this.configPath.length) {
			this.isLast = true;
		}
		this.current = this.configPath[i];

		if (!this.isLast) {
			this.next = this.configPath[i + 1];
		} else {
			this.next = null;
		}

		if (!util.isDef(this.docIter[this.current])) {
			this._initObject();

			this.docIter = this.docIter[this.current];
			continue;
		}

		if (!this._checkObject()) {
			return false;
		}

		this.docIter = this.docIter[this.current];
	}

	return {"pointer": this.docIter}; // objects are always pointers so
};



module.exports = Configpath;
