define(function(require){
  var Backbone = require('backbone'),
      Sequence;

  Sequence = Backbone.Model.extend({
    initialize: function() {},

    getSubSeq: function(startBase, endBase) {
      if(endBase === undefined) 
        endBase = startBase;
      else { 
        if(endBase >= this.length() && startBase >= this.length()) return '';
        endBase = Math.min(this.length() - 1, endBase);
      }
      startBase = Math.min(Math.max(0,startBase), this.length() - 1);
      return this.attributes.sequence.substr(startBase, endBase-startBase+1);
    },

    length: function() { return this.attributes.sequence.length; },

    toJSON: function() {
      return _.extend({
        isCurrent: Gentle.currentSequence && Gentle.currentSequence.get('id') == this.get('id')
      }, Backbone.Model.prototype.toJSON.apply(this));
    }

  });

  return Sequence;
});