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


		

		if(ship.getFuel() < ship.getMaxFuel() && (ship.getCurrentSystem() != systemName || true) && ship.findInhabitedLandables().length > 0) {
			if(await ship.refuelAtNearbyLandable() < 0) return;
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

		if(ship.uuid == /*"9c91fc62fc"*/ "ed476cabb5") {
			await ship.warpToSystem(SYSTEM_IOTA_PEGASI)
			await ship.parkAtSpecifiedPlanet("Thailara");
			//await ship.createModuleOnPlanet("Thailara", "TANK", 6);
			//await ship.safeTransfer("da822f6ce9", "in");
			//await ship.safeEquip("tank", "da822f6ce9");
			//await ship.safeEscape();
			//await ship.safeDrop("8db2b28db7");
			//await ship.safeAttack("8db2b28db7", [1,2,3]);
			//await ship.transferMineralsBetweenPlanets("Thailara", "Oagawa", requiredMinerals)


			//await ship.safeEscape();
			//await ship.safeDrop("b0466cfbe5");
			//await ship.parkAtSpecifiedPlanet("Oagawa");
			//let scanned = await ship.safeScan("Oagawa");
			//if(scanned.body.deals.length == 0) {
				//await sdk.createPlanetRequest("Oagawa", {request: "sell", item: "005bfd93a7"});
			//}
			//await ship.safeTransfer("e7ccb47428", "in");
			/*let equipID = "78322fb7fb";
			await ship.safeTransfer(equipID, "in");
			await ship.safeEquip("weapon5", equipID);
			return;*/
		} else if(ship.uuid == /*"98fa8341c1"*/ "98fa8341c2") {
			await ship.warpToSystem(SYSTEM_PI1_PEGASI);
			//await ship.parkAtSpecifiedPlanet("Induna");

			/*let planetDetails = await ship.safeScan("Induna");

			if(planetDetails) {
				ship.setPlanetDeals(planetDetails);
			}*/

			//await ship.safeTransfer("3805174be4", "out");
		} else if(ship.uuid == "08fb428c2f") {
			await ship.safeMove(-4096.306, -2000.477)
			ship.log(await ship.safeScan("3ac4b62732"));
			await ship.safeAttack("92dcc709ec", [1,2,3,4,5])
		}

		else if(ship.uuid == /*"98fa8341c1"*/ "98fa8341c1") {
			if(ship.getCurrentSystem() == SYSTEM_SCHEAT || ship.hasCargo("virus").length) {
				if(ship.hasCargo("virus").length >= 1) {
					ship.log("Done!!!!!");
					await ship.warpToSystem(SYSTEM_MARKAB);
					let planetName = "Brutoclite";
					await ship.parkAtSpecifiedPlanet(planetName);
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
				if(ship.getBalance() != 55000) {
					await ship.operateMoney(55000);
				} else {
					await ship.parkAtSpecifiedPlanet("Dominion");
					if(ship.getLocation() == LOCATION_SCIENTIFIC_STATION) {
						await ship.safeApply("GET_EMBRYO");
						await ship.safeApply("GET_EMBRYO");
						await ship.safeApply("GET_VIRUS");
						await ship.safeApply("GET_VIRUS");
					}
				}
			} else {
				await ship.warpToSystem(SYSTEM_SCHEAT);
			}
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