/**
@module Sequence
@submodule Models
@class Sequences
**/
import Sequence from './sequence';
import _ from 'underscore';
import Backbone from 'backbone';


var constructors = {};

var constructorFactory = function(Constructor) {
  return class extends Constructor {
    sync(method, model, options) {
      return Backbone.getSyncMethod(model, options).apply(this, [method, model, options]);
    }
    static get name() {
      return `${Constructor.name}WithSync`;
    }
  };
};

var SequencesCollection = Backbone.Collection.extend({
  model: function(attrs, options) {
    var BaseConstructor = Sequence;
    if(attrs._type && constructors[attrs._type]) {
      BaseConstructor = constructors[attrs._type];
    }

    var Constructor = constructorFactory(BaseConstructor);

    if(_.isFunction(Constructor.fromJSON)) {
      return Constructor.fromJSON(attrs);
    } else {
      return new Constructor(attrs, options);
    }
  },

  add: function(models, options) {
    if(_.isArray(models)) {
      models = _.map(models, (model) => this.model(model.toJSON(), options));
    } else {
      return this.add([models], options);
    }
    return Backbone.Collection.prototype.add.call(this, models, options);
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
