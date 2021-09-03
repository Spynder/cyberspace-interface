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

global.BALANCE_WARNING = 5000;
global.BALANCE_CRITICAL = 50000;

global.OBJECTS_ENABLED = "Disable all objects (Safe exit)";
global.OBJECTS_DISABLED = "Activate all objects (Dangerous!)";

global.SHIPSTATE = {
	OFF: 0,
	WAIT: 1,
	PARK: 2,
	ON: 3
}

global.SWITCH_ON = "switchOn";
global.SWITCH_OFF = "switchOff";

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
global.COLOR_SYSTEM_WARPPOINT = "#009";
global.COLOR_SYSTEM_WARPPOINT_FILL = "#333";
global.COLOR_SYSTEM_ROTATION_LINE = "#444";

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
global.SYSTEM_WARPPOINT_RADIUS = 50;
global.SYSTEM_TIME_TEXT_MARGIN = 32;
global.OWNER_ID = "a678ea674c";

global.SCALE_SENSITIVITY = 0.003;
global.SYSTEM_START_ZOOM = 0.1;

global.ENEMY_CHECK_UPDATE_TIME = 2 * 1000;

global.TEXT_LINE_MARGIN_MEDIUM = 18;
global.TEXT_LINE_MARGIN_SMALL = 4;

global.TEXT_SIZE_BIG = 72;
global.TEXT_SIZE_MEDIUM = 36;
global.TEXT_SIZE_SMALL = 20;

global.SYSTEM_TEXT_SIZE_MEDIUM = 36*5;





// TECHNICAL

// Sun collision and pathfinder
global.SUN_FAR_RADIUS = 450; // fly to
global.SUN_CLOSE_RADIUS = 400; // if intersect

global.KEEP_MINIMUM = 500; // for fuel

global.ACTION_DELAY = 300;

// Locations
global.LOCATION_PLANET = "Planet";
global.LOCATION_SYSTEM = "System";
global.LOCATION_BUSINESS_STATION = "BusinessStation";
global.LOCATION_SCIENTIFIC_STATION = "ScientificStation";

// Stations
global.BUSINESS_STATION_NAME = "Baker Plaza";
global.SCIENTIFIC_STATION_NAME = "Dominion";

global.USELESS_MINER_ITEMS = ["protector"];

// Systems
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

// System coordinates
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

// Scheat - Drewsa, Roebe, Mayvel, Headsbing
// Matar - Caolia, Lozolia
// Sadalbari - Bodion, Icypso, Niapra
// Sadalpheris - Unkoinus, Grion A5,
// Salm - Acapus

global.HOME_SYSTEM = SYSTEM_SCHEAT;


// Roles
global.ROLE_MINER = "Miner";
global.ROLE_FREIGHTER = "Freighter";
global.ROLE_ATTACKER = "Attacker";
global.ROLE_COLONIZER = "Colonizer";
global.ROLE_SCOUT = "Scout";
global.ROLE_BUYER = "Buyer";
global.ROLE_COLLECTOR = "Collector";
global.ROLE_MANUAL = "Manual";

global.TRADE_EXPIRE_TIME = 1000 * 60 * 45; // 45 minutes
global.MIN_TRADE_EXPIRE_TIME = 1000 * 60 * 10; // 10 minutes

global.MINIMAL_BODY_COST = 1000;
global.HULL_CHANGE_COST = 1000;
global.HIGHEST_MINERAL_TRADE_COST = 50;

global.MAXIMUM_MONEY_ONBOARD_MULTIPLIER = 5; // this should be equal or higher than MONEY_OPERATION_MULTIPLIER
global.MONEY_OPERATION_MULTIPLIER = 4;

global.MAX_RADARMEMORY_ELEMENTS = 10;

global.ALLY_IDS = [
	"e8be292de2", // Kosrotoff
	"2c865b9658", // RAMZIK
	"1c5b926242", // 1323ED5
	"2e67533360", // Atsupak
];

// "a678ea674c" - Spynder
// "eace9ac1bd" - ED2LIN
// "01e68210c2" - Oktay


global.ROLES = [
	// 0-4
	{
		role: ROLE_MINER,
		homeSystem: SYSTEM_SCHEAT,
	},
	{
		role: ROLE_MINER,
		homeSystem: SYSTEM_MATAR,
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
		homeSystem: SYSTEM_SALM,
	},

	// 5-9
	{
		role: ROLE_ATTACKER,
		homeSystem: SYSTEM_IOTA_PEGASI,
		homePlanet: "Hephus",
	},
	{
		role: ROLE_MINER,
		homeSystem: SYSTEM_MATAR,
	},
	{
		role: ROLE_MINER,
		homeSystem: SYSTEM_SADALBARI,
	},
	{
		role: ROLE_ATTACKER,
		homeSystem: SYSTEM_IOTA_PEGASI,
		homePlanet: "Hephus",
	},
	{
		role: ROLE_MANUAL,
		homeSystem: SYSTEM_SALM,
	},

	// 10-14
	{
		role: ROLE_MINER,
		homeSystem: SYSTEM_SCHEAT,
	},
	{
		role: ROLE_MINER,
		homeSystem: SYSTEM_MATAR,
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
		homeSystem: SYSTEM_SALM,
	},

	// 15+
	{
		role: ROLE_MINER,
		homeSystem: SYSTEM_SALM,
	},
	{
		role: ROLE_COLLECTOR,
		homeSystem: SYSTEM_IOTA_PEGASI,
		homePlanet: "Thailara",
	},
	{
		role: ROLE_COLLECTOR,
		homeSystem: SYSTEM_IOTA_PEGASI,
		homePlanet: "Oagawa",
	},
	{
		role: ROLE_BUYER,
	},
	{
		role: ROLE_SCOUT,
		homeSystem: SYSTEM_SCHEAT,
		homePlanet: "Drewsa",
	},
	{
		role: ROLE_SCOUT,
		homeSystem: SYSTEM_SCHEAT,
		homePlanet: "Roebe",
	},
	{
		role: ROLE_SCOUT,
		homeSystem: SYSTEM_SCHEAT,
		homePlanet: "Mayvel",
	},
	{
		role: ROLE_SCOUT,
		homeSystem: SYSTEM_SCHEAT,
		homePlanet: "Headsbing",
	},
	{
		role: ROLE_SCOUT,
		homeSystem: SYSTEM_SADALPHERIS,
		homePlanet: "Unkoinus",
	},
	{
		role: ROLE_SCOUT,
		homeSystem: SYSTEM_SADALPHERIS,
		homePlanet: "Grion A5",
	},
	{
		role: ROLE_SCOUT,
		homeSystem: SYSTEM_SALM,
		homePlanet: "Acapus",
	},

	// Default
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
	RESULT_FAILED: -001,
	RESULT_BLOCKED: -002,

	// warpToSystem
	WTS_END_DESTINATION: 101,
	WTS_NO_VALID_PATH: 102,
	WTS_NOT_ENOUGH_MONEY_FOR_FUEL: 103,
	WTS_WARPING_TO_SYSTEM: -101,
	WTS_REFUELING: -102,

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
	OM_BUSINESS_STATION_NOT_FOUND: 601,
	OM_FLYING_TO_BUSINESS_STATION: -601,
	OM_CURRENTLY_DEPOSITING: -602,
	OM_CLOSED_DEPOSIT: -603,

	// switchToBetterPart
	STBP_NO_BODYPART_PASSED_TO_SWITCH: 701,
	STBP_NO_BETTER_PARTS: 702,
	STBP_CHANGING_HULL: -701,
	STBP_OPERATING_MONEY: -702,
	STBP_WARPING_TO_SCHEAT: -703,
	STBP_CHANGING_BODYPART: -704,
	STBP_DESTROYING_BODYPART: -705,

	// buyBodyPart
	BBP_NO_DEALS: 801,
	BBP_PRICE_TOO_HIGH: 802,
	BBP_HULL_IS_LOW_LEVEL: 803,
	BBP_WARPING_TO_SCHEAT: -801,
	BBP_OPERATING_MONEY: -802,
	BBP_WARPING_TO_DESTINATION: -803,
	BBP_BUYING_BODY_PART: -804,
	BBP_SELLING_MINERALS: -805,

	// upgradeBodyPart
	UBP_FINISHED: 801,
	UBP_BUYING_BODYPART: -801,
	UBP_SWITCHING_BODYPART: -802,

	// upgradeBodyPartList
	UBPL_NOT_ENOUGH_SCORE: 901,
	UBPL_NOT_DONE_CHANGING_LIST: 902,
	UBPL_LIST_ALL_CHANGED: 903,
	UBPL_LIST_CHANGING_PART: -901,

	// grabMineralsInSystem
	GMIS_NO_MINERALS: 1001,
	GMIS_LOCATION_NOT_SYSTEM: 1002,
	GMIS_GRABBING_MINERAL: -1001,

	// captureAsteroid
	CA_INTERCEPTION_IMPOSSIBLE: 1101,
	CA_REPAIRING_WITH_DRONE: -1101,
	CA_INTERCEPTING_ASTEROID: -1102,
	CA_ACKNOWLEDGING_SYSTEM: -1103,

	// sellMineralsToFederation
	SMTF_NO_DEALS: 1201,
	SMTF_SELLING_MINERALS: -1201,

	// clearPlanetBalance
	CPB_BALANCE_CLEARED: 1301,
	CPB_FLYING_TO_PLANET: -1301,
	CPB_EXECUTING_DEALS: -1302,

	// refuelAtNearbyLandable
	RANL_TANK_IS_FULL: 1401,
	RANL_NO_INHABITED_LANDABLES: 1402,
	RANL_REFUELING: -1401,

	// transferAllMineralsToPlanet
	TAMTP_NO_MINERALS: 1501,
	TAMTP_TRANSFERRING_MINERALS: -1501,
	TAMTP_FLYING_TO_PLANET: -1502,

	// parkAtSpecifiedLandable
	PASL_AT_THE_LANDABLE: 1601,
	PASL_CANT_FIND_LANDABLE: 1602,
	PASL_ESCAPING: -1601,
	PASL_FLYING_TO_LANDABLE: -1602,

	// pathFind
	PF_TOO_CLOSE_TO_SUN: -1701,
	PF_TOO_FAR_FROM_SUN: -1702,

	// acknowledgeSystem
	AS_KNOWN: 1801,
	AS_ACKNOWLEDGING: -1801,

	// profileTime
	PT_SHIP_IS_DEAD: -1901,
};
