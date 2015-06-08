/**
Context Menu handling for SequenceCanvas

Hooks to the ContextMenuView attached to the SequenceCanvas (`this.contextMenu`)

@class SequenceCanvasContextMenu
@extensionfor SequenceCanvas
**/
import Gentle from 'gentle';
import _ from 'underscore';
import {assertIsDefinedAndNotNull} from '../../common/lib/testing_utils';

class SequenceCanvasContextMenu {

  _init(options = {}) {
    var contextMenu = this.contextMenu = options.contextMenu;
    var view = this.view = options.view;

    assertIsDefinedAndNotNull(view, 'options.view');
    assertIsDefinedAndNotNull(contextMenu, 'options.contextMenu');

    this.$scrollingChild.append('<div id="sequence-canvas-context-menu-outlet"></div>');
    view.setView('#sequence-canvas-context-menu-outlet', contextMenu);

    contextMenu.$assumedParent = view.$('.scrolling-parent').focus();
    contextMenu.boundTo = this.sequenceCanvas;

    this.on('caret:show', this.showContextMenuButton);
    this.on('caret:hide', this.hideContextMenuButton);
  }

  /**
  Shows button to open context menu and adds menu items to context menu view

  @method showContextMenuButton
  @params posX
  @params posY
  **/
  showContextMenuButton(event, {x, y}) {
    var menu = this.contextMenu;

    if(_.isUndefined(menu)) return;

    y += 20;

    this.contextMenuXPos = x;
    this.contextMenuYPos = y;
    menu.reset().move(x, y);

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

    _.chain(Gentle.plugins).where({type: 'sequence-canvas-context-menu'}).each((plugin) => {
      var data = plugin.data;
      if(!(!data.selectionOnly || (data.selectionOnly && this.selection))) return;
      if(!_.isUndefined(data.visible) && !data.visible()) return;
      // menu.add(data.title, data.icon, data.callback)
      menu.add(data.title, data.callback);
    });

    if(menu.menuItems.length || menu.menuIcons.length) {
      menu.show();
    } else {
      menu.hide();
    }

  }

  analyzeFragment(){
    var selection = this.selection;

    if(selection) {
      this.view.parentView().analyzeFragment(
        this.sequence.getSubSeq(selection[0], selection[1])
      );
    }
  }


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
        Math.min(this.sequence.getLength() - 1, selection[1])
      );
    }

  }
}

export default SequenceCanvasContextMenu;
