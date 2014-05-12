define(function(require) {
  var HistoryStep   = require('models/history_step'),
      History;

  HistorySteps = Backbone.Collection.extend({
    model: HistoryStep,
    serialize: function() { return _.map(this.models, function(model) { return model.serialize(); }); }
  });

  return HistorySteps;
});