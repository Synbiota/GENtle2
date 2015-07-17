/**
@module Filetypes
@class Filetypes
@main Filetypes
**/

//TODO add dependency for underscore
import FT_plaintext from './plaintext';
import FT_fasta     from './fasta';
import FT_sybil     from './sybil';
import FT_genebank  from './genebank';
import FT_scf       from './scf';
import FT_abi       from './abi';
import FT_cm5       from './cm5';
import FT_cm5_text  from './cm5_text';
import Q            from 'q';
import saveAs       from 'filesaver.js';
import _            from 'underscore';


var Filetypes = function() {};

Filetypes.types = {
  cm5:        FT_cm5,
  cm5_text:   FT_cm5_text,
  fasta:      FT_fasta,
  genebank:   FT_genebank,
  plaintext:  FT_plaintext,
  scf:        FT_scf,
  abi:        FT_abi,
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
  return Q.promise(function(resolve, reject) {
    text = text.trim();
    for(var filetypeName in Filetypes.types) {
      try {
        var file = new Filetypes.types[filetypeName]();
        file.file = {name: name || 'Unnamed'};
        sequences = file.checkAndParseText(text);
        if(sequences.length) break;
      } catch (err) {
        reject(err);
      }
    }

    resolve(sequences);
  });

};


/**
Guesses filetype and parse sequence from ArrayBuffer (Class method)
@method guessTypeAndParseFromArrayBuffer
@param {ArrayBuffer} ab
@param {string optional} name
@return {array} Array of sequences as POJOs
**/
Filetypes.guessTypeAndParseFromArrayBuffer = function(ab, name) {
  var sequences = [];
  return Q.promise(function(resolve, reject) {
    for(var filetypeName in Filetypes.types) {
      try {
        var file = new Filetypes.types[filetypeName]();
        file.file = {name: name || 'Unnamed'};
        sequences = file.checkAndParseArrayBuffer(ab);
        if(sequences.length) break;
      } catch (err) {
        reject(err);
      }
    }

    resolve(sequences);
  });

};


/**
@method exportToFile
**/
Filetypes.exportToFile = function(format, sequence)  {
  var FileType = Filetypes.types[format],
      file;
  if(FileType === undefined) {
    throw new TypeError();
  }
  file = new FileType();
  saveAs(file.getExportBlob(sequence).blob, (sequence.shortName || sequence.name) + '.' + file.getFileExtension());
};


/**
@method exportToString
**/
Filetypes.exportToString = function(format, sequence)  {
  var FileType = Filetypes.types[format],
      file;
  if(FileType === undefined) {
    throw new TypeError();
  }
  file = new FileType();
  return file.getExportString(_.isObject(sequence.attributes) ? sequence.attributes : sequence);
};


var readFromFileReader = function(file) {
  var reader  = new FileReader();

  return Q.promise(function(resolve, reject) {
    reader.onload = function(event) {
      resolve({name: file.name, content: event.target.result});
    };

    reader.onerror = function() {
      reject(file.name);
    };

    reader.readAsArrayBuffer(file);
  });
};

var readFromReadData = function(file) {
  return Q.promise(function(resolve, reject) {
    file.readData(function(str) {
      resolve({name: file.name, content: str})
    }, function() {
      reject(file.name);
    });
  });
};

/**
Loads the file and returns the text content (Class method)
@method loadFile
@param {Blob} file
@param {Boolean} read_binary Read file as binary (default: false)
@returns {String} file content
**/
Filetypes.loadFile = function(file, read_binary) {
  if(_.isFunction(file.readData)) {
    return readFromReadData(file);
  } else {
    return readFromFileReader(file);
  }
};

export default Filetypes;
