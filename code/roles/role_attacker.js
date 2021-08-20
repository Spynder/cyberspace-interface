var mafs = require("../libs/mafs");
var delay = require("delay");

module.exports = {
	run: async function(ship, account, sdk, options) {
		var radarData = ship.radarData; // Get all objects in current system
		var details = ship.details; // Get details of our ship
		var memory = ship.memory;
		var immediatePark = !options.active;

		if(immediatePark) {
			ship.log("info", "Parking at nearby landable by command.");
			await ship.parkAtNearbyLandable();
			ship.log(ship.getLocation());
			if(ship.getLocation() != LOCATION_SYSTEM) {
				ship.setParked(true);
			}
			return;
		}

		//return;

		if(!ship.getCurrentSystem()) {
			await ship.safeEscape();
			return;
		}

		//console.log(ship.getBestTradeInConstellation("WEAPON", 1, true));

		//multiLoop.attackerTargets = {};
		let manualAttackDisable = false;
		let flyTo = memory.homeSystem;
		let planetName = memory.homePlanet;
		let lockedToSystem = memory.lockedToSystem ?? true;


		// TODO: Check for distance to safety. They might lure you away and shoot there. (3000 to nearby safe spot (planet/warp spot))

		//console.log(ship.getBestTrade("WEAPON", 1, true));

		if(ship.getLocation() != LOCATION_SYSTEM) {
			ship.setParked(true);
		}

		if(HIGH_SEC_SYSTEMS.includes(ship.getCurrentSystem()) && ship.getFuel() < ship.getMaxFuel() && ship.details.body.balance >= ((ship.getMaxFuel() - ship.getFuel()) * 10)) {
			ship.log("warn", "Refueling...");
			await ship.parkAtNearbyLandable();
			await ship.safeFuel();
			return;
		}

		if(ship.details.body.balance != 15000 && ship.getCurrentSystem() == HOME_SYSTEM) {
			ship.log("warn", "Operating 15000 for repairs in fight!");
			await ship.operateMoney(15000);
			return;
		}

		/*let currLocation = mafs.findWarpDestination(ship.getCurrentSystem(), flyTo);
		if(currLocation) {
			let coords = WARPS[ship.getCurrentSystem()][currLocation];
			if(ship.getLocation() != LOCATION_SYSTEM) await ship.safeEscape();
			await ship.safeMove(coords.x, coords.y);
			await ship.safeWarp(currLocation);
			return;
		}*/

		let target = ship.getAttackingTarget(lockedToSystem);
		target = manualAttackDisable ? false : target;
		if(target) {
			if(target.system != ship.getCurrentSystem()) {
				ship.log("info", "Warping to target in system " + target.system + "!");
				await ship.warpToSystem(target.system);
				return;
			}
			let targetBody = ship.radarData.nodes.find(node => node.uuid == target.target);
			
			let healthPercentage = ship.getCurrentHP() / ship.getMaxHold();
			let injured = healthPercentage <= 0.3;
			let healthy = healthPercentage >= 1.0;
			if(healthy) {
				ship.setLocalMemory("retreating", false);
			}
			if(injured) {
				ship.setLocalMemory("retreating", true);
			}
			let retreating = ship.getLocalMemory().retreating || false;
			ship.log("info", "Retreating: " + retreating);
			ship.log("info", "Health percentage: " + (healthPercentage * 100).toFixed(2) + "%");
			ship.log("Distance between: " + (mafs.lineLength(mafs.Line(mafs.Pos(ship.details), mafs.Pos(targetBody)))).toFixed(2));
			if(injured || retreating) {
				// Retreat ASAP
				
				if(HIGH_SEC_SYSTEMS.includes(ship.getCurrentSystem())) await ship.parkAtNearbyLandable();

				let nearbyLandable = ship.getClosestLandableInSystem();
				let escapeLocation = mafs.findWarpDestination(ship.getCurrentSystem(), HOME_SYSTEM);
				var escapeCoords = WARPS[ship.getCurrentSystem()][escapeLocation];

				if(!escapeCoords) {
					ship.log("warn", "Injured, landing on nearby landable!");
					await ship.parkAtNearbyLandable(); // Fix, cause droid won't heal you if you're on a planet
					// TODO: find inhabited landables
					await ship.safeRepair();
					return;
				}

				let shipPos = new mafs.Pos(ship.details.body.vector.x, ship.details.body.vector.y);
				let landablePos = new mafs.Pos(nearbyLandable.body.vector.x, nearbyLandable.body.vector.y);
				let warpPos = new mafs.Pos(escapeCoords.x, escapeCoords.y);

				let landablePath = mafs.lineLength(new mafs.Line(shipPos, landablePos));
				let warpPath = mafs.lineLength(new mafs.Line(shipPos, warpPos));

				if(landablePath < warpPath) {
					ship.log("warn", "Injured, landing on nearby landable!");
					await ship.parkAtNearbyLandable(); // Fix, cause droid won't heal you if you're on a planet
					await ship.safeRepair();
					return;
				} else {
					ship.log("warn", "Injured, warping out of system " + (this.getCurrentSystem() + " > " + currLocation));
					await this.safeMove(escapeCoords.x, escapeCoords.y);
					await this.safeWarp(currLocation);
					return;
				}
			}

			if(targetBody) {
				if(ship.getLocation() != LOCATION_SYSTEM) {
					await ship.safeEscape();
				}
				if(!injured) {
					let shipPos = new mafs.Pos(ship.details.body.vector.x, ship.details.body.vector.y);
					let enemyPos = new mafs.Pos(targetBody.body.vector.x, targetBody.body.vector.y);
					let keepDistance = -100;
					let distanceFighting = mafs.extendLine(new mafs.Line(shipPos, enemyPos), -keepDistance).p2;
					//await ship.safeMove(distanceFighting.x, distanceFighting.y); // Predictions are bad
					await ship.safeMove(enemyPos.x, enemyPos.y); // Use standard movement
				}
				let attackResult = await ship.safeAttack(targetBody.uuid, [1,2,3,4,5]);
				//let scanned = await ship.safeScan(targetBody.uuid);
				//ship.log(scanned.nodes[5].body)
				ship.log(attackResult);
			}
			return;
		}

		if(await ship.warpToSystem(flyTo) < 0) return;

		if(!target) {
			if(ship.getHPPercentage() < 1) {
				ship.log("I'm not 100% repaired and there is no one in the current system, so I'm repairing with drone!");
				await ship.safeEscape();
				let closestLandable = ship.findLandables()[0];
				let landablePos = mafs.Pos(closestLandable);
				await ship.safeMove(landablePos.x, landablePos.y);
			} else {
				ship.log("warn", "No targets, parking to specified planet: " + planetName);

				let planetDetails = await ship.safeScan(planetName);

				if(planetDetails) {
					ship.setPlanetDeals(planetDetails);
				}

				await ship.parkAtSpecifiedLandable(planetName);
			}
		}
		// code
	}
}