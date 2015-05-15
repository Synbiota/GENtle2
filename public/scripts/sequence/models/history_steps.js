/**
@module Sequence
@submodule Models
@class HistorySteps
**/
// define(function(require) {
  var HistoryStep   = require('./history_step'),
      Backbone      = require('backbone'),
      History;

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
  // return HistorySteps;
// });