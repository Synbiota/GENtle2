#! /usr/bin/env node
require("babel/register");

var program = require('commander');
var prepareEnvironment = require('../common/prepare_environment');

program
  // .version('0.0.1')
  .usage('[options] <file ...>')
  .option('-o, --outputFile [value]', 'Output file', 'plasmid_map.png')
  .parse(process.argv);

if(!process.argv.slice(2).length) {
  program.outputHelp();
  process.exit();
}


var inputFile = program.args[0];
prepareEnvironment.then(function() {
  var getSequenceFromFile = require('../common/get_sequence_from_file');
  return getSequenceFromFile(inputFile);
}).then(function(sequences) {
  var num = sequences.length;
  if(num !== 1) {
    throw new Error('Expecting one sequence in ' + inputFile + ' but found ' + num);
  }
  var sequence = sequences[0];
  console.log('Drawing plasmid for sequence:', JSON.stringify(sequence));

  var draw = require('./draw');
  var plasmidPng = draw(sequence);
  // TODO: write result to outputfile
  // program.outputFile
}).done();
