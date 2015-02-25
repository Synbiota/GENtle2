/**
@class Gentle
@static
@module Model
**/
import Backbone from 'backbone';

var Gentle = {};

export default _.extend(Gentle, Backbone.Events, {
  plugins: [],

  addPlugin(type, data) {
    Gentle.plugins.push({
      type: type,
      data: data
    });
  },

  addSequences(sequences) {
    if(sequences.length) {
      sequences = _.map(sequences, function(sequence) {
        return Gentle.sequences.create(sequence);
      });
    } else {
      alert('Could not parse the sequence.');
    }
  },

  addSequencesAndNavigate(sequences) {
    if(sequences.length) {
      sequences = _.map(sequences, function(sequence) {
        return Gentle.sequences.create(sequence);
      });
      Gentle.router.sequence(sequences[0].get('id'));
    } else {
      alert('Could not parse the sequence.');
    }
  },
});
