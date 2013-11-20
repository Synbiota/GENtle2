/**
Generic data model with getters/setters, events and two-way data binding with view
@class Data
@extends EventedObject
**/
define(['utils/evented_object'], function(EventedObject) {

  /**
  Constructor for {{#crossLink "Data"}}{{/crossLink}} class.
  @method Data
  **/
  var DataModel = EventedObject.extend(function(args) {
    if(args === undefined) args = {};
    this.accessibleAttrs = args.accessibleAttrs || [];
    if(args.view) {
      this.view = args.view;
      this.view.on('binding:updated', this.set);
    }
  });

  /**
  Getter method
  @method get
  @param {String} attribute
  returns {*} Attribute value
  **/
  DataModel.prototype.get = function(attribute) {
    if(~this.accessibleAttrs.indexOf(attribute))
      return this[attribute];
    else
      return undefined;
  };

  /**
  Setter method
  @method set
  @param {String} attribute_name_or_object Attribute name or object containing couples of attributes-value
  @param {*} [value] only necessary if `attribute_name_or_object` is an attribute name
  returns {*} value unless attribute_name_or_object is an object
  **/
  DataModel.prototype.set = function(attribute_name_or_object, value) {
    if(typeof attribute_name_or_object === 'object' && value === undefined) {
      for(attr_ in attribute_name_or_object) {
        if(attribute_name_or_object.hasOwnProperty(attr_)) {
          this.set(attr_, attribute_name_or_object[attr_]);
        }
      }
      return true;
    } else {
      if(~this.accessibleAttrs.indexOf(attribute_name_or_object)) {
        var callback_data = {};
        this[attribute] = value;
        callback_data[attribute_name_or_object] = value;
        this.trigger('updated', callback_data);
        return value;
      }
    }
  };

  return DataModel;

});
