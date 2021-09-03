module.exports = {
	getMousePos: function(canvas, event, translation, scaling) {
		var rect = canvas.getBoundingClientRect();
		if(!translation) translation = {x: 0, y: 0};
		if(!scaling) scaling = 1;

		return {
			x: (event.clientX - rect.left - translation.x) * (1/scaling),
			y: (event.clientY - rect.top - translation.y) * (1/scaling)
		};
	},

	getObjectState: function(item) {
		let parked = item.parked ?? true;
		let active = item.active ?? false;
		let state = (active) + (!parked)*2; // aka Bit operations...
		return state;
	},

	generateShipFuel: function(fuel, fuelMax) {
		var fuelStat = STAT_GOOD;
		var finText = `${fuel}/${fuelMax}`;
		if(fuel == undefined || fuelMax == undefined) {
			fuelStat = STAT_UNKNOWN;
			finText = "?";
		} else if(fuel == 0) {
			fuelStat = STAT_CRITICAL;
		} else if(fuel/fuelMax <= 0.4) {
			fuelStat = STAT_WARNING;
		}

		return `<p class="fuelText">Fuel: <span class="${fuelStat}">${finText}</span></p>`;
	},

	generateShipBalance: function(balance) {
		var balanceStat = STAT_GOOD;
		if(balance == undefined) {
			balanceStat = STAT_UNKNOWN;
			balance = "?";
		} else if(balance >= BALANCE_CRITICAL) {
			balanceStat = STAT_CRITICAL;
		} else if(balance >= BALANCE_WARNING) {
			balanceStat = STAT_WARNING;
		}

		return `<p class="balanceText">Balance: <span class="${balanceStat}">${balance}</span></p>`;
	},

	generateShipSystem: function(system) {
		var systemStat = STAT_GOOD;
		if(system == undefined) {
			systemStat = STAT_UNKNOWN;
			system = "?";
		} else if(HIGH_SEC_SYSTEMS.indexOf(system) == -1) {
			systemStat = STAT_WARNING;
		}

		return `<p class="systemText">System: <span class="${systemStat}">${system}</span></p>`;
	},

	generateShipRole: function(objectStruct) {
		let roleName = undefined;
		if(objectStruct)
			roleName = (objectStruct.type == "Ship") ? objectStruct.role : "Planet";
		return `<img class="objectIcon" src="img/roles/role${roleName ? roleName : "Unknown"}.png">`;
	},

	generateShipLabel: function(item) {
		let state = this.getObjectState(item);

		switch(state) {
			case SHIPSTATE.OFF:
				label = "Off";
				break;
			case SHIPSTATE.WAIT:
				label = "Wait";
				break;
			case SHIPSTATE.PARK:
				label = "Park";
				break;
			case SHIPSTATE.ON:
				label = "On";
				break;
		}	

		return `<img class="label" src="img/labels/Label${label}.png">`;	
	},
	
	generatePlanetCtzn: function(objectStruct) {
		let text = `<span class="${STAT_UNKNOWN}">?</span>`;
		if(objectStruct.hasOwnProperty("body")) {
			let ctzn = objectStruct.body.ctzn;
			let size = objectStruct.body.size;
			text = `<span class="${STAT_GOOD}">${ctzn} / ${size}</span>`;
		}
		return `<p class="citizenText">Citizens: ${text}</p>`;
	},

	generatePlanetHtml: function(planetStruct) {
		let roleImg = this.generateShipRole("Planet");
		let ctznText = this.generatePlanetCtzn(planetStruct.body.ctzn, planetStruct.body.size);
		let redactedID = (planetStruct.ID).replace(/ /g, "_");
		return `<div class="ship" shipID=${redactedID}>
					<div class="iconBlock">
						<span class="helper"></span>
						${roleImg}
					</div>
					<div class="shipInfo">
						<h2>${planetStruct.ID.toUpperCase()}</h2>
						${ctznText}
					</div>
					<div class="indicators">
						
						<button class="shipActivity ${planetStruct.active ? SWITCH_ON : SWITCH_OFF}"></button>
					</div>
				</div>`;
	},

	generatePlanetMinerals: function(objectStruct) {
		let text = `<span class="${STAT_UNKNOWN}">?</span>`;
		if(objectStruct.hasOwnProperty("body")) {
			let minerals = objectStruct.nodes.find(cargo => cargo.body.type == "MINERALS");
			text = `<span class="${STAT_GOOD}">${minerals ? minerals.body.size : 0}</span>`;
		}
		
		return `<p class="systemText">Minerals: <span class="${STAT_GOOD}">${text}</span></p>`;
	},

	generatePlanetBalance: function(objectStruct) {
		let text = `<span class="${STAT_UNKNOWN}">?</span>`;
		if(objectStruct.hasOwnProperty("body")) {
			text = `<span class="${STAT_GOOD}">${objectStruct.body.balance}</span>`;
		}
		return `<p class="citizenText">Balance: ${text}</p>`;
	},

	generateObjectInfo: function(objectStruct) {
		let rows = [];
		if(objectStruct.type == "Ship") {
			rows.push(this.generateShipFuel(objectStruct.fuel, objectStruct.fuelMax));
			rows.push(this.generateShipBalance(objectStruct.balance));
			rows.push(this.generateShipSystem(objectStruct.system)); // todo change
		} else if(objectStruct.type == "Planet") {
			rows.push(this.generatePlanetCtzn(objectStruct));
			rows.push(this.generatePlanetBalance(objectStruct));
			rows.push(this.generatePlanetMinerals(objectStruct));
		}

		return `<div class="objectInfo">
					<h2>${objectStruct.ID.toUpperCase()}</h2>
					${rows[0]}
					${rows[1]}
					${rows[2]}
				</div>`;
	},

	generateObjectHtml: function(objectStruct) {
		let roleImg = this.generateShipRole(objectStruct);
		var labelImg = this.generateShipLabel(objectStruct);
		let objectInfo = this.generateObjectInfo(objectStruct);
		let redactedID = (objectStruct.ID).replace(/ /g, "_");
		return `<div class="object" objID=${redactedID}>
					<div class="iconBlock">
						<span class="helper"></span>
						${roleImg}
					</div>
					${objectInfo}
					<div class="indicators">
						${(objectStruct.type == "Ship") ? labelImg : ""}
						<button class="objectActivity ${objectStruct.active ? SWITCH_ON : SWITCH_OFF}"></button>
					</div>
				</div>`;
	},


	isInside: function(pos, rect){
	    return 	pos.x > rect.x  				&&
				pos.x < rect.x + rect.width 	&&
				pos.y < rect.y + rect.height 	&&
				pos.y > rect.y;
	},

	getSystemIconHitbox: function(system, w, h) {
		return {x: (system.x + (w * SYSTEM_OFFSET.xp)) * SYSTEM_DISTANCE_MULTIPLIER,
				y: (system.y + (h * SYSTEM_OFFSET.yp)) * SYSTEM_DISTANCE_MULTIPLIER,
				width: SYSTEM_RADIUS*2,
				height: SYSTEM_RADIUS*2};
	},

	getPlanetHitbox: function(planet) {
		var planetRadius = planet.radius ? planet.radius : SYSTEM_PLANET_RADIUS;
		return {x: planet.body.vector.x - planetRadius,
				y: planet.body.vector.y - planetRadius,
				width: planetRadius * 2,
				height: planetRadius * 2};
	},

	getCargoHitbox: function(cargo) {
		return {x: cargo.body.vector.x - SYSTEM_CARGO_RADIUS,
				y: cargo.body.vector.y - SYSTEM_CARGO_RADIUS,
				width: SYSTEM_CARGO_RADIUS * 2,
				height: SYSTEM_CARGO_RADIUS * 2};
	},

	getAsteroidHitbox: function(asteroid) {
		return {x: asteroid.body.vector.x - SYSTEM_ASTEROID_RADIUS,
				y: asteroid.body.vector.y - SYSTEM_ASTEROID_RADIUS,
				width: SYSTEM_ASTEROID_RADIUS * 2,
				height: SYSTEM_ASTEROID_RADIUS * 2};
	},

	getShipHitbox: function(ship) {
		return {x: ship.body.vector.x - SYSTEM_SHIP_SIZE,
				y: ship.body.vector.y - SYSTEM_SHIP_SIZE,
				width: SYSTEM_SHIP_SIZE * 2,
				height: SYSTEM_SHIP_SIZE * 2};
	},

	getStationHitbox: function(station) {
		return {x: station.body.vector.x - SYSTEM_STATION_RADIUS,
				y: station.body.vector.y - SYSTEM_STATION_RADIUS,
				width: SYSTEM_STATION_RADIUS * 2,
				height: SYSTEM_STATION_RADIUS * 2};
	},

	getObjectHitbox: function(pos, radius) {
		return {x: pos.x - radius,
				y: pos.y - radius,
				width: radius * 2,
				height: radius * 2};
	},

	getSystemIconCircle: function(system, w, h) {
		return {x: (system.x + (w * SYSTEM_OFFSET.xp)) * SYSTEM_DISTANCE_MULTIPLIER + SYSTEM_RADIUS,
				y: (system.y + (h * SYSTEM_OFFSET.yp)) * SYSTEM_DISTANCE_MULTIPLIER + SYSTEM_RADIUS};
	},

	getPlanetsFromData: function(radarData) {
		return radarData.nodes.filter(item => item.type == "Planet");
	},

	getCargoFromData: function(radarData) {
		return radarData.nodes.filter(item => item.type == "Cargo");
	},

	getShipsFromData: function(radarData) {
		return radarData.nodes.filter(item => item.type == "Ship");
	},

	getAsteroidsFromData: function(radarData) {
		return radarData.nodes.filter(item => item.type == "Asteroid");
	},

	getStationsFromData: function(radarData) {
		return radarData.nodes.filter(item => item.type == "ScientificStation" || item.type == "BusinessStation");
	},

	getTypedObjectsFromData: function(radarData, type) {
		if(type == "Station") 	return radarData.nodes.filter(item => item.type == "ScientificStation" || item.type == "BusinessStation");
		else 					return radarData.nodes.filter(item => item.type == type);
	},

	getPlanetOrbitRadius: function(planet) {
		return Math.hypot(planet.body.vector.x, planet.body.vector.y);
	},

	getPlanetAngleOnOrbit: function(x, y) {
		return (Math.atan2(y, x));
	},

	getPointOnCircle: function(dx, dy, rad, angle) {
		return {x: dx + rad * Math.sin(angle),
				y: dy + rad * Math.cos(angle)};
	},
}