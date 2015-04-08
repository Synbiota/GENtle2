#! /usr/bin/env node
require("babel/register");

var program = require('commander');
var prepareEnvironment = require('../common/prepare_environment');


program
  // .version('0.0.1')
  .usage('[options] <file ...>')
  .option('-f, --from <n>', 'Sequence from N nucleotide, offset from start', NaN)
  .option('-e, --end <n>', 'Sequence to N nucleotide, offset from end', NaN)
  .option('-t, --to <n>', 'Sequence to N nucleotide, offset from start', NaN)
  .parse(process.argv);

if(!process.argv.slice(2).length) {
  program.outputHelp();
  process.exit();
}


var inputFile = program.args[0];
prepareEnvironment.then(function() {
  var getSequenceFromFile = require('../common/get_sequence_from_file');
  return getSequenceFromFile(inputFile);
})
.then(function(sequences) {
  var _ = require('underscore');
  var num = sequences.length;
  if(num !== 1) {
    throw new Error('Expecting one sequence in ' + inputFile + ' but found ' + num);
  }
  var sequence = sequences[0];
  var sequenceNts = sequence.sequence;

  var primerFrom = program.from;
  var primerEnd = program.end;
  var primerTo = program.to;

  if(_.isNaN(primerFrom)) throw "'from' value must be specified but was: " + primerFrom;
  var to = primerTo;
  if(_.isNaN(to)) {
    to = sequenceNts.length - 1 - primerEnd;
  }
  if(_.isNaN(to)) throw "'to' or 'end' value must be specified but were: " + primerTo + " " + primerEnd;

  var options = {from: primerFrom, to: to};
  console.log("calculating pcr product " + JSON.stringify(options) + " for sequence:\n", sequenceNts, '\n');

  var getPcrProductAndPrimers = require('../../plugins/pcr/lib/pcr_primer_design').getPcrProductAndPrimers;
  return getPcrProductAndPrimers(sequenceNts, options);
})
.then(function(pcrProduct){

  console.log('pcr product result:\n', JSON.stringify(pcrProduct));

})
.done();

