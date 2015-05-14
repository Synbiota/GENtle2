import Hotkeys from '../../common/lib/hotkeys';
import _ from 'underscore';

/**
Event handlers for SequenceCanvas
@class SequenceCanvasHandlers
**/
export default class _SequenceCanvasHandlers {

  /**
  Handles keystrokes on keypress events (used for inputs)
  @method handleKeypress
  @param event [event] Keypress event
  **/
  handleKeypress(event) {
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
  }

  /**
  Handles keystrokes on keydown events (used for hotkeys)
  @method handleKeydown
  @param event [event] Keydown event
  **/
  handleKeydown(event) {

    if (~_.values(Hotkeys).indexOf(event.which)) {

      this.handleHotkey(event);

    } else if (event.metaKey && event.which == this.commandKeys.A) {
      event.preventDefault();

      this.select(0, this.sequence.getLength());

    } else if (event.metaKey && event.which == this.commandKeys.C) {

      this.handleCopy();

    } else if (event.metaKey && event.which == this.commandKeys.V) {

      this.handlePaste();

    } else if (event.metaKey && event.which == this.commandKeys.Z) {

      this.handleUndo(event);

    }

  }

  handleHotkey(event) {
    var keyName = this.invertHotkeys[event.which.toString()].toLowerCase(),
      handlerName = 'handle' +
      keyName.charAt(0).toUpperCase() +
      keyName.slice(1) +
      'Key';

    if (this[handlerName]) {
      event.preventDefault();
      this[handlerName].call(this, event.shiftKey, event.metaKey);
    }

  }

  handleBackspaceKey(shift, meta) {
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
  }

  handleEscKey(shift, meta) {
    this.hideCaret();
    this.caretPosition = undefined;
  }

  handleLeftKey(shift, meta) {
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

  }

  handleRightKey(shift, meta) {
    var previousCaret = this.caretPosition,
      basesPerRow = this.layoutHelpers.basesPerRow,
      selection = this.selection,
      nextCaret;

    if (previousCaret === undefined) return;

    nextCaret = meta ?
      (Math.floor(previousCaret / basesPerRow) + 1) * basesPerRow :
      Math.min(previousCaret + 1, this.sequence.getLength());

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

  }

  handleUpKey(shift, meta) {
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
  }

  handleDownKey(shift, meta) {
    var basesPerRow = this.layoutHelpers.basesPerRow,
      previousCaret = this.caretPosition,
      selection = this.selection,
      nextCaret;

    if (previousCaret === undefined) return;

    nextCaret = meta ?
      this.sequence.getLength() :
      Math.min(this.caretPosition + basesPerRow, this.sequence.getLength());

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

  }

  handleCopy() {
    var selection = this.selection;

    if (selection) {
      this.copyPasteHandler.copy(
        this.sequence.getSubSeq(selection[0], selection[1])
      );
    }
  }

  handlePaste() {
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
  }

  handleUndo(event) {
    if (!this.readOnly && this.caretPosition !== undefined) {
      event.preventDefault();
      this.hideCaret();
      this.sequence.undo();
    }
  }

  /**
   **/
  handleMousedown(event) {
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
  }

  /**
   **/
  handleMousemove(event) {
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
  }

  /**
   **/
  handleMouseup(event) {
    if (!this.selection || !this.selecting) {
      this.handleClick(event);
    }
    this.dragStartPos = this.dragStartBase = undefined;
    if (this.selection) {
      this.displayCaret(this.caretPosition);
    }
    this.selecting = false;
  }

  /**
  Displays the caret at the mouse click position
  @method handleClick
  @param event [event] Click event
  **/
  handleClick(event) {
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
  }

  /**
  Handles scrolling events
  @method handleScrolling
  **/
  handleScrolling(event) {
    this.scrollTo($(event.delegateTarget).scrollTop());
  }

  /**
  Removes the caret on blur events
  @method handleBlur
  **/
  handleBlur(event) {

    if (this.caretPosition !== undefined && !$(event.relatedTarget).hasClass('sequence-dropdown')) {
      this.hideCaret(false);
      this.selection = undefined;
      this.redraw();
    }

  }

  normalizeMousePosition(event) {
    var scrollingParentPosition = this.$scrollingParent.offset();

    return {
      left: event.pageX - scrollingParentPosition.left,
      top: event.pageY - scrollingParentPosition.top
    };
  }



}