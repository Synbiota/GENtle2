/**
@module Sequence
@submodule Models
@class Sequences
**/
import Sequence from './sequence';
import _ from 'underscore';
import Backbone from 'backbone';


var constructors = {};

var SequencesCollection = Backbone.Collection.extend({
  model: function(attrs, options) {
    _.defaults(options, {validate: true});
    var Constructor = Sequence;
    if(attrs._type && constructors[attrs._type]) {
      Constructor = constructors[attrs._type];
    }
    var model;
    if(_.isFunction(Constructor.fromJSON)) {
      model = Constructor.fromJSON(attrs, options);
    } else {
      model = new Constructor(attrs, options);
    }
    return model;
  },

  localStorage: new Backbone.LocalStorage('Gentle-Sequences', {
    serialize: function(item) {
      var attributes = item;

      if(_.isObject(item)) {
        if(_.isFunction(item.toJSON)) {
          attributes = item.toJSON();
        } else if(_.isObject(item.attributes)) {
          attributes = item.attributes;
        }

        return JSON.stringify(attributes);
      } else {
        return attributes;
      }
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
