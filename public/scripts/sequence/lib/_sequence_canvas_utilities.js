/**
Utility methods for SequenceCanvas
@class SequenceCanvasUtilities
**/
define(function(require) {
  var _     = require('underscore.mixed'),
      Utilities;

  Utilities = function() {};

  /**
  @method forEachRowInWindow
  @param startY {integer} start of the visibility window
  @param endY {integer} end of the visibility window
  @param 
    callback {function} function to execute for each row. 
    Will be passed the y-offset in canvas.
  */
  Utilities.prototype.forEachRowInRange = function(startY, endY, callback) {
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
  Utilities.prototype.getRowStartY = function(posY) {
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
  Utilities.prototype.getBaseRangeFromYPos = function(posY) {
    var rowNumber = Math.round((this.getRowStartY(posY) + this.layoutHelpers.yOffset) / this.layoutHelpers.rows.height),
        firstBase = rowNumber * this.layoutHelpers.basesPerRow;
    return [firstBase, firstBase + this.layoutHelpers.basesPerRow - 1];
  };

  /**
  @method getBaseFromXYPos
  @param posX {integer}
  @param posY {integer} relative y-position (in visible part of canvas)
  **/
  Utilities.prototype.getBaseFromXYPos = function(posX, posY) {
    var layoutSettings  = this.layoutSettings,
        gutterWidth     = layoutSettings.gutterWidth,
        baseRange       = this.getBaseRangeFromYPos(posY),
        baseWidth       = layoutSettings.basePairDims.width,
        basesPerBlock   = layoutSettings.basesPerBlock,
        blockSize       = baseWidth * basesPerBlock + gutterWidth,
        marginLeft      = layoutSettings.pageMargins.left,
        block           = Math.min(
                            this.layoutHelpers.basesPerRow/layoutSettings.basesPerBlock - 1,
                            Math.floor((posX - marginLeft) / blockSize)),
        adjustedPosX    = Math.min(
                            posX - marginLeft, 
                            (block + 1) * blockSize - gutterWidth);
        inBlockAbsPos   = (adjustedPosX - block * blockSize) / baseWidth,
        inBlockPos      = Math.floor(inBlockAbsPos),
        nextBase        = + (inBlockAbsPos - inBlockPos > 0.5);

    return baseRange[0] + block * basesPerBlock + inBlockPos + nextBase;
  };

  /**
  @method getXPosFromBase
  **/
  Utilities.prototype.getXPosFromBase = _.memoize2(function(base) {
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
  @returns posY {integer} ABSOLUTE y-position of the ROW (regardless of yOffset of canvas)
  **/
  Utilities.prototype.getYPosFromBase = function(base) {
    var layoutSettings = this.layoutSettings,
        layoutHelpers = this.layoutHelpers,
        rowNb = Math.floor(base / layoutHelpers.basesPerRow),
        topMargin = layoutSettings.pageMargins.top;

    return layoutHelpers.rows.height * rowNb + topMargin;
  };

  Utilities.prototype.distanceToVisibleCanvas = function(base) {
    var layoutHelpers = this.layoutHelpers,
        yPos = this.getYPosFromBase(base) - layoutHelpers.yOffset;

    return  Math.max(0, yPos - this.$scrollingParent.height() + layoutHelpers.rows.height) + 
            Math.min(0, yPos);
  };

  Utilities.prototype.isBaseVisible = function(base) {
    return this.distanceToVisibleCanvas(base) === 0;
  };

  Utilities.prototype.maxVisibleBase = function() {
    var layoutHelpers = this.layoutHelpers;
    return layoutHelpers.rows.total * layoutHelpers.basesPerRow - 1;
  };

  return Utilities;
});