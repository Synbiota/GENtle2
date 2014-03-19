/**
    Handles displaying the currentSequence sequence in a canvas
    Is instantiated inside a parent Backbone.View, and is automatically
    rendered.

    @class SequenceCanvas
**/ 
define(function(require) {
  var Backbone  = require('backbone'),
      Artist    = require('lib/graphics/artist'),
      Promise   = require('promise'),
      SequenceCanvas;

  SequenceCanvas = function(options) {
    var _this = this;
    options = options || {};
    this.visible = true;

    // Context binding (context is lost in Promises' `.then` and `.done`)
    _.bindAll(this, 'calculateLayoutSettings', 
                    'display', 
                    'refresh', 
                    'handleScrolling'
              );

    /**
        Instance of BackboneView in which the canvas lives
        @property view
        @type Backbone.View
    **/
    this.view = options.view;

    /**
        Canvas element as a jQuery object
        @property $canvas
        @type jQuery object
        @default first CANVAS DOM element in `this.view.$el`
    **/
    this.$canvas = options.$canvas || this.view.$('canvas').first();

    /**
        Invisible DIV used to handle scrolling. 
        As high as the total virtual height of the sequence as displayed.
        @property $scrollingChild
        @type jQuery object
        @default `.scrollingChild`
    **/
    this.$scrollingChild = options.$scrollingChild || this.view.$('.scrolling-child').first();

    /**
        Div in which `this.$scrollingChild` will scroll.
        Same height as `this.$canvas`
        @property $scrollingParent
        @type jQuery object
        @default jQuery `.scrollingParent`
    **/
    this.$scrollingParent = options.$scrollingParent || this.view.$('.scrolling-parent').first();

    /**
        Sequence to be displayed
        @property sequence
        @type Sequence (Backbone.Model)
        @default `this.view.model`
    **/
    this.sequence = options.sequence || this.view.model;

    /**
        @property layoutSettings
        @type Object
        @default false
    **/
    this.layoutSettings = {
      canvasDims: {width:1138, height:448},
      pageMargins: {left:20,top:20,right:20,bottom:20},
      scrollPercentage: 1.0,
      gutterWidth: 10,
      positionText: {font: "10px Monospace", colour:"#005"},
      basePairText: {font: "15px Monospace", colour:"#000"},
      basePairDims: {width:13, height:15},
      sequenceLength: this.sequence.length(),
      lines: [
        {type:'blank', height:5},
        {type:'position', height:15, baseLine: 15},
        {type:'dna', height:25, baseLine: 17},
        {type:'blank', height:10}]
    };

    // * 
    // Current top virtual scrolling position inside the canvas.
    // @property currentScroll
    // @type integer
    // *
    // this.currentScroll = 0;
    

    this.layoutHelpers = {};
    this.artist = new Artist(this.$canvas);

    // Events
    this.view.on('resize', this.refresh);
    this.$scrollingParent.on('scroll', this.handleScrolling);

    // Kickstart rendering
    this.refresh();
  };

  // _.extend(SequenceCanvas.prototype, Backbone.Events);

  /**
      Updates Canvas Dimemnsions based on viewport.
      @method updateCanvasDims
      @returns {Promise} a Promise finished when this and `this.calculateLayoutSettings` are finished
  **/
  SequenceCanvas.prototype.updateCanvasDims = function() {
    var _this = this;

    return new Promise(function(resolve, reject) {
      // Updates width of $canvas to take scrollbar of $scrollingParent into account
      _this.$canvas.width(_this.$scrollingChild.width());

      var width   = _this.$canvas[0].scrollWidth,
          height  = _this.$canvas[0].scrollHeight;

      _this.layoutSettings.canvasDims.width = width;
      _this.layoutSettings.canvasDims.height = height;

      _this.$canvas[0].width = width;
      _this.$canvas[0].height = height;

      resolve();
    });
  };


  /**
      Calculate "helper" layout settings based on already set layout settings
      @method calculateLayoutSettings
      @returns {Promise} a Promise fulfilled when finished
  **/
  SequenceCanvas.prototype.calculateLayoutSettings = function() {
    //line offsets
    var line_offset = this.layoutSettings.lines[0].height,
        i, 
        deca_bases_per_row,
        ls = this.layoutSettings,
        lh = this.layoutHelpers,
        _this = this;

    return new Promise(function(resolve, reject) {
      lh.lineOffsets = [0];
      for (i = 1; i < ls.lines.length; i ++){
        lh.lineOffsets.push(line_offset);
        line_offset += ls.lines[i].height;
      }

      //row height
      lh.rows = {height:line_offset};

      //basesPerRow
      deca_bases_per_row = Math.floor( (ls.canvasDims.width + ls.gutterWidth - (ls.pageMargins.left + ls.pageMargins.right))/(10 * ls.basePairDims.width + ls.gutterWidth) );
      if (deca_bases_per_row !== 0){
        lh.basesPerRow = 10*deca_bases_per_row;
      }else{
        lh.basesPerRow = Math.floor((ls.canvasDims.width + ls.gutterWidth - (ls.pageMargins.left + ls.pageMargins.right))/ls.basePairDims.width);
        //we want bases per row to be a multiple of 10
        if (lh.basesPerRow > 5){
          lh.basesPerRow = 5;
        }else if (lh.basesPerRow > 2){
          lh.basesPerRow = 2;
        }else{
          lh.basesPerRow = 1;
        }
      }

      //total number of rows in sequence, 
      lh.rows.total = Math.ceil(ls.sequenceLength / lh.basesPerRow) ;
      // number of visible rows in canvas
      lh.rows.visible = Math.ceil(ls.canvasDims.height / lh.rows.height) ;

      //page dims
      lh.pageDims = {
        width:ls.canvasDims.width, 
        height: ls.pageMargins.top + ls.pageMargins.bottom + lh.rows.total*lh.rows.height 
      };

      // canvas y offset
      lh.yOffset = 0;
      // if (ls.canvasDims.height < lh.pageDims.height){
      //   lh.yOffset = (lh.pageDims.height - ls.canvasDims.height) * ls.scrollPercentage ;
      // }

      // first row (starting at which row do we need to actually display them)
      lh.rows.first = Math.floor((lh.yOffset - ls.pageMargins.top)/lh.rows.height);
      if (lh.rows.first < 0) lh.rows.first = 0;

      // We resize `this.$scrollingChild` and fullfills the Promise
      _this.resizeScrollHelpers().done(resolve);
    });
  };

  /** 
      If `this.visible`, displays the sequence in the initiated canvas.
      @method display
  **/
  SequenceCanvas.prototype.display = function() {
    if(this.visible) {
      var context = this.artist.context,
          ls      = this.layoutSettings,
          lh      = this.layoutHelpers,
          _this   = this,
          i, k, pos, baseRange;

      return new Promise(function(resolve, reject){
        //clear canvas
        context.clearRect(0,0,context.canvas.width, context.canvas.height);

        _this.forEachRow(0, ls.canvasDims.height, function(y) {
          baseRange = _this.getBaseRangeFromYPos(y);
          for(i = 0; i < ls.lines.length; i++) {
            switch(ls.lines[i].type) {
              case "position":
                // numbering for position
                context.fillStyle = ls.positionText.colour;
                context.font = ls.positionText.font;
                
                x = ls.pageMargins.left;
                for(k = baseRange[0]; k <= baseRange[1]; k+=10){
                  context.fillText(k+1, x, y + (ls.lines[i].baseLine === undefined ? ls.lines[i].height : ls.lines[i].baseLine));
                  x += 10*ls.basePairDims.width + ls.gutterWidth;
                }
                break;
              case "dna":
                //draw the DNA text
                context.fillStyle = ls.basePairText.colour;
                context.font = ls.basePairText.font;

                x = ls.pageMargins.left;
                
                seq = _this.sequence.getSubSeq(baseRange[0], baseRange[1]);
                if(seq) {
                  for(k = 0; k < lh.basesPerRow; k++){
                    if(!seq[k]) break;
                    context.fillText(seq[k], x, y + (ls.lines[i].baseLine === undefined ? ls.lines[i].height : ls.lines[i].baseLine));
                    x += ls.basePairDims.width;
                    if ((k + 1) % 10 === 0) x += ls.gutterWidth;
                  }
                }
                break;
              case "blank":
                context.fillStyle = "red";
                context.fillRect(0, y, ls.canvasDims.width, ls.lines[i].height);
                break;
              default:
                //do nothing! (including blank)
            }
            y += ls.lines[i].height;
          }
        });

      });
    } else{
      return new Promise(function(resolve, reject) {
        reject();
      });
    }
  };


  /**
  @method forEachRowInWindow
  @param startY {integer} start of the visibility window
  @param endY {integer} end of the visibility window
  @param 
    callback {function} function to execute for each row. 
    Will be passed the y-offset in canvas.
  */
  SequenceCanvas.prototype.forEachRow = function(startY, endY, callback) {
    var firstRowStartY  = this.getRowStartY(startY),
        y;

    for(y = firstRowStartY; y < endY; y += this.layoutHelpers.rows.height)
      callback.call(this, y);
  };

  /**
  @method getRowStartX
  @param posY {integer} Y position in the row (relative to the canvas)
  @return {integer} Y-start of the row (relative to canvas)
  **/
  SequenceCanvas.prototype.getRowStartY = function(posY) {
    return posY - (posY + this.layoutHelpers.yOffset) % this.layoutHelpers.rows.height;
  };

  /**
  @method getBaseRangeFromYPos
  @param posY {integer} Y position in the canvas
  @return {Array} First and last bases in the row at the y-pos
  **/
  SequenceCanvas.prototype.getBaseRangeFromYPos = function(posY) {
    var rowNumber = Math.round((this.getRowStartY(posY) + this.layoutHelpers.yOffset) / this.layoutHelpers.rows.height),
        firstBase = rowNumber * this.layoutHelpers.basesPerRow;
    return [firstBase, firstBase + this.layoutHelpers.basesPerRow - 1];
  };


  /**
  Resizes $scrollingChild after window/parent div has been resized
  @method resizeScrollHelpers
  @return {Promise}
  **/
  SequenceCanvas.prototype.resizeScrollHelpers = function() {
    var _this = this;
    return new Promise(function(resolve, reject) {
      _this.$scrollingChild.height(_this.layoutHelpers.pageDims.height);
      resolve();
    });
  };

  /**
  Updates layout settings and redraws canvas
  @method refresh
  @return {Promise}
  **/
  SequenceCanvas.prototype.refresh = function() {
    var _this = this;
    return requestAnimationFrame(function() {
      _this.updateCanvasDims()
        .then(_this.calculateLayoutSettings)
        .done(_this.display);
    });
  };

  /** 
  Handles scrolling events
  @method handleScrolling
  **/
  SequenceCanvas.prototype.handleScrolling = function(event) {
    var _this = this;
    requestAnimationFrame(function() { 
      _this.layoutHelpers.yOffset = $(event.delegateTarget).scrollTop();
      _this.display();
    });  
  };

  

  return SequenceCanvas;
});