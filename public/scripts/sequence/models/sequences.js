/**
@module Sequence
@submodule Models
@class Sequences
**/
import Sequence from './sequence';

export default Backbone.Collection.extend({
  model: Sequence,
  localStorage: new Backbone.LocalStorage('Gentle-Sequences', {
    serialize: function(item) {
      return _.isObject(item) ? 
        JSON.stringify(_.isObject(item.attributes) ? item.attributes : item) : 
        item;
    },
    // fix for "illegal access" error on Android when JSON.parse is passed null
    deserialize: function (data) {
      return data && JSON.parse(data);
    }
  }),
  serialize: function() { return _.map(this.models, function(model) { return model.serialize(); }); }
});