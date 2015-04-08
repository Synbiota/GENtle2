#! /usr/bin/env node
require("babel/register");

var program = require('commander');
var prepareEnvironment = require('../common/prepare_environment');


program
  // .version('0.0.1')
  .usage('[options] <file ...>')
  .option('-o, --outputFile [value]', 'Output file', 'plasmid_map.png')
  .parse(process.argv);

if(process.argv.slice(2).length) {
  prepareEnvironment.then(function() {
    var draw = require('./draw');
    draw({
      inputFile: program.args[0],
      outputFile: program.outputFile
    });
  }).done();
} else {
  program.outputHelp();
  process.exit();
}
