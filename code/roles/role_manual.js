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

		let systemName = SYSTEM_SADALBARI;
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
		//await ship.safeEscape();
		let requiredMinerals = ship.getMaxHold() * 0.6 - ship.getHold();

		if(ship.uuid == "fbb4f29d5b") {
		}

		else if(ship.uuid == "31e52dd377") {
			await ship.warpToSystem(SYSTEM_SCHEAT);
			await ship.parkAtSpecifiedLandable("Baker Plaza");
			let data = await ship.safeApply("INFO");
			/*if(data[0].amount != 900000) {
				await ship.safeApply("DEPOSIT_CLOSE");
				await ship.safeApply("DEPOSIT", 900000);
			}
			if(ship.getBalance() > 0) {
				await ship.safeApply("DEPOSIT", ship.getBalance());
			}*/
			/*let stock = await sdk.Stock.connect(account.token);
			await delay(200);
			try {
				//let data = await stock.history(10, 0);
				let data = await stock.history(-2, -1);
				console.log(stock)
				//let data = await stock.cancel("FEDERATION");
				//let data = await stock.bids("FEDERATION");
				await delay(200);
				console.log(data);
			} catch(e) {
				console.log("Error! ", e.message);
				console.error(e);
			}
			await stock.dispose();*/
			
			await delay(200);
			ship.log(data);
		}

		else if(ship.uuid == "68e1e5e6d4") {
			//await ship.safeEscape();
			await ship.parkAtSpecifiedLandable("Hephus");
			await ship.upgradeBodyPart("weapon", 2, {slot: 3});
			//await ship.createModuleOnPlanet("Hephus", "WEAPON", 7);
			//await ship.safeTransfer("a044f342f4", "in");
			//await ship.safeEquip("weapon2", "a044f342f4");
			return;
		}

		else if(ship.uuid == "6df841dcec") {
			ship.log("wtf")
			//await ship.warpToSystem(SYSTEM_IOTA_PEGASI);
			await ship.safeEscape();
			await ship.safeMove(10000, 10000);
			return;
		}

		else if(ship.uuid == "47335975eb") {
			let virusesRequired = 1;
			if(ship.getCurrentSystem() == SYSTEM_SCHEAT || ship.hasCargo("virus").length >= virusesRequired) {
				if(ship.hasCargo("virus").length >= virusesRequired) {
					ship.log("Done!!!!!");
					await ship.warpToSystem(SYSTEM_IOTA_PEGASI);
					let planetName = "Hephus";
					await ship.parkAtSpecifiedLandable(planetName);
					if(ship.getLocationName() == planetName) {
						let scanned = await ship.safeScan(planetName);
						ship.log(scanned);
						ship.log(scanned.nodes);
						if(scanned) {
							ship.setPlanetDeals(scanned);
						}
						if(ship.findInhabitedLandables().length === 1) {
							await ship.safeApply("EXTERMINATION");
						} else if(ship.findInhabitedLandables().length === 3) {
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
						await ship.safeApply("GET_EMBRYO");
						await ship.safeApply("GET_EMBRYO");
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
				await ship.safeMove(0, -2000);
				let itemUuid = "18ae7f8dee";

				/*if(ship.uuid == "47335975eb") {
					await ship.safeDrop(itemUuid);
				} else {
					let found = ship.radarData.nodes.find(node => node.uuid == itemUuid);
					if(found) {
						await ship.safeMove(found.body.vector.x, found.body.vector.y);
					}
					await ship.safeGrab(itemUuid);
				}*/

			} else {
				await ship.warpToSystem(systemName);
			}
		}
	}
}