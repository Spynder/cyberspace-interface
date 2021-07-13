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

		let homeSystem = memory.homeSystem;
		let homePlanet = memory.homePlanet;

		if(await ship.refuelAtNearbyLandable() < 0) return;

		let maxHold = (ship.getHold() / ship.getMaxHold()) > 0.5; // More than 50% of storage filled up

		if(ship.getBalance() != 10000 && ship.getCurrentSystem() == SYSTEM_SCHEAT) {
			await ship.operateMoney(10000);
			return;
		}

		if(await ship.warpToSystem(homeSystem) < 0) return;

		if(ship.hasMinerals() && maxHold) {
			ship.log(`Transfering minerals to the planet ${homePlanet}`);
			if(await ship.transferAllMineralsToPlanet(homePlanet) < 0) return;
		}

		if(await ship.grabMineralsInSystem() < 0) return;
		if(await ship.captureAsteroid() < 0) return;

		if(ship.hasMinerals()) {
			ship.log(`Transfering minerals to the planet ${homePlanet}`);
			if(await ship.transferAllMineralsToPlanet(homePlanet) < 0) return;
		}

		ship.log(`Parking at nearby landable...`);
		await ship.parkAtNearbyLandable();

		ship.log(await ship.safeScan("Tilia"));

	}
}