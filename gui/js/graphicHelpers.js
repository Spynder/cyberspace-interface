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

	getShipState: function(item) {
		//console.log(item)
		let parked = item.parked == undefined ? true : item.parked;  // Default: true
		let active = item.active == undefined ? false : item.active; // Default: false
		let state = (active) + (!parked)*2; // aka Bit operations...
		//console.log(item.ID, state)
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
		let state = this.getShipState(item);
		//console.log(item.ID, this.getShipState(item));

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

	generateShipHtml: function(shipStruct) {
		var fuelText = this.generateShipFuel(shipStruct.fuel, shipStruct.fuelMax);
		var balanceText = this.generateShipBalance(shipStruct.balance);
		var systemText = this.generateShipSystem(shipStruct.system);
		var roleImg = this.generateShipRole(shipStruct.role);
		var labelImg = this.generateShipLabel(shipStruct);
		return `<div class="ship" shipID=${shipStruct.ID}>
					<div class="iconBlock">
						<span class="helper"></span>
						${roleImg}
					</div>
					<div class="shipInfo">
						<h2>${shipStruct.ID.toUpperCase()}</h2>
						${fuelText}
						${balanceText}
						${systemText}
					</div>
					<div class="indicators">
						${labelImg}
						<button class="shipActivity ${shipStruct.active ? SHIPACTIVITY_ONLINE : SHIPACTIVITY_OFFLINE}"></button>
					</div>
				</div>`;
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
		console.log(planetStruct)
		let ctznText = this.generatePlanetCtzn(planetStruct.body.ctzn, planetStruct.body.size);
		return `<div class="ship" shipID=${planetStruct.ID}>
					<div class="iconBlock">
						<span class="helper"></span>
						${roleImg}
					</div>
					<div class="shipInfo">
						<h2>${planetStruct.ID.toUpperCase()}</h2>
						${ctznText}
					</div>
					<div class="indicators">
						
						<button class="shipActivity ${planetStruct.active ? SHIPACTIVITY_ONLINE : SHIPACTIVITY_OFFLINE}"></button>
					</div>
				</div>`;
	},

	generatePlanetMinerals: function(objectStruct) {
		let text = `<span class="${STAT_UNKNOWN}">?</span>`;
		if(objectStruct.hasOwnProperty("body")) {
			text = `<span class="${STAT_GOOD}">${objectStruct.nodes.find(cargo => cargo.body.type == "MINERALS").body.size}</span>`;
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
		console.log(objectStruct)
		if(objectStruct.type == "Ship") {
			rows.push(this.generateShipFuel(objectStruct.fuel, objectStruct.fuelMax));
			rows.push(this.generateShipBalance(objectStruct.balance));
			rows.push(this.generateShipSystem(objectStruct.system));
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
		//console.log(objectStruct);
		let roleImg = this.generateShipRole(objectStruct);
		var labelImg = this.generateShipLabel(objectStruct);
		let objectInfo = this.generateObjectInfo(objectStruct);
		return `<div class="object" objID=${objectStruct.ID}>
					<div class="iconBlock">
						<span class="helper"></span>
						${roleImg}
					</div>
					${objectInfo}
					<div class="indicators">
						${(objectStruct.type == "Ship") ? labelImg : ""}
						<button class="objectActivity ${objectStruct.active ? SHIPACTIVITY_ONLINE : SHIPACTIVITY_OFFLINE}"></button>
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