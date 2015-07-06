import Q from 'q';
import $ from 'jquery';
import _ from 'underscore';

import template from './template.html';

import Artist from '../../common/lib/graphics/artist';
import CopyPasteHandler from '../../common/lib/copy_paste_handler';

import Rows from './rows';
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
      'display2d',
      'addLines',
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

    this.$canvas = $container.find('canvas');

    /**
     * Object containing all lines
     * @type {Object<Lines>}
     * @property lines
     */
    // this.lines = this._initLines(options.lines);
    this.lines = {};
    this.lineId = 0;
    this.addLines(options.lines)

    this.rows = [];
    // this.rows = {};
    this.rowId = 0;
    this.addRows(options.rows);


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
        width: 20,
        height: 15
      }
    });

    /**
     * @property {Object} layoutHelpers Calculated layout properties
     */
    this.layoutHelpers = {
      xOffset: options.xOffset || 0,
      yOffset: options.yOffset || 0
    };

    this.artist = new Artist(this.$canvas);
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

  // _initLines(lines) {
  //   assertIsObject(lines, 'options.lines');
  //   return _.mapObject(lines, (value) => {
  //     return new Lines[value[0]](this, value[1] || {});
  //   });
  // }

  addLines(newLines) {

    var _this = this;

    _.forEach(newLines, function([key, value]){
      _this.lines[key + _this.lineId] = new Lines[key](_this, value || {})
      _this.lineId++;
    })

  }

  addRows(newRows) {

    var _this = this;

    _.forEach(newRows, function([key, value]){
      // _this.rows[key + _this.rowId] = new Rows[key](_this, value || {})
      _this.rows.push(new Rows[key](_this, value || {}))
      _this.rowId++;
    })

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
      // this.$canvas.width(this.$scrollingChild.width());

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
    // var line_offset = _.values(this.lines)[0].height;
    var line_offset = 40;
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
        // width: ls.canvasDims.width,
        width: (this.sequence.getLength() * ls.basePairDims.width) + ls.pageMargins.left + ls.pageMargins.right,
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

      // TEMPORARY HARDCODE
      lh.rows.height = 95;

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
    var endX = this.getXPosFromBase(baseRange[1]);

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
      rowHeight = layoutHelpers.rows.height,
      canvasWidth = layoutSettings.canvasDims.width,
      baseRange = this.getBaseRangeFromYPos(posY + yOffset),
      highlight = this.highlight,
      initPosY = posY;

    this.artist.rect(0, posY, canvasWidth, rowHeight, {
      fillStyle: '#fff'
    });


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

  // drawRowSegment(type, x, y, baseRange){
  //   var
  //       // lines = this.getLines(type),
  //       artist = this.artist,
  //       ls = this.layoutSettings,
  //       baseWidth = ls.basePairDims.width,
  //       lines = this.lines,
  //       lineOffset = 0;


  //   this.rows['Consensus0'].draw(x, y, baseRange)

  //   // if (baseRange[0] < this.sequence.getLength()) {
  //   //   artist.clear(x, y, (baseRange[1] - baseRange[0]) * baseWidth, ls.canvasDims.height - y)
  //   //   _.each(lines, function(line) {
  //   //     if (line.visible === undefined || line.visible()) {
  //   //       if(line.floating) {
  //   //         line.draw(x, y, baseRange);
  //   //       } else {
  //   //         line.draw(x, y + lineOffset, baseRange);
  //   //         lineOffset += line.height;
  //   //       }
  //   //     }
  //   //   });
  //   // }
  // }

  display2d() {
    var artist = this.artist,
      ls = this.layoutSettings,
      lh = this.layoutHelpers,
      yOffset = lh.yOffset,
      _this = this,
      canvasDims = [ls.canvasDims.width, ls.canvasDims.height],
      drawStart, drawEnd, moveOffset;

    return Q.promise(function(resolve, reject) {
      // Determine draw area
      moveOffset = [
        lh.previousXOffset !== undefined ?
                -lh.previousXOffset + lh.xOffset :
                0,
        lh.previousYOffset !== undefined ?
                -lh.previousYOffset + lh.yOffset :
                0
      ]

      if ((moveOffset[0] != 0) || (moveOffset[1] != 0)) {
        // artist.scroll.apply(artist, moveOffset);
        artist.scroll(-moveOffset[0], -moveOffset[1])


        drawStart = _.map(moveOffset, function(n, i){
          return n > 0 ? canvasDims[i] - n : 0;
        })

        drawEnd = _.map(moveOffset, function(n, i){
          return n >= 0 ? canvasDims[i] : -n;
        })

      } else {
        artist.clear();

        drawStart = [0, 0];
        drawEnd = canvasDims;
      }

      console.log('moveOffset', moveOffset, 'drawStart', drawStart, 'drawEnd', drawEnd)

      // Quantify area into blocks and draw
      _this.forEachBlockInRange(drawStart, drawEnd, _this.drawBlock)


      _this.displayDeferred.resolve();
      _this.displayDeferred = Q.defer();
      resolve();


    }).catch(namedHandleError('sequence_canvas, display2d'));
  }

  /**
  @method forEachRowInPosYRange
  @param startY {integer} start of the visibility window
  @param endY {integer} end of the visibility window
  @param
    callback {function} function to execute for each row.
    Will be passed the y-offset in canvas.
  */
  forEachBlockInRange(start, end, callback) {
    var layoutSettings = this.layoutSettings,
        layoutHelpers = this.layoutHelpers,
        blockDims = [layoutSettings.basePairDims.width, layoutHelpers.rows.height],
        pageMargins = layoutSettings.pageMargins,
        offset = [layoutHelpers.xOffset, layoutHelpers.yOffset],
        drawStart, drawEnd


        // firstRowStartY  = this.getRowStartY(Math.max(startY + layoutHelpers.yOffset, pageMargins.top)) - layoutHelpers.yOffset,
        // lastRowY = Math.min(endY, layoutSettings.canvasDims.height);

    // Quantify coordinates and dimensions in increments of grid values (width in baseWidth, height in rowHeight)
    // rowHeight constant for now for the sake of scrolling, figure out variable height later.

    drawStart = _.map(start, function(n, i){
      return Math.floor( (n + offset[i])/blockDims[i]) * blockDims[i] - offset[i];
    })

    drawEnd = _.map(end, function(n, i){
      return Math.ceil((n + offset[i])/blockDims[i]) * blockDims[i] - offset[i];
    })

    var width = drawEnd[0] - drawStart[0],
        height = drawEnd[1] - drawStart[1];
    var x = drawStart[0]
    var y = drawStart[1]


    console.log('fbrange', 'start/end', start, end, 'drawStart/End', drawStart, drawEnd, 'width', width)

    callback.call(this, x, y, width, height)


    // for (var i = 0; i < numRows; i++){
    //   console.log(i, numRows, rowOffset, y + i * rowHeight,  this.rows[rowOffset + i], drawStart[1])
    //   callback.call(this, rowOffset + i, x, y + i * rowHeight, width)
    // }

    // for (var y = drawStart[1]; y < drawEnd[1]; y += blockDims[1]){
    //   // Determine which row

    //   // render the row
    //   callback.call(this,x, y, width)

    // }


    // firstRowStartY  = this.getRowStartY(Math.max(startY + layoutHelpers.yOffset, pageMargins.top)) - layoutHelpers.yOffset,
    // lastRowY = Math.min(endY, layoutSettings.canvasDims.height);

    // for(var y = firstRowStartY;
    //     y < lastRowY;
    //     y += this.layoutHelpers.rows.height)
    //   callback.call(this, y);

  }

  /**
   * draw a block at a given x, y coordinate on the canvas.
   * @method drawBlock
   * @param  {Integer} x [description]
   * @param  {Integer} y [description]
   */
  drawBlock(x, y, width, height){
    var layoutHelpers = this.layoutHelpers,
        layoutSettings = this.layoutSettings,
        baseWidth = layoutSettings.basePairDims.width,
        rowHeight = layoutHelpers.rows.height,
        rows = this.rows,
        visibleRows = [],
        baseRange, rowOffset = 0;

    // x = Math.floor(x/baseWidth);
    // y = Math.floor(y/rowHeight);

    // width = Math.ceil(width/baseWidth);
    // height = Math.ceil(height/rowHeight);

    // convert width to baseRange
    // baseRange = this.getBaseRangeFromXPos(x, width);
    // baseRange = [0, 20]


    baseRange = [
      Math.floor((x + layoutHelpers.xOffset)/baseWidth),
      Math.floor((x + layoutHelpers.xOffset + width)/baseWidth)
    ]

    // this.drawRowSegment(null, x, y, baseRange);

    // determine which rows we need to render
    // slice values should be integers since we quantify them beforehand
    // visibleRows = rows.slice(y/rowHeight, (y + height)/rowHeight);
    // visibleRows = rows

    // this.artist.clear(x, y, (baseRange[1] - baseRange[0]) * baseWidth, layoutSettings.canvasDims.height - y)



    if (layoutHelpers.xOffset){
      this.artist.clear(x, 0, (baseRange[1] - baseRange[0]) * baseWidth, layoutSettings.canvasDims.height)
    } else if (layoutHelpers.yOffset) {
      this.artist.clear(0, y, layoutSettings.canvasDims.width, y + layoutHelpers.yOffset)
    }

    var rowOffset = Math.floor((y + layoutHelpers.yOffset)/rowHeight);
    var numRows = Math.min(this.rows.length, Math.floor(height/rowHeight))

    visibleRows = this.rows.slice(rowOffset, numRows);

    // draw the row segment
    _.forEach(visibleRows, function(row){

      var xOffset = 0;

      if (row.sequence && row.sequence.map){
        var position = row.sequence.map.best().position;
        var relativePosition = baseRange[0] - position;

        if (relativePosition < 0) {
          xOffset -= relativePosition * baseWidth;
        }

        baseRange[0] = Math.max(baseRange[0] - position, 0);
        baseRange[1] = Math.max(baseRange[1] - position, 0);

      }

      row.draw(x + xOffset, y + rowOffset, baseRange);
      rowOffset += row.height;
    });

  }

  /**
  Resizes $scrollingChild after window/parent div has been resized
  @method resizeScrollHelpers
  @return {Promise}
  **/
  resizeScrollHelpers() {
    var layoutHelpers = this.layoutHelpers;
    return Q.promise((resolve) => {
      this.$scrollingChild.width(layoutHelpers.pageDims.width)
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
    // requestAnimationFrame(this.display);
    requestAnimationFrame(this.display2d);
    return this.displayDeferred.promise;
  }



  scrollTo(xOffset, yOffset) {
    this.$scrollingParent.scrollLeft(xOffset);
    // this.$scrollingParent.scrollTop(yOffset);
  }

  onScroll(xOffset, yOffset, triggerEvent) {

    var deferred = Q.defer(),
      layoutHelpers = this.layoutHelpers;

    layoutHelpers.previousXOffset = layoutHelpers.xOffset || 0;
    layoutHelpers.previousYOffset = layoutHelpers.yOffset || 0;

    if (xOffset !== undefined) {
      layoutHelpers.xOffset = xOffset;
    }

    if (yOffset !== undefined) {
      layoutHelpers.yOffset = yOffset;

      // this.layoutHelpers.BasePosition = this.getBaseFromXYPos(0, yOffset + this.layoutHelpers.rows.height);
      // this.sequence.set('displaySettings.yOffset',
      //   layoutHelpers.yOffset = yOffset, {
      //     silent: true
      //   }
      // );
      // this.sequence.throttledSave();
    }

    this.$scrollingParent.scrollLeft(layoutHelpers.xOffset);
    // this.$scrollingParent.scrollTop(layoutHelpers.yOffset);

    this.afterNextRedraw(deferred.resolve);

    this.redraw();

    if (triggerEvent !== false) {
      this.trigger('scroll', {xOffset, yOffset});
    }

    return deferred.promise;
  }

  /**
  Make base visible (if it is below the visible part of the canvas,
  will just scroll down one row)
  @method scrollBaseToVisibility
  **/
  scrollBaseToVisibility(base) {
    var distanceToVisibleCanvas = this.distanceToVisibleCanvas1(base);

    console.log(distanceToVisibleCanvas, this.layoutHelpers.xOffset, this.layoutHelpers.xOffset + distanceToVisibleCanvas)

    if (distanceToVisibleCanvas !== 0) {
      return this.scrollTo(this.layoutHelpers.xOffset + distanceToVisibleCanvas);
    } else {
      return Q.resolve();
    }
  }

  // UTILITY OVERWRITE
  getXPosFromBase(base) {
    console.log('abc', base * this.layoutSettings.basePairDims.width)
    return base * this.layoutSettings.basePairDims.width
  }

  // UTILITY OVERWRITE
  distanceToVisibleCanvas1(base) {
    var layoutHelpers = this.layoutHelpers,
        layoutSettings = this.layoutSettings,
        x = base * this.layoutSettings.basePairDims.width - layoutHelpers.xOffset - layoutSettings.canvasDims.width;

    return  Math.max(0, x - this.$scrollingParent.width()) +
            Math.min(0, x);
  }

  scrollToBase(base) {
    var ls = this.layoutSettings,
        lh = this.layoutHelpers

    var absoluteDistance = base * ls.basePairDims.width,
        relativeDistance = absoluteDistance - lh.xOffset,
        isVisible = (relativeDistance > 0) && (relativeDistance < ls.canvasDims.width)

    if (!isVisible) {
      return this.scrollTo(absoluteDistance);
    } else {
      return Q.resolve();
    }
  }

  clearCache() {
    this.getXPosFromBase.cache = {};
    // this.getYPosFromBase.cache = {};
  }

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

    this.refresh();
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


}

export default SequenceCanvasCore;
