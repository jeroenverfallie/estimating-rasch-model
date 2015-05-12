var est = require('../lib/estimation');
var fs = require('fs');
//
//var Representation = require('./Representation_scenario1');
//var Comparison = require('./Comparison_scenario1');
//
//
//est.estimateCJ(Comparison, Representation);
//
//var ReprString = JSON.stringify(Representation);
//
//var outputFilename = './Estimates_scenario1.json';
//
//var fd = fs.openSync(outputFilename, 'w');
//fs.writeSync(fd, ReprString);
//fs.closeSync(fd);

var Representation = require('./Representation_scenario1');
var Comparison = require('./Comparison_scenario1');

est.estimateCJ(Comparison, Representation);

var ReprString = JSON.stringify(Representation);

var outputFilename = './Estimates_scenario1.json';

var fd = fs.openSync(outputFilename, 'w');
fs.writeSync(fd, ReprString);
fs.closeSync(fd);