$(document).ready(function() {
	var canvas = document.getElementById("startCanvas");
	var ctx = canvas.getContext("2d");
	var fps = 60;

	var SCREEN_START = "start";
	var SCREEN_CLUSTER = "cluster";
	var SCREEN_SYSTEM = "system";

	var STAT_GOOD = "good";
	var STAT_WARNING = "warning";
	var STAT_CRITICAL = "critical";
	var STAT_UNKNOWN = "unknown";

	var BALANCE_WARNING = 4000;
	var BALANCE_CRITICAL = 20000;
	var HIGH_SEC_SYSTEMS = ["Scheat", "Sadalbari", "Matar", "Salm", "Sadalpheris"];

	var SHIPS_ACTIVE = "Park all ships (Safe exit)";
	var SHIPS_UNACTIVE = "Activate all ships";

	var JSON_RENDER_OPTIONS = {
		collapsed: false,
		rootCollapsable: true,
		withQuotes: false,
		withLinks: true,
	};

	var currScreen = SCREEN_START;

	var width = canvas.width; // Width of the canvas
	var height = canvas.height; // Height of the canvas

	bgColor = "#222";
	textColor = "#EEE";
	textColorSecondary = "#BBB";
	startButtonColor = "#47ab50";
	startButtonStroke = "#444";

	var ships = [	{hullLevel: 1, ID: "a7fj3nfg", fuel: 3, fuelMax: 10, balance: 2432, system: "Scheat"},
					{hullLevel: 4, ID: "jf73jsxm", fuel: 5, fuelMax: 10, balance: 88544, system: "Pi-1 Pegasi"},
					{hullLevel: 1, ID: "a7fj3nfg", fuel: 3, /*fuelMax: 10,*/ balance: 2432, system: "Scheat"},
					{hullLevel: 4, ID: "jf73jsxm", fuel: 5, fuelMax: 10, balance: 88544, system: "Pi-1 Pegasi"},
					{hullLevel: 1, ID: "a7fj3nfg", fuel: 3, fuelMax: 10, balance: 2432, system: "Scheat"},
					{hullLevel: 4, ID: "jf73jsxm", fuel: 5, fuelMax: 10, balance: 88544, system: "Pi-1 Pegasi"},
					{hullLevel: 1, ID: "a7fj3nfg", fuel: 3, fuelMax: 10, balance: 2432, system: "Scheat"},
					{hullLevel: 4, ID: "jf73jsxm", fuel: 5, fuelMax: 10, balance: 88544, system: "Pi-1 Pegasi"},
					{hullLevel: 1, ID: "a7fj3nfg", fuel: 3, fuelMax: 10, balance: 2432, system: "Scheat"},
					{hullLevel: 4, ID: "jf73jsxm", fuel: 5, fuelMax: 10, balance: 88544, system: "Pi-1 Pegasi"}];

	//var shipsElements = [];
	var enabledShips = 0;

	function changeScreen(screen) {
		currScreen = screen;
		$("#container").children().css("display", "none");
		$("#" + currScreen).css("display", "block");
		canvas = document.getElementById(currScreen + "Canvas");
		ctx = canvas.getContext("2d");
		if(currScreen == SCREEN_CLUSTER) {
			generateShipList();
		}
		canvasResize();
		draw();
	}

	function generateShipFuel(fuel, fuelMax) {
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
	}

	function generateShipBalance(balance) {
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
	}

	function generateShipSystem(system) {
		var systemStat = STAT_GOOD;
		if(system == undefined) {
			systemStat = STAT_UNKNOWN;
			system = "?";
		} else if(HIGH_SEC_SYSTEMS.indexOf(system) == -1) {
			systemStat = STAT_WARNING;
		}

		return `<p class="systemText">System: <span class="${systemStat}">${system}</span></p>`;
	}

	function generateShipHtml(shipStruct) {
		var fuelText = generateShipFuel(shipStruct.fuel, shipStruct.fuelMax);
		var balanceText = generateShipBalance(shipStruct.balance);
		var systemText = generateShipSystem(shipStruct.system);
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
						<img class="indicator" src="img/icon.png">
						<button class="shipActivity">On</button>
					</div>
				</div>`;
	}

	function generateShipList() {
		$("#shipsContainer").empty();
		ships.forEach(function(ship) {
			var item = $(generateShipHtml(ship));
			$("#shipsContainer").append(item);
			item.click(function() { // TODO: bug - double click on one item, then click on item above. It doesn't click
				renderJson(ships.find(obj => obj.ID == item.attr("shipID")));
			});
			item.find(".indicators").find(".shipActivity").click(function(event) {
				event.stopPropagation();
			})
		});
	}

	function findShipItemByID(ID) {
		return $(`.shipInfo h2:contains(${ID})`).parent().parent();
	}

	function getRandomInt(min, max) {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min)) + min;
	}

	function updateShipItem(shipStruct, totalShips, activeShips) {
		var item = findShipItemByID(shipStruct).find(".shipInfo");

		item.find(".fuelText").replaceWith(generateShipFuel(getRandomInt(1, 10), 10));
		item.find(".balanceText");
		item.find(".systemText");
		updateShipText(totalShips, activeShips);
	}

	function updateShipText(totalShips, activeShips) {
		enabledShips = activeShips;
		$("#disableAll").text(activeShips == 0 ? SHIPS_UNACTIVE : SHIPS_ACTIVE);
		if(totalShips != ships.length) {
			generateShipList(); // TODO
		}
		$("#shipsText").text(`${totalShips} ships (${activeShips} total): `);

	}

	function canvasResize() {
		switch(currScreen) { // Choose width of the canvas depending on the screen (We need to clear space for other elements)
			case SCREEN_START:
				canvas.width = $(window).width() * 1.0;
				break;
			case SCREEN_CLUSTER:
				canvas.width = $(window).width() * 0.6;
				break;
			case SCREEN_SYSTEM:
				canvas.width = $(window).width() * 0.8;
				break;
		}
    	canvas.height = window.innerHeight;
		width = canvas.width;
		height = canvas.height;
	}

	$(window).resize(canvasResize); // When window is resized, always resize the canvas to it.

	function drawText(size, color, text, x, y, align) {
	    ctx.font = size + "px Blinker";
	    ctx.fillStyle = color;
	    if(align) {
	    	ctx.textAlign = align;
	    }
	    ctx.fillText(text, x, y);
	}

	function drawRectangle(x, y, w, h, color) {
		ctx.beginPath();
		ctx.rect(x, y, w, h);
		ctx.fillStyle = color;
		ctx.fill();
		ctx.closePath();
	}

	function draw() {
		ctx.clearRect(0, 0, width, height);
		switch(currScreen) {
			case SCREEN_START:
				drawStart();
				break;
			case SCREEN_CLUSTER:
				drawCluster();
				break;
			case SCREEN_SYSTEM:
				drawSystem();
				break;
		}
	}

	function drawStart() {
		drawRectangle(0, 0, width, height, bgColor);
		drawText(72, textColor, "CyberSpace", width/2, height*0.2, "center");
		drawText(36, textColorSecondary, "A GUI interface for manipulating the fleet.", width/2, height * 0.2 + 36 + 18, "center");
	}

	function drawCluster() {
		drawRectangle(0, 0, width, height, bgColor);
		drawText(72, textColor, "Xddddddddd", width/2, height*0.2, "center");
		//updateShipItem("jf73jsxm");
	}

	function drawSystem() {

	}

	$("#startButton").click(function() {
		changeScreen(SCREEN_CLUSTER);
		renderJson();
	});

	$("#fuckGoBack").click(function() {
		changeScreen(SCREEN_START);
	});



	$("#disableAll").click(function() {

	});

	function renderJson(json) {
		$('#jsonClusterRenderer').jsonViewer(json, JSON_RENDER_OPTIONS);
	}

	changeScreen(SCREEN_START);
	drawingInterval = setInterval(draw, 1000/fps);

	setInterval(function() {
		updateShipText(10, getRandomInt(0, 3));
	}, 500);
});