var mafs = require("../libs/mafs");
const delay = require("delay");

module.exports = {
	run: async function(planet, account, sdk) {
		await delay(ACTION_DELAY);
		let planetDetails = await planet.explore().catch(async function() {
			planet.log("error", "Error with planet at explore: " + e.message);
			console.error(e);
			if(e.message == "ACCESS_DENIED") {
				planet.log("error", "Emergency shutdown of planet!");
				await disconnectObject(planet.uuid);
			}
		});

		let activePlanet = "Thides G1";

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

				if(cargo.length == 1) {
					//await planet.make("PROTECTOR", 5);
				}
			}

			if(planetDetails.body.deals && (planetDetails.body.deals.length < 1)) {
				await sdk.createPlanetRequest(activePlanet, {request: "buy", type: "MINERALS", cost: 900000});
				//await sdk.createPlanetRequest(activePlanet, {request: "close", uuid: planetDetails.body.deals[0].uuid})
				//await sdk.createPlanetRequest("Tilia", {request: "sell", item: "minerals"});
				//await sdk.createPlanetRequest("Tilia", {request: "buy", type: "MINERALS", count: 500});
				//await sdk.createPlanetRequest("Tilia", {request: "sell", item: "575139781b"});
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
					/*let item = request.item;
					let type = request.type;
					let cost = request.cost ?? 1;
					let count = request.count ?? 1;
					let gen = request.gen;
					let uuid = request.uuid;*/
					let {item, type, cost, count, gen, uuid} = request;
					cost ??= 1;
					count ??= 1;
					let minerals = planetDetails.nodes.find(node => node.body.type == "MINERALS");
					switch(request.request) {

						case "sell":
							// Sell = {request: "sell", item: ("minerals"/uuid), cost: Number??1}
							if(!item) {
								planet.log("error", "No \"item\" param! Destroying request.");
								planet.finishTopRequest();
								break;
							}
							if(!planetDetails.nodes.find(node => node.uuid == item) && item.toLowerCase() !== "minerals") {
								planet.log("error", "Cargo doesn't exist! Destroying request.");
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

							await planet.sell(item, cost)
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
							// Close = {request: "close", uuid: dealUuid}
							if(!uuid) {
								planet.log("error", "No \"uuid\" param! Destroying request.");
								planet.finishTopRequest();
								break;
							}

							try {
								await planet.close(uuid);
							} catch(e) {
								planet.log("error", "Error occured while closing deal on planet: " + e.message);
							}
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