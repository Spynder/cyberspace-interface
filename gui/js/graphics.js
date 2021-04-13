const {ipcRenderer} = require('electron');
require("./js/graphicsConstants");
var gh = require("./js/graphicHelpers");
var _ = require("lodash");

$(document).ready(function() {
	var canvas = document.getElementById("startCanvas");
	var ctx = canvas.getContext("2d");

	var currScreen = SCREEN_START;

	var width = canvas.width; // Width of the canvas
	var height = canvas.height; // Height of the canvas

	var ships = [];
	var planets = [];

	var enabledShips = 0; // TODO replace to a function

	// TODO: replace all $("x") to pointers

	var currSelectedSystem = "";
	let currSelectedShip = undefined;

	var translation = {x: 0, y: 0};
	var scaling = 1;


	//let radarData = {"type":"System","uuid":"Scheat","owner":"","body":{"vector":{"x":217,"y":136,"a":0},"view":3},"nodes":[{"type":"ScientificStation","uuid":"Dominion","owner":"1","body":{"vector":{"x":700,"y":700,"a":0},"view":1},"nodes":[]},{"type":"BusinessStation","uuid":"Baker Plaza","owner":"1","body":{"vector":{"x":0,"y":4000,"a":0},"view":1},"nodes":[]},{"type":"Planet","uuid":"Mayvel","owner":"1","body":{"vector":{"x":-1726,"y":1010,"a":2.6123291622912217},"view":103},"nodes":[]},{"type":"Planet","uuid":"Drewsa","owner":"1","body":{"vector":{"x":2898,"y":1962,"a":0.5951616200810167},"view":114},"nodes":[]},{"type":"Planet","uuid":"Roebe","owner":"1","body":{"vector":{"x":511,"y":-4974,"a":4.814842848614438},"view":125},"nodes":[]},{"type":"Planet","uuid":"Headsbing","owner":"1","body":{"vector":{"x":6414,"y":-1054,"a":6.120335003372804},"view":212},"nodes":[]},{"type":"Cargo","uuid":"20633f671b","owner":"","body":{"vector":{"x":-1552.881,"y":-209.169,"a":1.068},"view":1,"type":"HULL"},"nodes":[]},{"type":"Cargo","uuid":"657be0bace","owner":"","body":{"vector":{"x":-32.728,"y":3069.377,"a":0.833},"view":1,"type":"HULL"},"nodes":[]},{"type":"Cargo","uuid":"5fd0c7a7a4","owner":"","body":{"vector":{"x":-3177.784,"y":-2402.863,"a":0.285},"view":1,"type":"HULL"},"nodes":[]},{"type":"Ship","uuid":"885023cf11","owner":"a678ea674c","body":{"vector":{"x":-7.715,"y":6868.684,"a":-1.574},"view":13},"nodes":[]},{"type":"Ship","uuid":"49c6db1f86","owner":"a678ea674c","body":{"vector":{"x":-40.07,"y":6948.772,"a":3.087},"view":39},"nodes":[]},{"type":"Cargo","uuid":"66734c40cd","owner":"","body":{"vector":{"x":28.462,"y":6829.162,"a":0},"view":204,"type":"MINERALS"},"nodes":[]},{"type":"Cargo","uuid":"0d047aba3d","owner":"","body":{"vector":{"x":3.35,"y":7025.154,"a":0},"view":206,"type":"MINERALS"},"nodes":[]},{"type":"Ship","uuid":"7e1375451c","owner":"a678ea674c","body":{"vector":{"x":32.538,"y":6829.873,"a":2.871},"view":20},"nodes":[]},{"type":"Ship","uuid":"fdabc07988","owner":"a678ea674c","body":{"vector":{"x":-6.185,"y":6865.651,"a":1.899},"view":17},"nodes":[]},{"type":"Ship","uuid":"d07f579a7a","owner":"a329b17604","body":{"vector":{"x":-1615.32,"y":83.092,"a":-1.449},"view":1},"nodes":[]},{"type":"Asteroid","uuid":"a8b2f435fe","owner":"","body":{"vector":{"x":5026.6,"y":4667.929,"a":0},"view":9},"nodes":[]},{"type":"Cargo","uuid":"5e69c4f55e","owner":"","body":{"vector":{"x":-46.302,"y":6947.742,"a":0},"view":201,"type":"MINERALS"},"nodes":[]}]};
	let systemData = [];

	ipcRenderer.on("systemInfo", (event, arg) => {
		let i = systemData.findIndex(sys => sys.uuid == arg.uuid);
		if(i == -1) systemData.push(arg);
		else systemData[i] = arg;
	});

	function isMouseInsideSystemIcon(event) {
		var mousePos = gh.getMousePos(canvas, event);

		for(systemStruct of SYSTEMS) {
			if (gh.isInside(mousePos, gh.getSystemIconHitbox(systemStruct, width, height))) {
				return systemStruct;
			}
		}
		return false;
	}

	function updateGoInsideButton(system) {
		currSelectedSystem = system ? system : "";
		var noSystem = currSelectedSystem == "";
		var noInfo = getCurrentSystemData() == undefined;
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
			canvas.removeEventListener("click", checkSystemClicks, false); // change to checkClusterClicks TODO
		}
		if(currScreen != SCREEN_SYSTEM) {
			canvas.removeEventListener("click", checkPlanetClicks, false);
		}

		canvas = document.getElementById(currScreen + "Canvas");
		ctx = canvas.getContext("2d");
		if(currScreen == SCREEN_CLUSTER) {
			generateShipList();
			canvas.addEventListener("click", checkSystemClicks, false);
		} else if(currScreen == SCREEN_SYSTEM) {
			canvas.addEventListener("click", checkPlanetClicks, false);
		}
		
		canvasResize();
		draw();
	}

	function generateShipList() {
		if($("shipsContainer").children().length != ships.length) { // TODO: they might be different, but same value: [a, b] => [a] => [a, c]
			$("#shipsContainer").empty();
			planets.forEach(function(planet) {
				
			});

			ships.forEach(function(ship) {
				var item = $(gh.generateShipHtml(ship));
				$("#shipsContainer").append(item);
				var shipStruct = ships.find(obj => obj.ID == item.attr("shipID"));
				item.click(function() {
					renderJson(ships[getShipIndexByID(shipStruct.ID)]);
				});
				var activityBtn = item.find(".indicators").find(".shipActivity");
				activityBtn.click(function(event) {
					event.stopPropagation();
					shipStruct = ships.find(obj => obj.ID == item.attr("shipID")); // TODO: Since then element might have been updated
					ships[ships.indexOf(shipStruct)].active = !shipStruct.active;
					updateShipItem(shipStruct.ID);
				})
			});
		}
	}

	function getCurrentSystemData() {
		let entry = systemData.find(sys => sys.uuid == currSelectedSystem);
		if(!entry) 	return undefined;
		else 		return entry;
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

	function getPlanetIndexByID(ID) {
		return planets.findIndex(planet => planet.ID == ID);
	}

	function getRandomInt(min, max) {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min)) + min;
	}

	function updateShipItem(shipID, ignoreShipTextUpdate) {
		var shipStruct = getShipStructByID(shipID);
		var item = findShipItemByID(shipStruct.ID);

		item.find(".fuelText").replaceWith(gh.generateShipFuel(shipStruct.fuel, shipStruct.fuelMax));
		item.find(".balanceText").replaceWith(gh.generateShipBalance(shipStruct.balance));
		item.find(".systemText").replaceWith(gh.generateShipSystem(shipStruct.system));

		item.find(".shipIcon").replaceWith(gh.generateShipRole(shipStruct.role));

		var btn = item.find(".indicators").find(".shipActivity");
		btn.removeClass(shipStruct.active ? SHIPACTIVITY_OFFLINE : SHIPACTIVITY_ONLINE);
		btn.addClass(shipStruct.active ? SHIPACTIVITY_ONLINE : SHIPACTIVITY_OFFLINE);
		ipcRenderer.send("shipActivity", {ID: shipStruct.ID, active: shipStruct.active});

		if(!ignoreShipTextUpdate) {
			updateShipText();
		}
	}

	ipcRenderer.on("shipParked", (event, arg) => {
		let index = getShipIndexByID(arg.ID);
		if(index != -1) {
			ships[index].parked = arg.parked;
		}
	});

	ipcRenderer.on("shipInfo", (event, arg) => {
		var id = arg.ID;
		var itemID = getShipIndexByID(id);
		if(itemID == -1) {
			arg.active = false;
			ships.push(arg);
			generateShipList();
		} else {
			copy = ships[itemID];
			ships[itemID] = arg;
			ships[itemID].active = copy.active;
			ships[itemID].parked = copy.parked;
		}
		updateShipItem(id);
	});

	ipcRenderer.on("allObjects", (event, arg) => {
		var newShips = [];
		arg.forEach(function(object) {
			if(object.type == "Ship") {
				if(getShipIndexByID(object.uuid) == -1) {
					newShips.push({ID: object.uuid});
				} else {
					newShips.push(getShipStructByID(object.uuid));
				}
			}	
			else if(object.type == "Planet" && getPlanetIndexByID(object.uuid) == -1) {
				planets.push({ID: object.uuid});
			}
		});
		ships = newShips;
		generateShipList();
	});

	function updateShipText() {
		enabledShips = ships.filter(item => item.active).length;
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

	function drawCircle(x, y, radius, color, stroke, lineWidth) {
		ctx.beginPath();
		ctx.arc(x, y, radius, 0, 2*Math.PI);
		if(stroke) {
			ctx.strokeStyle = color;
			if(lineWidth) {
				ctx.lineWidth = lineWidth;
			}
			ctx.stroke();
		} else {
			ctx.fillStyle = color;
			ctx.fill();
		}
		ctx.closePath();
	}

	function drawSystemIcon(systemStruct) {
		var coords = gh.getSystemIconCircle(systemStruct, width, height);
		var color = HIGH_SEC_SYSTEMS.indexOf(systemStruct.name) == -1 ? COLOR_SYSTEM_FILL_UNSAFE : COLOR_SYSTEM_FILL_SAFE;
		drawCircle(coords.x, coords.y, SYSTEM_RADIUS, color);
		drawCircle(coords.x, coords.y, SYSTEM_RADIUS, COLOR_SYSTEM_STROKE, true, 2);
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

	function translateSystemCanvas(x, y) {
		translation.x = translation.x + x;
		translation.y = translation.y + y;

		ctx.translate(x, y);
	}

	var currCursorLocation = {x: undefined, y: undefined};
	var isCursorDown = false;


	// Mouse panning
	$(document).on("mousedown", function(event) {
		if(currScreen != SCREEN_SYSTEM) return;
		isCursorDown = true;
		currCursorLocation = {x: event.pageX, y: event.pageY};
	});

	$(document).on("mousemove", function(event) {
		if(currScreen != SCREEN_SYSTEM || !isCursorDown) return;
		var currX = event.pageX;
		var currY = event.pageY;
		translateSystemCanvas((currX - currCursorLocation.x), (currY - currCursorLocation.y));
		currCursorLocation = {x: currX, y: currY};
	});

	$(document).on("mouseup", function() {
		if(currScreen != SCREEN_SYSTEM) return;
		isCursorDown = false;
	});

	document.addEventListener("keydown", (event) => { // Keyboard moving (Panning)
		if(currScreen == SCREEN_SYSTEM) {
			const keyName = event.key;

			if 	   (keyName == "w") translateSystemCanvas(0, 20);
			else if(keyName == "a") translateSystemCanvas(20, 0);
			else if(keyName == "s") translateSystemCanvas(0, -20);
			else if(keyName == "d") translateSystemCanvas(-20, 0);
			else if(keyName == "Backspace") {
				let scalingBuffer = scaling;
				zoomSystemCanvas(1/scalingBuffer);
				translateSystemCanvas(-translation.x + width/2*scaling, -translation.y + height/2*scaling);
				zoomSystemCanvas(scalingBuffer);
			}
		}
	});

	function zoomSystemCanvas(scale) {
		scaling *= scale;
		ctx.scale(scale, scale);
	}

	$("#systemCanvas").on("wheel", (event) => { // Zoom
		if(currScreen == SCREEN_SYSTEM) {
			var scaleValue = 1 + (-event.originalEvent.deltaY * SCALE_SENSITIVITY);
			zoomSystemCanvas(scaleValue);
		}
	});

	function isMouseInsideBody(event) {
		var mousePos = gh.getMousePos(canvas, event, translation, scaling);
		let radarData = getCurrentSystemData();

		for(shipStruct of gh.getShipsFromData(radarData)) { // Ships
			if(gh.isInside(mousePos, gh.getShipHitbox(shipStruct))) {
				currSelectedShip = shipStruct.uuid;
				let advanced = ships.find(ship => ship.ID == currSelectedShip);
				if(advanced) {
					let advancedStruct = shipStruct;
					advancedStruct.advanced = advanced;
					return advancedStruct;
				}
				return shipStruct;
			}
		}
		currSelectedShip = undefined;

		for(cargoStruct of gh.getCargoFromData(radarData)) { // Cargo
			if(gh.isInside(mousePos, gh.getCargoHitbox(cargoStruct))) {
				return cargoStruct;
			}
		}

		for(planetStruct of gh.getPlanetsFromData(radarData)) { // Planets
			if(gh.isInside(mousePos, gh.getPlanetHitbox(planetStruct))) {
				let info = planetStruct;
				if(radarData.allDeals && radarData.allDeals[planetStruct.uuid]) {
					info.deals = radarData.allDeals[planetStruct.uuid];
				}
				return info;
			}
		}

		for(stationStruct of gh.getStationsFromData(radarData)) { // Stations
			if(gh.isInside(mousePos, gh.getStationHitbox(stationStruct))) {
				return stationStruct;
			}
		}

		if(gh.isInside(mousePos, {x: -SYSTEM_SUN_RADIUS, y: -SYSTEM_SUN_RADIUS, width: SYSTEM_SUN_RADIUS*2, height: SYSTEM_SUN_RADIUS*2})) { // Sun
			return radarData;
		}
		
		return false;
	}

	function checkPlanetClicks(event) {
		var result = isMouseInsideBody(event);
		if(result) renderJson(result);
		else renderJson();
	}

	var shipImg = new Image();
	shipImg.src = "./img/ship.png";

	function draw() {
		ctx.clearRect(-width, -height, width*10, height*10);
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
		drawText(TEXT_SIZE_BIG, COLOR_TEXT_MAIN, "Constellation Pegasus", width/2, 72, "center");

		// Draw all planets

		SYSTEMS.forEach(function(system) {
			drawSystemIcon(system);
		});

		// Draw safety rim
		var coords = gh.getSystemIconCircle(SYSTEMS[0], width, height); // Scheat
		drawCircle(coords.x, coords.y, SYSTEM_SAFETY_RIM_RADIUS * SYSTEM_DISTANCE_MULTIPLIER, COLOR_SYSTEM_SAFETY_RIM, true, 2);

		drawText(TEXT_SIZE_MEDIUM, COLOR_TEXT_SECONDARY, currSelectedSystem, width/2, 72*2, "center");
		drawSystemList();

	}

	var systemScan = {planets: [{name: "Planet1", radius: 50, x: 1000, y: 1000},
								{name: "Planet2", radius: 70, x: 500, y: 1500}]};

	
	function drawImage(image, x, y, scale, rotation) {
		ctx.setTransform(scaling, 0, 0, scaling, translation.x + (x * scaling), translation.y + (y * scaling)); // sets scale and origin
		ctx.rotate(rotation);
		ctx.drawImage(image, -image.width / 2, -image.height / 2);

		// Return to normal transformations
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.translate(translation.x, translation.y);
		ctx.scale(scaling, scaling);
	} 

	function drawMarker(x, y, radius) {
		let speed = 0.02;
		let animationTime = new Date().getTime() % (fps * (1/speed)) / (fps * (1/speed));
		let offset = Math.PI*2 * animationTime;
		ctx.beginPath();
		ctx.arc(x, y, radius, offset, Math.PI*2 + offset);
		ctx.strokeStyle = COLOR_SYSTEM_MARKER;
		ctx.lineWidth = 5;
		ctx.setLineDash([Math.PI/2 * radius * 0.8, Math.PI/2 * radius * 0.2]);
		ctx.stroke();
		ctx.closePath();
	}

	function drawSystem() {
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		drawRectangle(0, 0, width, height, COLOR_BG);

		ctx.save();
		ctx.translate(translation.x, translation.y);
		ctx.scale(scaling, scaling);

		// Sun
		var color = HIGH_SEC_SYSTEMS.indexOf(currSelectedSystem) == -1 ? COLOR_SYSTEM_FILL_UNSAFE : COLOR_SYSTEM_FILL_SAFE;
		drawCircle(0, 0, SYSTEM_SUN_RADIUS, color);
		drawCircle(0, 0, SYSTEM_SUN_RADIUS, COLOR_SYSTEM_STROKE, true, 10);

		let radarData = getCurrentSystemData();
		// Planets
		gh.getPlanetsFromData(radarData).forEach(function(planet) {

			// Planet's trail
			var angle = gh.getPlanetAngleOnOrbit(planet.body.vector.x, planet.body.vector.y);
			var arcRad = gh.getPlanetOrbitRadius(planet);
			ctx.beginPath();
			ctx.arc(0, 0, arcRad, angle, angle - (Math.PI * 0.75), true);
			ctx.strokeStyle = COLOR_SYSTEM_PLANET_TRAIL;
			ctx.stroke();
			ctx.closePath();

			// Planet itself
			var planetRadius = planet.radius ? planet.radius : SYSTEM_PLANET_RADIUS;
			drawCircle(planet.body.vector.x, planet.body.vector.y, planetRadius, COLOR_SYSTEM_PLANET);
			drawCircle(planet.body.vector.x, planet.body.vector.y, planetRadius, COLOR_SYSTEM_ASTRAL_BODY_RIM, true, 7);
		});

		gh.getStationsFromData(radarData).forEach(function(station) {
			drawCircle(station.body.vector.x, station.body.vector.y, SYSTEM_STATION_RADIUS, station.type == "BusinessStation" ? COLOR_SYSTEM_STATION_BUSINESS : COLOR_SYSTEM_STATION_SCIENTIFIC);
			drawCircle(station.body.vector.x, station.body.vector.y, SYSTEM_STATION_RADIUS, COLOR_SYSTEM_ASTRAL_BODY_RIM, true, 5);
		});

		gh.getCargoFromData(radarData).forEach(function(cargo) { // Cargo
			drawCircle(cargo.body.vector.x, cargo.body.vector.y, SYSTEM_CARGO_RADIUS, cargo.body.type == "MINERALS" ? COLOR_SYSTEM_MINERAL : COLOR_SYSTEM_BODYPART);
			drawCircle(cargo.body.vector.x, cargo.body.vector.y, SYSTEM_CARGO_RADIUS, COLOR_SYSTEM_ASTRAL_BODY_RIM, true, 5);
		});

		gh.getShipsFromData(radarData).forEach(function(ship) { // Ships
			let radAngle = ship.body.vector.a + (Math.PI * 1.5);
			
			let forwardPoint = 		gh.getPointOnCircle(ship.body.vector.x, ship.body.vector.y, SYSTEM_SHIP_SIZE, -radAngle);
			let bottomRightPoint = 	gh.getPointOnCircle(ship.body.vector.x, ship.body.vector.y, SYSTEM_SHIP_SIZE, -radAngle + (Math.PI * 0.75));
			let bottomLeftPoint = 	gh.getPointOnCircle(ship.body.vector.x, ship.body.vector.y, SYSTEM_SHIP_SIZE, -radAngle - (Math.PI * 0.75));

			ctx.beginPath();
			ctx.moveTo(forwardPoint.x, forwardPoint.y);
			ctx.lineTo(bottomRightPoint.x, bottomRightPoint.y);
			ctx.lineTo(bottomLeftPoint.x, bottomLeftPoint.y);
			ctx.lineTo(forwardPoint.x, forwardPoint.y);
			ctx.strokeStyle = COLOR_SYSTEM_ASTRAL_BODY_RIM;
			ctx.lineWidth = 5;
			ctx.stroke();
			ctx.fillStyle = (ship.owner == OWNER_ID) ? COLOR_SYSTEM_SHIP_FRIENDLY : COLOR_SYSTEM_SHIP_HOSTILE;
			ctx.fill();
			ctx.closePath();
			
			drawCircle(ship.body.vector.x, ship.body.vector.y, SYSTEM_SHIP_SIZE, COLOR_SYSTEM_ASTRAL_BODY_RIM, true, 4);
		});

		// Warp ring
		ctx.setLineDash([1000, 250]);
		drawCircle(0, 0, SYSTEM_WARP_RING_RADIUS, COLOR_SYSTEM_WARP_RING, true, 10);
		ctx.setLineDash([]); // Back to solid lines

		if(currSelectedShip) {
			let detailsStruct = ships.find(ship => ship.ID == currSelectedShip);
			let objectStruct = gh.getShipsFromData(radarData).find(ship => ship.uuid == currSelectedShip); // objectStruct updates faster than detailsStruct
			if(detailsStruct && detailsStruct.details) {
				let target = detailsStruct.details.body.target;
				if(target) {
					let p1 = {x: objectStruct.body.vector.x, y: objectStruct.body.vector.y};
					let p2 = {x: target.x, y: target.y};
					drawMarker(p2.x, p2.y, SYSTEM_MARKER_RADIUS);
					p2 = gh.extendLine({p1: p1, p2: p2}, -SYSTEM_MARKER_RADIUS).p2;
					p1 = gh.extendLine({p1: p2, p2: p1}, -SYSTEM_SHIP_SIZE).p2;

					// Draw target line
					ctx.beginPath();
					ctx.moveTo(p1.x, p1.y);
					ctx.lineTo(p2.x, p2.y);
					ctx.strokeStyle = COLOR_SYSTEM_MARKER_LINE;
					ctx.lineWidth = 3;
					ctx.setLineDash([100, 25]);
					ctx.stroke();
					ctx.closePath();
					ctx.setLineDash([]);
				}
				
			}
			else currSelectedShip = undefined;
		}

		// TODO go back btn

		ctx.restore();
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
			updateShipItem(ship.ID, true);
		});
		updateShipText();
	});

	$("#goInside").click(function() {
		changeScreen(SCREEN_SYSTEM);
		translateSystemCanvas(width/2*scaling, height/2*scaling);
		zoomSystemCanvas(SYSTEM_START_ZOOM);
		renderJson(getCurrentSystemData())
	});

	$("#goBack").click(function() {
		zoomSystemCanvas(1/SYSTEM_START_ZOOM);
		translateSystemCanvas(-width/2*scaling, -height/2*scaling);
		changeScreen(SCREEN_CLUSTER);
	});

	function renderJson(json) {
		var renderer = (currScreen == SCREEN_CLUSTER) ? $('#jsonClusterRenderer') : $('#jsonSystemRenderer')
		renderer.jsonViewer(json, JSON_RENDER_OPTIONS);
	}

	changeScreen(SCREEN_START);
	updateGoInsideButton();
	generateShipList();
	drawingInterval = setInterval(draw, 1000/fps);

	/*setInterval(function() {
		updateShipText(10, getRandomInt(0, 3));
	}, 500);*/
});