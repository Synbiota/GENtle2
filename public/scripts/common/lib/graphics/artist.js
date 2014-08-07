/**
  
Provides tools for drawing on canvas

Includes Shape system for handling mouse events.

@class Artist
@module Graphics
@main Graphics
@constructor
**/
define(function(require) {
  var $ = require('jquery'),
      Rect = require('./rect'),
      Gentle = require('gentle')(),
      FeatureInfo = require('common/views/feature_info_view'),
      Washer = require('./washer'),
      RadialLineGraph = require('./radial_line_graph'),
      Text = require('./text'),
      TextArc = require('./text_arc'),
      Path = require('./path'),
      Point = require('./point'),
      Arc = require('./arc'),
      TransformationMatrix = require('./transformation_matrix'),
      Q = require('q'),
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
     this.model = Gentle.currentSequence;
    _this = this;
  
    if(this.model.trackedShapes !== undefined)
     this.shapes = this.model.trackedShapes;
    else
     this.shapes = [];
    if(this.model.refCanvas === undefined)
      {
        this.model.refCanvas = [];
        this.model.refCanvas.push('#'+canvas.id);
      }
    else
      this.model.refCanvas.push('#'+canvas.id);

    if(this.model.refCanvas !== undefined)
      if(this.model.refCanvas.length > 0)
        _.each(this.model.refCanvas, function(canvasInstance,index){
    $(document).on('mousemove',canvasInstance.parent,function(event){_this.callEventFunc(event);});
   });
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
  Execute all the event functions for tracked shapes.
  @method callEventFunc
  @param {Object} event
  **/
 Artist.prototype.callEventFunc = function(event){
    var eventName = event.type;
    var trackedEventStack = [];
    var posY = event.pageY, posX = event.pageX,
    _this = this;
    _.each(this.shapes,function(shape){
      var eventObj =_.filter(shape.trackedEvents,function(eventList){
        return eventList.eventType === eventName;
      });
      if(eventObj[0]!==undefined){
        if(shape.includesPoint(posX,posY))
        {
          trackedEventStack.push(eventObj[0].eventFunc);
        }
        else{
          _this.hideDiv(eventObj[0],false);
          }}
          });
      
  _.each(trackedEventStack,function(trackedEvent){
     if(trackedEvent.eventFunc!==undefined)
     trackedEvent.eventFunc.call(null,event,trackedEvent.featureInfo);
  });
  };

  /**
  Instantiates the feature_info view to display feature details.
  @method featureInfo
  **/
  Artist.prototype.featureInfo = function(event,featureInfo) {
      var prevInstance = false;
      event.preventDefault();
      if(featureInfo!==undefined){
        if(this.previousInfo !== undefined)
            prevInstance = _.every(this.previousInfo,function(Info,index){
                          return Info === featureInfo[index];
            });
              
        if(prevInstance === false){
         if(this.previousDiv!==undefined)
         this.previousDiv.remove();
         this.infoDiv = new FeatureInfo(event,featureInfo);
         this.previousInfo = featureInfo;
        }
        else 
          if(prevInstance === true)
          {
            if(event.target.className==='scrolling-child')
            {
              this.infoDiv.remove();
              this.infoDiv.move(event.clientX,event.clientY);
              this.previousDiv = this.infoDiv;
            }
            else
            {
              this.infoDiv.remove();
            }
          }
        this.previousInfo = featureInfo;
      }
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

  Artist.prototype.point = function (x, y) {
    return new Point(x, y);
  };

  Artist.prototype.transform = function(a, b, c, d, e, f) {
    return new TransformationMatrix(a, b, c, d, e, f);
  };


  Artist.prototype.translate = function (x, y) {
    this.context.transform(1.0, 0.0, 0.0, 1.0, x, y);
  };

  Artist.prototype.normaliseAngle = function(angle){
    while (angle < 0){
      angle += 2 * Math.PI ;
    }
    while (angle >= 2*Math.PI){
      angle -= 2 * Math.PI ;
    }
    return angle ;
  };

  Artist.prototype.onTemporaryTransformation = function(callback) {
    var context = this.context;
    context.save();
    callback.call(this);
    context.restore();
  };


  Artist.prototype.rotate = function (t) {
    this.context.rotate(t);
  };

  Artist.prototype.wrapText = function(context, text, maxWidth) {
    var words = text.split(' ');
    var line = '';
    var lines = [];

    for(var n = 0; n < words.length; n++) {
      var testLine = line + words[n] + ' ';
      var metrics = context.measureText(testLine);
      var testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        lines.push(line) ;
        line = words[n] + ' ';
      }
      else {
        line = testLine;
      }
    }
    lines.push(line);
    return lines;
  };

  Artist.reflect = function (line) {
    "use strict";
    var mag2 = line.magnitude2();
    return new Artist.transform(
      (line.x * line.x - line.y * line.y) / mag2,
      2 * line.x * line.y / mag2,
      2 * line.x * line.y / mag2,
      (line.y * line.y - line.x * line.x) / mag2,
      0.0,
      0.0
    );
  };

  Artist.rotateAround = function (p, t) {
      "use strict";
      return Artist.translate(p.x, p.y).mult(Artist.rotate(t)).mult(Artist.translate(-p.x, -p.y));
  };

  Artist.angleBetween = function (p1, p2) {
      "use strict";
      var a1 = Math.atan2(p1.y, p1.x),
          a2 = Math.atan2(p2.y, p2.x);
      return a2 - a1;
  };

  Artist.linescross = function (p1, p2, p3, p4) {
      "use strict";
      var D = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x),
          x = ((p3.x - p4.x) * (p1.x * p2.y - p1.y * p2.x) - (p1.x - p2.x) * (p3.x * p4.y - p3.y * p4.x)) / D,
          y = ((p3.y - p4.y) * (p1.x * p2.y - p1.y * p2.x) - (p1.y - p2.y) * (p3.x * p4.y - p3.y * p4.x)) / D;
      return new Artist.point(x, y);
  };

  Artist.centroid = function (p1, p2, p3, p4) {
      "use strict";
      return new Artist.point((p1.x + p2.x + p3.x + p4.x) / 4, (p1.y + p2.y + p3.y + p4.y) / 4);
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

    // this.shapes.push(rect);
    this.trackShape(rect,options);
    rect.draw(options);
    return rect;
  };

 Artist.prototype.washer = function(centreX, centreY, innerRadius, outerRadius, startAngle, endAngle, counterClockwise, arrowHead, stroke, text, options) {
    var washer = new Washer(this, centreX, centreY, innerRadius, outerRadius, startAngle, endAngle, counterClockwise, arrowHead, stroke, _.isString(text) ? text : undefined);

    washer.draw(options || (_.isObject(text) ? text : undefined) || {});
    // this.shapes.push(washer);
    return washer;
  };

   Artist.prototype.gcatRatios = function(sequence_length, res){

    var gcatRatios = new GCATRatios(sequence_length, res);

    return gcatRatios;

   }

   Artist.prototype.radialLineGraph = function(centreX, centreY, radius, offset, lineData, options){

   var  options = options || {};
   var radialLineGraph = new RadialLineGraph(this,centreX, centreY, radius, offset, lineData);

   this.onTemporaryTransformation(
    function() {  
    this.context.rotate(Math.PI);
    radialLineGraph.draw(options); 
    });
    // this.shapes.push(washer);
   return radialLineGraph;
  };


  Artist.prototype.path = function() {
    var args = arguments,
        options = _.isObject(args[args.length-1])? args.pop() : {},
        path = new Path(this, args);

    // this.shapes.push(path);
    path.draw(options);
    return path;
  };

  Artist.prototype.arc = function(x, y, radius, startAngle, endAngle, anticlockwise, options) {
    var arc;
    
    options = options || {};
    arc = new Arc(this, x, y, radius, startAngle, endAngle, anticlockwise);

    // this.shapes.push(arc);
    arc.draw(options);
    return arc;
  };

  Artist.prototype.textArc = function(text, x, y, radius, startAngle, maxAngle, options) {
    var arc;
    
    options = options || {};
    arc = new TextArc(this, text, x, y, radius, startAngle, maxAngle);

    // this.shapes.push(arc);
    arc.draw(options);
    return arc;
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

    // this.shapes.push(textShape);
    this.trackShape(textShape,options);
    textShape.draw();
    
    return textShape;
  };


  /**
  @method rotatedText
  @param {String} text
  @param {Integer} x
  @param {Integer} y
  @param {Object} [options]
  @returns {Text} instance of {{#crossLink "Text"}}{{/crossLink}}
  **/
  Artist.prototype.rotatedText = function() {
    var text      = arguments[0],
        x         = arguments[1],
        y         = arguments[2],
        options   = arguments[3] || {},
        textShape = new Text(this, text, x, y, options);

    // this.shapes.push(textShape);
    textShape.rotateAndWriteText();
    
    return textShape;
  };

   /**
  @method hideDiv
  @param {Object} funcObj
  **/
 Artist.prototype.hideDiv = function(funcObj,conditionCheck){
  var evalObj = funcObj, id, 
  refObj = $('div.feature-info');
  id = refObj.attr('id');
  if(conditionCheck){
   if(id!==undefined)
    {
      if(evalObj.eventFunc.featureInfo!==undefined)
        {
          if(evalObj.eventFunc.featureInfo.Id === id)
            this.featureVisible = true;
        }
    }
   if(this.featureVisible !== true)
    {
     refObj.hide();
    }
   }
  else{
     refObj.hide();
   }
 };


  /**
  @method updateStyle
  @params {Object} options
  **/
  Artist.prototype.updateStyle = function(options) {
    if(_.isObject(options)) {
      var lastStyleOptions = this.lastStyleOptions,
          optionsToUpdate = ['font', 'fillStyle', 'strokeStyle', 'lineWidth', 'textAlign'],
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
  @method trackShape
  @param {Shape} subclass of {{#crossLink "Shape"}}{{/crossLink}}
  @param {Object} [options]
  **/
  Artist.prototype.trackShape =  function(shape, options){
    var args = [options], eventFunctions;
    var eventStack = ['click','dblclick', 'focusout', 
                      'hover', 'mousedown', 'mouseenter', 
                      'mouseleave', 'mousemove', 'mouseout', 
                      'mouseover','mouseup', 'toggle'];
    this.eventList = eventStack;

    var storeShape = false;
    _this = this;
    
    var trackedEvents = _.filter(eventStack,function(evetType){  
                          return options.hasOwnProperty(evetType);    
                        });

   if(trackedEvents !== undefined)
   if(trackedEvents.length > 0)
   {
      storeShape = true;
      shape.trackedEvents = [];
      _.each(trackedEvents, function(eventType,index){
        var funcObj = { eventType : eventType, eventFunc : options[eventType]};
        shape.trackedEvents.push(funcObj);
        _this.hideDiv(funcObj,true);
      });
   }

    //Updating shapes from different instances of Arstist created by the current sequence.
    if(storeShape && shape !== undefined){
      _this.shapes.push(shape);
    if(_this.model.trackedShapes !== undefined && _this.model.trackedShapes.length > 0)
      _this.model.trackedShapes.push(shape);
    else
      _this.model.trackedShapes = _this.shapes;
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
  
    //Updating shapes from different instances of Artist

  /*
  if(this.shapes.length < this.model.trackedShapes.length)
      this.shapes = this.model.trackedShapes;
 
 _.each(this.shapes,function(shape, index){
  if(!shape.isVisible()){
     _this.shapes.splice(index,1);
  } 
  if(shape.isVisible()){
    shape.moveVertically(_this.model.get('displaySettings.yOffset'), pixelRatio);
  }
  });
  */
  };

  Artist.prototype.setLineDash = function(segments) {
    var context = this.context;
    if(_.isFunction(context.setLineDash)) {
      context.setLineDash(segments);
    }
  };

  Artist.prototype.setOpacity = function(opacity) {
    this.context.globalAlpha = opacity;
  };

  return Artist;
});