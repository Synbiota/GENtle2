/**
Context Menu handling for SequenceCanvas

Hooks to the ContextMenuView attached to the SequenceCanvas (`this.contextMenu`)

@class SequenceCanvasContextMenu
@extensionfor SequenceCanvas
**/
define(function(require) {
  var SequenceCanvasContextMenu;

  SequenceCanvasContextMenu = function() {};

  /**
  Shows button to open context menu and adds menu items to context menu view

  @method showContextMenuButton
  @params posX
  @params posY
  **/
  SequenceCanvasContextMenu.prototype.showContextMenuButton = function(posX, posY) {
    var menu = this.contextMenu;
    
    this.contextMenuXPos = posX;
    this.contextMenuYPos = posY;
    menu.reset().move(this.contextMenuXPos, this.contextMenuYPos - this.layoutHelpers.yOffset);

    if(this.copyPasteHandler.copiedValue) {
      menu.add('Paste', this.pasteFromMenu);
    }

    if(this.selection) {
      menu.add('Copy', this.copyFromMenu);
    }

    if(menu.menuItems.length) {
      menu.show();
    }

  };

  SequenceCanvasContextMenu.prototype.restoreContextMenuYPosition = function() {
    this.contextMenu.move(
      this.contextMenuXPos,
      this.contextMenuYpos - this.layoutHelpers.yOffset
    );
  };

  SequenceCanvasContextMenu.prototype.hideContextMenuButton = function() {
    this.contextMenu.hide();
  };

  /**
  Copy selected sequence **internally**.

  True copy to clipboard would need to be hacked. (Zeroclipboard, etc)

  @method copyFromMenu
  **/
  SequenceCanvasContextMenu.prototype.copyFromMenu = function() {
    var selection = this.selection;

    if(selection) {
      this.copyPasteHandler.fakeCopy(
        this.sequence.getSubSeq(selection[0], selection[1])
      );
    }
  };

  /**
  Paste subsequence that has previous been __copied internally__
  
  No way to paste programmatically without keyboard input

  @method pasteFromMenu
  **/
  SequenceCanvasContextMenu.prototype.pasteFromMenu = function() {
    var selection = this.selection,
        text = this.copyPasteHandler.copiedValue,
        caretPosition = this.caretPosition;

    if(text) {
      if(selection) {
        this.selection = undefined;
        this.sequence.deleteBases(
          selection[0], 
          selection[1] - selection[0] + 1
        );
      }
      this.sequence.insertBases(text, caretPosition);
      this.displayCaretAfterNextDisplay(caretPosition + text.length);
      this.focus();
    }
  };

  return SequenceCanvasContextMenu;
});