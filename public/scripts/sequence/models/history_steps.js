import HistoryStep from './history_step';
import Backbone from 'backbone';

/**
@module Sequence
@submodule Models
@class HistorySteps
**/
var HistorySteps = Backbone.Collection.extend({
  model: HistoryStep,
  comparator: function(historyStep) {
    return - historyStep.get('timestamp');
  },
  serialize: function() {
    return _.map(this.models, function(model) { return model.serialize(); });
  }
});

export default HistorySteps;
