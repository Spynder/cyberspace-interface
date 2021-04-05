const logger = require("./libs/logger");
var sdk = require("./libs/enhancer");
const delay = require("delay");
const mafs = require("./libs/mafs");
const config = require("./libs/config.js");
const {ipcMain} = require("electron");
var dbManager = sdk.dbManager;

/* 	Log levels
*	* Trace
*	* Debug
*	* Info
*	* Warn
*	* Error
*	* Fatal
*/

global.multiLoop = {flyingFor: {}, localMemory: {}, deals: {}, noDealsFlying: {}};

const actionDelay = 300;
var loop = async function(account, ships) {
	await account.safeAssemble();
	
	for(var ship of ships) {
		await shipLoop(account, ship);
	}

	await dbManager.cleanDeadEntries(ships);
	loggerConsole.debug("Done the cycle, repeating.");
}

var shipLoop = async function(account, instance) {
	const {uuid, quadrant} = instance;
	sdk = require("./libs/enhancer");
	const ship = await account.getShip(uuid, quadrant);
	await delay(actionDelay);
	await ship.selfScan();
	loggerShip.addContext("Ship", ship.uuid);
	console.log("\n\n\n");

	delete require.cache[require.resolve("./libs/enhancer")];

	await ship.execRole(account).catch((e) => {
		loggerShip.error("Unhandled exception occured while executing ship role: " + e.message);
		console.error(e);
	});

	await ship.dispose();
	
}

var start = async function() {
	loggerConsole.trace("Starting system, logging in the account.");
	console.log(sdk.Account);
	var account = await sdk.Account.connect();

	await account.signin(config.accountUsername, config.accountPassword);
	loggerConsole.trace("Login successful!");
	await delay(actionDelay);
	//global.quadrant = await sdk.Sector.connect(sdk.Quadrants.FEDERATION);
	//await delay(actionDelay);

	await dbManager.initDb();
	while(true) {
		try {
			var objects = await account.objects(9999); // all objects ever

			var mappedIDs = objects;/*.map();*/ // something


			var ships = objects.filter((instance) => instance.type === 'Ship');
			await delay(actionDelay);
			await loop(account, ships).catch((e) => {
				console.error(e);
				loggerConsole.error("Error while looping, but it's okay! We're just restarting.");
			});
			console.log("Outside catch");
		} catch(e) {
			loggerConsole.error("Error in while, but I think it'll just restart itself.");
			console.error(e);
		}
	}

	account.dispose();
}


logger.setupLogger();
start();
