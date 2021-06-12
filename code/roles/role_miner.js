var mafs = require("../libs/mafs");

module.exports = {
	run: async function(ship, account, sdk, options) {
		// 1. Warp into correct system
		// 2. Drop reduntant items
		// 3. If you have any minerals fly and sell 'em
		// 4. If balance > [X] fly to business station.
		// 5. If any minerals spotted, fly to 'em and collect.
		// 6. Else we have nothing to do and just park to nearby station.

		let radarData = ship.radarData; // Get all objects in current system
		let cargos = radarData.nodes.filter((node) => node.type == "Cargo" && node.body.type == "MINERALS" && mafs.isSafeSpot(new mafs.Pos(node.body.vector.x, node.body.vector.y)));
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


		// TODO: Change all required 'var's to 'let's

		/*if(ship.getBalance() > 50000) {
			await ship.operateMoney(2000);
			return;
		}*/
		/*await ship.operateMoney(2000);
		return;*/

		//console.log(multiLoop.moduleHashes)

		//ship.doSmthg();
		// Throw out all useless items for miner ship
		for(var item of USELESS_MINER_ITEMS) {
			let cargo = details.body[item];
			if(cargo.uuid) {
				await ship.safeEscape();
				await ship.safeUnequip(item)
				await ship.safeDrop(cargo);
			}
		}

		if(ship.getHold() >= ship.getMaxHold()) {
			let minerals = ship.hasMinerals();
			await ship.safeDrop(minerals[0].uuid);
		}
		
		let bestMineralTrade = ship.getBestMineralTrade();
		
		let home = SYSTEM_SCHEAT;
		let dest = memory.homeSystem;		

		if(ship.getFuel() < ship.getMaxFuel() && ship.getLocalMemory().location != dest && ship.getBalance() >= 100) {
			await ship.parkAtNearbyLandable();
			await ship.safeFuel();
			return;
		} // TODO: this goes wrong if we dont have enough money in deposit stock
		// Theoretically, now if ship's location is Scheat it won't try to take the money. After 6 hours I think it will gain at least 100 coins.
		if(ship.getCurrentSystem() && ship.getLocation() == LOCATION_PLANET/* && ship.getPlanetsWithExpiredDeals().includes(ship.getLocationName())*/) {
			let planetInfo = await ship.safeScan(ship.getLocationName());
			ship.setPlanetDeals(planetInfo);
		}
		let planet = ship.getPlanetToUpdateDealsFor();

		let sortedCargos = mafs.sortByDistance(new mafs.Pos(details.body.vector.x, details.body.vector.y), cargos);
		let asteroids = radarData.nodes.filter((node) => node.type == "Asteroid" && mafs.isSafeSpot(new mafs.Pos(node.body.vector.x, node.body.vector.y)));
		let closestAsteroid = mafs.sortByDistance(new mafs.Pos(details.body.vector.x, details.body.vector.y), asteroids)[0];

		let maxHold = ship.getMaxHold() - ship.getHold() < 15; // Less than 15 hold left
		if(ship.getBodyCargo("hull").body.gen != 1) maxHold = (ship.getHold() / ship.getMaxHold()) > 0.6; // More than 60% of storage filled up
		if(ship.hasMinerals() && (maxHold || sortedCargos.length == 0) && bestMineralTrade) {
			ship.log("info", "I have minerals on the board, so I'm flying to planet and try to sell them.");
			var deal = bestMineralTrade;
			ship.log("info", deal);
			await ship.parkAtSpecifiedPlanet(deal.planet);
			var planetInfo = await ship.safeScan(deal.planet);
			if(planetInfo) {
				ship.setPlanetDeals(planetInfo);
				var buyTrade = planetInfo.body.deals.find((deal) => deal.type == "BUY" && deal.expected == "MINERALS"); //filter
				// find best trade
				if(buyTrade) {
					await ship.safeAccept(buyTrade.uuid);
					await ship.safeFuel();

					planetInfo = await ship.safeScan(deal.planet);
					ship.setPlanetDeals(planetInfo);
					//ship.log("info", "Trade successfully accepted!");
				}
			}
			return;
		}

		else if(!immediatePark && planet) {
			ship.log("debug", "Initiating \"No deals\".");
			ship.setFlyingToPlanetToUpdateDealsFor(planet);
			ship.log("debug", "Flying to no deal planet - " + planet + ".");
			await ship.parkAtSpecifiedPlanet(planet);
			var planetInfo = await ship.safeScan(ship.getLocationName());
			ship.setPlanetDeals(planetInfo);
			return;
		}
		let requiredParts = [{part: "HULL", gen: 3}, {part: "ENGINE", gen: 3}, {part: "GRIPPER", gen: 6}];
		let upgradeResult = await ship.upgradeBodyPartList(requiredParts);
		if(upgradeResult < 0) return;

		if(ship.getBalance() != KEEP_MINIMUM && ship.getCurrentSystem() == SYSTEM_SCHEAT && memory.homeSystem != SYSTEM_SCHEAT) {
			ship.log("info", "Operating " + KEEP_MINIMUM + " for safe warping.");
			await ship.operateMoney(KEEP_MINIMUM);
			return;
		}


		// Warping to home system
		if(await ship.warpToSystem(dest) < 0) return;

		if((details.body.balance > 50000 || (details.body.balance > KEEP_MINIMUM && sortedCargos.length == 0)) && /*(memory.homeSystem == HOME_SYSTEM || ship.details.parent.uuid == SYSTEM_SCHEAT)*/ radarData.nodes.find((instance) => instance.type == "BusinessStation")) {

			var result = await ship.operateMoney();
			switch(result) {
				case rcs.BUSINESS_STATION_NOT_FOUND:
					ship.log("warn", "I can't find business station, I'm not in Scheat!");
					break;
				case rcs.FLYING_TO_BUSINESS_STATION:
					ship.log("info", "I have some money on me, so I'm flying to business station to deposit it there!");
					break;
				case rcs.CURRENTLY_DEPOSITING:
					ship.log("info", "I'm on business station and depositing my money there!");
					break;
				case rcs.CLOSED_DEPOSIT:
					ship.log("warn", "Deposit closed, so be extra aware!");
					break;
			}
			return;
		}
		else if(sortedCargos.length > Object.keys(sdk.getAllFlyingFor()[system] || {}).length && !immediatePark && bestMineralTrade) {
			ship.log("info", "I see some cargos, so i'm flying to them!");
			await ship.safeEscape();
			var memorizedCargo = ship.getFlyingFor();
			if(sortedCargos.find((cargo) => cargo.uuid == memorizedCargo) == undefined) {
				ship.setPickedUp(memorizedCargo);
				memorizedCargo = undefined; // move to getFlyingFor();
			}
			memorizedCargo = false;
			var cargoTarget;
			if(ship.getLocation() == LOCATION_SYSTEM) {
				var found = false;
				if(!memorizedCargo) {
					ship.log("warn", "I HAVE NOT MEMORIZED IT");
					
					var system = ship.details.parent.uuid;
					sortedCargos.forEach(function(cargo) { // replace foreach with for (it'll be faster)
						var alreadyClaimed = Object.values(sdk.getAllFlyingFor()[system]).indexOf(cargo.uuid) > -1; // prettify
						alreadyClaimed = false; // experimenting
						if(!alreadyClaimed && mafs.isSafeSpot(new mafs.Pos(cargo.body.vector.x, cargo.body.vector.y)) /*(Math.abs(cargo.body.vector.x) >= SUN_CLOSE_RADIUS || Math.abs(cargo.body.vector.y) >= SUN_CLOSE_RADIUS)*/ && !found && cargo.body.type == "MINERALS") {
							
							cargoTarget = cargo;
							found = true;
						}
					});
					if(!found) {
						cargoTarget = sortedCargos[0];
					}
				} else {
					ship.log("warn", "I DID IN FACT MEMORIZED IT");
					cargoTarget = sortedCargos.find((cargo) => cargo.uuid == memorizedCargo);
				}
				
				var cargoVector;
				if(cargoTarget) {
					if(found) {
						ship.setFlyingFor(cargoTarget.uuid);
					}
					cargoVector = cargoTarget.body.vector;

					if(cargoVector) {
						let scan = await ship.safeScan(cargoTarget.uuid);
						await ship.safeMove(cargoVector.x, cargoVector.y);
						if(scan) {
							if(scan.body.size > ship.getGripperPower()) {
								await ship.safeAttack(cargoTarget.uuid, [1]);
							} else {
								await ship.safeGrab(cargoTarget.uuid);
							}
						}
						
						//ship.log("info", "I grabbed the big cargo I spotted!");
					}
				}
			}
			return;
		}

		else if(!immediatePark && !ship.getLocalMemory().location) {
			ship.log("info", "Escaping the atmosphere to understand, where am I.");
			await ship.safeEscape();
			return;
		}

		else if(!immediatePark && closestAsteroid && ship.getBodyCargo("hull").body.gen > 1) {
			if(ship.getCurrentHP() != ship.getMaxHold()) {
				ship.log("info", "Repairing with drone to be able to go for asteroids!");
				await ship.safeEscape();
				let landable = ship.getClosestLandableInSystem();
				await ship.safeMove(landable.body.vector.x, landable.body.vector.y);
				return;
			}
			let radarMemory = ship.getRadarMemory();
			if(radarMemory && radarMemory.length >= 2) {
				let currSnapshot = radarMemory[radarMemory.length - 1];
				let previousSnapshot = radarMemory[radarMemory.length - 2];
				let asteroidSnapshot = previousSnapshot.nodes.find(node => node.uuid == closestAsteroid.uuid);
				let shipSnapshot = previousSnapshot.nodes.find(node => node.uuid == ship.uuid);

				if(!shipSnapshot) {
					shipSnapshot = ship.details;
				}

				let timeDelta = currSnapshot.time - previousSnapshot.time;

				let currShipPos = new mafs.Pos(ship.details.body.vector.x, ship.details.body.vector.y);
				let prevShipPos = new mafs.Pos(shipSnapshot.body.vector.x, shipSnapshot.body.vector.y);

				let shipLocationDelta = new mafs.Pos(currShipPos.x - prevShipPos.x, currShipPos.y - prevShipPos.y);
				let shipSpeed = new mafs.Pos(shipLocationDelta.x / timeDelta, shipLocationDelta.y / timeDelta);
				let scalarShipSpeed = (mafs.lineLength(new mafs.Line(new mafs.Pos(0, 0), shipSpeed)));

				let magicNumber = 242.804708754; // Yes, magic number. What are you going to do, call cops?

				if(mafs.lineLength(new mafs.Line(new mafs.Pos(0, 0), shipLocationDelta)) < 1) { // basically ship is stationary
					scalarShipSpeed = ship.getShipSpeed() / magicNumber;
				}
				if(asteroidSnapshot) {
					// Then we are able to calculate and actually attack asteroid
					ship.log("warn", "Spotted asteroid, trying to calculate...");

					let shipPos = new mafs.Pos(ship.details.body.vector.x, ship.details.body.vector.y);
					let currAsteroidPos = new mafs.Pos(closestAsteroid.body.vector.x, closestAsteroid.body.vector.y);
					let prevAsteroidPos = new mafs.Pos(asteroidSnapshot.body.vector.x, asteroidSnapshot.body.vector.y);

					let locationDelta = new mafs.Pos(currAsteroidPos.x - prevAsteroidPos.x, currAsteroidPos.y - prevAsteroidPos.y);

					let asteroidSpeed = new mafs.Pos(locationDelta.x / timeDelta, locationDelta.y / timeDelta);

					// try to adjust position of asteroid so we catch up in correct time
					currAsteroidPos = new mafs.Pos(currAsteroidPos.x + locationDelta.x, currAsteroidPos.y + locationDelta.y);

					// Thanks to:
					// https://stackoverflow.com/questions/10358022/find-the-better-intersection-of-two-moving-objects

					// l1 = currAsteroidPos
					// v1 = asteroidSpeed

					// l2 = currShipPos
					// s2 = scalarShipSpeed

					// Translating currAsteroidPos so that currShipPos will be at [0,0]
					currAsteroidPos = new mafs.Pos(currAsteroidPos.x - currShipPos.x, currAsteroidPos.y - currShipPos.y);

					let a = (asteroidSpeed.x ** 2) + (asteroidSpeed.y ** 2) - (scalarShipSpeed ** 2); // * (t ** 2);
					let b = (2 * currAsteroidPos.x * asteroidSpeed.x) + (2 * currAsteroidPos.y * asteroidSpeed.y); // * t
					let c = (currAsteroidPos.x ** 2) + (currAsteroidPos.y ** 2);

					let time;
					if(a != 0) {
						// Yay, discriminants!
						let D = (b**2 - 4*a*c);
						if(D < 0) {
							ship.log("warn", "Collision is impossible, D is negative");
							time = NaN;
						} else {
							let t1 = (-b + Math.sqrt(D)) / (2 * a);
							let t2 = (-b - Math.sqrt(D)) / (2 * a);
							if(t1 < 0) time = t2;
							else if(t2 < 0) time = t1;

							// both are positive
							else time = Math.min(t1, t2);
						}
					} else { // ...whole code collapses and we have to do workaround
						if(b == 0 || c == 0) {
							ship.log("warn", "Collision is impossible, b or c is zero.");
							time = NaN;
						} else {
							time = (-c / b);
						}
					}

					if(isNaN(time) || time < 0) {
						ship.log("warn", "Collision is impossible, time is negative.");
					} else {
						// Translation currAsteroidPos back to its original place
						currAsteroidPos = new mafs.Pos(currAsteroidPos.x + currShipPos.x, currAsteroidPos.y + currShipPos.y);

						let interception = new mafs.Pos(
							(currAsteroidPos.x + (asteroidSpeed.x * time)),
							(currAsteroidPos.y + (asteroidSpeed.y * time))
						);

						/*let theta = Math.atan2(interception.y - currAsteroidPos.y, interception.x - currAsteroidPos.x);

						let safeDistance = 50;
						let p1 = mafs.getPointOnCircle(interception.x, interception.y, safeDistance, theta - Math.PI/2);
						let p2 = mafs.getPointOnCircle(interception.x, interception.y, safeDistance, theta + Math.PI/2);

						let l1 = new mafs.Line(shipPos, p1);
						let l2 = new mafs.Line(shipPos, p2);

						let desirableSpot;
						if(mafs.lineLength(l1) < mafs.lineLength(l2)) {
							desirableSpot = p1;
						} else {
							desirableSpot = p2;
						}*/

						// Code above doesn't work, because of client and server delay, window for shooting and not getting hit is too small. We have to block the asteroid with our body.
						ship.log("warn", "Collision is possible, flying to asteroid!");

						await ship.safeAttack(closestAsteroid.uuid, [1]);

						if(ship.getLocation() != LOCATION_SYSTEM) {
							await ship.safeEscape();
						}

						await ship.safeMove(interception.x, interception.y);

						/*let shipAsteroidVector = new mafs.Line(shipPos, interception);
						let shortenedAsteroidPos = mafs.extendLine(shipAsteroidVector, -20).p2;

						await ship.safeMove(shortenedAsteroidPos.x, shortenedAsteroidPos.y);*/
						return;

					}
				}
			}
		}

		if(ship.getBalance() >= 50000) {
			ship.log("info", "I have quite a fair amount of money, so I'm flying to Scheat to deposit it there!");	
			if(ship.getCurrentSystem() != HOME_SYSTEM) {
				await ship.warpToSystem(HOME_SYSTEM);
			} else {
				await ship.operateMoney(100);
			}
			return;
		}

		var result = await ship.parkAtNearbyLandable();
		switch(result) {
			case ALREADY_PARKED:
				ship.log("info", "I am currently parked at " + ship.getLocationName() + ".");
				if(ship.getLocation() != LOCATION_SYSTEM) {
					ship.setParked(true);
				}
				if(ship.getLocation() == LOCATION_PLANET) {
					var planetInfo = await ship.safeScan(ship.getLocationName());
					if(planetInfo) {
						ship.setPlanetDeals(planetInfo);
					}
				}
				else if(ship.getLocation() == LOCATION_BUSINESS_STATION && ship.getBalance() != KEEP_MINIMUM) {
					await ship.operateMoney(KEEP_MINIMUM);
				}
				break;
			case FLYING_TO_LANDABLE:
				ship.log("info", "I have nothing to do, so I'm parking to nearby planet.");
				break;
		}
	}
}