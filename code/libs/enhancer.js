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
	this.account = account;
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
		var struct = {	type: "Ship",
						hullLevel: hullCargo ? hullCargo.body.gen : undefined,
						ID: this.uuid,
						fuel: this.getFuel(),
						fuelMax: this.getMaxFuel(),
						role: role,
						balance: this.details ? this.getBalance() : undefined,
						system: this.getCurrentSystem(),
						hold: this.getHold(),
						holdMax: this.getMaxHold(),
						currentHP: this.getCurrentHP(),
						details: this.details,
						radarData: this.radarData,
						memory: this.memory,};

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
			await delay(subtractedTime);
		}
		return functionResult;
	} catch(e) {
		loggerConsole.debug("Error occured when tried to profile time: " + e.message);
		console.error(e)
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
		let selfPos = new mafs.Pos(this.details.body.vector.x, this.details.body.vector.y);
		let destinationPos = new mafs.Pos(x, y);
		let pathFinder = mafs.pathFind(selfPos, destinationPos);
		let target = this.details.body.target;
		if(pathFinder == ERR_TOO_CLOSE_TO_SUN) {
			loggerShip.error("Can't move, destination is too close to sun!");
			return;
		}
		else if(target && pathFinder.x == target.x && pathFinder.y == target.y) {
			loggerShip.debug("Already moving into position [" + pathFinder.x + "; " + pathFinder.y + "]!");
		}
		else {
			try {
				await this.move(pathFinder.x, pathFinder.y);
				loggerShip.trace("Performing safe movement into spot [" + pathFinder.x + "; " + pathFinder.y + "]");
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
		try {
			await this.equip(slot, item);
			this.details.body[slot].uuid = item;
		} catch(e) {
			loggerShip.debug("Error occured when tried to equip: " + e.message);
		};
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
		let radarResult = await this.radar().catch((e) => {
			loggerShip.debug("Error occured tried to radar: " + e.message);
		});
		this.setRadarMemory(radarResult);
		return radarResult;
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
		loggerShip.warn("Attacking target " + target + " with " + weapons.length + " weapon" + (weapons.length > 1 ? "s" : "") + ".");

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
	if(this.getLocation() == LOCATION_SYSTEM) return;
	if(this.getFuel() == this.getMaxFuel()) return;

	await sdk.profileTime(async function() {
		await this.fuel().catch((e) => {
			loggerShip.debug("Error occured tried to fuel: " + e.message);
		});
	}.bind(this));
} // enhance

sdk.Ship.prototype.safeRepair = async function() {
	if(this.getLocation() == LOCATION_SYSTEM) return;
	if(this.getMaxHold() == this.getCurrentHP()) return;

	await sdk.profileTime(async function() {
		await this.repair().catch((e) => {
			loggerShip.debug("Error occured tried to repair: " + e.message);
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

sdk.Ship.prototype.getEngineSpeed = function() {
	return this.details ? this.details.nodes.find((node) => node.uuid == this.details.body.engine.uuid).body.mods.find((mod) => mod.name == "speed").value : undefined;
}

sdk.Ship.prototype.getShipSpeed = function() {
	return this.details ? (this.getMaxHold() - this.getHold()) / this.getMaxHold() * this.getEngineSpeed() * 0.8 + this.getEngineSpeed() * 0.2 : undefined;
}

sdk.Ship.prototype.getBalance = function() {
	return this.details.body.balance;
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

sdk.Ship.prototype.getEngineMaxWarpDistance = function() {
	return this.details ? this.details.nodes.find((node) => node.body.type == "ENGINE").body.mods.find((mod) => mod.name == "warp").value : undefined;
}

sdk.Ship.prototype.getMaxWarpDistance = function() {
	return Math.min(this.getMaxFuel(), this.getEngineMaxWarpDistance());
}

sdk.Account.prototype.getScore = async function() {
	return (await this.profile()).score;
}

sdk.Ship.prototype.isAlreadyEquiped = function(uuid) {
	let equips = {};
	Object.keys(this.details.body)
		.filter(item => (typeof (this.details.body[item])) == "object" && (this.details.body[item]) != null && (this.details.body[item]).hasOwnProperty("type"))
		.forEach(item => equips[item] = this.details.body[item]);

	return Object.keys(equips).findIndex(item => equips[item].uuid == uuid) != -1;
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
	let index = multiLoop.activeObjects.findIndex(entry => entry.ID == this.uuid);
	multiLoop.activeObjects[index].parked = parked;
	sendInfo("shipParked", {ID: this.uuid, parked: parked});
}

sdk.Ship.prototype.setFlyingFor = function(uuid) {
	if(this.getLocation() != LOCATION_SYSTEM) return -1;

	var system = this.details.parent.uuid;
	multiLoop.flyingFor[system] = multiLoop.flyingFor[system] || {};
	
	multiLoop.flyingFor[system][this.uuid] = uuid;
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
	multiLoop.noDealsFlying[this.getCurrentSystem()] = multiLoop.noDealsFlying[this.getCurrentSystem()] || {};
	var alreadyClaimed = Object.values(multiLoop.noDealsFlying[this.getCurrentSystem()]).indexOf(this.uuid) > -1;
	if(alreadyClaimed) {
		return Object.keys(multiLoop.noDealsFlying[this.getCurrentSystem()]).find((key) => multiLoop.noDealsFlying[this.getCurrentSystem()][key] === this.uuid);
	}

	var objects = [];
	for(planet of allPlanets) {
		objects.push(this.radarData.nodes.find((node) => node.type == "Planet" && node.uuid == planet));
	}
	var sortedPlanets = mafs.sortByDistance(new mafs.Pos(this.details.body.vector.x, this.details.body.vector.y), objects);
	var foundPlanet = undefined;
	for(planet of sortedPlanets) {
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
	if(multiLoop.noDealsFlying[this.getCurrentSystem()][planet]) {
		delete multiLoop.noDealsFlying[this.getCurrentSystem()][planet];
	}
}

sdk.getFilteredTrades = function(type, gen, higher, planetInfo) {
	let isMinerals = type == "MINERALS";
	var filteredDeals;
	if(isMinerals) {
		filteredDeals = planetInfo.deals.filter((deal) => deal.type == "BUY" && deal.expected == type);
	} else {
		if(gen) {
			if(higher) {
				filteredDeals = planetInfo.deals.filter(function(deal) {
					var cargo = planetInfo.nodes.find((node) => node.uuid == deal.target);
					return deal.type == "SELL" && cargo && cargo.body.type == type && cargo.body.gen >= gen;
				});
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
				let tradeCargo = value.nodes.find((node) => node.uuid == sortedDeals[0].target);
				if(sortedDeals[0].price < best.price) {
					best = {planet: [key], price: sortedDeals[0].price, uuid: [sortedDeals[0].uuid], gen: tradeCargo.body.gen};
				} else if(sortedDeals[0].price == best.price) {
					best.planet.push(key);
					best.uuid.push(sortedDeals[0].uuid);
				} else if(best.price == 0 && best.planet.length == 0) {
					best = {planet: [key], price: sortedDeals[0].price, uuid: [sortedDeals[0].uuid], gen: tradeCargo.body.gen};
				}
			}
		}
	}
	if(best.planet.length > 1 && !system) {
		var closestPlanet = this.getClosestPlanet(best.planet);
		var index = best.planet.indexOf(closestPlanet.uuid);
		let struct = {planet: closestPlanet.uuid, price: best.price, uuid: best.uuid[index]};
		if(isMinerals) struct.amount = best.amount;
		else struct.gen = best.gen;
		return struct;
	} else if(best.planet.length == 0) {
		return undefined;
	} else {
		let struct = {planet: best.planet[0], price: best.price, uuid: best.uuid[0]};
		if(isMinerals) struct.amount = best.amount;
		else struct.gen = best.gen;
		return struct;
	}

}

sdk.Ship.prototype.getBestTradeInConstellation = function(type, gen, higher, minAmount) {
	var best = {system: "", planet: "", price: 0, uuid: ""};
	var allBests = {};

	if(!this.getCurrentSystem()) return;

	for(const [system, planets] of Object.entries(multiLoop.deals)) {
		allBests[system] = {planet: "", price: 0, uuid: ""};
		let systemBest;
		if(type == "MINERALS") 	systemBest = this.getBestTrade(type, 1, false, system, minAmount);
		else 					systemBest = this.getBestTrade(type, gen, higher, system);
		if(!systemBest) continue;

		if(type == "MINERALS" ? allBests[system].price < systemBest.price : (allBests[system].price > systemBest.price || allBests[system].price == 0)) {
			allBests[system] = systemBest;
		}
	}
	let filteredBests = {};
	//console.log(allBests);
	allBests = Object.keys(allBests).filter(item => allBests[item].planet).forEach(item => filteredBests[item] = allBests[item]);
	let bestStat;
	if(type == "MINERALS") {
		bestStat = Math.max.apply(Math, Object.keys(filteredBests).map(function(item) { return filteredBests[item].price; }));
	} else {
		bestStat = Math.min.apply(Math, Object.keys(filteredBests).map(function(item) { return filteredBests[item].price; }));
	}

	let priceFilteredBests = {};
	Object.keys(filteredBests)
						.filter(item => (type == "MINERALS" ? (filteredBests[item].price >= bestStat) : (filteredBests[item].price <= bestStat)))
						.forEach(item => priceFilteredBests[item] = filteredBests[item]);

	let filteredSecondTimeBests = {}; // ffs what is that name TODO plz
	if(type != "MINERALS") {
		bestStat = Math.max.apply(Math, Object.keys(priceFilteredBests).map(function(item) { return priceFilteredBests[item].gen; })); // Some math fuckery
		Object.keys(priceFilteredBests)
						.filter(item => (type == "MINERALS" ? priceFilteredBests[item].price : priceFilteredBests[item].gen) >= bestStat)
						.forEach(item => filteredSecondTimeBests[item] = priceFilteredBests[item]);
	} else {
		filteredSecondTimeBests = priceFilteredBests;
	}

	let result = filteredSecondTimeBests[this.getClosestSystem(Object.keys(filteredSecondTimeBests))];
	if(result) {
		result.system = this.getClosestSystem(Object.keys(filteredSecondTimeBests));
		return result;
	}
}

sdk.Ship.prototype.getBestMineralTradeInConstellation = function(minAmount) {
	return this.getBestTradeInConstellation("MINERALS", 1, false, minAmount)
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
	let expireTime = min ? MIN_TRADE_EXPIRE_TIME : TRADE_EXPIRE_TIME;
	return time + expireTime <= new Date().getTime();
}

sdk.Ship.prototype.getAttackingTarget = function() {
	if(!this.getCurrentSystem()) return undefined;

	let memorizedTarget = multiLoop.attackerTargets[this.getCurrentSystem()];
	if(memorizedTarget) {
		// if target left the system
		let target = this.radarData.nodes.find(node => node.uuid == memorizedTarget);
		if(target) {
			loggerShip.info("Found target in system " + this.getCurrentSystem() + " in multiLoop memory.");
			return {system: this.getCurrentSystem(), target: memorizedTarget};
		} else if(HIGH_SEC_SYSTEMS.includes(this.getCurrentSystem()) || !target) {
			delete multiLoop.attackerTargets[this.getCurrentSystem()];
		}
	} else {
		if(HIGH_SEC_SYSTEMS.includes(this.getCurrentSystem())) return;
		let targets = this.radarData.nodes.filter(node => node.type == "Ship" && (node.owner != this.details.owner && !ALLY_IDS.includes(node.owner)));
		let target = targets[0];
		target = mafs.sortByDistance(new mafs.Pos(this.details.body.vector.x, this.details.body.vector.y), targets)[0];
		if(target) {
			loggerShip.info("Found target in system " + this.getCurrentSystem() + " in the system with radarData.");
			this.setAttackingTarget(target.uuid);
			return {system: this.getCurrentSystem(), target: target.uuid};
		}
	}

	return undefined;
}

sdk.Ship.prototype.setAttackingTarget = function(uuid) {
	if(!this.getCurrentSystem()) return;

	multiLoop.attackerTargets = multiLoop.attackerTargets || {};
	multiLoop.attackerTargets[this.getCurrentSystem()] = uuid;
	return multiLoop.attackerTargets;
}

sdk.Ship.prototype.setRadarMemory = function(radarData) {
	if(!this.getCurrentSystem()) return;

	multiLoop.radarMemory = multiLoop.radarMemory || {};
	multiLoop.radarMemory[this.getCurrentSystem()] = multiLoop.radarMemory[this.getCurrentSystem()] || [];
	if(multiLoop.radarMemory[this.getCurrentSystem()].length >= MAX_RADARMEMORY_ELEMENTS) {
		multiLoop.radarMemory[this.getCurrentSystem()].shift();
	}
	let dataCopy = _.cloneDeep(radarData);
	dataCopy.time = new Date().getTime();
	multiLoop.radarMemory[this.getCurrentSystem()].push(dataCopy);
}

sdk.Ship.prototype.getRadarMemory = function() {
	if(!this.getCurrentSystem()) return undefined;
	multiLoop.radarMemory = multiLoop.radarMemory || [];
	multiLoop.radarMemory[this.getCurrentSystem()] = multiLoop.radarMemory[this.getCurrentSystem()] || [];

	return multiLoop.radarMemory[this.getCurrentSystem()];
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

	else if(this.getLocation() != LOCATION_SYSTEM && this.getLocationName() != planetUuid) {
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
	if(this.getLocation() == LOCATION_PLANET) {
		await this.safeFuel();
	}
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
		return rcs.BUSINESS_STATION_NOT_FOUND;
	}
	if(this.getLocation() != LOCATION_BUSINESS_STATION) {
		await this.safeEscape();
	}
	var result;
	if(this.getLocation() == LOCATION_SYSTEM) {
		result = FLYING_TO_BUSINESS_STATION;
		await this.safeLanding(tradeStation.uuid);
		await this.safeMove(tradeStation.body.vector.x, tradeStation.body.vector.y);
	}
	if(this.getLocation() == LOCATION_BUSINESS_STATION) {
		result = rcs.CURRENTLY_DEPOSITING;
		await this.safeFuel();
		if(keep && this.getBalance() < keep) {
			await this.safeApply("DEPOSIT_CLOSE");
			result = rcs.CLOSED_DEPOSIT;
		}
		await this.safeApply("DEPOSIT", this.getBalance() - keepMoney);
	}
	return result;
}

sdk.Ship.prototype.upgradeBodyPart = async function(bodypart, minGen, maxCost, slot) {

	//console.log("Check is actually happening")

	bodypart = bodypart.toLowerCase();
	let bodypartCargo = bodypart.toUpperCase();
	bodypart = bodypart + (slot ? slot : "");
	// Update to support weapons
	let isHull = (bodypart == "hull");

	//if(isHull) bpTrade = this.getBestTrade(bodypartCargo, minGen, true);
	//else bpTrade = this.getBestTradeInConstellation(bodypartCargo, minGen, true);

	let parts = this.hasCargo(bodypartCargo) || [];

	if(!this.getCurrentSystem()) {
		await this.safeEscape();
	}
	
	if(this.hasMinerals()) return rcs.SHIP_HAS_MINERALS;
	//if(isHull && this.getBodyCargo("hull").body.gen == 1 && this.getCurrentSystem() != SYSTEM_SCHEAT) return NOT_IN_SCHEAT;

	let maxParts = 1;
	if(bodypartCargo == "WEAPON") maxParts = 5;

	let oldPart = parts.find((part) => part.body.gen == 1 && !this.isAlreadyEquiped(part.uuid));
	let betterPart = parts.find((part) => part.body.gen > 1 && !this.isAlreadyEquiped(part.uuid));

	if(parts.length > maxParts) {
		if(oldPart) {
			if(this.getLocation() != LOCATION_SYSTEM) {
				await this.safeEscape();
			}
			await this.safeDrop(oldPart.uuid);
		}
		if(betterPart && !isHull) {
			await this.safeEquip(bodypart, betterPart.uuid);
		}
	}

	if(!isHull && this.getBodyCargo("hull").body.gen == 1) return rcs.HULL_IS_LOW_LEVEL;

	if(!this.getBodyCargo(bodypart) || this.getBodyCargo(bodypart).body.gen == 1) {
		let bpTrade = this.getBestTradeInConstellation(bodypartCargo, minGen, true);

		console.log(bodypart);
		console.log(bpTrade)

		if(oldPart) {
			if(this.getLocation() != LOCATION_SYSTEM) {
				await this.safeEscape();
			}
			await this.safeDrop(oldPart.uuid);
		}
		if(betterPart && !isHull) {
			await this.safeEquip(bodypart, betterPart.uuid);
		}

		let requiredBalance = 0;
		if(bpTrade)
			requiredBalance = bpTrade.price + (isHull ? HULL_CHANGE_COST : 0) + (bpTrade.system != this.getCurrentSystem() ? 200 : 0);

		if(bpTrade && bpTrade.system != this.getCurrentSystem()) {
			/*if(this.getBalance() == requiredBalance)
				currLocation = mafs.findWarpDestination(this.getCurrentSystem(), bpTrade.system);
			else
				currLocation = mafs.findWarpDestination(this.getCurrentSystem(), HOME_SYSTEM);
			
			if(currLocation) {
				loggerShip.info("Warping " + (this.getCurrentSystem() + " > " + currLocation));
				await this.safeEscape();
				let coords = WARPS[this.getCurrentSystem()][currLocation];
				await this.safeMove(coords.x, coords.y);
				await this.safeWarp(currLocation);
				return rcs.BUYING_BODY_PART;
			}*/

			

			
			//return rcs.BUYING_BODY_PART;
		}

		if(parts.length > (slot || 1)) {
			if(betterPart) {
				if(isHull && this.getCurrentSystem() == HOME_SYSTEM) {
					if(this.getBalance() == HULL_CHANGE_COST) {
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
				}
				else if(this.getCurrentSystem() != HOME_SYSTEM) {
					loggerShip.info("Flying to Scheat to change hull!");
					await this.warpToSystem(HOME_SYSTEM);
					/*let currLocation = mafs.findWarpDestination(this.getCurrentSystem(), HOME_SYSTEM);
					if(currLocation) {
						loggerShip.info("Warping " + (this.getCurrentSystem() + " > " + currLocation));
						await this.safeEscape();
						let coords = WARPS[this.getCurrentSystem()][currLocation];
						await this.safeMove(coords.x, coords.y);
						await this.safeWarp(currLocation);
					}*/
				}
			}
			return rcs.CHANGING_BODY_PART;
		}

		if(bpTrade)
			loggerShip.info("Found a trade for " + bodypart + ", gen: " + bpTrade.gen + " in system " + bpTrade.system + " with a cost of " + bpTrade.price + ".");

		if(bpTrade && bpTrade.price <= maxCost) {
			if(	(this.getBalance() == requiredBalance && this.getCurrentSystem() == SYSTEM_SCHEAT) || 
				(this.getBalance() >= requiredBalance && this.getCurrentSystem() != SYSTEM_SCHEAT))
				await this.warpToSystem(bpTrade.system);
			else {
				//await this.warpToSystem(HOME_SYSTEM);
			}
			
			if(	(this.getBalance() == requiredBalance && this.getCurrentSystem() == SYSTEM_SCHEAT) || 
				(this.getBalance() >= requiredBalance && this.getCurrentSystem() != SYSTEM_SCHEAT)) {

				loggerShip.info("Flying to " + bpTrade.planet + " to buy " + bodypart + ".");
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
				await this.warpToSystem(HOME_SYSTEM);
				/*let currLocation = mafs.findWarpDestination(this.getCurrentSystem(), HOME_SYSTEM);
				if(currLocation) {
					loggerShip.info("Warping " + (this.getCurrentSystem() + " > " + currLocation));
					await this.safeEscape();
					var coords = WARPS[this.getCurrentSystem()][currLocation];
					await this.safeMove(coords.x, coords.y);
					await this.safeWarp(currLocation);
					return BUYING_BODY_PART;
				}*/
				return rcs.BUYING_BODY_PART;
				//return NOT_ENOUGH_MONEY;
			}
			return rcs.BUYING_BODY_PART;
		} else {
			return rcs.NO_DEALS;
		}
	}
	return rcs.BODY_PART_UPGRADED;
}

sdk.Ship.prototype.upgradeBodyPartList = async function(list) {
	if((await this.account.profile()).score + this.getBalance() < 3000) return rcs.NOT_ENOUGH_SCORE;
	for(let partStruct of list) {
		let result = await this.upgradeBodyPart(partStruct.part, partStruct.gen, MINIMAL_BODY_COST, partStruct.slot);
		//if(result == rcs.CHANGING_BODY_PART || result == rcs.BUYING_BODY_PART) return rcs.LIST_CHANGING_PART; // Don't interrupt change of parts
		//console.log(partStruct.part, result)
		if(result < 0) return rcs.LIST_CHANGING_PART;
		else if(result != rcs.BODY_PART_UPGRADED) return rcs.NOT_DONE_CHANGING_LIST;
	}
	return rcs.LIST_ALL_CHANGED;
}

sdk.Ship.prototype.getClosestLandableInSystem = function() {
	var landables = this.radarData.nodes.filter((node) => node.type == "Planet" || node.type == "BusinessStation" || node.type == "ScientificStation"); // Get all landable spots
	var sortedLandables = mafs.sortByDistance(new mafs.Pos(this.details.body.vector.x, this.details.body.vector.y), landables); // Sort planets by proximity.
	var landable = sortedLandables[0]; // Get closest one
	return landable;
}

sdk.Ship.prototype.getClosestPlanet = function(planetArray) {
	var planets = [];
	for(planet of planetArray) {
		planets.push(this.radarData.nodes.find((node) => node.type == "Planet" && node.uuid == planet));
	}
	if(planets.length == 0) return rcs.NO_PLANETS_FOUND;
	var sortedPlanets = mafs.sortByDistance(new mafs.Pos(this.details.body.vector.x, this.details.body.vector.y), planets); // Sort planets by proximity.
	return sortedPlanets[0];
}

sdk.Ship.prototype.getClosestSystem = function(systemArray) {
	if(!this.getCurrentSystem()) return rcs.CURRENT_SYSTEM_UNKNOWN;
	if(!systemArray.length) return rcs.PLANET_ARRAY_IS_EMPTY;
	var systems = [];
	for(system of systemArray) {
		let coords = SYSTEMS.find(sys => sys.name == system);
		//console.log(system)
		// In order to not ruin sorting code (because it was built to sort space bodies and not systems) we pretend like systems are space bodies.
		systems.push({system: system, body: {vector: {x: coords.x, y: coords.y}}});
	}
	let currSystemCoords = SYSTEMS.find(sys => sys.name == this.getCurrentSystem());
	var sortedSystems = mafs.sortByDistance(new mafs.Pos(currSystemCoords.x, currSystemCoords.y), systems); // Sort planets by proximity.
	return sortedSystems[0].system;
}

sdk.Ship.prototype.warpToSystem = async function(systemName) {
	if(!this.getCurrentSystem()) return;

	if(this.getCurrentSystem() == systemName) return rcs.END_DESTINATION; // return END_DESTINATION

	let path = mafs.findWarpPath(this.getCurrentSystem(), systemName, this.getMaxWarpDistance());

	this.details.path = path;

	if(path.length > 1) {
		let dest = path[1]; // Since [0] is current system, return next system.
		loggerShip.info("Warping " + this.getCurrentSystem() + " > " + dest + ".");
		await this.safeEscape();
		let coords = mafs.getWarpCoords(this.getCurrentSystem(), dest);
		console.log(coords)
		await this.safeMove(coords.x, coords.y);
		await this.safeWarp(dest);
		return rcs.WARPING_TO_SYSTEM;
		//return path[1]; // Since [0] is current system, return next system.
	}

	else if(path.length == 0) {
		loggerShip.warn("No valid path for " + this.getCurrentSystem() + " > " + systemName + "!");
		return rcs.NO_VALID_PATH; // return NO_VALID_PATH
	}
	return rcs.END_DESTINATION; // return END_DESTINATION
}


// End of shortcuts

module.exports = sdk;