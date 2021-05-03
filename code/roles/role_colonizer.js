var mafs = require("../libs/mafs");
var delay = require("delay");

module.exports = {
	run: async function(ship, account, sdk, options) {
		// 1. Check if we have any planets ready for colonization
		// 2. If so, get N * 10000 + 4400 (for fuel) from Baker Plasa
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

		let buyVirus = false;

		var immediatePark = !options.active;
		
		if(immediatePark) {
			loggerShip.info("Parking at nearby landable by command.");
			await ship.parkAtNearbyLandable();
			console.log(ship.getLocation());
			if(ship.getLocation() != LOCATION_SYSTEM) {
				ship.setParked(true);
			}
			return;
		}

		var home = SYSTEM_SCHEAT;
		var dest = SYSTEM_ALGENIB;
		var planetName = "Natov";

		if(ship.hasCargo("embryo")) {
			await ship.safeEquip("artifact1", ship.hasCargo("embryo")[0].uuid);
		}
		if(ship.hasCargo("virus")) {
			await ship.safeEquip("artifact2", ship.hasCargo("virus")[0].uuid);
		}

		//var currLocation = mafs.findWarpDestination(ship.getCurrentSystem(), dest);

		/*console.log(ship.details.parent.uuid);*/
		if(ship.getLocation() == LOCATION_SYSTEM && ship.getCurrentSystem() == dest) {
			loggerShip.warn("Landing on owned");
			var planets = radarData.nodes.filter((instance => instance.type == "Planet")); // Get all planets
			var planet = planets.find((pla) => pla.uuid == planetName);
			if(planet) {
				var vect = new mafs.Line(	new mafs.Pos(	ship.details.body.vector.x,
															ship.details.body.vector.y),
											new mafs.Pos(	planet.body.vector.x,
															planet.body.vector.y)
										);
				var extended = mafs.extendLine(vect, 40);
				await ship.safeMove(extended.p2.x, extended.p2.y);
				await ship.safeLanding(planet.uuid);
			}
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

		if(ship.getLocationName() == planetName) {
			await ship.safeFuel();
			var owned = await account.getPlanet(planetName);
			var ownedDetails = await owned.explore();
			console.log(ownedDetails);
			console.log(ownedDetails.nodes);
			owned.dispose();
			return;
		}

		if(!ship.getCurrentSystem()) {
			loggerShip.info("Escaping the atmosphere to understand, where am I.");
			await ship.safeEscape();
		}

		else if(ship.getFuel() < ship.getMaxFuel() && ship.getCurrentSystem() != dest && HIGH_SEC_SYSTEMS.includes(ship.getCurrentSystem())) {
			loggerShip.warn("Landing on closest planet to refuel")
			await ship.parkAtNearbyLandable();
			await ship.safeFuel();
			return;
		}
		if(!ship.hasCargo("embryo") && ship.getCurrentSystem() != HOME_SYSTEM) {
			await ship.warpToSystem(home);
		}

		else if(ship.hasCargo("embryo")/* && ship.hasCargo("virus")*/) {
			await ship.warpToSystem(dest);
		}

		if(((ship.getLocalMemory()).location == SYSTEM_SCHEAT || ship.getLocation() == "ScientificStation" || ship.getLocation() == "BusinessStation") && !ship.hasCargo("embryo")) {
			console.log("In");
			console.log(details.body.balance);
			var requiredMoney = 5000 + 10000 + (buyVirus ? 10000 : 0);
			if(details.body.balance != requiredMoney) {
				console.log("Operating");
				await ship.operateMoney(requiredMoney);
			} else {
				console.log("Getting artifacts");
				await ship.safeEscape();
			    var sciStation = radarData.nodes.find((instance) => instance.type == "ScientificStation"); // replace to find
				if(sciStation) {
					await ship.safeMove(sciStation.body.vector.x, sciStation.body.vector.y);
					await ship.safeLanding(sciStation.uuid);
					await ship.safeApply("GET_EMBRYO");
					if(buyVirus) {
						await ship.safeApply("GET_VIRUS");
					}
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