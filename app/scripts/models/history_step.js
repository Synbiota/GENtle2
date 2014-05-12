/**
Handling history steps
@class HistoryStep
**/
define(function(require){
  var HistoryStep;

  HistoryStep = Backbone.Model.extend({
    serialize: function() {
      Backbone.Model.prototype.toJSON.call(this);
    }
  });

  return HistoryStep;
});