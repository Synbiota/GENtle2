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
    this.$scrollingParent.on('scroll', this.handleScrolling);

    /**
        Sequence to be displayed
        @property sequence
        @type Sequence (Backbone.Model)
        @default `this.view.model
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
        {type:'position', height:15},
        {type:'dna', height:25}]
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
    this.view.on('resize', _.throttle(this.refresh, 150));

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
        lh = this.layoutHelpers
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
      if (ls.canvasDims.height < lh.pageDims.height){
        lh.yOffset = (lh.pageDims.height - ls.canvasDims.height) * ls.scrollPercentage ;
      }
      console.log(lh.yOffset);

      // first row (starting at which row do we need to actually display them)
      lh.rows.first = Math.floor((lh.yOffset - ls.pageMargins.top)/lh.rows.height);
      if (lh.rows.first < 0) lh.rows.first = 0;

      // We resize `this.$scrollingChild` and fullfills the Promise
      _this.resizeScrollHelpers().done(resolve)
    });
  };

  /** 
      If `this.visible`, displays the sequence in the initiated canvas.
      @method display
  **/
  SequenceCanvas.prototype.display = function() {
    if(!this.visible) return;

    var i,j,k,x,y,
        pos,
        ls = this.layoutSettings,
        lh = this.layoutHelpers,
        row,
        _this = this,
        ctx = this.artist.context; //just doing a run without the artist...

    return new Promise(function(resolve, reject) {
      //clear canvas
      ctx.clearRect(0,0,ctx.canvas.width, ctx.canvas.height);
      

      y = - lh.yOffset + ls.pageMargins.top + lh.rows.first*lh.rows.height;

      for(i = 0; i < lh.rows.visible; i++){
        console.log(i);
        for(j = 0; j < ls.lines.length; j++){
          switch(ls.lines[j].type)
          {
            case "blank":
              //do nothing!
              break;
            case "position":
              // numbering for position
              ctx.fillStyle = ls.positionText.colour;
              ctx.font = ls.positionText.font;
              
              x = ls.pageMargins.left;
              pos = (lh.rows.first + i)*lh.basesPerRow + 1;
              for(k = 0; k < lh.basesPerRow; k+=10){
                ctx.fillText(pos+k, x, y);
                x += 10*ls.basePairDims.width + ls.gutterWidth;
              }
              break;
            case "dna":
              //draw the DNA text
              ctx.fillStyle = ls.basePairText.colour;
              ctx.font = ls.basePairText.font;

              x = ls.pageMargins.left;
              seq = _this.sequence.getSubSeq((lh.rows.first + i)*lh.basesPerRow,(lh.rows.first + i)*lh.basesPerRow+lh.basesPerRow)
              if(seq) {
                for(k = 0; k < lh.basesPerRow; k++){
                  if(!seq[k]) break;
                  ctx.fillText(seq[k], x, y);
                  x += ls.basePairDims.width;
                  if ((k + 1) % 10 === 0) x += ls.gutterWidth;
                }
              }
              break;
            default:
              //do nothing!
          }
          y += ls.lines[j].height
        }
        y += lh.rows.height;
      }

      // Always resolve.
      resolve();

    });
    
  };

  /**
  @method resizeScrollHelpers
  @return {Promise}
  **/
  SequenceCanvas.prototype.resizeScrollHelpers = function() {
    var _this = this;
    return new Promise(function(resolve, reject) {
      // _this.$scrollingParent.height(_this.$canvas[0].height);
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
    return this.updateCanvasDims()
      .then(this.calculateLayoutSettings)
      .done(this.display);
  };

  /** 
  Handles scrolling events
  @method handleScrolling
  **/
  SequenceCanvas.prototype.handleScrolling = function() {
    console.log('scrolly scrolly');
    return;
  };

  

  return SequenceCanvas;
});