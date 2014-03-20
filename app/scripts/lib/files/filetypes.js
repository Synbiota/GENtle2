define(function(require) {
  // var FT_cm5          = require('lib/files/cm5'),
  //     FT_cm5_text     = require('lib/files/cm5_text'),
  //     FT_fasta        = require('lib/files/fasta'),
  //     FT_genebank     = require('lib/files/genebank'),
  //     FT_plaintext    = require('lib/files/plaintext'),
  //     FT_scf2json     = require('lib/files/scf2json'),
  //     FT_sybil        = require('lib/files/sybil'),
  //     Filetype;

  var FT_plaintext    = require('lib/files/plaintext'),
      FT_sybil        = require('lib/files/sybil'),
      Promise         = require('promise'),
      Filetype;

  Filetypes = function() {};

  Filetypes.types = {
    // cm5:        FT_cm5,
    // cm5_text:   FT_cm5_text,
    // fasta:      FT_fasta,
    // genebank:   FT_genebank,
    plaintext:  FT_plaintext,
    // scf2json:   FT_scf2json,
    sybil:      FT_sybil,
  };

  /**
  Guesses filetype and parse sequence from string (Class method)
  @method guessTypeAndParseFromText
  @param {string} text sequence
  @param {string optional} name
  @return {array} Array of sequences as POJOs
  **/
  Filetypes.guessTypeAndParseFromText = function(text, name) {
    var sequences = [];
    text = text.trim();
    for(var filetypeName in this.types) {
      var file = new this.types[filetypeName]();
      file.file = {name: name || 'Unnamed'};
      sequences = file.checkAndParseText(text);
      if(sequences.length) break;
    }
    return sequences;
  };

  /**
  Loads the file and returns the text content (Class method)
  @method loadFile
  @param {Blob} file
  @param {Boolean} read_binary Read file as binary (default: false)
  @returns {String} file content
  **/
  Filetypes.loadFile = function(file, read_binary) {
    var reader  = new FileReader(),
        promise;

    // Promise resolving or rejecting based on response of FileReader uploading the file.
    promise = new Promise(function(resolve, reject) {
      reader.onload = function(event) {
        resolve({name: file.name, content: event.target.result});
      };
      reader.onerror = function(event) {
        reject(file.name);
      };
    });
    
    // Read in the image file as a data URL.
    if ( read_binary === true ) reader.readAsArrayBuffer(file);
    else reader.readAsText(file);

    return promise;
  };

  return Filetypes;
});