define(function(require) {
  var FT_cm5          = require('lib/files/cm5'),
      FT_cm5_text     = require('lib/files/cm5_text'),
      FT_fasta        = require('lib/files/fasta'),
      FT_genebank     = require('lib/files/genebank'),
      FT_plaintext    = require('lib/files/plaintext'),
      FT_scf2json     = require('lib/files/scf2json'),
      FT_sybil        = require('lib/files/sybil'),
      Filetype;

  Filetypes = function() {};

  Filetypes.types = {
    // cm5:        FT_cm5,
    // cm5_text:   FT_cm5_text,
    // fasta:      FT_fasta,
    // genebank:   FT_genebank,
    plaintext:  FT_plaintext //,
    // scf2json:   FT_scf2json,
    // sybil:      FT_sybil
  };

  Filetypes.guessTypeAndParseFromText = function(text, name) {
    var sequences = [];
    for(var filetypeName in this.types) {
      var file = new this.types[filetypeName]();
      file.file = {name: name};
      sequences = file.checkAndParseText(text);
      if(sequences.length) break;
    }
    return sequences;
  };

  return Filetypes;
});