/**
Event handlers for SequenceCanvas
@class Handlers
**/
define(function(require) {
  var Hotkeys           = require('lib/hotkeys'),
      Handlers;

  Handlers = function() {};

  /**
  Handles keystrokes on keypress events (used for inputs)
  @method handleKeypress
  @param event [event] Keypress event
  **/
  Handlers.prototype.handleKeypress = function(event) {
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
  Handlers.prototype.handleKeydown = function(event) {
    
    if(~_.values(Hotkeys).indexOf(event.keyCode)) {

      this.handleHotkey(event);

    } else if(event.metaKey && event.keyCode == this.commandKeys.A) {
      event.preventDefault();

      this.select(0, this.sequence.length());

    } else if(event.metaKey && event.keyCode == this.commandKeys.C) {

      this.handleCopy();

    } else if(event.metaKey && event.keyCode == this.commandKeys.V) {

      this.handlePaste();

    } else if(event.metaKey && event.keyCode == this.commandKeys.Z) {

      this.handleUndo(event);

    }

  };

  Handlers.prototype.handleHotkey = function(event) {
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

  Handlers.prototype.handleBackspaceKey = function(shift, meta) {
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

  Handlers.prototype.handleEscKey = function(shift, meta) {
    this.caret.remove();
    this.caretPosition = undefined;
  };

  Handlers.prototype.handleLeftKey = function(shift, meta) {
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

  Handlers.prototype.handleRightKey = function(shift, meta) {
    if(meta) {
      var basesPerRow = this.layoutHelpers.basesPerRow;
      this.displayCaret((Math.floor(this.caretPosition / basesPerRow) + 1 )* basesPerRow);
    } else if(this.caretPosition && this.caretPosition < this.sequence.length() - 1) {
      this.displayCaret(this.caretPosition + 1);
    }
  };

  Handlers.prototype.handleUpKey = function(shift, meta) {
    var basesPerRow = this.layoutHelpers.basesPerRow;
    if(meta) {
      this.displayCaret(0);
    } else if(this.caretPosition >= basesPerRow) {
      this.displayCaret(this.caretPosition - basesPerRow);
    }
  };

  Handlers.prototype.handleDownKey = function(shift, meta) {
    var basesPerRow = this.layoutHelpers.basesPerRow;
    if(meta) {
      this.displayCaret(this.sequence.length());
    } else if(this.caretPosition + basesPerRow < this.sequence.length()) {
      this.displayCaret(this.caretPosition + basesPerRow);  
    }
  };

  Handlers.prototype.handleCopy = function() {
    var selection = this.selection;

    if(selection) {
      this.copyPasteHandler.copy(
        this.sequence.getSubSeq(selection[0], selection[1])
      );
    }
  };

  Handlers.prototype.handlePaste = function() {
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

  Handlers.prototype.handleUndo = function(event) {
    if(this.caretPosition) {
      event.preventDefault();
      this.caret.remove();
      this.sequence.undo();
    }
  };

  /**
  **/
  Handlers.prototype.handleMousedown = function(event) {
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
  Handlers.prototype.handleMousemove = function(event) {
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
  Handlers.prototype.handleMouseup = function(event) {
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
  Handlers.prototype.handleClick = function(event) {
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
  Handles scrolling events
  @method handleScrolling
  **/
  Handlers.prototype.handleScrolling = function(event) {
    this.scrollTo($(event.delegateTarget).scrollTop());
  };

  return Handlers;
});