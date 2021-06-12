var mafs = require("../libs/mafs");
var delay = require("delay");

module.exports = {
	run: async function(ship, account, sdk, options) {
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
		
		var returningBack = ship.hasMinerals() || (ship.getHold() / ship.getMaxHold()) > 0.5;
		returningBack = true;
		//returningBack = false;
		var immediatePark = !options.active;

		if(immediatePark) {
			ship.log("info", "Parking at nearby landable by command.");
			await ship.parkAtNearbyLandable();
			if(ship.getLocation() != LOCATION_SYSTEM) {
				ship.setParked(true);
			}
			return;
		}

		let requiredParts = [{part: "HULL", gen: 5}, {part: "ENGINE", gen: 4}, {part: "TANK", gen: 5}];
		let upgradeResult = await ship.upgradeBodyPartList(requiredParts);
		if(upgradeResult < 0) return;

		/*(await ship.safeScan("Decceon")).nodes.forEach(function(item) {
			console.log(item.nodes)
		})*/
		/*
		console.log("Changing hull");
		let parts = ship.hasCargo("HULL") || [];
		let oldPart = parts.find((part) => part.body.gen != 8 && !ship.isAlreadyEquiped(part.uuid));
		let betterPart = parts.find((part) => part.body.gen == 8 && !ship.isAlreadyEquiped(part.uuid));
		if(betterPart) {
			if(ship.getBalance() == HULL_CHANGE_COST) {
				ship.log("info", "Flying to scientific station to change hull!");
				var sciStation = ship.radarData.nodes.find((instance) => instance.type == "ScientificStation");
				console.log(betterPart);
				if(ship.getLocation() != LOCATION_SCIENTIFIC_STATION) {
					await ship.safeEscape();
				}
				if(sciStation) {
					await ship.safeMove(sciStation.body.vector.x, sciStation.body.vector.y);
					await ship.safeLanding(sciStation.uuid);
					await ship.safeApply("CHANGE_HULL", betterPart.uuid);
				}
			} else {
				ship.log("info", "Getting " + HULL_CHANGE_COST + " for hull change.");
				await ship.operateMoney(HULL_CHANGE_COST);
			}
		}
		if(oldPart && !betterPart) {
			await ship.safeDrop(oldPart.uuid);
			await ship.safeAttack(oldPart.uuid, [1,2,3,4,5]);
		}
		return;
		*/


		var home = SYSTEM_SCHEAT;
		var dest = SYSTEM_IOTA_PEGASI;
		var planetName = "Oagawa";

		let returnToHome = false;

		let bestMineralTradeInConstellation = ship.getBestMineralTradeInConstellation(500);
		var bestMineralTradeInSystem = ship.getBestMineralTrade();
		var mineralAmount = (ship.getMaxHold() * 0.7) - ship.getHold();
		var requiredBalance = 5000 + ((ship.getMaxFuel() - ship.getFuel()) * 10);
		console.log(bestMineralTradeInConstellation);
		console.log(bestMineralTradeInSystem);
		let sellingTo = "";
		if(bestMineralTradeInConstellation) {
			sellingTo = bestMineralTradeInConstellation.system;
		}

		let warpingTo;
		if(ship.getBalance() >= 250000 || returnToHome) {
			warpingTo = home;
		} else if(returningBack && sellingTo) {
			warpingTo = sellingTo;
		} else if(!returningBack) {
			warpingTo = dest;
		} else {
			warpingTo = home;
		}

		if(ship.getCurrentSystem() == dest && ship.getLocationName() != planetName) {
			await ship.safeEscape();
		}

		if(!ship.getCurrentSystem()) {
			await ship.safeEscape();
		}

		if(ship.details.body.balance != requiredBalance && !ship.hasMinerals() && ship.getCurrentSystem() == SYSTEM_SCHEAT) {
			ship.log("info", "Operating " + requiredBalance + "!");
			await ship.operateMoney(requiredBalance);
			return;
		}

		else if(ship.getFuel() < ship.getMaxFuel() && ship.getCurrentSystem() != dest && HIGH_SEC_SYSTEMS.includes(ship.getCurrentSystem())) {
			ship.log("info", "Landing at nearby to refuel.");
			await ship.parkAtNearbyLandable();
			await ship.safeFuel();
			return;
		}

		else if(ship.getFuel() == ship.getMaxFuel() && ship.getCurrentSystem() != warpingTo && ship.getLocation() != LOCATION_SYSTEM) {
			ship.log("info", "Escaping from atmosphere to fly to destination!");
			await ship.safeEscape();
		}

		if(ship.getCurrentSystem() != warpingTo) {
			await ship.warpToSystem(warpingTo);
		}

		else if(ship.getCurrentSystem() == sellingTo && returningBack && ship.hasMinerals() && bestMineralTradeInSystem) {
			ship.log("info", "I have minerals on the board, so I'm flying to planet and try to sell them.");

			var deal = bestMineralTradeInSystem;
			await ship.parkAtSpecifiedPlanet(deal.planet);

			console.log(deal)

			var planetInfo = await ship.safeScan(deal.planet);
			if(planetInfo) {
				ship.setPlanetDeals(planetInfo);
				var buyTrade = planetInfo.body.deals.find(item => item.uuid == deal.uuid);
				if(buyTrade) {
					console.log(buyTrade.uuid);
					await ship.safeAccept(buyTrade.uuid);
					await ship.safeFuel();

					planetInfo = await ship.safeScan(deal.planet);
					ship.setPlanetDeals(planetInfo);
					//ship.log("info", "Trade successfully accepted!");
				}
			}
		}

		
		if(ship.getCurrentSystem() == dest && !returningBack && ship.getLocation() == LOCATION_SYSTEM) {
			ship.log("warn", "Landing on " + planetName)
			var planets = radarData.nodes.filter((instance => instance.type == "Planet")); // Get all planets
			var planet = planets.find((pla) => pla.uuid == planetName);
			var vect = new mafs.Line(	new mafs.Pos(	ship.details.body.vector.x,
														ship.details.body.vector.y),
										new mafs.Pos(	planet.body.vector.x,
														planet.body.vector.y)
									);
			var extended = mafs.extendLine(vect, 40);
			await ship.safeLanding(planet.uuid);
			await ship.safeMove(extended.p2.x, extended.p2.y);
			await ship.safeFuel();
			return;
		}

		if(ship.getLocation() == LOCATION_PLANET && ship.getLocationName() == planetName) {
			var owned = await account.getPlanet(planetName);
			var ownedDetails = await owned.explore();
			try {
				await delay(500);
				console.log(ownedDetails.nodes);
				var mineralsID;
				let mineralCargo = ownedDetails.nodes.find(node => node.body.type == "MINERALS");
				if(mineralCargo) {
					mineralsID = mineralCargo.uuid;
					var mineralCount = ownedDetails.nodes.find((node) => node.uuid == mineralsID).body.size;
					console.log(mineralCount);
					console.log(mineralAmount);

					//ship.safeTransfer("in",); // CANT SPECIFY AMOUNT
					var sellTrades = ownedDetails.body.deals.filter((deal) => deal.type == "BUY");
					if(sellTrades.length > 0) {
						await owned.close(sellTrades[0].uuid);
						await delay(ACTION_DELAY);
					}
					
					if(ship.details.body.balance < mineralAmount && ownedDetails.body.deals.length == 0 && ship.getHold() < 1000) {
						ship.log("warn", "Creating a deal for the ship to get money!");
						owned.buy("MINERALS", mineralAmount+400, 1);
						await delay(ACTION_DELAY);
						ship.log("warn", "Executing a deal!");
						console.log(ownedDetails.body.deals);
						var buyTrade = ownedDetails.body.deals.find((deal) => deal.type == "BUY");
						if(buyTrade) {
							console.log(mineralAmount);
							await ship.safeAccept(buyTrade.uuid, mineralAmount);
							//await owned.close(buyTrade.uuid);
							await ship.safeFuel();	
						}
					}
					if(ship.details.body.balance < mineralAmount && ownedDetails.body.deals.length == 1 && ship.getHold() < 1000) {
						ship.log("warn", "Executing a deal!");
						console.log(ownedDetails.body.deals);
						var buyTrade = ownedDetails.body.deals.find((deal) => deal.type == "SELL");
						console.log(buyTrade);
						if(buyTrade) {
							await ship.safeAccept(buyTrade.uuid, Math.min(ship.details.body.balance, mineralAmount, mineralCount));
							//await owned.close(buyTrade.uuid);
							await ship.safeFuel();
						}
					}

					else if(ownedDetails.body.deals.length == 0 && ship.getHold() < 1000) {
						ship.log("warn", "Creating a deal!");
						await owned.sell(mineralsID, 1);
						await delay(ACTION_DELAY);
						ship.log("warn", "Executing a deal!");
						console.log(ownedDetails.body.deals);
						var buyTrade = ownedDetails.body.deals.find((deal) => deal.type == "SELL");
						if(buyTrade) {
							await ship.safeAccept(buyTrade.uuid, Math.min(ship.details.body.balance, mineralAmount, mineralCount));
							await ship.safeFuel();
						}
					} else {
						ship.log("warn", "Executing a deal!");
						console.log(ownedDetails.body.deals);
						var buyTrade = ownedDetails.body.deals.find((deal) => deal.type == "SELL");
						if(buyTrade) {
							await ship.safeAccept(buyTrade.uuid, Math.min(ship.details.body.balance, mineralAmount, mineralCount));
							//await owned.close(buyTrade.uuid);
							await ship.safeFuel();
						}
					}
				}
			} catch(e) {
				ship.log("error", "Unhandled exception occured while executing freighter role: " + e.message);
				console.error(e);
			}

			// IMPORTANT
			/*if(ownedDetails.body.balance > 0 && ship.hasMinerals()) {
				await delay(500);
				ship.log("warn", "Clearing planet balance!");
				owned.buy("MINERALS", ownedDetails.body.balance, 1);
				await delay(ACTION_DELAY);

				ship.log("warn", "Executing a deal!");
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
	}
}