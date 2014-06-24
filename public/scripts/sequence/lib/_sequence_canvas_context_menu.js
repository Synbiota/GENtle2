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
    menu.reset().move(posX, posY - this.layoutHelpers.yOffset);

    if(!this.readOnly && this.copyPasteHandler.copiedValue) {
      menu.add('Paste', this.pasteFromMenu);
    }

    if(this.selection) {
      menu.add('Copy', this.copyFromMenu);
      if(!this.readOnly) {
        menu.add('Add annotation', 'edit', this.addAnnotationFromMenu);
      }
    }

    if(menu.menuItems.length) {
      menu.show();
    }

  };

  SequenceCanvasContextMenu.prototype.restoreContextMenuYPosition = function() {
    if(this.contextMenuXPos && this.contextMenuYPos) {
      this.contextMenu.move(
        this.contextMenuXPos,
        this.contextMenuYPos - this.layoutHelpers.yOffset
      ).show();
    }
  };

  SequenceCanvasContextMenu.prototype.hideContextMenuButton = function() {
    this.contextMenu.hide();
    this.contextMenuXPos = this.contextMenuYPos = undefined;
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
      this.displayCaret(caretPosition + text.length);
      this.focus();
    }
  };

  SequenceCanvasContextMenu.prototype.addAnnotationFromMenu = function() {
    var selection = this.selection;

    if(selection) {
      this.view.sequenceSettingsView.tabs.features.view.createOnRange(
        selection[0], 
        Math.min(this.sequence.length(), selection[1])
      );
    }

  };

  return SequenceCanvasContextMenu;
});