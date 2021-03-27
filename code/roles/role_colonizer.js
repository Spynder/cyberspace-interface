var mafs = require("../libs/mafs");

module.exports = {
	run: async function(ship, account, sdk) {
		// 1. Check if we have any planets ready for colonization
		// 2. If so, get N * 10000 + 200 (for fuel) from Baker Plasa
		// 3. Buy embryo (and virus if needed)
		// 4. Warp to correct system
		// 5. Land on wanted planet
		// 6. Apply (virus if needed and) embryo with apply
		// 7. Return to HOME_SYSTEM

		// ARTIFACT - node type
		// ITEM901 - embryo view


		var radarData = ship.radarData; // Get all objects in current system
		var details = ship.details; // Get details of our ship
		var memory = ship.memory;
		console.log("COLONIZER");
		console.log("COLONIZER");
		console.log("COLONIZER");

		//await ship.safeEquip("artifact1", ship.hasCargo("ARTIFACT")[0].uuid);
		//await ship.safeEquip("artifact2", ship.hasCargo("ARTIFACT")[1].uuid);

		/*if(details.body.artifact1.uuid && details.body.artifact2.uuid) {
			await ship.safeEscape();
		}*/

		if(ship.hasCargo("embryo")) {
			await ship.safeEquip("artifact1", ship.hasCargo("embryo")[0].uuid);
		}
		if(ship.hasCargo("virus")) {
			await ship.safeEquip("artifact2", ship.hasCargo("virus")[0].uuid);
		}

		var home = SYSTEM_SCHEAT;
		var dest = SYSTEM_PI1_PEGASI;
		var planetName = "Droebos"

		/*console.log(ship.details.parent.uuid);*/
		if(ship.getLocation() == LOCATION_SYSTEM && ship.details.parent.uuid == SYSTEM_PI1_PEGASI) {
			loggerShip.warn("Landing on owned");
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


		}
		else if(ship.details.parent.uuid == planetName) {
			if(ship.hasCargo("virus")) {
				await ship.safeApply("EXTERMINATION");
			}
			if(ship.hasCargo("embryo")) {
				await ship.safeApply("COLONIZATION");
			}
			/*var planet = await account.getPlanet(OWNED_PLANETS[0]);
			var planetDetails = await planet.explore();
			//var uuidC = "3ffe3d0709";
			//await ship.safeTransfer(uuidC, "out");

			//console.log(planetDetails.nodes);
			planet.dispose();*/

			//console.log(ship.details.nodes);
		}

		var home = SYSTEM_SCHEAT;
		var dest = SYSTEM_PI1_PEGASI;

		var currLocation;
		currLocation = mafs.findWarpDestination((ship.getLocalMemory()).location, dest);


		if(!ship.getLocalMemory().location) {
			loggerShip.info("Escaping the atmosphere to understand, where am I.");
			await ship.safeEscape();
		}

		else if(ship.getFuel() < ship.getMaxFuel() && ship.getLocalMemory().location != dest) {
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
		}

		else if(currLocation && ship.hasCargo("embryo") && ship.hasCargo("virus")) {
			loggerShip.info("Warping " + (ship.getLocalMemory()).location + " > " + currLocation);
			await ship.safeEscape();
			var coords = WARPS[(ship.getLocalMemory()).location][currLocation];
			await ship.safeMove(coords.x, coords.y);
			await ship.safeWarp(currLocation);
		}




		/*if((ship.getLocation() == LOCATION_SYSTEM && ship.details.parent.uuid == HOME_SYSTEM) && details.body.artifact1.uuid && details.body.artifact2.uuid) {
			loggerShip.info("Warping to the Matar!");
			await ship.safeEscape();
			var coords = WARPS[SYSTEM_SCHEAT][SYSTEM_MATAR];
			await ship.safeMove(coords.x, coords.y);
			await ship.safeWarp(SYSTEM_MATAR);
			return;
		}
		if((ship.getLocation() == LOCATION_SYSTEM && ship.details.parent.uuid == SYSTEM_MATAR) && details.body.artifact1.uuid && details.body.artifact2.uuid) {
			loggerShip.info("Warping to the Pi-1 Pegasi!");
			await ship.safeEscape();
			var coords = WARPS[SYSTEM_MATAR][SYSTEM_PI1_PEGASI];
			await ship.safeMove(coords.x, coords.y);
			await ship.safeWarp(SYSTEM_PI1_PEGASI);
			return;
		}

		if((ship.getLocation() == LOCATION_SYSTEM && ship.details.parent.uuid == SYSTEM_PI1_PEGASI) && !details.body.artifact1.uuid && !details.body.artifact2.uuid) {
			loggerShip.info("Returning to the Matar!");
			await ship.safeEscape();
			var coords = WARPS[SYSTEM_PI1_PEGASI][SYSTEM_MATAR];
			await ship.safeMove(coords.x, coords.y);
			await ship.safeWarp(SYSTEM_MATAR);
			return;
		}
		if((ship.getLocation() == LOCATION_SYSTEM && ship.details.parent.uuid == SYSTEM_MATAR) && !details.body.artifact1.uuid && !details.body.artifact2.uuid) {
			loggerShip.info("Returning to the Scheat!");
			await ship.safeEscape();
			var coords = WARPS[SYSTEM_MATAR][SYSTEM_SCHEAT];
			await ship.safeMove(coords.x, coords.y);
			await ship.safeWarp(SYSTEM_SCHEAT);
			return;
		}*/
		//console.log((ship.getLocation() == LOCATION_SYSTEM && ship.details.parent.uuid == HOME_SYSTEM), ship.getLocation() == "ScientificStation" || ship.getLocation() == "BusinessStation", ship.details.parent.uuid, !details.body.artifact1.uuid && !details.body.artifact2.uuid);
		





		if(((ship.getLocalMemory()).location == SYSTEM_SCHEAT || ship.getLocation() == "ScientificStation" || ship.getLocation() == "BusinessStation") && !ship.hasCargo("embryo")) {
			console.log("In");
			console.log(details.body.balance);
			if(details.body.balance != 24400) {
				console.log("Operating");
				await ship.operateMoney(24400);
			} else {
				console.log("Getting artifacts");
				await ship.safeEscape();
			    var sciStation = radarData.nodes.find((instance) => instance.type == "ScientificStation"); // replace to find
				if(sciStation) {
					await ship.safeMove(sciStation.body.vector.x, sciStation.body.vector.y);
					await ship.safeLanding(sciStation.uuid);
					await ship.safeApply("GET_EMBRYO");
					await ship.safeApply("GET_VIRUS");
				}
			}
		}





		/*else if((ship.getLocation() == LOCATION_SYSTEM && ship.details.parent.uuid == SYSTEM_PI1_PEGASI) && details.body.artifact1.uuid && details.body.artifact2.uuid) {
			var planets = radarData.nodes.filter((instance => instance.type == "Planet")); // Get all planets
			var planet = planets.find((pla) => pla.uuid == "Droebos");
			var vect = new mafs.Line(	new mafs.Pos(	ship.details.body.vector.x,
														ship.details.body.vector.y),
										new mafs.Pos(	planet.body.vector.x,
														planet.body.vector.y)
									);
			var extended = mafs.extendLine(vect, 40);
			await ship.safeMove(extended.p2.x, extended.p2.y);
			await ship.safeLanding(planet.uuid);
			await ship.safeApply("EXTERMINATION");
			await ship.safeApply("COLONIZATION");
		}*/
		//await ship.safeEscape();
		//await ship.parkAtNearbyLandable();
	}
}