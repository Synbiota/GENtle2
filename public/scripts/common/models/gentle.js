/**
@class Gentle
@static
@module Model
**/
define(function(require) {
  var Backbone  = require('backbone.mixed'),
      Gentle;

  Gentle = Gentle || {};
  _.extend(Gentle, Backbone.Events);

  Gentle.plugins = [];

  Gentle.addPlugin = function(type, data) {
    Gentle.plugins.push({
      type: type,
      data: data
    });
  };

  Gentle.addSequences = function(sequences) {
    if(sequences.length) {
      sequences = _.map(sequences, function(sequence) {
        return Gentle.sequences.create(sequence);
      });
    } else {
      alert('Could not parse the sequence.');
    }
  };

  Gentle.addSequencesAndNavigate = function(sequences) {
    if(sequences.length) {
      sequences = _.map(sequences, function(sequence) {
        return Gentle.sequences.create(sequence);
      });
      Gentle.router.sequence(sequences[0].get('id'));
    } else {
      alert('Could not parse the sequence.');
    }
  };

  return function() {
    return Gentle;
  };
});