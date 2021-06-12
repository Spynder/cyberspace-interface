let mafs = require("../libs/mafs");
let delay = require("delay");

module.exports = {
	run: async function(ship, account, sdk, options) {
		let memory = ship.memory;
		let immediatePark = !options.active;

		if(immediatePark) { // Only if we have to park we interrupt the no-time-spent
			await ship.safeScan();
			ship.log("info", "Parking at nearby landable by command.");
			await ship.parkAtNearbyLandable();
			if(ship.getLocation() != LOCATION_SYSTEM) {
				ship.setParked(true);
			}
			return;
		}

		ship.setParked((ship.getLocation() != undefined) ? ship.getLocation() != LOCATION_SYSTEM : false);

		// Since major breakthrough, I can afford to don't care with these CPU cycles
		if(sdk.hasPlanetDealsBeenScanned(memory.scoutingPlanet) && !sdk.isPlanetDealsExpired(memory.scoutingPlanet, true)) {
			ship.log("info", memory.homeSystem + " - " + memory.scoutingPlanet + " is up-to-date with deals, so I'm sleeping.");
			return;
		}

		await ship.selfScan();
		let radarData = ship.radarData;
		let details = ship.details;

		let dest = memory.homeSystem;

		if(ship.details.body.balance != KEEP_MINIMUM && ship.getCurrentSystem() == SYSTEM_SCHEAT && dest != SYSTEM_SCHEAT) {
			ship.log("info", "Operating " + KEEP_MINIMUM + " for safe warping.");
			await ship.operateMoney(KEEP_MINIMUM);
			return;
		}
		else if(ship.getFuel() < ship.getMaxFuel() && ship.getLocalMemory().location != dest) {
			await ship.parkAtNearbyLandable();
			await ship.safeFuel();
			return;
		}
		else if(await ship.warpToSystem(dest) < 0) return;

		let expired = sdk.isPlanetDealsExpired(memory.scoutingPlanet, true);
		
		if(expired) {
			if(!ship.getCurrentSystem()) {
				await ship.safeEscape();
				return;
			}
			if(ship.getLocationName() != memory.scoutingPlanet) {
				await ship.parkAtSpecifiedPlanet(memory.scoutingPlanet);
			}
			var planetInfo = await ship.safeScan(memory.scoutingPlanet);
			if(planetInfo) {
				ship.setPlanetDeals(planetInfo);
				ship.log("info", "Updated planet deals for " + memory.homeSystem + " - " + memory.scoutingPlanet + ".");
			}
		}
	}
}