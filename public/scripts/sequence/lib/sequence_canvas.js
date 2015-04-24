/**
Handles displaying a sequence in a canvas.

Is instantiated inside a parent Backbone.View, and is automatically
rendered.

@class SequenceCanvas
@constructor
@uses SequenceCanvasContextMenu
@uses SequenceCanvasHandlers
@uses SequenceCanvasUtilities
@module SequenceCanvas
**/
define(function(require) {
  'use strict';
  var Artist = require('../../common/lib/graphics/artist'),
    Hotkeys = require('../../common/lib/hotkeys'),
    CopyPasteHandler = require('../../common/lib/copy_paste_handler'),
    Lines = require('./lines'),
    Caret = require('../../common/lib/caret'),
    _Handlers = require('./_sequence_canvas_handlers'),
    _Utilities = require('./_sequence_canvas_utilities'),
    _ContextMenu = require('../lib/_sequence_canvas_context_menu'),
    Backbone = require('backbone'),
    Styles = require('../../styles.json'),
    Q = require('q'),
    {namedHandleError} = require('../../common/lib/handle_error'),
    LineStyles, SequenceCanvas;

  LineStyles = Styles.sequences.lines;


  SequenceCanvas = function(options) {
    var _this = this;
    options = options || {};
    this.visible = true;

    // Context binding (context is lost in Promises' `.then` and `.done`)
    _.bindAll(this, 'calculateLayoutSettings',
      'redrawSelection',
      'display',
      'refresh',
      'refreshFromResize',
      'redraw',
      'afterNextRedraw',
      'handleScrolling',
      'handleMousedown',
      'handleMousemove',
      'handleMouseup',
      'handleClick',
      'handleKeypress',
      'handleKeydown',
      'handleBlur'
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
    var sequence = this.sequence;
    this.readOnly = !!this.sequence.get('readOnly');
    this.drawSingleStickyEnds = _.isUndefined(options.drawSingleStickyEnds) ?
                                true :
                                options.drawSingleStickyEnds;

    var dnaStickyEndHighlightColour = function(reverse, base, pos) {
      return sequence.isBeyondStickyEnd(pos, reverse) && '#ccc';
    };

    var dnaStickyEndTextColour = function(reverse, defaultColour, base, pos) {
      return sequence.isBeyondStickyEnd(pos, reverse) ? 'green' : defaultColour;
    };

    /**
        @property layoutSettings
        @type Object
        @default false
    **/
    this.layoutSettings = {
      canvasDims: {
        width: 1138,
        height: 448
      },
      pageMargins: {
        left: 20,
        top: 20,
        right: 20,
        bottom: 20
      },
      scrollPercentage: 1.0,
      gutterWidth: 30,
      basesPerBlock: 10,
      basePairDims: {
        width: 10,
        height: 15
      }
    };

    if(_.isObject(options.lines)) {
      _.each(options.lines, (value, key) => {
        options.lines[key] = new Lines[value[0]](this, value[1] || {});
      });
    }

    this.layoutSettings.lines = options.lines || {

      // Blank line
      topSeparator: new Lines.Blank(this, {
        height: 5,
        visible: function() {
          return _this.sequence.get('displaySettings.rows.separators');
        }
      }),

      // Restriction Enzyme Sites
      restrictionEnzymesLabels: new Lines.RestrictionEnzymeLabels(this, {
        unitHeight: 10,
        textFont: LineStyles.RES.text.font,
        textColour: LineStyles.RES.text.color,
        visible: _.memoize2(function() {
          return _this.sequence.get('displaySettings.rows.res.display');
        })
      }),

      // Position numbering
      position: new Lines.Position(this, {
        height: 15,
        baseLine: 15,
        textFont: LineStyles.position.text.font,
        textColour: LineStyles.position.text.color,
        transform: _.formatThousands,
        visible: _.memoize2(function() {
          return _this.sequence.get('displaySettings.rows.numbering');
        })
      }),

      // Aminoacids
      aa: new Lines.DNA(this, {
        height: 15,
        baseLine: 15,
        textFont: LineStyles.aa.text.font,
        transform: function(base) {
          return _this.sequence.getAA(_this.sequence.get('displaySettings.rows.aa'), base, parseInt(_this.sequence.get('displaySettings.rows.aaOffset')));
        },
        visible: _.memoize2(function() {
          return _this.sequence.get('displaySettings.rows.aa') != 'none';
        }),
        textColour: function(codon) {
          var colors = LineStyles.aa.text.color;
          return colors[codon.sequence] || colors._default;
        }
      }),

      // DNA Bases
      dna: new Lines.DNA(this, {
        height: 15,
        baseLine: 15,
        drawSingleStickyEnds: this.drawSingleStickyEnds,
        textFont: LineStyles.dna.text.font,
        textColour: _.partial(dnaStickyEndTextColour, true, LineStyles.dna.text.color),
        highlightColour: _.partial(dnaStickyEndHighlightColour, false),
        selectionColour: LineStyles.dna.selection.fill,
        selectionTextColour: LineStyles.dna.selection.color,
      }),

      // Complements
      complements: new Lines.DNA(this, {
        height: 15,
        baseLine: 15,
        drawSingleStickyEnds: this.drawSingleStickyEnds,
        isComplement: true,
        textFont: LineStyles.complements.text.font,
        textColour: _.partial(dnaStickyEndTextColour, false, LineStyles.complements.text.color),
        highlightColour: _.partial(dnaStickyEndHighlightColour, true),
        getSubSeq: _.partial(this.sequence.getTransformedSubSeq, 'complements', {}),
        visible: _.memoize2(function() {
          return _this.sequence.get('displaySettings.rows.complements');
        })
      }),

      // Annotations
      features: new Lines.Feature(this, {
        unitHeight: 15,
        baseLine: 10,
        textFont: LineStyles.features.font,
        topMargin: 3,
        textColour: function(type) {
          var colors = LineStyles.features.color;
          type = 'type-'+type.toLowerCase();
          return (colors[type] && colors[type].color) || colors._default.color;
        },
        textPadding: 2,
        margin: 2,
        lineSize: 2,
        colour: function(type) {
          var colors = LineStyles.features.color;
          type = 'type-'+type.toLowerCase();
          return (colors[type] && colors[type].fill) || colors._default.fill;
        },
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
      }),

      // Restriction Enzyme Sites
      restrictionEnzymeSites: new Lines.RestrictionEnzymeSites(this, {
        floating: true,
        visible: _.memoize2(function() {
          return _this.sequence.get('displaySettings.rows.res.display');
        })
      })

    };

    this.layoutHelpers = {};
    this.artist = new Artist(this.$canvas);
    this.caret = new Caret({
      $container: this.$scrollingChild,
      className: 'sequence-canvas-caret',
      blinking: true
    });
    this.allowedInputChars = ['A', 'T', 'C', 'G'];
    this.displayDeferred = Q.defer();
    this.copyPasteHandler = new CopyPasteHandler();

    this.contextMenu = this.view.getView('#sequence-canvas-context-menu-outlet');

    this.invertHotkeys = _.invert(Hotkeys);
    this.commandKeys = {};
    _.each(['A', 'C', 'Z', 'V'], function(key) {
      _this.commandKeys[key] = key.charCodeAt(0);
    });

    // Events
    this.view.on('resize', this.refreshFromResize);
    this.sequence.on('change:sequence change:displaySettings.* change:features.* change:features', this.refresh);
    this.$scrollingParent.on('scroll', this.handleScrolling);
    this.$scrollingParent.on('mousedown', this.handleMousedown);
    this.$scrollingParent.on('keypress', this.handleKeypress);
    this.$scrollingParent.on('keydown', this.handleKeydown);
    this.$scrollingParent.on('blur', this.handleBlur);

    // Kickstart rendering
    this.refresh();
//    console.log('test')
  };

  _.extend(SequenceCanvas.prototype, Backbone.Events);
  _.extend(SequenceCanvas.prototype, _Handlers.prototype);
  _.extend(SequenceCanvas.prototype, _Utilities.prototype);
  _.extend(SequenceCanvas.prototype, _ContextMenu.prototype);

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

      var width = _this.$canvas[0].scrollWidth,
        height = _this.$canvas[0].scrollHeight;

      _this.layoutSettings.canvasDims.width = width;
      _this.layoutSettings.canvasDims.height = height;

      _this.artist.setDimensions(width, height);

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


      var gutterWidth = ls.gutterWidth = _this.sequence.get('displaySettings.rows.hasGutters') ? 30 : 0;

      //basesPerRow
      blocks_per_row = Math.floor((ls.canvasDims.width + gutterWidth - (ls.pageMargins.left + ls.pageMargins.right)) / (ls.basesPerBlock * ls.basePairDims.width + gutterWidth));
      if (blocks_per_row !== 0) {
        lh.basesPerRow = ls.basesPerBlock * blocks_per_row;
      } else {
        lh.basesPerRow = Math.floor((ls.canvasDims.width + gutterWidth - (ls.pageMargins.left + ls.pageMargins.right)) / ls.basePairDims.width);
        //we want bases per row to be a multiple of 10 (DOESNT WORK)
        if (lh.basesPerRow > 5) {
          lh.basesPerRow = 5;
        } else if (lh.basesPerRow > 2) {
          lh.basesPerRow = 2;
        } else {
          lh.basesPerRow = 1;
        }
      }

      lh.lineOffsets = {};
      _.each(ls.lines, function(line, lineName) {
        line.clearCache();
        if ((line.visible === undefined || line.visible()) && !line.floating) {
          lh.lineOffsets[lineName] = line_offset;
          if (_.isFunction(line.calculateHeight)) line.calculateHeight();
          line_offset += line.height;
        }
      });

      //row height
      lh.rows = {
        height: line_offset
      };

      //total number of rows in sequence,
      lh.rows.total = Math.ceil(_this.sequence.length() / lh.basesPerRow);
      // number of visible rows in canvas
      lh.rows.visible = Math.ceil(ls.canvasDims.height / lh.rows.height);

      //page dims
      lh.pageDims = {
        width: ls.canvasDims.width,
        height: ls.pageMargins.top + ls.pageMargins.bottom + lh.rows.total * lh.rows.height
      };

      // canvas y scrolling offset
      lh.yOffset = lh.yOffset || _this.sequence.get('displaySettings.yOffset') || 0;


      // if (_this.layoutHelpers.BasePosition === undefined)
      //   _this.layoutHelpers.BasePosition = _this.getBaseFromXYPos(0, lh.yOffset + lh.rows.height);

      // if (_this.layoutHelpers.BaseRow === undefined)
      //   _this.layoutHelpers.BaseRow = lh.basesPerRow;

      // if (_this.layoutHelpers.BaseRow > lh.basesPerRow) {
      //   _this.layoutHelpers.yOffsetPrevious = lh.yOffset;
      //   lh.yOffset = _this.getYPosFromBase(_this.layoutHelpers.BasePosition);
      // } else {
      //   if (_this.layoutHelpers.yOffsetPrevious !== undefined)
      //     lh.yOffset = _this.layoutHelpers.yOffsetPrevious;
      // }

      if(lh.firstBase) {
        lh.yOffset = _this.getYPosFromBase(lh.firstBase);
        lh.firstBase = undefined;
      }

      _this.$scrollingParent.scrollTop(lh.yOffset);

      _this.clearCache();

      _this.trigger('change change:layoutHelpers', lh);

      // We resize `this.$scrollingChild` and fullfills the Promise
      _this.resizeScrollHelpers().then(resolve);
    });
  };

  /**
      If `this.visible`, displays the sequence in the initiated canvas.
      @method display
  **/
  SequenceCanvas.prototype.display = function() {
    if (this.visible) {
      var artist = this.artist,
        ls = this.layoutSettings,
        lh = this.layoutHelpers,
        yOffset = lh.yOffset,
        _this = this,
        canvasHeight = ls.canvasDims.height,
        drawStart, drawEnd, moveOffset;

      return Q.promise(function(resolve, reject) {

        // Check if we have a previousYOffset reference, in which case
        // we will only redraw the missing part
        moveOffset = lh.previousYOffset !== undefined ?
          -lh.previousYOffset + yOffset :
          0;

        if (moveOffset !== 0) {
          artist.scroll(-moveOffset);

          drawStart = moveOffset > 0 ? canvasHeight - moveOffset : 0;
          drawEnd = moveOffset > 0 ? canvasHeight : -moveOffset;

          lh.previousYOffset = undefined;

        } else {

          artist.clear();
          drawStart = 0;
          drawEnd = canvasHeight;

        }

        _this.forEachRowInPosYRange(drawStart, drawEnd, _this.drawRow);

        _this.displayDeferred.resolve();
        _this.displayDeferred = Q.defer();
        resolve();

      }).catch(namedHandleError('sequence_canvas, display'));
    } else {
      return Q.reject();
    }
  };

  SequenceCanvas.prototype.drawHighlight = function(posY, baseRange) {
    var layoutHelpers = this.layoutHelpers;
    var startX = this.getXPosFromBase(baseRange[0]);
    var endX = this.getXPosFromBase(baseRange[1]);

    this.artist.rect(startX, posY, endX - startX, layoutHelpers.rows.height, {
      fillStyle: '#fcf8e3'
    });
  };

  /**
  Draw row at position posY in the canvas
  @method drawRow
  @param {integer} posY
  **/
  SequenceCanvas.prototype.drawRow = function(posY) {
    var layoutSettings = this.layoutSettings,
      lines = layoutSettings.lines,
      layoutHelpers = this.layoutHelpers,
      yOffset = layoutHelpers.yOffset,
      rowsHeight = layoutHelpers.rows.height,
      canvasHeight = layoutSettings.canvasDims.height,
      bottomMargin = layoutSettings.pageMargins.bottom,
      baseRange = this.getBaseRangeFromYPos(posY + yOffset),
      highlight = this.highlight,
      initPosY = posY;

    this.artist.clear(posY, rowsHeight);

    if(highlight !== undefined && highlight[0] <= baseRange[1] && highlight[1] >= baseRange[0]) {
      this.drawHighlight(posY, [
        Math.max(baseRange[0], highlight[0]),
        Math.min(baseRange[1], highlight[1])
      ]);
    }

    if (baseRange[0] < this.sequence.length()) {
      _.each(lines, function(line, key) {
        if (line.visible === undefined || line.visible()) {
          if(line.floating) {
            line.draw(initPosY, baseRange);
          } else {
            line.draw(posY, baseRange);
            posY += line.height;
          }
        }
      });
    }
  };

  /**
  Resizes $scrollingChild after window/parent div has been resized
  @method resizeScrollHelpers
  @return {Promise}
  **/
  SequenceCanvas.prototype.resizeScrollHelpers = function() {
    var _this = this,
      layoutHelpers = _this.layoutHelpers;
    return Q.promise(function(resolve, reject) {
      _this.$scrollingChild.height(layoutHelpers.pageDims.height);
      _this.scrollTo();
      resolve();
    });
  };

  /**
  Updates layout settings and redraws canvas
  @method refresh
  **/
  SequenceCanvas.prototype.refresh = function() {
    if (this.caretPosition !== undefined) {
      this.hideCaret();
      this.caretPosition = undefined;
    }
    this.updateCanvasDims()
      .then(this.calculateLayoutSettings)
      .then(this.redraw)
      .catch((e) => console.error(e));
  };

  /**
  Updates layout settings and redraws canvas when resizing.
  Keeps the first base the same
  @method refreshFromResize
  **/
  SequenceCanvas.prototype.refreshFromResize = function() {
    var layoutHelpers = this.layoutHelpers;

    layoutHelpers.firstBase = this.getBaseRangeFromYPos(
      this.layoutSettings.pageMargins.top +
      (layoutHelpers.yOffset || 0)
    )[0];
    this.refresh();
  };

  /**
  Redraws canvas on the next animation frame
  @method redraw
  **/
  SequenceCanvas.prototype.redraw = function() {
    return requestAnimationFrame(this.display);
  };

  SequenceCanvas.prototype.scrollTo = function(yOffset, triggerEvent) {
    var deferred = Q.defer(),
      layoutHelpers = this.layoutHelpers;

    layoutHelpers.previousYOffset = layoutHelpers.yOffset;

    if (yOffset !== undefined) {

      // this.layoutHelpers.BasePosition = this.getBaseFromXYPos(0, yOffset + this.layoutHelpers.rows.height);
      this.sequence.set('displaySettings.yOffset',
        layoutHelpers.yOffset = yOffset, {
          silent: true
        }
      );
      this.sequence.throttledSave();
    }

    this.$scrollingParent.scrollTop(layoutHelpers.yOffset);

    this.afterNextRedraw(deferred.resolve);

    this.redraw();

    if (triggerEvent !== false) {
      this.trigger('scroll');
    }

    return deferred.promise;
  };

  /**
  Make base visible (if it is below the visible part of the canvas,
  will just scroll down one row)
  @method scrollBaseToVisibility
  **/
  SequenceCanvas.prototype.scrollBaseToVisibility = function(base) {
    var distanceToVisibleCanvas = this.distanceToVisibleCanvas(base);

    if (distanceToVisibleCanvas !== 0) {
      return this.scrollTo(this.layoutHelpers.yOffset + distanceToVisibleCanvas);
    } else {
      return Q.resolve();
    }
  };

  SequenceCanvas.prototype.scrollToBase = function(base) {
    if (!this.isBaseVisible(base)) {
      var yPos = this.getYPosFromBase(base),
        maxY = this.$scrollingChild.height() - this.$scrollingParent.height();
      return this.scrollTo(Math.min(yPos, maxY));
    } else {
      return Q.resolve();
    }
  };

  SequenceCanvas.prototype.clearCache = function() {
    this.getXPosFromBase.cache = {};
    // this.getYPosFromBase.cache = {};
  };

  SequenceCanvas.prototype.afterNextRedraw = function() {
    var _this = this,
      args = _.toArray(arguments),
      func = args.shift();

    this.displayDeferred.promise.then(function() {
      func.apply(_this, args);
    });
  };

  SequenceCanvas.prototype.highlightBaseRange = function(fromBase, toBase) {
    if(fromBase === undefined) {
      this.highlight = undefined;
    } else {
      this.highlight = [fromBase, toBase];
    }

    this.refresh();
  };

  /**
  Displays the caret before a base
  @method displayCaret
  @param base [base]
  **/
  SequenceCanvas.prototype.displayCaret = function(base) {
    var layoutHelpers = this.layoutHelpers,
      lineOffsets = layoutHelpers.lineOffsets,
      yOffset = layoutHelpers.yOffset,
      _this = this,
      posX, posY;

    if (base === undefined && this.caretPosition !== undefined) {
      base = this.caretPosition;
    }

    if (base > this.sequence.length()) {
      base = this.sequence.length();
    }

    this.scrollBaseToVisibility(base).then(function() {

      posX = _this.getXPosFromBase(base);
      posY = _this.getYPosFromBase(base) + lineOffsets.dna;

      _this.caret.move(posX, posY, base);
      _this.caretPosition = base;
      _this.showContextMenuButton(posX, posY + 20);

    });

  };

  SequenceCanvas.prototype.moveCaret = function(newPosition) {
    if (this.selection) {
      this.selection = undefined;
      this.redraw();
    }
    this.displayCaret(newPosition);
  };

  SequenceCanvas.prototype.hideCaret = function(hideContextMenu) {
    this.caret.remove();
    if (hideContextMenu === true) {
      this.hideContextMenuButton();
    }
  };

  SequenceCanvas.prototype.redrawSelection = function(selection) {
    var
      lines = this.layoutSettings.lines,
      yOffset = this.layoutHelpers.yOffset,
      rowsHeight = this.layoutHelpers.rows.height,
      posY;

    //Calculating posY for baseRange
    if (selection !== undefined) {

      if (this.layoutHelpers.selectionPreviousA == undefined) {
        this.layoutHelpers.selectionPreviousA = selection[0];
      }
      if (this.layoutHelpers.selectionPreviousB == undefined) {
        this.layoutHelpers.selectionPreviousB = selection[1];
      }

      if (this.layoutHelpers.selectionPreviousA !== selection[1] || this.layoutHelpers.selectionPreviousB !== selection[0]) {

        if (this.layoutHelpers.selectionPreviousA === selection[1] - 1 || this.layoutHelpers.selectionPreviousA === selection[1] + 1) {

          posY = this.getYPosFromBase(selection[1]);
          if (this.layoutHelpers.selectionPreviousA == this.layoutHelpers.selectionPreviousB) {
            this.layoutHelpers.selectionPreB = selection[0];
          }
          this.layoutHelpers.selectionPreviousA = selection[1];
        } else if (this.layoutHelpers.selectionPreviousB === selection[0] - 1 || this.layoutHelpers.selectionPreviousB === selection[0] + 1) {

          posY = this.getYPosFromBase(selection[0]);
          if (this.layoutHelpers.selectionPreviousA == this.layoutHelpers.selectionPreviousB) {
            this.layoutHelpers.selectionPreviousA = selection[1];
          }
          this.layoutHelpers.selectionPreviousB = selection[0];
        }
      }
    }

    if(posY !== undefined) {
      this.partialRedraw(posY);
    } else {
      this.redraw();
    }
  };

  /**
  Only redraws the current row
  @method partialRedraw
  **/
  SequenceCanvas.prototype.partialRedraw = function(posY) {
    var _this = this;
    requestAnimationFrame(function() {
      _this.drawRow(posY);
    });
  };

  /**
  @method select
  **/
  SequenceCanvas.prototype.select = function(start, end) {
    var positionCheck;
    this.hideCaret();
    if (start !== undefined) {
      if (start < end) {
        this.selection = [start, end];
        this.caretPosition = end + 1;
        // positionCheck = this.caretPosition;

        // if (positionCheck > this.layoutHelpers.caretPositionBefore) {
        //   this.caretPosition = this.layoutHelpers.caretPositionBefore;
        //   if (start != this.layoutHelpers.selectionPreviousB - 1 && start != this.layoutHelpers.selectionPreviousB + 1 && start != this.layoutHelpers.selectionPreviousB)
        //     this.layoutHelpers.selectionPreviousB = this.caretPosition;
        //   if (end != this.layoutHelpers.selectionPreviousA - 1 && end != this.layoutHelpers.selectionPreviousA + 1 && end != this.layoutHelpers.selectionPreviousA)
        //     this.layoutHelpers.selectionPreviousA = this.caretPosition;
        //   positionCheck = this.caretPosition;
        // } else {
        //   this.layoutHelpers.caretPositionBefore = this.caretPosition;
        // }
      } else {
        this.selection = [end, start];
        this.caretPosition = start + 1;
      }
    } else {
      this.selection = undefined;
      this.caretPosition = undefined;
    }
    this.redraw();
  };

  SequenceCanvas.prototype.expandSelectionToNewCaret = function(newCaret) {
    var selection = this.selection,
      previousCaret = this.caretPosition;
    this.layoutHelpers.caretPositionBefore = previousCaret;

    if (selection[0] == selection[1] && (
      (previousCaret > selection[0] && newCaret == selection[0]) ||
      (previousCaret == selection[0] && newCaret == selection[0] + 1)
    )) {
      this.select(undefined);
    } else {
      if (newCaret > selection[0]) {
        if (previousCaret <= selection[0]) {
          this.select(newCaret, selection[1]);
        } else {
          this.select(selection[0], newCaret - 1);
        }
      } else {
        if (previousCaret <= selection[1] && newCaret < selection[1]) {
          this.select(newCaret, selection[1]);
        } else {
          this.select(newCaret, selection[0] - 1);
        }
      }
    }

    this.displayCaret(newCaret);
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
