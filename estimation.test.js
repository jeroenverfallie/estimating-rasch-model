var est = require('./estimation');
var fs = require('fs');

var Representation = require('./Representation');
var Comparison = require('./Comparison');


est.estimateCJ(Comparison, Representation);

var ReprString = JSON.stringify(Representation);

var outputFilename = './Estimates.json';

var fd = fs.openSync(outputFilename, 'w');
fs.writeSync(fd, ReprString);
fs.closeSync(fd);