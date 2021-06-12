const crypto = require('crypto');
const fs = require("fs");
const path = require("path");
const delay = require("delay");

const {ipcMain, webContents} = require("electron");
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
	functioningObjects: [],
	attackerTargets: {},
	radarMemory: [],
	cycleDelta: undefined,
	selectedShip: undefined,
	connectedObjects: {},
	profileInfo: {},
	moduleHashes: {},
	planetRequests: {},
};

global.requireModule = function(filepath) {
	let fullpath = path.join(__dirname, filepath);
	let resolve = require.resolve(fullpath);
	const fileBuffer = fs.readFileSync(fullpath);
	const hashSum = crypto.createHash('sha256');
	hashSum.update(fileBuffer);
	const hex = hashSum.digest('hex');

	var requiredFile;
	if(multiLoop.moduleHashes[fullpath] != hex) {
		if(require.cache[resolve]) delete require.cache[resolve];
		multiLoop.moduleHashes[fullpath] = hex;
		console.log("Updated file " + fullpath + "!");
		console.log(hex);
	}
	return require(fullpath);
}



const logger = requireModule("./libs/logger.js");
var sdk = requireModule("./libs/enhancer.js");
const mafs = requireModule("./libs/mafs.js");
const config = requireModule("./libs/config.js");
var dbManager = sdk.dbManager;

ipcMain.on("objectActivity", (event, arg) => {
	var index = multiLoop.activeObjects.findIndex(item => item.ID == arg.ID);
	if(index == -1) multiLoop.activeObjects.push(arg);
	else multiLoop.activeObjects[index].active = arg.active;
});

ipcMain.on("newSelectedShip", (event, arg) => {
	multiLoop.selectedShip = arg;
});

const actionDelay = 200;
var loop = async function(account, ships, planets) {
	await account.safeAssemble();

	console.log(Object.keys(multiLoop.connectedObjects));
	
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
				let connectedObject = multiLoop.connectedObjects[ship.uuid];
				if(connectedObject) {
					connectedObject.dispose();
					delete multiLoop.connectedObjects[ship.uuid];
				}
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

global.isGUILaunched = function() {
	return !!web;
}

global.sendInfo = function(event, arg) {
	if(isGUILaunched()) {
		web.send(event, arg);
	}
}

let standaloneLoop = async function(instance, account) {
	while(true) {
		try {
			const {uuid, quadrant} = instance;
			let objectInstance = multiLoop.connectedObjects[uuid];
			if(objectInstance) {
				//objectInstance.log("warn", "standalone loop of instance " + instance.uuid);
			}
			let objObj = multiLoop.activeObjects.find(entry => entry.ID == instance.uuid);
			// If we have entry, leave as is, otherwise get default value based on GUI presense.
			let active = (objObj && objObj.hasOwnProperty("active")) ? objObj.active : (isGUILaunched() ? false : true);
			let parked = (objObj && objObj.hasOwnProperty("parked")) ? objObj.parked : (isGUILaunched() ? true : false);
			let options = {active: active};

			if(active || !parked) {
				sdk = requireModule("./libs/enhancer.js");
				
				if(!objectInstance) {
					switch(instance.type) {
						case "Ship":
							objectInstance = await account.getShip(uuid, quadrant);
							break;
						case "Planet":
							objectInstance = await account.getPlanet(uuid, quadrant);
							break;
					}
					multiLoop.connectedObjects[uuid] = objectInstance;
				}
				loggerShip.addContext("Ship", uuid);

				try {
					switch(instance.type) {
						case "Ship":
							await objectInstance.execRole(account, options);
							break;
						case "Planet":
							await objectInstance.gatherInfo(account);
							break;
					}
				} catch(e) {
					objectInstance.log("error", "Unhandled exception occured while executing role: " + e.message);
					console.error(e);
				};

				await delay(ACTION_DELAY);
			} else {
				let connectedObject = multiLoop.connectedObjects[instance.uuid];
				if(connectedObject) {
					await connectedObject.dispose();
					delete multiLoop.connectedObjects[instance.uuid];
				}

				let struct = {	type: instance.type,
								ID: instance.uuid};

				if(instance.type == "Ship") {
					let shipMemory = await sdk.dbManager.getMemory(instance);
					struct.role = shipMemory.role;
					struct.memory = shipMemory;
				}

				sendInfo("objectInfo", struct);

				await delay(5000);
			}
		} catch(e) {
			loggerConsole.error("Error in standalone loop...");
			console.error(e);
		}
	}
}

var start = async function() {
	loggerConsole.trace("Starting system, logging in the account.");
	var account = await sdk.Account.connect();
	await account.signin(config.accountUsername, config.accountPassword);
	loggerConsole.trace("Login successful!");
	await delay(actionDelay);

	await dbManager.initDb();
	while(true) {
		try {
			await account.safeAssemble();
			multiLoop.profileInfo = await account.profile();
			await delay(ACTION_DELAY);

			let objects = await account.objects(9999); // all objects ever
			
			sendInfo("allObjects", objects); // all objects info for graphics module

			var ships = objects.filter((instance) => instance.type === 'Ship');
			await dbManager.cleanDeadEntries(ships);

			for(let object of objects) {
				if(!multiLoop.functioningObjects.includes(object.uuid)) {
					multiLoop.functioningObjects.push(object.uuid);
					standaloneLoop(object, account);
				}
			}

			await delay(5000);
		} catch(e) {
			loggerConsole.error("Error in while, but I think it'll just restart itself.");
			console.error(e);
		}
	}

	account.dispose();
}


logger.setupLogger();
start();
