var mafs = require("../libs/mafs");

module.exports = {
	run: async function(ship, account, sdk, options) {
		// 1. Warp into correct system
		// 2. Drop reduntant items
		// 3. If you have any minerals fly and sell 'em
		// 4. If balance > [X] fly to business station.
		// 5. If any minerals spotted, fly to 'em and collect.
		// 6. Else we have nothing to do and just park to nearby station.

		console.log("MINER")

		var radarData = ship.radarData; // Get all objects in current system
		var cargos = radarData.nodes.filter((node) => node.type == "Cargo" && node.body.type == "MINERALS" && mafs.isSafeSpot(new mafs.Pos(node.body.vector.x, node.body.vector.y)));
		var details = ship.details; // Get details of our ship
		var memory = ship.memory;
		var immediatePark = !options.active;

		if(immediatePark) {
			loggerShip.info("Parking at nearby landable by command.");
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

		//ship.doSmthg();
		// Throw out all useless items for miner ship
		for(var item of USELESS_MINER_ITEMS) {
			var cargo = details.body[item];
			if(cargo.uuid) {
				await ship.safeEscape();
				await ship.safeUnequip(item)
				await ship.safeDrop(cargo);
			}
		}

		if(ship.getHold() >= ship.getMaxHold()) {
			var minerals = ship.hasMinerals();
			await ship.safeDrop(minerals[0].uuid);
		}

		/*if(ship.getCurrentSystem() == HOME_SYSTEM) {
			await ship.operateMoney(2000);
			return;
		}*/

		//console.log(memory.homeSystem, ship.getFuel(), ship.getMaxFuel(), ship.details.parent.uuid, (ship.getLocalMemory()).location);

		var bestMineralTrade = ship.getBestMineralTrade();
		
		var home = SYSTEM_SCHEAT;
		var dest = memory.homeSystem;		
		//console.log(ship.getBestMineralTradeInConstellation(500));

		if(ship.getFuel() < ship.getMaxFuel() && ship.getLocalMemory().location != dest && ship.getBalance() >= 100) {
			await ship.parkAtNearbyPlanet();
			await ship.safeFuel();
			return;
		} // TODO: this goes wrong if we dont have enough money in deposit stock
		if(ship.getCurrentSystem() && ship.getLocation() == LOCATION_PLANET/* && ship.getPlanetsWithExpiredDeals().includes(ship.getLocationName())*/) {
			var planetInfo = await ship.safeScan(ship.getLocationName());
			ship.setPlanetDeals(planetInfo);
		}
		var planet = ship.getPlanetToUpdateDealsFor();

		var sortedCargos = mafs.sortByDistance(new mafs.Pos(details.body.vector.x, details.body.vector.y), cargos);
		let asteroids = radarData.nodes.filter((node) => node.type == "Asteroid" && mafs.isSafeSpot(new mafs.Pos(node.body.vector.x, node.body.vector.y)));
		let closestAsteroid = mafs.sortByDistance(new mafs.Pos(details.body.vector.x, details.body.vector.y), asteroids)[0];

		var maxHold = ship.getMaxHold() - ship.getHold() < 15; // Less than 15 hold left
		if(ship.getBodyCargo("hull").body.gen != 1) maxHold = (ship.getHold() / ship.getMaxHold()) > 0.6; // More than 60% of storage filled up
		if(ship.hasMinerals() && (maxHold || sortedCargos.length == 0) && bestMineralTrade) {
			loggerShip.info("I have minerals on the board, so I'm flying to planet and try to sell them.");
			var deal = bestMineralTrade;
			console.log(deal)
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
					//loggerShip.info("Trade successfully accepted!");
				}
			}
			return;
		}

		else if(!immediatePark && planet) {
			loggerShip.debug("Initiating \"No deals\".");
			ship.setFlyingToPlanetToUpdateDealsFor(planet);
			loggerShip.debug("Flying to no deal planet - " + planet + ".");
			await ship.parkAtSpecifiedPlanet(planet);
			var planetInfo = await ship.safeScan(ship.getLocationName());
			ship.setPlanetDeals(planetInfo);
			return;
		}

		let requiredParts = [{part: "HULL", gen: 3}, {part: "ENGINE", gen: 3}, {part: "GRIPPER", gen: 6}];
		let upgradeResult = await ship.upgradeBodyPartList(requiredParts);
		if(upgradeResult < 0) return;

		if(ship.getBalance() != KEEP_MINIMUM && ship.getCurrentSystem() == SYSTEM_SCHEAT) {
			loggerShip.info("Operating " + KEEP_MINIMUM + " for safe warping.");
			await ship.operateMoney(KEEP_MINIMUM);
			return;
		}


		// Warping to home system
		if(await ship.warpToSystem(dest) < 0) return;

		if((details.body.balance > 50000 || (details.body.balance > KEEP_MINIMUM && sortedCargos.length == 0)) && /*(memory.homeSystem == HOME_SYSTEM || ship.details.parent.uuid == SYSTEM_SCHEAT)*/ radarData.nodes.find((instance) => instance.type == "BusinessStation")) {

			var result = await ship.operateMoney();
			switch(result) {
				case rcs.BUSINESS_STATION_NOT_FOUND:
					loggerShip.warn("I can't find business station, I'm not in Scheat!");
					break;
				case rcs.FLYING_TO_BUSINESS_STATION:
					loggerShip.info("I have some money on me, so I'm flying to business station to deposit it there!");
					break;
				case rcs.CURRENTLY_DEPOSITING:
					loggerShip.info("I'm on business station and depositing my money there!");
					break;
				case rcs.CLOSED_DEPOSIT:
					loggerShip.warn("Deposit closed, so be extra aware!");
					break;
			}
			return;
		}
		else if(sortedCargos.length > Object.keys(sdk.getAllFlyingFor()[system] || {}).length && !immediatePark && bestMineralTrade) {
			loggerShip.info("I see some cargos, so i'm flying to them!");
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
					loggerShip.warn("I HAVE NOT MEMORIZED IT");
					
					var system = ship.details.parent.uuid;
					sortedCargos.forEach(function(cargo) { // replace foreach with for (it'll be faster)
						var alreadyClaimed = Object.values(sdk.getAllFlyingFor()[system]).indexOf(cargo.uuid) > -1; // prettify
						alreadyClaimed = false; // experimenting
						if(!alreadyClaimed && mafs.isSafeSpot(new mafs.Pos(cargo.body.vector.x, cargo.body.vector.y)) /*(Math.abs(cargo.body.vector.x) >= SUN_CLOSE_RADIUS || Math.abs(cargo.body.vector.y) >= SUN_CLOSE_RADIUS)*/ && !found && cargo.body.type == "MINERALS") {
							
							cargoTarget = cargo;
							found = true;
						} /*else if(!found) {
							console.log(new mafs.Pos(cargo.body.vector.x, cargo.body.vector.y));
							console.log(mafs.isSafeSpot(new mafs.Pos(cargo.body.vector.x, cargo.body.vector.y)));
						}*/
					});
					if(!found) {
						cargoTarget = sortedCargos[0];
					}
				} else {
					loggerShip.warn("I DID IN FACT MEMORIZED IT");
					cargoTarget = sortedCargos.find((cargo) => cargo.uuid == memorizedCargo);
				}
				
				var cargoVector;
				if(cargoTarget) {
					if(found) {
						ship.setFlyingFor(cargoTarget.uuid);
					}
					cargoVector = cargoTarget.body.vector;

					if(cargoVector) {
						await ship.safeGrab(cargoTarget.uuid);
						await ship.safeMove(cargoVector.x, cargoVector.y);
						//await ship.safeAttack(cargoTarget.uuid, [1]);
						
						//loggerShip.info("I grabbed the big cargo I spotted!");
					}
				}
			}
			return;
		}

		else if(!immediatePark && !ship.getLocalMemory().location) {
			loggerShip.info("Escaping the atmosphere to understand, where am I.");
			await ship.safeEscape();
			return;
		}

		else if(!immediatePark && closestAsteroid && true) {
			loggerShip.warn("Closest asteroid!");
			if(ship.getCurrentHP() != ship.getMaxHold()) {
				loggerShip.info("Repairing with drone to be able to go for asteroids!");
				await ship.safeEscape();
				let landable = ship.getClosestLandableInSystem();
				await ship.safeMove(landable.body.vector.x, landable.body.vector.y);
				return;
			}
			console.log(closestAsteroid)
			let radarMemory = ship.getRadarMemory();
			if(radarMemory && radarMemory.length >= 2) {
				let currSnapshot = radarMemory[radarMemory.length - 1];
				let previousSnapshot = radarMemory[radarMemory.length - 2];
				let asteroidSnapshot = previousSnapshot.nodes.find(node => node.uuid == closestAsteroid.uuid);
				let shipSnapshot = previousSnapshot.nodes.find(node => node.uuid == ship.uuid);
				if(!shipSnapshot) {
					if(ship.getLocation() != LOCATION_SYSTEM) {
						await ship.safeEscape();
					}
					return;
				} else {
					let timeDelta = currSnapshot.time - previousSnapshot.time;

					let currShipPos = new mafs.Pos(ship.details.body.vector.x, ship.details.body.vector.y);
					let prevShipPos = new mafs.Pos(shipSnapshot.body.vector.x, shipSnapshot.body.vector.y);

					let shipLocationDelta = new mafs.Pos(currShipPos.x - prevShipPos.x, currShipPos.y - prevShipPos.y);
					let shipSpeed = new mafs.Pos(shipLocationDelta.x / timeDelta, shipLocationDelta.y / timeDelta);
					let scalarShipSpeed = (mafs.lineLength(new mafs.Line(new mafs.Pos(0, 0), shipSpeed)));
					//console.log("ship speed: " + scalarShipSpeed)
					//console.log("calculated speed: " + ship.getShipSpeed());
					//console.log("division: " + scalarShipSpeed / ship.getShipSpeed());
					if(mafs.lineLength(new mafs.Line(new mafs.Pos(0, 0), shipLocationDelta)) < 1) { // basically ship is stationary
						scalarShipSpeed = ship.getShipSpeed() * 0.05;
					}
					if(asteroidSnapshot) {
						// Then we are able to calculate and actually attack asteroid

						
						await ship.safeAttack(closestAsteroid.uuid, [1]);

						let shipPos = new mafs.Pos(ship.details.body.vector.x, ship.details.body.vector.y);
						let currAsteroidPos = new mafs.Pos(closestAsteroid.body.vector.x, closestAsteroid.body.vector.y);
						let prevAsteroidPos = new mafs.Pos(asteroidSnapshot.body.vector.x, asteroidSnapshot.body.vector.y);
						let asteroidVector = new mafs.Line(prevAsteroidPos, currAsteroidPos);

						let locationDelta = new mafs.Pos(currAsteroidPos.x - prevAsteroidPos.x, currAsteroidPos.y - prevAsteroidPos.y);
						console.log(locationDelta)

						let asteroidSpeed = new mafs.Pos(locationDelta.x / timeDelta, locationDelta.y / timeDelta);

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
								console.log("D is negative");
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
							if(c == 0 || b == 0) {
								console.log("B or C is zero")
								time = NaN;
							} else {
								time = (-c / b);
							}
						}

						if(isNaN(time) || time < 0) {
							console.log("Collision is impossible: " + time);
						} else {
							//console.log("Time: " + time);
							// Translation currAsteroidPos back to its original place
							currAsteroidPos = new mafs.Pos(currAsteroidPos.x + currShipPos.x, currAsteroidPos.y + currShipPos.y);

							let interception = new mafs.Pos(
								(currAsteroidPos.x + (asteroidSpeed.x * time)),
								(currAsteroidPos.y + (asteroidSpeed.y * time))
							);

							console.log(currAsteroidPos);
							console.log(interception);

							let shipAsteroidVector = new mafs.Line(shipPos, interception);
							let shortenedAsteroidPos = mafs.extendLine(shipAsteroidVector, -20).p2;

							//console.log("Interception point:");
							//console.log(interception);
							console.log("HELLO????")
							await ship.safeMove(shortenedAsteroidPos.x, shortenedAsteroidPos.y);
							return;

						}
					}
				}
			}
		}

		var result = await ship.parkAtNearbyPlanet();
		switch(result) {
			case ALREADY_PARKED:
				loggerShip.info("I am currently parked at " + ship.getLocationName() + ".");
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
				loggerShip.info("I have nothing to do, so I'm parking to nearby planet.");
				break;
		}
	}
}