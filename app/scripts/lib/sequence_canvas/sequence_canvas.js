/**
    Handles displaying a sequence in a canvas
    Is instantiated inside a parent Backbone.View, and is automatically
    rendered.

    @class SequenceCanvas
**/ 
define(function(require) {
  var Backbone      = require('backbone'),
      Artist        = require('lib/graphics/artist'),
      Promise       = require('promise'),
      Lines         = require('lib/sequence_canvas/lines'),
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
      pageMargins: {
        left:20,
        top:20, 
        right:20,
        bottom:20
      },
      scrollPercentage: 1.0,
      gutterWidth: 10,
      basesPerBlock: 10,
      basePairDims: {width:10, height:15},
      sequenceLength: this.sequence.length(),
      lines: options.lines || {
        topSeparator: new Lines.Blank(this, {
          height: 5,
          visible: function() { return _this.sequence.get('displaySettings.rows.separators'); }
        }),
        position: new Lines.Position(this, {
          height: 15, 
          baseLine: 15, 
          textFont: "10px Monospace", 
          textColour:"#005",
          transform: function(string) {
            return string.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
          },
          visible: _.memoize2(function() { 
            return _this.sequence.get('displaySettings.rows.numbering'); 
          })
        }),
        aa: new Lines.DNA(this, {
          height: 15, 
          baseLine: 15, 
          textFont: "13px Monospace", 
          transform: _.partial(this.sequence.getAA, 'long'),
          textColour: function(codon) { return {'STP': 'red', 'S  ': 'red '}[codon.sequence] || '#79B6F9'; }
        }),
        dna: new Lines.DNA(this, {
          height: 15, 
          baseLine: 15, 
          textFont: "15px Monospace", 
          textColour:"#000"
        }),
        complements: new Lines.DNA(this, {
          height: 15, 
          baseLine: 15, 
          textFont: "15px Monospace", 
          textColour:"#bbb",
          getSubSeq: _.partial(this.sequence.getTransformedSubSeq, 'complements', {}),
          visible: _.memoize2(function() { 
            return _this.sequence.get('displaySettings.rows.complements'); 
          })
        }),
        bottomSeparator: new Lines.Blank(this, {
          height: 10,
          visible: _.memoize2(function() { 
            return _this.sequence.get('displaySettings.rows.separators'); 
          })
        })
      }
    };

    this.layoutHelpers = {};
    this.artist = new Artist(this.$canvas);

    // Events
    this.view.on('resize', this.refresh);
    this.$scrollingParent.on('scroll', this.handleScrolling);
    this.sequence.on('change', this.refresh);

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
    var line_offset = _.values(this.layoutSettings.lines)[0].height,
        i, 
        blocks_per_row,
        ls = this.layoutSettings,
        lh = this.layoutHelpers,
        _this = this;

    return new Promise(function(resolve, reject) {
      lh.lineOffsets = [0];
      _.each(ls.lines, function(line) {
        line.clearCache();
        if(line.visible === undefined || line.visible()) {
          lh.lineOffsets.push(line_offset);
          line_offset += line.height;
        }
      });

      //row height
      lh.rows = {height:line_offset};

      //basesPerRow
      blocks_per_row = Math.floor( (ls.canvasDims.width + ls.gutterWidth - (ls.pageMargins.left + ls.pageMargins.right))/(ls.basesPerBlock * ls.basePairDims.width + ls.gutterWidth) );
      if (blocks_per_row !== 0){
        lh.basesPerRow = ls.basesPerBlock*blocks_per_row;
      }else{
        lh.basesPerRow = Math.floor((ls.canvasDims.width + ls.gutterWidth - (ls.pageMargins.left + ls.pageMargins.right))/ls.basePairDims.width);
        //we want bases per row to be a multiple of 10 (DOESNT WORK)
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

      _this.$scrollingParent.scrollTop(
        _this.yOffset = _this.sequence.get('displaySettings.yOffset') || 0
      );

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
          i, k, pos, baseRange, y;

      return new Promise(function(resolve, reject){
        //clear canvas
        context.clearRect(0,0,context.canvas.width, context.canvas.height);

        _this.forEachRowInRange(0, ls.canvasDims.height, function(y) {
          baseRange = _this.getBaseRangeFromYPos(y);
          _.each(ls.lines, function(line, key) {
            if(line.visible === undefined || line.visible()) {
              line.draw(y, baseRange);
              y += line.height;
            }
          });
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
  SequenceCanvas.prototype.forEachRowInRange = function(startY, endY, callback) {
    var firstRowStartY  = this.getRowStartY(startY),
        y;

    for(y = firstRowStartY; 
        y < Math.min(endY, this.layoutSettings.canvasDims.height - this.layoutSettings.pageMargins.bottom); 
        y += this.layoutHelpers.rows.height)
      callback.call(this, y);
  };

  /**
  @method getRowStartX
  @param posY {integer} Y position in the row (relative to the canvas)
  @return {integer} Y-start of the row (relative to canvas)
  **/
  SequenceCanvas.prototype.getRowStartY = function(posY) {
    return posY - 
      (posY + 
        this.layoutHelpers.yOffset - 
        this.layoutSettings.pageMargins.top
      ) % 
      this.layoutHelpers.rows.height;
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
      _this.sequence.set('displaySettings.yOffset', 
        _this.layoutHelpers.yOffset = $(event.delegateTarget).scrollTop(),
        { silent: true }
      );
      _this.sequence.throttledSave();
      _this.display();
    });  
  };

  

  return SequenceCanvas;
});