/**
Basic view-side of the two-way-bound data model
@class DataView 
@extends EventEmitter
**/
define(['eventEmitter'], function(EventEmitter) {

  /**
  Constructor for {{#crossLink "DataView"}}{{/crossLink}} class.
  @method DataView
  @protected
  **/
  var DataView = function(args) {
    if(args === undefined || args.model === undefined || args.template === undefined) return;
    this.$element = $('');
    this.model = args.model;
    this.model.on('updated', this.render);
    if(typeof args.template === 'function') this.template = args.template;
  };
  DataView.extend(EventEmitter);

  /**
  Renders template using `this.model`'s data
  @method render
  **/
  DataView.prototype.render = function() {
    this.$element.html(this.template(this.data));
    this.bindAttributes();
  };

  /**
  Binds events to changes on form elements, and notifies the model
  @method bindAttributes
  **/
  DataView.prototype.bindAttributes = function() {
    var this_ = this;
    this.$element.on('change', 'input[data-binding], textarea[data-binding], select[data-binding]', function(event) {
      var callbackData = {};
      callbackData[$(event.target).data('binding')] = event.target.value
      this_.trigger('binding:updated', callbackData);
    });
  };

  return DataView;

});