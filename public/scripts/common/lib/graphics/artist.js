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
      Path = require('./path'),
      _ = require('underscore.mixed'),
      // BrowserDetect = require('BrowserDetect'),
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
    //// This fixes anti-alising in Firefox for non-HiDPI screens
    //// But also slows down scrolling.. Need more testing.
    // if(BrowserDetect.browser == 'Firefox') {
    //   this.minPixelRatio = 2;
    // } else {
    //   this.minPixelRatio = 1;
    // }
    return this;
  };

  /**
  Set canvas dimensions if they have changed (will flick canvas)
  @method setDimensions
  @param {Integer} width
  @param {Integer} height
  **/
  Artist.prototype.setDimensions = function(width, height) {
    var canvas = this.canvas,
        pixelRatio = this.getPixelRatio();

    if(canvas.width != width || canvas.height != height) {
      canvas.width = width * pixelRatio;
      canvas.height = height * pixelRatio;
    }
    
    this.context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  };

  /**
  Clears entire canvas

  @method clear
  @param {integer} [posY] 
  @param {integer} [height]
  **/
  Artist.prototype.clear = function() {
    var canvas = this.canvas, 
        context = this.context,
        posY = arguments[0],
        height = arguments[1];

    context.clearRect(0, posY || 0, canvas.width, height || canvas.height);
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

  Artist.prototype.path = function() {
    var args = arguments,
        options = _.isObject(args[args.length-1]) ? args.pop() : {},
        path = new Path(this, args);

    console.log(args)

    this.shapes.push(path);
    path.draw(options);
    return path;
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
          optionsToUpdate = ['font', 'fillStyle', 'strokeStyle', 'lineWidth'],
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
    this.pixelRatio = this.pixelRatio || (function(_this) {

      var context = _this.context,
          dpr = window.devicePixelRatio               || 1,
          bsr = context.webkitBackingStorePixelRatio  ||
                context.mozBackingStorePixelRatio     ||
                context.msBackingStorePixelRatio      ||
                context.oBackingStorePixelRatio       ||
                context.backingStorePixelRatio        || 1;

      return Math.max(_this.minPixelRatio || 1, dpr / bsr);

    })(this);

    return this.pixelRatio;
  };

  /**
  Moves canvas vertically by a given offset without recalculation
  @method scroll
  @param {integer} offset
  **/
  Artist.prototype.scroll = function(offset) {
    var canvas = this.canvas,
        context = this.context,
        pixelRatio = this.getPixelRatio(),
        imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    this.clear(offset > 0 ? 0 : canvas.height - offset, offset);
    context.putImageData(imageData, 0, offset * pixelRatio);

  };

  Artist.prototype.setLineDash = function(segments) {
    var context = this.context;
    if(_.isFunction(context.setLineDash)) {
      context.setLineDash(segments);
    }
  };

  return Artist;
});