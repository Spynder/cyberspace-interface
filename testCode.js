var delay = require('delay');
var mafs = require('./code/libs/mafs')

/*var obj = {
  Matar: {
    Lozolia: {time: 1618589144124 },
    Caolia: {time: 1618589526476 }
  },
  Sadalbari: {
    Icypso: {time: 1618588469846 },
    Bodion: {time: 1618589196713 },
    Niapra: {time: 1618588123193 }
  },
  Salm: { Acapus: {time: 1618588198990 } },
  Scheat: {
    Mayvel: {time: 1618589372044 },
    Roebe: {time: 1618589133359 },
    Drewsa: {time: 1618589529445 },
    Headsbing: {time: 1618588940292 }
  },
  Sadalpheris: {
    'Grion A5': {time: 1618588168027 },
    Unkoinus: {time: 1618589186501 }
  }
}

var obj1 = {"a": 2, "b": 8};
var obj2 = {"b": undefined, "c": 3};

var n = "Drewsa";
//console.log(Object.keys(obj).some(item => Object.keys(obj[item]).some(insideItem => insideItem == n)));
//console.log(Object.keys(obj).map(system => Object.values(obj[system])))
console.log(Object.values(obj).some(item => Object.keys(item).some(insideItem => insideItem == n)));
for(sys of Object.values(obj)) {
	for(planet in sys) {
		if(planet == n) console.log(sys[planet]);
	}
}

let newObj = {}

Object.keys(obj2).filter(item => obj2[item] != undefined).forEach(item => newObj[item] = obj2[item]);

console.log(Object.assign({}, obj1, newObj))*/

/*global.SYSTEMS = [  {x: 217,  y: 136,   name: "Scheat"},
					{x: 270,  y: 111,   name: "Matar"},
					{x: 348,  y: 82,    name: "Pi-1 Pegasi"},
					{x: 248,  y: 174,   name: "Sadalbari"},
					{x: 262,  y: 186,   name: "Sadalpheris"},
					{x: 355,  y: 168,   name: "Iota Pegasi"},
					{x: 414,  y: 161,   name: "Jih"},
					{x: 174,  y: 181,   name: "Salm"},
					{x: 61,   y: 111,   name: "Sirrah"},
					{x: 24,   y: 261,   name: "Algenib"},
					{x: 208,  y: 277,   name: "Markab"},
					{x: 270,  y: 327,   name: "Homam"},
					{x: 354,  y: 378,   name: "Baham"},
					{x: 428,  y: 333,   name: "Enif"}];*/

global.SYSTEMS = [  {x: 217,  y: 136,   name: "Scheat"},
					{x: 174,  y: 181,   name: "Salm"},
					{x: 61,   y: 111,   name: "Sirrah"},
					{x: 24,   y: 261,   name: "Algenib"}];

					// do some bugtesting

/*fuelsssNeeded = function() {
	s1 = SYSTEMS[2];
	s2 = SYSTEMS[3];
	return Math.hypot(s1.x - s2.x, s1.y - s2.y) / 10;
}*/

/*function findWarpPath(start, end, maxFuel) {

	// Thanks to https://en.wikipedia.org/wiki/A*_search_algorithm
	// and https://youtu.be/aKYlikFAV4k

	let openSet = [];
	let closedSet = [];
	let allSystems = [];

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
			return Math.hypot(this.x - spot.x, this.y - spot.y) / 10;
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
			console.log("DONE");
			console.log(closedSet)

			// return cost (fuel needed in total)
			return path;
		}

		openSet.splice(openSet.findIndex(spot => spot == currentSpot), 1);
		closedSet.push(currentSpot);

		let neighbors = currentSpot.neighbors;

		for(let neighbor of neighbors) {
			if(!systemInClosedSet(neighbor)) {
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
}
let start = new Date().getTime();
console.log(findWarpPath("Scheat", "Algenib", 25));*/

//console.log(findWarpPath("Scheat", "Pi-1 Pegasi", 15));
//console.log(findWarpPath("Algenib", "Enif", 15));
//console.log(findWarpPath("Matar", "Homam", 15));
//console.log("Evaluated in " + ((new Date().getTime()) - start));

/*
let from = "Matar";
let to = "Pi-1 Pegasi";

let x = SYSTEMS.find(sys => sys.name == to).x - SYSTEMS.find(sys => sys.name == from).x;
let y = SYSTEMS.find(sys => sys.name == to).y - SYSTEMS.find(sys => sys.name == from).y;

function getPointOnCircle(dx, dy, rad, angle) {
	return {x: dx + rad * Math.sin(Math.atan2(y, x)),
			y: dy + rad * Math.cos(Math.atan2(y, x))};
}
*/

//addPath(SYSTEM_SCHEAT, SYSTEM_MATAR, {x: 7235, y: -3413});
//addPath(SYSTEM_MATAR, SYSTEM_PI1_PEGASI, {x: 7499, y: -2788});
//console.log(getPointOnCircle(0, 0, 8000, 0));







// Thanks to:
// https://stackoverflow.com/questions/10358022/find-the-better-intersection-of-two-moving-objects

let l1 = new mafs.Pos(0, 0); // location of asteroid
let v1 = new mafs.Pos(50, 50); // velocity (scalar speed + direction) of asteroid

let l2 = new mafs.Pos(0, 100); // location of ship
let s2 = 100; // speed (just scalar) of ship

// Translating l1 so that l2 will be at [0,0]
l1 = new mafs.Pos(l1.x - l2.x, l1.y - l2.y);

let a = (v1.x ** 2) + (v1.y ** 2) - (s2 ** 2); // * (t ** 2);
let b = (2 * l1.x * v1.x) + (2 * l1.y * v1.y); // * t
let c = (l1.x ** 2) + (l1.y ** 2);

let solution;
if(a != 0) {
	// Yay, discriminants!
	let D = (b**2 - 4*a*c);
	if(D < 0) {
		solution = NaN;
	} else {
		let t1 = (-b + Math.sqrt(D)) / (2 * a);
		let t2 = (-b - Math.sqrt(D)) / (2 * a);
		if(t1 < 0) solution = t2;
		else if(t2 < 0) solution = t1;

		// both are positive
		else solution = Math.min(t1, t2);
	}
} else { // ...whole code collapses and we have to do workaround
	if(c == 0 || b == 0) {
		solution = NaN;
	} else {
		solution = (-c / b);
	}
}



if(isNaN(solution) || solution < 0) {
	console.log("Collision is impossible: " + solution);
} else {
	console.log("Time: " + solution);
	// Translation l1 back to its original place
	l1 = new mafs.Pos(l1.x + l2.x, l1.y + l2.y);

	let interception = new mafs.Pos(
		(l1.x + (v1.x * solution)),
		(l1.y + (v1.y * solution))
	);
	console.log("Interception point:");
	console.log(interception);
}