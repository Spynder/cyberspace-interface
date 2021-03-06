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

		if(ship.uuid == "b1487f3f415") {
			if(await ship.upgradeBodyPartList(ATTACKER_FIT) < 0) return;
			await ship.parkAtNearbyLandable();
			return;
		}

		else if(ship.uuid == "b1487f3f45") {
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
				if(ship.getBalance() != virusesRequired*5 + 25000) {
					await ship.operateMoney(virusesRequired*5 + 25000);
				} else {
					await ship.parkAtSpecifiedLandable("Dominion");
					if(ship.getLocation() == LOCATION_SCIENTIFIC_STATION) {
						//await ship.safeApply("GET_EMBRYO");
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