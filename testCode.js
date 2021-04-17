var delay = require('delay');

var obj = {
  Matar: {
    Lozolia: {time: 1618589144124 },
    Caolia: {time: 1618589526476 }
  },
  Sadalbari: {
    Icypso: {time: 1618588469846 },
    Bodion: {time: 1618589196713 },
    Niapra: {time: 1618588123193 }
  },
  Salm: { Acapus: {time: 1618588198990 } },
  Scheat: {
    Mayvel: {time: 1618589372044 },
    Roebe: {time: 1618589133359 },
    Drewsa: {time: 1618589529445 },
    Headsbing: {time: 1618588940292 }
  },
  Sadalpheris: {
    'Grion A5': {time: 1618588168027 },
    Unkoinus: {time: 1618589186501 }
  }
}

var obj1 = {"a": 2, "b": 8};
var obj2 = {"b": undefined, "c": 3};

var n = "Drewsa";
//console.log(Object.keys(obj).some(item => Object.keys(obj[item]).some(insideItem => insideItem == n)));
//console.log(Object.keys(obj).map(system => Object.values(obj[system])))
console.log(Object.values(obj).some(item => Object.keys(item).some(insideItem => insideItem == n)));
for(sys of Object.values(obj)) {
	for(planet in sys) {
		if(planet == n) console.log(sys[planet]);
	}
}

let newObj = {}

Object.keys(obj2).filter(item => obj2[item] != undefined).forEach(item => newObj[item] = obj2[item]);

console.log(Object.assign({}, obj1, newObj))