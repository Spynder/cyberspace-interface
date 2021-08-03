let mafs = require("../libs/mafs");
let delay = require("delay");

module.exports = {
	run: async function(ship, account, sdk, options) {
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

		let systemName = SYSTEM_SCHEAT;
		let from = "Poaruta";
		let to = "Droebos";

		if(await ship.acknowledgeSystem() < 0) return;

		if(ship.getFuel() < ship.getMaxFuel() && (ship.getCurrentSystem() != systemName || true) && ship.findInhabitedLandables().length > 0) {
			if(await ship.refuelAtNearbyLandable() < 0) return;
			return;
		}

		/*if(ship.uuid == "9c91fc62fc") {
			if(await ship.upgradeBodyPartList([
				{part: "weapon", gen: 7, extra: {slot: 1}},
				{part: "weapon", gen: 7, extra: {slot: 2}},
				{part: "weapon", gen: 7, extra: {slot: 3}},
				{part: "weapon", gen: 7, extra: {slot: 4}},
				{part: "weapon", gen: 7, extra: {slot: 5}},
			]) < 0) return;
			await ship.parkAtNearbyLandable();
			return;
		} else if(ship.uuid == "75f5bb50bd") {
			await ship.safeEscape();
			await ship.safeMove(50000, 50000);
			return;
		}*/
		/**/
		if(!ship.hasMinerals()) {
			await ship.getMineralsFromPlanet("Hephus", 1);
			ship.log("Getting!");
		} else {
			ship.log("Flying!");
			await ship.safeEscape();
			ship.log("Dropping!");
			await ship.safeDrop(ship.hasMinerals().uuid);
		}
		return;
		let requiredMinerals = ship.getMaxHold() * 0.6 - ship.getHold();

		if(ship.uuid == "fbb4f29d5b") {
			//ship.log("Asteroid program");
			//if(await ship.captureAsteroid() < 0) return;
			//await ship.parkAtNearbyLandable();
			//await ship.warpToSystem(SYSTEM_IOTA_PEGASI);
			//await ship.parkAtSpecifiedLandable("Tilia");
			await ship.safeEscape();
			await ship.safeMove(0, -5000);
		}

		else if(ship.uuid == "9edbbdfcf1" || ship.uuid == "dfd7b6f31b") {
			//await ship.parkAtSpecifiedLandable("Tilia");
			//await ship.createModuleOnPlanet("Tilia", "ENGINE", 8);
			
			//await ship.safeTransfer("21f0d28c58", "in");
			//await ship.safeEquip("engine", "21f0d28c58");
			//await ship.safeEscape();
			//await ship.safeDrop("2306a2e7ce");
			//await ship.safeAttack("2306a2e7ce", [1,2,3]);
			//await ship.warpToSystem(SYSTEM_IOTA_PEGASI);
			if(!ship.hasMinerals()) {
				await ship.getMineralsFromPlanet("Hephus", 1);
				ship.log("Getting!");
			} else {
				ship.log("Flying!");
				await ship.safeEscape();
				ship.log("Dropping!");
				await ship.safeDrop(ship.hasMinerals().uuid);
			}
		}

		else if(ship.uuid == "026d0cd8ea") {
			//await ship.parkAtNearbyLandable();
			//await ship.transferMineralsBetweenPlanets("Tilia", "Hephus", requiredMinerals);
			if(ship.getBalance() < 2000) {
				await ship.clearPlanetBalance("Hephus");
			}
			else if(!ship.hasMinerals()) {
				await ship.getMineralsFromPlanet("Hephus", 1);
				ship.log("Getting!");
			} else {
				ship.log("Flying!");
				await ship.safeEscape();
				ship.log("Dropping!");
				await ship.safeDrop(ship.hasMinerals().uuid);
			}
		}

		else if(ship.uuid == "d220a6f6bb") {
			let virusesRequired = 1;
			if(ship.getCurrentSystem() == SYSTEM_SCHEAT || ship.hasCargo("virus").length >= virusesRequired) {
				if(ship.hasCargo("virus").length >= virusesRequired) {
					ship.log("Done!!!!!");
					await ship.warpToSystem(SYSTEM_MARKAB);
					let planetName = "Brutoclite";
					await ship.parkAtSpecifiedLandable(planetName);
					if(ship.getLocationName() == planetName) {
						let scanned = await ship.safeScan(planetName);
						ship.log(scanned);
						ship.log(scanned.nodes);
						if(scanned) {
							ship.setPlanetDeals(scanned);
						}
						if(ship.findInhabitedLandables().length === 2) {
							await ship.safeApply("EXTERMINATION");
						} else if(ship.findInhabitedLandables().length === 1) {
							//await ship.safeApply("COLONIZATION");
						}
					}
					return;
				}
				if(ship.getBalance() != 85000) {
					await ship.operateMoney(85000);
				} else {
					await ship.parkAtSpecifiedLandable("Dominion");
					if(ship.getLocation() == LOCATION_SCIENTIFIC_STATION) {
						//await ship.safeApply("GET_EMBRYO");
						await ship.safeApply("GET_VIRUS");
						await ship.safeApply("GET_VIRUS");
						await ship.safeApply("GET_VIRUS");
						await ship.safeApply("GET_VIRUS");
						await ship.safeApply("GET_VIRUS");
						await ship.safeApply("GET_VIRUS");
						await ship.safeApply("GET_VIRUS");
					}
				}
			} else {
				await ship.warpToSystem(SYSTEM_SCHEAT);
			}
		}

		let exchangeItems = false;
		if(exchangeItems) {
			if(!ship.getCurrentSystem()) {
				await ship.safeEscape();
			}
			if(ship.getCurrentSystem() == systemName) {
				await ship.safeEscape();
				await ship.safeMove(3000, 3000);
				let itemUuid = "3ad41c762c";

				/*if(ship.uuid == "d220a6f6bb") {
					await ship.safeDrop(itemUuid);
				} else {
					let found = ship.radarData.nodes.find(node => node.uuid == itemUuid);
					if(found) {
						await ship.safeMove(found.body.vector.x, found.body.vector.y);
					}
					await ship.safeGrab(itemUuid);
				}*/

			} else {
				//await ship.warpToSystem(systemName);
			}
		}
	}
}