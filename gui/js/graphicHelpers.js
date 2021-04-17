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

	generateShipRole: function(role) {
		return `<img class="shipIcon" src="img/roles/role${role ? role : "Unknown"}.png">`;
	},

	generateShipLabel: function(active, parked) {
		parked = parked == undefined ? true : parked;  // Default: true
		active = active == undefined ? false : active; // Default: false
		var label = "Off";
		let state = (active) + (!parked)*2; // aka Bit operations...
		// 0 = !active, parked
		// 1 = active, parked
		switch(state) {
			case SHIPSTATE_OFF:
				label = "Off";
				break;
			case SHIPSTATE_WAIT:
				label = "Wait"; //"Wait";
				break;
			case SHIPSTATE_PARK:
				label = "Park";
				break;
			case SHIPSTATE_ON:
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
		var labelImg = this.generateShipLabel(shipStruct.active, shipStruct.parked);
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

	extendLine: function(line, length) {
		var p1 = line.p1;
		var p2 = line.p2;
		lenAB = Math.sqrt(Math.pow(p1.x - p2.x, 2.0) + Math.pow(p1.y - p2.y, 2.0));
		var extendedEnd = {	x: p2.x + (p2.x - p1.x) / lenAB * length, 
							y: p2.y + (p2.y - p1.y) / lenAB * length};
		return {p1: p1, p2: extendedEnd};
	},
}