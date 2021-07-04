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

		let radarData = ship.radarData; // Get all objects in current system
		let details = ship.details; // Get details of our ship
		let memory = ship.memory;
		
		let returningBack = ship.hasMinerals() || (ship.getHold() / ship.getMaxHold()) > 0.5;
		//returningBack = false;
		let immediatePark = !options.active;

		if(immediatePark) {
			ship.log("info", "Parking at nearby landable by command.");
			await ship.parkAtNearbyLandable();
			if(ship.getLocation() != LOCATION_SYSTEM) {
				ship.setParked(true);
			}
			return;
		}

		let requiredParts = [{part: "HULL", gen: 5}, {part: "ENGINE", gen: 4}, {part: "TANK", gen: 4}];
		let upgradeResult = await ship.upgradeBodyPartListNew(requiredParts);
		if(upgradeResult < 0) return;

		let home = SYSTEM_SCHEAT;
		//let dest = SYSTEM_IOTA_PEGASI;
		let dest = memory.homeSystem;
		//let planetName = "Oagawa";
		let planetName = memory.homePlanet;

		let returnToHome = false;

		let bestMineralTradeInConstellation = ship.getBestMineralTradeInConstellation(500);
		let bestMineralTradeInSystem = ship.getBestMineralTrade();
		let mineralAmount = ship.getMaxHold() * 0.7 - ship.getHold();
		let requiredBalance = 15000 + ((ship.getMaxFuel() - ship.getFuel()) * 10);
		ship.log(bestMineralTradeInConstellation);
		ship.log(bestMineralTradeInSystem);
		let sellingTo = "";
		if(bestMineralTradeInConstellation) {
			sellingTo = bestMineralTradeInConstellation.system;
		}
		/*if(bestMineralTradeInSystem) {
			sellingTo = ship.getCurrentSystem();
		} else if(bestMineralTradeInConstellation) {
			sellingTo = bestMineralTradeInConstellation.system;
		}*/

		ship.log(`Selling to: ${sellingTo}`);

		let warpingTo;
		if((ship.getBalance() >= 250000 && !ship.hasMinerals()) || returnToHome) 	warpingTo = home;
		else if(returningBack && sellingTo) 										warpingTo = sellingTo;
		else if(!returningBack) 													warpingTo = dest;
		else 																		warpingTo = home;

		if(!ship.getCurrentSystem() || (ship.getCurrentSystem() == dest && ship.getLocationName() != planetName)) {
			await ship.safeEscape();
		}

		if(ship.details.body.balance != requiredBalance && !ship.hasMinerals() && ship.getCurrentSystem() == SYSTEM_SCHEAT) {
			ship.log("info", "Operating " + requiredBalance + "!");
			if(await ship.operateMoney(requiredBalance) < 0) return;
		}

		else if(ship.getFuel() < ship.getMaxFuel() && ship.getCurrentSystem() != warpingTo && HIGH_SEC_SYSTEMS.includes(ship.getCurrentSystem())) {
			ship.log("info", "Landing at nearby to refuel.");
			await ship.parkAtNearbyLandable();
			return;
		}

		else if(ship.getFuel() == ship.getMaxFuel() && ship.getLocation() != LOCATION_SYSTEM && ship.getCurrentSystem() != warpingTo) {
			ship.log("info", "Escaping from atmosphere to fly to destination!");
			await ship.safeEscape();
		}

		if(ship.getCurrentSystem() != warpingTo) {
			await ship.warpToSystem(warpingTo);
		}

		else if(ship.getCurrentSystem() == sellingTo && returningBack && ship.hasMinerals() && bestMineralTradeInSystem) {
			ship.log("info", "I have minerals on the board, so I'm flying to planet and try to sell them.");

			let deal = bestMineralTradeInSystem;
			await ship.parkAtSpecifiedPlanet(deal.planet);

			ship.log(deal)

			let planetInfo = await ship.safeScan(deal.planet);
			if(planetInfo) {
				ship.setPlanetDeals(planetInfo);
				let buyTrade = planetInfo.body.deals.find(item => item.uuid == deal.uuid);
				if(buyTrade) {
					ship.log(buyTrade.uuid);
					await ship.safeAccept(buyTrade.uuid);
					await ship.safeFuel();

					planetInfo = await ship.safeScan(deal.planet);
					ship.setPlanetDeals(planetInfo);
					//ship.log("info", "Trade successfully accepted!");
				}
			}
			return;
		}

		if(ship.getBalance() < 10000 && !ship.hasMinerals()) {
			ship.log("Warping to Scheat for money, because I'm a dumdum and don't have enough!");
			await ship.warpToSystem(HOME_SYSTEM);
			return;
		}
		
		if(ship.getCurrentSystem() == dest && !returningBack && ship.getLocation() == LOCATION_SYSTEM) {
			ship.log("warn", "Landing on " + planetName)
			let planets = radarData.nodes.filter((instance => instance.type == "Planet")); // Get all planets
			let planet = planets.find((pla) => pla.uuid == planetName);
			let vect = mafs.Line(	mafs.Pos(	ship.details.body.vector.x,
													ship.details.body.vector.y),
									mafs.Pos(	planet.body.vector.x,
													planet.body.vector.y)
								);
			let extended = mafs.extendLine(vect, 40);
			await ship.safeLanding(planet.uuid);
			await ship.safeMove(extended.p2.x, extended.p2.y);
			await ship.safeFuel();
			return;
		}

		if(ship.getLocation() == LOCATION_PLANET && ship.getLocationName() == planetName) {
			if(await ship.getMineralsFromPlanet(planetName, mineralAmount) < 0) return;
		}
	}
}