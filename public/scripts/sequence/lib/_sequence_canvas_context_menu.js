/**
Context Menu handling for SequenceCanvas

Hooks to the ContextMenuView attached to the SequenceCanvas (`this.contextMenu`)

@class SequenceCanvasContextMenu
@extensionfor SequenceCanvas
**/
import Gentle from 'gentle';
import RestrictionEnzymes from './restriction_enzymes';
import SequenceTranforms from './sequence_transforms'

var SequenceCanvasContextMenu;

SequenceCanvasContextMenu = function() {};

var hasRelevantRES = function(sequence) {
  debugger
  var matches = RestrictionEnzymes.getAllInSeq(sequence, {customList: ['BsaI', "NotI"]});  
  return !_.isUndefined(matches[0]);
};

// Takes the existing selection and checks for [BAS1, Stop Codons and Not1]
SequenceCanvasContextMenu.prototype.autoCorrectable = function(){
  return this.selection && hasRelevantRES(this.sequence.getSubSeq(...this.selection));
};

SequenceCanvasContextMenu.prototype.autoCorrectFor = function(selection){
  // TODO: Get correct reading frame
  var paddedSubSeq= this.sequence.getPaddedSubSeq(selection[0], selection[1], 3, 0);
  var subSeq = paddedSubSeq.subSeq;
  var getAASubSeq = function(sequence) { 
    return _.map(sequence.match(/.{1,3}/g), SequenceTranforms.codonToAALong).join();
  };

  var baseAA= getAASubSeq(subSeq);
  var trialBases= ['a', 't', 'c', 'g'];
  this._selectionAutocorrect = null;

  for (var bp=0; bp < subSeq.length; bp++){
    for (var i=0; i<trialBases.length; i++) {
      if(trialBases[i] == subSeq[bp] ){
        continue;
      }
      let newSubSeq = subSeq.substr(0, bp) + trialBases[i] + subSeq.substr(bp + 1, subSeq.length - bp);
      let newAASubSeq = getAASubSeq(newSubSeq);
      let newUnpaddedSubSeq = newSubSeq.substr(paddedSubSeq.startBase, paddedSubSeq.endBase - paddedSubSeq.startBase + 1);
      let hasRES = hasRelevantRES(newUnpaddedSubSeq);
      if (newAASubSeq === baseAA && !hasRES){
        this._selectionAutocorrect = newUnpaddedSubSeq;
        break; 
      }
    }
    if(this._selectionAutocorrect){
      break;
    }
  }
  return this._selectionAutocorrect || 'Not Found';
};

SequenceCanvasContextMenu.prototype.replaceSelection = function(){
  alert(this._selectionAutocorrect)
};

/**
Shows button to open context menu and adds menu items to context menu view

@method showContextMenuButton
@params posX
@params posY
**/
SequenceCanvasContextMenu.prototype.showContextMenuButton = function(posX, posY) {
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

      if(this.autoCorrectable()) {
        menu.add(this.autoCorrectFor(this.selection), this.replaceSelection);
      }
  
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

SequenceCanvasContextMenu.prototype.analyzeFragment = function(){
  var selection = this.selection;

  if(selection) {
    this.view.parentView().analyzeFragment(
      this.sequence.getSubSeq(selection[0], selection[1])
    );
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
    this.view.parentView().sequenceSettingsView.tabs.features.view.createOnRange(
      selection[0],
      Math.min(this.sequence.length() - 1, selection[1])
    );
  }

};

export default SequenceCanvasContextMenu;
