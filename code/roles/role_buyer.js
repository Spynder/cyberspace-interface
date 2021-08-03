var mafs = require("../libs/mafs");

module.exports = {
	run: async function(ship, account, sdk, options) {

		let radarData = ship.radarData; // Get all objects in current system
		let details = ship.details; // Get details of our ship
		let memory = ship.memory;
		let immediatePark = !options.active;

		let destroyPreviousItems = true;

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

		if(await ship.refuelAtNearbyLandable() < 0) return;

		let fullnessPercentage = ship.getHold() / ship.getMaxHold();

		if(ship.getBodyCargo("hull").body.gen > 1) {
			if(fullnessPercentage <= 0.8 || destroyPreviousItems) {
				if(await ship.upgradeBodyPart("engine", 2) < 0) return;

				if(ship.getBodyCargo("engine").body.gen > 1) {

					if(await ship.upgradeBodyPartList([
						{part: "hull", gen: 2, extra: {stopAtMinGen: false, doNotStop: true}},
						{part: "engine", gen: 2, extra: {stopAtMinGen: false, doNotStop: true, dropPrevious: destroyPreviousItems, destroyPrevious: destroyPreviousItems}},
						{part: "tank", gen: 2, extra: {stopAtMinGen: false, doNotStop: true, dropPrevious: destroyPreviousItems, destroyPrevious: destroyPreviousItems}},
						{part: "gripper", gen: 2, extra: {stopAtMinGen: false, doNotStop: true, dropPrevious: destroyPreviousItems, destroyPrevious: destroyPreviousItems}},
						{part: "droid", gen: 2, extra: {stopAtMinGen: false, doNotStop: true, dropPrevious: destroyPreviousItems, destroyPrevious: destroyPreviousItems}},
						{part: "protector", gen: 2, extra: {stopAtMinGen: false, doNotStop: true, dropPrevious: destroyPreviousItems, destroyPrevious: destroyPreviousItems}},
						{part: "weapon", gen: 2, extra: {stopAtMinGen: false, slot: 1}},
						{part: "weapon", gen: 2, extra: {stopAtMinGen: false, slot: 2}},
						{part: "weapon", gen: 2, extra: {stopAtMinGen: false, slot: 3}},
						{part: "weapon", gen: 2, extra: {stopAtMinGen: false, slot: 4}},
						{part: "weapon", gen: 2, extra: {stopAtMinGen: false, slot: 5, doNotStop: true, dropPrevious: destroyPreviousItems, destroyPrevious: destroyPreviousItems}},
						{part: "radar", gen: 2, extra: {stopAtMinGen: false, doNotStop: true, dropPrevious: destroyPreviousItems, destroyPrevious: destroyPreviousItems}},
						{part: "scanner", gen: 2, extra: {stopAtMinGen: false, doNotStop: true, dropPrevious: destroyPreviousItems, destroyPrevious: destroyPreviousItems}},
					]) < 0) return;
					// everything else lol!
				}
			} else {
				ship.log(`I'm too full, landing at nearby landable...`);
				await ship.parkAtNearbyLandable();
			}
		} else {
			if(await ship.upgradeBodyPart("hull", 2) < 0) return;
		}

		await ship.parkAtNearbyLandable();
	}
}