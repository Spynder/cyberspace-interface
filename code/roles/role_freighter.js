var mafs = require("../libs/mafs");
var delay = require("delay");

module.exports = {
	run: async function(ship, account, sdk) {
		// 1. Get 200 credits for fuel
		// 2. Fly to the planet we own
		// 3. Get minerals from there
		// 4. Fly back
		// 5. Sell all of them in Scheat
		// 6. Deposit all - 200 (for fuel) on Baker Plasa
		// 7. Repeat

		var radarData = ship.radarData; // Get all objects in current system
		var details = ship.details; // Get details of our ship
		var memory = ship.memory;
		console.log("FREIGHTER");
		console.log("FREIGHTER");
		console.log("FREIGHTER");
		
		var returningBack = ship.getHold() > 300;
		returningBack = true;
		var immediatePark = true;

		if(immediatePark) {
			loggerShip.info("Parking at nearby landable by command.");
			await ship.parkAtNearbyLandable();
			return;
		}

		var home = SYSTEM_SCHEAT;
		var dest = SYSTEM_IOTA_PEGASI;
		var planetName = "Tilia";

		var currLocation;
		if(!returningBack) {
			currLocation = mafs.findWarpDestination(ship.getLocationName(), dest);
		} else {
			currLocation = mafs.findWarpDestination(ship.getLocationName(), home);
		}

		var bestMineralTrade = ship.getBestMineralTrade();
		var mineralAmount = (ship.getMaxHold() * 0.7) - ship.getHold();
		var requiredBalance = 5000;
		console.log(ship.getBestMineralTradeInConstellation());
		console.log(bestMineralTrade);

		if(!ship.getCurrentSystem()) {
			await ship.safeEscape();
		}

		else if(ship.getFuel() < ship.getMaxFuel() && ship.getCurrentSystem() != dest) {
			console.log("landing at nearby")
			await ship.parkAtNearbyLandable();
			await ship.safeFuel(); // todo? maybe fuel is included in first func
			return;
		}

		else if(ship.getFuel() == ship.getMaxFuel() && ship.getCurrentSystem() != (returningBack ? home : dest)) {
			await ship.safeEscape();
		}

		if(ship.details.body.balance > requiredBalance && !ship.hasMinerals() && ship.getCurrentSystem() == SYSTEM_SCHEAT) {
			await ship.operateMoney(requiredBalance);
		}

		else if(currLocation) {
			loggerShip.info("Warping " + ship.getLocationName() + " > " + currLocation);
			await ship.safeEscape();
			var coords = WARPS[(ship.getLocalMemory()).location][currLocation];
			await ship.safeMove(coords.x, coords.y);
			await ship.safeWarp(currLocation);
		}

		else if(ship.getCurrentSystem() == home && returningBack && ship.hasMinerals() && bestMineralTrade) {
			loggerShip.info("I have minerals on the board, so I'm flying to planet and try to sell them.");

			var deal = bestMineralTrade;
			await ship.parkAtSpecifiedPlanet(deal.planet);

			console.log(deal)

			var planetInfo = await ship.safeScan(deal.planet);
			if(planetInfo) {
				//console.log(planetInfo.nodes);
				//console.log(planetInfo.body.deals);
				ship.setPlanetDeals(planetInfo);
				//var buyTrade = planetInfo.body.deals.find((deal) => deal.type == "BUY" && deal.expected == "MINERALS"); //filter
				// find best trade
				var buyTrade = planetInfo.body.deals.find(item => item.uuid == deal.uuid);
				if(buyTrade) {
					console.log(buyTrade.uuid);
					await ship.safeAccept(buyTrade.uuid);
					await ship.safeFuel();

					planetInfo = await ship.safeScan(deal.planet);
					ship.setPlanetDeals(planetInfo);
					//loggerShip.info("Trade successfully accepted!");
				}
			}
		}

		
		else if(ship.getCurrentSystem() == dest && !returningBack && ship.getLocation() == LOCATION_SYSTEM) {
			loggerShip.warn("Landing on " + planetName)
			var planets = radarData.nodes.filter((instance => instance.type == "Planet")); // Get all planets
			var planet = planets.find((pla) => pla.uuid == planetName);
			var vect = new mafs.Line(	new mafs.Pos(	ship.details.body.vector.x,
														ship.details.body.vector.y),
										new mafs.Pos(	planet.body.vector.x,
														planet.body.vector.y)
									);
			var extended = mafs.extendLine(vect, 40);
			await ship.safeMove(extended.p2.x, extended.p2.y);
			await ship.safeLanding(planet.uuid);
			await ship.safeFuel();
		}

		else if(ship.getLocation() == LOCATION_PLANET && ship.getLocationName() == planetName) {
			var owned = await account.getPlanet(planetName);
			var ownedDetails = await owned.explore();
			await delay(500);
			console.log(ownedDetails.nodes);
			var mineralsID = "03cc566c55";
			mineralsID = ownedDetails.nodes.find(node => node.type == "Cargo").uuid;
			var mineralCount = ownedDetails.nodes.find((node) => node.uuid == mineralsID).body.size;
			console.log(mineralCount);

			//ship.safeTransfer("in",); // CANT SPECIFY AMOUNT
			var sellTrades = ownedDetails.body.deals.filter((deal) => deal.type == "BUY");
			if(sellTrades.length > 0) {
				await owned.close(sellTrades[0].uuid);
				await delay(ACTION_DELAY);
			}
			
			if(ship.details.body.balance < mineralAmount && ownedDetails.body.deals.length == 0 && ship.getHold() < 700) {
				loggerShip.warn("Creating a deal for the ship to get money!");
				owned.buy("MINERALS", mineralAmount+400, 1);
				await delay(ACTION_DELAY);
				loggerShip.warn("Executing a deal!");
				console.log(ownedDetails.body.deals);
				var buyTrade = ownedDetails.body.deals.find((deal) => deal.type == "BUY");
				if(buyTrade) {
					console.log(mineralAmount);
					await ship.safeAccept(buyTrade.uuid, mineralAmount);
					//await owned.close(buyTrade.uuid);
					await ship.safeFuel();	
				}
			}
			if(ship.details.body.balance < mineralAmount && ownedDetails.body.deals.length == 1 && ship.getHold() < 700) {
				loggerShip.warn("Executing a deal!");
				console.log(ownedDetails.body.deals);
				var buyTrade = ownedDetails.body.deals.find((deal) => deal.type == "SELL");
				console.log(buyTrade);
				if(buyTrade) {
					await ship.safeAccept(buyTrade.uuid, Math.min(ship.details.body.balance, mineralAmount, mineralCount));
					//await owned.close(buyTrade.uuid);
					await ship.safeFuel();
				}
			}

			else if(ownedDetails.body.deals.length == 0 && ship.getHold() < 700) {
				loggerShip.warn("Creating a deal!");
				await owned.sell(mineralsID, 1); // TODO search for cargo not hardcode it
				await delay(ACTION_DELAY);
				loggerShip.warn("Executing a deal!");
				console.log(ownedDetails.body.deals);
				var buyTrade = ownedDetails.body.deals.find((deal) => deal.type == "SELL");
				if(buyTrade) {
					await ship.safeAccept(buyTrade.uuid, Math.min(ship.details.body.balance, mineralAmount, mineralCount));
					await ship.safeFuel();
				}
			} else {
				loggerShip.warn("Executing a deal!");
				console.log(ownedDetails.body.deals);
				var buyTrade = ownedDetails.body.deals.find((deal) => deal.type == "SELL");
				if(buyTrade) {
					await ship.safeAccept(buyTrade.uuid, Math.min(ship.details.body.balance, mineralAmount, mineralCount));
					//await owned.close(buyTrade.uuid);
					await ship.safeFuel();
				}
			}

			// IMPORTANT
			/*if(ownedDetails.body.balance > 0 && ship.hasMinerals()) {
				await delay(500);
				loggerShip.warn("Clearing planet balance!");
				owned.buy("MINERALS", ownedDetails.body.balance, 1);
				await delay(ACTION_DELAY);

				loggerShip.warn("Executing a deal!");
				await delay(2000);
				ownedDetails = await owned.explore();
				await delay(ACTION_DELAY);
				console.log(ownedDetails.body.deals);
				var buyTrade = ownedDetails.body.deals.find((deal) => deal.type == "BUY");
				if(buyTrade) {
					await ship.safeAccept(buyTrade.uuid);
					//await owned.close(buyTrade.uuid);
					await ship.safeFuel();
				}
			}*/
			owned.dispose();
		}

		

		


		/*if(ship.getFuel() < ship.getMaxFuel()) {
			loggerShip.warn("Landing on closest planet to refuel")
			var planets = radarData.nodes.filter((instance => instance.type == "Planet")); // Get all planets
			var sortedPlanets = mafs.sortByDistance(new mafs.Pos(details.body.vector.x, details.body.vector.y), planets); // Sort planets by proximity.
			var planet = sortedPlanets[0];
			var vect = new mafs.Line(	new mafs.Pos(	ship.details.body.vector.x,
														ship.details.body.vector.y),
										new mafs.Pos(	planet.body.vector.x,
														planet.body.vector.y)
									);
			var extended = mafs.extendLine(vect, 40);
			await ship.safeMove(extended.p2.x, extended.p2.y);
			//await ship.safeMove(planet.body.vector.x, planet.body.vector.y);
			await ship.safeLanding(planet.uuid);
			await ship.safeFuel();
		}*/

		/*if((ship.getLocation() != LOCATION_SYSTEM || (ship.getLocation() == LOCATION_SYSTEM && ship.details.parent.uuid == SYSTEM_PI1_PEGASI))) {
			loggerShip.info("Returning to the Matar!");
			await ship.safeEscape();
			var coords = WARPS[SYSTEM_PI1_PEGASI][SYSTEM_MATAR];
			await ship.safeMove(coords.x, coords.y);
			await ship.safeWarp(SYSTEM_MATAR);
			return;
		}
		else if((ship.getLocation() != LOCATION_SYSTEM || (ship.getLocation() == LOCATION_SYSTEM && ship.details.parent.uuid == SYSTEM_MATAR))) {
			loggerShip.info("Returning to the Scheat!");
			await ship.safeEscape();
			var coords = WARPS[SYSTEM_MATAR][SYSTEM_SCHEAT];
			await ship.safeMove(coords.x, coords.y);
			await ship.safeWarp(SYSTEM_SCHEAT);
			return;
		}*/

		/*else {
			loggerShip.info("I have nothing to do, so I'm parking to nearby planet.");
			var planets = radarData.nodes.filter((instance => instance.type == "Planet")); // Get all planets
			var sortedPlanets = mafs.sortByDistance(new mafs.Pos(details.body.vector.x, details.body.vector.y), planets); // Sort planets by proximity.
			var planet = sortedPlanets[0];
			var vect = new mafs.Line(	new mafs.Pos(	ship.details.body.vector.x,
														ship.details.body.vector.y),
										new mafs.Pos(	planet.body.vector.x,
														planet.body.vector.y)
									);
			var extended = mafs.extendLine(vect, 40);
			await ship.safeMove(extended.p2.x, extended.p2.y);
			//await ship.safeMove(planet.body.vector.x, planet.body.vector.y);
			await ship.safeLanding(planet.uuid);
			await ship.safeFuel();
		}*/
		//console.log(ship.details.nodes);
		//if();

		/*if((ship.getLocation() == LOCATION_SYSTEM && ship.details.parent.uuid == SYSTEM_SCHEAT) && details.body.balance != 1200) {

			console.log("In");
			console.log(details.body.balance);
			if(details.body.balance != 1200) {
				console.log("If")
				await ship.safeEscape();
			    var tradeStation = radarData.nodes.filter((instance) => instance.type == "BusinessStation")[0]; // replace to find
				if(tradeStation) {
					await ship.safeMove(tradeStation.body.vector.x, tradeStation.body.vector.y);
					await ship.safeLanding(tradeStation.uuid);
					if(details.body.balance < 1200) {
						//await ship.safeApply("DEPOSIT_CLOSE"); // dangerous, be aware
					}
					loggerShip.warn("DOING DANGEROUS STUFF");
					await ship.safeApply("DEPOSIT", details.body.balance - 1200);
				}
			} */
		
			/*console.log("else")
			console.log(ship.details.nodes);
			var hullNew = "172b65e344";
			var sciStation = radarData.nodes.find((instance) => instance.type == "ScientificStation"); // replace to find
			if(sciStation) {
				await ship.safeMove(sciStation.body.vector.x, sciStation.body.vector.y);
				await ship.safeLanding(sciStation.uuid);
				await ship.safeApply("CHANGE_HULL", hullNew);
			}*/
			//await ship.safeEscape();
			//await ship.parkAtNearbyLandable();
	}
}