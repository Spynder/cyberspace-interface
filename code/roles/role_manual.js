let mafs = require("../libs/mafs");
let delay = require("delay");

module.exports = {
	run: async function(ship, account, sdk, options) {
		let memory = ship.memory;
		let immediatePark = !options.active;

		if(immediatePark) {
			loggerShip.info("Parking at nearby landable by command.");
			await ship.parkAtNearbyLandable();
			if(ship.getLocation() != LOCATION_SYSTEM) {
				ship.setParked(true);
			}
			return;
		}

		/*if(!ship.getCurrentSystem()) {
			await ship.safeEscape();
		}*/

		let systemName = SYSTEM_PI1_PEGASI;
		let planetName = "Thides G1";

		//await ship.safeMove(-7396.254953606307, 3048.83791980718);

		//await ship.safeGrab("0107610da5");

		if(ship.getLocationName() == planetName) {
			let scanned = await ship.safeScan(planetName);
			ship.setPlanetDeals(scanned);
			console.log(scanned.nodes.filter(node => node.body.type == "MINERALS"));
			/*let deals = scanned.body.deals;
			console.log(scanned.body.deals);
			if(deals.length > 0) {
				let deal = deals[0];
				await ship.safeAccept(deal.uuid);
			}*/

			let equipID = "c41ec8b250";
			let slot = "weapon1";
			await ship.safeEquip(slot, equipID);
		}

		//return;

		/*if(!ship.getCurrentSystem()) {
			await ship.safeEscape();
		}

		if(ship.getBalance() != 1000 && ship.getCurrentSystem() == SYSTEM_SCHEAT) {
			await ship.operateMoney(1000);
		}

		else if(ship.getFuel() < ship.getMaxFuel() && ship.getCurrentSystem() != systemName) {
			await ship.parkAtNearbyLandable();
			await ship.safeFuel();
		}

		else {
			if(ship.getCurrentSystem() != systemName) {
				await ship.safeEscape();
				await ship.warpToSystem(systemName);
			}
			else {
				//await ship.parkAtNearbyLandable();
				await ship.parkAtSpecifiedPlanet(planetName)
			}
		}*/
	}
}