/**
Event handlers for SequenceCanvas
@class SequenceCanvasHandlers
**/
define(function(require) {
  var Hotkeys = require('../../common/lib/hotkeys'),
    Handlers;

  Handlers = function() {};

  /**
  Handles keystrokes on keypress events (used for inputs)
  @method handleKeypress
  @param event [event] Keypress event
  **/
  Handlers.prototype.handleKeypress = function(event) {
    event.preventDefault();

    if (!~_.values(Hotkeys).indexOf(event.which)) {
      var base = String.fromCharCode(event.which).toUpperCase(),
        selection = this.selection,
        caretPosition = this.caretPosition;

      if (!this.readOnly && ~this.allowedInputChars.indexOf(base)) {

        if (!selection && caretPosition !== undefined) {

          this.hideCaret();
          this.sequence.insertBases(base, caretPosition);
          this.caretPosition = ++caretPosition;
          this.displayCaret();

        } else if (selection) {

          this.hideCaret();
          this.selection = undefined;
          this.sequence.deleteBases(
            selection[0],
            selection[1] - selection[0] + 1
          );
          this.sequence.insertBases(base, selection[0]);
          this.caretPosition = selection[0] + 1;
          this.displayCaret(selection[0] + 1);
        }
      }
    }
  };

  /**
  Handles keystrokes on keydown events (used for hotkeys)
  @method handleKeydown
  @param event [event] Keydown event
  **/
  Handlers.prototype.handleKeydown = function(event) {

    if (~_.values(Hotkeys).indexOf(event.which)) {

      this.handleHotkey(event);

    } else if (event.metaKey && event.which == this.commandKeys.A) {
      event.preventDefault();

      this.select(0, this.sequence.length());

    } else if (event.metaKey && event.which == this.commandKeys.C) {

      this.handleCopy();

    } else if (event.metaKey && event.which == this.commandKeys.V) {

      this.handlePaste();

    } else if (event.metaKey && event.which == this.commandKeys.Z) {

      this.handleUndo(event);

    }

  };

  Handlers.prototype.handleHotkey = function(event) {
    var keyName = this.invertHotkeys[event.which.toString()].toLowerCase(),
      handlerName = 'handle' +
      keyName.charAt(0).toUpperCase() +
      keyName.slice(1) +
      'Key';

    if (this[handlerName]) {
      event.preventDefault();
      this[handlerName].call(this, event.shiftKey, event.metaKey);
    }

  };

  Handlers.prototype.handleBackspaceKey = function(shift, meta) {
    if(!this.readOnly) {
      if (this.selection) {
        var selection = this.selection;
        this.selection = undefined;
        this.sequence.deleteBases(
          selection[0],
          selection[1] - selection[0] + 1
        );
        this.displayCaret(selection[0]);
      } else if (this.caretPosition > 0) {
        var previousCaret = this.caretPosition;
        this.hideCaret();
        this.sequence.deleteBases(previousCaret - 1, 1);
        this.displayCaret(previousCaret - 1);
      }
    }
  };

  Handlers.prototype.handleEscKey = function(shift, meta) {
    this.hideCaret();
    this.caretPosition = undefined;
  };

  Handlers.prototype.handleLeftKey = function(shift, meta) {
    var previousCaret = this.caretPosition,
      basesPerRow = this.layoutHelpers.basesPerRow,
      selection = this.selection,
      stickyEnds = this.sequence.get('stickyEnds'),
      minimumPos = (this.drawSingleStickyEnds && stickyEnds && stickyEnds.start.offset) || 0,
      nextCaret;

    if (previousCaret === undefined) return;

    nextCaret = meta ?
      Math.floor(previousCaret / basesPerRow) * basesPerRow :
      Math.max(previousCaret - 1, minimumPos);

    if (shift) {
      if (selection) {
        this.expandSelectionToNewCaret(nextCaret);
      } else {
        this.select(nextCaret, previousCaret - 1);
      }
      this.caretPosition = nextCaret;
    } else {
      this.moveCaret(nextCaret);
    }

  };

  Handlers.prototype.handleRightKey = function(shift, meta) {
    var previousCaret = this.caretPosition,
      basesPerRow = this.layoutHelpers.basesPerRow,
      selection = this.selection,
      stickyEnds = this.sequence.get('stickyEnds'),
      maximumPos = this.sequence.length(),
      nextCaret;

    if (this.drawSingleStickyEnds && stickyEnds && stickyEnds.end){
      maximumPos = maximumPos - (stickyEnds.end.size + stickyEnds.end.offset);
    }

    if (previousCaret === undefined) return;

    nextCaret = meta ?
      (Math.floor(previousCaret / basesPerRow) + 1) * basesPerRow :
      Math.min(previousCaret + 1, maximumPos);

    if (shift) {
      if (selection) {
        this.expandSelectionToNewCaret(nextCaret);
      } else {
        this.select(previousCaret, nextCaret - 1);
        this.caretPosition = nextCaret;
      }
    } else {
      this.moveCaret(nextCaret);
    }

  };

  Handlers.prototype.handleUpKey = function(shift, meta) {
    var basesPerRow = this.layoutHelpers.basesPerRow,
      previousCaret = this.caretPosition,
      selection = this.selection,
      stickyEnds = this.sequence.get('stickyEnds'),
      minimumPos = (this.drawSingleStickyEnds && stickyEnds && stickyEnds.start.offset) || 0,
      nextCaret;

    if (previousCaret === undefined) return;

    nextCaret = meta ? minimumPos : Math.max(minimumPos, this.caretPosition - basesPerRow);

    if (shift) {
      if (selection) {
        this.expandSelectionToNewCaret(nextCaret);
      } else {
        this.select(
          previousCaret,
          nextCaret < previousCaret ? nextCaret - 1 : nextCaret
        );
        this.caretPosition = nextCaret < previousCaret ? nextCaret - 1 : nextCaret;
      }
    } else {
      this.moveCaret(nextCaret);
    }
  };

  Handlers.prototype.handleDownKey = function(shift, meta) {
    var basesPerRow = this.layoutHelpers.basesPerRow,
      previousCaret = this.caretPosition,
      selection = this.selection,
      stickyEnds = this.sequence.get('stickyEnds'),
      maximumPos = this.sequence.length(),
      nextCaret;

    if (this.drawSingleStickyEnds && stickyEnds && stickyEnds.end){
      maximumPos = maximumPos - (stickyEnds.end.size + stickyEnds.end.offset);
    }

    if (previousCaret === undefined) return;

    nextCaret = meta ?
      maximumPos :
      Math.min(this.caretPosition + basesPerRow, maximumPos);

    if (shift) {
      if (selection) {
        this.expandSelectionToNewCaret(nextCaret);
      } else {
        this.select(
          previousCaret,
          nextCaret
        );
        this.caretPosition = nextCaret;
      }
    } else {
      this.moveCaret(nextCaret);
    }

  };

  Handlers.prototype.handleCopy = function() {
    var selection = this.selection;

    if (selection) {
      this.copyPasteHandler.copy(
        this.sequence.getSubSeq(selection[0], selection[1])
      );
    }
  };

  Handlers.prototype.handlePaste = function() {
    var _this = this,
      selection = _this.selection,
      caretPosition = _this.caretPosition;

    if(!this.readOnly) {

      this.copyPasteHandler.paste().then(function(text) {
        if (caretPosition !== undefined && !selection) {
          text = _this.cleanPastedText(text);
          _this.hideCaret();
          _this.sequence.insertBases(text, caretPosition);
          _this.displayCaret(caretPosition + text.length);
          _this.focus();
        }

      });

    }
  };

  Handlers.prototype.handleUndo = function(event) {
    if (!this.readOnly && this.caretPosition !== undefined) {
      event.preventDefault();
      this.hideCaret();
      this.sequence.undo();
    }
  };

  /**
   **/
  Handlers.prototype.handleMousedown = function(event) {
    var _this = this,
      mouse = this.normalizeMousePosition(event);

    _this.hideCaret();
    _this.dragStartPos = [mouse.left, mouse.top + this.layoutHelpers.yOffset];
    _this.dragStartBase = _this.getBaseFromXYPos.apply(_this, _this.dragStartPos);

    this.$scrollingParent.on('mouseup mousemove', function mousedownHandler(event) {
      if (event.type === 'mouseup') {
        _this.handleMouseup(event);
        _this.$scrollingParent.off('mouseup mousemove', mousedownHandler);
      } else {
        _this.handleMousemove(event);
      }
    });
  };

  /**
   **/
  Handlers.prototype.handleMousemove = function(event) {
    var _this = this,
      layoutHelpers = _this.layoutHelpers,
      caretPosition = _this.caretPosition,
      selection = _this.selection,
      sequence = _this.sequence,
      stickyEnds = _this.sequence.get('stickyEnds'),
      mouse = _this.normalizeMousePosition(event);

    mouse.top += layoutHelpers.yOffset;

    if (_this.dragStartPos &&
      (Math.abs(mouse.left - _this.dragStartPos[0]) > 5 ||
        Math.abs(mouse.top - _this.dragStartPos[1]) >= layoutHelpers.rows.height)) {

      var first = _this.dragStartBase,
        last = _this.getBaseFromXYPos(mouse.left, mouse.top);

      if (!_this.selecting) {
        _this.selecting = true;
      }

      if (first <= last) {
        _this.selection = [first, last];
      } else {
        _this.selection = [last, first];
      }

      // Sticky End validation
      if (_this.drawSingleStickyEnds) {
        if (stickyEnds){
          _this.selection[0] = Math.max(_this.selection[0], stickyEnds.start.offset);
          _this.selection[1] = Math.min(_this.selection[1], sequence.length() - stickyEnds.end.offset);
        }

      }

      _this.caretPosition = selection && selection[0] < caretPosition ? last + 1 : last;

    } else {
      _this.selecting = false;
      _this.selection = undefined;
    }

    _this.redrawSelection(_this.selection);
  };

  /**
   **/
  Handlers.prototype.handleMouseup = function(event) {
    var sequence = this.sequence,
        stickyEnds = sequence.get('stickyEnds');

    if (!this.selection || !this.selecting) {
      this.handleClick(event);
    }
    this.dragStartPos = this.dragStartBase = undefined;
    if (this.selection) {
      if (stickyEnds){
        // Clamp the caret position down to sequence range if sticky ends are in place.
        this.caretPosition = Math.max(
                              Math.min(this.caretPosition, sequence.length() - (stickyEnds.end.offset + stickyEnds.end.size))
                              , stickyEnds.start.offset);
      }
      this.displayCaret(this.caretPosition);
    }
    this.selecting = false;
  };

  /**
  Displays the caret at the mouse click position
  @method handleClick
  @param event [event] Click event
  **/
  Handlers.prototype.handleClick = function(event) {
    var mouse = this.normalizeMousePosition(event),
      _this = this,
      base, baseRange;

    baseRange = this.getBaseRangeFromYPos(mouse.top + this.layoutHelpers.yOffset);
    base = this.getBaseFromXYPos(mouse.left, mouse.top + this.layoutHelpers.yOffset);

    if (base >= 0 && baseRange[0] >= 0 && baseRange[1] > 0) {
      if (this.selection) {
        this.select(undefined);
      } else {
        this.displayCaret(base);
      }
    }

    _this.redraw();
  };

  /**
  Handles scrolling events
  @method handleScrolling
  **/
  Handlers.prototype.handleScrolling = function(event) {
    this.scrollTo($(event.delegateTarget).scrollTop());
  };

  /**
  Removes the caret on blur events
  @method handleBlur
  **/
  Handlers.prototype.handleBlur = function(event) {

    if (this.caretPosition !== undefined && !$(event.relatedTarget).hasClass('sequence-dropdown')) {
      this.hideCaret(false);
      this.selection = undefined;
      this.redraw();
    }

  };

  Handlers.prototype.normalizeMousePosition = function(event) {
    var scrollingParentPosition = this.$scrollingParent.offset();

    return {
      left: event.pageX - scrollingParentPosition.left,
      top: event.pageY - scrollingParentPosition.top
    };
  };

  return Handlers;
});
