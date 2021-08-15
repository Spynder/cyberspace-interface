var mafs = require("../libs/mafs");

module.exports = {
	run: async function(ship, account, sdk, options) {
		// 1. Warp into correct system
		// 2. Drop reduntant items
		// 3. If you have any minerals fly and sell 'em
		// 4. If balance > [X] fly to business station.
		// 5. If any minerals spotted, fly to 'em and collect.
		// 6. If we see any asteroids, try to catch them.
		// 7. Else we have nothing to do and just park to nearby station.

		let radarData = ship.radarData; // Get all objects in current system
		let cargos = radarData.nodes.filter((node) => node.type == "Cargo" && node.body.type == "MINERALS" && mafs.isSafeSpot(mafs.Pos(node.body.vector.x, node.body.vector.y)));
		let details = ship.details; // Get details of our ship
		let memory = ship.memory;
		let immediatePark = !options.active;

		if(immediatePark) {
			ship.log("info", "Parking at nearby landable by command.");
			await ship.parkAtNearbyLandable();
			if(ship.getLocation() != LOCATION_SYSTEM) {
				ship.setParked(true);
			}
			return;
		}

		// Throw out all useless items for miner ship
		for(let item of USELESS_MINER_ITEMS) {
			let cargo = details.body[item];
			if(cargo.uuid) {
				await ship.safeEscape();
				await ship.safeUnequip(item)
				await ship.safeDrop(cargo);
			}
		}

		if(ship.getHold() >= ship.getMaxHold()) {
			let minerals = ship.hasMinerals();
			await ship.safeDrop(minerals.uuid);
		}
		
		if(await ship.acknowledgeSystem() < 0) return;

		let home = SYSTEM_SCHEAT;
		let dest = memory.homeSystem;

		if(ship.getCurrentSystem() && ship.getLocation() == LOCATION_PLANET/* && ship.getPlanetsWithExpiredDeals().includes(ship.getLocationName())*/) {
			let planetInfo = await ship.safeScan(ship.getLocationName());
			ship.setPlanetDeals(planetInfo);
		}
		let planet = ship.getPlanetToUpdateDealsFor();

		let maxHold = ship.getMaxHold() - ship.getHold() < 15; // Less than 15 hold left\
		if(ship.getBodyCargo("hull").body.gen != 1) maxHold = (ship.getHold() / ship.getMaxHold()) > 0.6; // More than 60% of storage filled up
		if(ship.hasMinerals() && (maxHold || cargos.length == 0)) {
			ship.log("Selling minerals to the federation!");
			if(await ship.sellMineralsToFederation() < 0) return;
		}

		let requiredParts = [{part: "hull", gen: 3}, {part: "engine", gen: 3}, {part: "gripper", gen: 6}];
		let upgradeResult = await ship.upgradeBodyPartList(requiredParts, 25000);
		if(upgradeResult < 0) return;

		if(!immediatePark && planet) {
			ship.log("debug", "Initiating \"No deals\".");
			ship.setFlyingToPlanetToUpdateDealsFor(planet);
			ship.log("debug", "Flying to no deal planet - " + planet + ".");
			await ship.parkAtSpecifiedLandable(planet);
			let planetInfo = await ship.safeScan(ship.getLocationName());
			ship.setPlanetDeals(planetInfo);
			return;
		}

		if(ship.getBalance() != KEEP_MINIMUM && ship.getCurrentSystem() == SYSTEM_SCHEAT && memory.homeSystem != SYSTEM_SCHEAT) {
			ship.log("info", "Operating " + KEEP_MINIMUM + " for safe warping.");
			await ship.operateMoney(KEEP_MINIMUM);
			return;
		}

		if(ship.getFuel() < ship.getMaxFuel() && ship.getLocalMemory().location != dest && ship.getBalance() >= ((ship.getMaxFuel() - ship.getFuel()) * 10)) {
			await ship.parkAtNearbyLandable();
			await ship.safeFuel();
			return;
		}
		// Theoretically, now if ship's location is Scheat it won't try to take the money. After 6 hours I think it will gain at least 100 coins.

		// Warping to home system
		if(await ship.warpToSystem(dest) < 0) return;

		if((details.body.balance > 50000 || (details.body.balance > KEEP_MINIMUM && cargos.length == 0)) && radarData.nodes.find((instance) => instance.type == "BusinessStation")) {

			let result = await ship.operateMoney();
			/*switch(result) {
				case rcs.OM_BUSINESS_STATION_NOT_FOUND:
					ship.log("warn", "I can't find business station, I'm not in Scheat!");
					break;
				case rcs.OM_FLYING_TO_BUSINESS_STATION:
					ship.log("info", "I have some money on me, so I'm flying to business station to deposit it there!");
					break;
				case rcs.OM_CURRENTLY_DEPOSITING:
					ship.log("info", "I'm on business station and depositing my money there!");
					break;
				case rcs.OM_CLOSED_DEPOSIT:
					ship.log("warn", "Deposit closed, so be extra aware!");
					break;
			}*/
			return;
		}

		if(cargos.length && ship.getBestMineralTrade()) {
			if(await ship.grabMineralsInSystem() < 0) return;
		}

		if(!ship.getCurrentSystem()) {
			ship.log("info", "Escaping the atmosphere to understand, where am I.");
			await ship.safeEscape();
			return;
		}

		else if(ship.getBodyCargo("hull").body.gen > 1) {
			if(await ship.captureAsteroid() < 0) return;
		}

		if(ship.getBalance() >= 50000) {
			ship.log("info", "I have quite a fair amount of money, so I'm flying to Scheat to deposit it there!");	
			if(ship.getCurrentSystem() != HOME_SYSTEM) {
				await ship.warpToSystem(HOME_SYSTEM);
			} else {
				await ship.operateMoney(100);
			}
			return;
		}

		let result = await ship.parkAtNearbyLandable();
		switch(result) {
			case rcs.PASL_AT_THE_PLANET:
				ship.log("info", "I am currently parked at " + ship.getLocationName() + ".");
				if(ship.getLocation() != LOCATION_SYSTEM) {
					ship.setParked(true);
				}
				if(ship.getLocation() == LOCATION_PLANET) {
					let planetInfo = await ship.safeScan(ship.getLocationName());
					if(planetInfo) {
						ship.setPlanetDeals(planetInfo);
					}
				}
				else if(ship.getLocation() == LOCATION_BUSINESS_STATION && ship.getBalance() != KEEP_MINIMUM) {
					await ship.operateMoney(KEEP_MINIMUM);
				}
				break;
			case rcs.PASL_FLYING_TO_PLANET:
				ship.log("info", "I have nothing to do, so I'm parking to nearby planet.");
				break;
		}
	}
}