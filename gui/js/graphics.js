const {ipcRenderer} = require('electron');
require("./../code/libs/constants");
var gh = require("./js/graphicHelpers");
var mafs = require("./../code/libs/mafs");
var _ = require("lodash");

$(document).ready(function() {
	var canvas = document.getElementById("startCanvas");
	var ctx = canvas.getContext("2d");

	var currScreen = SCREEN_START;

	var width = canvas.width; // Width of the canvas
	var height = canvas.height; // Height of the canvas

	var ships = [];
	var planets = [];
	let objects = [];

	function getSwitchedObjects() {
		return objects.filter(item => item.active).length;
	}

	// TODO: replace all $("x") to pointers

	var currSelectedSystem = "";
	let currSelectedShip = undefined;

	function setSelectedShip(id) {
		currSelectedShip = id;
		ipcRenderer.send("newSelectedShip", id);
	}

	var translation = {x: 0, y: 0};
	var scaling = 1;

	let systemData = [];

	ipcRenderer.on("systemInfo", (event, arg) => {
		let i = systemData.findIndex(sys => sys.uuid == arg.uuid);
		if(i == -1) systemData.push(arg);
		else systemData[i] = arg;

		if(!HIGH_SEC_SYSTEMS.includes(arg.uuid)) {
			let shipsInSystem = gh.getShipsFromData(arg);
			for(ship of shipsInSystem) {
				if(ship.owner != OWNER_ID && !ALLY_IDS.includes(ship.owner)) {
					console.log("ENEMY SPOTTED: ");
					console.log("UUID: " + ship.uuid);
					console.log("OWNER: " + ship.owner);
					playSound("enemySpotted");
					break;
				}
			}
		}
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
			generateObjectList();
			canvas.addEventListener("click", checkSystemClicks, false);
		} else if(currScreen == SCREEN_SYSTEM) {
			canvas.addEventListener("click", checkPlanetClicks, false);
		}
		
		canvasResize();
		draw();
	}

	function getIdFromDivItem(item) {
		let id = item.attr("objID");
		id = id.replace(/_/g, " "); // Replace all underscores (_) with spaces ( )
		return id;
	}

	function generateObjectList() {
		if($("#objectsContainer").children().length != objects.length) { // TODO: they might be different, but same value: [a, b] => [a] => [a, c]
			$("#objectsContainer").empty();
			objects.forEach(function(obj) {
				var item = $(gh.generateObjectHtml(obj));
				$("#objectsContainer").append(item);
				var objStruct = objects.find(obj => obj.ID == getIdFromDivItem(item));
				item.click(function() {
					playSound("objectClick");
					console.log("Clicked object: " + getIdFromDivItem(item));
					setSelectedShip(getIdFromDivItem(item));
					renderJson(objects[getObjectIndexByID(objStruct.ID)]);
				});
				var activityBtn = item.find(".indicators").find(".objectActivity");
				activityBtn.click(function(event) {
					event.stopPropagation();
					objStruct = objects.find(obj => obj.ID == getIdFromDivItem(item)); // TODO: Since then element might have been updated
					objects[objects.indexOf(objStruct)].active = !objStruct.active;
					updateObjectItem(objStruct.ID);
				});
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

	function findObjectItemByID(id) {
		id = id.replace(/ /g, "_");
		return $(`.object[objID = '${id}']`);
	}

	function getObjectIndexByID(ID) {
		return objects.findIndex(object => object.ID == ID);
	}

	function getObjectStructByID(ID) {
		return objects[getObjectIndexByID(ID)];
	}



	function getRandomInt(min, max) {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min)) + min;
	}

	function updateObjectItem(objectID, ignoreObjTextUpdate) {
		var objectStruct = getObjectStructByID(objectID);
		if(objectStruct) {
			var item = findObjectItemByID(objectStruct.ID);

			item.find(".objectInfo").replaceWith(gh.generateObjectInfo(objectStruct));

			item.find(".objectIcon").replaceWith(gh.generateShipRole(objectStruct));
			item.find(".label").replaceWith(gh.generateShipLabel(objectStruct));
			
			// Update label

			var btn = item.find(".indicators").find(".objectActivity");
			btn.removeClass(objectStruct.active ? SHIPACTIVITY_OFFLINE : SHIPACTIVITY_ONLINE);
			btn.addClass(objectStruct.active ? SHIPACTIVITY_ONLINE : SHIPACTIVITY_OFFLINE);

			ipcRenderer.send("objectActivity", {ID: objectStruct.ID, active: objectStruct.active});
		}

		if(!ignoreObjTextUpdate) {
			updateObjectText();
		}
	}

	ipcRenderer.on("shipParked", (event, arg) => {
		let index = getObjectIndexByID(arg.ID);
		if(index != -1) {
			objects[index].parked = arg.parked;
		}
		updateObjectItem(arg.ID);
	});

	function updateInfo(event, arg) {
		var id = arg.ID;
		var itemID = getObjectIndexByID(id);
		if(itemID == -1) {
			arg.active = false;
			objects.push(arg);
			generateObjectList();
		} else {
			let filteredArg = {};
			Object.keys(arg).filter(item => arg[item] != undefined).forEach(item => filteredArg[item] = arg[item]);
			objects[itemID] = Object.assign({}, objects[itemID], filteredArg);
		}
		updateObjectItem(id);
	}

	ipcRenderer.on("objectInfo", (event, arg) => {
		updateInfo(event, arg);
		return;
	});

	ipcRenderer.on("allObjects", (event, arg) => {
		var newObjects = [];
		arg.forEach(function(object) {
			if(getObjectIndexByID(object.uuid) == -1) {
				newObjects.push({ID: object.uuid, type: object.type});
			} else {
				newObjects.push(getObjectStructByID(object.uuid));
			}
		});
		objects = newObjects;
		generateObjectList();
	});

	function updateObjectText() {
		$("#disableAll").text(getSwitchedObjects() == 0 ? SHIPS_DISABLED : SHIPS_ENABLED);
		let activatedObjects = objects.filter(item => gh.getObjectState(item) != SHIPSTATE.OFF).length;
		$("#objectsText").text(`${objects.length} objects (${activatedObjects} active): `);

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

	function drawArrow(x1, y1, x2, y2) {
		ctx.beginPath();
		var headLength = 10; // length of head in pixels
		var dx = x2 - x1;
		var dy = y2 - y1;
		var angle = Math.atan2(dy, dx);
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI/6), y2 - headLength * Math.sin(angle - Math.PI/6));
		ctx.moveTo(x2, y2);
		ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI/6), y2 - headLength * Math.sin(angle + Math.PI/6));
		ctx.strokeStyle = "#FFF";
		ctx.stroke();
		ctx.closePath();
	}

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

	function getObjectsInSystem(sys) {
		return objects.filter((obj) => obj.system == sys);
	}

	function drawSystemList() {
		var system = currSelectedSystem;
		var systemStruct = SYSTEMS.find((sys) => sys.name == system);
		var list = getObjectsInSystem(system);

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

	function drawShipWarpPath() {
		if(currSelectedShip) {
			let shipObj = objects.find(obj => obj.ID == currSelectedShip);
			if(shipObj && shipObj.details && shipObj.details.path) {
				let path = shipObj.details.path;
				for(let [index, system] of path.entries()) {
					if(path.length-1 > index) {
						let curr = /*SYSTEMS.find(sys => sys.name == system);*/ gh.getSystemIconCircle(SYSTEMS.find(sys => sys.name == system), width, height);
						let next = gh.getSystemIconCircle(SYSTEMS.find(sys => sys.name == path[index+1]), width, height);

						let offsetCurr = mafs.extendLine({p1: next, p2: curr}, -SYSTEM_RADIUS).p2;
						let offsetNext = mafs.extendLine({p1: offsetCurr, p2: next}, -SYSTEM_RADIUS).p2;

						let currIcon = 0;
						let nextIcon = 0;

						drawArrow(offsetCurr.x, offsetCurr.y, offsetNext.x, offsetNext.y);
					}
				}
			}
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
				setSelectedShip(shipStruct.uuid);
				let advanced = ships.find(ship => ship.ID == currSelectedShip); // deprecated, fix
				if(advanced) {
					let advancedStruct = shipStruct;
					advancedStruct.advanced = advanced;
					return advancedStruct;
				}
				return shipStruct;
			}
		}
		setSelectedShip(undefined);

		for(cargoStruct of gh.getCargoFromData(radarData)) { // Cargo
			if(gh.isInside(mousePos, gh.getCargoHitbox(cargoStruct))) {
				return cargoStruct;
			}
		}

		for(asteroidStruct of gh.getAsteroidsFromData(radarData)) { // Cargo
			if(gh.isInside(mousePos, gh.getAsteroidHitbox(asteroidStruct))) {
				return asteroidStruct;
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

		drawShipWarpPath();

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

		gh.getAsteroidsFromData(radarData).forEach(function(asteroid) { // asteroid
			drawCircle(asteroid.body.vector.x, asteroid.body.vector.y, SYSTEM_ASTEROID_RADIUS, COLOR_SYSTEM_ASTEROID);
			drawCircle(asteroid.body.vector.x, asteroid.body.vector.y, SYSTEM_ASTEROID_RADIUS, COLOR_SYSTEM_ASTRAL_BODY_RIM, true, 5);
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
			ctx.fillStyle = (ship.owner == OWNER_ID) 		? COLOR_SYSTEM_SHIP_FRIENDLY :
							(ALLY_IDS.includes(ship.owner))	? COLOR_SYSTEM_SHIP_ALLY	 :
															  COLOR_SYSTEM_SHIP_HOSTILE;
			ctx.fill();
			ctx.closePath();
			
			drawCircle(ship.body.vector.x, ship.body.vector.y, SYSTEM_SHIP_SIZE, COLOR_SYSTEM_ASTRAL_BODY_RIM, true, 4);
		});

		// Warp ring
		ctx.setLineDash([1000, 250]);
		drawCircle(0, 0, SYSTEM_WARP_RING_RADIUS, COLOR_SYSTEM_WARP_RING, true, 10);
		ctx.setLineDash([]); // Back to solid lines

		if(currSelectedShip) {
			let detailsStruct = objects.find(ship => ship.ID == currSelectedShip);
			let objectStruct = gh.getShipsFromData(radarData).find(ship => ship.uuid == currSelectedShip); // objectStruct updates faster than detailsStruct
			if(detailsStruct && detailsStruct.details) {
				let target = detailsStruct.details.body.target;
				if(target) {
					let p1 = {x: objectStruct.body.vector.x, y: objectStruct.body.vector.y};
					let p2 = {x: target.x, y: target.y};
					drawMarker(p2.x, p2.y, SYSTEM_MARKER_RADIUS);
					p2 = mafs.extendLine({p1: p1, p2: p2}, -SYSTEM_MARKER_RADIUS).p2;
					p1 = mafs.extendLine({p1: p2, p2: p1}, -SYSTEM_SHIP_SIZE).p2;

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
			else setSelectedShip(undefined);
		}

		// Draw delta time
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		let lastDate = new Date(getCurrentSystemData().updateTime);
		let currDate = new Date();
		let deltaTime = new Date(currDate.getTime() - lastDate.getTime());
		let dateText = "-" + `${deltaTime.getUTCHours()}`.padStart(2, '0') + ":" + `${deltaTime.getUTCMinutes()}`.padStart(2, '0') + ":" + `${deltaTime.getUTCSeconds()}`.padStart(2, '0');
		drawText(TEXT_SIZE_MEDIUM, COLOR_TEXT_SECONDARY, dateText, width-SYSTEM_TIME_TEXT_MARGIN, SYSTEM_TIME_TEXT_MARGIN, "right");

		ctx.restore();
	}

	$("#startButton").click(function() {
		changeScreen(SCREEN_CLUSTER);
		renderJson();
	});

	$("#disableAll").click(function() {
		objects.forEach(function(obj, i) {
			obj.active = (getSwitchedObjects() == 0);
			objects[i] = obj;
			updateObjectItem(obj.ID, true);
		});
		updateObjectText();
	});

	$("#goInside").click(function() {
		changeScreen(SCREEN_SYSTEM);
		renderJson(getCurrentSystemData())
	});

	$("#goBack").click(function() {
		changeScreen(SCREEN_CLUSTER);
	});

	function renderJson(json) {
		var renderer = (currScreen == SCREEN_CLUSTER) ? $('#jsonClusterRenderer') : $('#jsonSystemRenderer')
		renderer.jsonViewer(json, JSON_RENDER_OPTIONS);
	}

	function playSound(name, volume) {
		let audio = new Audio("sounds/" + name + ".wav");
		audio.volume = volume ? volume : 0.3;
		audio.play();
	}

	changeScreen(SCREEN_START);
	updateGoInsideButton();
	drawingInterval = setInterval(draw, 1000/fps);
});