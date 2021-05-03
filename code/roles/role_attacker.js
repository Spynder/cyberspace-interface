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

		//await ship.safeAttack("a9752cd0d2", [1,2,3,4,5]);

		//return;

		if(!ship.getCurrentSystem()) await ship.safeEscape();

		//console.log(ship.getBestTradeInConstellation("WEAPON", 1, true));

		//multiLoop.attackerTargets = {};
		let manualAttackDisable = false;
		let flyTo = SYSTEM_SIRRAH;

		// TODO: Fly to fight with 5000+ for repairs.
		// TODO: Check for distance to safety. They might lure you away and shoot there. (3000 to nearby safe spot (planet/warp spot))

		//console.log(ship.getBestTrade("WEAPON", 1, true));

		let requiredParts = [	
								{part: "HULL", gen: 7}, // replace to 8
								{part: "ENGINE", gen: 7},
								{part: "TANK", gen: 5},
								{part: "PROTECTOR", gen: 6},
								{part: "DROID", gen: 6},
								{part: "WEAPON", gen: 7, slot: 1},
								/*{part: "WEAPON", gen: 7, slot: 2},
								{part: "WEAPON", gen: 7, slot: 3},
								{part: "WEAPON", gen: 7, slot: 4},
								{part: "WEAPON", gen: 7, slot: 5},*/
							];
		let upgradeResult = await ship.upgradeBodyPartList(requiredParts);
		console.log("code: " + upgradeResult)
		if(upgradeResult == CHANGING_PART) return;

		else if(upgradeResult == NOT_DONE) {
			loggerShip.info("I can't find required parts, and I haven't been built yet, so I'm going at nearby landable.");
			await ship.parkAtNearbyLandable();
			return;
		}

		else if(upgradeResult == ALL_CHANGED) {
			loggerShip.info("It seems that I'm fully upgraded!");

			if(ship.getLocation() != LOCATION_SYSTEM) {
				ship.setParked(true);
			}

			if(HIGH_SEC_SYSTEMS.includes(ship.getCurrentSystem()) && ship.getFuel() < ship.getMaxFuel() && ship.details.body.balance >= ((ship.getMaxFuel() - ship.getFuel()) * 10)) {
				loggerShip.warn("Refueling...");
				await ship.parkAtNearbyLandable();
				await ship.safeFuel();
				return;
			}
			if(!ship.getCurrentSystem()) {
				await ship.safeEscape();
				return;
			}

			if(ship.details.body.balance != 10000 && ship.getCurrentSystem() == HOME_SYSTEM) {
				loggerShip.warn("Operating 10000 for repairs in fight!");
				await ship.operateMoney(10000);
				return;
			}

			let currLocation = mafs.findWarpDestination(ship.getCurrentSystem(), flyTo);
			if(currLocation) {
				let coords = WARPS[ship.getCurrentSystem()][currLocation];
				if(ship.getLocation() != LOCATION_SYSTEM) await ship.safeEscape();
				await ship.safeMove(coords.x, coords.y);
				await ship.safeWarp(currLocation);
				return;
			}

			let target = ship.getAttackingTarget();

			target = manualAttackDisable ? false : target;
			if(target) {
				let targetBody = ship.radarData.nodes.find(node => node.uuid == target.target);
				
				let healthPercentage = ship.getCurrentHP() / ship.getMaxHold();
				let injured = healthPercentage <= 0.7;
				let healthy = healthPercentage >= 1.0;
				if(healthy) {
					ship.setLocalMemory("retreating", false);
				}
				if(injured) {
					ship.setLocalMemory("retreating", true);
				}
				let retreating = ship.getLocalMemory().retreating || false;
				loggerShip.info("Retreating: " + retreating);
				loggerShip.info("Health percentage: " + Math.round(healthPercentage * 1000000) / 10000 + "%");
				if(injured || retreating) {
					// Retreat ASAP
					
					if(HIGH_SEC_SYSTEMS.includes(ship.getCurrentSystem())) await ship.parkAtNearbyLandable();

					let nearbyLandable = ship.getClosestLandableInSystem();
					let escapeLocation = mafs.findWarpDestination(ship.getCurrentSystem(), HOME_SYSTEM);
					var escapeCoords = WARPS[ship.getCurrentSystem()][escapeLocation];

					if(!escapeCoords) {
						loggerShip.warn("Injured, landing on nearby landable!");
						await ship.parkAtNearbyLandable(); // Fix, cause droid won't heal you if you're on a planet
						await ship.safeRepair();
						return;
					}

					let shipPos = new mafs.Pos(ship.details.body.vector.x, ship.details.body.vector.y);
					let landablePos = new mafs.Pos(nearbyLandable.body.vector.x, nearbyLandable.body.vector.y);
					let warpPos = new mafs.Pos(escapeCoords.x, escapeCoords.y);

					let landablePath = mafs.lineLength(new mafs.Line(shipPos, landablePos));
					let warpPath = mafs.lineLength(new mafs.Line(shipPos, warpPos));

					if(landablePath < warpPath) {
						loggerShip.warn("Injured, landing on nearby landable!");
						await ship.parkAtNearbyLandable(); // Fix, cause droid won't heal you if you're on a planet
						await ship.safeRepair();
						return;
					} else {
						loggerShip.warn("Injured, warping out of system " + (this.getCurrentSystem() + " > " + currLocation));
						await this.safeMove(escapeCoords.x, escapeCoords.y);
						await this.safeWarp(currLocation);
						return;
					}
				}

				if(targetBody) {
					await ship.safeEscape();
					if(!injured) {
						let shipPos = new mafs.Pos(ship.details.body.vector.x, ship.details.body.vector.y);
						let enemyPos = new mafs.Pos(targetBody.body.vector.x, targetBody.body.vector.y);
						let keepDistance = 200;
						let distanceFighting = mafs.extendLine(new mafs.Line(shipPos, enemyPos), -keepDistance).p2;
						await ship.safeMove(distanceFighting.x, distanceFighting.y);
					}
					await ship.safeAttack(targetBody.uuid, [1,2,3,4,5]);
				}
			} else {
				loggerShip.warn("No targets, so I'm landing at nearby landable.");
				await ship.parkAtNearbyLandable();
				return;
			}
			// code
		}
	}
}