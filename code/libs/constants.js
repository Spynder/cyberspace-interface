// GRAPHICAL
global.fps = 60;

global.SCREEN_START = "start";
global.SCREEN_CLUSTER = "cluster";
global.SCREEN_SYSTEM = "system";

global.JSON_RENDER_OPTIONS = {
	collapsed: false,
	rootCollapsable: true,
	withQuotes: false,
	withLinks: true,
};

global.STAT_GOOD = "good";
global.STAT_WARNING = "warning";
global.STAT_CRITICAL = "critical";
global.STAT_UNKNOWN = "unknown";

global.BALANCE_WARNING = 4000;
global.BALANCE_CRITICAL = 50000;

global.SHIPS_ENABLED = "Park all ships (Safe exit)";
global.SHIPS_DISABLED = "Activate all ships";

global.SHIPSTATE = {
	OFF: 0,
	WAIT: 1,
	PARK: 2,
	ON: 3
}

global.SHIPACTIVITY_ONLINE = "shipOnline";
global.SHIPACTIVITY_OFFLINE = "shipOffline";

global.GOINSIDE_OK = "Go inside the selected system";
global.GOINSIDE_NULL = "No system selected";
global.GOINSIDE_INFO = "No info of this system";

global.COLOR_BG = "#222";
global.COLOR_BG_LIGHT = "#555";
global.COLOR_BG_DARK = "#181818";
global.COLOR_STROKE = "#AAA";
global.COLOR_TEXT_MAIN = "#EEE";
global.COLOR_TEXT_SECONDARY = "#BBB";
global.COLOR_START_BUTTON_FILL = "#47ab50";
global.COLOR_START_BUTTON_STROKE = "#444";
global.COLOR_SYSTEM_STROKE = "#EEE";
global.COLOR_SYSTEM_FILL_SAFE = "#FF9D2E";
global.COLOR_SYSTEM_FILL_UNSAFE = "#FF542E";
global.COLOR_SYSTEM_SAFETY_RIM = "#A3FC7E";
global.COLOR_SYSTEM_PLANET = "#A88";
global.COLOR_SYSTEM_PLANET_TRAIL = "#888";
global.COLOR_SYSTEM_ASTRAL_BODY_RIM = "#CCC";
global.COLOR_SYSTEM_MINERAL = "#696";
global.COLOR_SYSTEM_ASTEROID = "#444";
global.COLOR_SYSTEM_BODYPART = "#669";
global.COLOR_SYSTEM_SHIP_FRIENDLY = "#390";
global.COLOR_SYSTEM_SHIP_ALLY = "#CD0";
global.COLOR_SYSTEM_SHIP_HOSTILE = "#910";
global.COLOR_SYSTEM_WARP_RING = "#B77";
global.COLOR_SYSTEM_MARKER = "#BBB";
global.COLOR_SYSTEM_MARKER_LINE = "#AAA";
global.COLOR_SYSTEM_STATION_BUSINESS = "#B97";
global.COLOR_SYSTEM_STATION_SCIENTIFIC = "#789";

global.SYSTEM_RADIUS = 10;
global.SYSTEM_OFFSET = {xp: 0.1, yp: 0.1};
global.SYSTEM_DISTANCE_MULTIPLIER = 1.5;
global.SYSTEM_BOX_OFFSET = 16;
global.SYSTEM_SAFETY_RIM_RADIUS = 100;
global.SYSTEM_SUN_RADIUS = 300;
global.SYSTEM_PLANET_RADIUS = 200;
global.SYSTEM_CARGO_RADIUS = 30;
global.SYSTEM_ASTEROID_RADIUS = 30;
global.SYSTEM_STATION_RADIUS = 150;
global.SYSTEM_SHIP_SIZE = 64;
global.SYSTEM_WARP_RING_RADIUS = 8000;
global.SYSTEM_MARKER_RADIUS = 100;
global.SYSTEM_TIME_TEXT_MARGIN = 32;
global.OWNER_ID = "a678ea674c";

global.SCALE_SENSITIVITY = 0.003;
global.SYSTEM_START_ZOOM = 0.1;


global.TEXT_LINE_MARGIN_MEDIUM = 18;
global.TEXT_LINE_MARGIN_SMALL = 4;

global.TEXT_SIZE_BIG = 72;
global.TEXT_SIZE_MEDIUM = 36;
global.TEXT_SIZE_SMALL = 20;





// TECHNICAL

// Sun collision and pathfinder
global.SUN_FAR_RADIUS = 450; // fly to
global.SUN_CLOSE_RADIUS = 400; // if intersect

global.KEEP_MINIMUM = 100;

global.ACTION_DELAY = 300;

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
global.SYSTEM_MARKAB = "Markab";

// System coordinates
global.SYSTEM_SCHEAT 		= "Scheat";
global.SYSTEM_MATAR 		= "Matar";
global.SYSTEM_PI1_PEGASI 	= "Pi-1 Pegasi";
global.SYSTEM_SADALBARI 	= "Sadalbari";
global.SYSTEM_SADALPHERIS 	= "Sadalpheris";
global.SYSTEM_IOTA_PEGASI 	= "Iota Pegasi";
global.SYSTEM_JIH 			= "Jih";
global.SYSTEM_SALM 			= "Salm";
global.SYSTEM_SIRRAH 		= "Sirrah";
global.SYSTEM_ALGENIB 		= "Algenib";
global.SYSTEM_MARKAB 		= "Markab";
global.SYSTEM_HOMAM 		= "Homam";
global.SYSTEM_BAHAM 		= "Baham";
global.SYSTEM_ENIF 			= "Enif";


global.SYSTEMS = [	{x: 217,	y: 136,		name: "Scheat"},
					{x: 270, 	y: 111, 	name: "Matar"},
					{x: 348, 	y: 82,		name: "Pi-1 Pegasi"},
					{x: 248, 	y: 174,		name: "Sadalbari"},
					{x: 262, 	y: 186, 	name: "Sadalpheris"},
					{x: 355, 	y: 168, 	name: "Iota Pegasi"},
					{x: 414, 	y: 161, 	name: "Jih"},
					{x: 174, 	y: 181, 	name: "Salm"},
					{x: 61, 	y: 111, 	name: "Sirrah"},
					{x: 24, 	y: 261, 	name: "Algenib"},
					{x: 208, 	y: 277, 	name: "Markab"},
					{x: 270, 	y: 327, 	name: "Homam"},
					{x: 354, 	y: 378, 	name: "Baham"},
					{x: 428, 	y: 333, 	name: "Enif"}];

global.HIGH_SEC_SYSTEMS = [
	SYSTEM_SCHEAT,
	SYSTEM_MATAR,
	SYSTEM_SADALBARI,
	SYSTEM_SADALPHERIS,
	SYSTEM_SALM,
];

// Sadalbari - Bodion, Icypso, Niapra
// Sadalpheris - Unkoinus, Grion A5,
// Salm - Acapus
// Matar - Caolia, Lozolia

global.HOME_SYSTEM = SYSTEM_SCHEAT;


// Roles
global.ROLE_MINER = "Miner";
global.ROLE_FREIGHTER = "Freighter";
global.ROLE_ATTACKER = "Attacker";
global.ROLE_COLONIZER = "Colonizer";
global.ROLE_SCOUT = "Scout";
global.ROLE_MANUAL = "Manual";

global.TRADE_EXPIRE_TIME = 1000 * 60 * 45; // 45 minutes
global.MIN_TRADE_EXPIRE_TIME = 1000 * 60 * 10; // 10 minutes

global.MINIMAL_BODY_COST = 1000;
global.HULL_CHANGE_COST = 1000;
global.HIGHEST_MINERAL_TRADE_COST = 50;

global.MAX_RADARMEMORY_ELEMENTS = 5;

global.ALLY_IDS = [
	"e8be292de2", // Kosrotoff
	"2c865b9658", // RAMZIK
	"1c5b926242", // 1323ED5
];
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

addPath(SYSTEM_SCHEAT, SYSTEM_SIRRAH, {x: -7899, y: -1266});
addPath(SYSTEM_SIRRAH, SYSTEM_SCHEAT, {x: 7899, y: 1266});

addPath(SYSTEM_MATAR, SYSTEM_PI1_PEGASI, {x: 7499, y: -2788});
addPath(SYSTEM_PI1_PEGASI, SYSTEM_MATAR, {x: -7499, y: 2788});

addPath(SYSTEM_MATAR, SYSTEM_PI1_PEGASI, {x: 7499, y: -2788});
addPath(SYSTEM_PI1_PEGASI, SYSTEM_MATAR, {x: -7499, y: 2788});

addPath(SYSTEM_ALGENIB, SYSTEM_SALM, {x: 7059, y: -3765});
addPath(SYSTEM_SALM, SYSTEM_ALGENIB, {x: -7059, y: 3765});

addPath(SYSTEM_MARKAB, SYSTEM_SALM, {x: -2671, y: -7541});
addPath(SYSTEM_SALM, SYSTEM_MARKAB, {x: 2671, y: 7541});



global.ROLES = [
	{
		role: ROLE_MINER,
		homeSystem: SYSTEM_SCHEAT,
	},
	{
		role: ROLE_MINER,
		homeSystem: SYSTEM_SADALBARI, // dead
	},
	{
		role: ROLE_MINER,
		homeSystem: SYSTEM_SALM, // dead
	},
	// First time, ships are very slow, so we need many of them

	{
		role: ROLE_MINER,
		homeSystem: SYSTEM_MATAR, // dead
	},
	{
		role: ROLE_MINER,
		homeSystem: SYSTEM_SADALPHERIS, // dead
	},
	{
		role: ROLE_MINER,
		homeSystem: SYSTEM_SADALPHERIS, // dead
	},
	{
		role: ROLE_MANUAL,
		homeSystem: SYSTEM_SADALPHERIS,
	},
	{
		role: ROLE_MINER,
		homeSystem: SYSTEM_MATAR,
	},
	{
		role: ROLE_MINER,
		homeSystem: SYSTEM_SALM,
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
		role: ROLE_SCOUT,
		homeSystem: SYSTEM_SCHEAT,
		scoutingPlanet: "Drewsa",
	},
	{
		role: ROLE_SCOUT,
		homeSystem: SYSTEM_SCHEAT,
		scoutingPlanet: "Roebe",
	},
	{
		role: ROLE_SCOUT,
		homeSystem: SYSTEM_SCHEAT,
		scoutingPlanet: "Mayvel",
	},
	{
		role: ROLE_SCOUT,
		homeSystem: SYSTEM_SCHEAT,
		scoutingPlanet: "Headsbing",
	},
	{
		role: ROLE_SCOUT,
		homeSystem: SYSTEM_SADALPHERIS,
		scoutingPlanet: "Unkoinus",
	},
	{
		role: ROLE_SCOUT,
		homeSystem: SYSTEM_SADALPHERIS,
		scoutingPlanet: "Grion A5",
	},
	{
		role: ROLE_SCOUT,
		homeSystem: SYSTEM_SALM,
		scoutingPlanet: "Acapus",
	},
	{
		role: ROLE_MINER,
		homeSystem: HOME_SYSTEM,
	},
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

// upgradeBodyPart
global.CHANGING_BODY_PART = 0;
global.BUYING_BODY_PART = 1;
global.BODY_PART_UPGRADED = 2;
global.SHIP_HAS_MINERALS = 3;
global.NOT_IN_SCHEAT = 4;
global.NO_DEALS = 5;
global.NOT_ENOUGH_MONEY = 6;
global.BAD_HULL = 7;

//upgradeBodyPartList
global.CHANGING_PART = 0;
global.ALL_CHANGED = 1;
global.NOT_DONE = 2;
global.NOT_ENOUGH_SCORE = 3;


// Return Codes
// If x>0, continue code execution
// If x<0, return (shortcut is in action)
global.rcs = {
	RESULT_OK: 001,

	// warpToSystem
	END_DESTINATION: 101,
	NO_VALID_PATH: 102,
	WARPING_TO_SYSTEM: -101,

	// getClosestPlanet
	NO_PLANETS_FOUND: 201,

	// getClosestSystem
	CURRENT_SYSTEM_UNKNOWN: 301,
	PLANET_ARRAY_IS_EMPTY: 302,

	// upgradeBodyPartList
	NOT_ENOUGH_SCORE: 401,
	NOT_DONE_CHANGING_LIST: 402,
	LIST_ALL_CHANGED: 403,
	LIST_CHANGING_PART: -401,

	// upgradeBodyPart
	NO_DEALS: 501,
	BODY_PART_UPGRADED: 502,
	HULL_IS_LOW_LEVEL: 503,
	SHIP_HAS_MINERALS: 504,
	BUYING_BODY_PART: -501,
	CHANGING_BODY_PART: -502,

	// operateMoney
	BUSINESS_STATION_NOT_FOUND: 601,
	FLYING_TO_BUSINESS_STATION: -601,
	CURRENTLY_DEPOSITING: -602,
	CLOSED_DEPOSIT: -603,

};
