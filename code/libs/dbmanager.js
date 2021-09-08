const Database = require('better-sqlite3');

var db;

module.exports = {
	initDb: async function() {
		db = await new Database('./ships.db');
		if(!(await db.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name='ships'`).get())) {
			await db.prepare(`CREATE TABLE ships (uuid CHAR NOT NULL PRIMARY KEY, memory TEXT)`).run();
		}
		loggerDatabase.trace("Database has been initialized.");
	},

	getMemory: async function(ship) {
		function getFreeRoleID(all) { // replacing roleIDs if ship is dead
			let rolesInDB = all.map(item => JSON.parse(item.memory).roleID);
			let missingRole = -1;
			for (var i = 0; i < all.length; i++) {
				if(rolesInDB.indexOf(i) == -1) {
					missingRole = i;
					break;
				}
			}
			if(missingRole == -1) {
				missingRole = all.length;
			}
			return missingRole;
		}

		function getFreeDisplayID(all) { // always adding on top, even if dead
			let displaysInDB = all.map(item => JSON.parse(item.memory).displayID);
			/*let missingDisplay = -1;
			if(!displaysInDB.length) {
				missingDisplay = all.length;
			} else {
				missingDisplay = Math.max(...displaysInDB) + 1;
			}
			return missingDisplay;*/
			return Math.max(0, ...displaysInDB) + 1;
		}

		var entry = await db.prepare(`SELECT memory FROM ships WHERE "uuid" = ?`).get(ship.uuid);
		var allMemories = await db.prepare(`SELECT memory FROM ships`).all();
		var memory = {};
		if(entry) {
			memory = JSON.parse(entry.memory);
		} else {
			var rolesInDB = allMemories.map(item => JSON.parse(item.memory).roleID);
			var missingRole = -1;
			for (var i = 0; i < allMemories.length; i++) {
				if(rolesInDB.indexOf(i) == -1) {
					missingRole = i;
					break;
				}
			}
			if(missingRole == -1) {
				missingRole = allMemories.length;
			}
			memory.roleID = missingRole;
			await this.setMemory(ship, memory);
		}
		/*
		memory = entry ? JSON.parse(entry.memory) : {};
		memory.roleID ??= getFreeRoleID(allMemories);
		memory.displayID ??= getFreeDisplayID(allMemories);
		await this.setMemory(ship, memory);
		*/
		memory = Object.assign(memory, ROLES[Math.min(memory.roleID, ROLES.length-1)]);
		return memory;
	},

	setMemory: async function(ship, memory) {
		var redactedMemory = memory;
		delete redactedMemory.ownMemory;
		if(await db.prepare(`SELECT 1 FROM ships WHERE "uuid" = ?`).get(ship.uuid)) {
			await db.prepare(`UPDATE ships SET "memory" = ? WHERE "uuid" = ?`).run(JSON.stringify(redactedMemory), ship.uuid); // Entry was found and we updating one.
		} else {
			await db.prepare(`INSERT INTO ships ("uuid", "memory") VALUES (?, ?)`).run(ship.uuid, JSON.stringify(redactedMemory)); // Entry wasn't found and we creating one.
		}
		loggerDatabase.trace("DB memory updated for ship with uuid " + ship.uuid + ".");
		return redactedMemory;
	},

	cleanDeadEntries: async function(ships) {
		var rows = await db.prepare(`SELECT * FROM ships`).all();
		var count = 0;
		for(var row of rows) {
			if(!ships.find(ship => ship.uuid == row.uuid)) {
				count++;
				await db.prepare(`DELETE FROM ships WHERE "uuid" = ?`).run(row.uuid);
			}
		}
		loggerDatabase.trace("Dead entries (" + count + ") in DB has been cleaned.");
	}
}