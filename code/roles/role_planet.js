var mafs = require("../libs/mafs");

module.exports = {
	run: async function(planet, account, sdk) {
		var planetDetails = await planet.explore().catch(e => {
			console.log("Error with planet at explore: " + e.message);
			console.error(e);
		});
		console.log(planetDetails);
		console.log(planetDetails.nodes);

		sendInfo("planetInfo", planetDetails);
	}
}