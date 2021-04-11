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

	generateShipLabel: function(state) {
		var label = "Off";
		switch(state) {
			case SHIPSTATE_OFF:
				label = "Off";
				break;
			case SHIPSTATE_WAIT:
				label = "Wait";
				break;
			case SHIPSTATE_ON:
				label = "On";
				break;
			case SHIPSTATE_PARK:
				label = "Park";
				break;
		}	

		return `<img class="indicator" src="img/labels/Label${label}.png">`;	
	},

	generateShipHtml: function(shipStruct) {
		var fuelText = this.generateShipFuel(shipStruct.fuel, shipStruct.fuelMax);
		var balanceText = this.generateShipBalance(shipStruct.balance);
		var systemText = this.generateShipSystem(shipStruct.system);
		var roleImg = this.generateShipRole(shipStruct.role);
		var labelImg = this.generateShipLabel(shipStruct.label);
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
	}
}