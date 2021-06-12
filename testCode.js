const crypto = require('crypto');
const fs = require('fs');

global.moduleHashes = {};

function requireModule(filepath) {
	let resolve = require.resolve(filepath);
	const fileBuffer = fs.readFileSync(filepath);
	const hashSum = crypto.createHash('sha256');
	hashSum.update(fileBuffer);

	const hex = hashSum.digest('hex');
	var requiredFile;
	if(moduleHashes[filepath] != hex) {
		if(require.cache[resolve]) delete require.cache[resolve];
		moduleHashes[filepath] = hex;
		console.log(hex);
	}
	//console.log(hex);
	return require(filepath);
}

//var file = require.resolve("./code/libs/constants");

let path = "./code/libs/logger.js";

console.log(process.cwd());

var file = requireModule(path);

let lastCheckedNumber = 0;

var lastTime = Date.now();
var count = 0;
while(true){
	if((count%10000) ==0){
		console.log("heapTotal %s MB , Count %d ,  time take  %dms"
				, String((process.memoryUsage().heapTotal / Math.pow(1024,2) ).toFixed(1)) 
				,count , Date.now() - lastTime );
		lastTime = Date.now();
	}
	count++;
	(function(){	
		file = requireModule(path)
	})();
}