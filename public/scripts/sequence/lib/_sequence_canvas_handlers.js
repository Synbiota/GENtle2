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
          this.sequence.insertBases(base, caretPosition, {
            stickyEndFormat: this.stickyEndFormat
          });
          this.caretPosition = ++caretPosition;
          this.displayCaret();

        } else if (selection) {

          this.hideCaret();
          this.selection = undefined;
          this.sequence.deleteBases(
            selection[0],
            selection[1] - selection[0] + 1,
            {
              stickyEndFormat: this.stickyEndFormat
            }
          );
          this.sequence.insertBases(base, selection[0], {
            stickyEndFormat: this.stickyEndFormat
          });
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

    var options = {
      stickyEndFormat: this.stickyEndFormat
    };

    if (~_.values(Hotkeys).indexOf(event.which)) {

      this.handleHotkey(event, options);

    } else if (event.metaKey && event.which == this.commandKeys.A) {
      event.preventDefault();

      this.select(0, this.sequence.length(options));

    } else if (event.metaKey && event.which == this.commandKeys.C) {

      this.handleCopy(options);

    } else if (event.metaKey && event.which == this.commandKeys.V) {

      this.handlePaste(options);

    } else if (event.metaKey && event.which == this.commandKeys.Z) {

      this.handleUndo(event);

    }

  };

  Handlers.prototype.handleHotkey = function(event, options) {
    var keyName = this.invertHotkeys[event.which.toString()].toLowerCase(),
      handlerName = 'handle' +
      keyName.charAt(0).toUpperCase() +
      keyName.slice(1) +
      'Key';

    if (this[handlerName]) {
      event.preventDefault();
      this[handlerName].call(this, event.shiftKey, event.metaKey, options);
    }

  };

  Handlers.prototype.handleBackspaceKey = function(shift, meta, options) {
    if(!this.readOnly) {
      if (this.selection) {
        var selection = this.selection;
        this.selection = undefined;
        this.sequence.deleteBases(
          selection[0],
          selection[1] - selection[0] + 1,
          options
        );
        this.displayCaret(selection[0]);
      } else if (this.caretPosition > 0) {
        var previousCaret = this.caretPosition;
        this.hideCaret();
        this.sequence.deleteBases(previousCaret - 1, 1, options);
        this.displayCaret(previousCaret - 1);
      }
    }
  };

  Handlers.prototype.handleEscKey = function(shift, meta, options) {
    this.hideCaret();
    this.caretPosition = undefined;
  };

  Handlers.prototype.handleLeftKey = function(shift, meta, options) {
    var previousCaret = this.caretPosition,
      basesPerRow = this.layoutHelpers.basesPerRow,
      selection = this.selection,
      nextCaret;

    if (previousCaret === undefined) return;

    nextCaret = meta ?
      Math.floor(previousCaret / basesPerRow) * basesPerRow :
      Math.max(previousCaret - 1, 0);

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

  Handlers.prototype.handleRightKey = function(shift, meta, options) {
    var previousCaret = this.caretPosition,
      basesPerRow = this.layoutHelpers.basesPerRow,
      selection = this.selection,
      nextCaret;

    if (previousCaret === undefined) return;

    nextCaret = meta ?
      (Math.floor(previousCaret / basesPerRow) + 1) * basesPerRow :
      Math.min(previousCaret + 1, this.sequence.length(options));

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

  Handlers.prototype.handleUpKey = function(shift, meta, options) {
    var basesPerRow = this.layoutHelpers.basesPerRow,
      previousCaret = this.caretPosition,
      selection = this.selection,
      nextCaret;

    if (previousCaret === undefined) return;

    nextCaret = meta ? 0 : Math.max(0, this.caretPosition - basesPerRow);

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

  Handlers.prototype.handleDownKey = function(shift, meta, options) {
    var basesPerRow = this.layoutHelpers.basesPerRow,
      previousCaret = this.caretPosition,
      selection = this.selection,
      nextCaret;

    if (previousCaret === undefined) return;

    nextCaret = meta ?
      this.sequence.length(options) :
      Math.min(this.caretPosition + basesPerRow, this.sequence.length(options));

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

  Handlers.prototype.handleCopy = function(options) {
    var selection = this.selection;

    if (selection) {
      this.copyPasteHandler.copy(
        this.sequence.getSubSeq(selection[0], selection[1], options)
      );
    }
  };

  Handlers.prototype.handlePaste = function(options) {
    var _this = this,
      selection = _this.selection,
      caretPosition = _this.caretPosition;

    if(!this.readOnly) {

      this.copyPasteHandler.paste().then(function(text) {
        if (caretPosition !== undefined && !selection) {
          text = _this.cleanPastedText(text);
          _this.hideCaret();
          _this.sequence.insertBases(text, caretPosition, options);
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
    if (!this.selection || !this.selecting) {
      this.handleClick(event);
    }
    this.dragStartPos = this.dragStartBase = undefined;
    if (this.selection) {
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
