const logger = require("./libs/logger");
var sdk = require("./libs/enhancer");
const delay = require("delay");
const mafs = require("./libs/mafs");
const config = require("./libs/config.js");

global.multiLoop = {
	flyingFor: {}, 
	localMemory: {}, 
	deals: {}, 
	noDealsFlying: {}, 
	activeObjects: [], 
	attackerTargets: {},
	radarMemory: [],
	cycleDelta: undefined,
	connectedObjects: {},
};


const actionDelay = 200;

global.sendInfo = function(event, arg) {}

let coordinates = 1000;

var loop = async function(account, ship) {
	const {uuid, quadrant} = ship;
	let shipInstance;
	try {
		shipInstance = await account.getShip(uuid, quadrant);
	} catch(e) {
		loggerConsole.error("Error with... getShip()?");
		console.error(e);
	}

	while(true) {
		try {
			await shipInstance.selfScan();
			//await shipInstance.safeMove(coordinates, coordinates);
			await shipInstance.parkAtNearbyLandable();
			/*await shipInstance.safeEscape();
			await shipInstance.safeMove(coordinates, coordinates);
			await shipInstance.safeAttack("1234567890", [1]);
			await shipInstance.safeFuel();
			await shipInstance.safeRepair();*/
			coordinates += 10;
		} catch(e) {
			loggerConsole.error("Error with while!");
			console.error(e);
			await delay(200);
		}
	}
}


var start = async function() {
	loggerConsole.trace("Starting system, logging in the account.");
	var account = await sdk.Account.connect();
	await account.signin(config.accountUsername, config.accountPassword);
	loggerConsole.trace("Login successful!");
	await delay(actionDelay);
	//global.quadrant = await sdk.Sector.connect(sdk.Quadrants.FEDERATION);
	//await delay(actionDelay);

	//await dbManager.initDb();
	try {
		var objects = await account.objects(9999); // all objects ever

		var ship1 = objects.find((instance) => instance.type === 'Ship' && instance.uuid == "e82d9bd1ad");
		var ship2 = objects.find((instance) => instance.type === 'Ship' && instance.uuid == "dde4c6149a");
		var ship3 = objects.find((instance) => instance.type === 'Ship' && instance.uuid == "e62acb7fa0");
		var ship4 = objects.find((instance) => instance.type === 'Ship' && instance.uuid == "dd5a993f34");
		var ship5 = objects.find((instance) => instance.type === 'Ship' && instance.uuid == "49ad1c43d1");
		var ship6 = objects.find((instance) => instance.type === 'Ship' && instance.uuid == "50af023bad");
		var ship7 = objects.find((instance) => instance.type === 'Ship' && instance.uuid == "a18e46d3f3");
		var ship8 = objects.find((instance) => instance.type === 'Ship' && instance.uuid == "f020d79a06");
		await delay(actionDelay*5);
		
		loop(account, ship1);
		loop(account, ship2);
		loop(account, ship3);
		loop(account, ship4);
		loop(account, ship5);
		loop(account, ship6);
		loop(account, ship7);
		loop(account, ship8);
	} catch(e) {
		loggerConsole.error("Error in while, but I think it'll just restart itself.");
		console.error(e);
	}

	//account.dispose();
}


logger.setupLogger();
start();
