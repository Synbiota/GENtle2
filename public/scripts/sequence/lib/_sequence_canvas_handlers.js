/**
Event handlers for SequenceCanvas
@class SequenceCanvasHandlers
**/
define(function(require) {
  var Hotkeys = require('common/lib/hotkeys'),
    Handlers;

  Handlers = function() {};

  /**
  Handles keystrokes on keypress events (used for inputs)
  @method handleKeypress
  @param event [event] Keypress event
  **/
  Handlers.prototype.handleKeypress = function(event, caret) {
    event.preventDefault();

    if(caret !== undefined)
      this.caret = caret;

    if (!~_.values(Hotkeys).indexOf(event.which)) {
      var base = String.fromCharCode(event.which).toUpperCase(),
        selection = this.selection,
        caretPosition = this.caretPosition;

      if (!this.readOnly && ~this.allowedInputChars.indexOf(base)) {

        if (!selection && caretPosition !== undefined) {

          this.hideCaret(false,this.caret);
          this.sequence.insertBases(base, caretPosition);
          this.caretPosition = ++caretPosition;
          this.displayCaret();

        } else if (selection) {

          this.hideCaret(false,this.caret);
          this.selection = undefined;
          this.sequence.deleteBases(
            selection[0],
            selection[1] - selection[0] + 1
          );
          this.sequence.insertBases(base, selection[0]);
          this.caretPosition = selection[0] + 1;
          this.displayCaret(selection[0] + 1,this.caret);
        }
      }
    }
  };

   /**
  Updates caret position on mouse hover events
  @method handleKeypress
  @param event [event] Keypress event
  **/
  Handlers.prototype.handleMouseHover = function(event, caret) {
    event.preventDefault();
    if(caret!== undefined)
      this.caret = caret;

    if(!this.selection){
//      console.log('this should not happen');
     var mouse = this.normalizeMousePosition(event),
     position = this.getBaseFromXYPos(mouse.left,mouse.top+this.layoutHelpers.yOffset);
     this.moveCaret(position, this.caret);
    }
  };


  /**
  Handles keystrokes on keydown events (used for hotkeys)
  @method handleKeydown
  @param event [event] Keydown event
  **/
  Handlers.prototype.handleKeydown = function(event, caret) {

    if(caret !== undefined)
      this.caret = caret;

    if (~_.values(Hotkeys).indexOf(event.which)) {

      this.handleHotkey(event);

    } else if (event.metaKey && event.which == this.commandKeys.A) {
      event.preventDefault();

      this.select(0, this.sequence.length());

    } else if (event.metaKey && event.which == this.commandKeys.C) {

      this.handleCopy();

    } else if (event.metaKey && event.which == this.commandKeys.V) {

      this.handlePaste(this.caret);

    } else if (event.metaKey && event.which == this.commandKeys.Z) {

      this.handleUndo(event, this.caret);
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

  Handlers.prototype.handleBackspaceKey = function(shift, meta, caret) {
    if(!this.readOnly) {
      if (this.selection) {
        var selection = this.selection;
        this.selection = undefined;
        this.sequence.deleteBases(
          selection[0],
          selection[1] - selection[0] + 1
        );
        this.displayCaret(selection[0], caret);
      } else if (this.caretPosition > 0) {
        var previousCaret = this.caretPosition;
        this.hideCaret(false,this.caret);
        this.sequence.deleteBases(previousCaret - 1, 1);
        this.displayCaret(previousCaret - 1);
      }
    }
  };

  Handlers.prototype.handleEscKey = function(shift, meta) {
    this.hideCaret(false,this.caret);
    this.caretPosition = undefined;
  };

  Handlers.prototype.handleLeftKey = function(shift, meta) {
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
      this.moveCaret(nextCaret, this.caret);
    }

  };

  Handlers.prototype.handleRightKey = function(shift, meta) {
    var previousCaret = this.caretPosition,
      basesPerRow = this.layoutHelpers.basesPerRow,
      selection = this.selection,
      nextCaret;

    if (previousCaret === undefined) return;

    nextCaret = meta ?
      (Math.floor(previousCaret / basesPerRow) + 1) * basesPerRow :
      Math.min(previousCaret + 1, this.sequence.length());

    if (shift) {
      if (selection) {
        this.expandSelectionToNewCaret(nextCaret);
      } else {
        this.select(previousCaret, nextCaret - 1);
        this.caretPosition = nextCaret;
      }
    } else {
      this.moveCaret(nextCaret, this.caret);
    }

  };

  Handlers.prototype.handleUpKey = function(shift, meta) {
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
      this.moveCaret(nextCaret, this.caret);
    }
  };

  Handlers.prototype.handleDownKey = function(shift, meta) {
    var basesPerRow = this.layoutHelpers.basesPerRow,
      previousCaret = this.caretPosition,
      selection = this.selection,
      nextCaret;

    if (previousCaret === undefined) return;

    nextCaret = meta ?
      this.sequence.length() :
      Math.min(this.caretPosition + basesPerRow, this.sequence.length());

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
      this.moveCaret(nextCaret, this.caret);
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

  Handlers.prototype.handlePaste = function(caret) {
    var _this = this,
      selection = _this.selection,
      caretPosition = _this.caretPosition;

    if(caret !== undefined)
      this.caret = caret;

    if(!this.readOnly) {

      this.copyPasteHandler.paste().then(function(text) {
        if (caretPosition !== undefined && !selection) {
          text = _this.cleanPastedText(text);
          _this.hideCaret(false,this.caret);
          _this.sequence.insertBases(text, caretPosition);
          _this.displayCaret(caretPosition + text.length,this.caret);
          _this.focus();
        }
      });

    }
  };

  Handlers.prototype.handleUndo = function(event, caret) {
    if (!this.readOnly && this.caretPosition !== undefined) {
      event.preventDefault();
      this.hideCaret(false,this.caret);
      this.sequence.undo();
    }
  };

  /**
   **/
  Handlers.prototype.handleMousedown = function(event, caret) {

    var _this = this,
      mouse = this.normalizeMousePosition(event);

    if(caret !== undefined)
    _this.caret = caret;
    _this.hideCaret(true,this.caret);
    _this.dragStartPos = [mouse.left, mouse.top + this.layoutHelpers.yOffset];
    _this.dragStartBase = _this.getBaseFromXYPos.apply(_this, _this.dragStartPos);

    this.$scrollingParent.on('mouseup mousemove', function mousedownHandler(event) {
      if (event.type === 'mouseup') {
        _this.handleMouseup(event, _this.caret);
        _this.$scrollingParent.off('mouseup mousemove', mousedownHandler);
      } else {
        _this.handleMousemove(event, _this.caret);
      }
    });
  };

  /**
   **/
  Handlers.prototype.handleMousemove = function(event, caret) {
    var _this = this,
      layoutHelpers = _this.layoutHelpers,
      caretPosition = _this.caretPosition,
      selection = _this.selection,
      mouse = _this.normalizeMousePosition(event);

      if(caret !== undefined)
      this.caret = caret;

      if(this.caret.className !== 'caret-hovering')
      _this.hideCaret(true, this.caret);

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
  Handlers.prototype.handleMouseup = function(event, caret) {
    if(caret !== undefined)
      this.caret = caret;

    console.log(caret);

    if (!this.selection || !this.selecting) {
      this.handleClick(event, this.caret);
    }
    this.dragStartPos = this.dragStartBase = undefined;
    if (this.selection) {
      this.displayCaret(this.caretPosition, this.caret);
    }
    this.selecting = false;
  };

  /**
  Displays the caret at the mouse click position
  @method handleClick
  @param event [event] Click event
  **/
  Handlers.prototype.handleClick = function(event, caret) {
    var mouse = this.normalizeMousePosition(event),
      _this = this,
      base, baseRange;
      if(caret !== undefined)
      this.caret = caret;
     
    baseRange = this.getBaseRangeFromYPos(mouse.top + this.layoutHelpers.yOffset);
    base = this.getBaseFromXYPos(mouse.left, mouse.top + this.layoutHelpers.yOffset);

    if (base >= 0 && baseRange[0] >= 0 && baseRange[1] > 0) {
      if (this.selection) {
        this.select(undefined);
      } else {
        this.displayCaret(base, this.caret);
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
    if (this.caretPosition !== undefined) {
      this.hideCaret(false, this.caret);
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