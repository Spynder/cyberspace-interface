const {ipcMain, webContents} = require("electron");

var web = webContents.getAllWebContents()[0];

const SHIPROLE_MINER = "Miner";
const SHIPROLE_COLONIZER = "Colonizer";
const SHIPROLE_FREIGHTER = "Freighter";
const SHIPROLE_DEFENDER = "Defender";

var shipsStash = [	{hullLevel: 1, ID: "a7fj3nfg", fuel: 3, fuelMax: 10, role: SHIPROLE_MINER, balance: 2432, system: "Scheat", 	 },
					{hullLevel: 4, ID: "jf73jsxm", fuel: 5, fuelMax: 10, role: SHIPROLE_MINER, balance: 88544, system: "Pi-1 Pegasi", },
					{hullLevel: 1, ID: "a7fj3nf1", fuel: 3, 			 role: SHIPROLE_MINER, balance: 2432, system: "Scheat", 	 },
					{hullLevel: 4, ID: "jf73jsx6", fuel: 5, fuelMax: 10, role: SHIPROLE_MINER, balance: 88544, system: "Sadalbari", },
					{hullLevel: 1, ID: "a7fj3nf4", fuel: 3, fuelMax: 10, role: SHIPROLE_MINER, balance: 2432, system: "Scheat", 	 },
					{hullLevel: 4, ID: "jf73jsx5", fuel: 5, fuelMax: 10, role: SHIPROLE_MINER, balance: 88544, system: "Pi-1 Pegasi", },
					{hullLevel: 2, ID: "abcdefgh", fuel: 3, fuelMax: 150, role: SHIPROLE_MINER, balance: 4624, system: "Sadalbari",	},	];

var shipIDs = shipsStash.map(ship => ship.ID);

var count = 0;

setTimeout(function() {
	web.send("allShipIDs", shipIDs);

	setInterval(function() { // kinda junky but testing code so ok
		web.send("shipInfo", shipsStash[count % shipsStash.length]);
		count++;
	}, 200);
}, 1000);
