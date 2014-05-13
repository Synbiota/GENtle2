/**
    Handles displaying a sequence in a canvas
    Is instantiated inside a parent Backbone.View, and is automatically
    rendered.

    @class SequenceCanvas
**/ 
define(function(require) {
  'use strict';
  var Artist            = require('lib/graphics/artist'),
      Lines             = require('lib/sequence_canvas/lines'),
      Caret             = require('lib/sequence_canvas/caret'),
      Hotkeys           = require('lib/hotkeys'),
      CopyPasteHandler  = require('lib/copy_paste_handler'),
      Q                 = require('q'),
      SequenceCanvas;

  SequenceCanvas = function(options) {
    var _this = this;
    options = options || {};
    this.visible = true;

    // Context binding (context is lost in Promises' `.then` and `.done`)
    _.bindAll(this, 'calculateLayoutSettings', 
                    'display', 
                    'refresh', 
                    'afterNextDisplay',
                    'handleScrolling',
                    'handleMousedown',
                    'handleMousemove',
                    'handleMouseup',
                    'handleClick',
                    'handleKeypress',
                    'handleKeydown',
                    'redraw'
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
      gutterWidth: 30,
      basesPerBlock: 10,
      basePairDims: {width:10, height:15},
      sequenceLength: this.sequence.length(),
      lines: options.lines || {

        // Blank line
        topSeparator: new Lines.Blank(this, {
          height: 5,
          visible: function() { return _this.sequence.get('displaySettings.rows.separators'); }
        }),

        // Position numbering
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

        // Aminoacids
        aa: new Lines.DNA(this, {
          height: 15, 
          baseLine: 15, 
          textFont: "13px Monospace", 
          transform: function(base) {
            return _this.sequence.getAA(_this.sequence.get('displaySettings.rows.aa'), base, parseInt(_this.sequence.get('displaySettings.rows.aaOffset')));
          },
          visible: _.memoize2(function() {
            return _this.sequence.get('displaySettings.rows.aa') != 'none';
          }),
          textColour: function(codon) { return {'STP': 'red', 'S  ': 'red'}[codon.sequence] || '#79B6F9'; }
        }),

        // DNA Bases
        dna: new Lines.DNA(this, {
          height: 15, 
          baseLine: 15, 
          textFont: "15px Monospace", 
          textColour:"#000",
          selectionColour: "#1a1a63",
          selectionTextColour: "#fff"
        }),

        // Complements
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

        // Annotations
        features: new Lines.Feature(this, {
          unitHeight: 15,
          baseLine: 10,
          textFont: "11px Monospace", 
          textColour: "white",
          textPadding: 2,
          margin: 2,
          lineSize: 2,
          colour: function(type) { return {'CDS': 'blue'}[type] || 'red';},
          visible: _.memoize2(function() { 
            return _this.sequence.get('features') && _this.sequence.get('displaySettings.rows.features'); 
          })
        }),

        // Blank line
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
    this.caret = new Caret(this);
    this.allowedInputChars = ['A', 'T', 'C', 'G'];
    this.displayDeferred = Q.defer();
    this.invertHotkeys = _.invert(Hotkeys);
    this.copyPasteHandler = new CopyPasteHandler();

    // Events
    this.view.on('resize', this.refresh);
    this.sequence.on('change:sequence', this.redraw);
    this.sequence.on('change:displaySettings.*', this.refresh);
    this.$scrollingParent.on('scroll', this.handleScrolling);
    this.$scrollingParent.on('mousedown', this.handleMousedown);
    this.$scrollingParent.on('keypress', this.handleKeypress);
    this.$scrollingParent.on('keydown', this.handleKeydown);

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

    return Q.promise(function(resolve, reject) {
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

    return Q.promise(function(resolve, reject) {

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

      lh.lineOffsets = {};
      _.each(ls.lines, function(line, lineName) {
        line.clearCache();
        if(line.visible === undefined || line.visible()) {
          lh.lineOffsets[lineName] = line_offset;
          if(_.isFunction(line.calculateHeight)) line.calculateHeight();
          line_offset += line.height;
        }
      });

      //row height
      lh.rows = {height:line_offset};

      //total number of rows in sequence, 
      lh.rows.total = Math.ceil(ls.sequenceLength / lh.basesPerRow) ;
      // number of visible rows in canvas
      lh.rows.visible = Math.ceil(ls.canvasDims.height / lh.rows.height) ;

      //page dims
      lh.pageDims = {
        width:ls.canvasDims.width, 
        height: ls.pageMargins.top + ls.pageMargins.bottom + lh.rows.total*lh.rows.height 
      };

      // canvas y scrolling offset
      lh.yOffset = lh.yOffset || _this.sequence.get('displaySettings.yOffset') || 0;
      _this.$scrollingParent.scrollTop(lh.yOffset);

      _this.clearCache(); 

      // We resize `this.$scrollingChild` and fullfills the Promise
      _this.resizeScrollHelpers().then(resolve);
    });
  };

  /** 
      If `this.visible`, displays the sequence in the initiated canvas.
      @method display
  **/
  SequenceCanvas.prototype.display = function() {
    if(this.visible) {
      var context         = this.artist.context,
          ls              = this.layoutSettings,
          lh              = this.layoutHelpers,
          _this           = this,
          i, k, pos, baseRange, y;

      return Q.promise(function(resolve, reject){
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

        _this.displayDeferred.resolve();
        _this.displayDeferred = Q.defer();
        resolve();

      });
    } else{
      return Q.promise(function(resolve, reject) {
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
  @method getBaseFromXYPos
  **/
  SequenceCanvas.prototype.getBaseFromXYPos = function(posX, posY) {
    var layoutSettings  = this.layoutSettings,
        baseRange       = this.getBaseRangeFromYPos(posY),
        baseWidth       = layoutSettings.basePairDims.width,
        basesPerBlock   = layoutSettings.basesPerBlock,
        blockSize       = baseWidth * basesPerBlock + layoutSettings.gutterWidth,
        marginLeft      = layoutSettings.pageMargins.left,
        block           = Math.floor((posX - marginLeft) / blockSize),
        inBlockAbsPos   = (posX - marginLeft) % blockSize / baseWidth,
        inBlockPos      = Math.floor(inBlockAbsPos),
        nextBase        = + (inBlockAbsPos - inBlockPos > 0.5);

    return baseRange[0] + block * basesPerBlock + inBlockPos + nextBase;
  };

  /**
  @method getXPosFromBase
  **/
  SequenceCanvas.prototype.getXPosFromBase = _.memoize2(function(base) {
    var layoutSettings = this.layoutSettings,
        layoutHelpers = this.layoutHelpers,
        firstBaseInRange = base - base % layoutHelpers.basesPerRow,
        deltaBase = base - firstBaseInRange,
        nbGutters = (deltaBase - deltaBase % layoutSettings.basesPerBlock) / layoutSettings.basesPerBlock;

    return layoutSettings.pageMargins.left + 
      deltaBase * layoutSettings.basePairDims.width + 
      nbGutters * layoutSettings.gutterWidth;
  });

  /**
  @method getYPosFromBase
  **/
  SequenceCanvas.prototype.getYPosFromBase = _.memoize2(function(base) {
    var layoutSettings = this.layoutSettings,
        layoutHelpers = this.layoutHelpers,
        rowNb = Math.floor(base / layoutHelpers.basesPerRow),
        topMargin = layoutSettings.pageMargins.top,
        yOffset = layoutHelpers.yOffset;

    return layoutHelpers.rows.height * rowNb + topMargin - yOffset;
  });




  /**
  Resizes $scrollingChild after window/parent div has been resized
  @method resizeScrollHelpers
  @return {Promise}
  **/
  SequenceCanvas.prototype.resizeScrollHelpers = function() {
    var _this = this,
        layoutHelpers = _this.layoutHelpers;
    return new Promise(function(resolve, reject) {
      _this.$scrollingChild.height(layoutHelpers.pageDims.height);
      _this.scrollToYOffset();
      resolve();
    });
  };

  /**
  Updates layout settings and redraws canvas
  @method refresh
  **/
  SequenceCanvas.prototype.refresh = function() {
    if(this.caretPosition) {
      this.caret.remove();
      this.caretPosition = undefined;
    }
    this.updateCanvasDims()
      .then(this.calculateLayoutSettings)
      .then(this.redraw);
  };

  /**
  Redraws canvas on the next animation frame
  @method redraw
  **/
  SequenceCanvas.prototype.redraw = function() {
    return requestAnimationFrame(this.display);
  };

  /**
  @method scrollToBase
  **/
  SequenceCanvas.prototype.scrollToBase = function(base) {
    var distanceToVisibleCanvas = this.distanceToVisibleCanvas(base);

    if(distanceToVisibleCanvas !== 0) {
      this.layoutHelpers.yOffset += distanceToVisibleCanvas;
      this.scrollToYOffset();
    }
  };

  SequenceCanvas.prototype.scrollToYOffset = function() {
    this.$scrollingParent.scrollTop(this.layoutHelpers.yOffset);
  };

  SequenceCanvas.prototype.distanceToVisibleCanvas = function(base) {
    var yPos = this.getYPosFromBase(base),
        layoutHelpers = this.layoutHelpers,
        layoutSettings = this.layoutSettings;

    return  Math.max(0, yPos - this.$scrollingParent.height() - 
              layoutSettings.pageMargins.bottom) + 
            Math.min(0, yPos - layoutSettings.pageMargins.top);
  };

  SequenceCanvas.prototype.isBaseVisible = function(base) {
    return this.distanceToVisibleCanvas(base) === 0;
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

  SequenceCanvas.prototype.clearCache = function() {
    this.getXPosFromBase.cache = {};
    this.getYPosFromBase.cache = {};
  };

  SequenceCanvas.prototype.afterNextDisplay = function() {
    var _this = this,
        args = _.toArray(arguments),
        func = args.shift();

    this.displayDeferred.promise.then(function() {
      func.apply(_this, args);
    });
  };

  /**
  **/
  SequenceCanvas.prototype.handleMousedown = function(event) {
    var _this = this;
    _this.dragStart = [event.offsetX, event.offsetY];

    this.$scrollingParent.on('mouseup mousemove', function mousedownHandler(event) {
      if(event.type === 'mouseup') {
        _this.handleMouseup(event);
        _this.$scrollingParent.off('mouseup mousemove', mousedownHandler);
      } else {
        _this.handleMousemove(event);
      }
    });
  };

  /**
  **/
  SequenceCanvas.prototype.handleMousemove = function(event) {
    var _this = this,
        layoutHelpers = _this.layoutHelpers;

    if( _this.dragStart &&
        ( Math.abs(event.offsetX - _this.dragStart[0]) > 5 ||
          Math.abs(event.offsetY - _this.dragStart[1]) >= layoutHelpers.rows.height)) {

      var first = _this.getBaseFromXYPos(_this.dragStart[0], _this.dragStart[1] - this.layoutHelpers.yOffset),
          last = _this.getBaseFromXYPos(event.offsetX, event.offsetY - this.layoutHelpers.yOffset);

      if(!_this.selecting) {
        _this.selecting = true;
        _this.caret.remove();
      }

      if(first <= last) {
        _this.selection = [first, last];
      } else {
        _this.selection = [last, first];
      }
    } else {
      _this.selecting = false;
      _this.selection = undefined;
    }

    _this.redraw();
  };

  /**
  **/
  SequenceCanvas.prototype.handleMouseup = function(event) {
    if(!this.selection || !this.selecting) {
      this.handleClick(event);
    }
    this.dragStart = undefined;
    this.selecting = false;
  };  

  /**
  Displays the caret at the mouse click position
  @method handleClick
  @param event [event] Click event
  **/
  SequenceCanvas.prototype.handleClick = function(event) {
    var mouseX = event.offsetX,
        mouseY = event.offsetY - this.layoutHelpers.yOffset,
        base = this.getBaseFromXYPos(mouseX, mouseY),
        _this = this;

    if(this.selection) {
      this.select(undefined);
    } else {
      this.displayCaret(base);
    }
  };

  /**
  Displays the caret before a base
  @method displayCaret
  @param base [base] 
  **/
  SequenceCanvas.prototype.displayCaret = function(base) {
    var lineOffsets = this.layoutHelpers.lineOffsets,
        posX, posY;

    if(base > this.sequence.length()) {
      base = this.sequence.length();
    }

    posX = this.getXPosFromBase(base);
    posY = this.getYPosFromBase(base) + lineOffsets.dna;

    this.caret.move(posX, posY);
    this.caretPosition = base;
    this.scrollToBase(base);
  };

  /**
  @method select
  **/
  SequenceCanvas.prototype.select = function(start, end) {
    this.caret.remove();
    if(start !== undefined) {
      if(start < end) {
        this.selection = [start, end];
      } else {
        this.selection = [end, start];
      }
    } else {
      this.selection = undefined;
    }
    this.redraw();
  };


  SequenceCanvas.prototype.displayCaretAfterNextDisplay = 
    _.wrap(
      SequenceCanvas.prototype.displayCaret,
      SequenceCanvas.prototype.afterNextDisplay
    );

  /**
  Handles keystrokes on keypress events (used for inputs)
  @method handleKeypress
  @param event [event] Keypress event
  **/
  SequenceCanvas.prototype.handleKeypress = function(event) {
    event.preventDefault();

    if(!~_.values(Hotkeys).indexOf(event.keyCode)) {
      var base = String.fromCharCode(event.which).toUpperCase(),
          selection = this.selection;

      if(~this.allowedInputChars.indexOf(base)) {

        if(!selection && this.caretPosition) {

          this.caret.remove();
          this.sequence.insertBases(base, this.caretPosition);
          this.displayCaretAfterNextDisplay(this.caretPosition + 1);

        } else if(selection) {

          this.caret.remove();
          this.selection = undefined;
          this.sequence.deleteBases(
            selection[0], 
            selection[1] - selection[0] + 1
          );
          this.sequence.insertBases(base, selection[0]);
          this.displayCaretAfterNextDisplay(selection[0] + 1);
        }
      }
    }
  };

  /**
  Handles keystrokes on keydown events (used for hotkeys)
  @method handleKeydown
  @param event [event] Keydown event
  **/
  SequenceCanvas.prototype.handleKeydown = function(event) {
    var A = 'A'.charCodeAt(0),
        C = 'C'.charCodeAt(0),
        V = 'V'.charCodeAt(0);

    if(~_.values(Hotkeys).indexOf(event.keyCode)) {

      this.handleHotkey(event);

    } else if(event.metaKey && event.keyCode == A) {
      event.preventDefault();

      this.select(0, this.sequence.length());

    } else if(event.metaKey && event.keyCode == C) {

      this.handleCopy();

    } else if(event.metaKey && event.keyCode == V) {

      this.handlePaste();

    }

  };

  SequenceCanvas.prototype.handleHotkey = function(event) {
    var keyName     = this.invertHotkeys[event.keyCode.toString()].toLowerCase(),
        handlerName = 'handle' + 
                      keyName.charAt(0).toUpperCase() + 
                      keyName.slice(1) + 
                      'Key';

    if(this[handlerName]) {
      event.preventDefault();
      this[handlerName].call(this, event.shiftKey, event.metaKey);
    }

  };

  SequenceCanvas.prototype.handleBackspaceKey = function(shift, meta) {
    if(this.selection) {
      var selection = this.selection;
      this.selection = undefined;
      this.sequence.deleteBases(
        selection[0], 
        selection[1] - selection[0] + 1
      );
      this.displayCaretAfterNextDisplay(selection[0]);
    } else if(this.caretPosition > 0) {
      this.caret.remove();
      this.sequence.deleteBases(this.caretPosition - 1, 1);
      this.displayCaretAfterNextDisplay(this.caretPosition - 1);
    }
  };

  SequenceCanvas.prototype.handleEscKey = function(shift, meta) {
    this.caret.remove();
    this.caretPosition = undefined;
  };

  SequenceCanvas.prototype.handleLeftKey = function(shift, meta) {
    if(meta) {
      var basesPerRow = this.layoutHelpers.basesPerRow;
      this.displayCaret(Math.floor(this.caretPosition / basesPerRow) * basesPerRow);
    } else if(this.caretPosition && this.caretPosition > 0) {
      if(shift) {
        if(this.caretPosition > 0) {
          if(this.selection) {
            this.select(this.selection[0] -1 , this.selection[1]);
          } else {
            this.select(this.caretPosition - 1, this.caretPosition - 1);
          }
        }
      } else {
        this.displayCaret(this.caretPosition - 1);
      }
    }
  };

  SequenceCanvas.prototype.handleRightKey = function(shift, meta) {
    if(meta) {
      var basesPerRow = this.layoutHelpers.basesPerRow;
      this.displayCaret((Math.floor(this.caretPosition / basesPerRow) + 1 )* basesPerRow);
    } else if(this.caretPosition && this.caretPosition < this.sequence.length() - 1) {
      this.displayCaret(this.caretPosition + 1);
    }
  };

  SequenceCanvas.prototype.handleUpKey = function(shift, meta) {
    var basesPerRow = this.layoutHelpers.basesPerRow;
    if(meta) {
      this.displayCaret(0);
    } else if(this.caretPosition >= basesPerRow) {
      this.displayCaret(this.caretPosition - basesPerRow);
    }
  };

  SequenceCanvas.prototype.handleDownKey = function(shift, meta) {
    var basesPerRow = this.layoutHelpers.basesPerRow;
    if(meta) {
      this.displayCaret(this.sequence.length());
    } else if(this.caretPosition + basesPerRow < this.sequence.length()) {
      this.displayCaret(this.caretPosition + basesPerRow);  
    }
  };

  SequenceCanvas.prototype.handleCopy = function() {
    var selection = this.selection;

    if(selection) {
      this.copyPasteHandler.copy(
        this.sequence.getSubSeq(selection[0], selection[1])
      );
    }
  };

  SequenceCanvas.prototype.handlePaste = function() {
    var _this         = this,
        selection     = _this.selection,
        caretPosition = _this.caretPosition;

    this.copyPasteHandler.paste().then(function(text) {
      if(caretPosition && !selection) {
        text = _this.cleanPastedText(text);
        _this.caret.remove();
        _this.sequence.insertBases(text, caretPosition);
        _this.displayCaretAfterNextDisplay(caretPosition + text.length);
        _this.focus();
      }

    });
  };

  SequenceCanvas.prototype.cleanPastedText = function(text) {
    var regexp = new RegExp('[^' + this.allowedInputChars.join('') + ']', 'g')
    return text.toUpperCase().replace(regexp, '');
  };

  SequenceCanvas.prototype.focus = function() {
    this.$scrollingParent.focus();
  };




  

  return SequenceCanvas;
});