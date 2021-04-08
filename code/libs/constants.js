// Sun collision and pathfinder
global.SUN_FAR_RADIUS = 425; // fly to
global.SUN_CLOSE_RADIUS = 350; // if intersect


global.KEEP_MINIMUM = 100;

global.ACTION_DELAY = 220;

// Locations
global.LOCATION_PLANET = "Planet";
global.LOCATION_SYSTEM = "System";
global.LOCATION_BUSINESS_STATION = "BusinessStation";
global.LOCATION_SCIENTIFIC_STATION = "ScientificStation";

// Stations
global.BUSINESS_STATION_NAME = "Baker Plaza";
global.SCIENTIFIC_STATION_NAME = "Dominion";

global.USELESS_MINER_ITEMS = /*[sdk.CargoType.DROID, sdk.CargoType.PROTECTOR, sdk.CargoType.TANK]*/ ["protector"];

// Systems
global.SYSTEM_SCHEAT = "Scheat";
global.SYSTEM_SADALBARI = "Sadalbari";
global.SYSTEM_MATAR = "Matar";
global.SYSTEM_SALM = "Salm";
global.SYSTEM_SIRRAH = "Sirrah";
global.SYSTEM_PI1_PEGASI = "Pi-1 Pegasi";
global.SYSTEM_SADALPHERIS = "Sadalpheris";
global.SYSTEM_ALGENIB = "Algenib";
global.SYSTEM_IOTA_PEGASI = "Iota Pegasi";

global.HOME_SYSTEM = SYSTEM_SCHEAT;


// Roles
global.ROLE_MINER = "Miner";
global.ROLE_FREIGHTER = "Freighter";
global.ROLE_DEFENDER = "Defender";
global.ROLE_COLONIZER = "Colonizer";

global.WANTED_PLANETS = {SYSTEM_PI1_PEGASI: ["Droebos"]};

global.OWNED_PLANETS = ["Droebos"];

global.TRADE_EXPIRE_TIME = 1000 * 60 * 45; // 45 minutes

global.MIN_TRADE_EXPIRE_TIME = 1000 * 60 * 5; // 5 minutes

global.MINIMAL_BODY_COST = 1000;
global.HULL_CHANGE_COST = 1000;
global.HIGHEST_MINERAL_TRADE_COST = 50;

// not as constant but still
global.WARPS = {};

function addPath(from, to, coords) {
	WARPS[from] = WARPS[from] || {};
	WARPS[from][to] = coords;
}

addPath(SYSTEM_SCHEAT, SYSTEM_SADALBARI, {x: 5057, y: 6199});
addPath(SYSTEM_SADALBARI, SYSTEM_SCHEAT, {x: -5057, y: -6199});

addPath(SYSTEM_SCHEAT, SYSTEM_SADALPHERIS, {x: 5352, y: 5946});
addPath(SYSTEM_SADALPHERIS, SYSTEM_SCHEAT, {x: -5352, y: -5946});

addPath(SYSTEM_SADALBARI, SYSTEM_SADALPHERIS, {x: 6074, y: 5206});
addPath(SYSTEM_SADALPHERIS, SYSTEM_SADALBARI, {x: -6074, y: -5206});

addPath(SYSTEM_SADALPHERIS, SYSTEM_IOTA_PEGASI, {x: 7854, y: -1520});
addPath(SYSTEM_IOTA_PEGASI, SYSTEM_SADALPHERIS, {x: -7854, y: 1520});

addPath(SYSTEM_SCHEAT, SYSTEM_MATAR, {x: 7235, y: -3413});
addPath(SYSTEM_MATAR, SYSTEM_SCHEAT, {x: -7235, y: 3413});

addPath(SYSTEM_SCHEAT, SYSTEM_SALM, {x: -5527, y: 5784});
addPath(SYSTEM_SALM, SYSTEM_SCHEAT, {x: 5527, y: -5784});

addPath(SYSTEM_MATAR, SYSTEM_PI1_PEGASI, {x: 7499, y: -2788});
addPath(SYSTEM_PI1_PEGASI, SYSTEM_MATAR, {x: -7499, y: 2788});

addPath(SYSTEM_MATAR, SYSTEM_PI1_PEGASI, {x: 7499, y: -2788});
addPath(SYSTEM_PI1_PEGASI, SYSTEM_MATAR, {x: -7499, y: 2788});

addPath(SYSTEM_ALGENIB, SYSTEM_SALM, {x: 7059, y: -3765});
addPath(SYSTEM_SALM, SYSTEM_ALGENIB, {x: -7059, y: 3765});


// System coordinates
global.SYSTEMS = {
	SYSTEM_SCHEAT: 		{x: 217, y: 136	},
	SYSTEM_MATAR: 		{x: 270, y: 111	},
	SYSTEM_SALM:		{x: 174, y: 181	},
	SYSTEM_SADALBARI:	{x: 248, y: 174	},
	SYSTEM_PI1_PEGASI:	{x: 348, y: 82	},
	SYSTEM_ALGENIB:		{x: 24,  y: 261 },
}


global.SCHEAT_SADALBARI_VECTOR = {x: 5057, y: 6199};

global.ROLES = [
	{
		role: ROLE_MINER,
		homeSystem: HOME_SYSTEM,
	},
	{
		role: ROLE_MINER,
		homeSystem: SYSTEM_SALM,
	},
	{
		role: ROLE_MINER,
		homeSystem: SYSTEM_MATAR,
	},
	{
		role: ROLE_COLONIZER,
		homeSystem: HOME_SYSTEM,
	},
	{
		role: ROLE_MINER,
		homeSystem: SYSTEM_SADALBARI,
	},
	{
		role: ROLE_MINER,
		homeSystem: SYSTEM_SADALPHERIS,
	},
	{
		role: ROLE_MINER,
		homeSystem: HOME_SYSTEM,
	},
	{
		role: ROLE_MINER,
		homeSystem: HOME_SYSTEM,
	},
	{
		role: ROLE_MINER,
		homeSystem: HOME_SYSTEM,
	},
	/*{
		role: ROLE_FREIGHTER,
		homeSystem: SYSTEM_SCHEAT,
	},
	{
		role: ROLE_MINER,
		homeSystem: SYSTEM_MATAR,
	},
	{
		role: ROLE_MINER,
		homeSystem: SYSTEM_MATAR,
	},
	{
		role: ROLE_MINER,
		homeSystem: HOME_SYSTEM,
	},
	{
		role: ROLE_FREIGHTER,
		homeSystem: HOME_SYSTEM,
	},
	{
		role: ROLE_MINER,
		homeSystem: HOME_SYSTEM,
	},*/
];

// Safe commands
global.RESULT_OK = 0;


// parkAtNearbyLandable
global.ALREADY_PARKED = 0;
global.FLYING_TO_LANDABLE = 1;

// operateMoney
global.BUSINESS_STATION_NOT_FOUND = 0;
global.FLYING_TO_BUSINESS_STATION = 1;
global.CURRENTLY_DEPOSITING = 2;
global.CLOSED_DEPOSIT = 3;