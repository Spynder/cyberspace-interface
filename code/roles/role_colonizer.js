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

		let buyVirus = false;

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
		var dest = SYSTEM_IOTA_PEGASI;
		var planetName = "Hephus";
		let fuelMoney = 15000;

		if(ship.getLocation() != LOCATION_SYSTEM && ship.getCurrentSystem() != dest || ship.getLocationName() != planetName) {
			await ship.safeEscape();
		}
		/*console.log(ship.details.parent.uuid);*/
		if(ship.getLocation() == LOCATION_SYSTEM && ship.getCurrentSystem() == dest && ship.hasCargo("embryo").length) {
			ship.log("warn", "Flying to required planet");

			var planets = radarData.nodes.filter((instance => instance.type == "Planet")); // Get all planets
			var planet = planets.find((pla) => pla.uuid == planetName);
			if(planet) {
				var vect = mafs.Line(	mafs.Pos(	ship.details.body.vector.x,
															ship.details.body.vector.y),
											mafs.Pos(	planet.body.vector.x,
															planet.body.vector.y)
										);
				var extended = mafs.extendLine(vect, 40);
				await ship.safeMove(extended.p2.x, extended.p2.y);
				await ship.safeLanding(planet.uuid);
			}
		}
		else if(ship.getLocationName() == planetName) {
			if(ship.hasCargo("virus").length) {
				await ship.safeApply("EXTERMINATION");
			}
			if(ship.hasCargo("embryo").length) {
				await ship.safeApply("COLONIZATION");
			}
		}

		if(ship.getLocationName() == planetName) {
			await ship.safeFuel();
		}


		if(!ship.getCurrentSystem()) {
			ship.log("info", "Escaping the atmosphere to understand, where am I.");
			await ship.safeEscape();
		}

		else if(ship.getFuel() < ship.getMaxFuel() && ship.getCurrentSystem() != dest) {
			ship.log("warn", "Landing on closest planet to refuel")
			let landable = await ship.findInhabitedLandables()[0];
			await ship.parkAtSpecifiedLandable(landable.uuid);
			//await ship.parkAtNearbyLandable();
			await ship.safeFuel();
			return;
		}
		if(!ship.hasCargo("embryo").length && ship.getCurrentSystem() != HOME_SYSTEM) {
			//console.log("Sitting")
			await ship.warpToSystem(home);
		}

		else if(ship.hasCargo("embryo").length) {
			await ship.warpToSystem(dest);
		}

		if(((ship.getLocalMemory()).location == SYSTEM_SCHEAT || ship.getLocation() == "ScientificStation" || ship.getLocation() == "BusinessStation") && !ship.hasCargo("embryo").length) {
			ship.log("info", "Getting artifacts");
			var requiredMoney = fuelMoney + 10000 + (buyVirus ? 10000 : 0);
			if(details.body.balance != requiredMoney) {
				await ship.operateMoney(requiredMoney);
			} else {
				await ship.safeEscape();
			    var sciStation = radarData.nodes.find((instance) => instance.type == "ScientificStation");
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
			var vect = mafs.Line(	mafs.Pos(	ship.details.body.vector.x,
														ship.details.body.vector.y),
										mafs.Pos(	planet.body.vector.x,
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