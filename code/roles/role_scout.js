let mafs = require("../libs/mafs");
let delay = require("delay");

module.exports = {
	run: async function(ship, account, sdk, options) {
		let memory = ship.memory;
		let immediatePark = !options.active;

		if(immediatePark) { // Only if we have to park we interrupt the no-time-spent
			await ship.safeScan();
			loggerShip.info("Parking at nearby landable by command.");
			await ship.parkAtNearbyLandable();
			if(ship.getLocation() != LOCATION_SYSTEM) {
				ship.setParked(true);
			}
			return;
		}

		if(ship.getLocation() != LOCATION_SYSTEM) ship.setParked(true);

		// NO CPU TIME WASTING DOWN
		if(sdk.hasPlanetDealsBeenScanned(memory.scoutingPlanet) && !sdk.isPlanetDealsExpired(memory.scoutingPlanet, true)) {
			loggerShip.info(memory.homeSystem + " - " + memory.scoutingPlanet + " is up-to-date with deals, so I'm sleeping.");
			return;
		}
		// NO CPU TIME WASTING UP

		await ship.selfScan();
		let radarData = ship.radarData;
		let details = ship.details;

		let dest = memory.homeSystem;

		let currLocation = mafs.findWarpDestination(ship.getLocalMemory().location, dest);
		if(ship.details.body.balance != KEEP_MINIMUM && ship.getCurrentSystem() == SYSTEM_SCHEAT && dest != SYSTEM_SCHEAT) {
			loggerShip.info("Operating " + KEEP_MINIMUM + " for safe warping.");
			await ship.operateMoney(KEEP_MINIMUM);
			return;
		}
		else if(ship.getFuel() < ship.getMaxFuel() && ship.getLocalMemory().location != dest) {
			await ship.parkAtNearbyLandable();
			await ship.safeFuel();
			return;
		}
		else if(currLocation) {
			loggerShip.info("Warping " + (ship.getLocalMemory()).location + " > " + currLocation);
			await ship.safeEscape();
			let coords = WARPS[(ship.getLocalMemory()).location][currLocation];
			await ship.safeMove(coords.x, coords.y);
			await ship.safeWarp(currLocation);
			return;
		}

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
			ship.setPlanetDeals(planetInfo);
		}
	}
}