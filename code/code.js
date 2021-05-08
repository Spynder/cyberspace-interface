const logger = require("./libs/logger");
var sdk = require("./libs/enhancer");
const delay = require("delay");
const mafs = require("./libs/mafs");
const config = require("./libs/config.js");
const {ipcMain, webContents} = require("electron");
var dbManager = sdk.dbManager;

var web;
if(webContents) web = webContents.getAllWebContents()[0];

/* 	Log levels
*	* Trace
*	* Debug
*	* Info
*	* Warn
*	* Error
*	* Fatal
*/

global.multiLoop = {
	flyingFor: {}, 
	localMemory: {}, 
	deals: {}, 
	noDealsFlying: {}, 
	activeObjects: [], 
	attackerTargets: {},
	radarMemory: [],
	cycleDelta: undefined,
};

ipcMain.on("objectActivity", (event, arg) => {
	//console.log(arg);
	var index = multiLoop.activeObjects.findIndex(item => item.ID == arg.ID);
	if(index == -1) multiLoop.activeObjects.push(arg);
	else multiLoop.activeObjects[index].active = arg.active;
})

const actionDelay = 200;
var loop = async function(account, ships, planets) {
	await account.safeAssemble();
	
	let start = new Date().getTime();
	for(var planet of planets) {
		let objObj = multiLoop.activeObjects.find(entry => entry.ID == planet.uuid);
		// If we have entry, leave as is, otherwise get default value based on GUI presense.
		let active = (objObj && objObj.hasOwnProperty("active")) ? objObj.active : (isGUILaunched() ? false : true);
		let parked = (objObj && objObj.hasOwnProperty("parked")) ? objObj.parked : (isGUILaunched() ? true : false);
		let options = {active: active}; 
		if(active || !parked) {
			await planetLoop(account, planet);
		} else {
			var struct = {	type: "Planet",
							ID: planet.uuid};

			sendInfo("planetInfo", struct);
		}		
	}
	
	await dbManager.cleanDeadEntries(ships);
	
	let shipNumber = multiLoop.activeObjects.reduce(function(acc, val) {
		let active = val.active != undefined ? val.active : (isGUILaunched() ? false : true);
		let parked = val.parked != undefined ? val.parked : (isGUILaunched() ? true : false);
		return (active || !parked ? 1 : 0) + acc;
	}, 0);
	if(shipNumber > 0 || true) { // TODO: fix || true
		for(let ship of ships) {
			let objObj = multiLoop.activeObjects.find(entry => entry.ID == ship.uuid);
			// If we have entry, leave as is, otherwise get default value based on GUI presense.
			let active = (objObj && objObj.hasOwnProperty("active")) ? objObj.active : (isGUILaunched() ? false : true);
			let parked = (objObj && objObj.hasOwnProperty("parked")) ? objObj.parked : (isGUILaunched() ? true : false);
			let options = {active: active}; 
			if(active || !parked) {
				await shipLoop(account, ship, options);
			} else {
				let shipMemory = await sdk.dbManager.getMemory(ship);
				var struct = {	type: "Ship",
								ID: ship.uuid,
								role: shipMemory.role,
								memory: shipMemory};

				sendInfo("shipInfo", struct);
			}
		}
		if(shipNumber == 0) {
			loggerConsole.info("No ships activated!");
			await delay(5000);
		}
	} else {
		loggerConsole.info("No ships activated!");
		await delay(5000);
	}
	multiLoop.cycleDelta = (new Date().getTime()) - start;

	loggerConsole.debug("Done the cycle, repeating.");
}

var planetLoop = async function(account, instance) {
	const {uuid, quadrant} = instance;
	sdk = require("./libs/enhancer");
	const planet = await account.getPlanet(uuid, quadrant);

	delete require.cache[require.resolve("./libs/enhancer")];

	await planet.gatherInfo(account).catch((e) => {
		console.log("Unexpected error at planet gathering! - " + e.message);
		console.error(e);
	});

	await planet.dispose();
}

var shipLoop = async function(account, instance, options) {
	const {uuid, quadrant} = instance;
	sdk = require("./libs/enhancer");
	const ship = await account.getShip(uuid, quadrant);
	loggerShip.addContext("Ship", ship.uuid);
	console.log("\n\n\n");

	delete require.cache[require.resolve("./libs/enhancer")];

	await ship.execRole(account, options).catch((e) => {
		loggerShip.error("Unhandled exception occured while executing ship role: " + e.message);
		console.error(e);
	});

	await ship.dispose();
	
}

global.isGUILaunched = function() {
	return !!web;
}

global.sendInfo = function(event, arg) {
	if(isGUILaunched()) {
		web.send(event, arg);
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

	await dbManager.initDb();
	while(true) {
		try {
			var objects = await account.objects(9999); // all objects ever
			
			sendInfo("allObjects", objects);

			var ships = objects.filter((instance) => instance.type === 'Ship');
			var planets = objects.filter((instance) => instance.type === 'Planet');
			await delay(actionDelay);
			await loop(account, ships, planets).catch((e) => {
				console.error(e);
				loggerConsole.error("Error while looping, but it's okay! We're just restarting.");
			});
		} catch(e) {
			loggerConsole.error("Error in while, but I think it'll just restart itself.");
			console.error(e);
		}
	}

	account.dispose();
}


logger.setupLogger();
start();
