/**
Handling history steps
@class HistoryStep
**/
define(function(require){
  var HistoryStep;

  HistoryStep = Backbone.Model.extend({
    serialize: function() {
      return _.extend(Backbone.Model.prototype.toJSON.call(this), {
        isInsertion: this.get('type') == 'insert',
        isDeletion: this.get('type') == 'delete'
      });
    }
  });

  return HistoryStep;
});