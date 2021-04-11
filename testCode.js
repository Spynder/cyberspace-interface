var delay = require('delay');

var sdk = {a: "shit"};

sdk.profileTime = async function(func) {
	var startTime = new Date().getTime();
	await func();
	var deltaTime = (new Date().getTime()) - startTime;
	var subtractedTime = 200 - deltaTime;
	if(subtractedTime > 0) {
		console.log("More than zero");
		console.log(deltaTime);
	} else {
		await delay(subtractedTime);
		console.log("zero!");
	}
}

async function fuckfuck() {
	console.log("Ayyyy");
	var count = 0;
	for(var i = 0; i < 100000000; i++) {
		count+= i;
	}
}

xd = 15;

console.log(xd);

sdk.profileTime(fuckfuck);