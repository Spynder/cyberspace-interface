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

		// TODO: Change all required 'var's to 'let's

		//console.log(sdk.profileTime(ship.getMaxFuel));

		/*if(ship.details.body.balance > 50000) {
			await ship.operateMoney(2000);
			return;
		}*/
		/*await ship.operateMoney(2000);
		return;*/

		//ship.doSmthg();
		// Throw out all useless items for miner ship
		//console.log((await ship.scan(ship.uuid)).nodes[2].body);
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
			console.log(minerals)
			await ship.safeDrop(minerals[0].uuid);
		}

		/*if(ship.getCurrentSystem() == HOME_SYSTEM) {
			await ship.operateMoney(2000);
			return;
		}*/

		//console.log(sdk.dbManager)
		//console.log("smthg" + sdk.something());

		console.log(memory.homeSystem, ship.getFuel(), ship.getMaxFuel(), ship.details.parent.uuid, (ship.getLocalMemory()).location);

		//console.log(await sdk.profileTime(ship.getMaxFuel.bind(ship)));

		var hullTrade = ship.getBestTrade("HULL", 3, true);
		var engineTrade = ship.getBestTrade("ENGINE", 3, true);
		var tankTrade = ship.getBestTrade("TANK", 3, true);

		var bestMineralTrade = ship.getBestMineralTrade();
		console.log(bestMineralTrade);
		//console.log(tankTrade);

		/*if(ship.getHold() > ship.getMaxHold()) {
			var minerals = ship.hasMinerals();
			await ship.safeDrop(minerals[0].uuid).catch((e) => console.error(e))
			console.log(ship.details.nodes);
		}*/
		//console.log(hullTrade)

		console.log(engineTrade);

		let upgradedParts = [{part: "HULL", gen: 3}, {part: "ENGINE", gen: 3}];

		for(let partStruct of upgradedParts) {
			let result = await ship.upgradeBodyPart(partStruct.part, partStruct.gen, MINIMAL_BODY_COST);
			console.log(result);
			if(result == CHANGING_BODY_PART || result == BUYING_BODY_PART) return; // Don't do anything else until BP is upgraded, or skip if ship has minerals.
		}

		console.log("IM ALIVE PAST THAT")
		
		var home = SYSTEM_SCHEAT;
		var dest = memory.homeSystem;
		var currLocation = mafs.findWarpDestination(ship.getLocalMemory().location, dest);

		
		console.log(ship.getBestMineralTradeInConstellation());

		if(ship.details.body.balance < KEEP_MINIMUM && ship.getCurrentSystem() == SYSTEM_SCHEAT) {
			loggerShip.info("Operating " + KEEP_MINIMUM + " for safe warping.");
			await ship.operateMoney(KEEP_MINIMUM);
			return;
		} else if(ship.getFuel() < ship.getMaxFuel() && ship.getLocalMemory().location != dest) {
			await ship.parkAtNearbyPlanet();
			await ship.safeFuel();
		}
		else if(currLocation) {
			loggerShip.info("Warping " + (ship.getLocalMemory()).location + " > " + currLocation);
			await ship.safeEscape();
			var coords = WARPS[(ship.getLocalMemory()).location][currLocation];
			await ship.safeMove(coords.x, coords.y);
			await ship.safeWarp(currLocation);
			return;
		}
		if(ship.getCurrentSystem() && ship.getLocation() == LOCATION_PLANET/* && ship.getPlanetsWithExpiredDeals().includes(ship.getLocationName())*/) {
			var planetInfo = await ship.safeScan(ship.getLocationName());
			ship.setPlanetDeals(planetInfo);
		}
		var planet = ship.getPlanetToUpdateDealsFor();
		/*if(noDeals.length) {
			loggerShip.debug("Initiating \"No deals\".");
			var noDealsObjects = [];
			for(noDeal of noDeals) {
				noDealsObjects.push(ship.radarData.nodes.find((node) => node.type == "Planet" && node.uuid == noDeal));
			}
			var sortedNoDeals = mafs.sortByDistance(new mafs.Pos(ship.details.body.vector.x, ship.details.body.vector.y), noDealsObjects);
			loggerShip.debug("Flying to no deal planet - " + sortedNoDeals[0].uuid + ".");
			await ship.parkAtSpecifiedPlanet(sortedNoDeals[0].uuid);
			return;
		}*/

		//console.log(sdk.getAllDeals().Matar.Caolia.deals);


		

		var sortedCargos = mafs.sortByDistance(new mafs.Pos(details.body.vector.x, details.body.vector.y), cargos);

		var maxHold = ship.getMaxHold() - ship.getHold() < 15; // Less than 15 hold left
		if(ship.getBodyCargo("hull").body.gen != 1) maxHold = (ship.getHold() / ship.getMaxHold()) > 0.6; // More than 60% of storage filled up
		if(ship.hasMinerals() && (maxHold || sortedCargos.length == 0) && bestMineralTrade) {
			loggerShip.info("I have minerals on the board, so I'm flying to planet and try to sell them.");
			/*if(ship.getLocation() != LOCATION_SYSTEM && ship.getLocation() != LOCATION_PLANET) {
				await ship.safeEscape();
			}
			var planets = radarData.nodes.filter((node => node.type == "Planet")); // Get all planets
			var sortedPlanets = mafs.sortByDistance(new mafs.Pos(details.body.vector.x, details.body.vector.y), planets); // Sort planets by proximity.
			var planet = sortedPlanets[0];
			var vect = new mafs.Line(	new mafs.Pos(	ship.details.body.vector.x,
														ship.details.body.vector.y),
										new mafs.Pos(	planet.body.vector.x,
														planet.body.vector.y)
									);
			var extended = mafs.extendLine(vect, 40);
			await ship.safeMove(extended.p2.x, extended.p2.y);
			await ship.safeLanding(planet.uuid);
			var a = new mafs.Pos(ship.details.body.vector.x, ship.details.body.vector.y);
			var b = new mafs.Pos(planet.body.vector.x, planet.body.vector.y);
			console.log(mafs.lineLength(new mafs.Line(a, b)));*/
			var deal = bestMineralTrade;
			//console.log(deal);
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
		}

		else if(!immediatePark && planet) {
			loggerShip.debug("Initiating \"No deals\".");
			/*var noDealsObjects = [];
			for(noDeal of noDeals) {
				noDealsObjects.push(ship.radarData.nodes.find((node) => node.type == "Planet" && node.uuid == noDeal));
			}
			var sortedNoDeals = mafs.sortByDistance(new mafs.Pos(ship.details.body.vector.x, ship.details.body.vector.y), noDealsObjects);*/
			
			
			ship.setFlyingToPlanetToUpdateDealsFor(planet);
			loggerShip.debug("Flying to no deal planet - " + planet + ".");
			await ship.parkAtSpecifiedPlanet(planet);
			var planetInfo = await ship.safeScan(ship.getLocationName());
			ship.setPlanetDeals(planetInfo);
			return;
		}

		else if((/*details.body.balance > 1100 ||*/ (details.body.balance > KEEP_MINIMUM && sortedCargos.length == 0)) && /*(memory.homeSystem == HOME_SYSTEM || ship.details.parent.uuid == SYSTEM_SCHEAT)*/ radarData.nodes.find((instance) => instance.type == "BusinessStation")) {
			/*loggerShip.info("I have some money on me, so i'm flying to business station to deposit it there!");
			await ship.safeEscape();
		    var tradeStation = radarData.nodes.filter((instance) => instance.type == "BusinessStation")[0]; // replace to find
			if(tradeStation) {
				await ship.safeMove(tradeStation.body.vector.x, tradeStation.body.vector.y);
				await ship.safeLanding(tradeStation.uuid);
				await ship.safeFuel();
				await ship.safeApply("DEPOSIT", details.body.balance - 100);
					//loggerShip.info("Money deposited on account successfully!");
				// CommandType.DEPOSIT выводило ошибку, нет такой команды говорит
				
			}*/
			var result = await ship.operateMoney();
			switch(result) {
				case BUSINESS_STATION_NOT_FOUND:
					loggerShip.warn("I can't find business station, I'm not in Scheat!");
					break;
				case FLYING_TO_BUSINESS_STATION:
					loggerShip.info("I have some money on me, so I'm flying to business station to deposit it there!");
					break;
				case CURRENTLY_DEPOSITING:
					loggerShip.info("I'm on business station and depositing my money there!");
					break;
				case CLOSED_DEPOSIT:
					loggerShip.warn("Deposit closed, so be extra aware!");
					break;
			}
		}
		else if(sortedCargos.length > Object.keys(sdk.getAllFlyingFor()[system] || {}).length && !immediatePark && bestMineralTrade) {
			loggerShip.info("I see some cargos, so i'm flying to them!");
			await ship.safeEscape();
			var memorizedCargo = ship.getFlyingFor();
			if(sortedCargos.find((cargo) => cargo.uuid == memorizedCargo) == undefined) {
				ship.setPickedUp(memorizedCargo);
				memorizedCargo = undefined; // move to getFlyingFor();
			}
			var cargoTarget;
			if(ship.getLocation() == LOCATION_SYSTEM) {
				var found = false;
				if(!memorizedCargo) {
					loggerShip.warn("I HAVE NOT MEMORIZED IT");
					
					var system = ship.details.parent.uuid;
					sortedCargos.forEach(function(cargo) { // replace foreach with for (it'll be faster)
						var alreadyClaimed = Object.values(sdk.getAllFlyingFor()[system]).indexOf(cargo.uuid) > -1; // prettify
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
					//console.log(memorizedCargo);
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
						await ship.safeAttack(cargoTarget.uuid, [1]);
						
						//loggerShip.info("I grabbed the big cargo I spotted!");
					}
				}
			}
		}

		else if(!immediatePark && !ship.getLocalMemory().location) {
			loggerShip.info("Escaping the atmosphere to understand, where am I.");
			await ship.safeEscape();
		}

		

		else {
			var result = await ship.parkAtNearbyPlanet();
			switch(result) {
				case ALREADY_PARKED:
					loggerShip.info("I am currently parked at " + ship.getLocationName() + ".");
					if(ship.getLocation() != LOCATION_SYSTEM) {
						ship.setParked(true);
					}
					if(ship.getLocation() == LOCATION_PLANET) {
						var planetInfo = await ship.safeScan(ship.getLocationName());
						ship.setPlanetDeals(planetInfo);
						
						if(planetInfo) {
							//ship.setPlanetDeals(planetInfo);
							//console.log(planetInfo.nodes);
							//console.log(planetInfo.body.deals);
							
							
						}
					}
					break;
				case FLYING_TO_LANDABLE:
					loggerShip.info("I have nothing to do, so I'm parking to nearby planet.");
					break;
			}
		}

		
	}
}