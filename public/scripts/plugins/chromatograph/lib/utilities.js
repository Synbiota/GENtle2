/**
Utility methods for SequenceCanvas
@class SequenceCanvasUtilities
**/
class Utilities {
  /**
   * Pseudo-constructor called when mixed in
   * @method _init
   */
  _init(options) {
    this.memoize('getXPosFromBase', 'change', options.sequence);
  }

  /**
  @method forEachRowInPosYRange
  @param startY {integer} start of the visibility window
  @param endY {integer} end of the visibility window
  @param
    callback {function} function to execute for each row.
    Will be passed the y-offset in canvas.
  */
  // forEachRowInPosYRange(startY, endY, callback) {
  //   var layoutSettings = this.layoutSettings,
  //       layoutHelpers = this.layoutHelpers,
  //       pageMargins = layoutSettings.pageMargins,
  //       firstRowStartY  = this.getRowStartY(Math.max(startY + layoutHelpers.yOffset, pageMargins.top)) - layoutHelpers.yOffset,
  //       lastRowY = Math.min(endY, layoutSettings.canvasDims.height);

  //   for(var y = firstRowStartY;
  //       y < lastRowY;
  //       y += this.layoutHelpers.rows.height)
  //     callback.call(this, y);
  // }

  /**
  @method getRowStartX
  @param posY {integer} Y position (relative to sequence)
  @return {integer} Y-start of the row (relative to sequence)
  **/
  // getRowStartY(posY) {
  //   var layoutHelpers = this.layoutHelpers,
  //       rowsHeight = layoutHelpers.rows.height,
  //       marginTop = this.layoutSettings.pageMargins.top;

  //   return this.getRowFromYPos(posY) * rowsHeight + marginTop;
  // }

  /**
  @method getRowFromYPos
  @param posY {integer} (relative to sequence)
  **/
  getRowFromYPos(posY) {
    var layoutHelpers = this.layoutHelpers,
        rowsHeight = layoutHelpers.rows.height,
        marginTop = this.layoutSettings.pageMargins.top;

    return Math.floor(
      (posY - marginTop) /
      rowsHeight
    );
  }

  /**
  @method getRowFromYPos
  @param posY {integer} (relative to sequence)
  **/
  // getAbsRowFromYPos(posY) {
  //   var yOffset = this.layoutHelpers.yOffset || 0;
  //   return this.getRowFromYPos(posY + yOffset);
  // }


  /**
  @method getBaseRangeFromYPos
  @param posY {integer} Y position in the canvas
  @return {Array} First and last bases in the row at the y-pos
  **/
  getBaseRangeFromYPos(posY) {
    var rowNumber = this.getRowFromYPos(posY),
        firstBase = rowNumber * this.layoutHelpers.basesPerRow;
    return [firstBase, firstBase + this.layoutHelpers.basesPerRow - 1];
  }

  /**
  @method getBaseFromXYPos
  @param posX {integer}
  @param posY {integer} (relative to sequence)
  **/
  getBaseFromXYPos(posX, posY) {
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
                            (block + 1) * blockSize - gutterWidth),
        inBlockAbsPos   = (adjustedPosX - block * blockSize) / baseWidth,
        inBlockPos      = Math.floor(inBlockAbsPos),
        nextBase        = + (inBlockAbsPos - inBlockPos > 0.5);

    return Math.min(
      baseRange[1],
      baseRange[0] + block * basesPerBlock + inBlockPos + nextBase
    );
  }

  /**
  @method getXPosFromBase
  **/
  // getXPosFromBase(base) {
  //   var layoutSettings = this.layoutSettings,
  //       layoutHelpers = this.layoutHelpers,
  //       firstBaseInRange = base - base % layoutHelpers.basesPerRow,
  //       deltaBase = base - firstBaseInRange,
  //       nbGutters = (deltaBase - deltaBase % layoutSettings.basesPerBlock) / layoutSettings.basesPerBlock;

  //   return layoutSettings.pageMargins.left +
  //     deltaBase * layoutSettings.basePairDims.width +
  //     nbGutters * layoutSettings.gutterWidth;
  // }

  getXPosFromBase(base) {
    return base * this.layoutSettings.basePairDims.width;
  }

  /**
  @method getYPosFromBase
  @returns posY {integer} ABSOLUTE y-position of the ROW (regardless of yOffset of canvas)
  **/
  getYPosFromBase(base) {
    var layoutSettings = this.layoutSettings,
        layoutHelpers = this.layoutHelpers,
        rowNb = Math.floor(base / layoutHelpers.basesPerRow),
        topMargin = layoutSettings.pageMargins.top;

    return layoutHelpers.rows.height * rowNb + topMargin;
  }

  // distanceToVisibleCanvas(base) {
  //   var layoutHelpers = this.layoutHelpers,
  //       yPos = this.getYPosFromBase(base) - layoutHelpers.yOffset;

  //   return  Math.max(0, yPos - this.$scrollingParent.height() + layoutHelpers.rows.height) +
  //           Math.min(0, yPos);
  // }

  distanceToVisibleCanvas(base) {
    var layoutHelpers = this.layoutHelpers,
        layoutSettings = this.layoutSettings,
        x = base * this.layoutSettings.basePairDims.width - layoutHelpers.xOffset - layoutSettings.canvasDims.width;

    return  Math.max(0, x - this.$scrollingParent.width()) +
            Math.min(0, x);
  }

  isBaseVisible(base) {
    return this.distanceToVisibleCanvas(base) === 0;
  }

  maxVisibleBase() {
    var layoutHelpers = this.layoutHelpers;
    return layoutHelpers.rows.total * layoutHelpers.basesPerRow - 1;
  }
}

export default Utilities;
