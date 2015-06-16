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
  saveAs(file.getExportBlob(sequence).blob, sequence.name + '.' + file.getFileExtension());
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
  promise = Q.promise(function(resolve, reject) {
    reader.onload = function(event) {
      resolve({name: file.name, content: event.target.result});
    };
    reader.onerror = function(event) {
      reject(file.name);
    };
  });

  // Read in the image file as a data URL.
  //if ( read_binary === true )
  reader.readAsArrayBuffer(file);
  //else reader.readAsText(file);

  return promise;
};

export default Filetypes;
