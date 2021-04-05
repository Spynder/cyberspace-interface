const {ipcRenderer} = require('electron');
require("./js/graphicsConstants");
var gh = require("./js/graphicHelpers");

$(document).ready(function() {
	var canvas = document.getElementById("startCanvas");
	var ctx = canvas.getContext("2d");

	var currScreen = SCREEN_START;

	var width = canvas.width; // Width of the canvas
	var height = canvas.height; // Height of the canvas

	var ships = [];

	var enabledShips = 0;

	// TODO: replace all $("x") to pointers

	var currSelectedSystem = "";

	function isMouseInsideSystemIcon(event) {
		var mousePos = gh.getMousePos(canvas, event);

		for(system of SYSTEMS) {
			if (gh.isInside(mousePos, gh.getSystemIconHitbox(system, width, height))) {
				return system;
				break;
			}
		}
		return false;
	}

	function updateGoInsideButton(system) {
		currSelectedSystem = system ? system : "";
		var noSystem = currSelectedSystem == "";
		var noInfo = getShipsInSystem(currSelectedSystem).length == 0;
		$("#goInside").prop("disabled", noSystem || noInfo);
		var text = GOINSIDE_OK;
		if(noSystem) {
			text = GOINSIDE_NULL;
		} else if(noInfo) { // If we're here, we are sure system is valid (not null) and don't need to check for that.
			text = GOINSIDE_INFO;
		}
		$("#goInside").text(text);
	}

	function checkSystemClicks(event) {
		var result = isMouseInsideSystemIcon(event);
		updateGoInsideButton(result.hasOwnProperty("name") ? result.name : "");
	}

	function changeScreen(screen) {
		currScreen = screen;
		$("#container").children().css("display", "none");
		$("#" + currScreen).css("display", "block");

		if(currScreen != SCREEN_CLUSTER) { // We do it before we override canvas
			canvas.removeEventListener("click", checkSystemClicks, false);
		}

		canvas = document.getElementById(currScreen + "Canvas");
		ctx = canvas.getContext("2d");
		if(currScreen == SCREEN_CLUSTER) {
			generateShipList();
			canvas.addEventListener('click', checkSystemClicks, false);
		}
		
		canvasResize();
		draw();
	}

	function generateShipList() {
		console.log(ships);
		if($("shipsContainer").children().length != ships.length) { // TODO: they might be different, but same value: [a, b] => [a] => [a, c]
			$("#shipsContainer").empty();
			ships.forEach(function(ship) {
				var item = $(gh.generateShipHtml(ship));
				$("#shipsContainer").append(item);
				var shipStruct = ships.find(obj => obj.ID == item.attr("shipID"));
				item.click(function() { // TODO: bug - double click on one item, then click on item above. It doesn't click
					renderJson(shipStruct);
				});
				var btn = item.find(".indicators").find(".shipActivity");
				btn.click(function(event) {
					event.stopPropagation();
					shipStruct = ships.find(obj => obj.ID == item.attr("shipID")); // TODO: Since then element might have been updated
					ships[ships.indexOf(shipStruct)].active = !shipStruct.active;
					//alert()
					updateShipItem(shipStruct.ID);
				})
			});
		}
	}

	function findShipItemByID(ID) {
		return $(`.ship[shipID = '${ID}']`);
	}

	function getShipStructByID(ID) {
		return ships[getShipIndexByID(ID)];
	}

	function getShipIndexByID(ID) {
		return ships.findIndex(ship => ship.ID == ID);
	}

	function getRandomInt(min, max) {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min)) + min;
	}

	function updateShipItem(shipID, ignoreShipTextUpdate) {
		var shipStruct = getShipStructByID(shipID);
		//console.log(shipStruct);
		var item = findShipItemByID(shipStruct.ID);
		item.find(".fuelText").replaceWith(gh.generateShipFuel(shipStruct.fuel, shipStruct.fuelMax));
		item.find(".balanceText").replaceWith(gh.generateShipBalance(shipStruct.balance));
		item.find(".systemText");

		var btn = item.find(".indicators").find(".shipActivity");
		btn.removeClass(shipStruct.active ? SHIPACTIVITY_OFFLINE : SHIPACTIVITY_ONLINE);
		btn.addClass(shipStruct.active ? SHIPACTIVITY_ONLINE : SHIPACTIVITY_OFFLINE);

		if(!ignoreShipTextUpdate) {
			updateShipText();
		}
	}

	ipcRenderer.on("shipItemUpdate", (event, arg) => {
		var id = "jf73jsxm";
		//ships[getShipIndexByID(id)] = {hullLevel: 4, ID: "jf73jsxm", fuel: 5, fuelMax: 10, balance: arg, system: "Pi-1 Pegasi", state: arg, active: false};
		//updateShipItem(id);
	});

	ipcRenderer.on("shipInfo", (event, arg) => {
		var id = arg.ID;
		var itemID = getShipIndexByID(id);
		if(itemID == -1) {
			ships.push(arg);
			generateShipList();
		} else {
			ships[itemID] = arg;
		}
		updateShipItem(id);
	});

	ipcRenderer.on("allShipIDs", (event, arg) => {
		console.log(arg);
		arg.forEach(function(shipID) {
			console.log(getShipIndexByID(shipID))
			if(getShipIndexByID(shipID) == -1) {
				ships.push({ID: shipID});	
			}
		})
		generateShipList();
	});

	function updateShipText() {
		enabledShips = ships.filter(item => item.active).length;
		//enabledShips = ships.filter(item => item.active).length;
		$("#disableAll").text(enabledShips == 0 ? SHIPS_UNACTIVE : SHIPS_ACTIVE);
		/*if($("shipsContainer").children().length != ships.length) {
			generateShipList(); // TODO
		}*/
		$("#shipsText").text(`${ships.length} ships (${enabledShips} active): `);

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

	function drawText(size, color, text, x, y, align, font) {
		if(font) {
			ctx.font = size + "px " + font;
		} else {
			ctx.font = size + "px Blinker";
		}
		ctx.fillStyle = color;
		if(align) {
			ctx.textAlign = align;
		}
		ctx.fillText(text, x, y);
	}

	function drawRectangle(x, y, w, h, color, stroke) {
		ctx.beginPath();
		ctx.rect(x, y, w, h);
		if(stroke) {
			ctx.strokeStyle = color;
			ctx.stroke();
		} else {
			ctx.fillStyle = color;
			ctx.fill();
		}
		ctx.closePath();
	}

	function drawSystemIcon(system) {
		ctx.beginPath();
		var coords = gh.getSystemIconCircle(system, width, height);
		ctx.arc(coords.x, coords.y, SYSTEM_RADIUS, 0, 2*Math.PI);
		ctx.fillStyle = COLOR_SYSTEM_FILL;
		ctx.strokeStyle = COLOR_SYSTEM_STROKE;
		ctx.lineWidth = 3;
		ctx.fill();
		ctx.stroke();
	}

	function getShipsInSystem(sys) {
		return ships.filter((ship) => ship.system == sys);
	}

	function drawSystemList() {
		var system = currSelectedSystem;
		var systemStruct = SYSTEMS.find((sys) => sys.name == system);
		var list = getShipsInSystem(system);

		if(list.length) {
			var listOffset = (TEXT_SIZE_SMALL + TEXT_LINE_MARGIN_SMALL) * list.length + SYSTEM_BOX_OFFSET;
			var coords = gh.getSystemIconCircle(systemStruct, width, height);
			var textFont = "Share Tech Mono";
			ctx.font = TEXT_SIZE_SMALL + "px " + textFont;
			var textWidth = ctx.measureText(list[0].ID).width;
			var listMargin = 8;

			var rx = coords.x - (textWidth/2) - listMargin;
			var ry = coords.y - listOffset - TEXT_SIZE_SMALL - listMargin;
			var rw = textWidth + listMargin*2;
			var rh = (TEXT_SIZE_SMALL + TEXT_LINE_MARGIN_SMALL) * list.length - TEXT_LINE_MARGIN_SMALL + listMargin*2;

			drawRectangle(rx, ry, rw, rh, COLOR_STROKE, true);
			drawRectangle(rx, ry, rw, rh, COLOR_BG_DARK);

			list.forEach(function(ship, i) {			
				var shipRelativePos = (TEXT_SIZE_SMALL + TEXT_LINE_MARGIN_SMALL) * i - TEXT_LINE_MARGIN_SMALL;
				drawText(TEXT_SIZE_SMALL, COLOR_TEXT_SECONDARY, ship.ID, coords.x, coords.y - listOffset + shipRelativePos, "center", textFont);
			});
		}
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
		drawRectangle(0, 0, width, height, COLOR_BG);
		drawText(TEXT_SIZE_BIG, COLOR_TEXT_MAIN, "CyberSpace", width/2, height*0.2, "center");
		drawText(TEXT_SIZE_MEDIUM, COLOR_TEXT_SECONDARY, "A GUI interface for manipulating the fleet.", width/2, height * 0.2 + TEXT_SIZE_MEDIUM + TEXT_LINE_MARGIN_MEDIUM, "center");
	}

	function drawCluster() {
		drawRectangle(0, 0, width, height, COLOR_BG);
		drawText(TEXT_SIZE_BIG, COLOR_TEXT_MAIN, "Cluster Pegasus", width/2, 72, "center");

		// Draw all planets

		SYSTEMS.forEach(function(system) {
			drawSystemIcon(system);
		});

		drawText(TEXT_SIZE_MEDIUM, COLOR_TEXT_SECONDARY, currSelectedSystem, width/2, 72*2, "center");
		drawSystemList();

	}

	function drawSystem() {

	}

	$("#startButton").click(function() {
		changeScreen(SCREEN_CLUSTER);
		renderJson();
	});

	$("#disableAll").click(function() {
		enabledShips = ships.filter(item => item.active).length;
		ships.forEach(function(ship, i) {
			ship.active = (enabledShips == 0);
			ships[i] = ship;
			console.log(i);
			updateShipItem(ship.ID, true);
		});
		updateShipText();
		/*ships = ships.map(function(item) {
			var changed = item;
			changed.active = enabledShips == 0;
			updateShipItem(changed.ID);
			return changed;
		}); // TODO*/
	});

	function renderJson(json) {
		$('#jsonClusterRenderer').jsonViewer(json, JSON_RENDER_OPTIONS);
	}

	changeScreen(SCREEN_START);
	updateGoInsideButton();
	generateShipList();
	drawingInterval = setInterval(draw, 1000/fps);

	/*setInterval(function() {
		updateShipText(10, getRandomInt(0, 3));
	}, 500);*/
});