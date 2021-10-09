const delay = require("delay");
const path = require("path")
const fs = require("fs");
const retry = require("async-retry");
const _ = require("lodash");

var sdk = require("@cyberspace-dev/sdk"); // It's not our module that we update constantly, so it's requiring with standard function
var mafs = requireModule("./libs/mafs.js");

sdk.dbManager = requireModule("./libs/dbmanager.js");

sdk.Ship.prototype.selfScan = async function(skipScans) {
	if(!skipScans) {
		this.details = await retry(async bail => {
			var exp = await sdk.profileTime(this.explore.bind(this));
			if(exp == rcs.PT_SHIP_IS_DEAD) {
				console.log(`DISCONNECTING SHIP ${this.uuid}`);
				//disconnectObject(this.uuid);
				return undefined;
			}
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
	requireModule("./libs/constants.js");
	this.memory = await sdk.dbManager.getMemory(this);
	var memory = this.memory;
	this.account = account;
	var role = memory.role;
	await this.selfScan(role == ROLE_SCOUT);
	if(this.isLoggingActive()) {
		console.log("\n\n\n");
	}
	this.log("info", "Executing role \"" + role + "\".");
	var moduleName = `./roles/role_${role.toLowerCase()}.js`;
	if(moduleName) {
		var moduleRequire = requireModule(moduleName);
		mafs = requireModule("./libs/mafs.js");
		await moduleRequire.run(this, account, sdk, options);

		let hullCargo = this.getBodyCargo("hull");
		var struct = {
			type: "Ship",
			info: this.getBuildInfo(),
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
			memory: this.memory,
		};

		sendInfo("objectInfo", struct);
	}
}

sdk.Planet.prototype.gatherInfo = async function(account) {
	var moduleName = `./roles/role_planet.js`;;
	var moduleRequire = requireModule(moduleName);

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
		let startTime = new Date().getTime();
		let functionResult = await profilingFunc();
		let deltaTime = (new Date().getTime()) - startTime;
		let subtractedTime = ACTION_DELAY - deltaTime;
		if(subtractedTime > 0) {
			await delay(subtractedTime);
		}
		return functionResult;
	} catch(e) {
		//console.log("First n characters: ", e.message.substring(1, 8), e.message.substring(10, 17));
		//console.log(e.message.substring(1, 8) == "TIMEOUT", e.message.substring(10, 17) == "EXPLORE")
		console.log(profilingFunc);

		console.log("Error occured when tried to profile time: " + e.message);
		console.error(e)
		if(e.message.substring(1, 8) == "TIMEOUT" && e.message.substring(10, 17) == "EXPLORE") {
			// do smth, because our ship died
			console.log("Ship has died!");
			console.log("Ship has died!");
			console.log("Ship has died!");
			console.log("Ship has died!");
			return rcs.PT_SHIP_IS_DEAD;
		} else if(e.message == "DISCONNECTED") {
			console.log("DISCONNECTED!");
			sendInfo("receivedDisconnected", true);
		}
	}
}

sdk.Account.prototype.safeAssemble = async function() {
	return await sdk.profileTime(async function() {
		try {
			await this.assemble();
			loggerConsole.trace("Assembled new ship!");
		} catch(e) {
			if(e.message === "DISCONNECTED") {
				sendInfo("receivedDisconnected", true);
			} 
			loggerConsole.debug("Error occured when tried to assemble: " + e.message);
		}
	}.bind(this));
}

sdk.Ship.prototype.safeMove = async function(x, y) {
	if(this.getLocation() != LOCATION_SYSTEM) return;

	return await sdk.profileTime(async function() {
		let selfPos = mafs.Pos(this.details.body.vector.x, this.details.body.vector.y);
		let destinationPos = mafs.Pos(x, y);
		let pathFinder = mafs.pathFind(selfPos, destinationPos);
		let target = this.details.body.target;
		if(pathFinder == rcs.PF_TOO_CLOSE_TO_SUN) {
			this.log("error", "Can't move, destination is too close to sun!");
			return;
		} else if(pathFinder == rcs.PF_TOO_FAR_FROM_SUN) {
			this.log("error", "Can't move, destination is too far from sun!");
			return;
		}
		else if(target && pathFinder.x == target.x && pathFinder.y == target.y) {
			this.log("debug", "Already moving into position [" + pathFinder.x + "; " + pathFinder.y + "]!");
		}
		else {
			try {
				await this.move(pathFinder.x, pathFinder.y);
				this.log("trace", "Performing safe movement into spot [" + pathFinder.x + "; " + pathFinder.y + "]");
			} catch(e) {
				this.log("debug", "Error occured when tried to move: " + e.message);
			}
		}
	}.bind(this));
}

sdk.Ship.prototype.safeDrop = async function(item) {
	if(this.getLocation() != LOCATION_SYSTEM) return;

	return await sdk.profileTime(async function() {
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
			this.log("error", "Error while dropping item - invalid item passed!");
			return;
		}

		try {
			await this.drop(uuid);
			if(name) {
				this.log("trace", "Dropped item " + name + " (uuid: " + uuid + ").");
			} else {
				this.log("trace", "Dropped item with uuid: " + uuid + ".");
			}
		} catch(e) {
			this.log("debug", "Error occured when tried to drop: " + e.message);
		}
	}.bind(this));
}

sdk.Ship.prototype.safeEquip = async function(slot, item) {
	return await sdk.profileTime(async function() {
		try {
			await this.equip(slot, item);
			this.details.body[slot].uuid = item;
		} catch(e) {
			this.log("debug", "Error occured when tried to equip: " + e.message);
		};
	}.bind(this));
}

sdk.Ship.prototype.safeUnequip = async function(item) {
	return await sdk.profileTime(async function() {
		try {
			await this.unequip(item);
		} catch(e) {
			this.log("debug", "Error occured when tried to unequip: " + e.message);
		}
	}.bind(this));
} // enhance

sdk.Ship.prototype.safeEscape = async function() {
	if(this.getLocation() == LOCATION_SYSTEM) return;

	return await sdk.profileTime(async function() {
		try {
			await this.escape();
			this.setLocalMemory("parked", false);
			this.setParked(false);

			this.details.parent.type = LOCATION_SYSTEM;
		} catch(e) {
			this.log("debug", "Error occured tried to escape: " + e.message);
		}
	}.bind(this));
} // enhance

sdk.Ship.prototype.safeLanding = async function(planet) {
	if(this.getLocation() != LOCATION_SYSTEM) return;

	return await sdk.profileTime(async function() {
		let obj = this.radarData.nodes.find(node => node.uuid == planet);
		let dist = mafs.lineLength(mafs.Line(mafs.Pos(this.details), mafs.Pos(obj)));
		if(dist > 1000) return;
		
		try {
			await this.landing(planet);
			this.setLocalMemory("parked", true);
			this.setParked(true);

			if(planet == BUSINESS_STATION_NAME) {
				this.details.parent.type = LOCATION_BUSINESS_STATION;
			} else if(planet == SCIENTIFIC_STATION_NAME) {
				this.details.parent.type = LOCATION_SCIENTIFIC_STATION;
			} else {
				this.details.parent.type = LOCATION_PLANET;
			}
			this.details.parent.uuid = planet;
		} catch(e) {
			this.log("debug", "Error occured tried to land: " + e.message);
		}
		// experimental
	}.bind(this));
} // enhance

sdk.Ship.prototype.safeWarp = async function(uuid) {
	if(this.getLocation() != LOCATION_SYSTEM) return;

	return await sdk.profileTime(async function() {
		this.log("trace", "Safe warping: " + uuid);
		return await this.warp(uuid).catch((e) => { // if not in coords
			this.log("debug", "Error occured tried to warp: " + e.message);
		});
	}.bind(this));
} // enhance

sdk.Ship.prototype.safeRadar = async function() {
	return await sdk.profileTime(async function() {
		let radarResult = await this.radar().catch((e) => {
			this.log("debug", "Error occured tried to radar: " + e.message);
			console.error(e);
			console.log("WOW\nWOW\nWOW\nWOW\nWOW\nWOW\nWOW\nWOW\nWOW\n");
		});
		this.setRadarMemory(radarResult);
		return radarResult;
	}.bind(this));
} // enhance

sdk.Ship.prototype.safeScan = async function(uuid) {
	return await sdk.profileTime(async function() {
		if(this.getLocation() == LOCATION_SYSTEM) {
			let obj = this.radarData.nodes.find(node => node.uuid == uuid);
			let dist = mafs.lineLength(mafs.Line(mafs.Pos(this.details), mafs.Pos(obj)));
			if(dist > 1000) return;
		}
		return await this.scan(uuid).catch((e) => {
			this.log("debug", "Error occured tried to scan: " + e.message);
		});
	}.bind(this));
} // enhance

sdk.Ship.prototype.safeAccept = async function(uuid, count) {
	if(this.getLocation() == LOCATION_SYSTEM) return;

	return await sdk.profileTime(async function() {
		return await this.accept(uuid, count).catch((e) => {
			this.log("debug", "Error occured tried to accept: " + e.message);
		});
	}.bind(this));
} // enhance

sdk.Ship.prototype.safeApply = async function(commandType, payload) {
	if(this.getLocation() == LOCATION_SYSTEM) return;
	
	return await sdk.profileTime(async function() {
		return await this.apply(commandType, payload).catch((e) => {
			this.log("debug", "Error occured tried to apply: " + e.message);
		});
	}.bind(this));
} // enhance

sdk.Ship.prototype.safeAttack = async function(target, weapons) {
	if(this.getLocation() != LOCATION_SYSTEM) return;

	return await sdk.profileTime(async function() {

		let obj = this.radarData.nodes.find(node => node.uuid == target);
		let dist = mafs.lineLength(mafs.Line(mafs.Pos(this.details), mafs.Pos(obj)));
		if(dist > 3000) return;

		this.log("warn", "Attacking target " + target + " with " + weapons.length + " weapon" + (weapons.length > 1 ? "s" : "") + ".");

		let result = await this.attack(target, weapons).catch((e) => {
			this.log("debug", "Error occured tried to attack: " + e.message);
		});

		this.setLocalMemory("lastAttackTime", new Date().getTime());
		return result;
	}.bind(this));
} // enhance


sdk.Ship.prototype.safeGrab = async function(uuid) {
	if(this.getLocation() != LOCATION_SYSTEM) return;

	return await sdk.profileTime(async function() {
		let obj = this.radarData.nodes.find(node => node.uuid == uuid);
		let dist = mafs.lineLength(mafs.Line(mafs.Pos(this.details), mafs.Pos(obj)));
		if(dist > 1500) return;

		await this.grab(uuid).catch((e) => {
			this.log("debug", "Error occured tried to grab: " + e.message);
		});
	}.bind(this));
} // enhance

sdk.Ship.prototype.safeFuel = async function() {
	if(this.getLocation() == LOCATION_SYSTEM) return;
	if(this.getFuel() == this.getMaxFuel()) return;

	return await sdk.profileTime(async function() {
		await this.fuel().catch((e) => {
			this.log("debug", "Error occured tried to fuel: " + e.message);
		});
	}.bind(this));
} // enhance

sdk.Ship.prototype.safeRepair = async function() {
	if(this.getLocation() == LOCATION_SYSTEM) return;
	if(this.getMaxHold() == this.getCurrentHP()) return;

	return await sdk.profileTime(async function() {
		await this.repair().catch((e) => {
			this.log("debug", "Error occured tried to repair: " + e.message);
		});
	}.bind(this));
} // enhance

sdk.Ship.prototype.safeTransfer = async function(uuid, type) {
	if(this.getLocation() == LOCATION_SYSTEM) return;

	// "out" MEANS TO THE PLANET
	// "in" MEANS TO THE SHIP
	return await sdk.profileTime(async function() {
		await this.transfer(uuid, type).catch((e) => {
			this.log("debug", "Error occured tried to transfer: " + e.message);
		});
	}.bind(this));
} // enhance

// End of safe functions

// Start of getters

sdk.Ship.prototype.getObjectsInSpace = function(type, safe) {
	let allSorted = mafs.sortByDistance(mafs.Pos(this.details), this.radarData.nodes);
	if(safe) {
		allSorted = allSorted.filter(node => mafs.isSafeSpot(mafs.Pos(node)));
	}
	if(type == "") 	return allSorted;
	else 			return allSorted.filter(node => node.type == type);
}

sdk.Ship.prototype.hasCargo = function(type) {
	if(!this.details) return [];

	if(type == "embryo") {
		return this.details.nodes.filter((node) => node.body.view == "ITEM901");
	} else if(type == "virus") {
		return this.details.nodes.filter((node) => node.body.view == "ITEM902");
	} else {
		return this.details.nodes.filter((node) => node.body.type == type);
	}
}

sdk.Ship.prototype.hasMinerals = function() {
	return this.details.nodes.find((node) => node.body.type == "MINERALS");
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

sdk.Ship.prototype.getHPPercentage = function() {
	return this.getCurrentHP() / this.getMaxHold();
}

sdk.Ship.prototype.getGripperPower = function() {
	return this.details ? this.details.nodes.find((node) => node.uuid == this.details.body.gripper.uuid).body.mods.find((mod) => mod.name == "traction").value : undefined;
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
	//return this.details ? this.details.nodes.find((node) => node.body.type == "TANK").body.mods.find((mod) => mod.name == "current_fuel").value : undefined;
	return this.details ? this.details.nodes.find((node) => node.uuid == this.details.body.tank.uuid).body.mods.find((mod) => mod.name == "current_fuel").value : undefined;
}

sdk.Ship.prototype.getMaxFuel = function() {
	return this.details ? this.details.nodes.find((node) => node.uuid == this.details.body.tank.uuid).body.mods.find((mod) => mod.name == "total_fuel").value : undefined;
}

sdk.Ship.prototype.getEngineMaxWarpDistance = function() {
	return this.details ? this.details.nodes.find((node) => node.uuid == this.details.body.engine.uuid).body.mods.find((mod) => mod.name == "warp").value : undefined;
}

sdk.Ship.prototype.getMaxWarpDistance = function() {
	return Math.min(this.getMaxFuel(), this.getEngineMaxWarpDistance());
}

sdk.Account.prototype.getScore = async function() {
	return (await this.profile()).score;
}

sdk.Ship.prototype.getBuildInfo = function() {
	if(!this.details) return undefined;
	let hull = 			this.details.nodes.find((node) => node.uuid == this.details.body.hull.uuid);
	let engine = 		this.details.nodes.find((node) => node.uuid == this.details.body.engine.uuid);
	let tank = 			this.details.nodes.find((node) => node.uuid == this.details.body.tank.uuid);
	let droid = 		this.details.nodes.find((node) => node.uuid == this.details.body.droid.uuid);
	let radar = 		this.details.nodes.find((node) => node.uuid == this.details.body.radar.uuid);
	let scanner = 		this.details.nodes.find((node) => node.uuid == this.details.body.scanner.uuid);
	let gripper = 		this.details.nodes.find((node) => node.uuid == this.details.body.gripper.uuid);
	let protector = 	this.details.nodes.find((node) => node.uuid == this.details.body.protector.uuid);

	let weapon1 = 		this.details.nodes.find((node) => node.uuid == this.details.body.weapon1.uuid);
	let weapon2 = 		this.details.nodes.find((node) => node.uuid == this.details.body.weapon2.uuid);
	let weapon3 = 		this.details.nodes.find((node) => node.uuid == this.details.body.weapon3.uuid);
	let weapon4 = 		this.details.nodes.find((node) => node.uuid == this.details.body.weapon4.uuid);
	let weapon5 = 		this.details.nodes.find((node) => node.uuid == this.details.body.weapon5.uuid);

	let viruses = this.hasCargo("virus");
	let embryos = this.hasCargo("embryo");
	let minerals = this.hasMinerals();

	return {
		hull: 		hull 		? hull.body.gen 		: 0,
		engine: 	engine 		? engine.body.gen 		: 0,
		tank: 		tank 		? tank.body.gen 		: 0,
		droid: 		droid 		? droid.body.gen 		: 0,
		radar: 		radar 		? radar.body.gen 		: 0,
		scanner: 	scanner 	? scanner.body.gen 		: 0,
		gripper: 	gripper 	? gripper.body.gen 		: 0,
		protector: 	protector 	? protector.body.gen 	: 0,

		weapon1:	weapon1		? weapon1.body.gen 		: 0,
		weapon2:	weapon2 	? weapon2.body.gen 		: 0,
		weapon3:	weapon3 	? weapon3.body.gen 		: 0,
		weapon4:	weapon4 	? weapon4.body.gen 		: 0,
		weapon5:	weapon5 	? weapon5.body.gen 		: 0,

		viruses:	viruses		? viruses.length 		: 0,
		embryos:	embryos		? embryos.length 		: 0,
		minerals: 	minerals 	? minerals.body.size 	: 0,
	};
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
	if(index == -1) return;
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
	var sortedPlanets = mafs.sortByDistance(mafs.Pos(this.details.body.vector.x, this.details.body.vector.y), objects);
	var foundPlanet = undefined;
	for(planet of sortedPlanets) {
		if(!(multiLoop.noDealsFlying[this.getCurrentSystem()].hasOwnProperty(planet.uuid))) {
			foundPlanet = planet.uuid;
			return foundPlanet;
		}
	}
	return foundPlanet;
	//this.log("debug", "Flying to no deal planet - " + sortedNoDeals[0].uuid + ".");
	//await ship.parkAtSpecifiedLandable(sortedNoDeals[0].uuid);
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
	type = type.toUpperCase();

	var best = {planet: [], price: 0, uuid: []};

	let isMinerals = (type == "MINERALS");

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

	type = type.toUpperCase();

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
	//console.log(allBests)
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

sdk.Ship.prototype.getAttackingTarget = function(lockedToSystem) {
	if(!this.getCurrentSystem()) return undefined;

	lockedToSystem ??= true;

	let memorizedTarget = multiLoop.attackerTargets[this.getCurrentSystem()];
	if(memorizedTarget) {
		// if target left the system
		let target = this.radarData.nodes.find(node => node.uuid == memorizedTarget);
		if(target) {
			this.log("info", "Found target in current system " + this.getCurrentSystem() + " in multiLoop memory.");
			return {system: this.getCurrentSystem(), target: memorizedTarget};
		} else if(HIGH_SEC_SYSTEMS.includes(this.getCurrentSystem()) || !target) {
			delete multiLoop.attackerTargets[this.getCurrentSystem()];
		}
	} else {
		if(HIGH_SEC_SYSTEMS.includes(this.getCurrentSystem())) return;
		let targets = this.radarData.nodes.filter(node => node.type == "Ship" && (node.owner != this.details.owner && !ALLY_IDS.includes(node.owner)));
		let target = targets[0];
		target = mafs.sortByDistance(mafs.Pos(this.details.body.vector.x, this.details.body.vector.y), targets)[0];
		if(target) {
			this.log("info", "Found target in current system " + this.getCurrentSystem() + " in the system with radarData.");
			this.setAttackingTarget(target.uuid);
			return {system: this.getCurrentSystem(), target: target.uuid};
		} else if(!lockedToSystem) {
			let systems = Object.keys(multiLoop.attackerTargets);
			if(systems.length > 0) {
				let system = systems[0];
				let target = multiLoop.attackerTargets[system];
				this.log("info", "Found target in different system " + system + " from multiLoop memory.");
				return {system: system, target: target};
			}
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

sdk.createPlanetRequest = function(planet, request) {
	// Requests:
	// Sell 	= {request: "sell", 	item: ("minerals"/uuid), 	cost: Number??1							}
	// Buy 		= {request: "buy", 		type: "MINERALS"/other, 	cost: Number??1,	count: Number??1	}
	// Close 	= {request: "close", 	uuid: dealUuid														}
	// Make 	= {request: "make", 	type: type, 				gen: Number								}
	multiLoop.planetRequests ??= {};
	multiLoop.planetRequests[planet] ??= [];
	multiLoop.planetRequests[planet].push(request);
}

sdk.getPlanetRequests = function(planet) {
	multiLoop.planetRequests ??= {};
	multiLoop.planetRequests[planet] ??= [];
	return multiLoop.planetRequests[planet];
}

sdk.Planet.prototype.finishTopRequest = function() {
	multiLoop.planetRequests ??= {};
	multiLoop.planetRequests[this.uuid] ??= [];
	if(multiLoop.planetRequests[this.uuid].length > 0) {
		multiLoop.planetRequests[this.uuid].shift();
	}
}

// End of multi-loop functions

// Start of shortcuts

sdk.Ship.prototype.isLoggingActive = function() {
	return this.uuid == multiLoop.selectedShip;
}

sdk.Ship.prototype.log = function(type, msg) {
	if(arguments.length == 1) {
		msg = type;
		type = "info";
	}
	log(type, msg, this.uuid);
}

sdk.Planet.prototype.log = function(type, msg) {
	if(arguments.length == 1) {
		msg = type;
		type = "info";
	}
	log(type, msg, this.uuid);
}

function log(type, msg, uuid) {
	if(uuid == multiLoop.selectedShip) {
		type = type.toLowerCase();
		loggerShip.addContext("Ship", uuid);
		switch(type) {
			case "trace":
				loggerShip.trace(msg);
				break;
			case "debug":
				loggerShip.debug(msg);
				break;
			case "info":
				loggerShip.info(msg);
				break;
			case "warn":
				loggerShip.warn(msg);
				break;
			case "error":
				loggerShip.error(msg);
				break;
			case "fatal":
				loggerShip.fatal(msg);
				break;
		}
	}
}

sdk.Ship.prototype.findLandables = function() {
	let landables = this.radarData.nodes.filter(node => node.type == "Planet" || node.type == "BusinessStation" || node.type == "ScientificStation"); // Get all landable spots
	let sortedLandables = mafs.sortByDistance(mafs.Pos(this.details), landables); // Sort landables by proximity.
	return sortedLandables;
}

sdk.Ship.prototype.findInhabitedLandables = function() {
	return this.findLandables().filter(landable => landable.owner != "");
}

sdk.Ship.prototype.findPlanets = function() {
	return this.findLandables().filter(node => node.type == "Planet");
}

sdk.Ship.prototype.parkAtNearbyObject = async function(landable) {
	if(this.getLocation() != LOCATION_SYSTEM) {
		this.setLocalMemory("parked", true);
		await this.safeFuel();
		return rcs.PASP_AT_THE_PLANET;
	} else {
		return await this.parkAtSpecifiedLandable(landable);
	}
}

sdk.Ship.prototype.parkAtNearbyLandable = async function() {
	return await this.parkAtSpecifiedLandable(this.findLandables()[0].uuid);
}

sdk.Ship.prototype.parkAtNearbyInhabitedLandable = async function() {
	//return await this.parkAtNearbyObject(this.findInhabitedLandables()[0].uuid);
	return await this.parkAtSpecifiedLandable(this.findInhabitedLandables()[0].uuid);
}

sdk.Ship.prototype.parkAtNearbyPlanet = async function() {
	//return await this.parkAtNearbyObject(this.findPlanets()[0].uuid);
	return await this.parkAtSpecifiedLandable(this.findPlanets()[0].uuid);
}

sdk.Ship.prototype.parkAtSpecifiedLandable = async function(landableUuid) {
	if(!landableUuid) return 0;

	if(this.getLocation() != LOCATION_SYSTEM && this.getLocationName() == landableUuid) {
		this.setLocalMemory("parked", true);
		this.setParked(true);
		await this.safeFuel();
		return rcs.PASL_AT_THE_LANDABLE;
	}

	else if(this.getLocation() != LOCATION_SYSTEM && this.getLocationName() != landableUuid) {
		await this.safeEscape();
		return rcs.PASL_ESCAPING;
	}
	else {
		var landable = this.radarData.nodes.find((node) => node.uuid == landableUuid);
		if(landable) {
			var vect = mafs.Line(mafs.Pos(this.details), mafs.Pos(landable));
			let extendDelta = landable.type == "Planet" ? 40 : 0;
			var extended = mafs.extendLine(vect, extendDelta);
			await this.safeLanding(landable.uuid);
			await this.safeMove(extended.p2.x, extended.p2.y);
			return rcs.PASL_FLYING_TO_LANDABLE;
		} else {
			this.log("warn", "CANT FIND LANDABLE");
			return rcs.PASL_CANT_FIND_LANDABLE;
		}
	}
}

sdk.Ship.prototype.operateMoney = async function(keep) {
	var keepMoney = keep ?? KEEP_MINIMUM;
	var tradeStation = this.radarData.nodes.find((node) => node.type == "BusinessStation");
	let result;
	if(this.getBalance() == keep) {
		result = rcs.OM_OPERATING_NOT_REQUIRED;
	}
	else if(!tradeStation) {
		result = rcs.OM_BUSINESS_STATION_NOT_FOUND;
	} else {
		if(this.getLocation() != LOCATION_BUSINESS_STATION) {
			await this.safeEscape();
		}
		if(this.getLocation() == LOCATION_SYSTEM) {
			result = rcs.OM_FLYING_TO_BUSINESS_STATION;
			await this.safeLanding(tradeStation.uuid);
			await this.safeMove(tradeStation.body.vector.x, tradeStation.body.vector.y);
		}
		if(this.getLocation() == LOCATION_BUSINESS_STATION) {
			result = rcs.OM_CURRENTLY_DEPOSITING;
			await this.safeFuel();
			if(keep && this.getBalance() < keep) {
				await this.safeApply("DEPOSIT_CLOSE");
				result = rcs.OM_CLOSED_DEPOSIT;
			}
			if(this.getBalance() != keep) {
				await this.safeApply("DEPOSIT", this.getBalance() - keepMoney);
			}
		}
	}
	switch(result) {
		case rcs.OM_OPERATING_NOT_REQUIRED:
			this.log("info", "I already have required amount of money on me!");
			break;
		case rcs.OM_BUSINESS_STATION_NOT_FOUND:
			this.log("warn", "I can't find business station, I'm not in Scheat!");
			break;
		case rcs.OM_FLYING_TO_BUSINESS_STATION:
			this.log("info", "I have some money on me, so I'm flying to business station to deposit it there!");
			break;
		case rcs.OM_CURRENTLY_DEPOSITING:
			this.log("info", "I'm on business station and depositing my money there!");
			break;
		case rcs.OM_CLOSED_DEPOSIT:
			this.log("warn", "Deposit closed, so be extra aware!");
			break;
	}
	return result;
}

sdk.Ship.prototype.switchToBetterPart = async function(bodypart, dropPrevious, destroyPrevious, slot) {
	dropPrevious ??= false;
	destroyPrevious ??= false;
	if(!bodypart) return rcs.STBP_NO_BODYPART_PASSED_TO_SWITCH;
	bodypart = bodypart.toLowerCase();
	let isHull = (bodypart == "hull"); // Hulls require special change

	let parts = this.hasCargo(bodypart.toUpperCase()) ?? [];

	if(this.details) {
		let currentPart = this.details.nodes.find(node => node.uuid == this.details.body[bodypart + slot].uuid);

		let currGen = currentPart ? currentPart.body.gen : 1;
		let betterParts = parts.filter((part) => part.body.gen > currGen && !this.isAlreadyEquiped(part.uuid)); // get all parts which gen is higher than current one
		//let previousPart = this.details.nodes.find((node) => node.uuid == this.details.body[bodypart + slot].uuid);
		let previousPart = parts.find((part) =>  part.body.gen <= currGen && !this.isAlreadyEquiped(part.uuid));
		let partAround = this.getObjectsInSpace("Cargo").filter((node) => node.body.type != "MINERALS")[0];
		if(betterParts.length) {
			betterParts.sort((a, b) => b.body.gen - a.body.gen);
			this.log(betterParts);
			let betterPart = betterParts[0];
			if(betterPart) {
				if(isHull) {
					if(this.getCurrentSystem() == HOME_SYSTEM) {
						if(this.getBalance() == HULL_CHANGE_COST) {
							this.log("Flying to scientific station to change hull!");
							var sciStation = this.radarData.nodes.find((instance) => instance.type == LOCATION_SCIENTIFIC_STATION);
							this.log(betterPart);
							if(sciStation) {
								if(this.getLocation() != LOCATION_SCIENTIFIC_STATION) {
									await this.safeEscape();
								}
								await this.safeMove(sciStation.body.vector.x, sciStation.body.vector.y);
								await this.safeLanding(sciStation.uuid);
								if(this.getLocation() == LOCATION_SCIENTIFIC_STATION) {
									await this.safeApply("CHANGE_HULL", betterPart.uuid);
								}
							}
							return rcs.STBP_CHANGING_HULL;
						} else {
							this.log("Getting " + HULL_CHANGE_COST + " for hull change.");
							await this.operateMoney(HULL_CHANGE_COST);
							return rcs.STBP_OPERATING_MONEY;
						}
					} else {
						this.log("Flying to Scheat to change hull!");
						await this.warpToSystem(HOME_SYSTEM);
						return rcs.STBP_WARPING_TO_SCHEAT;
					}
				} else {
					this.log(`Changing bodypart ${bodypart + slot} from part gen ${previousPart ? previousPart.body.gen : 0} to part gen ${betterPart.body.gen}.`);
					await this.safeEquip(bodypart + slot, betterPart.uuid);
					return rcs.STBP_CHANGING_BODYPART;
				}
			}

		} else if(previousPart && dropPrevious) {
			if(this.getLocation() != LOCATION_SYSTEM) {
				await this.safeEscape();
			}
			this.log(`Dropping previous part ${previousPart.uuid}!`);
			await this.safeDrop(previousPart.uuid);
			if(destroyPrevious) {
				this.log(`Destroying previous part ${previousPart.uuid}!`);
				await this.safeAttack(previousPart.uuid, [1,2,3,4,5]);
				return rcs.STBP_DESTROYING_BODYPART;
			}
		} else if(destroyPrevious && partAround && mafs.lineLength(mafs.Line(mafs.Pos(this.details), mafs.Pos(partAround))) < 1000) {
			await this.safeMove(partAround.body.vector.x, partAround.body.vector.y);
			await this.safeAttack(partAround.uuid, [1,2,3,4,5]);
			return rcs.STBP_DESTROYING_BODYPART;
		} else {
			//this.log("info", "no better parts lol?");
			return rcs.STBP_NO_BETTER_PARTS;
		}
	}
}

sdk.Ship.prototype.buyBodyPart = async function(bodypart, minGen, maxCost) {
	bodypart = bodypart.toLowerCase();
	maxCost ??= MINIMAL_BODY_COST;
	let bpTrade = this.getBestTradeInConstellation(bodypart.toUpperCase(), minGen, true);
	if(bodypart != "hull" && this.getBodyCargo("hull").body.gen == 1) return rcs.BBP_HULL_IS_LOW_LEVEL;
	this.log(bpTrade);
	if(bpTrade) {
		if(bpTrade.price <= maxCost) {
			let requiredBalance = bpTrade.price + KEEP_MINIMUM;
			this.log(`Found a trade for ${bodypart}, gen ${bpTrade.gen} in system ${bpTrade.system} with a cost of ${bpTrade.price}.`);

			if(this.hasMinerals()) {
				await this.sellMineralsToFederation();
				return rcs.BBP_SELLING_MINERALS;
			}

			if(this.getBalance() >= requiredBalance && this.getBalance() <= requiredBalance * MAXIMUM_MONEY_ONBOARD_MULTIPLIER) { // in range to avoid grabbing all the money and just flying. Also fixes constant returns for more money.

				if(this.getCurrentSystem() != bpTrade.system) {
					await this.warpToSystem(bpTrade.system);
					return rcs.BBP_WARPING_TO_DESTINATION;
				}
				else {
					this.log("info", `Flying to ${bpTrade.planet} to buy ${bodypart}.`);
					await this.parkAtSpecifiedLandable(bpTrade.planet);

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
					return rcs.BBP_BUYING_BODY_PART;
				}
			} else if(this.getCurrentSystem() == SYSTEM_SCHEAT) {
				let operatingMoney = requiredBalance < 10000 ? requiredBalance * MONEY_OPERATION_MULTIPLIER : requiredBalance;
				this.log("info", `Operating ${operatingMoney} for a ${bodypart} change.`);
				await this.operateMoney(operatingMoney);
				return rcs.BBP_OPERATING_MONEY;
			} else {
				await this.warpToSystem(HOME_SYSTEM);
				return rcs.BBP_WARPING_TO_SCHEAT;
			}
		} else {
			this.log(`Price for part ${bodypart} is too high! (${bpTrade.price})`);
			return rcs.BBP_PRICE_TOO_HIGH;
		}
	} else {
		return rcs.BBP_NO_DEALS;
	}
}

sdk.Ship.prototype.upgradeBodyPart = async function(bodypart, minGen, extra) {
	bodypart = bodypart.toLowerCase();

	extra ??= {};
	extra.maxCost ??= MINIMAL_BODY_COST;
	extra.stopAtMinGen ??= true;
	extra.doNotStop ??= false;
	extra.dropPrevious ??= false;
	extra.destroyPrevious ??= false;
	extra.slot ??= "";

	let currBodyGen = this.getBodyCargo(bodypart + extra.slot) ? this.getBodyCargo(bodypart + extra.slot).body.gen : 0;
	let finishedCondition = extra.stopAtMinGen ? 	(currBodyGen >= minGen) :
													(currBodyGen == 8 && !extra.doNotStop);

	if(finishedCondition) return rcs.UBP_FINISHED;

	if(await this.switchToBetterPart(bodypart, extra.dropPrevious, extra.destroyPrevious, extra.slot) < 0) return rcs.UBP_BUYING_BODYPART;
	if(await this.buyBodyPart(bodypart, minGen, extra.maxCost) < 0) return rcs.UBP_SWITCHING_BODYPART;

	return rcs.UBP_FINISHED;
}

sdk.Ship.prototype.upgradeBodyPartList = async function(list, maxCost) {
	maxCost ??= MINIMAL_BODY_COST;
	if((multiLoop.profileInfo).score + this.getBalance() < maxCost * 3) return rcs.UBPL_NOT_ENOUGH_SCORE;
	for(let partStruct of list) {
		partStruct.part = partStruct.part.toLowerCase();
		partStruct.extra ??= {};
		partStruct.extra.maxCost = maxCost;
		let result = await this.upgradeBodyPart(partStruct.part, partStruct.gen, partStruct.extra);
		//this.log(`Important: ${partStruct.part}, ${result}`);
		if(result < 0) return rcs.UBPL_LIST_CHANGING_PART;
		else if(result != rcs.UBP_FINISHED) return rcs.UBPL_NOT_DONE_CHANGING_LIST;
	}
	return rcs.UBPL_LIST_ALL_CHANGED;
}

sdk.Ship.prototype.getClosestLandableInSystem = function() {
	var landables = this.radarData.nodes.filter((node) => node.type == "Planet" || node.type == "BusinessStation" || node.type == "ScientificStation"); // Get all landable spots
	var sortedLandables = mafs.sortByDistance(mafs.Pos(this.details), landables); // Sort planets by proximity.
	var landable = sortedLandables[0]; // Get closest one
	return landable;
}

sdk.Ship.prototype.getClosestPlanet = function(planetArray) {
	var planets = [];
	for(planet of planetArray) {
		planets.push(this.radarData.nodes.find((node) => node.type == "Planet" && node.uuid == planet));
	}
	if(planets.length == 0) return rcs.NO_PLANETS_FOUND;
	var sortedPlanets = mafs.sortByDistance(mafs.Pos(this.details), planets); // Sort planets by proximity.
	return sortedPlanets[0];
}

sdk.Ship.prototype.getClosestSystem = function(systemArray) {
	if(!this.getCurrentSystem()) return rcs.CURRENT_SYSTEM_UNKNOWN;
	if(!systemArray.length) return rcs.PLANET_ARRAY_IS_EMPTY;
	var systems = [];
	for(system of systemArray) {
		let coords = SYSTEMS.find(sys => sys.name == system);
		// In order to not ruin sorting code (because it was built to sort space bodies and not systems) we pretend like systems are space bodies.
		systems.push({system: system, body: {vector: {x: coords.x, y: coords.y}}});
	}
	let currSystemCoords = SYSTEMS.find(sys => sys.name == this.getCurrentSystem());
	var sortedSystems = mafs.sortByDistance(mafs.Pos(currSystemCoords.x, currSystemCoords.y), systems); // Sort planets by proximity.
	return sortedSystems[0].system;
}

sdk.Ship.prototype.warpToSystem = async function(systemName) {
	if(!this.getCurrentSystem()) return;

	if(this.getCurrentSystem() == systemName) return rcs.WTS_END_DESTINATION; // return END_DESTINATION

	let result = mafs.findWarpPath(this.getCurrentSystem(), systemName, this.getMaxWarpDistance());

	let path = result.path;
	let cost = result.cost;

	if((cost * 10) > this.getBalance()) {
		this.log("debug", "I refuse to send ship into warp path without enough money to fuel!");
		return rcs.WTS_NOT_ENOUGH_MONEY_FOR_FUEL;
	}

	this.details.path = path;

	if(path.length > 1) {
		let dest = path[1]; // Since [0] is current system, return next system.

		if(this.getFuel() < mafs.fuelNeededToWarp(this.getCurrentSystem(), dest)) {
			let landables = this.findInhabitedLandables();
			if(landables.length) {
				await this.parkAtSpecifiedLandable(landables[0].uuid);
				this.log("Landing at inhabited landable to refuel!");
				return rcs.WTS_REFUELING;
			}
		}

		this.log("info", "Warping " + this.getCurrentSystem() + " > " + dest + ".");
		await this.safeEscape();
		let coords = mafs.getWarpCoords(this.getCurrentSystem(), dest);
		await this.safeMove(coords.x, coords.y);
		await this.safeWarp(dest);
		return rcs.WTS_WARPING_TO_SYSTEM;
	}

	else if(path.length == 0) {
		this.log("warn", "No valid path for " + this.getCurrentSystem() + " > " + systemName + "!");
		return rcs.WTS_NO_VALID_PATH;
	}
	return rcs.WTS_END_DESTINATION;
}

sdk.Ship.prototype.clearPlanetBalance = async function(planetUuid) {
	if(this.getLocationName() == planetUuid) {
		let requests = sdk.getPlanetRequests(planetUuid);
		let scannedPlanet = await this.safeScan(planetUuid);
		let planetBalance = scannedPlanet.body.balance;
		let planetDeals = scannedPlanet.body.deals;
		if(planetBalance == 0) return rcs.CPB_BALANCE_CLEARED;
		try {
			if(!scannedPlanet) return;
			let minerals = scannedPlanet.nodes.find(node => node.body.type == "MINERALS");
			if(planetDeals.length == 0 && requests.length == 0 && planetBalance > 0) {
				if(this.hasMinerals()) {
					this.log("info", "Creating sell trade to get all money from planet " + planetUuid);
					sdk.createPlanetRequest(planetUuid, {request: "buy", type: "MINERALS", cost: planetBalance});
				} else {
					this.log("info", "Creating buy trade to get 1 mineral from planet " + planetUuid);
					sdk.createPlanetRequest(planetUuid, {request: "sell", item: "minerals", count: 1});
				}
				return rcs.CPB_EXECUTING_DEALS;
			} else if(planetDeals.length > 0) {
				await this.safeAccept(planetDeals[0].uuid, 1);
			}
		} catch(e) {
			this.log("warn", "Error while clearing planet balance: " + e.message);
		}
	} else {
		this.log("info", "Flying to " + planetUuid + " to clear planet balance.");
		await this.parkAtSpecifiedLandable(planetUuid);
		return rcs.CPB_FLYING_TO_PLANET;
	}
}

sdk.Ship.prototype.getMineralsFromPlanet = async function(planetUuid, count) {
	if(this.getLocationName() == planetUuid) {
		let requests = sdk.getPlanetRequests(planetUuid);
		let scannedPlanet = await this.safeScan(planetUuid);
		let planetDeals = scannedPlanet.body.deals;
		try {
			if(!scannedPlanet) return;
			let shipMinerals = this.hasMinerals() ? this.hasMinerals().body.size : 0;
			if(shipMinerals >= count) {
				this.log("info", "I already have " + count + " or more minerals in storage!");
				return;
			}
			let planetMinerals = scannedPlanet.nodes.find(node => node.body.type == "MINERALS");
			if(!planetMinerals) {
				this.log("info", "No minerals on planet!");
				return;
			}
			let maximumCount = Math.min(count, planetMinerals.body.size + shipMinerals); // Maximum amount of minerals we need or can get.
			let finalCount = maximumCount - shipMinerals;
			if(planetDeals.length == 0 && requests.length == 0) {
				this.log("info", "Creating sell trade to get " + finalCount + " minerals from planet " + planetUuid);
				sdk.createPlanetRequest(planetUuid, {request: "sell", item: "minerals", count: finalCount});
			} else if(planetDeals.length > 0) {
				await this.safeAccept(planetDeals[0].uuid, finalCount);
			}
		} catch(e) {
			this.log("warn", "Error while getting minerals from planet: " + e.message);
			console.error(e)
		}
	} else {
		this.log("info", "Flying to " + planetUuid + " to get " + count + " minerals.");
		await this.parkAtSpecifiedLandable(planetUuid);
	}
}

sdk.Ship.prototype.transferAllMineralsToPlanet = async function(planetUuid) {
	let shipMinerals = this.hasMinerals() ? this.hasMinerals().body.size : 0;
	if(shipMinerals == 0) {
		this.log("warn", "No minerals on ship to sell, aborting!");
		return rcs.TAMTP_NO_MINERALS;
	}

	if(this.getLocationName() == planetUuid) {
		let requests = sdk.getPlanetRequests(planetUuid);
		let scannedPlanet = await this.safeScan(planetUuid);
		//if(scannedPlanet) {}
		let planetBalance = scannedPlanet.body.balance;
		try {
			let planetMinerals = scannedPlanet.nodes.find(node => node.body.type == "MINERALS");
			let transferAmount = Math.min(this.getBalance(), shipMinerals);
			if(scannedPlanet.body.deals.length == 0 && requests.length == 0) {
				if(planetBalance < transferAmount) {
					this.log("info", "Creating sell trade to get enough money (" + (transferAmount - planetBalance) + ") for planet " + planetUuid + " to accept the buy trade");
					sdk.createPlanetRequest(planetUuid, {request: "sell", item: "minerals", cost: transferAmount - planetBalance +1}); // +1 is delta of minerals transferred for the above statement to be true
				} else {
					this.log("info", "Creating buy trade to transfer " + transferAmount + " minerals to planet " + planetUuid);
					sdk.createPlanetRequest(planetUuid, {request: "buy", type: "MINERALS", cost: 1, count: transferAmount});
				}
			} else if(scannedPlanet.body.deals.length > 0) {
				let deal = scannedPlanet.body.deals[0];
				this.log("info", "Executing deal \"" + deal.type + "\"");
				await this.safeAccept(deal.uuid, (deal.type == "BUY" ? Math.min(transferAmount, deal.count) : 1));
				this.log("info", deal);
			}
		} catch(e) {
			this.log("warn", "Error while transfering minerals to planet: " + e.message);
		}
		return rcs.TAMTP_TRANSFERRING_MINERALS;
	}
	else {
		this.log("info", "Flying to " + planetUuid + " to sell minerals.");
		await this.parkAtSpecifiedLandable(planetUuid);
		return rcs.TAMTP_FLYING_TO_PLANET;
	}
}

sdk.Ship.prototype.createModuleOnPlanet = async function(planetUuid, type, gen) {
	//console.log(this.getLocationName())
	if(this.getLocationName() == planetUuid) {
		type = type.toUpperCase();
		let requests = sdk.getPlanetRequests(planetUuid);
		let scannedPlanet = await this.safeScan(planetUuid);
		if(!scannedPlanet) return;
		let modules = scannedPlanet.nodes.filter(node => node.type == "Cargo" && node.body.type != "MINERALS");
		if(modules.length == 0) {
			this.log("info", "Creating \"make\" request for " + type + " with gen " + gen + ".");
			sdk.createPlanetRequest(planetUuid, {request: "make", type: type, gen: gen});
		}
	} else {
		this.log("info", "Flying to " + planetUuid + " to create module " + type + " with gen " + gen + ".");
		await this.parkAtSpecifiedLandable(planetUuid);
	}
}

sdk.Ship.prototype.transferMineralsBetweenPlanets = async function(from, to, maxAmount) {
	if(this.hasMinerals()) {
		await this.transferAllMineralsToPlanet(to);
	} else {
		await this.getMineralsFromPlanet(from, maxAmount);
	}
}

sdk.Ship.prototype.grabMineralsInSystem = async function() {
	let allCargos = this.radarData.nodes.filter((node) => node.type == "Cargo" && node.body.type == "MINERALS" && mafs.isSafeSpot(mafs.Pos(node.body.vector.x, node.body.vector.y)));
	if(!allCargos.length) return rcs.GMIS_NO_MINERALS;

	let sortedCargos = mafs.sortByDistance(mafs.Pos(this.details.body.vector.x, this.details.body.vector.y), allCargos);
	this.log("info", "I see some cargos, so i'm flying to them!");

	await this.safeEscape();
	if(this.getLocation() == LOCATION_SYSTEM) {
		var found = false;
		this.log("warn", "I HAVE NOT MEMORIZED IT");

		let cargoTarget = sortedCargos.find(cargo => cargo.body.type == "MINERALS" && mafs.isSafeSpot(mafs.Pos(cargo.body.vector.x, cargo.body.vector.y)));
		if(cargoTarget) {
			let cargoVector = cargoTarget.body.vector;
			let scan = await this.safeScan(cargoTarget.uuid);
			await this.safeMove(cargoVector.x, cargoVector.y);
			if(scan) {
				if(scan.body.size > this.getGripperPower()) {
					await this.safeAttack(cargoTarget.uuid, [1]);
				} else {
					await this.safeGrab(cargoTarget.uuid);
				}
			}
			return rcs.GMIS_GRABBING_MINERAL;
		}
		else return rcs.GMIS_NO_MINERALS;
	}
	else return rcs.GMIS_LOCATION_NOT_SYSTEM;
}

sdk.Ship.prototype.captureAsteroid = async function() {
	if(await this.acknowledgeSystem() < 0) return rcs.CA_ACKNOWLEDGING_SYSTEM;

	if(this.getHPPercentage() < 0.8) {
		this.log("info", "Repairing with drone to be able to go for asteroids!");
		await this.safeEscape();
		let landable = this.findLandables()[0];
		await this.safeMove(landable.body.vector.x, landable.body.vector.y);
		return rcs.CA_REPAIRING_WITH_DRONE;
	}
	let asteroids = this.getObjectsInSpace("Asteroid", true);

	let radarMemory = this.getRadarMemory();
	if(radarMemory && radarMemory.length >= 2) {
		let currSnapshot = radarMemory[radarMemory.length - 1];
		let previousSnapshot = radarMemory[radarMemory.length - 2];
		let timeDelta = currSnapshot.time - previousSnapshot.time;

		let interceptableAsteroid;

		for(let asteroid of asteroids) {
			let asteroidSnapshot = previousSnapshot.nodes.find(node => node.uuid == asteroid.uuid);
			let currShipPos = mafs.Pos(this.details);
			//console.log(currShipPos)

			scalarShipSpeed = (this.getShipSpeed() / 251.4); // Yes, magic number. What are you going to do, call cops? Somehow, thru magic it makes sense to the game

			if(asteroidSnapshot) {
				// Then we are able to calculate and actually attack asteroid
				//this.log("warn", "Spotted asteroid, trying to calculate...");

				let shipPos = mafs.Pos(this.details.body.vector.x, this.details.body.vector.y);
				let currAsteroidPos = mafs.Pos(asteroid.body.vector.x, asteroid.body.vector.y);
				let prevAsteroidPos = mafs.Pos(asteroidSnapshot.body.vector.x, asteroidSnapshot.body.vector.y);

				let locationDelta = mafs.Pos(currAsteroidPos.x - prevAsteroidPos.x, currAsteroidPos.y - prevAsteroidPos.y);

				let asteroidSpeed = mafs.Pos(locationDelta.x / timeDelta, locationDelta.y / timeDelta);

				// try to adjust position of asteroid so we catch up in correct time
				currAsteroidPos = mafs.Pos(currAsteroidPos.x + locationDelta.x, currAsteroidPos.y + locationDelta.y);

				/*
				 * Thanks to:
				 * https://stackoverflow.com/questions/10358022/find-the-better-intersection-of-two-moving-objects
				 *
				 * l1 = currAsteroidPos
				 * v1 = asteroidSpeed
				 *
				 * l2 = currShipPos
				 * s2 = scalarShipSpeed
				 */


				let interception = mafs.findInterceptionOfAsteroid(currAsteroidPos, asteroidSpeed, currShipPos, scalarShipSpeed);

				/*if(isNaN(interception) && typeof interception != "object") {
					//this.log("warn", "Collision is impossible!");
					//return rcs.CA_INTERCEPTION_IMPOSSIBLE;
				} else*/if(mafs.lineLength(mafs.Line(mafs.Pos(0, 0), interception)) < 10000) { // ships die after 30000 from sun
					this.log("warn", "Found an asteroid with possible interception!");
					interceptableAsteroid = {uuid: asteroid.uuid, interception: interception};
					break;
				}
			}
		}
		if(interceptableAsteroid) {
			await this.safeAttack(interceptableAsteroid.uuid, [1]);

			if(this.getLocation() != LOCATION_SYSTEM) {
				await this.safeEscape();
			}

			await this.safeMove(interceptableAsteroid.interception.x, interceptableAsteroid.interception.y);
			return rcs.CA_INTERCEPTING_ASTEROID;
		} else {
			return rcs.CA_INTERCEPTION_IMPOSSIBLE;
		}
	}
	return rcs.CA_INTERCEPTION_IMPOSSIBLE;
}

sdk.Ship.prototype.sellMineralsToFederation = async function() {
	let bestMineralTrade = this.getBestMineralTrade();
	if(bestMineralTrade) {
		this.log("I have minerals on the board, so I'm flying to planet and try to sell them.");
		this.log("info", bestMineralTrade);

		await this.parkAtSpecifiedLandable(bestMineralTrade.planet);
		let planetInfo = await this.safeScan(bestMineralTrade.planet);
		if(planetInfo) {
			this.setPlanetDeals(planetInfo);
			if(this.getLocation() == LOCATION_PLANET) {
				await this.safeAccept(bestMineralTrade.uuid);
				await this.safeFuel();
				planetInfo = await this.safeScan(bestMineralTrade.planet);
				this.setPlanetDeals(planetInfo);
			}
		}
		return rcs.SMTF_SELLING_MINERALS;
	} else return rcs.SMTF_NO_DEALS;
}

sdk.Ship.prototype.refuelAtNearbyLandable = async function() {
	if(this.acknowledgeSystem() < 0) return rcs.RANL_REFUELING;
	if(this.getMaxFuel() == this.getFuel()) return rcs.RANL_TANK_IS_FULL;
	if(this.findInhabitedLandables().length == 0) return rcs.RANL_NO_INHABITED_LANDABLES;

	this.log("Refueling...");
	await this.parkAtNearbyInhabitedLandable();
	return rcs.RANL_REFUELING;
}

sdk.Ship.prototype.acknowledgeSystem = async function() {
	if(this.getCurrentSystem()) return rcs.AC_KNOWN;
	else {
		await this.safeEscape();
		return rcs.AS_ACKNOWLEDGING;
	}
}

// End of shortcuts

module.exports = sdk;