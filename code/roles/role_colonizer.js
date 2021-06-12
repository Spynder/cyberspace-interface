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

		let buyVirus = true;

		var immediatePark = !options.active;
		
		if(immediatePark) {
			ship.log("info", "Parking at nearby landable by command.");
			await ship.parkAtNearbyLandable();
			if(ship.getLocation() != LOCATION_SYSTEM) {
				ship.setParked(true);
			}
			return;
		}

		var home = SYSTEM_SCHEAT;
		var dest = SYSTEM_MARKAB;
		var planetName = "Induna";
		let fuelMoney = 10600;

		// Stopped working with patch v0.19-Alpha (14.05.2021)
		/*if(ship.hasCargo("embryo")) {
			await ship.safeEquip("artifact1", ship.hasCargo("embryo")[0].uuid);
		}
		if(ship.hasCargo("virus")) {
			await ship.safeEquip("artifact2", ship.hasCargo("virus")[0].uuid);
		}*/

		//var currLocation = mafs.findWarpDestination(ship.getCurrentSystem(), dest);
		//ship.log("info", ship.getLocation())
		//ship.log("info", ship.getCurrentSystem())
		//ship.log("info", ship.getLocationName())

		

		if(ship.getLocation() != LOCATION_SYSTEM && ship.getCurrentSystem() != dest || ship.getLocationName() != planetName) {
			await ship.safeEscape();
		}
		/*console.log(ship.details.parent.uuid);*/
		if(ship.getLocation() == LOCATION_SYSTEM && ship.getCurrentSystem() == dest && ship.hasCargo("embryo")) {
			ship.log("warn", "Flying to required planet");

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
		else if(ship.getLocationName() == planetName) {
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
			/*var owned = await account.getPlanet(planetName);
			var ownedDetails = await owned.explore();
			ship.log("info", ownedDetails);
			ship.log("info", ownedDetails.nodes);
			owned.dispose();*/
			//return;
		}

		if(!ship.getCurrentSystem()) {
			ship.log("info", "Escaping the atmosphere to understand, where am I.");
			await ship.safeEscape();
		}

		else if(ship.getFuel() < ship.getMaxFuel() && ship.getCurrentSystem() != dest) {
			ship.log("warn", "Landing on closest planet to refuel")
			let landable = await ship.findInhabitedLandables()[0];
			await ship.parkAtSpecifiedPlanet(landable.uuid);
			//await ship.parkAtNearbyLandable();
			await ship.safeFuel();
			return;
		}
		if(!ship.hasCargo("embryo") && ship.getCurrentSystem() != HOME_SYSTEM) {
			//console.log("Sitting")
			await ship.warpToSystem(home);
		}

		else if(ship.hasCargo("embryo")) {
			await ship.warpToSystem(dest);
		}

		if(((ship.getLocalMemory()).location == SYSTEM_SCHEAT || ship.getLocation() == "ScientificStation" || ship.getLocation() == "BusinessStation") && !ship.hasCargo("embryo")) {
			ship.log("info", "Getting artifacts");
			var requiredMoney = fuelMoney + 10000 + (buyVirus ? 10000 : 0);
			if(details.body.balance != requiredMoney) {
				await ship.operateMoney(requiredMoney);
			} else {
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