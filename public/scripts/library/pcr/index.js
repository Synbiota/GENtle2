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

if(process.argv.slice(2).length) {
  prepareEnvironment.then(function() {
    var calc = require('./calc');
    calc({
      inputFile: program.args[0],
      primerFrom: program.from,
      primerEnd:  program.end,
      primerTo:   program.to
    });
    // .then(function(pcrPrimer) {

    // }).done();
  }).done();
} else {
  program.outputHelp();
  process.exit();
}

