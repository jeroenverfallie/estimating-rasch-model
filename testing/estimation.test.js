var est = require('../lib/estimation');
var fs = require('fs');

var Representation = require('./Representation_scenario2');
var Comparison = require('./Comparison_scenario2');

est.estimateCJ(Comparison, Representation);

var ReprString = JSON.stringify(Representation, null, 2);

var outputFilename = './Estimates_scenario2.json';

var fd = fs.openSync(outputFilename, 'w');
fs.writeSync(fd, ReprString);
fs.closeSync(fd);