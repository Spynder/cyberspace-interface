module.exports = {
	getMousePos: function(canvas, event) {
		var rect = canvas.getBoundingClientRect();
		return {
			x: event.clientX - rect.left,
			y: event.clientY - rect.top
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

	generateShipHtml: function(shipStruct) {
		var fuelText = this.generateShipFuel(shipStruct.fuel, shipStruct.fuelMax);
		var balanceText = this.generateShipBalance(shipStruct.balance);
		var systemText = this.generateShipSystem(shipStruct.system);
		var label = "Off";
		switch(shipStruct.state) {
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
		return `<div class="ship" shipID=${shipStruct.ID}>
					<div class="iconBlock">
						<span class="helper"></span>
						<img class="shipIcon" src="img/ship.png">
					</div>
					<div class="shipInfo">
						<h2>${shipStruct.ID.toUpperCase()}</h2>
						${fuelText}
						${balanceText}
						${systemText}
					</div>
					<div class="indicators">
						<img class="indicator" src="img/Label${label}.png">
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
		return {x: system.x + (w * SYSTEM_OFFSET.xp),
				y: system.y + (h * SYSTEM_OFFSET.yp),
				width: SYSTEM_RADIUS*2,
				height: SYSTEM_RADIUS*2};
	},

	getSystemIconCircle: function(system, w, h) {
		return {x: system.x + SYSTEM_RADIUS + (w * SYSTEM_OFFSET.xp),
				y: system.y + SYSTEM_RADIUS + (h * SYSTEM_OFFSET.yp)};
	}
}