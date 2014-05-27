/**
  
Provides tools for drawing on canvas

Includes Shape system for handling mouse events.

@class Artist
@module Graphics
@main Graphics
@constructor
**/
define(function(require){
  var $ = require('jquery'),
      Rect = require('./rect'),
      Text = require('./text'),
      Artist;

  /**
  @method Artist
  @constructor
  @param canvas
  @returns instance of self
  **/
  Artist = function Artist(canvas) {
    canvas = canvas instanceof $ ? canvas[0] : canvas;
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.shapes = [];
    this.minPixelRatio = 2;
    this.setPixelRatio();
    return this;
  };

  /**
  Set canvas dimensions if they have changed (will flick canvas)
  @method setDimensions
  @param {Integer} width
  @param {Integer} height
  **/
  Artist.prototype.setDimensions = function(width, height) {
    var canvas = this.canvas;
    if(canvas.width != width || canvas.height != height) {
      canvas.width = width;
      canvas.height = height;
    }
  };

  /**
  Clears entire canvas

  @method clear
  **/
  Artist.prototype.clear = function() {
    var canvas = this.canvas, 
        context = this.context;

    context.clearRect(0, 0, canvas.width, canvas.height);
    this.shapes = [];
  };

  /**
  Draw a filled rectangle. Adds it to `this.shapes`.
  @method rect
  @param {Integer} x
  @param {Integer} y
  @param {Integer} width
  @param {Integer} height
  @param {Object} [options] Available options are the same as for 
    {{#crossLink "Artist/updateStyle"}}{{/crossLink}}
  @returns {Rect} instance of {{#crossLink "Rect"}}{{/crossLink}}
  **/
  Artist.prototype.rect = function() {
    var x       = arguments[0],
        y       = arguments[1],
        width   = arguments[2],
        height  = arguments[3],
        options = arguments[4] || {},
        rect = new Rect(this, x, y, width, height);

    this.shapes.push(rect);
    rect.draw(options);
    return rect;
  };

  /**
  @method text
  @param {String} text
  @param {Integer} x
  @param {Integer} y
  @param {Object} [options]
  @returns {Text} instance of {{#crossLink "Text"}}{{/crossLink}}
  **/
  Artist.prototype.text = function() {
    var text      = arguments[0],
        x         = arguments[1],
        y         = arguments[2],
        options   = arguments[3] || {},
        textShape = new Text(this, text, x, y, options);

    this.shapes.push(textShape);
    textShape.draw();
    return textShape;
  };

  /**
  @method updateStyle
  @params {Object} options
  **/
  Artist.prototype.updateStyle = function(options) {
    if(_.isObject(options)) {
      var lastStyleOptions = this.lastStyleOptions,
          optionsToUpdate = ['font', 'fillStyle'],
          optionName, value;

      for(var i = 0; i < optionsToUpdate.length; i++) {
        optionName = optionsToUpdate[i];
        value = options[optionName];
        if(value && value != this.context[optionName]) {
          this.context[optionName] = value;
        }
      }
    }
  };

  /**
  @method getPixelRatio
  @returns {float} max of `this.minPixelRatio` and actual pixel ratio (ratio of
    device pixel ratio and backing store pixel ratio)
  **/
  Artist.prototype.getPixelRatio = function() {
    var ctx = this.context,
        dpr = window.devicePixelRatio           || 1,
        bsr = ctx.webkitBackingStorePixelRatio  ||
              ctx.mozBackingStorePixelRatio     ||
              ctx.msBackingStorePixelRatio      ||
              ctx.oBackingStorePixelRatio       ||
              ctx.backingStorePixelRatio        || 1;

    return Math.max(this.minPixelRatio, dpr / bsr);
  };

  /**
  Gets pixel ratio and enforces it on canvas
  @method setPixelRatio
  **/
  Artist.prototype.setPixelRatio = function() {
    var pixelRatio = this.getPixelRatio();
    this.context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  };

  return Artist;
});