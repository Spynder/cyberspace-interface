var mafs = require("../libs/mafs");
const delay = require("delay");

module.exports = {
	run: async function(planet, account, sdk) {
		await delay(ACTION_DELAY);
		let planetDetails = await planet.explore().catch(e => {
			planet.log("error", "Error with planet at explore: " + e.message);
			console.error(e);
			if(e.message == "ACCESS_DENIED") {
				planet.log("error", "Emergency shutdown of planet!");
				delete multiLoop.connectedObjects[planet.uuid];
				planet.dispose().catch(e => {
					planet.log("error", "Error with planet at dispose?: " + e.message);
					console.error(e);
				});
			}
		});

		let activePlanet = "Poaruta";

		if(activePlanet == "" || planet.uuid == activePlanet) {
			let clearTrades = false;

			if(clearTrades) {
				let trades = planetDetails.body.deals;
				if(trades.length > 0) {
					await planet.close(trades[0].uuid);
				}
			}

			if(planetDetails.nodes) {
				let cargo = planetDetails.nodes.filter(node => node.type == "Cargo" && node.body.type != "MINERALS");
				//console.log(cargo);

				if(cargo.length == 0) {
					//await planet.make("HULL", 3);
				}
			}


		}

		let requests = sdk.getPlanetRequests(planet.uuid);
		//planet.log("info", "Requests: " + requests);

		// Parsing requests
		if(requests.length > 0) {
			let request = requests[0];
			if(request.hasOwnProperty("request")) {
				request.request = request.request.toLowerCase();
				try {
					planet.log("info", "Executing planet request \"" + request.request + "\"!");
					let item = request.item;
					let type = request.type;
					let cost = request.cost ?? 1;
					let count = request.count ?? 1;
					let gen = request.gen;
					let uuid = request.uuid;
					let minerals = planetDetails.nodes.find(node => node.body.type == "MINERALS");
					switch(request.request) {

						case "sell":
							// Sell = {request: "sell", item: ("minerals"/uuid), cost: Number??1}
							if(!item) {
								planet.log("error", "No \"item\" param! Destroying request.");
								planet.finishTopRequest();
								break;
							}
							if(item.toLowerCase() == "minerals") {
								if(!minerals) {
									planet.log("error", "No minerals on the planet, can't execute selling minerals request!");
									break;
								} else {
									item = minerals.uuid;
								}
							}

							await planet.sell(item, cost);
							planet.finishTopRequest();
							break;


						case "buy":
							// Buy = {request: "buy", type: "MINERALS"/other, cost: Number??1, count: Number??1}
							if(!type) {
								planet.log("error", "No \"type\" param! Destroying request.");
								planet.finishTopRequest();
								break;
							}
							type = type.toUpperCase();

							await planet.buy(type, cost, count);
							planet.finishTopRequest();
							break;


						case "close":
							// Close = {request: "close", uuid: planetUuid}
							if(!uuid) {
								planet.log("error", "No \"uuid\" param! Destroying request.");
								planet.finishTopRequest();
								break;
							}

							await planet.close(uuid);
							planet.finishTopRequest();
							break;


						case "make":
							// Make = {request: "make", type: type, gen: Number}
							if(!type) {
								planet.log("error", "No \"type\" param! Destroying request.");
								planet.finishTopRequest();
								break;
							}
							if(!gen) {
								planet.log("error", "No \"gen\" param! Destroying request.");
								planet.finishTopRequest();
								break;
							}
							type = type.toUpperCase();
							if(minerals.body.size < (2**(gen-1) * 100)) {
								planet.log("error", "Not enough minerals to create " + type + "! Destroying request.");
								planet.finishTopRequest()
								break;
							}

							await planet.make(type, gen);
							planet.finishTopRequest();
							break;
					}
				} catch(e) {
					planet.log("error", "Error while executing planet request \"" + request.request + "\": " + e.message);
				}
			}
		}

		//planet.log("info", planetDetails);

		planetDetails.ID = planet.uuid;
		planetDetails.type = "Planet";

		sendInfo("objectInfo", planetDetails);
	}
}