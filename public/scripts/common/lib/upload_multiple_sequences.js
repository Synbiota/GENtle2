import Filetypes from './filetypes/filetypes';
import _ from 'underscore';
import Q from 'q';

function uploadMultipleSequences(files) {
  var loadedSequences = [];

  var onLoad = function(result) {

    return Filetypes.guessTypeAndParseFromArrayBuffer(result.content, result.name).then(function( sequences) {
      if(sequences.length) {
        loadedSequences = loadedSequences.concat(sequences);
      } else {
       console.log('Could not parse the sequence.', result.name);
      }
    }, function (err) {
      console.log(err);
      // alert('Could not parse the sequence.');
    });
  };

  var onError = function(filename) {
    alert('Could not load file ' + filename);
  };

  var onLoadPromises = _.map(files, function(file) {
    return Filetypes.loadFile(file, true).then(onLoad, onError);
  });

  return Q.promise(function(resolve, reject) {
    Q.all(onLoadPromises).then(function() {
      resolve(loadedSequences);
    }, reject);
  });
}



export default uploadMultipleSequences;