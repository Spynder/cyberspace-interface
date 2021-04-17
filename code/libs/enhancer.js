var sdk = require("@cyberspace-dev/sdk");
var mafs = require("./mafs");
const delay = require("delay");
const retry = require("async-retry");
const _ = require("lodash");

const role_miner = "../roles/role_miner";
const role_colonizer = "../roles/role_colonizer";
const role_freighter = "../roles/role_freighter";
const role_planet = "../roles/role_planet";
const role_scout = "../roles/role_scout";
const role_attacker = "../roles/role_attacker";

require("./constants");
delete require.cache[require.resolve("./constants")];

sdk.dbManager = require("./dbmanager");

sdk.Ship.prototype.selfScan = async function(skipScans) {
	if(!skipScans) {
		this.details = await retry(async bail => {
			var exp = await sdk.profileTime(this.explore.bind(this));
			return exp;
		}, {retries: 5});

		this.radarData = await retry(async bail => {
			var rad = await this.safeRadar();
			return rad;
		}, {retries: 5});

		if(this.getCurrentSystem()) {
			let info = _.cloneDeep(this.radarData);
			info.updateTime = new Date().getTime();
			multiLoop.deals[this.getCurrentSystem()] = multiLoop.deals[this.getCurrentSystem()] || {};
			info.allDeals = multiLoop.deals[this.getCurrentSystem()];
			sendInfo("systemInfo", info);
		}
	}

	if(this.getLocation() == LOCATION_SYSTEM) {
		this.setParked(false);
		this.setLocalMemory("location", this.details.parent.uuid);
	}

	
}

sdk.Ship.prototype.execRole = async function(account, options) {
	this.memory = await sdk.dbManager.getMemory(this);
	var memory = this.memory;
	var role = memory.role;
	await this.selfScan(role == ROLE_SCOUT);
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
		case ROLE_SCOUT:
			moduleName = role_scout;
			break;
		case ROLE_ATTACKER:
			moduleName = role_attacker;
			break;
	}
	if(moduleName) {
		var moduleRequire = require(moduleName);
		delete require.cache[require.resolve(moduleName)];
		mafs = require("./mafs");
		delete require.cache[require.resolve("./mafs")];	
		await moduleRequire.run(this, account, sdk, options);

		let hullCargo = this.getBodyCargo("hull");
		//console.log(this);
		var struct = {	hullLevel: hullCargo ? hullCargo.body.gen : undefined,
						ID: this.uuid,
						fuel: this.getFuel(),
						fuelMax: this.getMaxFuel(),
						role: role,
						balance: this.details ? this.details.body.balance : undefined,
						system: this.getCurrentSystem(),
						hold: this.getHold(),
						holdMax: this.getMaxHold(),
						currentHP: this.getCurrentHP(),
						details: this.details,
						radarData: this.radarData,
						memory: this.memory};

		//console.log(struct);

		//console.log(struct);
		sendInfo("shipInfo", struct);
	}
}

sdk.Planet.prototype.gatherInfo = async function(account) {
	var moduleName = role_planet;
	var moduleRequire = require(moduleName);
	delete require.cache[require.resolve(moduleName)];

	await moduleRequire.run(this, account, sdk);
}

// Start of safe functions


/* 
*   This function lets measure time between start and finish of given function, and if it's delta more
*   than [ACTION_DELAY] ms (required pause between calls by CyberSpace API) then it wouldsn't add another
*   [ACTION_DELAY] ms on top, slowing down the cycle. On average, this function increases cycle speed by 25%.
*/
sdk.profileTime = async function(profilingFunc) {
	try {
		var startTime = new Date().getTime();
		var functionResult = await profilingFunc();
		var deltaTime = (new Date().getTime()) - startTime;
		var subtractedTime = ACTION_DELAY - deltaTime;
		if(subtractedTime > 0) {
			console.log("Wow!");
			await delay(subtractedTime);
		}
		console.log(profilingFunc.name, subtractedTime);
		return functionResult;
	} catch(e) {
		loggerConsole.debug("Error occured when tried to profile time: " + e.message);
	}
}

sdk.Account.prototype.safeAssemble = async function() {
	await sdk.profileTime(async function() {
		try {
			await this.assemble();
			loggerConsole.trace("Assembled new ship!");
		} catch(e) {
			loggerConsole.debug("Error occured when tried to assemble: " + e.message);
		}
	}.bind(this));
}

sdk.Ship.prototype.safeMove = async function(x, y) {
	await sdk.profileTime(async function() {
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
			} catch(e) {
				loggerShip.debug("Error occured when tried to move: " + e.message);
			}
		}
	}.bind(this));
}

sdk.Ship.prototype.safeDrop = async function(item) {
	await sdk.profileTime(async function() {
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
	}.bind(this));
}

sdk.Ship.prototype.safeEquip = async function(slot, item) {
	await sdk.profileTime(async function() {
		await this.equip(slot, item).catch((e) => {
			loggerShip.debug("Error occured when tried to equip: " + e.message);
		});
	}.bind(this));
}

sdk.Ship.prototype.safeUnequip = async function(item) {
	await sdk.profileTime(async function() {
		await this.unequip(item).catch((e) => {
			loggerShip.debug("Error occured when tried to unequip: " + e.message);
		});
	}.bind(this));
} // enhance

sdk.Ship.prototype.safeEscape = async function() {
	if(this.getLocation() == LOCATION_SYSTEM) return;

	await sdk.profileTime(async function() {

		var result;

		try {
			await this.escape();
			this.setLocalMemory("parked", false);
			this.setParked(false);
			result = RESULT_OK;
			// experimental
		} catch(e) {
			loggerShip.debug("Error occured tried to escape: " + e.message);
			result = -1;
		}

		if(result == RESULT_OK) {
			this.details.parent.type = LOCATION_SYSTEM;
		}
	}.bind(this));
} // enhance

sdk.Ship.prototype.safeLanding = async function(planet) {
	//if(this.getLocation() != LOCATION_SYSTEM) return;

	await sdk.profileTime(async function() {

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
	}.bind(this));
} // enhance

sdk.Ship.prototype.safeWarp = async function(uuid) {
	//if(this.getLocation() != LOCATION_SYSTEM) return;

	await sdk.profileTime(async function() {
		
		loggerShip.trace("Safe warping: " + uuid);
		await this.warp(uuid).catch((e) => { // if not in coords
			loggerShip.debug("Error occured tried to warp: " + e.message);
		});
	}.bind(this));
} // enhance

sdk.Ship.prototype.safeRadar = async function() {
	var result = await sdk.profileTime(async function() {
		return await this.radar().catch((e) => {
			loggerShip.debug("Error occured tried to radar: " + e.message);
		});
	}.bind(this));
	return result;
} // enhance

sdk.Ship.prototype.safeScan = async function(uuid) {
	var result = await sdk.profileTime(async function() {
		return await this.scan(uuid).catch((e) => {
			loggerShip.debug("Error occured tried to scan: " + e.message);
		});
	}.bind(this));
	return result;
} // enhance

sdk.Ship.prototype.safeAccept = async function(uuid, count) {
	if(this.getLocation() == LOCATION_SYSTEM) return;

	await sdk.profileTime(async function() {

		await this.accept(uuid, count).catch((e) => {
			loggerShip.debug("Error occured tried to accept: " + e.message);
		});
	}.bind(this));
} // enhance

sdk.Ship.prototype.safeApply = async function(commandType, payload) {
	//if(this.getLocation() == LOCATION_SYSTEM) return;
	await sdk.profileTime(async function() {

		await this.apply(commandType, payload).catch((e) => {
			loggerShip.debug("Error occured tried to apply: " + e.message);
		});
	}.bind(this));
} // enhance

sdk.Ship.prototype.safeAttack = async function(target, weapons) {
	if(this.getLocation() != LOCATION_SYSTEM) return;

	await sdk.profileTime(async function() {

		// check distance

		await this.attack(target, weapons).catch((e) => {
			loggerShip.debug("Error occured tried to attack: " + e.message);
		});
	}.bind(this));
} // enhance


sdk.Ship.prototype.safeGrab = async function(uuid) {
	//if(this.getLocation() != LOCATION_SYSTEM) return;

	await sdk.profileTime(async function() {
		// check distance
		await this.grab(uuid).catch((e) => {
			loggerShip.debug("Error occured tried to grab: " + e.message);
		});
	}.bind(this));
} // enhance

sdk.Ship.prototype.safeFuel = async function() {
	console.log("Safe fuel")
	if(this.getLocation() == LOCATION_SYSTEM) return;
	if(this.getFuel() == this.getMaxFuel()) return;

	await sdk.profileTime(async function() {
		await this.fuel().catch((e) => {
			loggerShip.debug("Error occured tried to fuel: " + e.message);
		});
	}.bind(this));
} // enhance

sdk.Ship.prototype.safeTransfer = async function(uuid, type) {

	// "out" MEANS TO THE PLANET
	// "in" MEANS TO THE SHIP
	await sdk.profileTime(async function() {
		await this.transfer(uuid, type).catch((e) => {
			loggerShip.debug("Error occured tried to transfer: " + e.message);
		});
	}.bind(this));
} // enhance

// End of safe functions

// Start of getters

sdk.Ship.prototype.hasCargo = function(type) {
	if(!this.details) return undefined;
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
	return this.details ? this.details.nodes.find((node) => node.uuid == this.details.body[item].uuid) : undefined;
}

sdk.Ship.prototype.getHold = function() {
	return this.details ? this.details.nodes.reduce(((acc, node) => acc + node.body.size), 0) : undefined;
}

sdk.Ship.prototype.getMaxHold = function() {
	return this.details ? this.details.nodes.find((node) => node.uuid == this.details.body.hull.uuid).body.mods.find((mod) => mod.name == "total_hp").value : undefined; // Total HP = Total Hold
}

sdk.Ship.prototype.getCurrentHP = function() {
	return this.details ? this.details.nodes.find((node) => node.uuid == this.details.body.hull.uuid).body.mods.find((mod) => mod.name == "current_hp").value : undefined;
}

sdk.Ship.prototype.getLocation = function() {
	return this.details ? this.details.parent.type : undefined;
}

sdk.Ship.prototype.getLocationName = function() {
	return this.details ? this.details.parent.uuid : undefined;
}

sdk.Ship.prototype.getCurrentSystem = function() {
	return this.getLocalMemory().location;
}

sdk.Ship.prototype.getFuel = function() {
	return this.details ? this.details.nodes.find((node) => node.body.type == "TANK").body.mods.find((mod) => mod.name == "current_fuel").value : undefined;
}

sdk.Ship.prototype.getMaxFuel = function() {
	return this.details ? this.details.nodes.find((node) => node.body.type == "TANK").body.mods.find((mod) => mod.name == "total_fuel").value : undefined;
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

sdk.Ship.prototype.setParked = function(parked) {
	let index = multiLoop.activeShips.findIndex(entry => entry.ID == this.uuid);
	multiLoop.activeShips[index].parked = parked;
	sendInfo("shipParked", {ID: this.uuid, parked: parked});
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

sdk.getPlanetDeals = function(planet) {
	for(system of Object.values(multiLoop.deals)) {
		for(sysPlanet in system) {
			if(sysPlanet == planet) return system[sysPlanet];
		}
	}
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
	if(!this.radarData) return [];
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
	if(multiLoop.noDealsFlying[this.getCurrentSystem()][planet]) {
		delete multiLoop.noDealsFlying[this.getCurrentSystem()][planet];
	}
}

sdk.getFilteredTrades = function(type, gen, higher, planetInfo) {
	let isMinerals = type == "MINERALS";
	var filteredDeals;
	if(isMinerals) {
		filteredDeals = planetInfo.deals.filter((deal) => deal.type == "BUY" && deal.expected == type);
		//console.log(planetInfo.nodes)
		//console.log(key)
		//console.log(planetInfo)
	} else {
		if(gen) {
			if(higher) {
				filteredDeals = planetInfo.deals.filter(function(deal) {
					var cargo = planetInfo.nodes.find((node) => node.uuid == deal.target);
					return deal.type == "SELL" && cargo && cargo.body.type == type && cargo.body.gen >= gen;
				});
				//console.log(typedDeals);
			} else {
				filteredDeals = planetInfo.deals.filter(function(deal) {
					var cargo = planetInfo.nodes.find((node) => node.uuid == deal.target);
					return deal.type == "SELL" && cargo && cargo.body.type == type && cargo.body.gen == gen;
				});
			}
		} else {
			filteredDeals = planetInfo.deals.filter(function(deal) {
				var cargo = planetInfo.nodes.find((node) => node.uuid == deal.target);
				return deal.type == "SELL" && cargo && cargo.body.type == type;
			});
		}
		//console.log(planetInfo.nodes);
	}
	return filteredDeals;
}

sdk.getSortedTrades = function(typedDeals, type, gen, higher, planetInfo, amount) {
	let isMinerals = type == "MINERALS";

	var sortedDeals = typedDeals.sort((a, b) => b.price - a.price * (isMinerals ? 1 : -1));

	if(!isMinerals && gen && higher) {
		var samePrice = sortedDeals.filter((item) => item.price == sortedDeals[0].price);
		var sortedByGen = samePrice.sort(function(a, b) {
			var cargoA = planetInfo.nodes.find((node) => node.uuid == a.target);
			var cargoB = planetInfo.nodes.find((node) => node.uuid == b.target)
			return cargoB.body.gen - cargoA.body.gen;
		});
		sortedDeals = sortedByGen;
	} else if(isMinerals && amount) {
		sortedDeals = sortedDeals.filter((item) => item.count >= amount);
	}
	return sortedDeals;
}

sdk.Ship.prototype.getBestTrade = function(type, gen, higher, system, amount) {

	if(!system) {
		if(!this.getCurrentSystem()) return 0;
		system = this.getCurrentSystem();
	}
	
	var best = {planet: [], price: 0, uuid: []};

	let isMinerals = type == "MINERALS";

	multiLoop.deals[system] = multiLoop.deals[system] || {};

	for (const [key, value] of Object.entries(multiLoop.deals[system])) {
		let typedDeals = sdk.getFilteredTrades(type, gen, higher, value);
		let sortedDeals = sdk.getSortedTrades(typedDeals, type, gen, higher, value, amount);
		//console.log(sortedDeals);
		if(sortedDeals.length) {
			if(isMinerals) {
				if(sortedDeals[0].price > best.price) {
					best = {planet: [key], price: sortedDeals[0].price, uuid: [sortedDeals[0].uuid], amount: sortedDeals[0].count};
				} else if(sortedDeals[0].price == best.price) {
					best.planet.push(key);
					best.uuid.push(sortedDeals[0].uuid);
					best.amount += sortedDeals[0].count;
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
	if(best.planet.length > 1 && !system) {
		var closestPlanet = this.getClosestPlanet(best.planet);
		var index = best.planet.indexOf(closestPlanet.uuid);
		let struct = {planet: closestPlanet.uuid, price: best.price, uuid: best.uuid[index]};
		if(isMinerals) struct.amount = best.amount;
		return struct;
	} else if(best.planet.length == 0) {
		return undefined;
	} else {
		let struct = {planet: best.planet[0], price: best.price, uuid: best.uuid[0]};
		if(isMinerals) struct.amount = best.amount;
		return struct;
	}

}

sdk.Ship.prototype.getBestTradeInConstellation = function(type, gen, higher) {

}

sdk.Ship.prototype.getBestMineralTradeInConstellation = function(minAmount) {
	var best = {system: "", planet: [], price: 0, uuid: []};

	for(const [system, planets] of Object.entries(multiLoop.deals)) {
		var systemBest = this.getBestTrade("MINERALS", 1, false, system, minAmount);
		if(!systemBest) continue;
		if(best.price < systemBest.price) {
			best = systemBest;
			best.system = system;
		}
	}
	return best;
}

sdk.Ship.prototype.getBestMineralTrade = function() {
	return this.getBestTrade("MINERALS");
}

sdk.Ship.prototype.isPlanetDealsMinExpired = function(planet) {
	if(!this.getCurrentSystem()) return -1;

	var info = this.getPlanetsWithExpiredDeals().includes(planet);
	//return !info || info.time + MIN_TRADE_EXPIRE_TIME <= new Date().getTime();
	return info;
}
/*sdk.Ship.prototype.isPlanetDealsExpired = function(planet) {
	if(!this.getCurrentSystem()) return -1;

	var info = this.getPlanetsWithExpiredDeals().includes(planet);
	console.log(this.getPlanetsWithExpiredDeals())
	return info;
	//return !info || info.time + TRADE_EXPIRE_TIME <= new Date().getTime();
}*/

sdk.hasPlanetDealsBeenScanned = function(planet) {
	let deals = multiLoop.deals;
	return Object.values(deals).some(system => Object.keys(system).some(sysPlanet => sysPlanet == planet));
}

sdk.isPlanetDealsExpired = function(planet, min) {
	if(!sdk.hasPlanetDealsBeenScanned(planet)) return true;
	let planetDeals = sdk.getPlanetDeals(planet);
	let time = planetDeals.time;
	//console.log(time - new Date().getTime());
	let expireTime = min ? MIN_TRADE_EXPIRE_TIME : TRADE_EXPIRE_TIME;
	return time + expireTime <= new Date().getTime();
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
		await this.safeLanding(landable.uuid);
		if(landable.type == "Planet") {
			await this.safeMove(extended.p2.x, extended.p2.y);
		} else {
			await this.safeMove(landable.body.vector.x, landable.body.vector.y);
		}
		
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
		await this.safeLanding(planet.uuid);
		await this.safeMove(extended.p2.x, extended.p2.y);
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
		if(planet) {
			var vect = new mafs.Line(	new mafs.Pos(	this.details.body.vector.x,
														this.details.body.vector.y),
										new mafs.Pos(	planet.body.vector.x,
														planet.body.vector.y)
									);
			var extended = mafs.extendLine(vect, 40);
			await this.safeLanding(planet.uuid);
			await this.safeMove(extended.p2.x, extended.p2.y);
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
		await this.safeEscape();
	}
	var result;
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

sdk.Ship.prototype.upgradeBodyPart = async function(bodypart, minGen, maxCost) {
	bodypart = bodypart.toLowerCase();
	let bodypartCargo = bodypart.toUpperCase();
	var bpTrade = this.getBestTrade(bodypartCargo, minGen, true);
	// Update to support weapons
	let isHull = (bodypart == "hull");
	let parts = this.hasCargo(bodypartCargo);
	
	if(this.hasMinerals()) return SHIP_HAS_MINERALS;
	if(isHull && this.getCurrentSystem() != SYSTEM_SCHEAT) return NOT_IN_SCHEAT;

	if(parts.length > 1) {
		var oldPart = parts.find((part) => part.body.gen == 1);
		if(this.getLocation() != LOCATION_SYSTEM) {
			await this.safeEscape();
		}
		await this.safeDrop(oldPart.uuid);
	}

	if(this.getBodyCargo(bodypart).body.gen == 1) {
		
		console.log(parts);
		console.log(bpTrade);
		if(parts.length > 1) {
			var betterPart = parts.find((part) => part.body.gen > 1);
			if(betterPart) {
				if(isHull && this.getCurrentSystem() == HOME_SYSTEM) {
					if(this.details.body.balance == HULL_CHANGE_COST) {
						loggerShip.info("Flying to scientific station to change hull!");
						var sciStation = this.radarData.nodes.find((instance) => instance.type == "ScientificStation");
						console.log(betterPart);
						if(this.getLocation() != LOCATION_SCIENTIFIC_STATION) {
							await this.safeEscape();
						}
						if(sciStation) {
							await this.safeMove(sciStation.body.vector.x, sciStation.body.vector.y);
							await this.safeLanding(sciStation.uuid);
							await this.safeApply("CHANGE_HULL", betterPart.uuid);
						}
					} else {
						loggerShip.info("Getting " + HULL_CHANGE_COST + " for hull change.");
						await this.operateMoney(HULL_CHANGE_COST);
					}
				} else {
					var oldPart = parts.find((part) => part.body.gen == 1);
					await this.safeUnequip(oldPart.uuid);
					await this.safeEquip(bodypart, betterPart.uuid);
					await ship.safeDrop(oldPart.uuid);
				}
			}
			return CHANGING_BODY_PART;
		}

		else if(bpTrade && bpTrade.price <= maxCost) {
			let requiredBalance = bpTrade.price + (isHull ? HULL_CHANGE_COST : 0);
			if(	(this.details.body.balance == requiredBalance && this.getCurrentSystem() == SYSTEM_SCHEAT) || 
				(this.details.body.balance >= requiredBalance && this.getCurrentSystem() != SYSTEM_SCHEAT)) {
				console.log(bpTrade)
				await this.parkAtSpecifiedPlanet(bpTrade.planet);

				var planetInfo = await this.safeScan(bpTrade.planet);
				if(planetInfo) {
					this.setPlanetDeals(planetInfo);
					var buyTrade = planetInfo.body.deals.find((deal) => deal.uuid == bpTrade.uuid);
					if(buyTrade) {
						await this.safeAccept(buyTrade.uuid);
						await this.safeFuel();
						planetInfo = await this.safeScan(bpTrade.planet);
						this.setPlanetDeals(planetInfo);
					}
				}
			} else if(this.getCurrentSystem() == SYSTEM_SCHEAT) {
				loggerShip.info("Operating " + requiredBalance + " for " + bodypart + " change.");
				await this.operateMoney(requiredBalance);
			} else {
				return NOT_ENOUGH_MONEY;
			}
			return BUYING_BODY_PART;
		}
	}
	return BODY_PART_UPGRADED;
}

sdk.Ship.prototype.upgradeBodyPartList = async function(list) {
	for(let partStruct of list) {
		let result = await this.upgradeBodyPart(partStruct.part, partStruct.gen, MINIMAL_BODY_COST);
		if(result == CHANGING_BODY_PART || result == BUYING_BODY_PART) return CHANGING_PART; // Don't interrupt change of parts
	}
	return ALL_CHANGED;
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