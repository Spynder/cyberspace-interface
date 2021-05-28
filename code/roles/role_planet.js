var mafs = require("../libs/mafs");

module.exports = {
	run: async function(planet, account, sdk) {
		console.log("Planet " + planet.uuid + ": Scanning.");
		var planetDetails = await planet.explore().catch(e => {
			console.log("Error with planet at explore: " + e.message);
			console.error(e);
		});
		//console.log(planetDetails);
		//console.log(planetDetails.nodes);

		try {
			await planet.make("HULL", 9);
		} catch(e) {
			console.error(e);
		}

		planetDetails.ID = planet.uuid;
		planetDetails.type = "Planet";

		sendInfo("planetInfo", planetDetails);
	}
}