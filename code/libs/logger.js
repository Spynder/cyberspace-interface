var log4js = require("log4js");

module.exports = {
	setupLogger: function() {
		log4js.configure({
			appenders: {
				File: {
					type: "dateFile",
					filename: "./code/logs/Logger.log",
					layout: {type: "pattern", pattern: "[%d] [%p] %c - %m"},
				},
				Ship: {
					type: "file",
					filename: "./code/logs/Logger.log",
					layout: {type: "pattern", pattern: "[%d] [%p] %c(%X{Ship}) - %m"},
				},
				ShipConsole: {
					type: "stdout",
					layout: {type: "pattern", pattern: "%[[%d] [%p] %c(%X{Ship})%] - %m"},
				},
				DebugConsole: {
					type: "stdout"
				},
			},
			categories: {
				default: {
					appenders: ["File", "DebugConsole"], 
					level: "Trace"
				},
				Ship: {
					appenders: ["Ship", "ShipConsole"],
					level: "Trace"
				},
				DebugConsole: {
					appenders: ["File", "DebugConsole"],
					level: "Trace"
				},
				Logger: {
					appenders: ["File", "DebugConsole"],
					level: "Trace"
				},
				Database: {
					appenders: ["File", "DebugConsole"],
					level: "Trace"
				}
			}
		});

		global.loggerConsole = log4js.getLogger("Logger");
		global.loggerShip = log4js.getLogger("Ship");
		global.loggerDatabase = log4js.getLogger("Database");

		loggerConsole.trace("----------");
		loggerConsole.trace("START OF SESSION");
		loggerConsole.trace("----------");
	}
}

/*
* 	Log levels
*	* Trace
*	* Debug
*	* Info
*	* Warn
*	* Error
*	* Fatal
*/
