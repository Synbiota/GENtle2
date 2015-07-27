import _ from 'underscore';
import Hotkeys from '../../common/lib/hotkeys';
import Modal from '../../common/views/modal_view';


var alertUneditableStickyEnd = () => alert('Unable to edit the sticky ends of a sequence');

/**
Event handlers for SequenceCanvas
@class SequenceCanvasHandlers
**/

class Handlers {
  _init(options) {
    _.bindAll(this,
      'handleScrolling',
      'handleMousedown',
      'handleMousemove',
      'handleMouseup',
      'handleClick',
      'handleKeypress',
      'handleKeydown',
      'handleBlur'
    );

    this.invertHotkeys = _.invert(Hotkeys);
    this.commandKeys = _.reduce(['A', 'C', 'Z', 'V'], (memo, key) => {
      memo[key] = key.charCodeAt(0);
      return memo;
    }, {});

    if(this.selectable) {
      this.$scrollingParent.on('mousedown', this.handleMousedown);
      this.$scrollingParent.on('keydown', this.handleKeydown);
      this.$scrollingParent.on('blur', this.handleBlur);
    }

    this.$scrollingParent.on('keypress', this.handleKeypress);

    if(this.scrollable) {
      this.$scrollingParent.on('scroll', this.handleScrolling);
    }

  }

  /**
  Handles keystrokes on keypress events (used for inputs)
  @method handleKeypress
  @param event [event] Keypress event
  **/
  handleKeypress(event) {
    event.preventDefault();
    if(!this.editable) {
      Modal.show({
        title: 'Read only sequence',
        subTitle: '',
        bodyHtml: '<p>This sequence is <b>read only</b> and can not be edited.</p>',
        confirmLabel: 'Okay.',
        cancelLabel: false, //"Okay, don't remind me.",
      }).once('cancel', () => {
        // TODO:  set the user as not being reminded again
      });
      return;
    }

    if (!~_.values(Hotkeys).indexOf(event.which)) {
      var base = String.fromCharCode(event.which).toUpperCase(),
        selection = this.selection,
        caretPosition = this.caretPosition;

      if (this.editable && ~this.allowedInputChars.indexOf(base)) {

        if (!selection && caretPosition !== undefined) {

          if(this.sequence.isBaseEditable(caretPosition)) {

            this.hideCaret();
            this.sequence.insertBases(base, caretPosition);
            this.caretPosition = ++caretPosition;
            this.afterNextRedraw(() => {
              this.displayCaret();
            });

          } else {
            alertUneditableStickyEnd();
          }

        } else if (selection) {

          if(this.sequence.isRangeEditable(...selection)) {

            this.hideCaret();
            this.selection = undefined;
            this.sequence.deleteBases(
              selection[0],
              selection[1] - selection[0] + 1
            );
            this.sequence.insertBases(base, selection[0]);
            this.caretPosition = selection[0] + 1;
            this.afterNextRedraw(() => {
              this.displayCaret();
            });

          } else {
            alertUneditableStickyEnd();
          }
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
      let editableRange = this.sequence.editableRange(true);


      this.selectRange(editableRange);
      // Select next character
      this.displayCaret(editableRange.to);

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
    if(this.editable) {
      if (this.selection) {
        var selection = this.selection;
        if(this.sequence.isBaseEditable(...selection)) {
          this.selection = undefined;
          this.sequence.deleteBases(
            selection[0],
            selection[1] - selection[0] + 1
          );
          this.caretPosition = selection[0];
          this.afterNextRedraw(() => {
            this.displayCaret();
          });
        } else {
          alertUneditableStickyEnd();
        }
      } else if (this.caretPosition > 0) {
        var previousCaret = this.caretPosition;
        if(this.sequence.isBaseEditable(previousCaret - 1)) {
          this.hideCaret();
          this.sequence.deleteBases(previousCaret - 1, 1);
          this.caretPosition = previousCaret - 1;
          this.afterNextRedraw(() => {
            this.displayCaret();
          });
        } else {
          alertUneditableStickyEnd();
        }
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

    previousCaret = this.sequence.ensureBaseIsEditable(previousCaret);
    nextCaret = this.sequence.ensureBaseIsEditable(nextCaret);

    if (shift) {
      if (previousCaret !== nextCaret) {
        if (selection) {
          this.expandSelectionToNewCaret(nextCaret);
        } else {
          this.select(previousCaret - 1, nextCaret);
        }
        this.caretPosition = nextCaret;
      }
    } else {
      if (selection) {
        var position = this.sequence.ensureBaseIsEditable(selection[0]);
        this.moveCaret(position);
      } else {
        this.moveCaret(nextCaret);
      }
    }

  }

  handleRightKey(shift, meta) {
    var previousCaret = this.caretPosition,
      basesPerRow = this.layoutHelpers.basesPerRow,
      selection = this.selection,
      nextCaret;

    if (previousCaret === undefined) return;
    previousCaret = this.sequence.ensureBaseIsEditable(previousCaret);

    if(meta) {
      nextCaret = (Math.floor(previousCaret / basesPerRow) + 1) * basesPerRow;
      nextCaret = Math.min(nextCaret, this.sequence.getLength());
    } else {
      nextCaret = Math.min(previousCaret + 1, this.sequence.getLength());
    }

    nextCaret = this.sequence.ensureBaseIsEditable(nextCaret);

    if (shift) {
      if (selection) {
        this.expandSelectionToNewCaret(nextCaret);
      } else if (previousCaret != nextCaret) {
        this.select(previousCaret, nextCaret - 1);
        this.caretPosition = nextCaret;
      }
    } else {
      if (selection) {
        var position = this.sequence.ensureBaseIsEditable(selection[1] + 1);
        this.moveCaret(position);
      } else {
        this.moveCaret(nextCaret);
      }
    }

  }

  handleUpKey(shift, meta) {
    var basesPerRow = this.layoutHelpers.basesPerRow,
      previousCaret = this.caretPosition,
      selection = this.selection,
      nextCaret;

    if (previousCaret === undefined) return;

    nextCaret = meta ? 0 : Math.max(0, this.caretPosition - basesPerRow);
    nextCaret = this.sequence.ensureBaseIsEditable(nextCaret);

    if(previousCaret === nextCaret) return;

    if (shift) {
      this.caretPosition = nextCaret < previousCaret ? nextCaret - 1 : nextCaret;
      if (selection) {
        this.expandSelectionToNewCaret(nextCaret);
      } else {
        this.select(previousCaret - 1, nextCaret);
      }
      this.displayCaret(nextCaret);
    } else {
      if (selection) {
        var position = this.sequence.ensureBaseIsEditable(selection[0]);
        this.moveCaret(position);
      } else {
        this.moveCaret(nextCaret);
      }
    }
  }

  handleDownKey(shift, meta) {
    var basesPerRow = this.layoutHelpers.basesPerRow,
      previousCaret = this.caretPosition,
      selection = this.selection,
      nextCaret;

    if (previousCaret === undefined) return;
    previousCaret = this.sequence.ensureBaseIsEditable(previousCaret);

    nextCaret = meta ?
      this.sequence.getLength() :
      Math.min(this.caretPosition + basesPerRow, this.sequence.getLength());

    nextCaret = this.sequence.ensureBaseIsEditable(nextCaret);

    if (shift) {
      if (selection) {
        this.expandSelectionToNewCaret(
          nextCaret < previousCaret ? nextCaret : nextCaret - 1
        );
      } else {
        this.select(
          previousCaret,
          nextCaret - 1
        );
        this.caretPosition = nextCaret;
      }
    } else {
      if (selection) {
        var position = this.sequence.ensureBaseIsEditable(selection[1] + 1);
        this.moveCaret(position);
      } else {
        this.moveCaret(nextCaret);
      }
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
    var selection = this.selection;
    var caretPosition = this.caretPosition;

    if(this.editable) {
      this.copyPasteHandler.paste().then((text) => {
        if (caretPosition !== undefined && !selection) {
          text = this.cleanPastedText(text);
          this.hideCaret();
          this.sequence.insertBases(text, caretPosition);
          this.caretPosition = caretPosition + text.length;
          this.afterNextRedraw(() => {
            this.displayCaret();
          });
          this.focus();
        }
      });
    }

  }

  handleUndo(event) {
    if (this.editable && this.caretPosition !== undefined) {
      event.preventDefault();
      var previousCaret = this.caretPosition;

      this.afterNextRedraw(function() {
        this.displayCaret(previousCaret);
      });

      this.sequence.once('undo', (data) => {
         if(data && _.isNumber(data.position) && !_.isNaN(data.position)) {
          this.afterNextRedraw(function() {
            this.displayCaret(data.position);
          });
         }
      });

      this.sequence.undo();
    }
  }

  /**
   **/
  handleMousedown(event) {
    var _this = this,
      mouse = this.normalizeMousePosition(event),
      previousCaret = this.caretPosition;

    _this.hideCaret();
    _this.dragStartPos = [mouse.left, mouse.top + this.layoutHelpers.yOffset];
    if(event.shiftKey && previousCaret) {
      let dragStartBase;
      if(this.selection) {
        let [selectionStart, selectionEnd] = this.selection;
        if(this.previousCaret < selectionEnd) {
          dragStartBase = selectionEnd;
        } else {
          dragStartBase = selectionStart;
        }
      } else {
        dragStartBase = previousCaret;
      }
      this.dragStartBase = dragStartBase;
      this.handleClick(event);
    } else {
      _this.dragStartBase = _this.getBaseFromXYPos.apply(_this, _this.dragStartPos);
    }

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
      sequence = this.sequence,
      mouse = _this.normalizeMousePosition(event);

    mouse.top += layoutHelpers.yOffset;

    if (_this.dragStartPos &&
      (Math.abs(mouse.left - _this.dragStartPos[0]) > 5 ||
        Math.abs(mouse.top - _this.dragStartPos[1]) >= layoutHelpers.rows.height)) {

      var first = sequence.ensureBaseIsEditable(_this.dragStartBase, true);
      var last = sequence.ensureBaseIsEditable(
          _this.getBaseFromXYPos(mouse.left, mouse.top),
          true
        );

      if (!_this.selecting) {
        _this.selecting = true;
      }

      if (first <= last) {
        _this.selection = [first, last];
      } else {
        _this.selection = [last, first];
      }

      _this.caretPosition = (selection && selection[0] < caretPosition) ? last + 1 : last;

    } else {
      _this.selecting = false;
      _this.selection = undefined;
    }
    _this.displayCaret(_this.caretPosition);
    _this.redrawSelection(_this.selection);
  }

  /**
   **/
  handleMouseup(event) {

    if (!this.selection || !this.selecting) {
      this.handleClick(event);
    }
    this.dragStartPos = this.dragStartBase = undefined;
    if (this.selection && !event.shiftKey) {
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
      shiftKey = event.shiftKey,
      base, baseRange;

    baseRange = this.getBaseRangeFromYPos(mouse.top + this.layoutHelpers.yOffset);
    base = this.getBaseFromXYPos(mouse.left, mouse.top + this.layoutHelpers.yOffset);

    if (base >= 0 && baseRange[0] >= 0 && baseRange[1] > 0) {
      let newCaret = this.sequence.ensureBaseIsEditable(base);

      if(this.selection) {
        if(shiftKey) {
          this.expandSelectionToNewCaret(newCaret);
        } else {
          this.select(undefined);
        }
      } else {
        let previousCaret = this.caretPosition;
        if(shiftKey && previousCaret) {
          this.selection = newCaret >= previousCaret ?
            [previousCaret, newCaret-1] : [newCaret, previousCaret];
          this.redrawSelection(this.selection);
        }
        this.displayCaret(newCaret);
      }
    }

    _this.redraw();
  }

  /**
  Handles scrolling events
  @method handleScrolling
  **/

  // DURING BACKPORT CHANGE CORE CANVAS TO USE onScroll
  handleScrolling(event) {
    var $target = $(event.delegateTarget)
    if (this.onScroll){
      this.onScroll($target.scrollLeft(), $target.scrollTop());
    } else {
      this.scrollTo($target.scrollLeft(), $target.scrollTop());
    }
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

export default Handlers;

