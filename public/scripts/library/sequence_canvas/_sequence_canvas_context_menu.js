import _ from 'underscore';
import Gentle from 'gentle'; // TODO : remove

/**
Context Menu handling for SequenceCanvas

Hooks to the ContextMenuView attached to the SequenceCanvas (`this.contextMenu`)

@class SequenceCanvasContextMenu
@extensionfor SequenceCanvas
**/

export default class _SequenceCanvasContextMenu {

  /**
  Shows button to open context menu and adds menu items to context menu view

  @method showContextMenuButton
  @params posX
  @params posY
  **/
  showContextMenuButton(posX, posY) {
    var menu = this.contextMenu;
    var _this = this;

    this.contextMenuXPos = posX;
    this.contextMenuYPos = posY;
    menu.reset().move(posX, posY);

    // Commenting out copy/paste actions for now until mobile copy/paste handling is properly solved.

    // if(!this.readOnly && this.copyPasteHandler.copiedValue) {
    //   menu.add('Paste', this.pasteFromMenu);
    // }
      if(this.selection) {
        // menu.add('Copy', this.copyFromMenu);
        menu.add('Analyze Fragment', this.analyzeFragment);

        if(!this.readOnly) {
          menu.add('Add annotation', 'edit', this.addAnnotationFromMenu);
          // menu.add('Add annotation', this.addAnnotationFromMenu);
        }
      }

    _.chain(Gentle.plugins).where({type: 'sequence-canvas-context-menu'}).each(function(plugin) {
      var data = plugin.data;
      if(!(!data.selectionOnly || (data.selectionOnly && _this.selection))) return;
      if(!_.isUndefined(data.visible) && !data.visible()) return;
      // menu.add(data.title, data.icon, data.callback)
      menu.add(data.title, data.callback);
    });


    if(menu.menuItems.length || menu.menuIcons.length) {
      menu.show();
    }


  };

  analyzeFragment(){
    var selection = this.selection;

    if(selection) {
      this.view.parentView().analyzeFragment(
        this.sequence.getSubSeq(selection[0], selection[1])
      );
    }
  };


  hideContextMenuButton() {
    this.contextMenu.hide();
    this.contextMenuXPos = this.contextMenuYPos = undefined;
  }

  /**
  Copy selected sequence **internally**.

  True copy to clipboard would need to be hacked. (Zeroclipboard, etc)

  @method copyFromMenu
  **/
  copyFromMenu() {
    var selection = this.selection;

    if(selection) {
      this.copyPasteHandler.fakeCopy(
        this.sequence.getSubSeq(selection[0], selection[1])
      );
    }
  }

  /**
  Paste subsequence that has previous been __copied internally__

  No way to paste programmatically without keyboard input

  @method pasteFromMenu
  **/
  pasteFromMenu() {
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
  }

  addAnnotationFromMenu() {
    var selection = this.selection;

    if(selection) {
      this.view.parentView().sequenceSettingsView.tabs.features.view.createOnRange(
        selection[0],
        Math.min(this.sequence.length() - 1, selection[1])
      );
    }

  }

}
