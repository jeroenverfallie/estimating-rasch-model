'use strict';
var _ = require('lodash');
var outputFilename = './Representation_scenario2.json';
var data = require(outputFilename);
_.each(data, function(item){
  item.rankType = item.type;
  delete item.type;
});
var ReprString = JSON.stringify(data, null, 2);
var fs = require('fs');

var fd = fs.openSync(outputFilename, 'w');
fs.writeSync(fd, ReprString);
fs.closeSync(fd);