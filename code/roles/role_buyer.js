var mafs = require("../libs/mafs");

module.exports = {
	run: async function(ship, account, sdk, options) {

		let radarData = ship.radarData; // Get all objects in current system
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
		if(!ship.getCurrentSystem()) {
			await ship.safeEscape();
			return;
		}

		if(ship.getFuel() < ship.getMaxFuel() && ship.getBalance() >= 100) {
			ship.log("info", "Flying for fuel");
			await ship.parkAtNearbyLandable();
			await ship.safeFuel();
			return;
		}

		let fullnessPercentage = ship.getHold() / ship.getMaxHold();

		if(ship.getBodyCargo("hull").body.gen > 1) {
			if(fullnessPercentage <= 0.8) {
				if(await ship.upgradeBodyPartNew("engine", 2) < 0) return;

				if(ship.getBodyCargo("engine").body.gen > 1) {
					if(await ship.upgradeBodyPartListNew([
						{part: "hull", gen: 2, extra: {stopAtMinGen: false, doNotStop: true}},
						{part: "engine", gen: 2, extra: {stopAtMinGen: false, doNotStop: true}},
						{part: "tank", gen: 2, extra: {stopAtMinGen: false, doNotStop: true}},
						{part: "droid", gen: 2, extra: {stopAtMinGen: false, doNotStop: true}},
					]) < 0) return;
					// everything else lol!
				}
			} else {
				ship.log(`I'm too full, landing at nearby landable...`);
				await ship.parkAtNearbyLandable();
			}
		} else {
			if(await ship.upgradeBodyPartNew("hull", 2) < 0) return;
		}

		await ship.parkAtNearbyLandable();
	}
}