let mafs = require("../libs/mafs");
let delay = require("delay");

module.exports = {
	run: async function(ship, account, sdk, options) {
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

		let systemName = SYSTEM_PI1_PEGASI;
		let from = "Poaruta";
		let to = "Droebos";

		if(ship.getFuel() < ship.getMaxFuel() && ship.getCurrentSystem() != systemName && ship.findInhabitedLandables().length > 0) {
			await ship.parkAtNearbyLandable();
			return;
		}

		
		if(ship.uuid == "ddd16ba792") {
			let uuid = "cb8d3135a9";
			//await ship.safeTransfer("5beb3e8f85", "out");
			//await ship.safeTransfer("4b281f38ac", "out");
			//await ship.warpToSystem(SYSTEM_PI1_PEGASI);
			//await ship.parkAtSpecifiedPlanet("Droebos");
			//await ship.warpToSystem(SYSTEM_SCHEAT);
			//await ship.safeMove(700, 700);
			//await ship.safeLanding("Dominion");
				//await ship.safeApply("CHANGE_HULL", "cb8d3135a9");
			//return;
			//await ship.parkAtSpecifiedPlanet("Droebos");

			//await ship.warpToSystem(SYSTEM_IOTA_PEGASI);
			//await ship.parkAtSpecifiedPlanet("Oagawa");
			//await ship.createModuleOnPlanet("Oagawa", "ENGINE", 8);
			//await ship.safeTransfer("d69ce012f4", "in");
			//await ship.safeEquip("engine", "d69ce012f4");
		} else {
			//await ship.warpToSystem(SYSTEM_IOTA_PEGASI);
			//await ship.createModuleOnPlanet("Tilia", "TANK", 6);
			//await ship.createModuleOnPlanet("Droebos", "DROID", 8);
			//await ship.createModuleOnPlanet("Thailara", "WEAPON", 8);

			//await ship.clearPlanetBalance("Droebos");

			//await ship.createModuleOnPlanet("Thides G1", "WEAPON", 8);

			/*await ship.safeTransfer("f7a72d4ea1", "in");
			await ship.safeEquip("tank", "f7a72d4ea1");
			await ship.safeEscape();
			await ship.safeDrop("fcb079b033");
			await ship.safeAttack("fcb079b033", [1]);*/
		}

		let exchangeItems = false;
		if(exchangeItems) {
			if(!ship.getCurrentSystem()) {
				await ship.safeEscape();
			}
			if(ship.getCurrentSystem() == SYSTEM_SCHEAT) {
				await ship.safeEscape();
				await ship.safeMove(0, 3500);
				let itemUuid = "d4e72cab74";

				//await ship.safeAttack(itemUuid, [1]);

				if(ship.uuid == "ddd16ba792") {
					await ship.safeDrop(itemUuid);
				} else {
					await ship.safeGrab(itemUuid);
				}
			}
		}

		//let requiredMinerals = ship.getMaxHold() * 0.6 - ship.getHold();
		//await ship.clearPlanetBalance("Oagawa");
		//await ship.createModuleOnPlanet("Tilia", "ENGINE", 8);
		//await ship.transferMineralsFromPlanets(from, to, ship.getMaxHold() * 0.6 - ship.getHold());

		//await ship.createModuleOnPlanet("Poaruta", "WEAPON", 8);
		//await ship.safeTransfer("b1334b8f1b", "in");
		//await ship.safeEquip("weapon3", "b1334b8f1b");
		//await ship.safeTransfer("c3fe42eb37", "in");

		/*if(returningBack) {
			await ship.transferAllMineralsToPlanet(to);
			return;
		} else {
			await ship.getMineralsFromPlanet(from, requiredMinerals);
		}*/

	}
}