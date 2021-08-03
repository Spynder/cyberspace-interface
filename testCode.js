const delay = require("delay");
const path = require("path")
const fs = require("fs");
const retry = require("async-retry");
const _ = require("lodash");
var sdk = require("@cyberspace-dev/sdk"); // It's not our module that we update constantly, so it's requiring with standart function
var mafs = requireModule("./libs/mafs.js");

require("electron");

let obj = {};

obj.test ??= "lmao";

console.log(obj);