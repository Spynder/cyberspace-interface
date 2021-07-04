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

		if(ship.getFuel() < ship.getMaxFuel() && ship.getCurrentSystem() != systemName && ship.findInhabitedLandables().length > 0) {
			await ship.parkAtNearbyInhabitedLandable();
			return;
		}

		/*if(ship.uuid == "9c91fc62fc") {
			if(await ship.upgradeBodyPartListNew([
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
		let requiredMinerals = ship.getMaxHold() * 0.6 - ship.getHold();

		if(ship.uuid == /*"9c91fc62fc"*/ "98fa8341c1") {
			//await ship.warpToSystem(SYSTEM_SCHEAT)
			//await ship.transferMineralsBetweenPlanets("Thailara", "Oagawa", requiredMinerals)

			await ship.parkAtSpecifiedPlanet("Oagawa");
			//await ship.createModuleOnPlanet("Oagawa", "ENGINE", 8);
			//await ship.safeTransfer("e7ccb47428", "in");
			/*let equipID = "78322fb7fb";
			await ship.safeTransfer(equipID, "in");
			await ship.safeEquip("weapon5", equipID);
			return;*/
		} else if(ship.uuid == "98fa8341c1") {
			if(ship.getCurrentSystem() == SYSTEM_SCHEAT || ship.hasCargo("virus").length) {
				if(ship.hasCargo("virus").length >= 1) {
					ship.log("Done!!!!!");
					await ship.warpToSystem(SYSTEM_BAHAM);
					let planetName = "Donoe 76";
					await ship.parkAtSpecifiedPlanet(planetName);
					if(ship.getLocationName() == planetName) {
						let scanned = await ship.safeScan(planetName);
						ship.log(scanned);
						ship.log(scanned.nodes);
						if(ship.findInhabitedLandables().length == 1) {
							await ship.safeApply("EXTERMINATION");
						} else if(ship.findInhabitedLandables().length == 10) {
							//await ship.safeApply("COLONIZATION");
						}
					}
					return;
				}
				if(ship.getBalance() != 25000) {
					await ship.operateMoney(25000);
				} else {
					await ship.parkAtSpecifiedPlanet("Dominion");
					if(ship.getLocation() == LOCATION_SCIENTIFIC_STATION) {
						await ship.safeApply("GET_VIRUS");
						//await ship.safeApply("GET_VIRUS");
					}
				}
			} else {
				ship.log("???")
				await ship.warpToSystem(SYSTEM_SCHEAT);
			}
		} else if(ship.uuid == "ed476cabb5") {
			await ship.upgradeBodyPartNew("HULL", 2);
			return;
		}


		
		/*if(ship.getCurrentSystem() == SYSTEM_SCHEAT && ship.getBalance() != 1000) {
			await ship.operateMoney(1000);
		}*/


		/*await ship.warpToSystem(SYSTEM_PI1_PEGASI);
		await ship.parkAtSpecifiedPlanet("Poaruta");
		if(ship.getLocationName() == "Poaruta") {
			let scanned = await ship.safeScan("Poaruta");
			ship.log(scanned);
			if(ship.findInhabitedLandables().length == 1) {
				await ship.safeApply("EXTERMINATION");
			}
		}*/
		/*let item = ship.getObjectsInSpace("Cargo", true);
		await ship.safeMove(item[0].body.vector.x, item[0].body.vector.y);
		await ship.safeAttack(item[0].uuid, [1,2,3,4,5]);*/



		//let planetName = "Hephus";
		//await ship.parkAtSpecifiedPlanet(planetName);
		//await ship.createModuleOnPlanet(planetName, "PROTECTOR", 8);
		/*let equipID = "b041044f11";
		await ship.safeTransfer(equipID, "in");
		await ship.safeEquip("protector", equipID);
		await ship.safeEscape();
		let previousID = "008756a583";
		await ship.safeDrop(previousID);
		await ship.safeAttack(previousID, [1]);*/
		//await ship.parkAtSpecifiedPlanet("Tilia");
		//await ship.upgradeBodyPart("HULL", 3, 1000);

		/*if(ship.getCurrentSystem() == HOME_SYSTEM && ship.getBalance() != 1500) {
			ship.log("Getting1 500");
			await ship.operateMoney(1500);
			return;
		}*/

		/*await ship.parkAtNearbyLandable();
		return;*/
		/*if(ship.uuid == "98fa8341c1") {
			//await ship.warpToSystem(systemName);
			//await ship.parkAtSpecifiedPlanet("Tilia");
			//let equipID = "9166f195bc";
			//await ship.safeTransfer(equipID, "in");
			//await ship.createModuleOnPlanet("Tilia", "HULL", 8);
		} else {
			await ship.upgradeBodyPartNew("HULL", 3);
			return;
		}*/
		//return;

		let exchangeItems = false;
		if(exchangeItems) {
			if(!ship.getCurrentSystem()) {
				await ship.safeEscape();
			}
			if(ship.getCurrentSystem() == systemName) {
				await ship.safeEscape();
				await ship.safeMove(-1000, 1000);
				let itemUuid = "1921047db1";

				/*if(ship.uuid == "98fa8341c1") {
					await ship.safeDrop(itemUuid);
				} else {
					await ship.safeGrab(itemUuid);
				}*/

			} else {
				//await ship.warpToSystem(systemName);
			}
		}


		//await ship.transferMineralsBetweenPlanets(from, to, requiredMinerals);
		//await ship.createModuleOnPlanet("Droebos", "HULL", 8);
		//await ship.clearPlanetBalance("Poaruta");
		//await ship.warpToSystem(HOME_SYSTEM)
		//await ship.safeTransfer("2d2064a7d1", "in");



	}
}