/**
  
Provides tools for drawing handling canvasses

@class Artist
@constructor
**/
define(function(require){
  var $ = require('jquery'),
      Rect = require('./rect'),
      Text = require('./text'),
      Artist;

  Artist = function Artist(canvas) {
    canvas = canvas instanceof $ ? canvas[0] : canvas;
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.shapes = [];
    this.minPixelRatio = 2;
    this.setPixelRatio();
  };

  /**
  @method set canvas dimensions
  @param {Integer} Width
  @param {Integer} Height
  **/
  Artist.prototype.setDimensions = function(width, height) {
    var canvas = this.canvas;
    if(canvas.width != width || canvas.height != height) {
      canvas.width = width;
      canvas.height = height;
    }
  };

  /**
  @method clear
  **/
  Artist.prototype.clear = function() {
    var canvas = this.canvas, 
        context = this.context;

    context.clearRect(0, 0, canvas.width, canvas.height);
    this.shapes = [];
  };

  /**
  @method fillRect
  @param {Integer} x
  @param {Integer} y
  @param {Integer} width
  @param {Integer} height
  **/
  Artist.prototype.rect = function(x, y, width, height, options) {
    var rect = new Rect(this, x, y, width, height);
    this.shapes.push(rect);
    rect.draw(options);
    return rect;
  };

  /**
  @method text
  @param {String} text
  @param {Integer} x
  @param {Integer} y
  @param {Object} styleOptions
  **/
  Artist.prototype.text = function(text, x, y, styleOptions) {
    var textShape = new Text(this, text, x, y, styleOptions);

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