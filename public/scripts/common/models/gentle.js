/**
@class Gentle
@static
@module Model
**/
import Backbone from 'backbone';
import _ from 'underscore';

var Gentle = {};

var featureFlagFunctions = {};

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

  featureFlag(feature) {
    return function() {
      var flag = featureFlagFunctions[feature];
      if(_.isUndefined(flag)) {
        return !!Gentle.currentUser.get('featureFlags.'+feature);
      } else {
        return _.isFunction(flag) ? !!flag() : flag;
      }
    };
  },

  enableFeature(feature, fn) {
    featureFlagFunctions[feature] = _.isFunction(fn) ? fn : true;
  },

  enableFeatures() {
    _.each(_.toArray(arguments), Gentle.enableFeature);
  },

  featureEnabled(feature) {
    return this.featureFlag(feature)();
  },

  featuresEnabledState() {
    return _.clone(featureFlagFunctions);
  }
});
