require("./constants");

global.S_UP = 1,
global.S_RIGHT = 2,
global.S_DOWN = 3,
global.S_LEFT = 4,

global.ERR_TOO_CLOSE_TO_SUN = -1;

module.exports = {
	Pos: function(x, y) {
		if(arguments.length == 2) {
			this.x = Number(x);
			this.y = Number(y);
		} else if(typeof x == "object") {
			if(	x.hasOwnProperty("body") 			&&
				x.body.hasOwnProperty("vector") 	&&
				x.body.vector.hasOwnProperty("x") 	&&
				x.body.vector.hasOwnProperty("y")) 	{
				this.x = x.body.vector.x;
				this.y = x.body.vector.y;
			}
		}
		return {x: this.x, y: this.y};
	},

	Line: function(p1, p2) {
		return {p1, p2};
	},

	lineIntersect: function(line1, line2) {
		var pos1 = line1.p1; var pos2 = line1.p2;
		var pos3 = line2.p1; var pos4 = line2.p2;
		if ((pos1.x === pos2.x && pos1.y === pos2.y) || (pos3.x === pos4.x && pos3.y === pos4.y)) {
			return false;
		}

		denominator = ((pos4.y - pos3.y) * (pos2.x - pos1.x) - (pos4.x - pos3.x) * (pos2.y - pos1.y));
		// Lines are parallel
		if (denominator === 0) {
			return false;
		}

		let ua = ((pos4.x - pos3.x) * (pos1.y - pos3.y) - (pos4.y - pos3.y) * (pos1.x - pos3.x)) / denominator;
		let ub = ((pos2.x - pos1.x) * (pos1.y - pos3.y) - (pos2.y - pos1.y) * (pos1.x - pos3.x)) / denominator;
		// is the intersection along the segments
		if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
			return false;
		}
		// Return a object with the x and y coordinates of the intersection
		let x = pos1.x + ua * (pos2.x - pos1.x);
		let y = pos1.y + ua * (pos2.y - pos1.y);

		return this.Pos(x, y);
	},

	getSquareLine: function(directionConstant, square1, square2) {
		var sp1 = square1;
		var sp2 = this.Pos(square2.x, square1.y);
		var sp3 = square2;
		var sp4 = this.Pos(square1.x, square2.y);
		switch(directionConstant) {
			case S_UP:
				return this.Line(sp1, sp2);
				break;
			case S_RIGHT:
				return this.Line(sp2, sp3);
				break;
			case S_DOWN:
				return this.Line(sp3, sp4);
				break;
			case S_LEFT:
				return this.Line(sp4, sp1);
				break;
		}
	},

	lineLength: function(line) {
		return Math.hypot(line.p2.x - line.p1.x, line.p2.y - line.p1.y);
	},

	squareIntersect: function(line, square1, square2) {
		var resultMap = new Map();
		[S_UP, S_RIGHT, S_DOWN, S_LEFT].forEach(function(side) {
			let intersection = module.exports.lineIntersect(line, module.exports.getSquareLine(side, square1, square2));
			if(intersection) {
				resultMap.set(side, intersection);
			}
		});
		
		/*buffer = this.lineIntersect(line, this.getSquareLine(S_RIGHT, square1, square2));
		if(buffer) {
			resultMap.set(S_RIGHT, buffer);
		}
		buffer = this.lineIntersect(line, this.getSquareLine(S_DOWN, square1, square2));
		if(buffer) {
			resultMap.set(S_DOWN, buffer);
		}
		buffer = this.lineIntersect(line, this.getSquareLine(S_LEFT, square1, square2));
		if(buffer) {
			resultMap.set(S_LEFT, buffer);
		}*/
		return resultMap;
	},

	isSafeSpot: function(pos) {
		if(	Math.abs(pos.x) <= SUN_CLOSE_RADIUS &&
			Math.abs(pos.y) <= SUN_CLOSE_RADIUS) {
			return false;
		} else {
			return true;
		}
	},

	sunDodge: function(shipPos, reqPos) {
		sunPos1 = this.Pos(SUN_CLOSE_RADIUS, SUN_CLOSE_RADIUS);
		sunPos2 = this.Pos(SUN_CLOSE_RADIUS * -1, SUN_CLOSE_RADIUS * -1);
		var resultMap = this.squareIntersect(this.Line(shipPos, reqPos), sunPos1, sunPos2);
		if(!this.isSafeSpot(reqPos)) {
			return rcs.PF_TOO_CLOSE_TO_SUN;
		}

		if(!this.isSafeSpot(shipPos)) {
			return this.Pos(Math.sign(shipPos.x) * SUN_FAR_RADIUS, Math.sign(shipPos.y) * SUN_FAR_RADIUS);
		}

		if(resultMap.size == 0) return reqPos; // If we're not intersecting with the sun
		
		var sortedMap = new Map();
		var finalMap = new Map();
		var self = this; // for forEach cycle, because "this" becomes forEach and not module.exports

		resultMap.forEach(function(item, side) {
			sortedMap.set(side, self.lineLength(new self.Line(shipPos, item)));
		});
		
		var finalMap = new Map([...sortedMap.entries()].sort((a, b) => a[1] - b[1]));
		var side = Array.from(finalMap.keys())[0];
		var squareLine = this.getSquareLine(side, sunPos1, sunPos2);
		var finalPos;

		if(this.lineLength(new self.Line(reqPos, squareLine.p1)) < this.lineLength(new self.Line(reqPos, squareLine.p2))) {
			finalPos = squareLine.p1;
		} else {
			finalPos = squareLine.p2;
		}
		correctedPos = this.Pos(Math.sign(finalPos.x) * SUN_FAR_RADIUS, Math.sign(finalPos.y) * SUN_FAR_RADIUS);
		return correctedPos;
	},

	pathFind: function(shipPos, reqPos) {
		if(this.lineLength(this.Line(this.Pos(0, 0), reqPos)) > 20000) return rcs.PF_TOO_FAR_FROM_SUN;
		return this.sunDodge(shipPos, reqPos);
	},

	sortByDistance: function(shipPos, objects) {
		var initMap = new Map();
		objects.forEach(function(obj) {
			var dx = shipPos.x - obj.body.vector.x;
			var dy = shipPos.y - obj.body.vector.y;

			var hypot = Math.hypot(dx, dy);
			initMap.set(obj, hypot);
		});
		return Array.from((new Map([...initMap.entries()].sort((a, b) => a[1] - b[1]))).keys());
	},

	extendLine(line, length) {
		var p1 = line.p1;
		var p2 = line.p2;
		lenAB = Math.sqrt(Math.pow(p1.x - p2.x, 2.0) + Math.pow(p1.y - p2.y, 2.0));
		var extendedEnd = this.Pos(	p2.x + (p2.x - p1.x) / lenAB * length, 
										p2.y + (p2.y - p1.y) / lenAB * length);
		var extendedLine = this.Line(p1, extendedEnd);
		return extendedLine;
	},

	fuelNeededToWarp: function(from, to) {
		let fromObj = SYSTEMS.find(sys => sys.name == from);
		let toObj = SYSTEMS.find(sys => sys.name == to);
		return Math.ceil(Math.hypot(fromObj.x - toObj.x, fromObj.y - toObj.y) / 10);
	},

	findWarpPath: function(start, end, maxFuel) {
		// Thanks to https://en.wikipedia.org/wiki/A*_search_algorithm
		// and https://youtu.be/aKYlikFAV4k

		let openSet = [];
		let closedSet = [];
		let allSystems = [];

		let mafsModule = this;

		function systemSpot(x, y, systemName) {
			this.x = x;
			this.y = y;
			this.name = systemName;

			this.f = 0;
			this.g = 0;
			this.h = 0;
			this.neighbors = [];
			this.previous = undefined;

			this.fuelNeeded = function(spot) {
				return mafsModule.fuelNeededToWarp(this, spot);
				//return Math.ceil(Math.hypot(this.x - spot.x, this.y - spot.y) / 10);
			}

			this.addNeighbors = function() {
				for(let system of allSystems) {
					if(this.fuelNeeded(system) <= maxFuel && this != system) {
						this.neighbors.push(system);
					}
				}
			}

			this.valueOf = function() {
				return this.name;
			}
		}

		function findSystemSpot(system) {
			return allSystems.find(sys => sys == system);
		}

		function systemInClosedSet(system) {
			return closedSet.findIndex(sys => sys == system) != -1;
		}

		function systemInOpenSet(system) {
			return openSet.findIndex(sys => sys == system) != -1;
		}

		for(let system of SYSTEMS) { // Create systemSpots
			allSystems.push(new systemSpot(system.x, system.y, system.name));
		}

		for(let [index, system] of allSystems.entries()) { // Fill all neighbors for them
			allSystems[index].addNeighbors();
		}

		let startSpot = findSystemSpot(start);
		let endSpot = findSystemSpot(end);

		openSet.push(startSpot);

		while(openSet.length > 0) { // A* algorithm
			let lowestIndex = 0;
			for(let [index, item] of openSet.entries()) { // .entries() allows to get an index
				if(item.f < openSet[lowestIndex]) {
					lowestIndex = index;
				}
			}

			let currentSpot = openSet[lowestIndex];

			if(currentSpot == end) {
				let path = [];
				let temp = currentSpot;
				path.unshift(temp.name);
				while(temp.previous) {
					temp = temp.previous;
					path.unshift(temp.name);
				}

				// return cost (fuel needed in total)
				return {path: path, cost: currentSpot.f};
			}

			openSet.splice(openSet.findIndex(spot => spot == currentSpot), 1);
			closedSet.push(currentSpot);

			let neighbors = currentSpot.neighbors;


			for(let neighbor of neighbors) {
				let disabledLine = {s1: SYSTEM_IOTA_PEGASI, s2: SYSTEM_PI1_PEGASI};

				let isDisabled = 	((currentSpot.name == disabledLine.s1 && neighbor.name == disabledLine.s2) ||
									 (currentSpot.name == disabledLine.s2 && neighbor.name == disabledLine.s1)) &&
									!((start == disabledLine.s1 && end == disabledLine.s2) ||
									 (start == disabledLine.s2 && end == disabledLine.s1));
				/*if(isDisabled) {
					console.log("This path d!");
					console.log(((start == disabledLine.s1 && end == disabledLine.s2), (start == disabledLine.s2 && end == disabledLine.s1)));
				}8*/
				if(!systemInClosedSet(neighbor) && !isDisabled) {
					let tempG = currentSpot.g + currentSpot.fuelNeeded(neighbor); // heuristic function

					let newPath = false;
					if(systemInOpenSet(neighbor)) {
						if(tempG < neighbor.g) {
							neighbor.g = tempG;
							newPath = true;
						}
					} else {
						neighbor.g = tempG;
						openSet.push(neighbor);
						newPath = true;
					}

					if(newPath) {
						neighbor.h = neighbor.fuelNeeded(endSpot);
						neighbor.f = neighbor.g + neighbor.h;
						neighbor.previous = currentSpot;
					}
				}
			}
		}

		console.log("Solution is absent! :D")
		return [];
	},

	getWarpCoords: function(from, to) {
		let x = SYSTEMS.find(sys => sys.name == to).x - SYSTEMS.find(sys => sys.name == from).x;
		let y = SYSTEMS.find(sys => sys.name == to).y - SYSTEMS.find(sys => sys.name == from).y;
		
		return this.getPointOnCircle(0, 0, 8000, Math.atan2(y, x));
	},

	getPointOnCircle: function(dx, dy, rad, angle) {
		return {x: dx + rad * Math.cos(angle),
				y: dy + rad * Math.sin(angle)};
	},

	findInterceptionOfAsteroid: function(l1, v1, l2, s2) {
		/*
		 * Thanks to:
		 * https://stackoverflow.com/questions/10358022/find-the-better-intersection-of-two-moving-objects
		 *
		 * l1 = current position of the asteroid
		 * v1 = vector speed of the asteroid
		 *
		 * l2 = current position of our ship
		 * s2 = scalar speed of our ship
		 */

		// Translating l1 so that l2 will be at [0,0]
		l1 = this.Pos(l1.x - l2.x, l1.y - l2.y);

		let a = (v1.x ** 2) + (v1.y ** 2) - (s2 ** 2); // * (t^2);
		let b = (2 * l1.x * v1.x) + (2 * l1.y * v1.y); // * t
		let c = (l1.x ** 2) + (l1.y ** 2);

		let time;
		if(a != 0) {
			// Yay, discriminants!
			let D = (b**2 - 4*a*c);
			if(D < 0) {
				time = NaN;
			} else {
				let t1 = (-b + Math.sqrt(D)) / (2 * a);
				let t2 = (-b - Math.sqrt(D)) / (2 * a);
				if(t1 < 0) time = t2;
				else if(t2 < 0) time = t1;

				// both are positive
				else time = Math.min(t1, t2);
			}
		} else { // ...whole code collapses and we have to do workaround
			if(b == 0 || c == 0) {
				time = NaN;
			}
			else 					time = (-c / b);
		}

		if(isNaN(time) || time < 0) {
			return NaN;
		} else {
			// Translating l1 back to its original place
			l1 = this.Pos(l1.x + l2.x, l1.y + l2.y);

			return this.Pos(
				(l1.x + (v1.x * time)),
				(l1.y + (v1.y * time))
			);
		}
	},
}