import Q from 'q';
import $ from 'jquery';
import _ from 'underscore';
import svg from 'svg.js';

import template from './template.html';

import Artist from '../../common/lib/graphics/artist';
import CopyPasteHandler from '../../common/lib/copy_paste_handler';

import Lines from './lines';
import Caret from './caret';

import {namedHandleError} from '../../common/lib/handle_error';
import {assertIsDefinedAndNotNull, assertIsObject} from '../../common/lib/testing_utils';
import tracedLog from '../../common/lib/traced_log';
import defineMethod from 'gentle-utils/define_method';

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
class SequenceCanvasCore {
  _init(options = {}) {

    // Context binding (context is lost in Promises' `.then` and `.done`)
    _.bindAll(this, 
      'calculateLayoutSettings',
      'updateCanvasDims',
      'redrawSelection',
      'display',
      'refresh',
      'refreshFromResize',
      'redraw',
      'afterNextRedraw'
    );

    this.id = _.uniqueId();

    this._mixinJqueryEvents();

    /**
      Sequence to be displayed
      @property sequence
      @type Sequence (Backbone.Model)
      @default `this.view.model`
    **/
    var sequence = this.sequence = options.sequence;
    assertIsDefinedAndNotNull(sequence, 'options.sequence');

    /**
        DOM container element as a jQuery object
        @property container
        @type jQuery object
    **/
    var $container = this.$container = this._initContainer(options.container);

    /**
        Invisible DIV used to handle scrolling.
        As high as the total virtual height of the sequence as displayed.
        @property $scrollingChild
        @type jQuery object
    **/
    this.$scrollingChild = $container.find('.scrolling-child');

    /**
        Div in which `this.$scrollingChild` will scroll.
        Same height as `this.$canvas`
        @property $scrollingParent
        @type jQuery object
    **/
    this.$scrollingParent = $container.find('.scrolling-parent');

    this.$childrenContainer = $container.find('.children-container');

    this.$canvas = $container.find('canvas');

    /**
     * Object containing all lines
     * @type {Object<Lines>}
     * @property lines
     */
    this.lines = this._initLines(options.lines);

    /**
        @property layoutSettings
        @type Object
        @default false
    **/
    this.layoutSettings = _.defaults(options.layoutSettings || {}, {
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
      gutterWidth: 0,
      basesPerBlock: 10,
      basePairDims: {
        width: 10,
        height: 15
      }
    });

    /**
     * @property {Object} layoutHelpers Calculated layout properties
     */
    this.layoutHelpers = {
      yOffset: options.yOffset || 0
    };

    this.artist = new Artist(this.$canvas);
    this.svg = svg(this.$scrollingChild[0]);

    this.caret = new Caret({
      $container: this.$scrollingChild,
      className: 'sequence-canvas-caret',
      blinking: true
    });
    this.allowedInputChars = ['A', 'T', 'C', 'G'];
    this.displayDeferred = Q.defer();
    this.copyPasteHandler = new CopyPasteHandler();

    this.editable = _.isUndefined(options.editable) ? true : options.editable;
    this.selectable = _.isUndefined(options.selectable) ? true : options.selectable;
    this.scrollable = _.isUndefined(options.scrollable) ? true : options.scrollable;

    if(!this.selectable && this.editable) {
      throw new Error('SequenceCanvas cannot be both non-selectable and editable');
    }

    if(this.selectable) {
      this.setCursorStyle('text');
    }

    // Events
    this.sequence.on('change:sequence change:features.* change:features', this.refresh);

    // Kickstart rendering
    this.refresh();
  }

  /**
   * Converts `$container` into a jQuery object if necessary and insert relevant
   * scrolling helper elements in it.
   * @param  {Element, Node or $ object} $container DOM element in which to 
   *                        insert the necessary elements
   * @return {$ object} container as instance of $
   */
  _initContainer($container) {
    assertIsDefinedAndNotNull($container, 'options.container');
    $container = $container instanceof $ ? $container : $($container);

    $container
      .addClass('sequence-canvas-wrapper')
      .css({userSelect: 'none'})
      .html(template({id: this.id}));

    return $container;
  } 

  _initLines(lines) {
    assertIsObject(lines, 'options.lines');
    return _.mapObject(lines, ([lineConstructorName, lineOptions], lineName) => {
      return new Lines[lineConstructorName](this, _.extend(lineOptions || {}, {
        lineName: lineName
      }));
    });
  }

  _mixinJqueryEvents() {
    var $el = $(this);
    _.each(['on', 'off', 'one', 'trigger'], (fnName) => {
      defineMethod(this, fnName, _.bind($el[fnName], $el));
    });

    defineMethod(this, 'once', this.one);
    defineMethod(this, 'emit', this.trigger);
  }

  /**
      Updates Canvas Dimemnsions based on viewport.
      @method updateCanvasDims
      @returns {Promise} a Promise finished when this and `this.calculateLayoutSettings` are finished
  **/
  updateCanvasDims() {
    return Q.promise((resolve) => {

      // Updates width of $canvas to take scrollbar of $scrollingParent into account
      this.$canvas.width(this.$scrollingChild.width());

      var width = this.$canvas[0].scrollWidth,
        height = this.$canvas[0].scrollHeight;
      this.layoutSettings.canvasDims.width = width;
      this.layoutSettings.canvasDims.height = height;

      this.artist.setDimensions(width, height);

      resolve();
    });
  }

  /**
      Calculate "helper" layout settings based on already set layout settings
      @method calculateLayoutSettings
      @returns {Promise} a Promise fulfilled when finished
  **/
  calculateLayoutSettings() {
    //line offsets
    var line_offset = _.values(this.lines)[0].height;
    var ls = this.layoutSettings;
    var lh = this.layoutHelpers;

    return Q.promise((resolve) => {

      //basesPerRow
      var blocks_per_row = Math.floor((ls.canvasDims.width + ls.gutterWidth - (ls.pageMargins.left + ls.pageMargins.right)) / (ls.basesPerBlock * ls.basePairDims.width + ls.gutterWidth));
      if (blocks_per_row !== 0) {
        lh.basesPerRow = ls.basesPerBlock * blocks_per_row;
      } else {
        lh.basesPerRow = Math.floor((ls.canvasDims.width + ls.gutterWidth - (ls.pageMargins.left + ls.pageMargins.right)) / ls.basePairDims.width);
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
      _.each(this.lines, function(line, lineName) {
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
      lh.rows.total = Math.ceil(this.sequence.getLength() / lh.basesPerRow);
      // number of visible rows in canvas
      lh.rows.visible = Math.ceil(ls.canvasDims.height / lh.rows.height);

      //page dims
      lh.pageDims = {
        width: ls.canvasDims.width,
        height: ls.pageMargins.top + ls.pageMargins.bottom + lh.rows.total * lh.rows.height
      };


      // if (this.layoutHelpers.BasePosition === undefined)
      //   this.layoutHelpers.BasePosition = this.getBaseFromXYPos(0, lh.yOffset + lh.rows.height);

      // if (this.layoutHelpers.BaseRow === undefined)
      //   this.layoutHelpers.BaseRow = lh.basesPerRow;

      // if (this.layoutHelpers.BaseRow > lh.basesPerRow) {
      //   this.layoutHelpers.yOffsetPrevious = lh.yOffset;
      //   lh.yOffset = this.getYPosFromBase(this.layoutHelpers.BasePosition);
      // } else {
      //   if (this.layoutHelpers.yOffsetPrevious !== undefined)
      //     lh.yOffset = this.layoutHelpers.yOffsetPrevious;
      // }

      if(lh.firstBase) {
        lh.yOffset = this.getYPosFromBase(lh.firstBase);
        lh.firstBase = undefined;
      }

      this.$scrollingParent.scrollTop(lh.yOffset);

      this.trigger('change:layoutHelpers', lh);


      // We resize `this.$scrollingChild` and fullfills the Promise
      this.resizeScrollHelpers().then(resolve).done();

    });
  }

  /**
      Displays the sequence in the initiated canvas.
      @method display
  **/
  display() {
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

        // let rowStart = _this.getRowFromYPos(drawStart);
        // let rowEnd = _this.getRowFromYPos(drawEnd);
        // for(let i = rowStart; i <= rowEnd; i++) {
        //   let rowGroup = svg.get(`svg-row-${i}`);
        //   if(rowGroup) rowGroup.remove();
        // }

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
  }

  drawHighlight(posY, baseRange) {
    var layoutHelpers = this.layoutHelpers;
    var startX = this.getXPosFromBase(baseRange[0]);
    var endX = this.getXPosFromBase(baseRange[1]) + this.layoutSettings.basePairDims.width;

    this.artist.rect(startX, posY, endX - startX, layoutHelpers.rows.height, {
      fillStyle: '#fcf8e3'
    });
  }

  /**
  Draw row at position posY in the canvas
  @method drawRow
  @param {integer} posY
  **/
  drawRow(posY) {
    var layoutSettings = this.layoutSettings,
      lines = this.lines,
      layoutHelpers = this.layoutHelpers,
      yOffset = layoutHelpers.yOffset,
      rowsHeight = layoutHelpers.rows.height,
      canvasWidth = layoutSettings.canvasDims.width,
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

    if (baseRange[0] < this.sequence.getLength()) {
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
  }

  /**
  Resizes $scrollingChild after window/parent div has been resized
  @method resizeScrollHelpers
  @return {Promise}
  **/
  resizeScrollHelpers() {
    var layoutHelpers = this.layoutHelpers;
    return Q.promise((resolve) => {
      this.$scrollingChild.height(layoutHelpers.pageDims.height);
      this.scrollTo();
      resolve();
    });
  }

  /**
  Updates layout settings and redraws canvas
  @method refresh
  **/
  refresh() {
    if (this.caretPosition !== undefined) {
      this.hideCaret();
      this.caretPosition = undefined;
    }
    this.updateCanvasDims()
      .then(this.calculateLayoutSettings)
      .then(() => {
        this.clearCache();
        this.svg.clear();
        this.$childrenContainer.empty();
      })
      .then(this.redraw)
      .done();
  }

  /**
  Updates layout settings and redraws canvas when resizing.
  Keeps the first base the same
  @method refreshFromResize
  **/
  refreshFromResize() {
    var layoutHelpers = this.layoutHelpers;

    layoutHelpers.firstBase = this.getBaseRangeFromYPos(
      this.layoutSettings.pageMargins.top +
      (layoutHelpers.yOffset || 0)
    )[0];
    this.refresh();
  }

  /**
  Redraws canvas on the next animation frame
  @method redraw
  **/
  redraw() {
    requestAnimationFrame(this.display);
    return this.displayDeferred.promise;
  }

  scrollTo(yOffset, triggerEvent) {
    var deferred = Q.defer(),
      layoutHelpers = this.layoutHelpers;

    layoutHelpers.previousYOffset = layoutHelpers.yOffset || 0;

    if (yOffset !== undefined) {
      layoutHelpers.yOffset = yOffset;

      this.layoutHelpers.BasePosition = this.getBaseFromXYPos(0, yOffset + this.layoutHelpers.rows.height);
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
      this.trigger('scroll', {yOffset});
    }

    return deferred.promise;
  }

  /**
  Make base visible (if it is below the visible part of the canvas,
  will just scroll down one row)
  @method scrollBaseToVisibility
  **/
  scrollBaseToVisibility(base) {
    var distanceToVisibleCanvas = this.distanceToVisibleCanvas(base);
    var distance = 0;
    var buffer = this.$scrollingParent.height()/2;
 
     if (distanceToVisibleCanvas !== 0) {
      distance = this.layoutHelpers.yOffset + distanceToVisibleCanvas;
      distance += (distanceToVisibleCanvas > 0) ? buffer : -buffer;

      return this.scrollTo(distance);
     } else {
       return Q.resolve();
     }
  }

  scrollToBase(base) {
    if (!this.isBaseVisible(base)) {
      var yPos = this.getYPosFromBase(base),
        maxY = this.$scrollingChild.height() - this.$scrollingParent.height();
      return this.scrollTo(Math.min(yPos, maxY));
    } else {
      return Q.resolve();
    }
  }

  // clearCache() {
  //   this.getXPosFromBase.cache = {};
  //   // this.getYPosFromBase.cache = {};
  // }

  afterNextRedraw() {
    var _this = this,
      args = _.toArray(arguments),
      func = args.shift();

    this.displayDeferred.promise.then(function() {
      func.apply(_this, args);
    });
  }

  highlightBaseRange(fromBase, toBase) {
    if(fromBase === undefined) {
      this.highlight = undefined;
    } else {
      this.highlight = [fromBase, toBase];
    }

    this.display();
  }

  /**
  Displays the caret before a base
  @method displayCaret
  @param base [base]
  **/
  displayCaret(base) {
    var layoutHelpers = this.layoutHelpers,
      lineOffsets = layoutHelpers.lineOffsets,
      selection = this.selection,
      posX, posY;

    if (_.isUndefined(base) && !_.isUndefined(this.caretPosition)) {
      base = this.caretPosition;
    }

    if(_.isUndefined(base)) return false;

    base = this.sequence.ensureBaseIsEditable(base);

    this.scrollBaseToVisibility(base).then(() => {

      if(_.isArray(selection) && selection[1] % layoutHelpers.basesPerRow === layoutHelpers.basesPerRow -1) {
        posX = this.getXPosFromBase(base - 1) + this.layoutSettings.basePairDims.width;
        posY = this.getYPosFromBase(base - 1) + lineOffsets.dna;
      } else {
        posX = this.getXPosFromBase(base);
        posY = this.getYPosFromBase(base) + lineOffsets.dna;
      }

      this.caret.move(posX, posY, base);
      this.caretPosition = base;
      this.caret.setInfo(this.determineCaretInfo());
      this.trigger('caret:show', {x: posX, y: posY, base: base, selection: !!this.selection});

      if(this.selection) {
        this.caret.hideHighlight();
      } else {
        this.caret.showHighlight();
      }
    }).done();

  }

  determineCaretInfo() {
    var info = "";
    var toString = (num) => _.formatThousands(num).toString();

    if(this.selection) {
      var start = this.selection[0]+1;
      var end = this.selection[1]+1;
      var size = (end - start);

      if(size===0) {
        info = toString(start) + " (1 bp)";
      } else {
        info = toString(start) + " to " + toString(end) + " (" + toString(size+1) +  " bp)";
      }
      
    } else {
      info = toString(this.caretPosition + 1);
    }

    return info;
  }

  moveCaret(newPosition) {
    if (this.selection) {
      this.selection = undefined;
      this.redraw();
    }
    this.displayCaret(newPosition);
  }

  // hideCaret(hideContextMenu) {
  hideCaret() {
    this.caret.remove();
    this.trigger('caret:hide');
    // if (hideContextMenu === true) {
    //   this.hideContextMenuButton();
    // }
  }

  redrawSelection(selection) {
    var posY;

    //Calculating posY for baseRange
    if (selection !== undefined) {

      if (this.layoutHelpers.selectionPreviousA === undefined) {
        this.layoutHelpers.selectionPreviousA = selection[0];
      }
      if (this.layoutHelpers.selectionPreviousB === undefined) {
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
  }

  /**
  Only redraws the current row
  @method partialRedraw
  **/
  partialRedraw(posY) {
    var _this = this;
    requestAnimationFrame(function() {
      _this.drawRow(posY);
    });
  }

  /**
  @method select
  **/
  select(start, end) {
    this.hideCaret();
    if (start !== undefined) {
      if (start <= end) {
        this.selection = [start, end];
        this.caretPosition = end + 1;
      } else {
        this.selection = [end, start];
        this.caretPosition = start;
      }
    } else {
      this.selection = undefined;
      this.caretPosition = undefined;
    }
    this.redraw();
  }

  /** 
   * @method selectRange
   * @param {Range} range 
   * @return {Undefined}
   */
  selectRange(range) {
    if(range.size) {
      this.select(range.from, range.to - 1);
    } else {
      this.selection = undefined;
    }
  }

  expandSelectionToNewCaret(newCaret) {
    var selection = this.selection,
      previousCaret = this.caretPosition;
    this.layoutHelpers.caretPositionBefore = previousCaret;

    if (selection[0] === selection[1] && (
      (previousCaret > selection[0] && newCaret === selection[0]) ||
      (previousCaret === selection[0] && newCaret === selection[0] + 1)
    )) {
      this.select(undefined);
    } else {
      if (newCaret > selection[0]) {
        if (previousCaret <= selection[0]) {
          this.select(newCaret - 1, selection[1]);
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
  }

  cleanPastedText(text) {
    var regexp = new RegExp('[^' + this.allowedInputChars.join('') + ']', 'g');
    return text.toUpperCase().replace(regexp, '');
  }

  focus() {
    this.$scrollingParent.focus();
  }

  setCursorStyle(style) { 
    this.$scrollingParent.css({
      cursor: style
    });
  } 

  destroy() {
    this.sequence.off(null, this.refresh);
    this.cleanupMemoized();
    _.each(this.lines, line => line.cleanupMemoized());
  }
}


export default SequenceCanvasCore;
