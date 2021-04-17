var mafs = require("../libs/mafs");
var delay = require("delay");

module.exports = {
	run: async function(ship, account, sdk, options) {
		var radarData = ship.radarData; // Get all objects in current system
		var details = ship.details; // Get details of our ship
		var memory = ship.memory;
		var immediatePark = !options.active;

		console.log("ATTACKER");

		if(immediatePark) {
			loggerShip.info("Parking at nearby landable by command.");
			await ship.parkAtNearbyLandable();
			console.log(ship.getLocation());
			if(ship.getLocation() != LOCATION_SYSTEM) {
				ship.setParked(true);
			}
			return;
		}

		let requiredParts = [{part: "HULL", gen: 8}, {part: "ENGINE", gen: 8}, {part: "TANK", gen: 5}, {part: "PROTECTOR", gen: 6}, {part: "DROID", gen: 6}];
		let upgradeResult = await ship.upgradeBodyPartList(requiredParts);
		if(upgradeResult == CHANGING_PART) return;
	}
}