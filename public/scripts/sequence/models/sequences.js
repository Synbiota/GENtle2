/**
@module Sequence
@submodule Models
@class Sequences
**/
import Sequence from './sequence';
import _ from 'underscore';


var constructors = {};

var SequencesCollection = Backbone.Collection.extend({
  model: function(attrs, options) {
    var Constructor = Sequence;
    if(attrs._type && constructors[attrs._type]) {
      Constructor = constructors[attrs._type];
    }
    console.log(attrs, Constructor.name)
    return new Constructor(attrs, options);
  },

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


SequencesCollection.registerConstructor = function(constructor, sequenceType) {
  if(constructors[sequenceType]) throw new Error(`Constructor already registered for "${sequenceType}"`);
  constructors[sequenceType] = constructor;
};


export default SequencesCollection;
