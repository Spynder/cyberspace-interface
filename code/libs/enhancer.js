var sdk = require("@cyberspace-dev/sdk");
const mafs = require("./mafs");
const delay = require("delay");
const retry = require("async-retry");

const role_miner = "../roles/role_miner";
const role_colonizer = "../roles/role_colonizer";
const role_freighter = "../roles/role_freighter";

require("./constants");
delete require.cache[require.resolve("./constants")];

sdk.dbManager = require("./dbmanager");

sdk.something = function() {
	return true;
}

sdk.Ship.prototype.selfScan = async function() {
	
	this.details = await retry(async bail => {
		var exp = await this.explore();
		return exp;
	}, {retries: 5});
	await delay(ACTION_DELAY);

	this.radarData = await retry(async bail => {
		var rad = await this.safeRadar(); 
		return rad;
	}, {retries: 5});
	await delay(ACTION_DELAY);

	if(this.getLocation() == LOCATION_SYSTEM) {
		this.setLocalMemory("location", this.details.parent.uuid);
	}

	this.memory = await sdk.dbManager.getMemory(this);
}

sdk.Ship.prototype.execRole = async function(account) {
	var memory = this.memory;
	var role = memory.role;
	loggerShip.info("Executing role \"" + role + "\".");
	var moduleName;
	switch(role) {
		case ROLE_MINER:
			moduleName = role_miner;
			break;
		case ROLE_COLONIZER:
			moduleName = role_colonizer;
			break;
		case ROLE_FREIGHTER:
			moduleName = role_freighter;
			break;
	}
	if(moduleName) {
		var moduleRequire = require(moduleName);
		delete require.cache[require.resolve(moduleName)];
		await moduleRequire.run(this, account, sdk);

		var struct = {	hullLevel: this.getBodyCargo("hull").body.gen,
						ID: this.details.uuid,
						fuel: this.getFuel(),
						fuelMax: this.getMaxFuel(),
						role: role,
						balance: this.details.body.balance,
						system: this.getCurrentSystem()};

		console.log(struct);
	}
}

// Start of safe functions

sdk.Account.prototype.safeAssemble = async function() {
	try {
		await this.assemble();
		loggerConsole.trace("Assembled new ship!");
	} catch(e) {
		loggerConsole.debug("Error occured when tried to assemble: " + e.message);
	}
	await delay(ACTION_DELAY);
}

sdk.Ship.prototype.safeMove = async function(x, y) {
	//if(this.getLocation() != LOCATION_SYSTEM) return;
	var selfPos = new mafs.Pos(this.details.body.vector.x, this.details.body.vector.y);
	var destinationPos = new mafs.Pos(x, y);
	var pathFinder = mafs.pathFind(selfPos, destinationPos);
	if(pathFinder == ERR_TOO_CLOSE_TO_SUN) {
		loggerShip.error("Can't move, destination is too close to sun!");
		return;
	}
	else {
		try {
			await this.move(pathFinder.x, pathFinder.y);
			loggerShip.trace("Performing safe movement into spot (" + pathFinder.x + "; " + pathFinder.y + ")");
			await delay(ACTION_DELAY);
		} catch(e) {
			loggerShip.debug("Error occured when tried to move: " + e.message);
		}
	}
}

sdk.Ship.prototype.safeDrop = async function(item) {
	// Getting uuid
	var uuid;
	var name;
	if(typeof item === "string") {
		uuid = item;
	} else if(typeof item === "object" && item.hasOwnProperty("uuid")) {
		uuid = item.uuid;
		if(item.hasOwnProperty("body") && item.body.hasOwnProperty("type")) {
			name = item.body.type;
		}
	} else {
		loggerShip.error("Error while dropping item - invalid item passed!");
		return;
	}
	//console.log(typeof item);

	try {
		await this.drop(uuid);
		if(name) {
			loggerShip.trace("Dropped item " + name + " (uuid: " + uuid + ").");
		} else {
			loggerShip.trace("Dropped item with uuid: " + uuid + ".");
		}
	} catch(e) {
		loggerShip.debug("Error occured when tried to drop: " + e.message);
	}
	await delay(ACTION_DELAY);
}

sdk.Ship.prototype.safeEquip = async function(slot, item) {
	await this.equip(slot, item).catch((e) => {
		loggerShip.debug("Error occured when tried to equip: " + e.message);
	});
	await delay(ACTION_DELAY);
}

sdk.Ship.prototype.safeUnequip = async function(item) {
	await this.unequip(item).catch((e) => {
		loggerShip.debug("Error occured when tried to unequip: " + e.message);
	});
	await delay(ACTION_DELAY);
} // enhance

sdk.Ship.prototype.safeEscape = async function() {
	if(this.getLocation() == LOCATION_SYSTEM) return;

	try {
		await this.escape();
		this.setLocalMemory("parked", false);
	} catch(e) {
		loggerShip.debug("Error occured tried to escape: " + e.message);
	}
	await delay(ACTION_DELAY);
} // enhance

sdk.Ship.prototype.safeLanding = async function(planet) {
	//if(this.getLocation() != LOCATION_SYSTEM) return;

	// check distance
	var result;
	//console.log("hey");
	try {
		await this.landing(planet);
		result = RESULT_OK;
	} catch(e) {
		loggerShip.debug("Error occured tried to land: " + e.message);
		result = -1;
	}

	// experimental
	if(result == RESULT_OK) {
		if(planet == BUSINESS_STATION_NAME) {
			this.details.parent.type = LOCATION_BUSINESS_STATION;
		} else if(planet == SCIENTIFIC_STATION_NAME) {
			this.details.parent.type = LOCATION_SCIENTIFIC_STATION;
		} else {
			this.details.parent.type = LOCATION_PLANET;
		}
		this.details.parent.uuid = planet;
	}
	// experimental

	await delay(ACTION_DELAY);
} // enhance

sdk.Ship.prototype.safeWarp = async function(uuid) {
	//if(this.getLocation() != LOCATION_SYSTEM) return;
	
	loggerShip.trace("Safe warping: " + uuid);
	await this.warp(uuid).catch((e) => { // if not in coords
		loggerShip.debug("Error occured tried to warp: " + e.message);
	});
	await delay(ACTION_DELAY);
} // enhance

sdk.Ship.prototype.safeRadar = async function() {
	var result = await this.radar().catch((e) => {
		loggerShip.debug("Error occured tried to radar: " + e.message);
	});
	await delay(ACTION_DELAY);
	return result;
} // enhance

sdk.Ship.prototype.safeScan = async function(uuid) {
	var result = await this.scan(uuid).catch((e) => {
		loggerShip.debug("Error occured tried to scan: " + e.message);
	});
	await delay(ACTION_DELAY);
	return result;
} // enhance

sdk.Ship.prototype.safeAccept = async function(uuid, count) {
	if(this.getLocation() == LOCATION_SYSTEM) return;

	await this.accept(uuid, count).catch((e) => {
		loggerShip.debug("Error occured tried to accept: " + e.message);
	});
	await delay(ACTION_DELAY);
} // enhance

sdk.Ship.prototype.safeApply = async function(commandType, payload) {
	//if(this.getLocation() == LOCATION_SYSTEM) return;

	await this.apply(commandType, payload).catch((e) => {
		loggerShip.debug("Error occured tried to apply: " + e.message);
	});
	await delay(ACTION_DELAY);
} // enhance

sdk.Ship.prototype.safeAttack = async function(target, weapons) {
	if(this.getLocation() != LOCATION_SYSTEM) return;

	// check distance

	await this.attack(target, weapons).catch((e) => {
		loggerShip.debug("Error occured tried to attack: " + e.message);
	});
	await delay(ACTION_DELAY);
} // enhance


sdk.Ship.prototype.safeGrab = async function(uuid) {
	//if(this.getLocation() != LOCATION_SYSTEM) return;

	// check distance

	await this.grab(uuid).catch((e) => {
		loggerShip.debug("Error occured tried to grab: " + e.message);
	});
	await delay(ACTION_DELAY);
} // enhance

sdk.Ship.prototype.safeFuel = async function() {
	if(this.getLocation() == LOCATION_SYSTEM) return;

	await this.fuel().catch((e) => {
		loggerShip.debug("Error occured tried to fuel: " + e.message);
	});
	await delay(ACTION_DELAY);
} // enhance

sdk.Ship.prototype.safeTransfer = async function(uuid, type) {

	// "out" MEANS TO THE PLANET
	// "in" MEANS TO THE SHIP

	await this.transfer(uuid, type).catch((e) => {
		loggerShip.debug("Error occured tried to transfer: " + e.message);
	});
	await delay(ACTION_DELAY);
} // enhance

// End of safe functions

// Start of getters

sdk.Ship.prototype.hasCargo = function(type) {
	var result;
	if(type == "embryo") {
		result = this.details.nodes.filter((node) => node.body.view == "ITEM901");
	} else if(type == "virus") {
		result = this.details.nodes.filter((node) => node.body.view == "ITEM902");
	} else {
		result = this.details.nodes.filter((node) => node.body.type == type);
	}
	if(result.length) return result;
	else return undefined;
}

sdk.Ship.prototype.hasMinerals = function() {
	return this.hasCargo(sdk.CargoType.MINERALS);
}

sdk.Ship.prototype.getBodyCargo = function(item) {
	return this.details.nodes.find((node) => node.uuid == this.details.body[item].uuid);
}

sdk.Ship.prototype.getHold = function() {
	return this.details.nodes.reduce(((acc, node) => acc + node.body.size), 0);
}

sdk.Ship.prototype.getMaxHold = function() {
	return this.details.nodes.find((node) => node.uuid == this.details.body.hull.uuid).body.mods.find((mod) => mod.name == "total_hp").value;
}

sdk.Ship.prototype.getLocation = function() {
	return this.details.parent.type;
}

sdk.Ship.prototype.getLocationName = function() {
	return this.details.parent.uuid;
}

sdk.Ship.prototype.getCurrentSystem = function() {
	return this.getLocalMemory().location;
}

sdk.Ship.prototype.getFuel = function() {
	return this.details.nodes.find((node) => node.body.type == "TANK").body.mods.find((mod) => mod.name == "current_fuel").value;
}

sdk.Ship.prototype.getMaxFuel = function() {
	return this.details.nodes.find((node) => node.body.type == "TANK").body.mods.find((mod) => mod.name == "total_fuel").value;
}

// End of getters

// Start of static functions



// End of static functions



// Start of single-loop function

var thisLoop = {}

sdk.Ship.prototype.getLoopInfo = function(key) {

	return thisLoop[key] || {};
}

sdk.Ship.prototype.setLoopInfo = function(key, value) {
	var system = this.getLocalMemory("location");
	if(system) {
		thisLoop[system.uuid] = thisLoop[system.uuid] || {};
		thisLoop[system.uuid][key] = value;
	}
	thisLoop[system.uuid][key] = value;
}

// End of single-loop function



// Start of multi-loop functions

sdk.getAllFlyingFor = function() {
	return multiLoop.flyingFor;
}

sdk.getAllDeals = function() {
	return multiLoop.deals;
}

sdk.Ship.prototype.setFlyingFor = function(uuid) {
	if(this.getLocation() != LOCATION_SYSTEM) return -1;

	var system = this.details.parent.uuid;
	multiLoop.flyingFor[system] = multiLoop.flyingFor[system] || {};
	
	multiLoop.flyingFor[system][this.uuid] = uuid;
	//console.log(multiLoop.flyingFor);
}

sdk.Ship.prototype.getFlyingFor = function() {
	if(this.getLocation() != LOCATION_SYSTEM) return false;

	var system = this.details.parent.uuid;
	multiLoop.flyingFor[system] = multiLoop.flyingFor[system] || {};
	var mem = multiLoop.flyingFor[system][this.uuid];
	if(mem == undefined) {
		return false;
	} else return mem;
	
}

sdk.Ship.prototype.setNoDealsFlying = function(uuid) {
	if(this.getLocation() != LOCATION_SYSTEM) return -1;

	var system = this.details.parent.uuid;
	multiLoop.flyingFor[system] = multiLoop.flyingFor[system] || {};
	
	multiLoop.flyingFor[system][this.uuid] = uuid;
	//console.log(multiLoop.flyingFor);
}

sdk.Ship.prototype.getFlyingFor = function() {
	if(this.getLocation() != LOCATION_SYSTEM) return false;

	var system = this.details.parent.uuid;
	multiLoop.flyingFor[system] = multiLoop.flyingFor[system] || {};
	var mem = multiLoop.flyingFor[system][this.uuid];
	if(mem == undefined) {
		return false;
	} else return mem;
	
}

sdk.Ship.prototype.setPickedUp = function(uuid) {
	if(this.getLocation() != LOCATION_SYSTEM) return -1;

	var system = this.details.parent.uuid;
	multiLoop.flyingFor[system] = multiLoop.flyingFor[system] || {};
	delete multiLoop.flyingFor[system][this.uuid];
}



sdk.Ship.prototype.setPlanetDeals = function(planetInfo) {
	if(this.getLocation() != LOCATION_PLANET || !this.getCurrentSystem()) return -1;

	multiLoop.deals[this.getCurrentSystem()] = multiLoop.deals[this.getCurrentSystem()] || {};
	multiLoop.deals[this.getCurrentSystem()][this.getLocationName()] = {deals: planetInfo.body.deals, nodes: planetInfo.nodes, time: new Date().getTime()};

	this.setUpdatedDealsForPlanet(planetInfo.uuid);
}

sdk.Ship.prototype.getPlanetsWithNoDeals = function() {
	if(!this.getCurrentSystem()) return 0;

	var result = [];
	var allPlanets = this.radarData.nodes.filter((node) => node.type == "Planet");
	multiLoop.deals[this.getCurrentSystem()] = multiLoop.deals[this.getCurrentSystem()] || {};
	for(planet of allPlanets) {
		if(!(multiLoop.deals[this.getCurrentSystem()].hasOwnProperty(planet.uuid))) {
			result.push(planet.uuid);
		}
	}

	return result;
}

sdk.Ship.prototype.getPlanetsWithExpiredDeals = function() {
	if(!this.getCurrentSystem()) return -1;
	var result = [];
	multiLoop.deals[this.getCurrentSystem()] = multiLoop.deals[this.getCurrentSystem()] || {};
	for (const [key, value] of Object.entries(multiLoop.deals[this.getCurrentSystem()])) {
		if(value.time + TRADE_EXPIRE_TIME <= new Date().getTime()) {
			result.push(key);
		}
	}
	var noDeals = this.getPlanetsWithNoDeals();
	var combinedArray = [...result, ...noDeals];
	return Array.from(new Set([...combinedArray]));
}

sdk.Ship.prototype.getPlanetToUpdateDealsFor = function() {
	if(!this.getCurrentSystem()) return -1;

	var allPlanets = this.getPlanetsWithExpiredDeals();
	//console.log(multiLoop)
	multiLoop.noDealsFlying[this.getCurrentSystem()] = multiLoop.noDealsFlying[this.getCurrentSystem()] || {};
	//console.log(multiLoop.noDealsFlying[this.getCurrentSystem()])
	var alreadyClaimed = Object.values(multiLoop.noDealsFlying[this.getCurrentSystem()]).indexOf(this.uuid) > -1;
	if(alreadyClaimed) {
		return Object.keys(multiLoop.noDealsFlying[this.getCurrentSystem()]).find((key) => multiLoop.noDealsFlying[this.getCurrentSystem()][key] === this.uuid);
	}

	var objects = [];
	for(planet of allPlanets) {
		//console.log(planet);
		objects.push(this.radarData.nodes.find((node) => node.type == "Planet" && node.uuid == planet));
	}
	//console.log(objects)
	var sortedPlanets = mafs.sortByDistance(new mafs.Pos(this.details.body.vector.x, this.details.body.vector.y), objects);
	var foundPlanet = undefined;
	for(planet of sortedPlanets) {
		//console.log(multiLoop.noDealsFlying[this.getCurrentSystem()]);
		if(!(multiLoop.noDealsFlying[this.getCurrentSystem()].hasOwnProperty(planet.uuid))) {
			foundPlanet = planet.uuid;
			return foundPlanet;
		}
	}
	return foundPlanet;
	//loggerShip.debug("Flying to no deal planet - " + sortedNoDeals[0].uuid + ".");
	//await ship.parkAtSpecifiedPlanet(sortedNoDeals[0].uuid);
}

sdk.Ship.prototype.setFlyingToPlanetToUpdateDealsFor = function(planet) {
	if(!this.getCurrentSystem()) return -1;

	multiLoop.noDealsFlying[this.getCurrentSystem()] = multiLoop.noDealsFlying[this.getCurrentSystem()] || {};
	multiLoop.noDealsFlying[this.getCurrentSystem()][planet] = this.uuid;
}

sdk.Ship.prototype.setUpdatedDealsForPlanet = function(planet) {
	if(!this.getCurrentSystem()) return -1;

	multiLoop.noDealsFlying[this.getCurrentSystem()] = multiLoop.noDealsFlying[this.getCurrentSystem()] || {};
	//console.log(planet, multiLoop.noDealsFlying[this.getCurrentSystem()], this.uuid);
	if(multiLoop.noDealsFlying[this.getCurrentSystem()][planet] == this.uuid) {
		delete multiLoop.noDealsFlying[this.getCurrentSystem()][planet];
	}
}

sdk.Ship.prototype.getBestTrade = function(type, gen, higher) {
	if(!this.getCurrentSystem()) return 0;

	var best = {planet: [], price: 0, uuid: []};

	multiLoop.deals[this.getCurrentSystem()] = multiLoop.deals[this.getCurrentSystem()] || {};

	for (const [key, value] of Object.entries(multiLoop.deals[this.getCurrentSystem()])) {
		//console.log(key)
		//console.log(value.deals.filter((deal) => deal.type == "BUY" && deal.expected == type));
		var typedDeals;
		if(type == "MINERALS") {
			typedDeals = value.deals.filter((deal) => deal.type == "BUY" && deal.expected == type);
			//console.log(value.nodes)
			//console.log(key)
			//console.log(value)
		} else {
			if(gen) {
				if(higher) {
					typedDeals = value.deals.filter(function(deal) {
						var cargo = value.nodes.find((node) => node.uuid == deal.target);
						return deal.type == "SELL" && cargo && cargo.body.type == type && cargo.body.gen >= gen;
					});
					//console.log(typedDeals);
				} else {
					typedDeals = value.deals.filter(function(deal) {
						var cargo = value.nodes.find((node) => node.uuid == deal.target);
						return deal.type == "SELL" && cargo && cargo.body.type == type && cargo.body.gen == gen;
					});
				}
			} else {
				typedDeals = value.deals.filter(function(deal) {
					var cargo = value.nodes.find((node) => node.uuid == deal.target);
					return deal.type == "SELL" && cargo && cargo.body.type == type;
				});
			}
			//console.log(value.nodes);
		}
		var sortedDeals;
		if(type == "MINERALS") {
			sortedDeals = typedDeals.sort((a, b) => b.price - a.price);
		} else {
			sortedDeals = typedDeals.sort((a, b) => a.price - b.price);
		}
		if(gen && higher) {
			var samePrice = sortedDeals.filter((item) => item.price == sortedDeals[0].price);
			var sortedByGen = samePrice.sort(function(a, b) {
				var cargoA = value.nodes.find((node) => node.uuid == a.target);
				var cargoB = value.nodes.find((node) => node.uuid == b.target)
				return cargoB.body.gen - cargoA.body.gen;
			});
			sortedDeals = sortedByGen;
		}
		if(sortedDeals.length) {
			if(type == "MINERALS") {
				if(sortedDeals[0].price > best.price) {
					best = {planet: [key], price: sortedDeals[0].price, uuid: [sortedDeals[0].uuid]};
				} else if(sortedDeals[0].price == best.price) {
					best.planet.push(key);
					best.uuid.push(sortedDeals[0].uuid);
				}
			} else {
				if(sortedDeals[0].price < best.price) {
					best = {planet: [key], price: sortedDeals[0].price, uuid: [sortedDeals[0].uuid]};
				} else if(sortedDeals[0].price == best.price) {
					best.planet.push(key);
					best.uuid.push(sortedDeals[0].uuid);
				} else if(best.price == 0 && best.planet.length == 0) {
					best = {planet: [key], price: sortedDeals[0].price, uuid: [sortedDeals[0].uuid]};
				}
			}
		}
	}
	if(best.planet.length > 1) {
		var closestPlanet = this.getClosestPlanet(best.planet);
		var index = best.planet.indexOf(closestPlanet.uuid);
		return {planet: closestPlanet.uuid, price: best.price, uuid: best.uuid[index]};
	} else if(best.planet.length == 0) {
		return undefined;
	} else {
		return {planet: best.planet[0], price: best.price, uuid: best.uuid[0]};
	}

}

sdk.Ship.prototype.getBestMineralTradeInConstellation = function() {
	var best = {system: "", planet: [], price: 0, uuid: []};

	for(const [system, planets] of Object.entries(multiLoop.deals)) {
		var bestInSystem = {planet: [], price: 0, uuid: []};
		//console.log(system);
		//console.log(planets);
		for(const [planet, deals] of Object.entries(planets)) {
			var typedDeals = {};
			typedDeals = deals.deals.filter((deal) => deal.type == "BUY" && deal.expected == "MINERALS");
			var sortedDeals = typedDeals.sort((a, b) => b.price - a.price);
			if(sortedDeals.length) {
				if(sortedDeals[0].price > bestInSystem.price) {
					bestInSystem = {planet: [planet], price: sortedDeals[0].price, uuid: [sortedDeals[0].uuid]};
				} else if(sortedDeals[0].price == bestInSystem.price) {
					bestInSystem.planet.push(planet);
					bestInSystem.uuid.push(sortedDeals[0].uuid);
				}
			}
		}
		
		if(bestInSystem.price >= HIGHEST_MINERAL_TRADE_COST) {
			best = bestInSystem;
			best.system = system;
			break;
		} else {
			if(bestInSystem.price > best.price) {
				best = bestInSystem;
				best.system = system;
			}
		}
	}

	if(best.planet.length > 1) {
		var closestPlanet = this.getClosestPlanet(best.planet);
		var index = best.planet.indexOf(closestPlanet.uuid);
		return {system: best.system, planet: closestPlanet.uuid, price: best.price, uuid: best.uuid[index]};
	} else if(best.planet.length == 0) {
		return undefined;
	} else {
		return {system: best.system, planet: best.planet[0], price: best.price, uuid: best.uuid[0]};
	}
	//console.log(multiLoop.deals);
}

sdk.Ship.prototype.getBestMineralTrade = function() {
	return this.getBestTrade("MINERALS");
}

sdk.Ship.prototype.isPlanetDealsMinExpired = function(planet) {
	if(!this.getCurrentSystem()) return -1;

	var info = this.getPlanetsWithExpiredDeals()[planet];
	return planet + MIN_TRADE_EXPIRE_TIME <= new Date().getTime();
}
sdk.Ship.prototype.isPlanetDealsExpired = function(planet) {
	if(!this.getCurrentSystem()) return -1;

	var info = this.getPlanetsWithExpiredDeals()[planet];
	return planet + RADE_EXPIRE_TIME <= new Date().getTime();
}



sdk.Ship.prototype.getLocalMemory = function() {
	return multiLoop.localMemory[this.uuid] || {};
}

sdk.Ship.prototype.setLocalMemory = function(key, value) {
	multiLoop.localMemory[this.uuid] = multiLoop.localMemory[this.uuid] || {};
	multiLoop.localMemory[this.uuid][key] = value;
	return multiLoop.localMemory[this.uuid];
}

// End of multi-loop functions

// Start of shortcuts

sdk.Ship.prototype.parkAtNearbyLandable = async function() {
	var result = -1;
	if(this.getLocation() != LOCATION_SYSTEM) {
		this.setLocalMemory("parked", true);
		result = ALREADY_PARKED;
	} else {
		var landables = this.radarData.nodes.filter((node) => node.type == "Planet" || node.type == "BusinessStation" || node.type == "ScientificStation"); // Get all landable spots
		var sortedLandables = mafs.sortByDistance(new mafs.Pos(this.details.body.vector.x, this.details.body.vector.y), landables); // Sort planets by proximity.
		var landable = sortedLandables[0]; // Get closest one
		var vect = new mafs.Line(	new mafs.Pos(	this.details.body.vector.x,
													this.details.body.vector.y),
									new mafs.Pos(	landable.body.vector.x,
													landable.body.vector.y)
								);

		var extended = mafs.extendLine(vect, 40);
		if(landable.type == "Planet") {
			await this.safeMove(extended.p2.x, extended.p2.y);
		} else {
			await this.safeMove(landable.body.vector.x, landable.body.vector.y);
		}
		await this.safeLanding(landable.uuid);
		result = FLYING_TO_LANDABLE;
	}
	await this.safeFuel();
	return result;
}

sdk.Ship.prototype.parkAtNearbyPlanet = async function() {
	var result = -1;
	if(this.getLocation() != LOCATION_SYSTEM) {
		this.setLocalMemory("parked", true);
		result = ALREADY_PARKED;
	} else {
		var planets = this.radarData.nodes.filter((node) => node.type == "Planet"); // Get all landable spots
		var sortedPlanets = mafs.sortByDistance(new mafs.Pos(this.details.body.vector.x, this.details.body.vector.y), planets); // Sort planets by proximity.
		var planet = sortedPlanets[0]; // Get closest one
		var vect = new mafs.Line(	new mafs.Pos(	this.details.body.vector.x,
													this.details.body.vector.y),
									new mafs.Pos(	planet.body.vector.x,
													planet.body.vector.y)
								);

		var extended = mafs.extendLine(vect, 40);
		await this.safeMove(extended.p2.x, extended.p2.y);
		await this.safeLanding(planet.uuid);
		result = FLYING_TO_LANDABLE;
	}
	await this.safeFuel();
	return result;
}

sdk.Ship.prototype.parkAtSpecifiedPlanet = async function(planetUuid) {
	var result = -1;
	if(!planetUuid) {
		return 0;
	}
	if(this.getLocation() != LOCATION_SYSTEM && this.getLocationName() == planetUuid) {
		this.setLocalMemory("parked", true);
		result = ALREADY_PARKED;
	}

	if(this.getLocation() != LOCATION_SYSTEM && this.getLocationName() != planetUuid) {
		await this.safeEscape();
	}
	else {
		var planet = this.radarData.nodes.find((node) => node.uuid == planetUuid);
		//console.log(planetUuid)
		if(planet) {
			var vect = new mafs.Line(	new mafs.Pos(	this.details.body.vector.x,
														this.details.body.vector.y),
										new mafs.Pos(	planet.body.vector.x,
														planet.body.vector.y)
									);
			var extended = mafs.extendLine(vect, 40);
			await this.safeMove(extended.p2.x, extended.p2.y);
			await this.safeLanding(planet.uuid);
			result = FLYING_TO_LANDABLE;
		} else {
			loggerShip.warn("CANT FIND PLANET")
		}
	}
	await this.safeFuel();
	return result;
}

sdk.Ship.prototype.operateMoney = async function(keep) {
	var keepMoney;
	if(keep) {
		keepMoney = keep;
	} else {
		keepMoney = KEEP_MINIMUM;
	}

	var tradeStation = this.radarData.nodes.find((node) => node.type == "BusinessStation");
	if(!tradeStation) {
		return BUSINESS_STATION_NOT_FOUND;
	}
	if(this.getLocation() != LOCATION_BUSINESS_STATION) {
		//console.log("Escape?");
		await this.safeEscape();
	}
	var result;
	//console.log(this.getLocation() == LOCATION_BUSINESS_STATION);
	if(this.getLocation() == LOCATION_SYSTEM) {
		result = FLYING_TO_BUSINESS_STATION;
		await this.safeMove(tradeStation.body.vector.x, tradeStation.body.vector.y);
		await this.safeLanding(tradeStation.uuid);
	}
	if(this.getLocation() == LOCATION_BUSINESS_STATION) {
		result = CURRENTLY_DEPOSITING;
		await this.safeFuel();
		if(keep && this.details.body.balance < keep) {
			await this.safeApply("DEPOSIT_CLOSE");
			result = CLOSED_DEPOSIT;
		}
		await this.safeApply("DEPOSIT", this.details.body.balance - keepMoney);
	}
	return result;
}

sdk.Ship.prototype.getClosestPlanet = function(planetArray) {
	var planets = [];
	for(planet of planetArray) {
		planets.push(this.radarData.nodes.find((node) => node.type == "Planet" && node.uuid == planet));
	}
	var sortedPlanets = mafs.sortByDistance(new mafs.Pos(this.details.body.vector.x, this.details.body.vector.y), planets); // Sort planets by proximity.
	return sortedPlanets[0];
}



// End of shortcuts

module.exports = sdk;